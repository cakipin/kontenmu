const fs = require('fs');

let fileContent = fs.readFileSync('apps/portal-agen/functions/api/contents.ts', 'utf-8');

fileContent = fileContent.replace('export const onRequestGet', `import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, sql } from 'drizzle-orm';
import { contents } from '../../src/db/schema';

export const onRequestGet`);

fileContent = fileContent.replace(/const result = await db\.prepare\(\`SELECT \* FROM contents ORDER BY updated_at DESC, created_at DESC\`\)\.all\(\);\s*return new Response\(JSON\.stringify\(\{ contents: \(result\.results \?\? \[\]\)\.map\(rowToContent\) \}\), \{ headers: jsonHeaders \}\);/, `const ormDb = drizzle(db);
    const result = await ormDb.select().from(contents).orderBy(desc(contents.updatedAt), desc(contents.createdAt));
    return new Response(JSON.stringify({ contents: result.map(rowToContent) }), { headers: jsonHeaders });`);

fileContent = fileContent.replace(/await contentStatement\(db, content\)\.run\(\);/, `const ormDb = drizzle(db);
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
      updatedAt: sql\`CURRENT_TIMESTAMP\`
    };
    await ormDb.insert(contents).values(insertData).onConflictDoUpdate({
      target: contents.id,
      set: insertData
    });`);

fileContent = fileContent.replace(/await db\.prepare\('DELETE FROM contents WHERE id = \?1'\)\.bind\(id\)\.run\(\);/, `const ormDb = drizzle(db);
    await ormDb.delete(contents).where(eq(contents.id, id));`);

fs.writeFileSync('apps/portal-agen/functions/api/contents.ts', fileContent);
console.log('patched contents.ts');
