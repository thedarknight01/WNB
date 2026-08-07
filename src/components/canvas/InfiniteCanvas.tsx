import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer, Text } from 'react-konva';
import { useBoardStore } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { BackgroundGrid } from './BackgroundGrid';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { ShapeRenderer } from './ShapeRenderer';
import { TextInputOverlay } from './TextInputOverlay';
import { HtmlOverlays } from './HtmlOverlays';
import type { LineData, RectangleData, CircleData, TextData } from '../../types/objects';
import { ContextMenu } from '../panels/ContextMenu';


const CanvasLabels = () => {
  const { objectsById, objectIds } = useBoardStore();
  const { labelFontFamily, labelFontSize, labelColor, labelFontStyle } = useSettingsStore();
  const objects = objectIds.map(id => objectsById[id]).filter(Boolean);
  const labeledItems = objects.filter(o => o.label);
  const uniqueLabels = [...new Set(labeledItems.map(o => o.label))];

  return (
    <>
      {uniqueLabels.map((labelText) => {
        if (!labelText) return null;

        const targets = labeledItems.filter(o => o.label === labelText);

        let minX = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // PERFECT BOUNDING BOX MATH
        targets.forEach((o) => {
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
          else if (o.type === 'line') {
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
            key={`label-${labelText}`}
            x={centerX - 150}
            y={maxY + 20} // Always rendered exactly 20 pixels below the lowest object in the group
            width={300}
            text={labelText}
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
  const {
    camera, setCamera, tool, objectsById, objectIds, addObject, updateObject, removeObject,
    addPointToLastLine, updateCurrentShape, selectedIds, setSelectedIds,
    moveSelectedObjects, toast, showToast, saveHistory,
    setContextMenu
  } = useBoardStore();

  const { backgroundColor } = useSettingsStore();
  const objects = objectIds.map(id => objectsById[id]).filter(Boolean);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingText, setEditingText] = useState<{ id: string, x: number, y: number, text: string } | null>(null);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number, y: number } | null>(null);

  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  // Initialize modular keyboard shortcuts
  useKeyboardShortcuts(!!editingText, setIsSpacePressed, setIsPanning);

  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const nodes = selectedIds.map((id) => stageRef.current.findOne(`#${id}`)).filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedIds, objectsById ]);


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
      const { camera: cam } = useBoardStore.getState();
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
            useBoardStore.getState().saveHistory();
            useBoardStore.getState().addObject({
              id: `img-drop-${now}`, name: 'image', type: 'image',
              zIndex: useBoardStore.getState().objectIds.length,
              x: dropX, y: dropY,
              rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
              createdAt: now, updatedAt: now,
              src: dataUrl,
              width: Math.min(img.width, 800),
              height: img.height * (Math.min(img.width, 800) / img.width),
              shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1
            } as any);
            useBoardStore.getState().showToast(`Dropped: ${Math.round(img.width)}×${Math.round(img.height)}`);
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
        setSelectionBox({ startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y });
      }
      return;
    }

    saveHistory();
    setIsDrawing(true);
    const base = createBaseObject(tool, pos);

    if (tool === 'pen') addObject({ ...base, type: 'line', points: [0, 0], stroke: '#000000', strokeWidth: 3, tension: 0.5, lineCap: 'round', lineJoin: 'round' } as LineData);
    else if (tool === 'rectangle') addObject({ ...base, type: 'rectangle', width: 0, height: 0, fill: 'transparent', stroke: '#000000', strokeWidth: 3, cornerRadius: 0 } as RectangleData);
    else if (tool === 'circle') addObject({ ...base, type: 'circle', radius: 0, fill: 'transparent', stroke: '#000000', strokeWidth: 3 } as CircleData);
    else if (tool === 'text') {
      const textId = base.id;
      
      addObject({ ...base, type: 'text', width: 150, text: 'Text', fontFamily: 'Arial', fontSize: 32, fontStyle: 'normal', align: 'left', verticalAlign: 'top', fill: '#000000', strokeWidth: 0, lineHeight: 1.2, letterSpacing: 0, padding: 0, underline: false, strikethrough: false } as TextData);
      
      setIsDrawing(false);
      
      // Instantly open the typing box where you clicked
      setEditingText({ id: textId, x: pos.x, y: pos.y, text: 'Text' }); 
      
      // If the text tool wasn't double-clicked (locked), instantly revert to the Select tool
      const state = useBoardStore.getState();
      if (!state.isToolLocked) {
        state.setTool('select');
      }
      return; 
    }
  };

  const handleMouseMove = (e: any) => {
    if (isPanning) {
      setCamera({ ...camera, x: camera.x + e.evt.movementX, y: camera.y + e.evt.movementY });
      return;
    }

    const pos = getCanvasCoordinates();

    if (dragStartPos && tool === 'select') {
      moveSelectedObjects(pos.x - dragStartPos.x, pos.y - dragStartPos.y);
      setDragStartPos(pos);
      return;
    }

    if (selectionBox) {
      setSelectionBox({ ...selectionBox, endX: pos.x, endY: pos.y });
      return;
    }

    if (!isDrawing) return;
    if (tool === 'pen') addPointToLastLine([pos.x, pos.y]);
    else if (tool === 'rectangle' || tool === 'circle') updateCurrentShape(pos);
  };

  const handleMouseUp = (e: any) => {
    setDragStartPos(null);
    if (selectionBox) {
      const boxX = Math.min(selectionBox.startX, selectionBox.endX);
      const boxY = Math.min(selectionBox.startY, selectionBox.endY);
      const boxW = Math.abs(selectionBox.startX - selectionBox.endX);
      const boxH = Math.abs(selectionBox.startY - selectionBox.endY);

      const newSelectedIds = objects.filter((obj) => obj.x >= boxX && obj.x <= boxX + boxW && obj.y >= boxY && obj.y <= boxY + boxH).map(o => o.id);
      setSelectedIds(e.evt.shiftKey ? [...new Set([...selectedIds, ...newSelectedIds])] : newSelectedIds);
      setSelectionBox(null);
    }
    setIsDrawing(false);
    setIsPanning(false);
    const state = useBoardStore.getState();
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

  const getCursor = () => {
    if (isSpacePressed || tool === 'pan') return isPanning ? 'grabbing' : 'grab';
    if (tool === 'select') return 'default';
    if (tool === 'eraser') return 'pointer';
    if (tool === 'text') return 'text';
    return 'crosshair';
  };


  return (
    <>
      {toast && (
        <div style={{
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

      <Stage
        ref={stageRef} width={window.innerWidth} height={window.innerHeight}
        onContextMenu={(e) => e.evt.preventDefault()}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        draggable={tool === 'pan' && !isSpacePressed} x={camera.x} y={camera.y} scaleX={camera.scale} scaleY={camera.scale}
        onDragMove={(e) => { if (tool === 'pan' && e.target === stageRef.current) setCamera({ x: e.target.x(), y: e.target.y(), scale: camera.scale }); }}
        style={{ cursor: getCursor(), backgroundColor: backgroundColor }}
      >
        <BackgroundGrid />
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
                if (e.evt.button === 2) {
                  e.cancelBubble = true;
                  if (!isSelected) {
                    // FIXED: o.parentId instead of o.groupId
                    const groupIds = obj.parentId ? objects.filter(o => o.parentId === obj.parentId).map(o => o.id) : [obj.id];
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
                  useBoardStore.getState().saveHistory();
                  setEditingText({ id: obj.id, x: obj.x, y: obj.y, text: (obj as TextData).text });
                  useBoardStore.getState().setTool('select');
                  return;
                }
                if (tool === 'select') {
                  e.cancelBubble = true;
                  // FIXED: o.parentId instead of o.groupId
                  const groupIds = obj.parentId ? objects.filter(o => o.parentId === obj.parentId).map(o => o.id) : [obj.id];

                  if (e.evt.shiftKey) setSelectedIds(isSelected ? selectedIds.filter(id => !groupIds.includes(id)) : [...new Set([...selectedIds, ...groupIds])]);
                  else if (!isSelected) setSelectedIds(groupIds);

                  saveHistory();
                  setDragStartPos(getCanvasCoordinates());
                }
              },
              onMouseEnter: (e: any) => {
                if (tool === 'select') e.target.getStage().container().style.cursor = 'move';
                if (tool === 'eraser' && e.evt.buttons === 1) removeObject(obj.id);
              },
              onMouseLeave: (e: any) => { if (tool === 'select') e.target.getStage().container().style.cursor = 'default'; }
            };

            return (
              <ShapeRenderer
                key={obj.id} obj={obj} commonProps={commonProps}
                editingTextId={editingText?.id} setEditingText={setEditingText} tool={tool}
              />
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
        </Layer>
      </Stage>

      {editingText && <TextInputOverlay editingText={editingText} setEditingText={setEditingText} camera={camera} />}
      <HtmlOverlays />
      <ContextMenu />
    </>
  );
};