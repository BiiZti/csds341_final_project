<?php
declare(strict_types=1);

require __DIR__ . '/../../includes/session.php';
require __DIR__ . '/../../includes/db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'You must be logged in to save decks.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload.']);
    exit;
}

$name = trim($input['name'] ?? '');
$format = $input['format'] ?? 'Advanced';
$visibility = $input['visibility'] ?? 'private';
$description = trim($input['description'] ?? '');
$main = $input['main'] ?? [];
$side = $input['side'] ?? [];
$extra = $input['extra'] ?? [];
$deckId = isset($input['deck_id']) ? (int) $input['deck_id'] : 0;

$allowedFormats = ['Advanced', 'Traditional', 'GOAT'];
$allowedVisibility = ['private', 'unlisted', 'public'];

if ($name === '' || !in_array($format, $allowedFormats, true) || !in_array($visibility, $allowedVisibility, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Deck name, format, or visibility invalid.']);
    exit;
}

if (count($main) < 40 || count($main) > 60 || count($side) > 15 || count($extra) > 15) {
    http_response_code(400);
    echo json_encode(['error' => 'Deck sizes must be Main 40-60, Extra 0-15, Side 0-15 cards.']);
    exit;
}

try {
    $pdo->beginTransaction();

    if ($deckId > 0) {
        $check = $pdo->prepare('SELECT deck_id FROM decks WHERE deck_id = :deck_id AND user_id = :user_id');
        $check->execute([
            ':deck_id' => $deckId,
            ':user_id' => $_SESSION['user_id'],
        ]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Deck not found or permission denied.']);
            exit;
        }
        $update = $pdo->prepare('UPDATE decks SET name = :name, format = :format, visibility = :visibility, description = :description, updated_at = CURRENT_TIMESTAMP WHERE deck_id = :deck_id AND user_id = :user_id');
        $update->execute([
            ':name' => $name,
            ':format' => $format,
            ':visibility' => $visibility,
            ':description' => $description,
            ':deck_id' => $deckId,
            ':user_id' => $_SESSION['user_id'],
        ]);
        $pdo->prepare('DELETE FROM deck_cards WHERE deck_id = :deck_id')->execute([':deck_id' => $deckId]);
    } else {
        $stmt = $pdo->prepare('INSERT INTO decks (user_id, name, format, visibility, description) VALUES (:user_id, :name, :format, :visibility, :description)');
        $stmt->execute([
            ':user_id' => $_SESSION['user_id'],
            ':name' => $name,
            ':format' => $format,
            ':visibility' => $visibility,
            ':description' => $description,
        ]);
        $deckId = (int) $pdo->lastInsertId();
    }

    $insertCard = $pdo->prepare('INSERT INTO deck_cards (deck_id, card_id, slot, copies) VALUES (:deck_id, :card_id, :slot, :copies)');

    $aggregateInsert = function (array $cards, string $slot) use ($insertCard, $deckId) {
        $counts = [];
        foreach ($cards as $cardId) {
            $cardId = (int) $cardId;
            if ($cardId <= 0) {
                continue;
            }
            $counts[$cardId] = ($counts[$cardId] ?? 0) + 1;
        }
        foreach ($counts as $cardId => $copies) {
            $insertCard->execute([
                ':deck_id' => $deckId,
                ':card_id' => $cardId,
                ':slot' => $slot,
                ':copies' => min($copies, 3),
            ]);
        }
    };

    $aggregateInsert($main, 'main');
    $aggregateInsert($side, 'side');
    $aggregateInsert($extra, 'extra');

    $pdo->commit();

    echo json_encode(['success' => true, 'deck_id' => $deckId]);
} catch (Throwable $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save deck: ' . $e->getMessage()]);
}

