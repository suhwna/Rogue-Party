export interface HazardView {
  id?: number;
  type?: string;
  style?: string;
  damageType?: string;
  x: number;
  y: number;
  radius?: number;
  length?: number;
  width?: number;
  angle?: number;
  color?: string;
  hostile?: boolean;
  armed?: boolean;
  armTime?: number;
  armTimeMax?: number;
  small?: boolean;
  moveFromX?: number;
  moveFromY?: number;
  moveTime?: number;
  spawnFromX?: number;
  spawnFromY?: number;
  mode?: string;
}

export interface HazardState {
  color: string;
  armed: boolean;
  alpha: number;
  radius: number;
  flavor: string;
}

export interface HazardSpriteLike {
  rotation: number;
  blendMode: string;
  zIndex: number;
}

export interface HazardRendererHost {
  layers: {
    hazard: unknown;
  };
  sprite(
    key: string,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): HazardSpriteLike;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    color: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
  drawGfxLine?(x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string): void;
  drawGfxLightning?(fromX: number, fromY: number, toX: number, toY: number, color: string, alpha: number, zIndex: number, width?: number, segments?: number, jitter?: number, phase?: number): void;
  drawGfxPath?(
    points: Array<{ x: number; y: number }>,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode: string,
  ): void;
  noise(x: number, y: number): number;
}

export function hazardFlavor(hazard: HazardView): string {
  return `${hazard.type || ""} ${hazard.style || ""} ${hazard.damageType || ""}`.toLowerCase();
}

export function hazardState(hazard: HazardView, now: number): HazardState {
  const color = hazard.color || (hazard.hostile ? "#f87171" : "#7e9fb2");
  const armed = Boolean(hazard.armed || !hazard.armTime);
  return {
    color,
    armed,
    alpha: armed ? 0.32 : 0.16 + Math.sin(now / 90) * 0.08,
    radius: hazard.radius || 40,
    flavor: hazardFlavor(hazard),
  };
}

export function hazardSeed(hazard: HazardView): number {
  return Number(hazard.id || 0);
}

export function renderHostileHazardBoundary(
  renderer: HazardRendererHost,
  hazard: HazardView,
  state: HazardState,
  now: number,
): void {
  if (!hazard.hostile || (hazard.length && hazard.width)) return;
  const pulse = 0.82 + Math.sin(now / 110 + hazardSeed(hazard)) * 0.1;
  renderer.ring(hazard.x, hazard.y, state.radius * 1.01, "#ff2d55", (state.armed ? 0.5 : 0.34) * pulse, state.armed ? 4 : 3);
  for (let i = 0; i < 4; i += 1) {
    const angle = Math.PI / 4 + (Math.PI * 2 * i) / 4;
    renderer.drawGfxLine?.(
      hazard.x + Math.cos(angle) * state.radius * 0.84,
      hazard.y + Math.sin(angle) * state.radius * 0.84,
      hazard.x + Math.cos(angle) * state.radius * 1.04,
      hazard.y + Math.sin(angle) * state.radius * 1.04,
      4,
      "#ff2d55",
      state.armed ? 0.62 : 0.42,
      hazard.y + 15 + i,
      "normal",
    );
  }
}

export function renderBeamHazard(renderer: HazardRendererHost, hazard: HazardView, state: HazardState): boolean {
  if (!hazard.length || !hazard.width) return false;
  const beamColor = state.flavor.includes("sniper") || state.flavor.includes("laser") || hazard.hostile ? "#ef4444" : state.color;
  const beam = renderer.sprite(
    "beam",
    renderer.layers.hazard,
    hazard.x,
    hazard.y,
    hazard.length / 32,
    Math.max(0.55, hazard.width / 9),
    beamColor,
    state.armed ? 0.5 : 0.24,
  );
  beam.rotation = hazard.angle || 0;
  beam.blendMode = "add";
  beam.zIndex = hazard.y - 8;
  return true;
}

export function renderEngineerTurret(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const id = hazardSeed(hazard);
  const size = hazard.small ? 0.72 : 0.92;
  const turret = renderer.sprite("fx-turret", renderer.layers.hazard, hazard.x, hazard.y + Math.sin(now / 170 + id) * 1.2, size, size, "#d6b76d", 0.96);
  turret.zIndex = hazard.y + 8;
  renderer.sprite("shadow", renderer.layers.hazard, hazard.x, hazard.y + 25, 0.72, 0.56, "#000000", 0.55).zIndex = hazard.y - 2;
  if (renderer.drawGfxLightning) {
    renderer.drawGfxLightning(hazard.x + 5, hazard.y - 10, hazard.x + 31, hazard.y - 15, "#67e8f9", state.armed ? 0.36 + Math.sin(now / 90) * 0.08 : 0.14, hazard.y + 9, 3.2, 4, 7, now / 140 + id);
  }
  if (!state.armed) renderer.ring(hazard.x, hazard.y, state.radius * 0.72, "#9ee6ff", 0.16 + Math.sin(now / 80) * 0.05, 2);
}

