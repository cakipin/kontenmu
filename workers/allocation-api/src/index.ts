export interface Env {
  DB: D1Database;
  CACHE?: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function getLicenseQuota(env: Env, sekolahId: number, isbn: string) {
  const total = await env.DB.prepare(
    "SELECT COALESCE(SUM(jumlah_lisensi), 0) as total FROM Penjualan WHERE sekolah_id = ? AND isbn = ?"
  )
    .bind(sekolahId, isbn)
    .first<{ total: number }>();

  const allocated = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM Alokasi_Siswa WHERE sekolah_id = ? AND isbn = ?"
  )
    .bind(sekolahId, isbn)
    .first<{ count: number }>();

  return {
    total: total?.total ?? 0,
    allocated: allocated?.count ?? 0,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/inventory" && request.method === "GET") {
      try {
        const sekolahId = url.searchParams.get("sekolahId") || "1";
        const { results } = await env.DB.prepare(
          `SELECT b.isbn, b.judul,
                  COALESCE(SUM(p.jumlah_lisensi), 0) as total_lisensi,
                  (SELECT COUNT(*) FROM Alokasi_Siswa a
                   WHERE a.sekolah_id = ? AND a.isbn = b.isbn) as teralokasi
           FROM Penjualan p
           JOIN Buku b ON p.isbn = b.isbn
           WHERE p.sekolah_id = ?
           GROUP BY b.isbn, b.judul`
        )
          .bind(sekolahId, sekolahId)
          .all();

        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/allocations" && request.method === "GET") {
      try {
        const sekolahId = url.searchParams.get("sekolahId") || "1";
        const { results } = await env.DB.prepare(
          `SELECT a.id, a.siswa_id, a.isbn, b.judul, a.tanggal_alokasi
           FROM Alokasi_Siswa a
           JOIN Buku b ON a.isbn = b.isbn
           WHERE a.sekolah_id = ?
           ORDER BY a.tanggal_alokasi DESC`
        )
          .bind(sekolahId)
          .all();

        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/allocate" && request.method === "POST") {
      try {
        const { sekolahId, isbn, siswaId } = (await request.json()) as {
          sekolahId: number;
          isbn: string;
          siswaId: string;
        };

        if (!sekolahId || !isbn || !siswaId?.trim()) {
          return json({ success: false, error: "sekolahId, isbn, dan siswaId wajib diisi" }, 400);
        }

        const existing = await env.DB.prepare(
          "SELECT id FROM Alokasi_Siswa WHERE siswa_id = ? AND isbn = ?"
        )
          .bind(siswaId.trim(), isbn)
          .first();

        if (existing) {
          return json({ success: false, error: `Siswa ${siswaId} sudah memiliki lisensi untuk ISBN ini` }, 409);
        }

        const { total, allocated } = await getLicenseQuota(env, sekolahId, isbn);

        if (total === 0) {
          return json({ success: false, error: "Sekolah tidak memiliki lisensi untuk ISBN ini" }, 400);
        }

        if (allocated >= total) {
          return json({
            success: false,
            error: `Kuota habis: ${allocated}/${total} lisensi sudah teralokasi`,
          }, 400);
        }

        await env.DB.prepare(
          "INSERT INTO Alokasi_Siswa (siswa_id, sekolah_id, isbn) VALUES (?, ?, ?)"
        )
          .bind(siswaId.trim(), sekolahId, isbn)
          .run();

        if (env.CACHE) {
          await env.CACHE.put(`access:${siswaId.trim()}:${isbn}`, "true");
        }

        return json({
          success: true,
          message: `Berhasil mengalokasikan ISBN ${isbn} ke siswa ${siswaId}`,
          remaining: total - allocated - 1,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    return new Response("Allocation API is running", { headers: corsHeaders });
  },
};
