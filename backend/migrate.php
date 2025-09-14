<?php
// migrate.php
header('Content-Type: text/plain');

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
    die("Database connection failed: " . $e->getMessage() . PHP_EOL);
}

echo "Connected to database.\n";

// set ?fresh=1 if you want to rebuild the table from scratch
$fresh = isset($_GET['fresh']) && $_GET['fresh'] == '1';

if ($fresh) {
    $pdo->exec("DROP TABLE IF EXISTS `users`");
    echo "Dropped old 'users' table.\n";
}

$createTableSQL = "
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(32) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_users_email` (`email`),
    UNIQUE KEY `uq_users_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

$pdo->exec($createTableSQL);
echo "Ensured 'users' table exists (created if missing).\n";

echo "Done.\n";
