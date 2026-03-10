let currentYear = 2026;
let currentSeason = 'spring';
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'spring';
    
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    await loadSeasonalData();
    updateTimers(); 
    setInterval(updateTimers, 1000);
}

// ... (keep changeYear and updateSeason functions as they are)

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Loading Broadcasts...</div>';

    try {
        const response = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await response.json();
        renderCards(data);
    } catch (err) {
        grid.innerHTML = `<div class="error">API Error. Please refresh in a moment.</div>`;
    }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map(anime => {
        const jDay = anime.broadcast?.day || "null";
        const jTime = anime.broadcast?.time || "00:00";
        
        return `
            <div class="anime-card" id="anime-${anime.mal_id}">
                <div class="poster-container">
                    <div class="live-indicator-container"></div> <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">Calculating...</div>
                </div>
                <div class="info">
                    <span class="studio">${anime.studios[0]?.name || 'TBA'}</span>
                    <h3>${anime.title_english || anime.title}</h3>
                    <div style="font-size:0.8rem; color:var(--text-dim);">${getESTTime(jDay, jTime)}</div>
                </div>
            </div>`;
    }).join('');
}

function updateTimers() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));

    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const day = timer.dataset.day;
        const time = timer.dataset.time;
        const card = timer.closest('.anime-card');
        const badgeContainer = card.querySelector('.live-indicator-container');

        if (!day || day === "null" || time === "00:00") {
            timer.innerText = "Schedule TBA";
            return;
        }

        const nextAir = getNextAirEST(day, time);
        const diff = nextAir - now;

        // SHOW IS LIVE (Within 1 hour of start time)
        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "LIVE NOW";
            timer.style.color = "#ff4d4d";
            if (!badgeContainer.innerHTML) {
                badgeContainer.innerHTML = `<div class="live-badge"><div class="pulse-dot"></div> LIVE</div>`;
            }
        } else {
            // SHOW IS NOT LIVE
            badgeContainer.innerHTML = ''; // Remove badge
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

init();
