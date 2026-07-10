export interface HudSnapshot {
  roomCode: string;
  stageLabel: string;
  connectionLabel: string;
}

export interface HudRoomState {
  code?: string;
  status?: string;
  chapter?: number;
  floor?: number;
  wave?: number;
  objective?: { label?: string };
  stage?: { label?: string };
  waveTrait?: { name?: string };
  survival?: {
    active?: boolean;
    elapsed?: number;
    duration?: number;
    bossActive?: boolean;
    executionPending?: boolean;
    executionBossActive?: boolean;
  } | null;
}

export interface HudGameState {
  room?: HudRoomState;
}

export function formatStageLabel(state: HudGameState): string {
  const room = state.room ?? {};
  const chapter = room.chapter ?? room.floor ?? 1;
  const wave = room.wave ?? 1;
  const stageName = room.objective?.label ?? room.stage?.label ?? room.waveTrait?.name ?? "";

  if (room.status === "lobby") return "LOBBY";
  if (room.survival?.active) {
    const elapsed = Math.max(0, Math.min(room.survival.duration ?? 540, Math.floor(room.survival.elapsed ?? 0)));
    const minutes = Math.floor(elapsed / 60);
    const seconds = String(elapsed % 60).padStart(2, "0");
    const phase = room.survival.executionBossActive
      ? "FATE EXECUTION"
      : room.survival.executionPending
        ? "SURVIVAL COMPLETE"
        : room.survival.bossActive
          ? stageName || "BOSS"
          : stageName || "SURVIVE";
    return `CH ${chapter} · ${minutes}:${seconds} / 9:00 · ${phase}`;
  }
  if (room.status === "map") return `CH ${chapter} · MAP`;
  if (room.status === "advancement") return `STAGE ${wave} · LEVEL UP`;
  if (room.status === "combat" || room.status === "choice") {
    return `CH ${chapter} · STAGE ${wave} · ${stageName || "NORMAL"}`;
  }
  return `CH ${chapter} · STAGE ${wave}${room.waveTrait ? ` · ${room.waveTrait.name}` : ""}`;
}

export class HudController {
  constructor(
    private readonly roomCodeEl: HTMLElement | null,
    private readonly stageEl: HTMLElement | null,
    private readonly connectionEl: HTMLElement | null,
  ) {}

  setConnection(label: string): void {
    if (this.connectionEl) this.connectionEl.textContent = label;
  }

  renderTop(state: HudGameState): void {
    if (this.roomCodeEl) this.roomCodeEl.textContent = state.room?.code ?? "----";
    if (this.stageEl) this.stageEl.textContent = formatStageLabel(state);
  }

  render(snapshot: HudSnapshot): void {
    if (this.roomCodeEl) this.roomCodeEl.textContent = snapshot.roomCode;
    if (this.stageEl) this.stageEl.textContent = snapshot.stageLabel;
    if (this.connectionEl) this.connectionEl.textContent = snapshot.connectionLabel;
  }
}
