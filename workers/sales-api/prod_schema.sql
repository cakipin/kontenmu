
CREATE TABLE books (
    id TEXT PRIMARY KEY,
    isbn TEXT,
    isbn_asli TEXT,
    jilid TEXT,
    judul TEXT,
    judul_inggris TEXT,
    peruntukan TEXT,
    terbit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, cover_url TEXT, kelas TEXT, mapel TEXT);
CREATE TABLE app_state (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  role_slug TEXT NOT NULL DEFAULT 'pending',
  wilayah TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Aktif',
  initial TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#64748b',
  terakhir_login TEXT NOT NULL DEFAULT '',
  kelas TEXT,
  nis TEXT,
  npsn TEXT,
  nuptk TEXT,
  nip TEXT,
  new_user_source TEXT,
  sekolah_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, sso_id TEXT, email TEXT, requested_role TEXT, surat_tugas TEXT, masa_aktif TEXT, password TEXT, picture TEXT,
  FOREIGN KEY (role_slug) REFERENCES roles(slug)
);
CREATE TABLE master_data_sekolah (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  npsn TEXT,
  bentuk_pendidikan TEXT,
  status_sekolah TEXT,
  alamat_jalan TEXT,
  rt TEXT,
  rw TEXT,
  nama_dusun TEXT,
  desa_kelurahan TEXT,
  kecamatan TEXT,
  kabupaten TEXT,
  provinsi TEXT,
  lintang TEXT,
  bujur TEXT,
  nomor_telepon TEXT,
  nomor_fax TEXT,
  email TEXT,
  website TEXT,
  akreditasi TEXT,
  pd_total INTEGER,
  ptk_total INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE contents (
    id TEXT PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori TEXT NOT NULL,
    mapel TEXT NOT NULL DEFAULT '',
    target TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'Siap Review',
    tanggal TEXT NOT NULL,
    preview_mode TEXT NOT NULL,
    thumbnail_key TEXT NOT NULL,
    protected_preview INTEGER NOT NULL DEFAULT 1,
    source_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  , deskripsi TEXT NOT NULL DEFAULT '', isbn TEXT);
