import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { Stage, Layer, Rect, Transformer, Text, Line, Circle } from 'react-konva';
import React from 'react'; import { useBoardStore, BoardContext } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { BackgroundGrid } from './BackgroundGrid';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { ShapeRenderer } from './ShapeRenderer';
import { TextInputOverlay } from './TextInputOverlay';
import { HtmlOverlays } from './HtmlOverlays';
import type { LineData, RectangleData, CircleData, TextData } from '../../types/objects';
import { ContextMenu } from '../panels/ContextMenu';
import { CanvasRuler, RULER_SIZE } from './CanvasRuler';
import { computeAlignmentGuides } from '../../hooks/useAlignmentGuides';
import { useAppStore } from '../../core/store/useAppStore';


const CanvasLabels = () => {
  const objectsById = useBoardStore(s => s.objectsById);
  const objectIds = useBoardStore(s => s.objectIds);
  const { labelFontFamily, labelFontSize, labelColor, labelFontStyle } = useSettingsStore();
  const objects = objectIds.map((id: any) => objectsById[id]).filter(Boolean);
  const groupedItems = new Map<string, any[]>();
  objects.forEach((object: any) => {
    if (object.parentId && object.groupLabel) {
      const items = groupedItems.get(object.parentId) || [];
      items.push(object);
      groupedItems.set(object.parentId, items);
    }
  });
  const labelEntries = [
    ...Array.from(groupedItems.entries()).map(([id, items]) => ({ id, label: items[0].groupLabel, targets: items })),
    ...objects.filter((object: any) => object.label && !object.parentId).map((object: any) => ({ id: object.id, label: object.label, targets: [object] })),
  ];

  return (
    <>
      {labelEntries.map(({ id, label: labelText, targets }) => {
        if (!labelText) return null;

        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // PERFECT BOUNDING BOX MATH
        targets.forEach((o: any) => {
          let oMinX = o.x, oMaxX = o.x, oMaxY = o.y;

          if (o.type === 'rectangle' || o.type === 'image') {
            oMaxX = o.x + ((o as any).width * o.scaleX);
            oMaxY = o.y + ((o as any).height * o.scaleY);
          }
          else if (o.type === 'circle') {
            // Circles are drawn from the center, so we add/subtract the radius
            const r = (o as any).radius * o.scaleX;
            oMinX = o.x - r;
            oMaxX = o.x + r;
            oMaxY = o.y + r;
          }
          else if (o.type === 'text') {
            oMaxX = o.x + ((o as any).width * o.scaleX);
            oMaxY = o.y + ((o as any).fontSize * o.scaleY);
          }
          else if (o.type === 'line' || o.type === 'arrow') {
            // Lines are made of multiple point coordinates
            const line = o as any;
            const xs = line.points.filter((_: any, i: number) => i % 2 === 0).map((p: number) => p + o.x);
            const ys = line.points.filter((_: any, i: number) => i % 2 !== 0).map((p: number) => p + o.y);
            oMinX = Math.min(...xs);
            oMaxX = Math.max(...xs);
            oMaxY = Math.max(...ys);
          }

          minX = Math.min(minX, oMinX);
          maxX = Math.max(maxX, oMaxX);
          maxY = Math.max(maxY, oMaxY); // Find the absolute lowest point of the group
        });

        const centerX = (minX + maxX) / 2;

        return (
          <Text
            key={`label-${id}`}
            x={centerX - 150}
            y={maxY + 20} // Always rendered exactly 20 pixels below the lowest object in the group
            width={300}
            text={labelText as string}
            align="center"
            fontFamily={labelFontFamily}
            fontSize={labelFontSize}
            fill={labelColor}
            fontStyle={labelFontStyle}
            listening={false}
          />
        );
      })}
    </>
  );
};

