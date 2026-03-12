let currentYear = 2026, currentSeason = 'spring', currentData = [], searchTimeout;
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    
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

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.querySelector('.live-selector-container').style.display = 'flex';
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Fetching Cards...</div>';
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const json = await res.json();
        currentData = json.data;
        renderCards(currentData);
    } catch (e) { grid.innerHTML = "Connection Error. Please refresh."; }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    if (!data || data.length === 0) { grid.innerHTML = "No results found."; return; }
    
    grid.innerHTML = data.map((anime, i) => {
        const isAdded = watchlist.some(item => item.mal_id === anime.mal_id);
        return `
            <div class="anime-card">
                <img class="poster" src="${anime.images.jpg.large_image_url}" onclick="showDetails(${i})">
                <div class="countdown-timer" data-status="${anime.status}" data-premiere="${anime.aired.from}" data-day="${anime.broadcast.day}" data-time="${anime.broadcast.time}">
                    Syncing...
                </div>
                <div style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <h4 onclick="showDetails(${i})" style="margin:0; font-size:0.85rem; cursor:pointer; height:2.4em; overflow:hidden; flex:1;">${anime.title_english || anime.title}</h4>
                    <button class="add-watchlist ${isAdded ? 'active' : ''}" onclick="${isAdded ? `removeFromWatchlist(${i})` : `addToWatchlist(${i})`}">❤</button>
                </div>
            </div>`;
    }).join('');
    updateTimers();
}

async function showDetails(i) {
    const anime = currentData[i];
    const body = document.getElementById('modalBody');
    document.getElementById('animeModal').style.display = "block";
    
    const ytId = anime.trailer?.youtube_id;
    const trailerHtml = ytId ? 
        `<div style="margin-top:15px; position:relative; padding-bottom:56.25%; height:0; border-radius:10px; overflow:hidden;">
            <iframe src="https://www.youtube.com/embed/${ytId}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe>
        </div>` :
        `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title)}+official+trailer" target="_blank" style="display:block; margin-top:15px; background:#ff0000; color:white; text-align:center; padding:12px; border-radius:8px; text-decoration:none; font-weight:bold;">📺 Search Trailer on YouTube</a>`;

    body.innerHTML = `
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <img src="${anime.images.jpg.image_url}" style="width:200px; border-radius:10px;">
            <div style="flex:1; min-width:300px;">
                <h2 style="margin:0; color:#3db4f2;">${anime.title_english || anime.title}</h2>
                <p>⭐ ${anime.score || 'N/A'} | ${anime.status}</p>
                <div style="background:#252729; padding:15px; border-radius:8px; font-size:0.9rem; max-height:150px; overflow-y:auto;">
                    ${anime.synopsis || 'No description available.'}
                </div>
                ${trailerHtml}
            </div>
        </div>`;
}

function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.countdown-timer').forEach(el => {
        if (el.dataset.status === "Finished Airing") {
            el.innerText = "COMPLETED";
            el.style.color = "#888";
            return;
        }
        const premiere = new Date(el.dataset.premiere);
        const target = (premiere > now) ? premiere : getNextAirEST(el.dataset.day, el.dataset.time);
        const diff = target - now;

        if (diff < 0) { el.innerText = "AIRING NOW"; el.style.color = "#ff4d4d"; }
        else {
            const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
            el.innerText = `${d}d ${h}h ${m}m`;
            el.style.color = "#00ffcc";
        }
    });
}

function getNextAirEST(day, time) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(day);
    if (targetDay === -1) return new Date(Date.now() + 604800000); 
    const now = new Date();
    let res = new Date(now);
    res.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
    return res;
}

function sortData(type) {
    if (type === 'pop') currentData.sort((a,b) => (b.members || 0) - (a.members || 0));
    if (type === 'score') currentData.sort((a,b) => (b.score || 0) - (a.score || 0));
    if (type === 'alpha') currentData.sort((a,b) => (a.title_english || a.title).localeCompare(b.title_english || b.title));
    renderCards(currentData);
}

function addToWatchlist(i) {
    if (!watchlist.some(item => item.mal_id === currentData[i].mal_id)) {
        watchlist.push(currentData[i]);
        localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
        updateWatchlistCount(); renderCards(currentData);
    }
}

function removeFromWatchlist(i) {
    watchlist = watchlist.filter(item => item.mal_id !== currentData[i].mal_id);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount(); renderCards(currentData);
}

function toggleWatchlistView() {
    document.getElementById('viewTitle').innerText = "MY WATCHLIST";
    document.querySelector('.live-selector-container').style.display = 'none';
    renderCards(watchlist);
}

function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }
function updateSeason() { currentSeason = document.getElementById('seasonPicker').value; loadSeasonalData(); }
function changeYear(n) { currentYear += n; document.getElementById('displayYear').innerText = currentYear; loadSeasonalData(); }

init();
