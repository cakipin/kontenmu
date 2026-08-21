export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const url = new URL(context.request.url);
    const username = url.searchParams.get("username") || "siswates1";
    const rows = await rawDb.prepare("SELECT * FROM Alokasi_Siswa WHERE siswa_id = ?").bind(username).all();
    return new Response(JSON.stringify(rows.results, null, 2), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
