import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';

interface MentionListProps {
  items: { id: string; label: string }[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  if (!props.items.length) return null;

  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      borderRadius: '8px', padding: '4px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      display: 'flex', flexDirection: 'column', gap: '2px',
      minWidth: '150px'
    }}>
      {props.items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          style={{
            textAlign: 'left', padding: '6px 10px', borderRadius: '4px',
            border: 'none', cursor: 'pointer', fontSize: '0.875rem',
            backgroundColor: index === selectedIndex ? (isDark ? '#3b82f6' : '#eff6ff') : 'transparent',
            color: index === selectedIndex ? (isDark ? '#fff' : '#3b82f6') : (isDark ? '#cbd5e1' : '#0f172a'),
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
});

MentionList.displayName = 'MentionList';