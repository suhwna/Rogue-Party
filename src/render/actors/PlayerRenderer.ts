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
  engineerLaserCharge?: number;
  engineerLaserChargeMax?: number;
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
  drawGfxDashDust?(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    angle: number,
    color: string,
    alpha: number,
    zIndex: number,
    phase: number,
    options?: { shadow?: boolean; charge?: boolean; long?: boolean },
  ): void;
  drawGfxLightning?(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string,
    alpha: number,
    zIndex: number,
    width?: number,
    segments?: number,
    jitter?: number,
    phase?: number,
  ): void;
  drawGfxCircle?(
    x: number,
    y: number,
    radius: number,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode?: string,
    segments?: number,
  ): void;
  drawGfxLine?(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    color: string,
    alpha: number,
    zIndex: number,
    blendMode?: string,
  ): void;
  drawGfxPath?(
    points: Array<{ x: number; y: number }>,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode?: string,
  ): void;
  drawGfxGear?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase?: number, teeth?: number): void;
  drawGfxRuneRing?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase?: number, count?: number): void;
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
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(pos.x + Math.cos(angle) * 12, pos.y + Math.sin(angle) * 8, fxX + Math.cos(angle) * 24, fxY + Math.sin(angle) * 10, "#67e8f9", 0.72, pos.y + 24, 5, 5, 11, Date.now() / 95 + renderer.hash(player.id));
    } else {
      renderer.fx("fx-lightning", fxX, fxY, 0.54, 0.54, "#9ee6ff", 0.72, pos.y + 24, angle, "add");
    }
  } else if (classId === "puppeteer") {
    renderer.fx("fx-thread-knot", fxX, fxY, 0.44, 0.36, "#f5d0fe", 0.72, pos.y + 24, angle, "add");
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(pos.x + Math.cos(angle) * 8, pos.y + Math.sin(angle) * 5, fxX + Math.cos(angle) * 4, fxY + Math.sin(angle) * 4, "#b985c8", 0.32, pos.y + 23, 2.4, 4, 7, Date.now() / 140 + renderer.hash(player.id));
    } else {
      renderer.fx("fx-lightning", fxX - Math.cos(angle) * 16, fxY - Math.sin(angle) * 8, 0.36, 0.18, "#b985c8", 0.38, pos.y + 23, angle, "add");
    }
  } else if (classId === "martialist") {
    renderer.fx("fx-fist", fxX, fxY, 0.42, 0.42, "#fde68a", 0.76, pos.y + 24, angle, "add");
  } else if (classId === "alchemist") {
    renderer.fx("fx-flask", fxX, fxY, 0.4, 0.4, "#bef264", 0.68, pos.y + 24, angle, "add");
    renderer.fx("fx-acid-splash", fxX + Math.cos(angle) * 12, fxY + Math.sin(angle) * 7, 0.28, 0.22, "#bef264", 0.34, pos.y + 23, angle, "add");
  } else if (classId === "assassin") {
    renderer.fx("fx-shadow-cut", fxX, fxY, face * 0.58, 0.42, "#c4b5fd", 0.78, pos.y + 24, angle, "add");
    renderer.fx("fx-smoke", pos.x - face * 12, pos.y + 3, 0.42, 0.34, "#21142f", 0.28, pos.y + 18, 0, "add");
  } else if (classId === "warrior") {
    return;
  } else {
    renderer.fx("fx-sword-cut", fxX, fxY, face * 0.72, 0.72, player.color || "#ffffff", 0.82, pos.y + 24, angle, "add");
  }
}

