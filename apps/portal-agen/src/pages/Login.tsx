import { useState } from 'react';
import { useAuth } from '@repo/auth';
import { Eye, EyeOff } from 'lucide-react';

import { GlassCard } from '../../../../packages/ui/src/GlassCard';

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password harus diisi');
      return;
    }
    setIsLocalLoading(true);
    setError(null);
    const err = await login(username, password);
    if (err) {
      setError(err);
      setIsLocalLoading(false);
    }
  };

  const handleSsoRedirect = () => {
    setLoading(true);
    const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/oauth/callback`;
        const authorizeUrl = `https://dias.muhammadiyah.or.id/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    
    window.location.href = authorizeUrl;
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw', 
      background: 'radial-gradient(circle at 50% -20%, #1a365d 0%, #0f172a 50%, #020617 100%)',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <style>
        {`
          .sso-btn {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            border-radius: 12px;
            font-size: 1.05rem;
            width: 100%;
            cursor: pointer;
          }
          .sso-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2);
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          }
          .sso-btn:active {
            transform: translateY(0);
          }
          .sso-btn::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%);
            transform: skewX(-20deg);
            animation: shine 3.5s infinite;
          }
          @keyframes shine {
            0% { left: -100%; }
            20% { left: 200%; }
            100% { left: 200%; }
          }
          .logo-container {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #38bdf8, #0284c7);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px auto;
            box-shadow: 0 8px 16px rgba(2, 132, 199, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          @keyframes spin-slow {
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 2s linear infinite;
          }
          .login-input {
            width: 100%;
            padding: 14px 16px;
            background: rgba(15, 23, 42, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: white;
            font-size: 1rem;
            outline: none;
            transition: all 0.2s;
          }
          .login-input:focus {
            border-color: #38bdf8;
            background: rgba(15, 23, 42, 0.6);
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
          }
          .login-btn {
            width: 100%;
            padding: 14px 16px;
            background: white;
            color: #0f172a;
            border: none;
            border-radius: 12px;
            font-size: 1.05rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .login-btn:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
          }
          .login-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
            margin: 24px 0;
          }
          .divider::before, .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .divider:not(:empty)::before {
            margin-right: .5em;
          }
          .divider:not(:empty)::after {
            margin-left: .5em;
          }
        `}
      </style>

      <GlassCard style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '48px 40px',
        background: 'rgba(30, 41, 59, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="logo-container">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'white', letterSpacing: '-0.025em', margin: 0 }}>
            Portal <span style={{ color: '#38bdf8' }}>KontenMu</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '12px', lineHeight: 1.6 }}>
            Media Pembelajaran Digital Sekolah Masa Depan
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.9rem', textAlign: 'center', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLocalLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input 
                type="text" 
                placeholder="Username" 
                className="login-input" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLocalLoading || loading}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                className="login-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLocalLoading || loading}
                style={{ width: '100%', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button type="submit" className="login-btn" disabled={isLocalLoading || loading}>
              {isLocalLoading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="divider">Atau masuk dengan</div>

          <button 
            className="sso-btn"
            onClick={handleSsoRedirect} 
            disabled={loading} 
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                <svg className="animate-spin-slow" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="4"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="4" strokeLinecap="round"></path>
                </svg>
                Menghubungkan ke DiasMu...
              </span>
            ) : (
              <>
                <span style={{ fontWeight: 700, fontSize: '1.15rem', letterSpacing: '0.02em' }}>Muhammadiyah ID</span>
              </>
            )}
          </button>
        </div>
        
        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', width: '100%', marginBottom: '24px' }}></div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Sesi tersimpan aman selama 24 jam
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
