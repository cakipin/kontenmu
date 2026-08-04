import { useState, useEffect } from 'react';
import { GlassCard } from '../../../../packages/ui/src/GlassCard';
import { Rocket, GitMerge, CheckCircle2, AlertCircle, Eye, EyeOff, ExternalLink, Activity, Clock, RefreshCw, XCircle } from 'lucide-react';

export function DeploymentManager() {
  const [githubToken, setGithubToken] = useState('');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [isPushingProd, setIsPushingProd] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');

  const fetchLogs = async () => {
    if (!githubToken || !repoOwner || !repoName) {
      setLogsError('Konfigurasi GitHub belum lengkap');
      return;
    }
    setIsLoadingLogs(true);
    setLogsError('');
    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/actions/runs?per_page=5`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.workflow_runs || []);
      } else {
        const err = await response.json().catch(() => ({}));
        setLogsError(err.message || 'Gagal mengambil log');
      }
    } catch (e: any) {
      setLogsError(e.message || 'Terjadi kesalahan jaringan');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, githubToken, repoOwner, repoName]);

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

  const rollbackProduction = async () => {
    if (!githubToken || !repoOwner || !repoName) {
      setMessage({ text: 'Harap lengkapi Token PAT, Repo Owner, dan Repo Name untuk Rollback.', type: 'error' });
      return;
    }

    if (!window.confirm('PERINGATAN: Aksi ini akan membatalkan (undo) 1 update terakhir dan mengembalikan sistem ke versi stabil sebelumnya. Lanjutkan?')) {
      return;
    }

    setIsRollingBack(true);
    setMessage({ text: 'Memulai Rollback Production (Membatalkan Update Terakhir)...', type: 'info' });

    try {
      const response = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'rollback-production'
        })
      });

      if (response.ok || response.status === 204) {
        setMessage({ text: 'Rollback berhasil dipicu! Silakan cek tab Actions di GitHub Anda.', type: 'success' });
      } else {
        const errData = await response.json().catch(() => ({}));
        setMessage({ text: `Gagal Rollback: ${errData.message || response.statusText}`, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Rocket size={20} color="var(--primary)" />
             <div>
               <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Manajemen Deployment</h2>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Setup koneksi Git dan trigger deployment dari Dashboard</p>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
            <button 
              type="button"
              onClick={() => setActiveTab('config')} 
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: activeTab === 'config' ? 'var(--primary)' : 'transparent', color: activeTab === 'config' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
            >
              Konfigurasi
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('logs')} 
              style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: activeTab === 'logs' ? 'var(--primary)' : 'transparent', color: activeTab === 'logs' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
            >
              <Activity size={14} /> Log & Report
            </button>
          </div>
        </div>
        
        {activeTab === 'config' ? (
          <>
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="action-button" 
              onClick={pushGit} 
              disabled={isPushingGit}
            >
              <GitMerge size={16} />
              {isPushingGit ? 'Memicu Git...' : 'Push Git (Staging)'}
            </button>
            <button 
              type="button" 
              className="action-button" 
              onClick={pushProduction} 
              disabled={isPushingProd}
              style={{ background: 'var(--success)', color: '#fff', border: 'none' }}
            >
              <Rocket size={16} />
              {isPushingProd ? 'Mendeploy...' : 'Push Production'}
            </button>
            <button 
              type="button" 
              className="action-button" 
              onClick={rollbackProduction} 
              disabled={isRollingBack}
              style={{ background: 'var(--danger, #ef4444)', color: '#fff', border: 'none' }}
            >
              <AlertCircle size={16} />
              {isRollingBack ? 'Rollback...' : 'Rollback Update Terakhir'}
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
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Riwayat Deployment</h3>
              <button 
                type="button" 
                onClick={fetchLogs} 
                disabled={isLoadingLogs}
                style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
            
            {logsError && (
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                {logsError}
              </div>
            )}
            
            {!isLoadingLogs && logs.length === 0 && !logsError && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                Belum ada riwayat deployment atau log tidak dapat diambil.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {logs.map((log: any) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ marginTop: '2px' }}>
                      {log.status === 'completed' ? (
                        log.conclusion === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />
                      ) : (
                        <RefreshCw size={18} color="#3b82f6" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {log.name} 
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                          #{log.run_number}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {new Date(log.created_at).toLocaleString('id-ID')}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GitMerge size={12} /> {log.head_branch}</span>
                      </div>
                    </div>
                  </div>
                  <a href={log.html_url} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Buka Log <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
