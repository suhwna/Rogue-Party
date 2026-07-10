import { classifyProjectileStyle } from "../effects/EffectStyleClassifier";

export interface ProjectileView {
  id?: string | number;
  x: number;
  y: number;
  angle?: number;
  radius?: number;
  style?: string;
  classId?: string;
  poison?: boolean;
  pierce?: number;
  splash?: number;
  hostile?: boolean;
  color?: string;
}

export interface ProjectileTags {
  style: string;
  poison: boolean;
  fire: boolean;
  lightning: boolean;
  missile: boolean;
  laser: boolean;
  arrow: boolean;
  thread: boolean;
  flask: boolean;
  shadow: boolean;
}

export interface ProjectileScale {
  scaleX: number;
  scaleY: number;
}

export interface ProjectileSpriteLike {
  rotation: number;
  blendMode: string;
  zIndex: number;
}

export interface ProjectileRendererHost {
  layers: {
    projectile: unknown;
  };
  projectileTextureKey(projectile: ProjectileView): unknown;
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
  sprite(
    key: string | unknown,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): ProjectileSpriteLike;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
}

export function projectileStyle(projectile: ProjectileView): string {
  return projectile.style || projectile.classId || "";
}

export function classifyProjectile(projectile: ProjectileView): ProjectileTags {
  const style = projectileStyle(projectile).toLowerCase();
  const styleInfo = classifyProjectileStyle(style, projectile.classId);
  return {
    style,
    poison: Boolean(projectile.poison) || styleInfo.poison,
    fire: styleInfo.fire,
    lightning: styleInfo.lightning,
    missile: styleInfo.missile,
    laser: styleInfo.laser,
    arrow: styleInfo.arrow,
    thread: styleInfo.thread,
    flask: styleInfo.flask,
    shadow: styleInfo.shadow,
  };
}

export function isHostileProjectile(projectile: ProjectileView, tags: ProjectileTags): boolean {
  return Boolean(projectile.hostile) || tags.style === "stalker_shuriken" || tags.style === "sniper_bolt" || tags.style === "venom_spit";
}

export function projectileSpriteKey(renderer: ProjectileRendererHost, projectile: ProjectileView, tags: ProjectileTags): string | unknown {
  if (tags.thread) return "fx-thread-knot";
  if (tags.flask) return "fx-flask";
  if (tags.shadow) return "fx-shadow-cut";
  if (tags.missile) return "fx-fire-bloom";
  if (tags.lightning) return "fx-lightning";
  if (tags.fire) return "fx-fire-bloom";
  if (tags.poison) return "fx-poison-cloud";
  if (tags.arrow) return tags.style.includes("piercing") || Number(projectile.pierce || 0) > 0 ? "fx-pierce-lance" : "fx-arrow-streak";
  return renderer.projectileTextureKey(projectile);
}

export function projectileScale(projectile: ProjectileView, tags: ProjectileTags): ProjectileScale {
  const base = Math.max(0.55, (projectile.radius || 6) / 7);
  return {
    scaleX: tags.thread
      ? Math.max(0.38, base * 0.52)
      : tags.flask
        ? Math.max(0.45, base * 0.58)
        : tags.shadow
          ? Math.max(0.35, base * 0.54)
          : tags.lightning
            ? Math.max(0.62, base * 0.78)
            : tags.arrow
              ? Math.max(0.62, base * (tags.style.includes("piercing") ? 0.72 : 0.95))
              : tags.fire
                ? Math.max(0.34, base * 0.48)
                : tags.poison
                  ? Math.max(0.28, base * 0.44)
                  : base,
    scaleY: tags.thread
      ? Math.max(0.28, base * 0.36)
      : tags.flask
        ? Math.max(0.45, base * 0.58)
        : tags.shadow
          ? Math.max(0.22, base * 0.34)
          : tags.lightning
            ? Math.max(0.38, base * 0.52)
            : tags.arrow
              ? Math.max(0.38, base * (tags.style.includes("piercing") ? 0.42 : 0.62))
              : tags.fire
                ? Math.max(0.34, base * 0.48)
                : tags.poison
                  ? Math.max(0.26, base * 0.36)
                  : base,
  };
}

