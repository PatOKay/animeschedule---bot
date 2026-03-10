let currentYear = 2026;
let currentSeason = 'spring';
let searchTimeout;

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'spring';
    
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    // Global Search Listener
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        if (query.length > 2) {
            searchTimeout = setTimeout(() => performGlobalSearch(query), 500);
        } else if (query.length === 0) {
            loadSeasonalData(); // Reset to seasonal view if search is cleared
        }
    });

    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

async function performGlobalSearch(query) {
    const grid = document.getElementById('anime-grid');
    const title = document.getElementById('viewTitle');
    title.innerText = `Global Search: "${query}"`;
    grid.innerHTML = '<div class="loader">Searching Database...</div>';

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=20`);
        const { data } = await res.json();
        renderCards(data);
    } catch (e) {
        grid.innerHTML = "Search failed. Try again.";
    }
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    const title = document.getElementById('viewTitle');
    title.innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Loading Season...</div>';

    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await res.json();
        renderCards(data);
    } catch (e) {
        grid.innerHTML = "API Rate Limit hit. Please wait a moment.";
    }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    if (!data || data.length === 0) {
        grid.innerHTML = "No anime found.";
        return;
    }
    grid.innerHTML = data.map(anime => `
        <div class="anime-card">
            <div class="poster-container">
                <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                <div class="countdown-timer" data-day="${anime.broadcast?.day}" data-time="${anime.broadcast?.time}">
                    ${anime.status}
                </div>
            </div>
            <div class="info">
                <h3>${anime.title_english || anime.title}</h3>
                <p style="font-size:0.7rem; color:#9fadbd;">${anime.type || 'TV'} | ${anime.episodes || '?'} eps</p>
            </div>
        </div>
    `).join('');
}

function updateTimers() {
    // Current timer logic (kept simple to ensure no "Calculating..." freeze)
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        if (timer.innerText.includes('Airing')) timer.style.color = "#00ffcc";
    });
}

function changeYear(n) { currentYear += n; updateSeason(); }
function updateSeason() {
    currentSeason = document.getElementById('seasonPicker').value;
    document.getElementById('displayYear').innerText = currentYear;
    loadSeasonalData();
}

init();
