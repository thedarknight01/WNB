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
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        flexShrink: 0,
        background: isDark ? '#0f172a' : '#f8fafc',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} color="#3b82f6" />
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Notebook</h2>
        </div>
        <button
          onClick={() => setViewMode('canvas')}
          title="Close Notebook"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: isDark ? '#94a3b8' : '#64748b',
            borderRadius: '6px', padding: '4px',
            display: 'flex', alignItems: 'center',
            transition: 'all 0.15s',
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <NotebookEditor />
      </div>
    </div>
  );
};