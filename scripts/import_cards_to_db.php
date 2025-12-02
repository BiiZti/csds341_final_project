<?php
/**
 * Loads cards.json (generated via fetch_cards.php) into the MariaDB cards table.
 * Usage: php scripts/import_cards_to_db.php
 */

declare(strict_types=1);

$root = dirname(__DIR__);
$cardsFile = $root . '/web/assets/data/cards.json';
$config = require $root . '/config/database.sample.php';
if (file_exists($root . '/config/database.php')) {
    $config = require $root . '/config/database.php';
}

if (!file_exists($cardsFile)) {
    fwrite(STDERR, "Missing cards.json. Run scripts/fetch_cards.php first.\n");
    exit(1);
}

$cards = json_decode(file_get_contents($cardsFile), true);
if (!is_array($cards)) {
    fwrite(STDERR, "Unable to decode cards.json\n");
    exit(1);
}

$pdo = new PDO(
    $config['dsn'],
    $config['username'],
    $config['password'],
    $config['options']
);

$pdo->exec('SET FOREIGN_KEY_CHECKS=0');
$pdo->exec('TRUNCATE TABLE cards');
$pdo->exec('SET FOREIGN_KEY_CHECKS=1');

$stmt = $pdo->prepare(
    'INSERT INTO cards
    (card_id, name, type, race, attribute, level, atk, def, card_text, archetype,
     limit_tcg, limit_ocg, limit_goat, image_path)
     VALUES
    (:card_id, :name, :type, :race, :attribute, :level, :atk, :def, :card_text, :archetype,
     :limit_tcg, :limit_ocg, :limit_goat, :image_path)'
);

$count = 0;
foreach ($cards as $card) {
    $stmt->execute([
        ':card_id' => $card['id'],
        ':name' => $card['name'] ?? '',
        ':type' => $card['type'] ?? '',
        ':race' => $card['race'] ?? '',
        ':attribute' => $card['attribute'] ?? null,
        ':level' => $card['level'] ?? null,
        ':atk' => $card['atk'] ?? null,
        ':def' => $card['def'] ?? null,
        ':card_text' => $card['desc'] ?? '',
        ':archetype' => $card['archetype'] ?? null,
        ':limit_tcg' => mapBanStatus($card['banlist_info']['ban_tcg'] ?? null),
        ':limit_ocg' => mapBanStatus($card['banlist_info']['ban_ocg'] ?? null),
        ':limit_goat' => mapBanStatus($card['banlist_info']['ban_goat'] ?? null),
        ':image_path' => isset($card['image_url']) ? $card['image_url'] : null,
    ]);
    $count++;
}

echo "Imported {$count} cards into the database.\n";

function mapBanStatus(?string $raw): string
{
    return match ($raw) {
        'Forbidden' => 'Forbidden',
        'Limited' => 'Limited',
        'Semi-Limited' => 'Semi-Limited',
        default => 'Unlimited',
    };
}

