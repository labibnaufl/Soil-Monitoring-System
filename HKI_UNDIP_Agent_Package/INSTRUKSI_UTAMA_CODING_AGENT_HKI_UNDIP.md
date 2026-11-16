# MASTER INSTRUCTION: Penyusunan Manual Book HKI Website Berbasis Codebase

> **Jenis dokumen:** Spesifikasi pekerjaan untuk coding agent, bukan isi manual book final.  
> **Bahasa keluaran:** Bahasa Indonesia baku dan profesional.  
> **Objek pencatatan:** Hak Cipta, subjenis **Program Komputer**.  
> **Jalur pengajuan:** Direktorat Inovasi, Hilirisasi dan Kerja Sama (DIHKS), Universitas Diponegoro (UNDIP), dengan persyaratan DJKI yang relevan.  
> **Keluaran utama yang WAJIB dibuat agent:** `Manual_Book_HKI_<Nama_Aplikasi>.docx`, ditambah PDF hasil ekspor dari dokumen yang sama jika konversi tersedia.  
> **Sumber kebenaran fungsional:** Codebase aktual, hasil menjalankan aplikasi, dan bukti tangkapan layar melalui **Playwright MCP**.  
> **Prinsip:** Jangan mengarang nama fitur, perilaku aplikasi, identitas, kewenangan, screenshot, ataupun klaim hukum.

---

## 0. MANDAT EKSEKUSI UNTUK CODING AGENT

Anda adalah coding agent yang sedang bekerja **di dalam repository aplikasi web nyata**. Tujuan utama Anda adalah **mengaudit codebase dan aplikasi yang dapat dijalankan, lalu menghasilkan manual book berformat DOCX yang siap dikaji sebagai contoh ciptaan untuk pengajuan HKI UNDIP**. Jangan sekadar memberikan template kosong, daftar isi konseptual, atau rangkuman kode. Kerjakan penelitian repo, dokumentasi, screenshot, pembuatan DOCX, peninjauan tata letak, dan pemeriksaan akhir sampai menghasilkan berkas nyata.

**Instruksi wajib:**

1. Baca seluruh instruksi Markdown ini, lalu baca **semua PDF pada folder `references/`**, terutama panduan resmi UNDIP. Jika alat baca PDF memiliki keterbatasan, ekstrak teks dengan alat lokal yang tersedia dan inspeksi halaman visual yang berisi tabel, contoh, atau layout.
2. Audit repository untuk memahami **fungsi aktual, halaman, modul, role, autentikasi, arsitektur, serta alur bisnis**. Ambil bukti dari kode, bukan dari dugaan nama menu semata.
3. Jalankan aplikasi pada lingkungan aman yang disediakan atau dapat dijalankan lokal. **Gunakan Playwright MCP secara nyata** untuk mengeksplorasi UI dan mengambil screenshot tampilan penting. Menggunakan gambar dari README atau mengambil screenshot statis pengganti tanpa mencoba Playwright MCP bukan pemenuhan mandat ini.
4. Buat dokumentasi per fitur yang **dapat dipertanggungjawabkan**, termasuk langkah-langkah penggunaan, precondition, tindakan, hasil, dan screenshot yang relevan. Jelaskan perbedaan hak akses apabila ada.
5. Siapkan pembahasan implementasi dan **kode sumber program yang dapat diaudit** sebagai bagian dalam dokumen, dengan memperhatikan kepemilikan pihak ketiga dan keamanan.
6. Buat DOCX final yang rapi, konsisten, dan profesional, lalu **render dan periksa setiap halaman**. Koreksi layout berulang kali bila perlu.
7. Buat PDF dari DOCX final apabila alat konversi tersedia, tetapi **DOCX tetap deliverable utama**. Jika hasil konversi dibuat, pastikan narasi dan gambar sama dengan DOCX.
8. Tidak ada pembatasan buatan terkait jumlah halaman, jumlah screenshot, panjang dokumentasi, atau ukuran file kerja/deliverable. Keputusan kelengkapan ditentukan oleh kenyataan codebase dan ketentuan pengajuan yang diverifikasi pada tahap submit, bukan target kompresi arbitrer.
9. Jangan mengubah logika bisnis, data produksi, role/permission produksi, maupun konfigurasi keamanan hanya untuk menghasilkan screenshot. Perubahan temporer yang diizinkan harus aman, reversibel, dan terdokumentasi.
10. Jika detail penting belum tersedia (misalnya nama resmi pencipta atau akun role tertentu), **jangan membuat fakta palsu**. Catat sebagai *data yang perlu dilengkapi*, lanjutkan pekerjaan yang tidak terhalang, dan tandai dengan jelas pada dokumen draft/lembar verifikasi. Jangan terbitkan dokumen seolah-olah lengkap apabila ada data wajib yang belum diketahui.

**Keputusan hasil pekerjaan:** Agen harus menghasilkan isi benar-benar spesifik terhadap repository yang sedang dibuka, bukan generik. Semua fitur, screenshot, alur, dan potongan kode wajib bisa ditelusuri ke bukti nyata.

---

## 1. HIERARKI SUMBER KEBENARAN DAN REFERENSI

Jika ada konflik antara referensi, gunakan prioritas berikut:

1. **Ketentuan resmi UNDIP di `references/01_Panduan_Resmi_HKI_UNDIP.pdf`** khususnya halaman PDF 7–19 dan **halaman PDF 29** untuk Program Komputer. Ini pedoman utama **jalur administrasi universitas**.
2. **Ketentuan hukum dan persyaratan DJKI yang berlaku saat pengajuan**, terutama subjenis Program Komputer. Hindari mengikuti tarif, bentuk media, dan syarat teknis dari panduan lama jika sudah diganti.
3. **Fakta codebase dan perilaku aplikasi nyata** untuk deskripsi program. Apabila kode dan UI berbeda, selidiki: kemungkinan feature flag, versi deployment, izin pengguna, atau bug. Jangan menyembunyikan perbedaan.
4. **Dokumen referensi manual book** pada `references/02_*` sampai `05_*` hanya sebagai contoh teknik penulisan, bukan ketentuan hukum mengikat.
5. Sumber website/repository tambahan sebagai bahan pendukung; verifikasi sebelum menggunakannya.

### 1.1. Berkas referensi lokal yang harus dibaca

| Nama file | Jenis | Kegunaan | Halaman khusus |
|---|---|---|---|
| `references/01_Panduan_Resmi_HKI_UNDIP.pdf` | **WAJIB: pedoman utama** | Alur universitas, berkas administrasi, persyaratan bukti Program Komputer, catatan larangan/sumber | PDF 7–19; **PDF 29** |
| `references/02_Manual_Patrolee.pdf` | Contoh manual aplikasi website + Android | Panduan berbasis role, langkah bernomor, screenshot, manajemen data | PDF 3–15 gambaran fitur; 16–32 panduan operasional |
| `references/03_Manual_Perpustakaan_Digital.pdf` | Contoh manual desktop | Layout ringkas, anotasi gambar, fitur dan deskripsi singkat, identitas visual | PDF 3–12, khususnya 5, 11–12 |
| `references/04_Manual_ONShop.pdf` | Contoh manual web + teknis | Use case, activity diagram, petunjuk admin, pengujian, source code | PDF 5–6, 7–12, 13–18 |
| `references/05_Panduan_UM_HKI_Historis.pdf` | Contoh pedoman institusi lain | Persyaratan administratif dan contoh penyusunan lampiran | PDF 15–17. **Bukan** rujukan mutakhir yang mengatasi UNDIP/DJKI |

**Wajib lakukan pembacaan substantif.** Jangan hanya membaca cover dan daftar isi. Untuk sumber yang memuat screenshot/tabel, inspeksi tampilannya. Tulis ringkasan temuan dokumen lokal di `working/reference_review.md`, termasuk halaman, manfaat bagi proyek, dan caveat.

### 1.2. Sumber online prioritas

- DJKI, persyaratan Hak Cipta: https://dgip.go.id/menu-utama/hak-cipta/syarat-prosedur
- Portal pencatatan: https://hakcipta.dgip.go.id/
- UNDIP, Direktorat Inovasi: https://dirinovki.undip.ac.id/
- UU Nomor 28 Tahun 2014 tentang Hak Cipta: https://peraturan.bpk.go.id/Details/38690/uu-no-28-tahun-2014
- DJKI, modul Hak Cipta: https://ekii.dgip.go.id/storage/modulajar/file_name_1736303736.pdf
- UGM, layanan Hak Cipta: https://ipmo.ugm.ac.id/layanan/pendaftaran-hak-cipta/
- USU, panduan registrasi HKI 2025: https://konten.usu.ac.id/storage/year/2025-05/satker/873/statis/arsip/Panduan%20Layanan%20Registrasi%20HKI%20%28Hak%20Cipta%29%20Tahun%202025.pdf
- Universitas Trunojoyo Madura, manual e-HKI: https://hki.trunojoyo.ac.id/documents/MANUAL_BOOK_e-HKI.pdf
- Playwright MCP resmi: https://github.com/microsoft/playwright-mcp
- Dokumentasi tools screenshot: https://playwright.dev/mcp/tools/screenshots
- Dokumentasi snapshot: https://playwright.dev/mcp/snapshots
- Dokumentasi kapabilitas: https://playwright.dev/mcp/capabilities

**Peringatan:** Referensi di internet dapat berubah atau tidak dapat diakses. Jangan mengarang isi halaman yang gagal diakses. Dokumentasikan status akses secara eksplisit.

### 1.3. Referensi contoh manual tambahan

Referensi ini opsional untuk memperbaiki kualitas penyajian jika akses tersedia:

