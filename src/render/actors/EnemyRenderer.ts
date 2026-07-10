export interface EnemyView {
  id: string | number;
  type?: string;
  x?: number;
  y?: number;
  radius: number;
  hp: number;
  maxHp: number;
  windup?: {
    kind?: string;
    x?: number;
    y?: number;
    startX?: number;
    startY?: number;
    angle?: number;
    spread?: number;
    range?: number;
    radius?: number;
    width?: number;
    dirX?: number;
    dirY?: number;
    points?: Array<{ x?: number; y?: number; angle?: number }>;
    time?: number;
    duration?: number;
  };
  chargeMove?: { active?: boolean; angle?: number; fromX?: number; fromY?: number; toX?: number; toY?: number };
  statusEffects?: string[];
  barrier?: number;
  poisonStacks?: number;
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

export interface EnemyStatusTextLike {
  text: string;
  alpha: number;
  zIndex: number;
  position: { set(x: number, y: number): void };
  scale: { set(x: number, y?: number): void };
}

export interface EnemyWorldBounds {
  w?: number;
  h?: number;
}

export interface EnemyRendererHost {
  layers: {
    actor: unknown;
    effect?: unknown;
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
  textPool?: {
    next(parent: unknown, style: unknown): EnemyStatusTextLike;
  };
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
  ): unknown;
  drawGfxArc?(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    width: number,
    color: string,
    alpha: number,
    zIndex: number,
    blendMode?: string,
    segments?: number,
  ): unknown;
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
  ): unknown;
  drawGfxPath?(
    points: Array<{ x: number; y: number }>,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode?: string,
  ): unknown;
  drawGfxDiamond?(x: number, y: number, size: number, color: string, alpha: number, zIndex: number, rotation?: number, strokeColor?: string): unknown;
}

const SPRITE_SIZE = 64;
const BOSS_SIZE = 128;
const ENEMY_STATUS_MARKERS = [
  { id: "freeze", label: "F", color: "#bfdbfe" },
  { id: "slow", label: "S", color: "#8aa8bd" },
  { id: "poison", label: "P", color: "#bef264" },
  { id: "venom", label: "v", color: "#c084fc" },
  { id: "burn", label: "B", color: "#fb923c" },
  { id: "vulnerable", label: "V", color: "#facc15" },
  { id: "marked", label: "M", color: "#c4b5fd" },
  { id: "threaded", label: "L", color: "#d8b4fe" },
  { id: "taunt", label: "T", color: "#e8794f" },
  { id: "barrier", label: "G", color: "#93c5fd" },
] as const;

type EnemyStatusMarker = (typeof ENEMY_STATUS_MARKERS)[number];

function enemyStatusEffects(enemy: EnemyView): Set<string> {
  return new Set(Array.isArray(enemy.statusEffects) ? enemy.statusEffects : []);
}

function enemyStatusActive(enemy: EnemyView, effects: Set<string>, id: EnemyStatusMarker["id"]): boolean {
  if (id === "freeze") return effects.has("freeze") || effects.has("frozen");
  if (id === "barrier") return effects.has("barrier") || Number(enemy.barrier || 0) > 0;
  return effects.has(id);
}

function poisonStackCount(enemy: EnemyView): number {
  return Math.max(0, Math.min(3, Math.floor(Number(enemy.poisonStacks || 0))));
}

