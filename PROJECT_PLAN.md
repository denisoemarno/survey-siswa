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
- [x] Endpoint laporan/agregasi hasil (Admin & Guru, dengan aturan anonimitas) → `GET /api/surveys/:id/report`, distribusi per tipe pertanyaan, gate anonimitas guru (<5 responden), 63 test lulus
- [x] Unit test untuk service/business logic penting → tercakup organik di 63 test sepanjang Fase 2 (auth, users, surveys/questions, responses, reports)

## Fase 3 — Development Frontend (Web)
- [x] Setup project React (routing, state management, auth guard per role) → Vite + React Router, `AuthContext`, `ProtectedRoute` per role
- [x] Halaman login → terhubung ke `POST /api/auth/login`, redirect ke dashboard sesuai role, terverifikasi jalan di browser
- [x] Dashboard Admin: kelola user, kelola survey, lihat laporan → `/admin/users` (CRUD+import CSV), `/admin/surveys` + `/admin/surveys/:id` (CRUD survey & question, publish/close), `/admin/surveys/:id/report` (laporan), terverifikasi jalan di browser
- [x] Halaman isi survey untuk Siswa → `/siswa` (daftar survey dengan status terisi/belum) + `/siswa/surveys/:id` (form isi per tipe jawaban), terverifikasi jalan di browser
- [x] Dashboard hasil evaluasi untuk Guru → `/guru` (daftar evaluasi miliknya) + `/guru/evaluations/:id` (laporan, gate anonimitas jika <5 responden), terverifikasi jalan di browser
- [x] Integrasi ke API backend → seluruh halaman (Admin/Siswa/Guru) terhubung ke API asli, tidak ada mock data

## Fase 4 — Containerization
- [x] Dockerfile untuk API → `api/Dockerfile` (node:22-alpine), `entrypoint.sh` menjalankan migrate+seed sebelum start
- [x] Dockerfile untuk Web (build + serve, misal via nginx) → `web/Dockerfile` multi-stage (Vite build → nginx), `web/nginx.conf` reverse proxy `/api` ke service `api`
- [x] `docker-compose.yml` untuk local dev (web + api + db) → 4 service (`db`, `adminer`, `api`, `web`), terverifikasi jalan end-to-end di browser
- [x] `.env.example` untuk konfigurasi (DB credentials, JWT secret, dll — tidak commit secret asli) → root `.env.example` untuk docker-compose

## Fase 5 — CI (Continuous Integration)
- [x] GitHub Actions: workflow lint & test otomatis saat PR dibuka → `.github/workflows/ci.yml` (job `api` dengan service Postgres + migrate + jest, job `web` dengan eslint + vite build); ESLint dasar ditambahkan ke kedua project, semua bersih
- [x] GitHub Actions: build Docker image saat merge ke `main` → `.github/workflows/docker-publish.yml`
- [x] Push image ke container registry (GHCR/Docker Hub) → push ke GHCR (`ghcr.io/<repo>/api`, `ghcr.io/<repo>/web`), tag `latest` + sha

**Catatan:** belum bisa diverifikasi jalan sungguhan karena repo ini belum punya remote GitHub — akan tervalidasi begitu di-push pertama kali.

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

**Status saat ini:** Fase 0-4 selesai. Seluruh stack (db, adminer, api, web) sekarang jalan via `docker-compose up`, terverifikasi end-to-end di browser (login, dashboard per role, semua lewat container).

**Langkah berikutnya yang disarankan:** push repo ke GitHub (belum ada remote) supaya workflow CI bisa benar-benar tervalidasi, lalu lanjut Fase 6 — CD (pilih target deployment).
