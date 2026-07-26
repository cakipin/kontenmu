# KontenMu

Platform distribusi konten digital buku pelajaran untuk ekosistem sekolah Muhammadiyah.

**Alur bisnis:** Pusat (Super Admin) → Agen Wilayah → Sekolah → Siswa (MASA)

## Struktur Monorepo

| Path | Deskripsi |
|------|-----------|
| `apps/portal-agen` | Portal multi-role (superadmin, agen, sekolah, siswa) |
| `apps/portal-sekolah` | Portal admin sekolah (inventaris & alokasi) |
| `apps/app-masa` | Aplikasi siswa (belum dikembangkan) |
| `packages/ui` | Komponen UI bersama (GlassCard, Chip, dll.) |
| `packages/api` | Client API bersama |
| `workers/sales-api` | API penjualan gelondongan (Cloudflare D1) |
| `workers/allocation-api` | API inventaris & alokasi siswa |
| `workers/content-api` | API streaming konten (stub) |

## Setup Lokal

### 1. Install dependensi

```sh
npm install
```

### 2. Migrasi database lokal (D1)

```sh
npm run db:migrate
```

### 3. Jalankan API workers (2 terminal)

```sh
npm run dev -w sales-api        # port 8787
npm run dev -w allocation-api   # port 8788
```

### 4. Jalankan frontend

```sh
npm run dev -w portal-agen      # port 5173
npm run dev -w portal-sekolah   # port 5174
```

Vite proxy otomatis meneruskan `/api/*` ke workers lokal.

## Akun Demo

| Portal | Username | Password |
|--------|----------|----------|
| portal-agen | `superadmin`, `agen`, `sekolah`, `siswa` | `123` |
| portal-sekolah | `sekolah` | `123` |

## API Endpoints

### sales-api (`:8787`)

- `GET /api/sekolah` — daftar sekolah
- `GET /api/buku` — katalog buku
- `GET /api/sales` — riwayat penjualan
- `POST /api/sales/bulk` — input penjualan gelondongan

### allocation-api (`:8788`)

- `GET /api/inventory?sekolahId=1` — inventaris lisensi sekolah
- `GET /api/allocations?sekolahId=1` — riwayat alokasi siswa
- `POST /api/allocate` — alokasi lisensi ke siswa (dengan validasi kuota)

## Database

Skema ada di `schema.sql`. Tabel utama:

- `Sekolah`, `Buku`, `Penjualan`, `Alokasi_Siswa`

Seed data sudah termasuk 3 sekolah, 3 buku, dan contoh transaksi.
