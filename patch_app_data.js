const fs = require('fs');

let content = fs.readFileSync('apps/portal-agen/functions/api/app-data.ts', 'utf-8');

content = content.replace("export const onRequestGet", `
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, sql } from 'drizzle-orm';
import { appState, contents, users } from '../../src/db/schema';

export const onRequestGet`);

content = content.replace(/const db = context\.env\.DB;\s*const row = await db\s*\.prepare\('SELECT content FROM app_state WHERE id = \?1'\)\s*\.bind\(STATE_ID\)\s*\.first\(\);/, `const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    const row = await db.select({ content: appState.content }).from(appState).where(eq(appState.id, STATE_ID)).get();`);

content = content.replace(/const contentRows = await db\.prepare\('SELECT \* FROM contents ORDER BY updated_at DESC, created_at DESC'\)\.all\(\);\s*data\.contents = \(contentRows\.results \?\? \[\]\)\.map\(\(item: any\) => \(\{/, `const contentRows = await db.select().from(contents).orderBy(desc(contents.updatedAt), desc(contents.createdAt));
      data.contents = contentRows.map((item: any) => ({`);

content = content.replace(/const userRows = await db\s*\.prepare\([\s\S]*?\)\s*\.all\(\);\s*if \(userRows\.results\?\.length\) \{\s*data\.users = userRows\.results\.map\(mapUserRow\);\s*\}/, `const userRows = await db
      .select({
        id: users.id, username: users.username, nama: users.nama, role_slug: users.roleSlug, wilayah: users.wilayah, status: users.status, initial: users.initial, color: users.color,
        terakhir_login: users.terakhirLogin, kelas: users.kelas, nis: users.nis, new_user_source: users.newUserSource, sso_id: users.ssoId, email: users.email, sekolah_id: users.sekolahId
      })
      .from(users).orderBy(desc(users.updatedAt), desc(users.createdAt));

    if (userRows.length > 0) {
      data.users = userRows.map(mapUserRow);
    }`);

content = content.replace(/const db = context\.env\.DB;\s*await db\.prepare\([\s\S]*?\)\.bind\(STATE_ID, content\)\.run\(\);/, `const rawDb = context.env.DB;
    const db = drizzle(rawDb);
    
    await db.insert(appState).values({
      id: STATE_ID,
      content: content,
      updatedAt: sql\`CURRENT_TIMESTAMP\`
    }).onConflictDoUpdate({
      target: appState.id,
      set: { content: content, updatedAt: sql\`CURRENT_TIMESTAMP\` }
    });`);

fs.writeFileSync('apps/portal-agen/functions/api/app-data.ts', content);
console.log('patched app-data.ts');