1. Sistem Informasi Absensi Siswa Berbasis Web: https://repository.bsi.ac.id/repo/files/337627/download/Manual-Book---HKI-Aplikasi-Sistem-Informasi-Absensi-Siswa-Berbasis-Web.pdf
2. Sistem Informasi Manajemen Laboratorium Sekolah: https://repository.bsi.ac.id/repo/20699/Sistem-Informasi-Manajemen-Laboratorium-Sekolah-Berbasis-Web
3. SITOKE Berbasis Web: https://repository.bsi.ac.id/repo/36158/Sertifikat-dan-Manual-Book-HaKI-Sistem-Informasi-Toko-Kerudung-%28SITOKE%29-Berbasis-Web
4. Sistem Informasi Manajemen PT Global Integrasi Data: https://repository.bsi.ac.id/repo/42637/Sistem-Informasi-Manajemen-Berbasis-Web-Pada-PT.-Global-Integrasi-Data
5. Sistem Informasi PKM: https://repository.bsi.ac.id/repo/31480/Program-Komputer-%28Sistem-Informasi-Program-Kreativitas-Mahasiswa-%28PKM%29
6. Portal RT Berbasis Website: https://repository.bsi.ac.id/repo/28743/Aplikasi-Ke-RT-An-Berbasis-Website-%28Portal-RT%29
7. SI-AJAR: https://repository.bsi.ac.id/repo/34036/Sistem-Informasi-Belajar-Mengajar-%28SI-AJAR%29
8. SIMPAUD: https://repository.bsi.ac.id/repo/32446/SIMPAUD-%28Sistem-Informasi-Monitoring-Perkembangan-Anak-Usia-Dini%29
9. SISCA-QR: https://repository.bsi.ac.id/repo/45221/SISCA-QR-%28SISTEM-INFORMASI-PEMESANAN-MENU-CAFE-BERBASIS-QRCODE%29
10. SIMAPURE: https://repository.bsi.ac.id/repo/33636/SIMAPURE-%28Sistem-Informasi-Manajemen-Penjualan-Furniture%29
11. Sistem Informasi Akuntansi CV Mitra Abadi: https://repository.nusamandiri.ac.id/repo/files/245834/download/Program-Sistem-Informasi-Akuntansi-Pada-Biro-Jasa-Cv-Mitra.pdf
12. SIBERLINE: https://repository.nusamandiri.ac.id/repo/files/241214/download/2.-b.-Manual-Book-SIBERLINE-Sistem-Informasi-Pembelajaran-Online.pdf
13. Manual Sistem Informasi Penjualan Politeknik Baubau: https://www.simprod4mpi.com/uploads/Layanan_Publik/37-LayananPublik.pdf
14. Aplikasi Perpustakaan SD, Universitas Dinamika: https://repository.dinamika.ac.id/id/eprint/4162/

Jangan menyalin teks panjang, gambar, diagram, logo milik pihak lain, atau kode dari contoh tersebut ke hasil akhir. Referensi ini hanya untuk praktik organisasi informasi dan visualisasi.

---

## 2. ATURAN RESMI UNDIP YANG BERLAKU UNTUK TUGAS INI

### 2.1. Penetapan jenis ciptaan

- **Jenis:** `Karya Lainnya`.
- **Subjenis:** `Program Komputer`.
- **Objek:** aplikasi/website nyata yang kode sumbernya dikembangkan pencipta terkait.
- **Bukan:** buku panduan sebagai objek pencatatan tersendiri, kecuali ada keputusan resmi berbeda.

**Sumber spesifik:** `references/01_Panduan_Resmi_HKI_UNDIP.pdf`, **halaman PDF 29**, tabel `Karya Lainnya → Program Komputer`.

### 2.2. Komponen substantif contoh ciptaan

Panduan UNDIP meminta **buku panduan yang menjelaskan cara penggunaan program komputer, lengkap dengan kode sumber/source code, dihimpun dalam satu berkas PDF**. Dalam konteks tugas ini, bangun dulu satu **DOCX lengkap** yang dapat diekspor menjadi satu PDF dengan konten yang sama.

Komponen yang secara eksplisit disebut untuk cover:

- **Logo UNDIP** yang sah dan digunakan sesuai aturan identitas institusi.
- **Nama pencipta/inventor** yang tepat dan konsisten dengan formulir.
- **Judul ciptaan** yang tepat dan konsisten dengan formulir.

Tambahkan tahun, versi, atau informasi lembaga bila relevan serta sudah dikonfirmasi. Jangan menambahkan nama dosen pembimbing atau institusi sebagai pencipta kecuali benar-benar tercantum dalam data pengajuan dan ada kontribusi yang sesuai.

### 2.3. Catatan khusus dari halaman yang sama

1. Pastikan semua gambar dan sumber tidak melanggar hak cipta, lalu cantumkan sumber bila diperlukan.
2. **Jangan menggunakan Canva** dalam proses penyusunan dokumen menurut catatan panduan UNDIP.
3. Nama pencipta pada hasil karya **harus sama** dengan nama pada formulir dan dokumen administrasi.
4. Jangan mencampuradukkan aturan kategori `Buku`, `Buku Panduan/Petunjuk`, `Booklet`, `Modul`, atau `Paten` dengan ketentuan `Program Komputer`. Aturan minimal 49 lembar untuk kategori karya tulis tertentu **bukan** aturan untuk Program Komputer.

### 2.4. Administrasi yang terpisah dari manual book

Panduan UNDIP halaman PDF 7–19 menjabarkan sekurang-kurangnya:

- Formulir Permohonan Ciptaan.
- Surat Pernyataan.
- Surat Pengalihan Hak Cipta.
- KTP seluruh pencipta dalam format yang ditentukan universitas.
- Dokumen Tanda Terima Berkas HKI.
- **Konsultasi karya kepada Tim Inovasi UNDIP**.

Agen **tidak boleh menggabungkan scan KTP atau formulir dengan manual book** kecuali secara eksplisit dibutuhkan oleh proses unggah resmi. Berkas administratif adalah deliverable terpisah. Jika pengguna belum memberikan data pribadi, buat `working/administrative_checklist.md` tanpa mengarang atau meminta untuk mengirim foto KTP melalui chat.

### 2.5. Aturan dokumen administrasi yang perlu dicatat

- Template formulir resmi UNDIP harus digunakan **tanpa mengubah bagian hitam, font, spacing, margin, ukuran atau struktur bawaannya**. Ini aturan **formulir**, bukan otomatis ketentuan font manual book.
- Nama para pencipta pada Formulir Permohonan dipisah titik koma (`;`).
- Alamat pencipta pertama mengikuti alamat KTP secara lengkap.
- Nomor HP/email menggunakan milik pencipta pertama jika itu yang diatur formulir.
- Uraian ciptaan untuk permohonan sekitar **2–3 kalimat**, berbeda dengan bab deskripsi lengkap dalam manual book.
- Nama mahasiswa dalam Surat Pengalihan sesuai SIAP; nama/gelar dosen sesuai E-Duk.
- Surat Pernyataan dan Surat Pengalihan menggunakan ketentuan tanda tangan serta materai sesuai panduan UNDIP.
- Jangan memutuskan pihak pemegang hak cipta tanpa memeriksa perjanjian, kontribusi pencipta, dan keputusan resmi.

### 2.6. Ketentuan yang TIDAK dinyatakan untuk Program Komputer

Panduan UNDIP **tidak menetapkan** angka minimum halaman manual, jumlah gambar, aturan font/margin spesifik manual, kewajiban bab tertentu, angka minimum baris kode, batas presentasi arsitektur, maupun format baku isi per fitur. Maka gunakan standar dokumentasi profesional sebagai **rekomendasi internal**, jangan mengatasnamakan universitas.

**Tidak ada batas ukuran file buatan dalam mandat ini.** Kerjakan dokumen lengkap. Saat benar-benar mengunggah ke portal, verifikasi ketentuan teknis yang berlaku dan tangani persyaratan tersebut sebagai langkah administratif terpisah.

---

## 3. DEFINISI RUANG LINGKUP, SUMBER BUKTI, DAN INTEGRITAS

### 3.1. Kategori klaim dan bukti

Setiap fakta yang akan ditulis wajib memiliki status:

- **[VERIFIED-CODE]**: diketahui dari kode, path file, konfigurasi, skema, atau test.
- **[VERIFIED-UI]**: telah terlihat, dipraktikkan, dan diverifikasi melalui aplikasi berjalan dengan Playwright MCP.
- **[VERIFIED-BOTH]**: kode dan UI mendukung klaim yang sama; pilihan terbaik untuk fitur inti.
- **[DOCUMENTED-ONLY]**: hanya ada di README/wiki/dokumentasi, belum terbukti berfungsi.
- **[NOT-AVAILABLE]**: tidak dapat diakses/diuji, dengan alasan dan langkah reproduksi.
- **[USER-CONFIRMATION]**: memerlukan konfirmasi resmi dari pemilik/civitas (identitas, status kepemilikan, tahun, klaim rilis).

Masukkan provenance ini ke file kerja internal. Dalam manual final, gunakan kalimat pembaca biasa; jangan menampilkan label audit internal kecuali diperlukan untuk transparansi draft.

### 3.2. Perilaku yang dilarang

- Membuat fitur, fungsi, modul, nama menu, jumlah pengguna, atau alur approval yang tidak ada.
- Menganggap nama route otomatis membuktikan UI tersedia dan aksesnya sah.
- Mengklaim fitur berhasil berjalan jika hanya membaca source code.
- Mengarang screenshot, mockup generatif, atau memoles screenshot hingga tampilannya tidak lagi sama dengan aplikasi.
- Menampilkan screenshot demo pihak ketiga sebagai screenshot aplikasi sendiri.
- Mengasumsikan semua role mendapat izin yang sama.
- Mengakali login/otorisasi, menonaktifkan middleware, memalsukan token, atau menambah akun admin pada production.
- Mengirim kode/rahasia/dataset internal ke layanan pihak ketiga tanpa izin.
- Menyalin `node_modules`, library eksternal, build output, generated files, lockfile besar, file migrasi acak yang tidak relevan, atau secret ke lampiran program.
- Mengambil screenshot langsung dari lingkungan produksi yang berisi informasi siswa/pelanggan/pasien/keuangan riil tanpa sanitasi dan otorisasi.
- Menyunting source code produksi hanya supaya screenshot tampak lebih baik.
- Melaporkan pekerjaan selesai ketika DOCX belum dirender dan diverifikasi.

### 3.3. Dokumen internal vs final

Pisahkan:

