// ... Previous state variables remain ...
let currentView = 'grid'; 

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 1. Grouping Logic
function renderCalendar(list) {
    const grid = document.getElementById('anime-grid');
    grid.className = 'calendar-layout';
    grid.innerHTML = '';

    DAYS.forEach(day => {let currentYear = 2026;
let currentSeason = 'spring';
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    const params = new URLSearchParams(window.location.search);
    currentYear = parseInt(params.get('year')) || 2026;
    currentSeason = params.get('season') || 'spring';
    
    document.getElementById('displayYear').innerText = currentYear;
    document.getElementById('seasonPicker').value = currentSeason;
    
    await loadSeasonalData();
    // This ensures the timer starts immediately and repeats every second
    updateTimers(); 
    setInterval(updateTimers, 1000);
}

// ... (keep your changeYear and updateSeason functions here)

function updateTimers() {
    // Get current time in EST
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));

    document.querySelectorAll('.countdown-timer').forEach(timer => {
        const day = timer.dataset.day;
        const time = timer.dataset.time;

        // Skip if there's no schedule data
        if (!day || day === "null" || !time || time === "00:00") {
            timer.innerText = "Schedule TBA";
            return;
        }

        const nextAir = getNextAirEST(day, time);
        const diff = nextAir - now;

        if (diff <= 0 && diff > -3600000) {
            timer.innerText = "AIRING NOW";
            timer.style.color = "#00ffcc";
        } else {
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            // Fixed formatting to prevent "Calculating..." loop
            timer.innerText = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
            timer.style.color = "#00ffcc";
        }
    });
}

function getNextAirEST(jDay, jTime) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const [h, m] = jTime.split(':').map(Number);
    
    // Convert JST to EST (-14 hours)
    let estH = h - 14;
    let targetD = (days.indexOf(jDay) - (h - 14 < 0 ? 1 : 0) + 7) % 7;
    
    const nowEST = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    let dWait = (targetD - nowEST.getDay() + 7) % 7;
    
    // If it's today but the time has passed, move to next week
    if (dWait === 0 && (nowEST.getHours() > (estH < 0 ? estH + 24 : estH))) {
        dWait = 7;
    }
    
    const next = new Date(nowEST);
    next.setDate(nowEST.getDate() + dWait);
    next.setHours(estH < 0 ? estH + 24 : estH, m, 0, 0);
    return next;
}

init();