export const InfiniteCanvas = () => {
  const store = React.useContext(BoardContext)!;
  const camera = useBoardStore(s => s.camera);
  const setCamera = useBoardStore(s => s.setCamera);
  const tool = useBoardStore(s => s.tool);
  const objectsById = useBoardStore(s => s.objectsById);
  const objectIds = useBoardStore(s => s.objectIds);
  const addObject = useBoardStore(s => s.addObject);
  const updateObject = useBoardStore(s => s.updateObject);
  const removeObject = useBoardStore(s => s.removeObject);
  const addPointToLastLine = useBoardStore(s => s.addPointToLastLine);
  const updateCurrentShape = useBoardStore(s => s.updateCurrentShape);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const setSelectedIds = useBoardStore(s => s.setSelectedIds);
  const moveSelectedObjects = useBoardStore(s => s.moveSelectedObjects);
  const toast = useBoardStore(s => s.toast);
  const showToast = useBoardStore(s => s.showToast);
  const saveHistory = useBoardStore(s => s.saveHistory);
  const setContextMenu = useBoardStore(s => s.setContextMenu);

  const { backgroundColor, showRulers } = useSettingsStore();
  const objects = objectIds.map((id: any) => objectsById[id]).filter(Boolean);
  const getGroupIds = (object: any) => {
    const rootId = object.parentId || object.id;
    const ids = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      objects.forEach(candidate => {
        if (candidate.parentId && ids.has(candidate.parentId) && !ids.has(candidate.id)) {
          ids.add(candidate.id);
          changed = true;
        }
      });
    }
    return objects.filter(candidate => ids.has(candidate.id)).map(candidate => candidate.id);
  };
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingText, setEditingText] = useState<{ id: string, x: number, y: number, text: string } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);
  const [isDraggingObjects, setIsDraggingObjects] = useState(false);
  const [guideLines, setGuideLines] = useState<{ id: string; x1: number; y1: number; x2: number; y2: number; type: 'h' | 'v' }[]>([]);
  const [stageSize, setStageSize] = useState({ w: 1200, h: 800 });

  const stageRef = useRef<any>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<any>(null);

  // Initialize modular keyboard shortcuts
  useKeyboardShortcuts(!!editingText, setIsSpacePressed, setIsPanning);

  useEffect(() => {
    useAppStore.getState().setActiveMenuTab(selectedIds.length > 0 ? 'Property' : 'Insert');
  }, [selectedIds]);

  useEffect(() => {
    const node = stageContainerRef.current;
    if (!node) return;
    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setStageSize({ w: Math.max(300, rect.width), h: Math.max(300, rect.height) });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const nodes = selectedIds.map((id) => stageRef.current.findOne(`#${id}`)).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objectsById]);


  useEffect(() => {
    const handleExport = () => {
      if (stageRef.current) {
        // Deselect everything so the blue transformer boxes don't show up in the image
        setSelectedIds([]);

        setTimeout(() => {
          // Grab a data URL of the canvas (creates a PNG string)
          const uri = stageRef.current.toDataURL({ pixelRatio: 2 });

          // Trigger the download
          const link = document.createElement('a');
          link.download = `whiteboard-export-${Date.now()}.png`;
          link.href = uri;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast("Image Exported successfully!"); // <-- FIXED HERE
        }, 50);
      }
    };

    window.addEventListener('export-canvas-image', handleExport);
    return () => window.removeEventListener('export-canvas-image', handleExport);
  }, [setSelectedIds, toast]);

  // Drag-and-drop images from filesystem onto Stage container
  useEffect(() => {
    const container = stageRef.current?.container?.();
    if (!container) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
      if (files.length === 0) return;
      const { camera: cam } = (store as any)!.getState();
      files.forEach((file, i) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (!ev.target?.result) return;
          const dataUrl = ev.target.result as string;
          const img = new window.Image();
          img.src = dataUrl;
          img.onload = () => {
            const now = Date.now() + i;
            const rect = container.getBoundingClientRect();
            const dropX = ((e.clientX - rect.left) - cam.x) / cam.scale + i * 20;
            const dropY = ((e.clientY - rect.top) - cam.y) / cam.scale + i * 20;
            store.getState().saveHistory();
            store.getState().addObject({
              id: `img-drop-${now}`, name: 'image', type: 'image',
              zIndex: store.getState().objectIds.length,
              x: dropX, y: dropY,
              rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
              createdAt: now, updatedAt: now,
              src: dataUrl,
              width: Math.min(img.width, 800),
              height: img.height * (Math.min(img.width, 800) / img.width),
              shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1
            } as any);
            store.getState().showToast(`Dropped: ${Math.round(img.width)}×${Math.round(img.height)}`);
          };
        };
        reader.readAsDataURL(file);
      });
    };

    container.addEventListener('dragover', onDragOver);
    container.addEventListener('drop', onDrop);
    return () => {
      container.removeEventListener('dragover', onDragOver);
      container.removeEventListener('drop', onDrop);
    };
  }, [stageRef.current]);  // re-run when stage mounts

  const getCanvasCoordinates = () => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    return { x: (pointer.x - camera.x) / camera.scale, y: (pointer.y - camera.y) / camera.scale };
  };

  const createBaseObject = (type: any, pos: { x: number, y: number }) => {
    const now = Date.now();
    return {
      id: `obj-${now}`, name: `${type}-${now}`, type, zIndex: objects.length,
      x: pos.x, y: pos.y, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true,
      locked: false, draggable: true, createdAt: now, updatedAt: now,
      shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
    };
  };

  const handleMouseDown = (e: any) => {
    if (e.evt.button === 1 || isSpacePressed) {
      setIsPanning(true);
      return;
    }

    if (tool === 'pan' || tool === 'eraser') return;
    if (editingText) {
      updateObject(editingText.id, { text: editingText.text });
      setEditingText(null);
      return;
    }

    const pos = getCanvasCoordinates();

    if (tool === 'select') {
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedIds([]);
        useAppStore.getState().setActiveMenuTab('Insert');
        setSelectionBox({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      }
      return;
    }

    saveHistory();
    setIsDrawing(true);
    const base = createBaseObject(tool, pos);

    if (tool === 'pen') addObject({ ...base, type: 'line', points: [0, 0], stroke: '#000000', strokeWidth: 3, tension: 0.5, lineCap: 'round', lineJoin: 'round' } as LineData);
    else if (tool === 'arrow') addObject({ ...base, type: 'arrow', points: [0, 0, 0, 0], arrowType: (store as any)!.getState().defaultArrowType, stroke: '#000000', strokeWidth: 3, tension: 0 } as any);
    else if (tool === 'rectangle') addObject({ ...base, type: 'rectangle', width: 0, height: 0, fill: 'transparent', stroke: '#000000', strokeWidth: 3, cornerRadius: 0 } as RectangleData);
    else if (tool === 'circle') addObject({ ...base, type: 'circle', radius: 0, fill: 'transparent', stroke: '#000000', strokeWidth: 3 } as CircleData);
    else if (tool === 'text') {
      const textId = base.id;
      
      addObject({ ...base, type: 'text', width: 150, text: 'Text', fontFamily: 'Arial', fontSize: 32, fontStyle: 'normal', align: 'left', verticalAlign: 'top', fill: '#000000', strokeWidth: 0, lineHeight: 1.2, letterSpacing: 0, padding: 0, underline: false, strikethrough: false } as TextData);
      
      setIsDrawing(false);
      
      // Instantly open the typing box where you clicked
      setEditingText({ id: textId, x: pos.x, y: pos.y, text: 'Text' }); 
      
      // If the text tool wasn't double-clicked (locked), instantly revert to the Select tool
      const state = (store as any)!.getState();
      if (!state.isToolLocked) {
        state.setTool('select');
      }
      return; 
    }
  };

  const handleMouseMove = useCallback((e: any) => {
    if (isPanning) {
      setCamera({ ...camera, x: camera.x + e.evt.movementX, y: camera.y + e.evt.movementY });
      return;
    }

    const pos = getCanvasCoordinates();

    if (dragStartPos && tool === 'select' && isDraggingObjects && selectedIds.length > 0) {
      const dx = pos.x - dragStartPos.x;
      const dy = pos.y - dragStartPos.y;
      moveSelectedObjects(dx, dy);
      setDragStartPos(pos);

      // Compute alignment guides
      const viewBounds = {
        left: -camera.x / camera.scale,
        top: -camera.y / camera.scale,
        right: (stageSize.w - camera.x) / camera.scale,
        bottom: (stageSize.h - camera.y) / camera.scale,
      };
      const result = computeAlignmentGuides(selectedIds, (store as any)!.getState().objectsById, objectIds, viewBounds);
      setGuideLines(result.guides);
      return;
    }



    if (selectionBox) {
      setSelectionBox({ ...selectionBox, endX: pos.x, endY: pos.y });
      return;
    }

    if (!isDrawing) return;
    if (tool === 'pen') addPointToLastLine([pos.x, pos.y]);
    else if (tool === 'rectangle' || tool === 'circle' || tool === 'arrow') updateCurrentShape(pos);
  }, [isPanning, camera, dragStartPos, tool, isDraggingObjects, selectedIds, selectionBox, isDrawing, objectIds, stageSize]);

  const handleMouseUp = (e: any) => {
    setDragStartPos(null);
    setIsDraggingObjects(false);
    setGuideLines([]); // Clear alignment guides on release
    if (selectionBox) {
      const boxX = Math.min(selectionBox.startX, selectionBox.endX);
      const boxY = Math.min(selectionBox.startY, selectionBox.endY);
      const boxW = Math.abs(selectionBox.startX - selectionBox.endX);
      const boxH = Math.abs(selectionBox.startY - selectionBox.endY);

      const newSelectedIds = objects.filter((obj) => obj.x >= boxX && obj.x <= boxX + boxW && obj.y >= boxY && obj.y <= boxY + boxH).map((o: any) => o.id);
      setSelectedIds(e.evt.shiftKey ? [...new Set([...selectedIds, ...newSelectedIds])] : newSelectedIds);
      setSelectionBox(null);
    }
    setIsDrawing(false);
    setIsPanning(false);
    const state = (store as any)!.getState();
    if (!state.isToolLocked && tool !== 'select' && tool !== 'pan' && tool !== 'text') {
      state.setTool('select');
    }
    
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    let newScale = e.evt.deltaY > 0 ? oldScale / 1.1 : oldScale * 1.1;
    newScale = Math.max(0.05, Math.min(newScale, 10));

    const pointer = stage.getPointerPosition();
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    setCamera({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, scale: newScale });
    if (editingText) setEditingText(null);
  };

  const lastDistRef = useRef<number>(0);
  
  const handleTouchMove = (e: any) => {
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];
    if (touch1 && touch2) {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const dist = Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
      if (!lastDistRef.current) { lastDistRef.current = dist; return; }
      const oldScale = stage.scaleX();
      const scaleBy = dist / lastDistRef.current;
      let newScale = Math.max(0.05, Math.min(oldScale * scaleBy, 10));
      const center = { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
      const stageRect = stageContainerRef.current?.getBoundingClientRect();
      if(!stageRect) return;
      const pointer = { x: center.x - stageRect.left - (showRulers ? 24 : 0), y: center.y - stageRect.top - (showRulers ? 24 : 0) };
      const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
      setCamera({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale, scale: newScale });
      lastDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => { lastDistRef.current = 0; };

  const getCursor = () => {
    if (isSpacePressed || tool === 'pan') return isPanning ? 'grabbing' : 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'eraser') return 'pointer';
    if (tool === 'text') return 'text';
    return 'crosshair';
  };

  // Ruler offset: if rulers are shown, shift stage so it doesn't overlap
  const rulerOffset = showRulers ? RULER_SIZE : 0;

  return (
    <>
      {toast && (
        <div className="canvas-toast" style={{
          position: 'absolute',
          bottom: '24px',
          left: '24px',
          backgroundColor: backgroundColor === '#f8fafc' ? '#1e293b' : '#ffffff',
          color: backgroundColor === '#f8fafc' ? '#fff' : '#000',
          padding: '8px 16px',
          borderRadius: '8px',
          zIndex: 50,
          fontSize: '0.875rem',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast}
        </div>
      )}

      {/* Rulers */}
      {showRulers && (
        <CanvasRuler
          camera={camera}
          stageWidth={stageSize.w}
          stageHeight={stageSize.h}
        />
      )}

      <div ref={stageContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Stage
        ref={stageRef}
        width={stageSize.w - rulerOffset}
        height={stageSize.h - rulerOffset}
        style={{
          position: 'absolute',
          top: rulerOffset,
          left: rulerOffset,
          cursor: getCursor(),
          backgroundColor: backgroundColor,
        }}
        onContextMenu={(e) => e.evt.preventDefault()}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        draggable={tool === 'pan' && !isSpacePressed} x={camera.x} y={camera.y} scaleX={camera.scale} scaleY={camera.scale}
        onDragMove={(e) => { if (tool === 'pan' && e.target === stageRef.current) setCamera({ x: e.target.x(), y: e.target.y(), scale: camera.scale }); }}
      >
        <BackgroundGrid width={stageSize.w} height={stageSize.h} />
        <Layer>
          {objects.slice().sort((a, b) => a.zIndex - b.zIndex).map((obj) => {
            const isSelected = selectedIds.includes(obj.id);
            const commonProps = {
              id: obj.id, x: obj.x, y: obj.y, rotation: obj.rotation, scaleX: obj.scaleX, scaleY: obj.scaleY,
              opacity: obj.opacity, visible: obj.visible, draggable: false, hitStrokeWidth: 20,

              onTransformEnd: (e: any) => {
                const node = e.target;
                
                // If it's text, we want to scale width/fontSize, NOT scaleX/scaleY.
                if (obj.type === 'text') {
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  const textObj = obj as any;
                  
                  // Reset the actual node's scale immediately to prevent Konva glitching
                  node.scaleX(1);
                  node.scaleY(1);
                  
                  updateObject(obj.id, { 
                    x: node.x(), 
                    y: node.y(), 
                    rotation: node.rotation(), 
                    width: Math.max(textObj.width * scaleX, 20),
                    fontSize: Math.max(textObj.fontSize * scaleY, 8),
                    scaleX: 1, 
                    scaleY: 1 
                  });
                } else {
                  updateObject(obj.id, { 
                    x: node.x(), 
                    y: node.y(), 
                    rotation: node.rotation(), 
                    scaleX: node.scaleX(), 
                    scaleY: node.scaleY() 
                  });
                }
              },
              onMouseDown: (e: any) => {
                if (e.evt.button === 0 && tool !== 'eraser' && tool !== 'text') {
                  e.cancelBubble = true;
                  const groupIds = getGroupIds(obj);
                  if (tool !== 'select') (store as any).getState().setTool('select');
                  setSelectedIds(e.evt.shiftKey
                    ? (selectedIds.includes(obj.id)
                      ? selectedIds.filter(id => !groupIds.includes(id))
                      : [...new Set([...selectedIds, ...groupIds])])
                    : groupIds);
                  useAppStore.getState().setActiveMenuTab('Property');
                  if (tool === 'select' && selectedIds.includes(obj.id) && !e.evt.shiftKey) {
                    saveHistory();
                    setDragStartPos(getCanvasCoordinates());
                    setIsDraggingObjects(true);
                  }
                  return;
                }
                if (e.evt.button === 2) {
                  e.cancelBubble = true;
                  if (!isSelected) {
                    // FIXED: o.parentId instead of o.groupId
                    const groupIds = getGroupIds(obj);
                    setSelectedIds(groupIds);
                  }
                  setContextMenu({
                    x: e.evt.clientX,
                    y: e.evt.clientY,
                    id: obj.parentId || obj.id
                  });
                  return;
                }
                if (tool === 'eraser') {
                  saveHistory();
                  removeObject(obj.id);
                  return;
                }
                if (tool === 'text' && obj.type === 'text') {
                  e.cancelBubble = true;
                  (store as any)!.getState().saveHistory();
                  setEditingText({ id: obj.id, x: obj.x, y: obj.y, text: (obj as TextData).text });
                  (store as any)!.getState().setTool('select');
                  return;
                }
                if (tool === 'select') {
                  e.cancelBubble = true;
                  const groupIds = getGroupIds(obj);

                  if (e.evt.shiftKey) {
                    setSelectedIds(isSelected ? selectedIds.filter(id => !groupIds.includes(id)) : [...new Set([...selectedIds, ...groupIds])]);
                  } else if (!isSelected) {
                    setSelectedIds(groupIds);
                  }

                  // Only start dragging if the object was already selected before this click
                  if (isSelected) {
                    saveHistory();
                    setDragStartPos(getCanvasCoordinates());
                    setIsDraggingObjects(true);
                  }
                }
              },
              onMouseEnter: (e: any) => {
                if (tool === 'select') e.target.getStage().container().style.cursor = 'move';
                if (tool === 'eraser' && e.evt.buttons === 1) removeObject(obj.id);
              },
              onMouseLeave: (e: any) => { if (tool === 'select') e.target.getStage().container().style.cursor = 'default'; }
            };

            return (
              <Fragment key={obj.id}>
                <ShapeRenderer
                  obj={obj} commonProps={commonProps}
                  editingTextId={editingText?.id} setEditingText={setEditingText} tool={tool}
                />
                {isSelected && obj.type === 'arrow' && (() => {
                  const arrow = obj as any;
                  return (
                    <>
                      <Circle
                        x={arrow.x + arrow.points[0]} y={arrow.y + arrow.points[1]} radius={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} draggable
                        onDragMove={(e) => {
                          const newPoints = [...arrow.points];
                          newPoints[0] = e.target.x() - arrow.x;
                          newPoints[1] = e.target.y() - arrow.y;
                          updateObject(arrow.id, { points: newPoints });
                        }}
                        onDragEnd={(e) => { e.cancelBubble = true; saveHistory(); }}
                        onMouseDown={(e) => { e.cancelBubble = true; }}
                      />
                      <Circle
                        x={arrow.x + arrow.points[arrow.points.length-2]} y={arrow.y + arrow.points[arrow.points.length-1]} radius={6} fill="#3b82f6" stroke="#fff" strokeWidth={2} draggable
                        onDragMove={(e) => {
                          const newPoints = [...arrow.points];
                          newPoints[newPoints.length-2] = e.target.x() - arrow.x;
                          newPoints[newPoints.length-1] = e.target.y() - arrow.y;
                          updateObject(arrow.id, { points: newPoints });
                        }}
                        onDragEnd={(e) => { e.cancelBubble = true; saveHistory(); }}
                        onMouseDown={(e) => { e.cancelBubble = true; }}
                      />
                    </>
                  );
                })()}
              </Fragment>
            );
          })}
          <CanvasLabels />
          {(() => {
            const hasLockedObject = selectedIds.some(id => objectsById[id]?.locked);
            return (
              <Transformer
                ref={transformerRef}
                onTransformStart={() => saveHistory()}
                anchorSize={14}
                anchorCornerRadius={3}
                borderStroke={hasLockedObject ? "#ef4444" : "#3b82f6"}
                anchorStroke={hasLockedObject ? "#ef4444" : "#3b82f6"}
                anchorFill="#ffffff"
                resizeEnabled={!hasLockedObject}
                rotateEnabled={!hasLockedObject}
                boundBoxFunc={(oldBox, newBox) => (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) ? oldBox : newBox}
              />
            );
          })()}

          {selectionBox && (
            <Rect x={Math.min(selectionBox.startX, selectionBox.endX)} y={Math.min(selectionBox.startY, selectionBox.endY)} width={Math.abs(selectionBox.startX - selectionBox.endX)} height={Math.abs(selectionBox.startY - selectionBox.endY)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth={1 / camera.scale} listening={false} />
          )}

          {/* Alignment Guide Lines */}
          {guideLines.map(guide => (
            <Line
              key={guide.id}
              points={[guide.x1, guide.y1, guide.x2, guide.y2]}
              stroke="#e11d48"
              strokeWidth={1 / camera.scale}
              dash={[4 / camera.scale, 4 / camera.scale]}
              listening={false}
              opacity={0.85}
            />
          ))}
        </Layer>
      </Stage>
      </div>

      {editingText && <TextInputOverlay editingText={editingText} setEditingText={setEditingText} camera={camera} />}
      <HtmlOverlays rulerOffset={rulerOffset} />
      <ContextMenu />
    </>
  );
};
