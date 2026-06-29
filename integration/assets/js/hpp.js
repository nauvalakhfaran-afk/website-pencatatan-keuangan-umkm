/* =============================================
   SiKeuangan - Modul HPP (Harga Pokok Penjualan)
   File: assets/js/hpp.js
   Bergantung pada: utils.js
   ============================================= */

// ---- Hitung HPP secara real-time (tanpa simpan) ----
function hitungHPP() {
    const bahan = parseFloat(document.getElementById('hpp-bahan').value) || 0;
    const tk    = parseFloat(document.getElementById('hpp-tk').value)    || 0;
    const ops   = parseFloat(document.getElementById('hpp-ops').value)   || 0;
    const jml   = Math.max(1, parseInt(document.getElementById('hpp-jml').value)   || 1);
    const harga = parseFloat(document.getElementById('hpp-harga').value) || 0;

    const total  = bahan + tk + ops;
    const hpp    = total / jml;
    const margin = harga > 0 ? ((harga - hpp) / harga) * 100 : 0;
    const laba   = harga - hpp;

    document.getElementById('hpp-result').style.display = 'block';
    document.getElementById('r-total-biaya').textContent  = formatRp(total);
    document.getElementById('r-hpp').textContent          = formatRp(hpp);
    document.getElementById('r-harga-jual').textContent   = harga > 0 ? formatRp(harga) : '-';
    document.getElementById('r-laba-produk').textContent  = harga > 0 ? formatRp(laba)  : '-';
    document.getElementById('r-margin-hpp').textContent   = harga > 0 ? margin.toFixed(2) + '%' : '-';
}

// ---- Simpan data HPP ke database ----
async function simpanHPP() {
    const data = {
        tanggal          : document.getElementById('hpp-tanggal').value,
        nama_produk      : document.getElementById('hpp-nama').value,
        biaya_bahan_baku : document.getElementById('hpp-bahan').value || 0,
        biaya_tenaga_kerja: document.getElementById('hpp-tk').value   || 0,
        biaya_operasional: document.getElementById('hpp-ops').value   || 0,
        jumlah_produk    : document.getElementById('hpp-jml').value   || 1,
        harga_jual       : document.getElementById('hpp-harga').value || 0,
    };
    if (!data.nama_produk) return showAlert('alert-hpp', 'Nama produk wajib diisi');

    const r = await api('kalkulator.php?type=hpp', { method: 'POST', body: JSON.stringify(data) });
    if (r.error) return showAlert('alert-hpp', r.error);

    showAlert(
        'alert-hpp',
        `Data HPP disimpan. HPP/produk: ${formatRp(r.hpp_per_produk)}, Margin: ${parseFloat(r.margin_keuntungan).toFixed(2)}%`,
        'success'
    );
    loadHPP();
}

// ---- Muat riwayat HPP dari database ----
async function loadHPP() {
    const r    = await api('kalkulator.php?type=hpp&action=list');
    const data = Array.isArray(r) ? r : [];

    if (!data.length) {
        document.getElementById('tabel-hpp').innerHTML = '<p style="color:#666;padding:16px">Belum ada data HPP.</p>';
        return;
    }

    // Buat tabel dengan kelas Bootstrap untuk tampilan garis & hover
    let html = `<table class="table table-hover table-bordered table-sm"><thead><tr>
        <th>Tanggal</th><th>Produk</th><th>HPP/Unit</th><th>Harga Jual</th><th>Margin</th><th>Aksi</th>
    </tr></thead><tbody>`;

    data.forEach(h => {
        html += `<tr>
            <td>${formatTgl(h.tanggal)}</td>
            <td>${h.nama_produk}</td>
            <td>${formatRp(h.hpp_per_produk)}</td>
            <td>${h.harga_jual > 0 ? formatRp(h.harga_jual) : '-'}</td>
            <td>${h.harga_jual > 0 ? parseFloat(h.margin_keuntungan).toFixed(2) + '%' : '-'}</td>
            <td><button class="btn btn-danger btn-sm" onclick="hapusHPP(${h.id})">Hapus</button></td>
        </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('tabel-hpp').innerHTML = html;
}

// ---- Hapus data HPP ----
async function hapusHPP(id) {
    if (!confirm('Hapus data HPP ini?')) return;
    await api(`kalkulator.php?type=hpp&id=${id}`, { method: 'DELETE' });
    loadHPP();
}
