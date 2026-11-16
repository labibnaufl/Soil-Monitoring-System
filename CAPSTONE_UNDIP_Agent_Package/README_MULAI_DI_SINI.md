# Paket Instruksi Deskripsi Fitur Web untuk Coding Agent

Paket ini berisi tiga berkas untuk membuat **deskripsi fitur web application** dengan pola: **gambar (screenshot) → caption → paragraf deskripsi**, berbahasa Indonesia akademik, mengikuti gaya laporan (contoh: "Gambar 2.8 merupakan tampilan dari ...").

## Penggunaan cepat

1. Letakkan folder ini di root repository aplikasi (atau folder yang bisa dibaca agent).
2. Pastikan agent bisa menjalankan aplikasi di lingkungan **lokal/staging** dan punya akses ke **Playwright MCP**.
3. Siapkan akun **uji** untuk tiap role. Jangan memberikan akun produksi.
4. Isi bagian **Parameter** di `INSTRUKSI_UTAMA_FITUR_DESCRIPTION.md` (nomor bab, nomor gambar awal, nama sistem).
5. Kirim prompt berikut ke agent:

> **Kerjakan seluruh instruksi di `INSTRUKSI_UTAMA_FITUR_DESCRIPTION.md`. Audit codebase, jalankan aplikasi, gunakan Playwright MCP untuk mengambil screenshot halaman yang benar-benar ada, lalu tulis deskripsi fitur (gambar + caption + paragraf) mengikuti `TEMPLATE_DAN_CONTOH.md`. Jangan mengarang fitur. Simpan hasil di `feature-description/output/`. Jangan berhenti pada rencana; serahkan berkas nyata beserta laporan QA.**

## Isi paket

| File | Fungsi |
|---|---|
| `README_MULAI_DI_SINI.md` | Panduan singkat penggunaan dan prompt pembuka |
| `INSTRUKSI_UTAMA_FITUR_DESCRIPTION.md` | Spesifikasi kerja lengkap untuk agent: audit, screenshot, penulisan, QA |
| `TEMPLATE_DAN_CONTOH.md` | Template paragraf per komponen UI, contoh output, dan contoh manifest |

## Keluaran yang dihasilkan agent

```
feature-description/
  output/
    feature_description.md        ← hasil utama (gambar + caption + deskripsi)
    images/                       ← screenshot yang dipakai
  working/
    feature_matrix.csv            ← daftar halaman/fitur yang ditemukan
    screenshot_manifest.csv       ← bukti tiap screenshot
    qa_report.md                  ← hasil pemeriksaan akhir
```

## Batas penggunaan

- Paket ini tidak berisi deskripsi final; hasil dibuat agent dari aplikasi nyata.
- Nama sistem, fitur, dan alur harus berasal dari codebase dan UI aktual.
- Jika butuh DOCX, minta agent mengonversi `feature_description.md` setelah isinya lolos QA.
