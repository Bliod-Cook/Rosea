import {useEffect, useMemo, useRef, useCallback} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss"
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";
import Konva from "konva";

// Enhanced smooth line interpolation with velocity-based smoothing
const smoothPoints = (points: number[], velocities: number[] = []): number[] => {
    if (points.length < 6) return points;
    
    const smoothed: number[] = [];
    smoothed.push(points[0], points[1]);
    
    for (let i = 2; i < points.length - 2; i += 2) {
        const x0 = points[i - 2];
        const y0 = points[i - 1];
        const x1 = points[i];
        const y1 = points[i + 1];
        const x2 = points[i + 2];
        const y2 = points[i + 3];
        
        // Adaptive smoothing based on velocity - more smoothing for slow movements
        const velocityIndex = Math.floor(i / 2);
        const velocity = velocities[velocityIndex] || 1;
        const smoothingFactor = Math.max(0.3, Math.min(1, velocity / 10)); // More smoothing for slow movements
        const segments = velocity < 5 ? 5 : 3; // More interpolation points for slow movements
        
        for (let t = 0; t < segments; t++) {
            const u = t / segments;
            const u2 = u * u;
            const u3 = u2 * u;
            
            // Enhanced Catmull-Rom with adaptive smoothing
            const baseX = 0.5 * (
                (2 * x1) +
                (-x0 + x2) * u +
                (2 * x0 - 5 * x1 + 4 * x2 - x2) * u2 +
                (-x0 + 3 * x1 - 3 * x2 + x2) * u3
            );
            
            const baseY = 0.5 * (
                (2 * y1) +
                (-y0 + y2) * u +
                (2 * y0 - 5 * y1 + 4 * y2 - y2) * u2 +
                (-y0 + 3 * y1 - 3 * y2 + y2) * u3
            );
            
            // Apply additional smoothing for slow movements
            const x = x1 + (baseX - x1) * smoothingFactor;
            const y = y1 + (baseY - y1) * smoothingFactor;
            
            smoothed.push(x, y);
        }
    }
    
    // Add the last point
    smoothed.push(points[points.length - 2], points[points.length - 1]);
    return smoothed;
};

