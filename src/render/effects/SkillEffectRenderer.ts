export interface SkillEffectView {
  kind?: string;
  x: number;
  y: number;
  radius?: number;
  range?: number;
  rangeRadius?: number;
  distance?: number;
  angle?: number;
  seed?: number;
  contactRadius?: number;
  moveDuration?: number;
  duration?: number;
  ttl?: number;
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
  const width = Math.max(72, Number(effect.contactRadius || 64) * 1.18);
  const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
  const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
  const travel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
  const headX = end.fromX + (end.toX - end.fromX) * travel;
  const headY = end.fromY + (end.toY - end.fromY) * travel;
  const px = -Math.sin(angle);
  const py = Math.cos(angle);
  const chargeAlpha = alpha * (0.78 + peak * 0.18);
  const wakeAlpha = alpha * (0.42 + peak * 0.12);
  host.drawGfxShieldWake(end.fromX, end.fromY, headX, headY, width * 1.08, angle, "#f97316", wakeAlpha, z - 14, progress);
  host.drawGfxShieldPlow(headX, headY, angle, width * 1.18, "#f97316", chargeAlpha, z + 8, progress);
  for (let i = -2; i <= 2; i += 1) {
    const side = i * width * 0.2;
    const sx = headX - Math.cos(angle) * width * (0.86 + Math.abs(i) * 0.04) + px * side;
    const sy = headY - Math.sin(angle) * width * (0.86 + Math.abs(i) * 0.04) + py * side;
    const ex = headX - Math.cos(angle) * width * (0.22 + Math.abs(i) * 0.06) + px * side * 0.72;
    const ey = headY - Math.sin(angle) * width * (0.22 + Math.abs(i) * 0.06) + py * side * 0.72;
    host.drawGfxLine(sx, sy, ex, ey, i === 0 ? 10 : 5, i === 0 ? "#fff7ed" : "#fde68a", alpha * (i === 0 ? 0.34 : 0.2), z - 5 + i, "add");
  }
  host.drawGfxSparkSpray(headX + Math.cos(angle) * width * 0.48, headY + Math.sin(angle) * width * 0.48, width * 0.56, "#fde68a", alpha * 0.36, z + 18, 11, progress * 3.1, angle, Math.PI * 0.68);
  if (travel >= 1) {
    host.drawGfxShieldCrash(end.toX, end.toY, angle, width, "#f97316", alpha * Math.max(0.2, 1 - (progress - moveDuration / fullDuration) * 3), z + 18, progress);
  }
  return true;
}

export function renderWarriorSpinEffect(host: WarriorSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, radius, angle, peak, z, kind } = context;
  if (kind !== "spin") return false;
  const spinRadius = Math.max(120, Number(effect.rangeRadius || effect.radius || radius));
  const ease = 1 - Math.pow(1 - progress, 3);
  const bladeAngle = angle - Math.PI * 0.5 + progress * Math.PI * 2;
  const waveRadius = spinRadius * (0.28 + ease * 0.72);
  const bladeReach = spinRadius * (0.84 + peak * 0.04);
  const ringAlpha = alpha * (0.42 + peak * 0.22);
  host.drawGfxCircle(effect.x, effect.y, waveRadius, "#f97316", 0, "#f8f3e9", ringAlpha, 6, z - 10, "add", 72);
  host.drawGfxCircle(effect.x, effect.y, Math.max(18, waveRadius - 13), "#f97316", 0, "#f97316", alpha * 0.28, 3, z - 9, "add", 64);
  host.drawGfxArc(effect.x, effect.y, bladeReach * 0.86, bladeAngle - 0.45, bladeAngle - 0.08, 12, "#f8f3e9", alpha * 0.28, z + 3, "add", 9);
  host.drawGfxArc(effect.x, effect.y, bladeReach * 0.7, bladeAngle - 0.34, bladeAngle - 0.08, 5, "#f97316", alpha * 0.32, z + 4, "add", 8);
  host.drawGfxGreatsword(effect.x, effect.y, bladeAngle, bladeReach, "#f97316", alpha * (0.88 + peak * 0.1), z + 12, true);
  const tipX = effect.x + Math.cos(bladeAngle) * bladeReach * 0.96;
  const tipY = effect.y + Math.sin(bladeAngle) * bladeReach * 0.96;
  host.drawGfxSparkSpray(tipX, tipY, 34, "#fde68a", alpha * 0.34, z + 18, 9, progress * 3.2, bladeAngle, Math.PI * 0.62);
  for (let i = 0; i < 8; i += 1) {
    const a = bladeAngle - 0.7 + i * 0.2;
    const outer = spinRadius * (0.68 + (i % 2) * 0.04);
    const inner = outer - 18 - i * 1.5;
    host.drawGfxLine(
      effect.x + Math.cos(a) * inner,
      effect.y + Math.sin(a) * inner,
      effect.x + Math.cos(a) * outer,
      effect.y + Math.sin(a) * outer,
      i % 2 ? 3 : 4,
      i % 2 ? "#f97316" : "#fde68a",
      alpha * (0.2 - i * 0.012),
      z + 5 + i,
      "add",
    );
  }
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
  if (renderWarriorSpinEffect(host, context)) return true;
  if (renderWarriorSlamEffect(host, context)) return true;
  host.renderWarriorConeEffect(effect, progress, alpha, color, s.includes("cleave"));
  return true;
}

