import { effectStartIndex } from "./EffectBudget";

import { classifyEffectStyle } from "./EffectStyleClassifier";

export interface FloatingEffectView {
  kind?: string;
  age?: number;
  ttl?: number;
  value?: number | string;
  critical?: boolean;
  radius?: number;
  angle?: number;
  heavy?: boolean;
  active?: boolean;
  color?: string;
  style?: string;
  width?: number;
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  seed?: number;
  x: number;
  y: number;
}

export interface FloatingTextLike {
  text: string;
  alpha: number;
  zIndex: number;
  position: { set(x: number, y: number): void };
  scale: { set(value: number): void };
}

export interface FloatingEffectRendererHost {
  layers: { effect: unknown };
  diagnostics?: { effects: number };
  qualityPreset?: { effectBudget: number };
  textPool: {
    next(parent: unknown, style: FloatingTextStyle): FloatingTextLike;
  };
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
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
  sprite(
    key: string,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): { zIndex: number };
  renderStyledSkillEffect?(
    effect: FloatingEffectView,
    progress: number,
    alpha: number,
    radius: number,
    color: string,
    style: string,
  ): boolean;
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
  drawGfxShieldWake?(fromX: number, fromY: number, toX: number, toY: number, width: number, angle: number, color: string, alpha: number, zIndex: number, phase: number): void;
  drawGfxFrontShield?(x: number, y: number, angle: number, size: number, color: string, alpha: number, zIndex: number, phase: number): void;
  drawGfxShieldWall?(x: number, y: number, angle: number, size: number, color: string, alpha: number, zIndex: number, heavy: boolean): void;
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
  drawGfxLightning?(fromX: number, fromY: number, toX: number, toY: number, color: string, alpha: number, zIndex: number, width?: number, segments?: number, jitter?: number, phase?: number): void;
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
  drawGfxImpactBurst?(x: number, y: number, radius: number, color: string, alpha: number, zIndex: number, progress: number, count: number): void;
}

export interface FloatingTextStyle {
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  fill: string;
  stroke: { color: string; width: number };
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function effectProgress(effect: FloatingEffectView): number {
  return clamp01(Number(effect.age || 0) / Math.max(0.1, Number(effect.ttl || 0.7)));
}

export function effectRadius(effect: FloatingEffectView, fallbackRadius?: number): number {
  const rawRadius = Math.max(18, Number(fallbackRadius || effect.radius || 42));
  const style = String(`${effect.style || ""} ${effect.kind || ""}`).toLowerCase();
  if (effect.kind === "warning") return Math.min(rawRadius, 190);
  if (effect.kind === "meteor") return Math.min(rawRadius, 150);
  if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") {
    return Math.min(rawRadius, 92);
  }
  if ((effect.kind === "freeze" || effect.kind === "slow") && (style.includes("frost_wave") || style.includes("frost_breath"))) {
    return Math.min(rawRadius, 520);
  }
  if (effect.kind === "freeze" || effect.kind === "slow") return Math.min(rawRadius, 120);
  return Math.min(rawRadius, 110);
}

function isVenomEffect(effect: FloatingEffectView): boolean {
  return String(`${effect.style || ""} ${effect.kind || ""}`).toLowerCase().includes("venom");
}

export function floatingTextStyle(effect: FloatingEffectView, color: string): FloatingTextStyle {
  const tint = isVenomEffect(effect) ? "#c084fc" : color;
  return {
    fontFamily: "Inter, sans-serif",
    fontWeight: "900",
    fontSize: effect.critical ? 26 : effect.kind === "xp" ? 15 : 18,
    fill: effect.kind === "heal" ? "#bbf7d0" : effect.kind === "xp" ? "#dbeafe" : tint,
    stroke: { color: "#000000", width: effect.critical ? 5 : 3 },
  };
}

export function floatingTextValue(effect: FloatingEffectView): string {
  if (effect.kind === "xp") return `+${effect.value || 0} XP`;
  if (effect.kind === "heal") return `+${effect.value || 0}`;
  return String(effect.value || "");
}

export function isFloatingTextEffect(effect: FloatingEffectView): boolean {
  return effect.kind === "damage" || effect.kind === "heal" || effect.kind === "xp" || (effect.kind === "poison" && Boolean(effect.value));
}

