# Survey Siswa

Aplikasi survey siswa (kepuasan sekolah, evaluasi guru, evaluasi kegiatan) sekaligus proyek latihan DevOps end-to-end.

- Kebutuhan produk: [PRD.md](./PRD.md)
- Rekap tahapan project: [PROJECT_PLAN.md](./PROJECT_PLAN.md)
- Skema database & API contract: [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md), [docs/API_CONTRACT.md](./docs/API_CONTRACT.md)
- Operasional (restart, log, backup): [docs/RUNBOOK.md](./docs/RUNBOOK.md)
- Deployment (CD, simulasi lokal, rollback): [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- Ringkasan testing & QA: [docs/QA_TESTING.md](./docs/QA_TESTING.md)

## Struktur Project
```
api/    -> Backend (Node.js + Express + PostgreSQL)
web/    -> Frontend (React)
infra/  -> Docker, docker-compose, konfigurasi CI/CD
```