export function renderEngineerDrone(renderer: HazardRendererHost, hazard: HazardView, now: number): void {
  const id = hazardSeed(hazard);
  const drone = renderer.sprite("fx-drone", renderer.layers.hazard, hazard.x, hazard.y - 8 + Math.sin(now / 120 + id) * 4, 0.76, 0.76, "#d6b76d", 0.96);
  drone.zIndex = hazard.y + 22;
  drone.blendMode = "normal";
  renderer.sprite("shadow", renderer.layers.hazard, hazard.x, hazard.y + 18, 0.54, 0.38, "#000000", 0.38).zIndex = hazard.y - 2;
  renderer.drawGfxLightning?.(hazard.x - 20, hazard.y - 9, hazard.x + 20, hazard.y - 7, "#67e8f9", 0.28 + Math.sin(now / 110) * 0.06, hazard.y + 23, 3.4, 5, 8, now / 120 + id);
}

export function renderEngineerMine(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const id = hazardSeed(hazard);
  const style = String(hazard.style || "");
  const dash = style.includes("dash");
  const charged = style.includes("charged");
  const tint = charged ? "#a78bfa" : "#67e8f9";
  const coreTint = state.armed ? tint : charged ? "#c4b5fd" : "#9ee6ff";
  const mine = renderer.sprite("fx-mine", renderer.layers.hazard, hazard.x, hazard.y, dash ? 0.62 : 0.72, dash ? 0.62 : 0.72, coreTint, state.armed ? 0.92 : 0.78);
  mine.rotation = Math.sin(now / 160 + id) * 0.08;
  mine.blendMode = "add";
  mine.zIndex = hazard.y + 2;
  renderer.ring(
    hazard.x,
    hazard.y,
    Math.max(28, state.radius * (state.armed ? 0.78 : 0.56)),
    tint,
    state.armed ? 0.18 : 0.12 + Math.sin(now / 95) * 0.05,
    2,
  );
  renderer.drawGfxLightning?.(hazard.x - 16, hazard.y, hazard.x + 16, hazard.y, tint, dash ? 0.34 : 0.22, hazard.y + 3, 3, 4, 6, now / 140);
}

export function renderPuppet(renderer: HazardRendererHost, hazard: HazardView, now: number): void {
  const id = hazardSeed(hazard);
  if (Number.isFinite(hazard.moveFromX) && Number.isFinite(hazard.moveFromY) && (hazard.moveTime || 0) > 0) {
    renderer.lineFx("fx-lightning", Number(hazard.moveFromX), Number(hazard.moveFromY), hazard.x, hazard.y, 10, "#f5d0fe", 0.4, hazard.y + 50, "add");
  }
  const puppet = renderer.sprite("fx-puppet", renderer.layers.hazard, hazard.x, hazard.y + Math.sin(now / 190 + id) * 1.5, 0.84, 0.84, "#b985c8", 0.98);
  puppet.zIndex = hazard.y + 10;
  renderer.sprite("fx-thread-knot", renderer.layers.hazard, hazard.x, hazard.y - 28, 0.46, 0.46, "#f5d0fe", 0.42 + Math.sin(now / 140) * 0.1).zIndex =
    hazard.y + 12;
}

export function renderArrowRain(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const id = hazardSeed(hazard);
  const pulse = 1 + Math.sin(now / 210 + id) * 0.012;
  renderer.ring(hazard.x, hazard.y, state.radius * pulse, "#f1d08b", state.armed ? 0.36 : 0.24, state.armed ? 2.4 : 1.8);
  renderer.ring(hazard.x, hazard.y, state.radius * 0.72, "#fde68a", state.armed ? 0.12 : 0.08, 1.2);
  if (!state.armed) return;
  const dropCount = 9;
  const skyY = hazard.y - state.radius * 2.1;
  for (let i = 0; i < dropCount; i += 1) {
    const seed = renderer.noise(id + i * 17, 4);
    const t = (now / 360 + i * 0.19 + id * 0.07) % 1;
    const lane = (i - (dropCount - 1) / 2) * state.radius * 0.12 + (seed - 0.5) * state.radius * 0.12;
    const x = hazard.x + lane;
    const slant = (i % 2 ? -1 : 1) * 3;
    const topY = skyY + t * state.radius * 2.45;
    renderer.lineFx("beam", x - slant, topY - 42, x + slant, topY + 30, i % 3 === 0 ? 4 : 3, i % 3 === 0 ? "#fff7ed" : "#f1d08b", 0.58 + t * 0.18, hazard.y + 20 + i, "add");
    const arrow = renderer.sprite("fx-arrow-rain", renderer.layers.hazard, x, topY + 8, 0.2, 0.28, i % 3 === 0 ? "#fff7ed" : "#f1d08b", 0.18);
    arrow.zIndex = hazard.y + 28 + i;
    arrow.blendMode = "add";
  }
}

