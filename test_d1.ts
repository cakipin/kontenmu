import { drizzle } from "drizzle-orm/libsql";
import { count } from "drizzle-orm";
import { contents } from "./apps/portal-agen/src/db/schema";
// just type checking
const test = async () => {
    const db: any = {};
    const res = await db.select().from(contents);
}
