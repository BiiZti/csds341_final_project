<?php
$pageTitle = 'Card Database';
include __DIR__ . '/includes/head.php';
?>
<section class="panel">
    <h2>Card Search</h2>
    <p>Use the filters below to explore the sample dataset. Once hooked to MariaDB, these controls will translate directly into SQL queries (with matching relational algebra expressions for the report).</p>
    <form class="filters" id="cardFilters">
        <div>
            <label for="searchQuery">Name contains</label>
            <input type="text" id="searchQuery" name="searchQuery" placeholder="Dark Magician">
        </div>
        <div>
            <label for="attributeFilter">Attribute</label>
            <select id="attributeFilter" name="attribute">
                <option value="">Any</option>
            </select>
        </div>
        <div>
            <label for="typeFilter">Type</label>
            <select id="typeFilter" name="type">
                <option value="">Any</option>
            </select>
        </div>
        <div>
            <label for="raceFilter">Race / Monster Type</label>
            <select id="raceFilter" name="race">
                <option value="">Any</option>
            </select>
        </div>
        <div>
            <label for="levelFilter">Level (min)</label>
            <select id="levelFilter" name="level">
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="4">4+</option>
                <option value="7">7+</option>
                <option value="8">8+</option>
            </select>
        </div>
        <button type="button" id="applyCardFilters" class="btn primary">Apply Filters</button>
    </form>
    <div class="results-meta" id="cardResultsMeta">Loading card statistics…</div>
    <div class="card-grid" id="cardResults">
        <p>Loading cards...</p>
    </div>
    <button class="btn secondary" id="cardResultsMore" hidden>Load more results</button>
</section>
<?php include __DIR__ . '/includes/footer.php'; ?>

