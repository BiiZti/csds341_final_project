-- CSDS 341 Final Project - Yu-Gi-Oh! Platform Schema
-- Satisfies requirement of 5-10 tables with explicit constraints & FK relationships.

CREATE DATABASE IF NOT EXISTS ygo_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ygo_platform;

-- 1. Users -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50) NOT NULL UNIQUE,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('player', 'admin') NOT NULL DEFAULT 'player',
    bio            VARCHAR(280),
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Cards (imported from YGOPRODeck via CLI script) -------------------------
CREATE TABLE IF NOT EXISTS cards (
    card_id        INT PRIMARY KEY,
    name           VARCHAR(120) NOT NULL,
    type           VARCHAR(60) NOT NULL,
    race           VARCHAR(60),
    attribute      VARCHAR(15),
    level          TINYINT UNSIGNED,
    atk            SMALLINT,
    def            SMALLINT,
    card_text      TEXT,
    archetype      VARCHAR(80),
    limit_tcg      ENUM('Forbidden','Limited','Semi-Limited','Unlimited') DEFAULT 'Unlimited',
    limit_ocg      ENUM('Forbidden','Limited','Semi-Limited','Unlimited') DEFAULT 'Unlimited',
    limit_goat     ENUM('Forbidden','Limited','Semi-Limited','Unlimited') DEFAULT 'Unlimited',
    image_path     VARCHAR(255),
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_cards_name ON cards (name);
CREATE INDEX idx_cards_archetype ON cards (archetype);

-- 3. Decks -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS decks (
    deck_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL,
    name           VARCHAR(120) NOT NULL,
    format         ENUM('Advanced', 'Traditional', 'GOAT') NOT NULL DEFAULT 'Advanced',
    visibility     ENUM('private','unlisted','public') NOT NULL DEFAULT 'private',
    description    VARCHAR(400),
    is_locked      TINYINT(1) NOT NULL DEFAULT 0,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_decks_user ON decks (user_id);
CREATE INDEX idx_decks_visibility ON decks (visibility);

-- 4. Deck Cards ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deck_cards (
    deck_id      INT NOT NULL,
    card_id      INT NOT NULL,
    slot         ENUM('main','side') NOT NULL DEFAULT 'main',
    copies       TINYINT UNSIGNED NOT NULL DEFAULT 1 CHECK (copies BETWEEN 1 AND 3),
    PRIMARY KEY (deck_id, card_id, slot),
    CONSTRAINT fk_deck_cards_deck FOREIGN KEY (deck_id) REFERENCES decks(deck_id) ON DELETE CASCADE,
    CONSTRAINT fk_deck_cards_card FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Sessions (for CLI + web auth) -------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    session_id    CHAR(64) PRIMARY KEY,
    user_id       INT NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at    TIMESTAMP NOT NULL,
    user_agent    VARCHAR(255),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expiry ON sessions (expires_at);

-- 6. Deck Snapshots (for final report attachments) ---------------------------
CREATE TABLE IF NOT EXISTS deck_snapshots (
    snapshot_id   INT AUTO_INCREMENT PRIMARY KEY,
    deck_id       INT NOT NULL,
    exported_by   INT NULL,
    exported_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payload_json  JSON NOT NULL,
    notes         VARCHAR(255),
    CONSTRAINT fk_snapshots_deck FOREIGN KEY (deck_id) REFERENCES decks(deck_id) ON DELETE CASCADE,
    CONSTRAINT fk_snapshots_user FOREIGN KEY (exported_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_snapshots_deck ON deck_snapshots (deck_id);

-- Integrity helpers ----------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_limit_main_cards
BEFORE INSERT ON deck_cards
FOR EACH ROW
BEGIN
    IF NEW.slot = 'main' THEN
        IF (SELECT COALESCE(SUM(copies),0) FROM deck_cards WHERE deck_id = NEW.deck_id AND slot='main') + NEW.copies > 60 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Main deck cannot exceed 60 cards';
        END IF;
    ELSEIF NEW.slot = 'side' THEN
        IF (SELECT COALESCE(SUM(copies),0) FROM deck_cards WHERE deck_id = NEW.deck_id AND slot='side') + NEW.copies > 15 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Side deck cannot exceed 15 cards';
        END IF;
    END IF;
END$$
DELIMITER ;

