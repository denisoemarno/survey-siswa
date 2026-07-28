# Runbook — Survey Siswa

Panduan operasional harian: restart service, lihat log, backup/restore database, dan troubleshooting dasar. Untuk deployment ke server sungguhan, lihat [DEPLOYMENT.md](./DEPLOYMENT.md).

## Cek status & kesehatan service

```bash
docker compose ps
```

Semua service (`db`, `api`, `web`, `adminer`) punya healthcheck bawaan — kolom `STATUS` akan menunjukkan `healthy`/`unhealthy`/`health: starting`. Kalau ada yang `unhealthy`, cek log service tersebut (lihat bagian berikutnya) sebelum restart.

Cek pemakaian resource (CPU/memory) tiap container:
```bash
docker stats
```

## Lihat log

```bash
docker compose logs -f api      # log API (JSON terstruktur via pino, per-request + error)
docker compose logs -f web      # log nginx
docker compose logs -f db       # log Postgres
```

Log API berformat JSON satu baris per event (`pino`) — gampang di-pipe ke `jq` untuk filter, misal cari error saja:
```bash
docker compose logs api | grep '"level":50'
```
(level 50 = error, 30 = info, 40 = warn di skema pino)

## Restart service

Restart satu service tanpa mengganggu yang lain:
```bash
docker compose restart api
docker compose restart web
```

Restart seluruh stack:
```bash
docker compose down && docker compose up -d
```
(`down` tidak menghapus volume `db_data`, jadi data tetap aman.)

## Rebuild setelah ganti kode

```bash
docker compose build api    # atau web
docker compose up -d api
```

## Backup database

```bash
./scripts/backup-db.sh
```
Hasil backup (`.sql.gz`) disimpan di `./backups/` (tidak masuk git — lihat `.gitignore`). Jalankan manual kapan saja, atau jadwalkan via cron kalau sudah ada server sungguhan:
```cron
0 2 * * * cd /path/ke/survey-siswa && ./scripts/backup-db.sh
```

## Restore database

**Hati-hati — ini menimpa seluruh data yang ada saat ini.**
```bash
./scripts/restore-db.sh ./backups/survey_siswa_20260101_020000.sql.gz
```

## Troubleshooting umum

| Gejala | Kemungkinan penyebab | Langkah |
|---|---|---|
| `api` unhealthy / restart terus | DB belum siap, atau migrasi gagal | `docker compose logs api`, cek koneksi `DATABASE_URL`, pastikan `db` healthy dulu |
| `web` unhealthy | nginx gagal start, salah config | `docker compose logs web` |
| Login gagal padahal password benar | Container `api` belum reload kode terbaru | `docker compose build api && docker compose up -d api` |
| Data hilang setelah `docker compose down -v` | `-v` menghapus volume `db_data` | Restore dari backup terakhir; **jangan pakai `-v` kecuali sengaja reset** |
| Port bentrok (mis. 3000 dipakai) | Ada proses/container lain di port yang sama | `lsof -i :3000`, matikan proses lama atau ganti port di `docker-compose.yml` |
