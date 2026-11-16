# MASTER INSTRUCTION: Penulisan Deskripsi Fitur Web Application (Gambar + Caption + Deskripsi)

> **Jenis dokumen:** Spesifikasi kerja untuk coding agent.
> **Bahasa keluaran:** Bahasa Indonesia baku, formal, akademik.
> **Keluaran utama:** `output/feature_description.md` beserta folder `output/images/`.
> **Sumber kebenaran:** Codebase aktual, hasil menjalankan aplikasi, dan screenshot dari **Playwright MCP**.
> **Prinsip:** Jangan mengarang nama fitur, isi halaman, perilaku sistem, atau screenshot.

---

## PARAMETER (isi/ubah sebelum menjalankan)

| Parameter | Nilai | Keterangan |
|---|---|---|
| `NAMA_SISTEM` | _(isi, atau ambil dari repo/UI)_ | Tulis konsisten di seluruh dokumen |
| `NOMOR_BAB` | `2.2.1` | Contoh: 2.2.1 Web Application |
| `JUDUL_BAB` | `Web Application` | |
| `NOMOR_GAMBAR_AWAL` | `2.8` | Penomoran berlanjut: 2.8, 2.9, 2.10, ... |
| `ROLE_DIDOKUMENTASI` | _(isi, atau tentukan dari audit)_ | Contoh: admin, operator |
| `FORMAT_AKHIR` | `md` | Tambah `docx` hanya jika diminta |

Jika parameter kosong, ambil dari repo/UI dan **catat asumsi** di `qa_report.md`.

---

## 0. MANDAT EKSEKUSI

Anda bekerja di dalam repository aplikasi web nyata. Tugas: **mengaudit aplikasi, mengambil screenshot asli, lalu menulis deskripsi tiap halaman/fitur** dengan struktur gambar, caption, dan paragraf. Jangan hanya memberi template kosong atau rencana.

Wajib:

1. Baca seluruh instruksi ini dan `TEMPLATE_DAN_CONTOH.md`.
2. Audit repository: route, halaman, menu, komponen, role, dan alur utama.
3. Jalankan aplikasi di lingkungan aman (lokal/staging) dengan akun uji.
4. **Gunakan Playwright MCP secara nyata** untuk menjelajahi UI dan mengambil screenshot. Jangan memakai gambar dari README atau gambar karangan sebagai pengganti.
5. Tulis deskripsi per halaman sesuai standar di bagian 4.
6. Lakukan QA (bagian 7) dan serahkan berkas nyata.
7. Jika ada hal yang tidak bisa diverifikasi (role tak punya akun, halaman butuh data khusus), **jangan mengarang**. Catat di `qa_report.md` dan lanjutkan bagian lain.

Jangan mengubah logika bisnis, data produksi, atau konfigurasi keamanan hanya untuk mendapatkan screenshot.

---

## 1. FASE 1: AUDIT CODEBASE

1. Identifikasi stack, entry point, dan cara menjalankan aplikasi.
2. Petakan route/halaman (router, folder `pages`/`app`, controller, view, dsb.).
3. Petakan role dan hak akses (middleware, guard, policy).
4. Untuk tiap halaman, catat komponen UI yang ada: *text field*, *button*, tabel, chart, filter, form, modal, dsb.
5. Catat data apa yang ditampilkan dan dari mana (API/query), agar deskripsi akurat.
6. Buat `working/feature_matrix.csv`:

```text
feature_id,group,page_name,route,role,components,source_files,documented,notes
```

Bedakan fitur yang **ada di kode dan terlihat di UI** dari fitur yang hanya ada di kode (flag mati, belum dipakai). Hanya yang terverifikasi di UI boleh dideskripsikan secara definitif.

---

## 2. FASE 2: MENJALANKAN APLIKASI

- Gunakan lingkungan lokal/staging. **Jangan** produksi.
- Gunakan data dummy/sintetis. Isi data seperlunya agar tabel dan chart tidak kosong, tanpa memalsukan perilaku fitur.
- Gunakan akun uji dengan nama netral. Jangan menulis kredensial di dokumen.
- Jika aplikasi tidak bisa dijalankan, laporkan penyebab di `qa_report.md` dan jangan membuat screenshot palsu.