export function renderFloatingTextEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  color: string,
): boolean {
  if (!isFloatingTextEffect(effect)) return false;
  const text = host.textPool.next(host.layers.effect, floatingTextStyle(effect, color));
  text.text = floatingTextValue(effect);
  text.position.set(effect.x, effect.y - progress * 28);
  text.alpha = alpha;
  text.scale.set(1 + (effect.critical ? 0.24 : 0.1) * Math.max(0, 1 - progress * 3));
  text.zIndex = effect.y + 100;
  return true;
}

export function renderSlashEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "slash") return false;
  const cleave = style.includes("cleave") || style.includes("brute") || style.includes("mini_cleave") || style.includes("warrior");
  const puppet = style.includes("puppet") || style.includes("thread");
  const assassin = style.includes("shadow") || style.includes("assassin") || style.includes("stalker");
  const key = cleave ? "fx-cleave" : "fx-sword-cut";
  const angle = Number(effect.angle || 0);
  const slashScale = (cleave ? 0.72 : 0.82) + progress * (cleave ? 0.32 : 0.24);
  host.fx(key, effect.x, effect.y, slashScale, slashScale, assassin ? "#8a6f9e" : puppet ? "#f5d0fe" : color, alpha * 0.92, effect.y + 96, angle + progress * 0.42, "add");
  if (assassin || puppet) {
    if (puppet && host.drawGfxLightning) {
      host.drawGfxLightning(effect.x - Math.cos(angle) * 28, effect.y - Math.sin(angle) * 16, effect.x + Math.cos(angle) * 12, effect.y + Math.sin(angle) * 7, "#b985c8", alpha * 0.28, effect.y + 88, 2.6, 4, 8, progress + effect.x * 0.01);
    } else {
      const smoke = host.fx("fx-smoke", effect.x - Math.cos(angle) * 18, effect.y - Math.sin(angle) * 18, 0.55, 0.42, "#21142f", alpha * 0.32, effect.y + 88, angle, "add");
      smoke.alpha *= 0.8;
    }
  }
  if (style.includes("shield") || style.includes("slam")) {
    host.fx("fx-impact-star", effect.x, effect.y, radius / 62, radius / 62, "#facc15", alpha * 0.58, effect.y + 100, progress * 0.8, "add");
  }
  return true;
}

export function renderSpinEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "spin") return false;
  const spin = host.fx("fx-spin", effect.x, effect.y, radius / 50 + progress * 0.35, radius / 50 + progress * 0.35, color, alpha * 0.78, effect.y + 94, Number(effect.angle || 0) + progress * 2.6, "add");
  spin.alpha *= style.includes("warrior") ? 1 : 0.82;
  return true;
}

function effectEndpoints(effect: FloatingEffectView, radius: number, angle: number): { fromX: number; fromY: number; toX: number; toY: number } {
  if (Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY) && Number.isFinite(effect.toX) && Number.isFinite(effect.toY)) {
    return { fromX: Number(effect.fromX), fromY: Number(effect.fromY), toX: Number(effect.toX), toY: Number(effect.toY) };
  }
  const half = Math.max(28, radius * 0.7);
  return {
    fromX: effect.x - Math.cos(angle) * half,
    fromY: effect.y - Math.sin(angle) * half,
    toX: effect.x + Math.cos(angle) * half,
    toY: effect.y + Math.sin(angle) * half,
  };
}

