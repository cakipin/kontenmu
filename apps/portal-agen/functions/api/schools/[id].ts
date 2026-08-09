import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { masterDataSekolah } from "../../../src/db/schema";
import { decode } from "@tsndr/cloudflare-worker-jwt";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPut = async (context: any) => {
  try {
    const id = context.params.id;
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: jsonHeaders });
    
    const data = await context.request.json();
    const ormDb = drizzle(context.env.DB);

    const cookie = context.request.headers.get("Cookie") || "";
    const authCookie = cookie
      .split(";")
      .map((part: string) => part.trim())
      .find((part: string) => part.startsWith("__Host-kontenmu_auth=") || part.startsWith("kontenmu_auth="));
    const token = authCookie ? authCookie.slice(authCookie.indexOf("=") + 1) : "";
    const payload: any = token ? decode(token).payload : {};
    const role = String(payload.role || "");
    const schoolId = String(payload.sekolahId || payload.sekolah_id || "");

    if (role === "sekolah" && schoolId !== String(id)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
    }
    
    // Clean up undefined properties to avoid Drizzle replacing them with null or erroring if not null allowed
    const updateData: any = {};
    const allowedKeys = ['nama', 'jenjang', 'alamat', 'rt', 'rw', 'dusun', 'desaKelurahan', 'kecamatan', 'kabupaten', 'provinsi', 'npsn', 'status', 'logoUrl', 'gmapUrl', 'prm', 'pcm', 'pdm', 'pwm', 'lintang', 'bujur', 'telepon', 'fax', 'email', 'website', 'akreditasi'];
    const schoolAdminLockedKeys = new Set(['nama', 'npsn', 'jenjang', 'status', 'akreditasi']);
    const existing = await ormDb
      .select()
      .from(masterDataSekolah)
      .where(eq(masterDataSekolah.id, parseInt(id, 10)))
      .get();

    for (const key of allowedKeys) {
      if (data[key] !== undefined && !(role === "sekolah" && schoolAdminLockedKeys.has(key))) {
        updateData[key] = data[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ success: true, message: "Tidak ada data kosong yang diperbarui" }), { headers: jsonHeaders });
    }

    await ormDb.update(masterDataSekolah).set(updateData).where(eq(masterDataSekolah.id, parseInt(id, 10)));

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
    await ormDb.delete(masterDataSekolah).where(eq(masterDataSekolah.id, parseInt(id, 10)));

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
