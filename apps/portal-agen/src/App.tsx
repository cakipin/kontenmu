import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useRef, useState, lazy, Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider, useAuth } from '@repo/auth';

import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import NotFound from './pages/NotFound';

const Users = lazy(() => import('./pages/Users'));
const History = lazy(() => import('./pages/History'));
const SalesForm = lazy(() => import('./pages/SalesForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));
const SimSekolah = lazy(() => import('./pages/SimSekolah'));
const AiSettings = lazy(() => import('./pages/AiSettings'));
const Profile = lazy(() => import('./pages/Profile'));
const SchoolProfile = lazy(() => import('./pages/SchoolProfile'));

const FeaturePages = import('./pages/FeaturePages');
const Allocation = lazy(() => FeaturePages.then(m => ({ default: m.Allocation })));
const TeacherAccess = lazy(() => FeaturePages.then(m => ({ default: m.TeacherAccess })));
const Catalog = lazy(() => FeaturePages.then(m => ({ default: m.Catalog })));
const Inventory = lazy(() => FeaturePages.then(m => ({ default: m.Inventory })));
const LearningHistory = lazy(() => FeaturePages.then(m => ({ default: m.LearningHistory })));
const Library = lazy(() => FeaturePages.then(m => ({ default: m.Library })));
const Payments = lazy(() => FeaturePages.then(m => ({ default: m.Payments })));
const PlayKonten = lazy(() => FeaturePages.then(m => ({ default: m.PlayKonten })));
const SchoolUsers = lazy(() => FeaturePages.then(m => ({ default: m.SchoolUsers })));
const Subscriptions = lazy(() => FeaturePages.then(m => ({ default: m.Subscriptions })));
const UploadContent = lazy(() => FeaturePages.then(m => ({ default: m.UploadContent })));
const MasterSekolah = lazy(() => FeaturePages.then(m => ({ default: m.MasterSekolah })));
const RoleAccessSettings = lazy(() => FeaturePages.then(m => ({ default: m.RoleAccessSettings })));
import { SchmuChatWidget } from './components/SchmuChatWidget';
import { useAppData } from './data/appData';
import '../../../packages/ui/src/styles/promax.css';

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Admin',
  agen: 'Agen',
  sekolah: 'Admin Sekolah',
  siswa: 'Siswa (MASA)',
  guru: 'Guru',
  uploader: 'Uploader Konten',
  pending: 'Menunggu Persetujuan',
};

type NavIcon =
  | 'dashboard'
  | 'users'
  | 'catalog'
  | 'sales'
  | 'history'
  | 'payments'
  | 'subscription'
  | 'upload'
  | 'inventory'
  | 'allocation'
  | 'schoolusers'
  | 'library'
  | 'learning'
  | 'school'
  | 'settings'
  | 'chevron-down';

type NavItemType = {
  id: string;
  path?: string;
  label: string;
  icon?: NavIcon;
  subItems?: { id: string; path: string; label: string }[];
};

const MASTER_NAVIGATION: NavItemType[] = [
  { id: 'dashboard', path: '/dashboard', label: 'Dasbor Utama', icon: 'dashboard' },
  { id: 'users', path: '/users', label: 'Kelola User', icon: 'users' },
  { id: 'catalog', path: '/catalog', label: 'Master Katalog', icon: 'catalog' },
  { 
    id: 'konten', 
    label: 'Konten', 
    icon: 'upload', 
    subItems: [
      { id: 'upload', path: '/upload-content', label: 'Upload' },
      { id: 'play', path: '/play-content', label: 'Play Konten' }
    ]
  },
  { id: 'sales', path: '/sales', label: 'Input Penjualan', icon: 'sales' },
  { id: 'sales-history', path: '/sales/history', label: 'Riwayat Penjualan', icon: 'history' },
  { id: 'subscriptions', path: '/subscriptions', label: 'Langganan Sekolah', icon: 'subscription' },
  { id: 'payments', path: '/payments', label: 'Invoice & Pembayaran', icon: 'payments' },
  { id: 'master-sekolah', path: '/master-sekolah', label: 'Master Sekolah', icon: 'school' },
  { id: 'sim-sekolah', path: '/sim-sekolah', label: 'SIM Sekolah', icon: 'school' },
  { id: 'access-settings', path: '/access-settings', label: 'Pengaturan', icon: 'settings' },
  { id: 'ai-settings', path: '/ai-settings', label: 'Pengaturan AI', icon: 'settings' },
  { id: 'inventory', path: '/inventory', label: 'Inventaris KontenMu', icon: 'inventory' },
  { id: 'allocation', path: '/allocation', label: 'Alokasi Akses Siswa', icon: 'allocation' },
  { id: 'teacher-allocation', path: '/teacher-allocation', label: 'Alokasi Akses Guru', icon: 'schoolusers' },
  { id: 'school-users', path: '/school-users', label: 'Users', icon: 'schoolusers' },
  { id: 'profile', path: '/profile', label: 'Profil Pengguna', icon: 'users' },
  { id: 'school-profile', path: '/school-profile', label: 'Profil Sekolah', icon: 'school' },
  { id: 'library', path: '/library', label: 'Player Konten', icon: 'library' },
  { id: 'learning', path: '/learning', label: 'Progress Belajar', icon: 'learning' },
];

const MOBILE_NAVIGATION: Record<string, Array<{ id: string; path: string; label: string; icon: NavIcon }>> = {
  superadmin: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'upload', path: '/upload-content', label: 'Upload', icon: 'upload' },
    { id: 'play', path: '/play-content', label: 'Player', icon: 'library' },
    { id: 'users', path: '/users', label: 'User', icon: 'users' },
  ],
  agen: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'sales', path: '/sales', label: 'Penjualan', icon: 'sales' },
    { id: 'subscriptions', path: '/subscriptions', label: 'Langganan', icon: 'subscription' },
    { id: 'sim-sekolah', path: '/sim-sekolah', label: 'Sekolah', icon: 'school' },
  ],
  sekolah: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'inventory', path: '/inventory', label: 'Konten', icon: 'inventory' },
    { id: 'allocation', path: '/allocation', label: 'Alokasi', icon: 'allocation' },
    { id: 'school-users', path: '/school-users', label: 'User', icon: 'schoolusers' },
  ],
  siswa: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'library', path: '/library', label: 'Belajar', icon: 'library' },
    { id: 'school-profile', path: '/school-profile', label: 'Sekolah', icon: 'school' },
  ],
  guru: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'library', path: '/library', label: 'Mengajar', icon: 'library' },
    { id: 'school-profile', path: '/school-profile', label: 'Sekolah', icon: 'school' },
  ],
  uploader: [
    { id: 'dashboard', path: '/dashboard', label: 'Dasbor', icon: 'dashboard' },
    { id: 'upload', path: '/upload-content', label: 'Upload', icon: 'upload' },
    { id: 'play', path: '/play-content', label: 'Player', icon: 'library' },
    { id: 'catalog', path: '/catalog', label: 'Katalog', icon: 'catalog' },
  ],
  pending: [
    { id: 'dashboard', path: '/dashboard', label: 'Status', icon: 'dashboard' },
  ],
};