export function renderEngineerLaserChargeHud(
  renderer: PlayerRendererHost,
  player: PlayerView,
  x: number,
  y: number,
  radius: number,
  now: number,
  z: number,
): void {
  const max = Math.max(0, Math.floor(Number(player.engineerLaserChargeMax || 0)));
  const charge = Math.max(0, Math.min(max, Math.floor(Number(player.engineerLaserCharge || 0))));
  if (max <= 0 || charge <= 0 || !renderer.drawGfxCircle) return;

  const ratio = charge / max;
  const pulse = 0.5 + Math.sin(now / 88 + renderer.hash(player.id) * 0.17) * 0.5;
  const orbitRadius = radius * (1.04 + ratio * 0.42);
  const coreRadius = radius * (0.2 + ratio * 0.27 + pulse * 0.045);
  const tint = "#c084fc";
  const hot = charge >= max - 1 ? "#f5d0fe" : "#67e8f9";
  const alpha = 0.34 + ratio * 0.38 + pulse * 0.12;
  const spin = now / (230 - ratio * 70);

  renderer.drawGfxCircle(x, y, orbitRadius, "#170728", 0.1 + ratio * 0.05, tint, 0.2 + ratio * 0.26, 2 + ratio * 2.2, z + 46, "add", 34);
  renderer.drawGfxRuneRing?.(x, y, orbitRadius * 0.82, tint, 0.24 + ratio * 0.22, z + 47, -spin, max);
  renderer.drawGfxCircle(x, y, coreRadius * 1.52, tint, 0.2 + ratio * 0.2, hot, alpha, 2, z + 50, "add", 18);
  renderer.drawGfxCircle(x, y, coreRadius * 0.62, hot, 0.38 + ratio * 0.32, "#ffffff", 0.3 + ratio * 0.36, 1.6, z + 52, "add", 12);

  for (let i = 0; i < max; i += 1) {
    const lit = i < charge;
    const a = -Math.PI * 0.5 + (i - (max - 1) / 2) * 0.42;
    const pipX = x + Math.cos(a) * orbitRadius * 0.74;
    const pipY = y + Math.sin(a) * orbitRadius * 0.54;
    renderer.drawGfxCircle(
      pipX,
      pipY,
      radius * (lit ? 0.12 + pulse * 0.02 : 0.08),
      lit ? hot : "#111827",
      lit ? 0.62 : 0.18,
      lit ? "#ffffff" : "#334155",
      lit ? 0.48 : 0.26,
      lit ? 1.5 : 1,
      z + 54 + i,
      "add",
      10,
    );
  }

  for (let i = 0; i < charge; i += 1) {
    const a = spin + (Math.PI * 2 * i) / Math.max(1, charge);
    const sx = x + Math.cos(a) * orbitRadius * 1.05;
    const sy = y + Math.sin(a) * orbitRadius * 0.72;
    const ex = x + Math.cos(a) * coreRadius * 0.32;
    const ey = y + Math.sin(a) * coreRadius * 0.22;
    renderer.drawGfxLine?.(sx, sy, ex, ey, 2.2 + ratio * 1.8, hot, 0.28 + ratio * 0.3, z + 49 + i, "add");
  }
}

