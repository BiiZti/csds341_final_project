<?php
$pageTitle = 'Deck Builder';
include __DIR__ . '/includes/head.php';
?>
<section class="panel deck-builder-layout">
    <aside>
        <h3>Filters</h3>
        <form class="filters small" id="builderFilters">
            <div>
                <label for="builderSearch">Search</label>
                <input type="text" id="builderSearch" placeholder="Blue-Eyes">
            </div>
            <div>
                <label for="builderAttribute">Attribute</label>
                <select id="builderAttribute">
                    <option value="">Any</option>
                </select>
            </div>
            <div>
                <label for="builderType">Race / Monster Type</label>
                <select id="builderType">
                    <option value="">Any</option>
                </select>
            </div>
            <div>
                <label for="builderLevel">Level (max)</label>
                <select id="builderLevel">
                    <option value="">Any</option>
                    <option value="4">4</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                </select>
            </div>
        </form>
        <div class="panel">
            <h3>Deck Info</h3>
            <label for="deckName">Deck Name</label>
            <input type="text" id="deckName" placeholder="My Blue-Eyes Build">
            <label for="deckFormat">Format</label>
            <select id="deckFormat">
                <option value="Advanced">Advanced</option>
                <option value="Traditional">Traditional</option>
                <option value="GOAT">GOAT</option>
            </select>
            <label for="deckVisibility">Visibility</label>
            <select id="deckVisibility">
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
            </select>
            <label for="deckDescription">Description</label>
            <input type="text" id="deckDescription" placeholder="Optional deck notes">
            <label for="banlistFormat">Banlist Enforcement</label>
            <select id="banlistFormat">
                <option value="ban_tcg" selected>Advanced (TCG)</option>
                <option value="ban_ocg">OCG</option>
                <option value="ban_goat">GOAT</option>
            </select>
            <p class="deck-note">Deck Builder enforces a maximum of 3 copies per card and applies the selected banlist automatically.</p>
            <div class="deck-warnings" id="deckWarnings">
                Main Deck: 0/20 &bull; Side Deck: 0/6 &bull; Banlist: Advanced (TCG)
            </div>
            <div class="deck-save-status" id="deckSaveStatus"></div>
            <button id="saveDeck" type="button">Save Deck</button>
        </div>
    </aside>

    <section>
        <div class="results-meta" id="builderCardMeta">Loading builder cards…</div>
        <div class="card-grid" id="builderCardGrid">
            <p>Loading sample cards...</p>
        </div>
        <button class="btn secondary" id="builderMoreBtn" hidden>Load more cards</button>
    </section>

    <aside>
        <div class="deck-zone">
            <h3>Main Deck (<span id="mainCount">0</span>/20)</h3>
            <div class="deck-slot-grid" id="mainDeckSlots"></div>
        </div>
        <div class="deck-zone">
            <h3>Side Deck (<span id="sideCount">0</span>/6)</h3>
            <div class="deck-slot-grid" id="sideDeckSlots"></div>
        </div>
    </aside>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

