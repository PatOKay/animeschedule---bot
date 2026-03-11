let currentYear = 2026;
let currentSeason = 'spring';
let searchTimeout;
let currentData = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    
    // UI Event Listeners
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
    
    document.querySelector('.close-modal').onclick = closeModal;
    
    // Load Initial Data
    await loadSeasonalData();
    // Start Timer Refresh
    setInterval(updateTimers, 1000);
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Fetching accurate schedules...</div>';
    
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        if (res.status === 429) {
            grid.innerHTML = '<div class="loader">Rate limit hit. Retrying in 2 seconds...</div>';
            setTimeout(loadSeasonalData, 2000);
            return;
        }
        const json = await res.json();
        currentData = json.data;
        renderCards(currentData);
    } catch (e) { 
        grid.innerHTML = `<div style="color:red; padding:20px;">Connection Error. Check your internet or API status.</div>`; 
    }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    if (!data || data.length === 0) { grid.innerHTML = "No results found."; return; }
    
    grid.innerHTML = data.map((anime, index) => {
        const day = anime.broadcast?.day || "null";
        const time = anime.broadcast?.time || "00:00";
        const isFinished = anime.status === "Finished Airing";
        
        return `
            <div class="anime-card" onclick="showDetails(${index})">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}">
                    <div class="countdown-timer" 
                         data-status="${anime.status}" 
                         data-premiere="${anime.aired?.from || ''}"
                         data-day="${day}" 
                         data-time="${time}">
                         Syncing Time...
                    </div>
                </div>
                <div class="info">
                    <h3>${anime.title_english || anime.title}</h3>
                    <p style="font-size:0.75rem; color:#3db4f2;">${isFinished ? "COMPLETED" : getESTTime(day, time)}</p>
                </div>
            </div>`;
    }).join('');
    updateTimers();
}

// ... (Next steps: This script continues with showDetails and updateTimers logic)
