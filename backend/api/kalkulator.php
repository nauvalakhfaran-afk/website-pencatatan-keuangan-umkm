<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../includes/config.php';
$user_id = authRequired();
$db = getDB();

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'hpp'; // hpp atau bep

if ($type === 'hpp') {
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';
            if ($action === 'list') {
                $stmt = $db->prepare("SELECT * FROM hpp WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$user_id]);
                jsonResponse($stmt->fetchAll());
            } elseif ($action === 'hitung') {
                // Hitung HPP tanpa simpan
                $bahan_baku = (float)($_GET['bahan_baku'] ?? 0);
                $tenaga_kerja = (float)($_GET['tenaga_kerja'] ?? 0);
                $operasional = (float)($_GET['operasional'] ?? 0);
                $jumlah_produk = max(1, (int)($_GET['jumlah_produk'] ?? 1));
                $harga_jual = (float)($_GET['harga_jual'] ?? 0);

                $total_biaya = $bahan_baku + $tenaga_kerja + $operasional;
                $hpp_per_produk = $total_biaya / $jumlah_produk;
                $margin = $harga_jual > 0 ? (($harga_jual - $hpp_per_produk) / $harga_jual) * 100 : 0;

                jsonResponse([
                    'total_biaya_produksi' => $total_biaya,
                    'hpp_per_produk' => $hpp_per_produk,
                    'harga_jual' => $harga_jual,
                    'margin_keuntungan' => $margin,
                    'laba_per_produk' => $harga_jual - $hpp_per_produk,
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $tanggal = $data['tanggal'] ?? date('Y-m-d');
            $nama_produk = trim($data['nama_produk'] ?? '');
            $bahan_baku = (float)($data['biaya_bahan_baku'] ?? 0);
            $tenaga_kerja = (float)($data['biaya_tenaga_kerja'] ?? 0);
            $operasional = (float)($data['biaya_operasional'] ?? 0);
            $jumlah_produk = max(1, (int)($data['jumlah_produk'] ?? 1));
            $harga_jual = (float)($data['harga_jual'] ?? 0);

            if (empty($nama_produk)) jsonResponse(['error' => 'Nama produk wajib diisi'], 400);

            $stmt = $db->prepare("
                INSERT INTO hpp (user_id, tanggal, nama_produk, biaya_bahan_baku, biaya_tenaga_kerja, biaya_operasional, jumlah_produk, harga_jual) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user_id, $tanggal, $nama_produk, $bahan_baku, $tenaga_kerja, $operasional, $jumlah_produk, $harga_jual]);

            $total_biaya = $bahan_baku + $tenaga_kerja + $operasional;
            $hpp_per_produk = $total_biaya / $jumlah_produk;
            $margin = $harga_jual > 0 ? (($harga_jual - $hpp_per_produk) / $harga_jual) * 100 : 0;

            jsonResponse([
                'success' => true,
                'id' => $db->lastInsertId(),
                'hpp_per_produk' => $hpp_per_produk,
                'margin_keuntungan' => $margin,
                'message' => 'Data HPP berhasil disimpan'
            ]);
            break;

        case 'DELETE':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("DELETE FROM hpp WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Data tidak ditemukan'], 404);
            jsonResponse(['success' => true, 'message' => 'Data HPP berhasil dihapus']);
            break;
    }
} elseif ($type === 'bep') {
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';
            if ($action === 'list') {
                $stmt = $db->prepare("SELECT * FROM bep WHERE user_id = ? ORDER BY created_at DESC");
                $stmt->execute([$user_id]);
                jsonResponse($stmt->fetchAll());
            } elseif ($action === 'hitung') {
                $biaya_tetap = (float)($_GET['biaya_tetap'] ?? 0);
                $harga_jual = (float)($_GET['harga_jual'] ?? 0);
                $biaya_variabel = (float)($_GET['biaya_variabel'] ?? 0);

                $kontribusi_margin = $harga_jual - $biaya_variabel;
                if ($kontribusi_margin <= 0) {
                    jsonResponse(['error' => 'Harga jual harus lebih besar dari biaya variabel'], 400);
                }

                $bep_unit = $biaya_tetap / $kontribusi_margin;
                $bep_rupiah = $bep_unit * $harga_jual;

                jsonResponse([
                    'biaya_tetap' => $biaya_tetap,
                    'harga_jual' => $harga_jual,
                    'biaya_variabel' => $biaya_variabel,
                    'kontribusi_margin' => $kontribusi_margin,
                    'bep_unit' => $bep_unit,
                    'bep_rupiah' => $bep_rupiah,
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $tanggal = $data['tanggal'] ?? date('Y-m-d');
            $nama_produk = trim($data['nama_produk'] ?? '');
            $biaya_tetap = (float)($data['biaya_tetap'] ?? 0);
            $harga_jual = (float)($data['harga_jual'] ?? 0);
            $biaya_variabel = (float)($data['biaya_variabel'] ?? 0);

            if (empty($nama_produk)) jsonResponse(['error' => 'Nama produk wajib diisi'], 400);
            if ($harga_jual <= $biaya_variabel) jsonResponse(['error' => 'Harga jual harus lebih besar dari biaya variabel'], 400);

            $stmt = $db->prepare("
                INSERT INTO bep (user_id, tanggal, nama_produk, biaya_tetap, harga_jual, biaya_variabel) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user_id, $tanggal, $nama_produk, $biaya_tetap, $harga_jual, $biaya_variabel]);

            $bep_unit = $biaya_tetap / ($harga_jual - $biaya_variabel);

            jsonResponse([
                'success' => true,
                'id' => $db->lastInsertId(),
                'bep_unit' => $bep_unit,
                'bep_rupiah' => $bep_unit * $harga_jual,
                'message' => 'Data BEP berhasil disimpan'
            ]);
            break;

        case 'DELETE':
            $id = (int)($_GET['id'] ?? 0);
            $stmt = $db->prepare("DELETE FROM bep WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user_id]);
            if ($stmt->rowCount() === 0) jsonResponse(['error' => 'Data tidak ditemukan'], 404);
            jsonResponse(['success' => true, 'message' => 'Data BEP berhasil dihapus']);
            break;
    }
} else {
    jsonResponse(['error' => 'Type tidak valid'], 400);
}
