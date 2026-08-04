const jsonHeaders = { 'Content-Type': 'application/json' };

import { drizzle } from 'drizzle-orm/d1';
import { count, like, asc, eq, sql } from 'drizzle-orm';
import { masterDataSekolah } from '../../src/db/schema';

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const nama = url.searchParams.get('nama');
    const search = url.searchParams.get('search');
    
    const rawDb = context.env.DB;
    const db = drizzle(rawDb);

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '15', 10);
    const offset = (page - 1) * limit;

    if (nama) {
      const result = await db.select().from(masterDataSekolah).where(sql`nama = ${nama} COLLATE NOCASE`).get();
      
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), { headers: jsonHeaders });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Sekolah tidak ditemukan' }), { status: 404, headers: jsonHeaders });
      }
    } 
    
    if (search) {
      // Pagination for search
      const totalResult = await db.select({ value: count() }).from(masterDataSekolah).where(like(masterDataSekolah.nama, `%${search}%`));
      const total = totalResult[0].value;
      
      const result = await db.select({
        id: masterDataSekolah.id,
        nama: masterDataSekolah.nama,
        npsn: masterDataSekolah.npsn,
        kecamatan: masterDataSekolah.kecamatan,
        kabupaten: masterDataSekolah.kabupaten,
        provinsi: masterDataSekolah.provinsi
      }).from(masterDataSekolah).where(like(masterDataSekolah.nama, `%${search}%`)).orderBy(asc(masterDataSekolah.nama)).limit(limit).offset(offset);
      
      return new Response(JSON.stringify({ success: true, data: result || [], total, page, limit }), { headers: jsonHeaders });
    }

    // Default: List all schools with pagination
    const totalResult = await db.select({ value: count() }).from(masterDataSekolah);
    const total = totalResult[0].value;
    
    const result = await db.select({
      id: masterDataSekolah.id,
      nama: masterDataSekolah.nama,
      npsn: masterDataSekolah.npsn,
      kecamatan: masterDataSekolah.kecamatan,
      kabupaten: masterDataSekolah.kabupaten,
      provinsi: masterDataSekolah.provinsi
    }).from(masterDataSekolah).orderBy(asc(masterDataSekolah.nama)).limit(limit).offset(offset);

    return new Response(JSON.stringify({ success: true, data: result || [], total, page, limit }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
