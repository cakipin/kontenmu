import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { appState } from "../../src/db/schema";

const STATE_ID = "portal-agen:simulation:v1";
const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const isLite = url.searchParams.get("lite") === "true";

    const KV = context.env.PUCK_DATA;
    let stateString = null;
    
    // 1. Coba ambil dari KV Cache
    if (KV) {
      stateString = await KV.get("app_state");
    }

    // 2. Cache miss atau KV tidak tersedia, ambil dari D1
    if (!stateString) {
      const rawDb = context.env.DB;
      const db = drizzle(rawDb);
      
      const stateResult = await db
        .select()
        .from(appState)
        .where(eq(appState.id, STATE_ID))
        .get();

      stateString = stateResult?.content || "{}";

      // Simpan ke KV untuk permintaan berikutnya (Cache selama 1 jam = 3600 detik)
      if (KV) {
        await KV.put("app_state", stateString, { expirationTtl: 3600 });
      }
    }

    const data: any = stateString ? JSON.parse(stateString) : {};

    // Lazy load: Jika lite=true, kosongkan schools agar payload jauh lebih kecil (~500KB -> ~50KB)
    if (isLite) {
      data.schools = [];
    }
    
    // Catatan Refactor (v0.1.1):
    // contents dan users TIDAK LAGI diambil dari sini. Klien akan mengambil secara mandiri via API masing-masing.
    // Pastikan payload bersih jika sisa cache ada:
    data.contents = [];
    data.users = [];

    return new Response(JSON.stringify({ found: true, data }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPut = async (context: any) => {
  try {
    const payload = await context.request.json();
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);

    // Safety check: Jangan izinkan menyimpan schools kosong jika sebelumnya ada schools,
    // karena frontend mungkin mengirim payload dari fetch(lite=true)
    if (
      payload &&
      Array.isArray(payload.schools) &&
      payload.schools.length === 0
    ) {
      const existing = await db
        .select()
        .from(appState)
        .where(eq(appState.id, STATE_ID))
        .get();
        
      const existingData = existing?.content ? JSON.parse(existing.content) : {};
      if (existingData.schools && existingData.schools.length > 0) {
        payload.schools = existingData.schools;
      }
    }

    // Hanya simpan state murni (konfigurasi, schools, dll). 
    // contents dan users sekarang dikelola mandiri via masing-masing API-nya.
    if (payload.contents) delete payload.contents;
    if (payload.users) delete payload.users;

    const content = JSON.stringify(payload);

    await db.insert(appState).values({
      id: STATE_ID,
      content: content,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).onConflictDoUpdate({
      target: appState.id,
      set: {
        content: content,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    // Invalidate KV Cache karena data berubah
    const KV = context.env.PUCK_DATA;
    if (KV) {
      await KV.delete("app_state");
    }

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
