import bcrypt from "bcryptjs";
import { decode, sign, verify } from "@tsndr/cloudflare-worker-jwt";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI: any;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type AuthUser = {
  sub: string;
  username: string;
  role: string;
  sekolahId?: string | number | null;
};

const AUTH_TOKEN_TTL_SECONDS = 24 * 60 * 60;

const ROUTES = [
  { path: /^\/$/, methods: ["GET"] },
  { path: /^\/api\/auth\/login$/, methods: ["POST"] },
  { path: /^\/api\/auth\/verify$/, methods: ["POST"] },
  { path: /^\/api\/debug\/testdb$/, methods: ["GET"] },
  { path: /^\/api\/sekolah$/, methods: ["GET", "POST"] },
  { path: /^\/api\/sekolah\/[^/]+$/, methods: ["PUT", "DELETE"] },
  { path: /^\/api\/(?:master\/stats|stats|buku)$/, methods: ["GET"] },
  { path: /^\/api\/books$/, methods: ["GET", "POST"] },
  { path: /^\/api\/books\/[^/]+$/, methods: ["PUT", "DELETE"] },
  { path: /^\/api\/users$/, methods: ["GET", "POST"] },
  { path: /^\/api\/users\/[^/]+$/, methods: ["PUT", "DELETE"] },
  { path: /^\/api\/users\/[^/]+\/(?:password|picture)$/, methods: ["PUT"] },
  { path: /^\/api\/sales$/, methods: ["GET"] },
  { path: /^\/api\/sales\/bulk$/, methods: ["POST"] },
  { path: /^\/api\/error-logs$/, methods: ["GET", "POST"] },
] as const;

function bearerToken(request: Request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : null;
}

