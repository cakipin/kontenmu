import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { decode } from "@tsndr/cloudflare-worker-jwt";
import { masterDataSekolah } from "../../../src/db/schema";

const jsonHeaders = { "Content-Type": "application/json" };
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const onRequestPost = async (context: any) => {
  try {
    const id = String(context.params.id || "");
    const cookie = context.request.headers.get("Cookie") || "";
    const authCookie = cookie
      .split(";")
      .map((part: string) => part.trim())
      .find((part: string) => part.startsWith("__Host-kontenmu_auth=") || part.startsWith("kontenmu_auth="));
    const token = authCookie ? authCookie.slice(authCookie.indexOf("=") + 1) : "";
    const payload: any = token ? decode(token).payload : {};
    const role = String(payload.role || "");
    const schoolId = String(payload.sekolahId || payload.sekolah_id || "");

    if (!id || role !== "sekolah" || schoolId !== id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: jsonHeaders });
    }
    if (!context.env.MEDIA) {
      return new Response(JSON.stringify({ error: "Penyimpanan media belum dikonfigurasi." }), { status: 500, headers: jsonHeaders });
    }

    const formData = await context.request.formData();
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "Pilih file logo sekolah." }), { status: 400, headers: jsonHeaders });
    }
    if (!allowedTypes.has(file.type)) {
      return new Response(JSON.stringify({ error: "Logo harus berformat JPG, PNG, atau WebP." }), { status: 415, headers: jsonHeaders });
    }
    if (file.size > 2 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: "Ukuran logo maksimal 2 MB." }), { status: 413, headers: jsonHeaders });
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const random = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const filename = `school-logos/${id}-${Date.now()}-${random}.${extension}`;
    await context.env.MEDIA.put(filename, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    const logoUrl = `/api/media/${filename}`;
    const ormDb = drizzle(context.env.DB);
    await ormDb
      .update(masterDataSekolah)
      .set({ logoUrl })
      .where(eq(masterDataSekolah.id, Number(id)));

    return new Response(JSON.stringify({ success: true, url: logoUrl }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Upload logo gagal." }), { status: 500, headers: jsonHeaders });
  }
};
