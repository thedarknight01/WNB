import { useSettingsStore } from '../../core/store/useSettingsStore';
import { NotebookEditor } from './NotebookEditor';
import { X, BookOpen } from 'lucide-react';

export const NotebookPanel = () => {
  const { theme, setViewMode } = useSettingsStore();
  const isDark = theme === 'dark';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderLeft: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    }}>
      {/* Header — compact */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 12px',
        borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        flexShrink: 0,
        background: isDark ? '#0f172a' : '#f8fafc',
        minHeight: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.01em', color: isDark ? '#f8fafc' : '#0f172a' }}>Notebook</h2>
        </div>
        <button
          onClick={() => setViewMode('canvas')}
          title="Close Notebook"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: isDark ? '#94a3b8' : '#64748b',
            borderRadius: '4px', padding: '2px',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.15s',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <NotebookEditor />
      </div>
    </div>
  );
};