- **Final yang dapat diberikan kepada pihak pengajuan**: DOCX dan PDF manual, jika tersedia.
- **Artefak kerja internal**: audit codebase, catatan sumber kode, screenshot mentah, inventarisasi route, catatan missing data, log screenshot, dan QA.
- **Rahasia**: environment variables, API keys, token, cookies, password dan detail sensitif lain tidak masuk keduanya.

---

## 4. FASE 0: INVENTARISASI REPOSITORY DAN LINGKUNGAN

Sebelum menulis narasi atau menangkap screenshot:

1. Identifikasi root project, workspace/monorepo, package manager, framework dan runtime.
2. Periksa `README`, `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `next.config.*`, `vite.config.*`, `astro.config.*`, `tsconfig`, `.env.example`, `docker-compose*.yml`, file konfigurasi deployment, serta struktur source.
3. Catat branch aktif, Git commit hash, tanggal audit, status dirty working tree (tanpa menyertakan rahasia).
4. Identifikasi server, database, storage, worker, queue, cron job, API eksternal dan integrasi yang benar-benar diperlukan.
5. Verifikasi alat pembuat DOCX, renderer DOCX, dan Playwright MCP sudah tersedia. Jangan berasumsi bahwa nama package otomatis berarti MCP terpasang.
6. Cari dokumentasi lama di repository, tetapi jadikan itu titik awal, bukan satu-satunya bukti.
7. Klasifikasikan apakah aplikasi terdiri dari website publik, admin panel, portal pelanggan, atau sub-aplikasi terpisah. Dokumentasikan hubungan antarbagian.
8. Buat `working/repository_inventory.md` yang mencatat sistem secara ringkas dan bukti file.

Contoh perintah eksplorasi **read-only** yang boleh diadaptasi:

```bash
pwd
find . -maxdepth 2 -type f \( -name 'package.json' -o -name 'README*' -o -name 'docker-compose*.yml' -o -name '*.config.*' \) | head -100
git rev-parse HEAD
git status --short
git ls-files | sed -n '1,150p'
```

Contoh pencarian untuk aplikasi berbasis TypeScript, **hanya jika relevan**:

```bash
rg -n 'export (default |async )?function|export const|route\.ts|page\.tsx|layout\.tsx' src app pages 2>/dev/null | head -200
rg -n 'middleware|proxy\.ts|requireRole|hasPermission|authorize|canAccess|permission' src app pages 2>/dev/null | head -200
rg -n 'router\.(get|post|patch|put|delete)|export async function (GET|POST|PATCH|PUT|DELETE)' src app pages 2>/dev/null | head -200
```

**Jangan mengulang catatan contoh tersebut secara buta jika repo menggunakan framework lain.** Untuk Laravel, Django, Express, NestJS, Rails, Spring, dan sebagainya, gunakan pola audit setara.

### 4.1. Hal yang perlu disimpulkan (bukan ditebak)

| Aspek | Pertanyaan penelitian |
|---|---|
| Nama resmi | Nama produk sebenarnya? Nama repo mungkin berbeda. |
| Kategori | Website informasi, administrasi, LMS, ERP, POS, layanan publik, dsb.? |
| Teknologi | Frontend, backend, database, API, UI framework apa yang benar digunakan? |
| Deployment | Ada lingkungan dev/staging/production? Mana yang aman untuk pengambilan bukti? |
| Status rilis | Fitur saat ini production-ready, staging-only, feature-flagged atau unfinished? |
| Autentikasi | Login metode apa? SSO, email/password, OAuth, dsb.? |
| Otorisasi | Role, permission, tenancy, policy mana yang diterapkan? |
| State data | Apakah fitur memerlukan data awal atau status transaksi tertentu? |
| Dependensi | Fitur tertentu tergantung storage, email service, job, API eksternal? |
| Kepemilikan | Kode original yang dikembangkan oleh pencipta vs komponen open source? |

---

## 5. FASE 1: AUDIT MENDALAM CODEBASE DAN PEMETAAN FITUR

### 5.1. Route, menu, dan halaman

Buat peta lengkap, termasuk:

- Landing page/home, login, registrasi, reset password jika ada.
- Layout dashboard dan menu utama.
- Setiap modul utama dan submodul.
- List/detail/create/edit/delete yang benar-benar tersedia.
- Filter, sorting, search, pagination, tabs, drawer, modal, unggah/unduh berkas, ekspor, cetak dan laporan jika ada.
- Fitur workflow seperti submit, approve, reject, cancel, close, draft, finalize, lock, sync, publish jika ada.
- Notifikasi, pengaturan akun, profil, keamanan, role/permission, pengelolaan tenant bila relevan.
- Validasi, error state, empty state, loading dan izin akses yang penting untuk pengguna.
- Mobile-responsive UI hanya jika didukung dan relevan dengan fungsi produk.

Untuk framework yang menggunakan file routing, telusuri route groups, dynamic segments, parallel/intercepting routes, rewrites, middleware/proxy, redirects dan komponen page-level. Jangan memasukkan internal API route sebagai halaman navigasi.

### 5.2. Pemetaan role/permission

Bangun **matriks akses aktual**, berdasarkan guard di backend dan frontend:

| Modul | Aksi | Administrator | Operator | Pengguna Umum | Bukti |
|---|---|---|---|---|---|
| Contoh | Membaca data | Verifikasi | Verifikasi | Verifikasi | Path file dan screenshot |

Kolom role harus diambil dari repo, jangan gunakan nama contoh secara permanen. Pisahkan izin `view`, `create`, `edit`, `delete`, `approve`, `export`, `manage` sesuai implementasi nyata. Perhatikan tenant isolation dan peran yang belum dapat diuji.

### 5.3. Modul berbasis alur kerja

Untuk setiap alur yang melibatkan beberapa halaman/status, petakan:

- **Tujuan bisnis** alur.
- **Aktor yang berwenang**.
- **Prasyarat** data, role, dan status awal.
- **Urutan transisi** yang didukung oleh backend.
- **Data yang berubah** setelah transisi.
- **Pengecualian** yang dinyatakan dalam kode (misalnya status terlarang).
- **Akibat terhadap modul lain** jika nyata.
- **Transaksi/rollback** jika relevan.

Jangan mengarang state machine ideal. Jika CRUD tertentu hanya ada di kode tetapi halaman belum ada, bedakan secara jelas.

### 5.4. Audit business logic

Identifikasi service/controller/use case utama, schema validator, aturan perhitungan, relasi data, kebijakan akses, background jobs, ekspor, impor dan integrasi. Dokumentasikan secara ringkas dari perspektif pembaca manual, bukan dari perspektif implementasi semua file.

### 5.5. Persiapan matriks audit

Buat `working/feature_matrix.csv` atau `.md`, **minimal** memiliki kolom:

```text
feature_id,modul,submodul,route,aksi,role,prasyarat,langkah,hasil,
frontend_evidence,backend_evidence,db_evidence,ui_test_status,
screenshot_path,manual_section,status,notes
```

Nilai `status` dibatasi menjadi `documented`, `verified`, `blocked`, `not_applicable` sesuai arti yang dijelaskan. Prioritaskan kemampuan nyata yang penting bagi pengguna. Jangan melaporkan 100% cakupan jika ada flow yang tidak dapat diuji.

### 5.6. Kebijakan cakupan

- Setiap **modul utama yang sudah tersedia** wajib memperoleh dokumentasi.
- Setiap **alur kritis** perlu dijelaskan langkah demi langkah dengan bukti.
- Variasi kecil dari interaksi serupa dapat digabung jika tidak menyebabkan informasi hilang.
- Fitur admin tersembunyi di balik permission harus diuji sesuai akun yang tersedia, bukan hanya disimpulkan dari komponen.
- Fitur yang terdeteksi tetapi tidak dapat diakses masuk ke laporan gap, tidak dipoles sebagai fitur terverifikasi.

---

## 6. FASE 2: MENJALANKAN APLIKASI DALAM LINGKUNGAN AMAN

### 6.1. Pemilihan lingkungan

Urutan preferensi:

1. Lokal dengan database development atau seed dummy yang resmi.
2. Staging yang ditentukan pemilik dan dapat diakses dengan kredensial uji.
3. Lingkungan lain yang secara eksplisit diizinkan dan tidak berisiko.

**Jangan menjalankan operasi tulis/destruktif di production** untuk kebutuhan manual. Jika hanya ada production, dokumentasikan tampilan read-only yang diizinkan dan minta jalur aman untuk aksi tulis; tetap selesaikan bagian lain.

### 6.2. Persyaratan menjalankan aplikasi

- Ikuti perintah yang didokumentasikan dalam repository (`pnpm dev`, `npm run dev`, `docker compose up`, dsb.) sesuai stack nyata.
- Gunakan `.env.example` untuk memahami variabel, jangan menampilkan isi rahasia `.env` ke laporan atau log.
- Pastikan migrasi dan seed hanya mengenai database uji.
- Verifikasi health aplikasi, koneksi database, API, aset, fonts, dan kebutuhan storage.
- Gunakan data uji sintetis dengan nama dan nilai yang jelas bukan informasi riil.
- Catat `base_url` lokal/staging dan commit revisi yang didokumentasikan.
- Jika data dummy perlu dibuat, periksa dampak perintah seed dan sifat idempotensinya terlebih dahulu.
- Jangan membuka port publik, mengunggah data internal, atau menonaktifkan autentikasi agar navigasi lebih mudah.

### 6.3. Akun role

Untuk setiap role yang dibutuhkan, gunakan **akun demo resmi atau akun uji yang disediakan pengguna**. Jangan minta password asli agar ditulis di Markdown. Jika akun belum tersedia, tandai screenshot role sebagai *blocked*. Jangan mencoba bypass izin.

---

## 7. FASE 3: PLAYWRIGHT MCP WAJIB UNTUK SCREENSHOT

### 7.1. Instruksi integrasi MCP

Anda **WAJIB** menemukan dan memanggil tool dari server Playwright MCP yang benar-benar tersedia di runtime agen. Nama namespace bisa bervariasi, misalnya `playwright`, `mcp_playwright`, atau prefix yang diberikan client. **Jangan mengarang nama tool namespace**. Tool inti yang harus dicari/digunakan berdasarkan dokumentasi resmi:

| Fungsi | Nama inti tool MCP yang relevan |
|---|---|
| Membuka URL | `browser_navigate` |
| Membaca struktur halaman | `browser_snapshot` |
| Klik elemen | `browser_click` |
| Mengisi input | `browser_type` / `browser_fill_form` |
| Memilih opsi | `browser_select_option` |
| Menunggu hasil | `browser_wait_for` |
| Mengubah viewport | `browser_resize` |
| Menyimpan screenshot | **`browser_take_screenshot`** |
| Mengecek console | `browser_console_messages` |
| Mengecek request | `browser_network_requests` |
| Evaluasi DOM jika diperlukan | `browser_evaluate` |
| Menutup sesi | `browser_close` |

Dokumentasi resmi: https://github.com/microsoft/playwright-mcp dan https://playwright.dev/mcp/tools/screenshots. API dapat berubah; ikuti schema tool yang benar-benar diiklankan runtime.

**Penggunaan screenshot bukan pengganti aksesibilitas/snapshot.** Gunakan snapshot untuk menemukan ref elemen interaktif; gunakan screenshot untuk bukti visual. Jangan menggunakan koordinat buta bila tool snapshot menyediakan ref.

### 7.2. Konfigurasi contoh apabila MCP belum tersedia

Contoh server standar (sesuaikan dengan konfigurasi client agent yang sedang dipakai, **jangan memodifikasi setup tanpa izin**):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Penting:** Bentuk konfigurasi bergantung pada coding agent (misalnya OpenCode, Codex, Claude Code, Cursor). Jika Playwright MCP tidak dapat dipasang/diakses, laporkan keterbatasan tersebut beserta alasan teknis. Jangan mengklaim telah menggunakan Playwright MCP padahal hanya memakai headless script atau screenshot palsu. Bila tersedia browser automation alternatif, hasil alternatif harus diberi label sesuai alat yang sebenarnya, bukan disamakan dengan bukti MCP.

### 7.3. Loop eksplorasi UI yang benar

Untuk **setiap fitur**:

1. Buka URL aplikasi yang aman (`browser_navigate`).
2. Ambil struktur halaman saat ini (`browser_snapshot`).
3. Login melalui akun uji yang berwenang jika dibutuhkan, dengan input rahasia melalui mekanisme aman.
4. Navigasikan sidebar/menu dengan `browser_click` berdasarkan ref dari snapshot.
5. Tangani redirect dan loading; tunggu penanda yang benar-benar menyatakan UI siap (`browser_wait_for`).
6. Ambil snapshot lagi setelah perubahan halaman.
7. Jika alur melibatkan form, jalankan dengan data sintetis yang wajar; buktikan validation/success state secara aman.
8. Pastikan screenshot tidak menampilkan data sensitif, token, alamat email/telepon asli, atau session storage.
9. Ambil **`browser_take_screenshot`** menggunakan nama file terstruktur dan simpan secara permanen di folder screenshot audit.
10. Inspeksi hasil gambar. Ulangi bila ada loading, overlay, cropping, tabel kosong yang tidak mewakili fungsi, dialog menutupi data, atau rendering yang belum sempurna.
11. Catat bukti pada matriks fitur, caption, role, route, dan keadaan UI.
12. Lanjutkan ke state lain yang penting: form tambah, detail, edit, hasil simpan, daftar, laporan, cetak jika ada.

### 7.4. Pengaturan screenshot yang direkomendasikan

- Mulai desktop viewport sekitar **1440 × 900** atau **1600 × 900** agar dashboard terbaca; ukuran tersebut **rekomendasi**, bukan aturan UNDIP.
- Pertahankan ukuran viewport konsisten untuk tampilan sejenis.
- Pertimbangkan `scale: "device"` untuk screenshot beresolusi tinggi jika tool mendukung.
- Format **PNG** untuk UI dengan tulisan kecil; JPEG/WebP dapat digunakan bila kualitas tulisan tetap terjaga. Jangan kompres secara membabi buta.
- Gunakan `fullPage: true` untuk halaman panjang bila berguna, tetapi hindari menempatkan satu gambar full-page sangat tinggi pada satu halaman DOCX sampai teks tidak terbaca. Pecah menjadi beberapa screenshot fokus jika perlu.
- Gunakan `target` untuk screenshot elemen modal/form/tabel bila mendukung, tetapi simpan juga konteks halaman jika perlu.
- Hindari menu popover, tooltip, dan browser permission prompt yang tidak relevan.
- Jangan memanipulasi tanggal, angka, nilai tabel atau status secara visual agar tampak seperti fitur telah berhasil.
- Sebaiknya gunakan zoom browser 100%, tema UI konsisten, dan screenshot tanpa browser chrome bila output tool demikian.
- Hindari watermark editor dan indikator debugging.

### 7.5. Format penamaan screenshot

```text
working/screenshots/
  01-auth/
    auth-login-default.png
    auth-login-validation.png
  02-dashboard/
    admin-dashboard-overview.png
  03-example-module/
    admin-example-list.png
    admin-example-create-form.png
    admin-example-create-success.png
    admin-example-detail.png
    admin-example-edit-form.png
  04-reports/
    operator-report-filter.png
    operator-report-result.png
