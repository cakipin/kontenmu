import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { appState } from "../../src/db/schema";
import {
  filterTenantState,
  getTenantSchoolId,
  mergeTenantState,
  tenantError,
} from "./_tenant";

const STATE_ID = "portal-agen:simulation:v1";
const jsonHeaders = { "Content-Type": "application/json" };

async function getAllowedLearningUsers(
  rawDb: D1Database,
  context: any,
  tenantSchoolId: number | null,
) {
  const auth = context.data?.auth || {};
  const role = String(auth.role || "");
  const username = String(auth.username || "");
  const subject = String(auth.sub || "");

  let query =
    "SELECT username FROM users WHERE status = 'Aktif' AND role_slug = 'siswa'";
  const bindings: Array<string | number> = [];
  if (tenantSchoolId) {
    query += " AND sekolah_id = ?";
    bindings.push(tenantSchoolId);
  }
  if (role === "siswa") {
    query += " AND (username = ? OR id = ?)";
    bindings.push(username, subject);
  }

  const statement = bindings.length
    ? rawDb.prepare(query).bind(...bindings)
    : rawDb.prepare(query);
  const result = await statement.all<{ username: string }>();
  const allowed = new Set(
    (result.results || []).map((row) => String(row.username || "")).filter(Boolean),
  );
  if ((role === "siswa" || role === "guru") && username) {
    allowed.add(username);
  }
  return allowed;
}

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const isLite = url.searchParams.get("lite") === "true";
    const rawDb = context.env.DB;

    const KV = context.env.PUCK_DATA;
    let stateString = null;
    
    // 1. Coba ambil dari KV Cache
    if (KV) {
      stateString = await KV.get("app_state");
    }

    // 2. Cache miss atau KV tidak tersedia, ambil dari D1
    if (!stateString) {
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
    const tenantSchoolId = getTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();
    const allowedLearningUsers = isLite
      ? undefined
      : await getAllowedLearningUsers(rawDb, context, tenantSchoolId);
    let responseData = data;

    // Respons bootstrap hanya membawa konfigurasi publik yang dibutuhkan untuk
    // render awal. Jangan mengirim state lengkap lalu sekadar mengosongkan tiga
    // array karena state dapat berisi credential dan data operasional lain.
    if (isLite) {
      responseData = {
        schools: [],
        contents: [],
        users: [],
        isChatWidgetEnabled: data.isChatWidgetEnabled,
        aiApiEndpoint: data.aiApiEndpoint,
        aiBotName: data.aiBotName,
        aiWelcomeMessage: data.aiWelcomeMessage,
        aiProvider: data.aiProvider,
        roleAccessPermissions: data.roleAccessPermissions,
      };
    } else if (tenantSchoolId) {
      responseData = filterTenantState(
        data,
        tenantSchoolId,
        allowedLearningUsers,
      );
    } else if (allowedLearningUsers && Array.isArray(data.learning)) {
      responseData = {
        ...data,
        learning: data.learning.filter((item: any) =>
          allowedLearningUsers.has(String(item?.studentUsername || "")),
        ),
      };
    }

    return new Response(JSON.stringify({ found: true, data: responseData }), {
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
    let payload = await context.request.json();
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    const tenantSchoolId = getTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();

    if (tenantSchoolId) {
      const existing = await db
        .select()
        .from(appState)
        .where(eq(appState.id, STATE_ID))
        .get();
      const existingData = existing?.content ? JSON.parse(existing.content) : {};
      const allowedLearningUsers = await getAllowedLearningUsers(
        rawDb,
        context,
        tenantSchoolId,
      );
      payload = mergeTenantState(
        existingData,
        payload,
        tenantSchoolId,
        allowedLearningUsers,
      );
    }

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

    // Database staging lama tidak memiliki kolom created_at yang terdapat
    // pada schema Drizzle. Gunakan SQL yang kompatibel dengan kedua schema.
    const updateResult = await rawDb
      .prepare(
        "UPDATE app_state SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(content, STATE_ID)
      .run();

    if (!updateResult.meta?.changes) {
      await rawDb
        .prepare(
          "INSERT INTO app_state (id, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        )
        .bind(STATE_ID, content)
        .run();
    }

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
