import { getTenantSchoolId } from "./_tenant";

export const onRequestGet = async (context: any) => {
  const url = new URL(context.request.url);
  const username = url.searchParams.get("username") || "siswa1";
  const rawDb = context.env.DB;
  
  try {
    // 1. Get allocations
    const allocRes = await rawDb.prepare("SELECT isbn FROM Alokasi_Siswa WHERE siswa_id = ?").bind(username).all();
    const isbns = allocRes.results.map((r: any) => r.isbn);
    
    // 2. Get user
    const user = await rawDb.prepare("SELECT kelas, wilayah, sekolah_id FROM users WHERE username = ?").bind(username).first();
    
    // 3. Get books
    const books = [];
    for (const isbn of isbns) {
       const b = await rawDb.prepare("SELECT judul, kelas, peruntukan FROM masterBooks WHERE isbn = ?").bind(isbn).first();
       if (b) books.push({ isbn, ...b });
    }
    
    // 4. Get contents mapped to these ISBNs
    const contents = [];
    for (const isbn of isbns) {
       const cRes = await rawDb.prepare("SELECT id, judul, target, kelas, isbn FROM contents WHERE isbn = ?").bind(isbn).all();
       contents.push(...cRes.results);
    }
    
    // 5. Check if they exist even WITHOUT exact ISBN match (just by title substring)
    const possibleContents = await rawDb.prepare("SELECT id, judul, isbn FROM contents WHERE judul LIKE '%Matematika%' OR judul LIKE '%Holistik%' LIMIT 10").all();
    
    return new Response(JSON.stringify({
      username,
      user_data: user,
      allocated_isbns: isbns,
      books_found_in_masterBooks: books,
      contents_found_mapped_to_these_isbns: contents,
      possible_contents_with_wrong_isbn: possibleContents.results
    }, null, 2), { headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
