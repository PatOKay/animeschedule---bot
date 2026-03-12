let currentYear = 2026, currentSeason = 'spring', currentData = [], watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    document.getElementById('filterBtn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById("filterMenu").classList.toggle("show");
    };
    window.onclick = () => document.getElementById("filterMenu").classList.remove("show");
    document.querySelector('.close-modal').onclick = () => document.getElementById('animeModal').style.display = "none";
    
    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const json = await res.json();
        currentData = json.data;
        renderCards(currentData);
    } catch (e) { grid.innerHTML = "API Error. Please refresh."; }
}

function renderCards(data) {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = data.map((anime, i) => `
        <div class="anime-card" onclick="showDetails(${i})">
            <img class="poster" src="${anime.images.jpg.large_image_url}">
            <div class="countdown-timer" data-status="${anime.status}" data-premiere="${anime.aired.from}" data-day="${anime.broadcast.day}" data-time="${anime.broadcast.time}">
                Calculating...
            </div>
            <div style="padding:10px;">
                <h4 style="margin:0; font-size:0.9rem;">${anime.title_english || anime.title}</h4>
            </div>
        </div>
    `).join('');
}

async function showDetails(i) {
    const anime = currentData[i];
    const body = document.getElementById('modalBody');
    document.getElementById('animeModal').style.display = "block";
    
    // Trailer Logic: Use API video or Fallback to YouTube search link
    const ytId = anime.trailer?.youtube_id;
    const trailerHtml = ytId ? 
        `<div class="video-container"><iframe src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>` :
        `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title)}+trailer" target="_blank" style="display:block; margin-top:15px; background:#ff0000; color:white; text-align:center; padding:10px; border-radius:5px; text-decoration:none;">📺 Search Trailer on YouTube</a>`;

    body.innerHTML = `
        <div style="display:flex; gap:20px;">
            <img src="${anime.images.jpg.image_url}" style="width:150px; border-radius:5px;">
            <div>
                <h2 style="margin:0; color:#3db4f2;">${anime.title}</h2>
                <p style="font-size:0.8rem; color:#aaa;">${anime.status} | Score: ${anime.score || 'N/A'}</p>
                <p style="font-size:0.9rem; max-height:100px; overflow-y:auto;">${anime.synopsis || 'No synopsis available.'}</p>
                ${trailerHtml}
            </div>
        </div>
    `;
}

function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.countdown-timer').forEach(el => {
        if (el.dataset.status === "Finished Airing") {
            el.innerText = "COMPLETED";
            el.style.color = "#888";
            return;
        }
        
        // Correcting for Premiere Dates (LiveChart Match)
        const premiere = new Date(el.dataset.premiere);
        const target = (premiere > now) ? premiere : getNextAirEST(el.dataset.day, el.dataset.time);
        const diff = target - now;

        if (diff < 0) { el.innerText = "AIRING NOW"; }
        else {
            const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
            el.innerText = `${d}d ${h}h ${m}m`;
        }
    });
}

function getNextAirEST(day, time) {
    const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
    const targetDay = days.indexOf(day);
    const now = new Date();
    let res = new Date(now);
    res.setDate(now.getDate() + (targetDay + 7 - now.getDay()) % 7);
    return res;
}

function sortData(type) {
    if (type === 'pop') currentData.sort((a,b) => b.members - a.members);
    if (type === 'score') currentData.sort((a,b) => b.score - a.score);
    if (type === 'alpha') currentData.sort((a,b) => (a.title_english || a.title).localeCompare(b.title_english || b.title));
    renderCards(currentData);
}

function updateWatchlistCount() { document.getElementById('wCount').innerText = watchlist.length; }
function updateSeason() { currentSeason = document.getElementById('seasonPicker').value; loadSeasonalData(); }
function changeYear(n) { currentYear += n; document.getElementById('displayYear').innerText = currentYear; loadSeasonalData(); }

init();
