# Template dan Contoh Deskripsi Fitur

Berkas ini dipakai agent sebagai **acuan gaya**. Contoh di bawah hanya ilustrasi (sistem fiktif "Luna System"). **Jangan menyalin isinya**; tulis ulang berdasarkan aplikasi yang sedang diaudit.

---

## 1. Template dasar satu halaman

```markdown
### <HURUF>. <Nama Halaman / Fitur>

![<teks alternatif>](images/<nama-file>.png)

<p align="center">Gambar <X.Y>. Tampilan <Nama Halaman></p>

Gambar <X.Y> merupakan tampilan dari <nama halaman/menu> <konteks, mis. setelah pengguna melakukan *login*>. <Penjelasan umum isi halaman>. Terdapat <komponen 1> yang berfungsi untuk <fungsi>. Selanjutnya terdapat <komponen 2> yang <fungsi>. Kemudian <komponen 3> <fungsi>. <Penutup: manfaat bagi pengguna, bila relevan>.
```

---

## 2. Pola kalimat per komponen

| Komponen | Pola kalimat |
|---|---|
| Halaman umum | `Gambar X.Y merupakan tampilan dari <halaman> <konteks>.` |
| Text field | `halaman ini berisikan *text field* <nama field> untuk <tujuan>.` |
| Button | `*button* <label UI> untuk <aksi/tujuan>.` |
| Form | `Formulir ini berisi *field* <daftar field>, kemudian pengguna menekan *button* <label> untuk <hasil>.` |
| Line chart | `Pada *line chart* terdapat <data> dalam kurun waktu <interval>.` |
| Bar chart | `*Chart* <nama> berfungsi untuk menampilkan <data> beserta totalnya.` |
| Donut/pie chart | `*Donut chart* ini untuk menampilkan total data dari <kategori>.` |
| Tabel | `Tabel ini berisi <kolom 1>, <kolom 2>, dan <kolom 3>.` |
| Filter/pencarian | `Terdapat *filter* untuk menyaring data berdasarkan <kriteria>.` |
| Ekspor/cetak | `*Button* <label> digunakan untuk mengunduh data dalam format <format yang terverifikasi>.` |
| Jumlah komponen | `Pada menu ini terdapat <n> *chart* dan <n> tabel.` |
| Penutup insight | `Informasi ini dapat digunakan untuk <manfaat>.` |

---

## 3. Contoh output lengkap (fiktif, hanya gaya)

### 2.2.1 *Web Application*

### A. Halaman *Login*

![Tampilan halaman login](images/01-auth-login.png)

<p align="center">Gambar 2.8. Tampilan <i>Login</i></p>

Gambar 2.8 merupakan tampilan dari masuk atau *login web application* Luna System. Halaman ini berisikan *text field* dan *button login* untuk masuk ke halaman *admin*. *Admin* diminta memasukkan *username* dan *password* yang telah tersedia.

### B. Demonstrasi Produk

![Tampilan dashboard](images/02-admin-dashboard.png)

<p align="center">Gambar 2.9. Tampilan <i>Dashboard</i> Luna System</p>

Gambar 2.9 merupakan tampilan dari *dashboard* setelah pengguna melakukan *login* ke dalam sistem. Di dalam menu *Dashboard* terdapat beberapa *chart* dan tabel informasi dari serangan siber yang terdeteksi. Pada *line chart* terdapat hasil deteksi serangan dalam kurun waktu tiap 10 detik dan tampilannya berubah secara *realtime*. Selanjutnya terdapat tabel *summary* dari hasil serangan siber yang terdeteksi. Tabel ini berisi *source IP*, *destination IP*, dan label jenis serangan. Kemudian *chart Source IP* berfungsi untuk menampilkan IP dari server yang mengalami serangan siber.

![Tampilan menu distribution attack](images/03-admin-distribution-attack.png)

<p align="center">Gambar 2.10. Tampilan Menu <i>Distribution Attack</i></p>

