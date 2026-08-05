const fs = require('fs');
const file = '/Users/cakiphin/projects/kontenmu/apps/portal-agen/src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [dbStats, setDbStats] = useState<any>(null);')) {
  // Add state
  content = content.replace('const [masaAktif, setMasaAktif] = useState(\'\');', 
    'const [masaAktif, setMasaAktif] = useState(\'\');\n  const [dbStats, setDbStats] = useState<any>(null);\n\n  useEffect(() => {\n    if (currentRole === \'superadmin\') {\n      const baseUrl = import.meta.env.DEV ? \'\' : (import.meta.env.VITE_API_URL || \'https://sales-api.1912.workers.dev\');\n      fetch(`${baseUrl}/api/stats`).then(res => res.json()).then(res => { if (res.success) setDbStats(res.data); }).catch(console.error);\n    }\n  }, [currentRole]);');
    
  // Replace hardcoded stats
  content = content.replace(/const masterStats = {[\s\S]*?siswaAktif: 210000\n  };/, 
    'const masterStats = dbStats || {\n    totalSekolah: 1500,\n    sekolahAktif: 850,\n    sekolahMuhammadiyah: 420,\n    totalGuru: 12500,\n    guruAktif: 8200,\n    totalSiswa: 350000,\n    siswaAktif: 210000\n  };');

  fs.writeFileSync(file, content);
  console.log("Dashboard.tsx patched!");
} else {
  console.log("Dashboard.tsx already patched");
}
