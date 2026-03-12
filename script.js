// 1. INITIALIZE (Fixed the 'already declared' error)
// We check if it exists first to prevent the crash you saw in the console
if (typeof supabase === 'undefined') {
    const SUPABASE_URL = 'https://aqromksnrykuakcmvhjg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_GgfGatSj5nAsT_LijOZgRQ_vrIozPii';
    var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
    var supabaseClient = supabase; 
}

// 2. GLOBAL STATE
let currentYear = 2026;
let currentSeason = 'spring';
let currentData = [];
let searchTimeout;
let watchlist = [];

// 3. STARTUP
async function init() {
    setupEventListeners();
    
    // Load anime cards IMMEDIATELY so you don't stay stuck on "Connecting..."
    loadSeasonalData();

    // Sync database in background
    try {
        const { data, error } = await supabaseClient.from('Anime Sched').select('*');
        if (!error && data) {
            watchlist = data.map(item => item.anime_data);
            updateWatchlistCount();
            if (currentData.length > 0) renderCards(currentData);
        }
    } catch (err) {
        console.warn("Database sync delayed.");
    }

    setInterval(updateTimers, 1000);
}

// 4. DATABASE ACTIONS
async function addToWatchlist(i) {
    const anime = currentData[i];
    if (watchlist.some(item => item.mal_id === anime.mal_id)) return;

    watchlist.push(anime);
    updateWatchlistCount();
    renderCards(currentData);

    const { error } = await supabaseClient.from('Anime Sched').insert([{ anime_data: anime }]);
    if (error) console.error("Save failed. Check Supabase Policies:", error.message);
}

async function removeFromWatchlist(i) {
    const animeId = currentData[i].mal_id;
    watchlist = watchlist.filter(item => item.mal_id !== animeId);
    updateWatchlistCount();
    
    renderCards(document.getElementById('viewTitle').innerText === "MY WATCHLIST" ? watchlist : currentData);

    await supabaseClient.from('Anime Sched').delete().filter('anime_data->mal_id', 'eq', animeId);
}

// 5. CORE ENGINE
async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Loading Schedule...</div>';
    
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const json = await res.json();
        currentData = json.data;
        renderCards(currentData);
    } catch (e) {
        grid.innerHTML = "Error fetching anime data.";
    }
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

async function showDetails(i) {
    const anime = currentData[i];
    const body = document.getElementById('modalBody');
    document.getElementById('animeModal').style.display = "block";
    const ytId = anime.trailer?.youtube_id;
    
    const trailerHtml = ytId ? 
        `<iframe width="100%" height="300" src="https://www.youtube.com/embed/${ytId}" frameborder="0" allowfullscreen style="margin-top:15px; border-radius:10px;"></iframe>` : 
        `<p style="margin-top:15px; text-align:center;">No trailer available.</p>`;

    body.innerHTML = `
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <img src="${anime.images.jpg.image_url}" style="width:200px; border-radius:10px;">
            <div style="flex:1; min-width:300px;">
                <h2 style="margin:0; color:#3db4f2;">${anime.title_english || anime.title}</h2>
                <p>⭐ ${anime.score || 'N/A'}</p>
                <div style="background:#252729; padding:15px; border-radius:8px; font-size:0.9rem; max-height:150px; overflow-y:auto;">${anime.synopsis || 'No description.'}</div>
                ${trailerHtml}
            </div>
        </div>`;
}

// 6. HELPERS
function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.countdown-timer').forEach(el => {
        if (el.dataset.status === "Finished Airing") { el.innerText = "COMPLETED"; return; }
        const premiere = new Date(el.dataset.premiere);
        const target = (premiere > now) ? premiere : getNextAirEST(el.dataset.day, el.dataset.time);
        const diff = target - now;
        if (diff < 0) { el.innerText = "AIRING NOW"; el.style.color = "#ff4d4d"; } 
        else {
            const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
            el.innerText = `${d}d ${h}h ${m}m ${s}s`;
        }
    });
}

function getNextAirEST(day, time) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(day);
    const now = new Date();
    let res = new Date(now);
    res.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
    return res;
}

function setupEventListeners() {
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length > 2) searchTimeout = setTimeout(() => performSearch(query), 500);
        else if (query.length === 0) loadSeasonalData();
    });
    document.getElementById('filterBtn').onclick = (e) => { e.stopPropagation(); document.getElementById("filterMenu").classList.toggle("show"); };
    window.onclick = () => document.getElementById("filterMenu").classList.remove("show");
    document.querySelector('.close-modal').onclick = () => document.getElementById('animeModal').style.display = "none";
    document.getElementById('toggleWatchlist').onclick = toggleWatchlistView;
}

async function performSearch(query) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Searching...</div>';
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=20`);
    const json = await res.json();
    currentData = json.data;
    renderCards(currentData);
}

function toggleWatchlistView() { document.getElementById('viewTitle').innerText = "MY WATCHLIST"; renderCards(watchlist); }
function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }
function updateSeason() { currentSeason = document.getElementById('seasonPicker').value; loadSeasonalData(); }
function changeYear(n) { currentYear += n; document.getElementById('displayYear').innerText = currentYear; loadSeasonalData(); }

init();