export function renderChainEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): void {
  const angle = Number(effect.angle || 0);
  const style = String(`${effect.style || ""} ${effect.kind || ""}`).toLowerCase();
  const empowered = style.includes("empowered_current") || style.includes("red_lightning");
  const engineer = style.includes("engineer") || style.includes("turret") || style.includes("drone") || style.includes("overclock") || style.includes("mecha");
  const line = effectEndpoints(effect, radius, angle);
  const dx = line.toX - line.fromX;
  const dy = line.toY - line.fromY;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const tint = empowered ? "#ef4444" : engineer ? "#67e8f9" : "#9ee6ff";
  const core = empowered ? "#fee2e2" : "#f8fafc";
  const width = empowered ? 10 : engineer ? 8 : 9;
  const jitter = empowered ? 22 : engineer ? 19 : 21;
  if (host.drawGfxLightning) {
    host.drawGfxLightning(line.fromX, line.fromY, line.toX, line.toY, tint, alpha * 0.94, effect.y + 100, width, 8, jitter, progress * 1.7 + Number(effect.seed || 0) * 0.13);
    host.drawGfxLightning(line.fromX + px * 10, line.fromY + py * 10, line.toX + px * 6, line.toY + py * 6, core, alpha * 0.24, effect.y + 104, Math.max(2, width * 0.32), 5, 12, progress + 0.41);
    for (let i = 0; i < 3; i += 1) {
      const side = i % 2 ? 1 : -1;
      const t = (i + 1) / 4;
      const bx = line.fromX + dx * t;
      const by = line.fromY + dy * t;
      const branchLength = Math.min(58, 30 + jitter * 0.9 + i * 5);
      host.drawGfxLightning(bx, by, bx + px * side * branchLength + ux * branchLength * 0.22, by + py * side * branchLength + uy * branchLength * 0.22, tint, alpha * (0.3 - i * 0.04), effect.y + 110 + i, Math.max(2.2, width * 0.38), 3, 9 + i * 2, progress + i * 0.29);
    }
  } else {
    const bolt = host.fx("fx-lightning", effect.x, effect.y, Math.max(0.75, radius / 68), 0.9, "#9ee6ff", alpha * 0.92, effect.y + 92, angle, "add");
    bolt.alpha *= 0.95;
  }
  host.fx("fx-impact-star", line.fromX, line.fromY, 0.34, 0.34, core, alpha * 0.5, effect.y + 105, progress, "add");
  host.fx("fx-impact-star", line.toX, line.toY, 0.46, 0.46, core, alpha * 0.66, effect.y + 108, -progress, "add");
}

