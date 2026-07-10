import { classifyEffectStyle, type EffectStyleInfo } from "./EffectStyleClassifier";

export interface SkillEffectView {
  id?: number | string;
  kind?: string;
  x: number;
  y: number;
  radius?: number;
  range?: number;
  rangeRadius?: number;
  distance?: number;
  angle?: number;
  seed?: number;
  width?: number;
  contactRadius?: number;
  impactAt?: number;
  fallTime?: number;
  moveDuration?: number;
  duration?: number;
  ttl?: number;
  chargeStep?: number;
  chargeMax?: number;
  release?: boolean;
  mode?: string;
  flask?: string;
  damageType?: string;
}

export interface SkillEffectEndpoint {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SkillEffectRendererHost {
  effectEndpoints?(effect: SkillEffectView, radius: number, angle: number): SkillEffectEndpoint;
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
    options?: { shadow?: boolean; charge?: boolean; long?: boolean; hot?: boolean },
  ): void;
  drawGfxLine?(x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string): void;
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
  drawGfxCircle?(
    x: number,
    y: number,
    radius: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
  drawGfxSparkSpray?(
    x: number,
    y: number,
    radius: number,
    color: string,
    alpha: number,
    zIndex: number,
    count: number,
    phase: number,
    angle?: number,
    spread?: number,
  ): void;
  drawGfxImpactBurst?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, progress: number, count: number): void;
  drawGfxLightning?(fromX: number, fromY: number, toX: number, toY: number, color: string, alpha: number, zIndex: number, width?: number, segments?: number, jitter?: number, phase?: number): void;
  drawGfxArc?(x: number, y: number, radius: number, startAngle: number, endAngle: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string, segments: number): void;
  drawGfxGear?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase?: number, teeth?: number): void;
  drawGfxRuneRing?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase?: number, spokes?: number): void;
}

export interface WarriorSkillRendererHost extends SkillEffectRendererHost {
  drawGfxShoutWave(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, progress: number): void;
  drawGfxSparkSpray(
    x: number,
    y: number,
    radius: number,
    color: string,
    alpha: number,
    zIndex: number,
    count: number,
    phase: number,
    angle?: number,
    spread?: number,
  ): void;
  drawGfxShieldWall(x: number, y: number, angle: number, size: number, color: string, alpha: number, zIndex: number, heavy: boolean): void;
  drawGfxShieldCrash(x: number, y: number, angle: number, size: number, color: string, alpha: number, zIndex: number, progress: number): void;
  drawGfxCleaveRibbon(
    x: number,
    y: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
  drawGfxImpactBurst(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, progress: number, count: number): void;
  drawGfxShieldWake(fromX: number, fromY: number, toX: number, toY: number, width: number, angle: number, color: string, alpha: number, zIndex: number, phase: number): void;
  drawGfxShieldPlow(x: number, y: number, angle: number, width: number, color: string, alpha: number, zIndex: number, progress: number): void;
  drawGfxLine(x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string): void;
  drawGfxCircle(
    x: number,
    y: number,
    radius: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
  drawGfxArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string, segments: number): void;
  drawGfxGreatsword(originX: number, originY: number, angle: number, reach: number, color: string, alpha: number, zIndex: number, heavy: boolean): void;
  drawGfxShieldProfile(x: number, y: number, angle: number, size: number, color: string, alpha: number, zIndex: number, heavy: boolean): void;
  renderWarriorConeEffect(effect: SkillEffectView, progress: number, alpha: number, color: string, cleave: boolean): void;
}

export interface RangerSkillRendererHost extends SkillEffectRendererHost {
  drawGfxCircle(
    x: number,
    y: number,
    radius: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
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
  ): { alpha: number };
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    tint: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
  noise(x: number, y: number): number;
}

export interface MageSkillRendererHost extends SkillEffectRendererHost {
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
  ): { alpha: number };
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    tint: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
}

export interface EngineerSkillRendererHost extends SkillEffectRendererHost {
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
  ): { alpha: number };
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    tint: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
}

export interface PuppetSkillRendererHost extends SkillEffectRendererHost {
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
  ): { alpha: number };
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    tint: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
}

export interface MartialSkillRendererHost extends SkillEffectRendererHost {
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
  ): { alpha: number };
  lineFx(
    key: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    width: number,
    tint: string,
    alpha: number,
    zIndex: number,
    blendMode: string,
  ): void;
  renderFastMeleeConeEffect(effect: SkillEffectView, progress: number, alpha: number, color: string, mode: string): void;
}

export interface AlchemistSkillRendererHost extends SkillEffectRendererHost {
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
  ): { alpha: number };
  drawGfxArrow(fromX: number, fromY: number, toX: number, toY: number, color: string, alpha: number, zIndex: number, width?: number): void;
  drawGfxSparkSpray(
    x: number,
    y: number,
    radius: number,
    color: string,
    alpha: number,
    zIndex: number,
    count: number,
    phase: number,
    angle?: number,
    spread?: number,
  ): void;
  drawGfxFlask(x: number, y: number, angle: number, color: string, alpha: number, zIndex: number, scale: number): void;
  drawGfxCircle(
    x: number,
    y: number,
    radius: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
  drawGfxRuneRing(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase: number, spokes: number): void;
  drawGfxLine(x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string): void;
  drawGfxSwirl(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase: number, arms: number): void;
  drawGfxPath(
    points: Array<{ x: number; y: number }>,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode: string,
  ): void;
}

export interface AlchemistMode {
  fire: boolean;
  acid: boolean;
  heal: boolean;
  tint: string;
}

export interface AssassinSkillRendererHost extends MartialSkillRendererHost {}

export interface CommonStyledEffectRendererHost extends SkillEffectRendererHost {
  drawGfxCircle(
    x: number,
    y: number,
    radius: number,
    fill: string,
    fillAlpha: number,
    stroke: string,
    strokeAlpha: number,
    thickness: number,
    zIndex: number,
    blendMode: string,
    segments: number,
  ): void;
  drawGfxRuneRing(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase: number, spokes: number): void;
  drawGfxLine(x1: number, y1: number, x2: number, y2: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string): void;
  drawGfxSparkSpray(
    x: number,
    y: number,
    radius: number,
    color: string,
    alpha: number,
    zIndex: number,
    count: number,
    phase: number,
    angle?: number,
    spread?: number,
  ): void;
  drawGfxPath(
    points: Array<{ x: number; y: number }>,
    fillColor: string,
    fillAlpha: number,
    strokeColor: string,
    strokeAlpha: number,
    strokeWidth: number,
    zIndex: number,
    blendMode: string,
  ): void;
  drawGfxCone(
    x: number,
    y: number,
    angle: number,
    length: number,
    spread: number,
    color: string,
    fillAlpha: number,
    strokeAlpha: number,
    zIndex: number,
    rounded: boolean,
  ): void;
  drawGfxShardBurst(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, count: number, progress: number): void;
}

export interface CrispClassSkillRendererHost extends AlchemistSkillRendererHost, CommonStyledEffectRendererHost {
  noise(x: number, y: number): number;
  drawGfxLightning(fromX: number, fromY: number, toX: number, toY: number, color: string, alpha: number, zIndex: number, width?: number, segments?: number, jitter?: number, phase?: number): void;
  drawGfxCapsule(fromX: number, fromY: number, toX: number, toY: number, radius: number, color: string, alpha: number, zIndex: number): void;
  drawGfxImpactBurst(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase: number, count: number): void;
  drawGfxArc(x: number, y: number, radius: number, startAngle: number, endAngle: number, width: number, color: string, alpha: number, zIndex: number, blendMode: string, segments: number): void;
  drawGfxStar(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, points: number): void;
  drawGfxDiamond(x: number, y: number, size: number, color: string, alpha: number, zIndex: number, rotation?: number, strokeColor?: string): void;
  drawGfxGear(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, phase?: number, teeth?: number): void;
}

export interface SkillEffectPhase {
  peak: number;
  pulse: number;
}

export interface StyledSkillContext {
  effect: SkillEffectView;
  progress: number;
  alpha: number;
  radius: number;
  color: string;
  s: string;
  styleInfo: EffectStyleInfo;
  kind: string;
  angle: number;
  peak: number;
  pulse: number;
  effectRadius: number;
  end: SkillEffectEndpoint;
  z: number;
}

export function normalizeSkillStyle(style: unknown): string {
  return String(style || "").toLowerCase();
}

export function skillEffectPhase(progress: number): SkillEffectPhase {
  const peak = Math.sin(progress * Math.PI);
  return {
    peak,
    pulse: 1 + peak * 0.22,
  };
}

function meteorRockPoints(x: number, y: number, angle: number, length: number, width: number, phase = 0): Array<{ x: number; y: number }> {
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const wobble = Math.floor(phase * 10);
  const shape: Array<[number, number]> = [
    [0.78, -0.02],
    [0.43, -0.58],
    [0.02, -0.42],
    [-0.34, -0.64],
    [-0.76, -0.18],
    [-0.62, 0.28],
    [-0.16, 0.58],
    [0.34, 0.42],
  ];
  return shape.map(([along, side], index) => {
    const jitter = 0.9 + ((index + wobble) % 3) * 0.08;
    return {
      x: x + ux * length * along + px * width * side * jitter,
      y: y + uy * length * along + py * width * side * jitter,
    };
  });
}

function drawMeteorTrail(host: SkillEffectRendererHost, fromX: number, fromY: number, toX: number, toY: number, width: number, alpha: number, z: number, phase = 0): boolean {
  if (!host.drawGfxPath || !host.drawGfxLine) return false;
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const length = Math.max(1, Math.hypot(toX - fromX, toY - fromY));
  const back = Math.min(length * 0.2, width * 1.8);
  const flutter = Math.sin(phase * 8) * width * 0.08;
  host.drawGfxPath(
    [
      { x: toX - ux * width * 0.16 + px * width * 0.58, y: toY - uy * width * 0.16 + py * width * 0.58 },
      { x: fromX + px * (width * 0.18 + flutter), y: fromY + py * (width * 0.18 + flutter) },
      { x: fromX - ux * back, y: fromY - uy * back },
      { x: fromX - px * (width * 0.24 - flutter), y: fromY - py * (width * 0.24 - flutter) },
      { x: toX - ux * width * 0.16 - px * width * 0.52, y: toY - uy * width * 0.16 - py * width * 0.52 },
    ],
    "#f97316",
    alpha * 0.16,
    "#fed7aa",
    alpha * 0.18,
    2,
    z,
    "add",
  );
  host.drawGfxPath(
    [
      { x: toX - ux * width * 0.22 + px * width * 0.28, y: toY - uy * width * 0.22 + py * width * 0.28 },
      { x: fromX + px * width * 0.06, y: fromY + py * width * 0.06 },
      { x: fromX - ux * back * 0.58, y: fromY - uy * back * 0.58 },
      { x: fromX - px * width * 0.08, y: fromY - py * width * 0.08 },
      { x: toX - ux * width * 0.22 - px * width * 0.24, y: toY - uy * width * 0.22 - py * width * 0.24 },
    ],
    "#fde68a",
    alpha * 0.16,
    "#fff7ed",
    alpha * 0.18,
    1,
    z + 1,
    "add",
  );
  host.drawGfxLine(fromX, fromY, toX - ux * width * 0.32, toY - uy * width * 0.32, Math.max(3, width * 0.18), "#fff7ed", alpha * 0.26, z + 2, "add");
  return true;
}

function drawMeteorRock(host: SkillEffectRendererHost, x: number, y: number, angle: number, size: number, alpha: number, z: number, phase = 0): boolean {
  if (!host.drawGfxPath) return false;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  host.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.62, size * 1.02, phase), "#f97316", alpha * 0.12, "#fed7aa", alpha * 0.16, 2, z - 1, "add");
  host.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.28, size * 0.78, phase + 0.17), "#3f1f13", alpha * 0.92, "#fed7aa", alpha * 0.54, 2.6, z, "normal");
  if (host.drawGfxLine) {
    host.drawGfxLine(x - ux * size * 0.42 - px * size * 0.2, y - uy * size * 0.42 - py * size * 0.2, x + ux * size * 0.28 + px * size * 0.12, y + uy * size * 0.28 + py * size * 0.12, 2.4, "#f97316", alpha * 0.38, z + 1, "add");
    host.drawGfxLine(x - ux * size * 0.12 + px * size * 0.28, y - uy * size * 0.12 + py * size * 0.28, x + ux * size * 0.36 + px * size * 0.08, y + uy * size * 0.36 + py * size * 0.08, 1.6, "#fde68a", alpha * 0.28, z + 2, "add");
  }
  return true;
}

function drawMeteorFragments(host: SkillEffectRendererHost, x: number, y: number, radius: number, alpha: number, z: number, phase = 0): void {
  if (!host.drawGfxPath) return;
  for (let i = 0; i < 8; i += 1) {
    const angle = phase * 0.32 + (Math.PI * 2 * i) / 8;
    const dist = radius * (0.26 + (i % 3) * 0.08);
    const cx = x + Math.cos(angle) * dist;
    const cy = y + Math.sin(angle) * dist * 0.64;
    const size = 5 + (i % 3) * 2;
    host.drawGfxPath(meteorRockPoints(cx, cy, angle, size * 1.25, size * 0.74, phase + i), i % 2 ? "#7c2d12" : "#3f1f13", alpha * 0.36, "#fed7aa", alpha * 0.24, 1.2, z + i, "normal");
  }
}

function drawMeteorLandingShadow(host: SkillEffectRendererHost, x: number, y: number, radius: number, fall: number, impact: number, alpha: number, z: number): void {
  const shadowAlpha = alpha * Math.max(0, 1 - impact * 0.85) * (0.05 + fall * 0.18);
  const shadowRadius = radius * (0.24 + fall * 0.46);
  host.drawGfxCircle?.(x, y + radius * 0.08, shadowRadius, "#000000", shadowAlpha, "#7c2d12", alpha * fall * 0.08, 1.5, z, "normal", 34);
  host.drawGfxCircle?.(x, y + radius * 0.08, shadowRadius * 0.58, "#0b0604", shadowAlpha * 0.9, "#f97316", alpha * fall * 0.06, 1, z + 1, "add", 24);
}

function drawMeteorImpactBloom(host: SkillEffectRendererHost, x: number, y: number, radius: number, impact: number, alpha: number, z: number, phase: number): void {
  if (impact <= 0) return;
  const flash = Math.max(0, 1 - impact);
  host.drawGfxCircle?.(x, y, radius * (0.28 + impact * 0.2), "#fff7ed", alpha * flash * 0.22, "#fed7aa", alpha * flash * 0.62, 5, z + 8, "add", 24);
  host.drawGfxCircle?.(x, y, radius * (0.48 + impact * 0.54), "#7c2d12", alpha * (0.12 - impact * 0.05), "#f97316", alpha * (0.36 - impact * 0.18), 5, z + 9, "add", 42);
  host.drawGfxImpactBurst?.(x, y, radius * (0.62 + impact * 0.42), "#f97316", alpha * (0.58 - impact * 0.16), z + 16, phase, 16);
  host.drawGfxSparkSpray?.(x, y, radius * (0.7 + impact * 0.42), "#fde68a", alpha * (0.42 - impact * 0.12), z + 24, 18, phase * 4.2);
  drawMeteorFragments(host, x, y, radius * (0.52 + impact * 0.24), alpha * Math.min(1, impact * 1.4), z + 28, phase * 4);
}

