# Paket Instruksi Manual Book HKI Website untuk Coding Agent

## Penggunaan cepat

1. Ekstrak paket ini ke sebuah folder yang dapat dibaca coding agent, idealnya di root repository aplikasi atau folder workspace yang dapat diakses dari repository.
2. Buka `INSTRUKSI_UTAMA_CODING_AGENT_HKI_UNDIP.md`.
3. Berikan kepada coding agent instruksi berikut:

> **Kerjakan secara penuh seluruh instruksi di `INSTRUKSI_UTAMA_CODING_AGENT_HKI_UNDIP.md`. Audit codebase aplikasi saat ini, baca semua PDF di folder `references/`, gunakan Playwright MCP untuk mengunjungi aplikasi serta mengambil screenshot fitur yang benar-benar ada, lalu buat Manual Book HKI UNDIP berbahasa Indonesia dalam DOCX yang profesional dan siap dikaji. Buat pula PDF jika konversi tersedia. Jangan berhenti pada perencanaan. Verifikasi hasil render setiap halaman dan sertakan laporan QA serta matriks screenshot/source code. Jangan menerapkan batas buatan untuk ukuran berkas, jumlah halaman, atau jumlah screenshot.**

4. Pastikan coding agent bisa menjalankan aplikasi di lingkungan **aman** serta memiliki akses ke **Playwright MCP** dan akun **uji** untuk role yang ingin didokumentasikan. Jangan menyerahkan akun produksi atau credential secara terbuka.
5. Hasil yang ditargetkan oleh agent berada pada folder `hki-manual-book/output/` atau direktori setara yang tertulis di instruksi.

## Isi paket

| File | Deskripsi |
|---|---|
| `INSTRUKSI_UTAMA_CODING_AGENT_HKI_UNDIP.md` | Spesifikasi sangat lengkap yang harus dieksekusi coding agent |
| `references/01_Panduan_Resmi_HKI_UNDIP.pdf` | **Pedoman utama** Universitas Diponegoro, khususnya halaman PDF 29 dan 7–19 |
| `references/02_Manual_Patrolee.pdf` | Contoh panduan aplikasi berbasis role |
| `references/03_Manual_Perpustakaan_Digital.pdf` | Contoh visual layout, screenshot, dan deskripsi fitur |
| `references/04_Manual_ONShop.pdf` | Contoh diagram, panduan admin, dan source code |
| `references/05_Panduan_UM_HKI_Historis.pdf` | Pedoman institusi lain, hanya sebagai pembanding historis |
| `MANIFEST_SHA256.txt` | Verifikasi integritas file di dalam paket |

## Batas penggunaan

Dokumen ini **belum** merupakan Manual Book final dari aplikasi tertentu: hasil final baru dapat dibuat setelah coding agent membaca codebase sesungguhnya, menjalankan aplikasi, dan mengambil screenshot. Tidak ada nama pencipta, judul aplikasi, atau fitur yang diarang.

Ketentuan unggah aktual portal/sentra HKI harus dicek pada proses pengajuan. Instruksi ini tidak memaksakan batas ukuran file atau jumlah halaman dalam proses penyusunan.

## Prioritas hukum/administratif

- Panduan UNDIP adalah acuan utama prosedur pengajuan melalui universitas.
- Ketentuan DJKI yang berlaku adalah acuan nasional.
- Contoh manual book lainnya hanya rujukan desain dan teknik penulisan.
