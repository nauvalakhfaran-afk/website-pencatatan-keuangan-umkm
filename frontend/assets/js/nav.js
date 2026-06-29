/* =============================================
   SiKeuangan - Modul Navigasi
   File: assets/js/nav.js
   Bergantung pada: utils.js, dan semua modul halaman.
   ============================================= */

const pageTitles = {
    dashboard  : 'Dashboard',
    pemasukan  : 'Pencatatan Pemasukan',
    pengeluaran: 'Pencatatan Pengeluaran',
    transaksi  : 'Riwayat Transaksi',
    hpp        : 'Kalkulator HPP',
    bep        : 'Kalkulator BEP',
    laporan    : 'Laporan Keuangan',
};

function showPage(page) {
    // Sembunyikan semua halaman & nonaktifkan semua nav
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Aktifkan halaman & nav yang dipilih
    document.getElementById('page-' + page).classList.add('active');
    document.querySelector(`[onclick="showPage('${page}')"]`).classList.add('active');
    document.getElementById('page-title').textContent = pageTitles[page] || page;

    // Panggil fungsi load sesuai halaman
    if      (page === 'dashboard')   loadDashboard();
    else if (page === 'pemasukan')   loadRiwayatJenis('pemasukan');
    else if (page === 'pengeluaran') loadRiwayatJenis('pengeluaran');
    else if (page === 'transaksi')   { currentPage = 1; loadTransaksi(); }
    else if (page === 'hpp')         loadHPP();
    else if (page === 'bep')         loadBEP();
    else if (page === 'laporan')     loadLaporan();
}
