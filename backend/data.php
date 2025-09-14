<?php
// api.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle CORS preflight quickly
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['database']['host']};dbname={$config['database']['dbname']};charset=utf8mb4",
        $config['database']['username'],
        $config['database']['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed']);
    exit;
}

// read JSON body (fallback to form-data if not JSON)
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    $input = $_POST ?? [];
}

$action = $_GET['action'] ?? null;

// Helpers
function json_error($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['status' => 'error', 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'POST':
        if ($action === 'register') {
            // required: name, email, phone
            $name  = trim((string)($input['name'] ?? ''));
            $email = trim((string)($input['email'] ?? ''));
            $phone = trim((string)($input['phone'] ?? ''));

            if ($name === '' || $email === '' || $phone === '') {
                json_error('Missing required fields: name, email, phone');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                json_error('Invalid email format');
            }

            try {
                // Upsert by email/phone (unique indexes); return existing id if present
                $stmt = $pdo->prepare("
                    INSERT INTO users (name, email, phone)
                    VALUES (:name, :email, :phone)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        phone = VALUES(phone),
                        id = LAST_INSERT_ID(id),
                        updated_at = CURRENT_TIMESTAMP
                ");
                $stmt->execute([
                    ':name'  => $name,
                    ':email' => $email,
                    ':phone' => $phone,
                ]);

                $userId = (int)$pdo->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status'  => 'success',
                    'user_id' => $userId
                ], JSON_UNESCAPED_UNICODE);
                exit;
            } catch (PDOException $e) {
                // If something else goes wrong
                json_error('Could not save user', 500);
            }
        }

        json_error('Unknown POST action', 404);

    case 'GET':
        if ($action === 'user') {
            // Optional helper endpoint to fetch a user by id
            $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
            if ($id <= 0) json_error('Invalid id');

            $stmt = $pdo->prepare("SELECT id, name, email, phone, created_at, updated_at FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) json_error('User not found', 404);

            echo json_encode(['status' => 'success', 'user' => $user], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // simple health check
        if ($action === 'health') {
            echo json_encode(['status' => 'ok']);
            exit;
        }

        json_error('Unknown GET action', 404);

    default:
        json_error('Method not allowed', 405);
}