export function projectileTint(projectile: ProjectileView, tags: ProjectileTags): string {
  if (isHostileProjectile(projectile, tags)) return "#ff2d55";
  if (tags.thread) return "#f5d0fe";
  if (tags.flask) return tags.style.includes("fire") ? "#f97316" : "#bef264";
  if (tags.shadow) return "#c4b5fd";
  if (tags.missile) return "#f97316";
  if (tags.laser) return "#67e8f9";
  if (tags.poison) return "#bef264";
  if (tags.fire) return "#f97316";
  if (tags.lightning) return "#9ee6ff";
  if (tags.arrow) return projectile.color || "#f1d08b";
  return projectile.color || "#f8f3e9";
}

function renderHostileProjectile(renderer: ProjectileRendererHost, projectile: ProjectileView): boolean {
  if (!renderer.drawGfxLine || !renderer.drawGfxPath || !renderer.drawGfxCircle) return false;

  const angle = projectile.angle || 0;
  const r = Math.max(7, projectile.radius || 7);
  const style = String(projectile.style || "").toLowerCase();
  const sniper = style.includes("sniper");
  const toxic = Boolean(projectile.poison) || style.includes("venom") || style.includes("spit");
  const z = projectile.y + 4;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const tailLength = sniper ? 5.4 : 4.2;
  const tailX = projectile.x - ux * r * tailLength;
  const tailY = projectile.y - uy * r * tailLength;
  const backX = projectile.x - ux * r * 0.9;
  const backY = projectile.y - uy * r * 0.9;
  const tipX = projectile.x + ux * r * (sniper ? 3.05 : 2.55);
  const tipY = projectile.y + uy * r * (sniper ? 3.05 : 2.55);
  const coreColor = toxic ? "#bef264" : "#fff1f2";

  renderer.drawGfxLine(tailX, tailY, projectile.x + ux * r * 0.45, projectile.y + uy * r * 0.45, r * (sniper ? 1.5 : 1.25), "#450a0a", 0.3, z - 4, "normal");
  renderer.drawGfxLine(tailX, tailY, tipX, tipY, Math.max(4, r * 0.48), "#ff2d55", 0.48, z - 2, "add");
  renderer.drawGfxLine(projectile.x - ux * r * 2.6, projectile.y - uy * r * 2.6, tipX, tipY, Math.max(2, r * 0.18), coreColor, 0.72, z + 3, "add");

  for (let i = 0; i < 2; i += 1) {
    const cx = projectile.x - ux * r * (1.6 + i * 1.2);
    const cy = projectile.y - uy * r * (1.6 + i * 1.2);
    const size = r * (0.62 - i * 0.08);
    renderer.drawGfxPath(
      [
        { x: cx + ux * size * 0.45, y: cy + uy * size * 0.45 },
        { x: cx - ux * size * 0.35 + px * size, y: cy - uy * size * 0.35 + py * size },
        { x: cx - ux * size * 0.05, y: cy - uy * size * 0.05 },
        { x: cx - ux * size * 0.35 - px * size, y: cy - uy * size * 0.35 - py * size },
      ],
      "#ff2d55",
      0.48 - i * 0.1,
      "#fecaca",
      0.26,
      1.4,
      z - 1 + i,
      "add",
    );
  }

  renderer.drawGfxCircle(projectile.x, projectile.y, r * 1.32, "#2b0710", 0.5, "#ff2d55", 0.62, 2.6, z - 1, "normal", 14);
  renderer.drawGfxPath(
    [
      { x: tipX, y: tipY },
      { x: projectile.x - ux * r * 0.2 + px * r * 0.82, y: projectile.y - uy * r * 0.2 + py * r * 0.82 },
      { x: backX + px * r * 0.42, y: backY + py * r * 0.42 },
      { x: projectile.x - ux * r * 1.25, y: projectile.y - uy * r * 1.25 },
      { x: backX - px * r * 0.42, y: backY - py * r * 0.42 },
      { x: projectile.x - ux * r * 0.2 - px * r * 0.82, y: projectile.y - uy * r * 0.2 - py * r * 0.82 },
    ],
    "#2b0710",
    0.96,
    "#ff2d55",
    0.92,
    3.2,
    z,
    "normal",
  );
  renderer.drawGfxCircle(projectile.x - ux * r * 0.08, projectile.y - uy * r * 0.08, r * 0.48, coreColor, 0.9, "#ffffff", 0.72, 1.8, z + 5, "add", 10);
  if (projectile.splash) {
    const splash = Math.max(r * 2, Number(projectile.splash) || 0);
    renderer.drawGfxCircle(projectile.x, projectile.y, splash, "#450a0a", 0.035, "#ff2d55", 0.36, 3, z + 6, "normal", 36);
    for (let i = 0; i < 4; i += 1) {
      const dangerAngle = Math.PI / 4 + (Math.PI * 2 * i) / 4;
      renderer.drawGfxLine(
        projectile.x + Math.cos(dangerAngle) * splash * 0.84,
        projectile.y + Math.sin(dangerAngle) * splash * 0.84,
        projectile.x + Math.cos(dangerAngle) * splash * 1.02,
        projectile.y + Math.sin(dangerAngle) * splash * 1.02,
        4,
        "#ff2d55",
        0.56,
        z + 7 + i,
        "normal",
      );
    }
  }
  return true;
}

