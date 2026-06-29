<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

require_once '../includes/config.php';
session_start();

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            jsonResponse(['error' => 'Username dan password wajib diisi'], 400);
        }

        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['error' => 'Username atau password salah'], 401);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['nama'] = $user['nama'];

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'nama' => $user['nama']
            ]
        ]);
        break;

    case 'logout':
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Berhasil logout']);
        break;

    case 'check':
        if (isset($_SESSION['user_id'])) {
            jsonResponse([
                'loggedIn' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'username' => $_SESSION['username'],
                    'nama' => $_SESSION['nama']
                ]
            ]);
        } else {
            jsonResponse(['loggedIn' => false]);
        }
        break;

    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';
        $nama = trim($data['nama'] ?? '');

        if (empty($username) || empty($password) || empty($nama)) {
            jsonResponse(['error' => 'Semua field wajib diisi'], 400);
        }
        if (strlen($password) < 6) {
            jsonResponse(['error' => 'Password minimal 6 karakter'], 400);
        }

        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Username sudah digunakan'], 400);
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (username, password, nama) VALUES (?, ?, ?)");
        $stmt->execute([$username, $hashed, $nama]);

        jsonResponse(['success' => true, 'message' => 'Registrasi berhasil']);
        break;

    default:
        jsonResponse(['error' => 'Action tidak valid'], 400);
}
