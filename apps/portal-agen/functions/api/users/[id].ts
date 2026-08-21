import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { users } from "../../../src/db/schema";
import { getTenantSchoolId, tenantError } from "../_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPut = async (context: any) => {
  try {
    const payload = context.data?.auth || {};
    const role = String(payload.role || "");
    // Untuk onboarding, sub token adalah identitas yang otoritatif. Ini juga
    // menangani sesi SSO lama yang sempat menyimpan ID frontend yang keliru.
    let id = role === "pending"
      ? String(payload.sub || "")
      : String(context.params.id || "");
    const ormDb = drizzle(context.env.DB);
    let existing = await ormDb.select().from(users).where(eq(users.id, id)).get();
    if (!existing && role === "pending" && payload.username) {
      existing = await ormDb
        .select()
        .from(users)
        .where(eq(users.username, String(payload.username)))
        .get();
      if (existing) id = existing.id;
    }
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "User tidak ditemukan" }), {
        status: 404,
        headers: jsonHeaders,
      });
    }

    const tenantSchoolId = getTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();
    const sessionSchoolId = String(tenantSchoolId || "");
    const isPendingSelf = role === "pending";
    if (
      role !== "superadmin" &&
      !isPendingSelf &&
      !(role === "sekolah" && sessionSchoolId && sessionSchoolId === String(existing.sekolahId || ""))
    ) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    const data = await context.request.json();

    if (isPendingSelf) {
      const requestedRole = String(data.requestedRole || data.role || "");
      const allowedRequestedRoles = new Set(["sekolah", "agen", "guru", "siswa"]);
      const requestedSchoolId = Number(data.sekolah_id ?? data.sekolahId);
      let validatedSchoolName = "";

      if (!allowedRequestedRoles.has(requestedRole)) {
        return new Response(JSON.stringify({ success: false, error: "Role pengajuan tidak valid" }), {
          status: 400,
          headers: jsonHeaders,
        });
      }
      if (["sekolah", "guru", "siswa"].includes(requestedRole)) {
        if (!Number.isInteger(requestedSchoolId) || requestedSchoolId <= 0) {
          return new Response(JSON.stringify({ success: false, error: "Sekolah wajib dipilih" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }
        const school = await context.env.DB.prepare(
          "SELECT id, nama FROM master_data_sekolah WHERE id = ? LIMIT 1",
        ).bind(requestedSchoolId).first<{ id: number; nama: string }>();
        if (Number(school?.id) !== requestedSchoolId) {
          return new Response(JSON.stringify({ success: false, error: "Sekolah tidak valid" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }
        validatedSchoolName = String(school?.nama || "");
        if (requestedRole === "sekolah" && !String(data.suratTugas || "").startsWith("/api/media/")) {
          return new Response(JSON.stringify({ success: false, error: "Surat tugas wajib diunggah" }), {
            status: 400,
            headers: jsonHeaders,
          });
        }
      }

      const pendingUpdate: any = {
        roleSlug: "pending",
        status: "Menunggu Approve",
        requestedRole,
        nama: data.nama || existing.nama,
        wilayah: validatedSchoolName || data.wilayah || existing.wilayah,
        sekolahId: Number.isInteger(requestedSchoolId) && requestedSchoolId > 0
          ? requestedSchoolId
          : null,
        kelas: requestedRole === "siswa" ? data.kelas ?? null : null,
        nis: ["guru", "siswa"].includes(requestedRole) ? data.nis ?? null : null,
        suratTugas: requestedRole === "sekolah" ? data.suratTugas ?? null : null,
        masaAktif: requestedRole === "sekolah" ? data.masaAktif ?? null : null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      };
      await ormDb.update(users).set(pendingUpdate).where(eq(users.id, id));

      if (["guru", "siswa"].includes(requestedRole) && pendingUpdate.sekolahId) {
        const roleLabel = requestedRole === "guru" ? "Guru" : "Siswa";
        const sourceLabel = existing.newUserSource === "sso" ? "SSO" : "manual";
        await context.env.DB.prepare(
          `INSERT INTO notifications (id, sekolah_id, message) VALUES (?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          pendingUpdate.sekolahId,
          `Pendaftaran ${sourceLabel} baru: ${pendingUpdate.nama} (${roleLabel})`,
        ).run();
      }

      return new Response(JSON.stringify({ success: true, pendingApproval: true }), {
        headers: jsonHeaders,
      });
    }

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

    // Sanitize updateData to ensure no undefined values are passed to D1
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

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
