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
          (player) => {
            const stats = player.combatStats || {};
            const statusDamage = Number(stats.poisonDamage || 0) + Number(stats.burnDamage || 0);
            const specialty = Number(stats.turretKills || 0) > 0
              ? ["터렛", Number(stats.turretKills || 0).toLocaleString()]
              : ["보스", Number(stats.bossKills || 0).toLocaleString()];
            return `
            <article class="result-player ${player.downed ? "downed" : ""}">
              <div class="result-player-main">
                <div>
                  <strong>${player.title ? `<span class="player-title">[${escapeHtml(player.title)}]</span> ` : ""}${escapeHtml(player.name)}</strong>
                  <span>${escapeHtml(player.classLabel || "모험가")} · Lv.${player.level || 1} · 유물 ${escapeHtml(formatRelicCount(player))}</span>
                </div>
                <em>${player.downed ? "전투불능" : `${Number(player.score || 0).toLocaleString()}점`}</em>
              </div>
              <div class="result-player-metrics">
                <span><small>피해</small><b>${compactNumber(stats.damage)}</b></span>
                <span><small>처치</small><b>${Number(stats.kills || 0).toLocaleString()}</b></span>
                <span><small>상태 피해</small><b>${compactNumber(statusDamage)}</b></span>
                <span><small>${specialty[0]}</small><b>${specialty[1]}</b></span>
              </div>
            </article>
          `;
          }
        )
        .join("");
    }

    function compactNumber(value) {
      const number = Math.max(0, Number(value || 0));
      if (number >= 1000000) return `${Math.round(number / 100000) / 10}M`;
      if (number >= 1000) return `${Math.round(number / 100) / 10}K`;
      return Math.round(number).toLocaleString();
    }

    return {
      renderStats,
      renderPlayers
    };
  }

  window.RogueResultController = Object.freeze({ create });
})();
