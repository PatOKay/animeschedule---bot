let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
let selectedTimezone = 'local'; // Default state

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Calculating Time Offsets...</div>';

    try {
        const response = await fetch('https://api.jikan.moe/v4/seasons/now');
        const json = await response.json();
        allAnime = json.data;
        
        renderGrid(allAnime);
        setInterval(updateAllCountdowns, 1000);
    } catch (error) {
        grid.innerHTML = `<div class="error">Failed to load schedule.</div>`;
    }
}

// Listen for Timezone Changes
document.getElementById('timezoneSelector').addEventListener('change', (e) => {
    selectedTimezone = e.target.value;
    renderGrid(allAnime); // Re-render to update the day labels if they shifted
});

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        
        // Jikan broadcast data is in JST
        const broadcastDay = anime.broadcast.day || "TBA";
        const broadcastTime = anime.broadcast.time || "00:00";

        return `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    <div class="countdown-timer" 
                         data-day="${broadcastDay}" 
                         data-time="${broadcastTime}">
                        Calculating...
                    </div>
                </div>
                <div class="info">
                    <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                    <h3>${anime.title_english || anime.title}</h3>
                    <div class="ep-count">
                        <span class="timezone-label">${selectedTimezone === 'JST' ? 'Japan Time' : 'Local Time'}</span>: 
                        <strong>${broadcastDay} at ${broadcastTime}</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
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

        // 1. Create a Date object in JST (UTC+9)
        const nextAirJST = getNextOccurrenceJST(dayStr, timeStr);
        
        // 2. Adjust target based on user selection
        let diff;
        if (selectedTimezone === 'JST') {
            diff = nextAirJST - now;
        } else {
            // Local calculation happens automatically because 'now' and 'nextAirJST' 
            // are compared as absolute timestamps (UTC)
            diff = nextAirJST - now;
        }

        if (diff <= 0 && diff > -3600000) { // If it aired within the last hour
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else if (diff <= -3600000) {
            timer.innerText = "AIRED";
            timer.style.color = "#888";
        } else {
            timer.innerText = formatTime(diff);
            timer.style.color = "";
        }
    });
}

function getNextOccurrenceJST(dayStr, timeStr) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(dayStr);
    const [hrs, mins] = timeStr.split(':').map(Number);

    let airDate = new Date();
    
    // Set current time in JST context (Japan is UTC+9)
    // We convert our local "now" to a JST equivalent to find the next "Sunday 23:30"
    const jstNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Tokyo"}));
    
    let daysUntil = targetDay - jstNow.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && (jstNow.getHours() > hrs || (jstNow.getHours() === hrs && jstNow.getMinutes() >= mins)))) {
        daysUntil += 7;
    }

    // This creates the absolute moment in time Japan will see the episode
    const nextAirJST = new Date(jstNow);
    nextAirJST.setDate(jstNow.getDate() + daysUntil);
    nextAirJST.setHours(hrs, mins, 0, 0);

    // Convert that JST-relative date back to a standard UTC timestamp for comparison
    const offset = (9 * 60); // JST is +540 minutes from UTC
    const utcDate = new Date(nextAirJST.getTime() - (offset * 60000));
    
    // Final absolute Date object
    return nextAirJST; 
}

function formatTime(ms) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// (Watchlist toggleSave and other helpers remain same as previous version)
function toggleSave(id) {
    const anime = allAnime.find(a => a.mal_id === id);
    const index = watchlist.findIndex(item => item.mal_id === id);
    index > -1 ? watchlist.splice(index, 1) : watchlist.push(anime);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    renderGrid(allAnime);
}

init();
