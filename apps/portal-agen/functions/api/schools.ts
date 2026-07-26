const jsonHeaders = { 'Content-Type': 'application/json' };

export const onRequestGet = async (context: any) => {
  try {
    const url = new URL(context.request.url);
    const nama = url.searchParams.get('nama');
    const search = url.searchParams.get('search');
    
    const db = context.env.DB;

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '15', 10);
    const offset = (page - 1) * limit;

    if (nama) {
      const stmt = await db.prepare('SELECT * FROM master_data_sekolah WHERE nama = ? COLLATE NOCASE').bind(nama);
      const result = await stmt.first();
      
      if (result) {
        return new Response(JSON.stringify({ success: true, data: result }), { headers: jsonHeaders });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Sekolah tidak ditemukan' }), { status: 404, headers: jsonHeaders });
      }
    } 
    
    if (search) {
      // Pagination for search
      const countStmt = await db.prepare('SELECT COUNT(*) as total FROM master_data_sekolah WHERE nama LIKE ?').bind(`%${search}%`);
      const countResult = await countStmt.first();
      const total = countResult ? countResult.total : 0;
      
      const stmt = await db.prepare('SELECT id, nama, npsn, kecamatan, kabupaten, provinsi FROM master_data_sekolah WHERE nama LIKE ? ORDER BY nama ASC LIMIT ? OFFSET ?').bind(`%${search}%`, limit, offset);
      const result = await stmt.all();
      return new Response(JSON.stringify({ success: true, data: result.results || [], total, page, limit }), { headers: jsonHeaders });
    }

    // Default: List all schools with pagination
    const countStmt = await db.prepare('SELECT COUNT(*) as total FROM master_data_sekolah');
    const countResult = await countStmt.first();
    const total = countResult ? countResult.total : 0;
    
    const stmt = await db.prepare('SELECT id, nama, npsn, kecamatan, kabupaten, provinsi FROM master_data_sekolah ORDER BY nama ASC LIMIT ? OFFSET ?').bind(limit, offset);
    const result = await stmt.all();

    return new Response(JSON.stringify({ success: true, data: result.results || [], total, page, limit }), { headers: jsonHeaders });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
};