export function renderShotEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): void {
  const angle = Number(effect.angle || 0);
  const styleInfo = classifyEffectStyle(style, effect.kind);
  const poison = style.includes("poison") || style.includes("venom") || style.includes("acid") || color === "#9aa15f";
  const sniper = style.includes("sniper") || style.includes("snipe");
  const fire = style.includes("fire") || style.includes("mortar") || style.includes("meteor");
  const line = effectEndpoints(effect, radius * 1.2, angle);
  const mechaMuzzle = styleInfo.mechaMuzzle;
  if (style.includes("single_laser") && host.drawGfxLine) {
    const beamWidth = Math.max(3, Number(effect.width || 4.5));
    const beamColor = effect.color || color || "#67e8f9";
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, beamWidth + 5, "#06131f", alpha * 0.24, effect.y + 92, "add");
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, beamWidth, beamColor, alpha * 0.82, effect.y + 96, "add");
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, Math.max(1.5, beamWidth * 0.3), "#f8fafc", alpha * 0.88, effect.y + 98, "add");
    host.drawGfxCircle?.(line.fromX, line.fromY, Math.max(4, beamWidth * 1.2), beamColor, alpha * 0.08, "#f8fafc", alpha * 0.16, 1, effect.y + 99, "add", 8);
    host.drawGfxCircle?.(line.toX, line.toY, Math.max(6, beamWidth * 1.7), beamColor, alpha * 0.14, "#f8fafc", alpha * 0.3, 1.5, effect.y + 100, "add", 10);
    return;
  }
  if (mechaMuzzle && host.drawGfxLine) {
    const beamWidth = Math.max(7, radius * 0.14);
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, beamWidth + 8, "#06131f", alpha * 0.24, effect.y + 92, "add");
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, beamWidth, "#67e8f9", alpha * 0.68, effect.y + 96, "add");
    host.drawGfxLine(line.fromX + Math.cos(angle) * 12, line.fromY + Math.sin(angle) * 12, line.toX, line.toY, Math.max(2.4, beamWidth * 0.28), "#f8fafc", alpha * 0.82, effect.y + 99, "add");
    host.drawGfxCircle?.(line.toX, line.toY, 10 + radius * 0.08, "#67e8f9", alpha * 0.18, "#f8fafc", alpha * 0.36, 1.8, effect.y + 102, "add", 12);
    return;
  }
  if (styleInfo.basicEngineerBolt && host.drawGfxLine) {
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, 10, "#2b2118", alpha * 0.48, effect.y + 94, "normal");
    host.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, 5, "#d6b76d", alpha * 0.72, effect.y + 96, "normal");
    host.drawGfxLine(line.fromX + Math.cos(angle) * 14, line.fromY + Math.sin(angle) * 14, line.toX, line.toY, 2.4, "#fff7ed", alpha * 0.58, effect.y + 98, "add");
    host.drawGfxCircle?.(line.toX, line.toY, 8, "#67e8f9", alpha * 0.18, "#f8fafc", alpha * 0.28, 1.5, effect.y + 100, "add", 10);
    host.drawGfxSparkSpray?.(line.toX, line.toY, radius * 0.26, "#d6b76d", alpha * 0.22, effect.y + 104, 5, Number(effect.age || 0) * 3.4, angle, Math.PI * 0.7);
    return;
  }
  const electric = styleInfo.lightningSkill && !styleInfo.beam;
  if (electric && host.drawGfxLightning) {
    const tint = style.includes("mecha") ? "#f5d0fe" : "#67e8f9";
    const phase = Number(effect.seed || 0) + Number(effect.age || 0) * 1.8 + effect.x * 0.01;
    host.drawGfxLightning(line.fromX, line.fromY, line.toX, line.toY, tint, alpha * 0.9, effect.y + 96, Math.max(6, radius * 0.12), 7, Math.max(14, radius * 0.32), phase);
    host.drawGfxLightning(line.fromX, line.fromY, line.toX, line.toY, "#f8fafc", alpha * 0.2, effect.y + 100, 2.4, 4, 9, phase + 0.41);
    host.fx("fx-impact-star", line.toX, line.toY, 0.34, 0.34, "#f8fafc", alpha * 0.48, effect.y + 104, phase * 0.6, "add");
    return;
  }
  if (style.includes("laser_arrow") && host.drawGfxLine) {
    const beamWidth = Math.max(24, Number(effect.width || radius * 0.22));
    const dx = line.toX - line.fromX;
    const dy = line.toY - line.fromY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const travel = Math.max(0.05, Math.min(1, progress * 1.05));
    const tail = Math.max(0, travel - 0.34);
    const headX = line.fromX + dx * travel;
    const headY = line.fromY + dy * travel;
    const tailX = line.fromX + dx * tail;
    const tailY = line.fromY + dy * tail;
    const beamAlpha = Math.min(1, alpha * 1.18 + 0.12);
    const muzzleAlpha = alpha * Math.max(0, 1 - progress * 1.8);
    host.drawGfxCircle?.(line.fromX, line.fromY, beamWidth * (0.42 + muzzleAlpha * 0.3), "#12301f", muzzleAlpha * 0.18, "#f8fff1", muzzleAlpha * 0.38, 2, effect.y + 93, "add", 16);
    host.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 2.05, "#12301f", beamAlpha * 0.22, effect.y + 92, "add");
    host.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 1.08, color, beamAlpha * 0.82, effect.y + 96, "add");
    host.drawGfxLine(tailX, tailY, headX, headY, Math.max(7, beamWidth * 0.3), "#f8fff1", beamAlpha * 0.9, effect.y + 98, "add");
    host.drawGfxLine(headX - ux * beamWidth * 1.25 + px * beamWidth * 0.44, headY - uy * beamWidth * 1.25 + py * beamWidth * 0.44, headX + ux * beamWidth * 0.42, headY + uy * beamWidth * 0.42, Math.max(4, beamWidth * 0.16), "#f8fff1", beamAlpha * 0.78, effect.y + 101, "add");
    host.drawGfxLine(headX - ux * beamWidth * 1.25 - px * beamWidth * 0.44, headY - uy * beamWidth * 1.25 - py * beamWidth * 0.44, headX + ux * beamWidth * 0.42, headY + uy * beamWidth * 0.42, Math.max(4, beamWidth * 0.16), color, beamAlpha * 0.72, effect.y + 101, "add");
    host.drawGfxCircle?.(headX, headY, Math.max(8, beamWidth * 0.28), "#f8fff1", beamAlpha * 0.34, "#f8fff1", beamAlpha * 0.62, 1.6, effect.y + 102, "add", 12);
    if (travel > 0.88) {
      host.drawGfxImpactBurst?.(line.toX, line.toY, beamWidth * 1.14, color, alpha * 0.34, effect.y + 104, progress * 2.2, 9);
    }
    return;
  }
  const key = fire ? "fx-fire-bloom" : poison ? "fx-poison-cloud" : "fx-arrow-streak";
  const sx = fire ? 0.42 + radius / 110 : poison ? 0.46 + radius / 150 : Math.max(0.85, radius / 74);
  const sy = fire ? 0.32 + radius / 160 : poison ? 0.34 + radius / 190 : sniper ? 0.72 : 0.82;
  host.fx(key, effect.x, effect.y, sx, sy, poison ? "#bef264" : fire ? "#f97316" : sniper ? "#fee2e2" : color, alpha * (sniper ? 0.92 : 0.76), effect.y + 90, angle, "add");
  if (sniper) host.fx("beam", effect.x, effect.y, Math.max(2.4, radius / 9), 0.34, "#ef4444", alpha * 0.3, effect.y + 86, angle, "add");
}

