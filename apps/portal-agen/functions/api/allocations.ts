import { getTenantSchoolId, tenantError } from "./_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const url = new URL(context.request.url);
    const tenantSchoolId = getTenantSchoolId(context);
    
    if (tenantSchoolId === 0) return tenantError();

    let results;
    if (tenantSchoolId) {
      const res = await rawDb.prepare(
        `SELECT id, siswa_id as studentUsername, isbn, sekolah_id as schoolId, tanggal_alokasi as tanggal
         FROM Alokasi_Siswa
         WHERE sekolah_id = ?
         ORDER BY tanggal_alokasi DESC`
      ).bind(tenantSchoolId).all();
      results = res.results || [];
    } else {
      // Superadmin can see all allocations
      const res = await rawDb.prepare(
        `SELECT id, siswa_id as studentUsername, isbn, sekolah_id as schoolId, tanggal_alokasi as tanggal
         FROM Alokasi_Siswa
         ORDER BY tanggal_alokasi DESC`
      ).all();
      results = res.results || [];
    }

    // Map to the format expected by the frontend's appData
    const mapped = results.map((row: any) => ({
      id: row.id,
      studentUsername: row.studentUsername,
      isbn: row.isbn,
      schoolId: row.schoolId,
      tanggal: (row.tanggal || "").slice(0, 10),
    }));

    return new Response(JSON.stringify({ success: true, data: mapped }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
