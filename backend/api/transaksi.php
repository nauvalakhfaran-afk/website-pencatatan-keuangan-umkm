<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../includes/config.php';
$user_id = authRequired();
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'dashboard') {
            // Data dashboard
            $stmt = $db->prepare("
                SELECT 
                    COALESCE(SUM(CASE WHEN jenis='pemasukan' THEN jumlah ELSE 0 END), 0) as total_pemasukan,
                    COALESCE(SUM(CASE WHEN jenis='pengeluaran' THEN jumlah ELSE 0 END), 0) as total_pengeluaran
                FROM transaksi WHERE user_id = ?
            ");
            $stmt->execute([$user_id]);
            $summary = $stmt->fetch();

            $total_pemasukan = (float)$summary['total_pemasukan'];
            $total_pengeluaran = (float)$summary['total_pengeluaran'];
            $saldo = $total_pemasukan - $total_pengeluaran;
            $laba_rugi = $total_pemasukan - $total_pengeluaran;

            // Grafik per bulan (6 bulan terakhir)
            $stmt = $db->prepare("
                SELECT 
                    DATE_FORMAT(tanggal, '%Y-%m') as bulan,
                    DATE_FORMAT(tanggal, '%b %Y') as label,
                    COALESCE(SUM(CASE WHEN jenis='pemasukan' THEN jumlah ELSE 0 END), 0) as pemasukan,
                    COALESCE(SUM(CASE WHEN jenis='pengeluaran' THEN jumlah ELSE 0 END), 0) as pengeluaran
                FROM transaksi 
                WHERE user_id = ? AND tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
                GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b %Y')
                ORDER BY bulan ASC
            ");
            $stmt->execute([$user_id]);
            $grafik = $stmt->fetchAll();

            // HPP terbaru
            $stmt = $db->prepare("SELECT * FROM hpp WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$user_id]);
            $hpp_terbaru = $stmt->fetch();

            // BEP terbaru
            $stmt = $db->prepare("SELECT * FROM bep WHERE user_id = ? ORDER BY created_at DESC LIMIT 1");
            $stmt->execute([$user_id]);
            $bep_terbaru = $stmt->fetch();

            jsonResponse([
                'total_pemasukan' => $total_pemasukan,
                'total_pengeluaran' => $total_pengeluaran,
                'saldo' => $saldo,
                'laba_rugi' => $laba_rugi,
                'status_usaha' => $laba_rugi > 0 ? 'untung' : ($laba_rugi < 0 ? 'rugi' : 'impas'),
                'margin_keuntungan' => $total_pemasukan > 0 ? (($laba_rugi / $total_pemasukan) * 100) : 0,
                'grafik' => $grafik,
                'hpp_terbaru' => $hpp_terbaru,
                'bep_terbaru' => $bep_terbaru,
            ]);
        } elseif ($action === 'list') {
            $jenis = $_GET['jenis'] ?? '';
            $search = $_GET['search'] ?? '';
            $tgl_dari = $_GET['tgl_dari'] ?? '';
            $tgl_sampai = $_GET['tgl_sampai'] ?? '';
            $page = max(1, (int)($_GET['page'] ?? 1));
            $per_page = (int)($_GET['per_page'] ?? 20);
            $offset = ($page - 1) * $per_page;

            $where = ["user_id = ?"];
            $params = [$user_id];

            if ($jenis) { $where[] = "jenis = ?"; $params[] = $jenis; }
            if ($search) { $where[] = "(nama LIKE ? OR keterangan LIKE ?)"; $params[] = "%$search%"; $params[] = "%$search%"; }
            if ($tgl_dari) { $where[] = "tanggal >= ?"; $params[] = $tgl_dari; }
            if ($tgl_sampai) { $where[] = "tanggal <= ?"; $params[] = $tgl_sampai; }

            $whereStr = implode(' AND ', $where);

            // Count total
            $stmt = $db->prepare("SELECT COUNT(*) as total FROM transaksi WHERE $whereStr");
            $stmt->execute($params);
            $total = $stmt->fetch()['total'];

            // Fetch data
            $params_limit = array_merge($params, [$per_page, $offset]);
            $stmt = $db->prepare("SELECT * FROM transaksi WHERE $whereStr ORDER BY tanggal DESC, created_at DESC LIMIT ? OFFSET ?");
            $stmt->execute($params_limit);
            $data = $stmt->fetchAll();

            jsonResponse([
                'data' => $data,
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => ceil($total / $per_page)
            ]);
        } elseif ($action === 'detail') {
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("SELECT * FROM transaksi WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            $row = $stmt->fetch();
            if (!$row) jsonResponse(['error' => 'Transaksi tidak ditemukan'], 404);
            jsonResponse($row);
        } else {
            jsonResponse(['error' => 'Action tidak valid'], 400);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $tanggal = $data['tanggal'] ?? '';
        $jenis = $data['jenis'] ?? '';
        $nama = trim($data['nama'] ?? '');
        $jumlah = (float)($data['jumlah'] ?? 0);
        $keterangan = trim($data['keterangan'] ?? '');

        if (empty($tanggal) || empty($jenis) || empty($nama) || $jumlah <= 0) {
            jsonResponse(['error' => 'Tanggal, jenis, nama, dan jumlah wajib diisi dengan benar'], 400);
        }
        if (!in_array($jenis, ['pemasukan', 'pengeluaran'])) {
            jsonResponse(['error' => 'Jenis transaksi tidak valid'], 400);
        }

        $stmt = $db->prepare("INSERT INTO transaksi (user_id, tanggal, jenis, nama, jumlah, keterangan) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $tanggal, $jenis, $nama, $jumlah, $keterangan]);
        jsonResponse(['success' => true, 'id' => $db->lastInsertId(), 'message' => 'Transaksi berhasil ditambahkan']);
        break;

    case 'PUT':
        $id = (int)($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Cek kepemilikan
        $stmt = $db->prepare("SELECT id FROM transaksi WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Transaksi tidak ditemukan'], 404);

        $tanggal = $data['tanggal'] ?? '';
        $jenis = $data['jenis'] ?? '';
        $nama = trim($data['nama'] ?? '');
        $jumlah = (float)($data['jumlah'] ?? 0);
        $keterangan = trim($data['keterangan'] ?? '');

        if (empty($tanggal) || empty($jenis) || empty($nama) || $jumlah <= 0) {
            jsonResponse(['error' => 'Semua field wajib diisi dengan benar'], 400);
        }

        $stmt = $db->prepare("UPDATE transaksi SET tanggal=?, jenis=?, nama=?, jumlah=?, keterangan=? WHERE id=? AND user_id=?");
        $stmt->execute([$tanggal, $jenis, $nama, $jumlah, $keterangan, $id, $user_id]);
        jsonResponse(['success' => true, 'message' => 'Transaksi berhasil diupdate']);
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("DELETE FROM transaksi WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $user_id]);
        if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Transaksi tidak ditemukan'], 404);
        jsonResponse(['success' => true, 'message' => 'Transaksi berhasil dihapus']);
        break;

    default:
        jsonResponse(['error' => 'Method tidak valid'], 405);
}
