import { effectStartIndex } from "./EffectBudget";

export interface FloatingEffectView {
  kind?: string;
  age?: number;
  ttl?: number;
  value?: number | string;
  critical?: boolean;
  radius?: number;
  angle?: number;
  heavy?: boolean;
  color?: string;
  style?: string;
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
  if (effect.kind === "warning") return Math.min(rawRadius, 190);
  if (effect.kind === "meteor") return Math.min(rawRadius, 150);
  if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") {
    return Math.min(rawRadius, 92);
  }
  if (effect.kind === "freeze" || effect.kind === "slow") return Math.min(rawRadius, 120);
  return Math.min(rawRadius, 110);
}

export function floatingTextStyle(effect: FloatingEffectView, color: string): FloatingTextStyle {
  return {
    fontFamily: "Inter, sans-serif",
    fontWeight: "900",
    fontSize: effect.critical ? 26 : effect.kind === "xp" ? 15 : 18,
    fill: effect.kind === "heal" ? "#bbf7d0" : effect.kind === "xp" ? "#dbeafe" : color,
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
    const smoke = host.fx(
      assassin ? "fx-smoke" : "fx-lightning",
      effect.x - Math.cos(angle) * 18,
      effect.y - Math.sin(angle) * 18,
      0.55,
      0.42,
      assassin ? "#21142f" : "#b985c8",
      alpha * 0.32,
      effect.y + 88,
      angle,
      "add",
    );
    smoke.alpha *= 0.8;
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

export function renderChainEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): void {
  const angle = Number(effect.angle || 0);
  const bolt = host.fx("fx-lightning", effect.x, effect.y, Math.max(0.75, radius / 68), 0.9, "#9ee6ff", alpha * 0.92, effect.y + 92, angle, "add");
  host.fx("fx-impact-star", effect.x - Math.cos(angle) * radius * 0.45, effect.y - Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, progress, "add");
  host.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, -progress, "add");
  bolt.alpha *= 0.95;
}

export function renderShotEffect(
  host: FloatingEffectRendererHost,
  effect: FloatingEffectView,
  alpha: number,
  radius: number,
  color: string,
  style: string,
): void {
  const angle = Number(effect.angle || 0);
  const poison = style.includes("poison") || style.includes("venom") || style.includes("acid") || color === "#9aa15f";
  const sniper = style.includes("sniper") || style.includes("snipe");
  const fire = style.includes("fire") || style.includes("mortar") || style.includes("meteor");
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
  const shadow = style.includes("shadow");
  const martial = style.includes("martial");
  const key = blink ? "fx-frost-shards" : shadow ? "fx-smoke" : charge ? "fx-shield-hex" : martial ? "fx-impact-star" : "beam";
  const sx = charge ? Math.max(0.7, radius / 80) : blink ? 0.5 : shadow ? Math.max(0.55, radius / 95) : Math.max(1.7, radius / 14);
  const sy = charge ? 0.56 : blink ? 0.5 : shadow ? 0.46 : Math.max(0.52, radius / 76);
  host.fx(key, effect.x, effect.y, sx, sy, blink ? "#93c5fd" : shadow ? "#8a6f9e" : martial ? "#fde68a" : color, alpha * 0.68, effect.y + 88, angle, "add");
  if (charge) {
    host.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.72, 0.72, "#facc15", alpha * 0.52, effect.y + 98, progress, "add");
  }
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
  if (effect.kind === "chain" || style.includes("chain") || style.includes("lightning") || style.includes("electric")) {
    renderChainEffect(host, effect, progress, alpha, radius);
  } else if (effect.kind === "shot") {
    renderShotEffect(host, effect, alpha, radius, color, style);
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

export function renderMeteorEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): boolean {
  if (effect.kind !== "meteor") return false;
  const fall = Math.min(1, progress * 1.35);
  const meteor = host.fx("fx-fire-bloom", effect.x - radius * 0.75 * (1 - fall), effect.y - radius * 1.85 * (1 - fall), 0.48 + fall * 0.42, 0.48 + fall * 0.42, "#f97316", alpha * 0.9, effect.y + 104, 0.78, "add");
  host.fx("beam", effect.x - radius * 0.38 * (1 - fall), effect.y - radius * 0.94 * (1 - fall), radius / 18, 1.2, "#f97316", alpha * 0.22, effect.y + 98, 0.78, "add");
  if (progress > 0.42) {
    host.fx("fx-fire-bloom", effect.x, effect.y, radius / 82 + progress * 0.34, radius / 82 + progress * 0.34, "#f97316", alpha * 0.62, effect.y + 100, progress * 1.4, "add");
    host.ring(effect.x, effect.y, radius * (0.35 + progress * 0.7), "#f97316", alpha * 0.2, 5);
  }
  meteor.alpha *= 0.94;
  return true;
}

export function renderFreezeEffect(host: FloatingEffectRendererHost, effect: FloatingEffectView, progress: number, alpha: number, radius: number): boolean {
  if (effect.kind !== "freeze" && effect.kind !== "slow") return false;
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
  const danger = style.includes("sniper") || style.includes("lock") ? "#ef4444" : color || "#ef4444";
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
  host.fx("fx-poison-cloud", effect.x, effect.y, radius / 76, radius / 90, "#bef264", alpha * 0.46, effect.y + 80, progress * 0.22, "add");
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
