let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
const urlParams = new URLSearchParams(window.location.search);
const currentSeason = urlParams.get('season') || 'spring';
const currentYear = urlParams.get('year') || '2026';

async function init() {
    document.getElementById('pageTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    
    // Highlight active link
    const links = document.querySelectorAll('.season-nav a');
    links.forEach(link => {
        if(link.id === `nav-${currentSeason}-${currentYear}`) link.classList.add('active-nav');
    });

    await fetchSeasonData(currentYear, currentSeason);
    setInterval(updateAllCountdowns, 1000);
}

async function fetchSeasonData(year, season) {
    const grid = document.getElementById('anime-grid');
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
        const { data } = await res.json();
        renderGrid(data);
    } catch (e) {
        grid.innerHTML = `<div class="error">API Timeout. Please refresh.</div>`;
    }
}

function renderGrid(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(i => i.mal_id === anime.mal_id);
        const jDay = anime.broadcast?.day || "null";
        const jTime = anime.broadcast?.time || "00:00";
        const estStr = getESTBroadcastInfo(jDay, jTime);

        return `
            <div class="anime-card" data-title="${anime.title.toLowerCase()}">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">${isSaved ? '❤️' : '🤍'}</button>
                    ${anime.status === 'Currently Airing' ? 
                        `<div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">Calc...</div>` : 
                        `<div class="status-badge">${anime.status}</div>`}
                </div>
                <div class="info">
                    <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                    <h3 style="font-size: 1rem; margin: 10px 0;">${anime.title_english || anime.title}</h3>
                    <div style="font-size:0.8rem; color:var(--text-dim);">${estStr}</div>
                </div>
            </div>`;
    }).join('');
}

function getESTBroadcastInfo(day, time) {
    if (day === "null" || !time) return "Completed";
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    let [h, m] = time.split(':').map(Number);
    let estH = h - 14;
    let dIdx = days.indexOf(day);
    if (estH < 0) { estH += 24; dIdx = (dIdx - 1 + 7) % 7; }
    return `${days[dIdx]} at ${String(estH).padStart(2, '0')}:${String(m).padStart(2, '0')} EST`;
}

function updateAllCountdowns() {
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const nextAir = getNextAirEST(timer.dataset.day, timer.dataset.time);
        const diff = nextAir - nowEST;
        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((ms = diff % 60000) / 1000);
            timer.innerText = `${d}d ${String(h).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:${String(Math.floor(s)).padStart(2, '0')}`;
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
    if (dWait === 0 && (nowEST.getHours() > estH)) dWait = 7;
    const next = new Date(nowEST);
    next.setDate(nowEST.getDate() + dWait);
    next.setHours(estH < 0 ? estH + 24 : estH, m, 0, 0);
    return next;
}

init();
