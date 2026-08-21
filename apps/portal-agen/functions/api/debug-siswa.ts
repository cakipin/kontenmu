export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const info = await rawDb.prepare("PRAGMA table_info(Alokasi_Siswa)").all();
    const rows = await rawDb.prepare("SELECT * FROM Alokasi_Siswa ORDER BY id DESC LIMIT 20").all();
    return new Response(JSON.stringify({ info: info.results, rows: rows.results }, null, 2), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
