import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { MentionList } from './MentionList';
import { getActiveStore } from '../../core/store/useAppStore';

export const getSuggestionConfig = (isDark: boolean) => ({
  char: '/',
  
  items: ({ query }: { query: string }) => {
    return [
      { title: 'Heading 1', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() } },
      { title: 'Heading 2', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() } },
      { title: 'Heading 3', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run() } },
      { title: 'Bullet List', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBulletList().run() } },
      { title: 'Numbered List', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleOrderedList().run() } },
      { title: 'Blockquote', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleBlockquote().run() } },
      { title: 'Code Block', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).toggleCodeBlock().run() } },
      { title: 'Divider', command: ({ editor, range }: any) => { editor.chain().focus().deleteRange(range).setHorizontalRule().run() } },
      { title: 'Embed Diagram', command: ({ editor, range }: any) => {
        const store = getActiveStore();
        if (!store) return;
        const state = store.getState();
        const ids = state.selectedIds;
        if (ids.length === 0) return;
        
        let html = '';
        ids.forEach((id: string) => {
          const obj = state.objectsById[id];
          if (obj && obj.type === 'image') html += `<img src="${(obj as any).src}" style="max-width:100%; border-radius: 8px;" />`;
        });
        
        if (html) {
          editor.chain().focus().deleteRange(range).insertContent(html).run();
        }
      } }
    ].filter(item => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: Instance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, { props: { ...props, isDark }, editor: props.editor });
        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },
      onUpdate(props: any) {
        component.updateProps(props);
        if (!props.clientRect) return;
        popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },
      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown?.(props) || false;
      },
      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
});