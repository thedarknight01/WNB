import { useSettingsStore } from '../../core/store/useSettingsStore';
import { X, Settings2 } from 'lucide-react';

export const SettingsModal = () => {
  const { 
    isSettingsOpen, toggleSettings, theme, gridStyle, updateLabelSettings,
    labelFontFamily, labelFontSize, labelColor, labelFontStyle, setGridStyle 
  } = useSettingsStore();

  const isDark = theme === 'dark';

  if (!isSettingsOpen) return null;

  const sectionStyle = {
    marginBottom: '20px',
    display: 'flex', flexDirection: 'column' as const, gap: '8px'
  };

  const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: isDark ? '#cbd5e1' : '#475569' };
  const inputStyle = {
    width: '100%', padding: '8px', borderRadius: '6px',
    backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    color: isDark ? '#f8fafc' : '#0f172a',
  };

  return (
    <div style={{
      position: 'absolute', top: '24px', right: '24px', width: '300px',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: '12px', padding: '20px', zIndex: 200,
      boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.1)',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#f8fafc' : '#0f172a' }}>
          <Settings2 size={20} /> Settings
        </h3>
        <button onClick={toggleSettings} style={{ background: 'none', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Grid Style</label>
        <select value={gridStyle} onChange={(e) => setGridStyle(e.target.value as any)} style={inputStyle}>
          <option value="none">Blank Canvas</option>
          <option value="dot">Dotted Grid</option>
          <option value="grid">Line Grid</option>
        </select>
      </div>

      <div style={{ height: '1px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '16px 0' }} />
      <h4 style={{ margin: '0 0 12px 0', color: isDark ? '#f8fafc' : '#0f172a' }}>Diagram Labels</h4>

      <div style={sectionStyle}>
        <label style={labelStyle}>Font Family</label>
        <select value={labelFontFamily} onChange={(e) => updateLabelSettings({ labelFontFamily: e.target.value })} style={inputStyle}>
          <option value="Arial">Arial</option>
          <option value="Courier New">Monospace</option>
          <option value="Times New Roman">Serif</option>
          <option value="Comic Sans MS">Casual</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Font Size ({labelFontSize}px)</label>
        <input type="range" min="10" max="48" value={labelFontSize} onChange={(e) => updateLabelSettings({ labelFontSize: Number(e.target.value) })} style={{ width: '100%' }} />
      </div>
      
      <div style={sectionStyle}>
        <label style={labelStyle}>Font Style</label>
        <select value={labelFontStyle} onChange={(e) => updateLabelSettings({ labelFontStyle: e.target.value as any })} style={inputStyle}>
          <option value="normal">Normal</option>
          <option value="italic">Italic</option>
          <option value="bold">Bold</option>
        </select>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>Color</label>
        <input type="color" value={labelColor} onChange={(e) => updateLabelSettings({ labelColor: e.target.value })} style={{ ...inputStyle, padding: '2px', height: '36px' }} />
      </div>
    </div>
  );
};