Gambar 2.10 merupakan tampilan dari menu *distribution attack*. Pada menu ini terdapat 3 *chart* dan 1 tabel. *Chart top IP attacker* menampilkan total dan IP dari penyerang. Selanjutnya terdapat *chart top IP targets* yang menampilkan total IP yang menerima serangan. Kemudian terdapat *donut chart* untuk menampilkan total data dari jenis serangan yang terdeteksi. Terakhir terdapat *alerts summary*, yaitu tabel yang berisi *source IP*, *destination IP*, dan label jenis serangan.

![Tampilan menu IP distribution](images/04-admin-ip-distribution.png)

<p align="center">Gambar 2.11. Tampilan Menu <i>IP Distribution</i></p>

Gambar 2.11 merupakan tampilan dari menu *IP Distribution*. Terdapat *chart* untuk menampilkan IP sumber asal serangan. Selain itu terdapat *chart IP destination* yang menunjukkan IP tujuan yang paling sering diserang, sehingga server atau perangkat yang menjadi target utama dapat diidentifikasi.

![Tampilan menu port distribution](images/05-admin-port-distribution.png)

<p align="center">Gambar 2.12. Tampilan Menu <i>Port Distribution</i></p>

Gambar 2.12 merupakan tampilan dari menu *port distribution*. Pada menu ini terdapat 2 *chart* dan 2 tabel. *Chart port source* menunjukkan port sumber yang paling sering digunakan dalam serangan, sedangkan *chart port destination* menunjukkan port tujuan yang paling sering diserang. Selanjutnya terdapat tabel yang menampilkan kesimpulan dari port penyerang dan port yang diserang, berisi port, label serangan, dan total serangan.

---

## 4. Contoh untuk fitur CRUD (fiktif)

### C. Menu Data Pengguna

![Daftar pengguna](images/06-admin-users-list.png)

<p align="center">Gambar 2.13. Tampilan Menu Data Pengguna</p>

Gambar 2.13 merupakan tampilan dari menu Data Pengguna. Pada halaman ini terdapat tabel yang berisi nama, *email*, *role*, dan status pengguna. Di bagian atas tabel terdapat *text field* pencarian untuk mencari data berdasarkan nama, serta *button* Tambah untuk menambahkan pengguna baru. Pada setiap baris terdapat *button* Ubah dan Hapus untuk mengelola data pengguna.

![Formulir tambah pengguna](images/07-admin-users-create.png)

<p align="center">Gambar 2.14. Tampilan Formulir Tambah Pengguna</p>

Gambar 2.14 merupakan tampilan formulir tambah pengguna yang muncul setelah *button* Tambah ditekan. Formulir ini berisi *field* nama, *email*, dan *role*. Setelah seluruh *field* diisi, *admin* menekan *button* Simpan agar data tersimpan dan tampil pada tabel.

*(Label tombol dan field di atas hanya contoh. Gunakan label UI yang sebenarnya.)*

---

## 5. Contoh baris `screenshot_manifest.csv`

```text
image_id,file_path,feature_id,role,route,viewport,state,caption,captured_with,verified_at,privacy_checked,notes
IMG-001,output/images/01-auth-login.png,F-001,guest,/login,1440x900,default,Gambar 2.8. Tampilan Login,Playwright MCP,2026-11-10,yes,
```

## 6. Contoh baris `feature_matrix.csv`

```text
feature_id,group,page_name,route,role,components,source_files,documented,notes
F-001,Autentikasi,Login,/login,guest,"text field username; text field password; button Sign In",src/pages/login.tsx,yes,
```

---

## 7. Contoh kalimat yang BENAR vs SALAH

| Salah | Benar | Alasan |
|---|---|---|
| Halaman ini sangat canggih dan modern. | Halaman ini berisi *text field* *username* dan *password*. | Tanpa klaim promosi |
| Admini diminta memasukkan data. | *Admin* diminta memasukkan *username* dan *password*. | Typo |
| Tabel ini akan berisi berisi *source IP*. | Tabel ini berisi *source IP*. | Kata ganda |
| Pengguna dapat mengekspor ke PDF. (tanpa bukti) | *Button* Ekspor mengunduh data dalam format CSV. (terverifikasi) | Klaim harus terbukti |
| Terdapat beberapa chart. | Terdapat 3 *chart* dan 1 tabel. | Spesifik |
