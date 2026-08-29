import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useAppStore, getActiveStore } from '../../core/store/useAppStore';
import { Settings, Columns, ChevronDown, FilePlus, Save, FolderOpen, Download } from 'lucide-react';

export const GlobalMenu = () => {
  const { theme, toggleSettings } = useSettingsStore();
  const isDark = theme === 'dark';
  
  const { isSplitViewOpen, toggleSplitView, activeMenuTab, setActiveMenuTab, focusedTabId, activeTabId, documents } = useAppStore();
  const focusedDocument = documents.find(document => document.id === (focusedTabId || activeTabId));
  const isNotebook = focusedDocument?.type === 'notebook';

  useEffect(() => {
    if (isNotebook && activeMenuTab === 'Property') setActiveMenuTab('Home');
  }, [activeMenuTab, isNotebook, setActiveMenuTab]);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) setFileMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNew = (type: 'whiteboard' | 'notebook') => {
    const appStore = useAppStore.getState();
    appStore.createDocument(type).then(id => {
      const storeApi = getActiveStore()?.getState();
      const inSplit = storeApi ? appStore.splitTabId === storeApi.docId : false;
      appStore.openTab(id, inSplit);
    });
    setFileMenuOpen(false);
  };

  const handleSave = () => {
    getActiveStore()?.getState()?.saveProject();
    setFileMenuOpen(false);
  };

  const handleExport = () => {
    window.dispatchEvent(new Event('export-canvas-image'));
    setFileMenuOpen(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.board';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) getActiveStore()?.getState()?.loadProject(ev.target.result as string);
      };
      reader.readAsText(file);
    };
    input.click();
    setFileMenuOpen(false);
  };

  const ribbonStyle = {
    display: 'flex', flexDirection: 'column' as const, width: '100%',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a', zIndex: 1000, position: 'relative' as const,
  };
  
  const tabContainerStyle = { display: 'flex', alignItems: 'center', padding: '6px 16px', gap: '8px', borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', position: 'relative' as const, zIndex: 1000 };
  
  const fileBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', cursor: 'pointer', background: fileMenuOpen ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent', border: 'none',
    color: isDark ? '#f8fafc' : '#0f172a', borderRadius: '4px',
    fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
  };

  const menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%',
    background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' as const,
    fontSize: '0.85rem'
  };

  const divider = { width: '1px', height: '16px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0 8px' };
  const navStyle = (tab: 'File' | 'Home' | 'Insert' | 'Property') => ({
    ...fileBtnStyle,
    background: activeMenuTab === tab ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
    color: activeMenuTab === tab ? '#3b82f6' : (isDark ? '#f8fafc' : '#0f172a'),
    opacity: tab === 'Property' && isNotebook ? 0.45 : 1,
    cursor: tab === 'Property' && isNotebook ? 'not-allowed' : 'pointer',
  });

  return (
    <div style={ribbonStyle}>
      <div style={tabContainerStyle}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
         <img src="/logo.png" alt="Logo" style={{ width: 26, height: 26, borderRadius: 6 }} />
       </div>

 {/* FILE MENU */}
 <div ref={fileMenuRef} style={{ position: 'relative' }}>
 <button style={navStyle('File')} onClick={() => { setActiveMenuTab('File'); setFileMenuOpen(!fileMenuOpen); }}>
 File <ChevronDown size={14} />
 </button>
 
 {fileMenuOpen && (
 <div style={{
 position: 'absolute', top: '100%', left: 0, marginTop: '4px',
 background: isDark ? '#1e293b' : '#ffffff',
 border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
 borderRadius: '6px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
 zIndex: 2000, display: 'flex', flexDirection: 'column', minWidth: '160px', padding: '4px 0'
 }}>
 <button onClick={() => handleNew('whiteboard')} style={menuItemStyle}><FilePlus size={14} /> New Whiteboard</button>
 <button onClick={() => handleNew('notebook')} style={menuItemStyle}><FilePlus size={14} /> New Notebook</button>
 <div style={{ height: '1px', background: isDark ? '#334155' : '#e2e8f0', margin: '4px 0' }} />
 <button onClick={handleSave} style={menuItemStyle}><Save size={14} /> Save</button>
 <button onClick={handleImport} style={menuItemStyle}><FolderOpen size={14} /> Open</button>
 <button onClick={handleExport} style={menuItemStyle}><Download size={14} /> Export Image</button>
 </div>
 )}
 </div>
 <button style={navStyle('Home')} onClick={() => setActiveMenuTab('Home')}>Home</button>
 <button style={navStyle('Insert')} onClick={() => setActiveMenuTab('Insert')}>Insert</button>
 <button
   style={navStyle('Property')}
   disabled={isNotebook}
   title={isNotebook ? 'Properties are available for whiteboards only' : 'Object properties'}
   onClick={() => { if (!isNotebook) setActiveMenuTab('Property'); }}
 >Property</button>
 
 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
 <button
 onClick={() => toggleSplitView()}
 title={isSplitViewOpen ? 'Close split view' : 'Enable split view'}
 style={{
 background: isSplitViewOpen ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
 border: isSplitViewOpen ? 'none' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
 color: isSplitViewOpen ? '#fff' : 'inherit',
 cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
 padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
 }}
 >
 <Columns size={14} />
 {isSplitViewOpen && <span>Split</span>}
 </button>
 <div style={divider} />
 <button onClick={toggleSettings} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
 <Settings size={16} />
 </button>
 </div>
 </div>
 </div>
 );
};
