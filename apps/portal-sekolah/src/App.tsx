import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@repo/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Allocation from './pages/Allocation';
import '../../../packages/ui/src/styles/promax.css';

const NAVIGATION = [
  { id: 'dashboard', path: '/', label: 'Dasbor Utama', icon: '📊' },
  { id: 'inventory', path: '/inventory', label: 'Inventaris KontenMu', icon: '📦' },
  { id: 'allocation', path: '/allocation', label: 'Alokasi Akses Siswa', icon: '👥' },
];

function AppContent() {
  const { session, logout, sessionTimeLeft } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!session) return null;

  const sekolahId = session.sekolahId ?? 1;
  const activeNav = NAVIGATION.find((nav) => nav.path === location.pathname) || NAVIGATION[0];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span style={{ color: 'var(--accent-primary)', marginRight: '8px' }}>🏫</span>
          Portal<span style={{ color: 'var(--accent-primary)' }}>Sekolah</span>
        </div>

        <nav style={{ padding: '16px 0', flex: 1 }}>
          {NAVIGATION.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span style={{ marginRight: '12px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {sessionTimeLeft && (
          <div style={{
            padding: '12px 16px', margin: '0 12px 16px', fontSize: '0.75rem',
            color: 'var(--text-secondary)', borderTop: '1px solid var(--glass-border)',
          }}>
            Sesi aktif: {sessionTimeLeft}
          </div>
        )}
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ fontWeight: 600, fontSize: '1.25rem' }}>{activeNav.label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{
                cursor: 'pointer', fontSize: '18px', padding: '4px', borderRadius: '50%',
                border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', width: '32px', height: '32px',
              }}
              title="Ganti Tema"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '36px', height: '36px',
                background: 'linear-gradient(to top right, var(--primary), var(--accent-primary))',
                color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold', fontSize: '14px',
              }}>
                {session.initial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {session.displayName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Admin Sekolah
                </span>
              </div>
              <button
                onClick={logout}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: 'none',
                  padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', marginLeft: '8px',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="admin-content" style={{ background: 'var(--bg-primary)' }}>
          <Routes>
            <Route path="/" element={<Dashboard sekolahId={sekolahId} />} />
            <Route path="/inventory" element={<Inventory sekolahId={sekolahId} />} />
            <Route path="/allocation" element={<Allocation sekolahId={sekolahId} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        Memuat sesi...
      </div>
    );
  }

  return isAuthenticated ? <AppContent /> : <Login />;
}

function App() {
  return (
    <AuthProvider appId="portal-sekolah" allowedRoles={['sekolah']}>
      <Router>
        <Routes>
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
