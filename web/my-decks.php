<?php
declare(strict_types=1);
require __DIR__ . '/includes/session.php';
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$pageTitle = 'My Decks';
include __DIR__ . '/includes/head.php';
?>
<section class="panel">
    <h2>My Saved Decks</h2>
    <p>Decks you save in the builder appear here. Adjust visibility to publish them to the public gallery.</p>
    <div class="deck-list" id="myDeckList">
        <p>Loading your decks...</p>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

