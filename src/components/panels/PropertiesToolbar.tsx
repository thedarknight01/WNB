import { useContext } from 'react';
import { BoardContext, useBoardStore } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { Copy, FlipHorizontal, FlipVertical, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, Group, Ungroup } from 'lucide-react';

export const PropertiesToolbar = () => {
  const store = useContext(BoardContext);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const objectsById = useBoardStore(s => s.objectsById);
  const updateObject = useBoardStore(s => s.updateObject);
  const duplicateSelected = useBoardStore(s => s.duplicateSelected);
  const bringToFront = useBoardStore(s => s.bringToFront);
  const sendToBack = useBoardStore(s => s.sendToBack);
  const groupSelected = useBoardStore(s => s.groupSelected);
  const ungroupSelected = useBoardStore(s => s.ungroupSelected);
  const addTableRow = useBoardStore(s => s.addTableRow);
  const addTableColumn = useBoardStore(s => s.addTableColumn);
  const removeTableRow = useBoardStore(s => s.removeTableRow);
  const removeTableColumn = useBoardStore(s => s.removeTableColumn);
  const setObjectLabel = useBoardStore(s => s.setObjectLabel);
  const { theme, customFonts } = useSettingsStore();
  const firstObj = selectedIds.length > 0 ? objectsById[selectedIds[0]] : undefined;

  if (!store || !firstObj) return null;

  const isDark = theme === 'dark' || theme === 'midnight';
  const update = (updates: Record<string, unknown>) => {
    store.getState().saveHistory();
    selectedIds.forEach(id => updateObject(id, updates));
  };
  const inputStyle = {
    width: '58px',
    padding: '4px 6px',
    borderRadius: '5px',
    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
    background: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#f8fafc' : '#0f172a',
    fontSize: '0.72rem',
  };
  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 7px',
    borderRadius: '5px',
    border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
    background: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#f8fafc' : '#0f172a',
    cursor: 'pointer',
  } as const;
  const labelStyle = { fontSize: '0.64rem', color: isDark ? '#94a3b8' : '#64748b' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '5px 10px', borderRadius: '8px', background: isDark ? '#111827' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
      {(['x', 'y'] as const).map(key => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={labelStyle}>{key.toUpperCase()}</span>
          <input type="number" value={Math.round(firstObj[key])} onChange={e => update({ [key]: Number(e.target.value) })} style={inputStyle} />
        </label>
      ))}
      {(['width', 'height'] as const).map(key => (
        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={labelStyle}>{key === 'width' ? 'W' : 'H'}</span>
          <input type="number" value={Math.round((firstObj as any)[key] || 0)} onChange={e => update({ [key]: Number(e.target.value) })} style={inputStyle} disabled={firstObj.type === 'line' || firstObj.type === 'circle' || (key === 'height' && firstObj.type === 'text')} />
        </label>
      ))}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>R°</span>
        <input type="number" value={Math.round(firstObj.rotation || 0)} onChange={e => update({ rotation: Number(e.target.value) })} style={inputStyle} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>Op%</span>
        <input type="number" min="0" max="100" value={Math.round((firstObj.opacity ?? 1) * 100)} onChange={e => update({ opacity: Number(e.target.value) / 100 })} style={inputStyle} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>Fill</span>
        <input type="color" value={(firstObj as any).fill || '#3b82f6'} onChange={e => update({ fill: e.target.value })} style={{ width: '30px', height: '25px', padding: 0, border: 0 }} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>Border</span>
        <input
          type="color"
          value={(firstObj as any).tableBorderColor || (firstObj as any).stroke || '#1e293b'}
          onChange={e => update(firstObj.type === 'table' ? { tableBorderColor: e.target.value } : { stroke: e.target.value })}
          style={{ width: '30px', height: '25px', padding: 0, border: 0 }}
        />
      </label>
      {firstObj.type !== 'table' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={labelStyle}>Line</span>
          <input type="number" min="0" max="40" value={Math.round((firstObj as any).strokeWidth || 0)} onChange={e => update({ strokeWidth: Number(e.target.value) })} style={inputStyle} />
        </label>
      )}
      {firstObj.type === 'text' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={labelStyle}>Font</span>
          <select value={(firstObj as any).fontFamily || 'Arial'} onChange={e => update({ fontFamily: e.target.value })} style={{ ...inputStyle, width: '105px' }}>
            {customFonts.map(font => <option key={font} value={font}>{font}</option>)}
          </select>
        </label>
      )}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={labelStyle}>Label</span>
        <input
          type="text"
          value={(firstObj as any).groupLabel || (firstObj as any).label || ''}
          placeholder="Diagram label"
          onChange={e => setObjectLabel(firstObj.parentId || firstObj.id, e.target.value)}
          style={{ ...inputStyle, width: '120px' }}
        />
      </label>
      {firstObj.type === 'table' && (
        <>
          <select value={(firstObj as any).tableTheme || 'blue'} onChange={e => update({ tableTheme: e.target.value })} style={{ ...inputStyle, width: '90px' }}>
            {['blue', 'slate', 'emerald', 'rose', 'amber', 'purple'].map(themeName => <option key={themeName} value={themeName}>{themeName}</option>)}
          </select>
          <button onClick={() => addTableRow(firstObj.id)} style={buttonStyle} title="Add row">+ Row</button>
          <button onClick={() => addTableColumn(firstObj.id)} style={buttonStyle} title="Add column">+ Col</button>
          <button onClick={() => removeTableRow(firstObj.id)} style={buttonStyle} title="Remove row">- Row</button>
          <button onClick={() => removeTableColumn(firstObj.id)} style={buttonStyle} title="Remove column">- Col</button>
        </>
      )}
      <button onClick={() => update({ scaleX: ((firstObj as any).scaleX || 1) * -1 })} style={buttonStyle} title="Flip horizontally"><FlipHorizontal size={14} /></button>
      <button onClick={() => update({ scaleY: ((firstObj as any).scaleY || 1) * -1 })} style={buttonStyle} title="Flip vertically"><FlipVertical size={14} /></button>
      <button onClick={() => update({ locked: !firstObj.locked, draggable: !!firstObj.locked })} style={buttonStyle} title={firstObj.locked ? 'Unlock' : 'Lock'}>{firstObj.locked ? <Unlock size={14} /> : <Lock size={14} />}</button>
      <button onClick={duplicateSelected} style={buttonStyle} title="Duplicate"><Copy size={14} /></button>
      <button onClick={bringToFront} style={buttonStyle} title="Bring to front"><ArrowUpToLine size={14} /></button>
      <button onClick={sendToBack} style={buttonStyle} title="Send to back"><ArrowDownToLine size={14} /></button>
      {selectedIds.length > 1 && <button onClick={groupSelected} style={buttonStyle} title="Group selection"><Group size={14} /></button>}
      {selectedIds.some(id => objectsById[id]?.parentId) && <button onClick={ungroupSelected} style={buttonStyle} title="Ungroup selection"><Ungroup size={14} /></button>}
      {firstObj.type === 'text' && (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={labelStyle}>Size</span>
            <input type="number" min="1" value={Math.round((firstObj as any).fontSize || 16)} onChange={e => update({ fontSize: Number(e.target.value) })} style={inputStyle} />
          </label>
          <button onClick={() => update({ fontStyle: (firstObj as any).fontStyle === 'bold' ? 'normal' : 'bold' })} style={buttonStyle} title="Bold"><b>B</b></button>
          <button onClick={() => update({ textDecoration: (firstObj as any).textDecoration === 'underline' ? '' : 'underline' })} style={buttonStyle} title="Underline"><u>U</u></button>
        </>
      )}
    </div>
  );
};