export function renderAlchemyBomb(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const id = hazardSeed(hazard);
  if (Number.isFinite(hazard.spawnFromX) && Number.isFinite(hazard.spawnFromY)) {
    renderer.lineFx("beam", Number(hazard.spawnFromX), Number(hazard.spawnFromY), hazard.x, hazard.y, 5, "#bef264", 0.18, hazard.y + 4, "add");
  }
  const bomb = renderer.sprite("fx-flask", renderer.layers.hazard, hazard.x, hazard.y - (state.armed ? 0 : Math.sin(now / 90) * 3), 0.74, 0.74, "#bef264", 0.94);
  bomb.rotation = Math.sin(now / 130 + id) * 0.25;
  bomb.zIndex = hazard.y + 6;
  renderer.ring(hazard.x, hazard.y, state.radius, "#bef264", state.armed ? 0.18 : 0.12 + Math.sin(now / 90) * 0.06, 2);
}

export function renderAlchemyPool(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const id = hazardSeed(hazard);
  const fireMode = hazard.mode === "fire" || state.flavor.includes("fire");
  const key = fireMode ? "fx-fire-pool" : "fx-acid-splash";
  const tint = fireMode ? "#f97316" : "#bef264";
  const pool = renderer.sprite(key, renderer.layers.hazard, hazard.x, hazard.y, state.radius / 70, state.radius / 86, tint, state.armed ? (fireMode ? 0.46 : 0.32) : 0.24);
  pool.blendMode = "add";
  pool.zIndex = hazard.y - 10;
  renderer.ring(hazard.x, hazard.y, state.radius, tint, 0.12 + Math.sin(now / 180 + id) * 0.03, 2);
}

export function renderElixirMist(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const mist = renderer.sprite("fx-heal-cross", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 86, state.radius / 86, "#bbf7d0", 0.3 + Math.sin(now / 160) * 0.06);
  mist.blendMode = "add";
  mist.zIndex = hazard.y - 8;
  renderer.ring(hazard.x, hazard.y, state.radius, "#bbf7d0", 0.13, 2);
}

export function renderMeteorHazard(renderer: HazardRendererHost, hazard: HazardView, state: HazardState, now: number): void {
  const marker = renderer.sprite("fx-warning-target", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 48, state.radius / 48, "#f97316", state.armed ? 0.24 : 0.42);
  marker.rotation = now / 720;
  marker.blendMode = "add";
  marker.zIndex = hazard.y - 14;
}

export function renderMortarBlast(renderer: HazardRendererHost, hazard: HazardView, state: HazardState): void {
  const fromX = Number.isFinite(hazard.spawnFromX) ? Number(hazard.spawnFromX) : hazard.x;
  const fromY = Number.isFinite(hazard.spawnFromY) ? Number(hazard.spawnFromY) : hazard.y;
  const armMax = Math.max(0.1, Number(hazard.armTimeMax || hazard.armTime || 0.62));
  const rawProgress = Math.max(0, Math.min(1, 1 - Number(hazard.armTime || 0) / armMax));
  const travel = rawProgress * rawProgress * (3 - 2 * rawProgress);
  const dx = hazard.x - fromX;
  const dy = hazard.y - fromY;
  const distance = Math.hypot(dx, dy) || 1;
  const lift = Math.max(150, Math.min(360, distance * 0.36));
  const controlX = fromX + dx * 0.5;
  const controlY = Math.min(fromY, hazard.y) - lift;
  const one = 1 - travel;
  const shellX = one * one * fromX + 2 * one * travel * controlX + travel * travel * hazard.x;
  const shellY = one * one * fromY + 2 * one * travel * controlY + travel * travel * hazard.y;
  const tangentX = 2 * one * (controlX - fromX) + 2 * travel * (hazard.x - controlX);
  const tangentY = 2 * one * (controlY - fromY) + 2 * travel * (hazard.y - controlY);
  const angle = Math.atan2(tangentY, tangentX);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  renderer.ring(hazard.x, hazard.y, state.radius * 0.78, "#fb923c", 0.24, 2);
  renderer.drawGfxLine?.(shellX - ux * 46, shellY - uy * 46, shellX, shellY, 10, "#7c2d12", 0.3, shellY + 90, "add");
  renderer.drawGfxLine?.(shellX - ux * 32, shellY - uy * 32, shellX, shellY, 4, "#f97316", 0.72, shellY + 92, "add");
  renderer.drawGfxPath?.(
    [
      { x: shellX + ux * 13, y: shellY + uy * 13 },
      { x: shellX - uy * 9, y: shellY + ux * 9 },
      { x: shellX - ux * 12, y: shellY - uy * 12 },
      { x: shellX + uy * 9, y: shellY - ux * 9 },
    ],
    "#2b1710",
    0.96,
    "#fb923c",
    0.9,
    2.6,
    shellY + 96,
    "normal",
  );
}

