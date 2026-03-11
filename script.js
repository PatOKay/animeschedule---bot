let currentYear = 2026;
let currentSeason = 'spring';
let searchTimeout;
let currentData = [];
let watchlist = JSON.parse(localStorage.getItem('myWatchlist')) || [];

async function init() {
    updateWatchlistCount();
    
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
    
    window.onscroll = () => {
        const btn = document.getElementById("snapTop");
        btn.style.display = (window.scrollY > 300) ? "block" : "none";
    };

    document.querySelector('.close-modal').onclick = closeModal;
    await loadSeasonalData();
    setInterval(updateTimers, 1000);
}

async function loadSeasonalData() {
    const grid = document.getElementById('anime-grid');
    document.getElementById('viewTitle').innerText = `${currentSeason.toUpperCase()} ${currentYear}`;
    grid.innerHTML = '<div class="loader">Fetching accurate schedules...</div>';
    try {
        const res = await fetch(`https://api.jikan.moe/v4/seasons/${currentYear}/${currentSeason}`);
        const { data } = await res.json();
        currentData = data;
        renderCards(data);
    } catch (e) { grid.innerHTML = "API Timeout. Please refresh."; }
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
                         Initializing...
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

async function showDetails(index) {
    const anime = currentData[index];
    const isAdded = watchlist.some(item => item.mal_id === anime.mal_id);
    const body = document.getElementById('modalBody');
    document.getElementById('animeModal').style.display = "block";
    
    // Fallback: If API trailer is missing, we create a YouTube search link
    const searchQuery = encodeURIComponent(`${anime.title_english || anime.title} official trailer`);
    const trailerHtml = anime.trailer?.youtube_id 
        ? `<div class="video-container"><iframe src="https://www.youtube.com/embed/${anime.trailer.youtube_id}" allowfullscreen></iframe></div>`
        : `<div style="margin-top:20px; text-align:center;">
             <a href="https://www.youtube.com/results?search_query=${searchQuery}" target="_blank" style="text-decoration:none;">
                <div style="background:#ff0000; color:white; padding:15px; border-radius:8px; font-weight:bold;">
                   📺 Watch Trailer on YouTube
                </div>
             </a>
             <p style="color:#777; font-size:0.8rem; margin-top:5px;">(Direct link search used as fallback)</p>
           </div>`;

    body.innerHTML = `
        <div style="display:flex; gap:25px; flex-wrap:wrap;">
            <img src="${anime.images.jpg.large_image_url}" style="width:230px; border-radius:10px;">
            <div style="flex:1; min-width:300px;">
                <div style="display:flex; justify-content:space-between;">
                    <h2 style="color:var(--accent); margin:0;">${anime.title_english || anime.title}</h2>
                    <button class="heart-btn ${isAdded ? 'active' : ''}" onclick="toggleHeart(event, ${index})">❤</button>
                </div>
                <p>⭐ ${anime.score || 'N/A'} | ${anime.type} | ${anime.status}</p>
                <div style="background:#252729; padding:15px; border-radius:8px; font-size:0.9rem; max-height:150px; overflow-y:auto;">
                    ${anime.synopsis || 'No description available.'}
                </div>
                ${trailerHtml}
                <div id="characterSection" style="margin-top:20px; color:var(--accent); font-weight:bold;">Loading Characters...</div>
            </div>
        </div>
    `;
    fetchCharacters(anime.mal_id);
}

async function fetchCharacters(id) {
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/characters`);
        const { data } = await res.json();
        const mainChars = data.slice(0, 5);
        document.getElementById('characterSection').innerHTML = `
            <p>Main Characters:</p>
            <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:10px;">
                ${mainChars.map(c => `
                    <div style="text-align:center; min-width:70px;">
                        <img src="${c.character.images.jpg.image_url}" style="width:60px; height:60px; border-radius:50%; object-fit:cover; border:2px solid #3db4f2;">
                        <p style="font-size:0.6rem; color:white; margin:5px 0;">${c.character.name}</p>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (e) { document.getElementById('characterSection').innerText = ""; }
}

function updateTimers() {
    const now = new Date();
    document.querySelectorAll('.countdown-timer').forEach(timer => {
        if (timer.dataset.status === "Finished Airing") {
            timer.innerText = "COMPLETED";
            timer.style.color = "#aaa";
            return;
        }

        const premiereDate = timer.dataset.premiere ? new Date(timer.dataset.premiere) : null;
        let targetDate;

        // Logic fix: If the show hasn't premiered yet, countdown to premiere
        if (premiereDate && premiereDate > now) {
            targetDate = premiereDate;
        } else {
            // Otherwise, use the weekly broadcast logic
            const day = timer.dataset.day;
            const time = timer.dataset.time;
            if (!day || day === "null") { timer.innerText = "Schedule TBA"; return; }
            targetDate = getNextAirEST(day, time);
        }

        const diff = targetDate - now;
        
        if (diff <= 0 && diff > -3600000) { 
            timer.innerText = "AIRING NOW"; 
            timer.style.color = "#ff4d4d"; 
        } else if (diff < -3600000) {
            timer.innerText = "Check Catchup";
            timer.style.color = "#3db4f2";
        } else {
            const d = Math.floor(diff / 86400000); 
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000); 
            const s = Math.floor((diff % 60000) / 1000);
            timer.innerText = `${d}d ${h}h ${m}m ${s}s`;
            timer.style.color = "#00ffcc";
        }
    });
}

// ... (keep toggleHeart, toggleWatchlistView, getNextAirEST, getESTTime, updateSeason/Year from previous version)
