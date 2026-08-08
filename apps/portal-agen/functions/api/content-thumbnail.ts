const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const url = new URL(context.request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "id wajib diisi" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const result = await rawDb.prepare("SELECT thumbnail_url FROM contents WHERE id = ?").bind(id).first();

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Konten tidak ditemukan" }),
        { status: 404, headers: jsonHeaders },
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        thumbnailUrl: result.thumbnail_url 
      }),
      { headers: jsonHeaders },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
