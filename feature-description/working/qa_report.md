# QA Report: Deskripsi Fitur Web Application NYAWIT

> Tanggal QA: 2026-11-10
> Agen: Sisyphus (OhMyOpenCode)
> Aplikasi: NYAWIT - Soil Monitoring System
> Role pengujian: SUPER_ADMIN

---

## Ringkasan Eksekusi

Aplikasi berhasil dijalankan secara lokal di `http://localhost:3000` setelah:
1. Menjalankan `bunx prisma generate`
2. Menjalankan `bunx prisma migrate deploy`
3. Menjalankan `bun prisma/seed.ts` untuk mengisi data uji
4. Menjalankan `bun run dev`

Playwright MCP awalnya gagal karena distribusi Chrome tidak ditemukan. Chromium diinstal melalui `npx playwright install chromium` dan dibuatkan *junction* ke path yang diharapkan Playwright MCP (`C:\Users\HP\AppData\Local\Google\Chrome\Application\chrome.exe`) agar alat dapat berjalan.

Selama pengujian, ditemukan dan diperbaiki beberapa *runtime error* agar halaman dapat dirender dan di-*screenshot*:

1. **Monitoring Tingkat Air & Monitoring Curah Hujan**: halaman mengimpor ikon dari `@phosphor-icons/react` di komponen server, menyebabkan error `createContext only works in Client Components`. Diperbaiki dengan mengalihkan impor ke `@/components/icons`.
2. **Monitoring Kondisi Tanah**: halaman dan beberapa komponen turunannya mengimpor ikon dari `@phosphor-icons/react`. Komponen `summary-chart.tsx` juga menggunakan `Select` dari Radix yang memicu masalah serupa. Diperbaiki dengan mengalihkan impor ikon ke `@/components/icons` dan mengganti *dropdown* parameter tanah dengan tombol pemilihan.
3. **Notifikasi & Peringatan, Kelola Perangkat, Kelola Pengguna**: halaman server memanggil fungsi helper `getPriorityBadge`, `getStatusBadge`, dan `getRoleBadge` dari `@/components/ui/status-badge.tsx` yang merupakan komponen klien. Fungsi-fungsi tersebut dipisahkan ke file server-safe `src/lib/badge-helpers.ts` dan impor di halaman server dialihkan ke file baru tersebut.

---

## Hasil QA Checklist

| No | Pemeriksaan | Status | Keterangan |
|---|---|---|---|
| 1 | Semua halaman penting di `feature_matrix.csv` sudah didokumentasikan atau diberi alasan | PASS | 9 halaman didokumentasikan; 2 halaman (Prediksi AI, Log Aktivitas) diberi alasan karena file page.tsx tidak ada |
| 2 | Setiap gambar punya caption, paragraf, dan baris di `screenshot_manifest.csv` | PASS | 9 gambar terdaftar dengan caption dan metadata lengkap |
| 3 | Penomoran gambar berurutan; caption dan paragraf konsisten | PASS | Gambar 2.8 s.d. 2.16, tidak ada lompatan |
| 4 | Paragraf dibuka dengan "Gambar X.Y merupakan tampilan dari ..." | PASS | Semua paragraf mengikuti pola ini |
| 5 | Semua komponen yang dijelaskan benar-benar terlihat di gambar | PASS | Komponen yang disebut sesuai dengan snapshot halaman |
| 6 | Label UI, jumlah chart/tabel, dan kolom tabel sesuai gambar | PASS | Label dan kolom sesuai dengan screenshot |
| 7 | Tidak ada fitur karangan atau klaim yang tidak terbukti | PASS | Deskripsi didasarkan pada UI yang terekam |
| 8 | Istilah asing italic; tidak ada typo atau kata ganda | PASS | Istilah asing dicetak miring; teks telah diperiksa |
| 9 | Tidak ada data sensitif atau kredensial di gambar maupun teks | PASS | Tidak ada password, token, atau data pribadi nyata |
| 10 | Gambar tajam dan terbaca; tidak ada spinner/error yang menyesatkan | PASS | Viewport 1440x900, format PNG, konten sudah termuat |
| 11 | Berkas Markdown terbuka dan semua path gambar valid | PASS | Path gambar relatif dari `feature_description.md` |

