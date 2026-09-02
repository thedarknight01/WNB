import { useBoardStore } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Bold, Italic, Underline, Strikethrough, 
  Plus, Minus, Grid3X3, Film, Sigma,
  Lock, Unlock, FlipHorizontal, FlipVertical, Copy, 
  AlignVerticalJustifyStart, 
  AlignVerticalJustifyCenter, AlignVerticalJustifyEnd 
} from 'lucide-react';

export const PropertiesPanel = () => {
  const { theme, customFonts } = useSettingsStore();
  const objectsById = useBoardStore(s => s.objectsById);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const updateObject = useBoardStore(s => s.updateObject);
  const saveHistory = useBoardStore(s => s.saveHistory);
  const duplicateSelected = useBoardStore(s => s.duplicateSelected);
  const bringToFront = useBoardStore(s => s.bringToFront);
  const sendToBack = useBoardStore(s => s.sendToBack);
  const groupSelected = useBoardStore(s => s.groupSelected);
  const ungroupSelected = useBoardStore(s => s.ungroupSelected);
  const isDark = theme === 'dark' || theme === 'midnight';

  if (selectedIds.length === 0) return null;
  const firstObj = objectsById[selectedIds[0]];
  if (!firstObj) return null;

  const handleUpdate = (updates: any) => {
    saveHistory();
    selectedIds.forEach(id => updateObject(id, updates));
  };

  const panelStyle = {
    width: '280px',
    height: '100%',
    maxHeight: 'calc(100vh - 80px)',
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    borderLeft: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a',
    display: 'flex',
    flexDirection: 'column' as const,
    overflowY: 'auto' as const,
    zIndex: 10
  };

  const sectionStyle = {
    padding: '16px',
    borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
  };

  const labelStyle = {
    fontSize: '0.65rem',
    fontWeight: 600,
    color: isDark ? '#94a3b8' : '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  const inputStyle = {
    background: isDark ? '#0f172a' : '#f1f5f9',
    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
    color: 'inherit',
    padding: '3px 5px',
    borderRadius: '4px',
    outline: 'none',
    fontSize: '0.7rem',
    width: '52px'
  };

  const iconBtn = (active: boolean) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6px', borderRadius: '4px', cursor: 'pointer', border: 'none',
    background: active ? (isDark ? '#3b82f6' : '#eff6ff') : 'transparent',
    color: active ? (isDark ? '#fff' : '#3b82f6') : 'inherit',
  });

  const resizeData = (data: string[][], newRows: number, newCols: number) => {
    const result: string[][] = [];
    for (let r = 0; r < newRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < newCols; c++) {
        row.push(data[r]?.[c] || '');
      }
      result.push(row);
    }
    return result;
  };

  const handleTextCase = (mode: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => {
    let newText = (firstObj as any).text || '';
    if (mode === 'uppercase') newText = newText.toUpperCase();
    else if (mode === 'lowercase') newText = newText.toLowerCase();
    else if (mode === 'capitalize') newText = newText.replace(/\w\S*/g, (w: string) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
    handleUpdate({ textTransform: mode, text: newText });
  };

  return (
    <div style={panelStyle}>
      <div style={{ padding: '16px', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Properties</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: isDark ? '#94a3b8' : '#64748b' }}>
          {selectedIds.length > 1 ? `${selectedIds.length} objects selected` : firstObj.type.toUpperCase()}
        </p>
      </div>

      {/* TRANSFORM & LAYERS */}
      <div style={sectionStyle}>
        <span style={labelStyle}>Transform & Arrange</span>
        <div style={rowStyle}>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>X</span>
            <input type="number" value={Math.round(firstObj.x)} onChange={(e) => handleUpdate({ x: Number(e.target.value) })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>Y</span>
            <input type="number" value={Math.round(firstObj.y)} onChange={(e) => handleUpdate({ y: Number(e.target.value) })} style={inputStyle} />
          </div>
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>W</span>
            <input type="number" value={Math.round((firstObj as any).width || 0)} onChange={(e) => handleUpdate({ width: Number(e.target.value) })} style={inputStyle} disabled={firstObj.type === 'line' || firstObj.type === 'circle'} />
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>H</span>
            <input type="number" value={Math.round((firstObj as any).height || 0)} onChange={(e) => handleUpdate({ height: Number(e.target.value) })} style={inputStyle} disabled={firstObj.type === 'line' || firstObj.type === 'circle' || firstObj.type === 'text'} />
          </div>
        </div>
        <div style={rowStyle}>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>R°</span>
            <input type="number" value={Math.round(firstObj.rotation)} onChange={(e) => handleUpdate({ rotation: Number(e.target.value) })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>Op%</span>
            <input type="number" min="0" max="100" value={Math.round((firstObj.opacity ?? 1) * 100)} onChange={(e) => handleUpdate({ opacity: Number(e.target.value) / 100 })} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', marginTop: '4px' }}>
           <button onClick={() => handleUpdate({ scaleX: ((firstObj as any).scaleX || 1) * -1 })} style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              <FlipHorizontal size={14} /> Flip H
           </button>
           <button onClick={() => handleUpdate({ scaleY: ((firstObj as any).scaleY || 1) * -1 })} style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              <FlipVertical size={14} /> Flip V
           </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', marginTop: '4px' }}>
           <button onClick={() => handleUpdate({ locked: !firstObj.locked, draggable: !!firstObj.locked })} style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {firstObj.locked ? <Lock size={14}/> : <Unlock size={14}/>} 
              {firstObj.locked ? 'Unlock' : 'Lock'}
           </button>
           <button onClick={duplicateSelected} style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              <Copy size={14}/> Duplicate
           </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between', marginTop: '4px' }}>
           <button onClick={bringToFront} style={{ ...inputStyle, width: '48%', cursor: 'pointer' }}>Bring Front</button>
           <button onClick={sendToBack} style={{ ...inputStyle, width: '48%', cursor: 'pointer' }}>Send Back</button>
        </div>
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'space-between' }}>
           <button onClick={groupSelected} style={{ ...inputStyle, width: '48%', cursor: 'pointer' }}>Group</button>
           <button onClick={ungroupSelected} style={{ ...inputStyle, width: '48%', cursor: 'pointer' }}>Ungroup</button>
        </div>
      </div>

      {/* TEXT PROPERTIES */}
      {firstObj.type === 'text' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Typography</span>
          
          <select value={(firstObj as any).fontFamily || 'Arial'} onChange={(e) => handleUpdate({ fontFamily: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
            {customFonts.map(font => <option key={font} value={font}>{font}</option>)}
          </select>

          <select 
            value={(firstObj as any).fontWeight || '400'} 
            onChange={(e) => {
               const weight = e.target.value;
               const isItalic = (firstObj as any).fontStyle?.includes('italic');
               handleUpdate({ fontWeight: weight, fontStyle: `${weight} ${isItalic ? 'italic' : ''}`.trim() });
            }}
            style={{ ...inputStyle, width: '100%' }}
          >
            <option value="100">100 Thin</option>
            <option value="200">200 Extra Light</option>
            <option value="300">300 Light</option>
            <option value="400">400 Regular</option>
            <option value="500">500 Medium</option>
            <option value="600">600 Semi Bold</option>
            <option value="700">700 Bold</option>
            <option value="800">800 Extra Bold</option>
            <option value="900">900 Black</option>
          </select>
          
          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Size</span>
              <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#0f172a' : '#f1f5f9', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius: '4px' }}>
                 <button onClick={() => handleUpdate({ fontSize: Math.max(8, ((firstObj as any).fontSize || 16) - 1) })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 4px' }}><Minus size={12}/></button>
                 <input type="number" min="8" max="200" value={(firstObj as any).fontSize || 16} onChange={(e) => handleUpdate({ fontSize: Number(e.target.value) })} style={{ ...inputStyle, border: 'none', width: '36px', textAlign: 'center' }} />
                 <button onClick={() => handleUpdate({ fontSize: Math.min(200, ((firstObj as any).fontSize || 16) + 1) })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 4px' }}><Plus size={12}/></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: isDark ? '#0f172a' : '#f1f5f9', padding: '2px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}>
               <button onClick={() => {
                  const w = (firstObj as any).fontWeight || '400';
                  const i = (firstObj as any).fontStyle?.includes('italic');
                  const newW = (w === '700' || w === 'bold') ? '400' : '700';
                  handleUpdate({ fontWeight: newW, fontStyle: `${newW} ${i ? 'italic' : ''}`.trim() });
               }} style={iconBtn((firstObj as any).fontWeight === '700' || (firstObj as any).fontStyle?.includes('bold') || (firstObj as any).fontWeight === 'bold')}><Bold size={14}/></button>
               <button onClick={() => {
                  const w = (firstObj as any).fontWeight || '400';
                  const i = (firstObj as any).fontStyle?.includes('italic');
                  handleUpdate({ fontStyle: `${w} ${!i ? 'italic' : ''}`.trim() });
               }} style={iconBtn((firstObj as any).fontStyle?.includes('italic'))}><Italic size={14}/></button>
               <button onClick={() => handleUpdate({ underline: !(firstObj as any).underline })} style={iconBtn((firstObj as any).underline)}><Underline size={14}/></button>
               <button onClick={() => handleUpdate({ strikethrough: !(firstObj as any).strikethrough })} style={iconBtn((firstObj as any).strikethrough)}><Strikethrough size={14}/></button>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '100%', background: isDark ? '#0f172a' : '#f1f5f9', padding: '2px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', justifyContent: 'space-between' }}>
              <button onClick={() => handleTextCase('none')} style={{ ...iconBtn((firstObj as any).textTransform === 'none' || !(firstObj as any).textTransform), flex: 1, fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</button>
              <button onClick={() => handleTextCase('uppercase')} style={{ ...iconBtn((firstObj as any).textTransform === 'uppercase'), flex: 1, fontSize: '0.7rem', fontWeight: 'bold' }}>AA</button>
              <button onClick={() => handleTextCase('lowercase')} style={{ ...iconBtn((firstObj as any).textTransform === 'lowercase'), flex: 1, fontSize: '0.7rem', fontWeight: 'bold' }}>aa</button>
              <button onClick={() => handleTextCase('capitalize')} style={{ ...iconBtn((firstObj as any).textTransform === 'capitalize'), flex: 1, fontSize: '0.7rem', fontWeight: 'bold' }}>Aa</button>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '100%', background: isDark ? '#0f172a' : '#f1f5f9', padding: '2px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', justifyContent: 'space-between' }}>
              <button onClick={() => handleUpdate({ verticalAlign: 'top' })} style={{ ...iconBtn((firstObj as any).verticalAlign === 'top' || !(firstObj as any).verticalAlign), flex: 1 }}><AlignVerticalJustifyStart size={14}/></button>
              <button onClick={() => handleUpdate({ verticalAlign: 'middle' })} style={{ ...iconBtn((firstObj as any).verticalAlign === 'middle'), flex: 1 }}><AlignVerticalJustifyCenter size={14}/></button>
              <button onClick={() => handleUpdate({ verticalAlign: 'bottom' })} style={{ ...iconBtn((firstObj as any).verticalAlign === 'bottom'), flex: 1 }}><AlignVerticalJustifyEnd size={14}/></button>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '100%', background: isDark ? '#0f172a' : '#f1f5f9', padding: '2px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', justifyContent: 'space-between' }}>
               <button onClick={() => handleUpdate({ align: 'left' })} style={{ ...iconBtn((firstObj as any).align === 'left' || !(firstObj as any).align), flex: 1 }}><AlignLeft size={14}/></button>
               <button onClick={() => handleUpdate({ align: 'center' })} style={{ ...iconBtn((firstObj as any).align === 'center'), flex: 1 }}><AlignCenter size={14}/></button>
               <button onClick={() => handleUpdate({ align: 'right' })} style={{ ...iconBtn((firstObj as any).align === 'right'), flex: 1 }}><AlignRight size={14}/></button>
               <button onClick={() => handleUpdate({ align: 'justify' })} style={{ ...iconBtn((firstObj as any).align === 'justify'), flex: 1 }}><AlignJustify size={14}/></button>
            </div>
          </div>
          
          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '24px' }}>LineH</span>
              <input type="number" step="0.1" min="0.5" max="3" value={(firstObj as any).lineHeight || 1.2} onChange={(e) => handleUpdate({ lineHeight: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '24px' }}>Space</span>
              <input type="number" min="-5" max="20" value={(firstObj as any).letterSpacing || 0} onChange={(e) => handleUpdate({ letterSpacing: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '24px' }}>Pad</span>
              <input type="number" min="0" max="100" value={(firstObj as any).padding || 0} onChange={(e) => handleUpdate({ padding: Number(e.target.value) })} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '4px', width: '50%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '24px' }}>BG</span>
              <input type="color" value={(firstObj as any).backgroundColor || '#ffffff'} onChange={(e) => handleUpdate({ backgroundColor: e.target.value })} style={{ width: '32px', height: '24px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <button 
                onClick={() => handleUpdate({ backgroundColor: undefined })}
                style={{ ...iconBtn(false), padding: '2px 4px', fontSize: '0.7rem' }}
                title="Clear Background"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE PROPERTIES */}
      {firstObj.type === 'table' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid3X3 size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <span style={labelStyle}>Table Structure</span>
          </div>
          
          <div style={rowStyle}>
            <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '30px' }}>Rows</span>
              <input 
                type="number" min="1" max="20"
                value={(firstObj as any).rows || 3} 
                onChange={(e) => {
                  const newRows = Math.max(1, Number(e.target.value));
                  const newData = resizeData((firstObj as any).data || [], newRows, (firstObj as any).cols || 3);
                  handleUpdate({ rows: newRows, data: newData, height: newRows * 36 });
                }} 
                style={inputStyle} 
              />
            </div>
            <div style={{ display: 'flex', gap: '4px', width: '50%' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '30px' }}>Cols</span>
              <input 
                type="number" min="1" max="20"
                value={(firstObj as any).cols || 3} 
                onChange={(e) => {
                  const newCols = Math.max(1, Number(e.target.value));
                  const newData = resizeData((firstObj as any).data || [], (firstObj as any).rows || 3, newCols);
                  handleUpdate({ cols: newCols, data: newData, width: newCols * 130 });
                }} 
                style={inputStyle} 
              />
            </div>
          </div>

          <div style={rowStyle}>
            <button 
              onClick={() => {
                const r = ((firstObj as any).rows || 3) + 1;
                const c = (firstObj as any).cols || 3;
                handleUpdate({ rows: r, data: resizeData((firstObj as any).data || [], r, c), height: r * 36 });
              }}
              style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12}/> Add Row
            </button>
            <button 
              onClick={() => {
                const r = Math.max(1, ((firstObj as any).rows || 3) - 1);
                const c = (firstObj as any).cols || 3;
                handleUpdate({ rows: r, data: resizeData((firstObj as any).data || [], r, c), height: r * 36 });
              }}
              style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
            >
              <Minus size={12}/> Remove Row
            </button>
          </div>

          <div style={rowStyle}>
            <button 
              onClick={() => {
                const r = (firstObj as any).rows || 3;
                const c = ((firstObj as any).cols || 3) + 1;
                handleUpdate({ cols: c, data: resizeData((firstObj as any).data || [], r, c), width: c * 130 });
              }}
              style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12}/> Add Column
            </button>
            <button 
              onClick={() => {
                const r = (firstObj as any).rows || 3;
                const c = Math.max(1, ((firstObj as any).cols || 3) - 1);
                handleUpdate({ cols: c, data: resizeData((firstObj as any).data || [], r, c), width: c * 130 });
              }}
              style={{ ...inputStyle, width: '48%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
            >
              <Minus size={12}/> Remove Column
            </button>
          </div>

          {/* Header Row Toggle */}
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Header Row</span>
            <button
              onClick={() => handleUpdate({ hasHeader: !(firstObj as any).hasHeader })}
              style={{ ...iconBtn(!!(firstObj as any).hasHeader !== false), padding: '4px 8px', fontSize: '0.7rem' }}
            >
              {(firstObj as any).hasHeader === false ? 'Off' : 'On'}
            </button>
          </div>

          {/* Table Theme */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={labelStyle}>Table Theme</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {Object.entries({
                blue: '#1e40af', slate: '#1e293b', emerald: '#065f46',
                rose: '#9f1239', amber: '#92400e', purple: '#4c1d95'
              }).map(([name, color]) => (
                <button
                  key={name}
                  title={name.charAt(0).toUpperCase() + name.slice(1)}
                  onClick={() => handleUpdate({ tableTheme: name })}
                  style={{
                    width: '24px', height: '24px', borderRadius: '4px',
                    background: color, border: (firstObj as any).tableTheme === name
                      ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: (firstObj as any).tableTheme === name ? '0 0 0 2px rgba(59,130,246,0.4)' : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Text Color</span>
            <input type="color" value={(firstObj as any).tableTextColor || '#0f172a'} onChange={(e) => handleUpdate({ tableTextColor: e.target.value })} style={{ width: '28px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
          </div>
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Border Color</span>
            <input type="color" value={(firstObj as any).tableBorderColor || '#93c5fd'} onChange={(e) => handleUpdate({ tableBorderColor: e.target.value })} style={{ width: '28px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
          </div>

          {/* Font Size */}
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Font Size</span>
            <div style={{ display: 'flex', alignItems: 'center', background: isDark ? '#0f172a' : '#f1f5f9', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', borderRadius: '4px' }}>
              <button onClick={() => handleUpdate({ tableFontSize: Math.max(8, ((firstObj as any).tableFontSize || 13) - 1) })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 5px' }}><Minus size={11}/></button>
              <input type="number" min="8" max="32" value={(firstObj as any).tableFontSize || 13} onChange={(e) => handleUpdate({ tableFontSize: Number(e.target.value) })} style={{ ...inputStyle, border: 'none', width: '36px', textAlign: 'center' }} />
              <button onClick={() => handleUpdate({ tableFontSize: Math.min(32, ((firstObj as any).tableFontSize || 13) + 1) })} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px 5px' }}><Plus size={11}/></button>
            </div>
          </div>

          {/* Reset column widths */}
          <button
            onClick={() => handleUpdate({ colWidths: undefined })}
            style={{ ...inputStyle, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '4px' }}
          >
            Reset Column Widths
          </button>
        </div>
      )}

      {/* VIDEO PROPERTIES */}
      {firstObj.type === 'video' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Film size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <span style={labelStyle}>Video Settings</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>YouTube URL</span>
            <input 
              type="text" 
              value={(firstObj as any).src || ''} 
              onChange={(e) => {
                let url = e.target.value;
                if (url.includes('youtube.com/watch?v=')) {
                  url = url.replace('watch?v=', 'embed/');
                  const ampersandPos = url.indexOf('&');
                  if (ampersandPos !== -1) {
                    url = url.substring(0, ampersandPos);
                  }
                } else if (url.includes('youtu.be/')) {
                  url = url.replace('youtu.be/', 'youtube.com/embed/');
                  const queryPos = url.indexOf('?');
                  if (queryPos !== -1) {
                    url = url.substring(0, queryPos);
                  }
                }
                handleUpdate({ src: url });
              }}
              style={{ ...inputStyle, width: '100%' }} 
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      )}

      {/* EQUATION PROPERTIES */}
      {firstObj.type === 'equation' && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sigma size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            <span style={labelStyle}>LaTeX Equation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Preview</span>
            <textarea 
              value={(firstObj as any).latex || ''}
              onChange={(e) => handleUpdate({ latex: e.target.value })}
              style={{ ...inputStyle, width: '100%', height: '60px', resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {/* ARROW PROPERTIES */}
      {firstObj.type === 'arrow' && (
        <div style={sectionStyle}>
          <span style={labelStyle}>Arrow Settings</span>
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Routing</span>
            <select 
              value={(firstObj as any).arrowType || 'straight'}
              onChange={(e) => handleUpdate({ arrowType: e.target.value })}
              style={{ ...inputStyle, width: '100px' }}
            >
              <option value="straight">Straight</option>
              <option value="orthogonal">Orthogonal</option>
            </select>
          </div>
        </div>
      )}

      {/* COLORS — Context-Aware */}
      <div style={sectionStyle}>
        <span style={labelStyle}>
          {['line', 'arrow'].includes(firstObj.type) ? 'Stroke' : firstObj.type === 'text' ? 'Color' : 'Appearance'}
        </span>
        
        {/* Fill — shapes, circles, images */}
        {['rectangle', 'circle', 'image'].includes(firstObj.type) && (
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Fill</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="color" value={(firstObj as any).fill || '#000000'} onChange={(e) => handleUpdate({ fill: e.target.value })} style={{ width: '28px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <button onClick={() => handleUpdate({ fill: 'transparent' })} style={{ ...iconBtn((firstObj as any).fill === 'transparent'), padding: '2px 6px', fontSize: '0.65rem' }} title="No Fill">∅</button>
            </div>
          </div>
        )}

        {/* Text Color */}
        {firstObj.type === 'text' && (
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Text Color</span>
            <input type="color" value={(firstObj as any).fill || '#000000'} onChange={(e) => handleUpdate({ fill: e.target.value })} style={{ width: '28px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
          </div>
        )}

        {/* Stroke / Border Color + Width */}
        {['rectangle', 'circle', 'line', 'image', 'arrow'].includes(firstObj.type) && (
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>{['line', 'arrow'].includes(firstObj.type) ? 'Color' : 'Border'}</span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="color" value={(firstObj as any).stroke || '#000000'} onChange={(e) => handleUpdate({ stroke: e.target.value })} style={{ width: '28px', height: '22px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <input type="number" min="0" max="50" value={(firstObj as any).strokeWidth || 0} onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })} style={{...inputStyle, width: '42px'}} />
            </div>
          </div>
        )}

        {/* Stroke Style — all strokeable types */}
        {['rectangle', 'circle', 'line', 'arrow'].includes(firstObj.type) && (
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Style</span>
            <select 
              value={(firstObj as any).dash ? ((firstObj as any).dash[0] === 5 ? 'dotted' : 'dashed') : 'solid'} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'solid') handleUpdate({ dash: undefined });
                else if (val === 'dashed') handleUpdate({ dash: [10, 10] });
                else if (val === 'dotted') handleUpdate({ dash: [5, 5] });
              }} 
              style={{ ...inputStyle, width: '80px' }}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        )}

        {/* Corner Radius */}
        {firstObj.type === 'rectangle' && (
          <div style={rowStyle}>
            <span style={{ fontSize: '0.75rem' }}>Radius</span>
            <input type="number" min="0" max="200" value={(firstObj as any).cornerRadius || 0} onChange={(e) => handleUpdate({ cornerRadius: Number(e.target.value) })} style={inputStyle} />
          </div>
        )}
      </div>

      {/* SHADOWS */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={labelStyle}>Drop Shadow</span>
          <input type="color" value={(firstObj as any).shadowColor === 'rgba(0,0,0,0)' || !(firstObj as any).shadowColor ? '#000000' : (firstObj as any).shadowColor} onChange={(e) => handleUpdate({ shadowColor: e.target.value, shadowOpacity: 1 })} style={{ width: '20px', height: '20px', padding: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} />
        </div>
        
        <div style={rowStyle}>
          <div style={{ display: 'flex', gap: '4px', width: '33%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>X</span>
            <input type="number" value={(firstObj as any).shadowOffsetX || 0} onChange={(e) => handleUpdate({ shadowOffsetX: Number(e.target.value) })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '33%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '12px' }}>Y</span>
            <input type="number" value={(firstObj as any).shadowOffsetY || 0} onChange={(e) => handleUpdate({ shadowOffsetY: Number(e.target.value) })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '4px', width: '33%' }}>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', alignSelf: 'center', width: '24px' }}>Blur</span>
            <input type="number" min="0" value={(firstObj as any).shadowBlur || 0} onChange={(e) => handleUpdate({ shadowBlur: Number(e.target.value) })} style={inputStyle} />
          </div>
        </div>
      </div>
      
    </div>
  );
};
