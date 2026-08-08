import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { masterDataSekolah } from "../../../src/db/schema";

const jsonHeaders = { "Content-Type": "application/json" };

export const onRequestPut = async (context: any) => {
  try {
    const id = context.params.id;
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: jsonHeaders });
    
    const data = await context.request.json();
    const ormDb = drizzle(context.env.DB);
    
    // Clean up undefined properties to avoid Drizzle replacing them with null or erroring if not null allowed
    const updateData: any = {};
    const allowedKeys = ['nama', 'jenjang', 'alamat', 'kota', 'kecamatan', 'kabupaten', 'provinsi', 'npsn', 'status'];
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateData[key] = data[key];
      }
    }

    await ormDb.update(masterDataSekolah).set(updateData).where(eq(masterDataSekolah.id, parseInt(id, 10)));

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};

export const onRequestDelete = async (context: any) => {
  try {
    const id = context.params.id;
    if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: jsonHeaders });
    
    const ormDb = drizzle(context.env.DB);
    await ormDb.delete(masterDataSekolah).where(eq(masterDataSekolah.id, parseInt(id, 10)));

    return new Response(JSON.stringify({ success: true }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