export function renderDashEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): void {
  const angle = Number(effect.angle || 0);
  const charge = style.includes("shield_charge");
  const blink = style.includes("mage_blink");
  const shadow = style.includes("shadow") || style.includes("assassin") || style.includes("stalker");
  const martial = style.includes("martial");
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const fromX = effect.x - ux * radius * 1.4;
  const fromY = effect.y - uy * radius * 1.4;
  const toX = effect.x + ux * radius * 1.4;
  const toY = effect.y + uy * radius * 1.4;
  if (charge) {
    const shieldX = toX + ux * radius * 0.16;
    const shieldY = toY + uy * radius * 0.16;
    host.drawGfxShieldWake?.(fromX, fromY, toX, toY, radius * 0.88, angle, "#f97316", alpha * 0.72, effect.y + 104, progress);
    if (host.drawGfxFrontShield) {
      host.drawGfxFrontShield(shieldX, shieldY, angle, radius * 0.92, "#f97316", alpha * 0.9, effect.y + 120, progress);
    } else if (host.drawGfxShieldWall) {
      host.drawGfxShieldWall(shieldX, shieldY, angle, radius * 0.82, "#ffd166", alpha * 0.9, effect.y + 116, progress > 0.62);
    } else {
      host.fx("fx-shield-hex", effect.x, effect.y, Math.max(0.7, radius / 80), 0.56, "#ffd166", alpha * 0.68, effect.y + 88, angle, "add");
    }
    host.drawGfxSparkSpray?.(shieldX + ux * radius * 0.26, shieldY + uy * radius * 0.26, radius * 0.38, "#fde68a", alpha * 0.24, effect.y + 128, 7, progress * 3, angle, Math.PI * 0.62);
    host.fx("fx-impact-star", effect.x + ux * radius * 0.45, effect.y + uy * radius * 0.45, 0.72, 0.72, "#facc15", alpha * 0.52, effect.y + 98, progress, "add");
    return;
  }
  if (blink) {
    host.fx("fx-frost-shards", effect.x, effect.y, 0.5, 0.5, "#93c5fd", alpha * 0.68, effect.y + 88, angle, "add");
    return;
  }
  if (style.includes("warrior_dash")) {
    host.drawGfxDashDust?.(fromX, fromY, toX, toY, Math.max(28, radius * 0.62), angle, "#caa35a", alpha * 0.78, effect.y + 104, progress, {});
    host.drawGfxSparkSpray?.(toX, toY, radius * 0.38, "#fde68a", alpha * 0.22, effect.y + 114, 7, progress * 4, angle, Math.PI * 0.8);
    if (!host.drawGfxDashDust && !host.drawGfxSparkSpray) {
      host.fx("fx-impact-star", toX, toY, 0.6, 0.6, "#fde68a", alpha * 0.48, effect.y + 96, progress, "add");
    }
    return;
  }
  if (shadow) {
    host.fx("fx-smoke", effect.x, effect.y, Math.max(0.54, radius / 95), 0.46, "#21142f", alpha * 0.48, effect.y + 82, angle, "add");
    host.fx("fx-shadow-cut", toX, toY, 0.82, 0.56, "#c4b5fd", alpha * 0.7, effect.y + 92, angle, "add");
    return;
  }
  if (martial) {
    host.fx("fx-impact-star", toX, toY, 0.68, 0.68, "#fde68a", alpha * 0.54, effect.y + 92, progress, "add");
    return;
  }
  host.fx("fx-impact-star", toX, toY, 0.54, 0.54, color, alpha * 0.34, effect.y + 92, progress, "add");
}

export function renderMobilityOrProjectileEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "dash" && effect.kind !== "shot" && effect.kind !== "chain") return false;
  const styleInfo = classifyEffectStyle(style, effect.kind);
  if (styleInfo.lightningSkill) {
    renderChainEffect(host, effect, progress, alpha, radius);
  } else if (effect.kind === "shot") {
    renderShotEffect(host, effect, progress, alpha, radius, color, style);
  } else {
    renderDashEffect(host, effect, progress, alpha, radius, color, style);
  }
  return true;
}

export function renderCoreSkillEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  rawStyle?: string,
): boolean {
  const style = String(rawStyle || "").toLowerCase();
  return (
    renderSlashEffect(host, effect, progress, alpha, radius, color, style) ||
    renderSpinEffect(host, effect, progress, alpha, radius, color, style) ||
    renderMobilityOrProjectileEffect(host, effect, progress, alpha, radius, color, style)
  );
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

function drawMeteorTrail(host: FloatingEffectRendererHost, fromX: number, fromY: number, toX: number, toY: number, width: number, alpha: number, z: number, phase = 0): boolean {
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
  host.drawGfxLine(fromX, fromY, toX - ux * width * 0.32, toY - uy * width * 0.32, Math.max(3, width * 0.18), "#fff7ed", alpha * 0.26, z + 1, "add");
  return true;
}

function drawMeteorRock(host: FloatingEffectRendererHost, x: number, y: number, angle: number, size: number, alpha: number, z: number, phase = 0): boolean {
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

function drawMeteorFragments(host: FloatingEffectRendererHost, x: number, y: number, radius: number, alpha: number, z: number, phase = 0): void {
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

function drawMeteorLandingShadow(host: FloatingEffectRendererHost, x: number, y: number, radius: number, fall: number, impact: number, alpha: number, z: number): void {
  const shadowAlpha = alpha * Math.max(0, 1 - impact * 0.85) * (0.05 + fall * 0.18);
  const shadowRadius = radius * (0.24 + fall * 0.46);
  host.drawGfxCircle?.(x, y + radius * 0.08, shadowRadius, "#000000", shadowAlpha, "#7c2d12", alpha * fall * 0.08, 1.5, z, "normal", 34);
  host.drawGfxCircle?.(x, y + radius * 0.08, shadowRadius * 0.58, "#0b0604", shadowAlpha * 0.9, "#f97316", alpha * fall * 0.06, 1, z + 1, "add", 24);
}

function drawMeteorImpactBloom(host: FloatingEffectRendererHost, x: number, y: number, radius: number, impact: number, alpha: number, z: number, phase: number): void {
  if (impact <= 0) return;
  const flash = Math.max(0, 1 - impact);
  host.drawGfxCircle?.(x, y, radius * (0.28 + impact * 0.2), "#fff7ed", alpha * flash * 0.22, "#fed7aa", alpha * flash * 0.62, 5, z + 8, "add", 24);
  host.drawGfxCircle?.(x, y, radius * (0.48 + impact * 0.54), "#7c2d12", alpha * (0.12 - impact * 0.05), "#f97316", alpha * (0.36 - impact * 0.18), 5, z + 9, "add", 42);
  host.drawGfxImpactBurst?.(x, y, radius * (0.62 + impact * 0.42), "#f97316", alpha * (0.58 - impact * 0.16), z + 16, phase, 16);
  host.drawGfxSparkSpray?.(x, y, radius * (0.7 + impact * 0.42), "#fde68a", alpha * (0.42 - impact * 0.12), z + 24, 18, phase * 4.2);
  drawMeteorFragments(host, x, y, radius * (0.52 + impact * 0.24), alpha * Math.min(1, impact * 1.4), z + 28, phase * 4);
}

export function renderMeteorEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): boolean {
  if (effect.kind !== "meteor") return false;
  const fallEnd = 0.72;
  const fallT = Math.max(0, Math.min(1, progress / fallEnd));
  const fall = fallT * fallT * (3 - fallT * 2);
  const impact = Math.max(0, Math.min(1, (progress - fallEnd) / (1 - fallEnd)));
  const startX = effect.x - radius * 0.84;
  const startY = effect.y - radius * 3.2;
  const x = startX + (effect.x - startX) * fall;
  const y = startY + (effect.y - startY) * fall;
  const angle = Math.atan2(effect.y - startY, effect.x - startX);
  const z = effect.y + 104;
  drawMeteorLandingShadow(host, effect.x, effect.y, radius, fall, impact, alpha, z - 22);
  if (impact <= 0.05) {
    drawMeteorTrail(host, x - Math.cos(angle) * radius * (0.7 + fall * 0.14), y - Math.sin(angle) * radius * (0.7 + fall * 0.14), x, y, radius * (0.21 + fall * 0.08), alpha, z - 6 + fall * 8, progress);
  }
  drawMeteorImpactBloom(host, effect.x, effect.y, radius, impact, alpha, z + 4, progress * 4.5);
  return true;
}

export function renderFreezeEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): boolean {
  if (effect.kind !== "freeze" && effect.kind !== "slow") return false;
  const style = String(effect.style || "").toLowerCase();
  if (style.includes("frost_breath")) {
    const softAlpha = alpha * (effect.active ? 0.13 : 0.09);
    host.ring(effect.x, effect.y, radius * 0.86, "#93c5fd", softAlpha, 2);
    host.ring(effect.x, effect.y, radius * 0.58, "#dbeafe", softAlpha * 0.34, 1);
    return true;
  }
  const snap = progress < 0.32 ? 1 + progress * 0.4 : 1.12 - (progress - 0.32) * 0.3;
  host.fx("fx-frost-shards", effect.x, effect.y, radius / 88 * snap, radius / 88 * snap, "#dbeafe", alpha * 0.8, effect.y + 92, progress * 0.4, "add");
  host.ring(effect.x, effect.y, radius * (0.82 + progress * 0.12), "#93c5fd", alpha * 0.28, 3);
  return true;
}

export function renderWarningEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "warning") return false;
  if (style.includes("sniper_lock") || style.includes("charge_predict") || style.includes("spit_cast")) return true;
  const danger = style.includes("sniper") || style.includes("lock") ? "#ef4444" : color || "#ef4444";
  if (style.includes("arrow_rain")) {
    return true;
  }
  host.fx("fx-warning-target", effect.x, effect.y, radius / 48, radius / 48, danger, 0.2 + alpha * 0.34, effect.y + 50, progress * 0.18, "add");
  if (style.includes("boss") || style.includes("bomber") || radius > 90) {
    host.ring(effect.x, effect.y, radius * (0.98 - progress * 0.05), danger, 0.16 + alpha * 0.18, 4);
  }
  return true;
}

