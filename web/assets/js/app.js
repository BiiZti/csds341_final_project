(() => {
    const cardsEndpoint = 'api/cards.php';
    const cardsFallbackEndpoint = 'assets/data/cards.json';
    const CARD_DB_CHUNK = 84;
    const BUILDER_CHUNK = 120;
    const DEFAULT_BANLIST = 'ban_tcg';
    const BANLIST_LABELS = {
        ban_tcg: 'Advanced (TCG)',
        ban_ocg: 'OCG',
        ban_goat: 'GOAT'
    };

    const state = {
        cards: [],
        cardIndex: new Map(),
        deck: {
            main: [],
            side: []
        },
        deckSettings: {
            banlist: DEFAULT_BANLIST,
            visibility: 'private'
        },
        pagination: {
            cardDb: CARD_DB_CHUNK,
            builder: BUILDER_CHUNK
        }
    };

    const limits = {
        main: 20,
        side: 6
    };

    document.addEventListener('DOMContentLoaded', async () => {
        await loadCards();
        populateDynamicFilters();
        initCardDatabasePage();
        initDeckBuilderPage();
        initPublicDeckPage();
    });

    async function loadCards() {
        try {
            const response = await fetch(cardsEndpoint);
            const payload = await response.json();
            const data = payload.data ?? payload;
            state.cards = normalizeCards(data);
        } catch (error) {
            console.warn('API unavailable, falling back to local JSON.', error);
            const response = await fetch(cardsFallbackEndpoint);
            const data = await response.json();
            state.cards = normalizeCards(data);
        }
        state.cardIndex = new Map(state.cards.map(card => [card.id, card]));
    }

    function normalizeCards(data) {
        return data
            .map(card => ({
                ...card,
                desc: card.description ?? card.desc ?? '',
                image_url: card.image_path ?? card.image_url ?? null,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    function populateDynamicFilters() {
        fillSelect('attributeFilter', uniqueValues('attribute'));
        fillSelect('builderAttribute', uniqueValues('attribute'));
        fillSelect('typeFilter', uniqueValues('type'));
        fillSelect('builderType', uniqueValues('race'));
        fillSelect('raceFilter', uniqueValues('race'));
    }

    function uniqueValues(key) {
        const set = new Set();
        state.cards.forEach(card => {
            const value = card[key];
            if (value) set.add(value);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }

    function fillSelect(id, values) {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Any';
        select.appendChild(defaultOption);
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function initCardDatabasePage() {
        const resultsEl = document.getElementById('cardResults');
        if (!resultsEl) return;

        const metaEl = document.getElementById('cardResultsMeta');
        const moreBtn = document.getElementById('cardResultsMore');

        const render = (reset = false) => {
            if (reset) state.pagination.cardDb = CARD_DB_CHUNK;
            const filters = collectFilters({
                search: document.getElementById('searchQuery')?.value,
                attribute: document.getElementById('attributeFilter')?.value,
                cardType: document.getElementById('typeFilter')?.value,
                race: document.getElementById('raceFilter')?.value,
                level: document.getElementById('levelFilter')?.value
            });
            const filtered = filterCards(filters);
            const visible = filtered.slice(0, state.pagination.cardDb);
            renderCardGrid(resultsEl, visible, { mode: 'database' });
            updateResultsMeta(metaEl, visible.length, filtered.length);
            toggleMoreButton(moreBtn, visible.length, filtered.length, () => {
                state.pagination.cardDb += CARD_DB_CHUNK;
                render();
            });
        };

        document.getElementById('applyCardFilters')?.addEventListener('click', () => render(true));
        render(true);
    }

    function initDeckBuilderPage() {
        const builderGrid = document.getElementById('builderCardGrid');
        if (!builderGrid) return;

        const metaEl = document.getElementById('builderCardMeta');
        const moreBtn = document.getElementById('builderMoreBtn');
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
                renderDeckGrid(true);
            });
        }

        const renderDeckGrid = (reset = false) => {
            if (reset) state.pagination.builder = BUILDER_CHUNK;
            const filters = collectFilters({
                search: document.getElementById('builderSearch')?.value,
                attribute: document.getElementById('builderAttribute')?.value,
                race: document.getElementById('builderType')?.value,
                level: document.getElementById('builderLevel')?.value,
                compare: 'lte'
            });
            const filtered = filterCards(filters);
            const visible = filtered.slice(0, state.pagination.builder);
            renderCardGrid(builderGrid, visible, { mode: 'builder' });
            updateResultsMeta(metaEl, visible.length, filtered.length);
            toggleMoreButton(moreBtn, visible.length, filtered.length, () => {
                state.pagination.builder += BUILDER_CHUNK;
                renderDeckGrid();
            });
        };

        document.querySelectorAll('#builderFilters input, #builderFilters select')
            .forEach(el => el.addEventListener('input', () => renderDeckGrid(true)));

        builderGrid.addEventListener('click', event => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;
            const cardId = Number(button.dataset.cardId);
            const zone = button.dataset.action === 'add-side' ? 'side' : 'main';
            const card = state.cards.find(c => c.id === cardId);
            addCardToDeck(zone, card);
        });

        document.getElementById('mainDeckSlots')?.addEventListener('click', event => handleSlotClick(event, 'main'));
        document.getElementById('sideDeckSlots')?.addEventListener('click', event => handleSlotClick(event, 'side'));

        document.getElementById('saveDeck')?.addEventListener('click', () => {
            saveDeckToServer();
        });

        renderDeckSlots();
        renderDeckGrid(true);
    }

    async function saveDeckToServer() {
        const statusEl = document.getElementById('deckSaveStatus');
        if (!statusEl) return;

        const name = document.getElementById('deckName')?.value.trim() || '';
        const format = document.getElementById('deckFormat')?.value || 'Advanced';
        const visibility = document.getElementById('deckVisibility')?.value || 'private';
        const description = document.getElementById('deckDescription')?.value || '';

        if (!name) {
            statusEl.textContent = 'Deck name is required.';
            statusEl.className = 'deck-save-status error';
            return;
        }

        statusEl.textContent = 'Saving deck...';
        statusEl.className = 'deck-save-status';

        const payload = {
            name,
            format,
            visibility,
            description,
            main: state.deck.main.map(card => card?.id).filter(Boolean),
            side: state.deck.side.map(card => card?.id).filter(Boolean)
        };

        try {
            const response = await fetch('api/decks/save.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                statusEl.textContent = 'Deck saved successfully!';
                statusEl.className = 'deck-save-status success';
            } else {
                statusEl.textContent = data.error || 'Unable to save deck.';
                statusEl.className = 'deck-save-status error';
            }
        } catch (error) {
            statusEl.textContent = 'Network error while saving deck.';
            statusEl.className = 'deck-save-status error';
        }
    }

    function collectFilters(input) {
        const filters = { ...input };
        if (filters.search) filters.search = filters.search.trim().toLowerCase();
        ['attribute', 'cardType', 'race', 'archetype'].forEach(key => {
            if (filters[key]) filters[key] = filters[key].toLowerCase();
        });
        filters.level = filters.level ? Number(filters.level) : '';
        return filters;
    }

    function filterCards(filters) {
        return state.cards.filter(card => {
            const name = card.name?.toLowerCase() || '';
            const attribute = (card.attribute ?? '').toLowerCase();
            const type = (card.type ?? '').toLowerCase();
            const race = (card.race ?? '').toLowerCase();
            const archetype = (card.archetype ?? '').toLowerCase();
            const cardLevel = card.level ?? card.link ?? null;

            if (filters.search && !name.includes(filters.search)) return false;
            if (filters.attribute && attribute !== filters.attribute) return false;
            if (filters.cardType && type !== filters.cardType) return false;
            if (filters.race && race !== filters.race) return false;
            if (filters.archetype && archetype !== filters.archetype) return false;
            if (filters.level) {
                if (cardLevel === null) return false;
                const compare = filters.compare === 'lte'
                    ? cardLevel <= filters.level
                    : cardLevel >= filters.level;
                if (!compare) return false;
            }
            return true;
        });
    }

    function renderCardGrid(container, cards, { mode }) {
        if (!cards.length) {
            container.innerHTML = '<p>No cards match the filters.</p>';
            return;
        }

        container.innerHTML = cards.map(card => {
            const stats = [
                card.attribute,
                card.type,
                card.race && card.type?.includes('Monster') ? card.race : '',
                card.level ? `Level ${card.level}` : card.link ? `Link ${card.link}` : ''
            ].filter(Boolean).join(' • ');
            const banStatus = getBanStatus(card);
            const badge = mode === 'builder' && banStatus
                ? `<span class="card-badge ${banStatus.toLowerCase().replace(/\s+/g, '-')}" title="${currentBanlistLabel()} banlist">${banStatus}</span>`
                : '';

            return `
                <article class="card-tile">
                    ${cardImageMarkup(card)}
                    <header>${escapeHtml(card.name)}${badge}</header>
                    <div class="card-stats">${stats}</div>
                    <p>${truncate(card.desc || 'No description available.')}
                        ${card.archetype ? `<br><small>Archetype: ${escapeHtml(card.archetype)}</small>` : ''}
                    </p>
                    ${mode === 'builder' ? `
                        <div class="card-actions">
                            <button data-card-id="${card.id}" data-action="add-main">Add Main</button>
                            <button data-card-id="${card.id}" data-action="add-side">Add Side</button>
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');
    }

    function updateResultsMeta(element, showing, total) {
        if (!element) return;
        element.textContent = total
            ? `Showing ${showing} of ${total} cards`
            : 'No cards match the filters.';
    }

    function toggleMoreButton(button, showing, total, handler) {
        if (!button) return;
        const shouldShow = total > showing;
        button.hidden = !shouldShow;
        button.onclick = shouldShow ? handler : null;
    }

    function truncate(text, length = 160) {
        if (!text) return '';
        return text.length > length ? `${text.slice(0, length)}…` : text;
    }

    function addCardToDeck(zone, card) {
        if (!card) return;
        if (state.deck[zone].length >= limits[zone]) {
            alert(`Reached the ${zone} deck limit.`);
            return;
        }
        const limit = allowedCopies(card);
        if (limit === 0) {
            alert(`${card.name} is Forbidden on the ${currentBanlistLabel()} banlist.`);
            return;
        }
        const totalCopies = getTotalCopies(card.id);
        if (totalCopies >= limit) {
            const status = getBanStatus(card);
            const message = status
                ? `${card.name} is ${status} on the ${currentBanlistLabel()} banlist (max ${limit}).`
                : `${card.name} already appears ${limit} times. Each card can only be used up to ${limit} copies.`;
            alert(message);
            return;
        }
        state.deck[zone].push(card);
        renderDeckSlots();
    }

    function handleSlotClick(event, zone) {
        const slot = event.target.closest('.deck-slot');
        if (!slot || !slot.dataset.index) return;
        const index = Number(slot.dataset.index);
        if (Number.isNaN(index)) return;
        const removed = state.deck[zone].splice(index, 1);
        if (removed.length) renderDeckSlots();
    }

    function renderDeckSlots() {
        renderZone('mainDeckSlots', state.deck.main, limits.main, document.getElementById('mainCount'));
        renderZone('sideDeckSlots', state.deck.side, limits.side, document.getElementById('sideCount'));
        renderDeckWarnings();
    }

    function renderZone(containerId, cards, limit, counterEl) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = Array.from({ length: limit }, (_, index) => {
            const card = cards[index];
            return card
                ? `<div class="deck-slot filled" data-index="${index}">${card.name}</div>`
                : `<div class="deck-slot" data-index="${index}">Empty slot</div>`;
        }).join('');
        if (counterEl) counterEl.textContent = cards.length;
    }

    function renderDeckWarnings() {
        const warningsEl = document.getElementById('deckWarnings');
        if (!warningsEl) return;

        const counts = {};
        ['main', 'side'].forEach(zone => {
            state.deck[zone].forEach(card => {
                counts[card.id] = (counts[card.id] || 0) + 1;
            });
        });

        const issues = Object.entries(counts).reduce((acc, [cardId, copies]) => {
            const card = getCardById(Number(cardId));
            const limit = allowedCopies(card);
            if (copies > limit) {
                acc.push(`${card?.name ?? 'Unknown Card'} (${copies}) exceeds limit ${limit}`);
            }
            return acc;
        }, []);
        const summary = `Main Deck: ${state.deck.main.length}/20 • Side Deck: ${state.deck.side.length}/6 • Banlist: ${currentBanlistLabel()}`;

        if (!issues.length) {
            warningsEl.classList.remove('alert');
            warningsEl.innerHTML = `<strong>Banlist check passed.</strong> ${summary}`;
        } else {
            warningsEl.classList.add('alert');
            warningsEl.innerHTML = `<strong>Banlist issues detected.</strong>
                <ul>${issues.map(issue => `<li>${issue}</li>`).join('')}</ul>
                <div>${summary}</div>`;
        }
    }

    function allowedCopies(card) {
        if (!card) return 0;
        const status = getBanStatus(card);
        if (status === 'Forbidden') return 0;
        if (status === 'Limited') return 1;
        if (status === 'Semi-Limited') return 2;
        return 3;
    }

    function getBanStatus(card) {
        if (!card || !card.banlist_info) return null;
        const key = state.deckSettings.banlist;
        return card.banlist_info[key] || null;
    }

    function getCardById(cardId) {
        return state.cardIndex.get(cardId);
    }

    function getTotalCopies(cardId) {
        return state.deck.main.filter(card => card.id === cardId).length +
            state.deck.side.filter(card => card.id === cardId).length;
    }

    function currentBanlistLabel() {
        return BANLIST_LABELS[state.deckSettings.banlist] || 'Custom';
    }

    function cardImageMarkup(card) {
        if (!card || (!card.image_url_small && !card.image_url)) {
            return '<div class="card-image no-image">Artwork unavailable</div>';
        }
        const localPath = `assets/images/cards/${card.id}.jpg`;
        const remotePath = card.image_url_small || card.image_url || '';
        const safeName = escapeHtml(card.name || 'Card image');
        const safeRemote = escapeAttribute(remotePath);

        return `
            <div class="card-image">
                <img src="${localPath}"
                    alt="${safeName}"
                    loading="lazy"
                    data-remote="${safeRemote}"
                    onerror="this.onerror=null; const remote=this.dataset.remote; if (remote) { this.dataset.remote=''; this.src=remote; } else { const wrapper=this.closest('.card-image'); if (wrapper) { wrapper.classList.add('no-image'); wrapper.textContent='Artwork unavailable'; } this.remove(); }" />
            </div>
        `;
    }

    function escapeHtml(value) {
        return (value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        })[char]);
    }

    function escapeAttribute(value) {
        return (value ?? '').replace(/"/g, '&quot;');
    }

    function initPublicDeckPage() {
        const listEl = document.getElementById('publicDeckList');
        if (!listEl) return;

        fetch('api/decks/public.php')
            .then(response => response.json())
            .then(payload => {
                const decks = payload.data || [];
                if (!decks.length) {
                    listEl.innerHTML = '<p>No public decks have been published yet.</p>';
                    return;
                }
                listEl.innerHTML = decks.map(deck => `
                    <article class="deck-card">
                        <header>
                            <h3>${escapeHtml(deck.name)}</h3>
                            <div>${deck.format} Format</div>
                        </header>
                        <p>${escapeHtml(deck.description || 'This duelist has not provided a description.')}</p>
                        <ul>
                            <li>Main: ${deck.main_count ?? 0} cards</li>
                            <li>Side: ${deck.side_count ?? 0} cards</li>
                        </ul>
                        <footer>
                            <span>By ${escapeHtml(deck.username)}</span>
                            <span>${new Date(deck.updated_at).toLocaleDateString()}</span>
                        </footer>
                    </article>
                `).join('');
            })
            .catch(() => {
                listEl.innerHTML = '<p>Unable to load public decks. Please try again later.</p>';
            });
    }
})();