function Icon({ name }: { name: NavIcon | 'bell' | 'brand' | 'menu' | 'close' | 'sun' | 'moon' | 'logout' | 'plus' | 'chevron-left' | 'chevron-right' }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 2,
  };

  const paths: Record<string, ReactNode> = {
    dashboard: <><path d="M4 13h6V4H4z" /><path d="M14 20h6v-9h-6z" /><path d="M4 20h6v-3H4z" /><path d="M14 7h6V4h-6z" /></>,
    users: <><path d="M16 19c0-2.2-1.8-4-4-4H7c-2.2 0-4 1.8-4 4" /><circle cx="9.5" cy="7" r="3" /><path d="M21 19c0-1.8-1.2-3.2-3-3.8" /><path d="M16.5 4.4a3 3 0 0 1 0 5.2" /></>,
    catalog: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M8 4v16" /><path d="M11 8h4" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></>,
    sales: <><path d="M6 6h15l-2 8H8z" /><path d="M6 6 5 3H3" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></>,
    history: <><path d="M4 5v5h5" /><path d="M5 10a8 8 0 1 0 2.4-5.7" /><path d="M12 8v5l3 2" /></>,
    payments: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M7 15h3" /></>,
    subscription: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /><path d="m9 15 2 2 4-4" /></>,
    inventory: <><path d="M21 8 12 3 3 8l9 5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>,
    allocation: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 11h-6" /><path d="M20 8v6" /></>,
    schoolusers: <><path d="M16 18v-1.5A3.5 3.5 0 0 0 12.5 13h-5A3.5 3.5 0 0 0 4 16.5V18" /><circle cx="10" cy="8" r="3" /><path d="M18 8h4" /><path d="M20 6v4" /></>,
    library: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2" /></>,
    learning: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    school: <><path d="M14 22v-4a2 2 0 1 0-4 0v4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M18 5v17"/><path d="m4 6 8-4 8 4"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></>,
    settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
    brand: <><path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z" /><path d="M9 4v16" /><path d="M12 8h3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.9 4.9 1.4 1.4" /><path d="m17.7 17.7 1.4 1.4" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.3 17.7-1.4 1.4" /><path d="m19.1 4.9-1.4 1.4" /></>,
    moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5" />,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    'chevron-left': <path d="m15 18-6-6 6-6" />,
    'chevron-right': <path d="m9 18 6-6-6-6" />,
    'bell': <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  };

  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" {...common}>
      {paths[name]}
    </svg>
  );
}