```

**Nama di atas contoh.** Gunakan nama role dan modul yang benar-benar ditemukan pada aplikasi.

### 7.6. Manifest screenshot WAJIB

Buat `working/screenshot_manifest.csv`:

```text
image_id,file_path,feature_id,role,route,viewport,state,caption,
source_environment,captured_with,verified_at,privacy_checked,notes
```

`captured_with` harus secara jujur menyebut `Playwright MCP` hanya jika memang dipanggil. Pastikan setiap gambar yang dimasukkan ke DOCX tercantum di manifest. Setiap screenshot harus dikaitkan dengan paragraf yang menjelaskan fungsi yang dapat diamati.

### 7.7. Penanganan data sensitif pada screenshot

- Gunakan akun uji dengan nama netral; jangan memotret profil pegawai atau data pelanggan asli.
- Jika data demo mengandung unsur sensitif, pilih data sintetis di lingkungan aman terlebih dahulu.
- Jika redaksi diperlukan, lakukan **redaksi permanen (pixel removal/solid masking)** pada salinan screenshot sebelum menyisipkan ke DOCX; jangan hanya membuat overlay shapes di Word karena gambar asli bisa tetap tertanam.
- Simpan screenshot mentah hanya jika sah dan aman. Jangan memasukkannya ke ZIP final untuk pihak luar tanpa izin.
- Jangan masukkan token di address bar, QR code login, cookies, atau detail jaringan sensitif.
- Jangan menggunakan screenshot yang masih memperlihatkan database produksi atau data transaksi pribadi.

### 7.8. Kapan screenshot dianggap berhasil

Screenshot diterima apabila:

- File nyata tersedia, dapat dibuka, dan berasal dari aplikasi yang benar.
- Role, route, dan state sesuai caption.
- Komponen yang diklaim terlihat jelas.
- Tidak menampilkan spinner/error/placeholder yang membuat klaim fitur palsu.
- Teks UI cukup tajam setelah dipasang pada ukuran final dokumen.
- Data sensitif telah ditangani.
- Sudah diverifikasi terhadap manifest dan isi manual.

---

## 8. FASE 4: RANCANGAN STRUKTUR FINAL MANUAL BOOK DOCX

Gunakan struktur berikut **sebagai rancangan default**. Anda boleh menambah/memecah subbab berdasarkan jumlah fitur aktual. Jangan menghapus komponen UNDIP: identitas cover, panduan penggunaan, dan kode sumber. **Tidak boleh mengarang nama bab/modul produk.**

### Halaman awal

**Cover (tanpa nomor halaman terlihat):**

```text
[LOGO RESMI UNIVERSITAS DIPONEGORO]

MANUAL BOOK
[NAMA RESMI CIPTAAN / PROGRAM KOMPUTER]

[Opsional: deskripsi singkat aplikasi yang benar]
[Versi program apabila telah diverifikasi]

DISUSUN OLEH / PENCIPTA:
1. [Nama lengkap Pencipta 1]
2. [Nama lengkap Pencipta 2]
...

