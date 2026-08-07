import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import type { Instance } from 'tippy.js';
import { MentionList } from './MentionList';
import { useBoardStore } from '../../core/store/useBoardStore';

export const getSuggestionConfig = () => ({
  char: '@', // Trigger the menu when you type "@"
  
  // 1. Fetch labels from your whiteboard
  items: ({ query }: { query: string }) => {
    const state = useBoardStore.getState();
    const objects = state.objectIds.map(id => state.objectsById[id]).filter(Boolean);
    
    // Get all objects that have a label, and format them for the menu
    const labeledObjects = objects
      .filter(obj => obj.label && obj.label.toLowerCase().includes(query.toLowerCase()))  
      .map(obj => ({ id: obj.parentId || obj.id, label: obj.label as string }));

      
    // Remove duplicate group labels (so groups don't show up 5 times)
    const uniqueLabels = Array.from(new Map(labeledObjects.map(item => [item.label, item])).values());
    
    return uniqueLabels.slice(0, 5); // Return top 5 matches
  },

  // 2. Render the floating menu using Tippy.js
  render: () => {
    let component: ReactRenderer;
    let popup: Instance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, { props, editor: props.editor });
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