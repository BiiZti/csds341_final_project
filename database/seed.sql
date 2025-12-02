USE ygo_platform;

INSERT INTO users (username, email, password_hash, role, bio) VALUES
('kaiba', 'kaiba@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'CEO & Blue-Eyes enthusiast'),
('yugi', 'yugi@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player', 'King of Games'),
('jaden', 'jaden@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'player', 'Elemental HERO main');

INSERT INTO decks (user_id, name, format, visibility, description) VALUES
((SELECT user_id FROM users WHERE username='kaiba'), 'Blue-Eyes Tempo', 'Advanced', 'public', 'Fast-paced Blue-Eyes list for demo.'),
((SELECT user_id FROM users WHERE username='yugi'), 'Dark Magician Control', 'Advanced', 'public', 'Classic control shell highlighting banlist UI.'),
((SELECT user_id FROM users WHERE username='jaden'), 'Elemental HERO Neos Fusion', 'Traditional', 'unlisted', 'Used for CLI snapshot tests.');

-- Sample snapshot referencing JSON payload (trimmed)
INSERT INTO deck_snapshots (deck_id, exported_by, payload_json, notes)
VALUES (
    (SELECT deck_id FROM decks WHERE name='Blue-Eyes Tempo'),
    (SELECT user_id FROM users WHERE username='kaiba'),
    JSON_OBJECT('name','Blue-Eyes Tempo','main', JSON_ARRAY('Blue-Eyes White Dragon','Blue-Eyes Alternative White Dragon')),
    'Initial export for presentation slides'
);

