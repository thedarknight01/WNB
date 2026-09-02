import { useCallback, useRef } from 'react';
import { useBoardStore } from '../../core/store/useBoardStore';

interface Props {
  rulerOffset?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE THEMES
// ─────────────────────────────────────────────────────────────────────────────
const TABLE_THEMES: Record<string, { headerBg: string; headerText: string; evenBg: string; oddBg: string; border: string; label: string }> = {
  blue: { headerBg: '#1e40af', headerText: '#ffffff', evenBg: '#ffffff', oddBg: '#eff6ff', border: '#93c5fd', label: 'Blue' },
  slate: { headerBg: '#1e293b', headerText: '#f8fafc', evenBg: '#ffffff', oddBg: '#f1f5f9', border: '#94a3b8', label: 'Slate' },
  emerald: { headerBg: '#065f46', headerText: '#ffffff', evenBg: '#ffffff', oddBg: '#ecfdf5', border: '#6ee7b7', label: 'Emerald' },
  rose: { headerBg: '#9f1239', headerText: '#ffffff', evenBg: '#ffffff', oddBg: '#fff1f2', border: '#fda4af', label: 'Rose' },
  amber: { headerBg: '#92400e', headerText: '#ffffff', evenBg: '#ffffff', oddBg: '#fffbeb', border: '#fcd34d', label: 'Amber' },
  purple: { headerBg: '#4c1d95', headerText: '#ffffff', evenBg: '#ffffff', oddBg: '#f5f3ff', border: '#c4b5fd', label: 'Purple' },
};

// ─────────────────────────────────────────────────────────────────────────────
// RESIZABLE TABLE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const ResizableTable = ({
  obj,
  isSelected,
  updateObject,
}: {
  obj: any;
  isSelected: boolean;
  updateObject: (id: string, updates: any) => void;
}) => {
  const rows = obj.rows || 3;
  const cols = obj.cols || 3;
  const data: string[][] = obj.data || Array.from({ length: rows }, () => Array(cols).fill(''));
  const hasHeader = obj.hasHeader !== false;
  const themeName: string = obj.tableTheme || 'blue';
  const theme = TABLE_THEMES[themeName] || TABLE_THEMES.blue;
  const fontSize: number = obj.tableFontSize || 13;
  const fontFamily: string = obj.tableFontFamily || 'Inter, system-ui, sans-serif';
  const customBorderColor = obj.tableBorderColor;
  const customTextColor = obj.tableTextColor;

  // Col widths: if stored use them, else equal distribution
  const totalWidth = obj.width || 400;
  const storedWidths: number[] | undefined = obj.colWidths;
  const colWidths = storedWidths && storedWidths.length === cols
    ? storedWidths
    : Array(cols).fill(totalWidth / cols);

  const resizingRef = useRef<{ colIndex: number; startX: number; startWidths: number[] } | null>(null);

  const handleColDividerMouseDown = useCallback((e: React.MouseEvent, colIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    resizingRef.current = { colIndex, startX: e.clientX, startWidths: [...colWidths] };

    const onMove = (me: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colIndex: ci, startX, startWidths } = resizingRef.current;
      const delta = (me.clientX - startX); // in screen pixels, already at scale
      const newWidths = [...startWidths];
      newWidths[ci] = Math.max(40, startWidths[ci] + delta);
      const newTotal = newWidths.reduce((a, b) => a + b, 0);
      updateObject(obj.id, { colWidths: newWidths, width: newTotal });
    };

    const onUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths, obj.id, updateObject]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: isSelected ? 'rgba(255,255,255,0.99)' : 'rgba(255,255,255,0.97)',
        border: isSelected ? `2px solid #3b82f6` : `1px solid ${customBorderColor || theme.border}`,
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 3px rgba(59,130,246,0.15)' : '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.15s',
        boxSizing: 'border-box',
        fontFamily,
        fontSize,
      }}
    >
      {/* TABLE */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            height: '100%',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            {colWidths.map((w, ci) => (
              <col key={ci} style={{ width: w }} />
            ))}
          </colgroup>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => {
              const isHeaderRow = hasHeader && r === 0;
              return (
                <tr key={r}>
                  {Array.from({ length: cols }).map((_, c) => (
                    <td
                      key={c}
                      style={{
                        border: `1px solid ${customBorderColor || theme.border}`,
                        padding: 0,
                        background: isHeaderRow
                          ? theme.headerBg
                          : r % 2 === 0 ? theme.evenBg : theme.oddBg,
                        position: 'relative',
                        verticalAlign: 'middle',
                      }}
                    >
                      <input
                        style={{
                          width: '100%',
                          height: '100%',
                          minHeight: `${Math.max(28, fontSize + 14)}px`,
                          border: 'none',
                          outline: 'none',
                          padding: '4px 6px',
                          boxSizing: 'border-box',
                          pointerEvents: 'auto',
                          background: 'transparent',
                          color: isHeaderRow ? theme.headerText : (customTextColor || '#0f172a'),
                          fontWeight: isHeaderRow ? 600 : 400,
                          fontSize,
                          fontFamily,
                        }}
                        value={data[r]?.[c] || ''}
                        placeholder={isHeaderRow ? `Column ${c + 1}` : ''}
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
                      {/* Column resize divider (only on last cell column right edge) */}
                      {c < cols - 1 && isHeaderRow && (
                        <div
                          onMouseDown={(e) => handleColDividerMouseDown(e, c)}
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: -3,
                            width: 6,
                            height: '100%',
                            cursor: 'col-resize',
                            zIndex: 5,
                            background: 'transparent',
                            pointerEvents: 'auto',
                          }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dimension label */}
      <div
        style={{
          position: 'absolute',
          bottom: '3px',
          right: '6px',
          fontSize: '8px',
          color: theme.border,
          pointerEvents: 'none',
          userSelect: 'none',
          fontFamily: 'system-ui',
          letterSpacing: '0.05em',
        }}
      >
        {rows}×{cols}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HTML OVERLAYS
// ─────────────────────────────────────────────────────────────────────────────
export const HtmlOverlays = ({ rulerOffset = 0 }: Props) => {
  const objectsById = useBoardStore(s => s.objectsById);
  const objectIds = useBoardStore(s => s.objectIds);
  const camera = useBoardStore(s => s.camera);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const updateObject = useBoardStore(s => s.updateObject);

  // Filter for the custom HTML nodes
  const htmlObjects = objectIds
    .map((id: any) => objectsById[id])
    .filter((obj: any) => obj && ['table', 'video', 'equation'].includes(obj.type));

  if (htmlObjects.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: rulerOffset,
      left: rulerOffset,
      width: `calc(100% - ${rulerOffset}px)`,
      height: `calc(100% - ${rulerOffset}px)`,
      pointerEvents: 'none',
      zIndex: 10
    }}>
      {htmlObjects.map((obj: any) => {
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
          pointerEvents: isSelected ? 'auto' : 'none',
          userSelect: 'none',
          boxSizing: 'border-box' as const,
        };

        if (obj.type === 'table') {
          return (
            <div key={obj.id} style={style}>
              <ResizableTable
                obj={obj as any}
                isSelected={isSelected}
                updateObject={updateObject}
              />
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
