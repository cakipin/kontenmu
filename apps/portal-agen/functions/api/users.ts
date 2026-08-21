const jsonHeaders = { "Content-Type": "application/json" };

import { drizzle } from "drizzle-orm/d1";
import { desc, eq, or, sql } from "drizzle-orm";
import { users } from "../../src/db/schema";
import bcrypt from "bcryptjs";
import { getTenantSchoolId, resolveTenantSchoolId, tenantError } from "./_tenant";

export const onRequestGet = async (context: any) => {
  try {
    const ormDb = drizzle(context.env.DB);
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
    const offset = (page - 1) * limit;
    const tenantSchoolId = await resolveTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();
    const auth = context.data?.auth || {};
    const tenantWhere = auth.role === "pending"
      ? or(
          eq(users.id, String(auth.sub || "")),
          eq(users.username, String(auth.username || "")),
        )
      : tenantSchoolId
        ? eq(users.sekolahId, tenantSchoolId)
        : undefined;

    const [totalResult, result] = await Promise.all([
      ormDb.select({ value: sql`count(*)` }).from(users).where(tenantWhere),
      ormDb.select({
        id: users.id,
        username: users.username,
        nama: users.nama,
        role: users.roleSlug,
        wilayah: users.wilayah,
        status: users.status,
        initial: users.initial,
        color: users.color,
        terakhirLogin: users.terakhirLogin,
        kelas: users.kelas,
        nis: users.nis,
        newUserSource: users.newUserSource,
        ssoId: users.ssoId,
        email: users.email,
        requestedRole: users.requestedRole,
        suratTugas: users.suratTugas,
        masaAktif: users.masaAktif,
        sekolahId: users.sekolahId,
      })
      .from(users)
      .where(tenantWhere)
      .orderBy(desc(users.updatedAt), desc(users.createdAt))
      .limit(limit)
      .offset(offset)
    ]);

    return new Response(JSON.stringify({ 
      success: true,
      data: result,
      total: Number(totalResult[0].value),
      page,
      limit
    }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const user = await context.request.json();
    if (!user?.id || !user?.username) {
      return new Response(
        JSON.stringify({ error: "id dan username wajib diisi" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    const ormDb = drizzle(context.env.DB);
    const existingUsername = await ormDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, String(user.username)))
      .get();
    if (existingUsername) {
      return new Response(JSON.stringify({ error: "Username sudah digunakan" }), {
        status: 409,
        headers: jsonHeaders,
      });
    }
    
    // Untuk registrasi publik, context.data.auth akan kosong.
    // Jika tidak ada auth atau auth bukan admin, paksa role menjadi "pending"
    const auth = context.data?.auth || {};
    const isAdmin = auth.role === "superadmin" || auth.role === "sekolah";
    if (!isAdmin) {
      user.role = "pending";
    }

    // Hanya tolak tenantError jika user authenticated tapi tenant tidak valid.
    // Untuk public request (unauthenticated), tenantSchoolId akan null, yang valid.
    let tenantSchoolId = null;
    if (Object.keys(auth).length > 0) {
      tenantSchoolId = await resolveTenantSchoolId(context);
      if (tenantSchoolId === 0) {
        // Auto-heal: Jika token tidak memiliki sekolah_id, coba cari dari database berdasarkan username atau wilayah
        try {
          const rawDb = context.env.DB;
          const userDb = await rawDb.prepare("SELECT sekolah_id, wilayah FROM users WHERE username = ? LIMIT 1").bind(auth.username).first<{ sekolah_id: number, wilayah: string }>();
          if (userDb?.sekolah_id) {
            tenantSchoolId = userDb.sekolah_id;
          } else if (userDb?.wilayah) {
            const schoolDb = await rawDb.prepare("SELECT id FROM schools WHERE nama = ? LIMIT 1").bind(userDb.wilayah).first<{ id: number }>();
            if (schoolDb?.id) tenantSchoolId = schoolDb.id;
          }
        } catch (e) {
          // Ignore DB error and let it fail below
        }
        if (!tenantSchoolId || tenantSchoolId === 0) return tenantError();
      }
    }
    
    const passwordHash = user.password ? await bcrypt.hash(user.password, 10) : "";
    const insertData = {
      id: user.id,
      username: user.username,
      nama: user.nama || user.username,
      roleSlug: user.role || "pending",
      wilayah: user.wilayah || "SSO Login",
      status: user.status || "Aktif",
      initial: user.initial || "",
      color: user.color || "#64748b",
      terakhirLogin: user.terakhirLogin || "",
      kelas: user.kelas ?? null,
      nis: user.nis ?? null,
      email: user.email ?? null,
      newUserSource:
        user.newUserSource !== undefined ? user.newUserSource : "manual",
      sekolahId: tenantSchoolId || user.sekolahId || user.sekolah_id || null,
      requestedRole: user.requestedRole ?? null,
      suratTugas: user.suratTugas ?? null,
      masaAktif: user.masaAktif ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
      password: passwordHash,
    };
    await ormDb.insert(users).values(insertData);

    if (insertData.sekolahId) {
      const notifId = crypto.randomUUID();
      const message = `Pendaftaran manual baru: ${insertData.nama} (${insertData.roleSlug})`;
      await context.env.DB.prepare(
        `INSERT INTO notifications (id, sekolah_id, message) VALUES (?, ?, ?)`
      )
        .bind(notifId, insertData.sekolahId, message)
        .run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    console.error("[POST /api/users] Error:", error);
    return new Response(JSON.stringify({ error: "Gagal membuat akun" }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
