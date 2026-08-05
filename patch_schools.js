const fs = require('fs');

let fileContent = fs.readFileSync('apps/portal-agen/functions/api/schools.ts', 'utf-8');

fileContent = fileContent.replace('export const onRequestGet', `import { drizzle } from 'drizzle-orm/d1';
import { count, like, asc, eq, sql } from 'drizzle-orm';
import { masterDataSekolah } from '../../src/db/schema';

export const onRequestGet`);

fileContent = fileContent.replace(/const db = context\.env\.DB;[\s\S]*?if \(nama\) \{/, `const rawDb = context.env.DB;
    const db = drizzle(rawDb);

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '15', 10);
    const offset = (page - 1) * limit;

    if (nama) {`);

fileContent = fileContent.replace(/const stmt = await db\.prepare\('SELECT \* FROM master_data_sekolah WHERE nama = \? COLLATE NOCASE'\)\.bind\(nama\);\s*const result = await stmt\.first\(\);/, `const result = await db.select().from(masterDataSekolah).where(sql\`nama = \${nama} COLLATE NOCASE\`).get();`);

fileContent = fileContent.replace(/const countStmt = await db\.prepare\('SELECT COUNT\(\*\) as total FROM master_data_sekolah WHERE nama LIKE \?'\)\.bind\(\`%\$\{search\}%\`\);\s*const countResult = await countStmt\.first\(\);\s*const total = countResult \? countResult\.total : 0;\s*const stmt = await db\.prepare\('SELECT id, nama, npsn, kecamatan, kabupaten, provinsi FROM master_data_sekolah WHERE nama LIKE \? ORDER BY nama ASC LIMIT \? OFFSET \?'\)\.bind\(\`%\$\{search\}%\`, limit, offset\);\s*const result = await stmt\.all\(\);\s*return new Response\(JSON\.stringify\(\{ success: true, data: result\.results \|\| \[\], total, page, limit \}\), \{ headers: jsonHeaders \}\);/, `const totalResult = await db.select({ value: count() }).from(masterDataSekolah).where(like(masterDataSekolah.nama, \`%\${search}%\`));
      const total = totalResult[0].value;
      
      const result = await db.select({
        id: masterDataSekolah.id,
        nama: masterDataSekolah.nama,
        npsn: masterDataSekolah.npsn,
        kecamatan: masterDataSekolah.kecamatan,
        kabupaten: masterDataSekolah.kabupaten,
        provinsi: masterDataSekolah.provinsi
      }).from(masterDataSekolah).where(like(masterDataSekolah.nama, \`%\${search}%\`)).orderBy(asc(masterDataSekolah.nama)).limit(limit).offset(offset);
      
      return new Response(JSON.stringify({ success: true, data: result || [], total, page, limit }), { headers: jsonHeaders });`);

fileContent = fileContent.replace(/const countStmt = await db\.prepare\('SELECT COUNT\(\*\) as total FROM master_data_sekolah'\);\s*const countResult = await countStmt\.first\(\);\s*const total = countResult \? countResult\.total : 0;\s*const stmt = await db\.prepare\('SELECT id, nama, npsn, kecamatan, kabupaten, provinsi FROM master_data_sekolah ORDER BY nama ASC LIMIT \? OFFSET \?'\)\.bind\(limit, offset\);\s*const result = await stmt\.all\(\);\s*return new Response\(JSON\.stringify\(\{ success: true, data: result\.results \|\| \[\], total, page, limit \}\), \{ headers: jsonHeaders \}\);/, `const totalResult = await db.select({ value: count() }).from(masterDataSekolah);
    const total = totalResult[0].value;
    
    const result = await db.select({
      id: masterDataSekolah.id,
      nama: masterDataSekolah.nama,
      npsn: masterDataSekolah.npsn,
      kecamatan: masterDataSekolah.kecamatan,
      kabupaten: masterDataSekolah.kabupaten,
      provinsi: masterDataSekolah.provinsi
    }).from(masterDataSekolah).orderBy(asc(masterDataSekolah.nama)).limit(limit).offset(offset);

    return new Response(JSON.stringify({ success: true, data: result || [], total, page, limit }), { headers: jsonHeaders });`);

fs.writeFileSync('apps/portal-agen/functions/api/schools.ts', fileContent);
console.log('patched schools.ts');