export function renderWarriorStyledSkillEffect(host: WarriorSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const { effect, progress, alpha, radius, s, z } = context;
  if (s.includes("taunt")) {
    const tauntRadius = Math.max(80, Number(effect.rangeRadius || effect.radius || radius));
    host.drawGfxShoutWave(effect.x, effect.y, tauntRadius, "#f97316", alpha * 0.9, z, progress);
    host.drawGfxSparkSpray(effect.x, effect.y - 10, tauntRadius * 0.42, "#fde68a", alpha * 0.34, z + 12, 10, progress * 3.6, -Math.PI / 2, Math.PI * 0.82);
    return true;
  }
  return renderWarriorImpactEffect(host, context) || renderWarriorShieldChargeEffect(host, context) || renderWarriorBodyEffect(host, context);
}

export function renderRangerArrowRainEffect(host: RangerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, kind, z, s } = context;
  if (!s.includes("arrow_rain")) return false;
  const rainRadius = effectRadius;
  host.fx("fx-warning-target", effect.x, effect.y, rainRadius / 48, rainRadius / 48, "#f1d08b", alpha * (kind === "warning" ? 0.56 : 0.28), z - 22, progress * 0.8, "add");
  const dropCount = kind === "warning" ? 5 : 8;
  for (let i = 0; i < dropCount; i += 1) {
    const a = (Math.PI * 2 * i) / dropCount + host.noise(i, effect.x) * 0.5;
    const r = rainRadius * (0.16 + host.noise(i * 3, effect.y) * 0.62);
    const fall = (progress + i / dropCount) % 1;
    const x = effect.x + Math.cos(a) * r;
    const y = effect.y + Math.sin(a) * r - 80 + fall * 120;
    const arrow = host.fx("fx-arrow-rain", x, y, 0.42, 0.5, "#f1d08b", alpha * 0.82, z + i, 0, "add");
    arrow.alpha *= kind === "warning" ? 0.7 : 1;
  }
  return true;
}

