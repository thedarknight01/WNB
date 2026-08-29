import { useEffect } from 'react';
import { useBoardStore } from '../core/store/useBoardStore';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { useAppStore, getActiveStore } from '../core/store/useAppStore';

export const useKeyboardShortcuts = (
  isTyping: boolean,
  setIsSpacePressed: (val: boolean) => void,
  setIsPanning: (val: boolean) => void
) => {
  const docId = useBoardStore(s => s.docId);
  const { keybindings } = useSettingsStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const appState = useAppStore.getState();
      const targetId = appState.focusedTabId || appState.activeTabId;
      if (targetId !== docId) return;

      const activeEl = document.activeElement as HTMLElement;
      const isInputFocused = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.isContentEditable;
      if (isInputFocused || isTyping) return;

      const storeApi = getActiveStore()?.getState();
      if (!storeApi) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (e.code === 'Space') setIsSpacePressed(true);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); 
        storeApi.deleteSelected();
      };

      if (isCtrlOrCmd) {
        if (key === 'c') storeApi.copySelected();
        if (key === 'v') storeApi.paste();
        if (key === 'd') { e.preventDefault(); storeApi.duplicateSelected(); }
        if (key === 's') { e.preventDefault(); storeApi.saveProject(); }
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); storeApi.undo(); }
        if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); storeApi.redo(); }
        if (key === 'g') { e.preventDefault(); if (e.shiftKey) storeApi.ungroupSelected(); else storeApi.groupSelected(); }
        
        // Layers
        if (key === ']') { e.preventDefault(); storeApi.bringToFront(); }
        if (key === '[') { e.preventDefault(); storeApi.sendBackward(); }
        
        if (key === 'b') {
          e.preventDefault();
          const state = storeApi;
          state.selectedIds.forEach((id: string) => {
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
          const state = storeApi;
          state.selectedIds.forEach((id: string) => {
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
          const state = storeApi;
          state.selectedIds.forEach((id: string) => {
            const obj = state.objectsById[id];
            if (obj?.type === 'text') {
              state.updateObject(id, { underline: !(obj as any).underline } as any);
            }
          });
        }
        if (key === 'l') {
          e.preventDefault();
          const state = storeApi;
          state.selectedIds.forEach((id: string) => {
            const obj = state.objectsById[id];
            if (obj) {
              state.updateObject(id, { locked: !obj.locked, draggable: obj.locked } as any);
            }
          });
        }
      } else {
        if (key === keybindings.select) storeApi.setTool('select');
        else if (key === keybindings.pen) storeApi.setTool('pen');
        else if (key === keybindings.rectangle) storeApi.setTool('rectangle');
        else if (key === keybindings.circle) storeApi.setTool('circle');
        else if (key === keybindings.text) storeApi.setTool('text');
        else if (key === keybindings.eraser) storeApi.setTool('eraser');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const appState = useAppStore.getState();
      const targetId = appState.focusedTabId || appState.activeTabId;
      if (targetId !== docId) return;
      if (e.code === 'Space') { setIsSpacePressed(false); setIsPanning(false); }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const appState = useAppStore.getState();
      const targetId = appState.focusedTabId || appState.activeTabId;
      if (targetId !== docId) return;

      if (isTyping || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      const storeApi = getActiveStore()?.getState();
      if (!storeApi) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          
          const reader = new FileReader();
          reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
              const x = -storeApi.camera.x / storeApi.camera.scale + window.innerWidth / 2 / storeApi.camera.scale;
              const y = -storeApi.camera.y / storeApi.camera.scale + window.innerHeight / 2 / storeApi.camera.scale;
              storeApi.addImage(event.target.result, x, y);
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
  }, [docId, isTyping, keybindings, setIsSpacePressed, setIsPanning]);
};