function enemyStatusMarkerLabel(enemy: EnemyView, marker: EnemyStatusMarker): string {
  if (marker.id !== "poison") return marker.label;
  const stacks = poisonStackCount(enemy);
  return stacks > 0 ? `P${stacks}` : marker.label;
}

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

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function enemyDirectionAngle(enemy: EnemyView, pos: EnemyPosition, last: EnemyPosition, face: 1 | -1): number {
  const explicitAngle = finiteNumber(enemy.windup?.angle) ?? finiteNumber(enemy.chargeMove?.angle);
  if (explicitAngle !== null) return explicitAngle;

  const windupTargetX = finiteNumber(enemy.windup?.x);
  const windupTargetY = finiteNumber(enemy.windup?.y);
  if (windupTargetX !== null && windupTargetY !== null) {
    const fromX = finiteNumber(enemy.windup?.startX) ?? pos.x;
    const fromY = finiteNumber(enemy.windup?.startY) ?? pos.y;
    return Math.atan2(windupTargetY - fromY, windupTargetX - fromX);
  }

  const chargeToX = finiteNumber(enemy.chargeMove?.toX);
  const chargeToY = finiteNumber(enemy.chargeMove?.toY);
  if (chargeToX !== null && chargeToY !== null) {
    const fromX = finiteNumber(enemy.chargeMove?.fromX) ?? pos.x;
    const fromY = finiteNumber(enemy.chargeMove?.fromY) ?? pos.y;
    return Math.atan2(chargeToY - fromY, chargeToX - fromX);
  }

  const dx = pos.x - last.x;
  const dy = pos.y - last.y;
  if (Math.hypot(dx, dy) > 0.2) return Math.atan2(dy, dx);
  return face >= 0 ? 0 : Math.PI;
}

export function enemyTextureKey(renderer: EnemyRendererHost, enemy: EnemyView, now: number): string | unknown {
  if (enemy.type === "boss") return renderer.bossTextureKey(enemy, now);
  return renderer.enemyTextureKey(enemy.type || "slime", enemyFrame(enemy, now));
}

export function enemyScale(enemy: EnemyView): number {
  const size = enemy.type === "boss" ? BOSS_SIZE : SPRITE_SIZE;
  return Math.max(0.72, (enemy.radius * (enemy.type === "boss" ? 4.75 : 4.05)) / size);
}

function eliteAffixColor(affix?: string, fallback = "#facc15"): string {
  if (affix === "venom") return "#bef264";
  if (affix === "volatile") return "#fb7185";
  if (affix === "frenzy") return "#fb923c";
  if (affix === "bulwark") return "#93c5fd";
  return fallback;
}

export function enemyStatusMarkers(enemy: EnemyView): EnemyStatusMarker[] {
  const effects = enemyStatusEffects(enemy);
  return ENEMY_STATUS_MARKERS.filter((marker) => enemyStatusActive(enemy, effects, marker.id));
}

function enemyWindupProgress(windup: EnemyView["windup"]): number {
  const duration = Math.max(0.1, Number(windup?.duration || windup?.time || 1));
  return 1 - Math.max(0, Math.min(1, Number(windup?.time || 0) / duration));
}

function isEnemyLineWindupKind(kind?: string): boolean {
  return (
    kind === "charge" ||
    kind === "snipe" ||
    kind === "spit" ||
    kind === "boss_volley" ||
    kind === "stalker_shuriken" ||
    kind === "elite_volley" ||
    kind === "elite_quake" ||
    kind === "elite_crossfire"
  );
}

function renderEnemyCastAura(renderer: EnemyRendererHost, enemy: EnemyView, pos: EnemyPosition, now: number, z: number): void {
  if (!enemy.windup || isEnemyLineWindupKind(enemy.windup.kind) || !renderer.drawGfxCircle) return;

  const progress = enemyWindupProgress(enemy.windup);
  const radius = Math.max(12, Number(enemy.radius || 18));
  const pulse = 0.5 + Math.sin(now / 95) * 0.5;
  const ringRadius = radius * (1.2 + progress * 0.12 + pulse * 0.04);

  renderer.drawGfxCircle(pos.x, pos.y, ringRadius, "#7f1d1d", 0.045 + progress * 0.035, "#ff2d55", 0.26 + progress * 0.22, 3, z, "add", 24);
  renderer.drawGfxLine?.(pos.x - radius * 0.5, pos.y, pos.x + radius * 0.5, pos.y, 3, "#ff2d55", 0.26 + progress * 0.34, z + 1, "add");
  renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.5, pos.x, pos.y + radius * 0.5, 3, "#ff2d55", 0.24 + progress * 0.3, z + 2, "add");
}

