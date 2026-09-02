
import { useSettingsStore } from '../core/store/useSettingsStore';
import { Ghost } from 'lucide-react';

export const NotFoundPage = () => {
  const { theme } = useSettingsStore();
  const isDark = theme === 'dark' || theme === 'midnight';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh', backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', fontFamily: 'Inter, sans-serif' }}>
      <Ghost size={80} color="#3b82f6" style={{ marginBottom: '24px', opacity: 0.8 }} />
      <h1 style={{ fontSize: '4rem', margin: '0 0 16px 0', fontWeight: 800 }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: isDark ? '#94a3b8' : '#64748b', marginBottom: '32px' }}>Oops! The page you're looking for doesn't exist.</p>
      
      <button 
        onClick={() => window.location.href = '/'} 
        style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
      >
        Return to Workspace
      </button>
    </div>
  );
};
