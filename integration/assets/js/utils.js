/* =============================================
   SiKeuangan - Utility Functions
   File: assets/js/utils.js
   Dimuat pertama sebelum module lain.
   ============================================= */

const API = 'api/';

// ---- Formatter ----
function formatRp(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTgl(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayDate() {
    return new Date().toISOString().split('T')[0];
}

function currentMonth() {
    return new Date().toISOString().slice(0, 7);
}

// ---- Alert ----
function showAlert(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'alert alert-' + (type === 'success' ? 'success' : 'error') + ' show';
    el.textContent = msg;
    setTimeout(() => { el.classList.remove('show'); }, 4000);
}

// ---- API Wrapper ----
async function api(url, opts = {}) {
    const res = await fetch(API + url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    return res.json();
}

// ---- Render helper: tabel transaksi ----
// Menggunakan kelas Bootstrap: table table-hover table-bordered table-sm
function renderTabelTransaksi(data, showActions = true) {
    if (!data.length) return '<p style="color:#666;text-align:center;padding:20px">Belum ada data transaksi.</p>';

    // Buka tag tabel dengan kelas Bootstrap agar bergaris & hover
    let html = `<table class="table table-hover table-bordered table-sm"><thead><tr>
        <th>Tanggal</th><th>Jenis</th><th>Nama</th><th>Jumlah</th><th>Keterangan</th>
        ${showActions ? '<th>Aksi</th>' : ''}
    </tr></thead><tbody>`;

    data.forEach(t => {
        // Badge warna sesuai jenis (pemasukan=hijau, pengeluaran=merah)
        html += `<tr>
            <td>${formatTgl(t.tanggal)}</td>
            <td><span class="badge ${t.jenis === 'pemasukan' ? 'badge-green' : 'badge-red'}">${t.jenis}</span></td>
            <td>${t.nama}</td>
            <td><strong>${formatRp(t.jumlah)}</strong></td>
            <td>${t.keterangan || '-'}</td>
            ${showActions ? `<td>
                <button class="btn btn-warning btn-sm" onclick="editTransaksi(${t.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="hapusTransaksi(${t.id})">Hapus</button>
            </td>` : ''}
        </tr>`;
    });

    html += '</tbody></table>';
    return html;
}
