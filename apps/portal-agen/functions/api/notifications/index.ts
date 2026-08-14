import { getTenantSchoolId, tenantError } from "../_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestGet = async (context: any) => {
  try {
    const auth = context.data?.auth || {};
    const sekolahId = getTenantSchoolId(context);

    if (auth.role !== "superadmin" && auth.role !== "sekolah") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    // superadmin doesn't have a fixed sekolahId, but we'll fetch notifications anyway
    // though the current superadmin notification logic relies on pendingApiUsers.
    // If it's a sekolah role, they MUST have a valid sekolahId.
    if (auth.role === "sekolah" && !sekolahId) {
      return tenantError();
    }

    let query = "SELECT * FROM notifications";
    let bindParams: any[] = [];

    if (auth.role === "sekolah") {
      query += " WHERE sekolah_id = ? ORDER BY created_at DESC LIMIT 100";
      bindParams.push(sekolahId);
    } else {
      query += " ORDER BY created_at DESC LIMIT 100";
    }

    const { results } = await context.env.DB.prepare(query).bind(...bindParams).all();

    return new Response(JSON.stringify({ success: true, data: results }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    console.error("[GET /api/notifications] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPatch = async (context: any) => {
  try {
    const auth = context.data?.auth || {};
    const sekolahId = getTenantSchoolId(context);

    if (auth.role !== "superadmin" && auth.role !== "sekolah") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: jsonHeaders,
      });
    }

    if (auth.role === "sekolah" && !sekolahId) {
      return tenantError();
    }

    const body = await context.request.json();
    
    if (body.markAllAsRead) {
      if (auth.role === "sekolah") {
        await context.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE sekolah_id = ?")
          .bind(sekolahId)
          .run();
      } else {
        await context.env.DB.prepare("UPDATE notifications SET is_read = 1").run();
      }
    } else if (body.id) {
      if (auth.role === "sekolah") {
        await context.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND sekolah_id = ?")
          .bind(body.id, sekolahId)
          .run();
      } else {
        await context.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").bind(body.id).run();
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    console.error("[PATCH /api/notifications] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
