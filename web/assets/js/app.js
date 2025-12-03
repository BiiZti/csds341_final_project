(() => {
    const cardsEndpoint = 'api/cards.php';
    const BUILDER_CHUNK = 20;
    const DATABASE_CHUNK = 50;
    const DEFAULT_BANLIST = 'ban_tcg';
    const BANLIST_LABELS = {
        ban_tcg: 'Advanced (TCG)',
        ban_ocg: 'OCG',
        ban_goat: 'GOAT'
    };

    const state = {
        cards: [], // Current search results (view)
        cardCache: new Map(), // All loaded cards (id -> card) for quick lookup
        deck: {
            main: [],
            side: [],
            extra: []
        },
        deckSettings: {
            banlist: DEFAULT_BANLIST,
            visibility: 'private'
        },
        currentDeckId: null,
        pagination: {
            builderPage: 1,
            databasePage: 1,
            totalPages: 1,
            totalCount: 0
        }
    };
    const previewEl = {
        image: document.getElementById('cardPreviewImage'),
        name: document.getElementById('cardPreviewName'),
        type: document.getElementById('cardPreviewType'),
        desc: document.getElementById('cardPreviewDesc')
    };

    const limits = {
        main: 60,
        side: 15,
        extra: 15
    };

    document.addEventListener('DOMContentLoaded', async () => {
        populateDynamicFilters();
        initCardDatabasePage();
        initDeckBuilderPage();
        initPublicDeckPage();
        initMyDecksPage();
    });

    // --- API Interaction ---

    async function fetchCards(filters = {}, context = 'builder') {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== undefined && value !== null) {
                params.append(key, value);
            }
        });
        
        const limit = context === 'database' ? DATABASE_CHUNK : BUILDER_CHUNK;
        params.set('limit', limit);
        
        // Handle pagination
        const page = filters.page || 1;
        params.set('page', page);

        try {
            const response = await fetch(`${cardsEndpoint}?${params.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const payload = await response.json();
            const data = payload.data || [];
            
            // Normalize and cache
            const normalized = normalizeCards(data);
            normalized.forEach(card => state.cardCache.set(card.id, card));
            
            // Update pagination state
            state.pagination.totalPages = payload.meta.pages;
            state.pagination.totalCount = payload.meta.total;
            
            return normalized;
        } catch (error) {
            console.error('Fetch cards failed:', error);
            return [];
        }
    }

    function normalizeCards(data) {
        return data.map(card => ({
            ...card,
            desc: card.description ?? card.desc ?? '',
            image_url: card.image_path ?? card.image_url ?? null,
        }));
    }

    function populateDynamicFilters() {
        const races = ['Aqua','Beast','Beast-Warrior','Cyberse','Dinosaur','Divine-Beast','Dragon','Fairy','Fiend','Fish','Insect','Machine','Plant','Psychic','Pyro','Reptile','Rock','Sea Serpent','Spellcaster','Thunder','Warrior','Winged Beast','Wyrm','Zombie'];
        fillSelect('builderType', races);
        fillSelect('typeFilter', ['Normal Monster', 'Effect Monster', 'Spell Card', 'Trap Card', 'Fusion Monster', 'Ritual Monster', 'Synchro Monster', 'XYZ Monster', 'Link Monster']);
        fillSelect('raceFilter', races);
        
        const attributes = ['DARK','DIVINE','EARTH','FIRE','LIGHT','WATER','WIND'];
        fillSelect('builderAttribute', attributes);
        fillSelect('attributeFilter', attributes);
    }

    function fillSelect(id, values) {
        const select = document.getElementById(id);
        if (!select) return;
        const existing = select.value;
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = 'Any';
        defaultOption.textContent = 'Any';
        select.appendChild(defaultOption);
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
        if (existing) select.value = existing;
    }

    // --- Card Database Page ---

    function initCardDatabasePage() {
        const resultsEl = document.getElementById('cardResults');
        if (!resultsEl) return;

        const metaEl = document.getElementById('cardResultsMeta');
        const moreBtn = document.getElementById('cardResultsMore');
        let currentResults = [];

        const loadResults = async (append = false) => {
            if (!append) {
                state.pagination.databasePage = 1;
                currentResults = [];
                resultsEl.innerHTML = '<p>Loading cards...</p>';
            } else {
                state.pagination.databasePage++;
            }

            const filters = {
                search: document.getElementById('searchQuery')?.value,
                attribute: document.getElementById('attributeFilter')?.value,
                type: document.getElementById('typeFilter')?.value, // mapped to 'type' column
                race: document.getElementById('raceFilter')?.value,
                level_min: document.getElementById('levelFilter')?.value,
                page: state.pagination.databasePage
            };

            // Cleanup "Any" values
            if (filters.attribute === 'Any') delete filters.attribute;
            if (filters.type === 'Any') delete filters.type;
            if (filters.race === 'Any') delete filters.race;
            if (filters.level_min === 'Any') delete filters.level_min;

            const newCards = await fetchCards(filters, 'database');
            
            if (append) {
                currentResults = [...currentResults, ...newCards];
            } else {
                currentResults = newCards;
            }

            renderDatabaseGrid(resultsEl, currentResults);
            updateDatabaseMeta(metaEl, currentResults.length, state.pagination.totalCount);
            
            if (moreBtn) {
                moreBtn.hidden = state.pagination.databasePage >= state.pagination.totalPages;
                moreBtn.onclick = () => loadResults(true);
            }
        };

        document.getElementById('applyCardFilters')?.addEventListener('click', () => loadResults(false));
        document.getElementById('cardFilters')?.addEventListener('submit', (e) => {
            e.preventDefault();
            loadResults(false);
        });

        // Initial load
        loadResults(false);
    }

    function renderDatabaseGrid(container, cards) {
        if (!cards.length) {
            container.innerHTML = '<p>No cards match the filters.</p>';
            return;
        }
        container.innerHTML = cards.map(card => `
            <article class="card-tile" data-card-id="${card.id}">
                ${cardImageMarkup(card)}
                <header>${escapeHtml(card.name)}</header>
                <div class="card-stats">
                    ${[card.attribute, card.type, card.level ? `Lv${card.level}` : ''].filter(Boolean).join(' / ')}
                </div>
                <p>${truncate(card.desc, 100)}</p>
            </article>
        `).join('');
    }

    function updateDatabaseMeta(el, shown, total) {
        if(el) el.textContent = `Showing ${shown} of ${total} cards`;
    }

    // --- Deck Builder Page ---

    function initDeckBuilderPage() {
        const builderGrid = document.getElementById('builderCardGrid');
        if (!builderGrid) return;

        const banlistSelect = document.getElementById('banlistFormat');
        if (banlistSelect) {
            if (!banlistSelect.value) {
                banlistSelect.value = state.deckSettings.banlist;
            } else {
                state.deckSettings.banlist = banlistSelect.value;
            }
            banlistSelect.addEventListener('change', () => {
                state.deckSettings.banlist = banlistSelect.value;
                renderDeckWarnings();
            });
        }

        const triggerSearch = async (resetPage = false) => {
            if (resetPage) state.pagination.builderPage = 1;
            
            const filters = {
                search: document.getElementById('builderSearch')?.value,
                description: document.getElementById('builderDesc')?.value,
                category: document.getElementById('builderCardCategory')?.value,
                attribute: document.getElementById('builderAttribute')?.value,
                race: document.getElementById('builderType')?.value,
                level_min: document.getElementById('builderLevelMin')?.value,
                level_max: document.getElementById('builderLevelMax')?.value,
                atk_min: document.getElementById('builderAtkMin')?.value,
                atk_max: document.getElementById('builderAtkMax')?.value,
                def_min: document.getElementById('builderDefMin')?.value,
                def_max: document.getElementById('builderDefMax')?.value,
                limit_status: document.getElementById('builderLimit')?.value,
                sort: document.getElementById('builderOrder')?.value,
                page: state.pagination.builderPage
            };
            
            // Clean up filters
            if (filters.category === '') delete filters.category; 
            if (filters.attribute === 'Any') delete filters.attribute;
            if (filters.race === 'Any') delete filters.race;
            if (filters.limit_status === 'Any') delete filters.limit_status;

            builderGrid.innerHTML = '<p>Loading...</p>';
            state.cards = await fetchCards(filters, 'builder');
            renderBuilderGrid(builderGrid, state.cards);
            updateBuilderPaginationUI();
        };

        document.getElementById('builderFilters')?.addEventListener('submit', event => {
            event.preventDefault();
            triggerSearch(true);
        });
        document.getElementById('builderSearchButton')?.addEventListener('click', (e) => {
            e.preventDefault();
            triggerSearch(true);
        });

        document.getElementById('builderPrev')?.addEventListener('click', () => {
            if (state.pagination.builderPage > 1) {
                state.pagination.builderPage--;
                triggerSearch();
            }
        });
        document.getElementById('builderNext')?.addEventListener('click', () => {
            if (state.pagination.builderPage < state.pagination.totalPages) {
                state.pagination.builderPage++;
                triggerSearch();
            }
        });

        // Initial Load
        triggerSearch(true);

        // Events (Drag, DblClick)
        setupBuilderInteractions(builderGrid);

        document.getElementById('mainDeckSlots')?.addEventListener('click', event => handleSlotClick(event, 'main'));
        document.getElementById('extraDeckSlots')?.addEventListener('click', event => handleSlotClick(event, 'extra'));
        document.getElementById('sideDeckSlots')?.addEventListener('click', event => handleSlotClick(event, 'side'));

        document.getElementById('saveDeck')?.addEventListener('click', () => {
            saveDeckToServer();
        });

        renderDeckSlots();
        const deckIdParam = getQueryParam('deck_id');
        if (deckIdParam) {
            loadDeckForEditing(Number(deckIdParam));
        }
    }

    function updateBuilderPaginationUI() {
        const countEl = document.getElementById('builderResultCount');
        const prevBtn = document.getElementById('builderPrev');
        const nextBtn = document.getElementById('builderNext');
        
        if (countEl) {
            const start = (state.pagination.builderPage - 1) * BUILDER_CHUNK + 1;
            const end = Math.min(state.pagination.builderPage * BUILDER_CHUNK, state.pagination.totalCount);
            countEl.textContent = state.pagination.totalCount > 0 
                ? `${start}-${end} / ${state.pagination.totalCount}`
                : '0 / 0';
        }
        if (prevBtn) prevBtn.disabled = state.pagination.builderPage <= 1;
        if (nextBtn) nextBtn.disabled = state.pagination.builderPage >= state.pagination.totalPages;
    }

    function renderBuilderGrid(container, cards) {
        if (!cards.length) {
            container.innerHTML = '<p>No results.</p>';
            return;
        }
        container.innerHTML = cards.map(card => `
            <div class="card-tile" data-card-id="${card.id}" draggable="true">
                ${cardImageMarkup(card)}
            </div>
        `).join('');
    }

    function setupBuilderInteractions(grid) {
        grid.addEventListener('dragstart', event => {
            const cardEl = event.target.closest('.card-tile');
            if (!cardEl) return;
            const cardId = Number(cardEl.dataset.cardId);
            const card = state.cardCache.get(cardId);
            if (card) {
                event.dataTransfer.setData('text/plain', JSON.stringify(card));
                event.dataTransfer.effectAllowed = 'copy';
            }
        });

        grid.addEventListener('dblclick', event => {
            const tile = event.target.closest('.card-tile');
            if (!tile) return;
            const cardId = Number(tile.dataset.cardId);
            const card = state.cardCache.get(cardId);
            if (!card) return;

            let targetZone = 'main';
            if (isExtraDeckCard(card)) targetZone = 'extra';
            addCardToDeck(targetZone, card);
        });

        grid.addEventListener('mouseover', event => {
            const tile = event.target.closest('.card-tile');
            if (!tile) return;
            const cardId = Number(tile.dataset.cardId);
            const card = state.cardCache.get(cardId);
            if (card) setPreview(card);
        });
        
        grid.addEventListener('click', event => {
            const tile = event.target.closest('.card-tile');
            if (!tile) return;
            const cardId = Number(tile.dataset.cardId);
            const card = state.cardCache.get(cardId);
            if (card) setPreview(card);
        });

        // Drop targets
        ['mainDeckSlots', 'extraDeckSlots', 'sideDeckSlots'].forEach(id => {
            const container = document.getElementById(id);
            const parent = container?.parentElement; 
            if (!parent) return;

            let zone = 'main';
            if (id.includes('extra')) zone = 'extra';
            if (id.includes('side')) zone = 'side';

            parent.addEventListener('dragover', event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
                parent.classList.add('drag-over');
            });

            parent.addEventListener('dragleave', () => {
                parent.classList.remove('drag-over');
            });

            parent.addEventListener('drop', event => {
                event.preventDefault();
                parent.classList.remove('drag-over');
                try {
                    const data = event.dataTransfer.getData('text/plain');
                    const card = JSON.parse(data);
                    if (card && card.id) {
                        let targetZone = zone;
                        if (isExtraDeckCard(card) && zone === 'main') targetZone = 'extra';
                        else if (!isExtraDeckCard(card) && zone === 'extra') targetZone = 'main';
                        addCardToDeck(targetZone, card);
                    }
                } catch (e) {
                    console.error('Drop error', e);
                }
            });
        });
    }

    // --- Deck Management ---

    function addCardToDeck(zone, card) {
        if (!card) return;
        if (!state.deck[zone]) state.deck[zone] = [];
        if (zone === 'main' && state.deck.main.length >= limits.main) return alert('Main deck max 60.');
        if (zone === 'extra' && state.deck.extra.length >= limits.extra) return alert('Extra deck max 15.');
        if (zone === 'side' && state.deck.side.length >= limits.side) return alert('Side deck max 15.');

        const limit = allowedCopies(card);
        if (limit === 0) return alert(`${card.name} is Forbidden.`);
        if (getTotalCopies(card.id) >= limit) return alert(`Max ${limit} copies allowed.`);

        state.deck[zone].push(card);
        renderDeckSlots();
    }

    function handleSlotClick(event, zone) {
        const slot = event.target.closest('.deck-slot');
        if (!slot || !slot.dataset.index) return;
        const index = Number(slot.dataset.index);
        if (state.deck[zone][index]) {
            state.deck[zone].splice(index, 1);
            renderDeckSlots();
        }
    }

    function renderDeckSlots() {
        renderZone('mainDeckSlots', state.deck.main, limits.main, document.getElementById('mainCount'));
        renderZone('extraDeckSlots', state.deck.extra, limits.extra, document.getElementById('extraCount'));
        renderZone('sideDeckSlots', state.deck.side, limits.side, document.getElementById('sideCount'));
        renderDeckWarnings();
        updateRailCounts();
    }

    function renderZone(containerId, cards, limit, counterEl) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = Array.from({ length: limit }, (_, index) => {
            const card = cards[index];
            if (card) {
                const { localPath, remotePath } = getCardImageSources(card);
                return `<div class="deck-slot filled" data-index="${index}">
                    <img src="${localPath}" onerror="this.src='${remotePath}'" alt="${escapeHtml(card.name)}">
                </div>`;
            }
            return `<div class="deck-slot" data-index="${index}"></div>`;
        }).join('');
        if (counterEl) counterEl.textContent = cards.length;
    }

    async function loadDeckForEditing(deckId) {
        const statusEl = document.getElementById('deckSaveStatus');
        try {
            const response = await fetch(`api/decks/details.php?deck_id=${deckId}`);
            if (!response.ok) throw new Error();
            const data = await response.json();
            const deck = data.deck;
            const cards = data.cards || []; 

            state.currentDeckId = deckId;
            document.getElementById('deckName').value = deck.name;
            document.getElementById('deckFormat').value = deck.format;
            document.getElementById('deckVisibility').value = deck.visibility;
            document.getElementById('deckDescription').value = deck.description || '';

            state.deck = { main: [], side: [], extra: [] };
            
            const normalizedCards = normalizeCards(cards);
            normalizedCards.forEach(card => {
                state.cardCache.set(Number(card.card_id || card.id), card);
            });

            normalizedCards.forEach(entry => {
                const cardId = Number(entry.card_id || entry.id);
                const card = state.cardCache.get(cardId);
                if (!card) return;
                
                const slot = entry.slot || 'main';
                const copies = Number(entry.copies) || 1;
                if (!state.deck[slot]) state.deck[slot] = [];
                for (let i = 0; i < copies; i++) {
                    state.deck[slot].push(card);
                }
            });

            renderDeckSlots();
            if (statusEl) statusEl.textContent = 'Editing saved deck.';
        } catch (error) {
            console.error(error);
            if (statusEl) statusEl.textContent = 'Unable to load deck.';
        }
    }

    // --- Utils ---

    function cardImageMarkup(card) {
        const { localPath, remotePath } = getCardImageSources(card);
        return `<div class="card-image"><img src="${localPath}" loading="lazy" alt="${escapeHtml(card.name)}" onerror="this.src='${remotePath}'"></div>`;
    }

    function getCardImageSources(card) {
        const localPath = `assets/images/cards/${card.id}.jpg`;
        const remotePath = card.image_url || card.image_url_small || 'assets/images/card-placeholder.svg';
        return { localPath, remotePath };
    }

    function getCardImageUrl(card) {
        return card.image_url || `assets/images/cards/${card.id}.jpg`;
    }

    function setPreview(card) {
        previewEl.name.textContent = card.name;
        previewEl.type.textContent = [card.type, card.attribute, card.level ? `Level ${card.level}` : ''].filter(Boolean).join(' • ');
        previewEl.desc.textContent = card.desc;
        previewEl.image.src = getCardImageUrl(card);
    }

    function getCardById(id) { return state.cardCache.get(id); }
    
    function getBanStatus(card) {
        const format = state.deckSettings.banlist; 
        if (format === 'ban_tcg') return card.limit_tcg;
        if (format === 'ban_ocg') return card.limit_ocg;
        if (format === 'ban_goat') return card.limit_goat;
        return null;
    }

    function allowedCopies(card) {
        const status = getBanStatus(card);
        if (status === 'Forbidden') return 0;
        if (status === 'Limited') return 1;
        if (status === 'Semi-Limited') return 2;
        return 3;
    }

    function currentBanlistLabel() {
        return BANLIST_LABELS[state.deckSettings.banlist] || 'Custom';
    }

    function isExtraDeckCard(card) {
        if (!card.type) return false;
        return card.type.includes('Fusion') || card.type.includes('Synchro') || 
               card.type.includes('XYZ') || card.type.includes('Link');
    }

    function getTotalCopies(cardId) {
        return [...state.deck.main, ...state.deck.side, ...state.deck.extra].filter(c => c.id === cardId).length;
    }

    function updateRailCounts() {
        const counts = { monster: 0, spell: 0, trap: 0 };
        state.deck.main.forEach(c => {
            if (c.type.includes('Monster')) counts.monster++;
            else if (c.type.includes('Spell')) counts.spell++;
            else if (c.type.includes('Trap')) counts.trap++;
        });
        const railTotal = document.getElementById('railTotal');
        if (railTotal) {
            railTotal.textContent = state.deck.main.length;
            document.getElementById('railMonsters').textContent = counts.monster;
            document.getElementById('railSpells').textContent = counts.spell;
            document.getElementById('railTraps').textContent = counts.trap;
        }
    }

    function renderDeckWarnings() {
        const warningsEl = document.getElementById('deckWarnings');
        if(!warningsEl) return;
        let msg = `Main: ${state.deck.main.length} | Extra: ${state.deck.extra.length} | Side: ${state.deck.side.length}`;
        warningsEl.textContent = msg;
    }

    function getCardCategory(card) {
        if (card.type.includes('Monster')) return 'monster';
        if (card.type.includes('Spell')) return 'spell';
        if (card.type.includes('Trap')) return 'trap';
        return '';
    }

    function escapeHtml(str) { return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]); }
    function escapeAttribute(str) { return (str || '').replace(/"/g, '&quot;'); }
    function getQueryParam(k) { return new URLSearchParams(window.location.search).get(k); }
    function truncate(text, length = 160) {
        if (!text) return '';
        return text.length > length ? `${text.slice(0, length)}…` : text;
    }

    async function initPublicDeckPage() {
        const listEl = document.getElementById('publicDeckList');
        if (!listEl) return;

        try {
            const res = await fetch('api/decks/public.php', {
                credentials: 'same-origin'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            const decks = json.data || [];
            renderDeckList(listEl, decks, false);
        } catch (err) {
            console.error(err);
            listEl.innerHTML = '<p>Error loading decks.</p>';
        }
    }
    
    async function initMyDecksPage() {
        const listEl = document.getElementById('myDeckList');
        if (!listEl) return;
        
        try {
            const res = await fetch('api/decks/my.php', {
                credentials: 'same-origin'
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.error) {
                listEl.innerHTML = `<p>${json.error} <a href="login.php">Log in</a></p>`;
                return;
            }
            const decks = json.data || [];
            renderDeckList(listEl, decks, true);
        } catch (err) {
            console.error(err);
            listEl.innerHTML = '<p>Error loading decks.</p>';
        }

        listEl.addEventListener('click', async (e) => {
            if (e.target.matches('.btn.danger')) {
                const deckId = e.target.dataset.deleteId;
                if (deckId && confirm('Delete this deck?')) {
                    try {
                        const res = await fetch('api/decks/delete.php', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            credentials: 'same-origin',
                            body: JSON.stringify({deck_id: deckId})
                        });
                        if (res.ok) {
                            window.location.reload();
                        } else {
                            alert('Failed to delete deck.');
                        }
                    } catch (error) {
                        console.error(error);
                        alert('Network error.');
                    }
                }
            }
        });
    }

    function renderDeckList(container, decks, isOwner) {
        if (!decks.length) {
            container.innerHTML = '<p>No decks found.</p>';
            return;
        }
        
        container.innerHTML = decks.map(deck => `
            <article class="deck-card">
                <header>
                    <h3>${escapeHtml(deck.name)}</h3>
                    <div style="font-size:0.85em; color:var(--text-muted);">
                        <span class="format">${escapeHtml(deck.format)}</span>
                        ${isOwner ? ` &bull; <span style="text-transform:capitalize">${deck.visibility}</span>` : ` &bull; by ${escapeHtml(deck.username)}`}
                    </div>
                </header>
                <div class="deck-stats" style="margin:0.5rem 0;">
                    Main: <strong>${deck.main_count || 0}</strong> | 
                    Extra: <strong>${deck.extra_count || 0}</strong> | 
                    Side: <strong>${deck.side_count || 0}</strong>
                </div>
                <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:1rem;">${truncate(deck.description, 100) || 'No description.'}</p>
                <footer style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.8rem; color:var(--text-muted);">${new Date(deck.updated_at).toLocaleDateString()}</span>
                    <div class="deck-actions" style="display:flex; gap:0.5rem;">
                        <a href="deck-builder.php?deck_id=${deck.deck_id}" class="btn secondary" style="padding:0.25rem 0.75rem; font-size:0.85rem;">${isOwner ? 'Edit' : 'View'}</a>
                        ${isOwner ? `<button class="btn danger" data-delete-id="${deck.deck_id}" style="padding:0.25rem 0.75rem; font-size:0.85rem;">Delete</button>` : ''}
                    </div>
                </footer>
            </article>
        `).join('');
    }

    async function saveDeckToServer() {
        const statusEl = document.getElementById('deckSaveStatus');
        if (!statusEl) return;
        statusEl.textContent = 'Saving...';
        
        const payload = {
            name: document.getElementById('deckName').value || 'Untitled',
            format: document.getElementById('deckFormat').value,
            visibility: document.getElementById('deckVisibility').value,
            description: document.getElementById('deckDescription').value,
            deck_id: state.currentDeckId,
            main: state.deck.main.map(c => c.id),
            side: state.deck.side.map(c => c.id),
            extra: state.deck.extra.map(c => c.id)
        };

        try {
            const res = await fetch('api/decks/save.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                state.currentDeckId = json.deck_id;
                statusEl.textContent = 'Saved!';
            } else {
                statusEl.textContent = 'Error: ' + (json.error || 'Unknown');
            }
        } catch(e) {
            statusEl.textContent = 'Network error.';
        }
    }

})();
