<?php
declare(strict_types=1);

require __DIR__ . '/includes/session.php';

session_unset();
session_destroy();

header('Location: login.php');
exit;

