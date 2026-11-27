<?php
require_once "connection.php";

// Rubrik D: Image Picking & Base64 Uploading
// POST ke uploadimage.php: menerima 'id' dan 'image' (base64 string)
// Berkas disimpan di direktori server images/[id]/[timestamp].png

$id = isset($_POST['id']) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['id']) : 'general';
$base64_image = isset($_POST['image']) ? $_POST['image'] : '';

if (empty($base64_image)) {
    echo json_encode([
        "result" => "error",
        "message" => "Image data (base64) is required."
    ]);
    exit();
}

// Hapus prefix data:image/...;base64, jika ada
if (preg_match('/^data:image\/(\w+);base64,/', $base64_image, $type)) {
    $base64_image = substr($base64_image, strpos($base64_image, ',') + 1);
}

$decoded_image = base64_decode($base64_image);

if ($decoded_image === false) {
    echo json_encode([
        "result" => "error",
        "message" => "Base64 decode failed."
    ]);
    exit();
}

$target_dir = __DIR__ . "/images/" . $id . "/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$timestamp = time();
$file_name = $timestamp . ".png";
$file_path = $target_dir . $file_name;

if (file_put_contents($file_path, $decoded_image)) {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $uri_dir = rtrim(dirname($_SERVER['REQUEST_URI']), '/\\');
    $image_url = $protocol . $host . $uri_dir . "/images/" . $id . "/" . $file_name;

    echo json_encode([
        "result" => "success",
        "message" => "Image uploaded successfully.",
        "file_name" => $file_name,
        "image_url" => $image_url,
        "relative_path" => "images/" . $id . "/" . $file_name
    ]);
} else {
    echo json_encode([
        "result" => "error",
        "message" => "Failed to save image to server directory."
    ]);
}
?>
