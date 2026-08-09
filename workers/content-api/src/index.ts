import { decode, verify } from "@tsndr/cloudflare-worker-jwt";

export interface Env {
  CACHE: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET?: string;
}

const CONTENT_ROLES = ["superadmin", "agen", "sekolah", "guru", "siswa", "uploader"];
const AUTH_VERIFY_URL = "https://sales-api.1912.workers.dev/api/auth/verify";

async function authorize(request: Request, env: Env) {
  const header = request.headers.get("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    let valid = false;
    if (env.JWT_SECRET) valid = await verify(token, env.JWT_SECRET);
    if (!valid) {
      const response = await fetch(AUTH_VERIFY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      valid = response.ok;
    }
    if (!valid) return null;
    const payload = decode(token).payload as { sub?: string; role?: string; exp?: number };
    if (!payload.sub || !payload.role || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return CONTENT_ROLES.includes(payload.role) ? payload : null;
  } catch {
    return null;
  }
}

// MIME types that can be served directly in-browser (no download prompt)
const INLINE_MIME: Record<string, string> = {
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  html: "text/html; charset=utf-8",
  zip: "application/zip",
};

function mimeForFile(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return INLINE_MIME[ext] ?? "application/octet-stream";
}

/** Parse Range header → { start, end } or null */
function parseRange(
  rangeHeader: string,
  fileSize: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return null;

  const start =
    match[1] !== "" ? Number(match[1]) : fileSize - Number(match[2]);
  const end = match[2] !== "" ? Number(match[2]) : fileSize - 1;

  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) return null;
  return { start, end };
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // ---- CORS preflight ----
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Range",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const url = new URL(request.url);

    // ---- GET /api/content/<key> ----
    if (url.pathname.startsWith("/api/content/") && request.method === "GET") {
      if (!(await authorize(request, env))) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const key = decodeURIComponent(
        url.pathname.slice("/api/content/".length),
      );

      if (!key || key.includes("..")) {
        return new Response(JSON.stringify({ error: "Key tidak valid." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ---- Cek cache KV dulu (untuk metadata) ----
      const cacheKey = `meta:${key}`;
      let cachedMeta: { size: number } | null = null;
      if (env.CACHE) {
        try {
          const raw = await env.CACHE.get(cacheKey);
          if (raw) cachedMeta = JSON.parse(raw);
        } catch {
          // cache miss – lanjut
        }
      }

      // ---- Ambil dari R2 ----
      const rangeHeader = request.headers.get("Range");
      let object: R2ObjectBody | R2Object | null;

      if (rangeHeader && cachedMeta) {
        const parsed = parseRange(rangeHeader, cachedMeta.size);
        if (parsed) {
          object = await env.BUCKET.get(key, {
            range: {
              offset: parsed.start,
              length: parsed.end - parsed.start + 1,
            },
          });
        } else {
          return new Response("Requested Range Not Satisfiable", {
            status: 416,
          });
        }
      } else {
        object = await env.BUCKET.get(key);
      }

      if (!object) {
        return new Response(
          JSON.stringify({ error: "Konten tidak ditemukan." }),
          {
            status: 404,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const mime = mimeForFile(key);
      const r2obj = object as R2ObjectBody;
      const body = r2obj.body ?? null;

      // Simpan ukuran file ke KV cache untuk request berikutnya
      if (env.CACHE && r2obj.size != null && !cachedMeta) {
        ctx.waitUntil(
          env.CACHE.put(cacheKey, JSON.stringify({ size: r2obj.size }), {
            expirationTtl: 86400,
          }),
        );
      }

      const fileSize = r2obj.size ?? cachedMeta?.size ?? 0;

      const commonHeaders: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": mime,
        // Cegah download langsung; konten ditampilkan di browser
        "Content-Disposition": "inline",
        // Cegah caching di CDN publik untuk konten berlisensi
        "Cache-Control": "private, no-store",
        // Keamanan tambahan
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
      };

      // Partial content (video scrubbing)
      if (rangeHeader && cachedMeta) {
        const parsed = parseRange(rangeHeader, fileSize)!;
        return new Response(body, {
          status: 206,
          headers: {
            ...commonHeaders,
            "Content-Range": `bytes ${parsed.start}-${parsed.end}/${fileSize}`,
            "Content-Length": String(parsed.end - parsed.start + 1),
          },
        });
      }

      return new Response(body, {
        status: 200,
        headers: {
          ...commonHeaders,
          ...(fileSize ? { "Content-Length": String(fileSize) } : {}),
        },
      });
    }

    // ---- Health check ----
    if (url.pathname === "/api/content" && request.method === "GET") {
      return new Response(JSON.stringify({ status: "ok", version: "1.0.0" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new Response("Not Found", {
      status: 404,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
