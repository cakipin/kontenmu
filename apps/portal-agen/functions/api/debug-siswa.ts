export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    // Fix all null sekolah_id in Alokasi_Siswa by joining with users table
    await rawDb.prepare(`
      UPDATE Alokasi_Siswa 
      SET sekolah_id = (SELECT sekolah_id FROM users WHERE users.username = Alokasi_Siswa.siswa_id OR users.id = Alokasi_Siswa.siswa_id LIMIT 1)
      WHERE sekolah_id IS NULL OR sekolah_id = 'null'
    `).run();
    
    const rows = await rawDb.prepare("SELECT * FROM Alokasi_Siswa ORDER BY id DESC LIMIT 20").all();
    return new Response(JSON.stringify(rows.results), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
