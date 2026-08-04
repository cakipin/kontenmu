const jsonHeaders = { 'Content-Type': 'application/json' };

const CONTENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,
    mapel TEXT NOT NULL DEFAULT '',
    target TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    deskripsi TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'Siap Review',
    tanggal TEXT NOT NULL,
    preview_mode TEXT NOT NULL,
    thumbnail_key TEXT NOT NULL,
    protected_preview INTEGER NOT NULL DEFAULT 1,
    source_url TEXT,
    isbn TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

async function ensureTable(db: any) {
  await db.prepare(CONTENTS_TABLE).run();
  try {
    await db.prepare("ALTER TABLE contents ADD COLUMN deskripsi TEXT NOT NULL DEFAULT ''").run();
  } catch {}
  try {
    await db.prepare("ALTER TABLE contents ADD COLUMN isbn TEXT").run();
  } catch {}
}

function rowToContent(row: any) {
  return {
    id: row.id,
    judul: row.judul,
    kategori: row.kategori,
    mapel: row.mapel,
    target: row.target,
    fileName: row.fileName,
    deskripsi: row.deskripsi ?? undefined,
    thumbnailUrl: row.thumbnailUrl ?? undefined,
    status: row.status,
    tanggal: row.tanggal,
    previewMode: row.previewMode,
    thumbnailKey: row.thumbnailKey,
    protectedPreview: Boolean(row.protectedPreview),
    sourceUrl: row.sourceUrl ?? undefined,
    isbn: row.isbn ?? undefined,
  };
}

function contentStatement(db: any, content: any) {
  return db.prepare(`
    INSERT INTO contents (
      id, judul, kategori, mapel, target, file_name, deskripsi, thumbnail_url, status,
      tanggal, preview_mode, thumbnail_key, protected_preview, source_url, isbn, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      judul = excluded.judul,
      kategori = excluded.kategori,
      mapel = excluded.mapel,
      target = excluded.target,
      file_name = excluded.file_name,
      deskripsi = excluded.deskripsi,
      thumbnail_url = excluded.thumbnail_url,
      status = excluded.status,
      tanggal = excluded.tanggal,
      preview_mode = excluded.preview_mode,
      thumbnail_key = excluded.thumbnail_key,
      protected_preview = excluded.protected_preview,
      source_url = excluded.source_url,
      isbn = excluded.isbn,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    content.id,
    content.judul,
    content.kategori,
    content.mapel ?? '',
    content.target ?? '',
    content.fileName ?? '',
    content.deskripsi ?? '',
    content.thumbnailUrl ?? null,
    content.status ?? 'Siap Review',
    content.tanggal ?? new Date().toISOString().slice(0, 10),
    content.previewMode ?? 'text',
    content.thumbnailKey ?? 'text',
    content.protectedPreview === false ? 0 : 1,
    content.sourceUrl ?? null,
    content.isbn ?? null,
  );
}

import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, sql } from 'drizzle-orm';
import { contents } from '../../src/db/schema';

export const onRequestGet = async (context: any) => {
  try {
    const db = context.env.DB;
    await ensureTable(db);
    const ormDb = drizzle(db);
    const result = await ormDb.select().from(contents).orderBy(desc(contents.updatedAt), desc(contents.createdAt));
    return new Response(JSON.stringify({ contents: result.map(rowToContent) }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const content = await context.request.json();
    if (!content?.id || !content?.judul || !content?.sourceUrl) {
      return new Response(JSON.stringify({ error: 'id, judul, dan sourceUrl wajib diisi' }), { status: 400, headers: jsonHeaders });
    }
    const db = context.env.DB;
    await ensureTable(db);
    const ormDb = drizzle(db);
    const insertData = {
      id: content.id,
      judul: content.judul,
      kategori: content.kategori,
      mapel: content.mapel ?? '',
      target: content.target ?? '',
      fileName: content.fileName ?? '',
      deskripsi: content.deskripsi ?? '',
      thumbnailUrl: content.thumbnailUrl ?? null,
      status: content.status ?? 'Siap Review',
      tanggal: content.tanggal ?? new Date().toISOString().slice(0, 10),
      previewMode: content.previewMode ?? 'text',
      thumbnailKey: content.thumbnailKey ?? 'text',
      protectedPreview: content.protectedPreview === false ? 0 : 1,
      sourceUrl: content.sourceUrl ?? null,
      isbn: content.isbn ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`
    };
    await ormDb.insert(contents).values(insertData).onConflictDoUpdate({
      target: contents.id,
      set: insertData
    });
    return new Response(JSON.stringify({ success: true, content }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = new URL(context.request.url).searchParams.get('id');
    if (!id) return new Response(JSON.stringify({ error: 'id wajib diisi' }), { status: 400, headers: jsonHeaders });
    const db = context.env.DB;
    await ensureTable(db);
    const ormDb = drizzle(db);
    await ormDb.delete(contents).where(eq(contents.id, id));
    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
