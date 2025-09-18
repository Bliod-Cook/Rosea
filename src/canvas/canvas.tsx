import {useEffect, useMemo, useRef, useCallback} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss";
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";

type Mode = "disabled" | "pen" | "eraser";

type InputDevice = "mouse" | "touch" | "pen";

type DrawConfig = {
  mode: Mode;
  lineWidth: number; // pen width in CSS pixels
  color: string; // hex color for pen
  eraserSize: number; // eraser diameter in CSS pixels
  pressureEnabled: boolean;
};

export default function Canvas({screenSize}: {screenSize: PhysicalSize}) {
  const TauriWebviewWindow = useMemo(() => getCurrentWindow(), []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // draw scheduling + buffering
  const pointQueueRef = useRef<Array<{x: number; y: number; pressure?: number}>>([]);
  const rafPendingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const strokeWidthRef = useRef<number>(3);
  const lastStrokeEndRef = useRef<{x: number; y: number} | null>(null);

  // runtime config stored in refs to avoid re-renders during drawing
  const configRef = useRef<DrawConfig>({
    mode: "pen",
    lineWidth: 3,
    color: "#d32f2f",
    eraserSize: 60,
    pressureEnabled: true,
  });

  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{x: number; y: number} | null>(null);
  const deviceRef = useRef<InputDevice>("mouse");

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = screenSize.width;
    const height = screenSize.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d", {desynchronized: true});
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale to CSS pixels
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
    // @ts-ignore - older lib types may miss this
    ctx.imageSmoothingQuality = "high";
    ctxRef.current = ctx;
  }, [screenSize.height, screenSize.width]);

  const detectDevice = (e: PointerEvent): InputDevice => {
    if (e.pointerType === "pen") return "pen";
    if (e.pointerType === "touch") return "touch";
    return "mouse";
  };

  const currentStrokeWidth = (pressure?: number): number => {
    const cfg = configRef.current;
    if (!cfg.pressureEnabled) return cfg.lineWidth;
    const device = deviceRef.current;
    const base = device === "touch" ? 0.7 : pressure ?? 0.5;
    const mult = Math.max(0.3, Math.min(2.0, base));
    const w = cfg.lineWidth * mult;
    return Math.max(1, Math.min(20, w));
  };

  const beginStroke = (x: number, y: number, pressure?: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const cfg = configRef.current;
    isDrawingRef.current = true;
    lastPointRef.current = {x, y};
    if (cfg.mode === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = cfg.color;
      // lock width for the whole stroke to allow path batching
      strokeWidthRef.current = currentStrokeWidth(pressure);
      ctx.lineWidth = strokeWidthRef.current;
    } else if (cfg.mode === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = cfg.eraserSize;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    // clear any residual queued points from previous stroke
    pointQueueRef.current.length = 0;
    lastStrokeEndRef.current = {x, y};
  };

  // Draw only the newly added segments and then reset the path
  const flushQueuedSegments = () => {
    if (!isDrawingRef.current) return;
    const ctx = ctxRef.current;
    const cfg = configRef.current;
    const q = pointQueueRef.current;
    if (!ctx || q.length === 0) return;
    let last = lastPointRef.current;
    if (!last) return;

    // keep a short local list to draw this frame
    const local: Array<{x: number; y: number; pressure?: number}> = q.splice(0, q.length);

    // For performance on low-end devices, we keep line width constant for the stroke.
    if (cfg.mode === "pen") {
      ctx.lineWidth = strokeWidthRef.current;
    }

    // Continue from the previous frame's end to avoid gaps
    const start = lastStrokeEndRef.current || last;
    if (!start) return;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    let lastMidX = start.x;
    let lastMidY = start.y;
    for (const p of local) {
      const midX = (last.x + p.x) / 2;
      const midY = (last.y + p.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      lastMidX = midX;
      lastMidY = midY;
      last = p;
    }
    ctx.stroke();

    // Remember where we ended this frame and latest point
    lastStrokeEndRef.current = {x: lastMidX, y: lastMidY};
    lastPointRef.current = last;
  };

  const scheduleDraw = () => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    rafIdRef.current = requestAnimationFrame(() => {
      rafPendingRef.current = false;
      flushQueuedSegments();
      // If more points arrived during this frame, schedule again
      if (pointQueueRef.current.length > 0) scheduleDraw();
    });
  };

  const endStroke = () => {
    if (!isDrawingRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.closePath();
    isDrawingRef.current = false;
    lastPointRef.current = null;
    lastStrokeEndRef.current = null;
  };

  const handlePointerDown = useCallback((evt: PointerEvent) => {
    const cfg = configRef.current;
    if (cfg.mode === "disabled") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    deviceRef.current = detectDevice(evt);
    // Prevent scrolling/zooming
    evt.preventDefault();
    canvas.setPointerCapture(evt.pointerId);
    beginStroke(x, y, evt.pressure);
  }, []);

  const handlePointerMove = useCallback((evt: PointerEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const coalesced = (evt as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
    const events = coalesced && coalesced.length ? coalesced : [evt];
    for (const e of events) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointQueueRef.current.push({x, y, pressure: (e as any).pressure});
    }
    scheduleDraw();
  }, []);

  const handlePointerUp = useCallback((evt: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(evt.pointerId);
    // Flush any pending segments before ending the stroke
    flushQueuedSegments();
    // Draw the final segment from last midpoint to final point to avoid a trailing gap
    const ctx = ctxRef.current;
    const cfg = configRef.current;
    const rect = canvas.getBoundingClientRect();
    const endX = evt.clientX - rect.left;
    const endY = evt.clientY - rect.top;
    // Treat pointerup position as the final point
    lastPointRef.current = {x: endX, y: endY};
    const last = lastPointRef.current;
    const start = lastStrokeEndRef.current || last;
    if (ctx && last && start) {
      if (cfg.mode === "pen") {
        ctx.lineWidth = strokeWidthRef.current;
      }
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      lastStrokeEndRef.current = {x: last.x, y: last.y};
    }
    endStroke();
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      rafPendingRef.current = false;
    }
    pointQueueRef.current.length = 0;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const {width, height} = canvas;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.restore();
  }, []);

  useEffect(() => {
    // make the canvas window full-screen and click-through by default
    TauriWebviewWindow.setIgnoreCursorEvents(true);
    currentMonitor().then((monitor) => {
      if (monitor) {
        moveWindow(Position.TopLeft);
        TauriWebviewWindow.setSize(monitor.size);
      }
    });
  }, [TauriWebviewWindow]);

  useEffect(() => {
    resizeCanvas();
    const canvas = canvasRef.current!;
    canvas.style.touchAction = "none";

    // pointer events
    const down = (e: PointerEvent) => handlePointerDown(e);
    const move = (e: PointerEvent) => handlePointerMove(e);
    const up = (e: PointerEvent) => handlePointerUp(e);
    canvas.addEventListener("pointerdown", down, {passive: false});
    canvas.addEventListener("pointermove", move, {passive: true});
    canvas.addEventListener("pointerup", up, {passive: false});
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up as any);

    // tauri event wiring
    const unlistenMode = TauriWebviewWindow.listen("change://canvas/mode", (event) => {
      const mode = event.payload as number;
      // 1: cursor (disabled), 2: pen, 3: eraser
      TauriWebviewWindow.setIgnoreCursorEvents(mode === 1);
      let m: Mode = "pen";
      if (mode === 1) m = "disabled";
      else if (mode === 2) m = "pen";
      else if (mode === 3) m = "eraser";
      configRef.current.mode = m;
    });

    const unlistenLineWidth = TauriWebviewWindow.listen("change://canvas/lineWidth", (e) => {
      configRef.current.lineWidth = (e.payload as number) ?? 3;
    });

    const unlistenPenColor = TauriWebviewWindow.listen("change://canvas/penColor", (e) => {
      configRef.current.color = (e.payload as string) ?? "#d32f2f";
    });

    const unlistenEraserSize = TauriWebviewWindow.listen("change://canvas/eraserSize", (e) => {
      configRef.current.eraserSize = (e.payload as number) ?? 60;
    });

    const unlistenReset = TauriWebviewWindow.listen("reset://canvas/draw", clearCanvas);

    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);

    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      window.removeEventListener("resize", onResize);
      unlistenMode.then((f) => f());
      unlistenLineWidth.then((f) => f());
      unlistenPenColor.then((f) => f());
      unlistenEraserSize.then((f) => f());
      unlistenReset.then((f) => f());
    };
  }, [TauriWebviewWindow, clearCanvas, handlePointerDown, handlePointerMove, handlePointerUp, resizeCanvas]);

  return <canvas id="canvas" ref={canvasRef} />;
}
