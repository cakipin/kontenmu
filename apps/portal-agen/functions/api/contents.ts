const jsonHeaders = { "Content-Type": "application/json" };

import { drizzle } from "drizzle-orm/d1";
import { eq, desc, count, sql } from "drizzle-orm";
import { contents } from "../../src/db/schema";

export const onRequestGet = async (context: any) => {
  try {
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "1000", 10);
    const offset = (page - 1) * limit;

    const [totalResult, result] = await Promise.all([
      db.select({ value: count() }).from(contents),
      db.select()
        .from(contents)
        .orderBy(desc(contents.updatedAt), desc(contents.createdAt))
        .limit(limit)
        .offset(offset)
    ]);

    return new Response(
      JSON.stringify({ 
        success: true,
        contents: result,
        total: totalResult[0].value,
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