function renderLightningProjectile(renderer: ProjectileRendererHost, projectile: ProjectileView, tags: ProjectileTags, tint: string): boolean {
  if (!renderer.drawGfxLightning) return false;
  const angle = projectile.angle || 0;
  const mechaShot = tags.style.includes("mecha_laser_shot");
  const radius = mechaShot ? Math.max(3.5, projectile.radius || 4.5) : Math.max(7, projectile.radius || 6);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const fromX = projectile.x - ux * radius * (mechaShot ? 3.1 : 2.35);
  const fromY = projectile.y - uy * radius * (mechaShot ? 3.1 : 2.35);
  const toX = projectile.x + ux * radius * (mechaShot ? 3.5 : 2.25);
  const toY = projectile.y + uy * radius * (mechaShot ? 3.5 : 2.25);
  const width = mechaShot ? Math.max(3.2, radius * 0.46) : Math.max(5, radius * 0.62);
  const phase = Number(projectile.id || 0) * 0.37;
  renderer.drawGfxLightning(fromX, fromY, toX, toY, tint, 0.88, projectile.y + 4, width, 7, radius * 1.15, phase);
  renderer.drawGfxLightning(
    projectile.x - ux * radius * 0.85,
    projectile.y - uy * radius * 0.85,
    toX + ux * radius * 0.35,
    toY + uy * radius * 0.35,
    "#f8fafc",
    0.46,
    projectile.y + 11,
    Math.max(2, width * 0.32),
    4,
    radius * 0.54,
    phase + 0.41,
  );
  renderer.drawGfxCircle?.(toX, toY, Math.max(5, radius * 0.62), tint, 0.24, "#f8fafc", 0.36, 1.8, projectile.y + 14, "add", 10);
  return true;
}