// Adaptive throttle function that adjusts based on drawing speed
const createAdaptiveThrottle = <T extends unknown[]>(
    func: (...args: T) => void,
    minDelay: number = 8,
    maxDelay: number = 16
) => {
    let timeoutId: NodeJS.Timeout;
    let lastExecTime = 0;
    let lastPosition: {x: number, y: number} | null = null;
    const velocityHistory: number[] = [];
    
    return function (...args: T) {
        const currentTime = Date.now();
        
        // Calculate velocity if we have position data
        let velocity = 0;
        if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
            const event = args[0] as Konva.KonvaEventObject<MouseEvent | TouchEvent>;
            if (event.target && event.target.getStage) {
                const stage = event.target.getStage();
                const pos = stage?.getPointerPosition();
                if (pos && lastPosition) {
                    const dx = pos.x - lastPosition.x;
                    const dy = pos.y - lastPosition.y;
                    const dt = currentTime - lastExecTime;
                    velocity = dt > 0 ? Math.sqrt(dx * dx + dy * dy) / dt : 0;
                    
                    // Keep velocity history for smoothing
                    velocityHistory.push(velocity);
                    if (velocityHistory.length > 5) {
                        velocityHistory.shift();
                    }
                }
                if (pos) lastPosition = pos;
            }
        }
        
        // Calculate average velocity
        const avgVelocity = velocityHistory.length > 0
            ? velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length
            : velocity;
        
        // Adaptive delay: longer delay for slow movements (more smoothing)
        const adaptiveDelay = avgVelocity < 0.5
            ? maxDelay
            : Math.max(minDelay, maxDelay - (avgVelocity * 2));
        
        if (currentTime - lastExecTime > adaptiveDelay) {
            func(...args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
                lastExecTime = Date.now();
            }, adaptiveDelay - (currentTime - lastExecTime));
        }
    };
};

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
    const TauriWebviewWindow = useMemo(() => {
        return getCurrentWindow()
    }, []);

    // Performance optimization: Use refs to avoid recreating objects
    const rafId = useRef<number | null>(null);
    const pendingPoints = useRef<number[]>([]);
    const allPoints = useRef<number[]>([]);
    const velocities = useRef<number[]>([]);
    const stageRef = useRef<Konva.Stage | null>(null);
    const layerRef = useRef<Konva.Layer | null>(null);
    const lastLineRef = useRef<Konva.Line | null>(null);
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const temporalSmoother = useRef(new (class TemporalSmoother {
        private buffer: Array<{x: number, y: number, timestamp: number}> = [];
        private readonly bufferSize = 5;
        private readonly timeWindow = 50; // ms
        
        addPoint(x: number, y: number): {x: number, y: number} {
            const now = Date.now();
            this.buffer.push({x, y, timestamp: now});
            
            // Remove old points
            this.buffer = this.buffer.filter(p => now - p.timestamp <= this.timeWindow);
            
            // Keep buffer size manageable
            if (this.buffer.length > this.bufferSize) {
                this.buffer = this.buffer.slice(-this.bufferSize);
            }
            
            // Apply temporal smoothing
            if (this.buffer.length < 3) {
                return {x, y};
            }
            
            // Weighted average with more weight on recent points
            let totalWeight = 0;
            let smoothedX = 0;
            let smoothedY = 0;
            
            for (let i = 0; i < this.buffer.length; i++) {
                const point = this.buffer[i];
                const age = now - point.timestamp;
                const weight = Math.exp(-age / 20); // Exponential decay
                
                smoothedX += point.x * weight;
                smoothedY += point.y * weight;
                totalWeight += weight;
            }
            
            return {
                x: smoothedX / totalWeight,
                y: smoothedY / totalWeight
            };
        }
        
        clear() {
            this.buffer = [];
        }
    })());
    const lastUpdateTime = useRef<number>(0);
    const drawingStateRef = useRef({
        lineWidth: 3,
        color: "#d32f2f",
        eraserSize: 60,
        isErasing: false,
        isPaint: false
    });

    useEffect(() => {
        TauriWebviewWindow.setIgnoreCursorEvents(true).then();
        currentMonitor().then((monitor)=>{
            if (monitor) {
                moveWindow(Position.TopLeft).then();
                TauriWebviewWindow.setSize(monitor.size).then(()=>{});
            }
        })
    }, [TauriWebviewWindow]);

    // Enhanced drawing update function with velocity-aware smoothing
    const updateLine = useCallback(() => {
        if (lastLineRef.current && pendingPoints.current.length > 0 && layerRef.current) {
            // Add pending points to all points
            allPoints.current = allPoints.current.concat(pendingPoints.current);
            pendingPoints.current = [];
            
            // Apply enhanced smoothing with velocity information
            const smoothedPoints = smoothPoints(allPoints.current, velocities.current);
            lastLineRef.current.points(smoothedPoints);
            
            // Use batchDraw for better performance
            layerRef.current.batchDraw();
        }
    }, []);

    // Schedule update with requestAnimationFrame
    const scheduleUpdate = useCallback(() => {
        if (rafId.current) {
            cancelAnimationFrame(rafId.current);
        }
        rafId.current = requestAnimationFrame(updateLine);
    }, [updateLine]);

    useEffect(() => {
        const drawingState = drawingStateRef.current;
        const cleanupListeners: (() => void)[] = [];

        // Setup event listeners with proper cleanup
        const setupEventListeners = async () => {
            // Mode change listener
            const modeUnlisten = await TauriWebviewWindow.listen("change://canvas/mode", (event) => {
                TauriWebviewWindow.setIgnoreCursorEvents(event.payload == 1).then();
                drawingState.isErasing = event.payload == 3;
            });
            cleanupListeners.push(modeUnlisten);

            // Line width listener
            const lineWidthUnlisten = await TauriWebviewWindow.listen("change://canvas/lineWidth", (e) => {
                drawingState.lineWidth = e.payload as number;
            });
            cleanupListeners.push(lineWidthUnlisten);

            // Pen color listener
            const penColorUnlisten = await TauriWebviewWindow.listen("change://canvas/penColor", (e) => {
                drawingState.color = e.payload as string;
            });
            cleanupListeners.push(penColorUnlisten);

            // Eraser size listener
            const eraserSizeUnlisten = await TauriWebviewWindow.listen("change://canvas/eraserSize", (e) => {
                drawingState.eraserSize = e.payload as number;
            });
            cleanupListeners.push(eraserSizeUnlisten);
        };

        setupEventListeners();

        const width = screenSize.width;
        const height = screenSize.height;

        // Create stage with enhanced performance optimizations
        const stage = new Konva.Stage({
            container: "container",
            width: width,
            height: height,
            // Enhanced performance optimizations
            listening: true,
            hitGraphEnabled: false, // Disable hit detection for better performance
            imageSmoothingEnabled: true, // Enable image smoothing
        });

        const layer = new Konva.Layer({
            // Enhanced layer optimizations
            listening: true,
            hitGraphEnabled: false,
            clearBeforeDraw: true,
            imageSmoothingEnabled: true,
        });

        stage.add(layer);
        stageRef.current = stage;
        layerRef.current = layer;

        // Reset canvas listener
        TauriWebviewWindow.listen("reset://canvas/draw", () => {
            if (layerRef.current && stageRef.current) {
                layerRef.current.destroy();
                const newLayer = new Konva.Layer({
                    listening: true,
                    hitGraphEnabled: false,
                });
                stageRef.current.add(newLayer);
                layerRef.current = newLayer;
                newLayer.batchDraw();
            }
        }).then((unlisten) => {
            cleanupListeners.push(unlisten);
        });

        // Enhanced event handlers for smoother drawing
        const handlePointerDown = () => {
            drawingState.isPaint = true;
            const pos = stage.getPointerPosition();
            if (pos && layerRef.current) {
                // Reset all tracking data
                allPoints.current = [pos.x, pos.y];
                pendingPoints.current = [];
                velocities.current = [0];
                lastPos.current = pos;
                lastUpdateTime.current = Date.now();
                temporalSmoother.current.clear();
                
                lastLineRef.current = new Konva.Line({
                    stroke: drawingState.color,
                    strokeWidth: !drawingState.isErasing ? drawingState.lineWidth : drawingState.eraserSize,
                    globalCompositeOperation: !drawingState.isErasing ? 'source-over' : 'destination-out',
                    lineCap: 'round',
                    lineJoin: 'round',
                    points: [pos.x, pos.y],
                    // Enhanced performance optimizations for smoother lines
                    perfectDrawEnabled: false,
                    shadowForStrokeEnabled: false,
                    hitStrokeWidth: 0,
                    tension: 0.9, // Higher tension for smoother curves
                    bezier: false,
                    closed: false,
                });
                
                layerRef.current.add(lastLineRef.current);
                layerRef.current.batchDraw();
            }
        };

        const handlePointerUp = () => {
            drawingState.isPaint = false;
            // Cancel any pending animation frames
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            // Final update to ensure all points are rendered
            updateLine();
            // Reset all tracking data
            lastPos.current = null;
            temporalSmoother.current.clear();
            velocities.current = [];
        };

        // Enhanced mouse move handler with adaptive filtering and temporal smoothing
        const handleMouseMove = createAdaptiveThrottle((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (!drawingState.isPaint || !lastLineRef.current) {
                return;
            }

            e.evt.preventDefault();

            const rawPos = stage.getPointerPosition();
            if (rawPos && lastPos.current) {
                const currentTime = Date.now();
                const deltaTime = currentTime - lastUpdateTime.current;
                
                // Apply temporal smoothing to reduce input device noise
                const smoothedPos = temporalSmoother.current.addPoint(rawPos.x, rawPos.y);
                
                // Calculate distance and velocity
                const dx = smoothedPos.x - lastPos.current.x;
                const dy = smoothedPos.y - lastPos.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const velocity = deltaTime > 0 ? distance / deltaTime : 0;
                
                // Adaptive distance threshold based on velocity
                // For slow movements, use a larger threshold to reduce jitter
                const minDistance = velocity < 0.5 ? 3 : velocity < 2 ? 2 : 1;
                
                // Only add point if it's far enough from the last point
                if (distance > minDistance) {
                    pendingPoints.current.push(smoothedPos.x, smoothedPos.y);
                    velocities.current.push(velocity);
                    lastPos.current = smoothedPos;
                    lastUpdateTime.current = currentTime;
                    scheduleUpdate();
                }
            } else if (rawPos && !lastPos.current) {
                // First point after pointer down
                const smoothedPos = temporalSmoother.current.addPoint(rawPos.x, rawPos.y);
                pendingPoints.current.push(smoothedPos.x, smoothedPos.y);
                velocities.current.push(0);
                lastPos.current = smoothedPos;
                lastUpdateTime.current = Date.now();
                scheduleUpdate();
            }
        }, 8, 16); // Adaptive throttling between 8-16ms

        // Attach optimized event listeners
        stage.on("mousedown touchstart", handlePointerDown);
        stage.on('mouseup touchend', handlePointerUp);
        stage.on('mousemove touchmove', handleMouseMove);

        // Cleanup function
        return () => {
            // Cancel any pending animation frames
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
                rafId.current = null;
            }
            
            // Clean up all event listeners
            cleanupListeners.forEach(cleanup => cleanup());
            
            // Clean up refs
            stageRef.current = null;
            layerRef.current = null;
            lastLineRef.current = null;
            pendingPoints.current = [];
            allPoints.current = [];
            velocities.current = [];
            lastPos.current = null;
            temporalSmoother.current.clear();
            
            // Clean up Konva stage
            stage.destroy();
        };
    }, [TauriWebviewWindow, screenSize, updateLine, scheduleUpdate]);

    return <>
        <div id={"container"}></div>
    </>
}