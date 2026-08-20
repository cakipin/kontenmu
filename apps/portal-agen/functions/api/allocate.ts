import { getTenantSchoolId, tenantError } from "./_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPost = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const tenantSchoolId = getTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();

    const body = await context.request.json();
    const sekolahId = tenantSchoolId || body.sekolahId;
    const { isbn, siswaId, studentUsername } = body;
    
    // Support both siswaId and studentUsername for backward compatibility
    const targetUserId = siswaId || studentUsername;

    if (!sekolahId || !isbn || !targetUserId?.trim()) {
      return new Response(JSON.stringify({ success: false, error: "sekolahId, isbn, dan siswaId wajib diisi" }), { status: 400, headers: jsonHeaders });
    }

    const student = await rawDb.prepare(
      "SELECT id FROM users WHERE (id = ? OR username = ?) AND sekolah_id = ? AND role_slug IN ('siswa', 'guru') LIMIT 1",
    )
      .bind(targetUserId.trim(), targetUserId.trim(), sekolahId)
      .first();

    if (!student) {
      return new Response(JSON.stringify({ success: false, error: "Pengguna tidak terdaftar pada sekolah sesi" }), { status: 403, headers: jsonHeaders });
    }

    const existing = await rawDb.prepare(
      "SELECT id FROM Alokasi_Siswa WHERE siswa_id = ? AND isbn = ?",
    )
      .bind(targetUserId.trim(), isbn)
      .first();

    if (existing) {
      return new Response(JSON.stringify({ success: false, error: `Siswa ${targetUserId} sudah memiliki lisensi untuk ISBN ini` }), { status: 409, headers: jsonHeaders });
    }

    await rawDb.prepare(
      "INSERT INTO Alokasi_Siswa (siswa_id, sekolah_id, isbn) VALUES (?, ?, ?)",
    )
      .bind(targetUserId.trim(), sekolahId, isbn)
      .run();

    return new Response(JSON.stringify({ success: true, message: "Alokasi berhasil disimpan." }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
