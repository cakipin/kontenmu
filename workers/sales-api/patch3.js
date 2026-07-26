const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');
code = code.replace(/await env\.DB\.prepare\(\n          "INSERT INTO users \\(id, username, nama, role_slug, wilayah, status, kelas, nis, email, password, sekolah_id\\) VALUES \\(\\?, \\?, \\?, \\?, \\?, \\?, \\?, \\?, \\?, \\?, \\?\\)"\n        \)\.bind\\(id, username, nama, role, wilayah \\|\\| '', status \\|\\| 'Aktif', kelas \\|\\| null, nis \\|\\| null, email \\|\\| null, password \\|\\| null, sekolah_id \\|\\| null\\)\.run\\(\\);/,
`const result = await env.DB.prepare(
          "INSERT INTO users (id, username, nama, role_slug, wilayah, status, kelas, nis, email, password, sekolah_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(id, username, nama, role, wilayah || '', status || 'Aktif', kelas || null, nis || null, email || null, password || null, sekolah_id || null).run();
        console.log("INSERT RESULT:", JSON.stringify(result));
        if (!result.success) {
          throw new Error(result.error || "Database insert failed silently");
        }`);
fs.writeFileSync('src/index.ts', code);
