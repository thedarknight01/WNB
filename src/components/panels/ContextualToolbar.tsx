import { useState, useContext } from 'react';
import { useBoardStore, BoardContext } from '../../core/store/useBoardStore';
import type { Tool } from '../../core/store/useBoardStore';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { PropertiesToolbar } from './PropertiesToolbar';
import { 
  MousePointer2, Hand, Pen, Square, Circle as CircleIcon, Type, Eraser, 
  Undo, Redo, Trash2, Table, Image as ImageIcon, Sigma, Hash, Link, Video,
  PencilRuler, PlusSquare
} from 'lucide-react';

const symbolCategories = {
  Math: ['±', '×', '÷', '=', '≠', '≈', '<', '>', '≤', '≥', '∞', 'π', '∑', '∫', '√', '∝'],
  Greek: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'],
  Arrows: ['←', '↑', '→', '↓', '↔', '↕', '↖', '↗', '↘', '↙'],
  Shapes: ['○', '●', '□', '■', '△', '▲', '▽', '▼', '◇', '◆', '☆', '★'],
  Emoji: ['😀', '😂', '🥰', '😎', '🤔', '😭', '🤯', '👍', '👎', '👏', '🙌', '🎉', '🔥', '💡', '✅', '❌']
};

export const ContextualToolbar = ({ toolbarSlotId }: { toolbarSlotId?: string }) => {
  const [activeTab, setActiveTab] = useState<'Draw' | 'Insert'>('Draw');
  const [showArrowMenu, setShowArrowMenu] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHover, setTableHover] = useState({r: 0, c: 0});
  const [showEquationModal, setShowEquationModal] = useState(false);
  const [equationLatex, setEquationLatex] = useState('E = mc^2');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  
  const store = useContext(BoardContext);
  const docType = useBoardStore(s => s.docType);
  const tool = useBoardStore(s => s.tool);
  const setTool = useBoardStore(s => s.setTool);
  const isToolLocked = useBoardStore(s => s.isToolLocked);
  const undo = useBoardStore(s => s.undo);
  const redo = useBoardStore(s => s.redo);
  const clearBoard = useBoardStore(s => s.clearBoard);
  const selectedIds = useBoardStore(s => s.selectedIds);
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';



  if (selectedIds.length > 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', width: '100%',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
        color: isDark ? '#f8fafc' : '#0f172a', zIndex: 100, padding: '4px 16px', minHeight: '44px', justifyContent: 'center'
      }}>
        <PropertiesToolbar />
      </div>
    );
  }

  const handleToolClick = (t: Tool) => setTool(t, false);
  const handleToolDoubleClick = (t: Tool) => setTool(t, true);

  const insertSymbol = (char: string) => {
    const state = store!.getState();
    const now = Date.now();
    state.addObject({
      id: `text-${now}`, name: 'text', type: 'text', zIndex: state.objectIds.length,
      x: -state.camera.x / state.camera.scale + window.innerWidth / 2 / state.camera.scale,
      y: -state.camera.y / state.camera.scale + window.innerHeight / 2 / state.camera.scale,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now, text: char, fontSize: 32, fontFamily: 'Inter', fill: isDark ? '#ffffff' : '#000000', align: 'left',
      verticalAlign: 'top', textTransform: 'none', lineHeight: 1.2
    } as any);
    setShowSymbolPicker(false);
  };

  const insertVideo = () => {
    if (!videoUrl) return;
    let url = videoUrl;
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.includes('youtube.com/watch') ? new URLSearchParams(new URL(videoUrl).search).get('v') : videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) url = `https://www.youtube.com/embed/${videoId}`;
    }
    const state = store!.getState();
    const now = Date.now();
    state.addObject({
      id: `vid-${now}`, name: 'video', type: 'video', zIndex: state.objectIds.length,
      x: -state.camera.x / state.camera.scale + 100, y: -state.camera.y / state.camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now, src: url, width: 400, height: 225
    } as any);
    setShowVideoModal(false);
    setVideoUrl('');
  };

  const insertTable = (rows: number, cols: number) => {
    const state = store!.getState();
    const now = Date.now();
    state.addObject({
      id: `table-${now}`, name: 'table', type: 'table', zIndex: state.objectIds.length,
      x: -state.camera.x / state.camera.scale + 100, y: -state.camera.y / state.camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now, rows, cols, cellWidth: 100, cellHeight: 40
    } as any);
    setShowTablePicker(false);
  };

  const confirmInsertEquation = () => {
    if (!equationLatex) return;
    const state = store!.getState();
    const now = Date.now();
    state.addObject({
      id: `eq-${now}`, name: 'equation', type: 'equation', zIndex: state.objectIds.length,
      x: -state.camera.x / state.camera.scale + 100, y: -state.camera.y / state.camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now, latex: equationLatex
    } as any);
    setShowEquationModal(false);
    setEquationLatex('E = mc^2');
  };

  const confirmInsertLink = () => {
    if (!linkUrl) return;
    const state = store!.getState();
    const now = Date.now();
    state.addObject({
      id: `text-${now}`, name: 'link', type: 'text', zIndex: state.objectIds.length,
      x: -state.camera.x / state.camera.scale + 100, y: -state.camera.y / state.camera.scale + 100,
      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
      createdAt: now, updatedAt: now, text: linkUrl, fontFamily: 'Inter', fontSize: 20, fill: '#3b82f6', underline: true,
      align: 'left', verticalAlign: 'top', textTransform: 'none', lineHeight: 1.2, link: linkUrl
    } as any);
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const ribbonStyle = {
    display: 'flex', flexDirection: 'column' as const, width: '100%',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a', zIndex: 100,
  };
  
  const toolbarStyle = { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 16px', minHeight: '44px', overflowX: 'auto' as const };
  const toolBtn = (isActive: boolean, isLocked: boolean = false) => ({
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center',
    padding: '4px 8px', background: isActive ? (isDark ? '#1e293b' : '#eff6ff') : 'transparent',
    color: isActive ? '#3b82f6' : 'inherit', border: isLocked ? '1px solid #3b82f6' : '1px solid transparent',
    borderRadius: '4px', cursor: 'pointer', gap: '2px', fontSize: '0.7rem',
    boxShadow: isLocked ? '0 0 12px rgba(59, 130, 246, 0.8), inset 0 0 4px rgba(59, 130, 246, 0.4)' : 'none', 
    transition: 'all 0.2s', whiteSpace: 'nowrap' as const
  });

  const divider = { width: '1px', height: '20px', backgroundColor: isDark ? '#334155' : '#e2e8f0' };

  if (docType === 'notebook') {
    return (
      <div style={ribbonStyle}>
        <div id={toolbarSlotId || "global-toolbar-slot"} style={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: '44px' }} />
      </div>
    );
  }

  return (
    <div style={ribbonStyle}>
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', background: isDark ? '#1e293b' : '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
          <button onClick={() => setActiveTab('Draw')} style={{ ...toolBtn(activeTab === 'Draw'), flexDirection: 'row', gap: '6px', padding: '4px 10px' }}>
            <PencilRuler size={14} /> Home
          </button>
          <button onClick={() => setActiveTab('Insert')} style={{ ...toolBtn(activeTab === 'Insert'), flexDirection: 'row', gap: '6px', padding: '4px 10px' }}>
            <PlusSquare size={14} /> Insert
          </button>
        </div>
        
        <div style={divider} />

        {activeTab === 'Draw' && (
          <>
            <button onClick={undo} style={toolBtn(false)}><Undo size={16} />Undo</button>
            <button onClick={redo} style={toolBtn(false)}><Redo size={16} />Redo</button>
            <div style={divider} />
            <button onClick={() => handleToolClick('select')} onDoubleClick={() => handleToolDoubleClick('select')} style={toolBtn(tool === 'select', tool === 'select' && isToolLocked)}><MousePointer2 size={16} />Select</button>
            <button onClick={() => handleToolClick('pan')} onDoubleClick={() => handleToolDoubleClick('pan')} style={toolBtn(tool === 'pan', tool === 'pan' && isToolLocked)}><Hand size={16} />Pan</button>
            <button onClick={() => handleToolClick('pen')} onDoubleClick={() => handleToolDoubleClick('pen')} style={toolBtn(tool === 'pen', tool === 'pen' && isToolLocked)}><Pen size={16} />Pen</button>
            <button onClick={() => handleToolClick('eraser')} onDoubleClick={() => handleToolDoubleClick('eraser')} style={toolBtn(tool === 'eraser', tool === 'eraser' && isToolLocked)}><Eraser size={16} />Eraser</button>
            <div style={divider} />
            <button onClick={() => clearBoard()} style={toolBtn(false)}><Trash2 size={16} color="#ef4444" /><span style={{ color: '#ef4444' }}>Clear All</span></button>
          </>
        )}

        {activeTab === 'Insert' && (
          <>
            <button onClick={() => handleToolClick('rectangle')} onDoubleClick={() => handleToolDoubleClick('rectangle')} style={toolBtn(tool === 'rectangle', tool === 'rectangle' && isToolLocked)}><Square size={16} />Rect</button>
            <button onClick={() => handleToolClick('circle')} onDoubleClick={() => handleToolDoubleClick('circle')} style={toolBtn(tool === 'circle', tool === 'circle' && isToolLocked)}><CircleIcon size={16} />Circle</button>

            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex' }}>
                <button onClick={() => handleToolClick('arrow')} onDoubleClick={() => handleToolDoubleClick('arrow')} style={{ ...toolBtn(tool === 'arrow', tool === 'arrow' && isToolLocked), borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingRight: '4px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  Arrow
                </button>
                <button onClick={() => setShowArrowMenu(!showArrowMenu)} style={{ ...toolBtn(false), padding: '4px 2px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
              </div>
              {showArrowMenu && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 200, display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
                  <button onClick={() => { handleToolClick('arrow'); setShowArrowMenu(false); }} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}>Solid Arrow</button>
                </div>
              )}
            </div>

            <button onClick={() => handleToolClick('text')} onDoubleClick={() => handleToolDoubleClick('text')} style={toolBtn(tool === 'text', tool === 'text' && isToolLocked)}><Type size={16} />Text</button>
            <button onClick={() => setShowTablePicker(true)} style={toolBtn(false)}><Table size={16} />Table</button>
            <button onClick={() => setShowLinkModal(true)} style={toolBtn(false)}><Link size={16} />Link</button>
            
            <div style={divider} />
            <button onClick={() => setShowSymbolPicker(true)} style={toolBtn(false)}><Sigma size={16} />Symbol</button>
            
            <div style={divider} />
            <button onClick={() => {
              const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  const dataUrl = event.target?.result as string;
                  const img = new window.Image();
                  img.onload = () => {
                    const state = store!.getState(); const now = Date.now();
                    state.addObject({
                      id: `img-${now}`, name: 'image', type: 'image', zIndex: state.objectIds.length,
                      x: -state.camera.x / state.camera.scale + 100, y: -state.camera.y / state.camera.scale + 100,
                      rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true,
                      createdAt: now, updatedAt: now, src: dataUrl, width: img.naturalWidth, height: img.naturalHeight
                    } as any);
                  };
                  img.src = dataUrl;
                };
                reader.readAsDataURL(file);
              };
              input.click();
            }} style={toolBtn(false)}><ImageIcon size={16} />Image</button>
            <button onClick={() => setShowVideoModal(true)} style={toolBtn(false)}><Video size={16} />Video</button>
            <button onClick={() => setShowEquationModal(true)} style={toolBtn(false)}><Hash size={16} />Equation</button>
          </>
        )}
      </div>

      {/* MODALS */}
      {showSymbolPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSymbolPicker(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Symbol</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(symbolCategories).map(([category, symbols]) => (
                <div key={category}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: isDark ? '#94a3b8' : '#64748b' }}>{category}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {symbols.map(sym => (
                      <button key={sym} onClick={() => insertSymbol(sym)} style={{ width: '40px', height: '40px', fontSize: '1.25rem', background: isDark ? '#0f172a' : '#f1f5f9', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: isDark ? '#f8fafc' : '#0f172a' }}>{sym}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showVideoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowVideoModal(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Video</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>YouTube Link</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." style={{ flex: 1, padding: '8px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a' }} />
                  <button onClick={insertVideo} disabled={!videoUrl} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', opacity: videoUrl ? 1 : 0.5 }}>Insert</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTablePicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowTablePicker(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', width: '100%', textAlign: 'left' }}>Insert Table</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: isDark ? '#0f172a' : '#f8fafc', padding: '8px', borderRadius: '8px' }}>
              {Array.from({ length: 6 }).map((_, r) => (
                <div key={r} style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: 6 }).map((_, c) => (
                    <div key={c} onMouseEnter={() => setTableHover({r: r + 1, c: c + 1})} onClick={() => insertTable(r + 1, c + 1)} style={{ width: '24px', height: '24px', border: '1px solid #3b82f6', background: (r < tableHover.r && c < tableHover.c) ? 'rgba(59, 130, 246, 0.5)' : 'transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', fontSize: '1rem', fontWeight: 500 }}>{tableHover.r} x {tableHover.c} Table</div>
          </div>
        </div>
      )}

      {showEquationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowEquationModal(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Equation</h2>
            <textarea value={equationLatex} onChange={e => setEquationLatex(e.target.value)} style={{ width: '100%', height: '80px', padding: '8px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'monospace', marginBottom: '16px', resize: 'vertical' }} />
            <div style={{ marginBottom: '16px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '8px', borderRadius: '4px' }}>
              {equationLatex && <img src={`https://latex.codecogs.com/svg.image?${encodeURIComponent(equationLatex)}`} alt="Equation" style={{ maxWidth: '100%' }} />}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={confirmInsertEquation} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Insert</button>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLinkModal(false)}>
          <div style={{ background: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem' }}>Insert Link</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." style={{ flex: 1, padding: '8px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a' }} />
              <button onClick={confirmInsertLink} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Insert</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
