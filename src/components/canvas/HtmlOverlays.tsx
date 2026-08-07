import { useBoardStore } from '../../core/store/useBoardStore';

export const HtmlOverlays = () => {
  const { objectsById, objectIds, camera, selectedIds, updateObject } = useBoardStore();

  // Filter for the custom HTML nodes
  const htmlObjects = objectIds
    .map(id => objectsById[id])
    .filter(obj => obj && ['table', 'video', 'equation'].includes(obj.type));

  if (htmlObjects.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {htmlObjects.map(obj => {
        const isSelected = selectedIds.includes(obj.id);
        const x = obj.x * camera.scale + camera.x;
        const y = obj.y * camera.scale + camera.y;
        
        const style: React.CSSProperties = {
          position: 'absolute',
          transform: `translate(${x}px, ${y}px) scale(${camera.scale * (obj.scaleX || 1)}, ${camera.scale * (obj.scaleY || obj.scaleX || 1)}) rotate(${obj.rotation}deg)`,
          transformOrigin: '0 0',
          width: (obj as any).width || 100,
          height: (obj as any).height || 100,
          opacity: obj.opacity,
          pointerEvents: 'none',
          userSelect: 'none',
          boxSizing: 'border-box' as const,
        };

        if (obj.type === 'table') {
          const tableObj = obj as any;
          const rows = tableObj.rows || 3;
          const cols = tableObj.cols || 3;
          const data = tableObj.data || Array.from({ length: rows }, () => Array(cols).fill(''));
          const hasHeader = tableObj.hasHeader !== false;
          const borderColor = '#94a3b8';
          const headerBg = '#1e40af';
          
          return (
            <div
              key={obj.id}
              style={{
                ...style,
                background: isSelected ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.95)',
                border: isSelected ? '2px solid #3b82f6' : `1px solid ${borderColor}`,
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: isSelected ? '0 0 0 2px rgba(59,130,246,0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {Array.from({ length: rows }).map((_, r) => {
                    const isHeaderRow = hasHeader && r === 0;
                    return (
                      <tr key={r}>
                        {Array.from({ length: cols }).map((_, c) => (
                          <td
                            key={c}
                            style={{
                              border: `1px solid ${borderColor}`,
                              padding: 0,
                              background: isHeaderRow
                                ? headerBg
                                : r % 2 === 0 ? 'transparent' : 'rgba(241,245,249,0.6)',
                              position: 'relative',
                            }}
                          >
                            <input
                              style={{
                                width: '100%',
                                height: '100%',
                                minHeight: '28px',
                                border: 'none',
                                outline: 'none',
                                padding: '4px 6px',
                                boxSizing: 'border-box',
                                pointerEvents: 'auto',
                                background: 'transparent',
                                color: isHeaderRow ? '#ffffff' : '#0f172a',
                                fontWeight: isHeaderRow ? 600 : 400,
                                fontSize: '13px',
                                fontFamily: 'Inter, system-ui, sans-serif',
                              }}
                              value={data[r]?.[c] || ''}
                              placeholder={isHeaderRow ? `Col ${c + 1}` : ''}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                // Tab to next cell
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  const nextC = c + 1;
                                  const nextR = nextC >= cols ? r + 1 : r;
                                  const actualNextC = nextC >= cols ? 0 : nextC;
                                  if (nextR < rows) {
                                    const inputs = (e.target as HTMLInputElement)
                                      .closest('table')
                                      ?.querySelectorAll('input');
                                    const idx = nextR * cols + actualNextC;
                                    (inputs?.[idx] as HTMLInputElement)?.focus();
                                  }
                                }
                              }}
                              onChange={(e) => {
                                const newData = data.map((row: string[]) => [...row]);
                                if (!newData[r]) newData[r] = [];
                                newData[r][c] = e.target.value;
                                updateObject(obj.id, { data: newData } as any);
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Table corner label */}
              <div style={{
                position: 'absolute', bottom: '2px', right: '4px',
                fontSize: '9px', color: '#94a3b8', pointerEvents: 'none', userSelect: 'none',
              }}>
                {rows}×{cols}
              </div>
            </div>
          );
        }

        if (obj.type === 'video') {
          const src = (obj as any).src || '';
          const isYoutube = src.startsWith('https://www.youtube.com/embed/') || src.startsWith('https://youtube.com/embed/');
          const isLocalDataUrl = src.startsWith('data:video/');
          const isLocalFile = src.startsWith('blob:') || isLocalDataUrl;

          return (
            <div
              key={obj.id}
              style={{
                ...style,
                background: '#000',
                borderRadius: '8px',
                overflow: 'hidden',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #334155',
                pointerEvents: isSelected ? 'auto' : 'none',
              }}
            >
              {isYoutube ? (
                <iframe
                  width="100%" height="100%"
                  src={src}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ pointerEvents: isSelected ? 'auto' : 'none', display: 'block' }}
                />
              ) : isLocalFile ? (
                <video
                  src={src}
                  controls
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    pointerEvents: isSelected ? 'auto' : 'none',
                  }}
                />
              ) : (
                // Fallback: show a placeholder for unrecognized sources
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', fontSize: '14px', gap: '8px',
                }}>
                  <span style={{ fontSize: '32px' }}>🎬</span>
                  <span>No valid video source</span>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>Select to edit URL in Properties</span>
                </div>
              )}
            </div>
          );
        }

        if (obj.type === 'equation') {
          const latex = (obj as any).latex || 'E = mc^2';
          const encoded = encodeURIComponent(latex);
          return (
            <div
              key={obj.id}
              style={{
                ...style,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.9)',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px',
              }}
            >
              <img
                src={`https://latex.codecogs.com/svg.image?\\huge&space;${encoded}`}
                alt={latex}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};
