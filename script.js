let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

// Define the seasons we want to display
const SEASONS_TO_LOAD = [
    { year: 2026, season: 'spring' }, // Current/Future
    { year: 2026, season: 'winter' }, // Previous
    { year: 2025, season: 'fall' },   // Past
    { year: 2025, season: 'summer' }  // Past
];

async function init() {
    const container = document.getElementById('seasonal-container');
    container.innerHTML = '';

    for (const s of SEASONS_TO_LOAD) {
        await fetchAndRenderSeason(s.year, s.season);
        // Delay to respect API rate limits (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setInterval(updateAllCountdowns, 1000);
}

async function fetchAndRenderSeason(year, season) {
    const container = document.getElementById('seasonal-container');
    
    try {
        const response = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
        const json = await response.json();
        const animeList = json.data;

        // Create Section Header
        const sectionId = `season-${season}-${year}`;
        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'season-header';
        sectionHeader.id = sectionId;
        sectionHeader.innerHTML = `<h2>${season.toUpperCase()} ${year}</h2>`;
        container.appendChild(sectionHeader);

        // Create Grid for this specific season
        const grid = document.createElement('div');
        grid.className = 'grid-layout';
        
        grid.innerHTML = animeList.map(anime => {
            const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
            const jDay = anime.broadcast?.day || "null";
            const jTime = anime.broadcast?.time || "00:00";
            const estInfo = getESTBroadcastInfo(jDay, jTime);

            return `
                <div class="anime-card" data-title="${anime.title.toLowerCase()}">
                    <div class="poster-container">
                        <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                        <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">
                            ${isSaved ? '❤️' : '🤍'}
                        </button>
                        ${anime.status === 'Currently Airing' ? 
                            `<div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">Calc...</div>` : 
                            `<div class="status-badge">${anime.status}</div>`}
                    </div>
                    <div class="info">
                        <div class="studio-tag">${anime.studios[0]?.name || 'TBA'}</div>
                        <h3>${anime.title_english || anime.title}</h3>
                        <div class="ep-count">${estInfo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        container.appendChild(grid);
    } catch (error) {
        console.error(`Error loading ${season} ${year}:`, error);
    }
}

// Logic for EST Conversion (Same as previous, refined for the loop)
function getESTBroadcastInfo(day, time) {
    if (day === "null" || !time) return "Completed / Schedule TBA";
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = time.split(':').map(Number);
    let estHour = h - 14;
    let dayIndex = days.indexOf(day);
    if (estHour < 0) { estHour += 24; dayIndex = (dayIndex - 1 + 7) % 7; }
    return `EST: ${days[dayIndex]} at ${String(estHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Global search across all rendered grids
document.getElementById('animeSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.anime-card').forEach(card => {
        const title = card.getAttribute('data-title');
        card.style.display = title.includes(term) ? 'block' : 'none';
    });
});

// Timer and occurrence logic (Refer to previous script.js version for full function bodies)
// ... updateAllCountdowns() and getNextAirEST() code goes here ...

init();