export function renderRangerVolleyEffect(host: RangerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, end, z } = context;
  if (!(s.includes("ranger_barrage") || s.includes("arrow_fan") || s.includes("piercing") || s.includes("poison_volley") || s.includes("poison_arrow"))) {
    return false;
  }
  if (s.includes("piercing")) {
    host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 9, "#f1d08b", alpha * 0.22, z - 8, "add");
    host.fx("fx-pierce-lance", effect.x, effect.y, 1.02 + peak * 0.2, 0.92, "#f1d08b", alpha * 0.9, z, angle, "add");
    host.fx("fx-impact-star", end.toX, end.toY, 0.42, 0.42, "#fde68a", alpha * 0.5, z + 3, progress * 1.4, "add");
  } else {
    const poisonTint = s.includes("poison") ? "#bef264" : "#f1d08b";
    host.fx("fx-arrow-fan", effect.x, effect.y, 0.98 + peak * 0.16, 0.9 + peak * 0.1, poisonTint, alpha * 0.88, z, angle, "add");
    if (s.includes("poison")) {
      host.fx("fx-poison-cloud", effect.x + Math.cos(angle) * 42, effect.y + Math.sin(angle) * 22, 0.46, 0.36, "#bef264", alpha * 0.46, z + 2, progress, "add");
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
  const snap = progress < 0.24 ? 1.24 : 1.08 - (progress - 0.24) * 0.28;
  host.fx("fx-frost-snap", effect.x, effect.y, frostRadius / 86 * snap, frostRadius / 86 * snap, "#dbeafe", alpha * 0.95, z, progress * 0.15, "add");
  host.fx("fx-frost-shards", effect.x, effect.y, frostRadius / 94 * pulse, frostRadius / 94 * pulse, "#93c5fd", alpha * 0.45, z - 2, -progress * 0.35, "add");
  host.ring(effect.x, effect.y, frostRadius * (0.72 + peak * 0.1), "#93c5fd", alpha * 0.25, 4);
  return true;
}

export function renderMageMeteorEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, effectRadius, peak, z, s } = context;
  if (!s.includes("meteor")) return false;
  const meteorRadius = effectRadius;
  const fall = Math.min(1, progress * 1.45);
  const startX = effect.x - meteorRadius * 0.62;
  const startY = effect.y - meteorRadius * 1.65;
  const x = startX + (effect.x - startX) * fall;
  const y = startY + (effect.y - startY) * fall;
  host.fx("fx-meteor-fall", x, y, 0.82 + fall * 0.34, 0.82 + fall * 0.34, "#f97316", alpha * 0.94, z + 4, 0.78, "add");
  host.lineFx("beam", startX, startY, x, y, 18, "#f97316", alpha * 0.22, z - 4, "add");
  if (progress > 0.4) {
    host.fx("fx-fire-bloom", effect.x, effect.y, meteorRadius / 70 + peak * 0.28, meteorRadius / 70 + peak * 0.28, "#f97316", alpha * 0.74, z + 8, progress * 1.6, "add");
    host.fx("fx-fire-pool", effect.x, effect.y + 12, meteorRadius / 78, meteorRadius / 90, "#f97316", alpha * 0.48, z + 1, 0, "add");
  }
  return true;
}

export function renderMageChainEffect(host: MageSkillRendererHost, context: StyledSkillContext): boolean {
  const { progress, alpha, s, kind, peak, end, z } = context;
  if (!(s.includes("chain_lightning") || s.includes("engineer_overclock") || (kind === "chain" && (s.includes("lightning") || s.includes("electric"))))) {
    return false;
  }
  host.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, 18, "#9ee6ff", alpha * 0.96, z, "add");
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 6, "#dbeafe", alpha * 0.28, z - 2, "add");
  host.fx("fx-impact-star", end.toX, end.toY, 0.46 + peak * 0.12, 0.46 + peak * 0.12, "#dbeafe", alpha * 0.62, z + 4, progress * 2, "add");
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
  const { effect, progress, alpha, s, peak, end, z } = context;
  if (!(s.includes("turret_fire") || s.includes("rail_turret") || s.includes("drone_laser") || s.includes("engineer_bolt"))) {
    return false;
  }
  const rail = s.includes("rail");
  host.lineFx(rail ? "beam" : "fx-lightning", end.fromX, end.fromY, end.toX, end.toY, rail ? 12 : 10, rail ? "#fde68a" : "#9ee6ff", alpha * 0.72, z, "add");
  host.fx("fx-impact-star", effect.x, effect.y, 0.36 + peak * 0.1, 0.36 + peak * 0.1, "#9ee6ff", alpha * 0.52, z + 2, progress * 2, "add");
  return true;
}