UNIVERSITAS DIPONEGORO
[TAHUN YANG SUDAH DIKONFIRMASI]
```

**Catatan:** urutan nama mengikuti persyaratan/formulir; tahun harus sesuai dokumen atau data yang disetujui. Jangan menyimpulkan bahwa semua kontributor Git otomatis pencipta formal atau sebaliknya.

**Halaman identitas ciptaan** (direkomendasikan):

| Field | Nilai |
|---|---|
| Judul ciptaan | Judul resmi, identik dengan formulir |
| Jenis/subjenis | Karya Lainnya / Program Komputer |
| Platform | Web / lintas platform jika benar |
| Pencipta | Nama resmi sesuai pengajuan |
| Pemegang hak cipta | Sesuai dokumen pengajuan; jangan asumsikan |
| Versi yang didokumentasikan | Sesuai tag/release/commit yang dicatat |
| Lingkup fitur | Cakupan hasil audit |
| Status publikasi | Sesuai data yang dikonfirmasi |

**Daftar Isi** otomatis dengan heading Word.  
**Daftar Gambar** otomatis, jika gambar cukup banyak.  
**Daftar Tabel** jika banyak tabel.  
**Kata Pengantar** opsional, singkat, tidak menggantikan informasi substantif.

### BAB I. PENDAHULUAN

1.1. Latar Belakang  
1.2. Tujuan Pengembangan Aplikasi  
1.3. Manfaat Aplikasi  
1.4. Ruang Lingkup Aplikasi  
1.5. Identitas dan Versi Ciptaan (jika tidak ditempatkan di awal)  
1.6. Batasan dan Prasyarat Penggunaan

**Target editorial:** penjelasan ringkas, spesifik, berbasis fungsi riil; tidak berisi sejarah umum internet atau teori framework berhalaman-halaman.

### BAB II. GAMBARAN UMUM APLIKASI

2.1. Deskripsi Sistem  
2.2. Arsitektur Fungsional Tingkat Tinggi (opsional, bila benar)  
2.3. Kelompok Pengguna / Role dan Hak Akses  
2.4. Daftar Modul dan Fitur Utama  
2.5. Persyaratan Akses Pengguna (browser, koneksi, akun jika relevan)  
2.6. Alur Navigasi Umum  
2.7. Alur Bisnis Inti (bila aplikasi memiliki workflow multi-modul)

Masukkan matriks role/permission sederhana yang benar-benar diverifikasi. Diagram boleh dibuat dari implementasi aktual, bukan dari asumsi ideal.

### BAB III. PANDUAN PENGGUNAAN APLIKASI

Bagian ini adalah bagian **inti dokumentasi pengalaman pengguna**. Pecah secara logis, misalnya:

3.1. Akses Website dan Login  
3.2. Pengenalan Dashboard  
3.3. Navigasi dan Pengaturan Akun  
3.4. [Modul Utama A]  
3.5. [Modul Utama B]  
3.6. [Modul Utama C]  
3.n. [Modul Laporan/Ekspor/Cetak]  
3.n+1. Logout dan Penanganan Kendala Umum

**Cara mengelompokkan:** jika role sangat berbeda, subbagian dapat dipisahkan sebagai `Panduan Administrator`, `Panduan Operator`, dan sebagainya. Jika mayoritas halaman sama, kelompokkan berdasarkan modul dan beri catatan izin role untuk menghindari duplikasi panjang.

Untuk **setiap subfitur substantif**, gunakan template detail pada Bagian 9 dokumen ini.

### BAB IV. DOKUMENTASI TEKNIS PROGRAM

4.1. Gambaran Arsitektur Implementasi  
4.2. Teknologi Utama (frontend, backend, bahasa, database)  
4.3. Struktur Komponen/Modul Aplikasi  
4.4. Alur Komunikasi dan Pemrosesan Data  
4.5. Konsep Autentikasi dan Otorisasi (tanpa rahasia)  
4.6. Model Data dan Relasi Utama (bila relevan)  
4.7. Integrasi Eksternal yang benar-benar digunakan  
4.8. Fitur Keamanan Teknis yang dapat dibuktikan  
4.9. Identifikasi Versi Program

Jangan memasukkan kunci rahasia, string koneksi database, atau isi file konfigurasi sensitif. Jangan menulis klaim keamanan berlebihan seperti *100% aman*, *end-to-end encrypted*, atau *bebas kerentanan* tanpa dasar pengujian khusus.

### BAB V. KODE SUMBER / SOURCE CODE PROGRAM

5.1. Ruang Lingkup Kode Sumber yang Disertakan  
5.2. Identifikasi Repository, Versi dan Commit (tanpa URL privat jika tidak boleh dipublikasikan)  
5.3. Peta Direktori Program dan Tanggung Jawab Modul  
5.4. Implementasi Modul Antarmuka  
5.5. Implementasi API/Business Logic  
5.6. Implementasi Validasi dan Otorisasi  
5.7. Implementasi Struktur Data/ORM jika relevan  
5.8. Implementasi Modul Utama Lainnya  
5.9. Catatan Dependensi dan Kode Pihak Ketiga  
5.10. Indeks File Kode Sumber yang Dilampirkan  
5.11. **Lampiran source code utama**, disusun per modul/path.

Sajikan **kode asli karya pencipta** dengan pemisahan file, identitas path, nomor baris atau penanda awal/akhir, dan penjelasan singkat. Jangan hanya menempel contoh `Hello World` atau instalasi framework lalu menganggap bukti program memadai. Karena UNDIP menyebut kode sumber sebagai bagian dokumen, usahakan cakupan kode yang benar-benar mewakili aplikasi secara utuh. Jika ada kode yang tidak dapat disertakan karena hak pihak ketiga atau keamanan, beri alasan dan manifest pengecualian, kemudian tandai untuk verifikasi Tim Inovasi UNDIP.

### BAB VI. PENUTUP (opsional namun dianjurkan)

6.1. Ringkasan Kemampuan Aplikasi  
6.2. Batasan Dokumentasi dan Versi  
6.3. Penegasan Ruang Lingkup Ciptaan

Hindari klaim hukum yang menyatakan bahwa pencatatan HKI telah berhasil bila surat pencatatan belum diterbitkan.

### LAMPIRAN

- Lampiran A: Daftar gambar/screenshot tambahan bila tidak cukup di bab penggunaan.
- Lampiran B: Diagram arsitektur/workflow bila relevan.
- Lampiran C: Tabel ringkasan endpoint atau struktur data nonrahasia bila mendukung penjelasan.
- Lampiran D: Source code tambahan atau indeks kode yang belum dibahas.
- Lampiran E: Daftar referensi aset/ilustrasi eksternal dan dokumentasi pendukung.

**Catatan sumber:** struktur BAB I–VI merupakan rekomendasi dokumentasi profesional; bukan pembagian bab yang diperintahkan secara eksplisit oleh UNDIP.

---

## 9. STANDAR PENULISAN SETIAP FITUR

### 9.1. Template wajib per fitur

Gunakan format konseptual berikut dan isi dengan fakta yang telah diaudit:

```markdown
### 3.X.Y. [Nama Fitur Nyata]

**Fungsi:** [Tujuan fitur dan manfaat langsung, 1–3 kalimat].

**Pengguna yang berwenang:** [Nama role atau permission aktual].

**Prasyarat:** [Harus login, data awal tersedia, status dokumen tertentu, dst.].

**Langkah penggunaan:**
1. [Buka halaman/menu yang benar].
2. [Pilih tombol/aksi sesuai label UI].
3. [Isi field/pilih opsi yang benar-benar tersedia].
4. [Lakukan submit/simpan/cetak sesuai operasi nyata].
5. [Periksa hasil yang benar-benar ditampilkan].

**Hasil:** [Perubahan keadaan/data/response yang diverifikasi].

**Catatan:** [Batasan role, validasi, atau exception yang penting].

