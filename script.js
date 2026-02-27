(() => {
  "use strict";

  const animeSchedule = [
    {
      title: "Jujutsu Kaisen",
      genre: "Action • Supernatural",
      description: "Cursed spirits and modern sorcery.",
      season: "Fall 2026",
      releaseDate: "2026-10-05T00:00:00Z"
    },
    {
      title: "Demon Slayer: New Arc",
      genre: "Action • Adventure",
      description: "The next chapter of Tanjiro's journey.",
      season: "Summer 2026",
      releaseDate: "2026-07-18T00:00:00Z"
    },
    {
      title: "Attack on Titan: Final Movie",
      genre: "Drama • Action",
      description: "The cinematic conclusion.",
      season: "Winter 2026",
      releaseDate: "2026-12-01T00:00:00Z"
    }
  ];

  function formatCountdown(date) {
    const diff = new Date(date).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return "Released";

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000) % 24;
    const minutes = Math.floor(diff / 60000) % 60;

    return `${days}d ${hours}h ${minutes}m`;
  }

  function renderSchedule(container) {
    if (!container) return;

    container.innerHTML = "";

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
            ${anime.genre} • ${anime.season}<br />
            ${anime.description}
          </div>
        </div>

        <div class="actions">
          <button type="button" data-title="${anime.title}">
            🔔 Alert
          </button>
        </div>
      `;

      container.appendChild(row);
    });
  }

  function updateCountdowns(container) {
    if (!container) return;

    const times = container.querySelectorAll(".time");
    times.forEach(el => {
      const index = el.getAttribute("data-index");
      if (animeSchedule[index]) {
        el.textContent = formatCountdown(animeSchedule[index].releaseDate);
      }
    });
  }

  function init() {
    const container = document.getElementById("schedule-list");
    if (!container) return; // 🚨 prevents GitHub crash

    renderSchedule(container);

    container.addEventListener("click", e => {
      const btn = e.target.closest("button");
      if (!btn) return;

      alert(`Alerts enabled for ${btn.dataset.title}`);
    });

    setInterval(() => updateCountdowns(container), 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
