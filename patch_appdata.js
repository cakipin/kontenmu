const fs = require('fs');
const path = 'apps/portal-agen/src/data/appData.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `
          // Sisipkan hasil dari endpoint mandiri ke dalam state (Decoupled API)
          if (contentsPayload?.success && Array.isArray(contentsPayload.contents)) {
            fullResult.contents = contentsPayload.contents;
            // Simpan ke localStorage agar refresh berikutnya 0 detik
            writeContentsToLocalStorage(fullResult.contents);
          } else if (cachedRemoteData && cachedRemoteData.contents.length > 0) {
            fullResult.contents = cachedRemoteData.contents;
          }
`;

const replacement = `
          // Sisipkan hasil dari endpoint mandiri ke dalam state (Decoupled API)
          if (contentsPayload?.success && Array.isArray(contentsPayload.contents)) {
            // Jangan overwrite dengan array kosong jika fullResult.contents (dari KV) memiliki data!
            if (contentsPayload.contents.length > 0 || fullResult.contents.length === 0) {
              fullResult.contents = contentsPayload.contents;
              // Simpan ke localStorage agar refresh berikutnya 0 detik
              writeContentsToLocalStorage(fullResult.contents);
            }
          } else if (cachedRemoteData && cachedRemoteData.contents.length > 0) {
            fullResult.contents = cachedRemoteData.contents;
          }
`;

if (code.includes('if (contentsPayload?.success && Array.isArray(contentsPayload.contents)) {\\n            fullResult.contents = contentsPayload.contents;')) {
    code = code.replace(target.trim(), replacement.trim());
    fs.writeFileSync(path, code);
    console.log("Patched appData.ts successfully");
} else {
    console.log("Target not found");
}
