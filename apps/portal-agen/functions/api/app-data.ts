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


import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, sql } from 'drizzle-orm';
import { appState, contents, users } from '../../src/db/schema';

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    const row = await db.select({ content: appState.content }).from(appState).where(eq(appState.id, STATE_ID)).get();

    const data = row?.content ? JSON.parse(row.content) : {};

    // Ambil data fresh dari tabel contents
    try {
      const contentRows = await db.select().from(contents).orderBy(desc(contents.updatedAt), desc(contents.createdAt));
      data.contents = contentRows.map((item: any) => ({
        id: item.id,
        judul: item.judul,
        kategori: item.kategori,
        mapel: item.mapel,
        target: item.target,
        fileName: item.fileName,
        deskripsi: item.deskripsi ?? undefined,
        thumbnailUrl: item.thumbnailUrl ?? undefined,
        status: item.status,
        tanggal: item.tanggal,
        previewMode: item.previewMode,
        thumbnailKey: item.thumbnailKey,
        protectedPreview: Boolean(item.protectedPreview),
        sourceUrl: item.sourceUrl ?? undefined,
        isbn: item.isbn ?? undefined,
      }));
    } catch {
      // Jika query gagal, biarkan data.contents berisi nilai dari app_state
    }

    const userRows = await db
      .select({
        id: users.id, username: users.username, nama: users.nama, role_slug: users.roleSlug, wilayah: users.wilayah, status: users.status, initial: users.initial, color: users.color,
        terakhir_login: users.terakhirLogin, kelas: users.kelas, nis: users.nis, new_user_source: users.newUserSource, sso_id: users.ssoId, email: users.email, sekolah_id: users.sekolahId
      })
      .from(users).orderBy(desc(users.updatedAt), desc(users.createdAt));

    if (userRows.length > 0) {
      data.users = userRows.map(mapUserRow);
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
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    
    await db.insert(appState).values({
      id: STATE_ID,
      content: content,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).onConflictDoUpdate({
      target: appState.id,
      set: { content: content, updatedAt: sql`CURRENT_TIMESTAMP` }
    });

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
