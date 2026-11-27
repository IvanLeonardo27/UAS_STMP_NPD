-- Database Schema for JasTipGo
-- Web Service MySQL: ubaya.fun / ubaya.xyz

CREATE DATABASE IF NOT EXISTS `jastipgo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jastipgo`;

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Penitip', 'Jastiper') NOT NULL DEFAULT 'Penitip',
  `saldo` DECIMAL(12, 2) NOT NULL DEFAULT 350000.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabel Trips (Open Trip)
CREATE TABLE IF NOT EXISTS `trips` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `nama_trip` VARCHAR(150) NOT NULL,
  `lokasi_tujuan` VARCHAR(150) NOT NULL,
  `tgl_berangkat` DATE NOT NULL,
  `tgl_kembali` DATE NOT NULL,
  `status` ENUM('Draft', 'Aktif', 'Live', 'Selesai') NOT NULL DEFAULT 'Aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Tabel Kategori
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama_kategori` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. Tabel Items (Katalog Barang)
CREATE TABLE IF NOT EXISTS `items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT NOT NULL,
  `nama_barang` VARCHAR(150) NOT NULL,
  `harga` DECIMAL(12, 2) NOT NULL,
  `stok` INT NOT NULL DEFAULT 0,
  `deskripsi` TEXT,
  `foto_url` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabel Relasi Many-to-Many Item & Kategori
CREATE TABLE IF NOT EXISTS `item_categories` (
  `item_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`item_id`, `category_id`),
  FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabel Custom Requests (Penitip)
CREATE TABLE IF NOT EXISTS `requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `trip_id` INT DEFAULT NULL,
  `nama_barang` VARCHAR(150) NOT NULL,
  `perkiraan_harga` DECIMAL(12, 2) NOT NULL,
  `catatan` TEXT,
  `foto_referensi` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('Menunggu', 'ACC', 'Ditolak') NOT NULL DEFAULT 'Menunggu',
  `stok_disetujui` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Tabel Cart (Keranjang Belanja)
CREATE TABLE IF NOT EXISTS `cart` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_item` (`user_id`, `item_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Tabel Transaksi Header (Orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_code` VARCHAR(20) NOT NULL UNIQUE,
  `penitip_id` INT NOT NULL,
  `jastiper_id` INT NOT NULL,
  `total_harga` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('Dipesan', 'Dibeli', 'Dikirim', 'Tiba', 'Selesai') NOT NULL DEFAULT 'Dipesan',
  `is_saldo_released` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`penitip_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jastiper_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Tabel Transaksi Detail (Order Details)
CREATE TABLE IF NOT EXISTS `order_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `item_id` INT NOT NULL,
  `nama_barang` VARCHAR(150) NOT NULL,
  `harga` DECIMAL(12, 2) NOT NULL,
  `qty` INT NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 10. Tabel Live Trip GPS Check-ins
CREATE TABLE IF NOT EXISTS `trip_checkins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `trip_id` INT NOT NULL,
  `jastiper_id` INT NOT NULL,
  `nama_lokasi` VARCHAR(150) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `foto_selfie_url` VARCHAR(255) DEFAULT NULL,
  `waktu_checkin` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`jastiper_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- DATA AWAL (SEED DATA)
INSERT INTO `categories` (`id`, `nama_kategori`) VALUES
(1, 'Kuliner'),
(2, 'Oleh-oleh'),
(3, 'Kosmetik'),
(4, 'Fashion'),
(5, 'Elektronik')
ON DUPLICATE KEY UPDATE `nama_kategori`=VALUES(`nama_kategori`);

-- User Demo
INSERT INTO `users` (`id`, `nama`, `email`, `password`, `role`, `saldo`) VALUES
(1, 'Kevin Jastiper', 'kevin@jastipgo.com', '123456', 'Jastiper', 1250000.00),
(2, 'Rani Wijaya', 'rani@email.com', '123456', 'Penitip', 350000.00),
(3, 'Dimas Pratama', 'dimas@email.com', '123456', 'Penitip', 500000.00),
(4, 'Sinta Dewi', 'sinta@email.com', '123456', 'Penitip', 250000.00)
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

-- Trip Demo
INSERT INTO `trips` (`id`, `user_id`, `nama_trip`, `lokasi_tujuan`, `tgl_berangkat`, `tgl_kembali`, `status`) VALUES
(1, 1, 'Tokyo Spring Trip', 'Tokyo, Jepang', '2026-04-12', '2026-04-20', 'Live'),
(2, 1, 'Seoul Beauty Run', 'Seoul, Korea Selatan', '2026-05-01', '2026-05-08', 'Aktif')
ON DUPLICATE KEY UPDATE `nama_trip`=VALUES(`nama_trip`);

-- Items Demo
INSERT INTO `items` (`id`, `trip_id`, `nama_barang`, `harga`, `stok`, `deskripsi`, `foto_url`) VALUES
(1, 1, 'Tokyo Banana', 85000.00, 12, 'Kue pisang lembut isi custard khas Tokyo, dibeli di toko resmi bandara Haneda.', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80'),
(2, 2, 'Hada Labo Lotion', 120000.00, 6, 'Hydrating lotion dengan hyaluronic acid premium untuk kulit lembap glowing.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=80'),
(3, 1, 'Matcha KitKat', 45000.00, 15, 'Kitkat rasa teh hijau Uji Kyoto dengan rasa manis seimbang.', 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?auto=format&fit=crop&w=400&q=80'),
(4, 2, 'Mini Totebag', 150000.00, 4, 'Totebag aesthetic khas Hongdae fashion street.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80')
ON DUPLICATE KEY UPDATE `nama_barang`=VALUES(`nama_barang`);

-- Relasi Multi-Kategori (Many-to-Many)
-- Tokyo Banana: Kuliner (1) & Oleh-oleh (2)
INSERT INTO `item_categories` (`item_id`, `category_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 1),
(3, 2),
(4, 4)
ON DUPLICATE KEY UPDATE `category_id`=VALUES(`category_id`);

-- Sample Checkin GPS
INSERT INTO `trip_checkins` (`id`, `trip_id`, `jastiper_id`, `nama_lokasi`, `latitude`, `longitude`, `foto_selfie_url`, `waktu_checkin`) VALUES
(1, 1, 1, 'Tokyo Banana Store Haneda', 35.5494, 139.7798, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', '2026-04-12 11:05:00'),
(2, 1, 1, 'Don Quijote Shibuya', 35.6595, 139.7005, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', '2026-04-12 14:20:00')
ON DUPLICATE KEY UPDATE `nama_lokasi`=VALUES(`nama_lokasi`);
