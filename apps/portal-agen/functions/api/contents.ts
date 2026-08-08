const jsonHeaders = { "Content-Type": "application/json" };

import { drizzle } from "drizzle-orm/d1";
import { eq, desc, count, sql } from "drizzle-orm";
import { contents } from "../../src/db/schema";

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
    const offset = (page - 1) * limit;

    const result = await rawDb.prepare("SELECT * FROM contents ORDER BY updated_at DESC, created_at DESC LIMIT ? OFFSET ?").bind(limit, offset).all();
    const totalResult = await rawDb.prepare("SELECT COUNT(*) as value FROM contents").first();

    const rowToContent = (row: any) => ({
      id: row.id,
      judul: row.judul,
      kategori: row.kategori,
      mapel: row.mapel,
      target: row.target,
      fileName: row.file_name,
      deskripsi: row.deskripsi ?? undefined,
      thumbnailUrl: row.thumbnail_url ?? undefined,
      status: row.status,
      tanggal: row.tanggal,
      previewMode: row.preview_mode,
      thumbnailKey: row.thumbnail_key,
      protectedPreview: Boolean(row.protected_preview),
      sourceUrl: row.source_url ?? undefined,
      isbn: row.isbn ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        contents: (result.results || []).map(rowToContent),
        total: totalResult?.value || 0,
        page,
        limit
      }),
      { headers: jsonHeaders },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const content = await context.request.json();
    if (!content?.id || !content?.judul || !content?.sourceUrl) {
      return new Response(
        JSON.stringify({ error: "id, judul, dan sourceUrl wajib diisi" }),
        { status: 400, headers: jsonHeaders },
      );
    }
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    
    await db.insert(contents).values({
      id: content.id,
      judul: content.judul,
      kategori: content.kategori,
      mapel: content.mapel ?? "",
      target: content.target ?? "",
      fileName: content.fileName ?? "",
      deskripsi: content.deskripsi ?? "",
      thumbnailUrl: content.thumbnailUrl ?? null,
      status: content.status ?? "Siap Review",
      tanggal: content.tanggal ?? new Date().toISOString().slice(0, 10),
      previewMode: content.previewMode ?? "text",
      thumbnailKey: content.thumbnailKey ?? "text",
      protectedPreview: content.protectedPreview === false ? 0 : 1,
      sourceUrl: content.sourceUrl ?? null,
      isbn: content.isbn ?? null,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).onConflictDoUpdate({
      target: contents.id,
      set: {
        judul: content.judul,
        kategori: content.kategori,
        mapel: content.mapel ?? "",
        target: content.target ?? "",
        fileName: content.fileName ?? "",
        deskripsi: content.deskripsi ?? "",
        thumbnailUrl: content.thumbnailUrl ?? null,
        status: content.status ?? "Siap Review",
        tanggal: content.tanggal ?? new Date().toISOString().slice(0, 10),
        previewMode: content.previewMode ?? "text",
        thumbnailKey: content.thumbnailKey ?? "text",
        protectedPreview: content.protectedPreview === false ? 0 : 1,
        sourceUrl: content.sourceUrl ?? null,
        isbn: content.isbn ?? null,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    return new Response(JSON.stringify({ success: true, content }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = new URL(context.request.url).searchParams.get("id");
    if (!id)
      return new Response(JSON.stringify({ error: "id wajib diisi" }), {
        status: 400,
        headers: jsonHeaders,
      });
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    
    await db.delete(contents).where(eq(contents.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: jsonHeaders,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
