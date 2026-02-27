const animeList = [
  {
    id: 1,
    title: "Attack on Titan – Final Arc",
    genre: "Action / Drama",
    season: "Winter",
    year: 2026,
    release: "2026-03-20T17:00:00"
  },
  {
    id: 2,
    title: "Demon Slayer – Infinity Castle",
    genre: "Action / Supernatural",
    season: "Spring",
    year: 2026,
    release: "2026-04-10T18:00:00"
  },
  {
    id: 3,
    title: "My Hero Academia – Season 8",
    genre: "Action / Shounen",
    season: "Summer",
    year: 2026,
    release: "2026-07-05T16:30:00"
  }
];

const grid = document.getElementById("animeGrid");
const seasonFilter = document.getElementById("seasonFilter");
const followed = JSON.parse(localStorage.getItem("followed")) || [];

if ("Notification" in window) {
  Notification.requestPermission();
}

function render() {
  grid.innerHTML = "";
  const filter = seasonFilter.value;

  animeList
    .filter(a => filter === "all" || a.season === filter)
    .forEach(anime => {
      const card = document.createElement("div");
      card.className = "card";

      const isFollowing = followed.includes(anime.id);

      card.innerHTML = `
        <h2>${anime.title}</h2>
        <div class="meta">${anime.genre}</div>
        <div class="meta">${anime.season} ${anime.year}</div>
        <div class="countdown" id="cd-${anime.id}"></div>
        <button class="${isFollowing ? "active" : ""}">
          ${isFollowing ? "Following" : "Follow"}
        </button>
      `;

      card.querySelector("button").onclick = () =>
        toggleFollow(anime.id);

      grid.appendChild(card);
      startCountdown(anime);
    });
}

function toggleFollow(id) {
  const i = followed.indexOf(id);
  i === -1 ? followed.push(id) : followed.splice(i, 1);
  localStorage.setItem("followed", JSON.stringify(followed));
  render();
}

function startCountdown(anime) {
  const el = document.getElementById(`cd-${anime.id}`);

  function tick() {
    const diff = new Date(anime.release) - new Date();
    if (diff <= 0) {
      el.textContent = "Now Airing";
      notify(anime);
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;

    el.textContent = `${d}d ${h}h ${m}m`;
  }

  tick();
  setInterval(tick, 60000);
}

function notify(anime) {
  if (
    followed.includes(anime.id) &&
    Notification.permission === "granted"
  ) {
    new Notification("Anime Release Alert", {
      body: `${anime.title} is now available`
    });
  }
}

seasonFilter.addEventListener("change", render);
render();
