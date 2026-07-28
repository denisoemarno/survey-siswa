# Rekap Project — Survey Siswa (Dari Awal Sampai Akhir)

Dokumen ini merangkum tahapan project dari inisiasi sampai project berjalan di production, sekaligus jadi checklist latihan DevOps end-to-end. Referensi kebutuhan fitur ada di [PRD.md](./PRD.md).

## Fase 0 — Inisiasi & Perencanaan
- [x] Tentukan tujuan & scope project → PRD.md
- [x] Tentukan tech stack: Node.js/Express + React + PostgreSQL, Docker, GitHub Actions
- [x] Setup repo Git (init lokal; remote GitHub & branch strategy menyusul)
- [x] Setup struktur folder project (mono-repo: `/api`, `/web`, `/infra`)

## Fase 1 — Desain
- [x] Desain skema database (ERD) berdasarkan entities di PRD §9 → [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)
- [x] Desain API contract (endpoint list: auth, users, surveys, questions, responses, reports) → [docs/API_CONTRACT.md](./docs/API_CONTRACT.md)
- [ ] Wireframe halaman utama: login, dashboard admin, form isi survey (siswa), dashboard hasil (guru)

## Fase 2 — Development Backend (API)
- [x] Setup project Express + struktur folder (routes/controllers/services/models) → `api/src`, health-check `GET /api/health` + test
- [x] Koneksi PostgreSQL (migration tool: Knex/Prisma) → PostgreSQL via `docker-compose.yml`, Knex migration `api/src/migrations`, `GET /api/health` cek koneksi DB
- [x] Auth (register/login, JWT, middleware role-based access) → `POST /api/auth/login`, `GET /api/auth/me`, middleware `authenticate`/`authorize`, seed admin awal, 10 test lulus
- [x] CRUD User (Admin only) → `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`, `POST /api/users/import` (CSV), 26 test lulus
- [x] CRUD Survey & Question (Admin only) → survey lifecycle draft→published→closed, publish butuh ≥1 pertanyaan, update/delete hanya saat draft, 45 test lulus
- [x] Endpoint submit Response/Answer (Siswa) → `GET/POST /api/surveys/:id/responses(/me)`, validasi target kelas/angkatan, periode aktif, wajib per pertanyaan, 56 test lulus
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

**Status saat ini:** Fase 0 selesai. Fase 1 sebagian selesai — skema database & API contract sudah didesain, wireframe halaman belum.

**Langkah berikutnya yang disarankan:** wireframe halaman utama (opsional, bisa dilewati jika langsung mulai coding), lalu lanjut ke Fase 2 (setup project Express, koneksi PostgreSQL, dan implementasi auth).
