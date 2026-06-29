-- Database: keuangan_usaha
CREATE DATABASE IF NOT EXISTS keuangan_usaha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE keuangan_usaha;

-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel transaksi (pemasukan & pengeluaran)
CREATE TABLE IF NOT EXISTS transaksi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tanggal DATE NOT NULL,
    jenis ENUM('pemasukan', 'pengeluaran') NOT NULL,
    nama VARCHAR(100) NOT NULL,
    jumlah DECIMAL(15,2) NOT NULL,
    keterangan TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel hpp (Harga Pokok Penjualan)
CREATE TABLE IF NOT EXISTS hpp (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tanggal DATE NOT NULL,
    nama_produk VARCHAR(100) NOT NULL,
    biaya_bahan_baku DECIMAL(15,2) NOT NULL DEFAULT 0,
    biaya_tenaga_kerja DECIMAL(15,2) NOT NULL DEFAULT 0,
    biaya_operasional DECIMAL(15,2) NOT NULL DEFAULT 0,
    jumlah_produk INT NOT NULL DEFAULT 1,
    hpp_per_produk DECIMAL(15,2) GENERATED ALWAYS AS ((biaya_bahan_baku + biaya_tenaga_kerja + biaya_operasional) / jumlah_produk) STORED,
    harga_jual DECIMAL(15,2) DEFAULT 0,
    margin_keuntungan DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN harga_jual > 0 
        THEN ((harga_jual - (biaya_bahan_baku + biaya_tenaga_kerja + biaya_operasional) / jumlah_produk) / harga_jual) * 100
        ELSE 0 END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabel bep (Break Even Point)
CREATE TABLE IF NOT EXISTS bep (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tanggal DATE NOT NULL,
    nama_produk VARCHAR(100) NOT NULL,
    biaya_tetap DECIMAL(15,2) NOT NULL DEFAULT 0,
    harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0,
    biaya_variabel DECIMAL(15,2) NOT NULL DEFAULT 0,
    bep_unit DECIMAL(15,4) GENERATED ALWAYS AS (
        CASE WHEN (harga_jual - biaya_variabel) > 0
        THEN biaya_tetap / (harga_jual - biaya_variabel)
        ELSE 0 END
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Default admin user (password: admin123)
INSERT INTO users (username, password, nama) VALUES 
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator')
ON DUPLICATE KEY UPDATE username=username;
