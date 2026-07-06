export interface PlayerView {
  id: string | number;
  classId?: string;
  x?: number;
  y?: number;
  facing?: number;
  attacking?: boolean;
  spectator?: boolean;
  downed?: boolean;
  hp: number;
  maxHp: number;
  shield?: number;
  sizeScale?: number;
  color?: string;
  lastAttackAt?: number;
  statusEffects?: string[];
  dashMove?: { active?: boolean };
}

export interface PlayerPosition {
  x: number;
  y: number;
}

export interface PlayerVisualMaps {
  players: Map<string, PlayerPosition>;
}

export interface PlayerSpriteLike {
  zIndex: number;
}

export interface PlayerRendererHost {
  layers: {
    actor: unknown;
  };
  lastPlayerPositions: Map<string, PlayerPosition>;
  getVisuals(): PlayerVisualMaps;
  getSelfId(): string | number | null;
  visualPosition(map: Map<string, PlayerPosition>, entity: PlayerView): PlayerPosition;
  actorTextureKey(classId: string, frame: number, state: string): unknown;
  hash(value: unknown): number;
  sprite(
    key: string | unknown,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): PlayerSpriteLike;
  fx(
    key: string,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
    zIndex: number,
    rotation: number,
    blendMode: string,
  ): void;
  drawGfxSword(
    originX: number,
    originY: number,
    angle: number,
    reach: number,
    sideOffset: number,
    color: string,
    alpha: number,
    zIndex: number,
    heavy: boolean,
  ): void;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
  bar(x: number, y: number, width: number, height: number, ratio: number, fill: string): void;
}

const SPRITE_SIZE = 64;

export function playerFace(player: PlayerView): 1 | -1 {
  return Math.cos(Number(player.facing || 0)) >= 0 ? 1 : -1;
}

export function playerMoving(player: PlayerView, pos: PlayerPosition, last: PlayerPosition): boolean {
  return Math.hypot(pos.x - last.x, pos.y - last.y) > 0.2 || Boolean(player.dashMove?.active);
}

export function playerFrame(now: number, moving: boolean): number {
  return Math.floor(now / (moving ? 100 : 220)) % 4;
}

export function playerScale(player: PlayerView, selfId: string | number | null): { scaleBase: number; scale: number } {
  const scaleBase = (player.id === selfId ? 1.14 : 1.02) * (player.sizeScale || 1);
  return {
    scaleBase,
    scale: Math.max(1.02, ((player.id === selfId ? 86 : 76) * scaleBase) / SPRITE_SIZE),
  };
}

export function renderPlayerAttackEffect(
  renderer: PlayerRendererHost,
  player: PlayerView,
  pos: PlayerPosition,
  face: 1 | -1,
  bob: number,
): void {
  if (Date.now() - Number(player.lastAttackAt || 0) >= 160) return;
  const angle = Number(player.facing || 0);
  const classId = player.classId || "warrior";
  const fxX = pos.x + Math.cos(angle) * 30;
  const fxY = pos.y + Math.sin(angle) * 18 - 2;
  if (classId === "ranger") {
    renderer.fx("fx-arrow-streak", fxX + Math.cos(angle) * 18, fxY, face * 0.78, 0.7, player.color || "#f1d08b", 0.78, pos.y + 24, angle, "add");
  } else if (classId === "mage") {
    renderer.fx("fx-star-burst", fxX, fxY, 0.36, 0.36, "#dbeafe", 0.72, pos.y + 24, angle + 0.2, "add");
  } else if (classId === "engineer") {
    renderer.fx("fx-lightning", fxX, fxY, 0.54, 0.54, "#9ee6ff", 0.72, pos.y + 24, angle, "add");
  } else if (classId === "puppeteer") {
    renderer.fx("fx-thread-knot", fxX, fxY, 0.44, 0.36, "#f5d0fe", 0.72, pos.y + 24, angle, "add");
    renderer.fx("fx-lightning", fxX - Math.cos(angle) * 16, fxY - Math.sin(angle) * 8, 0.36, 0.18, "#b985c8", 0.38, pos.y + 23, angle, "add");
  } else if (classId === "martialist") {
    renderer.fx("fx-fist", fxX, fxY, 0.42, 0.42, "#fde68a", 0.76, pos.y + 24, angle, "add");
  } else if (classId === "alchemist") {
    renderer.fx("fx-flask", fxX, fxY, 0.4, 0.4, "#bef264", 0.68, pos.y + 24, angle, "add");
    renderer.fx("fx-acid-splash", fxX + Math.cos(angle) * 12, fxY + Math.sin(angle) * 7, 0.28, 0.22, "#bef264", 0.34, pos.y + 23, angle, "add");
  } else if (classId === "assassin") {
    renderer.fx("fx-shadow-cut", fxX, fxY, face * 0.58, 0.42, "#c4b5fd", 0.78, pos.y + 24, angle, "add");
    renderer.fx("fx-smoke", pos.x - face * 12, pos.y + 3, 0.42, 0.34, "#21142f", 0.28, pos.y + 18, 0, "add");
  } else if (classId === "warrior") {
    renderer.drawGfxSword(pos.x - Math.cos(angle) * 10, pos.y + bob + Math.sin(angle) * 4, angle + 0.08 * face, 72, 0, player.color || "#f97316", 0.7, pos.y + 30, false);
  } else {
    renderer.fx("fx-sword-cut", fxX, fxY, face * 0.72, 0.72, player.color || "#ffffff", 0.82, pos.y + 24, angle, "add");
  }
}