export function renderEngineerDroneEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, z } = context;
  if (!s.includes("drone")) return false;
  host.fx("fx-drone", effect.x, effect.y - 8, 0.82 + peak * 0.12, 0.82 + peak * 0.12, "#d6b76d", alpha * 0.86, z, progress * 0.1, "normal");
  host.fx("fx-lightning", effect.x, effect.y, 0.58, 0.26, "#9ee6ff", alpha * 0.42, z + 2, angle, "add");
  return true;
}

export function renderEngineerMineEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, peak, effectRadius, z } = context;
  if (!s.includes("shock_mine")) return false;
  host.fx("fx-mine", effect.x, effect.y, 0.94 + peak * 0.18, 0.94 + peak * 0.18, "#9ee6ff", alpha * 0.82, z, progress * 1.4, "add");
  host.fx("fx-lightning", effect.x, effect.y, effectRadius / 88, 0.62, "#9ee6ff", alpha * 0.56, z + 1, progress * 2.2, "add");
  return true;
}

export function renderEngineerDeviceEffect(host: EngineerSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, alpha, s, angle, peak, end, z } = context;
  if (!(s.includes("engineer") || s.includes("turret") || s.includes("rail_"))) return false;
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 7, "#d6b76d", alpha * 0.22, z - 4, "add");
  host.fx("fx-turret", effect.x, effect.y, 0.78 + peak * 0.14, 0.78 + peak * 0.14, "#d6b76d", alpha * 0.86, z, angle, "normal");
  return true;
}

export function renderEngineerStyledSkillEffect(host: EngineerSkillRendererHost, context: StyledSkillContext | null): boolean {
  if (!context) return false;
  const s = context.s;
  if (!(s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("shock_mine") || s.includes("rail_"))) {
    return false;
  }
  return (
    renderEngineerBeamEffect(host, context) ||
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
  host.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 15, "#8a6f9e", alpha * 0.28, z - 4, "add");
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
  if (s.includes("arrow_rain")) {
    const rainRadius = effectRadius;
    const warn = kind === "warning";
    host.drawGfxCircle(effect.x, effect.y, rainRadius, "#f1d08b", alpha * (warn ? 0.055 : 0.075), "#f1d08b", alpha * (warn ? 0.34 : 0.24), warn ? 4 : 3, z - 20, "add", 42);
    host.drawGfxCircle(effect.x, effect.y, rainRadius * 0.52, "#f1d08b", alpha * 0.025, "#fde68a", alpha * 0.18, 2, z - 19, "add", 28);
    host.drawGfxRuneRing(effect.x, effect.y, rainRadius * 0.88, "#f1d08b", alpha * (warn ? 0.18 : 0.28), z - 18, -progress * 1.8, 12);
    const dropCount = warn ? 6 : 12;
    for (let i = 0; i < dropCount; i += 1) {
      const seed = host.noise(i * 19 + effect.x, effect.y * 0.1);
      const a = Math.PI * 2 * seed + i * 0.28;
      const r = rainRadius * (0.18 + host.noise(i * 7, effect.x) * 0.68);
      const fall = (progress * 1.45 + i / dropCount) % 1;
      const x = effect.x + Math.cos(a) * r;
      const y = effect.y + Math.sin(a) * r;
      const topX = x - 22 + fall * 18;
      const topY = y - rainRadius * 0.92 + fall * rainRadius * 1.16;
      host.drawGfxArrow(topX - 16, topY - 42, topX + 9, topY + 34, "#f1d08b", alpha * (warn ? 0.5 : 0.82), z + i, warn ? 3 : 4);
      if (!warn && fall > 0.62) host.drawGfxSparkSpray(x, y, 22, "#fde68a", alpha * 0.18, z + 20 + i, 4, progress + i);
    }
    return true;
  }

  if (s.includes("piercing") || s.includes("arrow_fan") || s.includes("ranger_barrage") || s.includes("poison_volley") || s.includes("poison_arrow") || s.includes("assassin_fan")) {
    const poison = s.includes("poison") || s.includes("venom");
    const tint = poison ? "#bef264" : s.includes("assassin") ? "#c4b5fd" : "#f1d08b";
    if (s.includes("piercing")) {
      const laneWidth = Math.max(18, radius * 0.28);
      host.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, laneWidth, tint, alpha * 0.58, z - 12);
      host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, laneWidth * 0.28, "#f8f3e9", alpha * 0.18, z - 10, "add");
      host.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, "#f8f3e9", alpha * 0.9, z + 3, 7);
      host.drawGfxArrow(end.fromX + Math.cos(angle + Math.PI / 2) * 10, end.fromY + Math.sin(angle + Math.PI / 2) * 10, end.toX + Math.cos(angle + Math.PI / 2) * 10, end.toY + Math.sin(angle + Math.PI / 2) * 10, tint, alpha * 0.58, z + 2, 3);
      host.drawGfxSparkSpray(end.toX, end.toY, laneWidth * 1.2, tint, alpha * 0.34, z + 8, 8, progress, angle, Math.PI * 0.8);
    } else {
      const count = s.includes("assassin") ? 5 : s.includes("barrage") || s.includes("volley") ? 5 : 3;
      const spread = s.includes("assassin") ? 0.78 : count >= 5 ? 0.64 : 0.46;
      for (let i = 0; i < count; i += 1) {
        const t = i / (count - 1) - 0.5;
        const a = angle + t * spread;
        const length = radius * (s.includes("assassin") ? 0.86 : 1.18);
        const sx = effect.x - Math.cos(a) * length * 0.42;
        const sy = effect.y - Math.sin(a) * length * 0.42;
        const tx = effect.x + Math.cos(a) * length * 0.58;
        const ty = effect.y + Math.sin(a) * length * 0.58;
        host.drawGfxArrow(sx, sy, tx, ty, i === Math.floor(count / 2) ? "#f8f3e9" : tint, alpha * (i === Math.floor(count / 2) ? 0.86 : 0.62), z + i, s.includes("assassin") ? 4 : 5);
        host.drawGfxLine(sx - Math.cos(a) * 28, sy - Math.sin(a) * 28, sx, sy, 2, tint, alpha * 0.24, z - 4 + i, "add");
      }
      if (poison) host.drawGfxCircle(effect.x + Math.cos(angle) * radius * 0.38, effect.y + Math.sin(angle) * radius * 0.38, 24 + peak * 8, "#bef264", alpha * 0.16, "#d9f99d", alpha * 0.22, 2, z + 8, "add", 18);
    }
    return true;
  }

  return false;
}

