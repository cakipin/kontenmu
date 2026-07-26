
export default function SimSekolah() {
  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 140px)',
      backgroundImage: 'url("/assets/ai_school.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '40px'
    }}>
      {/* Dark overlay to make text readable */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 1
      }} />

      {/* Copywriting Content */}
      <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px', padding: '30px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(12px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '100px', fontWeight: 700, fontSize: '0.85rem', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          Modul Dalam Pengembangan
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          Kelola Sekolah Lebih Mudah.<br/>
          <span style={{ color: '#3b82f6' }}>Tumbuh Lebih Cepat</span> dengan AI.
        </h2>
        <p style={{ color: '#e2e8f0', lineHeight: 1.7, fontSize: '1.1rem', marginBottom: '30px' }}>
          Segera hadir: Ekosistem <strong>SIM Sekolah Cerdas</strong> yang menyatukan akademik, administrasi, keuangan, dan komunikasi dalam satu platform terintegrasi. Otomatisasi tugas harian Anda dan dapatkan wawasan <i>data-driven</i> untuk masa depan sekolah yang lebih baik.
        </p>
        <button style={{ background: '#047857', color: '#fff', padding: '14px 28px', borderRadius: '12px', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s' }}>
          Pelajari Lebih Lanjut
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
