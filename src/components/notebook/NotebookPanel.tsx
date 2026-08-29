import { useSettingsStore } from '../../core/store/useSettingsStore';
import { NotebookEditor } from './NotebookEditor';

export const NotebookPanel = ({ docId, toolbarSlotId }: { docId: string; toolbarSlotId: string }) => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

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
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <NotebookEditor docId={docId} toolbarSlotId={toolbarSlotId} />
      </div>
    </div>
  );
};