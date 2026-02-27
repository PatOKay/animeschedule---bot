const animeData = [
  {
    title: "Jujutsu Kaisen",
    description: "A dark fantasy anime about cursed spirits and sorcerers.",
    genre: "Action, Supernatural",
    season: "Fall 2026",
    releaseDate: "2026-10-05T00:00:00"
  },
  {
    title: "Demon Slayer: New Arc",
    description: "Tanjiro continues his journey against powerful demons.",
    genre: "Action, Adventure",
    season: "Summer 2026",
    releaseDate: "2026-07-18T00:00:00"
  },
  {
    title: "Attack on Titan: Movie",
    description: "The final cinematic conclusion to the AOT saga.",
    genre: "Drama, Action",
    season: "Winter 2026",
    releaseDate: "2026-12-01T00:00:00"
  }
];

const container = document.getElementById("anime-container");

function calculateCountdown(releaseDate) {
  const now = new Date().getTime();
  const release = new Date(releaseDate).getTime();
  const diff = release - now;

  if (diff <= 0) return "Released 🎉";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  return `${days}d ${hours}h ${minutes}m`;
}

function renderAnime() {
  container.innerHTML = "";

  animeData.forEach((anime, index) => {
    const card = document.createElement("div");
    card.className = "anime-card";

    card.innerHTML = `
      <h2>${anime.title}</h2>
      <p class="genre">${anime.genre}</p>
      <p>${anime.description}</p>
      <p><strong>Season:</strong> ${anime.season}</p>
      <p class="countdown" id="countdown-${index}">
        ${calculateCountdown(anime.releaseDate)}
      </p>
      <button onclick="alertUser('${anime.title}')">
        🔔 Alert Me
      </button>
    `;

    container.appendChild(card);
  });
}

function alertUser(title) {
  alert(`You will be notified when "${title}" is releasing!`);
}

renderAnime();
setInterval(renderAnime, 60000);
