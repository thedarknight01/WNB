import { useEffect } from 'react';
import { useBoardStore } from '../core/store/useBoardStore';
import { useSettingsStore } from '../core/store/useSettingsStore';

export const useKeyboardShortcuts = (
  isTyping: boolean,
  setIsSpacePressed: (val: boolean) => void,
  setIsPanning: (val: boolean) => void
) => {
  const { setTool, deleteSelected, copySelected, paste, duplicateSelected, groupSelected, ungroupSelected,
    camera, addImage, undo, redo } = useBoardStore() ;
  const { keybindings } = useSettingsStore();

  useEffect(() => 
    {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement;
      const isInputFocused = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.isContentEditable;
      if (isInputFocused || isTyping) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.code === 'Space') setIsSpacePressed(true);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); 
        deleteSelected();
      };

      if (isCtrlOrCmd) {
        if (key === 'c') copySelected();
        if (key === 'v') paste();
        if (key === 'd') { e.preventDefault(); duplicateSelected(); }
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
        if (key === 'g') { e.preventDefault(); if (e.shiftKey) ungroupSelected(); else groupSelected(); }
        if (key === 'b') {
          e.preventDefault();
          const state = useBoardStore.getState();
          state.selectedIds.forEach(id => {
            const obj = state.objectsById[id];
            if (obj?.type === 'text') {
              const current = (obj as any).fontStyle || 'normal';
              const newStyle = current.includes('bold') ? current.replace('bold', '').trim() || 'normal' : `${current} bold`.replace('normal', '').trim();
              state.updateObject(id, { fontStyle: newStyle } as any);
            }
          });
        }
        if (key === 'i' && !e.shiftKey) {
          e.preventDefault();
          const state = useBoardStore.getState();
          state.selectedIds.forEach(id => {
            const obj = state.objectsById[id];
            if (obj?.type === 'text') {
              const current = (obj as any).fontStyle || 'normal';
              const newStyle = current.includes('italic') ? current.replace('italic', '').trim() || 'normal' : `${current} italic`.replace('normal', '').trim();
              state.updateObject(id, { fontStyle: newStyle } as any);
            }
          });
        }
        if (key === 'u') {
          e.preventDefault();
          const state = useBoardStore.getState();
          state.selectedIds.forEach(id => {
            const obj = state.objectsById[id];
            if (obj?.type === 'text') {
              state.updateObject(id, { underline: !(obj as any).underline } as any);
            }
          });
        }
        if (key === 'l') {
          e.preventDefault();
          const state = useBoardStore.getState();
          state.selectedIds.forEach(id => {
            const obj = state.objectsById[id];
            if (obj) {
              state.updateObject(id, { locked: !obj.locked, draggable: obj.locked } as any);
            }
          });
        }
      } else {
        if (key === keybindings.select) setTool('select');
        else if (key === keybindings.pen) setTool('pen');
        else if (key === keybindings.rectangle) setTool('rectangle');
        else if (key === keybindings.circle) setTool('circle');
        else if (key === keybindings.text) setTool('text');
        else if (key === keybindings.eraser) setTool('eraser');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { setIsSpacePressed(false); setIsPanning(false); }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (isTyping || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
              const x = -camera.x / camera.scale + window.innerWidth / 2 / camera.scale;
              const y = -camera.y / camera.scale + window.innerHeight / 2 / camera.scale;
              addImage(event.target.result, x, y);
            }
          };
          reader.readAsDataURL(file);
          break; 
        }
      }
    };  

    // Attach all listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('paste', handlePaste);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('paste', handlePaste);
    };
  }, [
    isTyping, setIsSpacePressed, setIsPanning, setTool, 
    deleteSelected, copySelected, paste, duplicateSelected, 
    groupSelected, ungroupSelected, camera, addImage, undo, redo, keybindings // Added missing dependencies
  ]);
};