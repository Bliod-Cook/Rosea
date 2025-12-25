// Input worker: filters/coalesces touch/pen points and forwards to draw worker
// via a MessagePort provided by the main thread.

export type InputConfig = {
  lineWidth: number;
  pressureEnabled: boolean;
  device: 'mouse' | 'touch' | 'pen';
};

type Point = { x: number; y: number; pressure?: number; t?: number };

type PointerState = {
  isDrawing: boolean;
  lastPoint: Point | null;
};

const pointerStates = new Map<number, PointerState>();
let drawPort: MessagePort | null = null;
let cfg: InputConfig = { lineWidth: 3, pressureEnabled: true, device: 'mouse' };

const minDist = () => Math.max(0.5, cfg.lineWidth * 0.4);

function filterPoints(pid: number, pts: Point[]): Point[] {
  if (!pts.length) return pts;
  const st = pointerStates.get(pid) ?? { isDrawing: false, lastPoint: null };
  const out: Point[] = [];
  const d2 = minDist() * minDist();
  let last = st.lastPoint;
  for (const p of pts) {
    if (!last) {
      out.push(p);
      last = p;
    } else {
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      if (dx * dx + dy * dy >= d2) {
        out.push(p);
        last = p;
      }
    }
  }
  st.lastPoint = last ?? st.lastPoint;
  pointerStates.set(pid, st);
  return out;
}

// Types of messages from main thread
type Msg =
  | { type: 'connect' } // MessagePort is transferred
  | { type: 'config'; config: Partial<InputConfig> }
  | { type: 'down'; id: number; point: Point }
  | { type: 'move'; id: number; points: Point[] }
  | { type: 'up'; id: number; point: Point };

// eslint-disable-next-line no-restricted-globals
self.onmessage = (ev: MessageEvent<Msg>) => {
  const data = ev.data;
  if (data.type === 'connect') {
    // First transferable should be a MessagePort
    const [port] = (ev as any).ports as MessagePort[];
    drawPort = port;
    return;
  }
  if (data.type === 'config') {
    cfg = { ...cfg, ...data.config };
    return;
  }
  if (!drawPort) return;

  if (data.type === 'down') {
    pointerStates.set(data.id, { isDrawing: true, lastPoint: data.point });
    drawPort.postMessage({ type: 'begin', id: data.id, point: data.point });
    return;
  }

  if (data.type === 'move') {
    const filtered = filterPoints(data.id, data.points);
    if (filtered.length) {
      drawPort.postMessage({ type: 'points', id: data.id, points: filtered });
    }
    return;
  }

  if (data.type === 'up') {
    const st = pointerStates.get(data.id) ?? { isDrawing: false, lastPoint: null };
    pointerStates.delete(data.id);
    // Ensure final point is sent so draw can close the stroke
    drawPort.postMessage({ type: 'points', id: data.id, points: [data.point] });
    drawPort.postMessage({ type: 'end', id: data.id });
    return;
  }
};