export function renderSupportEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "shield" && effect.kind !== "cleanse" && effect.kind !== "revive" && effect.kind !== "holy") return false;
  const heal = effect.kind === "holy" || effect.kind === "revive" || effect.kind === "cleanse" || style.includes("heal");
  host.fx(heal ? "fx-heal-cross" : "fx-shield-hex", effect.x, effect.y, radius / 76 + progress * 0.16, radius / 76 + progress * 0.16, heal ? "#bbf7d0" : color, alpha * (heal ? 0.5 : 0.56), effect.y + 82, heal ? progress * 0.65 : progress * 0.18, "add");
  host.ring(effect.x, effect.y, radius * (0.62 + progress * 0.28), heal ? "#86efac" : color, alpha * 0.22, heal ? 2 : 4);
  return true;
}

export function renderPoisonEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): boolean {
  if (effect.kind !== "poison") return false;
  const tint = isVenomEffect(effect) ? "#c084fc" : effect.color || "#bef264";
  host.fx("fx-poison-cloud", effect.x, effect.y, radius / 76, radius / 90, tint, alpha * 0.46, effect.y + 80, progress * 0.22, "add");
  return true;
}

export function renderTrapEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
): boolean {
  if (effect.kind !== "trap") return false;
  host.fx("fx-warning-target", effect.x, effect.y, radius / 62, radius / 62, color, alpha * 0.42, effect.y + 76, progress * 0.8, "add");
  return true;
}

export function renderRewardBurstEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
): boolean {
  if (effect.kind !== "arcane" && effect.kind !== "star" && effect.kind !== "level" && effect.kind !== "chest") return false;
  const tint = effect.kind === "chest" ? "#facc15" : effect.kind === "level" ? "#dbeafe" : color;
  host.fx("fx-impact-star", effect.x, effect.y, radius / 72 + progress * 0.2, radius / 72 + progress * 0.2, tint, alpha * 0.62, effect.y + 86, progress * 1.8, "add");
  host.ring(effect.x, effect.y, radius * (0.45 + progress * 0.45), tint, alpha * 0.22, 3);
  return true;
}

