<?php
require_once __DIR__ . '/session.php';
$pageTitle = $pageTitle ?? 'YGO Deck Studio';
$currentUser = $_SESSION['username'] ?? null;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header class="site-header">
        <div class="brand">
            <span class="logo">YGO</span>
            <div>
                <div class="brand-title">Duelingbook-inspired Deck Studio</div>
                <div class="brand-subtitle">CSDS 341 Final Project Prototype</div>
            </div>
        </div>
        <nav class="main-nav">
            <a href="card-database.php">Card Database</a>
            <a href="deck-builder.php">Deck Builder</a>
            <a href="public-decks.php">Public Decks</a>
            <?php if ($currentUser): ?>
                <span class="nav-user">Welcome, <?= htmlspecialchars($currentUser) ?></span>
                <a href="logout.php" class="nav-auth">Log out</a>
            <?php else: ?>
                <a href="login.php" class="nav-auth">Log in</a>
                <a href="register.php" class="nav-highlight">Register</a>
            <?php endif; ?>
        </nav>
    </header>
    <main class="page-content">

