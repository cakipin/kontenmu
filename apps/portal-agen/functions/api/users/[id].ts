import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import bcrypt from "bcryptjs";
import { users } from "../../../src/db/schema";

const jsonHeaders = { "Content-Type": "application/json" };

function authPayload(request: Request) {
  const cookie = request.headers.get("Cookie") || "";
  const authCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .find(
      (part) =>
        part.startsWith("__Host-kontenmu_auth=") ||
        part.startsWith("kontenmu_auth="),
    );
  const token = authCookie ? authCookie.slice(authCookie.indexOf("=") + 1) : "";
  return token ? (decode(token).payload as any) : {};
}

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

    const payload = authPayload(context.request);
    const role = String(payload.role || "");
    const sessionSchoolId = String(payload.sekolahId || payload.sekolah_id || "");
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
    if (requestedSchoolId !== undefined) updateData.sekolahId = requestedSchoolId || null;
    if (typeof data.password === "string" && data.password.trim()) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.status === "Aktif" && data.role && data.role !== "pending") {
      updateData.requestedRole = null;
    }

    await ormDb.update(users).set(updateData).where(eq(users.id, id));
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

    const payload = authPayload(context.request);
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
