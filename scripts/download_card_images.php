<?php
/**
 * Downloads card artwork referenced in cards.json for offline use.
 * Usage: php scripts/download_card_images.php [limit]
 * By default downloads the first 200 images that are missing locally.
 */

const CARDS_JSON = __DIR__ . '/../web/assets/data/cards.json';
const IMAGE_DIR = __DIR__ . '/../web/assets/images/cards';

$limit = isset($argv[1]) ? max(0, (int) $argv[1]) : 200;

if (!file_exists(CARDS_JSON)) {
    fwrite(STDERR, "cards.json not found. Run fetch_cards.php first." . PHP_EOL);
    exit(1);
}

if (!is_dir(IMAGE_DIR) && !mkdir(IMAGE_DIR, 0777, true) && !is_dir(IMAGE_DIR)) {
    fwrite(STDERR, "Unable to create image directory: " . IMAGE_DIR . PHP_EOL);
    exit(1);
}

$cards = json_decode(file_get_contents(CARDS_JSON), true);
if (!is_array($cards)) {
    fwrite(STDERR, "Failed to decode cards.json" . PHP_EOL);
    exit(1);
}

$downloaded = 0;
$skipped = 0;

foreach ($cards as $card) {
    if ($limit > 0 && $downloaded >= $limit) {
        break;
    }
    if (empty($card['image_url_small']) || empty($card['id'])) {
        $skipped++;
        continue;
    }

    $destination = IMAGE_DIR . '/' . $card['id'] . '.jpg';
    if (file_exists($destination)) {
        continue;
    }

    if (downloadImage($card['image_url_small'], $destination)) {
        $downloaded++;
        echo "Downloaded image for {$card['name']} ({$card['id']})" . PHP_EOL;
    } else {
        $skipped++;
    }
}

echo "Completed. Downloaded $downloaded images, skipped $skipped." . PHP_EOL;

function downloadImage(string $url, string $destination): bool
{
    $ch = curl_init($url);
    $fp = fopen($destination, 'wb');
    if (!$fp) {
        fwrite(STDERR, "Cannot write to $destination" . PHP_EOL);
        return false;
    }

    curl_setopt_array($ch, [
        CURLOPT_FILE => $fp,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_USERAGENT => 'CSDS341-Final-Project/1.0',
    ]);

    $success = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    fclose($fp);

    if (!$success || $status !== 200) {
        unlink($destination);
        fwrite(STDERR, "Failed to download $url (HTTP $status)" . PHP_EOL);
        return false;
    }

    return true;
}


