let currentYear = 2026;
let currentSeason = 'spring';

async function init() {
    // Load state from URL if exists
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'spring';
    
    // UI Setup
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

function changeYear(offset) {
    currentYear += offset;
    updateSeason();
}

function updateSeason() {
    currentSeason = document.getElementById('seasonPicker').value;
    document.getElementById('displayYear').innerText = currentYear;
    
    // Update URL without reloading page
    const newUrl = `${window.location.pathname}?season=${currentSeason}&year=${currentYear}`;
    window.history.pushState({}, '', newUrl);
    
    loadSeasonalData();
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    const bar = document.getElementById('loadingProgress');
    
    grid.innerHTML = '<div class="loader">Contacting API...</div>';
    bar.style.width = '30%';

    try {
        const response = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        
        if (response.status === 429) {
            throw new Error("Rate Limited - Waiting for API cool-down");
        }
        
        const { data } = await response.json();
        bar.style.width = '100%';
        renderCards(data);
        setTimeout(() => bar.style.width = '0%', 500);
        
    } catch (err) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">
            <h2 style="color:#ff4d4d;">${err.message}</h2>
            <p>Please wait 5 seconds and click a season again.</p>
        </div>`;
    }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map(anime => {
        const jDay = anime.broadcast?.day || "null";
        const jTime = anime.broadcast?.time || "00:00";
        
        return `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}" loading="lazy">
                    <div class="countdown-timer" data-day="${jDay}" data-time="${jTime}">
                        ${anime.status === 'Currently Airing' ? 'Calculating...' : anime.status}
                    </div>
                </div>
                <div class="info">
                    <span class="studio">${anime.studios[0]?.name || 'TBA'}</span>
                    <h3>${anime.title_english || anime.title}</h3>
                    <div style="font-size:0.8rem; color:var(--text-dim);">
                        ${getESTTime(jDay, jTime)}
                    </div>
                </div>
            </div>`;
    }).join('');
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

function updateTimers() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        if (timer.innerText.includes('Finished') || !timer.dataset.day) return;
        // ... (standard timer logic)
    });
}

init();