export function renderImpactEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "impact") return false;
  const heavy = style.includes("heavy") || style.includes("critical") || style.includes("slam") || effect.heavy;
  const playerHit = style.includes("player");
  host.fx("fx-impact-star", effect.x, effect.y, radius / (heavy ? 58 : 78), radius / (heavy ? 58 : 78), playerHit ? "#ef4444" : color, alpha * (heavy ? 0.82 : 0.52), effect.y + 94, progress * 1.2, "add");
  if (heavy) host.ring(effect.x, effect.y, radius * (0.4 + progress * 0.34), color, alpha * 0.2, 4);
  return true;
}

export function renderExplosionEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): boolean {
  if (effect.kind !== "explosion" && effect.kind !== "death") return false;
  const poison = style.includes("poison") || style.includes("splitter");
  const fire = style.includes("fire") || style.includes("bomber") || style.includes("blast") || style.includes("meteor");
  host.fx(poison ? "fx-poison-cloud" : fire ? "fx-fire-bloom" : "fx-impact-star", effect.x, effect.y, radius / 78 + progress * 0.3, radius / 78 + progress * 0.3, poison ? "#bef264" : fire ? "#f97316" : color, alpha * 0.62, effect.y + 90, progress * 1.1, "add");
  host.ring(effect.x, effect.y, radius * (0.5 + progress * 0.48), poison ? "#bef264" : fire ? "#f97316" : color, alpha * 0.2, 5);
  return true;
}

export function renderSecondaryEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  progress: number,
  alpha: number,
  radius: number,
  color: string,
  rawStyle?: string,
): boolean {
  const style = String(rawStyle || "").toLowerCase();
  return (
    renderMeteorEffect(host, effect, progress, alpha, radius) ||
    renderFreezeEffect(host, effect, progress, alpha, radius) ||
    renderWarningEffect(host, effect, progress, alpha, radius, color, style) ||
    renderSupportEffect(host, effect, progress, alpha, radius, color, style) ||
    renderPoisonEffect(host, effect, progress, alpha, radius) ||
    renderTrapEffect(host, effect, progress, alpha, radius, color) ||
    renderRewardBurstEffect(host, effect, progress, alpha, radius, color) ||
    renderImpactEffect(host, effect, progress, alpha, radius, color, style) ||
    renderExplosionEffect(host, effect, progress, alpha, radius, color, style)
  );
}

export function renderDefaultBurstEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  _progress: number,
  alpha: number,
  radius: number,
  color: string,
): boolean {
  const burst = host.sprite("burst", host.layers.effect, effect.x, effect.y, radius / 48, radius / 48, color, alpha * 0.42);
  burst.zIndex = effect.y + 80;
  return true;
}

export function renderFloatingEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView): void {
  const progress = effectProgress(effect);
  const alpha = Math.max(0, 1 - progress);
  const color = effect.color || "#f8f3e9";
  const style = effect.style || "";
  const rawRadius = Math.max(18, Number(effect.radius || 42));
  const radius = effectRadius(effect, rawRadius);

  if (renderFloatingTextEffect(host, effect, progress, alpha, color)) return;
  if (host.renderStyledSkillEffect?.(effect, progress, alpha, radius, color, style)) return;
  if (renderCoreSkillEffect(host, effect, progress, alpha, radius, color, style)) return;
  if (renderSecondaryEffect(host, effect, progress, alpha, radius, color, style)) return;
  renderDefaultBurstEffect(host, effect, progress, alpha, radius, color);
}

export function renderFloatingEffects(host: FloatingEffectRendererHost, effects: FloatingEffectView[], _now: number): void {
  if (host.diagnostics) host.diagnostics.effects = effects.length;
  const budget = host.qualityPreset?.effectBudget ?? effects.length;
  const startIndex = effectStartIndex(effects.length, budget);
  for (let effectIndex = startIndex; effectIndex < effects.length; effectIndex += 1) {
    const effect = effects[effectIndex];
    if (effect) renderFloatingEffect(host, effect);
  }
}