function renderEnemyDangerLine(
  renderer: EnemyRendererHost,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  width: number,
  progress: number,
  z: number,
  world?: EnemyWorldBounds,
): void {
  const line = clipEnemyDangerLineToWorld(fromX, fromY, toX, toY, width, world);
  if (!renderer.drawGfxLine || Math.hypot(line.toX - line.fromX, line.toY - line.fromY) < 1) return;
  renderer.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, width, "#ff2d55", 0.14 + progress * 0.2, z, "add");
}

function clipEnemyDangerLineToWorld(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  lineWidth: number,
  world?: EnemyWorldBounds,
): { fromX: number; fromY: number; toX: number; toY: number } {
  const worldWidth = Number(world?.w);
  const worldHeight = Number(world?.h);
  if (!Number.isFinite(worldWidth) || !Number.isFinite(worldHeight) || worldWidth <= 0 || worldHeight <= 0) {
    return { fromX, fromY, toX, toY };
  }

  const inset = Math.max(0, lineWidth * 0.5 + 1);
  const minX = Math.min(inset, worldWidth * 0.5);
  const maxX = Math.max(minX, worldWidth - inset);
  const minY = Math.min(inset, worldHeight * 0.5);
  const maxY = Math.max(minY, worldHeight - inset);
  const clippedFromX = Math.max(minX, Math.min(maxX, fromX));
  const clippedFromY = Math.max(minY, Math.min(maxY, fromY));
  const dx = toX - clippedFromX;
  const dy = toY - clippedFromY;
  let scale = 1;

  if (dx > 0) scale = Math.min(scale, (maxX - clippedFromX) / dx);
  else if (dx < 0) scale = Math.min(scale, (minX - clippedFromX) / dx);
  if (dy > 0) scale = Math.min(scale, (maxY - clippedFromY) / dy);
  else if (dy < 0) scale = Math.min(scale, (minY - clippedFromY) / dy);
  scale = Math.max(0, Math.min(1, scale));

  return {
    fromX: clippedFromX,
    fromY: clippedFromY,
    toX: clippedFromX + dx * scale,
    toY: clippedFromY + dy * scale,
  };
}

function renderEnemyWindupTelegraph(renderer: EnemyRendererHost, enemy: EnemyView, pos: EnemyPosition, z: number, world?: EnemyWorldBounds): void {
  const windup = enemy.windup;
  if (!windup) return;

  const progress = enemyWindupProgress(windup);
  const radius = Math.max(12, Number(enemy.radius || 18));
  if (windup.kind === "charge" || windup.kind === "snipe" || windup.kind === "spit") {
    const fromX = windup.kind === "charge" && Number.isFinite(windup.startX) ? Number(windup.startX) : pos.x;
    const fromY = windup.kind === "charge" && Number.isFinite(windup.startY) ? Number(windup.startY) : pos.y;
    const targetX = Number.isFinite(windup.x) ? Number(windup.x) : pos.x + Math.cos(Number(windup.angle || 0)) * 420;
    const targetY = Number.isFinite(windup.y) ? Number(windup.y) : pos.y + Math.sin(Number(windup.angle || 0)) * 420;
    const dx = targetX - fromX;
    const dy = targetY - fromY;
    const length = Math.hypot(dx, dy) || 1;
    const extend = windup.kind === "snipe" ? Math.max(220, radius * 8) : windup.kind === "spit" ? radius * 1.35 : 0;
    const width = windup.kind === "snipe" ? 22 : windup.kind === "spit" ? Math.max(12, radius * 0.95) : Math.max(20, radius * 1.35);
    renderEnemyDangerLine(
      renderer,
      fromX,
      fromY,
      targetX + (dx / length) * extend,
      targetY + (dy / length) * extend,
      width,
      progress,
      z,
      world,
    );
    return;
  }

  if (windup.kind === "elite_quake") {
    const dirX = Number.isFinite(windup.dirX) ? Number(windup.dirX) : Math.cos(Number(windup.angle || 0));
    const dirY = Number.isFinite(windup.dirY) ? Number(windup.dirY) : Math.sin(Number(windup.angle || 0));
    const length = Math.max(120, Number(windup.radius || windup.range || 250));
    const width = Math.max(18, Number(windup.width || 64));
    renderEnemyDangerLine(renderer, pos.x, pos.y, pos.x + dirX * length, pos.y + dirY * length, width, progress, z, world);
    return;
  }

  if (windup.kind === "elite_crossfire" && Array.isArray(windup.points)) {
    const length = Math.max(520, Number(windup.range || 900));
    for (const point of windup.points) {
      const angle = Number.isFinite(point.angle) ? Number(point.angle) : Math.atan2(Number(point.y || pos.y) - pos.y, Number(point.x || pos.x) - pos.x);
      renderEnemyDangerLine(renderer, pos.x, pos.y, pos.x + Math.cos(angle) * length, pos.y + Math.sin(angle) * length, 20, progress, z, world);
    }
    return;
  }

  if (windup.kind === "stalker_shuriken" || windup.kind === "elite_volley" || windup.kind === "boss_volley") {
    const angle = Number.isFinite(windup.angle)
      ? Number(windup.angle)
      : Math.atan2(Number(windup.y || pos.y) - pos.y, Number(windup.x || pos.x) - pos.x);
    const spread = Math.max(0.16, Number(windup.spread || 0.34));
    const range = Math.max(320, Number(windup.range || 620));
    for (const offset of [-spread, 0, spread]) {
      const lane = angle + offset;
      renderEnemyDangerLine(renderer, pos.x, pos.y, pos.x + Math.cos(lane) * range, pos.y + Math.sin(lane) * range, offset === 0 ? 18 : 12, progress, z, world);
    }
  }
}