export function renderDefaultHazard(renderer: HazardRendererHost, hazard: HazardView, state: HazardState): void {
  const poison = state.flavor.includes("poison") || state.flavor.includes("acid") || state.flavor.includes("venom");
  const fire =
    state.flavor.includes("fire") ||
    state.flavor.includes("flame") ||
    state.flavor.includes("burn") ||
    state.flavor.includes("meteor") ||
    state.flavor.includes("bomber") ||
    state.flavor.includes("blast");
  const heal = state.flavor.includes("heal") || state.flavor.includes("elixir") || state.flavor.includes("holy");
  const shield = state.flavor.includes("shield") || state.flavor.includes("barrier");
  if (poison) {
    const cloud = renderer.sprite("fx-poison-cloud", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 54, state.radius / 70, "#bef264", state.armed ? 0.34 : 0.2);
    cloud.blendMode = "add";
    cloud.zIndex = hazard.y - 12;
  } else if (fire) {
    const flame = renderer.sprite("fx-fire-bloom", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 64, state.radius / 64, "#f97316", state.armed ? 0.28 : 0.17);
    flame.blendMode = "add";
    flame.zIndex = hazard.y - 12;
  } else if (heal) {
    const cross = renderer.sprite("fx-heal-cross", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 76, state.radius / 76, "#86efac", state.armed ? 0.28 : 0.16);
    cross.blendMode = "add";
    cross.zIndex = hazard.y - 12;
  } else if (shield) {
    const hex = renderer.sprite("fx-shield-hex", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 76, state.radius / 76, "#bfdbfe", state.armed ? 0.34 : 0.2);
    hex.blendMode = "add";
    hex.zIndex = hazard.y - 12;
  }
  renderer.ring(hazard.x, hazard.y, state.radius, poison ? "#bef264" : fire ? "#f97316" : heal ? "#86efac" : state.color, state.alpha, state.armed ? 3 : 2);
  if (state.armed) {
    const warningKey = hazard.hostile ? "fx-warning-target" : "warning-ring";
    const warning = renderer.sprite(
      warningKey,
      renderer.layers.hazard,
      hazard.x,
      hazard.y,
      state.radius / 45,
      state.radius / 45,
      poison ? "#bef264" : fire ? "#f97316" : state.color,
      hazard.hostile ? 0.16 : 0.14,
    );
    warning.blendMode = "add";
    warning.zIndex = hazard.y - 10;
  }
}

export function renderHazard(renderer: HazardRendererHost, hazard: HazardView, now: number): void {
  const state = hazardState(hazard, now);
  if (renderBeamHazard(renderer, hazard, state)) return;
  renderHostileHazardBoundary(renderer, hazard, state, now);
  if (hazard.type === "engineer_turret") return renderEngineerTurret(renderer, hazard, state, now);
  if (hazard.type === "engineer_drone") return renderEngineerDrone(renderer, hazard, now);
  if (hazard.type === "engineer_mine") return renderEngineerMine(renderer, hazard, state, now);
  if (hazard.type === "puppet") return renderPuppet(renderer, hazard, now);
  if (hazard.type === "arrow_rain") return renderArrowRain(renderer, hazard, state, now);
  if (hazard.type === "alchemy_bomb") return renderAlchemyBomb(renderer, hazard, state, now);
  if (hazard.type === "alchemy_pool" || hazard.type === "acid_pool" || hazard.type === "poison_pool") return renderAlchemyPool(renderer, hazard, state, now);
  if (hazard.type === "alchemy_elixir_mist") return renderElixirMist(renderer, hazard, state, now);
  if (hazard.type === "meteor") return renderMeteorHazard(renderer, hazard, state, now);
  if (hazard.type === "mortar_blast") return renderMortarBlast(renderer, hazard, state);
  if (hazard.type === "warrior_followup_cleave") return;
  return renderDefaultHazard(renderer, hazard, state);
}

export function renderHazards(renderer: HazardRendererHost, hazards: HazardView[], now: number): void {
  for (const hazard of hazards) {
    renderHazard(renderer, hazard, now);
  }
}