[Gambar screenshot asli yang sesuai state UI]
*Gambar 3.X. Tampilan [fitur] saat [state].*
```

Jangan tampilkan header `Pengguna yang berwenang` jika fitur publik tanpa autentikasi, kecuali relevan. Seluruh langkah harus memakai istilah UI persis, misalnya `Tambah`, `Simpan`, `Terbitkan`, bukan sinonim yang tidak cocok dengan tombol sebenarnya.

### 9.2. Gaya bahasa

- Bahasa Indonesia formal, jelas, spesifik, aktif, dan netral.
- Gunakan kalimat seperti `Klik tombol Tambah`, `Pilih periode`, `Sistem menampilkan daftar transaksi`.
- Hindari klaim marketing, hiperbola, jargon tanpa arti, dan cerita panjang seputar tren teknologi.
- Jelaskan apa yang benar-benar dilakukan pengguna, bukan kuliah teori pemrograman.
- Beri konteks singkat sebelum screenshot, lalu jelaskan hasil setelahnya.
- Gunakan istilah secara konsisten: `pengguna`, `administrator`, `dashboard`, `menu`, `formulir`, `transaksi`, dsb.
- Jangan menggunakan referensi dalam manual final sebagai pengganti bukti fitur aplikasi sendiri.
- Jika sebuah state belum terverifikasi, jangan tulis secara definitif.

### 9.3. Screenshot dan caption

- Setiap screenshot mendapat nomor dan caption (misalnya `Gambar 3.5. Formulir Penambahan Data`).
- Teks paragraf harus mereferensikan gambar yang tepat.
- Screenshot harus cukup besar untuk dibaca tanpa zoom berlebihan.
- Crop sedemikian rupa sehingga tombol/form yang dibahas terlihat, namun tidak menyesatkan konteks.
- Anotasi panah/nomor diperbolehkan pada salinan gambar jika akurat; tidak boleh mengubah isi data atau fitur.
- Jangan memaksakan 2–4 screenshot per halaman bila teks/form menjadi kecil dan tidak terbaca.
- Untuk alur kompleks, pecah screenshot menjadi tahapan `before`, `during`, dan `after`.

### 9.4. Error, empty state, dan validasi

Masukkan screenshot error validasi atau empty state hanya jika fungsional secara edukatif. Jangan menghabiskan banyak halaman mendokumentasikan error internal yang bukan bagian normal aplikasi. Cantumkan indikasi bila sistem menolak operasi karena data invalid, role tidak berwenang, atau transisi status tidak diperbolehkan.

---

## 10. PEMBAGIAN SCREENSHOT UNTUK WEBSITE YANG KOMPLEKS

Gunakan daftar pemeriksaan berikut, disaring berdasarkan fitur nyata:

| Kelompok | Screenshot utama | Screenshot pendukung |
|---|---|---|
| Website publik | Home/landing, navigasi | Informasi halaman, formulir kontak, pencarian |
| Autentikasi | Login | Registrasi, lupa password, validasi jika ada |
| Dashboard | Ringkasan per role | Chart, cards, periode/filter |
| Master data | List/tabel | Tambah, edit, detail, filter, pencarian |
| Transaksi | List & form transaksi | Validasi, konfirmasi, hasil status |
| Approval | Daftar permintaan | Dialog setuju/tolak, riwayat status |
| Laporan | Halaman laporan | Filter periode, hasil, print/export |
| Konten/CMS | Daftar konten | Editor, preview, publish/unpublish |
| Manajemen pengguna | Daftar pengguna | Form role, permission, profil |
| Pengaturan | Halaman setting | Modal perubahan, hasil simpan |
| Multi-tenant | Pemilih tenant jika ada | Batas akses dan konfigurasi per tenant |
| Responsif | Mobile tampilan penting | Navigasi sidebar, formulir di mobile |

**Hindari cakupan dangkal:** menangkap satu screenshot dashboard lalu menyebut semua fitur sebagai telah didokumentasikan. Prioritaskan fitur bernilai tinggi, alur pengguna utama, dan kemampuan yang membedakan karya tersebut.

### 10.1. Rancangan screenshot per role

- Role berbeda dengan layar berbeda: screenshot masing-masing bila berbeda signifikan.
- Role berbeda dengan UI sama tetapi izin berbeda: satu screenshot UI dan matriks izin yang benar; tambahkan screenshot perbedaan action button bila perlu.
- Jika UI berubah berdasarkan tenant, demonstrasikan dengan tenant dummy aman apabila relevan.
- Jika suatu halaman hanya bisa diakses setelah status tertentu, siapkan data dummy sesuai state yang diizinkan.

### 10.2. Narasi untuk fitur ekspor/cetak

Jika fitur ekspor/cetak ada, jelaskan jenis file yang nyata, filter data yang berlaku, langkah pengguna, dan hasil. Jangan mengklaim mendukung PDF/CSV/XLSX tanpa memeriksa implementasi dan UI. Jika print preview muncul pada tab/dialog lain, verifikasi dengan Playwright MCP dan dokumentasikan apa yang benar-benar terlihat.

---

## 11. DOKUMENTASI TEKNIS DAN SOURCE CODE YANG AMAN

### 11.1. Menentukan batas karya original

Identifikasi dan pisahkan:

1. Kode aplikasi yang ditulis/dimodifikasi secara substansial oleh pencipta.
2. Konfigurasi yang memegang aspek kreatif/arsitektur program.
3. File generator/framework yang tidak berisi ekspresi original berarti.
4. Dependensi pihak ketiga dan lisensinya.
5. File build/cache, vendored code, binaries, aset stok dan data privat.

Jangan mengklaim hak cipta atas library, framework, logo pihak ketiga, atau komponen open-source yang tidak diciptakan pemohon. Tetap boleh menyebut dependensi sebagai teknologi yang digunakan.

### 11.2. Apa yang dimasukkan dalam dokumen

- Nama path file di repo.
- Versi Git commit atau tag (jika tersedia).
- Kegunaan berkas atau modul.
- Source code asli yang relevan dan dapat diidentifikasi.
- Hubungan antara fitur pada bab penggunaan dan modul sumber kode.
- Indeks code file yang diwakili dan bagian yang dikecualikan.
- Penjelasan singkat yang memastikan pembaca mengerti mengapa kode itu relevan dengan karya.

**Tidak menetapkan angka minimum/maksimum halaman kode.** Kode sumber dapat disajikan dalam lampiran berkala dengan heading path dan nomor baris. Jika kode terlalu luas, agen tetap wajib mempertimbangkan cakupan karya dan menghasilkan manifest lengkapnya; **jangan menggantikan kewajiban yang tertulis di UNDIP dengan link repository tanpa konfirmasi**.

### 11.3. Sanitasi source code

Sebelum penyisipan, periksa semua file yang berpotensi mengandung:

```text
.env, .env.local, .npmrc, private keys, service-account JSON,
JWT secrets, OAuth client secrets, API tokens, database passwords,
production URLs internal, webhook secrets, encryption keys,
backups/dumps, customer data, access tokens, credentials.
```

Jangan menempel source mentah jika mengandung credential. **Jangan mengganti nilai kode secara diam-diam**, karena itu tidak lagi identik dengan sumber. Untuk bagian rahasia yang tak relevan, hilangkan dari lampiran dan catat manifest sanitasi atau beri placeholder terbuka pada transkrip berlabel `disunting untuk keamanan`. Jangan mengubah source repo asli.

### 11.4. Skema database

Jika aplikasi memakai Prisma/SQL/ORM, dokumentasikan entitas dan relasi yang benar-benar merepresentasikan fitur. Jangan menampilkan data database riil, credential, koneksi, atau migrasi historis tak relevan. Untuk arsitektur, fokus pada konsep kunci seperti `User`, `Role`, `Transaction`, `Report` **hanya jika benar-benar ada**.

### 11.5. Diagram

Boleh gunakan diagram komponen, alur, sequence, ERD, dan use case jika membantu menunjukkan ekspresi serta cakupan sistem. Semua diagram harus:

- Direkonstruksi dari kode dan alur aplikasi nyata.
- Memiliki judul, caption, legenda bila perlu.
- Terbaca dalam DOCX yang diekspor.
- Tidak mencantumkan service atau fitur yang belum ada.
- Dihasilkan menggunakan alat yang tidak dilarang panduan UNDIP; **jangan menggunakan Canva**.

---

## 12. PEMBUATAN DOCX PROFESIONAL

### 12.1. Format editorial default (rekomendasi, bukan klaim kewajiban UNDIP)

- **Ukuran halaman:** A4, portrait untuk bagian naratif. Landscape dapat digunakan selektif untuk diagram/tabel lebar jika penanganan section break rapi.
- **Margin:** ±2.5 cm atas/bawah/kanan dan ±3 cm kiri sebagai default konservatif; penyesuaian boleh dilakukan bila masih rapi.
- **Font teks:** Aptos, Calibri, Arial, Times New Roman, atau font standar yang tersedia dan legal. Prefer satu font utama.
- **Body:** ±10.5–11.5 pt dengan spasi 1.15–1.4; pastikan kenyamanan baca.
- **Heading bab:** 15–17 pt bold; subbab 12–14 pt; warna hitam atau gelap konsisten.
- **Kode:** font monospace (Consolas/Courier New) 8.5–9.5 pt atau setara, dengan perhatian khusus terhadap line wrapping.
- **Heading styles nyata:** `Title`, `Heading 1`, `Heading 2`, `Heading 3` agar navigasi Word dan TOC berfungsi.
- **Footer:** nomor halaman otomatis. Header boleh berisi nama aplikasi/bab jika tidak mengganggu.
- **Gambar:** inline dengan paragraf, ukuran proporsional, tidak di-stretch, tidak terpotong.
- **Tabel:** header jelas, lebar kolom masuk halaman, ulangi baris header pada tabel panjang, jangan membuat isi tabel terpotong.
- **Caption:** format konsisten `Gambar x.y. ...` dan `Tabel x.y. ...`.

### 12.2. Aturan layout yang harus dipenuhi

1. Cover tidak boleh tampak seperti poster otomatis generatif atau halaman kosong dengan 3 baris teks kecil.
2. Semua judul bab memulai halaman baru jika membantu navigasi.
3. Daftar isi harus sinkron dengan heading/nomor halaman setelah finalisasi.
4. Hindari heading yatim di akhir halaman; gunakan `keep with next`.
5. Hindari screenshot dan caption terpisah jauh; gunakan `keep with next` atau kontrol paragraf yang sesuai.
6. Hindari halaman kosong, margin negatif, objek floating yang menimpa teks, dan tabel terpotong.
7. Pastikan screenshot horizontal tidak terdistorsi ketika dikecilkan.
8. Ukuran teks pada gambar harus terjaga; jika sebuah screenshot tidak cukup terbaca, ambil crop resolusi lebih tinggi.
9. Nomor halaman harus konsisten dan tidak tertutup footer.
10. Setiap bab penting harus lengkap, bukan hanya placeholder.
11. Heading nomor berjenjang harus konsisten (`1`, `1.1`, `1.1.1` atau pola yang setara).
12. Gunakan page/section breaks seperlunya dan hindari memaksakan aturan estetika yang membuat dokumen tidak stabil.
13. Kode sumber panjang menggunakan line numbers/identitas path agar pembaca tidak kehilangan konteks.
14. Ketika ekspor ke PDF, bookmark/TOC sebaiknya tetap dapat dinavigasi jika tool mendukung.

### 12.3. Cara membuat DOCX

Gunakan alat yang tersedia di lingkungan coding agent, misalnya:

- **Python**: `python-docx` untuk struktur, style, tabel, gambar, nomor halaman; menggunakan OOXML bila perlu untuk TOC/fields.
- **JavaScript/TypeScript**: `docx` (npm) jika repo mendukung.
- **Alternatif dokumen**: Pandoc dengan template referensi yang dirancang rapi jika kualitas akhir dapat dikontrol.

Pemilihan implementasi bebas **selama DOCX akhir valid, editable, dan lolos inspeksi visual**. Jangan bergantung pada kode template yang belum diuji.

### 12.4. Render dan inspeksi WAJIB

Setelah membuat DOCX:

1. Buka dengan renderer Word-kompatibel (Word/LibreOffice atau tool render DOCX).
2. Render seluruh halaman menjadi PNG/PDF untuk pemeriksaan visual.
3. Lakukan pemeriksaan teks secara programatis: jumlah bab, judul, isi placeholder, referensi gambar, panjang dokumen, keberadaan gambar.
4. Lihat halaman visual: cover, daftar isi, awal setiap bab, halaman kode, setiap halaman dengan screenshot besar, akhir dokumen.
5. Pemeriksaan penting tetap berlaku **untuk semua halaman**, bukan hanya sampel representatif; otomatisasi deteksi dapat membantu tetapi jangan menjadi satu-satunya penilaian.
6. Koreksi clipping, overflow, page breaks, gap berlebihan, tabel terpotong, font mismatch, atau screenshot terlalu kecil.
7. Render ulang setelah setiap koreksi sampai tidak ditemukan cacat layout.
8. Konversi DOCX ke PDF dengan alat yang ada, lalu bandingkan jumlah halaman dan posisi konten inti.

**Contoh perintah jika utilitas tersedia** (sesuaikan lokasi sesuai lingkungan):

```bash
python /home/oai/skills/docx/render_docx.py output/Manual_Book_HKI_Nama_Aplikasi.docx --output_dir working/docx_render --emit_pdf
```

Path tersebut hanya contoh lingkungan tertentu. Bila script tidak tersedia, gunakan renderer lokal lain. Jangan mengklaim render berhasil tanpa bukti file/output.

### 12.5. Periksa DOCX secara programatis

Minimal validasi:

- ZIP/OOXML DOCX tidak korup.
- Ada core body text, heading, gambar, caption dan tabel yang benar-benar tertanam.
- Semua screenshot yang disebut ada dalam media DOCX (bukan hanya URL eksternal).
- Daftar isi tidak memperlihatkan pesan `Error! Reference source not found`.
- Field nomor halaman benar.
- Tidak ada placeholder mentah seperti `[TODO]`, `[Nama Pencipta]`, `Lorem Ipsum`, kecuali memang sengaja disiapkan sebagai draft dan dilaporkan *belum siap submit*.
- Tidak ada file path lokal sensitif dalam teks yang diperuntukkan pihak luar.

---

## 13. PENGENDALIAN PRIVASI, KEPEMILIKAN, DAN KEAKURATAN HUKUM

### 13.1. Penentuan pencipta dan pemegang hak cipta

- **Jangan menebak nama pencipta dari Git commit author**. Commit history hanyalah petunjuk kontribusi teknis.
- Pencipta formal harus cocok dengan form UNDIP dan kontribusi nyata yang disetujui.
- Pemegang hak dapat berbeda dari pencipta, terutama jika terdapat pengalihan melalui dokumen yang sah.
- Jangan berasumsi kerja pesanan/kerja tim/penugasan kampus otomatis mengalihkan seluruh hak tanpa memeriksa konteks hukum dan kontrak.
- Jika belum dikonfirmasi, siapkan formulir data yang perlu disahkan internal; jangan masukkan identitas palsu.

### 13.2. Tanggal dan versi

- Gunakan tanggal publikasi/pengumuman pertama hanya dari sumber yang sah dan terkonfirmasi. Tanggal Git commit, deploy pertama, dan tanggal pencatatan bisa berbeda.
- Catat commit hash dan waktu snapshot dokumentasi.
- Hindari menuliskan versi `1.0.0` jika tidak pernah ditetapkan; gunakan `revisi/commit yang didokumentasikan` bila lebih tepat.

### 13.3. Status pencatatan

Manual tidak boleh menyatakan `telah memperoleh HKI`, `telah disahkan DJKI`, atau `dilindungi berdasarkan nomor pencatatan ...` jika data itu tidak ada. Manual disusun sebagai **contoh ciptaan untuk pengajuan pencatatan Hak Cipta**.

### 13.4. Konten milik pihak ketiga

Gunakan logo UNDIP yang resmi dan diizinkan, dengan mempertimbangkan identitas institusi. Hindari memakai screenshot pihak ketiga, gambar stok, komponen komersial, font tanpa lisensi, materi pelanggan, atau dokumen yang haknya tidak jelas. Materi pihak ketiga yang **perlu** disebutkan diberi sumber dan tidak diklaim sebagai karya original.

---

## 14. FASE 5: PIPELINE PEMBUATAN ARTEFAK DAN STRUKTUR DIREKTORI

Hasil kerja disimpan dalam folder terpisah agar tidak mengganggu source aplikasi:

```text
hki-manual-book/
├── INSTRUKSI_UTAMA_CODING_AGENT_HKI_UNDIP.md    # dokumen ini
├── references/
│   ├── 01_Panduan_Resmi_HKI_UNDIP.pdf
│   ├── 02_Manual_Patrolee.pdf
│   ├── 03_Manual_Perpustakaan_Digital.pdf
│   ├── 04_Manual_ONShop.pdf
│   └── 05_Panduan_UM_HKI_Historis.pdf
├── working/
│   ├── reference_review.md
│   ├── repository_inventory.md
│   ├── application_profile.md
│   ├── route_inventory.md
│   ├── role_permission_matrix.md
│   ├── feature_matrix.csv
│   ├── screenshot_manifest.csv
│   ├── screenshots/
│   │   ├── 01-auth/
│   │   ├── 02-dashboard/
│   │   └── ...
│   ├── source_code_manifest.md
│   ├── source_code_sanitization_log.md
│   ├── administrative_checklist.md
│   ├── unresolved_questions.md
│   ├── docx_render/
│   └── qa_report.md
└── output/
    ├── Manual_Book_HKI_<Nama_Aplikasi>.docx
    ├── Manual_Book_HKI_<Nama_Aplikasi>.pdf
    └── DELIVERY_SUMMARY.md
