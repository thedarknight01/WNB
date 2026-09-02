import { Shield, HardDrive, Cloud, Key, Zap } from 'lucide-react';
import logoUrl from '/logo.png';

export const DocumentationPage = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{ width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <a href="#/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '1.25rem', marginBottom: '16px' }}>
          <img src={logoUrl} alt="Logo" style={{ width: 28, height: 28, borderRadius: 6 }} />
          WBN Docs
        </a>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Getting Started</div>
          <a href="#intro" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 600, padding: '8px 12px', background: '#eff6ff', borderRadius: '6px' }}>Introduction</a>
          <a href="#ui" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Interface Overview</a>
          
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Core Features</div>
          <a href="#whiteboard" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Infinite Whiteboard</a>
          <a href="#notebook" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Structured Notebook</a>
          <a href="#setup" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Supabase Setup</a>
          <a href="#magic" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Magic Tags (@)</a>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Architecture</div>
          <a href="#storage" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500 }}>Local-First Storage</a>
          <a href="#/policy" style={{ textDecoration: 'none', color: '#475569', padding: '8px 12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={14} /> Security Policy</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px 64px', maxWidth: '900px', overflowY: 'auto' }}>
        <header style={{ marginBottom: '48px' }}>
          <h1 id="intro" style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.03em', color: '#0f172a' }}>WBN Technical Documentation</h1>
          <p style={{ fontSize: '1.25rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Welcome to the official documentation for WBN Studio. Learn how to maximize your productivity using our local-first, encrypted workspace.
          </p>
        </header>

        <section style={{ marginBottom: '48px' }}>
          <h2 id="ui" style={{ fontSize: '1.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>Interface Overview</h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            WBN Studio is designed around a unified workspace that seamlessly blends an infinite canvas with a structured text editor. 
            The interface is split into contextual toolbars depending on whether you are editing a whiteboard or a notebook.
          </p>
          <ul style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', paddingLeft: '24px' }}>
            <li><strong>Global Menu:</strong> Manage your files, cloud sync, and application settings.</li>
            <li><strong>Contextual Ribbon:</strong> Tools automatically switch based on your active pane.</li>
            <li><strong>Split View:</strong> Click the <kbd style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.85em' }}>Split</kbd> button to view a whiteboard and notebook side-by-side.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '48px' }}>
          <h2 id="whiteboard" style={{ fontSize: '1.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>Infinite Whiteboard</h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            The whiteboard is a WebGL/Canvas powered infinite grid where you can draw shapes, connect diagrams, and embed media.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
            <div style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <Zap size={24} color="#3b82f6" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>High Performance</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Powered by Konva.js, supporting thousands of objects with minimal lag.</p>
            </div>
            <div style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
              <HardDrive size={24} color="#f59e0b" style={{ marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>Smart Snapping</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>Automatically align objects to the grid or to other nearby elements.</p>
            </div>
          </div>
        </section>

        
        <section style={{ marginBottom: '48px' }}>
          <h2 id="setup" style={{ fontSize: '1.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>Supabase Setup Guide</h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            To enable cloud syncing, you need to configure a Supabase project and create the required <code>documents</code> table.
          </p>
          
          <h3 style={{ marginTop: '24px', fontSize: '1.2rem' }}>1. Get Your API Keys</h3>
          <ul style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', paddingLeft: '24px' }}>
            <li>Go to your Supabase project dashboard.</li>
            <li>Navigate to <strong>Project Settings</strong> &gt; <strong>API</strong>.</li>
            <li>Copy the <strong>Project URL</strong> and the <strong>anon public key</strong>.</li>
            <li>Paste these into WBN Studio's Settings under the <strong>Sync & Data</strong> tab.</li>
          </ul>

          <h3 style={{ marginTop: '24px', fontSize: '1.2rem' }}>2. Execute the Setup SQL</h3>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            In your Supabase dashboard, go to the <strong>SQL Editor</strong> and run the following command to create the table and disable RLS (since WBN relies on local encryption):
          </p>
          <pre style={{ background: '#0f172a', color: '#f8fafc', padding: '16px', borderRadius: '8px', overflowX: 'auto', fontSize: '0.9rem', marginBottom: '16px', fontFamily: 'monospace' }}>
create table if not exists documents (
  id text primary key,
  title text not null,
  type text not null,
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table documents disable row level security;
          </pre>

          <h3 style={{ marginTop: '24px', fontSize: '1.2rem' }}>3. Reload Schema Cache</h3>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            If you get a 'table not found' error immediately after creation, Supabase's API cache might be stale.
            In your Supabase dashboard, go to <strong>Table Editor</strong>, click the dropdown next to the green 'New Table' button, and select <strong>Reload Schema Cache</strong>.
          </p>
        </section>

        <section style={{ marginBottom: '48px' }}>
          <h2 id="storage" style={{ fontSize: '1.8rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '24px' }}>Storage Architecture</h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '1.05rem', marginBottom: '16px' }}>
            WBN operates on a strict Local-First architecture. Your data never leaves your device unless you explicitly link a document to the cloud.
          </p>
          
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}><HardDrive size={18} /> IndexedDB (Local)</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>All changes are persisted to your browser's IndexedDB instantaneously. This guarantees offline capability and zero latency.</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}><Key size={18} /> WNB3 AES-GCM Encryption</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>Exported backups (.wnb files) are compressed using native GZIP streams and encrypted using AES-256-GCM. Your local derivation key ensures that even if a file is intercepted, it remains unreadable.</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 12px' }}><Cloud size={18} /> Supabase Sync</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>If a Supabase endpoint is configured, you can explicitly "Push to Cloud". Background auto-sync debounces every 5 seconds to prevent rate limiting while keeping your remote data up to date.</p>
          </div>
        </section>

      </main>
    </div>
  );
};
