import { useSettingsStore } from '../core/store/useSettingsStore';
import { ArrowLeft, Shield, Lock, Server, EyeOff } from 'lucide-react';

export const PolicyPage = () => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#475569';
  const border = isDark ? '#334155' : '#e2e8f0';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, color: textMain, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Header */}
      <header style={{ padding: '32px 48px', borderBottom: `1px solid ${border}`, backgroundColor: cardBg, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', color: '#3b82f6', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', padding: 0 }}
          >
            <ArrowLeft size={18} /> Back to Studio
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: border }}></div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.025em' }}>Privacy & Security Architecture</h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '64px 48px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.025em', color: textMain }}>Security by Design.</h2>
          <p style={{ fontSize: '1.125rem', color: textMuted, lineHeight: 1.6, maxWidth: '700px', margin: 0 }}>
            WBN Studio is engineered on a strict local-first architecture. Your data sovereignty and privacy are not just policies—they are hardcoded into the structural foundation of the application.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          
          {/* Section 1 */}
          <section style={{ backgroundColor: cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', color: '#3b82f6' }}><Server size={24} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textMain }}>1. Local-First Execution</h3>
            </div>
            <p style={{ fontSize: '1rem', color: textMuted, lineHeight: 1.7, margin: '0 0 16px 0' }}>
              WBN Studio operates exclusively on your device. By default, all canvases, structured notes, and application preferences are written directly to your browser's native IndexedDB and LocalStorage. The application does not communicate with any proprietary backend server to process your workflow.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ backgroundColor: cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: '#10b981' }}><Lock size={24} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textMain }}>2. End-to-End Enterprise Cloud Integration</h3>
            </div>
            <p style={{ fontSize: '1rem', color: textMuted, lineHeight: 1.7, margin: '0 0 16px 0' }}>
              If you opt into the Supabase Cloud Sync feature, you are required to provision your own database infrastructure (BYOD). This guarantees strict data ownership.
            </p>
            <ul style={{ margin: 0, paddingLeft: '24px', color: textMuted, lineHeight: 1.7, fontSize: '1rem', display: 'grid', gap: '8px' }}>
              <li><strong style={{ color: textMain }}>Cryptographic Storage:</strong> Your Supabase API credentials are mathematically encrypted via AES-GCM prior to local device storage.</li>
              <li><strong style={{ color: textMain }}>Zero-Knowledge Access:</strong> WBN Studio developers maintain zero access, telemetry, or diagnostic capabilities regarding your connected database instances or synced payloads.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section style={{ backgroundColor: cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', color: '#f59e0b' }}><EyeOff size={24} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textMain }}>3. Zero Telemetry & Tracking</h3>
            </div>
            <p style={{ fontSize: '1rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>
              We respect the sanctity of your digital workspace. WBN Studio completely omits third-party analytics SDKs, session recording scripts, and diagnostic telemetry. Your creative and intellectual property remains entirely isolated and untracked.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ backgroundColor: cardBg, padding: '32px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', color: '#8b5cf6' }}><Shield size={24} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: textMain }}>4. Asset & Font Security</h3>
            </div>
            <p style={{ fontSize: '1rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>
              External assets, such as Custom Google Fonts, are fetched securely via HTTPS directly from the provider. WBN Studio employs strict sanitization protocols against all inputs, mitigating risks of Cross-Site Scripting (XSS) or malicious injection through external references.
            </p>
          </section>

        </div>

        <div style={{ marginTop: '64px', textAlign: 'center', color: textMuted, fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} WBN Studio. All rights reserved.
        </div>
      </main>
    </div>
  );
};