---

## 3. FASE 3: SCREENSHOT DENGAN PLAYWRIGHT MCP

Cari tool Playwright MCP yang benar-benar tersedia di runtime (jangan mengarang nama). Tool inti yang umum:

| Fungsi | Tool |
|---|---|
| Buka URL | `browser_navigate` |
| Baca struktur halaman | `browser_snapshot` |
| Klik / isi form | `browser_click`, `browser_type`, `browser_fill_form` |
| Tunggu data | `browser_wait_for` |
| Ubah viewport | `browser_resize` |
| Simpan screenshot | `browser_take_screenshot` |

### Aturan screenshot

- Viewport konsisten, disarankan sekitar **1440 × 900**.
- Format PNG agar teks kecil tetap tajam.
- Tunggu data selesai dimuat; jangan tangkap spinner, skeleton, atau halaman error.
- Satu halaman/menu = satu screenshot utama. Untuk halaman panjang, pecah menjadi beberapa screenshot fokus.
- Jangan memanipulasi angka, tanggal, atau status di layar.
- Tidak ada data sensitif (nama asli, email asli, token, cookie, URL berisi token). Jika perlu disamarkan, lakukan **redaksi permanen** pada salinan gambar, bukan overlay.
- Nama berkas: `<urutan>-<role>-<halaman>.png`, contoh `01-auth-login.png`, `02-admin-dashboard.png`.

### Manifest wajib: `working/screenshot_manifest.csv`

```text
image_id,file_path,feature_id,role,route,viewport,state,caption,captured_with,verified_at,privacy_checked,notes
```

`captured_with` hanya boleh `Playwright MCP` jika tool benar-benar dipanggil.

---

## 4. FASE 4: STANDAR PENULISAN DESKRIPSI

### 4.1. Struktur dokumen

```markdown
## <NOMOR_BAB> <JUDUL_BAB>

### A. <Nama Halaman / Fitur>

![<teks alternatif>](images/<nama-file>.png)

<p align="center">Gambar X.Y. Tampilan <Nama Halaman></p>

<Paragraf deskripsi>

### B. <Nama Halaman / Fitur Berikutnya>
...
```

- Sub-judul memakai huruf **A., B., C., ...** sesuai kelompok fitur.
- Caption di bawah gambar, format: `Gambar X.Y. Tampilan <Nama Halaman/Menu>`.
- Nomor gambar berurutan mulai dari `NOMOR_GAMBAR_AWAL`, tanpa lompat atau duplikat.
- Nomor pada caption harus sama dengan nomor yang disebut di paragraf.
- Jika satu sub-judul memuat beberapa menu, tiap menu punya gambar, caption, dan paragraf sendiri.

### 4.2. Rumus paragraf

1. **Pembuka:** `Gambar X.Y merupakan tampilan dari <halaman/menu> <konteks singkat>.`
2. **Isi:** jelaskan komponen berurutan (atas ke bawah / kiri ke kanan): `Terdapat <komponen> yang berfungsi untuk <fungsi>.`
3. **Penutup (opsional):** manfaat atau informasi yang diperoleh pengguna.

Panjang: sekitar 3–7 kalimat per gambar. Gunakan kata penghubung `Selanjutnya`, `Kemudian`, `Selain itu`, `Terakhir`.

### 4.3. Aturan isi

- Sebut **jumlah** komponen bila terlihat jelas (contoh: "3 *chart* dan 1 tabel").
- Sebut **kolom tabel** dan **jenis data** yang benar-benar tampil.
- Jelaskan **fungsi**, bukan hanya nama komponen.
- Gunakan label UI persis (mis. tombol `Sign In`, menu `Distribution Attack`).
- Untuk data realtime/periodik, tulis hanya jika terverifikasi di kode atau UI (mis. interval 10 detik).
- Jangan menulis hal yang tidak terlihat di gambar atau tidak terbukti di kode.
- Jika suatu perilaku belum terverifikasi, tulis secara hati-hati atau tandai di `qa_report.md`.

