# Rekap Project — Survey Siswa (Dari Awal Sampai Akhir)

Dokumen ini merangkum tahapan project dari inisiasi sampai project berjalan di production, sekaligus jadi checklist latihan DevOps end-to-end. Referensi kebutuhan fitur ada di [PRD.md](./PRD.md).

## Fase 0 — Inisiasi & Perencanaan
- [x] Tentukan tujuan & scope project → PRD.md
- [x] Tentukan tech stack: Node.js/Express + React + PostgreSQL, Docker, GitHub Actions
- [x] Setup repo Git (init lokal; remote GitHub & branch strategy menyusul)
- [x] Setup struktur folder project (mono-repo: `/api`, `/web`, `/infra`)

## Fase 1 — Desain
- [ ] Desain skema database (ERD) berdasarkan entities di PRD §9
- [ ] Desain API contract (endpoint list: auth, users, surveys, questions, responses, reports)
- [ ] Wireframe halaman utama: login, dashboard admin, form isi survey (siswa), dashboard hasil (guru)

## Fase 2 — Development Backend (API)
- [ ] Setup project Express + struktur folder (routes/controllers/services/models)
- [ ] Koneksi PostgreSQL (migration tool: Knex/Prisma)
- [ ] Auth (register/login, JWT, middleware role-based access)
- [ ] CRUD User (Admin only)
- [ ] CRUD Survey & Question (Admin only)
- [ ] Endpoint submit Response/Answer (Siswa)
- [ ] Endpoint laporan/agregasi hasil (Admin & Guru, dengan aturan anonimitas)
- [ ] Unit test untuk service/business logic penting

## Fase 3 — Development Frontend (Web)
- [ ] Setup project React (routing, state management, auth guard per role)
- [ ] Halaman login
- [ ] Dashboard Admin: kelola user, kelola survey, lihat laporan
- [ ] Halaman isi survey untuk Siswa
- [ ] Dashboard hasil evaluasi untuk Guru
- [ ] Integrasi ke API backend

## Fase 4 — Containerization
- [ ] Dockerfile untuk API
- [ ] Dockerfile untuk Web (build + serve, misal via nginx)
- [ ] `docker-compose.yml` untuk local dev (web + api + db)
- [ ] `.env.example` untuk konfigurasi (DB credentials, JWT secret, dll — tidak commit secret asli)

## Fase 5 — CI (Continuous Integration)
- [ ] GitHub Actions: workflow lint & test otomatis saat PR dibuka
- [ ] GitHub Actions: build Docker image saat merge ke `main`
- [ ] Push image ke container registry (GHCR/Docker Hub)

## Fase 6 — CD (Continuous Deployment)
- [ ] Pilih target deployment (VPS sederhana / cloud provider — didiskusikan saat tiba di fase ini)
- [ ] Workflow deploy otomatis dari GitHub Actions ke target
- [ ] Setup environment variables/secrets di target deployment (GitHub Secrets)
- [ ] Health check & rollback strategy sederhana

## Fase 7 — Testing & QA
- [ ] Testing manual end-to-end tiap role (Siswa, Guru, Admin)
- [ ] Uji beban ringan (simulasi banyak submission bersamaan)
- [ ] Uji keamanan dasar (input validation, akses tanpa auth, dsb)

## Fase 8 — Monitoring & Maintenance
- [ ] Setup logging aplikasi (misal Winston/Pino di backend)
- [ ] Setup monitoring dasar (uptime check, resource usage container)
- [ ] Dokumentasi runbook (cara restart service, cara backup DB)
- [ ] Backup rutin database

## Fase 9 — Go-Live & Evaluasi
- [ ] Rilis ke pengguna nyata (siswa/guru/admin sekolah)
- [ ] Kumpulkan feedback pengguna awal
- [ ] Evaluasi metrik keberhasilan (lihat PRD §10)
- [ ] Backlog perbaikan/fitur lanjutan (v2)

---

**Status saat ini:** Fase 0 selesai — PRD, rekap, repo Git lokal, dan struktur folder (`api/`, `web/`, `infra/`) sudah dibuat.

**Langkah berikutnya yang disarankan:** buat remote GitHub & push, lalu lanjut ke desain skema database (Fase 1).
