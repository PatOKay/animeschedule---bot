document.addEventListener("DOMContentLoaded", () => {

  const animeSchedule = [
    {
      title: "Jujutsu Kaisen",
      genre: "Action • Supernatural",
      description: "Cursed spirits and modern sorcery.",
      season: "Fall 2026",
      releaseDate: "2026-10-05T00:00:00"
    },
    {
      title: "Demon Slayer: New Arc",
      genre: "Action • Adventure",
      description: "The next chapter of Tanjiro's journey.",
      season: "Summer 2026",
      releaseDate: "2026-07-18T00:00:00"
    },
    {
      title: "Attack on Titan: Final Movie",
      genre: "Drama • Action",
      description: "The cinematic conclusion.",
      season: "Winter 2026",
      releaseDate: "2026-12-01T00:00:00"
    }
  ];

  const list = document.getElementById("schedule-list");

  function formatCountdown(date) {
    const diff = new Date(date) - Date.now();
    if (diff <= 0) return "Released";

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000) % 24;
    const m = Math.floor(diff / 60000) % 60;

    return `${d}d ${h}h ${m}m`;
  }

  function renderSchedule() {
    list.innerHTML = "";

    animeSchedule.forEach((anime, index) => {
      const row = document.createElement("div");
      row.className = "schedule-row";

      row.innerHTML = `
        <div class="time" data-index="${index}">
          ${formatCountdown(anime.releaseDate)}
        </div>

        <div>
          <div class="title">${anime.title}</div>
          <div class="meta">
            ${anime.genre} • ${anime.season}<br/>
            ${anime.description}
          </div>
        </div>

        <div class="actions">
          <button data-title="${anime.title}">
            🔔 Alert
          </button>
        </div>
      `;

      list.appendChild(row);
    });
  }

  function updateTimers() {
    document.querySelectorAll(".time").forEach(el => {
      const index = el.dataset.index;
      el.textContent = formatCountdown(animeSchedule[index].releaseDate);
    });
  }

  list.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") {
      alert(`Alerts enabled for ${e.target.dataset.title}`);
    }
  });

  renderSchedule();
  setInterval(updateTimers, 60000);
});
