const jsonHeaders = { "Content-Type": "application/json" };

import { getTenantSchoolId, tenantError } from "./_tenant";

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const auth = context.data?.auth || {};
    
    if (!auth.role) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // Role-based filtering
    let tenantWhere = "";
    const bindings: any[] = [];
    
    if (auth.role !== "superadmin") {
      const tenantSchoolId = getTenantSchoolId(context);
      if (tenantSchoolId === 0) return tenantError();
      tenantWhere = " AND sekolah_id = ?";
      bindings.push(tenantSchoolId);
    }

    // --- 1. D1 Queries for Active Users ---
    // Active Today (from midnight UTC or last 24h)
    const qToday = `SELECT COUNT(*) as count FROM users WHERE status = 'Aktif' AND terakhir_login >= datetime('now', '-1 day')${tenantWhere}`;
    
    // Active This Week (last 7 days)
    const qWeek = `SELECT COUNT(*) as count FROM users WHERE status = 'Aktif' AND terakhir_login >= datetime('now', '-7 days')${tenantWhere}`;

    const [stmtToday, stmtWeek] = await rawDb.batch([
      rawDb.prepare(qToday).bind(...bindings),
      rawDb.prepare(qWeek).bind(...bindings),
    ]);

    const activeUsersToday = stmtToday.results[0]?.count || 0;
    const activeUsersWeek = stmtWeek.results[0]?.count || 0;

    // --- 2. Cloudflare GraphQL Analytics API (Optional/Traffic) ---
    let visitsToday = null;
    let visitsWeek = null;
    let isAnalyticsConfigured = false;

    const accountId = context.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = context.env.CLOUDFLARE_API_TOKEN;

    if (accountId && apiToken) {
      isAnalyticsConfigured = true;
      try {
        // Query to Cloudflare GraphQL API
        const today = new Date();
        today.setUTCHours(0,0,0,0);
        const todayStr = today.toISOString().split('T')[0];
        
        const lastWeek = new Date();
        lastWeek.setUTCDate(today.getUTCDate() - 7);
        const lastWeekStr = lastWeek.toISOString().split('T')[0];

        const query = `
          query {
            viewer {
              accounts(filter: { accountTag: "${accountId}" }) {
                rumPageloadEventsAdaptiveGroups(
                  limit: 1000,
                  filter: { date_geq: "${lastWeekStr}" }
                ) {
                  sum {
                    visits
                  }
                  dimensions {
                    date
                  }
                }
              }
            }
          }
        `;

        const cfRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiToken}`
          },
          body: JSON.stringify({ query })
        });

        if (cfRes.ok) {
          const cfData = await cfRes.json() as any;
          const groups = cfData?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
          
          let sumToday = 0;
          let sumWeek = 0;

          groups.forEach((g: any) => {
            const req = g.sum?.visits || 0;
            sumWeek += req;
            if (g.dimensions?.date === todayStr) {
              sumToday += req;
            }
          });

          visitsToday = sumToday;
          visitsWeek = sumWeek;
        }
      } catch (err) {
        console.error("Cloudflare GraphQL API error:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          activeUsersToday,
          activeUsersWeek,
          visitsToday,
          visitsWeek,
          isAnalyticsConfigured,
        },
      }),
      { headers: jsonHeaders }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
