import { drizzle } from "drizzle-orm/libsql"; // Just to simulate
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const users = sqliteTable("users", { id: text("id") });

// Mock DB client
const db = drizzle({
  all: () => [{ id: "1" }],
  get: () => ({ id: "1" }),
  run: () => ({ success: true })
} as any);

const qb = db.select().from(users);
console.log(Array.isArray(qb));
console.log(typeof qb.then);