function renderEnemyStatusGraphics(renderer: EnemyRendererHost, enemy: EnemyView, pos: EnemyPosition, now: number, z: number): void {
  if (!renderer.drawGfxCircle) return;
  const effects = enemyStatusEffects(enemy);
  if (!effects.size && !(Number(enemy.barrier || 0) > 0)) return;

  const radius = Math.max(10, Number(enemy.radius || 18));
  const phase = now / 360;
  const pulse = 0.5 + Math.sin(phase * 2.2) * 0.5;
  const baseZ = z + 38;

  if (enemyStatusActive(enemy, effects, "slow")) {
    renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.98 + pulse * 0.08), Math.PI * 0.1, Math.PI * 0.92, 4, "#8aa8bd", 0.34, baseZ, "add", 12);
    renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.72 + pulse * 0.06), Math.PI * 1.08, Math.PI * 1.9, 3, "#dbeafe", 0.2, baseZ + 1, "add", 12);
  }

  if (enemyStatusActive(enemy, effects, "freeze")) {
    renderer.drawGfxCircle(pos.x, pos.y, radius * 1.05, "#dbeafe", 0.06, "#93c5fd", 0.52, 3, baseZ + 5, "add", 24);
    for (let i = 0; i < 5; i += 1) {
      const a = phase + (Math.PI * 2 * i) / 5;
      const inner = radius * (0.16 + (i % 2) * 0.08);
      const outer = radius * (0.72 + (i % 3) * 0.1);
      renderer.drawGfxLine?.(pos.x + Math.cos(a) * inner, pos.y + Math.sin(a) * inner, pos.x + Math.cos(a) * outer, pos.y + Math.sin(a) * outer, 2.5, i % 2 ? "#bfdbfe" : "#f8fafc", 0.46, baseZ + 7 + i, "add");
    }
  }

  if (enemyStatusActive(enemy, effects, "poison")) {
    const stacks = Math.max(1, poisonStackCount(enemy));
    renderer.drawGfxCircle(pos.x, pos.y + radius * 0.18, radius * 1.08, "#365314", 0.08, "#bef264", 0.18, 2, baseZ + 3, "add", 18);
    for (let i = 0; i < 4; i += 1) {
      const a = phase * 1.3 + (Math.PI * 2 * i) / 4;
      const d = radius * (0.44 + (i % 2) * 0.28);
      const bubble = radius * (0.12 + (i % 3) * 0.035);
      renderer.drawGfxCircle(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d * 0.7, bubble, "#bef264", 0.18, "#ecfccb", 0.24, 1, baseZ + 12 + i, "add", 10);
    }
    for (let i = 0; i < stacks; i += 1) {
      const offset = (i - (stacks - 1) / 2) * radius * 0.3;
      renderer.drawGfxCircle(pos.x + offset, pos.y - radius * 1.12, radius * 0.12, "#bef264", 0.72, "#ecfccb", 0.58, 1, baseZ + 18 + i, "add", 10);
    }
  }

  if (enemyStatusActive(enemy, effects, "burn")) {
    for (let i = 0; i < 4; i += 1) {
      const side = i % 2 ? 1 : -1;
      const x = pos.x + side * radius * (0.32 + i * 0.04);
      const y = pos.y - radius * (0.45 - i * 0.08);
      const height = radius * (0.44 + pulse * 0.12);
      renderer.drawGfxLine?.(x, y + height * 0.34, x + side * radius * 0.08, y - height * 0.54, 5 - i * 0.45, i % 2 ? "#fdba74" : "#f97316", 0.48, baseZ + 14 + i, "add");
      renderer.drawGfxCircle(x, y - height * 0.28, radius * 0.13, "#f97316", 0.22, "#fed7aa", 0.28, 1, baseZ + 18 + i, "add", 8);
    }
  }

  if (enemyStatusActive(enemy, effects, "vulnerable")) {
    renderer.drawGfxCircle(pos.x, pos.y, radius * 1.26, "#000000", 0, "#facc15", 0.38, 2, baseZ + 20, "add", 26);
    for (let i = 0; i < 4; i += 1) {
      const a = phase * 0.25 + (Math.PI * 2 * i) / 4;
      renderer.drawGfxLine?.(pos.x + Math.cos(a) * radius * 0.98, pos.y + Math.sin(a) * radius * 0.98, pos.x + Math.cos(a) * radius * 1.32, pos.y + Math.sin(a) * radius * 1.32, 3, "#fde68a", 0.5, baseZ + 22 + i, "add");
    }
  }

  if (enemyStatusActive(enemy, effects, "marked")) {
    renderer.drawGfxLine?.(pos.x - radius * 0.48, pos.y - radius * 0.48, pos.x + radius * 0.48, pos.y + radius * 0.48, 4, "#c4b5fd", 0.62, baseZ + 28, "add");
    renderer.drawGfxLine?.(pos.x + radius * 0.48, pos.y - radius * 0.48, pos.x - radius * 0.48, pos.y + radius * 0.48, 4, "#f5d0fe", 0.46, baseZ + 29, "add");
    renderer.drawGfxDiamond?.(pos.x, pos.y, radius * 0.2, "#c4b5fd", 0.34, baseZ + 30, phase, "#f5d0fe");
  }

  if (enemyStatusActive(enemy, effects, "threaded")) {
    for (let i = 0; i < 3; i += 1) {
      const offset = (i - 1) * radius * 0.42;
      renderer.drawGfxLine?.(pos.x + offset, pos.y - radius * 1.05, pos.x - offset * 0.36, pos.y + radius * 1.04, 2, "#d8b4fe", 0.44, baseZ + 31 + i, "add");
      renderer.drawGfxCircle(pos.x - offset * 0.36, pos.y + radius * (0.5 - i * 0.08), radius * 0.08, "#d8b4fe", 0.34, "#f5d0fe", 0.22, 1, baseZ + 35 + i, "add", 8);
    }
  }

  if (enemyStatusActive(enemy, effects, "taunt")) {
    renderer.drawGfxCircle(pos.x, pos.y, radius * (1.42 + pulse * 0.12), "#7f1d1d", 0.03, "#ef4444", 0.46, 3, baseZ + 40, "add", 26);
    renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.95, pos.x, pos.y - radius * 0.28, 5, "#fecaca", 0.68, baseZ + 43, "add");
    renderer.drawGfxCircle(pos.x, pos.y - radius * 0.08, radius * 0.1, "#fecaca", 0.62, "#ef4444", 0.3, 1, baseZ + 44, "add", 8);
  }
}

