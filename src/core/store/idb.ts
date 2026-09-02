import { openDB, type IDBPDatabase } from 'idb';
import type { BoardObject } from '../../types/objects';

export interface DocumentMeta {
  id: string;
  title: string;
  type: 'whiteboard' | 'notebook';
  updatedAt: number; isCloudLinked?: boolean; cloudUpdatedAt?: number;
}

export interface DocumentData extends DocumentMeta {
  data: {
    objectsById?: Record<string, BoardObject>;
    objectIds?: string[];
    notebookContent?: string;
  };
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB('VisualBoardDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const getDocuments = async (): Promise<DocumentMeta[]> => {
  const db = await getDB();
  const docs = await db.getAll('documents');
  return docs.map(d => ({
    id: d.id,
    title: d.title,
    type: d.type,
    updatedAt: d.updatedAt, isCloudLinked: d.isCloudLinked, cloudUpdatedAt: d.cloudUpdatedAt,
  })).sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getDocument = async (id: string): Promise<DocumentData | undefined> => {
  const db = await getDB();
  return db.get('documents', id);
};

let syncTimeoutId: Record<string, ReturnType<typeof setTimeout>> = {};

export const saveDocument = async (doc: DocumentData): Promise<void> => {
  const db = await getDB();
  await db.put('documents', doc);

  // Debounced Auto-Sync to Cloud
  if (doc.isCloudLinked) {
    const { useSettingsStore } = await import('./useSettingsStore');
    if (useSettingsStore.getState().autoSyncCloud) {
      if (syncTimeoutId[doc.id]) {
        clearTimeout(syncTimeoutId[doc.id]);
      }
      syncTimeoutId[doc.id] = setTimeout(async () => {
        try {
          const { uploadDocumentToCloud } = await import('../supabaseClient');
          const res = await uploadDocumentToCloud(doc); if (!res.success) throw new Error(res.error || 'Unknown error');
          console.log(`Auto-synced doc ${doc.id} to cloud`);
        } catch (e) {
          console.error(`Auto-sync failed for doc ${doc.id}`, e);
        }
      }, 5000); // 5s debounce
    }
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete('documents', id);
};
