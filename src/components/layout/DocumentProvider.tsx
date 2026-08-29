import { useEffect, useState } from 'react';
import { BoardContext, createBoardStore, destroyBoardStore } from '../../core/store/useBoardStore';
import { getDocument } from '../../core/store/idb';
import { InfiniteCanvas } from '../canvas/InfiniteCanvas';
import { NotebookPanel } from '../notebook/NotebookPanel';
import { storeRegistry, useAppStore } from '../../core/store/useAppStore';

const DocumentContent = ({ type, docId }: { type: 'whiteboard' | 'notebook'; docId: string }) => {
  if (type === 'notebook') {
    return <NotebookPanel docId={docId} toolbarSlotId="notebook-toolbar-slot" />;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', overflow: 'hidden' }}>
      <InfiniteCanvas />
    </div>
  );
};

export const DocumentProvider = ({ docId }: { docId: string }) => {
 const [store, setStore] = useState<ReturnType<typeof createBoardStore> | null>(() => storeRegistry.get(docId) || null);

 useEffect(() => {
 if (storeRegistry.has(docId)) {
 setStore(storeRegistry.get(docId)!);
 return;
 }
 
 let isMounted = true;
 getDocument(docId).then(docData => {
 if (!isMounted) return;
 if (docData) {
 setStore(createBoardStore(docData));
 } else {
 const meta = useAppStore.getState().documents.find(d => d.id === docId);
 if (meta) {
 setStore(createBoardStore(meta as any));
 }
 }
 });
 return () => {
   isMounted = false;
   const appState = useAppStore.getState();
   if (!appState.tabs.includes(docId) && !appState.splitTabs.includes(docId)) destroyBoardStore(docId);
 };
 }, [docId]);

 useEffect(() => {
   if (store) window.dispatchEvent(new Event('board-store-ready'));
 }, [store]);

 if (!store) {
 const knownDocument = useAppStore.getState().documents.some(document => document.id === docId);
 return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>{knownDocument ? 'Loading document...' : 'Document unavailable'}</div>;
 }

 return (
 <BoardContext.Provider value={store}>
 <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
 <DocumentContent type={store.getState().docType} docId={docId} />
 </div>
 </BoardContext.Provider>
 );
};
