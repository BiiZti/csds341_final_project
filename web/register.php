<?php
declare(strict_types=1);

require __DIR__ . '/includes/session.php';
require __DIR__ . '/includes/db.php';

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if ($username === '' || $email === '' || $password === '') {
        $errors[] = 'All fields are required.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Email address is invalid.';
    }
    if ($password !== $confirm) {
        $errors[] = 'Passwords do not match.';
    }
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters.';
    }

    if (!$errors) {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM users WHERE username = :username OR email = :email');
        $stmt->execute([':username' => $username, ':email' => $email]);
        if ($stmt->fetchColumn() > 0) {
            $errors[] = 'Username or email already in use.';
        } else {
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $insert = $pdo->prepare('INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, "player")');
            $insert->execute([
                ':username' => $username,
                ':email' => $email,
                ':password_hash' => $hash,
            ]);
            $success = 'Account created! You can now log in.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register · YGO Deck Studio</title>
    <link rel="stylesheet" href="assets/css/auth.css">
</head>
<body class="auth-page">
<div class="auth-wrapper">
    <div class="auth-hero">
        <img src="assets/images/card-placeholder.svg" alt="Yu-Gi-Oh! logo">
        <h1>Join the Duel</h1>
        <p>Create an account to build, share, and showcase decks.</p>
        <div class="auth-footer">
            Already registered? <a href="login.php">Log in</a>
        </div>
    </div>
    <div class="auth-panel">
        <h2>Create Account</h2>
        <?php if ($errors): ?>
            <div class="auth-error">
                <?= htmlspecialchars(implode(' ', $errors)) ?>
            </div>
        <?php elseif ($success): ?>
            <div class="auth-success"><?= htmlspecialchars($success) ?></div>
        <?php endif; ?>
        <form method="post" class="auth-form">
            <label>
                Username
                <input type="text" name="username" required>
            </label>
            <label>
                Email
                <input type="email" name="email" required>
            </label>
            <label>
                Password
                <input type="password" name="password" required>
            </label>
            <label>
                Confirm Password
                <input type="password" name="confirm" required>
            </label>
            <button type="submit">Register</button>
        </form>
    </div>
</div>
</body>
</html>

