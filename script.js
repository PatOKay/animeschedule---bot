let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Syncing with Japan Broadcasts...</div>';

    try {
        const response = await fetch('https://api.jikan.moe/v4/seasons/now');
        const json = await response.json();
        allAnime = json.data;
        
        renderGrid(allAnime);
        updateWatchlistCount();
        
        // Start the global timer (runs every second)
        setInterval(updateAllCountdowns, 1000);
    } catch (error) {
        grid.innerHTML = `<div class="error">Connection lost. Check your internet.</div>`;
    }
}

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.className = 'grid-layout';
    
    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        
        // Data Extraction
        const title = anime.title_english || anime.title || "TBA";
        const poster = anime.images?.jpg?.large_image_url;
        const studio = anime.studios?.map(s => s.name).join(', ') || 'Unknown Studio';
        
        // Episode logic: Current / Total
        const currentEp = anime.episodes_aired || 0;
        const totalEp = anime.episodes || '?';
        
        // Use the 'aired.from' ISO string for the countdown
        const airDateISO = anime.aired?.from || null;

        return `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${poster}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    <div class="countdown-timer" data-expire="${airDateISO}">
                        00:00:00:00
                    </div>
                </div>
                <div class="info">
                    <div class="studio-tag">${studio}</div>
                    <h3>${title}</h3>
                    <div class="ep-count">Episodes: <strong>${currentEp} / ${totalEp}</strong></div>
                    <p class="synopsis">${anime.synopsis ? anime.synopsis.substring(0, 80) + '...' : ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

function updateAllCountdowns() {
    const timers = document.querySelectorAll('.countdown-timer');
    
    timers.forEach(timer => {
        const expireDate = timer.getAttribute('data-expire');
        if (!expireDate || expireDate === "null") {
            timer.innerText = "TBA";
            return;
        }

        const target = new Date(expireDate).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        if (diff < 0) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ff00"; // Green for live
            return;
        }

        // Calculate Time Parts
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        // Formatting to 00:00:00:00
        const fD = String(days).padStart(2, '0');
        const fH = String(hours).padStart(2, '0');
        const fM = String(mins).padStart(2, '0');
        const fS = String(secs).padStart(2, '0');

        timer.innerText = `${fD}:${fH}:${fM}:${fS}`;
    });
}

// Watchlist Logic
function toggleSave(id) {
    const anime = allAnime.find(a => a.mal_id === id);
    const index = watchlist.findIndex(item => item.mal_id === id);
    index > -1 ? watchlist.splice(index, 1) : watchlist.push(anime);
    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
    renderGrid(document.getElementById('viewTitle').innerText === "My Watchlist" ? watchlist : allAnime);
}

function updateWatchlistCount() {
    document.getElementById('toggleWatchlist').innerText = `Watchlist (${watchlist.length})`;
}

init();