function meteorFallEndProgress(effect: SkillEffectView, fallback = 0.72): number {
  const duration = Math.max(0.1, Number(effect.duration || effect.ttl || 0));
  const impactAt = Math.max(0, Number(effect.impactAt || effect.fallTime || 0));
  if (!duration || !impactAt) return fallback;
  return Math.max(0.2, Math.min(0.92, impactAt / duration));
}

function isMeteorFallEffect(context: StyledSkillContext): boolean {
  const s = String(context.s || "").toLowerCase();
  const kind = String(context.kind || context.effect?.kind || "").toLowerCase();
  if (s.includes("meteor_impact")) return false;
  return kind === "meteor" || s.includes("meteor_call") || s.includes("meteor_fall");
}

export function fallbackEffectEndpoints(effect: SkillEffectView, radius: number, angle: number): SkillEffectEndpoint {
  const range = Math.max(radius, Number(effect.range || effect.distance || radius));
  return {
    fromX: effect.x,
    fromY: effect.y,
    toX: effect.x + Math.cos(angle) * range,
    toY: effect.y + Math.sin(angle) * range,
  };
}

export function createStyledSkillContext(
  host: SkillEffectRendererHost,
  effect: SkillEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: unknown,
): StyledSkillContext | null {
  const s = normalizeSkillStyle(style);
  if (!s) return null;
  const kind = effect.kind || "";
  const styleInfo = classifyEffectStyle(s, kind);
  const angle = Number(effect.angle || 0);
  const phase = skillEffectPhase(progress);
  const effectRadius = Math.max(radius, Number(effect.rangeRadius || effect.radius || radius));
  const end = host.effectEndpoints
    ? host.effectEndpoints(effect, radius, angle)
    : fallbackEffectEndpoints(effect, radius, angle);
  return {
    effect,
    progress,
    alpha,
    radius,
    color,
    s,
    styleInfo,
    kind,
    angle,
    peak: phase.peak,
    pulse: phase.pulse,
    effectRadius,
    end,
    z: effect.y + 108,
  };
}

export function shouldRenderStyledSkill(style: unknown): boolean {
  return normalizeSkillStyle(style).length > 0;
}

export function renderWarriorImpactEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, kind, radius, color, s, angle, peak, progress, alpha, z } = context;
  if (kind !== "impact" || !(s.includes("shield_slam") || s.includes("cleave_impact") || s.includes("blade_impact") || s.includes("spin_impact"))) {
    return false;
  }
  const hitRadius = Math.max(34, Number(effect.radius || radius));
  const hitAngle = Number.isFinite(effect.angle) ? Number(effect.angle) : Number(effect.seed || angle);
  if (s.includes("shield_slam")) {
    host.drawGfxShieldWall(effect.x - Math.cos(hitAngle) * hitRadius * 0.16, effect.y - Math.sin(hitAngle) * hitRadius * 0.16, hitAngle, hitRadius * (1.08 + peak * 0.08), "#f97316", alpha * 0.72, z + 4, true);
    host.drawGfxShieldCrash(effect.x + Math.cos(hitAngle) * hitRadius * 0.24, effect.y + Math.sin(hitAngle) * hitRadius * 0.24, hitAngle, hitRadius * 0.86, "#f97316", alpha * 0.58, z + 12, progress);
  } else if (s.includes("cleave_impact")) {
    const originX = effect.x - Math.cos(hitAngle) * hitRadius * 0.22;
    const originY = effect.y - Math.sin(hitAngle) * hitRadius * 0.22;
    host.drawGfxCleaveRibbon(originX, originY, hitRadius * 0.26, hitRadius * 1.05, hitAngle - 0.78, hitAngle + 0.42, "#f97316", alpha * 0.14, "#fff7ed", alpha * 0.34, 3, z + 2, "add", 12);
    host.drawGfxSparkSpray(effect.x, effect.y, hitRadius * 0.9, "#fde68a", alpha * 0.24, z + 9, 7, progress * 3, hitAngle, Math.PI * 0.76);
  } else {
    host.drawGfxImpactBurst(effect.x, effect.y, hitRadius * 0.85, color || "#f97316", alpha * 0.28, z + 4, progress, s.includes("spin") ? 10 : 7);
  }
  return true;
}

export function renderWarriorShieldChargeEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, end, z } = context;
  if (!s.includes("shield_charge")) return false;
  const width = Math.max(66, Number(effect.contactRadius || 64) * 1.02);
  const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
  const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
  const rawTravel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
  const travel = rawTravel * rawTravel * (3 - 2 * rawTravel);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const headX = end.fromX + (end.toX - end.fromX) * travel;
  const headY = end.fromY + (end.toY - end.fromY) * travel;
  const shieldX = headX + ux * width * 0.34;
  const shieldY = headY + uy * width * 0.34;
  const laneAlpha = alpha * (0.32 + peak * 0.08);

  host.drawGfxLine(end.fromX, end.fromY, headX, headY, width * 0.34, "#160b07", alpha * 0.08, z - 18, "add");
  for (let side = -1; side <= 1; side += 2) {
    const offset = width * 0.34 * side;
    host.drawGfxLine(end.fromX + px * offset, end.fromY + py * offset, headX + px * offset * 0.52, headY + py * offset * 0.52, 4, "#fde68a", laneAlpha * 0.44, z - 8 + side, "add");
  }
  host.drawGfxDashDust?.(end.fromX, end.fromY, headX, headY, width * 0.46, angle, "#caa35a", alpha * 0.34, z - 14, progress, { charge: true, long: true });
  host.drawGfxShieldPlow(shieldX, shieldY, angle, width * 0.86, "#f97316", alpha * (0.84 + peak * 0.08), z + 6, progress);
  host.drawGfxLine(shieldX - ux * width * 0.56, shieldY - uy * width * 0.56, shieldX + ux * width * 0.28, shieldY + uy * width * 0.28, 5, "#fff7ed", alpha * 0.32, z + 14, "add");
  if (travel >= 0.92) {
    host.drawGfxShieldCrash(end.toX, end.toY, angle, width * 0.78, "#f97316", alpha * Math.max(0.2, 1 - (progress - moveDuration / fullDuration) * 3), z + 18, progress);
  }
  return true;
}

export function renderWarriorSpinEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, angle, peak, z, kind, s } = context;
  if (kind !== "spin") return false;
  if (s.includes("warrior_forward_whirlwind_launch")) return false;
  const spinRadius = Math.max(120, Number(effect.rangeRadius || effect.radius || radius));
  const t = Math.max(0, Math.min(1, progress));
  const fade = Math.max(0, 1 - Math.max(0, t - 0.82) / 0.18);
  const activeAlpha = alpha * fade * (0.76 + peak * 0.18);
  const swirlRadius = Math.max(92, Math.min(164, spinRadius * 0.72));
  const phase = Number(effect.seed || 0) * 0.13 + angle * 0.22 + t * Math.PI * 4.6;

  host.drawGfxCircle(effect.x, effect.y, swirlRadius * 0.88, "#160b07", activeAlpha * 0.04, "#f97316", activeAlpha * 0.18, 3, z - 18, "add", 64);
  host.drawGfxCircle(effect.x, effect.y, swirlRadius * 0.42, "#160b07", activeAlpha * 0.025, "#fde68a", activeAlpha * 0.16, 2, z - 14, "add", 40);
  for (let i = 0; i < 3; i += 1) {
    const a = phase + (Math.PI * 2 * i) / 3;
    const start = a - 0.58;
    const end = a + 0.98;
    const outer = swirlRadius * (0.82 + (i % 2) * 0.03);
    const inner = swirlRadius * 0.54;
    host.drawGfxCleaveRibbon(effect.x, effect.y, inner, outer, start, end, "#fff7ed", activeAlpha * 0.13, "#fde68a", activeAlpha * 0.28, 3, z + i * 8, "add", 14);
    host.drawGfxArc(effect.x, effect.y, outer * 1.01, start + 0.08, end - 0.05, 6, "#fff7ed", activeAlpha * 0.42, z + 4 + i * 8, "add", 12);
    host.drawGfxArc(effect.x, effect.y, inner * 0.92, start + 0.26, end - 0.22, 3, "#f97316", activeAlpha * 0.2, z + 5 + i * 8, "add", 9);
  }
  host.drawGfxSparkSpray(effect.x, effect.y, swirlRadius * 0.5, "#fde68a", activeAlpha * 0.12, z + 42, 6, phase * 0.35);
  return true;
}

export function renderWarriorForwardWhirlwindLaunchEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, color, angle, peak, z } = context;
  const launchRadius = Math.max(72, Math.min(180, Number(effect.radius || effect.rangeRadius || radius || 110)));
  const t = Math.max(0, Math.min(1, progress));
  const fade = Math.max(0, 1 - Math.max(0, t - 0.78) / 0.22);
  const activeAlpha = alpha * fade * (0.72 + peak * 0.16);
  const tint = color || "#f97316";
  const phase = angle + t * Math.PI * 2.25 + Number(effect.seed || 0) * 0.13;

  host.drawGfxCircle(effect.x, effect.y, launchRadius * (0.45 + t * 0.32), "#160b07", activeAlpha * 0.035, tint, activeAlpha * 0.18, 2.5, z - 12, "add", 44);
  host.drawGfxCircle(effect.x, effect.y, launchRadius * (0.24 + peak * 0.08), "#160b07", activeAlpha * 0.035, "#fde68a", activeAlpha * 0.12, 2, z - 8, "add", 28);
  for (let i = 0; i < 3; i += 1) {
    const r = launchRadius * (0.42 + i * 0.16);
    const start = phase + i * 1.18;
    const end = start + 0.95 + peak * 0.22;
    host.drawGfxArc(effect.x, effect.y, r, start, end, 5 - i, i === 0 ? "#fff7ed" : tint, activeAlpha * (0.24 - i * 0.04), z + i, "add", 12);
  }
  host.drawGfxLine(effect.x - Math.cos(angle) * launchRadius * 0.38, effect.y - Math.sin(angle) * launchRadius * 0.38, effect.x + Math.cos(angle) * launchRadius * 0.58, effect.y + Math.sin(angle) * launchRadius * 0.58, 4, tint, activeAlpha * 0.14, z + 8, "add");
  return true;
}

export function renderWarriorTauntRingEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, z, peak } = context;
  const tauntRadius = Math.max(92, Number(effect.rangeRadius || effect.radius || radius));
  const t = Math.max(0, Math.min(1, progress));
  const ease = 1 - Math.pow(1 - t, 2.8);
  const fade = Math.max(0, 1 - Math.max(0, t - 0.76) / 0.24);
  const ringRadius = tauntRadius * (0.16 + ease * 0.84);
  const ringAlpha = alpha * fade;
  const pulse = 0.72 + peak * 0.28;

  host.drawGfxCircle(effect.x, effect.y, ringRadius, "#ef4444", ringAlpha * 0.035, "#ef4444", ringAlpha * 0.46, 5, z + 22, "add", 72);
  host.drawGfxCircle(effect.x, effect.y, ringRadius * 0.62, "#160b07", ringAlpha * 0.025, "#fde68a", ringAlpha * 0.24, 2, z + 21, "add", 54);
  for (let i = 0; i < 12; i += 1) {
    const a = (Math.PI * 2 * i) / 12;
    const from = ringRadius * 0.76;
    const to = ringRadius * (0.96 + (i % 3) * 0.025);
    host.drawGfxLine(
      effect.x + Math.cos(a) * from,
      effect.y + Math.sin(a) * from,
      effect.x + Math.cos(a) * to,
      effect.y + Math.sin(a) * to,
      i % 3 === 0 ? 5 : 3,
      i % 2 ? "#fde68a" : "#ef4444",
      ringAlpha * (0.22 + pulse * 0.1),
      z + 34 + i,
      "add",
    );
  }
  const iconAlpha = ringAlpha * Math.max(0.35, 1 - t * 0.35);
  host.drawGfxLine(effect.x, effect.y - 34, effect.x, effect.y - 9, 8, "#fff7ed", iconAlpha * 0.8, z + 48, "add");
  host.drawGfxCircle(effect.x, effect.y + 8, 5.5, "#fff7ed", iconAlpha * 0.72, "#fde68a", iconAlpha * 0.32, 1, z + 49, "add", 10);
  return true;
}

export function renderWarriorSlamEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, radius, s, angle, peak, z } = context;
  if (!(s.includes("shield") || s.includes("slam"))) return false;
  const slamRadius = Math.max(48, Number(effect.rangeRadius || effect.radius || radius));
  host.drawGfxShieldProfile(effect.x + Math.cos(angle) * slamRadius * 0.34, effect.y + Math.sin(angle) * slamRadius * 0.34, angle, slamRadius * 1.24, "#f97316", alpha * 0.88, z, true);
  for (let i = 0; i < 7; i += 1) {
    const spread = (i - 3) * 0.16;
    const a = angle + spread;
    const sx = effect.x + Math.cos(a) * slamRadius * 0.22;
    const sy = effect.y + Math.sin(a) * slamRadius * 0.22;
    const tx = effect.x + Math.cos(a) * slamRadius * (0.74 + peak * 0.14);
    const ty = effect.y + Math.sin(a) * slamRadius * (0.74 + peak * 0.14);
    host.drawGfxLine(sx, sy, tx, ty, i === 3 ? 8 : 4, "#fde68a", alpha * (i === 3 ? 0.46 : 0.28), z + i, "add");
  }
  return true;
}

export function renderWarriorBodyEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, color, s } = context;
  if (!(s.includes("warrior") || s.includes("cleave") || s.includes("shield_slam"))) return false;
  if (s.includes("warrior_forward_whirlwind_launch")) return renderWarriorForwardWhirlwindLaunchEffect(host, context);
  if (renderWarriorSpinEffect(host, context)) return true;
  if (renderWarriorSlamEffect(host, context)) return true;
  host.renderWarriorConeEffect(effect, progress, alpha, color, s.includes("cleave"));
  return true;
}

export function renderWarriorStyledSkillEffect(host: WarriorSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const { s } = context;
  if (s.includes("taunt")) {
    return renderWarriorTauntRingEffect(host, context);
  }
  return renderWarriorImpactEffect(host, context) || renderWarriorShieldChargeEffect(host, context) || renderWarriorBodyEffect(host, context);
}

