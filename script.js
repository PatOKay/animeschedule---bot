let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Fetching Japanese Broadcast Schedules...</div>';

    try {
        const response = await fetch('https://api.jikan.moe/v4/seasons/now');
        const json = await response.json();
        allAnime = json.data;
        
        renderGrid(allAnime);
        // Sync timers every second
        setInterval(updateAllCountdowns, 1000);
    } catch (error) {
        grid.innerHTML = `<div class="error">API Rate limit hit. Wait a moment and refresh.</div>`;
    }
}

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        const title = anime.title_english || anime.title;
        const studio = anime.studios[0]?.name || 'TBA';
        
        // Episode Logic: Jikan provides 'episodes' (total) 
        // Note: 'episodes_aired' isn't always in the season-now endpoint, 
        // so we use score/rank as placeholders or just total if airing.
        const totalEp = anime.episodes || '?';
        const currentEp = anime.status === "Airing" ? "Airing" : "Completed";

        return `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    <div class="countdown-timer" 
                         data-day="${anime.broadcast.day}" 
                         data-time="${anime.broadcast.time}" 
                         data-timezone="${anime.broadcast.timezone}">
                        Syncing Time...
                    </div>
                </div>
                <div class="info">
                    <div class="studio-tag">${studio} • ${anime.source}</div>
                    <h3>${title}</h3>
                    <div class="ep-count">Status: <strong>${currentEp} (${totalEp} Total)</strong></div>
                    <p class="synopsis">${anime.synopsis ? anime.synopsis.substring(0, 75) + '...' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

function updateAllCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    const now = new Date();

    timers.forEach(timer => {
        const day = timer.getAttribute('data-day'); // e.g., "Sundays"
        const time = timer.getAttribute('data-time'); // e.g., "23:30"

        if (!day || !time || day === "null") {
            timer.innerText = "SCHEDULE TBA";
            return;
        }

        // Calculate next occurrence
        const nextAir = getNextOccurrence(day, time);
        const diff = nextAir - now;

        if (diff <= 0) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else {
            timer.innerText = formatTime(diff);
            timer.style.color = ""; // Reset to default
        }
    });
}

// Logic to find the next weekly broadcast time
function getNextOccurrence(dayStr, timeStr) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(dayStr);
    const [hrs, mins] = timeStr.split(':').map(Number);
    
    let result = new Date();
    // Set to JST (Japan Standard Time) approximately by adjusting UTC
    // Jikan provides JST. We'll treat local as target for simplicity in this MVP
    result.setHours(hrs, mins, 0, 0);

    const today = new Date().getDay();
    let daysUntil = targetDay - today;
    if (daysUntil < 0 || (daysUntil === 0 && new Date() > result)) {
        daysUntil += 7;
    }
    
    result.setDate(result.getDate() + daysUntil);
    return result;
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
