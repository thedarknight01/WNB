import { useState, useEffect } from 'react';
import { useBoardStore } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { Tag, Group, Trash2, Check, X } from 'lucide-react';

export const ContextMenu = () => {
  const contextMenu = useBoardStore(s => s.contextMenu);
  const setContextMenu = useBoardStore(s => s.setContextMenu);
  const objectsById = useBoardStore(s => s.objectsById);
  const objectIds = useBoardStore(s => s.objectIds);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const setObjectLabel = useBoardStore(s => s.setObjectLabel);
  const groupSelected = useBoardStore(s => s.groupSelected);
  const ungroupSelected = useBoardStore(s => s.ungroupSelected);
  const deleteSelected = useBoardStore(s => s.deleteSelected);
  const objects = objectIds.map(id => objectsById[id]).filter(Boolean);const { theme } = useSettingsStore();
  const [isLabeling, setIsLabeling] = useState(false);
  const [labelValue, setLabelValue] = useState('');

  const isDark = theme === 'dark' || theme === 'midnight';

const currentObject = contextMenu ? objects.find((o: any) => o.id === contextMenu.id || o.parentId === contextMenu.id) : null;
  const hasGroupSelection = selectedIds.some(id => objectsById[id]?.parentId);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [setContextMenu]);

  if (!contextMenu) {
    if (isLabeling) setIsLabeling(false);
    return null;
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); 
    action();
    setContextMenu(null);
  };

  const menuStyle = {
    position: 'absolute' as const, top: contextMenu.y, left: contextMenu.x,
    backgroundColor: isDark ? '#1e293b' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a',
    borderRadius: '8px', padding: '4px',
    boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.15)',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    zIndex: 100, minWidth: '160px',
  };

  const itemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
    cursor: 'pointer', borderRadius: '4px', fontSize: '0.875rem',
  };

  if (isLabeling) {
    return (
      <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px' }}>
          <input 
            autoFocus
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { setObjectLabel(contextMenu.id, labelValue); setContextMenu(null); }
            }}
            placeholder="Diagram name..."
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'inherit', width: '120px' }}
          />
          <button onClick={() => { setObjectLabel(contextMenu.id, labelValue); setContextMenu(null); }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Check size={16} /></button>
          <button onClick={() => setContextMenu(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div style={menuStyle}>
      <div 
        style={itemStyle} 
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={(e) => { 
          e.stopPropagation(); 
          // NEW: Reset the input to the actual label of the clicked object!
          setLabelValue(currentObject?.groupLabel || currentObject?.label || ''); 
          setIsLabeling(true); 
        }}
      >
        <Tag size={16} /> Set Label
      </div>
      
      {selectedIds.length > 1 && !hasGroupSelection && (
        <div 
          style={itemStyle} 
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={(e) => handleAction(e, groupSelected)}
        >
          <Group size={16} /> Group Items
        </div>
      )}
      {hasGroupSelection && (
        <div
          style={itemStyle}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f1f5f9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onClick={(e) => handleAction(e, ungroupSelected)}
        >
          <Group size={16} /> Ungroup Items
        </div>
      )}

      <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '4px 0' }} />

      <div 
        style={{ ...itemStyle, color: '#ef4444' }} 
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#fef2f2'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={(e) => handleAction(e, deleteSelected)}
      >
        <Trash2 size={16} /> Delete
      </div>
    </div>
  );
};