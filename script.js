// ... Previous state variables remain ...
let currentView = 'grid'; 

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 1. Grouping Logic
function renderCalendar(list) {
    const grid = document.getElementById('anime-grid');
    grid.className = 'calendar-layout';
    grid.innerHTML = '';

    DAYS.forEach(day => {
        const dayAnime = list.filter(a => a.broadcast.day === day);
        const column = document.createElement('div');
        column.className = 'day-column';
        column.innerHTML = `<h4>${day}</h4>`;
        
        dayAnime.forEach(anime => {
            column.innerHTML += `
                <div class="anime-card">
                    <div style="padding:8px;">
                        <strong style="display:block; margin-bottom:4px;">${anime.title}</strong>
                        <span style="color:var(--accent)">${anime.broadcast.time || 'TBA'}</span>
                    </div>
                </div>
            `;
        });
        grid.appendChild(column);
    });
}

// 2. View Switching Logic
document.getElementById('setGridView').addEventListener('click', (e) => {
    switchView('grid', e.target);
    render(allAnime);
});

document.getElementById('setCalendarView').addEventListener('click', (e) => {
    switchView('calendar', e.target);let allAnime = [];
let watchlist = [];

async function init() {
    const res = await fetch('https://api.jikan.moe/v4/seasons/now');
    const json = await res.json();
    allAnime = json.data;
    renderGrid(allAnime);
}

function renderGrid(data) {
    const container = document.getElementById('anime-grid');
    container.className = 'grid-layout';
    container.innerHTML = data.map(anime => `
        <div class="anime-card">
            <img class="poster" src="${anime.images.jpg.image_url}">
            <div class="info">
                <h3>${anime.title}</h3>
                <p style="color:var(--accent)">${anime.broadcast.string || 'TBA'}</p>
                <button onclick="toggleSave(${anime.mal_id})">Add to Watchlist</button>
            </div>
        </div>
    `).join('');
}

// Simple Theme Switcher
document.getElementById('themeToggle').onclick = () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
};

init();
