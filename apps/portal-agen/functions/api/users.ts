const jsonHeaders = { "Content-Type": "application/json" };

import { drizzle } from "drizzle-orm/d1";
import { desc, sql } from "drizzle-orm";
import { users } from "../../src/db/schema";

export const onRequestGet = async (context: any) => {
  try {
    const ormDb = drizzle(context.env.DB);
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
    const offset = (page - 1) * limit;

    const [totalResult, result] = await Promise.all([
      ormDb.select({ value: sql`count(*)` }).from(users),
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
      newUserSource:
        user.newUserSource !== undefined ? user.newUserSource : "sso",
      sekolahId: user.sekolahId ?? null,
      requestedRole: user.requestedRole ?? null,
      suratTugas: user.suratTugas ?? null,
      masaAktif: user.masaAktif ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
      password: "", // Dummy since it was omitted in raw SQL
    };
    await ormDb
      .insert(users)
      .values(insertData)
      .onConflictDoUpdate({
        target: users.username,
        set: {
          id: insertData.id,
          nama: insertData.nama,
          roleSlug: insertData.roleSlug,
          wilayah: insertData.wilayah,
          status: insertData.status,
          initial: insertData.initial,
          color: insertData.color,
          terakhirLogin: insertData.terakhirLogin,
          kelas: insertData.kelas,
          nis: insertData.nis,
          newUserSource: insertData.newUserSource,
          sekolahId: insertData.sekolahId,
          requestedRole: insertData.requestedRole,
          suratTugas: insertData.suratTugas,
          masaAktif: insertData.masaAktif,
          updatedAt: insertData.updatedAt,
        },
      });

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
