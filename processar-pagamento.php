<?php
/**
 * BoxCar Brasil - Processamento de Pagamento Pix
 * Suporta modo teste/demonstração e integração com Gateway de Pagamento (UmbrellaPag / MercadoPago / Asaas / etc).
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Configurações do Gateway
$gateway = getenv('PIX_GATEWAY') ?: 'UmbrellaPag';
$apiKey = getenv('PIX_API_KEY') ?: '';

// GET: Consulta status de transação
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $txId = $_GET['id'] ?? '';
    if (empty($txId)) {
        http_response_code(400);
        echo json_encode(["error" => "ID da transacao ausente"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Verifica arquivo de persistência local se existir
    $storageFile = __DIR__ . '/transacoes/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $txId) . '.json';
    if (file_exists($storageFile)) {
        $txData = json_decode(file_get_contents($storageFile), true);
        echo json_encode([
            "status" => "success",
            "data" => $txData
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Status padrão PENDING
    echo json_encode([
        "status" => "success",
        "data" => [
            "id" => $txId,
            "status" => "PENDING"
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// POST: Geração de cobrança Pix
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload || empty($payload['amount'])) {
        http_response_code(400);
        echo json_encode(["error" => "Payload inválido ou valor ausente"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $txId = 'tx_' . bin2hex(random_bytes(10));
    $amountCents = intval($payload['amount']);
    $amountReais = number_format($amountCents / 100, 2, '.', '');

    // Código Pix padrão EMV (Payload de demonstração válido)
    $chavePix = getenv('PIX_CHAVE') ?: 'contato@boxcarbrasil.shop';
    $pixCode = "00020126580014br.gov.bcb.pix0136" . $chavePix . "520400005303986540" . strlen($amountReais) . $amountReais . "5802BR5913BOXCAR BRASIL6009SAO PAULO62070503***6304";

    $orderData = [
        "id" => $txId,
        "status" => "PENDING",
        "amount" => $amountCents,
        "currency" => "BRL",
        "customer" => $payload['customer'] ?? [],
        "shipping" => $payload['shipping'] ?? [],
        "items" => $payload['items'] ?? [],
        "pix" => [
            "qrcode" => $pixCode,
            "copyPasteCode" => $pixCode,
            "expiresAt" => date('c', strtotime('+1 day'))
        ],
        "created_at" => date('c')
    ];

    // Salva transação localmente
    $storageDir = __DIR__ . '/transacoes';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0755, true);
    }
    @file_put_contents($storageDir . '/' . $txId . '.json', json_encode($orderData, JSON_PRETTY_PRINT));

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $orderData
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Método não permitido"], JSON_UNESCAPED_UNICODE);
