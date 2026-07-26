const fs = require('fs');
let code = fs.readFileSync('src/index.ts', 'utf8');
code = code.replace(/if \(url\.pathname === "\/api\/users" && request\.method === "POST"\) \{\n      try \{\n        const body = \(await request\.json\(\)\) as any;/,
'if (url.pathname === "/api/users" && request.method === "POST") {\n      try {\n        const body = (await request.json()) as any;\n        console.log("USERS POST BODY:", JSON.stringify(body));');
fs.writeFileSync('src/index.ts', code);
