import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { useAppStore, getActiveStore, storeRegistry } from '../../core/store/useAppStore';
import { Settings, Columns, ChevronDown, FilePlus, Save, FolderOpen, Download, Sun, Moon, Globe2, Cloud, CloudUpload, CloudOff, RefreshCw, CloudDownload } from 'lucide-react';
import { CloudExplorerModal } from './CloudExplorerModal';
import { encryptData, decryptData } from '../../utils/encryption';
import { getDocument, saveDocument, type DocumentData } from '../../core/store/idb';
import { createBoardStore, destroyBoardStore } from '../../core/store/useBoardStore';
import logoUrl from '/logo.png';

export const GlobalMenu = () => {
  const { theme, toggleSettings } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';
  
  const { isSplitViewOpen, toggleSplitView, activeMenuTab, setActiveMenuTab, focusedTabId, activeTabId, documents } = useAppStore();
  const focusedDocument = documents.find(document => document.id === (focusedTabId || activeTabId));
  const isNotebook = focusedDocument?.type === 'notebook';

  useEffect(() => {
    if (isNotebook && activeMenuTab === 'Property') setActiveMenuTab('Home');
  }, [activeMenuTab, isNotebook, setActiveMenuTab]);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveCandidates, setSaveCandidates] = useState<string[]>([]);
  const [saveIds, setSaveIds] = useState<string[]>([]);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const cloudMenuRef = useRef<HTMLDivElement>(null);
  const [cloudMenuOpen, setCloudMenuOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) setFileMenuOpen(false);
      if (cloudMenuRef.current && !cloudMenuRef.current.contains(e.target as Node)) setCloudMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  const handleUploadToCloud = async () => {
    if (!focusedDocument) return;
    const { uploadDocumentToCloud } = await import('../../core/supabaseClient');
    const store = storeRegistry.get(focusedDocument.id);
    const persisted = await getDocument(focusedDocument.id);
    const state = store?.getState();
    const docData = {
      ...focusedDocument,
      data: state ? {
        objectsById: state.objectsById,
        objectIds: state.objectIds,
        notebookContent: state.notebookContent,
      } : persisted?.data || {},
    };
    const res = await uploadDocumentToCloud(docData);
    if (res.success) {
      useAppStore.getState().updateDocument(focusedDocument.id, { isCloudLinked: true, cloudUpdatedAt: Date.now() });
      alert('Successfully uploaded to cloud!');
    } else {
      alert('Failed to upload: ' + (res.error || 'Check Supabase settings'));
    }
    setCloudMenuOpen(false);
  };

  const handleSyncFromCloud = async () => {
    if (!focusedDocument) return;
    const { syncDocumentFromCloud } = await import('../../core/supabaseClient');
    const cloudDoc = await syncDocumentFromCloud(focusedDocument.id);
    if (cloudDoc) {
      await saveDocument(cloudDoc);
      useAppStore.getState().updateDocument(focusedDocument.id, { isCloudLinked: true, cloudUpdatedAt: cloudDoc.updatedAt });
      const store = storeRegistry.get(focusedDocument.id);
      if (store) {
        if (cloudDoc.type === 'whiteboard') {
          store.setState({ objectsById: cloudDoc.data.objectsById, objectIds: cloudDoc.data.objectIds });
        } else {
          store.setState({ notebookContent: cloudDoc.data.notebookContent });
        }
      }
      alert('Synced successfully from cloud.');
    }
    setCloudMenuOpen(false);
  };

  const handleRemoveFromCloud = async () => {
    if (!focusedDocument) return;
    if (confirm('Are you sure? This will delete the document from Supabase but keep it on your local device.')) {
      const { deleteDocumentFromCloud } = await import('../../core/supabaseClient');
      await deleteDocumentFromCloud(focusedDocument.id);
      useAppStore.getState().updateDocument(focusedDocument.id, { isCloudLinked: false });
    }
    setCloudMenuOpen(false);
  };

  const handleNew = (type: 'whiteboard' | 'notebook') => {
    const appStore = useAppStore.getState();
    appStore.createDocument(type).then(id => {
      const storeApi = getActiveStore()?.getState();
      const inSplit = storeApi ? appStore.splitTabId === storeApi.docId : false;
      appStore.openTab(id, inSplit);
    });
    setFileMenuOpen(false);
  };

  const handleSave = () => {
    const appState = useAppStore.getState();
    const ids = [...new Set([...appState.tabs, ...appState.splitTabs])];
    setSaveCandidates(ids);
    setSaveIds(ids);
    setSaveDialogOpen(true);
    setFileMenuOpen(false);
  };

  const saveSelectedDocuments = async () => {
    const selectedDocuments = (await Promise.all(saveIds
      .map(async id => {
        const store = storeRegistry.get(id);
        const metadata = documents.find(document => document.id === id);
        if (!metadata) return null;
        const persisted = await getDocument(id);
        const state = store?.getState();
        return {
          id,
          title: metadata.title,
          type: metadata.type,
          updatedAt: Date.now(),
          data: state ? {
            objectsById: state.objectsById,
            objectIds: state.objectIds,
            notebookContent: state.notebookContent,
          } : persisted?.data || {},
        } satisfies DocumentData;
      })))
      .filter((document): document is DocumentData => Boolean(document));
    if (selectedDocuments.length === 0) return;
    const encrypted = await encryptData(JSON.stringify({ version: 3, documents: selectedDocuments }));
    const url = URL.createObjectURL(new Blob([encrypted], { type: 'application/octet-stream' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `wb-studio-${Date.now()}.wnb`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSaveDialogOpen(false);
  };

  const handleExport = () => {
    window.dispatchEvent(new Event('export-canvas-image'));
    setFileMenuOpen(false);
  };

  const handlePdfExport = () => {
    const store = getActiveStore();
    if (!isNotebook || !store) {
      store?.getState().showToast('Open a notebook before saving as PDF');
      setFileMenuOpen(false);
      return;
    }
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      store.getState().showToast('Allow popups to export the notebook PDF');
      setFileMenuOpen(false);
      return;
    }
    printWindow.document.write(`<!doctype html><html><head><title>Notebook</title><style>body{font-family:Inter,Segoe UI,sans-serif;max-width:780px;margin:40px auto;line-height:1.6;color:#111827}img{max-width:100%}table{border-collapse:collapse;width:100%}td,th{border:1px solid #cbd5e1;padding:6px}</style></head><body>${store.getState().notebookContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    setFileMenuOpen(false);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wnb,.board';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (!ev.target?.result) return;
        try {
          const parsed = JSON.parse(await decryptData(ev.target.result as string));
          if (Array.isArray(parsed.documents)) {
            for (const imported of parsed.documents as DocumentData[]) {
              destroyBoardStore(imported.id);
              await saveDocument(imported);
              createBoardStore(imported);
            }
            await useAppStore.getState().loadDocuments();
            const appStore = useAppStore.getState();
            parsed.documents.forEach((document: DocumentData) => appStore.openTab(document.id, false));
          } else {
            await getActiveStore()?.getState()?.loadProject(ev.target.result as string);
          }
        } catch {
          await getActiveStore()?.getState()?.loadProject(ev.target.result as string);
        }
      };
      reader.readAsText(file);
    };
    input.click();
    setFileMenuOpen(false);
  };

  const ribbonStyle = {
    display: 'flex', flexDirection: 'column' as const, width: '100%',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#0f172a', zIndex: 1000, position: 'relative' as const,
  };
  
  const tabContainerStyle = { display: 'flex', alignItems: 'center', padding: '6px 16px', gap: '8px', borderBottom: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', position: 'relative' as const, zIndex: 1000 };
  
  const fileBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '4px 10px', cursor: 'pointer', background: fileMenuOpen ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent', border: 'none',
    color: isDark ? '#f8fafc' : '#0f172a', borderRadius: '4px',
    fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
  };

  const menuItemStyle = {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%',
    background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left' as const,
    fontSize: '0.85rem'
  };

  const divider = { width: '1px', height: '16px', backgroundColor: isDark ? '#334155' : '#e2e8f0', margin: '0 8px' };
  const navStyle = (tab: 'File' | 'Home' | 'Insert' | 'Property') => ({
    ...fileBtnStyle,
    background: activeMenuTab === tab ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent',
    color: activeMenuTab === tab ? '#3b82f6' : (isDark ? '#f8fafc' : '#0f172a'),
    opacity: tab === 'Property' && isNotebook ? 0.45 : 1,
    cursor: tab === 'Property' && isNotebook ? 'not-allowed' : 'pointer',
  });

  return (
    <>
    <div style={ribbonStyle}>
      <div style={tabContainerStyle}>
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '8px' }}>
         <img src={logoUrl} alt="Logo" style={{ width: 42, height: 42, borderRadius: 10 }} />
       </div>

 {/* FILE MENU */}
 <div ref={fileMenuRef} style={{ position: 'relative' }}>
 <button style={navStyle('File')} onClick={() => { setActiveMenuTab('File'); setFileMenuOpen(!fileMenuOpen); }}>
 File <ChevronDown size={14} />
 </button>
 
 {fileMenuOpen && (
 <div style={{
 position: 'absolute', top: '100%', left: 0, marginTop: '4px',
 background: isDark ? '#1e293b' : '#ffffff',
 border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
 borderRadius: '6px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
 zIndex: 2000, display: 'flex', flexDirection: 'column', minWidth: '160px', padding: '4px 0'
 }}>
 <button onClick={() => handleNew('whiteboard')} style={menuItemStyle}><FilePlus size={14} /> New Whiteboard</button>
 <button onClick={() => handleNew('notebook')} style={menuItemStyle}><FilePlus size={14} /> New Notebook</button>
 <div style={{ height: '1px', background: isDark ? '#334155' : '#e2e8f0', margin: '4px 0' }} />
 <button onClick={handleSave} style={menuItemStyle}><Save size={14} /> Save</button>
 <button onClick={handleImport} style={menuItemStyle}><FolderOpen size={14} /> Open Local File</button>
        <button onClick={() => { setExplorerOpen(true); setFileMenuOpen(false); }} style={menuItemStyle}><CloudDownload size={14} color="#3b82f6" /> Browse Cloud</button>
 <button onClick={handleExport} style={menuItemStyle}><Download size={14} /> Export Image</button>
 <button onClick={handlePdfExport} style={menuItemStyle}><Download size={14} /> Save as PDF</button>
 </div>
 )}
 </div>
 
  {/* CLOUD MENU */}
  {focusedDocument && (
    <div style={{ position: 'relative' }} ref={cloudMenuRef}>
      <button 
        style={{ ...navStyle('File'), background: cloudMenuOpen ? (isDark ? '#1e293b' : '#f1f5f9') : 'transparent' }} 
        onClick={() => { setCloudMenuOpen(!cloudMenuOpen); setFileMenuOpen(false); }}
      >
        <Cloud size={14} color={focusedDocument.isCloudLinked ? "#10b981" : "currentColor"} />
        <ChevronDown size={14} />
      </button>
      
      {cloudMenuOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px',
          background: isDark ? '#1e293b' : '#ffffff',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          borderRadius: '6px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 2000, display: 'flex', flexDirection: 'column', minWidth: '160px', padding: '4px 0'
        }}>
          <button onClick={handleUploadToCloud} style={menuItemStyle}>
            <CloudUpload size={14} /> {focusedDocument.isCloudLinked ? 'Push to Cloud' : 'Upload to Cloud'}
          </button>
          
          {focusedDocument.isCloudLinked && (
            <>
              <button onClick={handleSyncFromCloud} style={menuItemStyle}>
                <RefreshCw size={14} /> Sync from Cloud
              </button>
              <div style={{ height: '1px', background: isDark ? '#334155' : '#e2e8f0', margin: '4px 0' }} />
              <button onClick={handleRemoveFromCloud} style={{ ...menuItemStyle, color: '#ef4444' }}>
                <CloudOff size={14} /> Remove Link
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )}

  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
    <button
      onClick={() => toggleSplitView()}
      title={isSplitViewOpen ? 'Close split view' : 'Enable split view'}
      style={{
        background: isSplitViewOpen ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
 border: isSplitViewOpen ? 'none' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
 color: isSplitViewOpen ? '#fff' : 'inherit',
 cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
 padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
 }}
 >
 <Columns size={14} />
 {isSplitViewOpen && <span>Split</span>}
 </button>
 <div style={divider} />
 <button onClick={() => useSettingsStore.getState().setTheme(isDark ? 'light' : 'dark')} title="Toggle theme" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}>
   {isDark ? <Sun size={16} /> : <Moon size={16} />}
 </button>
 <button onClick={() => window.location.hash = '/'} title="Open home page" style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex' }}>
   <Globe2 size={16} />
 </button>
 <button onClick={toggleSettings} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px' }}>
 <Settings size={16} />
 </button>
 </div>
 </div>
 </div>
 {saveDialogOpen && (
   <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
     <div style={{ background: isDark ? '#1e293b' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', borderRadius: 12, padding: 20, minWidth: 320, boxShadow: '0 20px 40px rgba(0,0,0,.25)' }}>
       <h3 style={{ marginTop: 0 }}>Save documents</h3>
       {saveCandidates.map(id => {
         const doc = documents.find(item => item.id === id);
         if (!doc) return null;
         return <label key={id} style={{ display: 'flex', gap: 8, padding: '6px 0' }}>
           <input type="checkbox" checked={saveIds.includes(id)} onChange={() => setSaveIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])} />
           {doc.type === 'notebook' ? 'Notebook' : 'Whiteboard'}: {doc.title}
         </label>;
       })}
       <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
         <button onClick={() => setSaveDialogOpen(false)}>Cancel</button>
         <button onClick={saveSelectedDocuments} disabled={saveIds.length === 0}>Save selected</button>
       </div>
     </div>
   </div>
 )}
 {explorerOpen && <CloudExplorerModal onClose={() => setExplorerOpen(false)} />}
  </>
 );
};
