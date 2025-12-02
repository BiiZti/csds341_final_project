<?php
return [
    'dsn'      => 'mysql:host=127.0.0.1;port=3307;dbname=ygo_platform;charset=utf8mb4',
    'username' => 'root',
    'password' => '',
    'options'  => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ],
];

