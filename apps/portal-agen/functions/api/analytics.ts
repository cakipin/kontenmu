const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPost = async (context: any) => {
  try {
    const payload = await context.request.json();
    const { id, type, watchTime } = payload;

    if (!id || !type) {
      return new Response(
        JSON.stringify({ error: "id and type wajib diisi" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const rawDb = context.env.DB;

    if (type === "view") {
      // Increment viewed count
      await rawDb.prepare("UPDATE contents SET dilihat = dilihat + 1 WHERE id = ?").bind(id).run();
    } else if (type === "watch_time" && typeof watchTime === "number") {
      // Add to total watch time
      await rawDb.prepare("UPDATE contents SET total_watch_time = total_watch_time + ? WHERE id = ?").bind(watchTime, id).run();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
