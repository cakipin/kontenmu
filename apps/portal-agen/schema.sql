CREATE TABLE IF NOT EXISTS page_data (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
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
  new_user_source TEXT,
  sekolah_id INTEGER,
  sso_id TEXT,
  email TEXT,
  requested_role TEXT,
  surat_tugas TEXT,
  masa_aktif TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_slug) REFERENCES roles(slug)
);

CREATE INDEX IF NOT EXISTS idx_users_role_slug ON users(role_slug);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);

INSERT OR IGNORE INTO roles (slug, name) VALUES
  ('superadmin', 'Super Admin'),
  ('agen', 'Agen Wilayah'),
  ('sekolah', 'Admin Sekolah'),
  ('siswa', 'Siswa (MASA)'),
  ('uploader', 'Uploader Konten'),
  ('pending', 'Menunggu Persetujuan');

CREATE TABLE IF NOT EXISTS master_data_sekolah (
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

CREATE INDEX IF NOT EXISTS idx_master_data_sekolah_npsn ON master_data_sekolah(npsn);
CREATE INDEX IF NOT EXISTS idx_master_data_sekolah_nama ON master_data_sekolah(nama);

CREATE TABLE IF NOT EXISTS contents (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  kategori TEXT NOT NULL,
  mapel TEXT NOT NULL DEFAULT '',
  bab INTEGER,
  target TEXT NOT NULL DEFAULT '',
  kelas TEXT,
  file_name TEXT NOT NULL DEFAULT '',
  deskripsi TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'Siap Review',
  tanggal TEXT NOT NULL,
  preview_mode TEXT NOT NULL,
  thumbnail_key TEXT NOT NULL,
  protected_preview INTEGER NOT NULL DEFAULT 1,
  source_url TEXT,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contents_updated_at ON contents(updated_at);
