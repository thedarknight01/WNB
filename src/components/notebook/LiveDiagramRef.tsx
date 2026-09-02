import { useEffect, useState, useMemo } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { storeRegistry } from '../../core/store/useAppStore';
import { getDocument } from '../../core/store/idb';
import type { BoardObject } from '../../types/objects';
import { Stage, Layer, Rect, Circle, Line, Text as KonvaText, Group, Image as KonvaImage } from 'react-konva';


const URLImage = ({ src, ...props }: any) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    image.onload = () => setImg(image);
  }, [src]);
  return img ? <KonvaImage image={img} {...props} /> : null;
};

export const LiveDiagramRef = ({ node, updateAttributes }: any) => {
  const { docId, id, label, width: customWidth } = node.attrs;
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Poll or subscribe to the store
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const fetchObjects = async () => {
      let sourceObjects: BoardObject[] = [];
      const store = storeRegistry.get(docId);
      
      if (store) {
        // Live store
        const state = store.getState();
        sourceObjects = state.objectIds.map((oId: string) => state.objectsById[oId]).filter(Boolean);
        unsubscribe = store.subscribe((newState) => {
          if (!isMounted) return;
          const newSource = newState.objectIds.map((oId: string) => newState.objectsById[oId]).filter(Boolean);
          extractGroup(newSource);
        });
      } else {
        // Offline / IDB
        const doc = await getDocument(docId);
        if (doc && doc.data && doc.data.objectIds) {
          sourceObjects = doc.data.objectIds.map((oId: string) => doc.data.objectsById![oId]).filter(Boolean);
        }
      }
      
      if (isMounted) extractGroup(sourceObjects);
    };

    const extractGroup = (sourceObjects: BoardObject[]) => {
      const includedIds = new Set<string>([id]);
      let changed = true;
      while (changed) {
        changed = false;
        sourceObjects.forEach((object: BoardObject) => {
          if (object.parentId && includedIds.has(object.parentId) && !includedIds.has(object.id)) {
            includedIds.add(object.id);
            changed = true;
          }
        });
      }
      const groupObjects = sourceObjects.filter((object: BoardObject) => includedIds.has(object.id));
      setObjects(groupObjects);
      setLoading(false);
    };

    fetchObjects();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [docId, id]);

  const bounds = useMemo(() => {
    if (objects.length === 0) return { minX: 0, minY: 0, width: 100, height: 100 };
    const minX = Math.min(...objects.map(o => o.x));
    const minY = Math.min(...objects.map(o => o.y));
    const maxX = Math.max(...objects.map(o => {
      const w = (o as any).width || ((o as any).radius ? (o as any).radius * 2 : 120);
      return o.x + w;
    }));
    const maxY = Math.max(...objects.map(o => {
      const h = (o as any).height || ((o as any).radius ? (o as any).radius * 2 : 80);
      return o.y + h;
    }));
    return {
      minX, minY,
      width: Math.max(10, maxX - minX),
      height: Math.max(10, maxY - minY)
    };
  }, [objects]);

  // Window handlers for resizing
  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const newWidth = Math.max(100, startWidth + deltaX);
      updateAttributes({ width: newWidth });
    };
    const handleMouseUp = () => setIsResizing(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, startWidth, updateAttributes]);

  const PADDING = 20;
  
  // Use custom width if set, otherwise default to a sensible bounded width
  const baseWidth = customWidth || Math.min(800, bounds.width + PADDING * 2);
  const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, baseWidth) : baseWidth;
  
  // Calculate scale based on the desired containerWidth vs the actual natural bounds
  const scale = containerWidth / (bounds.width + PADDING * 2);
  const stageWidth = (bounds.width + PADDING * 2) * scale;
  const stageHeight = (bounds.height + PADDING * 2) * scale;

  return (
    <NodeViewWrapper 
      className="live-diagram-ref" 
      style={{ 
        display: 'inline-block', 
        margin: '12px', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        background: '#ffffff', 
        position: 'relative',
        maxWidth: '100%',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.8)', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', backdropFilter: 'blur(4px)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <span>🔗</span> {label}
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center', minWidth: '200px' }}>Loading diagram...</div>
      ) : objects.length === 0 ? (
        <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center', minWidth: '200px' }}>Diagram not found</div>
      ) : (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Stage width={stageWidth} height={stageHeight} style={{ pointerEvents: 'none' }}>
            <Layer>
              <Group x={-bounds.minX * scale + PADDING * scale} y={-bounds.minY * scale + PADDING * scale} scaleX={scale} scaleY={scale}>
                {objects.map(obj => {
                  const props: any = {
                    key: obj.id,
                    x: obj.x, y: obj.y,
                    rotation: obj.rotation || 0,
                    scaleX: obj.scaleX || 1, scaleY: obj.scaleY || 1,
                    opacity: obj.opacity ?? 1,
                  };
                  if (obj.type === 'rectangle') return <Rect {...props} width={(obj as any).width} height={(obj as any).height} fill={(obj as any).fill} stroke={(obj as any).stroke} cornerRadius={6} strokeWidth={2} />;
                  if (obj.type === 'circle') return <Circle {...props} radius={(obj as any).radius} fill={(obj as any).fill} stroke={(obj as any).stroke} strokeWidth={2} />;
                  if (obj.type === 'line' || obj.type === 'arrow') return <Line {...props} points={(obj as any).points} stroke={(obj as any).stroke} strokeWidth={3} lineCap="round" lineJoin="round" />;
                  if (obj.type === 'text') return <KonvaText {...props} text={(obj as any).text} fontSize={(obj as any).fontSize} fontFamily={(obj as any).fontFamily || 'sans-serif'} fill={(obj as any).fill} />;
                  if (obj.type === 'image' && (obj as any).src) return <URLImage {...props} src={(obj as any).src} width={(obj as any).width} height={(obj as any).height} />;
                  return null;
                })}
              </Group>
            </Layer>
          </Stage>
        </div>
      )}

      {/* Resize Handle */}
      <div 
        onMouseDown={(e) => {
          e.preventDefault();
          setResizeStartX(e.clientX);
          setStartWidth(stageWidth);
          setIsResizing(true);
        }}
        style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '16px',
          height: '16px',
          cursor: 'nwse-resize',
          background: 'linear-gradient(135deg, transparent 50%, #cbd5e1 50%)',
          borderBottomRightRadius: '8px',
          zIndex: 20
        }}
      />
    </NodeViewWrapper>
  );
};
