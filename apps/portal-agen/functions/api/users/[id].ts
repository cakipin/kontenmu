import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../../../src/db/schema";
import { getTenantSchoolId, tenantError } from "../_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPut = async (context: any) => {
  try {
    const id = String(context.params.id || "");
    const ormDb = drizzle(context.env.DB);
    const existing = await ormDb.select().from(users).where(eq(users.id, id)).get();
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "User tidak ditemukan" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const payload = context.data?.auth || {};
    const role = String(payload.role || "");
    const tenantSchoolId = getTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();
    const sessionSchoolId = String(tenantSchoolId || "");
    if (
      role !== "superadmin" &&
      !(role === "sekolah" && sessionSchoolId && sessionSchoolId === String(existing.sekolahId || ""))
    ) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    const data = await context.request.json();
    const updateData: any = { updatedAt: sql`CURRENT_TIMESTAMP` };
    const mappings: Record<string, string> = {
      username: "username",
      nama: "nama",
      role: "roleSlug",
      wilayah: "wilayah",
      status: "status",
      initial: "initial",
      color: "color",
      kelas: "kelas",
      nis: "nis",
      newUserSource: "newUserSource",
      requestedRole: "requestedRole",
      suratTugas: "suratTugas",
      masaAktif: "masaAktif",
    };
    for (const [inputKey, columnKey] of Object.entries(mappings)) {
      if (data[inputKey] !== undefined) updateData[columnKey] = data[inputKey];
    }
    const requestedSchoolId = data.sekolah_id ?? data.sekolahId;
    if (tenantSchoolId) {
      updateData.sekolahId = tenantSchoolId;
    } else if (requestedSchoolId !== undefined) {
      updateData.sekolahId = requestedSchoolId || null;
    }
    if (typeof data.password === "string" && data.password.trim()) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.status === "Aktif" && data.role && data.role !== "pending") {
      updateData.requestedRole = null;
    }

    await ormDb.update(users).set(updateData).where(eq(users.id, id));

    // Opsi 2: Trigger notifikasi jika user baru saja melengkapi data sekolahnya
    if (
      updateData.sekolahId && 
      (!existing.sekolahId || String(existing.sekolahId) !== String(updateData.sekolahId))
    ) {
      const notifId = crypto.randomUUID();
      const finalRoleName = updateData.roleSlug || existing.roleSlug;
      const finalNama = updateData.nama || existing.nama;
      const message = `Pendaftaran SSO / Melengkapi data: ${finalNama} (${finalRoleName})`;
      
      try {
        await context.env.DB.prepare(
          `INSERT INTO notifications (id, sekolah_id, message) VALUES (?, ?, ?)`
        )
          .bind(notifId, updateData.sekolahId, message)
          .run();
      } catch (e) {
        console.error("Gagal menyimpan notifikasi dari pelengkapan data:", e);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Gagal menyimpan user" }),
      { status: 500, headers: jsonHeaders },
    );
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = String(context.params.id || "");
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Missing ID" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const ormDb = drizzle(context.env.DB);
    const existing = await ormDb.select().from(users).where(eq(users.id, id)).get();
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "User tidak ditemukan" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const payload = context.data?.auth || {};
    if (String(payload.role || "") !== "superadmin") {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    await ormDb.delete(users).where(eq(users.id, id));
    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Gagal menghapus user" }),
      { status: 500, headers: jsonHeaders },
    );
  }
};
