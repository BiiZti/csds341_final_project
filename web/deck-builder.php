<?php
$pageTitle = 'Deck Builder';
include __DIR__ . '/includes/head.php';
?>
<section class="deck-builder-board">
    <div class="builder-left panel">
        <div class="panel deck-info-panel">
            <h3>Deck Details</h3>
            <label for="deckName">Deck Name</label>
            <input type="text" id="deckName" placeholder="My Tournament Deck">
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
            <label for="banlistFormat">Banlist</label>
            <select id="banlistFormat">
                <option value="ban_tcg" selected>Advanced (TCG)</option>
                <option value="ban_ocg">OCG</option>
                <option value="ban_goat">GOAT</option>
            </select>
            <div class="deck-warnings" id="deckWarnings">
                Main Deck: 0/40-60 &bull; Extra Deck: 0/0-15 &bull; Side Deck: 0/0-15
            </div>
            <div class="deck-save-status" id="deckSaveStatus"></div>
            <button id="saveDeck" type="button">Save Deck</button>
        </div>
        <div class="panel card-preview-panel" id="cardPreview">
            <img src="assets/images/card-placeholder.svg" alt="Card preview" id="cardPreviewImage">
            <div class="card-preview-info">
                <h4 id="cardPreviewName">Select a card</h4>
                <p id="cardPreviewType">&nbsp;</p>
                <div id="cardPreviewDesc" class="card-preview-desc">Hover or click a card to view details.</div>
            </div>
        </div>
        <div class="panel builder-buttons">
            <button class="btn secondary" type="button" onclick="window.location.href='my-decks.php'">My Decks</button>
            <button class="btn secondary" type="button">Import Deck</button>
            <button class="btn secondary" type="button">Export Deck</button>
        </div>
    </div>

    <div class="builder-center panel">
        <div class="deck-stage">
            <h3>Main Deck (<span id="mainCount">0</span>/40-60)</h3>
            <div class="master-grid" id="mainDeckSlots"></div>
        </div>
        <div class="deck-stage deck-stage-inline">
            <div>
                <h3>Extra Deck (<span id="extraCount">0</span>/0-15)</h3>
                <div class="side-grid" id="extraDeckSlots"></div>
            </div>
            <div>
                <h3>Side Deck (<span id="sideCount">0</span>/0-15)</h3>
                <div class="side-grid" id="sideDeckSlots"></div>
            </div>
        </div>
    </div>

    <div class="builder-right panel">
        <h3>Search Cards</h3>
        <form class="builder-search" id="builderFilters">
            <label>
                Name
                <input type="text" id="builderSearch" placeholder="Blue-Eyes">
            </label>
            <label>
                Attribute
                <select id="builderAttribute">
                    <option value="">Any</option>
                </select>
            </label>
            <label>
                Race / Type
                <select id="builderType">
                    <option value="">Any</option>
                </select>
            </label>
            <label>
                Level (max)
                <select id="builderLevel">
                    <option value="">Any</option>
                    <option value="4">4</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                </select>
            </label>
        </form>
        <div class="results-meta" id="builderCardMeta">Loading builder cards…</div>
        <div class="card-grid list" id="builderCardGrid">
            <p>Loading cards...</p>
        </div>
        <button class="btn secondary" id="builderMoreBtn" hidden>Load more cards</button>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

