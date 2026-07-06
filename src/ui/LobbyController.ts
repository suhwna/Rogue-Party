export interface LobbyClassDescription {
  label: string;
  role: string;
  summary: string;
  passive: string;
  skills: Array<[string, string]>;
}

export interface LobbyPlayerView {
  id: string;
  name: string;
  icon: string;
  color: string;
  classId: string;
  classLabel: string;
  ready?: boolean;
  bot?: boolean;
  spectator?: boolean;
}

export interface LobbyRoomView {
  hostId?: string;
}

export interface LobbyControllerOptions {
  escapeHtml: (value: unknown) => string;
  getCompactClassSummary: (classId: string) => string;
}

export class LobbyController {
  constructor(private readonly options: LobbyControllerOptions) {}

  renderClassDetail(meta: LobbyClassDescription): string {
    return `
      <div class="lobby-class-detail-head">
        <div>
          <h3>${this.options.escapeHtml(meta.label)}</h3>
          <span>${this.options.escapeHtml(meta.role)}</span>
        </div>
        <strong>스킬 전체 해금</strong>
      </div>
      <p>${this.options.escapeHtml(meta.summary)}</p>
      <p class="lobby-class-passive"><b>패시브</b> ${this.options.escapeHtml(meta.passive)}</p>
      <div class="lobby-skill-tags">
        ${meta.skills.map(([key, name]) => `<span class="lobby-skill-tag"><b>${this.options.escapeHtml(key)}</b>${this.options.escapeHtml(name)}</span>`).join("")}
      </div>
    `;
  }

  renderParty(players: LobbyPlayerView[], room: LobbyRoomView, classDescriptions: Record<string, LobbyClassDescription>): string {
    return players
      .map((player) => {
        const stateText = player.spectator ? "WATCHING" : player.ready ? "READY" : "TESTING";
        const nameSuffix = `${player.id === room.hostId ? " · HOST" : ""}${player.bot ? " · BOT" : ""}${player.spectator ? " · VIEWER" : ""}`;
        const classMeta = classDescriptions[player.classId];
        const detail = player.spectator
          ? "관전자 카메라"
          : player.bot
            ? `자동 전투 · ${classMeta?.role || "직업 테스트"}`
            : classMeta?.role || "모든 스킬 테스트 가능";
        return `
          <div class="lobby-row" style="--member-color:${this.options.escapeHtml(player.color)}">
            <div class="lobby-row-main">
              <div class="avatar" style="background:${this.options.escapeHtml(player.color)}">${this.options.escapeHtml(player.icon)}</div>
              <div>
                <strong>${this.options.escapeHtml(player.name)}${this.options.escapeHtml(nameSuffix)}</strong>
                <small>${this.options.escapeHtml(player.classLabel)} · ${this.options.escapeHtml(detail)}</small>
              </div>
            </div>
            <div class="lobby-state ${player.ready || player.spectator ? "" : "waiting"}">${stateText}</div>
          </div>
        `;
      })
      .join("");
  }
}