export function renderPlayer(
  renderer: PlayerRendererHost,
  player: PlayerView,
  now: number,
  visuals: PlayerVisualMaps,
  selfId: string | number | null,
): void {
  if (player.spectator) return;
  const pos = renderer.visualPosition(visuals.players, player);
  const last = renderer.lastPlayerPositions.get(String(player.id)) || pos;
  const moving = playerMoving(player, pos, last);
  renderer.lastPlayerPositions.set(String(player.id), { x: pos.x, y: pos.y });

  const face = playerFace(player);
  const frame = playerFrame(now, moving);
  const key = renderer.actorTextureKey(player.classId || "warrior", frame, player.attacking ? "attack" : "idle");
  const { scaleBase, scale } = playerScale(player, selfId);
  const bob = Math.sin(now / (moving ? 105 : 240) + renderer.hash(player.id) * 4) * (moving ? 2 : 0.6);

  renderer.sprite("shadow", renderer.layers.actor, pos.x, pos.y + 27 * scaleBase, scale * 1.1, scale * 0.9, "#000000", 0.72).zIndex = pos.y - 2;
  if (moving || player.dashMove?.active) {
    const trail = renderer.sprite(key, renderer.layers.actor, pos.x - face * 18, pos.y + bob, scale * face, scale, "#ffffff", player.dashMove?.active ? 0.34 : 0.16);
    trail.zIndex = pos.y - 1;
  }
  const sprite = renderer.sprite(key, renderer.layers.actor, pos.x, pos.y + bob, scale * face, scale, "#ffffff", player.downed ? 0.55 : 1);
  sprite.zIndex = pos.y + 2;

  renderPlayerAttackEffect(renderer, player, pos, face, bob);

  if (Number(player.shield || 0) > 0) renderer.ring(pos.x, pos.y, 33 * scaleBase, "#bfdbfe", 0.5, 3);
  if (player.statusEffects?.includes("taunt_guard")) renderer.ring(pos.x, pos.y, 42 * scaleBase, "#f97316", 0.34, 4);
  if (player.id === selfId) {
    renderer.bar(pos.x, pos.y - 56 * scaleBase, 86, 8, player.hp / Math.max(1, player.maxHp), "#ef4444");
    if (Number(player.shield || 0) > 0) renderer.bar(pos.x, pos.y - 46 * scaleBase, 86, 4, Number(player.shield || 0) / Math.max(1, player.maxHp * 0.45), "#93c5fd");
  }
}

export function renderPlayers(renderer: PlayerRendererHost, players: PlayerView[], now: number): void {
  const visuals = renderer.getVisuals();
  const selfId = renderer.getSelfId();
  for (const player of players) {
    renderPlayer(renderer, player, now, visuals, selfId);
  }
}
