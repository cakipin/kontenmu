const fs = require('fs');
const file = '/Users/cakiphin/projects/kontenmu/workers/sales-api/src/index.ts';
let content = fs.readFileSync(file, 'utf8');

const statsEndpoint = `
    if (url.pathname === "/api/stats" && request.method === "GET") {
      try {
        const totalSekolah = await env.DB.prepare("SELECT COUNT(*) as count FROM master_data_sekolah").first('count');
        const sekolahMuhammadiyah = await env.DB.prepare("SELECT COUNT(*) as count FROM master_data_sekolah WHERE nama LIKE '%Muhammadiyah%'").first('count');
        const sekolahAktif = await env.DB.prepare("SELECT COUNT(DISTINCT sekolah_id) as count FROM users WHERE role_slug = 'sekolah' AND status = 'Aktif'").first('count');
        
        const totalGuru = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role_slug = 'guru'").first('count');
        const guruAktif = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role_slug = 'guru' AND status = 'Aktif'").first('count');

        const totalSiswa = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role_slug = 'siswa'").first('count');
        const siswaAktif = await env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role_slug = 'siswa' AND status = 'Aktif'").first('count');

        return json({
          success: true,
          data: {
            totalSekolah: totalSekolah || 0,
            sekolahMuhammadiyah: sekolahMuhammadiyah || 0,
            sekolahAktif: sekolahAktif || 0,
            totalGuru: totalGuru || 0,
            guruAktif: guruAktif || 0,
            totalSiswa: totalSiswa || 0,
            siswaAktif: siswaAktif || 0
          }
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }
`;

if (!content.includes('/api/stats')) {
  content = content.replace('if (url.pathname === "/api/buku"', statsEndpoint + '\n    if (url.pathname === "/api/buku"');
  fs.writeFileSync(file, content);
  console.log("Endpoint /api/stats added!");
} else {
  console.log("Endpoint already exists");
}
