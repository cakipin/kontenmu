-- D1 Database Schema for KontenMu

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    role_slug TEXT NOT NULL,
    wilayah TEXT,
    status TEXT NOT NULL DEFAULT 'Aktif',
    initial TEXT,
    color TEXT,
    terakhir_login TEXT,
    kelas TEXT,
    nis TEXT,
    new_user_source TEXT,
    password TEXT,
    sekolah_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS app_state;
CREATE TABLE app_state (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default Super Admin
INSERT INTO users (
    id, username, nama, role_slug, wilayah, status, initial, color
) VALUES (
    'USR-SA-001', 'superadmin', 'Super Admin Sistem', 'superadmin', 'Pusat', 'Aktif', 'SA', '#2563eb'
);