export function renderRangerArrowRainEffect(host: RangerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, kind, angle, end, z, s } = context;
  if (!s.includes("arrow_rain")) return false;
  const rainRadius = effectRadius;
  if (s.includes("arrow_rain_launch")) {
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const lift = Math.max(170, Math.min(420, dist * 0.44 + rainRadius * 0.52));
    const apexX = end.fromX + dx * 0.5;
    const apexY = Math.min(end.fromY, end.toY) - lift;
    const point = (t: number, lane = 0): { x: number; y: number } => {
      const one = 1 - t;
      return {
        x: one * one * end.fromX + 2 * one * t * apexX + t * t * end.toX + px * lane,
        y: one * one * end.fromY + 2 * one * t * apexY + t * t * end.toY + py * lane,
      };
    };
    let prev = point(0);
    for (let i = 1; i <= 20; i += 1) {
      const p = point(i / 20);
      host.lineFx("beam", prev.x, prev.y, p.x, p.y, 4, "#f1d08b", alpha * 0.24, z - 10 + i, "add");
      prev = p;
    }
    const launch = Math.max(0.05, Math.min(0.94, progress * 0.98));
    const head = point(launch);
    const ahead = point(Math.min(1, launch + 0.04));
    const len = Math.hypot(ahead.x - head.x, ahead.y - head.y) || 1;
    const ax = (ahead.x - head.x) / len;
    const ay = (ahead.y - head.y) / len;
    host.fx("fx-arrow-rain", head.x + ax * 2, head.y + ay * 2, 0.42, 0.52, "#fff7ed", alpha * 0.78, z + 12, Math.atan2(ay, ax), "add");
    return true;
  }
  const warn = kind === "warning";
  if (warn) return true;
  const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
  if (rainProgress <= 0) return true;
  host.drawGfxCircle(effect.x, effect.y, rainRadius, "#4a3415", alpha * 0.025, "#f1d08b", alpha * 0.28, 2, z - 12, "add", 56);
  host.drawGfxCircle(effect.x, effect.y, rainRadius * 0.72, "#000000", 0, "#fde68a", alpha * 0.09, 1.2, z - 11, "add", 42);
  const dropCount = 8;
  for (let i = 0; i < dropCount; i += 1) {
    const lane = (i - (dropCount - 1) / 2) * rainRadius * 0.12 + (host.noise(i, effect.x) - 0.5) * rainRadius * 0.1;
    const fall = (rainProgress * 1.35 + i / dropCount) % 1;
    const x = effect.x + lane;
    const landY = effect.y + (host.noise(i * 3, effect.y) - 0.5) * rainRadius * 0.28;
    const y = landY - rainRadius * 2.05 + fall * rainRadius * 2.32;
    const slant = (i % 2 ? -1 : 1) * 2;
    host.lineFx("beam", x - slant, y - 40, x + slant, y + 28, i % 3 === 0 ? 4 : 3, i % 3 === 0 ? "#fff7ed" : "#f1d08b", alpha * (0.4 + rainProgress * 0.28), z + i, "add");
  }
  return true;
}

export function renderRangerVolleyEffect(host: RangerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, end, z } = context;
  if (!(s.includes("ranger_barrage") || s.includes("arrow_fan") || s.includes("fire_arrow") || s.includes("piercing") || s.includes("laser_arrow") || s.includes("poison_volley") || s.includes("poison_arrow"))) {
    return false;
  }
  if (s.includes("laser_arrow")) {
    const beamWidth = Math.max(26, Number(effect.width || 34));
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const travel = Math.max(0.08, Math.min(1, progress * 1.42));
    const tail = Math.max(0, travel - 0.46);
    const headX = end.fromX + dx * travel;
    const headY = end.fromY + dy * travel;
    const tailX = end.fromX + dx * tail;
    const tailY = end.fromY + dy * tail;
    host.lineFx("beam", tailX, tailY, headX, headY, beamWidth * 1.72, "#12301f", alpha * 0.2, z - 10, "add");
    host.lineFx("beam", tailX, tailY, headX, headY, beamWidth, "#f1d08b", alpha * 0.84, z - 2, "add");
    host.lineFx("beam", tailX, tailY, headX, headY, Math.max(7, beamWidth * 0.28), "#f8fff1", alpha * 0.88, z + 2, "add");
    host.fx("fx-impact-star", headX, headY, 0.42 + peak * 0.14, 0.42 + peak * 0.14, "#f8fff1", alpha * 0.58, z + 6, progress * 2.4, "add");
    if (travel > 0.86) {
      host.fx("fx-impact-star", end.toX, end.toY, 0.5 + peak * 0.16, 0.5 + peak * 0.16, "#f8fff1", alpha * 0.46, z + 8, progress * 2.4, "add");
    }
  } else if (s.includes("piercing")) {
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const travel = Math.max(0.1, Math.min(1, progress * 1.55));
    const tail = Math.max(0, travel - 0.34);
    const headX = end.fromX + dx * travel;
    const headY = end.fromY + dy * travel;
    const tailX = end.fromX + dx * tail;
    const tailY = end.fromY + dy * tail;
    host.lineFx("beam", tailX, tailY, headX, headY, 13, "#f1d08b", alpha * 0.3, z - 8, "add");
    host.fx("fx-pierce-lance", headX, headY, 1.02 + peak * 0.2, 0.92, "#f1d08b", alpha * 0.88, z, angle, "add");
    if (travel > 0.86) {
      host.fx("fx-impact-star", end.toX, end.toY, 0.42, 0.42, "#fde68a", alpha * 0.5, z + 3, progress * 1.4, "add");
    }
  } else {
    const poisonTint = s.includes("poison") ? "#bef264" : s.includes("fire") ? "#fb923c" : "#f1d08b";
    host.fx("fx-arrow-fan", effect.x, effect.y, 0.98 + peak * 0.16, 0.9 + peak * 0.1, poisonTint, alpha * 0.26, z - 3, angle, "add");
    if (s.includes("poison")) {
      host.fx("fx-poison-cloud", effect.x + Math.cos(angle) * 42, effect.y + Math.sin(angle) * 22, 0.46, 0.36, "#bef264", alpha * 0.38, z + 2, progress, "add");
    } else if (s.includes("fire")) {
      host.fx("fx-impact-star", effect.x + Math.cos(angle) * 40, effect.y + Math.sin(angle) * 20, 0.34, 0.3, "#fed7aa", alpha * 0.34, z + 2, progress, "add");
    }
  }
  return true;
}

export function renderRangerStyledSkillEffect(host: RangerSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return renderRangerArrowRainEffect(host, context) || renderRangerVolleyEffect(host, context);
}

export function renderMageFrostEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, pulse, peak, z, s } = context;
  if (!s.includes("frost")) return false;
  const frostRadius = effectRadius;
  if (s.includes("frost_breath")) {
    host.ring(effect.x, effect.y, frostRadius * 0.86, "#93c5fd", alpha * 0.09, 2);
    host.ring(effect.x, effect.y, frostRadius * 0.58, "#dbeafe", alpha * 0.035, 1);
    return true;
  }
  const snap = progress < 0.24 ? 1.24 : 1.08 - (progress - 0.24) * 0.28;
  host.fx("fx-frost-snap", effect.x, effect.y, frostRadius / 86 * snap, frostRadius / 86 * snap, "#dbeafe", alpha * 0.95, z, progress * 0.15, "add");
  host.fx("fx-frost-shards", effect.x, effect.y, frostRadius / 94 * pulse, frostRadius / 94 * pulse, "#93c5fd", alpha * 0.45, z - 2, -progress * 0.35, "add");
  host.ring(effect.x, effect.y, frostRadius * (0.72 + peak * 0.1), "#93c5fd", alpha * 0.25, 4);
  return true;
}

export function renderMageMeteorEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, peak, z, s } = context;
  if (!isMeteorFallEffect(context)) return false;
  const meteorRadius = effectRadius;
  const fallEnd = meteorFallEndProgress(effect);
  const fallT = Math.max(0, Math.min(1, progress / fallEnd));
  const fall = fallT * fallT * (3 - fallT * 2);
  const impact = Math.max(0, Math.min(1, (progress - fallEnd) / (1 - fallEnd)));
  const startX = effect.x - meteorRadius * 0.78;
  const startY = effect.y - meteorRadius * 3.15;
  const x = startX + (effect.x - startX) * fall;
  const y = startY + (effect.y - startY) * fall;
  const angle = Math.atan2(effect.y - startY, effect.x - startX);
  const meteorZ = z + 4 + fall * 10;
  drawMeteorLandingShadow(host, effect.x, effect.y, meteorRadius, fall, impact, alpha, z - 18);
  host.drawGfxArc?.(effect.x, effect.y, meteorRadius * (0.82 + impact * 0.08), Math.PI * 0.12, Math.PI * 0.92, 3.5, "#f97316", alpha * Math.max(0.04, 0.18 - impact * 0.12), z - 16, "add", 12);
  host.drawGfxArc?.(effect.x, effect.y, meteorRadius * (0.82 + impact * 0.08), -Math.PI * 0.92, -Math.PI * 0.12, 3.5, "#f97316", alpha * Math.max(0.04, 0.18 - impact * 0.12), z - 16, "add", 12);
  if (impact <= 0.05) {
    const tailX = x - Math.cos(angle) * meteorRadius * (0.66 + fall * 0.16);
    const tailY = y - Math.sin(angle) * meteorRadius * (0.66 + fall * 0.16);
    if (!drawMeteorTrail(host, tailX, tailY, x, y, meteorRadius * (0.2 + fall * 0.08), alpha, meteorZ - 8, progress)) {
      host.lineFx("beam", startX, startY, x, y, 18, "#f97316", alpha * 0.22, meteorZ - 8, "add");
    }
  } else {
    host.fx("fx-fire-pool", effect.x, effect.y + 12, meteorRadius / 78, meteorRadius / 90, "#f97316", alpha * Math.max(0.2, 0.48 - impact * 0.18), z + 1, 0, "add");
  }
  drawMeteorImpactBloom(host, effect.x, effect.y, meteorRadius * (0.95 + peak * 0.05), impact, alpha, z + 8, progress * 2.6);
  return true;
}

export function renderMageChainEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { progress, alpha, s, styleInfo, peak, end, z } = context;
  if (!styleInfo.lightningSkill) {
    return false;
  }
  const empowered = s.includes("empowered_current");
  const tint = empowered ? "#ef4444" : "#9ee6ff";
  const core = empowered ? "#fee2e2" : "#dbeafe";
  if (host.drawGfxLightning) {
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.9, z, empowered ? 10 : 9, 9, empowered ? 20 : 22, progress * 1.6);
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.18, z + 4, 3, 5, 14, progress + 0.41);
  } else {
    host.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, empowered ? 20 : 18, tint, alpha * 0.96, z, "add");
    host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 6, core, alpha * 0.28, z - 2, "add");
  }
  host.fx("fx-impact-star", end.toX, end.toY, 0.46 + peak * 0.12, 0.46 + peak * 0.12, core, alpha * 0.62, z + 4, progress * 2, "add");
  return true;
}

export function renderMageStarBurstEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, pulse, z, s } = context;
  if (!s.includes("star_burst")) return false;
  host.fx("fx-star-burst", effect.x, effect.y, effectRadius / 74 * pulse, effectRadius / 74 * pulse, "#dbeafe", alpha * 0.86, z, progress * 1.2, "add");
  host.fx("fx-impact-star", effect.x, effect.y, effectRadius / 92, effectRadius / 92, "#8d7cae", alpha * 0.44, z - 4, -progress, "add");
  return true;
}

export function renderMageBlinkEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, pulse, z, s } = context;
  if (!s.includes("blink")) return false;
  host.fx("fx-star-burst", effect.x, effect.y, effectRadius / 92 * pulse, effectRadius / 92 * pulse, "#93c5fd", alpha * 0.62, z, progress * 1.4, "add");
  host.fx("fx-smoke", effect.x, effect.y, effectRadius / 90, effectRadius / 120, "#3b82f6", alpha * 0.32, z - 8, 0, "add");
  return true;
}

export function renderMageStyledSkillEffect(host: MageSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return (
    renderMageFrostEffect(host, context) ||
    renderMageMeteorEffect(host, context) ||
    renderMageChainEffect(host, context) ||
    renderMageStarBurstEffect(host, context) ||
    renderMageBlinkEffect(host, context)
  );
}

export function renderEngineerBeamEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, styleInfo, peak, end, z } = context;
  const singleLaser = s.includes("single_laser");
  const laserModuleBeam = s.includes("engineer_laser_module_beam") || s.includes("mecha_giant_laser");
  const mechaLaser = styleInfo.mechaMuzzle || laserModuleBeam;
  if (!(singleLaser || mechaLaser || s.includes("turret_fire") || s.includes("rail_turret") || s.includes("turret_laser") || s.includes("drone_laser"))) {
    return false;
  }
  const giant = laserModuleBeam;
  const rail = mechaLaser || s.includes("rail") || s.includes("turret_laser");
  if (singleLaser) {
    const beamWidth = Math.max(3, Number(effect.width || 4.5));
    const effectColor = (effect as { color?: string }).color;
    const tint = effectColor || "#67e8f9";
    const core = "#f8fafc";
    if (host.drawGfxLine) {
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 5, "#06131f", alpha * 0.26, z - 5, "add");
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.82, z - 2, "add");
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(1.5, beamWidth * 0.32), core, alpha * 0.9, z + 1, "add");
      host.drawGfxCircle?.(end.fromX, end.fromY, beamWidth * (1.45 + peak * 0.28), tint, alpha * 0.18, core, alpha * 0.24, 1.5, z + 2, "add", 8);
      host.drawGfxCircle?.(end.toX, end.toY, beamWidth * (2.15 + peak * 0.48), tint, alpha * 0.18, core, alpha * 0.34, 2, z + 4, "add", 10);
    } else {
      host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.82, z, "add");
    }
    return true;
  }
  if (mechaLaser) {
    const beamWidth = Math.max(giant ? 44 : 13, Number(effect.width || (giant ? 56 : 16)));
    const effectColor = (effect as { color?: string }).color;
    const tint = giant ? (effectColor || "#c084fc") : (effectColor || "#67e8f9");
    const core = giant ? "#f5d0fe" : "#f8fafc";
    if (host.drawGfxLine) {
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth * (giant ? 1.75 : 1.45), "#06131f", alpha * (giant ? 0.34 : 0.24), z - 8, "add");
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth * (giant ? 0.92 : 0.78), tint, alpha * (giant ? 0.78 : 0.68), z - 4, "add");
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(giant ? 9 : 4, beamWidth * (giant ? 0.22 : 0.18)), core, alpha * 0.9, z - 1, "add");
      host.drawGfxCircle?.(end.fromX, end.fromY, Math.max(8, beamWidth * (giant ? 0.34 : 0.28)) * (1 + peak * 0.12), tint, alpha * 0.32, core, alpha * 0.48, 2, z + 2, "add", 10);
      if (giant) host.drawGfxImpactBurst?.(end.toX, end.toY, beamWidth * (0.76 + peak * 0.12), tint, alpha * 0.28, z + 8, progress * 2.4, 8);
    } else {
      host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.78, z, "add");
    }
    return true;
  }
  if (rail || !host.drawGfxLightning) {
    host.lineFx(rail ? "beam" : "fx-lightning", end.fromX, end.fromY, end.toX, end.toY, rail ? 12 : 10, rail ? "#fde68a" : "#9ee6ff", alpha * 0.72, z, "add");
  } else {
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#67e8f9", alpha * 0.78, z, 7, 7, 18, progress * 1.6);
  }
  host.fx("fx-impact-star", effect.x, effect.y, 0.36 + peak * 0.1, 0.36 + peak * 0.1, "#9ee6ff", alpha * 0.52, z + 2, progress * 2, "add");
  return true;
}

