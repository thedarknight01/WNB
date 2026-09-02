import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../core/store/useAppStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import {
  X, Plus, FileText, Cloud, LayoutDashboard, Columns,
  ChevronDown, Pencil, Copy
} from 'lucide-react';

export const TabBar = ({ pane = 'main' }: { pane?: 'main' | 'split' }) => {
  const {
    documents, tabs, splitTabs, activeTabId, splitTabId,
    openTab, closeTab, setActiveTab, setSplitTab, createDocument, updateDocument,
    moveToMain, moveToSplit
  } = useAppStore();
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

  const currentTabId = pane === 'main' ? activeTabId : splitTabId;
  const currentPaneTabs = pane === 'main' ? tabs : splitTabs;

  const [contextMenu, setContextMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contextMenu && !(e.target as Element).closest('.tab-ctx-menu')) setContextMenu(null);
      if (showNewMenu && newMenuRef.current && !newMenuRef.current.contains(e.target as Node) && !(e.target as Element).closest('.new-tab-menu')) setShowNewMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu, showNewMenu]);

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ tabId, x: e.clientX, y: e.clientY });
  };

  const startEditing = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setEditingTitle(currentTitle);
    setContextMenu(null);
  };

  const commitEdit = () => {
    if (editingTabId && editingTitle.trim()) {
      updateDocument(editingTabId, { title: editingTitle.trim() });
    }
    setEditingTabId(null);
  };

  const bg = isDark ? '#0a0f1e' : '#edf0f7';
  const activeTabBg = isDark ? '#1e293b' : '#ffffff';
  const inactiveColor = isDark ? '#64748b' : '#6b7280';
  const border = isDark ? '#1e293b' : '#d1d5db';

  const menuBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
    padding: '7px 10px', background: 'transparent', border: 'none',
    cursor: 'pointer', color: isDark ? '#e2e8f0' : '#1f2937',
    borderRadius: '7px', fontSize: '0.82rem', fontWeight: 500, textAlign: 'left',
  };

  return (
    <>
      <div 
        style={{
          display: 'flex', background: bg,
          borderBottom: `1px solid ${border}`,
          height: '32px', alignItems: 'flex-end',
          padding: '0 8px', gap: '2px',
          userSelect: 'none', position: 'relative', zIndex: 100,
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const tabIdToMove = e.dataTransfer.getData('application/x-visualboard-tab');
          if (tabIdToMove && !currentPaneTabs.includes(tabIdToMove)) {
            if (pane === 'split') {
              moveToSplit(tabIdToMove);
            } else {
              moveToMain(tabIdToMove);
            }
          }
        }}
      >
        {/* Tabs */}
        {currentPaneTabs.map(tabId => {
          const doc = documents.find(d => d.id === tabId);
          if (!doc) return null;
          const isActive = currentTabId === tabId;
          const isSplit = pane === 'main' ? (splitTabId === tabId) : (activeTabId === tabId);
          const isHovered = hoveredTab === tabId;
          const Icon = doc.type === 'notebook' ? FileText : LayoutDashboard;
          const iconColor = doc.type === 'notebook' ? '#f59e0b' : '#3b82f6';
          const accentColor = isSplit ? '#8b5cf6' : '#3b82f6';

          return (
            <div
              key={tabId}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-visualboard-tab', tabId);
              }}
              onClick={() => pane === 'main' ? setActiveTab(tabId) : setSplitTab(tabId)}
              onContextMenu={(e) => handleContextMenu(e, tabId)}
              onMouseEnter={() => setHoveredTab(tabId)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: isActive ? activeTabBg : isHovered ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') : 'transparent',
                color: isActive ? (isDark ? '#f1f5f9' : '#111827') : inactiveColor,
                padding: '0 10px',
                height: isActive ? '29px' : '27px',
                borderTopLeftRadius: '8px', borderTopRightRadius: '8px',
                borderTop: `2px solid ${isActive ? accentColor : 'transparent'}`,
                borderLeft: isActive ? `1px solid ${border}` : '1px solid transparent',
                borderRight: isActive ? `1px solid ${border}` : '1px solid transparent',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: isActive ? 600 : 400,
                minWidth: '110px', maxWidth: '180px',
                transition: 'all 0.12s ease', position: 'relative',
              }}
            >
              <Icon size={13} color={iconColor} style={{ flexShrink: 0 }} />
              {editingTabId === tabId ? (
                <input
                  autoFocus value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingTabId(null); }}
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', padding: 0, minWidth: 0 }}
                />
              ) : (
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {doc.title}
                  {doc.isCloudLinked && <span title="Synced to Cloud" style={{ display: 'flex' }}><Cloud size={10} color="#10b981" /></span>}
                </span>
              )}
              {isSplit && !isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', flexShrink: 0 }} />}
              {(isActive || isHovered) && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tabId, pane === 'split'); }}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: inactiveColor, borderRadius: '4px', flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = inactiveColor; }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', paddingBottom: '4px' }} ref={newMenuRef}>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              if (!showNewMenu && newMenuRef.current) {
                const rect = newMenuRef.current.getBoundingClientRect();
                setMenuPos({ top: rect.bottom + 4, left: rect.left });
              }
              setShowNewMenu(v => !v);
            }}
            style={{
              background: showNewMenu ? (isDark ? '#334155' : '#e5e7eb') : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px',
              color: inactiveColor, padding: '4px 6px', borderRadius: '6px', transition: 'all 0.15s',
            }}
          >
            <Plus size={15} />
            <ChevronDown size={10} style={{ transform: showNewMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          {showNewMenu && createPortal(
            <div className="new-tab-menu" style={{
              position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 99999,
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${border}`, borderRadius: '10px', padding: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)', minWidth: '175px',
            }}>
              {([
                { type: 'whiteboard' as const, icon: LayoutDashboard, label: 'New Whiteboard', color: '#3b82f6' },
                { type: 'notebook' as const, icon: FileText, label: 'New Notebook', color: '#f59e0b' },
              ] as const).map(({ type, icon: Icon, label, color }) => (
                <button key={type} onMouseDown={(e) => { e.preventDefault(); createDocument(type).then(id => openTab(id, pane === 'split')); setShowNewMenu(false); }}
                  style={menuBtnStyle}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#334155' : '#f3f4f6')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={15} color={color} />{label}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>

        <div style={{ flex: 1 }} />

        </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="tab-ctx-menu" style={{
          position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 10000,
          background: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${border}`, borderRadius: '10px', padding: '6px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.22)', minWidth: '185px',
        }}>
          {([
            { icon: Pencil, label: 'Rename', color: '#3b82f6', action: () => { const d = documents.find(d => d.id === contextMenu.tabId); if (d) startEditing(contextMenu.tabId, d.title); } },
            { icon: Copy, label: 'Duplicate tab', color: '#10b981', action: () => { const d = documents.find(d => d.id === contextMenu.tabId); if (d) createDocument(d.type, d.title + ' (copy)').then(id => openTab(id, pane === 'split')); setContextMenu(null); } },
            { icon: Columns, label: pane === 'main' ? 'Move to split view' : 'Move to main view', color: '#8b5cf6', action: () => { pane === 'main' ? moveToSplit(contextMenu.tabId) : moveToMain(contextMenu.tabId); setContextMenu(null); } },
            { icon: X, label: 'Close tab', color: '#ef4444', action: () => { closeTab(contextMenu.tabId, pane === 'split'); setContextMenu(null); } },
          ] as const).map(({ icon: Icon, label, color, action }) => (
            <button key={label} onClick={action} style={menuBtnStyle}
              onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#334155' : '#f3f4f6')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon size={14} color={color} />{label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
