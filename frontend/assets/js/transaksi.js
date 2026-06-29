/* =============================================
   SiKeuangan - Modul Transaksi
   File: assets/js/transaksi.js
   Mencakup: Pemasukan, Pengeluaran, Riwayat, Edit, Hapus
   Bergantung pada: utils.js
   ============================================= */

let currentPage = 1;

// =========================================
// PEMASUKAN
// =========================================
async function tambahPemasukan() {
    const data = {
        tanggal   : document.getElementById('pm-tanggal').value,
        jenis     : 'pemasukan',
        nama      : document.getElementById('pm-nama').value,
        jumlah    : document.getElementById('pm-jumlah').value,
        keterangan: document.getElementById('pm-keterangan').value,
    };
    if (!data.tanggal || !data.nama || !data.jumlah)
        return showAlert('alert-pemasukan', 'Tanggal, nama, dan jumlah wajib diisi');

    const r = await api('transaksi.php', { method: 'POST', body: JSON.stringify(data) });
    if (r.error) return showAlert('alert-pemasukan', r.error);

    showAlert('alert-pemasukan', 'Pemasukan berhasil ditambahkan!', 'success');
    document.getElementById('pm-nama').value      = '';
    document.getElementById('pm-jumlah').value    = '';
    document.getElementById('pm-keterangan').value = '';
    loadRiwayatJenis('pemasukan');
}

// =========================================
// PENGELUARAN
// =========================================
async function tambahPengeluaran() {
    const data = {
        tanggal   : document.getElementById('pg-tanggal').value,
        jenis     : 'pengeluaran',
        nama      : document.getElementById('pg-nama').value,
        jumlah    : document.getElementById('pg-jumlah').value,
        keterangan: document.getElementById('pg-keterangan').value,
    };
    if (!data.tanggal || !data.nama || !data.jumlah)
        return showAlert('alert-pengeluaran', 'Tanggal, nama, dan jumlah wajib diisi');

    const r = await api('transaksi.php', { method: 'POST', body: JSON.stringify(data) });
    if (r.error) return showAlert('alert-pengeluaran', r.error);

    showAlert('alert-pengeluaran', 'Pengeluaran berhasil ditambahkan!', 'success');
    document.getElementById('pg-nama').value       = '';
    document.getElementById('pg-jumlah').value     = '';
    document.getElementById('pg-keterangan').value = '';
    loadRiwayatJenis('pengeluaran');
}

// ---- Muat riwayat transaksi per jenis (untuk halaman pemasukan/pengeluaran) ----
async function loadRiwayatJenis(jenis) {
    const r    = await api(`transaksi.php?action=list&jenis=${jenis}&per_page=50`);
    const data = r.data || [];
    const containerId = jenis === 'pemasukan' ? 'tabel-pemasukan' : 'tabel-pengeluaran';
    document.getElementById(containerId).innerHTML = renderTabelTransaksi(data, false);
}

// =========================================
// RIWAYAT TRANSAKSI (semua, dengan filter)
// =========================================
async function loadTransaksi() {
    const search  = document.getElementById('tr-search').value;
    const jenis   = document.getElementById('tr-jenis').value;
    const dari    = document.getElementById('tr-dari').value;
    const sampai  = document.getElementById('tr-sampai').value;
    const params  = new URLSearchParams({
        action    : 'list',
        search,
        jenis,
        tgl_dari  : dari,
        tgl_sampai: sampai,
        page      : currentPage,
        per_page  : 15
    });

    const r = await api('transaksi.php?' + params.toString());
    document.getElementById('tabel-transaksi').innerHTML = renderTabelTransaksi(r.data || [], true);
    renderPagination(r.total_pages, currentPage);
}

function resetFilter() {
    document.getElementById('tr-search').value  = '';
    document.getElementById('tr-jenis').value   = '';
    document.getElementById('tr-dari').value    = '';
    document.getElementById('tr-sampai').value  = '';
    currentPage = 1;
    loadTransaksi();
}

// ---- Pagination ----
function renderPagination(totalPages, page) {
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    document.getElementById('pagination-transaksi').innerHTML = html;
}

function goPage(p) {
    currentPage = p;
    loadTransaksi();
}

// =========================================
// EDIT TRANSAKSI (via modal)
// =========================================
async function editTransaksi(id) {
    const r = await api(`transaksi.php?action=detail&id=${id}`);
    if (r.error) return alert(r.error);

    document.getElementById('edit-id').value          = r.id;
    document.getElementById('edit-tanggal').value     = r.tanggal;
    document.getElementById('edit-jenis').value       = r.jenis;
    document.getElementById('edit-nama').value        = r.nama;
    document.getElementById('edit-jumlah').value      = r.jumlah;
    document.getElementById('edit-keterangan').value  = r.keterangan || '';
    document.getElementById('modal-edit').classList.add('active');
}

async function simpanEdit() {
    const id   = document.getElementById('edit-id').value;
    const data = {
        tanggal   : document.getElementById('edit-tanggal').value,
        jenis     : document.getElementById('edit-jenis').value,
        nama      : document.getElementById('edit-nama').value,
        jumlah    : document.getElementById('edit-jumlah').value,
        keterangan: document.getElementById('edit-keterangan').value,
    };
    const r = await api(`transaksi.php?id=${id}`, { method: 'PUT', body: JSON.stringify(data) });
    if (r.error) return showAlert('alert-edit', r.error);
    closeModal();
    loadTransaksi();
}

// =========================================
// HAPUS TRANSAKSI
// =========================================
async function hapusTransaksi(id) {
    if (!confirm('Yakin hapus transaksi ini?')) return;
    const r = await api(`transaksi.php?id=${id}`, { method: 'DELETE' });
    if (r.error) return alert(r.error);
    loadTransaksi();
}

// ---- Tutup modal edit ----
function closeModal() {
    document.getElementById('modal-edit').classList.remove('active');
}