export function renderEngineerMechaEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, peak, effectRadius, z } = context;
  if (!(s.includes("mecha_board") || s.includes("mecha_boot"))) return false;

  if (s.includes("mecha_boot")) {
    const thrustAlpha = alpha * (1 - progress * 0.16);
    host.drawGfxCircle?.(effect.x, effect.y, effectRadius * (0.34 + progress * 0.34), "#0f172a", 0.16 * thrustAlpha, "#d6b76d", 0.5 * thrustAlpha, 3, z + 2, "add", 24);
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI * 0.5 + (i - 2) * 0.28;
      const len = effectRadius * (0.62 + progress * 1.05 + i * 0.035);
      host.drawGfxLine?.(effect.x, effect.y, effect.x + Math.cos(a) * len, effect.y + Math.sin(a) * len, i === 2 ? 8 : 5, i % 2 ? "#67e8f9" : "#f97316", thrustAlpha * (0.24 + i * 0.025), z + 4 + i, "add");
    }
    host.drawGfxSparkSpray?.(effect.x, effect.y, effectRadius * 0.68, "#f8f3e9", thrustAlpha * 0.34, z + 12, 12, progress * 2.6);
    host.fx("fx-impact-star", effect.x, effect.y, 0.72 + peak * 0.18, 0.72 + peak * 0.18, "#67e8f9", thrustAlpha * 0.52, z + 18, progress * 2.8, "add");
    return true;
  }

  const lock = 1 - Math.pow(1 - Math.min(1, progress * 1.5), 3);
  const radius = Math.max(70, effectRadius);
  const spin = progress * Math.PI * 1.8;
  host.drawGfxCircle?.(effect.x, effect.y + radius * 0.16, radius * 0.72, "#0f172a", alpha * 0.18, "#d6b76d", alpha * 0.26, 2, z - 4, "add", 36);
  host.drawGfxRuneRing?.(effect.x, effect.y, radius * (0.34 + lock * 0.5), "#d6b76d", alpha * 0.48, z + 1, spin, 6);
  host.drawGfxGear?.(effect.x, effect.y, radius * (0.24 + lock * 0.28), "#67e8f9", alpha * 0.34, z + 2, -spin * 0.7, 10);
  for (let i = 0; i < 6; i += 1) {
    const a = spin + (Math.PI * 2 * i) / 6;
    const slide = radius * (0.62 - lock * 0.26);
    const cx = effect.x + Math.cos(a) * slide;
    const cy = effect.y + Math.sin(a) * slide * 0.72;
    const ux = Math.cos(a + Math.PI * 0.5);
    const uy = Math.sin(a + Math.PI * 0.5);
    const px = -uy;
    const py = ux;
    const half = radius * 0.08;
    const depth = radius * 0.14;
    host.drawGfxPath?.(
      [
        { x: cx + ux * depth - px * half, y: cy + uy * depth - py * half },
        { x: cx + ux * depth + px * half, y: cy + uy * depth + py * half },
        { x: cx - ux * depth + px * half * 0.74, y: cy - uy * depth + py * half * 0.74 },
        { x: cx - ux * depth - px * half * 0.74, y: cy - uy * depth - py * half * 0.74 },
      ],
      i % 2 ? "#241a07" : "#3f3426",
      alpha * 0.78,
      i % 2 ? "#d6b76d" : "#67e8f9",
      alpha * 0.72,
      2.4,
      z + 8 + i,
      "normal",
    );
    host.drawGfxLine?.(cx - ux * depth * 0.7, cy - uy * depth * 0.7, effect.x, effect.y, 2.4, "#f8f3e9", alpha * 0.18, z + 5 + i, "add");
  }
  host.drawGfxSparkSpray?.(effect.x, effect.y, radius * (0.56 + lock * 0.28), "#f8f3e9", alpha * 0.38, z + 20, 14, progress * 2.4);
  host.fx("fx-impact-star", effect.x, effect.y, 0.78 + peak * 0.2, 0.78 + peak * 0.2, "#67e8f9", alpha * 0.5, z + 22, progress * 2.4, "add");
  return true;
}

export function renderEngineerMissileEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, peak, effectRadius, angle, z } = context;
  if (!(s.includes("missile") || s.includes("kamikaze"))) return false;
  if (s.includes("explosion")) {
    host.fx("fx-fire-bloom", effect.x, effect.y, effectRadius / 58 * (0.72 + peak * 0.16), effectRadius / 58 * (0.72 + peak * 0.16), "#f97316", alpha * 0.72, z, progress * 1.4, "add");
    host.fx("fx-impact-star", effect.x, effect.y, effectRadius / 96, effectRadius / 96, "#fde68a", alpha * 0.54, z + 4, progress * 2, "add");
  } else {
    host.lineFx("beam", effect.x - Math.cos(angle) * 28, effect.y - Math.sin(angle) * 28, effect.x + Math.cos(angle) * 20, effect.y + Math.sin(angle) * 20, 8, "#f97316", alpha * 0.34, z, "add");
    host.fx("fx-impact-star", effect.x, effect.y, 0.42 + peak * 0.12, 0.42 + peak * 0.12, "#fde68a", alpha * 0.38, z + 2, progress * 2, "add");
  }
  return true;
}

function drawEngineerWrenchGlyph(host: SkillEffectRendererHost, x: number, y: number, angle: number, alpha: number, z: number, scale = 1): boolean {
  if (!host.drawGfxLine || !host.drawGfxCircle) return false;
  const r = Math.max(7, 9 * scale);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const tailX = x - ux * r * 2.25;
  const tailY = y - uy * r * 2.25;
  const neckX = x + ux * r * 0.88;
  const neckY = y + uy * r * 0.88;
  const jawX = x + ux * r * 1.82;
  const jawY = y + uy * r * 1.82;

  host.drawGfxLine(tailX, tailY, neckX, neckY, 9 * scale, "#2b2118", alpha * 0.9, z, "normal");
  host.drawGfxLine(tailX + px * r * 0.05, tailY + py * r * 0.05, neckX + px * r * 0.05, neckY + py * r * 0.05, 5 * scale, "#d6b76d", alpha * 0.82, z + 1, "normal");
  host.drawGfxLine(tailX + px * r * 0.38, tailY + py * r * 0.38, neckX + px * r * 0.16, neckY + py * r * 0.16, 2 * scale, "#fff7ed", alpha * 0.52, z + 2, "add");
  host.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.52, "#2b2118", alpha * 0.66, "#f8fafc", alpha * 0.62, 3, z + 3, "normal", 14);
  host.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.24, "#07111f", alpha * 0.74, "#9ee6ff", alpha * 0.22, 1.5, z + 4, "add", 10);
  host.drawGfxLine(neckX - px * r * 0.38, neckY - py * r * 0.38, jawX - px * r * 0.85, jawY - py * r * 0.85, 6 * scale, "#f8fafc", alpha * 0.74, z + 5, "normal");
  host.drawGfxLine(neckX + px * r * 0.38, neckY + py * r * 0.38, jawX + px * r * 0.85, jawY + py * r * 0.85, 6 * scale, "#f8fafc", alpha * 0.74, z + 6, "normal");
  host.drawGfxLine(jawX - px * r * 0.85, jawY - py * r * 0.85, jawX - px * r * 0.38 + ux * r * 0.34, jawY - py * r * 0.38 + uy * r * 0.34, 4 * scale, "#d6b76d", alpha * 0.7, z + 7, "add");
  host.drawGfxLine(jawX + px * r * 0.85, jawY + py * r * 0.85, jawX + px * r * 0.38 + ux * r * 0.34, jawY + py * r * 0.38 + uy * r * 0.34, 4 * scale, "#d6b76d", alpha * 0.7, z + 8, "add");
  return true;
}

export function renderEngineerDroneBoltEffect(host: SkillEffectRendererHost, context: StyledSkillContext): boolean {
  const { progress, alpha, s, angle, peak, end, z } = context;
  if (!s.includes("drone_bolt")) return false;
  const dx = end.toX - end.fromX;
  const dy = end.toY - end.fromY;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const fly = Math.min(1, Math.max(0, progress * 1.5));
  const spin = progress * Math.PI * 7.8;
  const x = end.fromX + dx * fly;
  const y = end.fromY + dy * fly;
  const shotAngle = Math.atan2(dy, dx);
  const fade = Math.max(0, 1 - Math.max(0, progress - 0.82) / 0.18);
  const drawAlpha = alpha * fade;

  host.drawGfxLine?.(end.fromX, end.fromY, x - ux * 10, y - uy * 10, 5, "#2b2118", drawAlpha * 0.36, z - 3, "normal");
  host.drawGfxLine?.(end.fromX, end.fromY, x - ux * 12, y - uy * 12, 2.5, "#d6b76d", drawAlpha * 0.26, z - 2, "add");
  drawEngineerWrenchGlyph(host, x, y, shotAngle + spin, drawAlpha * (0.9 + peak * 0.08), z + 6, 0.92);
  if (progress > 0.52) {
    const hit = Math.min(1, (progress - 0.52) / 0.26);
    host.drawGfxCircle?.(end.toX, end.toY, 10 + hit * 10 + peak * 3, "#2b2118", alpha * 0.12 * hit, "#d6b76d", alpha * 0.34 * hit, 2, z + 16, "add", 12);
    host.drawGfxLine?.(end.toX - Math.cos(angle) * 12, end.toY - Math.sin(angle) * 12, end.toX + Math.cos(angle) * 16, end.toY + Math.sin(angle) * 16, 4, "#fff7ed", alpha * 0.36 * hit, z + 18, "add");
  }
  return true;
}

export function renderEngineerDroneEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, z } = context;
  if (!s.includes("drone")) return false;
  host.fx("fx-drone", effect.x, effect.y - 8, 0.82 + peak * 0.12, 0.82 + peak * 0.12, "#d6b76d", alpha * 0.86, z, progress * 0.1, "normal");
  if (host.drawGfxLightning) {
    for (let i = 0; i < 3; i += 1) {
      const a = angle + (i - 1) * 0.78 + progress * 1.4;
      host.drawGfxLightning(effect.x, effect.y - 8, effect.x + Math.cos(a) * 34, effect.y - 8 + Math.sin(a) * 24, "#67e8f9", alpha * 0.26, z + 2 + i, 3, 3, 8, progress + i * 0.19);
    }
  } else {
    host.fx("fx-lightning", effect.x, effect.y, 0.58, 0.26, "#9ee6ff", alpha * 0.42, z + 2, angle, "add");
  }
  return true;
}

export function renderEngineerMineEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, peak, effectRadius, z } = context;
  if (!s.includes("shock_mine")) return false;
  host.fx("fx-mine", effect.x, effect.y, 0.94 + peak * 0.18, 0.94 + peak * 0.18, "#9ee6ff", alpha * 0.82, z, progress * 1.4, "add");
  if (host.drawGfxLightning) {
    for (let i = 0; i < 5; i += 1) {
      const a = progress * 2 + (Math.PI * 2 * i) / 5;
      host.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * effectRadius * 0.48, effect.y + Math.sin(a) * effectRadius * 0.48, "#67e8f9", alpha * 0.3, z + 1 + i, 3, 3, 9, progress + i * 0.21);
    }
  } else {
    host.fx("fx-lightning", effect.x, effect.y, effectRadius / 88, 0.62, "#9ee6ff", alpha * 0.56, z + 1, progress * 2.2, "add");
  }
  return true;
}

export function renderEngineerDeviceEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, s, angle, peak, end, z } = context;
  if (!(s.includes("engineer") || s.includes("turret") || s.includes("rail_"))) return false;
  const device = String((effect as { device?: string }).device || "");
  const mine = device.includes("mine");
  const charged = device.includes("charged");
  const tint = mine ? (charged ? "#a78bfa" : "#67e8f9") : "#d6b76d";
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 7, tint, alpha * 0.22, z - 4, "add");
  host.fx(mine ? "fx-mine" : "fx-turret", effect.x, effect.y, 0.78 + peak * 0.14, 0.78 + peak * 0.14, tint, alpha * 0.86, z, angle, mine ? "add" : "normal");
  return true;
}

export function renderEngineerStyledSkillEffect(host: EngineerSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const { s, styleInfo } = context;
  if (!(styleInfo.engineer || styleInfo.basicTechBolt || s.includes("shock_mine"))) {
    return false;
  }
  return (
    renderEngineerMechaEffect(host, context) ||
    renderEngineerBeamEffect(host, context) ||
    renderEngineerMissileEffect(host, context) ||
    renderEngineerDroneBoltEffect(host, context) ||
    renderEngineerDroneEffect(host, context) ||
    renderEngineerMineEffect(host, context) ||
    renderEngineerDeviceEffect(host, context)
  );
}

export function renderPuppetThreadLinesEffect(host: PuppetSkillRendererHost, context: StyledSkillContext): boolean {
  const { alpha, s, end, z } = context;
  if (!(s.includes("puppet") || s.includes("thread"))) return false;
  host.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, s.includes("cage") || s.includes("theater") ? 17 : 10, "#f5d0fe", alpha * 0.74, z, "add");
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, s.includes("cage") ? 10 : 5, "#b985c8", alpha * 0.26, z - 4, "add");
  return true;
}

export function renderPuppetSummonEffect(host: PuppetSkillRendererHost, context: StyledSkillContext): boolean {
  const { alpha, s, peak, end, z } = context;
  if (!(s.includes("summon") || s.includes("puppet_lunge") || s.includes("ambush"))) return false;
  host.fx("fx-puppet", end.toX, end.toY, 0.62 + peak * 0.16, 0.62 + peak * 0.16, "#b985c8", alpha * 0.86, z + 5, 0, "normal");
  return true;
}

export function renderPuppetSlashEffect(host: PuppetSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, s, kind, angle, peak, z } = context;
  if (!(s.includes("slash") || kind === "slash")) return false;
  host.fx("fx-shadow-cut", effect.x, effect.y, 0.92 + peak * 0.18, 0.6 + peak * 0.08, "#f5d0fe", alpha * 0.88, z + 6, angle, "add");
  return true;
}

export function renderPuppetThreadKnotEffect(host: PuppetSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, peak, z } = context;
  host.fx("fx-thread-knot", effect.x, effect.y, 0.52 + peak * 0.12, 0.52 + peak * 0.12, "#f5d0fe", alpha * 0.62, z + 2, progress * 1.8, "add");
  return true;
}

export function renderPuppetStyledSkillEffect(host: PuppetSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const s = context.s;
  if (!(s.includes("puppet") || s.includes("thread"))) return false;
  renderPuppetThreadLinesEffect(host, context);
  renderPuppetSummonEffect(host, context);
  renderPuppetSlashEffect(host, context);
  renderPuppetThreadKnotEffect(host, context);
  return true;
}

export function renderMartialPalmEffect(host: MartialSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, radius, angle, pulse, peak, z, s } = context;
  if (!s.includes("palm")) return false;
  host.fx("fx-palm-wave", effect.x + Math.cos(angle) * 22, effect.y + Math.sin(angle) * 10, radius / 78 * pulse, radius / 92 * pulse, "#fde68a", alpha * 0.86, z, angle, "add");
  host.fx("fx-fist", effect.x, effect.y, 0.52 + peak * 0.12, 0.52 + peak * 0.12, "#f8f3e9", alpha * 0.58, z + 3, angle, "add");
  return true;
}

export function renderMartialRisingEffect(host: MartialSkillRendererHost, context: StyledSkillContext): boolean {
  const { alpha, s, angle, peak, end, z } = context;
  if (!s.includes("rising")) return false;
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 16, "#fde68a", alpha * 0.3, z - 4, "add");
  host.fx("fx-fist", end.toX, end.toY, 0.82 + peak * 0.24, 0.82 + peak * 0.24, "#fde68a", alpha * 0.88, z + 6, angle, "add");
  return true;
}

export function renderMartialMeleeEffect(host: MartialSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha } = context;
  host.renderFastMeleeConeEffect(effect, progress, alpha, "#fde68a", "martial");
  return true;
}

export function renderMartialStyledSkillEffect(host: MartialSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  if (!context.s.includes("martial")) return false;
  return renderMartialPalmEffect(host, context) || renderMartialRisingEffect(host, context) || renderMartialMeleeEffect(host, context);
}

export function alchemistMode(context: StyledSkillContext): AlchemistMode {
  const mode = String(context.effect.mode || context.effect.flask || context.effect.damageType || "").toLowerCase();
  const fire = mode.includes("fire") || context.s.includes("fire") || context.s.includes("reaction");
  const acid = mode.includes("acid") || context.s.includes("acid") || context.s.includes("corrosive") || context.s.includes("splash") || context.s.includes("bomb");
  const heal = context.s.includes("elixir");
  return {
    fire,
    acid,
    heal,
    tint: heal ? "#bbf7d0" : fire ? "#f97316" : "#bef264",
  };
}

