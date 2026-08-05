const fs = require('fs');
let fileContent = fs.readFileSync('apps/portal-agen/src/db/schema.ts', 'utf-8');

fileContent = fileContent.replace(
  "kota: text('kota'),",
  "kota: text('kota'),\n  kecamatan: text('kecamatan'),\n  kabupaten: text('kabupaten'),"
);

fs.writeFileSync('apps/portal-agen/src/db/schema.ts', fileContent);
console.log('patched schema.ts for sekolah');
