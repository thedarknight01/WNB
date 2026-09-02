import { useState } from 'react';
import { useSettingsStore } from '../../core/store/useSettingsStore';
import { checkCloudConnection } from '../../core/supabaseClient';
import { X, CheckCircle, AlertTriangle, Copy, ExternalLink, RefreshCw } from 'lucide-react';

export const SetupDatabaseModal = ({ onClose }: { onClose: () => void }) => {
  const { theme, supabaseUrl } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sqlCode = `create table if not exists documents (
  id text primary key,
  title text not null,
  type text not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table documents disable row level security;`;

  const copyCode = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verifyConnection = async () => {
    setChecking(true);
    setError(null);
    const res = await checkCloudConnection();
    if (res.success) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    } else {
      setError(res.error || 'Failed to verify connection');
    }
    setChecking(false);
  };

  let projectRef = '';
  try {
    const urlObj = new URL(supabaseUrl);
    projectRef = urlObj.hostname.split('.')[0];
  } catch {
    // ignore
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '480px', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', overflow: 'hidden', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Database Setup Guide
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#10b981' }}>
              <CheckCircle size={48} style={{ marginBottom: '16px' }} />
              <h3 style={{ margin: 0 }}>Connection Successful!</h3>
              <p style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: '0.9rem', marginTop: '8px' }}>Your database is ready for syncing.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.95rem', margin: '0 0 16px 0', lineHeight: 1.5, color: isDark ? '#cbd5e1' : '#475569' }}>
                To enable cloud syncing, please create the <strong>documents</strong> table in your Supabase project.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>1. Copy this SQL Code</span>
                  <button onClick={copyCode} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
                    {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                  </button>
                </div>
                <div style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', overflowX: 'auto', border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0', color: isDark ? '#cbd5e1' : '#475569', whiteSpace: 'pre-wrap' }}>
                  {sqlCode}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'block', marginBottom: '8px' }}>2. Run in Supabase</span>
                <p style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 12px 0' }}>Go to the SQL Editor in your Supabase dashboard and run the code.</p>
                <a 
                  href={projectRef ? `https://supabase.com/dashboard/project/${projectRef}/sql/new` : "https://supabase.com/dashboard"} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none', fontWeight: 500 }}
                >
                  Open Supabase SQL Editor <ExternalLink size={14} />
                </a>
              </div>

              {error && (
                <div style={{ padding: '10px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  onClick={verifyConnection}
                  disabled={checking}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: checking ? 'not-allowed' : 'pointer', opacity: checking ? 0.7 : 1 }}
                >
                  {checking ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</> : 'Verify Connection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
