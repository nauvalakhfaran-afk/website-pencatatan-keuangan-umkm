<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../includes/config.php';
$user_id = authRequired();
$db = getDB();

$bulan = $_GET['bulan'] ?? date('Y-m');
$tgl_dari = $_GET['tgl_dari'] ?? '';
$tgl_sampai = $_GET['tgl_sampai'] ?? '';

// Gunakan filter tanggal jika ada, else bulan
if ($tgl_dari && $tgl_sampai) {
    $whereDate = "AND tanggal BETWEEN ? AND ?";
    $dateParams = [$tgl_dari, $tgl_sampai];
} else {
    $whereDate = "AND DATE_FORMAT(tanggal, '%Y-%m') = ?";
    $dateParams = [$bulan];
}

// Rekap pemasukan
$stmt = $db->prepare("
    SELECT tanggal, nama, jumlah, keterangan 
    FROM transaksi 
    WHERE user_id = ? AND jenis = 'pemasukan' $whereDate
    ORDER BY tanggal ASC
");
$stmt->execute(array_merge([$user_id], $dateParams));
$pemasukan = $stmt->fetchAll();

// Rekap pengeluaran
$stmt = $db->prepare("
    SELECT tanggal, nama, jumlah, keterangan 
    FROM transaksi 
    WHERE user_id = ? AND jenis = 'pengeluaran' $whereDate
    ORDER BY tanggal ASC
");
$stmt->execute(array_merge([$user_id], $dateParams));
$pengeluaran = $stmt->fetchAll();

// Total
$total_pemasukan = array_sum(array_column($pemasukan, 'jumlah'));
$total_pengeluaran = array_sum(array_column($pengeluaran, 'jumlah'));
$laba_rugi = $total_pemasukan - $total_pengeluaran;
$margin = $total_pemasukan > 0 ? ($laba_rugi / $total_pemasukan) * 100 : 0;

// HPP terbaru
$stmt = $db->prepare("SELECT * FROM hpp WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
$stmt->execute([$user_id]);
$hpp_list = $stmt->fetchAll();

// BEP terbaru
$stmt = $db->prepare("SELECT * FROM bep WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
$stmt->execute([$user_id]);
$bep_list = $stmt->fetchAll();

jsonResponse([
    'periode' => $bulan,
    'tgl_dari' => $tgl_dari,
    'tgl_sampai' => $tgl_sampai,
    'pemasukan' => $pemasukan,
    'pengeluaran' => $pengeluaran,
    'total_pemasukan' => (float)$total_pemasukan,
    'total_pengeluaran' => (float)$total_pengeluaran,
    'laba_rugi' => (float)$laba_rugi,
    'margin_keuntungan' => (float)$margin,
    'status' => $laba_rugi > 0 ? 'untung' : ($laba_rugi < 0 ? 'rugi' : 'impas'),
    'hpp_list' => $hpp_list,
    'bep_list' => $bep_list,
]);
