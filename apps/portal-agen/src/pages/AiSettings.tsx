import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAppData } from '../data/appData';

export default function AiSettings() {
  const { data, setData } = useAppData();
  
  const [formData, setFormData] = useState({
    isChatWidgetEnabled: data.isChatWidgetEnabled,
    aiProvider: data.aiProvider || 'schmu',
    aiApiKey: data.aiApiKey || '',
    aiApiEndpoint: data.aiApiEndpoint,
    aiBotName: data.aiBotName,
    aiWelcomeMessage: data.aiWelcomeMessage,
    aiSystemPrompt: data.aiSystemPrompt,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setFormData({
      isChatWidgetEnabled: data.isChatWidgetEnabled,
      aiProvider: data.aiProvider || 'schmu',
      aiApiKey: data.aiApiKey || '',
      aiApiEndpoint: data.aiApiEndpoint,
      aiBotName: data.aiBotName,
      aiWelcomeMessage: data.aiWelcomeMessage,
      aiSystemPrompt: data.aiSystemPrompt,
    });
  }, [data]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setData({
      ...data,
      isChatWidgetEnabled: formData.isChatWidgetEnabled,
      aiProvider: formData.aiProvider as any,
      aiApiKey: formData.aiApiKey,
      aiApiEndpoint: formData.aiApiEndpoint,
      aiBotName: formData.aiBotName,
      aiWelcomeMessage: formData.aiWelcomeMessage,
      aiSystemPrompt: formData.aiSystemPrompt,
    });
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Calculate chunks from real data
      const userChunks = data.users.length + data.schoolUsers.length;
      const schoolChunks = data.schools.length;
      const bookChunks = data.books.length;
      const contentChunks = data.contents.length;
      const totalChunks = userChunks + schoolChunks + bookChunks + contentChunks + 10; // +10 base chunks for system info

      // Generate context summary
      const contextSummary = `=== BASIS PENGETAHUAN KONTENMU ===
Total Pengguna Terdaftar: ${userChunks} (Siswa, Guru, Admin)
Total Sekolah Terdaftar: ${schoolChunks}
Total Buku/Modul: ${bookChunks}
Total Materi Interaktif (Video/Game/Infografis): ${contentChunks}

Daftar Buku (Katalog):
${data.books.map((b: any) => `- ${b.judul} (${b.kategori})`).join('\n')}
===================================`;

      setData({
        ...data,
        aiIndexedChunks: totalChunks,
        aiAutoContext: contextSummary,
      });
      setIsSyncing(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 2500);
  };

  return (
    <div className="page-shell">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.75rem', fontWeight: 700, color: '#1e293b' }}>
          Pengaturan AI Assistant
        </h1>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b' }}>
          Kelola tampilan, sambutan, dan endpoint API asisten cerdas (SCHMU Chat) untuk pengguna
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '32px', alignItems: 'start' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          padding: '32px'
        }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1e293b' }}>Status Widget Chat</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Tampilkan atau sembunyikan widget chat secara global untuk level sekolah dan siswa.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isChatWidgetEnabled: !formData.isChatWidgetEnabled })}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                background: formData.isChatWidgetEnabled ? '#10b981' : '#e2e8f0',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.2s',
                padding: '2px',
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'absolute',
                top: '2px',
                left: formData.isChatWidgetEnabled ? 'calc(100% - 26px)' : '2px',
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Provider AI (Mesin Pemroses)
            </label>
            <select 
              className="input-control" 
              value={formData.aiProvider}
              onChange={e => setFormData({ ...formData, aiProvider: e.target.value as any })}
              required
            >
              <option value="schmu">SCHMU Bawaan (Default)</option>
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (ChatGPT)</option>
              <option value="custom">Custom Endpoint API</option>
            </select>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Pilih penyedia layanan AI yang ingin Anda gunakan sebagai otak dari Asisten.</p>
          </div>

          {(formData.aiProvider === 'gemini' || formData.aiProvider === 'openai') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                API Key {formData.aiProvider === 'gemini' ? '(Gemini)' : '(OpenAI)'}
              </label>
              <input 
                type="password" 
                className="input-control" 
                value={formData.aiApiKey}
                onChange={e => setFormData({ ...formData, aiApiKey: e.target.value })}
                placeholder={`Masukkan API Key ${formData.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} Anda`}
                required
              />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Kunci akses API Anda. Disimpan secara lokal di browser.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Nama Asisten AI
            </label>
            <input 
              type="text" 
              className="input-control" 
              value={formData.aiBotName}
              onChange={e => setFormData({ ...formData, aiBotName: e.target.value })}
              placeholder="Contoh: Asisten SCHMU"
              required
            />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Nama bot yang akan tampil di atas jendela percakapan.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Pesan Sambutan Awal
            </label>
            <textarea 
              className="input-control" 
              value={formData.aiWelcomeMessage}
              onChange={e => setFormData({ ...formData, aiWelcomeMessage: e.target.value })}
              placeholder="Contoh: Halo! Ada yang bisa saya bantu hari ini?"
              rows={3}
              style={{ resize: 'vertical' }}
              required
            />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Pesan otomatis yang dikirim asisten saat jendela chat pertama kali dibuka.</p>
          </div>

          {formData.aiProvider === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                Endpoint API
              </label>
              <input 
                type="url" 
                className="input-control" 
                value={formData.aiApiEndpoint}
                onChange={e => setFormData({ ...formData, aiApiEndpoint: e.target.value })}
                placeholder="https://contoh.com/api/chat"
                required={formData.aiProvider === 'custom'}
              />
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                URL server AI. Server harus menerima metode POST dengan payload <code>{`{ message, history }`}</code>.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
              Instruksi Tambahan (System Prompt)
            </label>
            <textarea 
              className="input-control" 
              value={formData.aiSystemPrompt}
              onChange={e => setFormData({ ...formData, aiSystemPrompt: e.target.value })}
              placeholder="Contoh: Selalu arahkan pengguna ke halaman PPDB jika mereka bertanya tentang pendaftaran."
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Instruksi dasar yang selalu diingat oleh AI sebelum merespons pengguna.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button type="submit" className="btn-promax" style={{ padding: '10px 24px' }}>
              Simpan Pengaturan
            </button>
            {isSaved && (
              <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Berhasil disimpan!
              </span>
            )}
          </div>
          
        </form>
        </div>

        {/* Kolom Kanan: Basis Pengetahuan */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.8)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#1e293b' }}>Basis Pengetahuan</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Artikel dan halaman publik akan dipecah menjadi potongan semantik, lalu disimpan di Cloudflare Vectorize.
            </p>
          </div>

          <div style={{ 
            padding: '24px', 
            background: '#f8fafc', 
            borderRadius: '12px', 
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Potongan Terindeks</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              {data.aiIndexedChunks}
            </div>
          </div>

          <button 
            type="button" 
            onClick={handleSync}
            disabled={isSyncing}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: isSyncing ? '#94a3b8' : '#2563eb',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            {isSyncing ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Menyinkronkan...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
                Sinkronkan Konten
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
