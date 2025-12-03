<?php
declare(strict_types=1);

require __DIR__ . '/../../includes/db.php';

header('Content-Type: application/json');

$limit = isset($_GET['limit']) ? max(1, min(50, (int) $_GET['limit'])) : 12;

$sql = "
    SELECT d.deck_id,
           d.name,
           d.format,
           d.description,
           d.updated_at,
           u.username,
           SUM(CASE WHEN dc.slot = 'main' THEN dc.copies ELSE 0 END) AS main_count,
           SUM(CASE WHEN dc.slot = 'side' THEN dc.copies ELSE 0 END) AS side_count,
           SUM(CASE WHEN dc.slot = 'extra' THEN dc.copies ELSE 0 END) AS extra_count
    FROM decks d
    JOIN users u ON u.user_id = d.user_id
    LEFT JOIN deck_cards dc ON dc.deck_id = d.deck_id
    WHERE d.visibility = 'public'
    GROUP BY d.deck_id, d.name, d.format, d.description, d.updated_at, u.username
    ORDER BY d.updated_at DESC
    LIMIT :limit
";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->execute();
$decks = $stmt->fetchAll();

echo json_encode(['data' => $decks]);

