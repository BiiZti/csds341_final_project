<?php
/**
 * Fetches the full Yu-Gi-Oh! card dataset from YGOPRODeck (v7) and stores both
 * the raw payload and a trimmed version used by the prototype UI.
 *
 * Run with: php scripts/fetch_cards.php
 */

const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const FULL_OUTPUT = __DIR__ . '/../web/assets/data/cards-full.json';
const LITE_OUTPUT = __DIR__ . '/../web/assets/data/cards.json';

main();

function main(): void
{
    echo "Requesting cards from " . API_URL . PHP_EOL;
    $payload = httpGet(API_URL);

    $json = json_decode($payload, true);
    if (!isset($json['data']) || !is_array($json['data'])) {
        fwrite(STDERR, "Unexpected API response: missing 'data' array." . PHP_EOL);
        exit(1);
    }

    $cards = $json['data'];
    printf("Fetched %d cards. Writing datasets...%s", count($cards), PHP_EOL);

    file_put_contents(FULL_OUTPUT, json_encode($cards, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo "Saved raw dataset to " . relativePath(FULL_OUTPUT) . PHP_EOL;

    $liteCards = array_map('transformCard', $cards);
    file_put_contents(LITE_OUTPUT, json_encode($liteCards, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    echo "Saved trimmed dataset to " . relativePath(LITE_OUTPUT) . PHP_EOL;
    echo "Done." . PHP_EOL;
}

function httpGet(string $url): string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'CSDS341-Final-Project/1.0',
        CURLOPT_ENCODING => '', // Accept gzip/deflate
    ]);

    $body = curl_exec($ch);
    if ($body === false) {
        fwrite(STDERR, "cURL error: " . curl_error($ch) . PHP_EOL);
        exit(1);
    }

    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);

    if ($status !== 200) {
        fwrite(STDERR, "API returned HTTP $status." . PHP_EOL);
        exit(1);
    }

    return $body;
}

function transformCard(array $card): array
{
    $imageSmall = null;
    $imageFull = null;
    if (!empty($card['card_images']) && is_array($card['card_images'])) {
        $firstImage = $card['card_images'][0];
        $imageSmall = $firstImage['image_url_small'] ?? null;
        $imageFull = $firstImage['image_url'] ?? null;
    }

    return [
        'id' => $card['id'] ?? null,
        'name' => $card['name'] ?? '',
        'type' => $card['type'] ?? '',
        'race' => $card['race'] ?? '',
        'attribute' => $card['attribute'] ?? '',
        'level' => $card['level'] ?? null,
        'atk' => $card['atk'] ?? null,
        'def' => $card['def'] ?? null,
        'link' => $card['linkval'] ?? null,
        'desc' => $card['desc'] ?? '',
        'archetype' => $card['archetype'] ?? '',
        'banlist_info' => $card['banlist_info'] ?? null,
        'image_url_small' => $imageSmall,
        'image_url' => $imageFull,
    ];
}

function relativePath(string $path): string
{
    return str_replace(getcwd() . DIRECTORY_SEPARATOR, '', realpath($path) ?: $path);
}