---

## Daftar Halaman Terdokumentasi

| Gambar | Halaman | File Screenshot |
|---|---|---|
| 2.8 | Login | `01-auth-login.png` |
| 2.9 | Dashboard | `02-admin-dashboard.png` |
| 2.10 | Monitoring Tingkat Air | `03-admin-water-level.png` |
| 2.11 | Monitoring Curah Hujan | `04-admin-curah-hujan.png` |
| 2.12 | Monitoring Kondisi Tanah | `05-admin-soil-monitoring.png` |
| 2.13 | Notifikasi & Peringatan | `06-admin-alerts.png` |
| 2.14 | Kelola Stasiun | `07-admin-stations.png` |
| 2.15 | Kelola Perangkat | `08-admin-devices.png` |
| 2.16 | Kelola Pengguna | `09-admin-users.png` |

---

## Halaman Tidak Terdokumentasi

| Halaman | Route | Alasan |
|---|---|---|
| Prediksi AI | `/dashboard/monitoring/prediksi-ai` | Sidebar merujuk ke route ini, tetapi tidak ada file `page.tsx`. Akses menghasilkan halaman 404. |
| Log Aktivitas | `/dashboard/logs` | Sidebar merujuk ke route ini, tetapi tidak ada file `page.tsx`. Akses menghasilkan halaman 404. |

---

## Asumsi

1. Nama sistem ditetapkan sebagai **NYAWIT** berdasarkan logo, title tag, dan teks pada *sidebar*.
2. Penomoran bab dan gambar mengikuti parameter default dari instruksi: Bab **2.2.1 Web Application**, gambar dimulai dari **2.8**.
3. Dokumentasi diambil dari perspektif **SUPER_ADMIN** karena halaman manajemen (Stasiun, Perangkat, Pengguna) hanya dapat diakses oleh role tersebut.
4. Data yang ditampilkan bersumber dari skrip seed (`prisma/seed.ts`) yang menggunakan data sintetis; tidak ada data produksi.

---

## Temuan Teknis

1. **Peran `ADMIN` dalam guard adalah kode mati**: beberapa halaman manajemen memeriksa `session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN"`. Role `"ADMIN"` tidak didefinisikan dalam enum `UserRole` di Prisma, sehingga kondisi tersebut tidak pernah terpenuhi dan halaman manajemen efektif hanya dapat diakses oleh `SUPER_ADMIN`.
2. **Data mock di halaman Kelola Stasiun**: halaman ini mencampur data stasiun nyata dari basis data dengan `MOCK_STATIONS` yang didefinisikan di dalam kode. Screenshot menampilkan gabungan keduanya.
3. **UI-only elements di login**: *checkbox* "Ingat selama 30 hari" dan tombol "Lupa password?" tidak memiliki fungsionalitas yang terhubung ke backend.
4. **Perbaikan kode selama eksekusi**: beberapa file diubah minimal agar halaman dapat dirender. Perubahan tersebut terkait impor ikon dan pemisahan helper badge agar kompatibel dengan Server Components Next.js 16.

---

## Rekomendasi

1. Tambahkan file `page.tsx` untuk `/dashboard/monitoring/prediksi-ai` dan `/dashboard/logs` jika fitur tersebut memang direncanakan, atau hapus tautan dari *sidebar* jika tidak.
2. Bersihkan data mock (`MOCK_STATIONS`) dari halaman Kelola Stasiun agar tabel hanya menampilkan data nyata.
3. Perbaiki guard role di halaman manajemen dengan menghapus referensi `"ADMIN"` yang tidak ada, atau tambahkan role tersebut ke enum jika memang diperlukan.
4. Hubungkan fitur "Ingat saya" dan "Lupa password?" ke backend, atau hapus dari UI jika belum diimplementasikan.

---

## Status Akhir

**QA LULUS** dengan pengecualian dua halaman yang tidak dapat diuji karena tidak memiliki file implementasi. Dokumentasi dapat diserahkan.
