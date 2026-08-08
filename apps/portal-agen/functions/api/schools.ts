const jsonHeaders = { "Content-Type": "application/json" };

import { drizzle } from "drizzle-orm/d1";
import { count, like, asc, eq, sql, and } from "drizzle-orm";
import { masterDataSekolah } from "../../src/db/schema";

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const nama = url.searchParams.get("nama");
    const search = url.searchParams.get("search");
    const jenjang = url.searchParams.get("jenjang");

    const rawDb = context.env.DB;
    const db = drizzle(rawDb);

    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "15", 10);
    const offset = (page - 1) * limit;

    if (nama) {
      const result = await db
        .select()
        .from(masterDataSekolah)
        .where(sql`nama = ${nama} COLLATE NOCASE`)
        .get();

      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), {
          headers: jsonHeaders,
        });
      } else {
        return new Response(
          JSON.stringify({ success: false, error: "Sekolah tidak ditemukan" }),
          { status: 404, headers: jsonHeaders },
        );
      }
    }

    const conditions = [];
    if (search) conditions.push(like(masterDataSekolah.nama, `%${search}%`));
    if (jenjang && jenjang !== "Semua") conditions.push(eq(masterDataSekolah.jenjang, jenjang));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResult = await db
      .select({ value: count() })
      .from(masterDataSekolah)
      .where(whereClause);
    const total = totalResult[0].value;

    const result = await db
      .select({
        id: masterDataSekolah.id,
        nama: masterDataSekolah.nama,
        npsn: masterDataSekolah.npsn,
        jenjang: masterDataSekolah.jenjang,
        kecamatan: masterDataSekolah.kecamatan,
        kabupaten: masterDataSekolah.kabupaten,
        provinsi: masterDataSekolah.provinsi,
        status: masterDataSekolah.status,
        alamat: masterDataSekolah.alamat,
        logoUrl: masterDataSekolah.logoUrl,
        gmapUrl: masterDataSekolah.gmapUrl,
        prm: masterDataSekolah.prm,
        pcm: masterDataSekolah.pcm,
        pdm: masterDataSekolah.pdm,
        pwm: masterDataSekolah.pwm,
        lintang: masterDataSekolah.lintang,
        bujur: masterDataSekolah.bujur,
      })
      .from(masterDataSekolah)
      .where(whereClause)
      .orderBy(asc(masterDataSekolah.nama))
      .limit(limit)
      .offset(offset);

    return new Response(
      JSON.stringify({
        success: true,
        data: result || [],
        total,
        page,
        limit,
      }),
      { headers: jsonHeaders },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};

export const onRequestPost = async (context: any) => {
  try {
    const data = await context.request.json();
    const db = drizzle(context.env.DB);
    
    // Add default values if required fields are missing
    const insertData = {
      nama: data.nama || "Sekolah Baru",
      jenjang: data.jenjang || "SD",
      alamat: data.alamat || "",
      kecamatan: data.kecamatan || "",
      kabupaten: data.kabupaten || data.kota || "",
      provinsi: data.provinsi || "",
      npsn: data.npsn || "",
      status: data.status || "Aktif",
      logoUrl: data.logoUrl || "",
      gmapUrl: data.gmapUrl || "",
      prm: data.prm || "",
      pcm: data.pcm || "",
      pdm: data.pdm || "",
      pwm: data.pwm || "",
      lintang: data.lintang || "",
      bujur: data.bujur || "",
    };

    const result = await db.insert(masterDataSekolah).values(insertData).returning();

    return new Response(JSON.stringify({ success: true, data: result[0] }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
};
