import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@repo/auth';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';

function makeInitial(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session, setCustomSession } = useAuth();
  const [status, setStatus] = useState('Memproses autentikasi...');
  const [error, setError] = useState<string | null>(null);
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    const code = searchParams.get('code');
    
    if (!code) {
      setError('Kode otorisasi tidak ditemukan. Silakan ulangi proses login.');
      return;
    }

    effectRan.current = true;

    const exchangeToken = async () => {
      try {
        setStatus('Menukarkan kode otorisasi dengan token...');
        
        const response = await fetch('/api/auth/sso', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirectUri: `${window.location.origin}/oauth/callback`,
            userId: session?.id
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gagal mendapatkan profil pengguna: ${errorText}`);
        }

        const data = await response.json();
        const userData = data.userData;

        setStatus(`Berhasil terhubung sebagai ${userData.name || userData.email}. Memasuki sistem...`);
        
        const role = userData.role || 'pending'; 
        const username = userData.kontenmu_username || userData.email || 'user.sso';

        // Set actual user session instead of falling back to a demo role
        setCustomSession({
          id: userData.internal_id,
          username: username,
          role: role as any,
          displayName: userData.name || username,
          initial: makeInitial(userData.name || username),
          nbm: userData.nbm,
          picture: userData.picture,
          loginAt: Date.now(),
          isSso: true
        });
        
        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);

      } catch (err: any) {
        setError(`Kesalahan integrasi SSO: ${err.message}`);
      }
    };

    exchangeToken();
  }, [searchParams, navigate, setCustomSession]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw', background: 'var(--bg-primary)',
    }}>
      <GlassCard style={{ width: '100%', maxWidth: '400px', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>SSO DiasMu</h2>
        
        {error ? (
          <div>
            <p style={{ color: 'var(--error)', marginBottom: '24px' }}>{error}</p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Kembali ke Login
            </button>
          </div>
        ) : (
          <div>
            <div style={{ margin: '24px 0' }}>
              <span style={{ fontSize: '2rem', display: 'inline-block' }}>⏳</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{status}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
