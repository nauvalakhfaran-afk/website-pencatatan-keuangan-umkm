# Dokumentasi Sistem Informasi

Dokumentasi website pencatatan keuangan UMKM ini dibuat oleh tim pengembang sebagai referensi teknis untuk memahami struktur, fungsi, dan arsitektur sistem **SiKeuangan** berbasis Bootstrap.

---

## Deskripsi Sistem

Aplikasi **SiKeuangan** (Sistem Keuangan Usaha) adalah platform pencatatan keuangan berbasis web yang dibangun menggunakan framework **Bootstrap 5.3.3** untuk tampilan antarmuka, **Chart.js** untuk visualisasi grafik, dan **PHP (PDO/MySQL)** pada sisi backend.

---

### Dependensi Eksternal (CDN)

| Library        | Versi   | Fungsi                                 |
|----------------|---------|----------------------------------------|
| Bootstrap CSS  | 5.3.3   | Styling dan komponen UI                |
| Bootstrap JS Bundle | 5.3.3 | Interaktivitas (modal, dropdown, dsb.) |
| Chart.js       | Latest  | Grafik dan visualisasi data dashboard  |

Sumber CDN: `https://cdn.jsdelivr.net`

### Urutan Load JavaScript (Wajib Dijaga)

Modul JavaScript di-load secara berurutan karena setiap modul bergantung pada modul sebelumnya:

| Urutan | File                       | Fungsi                                      |
|--------|----------------------------|---------------------------------------------|
| 1      | `assets/js/utils.js`       | Helper & API wrapper — **harus pertama**    |
| 2      | `assets/js/auth.js`        | Manajemen login dan logout                  |
| 3      | `assets/js/nav.js`         | Routing halaman dengan fungsi `showPage()`  |
| 4      | `assets/js/dashboard.js`   | Logika tampilan dashboard                   |
| 5      | `assets/js/transaksi.js`   | Manajemen data transaksi                    |
| 6      | `assets/js/hpp.js`         | Kalkulator Harga Pokok Produksi (HPP)       |
| 7      | `assets/js/bep.js`         | Kalkulator Break-Even Point (BEP)           |
| 8      | `assets/js/laporan.js`     | Modul laporan keuangan                      |

### Mekanisme Page Loader

`index.html` menggunakan fungsi `loadPages()` untuk memuat partial HTML dari folder `pages/` secara asinkron, kemudian meng-inject konten ke dalam elemen DOM yang sesuai:

| Partial File               | Target DOM      | Keterangan                      |
|----------------------------|-----------------|---------------------------------|
| `pages/auth.html`          | `<body>`        | Form login                      |
| `pages/sidebar.html`       | `#app-inner`    | Navigasi sidebar                |
| `pages/dashboard.html`     | `#app-content`  | Halaman dashboard utama         |
| `pages/pemasukan.html`     | `#app-content`  | Form & riwayat pemasukan        |
| `pages/pengeluaran.html`   | `#app-content`  | Form & riwayat pengeluaran      |
| `pages/transaksi.html`     | `#app-content`  | Riwayat semua transaksi         |
| `pages/hpp.html`           | `#app-content`  | Kalkulator HPP                  |
| `pages/bep.html`           | `#app-content`  | Kalkulator BEP                  |
| `pages/laporan.html`       | `#app-content`  | Laporan keuangan                |
| `pages/modal-edit.html`    | `<body>`        | Modal dialog edit transaksi     |

Setelah semua partial berhasil di-inject, sistem memanggil `checkAuth()` untuk memverifikasi sesi login pengguna.

### Kerangka DOM Utama

```html
<div id="app">
    <div id="app-inner">         <!-- Sidebar dimasukkan di sini -->
    </div>
    <div class="main-content">
        <div class="topbar">     <!-- Judul halaman & tombol Keluar -->
            <h1 id="page-title">Dashboard</h1>
            <button onclick="doLogout()">Keluar</button>
        </div>
        <div id="app-content">   <!-- Konten halaman aktif -->
        </div>
    </div>
</div>
```

### Penanganan Error

Jika salah satu partial HTML gagal dimuat (misal: HTTP error), aplikasi menampilkan pesan error di layar dan menghentikan proses inisialisasi. Aplikasi ini **wajib dijalankan melalui web server** (XAMPP / WAMP) karena menggunakan `fetch()` untuk memuat file lokal — tidak bisa dibuka langsung sebagai file HTML.

---

## Halaman yang Tersedia

| Halaman       | Fungsi                                         |
|---------------|------------------------------------------------|
| Dashboard     | Ringkasan keuangan, grafik, saldo, laba/rugi   |
| Pemasukan     | Pencatatan dan riwayat pemasukan               |
| Pengeluaran   | Pencatatan dan riwayat pengeluaran             |
| Transaksi     | Riwayat semua transaksi dengan pagination      |
| Kalkulator HPP | Hitung Harga Pokok Produksi per produk        |
| Kalkulator BEP | Hitung titik Break-Even Point                 |
| Laporan       | Ekspor dan cetak laporan keuangan              |

---

## Tim Pengembang

| Peran                  | Tanggung Jawab                                                                 |
|------------------------|--------------------------------------------------------------------------------|
| **Backend Developer**  | Membangun API PHP (`api/auth.php`, `transaksi.php`, `laporan.php`, `kalkulator.php`), koneksi database MySQL   |
| **Frontend Developer** | Membangun antarmuka menggunakan Bootstrap 5, kustomisasi CSS (`assets/css/style.css`), integrasi Chart.js untuk grafik dashboard |
| **Integration Developer** | Menghubungkan frontend dan backend melalui modul `utils.js` (API wrapper), mengatur alur navigasi SPA (`nav.js`), serta memastikan urutan load modul berjalan dengan benar |
