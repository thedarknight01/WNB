import { useRef, useEffect } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';

interface Props {
  camera: { x: number; y: number; scale: number };
  stageWidth: number;
  stageHeight: number;
}

const RULER_SIZE = 20; // px width/height of each ruler bar

function drawHorizontalRuler(
  canvas: HTMLCanvasElement,
  camera: { x: number; y: number; scale: number },
  isDark: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
  ctx.fillRect(0, 0, w, h);

  // Border bottom
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h - 0.5);
  ctx.lineTo(w, h - 0.5);
  ctx.stroke();

  // Ticks
  const scale = camera.scale;
  const offsetX = camera.x;

  // Pick a nice step size based on zoom
  const rawStep = 50 / scale;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 5, 10];
  let step = magnitude;
  for (const ns of niceSteps) {
    if (magnitude * ns >= rawStep) { step = magnitude * ns; break; }
  }
  if (step < 1) step = 1;

  const startWorld = -offsetX / scale;
  const endWorld = (w - offsetX) / scale;
  const firstTick = Math.floor(startWorld / step) * step;

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = `9px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';

  for (let val = firstTick; val <= endWorld; val += step) {
    const screenX = val * scale + offsetX;
    if (screenX < RULER_SIZE) continue;

    const isMajor = Math.abs(val % (step * 5)) < 0.01 || step >= 100;
    const tickH = isMajor ? h * 0.5 : h * 0.3;

    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(screenX + 0.5, h);
    ctx.lineTo(screenX + 0.5, h - tickH);
    ctx.stroke();

    if (isMajor) {
      const label = Math.round(val).toString();
      ctx.fillText(label, screenX + 2, 9);
    }
  }
}

function drawVerticalRuler(
  canvas: HTMLCanvasElement,
  camera: { x: number; y: number; scale: number },
  isDark: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
  ctx.fillRect(0, 0, w, h);

  // Border right
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w - 0.5, 0);
  ctx.lineTo(w - 0.5, h);
  ctx.stroke();

  const scale = camera.scale;
  const offsetY = camera.y;

  const rawStep = 50 / scale;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceSteps = [1, 2, 5, 10];
  let step = magnitude;
  for (const ns of niceSteps) {
    if (magnitude * ns >= rawStep) { step = magnitude * ns; break; }
  }
  if (step < 1) step = 1;

  const startWorld = -offsetY / scale;
  const endWorld = (h - offsetY) / scale;
  const firstTick = Math.floor(startWorld / step) * step;

  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.font = `9px Inter, system-ui, sans-serif`;
  ctx.textBaseline = 'top';

  for (let val = firstTick; val <= endWorld; val += step) {
    const screenY = val * scale + offsetY;
    if (screenY < RULER_SIZE) continue;

    const isMajor = Math.abs(val % (step * 5)) < 0.01 || step >= 100;
    const tickW = isMajor ? w * 0.5 : w * 0.3;

    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(w - tickW, screenY + 0.5);
    ctx.lineTo(w, screenY + 0.5);
    ctx.stroke();

    if (isMajor) {
      ctx.save();
      ctx.translate(w - 6, screenY + 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(val).toString(), 0, 0);
      ctx.restore();
    }
  }
}

export const CanvasRuler = ({ camera, stageWidth, stageHeight }: Props) => {
  const hRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

  useEffect(() => {
    if (hRef.current) drawHorizontalRuler(hRef.current, camera, isDark);
  }, [camera, isDark, stageWidth]);

  useEffect(() => {
    if (vRef.current) drawVerticalRuler(vRef.current, camera, isDark);
  }, [camera, isDark, stageHeight]);

  const borderColor = isDark ? '#334155' : '#cbd5e1';
  const bgColor = isDark ? '#0f172a' : '#f1f5f9';

  return (
    <>
      {/* Top-left corner square */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          backgroundColor: bgColor,
          borderRight: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          zIndex: 31,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '8px',
          color: isDark ? '#475569' : '#94a3b8',
          userSelect: 'none',
          cursor: 'default',
        }}
      >
        ✛
      </div>

      {/* Horizontal ruler (top) */}
      <canvas
        ref={hRef}
        width={stageWidth}
        height={RULER_SIZE}
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          width: stageWidth - RULER_SIZE,
          height: RULER_SIZE,
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />

      {/* Vertical ruler (left) */}
      <canvas
        ref={vRef}
        width={RULER_SIZE}
        height={stageHeight}
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          width: RULER_SIZE,
          height: stageHeight - RULER_SIZE,
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export { RULER_SIZE };
