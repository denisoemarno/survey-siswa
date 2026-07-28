# API Contract — Survey Siswa

REST API, base path `/api`. Auth via JWT (Bearer token). Role diperiksa lewat middleware (`siswa` / `guru` / `admin`). Skema tabel terkait ada di [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

## Auth
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| POST | `/auth/login` | public | Login (email + password) → JWT |
| GET | `/auth/me` | semua (login) | Data user yang sedang login |

## Users (Manajemen User)
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/users` | admin | List user, filter `role`, `kelas`, `angkatan` |
| POST | `/users` | admin | Buat user baru |
| POST | `/users/import` | admin | Import massal via CSV |
| GET | `/users/:id` | admin, atau diri sendiri | Detail user |
| PUT | `/users/:id` | admin | Update user |
| DELETE | `/users/:id` | admin | Hapus user |

## Surveys (Manajemen Survey)
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/surveys` | admin: semua; siswa: yang aktif & jadi target; guru: miliknya sendiri (tipe evaluasi_guru) | List survey (scoped per role) |
| POST | `/surveys` | admin | Buat survey baru (status awal `draft`) |
| GET | `/surveys/:id` | admin, atau siswa/guru terkait | Detail survey + questions |
| PUT | `/surveys/:id` | admin | Update survey (hanya saat `draft`) |
| DELETE | `/surveys/:id` | admin | Hapus survey (hanya saat `draft`) |
| POST | `/surveys/:id/publish` | admin | Ubah status → `published` |
| POST | `/surveys/:id/close` | admin | Ubah status → `closed` |

## Questions (Nested di bawah Survey)
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/surveys/:surveyId/questions` | admin, siswa/guru terkait | List pertanyaan dalam survey |
| POST | `/surveys/:surveyId/questions` | admin | Tambah pertanyaan (hanya saat `draft`) |
| PUT | `/questions/:id` | admin | Update pertanyaan (hanya saat `draft`) |
| DELETE | `/questions/:id` | admin | Hapus pertanyaan (hanya saat `draft`) |

## Responses & Answers (Pengisian Survey — Siswa)
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/surveys/:surveyId/responses/me` | siswa | Cek status pengisian sendiri (sudah/belum submit) |
| POST | `/surveys/:surveyId/responses` | siswa | Submit jawaban lengkap (array of `{question_id, jawaban}`) — ditolak jika sudah pernah submit atau survey tidak `published` |

## Reports (Laporan & Analitik)
| Method | Endpoint | Role | Deskripsi |
|---|---|---|---|
| GET | `/surveys/:surveyId/report` | admin: full detail; guru: agregat anonim utk survey miliknya | Rekap skor rata-rata, distribusi jawaban, tingkat partisipasi |
| GET | `/surveys/:surveyId/report/export` | admin | Export laporan ke Excel/PDF |

## Aturan Response Umum
- Semua endpoint ber-auth mengembalikan `401` jika token tidak valid/kadaluarsa, `403` jika role tidak sesuai.
- Validasi input dengan pesan error terstruktur: `{ "error": { "field": "...", "message": "..." } }`.
- Endpoint report untuk role `guru`: jika jumlah responden < 5, kembalikan `{ "message": "Data belum cukup untuk ditampilkan" }` alih-alih agregat (proteksi anonimitas, lihat PRD §11).

## Belum Didesain di Fase Ini
- Endpoint notifikasi (PRD §4.5) — didesain saat implementasi fitur tersebut, agar tidak overengineering di awal.
