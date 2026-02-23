// Mock Data for Testing
const animeData = [
    {
        id: 1,
        title: "Cyber Neon: 2077",
        genre: ["Sci-Fi", "Action"],
        releaseTime: new Date().getTime() + 500000, 
        description: "A high-octane journey through a digital wasteland.",
        season: "Spring 2026"
    },
    {
        id: 2,
        title: "Spirit Chronicles",
        genre: ["Fantasy", "Slice of Life"],
        releaseTime: new Date().getTime() + 1000000,
        description: "Exploring the hidden shrines of the northern mountains.",
        season: "Spring 2026"
    }
];

function updateCountdowns() {
    const now = new Date().getTime();
    
    animeData.forEach(anime => {
        const distance = anime.releaseTime - now;
        const timerElement = document.getElementById(`timer-${anime.id}`);
        
        if (distance < 0) {
            timerElement.innerHTML = "RELEASED NOW";
            return;
        }

        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        timerElement.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
    });
}

function renderCards() {
    const grid = document.getElementById('anime-grid');
    grid.innerHTML = animeData.map(anime => `
        <div class="anime-card">
            <div class="card-content">
                <h3>${anime.title}</h3>
                <p><small>${anime.season}</small></p>
                <div id="timer-${anime.id}" class="timer">--h --m --s</div>
                <p style="font-size: 0.9rem;">${anime.description}</p>
                <div>
                    ${anime.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                </div>
                <button class="btn-track" onclick="showToast('${anime.title}')">Track Release</button>
            </div>
        </div>
    `).join('');
}

function showToast(title) {
    const toast = document.getElementById('notification-toast');
    toast.innerText = `Alert set for ${title}!`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Initialization
renderCards();
setInterval(updateCountdowns, 1000);
