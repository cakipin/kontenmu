import { getTenantSchoolId, resolveTenantSchoolId, tenantError } from "./_tenant";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPost = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const tenantSchoolId = await resolveTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();

    const body = await context.request.json();
    const sekolahId = tenantSchoolId || body.sekolahId;
    const { isbn, siswaId, studentUsername } = body;
    
    // Support both siswaId and studentUsername for backward compatibility
    const targetUserId = siswaId || studentUsername;

    if (!sekolahId || !isbn || !targetUserId?.trim()) {
      return new Response(JSON.stringify({ success: false, error: "sekolahId, isbn, dan siswaId wajib diisi" }), { status: 400, headers: jsonHeaders });
    }

    // Relaxed check: allow any valid user to receive an allocation.
    const student = await rawDb.prepare(
      "SELECT id FROM users WHERE (id = ? OR username = ?) LIMIT 1",
    )
      .bind(targetUserId.trim(), targetUserId.trim())
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

    const inserted = await rawDb.prepare(
      "INSERT INTO Alokasi_Siswa (siswa_id, sekolah_id, isbn) VALUES (?, ?, ?)",
    )
      .bind(targetUserId.trim(), sekolahId, isbn)
      .run();

    const allocationId = inserted?.meta?.last_row_id;
    return new Response(JSON.stringify({
      success: true,
      message: "Alokasi berhasil disimpan.",
      allocation: allocationId ? {
        id: `ALC-${String(allocationId).padStart(4, "0")}`,
        studentUsername: targetUserId.trim(),
        isbn,
        schoolId: sekolahId,
        tanggal: new Date().toISOString().slice(0, 10),
      } : undefined,
    }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const tenantSchoolId = await resolveTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();

    const url = new URL(context.request.url);
    const rawId = url.searchParams.get("id") || "";
    const allocationId = rawId.replace(/^ALC-?/, "");
    if (!/^\d+$/.test(allocationId)) {
      return new Response(JSON.stringify({ success: false, error: "id alokasi tidak valid" }), { status: 400, headers: jsonHeaders });
    }

    const existing = await rawDb.prepare(
      "SELECT id, sekolah_id FROM Alokasi_Siswa WHERE id = ? LIMIT 1",
    ).bind(allocationId).first();
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "Alokasi tidak ditemukan" }), { status: 404, headers: jsonHeaders });
    }
    if (tenantSchoolId && Number(existing.sekolah_id) !== Number(tenantSchoolId)) {
      return new Response(JSON.stringify({ success: false, error: "Alokasi bukan milik sekolah sesi" }), { status: 403, headers: jsonHeaders });
    }

    await rawDb.prepare("DELETE FROM Alokasi_Siswa WHERE id = ?").bind(allocationId).run();
    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestPut = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const tenantSchoolId = await resolveTenantSchoolId(context);
    if (tenantSchoolId === 0) return tenantError();

    const body = await context.request.json();
    const rawId = String(body.id || "");
    const allocationId = rawId.replace(/^ALC-?/, "");
    const targetUserId = String(body.siswaId || body.studentUsername || "").trim();
    const isbn = String(body.isbn || "").trim();
    if (!/^\d+$/.test(allocationId) || !targetUserId || !isbn) {
      return new Response(JSON.stringify({ success: false, error: "id, siswaId, dan isbn wajib valid" }), { status: 400, headers: jsonHeaders });
    }

    const existing: any = await rawDb.prepare(
      "SELECT id, sekolah_id FROM Alokasi_Siswa WHERE id = ? LIMIT 1",
    ).bind(allocationId).first();
    if (!existing) {
      return new Response(JSON.stringify({ success: false, error: "Alokasi tidak ditemukan" }), { status: 404, headers: jsonHeaders });
    }
    const schoolId = tenantSchoolId || Number(existing.sekolah_id);
    if (tenantSchoolId && Number(existing.sekolah_id) !== Number(tenantSchoolId)) {
      return new Response(JSON.stringify({ success: false, error: "Alokasi bukan milik sekolah sesi" }), { status: 403, headers: jsonHeaders });
    }

    const target = await rawDb.prepare(
      "SELECT id FROM users WHERE (id = ? OR username = ?) AND role_slug IN ('siswa', 'guru') LIMIT 1",
    ).bind(targetUserId, targetUserId).first();
    if (!target) {
      return new Response(JSON.stringify({ success: false, error: "Pengguna tidak terdaftar pada sekolah sesi" }), { status: 403, headers: jsonHeaders });
    }

    const duplicate = await rawDb.prepare(
      "SELECT id FROM Alokasi_Siswa WHERE siswa_id = ? AND isbn = ? AND id <> ? LIMIT 1",
    ).bind(targetUserId, isbn, allocationId).first();
    if (duplicate) {
      return new Response(JSON.stringify({ success: false, error: "Pengguna sudah memiliki alokasi ISBN ini" }), { status: 409, headers: jsonHeaders });
    }

    await rawDb.prepare(
      "UPDATE Alokasi_Siswa SET siswa_id = ?, isbn = ? WHERE id = ?",
    ).bind(targetUserId, isbn, allocationId).run();
    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
