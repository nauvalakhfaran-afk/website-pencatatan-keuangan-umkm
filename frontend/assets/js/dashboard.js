/* =============================================
   SiKeuangan - Modul Dashboard
   File: assets/js/dashboard.js
   Bergantung pada: utils.js
   ============================================= */

let grafikChart = null;

async function loadDashboard() {
    const d = await api('transaksi.php?action=dashboard');

    // Kartu ringkasan
    document.getElementById('dash-pemasukan').textContent = formatRp(d.total_pemasukan);
    document.getElementById('dash-pengeluaran').textContent = formatRp(d.total_pengeluaran);
    document.getElementById('dash-saldo').textContent = formatRp(d.saldo);

    const labaEl = document.getElementById('dash-laba');
    labaEl.textContent = formatRp(d.laba_rugi);
    labaEl.className   = 'card-value ' + (d.laba_rugi >= 0 ? 'text-green' : 'text-red');

    const statusMap = { untung: '🟢 Untung', rugi: '🔴 Rugi', impas: '🟡 Impas' };
    document.getElementById('dash-status').textContent = statusMap[d.status_usaha] || '';
    document.getElementById('dash-margin').textContent = d.margin_keuntungan.toFixed(2) + '%';

    // HPP & BEP terbaru
    if (d.hpp_terbaru) {
        document.getElementById('dash-hpp').textContent      = formatRp(d.hpp_terbaru.hpp_per_produk);
        document.getElementById('dash-hpp-nama').textContent = d.hpp_terbaru.nama_produk;
    } else {
        document.getElementById('dash-hpp').textContent = 'Belum ada data';
    }

    if (d.bep_terbaru) {
        document.getElementById('dash-bep').textContent      = Math.ceil(d.bep_terbaru.bep_unit) + ' unit';
        document.getElementById('dash-bep-nama').textContent = d.bep_terbaru.nama_produk;
    } else {
        document.getElementById('dash-bep').textContent = 'Belum ada data';
    }

    // Grafik bar 6 bulan terakhir
    const labels        = d.grafik.map(g => g.label);
    const pemasukanData = d.grafik.map(g => parseFloat(g.pemasukan));
    const pengeluaranData = d.grafik.map(g => parseFloat(g.pengeluaran));

    if (grafikChart) grafikChart.destroy();
    const ctx = document.getElementById('chart-grafik').getContext('2d');
    grafikChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length ? labels : ['(belum ada data)'],
            datasets: [
                {
                    label: 'Pemasukan',
                    data: pemasukanData,
                    backgroundColor: 'rgba(22,163,74,0.7)',
                    borderColor: '#16a34a',
                    borderWidth: 1
                },
                {
                    label: 'Pengeluaran',
                    data: pengeluaranData,
                    backgroundColor: 'rgba(220,38,38,0.7)',
                    borderColor: '#dc2626',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => 'Rp ' + v.toLocaleString('id-ID') }
                }
            }
        }
    });
}
