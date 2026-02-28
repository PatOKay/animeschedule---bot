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
    switchView('calendar', e.target);
    renderCalendar(allAnime);
});

function switchView(view, btn) {
    currentView = view;
    document.querySelectorAll('.view-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const grid = document.getElementById('anime-grid');
    grid.className = view === 'grid' ? 'grid-layout' : 'calendar-layout';
}

// Update the original render function to handle the 'grid-layout' class
function render(list) {
    const grid = document.getElementById('anime-grid');
    if (currentView === 'calendar') { renderCalendar(list); return; }
    
    grid.innerHTML = list.map(anime => {
        const isSaved = watchlist.some(item => item.mal_id === anime.mal_id);
        return `
            <div class="anime-card">
                <button class="save-btn ${isSaved ? 'active' : ''}" onclick="toggleSave(${anime.mal_id})">♥</button>
                <img src="${anime.images.jpg.image_url}" loading="lazy" style="width:100%; height:250px; object-fit:cover;">
                <div style="padding:12px;">
                    <h3>${anime.title}</h3>
                    <p>${anime.broadcast.day || 'Unknown Day'}</p>
                </div>
            </div>`;
    }).join('');
}

// Initial call
init();