function renderEnemyStatusPips(renderer: EnemyRendererHost, enemy: EnemyView, pos: EnemyPosition, z: number): void {
  const markers = enemyStatusMarkers(enemy);
  if (!markers.length || !renderer.drawGfxCircle) return;

  const size = 14;
  const gap = 3;
  const perRow = 6;
  const rowGap = 15;
  const pipY = pos.y + Math.max(14, Number(enemy.radius || 18) + 11);
  const textParent = renderer.layers.effect || renderer.layers.actor;
  const textStyleBase = {
    fontFamily: "Inter, sans-serif",
    fontWeight: "900",
    fontSize: 8,
    stroke: { color: "#020617", width: 2 },
  };

  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i];
    if (!marker) continue;
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const count = Math.min(perRow, markers.length - row * perRow);
    const startX = pos.x - ((count - 1) * (size + gap)) / 2;
    const x = startX + col * (size + gap);
    const y = pipY + row * rowGap;
    renderer.drawGfxCircle(x, y, size / 2, "#05070c", 0.86, marker.color, 0.88, 1.4, z + 58 + row, "normal", 12);
    const label = enemyStatusMarkerLabel(enemy, marker);
    const text = renderer.textPool?.next(textParent, { ...textStyleBase, fontSize: label.length > 1 ? 7 : 8, fill: marker.color });
    if (!text) continue;
    text.text = label;
    text.position.set(x, y + 0.2);
    text.alpha = 0.98;
    text.scale.set(1);
    text.zIndex = z + 59 + row;
  }
}