export function renderCrispMageEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, pulse, effectRadius, end, z } = context;
  if (s.includes("frost") || s.includes("freeze") || s.includes("ice")) {
    const frostRadius = effectRadius;
    const snap = progress < 0.18 ? 1.18 : 1.02 - (progress - 0.18) * 0.12;
    host.drawGfxCircle(effect.x, effect.y, frostRadius * snap, "#93c5fd", alpha * 0.07, "#dbeafe", alpha * 0.34, 4, z - 10, "add", 44);
    host.drawGfxRuneRing(effect.x, effect.y, frostRadius * 0.62, "#dbeafe", alpha * 0.36, z - 4, progress * 0.6, 6);
    host.drawGfxShardBurst(effect.x, effect.y, frostRadius * (0.78 + peak * 0.06), "#dbeafe", alpha * 0.72, z, s.includes("lock") ? 6 : 12, progress * 0.4);
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6 + 0.52;
      host.drawGfxLine(effect.x + Math.cos(a) * frostRadius * 0.16, effect.y + Math.sin(a) * frostRadius * 0.16, effect.x + Math.cos(a) * frostRadius * 0.62, effect.y + Math.sin(a) * frostRadius * 0.62, 3, "#93c5fd", alpha * 0.44, z + i, "add");
      host.drawGfxDiamond(effect.x + Math.cos(a) * frostRadius * 0.48, effect.y + Math.sin(a) * frostRadius * 0.48, 7 + peak * 2, "#dbeafe", alpha * 0.36, z + 10 + i, a);
    }
    return true;
  }

  if (s.includes("meteor")) {
    const meteorRadius = effectRadius;
    const fall = Math.min(1, progress * 1.45);
    const startX = effect.x - meteorRadius * 0.82;
    const startY = effect.y - meteorRadius * 2.45;
    const mx = startX + (effect.x - startX) * fall;
    const my = startY + (effect.y - startY) * fall;
    host.drawGfxCircle(effect.x, effect.y, meteorRadius, "#f97316", alpha * 0.045, "#f97316", alpha * 0.3, 4, z - 18, "add", 42);
    host.drawGfxRuneRing(effect.x, effect.y, meteorRadius * 0.86, "#f97316", alpha * 0.22, z - 16, progress * 1.2, 9);
    host.drawGfxLine(startX, startY, mx, my, 18, "#f97316", alpha * 0.22, z - 3, "add");
    host.drawGfxLine(startX + 16, startY - 10, mx + 8, my - 3, 7, "#fde68a", alpha * 0.3, z - 2, "add");
    host.drawGfxCircle(mx, my, 22 + peak * 8, "#f97316", alpha * 0.44, "#fde68a", alpha * 0.5, 3, z + 6, "add", 16);
    host.drawGfxSparkSpray(mx, my, meteorRadius * 0.32, "#fde68a", alpha * 0.34, z + 7, 9, progress * 2.2, Math.PI * 0.75, Math.PI * 0.9);
    if (progress > 0.36) {
      const bloom = (progress - 0.36) / 0.64;
      host.drawGfxCircle(effect.x, effect.y, meteorRadius * (0.42 + bloom * 0.38), "#f97316", alpha * 0.16, "#fde68a", alpha * 0.32, 4, z + 8, "add", 32);
      for (let i = 0; i < 9; i += 1) {
        const a = (Math.PI * 2 * i) / 9;
        const r = meteorRadius * (0.36 + (i % 3) * 0.08);
        const x = effect.x + Math.cos(a) * r;
        const y = effect.y + Math.sin(a) * r * 0.62;
        host.drawGfxPath(
          [
            { x, y: y - 18 - peak * 6 },
            { x: x + 9, y: y + 11 },
            { x: x - 9, y: y + 11 },
          ],
          i % 2 ? "#f97316" : "#fde68a",
          alpha * 0.42,
          "#f97316",
          alpha * 0.16,
          1,
          z + 10 + i,
          "add",
        );
      }
    }
    return true;
  }

  if (s.includes("chain_lightning") || s.includes("lightning") || s.includes("electric") || s.includes("overclock") || s.includes("rail_") || s.includes("drone_laser") || s.includes("turret_bolt") || s.includes("engineer_bolt")) {
    const tint = s.includes("rail") ? "#fde68a" : "#9ee6ff";
    const width = s.includes("rail") ? 10 : s.includes("overclock") ? 9 : 7;
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.82, z, width, s.includes("rail") ? 4 : 7, s.includes("rail") ? 3 : 12, progress);
    if (!s.includes("rail")) {
      host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#dbeafe", alpha * 0.32, z + 4, Math.max(2, width * 0.42), 5, 18, progress + 0.37);
    }
    host.drawGfxCircle(end.toX, end.toY, 16 + peak * 8, tint, alpha * 0.14, "#dbeafe", alpha * 0.36, 3, z + 8, "add", 14);
    host.drawGfxSparkSpray(end.toX, end.toY, 36 + peak * 8, "#dbeafe", alpha * 0.32, z + 12, 9, progress * 4.1);
    return true;
  }

  if (s.includes("star_orb") || s.includes("star_burst") || s.includes("arcane_splash") || s.includes("blink_")) {
    const tint = s.includes("blink") ? "#93c5fd" : "#dbeafe";
    const starRadius = effectRadius * (s.includes("burst") ? 0.78 : 0.46) * pulse;
    host.drawGfxRuneRing(effect.x, effect.y, Math.max(30, starRadius * 0.82), tint, alpha * 0.28, z - 5, progress * 2.6, s.includes("burst") ? 10 : 7);
    host.drawGfxStar(effect.x, effect.y, Math.max(22, starRadius), tint, alpha * 0.62, z, s.includes("burst") ? 10 : 6);
    host.drawGfxCircle(effect.x, effect.y, Math.max(28, effectRadius * (0.44 + peak * 0.12)), "#8d7cae", alpha * 0.08, tint, alpha * 0.22, 3, z - 2, "add", 28);
    host.drawGfxSparkSpray(effect.x, effect.y, Math.max(42, effectRadius * 0.7), tint, alpha * 0.28, z + 8, s.includes("burst") ? 14 : 8, progress * 3.8);
    return true;
  }

  return false;
}

