const jsonHeaders = { 'Content-Type': 'application/json' };

export const onRequestGet = async (context: any) => {
  try {
    const result = await context.env.DB.prepare(`
      SELECT id, username, nama, role_slug as role, wilayah, status, initial, color,
        terakhir_login as terakhirLogin, kelas, nis, new_user_source as newUserSource,
        sso_id as ssoId, email, requested_role as requestedRole, surat_tugas as suratTugas, masa_aktif as masaAktif, sekolah_id as sekolahId
      FROM users
      ORDER BY updated_at DESC, created_at DESC
    `).all();

    return new Response(JSON.stringify({ users: result.results ?? [] }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const user = await context.request.json();
    if (!user?.id || !user?.username) {
      return new Response(JSON.stringify({ error: 'id dan username wajib diisi' }), { status: 400, headers: jsonHeaders });
    }

    await context.env.DB.prepare(`
      INSERT INTO users (
        id, username, nama, role_slug, wilayah, status, initial, color,
        terakhir_login, kelas, nis, new_user_source, sekolah_id, requested_role, surat_tugas, masa_aktif, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, CURRENT_TIMESTAMP)
      ON CONFLICT(username) DO UPDATE SET
        id = excluded.id,
        nama = excluded.nama,
        role_slug = excluded.role_slug,
        wilayah = excluded.wilayah,
        status = excluded.status,
        initial = excluded.initial,
        color = excluded.color,
        terakhir_login = excluded.terakhir_login,
        kelas = excluded.kelas,
        nis = excluded.nis,
        new_user_source = excluded.new_user_source,
        sekolah_id = excluded.sekolah_id,
        requested_role = excluded.requested_role,
        surat_tugas = excluded.surat_tugas,
        masa_aktif = excluded.masa_aktif,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      user.id,
      user.username,
      user.nama || user.username,
      user.role || 'pending',
      user.wilayah || 'SSO Login',
      user.status || 'Aktif',
      user.initial || '',
      user.color || '#64748b',
      user.terakhirLogin || '',
      user.kelas ?? null,
      user.nis ?? null,
      user.newUserSource !== undefined ? user.newUserSource : 'sso',
      user.sekolahId ?? null,
      user.requestedRole ?? null,
      user.suratTugas ?? null,
      user.masaAktif ?? null,
    ).run();

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
