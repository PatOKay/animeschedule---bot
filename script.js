let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
let selectedTimezone = 'EST'; 

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Syncing EST Schedule...</div>';

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

document.getElementById('timezoneSelector').addEventListener('change', (e) => {
    selectedTimezone = e.target.value;
    renderGrid(allAnime);
});

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        
        // Broadcast data from API is always JST
        const jstDay = anime.broadcast.day || "TBA";
        const jstTime = anime.broadcast.time || "00:00";

        // Convert JST display string to EST for the label
        const estInfo = convertJSTtoEST(jstDay, jstTime);

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
                    <div class="ep-count">
                        <span class="timezone-label">${selectedTimezone} Broadcast</span>: 
                        <strong>${selectedTimezone === 'EST' ? estInfo : jstDay + ' ' + jstTime}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper to show the converted text in the info section
function convertJSTtoEST(day, time) {
    if (day === "TBA" || !time) return "TBA";
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = time.split(':').map(Number);
    
    // JST is UTC+9 | EST is UTC-5 (14 hour difference)
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
    const now = new Date();

    timers.forEach(timer => {
        const dayStr = timer.getAttribute('data-day');
        const timeStr = timer.getAttribute('data-time');

        if (!dayStr || dayStr === "null") {
            timer.innerText = "TBA";
            return;
        }

        const nextAir = getNextOccurrence(dayStr, timeStr);
        const diff = nextAir - now;

        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else {
            timer.innerText = formatTime(diff);
        }
    });
}

function getNextOccurrence(dayStr, timeStr) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(dayStr);
    const [hrs, mins] = timeStr.split(':').map(Number);

    // Create target in JST
    const jstNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    let daysUntil = targetDay - jstNow.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && (jstNow.getHours() > hrs))) {
        daysUntil += 7;
    }

    const nextAir = new Date(jstNow);
    nextAir.setDate(jstNow.getDate() + daysUntil);
    nextAir.setHours(hrs, mins, 0, 0);

    // This absolute timestamp works regardless of user location
    return new Date(nextAir.toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
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
