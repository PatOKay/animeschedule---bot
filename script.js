let currentYear = 2026;
let currentSeason = 'spring';
let searchTimeout;
let currentData = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    
    document.getElementById('globalSearch').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value;
        if (query.length > 2) searchTimeout = setTimeout(() => performGlobalSearch(query), 500);
        else if (query.length === 0) loadSeasonalData();
    });

    document.getElementById('filterBtn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById("filterMenu").classList.toggle("show");
    };

    document.getElementById('toggleWatchlist').onclick = toggleWatchlistView;
    document.getElementById('snapTop').onclick = () => window.scrollTo({ top: 0, behavior: 'auto' });
    
    window.onscroll = () => {
        const btn = document.getElementById("snapTop");
        btn.style.display = (window.scrollY > 300) ? "block" : "none";
    };

    document.querySelector('.close-modal').onclick = closeModal;
    window.onclick = (e) => { 
        if (e.target.id === 'animeModal') closeModal();
        if (!e.target.matches('#filterBtn')) document.getElementById("filterMenu").classList.remove("show");
    };

    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

async function loadSeasonalData() {
    document.getElementById('navBar').style.display = 'flex';
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Syncing Season...</div>';
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await res.json();
        currentData = data;
        renderCards(data);
    } catch (e) { grid.innerHTML = "API Timeout. Please refresh."; }
}

async function performGlobalSearch(query) {
    document.getElementById('navBar').style.display = 'none';
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `GLOBAL SEARCH: ${query}`;
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=24`);
        const { data } = await res.json();
        currentData = data;
        renderCards(data);
    } catch (e) { grid.innerHTML = "Search Error."; }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    if (!data || data.length === 0) { grid.innerHTML = "No results found."; return; }
    grid.innerHTML = data.map((anime, index) => {
        const day = anime.broadcast?.day || "null";
        const time = anime.broadcast?.time || "00:00";
        // Check if finished
        const isFinished = anime.status === "Finished Airing";
        
        return `
            <div class="anime-card" onclick="showDetails(${index})">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}">
                    <div class="countdown-timer" 
                         data-status="${anime.status}" 
                         data-day="${day}" 
                         data-time="${time}">
                         ${isFinished ? "COMPLETED" : "Calculating..."}
                    </div>
                </div>
                <div class="info">
                    <h3>${anime.title_english || anime.title}</h3>
                    <p style="font-size:0.75rem; color:#3db4f2;">${isFinished ? "Full Season Available" : getESTTime(day, time)}</p>
                </div>
            </div>`;
    }).join('');
    updateTimers();
}

async function showDetails(index) {
    const anime = currentData[index];
    const isAdded = watchlist.some(item => item.mal_id === anime.mal_id);
    const modal = document.getElementById('animeModal');
    const body = document.getElementById('modalBody');
    
    document.getElementById('animeModal').style.display = "block";
    body.innerHTML = `<div class="loader">Loading Details & Trailer...</div>`;

    // Fetch full data to ensure we get the trailer if the seasonal list missed it
    let ytId = anime.trailer?.youtube_id;
    try {
        if (!ytId) {
            const detailRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}`);
            const detailJson = await detailRes.json();
            ytId = detailJson.data.trailer?.youtube_id;
        }
    } catch (e) { console.log("Detail fetch failed"); }

    const trailerHtml = ytId 
        ? `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>`
        : `<div style="background:#252729; padding:20px; border-radius:10px; margin-top:20px; text-align:center; color:#777;">📺 Trailer not available in API database</div>`;

    body.innerHTML = `
        <div style="display:flex; gap:25px; flex-wrap:wrap;">
            <img src="${anime.images.jpg.large_image_url}" style="width:230px; border-radius:10px; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
            <div style="flex:1; min-width:300px;">
                <div style="display:flex; justify-content:space-between;">
                    <h2 style="color:var(--accent); margin:0;">${anime.title_english || anime.title}</h2>
                    <button class="heart-btn ${isAdded ? 'active' : ''}" onclick="toggleHeart(event, ${index})">❤</button>
                </div>
                <p>⭐ ${anime.score || 'N/A'} | ${anime.type} | ${anime.status}</p>
                <div style="background:#252729; padding:15px; border-radius:8px; font-size:0.9rem; max-height:150px; overflow-y:auto; line-height:1.5;">
                    ${anime.synopsis || 'No description available.'}
                </div>
                ${trailerHtml}
            </div>
        </div>
    `;
}

function closeModal() {
    document.getElementById('modalBody').innerHTML = ""; 
    document.getElementById('animeModal').style.display = "none";
}

function sortData(type) {
    if (!currentData) return;
    if (type === 'pop') currentData.sort((a,b) => (b.members || 0) - (a.members || 0));
    if (type === 'score') currentData.sort((a,b) => (b.score || 0) - (a.score || 0));
    if (type === 'alpha') currentData.sort((a,b) => (a.title_english || a.title).localeCompare(b.title_english || b.title));
    if (type === 'newest') currentData.sort((a,b) => new Date(b.aired?.from || 0) - new Date(a.aired?.from || 0));
    if (type === 'oldest') currentData.sort((a,b) => new Date(a.aired?.from || 0) - new Date(b.aired?.from || 0));
    renderCards(currentData);
}

function toggleHeart(e, index) {
    e.stopPropagation();
    const anime = currentData[index];
    const wIdx = watchlist.findIndex(item => item.mal_id === anime.mal_id);
    if (wIdx > -1) { watchlist.splice(wIdx, 1); e.target.classList.remove('active'); }
    else { watchlist.push(anime); e.target.classList.add('active'); }
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
}

function toggleWatchlistView() {
    if (watchlist.length === 0) { alert("Watchlist is empty!"); return; }
    document.getElementById('navBar').style.display = 'none';
    document.getElementById('viewTitle').innerText = "MY WATCHLIST";
    currentData = watchlist;
    renderCards(watchlist);
}

function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }

function updateTimers() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        if (timer.dataset.status === "Finished Airing") {
            timer.innerText = "COMPLETED";
            timer.style.color = "#aaa";
            return;
        }

        const day = timer.dataset.day; const time = timer.dataset.time;
        if (!day || day === "null") { timer.innerText = "Schedule TBA"; return; }
        
        const nextAir = getNextAirEST(day, time);
        const diff = nextAir - now;
        
        if (diff <= 0 && diff > -3600000) { 
            timer.innerText = "AIRING NOW"; 
            timer.style.color = "#ff4d4d"; 
        } else {
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
    let estH = h - 14; let dIdx = days.indexOf(day);
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
