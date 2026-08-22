# Aturan Kerja AI (AI Working Rules) untuk Proyek KontenMu

Aturan ini **wajib ditaati** oleh agen AI setiap kali berinteraksi atau melakukan tugas di *repository* ini. Aturan ini otomatis dibaca oleh sistem untuk memastikan kualitas dan akurasi pekerjaan.

## 1. Fokus Hanya Pada Bug (NO UNSOLICITED IMPROVEMENTS)
- Jika *user* meminta untuk memperbaiki suatu *bug* atau *error*, fokuslah **HANYA** pada kode yang menjadi akar masalah dari *bug* tersebut.
- **TIDAK BOLEH** melakukan *refactoring*, perombakan kode, atau penambahan fitur (*improvements*) pada baris kode lain di luar *scope* tugas, kecuali diminta secara eksplisit oleh *user*.
- Prinsip utama: *"If it ain't broke, don't fix it."*

## 2. Jangan Halu (NO HALLUCINATIONS)
- Selalu verifikasi asumsi Anda dengan menelusuri langsung *source code* di *workspace* ini. 
- Pahami pergerakan data dari *Frontend* (React) menuju ke *Backend API* (Cloudflare Pages) dan sebaliknya sebelum menarik kesimpulan atas penyebab *error*.
- Jangan menebak-nebak nama variabel atau letak *file*. Gunakan fitur pencarian (seperti `grep`) jika Anda tidak yakin.

## 3. Jangan Mengulang Kesalahan (DO NOT REPEAT MISTAKES)
- **Ingat Arsitektur Utama**: KontenMu adalah aplikasi *Serverless* yang sangat bergantung pada **Cloudflare D1 (SQLite)**.
- **Aturan Cache**: Fitur-fitur transaksional yang vital (seperti Alokasi Siswa, Kelola User, dan Progress Belajar) **TIDAK BOLEH** menggunakan `localStorage` maupun `Cloudflare KV Cache`. Data harus dibaca/tulis secara *real-time* langsung dari/ke *database*.
- **Filter Akses Guru (Strict Override)**: 
  - Jika seorang Guru dialokasikan **Buku Spesifik**, maka guru tersebut HANYA HAK melihat konten dan *progress* belajar siswa untuk buku-buku tersebut saja. Akses luas (berdasarkan Mata Pelajaran/Mapel) akan dianulir sepenuhnya.

## 4. Ingat Workflow Deployment (Production vs Staging)
- Kode yang di-*push* ke cabang (`branch`) `main` **TIDAK** akan langsung tayang di Production (`kontenmu.id`).
- Kode di `main` hanya akan masuk ke Production ketika proses GitHub Action (`deploy-production` via *repository_dispatch*) dijalankan (baik melalui tombol "Push Production" di Dashboard Staging, atau dipicu secara manual via GitHub API).
- Selalu pastikan status *deployment* terakhir (contoh: via `gh run list`) sebelum menyimpulkan bahwa "*bug* masih muncul padahal sudah diperbaiki". Bisa jadi *bug* tersebut muncul karena perbaikannya memang belum di-*deploy*.

## 5. Prosedur Perbaikan (Staging vs Production)
- Lingkungan **Staging** (`staging` branch) adalah *mirroring* (cermin) dari lingkungan **Production** (`main` branch).
- Setiap perbaikan, modifikasi, atau *debugging* **HANYA BOLEH** dilakukan pada lingkungan Staging. 
- Agen harus menguji perbaikan di Staging sampai benar-benar berfungsi sempurna dan tanpa *bug*.
- **HARAM** melakukan perubahan atau perbaikan langsung ke Production. Setelah kodenya benar dan matang di Staging, barulah digabungkan (*merge*) ke cabang `main` lalu didorong (Push) ke Production.

## 6. Smoke Test (VA) Wajib
- Setiap selesai melakukan penambahan fitur/modul baru, perbaikan, maupun *bug fixing*, agen **WAJIB** melakukan *Smoke Test*.
- Pastikan tidak ada sistem lain yang rusak (*regression*) akibat perubahan yang baru saja dilakukan sebelum menyatakan tugas selesai.

## 7. Analisis dan Persetujuan (Approval) Pra-Eksekusi
- Sebelum melakukan penulisan kode untuk perbaikan (*bug fixing*) atau penambahan fitur/modul baru, agen **WAJIB** melakukan analisis menyeluruh dan memberikan laporan (*report*) rencana perbaikan kepada *user*.
- Agen **DILARANG** mengubah kode sebelum *user* memberikan persetujuan (*approval*) secara eksplisit terhadap rencana/laporan tersebut.
