/* =============================================
   SiKeuangan - Modul BEP (Break Even Point)
   File: assets/js/bep.js
   Bergantung pada: utils.js
   ============================================= */

// ---- Hitung BEP secara real-time (tanpa simpan) ----
function hitungBEP() {
    const tetap    = parseFloat(document.getElementById('bep-tetap').value)    || 0;
    const harga    = parseFloat(document.getElementById('bep-harga').value)    || 0;
    const variabel = parseFloat(document.getElementById('bep-variabel').value) || 0;

    const km     = harga - variabel;           // Kontribusi Margin per unit
    const bepUnit = km > 0 ? tetap / km : 0;
    const bepRp   = bepUnit * harga;

    document.getElementById('bep-result').style.display = 'block';
    document.getElementById('r-bep-tetap').textContent = formatRp(tetap);
    document.getElementById('r-bep-harga').textContent = formatRp(harga);
    document.getElementById('r-bep-var').textContent   = formatRp(variabel);
    document.getElementById('r-bep-km').textContent    = formatRp(km);
    document.getElementById('r-bep-unit').textContent  = km > 0 ? Math.ceil(bepUnit) + ' unit' : '-';
    document.getElementById('r-bep-rp').textContent    = km > 0 ? formatRp(bepRp) : '-';
}

// ---- Simpan data BEP ke database ----
async function simpanBEP() {
    const data = {
        tanggal       : document.getElementById('bep-tanggal').value,
        nama_produk   : document.getElementById('bep-nama').value,
        biaya_tetap   : document.getElementById('bep-tetap').value    || 0,
        harga_jual    : document.getElementById('bep-harga').value    || 0,
        biaya_variabel: document.getElementById('bep-variabel').value || 0,
    };
    if (!data.nama_produk) return showAlert('alert-bep', 'Nama produk wajib diisi');

    const r = await api('kalkulator.php?type=bep', { method: 'POST', body: JSON.stringify(data) });
    if (r.error) return showAlert('alert-bep', r.error);

    showAlert(
        'alert-bep',
        `BEP disimpan: ${Math.ceil(r.bep_unit)} unit = ${formatRp(r.bep_rupiah)}`,
        'success'
    );
    loadBEP();
}

// ---- Muat riwayat BEP dari database ----
async function loadBEP() {
    const r    = await api('kalkulator.php?type=bep&action=list');
    const data = Array.isArray(r) ? r : [];

    if (!data.length) {
        document.getElementById('tabel-bep').innerHTML = '<p style="color:#666;padding:16px">Belum ada data BEP.</p>';
        return;
    }

    // Buat tabel dengan kelas Bootstrap untuk tampilan garis & hover
    let html = `<table class="table table-hover table-bordered table-sm"><thead><tr>
        <th>Tanggal</th><th>Produk</th><th>Biaya Tetap</th><th>BEP Unit</th><th>BEP Rupiah</th><th>Aksi</th>
    </tr></thead><tbody>`;

    data.forEach(b => {
        const bepUnit = parseFloat(b.bep_unit);
        const bepRp   = bepUnit * parseFloat(b.harga_jual);
        html += `<tr>
            <td>${formatTgl(b.tanggal)}</td>
            <td>${b.nama_produk}</td>
            <td>${formatRp(b.biaya_tetap)}</td>
            <td><strong>${Math.ceil(bepUnit)} unit</strong></td>
            <td>${formatRp(bepRp)}</td>
            <td><button class="btn btn-danger btn-sm" onclick="hapusBEP(${b.id})">Hapus</button></td>
        </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('tabel-bep').innerHTML = html;
}

// ---- Hapus data BEP ----
async function hapusBEP(id) {
    if (!confirm('Hapus data BEP ini?')) return;
    await api(`kalkulator.php?type=bep&id=${id}`, { method: 'DELETE' });
    loadBEP();
}
