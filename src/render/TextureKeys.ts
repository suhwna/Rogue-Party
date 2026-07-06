export interface BossTextureSource {
  bossPhase?: number;
  bossId?: string;
  bossPattern?: string;
}

export interface BossTextureInfo {
  id: string;
  phase: number;
  frame: number;
  key: string;
}

export interface ProjectileTextureSource {
  style?: string;
  classId?: string;
  hostile?: boolean;
}

function safeText(value: unknown, fallback: string): string {
  const text = String(value || fallback).trim();
  return text || fallback;
}

function safeNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function actorTextureKey(classId: string | undefined, frame: number, state: string | undefined): string {
  return `actor:${safeText(classId, "warrior")}:${Math.max(0, Math.floor(safeNumber(frame, 0)))}:${safeText(state, "idle")}`;
}

export function enemyTextureKey(type: string | undefined, frame: number): string {
  return `enemy:${safeText(type, "slime")}:${Math.max(0, Math.floor(safeNumber(frame, 0)))}`;
}

export function bossTextureInfo(enemy: BossTextureSource | undefined, now: number): BossTextureInfo {
  const phase = Math.max(1, Math.floor(safeNumber(enemy?.bossPhase, 1)));
  const id = safeText(enemy?.bossId || enemy?.bossPattern, "boss");
  const frame = Math.floor(safeNumber(now, 0) / 220) % 3;
  return {
    id,
    phase,
    frame,
    key: `boss:${id}:${phase}:${frame}`,
  };
}

export function projectileStyle(projectile: ProjectileTextureSource | undefined): string {
  return safeText(projectile?.style || projectile?.classId || (projectile?.hostile ? "hostile" : "bolt"), "bolt");
}

export function projectileTextureKey(projectile: ProjectileTextureSource | undefined): string {
  return `projectile:${projectileStyle(projectile)}`;
}

export function projectileColor(style: string | undefined): string {
  const text = String(style || "").toLowerCase();
  if (text.includes("fire") || text.includes("meteor") || text.includes("mortar") || text.includes("bomb")) return "#f97316";
  if (text.includes("poison") || text.includes("venom") || text.includes("acid")) return "#bef264";
  if (text.includes("arrow") || text.includes("ranger") || text.includes("sniper") || text.includes("shuriken")) return "#f1d08b";
  if (text.includes("electric") || text.includes("chain") || text.includes("shock") || text.includes("rail")) return "#9ee6ff";
  if (text.includes("thread") || text.includes("puppet")) return "#f5d0fe";
  if (text.includes("shadow") || text.includes("assassin")) return "#c4b5fd";
  if (text.includes("hostile")) return "#f87171";
  return "#dbeafe";
}

export function floorTileKey(chapter: number, variant: number): string {
  return `floor-tile-${Math.max(1, Math.floor(safeNumber(chapter, 1)))}-${Math.max(0, Math.floor(safeNumber(variant, 0)))}`;
}

export function legacyFloorTileKey(variant: number): string {
  return `floor-tile-${Math.max(0, Math.floor(safeNumber(variant, 0)))}`;
}

export function wallBlockKey(chapter: number): string {
  return `wall-block-${Math.max(1, Math.floor(safeNumber(chapter, 1)))}`;
}
