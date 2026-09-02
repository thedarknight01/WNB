import { useSettingsStore } from '../core/store/useSettingsStore';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import logoUrl from '/logo.png';

export const AboutPage = () => {
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
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.025em' }}>About WBN Studio</h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '64px 48px', maxWidth: '900px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <img 
            src={logoUrl} 
            alt="WBN Studio Logo" 
            style={{ width: 120, height: 120, borderRadius: 24, boxShadow: '0 20px 40px -10px rgba(59,130,246,0.3)', marginBottom: '32px' }} 
          />
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.04em', color: textMain }}>
            WBN Studio
          </h2>
          <p style={{ fontSize: '1.25rem', color: textMuted, maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            The definitive Local-First Knowledge & Design environment for modern professionals.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          
          <section style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 16px 0', color: textMain }}>Our Mission</h3>
            <p style={{ fontSize: '1.1rem', color: textMuted, lineHeight: 1.7, margin: 0 }}>
              WBN Studio was engineered to seamlessly bridge the gap between creative geometric ideation and highly structured documentation. Whether you're architecting complex software systems, designing interfaces, or drafting detailed engineering specs, our unified workspace adapts natively to your workflow without compromise.
            </p>
          </section>

          <section style={{ backgroundColor: cardBg, padding: '40px', borderRadius: '16px', border: `1px solid ${border}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 24px 0', color: textMain }}>Core Capabilities</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
              {[
                { title: 'Infinite Whiteboard', desc: 'Hardware-accelerated rendering context for massive diagrams, mind maps, and geometric abstractions.' },
                { title: 'Rich Text Notebooks', desc: 'Enterprise-grade TipTap document editor supporting full markdown heuristics and live embeds.' },
                { title: 'Split-Screen Workflow', desc: 'Work seamlessly across disparate documents with dynamic, context-aware functional ribbons.' },
                { title: 'Local-First Foundation', desc: 'Zero latency. Complete privacy. Absolute data sovereignty via IndexedDB.' },
                { title: 'Enterprise Cloud Sync', desc: 'Bring-Your-Own-Database (BYOD) via Supabase for encrypted, rate-limited cloud redundancy.' }
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <CheckCircle2 size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', color: textMain, fontSize: '1.05rem', marginBottom: '4px' }}>{item.title}</strong>
                    <span style={{ color: textMuted, fontSize: '0.95rem', lineHeight: 1.5 }}>{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

        </div>

        <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderTop: `1px solid ${border}`, color: textMuted, fontSize: '0.95rem' }}>
          <span>Currently running <strong>WBN Studio v2.0.0</strong></span>
          <span>&copy; {new Date().getFullYear()} WBN Studio</span>
        </div>
      </main>
    </div>
  );
};
