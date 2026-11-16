# Rencana Eksekusi: Deskripsi Fitur Web Application NYAWIT

> Dibuat oleh agent setelah audit codebase.
> Tanggal audit: 2026-11-10
> Sumber kebenaran: `src/app/*`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/app/dashboard/_components/admin-sidebar.tsx`.

---

## Parameter Dokumen

| Parameter | Nilai | Sumber |
|---|---|---|
| `NAMA_SISTEM` | **NYAWIT** | Logo, title tag (`Dashboard - NYAWIT`), sidebar |
| `NOMOR_BAB` | `2.2.1` | Default dari instruksi |
| `JUDUL_BAB` | `Web Application` | Default dari instruksi |
| `NOMOR_GAMBAR_AWAL` | `2.8` | Default dari instruksi |
| `ROLE_DIDOKUMENTASI` | `SUPER_ADMIN` | Hanya role ini yang bisa mengakses halaman manajemen; `ADMIN_LOCATION` hanya melihat subset monitoring |
| `FORMAT_AKHIR` | `md` | Default dari instruksi |

---

## Cakupan Dokumentasi

Dokumentasikan halaman yang benar-benar ada dan bisa diakses via UI:

| Kelompok | Halaman/Menu | Route | Role | Status |
|---|---|---|---|---|
| Autentikasi | Login | `/auth/login` | guest | Dokumentasikan |
| Dashboard | Dashboard | `/dashboard` | SUPER_ADMIN, ADMIN_LOCATION | Dokumentasikan (ambil dari SUPER_ADMIN) |
| Monitoring | Monitoring Tingkat Air | `/dashboard/monitoring/water-level` | SUPER_ADMIN, ADMIN_LOCATION | Dokumentasikan |
| Monitoring | Monitoring Curah Hujan | `/dashboard/monitoring/curah-hujan` | SUPER_ADMIN, ADMIN_LOCATION | Dokumentasikan |
| Monitoring | Monitoring Kondisi Tanah | `/dashboard/monitoring/soil-monitoring` | SUPER_ADMIN, ADMIN_LOCATION | Dokumentasikan |
| Notifikasi | Notifikasi & Peringatan | `/dashboard/alerts` | SUPER_ADMIN, ADMIN_LOCATION | Dokumentasikan (ambil dari SUPER_ADMIN) |
| Manajemen | Kelola Stasiun | `/dashboard/management/stations` | SUPER_ADMIN (efektif) | Dokumentasikan |
| Manajemen | Kelola Perangkat | `/dashboard/management/devices` | SUPER_ADMIN (efektif) | Dokumentasikan |
| Manajemen | Kelola Pengguna | `/dashboard/management/users` | SUPER_ADMIN (efektif) | Dokumentasikan |

### Halaman yang TIDAK didokumentasikan

| Route | Alasan |
|---|---|
| `/dashboard/monitoring/prediksi-ai` | Sidebar merujuk ke route ini, tetapi tidak ada file `page.tsx` di `src/app/dashboard/monitoring/prediksi-ai/`. Akses menghasilkan 404. |
| `/dashboard/logs` | Sidebar merujuk ke route ini, tetapi tidak ada file `page.tsx` di `src/app/dashboard/logs/`. Akses menghasilkan 404. |
| `/dashboard/monitoring/*/[id]` (detail) | Versi ringkas cukup untuk deskripsi fitur; detail stasiun/perangkat tidak wajib untuk subbab umum Web Application. Jika waktu cukup, dapat ditambahkan sebagai lampiran. |

---

## Urutan Screenshot

| No | Nama File | Halaman | Role | Viewport | Catatan |
|---|---|---|---|---|---|
| 01 | `01-auth-login.png` | Login | guest | 1440x900 | Form login lengkap dengan panel hero di kanan |
| 02 | `02-admin-dashboard.png` | Dashboard | SUPER_ADMIN | 1440x900 | Pastikan chart dan stat cards terisi |
| 03 | `03-admin-water-level.png` | Monitoring Tingkat Air | SUPER_ADMIN | 1440x900 | Pilih range default (week) |
| 04 | `04-admin-curah-hujan.png` | Monitoring Curah Hujan | SUPER_ADMIN | 1440x900 | Pilih range default (week) |
| 05 | `05-admin-soil-monitoring.png` | Monitoring Kondisi Tanah | SUPER_ADMIN | 1440x900 | Metric default soilMoisture |
| 06 | `06-admin-alerts.png` | Notifikasi & Peringatan | SUPER_ADMIN | 1440x900 | Tampilkan tabel notifikasi |
| 07 | `07-admin-stations.png` | Kelola Stasiun | SUPER_ADMIN | 1440x900 | Tabel stasiun termasuk mock data |
| 08 | `08-admin-devices.png` | Kelola Perangkat | SUPER_ADMIN | 1440x900 | Tabel perangkat |
| 09 | `09-admin-users.png` | Kelola Pengguna | SUPER_ADMIN | 1440x900 | Tabel pengguna |

---

## Tahapan Eksekusi

### Tahap 1: Persiapan Lingkungan
1. Pastikan PostgreSQL berjalan dan `DATABASE_URL` di `.env` valid.
2. Jalankan `bunx prisma migrate dev` atau `bunx prisma db push` jika schema belum sinkron.
3. Jalankan `bun prisma/seed.ts` untuk mengisi data uji.
4. Jalankan `bun run dev` (Next.js di `localhost:3000`).
5. Verifikasi aplikasi bisa diakses.

### Tahap 2: Screenshot dengan Playwright MCP
1. Navigasi ke `http://localhost:3000/auth/login`.
2. Login sebagai `superadmin@lpa.id` dengan password dari env/default seed.
3. Tunggu redirect ke `/dashboard`.
4. Ambil screenshot dashboard.
5. Navigasi ke tiap halaman monitoring & manajemen sesuai urutan.
6. Pastikan data selesai dimuat (tunggu elemen tabel/chart muncul).
7. Simpan screenshot ke `feature-description/output/images/`.
8. Isi `feature-description/working/screenshot_manifest.csv`.

### Tahap 3: Penulisan Deskripsi
1. Tulis `feature-description/output/feature_description.md` dengan struktur:
   - `## 2.2.1 Web Application`
   - Subjudul `A.`, `B.`, `C.` dst.
   - Setiap halaman: gambar, caption `Gambar X.Y. Tampilan ...`, paragraf 3–7 kalimat.
2. Gunakan bahasa Indonesia formal, istilah asing italic (`*login*`, `*dashboard*`, `*chart*`, dsb.).
3. Jelaskan komponen UI sesuai yang terlihat di screenshot.

### Tahap 4: QA
1. Pastikan setiap halaman di `feature_matrix.csv` berstatus `documented=yes` atau diberi alasan.
2. Pastikan setiap gambar punya caption dan paragraf.
3. Periksa penomoran gambar berurutan dari 2.8.
4. Periksa tidak ada data sensitif/kredensial di gambar.
5. Tulis `feature-description/working/qa_report.md`.

---

## Risiko dan Blocker yang Diketahui

| Risiko/Blocker | Dampak | Mitigasi |
|---|---|---|
| Playwright MCP tidak tersedia | Tidak bisa mengambil screenshot | Lanjutkan audit kode + tulis draf tanpa gambar; laporkan jujur di `qa_report.md` |
| Database/seed gagal | UI kosong atau error | Periksa `.env` dan koneksi PostgreSQL; dokumentasikan error jika tidak bisa diperbaiki |
| Halaman `prediksi-ai` dan `logs` 404 | Tidak bisa didokumentasikan | Catat sebagai halaman tidak tersedia di `qa_report.md`; jangan mengarang screenshot |
| `ADMIN` role check adalah dead code | Tidak ada dampak fungsional, tapi perlu dijelaskan dengan hati-hati | Deskripsikan akses berdasarkan enum `UserRole` yang sebenarnya (`SUPER_ADMIN` / `ADMIN_LOCATION`) |
| Halaman Kelola Stasiun mencampur data mock | Deskripsi harus mencerminkan apa yang terlihat, bukan mengklaim semua data nyata | Sebutkan tabel menampilkan daftar stasiun tanpa membuat klaim keaslian data |

---

## Akun Uji

| Role | Email | Password | Sumber |
|---|---|---|---|
| Super Admin | `superadmin@lpa.id` | `SuperAdmin@LPA123` (default seed) atau `SEED_SUPERADMIN_PASSWORD` dari `.env` | `prisma/seed.ts` |
| Admin Lokasi | `admin.sebangau@lpa.id` | `AdminLokasi@LPA123` (default seed) atau `SEED_ADMIN_PASSWORD` dari `.env` | `prisma/seed.ts` |

> Kredensial tidak akan ditulis di dokumen final.

---

## Definition of Done

- [ ] Aplikasi berjalan lokal dan bisa diakses.
- [ ] Screenshot asli diambil dengan Playwright MCP (atau blocker dilaporkan).
- [ ] Semua halaman penting punya gambar, caption, dan paragraf deskripsi.
- [ ] `feature_matrix.csv`, `screenshot_manifest.csv`, dan `qa_report.md` lengkap.
- [ ] QA checklist lolus atau pengecualian dicatat secara objektif.
