export interface EnemyView {
  id: string | number;
  type?: string;
  x?: number;
  y?: number;
  radius: number;
  hp: number;
  maxHp: number;
  windup?: { x?: number };
  chargeMove?: { toX?: number };
  statusEffects?: string[];
  barrier?: number;
  elite?: boolean;
  affix?: string;
  color?: string;
}

export interface EnemyPosition {
  x: number;
  y: number;
}

export interface EnemyVisualMaps {
  enemies: Map<string, EnemyPosition>;
}

export interface EnemySpriteLike {
  zIndex: number;
  rotation: number;
  alpha: number;
}

export interface EnemyRendererHost {
  layers: {
    actor: unknown;
  };
  lastEnemyPositions: Map<string, EnemyPosition>;
  getVisuals(): EnemyVisualMaps;
  visualPosition(map: Map<string, EnemyPosition>, entity: EnemyView): EnemyPosition;
  enemyTextureKey(type: string, frame: number): unknown;
  bossTextureKey(enemy: EnemyView, now: number): unknown;
  sprite(
    key: string | unknown,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): EnemySpriteLike;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
  bar(x: number, y: number, width: number, height: number, ratio: number, fill: string): void;
  drawEliteCrown(x: number, y: number, affix: string, color: string, zIndex: number): void;
}

const SPRITE_SIZE = 64;
const BOSS_SIZE = 128;

export function enemyFrame(enemy: EnemyView, now: number): number {
  return Math.floor(now / (enemy.type === "bat" ? 95 : 160)) % 4;
}

export function enemyFace(enemy: EnemyView, pos: EnemyPosition, last: EnemyPosition): 1 | -1 {
  const dx = pos.x - last.x;
  const targetX = Number.isFinite(enemy.windup?.x)
    ? Number(enemy.windup?.x)
    : Number.isFinite(enemy.chargeMove?.toX)
      ? Number(enemy.chargeMove?.toX)
      : pos.x + dx;
  return targetX >= pos.x ? 1 : -1;
}

export function enemyTextureKey(renderer: EnemyRendererHost, enemy: EnemyView, now: number): string | unknown {
  if (enemy.type === "boss") return renderer.bossTextureKey(enemy, now);
  return renderer.enemyTextureKey(enemy.type || "slime", enemyFrame(enemy, now));
}

export function enemyScale(enemy: EnemyView): number {
  const size = enemy.type === "boss" ? BOSS_SIZE : SPRITE_SIZE;
  return Math.max(0.72, (enemy.radius * (enemy.type === "boss" ? 4.75 : 4.05)) / size);
}

export function renderEnemy(renderer: EnemyRendererHost, enemy: EnemyView, now: number, visuals: EnemyVisualMaps): void {
  const pos = renderer.visualPosition(visuals.enemies, enemy);
  const last = renderer.lastEnemyPositions.get(String(enemy.id)) || pos;
  const face = enemyFace(enemy, pos, last);
  renderer.lastEnemyPositions.set(String(enemy.id), { x: pos.x, y: pos.y });

  const shadowScale = Math.max(0.55, enemy.radius / 28);
  renderer.sprite("shadow", renderer.layers.actor, pos.x, pos.y + enemy.radius * 0.66, shadowScale, shadowScale, "#000000", 0.74).zIndex =
    pos.y - 2;

  const key = enemyTextureKey(renderer, enemy, now);
  const scale = enemyScale(enemy);
  const sprite = renderer.sprite(key, renderer.layers.actor, pos.x, pos.y, scale * face, scale, "#ffffff", 1);
  sprite.zIndex = pos.y;
  if (enemy.windup) {
    sprite.rotation = Math.sin(now / 90) * 0.035;
    sprite.alpha = 0.86 + Math.sin(now / 80) * 0.12;
  }
  if (enemy.statusEffects?.includes("freeze")) renderer.ring(pos.x, pos.y, enemy.radius * 1.35, "#93c5fd", 0.52, 3);
  if (enemy.statusEffects?.includes("barrier") || Number(enemy.barrier || 0) > 0) {
    renderer.ring(pos.x, pos.y, enemy.radius * 1.58, "#bfdbfe", 0.42, 3);
  }
  if (enemy.elite) renderer.drawEliteCrown(pos.x, pos.y - enemy.radius * 1.1, enemy.affix || "", enemy.color || "#facc15", pos.y + 1);
  renderer.bar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, 5, enemy.hp / Math.max(1, enemy.maxHp), "#ef4444");
}

export function renderEnemies(renderer: EnemyRendererHost, enemies: EnemyView[], now: number): void {
  const visuals = renderer.getVisuals();
  for (const enemy of enemies) renderEnemy(renderer, enemy, now, visuals);
}
