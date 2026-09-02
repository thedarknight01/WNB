import { useEffect, useState } from 'react';
import { useSettingsStore } from './core/store/useSettingsStore';
import { getActiveStore, useAppStore } from './core/store/useAppStore';

import { SettingsDashboard } from './components/panels/SettingsDashboard';
import { TabBar } from './components/layout/TabBar';
import { DocumentProvider } from './components/layout/DocumentProvider';
import { GlobalMenu } from './components/panels/GlobalMenu';
import { ContextualToolbar } from './components/panels/ContextualToolbar';
import { BoardContext } from './core/store/useBoardStore';
import { Trash2 } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { DocumentationPage } from './pages/DocumentationPage';
import { AboutPage } from './pages/AboutPage';
import { PolicyPage } from './pages/PolicyPage';


function App() {
  const { theme } = useSettingsStore();
  const { loadDocuments, activeTabId, splitTabId, focusedTabId, isSplitViewOpen, documents, isDocumentsLoaded } = useAppStore();
  const [, refreshFocusedStore] = useState(0);
  const focusedStore = getActiveStore();
  const isDark = theme === 'dark' || theme === 'midnight';
  const pathname = window.location.hash.replace('#', '') || '/';

  const [isResizing, setIsResizing] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // percentage

  useEffect(() => {
    const handleHashChange = () => refreshFocusedStore(v => v + 1);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const handleStoreReady = () => refreshFocusedStore(value => value + 1);
    window.addEventListener('board-store-ready', handleStoreReady);
    return () => window.removeEventListener('board-store-ready', handleStoreReady);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !splitTabId) return;
      const newRatio = (e.clientX / window.innerWidth) * 100;
      if (newRatio > 20 && newRatio < 80) setSplitRatio(newRatio);
    };
    
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, splitTabId]);

  if (pathname === '/') return <HomePage />;
  if (pathname === '/doc') return <DocumentationPage />;
  if (pathname === '/about') return <AboutPage />;
  if (pathname === '/policy') return <PolicyPage />;
  if (pathname !== '/board') {
    return <HomePage />;
  }

  return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
      <SettingsDashboard />
      <GlobalMenu />
      {focusedStore && (
        <BoardContext.Provider value={focusedStore}>
          <ContextualToolbar key={focusedTabId || 'active'} toolbarSlotId="global-toolbar-slot" />
        </BoardContext.Provider>
      )}
      <div 
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
        display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden',
        cursor: isResizing ? 'col-resize' : 'default', backgroundColor: isDark ? '#1e293b' : '#ffffff' 
      }}>
        
        {/* LEFT PANE */}
        <div 
          onMouseDownCapture={() => useAppStore.getState().setFocusedTab(activeTabId)}
          style={{ 
          display: 'flex', flexDirection: 'column', 
          width: isSplitViewOpen ? `${splitRatio}%` : '100%',
          flexShrink: 0, minWidth: 0, overflow: 'hidden',
          pointerEvents: isResizing ? 'none' : 'auto'
        }}>
          <TabBar pane="main" />
          {!isDocumentsLoaded ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#cbd5e1' : '#64748b' }}>Loading workspace...</div>
          ) : activeTabId ? (
            <DocumentProvider docId={activeTabId} key={`pane1-${activeTabId}`} />
          ) : (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? '#0a0f1e' : '#f8fafc',
              flexDirection: 'column', gap: '24px'
            }}>
              <img src="/logo.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: 16, boxShadow: '0 16px 40px rgba(59,130,246,0.2)' }} />
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a' }}>Welcome to WBN</h2>
                <p style={{ margin: '8px 0 0', color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.9rem' }}>Create a new document or open a recent file</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { type: 'whiteboard' as const, label: 'New Whiteboard', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                  { type: 'notebook' as const, label: 'New Notebook', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                ].map(({ type, label, color, bg }) => (
                  <button
                    key={type}
                    onClick={() => { useAppStore.getState().createDocument(type).then(id => useAppStore.getState().openTab(id)); }}
                    style={{
                      padding: '12px 24px', borderRadius: '12px', border: `1px solid ${color}40`,
                      background: bg, color, cursor: 'pointer',
                      fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {documents.length > 0 && (
                <div style={{ marginTop: '24px', width: '100%', maxWidth: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>Recent Files</h3>
                    <button onClick={() => { if (confirm('Clear all recent files?')) { documents.forEach(d => useAppStore.getState().deleteDoc(d.id)); } }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Trash2 size={12} /> Clear All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                    {documents.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '8px' }}>
                        <button onClick={() => useAppStore.getState().openTab(doc.id)} style={{ flex: 1, textAlign: 'left', background: 'transparent', border: 'none', color: isDark ? '#f1f5f9' : '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {doc.type === 'whiteboard' ? '🎨' : '📝'} {doc.title}
                        </button>
                        <button onClick={() => useAppStore.getState().deleteDoc(doc.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} title="Delete File">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RESIZE HANDLE */}
        {isSplitViewOpen && (
          <div 
            onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
            style={{
              width: '4px', backgroundColor: isResizing ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0'),
              cursor: 'col-resize', transition: 'background-color 0.2s ease', zIndex: 50,
              flexShrink: 0
            }} 
          />
        )}

        {/* RIGHT PANE */}
        {isSplitViewOpen && (
          <div 
            onMouseDownCapture={() => useAppStore.getState().setFocusedTab(splitTabId)}
            style={{ 
            display: 'flex', flexDirection: 'column', 
            width: `calc(${100 - splitRatio}% - 4px)`, flexShrink: 0, minWidth: 0, overflow: 'hidden',
            pointerEvents: isResizing ? 'none' : 'auto',
            borderLeft: isDark ? '1px solid #0f172a' : '1px solid #cbd5e1'
          }}>
            <TabBar pane="split" />
            {splitTabId ? (
              <DocumentProvider docId={splitTabId} key={`pane2-${splitTabId}`} />
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: isDark ? '#0a0f1e' : '#f8fafc', padding: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: isDark ? '#f1f5f9' : '#0f172a' }}>Select Document</h3>
                <p style={{ margin: '8px 0 24px', color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.9rem' }}>Choose an open document or create a new one to split</p>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    <button onClick={() => useAppStore.getState().createDocument('whiteboard').then(id => useAppStore.getState().openTab(id, true))} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #3b82f640', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem' }}>+ New Whiteboard</button>
                    <button onClick={() => useAppStore.getState().createDocument('notebook').then(id => useAppStore.getState().openTab(id, true))} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #f59e0b40', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: '0.85rem' }}>+ New Notebook</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '300px' }}>
                  {documents.filter(d => d.id !== activeTabId && !d.title.match(/^(Notebook|Whiteboard) \d+$/)).map(doc => (
                    <button key={doc.id} onClick={() => {
                        const state = useAppStore.getState();
                        if (state.tabs.includes(doc.id)) {
                          state.moveToSplit(doc.id);
                        } else {
                          state.openTab(doc.id, true);
                        }
                    }} style={{ textAlign: 'left', padding: '10px 16px', borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, background: 'transparent', color: isDark ? '#f8fafc' : '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {doc.type === 'whiteboard' ? '🎨' : '📝'} {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
