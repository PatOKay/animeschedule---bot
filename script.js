// 1. INITIALIZATION & AUTH CHECK
const SUPABASE_URL = 'https://aqromksnrykuakcmvhjg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GgfGatSj5nAsT_LijOZgRQ_vrIozPii';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentYear = 2026, currentSeason = 'spring', currentData = [], searchTimeout;
let watchlist = [];

// Check if user is already logged in on page refresh
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('sidebarBtn').style.display = 'block';
        initApp();
    }
}

// 2. SIGN-IN / SIGN-UP LOGIC
document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('authMsg');

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        // Fallback to Sign Up if Login fails
        const { error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if (signUpError) msg.innerText = signUpError.message;
        else {
            msg.style.color = "#00ffcc";
            msg.innerText = "Account created! Please confirm your email or try logging in again.";
        }
    } else {
        document.getElementById('authOverlay').style.display = 'none';
        document.getElementById('sidebarBtn').style.display = 'block';
        initApp();
    }
};

// 3. MAIN APP ENGINE
async function initApp() {
    setupEventListeners();
    await syncWatchlist();
    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

async function syncWatchlist() {
    const { data, error } = await supabaseClient.from('Anime Sched').select('*');
    if (!error && data) {
        watchlist = data.map(item => item.anime_data);
        updateWatchlistCount();
    }
}

// 4. DISPLAY & SEARCH LOGIC
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
        grid.innerHTML = "Error loading anime.";
    }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
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

// 5. DATABASE ACTIONS (Protected by Auth)
async function addToWatchlist(i) {
    const anime = currentData[i];
    if (watchlist.some(item => item.mal_id === anime.mal_id)) return;

    const { error } = await supabaseClient.from('Anime Sched').insert([{ anime_data: anime }]);
    if (!error) {
        watchlist.push(anime);
        updateWatchlistCount();
        renderCards(currentData);
    }
}

async function removeFromWatchlist(i) {
    const animeId = currentData[i].mal_id;
    const { error } = await supabaseClient.from('Anime Sched').delete().filter('anime_data->mal_id', 'eq', animeId);
    if (!error) {
        watchlist = watchlist.filter(item => item.mal_id !== animeId);
        updateWatchlistCount();
        renderCards(document.getElementById('viewTitle').innerText === "MY WATCHLIST" ? watchlist : currentData);
    }
}

// 6. UI HELPERS
function toggleSidebar() {
    const sb = document.getElementById("pirateSidebar");
    sb.style.width = sb.style.width === "280px" ? "0" : "280px";
}

function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }

function setupEventListeners() {
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        if (query.length > 2) searchTimeout = setTimeout(() => performSearch(query), 500);
        else if (query.length === 0) loadSeasonalData();
    });
    document.getElementById('toggleWatchlist').onclick = () => {
        document.getElementById('viewTitle').innerText = "MY WATCHLIST";
        renderCards(watchlist);
    };
}

// Start checks
checkUser();
