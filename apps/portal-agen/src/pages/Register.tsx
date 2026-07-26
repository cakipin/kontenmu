import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    role: 'sekolah'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.nama) {
      setError('Nama Lengkap, Username, dan Password harus diisi');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://sales-api.1912.workers.dev';
      const response = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'Menunggu Approve' // Default status for new sign ups
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Gagal melakukan pendaftaran');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100vw', 
      background: 'radial-gradient(circle at 50% -20%, #1a365d 0%, #0f172a 50%, #020617 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px'
    }}>
      <style>
        {`
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
            box-sizing: border-box;
          }
          .login-input:focus {
            border-color: #38bdf8;
            background: rgba(15, 23, 42, 0.6);
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
          }
          .login-input > option {
            background: #0f172a;
            color: white;
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
        `}
      </style>

      <GlassCard style={{
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="logo-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 style={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 8px 0' }}>Daftar Akun Baru</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 32px 0', fontSize: '0.95rem' }}>
          Silakan isi form di bawah ini untuk membuat akun baru.
        </p>

        {success ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '24px' }}>
            Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan.<br/><br/>
            Mengarahkan ke halaman login...
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Peran (Role)</label>
              <select name="role" value={formData.role} onChange={handleChange} className="login-input">
                <option value="sekolah">Admin Sekolah</option>
                <option value="siswa">Siswa</option>
                <option value="agen">Agen</option>
              </select>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Nama Lengkap</label>
              <input 
                name="nama"
                type="text" 
                value={formData.nama} 
                onChange={handleChange}
                className="login-input" 
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Email (Opsional)</label>
              <input 
                name="email"
                type="email" 
                value={formData.email} 
                onChange={handleChange}
                className="login-input" 
                placeholder="nama@email.com"
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Username</label>
              <input 
                name="username"
                type="text" 
                value={formData.username} 
                onChange={handleChange}
                className="login-input" 
                placeholder="Pilih username"
              />
            </div>

            <div style={{ textAlign: 'left', position: 'relative' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.875rem', marginBottom: '8px', fontWeight: 500 }}>Password</label>
              <input 
                name="password"
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={handleChange}
                className="login-input" 
                placeholder="••••••••"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '38px',
                  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                  padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', fontSize: '0.875rem', marginTop: '8px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: '16px' }}>
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '32px', color: '#64748b', fontSize: '0.9rem' }}>
          Sudah punya akun? <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Login di sini</Link>
        </div>
      </GlassCard>
    </div>
  );
}
