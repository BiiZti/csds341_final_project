<?php
$pageTitle = 'Deck Builder';
include __DIR__ . '/includes/head.php';
?>
<section class="deck-builder-board">
    <div class="builder-preview panel">
        <div class="card-preview-panel" id="cardPreview">
            <img src="assets/images/card-placeholder.svg" alt="Card preview" id="cardPreviewImage">
            <div class="card-preview-info">
                <h4 id="cardPreviewName">Select a card</h4>
                <p id="cardPreviewType">&nbsp;</p>
            </div>
        </div>
        <div class="card-preview-desc" id="cardPreviewDesc">
            Hover or click a card to view its full text.
        </div>
        <div class="deck-info-panel">
            <label>
                Deck Name
                <input type="text" id="deckName" placeholder="My Tournament Deck">
            </label>
            <label>
                Format
                <select id="deckFormat">
                    <option value="Advanced">Advanced</option>
                    <option value="Traditional">Traditional</option>
                    <option value="GOAT">GOAT</option>
                </select>
            </label>
            <label>
                Visibility
                <select id="deckVisibility">
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="public">Public</option>
                </select>
            </label>
            <label>
                Description
                <input type="text" id="deckDescription" placeholder="Optional notes">
            </label>
            <label>
                Banlist
                <select id="banlistFormat">
                    <option value="ban_tcg" selected>Advanced (TCG)</option>
                    <option value="ban_ocg">OCG</option>
                    <option value="ban_goat">GOAT</option>
                </select>
            </label>
        </div>
        <div class="deck-warnings" id="deckWarnings">
            Main Deck: 0/40-60 &bull; Extra Deck: 0/0-15 &bull; Side Deck: 0/0-15
        </div>
        <div class="deck-save-status" id="deckSaveStatus"></div>
        <div class="deck-actions-row">
            <button class="btn secondary" type="button" onclick="window.location.href='my-decks.php'">My Decks</button>
            <button id="saveDeck" type="button">Save Deck</button>
        </div>
    </div>

    <div class="builder-main panel">
        <div class="deck-stage">
            <div class="master-grid" id="mainDeckSlots"></div>
        </div>
        <div class="deck-stage" id="sideDeckContainer">
            <div class="side-grid" id="sideDeckSlots"></div>
        </div>
        <div class="deck-stage" id="extraDeckContainer">
            <div class="side-grid" id="extraDeckSlots"></div>
        </div>
    </div>

    <div class="builder-right panel builder-search-panel">
        <div class="search-header">SEARCH</div>
        <form class="builder-search" id="builderFilters">
            <div class="search-row">
                <label>Name:</label>
                <input type="text" id="builderSearch">
            </div>
            <div class="search-row">
                <label>Desc:</label>
                <input type="text" id="builderDesc">
            </div>
            <div class="search-row">
                <label>Card:</label>
                <select id="builderCardCategory">
                    <option value="">All</option>
                    <option value="monster">Monster</option>
                    <option value="spell">Spell</option>
                    <option value="trap">Trap</option>
                </select>
                <select disabled><option></option></select> <!-- Placeholder for second dropdown -->
            </div>
            <div class="search-row">
                <label>Type:</label>
                <select id="builderType">
                    <option value="">All</option>
                </select>
                <select disabled><option></option></select> <!-- Placeholder -->
            </div>
            <div class="search-row">
                <label>Attrib:</label>
                <div class="split-row">
                    <select id="builderAttribute">
                        <option value="">All</option>
                    </select>
                    <div class="mini-range">
                        <input type="number" id="builderLevelMin" placeholder="">
                        <span>&le; Lvl &le;</span>
                        <input type="number" id="builderLevelMax" placeholder="">
                    </div>
                </div>
            </div>
            <div class="search-row">
                <div class="mini-range full">
                    <input type="number" id="builderAtkMin" placeholder="">
                    <span>&le; ATK &le;</span>
                    <input type="number" id="builderAtkMax" placeholder="">
                </div>
            </div>
            <div class="search-row">
                <div class="mini-range full">
                    <input type="number" id="builderDefMin" placeholder="">
                    <span>&le; DEF &le;</span>
                    <input type="number" id="builderDefMax" placeholder="">
                </div>
            </div>
            <div class="search-row">
                <label>Limit:</label>
                <select id="builderLimit">
                    <option value="">Any</option>
                    <option value="forbidden">Forbidden</option>
                    <option value="limited">Limited</option>
                    <option value="semi">Semi-Limited</option>
                </select>
                <label style="width:auto; margin-left: 5px;">Order:</label>
                <select id="builderOrder">
                    <option value="alpha">Alpha</option>
                    <option value="atk">ATK</option>
                    <option value="def">DEF</option>
                    <option value="level">Level</option>
                </select>
            </div>
            <div class="search-row centered">
                <button class="btn-retro" id="builderSearchButton" type="submit">Search</button>
            </div>
        </form>

        <div class="search-pagination">
            <button id="builderPrev" type="button" class="arrow-btn left"></button>
            <span id="builderResultCount">0 / 0</span>
            <button id="builderNext" type="button" class="arrow-btn right"></button>
        </div>

        <div class="card-grid list compact-grid" id="builderCardGrid">
            <p>Loading...</p>
        </div>
        
        <div class="search-footer">
             <select id="builderFormatSelect" disabled>
                <option>Oct 2025 (TCG)</option>
             </select>
        </div>
    </div>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>