function renderEliteMutation(renderer: EnemyRendererHost, enemy: EnemyView, pos: EnemyPosition, z: number): void {
  if (!enemy.elite || enemy.type === "boss") return;

  const radius = Math.max(10, Number(enemy.radius || 18));
  const color = eliteAffixColor(enemy.affix || "", "#facc15");
  const dark = "#111827";
  const baseZ = z + 18;

  if (enemy.affix === "bulwark") {
    for (const side of [-1, 1]) {
      renderer.drawGfxPath?.(
        [
          { x: pos.x + side * radius * 0.18, y: pos.y - radius * 0.52 },
          { x: pos.x + side * radius * 0.72, y: pos.y - radius * 0.46 },
          { x: pos.x + side * radius * 0.94, y: pos.y - radius * 0.08 },
          { x: pos.x + side * radius * 0.58, y: pos.y + radius * 0.2 },
          { x: pos.x + side * radius * 0.24, y: pos.y + radius * 0.04 },
        ],
        dark,
        0.84,
        color,
        0.72,
        2.4,
        baseZ + side,
        "normal",
      );
    }
    return;
  }

  if (enemy.affix === "venom") {
    const sacs = [
      [-0.4, 0.22, 0.26],
      [0.04, 0.34, 0.32],
      [0.46, 0.18, 0.22],
    ];
    for (let i = 0; i < sacs.length; i += 1) {
      const sac = sacs[i];
      if (!sac) continue;
      renderer.drawGfxCircle?.(
        pos.x + Number(sac[0]) * radius,
        pos.y + Number(sac[1]) * radius,
        Number(sac[2]) * radius,
        "#365314",
        0.82,
        color,
        0.62,
        1.8,
        baseZ + i,
        "normal",
        12,
      );
    }
    return;
  }

  if (enemy.affix === "volatile") {
    renderer.drawGfxCircle?.(pos.x, pos.y, radius * 0.34, "#7f1d1d", 0.92, color, 0.78, 2.2, baseZ, "normal", 6);
    renderer.drawGfxCircle?.(pos.x, pos.y, radius * 0.13, "#f8fafc", 0.72, color, 0.46, 1.2, baseZ + 1, "normal", 10);
    const cracks = [
      [-0.16, -0.18, -0.54, -0.54],
      [0.16, -0.14, 0.58, -0.42],
      [-0.14, 0.18, -0.48, 0.56],
      [0.14, 0.2, 0.52, 0.52],
    ];
    for (let i = 0; i < cracks.length; i += 1) {
      const crack = cracks[i];
      if (!crack) continue;
      renderer.drawGfxLine?.(
        pos.x + Number(crack[0]) * radius,
        pos.y + Number(crack[1]) * radius,
        pos.x + Number(crack[2]) * radius,
        pos.y + Number(crack[3]) * radius,
        2.2,
        color,
        0.62,
        baseZ + 2 + i,
        "normal",
      );
    }
    return;
  }

  for (const side of [-1, 1]) {
    renderer.drawGfxPath?.(
      [
        { x: pos.x + side * radius * 0.12, y: pos.y - radius * 0.58 },
        { x: pos.x + side * radius * 0.8, y: pos.y - radius * 1.05 },
        { x: pos.x + side * radius * 0.52, y: pos.y - radius * 0.34 },
      ],
      dark,
      0.9,
      color,
      0.74,
      2,
      baseZ + side,
      "normal",
    );
  }
  renderer.drawGfxLine?.(pos.x - radius * 0.46, pos.y - radius * 0.06, pos.x + radius * 0.18, pos.y + radius * 0.28, 2.6, color, 0.68, baseZ + 3, "normal");
  renderer.drawGfxLine?.(pos.x - radius * 0.24, pos.y - radius * 0.3, pos.x + radius * 0.42, pos.y + radius * 0.04, 2.6, color, 0.68, baseZ + 4, "normal");
}

