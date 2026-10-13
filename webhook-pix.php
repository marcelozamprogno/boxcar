<?php
/**
 * BoxCar Brasil - Webhook para confirmação de pagamentos Pix
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        "status" => "active",
        "message" => "BoxCar Webhook Endpoint is ready and operational.",
        "meta_pixel" => "1164791589215930",
        "gateway" => getenv('PIX_GATEWAY') ?: "UmbrellaPag"
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    $txId = $data['id'] ?? $data['transaction_id'] ?? $data['external_id'] ?? '';
    $status = strtoupper($data['status'] ?? 'PAID');

    if ($txId) {
        $storageFile = __DIR__ . '/transacoes/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $txId) . '.json';
        if (file_exists($storageFile)) {
            $existing = json_decode(file_get_contents($storageFile), true);
            $existing['status'] = $status;
            $existing['updated_at'] = date('c');
            @file_put_contents($storageFile, json_encode($existing, JSON_PRETTY_PRINT));
        }
    }

    echo json_encode(["status" => "success", "received" => true], JSON_UNESCAPED_UNICODE);
    exit;
}
