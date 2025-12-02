<?php
declare(strict_types=1);

require __DIR__ . '/includes/session.php';
require __DIR__ . '/includes/db.php';

$error = '';
if (isset($_SESSION['user_id'])) {
    header('Location: deck-builder.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Please enter both username and password.';
    } else {
        $stmt = $pdo->prepare('SELECT user_id, username, password_hash FROM users WHERE username = :username');
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['user_id'] = (int) $user['user_id'];
            $_SESSION['username'] = $user['username'];
            header('Location: deck-builder.php');
            exit;
        }
        $error = 'Invalid username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log in · YGO Deck Studio</title>
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page">
<div class="auth-wrapper">
    <div class="auth-hero">
        <img src="assets/images/card-placeholder.svg" alt="Yu-Gi-Oh! logo">
        <h1>Yu-Gi-Oh! Deck Studio</h1>
        <p>Deck building inspired by Duelingbook. Connect, collect, and duel.</p>
        <div class="auth-social">
            <span>🂠</span>
            <span>⚔</span>
            <span>★</span>
        </div>
        <div class="auth-footer">
            Need an account? <a href="register.php">Register now</a>
        </div>
    </div>
    <div class="auth-panel">
        <h2>Log in</h2>
        <p>Enter your credentials to continue.</p>
        <?php if ($error): ?>
            <div class="auth-error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>
        <form method="post" class="auth-form">
            <label>
                Username
                <input type="text" name="username" autocomplete="username" required>
            </label>
            <label>
                Password
                <input type="password" name="password" autocomplete="current-password" required>
            </label>
            <button type="submit">Log In</button>
        </form>
        <div class="auth-links">
            <a href="register.php">register</a>
            <a href="#">forgot password</a>
        </div>
    </div>
</div>
</body>
</html>

