import { createStore, useStore } from 'zustand';

import { createContext, useContext } from 'react';
import { encryptData, decryptData } from '../../utils/encryption';
import type { BoardObject, LineData, RectangleData, CircleData, ImageData } from '../../types/objects';
import { getDocument, getDocuments, saveDocument, type DocumentData } from './idb';
import { storeRegistry } from './useAppStore';

const storeCleanup = new Map<string, () => void>();

interface Camera { x: number; y: number; scale: number; }
export type Tool = 'select' | 'pan' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'text' | 'arrow';

export interface BoardState {
  docId: string;
  docType: 'whiteboard' | 'notebook';
  camera: Camera;
  tool: Tool;
  isToolLocked: boolean;
  defaultArrowType: 'straight' | 'orthogonal';
  objectsById: Record<string, BoardObject>;
  objectIds: string[];
  selectedIds: string[];
  clipboard: BoardObject[];
  past: { byId: Record<string, BoardObject>, ids: string[] }[];
  future: { byId: Record<string, BoardObject>, ids: string[] }[];
  toast: string | null;
  contextMenu: { x: number, y: number, id: string } | null;
  notebookContent: string;
  
  // Actions
  setCamera: (camera: Camera) => void;
  setTool: (tool: Tool, locked?: boolean) => void;
  setDefaultArrowType: (type: 'straight' | 'orthogonal') => void;
  setSelectedIds: (ids: string[]) => void;
  showToast: (msg: string) => void;
  setContextMenu: (menu: { x: number, y: number, id: string } | null) => void;
  setNotebookContent: (content: string) => void;
  
  addObject: (obj: BoardObject) => void;
  updateObject: (id: string, updates: Partial<BoardObject>) => void;
  removeObject: (id: string) => void;
  deleteSelected: () => void;
  setObjectLabel: (idOrParentId: string, label: string) => void;
  
  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  
  moveSelectedObjects: (dx: number, dy: number) => void;
  addPointToLastLine: (point: [number, number]) => void;
  updateCurrentShape: (pos: { x: number; y: number }) => void;
  addImage: (base64: string, x: number, y: number) => void;
  addTableRow: (id: string, index?: number) => void;
  addTableColumn: (id: string, index?: number) => void;
  removeTableRow: (id: string, index?: number) => void;
  removeTableColumn: (id: string, index?: number) => void;
  
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;

  saveHistory: () => void;
  undo: () => void;
  redo: () => void;
  
  focusCameraOn: (idOrParentId: string) => void;
  saveProject: () => void;
  loadProject: (jsonString: string) => void;
  clearBoard: () => void;
}

const removeLinkedReferences = async (docId: string, objectIds: string[]) => {
  if (typeof window === 'undefined') return true;
  const linkedStores = Array.from(storeRegistry.values()).filter(store => {
    if (store.getState().docId === docId) return false;
    return objectIds.some(id => new RegExp(`data-id\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(store.getState().notebookContent));
  });
  const openIds = new Set(Array.from(storeRegistry.keys()));
  const persistedDocuments = (await getDocuments())
    .filter(document => document.id !== docId && !openIds.has(document.id));
  const linkedPersisted = (await Promise.all(persistedDocuments.map(async meta => {
    const document = await getDocument(meta.id);
    return document && objectIds.some(id => document.data.notebookContent && new RegExp(`data-id\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(document.data.notebookContent)) ? document : null;
  }))).filter((document): document is DocumentData => Boolean(document));
  if (linkedStores.length === 0 && linkedPersisted.length === 0) return true;
  const confirmed = window.confirm('This object is linked from a notebook. Delete it and remove its references everywhere?');
  if (!confirmed) return false;
  const scrub = (content: string) => content
    .replace(/<span([^>]*)>.*?<\/span>\s*(?:<img[^>]*alt=["'](?:Diagram:|WBN_LABEL_REF:)[^"']*["'][^>]*>\s*)?/g, (match, attributes: string) => {
      const typeMatch = attributes.match(/data-type=["']([^"']+)["']/);
      const idMatch = attributes.match(/data-id=["']([^"']+)["']/);
      return typeMatch?.[1] === 'labelMention' && idMatch && objectIds.includes(idMatch[1]) ? '' : match;
    });
  linkedStores.forEach(store => {
    const content = scrub(store.getState().notebookContent);
    if (content !== store.getState().notebookContent) store.getState().setNotebookContent(content);
  });
  await Promise.all(linkedPersisted.map(document => saveDocument({
    ...document,
    updatedAt: Date.now(),
    data: { ...document.data, notebookContent: scrub(document.data.notebookContent || '') },
  })));
  return true;
};

