let currentYear = 2026;
let currentSeason = 'winter';
let searchTimeout;
let currentData = [];

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'winter';
    
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    // Search & Scroll
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        if (query.length > 2) searchTimeout = setTimeout(() => performGlobalSearch(query), 500);
        else if (query.length === 0) loadSeasonalData();
    });

    window.onscroll = () => scrollFunction();
    document.getElementById('snapTop').onclick = () => window.scrollTo({ top: 0, behavior: 'auto' });

    // Modal close logic
    document.querySelector('.close-modal').onclick = () => document.getElementById('animeModal').style.display = "none";
    window.onclick = (event) => { if (event.target == document.getElementById('animeModal')) document.getElementById('animeModal').style.display = "none"; };

    await loadSeasonalData();
    updateTimers(); 
    setInterval(updateTimers, 1000);
}

function scrollFunction() {
    const btn = document.getElementById("snapTop");
    btn.style.display = (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) ? "block" : "none";
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Syncing...</div>';

    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await res.json();
        currentData = data;
        renderCards(data);
    } catch (e) { grid.innerHTML = "API Error. Please refresh."; }
}

async function performGlobalSearch(query) {
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `SEARCH: ${query.toUpperCase()}`;
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}`);
        const { data } = await res.json();
        currentData = data;
        renderCards(data);
    } catch (e) { grid.innerHTML = "Search Error."; }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map((anime, index) => {
        const day = anime.broadcast?.day || "null";
        const time = anime.broadcast?.time || "00:00";
        return `
            <div class="anime-card" onclick="showDetails(${index})">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}">
                    <div class="countdown-timer" data-day="${day}" data-time="${time}">Calculating...</div>
                </div>
                <div class="info">
                    <h3>${anime.title_english || anime.title}</h3>
                    <p style="font-size:0.75rem; color:#3db4f2;">${getESTTime(day, time)}</p>
                </div>
            </div>`;
    }).join('');
}

function showDetails(index) {
    const anime = currentData[index];
    const modal = document.getElementById('animeModal');
    const body = document.getElementById('modalBody');
    
    body.innerHTML = `
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
            <img src="${anime.images.jpg.large_image_url}" style="width:200px; border-radius:10px;">
            <div style="flex:1; min-width:300px;">
                <h2 style="color:var(--accent); margin-top:0;">${anime.title_english || anime.title}</h2>
                <p><strong>Score:</strong> ⭐ ${anime.score || 'N/A'}</p>
                <p><strong>Genres:</strong> ${anime.genres.map(g => g.name).join(', ')}</p>
                <p><strong>Status:</strong> ${anime.status}</p>
                <p style="line-height:1.6; color:#ccc;">${anime.synopsis || 'No synopsis available.'}</p>
            </div>
        </div>
    `;
    modal.style.display = "block";
}

function updateTimers() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const day = timer.dataset.day;
        const time = timer.dataset.time;
        if (!day || day === "null") { timer.innerText = "Schedule TBA"; return; }
        const nextAir = getNextAirEST(day, time);
        const diff = nextAir - now;
        if (diff <= 0 && diff > -3600000) { timer.innerText = "AIRING NOW"; timer.style.color = "#ff4d4d"; }
        else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timer.innerText = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
            timer.style.color = "#00ffcc";
        }
    });
}

function getNextAirEST(jDay, jTime) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = jTime.split(':').map(Number);
    let estH = h - 14; 
    let targetD = (days.indexOf(jDay) - (h - 14 < 0 ? 1 : 0) + 7) % 7;
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    let dWait = (targetD - nowEST.getDay() + 7) % 7;
    if (dWait === 0 && (nowEST.getHours() > (estH < 0 ? estH + 24 : estH))) dWait = 7;
    const next = new Date(nowEST);
    next.setDate(nowEST.getDate() + dWait);
    next.setHours(estH < 0 ? estH + 24 : estH, m, 0, 0);
    return next;
}

function getESTTime(day, time) {
    if (day === "null") return "Schedule TBA";
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    let [h, m] = time.split(':').map(Number);
    let estH = h - 14;
    let dIdx = days.indexOf(day);
    if (estH < 0) { estH += 24; dIdx = (dIdx - 1 + 7) % 7; }
    return `${days[dIdx]} at ${String(estH).padStart(2, '0')}:${String(m).padStart(2, '0')} EST`;
}

function changeYear(n) { currentYear += n; updateSeason(); }
function updateSeason() {
    currentSeason = document.getElementById('seasonPicker').value;
    document.getElementById('displayYear').innerText = currentYear;
    loadSeasonalData();
}

init();
