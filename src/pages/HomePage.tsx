import { motion } from 'framer-motion';

export const HomePage = () => (
  <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 32, background: 'linear-gradient(135deg,#f8fafc,#eef2ff)', color: '#0f172a' }}>
    <section style={{ maxWidth: 900, textAlign: 'center' }}>
      <motion.img src="/logo.png" alt="WBN" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: 110, height: 110, borderRadius: 28, boxShadow: '0 20px 45px rgba(59,130,246,.25)' }} />
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} style={{ fontSize: 'clamp(2.5rem,7vw,5rem)', margin: '28px 0 12px' }}>Think visually. Write clearly.</motion.h1>
      <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: 650, margin: '0 auto 28px' }}>WBN combines an infinite whiteboard with a focused notebook so diagrams, ideas, and documentation stay together.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/board" style={{ padding: '12px 22px', borderRadius: 10, background: '#2563eb', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Open workspace</a>
        <a href="/doc" style={{ padding: '12px 22px', borderRadius: 10, background: '#fff', color: '#1e293b', textDecoration: 'none', fontWeight: 700, border: '1px solid #cbd5e1' }}>Read the guide</a>
      </div>
    </section>
  </main>
);
