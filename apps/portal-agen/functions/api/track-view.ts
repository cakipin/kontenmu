export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const data = await request.json() as { id: string };
    
    if (!data.id) {
      return new Response(JSON.stringify({ error: "Missing content ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { success } = await env.KONTENMU_DB.prepare(
      "UPDATE contents SET views = views + 1 WHERE id = ?"
    ).bind(data.id).run();

    if (success) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ error: "Failed to update views" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error tracking view:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
