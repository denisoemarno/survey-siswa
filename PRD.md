# PRD — Aplikasi Survey Siswa

## 1. Latar Belakang
Sekolah membutuhkan satu platform terpusat untuk mengumpulkan umpan balik dari siswa, mencakup:
- Kepuasan siswa terhadap fasilitas & layanan sekolah
- Evaluasi kualitas mengajar guru per mata pelajaran
- Evaluasi kegiatan/acara sekolah (seminar, ekskul, event, dll)

Saat ini proses survey (jika ada) dilakukan manual/terpisah-pisah, sulit direkap dan dianalisis. Project ini juga menjadi sarana latihan praktik DevOps end-to-end (containerization, CI/CD, deployment) bagi developer.

## 2. Tujuan
- Menyediakan satu platform survey yang bisa dipakai untuk 3 jenis survey (kepuasan, evaluasi guru, evaluasi kegiatan)
- Mempermudah Admin membuat, mendistribusikan, dan menganalisis hasil survey
- Memberi Guru visibilitas atas hasil evaluasi dirinya sendiri
- Menjadi studi kasus latihan DevOps: containerize, CI/CD pipeline, deployment otomatis

## 3. Target Pengguna & Roles

| Role | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Siswa** | Peserta didik yang mengisi survey | Login, lihat daftar survey aktif untuknya, isi & submit survey, lihat riwayat pengisian |
| **Guru** | Pengajar yang dievaluasi | Login, lihat hasil evaluasi untuk dirinya (agregat, anonim), tidak bisa lihat jawaban per-siswa |
| **Admin** | Pengelola sistem (tata usaha/kesiswaan) | Kelola user (siswa/guru), buat & atur survey, tentukan target penerima, lihat & export semua laporan/hasil, kelola periode survey |

## 4. Ruang Lingkup Fitur (In Scope)

### 4.1 Manajemen User
- CRUD data siswa & guru (oleh Admin), termasuk import massal (CSV)
- Autentikasi login (email/username + password), role-based access control

### 4.2 Manajemen Survey (Admin)
- Buat survey baru dengan tipe: Kepuasan Sekolah / Evaluasi Guru / Evaluasi Kegiatan
- Builder pertanyaan: pilihan ganda, skala likert (1-5), teks bebas (essay singkat)
- Atur target responden (per kelas, per angkatan, atau semua siswa)
- Atur periode aktif survey (tanggal mulai - selesai)
- Publish / tutup survey

### 4.3 Pengisian Survey (Siswa)
- Lihat daftar survey yang wajib/bisa diisi
- Isi & submit jawaban (satu kali submit per survey, kecuali diatur ulang oleh Admin)
- Indikator progress & konfirmasi setelah submit

### 4.4 Laporan & Analitik
- Admin: dashboard rekap hasil per survey (rata-rata skor, distribusi jawaban, tingkat partisipasi), export ke Excel/PDF
- Guru: dashboard hasil evaluasi dirinya (agregat & anonim, tidak menampilkan identitas siswa pengisi)
- Filter laporan berdasarkan kelas/angkatan/periode

### 4.5 Notifikasi
- Notifikasi in-app/email ke siswa saat survey baru dipublish
- Reminder H-1 sebelum survey ditutup

## 5. Di Luar Ruang Lingkup (Out of Scope — versi awal)
- Aplikasi mobile native (fokus web responsive dulu)
- Analisis sentimen otomatis (NLP) untuk jawaban essay
- Integrasi dengan sistem akademik/SIS sekolah lain
- Multi-sekolah/multi-tenant (versi awal: single sekolah)

## 6. Kebutuhan Non-Fungsional
- **Keamanan**: password di-hash (bcrypt), proteksi terhadap SQL injection/XSS, hasil survey guru dijaga anonimitasnya
- **Ketersediaan**: target uptime 99% (mengingat ini juga proyek belajar, bukan SLA produksi kritikal)
- **Performa**: dashboard laporan tetap responsif untuk ±1000 siswa & ratusan submission
- **Auditability**: log aktivitas Admin (buat/ubah/hapus survey) untuk kebutuhan audit sederhana
- **Portabilitas**: seluruh service berjalan dalam container Docker, mudah dijalankan di lingkungan berbeda (local, staging, cloud)

## 7. Tech Stack
- **Frontend**: React (SPA)
- **Backend**: Node.js + Express (REST API)
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions (lint, test, build image, push, deploy)
- **Deployment target**: bebas dipilih saat fase deployment (VPS/cloud) — dibahas di dokumen rekap

## 8. Arsitektur Tingkat Tinggi
```
[React SPA] --REST/JSON--> [Express API] --SQL--> [PostgreSQL]
                                |
                          [Auth/JWT middleware]
                                |
                     [Docker Compose: web, api, db]
                                |
                   [GitHub Actions CI/CD Pipeline]
                                |
                        [Deployment target]
```

## 9. Model Data Awal (Entities)
- **User** (id, nama, email, password_hash, role[siswa/guru/admin], kelas/angkatan, mapel_diampu[untuk guru])
- **Survey** (id, judul, tipe[kepuasan/evaluasi_guru/evaluasi_kegiatan], target_kelas/angkatan, guru_id[nullable], periode_mulai, periode_selesai, status)
- **Question** (id, survey_id, teks_pertanyaan, tipe_jawaban[pilihan_ganda/skala/essay], opsi[jsonb])
- **Response** (id, survey_id, siswa_id, submitted_at)
- **Answer** (id, response_id, question_id, jawaban)

## 10. Metrik Keberhasilan
- ≥80% siswa target mengisi survey dalam periode aktif (tingkat partisipasi)
- Waktu Admin membuat survey baru < 10 menit
- Pipeline CI/CD berjalan (build-test-deploy) tanpa intervensi manual
- Zero insiden kebocoran identitas siswa pada laporan evaluasi guru

## 11. Asumsi & Risiko
- **Asumsi**: jumlah pengguna dalam skala sekolah tunggal (ratusan-ribuan siswa), bukan skala nasional
- **Risiko**: anonimitas jawaban guru harus dijaga ketat agar guru tidak bisa menekan siswa — mitigasi: agregasi minimum N responden sebelum data ditampilkan
- **Risiko**: karena project juga untuk belajar DevOps, kompleksitas infra bisa melebihi kebutuhan aplikasi — mitigasi: mulai dari Docker Compose sederhana sebelum orkestrasi lanjutan (K8s dsb, jika diperlukan nanti)
