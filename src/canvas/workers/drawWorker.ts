// Draw worker: receives an OffscreenCanvas and draws at a fixed cadence (60fps)
// based on points forwarded by the input worker. Optimized for low-end CPUs.

type Mode = 'disabled' | 'pen' | 'eraser';

type DrawConfig = {
  mode: Mode;
  lineWidth: number;
  color: string;
  eraserSize: number;
  pressureEnabled: boolean;
  device: 'mouse' | 'touch' | 'pen';
};

type Point = { x: number; y: number; pressure?: number; t?: number };

type Msg =
  | { type: 'connect' }
  | {
      type: 'init';
      canvas: OffscreenCanvas;
      cssWidth: number;
      cssHeight: number;
      dpr: number;
      config: DrawConfig;
    }
  | { type: 'config'; config: Partial<DrawConfig> }
  | { type: 'resize'; cssWidth: number; cssHeight: number; dpr: number }
  | { type: 'clear' }
  | { type: 'begin'; id: number; point: Point }
  | { type: 'points'; id: number; points: Point[] }
  | { type: 'end'; id: number };

let ctx: OffscreenCanvasRenderingContext2D | null = null;
let offscreen: OffscreenCanvas | null = null;
let cfg: DrawConfig = {
  mode: 'pen',
  lineWidth: 3,
  color: '#d32f2f',
  eraserSize: 60,
  pressureEnabled: true,
  device: 'mouse',
};

let isDrawing = false;
let activePointer: number | null = null;
let lastPoint: Point | null = null;
let strokeWidthLocked = 3;
const queue: Point[] = [];
let queueHead = 0;
let lastFrameEnd: { x: number; y: number } | null = null;
let dpr = 1;

const FPS = 60;
const FRAME_MS = Math.round(1000 / FPS);
let timerId: number | null = null;

function setupCtx() {
  if (!offscreen) return;
  ctx = offscreen.getContext('2d', { desynchronized: true });
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.imageSmoothingEnabled = true;
  try {
    ctx.imageSmoothingQuality = 'high';
  } catch (err) {
    void err;
  }
}

function applySize(cssWidth: number, cssHeight: number, newDpr: number) {
  dpr = Math.max(1, newDpr || 1);
  if (!offscreen) return;
  offscreen.width = Math.floor(cssWidth * dpr);
  offscreen.height = Math.floor(cssHeight * dpr);
  setupCtx();
}

function currentStrokeWidth(pressure?: number): number {
  if (!cfg.pressureEnabled) return cfg.lineWidth;
  const base = cfg.device === 'touch' ? 0.7 : pressure ?? 0.5;
  const mult = Math.max(0.3, Math.min(2.0, base));
  const w = cfg.lineWidth * mult;
  return Math.max(1, Math.min(20, w));
}

function beginStroke(p: Point) {
  if (!ctx) return;
  isDrawing = true;
  lastPoint = p;
  if (cfg.mode === 'pen') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = cfg.color;
    strokeWidthLocked = currentStrokeWidth(p.pressure);
    ctx.lineWidth = strokeWidthLocked;
  } else if (cfg.mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    ctx.lineWidth = cfg.eraserSize;
  }
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  lastFrameEnd = { x: p.x, y: p.y };
  queue.length = 0;
  queueHead = 0;
}

function flush(forceAll = false) {
  if (!isDrawing || !ctx || queue.length === 0 || !lastPoint) return;
  if (queueHead >= queue.length) return;
  // Continue from the last frame end
  const start = lastFrameEnd || lastPoint;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);

  if (cfg.mode === 'pen') ctx.lineWidth = strokeWidthLocked;

  let last = lastPoint;
  let endX = start.x;
  let endY = start.y;

  const hardMax = forceAll ? Number.POSITIVE_INFINITY : (cfg.device === 'touch' ? 2048 : 256);
  const budgetMs = forceAll ? Number.POSITIVE_INFINITY : (cfg.device === 'touch' ? 4 : 3);
  const t0 = performance.now();

  let processed = 0;
  while (queueHead < queue.length && processed < hardMax) {
    const p = queue[queueHead++]!;
    // Use lightweight lineTo for touch to reduce CPU cost
    if (cfg.device === 'touch') {
      ctx.lineTo(p.x, p.y);
      endX = p.x;
      endY = p.y;
      last = p;
    } else {
      // Pen: keep curve smoothness
      const midX = (last.x + p.x) / 2;
      const midY = (last.y + p.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      endX = midX;
      endY = midY;
      last = p;
    }
    processed++;
    if (!forceAll && (processed & 15) === 0 && performance.now() - t0 > budgetMs) break;
  }
  ctx.stroke();
  lastFrameEnd = { x: endX, y: endY };
  lastPoint = last;

  if (queueHead >= queue.length) {
    queue.length = 0;
    queueHead = 0;
  } else if (queueHead > 2048) {
    queue.splice(0, queueHead);
    queueHead = 0;
  }
}

function endStroke() {
  if (!ctx) return;
  flush(true);
  ctx.closePath();
  isDrawing = false;
  lastPoint = null;
  lastFrameEnd = null;
  queue.length = 0;
  queueHead = 0;
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function ensureLoop(delay = 0) {
  if (timerId) return;
  timerId = setTimeout(() => {
    timerId = null;
    const t0 = performance.now();
    flush();
    const elapsed = performance.now() - t0;
    if (isDrawing && queueHead < queue.length) {
      ensureLoop(Math.max(0, FRAME_MS - elapsed));
    }
  }, delay);
}

self.onmessage = (ev: MessageEvent<Msg>) => {
  const m = ev.data;
  switch (m.type) {
    case 'connect':
      // no-op; kept for symmetry
      break;
    case 'init': {
      offscreen = m.canvas;
      cfg = { ...cfg, ...m.config };
      applySize(m.cssWidth, m.cssHeight, m.dpr);
      break;
    }
    case 'config': {
      cfg = { ...cfg, ...m.config };
      break;
    }
    case 'resize': {
      applySize(m.cssWidth, m.cssHeight, m.dpr);
      break;
    }
    case 'clear': {
      if (!ctx || !offscreen) break;
      const { width, height } = offscreen;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.restore();
      break;
    }
    case 'begin': {
      activePointer = m.id;
      beginStroke(m.point);
      break;
    }
    case 'points': {
      if (m.id !== activePointer) break;
      // append to queue
      for (const p of m.points) queue.push(p);
      ensureLoop();
      break;
    }
    case 'end': {
      if (m.id !== activePointer) break;
      endStroke();
      activePointer = null;
      break;
    }
  }
};