function AppContent() {
  const { session, logout, sessionTimeLeft, switchRole } = useAuth();
  const IS_DEV = import.meta.env.DEV;
  const { data } = useAppData();
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
  // pendingApiUsers: diambil langsung dari /api/users agar user registrasi baru selalu muncul
  const [pendingApiUsers, setPendingApiUsers] = useState<any[]>([]);

  const fetchPendingApiUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev'}/api/users`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json() as { success?: boolean; data?: any[] };
      const allUsers: any[] = json.data ?? [];
      // Tampilkan user pending (role=pending) atau menunggu approve
      const pending = allUsers.filter(u =>
        u.role === 'pending' || u.status === 'Menunggu Approve'
      );
      setPendingApiUsers(pending);
    } catch {
      // jaringan error – abaikan
    }
  };

  // newUsers tetap dari data.users (sso/manual source) untuk backward compat
  const newUsers = data.users.filter(
    (user) => user.username !== session?.username && user.role !== 'pending' && user.status !== 'Menunggu Approve' && (
      user.newUserSource === 'sso'
      || user.newUserSource === 'manual'
      || user.terakhirLogin === 'Belum pernah login'
    ),
  );
  const notificationCount = pendingApiUsers.length + newUsers.length;

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [approvingRoles, setApprovingRoles] = useState<Record<string, string>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Polling: ambil user pending langsung dari /api/users setiap 45 detik ---
  useEffect(() => {
    if (session?.role !== 'superadmin') return;

    void fetchPendingApiUsers(); // jalankan sekali saat mount
    pollingRef.current = setInterval(fetchPendingApiUsers, 45_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.role]);

  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!session) return null;

  let navItems = MASTER_NAVIGATION.filter(item => {
    if (session.role === 'pending') return item.id === 'dashboard';
    if (session.role === 'superadmin' && item.id === 'users') return true;
    if (session.role === 'superadmin' && item.id === 'access-settings') return true;
    
    if (item.subItems) {
      return item.subItems.some(sub => data.roleAccessPermissions?.[sub.id]?.includes(session.role));
    }
    
    return data.roleAccessPermissions?.[item.id]?.includes(session.role);
  });
  if (navItems.length === 0) navItems = [{ id: 'dashboard', path: '/dashboard', label: 'Dasbor Utama', icon: 'dashboard' }];

  let activeNav = navItems.find((nav) => nav.path === location.pathname);
  if (!activeNav) {
    activeNav = navItems.find(nav => nav.subItems?.some(sub => sub.path === location.pathname)) || navItems[0];
  }
  const mobileNavItems = MOBILE_NAVIGATION[session.role] ?? MOBILE_NAVIGATION.pending;

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'is-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="brand-mark"><Icon name="brand" /></div>
          <span className="brand-text">Konten<span>Mu</span></span>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="admin-nav" aria-label="Navigasi utama">
          {navItems.map((item) => {
            if (item.subItems) {
              const isOpen = openMenuId === item.id;
              const isActive = item.subItems.some((sub) => location.pathname === sub.path);
              return (
                <div key={item.id} className={`admin-nav-group ${isOpen ? 'is-open' : ''} ${isActive ? 'active-group' : ''}`}>
                  <button className={`admin-nav-item has-submenu ${isActive ? 'active' : ''}`} onClick={() => toggleMenu(item.id)}>
                    <span className="nav-icon"><Icon name={item.icon!} /></span>
                    <span className="menu-text">{item.label}</span>
                    <span className={`submenu-indicator ${isOpen ? 'open' : ''}`}><Icon name="chevron-down" /></span>
                  </button>
                  {isOpen && (
                    <div className="admin-submenu">
                      {item.subItems.filter(sub => data.roleAccessPermissions?.[sub.id]?.includes(session.role)).map((sub) => (
                        <Link
                          key={sub.id}
                          to={sub.path}
                          className={`admin-nav-item sub-item ${location.pathname === sub.path ? 'active' : ''}`}
                        >
                          <span className="menu-text">{sub.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.id}
                to={item.path!}
                className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon"><Icon name={item.icon!} /></span>
                <span className="menu-text">{item.label}</span>
              </Link>
            );
          })}


        </nav>

        {sessionTimeLeft && (
          <div className="session-card">
            <span>Sesi aktif</span>
            <strong>{sessionTimeLeft}</strong>
          </div>
        )}
      </aside>
      {isSidebarOpen && <button className="admin-scrim" aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="topbar-title-group">
            <div className="pwa-player-brand" aria-label="KontenMu">
              <div className="pwa-player-brand-mark"><Icon name="brand" /></div>
              <span className="pwa-player-brand-text">Konten<span>Mu</span></span>
            </div>
            <button className="icon-button mobile-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Buka menu">
              <Icon name="menu" />
            </button>
            <button className="icon-button desktop-menu-button" onClick={() => setIsCollapsed(!isCollapsed)} aria-label="Toggle sidebar" style={{ display: 'flex', marginRight: '10px' }}>
              <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} />
            </button>
            <div className="topbar-page-title">
              <div className="topbar-kicker">{(session.role === 'sekolah' || session.role === 'siswa' || session.role === 'guru') && (session as any).wilayah ? (session as any).wilayah.toUpperCase() : ROLE_LABELS[session.role]}</div>
              <h1 className="topbar-title">{activeNav.label}</h1>
            </div>
          </div>
          
          <div className="topbar-actions">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="icon-button pwa-theme-control"
              title="Ganti Tema"
              aria-label="Ganti tema"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>

            {session.role === 'superadmin' && (
              <div className="pwa-notification-control" style={{ position: 'relative' }}>
                <button 
                  className={`icon-button ${notificationCount > 0 ? 'has-notifications' : ''}`} 
                  aria-label="Notifikasi" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ 
                    position: 'relative',
                    color: notificationCount > 0 ? '#ef4444' : 'inherit',
                    animation: notificationCount > 0 ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Icon name="bell" />
                  {notificationCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white',
                      borderRadius: '50%', fontSize: '0.7rem', width: 20, height: 20, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                      border: '2px solid var(--bg-secondary)',
                      boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.2)'
                    }}>
                      {notificationCount}
                    </span>
                  )}
                </button>
                <style>{`
                  @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                  }
                `}</style>

                {showNotifications && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    width: '380px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 9999,
                    padding: '16px'
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>Notifikasi</h3>
                    {notificationCount === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Tidak ada notifikasi baru.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {newUsers.map(user => (
                          <div key={`new-${user.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {user.nama || user.username}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {user.newUserSource === 'sso' ? 'Login baru via SSO' : 'User baru ditambahkan'}
                              </span>
                            </div>
                            <Link
                              to="/users"
                              onClick={() => setShowNotifications(false)}
                              style={{
                                flexShrink: 0, color: 'var(--primary)', textDecoration: 'none',
                                fontSize: '0.8rem', fontWeight: 600,
                              }}
                            >
                              Lihat
                            </Link>
                          </div>
                        ))}
                        {pendingApiUsers.map(user => (
                          <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {user.nama || user.username}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {user.status === 'Menunggu Approve'
                                  ? `Pengajuan: ${ROLE_LABELS[user.requestedRole || user.role] || 'User'}`
                                  : 'Menunggu approve'}
                              </span>
                              {user.status === 'Menunggu Approve' && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                  <div>Institusi: {user.wilayah}</div>
                                  {user.masaAktif && <div>Masa: {user.masaAktif}</div>}
                                  {user.suratTugas && <div style={{ color: 'var(--brand-primary)' }}>File: {user.suratTugas}</div>}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: 'column' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <select
                                  value={approvingRoles[user.id] || user.requestedRole || (user.role !== 'pending' ? user.role : 'sekolah')}
                                  onChange={(e) => setApprovingRoles({ ...approvingRoles, [user.id]: e.target.value })}
                                  style={{
                                    padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.8rem',
                                    outline: 'none', cursor: 'pointer'
                                  }}
                                >
                                  <option value="sekolah">Sekolah</option>
                                  <option value="agen">Agen</option>
                                  <option value="uploader">Uploader</option>
                                  <option value="guru">Guru</option>
                                  <option value="siswa">Siswa</option>
                                </select>
                                <button
                                  disabled={approvingIds.has(user.id)}
                                  style={{
                                    background: approvingIds.has(user.id) ? '#94a3b8' : 'var(--accent-primary)',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    padding: '6px 12px', fontSize: '0.8rem',
                                    cursor: approvingIds.has(user.id) ? 'not-allowed' : 'pointer',
                                    fontWeight: 600, minWidth: '72px'
                                  }}
                                  onClick={async () => {
                                    const roleToAssign = approvingRoles[user.id] || user.requestedRole || (user.role !== 'pending' ? user.role : 'sekolah');

                                    // Tandai sedang loading
                                    setApprovingIds(prev => new Set([...prev, user.id]));

                                    // Hapus dari list lokal segera (optimistic)
                                    setPendingApiUsers(prev => prev.filter(u => u.id !== user.id));

                                    try {
                                      await fetch(`${import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev'}/api/users/${user.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          ...user,
                                          role: roleToAssign,
                                          status: 'Aktif',
                                          newUserSource: null
                                        })
                                      });
                                      // Refresh list setelah approve berhasil
                                      await fetchPendingApiUsers();
                                    } catch (err) {
                                      console.error('Failed to approve user', err);
                                      // Kembalikan ke list jika gagal
                                      await fetchPendingApiUsers();
                                    } finally {
                                      setApprovingIds(prev => { const s = new Set(prev); s.delete(user.id); return s; });
                                    }
                                  }}
                                >
                                  {approvingIds.has(user.id) ? '...' : 'Approve'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="topbar-divider pwa-desktop-only" />

            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {/* Role Switcher hanya tampil di mode development */}
              {IS_DEV && session.role !== 'pending' && (
                <div className="pwa-desktop-only">
                  <select 
                    value={session.role}
                    onChange={(e) => switchRole(e.target.value as any)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    aria-label="Simulasi Role (Dev Only)"
                    title="[DEV ONLY] Ganti role untuk simulasi"
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'inherit' }}>
                  <div className="user-avatar" style={{ padding: session.picture ? 0 : undefined, overflow: 'hidden' }}>
                    {session.picture ? (
                      <img src={session.picture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      session.initial
                    )}
                  </div>
                  <div className="user-copy pwa-desktop-only">
                    <span>{session.displayName}</span>
                    <small>{ROLE_LABELS[session.role]}</small>
                  </div>
                </div>

                {showProfileMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)',
                    borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 9999,
                    minWidth: '200px', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                  }}>
                    <div className="pwa-mobile-only" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem' }}>{session.displayName}</strong>
                      <small style={{ color: 'var(--text-secondary)' }}>{ROLE_LABELS[session.role]}</small>
                    </div>
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                      textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <Icon name="users" /> Profil Pengguna
                    </Link>
                    <button onClick={() => { setShowProfileMenu(false); logout(); }} style={{
                      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                      fontSize: '0.95rem', textAlign: 'left', width: '100%'
                    }}>
                      <Icon name="logout" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard currentRole={session.role} />} />
              <Route path="/users" element={<Users />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/sales" element={<SalesForm />} />
              <Route path="/sales/history" element={<History />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/upload-content" element={<UploadContent />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/allocation" element={<Allocation />} />
              <Route path="/teacher-allocation" element={<TeacherAccess />} />
              <Route path="/school-users" element={<SchoolUsers />} />
              <Route path="/library" element={<Library />} />
              <Route path="/play-content" element={<PlayKonten />} />
              <Route path="/learning-history" element={<LearningHistory />} />
              <Route path="/sim-sekolah" element={<SimSekolah />} />
              <Route path="/master-sekolah" element={<MasterSekolah />} />
              <Route path="/access-settings" element={<RoleAccessSettings />} />
              <Route path="/ai-settings" element={<AiSettings />} />
              <Route path="/editor/:id?" element={<Editor />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/school-profile" element={<SchoolProfile />} />
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </div>
        
        <footer className="admin-footer">
          <div>&copy; 2026 KontenMu. All rights reserved.</div>
          <div>V63.0</div>
        </footer>
      </main>

      <nav
        className="mobile-bottom-nav"
        aria-label="Navigasi cepat"
        style={{ gridTemplateColumns: `repeat(${mobileNavItems.length + 1}, minmax(0, 1fr))` }}
      >
        {mobileNavItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`mobile-bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        <button className="mobile-bottom-nav-item mobile-more-button" type="button" onClick={() => setSidebarOpen(true)}>
          <Icon name="menu" />
          <span>Menu</span>
        </button>
      </nav>
      
      {/* Global AI Chat Widget */}
      {(session?.role === 'sekolah' || session?.role === 'siswa') && data.isChatWidgetEnabled && (
        <SchmuChatWidget />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-secondary)',
    }}>
      Memuat sesi...
    </div>
  );
}

function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Login />;
}

function RegisterRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Register />;
}

function EditorRoute() {
  const { isAuthenticated, session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (session?.role !== 'superadmin') return <Navigate to="/dashboard" replace />;

  return <Editor />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? (
    <Suspense fallback={<LoadingScreen />}>
      <AppContent />
    </Suspense>
  ) : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider appId="portal-agen">
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterRoute />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/editor" element={
            <Suspense fallback={<LoadingScreen />}>
              <EditorRoute />
            </Suspense>
          } />
          <Route path="/*" element={<AppRoutes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
