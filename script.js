const animeData = [
  {
    id: 1,
    title: "Attack on Titan: Final Chapters",
    description: "The conclusion to humanity’s war against the Titans.",
    genre: "Action, Drama, Fantasy",
    season: "Winter 2026",
    releaseDate: "2026-03-20T17:00:00"
  },
  {
    id: 2,
    title: "Demon Slayer: Infinity Castle",
    description: "The final arc begins as Tanjiro faces Muzan.",
    genre: "Action, Supernatural",
    season: "Spring 2026",
    releaseDate: "2026-04-10T18:00:00"
  },
  {
    id: 3,
    title: "My Hero Academia Season 8",
    description: "Heroes and villains clash in the final war.",
    genre: "Action, Superhero",
    season: "Summer 2026",
    releaseDate: "2026-07-05T16:30:00"
  }
];

const container = document.getElementById("anime-container");
const followed = JSON.parse(localStorage.getItem("followedAnime")) || [];

if ("Notification" in window) {
  Notification.requestPermission();
}

function renderAnime() {
  container.innerHTML = "";

  animeData.forEach(anime => {
    const card = document.createElement("div");
    card.className = "anime-card";

    const isFollowing = followed.includes(anime.id);

    card.innerHTML = `
      <div class="anime-title">${anime.title}</div>
      <div class="anime-meta">${anime.genre}</div>
      <div class="anime-meta">${anime.season}</div>
      <p>${anime.description}</p>
      <div class="countdown" id="countdown-${anime.id}"></div>
      <button class="${isFollowing ? "following" : ""}">
        ${isFollowing ? "Following" : "Follow"}
      </button>
    `;

    const button = card.querySelector("button");
    button.addEventListener("click", () => toggleFollow(anime.id, button));

    container.appendChild(card);
    updateCountdown(anime);
  });
}

function toggleFollow(id, button) {
  const index = followed.indexOf(id);

  if (index === -1) {
    followed.push(id);
    button.textContent = "Following";
    button.classList.add("following");
  } else {
    followed.splice(index, 1);
    button.textContent = "Follow";
    button.classList.remove("following");
  }

  localStorage.setItem("followedAnime", JSON.stringify(followed));
}

function updateCountdown(anime) {
  const countdownEl = document.getElementById(`countdown-${anime.id}`);

  function tick() {
    const now = new Date();
    const release = new Date(anime.releaseDate);
    const diff = release - now;

    if (diff <= 0) {
      countdownEl.textContent = "Now Available!";
      notifyUser(anime);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    countdownEl.textContent = `${days}d ${hours}h ${minutes}m`;
  }

  tick();
  setInterval(tick, 60000);
}

function notifyUser(anime) {
  if (
    followed.includes(anime.id) &&
    Notification.permission === "granted"
  ) {
    new Notification("Anime Released!", {
      body: `${anime.title} is now available to watch!`
    });
  }
}

renderAnime();
