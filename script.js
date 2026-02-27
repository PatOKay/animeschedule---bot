const grid = document.getElementById("animeGrid");
const seasonFilter = document.getElementById("seasonFilter");
const followed = JSON.parse(localStorage.getItem("followed")) || [];

const API_URL = "https://graphql.anilist.co";

const query = `
query ($season: MediaSeason, $seasonYear: Int) {
  Page(perPage: 25) {
    media(
      type: ANIME
      status: RELEASING
      season: $season
      seasonYear: $seasonYear
    ) {
      id
      title {
        romaji
      }
      description
      genres
      season
      seasonYear
      nextAiringEpisode {
        episode
        airingAt
      }
    }
  }
}
`;

async function fetchAnime(season) {
  const variables = {
    season: season === "all" ? null : season.toUpperCase(),
    seasonYear: new Date().getFullYear()
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  render(data.data.Page.media);
}

function render(animeList) {
  grid.innerHTML = "";

  animeList.forEach(anime => {
    if (!anime.nextAiringEpisode) return;

    const isFollowing = followed.includes(anime.id);
    const airTime = anime.nextAiringEpisode.airingAt * 1000;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${anime.title.romaji}</h2>
      <div class="meta">${anime.genres.join(", ")}</div>
      <div class="meta">${anime.season} ${anime.seasonYear}</div>
      <div class="countdown" id="cd-${anime.id}"></div>
      <div class="meta">Episode ${anime.nextAiringEpisode.episode}</div>
      <button class="${isFollowing ? "active" : ""}">
        ${isFollowing ? "Following" : "Follow"}
      </button>
    `;

    card.querySelector("button").onclick = () =>
      toggleFollow(anime.id);

    grid.appendChild(card);
    startCountdown(anime.id, airTime, anime.title.romaji);
  });
}

function toggleFollow(id) {
  const index = followed.indexOf(id);
  index === -1 ? followed.push(id) : followed.splice(index, 1);
  localStorage.setItem("followed", JSON.stringify(followed));
  fetchAnime(seasonFilter.value);
}

function startCountdown(id, airTime, title) {
  const el = document.getElementById(`cd-${id}`);

  function tick() {
    const diff = airTime - Date.now();
    if (diff <= 0) {
      el.textContent = "Now Airing!";
      notify(title);
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

function notify(title) {
  if (Notification.permission === "granted") {
    new Notification("Anime Episode Released", {
      body: `${title} has a new episode out!`
    });
  }
}

seasonFilter.addEventListener("change", e => {
  fetchAnime(e.target.value);
});

if ("Notification" in window) {
  Notification.requestPermission();
}

fetchAnime("all");
