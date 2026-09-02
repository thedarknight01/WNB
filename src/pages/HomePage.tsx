import { motion } from 'framer-motion';
import { Code, FileText, Shield, ArrowRight } from 'lucide-react';
import logoUrl from '/logo.png';

export const HomePage = () => {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #f8fafc, #eef2ff)', color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header / Nav */}
      <nav style={{ padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800, fontSize: '1.25rem' }}>
          <img src={logoUrl} alt="WBN" style={{ width: 32, height: 32, borderRadius: 8 }} />
          WBN Studio
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontWeight: 500, fontSize: '0.95rem' }}>
          <a href="#/doc" style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> Docs</a>
          <a href="#/policy" style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={16} /> Privacy</a>
          <a href="#/about" style={{ color: '#475569', textDecoration: 'none' }}>About</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><Code size={18} /> GitHub</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <motion.img 
          src={logoUrl} alt="WBN" 
          initial={{ scale: 0.8, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          style={{ width: 120, height: 120, borderRadius: 28, boxShadow: '0 20px 45px rgba(59,130,246,.25)' }} 
        />
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.15 }} 
          style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, margin: '32px 0 16px', letterSpacing: '-0.03em' }}
        >
          Think visually. Write clearly.
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.25 }}
          style={{ fontSize: '1.25rem', color: '#475569', maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}
        >
          WBN Studio combines an infinite geometric whiteboard with a structured TipTap notebook so your diagrams, ideas, and documentation stay seamlessly intertwined.
        </motion.p>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.35 }}
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <a href="#/board" style={{ padding: '14px 28px', borderRadius: '12px', background: '#3b82f6', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.4)' }}>
            Open Workspace <ArrowRight size={18} />
          </a>
          <a href="#/doc" style={{ padding: '14px 28px', borderRadius: '12px', background: '#ffffff', color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Read the Guide
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}>
        <div>&copy; {new Date().getFullYear()} WBN Studio. Local-first architecture.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#/policy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy & Security</a>
          <a href="#/about" style={{ color: 'inherit', textDecoration: 'none' }}>About the Project</a>
        </div>
      </footer>
    </main>
  );
};
