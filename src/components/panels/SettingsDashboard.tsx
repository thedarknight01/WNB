
import { useSettingsStore } from '../../core/store/useSettingsStore';

import { SetupDatabaseModal } from './SetupDatabaseModal';
import {
  X, Palette, Type, Keyboard, Database
} from 'lucide-react';

type Tab = 'appearance' | 'canvas' | 'labels' | 'shortcuts' | 'data';

import { useState, useEffect } from 'react';

const StorageEstimator = ({ isDark }: { isDark: boolean }) => {
  const [usage, setUsage] = useState<string>('Calculating...');
  const [percent, setPercent] = useState<number>(0);

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(est => {
        if (est.usage !== undefined && est.quota !== undefined) {
          const usedMB = (est.usage / (1024 * 1024)).toFixed(1);
          setUsage(`${usedMB} MB used`);
          setPercent((est.usage / est.quota) * 100);
        }
      });
    } else {
      setUsage('Storage API unavailable');
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '60%' }}>
      <span style={{ fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '6px' }}>{usage}</span>
      <div style={{ width: '100%', height: '6px', background: isDark ? '#334155' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: '#3b82f6', transition: 'width 0.5s' }} />
      </div>
    </div>
  );
};

export const SettingsDashboard = () => {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [showSetupModal, setShowSetupModal] = useState(false);
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
    autoSyncCloud, setAutoSyncCloud, masterPassword, setMasterPassword
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

  
  const isDark = theme === 'dark' || theme === 'midnight';

  if (!isSettingsOpen) return null;

  const tabStyle = (id: Tab) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', width: '100%', textAlign: 'left' as const,
    backgroundColor: activeTab === id ? (isDark ? '#3b82f6' : '#eff6ff') : 'transparent',
    color: activeTab === id ? (isDark ? '#fff' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b'),
    border: 'none', borderRadius: '6px', cursor: 'pointer',
    fontWeight: activeTab === id ? 600 : 500, fontSize: '0.85rem', transition: 'all 0.15s'
  });

  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0' };
  const lastRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' };
  const card = { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderRadius: '8px', padding: '0 16px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', marginBottom: '20px' };
  const controlBtn = { padding: '4px 8px', borderRadius: '4px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', background: isDark ? '#1e293b' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '0.8rem', cursor: 'pointer' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(4px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: '680px', height: '480px', display: 'flex',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        borderRadius: '12px', overflow: 'hidden',
        boxShadow: isDark ? '0 20px 40px -10px rgba(0,0,0,0.5)' : '0 20px 40px -10px rgba(0,0,0,0.15)',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      }}>

        {/* SIDEBAR */}
        <div style={{ width: '200px', backgroundColor: isDark ? '#0f172a' : '#ffffff', borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0', padding: '16px' }}>
          <h2 style={{ margin: '0 0 16px 4px', fontSize: '1rem', color: isDark ? '#f8fafc' : '#0f172a' }}>Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button style={tabStyle('appearance')} onClick={() => setActiveTab('appearance')}><Palette size={16} /> Theme & Grid</button>
            <button style={tabStyle('labels')} onClick={() => setActiveTab('labels')}><Type size={16} /> Typography</button>
            <button style={tabStyle('shortcuts')} onClick={() => setActiveTab('shortcuts')}><Keyboard size={16} /> Keybindings</button>
            <button style={tabStyle('data')} onClick={() => setActiveTab('data')}><Database size={16} /> Sync & Data</button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#1e293b' : '#ffffff' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a', textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h3>
            <button onClick={toggleSettings} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', fontSize: '0.85rem', color: isDark ? '#cbd5e1' : '#334155' }}>
            
            {activeTab === 'appearance' && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>Interface</p>
                <div style={card}>
                  <div style={row}>
                    <span style={{ fontWeight: 500 }}>Color Theme</span>
                    <select value={theme} onChange={(e) => setTheme(e.target.value as any)} style={{ ...controlBtn, outline: 'none' }}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="midnight">Midnight</option>
                    </select>
                  </div>
                  <div style={lastRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>Rulers</span>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Canvas coordinate rulers</span>
                    </div>
                    <button onClick={toggleRulers} style={{ ...controlBtn, backgroundColor: showRulers ? '#3b82f6' : (isDark ? '#334155' : '#e5e7eb'), color: showRulers ? '#fff' : 'inherit' }}>
                      {showRulers ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '16px 0 8px 4px' }}>Whiteboard Background</p>
                <div style={card}>
                  <div style={row}>
                    <span style={{ fontWeight: 500 }}>Base Color</span>
                    <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
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
                      <input type="color" value={gridColor} onChange={(e) => setGridColor(e.target.value)} style={{ width: '28px', height: '28px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'labels' && (
              <>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>Font Management</p>
                <div style={card}>
                  <div style={{ ...row, padding: '12px 0' }}>
                    <input 
                      type="text" placeholder="e.g. Oswald" 
                      value={newFont} onChange={(e) => setNewFont(e.target.value)} 
                      style={{ background: isDark ? '#1e293b' : '#f1f5f9', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '6px', color: 'inherit', padding: '6px 12px', fontSize: '0.8rem', width: '150px' }} 
                    />
                    <button onClick={() => { if(newFont) { addCustomFont(newFont); setNewFont(''); } }} style={{ ...controlBtn, backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}>Add Font</button>
                  </div>
                  <button 
                    onClick={() => setShowFontsList(!showFontsList)}
                    style={{ ...row, cursor: 'pointer', background: 'transparent', border: 'none', color: 'inherit', width: '100%', textAlign: 'left', padding: '12px 0' }}
                  >
                    <span style={{ fontWeight: 500 }}>Installed Fonts ({customFonts.length})</span>
                    <span>{showFontsList ? '▼' : '▶'}</span>
                  </button>
                  {showFontsList && customFonts.map((font, idx) => (
                    <div key={font} style={idx === customFonts.length - 1 ? lastRow : row}>
                      <span style={{ fontFamily: font }}>{font}</span>
                      {!['Arial', 'Courier New', 'Times New Roman'].includes(font) && (
                        <button onClick={() => removeCustomFont(font)} style={{ ...controlBtn, color: '#ef4444', background: 'transparent' }}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '16px 0 8px 4px' }}>Default Object Text</p>
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

            {activeTab === 'shortcuts' && (
              <div style={card}>
                {Object.entries(keybindings).map(([action, currentKey], idx) => (
                  <div key={action} style={idx === Object.entries(keybindings).length - 1 ? lastRow : row}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{action} Tool</span>
                    <button 
                      onClick={() => listenForKey(action as keyof typeof keybindings)}
                      style={{ ...controlBtn, backgroundColor: recordingKey === action ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc'), color: recordingKey === action ? '#fff' : 'inherit', minWidth: '40px' }}
                    >
                      {recordingKey === action ? '...' : currentKey.toUpperCase()}
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'data' && (
              <>
                
                
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '0 0 8px 4px' }}>Local Storage Usage</p>
                <div style={card}>
                  <div style={lastRow}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 500 }}>Device Memory (IndexedDB)</span>
                        <StorageEstimator isDark={isDark} />
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '16px 0 8px 4px' }}>Encryption Security</p>

                <div style={card}>
                  <div style={lastRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>Master Password</span>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Secure your local and cloud exports (leave blank for default)</span>
                    </div>
                    <input 
                      type="password" 
                      placeholder="Optional Master Password..." 
                      defaultValue={masterPassword || ''}
                      onBlur={(e) => setMasterPassword(e.target.value)}
                      style={{ background: 'transparent', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '4px', color: 'inherit', padding: '6px 10px', fontSize: '0.8rem', width: '220px' }} 
                    />
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '16px 0 8px 4px' }}>Supabase Configuration</p>

                <div style={card}>
                  <div style={row}>
                    <span style={{ fontWeight: 500 }}>Project URL</span>
                    <input 
                      type="text" 
                      placeholder="https://xyz.supabase.co" 
                      defaultValue={useSettingsStore.getState().supabaseUrl}
                      onBlur={(e) => useSettingsStore.getState().setSupabaseKeys(e.target.value, useSettingsStore.getState().supabaseAnonKey)}
                      style={{ background: 'transparent', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '4px', color: 'inherit', padding: '4px 8px', fontSize: '0.8rem', width: '200px' }} 
                    />
                  </div>
                  <div style={row}>
                    <span style={{ fontWeight: 500 }}>Anon Key</span>
                    <input 
                      type="password" 
                      placeholder="eyJhb..." 
                      defaultValue={useSettingsStore.getState().supabaseAnonKey}
                      onBlur={(e) => useSettingsStore.getState().setSupabaseKeys(useSettingsStore.getState().supabaseUrl, e.target.value)}
                      style={{ background: 'transparent', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '4px', color: 'inherit', padding: '4px 8px', fontSize: '0.8rem', width: '200px' }} 
                    />
                  </div>
                  <div style={lastRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>Database Setup</span>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Initialize required tables</span>
                    </div>
                    <button onClick={() => setShowSetupModal(true)} style={controlBtn}>Setup DB</button>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase', margin: '16px 0 8px 4px' }}>Cloud Behavior</p>
                <div style={card}>
                  <div style={row}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>Auto-Sync Linked Documents</span>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Automatically push changes to Supabase</span>
                    </div>
                    <button onClick={() => setAutoSyncCloud(!autoSyncCloud)} style={{ ...controlBtn, backgroundColor: autoSyncCloud ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc'), color: autoSyncCloud ? '#fff' : 'inherit' }}>
                      {autoSyncCloud ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div style={lastRow}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>Clear Local Cache</span>
                      <span style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Remove cloud-synced files from local memory</span>
                    </div>
                    <button onClick={async () => {
                      const { useAppStore } = await import('../../core/store/useAppStore');
                      const appState = useAppStore.getState();
                      const { deleteDocument } = await import('../../core/store/idb');
                      let count = 0;
                      for (const doc of appState.documents) {
                        if (doc.isCloudLinked && !appState.tabs.includes(doc.id) && !appState.splitTabs.includes(doc.id)) {
                          await deleteDocument(doc.id);
                          count++;
                        }
                      }
                      if (count > 0) {
                        appState.loadDocuments();
                        alert(`Removed ${count} synced files from local storage.`);
                      } else {
                        alert('No inactive synced files found in local storage.');
                      }
                    }} style={{ ...controlBtn, color: '#ef4444' }}>
                      Free Memory
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
      
      {showSetupModal && <SetupDatabaseModal onClose={() => setShowSetupModal(false)} />}
    </div>
  );
};
