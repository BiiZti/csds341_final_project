<?php
declare(strict_types=1);

require __DIR__ . '/../../includes/session.php';
require __DIR__ . '/../../includes/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Authentication required.']);
    exit;
}

$sql = "
    SELECT d.deck_id,
           d.name,
           d.format,
           d.visibility,
           d.description,
           d.updated_at,
           SUM(CASE WHEN dc.slot = 'main' THEN dc.copies ELSE 0 END) AS main_count,
           SUM(CASE WHEN dc.slot = 'side' THEN dc.copies ELSE 0 END) AS side_count,
           SUM(CASE WHEN dc.slot = 'extra' THEN dc.copies ELSE 0 END) AS extra_count
    FROM decks d
    LEFT JOIN deck_cards dc ON dc.deck_id = d.deck_id
    WHERE d.user_id = :user_id
    GROUP BY d.deck_id, d.name, d.format, d.visibility, d.description, d.updated_at
    ORDER BY d.updated_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([':user_id' => $_SESSION['user_id']]);
$decks = $stmt->fetchAll();

echo json_encode(['data' => $decks]);