export function renderCrispEngineerEffect(host: CrispClassSkillRendererHost, context: StyledSkillContext): boolean {
  const { effect, progress, alpha, s, angle, peak, effectRadius, end, z } = context;
  if (!(s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("shock_mine") || s.includes("mini_turret"))) return false;
  if (s.includes("shock_mine")) {
    const mineRadius = effectRadius;
    host.drawGfxCircle(effect.x, effect.y, mineRadius, "#9ee6ff", alpha * 0.055, "#9ee6ff", alpha * 0.32, 3, z - 8, "add", 32);
    host.drawGfxGear(effect.x, effect.y, mineRadius * 0.42, "#9ee6ff", alpha * 0.4, z - 4, progress * 2.8, 12);
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + progress * 1.2;
      host.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * mineRadius * 0.72, effect.y + Math.sin(a) * mineRadius * 0.72, "#9ee6ff", alpha * 0.36, z + i, 3, 3, 5, progress + i);
    }
    host.drawGfxCircle(effect.x, effect.y, 16 + peak * 6, "#dbeafe", alpha * 0.32, "#9ee6ff", alpha * 0.34, 2, z + 9, "add", 12);
  } else if (s.includes("turret") || s.includes("device_throw")) {
    const throwLike = s.includes("throw");
    if (throwLike) host.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, "#d6b76d", alpha * 0.56, z - 4, 4);
    host.drawGfxGear(effect.x, effect.y, 34 + peak * 5, "#d6b76d", alpha * 0.42, z - 1, progress * 1.8, 10);
    host.drawGfxCircle(effect.x, effect.y, 30 + peak * 6, "#d6b76d", alpha * 0.12, "#fde68a", alpha * 0.34, 3, z, "add", 16);
    host.drawGfxLine(effect.x - 20, effect.y + 12, effect.x + 20, effect.y + 12, 8, "#4b3b22", alpha * 0.74, z + 2, "normal");
    host.drawGfxLine(effect.x - 4, effect.y + 10, effect.x + Math.cos(angle) * 32, effect.y + Math.sin(angle) * 20, 9, "#d6b76d", alpha * 0.82, z + 3, "normal");
    host.drawGfxCircle(effect.x, effect.y, 9, "#9ee6ff", alpha * 0.32, "#dbeafe", alpha * 0.26, 2, z + 4, "add", 10);
    host.drawGfxSparkSpray(effect.x + Math.cos(angle) * 30, effect.y + Math.sin(angle) * 20, 28, "#9ee6ff", alpha * 0.28, z + 8, 7, progress * 3.4, angle, Math.PI * 0.9);
  } else if (s.includes("drone")) {
    host.drawGfxCircle(effect.x, effect.y - 12, 24 + peak * 5, "#9ee6ff", alpha * 0.08, "#9ee6ff", alpha * 0.26, 2, z - 1, "add", 20);
    host.drawGfxGear(effect.x, effect.y - 12, 28 + peak * 3, "#9ee6ff", alpha * 0.22, z - 2, -progress * 3.4, 8);
    for (let i = 0; i < 4; i += 1) {
      const a = Math.PI / 4 + (Math.PI * 2 * i) / 4 + progress * 1.6;
      host.drawGfxLine(effect.x + Math.cos(a) * 8, effect.y - 12 + Math.sin(a) * 8, effect.x + Math.cos(a) * 24, effect.y - 12 + Math.sin(a) * 24, 5, "#d6b76d", alpha * 0.72, z + i, "add");
    }
  } else {
    host.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#9ee6ff", alpha * 0.7, z, 6, 6, 8, progress);
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
    host.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, 32, tint, alpha * 0.54, z - 8);
    host.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 8, "#f5d0fe", alpha * 0.42, z, "add");
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
