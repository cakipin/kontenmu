export const onRequestGet = async (context: any) => {
  try {
    const { DB } = context.env;
    const { results } = await DB.prepare(
      "SELECT content FROM page_data WHERE id = ?",
    )
      .bind("landing-data")
      .all();

    if (results && results.length > 0) {
      return new Response(results[0].content, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const { DB } = context.env;
    const data = await context.request.json();
    const contentStr = JSON.stringify(data);

    // Save to D1 (Upsert)
    await DB.prepare(
      `
      INSERT INTO page_data (id, content) 
      VALUES (?1, ?2) 
      ON CONFLICT(id) DO UPDATE SET content = ?2, updated_at = CURRENT_TIMESTAMP
    `,
    )
      .bind("landing-data", contentStr)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
