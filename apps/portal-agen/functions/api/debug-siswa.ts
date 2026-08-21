export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const row = await rawDb.prepare("SELECT * FROM users WHERE username = 'Guru123'").first();
    return new Response(JSON.stringify(row), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
};
