export interface Env {
  DB: D1Database;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/sekolah" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, nama, alamat_jalan, nomor_telepon, kabupaten, npsn FROM master_data_sekolah ORDER BY nama"
        ).all();
        // Map database columns to app interface expected fields
        const mappedResults = results.map((row: any) => ({
          id: row.id,
          nama: row.nama,
          alamat: row.alamat_jalan,
          telepon: row.nomor_telepon,
          kota: row.kabupaten,
          agen: '',
          npsn: row.npsn
        }));
        return json({ success: true, data: mappedResults });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/sekolah" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const { nama, alamat, telepon, kota, npsn } = body;
        const { meta } = await env.DB.prepare(
          "INSERT INTO master_data_sekolah (nama, alamat_jalan, nomor_telepon, kabupaten, npsn) VALUES (?, ?, ?, ?, ?)"
        ).bind(nama, alamat, telepon, kota, npsn).run();
        return json({ success: true, message: "Sekolah berhasil ditambahkan", id: meta.last_row_id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/sekolah/") && request.method === "PUT") {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const { nama, alamat, telepon, kota, npsn } = body;
        await env.DB.prepare(
          "UPDATE master_data_sekolah SET nama = ?, alamat_jalan = ?, nomor_telepon = ?, kabupaten = ?, npsn = ? WHERE id = ?"
        ).bind(nama, alamat, telepon, kota, npsn, id).run();
        return json({ success: true, message: "Sekolah berhasil diupdate" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/sekolah/") && request.method === "DELETE") {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM master_data_sekolah WHERE id = ?").bind(id).run();
        return json({ success: true, message: "Sekolah berhasil dihapus" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/users" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
        const mappedResults = results.map((row: any) => ({
          ...row,
          role: row.role_slug
        }));
        return json({ success: true, data: mappedResults });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/users" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        console.log("USERS POST BODY:", JSON.stringify(body));
        const id = crypto.randomUUID();
        const { username, nama, role, wilayah, status, kelas, nis, email, password, sekolah_id } = body;
        
        const result = await env.DB.prepare(
          "INSERT INTO users (id, username, nama, role_slug, wilayah, status, kelas, nis, email, password, sekolah_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, username, nama, role, wilayah || '', status || 'Aktif', kelas || null, nis || null, email || null, password || null, sekolah_id || null).run();
        console.log("INSERT RESULT:", JSON.stringify(result));
        if (!result.success) throw new Error("Insert failed silently");
        
        return json({ success: true, message: "User berhasil ditambahkan", id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.match(/^\/api\/users\/[^\/]+$/) && request.method === "PUT") {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const { username, nama, role, wilayah, status, kelas, nis, email, password, sekolah_id } = body;
        
        await env.DB.prepare(
          "UPDATE users SET username = ?, nama = ?, role_slug = ?, wilayah = ?, status = ?, kelas = ?, nis = ?, email = ?, password = ?, sekolah_id = ? WHERE id = ?"
        ).bind(username, nama, role, wilayah || '', status || 'Aktif', kelas || null, nis || null, email || null, password || null, sekolah_id || null, id).run();
        
        return json({ success: true, message: "User berhasil diupdate" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.match(/^\/api\/users\/[^\/]+\/password$/) && request.method === "PUT") {
      try {
        const id = url.pathname.split("/")[3];
        const body = (await request.json()) as any;
        const { newPassword } = body;
        
        await env.DB.prepare(
          "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(newPassword, id).run();
        
        return json({ success: true, message: "Password berhasil diubah" });

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.match(/^\/api\/users\/[^\/]+\/picture$/) && request.method === "PUT") {
      try {
        const id = url.pathname.split("/")[3];
        const body = (await request.json()) as any;
        const { picture } = body;
        
        await env.DB.prepare(
          "UPDATE users SET picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
        ).bind(picture, id).run();
        
        return json({ success: true, message: "Foto profil berhasil diperbarui" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return json({ success: true, message: "User berhasil dihapus" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/buku" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT isbn, judul, penulis, penerbit FROM Buku ORDER BY judul"
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/books" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, isbn, isbn_asli, jilid, judul, judul_inggris, peruntukan, kelas, terbit, mapel, cover_url FROM books ORDER BY created_at DESC"
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/books" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const id = crypto.randomUUID();
        const { isbn, judul, peruntukan, kelas, terbit, mapel, cover_url } = body;
        
        await env.DB.prepare(
          "INSERT INTO books (id, isbn, judul, peruntukan, kelas, terbit, mapel, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, isbn, judul, peruntukan, kelas, terbit, mapel, cover_url).run();
        
        return json({ success: true, message: "Buku berhasil ditambahkan", id });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/books/") && request.method === "PUT") {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const { isbn, judul, peruntukan, kelas, terbit, mapel, cover_url } = body;
        
        await env.DB.prepare(
          "UPDATE books SET isbn = ?, judul = ?, peruntukan = ?, kelas = ?, terbit = ?, mapel = ?, cover_url = ? WHERE id = ?"
        ).bind(isbn, judul, peruntukan, kelas, terbit, mapel, cover_url, id).run();
        
        return json({ success: true, message: "Buku berhasil diupdate" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/books/") && request.method === "DELETE") {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM books WHERE id = ?").bind(id).run();
        return json({ success: true, message: "Buku berhasil dihapus" });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/sales" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          `SELECT p.id, p.sekolah_id, s.nama_sekolah, p.isbn, b.judul,
                  p.jumlah_lisensi, p.tanggal_transaksi
           FROM Penjualan p
           JOIN Sekolah s ON p.sekolah_id = s.id
           JOIN Buku b ON p.isbn = b.isbn
           ORDER BY p.tanggal_transaksi DESC`
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/sales/bulk" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          sekolahId: number;
          isbn: string;
          jumlah: number;
        }[];

        if (!Array.isArray(body) || body.length === 0) {
          return json({ success: false, error: "Data penjualan tidak boleh kosong" }, 400);
        }

        for (const row of body) {
          if (!row.sekolahId || !row.isbn || !row.jumlah || row.jumlah < 1) {
            return json({ success: false, error: "Setiap baris harus memiliki sekolah, ISBN, dan jumlah valid" }, 400);
          }
        }

        const stmt = env.DB.prepare(
          "INSERT INTO Penjualan (sekolah_id, isbn, jumlah_lisensi) VALUES (?, ?, ?)"
        );
        const stmts = body.map((row) => stmt.bind(row.sekolahId, row.isbn, row.jumlah));
        await env.DB.batch(stmts);

        return json({
          success: true,
          message: `Berhasil menginput ${body.length} data penjualan`,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    return new Response("Sales API is running", { headers: corsHeaders });
  },
};
