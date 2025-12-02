<?php
declare(strict_types=1);

header('Content-Type: application/json');

require __DIR__ . '/../includes/db.php';

$sql = 'SELECT card_id AS id, name, type, race, attribute, level, atk, def, card_text AS description,
               archetype, limit_tcg, limit_ocg, limit_goat, image_path
        FROM cards WHERE 1=1';
$params = [];

if (!empty($_GET['search'])) {
    $sql .= ' AND name LIKE :search';
    $params[':search'] = '%' . $_GET['search'] . '%';
}
if (!empty($_GET['attribute'])) {
    $sql .= ' AND attribute = :attribute';
    $params[':attribute'] = $_GET['attribute'];
}
if (!empty($_GET['type'])) {
    $sql .= ' AND type = :type';
    $params[':type'] = $_GET['type'];
}
if (!empty($_GET['race'])) {
    $sql .= ' AND race = :race';
    $params[':race'] = $_GET['race'];
}
if (!empty($_GET['level'])) {
    $sql .= ' AND level >= :level';
    $params[':level'] = (int) $_GET['level'];
}

$sql .= ' ORDER BY name ASC LIMIT 200';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode([
    'meta' => [
        'count' => $stmt->rowCount(),
    ],
    'data' => $stmt->fetchAll(),
]);