```

Buat folder ini di root workspace atau direktori output yang disepakati. Jangan menghapus folder yang sudah ada dengan nama sama tanpa pemeriksaan.

### 14.1. Urutan pemrosesan

```text
Read references
     ↓
Inspect codebase and version
     ↓
Build route/role/feature/source-code matrices
     ↓
Run safe local/staging app
     ↓
Explore each role/flow via Playwright MCP
     ↓
Capture screenshots + record manifest
     ↓
Write detailed Indonesian manual content
     ↓
Add technical explanation + source-code appendix
     ↓
Generate styled DOCX
     ↓
Render → inspect every page → fix → render again
     ↓
Export PDF when available
     ↓
Validate source alignment, privacy, legal identifiers
     ↓
Deliver final files + factual QA report
```

### 14.2. Tahap kerja dan keluaran antara

| Tahap | Keluaran kerja | Kriteria lanjut |
|---|---|---|
| A. Baca referensi | `reference_review.md` | Ketentuan Program Komputer UNDIP dikenali dengan benar |
| B. Audit aplikasi | inventory, feature & role matrices | Modul, navigasi, dan role punya bukti source |
| C. Jalankan aplikasi | log lingkungan yang aman | Aplikasi dapat diakses tanpa risiko production |
| D. Screenshot MCP | file gambar dan manifest | Screenshot benar-benar tertangkap dan sesuai label |
| E. Penulisan | struktur bab terisi | Semua fitur utama dan alur prioritas tercakup |
| F. Source code | manifest, kode yang disertakan | Kepemilikan, cakupan dan sanitasi dicek |
| G. Layout DOCX | DOCX valid | Heading, tabel, gambar, TOC dan page numbering rapi |
| H. Review | render dan `qa_report.md` | Tidak ada kesalahan visual fatal, klaim palsu, atau bocoran rahasia |
| I. Final | DOCX + PDF (jika berhasil), delivery summary | Siap diserahkan untuk konsultasi dengan Tim Inovasi UNDIP |

---

## 15. CHECKLIST QUALITY ASSURANCE DAN ACCEPTANCE CRITERIA

### A. Kepatuhan UNDIP

- [ ] Kategori yang dipakai adalah **Program Komputer**, bukan Buku Panduan/Petunjuk.
- [ ] Cover mencantumkan **logo UNDIP**, judul ciptaan, dan nama pencipta.
- [ ] Judul dan nama konsisten dengan data pengajuan yang terverifikasi.
- [ ] Panduan menjelaskan **cara penggunaan program**.
- [ ] Source code karya yang relevan **ikut terlampir dalam dokumen**.
- [ ] DOCX dapat diekspor menjadi **satu PDF utuh** berisi komponen tersebut.
- [ ] Tidak ada materi yang melanggar hak pihak ketiga; tidak memakai Canva.
- [ ] Hasil dan berkas akan dikonsultasikan ke Tim Inovasi UNDIP sebelum submit.

### B. Akurasi codebase

- [ ] Semua nama fitur/modul ditelusuri ke kode dan/atau UI sebenarnya.
- [ ] Semua role/permission berasal dari implementasi, bukan asumsi.
- [ ] Seluruh alur bisnis utama dijelaskan secara benar.
- [ ] Informasi versi/revisi tercatat.
- [ ] Fitur yang belum tersedia tidak disebut sebagai telah berfungsi.
- [ ] Penjelasan teknis tidak mengklaim fitur keamanan yang tidak dapat dibuktikan.
- [ ] Tidak ada rahasia atau data privat di kode, log, screenshot maupun PDF.

### C. Screenshot Playwright MCP

- [ ] MCP tersedia dan tool sungguh dipanggil, terutama `browser_snapshot` dan `browser_take_screenshot`.
- [ ] Setiap screenshot punya role, route, state, caption, dan catatan sumber.
- [ ] Screenshot menampilkan aplikasi aktual dalam versi yang diaudit.
- [ ] Screenshot validasi/form/list/detail mewakili aksi yang dijelaskan.
- [ ] Semua data sensitif telah ditangani dengan aman.
- [ ] Resolusi gambar cukup jelas setelah tertanam di dokumen.
- [ ] Tiap screenshot DOCX ditemukan dalam manifest.

### D. Kualitas tulisan

- [ ] Seluruh narasi berbahasa Indonesia yang konsisten.
- [ ] Bab perkenalan singkat dan tidak penuh teori umum.
- [ ] Setiap fitur penting mencakup tujuan, langkah, dan hasil.
- [ ] Tidak terdapat duplikasi penjelasan yang berlebihan.
- [ ] Terminologi cocok dengan label UI.
- [ ] Caption dan referensi gambar benar.
- [ ] Tidak ada placeholder atau klaim tak terkonfirmasi pada dokumen yang dinyatakan final.

### E. DOCX/PDF

- [ ] DOCX dapat dibuka dan diedit.
- [ ] Semua gambar benar-benar embedded.
- [ ] Heading/styles konsisten dan berjenjang.
- [ ] TOC dan nomor halaman sesuai.
- [ ] Tidak ada halaman kosong tak sengaja, overlap atau clipping.
- [ ] Tidak ada tabel/gambar terpotong atau font rusak.
- [ ] Halaman source code terbaca dan teridentifikasi.
- [ ] Dokumen telah dirender dan diperiksa hingga halaman terakhir.
- [ ] PDF telah diekspor dari DOCX yang sama jika konverter tersedia.
- [ ] Laporan QA mencatat kekurangan atau hal yang perlu konfirmasi.

---

## 16. GATE KEPUTUSAN DAN RISIKO YANG HARUS DILAPORKAN

### 16.1. Blocker informasi identitas

Jika nama pencipta, pemegang hak, judul resmi, atau tanggal pertama diumumkan belum dikonfirmasi, tetap buat draft terstruktur, tetapi laporkan tegas status **BELUM SIAP SUBMIT**. Jangan memasukkan data pribadi atau pihak lain dari tebakan.

### 16.2. Blocker Playwright MCP

Jika MCP tak tersedia atau gagal koneksi, simpan diagnosis konkret (server tidak terpasang, browser gagal dijalankan, URL tak tersedia, autentikasi tak dimiliki). Jangan mengklaim screenshot MCP selesai. Kerjakan dulu audit codebase dan struktur DOCX dari bukti yang ada; jangan menyulap screenshot atau memasukkan screenshot tidak valid agar terlihat lengkap.

### 16.3. Blocker login / akses role

Jika tidak tersedia kredensial uji untuk role tertentu, dokumentasikan dari source dengan label belum teruji dan **jangan** mengakses akun orang lain tanpa izin. Minta akses yang sah melalui mekanisme aman pada tahap validasi.

### 16.4. Source code sangat besar

Jangan menerapkan pemotongan tanpa dasar. Prioritaskan kode original karya sendiri dengan manifest file lengkap. Dokumentasi source code dapat sangat panjang dan dilampirkan berurutan dalam DOCX/PDF. Jika ada konflik antara kerahasiaan, hak pihak ketiga, dan kewajiban lampiran, tandai sebagai keputusan administratif yang memerlukan konsultasi UNDIP; jangan memutuskan sepihak bahwa GitHub/Google Drive selalu menggantikan lampiran kode.

### 16.5. Perbedaan implementasi dan UI

Misalnya tombol `Export` ada di kode tetapi tidak muncul pada akun uji. Cari bukti role, flag, route guard, environment, dan API; masukkan perbedaan dalam laporan. Jangan mengklaim semua fitur pasti tersedia.

### 16.6. Masalah kualitas dokumen

Apabila renderer DOCX gagal atau output gambar berantakan, jangan menyerahkan file tanpa revisi dan menyebutnya 'rapi'. Lakukan debugging konverter atau pilih jalur authoring lain yang mampu menghasilkan DOCX valid.

---

## 17. LEMBAR VERIFIKASI IDENTITAS DAN DATA YANG HARUS DIAKUI

Buat `working/application_profile.md` dengan field berikut; isilah hanya dari fakta atau konfirmasi:

```yaml
nama_resmi_ciptaan: null
nama_aplikasi_di_ui: null
jenis_ciptaan: "Karya Lainnya"
subjenis_ciptaan: "Program Komputer"
pencipta: []
pemegang_hak_cipta: null
status_pengalihan_hak: null
program_studi_departemen: null
universitas: "Universitas Diponegoro"
versi_atau_tag: null
git_commit: null
tanggal_dokumentasi: null
tanggal_pengumuman_pertama: null
lokasi_pengumuman_pertama: null
platform: null
url_aplikasi_untuk_screenshot: null
lingkungan_screenshot: null
role_tersedia: []
status_konfirmasi_universitas: "belum_dikonfirmasi"
```

Isi `null` tidak otomatis wajib dicetak pada manual. Data belum tersedia masuk laporan, bukan diisi secara spekulatif. Tidak semua field YAML merupakan syarat formal dari UNDIP, beberapa adalah metadata mutu dokumentasi.

---

## 18. DELIVERABLE AKHIR DAN FORMAT LAPORAN AGENT

### 18.1. File yang harus diserahkan

**Wajib:**

1. `output/Manual_Book_HKI_<Nama_Aplikasi>.docx`, lengkap dengan gambar, tabel, dan dokumentasi source code.
2. `output/DELIVERY_SUMMARY.md`, berisi apa yang selesai, jumlah modul/alur yang didokumentasikan, jumlah screenshot valid, lokasi file, informasi versi, dan daftar pekerjaan yang masih membutuhkan keputusan pengguna.
3. `working/qa_report.md`, mencakup validasi kebenaran, cakupan fitur, sanitasi, dan rendering.
4. `working/screenshot_manifest.csv`, agar bukti visual dapat ditelusuri.
5. `working/source_code_manifest.md`, agar bukti implementasi dapat ditelusuri.

**Sangat dianjurkan:**

6. `output/Manual_Book_HKI_<Nama_Aplikasi>.pdf`, dikonversi dari DOCX final untuk peninjauan prapengajuan.
7. `working/feature_matrix.csv`, `working/role_permission_matrix.md`, dan screenshot audit yang aman.

Jangan memasukkan seluruh working folder berisi sesi browser/credential ke paket publik. Dokumen final publik dan artefak kerja internal harus terpisah.

### 18.2. Isi `DELIVERY_SUMMARY.md`

```markdown
# Ringkasan Penyerahan Manual Book HKI

