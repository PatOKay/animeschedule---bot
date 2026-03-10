let currentYear = 2026;
let currentSeason = 'spring';

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'spring';
    
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    // Activate search engine
    document.getElementById('animeSearch').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll('.anime-card').forEach(card => {
            const title = card.querySelector('h3').innerText.toLowerCase();
            card.style.display = title.includes(term) ? "block" : "none";
        });
    });

    await loadData();
    setInterval(updateTimers, 1000);
}

async function loadData() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = '<div class="loader">Loading...</div>';
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await res.json();
        grid.innerHTML = data.map(anime => `
            <div class="anime-card">
                <div class="poster-container">
                    <img class="poster" src="${anime.images.jpg.large_image_url}">
                    <div class="countdown-timer" data-day="${anime.broadcast?.day}" data-time="${anime.broadcast?.time}">Calculating...</div>
                </div>
                <div class="info">
                    <h3>${anime.title_english || anime.title}</h3>
                </div>
            </div>`).join('');
    } catch (e) {
        grid.innerHTML = "API Error. Please refresh.";
    }
}

function updateTimers() {
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        // Simple logic to replace "Calculating..." with a time string
        timer.innerText = "Active"; 
    });
}

function changeYear(n) { currentYear += n; updateSeason(); }
function updateSeason() {
    currentSeason = document.getElementById('seasonPicker').value;
    window.history.pushState({}, '', `?season=${currentSeason}&year=${currentYear}`);
    loadData();
}

init();
