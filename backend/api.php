<?php
require_once "connection.php";

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

switch ($action) {
    // ------------------------------------------------------------------------
    // A. AUTENTIKASI & PERAN
    // ------------------------------------------------------------------------
    case 'register':
        $nama = $_POST['nama'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';
        $role = $_POST['role'] ?? 'Penitip';

        if (empty($nama) || empty($email) || empty($password)) {
            echo json_encode(["result" => "error", "message" => "Semua field wajib diisi."]);
            exit();
        }

        $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $check->bind_param("s", $email);
        $check->execute();
        if ($check->get_result()->num_rows > 0) {
            echo json_encode(["result" => "error", "message" => "Email sudah terdaftar."]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO users (nama, email, password, role, saldo) VALUES (?, ?, ?, ?, 350000.00)");
        $stmt->bind_param("ssss", $nama, $email, $password, $role);
        if ($stmt->execute()) {
            $user_id = $stmt->insert_id;
            echo json_encode([
                "result" => "success",
                "message" => "Registrasi berhasil.",
                "data" => [
                    "id" => $user_id,
                    "nama" => $nama,
                    "email" => $email,
                    "role" => $role,
                    "saldo" => 350000.00
                ]
            ]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal mendaftarkan akun."]);
        }
        break;

    case 'login':
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        $stmt = $conn->prepare("SELECT id, nama, email, password, role, saldo FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows > 0) {
            $row = $res->fetch_assoc();
            if ($row['password'] === $password) {
                unset($row['password']);
                $row['saldo'] = (float)$row['saldo'];
                echo json_encode([
                    "result" => "success",
                    "message" => "Login berhasil.",
                    "data" => $row
                ]);
            } else {
                echo json_encode(["result" => "error", "message" => "Kata sandi salah."]);
            }
        } else {
            echo json_encode(["result" => "error", "message" => "Email tidak ditemukan."]);
        }
        break;

    case 'switch_role':
        $user_id = $_POST['user_id'] ?? 0;
        $new_role = $_POST['role'] ?? 'Penitip';

        $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->bind_param("si", $new_role, $user_id);
        if ($stmt->execute()) {
            echo json_encode(["result" => "success", "message" => "Peran berhasil diperbarui.", "role" => $new_role]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal mengganti peran."]);
        }
        break;

    // ------------------------------------------------------------------------
    // B. KATALOG TILE & MULTI-KATEGORI (MANY-TO-MANY)
    // ------------------------------------------------------------------------
    case 'get_catalog':
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? 'Semua';

        // Hanya barang yang trip-nya sedang aktif / live
        $sql = "SELECT i.id, i.trip_id, i.nama_barang, i.harga, i.stok, i.deskripsi, i.foto_url,
                       t.nama_trip, t.lokasi_tujuan, t.status AS trip_status,
                       u.nama AS jastiper_nama,
                       GROUP_CONCAT(c.nama_kategori SEPARATOR ',') AS categories
                FROM items i
                JOIN trips t ON i.trip_id = t.id
                JOIN users u ON t.user_id = u.id
                LEFT JOIN item_categories ic ON i.id = ic.item_id
                LEFT JOIN categories c ON ic.category_id = c.id
                WHERE i.is_active = 1 AND t.status IN ('Aktif', 'Live') AND i.stok > 0";

        $params = [];
        $types = "";

        if (!empty($search)) {
            $sql .= " AND (i.nama_barang LIKE ? OR t.nama_trip LIKE ? OR t.lokasi_tujuan LIKE ?)";
            $wildcard = "%" . $search . "%";
            $params[] = $wildcard;
            $params[] = $wildcard;
            $params[] = $wildcard;
            $types .= "sss";
        }

        $sql .= " GROUP BY i.id";

        if (!empty($category) && $category !== 'Semua') {
            $sql .= " HAVING FIND_IN_SET(?, categories) > 0";
            $params[] = $category;
            $types .= "s";
        }

        $sql .= " ORDER BY i.id DESC";

        $stmt = $conn->prepare($sql);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $res = $stmt->get_result();

        $items = [];
        while ($row = $res->fetch_assoc()) {
            $row['harga'] = (float)$row['harga'];
            $row['stok'] = (int)$row['stok'];
            $row['category_list'] = $row['categories'] ? explode(',', $row['categories']) : [];
            $items[] = $row;
        }

        echo json_encode(["result" => "success", "data" => $items]);
        break;

    // ------------------------------------------------------------------------
    // C. OPEN TRIP & FORM BARANG & EDIT DATA
    // ------------------------------------------------------------------------
    case 'create_trip':
        $user_id = $_POST['user_id'] ?? 0;
        $nama_trip = $_POST['nama_trip'] ?? '';
        $lokasi_tujuan = $_POST['lokasi_tujuan'] ?? '';
        $tgl_berangkat = $_POST['tgl_berangkat'] ?? '';
        $tgl_kembali = $_POST['tgl_kembali'] ?? '';

        $stmt = $conn->prepare("INSERT INTO trips (user_id, nama_trip, lokasi_tujuan, tgl_berangkat, tgl_kembali, status) VALUES (?, ?, ?, ?, ?, 'Aktif')");
        $stmt->bind_param("issss", $user_id, $nama_trip, $lokasi_tujuan, $tgl_berangkat, $tgl_kembali);

        if ($stmt->execute()) {
            $trip_id = $stmt->insert_id;
            echo json_encode(["result" => "success", "message" => "Trip berhasil dibuka.", "trip_id" => $trip_id]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal membuat trip."]);
        }
        break;

    case 'get_trip_detail':
        $trip_id = $_GET['trip_id'] ?? 0;
        $stmt = $conn->prepare("SELECT * FROM trips WHERE id = ?");
        $stmt->bind_param("i", $trip_id);
        $stmt->execute();
        $trip = $stmt->get_result()->fetch_assoc();

        if ($trip) {
            $item_stmt = $conn->prepare("SELECT i.*, GROUP_CONCAT(c.nama_kategori SEPARATOR ',') AS categories 
                                         FROM items i 
                                         LEFT JOIN item_categories ic ON i.id = ic.item_id 
                                         LEFT JOIN categories c ON ic.category_id = c.id 
                                         WHERE i.trip_id = ? 
                                         GROUP BY i.id");
            $item_stmt->bind_param("i", $trip_id);
            $item_stmt->execute();
            $item_res = $item_stmt->get_result();

            $items = [];
            while ($row = $item_res->fetch_assoc()) {
                $row['category_list'] = $row['categories'] ? explode(',', $row['categories']) : [];
                $items[] = $row;
            }
            $trip['items'] = $items;
            echo json_encode(["result" => "success", "data" => $trip]);
        } else {
            echo json_encode(["result" => "error", "message" => "Trip tidak ditemukan."]);
        }
        break;

    case 'update_trip':
        $trip_id = $_POST['trip_id'] ?? 0;
        $nama_trip = $_POST['nama_trip'] ?? '';
        $lokasi_tujuan = $_POST['lokasi_tujuan'] ?? '';
        $tgl_berangkat = $_POST['tgl_berangkat'] ?? '';
        $tgl_kembali = $_POST['tgl_kembali'] ?? '';

        $stmt = $conn->prepare("UPDATE trips SET nama_trip = ?, lokasi_tujuan = ?, tgl_berangkat = ?, tgl_kembali = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $nama_trip, $lokasi_tujuan, $tgl_berangkat, $tgl_kembali, $trip_id);

        if ($stmt->execute()) {
            echo json_encode(["result" => "success", "message" => "Trip berhasil diperbarui."]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal memperbarui trip."]);
        }
        break;

    case 'save_item':
        // Add or Edit item
        $item_id = $_POST['item_id'] ?? 0;
        $trip_id = $_POST['trip_id'] ?? 0;
        $nama_barang = $_POST['nama_barang'] ?? '';
        $harga = $_POST['harga'] ?? 0;
        $stok = $_POST['stok'] ?? 0;
        $deskripsi = $_POST['deskripsi'] ?? '';
        $foto_url = $_POST['foto_url'] ?? '';
        $categories_json = $_POST['categories'] ?? '[]'; // e.g. ["Kuliner", "Oleh-oleh"]

        $categories = json_decode($categories_json, true);
        if (!is_array($categories)) $categories = [];

        if ($item_id > 0) {
            $stmt = $conn->prepare("UPDATE items SET nama_barang=?, harga=?, stok=?, deskripsi=?, foto_url=? WHERE id=?");
            $stmt->bind_param("sdisis", $nama_barang, $harga, $stok, $deskripsi, $foto_url, $item_id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO items (trip_id, nama_barang, harga, stok, deskripsi, foto_url) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isdiss", $trip_id, $nama_barang, $harga, $stok, $deskripsi, $foto_url);
            $stmt->execute();
            $item_id = $stmt->insert_id;
        }

        // Simpan relasi kategori Many-to-Many
        $conn->query("DELETE FROM item_categories WHERE item_id = $item_id");
        foreach ($categories as $catName) {
            $cat_stmt = $conn->prepare("SELECT id FROM categories WHERE nama_kategori = ?");
            $cat_stmt->bind_param("s", $catName);
            $cat_stmt->execute();
            $cat_res = $cat_stmt->get_result();
            if ($cat_res->num_rows > 0) {
                $cat_id = $cat_res->fetch_assoc()['id'];
            } else {
                $ins_cat = $conn->prepare("INSERT INTO categories (nama_kategori) VALUES (?)");
                $ins_cat->bind_param("s", $catName);
                $ins_cat->execute();
                $cat_id = $ins_cat->insert_id;
            }
            $ins_rel = $conn->prepare("INSERT IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)");
            $ins_rel->bind_param("ii", $item_id, $cat_id);
            $ins_rel->execute();
        }

        echo json_encode(["result" => "success", "message" => "Barang berhasil disimpan.", "item_id" => $item_id]);
        break;

    // ------------------------------------------------------------------------
    // D. REQUEST TITIPAN & ACC REQUEST DENGAN STOK
    // ------------------------------------------------------------------------
    case 'create_request':
        $user_id = $_POST['user_id'] ?? 0;
        $trip_id = $_POST['trip_id'] ?? 1;
        $nama_barang = $_POST['nama_barang'] ?? '';
        $perkiraan_harga = $_POST['perkiraan_harga'] ?? 0;
        $catatan = $_POST['catatan'] ?? '';
        $foto_referensi = $_POST['foto_referensi'] ?? '';

        $stmt = $conn->prepare("INSERT INTO requests (user_id, trip_id, nama_barang, perkiraan_harga, catatan, foto_referensi) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisdss", $user_id, $trip_id, $nama_barang, $perkiraan_harga, $catatan, $foto_referensi);

        if ($stmt->execute()) {
            echo json_encode(["result" => "success", "message" => "Request titipan berhasil dikirim ke jastiper."]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal mengirim request."]);
        }
        break;

    case 'get_requests':
        $sql = "SELECT r.*, u.nama AS pemohon_nama, t.nama_trip 
                FROM requests r 
                JOIN users u ON r.user_id = u.id 
                LEFT JOIN trips t ON r.trip_id = t.id 
                ORDER BY r.id DESC";
        $res = $conn->query($sql);
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(["result" => "success", "data" => $data]);
        break;

    case 'acc_request':
        // Menyetujui request dan menetapkan kuantitas stok agar otomatis tayang di katalog
        $request_id = $_POST['request_id'] ?? 0;
        $stok = (int)($_POST['stok'] ?? 1);
        $harga = (float)($_POST['harga'] ?? 0);

        $stmt = $conn->prepare("SELECT * FROM requests WHERE id = ?");
        $stmt->bind_param("i", $request_id);
        $stmt->execute();
        $req = $stmt->get_result()->fetch_assoc();

        if (!$req) {
            echo json_encode(["result" => "error", "message" => "Request tidak ditemukan."]);
            exit();
        }

        $trip_id = $req['trip_id'] ? $req['trip_id'] : 1;
        if ($harga <= 0) $harga = $req['perkiraan_harga'];

        // 1. Update status request
        $upd = $conn->prepare("UPDATE requests SET status = 'ACC', stok_disetujui = ? WHERE id = ?");
        $upd->bind_param("ii", $stok, $request_id);
        $upd->execute();

        // 2. Insert otomatis ke katalog barang
        $ins = $conn->prepare("INSERT INTO items (trip_id, nama_barang, harga, stok, deskripsi, foto_url) VALUES (?, ?, ?, ?, ?, ?)");
        $deskripsi = "Request dari penitip: " . $req['catatan'];
        $ins->bind_param("isdiss", $trip_id, $req['nama_barang'], $harga, $stok, $deskripsi, $req['foto_referensi']);
        $ins->execute();
        $new_item_id = $ins->insert_id;

        // Beri kategori default
        $conn->query("INSERT IGNORE INTO item_categories (item_id, category_id) VALUES ($new_item_id, 1)");

        echo json_encode(["result" => "success", "message" => "Request berhasil di-ACC dan ditayangkan ke katalog."]);
        break;

    case 'reject_request':
        $request_id = $_POST['request_id'] ?? 0;
        $stmt = $conn->prepare("UPDATE requests SET status = 'Ditolak' WHERE id = ?");
        $stmt->bind_param("i", $request_id);
        $stmt->execute();
        echo json_encode(["result" => "success", "message" => "Request ditolak."]);
        break;

    // ------------------------------------------------------------------------
    // E. SHOPPING CART & CHECKOUT SALDO
    // ------------------------------------------------------------------------
    case 'checkout':
        // Penitip checkout menggunakan saldo. Saldo dipotong & disimpan pada order sampai diterima
        $penitip_id = $_POST['user_id'] ?? 0;
        $items_json = $_POST['items'] ?? '[]'; // [{item_id, qty, price}]
        $total_harga = (float)($_POST['total_harga'] ?? 0);

        $items = json_decode($items_json, true);
        if (empty($items) || $total_harga <= 0) {
            echo json_encode(["result" => "error", "message" => "Keranjang kosong atau total tidak valid."]);
            exit();
        }

        // Cek saldo penitip
        $u_stmt = $conn->prepare("SELECT saldo FROM users WHERE id = ?");
        $u_stmt->bind_param("i", $penitip_id);
        $u_stmt->execute();
        $penitip = $u_stmt->get_result()->fetch_assoc();

        if (!$penitip || (float)$penitip['saldo'] < $total_harga) {
            echo json_encode(["result" => "error", "message" => "Saldo tidak mencukupi untuk melakukan checkout."]);
            exit();
        }

        $conn->begin_transaction();
        try {
            // Potong saldo penitip
            $potong = $conn->prepare("UPDATE users SET saldo = saldo - ? WHERE id = ?");
            $potong->bind_param("di", $total_harga, $penitip_id);
            $potong->execute();

            // Dapatkan jastiper_id dari item pertama
            $first_item_id = $items[0]['item_id'];
            $j_stmt = $conn->query("SELECT t.user_id AS jastiper_id FROM items i JOIN trips t ON i.trip_id = t.id WHERE i.id = $first_item_id");
            $jastiper_id = $j_stmt->fetch_assoc()['jastiper_id'] ?? 1;

            // Buat order header
            $order_code = "JTG-" . str_pad(rand(100, 9999), 4, "0", STR_PAD_LEFT);
            $ord = $conn->prepare("INSERT INTO orders (order_code, penitip_id, jastiper_id, total_harga, status) VALUES (?, ?, ?, ?, 'Dipesan')");
            $ord->bind_param("siid", $order_code, $penitip_id, $jastiper_id, $total_harga);
            $ord->execute();
            $order_id = $ord->insert_id;

            // Masukkan order details & kurangi stok item
            foreach ($items as $it) {
                $it_id = (int)$it['item_id'];
                $qty = (int)$it['qty'];
                $subtotal = (float)$it['price'] * $qty;

                // get item name
                $nm_res = $conn->query("SELECT nama_barang FROM items WHERE id = $it_id")->fetch_assoc();
                $nama_b = $nm_res['nama_barang'] ?? 'Barang Jastip';

                $dtl = $conn->prepare("INSERT INTO order_details (order_id, item_id, nama_barang, harga, qty, subtotal) VALUES (?, ?, ?, ?, ?, ?)");
                $dtl->bind_param("iisdid", $order_id, $it_id, $nama_b, $it['price'], $qty, $subtotal);
                $dtl->execute();

                // Kurangi stok
                $conn->query("UPDATE items SET stok = GREATEST(0, stok - $qty) WHERE id = $it_id");
            }

            // Hapus dari cart
            $conn->query("DELETE FROM cart WHERE user_id = $penitip_id");

            $conn->commit();
            echo json_encode([
                "result" => "success",
                "message" => "Checkout berhasil menggunakan saldo.",
                "order_code" => $order_code,
                "order_id" => $order_id
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["result" => "error", "message" => "Checkout gagal: " . $e->getMessage()]);
        }
        break;

    case 'get_orders':
        $user_id = $_GET['user_id'] ?? 0;
        $role = $_GET['role'] ?? 'Penitip';

        if ($role === 'Jastiper') {
            $sql = "SELECT o.*, u.nama AS penitip_nama FROM orders o JOIN users u ON o.penitip_id = u.id WHERE o.jastiper_id = ? ORDER BY o.id DESC";
        } else {
            $sql = "SELECT o.*, u.nama AS jastiper_nama FROM orders o JOIN users u ON o.jastiper_id = u.id WHERE o.penitip_id = ? ORDER BY o.id DESC";
        }

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $res = $stmt->get_result();

        $orders = [];
        while ($ord = $res->fetch_assoc()) {
            $ord_id = $ord['id'];
            $d_res = $conn->query("SELECT * FROM order_details WHERE order_id = $ord_id");
            $details = [];
            while ($d = $d_res->fetch_assoc()) {
                $details[] = $d;
            }
            $ord['details'] = $details;
            $orders[] = $ord;
        }

        echo json_encode(["result" => "success", "data" => $orders]);
        break;

    case 'confirm_received':
        // Konfirmasi terima barang oleh Penitip -> Saldo berpindah ke Jastiper
        $order_id = $_POST['order_id'] ?? 0;

        $stmt = $conn->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->bind_param("i", $order_id);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();

        if (!$order) {
            echo json_encode(["result" => "error", "message" => "Pesanan tidak ditemukan."]);
            exit();
        }

        if ($order['is_saldo_released'] == 1) {
            echo json_encode(["result" => "error", "message" => "Transaksi sudah selesai sebelumnya."]);
            exit();
        }

        $conn->begin_transaction();
        try {
            // Update order status ke Selesai
            $conn->query("UPDATE orders SET status = 'Selesai', is_saldo_released = 1 WHERE id = $order_id");

            // Tambahkan saldo ke Jastiper
            $total = (float)$order['total_harga'];
            $jastiper_id = (int)$order['jastiper_id'];
            $conn->query("UPDATE users SET saldo = saldo + $total WHERE id = $jastiper_id");

            $conn->commit();
            echo json_encode(["result" => "success", "message" => "Pesanan selesai dan saldo berhasil diteruskan ke Jastiper."]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(["result" => "error", "message" => "Gagal konfirmasi pesanan: " . $e->getMessage()]);
        }
        break;

    // ------------------------------------------------------------------------
    // F. SALDO & TOPUP
    // ------------------------------------------------------------------------
    case 'topup':
        $user_id = $_POST['user_id'] ?? 0;
        $amount = (float)($_POST['amount'] ?? 0);

        if ($amount <= 0) {
            echo json_encode(["result" => "error", "message" => "Nominal topup tidak valid."]);
            exit();
        }

        $stmt = $conn->prepare("UPDATE users SET saldo = saldo + ? WHERE id = ?");
        $stmt->bind_param("di", $amount, $user_id);
        if ($stmt->execute()) {
            $s_stmt = $conn->prepare("SELECT saldo FROM users WHERE id = ?");
            $s_stmt->bind_param("i", $user_id);
            $s_stmt->execute();
            $new_saldo = $s_stmt->get_result()->fetch_assoc()['saldo'];

            echo json_encode([
                "result" => "success",
                "message" => "Top up saldo berhasil.",
                "saldo" => (float)$new_saldo
            ]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal melakukan top up."]);
        }
        break;

    case 'get_saldo':
        $user_id = $_GET['user_id'] ?? 0;
        $stmt = $conn->prepare("SELECT saldo FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $saldo = $stmt->get_result()->fetch_assoc()['saldo'] ?? 0;
        echo json_encode(["result" => "success", "saldo" => (float)$saldo]);
        break;

    // ------------------------------------------------------------------------
    // G. LIVE TRIP GPS & SELFIE CHECK-IN
    // ------------------------------------------------------------------------
    case 'checkin_gps':
        $trip_id = $_POST['trip_id'] ?? 1;
        $jastiper_id = $_POST['jastiper_id'] ?? 1;
        $nama_lokasi = $_POST['nama_lokasi'] ?? 'Lokasi Toko';
        $latitude = $_POST['latitude'] ?? 0.0;
        $longitude = $_POST['longitude'] ?? 0.0;
        $foto_selfie_url = $_POST['foto_selfie_url'] ?? '';

        $stmt = $conn->prepare("INSERT INTO trip_checkins (trip_id, jastiper_id, nama_lokasi, latitude, longitude, foto_selfie_url) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisdds", $trip_id, $jastiper_id, $nama_lokasi, $latitude, $longitude, $foto_selfie_url);

        if ($stmt->execute()) {
            echo json_encode(["result" => "success", "message" => "Check-in GPS dan selfie berhasil disimpan."]);
        } else {
            echo json_encode(["result" => "error", "message" => "Gagal menyimpan check-in."]);
        }
        break;

    case 'get_checkins':
        $trip_id = $_GET['trip_id'] ?? 1;
        $stmt = $conn->prepare("SELECT tc.*, t.nama_trip, u.nama AS jastiper_nama 
                                FROM trip_checkins tc 
                                JOIN trips t ON tc.trip_id = t.id 
                                JOIN users u ON tc.jastiper_id = u.id 
                                WHERE tc.trip_id = ? 
                                ORDER BY tc.id DESC");
        $stmt->bind_param("i", $trip_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(["result" => "success", "data" => $data]);
        break;

    // ------------------------------------------------------------------------
    // H. SUMMARY PESANAN JASTIPER
    // ------------------------------------------------------------------------
    case 'get_summary':
        $jastiper_id = $_GET['jastiper_id'] ?? 1;

        $sql = "SELECT od.nama_barang, SUM(od.qty) AS total_qty, GROUP_CONCAT(DISTINCT u.nama SEPARATOR ', ') AS pemesan
                FROM order_details od
                JOIN orders o ON od.order_id = o.id
                JOIN users u ON o.penitip_id = u.id
                WHERE o.jastiper_id = ?
                GROUP BY od.nama_barang
                ORDER BY total_qty DESC";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $jastiper_id);
        $stmt->execute();
        $res = $stmt->get_result();

        $summary = [];
        $total_items = 0;
        $unique_buyers = [];

        while ($row = $res->fetch_assoc()) {
            $row['total_qty'] = (int)$row['total_qty'];
            $total_items += $row['total_qty'];
            $summary[] = $row;
        }

        echo json_encode([
            "result" => "success",
            "data" => [
                "total_barang" => $total_items,
                "summary_list" => $summary
            ]
        ]);
        break;

    default:
        echo json_encode(["result" => "error", "message" => "Action '$action' not recognized."]);
        break;
}
?>
