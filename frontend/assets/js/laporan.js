/* =============================================
   SiKeuangan - Modul Laporan Keuangan
   File: assets/js/laporan.js
   Bergantung pada: utils.js
   ============================================= */

async function loadLaporan() {
    const bulan  = document.getElementById('lap-bulan').value;
    const dari   = document.getElementById('lap-dari').value;
    const sampai = document.getElementById('lap-sampai').value;

    const params = new URLSearchParams({ bulan, tgl_dari: dari, tgl_sampai: sampai });
    const d = await api('laporan.php?' + params.toString());

    const statusColor = { untung: 'text-green', rugi: 'text-red', impas: 'text-orange' };
    const statusText  = { untung: '✅ UNTUNG',  rugi: '❌ RUGI',  impas: '⚖️ IMPAS'  };

    const periodeLabel = dari && sampai ? `${dari} s/d ${sampai}` : bulan;

    let html = `
    <div class="card">
        <h3>Ringkasan Keuangan - ${periodeLabel}</h3>
        <div class="grid-4" style="margin-top:16px">
            <div>
                <div class="card-title">Total Pemasukan</div>
                <div class="card-value text-green">${formatRp(d.total_pemasukan)}</div>
            </div>
            <div>
                <div class="card-title">Total Pengeluaran</div>
                <div class="card-value text-red">${formatRp(d.total_pengeluaran)}</div>
            </div>
            <div>
                <div class="card-title">Laba / Rugi</div>
                <div class="card-value ${statusColor[d.status]}">${formatRp(d.laba_rugi)}</div>
            </div>
            <div>
                <div class="card-title">Status Usaha</div>
                <div class="card-value ${statusColor[d.status]}" style="font-size:18px">${statusText[d.status]}</div>
            </div>
        </div>
        <div style="margin-top:12px;padding:12px;background:#f8fafc;border-radius:6px">
            <strong>Margin Keuntungan:</strong> ${d.margin_keuntungan.toFixed(2)}%
        </div>
    </div>

    <div class="grid-2">
        <div class="card laporan-section">
            <h3>Rekap Pemasukan (${d.pemasukan.length} transaksi)</h3>
            ${renderLaporanTable(d.pemasukan)}
            <div style="text-align:right;font-weight:bold;margin-top:8px">Total: ${formatRp(d.total_pemasukan)}</div>
        </div>
        <div class="card laporan-section">
            <h3>Rekap Pengeluaran (${d.pengeluaran.length} transaksi)</h3>
            ${renderLaporanTable(d.pengeluaran)}
            <div style="text-align:right;font-weight:bold;margin-top:8px">Total: ${formatRp(d.total_pengeluaran)}</div>
        </div>
    </div>

    <div class="grid-2">
        <div class="card laporan-section">
            <h3>Rekap HPP (${d.hpp_list.length} data)</h3>
            ${renderLaporanHPP(d.hpp_list)}
        </div>
        <div class="card laporan-section">
            <h3>Rekap BEP (${d.bep_list.length} data)</h3>
            ${renderLaporanBEP(d.bep_list)}
        </div>
    </div>`;

    document.getElementById('laporan-content').innerHTML = html;
}

// ---- Helper tabel transaksi laporan ----
// ---- Helper tabel transaksi laporan ----
// Menggunakan kelas Bootstrap: table-hover, table-bordered, table-sm
function renderLaporanTable(data) {
    if (!data.length) return '<p style="color:#666;padding:12px">Tidak ada data.</p>';
    return `<table class="table table-hover table-bordered table-sm"><thead><tr><th>Tanggal</th><th>Nama</th><th>Jumlah</th></tr></thead><tbody>
        ${data.map(t => `<tr>
            <td>${formatTgl(t.tanggal)}</td>
            <td>${t.nama}</td>
            <td>${formatRp(t.jumlah)}</td>
        </tr>`).join('')}
    </tbody></table>`;
}

// ---- Helper tabel HPP laporan ----
// ---- Helper tabel HPP laporan ----
function renderLaporanHPP(list) {
    if (!list.length) return '<p style="color:#666;padding:12px">Belum ada data HPP.</p>';
    return `<table class="table table-hover table-bordered table-sm"><thead><tr><th>Produk</th><th>HPP/Unit</th><th>Margin</th></tr></thead><tbody>
        ${list.map(h => `<tr>
            <td>${h.nama_produk}</td>
            <td>${formatRp(h.hpp_per_produk)}</td>
            <td>${parseFloat(h.margin_keuntungan).toFixed(2)}%</td>
        </tr>`).join('')}
    </tbody></table>`;
}

// ---- Helper tabel BEP laporan ----
// ---- Helper tabel BEP laporan ----
function renderLaporanBEP(list) {
    if (!list.length) return '<p style="color:#666;padding:12px">Belum ada data BEP.</p>';
    return `<table class="table table-hover table-bordered table-sm"><thead><tr><th>Produk</th><th>BEP Unit</th><th>BEP Rupiah</th></tr></thead><tbody>
        ${list.map(b => `<tr>
            <td>${b.nama_produk}</td>
            <td>${Math.ceil(parseFloat(b.bep_unit))} unit</td>
            <td>${formatRp(parseFloat(b.bep_unit) * parseFloat(b.harga_jual))}</td>
        </tr>`).join('')}
    </tbody></table>`;
}
