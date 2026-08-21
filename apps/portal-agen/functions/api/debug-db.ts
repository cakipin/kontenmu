export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const res = await rawDb.prepare("SELECT * FROM Alokasi_Siswa WHERE siswa_id = 'tesguru'").all();
    return new Response(JSON.stringify(res), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
