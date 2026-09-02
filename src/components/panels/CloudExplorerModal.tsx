import { useState, useEffect } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useAppStore, storeRegistry } from '../../core/store/useAppStore';
import { saveDocument } from '../../core/store/idb';
import { listDocumentsFromCloud, syncDocumentFromCloud, deleteDocumentFromCloud } from '../../core/supabaseClient';
import { X, Cloud, Download, Trash2, FileText, LayoutDashboard, RefreshCw } from 'lucide-react';

export const CloudExplorerModal = ({ onClose }: { onClose: () => void }) => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';
  
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const docs = await listDocumentsFromCloud();
    setDocuments(docs);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDownload = async (id: string) => {
    setActioningId(id);
    const cloudDoc = await syncDocumentFromCloud(id);
    if (cloudDoc) {
      await saveDocument(cloudDoc);
      const appStore = useAppStore.getState();
      await appStore.loadDocuments();
      appStore.openTab(id, false);
      
      const store = storeRegistry.get(id);
      if (store) {
        if (cloudDoc.type === 'whiteboard') {
          store.setState({ objectsById: cloudDoc.data.objectsById, objectIds: cloudDoc.data.objectIds });
        } else {
          store.setState({ notebookContent: cloudDoc.data.notebookContent });
        }
      }
      onClose();
    } else {
      alert('Failed to download document from cloud.');
      setActioningId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this document from the cloud?')) return;
    setActioningId(id);
    const success = await deleteDocumentFromCloud(id);
    if (success) {
      setDocuments(docs => docs.filter(d => d.id !== id));
      useAppStore.getState().updateDocument(id, { isCloudLinked: false });
    } else {
      alert('Failed to delete document from cloud.');
    }
    setActioningId(null);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cloud size={18} color="#3b82f6" /> Cloud Explorer
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={fetchDocs} disabled={loading} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: loading ? 'not-allowed' : 'pointer', padding: '4px' }}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', color: isDark ? '#94a3b8' : '#64748b' }}>
              <Cloud size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
              <p>No documents found in the cloud.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {documents.map(doc => {
                const Icon = doc.type === 'notebook' ? FileText : LayoutDashboard;
                const iconColor = doc.type === 'notebook' ? '#f59e0b' : '#3b82f6';
                const dateStr = new Date(doc.updated_at).toLocaleString();
                const isActioning = actioningId === doc.id;
                
                return (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', background: isDark ? '#0f172a' : '#f8fafc', borderRadius: '8px', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                      <Icon size={20} color={iconColor} style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.title}</div>
                        <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#64748b' }}>Updated: {dateStr}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0 }}>
                      <button 
                        disabled={isActioning}
                        onClick={() => handleDownload(doc.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', cursor: isActioning ? 'not-allowed' : 'pointer', opacity: isActioning ? 0.7 : 1 }}
                      >
                        <Download size={14} /> Open
                      </button>
                      <button 
                        disabled={isActioning}
                        onClick={() => handleDelete(doc.id)}
                        style={{ display: 'flex', alignItems: 'center', padding: '6px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: isActioning ? 'not-allowed' : 'pointer', opacity: isActioning ? 0.7 : 1 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
