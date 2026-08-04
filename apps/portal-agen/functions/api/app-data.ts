const STATE_ID = 'portal-agen:simulation:v1';

const jsonHeaders = { 'Content-Type': 'application/json' };

function mapUserRow(row: any) {
  return {
    id: row.id,
    username: row.username,
    nama: row.nama,
    role: row.role_slug,
    wilayah: row.wilayah,
    status: row.status,
    initial: row.initial,
    color: row.color,
    terakhirLogin: row.terakhir_login,
    kelas: row.kelas ?? undefined,
    nis: row.nis ?? undefined,
    newUserSource: row.new_user_source ?? undefined,
    ssoId: row.sso_id ?? undefined,
    email: row.email ?? undefined,
    sekolah_id: row.sekolah_id ?? undefined,
  };
}

function userStatements(data: any, db: any) {
  const users = Array.isArray(data?.users) ? data.users : [];
  return users.map((user: any) => {
    const hasSekolahId = user.sekolahId !== undefined || user.sekolah_id !== undefined;
    const sekolahIdValue = user.sekolahId ?? user.sekolah_id ?? null;
    return db.prepare(`
    INSERT INTO users (
      id, username, nama, role_slug, wilayah, status, initial, color,
      terakhir_login, kelas, nis, new_user_source, sekolah_id, updated_at, sso_id, email
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, CURRENT_TIMESTAMP, ?14, ?15)
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
      sekolah_id = CASE WHEN ?16 = 1 THEN excluded.sekolah_id ELSE users.sekolah_id END,
      sso_id = excluded.sso_id,
      email = excluded.email,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    user.id,
    user.username,
    user.nama || user.username,
    user.role || 'pending',
    user.wilayah || '',
    user.status || 'Aktif',
    user.initial || '',
    user.color || '#64748b',
    user.terakhirLogin || '',
    user.kelas ?? null,
    user.nis ?? null,
    user.newUserSource ?? null,
    sekolahIdValue,
    user.ssoId ?? null,
    user.email ?? null,
    hasSekolahId ? 1 : 0,
  );
  });
}

export const onRequestGet = async (context: any) => {
  try {
    const db = context.env.DB;
    const row = await db
      .prepare('SELECT content FROM app_state WHERE id = ?1')
      .bind(STATE_ID)
      .first();

    const data = row?.content ? JSON.parse(row.content) : {};

    // Ambil data fresh dari tabel contents
    try {
      const contentRows = await db.prepare('SELECT * FROM contents ORDER BY updated_at DESC, created_at DESC').all();
      data.contents = (contentRows.results ?? []).map((item: any) => ({
        id: item.id,
        judul: item.judul,
        kategori: item.kategori,
        mapel: item.mapel,
        target: item.target,
        fileName: item.file_name,
        deskripsi: item.deskripsi ?? undefined,
        thumbnailUrl: item.thumbnail_url ?? undefined,
        status: item.status,
        tanggal: item.tanggal,
        previewMode: item.preview_mode,
        thumbnailKey: item.thumbnail_key,
        protectedPreview: Boolean(item.protected_preview),
        sourceUrl: item.source_url ?? undefined,
        isbn: item.isbn ?? undefined,
      }));
    } catch {
      // Jika query gagal, biarkan data.contents berisi nilai dari app_state
    }

    const userRows = await db
      .prepare(`SELECT id, username, nama, role_slug, wilayah, status, initial, color,
        terakhir_login, kelas, nis, new_user_source, sso_id, email, sekolah_id
        FROM users ORDER BY updated_at DESC, created_at DESC`)
      .all();

    if (userRows.results?.length) {
      data.users = userRows.results.map(mapUserRow);
    }

    // Selalu return found: true dengan data yang ada
    // Client tidak boleh mendapat found: false hanya karena app_state kosong
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
    // Save everything as JSON in app_state
    const content = JSON.stringify(payload);
    const db = context.env.DB;
    
    await db.prepare(`
      INSERT INTO app_state (id, content, updated_at) 
      VALUES (?1, ?2, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET content = ?2, updated_at = CURRENT_TIMESTAMP
    `).bind(STATE_ID, content).run();

    // Sync users table - DISABLED because sales-api handles users directly and this causes data loss when frontend has stale users
    /*
    if (payload.users && Array.isArray(payload.users) && payload.users.length > 0) {
      const existingUserRows = await db.prepare('SELECT id FROM users').all();
      const existingIds = existingUserRows.results ? existingUserRows.results.map((r: any) => r.id) : [];
      const payloadUserIds = payload.users.map((u: any) => u.id).filter(Boolean);
      
      const idsToDelete = existingIds.filter(id => !payloadUserIds.includes(id));
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        }
      }

      const stmts = userStatements(payload, db);
      for (const stmt of stmts) {
        await stmt.run();
      }
    }
    */

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
