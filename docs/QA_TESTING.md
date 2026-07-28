# QA & Testing — Survey Siswa

Ringkasan pengujian Fase 7. Referensi checklist di [PROJECT_PLAN.md](../PROJECT_PLAN.md).

## 1. Testing manual end-to-end per role

Diverifikasi langsung di browser (bukan cuma automated test) sepanjang Fase 3-6:

| Role | Skenario | Status |
|---|---|---|
| Admin | Login, redirect ke `/admin` | ✅ |
| Admin | Kelola user: create, edit, delete, filter, import CSV | ✅ |
| Admin | Kelola survey: create, edit (draft), publish, close, delete (draft) | ✅ |
| Admin | Kelola pertanyaan: tambah/edit/hapus (hanya saat draft), 3 tipe jawaban | ✅ |
| Admin | Lihat laporan: partisipasi, distribusi per pertanyaan | ✅ |
| Siswa | Login, redirect ke `/siswa` | ✅ |
| Siswa | Lihat daftar survey yang ditargetkan (kelas/angkatan match) | ✅ |
| Siswa | Isi survey (pilihan ganda, skala, essay), submit, status berubah | ✅ |
| Guru | Login, redirect ke `/guru` | ✅ |
| Guru | Lihat daftar evaluasi miliknya, lihat laporan | ✅ |

Ditambah 73 automated test (Jest+Supertest) yang mencakup seluruh business logic backend: auth, CRUD user/survey/question, submit response, dan laporan — termasuk semua role-boundary check (403/404/409) yang tidak praktis diklik manual satu-satu.

## 2. Uji beban ringan

Skrip `node load_test.js` (lihat riwayat percakapan — tidak disimpan di repo karena cuma tooling QA sesaat) mensimulasikan:

- **50 siswa submit survey secara bersamaan** → seluruhnya sukses (201) dalam ~370-420ms, tidak ada error/data korup.
- **5 request submit pertama kali secara konkuren dari siswa yang sama** (race condition test) → tepat 1 yang sukses (201), sisanya ditolak dengan benar.
- Laporan (`GET /report`) setelah itu menunjukkan angka partisipasi yang akurat (51 responden, sesuai jumlah user unik yang submit).

**Bug ditemukan & diperbaiki** dari uji ini: request yang kalah race condition awalnya mendapat `500 Internal Server Error`, bukan `409 Conflict` yang seharusnya — constraint unique di database sudah benar mencegah duplikat, tapi error dari race tersebut belum ditangkap secara eksplisit di controller. Sudah diperbaiki di `response.controller.js` (menangkap kode error Postgres `23505`) beserta test regresi di `tests/responses.test.js`.

## 3. Uji keamanan dasar

| Cek | Hasil |
|---|---|
| SQL injection (login, query filter) | ✅ Aman — knex/pg parameterized queries, tidak ada payload yang berhasil |
| Akses tanpa token ke endpoint terproteksi | ✅ 401 dengan benar |
| Token rusak/kadaluarsa | ✅ 401 dengan benar |
| XSS via stored input (field nama, essay) | ✅ Aman — tidak ada `dangerouslySetInnerHTML`/`eval` di frontend, semua render lewat JSX text (auto-escaped React) |
| Security headers (helmet) | ✅ `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, dll aktif |
| Body JSON malformed | ✅ 400 dengan pesan wajar, tidak crash |
| Input tipe tidak terduga (mis. `role` berupa object) | ✅ Ditolak validasi (400) |
| Kebocoran detail error internal ke client | 🔴→✅ **Ditemukan & diperbaiki** — error tak terduga (500) sebelumnya membocorkan `err.message` mentah (bisa berisi detail skema DB). Sekarang hanya pesan error yang sengaja dilempar dengan `status` eksplisit yang ditampilkan ke client; sisanya diganti pesan generik "Internal server error" (log detail tetap ada di server). Lihat `errorHandler.js` + test di `tests/errorHandler.test.js`. |

### Gap yang diketahui (belum diimplementasikan, di luar scope saat ini)
- **Rate limiting / brute-force protection** pada `POST /auth/login` — saat ini tidak dibatasi jumlah percobaan. Untuk project skala sekolah tunggal risikonya rendah, tapi kalau mau lebih aman bisa ditambah `express-rate-limit` di kemudian hari.
- **Input sanitization di level API** — saat ini mengandalkan proteksi di sisi output (React auto-escape). Cukup untuk XSS di aplikasi ini sendiri, tapi kalau data pernah dikonsumsi sistem lain di luar React, perlu sanitisasi tambahan.
