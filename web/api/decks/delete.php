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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST required.']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
$deckId = isset($payload['deck_id']) ? (int) $payload['deck_id'] : 0;
if ($deckId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid deck id.']);
    exit;
}

$stmt = $pdo->prepare('DELETE FROM decks WHERE deck_id = :deck_id AND user_id = :user_id');
$stmt->execute([
    ':deck_id' => $deckId,
    ':user_id' => $_SESSION['user_id'],
]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['error' => 'Deck not found or permission denied.']);
    exit;
}

echo json_encode(['success' => true]);

