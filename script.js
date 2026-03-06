let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
const urlParams = new URLSearchParams(window.location.search);
const currentSeason = urlParams.get('season') || 'spring';
const currentYear = urlParams.get('year') || '2026';

function generateNav() {
    const nav = document.getElementById('mainNav');
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    let html = '';
    for (let y = 2026; y >= 2017; y--) {
        seasons.forEach(s => {
            const active = (currentSeason === s && currentYear == y) ? 'active-nav' : '';
            html += `<a href="index.html?season=${s}&year=${y}" class="${active}">${s.toUpperCase()} ${y}</a>`;
        });
    }
    nav.innerHTML = html;
    const activeEl = document.querySelector('.active-nav');
    if (activeEl) activeEl.scrollIntoView({ inline: 'center' });
}

async function init() {
    generateNav();
    document.getElementById('pageTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    await fetchWithRetry(currentYear, currentSeason);
    setInterval(updateAllCountdowns, 1000);
}

// Optimized Fetch with Retry Logic to prevent "API Error"
async function fetchWithRetry(year, season, retries = 3) {
    const grid = document.getElementById('anime-grid');
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
        if (!res.ok) throw new Error('Rate Limited');
        const { data } = await res.json();
        renderGrid(data);
    } catch (e) {
        if (retries > 0) {
            grid.innerHTML = `<div class="loader">API Busy... Retrying in 1.5s (${retries} left)</div>`;
            setTimeout(() => fetchWithRetry(year, season, retries - 1), 1500);
        } else {
            grid.innerHTML = `<div class="error" style="color:#ff4d4d; grid-column: 1/-1;">
                <h3>Unable to load ${season} ${year}</h3>
                <p>The Jikan API is under heavy load. Please wait 10 seconds and refresh.</p>
            </div>`;
        }
    }
}

function renderGrid(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(i => i.mal_id === anime.mal_id);
        const jDay = anime.broadcast?.day || "null";
        const jTime = anime.broadcast?.time || "00:00";
        
        const genreName = anime.genres[0]?.name.toLowerCase() || "";
        let gClass = "genre-default";
        if (genreName.includes("action")) gClass = "genre-action";
        else if (genreName.includes("romance")) gClass = "genre-romance";
        else if (genreName.includes("fantasy")) gClass = "genre-fantasy";
        else if (genreName.includes("adventure")) gClass = "genre-adventure";

        return `
            <div class="anime-card ${gClass}" data-title="${anime.title.toLowerCase()}">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">${isSaved ? '❤️' : '🤍'}</button>
                    ${anime.status === 'Currently Airing' ? 
                        `<div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">Calculating...</div>` : 
                        `<div class="status-badge">${anime.status}</div>`}
                </div>
                <div class="info">
                    <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                    <h3>${anime.title_english || anime.title}</h3>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${getESTBroadcastInfo(jDay, jTime)}</div>
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
    return `EST: ${days[dIdx]} at ${String(estH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function updateAllCountdowns() {
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const nextAir = getNextAirEST(timer.dataset.day, timer.dataset.time);
        const diff = nextAir - nowEST;
        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "AIRING NOW";
        } else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            timer.innerText = `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

init();
