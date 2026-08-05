import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const appState = sqliteTable("app_state", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const contents = sqliteTable("contents", {
  id: text("id").primaryKey(),
  judul: text("judul").notNull(),
  kategori: text("kategori").notNull(),
  mapel: text("mapel").notNull().default(""),
  target: text("target").notNull().default(""),
  fileName: text("file_name").notNull().default(""),
  deskripsi: text("deskripsi").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  status: text("status").notNull().default("Siap Review"),
  tanggal: text("tanggal").notNull(),
  previewMode: text("preview_mode").notNull(),
  thumbnailKey: text("thumbnail_key").notNull(),
  protectedPreview: integer("protected_preview").notNull().default(1),
  sourceUrl: text("source_url"),
  isbn: text("isbn"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  nama: text("nama").notNull(),
  roleSlug: text("role_slug").notNull(),
  wilayah: text("wilayah"),
  status: text("status").notNull(),
  initial: text("initial"),
  color: text("color"),
  terakhirLogin: text("terakhir_login"),
  kelas: text("kelas"),
  nis: text("nis"),
  newUserSource: text("new_user_source"),
  ssoId: text("sso_id"),
  email: text("email"),
  requestedRole: text("requested_role"),
  suratTugas: text("surat_tugas"),
  masaAktif: text("masa_aktif"),
  sekolahId: integer("sekolah_id"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const masterDataSekolah = sqliteTable("master_data_sekolah", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nama: text("nama").notNull(),
  jenjang: text("jenjang").notNull(),
  alamat: text("alamat"),
  kota: text("kota"),
  kecamatan: text("kecamatan"),
  kabupaten: text("kabupaten"),
  provinsi: text("provinsi"),
  npsn: text("npsn"),
  status: text("status"),
  telepon: text("telepon"),
  email: text("email"),
  website: text("website"),
  kepalaSekolah: text("kepala_sekolah"),
  jumlahSiswa: integer("jumlah_siswa"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
