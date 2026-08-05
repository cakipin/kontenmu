import { drizzle } from "drizzle-orm/d1";
import { count } from "drizzle-orm";
import { contents } from "./apps/portal-agen/src/db/schema";
export default {
  async fetch(request: Request, env: any) {
    const db = drizzle(env.DB);
    try {
      const q = db.select({ value: count() }).from(contents);
      const res = await q;
      return new Response(JSON.stringify(res));
    } catch(e: any) {
      return new Response(e.message, { status: 500 });
    }
  }
}
