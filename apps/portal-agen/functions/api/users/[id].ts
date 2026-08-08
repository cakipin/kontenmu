import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { users } from "../../../src/db/schema";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPut = async (context: any) => {
  try {
    const id = context.params.id;
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: jsonHeaders });
    
    const user = await context.request.json();
    const ormDb = drizzle(context.env.DB);
    
    await ormDb.update(users).set({
      nama: user.nama,
      roleSlug: user.roleSlug || user.role,
      wilayah: user.wilayah,
      status: user.status,
      initial: user.initial,
      color: user.color,
      terakhirLogin: user.terakhirLogin,
      kelas: user.kelas,
      nis: user.nis,
      newUserSource: user.newUserSource,
      sekolahId: user.sekolahId,
      requestedRole: user.requestedRole,
      suratTugas: user.suratTugas,
      masaAktif: user.masaAktif,
      updatedAt: sql`CURRENT_TIMESTAMP`,
      ...(user.password ? { password: user.password } : {})
    }).where(eq(users.id, id));

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = context.params.id;
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: jsonHeaders });
    
    const ormDb = drizzle(context.env.DB);
    await ormDb.delete(users).where(eq(users.id, id));

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
