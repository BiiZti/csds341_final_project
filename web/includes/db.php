<?php
/**
 * Shared PDO bootstrap. Copy config/database.sample.php to config/database.php
 * and adjust credentials for your local XAMPP installation.
 */

declare(strict_types=1);

$configPath = dirname(__DIR__, 1) . '/../config/database.php';
if (!file_exists($configPath)) {
    $configPath = dirname(__DIR__, 1) . '/../config/database.sample.php';
}

$dbConfig = require $configPath;

try {
    $pdo = new PDO(
        $dbConfig['dsn'],
        $dbConfig['username'],
        $dbConfig['password'],
        $dbConfig['options']
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo 'Database connection failed: ' . htmlspecialchars($e->getMessage());
    exit;
}