export function renderAlchemistThrowEffect(host: AlchemistSkillRendererHost, context: StyledSkillContext, mode: AlchemistMode): boolean {
  const { effect, progress, alpha, s, angle, peak, end, z } = context;
  if (!(s.includes("throw") || s.includes("bottle") || s.includes("bomb"))) return false;
  host.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, mode.tint, alpha * 0.34, z - 6, 3);
  host.drawGfxSparkSpray(effect.x - Math.cos(angle) * 12, effect.y - Math.sin(angle) * 12, 24, mode.tint, alpha * 0.2, z - 3, 5, progress * 2, angle + Math.PI, Math.PI * 0.8);
  host.drawGfxFlask(effect.x, effect.y, angle + progress * 2.1, mode.tint, alpha * (0.82 + peak * 0.04), z + 1, 0.95);
  host.fx("fx-flask", effect.x, effect.y, 0.42 + peak * 0.08, 0.42 + peak * 0.08, mode.tint, alpha * 0.34, z + 2, angle + progress * 1.8, "add");
  return true;
}

export function renderAlchemistElixirEffect(host: AlchemistSkillRendererHost, context: StyledSkillContext, mode: AlchemistMode): boolean {
  const { effect, progress, alpha, effectRadius, z } = context;
  if (!mode.heal) return false;
  host.drawGfxCircle(effect.x, effect.y, effectRadius * 0.72, "#bbf7d0", alpha * 0.08, "#86efac", alpha * 0.28, 3, z, "add", 28);
  host.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.48, "#bbf7d0", alpha * 0.34, z + 1, progress * 1.5, 8);
  host.drawGfxLine(effect.x - 19, effect.y, effect.x + 19, effect.y, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
  host.drawGfxLine(effect.x, effect.y - 19, effect.x, effect.y + 19, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
  host.fx("fx-heal-cross", effect.x, effect.y, effectRadius / 88, effectRadius / 88, "#bbf7d0", alpha * 0.46, z + 4, progress * 0.6, "add");
  return true;
}

export function renderAlchemistReactionEffect(host: AlchemistSkillRendererHost, context: StyledSkillContext, mode: AlchemistMode): boolean {
  const { effect, progress, alpha, s, effectRadius, peak, z } = context;
  if (mode.heal) return false;
  if (s.includes("throw") && !s.includes("reaction") && !s.includes("tick") && !s.includes("bomb")) return false;
  host.drawGfxCircle(effect.x, effect.y, effectRadius * (mode.fire ? 0.76 : 0.66), mode.tint, alpha * (mode.fire ? 0.13 : 0.1), mode.tint, alpha * 0.28, 3, z - 2, "add", 28);
  host.drawGfxSwirl(effect.x, effect.y, effectRadius * (mode.fire ? 0.54 : 0.48), mode.tint, alpha * 0.22, z - 1, progress * (mode.fire ? 2.2 : 1.4), mode.fire ? 4 : 3);
  const count = mode.fire ? 8 : 6;
  for (let i = 0; i < count; i += 1) {
    const a = (Math.PI * 2 * i) / count + progress * 0.4;
    const r = effectRadius * (0.28 + (i % 3) * 0.09);
    if (mode.fire) {
      const x = effect.x + Math.cos(a) * r;
      const y = effect.y + Math.sin(a) * r * 0.65;
      host.drawGfxPath([{ x, y: y - 14 }, { x: x + 8, y: y + 11 }, { x: x - 8, y: y + 11 }], i % 2 ? "#f97316" : "#fde68a", alpha * 0.42, "#f97316", alpha * 0.18, 1, z + i, "add");
    } else {
      host.drawGfxCircle(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r * 0.75, 8 + peak * 3, "#bef264", alpha * 0.24, "#d9f99d", alpha * 0.18, 1, z + i, "add", 10);
    }
  }
  return true;
}

export function renderAlchemistStyledSkillEffect(host: AlchemistSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const s = context.s;
  if (!(s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("fire_tick"))) return false;
  const mode = alchemistMode(context);
  const throwRendered = renderAlchemistThrowEffect(host, context, mode);
  const elixirRendered = renderAlchemistElixirEffect(host, context, mode);
  const reactionRendered = renderAlchemistReactionEffect(host, context, mode);
  return throwRendered || elixirRendered || reactionRendered;
}

export function shouldRenderAssassinEffect(context: StyledSkillContext | null): boolean {
  const s = context?.s || "";
  return s.includes("assassin") || s.includes("shadow") || s.includes("smoke_bomb") || s.includes("stalker") || s.includes("shuriken");
}

export function renderAssassinLungeEffect(host: AssassinSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, radius, s, kind, angle, peak, end, z } = context;
  if (!(s.includes("lunge") || kind === "dash")) return false;
  host.fx("fx-smoke", effect.x, effect.y, radius / 86, radius / 120, "#21142f", alpha * 0.46, z - 6, 0, "add");
  host.fx("fx-shadow-cut", end.toX, end.toY, 0.88 + peak * 0.22, 0.62 + peak * 0.1, "#c4b5fd", alpha * 0.86, z + 6, angle, "add");
  return true;
}

export function renderAssassinSmokeEffect(host: AssassinSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, effectRadius, peak, z } = context;
  if (!s.includes("smoke")) return false;
  host.fx("fx-smoke", effect.x, effect.y, effectRadius / 78, effectRadius / 100, "#21142f", alpha * 0.52, z - 8, progress * 0.25, "add");
  host.fx("fx-assassin-mark", effect.x, effect.y, 0.46 + peak * 0.1, 0.46 + peak * 0.1, "#c4b5fd", alpha * 0.28, z + 2, progress * 1.6, "add");
  return true;
}

export function renderAssassinMarkEffect(host: AssassinSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, z } = context;
  if (!(s.includes("mark") || s.includes("echo") || s.includes("shuriken"))) return false;
  host.fx("fx-assassin-mark", effect.x, effect.y, 0.58 + peak * 0.12, 0.58 + peak * 0.12, "#f5d0fe", alpha * 0.6, z + 3, progress * 0.8, "add");
  if (s.includes("echo") || s.includes("shuriken")) {
    host.fx("fx-shadow-cut", effect.x, effect.y, 0.76 + peak * 0.18, 0.46 + peak * 0.08, "#c4b5fd", alpha * 0.62, z + 5, angle, "add");
  }
  return true;
}

export function renderAssassinMeleeEffect(host: AssassinSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha } = context;
  host.renderFastMeleeConeEffect(effect, progress, alpha, "#c4b5fd", "assassin");
  return true;
}

export function renderAssassinStyledSkillEffect(host: AssassinSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context || !shouldRenderAssassinEffect(context)) return false;
  return (
    renderAssassinLungeEffect(host, context) ||
    renderAssassinSmokeEffect(host, context) ||
    renderAssassinMarkEffect(host, context) ||
    renderAssassinMeleeEffect(host, context)
  );
}

export function commonDangerColor(context: StyledSkillContext): string {
  const s = context.s || "";
  if (s.includes("poison") || s.includes("venom")) return "#bef264";
  if (s.includes("mortar") || s.includes("blast") || s.includes("bomber") || s.includes("fire") || s.includes("meteor")) return "#f97316";
  return "#ef4444";
}

export function renderCommonWarningEffect(host: CommonStyledEffectRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, effectRadius, peak, z } = context;
  if (context.kind !== "warning") return false;
  const danger = commonDangerColor(context);
  const warnRadius = effectRadius;
  host.drawGfxCircle(effect.x, effect.y, warnRadius, danger, alpha * 0.06, danger, alpha * 0.42, 4, z - 30, "add", 42);
  host.drawGfxRuneRing(effect.x, effect.y, warnRadius * (0.9 + peak * 0.03), danger, alpha * 0.34, z - 28, progress * 2.2, s.includes("sniper") ? 6 : 10);
  if (s.includes("sniper") || s.includes("lock") || s.includes("beam")) {
    host.drawGfxLine(effect.x - warnRadius, effect.y, effect.x + warnRadius, effect.y, 4, danger, alpha * 0.34, z - 20, "add");
    host.drawGfxLine(effect.x, effect.y - warnRadius, effect.x, effect.y + warnRadius, 4, danger, alpha * 0.22, z - 19, "add");
    host.drawGfxSparkSpray(effect.x, effect.y, warnRadius * 0.62, danger, alpha * 0.16, z - 16, 6, progress * 2.7);
  } else if (s.includes("charge")) {
    host.drawGfxCone(effect.x, effect.y, angle, warnRadius * 1.15, 0.44, danger, alpha * 0.055, alpha * 0.34, z - 24, false);
    host.drawGfxSparkSpray(effect.x + Math.cos(angle) * warnRadius * 0.9, effect.y + Math.sin(angle) * warnRadius * 0.9, warnRadius * 0.26, danger, alpha * 0.22, z - 16, 7, progress, angle, Math.PI * 0.8);
  } else {
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + progress * 0.5;
      host.drawGfxLine(effect.x + Math.cos(a) * warnRadius * 0.72, effect.y + Math.sin(a) * warnRadius * 0.72, effect.x + Math.cos(a) * warnRadius, effect.y + Math.sin(a) * warnRadius, 3, danger, alpha * 0.28, z - 18 + i, "add");
    }
  }
  return true;
}

export function renderCommonImpactEffect(host: CommonStyledEffectRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, color, s, kind, effectRadius, z } = context;
  if (!(kind === "explosion" || kind === "death" || kind === "impact")) return false;
  const fire = s.includes("fire") || s.includes("bomber") || s.includes("blast") || s.includes("meteor");
  const poison = s.includes("poison") || s.includes("acid") || s.includes("splitter");
  const tint = poison ? "#bef264" : fire ? "#f97316" : color;
  host.drawGfxCircle(effect.x, effect.y, effectRadius * (0.44 + progress * 0.42), tint, alpha * 0.16, tint, alpha * 0.34, 4, z, "add", 30);
  host.drawGfxCircle(effect.x, effect.y, effectRadius * (0.72 + progress * 0.34), tint, alpha * 0.04, "#f8f3e9", alpha * 0.2, 2, z + 1, "add", 34);
  host.drawGfxShardBurst(effect.x, effect.y, effectRadius * 0.82, fire ? "#fde68a" : tint, alpha * 0.46, z + 4, fire ? 11 : 8, progress);
  host.drawGfxSparkSpray(effect.x, effect.y, effectRadius * 0.9, fire ? "#fde68a" : tint, alpha * 0.28, z + 12, fire ? 14 : 10, progress * 3.4);
  return true;
}

export function renderCommonStyledEffect(host: CommonStyledEffectRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return renderCommonWarningEffect(host, context) || renderCommonImpactEffect(host, context);
}

export function renderCrispCommonStyledEffect(host: CommonStyledEffectRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return renderCommonWarningEffect(host, context) || renderCommonImpactEffect(host, context);
}

