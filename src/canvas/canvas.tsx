import {useEffect, useMemo, useRef, useCallback} from "react";
import {currentMonitor, getCurrentWindow, PhysicalSize} from "@tauri-apps/api/window";
import "./canvas.scss";
import {moveWindow, Position} from "@tauri-apps/plugin-positioner";

type Mode = "disabled" | "pen" | "eraser";

type InputDevice = "mouse" | "touch" | "pen";

type CoalescedPointerEvent = PointerEvent & {
  getCoalescedEvents?: () => PointerEvent[];
};

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
  const rectRef = useRef<DOMRect | null>(null);

  // draw scheduling + buffering
  const pointQueueRef = useRef<Array<{x: number; y: number; pressure?: number}>>([]);
  const pointQueueHeadRef = useRef(0);
  const lastQueuedPointRef = useRef<{x: number; y: number; pressure?: number} | null>(null);
  const rafPendingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const strokeWidthRef = useRef<number>(3);
  const lastStrokeEndRef = useRef<{x: number; y: number} | null>(null);

  // workers related
  const inputWorkerRef = useRef<Worker | null>(null);
  const drawWorkerRef = useRef<Worker | null>(null);
  const useWorkersRef = useRef(false);
  const workerMoveBufferRef = useRef<Map<number, Array<{x: number; y: number; pressure?: number}>>>(new Map());
  const workerSendRafPendingRef = useRef(false);
  const workerSendRafIdRef = useRef<number | null>(null);

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

  const updateRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    rectRef.current = rect;
    return rect;
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = screenSize.width;
    const height = screenSize.height;
    // Always update CSS size for display
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // If using OffscreenCanvas (worker mode), only notify worker and do not
    // touch the main-thread 2D context or backing store sizes here.
    if (useWorkersRef.current && drawWorkerRef.current) {
      drawWorkerRef.current.postMessage({
        type: "resize",
        cssWidth: width,
        cssHeight: height,
        dpr,
      });
      updateRect();
      return;
    }

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext("2d", {desynchronized: true});
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale to CSS pixels
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.imageSmoothingEnabled = true;
    try {
      ctx.imageSmoothingQuality = "high";
    } catch (err) {
      void err;
    }
    ctxRef.current = ctx;
    updateRect();
  }, [screenSize.height, screenSize.width, updateRect]);

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
    pointQueueHeadRef.current = 0;
    lastQueuedPointRef.current = {x, y, pressure};
    lastStrokeEndRef.current = {x, y};
  };

  // Draw only the newly added segments and then reset the path
  const flushQueuedSegments = (forceAll = false) => {
    if (!isDrawingRef.current) return;
    const ctx = ctxRef.current;
    const cfg = configRef.current;
    const q = pointQueueRef.current;
    if (!ctx || q.length === 0) return;
    let head = pointQueueHeadRef.current;
    if (head >= q.length) {
      q.length = 0;
      pointQueueHeadRef.current = 0;
      return;
    }
    let last = lastPointRef.current;
    if (!last) return;

    // For performance on low-end devices, we keep line width constant for the stroke.
    if (cfg.mode === "pen") {
      ctx.lineWidth = strokeWidthRef.current;
    }

    // Continue from the previous frame's end to avoid gaps
    const start = lastStrokeEndRef.current || last;
    if (!start) return;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    const isTouch = deviceRef.current === "touch";
    const maxSeg = forceAll ? Number.POSITIVE_INFINITY : (isTouch ? 256 : 64);

    let processed = 0;
    if (isTouch) {
      let endX = start.x;
      let endY = start.y;
      while (head < q.length && processed < maxSeg) {
        const p = q[head++]!;
        ctx.lineTo(p.x, p.y);
        endX = p.x;
        endY = p.y;
        last = p;
        processed++;
      }
      ctx.stroke();
      lastStrokeEndRef.current = {x: endX, y: endY};
      lastPointRef.current = last;
    } else {
      let lastMidX = start.x;
      let lastMidY = start.y;
      while (head < q.length && processed < maxSeg) {
        const p = q[head++]!;
        const midX = (last.x + p.x) / 2;
        const midY = (last.y + p.y) / 2;
        ctx.quadraticCurveTo(last.x, last.y, midX, midY);
        lastMidX = midX;
        lastMidY = midY;
        last = p;
        processed++;
      }
      ctx.stroke();
      // Remember where we ended this frame and latest point
      lastStrokeEndRef.current = {x: lastMidX, y: lastMidY};
      lastPointRef.current = last;
    }

    pointQueueHeadRef.current = head;
    if (head >= q.length) {
      q.length = 0;
      pointQueueHeadRef.current = 0;
    } else if (head > 2048) {
      q.splice(0, head);
      pointQueueHeadRef.current = 0;
    }
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
    lastQueuedPointRef.current = null;
    pointQueueRef.current.length = 0;
    pointQueueHeadRef.current = 0;
  };

  const flushWorkerMoveBuffer = useCallback(() => {
    if (!useWorkersRef.current) return;
    const inputWorker = inputWorkerRef.current;
    if (!inputWorker) return;
    for (const [id, points] of workerMoveBufferRef.current) {
      if (points.length) {
        inputWorker.postMessage({ type: "move", id, points });
      }
    }
    workerMoveBufferRef.current.clear();
  }, []);

  const scheduleWorkerSend = () => {
    if (workerSendRafPendingRef.current) return;
    workerSendRafPendingRef.current = true;
    workerSendRafIdRef.current = requestAnimationFrame(() => {
      workerSendRafPendingRef.current = false;
      flushWorkerMoveBuffer();
    });
  };

  const handlePointerDown = useCallback((evt: PointerEvent) => {
    const cfg = configRef.current;
    if (cfg.mode === "disabled") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = updateRect();
    if (!rect) return;
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    deviceRef.current = detectDevice(evt);
    // Prevent scrolling/zooming
    evt.preventDefault();
    canvas.setPointerCapture(evt.pointerId);
    if (useWorkersRef.current && inputWorkerRef.current) {
      isDrawingRef.current = true;
      workerMoveBufferRef.current.delete(evt.pointerId);
      inputWorkerRef.current.postMessage({
        type: "down",
        id: evt.pointerId,
        point: { x, y, pressure: evt.pressure },
      });
      // Update device to workers as hint for optimizations
      inputWorkerRef.current.postMessage({ type: "config", config: { device: deviceRef.current } });
      drawWorkerRef.current?.postMessage({ type: "config", config: { device: deviceRef.current } });
    } else {
      beginStroke(x, y, evt.pressure);
    }
  }, []);

  const handlePointerMove = useCallback((evt: PointerEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = rectRef.current ?? updateRect();
    if (!rect) return;

    const coalesced = (evt as CoalescedPointerEvent).getCoalescedEvents?.();
    const events = coalesced && coalesced.length ? coalesced : [evt];
    if (useWorkersRef.current && inputWorkerRef.current) {
      const buf = workerMoveBufferRef.current;
      const existing = buf.get(evt.pointerId);
      if (existing) {
        for (const e of events) {
          existing.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure,
          });
        }
      } else {
        const pts: Array<{x: number; y: number; pressure?: number}> = [];
        for (const e of events) {
          pts.push({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
            pressure: e.pressure,
          });
        }
        buf.set(evt.pointerId, pts);
      }
      scheduleWorkerSend();
    } else {
      const cfg = configRef.current;
      const activeWidth = cfg.mode === "eraser" ? cfg.eraserSize : strokeWidthRef.current;
      const minDist = Math.max(0.5, activeWidth * 0.4);
      const minDist2 = minDist * minDist;
      let lastQueued = lastQueuedPointRef.current;
      for (const e of events) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const p = {x, y, pressure: e.pressure};
        if (!lastQueued) {
          pointQueueRef.current.push(p);
          lastQueued = p;
          continue;
        }
        const dx = p.x - lastQueued.x;
        const dy = p.y - lastQueued.y;
        if (dx * dx + dy * dy >= minDist2) {
          pointQueueRef.current.push(p);
          lastQueued = p;
        }
      }
      lastQueuedPointRef.current = lastQueued;
      scheduleDraw();
    }
  }, []);

  const handlePointerUp = useCallback((evt: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.releasePointerCapture(evt.pointerId);
    if (useWorkersRef.current && inputWorkerRef.current) {
      if (workerSendRafIdRef.current) {
        cancelAnimationFrame(workerSendRafIdRef.current);
        workerSendRafIdRef.current = null;
        workerSendRafPendingRef.current = false;
      }
      flushWorkerMoveBuffer();
      const rect = rectRef.current ?? updateRect();
      if (!rect) return;
      const endX = evt.clientX - rect.left;
      const endY = evt.clientY - rect.top;
      inputWorkerRef.current.postMessage({
        type: "up",
        id: evt.pointerId,
        point: { x: endX, y: endY, pressure: evt.pressure },
      });
      isDrawingRef.current = false;
    } else {
      // Flush any pending segments before ending the stroke
      flushQueuedSegments(true);
      // Draw the final segment from last midpoint to final point to avoid a trailing gap
      const ctx = ctxRef.current;
      const cfg = configRef.current;
      const rect = rectRef.current ?? updateRect();
      if (!rect) return;
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
      pointQueueHeadRef.current = 0;
    }
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

    // Try Workers + OffscreenCanvas for rendering off the main thread
    try {
      const canTransferToOffscreen = (
        c: HTMLCanvasElement,
      ): c is HTMLCanvasElement & { transferControlToOffscreen: () => OffscreenCanvas } =>
        typeof (c as { transferControlToOffscreen?: unknown }).transferControlToOffscreen === "function";

      if (canTransferToOffscreen(canvas)) {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        // Transfer control of the canvas to an OffscreenCanvas
        const offscreen = canvas.transferControlToOffscreen();
        const drawWorker = new Worker(new URL('./workers/drawWorker.ts', import.meta.url), { type: 'module' });
        const inputWorker = new Worker(new URL('./workers/inputWorker.ts', import.meta.url), { type: 'module' });
        const channel = new MessageChannel();
        inputWorker.postMessage({ type: 'connect' }, [channel.port1]);
        drawWorker.postMessage({ type: 'connect' }, [channel.port2]);
        drawWorker.postMessage({
          type: 'init',
          canvas: offscreen,
          cssWidth: screenSize.width,
          cssHeight: screenSize.height,
          dpr,
          config: {
            mode: configRef.current.mode,
            lineWidth: configRef.current.lineWidth,
            color: configRef.current.color,
            eraserSize: configRef.current.eraserSize,
            pressureEnabled: configRef.current.pressureEnabled,
            device: deviceRef.current,
          },
        }, [offscreen]);
        inputWorkerRef.current = inputWorker;
        drawWorkerRef.current = drawWorker;
        useWorkersRef.current = true;
      }
    } catch {
      useWorkersRef.current = false;
    }

    // pointer events
    const down = (e: PointerEvent) => handlePointerDown(e);
    const move = (e: PointerEvent) => handlePointerMove(e);
    const up = (e: PointerEvent) => handlePointerUp(e);
    canvas.addEventListener("pointerdown", down, {passive: false});
    canvas.addEventListener("pointermove", move, {passive: true});
    canvas.addEventListener("pointerup", up, {passive: false});
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", up);

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
      if (useWorkersRef.current && drawWorkerRef.current) {
        drawWorkerRef.current.postMessage({ type: 'config', config: { mode: m } });
      }
    });

    const unlistenLineWidth = TauriWebviewWindow.listen("change://canvas/lineWidth", (e) => {
      configRef.current.lineWidth = (e.payload as number) ?? 3;
      if (useWorkersRef.current) {
        inputWorkerRef.current?.postMessage({ type: 'config', config: { lineWidth: configRef.current.lineWidth } });
        drawWorkerRef.current?.postMessage({ type: 'config', config: { lineWidth: configRef.current.lineWidth } });
      }
    });

    const unlistenPenColor = TauriWebviewWindow.listen("change://canvas/penColor", (e) => {
      configRef.current.color = (e.payload as string) ?? "#d32f2f";
      if (useWorkersRef.current && drawWorkerRef.current) {
        drawWorkerRef.current.postMessage({ type: 'config', config: { color: configRef.current.color } });
      }
    });

    const unlistenEraserSize = TauriWebviewWindow.listen("change://canvas/eraserSize", (e) => {
      configRef.current.eraserSize = (e.payload as number) ?? 60;
      if (useWorkersRef.current && drawWorkerRef.current) {
        drawWorkerRef.current.postMessage({ type: 'config', config: { eraserSize: configRef.current.eraserSize } });
      }
    });

    const unlistenReset = TauriWebviewWindow.listen("reset://canvas/draw", () => {
      if (useWorkersRef.current && drawWorkerRef.current) {
        drawWorkerRef.current.postMessage({ type: 'clear' });
      } else {
        clearCanvas();
      }
    });

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
      // terminate workers
      try { inputWorkerRef.current?.terminate(); } catch (err) { void err; }
      try { drawWorkerRef.current?.terminate(); } catch (err) { void err; }
      if (workerSendRafIdRef.current) {
        cancelAnimationFrame(workerSendRafIdRef.current);
        workerSendRafIdRef.current = null;
        workerSendRafPendingRef.current = false;
      }
      workerMoveBufferRef.current.clear();
    };
  }, [TauriWebviewWindow, clearCanvas, handlePointerDown, handlePointerMove, handlePointerUp, resizeCanvas]);

  return <canvas id="canvas" ref={canvasRef} />;
}
