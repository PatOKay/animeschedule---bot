let currentYear = 2026, currentSeason = 'spring', currentData = [], searchTimeout;
// Load Watchlist from Local Storage
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    
    // UI Event Listeners
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        if (e.target.value.length > 2) searchTimeout = setTimeout(() => performSearch(e.target.value), 500);
        else if (e.target.value.length === 0) loadSeasonalData();
    });

    document.getElementById('filterBtn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById("filterMenu").classList.toggle("show");
    };
    
    window.onclick = () => document.getElementById("filterMenu").classList.remove("show");
    document.querySelector('.close-modal').onclick = () => document.getElementById('animeModal').style.display = "none";
    document.getElementById('toggleWatchlist').onclick = toggleWatchlistView;
    
    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

// Watchlist Functions
function addToWatchlist(index) {
    const anime = currentData[index];
    if (watchlist.some(item => item.mal_id === anime.mal_id)) {
        alert("This anime is already in your watchlist!"); return;
    }
    watchlist.push(anime);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
    renderCards(currentData); // Re-render to update the heart icon color
}

function removeFromWatchlist(index) {
    const mal_id = currentData[index].mal_id;
    watchlist = watchlist.filter(item => item.mal_id !== mal_id);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
    // Re-render either search, season, or watchlist view
    if (document.getElementById('viewTitle').innerText === "MY WATCHLIST") toggleWatchlistView();
    else renderCards(currentData);
}

function toggleWatchlistView() {
    document.getElementById('viewTitle').innerText = "MY WATCHLIST";
    document.querySelector('.live-selector-container').style.display = 'none';
    currentData = watchlist; // View is now the watchlist
    renderCards(watchlist);
}

function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }

// Core Functions (Fixed Countdown and Trailer logic)
async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.querySelector('.live-selector-container').style.display = 'flex';
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Syncing Live EST Schedules...</div>';
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const json = await res.json();
        currentData = json.data;
        renderCards(currentData);
    } catch (e) { grid.innerHTML = "API connection error. Please refresh."; }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    if (!data || data.length === 0) { grid.innerHTML = "List is empty."; return; }
    
    grid.innerHTML = data.map((anime, i) => {
        const isAdded = watchlist.some(item => item.mal_id === anime.mal_id);
        const day = anime.broadcast.day || "null";
        const time = anime.broadcast.time || "00:00";
        return `
            <div class="anime-card">
                <img class="poster" src="${anime.images.jpg.large_image_url}" onclick="showDetails(${i})">
                <div class="countdown-timer" data-status="${anime.status}" data-premiere="${anime.aired.from}" data-day="${day}" data-time="${time}">
                    Calculating...
                </div>
                <div style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <h4 onclick="showDetails(${i})" style="margin:0; font-size:0.85rem; cursor:pointer; height:2.4em; overflow:hidden; flex:1;">${anime.title_english || anime.title}</h4>
                    <button class="add-watchlist ${isAdded ? 'active' : ''}" onclick="${isAdded ? `removeFromWatchlist(${i})` : `addToWatchlist(${i})`}">❤</button>
                </div>
            </div>`;
    }).join('');
    updateTimers();
}

// ... (Next step: We continue with showDetails and updateTimers logic in the next update)
