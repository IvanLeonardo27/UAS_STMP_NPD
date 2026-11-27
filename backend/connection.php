<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";
$db   = "jastipgo";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([
        "result" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit();
}
?>
