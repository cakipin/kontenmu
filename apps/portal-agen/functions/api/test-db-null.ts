export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    // Insert "null" string into an integer column
    const res = await rawDb.prepare("INSERT INTO Alokasi_Siswa (siswa_id, sekolah_id, isbn) VALUES ('test-null-string', 'null', '123')").run();
    const row = await rawDb.prepare("SELECT * FROM Alokasi_Siswa WHERE siswa_id = 'test-null-string'").first();
    await rawDb.prepare("DELETE FROM Alokasi_Siswa WHERE siswa_id = 'test-null-string'").run();
    return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