- Nama aplikasi: ...
- Judul ciptaan resmi: ... / perlu konfirmasi
- Jenis/subjenis: Karya Lainnya / Program Komputer
- Git commit: ...
- Lingkungan screenshot: local/staging/... (tanpa credential)
- Tool tangkapan layar: Playwright MCP / gagal, alasan...
- Modul teridentifikasi: ...
- Modul terdokumentasi: ...
- Alur kritis teruji: ...
- Screenshot disertakan: ...
- File sumber kode teridentifikasi: ...
- File sumber kode terlampir: ...
- Keterangan kode yang dikecualikan: ...
- Validasi DOCX: lulus/gagal + catatan
- Validasi PDF: lulus/gagal/tidak tersedia
- Status: SIAP KONSULTASI UNDIP / BELUM SIAP SUBMIT
- Hal yang memerlukan keputusan pengguna/universitas: ...
```

Jangan memberi status **SIAP KONSULTASI UNDIP** jika panduan penggunaan atau source code belum ada; status tersebut bukan klaim telah diterima atau disetujui universitas.

### 18.3. Penyampaian final kepada pengguna

Balas dengan tautan/path nyata ke DOCX, PDF jika ada, dan ringkasan QA. Jelaskan secara objektif jika ada role tidak teruji, identitas belum disahkan, atau screenshot terhalang. **Jangan hanya mengatakan 'dokumen sudah disusun' tanpa menyediakan berkas.**

---

## 19. PEDOMAN KHUSUS UNTUK CODING AGENT YANG MENGGUNAKAN PLANNER DAN EXECUTOR

Jika agent memiliki mode plan dan build, gunakan fase secara berurutan, tetapi **jangan berhenti pada plan**. Kelola backlog internal dan lanjutkan sampai file dihasilkan.

Contoh work items:

```text
[ ] Read all local references and summarize binding requirements
[ ] Audit repository, version, stack, modules and roles
[ ] Build source evidence and feature/route matrices
[ ] Start safe application in local/staging
[ ] Use Playwright MCP to document actual user flows
[ ] Capture and inspect high-quality screenshots
[ ] Draft each chapter with actual app content
[ ] Include source-code proof and sanitize sensitive content
[ ] Produce professionally styled DOCX
[ ] Render, inspect, repair, and verify every page
[ ] Export PDF and verify parity if possible
[ ] Deliver final artifacts + audit/QA summary
```

### 19.1. Efisiensi tanpa kompromi kualitas

- Gunakan pembacaan kode batch, bukan membuka file acak tanpa hasil.
- Gunakan matriks fitur sebagai daftar kerja supaya tidak ada modul tertinggal.
- Screenshot dapat diambil per sesi role secara efisien tetapi tetap validasi tiap state.
- Tulis narasi berdasarkan hasil audit dan screenshots, bukan membayangkan alur terlebih dahulu.
- Gunakan komponen generasi DOCX yang reusable untuk heading, caption, gambar dan tabel.
- Jalankan pemeriksaan layout berkala untuk mencegah masalah besar pada akhir pekerjaan.
- Jangan memaksakan nilai token, jumlah halaman, atau target waktu sebagai pembenaran menghapus bagian penting.

---

## 20. PERINGATAN KHUSUS DARI HASIL TELAHAH REFERENSI

1. **Patrolee** adalah referensi kuat untuk langkah bernomor per role, tetapi ada screenshot konfigurasi dan contoh kredensial dalam manual lama. **Jangan menyalin kredensial atau cara dokumentasi yang membocorkan akses**.
2. **Perpustakaan Digital** baik untuk desain dua kolom dan screenshot beranotasi, tetapi aplikasi desktop berbeda dari web. Terapkan hanya prinsip visual yang relevan.
3. **ONShop** menampilkan diagram dan source code, tetapi terdapat ketidakkonsistenan nama aplikasi dan contoh query SQL yang berisiko. **Jangan menyalin kode tersebut sebagai implementasi baru atau klaim keamanan**.
4. **Panduan Universitas Negeri Malang** merupakan referensi institusi lain dan lebih lama. Jangan menggunakan ketentuan historisnya untuk mengganti ketentuan UNDIP.
5. **Manual e-HKI Universitas Trunojoyo Madura** memuat alternatif pemrosesan kode pada prosedur internal tertentu. Jangan menafsirkan alternatifnya sebagai izin universal untuk mengganti kewajiban PDF UNDIP.
6. **Panduan UNDIP khusus Program Komputer** adalah titik rujukan utama untuk persyaratan manual dan source code, sedangkan tata letak visual tetap dapat dirancang profesional selama tidak bertentangan.
7. Jangan menggunakan Canva untuk pembuatan hasil ciptaan karena catatan khusus pada halaman PDF 29 panduan UNDIP.

---

## 21. PERINTAH PENUTUP: DEFINITION OF DONE

**Tugas dianggap selesai hanya jika seluruh ketentuan berikut terpenuhi secara faktual:**

> (1) Referensi UNDIP dan contoh lokal telah ditelaah; (2) codebase aktual telah diaudit; (3) fitur penting dan role tercakup dengan bukti; (4) Playwright MCP telah digunakan untuk menangkap screenshot asli atau blocker telah dilaporkan secara jujur; (5) dokumen DOCX lengkap dengan manual penggunaan, screenshot, identitas ciptaan, dan source code yang relevan telah dibuat; (6) setiap halaman dokumen telah dirender dan diperiksa; (7) masalah privasi, legal, dan kualitas telah diaudit; serta (8) DOCX, PDF bila tersedia, dan laporan QA telah diserahkan sebagai file nyata.

**JANGAN:** berhenti pada rancangan struktur, membuat dokumen kosong, menghasilkan screenshot palsu, atau menjanjikan pekerjaan lanjutan tanpa eksekusi pada giliran kerja ini.

**MULAI DARI:** membaca `references/01_Panduan_Resmi_HKI_UNDIP.pdf` halaman PDF 29 dan 7–19, kemudian membaca keempat PDF referensi lainnya, mengaudit repository, dan menyiapkan matriks fitur sebelum pengambilan screenshot.
