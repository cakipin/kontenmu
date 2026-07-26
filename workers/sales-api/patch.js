const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');
code = code.replace(/await env\.DB\.prepare\(/, 'console.log("INSERTING BODY:", JSON.stringify(body));\n        await env.DB.prepare(');
fs.writeFileSync('src/index.ts', code);
