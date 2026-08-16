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
    let visitsChart: any[] = [];
    let deviceChart: any[] = [];
    let topPaths: any[] = [];
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
                devices: rumPageloadEventsAdaptiveGroups(
                  limit: 10,
                  filter: { date_geq: "${lastWeekStr}" },
                  orderBy: [sum_visits_DESC]
                ) {
                  sum {
                    visits
                  }
                  dimensions {
                    deviceType
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
          const account = cfData?.data?.viewer?.accounts?.[0];
          const groups = account?.rumPageloadEventsAdaptiveGroups || [];
          const devicesData = account?.devices || [];
          const topPathsData = account?.topPaths || [];
          
          let sumToday = 0;
          let sumWeek = 0;

          // Process daily visits (aggregate by date)
          const dailyVisits: Record<string, number> = {};
          
          groups.forEach((g: any) => {
            const req = g.sum?.visits || 0;
            const d = g.dimensions?.date;
            sumWeek += req;
            if (d === todayStr) {
              sumToday += req;
            }
            if (d) {
              dailyVisits[d] = (dailyVisits[d] || 0) + req;
            }
          });

          // Sort daily visits by date ascending
          visitsChart = Object.keys(dailyVisits).sort().map(date => ({
            date,
            visits: dailyVisits[date]
          }));

          // Process devices
          const aggregatedDevices: Record<string, number> = {};
          devicesData.forEach((g: any) => {
             const type = g.dimensions?.deviceType || "Unknown";
             aggregatedDevices[type] = (aggregatedDevices[type] || 0) + (g.sum?.visits || 0);
          });
          deviceChart = Object.keys(aggregatedDevices).map(deviceType => ({
            deviceType,
            visits: aggregatedDevices[deviceType]
          }));

          // Process top paths from D1 database directly
          try {
            const topContentsStmt = await rawDb.prepare("SELECT judul as path, views as visits FROM contents WHERE views > 0 ORDER BY views DESC LIMIT 10").all();
            if (topContentsStmt.success && topContentsStmt.results) {
               topPaths = topContentsStmt.results;
            }
          } catch(err) {
             console.error("D1 top paths error:", err);
          }

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
          visitsChart,
          deviceChart,
          topPaths,
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
