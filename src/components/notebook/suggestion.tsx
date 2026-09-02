import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { MentionList } from './MentionList';
import { getActiveStore, storeRegistry } from '../../core/store/useAppStore';
import type { BoardObject } from '../../types/objects';
import { getDocument, getDocuments } from '../../core/store/idb';





const labelContent = async (item: { id: string; label: string; docId: string }) => {
  return [
    { type: 'labelMention', attrs: { id: item.id, label: item.label, docId: item.docId } },
    { type: 'diagramRef', attrs: { id: item.id, label: item.label, docId: item.docId } }
  ];
};

const readLabelEntries = async (query: string) => {
  const loaded = Array.from(storeRegistry.values()).map(store => {
    const state = store.getState();
    return { id: state.docId, objectsById: state.objectsById, objectIds: state.objectIds };
  });
  const loadedIds = new Set(loaded.map(document => document.id));
  const persisted = await Promise.all((await getDocuments())
    .filter(document => !loadedIds.has(document.id) && document.type === 'whiteboard')
    .map(async meta => {
      const document = await getDocument(meta.id);
      return document ? { id: document.id, objectsById: document.data.objectsById || {}, objectIds: document.data.objectIds || [] } : null;
    }));
  const documents = [...loaded, ...persisted.filter(Boolean) as { id: string; objectsById: Record<string, BoardObject>; objectIds: string[] }[]];
  const labels = documents.flatMap(document => {
    const objects = document.objectIds.map((id: string) => document.objectsById[id]).filter((object: BoardObject | undefined): object is BoardObject => Boolean(object));
    return objects.flatMap((object: BoardObject) => {
      if (object.groupLabel && object.parentId) return [{ id: object.parentId, label: object.groupLabel, docId: document.id }];
      if (object.label) return [{ id: object.id, label: object.label, docId: document.id }];
      return [];
    });
  });
  const normalizedQuery = query.toLowerCase();
  return Array.from(new Map(labels.map(item => [`${item.docId}:${item.id}`, item])).values())
    .filter(item => item.label.toLowerCase().includes(normalizedQuery))
    .slice(0, 8);
};

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

export const getLabelSuggestionConfig = (isDark: boolean) => ({
  char: '@',
  items: ({ query }: { query: string }) => readLabelEntries(query),
  command: ({ editor, range, props }: any) => {
    void labelContent(props).then(content => editor.chain().focus().deleteRange(range).insertContent(content).run());
  },
  render: () => {
    let component: ReactRenderer;
    let popup: Instance[] = [];
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
      onUpdate: (props: any) => {
        component.updateProps(props);
        if (props.clientRect && popup[0]) popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },
      onKeyDown: (props: any) => {
        if (props.event.key === 'Escape') {
          popup[0]?.hide();
          return true;
        }
        return (component.ref as any)?.onKeyDown?.(props) || false;
      },
      onExit: () => {
        popup[0]?.destroy();
        component.destroy();
      },
    };
  },
});
