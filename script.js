let allAnime = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];
let currentView = 'grid';

async function init() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Loading Seasonal Content...</div>';

    try {
        // Fetching current season from Jikan API
        const response = await fetch('https://api.jikan.moe/v4/seasons/now');
        const json = await response.json();
        allAnime = json.data;
        
        renderGrid(allAnime);
        updateWatchlistCount();
    } catch (error) {
        grid.innerHTML = `<div class="error">Failed to load content. Please refresh.</div>`;
        console.error("API Error:", error);
    }
}

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.className = 'grid-layout';
    
    if (data.length === 0) {
        container.innerHTML = '<p>No anime found matching those criteria.</p>';
        return;
    }

    container.innerHTML = data.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        
        // Fail-safe data handling to prevent "null" text
        const title = anime.title_english || anime.title || "Unknown Title";
        const poster = anime.images?.jpg?.large_image_url || 'https://via.placeholder.com/225x320';
        const genres = anime.genres?.map(g => g.name).join(', ') || 'General';
        const synopsis = anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'No description available.';
        const airTime = anime.broadcast?.string || 'Time TBA';

        return `
            <div class="anime-card">
                <div class="poster-container" style="position: relative;">
                    <img class="poster" src="${poster}" alt="${title}" loading="lazy">
                    <button class="save-btn ${isSaved ? 'active' : ''}" 
                            onclick="toggleSave(${anime.mal_id})" 
                            style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); border: none; border-radius: 50%; color: white; width: 30px; height: 30px; cursor: pointer;">
                        ${isSaved ? '❤️' : '🤍'}
                    </button>
                    <div class="countdown-overlay" style="position: absolute; bottom: 0; background: rgba(0,0,0,0.8); width: 100%; color: #3db4f2; text-align: center; padding: 5px 0; font-size: 0.8rem;">
                        ${airTime}
                    </div>
                </div>
                <div class="info" style="padding: 12px;">
                    <h3 style="margin: 0 0 5px 0; font-size: 1rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${title}
                    </h3>
                    <p style="font-size: 0.7rem; color: var(--accent); margin: 0 0 8px 0;">${genres}</p>
                    <p style="font-size: 0.75rem; color: #9fadbd; line-height: 1.3;">${synopsis}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Search Functionality
document.getElementById('animeSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allAnime.filter(a => 
        (a.title && a.title.toLowerCase().includes(term)) || 
        (a.title_english && a.title_english.toLowerCase().includes(term))
    );
    renderGrid(filtered);
});

// Watchlist Logic
function toggleSave(id) {
    const anime = allAnime.find(a => a.mal_id === id);
    const index = watchlist.findIndex(item => item.mal_id === id);

    if (index > -1) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push(anime);
    }

    localStorage.setItem('myWatchlist', JSON.stringify(watchlist));
    updateWatchlistCount();
    
    // Refresh the current view
    const title = document.getElementById('viewTitle').innerText;
    renderGrid(title === "My Watchlist" ? watchlist : allAnime);
}

function updateWatchlistCount() {
    document.getElementById('toggleWatchlist').innerText = `Watchlist (${watchlist.length})`;
}

document.getElementById('toggleWatchlist').onclick = () => {
    const title = document.getElementById('viewTitle');
    if (title.innerText !== "My Watchlist") {
        title.innerText = "My Watchlist";
        renderGrid(watchlist);
    } else {
        title.innerText = "Spring 2026 Schedule";
        renderGrid(allAnime);
    }
};

// Start the app
init();