async function authenticate(request: Request, env: Env): Promise<AuthUser | null> {
  const token = bearerToken(request);
  if (!token || !env.JWT_SECRET) return null;
  try {
    const valid = await verify(token, env.JWT_SECRET);
    if (!valid) return null;
    const payload = decode(token).payload;
    if (!payload.sub || !payload.role || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload as AuthUser;
  } catch {
    return null;
  }
}

function hasRole(user: AuthUser | null, roles: string[]) {
  return !!user && roles.includes(user.role);
}

function tenantSchoolId(user: AuthUser | null) {
  if (!user) return -1;
  if (user.role === "superadmin" || user.role === "agen") return 0;
  if (["sekolah", "guru", "siswa"].includes(user.role)) {
    const schoolId = Number(user.sekolahId);
    return Number.isInteger(schoolId) && schoolId > 0 ? schoolId : -1;
  }
  return -1;
}

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
    const route = ROUTES.find(({ path }) => path.test(url.pathname));
    if (!route) return json({ success: false, error: "Not Found" }, 404);
    if (!(route.methods as readonly string[]).includes(request.method)) {
      return json({ success: false, error: "Method Not Allowed" }, 405);
    }
    const authUser = await authenticate(request, env);

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      if (!env.JWT_SECRET) return json({ success: false, error: "Konfigurasi autentikasi server belum tersedia" }, 503);
      try {
        const { username, password } = (await request.json()) as { username?: string; password?: string };
        if (!username || !password) return json({ success: false, error: "Username dan password wajib diisi" }, 400);

        const user = await env.DB.prepare(
          "SELECT id, username, nama, role_slug, wilayah, status, initial, sekolah_id, picture, sso_id, password FROM users WHERE username = ? LIMIT 1",
        ).bind(username.trim()).first<any>();

        console.log("Login attempt:", { username: username.trim(), userFound: !!user });

        if (!user) return json({ success: false, error: "Username atau password salah" }, 401);
        if (user.status !== "Aktif") return json({ success: false, error: "Akun belum aktif atau menunggu approval" }, 403);

        const storedPassword = user.password || "";
        const passwordMatches = storedPassword.startsWith("$2")
          ? await bcrypt.compare(password, storedPassword)
          : storedPassword === password;
        if (!passwordMatches) return json({ success: false, error: "Username atau password salah" }, 401);

        const now = Math.floor(Date.now() / 1000);
        const token = await sign({
          sub: user.id,
          username: user.username,
          role: user.role_slug,
          sekolahId: user.sekolah_id,
          iat: now,
          exp: now + AUTH_TOKEN_TTL_SECONDS,
        }, env.JWT_SECRET);

        const { password: _password, ...safeUser } = user;
        return json({ success: true, token, user: { ...safeUser, role: user.role_slug } });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    const isPublicRead = request.method === "GET" && [
      "/api/sekolah", "/api/master/stats", "/api/stats", "/api/buku", "/api/books", "/api/debug/testdb"
    ].includes(url.pathname);
    const isPublicRegistration = url.pathname === "/api/users" && request.method === "POST" && !authUser;

    if (!isPublicRead && !isPublicRegistration && !authUser) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    if (url.pathname === "/api/auth/verify" && request.method === "POST") {
      return json({ success: true });
    }

    if (url.pathname === "/api/debug/testdb" && request.method === "GET") {
      try {
        const user = await env.DB.prepare("SELECT * FROM users WHERE username = 'superadmin'").first<any>();
        return json({ success: true, user });
      } catch (e: any) {
        return json({ success: false, error: e.message });
      }
    }

    const isSchoolMutation = url.pathname.startsWith("/api/sekolah") && request.method !== "GET";
    const isBookMutation = url.pathname.startsWith("/api/books") && request.method !== "GET";
    const isSalesRoute = url.pathname.startsWith("/api/sales");
    if (isSchoolMutation && !hasRole(authUser, ["superadmin", "agen"])) return json({ success: false, error: "Forbidden" }, 403);
    if (isBookMutation && !hasRole(authUser, ["superadmin", "uploader"])) return json({ success: false, error: "Forbidden" }, 403);
    if (isSalesRoute && !hasRole(authUser, ["superadmin", "agen"])) return json({ success: false, error: "Forbidden" }, 403);
    if (url.pathname === "/api/users" && request.method === "POST" && authUser && !hasRole(authUser, ["superadmin", "sekolah"])) {
      return json({ success: false, error: "Forbidden" }, 403);
    }
    if (url.pathname === "/api/users" && request.method === "GET" && !hasRole(authUser, ["superadmin", "sekolah", "guru", "siswa"])) {
      return json({ success: false, error: "Forbidden" }, 403);
    }
    const userRouteMatch = url.pathname.match(/^\/api\/users\/([^/]+)(?:\/(password|picture))?$/);
    if (userRouteMatch && request.method !== "GET") {
      const targetId = userRouteMatch[1];
      const action = userRouteMatch[2];
      const isSuperadmin = hasRole(authUser, ["superadmin"]);
      const isSelf = authUser?.sub === targetId;
      let isSameSchool = false;
      if (authUser?.role === "sekolah" && authUser.sekolahId) {
        const target = await env.DB.prepare("SELECT sekolah_id FROM users WHERE id = ? LIMIT 1").bind(targetId).first<any>();
        isSameSchool = String(target?.sekolah_id || "") === String(authUser.sekolahId);
      }

      if (request.method === "DELETE" && !isSuperadmin && !isSameSchool) {
        return json({ success: false, error: "Forbidden" }, 403);
      }
      if ((action === "password" || action === "picture") && !isSuperadmin && !isSelf && !isSameSchool) {
        return json({ success: false, error: "Forbidden" }, 403);
      }
      if (!action && request.method === "PUT" && !isSuperadmin && !isSameSchool && !isSelf) {
        return json({ success: false, error: "Forbidden" }, 403);
      }
      if (!action && request.method === "PUT" && isSelf && !isSuperadmin && !isSameSchool) {
        const existing = await env.DB.prepare("SELECT role_slug, sekolah_id FROM users WHERE id = ? LIMIT 1").bind(targetId).first<any>();
        const proposed = await request.clone().json<any>();
        if (proposed.role !== existing?.role_slug || String(proposed.sekolah_id || "") !== String(existing?.sekolah_id || "")) {
          return json({ success: false, error: "Role dan sekolah tidak dapat diubah sendiri" }, 403);
        }
      }
      if (!action && request.method === "PUT" && isSameSchool) {
        const proposed = await request.clone().json<any>();
        if (["superadmin", "agen", "uploader"].includes(proposed.role)) {
          return json({ success: false, error: "Role tidak diizinkan" }, 403);
        }
      }
    }

    if (url.pathname === "/api/sekolah" && request.method === "GET") {
      try {
        const search = url.searchParams.get("search");
        let query =
          "SELECT id, nama, alamat_jalan, nomor_telepon, kabupaten, npsn, provinsi, bentuk_pendidikan FROM master_data_sekolah ";
        let results;

        if (search) {
          const searchWords = search.trim().split(/\\s+/).filter(Boolean);
          if (searchWords.length > 0) {
            const nameConditions = searchWords.map(() => "nama LIKE ?").join(" AND ");
            query += `WHERE (${nameConditions}) OR npsn LIKE ? ORDER BY nama LIMIT 20`;
            
            const binds = searchWords.map(word => `%${word}%`);
            binds.push(`%${search}%`);
            
            const stmt = await env.DB.prepare(query).bind(...binds);
            const res = await stmt.all();
            results = res.results;
          } else {
            query += "ORDER BY nama LIMIT 100";
            const res = await env.DB.prepare(query).all();
            results = res.results;
          }
        } else {
          query += "ORDER BY nama LIMIT 100";
          const res = await env.DB.prepare(query).all();
          results = res.results;
        }

        // Map database columns to app interface expected fields
        const mappedResults = results.map((row: any) => ({
          id: row.id,
          nama: row.nama,
          alamat: row.alamat_jalan,
          telepon: row.nomor_telepon,
          kota: row.kabupaten,
          agen: "",
          npsn: row.npsn,
          provinsi: row.provinsi,
          bentuk_pendidikan: row.bentuk_pendidikan,
        }));
        return json({ success: true, data: mappedResults });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/sekolah" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const { nama, alamat, telepon, kota, npsn } = body;
        const { meta } = await env.DB.prepare(
          "INSERT INTO master_data_sekolah (nama, alamat_jalan, nomor_telepon, kabupaten, npsn) VALUES (?, ?, ?, ?, ?)",
        )
          .bind(nama, alamat, telepon, kota, npsn)
          .run();
        return json({
          success: true,
          message: "Sekolah berhasil ditambahkan",
          id: meta.last_row_id,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/sekolah/") && request.method === "PUT") {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const { nama, alamat, telepon, kota, npsn } = body;
        await env.DB.prepare(
          "UPDATE master_data_sekolah SET nama = ?, alamat_jalan = ?, nomor_telepon = ?, kabupaten = ?, npsn = ? WHERE id = ?",
        )
          .bind(nama, alamat, telepon, kota, npsn, id)
          .run();
        return json({ success: true, message: "Sekolah berhasil diupdate" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (
      url.pathname.startsWith("/api/sekolah/") &&
      request.method === "DELETE"
    ) {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM master_data_sekolah WHERE id = ?")
          .bind(id)
          .run();
        return json({ success: true, message: "Sekolah berhasil dihapus" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/master/stats" && request.method === "GET") {
      try {
        const muhammadiyahRes = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM master_data_sekolah WHERE nama LIKE '%muhammadiyah%'",
        ).first();
        const guruRes = await env.DB.prepare(
          "SELECT SUM(ptk_total) as total FROM master_data_sekolah",
        ).first();
        const siswaRes = await env.DB.prepare(
          "SELECT SUM(pd_total) as total FROM master_data_sekolah",
        ).first();

        const aktifRes = await env.DB.prepare(
          "SELECT COUNT(DISTINCT m.id) as total FROM master_data_sekolah m INNER JOIN users u ON m.id = u.sekolah_id WHERE u.role_slug = 'sekolah' AND u.status = 'Aktif'",
        ).first();
        const totalSekolahRes = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM master_data_sekolah",
        ).first();

        const guruAktifRes = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM users WHERE role_slug = 'guru' AND status = 'Aktif'",
        ).first();
        const siswaAktifRes = await env.DB.prepare(
          "SELECT COUNT(*) as total FROM users WHERE role_slug = 'siswa' AND status = 'Aktif'",
        ).first();

        return json({
          success: true,
          data: {
            sekolahMuhammadiyah: (muhammadiyahRes as any)?.total || 0,
            totalGuru: (guruRes as any)?.total || 0,
            totalSiswa: (siswaRes as any)?.total || 0,
            sekolahAktif: (aktifRes as any)?.total || 0,
            totalSekolah: (totalSekolahRes as any)?.total || 0,
            guruAktif: (guruAktifRes as any)?.total || 0,
            siswaAktif: (siswaAktifRes as any)?.total || 0,
          },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/users" && request.method === "GET") {
      try {
        const schoolId = tenantSchoolId(authUser);
        if (schoolId === -1) return json({ success: false, error: "Tenant sekolah pada token tidak valid" }, 403);
        const baseQuery =
          "SELECT id, username, nama, role_slug, wilayah, status, kelas, nis, npsn, nuptk, nip, email, sekolah_id, picture, sso_id, requested_role, surat_tugas, masa_aktif, new_user_source, initial, color, terakhir_login, created_at, updated_at FROM users";
        const query = schoolId
          ? `${baseQuery} WHERE sekolah_id = ? ORDER BY created_at DESC`
          : `${baseQuery} ORDER BY created_at DESC`;
        const statement = schoolId
          ? env.DB.prepare(query).bind(schoolId)
          : env.DB.prepare(query);
        const { results } = await statement.all();
        const mappedResults = results.map((row: any) => ({
          ...row,
          role: row.role_slug,
        }));
        return json({ success: true, data: mappedResults });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/users" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const id = crypto.randomUUID();
        const {
          username,
          nama,
          role,
          wilayah,
          status,
          kelas,
          nis,
          npsn,
          nuptk,
          nip,
          email,
          password,
          sekolah_id,
          suratTugas,
          masaAktif,
        } = body;

        const schoolId = tenantSchoolId(authUser);
        if (schoolId === -1) return json({ success: false, error: "Tenant sekolah pada token tidak valid" }, 403);
        const safeRole = authUser ? role : "pending";
        const safeStatus = authUser ? (status || "Aktif") : "Menunggu";
        const safeSchoolId = schoolId || sekolah_id || null;
        const passwordHash = password ? await bcrypt.hash(password, 10) : null;

        const result = await env.DB.prepare(
          "INSERT INTO users (id, username, nama, role_slug, wilayah, status, kelas, nis, npsn, nuptk, nip, email, surat_tugas, masa_aktif, password, sekolah_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(
            id,
            username,
            nama,
            safeRole,
            wilayah || "",
            safeStatus,
            kelas || null,
            nis || null,
            npsn || null,
            nuptk || null,
            nip || null,
            email || null,
            suratTugas || null,
            masaAktif || null,
            passwordHash,
            safeSchoolId,
          )
          .run();
        if (!result.success) throw new Error("Insert failed silently");

        return json({
          success: true,
          message: "User berhasil ditambahkan",
          id,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (
      url.pathname.match(/^\/api\/users\/[^\/]+$/) &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const {
          username,
          nama,
          role,
          wilayah,
          status,
          kelas,
          nis,
          npsn,
          nuptk,
          nip,
          email,
          password,
          sekolah_id,
          suratTugas,
          masaAktif,
        } = body;
        const schoolId = tenantSchoolId(authUser);
        if (schoolId === -1) return json({ success: false, error: "Tenant sekolah pada token tidak valid" }, 403);
        const safeSchoolId = schoolId || sekolah_id || null;

        const commonValues = [
          username || null, nama || null, role || null, wilayah || null, status || null, kelas || null,
          nis || null, npsn || null, nuptk || null, nip || null, email || null,
          suratTugas || null, masaAktif || null,
        ];
        if (password) {
          const passwordHash = await bcrypt.hash(password, 10);
          await env.DB.prepare(
            "UPDATE users SET username = COALESCE(?, username), nama = COALESCE(?, nama), role_slug = COALESCE(?, role_slug), wilayah = COALESCE(?, wilayah), status = COALESCE(?, status), kelas = COALESCE(?, kelas), nis = COALESCE(?, nis), npsn = COALESCE(?, npsn), nuptk = COALESCE(?, nuptk), nip = COALESCE(?, nip), email = COALESCE(?, email), surat_tugas = COALESCE(?, surat_tugas), masa_aktif = COALESCE(?, masa_aktif), password = ?, sekolah_id = COALESCE(?, sekolah_id) WHERE id = ?",
          ).bind(...commonValues, passwordHash, safeSchoolId, id).run();
        } else {
          await env.DB.prepare(
            "UPDATE users SET username = COALESCE(?, username), nama = COALESCE(?, nama), role_slug = COALESCE(?, role_slug), wilayah = COALESCE(?, wilayah), status = COALESCE(?, status), kelas = COALESCE(?, kelas), nis = COALESCE(?, nis), npsn = COALESCE(?, npsn), nuptk = COALESCE(?, nuptk), nip = COALESCE(?, nip), email = COALESCE(?, email), surat_tugas = COALESCE(?, surat_tugas), masa_aktif = COALESCE(?, masa_aktif), sekolah_id = COALESCE(?, sekolah_id) WHERE id = ?",
          ).bind(...commonValues, safeSchoolId, id).run();
        }

        return json({ success: true, message: "User berhasil diupdate" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (
      url.pathname.match(/^\/api\/users\/[^\/]+\/password$/) &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/")[3];
        const body = (await request.json()) as any;
        const { newPassword } = body;

        if (!newPassword || typeof newPassword !== "string") {
          return json({ success: false, error: "Password baru wajib diisi" }, 400);
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await env.DB.prepare("UPDATE users SET password = ? WHERE id = ?")
          .bind(passwordHash, id)
          .run();

        return json({ success: true, message: "Password berhasil diubah" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (
      url.pathname.match(/^\/api\/users\/[^\/]+\/picture$/) &&
      request.method === "PUT"
    ) {
      try {
        const id = url.pathname.split("/")[3];
        const body = (await request.json()) as any;
        const { picture } = body;

        await env.DB.prepare(
          "UPDATE users SET picture = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        )
          .bind(picture, id)
          .run();

        return json({
          success: true,
          message: "Foto profil berhasil diperbarui",
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
        return json({ success: true, message: "User berhasil dihapus" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/stats" && request.method === "GET") {
      try {
        const totalSekolah = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM master_data_sekolah",
        ).first("count");
        const sekolahMuhammadiyah = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM master_data_sekolah WHERE nama LIKE '%Muhammadiyah%'",
        ).first("count");
        const sekolahAktif = await env.DB.prepare(
          "SELECT COUNT(DISTINCT sekolah_id) as count FROM users WHERE role_slug = 'sekolah' AND status = 'Aktif'",
        ).first("count");

        const totalGuru = await env.DB.prepare(
          "SELECT SUM(ptk_total) as count FROM master_data_sekolah",
        ).first("count");
        const guruAktif = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role_slug = 'guru' AND status = 'Aktif'",
        ).first("count");

        const totalSiswa = await env.DB.prepare(
          "SELECT SUM(pd_total) as count FROM master_data_sekolah",
        ).first("count");
        const siswaAktif = await env.DB.prepare(
          "SELECT COUNT(*) as count FROM users WHERE role_slug = 'siswa' AND status = 'Aktif'",
        ).first("count");

        return json({
          success: true,
          data: {
            totalSekolah: totalSekolah || 0,
            sekolahMuhammadiyah: sekolahMuhammadiyah || 0,
            sekolahAktif: sekolahAktif || 0,
            totalGuru: totalGuru || 0,
            guruAktif: guruAktif || 0,
            totalSiswa: totalSiswa || 0,
            siswaAktif: siswaAktif || 0,
          },
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/buku" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT isbn, judul, penulis, penerbit FROM Buku ORDER BY judul",
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/books" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, isbn, isbn_asli, jilid, judul, judul_inggris, peruntukan, kelas, terbit, mapel, cover_url FROM books ORDER BY created_at DESC",
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/books" && request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        const id = crypto.randomUUID();
        const { isbn, judul, peruntukan, kelas, terbit, mapel, cover_url } =
          body;

        await env.DB.prepare(
          "INSERT INTO books (id, isbn, judul, peruntukan, kelas, terbit, mapel, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
          .bind(id, isbn, judul, peruntukan, kelas, terbit, mapel, cover_url)
          .run();

        return json({
          success: true,
          message: "Buku berhasil ditambahkan",
          id,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/books/") && request.method === "PUT") {
      try {
        const id = url.pathname.split("/").pop();
        const body = (await request.json()) as any;
        const { isbn, judul, peruntukan, kelas, terbit, mapel, cover_url } =
          body;

        await env.DB.prepare(
          "UPDATE books SET isbn = ?, judul = ?, peruntukan = ?, kelas = ?, terbit = ?, mapel = ?, cover_url = ? WHERE id = ?",
        )
          .bind(isbn, judul, peruntukan, kelas, terbit, mapel, cover_url, id)
          .run();

        return json({ success: true, message: "Buku berhasil diupdate" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname.startsWith("/api/books/") && request.method === "DELETE") {
      try {
        const id = url.pathname.split("/").pop();
        await env.DB.prepare("DELETE FROM books WHERE id = ?").bind(id).run();
        return json({ success: true, message: "Buku berhasil dihapus" });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
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
           ORDER BY p.tanggal_transaksi DESC`,
        ).all();
        return json({ success: true, data: results });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
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
          return json(
            { success: false, error: "Data penjualan tidak boleh kosong" },
            400,
          );
        }

        for (const row of body) {
          if (!row.sekolahId || !row.isbn || !row.jumlah || row.jumlah < 1) {
            return json(
              {
                success: false,
                error:
                  "Setiap baris harus memiliki sekolah, ISBN, dan jumlah valid",
              },
              400,
            );
          }
        }

        const stmt = env.DB.prepare(
          "INSERT INTO Penjualan (sekolah_id, isbn, jumlah_lisensi) VALUES (?, ?, ?)",
        );
        const stmts = body.map((row) =>
          stmt.bind(row.sekolahId, row.isbn, row.jumlah),
        );
        await env.DB.batch(stmts);

        return json({
          success: true,
          message: `Berhasil menginput ${body.length} data penjualan`,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return json({ success: false, error: message }, 500);
      }
    }

    if (url.pathname === "/api/error-logs") {
      if (request.method === "GET") {
        if (!hasRole(authUser, ["superadmin"])) return json({ success: false, error: "Forbidden" }, 403);
        try {
          const { results } = await env.DB.prepare("SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 50").all();
          return json({ success: true, data: results });
        } catch (error: any) {
          // If table doesn't exist, we can handle it gracefully
          if (error.message.includes("no such table")) {
             await env.DB.prepare("CREATE TABLE IF NOT EXISTS error_logs (id TEXT PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, service TEXT, endpoint TEXT, error_message TEXT, stack_trace TEXT, ai_analysis TEXT, status TEXT DEFAULT 'new')").run();
             return json({ success: true, data: [] });
          }
          return json({ success: false, error: error.message }, 500);
        }
      }

      if (request.method === "POST") {
        try {
          const body: any = await request.json();
          const id = crypto.randomUUID();
          const { service = "frontend", endpoint = "", error_message = "", stack_trace = "" } = body;
          
          // Background AI Analysis
          const analyzeAndSave = async () => {
            let analysis = "AI tidak tersedia atau gagal menganalisis.";
            try {
              if (env.AI) {
                const systemPrompt = "Kamu adalah AI Debugger. Analisis error dan stack trace berikut, jelaskan penyebabnya secara singkat dalam bahasa Indonesia, dan berikan saran perbaikan.";
                const aiResponse = await env.AI.run("@cf/qwen/qwen1.5-14b-chat-awq", {
                  messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Error: ${error_message}\nStack Trace: ${stack_trace}\nEndpoint: ${endpoint}` }
                  ]
                });
                analysis = (aiResponse as any).response || analysis;
              }
            } catch (aiErr) {
              console.error("AI Error:", aiErr);
            }
            
            // Simpan ke DB
            try {
              // Ensure table exists just in case
              await env.DB.prepare("CREATE TABLE IF NOT EXISTS error_logs (id TEXT PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, service TEXT, endpoint TEXT, error_message TEXT, stack_trace TEXT, ai_analysis TEXT, status TEXT DEFAULT 'new')").run();
              
              await env.DB.prepare(
                "INSERT INTO error_logs (id, service, endpoint, error_message, stack_trace, ai_analysis) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(id, service, endpoint, error_message, stack_trace, analysis).run();
            } catch (dbErr) {
              console.error("DB Error:", dbErr);
            }
          };

          // Handle background non-blocking execution (requires passing ctx to handler but since we don't have ctx here, we can just await it or use CF's context.waitUntil if available).
          // For simplicity in this demo index.ts, we'll await it. In a real production system, we'd use waitUntil.
          await analyzeAndSave();

          return json({ success: true, message: "Error logged and analyzed" });
        } catch (error: any) {
          return json({ success: false, error: error.message }, 500);
        }
      }
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json({ success: true, service: "sales-api" });
    }
    return json({ success: false, error: "Not Found" }, 404);
  },
};
