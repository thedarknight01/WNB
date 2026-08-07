import { useState } from 'react';
import { useBoardStore} from '../../core/store/useBoardStore';
import type {Tool} from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { 
  MousePointer2, Hand, Pen, Square, Circle as CircleIcon, Type, Eraser, 
  Undo, Redo, Trash2, Settings, FilePlus, Save, FolderOpen, Download,
  Table, Image as ImageIcon, Sigma, Hash, Link, Video, Layout
} from 'lucide-react';

const symbolCategories = {
  Math: ['∑', '∏', '∫', '∂', '∞', '√', '±', '≈', '≠', '≤', '≥', '∈', '∉', '⊂', '⊃', '∪', '∩', '∧', '∨', '∀', '∃'],
  Greek: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'Γ', 'Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Σ', 'Φ', 'Ψ', 'Ω'],
  Arrows: ['←', '→', '↑', '↓', '↔', '⇐', '⇒', '⇑', '⇓', '⇔'],
  Shapes: ['★', '☆', '♠', '♣', '♥', '♦', '●', '○', '■', '□', '▲', '△', '▼', '▽', '◆', '◇'],
  Emoji: ['✓', '✗', '✦', '✧', '☀', '☁', '☂', '⚡', '☎', '✉', '✂', '✈', '⚓', '⚠', '♻', '⭐']
};