### 4.4. Gaya bahasa

- Bahasa Indonesia formal, aktif, lugas, netral. Tanpa promosi atau hiperbola.
- Istilah asing **dicetak miring**: *login*, *dashboard*, *chart*, *text field*, *button*, *realtime*, *username*, *password*, *admin*, *user*.
- Nama sistem konsisten (satu ejaan).
- Hindari typo dan kata ganda (mis. "berisi berisi", "Admini", "Selanutnya", "IPberfungsi").

---

## 5. CAKUPAN

Dokumentasikan semua halaman penting dari audit, minimal:

| Kelompok | Contoh |
|---|---|
| Autentikasi | Login, registrasi, lupa password |
| Dashboard | Ringkasan, chart, tabel |
| Menu data/monitoring | Tiap menu di sidebar |
| Master data | Daftar, tambah, ubah, detail |
| Laporan/ekspor | Filter, hasil, unduh |
| Pengaturan/profil | Jika ada |

Jangan berhenti pada satu screenshot dashboard lalu menyebut seluruh fitur terdokumentasi. Setiap item `feature_matrix.csv` berstatus `documented = yes` atau diberi alasan.

---

## 6. STRUKTUR DIREKTORI

```
feature-description/
  output/
    feature_description.md
    images/
  working/
    feature_matrix.csv
    screenshot_manifest.csv
    qa_report.md
```

Folder `working/` bersifat internal, jangan diserahkan sebagai paket publik jika memuat data sensitif.

---

## 7. QA (WAJIB SEBELUM SERAH)

- [ ] Semua halaman penting di `feature_matrix.csv` sudah didokumentasikan atau diberi alasan
- [ ] Setiap gambar punya caption, paragraf, dan baris di `screenshot_manifest.csv`
- [ ] Penomoran gambar berurutan; caption dan paragraf konsisten
- [ ] Paragraf dibuka dengan "Gambar X.Y merupakan tampilan dari ..."
- [ ] Semua komponen yang dijelaskan benar-benar terlihat di gambar
- [ ] Label UI, jumlah chart/tabel, dan kolom tabel sesuai gambar
- [ ] Tidak ada fitur karangan atau klaim yang tidak terbukti
- [ ] Istilah asing italic; tidak ada typo atau kata ganda
- [ ] Tidak ada data sensitif atau kredensial di gambar maupun teks
- [ ] Gambar tajam dan terbaca; tidak ada spinner/error yang menyesatkan
- [ ] Berkas Markdown terbuka dan semua path gambar valid

Tulis hasilnya di `working/qa_report.md` berisi: daftar halaman terdokumentasi, halaman tidak terdokumentasi + alasan, asumsi, dan temuan.

---

## 8. BLOCKER DAN KEJUJURAN

| Situasi | Tindakan |
|---|---|
| Playwright MCP tidak tersedia | Laporkan jujur; jangan membuat screenshot palsu; lanjutkan audit kode dan tulis draf tanpa gambar, tandai jelas |
| Tidak ada akun untuk suatu role | Dokumentasikan role lain, catat role yang tidak teruji |
| Halaman butuh data khusus | Buat data dummy aman bila bisa; bila tidak, catat sebagai tidak terdokumentasi |
| UI berbeda dari kode | Dokumentasikan yang tampak di UI, catat perbedaannya |

---

## 9. DEFINITION OF DONE

Tugas selesai hanya jika: (1) codebase dan UI diaudit; (2) screenshot asli diambil dengan Playwright MCP atau blocker dilaporkan jujur; (3) setiap halaman penting punya gambar, caption, dan paragraf deskripsi; (4) QA lulus; (5) `feature_description.md`, `images/`, `screenshot_manifest.csv`, dan `qa_report.md` diserahkan sebagai berkas nyata.

**JANGAN** berhenti pada rencana, membuat dokumen kosong, atau menjanjikan pekerjaan lanjutan tanpa eksekusi.

Balasan akhir ke pengguna: sebutkan path berkas, ringkas halaman yang terdokumentasi, dan jelaskan secara objektif hal yang tidak teruji.