function renderMechaLaserProjectile(renderer: ProjectileRendererHost, projectile: ProjectileView, tint: string): boolean {
  if (!renderer.drawGfxLine) return false;
  const angle = projectile.angle || 0;
  const radius = Math.max(3.5, projectile.radius || 4.5);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const fromX = projectile.x - ux * radius * 3.3;
  const fromY = projectile.y - uy * radius * 3.3;
  const toX = projectile.x + ux * radius * 3.15;
  const toY = projectile.y + uy * radius * 3.15;
  const z = projectile.y + 4;
  renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(6, radius * 1.18), "#06131f", 0.28, z - 2, "add");
  renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(3.6, radius * 0.72), tint, 0.72, z, "add");
  renderer.drawGfxLine(fromX + ux * radius * 0.6, fromY + uy * radius * 0.6, toX, toY, Math.max(1.8, radius * 0.26), "#f8fafc", 0.78, z + 3, "add");
  renderer.drawGfxCircle?.(toX, toY, Math.max(4, radius * 0.58), tint, 0.18, "#f8fafc", 0.36, 1.6, z + 5, "add", 10);
  return true;
}

function renderFireArrow(renderer: ProjectileRendererHost, projectile: ProjectileView): boolean {
  if (!renderer.drawGfxLine || !renderer.drawGfxPath || !renderer.drawGfxCircle) return false;
  const angle = projectile.angle || 0;
  const r = Math.max(8, projectile.radius || 7);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const z = projectile.y + 4;
  const phase = Number(projectile.id || 0) * 0.47;
  const tailX = projectile.x - ux * r * 2.45;
  const tailY = projectile.y - uy * r * 2.45;
  const farTailX = projectile.x - ux * r * 5.2;
  const farTailY = projectile.y - uy * r * 5.2;
  const tipX = projectile.x + ux * r * 2.18;
  const tipY = projectile.y + uy * r * 2.18;

  renderer.drawGfxLine(farTailX, farTailY, projectile.x - ux * r * 0.2, projectile.y - uy * r * 0.2, r * 1.12, "#7c2d12", 0.18, z - 5, "add");
  renderer.drawGfxLine(farTailX + px * r * 0.12, farTailY + py * r * 0.12, tailX, tailY, r * 0.58, "#f97316", 0.42, z - 4, "add");
  renderer.drawGfxLine(farTailX - px * r * 0.18, farTailY - py * r * 0.18, projectile.x - ux * r * 0.72, projectile.y - uy * r * 0.72, r * 0.32, "#fde68a", 0.48, z - 3, "add");

  for (let i = 0; i < 3; i += 1) {
    const side = i - 1;
    const sway = Math.sin(phase + i * 1.7) * r * 0.34;
    const baseX = tailX + px * (side * r * 0.38 + sway * 0.35);
    const baseY = tailY + py * (side * r * 0.38 + sway * 0.35);
    const flameTipX = projectile.x - ux * r * (3.5 + i * 0.42) + px * (side * r * 0.32 + sway);
    const flameTipY = projectile.y - uy * r * (3.5 + i * 0.42) + py * (side * r * 0.32 + sway);
    renderer.drawGfxPath(
      [
        { x: baseX + px * r * 0.34, y: baseY + py * r * 0.34 },
        { x: flameTipX, y: flameTipY },
        { x: baseX - px * r * 0.34, y: baseY - py * r * 0.34 },
      ],
      i === 1 ? "#fde68a" : "#f97316",
      i === 1 ? 0.42 : 0.34,
      "#fb923c",
      0.16,
      1,
      z - 2 + i,
      "add",
    );
  }

  renderer.drawGfxLine(tailX, tailY, tipX, tipY, 5.5, "#7c2d12", 0.86, z, "normal");
  renderer.drawGfxLine(tailX + ux * r * 0.35, tailY + uy * r * 0.35, tipX, tipY, 3.2, "#f97316", 0.92, z + 1, "add");
  renderer.drawGfxLine(tailX + ux * r * 0.95, tailY + uy * r * 0.95, tipX, tipY, 1.6, "#fff7ed", 0.86, z + 2, "add");
  renderer.drawGfxLine(tipX - ux * r * 0.5 - px * r * 0.48, tipY - uy * r * 0.5 - py * r * 0.48, tipX, tipY, 3.2, "#fed7aa", 0.82, z + 3, "add");
  renderer.drawGfxLine(tipX - ux * r * 0.5 + px * r * 0.48, tipY - uy * r * 0.5 + py * r * 0.48, tipX, tipY, 3.2, "#fed7aa", 0.82, z + 4, "add");

  for (let i = 0; i < 5; i += 1) {
    const t = ((phase * 0.27 + i * 0.23) % 1);
    const side = Math.sin(phase + i * 2.4) * r * 0.86;
    const x = projectile.x - ux * r * (2.5 + t * 3.2) + px * side;
    const y = projectile.y - uy * r * (2.5 + t * 3.2) + py * side;
    const alpha = (1 - t) * 0.38;
    renderer.drawGfxCircle(x, y, r * (0.12 + (i % 2) * 0.04), i % 2 ? "#fde68a" : "#fb923c", alpha, "#fff7ed", alpha * 0.45, 1, z + 7 + i, "add", 8);
  }
  return true;
}

