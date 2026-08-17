import { useState, useEffect } from 'react';
import { InfiniteCanvas } from './components/canvas/InfiniteCanvas';
import {TopRibbon} from './components/panels/TopRibbon';
import { NotebookPanel } from './components/notebook/NotebookPanel';
import { useSettingsStore } from './core/store/useSettingsStore';
import { useBoardStore } from './core/store/useBoardStore';
import { SettingsDashboard } from './components/panels/SettingsDashboard';
import { PropertiesPanel } from './components/panels/PropertiesPanel';

function App() {
  const { viewMode, theme } = useSettingsStore();
  const { selectedIds } = useBoardStore();
  const isDark = theme === 'dark';
  
  const [notebookWidth, setNotebookWidth] = useState(400); 
  const [isResizing, setIsResizing] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || viewMode !== 'split') return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < Math.min(800, window.innerWidth - 200)) {
        setNotebookWidth(newWidth);
      }
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
  }, [isResizing, viewMode]);

  return (
    <>
      <SettingsDashboard />
      <div 
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
        display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', margin: 0, overflow: 'hidden',
        cursor: isResizing ? 'col-resize' : 'default', backgroundColor: isDark ? '#0f172a' : '#f8fafc' 
      }}>
        <div style={{ 
          display: 'flex', flex: 1, margin: 0, overflow: 'hidden',
          cursor: isResizing ? 'col-resize' : 'default', backgroundColor: isDark ? '#0f172a' : '#f8fafc' 
        }}>
          
          {/* LEFT PANEL: Canvas (Hidden if mode is Notebook Only) */}
          {viewMode !== 'notebook' && (
            <div style={{ 
              display: 'flex', flexDirection: 'column',
              flex: viewMode === 'canvas' ? 1 : undefined,
              width: viewMode === 'split' ? `calc(100vw - ${notebookWidth}px)` : '100%',
              position: 'relative', pointerEvents: isResizing ? 'none' : 'auto', minWidth: 0, overflow: 'hidden' 
            }}>
              <TopRibbon />
              <InfiniteCanvas />
            </div>
          )}

          {/* RESIZE HANDLE */}
          {viewMode === 'split' && (
            <div 
              onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
              style={{
                width: '6px', backgroundColor: isResizing ? '#3b82f6' : (isDark ? '#334155' : '#e2e8f0'),
                cursor: 'col-resize', transition: 'background-color 0.2s ease', zIndex: 50,
              }} 
            />
          )}

          {/* RIGHT PANEL: Notebook (Hidden if mode is Canvas Only) */}
          {viewMode !== 'canvas' && (
            <div style={{ 
              width: viewMode === 'notebook' ? '100%' : `${notebookWidth}px`, 
              flexShrink: 0, pointerEvents: isResizing ? 'none' : 'auto',
              boxShadow: isDark ? '-4px 0 15px rgba(0,0,0,0.2)' : '-4px 0 15px rgba(0,0,0,0.05)'
            }}>
              <NotebookPanel />
            </div>
          )}

          {/* PROPERTIES PANEL (Shown when an object is selected) */}
          {selectedIds.length > 0 && viewMode !== 'notebook' && (
            <div className="properties-panel-enter">
              <PropertiesPanel />
            </div>
          )}
          
        </div>
      </div>
    </>
  );
}

export default App;