export function renderEnemy(renderer: EnemyRendererHost, enemy: EnemyView, now: number, visuals: EnemyVisualMaps, world?: EnemyWorldBounds): void {
  const pos = renderer.visualPosition(visuals.enemies, enemy);
  const last = renderer.lastEnemyPositions.get(String(enemy.id)) || pos;
  const face = enemyFace(enemy, pos, last);
  const z = pos.y + (enemy.type === "boss" ? 80 : 20);
  renderer.lastEnemyPositions.set(String(enemy.id), { x: pos.x, y: pos.y });

  const shadowScale = Math.max(0.55, enemy.radius / 28);
  renderer.sprite("shadow", renderer.layers.actor, pos.x, pos.y + enemy.radius * 0.66, shadowScale, shadowScale, "#000000", 0.74).zIndex =
    pos.y - 2;

  const key = enemyTextureKey(renderer, enemy, now);
  const scale = enemyScale(enemy);
  const charger = enemy.type === "charger";
  const sprite = renderer.sprite(key, renderer.layers.actor, pos.x, pos.y, charger ? scale : scale * face, scale, "#ffffff", 1);
  sprite.zIndex = pos.y;
  if (charger) {
    sprite.rotation = enemyDirectionAngle(enemy, pos, last, face);
    if (enemy.windup || enemy.chargeMove?.active) {
      sprite.alpha = 0.86 + Math.sin(now / 80) * 0.12;
    }
  } else if (enemy.windup) {
    sprite.rotation = Math.sin(now / 90) * 0.035;
    sprite.alpha = 0.86 + Math.sin(now / 80) * 0.12;
  }
  renderEnemyWindupTelegraph(renderer, enemy, pos, z - 36, world);
  renderEnemyCastAura(renderer, enemy, pos, now, z + 28);
  if (enemy.statusEffects?.includes("freeze")) renderer.ring(pos.x, pos.y, enemy.radius * 1.35, "#93c5fd", 0.52, 3);
  if (enemy.statusEffects?.includes("barrier") || Number(enemy.barrier || 0) > 0) {
    renderer.ring(pos.x, pos.y, enemy.radius * 1.58, "#bfdbfe", 0.42, 3);
  }
  renderEliteMutation(renderer, enemy, pos, pos.y + 1);
  renderEnemyStatusGraphics(renderer, enemy, pos, now, z);
  renderEnemyStatusPips(renderer, enemy, pos, z);
  renderer.bar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, 5, enemy.hp / Math.max(1, enemy.maxHp), "#ef4444");
}

export function renderEnemies(renderer: EnemyRendererHost, enemies: EnemyView[], now: number, world?: EnemyWorldBounds): void {
  const visuals = renderer.getVisuals();
  for (const enemy of enemies) renderEnemy(renderer, enemy, now, visuals, world);
}