export function renderCrispRangerEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, s, kind, angle, peak, effectRadius, end, z } = context;
  const poison = s.includes("poison") || s.includes("venom");
  const assassin = s.includes("assassin");
  const tint = poison ? "#bef264" : assassin ? "#c4b5fd" : "#f1d08b";
  const light = poison ? "#ecfccb" : assassin ? "#ede9fe" : "#fff7ed";
  const dark = poison ? "#365314" : assassin ? "#2e1065" : "#4a3415";
  const drawBowMark = (bowAlpha = 1): void => {
    const bowRadius = Math.max(28, effectRadius * 0.24);
    const bowX = effect.x - Math.cos(angle) * Math.max(16, radius * 0.18);
    const bowY = effect.y - Math.sin(angle) * Math.max(16, radius * 0.18);
    const start = angle - Math.PI * 0.62;
    const endAngle = angle + Math.PI * 0.62;
    host.drawGfxArc(bowX, bowY, bowRadius, start, endAngle, 4, tint, alpha * 0.28 * bowAlpha, z - 7, "add", 14);
    host.drawGfxLine(
      bowX + Math.cos(start) * bowRadius,
      bowY + Math.sin(start) * bowRadius,
      bowX + Math.cos(endAngle) * bowRadius,
      bowY + Math.sin(endAngle) * bowRadius,
      2,
      light,
      alpha * 0.2 * bowAlpha,
      z - 6,
      "add",
    );
  };

  if (s.includes("arrow_rain_launch")) {
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const lift = Math.max(190, Math.min(460, dist * 0.46 + effectRadius * 0.55));
    const apexX = end.fromX + dx * 0.5;
    const apexY = Math.min(end.fromY, end.toY) - lift;
    const launch = Math.max(0, Math.min(1, progress * 1.08));
    const rain = Math.max(0, Math.min(1, (progress - 0.72) / 0.28));
    const bowRadius = Math.max(28, Math.min(52, effectRadius * 0.22));
    const bowX = end.fromX - ux * 18;
    const bowY = end.fromY - uy * 18;
    const bowStart = angle - Math.PI * 0.62;
    const bowEnd = angle + Math.PI * 0.62;
    const point = (t: number, lane = 0): { x: number; y: number } => {
      const one = 1 - t;
      return {
        x: one * one * end.fromX + 2 * one * t * apexX + t * t * end.toX + px * lane,
        y: one * one * end.fromY + 2 * one * t * apexY + t * t * end.toY + py * lane,
      };
    };
    const tangent = (t: number): { x: number; y: number } => {
      const tx = 2 * (1 - t) * (apexX - end.fromX) + 2 * t * (end.toX - apexX);
      const ty = 2 * (1 - t) * (apexY - end.fromY) + 2 * t * (end.toY - apexY);
      const len = Math.hypot(tx, ty) || 1;
      return { x: tx / len, y: ty / len };
    };
    host.drawGfxArc(bowX, bowY, bowRadius, bowStart, bowEnd, 4, tint, alpha * 0.36, z - 12, "add", 14);
    host.drawGfxLine(
      bowX + Math.cos(bowStart) * bowRadius,
      bowY + Math.sin(bowStart) * bowRadius,
      bowX + Math.cos(bowEnd) * bowRadius,
      bowY + Math.sin(bowEnd) * bowRadius,
      2,
      light,
      alpha * 0.24,
      z - 11,
      "add",
    );

    let previous = point(0);
    for (let i = 1; i <= 26; i += 1) {
      const t = i / 26;
      const next = point(t);
      const fade = 0.22 + Math.sin(t * Math.PI) * 0.16;
      host.drawGfxLine(previous.x, previous.y, next.x, next.y, 7, "#4a3415", alpha * 0.12, z - 18 + i, "add");
      host.drawGfxLine(previous.x, previous.y, next.x, next.y, 4, tint, alpha * fade, z - 17 + i, "add");
      if (i % 3 === 0) host.drawGfxLine(previous.x + px * 11, previous.y + py * 11, next.x + px * 11, next.y + py * 11, 1.5, light, alpha * 0.12, z - 19 + i, "add");
      previous = next;
    }

    const headT = Math.max(0.05, Math.min(0.94, launch * 0.92));
    const head = point(headT);
    const dir = tangent(headT);
    host.drawGfxArrow(head.x - dir.x * 58, head.y - dir.y * 58, head.x + dir.x * 12, head.y + dir.y * 12, light, alpha * 0.95, z + 16, 7);
    host.drawGfxLine(end.fromX, end.fromY, head.x - dir.x * 18, head.y - dir.y * 18, 3, tint, alpha * 0.22, z - 4, "add");

    if (launch > 0.42) {
      const glint = point(0.5);
      host.drawGfxCircle(glint.x, glint.y, 13 + peak * 6, "#4a3415", alpha * 0.08, "#fde68a", alpha * 0.32, 2, z + 14, "add", 14);
    }

    const fallCount = 7;
    if (rain > 0) {
      host.drawGfxCircle(end.toX, end.toY, effectRadius, dark, alpha * 0.026, tint, alpha * (0.2 + rain * 0.18), 2, z + 12, "add", 56);
      host.drawGfxCircle(end.toX, end.toY, effectRadius * 0.72, "#000000", 0, "#fde68a", alpha * (0.06 + rain * 0.08), 1.2, z + 13, "add", 42);
    }
    for (let i = 0; i < fallCount; i += 1) {
      const lane = (i - (fallCount - 1) / 2) * effectRadius * 0.13 + (host.noise(i * 17, end.toX) - 0.5) * effectRadius * 0.1;
      const landX = end.toX + lane;
      const landY = end.toY + (host.noise(i * 11, end.toY) - 0.5) * effectRadius * 0.28;
      const fall = Math.max(0, Math.min(1, rain * 1.25 - (i % 4) * 0.08));
      if (fall <= 0) continue;
      const x = landX;
      const y = landY - effectRadius * 2.05 + fall * effectRadius * 2.28;
      const slant = (i % 2 ? -1 : 1) * 2;
      host.drawGfxArrow(x - slant, y - 42, x + slant, y + 30, i % 3 === 0 ? light : tint, alpha * (0.34 + fall * 0.34), z + 28 + i, i % 3 === 0 ? 4 : 3);
    }

    return true;
  }

  if (s.includes("arrow_rain")) {
    const rainRadius = effectRadius;
    const warn = kind === "warning";
    if (warn) return true;
    const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
    if (rainProgress <= 0) return true;
    host.drawGfxCircle(effect.x, effect.y, rainRadius, "#4a3415", alpha * 0.026, "#f1d08b", alpha * (0.22 + rainProgress * 0.16), 2, z - 12, "add", 56);
    host.drawGfxCircle(effect.x, effect.y, rainRadius * 0.72, "#000000", 0, "#fde68a", alpha * (0.07 + rainProgress * 0.07), 1.2, z - 11, "add", 42);
    const dropCount = 8;
    for (let i = 0; i < dropCount; i += 1) {
      const seed = host.noise(i * 19 + effect.x, effect.y * 0.1);
      const lane = (i - (dropCount - 1) / 2) * rainRadius * 0.12 + (seed - 0.5) * rainRadius * 0.1;
      const landX = effect.x + lane;
      const landY = effect.y + (host.noise(i * 7, effect.x) - 0.5) * rainRadius * 0.32;
      const fall = (rainProgress * 1.35 + i / dropCount) % 1;
      const x = landX;
      const y = landY - rainRadius * 2.05 + fall * rainRadius * 2.32;
      const slant = (i % 2 ? -1 : 1) * 2;
      host.drawGfxArrow(x - slant, y - 46, x + slant, y + 32, i % 3 === 0 ? "#fff7ed" : "#f1d08b", alpha * (0.36 + rainProgress * 0.3), z + i, i % 3 === 0 ? 4 : 3);
    }
    return true;
  }

  if (s.includes("laser_arrow")) {
    const beamWidth = Math.max(34, Number(effect.width || 42));
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const travel = Math.max(0.08, Math.min(1, progress * 1.38));
    const tail = Math.max(0, travel - 0.48);
    const headX = end.fromX + dx * travel;
    const headY = end.fromY + dy * travel;
    const tailX = end.fromX + dx * tail;
    const tailY = end.fromY + dy * tail;
    drawBowMark(0.72 + (1 - travel) * 0.24);
    host.drawGfxCircle(end.fromX, end.fromY, beamWidth * (0.28 + peak * 0.08), "#12301f", alpha * 0.12, light, alpha * 0.32, 2, z - 4, "add", 16);
    host.drawGfxCapsule(tailX, tailY, headX, headY, beamWidth * 1.2, "#12301f", alpha * 0.34, z - 15);
    host.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 0.84, tint, alpha * 0.82, z - 7, "add");
    host.drawGfxLine(tailX, tailY, headX, headY, Math.max(8, beamWidth * 0.24), light, alpha * 0.92, z - 2, "add");
    host.drawGfxImpactBurst(headX, headY, beamWidth * (0.68 + peak * 0.2), light, alpha * 0.34, z + 9, progress, 8);
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 6;
      if (t < tail || t > travel) continue;
      const x = end.fromX + dx * t;
      const y = end.fromY + dy * t;
      const mark = 12 + (i % 2) * 5 + peak * 3;
      host.drawGfxLine(x - ux * mark + px * mark * 0.7, y - uy * mark + py * mark * 0.7, x + ux * mark, y + uy * mark, 4, light, alpha * 0.38, z + i, "add");
      host.drawGfxLine(x - ux * mark - px * mark * 0.7, y - uy * mark - py * mark * 0.7, x + ux * mark, y + uy * mark, 4, tint, alpha * 0.32, z + 6 + i, "add");
    }
    if (travel > 0.86) {
      host.drawGfxImpactBurst(end.toX, end.toY, beamWidth * 1.36, tint, alpha * 0.32, z + 10, progress, 10);
    }
    return true;
  }

  if (s.includes("piercing") || s.includes("arrow_fan") || s.includes("fire_arrow") || s.includes("ranger_barrage") || s.includes("poison_volley") || s.includes("poison_arrow") || s.includes("assassin_fan")) {
    if (s.includes("piercing")) {
      const laneWidth = Math.max(28, radius * 0.38);
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const travel = Math.max(0.12, Math.min(1, progress * 1.55));
      const tail = Math.max(0, travel - 0.32);
      const headX = end.fromX + dx * travel;
      const headY = end.fromY + dy * travel;
      const tailX = end.fromX + dx * tail;
      const tailY = end.fromY + dy * tail;
      drawBowMark(0.66 + (1 - travel) * 0.28);
      host.drawGfxCircle(end.fromX, end.fromY, laneWidth * 0.38, tint, alpha * 0.12, light, alpha * 0.24, 1.5, z - 6, "add", 12);
      host.drawGfxCapsule(tailX, tailY, headX, headY, laneWidth, tint, alpha * 0.4, z - 12);
      host.drawGfxLine(tailX, tailY, headX, headY, Math.max(6, laneWidth * 0.22), light, alpha * 0.52, z - 8, "add");
      host.drawGfxLine(tailX + px * laneWidth * 0.36, tailY + py * laneWidth * 0.36, headX + px * laneWidth * 0.22, headY + py * laneWidth * 0.22, 2, tint, alpha * 0.3, z - 7, "add");
      host.drawGfxLine(tailX - px * laneWidth * 0.36, tailY - py * laneWidth * 0.36, headX - px * laneWidth * 0.22, headY - py * laneWidth * 0.22, 2, tint, alpha * 0.3, z - 7, "add");
      host.drawGfxArrow(headX - ux * 74, headY - uy * 74, headX + ux * 12, headY + uy * 12, light, alpha * 0.92, z + 3, 8);
      if (travel > 0.86) {
        host.drawGfxImpactBurst(end.toX, end.toY, laneWidth * 1.25, tint, alpha * 0.26, z + 8, progress, 8);
      }
    } else {
      const count = assassin ? 5 : s.includes("barrage") || s.includes("volley") ? 5 : 3;
      const spread = assassin ? 0.78 : count >= 5 ? 0.7 : 0.48;
      const fanRadius = Math.max(radius, effectRadius * 0.82);
      drawBowMark(1);
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1) - 0.5;
        const a = angle + t * spread;
        const px = -Math.sin(a);
        const py = Math.cos(a);
        const length = fanRadius * (assassin ? 0.92 : 1.2);
        const sx = effect.x - Math.cos(a) * length * 0.36 + px * t * 12;
        const sy = effect.y - Math.sin(a) * length * 0.36 + py * t * 12;
        const tx = effect.x + Math.cos(a) * length * 0.66 + px * t * 8;
        const ty = effect.y + Math.sin(a) * length * 0.66 + py * t * 8;
        const center = i === Math.floor(count / 2);
        host.drawGfxArrow(sx, sy, tx, ty, center ? light : tint, alpha * (center ? 0.9 : 0.62), z + i, assassin ? 4 : 5);
        host.drawGfxLine(sx - Math.cos(a) * 28, sy - Math.sin(a) * 28, sx, sy, 2, tint, alpha * 0.24, z - 4 + i, "add");
        if (poison) host.drawGfxCircle(tx - Math.cos(a) * 9, ty - Math.sin(a) * 9, 5 + peak * 2, "#bef264", alpha * 0.28, "#ecfccb", alpha * 0.22, 1, z + 8 + i, "add", 8);
      }
      if (poison) {
        const cloudX = effect.x + Math.cos(angle) * fanRadius * 0.44;
        const cloudY = effect.y + Math.sin(angle) * fanRadius * 0.44;
        host.drawGfxCircle(cloudX, cloudY, 26 + peak * 10, "#bef264", alpha * 0.16, "#d9f99d", alpha * 0.24, 2, z + 8, "add", 18);
        host.drawGfxSparkSpray(cloudX, cloudY, 32, "#bef264", alpha * 0.18, z + 10, 6, progress * 2.2, angle, Math.PI * 0.9);
      }
    }
    return true;
  }

  return false;
}

