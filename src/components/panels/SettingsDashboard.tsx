import { useState } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { getActiveStore } from '../../core/store/useAppStore';
import {
  X, Palette, Grid, Type, Keyboard, Database, Info, Shield
} from 'lucide-react';

type Tab = 'appearance' | 'canvas' | 'labels' | 'shortcuts' | 'data' | 'about' | 'policies';

export const SettingsDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [newFont, setNewFont] = useState('');
  const [recordingKey, setRecordingKey] = useState<keyof typeof keybindings | null>(null);
  const [showFontsList, setShowFontsList] = useState(false);

  const {
    isSettingsOpen, toggleSettings, theme, setTheme,
    gridStyle, setGridStyle,
    gridColor, setGridColor, backgroundColor, setBackgroundColor,
    labelFontFamily, labelFontSize, updateLabelSettings, customFonts, addCustomFont, removeCustomFont,
    keybindings, updateKeybinding,
    showRulers, toggleRulers,
  } = useSettingsStore();

  const listenForKey = (action: keyof typeof keybindings) => {
    setRecordingKey(action);
    const listener = (e: KeyboardEvent) => {
      e.preventDefault();
      updateKeybinding(action, e.key);
      setRecordingKey(null);
      window.removeEventListener('keydown', listener);
    };
    window.addEventListener('keydown', listener);
  };

  // Only enable save/clear if there is an active store
  const activeStore = getActiveStore();

  const isDark = theme === 'dark' || theme === 'midnight';

  if (!isSettingsOpen) return null;

  const handleClearAutosave = () => {
    localStorage.removeItem('visual_board_autosave');
    activeStore?.getState().showToast("Autosave cache cleared!");
  };

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'canvas', label: 'Canvas & Grid', icon: Grid },
    { id: 'labels', label: 'Diagram Labels', icon: Type },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
    { id: 'policies', label: 'Policies', icon: Shield },
  ];

  // Common Styles

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{
        width: '900px', height: '600px', display: 'flex',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderRadius: '16px', overflow: 'hidden',
        boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.7)' : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',}}>

        {/* SIDEBAR */}
        <div style={{ width: '240px', backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0', padding: '24px 16px' }}>
          <h2 style={{ margin: '0 0 24px 8px', fontSize: '1.25rem', color: isDark ? '#f8fafc' : '#0f172a' }}>Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 12px',
                  backgroundColor: activeTab === tab.id ? (isDark ? '#3b82f6' : '#eff6ff') : 'transparent',
                  color: activeTab === tab.id ? (isDark ? '#ffffff' : '#3b82f6') : (isDark ? '#cbd5e1' : '#475569'),
                  border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>
            {/* MAIN CONTENT AREA */}
        <div style={{ flex: 1, backgroundColor: isDark ? '#020617' : '#f3f4f6', overflowY: 'auto', position: 'relative', color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', justifyContent: 'center' }}>
          
          <button onClick={toggleSettings} style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#334155' : '#e2e8f0', borderRadius: '50%', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', zIndex: 10, transition: 'all 0.2s' }}>
            <X size={18} />
          </button>

          {/* Wrapper to restrict width and center content */}
          <div style={{ width: '100%', maxWidth: '540px', padding: '40px 0' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '24px', marginLeft: '8px' }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>

            {/* SHARED APPLE STYLES */}
            {(() => {
              const card = { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderRadius: '12px', border: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' };
              const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e5e7eb' };
              const lastRow = { ...row, borderBottom: 'none' };
              const controlBtn = { padding: '6px 12px', borderRadius: '6px', backgroundColor: isDark ? '#334155' : '#f1f5f9', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 500 };

              return (
              <>
                {/* TAB 1: APPEARANCE */}
                {activeTab === 'appearance' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' }}>Theme & Layout</p>
                    <div style={card}>
                      <div style={lastRow}>
                        <span style={{ fontWeight: 500 }}>Application Theme</span>
                        <div style={{ display: 'flex', gap: '4px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                          <button onClick={() => setTheme('light')} style={{ ...controlBtn, backgroundColor: theme === 'light' ? (isDark ? '#3b82f6' : '#ffffff') : 'transparent', boxShadow: theme === 'light' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', color: theme === 'light' && isDark ? '#fff' : 'inherit' }}>Light</button>
                          <button onClick={() => setTheme('dark')} style={{ ...controlBtn, backgroundColor: theme === 'dark' ? (isDark ? '#0f172a' : '#ffffff') : 'transparent', boxShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', color: theme === 'dark' && !isDark ? '#000' : 'inherit' }}>Dark</button>
                          <button onClick={() => setTheme('midnight')} style={{ ...controlBtn, backgroundColor: theme === 'midnight' ? '#172554' : 'transparent', color: theme === 'midnight' ? '#fff' : 'inherit' }}>Midnight</button>
                          <button onClick={() => setTheme('sepia')} style={{ ...controlBtn, backgroundColor: theme === 'sepia' ? '#f5e6c8' : 'transparent', color: '#713f12' }}>Sepia</button>
                          <button onClick={() => setTheme('forest')} style={{ ...controlBtn, backgroundColor: theme === 'forest' ? '#d1fae5' : 'transparent', color: '#166534' }}>Forest</button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 2: CANVAS */}
                {activeTab === 'canvas' && (
                  <>
                    <div style={card}>
                      <div style={row}>
                        <div>
                          <span style={{ fontWeight: 500 }}>Rulers</span>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Show coordinate rulers on canvas edges</p>
                        </div>
                        <button onClick={toggleRulers} style={{ ...controlBtn, backgroundColor: showRulers ? '#3b82f6' : (isDark ? '#334155' : '#e5e7eb'), color: showRulers ? '#fff' : 'inherit' }}>
                          {showRulers ? 'ON' : 'OFF'}
                        </button>
                      </div>
                      <div style={row}>
                        <span style={{ fontWeight: 500 }}>Background Color</span>
                        <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', padding: 0, cursor: 'pointer' }} />
                      </div>
                      <div style={row}>
                        <span style={{ fontWeight: 500 }}>Grid Style</span>
                        <select value={gridStyle} onChange={(e) => setGridStyle(e.target.value as any)} style={{ ...controlBtn, outline: 'none' }}>
                          <option value="none">Blank</option>
                          <option value="dot">Dotted</option>
                          <option value="grid">Lines</option>
                        </select>
                      </div>
                      {gridStyle !== 'none' && (
                        <div style={lastRow}>
                          <span style={{ fontWeight: 500 }}>Grid Color</span>
                          <input type="color" value={gridColor} onChange={(e) => setGridColor(e.target.value)} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', padding: 0, cursor: 'pointer' }} />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* TAB 3: LABELS & FONTS */}
                {activeTab === 'labels' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' }}>Installed Fonts</p>
                    <div style={card}>
                      <div style={{ ...row, padding: '12px 16px', backgroundColor: isDark ? '#1e293b' : '#f9fafb' }}>
                        <input 
                          type="text" placeholder="Google Font Name (e.g. Oswald)" 
                          value={newFont} onChange={(e) => setNewFont(e.target.value)} 
                          style={{ background: 'transparent', border: 'none', outline: 'none', color: 'inherit', flex: 1, padding: '4px', fontSize: '0.95rem' }} 
                        />
                        <button onClick={() => { if(newFont) { addCustomFont(newFont); setNewFont(''); } }} style={{ ...controlBtn, backgroundColor: '#3b82f6', color: '#fff', borderRadius: '16px', padding: '6px 16px' }}>Install</button>
                      </div>
                      <button 
                        onClick={() => setShowFontsList(!showFontsList)}
                        style={{ ...row, cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit', width: '100%', textAlign: 'left' }}
                      >
                        <span style={{ fontWeight: 500 }}>Installed Fonts ({customFonts.length})</span>
                        <span style={{ fontSize: '0.8rem', transform: showFontsList ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                      </button>
                      {showFontsList && customFonts.map((font, idx) => (
                        <div key={font} style={idx === customFonts.length - 1 ? lastRow : row}>
                          <span style={{ fontFamily: font, fontSize: '0.85rem' }}>{font}</span>
                          {!['Arial', 'Courier New', 'Times New Roman'].includes(font) && (
                            <button onClick={() => removeCustomFont(font)} style={{ ...controlBtn, color: '#ef4444', backgroundColor: 'transparent', fontSize: '0.8rem', padding: '4px 8px' }}>✕</button>
                          )}
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase', marginTop: '24px' }}>Default Label Styling</p>
                    <div style={card}>
                      <div style={row}>
                        <span style={{ fontWeight: 500 }}>Font Family</span>
                        <select value={labelFontFamily} onChange={(e) => updateLabelSettings({ labelFontFamily: e.target.value })} style={{ ...controlBtn, outline: 'none' }}>
                          {customFonts.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                      </div>
                      <div style={lastRow}>
                        <span style={{ fontWeight: 500 }}>Font Size ({labelFontSize}px)</span>
                        <input type="range" min="10" max="48" value={labelFontSize} onChange={(e) => updateLabelSettings({ labelFontSize: Number(e.target.value) })} />
                      </div>
                    </div>
                  </>
                )}

                {/* TAB 4: SHORTCUTS */}
                {activeTab === 'shortcuts' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' }}>Keybindings</p>
                    <div style={card}>
                      {Object.entries(keybindings).map(([action, currentKey], idx) => (
                        <div key={action} style={idx === Object.entries(keybindings).length - 1 ? lastRow : row}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{action} Tool</span>
                          <button 
                            onClick={() => listenForKey(action as keyof typeof keybindings)}
                            style={{ ...controlBtn, backgroundColor: recordingKey === action ? '#3b82f6' : (isDark ? '#334155' : '#f1f5f9'), color: recordingKey === action ? '#fff' : 'inherit', minWidth: '40px' }}
                          >
                            {recordingKey === action ? '...' : currentKey.toUpperCase()}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                
                {activeTab === 'data' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' }}>Project Information</p>
                    <div style={card}>
                      <div style={row}>
                        <span style={{ fontWeight: 500 }}>Project Name</span>
                        <input type="text" placeholder="My Whiteboard" style={{ padding: '6px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb', background: isDark ? '#1e293b' : '#f9fafb', color: 'inherit', outline: 'none' }} />
                      </div>
                      <div style={lastRow}>
                        <span style={{ fontWeight: 500 }}>Author</span>
                        <input type="text" placeholder="Anonymous" style={{ padding: '6px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb', background: isDark ? '#1e293b' : '#f9fafb', color: 'inherit', outline: 'none' }} />
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase', marginTop: '24px' }}>Storage & Backup</p>
                    <div style={card}>
                      <div style={row}>
                      <span style={{ fontWeight: 500 }}>Download Project Backup</span>
                      <button onClick={() => activeStore?.getState().saveProject()} style={{ ...controlBtn, backgroundColor: '#3b82f6', color: '#fff' }}>Export .board</button>
                    </div>
                    <div style={row}>
                      <span style={{ fontWeight: 500 }}>Clear Cache</span>
                      <button onClick={handleClearAutosave} style={{ ...controlBtn, color: '#ef4444' }}>Clear Autosave</button>
                    </div>
                    <div style={lastRow}>
                      <span style={{ fontWeight: 500 }}>Wipe Canvas</span>
                      <button onClick={() => { if(window.confirm('Delete everything?')) { activeStore?.getState().clearBoard(); toggleSettings(); } }} style={{ ...controlBtn, backgroundColor: '#ef4444', color: '#fff' }}>Reset Board</button>
                    </div>
                  </div>
                  </>
                )}

                {activeTab === 'about' && (
                  <>
                    <div style={{ textAlign: 'center', margin: '32px 0' }}>
                      <img src="/logo.png" alt="Logo" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: '16px', boxShadow: '0 8px 24px rgba(59,130,246,0.2)' }} />
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800 }}>WB Studio</h3>
                      <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b' }}>Version 2.0.0 (Local First)</p>
                    </div>
                    
                    <div style={card}>
                      <div style={row}>
                        <span style={{ fontWeight: 500 }}>Developer</span>
                        <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Independent Developer</span>
                      </div>
                      <div style={lastRow}>
                        <span style={{ fontWeight: 500 }}>License</span>
                        <span style={{ color: isDark ? '#94a3b8' : '#64748b' }}>MIT License</span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', marginTop: '32px' }}>
                      <p style={{ fontSize: '0.85rem', color: isDark ? '#64748b' : '#94a3b8' }}>
                        WB Studio is a modern, lightweight, privacy-focused tool designed<br />
                        to seamlessly combine endless whiteboarding with structured note-taking.
                      </p>
                    </div>
                  </>
                )}

                {activeTab === 'policies' && (
                  <>
                    <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '8px', marginLeft: '12px', textTransform: 'uppercase' }}>Privacy & Security</p>
                    <div style={card}>
                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>Local-First Privacy</h4>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5 }}>
                          WB Studio operates entirely within your browser. All of your whiteboards, notebooks, and settings are stored locally on your device using IndexedDB. We do not transmit, track, or store your personal data on any external servers.
                        </p>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: isDark ? '#f1f5f9' : '#0f172a' }}>Security Policy</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.5 }}>
                          We employ strict Content Security Policies (CSP) to prevent cross-site scripting (XSS) and unauthorized data transmission. Your data never leaves your device unless you explicitly export it.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </>
              );
            })()}
        </div>
      </div>
      </div>
    </div>
  );
};