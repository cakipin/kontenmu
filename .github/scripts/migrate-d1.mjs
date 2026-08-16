import { execFileSync } from "node:child_process";

const database = process.argv[2];
if (!database) throw new Error("Database name is required");

const requiredUserColumns = {
  npsn: "TEXT",
  nuptk: "TEXT",
  nip: "TEXT",
  password: "TEXT",
  sekolah_id: "TEXT",
  email: "TEXT",
  kelas: "TEXT",
  nis: "TEXT",
  new_user_source: "TEXT",
  sso_id: "TEXT",
  requested_role: "TEXT",
  surat_tugas: "TEXT",
  masa_aktif: "TEXT",
  picture: "TEXT",
};

function execute(sql) {
  const output = execFileSync(
    "npx",
    ["wrangler", "d1", "execute", database, "--remote", "--json", "--command", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const parsed = JSON.parse(output);
  const result = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!result?.success) throw new Error(`D1 command failed: ${sql}`);
  return result.results || [];
}

function userColumns() {
  return new Set(execute("PRAGMA table_info(users);").map((column) => column.name));
}

const before = userColumns();
for (const [name, type] of Object.entries(requiredUserColumns)) {
  if (!before.has(name)) {
    console.log(`Adding users.${name}`);
    execute(`ALTER TABLE users ADD COLUMN ${name} ${type};`);
  }
}


execute("CREATE TABLE IF NOT EXISTS app_state (id TEXT PRIMARY KEY, content TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP); INSERT OR IGNORE INTO app_state (id, content) VALUES ('portal-agen:simulation:v1', '{}');");
execute("CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, sekolah_id INTEGER NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);");

const after = userColumns();
const missing = Object.keys(requiredUserColumns).filter((name) => !after.has(name));
if (missing.length) throw new Error(`Migration verification failed; missing columns: ${missing.join(", ")}`);

const appStateTable = execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_state';");
if (!appStateTable.length) throw new Error("Migration verification failed; app_state table is missing");

console.log(`Migration verified for ${database}`);
