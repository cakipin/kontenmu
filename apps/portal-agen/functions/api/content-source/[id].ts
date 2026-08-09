const privateHeaders = {
  "Cache-Control": "private, no-store",
  "Content-Disposition": "inline",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function mediaKey(sourceUrl: string) {
  try {
    const pathname = sourceUrl.startsWith("http")
      ? new URL(sourceUrl).pathname
      : sourceUrl.split("?", 1)[0];
    const marker = "/api/media/";
    const index = pathname.indexOf(marker);
    if (index < 0) return null;
    const parts = pathname.slice(index + marker.length).split("/");
    if (parts[0] === "nocache" || parts[0] === "v2") parts.shift();
    const key = decodeURIComponent(parts.join("/"));
    return key && !key.includes("..") ? key : null;
  } catch {
    return null;
  }
}

export const onRequestGet = async (context: any) => {
  try {
    const id = String(context.params.id || "");
    if (!id) return new Response("Not Found", { status: 404 });

    const row = await context.env.DB.prepare(
      "SELECT source_url FROM contents WHERE id = ?",
    )
      .bind(id)
      .first<{ source_url: string | null }>();
    if (!row?.source_url) return new Response("Not Found", { status: 404 });

    const key = mediaKey(row.source_url);
    if (!key) {
      return new Response("Sumber konten tidak valid", {
        status: 502,
        headers: privateHeaders,
      });
    }

    const range = context.request.headers.get("Range");
    const object = await context.env.MEDIA.get(
      key,
      range ? { range: context.request.headers } : undefined,
    );
    if (!object) return new Response("Not Found", { status: 404 });

    const headers = new Headers(privateHeaders);
    object.writeHttpMetadata(headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("ETag", object.httpEtag);
    if (range && object.range) {
      headers.set(
        "Content-Range",
        `bytes ${object.range.offset}-${
          object.range.offset + object.range.length - 1
        }/${object.size}`,
      );
      headers.set("Content-Length", String(object.range.length));
    } else {
      headers.set("Content-Length", String(object.size));
    }

    return new Response(object.body, {
      status: range && object.range ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    return new Response(error.message, {
      status: 500,
      headers: privateHeaders,
    });
  }
};
