const fs = require('fs');

async function cleanup() {
  const response = await fetch('https://sales-api.1912.workers.dev/api/books');
  const json = await response.json();
  const books = json.data;

  console.log(`Fetched ${books.length} books.`);

  for (const book of books) {
    let updated = false;
    let newJudul = book.judul;
    let newMapel = book.mapel;
    let newPeruntukan = book.peruntukan;
    let newKelas = book.kelas;

    // 1. Fix Judul -> Mapel extraction
    if (newJudul && newJudul.includes(' : ')) {
      const parts = newJudul.split(' : ');
      if (parts.length === 2 && parts[1].toLowerCase().includes('holistik')) {
        newMapel = parts[0].trim();
        newJudul = parts[1].trim();
        // capitalize first letter of judul
        newJudul = newJudul.charAt(0).toUpperCase() + newJudul.slice(1);
        updated = true;
      }
    }
    
    // fix some titles like "holistik integratif berbasis aktivitas" which might have mapel missing, but user says "Biologi : holistik..."
    // If Mapel is empty but we extracted it or we can guess it.

    // 2. Fix Peruntukan (Tingkatan Sekolah)
    if (newPeruntukan) {
      const p = newPeruntukan.trim().toLowerCase();
      let cleanP = newPeruntukan;
      if (p.includes('sd') || p.includes('mi')) cleanP = 'SD/MI';
      else if (p.includes('smp') || p.includes('mts')) cleanP = 'SMP/MTS';
      else if (p.includes('sma') || p.includes('ma') || p.includes('smk')) cleanP = 'SMA/MA';
      
      if (cleanP !== newPeruntukan) {
        newPeruntukan = cleanP;
        updated = true;
      }
    }

    // 3. Fix Kelas based on Jilid if missing
    if (!newKelas && book.jilid) {
      const match = book.jilid.match(/jil\.(\d+)/i);
      if (match) {
        const jilNum = parseInt(match[1]);
        if (newPeruntukan === 'SD/MI') newKelas = String(jilNum);
        else if (newPeruntukan === 'SMP/MTS') newKelas = String(jilNum + 6);
        else if (newPeruntukan === 'SMA/MA') newKelas = String(jilNum + 9);
        updated = true;
      }
    }

    // if mapel is still empty, try to get from old mapel if it was empty, wait it's not possible to guess if it's not in title, 
    // unless it's "holistik integratif (IPA)", we can extract IPA
    if (newJudul && newJudul.toLowerCase().includes('(ipa)')) {
        newMapel = 'Ilmu Pengetahuan Alam';
        newJudul = newJudul.replace(/\(ipa\)/i, '').trim();
        updated = true;
    }

    // mapel cleanup
    if (newMapel) {
        let cleanMapel = newMapel.trim();
        // Capitalize first letter of each word
        cleanMapel = cleanMapel.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (cleanMapel !== book.mapel) {
            newMapel = cleanMapel;
            updated = true;
        }
    }


    if (updated) {
      console.log(`Updating book ${book.isbn}...`);
      console.log(`  Judul: ${book.judul} -> ${newJudul}`);
      console.log(`  Mapel: ${book.mapel} -> ${newMapel}`);
      console.log(`  Peruntukan: ${book.peruntukan} -> ${newPeruntukan}`);
      console.log(`  Kelas: ${book.kelas} -> ${newKelas}`);

      const payload = {
        ...book,
        judul: newJudul,
        mapel: newMapel,
        peruntukan: newPeruntukan,
        kelas: newKelas
      };

      try {
        const putRes = await fetch(`https://sales-api.1912.workers.dev/api/books/${book.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!putRes.ok) {
          console.error(`Failed to update ${book.isbn}: ${putRes.statusText}`);
        } else {
            console.log(`Successfully updated ${book.isbn}`);
        }
      } catch (err) {
        console.error(`Error updating ${book.isbn}:`, err);
      }
    }
  }
  
  console.log("Cleanup complete!");
}

cleanup();
