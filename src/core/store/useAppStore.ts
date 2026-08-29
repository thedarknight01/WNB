import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getDocuments, deleteDocument, type DocumentMeta, type DocumentData } from './idb';
import type { StoreApi } from 'zustand';

export interface AppState {
  documents: DocumentMeta[];
  tabs: string[]; // List of open document IDs in main pane
  splitTabs: string[]; // List of open document IDs in split pane
  activeMenuTab: 'File' | 'Home' | 'Insert' | 'Property';
  setActiveMenuTab: (tab: 'File' | 'Home' | 'Insert' | 'Property') => void;
  activeTabId: string | null;
  splitTabId: string | null;
  isSplitViewOpen: boolean;
  focusedTabId: string | null;

  loadDocuments: () => Promise<void>;
  createDocument: (type: 'whiteboard' | 'notebook', title?: string) => Promise<string>;
  openTab: (id: string, inSplit?: boolean) => void;
  closeTab: (id: string, fromSplit?: boolean) => void;
  deleteDoc: (id: string) => Promise<void>;
  setActiveTab: (id: string) => void;
  setSplitTab: (id: string | null) => void;
  setFocusedTab: (id: string | null) => void;
  toggleSplitView: () => void;
  moveToSplit: (id: string) => void;
  moveToMain: (id: string) => void;
  updateDocument: (id: string, changes: Partial<DocumentMeta>) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      documents: [],
      tabs: [],
      splitTabs: [],
      activeMenuTab: 'Home',
      setActiveMenuTab: (tab) => set({ activeMenuTab: tab }),
      activeTabId: null,
      splitTabId: null,
      isSplitViewOpen: false,
      focusedTabId: null,

      loadDocuments: async () => {
        const docs = await getDocuments();
        set({ documents: docs });
        
        // Auto-create a default whiteboard if none exist
        if (docs.length === 0) {
          const id = await get().createDocument('whiteboard');
          set({ tabs: [id], activeTabId: id });
        }
      },

      createDocument: async (type, title) => {
        let finalTitle = title;
        if (!finalTitle || finalTitle.trim() === '') {
          const prefix = type === 'whiteboard' ? 'Whiteboard' : 'Notebook';
          let maxCount = 0;
          get().documents.filter(d => d.type === type).forEach(d => {
            const match = d.title.match(new RegExp(`^${prefix} (\\d+)$`));
            if (match) maxCount = Math.max(maxCount, parseInt(match[1]));
          });
          finalTitle = `${prefix} ${maxCount + 1}`;
        }
        
        const id = `doc-${Date.now()}`;
        const newDoc: DocumentData = {
          id, title: finalTitle, type, updatedAt: Date.now(),
          data: type === 'whiteboard' ? { objectsById: {}, objectIds: [] } : { notebookContent: '<h1>New Note</h1>' }
        };
        
        // Do NOT save to IndexedDB immediately to avoid cluttering with empty documents.
        // Just add to local store in memory. First edit will auto-save it!
        set((state) => ({ documents: [newDoc, ...state.documents] }));
        return id;
      },

      openTab: (id, inSplit = false) => {
        const { tabs, splitTabs } = get();
        if (inSplit) {
          if (!splitTabs.includes(id)) {
            set({ splitTabs: [...splitTabs, id], splitTabId: id, isSplitViewOpen: true });
          } else {
            set({ splitTabId: id, isSplitViewOpen: true });
          }
        } else {
          if (!tabs.includes(id)) {
            set({ tabs: [...tabs, id], activeTabId: id });
          } else {
            set({ activeTabId: id });
          }
        }
      },

      closeTab: (id, fromSplit = false) => {
        set((state) => {
          if (fromSplit) {
            const newTabs = state.splitTabs.filter(t => t !== id);
            let newActive = state.splitTabId;
            if (newActive === id) newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
            return { splitTabs: newTabs, splitTabId: newActive };
          } else {
            const newTabs = state.tabs.filter(t => t !== id);
            let newActive = state.activeTabId;
            if (newActive === id) newActive = newTabs.length > 0 ? newTabs[newTabs.length - 1] : null;
            return { tabs: newTabs, activeTabId: newActive };
          }
        });
      },

      moveToSplit: (id) => {
        const { tabs, splitTabs, activeTabId } = get();
        if (!tabs.includes(id)) return;
        
        const newTabs = tabs.filter(t => t !== id);
        const newActive = activeTabId === id ? (newTabs.length > 0 ? newTabs[newTabs.length - 1] : null) : activeTabId;
        
        set({
          tabs: newTabs,
          activeTabId: newActive,
          splitTabs: [...splitTabs, id],
          splitTabId: id,
          isSplitViewOpen: true
        });
      },

      moveToMain: (id) => {
        const { tabs, splitTabs, splitTabId } = get();
        if (!splitTabs.includes(id)) return;
        
        const newSplitTabs = splitTabs.filter(t => t !== id);
        const newSplitId = splitTabId === id ? (newSplitTabs.length > 0 ? newSplitTabs[newSplitTabs.length - 1] : null) : splitTabId;
        
        set({
          splitTabs: newSplitTabs,
          splitTabId: newSplitId,
          tabs: [...tabs, id],
          activeTabId: id
        });
      },

      deleteDoc: async (id) => {
        await deleteDocument(id);
        const { tabs, splitTabs } = get();
        if (tabs.includes(id)) get().closeTab(id, false);
        if (splitTabs.includes(id)) get().closeTab(id, true);
        await get().loadDocuments();
      },

      setActiveTab: (id) => set({ activeTabId: id, focusedTabId: id }),
      setFocusedTab: (id) => set({ focusedTabId: id }),
      setSplitTab: (id) => {
        const { tabs, splitTabs } = get();
        if (id !== null && !splitTabs.includes(id)) {
          if (tabs.includes(id)) {
            get().moveToSplit(id);
            return;
          }
          set({ splitTabs: [...splitTabs, id], splitTabId: id, isSplitViewOpen: true });
        } else {
          set({ splitTabId: id, isSplitViewOpen: id !== null ? true : get().isSplitViewOpen });
        }
      },

      toggleSplitView: () => {
        const { isSplitViewOpen, tabs, splitTabs, activeTabId } = get();
        if (isSplitViewOpen) {
          // Merge splitTabs back into tabs
          const newTabs = [...tabs];
          splitTabs.forEach(id => {
            if (!newTabs.includes(id)) newTabs.push(id);
          });
          set({
            isSplitViewOpen: false,
            tabs: newTabs,
            splitTabs: [],
            splitTabId: null,
            activeTabId: activeTabId || newTabs[0] || null
          });
        } else {
          set({ isSplitViewOpen: true });
        }
      },

      updateDocument: async (id, changes) => {
        const docs = get().documents;
        const existing = docs.find(d => d.id === id);
        if (!existing) return;
        const updated = { ...existing, ...changes, updatedAt: Date.now() } as DocumentMeta;
        set({ documents: docs.map(d => d.id === id ? updated : d) });
      },
    }),
    {
      name: 'visual_board_app_state',
      partialize: (state) => ({ tabs: state.tabs, splitTabs: state.splitTabs || [], activeTabId: state.activeTabId, splitTabId: state.splitTabId })
    }
  )
);

// Global registry for keyboard shortcuts to find the active store
export const storeRegistry = new Map<string, StoreApi<any>>();
export const getActiveStore = () => {
  const { activeTabId, focusedTabId } = useAppStore.getState();
  const targetId = focusedTabId || activeTabId;
  if (!targetId) return null;
  return storeRegistry.get(targetId);
};
