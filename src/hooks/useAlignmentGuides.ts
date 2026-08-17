import { useMemo } from 'react';
import type { BoardObject } from '../types/objects';

export interface GuideLineData {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'h' | 'v'; // horizontal or vertical
}

const SNAP_THRESHOLD = 6; // pixels in canvas units

function getBounds(obj: BoardObject) {
  const o = obj as any;
  if (obj.type === 'rectangle' || obj.type === 'image' || obj.type === 'table' || obj.type === 'video' || obj.type === 'equation') {
    const w = (o.width || 0) * (obj.scaleX || 1);
    const h = (o.height || 0) * (obj.scaleY || 1);
    return { left: obj.x, top: obj.y, right: obj.x + w, bottom: obj.y + h, cx: obj.x + w / 2, cy: obj.y + h / 2, w, h };
  }
  if (obj.type === 'circle') {
    const r = (o.radius || 0) * (obj.scaleX || 1);
    return { left: obj.x - r, top: obj.y - r, right: obj.x + r, bottom: obj.y + r, cx: obj.x, cy: obj.y, w: r * 2, h: r * 2 };
  }
  if (obj.type === 'text') {
    const w = (o.width || 100) * (obj.scaleX || 1);
    const h = (o.fontSize || 16) * (obj.scaleY || 1);
    return { left: obj.x, top: obj.y, right: obj.x + w, bottom: obj.y + h, cx: obj.x + w / 2, cy: obj.y + h / 2, w, h };
  }
  // line / unknown — use point
  return { left: obj.x, top: obj.y, right: obj.x, bottom: obj.y, cx: obj.x, cy: obj.y, w: 0, h: 0 };
}

interface AlignmentResult {
  guides: GuideLineData[];
  snapDeltaX: number;
  snapDeltaY: number;
}

export function computeAlignmentGuides(
  draggingIds: string[],
  objectsById: Record<string, BoardObject>,
  objectIds: string[],
  /** canvas coordinate range for guide line extent */
  viewBounds: { left: number; top: number; right: number; bottom: number }
): AlignmentResult {
  const guides: GuideLineData[] = [];
  let snapDeltaX = 0;
  let snapDeltaY = 0;
  let bestX = Infinity;
  let bestY = Infinity;

  if (draggingIds.length === 0) return { guides, snapDeltaX, snapDeltaY };

  // Compute combined bounding box of dragging objects
  let dLeft = Infinity, dTop = Infinity, dRight = -Infinity, dBottom = -Infinity;
  for (const id of draggingIds) {
    const obj = objectsById[id];
    if (!obj) continue;
    const b = getBounds(obj);
    dLeft = Math.min(dLeft, b.left);
    dTop = Math.min(dTop, b.top);
    dRight = Math.max(dRight, b.right);
    dBottom = Math.max(dBottom, b.bottom);
  }
  const dCX = (dLeft + dRight) / 2;
  const dCY = (dTop + dBottom) / 2;

  // Static objects to compare against
  const staticIds = objectIds.filter(id => !draggingIds.includes(id));

  for (const id of staticIds) {
    const obj = objectsById[id];
    if (!obj || !obj.visible) continue;
    const b = getBounds(obj);

    const vExt = { y1: Math.min(viewBounds.top, dTop, b.top) - 50, y2: Math.max(viewBounds.bottom, dBottom, b.bottom) + 50 };
    const hExt = { x1: Math.min(viewBounds.left, dLeft, b.left) - 50, x2: Math.max(viewBounds.right, dRight, b.right) + 50 };

    // --- Vertical guides (X-axis alignment) ---
    const xPairs = [
      // dragging left edge to static left edge
      { dVal: dLeft, sVal: b.left, key: 'left-left' },
      // dragging right edge to static right edge
      { dVal: dRight, sVal: b.right, key: 'right-right' },
      // dragging center to static center
      { dVal: dCX, sVal: b.cx, key: 'cx-cx' },
      // dragging left to static right
      { dVal: dLeft, sVal: b.right, key: 'left-right' },
      // dragging right to static left
      { dVal: dRight, sVal: b.left, key: 'right-left' },
    ];

    for (const { dVal, sVal, key } of xPairs) {
      const diff = Math.abs(dVal - sVal);
      if (diff < SNAP_THRESHOLD && diff < bestX) {
        bestX = diff;
        snapDeltaX = sVal - dVal;
        // Remove previous vertical guides
        guides.splice(0, guides.length, ...guides.filter(g => g.type !== 'v'));
        guides.push({ id: `vg-${id}-${key}`, x1: sVal, y1: vExt.y1, x2: sVal, y2: vExt.y2, type: 'v' });
      }
    }

    // --- Horizontal guides (Y-axis alignment) ---
    const yPairs = [
      { dVal: dTop, sVal: b.top, key: 'top-top' },
      { dVal: dBottom, sVal: b.bottom, key: 'bot-bot' },
      { dVal: dCY, sVal: b.cy, key: 'cy-cy' },
      { dVal: dTop, sVal: b.bottom, key: 'top-bot' },
      { dVal: dBottom, sVal: b.top, key: 'bot-top' },
    ];

    for (const { dVal, sVal, key } of yPairs) {
      const diff = Math.abs(dVal - sVal);
      if (diff < SNAP_THRESHOLD && diff < bestY) {
        bestY = diff;
        snapDeltaY = sVal - dVal;
        guides.splice(0, guides.length, ...guides.filter(g => g.type !== 'h'));
        guides.push({ id: `hg-${id}-${key}`, x1: hExt.x1, y1: sVal, x2: hExt.x2, y2: sVal, type: 'h' });
      }
    }
  }

  return { guides, snapDeltaX, snapDeltaY };
}

// Separate hook to make it easy to use in the canvas
export function useAlignmentGuides(
  draggingIds: string[],
  objectsById: Record<string, BoardObject>,
  objectIds: string[],
  camera: { x: number; y: number; scale: number },
  stageWidth: number,
  stageHeight: number
): AlignmentResult {
  return useMemo(() => {
    const viewBounds = {
      left: -camera.x / camera.scale,
      top: -camera.y / camera.scale,
      right: (stageWidth - camera.x) / camera.scale,
      bottom: (stageHeight - camera.y) / camera.scale,
    };
    return computeAlignmentGuides(draggingIds, objectsById, objectIds, viewBounds);
  }, [draggingIds, objectsById, objectIds, camera, stageWidth, stageHeight]);
}
