# Database Layer

This project targets MariaDB/MySQL (matching the XAMPP stack). The schema satisfies the CSDS 341 requirements:

- 6 normalized tables (`users`, `cards`, `decks`, `deck_cards`, `sessions`, `deck_snapshots`) with clear PK/FK constraints.
- Triggers enforcing deck size constraints.
- CLI utilities feed the schema (`scripts/fetch_cards.php`, `scripts/download_card_images.php`).

## Setup

```bash
# From repository root
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

## Table Summary

| Table | Purpose |
| --- | --- |
| `users` | Accounts for both CLI and web entry points. |
| `cards` | Canonical card catalog; populated from YGOPRODeck API seed. |
| `decks` | Deck metadata, ownership, visibility, timestamps. |
| `deck_cards` | Junction table storing card assignments + slot (main/side) + copy count. |
| `sessions` | Token storage for web + CLI authentication. |
| `deck_snapshots` | JSON exports for report appendices and grading artifacts. |

## Seed Data

- Three users (Kaiba, Yugi, Jaden) plus sample decks and one snapshot.
- Default password for all sample accounts is `password`. Change immediately after logging in.
- Run `scripts/fetch_cards.php` after seeding to ingest the 14k card catalog and update `cards`.

## Next Steps

- Wire PHP via `includes/db.php` (see forthcoming implementation) to open PDO connections using the above schema.
- Extend CLI tools to read/write `deck_cards`, ensuring FKs/Triggers remain satisfied.

