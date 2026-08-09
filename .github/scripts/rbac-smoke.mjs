import fs from "node:fs";
import { sign } from "@tsndr/cloudflare-worker-jwt";

const baseUrl = process.argv[2];
const varsFile = process.argv[3];
if (!baseUrl || !varsFile) {
  throw new Error("Usage: node rbac-smoke.mjs <base-url> <vars-file>");
}

const vars = Object.fromEntries(
  fs
    .readFileSync(varsFile, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      return [key, value];
    }),
);

const jwtSecret = process.env.RBAC_TEST_JWT_SECRET || vars.JWT_SECRET;
if (!jwtSecret) throw new Error("JWT_SECRET is missing from vars file");

async function token(role) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    { sub: `rbac-${role}`, username: `rbac-${role}`, role, sekolahId: "1", iat: now, exp: now + 300 },
    jwtSecret,
  );
}

async function request(path, { method = "GET", role, body } = {}) {
  const headers = {};
  if (role) headers.Authorization = `Bearer ${await token(role)}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function expectStatus(name, response, expected) {
  if (response.status !== expected) {
    throw new Error(`${name}: expected ${expected}, received ${response.status}`);
  }
  console.log(`OK ${name}`);
}

async function expectPolicyPass(name, response) {
  if ([401, 403, 405].includes(response.status)) {
    throw new Error(`${name}: policy unexpectedly returned ${response.status}`);
  }
  console.log(`OK ${name} (handler status ${response.status})`);
}

await expectPolicyPass("public app-data lite", await request("/api/app-data?lite=true"));
await expectStatus("protected contents without session", await request("/api/contents"), 401);
await expectStatus("unknown API default deny", await request("/api/not-registered"), 403);
await expectStatus("unsupported method", await request("/api/contents", { method: "PUT" }), 405);
await expectStatus(
  "student cannot create content",
  await request("/api/contents", { method: "POST", role: "siswa", body: {} }),
  403,
);
await expectPolicyPass(
  "uploader can reach content validation",
  await request("/api/contents", { method: "POST", role: "uploader", body: {} }),
);
await expectStatus("student cannot list users", await request("/api/users", { role: "siswa" }), 403);
await expectPolicyPass("school can reach user list", await request("/api/users", { role: "sekolah" }));
await expectPolicyPass("superadmin can reach user list", await request("/api/users", { role: "superadmin" }));
