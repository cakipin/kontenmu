import { useState, useEffect } from 'react';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';
import { Rocket, GitMerge, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';

export function DeploymentManager() {
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [isPushingProd, setIsPushingProd] = useState(false);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('deploy_githubToken') || '';
    const savedOwner = localStorage.getItem('deploy_repoOwner') || '';
    const savedName = localStorage.getItem('deploy_repoName') || '';
    
    setGithubToken(savedToken);
    setRepoOwner(savedOwner);
    setRepoName(savedName);
  }, []);

  const saveConfig = () => {
    setIsSaving(true);
    localStorage.setItem('deploy_githubToken', githubToken);
    localStorage.setItem('deploy_repoOwner', repoOwner);
    localStorage.setItem('deploy_repoName', repoName);
    
    setTimeout(() => {
      setIsSaving(false);
      setMessage({ text: 'Konfigurasi berhasil disimpan!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }, 500);
  };

  const pushGit = async () => {
    if (!githubToken || !repoOwner || !repoName) {
      setMessage({ text: 'Harap lengkapi konfigurasi GitHub terlebih dahulu.', type: 'error' });
      return;
    }
    
    setIsPushingGit(true);
    setMessage({ text: 'Memulai Push Git (Repository Dispatch)...', type: 'info' });
    
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'manual-push-from-dashboard'
        })
      });

      if (response.ok || response.status === 204) {
        setMessage({ text: 'Push Git berhasil dipicu! Silakan cek tab Actions di GitHub Anda.', type: 'success' });
      } else {
        const errData = await response.json().catch(() => ({}));
        setMessage({ text: `Gagal Push Git: ${errData.message || response.statusText}`, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsPushingGit(false);
    }
  };

  const pushProduction = async () => {
    if (!githubToken || !repoOwner || !repoName) {
      setMessage({ text: 'Harap lengkapi Token PAT, Repo Owner, dan Repo Name untuk Push Production.', type: 'error' });
      return;
    }

    setIsPushingProd(true);
    setMessage({ text: 'Memulai Push Production (Repository Dispatch)...', type: 'info' });

    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'deploy-production'
        })
      });

      if (response.ok || response.status === 204) {
        setMessage({ text: 'Push Production berhasil dipicu! Silakan cek tab Actions di GitHub Anda.', type: 'success' });
      } else {
        const errData = await response.json().catch(() => ({}));
        setMessage({ text: `Gagal Push Production: ${errData.message || response.statusText}`, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsPushingProd(false);
    }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
           <Rocket size={20} color="var(--primary)" />
           <div>
             <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manajemen Deployment</h2>
             <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Setup koneksi Git dan trigger deployment dari Dashboard</p>
           </div>
        </div>
        
        {message.text && (
          <div style={{ 
            padding: '12px 16px', 
            borderRadius: '8px', 
            backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: message.type === 'success' ? '#10b981' : message.type === 'error' ? '#ef4444' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : message.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
          }}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="input-group">
            <label>GitHub Personal Access Token (PAT)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showToken ? "text" : "password"} 
                className="input-control" 
                placeholder="ghp_xxxxxxxxxxxx" 
                value={githubToken} 
                onChange={(e) => setGithubToken(e.target.value)} 
                style={{ width: '100%', paddingRight: '40px' }}
              />
              <button 
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <a href="https://github.com/settings/tokens/new?scopes=repo,workflow" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Buat Token Baru <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div className="input-group">
            <label>Repository Owner</label>
            <input 
              type="text" 
              className="input-control" 
              placeholder="contoh: username" 
              value={repoOwner} 
              onChange={(e) => setRepoOwner(e.target.value)} 
            />
          </div>
          <div className="input-group">
            <label>Repository Name</label>
            <input 
              type="text" 
              className="input-control" 
              placeholder="contoh: kontenmu" 
              value={repoName} 
              onChange={(e) => setRepoName(e.target.value)} 
            />
            <div style={{ marginTop: '4px', fontSize: '12px' }}>
              <a href="https://github.com/new" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Login Git & Buat Repo <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={saveConfig} 
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={pushGit}
            disabled={isPushingGit}
          >
            <GitMerge size={18} />
            {isPushingGit ? 'Memicu Git...' : 'Push Git (Staging)'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--success)', borderColor: 'var(--success)' }}
            onClick={pushProduction}
            disabled={isPushingProd}
          >
            <Rocket size={18} />
            {isPushingProd ? 'Mendeploy...' : 'Push Production'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <a href="https://kontenmu.pages.dev" target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <ExternalLink size={16} /> Buka Web Staging
          </a>
          <div style={{ width: '1px', backgroundColor: 'var(--border-subtle)' }}></div>
          <a href="https://kontenmu-prod.pages.dev" target="_blank" rel="noreferrer" style={{ fontSize: '14px', color: 'var(--success)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
            <ExternalLink size={16} /> Buka Web Production
          </a>
        </div>
      </div>
    </GlassCard>
  );
}