export const createBoardStore = (doc: DocumentData) => {
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let saveQueue = Promise.resolve();
  const store = createStore<BoardState>((set, get) => ({
    docId: doc.id,
    docType: doc.type,
    camera: { x: 0, y: 0, scale: 1 },
    tool: 'select',
    isToolLocked: false,
    defaultArrowType: 'straight',
    objectsById: doc.data.objectsById || {},
    objectIds: doc.data.objectIds || [],
    selectedIds: [],
    clipboard: [],
    past: [],
    future: [],
    toast: null,
    contextMenu: null,
    notebookContent: doc.data.notebookContent || '<h1>Project Notes</h1><p>Start documenting here...</p>',

    showToast: (msg) => { set({ toast: msg }); setTimeout(() => set({ toast: null }), 2000); },
    setCamera: (camera) => set({ camera }),
    setTool: (tool, locked = false) => set({ tool, isToolLocked: locked, selectedIds: [] }),
    setDefaultArrowType: (type) => set({ defaultArrowType: type }),
    setSelectedIds: (ids) => set({ selectedIds: ids }),
    setContextMenu: (menu) => set({ contextMenu: menu }),
    setNotebookContent: (content) => set({ notebookContent: content }),

    saveHistory: () => set((state) => ({ past: [...state.past, { byId: state.objectsById, ids: state.objectIds }].slice(-50), future: [] })),

    undo: () => {
      const state = get();
      if (state.past.length === 0) return;
      const previous = state.past[state.past.length - 1];
      set({
        past: state.past.slice(0, -1),
        future: [{ byId: state.objectsById, ids: state.objectIds }, ...state.future],
        objectsById: previous.byId, objectIds: previous.ids, selectedIds: []
      });
    },

    redo: () => {
      const state = get();
      if (state.future.length === 0) return;
      const next = state.future[0];
      set({
        past: [...state.past, { byId: state.objectsById, ids: state.objectIds }],
        future: state.future.slice(1),
        objectsById: next.byId, objectIds: next.ids, selectedIds: []
      });
    },

    addObject: (obj) => set((state) => ({ objectsById: { ...state.objectsById, [obj.id]: obj }, objectIds: [...state.objectIds, obj.id] })),
    updateObject: (id, updates) => set((state) => {
      if (!state.objectsById[id]) return state;
      return { objectsById: { ...state.objectsById, [id]: { ...state.objectsById[id], ...updates, updatedAt: Date.now() } as BoardObject } };
    }),
    removeObject: async (id) => {
      const object = get().objectsById[id];
      if (!object || !(await removeLinkedReferences(get().docId, [id, object.parentId].filter(Boolean) as string[]))) return;
      set((state) => {
      const newById = { ...state.objectsById }; delete newById[id];
      return { objectsById: newById, objectIds: state.objectIds.filter(i => i !== id), selectedIds: state.selectedIds.filter(sId => sId !== id) };
      });
    },

    deleteSelected: async () => {
      const state = get();
      const linkedIds = state.selectedIds.flatMap(id => [id, state.objectsById[id]?.parentId]).filter(Boolean) as string[];
      if (!(await removeLinkedReferences(state.docId, linkedIds))) return;
      get().saveHistory();
      set((currentState) => {
        const newById = { ...currentState.objectsById };
        currentState.selectedIds.forEach(id => delete newById[id]);
        return { objectsById: newById, objectIds: currentState.objectIds.filter(id => !currentState.selectedIds.includes(id)), selectedIds: [] };
      });
    },

    setObjectLabel: (idOrParentId, label) => {
      get().saveHistory();
      set((state) => {
        const newById = { ...state.objectsById };
        const target = newById[idOrParentId];
        const groupId = target?.parentId || idOrParentId;
        const normalizedLabel = label.trim() || undefined;
        if (target?.parentId) {
          state.objectIds.forEach(id => {
            const obj = newById[id];
            if (obj.parentId === groupId) {
              newById[id] = { ...obj, groupLabel: normalizedLabel, updatedAt: Date.now() };
            }
          });
        } else if (target) {
          newById[idOrParentId] = { ...target, label: normalizedLabel, updatedAt: Date.now() };
        } else {
          state.objectIds.forEach(id => {
            const obj = newById[id];
            if (obj.parentId === groupId) newById[id] = { ...obj, groupLabel: normalizedLabel, updatedAt: Date.now() };
          });
        }
        return { objectsById: newById };
      });
    },

    moveSelectedObjects: (dx, dy) => set((state) => {
      const newById = { ...state.objectsById };
      state.selectedIds.forEach(id => {
        if (newById[id] && !newById[id].locked) newById[id] = { ...newById[id], x: newById[id].x + dx, y: newById[id].y + dy };
      });
      return { objectsById: newById };
    }),

    addPointToLastLine: (point) => set((state) => {
      const lastId = state.objectIds[state.objectIds.length - 1];
      const lastObj = state.objectsById[lastId];
      if (lastObj && lastObj.type === 'line') {
        const line = lastObj as LineData;
        return { objectsById: { ...state.objectsById, [lastId]: { ...line, points: [...line.points, point[0] - line.x, point[1] - line.y] } } };
      }
      return state;
    }),

    updateCurrentShape: (pos) => set((state) => {
      const lastId = state.objectIds[state.objectIds.length - 1];
      const lastObj = state.objectsById[lastId];
      if (!lastObj) return state;

      if (lastObj.type === 'rectangle') {
        const rect = lastObj as RectangleData;
        return { objectsById: { ...state.objectsById, [lastId]: { ...rect, width: pos.x - rect.x, height: pos.y - rect.y } } };
      } else if (lastObj.type === 'circle') {
        const circle = lastObj as CircleData;
        return { objectsById: { ...state.objectsById, [lastId]: { ...circle, radius: Math.hypot(pos.x - circle.x, pos.y - circle.y) } } };
      } else if (lastObj.type === 'arrow') {
        const arrow = lastObj as any;
        const newPoints = [...arrow.points];
        newPoints[newPoints.length - 2] = pos.x - arrow.x;
        newPoints[newPoints.length - 1] = pos.y - arrow.y;
        return { objectsById: { ...state.objectsById, [lastId]: { ...arrow, points: newPoints } } };
      }
      return state;
    }),

    copySelected: () => {
      const state = get();
      const selected = state.selectedIds.map(id => state.objectsById[id]).filter(Boolean);
      if (selected.length > 0) set({ clipboard: selected });
    },

    paste: () => {
      const state = get();
      if (state.clipboard.length === 0) return;
      get().saveHistory();
      const newById = { ...state.objectsById };
      const newIds = [...state.objectIds];
      const newSelectedIds: string[] = [];
      state.clipboard.forEach(obj => {
        const newId = `obj-${Date.now()}-${Math.random()}`;
        newById[newId] = { ...obj, id: newId, x: obj.x + 20, y: obj.y + 20, parentId: undefined };
        newIds.push(newId);
        newSelectedIds.push(newId);
      });
      set({ objectsById: newById, objectIds: newIds, selectedIds: newSelectedIds });
    },

    duplicateSelected: () => { get().copySelected(); get().paste(); },

    groupSelected: () => {
      const state = get();
      if (state.selectedIds.length < 2) return;
      get().saveHistory();
      const newParentId = `group-${Date.now()}`;
      const newById = { ...state.objectsById };
      state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], parentId: newParentId }; });
      set({ objectsById: newById });
    },

    ungroupSelected: () => {
      const state = get();
      get().saveHistory();
      const newById = { ...state.objectsById };
      state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], parentId: undefined }; });
      set({ objectsById: newById });
    },

    bringToFront: () => {
      get().saveHistory();
      set((state) => {
        const maxZ = Math.max(...state.objectIds.map(id => state.objectsById[id]?.zIndex || 0), 0);
        const newById = { ...state.objectsById };
        state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], zIndex: maxZ + 1 }; });
        return { objectsById: newById };
      });
    },

    sendToBack: () => {
      get().saveHistory();
      set((state) => {
        const minZ = Math.min(...state.objectIds.map(id => state.objectsById[id]?.zIndex || 0), 0);
        const newById = { ...state.objectsById };
        state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], zIndex: minZ - 1 }; });
        return { objectsById: newById };
      });
    },

    bringForward: () => {
      get().saveHistory();
      set((state) => {
        const newById = { ...state.objectsById };
        state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], zIndex: newById[id].zIndex + 1 }; });
        return { objectsById: newById };
      });
    },

    sendBackward: () => {
      get().saveHistory();
      set((state) => {
        const newById = { ...state.objectsById };
        state.selectedIds.forEach(id => { if (newById[id]) newById[id] = { ...newById[id], zIndex: newById[id].zIndex - 1 }; });
        return { objectsById: newById };
      });
    },

    focusCameraOn: (idOrParentId) => {
      const state = get();
      const targets = state.objectIds.map(id => state.objectsById[id]).filter(o => o.id === idOrParentId || o.parentId === idOrParentId);
      if (targets.length === 0) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      targets.forEach((o) => {
        let oMaxX = o.x, oMaxY = o.y;
        if (o.type === 'rectangle' || o.type === 'image') { oMaxX = o.x + ((o as any).width * o.scaleX); oMaxY = o.y + ((o as any).height * o.scaleY); }
        else if (o.type === 'circle') { const r = (o as any).radius * o.scaleX; oMaxX = o.x + r; oMaxY = o.y + r; }
        minX = Math.min(minX, o.x); maxX = Math.max(maxX, oMaxX);
        minY = Math.min(minY, o.y); maxY = Math.max(maxY, oMaxY);
      });
      const scale = state.camera.scale;
      set({
        camera: { x: (window.innerWidth / 2) - (((minX + maxX) / 2) * scale), y: (window.innerHeight / 2) - (((minY + maxY) / 2) * scale), scale },
        selectedIds: targets.map(t => t.id)
      });
    },

    addImage: (base64, x, y) => {
      const img = new Image(); img.src = base64;
      img.onload = () => {
        const now = Date.now();
        let w = img.width, h = img.height;
        if (w > 800) { h = (800 / w) * h; w = 800; }
        const newId = `img-${now}`;
        const newImage: ImageData = {
          id: newId, name: `image-${now}`, type: 'image', zIndex: get().objectIds.length,
          x, y, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, draggable: true, createdAt: now, updatedAt: now,
          src: base64, width: w, height: h, shadowColor: 'rgba(0,0,0,0)', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0, shadowOpacity: 1,
        };
        set((state) => ({ objectsById: { ...state.objectsById, [newId]: newImage }, objectIds: [...state.objectIds, newId] }));
      };
    },

    addTableRow: (id, index) => {
      get().saveHistory();
      set(state => {
        const table = state.objectsById[id];
        if (!table || table.type !== 'table') return state;
        const rowIndex = Math.max(0, Math.min(index ?? table.rows, table.rows));
        const data = table.data.map(row => [...row]);
        data.splice(rowIndex, 0, Array(table.cols).fill(''));
        return { objectsById: { ...state.objectsById, [id]: { ...table, rows: table.rows + 1, height: Math.max(table.height, (table.height / table.rows) * (table.rows + 1)), data } } };
      });
    },

    addTableColumn: (id, index) => {
      get().saveHistory();
      set(state => {
        const table = state.objectsById[id];
        if (!table || table.type !== 'table') return state;
        const colIndex = Math.max(0, Math.min(index ?? table.cols, table.cols));
        const data = table.data.map(row => {
          const next = [...row];
          next.splice(colIndex, 0, '');
          return next;
        });
        return { objectsById: { ...state.objectsById, [id]: { ...table, cols: table.cols + 1, width: Math.max(table.width, (table.width / table.cols) * (table.cols + 1)), data } } };
      });
    },

    removeTableRow: (id, index) => {
      get().saveHistory();
      set(state => {
        const table = state.objectsById[id];
        if (!table || table.type !== 'table' || table.rows <= 1) return state;
        const rowIndex = Math.max(0, Math.min(index ?? table.rows - 1, table.rows - 1));
        const data = table.data.map(row => [...row]);
        data.splice(rowIndex, 1);
        return { objectsById: { ...state.objectsById, [id]: { ...table, rows: table.rows - 1, data } } };
      });
    },

    removeTableColumn: (id, index) => {
      get().saveHistory();
      set(state => {
        const table = state.objectsById[id];
        if (!table || table.type !== 'table' || table.cols <= 1) return state;
        const colIndex = Math.max(0, Math.min(index ?? table.cols - 1, table.cols - 1));
        const data = table.data.map(row => row.filter((_value, currentIndex) => currentIndex !== colIndex));
        return { objectsById: { ...state.objectsById, [id]: { ...table, cols: table.cols - 1, data } } };
      });
    },

    saveProject: async () => {
      const state = get();
      const projectData = JSON.stringify({ version: 2, objectsById: state.objectsById, objectIds: state.objectIds, notebook: state.notebookContent });
      const encrypted = await encryptData(projectData);
      const blob = new Blob([encrypted], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `project-${Date.now()}.wnb`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    },

    loadProject: async (encryptedString) => {
      try {
        const parsed = JSON.parse(await decryptData(encryptedString));
        if (parsed.objects && !parsed.objectsById) {
          const byId: Record<string, BoardObject> = {}; const ids: string[] = [];
          parsed.objects.forEach((obj: BoardObject) => { byId[obj.id] = obj; ids.push(obj.id); });
          set({ objectsById: byId, objectIds: ids, selectedIds: [] });
        } else if (parsed.objectsById) {
          set({ objectsById: parsed.objectsById, objectIds: parsed.objectIds, selectedIds: [] });
        }
        if (parsed.notebook) set({ notebookContent: parsed.notebook });
        get().showToast("Project Loaded!");
      } catch (e) { get().showToast("Error loading file"); }
    },

    clearBoard: () => set({ objectsById: {}, objectIds: [], past: [], future: [], selectedIds: [] })
  }));

  // Auto-save this document to IndexedDB on changes
  const unsubscribe = store.subscribe((state, prevState) => {
    if (state.objectsById !== prevState.objectsById || state.notebookContent !== prevState.notebookContent) {
      
      // Do not save completely empty documents
      
      
      

      if (saveTimer) clearTimeout(saveTimer);
      const snapshot = {
        id: state.docId,
        type: state.docType,
        title: doc.title,
        updatedAt: Date.now(),
        data: {
          objectsById: state.objectsById,
          objectIds: state.objectIds,
          notebookContent: state.notebookContent
        }
      };
      saveTimer = setTimeout(() => {
        saveQueue = saveQueue.then(() => saveDocument(snapshot));
        saveTimer = null;
      }, 500);
    }
  });

  // Register in global registry for keyboard shortcuts
  storeRegistry.set(doc.id, store);
  storeCleanup.set(doc.id, () => {
    if (saveTimer) clearTimeout(saveTimer);
    unsubscribe();
  });

  return store;
};

export const destroyBoardStore = (docId: string) => {
  const store = storeRegistry.get(docId);
  if (!store) return;
  storeCleanup.get(docId)?.();
  storeCleanup.delete(docId);
  storeRegistry.delete(docId);
};

// React Context for the store
export const BoardContext = createContext<ReturnType<typeof createBoardStore> | null>(null);

// Custom hook to use the store in components.
// For selectors that return objects (multiple fields), always wrap with useShallow
// to prevent the "getSnapshot should be cached" infinite loop.
export function useBoardStore<T>(selector: (state: BoardState) => T): T {
  const store = useContext(BoardContext);
  if (!store) throw new Error('Missing BoardContext.Provider in the tree');
  return useStore(store, selector);
}
