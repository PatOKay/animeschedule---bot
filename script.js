let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Loading EST Schedule...</div>';

    try {
        const response = await fetch('https://api.jikan.moe/v4/seasons/now');
        const json = await response.json();
        allAnime = json.data;
        renderGrid(allAnime);
        setInterval(updateAllCountdowns, 1000);
    } catch (error) {
        grid.innerHTML = `<div class="error">Data fetch failed.</div>`;
    }
}

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        const jstDay = anime.broadcast.day || "TBA";
        const jstTime = anime.broadcast.time || "00:00";

        // Logic to show the EST broadcast time on the card
        const estInfo = getESTBroadcastInfo(jstDay, jstTime);

        return `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    <div class="countdown-timer" data-day="${jstDay}" data-time="${jstTime}">
                        Calculating...
                    </div>
                </div>
                <div class="info">
                    <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                    <h3>${anime.title_english || anime.title}</h3>
                    <div class="ep-count">EST Broadcast: <strong>${estInfo}</strong></div>
                </div>
            </div>
        `;
    }).join('');
}

function getESTBroadcastInfo(day, time) {
    if (day === "TBA" || !time || day === "null") return "TBA";
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = time.split(':').map(Number);
    
    // Convert 14 hours back for EST
    let estHour = h - 14;
    let dayIndex = days.indexOf(day);

    if (estHour < 0) {
        estHour += 24;
        dayIndex = (dayIndex - 1 + 7) % 7;
    }
    return `${days[dayIndex]} at ${String(estHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function updateAllCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    // Get current time specifically in EST
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));

    timers.forEach(timer => {
        const jDay = timer.getAttribute('data-day');
        const jTime = timer.getAttribute('data-time');

        if (!jDay || jDay === "null") {
            timer.innerText = "TBA";
            return;
        }

        const nextAirEST = getNextAirEST(jDay, jTime);
        const diff = nextAirEST - nowEST;

        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else if (diff < -3600000) {
            timer.innerText = "WAITING FOR NEXT WEEK";
        } else {
            timer.innerText = formatTime(diff);
            timer.style.color = "";
        }
    });
}

function getNextAirEST(jstDay, jstTime) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = jstTime.split(':').map(Number);
    
    // 1. Find the broadcast moment in EST
    let estHour = h - 14;
    let targetDayIdx = days.indexOf(jstDay);
    if (estHour < 0) {
        estHour += 24;
        targetDayIdx = (targetDayIdx - 1 + 7) % 7;
    }

    // 2. Current time in EST
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // 3. Calculate days until that EST moment
    let daysUntil = targetDayIdx - nowEST.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && (nowEST.getHours() > estHour || (nowEST.getHours() === estHour && nowEST.getMinutes() >= m)))) {
        daysUntil += 7;
    }

    const nextAir = new Date(nowEST);
    nextAir.setDate(nowEST.getDate() + daysUntil);
    nextAir.setHours(estHour, m, 0, 0);
    return nextAir;
}

function formatTime(ms) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function toggleSave(id) {
    const anime = allAnime.find(a => a.mal_id === id);
    const index = watchlist.findIndex(item => item.mal_id === id);
    index > -1 ? watchlist.splice(index, 1) : watchlist.push(anime);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    renderGrid(allAnime);
}

init();
