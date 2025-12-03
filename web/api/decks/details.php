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

$deckId = isset($_GET['deck_id']) ? (int) $_GET['deck_id'] : 0;
if ($deckId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid deck id.']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM decks WHERE deck_id = :deck_id AND user_id = :user_id');
$stmt->execute([
    ':deck_id' => $deckId,
    ':user_id' => $_SESSION['user_id'],
]);
$deck = $stmt->fetch();

if (!$deck) {
    http_response_code(404);
    echo json_encode(['error' => 'Deck not found or permission denied.']);
    exit;
}

$cardsStmt = $pdo->prepare('SELECT card_id, slot, copies FROM deck_cards WHERE deck_id = :deck_id');
$cardsStmt->execute([':deck_id' => $deckId]);
$cards = $cardsStmt->fetchAll();

echo json_encode([
    'deck' => $deck,
    'cards' => $cards,
]);