export const TopRibbon = () => {
  const [activeTab, setActiveTab] = useState<'File' | 'Home' | 'Insert' | 'Format'>('Home');
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({r: 0, c: 0});
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [equationLatex, setEquationLatex] = useState('E = mc^2');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPdfAlert, setShowPdfAlert] = useState(false);
  const {
    tool, setTool, isToolLocked,
    undo, redo, clearBoard
  } = useBoardStore();
  const { theme, toggleSettings } = useSettingsStore();

  const isDark = theme === 'dark';

  const handleToolClick = (t: Tool) => setTool(t, false);
  const handleToolDoubleClick = (t: Tool) => setTool(t, true);

  const handleImportProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.board';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          // Pass the file content to loadProject. If it's a blob/arraybuffer, we might need text.
          // In useBoardStore it decrypts string.
          useBoardStore.getState().loadProject(ev.target.result as string);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleInsertImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const dataUrl = ev.target.result as string;
          const img = new window.Image();
          img.src = dataUrl;
          img.onload = () => {
            const now = Date.now();
            const { camera } = useBoardStore.getState();
            useBoardStore.getState().addObject({
              id: `img-${now}`, name: 'image', type: 'image',
              zIndex: useBoardStore.getState().objectIds.length,
              x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
              rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
              createdAt: now, updatedAt: now,
              src: dataUrl, width: img.width, height: img.height,
              shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1
            } as any);
          };
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleInsertLinkClick = () => {
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const confirmInsertLink = () => {
    if (!linkUrl) return;
    const now = Date.now();
    const { camera } = useBoardStore.getState();
    useBoardStore.getState().addObject({
      id: `link-${now}`, name: 'link', type: 'text',
      zIndex: useBoardStore.getState().objectIds.length,
      x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now,
      text: linkUrl, width: 300, fontFamily: 'Arial', fontSize: 24, fontStyle: 'normal',
      fill: '#3b82f6', align: 'left', verticalAlign: 'top', lineHeight: 1.2, letterSpacing: 0, padding: 0,
      underline: true, strikethrough: false, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
      stroke: '', strokeWidth: 0
    } as any);
    setShowLinkModal(false);
  };

  const handleInsertHTMLNode = (type: 'table' | 'video' | 'equation' | 'symbol') => {
    if (type === 'table') { 
      setShowTablePicker(true);
      return;
    }
    if (type === 'video') { 
      setVideoUrl('');
      setShowVideoModal(true);
      return;
    }
    if (type === 'equation') { 
      setEquationLatex('E = mc^2');
      setShowEquationModal(true);
      return;
    }
    if (type === 'symbol') { 
      setShowSymbolPicker(true);
      return;
    }
  };

  const insertTable = (rows: number, cols: number) => {
    const now = Date.now();
    const { camera } = useBoardStore.getState();
    const extraData = { rows, cols, data: Array(rows).fill(0).map(() => Array(cols).fill('')) };
    useBoardStore.getState().addObject({
      id: `table-${now}`, name: 'table', type: 'table',
      zIndex: useBoardStore.getState().objectIds.length,
      x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now,
      width: 400, height: 300, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
      ...extraData
    } as any);
    setShowTablePicker(false);
  };

  const insertVideo = (src: string) => {
    const now = Date.now();
    const { camera } = useBoardStore.getState();
    useBoardStore.getState().addObject({
      id: `video-${now}`, name: 'video', type: 'video',
      zIndex: useBoardStore.getState().objectIds.length,
      x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now,
      width: 480, height: 270, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
      src
    } as any);
    setShowVideoModal(false);
  };

  const confirmInsertVideoUrl = () => {
    if (!videoUrl) return;
    let videoId = videoUrl;
    if (videoUrl.includes('v=')) videoId = videoUrl.split('v=')[1]?.split('&')[0];
    else if (videoUrl.includes('youtu.be/')) videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    else if (videoUrl.includes('shorts/')) videoId = videoUrl.split('shorts/')[1]?.split('?')[0];
    insertVideo(`https://www.youtube.com/embed/${videoId}`);
  };

  const handleVideoUpload = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        insertVideo(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmInsertEquation = () => {
    if (!equationLatex) return;
    const now = Date.now();
    const { camera } = useBoardStore.getState();
    useBoardStore.getState().addObject({
      id: `equation-${now}`, name: 'equation', type: 'equation',
      zIndex: useBoardStore.getState().objectIds.length,
      x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now,
      width: 300, height: 80, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
      latex: equationLatex
    } as any);
    setShowEquationModal(false);
  };

  // --- STYLES ---
  const ribbonStyle = {
    display: 'flex', flexDirection: 'column' as const, width: '100%',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a', zIndex: 100,
  };
  
  const tabContainerStyle = { display: 'flex', padding: '4px 16px 0 16px', gap: '16px', borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0' };
  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px', cursor: 'pointer', background: 'transparent', border: 'none',
    color: isActive ? '#3b82f6' : (isDark ? '#94a3b8' : '#64748b'),
    borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
    fontWeight: isActive ? 600 : 500, fontSize: '0.875rem'
  });

  const toolbarStyle = { display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 16px', minHeight: '56px' };
  const toolBtn = (isActive: boolean, isLocked: boolean = false) => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    padding: '6px 12px', background: isActive ? (isDark ? '#1e293b' : '#eff6ff') : 'transparent',
    color: isActive ? '#3b82f6' : 'inherit', border: isLocked ? '1px solid #3b82f6' : '1px solid transparent',
    borderRadius: '6px', cursor: 'pointer', gap: '4px', fontSize: '0.75rem',
    boxShadow: isLocked ? '0 0 12px rgba(59, 130, 246, 0.8), inset 0 0 4px rgba(59, 130, 246, 0.4)' : 'none', 
    transition: 'all 0.2s'
  });

  const divider = { width: '1px', height: '32px', backgroundColor: isDark ? '#334155' : '#e2e8f0' };

  return (
    <div style={ribbonStyle}>
      {/* TABS */}
      <div style={tabContainerStyle}>
        <button style={tabStyle(activeTab === 'File')} onClick={() => setActiveTab('File')}>File</button>
        <button style={tabStyle(activeTab === 'Home')} onClick={() => setActiveTab('Home')}>Home</button>
        <button style={tabStyle(activeTab === 'Insert')} onClick={() => setActiveTab('Insert')}>Insert</button>
        
        {/* LAYOUT SWITCHER DROPDOWN */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button 
            onClick={() => setIsLayoutOpen(!isLayoutOpen)} 
            style={{ ...toolBtn(isLayoutOpen), padding: '4px 8px', flexDirection: 'row' }}
          >
            <Layout size={16} /> View
          </button>
          
          {isLayoutOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
              background: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '8px', padding: '4px', display: 'flex', flexDirection: 'column',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 1000
            }}>
              <button onClick={() => { useSettingsStore.getState().setViewMode('canvas'); setIsLayoutOpen(false); }} style={{ ...toolBtn(useSettingsStore.getState().viewMode === 'canvas'), flexDirection: 'row', justifyContent: 'flex-start' }}>Canvas</button>
              <button onClick={() => { useSettingsStore.getState().setViewMode('split'); setIsLayoutOpen(false); }} style={{ ...toolBtn(useSettingsStore.getState().viewMode === 'split'), flexDirection: 'row', justifyContent: 'flex-start' }}>Split</button>
              <button onClick={() => { useSettingsStore.getState().setViewMode('notebook'); setIsLayoutOpen(false); }} style={{ ...toolBtn(useSettingsStore.getState().viewMode === 'notebook'), flexDirection: 'row', justifyContent: 'flex-start' }}>Notebook</button>
            </div>
          )}

          <div style={divider} />
          <button onClick={toggleSettings} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><Settings size={18} /></button>
        </div>
      </div>

      {/* CONTENT PANELS */}
      <div style={toolbarStyle}>
        
        {activeTab === 'File' && (
          <>
            <button onClick={() => { if(window.confirm('Clear board?')) clearBoard(); }} style={toolBtn(false)}><FilePlus size={18} />New</button>
            <button onClick={() => useBoardStore.getState().saveProject()} style={toolBtn(false)}><Save size={18} />Save</button>
            <button onClick={handleImportProject} style={toolBtn(false)}><FolderOpen size={18} />Import / Open</button>
            <div style={divider} />
            <button onClick={() => useBoardStore.getState().saveProject()} style={toolBtn(false)}><Save size={18} />Save As...</button>
            <button onClick={() => window.dispatchEvent(new Event('export-canvas-image'))} style={toolBtn(false)}><Download size={18} />Export Image</button>
            <button onClick={() => setShowPdfAlert(true)} style={toolBtn(false)}><Download size={18} />Export PDF</button>
          </>
        )}
        
        {activeTab === 'Home' && (
          <>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={undo} style={toolBtn(false, false)}><Undo size={18} />Undo</button>
              <button onClick={redo} style={toolBtn(false, false)}><Redo size={18} />Redo</button>
            </div>
            <div style={divider} />
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleToolClick('select')} onDoubleClick={() => handleToolDoubleClick('select')} style={toolBtn(tool === 'select', tool === 'select' && isToolLocked)}><MousePointer2 size={18} />Select</button>
              <button onClick={() => handleToolClick('pan')} onDoubleClick={() => handleToolDoubleClick('pan')} style={toolBtn(tool === 'pan', tool === 'pan' && isToolLocked)}><Hand size={18} />Pan</button>
            </div>
            <div style={divider} />
            <button onClick={clearBoard} style={{ ...toolBtn(false, false), color: '#ef4444' }}><Trash2 size={18} />Clear All</button>
          </>
        )}

        {activeTab === 'Insert' && (
          <>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleToolClick('pen')} onDoubleClick={() => handleToolDoubleClick('pen')} style={toolBtn(tool === 'pen', tool === 'pen' && isToolLocked)}><Pen size={18} />Pen</button>
              <button onClick={() => handleToolClick('rectangle')} onDoubleClick={() => handleToolDoubleClick('rectangle')} style={toolBtn(tool === 'rectangle', tool === 'rectangle' && isToolLocked)}><Square size={18} />Rectangle</button>
              <button onClick={() => handleToolClick('circle')} onDoubleClick={() => handleToolDoubleClick('circle')} style={toolBtn(tool === 'circle', tool === 'circle' && isToolLocked)}><CircleIcon size={18} />Circle</button>
              <button onClick={() => handleToolClick('text')} onDoubleClick={() => handleToolDoubleClick('text')} style={toolBtn(tool === 'text', tool === 'text' && isToolLocked)}><Type size={18} />Text</button>
              <div style={divider} />
              <button onClick={() => handleToolClick('eraser')} onDoubleClick={() => handleToolDoubleClick('eraser')} style={toolBtn(tool === 'eraser', tool === 'eraser' && isToolLocked)}><Eraser size={18} />Eraser</button>
            </div>
            
            <div style={divider} />
            
            {/* NEW ADVANCED INSERTIONS */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => handleInsertHTMLNode('table')} style={toolBtn(false)}><Table size={18} />Table</button>
              <button onClick={handleInsertImage} style={toolBtn(false)}><ImageIcon size={18} />Image</button>
              <button onClick={() => handleInsertHTMLNode('equation')} style={toolBtn(false)}><Sigma size={18} />Equation</button>
              <button onClick={() => handleInsertHTMLNode('symbol')} style={toolBtn(false)}><Hash size={18} />Symbol</button>
              <button onClick={handleInsertLinkClick} style={toolBtn(false)}><Link size={18} />Link</button>
              <button onClick={() => handleInsertHTMLNode('video')} style={toolBtn(false)}><Video size={18} />Video</button>
            </div>
          </>
        )}

        {/* Format Tab Removed - Moved to PropertiesPanel */}
      </div>

      {/* SYMBOL PICKER MODAL */}
      {showSymbolPicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowSymbolPicker(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Select Symbol</h2>
            {Object.entries(symbolCategories).map(([category, symbols]) => (
              <div key={category} style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b' }}>{category}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {symbols.map(sym => (
                    <button
                      key={sym}
                      onClick={() => {
                        const now = Date.now();
                        const { camera } = useBoardStore.getState();
                        useBoardStore.getState().addObject({
                          id: `sym-${now}`, name: 'symbol', type: 'text',
                          zIndex: useBoardStore.getState().objectIds.length,
                          x: -camera.x / camera.scale + 100, y: -camera.y / camera.scale + 100,
                          rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
                          createdAt: now, updatedAt: now,
                          text: sym, width: 200, fontFamily: 'Arial', fontSize: 48, fontStyle: 'normal',
                          fill: isDark ? '#ffffff' : '#000000', align: 'center', verticalAlign: 'middle', lineHeight: 1, letterSpacing: 0, padding: 0,
                          underline: false, strikethrough: false, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
                          stroke: '', strokeWidth: 0
                        } as any);
                        setShowSymbolPicker(false);
                      }}
                      style={{
                        background: isDark ? '#334155' : '#f1f5f9',
                        border: 'none', borderRadius: '4px', padding: '8px 12px',
                        fontSize: '1.25rem', cursor: 'pointer',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowVideoModal(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Video</h2>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>Upload from Device</h3>
              <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '0.875rem' }}>YouTube Link</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={videoUrl} 
                  onChange={e => setVideoUrl(e.target.value)} 
                  placeholder="https://youtube.com/..." 
                  style={{
                    flex: 1, padding: '8px', borderRadius: '4px',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    background: isDark ? '#0f172a' : '#f8fafc',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}
                />
                <button 
                  onClick={confirmInsertVideoUrl}
                  style={{
                    background: '#3b82f6', color: '#fff', border: 'none', 
                    padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE PICKER MODAL */}
      {showTablePicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowTablePicker(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', width: '100%', textAlign: 'left' }}>Insert Table</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '8px' }}>
              {Array.from({ length: 6 }).map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: 6 }).map((_, c) => (
                    <div 
                      key={c}
                      onMouseEnter={() => setTableHover({r: r + 1, c: c + 1})}
                      onClick={() => insertTable(r + 1, c + 1)}
                      style={{
                        width: '24px', height: '24px',
                        border: '1px solid #3b82f6',
                        background: (r < tableHover.r && c < tableHover.c) ? 'rgba(59, 130, 246, 0.5)' : 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '1rem', fontWeight: 500 }}>
              {tableHover.r} × {tableHover.c} Table
            </div>
          </div>
        </div>
      )}

      {/* EQUATION MODAL */}
      {showEquationModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowEquationModal(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Equation</h2>
            <textarea
              value={equationLatex}
              onChange={e => setEquationLatex(e.target.value)}
              style={{
                width: '100%', height: '80px', padding: '8px', borderRadius: '4px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                background: isDark ? '#0f172a' : '#f8fafc',
                color: isDark ? '#f8fafc' : '#0f172a',
                fontFamily: 'monospace', marginBottom: '16px', resize: 'vertical'
              }}
            />
            <div style={{ marginBottom: '16px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '8px', borderRadius: '4px' }}>
              {equationLatex && (
                <img src={`https://latex.codecogs.com/svg.image?${encodeURIComponent(equationLatex)}`} alt="Equation preview" style={{ maxWidth: '100%' }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={confirmInsertEquation}
                style={{
                  background: '#3b82f6', color: '#fff', border: 'none', 
                  padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK MODAL */}
      {showLinkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowLinkModal(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            maxWidth: '500px', width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Link</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                placeholder="https://..." 
                style={{
                  flex: 1, padding: '8px', borderRadius: '4px',
                  border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                  background: isDark ? '#0f172a' : '#f8fafc',
                  color: isDark ? '#f8fafc' : '#0f172a'
                }}
              />
              <button 
                onClick={confirmInsertLink}
                style={{
                  background: '#3b82f6', color: '#fff', border: 'none', 
                  padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
                }}
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF ALERT MODAL */}
      {showPdfAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowPdfAlert(false)}>
          <div style={{
            background: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '12px',
            maxWidth: '400px', width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            color: isDark ? '#f8fafc' : '#0f172a',
            textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Notice</h2>
            <p style={{ margin: '0 0 24px 0' }}>PDF Export coming soon!</p>
            <button 
              onClick={() => setShowPdfAlert(false)}
              style={{
                background: '#3b82f6', color: '#fff', border: 'none', 
                padding: '8px 24px', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};