export function renderMechaSuitAura(
  renderer: PlayerRendererHost,
  player: PlayerView,
  pos: PlayerPosition,
  radius: number,
  now: number,
  bob: number,
  z: number,
): void {
  if (!renderer.drawGfxCircle) {
    renderer.ring(pos.x, pos.y, radius * 1.9, "#d6b76d", 0.46, 4);
    renderer.ring(pos.x, pos.y, radius * 2.15, "#f8f3e9", 0.18, 2);
    return;
  }

  const angle = Number(player.facing || 0);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const pulse = 0.5 + Math.sin(now / 118 + renderer.hash(player.id)) * 0.5;
  const cx = pos.x;
  const cy = pos.y + bob + 2;
  const coreRadius = radius * 2.02;
  renderer.drawGfxCircle(cx, cy + radius * 0.22, coreRadius * 0.72, "#0f172a", 0.15, "#d6b76d", 0.28, 2, z + 28, "add", 28);
  renderer.drawGfxGear?.(cx, cy, coreRadius * (0.48 + pulse * 0.03), "#d6b76d", 0.34, z + 31, now / 520, 10);
  renderer.drawGfxRuneRing?.(cx, cy, coreRadius * 0.58, "#67e8f9", 0.26, z + 32, -now / 720, 6);

  for (const side of [-1, 1]) {
    const sx = cx + px * side * radius * 1.04 - ux * radius * 0.05;
    const sy = cy + py * side * radius * 1.04 - uy * radius * 0.05;
    const shoulder = [
      { x: sx + ux * radius * 0.72, y: sy + uy * radius * 0.72 },
      { x: sx - ux * radius * 0.18 + px * side * radius * 0.48, y: sy - uy * radius * 0.18 + py * side * radius * 0.48 },
      { x: sx - ux * radius * 0.86 + px * side * radius * 0.2, y: sy - uy * radius * 0.86 + py * side * radius * 0.2 },
      { x: sx - ux * radius * 0.46 - px * side * radius * 0.34, y: sy - uy * radius * 0.46 - py * side * radius * 0.34 },
    ];
    renderer.drawGfxPath?.(shoulder, "#241a07", 0.72, "#d6b76d", 0.82, 3, z + 36 + side, "normal");
    renderer.drawGfxLine?.(sx - ux * radius * 0.42, sy - uy * radius * 0.42, sx + ux * radius * 0.5, sy + uy * radius * 0.5, 4, "#67e8f9", 0.42, z + 39 + side, "add");

    const bx = cx - ux * radius * 1.02 + px * side * radius * 0.62;
    const by = cy - uy * radius * 1.02 + py * side * radius * 0.62;
    renderer.drawGfxLine?.(bx, by, bx - ux * radius * (0.82 + pulse * 0.22), by - uy * radius * (0.82 + pulse * 0.22), 7, "#f97316", 0.22 + pulse * 0.08, z + 27 + side, "add");
    renderer.drawGfxCircle?.(bx, by, radius * 0.14, "#67e8f9", 0.42, "#f8f3e9", 0.36, 1.4, z + 40 + side, "add", 10);
  }

  renderer.drawGfxCircle?.(cx + ux * radius * 0.64, cy + uy * radius * 0.64, radius * 0.19, "#67e8f9", 0.48, "#f8f3e9", 0.62, 2, z + 42, "add", 12);
  renderEngineerLaserChargeHud(renderer, player, cx, cy, radius, now, z);
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
  const dashActive = Boolean(player.dashMove?.active);
  const warriorDash = (player.classId || "warrior") === "warrior";
  if (dashActive && warriorDash && renderer.drawGfxDashDust) {
    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    const travel = Math.hypot(dx, dy);
    const angle = travel > 3 ? Math.atan2(dy, dx) : Number(player.facing || 0);
    const fromX = travel > 3 ? last.x : pos.x - Math.cos(angle) * scaleBase * 52;
    const fromY = travel > 3 ? last.y : pos.y - Math.sin(angle) * scaleBase * 52;
    renderer.drawGfxDashDust(fromX, fromY, pos.x, pos.y, scaleBase * 28, angle, "#caa35a", 0.58, pos.y - 1, now / 180, {});
  } else if (moving && !dashActive) {
    const trail = renderer.sprite(key, renderer.layers.actor, pos.x - face * 18, pos.y + bob, scale * face, scale, "#ffffff", 0.16);
    trail.zIndex = pos.y - 1;
  }
  const sprite = renderer.sprite(key, renderer.layers.actor, pos.x, pos.y + bob, scale * face, scale, "#ffffff", player.downed ? 0.55 : 1);
  sprite.zIndex = pos.y + 2;

  renderPlayerAttackEffect(renderer, player, pos, face, bob);

  if (Number(player.shield || 0) > 0) renderer.ring(pos.x, pos.y, 33 * scaleBase, "#bfdbfe", 0.5, 3);
  if (player.statusEffects?.includes("taunt_guard")) renderer.ring(pos.x, pos.y, 42 * scaleBase, "#f97316", 0.34, 4);
  if (player.statusEffects?.includes("mecha")) {
    renderMechaSuitAura(renderer, player, pos, (player.id === selfId ? 25 : 22) * scaleBase, now, bob, pos.y + 12);
  }
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
