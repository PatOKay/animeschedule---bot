let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
const SEASONS_TO_LOAD = [
    { year: 2026, season: 'spring' },
    { year: 2026, season: 'winter' },
    { year: 2025, season: 'fall' },
    { year: 2025, season: 'summer' }
];

async function init() {
    const container = document.getElementById('seasonal-container');
    container.innerHTML = '';
    for (const s of SEASONS_TO_LOAD) {
        await fetchAndRenderSeason(s.year, s.season);
        await new Promise(r => setTimeout(r, 800)); // Rate limit protection
    }
    setInterval(updateAllCountdowns, 1000);
}

async function fetchAndRenderSeason(year, season) {
    const container = document.getElementById('seasonal-container');
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
        const { data } = await res.json();

        const header = document.createElement('div');
        header.className = 'season-header';
        header.id = `season-${season}-${year}`;
        header.innerHTML = `<h2>${season} ${year}</h2>`;
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'grid-layout';
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
                            `<div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">Calculating...</div>` : 
                            `<div class="status-badge">${anime.status}</div>`}
                    </div>
                    <div class="info">
                        <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                        <h3>${anime.title_english || anime.title}</h3>
                        <div style="font-size:0.8rem; margin-top:5px;">${estStr}</div>
                    </div>
                </div>`;
        }).join('');
        container.appendChild(grid);
    } catch (e) { console.error(e); }
}

function getESTBroadcastInfo(day, time) {
    if (day === "null" || !time) return "Schedule TBA";
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
            const m = Math.floor((ms = diff % 3600000) / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            timer.innerText = `${d}d ${String(h).padStart(2, '0')}:${String(Math.floor(m)).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
    if (dWait === 0 && (nowEST.getHours() > estH || (nowEST.getHours() === estH && nowEST.getMinutes() >= m))) dWait = 7;
    const next = new Date(nowEST);
    next.setDate(nowEST.getDate() + dWait);
    next.setHours(estH < 0 ? estH + 24 : estH, m, 0, 0);
    return next;
}

window.onscroll = () => {
    const btt = document.getElementById('backToTop');
    btt.style.display = (window.scrollY > 500) ? "block" : "none";
};
function scrollToTop() { window.scrollTo({top: 0, behavior: 'smooth'}); }

init();
