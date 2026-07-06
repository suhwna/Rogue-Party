(function () {
  function defaultEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function create(options) {
    const escapeHtml = (options && options.escapeHtml) || defaultEscape;
    const formatRelicCount = (options && options.formatRelicCount) || ((source) => String(source?.relicCount || 0));

    function renderStats(rows) {
      return (rows || [])
        .map(
          ([label, value]) => `
            <div class="result-stat">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `
        )
        .join("");
    }

    function renderPlayers(players) {
      return (players || [])
        .map(
          (player) => `
            <div class="result-player ${player.downed ? "downed" : ""}">
              <div>
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(player.classLabel || "모험가")} · Lv.${player.level || 1} · 유물 ${escapeHtml(
                  formatRelicCount(player)
                )}</span>
              </div>
              <em>${player.downed ? "전투불능" : `${player.score || 0}점`}</em>
            </div>
          `
        )
        .join("");
    }

    return {
      renderStats,
      renderPlayers
    };
  }

  window.RogueResultController = Object.freeze({ create });
})();
