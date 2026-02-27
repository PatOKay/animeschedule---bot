// Mock Data - In a production app, this would come from an API like Jikan (MyAnimeList)
const animeData = [
    {
        id: 1,
        title: "Cyberpunk: Edgerunners S2",
        genre: ["Sci-Fi", "Action"],
        releaseDate: new Date().getTime() + 500000, // Roughly 8 mins from now
        description: "A high-stakes journey through Night City.",
        season: "Spring 2026"
    },
    {
        id: 2,
        title: "Fantasy World Solo",
        genre: ["Adventure", "Fantasy"],
        releaseDate: new Date().getTime() + 100000000, 
        description: "Exploring the depths of unknown dungeons.",
        season: "Spring 2026"
    }
];

function init() {
    renderCards();
    setInterval(updateCountdowns, 1000);
}

function renderCards() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = animeData.map(anime => `
        <div class="anime-card" id="anime-${anime.id}">
            <h3>${anime.title}</h3>
            <p style="font-size: 0.8rem; color: #c5c6c7;">${anime.season}</p>
            <div class="genres">
                ${anime.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>
            <p class="description">${anime.description}</p>
            <div class="countdown" data-time="${anime.releaseDate}">00:00:00</div>
            <button class="notify-btn" onclick="toggleNotify(${anime.id})">🔔 Remind Me</button>
        </div>
    `).join('');
}

function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        const target = parseInt(el.getAttribute('data-time'));
        const now = new Date().getTime();
        const diff = target - now;

        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            el.innerText = `${hours}h ${mins}m ${secs}s`;
        } else {
            el.innerText = "RELEASED NOW";
            el.style.color = "#ff4d4d";
        }
    });
}

function toggleNotify(id) {
    const btn = document.querySelector(`#anime-${id} .notify-btn`);
    const isSubscribed = btn.classList.toggle('active');
    btn.innerText = isSubscribed ? "✅ Alert Set" : "🔔 Remind Me";
    
    // Low latency storage
    localStorage.setItem(`notify-${id}`, isSubscribed);
}

init();
