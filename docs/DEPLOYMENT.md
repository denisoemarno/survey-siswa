# Deployment — Survey Siswa

## Status

Belum ada server produksi sungguhan. Dokumen ini menjelaskan cara kerja CD yang sudah disiapkan, dan cara mensimulasikannya secara lokal sampai ada VPS/cloud target yang nyata.

## Artefak deployment

- Image `api` dan `web` dibuild otomatis dan di-push ke GHCR oleh `.github/workflows/docker-publish.yml` setiap push ke `main`, dengan tag `latest` dan tag commit sha.
- `docker-compose.prod.yml` (di root) adalah compose file bergaya produksi — beda dari `docker-compose.yml` (dev) karena ia **pull image jadi dari GHCR**, bukan build dari source lokal.

## Simulasi lokal (tanpa server sungguhan)

Cara ini membuktikan pipeline build → push → deploy benar-benar menghasilkan artefak yang jalan, tanpa perlu sewa server:

```bash
docker compose -p survey-siswa-prod -f docker-compose.prod.yml pull
docker compose -p survey-siswa-prod -f docker-compose.prod.yml up -d
curl http://localhost:3000/api/health
```

Web bisa diakses di `http://localhost:8000` (port beda dari dev supaya bisa jalan berdampingan dengan `docker-compose.yml`).

Kalau dev stack (`docker-compose.yml`) juga sedang jalan di port 3000, override port API simulasi ini supaya tidak bentrok:
```bash
API_PORT=3001 docker compose -p survey-siswa-prod -f docker-compose.prod.yml up -d
```

Matikan dengan:
```bash
docker compose -p survey-siswa-prod -f docker-compose.prod.yml down
```

## Deploy ke VPS sungguhan (saat sudah ada)

1. Siapkan VPS dengan Docker & Docker Compose terpasang.
2. Tambahkan repo secrets di GitHub: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (private key SSH).
3. Jalankan workflow **Deploy** (`.github/workflows/deploy.yml`) manual dari tab Actions, atau ubah trigger-nya jadi otomatis saat push ke `main` (lihat komentar di file workflow-nya).
4. Workflow akan: copy `docker-compose.prod.yml` ke server → `docker compose pull` → `docker compose up -d` → health check.

## Rollback sederhana

Karena setiap image di-tag dengan commit sha (selain `latest`), rollback tinggal deploy ulang dengan tag sha commit sebelumnya:

```bash
IMAGE_TAG=<sha-commit-sebelumnya> docker compose -f docker-compose.prod.yml up -d
```

Atau jalankan workflow **Deploy** manual dengan input `image_tag` diisi sha tersebut.

## Health check

- `GET /api/health` dipakai sebagai pengecekan dasar (cek proses API hidup + koneksi DB tersambung).
- Workflow deploy akan gagal (exit non-zero) kalau health check ini tidak merespons 200 setelah container baru naik — sinyal untuk investigasi/rollback manual.