function renderPoisonArrow(renderer: ProjectileRendererHost, projectile: ProjectileView): boolean {
  if (!renderer.drawGfxLine || !renderer.drawGfxCircle) return false;
  const angle = projectile.angle || 0;
  const r = Math.max(8, projectile.radius || 7);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const z = projectile.y + 4;
  const phase = Number(projectile.id || 0) * 0.39;
  const tailX = projectile.x - ux * r * 2.55;
  const tailY = projectile.y - uy * r * 2.55;
  const tipX = projectile.x + ux * r * 2.08;
  const tipY = projectile.y + uy * r * 2.08;

  renderer.drawGfxLine(projectile.x - ux * r * 5.4, projectile.y - uy * r * 5.4, projectile.x - ux * r * 0.45, projectile.y - uy * r * 0.45, r * 1.02, "#365314", 0.2, z - 6, "add");
  renderer.drawGfxLine(projectile.x - ux * r * 4.6 + px * r * 0.26, projectile.y - uy * r * 4.6 + py * r * 0.26, tailX, tailY, r * 0.46, "#84cc16", 0.28, z - 5, "add");
  renderer.drawGfxLine(projectile.x - ux * r * 4.2 - px * r * 0.3, projectile.y - uy * r * 4.2 - py * r * 0.3, projectile.x - ux * r * 0.92, projectile.y - uy * r * 0.92, r * 0.32, "#bef264", 0.24, z - 4, "add");

  for (let i = 0; i < 6; i += 1) {
    const t = ((phase * 0.18 + i * 0.17) % 1);
    const side = Math.sin(phase + i * 1.91) * r * (0.52 + t * 0.42);
    const x = projectile.x - ux * r * (1.7 + t * 4.1) + px * side;
    const y = projectile.y - uy * r * (1.7 + t * 4.1) + py * side;
    const size = r * (0.22 + (i % 3) * 0.05) * (1 - t * 0.25);
    const alpha = (1 - t) * 0.22;
    renderer.drawGfxCircle(x, y, size, "#4d7c0f", alpha, "#bef264", alpha * 0.9, 1.1, z - 2 + i, "add", 10);
  }

  renderer.drawGfxLine(tailX, tailY, tipX, tipY, 5.2, "#1a2e05", 0.9, z, "normal");
  renderer.drawGfxLine(tailX + ux * r * 0.3, tailY + uy * r * 0.3, tipX, tipY, 3, "#84cc16", 0.86, z + 1, "add");
  renderer.drawGfxLine(tailX + ux * r * 0.92, tailY + uy * r * 0.92, tipX, tipY, 1.5, "#ecfccb", 0.78, z + 2, "add");
  renderer.drawGfxLine(tipX - ux * r * 0.5 - px * r * 0.48, tipY - uy * r * 0.5 - py * r * 0.48, tipX, tipY, 3, "#bef264", 0.78, z + 3, "add");
  renderer.drawGfxLine(tipX - ux * r * 0.5 + px * r * 0.48, tipY - uy * r * 0.5 + py * r * 0.48, tipX, tipY, 3, "#bef264", 0.78, z + 4, "add");

  for (let i = 0; i < 4; i += 1) {
    const a = phase + i * 1.45;
    const x = projectile.x - ux * r * (0.3 + i * 0.58) + px * Math.sin(a) * r * 0.46;
    const y = projectile.y - uy * r * (0.3 + i * 0.58) + py * Math.sin(a) * r * 0.46;
    renderer.drawGfxCircle(x, y, r * (0.12 + i * 0.018), "#bef264", 0.34, "#ecfccb", 0.42, 1, z + 6 + i, "add", 8);
  }
  return true;
}

