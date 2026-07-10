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
    const getCompactClassSummary =
      (options && options.getCompactClassSummary) || (() => "대기방에서 모든 스킬을 테스트할 수 있습니다.");

    function applyClassCards(cards, self, classDescriptions) {
      (cards || []).forEach((card) => {
        const classId = card.dataset.class || "";
        const meta = classDescriptions[classId];
        card.classList.toggle("selected", Boolean(self && classId === self.classId));
        card.disabled = false;
        if (!meta) return;
        const strong = card.querySelector("strong");
        const role = card.querySelector("em");
        const summary = card.querySelector("span");
        if (strong) strong.textContent = meta.label;
        if (role) role.textContent = String(meta.role || "").split("/")[0].trim();
        if (summary) summary.textContent = getCompactClassSummary(classId);
        card.title = `${meta.label} - ${meta.role}\n${meta.summary}`;
      });
    }

    function renderClassDetail(meta) {
      if (!meta) return "";
      return `
        <div class="lobby-class-detail-head">
          <div>
            <h3>${escapeHtml(meta.label)}</h3>
            <span>${escapeHtml(meta.role)}</span>
          </div>
          <strong>대기방 전체 스킬 해금</strong>
        </div>
        <p>${escapeHtml(meta.summary)}</p>
        <div class="lobby-skill-tags">
          ${(meta.skills || [])
            .map(
              ([key, name, detail]) =>
                `<span class="lobby-skill-tag"><b>${escapeHtml(key)}</b><span><strong>${escapeHtml(name)}</strong>${
                  detail ? `<small>${escapeHtml(detail)}</small>` : ""
                }</span></span>`
            )
            .join("")}
        </div>
      `;
    }

    function renderParty(players, room, classDescriptions) {
      return (players || [])
        .map((player) => {
          const stateText = player.spectator ? "관전" : player.ready ? "준비 완료" : "테스트 중";
          const nameSuffix = `${player.id === room.hostId ? " · HOST" : ""}${player.bot ? " · BOT" : ""}${
            player.spectator ? " · VIEWER" : ""
          }`;
          const classMeta = classDescriptions[player.classId];
          const detail = player.spectator
            ? "관전자 카메라"
            : player.bot
              ? `자동 전투 · ${classMeta?.role || "직업 테스트"}`
              : classMeta?.role || "모든 스킬 테스트 가능";
          return `
            <div class="lobby-row" style="--member-color:${escapeHtml(player.color)}">
              <div class="lobby-row-main">
                <div class="avatar" style="background:${escapeHtml(player.color)}">${escapeHtml(player.icon)}</div>
                <div>
                  <strong>${escapeHtml(player.name)}${escapeHtml(nameSuffix)}</strong>
                  <small>${escapeHtml(player.classLabel)} · ${escapeHtml(detail)}</small>
                </div>
              </div>
              <div class="lobby-state ${player.ready || player.spectator ? "" : "waiting"}">${stateText}</div>
            </div>
          `;
        })
        .join("");
    }

    return {
      applyClassCards,
      renderClassDetail,
      renderParty
    };
  }

  window.RogueLobbyController = Object.freeze({ create });
})();