export function renderCrispMageEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, styleInfo, peak, effectRadius, end, z } = context;
  const cx = effect.x;
  const cy = effect.y;
  const t = Math.max(0, Math.min(1, progress));
  const fade = Math.max(0, 1 - Math.max(0, t - 0.78) / 0.22);
  const phase = Number(effect.seed || 0) * 0.19 + t * Math.PI * 2;

  if (s.includes("frost") || s.includes("freeze") || s.includes("ice")) {
    const frostRadius = effectRadius;
    if (s.includes("frost_breath")) {
      const auraAlpha = alpha * 0.85;
      host.drawGfxCircle(cx, cy, frostRadius * 0.82, "#081923", auraAlpha * 0.028, "#93c5fd", auraAlpha * 0.09, 1.5, z - 16, "add", 64);
      host.drawGfxCircle(cx, cy, frostRadius * 0.52, "#000000", 0, "#dbeafe", auraAlpha * 0.045, 1, z - 15, "add", 44);
      for (let i = 0; i < 3; i += 1) {
        const a = phase * 0.08 + (Math.PI * 2 * i) / 3;
        host.drawGfxArc(cx, cy, frostRadius * (0.48 + i * 0.11), a - 0.34, a + 0.54, 2, i % 2 ? "#dbeafe" : "#93c5fd", auraAlpha * 0.075, z - 8 + i, "add", 8);
      }
      for (let i = 0; i < 5; i += 1) {
        const a = phase * 0.12 + (Math.PI * 2 * i) / 5;
        const r = frostRadius * (0.24 + (i % 3) * 0.13);
        host.drawGfxDiamond(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.72, 3.5 + (i % 2), "#dbeafe", auraAlpha * 0.1, z - 2 + i, a, "#93c5fd");
      }
      return true;
    }
    const wave = Math.min(1, t / 0.32);
    const ease = 1 - Math.pow(1 - wave, 2.4);
    const ring = frostRadius * (0.18 + ease * 0.78);
    const iceAlpha = alpha * fade;
    host.drawGfxCircle(cx, cy, frostRadius * 0.82, "#06131f", iceAlpha * 0.045, "#93c5fd", iceAlpha * 0.12, 2, z - 14, "add", 58);
    host.drawGfxCircle(cx, cy, ring, "#000000", 0, "#dbeafe", iceAlpha * 0.58, 4, z - 8, "add", 58);
    host.drawGfxCircle(cx, cy, Math.max(18, ring * 0.42), "#dbeafe", iceAlpha * 0.035, "#93c5fd", iceAlpha * 0.16, 1.5, z - 7, "add", 34);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + 0.18;
      const inner = ring * 0.18;
      const outer = ring * (0.72 + (i % 3) * 0.045);
      host.drawGfxLine(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * 0.92, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.92, i % 2 ? 2.4 : 3.4, i % 2 ? "#93c5fd" : "#e0f2fe", iceAlpha * 0.34, z + i, "add");
    }
    for (let i = 0; i < 5; i += 1) {
      const a = phase * 0.06 + (Math.PI * 2 * i) / 5;
      const r = ring * (0.62 + (i % 2) * 0.08);
      host.drawGfxDiamond(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, 5 + (i % 2), "#dbeafe", iceAlpha * 0.24, z + 14 + i, a, "#93c5fd");
    }
    if (s.includes("lock") || s.includes("shatter")) {
      host.drawGfxImpactBurst(cx, cy, frostRadius * 0.38, "#dbeafe", alpha * 0.22, z + 20, t * 1.6, 7);
    }
    return true;
  }

  if (isMeteorFallEffect(context)) {
    const meteorRadius = effectRadius;
    const fallEnd = meteorFallEndProgress(effect);
    const fallT = Math.max(0, Math.min(1, t / fallEnd));
    const fall = fallT * fallT * (3 - fallT * 2);
    const impact = Math.max(0, Math.min(1, (t - fallEnd) / (1 - fallEnd)));
    const startX = cx - meteorRadius * 0.72;
    const startY = cy - meteorRadius * 3.35;
    const mx = startX + (cx - startX) * fall;
    const my = startY + (cy - startY) * fall;
    const meteorAngle = Math.atan2(cy - startY, cx - startX);
    const targetAlpha = alpha * Math.max(0.06, 0.3 - impact * 0.14);
    drawMeteorLandingShadow(host, cx, cy, meteorRadius, fall, impact, alpha, z - 20);
    host.drawGfxCircle(cx, cy, meteorRadius * (0.42 + impact * 0.5), "#2a120b", alpha * (0.04 + impact * 0.045), "#fb923c", targetAlpha, 2.5, z - 18, "add", 48);
    host.drawGfxArc(cx, cy, meteorRadius * 0.88, Math.PI * 0.1, Math.PI * 0.86, 4, "#fed7aa", targetAlpha * 0.78, z - 16, "add", 14);
    host.drawGfxArc(cx, cy, meteorRadius * 0.88, -Math.PI * 0.86, -Math.PI * 0.1, 4, "#fb923c", targetAlpha * 0.78, z - 15, "add", 14);
    if (impact <= 0.04) {
      const meteorSize = meteorRadius * (0.2 + fall * 0.075);
      const tailX = mx - Math.cos(meteorAngle) * meteorRadius * 0.75;
      const tailY = my - Math.sin(meteorAngle) * meteorRadius * 0.75;
      drawMeteorTrail(host, tailX, tailY, mx, my, meteorSize, alpha * 0.82, z - 4 + fall * 10, t);
      host.drawGfxPath(meteorRockPoints(mx, my, meteorAngle, meteorSize * 1.52, meteorSize * 0.98, t * 4), "#3f1f13", alpha * 0.9, "#fed7aa", alpha * 0.56, 2.2, z + 10 + fall * 12, "normal");
      host.drawGfxLine(mx - Math.cos(meteorAngle) * meteorSize * 0.55, my - Math.sin(meteorAngle) * meteorSize * 0.55, mx + Math.cos(meteorAngle) * meteorSize * 0.28, my + Math.sin(meteorAngle) * meteorSize * 0.28, Math.max(3, meteorSize * 0.18), "#fde68a", alpha * 0.36, z + 14 + fall * 12, "add");
    } else {
      const shock = meteorRadius * (0.4 + impact * 0.5);
      host.drawGfxCircle(cx, cy + meteorRadius * 0.06, shock, "#7c2d12", alpha * (0.11 - impact * 0.03), "#fb923c", alpha * (0.36 - impact * 0.14), 4, z + 8, "add", 42);
      host.drawGfxImpactBurst(cx, cy, meteorRadius * (0.58 + impact * 0.28), "#f97316", alpha * (0.28 - impact * 0.08), z + 18, t * 2.1, 10);
      drawMeteorFragments(host, cx, cy, meteorRadius * (0.36 + impact * 0.18), alpha * impact * 0.62, z + 24, t * 4.6);
    }
    return true;
  }

  if (styleInfo.lightningSkill || s.includes("drone_laser")) {
    const empowered = s.includes("empowered_current");
    const rail = s.includes("rail");
    const engineerArc = s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("overclock") || s.includes("coil");
    const mageChain = (s.includes("chain_lightning") || (context.kind === "chain" && !engineerArc && !s.includes("assassin") && !s.includes("puppet") && !s.includes("elite"))) && !s.includes("mark_chain");
    const tint = rail ? "#fde68a" : empowered ? "#ef4444" : engineerArc ? "#67e8f9" : "#9ee6ff";
    const core = empowered ? "#fee2e2" : "#f8fafc";
    if (mageChain) {
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const length = Math.hypot(dx, dy) || 1;
      const ux = dx / length;
      const uy = dy / length;
      const px = -uy;
      const py = ux;
      const width = empowered ? 8 : 7;
      host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.86, z, width, 8, 16, t * 1.35);
      host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.18, z + 4, Math.max(2, width * 0.34), 5, 8, t * 1.35 + 0.31);
      for (let i = 0; i < 3; i += 1) {
        const along = (i + 1) / 4;
        const bx = end.fromX + dx * along;
        const by = end.fromY + dy * along;
        const side = i % 2 ? 1 : -1;
        const len = 30 + i * 5;
        host.drawGfxLightning(bx, by, bx + ux * len * 0.2 + px * side * len, by + uy * len * 0.2 + py * side * len, tint, alpha * (0.24 - i * 0.035), z + 8 + i, 2.6, 3, 7, t + i * 0.27);
      }
      host.drawGfxCircle(end.fromX, end.fromY, 9 + peak * 3, tint, alpha * 0.08, core, alpha * 0.22, 2, z + 7, "add", 12);
      host.drawGfxCircle(end.toX, end.toY, 15 + peak * 6, tint, alpha * 0.12, core, alpha * 0.34, 2.5, z + 12, "add", 14);
      return true;
    }
    const coil = s.includes("coil");
    const width = coil ? 12 : rail ? 8 : empowered ? 10 : engineerArc ? 8 : 9;
    const boltSegments = rail ? 5 : coil ? 11 : s.includes("chain_lightning") ? 9 : engineerArc ? 8 : 8;
    const boltJitter = rail ? 5 : coil ? 24 : s.includes("chain_lightning") ? 23 : engineerArc ? 19 : 18;
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.94, z, width, boltSegments, boltJitter, progress * 1.7);
    if (coil) {
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const length = Math.hypot(dx, dy) || 1;
      const px = -dy / length;
      const py = dx / length;
      for (const side of [-1, 1]) {
        host.drawGfxLightning(end.fromX + px * side * 28, end.fromY + py * side * 28, end.toX + px * side * 20, end.toY + py * side * 20, tint, alpha * 0.28, z - 2, 5, 5, 15, progress + side * 0.23);
      }
    }
    if (!rail) {
      const boltAngle = Math.atan2(end.toY - end.fromY, end.toX - end.fromX);
      const branchCount = coil ? 4 : s.includes("chain_lightning") ? 3 : 2;
      for (let i = 0; i < branchCount; i += 1) {
        const side = i % 2 ? 1 : -1;
        const t = (i + 1) / (branchCount + 1);
        const bx = end.fromX + (end.toX - end.fromX) * t;
        const by = end.fromY + (end.toY - end.fromY) * t;
        const branchAngle = boltAngle + side * (0.72 + i * 0.13);
        const branchLength = 32 + boltJitter * 0.95 + i * 6;
        host.drawGfxLightning(bx, by, bx + Math.cos(branchAngle) * branchLength, by + Math.sin(branchAngle) * branchLength, tint, alpha * (0.28 - i * 0.035), z + 8 + i, Math.max(2.2, width * 0.38), 3, 9 + i * 2, progress + i * 0.31);
      }
      host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.14, z + 4, Math.max(2, width * 0.3), 5, boltJitter * 0.55, progress + 0.37);
    }
    host.drawGfxCircle(end.fromX, end.fromY, 10 + peak * 4, tint, alpha * 0.08, core, alpha * 0.18, 2, z + 5, "add", 10);
    host.drawGfxCircle(end.toX, end.toY, 18 + peak * 9, tint, alpha * 0.16, core, alpha * 0.42, 3, z + 8, "add", 14);
    host.drawGfxSparkSpray(end.toX, end.toY, 42 + peak * 10, core, alpha * 0.36, z + 12, 11, progress * 4.1);
    return true;
  }

  if (s.includes("star_orb") || s.includes("star_burst") || s.includes("star_split") || s.includes("arcane_splash") || s.includes("blink")) {
    const blink = s.includes("blink");
    const burst = s.includes("burst") || s.includes("splash");
    const split = s.includes("split");
    const tint = blink ? "#93c5fd" : burst ? "#d8b4fe" : "#c4b5fd";
    const core = blink ? "#e0f2fe" : "#f8fafc";
    const starRadius = Math.max(34, effectRadius * (burst ? 0.58 : 0.42) * (0.94 + peak * 0.08));
    if (blink) {
      const fromX = end.fromX;
      const fromY = end.fromY;
      const toX = effect.x;
      const toY = effect.y;
      const portalRadius = Math.max(26, effectRadius * 0.28);
      for (const portal of [
        { x: fromX, y: fromY, dir: -1, a: alpha * 0.48 },
        { x: toX, y: toY, dir: 1, a: alpha * 0.78 },
      ]) {
        host.drawGfxCircle(portal.x, portal.y, portalRadius * (portal.dir > 0 ? 1.08 : 0.86), "#071923", portal.a * 0.08, "#93c5fd", portal.a * 0.2, 2, z - 6 + portal.dir * 4, "add", 28);
        host.drawGfxArc(portal.x, portal.y, portalRadius, phase * portal.dir, phase * portal.dir + Math.PI * 1.35, 3, "#dbeafe", portal.a * 0.42, z + portal.dir * 4, "add", 16);
        host.drawGfxArc(portal.x, portal.y, portalRadius * 0.62, -phase * portal.dir, -phase * portal.dir + Math.PI * 0.95, 2, "#93c5fd", portal.a * 0.28, z + portal.dir * 4 + 1, "add", 12);
      }
      host.drawGfxLine(fromX, fromY, toX, toY, Math.max(2, portalRadius * 0.1), "#93c5fd", alpha * 0.11, z - 8, "add");
      for (let i = 0; i < 4; i += 1) {
        const a = phase * 0.45 + (Math.PI * 2 * i) / 4;
        host.drawGfxDiamond(toX + Math.cos(a) * portalRadius * 0.58, toY + Math.sin(a) * portalRadius * 0.48, 4.5, core, alpha * 0.28, z + 9 + i, a, tint);
      }
      return true;
    }
    host.drawGfxCircle(cx, cy, starRadius * 0.94, "#180f2a", alpha * 0.07, tint, alpha * 0.2, 2, z - 8, "add", 34);
    host.drawGfxCircle(cx, cy, starRadius * 0.54, "#000000", 0, core, alpha * 0.16, 1.4, z - 7, "add", 24);
    host.drawGfxRuneRing(cx, cy, starRadius * 0.9, tint, alpha * 0.28, z - 5, phase * 0.22, burst ? 8 : 6);
    host.drawGfxStar(cx, cy, Math.max(20, starRadius * 0.62), core, alpha * 0.62, z + 2, burst ? 8 : 6);
    const orbitCount = burst ? 8 : 6;
    for (let i = 0; i < orbitCount; i += 1) {
      const a = phase * (burst ? 0.16 : 0.1) + (Math.PI * 2 * i) / orbitCount;
      const inner = starRadius * 0.26;
      const outer = starRadius * (0.78 + (i % 2) * 0.06);
      host.drawGfxLine(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, i % 2 ? 2.4 : 3.4, tint, alpha * 0.24, z + 7 + i, "add");
      if (i % 2 === 0) host.drawGfxDiamond(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, 4.5 + (i % 3), core, alpha * 0.26, z + 18 + i, a, tint);
    }
    if (split) {
      for (let i = 0; i < 3; i += 1) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / 3 + phase * 0.08;
        const x = cx + Math.cos(a) * starRadius * 0.62;
        const y = cy + Math.sin(a) * starRadius * 0.62;
        host.drawGfxStar(x, y, Math.max(8, starRadius * 0.18), "#dbeafe", alpha * 0.34, z + 32 + i, 5);
      }
    }
    host.drawGfxImpactBurst(cx, cy, starRadius * (burst ? 0.72 : 0.5), tint, alpha * (burst ? 0.2 : 0.13), z + 20, phase * 0.2, burst ? 8 : 6);
    return true;
  }

  return false;
}

export function renderCrispEngineerEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, styleInfo, angle, peak, effectRadius, end, z } = context;
  if (!(styleInfo.engineer || styleInfo.basicTechBolt || s.includes("mini_turret"))) return false;
  if (s.includes("drone_bolt")) {
    return renderEngineerDroneBoltEffect(host, context);
  }
  if (s.includes("laser_module_charge") || s.includes("mecha_laser_charge")) {
    const step = Math.max(1, Math.floor(Number(effect.chargeStep || 1)));
    const max = Math.max(1, Math.floor(Number(effect.chargeMax || 4)));
    const chargeRatio = Math.max(0.12, Math.min(1, step / max));
    const release = Boolean(effect.release);
    const gather = 1 - Math.pow(1 - progress, 2.65);
    const baseRadius = Math.max(46, effectRadius);
    const coreRadius = baseRadius * (0.22 + chargeRatio * 0.14 + peak * 0.04);
    const orbitRadius = baseRadius * (0.76 + chargeRatio * 0.42);
    const tint = "#c084fc";
    const hot = release ? "#f5d0fe" : "#67e8f9";
    const activeAlpha = alpha * (0.78 + chargeRatio * 0.24);
    const spin = progress * Math.PI * (release ? 2.9 : 1.65) + step * 0.72;

    host.drawGfxCircle(effect.x, effect.y, orbitRadius * (0.56 + peak * 0.12), "#170728", activeAlpha * 0.1, tint, activeAlpha * (0.16 + chargeRatio * 0.18), 2.2 + chargeRatio * 2, z - 10, "add", 40);
    host.drawGfxRuneRing(effect.x, effect.y, orbitRadius * (0.52 + chargeRatio * 0.14), tint, activeAlpha * (0.18 + chargeRatio * 0.16), z - 4, -spin, max);
    host.drawGfxCircle(effect.x, effect.y, coreRadius * 1.6, tint, activeAlpha * (0.12 + chargeRatio * 0.1), hot, activeAlpha * (0.24 + chargeRatio * 0.3), 2.4, z + 5, "add", 22);
    host.drawGfxCircle(effect.x, effect.y, coreRadius * (0.72 + peak * 0.18), hot, activeAlpha * (0.28 + chargeRatio * 0.22), "#ffffff", activeAlpha * (0.3 + chargeRatio * 0.34), 1.8, z + 10, "add", 16);

    const moteCount = release ? 12 : 8;
    const seedBase = Number.isFinite(Number(effect.id)) ? Number(effect.id) : 1;
    for (let i = 0; i < moteCount; i += 1) {
      const seed = host.noise(seedBase, i * 31 + step * 7);
      const a = spin + (Math.PI * 2 * i) / moteCount + seed * 0.34;
      const startR = orbitRadius * (0.92 + (i % 3) * 0.12);
      const endR = coreRadius * (0.45 + (i % 2) * 0.16);
      const r = startR + (endR - startR) * gather;
      const tailR = Math.min(startR, r + 22 * (1 - gather + chargeRatio * 0.22));
      const sx = effect.x + Math.cos(a) * tailR;
      const sy = effect.y + Math.sin(a) * tailR * 0.82;
      const tx = effect.x + Math.cos(a) * r;
      const ty = effect.y + Math.sin(a) * r * 0.82;
      const moteAlpha = activeAlpha * (0.2 + chargeRatio * 0.18) * (release ? 1.12 : 1);
      host.drawGfxLine(sx, sy, tx, ty, release ? 4.2 : 3.2, i % 2 ? hot : tint, moteAlpha, z + 14 + i, "add");
      host.drawGfxDiamond(tx, ty, 3.5 + chargeRatio * 2.2, i % 2 ? hot : tint, moteAlpha * 0.9, z + 26 + i, -a, "#ffffff");
    }

    for (let i = 0; i < max; i += 1) {
      const lit = i < step;
      const pipAngle = -Math.PI * 0.5 + (i - (max - 1) / 2) * 0.34;
      const px = effect.x + Math.cos(pipAngle) * orbitRadius * 0.38;
      const py = effect.y + Math.sin(pipAngle) * orbitRadius * 0.32 - 4;
      host.drawGfxCircle(px, py, lit ? 4.8 + peak * 1.2 : 3.4, lit ? hot : "#26132f", lit ? activeAlpha * 0.46 : activeAlpha * 0.08, lit ? "#ffffff" : tint, lit ? activeAlpha * 0.58 : activeAlpha * 0.18, 1.2, z + 38 + i, "add", 8);
    }

    if (release) {
      host.drawGfxImpactBurst(effect.x, effect.y, orbitRadius * (0.58 + peak * 0.2), tint, activeAlpha * 0.5, z + 45, progress * 3.2, 14);
      host.drawGfxCircle(effect.x, effect.y, orbitRadius * (0.84 + progress * 0.28), "#ffffff", activeAlpha * 0.04, hot, activeAlpha * Math.max(0, 0.42 - progress * 0.18), 5, z + 44, "add", 54);
    }
    return true;
  }
  if (s.includes("single_laser")) {
    const beamWidth = Math.max(3, Number(effect.width || 4.5));
    const effectColor = (effect as { color?: string }).color;
    const tint = effectColor || "#67e8f9";
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 5, "#06131f", alpha * 0.24, z - 5, "add");
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.78, z - 2, "add");
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(1.5, beamWidth * 0.3), "#f8fafc", alpha * 0.86, z + 1, "add");
    host.drawGfxCircle(end.toX, end.toY, beamWidth * (2.1 + peak * 0.5), tint, alpha * 0.16, "#f8fafc", alpha * 0.3, 2, z + 4, "add", 10);
    return true;
  }
  if (styleInfo.mechaMuzzle || s.includes("mecha_giant_laser") || s.includes("engineer_laser_module_beam") || s.includes("turret_laser") || s.includes("drone_laser")) {
    const giant = s.includes("mecha_giant_laser") || s.includes("engineer_laser_module_beam");
    const handLaser = styleInfo.mechaMuzzle;
    const beamWidth = giant ? Math.max(44, Number(effect.width || 56)) : handLaser ? Math.max(13, Number(effect.width || 16)) : s.includes("turret") ? 12 : 8;
    const effectColor = (effect as { color?: string }).color;
    const tint = giant ? (effectColor || "#c084fc") : s.includes("turret") && !handLaser ? "#fde68a" : "#67e8f9";
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 8, "#08111f", alpha * 0.34, z - 8, "add");
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.74, z - 4, "add");
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(3, beamWidth * 0.34), "#f8fafc", alpha * 0.8, z - 1, "add");
    for (let i = 1; i <= 4; i += 1) {
      const t = i / 5;
      const x = end.fromX + (end.toX - end.fromX) * t;
      const y = end.fromY + (end.toY - end.fromY) * t;
      host.drawGfxCircle(x, y, 4 + (i % 2) * 2 + peak * 2, tint, alpha * 0.24, "#f8fafc", alpha * 0.12, 1, z + i, "add", 8);
    }
    host.drawGfxImpactBurst(end.toX, end.toY, beamWidth * (2.1 + peak * 0.4), tint, alpha * 0.26, z + 8, progress * 2.4, 7);
  } else if (s.includes("engineer_laser_module_core") || s.includes("mecha_laser_core")) {
    const coreRadius = Math.max(48, effectRadius * 0.58);
    host.drawGfxCircle(effect.x, effect.y, coreRadius * (0.72 + peak * 0.16), "#170728", alpha * 0.22, "#c084fc", alpha * 0.58, 4, z - 2, "add", 28);
    host.drawGfxCircle(effect.x, effect.y, coreRadius * (0.28 + peak * 0.08), "#c084fc", alpha * 0.36, "#f5d0fe", alpha * 0.72, 3, z + 8, "add", 16);
    host.drawGfxImpactBurst(effect.x, effect.y, coreRadius * (0.82 + peak * 0.18), "#c084fc", alpha * 0.38, z + 12, progress * 2.8, 10);
  } else if (s.includes("shock_mine")) {
    const mineRadius = effectRadius;
    host.drawGfxCircle(effect.x, effect.y, mineRadius, "#9ee6ff", alpha * 0.055, "#9ee6ff", alpha * 0.32, 3, z - 8, "add", 32);
    host.drawGfxGear(effect.x, effect.y, mineRadius * 0.42, "#9ee6ff", alpha * 0.4, z - 4, progress * 2.8, 12);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + progress * 1.2;
      host.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * mineRadius * 0.72, effect.y + Math.sin(a) * mineRadius * 0.72, "#67e8f9", alpha * 0.42, z + i, 4, 4, 11, progress + i * 0.19);
    }
    host.drawGfxCircle(effect.x, effect.y, 16 + peak * 6, "#dbeafe", alpha * 0.32, "#9ee6ff", alpha * 0.34, 2, z + 9, "add", 12);
  } else if (s.includes("turret") || s.includes("device_throw")) {
    const device = String((effect as { device?: string }).device || "");
    const mineLike = device.includes("mine");
    const chargedMine = device.includes("charged");
    const deviceTint = mineLike ? (chargedMine ? "#a78bfa" : "#67e8f9") : "#d6b76d";
    const deviceDark = mineLike ? "#06121f" : "#4b3b22";
    const throwLike = s.includes("throw");
    if (throwLike) host.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, deviceTint, alpha * 0.56, z - 4, 4);
    host.drawGfxGear(effect.x, effect.y, 34 + peak * 5, deviceTint, alpha * 0.42, z - 1, progress * 1.8, 10);
    host.drawGfxCircle(effect.x, effect.y, 30 + peak * 6, deviceTint, alpha * 0.12, mineLike ? "#dbeafe" : "#fde68a", alpha * 0.34, 3, z, "add", 16);
    host.drawGfxLine(effect.x - 20, effect.y + 12, effect.x + 20, effect.y + 12, 8, deviceDark, alpha * 0.74, z + 2, "normal");
    host.drawGfxLine(effect.x - 4, effect.y + 10, effect.x + Math.cos(angle) * 32, effect.y + Math.sin(angle) * 20, 9, deviceTint, alpha * 0.82, z + 3, "normal");
    host.drawGfxCircle(effect.x, effect.y, 9, "#9ee6ff", alpha * 0.32, "#dbeafe", alpha * 0.26, 2, z + 4, "add", 10);
    host.drawGfxSparkSpray(effect.x + Math.cos(angle) * 30, effect.y + Math.sin(angle) * 20, 28, "#9ee6ff", alpha * 0.28, z + 8, 7, progress * 3.4, angle, Math.PI * 0.9);
  } else if (styleInfo.basicTechBolt) {
    const boltTint = s.includes("mecha") ? "#67e8f9" : "#d6b76d";
    const core = "#f8fafc";
    const width = Math.max(5, effectRadius * 0.07);
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width + 7, "#06131f", alpha * 0.3, z - 2, "add");
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width, boltTint, alpha * 0.72, z + 1, "add");
    host.drawGfxLine(end.fromX + Math.cos(angle) * 12, end.fromY + Math.sin(angle) * 12, end.toX, end.toY, Math.max(2, width * 0.32), core, alpha * 0.68, z + 4, "add");
    host.drawGfxCircle(end.toX, end.toY, 12 + peak * 6, boltTint, alpha * 0.14, core, alpha * 0.34, 2, z + 8, "add", 12);
    host.drawGfxSparkSpray(end.toX, end.toY, 34 + peak * 8, boltTint, alpha * 0.22, z + 14, 7, progress * 3.6, angle, Math.PI * 0.72);
  } else if (s.includes("drone")) {
    host.drawGfxCircle(effect.x, effect.y - 12, 24 + peak * 5, "#9ee6ff", alpha * 0.08, "#9ee6ff", alpha * 0.26, 2, z - 1, "add", 20);
    host.drawGfxGear(effect.x, effect.y - 12, 28 + peak * 3, "#9ee6ff", alpha * 0.22, z - 2, -progress * 3.4, 8);
    for (let i = 0; i < 4; i += 1) {
      const a = Math.PI / 4 + (Math.PI * 2 * i) / 4 + progress * 1.6;
      host.drawGfxLine(effect.x + Math.cos(a) * 8, effect.y - 12 + Math.sin(a) * 8, effect.x + Math.cos(a) * 24, effect.y - 12 + Math.sin(a) * 24, 5, "#d6b76d", alpha * 0.72, z + i, "add");
    }
  } else {
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#67e8f9", alpha * 0.78, z, 7, 7, 17, progress * 1.5);
  }
  return true;
}

export function renderCrispPrimaryClassStyledEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return renderCrispRangerEffect(host, context) || renderCrispMageEffect(host, context) || renderCrispEngineerEffect(host, context);
}

export function renderCrispAlchemistEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, effectRadius, peak, end, z } = context;
  if (!(s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("fire_tick"))) return false;
  const mode = String(effect.mode || effect.flask || effect.damageType || "").toLowerCase();
  const fire = mode.includes("fire") || s.includes("fire") || s.includes("reaction");
  const heal = s.includes("elixir");
  const tint = heal ? "#bbf7d0" : fire ? "#f97316" : "#bef264";
  if (s.includes("throw") || s.includes("bottle") || s.includes("bomb")) {
    host.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.34, z - 6, 3);
    host.drawGfxSparkSpray(effect.x - Math.cos(angle) * 12, effect.y - Math.sin(angle) * 12, 24, tint, alpha * 0.2, z - 3, 5, progress * 2, angle + Math.PI, Math.PI * 0.8);
    host.drawGfxFlask(effect.x, effect.y, angle + progress * 2.1, tint, alpha * 0.86, z + 1, 0.95);
  }
  if (heal) {
    host.drawGfxCircle(effect.x, effect.y, effectRadius * 0.72, "#bbf7d0", alpha * 0.08, "#86efac", alpha * 0.28, 3, z, "add", 28);
    host.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.48, "#bbf7d0", alpha * 0.34, z + 1, progress * 1.5, 8);
    host.drawGfxLine(effect.x - 19, effect.y, effect.x + 19, effect.y, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
    host.drawGfxLine(effect.x, effect.y - 19, effect.x, effect.y + 19, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
  } else if (!s.includes("throw") || s.includes("reaction") || s.includes("tick")) {
    host.drawGfxCircle(effect.x, effect.y, effectRadius * (fire ? 0.76 : 0.66), tint, alpha * (fire ? 0.13 : 0.1), tint, alpha * 0.28, 3, z - 2, "add", 28);
    host.drawGfxSwirl(effect.x, effect.y, effectRadius * (fire ? 0.54 : 0.48), tint, alpha * 0.22, z - 1, progress * (fire ? 2.2 : 1.4), fire ? 4 : 3);
    for (let i = 0; i < (fire ? 8 : 6); i += 1) {
      const a = (Math.PI * 2 * i) / (fire ? 8 : 6) + progress * 0.4;
      const r = effectRadius * (0.28 + (i % 3) * 0.09);
      if (fire) {
        const x = effect.x + Math.cos(a) * r;
        const y = effect.y + Math.sin(a) * r * 0.65;
        host.drawGfxPath([{ x, y: y - 14 }, { x: x + 8, y: y + 11 }, { x: x - 8, y: y + 11 }], i % 2 ? "#f97316" : "#fde68a", alpha * 0.42, "#f97316", alpha * 0.18, 1, z + i, "add");
      } else {
        host.drawGfxCircle(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r * 0.75, 8 + peak * 3, "#bef264", alpha * 0.24, "#d9f99d", alpha * 0.18, 1, z + i, "add", 10);
      }
    }
  }
  return true;
}

export function renderCrispPuppetEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, effectRadius, peak, end, z } = context;
  if (!(s.includes("puppet") || s.includes("thread"))) return false;
  const tint = "#f5d0fe";
  host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.46, z - 2, s.includes("cage") || s.includes("theater") ? 6 : 4, 6, 10, progress);
  host.drawGfxRuneRing(effect.x, effect.y, Math.max(28, effectRadius * 0.36), "#b985c8", alpha * 0.24, z - 3, progress * 2.2, 7);
  host.drawGfxCircle(effect.x, effect.y, 20 + peak * 5, "#b985c8", alpha * 0.12, tint, alpha * 0.28, 2, z, "add", 18);
  if (s.includes("cage") || s.includes("theater")) {
    const cageRadius = effectRadius * 0.78;
    host.drawGfxCircle(effect.x, effect.y, cageRadius, "#b985c8", alpha * 0.04, tint, alpha * 0.3, 3, z - 4, "add", 34);
    host.drawGfxRuneRing(effect.x, effect.y, cageRadius * 0.92, tint, alpha * 0.22, z - 2, -progress * 1.2, 12);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      const x = effect.x + Math.cos(a) * cageRadius;
      const y = effect.y + Math.sin(a) * cageRadius;
      host.drawGfxLine(x, y - 24, x, y + 24, 2, tint, alpha * 0.28, z + i, "add");
    }
  }
  if (s.includes("summon") || s.includes("ambush") || s.includes("lunge")) {
    host.drawGfxSwirl(effect.x, effect.y, 36 + peak * 8, tint, alpha * 0.24, z + 1, progress * 2.4, 3);
    host.drawGfxLine(effect.x - 20, effect.y + 18, effect.x + 20, effect.y + 18, 8, "#44254f", alpha * 0.7, z + 2, "normal");
    host.drawGfxCircle(effect.x, effect.y, 13, "#b985c8", alpha * 0.6, tint, alpha * 0.4, 2, z + 3, "normal", 10);
  }
  return true;
}

export function renderCrispMartialEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, s, angle, effectRadius, peak, end, z } = context;
  if (!s.includes("martial")) return false;
  const tint = "#fde68a";
  if (s.includes("palm")) {
    for (let i = 0; i < 3; i += 1) {
      const r = radius * (0.36 + i * 0.22 + progress * 0.14);
      host.drawGfxArc(effect.x, effect.y, r, angle - 0.62, angle + 0.62, 7 - i, tint, alpha * (0.54 - i * 0.12), z + i, "add", 12);
    }
    host.drawGfxLine(effect.x - Math.cos(angle) * 8, effect.y - Math.sin(angle) * 8, effect.x + Math.cos(angle) * radius * 0.74, effect.y + Math.sin(angle) * radius * 0.74, 10, "#f8f3e9", alpha * 0.28, z + 5, "add");
    host.drawGfxSparkSpray(effect.x + Math.cos(angle) * radius * 0.64, effect.y + Math.sin(angle) * radius * 0.64, 38, tint, alpha * 0.34, z + 8, 9, progress * 3, angle, Math.PI * 0.72);
  } else if (s.includes("rising")) {
    host.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, 28, tint, alpha * 0.46, z - 4);
    host.drawGfxCircle(end.toX, end.toY, 24 + peak * 12, tint, alpha * 0.18, "#f8f3e9", alpha * 0.38, 3, z + 5, "add", 16);
    host.drawGfxImpactBurst(end.toX, end.toY, 54 + peak * 10, tint, alpha * 0.34, z + 8, progress, 10);
  } else if (s.includes("focus")) {
    host.drawGfxCircle(effect.x, effect.y, effectRadius, tint, alpha * 0.06, tint, alpha * 0.34, 3, z, "add", 34);
    host.drawGfxStar(effect.x, effect.y, 28 + peak * 8, "#f8f3e9", alpha * 0.44, z + 2, 6);
    host.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.72, tint, alpha * 0.34, z + 1, progress * 2.6, 8);
  }
  return s.includes("palm") || s.includes("rising") || s.includes("focus");
}

export function renderCrispAssassinEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, kind, angle, effectRadius, peak, end, z } = context;
  if (!(s.includes("assassin") || s.includes("shadow") || s.includes("smoke_bomb") || s.includes("stalker"))) return false;
  const tint = "#c4b5fd";
  if (s.includes("smoke")) {
    host.drawGfxCircle(effect.x, effect.y, effectRadius, "#21142f", alpha * 0.28, tint, alpha * 0.18, 2, z - 4, "add", 32);
    host.drawGfxSwirl(effect.x, effect.y, effectRadius * 0.74, tint, alpha * 0.22, z - 2, progress * 2.6, 4);
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6 + progress;
      host.drawGfxCircle(effect.x + Math.cos(a) * effectRadius * 0.36, effect.y + Math.sin(a) * effectRadius * 0.24, 18 + peak * 6, "#8a6f9e", alpha * 0.12, tint, alpha * 0.1, 1, z + i, "add", 12);
    }
  } else if (s.includes("lunge") || kind === "dash") {
    const lane = Math.max(34, effectRadius * 0.28);
    const midX = (end.fromX + end.toX) * 0.5;
    const midY = (end.fromY + end.toY) * 0.5;
    host.drawGfxCircle(midX, midY, lane * 0.62, "#21142f", alpha * 0.12, tint, alpha * 0.09, 1, z - 8, "add", 14);
    host.drawGfxArc(end.toX, end.toY, 34 + peak * 6, angle - 1.1, angle + 0.36, 7, tint, alpha * 0.64, z + 4, "add", 10);
    host.drawGfxSparkSpray(end.toX, end.toY, 42, tint, alpha * 0.32, z + 6, 8, progress, angle, Math.PI * 0.68);
  } else if (s.includes("mark") || s.includes("shuriken")) {
    host.drawGfxStar(effect.x, effect.y, 30 + peak * 7, tint, alpha * 0.5, z, 4);
    host.drawGfxCircle(effect.x, effect.y, 38 + peak * 5, "#8a6f9e", alpha * 0.05, tint, alpha * 0.24, 2, z - 2, "add", 20);
    host.drawGfxRuneRing(effect.x, effect.y, 44 + peak * 5, tint, alpha * 0.24, z + 1, progress * 3.4, 8);
  }
  return true;
}

export function renderCrispClassStyledEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  return (
    renderCrispAlchemistEffect(host, context) ||
    renderCrispPuppetEffect(host, context) ||
    renderCrispMartialEffect(host, context) ||
    renderCrispAssassinEffect(host, context)
  );
}