export function renderProjectile(renderer: ProjectileRendererHost, projectile: ProjectileView): void {
  const tags = classifyProjectile(projectile);
  if (isHostileProjectile(projectile, tags) && renderHostileProjectile(renderer, projectile)) return;
  const tint = projectileTint(projectile, tags);
  if (tags.laser && renderMechaLaserProjectile(renderer, projectile, tint)) return;
  if (tags.lightning && renderLightningProjectile(renderer, projectile, tags, tint)) return;
  if (tags.style.includes("fire_arrow") && renderFireArrow(renderer, projectile)) return;
  if (tags.style.includes("poison_arrow") && renderPoisonArrow(renderer, projectile)) return;
  const key = projectileSpriteKey(renderer, projectile, tags);
  const { scaleX, scaleY } = projectileScale(projectile, tags);
  const angle = projectile.angle || 0;
  const sprite = renderer.sprite(key, renderer.layers.projectile, projectile.x, projectile.y, scaleX, scaleY, tint, 1);
  sprite.rotation = angle;
  sprite.blendMode = tags.fire || tags.lightning || tags.poison || tags.thread || tags.shadow || tags.missile ? "add" : "normal";
  sprite.zIndex = projectile.y + 4;

  if (tags.thread) {
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(projectile.x - Math.cos(angle) * 28, projectile.y - Math.sin(angle) * 16, projectile.x + Math.cos(angle) * 10, projectile.y + Math.sin(angle) * 6, "#b985c8", 0.32, projectile.y + 3, 2.6, 4, 7, Number(projectile.id || 0) * 0.13);
    } else {
      const trail = renderer.sprite(
        "fx-lightning",
        renderer.layers.projectile,
        projectile.x - Math.cos(angle) * 18,
        projectile.y - Math.sin(angle) * 18,
        0.32,
        0.18,
        "#b985c8",
        0.36,
      );
      trail.rotation = angle;
      trail.blendMode = "add";
      trail.zIndex = projectile.y + 3;
    }
  }

  if (tags.flask) {
    const drop = renderer.sprite(
      tags.style.includes("fire") ? "fx-fire-pool" : "fx-acid-splash",
      renderer.layers.projectile,
      projectile.x - Math.cos(angle) * 14,
      projectile.y - Math.sin(angle) * 14,
      0.22,
      0.18,
      tags.style.includes("fire") ? "#f97316" : "#bef264",
      0.22,
    );
    drop.rotation = angle;
    drop.blendMode = "add";
    drop.zIndex = projectile.y + 2;
  }

  if (projectile.splash) {
    renderer.ring(projectile.x, projectile.y, projectile.splash, isHostileProjectile(projectile, tags) ? "#ff2d55" : tags.missile ? "#fb923c" : "#7e9fb2", tags.missile ? 0.12 : 0.08, 2);
  }
}

export function renderProjectiles(renderer: ProjectileRendererHost, projectiles: ProjectileView[]): void {
  for (const projectile of projectiles) {
    renderProjectile(renderer, projectile);
  }
}
