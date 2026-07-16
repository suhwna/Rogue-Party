(() => {
  const styleClassifier = window.RogueEffectStyle || {};

  function normalizeSkillStyle(style) {
    return String(style || "").toLowerCase();
  }

  function skillEffectPhase(progress) {
    const peak = Math.sin(progress * Math.PI);
    return {
      peak,
      pulse: 1 + peak * 0.22,
    };
  }

  function fallbackEffectEndpoints(effect, radius, angle) {
    const range = Math.max(radius, Number(effect.range || effect.distance || radius));
    return {
      fromX: effect.x,
      fromY: effect.y,
      toX: effect.x + Math.cos(angle) * range,
      toY: effect.y + Math.sin(angle) * range,
    };
  }

  function createStyledSkillContext(renderer, effect, progress, alpha, radius, color, style, options = {}) {
    const s = normalizeSkillStyle(style);
    if (!s) return null;
    const kind = effect.kind || "";
    const styleInfo = styleClassifier.classifyEffectStyle
      ? styleClassifier.classifyEffectStyle(s, kind)
      : null;
    const angle = Number(effect.angle || 0);
    const phase = skillEffectPhase(progress);
    const effectRadius = Math.max(radius, Number(effect.rangeRadius || effect.radius || radius));
    const end = renderer.effectEndpoints
      ? renderer.effectEndpoints(effect, radius, angle)
      : fallbackEffectEndpoints(effect, radius, angle);
    return {
      effect,
      progress,
      alpha,
      radius,
      color,
      s,
      kind,
      styleInfo,
      angle,
      peak: phase.peak,
      pulse: phase.pulse,
      effectRadius,
      end,
      z: effect.y + 108,
      skinPalette: options.skinPalette || null,
    };
  }

  function shouldRenderStyledSkill(style) {
    return normalizeSkillStyle(style).length > 0;
  }

  function drawMageSkinGlyph(renderer, palette, x, y, size, alpha, z, rotation = 0) {
    if (!palette || size <= 0) return false;
    if (palette.shape === "star") {
      renderer.drawGfxStar?.(x, y, size, palette.hot, alpha, z, 8);
      renderer.drawGfxDiamond?.(x, y, size * 0.28, "#ffffff", alpha * 0.82, z + 2, rotation, palette.main);
    } else if (palette.shape === "void") {
      renderer.drawGfxDiamond?.(x, y, size * 0.74, palette.dark, alpha * 0.9, z, rotation, palette.main);
      renderer.drawGfxArc?.(x, y, size, rotation - 0.82, rotation + 0.82, Math.max(1.5, size * 0.14), palette.hot, alpha * 0.72, z + 2, "add", 8);
    } else if (palette.shape === "ember") {
      renderer.drawGfxPath?.([
        { x, y: y - size },
        { x: x + size * 0.56, y: y + size * 0.72 },
        { x, y: y + size * 0.34 },
        { x: x - size * 0.56, y: y + size * 0.72 },
      ], palette.main, alpha * 0.78, palette.hot, alpha * 0.86, Math.max(1.4, size * 0.1), z, "add");
    } else {
      renderer.drawGfxDiamond?.(x, y, size * 0.78, palette.main, alpha * 0.82, z, rotation + Math.PI * 0.25, palette.hot);
      renderer.drawGfxLine?.(x - Math.cos(rotation) * size * 0.55, y - Math.sin(rotation) * size * 0.55, x + Math.cos(rotation) * size * 0.55, y + Math.sin(rotation) * size * 0.55, Math.max(1.2, size * 0.08), palette.hot, alpha * 0.72, z + 2, "add");
    }
    return true;
  }

  function meteorRockPoints(x, y, angle, length, width, phase = 0) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const wobble = Math.floor(phase * 10);
    const shape = [
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

  function drawMeteorTrail(renderer, fromX, fromY, toX, toY, width, alpha, z, phase = 0, palette = {}) {
    if (!renderer.drawGfxPath || !renderer.drawGfxLine) return false;
    const main = palette.main || "#f97316";
    const hot = palette.hot || "#fed7aa";
    const mid = palette.mid || "#fde68a";
    const core = palette.core || "#fff7ed";
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const length = Math.max(1, Math.hypot(toX - fromX, toY - fromY));
    const back = Math.min(length * 0.2, width * 1.8);
    const flutter = Math.sin(phase * 8) * width * 0.08;
    renderer.drawGfxPath(
      [
        { x: toX - ux * width * 0.16 + px * width * 0.58, y: toY - uy * width * 0.16 + py * width * 0.58 },
        { x: fromX + px * (width * 0.18 + flutter), y: fromY + py * (width * 0.18 + flutter) },
        { x: fromX - ux * back, y: fromY - uy * back },
        { x: fromX - px * (width * 0.24 - flutter), y: fromY - py * (width * 0.24 - flutter) },
        { x: toX - ux * width * 0.16 - px * width * 0.52, y: toY - uy * width * 0.16 - py * width * 0.52 },
      ],
      main,
      alpha * 0.16,
      hot,
      alpha * 0.18,
      2,
      z,
      "add",
    );
    renderer.drawGfxPath(
      [
        { x: toX - ux * width * 0.22 + px * width * 0.28, y: toY - uy * width * 0.22 + py * width * 0.28 },
        { x: fromX + px * width * 0.06, y: fromY + py * width * 0.06 },
        { x: fromX - ux * back * 0.58, y: fromY - uy * back * 0.58 },
        { x: fromX - px * width * 0.08, y: fromY - py * width * 0.08 },
        { x: toX - ux * width * 0.22 - px * width * 0.24, y: toY - uy * width * 0.22 - py * width * 0.24 },
      ],
      mid,
      alpha * 0.16,
      core,
      alpha * 0.18,
      1,
      z + 1,
      "add",
    );
    renderer.drawGfxLine(fromX, fromY, toX - ux * width * 0.32, toY - uy * width * 0.32, Math.max(3, width * 0.18), core, alpha * 0.26, z + 2, "add");
    return true;
  }

  function drawMeteorRock(renderer, x, y, angle, size, alpha, z, phase = 0) {
    if (!renderer.drawGfxPath) return false;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    renderer.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.62, size * 1.02, phase), "#f97316", alpha * 0.12, "#fed7aa", alpha * 0.16, 2, z - 1, "add");
    renderer.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.28, size * 0.78, phase + 0.17), "#3f1f13", alpha * 0.92, "#fed7aa", alpha * 0.54, 2.6, z, "normal");
    if (renderer.drawGfxLine) {
      renderer.drawGfxLine(x - ux * size * 0.42 - px * size * 0.2, y - uy * size * 0.42 - py * size * 0.2, x + ux * size * 0.28 + px * size * 0.12, y + uy * size * 0.28 + py * size * 0.12, 2.4, "#f97316", alpha * 0.38, z + 1, "add");
      renderer.drawGfxLine(x - ux * size * 0.12 + px * size * 0.28, y - uy * size * 0.12 + py * size * 0.28, x + ux * size * 0.36 + px * size * 0.08, y + uy * size * 0.36 + py * size * 0.08, 1.6, "#fde68a", alpha * 0.28, z + 2, "add");
    }
    return true;
  }

  function drawMeteorFragments(renderer, x, y, radius, alpha, z, phase = 0, palette = {}) {
    if (!renderer.drawGfxPath) return;
    const rock = palette.rock || "#3f1f13";
    const dark = palette.dark || "#7c2d12";
    const hot = palette.hot || "#fed7aa";
    for (let i = 0; i < 8; i += 1) {
      const angle = phase * 0.32 + (Math.PI * 2 * i) / 8;
      const dist = radius * (0.26 + (i % 3) * 0.08);
      const cx = x + Math.cos(angle) * dist;
      const cy = y + Math.sin(angle) * dist * 0.64;
      const size = 5 + (i % 3) * 2;
      renderer.drawGfxPath(meteorRockPoints(cx, cy, angle, size * 1.25, size * 0.74, phase + i), i % 2 ? dark : rock, alpha * 0.36, hot, alpha * 0.24, 1.2, z + i, "normal");
    }
  }

  function drawMeteorLandingShadow(renderer, x, y, radius, fall, impact, alpha, z, palette = {}) {
    if (!renderer.drawGfxCircle) return;
    const dark = palette.dark || "#7c2d12";
    const main = palette.main || "#f97316";
    const shadow = palette.shadow || "#0b0604";
    const shadowAlpha = alpha * Math.max(0, 1 - impact * 0.85) * (0.05 + fall * 0.18);
    const shadowRadius = radius * (0.24 + fall * 0.46);
    renderer.drawGfxCircle(x, y + radius * 0.08, shadowRadius, "#000000", shadowAlpha, dark, alpha * fall * 0.08, 1.5, z, "normal", 34);
    renderer.drawGfxCircle(x, y + radius * 0.08, shadowRadius * 0.58, shadow, shadowAlpha * 0.9, main, alpha * fall * 0.06, 1, z + 1, "add", 24);
  }

  function drawMeteorImpactBloom(renderer, x, y, radius, impact, alpha, z, phase, palette = {}) {
    if (impact <= 0) return;
    const main = palette.main || "#f97316";
    const dark = palette.dark || "#7c2d12";
    const hot = palette.hot || "#fed7aa";
    const mid = palette.mid || "#fde68a";
    const core = palette.core || "#fff7ed";
    const flash = Math.max(0, 1 - impact);
    renderer.drawGfxCircle?.(x, y, radius * (0.28 + impact * 0.2), core, alpha * flash * 0.22, hot, alpha * flash * 0.62, 5, z + 8, "add", 24);
    renderer.drawGfxCircle?.(x, y, radius * (0.48 + impact * 0.54), dark, alpha * (0.12 - impact * 0.05), main, alpha * (0.36 - impact * 0.18), 5, z + 9, "add", 42);
    renderer.drawGfxImpactBurst?.(x, y, radius * (0.62 + impact * 0.42), main, alpha * (0.58 - impact * 0.16), z + 16, phase, 16);
    renderer.drawGfxSparkSpray?.(x, y, radius * (0.7 + impact * 0.42), mid, alpha * (0.42 - impact * 0.12), z + 24, 18, phase * 4.2);
    drawMeteorFragments(renderer, x, y, radius * (0.52 + impact * 0.24), alpha * Math.min(1, impact * 1.4), z + 28, phase * 4, palette);
    renderer.renderParticlePreset?.("fireBurst", {
      x,
      y,
      radius: radius * (0.46 + impact * 0.22),
      color: mid,
      alpha: alpha * Math.max(0, 0.62 - impact * 0.18),
      zIndex: z + 36,
      phase: phase * 3.2,
      count: 14
    });
  }

  function meteorFallEndProgress(effect, fallback = 0.72) {
    const duration = Math.max(0.1, Number(effect?.duration || effect?.ttl || 0));
    const impactAt = Math.max(0, Number(effect?.impactAt || effect?.fallTime || 0));
    if (!duration || !impactAt) return fallback;
    return Math.max(0.2, Math.min(0.92, impactAt / duration));
  }

  function isMeteorFallEffect(context) {
    const s = String(context?.s || "").toLowerCase();
    const kind = String(context?.kind || context?.effect?.kind || "").toLowerCase();
    if (s.includes("meteor_impact")) return false;
    return kind === "meteor" || s.includes("meteor_call") || s.includes("meteor_fall");
  }

  function renderWarriorImpactEffect(renderer, context) {
    const { effect, kind, radius, color, s, angle, peak, progress, alpha, z } = context;
    if (kind !== "impact" || !(s.includes("shield_slam") || s.includes("cleave_impact") || s.includes("blade_impact") || s.includes("spin_impact"))) {
      return false;
    }
    const hitRadius = Math.max(34, Number(effect.radius || radius));
    const hitAngle = Number.isFinite(effect.angle) ? Number(effect.angle) : Number(effect.seed || angle);
    if (s.includes("shield_slam")) {
      renderer.drawGfxShieldWall(effect.x - Math.cos(hitAngle) * hitRadius * 0.16, effect.y - Math.sin(hitAngle) * hitRadius * 0.16, hitAngle, hitRadius * (1.08 + peak * 0.08), "#f97316", alpha * 0.72, z + 4, true);
      renderer.drawGfxShieldCrash(effect.x + Math.cos(hitAngle) * hitRadius * 0.24, effect.y + Math.sin(hitAngle) * hitRadius * 0.24, hitAngle, hitRadius * 0.86, "#f97316", alpha * 0.58, z + 12, progress);
    } else if (s.includes("cleave_impact")) {
      const originX = effect.x - Math.cos(hitAngle) * hitRadius * 0.22;
      const originY = effect.y - Math.sin(hitAngle) * hitRadius * 0.22;
      renderer.drawGfxCleaveRibbon(originX, originY, hitRadius * 0.26, hitRadius * 1.05, hitAngle - 0.78, hitAngle + 0.42, "#f97316", alpha * 0.14, "#fff7ed", alpha * 0.34, 3, z + 2, "add", 12);
      renderer.renderParticlePreset?.("slashTrail", {
        x: effect.x,
        y: effect.y,
        radius: hitRadius * 0.9,
        color: "#fde68a",
        alpha: alpha * 0.34,
        zIndex: z + 9,
        phase: progress * 3,
        count: 7,
        direction: hitAngle,
        spread: Math.PI * 0.76
      }) || renderer.drawGfxSparkSpray(effect.x, effect.y, hitRadius * 0.9, "#fde68a", alpha * 0.24, z + 9, 7, progress * 3, hitAngle, Math.PI * 0.76);
    } else {
      renderer.drawGfxImpactBurst(effect.x, effect.y, hitRadius * 0.85, color || "#f97316", alpha * 0.28, z + 4, progress, s.includes("spin") ? 10 : 7);
    }
    return true;
  }

  function renderWarriorShieldChargeEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, end, z } = context;
    if (!s.includes("shield_charge")) return false;
    const width = Math.max(66, Number(effect.contactRadius || 64) * 1.02);
    const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
    const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
    const rawTravel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
    const travel = rawTravel * rawTravel * (3 - 2 * rawTravel);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const headX = end.fromX + (end.toX - end.fromX) * travel;
    const headY = end.fromY + (end.toY - end.fromY) * travel;
    const px = -uy;
    const py = ux;
    const shieldX = headX + ux * width * 0.34;
    const shieldY = headY + uy * width * 0.34;
    const frontZ = Math.max(z + 18, shieldY + 112);
    const laneAlpha = alpha * (0.32 + peak * 0.08);

    renderer.drawGfxLine(end.fromX, end.fromY, headX, headY, width * 0.34, "#160b07", alpha * 0.08, z - 18, "add");
    for (let side = -1; side <= 1; side += 2) {
      const offset = width * 0.34 * side;
      renderer.drawGfxLine(end.fromX + px * offset, end.fromY + py * offset, headX + px * offset * 0.52, headY + py * offset * 0.52, 4, "#fde68a", laneAlpha * 0.44, z - 8 + side, "add");
    }
    renderer.drawGfxDashDust?.(end.fromX, end.fromY, headX, headY, width * 0.46, angle, "#caa35a", alpha * 0.34, z - 14, progress, { charge: true, long: true });
    if (renderer.drawGfxFrontShield) {
      renderer.drawGfxFrontShield(shieldX, shieldY, angle, width * 0.86, "#f97316", alpha * (0.84 + peak * 0.08), frontZ, progress);
    } else {
      renderer.drawGfxShieldWall(shieldX, shieldY, angle, width * 0.7, "#f97316", alpha * 0.76, frontZ, false);
    }
    renderer.drawGfxLine(shieldX - ux * width * 0.56, shieldY - uy * width * 0.56, shieldX + ux * width * 0.28, shieldY + uy * width * 0.28, 5, "#fff7ed", alpha * 0.32, frontZ + 8, "add");
    if (travel >= 0.92) {
      renderer.drawGfxShieldCrash(end.toX, end.toY, angle, width * 0.78, "#f97316", alpha * Math.max(0.2, 1 - (progress - moveDuration / fullDuration) * 3), z + 18, progress);
    }
    return true;
  }

  function renderWarriorSpinEffect(renderer, context) {
    const { effect, progress, alpha, radius, angle, peak, z, kind } = context;
    if (kind !== "spin") return false;
    const spinRadius = Math.max(120, Number(effect.rangeRadius || effect.radius || radius));
    const cx = effect.x;
    const cy = effect.y;
    const t = Math.max(0, Math.min(1, progress));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.82) / 0.18);
    const activeAlpha = alpha * fade * (0.76 + peak * 0.18);
    const swirlRadius = Math.max(92, Math.min(164, spinRadius * 0.72));
    const phase = Number(effect.seed || 0) * 0.13 + angle * 0.22 + t * Math.PI * 4.6;

    renderer.drawGfxCircle(cx, cy, swirlRadius * 0.88, "#160b07", activeAlpha * 0.04, "#f97316", activeAlpha * 0.18, 3, z - 18, "add", 64);
    renderer.drawGfxCircle(cx, cy, swirlRadius * 0.42, "#160b07", activeAlpha * 0.025, "#fde68a", activeAlpha * 0.16, 2, z - 14, "add", 40);
    for (let i = 0; i < 3; i += 1) {
      const a = phase + (Math.PI * 2 * i) / 3;
      const start = a - 0.58;
      const end = a + 0.98;
      const outer = swirlRadius * (0.82 + (i % 2) * 0.03);
      const inner = swirlRadius * 0.54;
      renderer.drawGfxCleaveRibbon(cx, cy, inner, outer, start, end, "#fff7ed", activeAlpha * 0.13, "#fde68a", activeAlpha * 0.28, 3, z + i * 8, "add", 14);
      renderer.drawGfxArc(cx, cy, outer * 1.01, start + 0.08, end - 0.05, 6, "#fff7ed", activeAlpha * 0.42, z + 4 + i * 8, "add", 12);
      renderer.drawGfxArc(cx, cy, inner * 0.92, start + 0.26, end - 0.22, 3, "#f97316", activeAlpha * 0.2, z + 5 + i * 8, "add", 9);
      const tipX = cx + Math.cos(end) * outer;
      const tipY = cy + Math.sin(end) * outer * 0.96;
      renderer.drawGfxLine(tipX - Math.cos(end) * 14, tipY - Math.sin(end) * 14, tipX + Math.cos(end) * 10, tipY + Math.sin(end) * 10, 4, "#fde68a", activeAlpha * 0.34, z + 28 + i, "add");
    }
    renderer.drawGfxSparkSpray(cx, cy, swirlRadius * 0.5, "#fde68a", activeAlpha * 0.12, z + 42, 6, phase * 0.35);
    return true;
  }

  function renderWarriorTauntRingEffect(renderer, context) {
    const { effect, progress, alpha, radius, z, peak } = context;
    const tauntRadius = Math.max(92, Number(effect.rangeRadius || effect.radius || radius));
    const t = Math.max(0, Math.min(1, progress));
    const ease = 1 - Math.pow(1 - t, 2.8);
    const fade = Math.max(0, 1 - Math.max(0, t - 0.76) / 0.24);
    const ringRadius = tauntRadius * (0.16 + ease * 0.84);
    const ringAlpha = alpha * fade;
    const pulse = 0.72 + peak * 0.28;

    renderer.drawGfxCircle(effect.x, effect.y, ringRadius, "#ef4444", ringAlpha * 0.035, "#ef4444", ringAlpha * 0.46, 5, z + 22, "add", 72);
    renderer.drawGfxCircle(effect.x, effect.y, ringRadius * 0.62, "#160b07", ringAlpha * 0.025, "#fde68a", ringAlpha * 0.24, 2, z + 21, "add", 54);
    for (let i = 0; i < 12; i += 1) {
      const a = (Math.PI * 2 * i) / 12;
      const from = ringRadius * 0.76;
      const to = ringRadius * (0.96 + (i % 3) * 0.025);
      renderer.drawGfxLine(
        effect.x + Math.cos(a) * from,
        effect.y + Math.sin(a) * from,
        effect.x + Math.cos(a) * to,
        effect.y + Math.sin(a) * to,
        i % 3 === 0 ? 5 : 3,
        i % 2 ? "#fde68a" : "#ef4444",
        ringAlpha * (0.22 + pulse * 0.1),
        z + 34 + i,
        "add"
      );
    }
    const iconAlpha = ringAlpha * Math.max(0.35, 1 - t * 0.35);
    renderer.drawGfxLine(effect.x, effect.y - 34, effect.x, effect.y - 9, 8, "#fff7ed", iconAlpha * 0.8, z + 48, "add");
    renderer.drawGfxCircle(effect.x, effect.y + 8, 5.5, "#fff7ed", iconAlpha * 0.72, "#fde68a", iconAlpha * 0.32, 1, z + 49, "add", 10);
    return true;
  }

  function renderWarriorSlamEffect(renderer, context) {
    const { effect, alpha, radius, s, angle, peak, z } = context;
    if (!(s.includes("shield") || s.includes("slam"))) return false;
    const slamRadius = Math.max(48, Number(effect.rangeRadius || effect.radius || radius));
    const shieldX = effect.x + Math.cos(angle) * slamRadius * 0.34;
    const shieldY = effect.y + Math.sin(angle) * slamRadius * 0.34;
    renderer.drawGfxShieldWall(shieldX, shieldY, angle, slamRadius * 1.02, "#f97316", alpha * 0.84, z, true);
    renderer.drawGfxShieldCrash(effect.x + Math.cos(angle) * slamRadius * 0.68, effect.y + Math.sin(angle) * slamRadius * 0.68, angle, slamRadius * (0.74 + peak * 0.12), "#f97316", alpha * 0.5, z + 10, peak);
    for (let i = -1; i <= 1; i += 1) {
      const side = i * slamRadius * 0.26;
      const px = -Math.sin(angle);
      const py = Math.cos(angle);
      const sx = effect.x + px * side - Math.cos(angle) * slamRadius * 0.08;
      const sy = effect.y + py * side - Math.sin(angle) * slamRadius * 0.08;
      const tx = effect.x + px * side * 0.58 + Math.cos(angle) * slamRadius * (0.78 + peak * 0.1);
      const ty = effect.y + py * side * 0.58 + Math.sin(angle) * slamRadius * (0.78 + peak * 0.1);
      renderer.drawGfxLine(sx, sy, tx, ty, i === 0 ? 9 : 5, i === 0 ? "#fff7ed" : "#fde68a", alpha * (i === 0 ? 0.34 : 0.22), z + 16 + i, "add");
    }
    return true;
  }

  function renderWarriorBodyEffect(renderer, context) {
    const { effect, progress, alpha, color, s } = context;
    if (!(s.includes("warrior") || s.includes("cleave") || s.includes("shield_slam"))) return false;
    if (s.includes("warrior_forward_whirlwind_launch")) return false;
    if (renderWarriorSpinEffect(renderer, context)) return true;
    if (renderWarriorSlamEffect(renderer, context)) return true;
    renderer.renderWarriorConeEffect(effect, progress, alpha, color, s.includes("cleave"));
    return true;
  }

  function renderWarriorStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const { s } = context;
    if (s.includes("taunt")) {
      return renderWarriorTauntRingEffect(renderer, context);
    }
    return (
      renderWarriorImpactEffect(renderer, context) ||
      renderWarriorShieldChargeEffect(renderer, context) ||
      renderWarriorBodyEffect(renderer, context)
    );
  }

  function renderRangerArrowRainEffect(renderer, context) {
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
      const point = (t, lane = 0) => {
        const one = 1 - t;
        return {
          x: one * one * end.fromX + 2 * one * t * apexX + t * t * end.toX + px * lane,
          y: one * one * end.fromY + 2 * one * t * apexY + t * t * end.toY + py * lane
        };
      };
      let prev = point(0);
      for (let i = 1; i <= 20; i += 1) {
        const p = point(i / 20);
        renderer.drawGfxLine(prev.x, prev.y, p.x, p.y, 4, "#f1d08b", alpha * 0.24, z - 10 + i, "add");
        prev = p;
      }
      const launch = Math.max(0.05, Math.min(0.94, progress * 0.98));
      const head = point(launch);
      const ahead = point(Math.min(1, launch + 0.04));
      const len = Math.hypot(ahead.x - head.x, ahead.y - head.y) || 1;
      const ax = (ahead.x - head.x) / len;
      const ay = (ahead.y - head.y) / len;
      renderer.drawGfxArrow(head.x - ax * 46, head.y - ay * 46, head.x + ax * 10, head.y + ay * 10, "#fff7ed", alpha * 0.78, z + 12, 5);
      return true;
    }
    const warn = kind === "warning";
    if (warn) return true;
    const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
    if (rainProgress <= 0) return true;
    renderer.drawGfxCircle(effect.x, effect.y, rainRadius, "#4a3415", alpha * 0.025, "#f1d08b", alpha * 0.28, 2, z - 12, "add", 56);
    renderer.drawGfxCircle(effect.x, effect.y, rainRadius * 0.72, "#000000", 0, "#fde68a", alpha * 0.09, 1.2, z - 11, "add", 42);
    const dropCount = 8;
    for (let i = 0; i < dropCount; i += 1) {
      const lane = (i - (dropCount - 1) / 2) * rainRadius * 0.12 + (renderer.noise(i, effect.x) - 0.5) * rainRadius * 0.1;
      const fall = (rainProgress * 1.35 + i / dropCount) % 1;
      const x = effect.x + lane;
      const landY = effect.y + (renderer.noise(i * 3, effect.y) - 0.5) * rainRadius * 0.28;
      const y = landY - rainRadius * 2.05 + fall * rainRadius * 2.32;
      const slant = (i % 2 ? -1 : 1) * 2;
      renderer.lineFx("beam", x - slant, y - 40, x + slant, y + 28, i % 3 === 0 ? 4 : 3, i % 3 === 0 ? "#fff7ed" : "#f1d08b", alpha * (0.4 + rainProgress * 0.28), z + i, "add");
    }
    return true;
  }

  function renderRangerVolleyEffect(renderer, context) {
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
      renderer.lineFx("beam", tailX, tailY, headX, headY, beamWidth * 1.72, "#12301f", alpha * 0.2, z - 10, "add");
      renderer.lineFx("beam", tailX, tailY, headX, headY, beamWidth, "#f1d08b", alpha * 0.84, z - 2, "add");
      renderer.lineFx("beam", tailX, tailY, headX, headY, Math.max(7, beamWidth * 0.28), "#f8fff1", alpha * 0.88, z + 2, "add");
      renderer.fx("fx-impact-star", headX, headY, 0.42 + peak * 0.14, 0.42 + peak * 0.14, "#f8fff1", alpha * 0.58, z + 6, progress * 2.4, "add");
      if (travel > 0.86) {
        renderer.fx("fx-impact-star", end.toX, end.toY, 0.5 + peak * 0.16, 0.5 + peak * 0.16, "#f8fff1", alpha * 0.46, z + 8, progress * 2.4, "add");
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
      renderer.lineFx("beam", tailX, tailY, headX, headY, 13, "#f1d08b", alpha * 0.3, z - 8, "add");
      renderer.fx("fx-pierce-lance", headX, headY, 1.02 + peak * 0.2, 0.92, "#f1d08b", alpha * 0.88, z, angle, "add");
      if (travel > 0.86) {
        renderer.fx("fx-impact-star", end.toX, end.toY, 0.42, 0.42, "#fde68a", alpha * 0.5, z + 3, progress * 1.4, "add");
      }
    } else {
      const poisonTint = s.includes("poison") ? "#bef264" : s.includes("fire") ? "#fb923c" : "#f1d08b";
      renderer.fx("fx-arrow-fan", effect.x, effect.y, 0.98 + peak * 0.16, 0.9 + peak * 0.1, poisonTint, alpha * 0.26, z - 3, angle, "add");
      if (s.includes("poison")) {
        renderer.fx("fx-poison-cloud", effect.x + Math.cos(angle) * 42, effect.y + Math.sin(angle) * 22, 0.46, 0.36, "#bef264", alpha * 0.38, z + 2, progress, "add");
      } else if (s.includes("fire")) {
        renderer.fx("fx-impact-star", effect.x + Math.cos(angle) * 40, effect.y + Math.sin(angle) * 20, 0.34, 0.3, "#fed7aa", alpha * 0.34, z + 2, progress, "add");
      }
    }
    return true;
  }

  function renderRangerStyledSkillEffect(renderer, context) {
    if (!context) return false;
    return renderRangerArrowRainEffect(renderer, context) || renderRangerVolleyEffect(renderer, context);
  }

  function renderMageFrostEffect(renderer, context) {
    const { effect, progress, alpha, effectRadius, pulse, peak, z, s } = context;
    const flameWave = s.includes("flame_wave");
    const flameBreath = s.includes("flame_breath");
    if (!s.includes("frost") && !flameWave && !flameBreath) return false;
    const frostRadius = effectRadius;
    if (s.includes("frost_breath") || flameBreath) {
      const outer = flameBreath ? "#fb923c" : "#93c5fd";
      const inner = flameBreath ? "#ffedd5" : "#dbeafe";
      renderer.ring(effect.x, effect.y, frostRadius * 0.86, outer, alpha * 0.09, 2);
      renderer.ring(effect.x, effect.y, frostRadius * 0.58, inner, alpha * 0.035, 1);
      return true;
    }
    const snapTint = flameWave ? "#ffedd5" : "#dbeafe";
    const shardTint = flameWave ? "#fb923c" : "#93c5fd";
    const snap = progress < 0.24 ? 1.24 : 1.08 - (progress - 0.24) * 0.28;
    renderer.fx("fx-frost-snap", effect.x, effect.y, frostRadius / 86 * snap, frostRadius / 86 * snap, snapTint, alpha * 0.95, z, progress * 0.15, "add");
    renderer.fx("fx-frost-shards", effect.x, effect.y, frostRadius / 94 * pulse, frostRadius / 94 * pulse, shardTint, alpha * 0.45, z - 2, -progress * 0.35, "add");
    renderer.ring(effect.x, effect.y, frostRadius * (0.72 + peak * 0.1), shardTint, alpha * 0.25, 4);
    return true;
  }

  function renderMageMeteorEffect(renderer, context) {
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
    const iceMeteor = Boolean(effect.iceMeteor) || s.includes("ice_meteor");
    const meteorPalette = iceMeteor ? {
      main: "#38bdf8",
      dark: "#082f49",
      hot: "#e0f2fe",
      mid: "#7dd3fc",
      core: "#f0f9ff",
      rock: "#0c4a6e",
      shadow: "#020617",
    } : {};
    const main = meteorPalette.main || "#f97316";
    drawMeteorLandingShadow(renderer, effect.x, effect.y, meteorRadius, fall, impact, alpha, z - 18, meteorPalette);
    renderer.drawGfxArc?.(effect.x, effect.y, meteorRadius * (0.82 + impact * 0.08), Math.PI * 0.12, Math.PI * 0.92, 3.5, main, alpha * Math.max(0.04, 0.18 - impact * 0.12), z - 16, "add", 12);
    renderer.drawGfxArc?.(effect.x, effect.y, meteorRadius * (0.82 + impact * 0.08), -Math.PI * 0.92, -Math.PI * 0.12, 3.5, main, alpha * Math.max(0.04, 0.18 - impact * 0.12), z - 16, "add", 12);
    if (impact <= 0.05) {
      const tailX = x - Math.cos(angle) * meteorRadius * (0.66 + fall * 0.16);
      const tailY = y - Math.sin(angle) * meteorRadius * (0.66 + fall * 0.16);
      if (!drawMeteorTrail(renderer, tailX, tailY, x, y, meteorRadius * (0.2 + fall * 0.08), alpha, meteorZ - 8, progress, meteorPalette)) {
        renderer.lineFx("beam", startX, startY, x, y, 18, main, alpha * 0.22, meteorZ - 8, "add");
      }
    } else {
      renderer.fx("fx-fire-pool", effect.x, effect.y + 12, meteorRadius / 78, meteorRadius / 90, main, alpha * Math.max(0.2, 0.48 - impact * 0.18), z + 1, 0, "add");
    }
    drawMeteorImpactBloom(renderer, effect.x, effect.y, meteorRadius * (0.95 + peak * 0.05), impact, alpha, z + 8, progress * 2.6, meteorPalette);
    return true;
  }

  function renderMageFlameEffect(renderer, context) {
    return false;
  }

  function renderMageChainEffect(renderer, context) {
    const { effect, progress, alpha, s, kind, peak, end, z, styleInfo } = context;
    const lightningSkill = styleInfo
      ? styleInfo.lightningSkill
      : s.includes("chain_lightning") || s.includes("engineer_overclock") || (kind === "chain" && (s.includes("lightning") || s.includes("electric")));
    if (!lightningSkill) {
      return false;
    }
    const empowered = s.includes("empowered_current");
    const tint = empowered ? "#ef4444" : "#9ee6ff";
    const core = empowered ? "#fee2e2" : "#dbeafe";
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.9, z, empowered ? 10 : 9, 9, empowered ? 20 : 22, progress * 1.6);
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.18, z + 4, 3, 5, 14, progress + 0.41);
    } else {
      renderer.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, empowered ? 20 : 18, tint, alpha * 0.96, z, "add");
      renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 6, core, alpha * 0.28, z - 2, "add");
    }
    renderer.fx("fx-impact-star", end.toX, end.toY, 0.46 + peak * 0.12, 0.46 + peak * 0.12, core, alpha * 0.62, z + 4, progress * 2, "add");
    return true;
  }

  function renderMageStarBurstEffect(renderer, context) {
    const { effect, progress, alpha, effectRadius, pulse, z, s } = context;
    if (!s.includes("star_burst")) return false;
    renderer.fx("fx-star-burst", effect.x, effect.y, effectRadius / 74 * pulse, effectRadius / 74 * pulse, "#dbeafe", alpha * 0.86, z, progress * 1.2, "add");
    renderer.fx("fx-impact-star", effect.x, effect.y, effectRadius / 92, effectRadius / 92, "#8d7cae", alpha * 0.44, z - 4, -progress, "add");
    return true;
  }

  function renderMageBlinkEffect(renderer, context) {
    const { effect, progress, alpha, effectRadius, pulse, z, s } = context;
    if (!s.includes("blink")) return false;
    renderer.fx("fx-star-burst", effect.x, effect.y, effectRadius / 92 * pulse, effectRadius / 92 * pulse, "#93c5fd", alpha * 0.62, z, progress * 1.4, "add");
    renderer.fx("fx-smoke", effect.x, effect.y, effectRadius / 90, effectRadius / 120, "#3b82f6", alpha * 0.32, z - 8, 0, "add");
    return true;
  }

  function renderMageStyledSkillEffect(renderer, context) {
    if (!context) return false;
    return (
      renderMageFlameEffect(renderer, context) ||
      renderMageFrostEffect(renderer, context) ||
      renderMageMeteorEffect(renderer, context) ||
      renderMageChainEffect(renderer, context) ||
      renderMageStarBurstEffect(renderer, context) ||
      renderMageBlinkEffect(renderer, context)
    );
  }

  function renderEngineerBeamEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, end, z, styleInfo } = context;
    const singleLaser = s.includes("single_laser");
    const laserModuleBeam = s.includes("engineer_laser_module_beam") || s.includes("mecha_giant_laser");
    const mechaLaser = (styleInfo ? styleInfo.mechaMuzzle : s.includes("mecha_hand_laser")) || laserModuleBeam;
    if (!(singleLaser || mechaLaser || s.includes("turret_fire") || s.includes("rail_turret") || s.includes("turret_laser") || s.includes("drone_laser"))) {
      return false;
    }
    const giant = laserModuleBeam;
    const rail = mechaLaser || s.includes("rail") || s.includes("turret_laser");
    if (singleLaser) {
      const beamWidth = Math.max(3, Number(effect.width || 4.5));
      const tint = effect.color || "#67e8f9";
      const core = "#f8fafc";
      if (renderer.drawGfxLine) {
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 5, "#06131f", alpha * 0.26, z - 5, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.82, z - 2, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(1.5, beamWidth * 0.32), core, alpha * 0.9, z + 1, "add");
        renderer.drawGfxCircle?.(end.fromX, end.fromY, beamWidth * (1.45 + peak * 0.28), tint, alpha * 0.18, core, alpha * 0.24, 1.5, z + 2, "add", 8);
        renderer.drawGfxCircle?.(end.toX, end.toY, beamWidth * (2.15 + peak * 0.48), tint, alpha * 0.18, core, alpha * 0.34, 2, z + 4, "add", 10);
      } else {
        renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.82, z, "add");
      }
      return true;
    }
    if (mechaLaser) {
      const beamWidth = Math.max(giant ? 44 : 13, Number(effect.width || (giant ? 56 : 16)));
      const tint = giant ? (effect.color || "#c084fc") : (effect.color || "#67e8f9");
      const core = giant ? "#f5d0fe" : "#f8fafc";
      if (renderer.drawGfxLine) {
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth * (giant ? 1.75 : 1.45), "#06131f", alpha * (giant ? 0.34 : 0.24), z - 8, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth * (giant ? 0.92 : 0.78), tint, alpha * (giant ? 0.78 : 0.68), z - 4, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(giant ? 9 : 4, beamWidth * (giant ? 0.22 : 0.18)), core, alpha * 0.9, z - 1, "add");
        renderer.drawGfxCircle?.(end.fromX, end.fromY, Math.max(8, beamWidth * (giant ? 0.34 : 0.28)) * (1 + peak * 0.12), tint, alpha * 0.32, core, alpha * 0.48, 2, z + 2, "add", 10);
        if (giant) renderer.drawGfxImpactBurst?.(end.toX, end.toY, beamWidth * (0.76 + peak * 0.12), tint, alpha * 0.28, z + 8, progress * 2.4, 8);
      } else {
        renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.78, z, "add");
      }
      return true;
    }
    if (rail || !renderer.drawGfxLightning) {
      renderer.lineFx(rail ? "beam" : "fx-lightning", end.fromX, end.fromY, end.toX, end.toY, rail ? 12 : 10, rail ? "#fde68a" : "#9ee6ff", alpha * 0.72, z, "add");
    } else {
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#67e8f9", alpha * 0.78, z, 7, 7, 18, progress * 1.6);
    }
    renderer.fx("fx-impact-star", effect.x, effect.y, 0.36 + peak * 0.1, 0.36 + peak * 0.1, "#9ee6ff", alpha * 0.52, z + 2, progress * 2, "add");
    return true;
  }

  function renderEngineerMechaEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, effectRadius, z } = context;
    if (!(s.includes("mecha_board") || s.includes("mecha_boot"))) return false;

    if (s.includes("mecha_boot")) {
      const thrustAlpha = alpha * (1 - progress * 0.16);
      renderer.drawGfxCircle?.(effect.x, effect.y, effectRadius * (0.34 + progress * 0.34), "#0f172a", 0.16 * thrustAlpha, "#d6b76d", 0.5 * thrustAlpha, 3, z + 2, "add", 24);
      for (let i = 0; i < 5; i += 1) {
        const a = -Math.PI * 0.5 + (i - 2) * 0.28;
        const len = effectRadius * (0.62 + progress * 1.05 + i * 0.035);
        renderer.drawGfxLine?.(effect.x, effect.y, effect.x + Math.cos(a) * len, effect.y + Math.sin(a) * len, i === 2 ? 8 : 5, i % 2 ? "#67e8f9" : "#f97316", thrustAlpha * (0.24 + i * 0.025), z + 4 + i, "add");
      }
      renderer.drawGfxSparkSpray?.(effect.x, effect.y, effectRadius * 0.68, "#f8f3e9", thrustAlpha * 0.34, z + 12, 12, progress * 2.6);
      renderer.fx("fx-impact-star", effect.x, effect.y, 0.72 + peak * 0.18, 0.72 + peak * 0.18, "#67e8f9", thrustAlpha * 0.52, z + 18, progress * 2.8, "add");
      return true;
    }

    const lock = 1 - Math.pow(1 - Math.min(1, progress * 1.5), 3);
    const radius = Math.max(70, effectRadius);
    const spin = progress * Math.PI * 1.8;
    renderer.drawGfxCircle?.(effect.x, effect.y + radius * 0.16, radius * 0.72, "#0f172a", alpha * 0.18, "#d6b76d", alpha * 0.26, 2, z - 4, "add", 36);
    renderer.drawGfxRuneRing?.(effect.x, effect.y, radius * (0.34 + lock * 0.5), "#d6b76d", alpha * 0.48, z + 1, spin, 6);
    renderer.drawGfxGear?.(effect.x, effect.y, radius * (0.24 + lock * 0.28), "#67e8f9", alpha * 0.34, z + 2, -spin * 0.7, 10);
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
      renderer.drawGfxPath?.(
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
      renderer.drawGfxLine?.(cx - ux * depth * 0.7, cy - uy * depth * 0.7, effect.x, effect.y, 2.4, "#f8f3e9", alpha * 0.18, z + 5 + i, "add");
    }
    renderer.drawGfxSparkSpray?.(effect.x, effect.y, radius * (0.56 + lock * 0.28), "#f8f3e9", alpha * 0.38, z + 20, 14, progress * 2.4);
    renderer.fx("fx-impact-star", effect.x, effect.y, 0.78 + peak * 0.2, 0.78 + peak * 0.2, "#67e8f9", alpha * 0.5, z + 22, progress * 2.4, "add");
    return true;
  }

  function renderEngineerMissileEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, effectRadius, angle, z } = context;
    if (!(s.includes("missile") || s.includes("kamikaze"))) return false;
    if (s.includes("explosion")) {
      renderer.fx("fx-fire-bloom", effect.x, effect.y, effectRadius / 58 * (0.72 + peak * 0.16), effectRadius / 58 * (0.72 + peak * 0.16), "#f97316", alpha * 0.72, z, progress * 1.4, "add");
      renderer.fx("fx-impact-star", effect.x, effect.y, effectRadius / 96, effectRadius / 96, "#fde68a", alpha * 0.54, z + 4, progress * 2, "add");
    } else {
      renderer.lineFx("beam", effect.x - Math.cos(angle) * 28, effect.y - Math.sin(angle) * 28, effect.x + Math.cos(angle) * 20, effect.y + Math.sin(angle) * 20, 8, "#f97316", alpha * 0.34, z, "add");
      renderer.fx("fx-impact-star", effect.x, effect.y, 0.42 + peak * 0.12, 0.42 + peak * 0.12, "#fde68a", alpha * 0.38, z + 2, progress * 2, "add");
    }
    return true;
  }

  function drawEngineerWrenchGlyph(renderer, x, y, angle, alpha, z, scale = 1) {
    if (!renderer.drawGfxLine || !renderer.drawGfxCircle) return false;
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

    renderer.drawGfxLine(tailX, tailY, neckX, neckY, 9 * scale, "#2b2118", alpha * 0.9, z, "normal");
    renderer.drawGfxLine(tailX + px * r * 0.05, tailY + py * r * 0.05, neckX + px * r * 0.05, neckY + py * r * 0.05, 5 * scale, "#d6b76d", alpha * 0.82, z + 1, "normal");
    renderer.drawGfxLine(tailX + px * r * 0.38, tailY + py * r * 0.38, neckX + px * r * 0.16, neckY + py * r * 0.16, 2 * scale, "#fff7ed", alpha * 0.52, z + 2, "add");
    renderer.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.52, "#2b2118", alpha * 0.66, "#f8fafc", alpha * 0.62, 3, z + 3, "normal", 14);
    renderer.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.24, "#07111f", alpha * 0.74, "#9ee6ff", alpha * 0.22, 1.5, z + 4, "add", 10);
    renderer.drawGfxLine(neckX - px * r * 0.38, neckY - py * r * 0.38, jawX - px * r * 0.85, jawY - py * r * 0.85, 6 * scale, "#f8fafc", alpha * 0.74, z + 5, "normal");
    renderer.drawGfxLine(neckX + px * r * 0.38, neckY + py * r * 0.38, jawX + px * r * 0.85, jawY + py * r * 0.85, 6 * scale, "#f8fafc", alpha * 0.74, z + 6, "normal");
    renderer.drawGfxLine(jawX - px * r * 0.85, jawY - py * r * 0.85, jawX - px * r * 0.38 + ux * r * 0.34, jawY - py * r * 0.38 + uy * r * 0.34, 4 * scale, "#d6b76d", alpha * 0.7, z + 7, "add");
    renderer.drawGfxLine(jawX + px * r * 0.85, jawY + py * r * 0.85, jawX + px * r * 0.38 + ux * r * 0.34, jawY + py * r * 0.38 + uy * r * 0.34, 4 * scale, "#d6b76d", alpha * 0.7, z + 8, "add");
    return true;
  }

  function renderEngineerDroneBoltEffect(renderer, context) {
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

    renderer.drawGfxLine?.(end.fromX, end.fromY, x - ux * 10, y - uy * 10, 5, "#2b2118", drawAlpha * 0.36, z - 3, "normal");
    renderer.drawGfxLine?.(end.fromX, end.fromY, x - ux * 12, y - uy * 12, 2.5, "#d6b76d", drawAlpha * 0.26, z - 2, "add");
    drawEngineerWrenchGlyph(renderer, x, y, shotAngle + spin, drawAlpha * (0.9 + peak * 0.08), z + 6, 0.92);
    if (progress > 0.52) {
      const hit = Math.min(1, (progress - 0.52) / 0.26);
      renderer.drawGfxCircle?.(end.toX, end.toY, 10 + hit * 10 + peak * 3, "#2b2118", alpha * 0.12 * hit, "#d6b76d", alpha * 0.34 * hit, 2, z + 16, "add", 12);
      renderer.drawGfxLine?.(end.toX - Math.cos(angle) * 12, end.toY - Math.sin(angle) * 12, end.toX + Math.cos(angle) * 16, end.toY + Math.sin(angle) * 16, 4, "#fff7ed", alpha * 0.36 * hit, z + 18, "add");
    }
    return true;
  }

  function renderEngineerDroneEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, z } = context;
    if (!s.includes("drone")) return false;
    renderer.fx("fx-drone", effect.x, effect.y - 8, 0.82 + peak * 0.12, 0.82 + peak * 0.12, "#d6b76d", alpha * 0.86, z, progress * 0.1, "normal");
    if (renderer.drawGfxLightning) {
      for (let i = 0; i < 3; i += 1) {
        const a = angle + (i - 1) * 0.78 + progress * 1.4;
        renderer.drawGfxLightning(effect.x, effect.y - 8, effect.x + Math.cos(a) * 34, effect.y - 8 + Math.sin(a) * 24, "#67e8f9", alpha * 0.26, z + 2 + i, 3, 3, 8, progress + i * 0.19);
      }
    } else {
      renderer.fx("fx-lightning", effect.x, effect.y, 0.58, 0.26, "#9ee6ff", alpha * 0.42, z + 2, angle, "add");
    }
    return true;
  }

  function renderEngineerMineEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, effectRadius, z } = context;
    if (!s.includes("shock_mine")) return false;
    renderer.fx("fx-mine", effect.x, effect.y, 0.94 + peak * 0.18, 0.94 + peak * 0.18, "#9ee6ff", alpha * 0.82, z, progress * 1.4, "add");
    if (renderer.drawGfxLightning) {
      for (let i = 0; i < 5; i += 1) {
        const a = progress * 2 + (Math.PI * 2 * i) / 5;
        renderer.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * effectRadius * 0.48, effect.y + Math.sin(a) * effectRadius * 0.48, "#67e8f9", alpha * 0.3, z + 1 + i, 3, 3, 9, progress + i * 0.21);
      }
    } else {
      renderer.fx("fx-lightning", effect.x, effect.y, effectRadius / 88, 0.62, "#9ee6ff", alpha * 0.56, z + 1, progress * 2.2, "add");
    }
    return true;
  }

  function renderEngineerDeviceEffect(renderer, context) {
    const { effect, alpha, s, angle, peak, end, z } = context;
    if (!(s.includes("engineer") || s.includes("turret") || s.includes("rail_"))) return false;
    const device = String(effect.device || "");
    const mine = device.includes("mine");
    const charged = device.includes("charged");
    const tint = mine ? (charged ? "#a78bfa" : "#67e8f9") : "#d6b76d";
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 7, tint, alpha * 0.22, z - 4, "add");
    renderer.fx(mine ? "fx-mine" : "fx-turret", effect.x, effect.y, 0.78 + peak * 0.14, 0.78 + peak * 0.14, tint, alpha * 0.86, z, angle, mine ? "add" : "normal");
    return true;
  }

  function renderEngineerStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const { s, styleInfo } = context;
    if (!((styleInfo && (styleInfo.engineer || styleInfo.basicTechBolt)) || s.includes("shock_mine"))) {
      return false;
    }
    return (
      renderEngineerMechaEffect(renderer, context) ||
      renderEngineerBeamEffect(renderer, context) ||
      renderEngineerMissileEffect(renderer, context) ||
      renderEngineerDroneBoltEffect(renderer, context) ||
      renderEngineerDroneEffect(renderer, context) ||
      renderEngineerMineEffect(renderer, context) ||
      renderEngineerDeviceEffect(renderer, context)
    );
  }

  function renderPuppetThreadLinesEffect(renderer, context) {
    const { alpha, s, end, z } = context;
    if (!(s.includes("puppet") || s.includes("thread"))) return false;
    renderer.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, s.includes("cage") || s.includes("theater") ? 17 : 10, "#f5d0fe", alpha * 0.74, z, "add");
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, s.includes("cage") ? 10 : 5, "#b985c8", alpha * 0.26, z - 4, "add");
    return true;
  }

  function renderPuppetSummonEffect(renderer, context) {
    const { alpha, s, peak, end, z } = context;
    if (!(s.includes("summon") || s.includes("puppet_lunge") || s.includes("ambush"))) return false;
    renderer.fx("fx-puppet", end.toX, end.toY, 0.62 + peak * 0.16, 0.62 + peak * 0.16, "#b985c8", alpha * 0.86, z + 5, 0, "normal");
    return true;
  }

  function renderPuppetSlashEffect(renderer, context) {
    const { effect, alpha, s, kind, angle, peak, z } = context;
    if (!(s.includes("slash") || kind === "slash")) return false;
    renderer.fx("fx-shadow-cut", effect.x, effect.y, 0.92 + peak * 0.18, 0.6 + peak * 0.08, "#f5d0fe", alpha * 0.88, z + 6, angle, "add");
    return true;
  }

  function renderPuppetThreadKnotEffect(renderer, context) {
    const { effect, progress, alpha, peak, z } = context;
    renderer.fx("fx-thread-knot", effect.x, effect.y, 0.52 + peak * 0.12, 0.52 + peak * 0.12, "#f5d0fe", alpha * 0.62, z + 2, progress * 1.8, "add");
    return true;
  }

  function renderPuppetStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const s = context.s;
    if (!(s.includes("puppet") || s.includes("thread"))) return false;
    renderPuppetThreadLinesEffect(renderer, context);
    renderPuppetSummonEffect(renderer, context);
    renderPuppetSlashEffect(renderer, context);
    renderPuppetThreadKnotEffect(renderer, context);
    return true;
  }

  function renderMartialPalmEffect(renderer, context) {
    const { effect, alpha, radius, angle, pulse, peak, z, s } = context;
    if (!s.includes("palm")) return false;
    renderer.fx("fx-palm-wave", effect.x + Math.cos(angle) * 22, effect.y + Math.sin(angle) * 10, radius / 78 * pulse, radius / 92 * pulse, "#fde68a", alpha * 0.86, z, angle, "add");
    renderer.fx("fx-fist", effect.x, effect.y, 0.52 + peak * 0.12, 0.52 + peak * 0.12, "#f8f3e9", alpha * 0.58, z + 3, angle, "add");
    return true;
  }

  function renderMartialRisingEffect(renderer, context) {
    const { alpha, s, angle, peak, end, z } = context;
    if (!s.includes("rising")) return false;
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 16, "#fde68a", alpha * 0.3, z - 4, "add");
    renderer.fx("fx-fist", end.toX, end.toY, 0.82 + peak * 0.24, 0.82 + peak * 0.24, "#fde68a", alpha * 0.88, z + 6, angle, "add");
    return true;
  }

  function renderMartialMeleeEffect(renderer, context) {
    const { effect, progress, alpha } = context;
    renderer.renderFastMeleeConeEffect(effect, progress, alpha, "#fde68a", "martial");
    return true;
  }

  function renderMartialStyledSkillEffect(renderer, context) {
    if (!context) return false;
    if (!context.s.includes("martial")) return false;
    return (
      renderMartialPalmEffect(renderer, context) ||
      renderMartialRisingEffect(renderer, context) ||
      renderMartialMeleeEffect(renderer, context)
    );
  }

  function alchemistMode(context) {
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

  function renderAlchemistThrowEffect(renderer, context, mode) {
    const { effect, progress, alpha, s, angle, peak, end, z } = context;
    if (!(s.includes("throw") || s.includes("bottle") || s.includes("bomb"))) return false;
    renderer.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, mode.tint, alpha * 0.34, z - 6, 3);
    renderer.renderParticlePreset?.(mode.fire ? "fireBurst" : mode.heal ? "healMist" : "poisonBurst", {
      x: effect.x - Math.cos(angle) * 12,
      y: effect.y - Math.sin(angle) * 12,
      radius: 24,
      color: mode.tint,
      alpha: alpha * 0.24,
      zIndex: z - 3,
      phase: progress * 2,
      count: 5,
      direction: angle + Math.PI,
      spread: Math.PI * 0.8
    }) || renderer.drawGfxSparkSpray(effect.x - Math.cos(angle) * 12, effect.y - Math.sin(angle) * 12, 24, mode.tint, alpha * 0.2, z - 3, 5, progress * 2, angle + Math.PI, Math.PI * 0.8);
    renderer.drawGfxFlask(effect.x, effect.y, angle + progress * 2.1, mode.tint, alpha * (0.82 + peak * 0.04), z + 1, 0.95);
    renderer.fx("fx-flask", effect.x, effect.y, 0.42 + peak * 0.08, 0.42 + peak * 0.08, mode.tint, alpha * 0.34, z + 2, angle + progress * 1.8, "add");
    return true;
  }

  function renderAlchemistElixirEffect(renderer, context, mode) {
    const { effect, progress, alpha, effectRadius, z } = context;
    if (!mode.heal) return false;
    renderer.drawGfxCircle(effect.x, effect.y, effectRadius * 0.72, "#bbf7d0", alpha * 0.08, "#86efac", alpha * 0.28, 3, z, "add", 28);
    renderer.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.48, "#bbf7d0", alpha * 0.34, z + 1, progress * 1.5, 8);
    renderer.drawGfxLine(effect.x - 19, effect.y, effect.x + 19, effect.y, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
    renderer.drawGfxLine(effect.x, effect.y - 19, effect.x, effect.y + 19, 8, "#bbf7d0", alpha * 0.62, z + 3, "add");
    renderer.fx("fx-heal-cross", effect.x, effect.y, effectRadius / 88, effectRadius / 88, "#bbf7d0", alpha * 0.46, z + 4, progress * 0.6, "add");
    return true;
  }

  function renderAlchemistReactionEffect(renderer, context, mode) {
    const { effect, progress, alpha, s, effectRadius, peak, z } = context;
    if (mode.heal) return false;
    if (s.includes("throw") && !s.includes("reaction") && !s.includes("tick") && !s.includes("bomb")) return false;
    renderer.drawGfxCircle(effect.x, effect.y, effectRadius * (mode.fire ? 0.76 : 0.66), mode.tint, alpha * (mode.fire ? 0.13 : 0.1), mode.tint, alpha * 0.28, 3, z - 2, "add", 28);
    renderer.drawGfxSwirl(effect.x, effect.y, effectRadius * (mode.fire ? 0.54 : 0.48), mode.tint, alpha * 0.22, z - 1, progress * (mode.fire ? 2.2 : 1.4), mode.fire ? 4 : 3);
    const count = mode.fire ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      const a = (Math.PI * 2 * i) / count + progress * 0.4;
      const r = effectRadius * (0.28 + (i % 3) * 0.09);
      if (mode.fire) {
        const x = effect.x + Math.cos(a) * r;
        const y = effect.y + Math.sin(a) * r * 0.65;
        renderer.drawGfxPath([{ x, y: y - 14 }, { x: x + 8, y: y + 11 }, { x: x - 8, y: y + 11 }], i % 2 ? "#f97316" : "#fde68a", alpha * 0.42, "#f97316", alpha * 0.18, 1, z + i, "add");
      } else {
        renderer.drawGfxCircle(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r * 0.75, 8 + peak * 3, "#bef264", alpha * 0.24, "#d9f99d", alpha * 0.18, 1, z + i, "add", 10);
      }
    }
    return true;
  }

  function renderAlchemistStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const s = context.s;
    if (!(s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("fire_tick"))) return false;
    const mode = alchemistMode(context);
    const throwRendered = renderAlchemistThrowEffect(renderer, context, mode);
    const elixirRendered = renderAlchemistElixirEffect(renderer, context, mode);
    const reactionRendered = renderAlchemistReactionEffect(renderer, context, mode);
    return throwRendered || elixirRendered || reactionRendered;
  }

  function shouldRenderAssassinEffect(context) {
    const s = context?.s || "";
    return s.includes("assassin") || s.includes("shadow") || s.includes("smoke_bomb") || s.includes("stalker") || s.includes("shuriken");
  }

  function renderAssassinLungeEffect(renderer, context) {
    const { effect, alpha, radius, s, kind, angle, peak, end, z } = context;
    if (!(s.includes("lunge") || kind === "dash")) return false;
    renderer.fx("fx-smoke", effect.x, effect.y, radius / 86, radius / 120, "#21142f", alpha * 0.46, z - 6, 0, "add");
    renderer.fx("fx-shadow-cut", end.toX, end.toY, 0.88 + peak * 0.22, 0.62 + peak * 0.1, "#c4b5fd", alpha * 0.86, z + 6, angle, "add");
    return true;
  }

  function renderAssassinSmokeEffect(renderer, context) {
    const { effect, progress, alpha, s, effectRadius, peak, z } = context;
    if (!s.includes("smoke")) return false;
    renderer.fx("fx-smoke", effect.x, effect.y, effectRadius / 78, effectRadius / 100, "#21142f", alpha * 0.52, z - 8, progress * 0.25, "add");
    renderer.fx("fx-assassin-mark", effect.x, effect.y, 0.46 + peak * 0.1, 0.46 + peak * 0.1, "#c4b5fd", alpha * 0.28, z + 2, progress * 1.6, "add");
    return true;
  }

  function renderAssassinMarkEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, z } = context;
    if (!(s.includes("mark") || s.includes("echo") || s.includes("shuriken"))) return false;
    renderer.fx("fx-assassin-mark", effect.x, effect.y, 0.58 + peak * 0.12, 0.58 + peak * 0.12, "#f5d0fe", alpha * 0.6, z + 3, progress * 0.8, "add");
    if (s.includes("echo") || s.includes("shuriken")) {
      renderer.fx("fx-shadow-cut", effect.x, effect.y, 0.76 + peak * 0.18, 0.46 + peak * 0.08, "#c4b5fd", alpha * 0.62, z + 5, angle, "add");
    }
    return true;
  }

  function renderAssassinMeleeEffect(renderer, context) {
    const { effect, progress, alpha } = context;
    renderer.renderFastMeleeConeEffect(effect, progress, alpha, "#c4b5fd", "assassin");
    return true;
  }

  function renderAssassinStyledSkillEffect(renderer, context) {
    if (!context || !shouldRenderAssassinEffect(context)) return false;
    return (
      renderAssassinLungeEffect(renderer, context) ||
      renderAssassinSmokeEffect(renderer, context) ||
      renderAssassinMarkEffect(renderer, context) ||
      renderAssassinMeleeEffect(renderer, context)
    );
  }

  function commonDangerColor(context) {
    const s = context.s || "";
    if (s.includes("poison") || s.includes("venom")) return "#bef264";
    if (s.includes("mortar") || s.includes("blast") || s.includes("bomber") || s.includes("fire") || s.includes("meteor")) return "#f97316";
    return "#ef4444";
  }

  function renderCommonWarningEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, effectRadius, peak, z } = context;
    if (context.kind !== "warning") return false;
    const danger = commonDangerColor(context);
    const warnRadius = effectRadius;
    renderer.drawGfxCircle(effect.x, effect.y, warnRadius, danger, alpha * 0.06, danger, alpha * 0.42, 4, z - 30, "add", 42);
    renderer.drawGfxRuneRing(effect.x, effect.y, warnRadius * (0.9 + peak * 0.03), danger, alpha * 0.34, z - 28, progress * 2.2, s.includes("sniper") ? 6 : 10);
    if (s.includes("sniper") || s.includes("lock") || s.includes("beam")) {
      renderer.drawGfxLine(effect.x - warnRadius, effect.y, effect.x + warnRadius, effect.y, 4, danger, alpha * 0.34, z - 20, "add");
      renderer.drawGfxLine(effect.x, effect.y - warnRadius, effect.x, effect.y + warnRadius, 4, danger, alpha * 0.22, z - 19, "add");
      renderer.renderParticlePreset?.("hitSpark", {
        x: effect.x,
        y: effect.y,
        radius: warnRadius * 0.62,
        color: danger,
        alpha: alpha * 0.2,
        zIndex: z - 16,
        phase: progress * 2.7,
        count: 6
      }) || renderer.drawGfxSparkSpray(effect.x, effect.y, warnRadius * 0.62, danger, alpha * 0.16, z - 16, 6, progress * 2.7);
    } else if (s.includes("charge")) {
      renderer.drawGfxCone(effect.x, effect.y, angle, warnRadius * 1.15, 0.44, danger, alpha * 0.055, alpha * 0.34, z - 24, false);
      renderer.renderParticlePreset?.("hitSpark", {
        x: effect.x + Math.cos(angle) * warnRadius * 0.9,
        y: effect.y + Math.sin(angle) * warnRadius * 0.9,
        radius: warnRadius * 0.26,
        color: danger,
        alpha: alpha * 0.28,
        zIndex: z - 16,
        phase: progress,
        count: 7,
        direction: angle,
        spread: Math.PI * 0.8
      }) || renderer.drawGfxSparkSpray(effect.x + Math.cos(angle) * warnRadius * 0.9, effect.y + Math.sin(angle) * warnRadius * 0.9, warnRadius * 0.26, danger, alpha * 0.22, z - 16, 7, progress, angle, Math.PI * 0.8);
    } else {
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + progress * 0.5;
        renderer.drawGfxLine(effect.x + Math.cos(a) * warnRadius * 0.72, effect.y + Math.sin(a) * warnRadius * 0.72, effect.x + Math.cos(a) * warnRadius, effect.y + Math.sin(a) * warnRadius, 3, danger, alpha * 0.28, z - 18 + i, "add");
      }
    }
    return true;
  }

  function renderExplosionRangeBoundary(renderer, context, options = {}) {
    const { effect, progress, alpha, effectRadius, peak, z } = context;
    const radius = Math.max(1, Number(effectRadius) || 1);
    const t = Math.max(0, Math.min(1, Number(progress) || 0));
    const edge = options.edge || "#fb923c";
    const hot = options.hot || "#fde68a";
    const dark = options.dark || "#7c2d12";
    const expand = 1 - Math.pow(1 - Math.min(1, t / 0.48), 3);
    const shockRadius = radius * (0.14 + expand * 0.86);
    const boundaryAlpha = alpha * (0.28 + Math.max(0, Number(peak) || 0) * 0.08);

    // The outer ring is the exact server-provided splash radius; the inner ring is visual motion only.
    renderer.drawGfxCircle(effect.x, effect.y, radius, dark, alpha * 0.025, edge, boundaryAlpha, 3, z - 18, "add", 72);
    renderer.drawGfxCircle(effect.x, effect.y, shockRadius, "#000000", 0, hot, alpha * 0.34, 4, z - 10, "add", 64);
    return true;
  }

  function renderCommonImpactEffect(renderer, context) {
    const { effect, progress, alpha, color, s, kind, effectRadius, z } = context;
    if (!(kind === "explosion" || kind === "death" || kind === "impact")) return false;
    const fire = s.includes("fire") || s.includes("bomber") || s.includes("blast") || s.includes("meteor");
    const poison = s.includes("poison") || s.includes("acid") || s.includes("splitter");
    const tint = poison ? "#bef264" : fire ? "#f97316" : color;
    if (kind === "explosion" && Number(effect.rangeRadius) > 0) {
      renderExplosionRangeBoundary(renderer, context, {
        edge: tint,
        hot: fire ? "#fde68a" : tint,
        dark: poison ? "#365314" : "#7c2d12"
      });
    }
    renderer.drawGfxCircle(effect.x, effect.y, effectRadius * (0.44 + progress * 0.42), tint, alpha * 0.16, tint, alpha * 0.34, 4, z, "add", 30);
    renderer.drawGfxCircle(effect.x, effect.y, effectRadius * (0.72 + progress * 0.34), tint, alpha * 0.04, "#f8f3e9", alpha * 0.2, 2, z + 1, "add", 34);
    renderer.drawGfxShardBurst(effect.x, effect.y, effectRadius * 0.82, fire ? "#fde68a" : tint, alpha * 0.46, z + 4, fire ? 11 : 8, progress);
    renderer.renderParticlePreset?.(fire ? "fireBurst" : poison ? "poisonBurst" : "hitSpark", {
      x: effect.x,
      y: effect.y,
      radius: effectRadius * 0.9,
      color: fire ? "#fde68a" : tint,
      alpha: alpha * 0.34,
      zIndex: z + 12,
      phase: progress * 3.4,
      count: fire ? 14 : 10
    }) || renderer.drawGfxSparkSpray(effect.x, effect.y, effectRadius * 0.9, fire ? "#fde68a" : tint, alpha * 0.28, z + 12, fire ? 14 : 10, progress * 3.4);
    return true;
  }

  function renderCommonStyledEffect(renderer, context) {
    if (!context) return false;
    return renderCommonWarningEffect(renderer, context) || renderCommonImpactEffect(renderer, context);
  }

  function renderCrispCommonStyledEffect(renderer, context) {
    if (!context) return false;
    return renderCommonWarningEffect(renderer, context) || renderCommonImpactEffect(renderer, context);
  }

  function renderCrispRangerEffect(renderer, context) {
    const { effect, progress, alpha, radius, s, kind, angle, peak, effectRadius, end, z } = context;
    const poison = s.includes("poison") || s.includes("venom");
    const assassin = s.includes("assassin");
    const tint = poison ? "#bef264" : assassin ? "#c4b5fd" : "#f1d08b";
    const light = poison ? "#ecfccb" : assassin ? "#ede9fe" : "#fff7ed";
    const dark = poison ? "#365314" : assassin ? "#2e1065" : "#4a3415";
    const drawBowMark = (bowAlpha = 1) => {
      const bowRadius = Math.max(28, effectRadius * 0.24);
      const bowX = effect.x - Math.cos(angle) * Math.max(16, radius * 0.18);
      const bowY = effect.y - Math.sin(angle) * Math.max(16, radius * 0.18);
      const start = angle - Math.PI * 0.62;
      const endAngle = angle + Math.PI * 0.62;
      renderer.drawGfxArc(bowX, bowY, bowRadius, start, endAngle, 4, tint, alpha * 0.28 * bowAlpha, z - 7, "add", 14);
      renderer.drawGfxLine(
        bowX + Math.cos(start) * bowRadius,
        bowY + Math.sin(start) * bowRadius,
        bowX + Math.cos(endAngle) * bowRadius,
        bowY + Math.sin(endAngle) * bowRadius,
        2,
        light,
        alpha * 0.2 * bowAlpha,
        z - 6,
        "add"
      );
    };

    if (s.includes("ranger_explosive_arrow")) {
      renderExplosionRangeBoundary(renderer, context, {
        edge: "#fb923c",
        hot: "#fff7ed",
        dark: "#7c2d12"
      });
      const blastRadius = effectRadius * (0.5 + peak * 0.16);
      renderer.drawGfxCircle(effect.x, effect.y, blastRadius, "#7c2d12", alpha * 0.16, "#fb923c", alpha * 0.5, 5, z - 4, "add", 40);
      renderer.drawGfxImpactBurst(effect.x, effect.y, effectRadius * (0.58 + peak * 0.12), "#fde68a", alpha * 0.42, z + 8, progress * 3.2, 12);
      renderer.drawGfxShardBurst(effect.x, effect.y, effectRadius * 0.78, "#fff7ed", alpha * 0.38, z + 14, 11, progress);
      renderer.renderParticlePreset?.("fireBurst", {
        x: effect.x,
        y: effect.y,
        radius: effectRadius * 0.82,
        color: "#fde68a",
        alpha: alpha * 0.44,
        zIndex: z + 24,
        phase: progress * 3,
        count: 13
      });
      return true;
    }

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
      const point = (t, lane = 0) => {
        const one = 1 - t;
        return {
          x: one * one * end.fromX + 2 * one * t * apexX + t * t * end.toX + px * lane,
          y: one * one * end.fromY + 2 * one * t * apexY + t * t * end.toY + py * lane
        };
      };
      const tangent = (t) => {
        const tx = 2 * (1 - t) * (apexX - end.fromX) + 2 * t * (end.toX - apexX);
        const ty = 2 * (1 - t) * (apexY - end.fromY) + 2 * t * (end.toY - apexY);
        const len = Math.hypot(tx, ty) || 1;
        return { x: tx / len, y: ty / len };
      };
      renderer.drawGfxArc(bowX, bowY, bowRadius, bowStart, bowEnd, 4, tint, alpha * 0.36, z - 12, "add", 14);
      renderer.drawGfxLine(
        bowX + Math.cos(bowStart) * bowRadius,
        bowY + Math.sin(bowStart) * bowRadius,
        bowX + Math.cos(bowEnd) * bowRadius,
        bowY + Math.sin(bowEnd) * bowRadius,
        2,
        light,
        alpha * 0.24,
        z - 11,
        "add"
      );

      let previous = point(0);
      for (let i = 1; i <= 26; i += 1) {
        const t = i / 26;
        const next = point(t);
        const fade = 0.22 + Math.sin(t * Math.PI) * 0.16;
        renderer.drawGfxLine(previous.x, previous.y, next.x, next.y, 7, "#4a3415", alpha * 0.12, z - 18 + i, "add");
        renderer.drawGfxLine(previous.x, previous.y, next.x, next.y, 4, tint, alpha * fade, z - 17 + i, "add");
        if (i % 3 === 0) renderer.drawGfxLine(previous.x + px * 11, previous.y + py * 11, next.x + px * 11, next.y + py * 11, 1.5, light, alpha * 0.12, z - 19 + i, "add");
        previous = next;
      }

      const headT = Math.max(0.05, Math.min(0.94, launch * 0.92));
      const head = point(headT);
      const dir = tangent(headT);
      renderer.drawGfxArrow(head.x - dir.x * 58, head.y - dir.y * 58, head.x + dir.x * 12, head.y + dir.y * 12, light, alpha * 0.95, z + 16, 7);
      renderer.drawGfxLine(end.fromX, end.fromY, head.x - dir.x * 18, head.y - dir.y * 18, 3, tint, alpha * 0.22, z - 4, "add");

      if (launch > 0.42) {
        const glint = point(0.5);
        renderer.drawGfxCircle(glint.x, glint.y, 13 + peak * 6, "#4a3415", alpha * 0.08, "#fde68a", alpha * 0.32, 2, z + 14, "add", 14);
      }

      const fallCount = 7;
      if (rain > 0) {
        renderer.drawGfxCircle(end.toX, end.toY, effectRadius, dark, alpha * 0.026, tint, alpha * (0.2 + rain * 0.18), 2, z + 12, "add", 56);
        renderer.drawGfxCircle(end.toX, end.toY, effectRadius * 0.72, "#000000", 0, "#fde68a", alpha * (0.06 + rain * 0.08), 1.2, z + 13, "add", 42);
      }
      for (let i = 0; i < fallCount; i += 1) {
        const lane = (i - (fallCount - 1) / 2) * effectRadius * 0.13 + (renderer.noise(i * 17, end.toX) - 0.5) * effectRadius * 0.1;
        const landX = end.toX + lane;
        const landY = end.toY + (renderer.noise(i * 11, end.toY) - 0.5) * effectRadius * 0.28;
        const fall = Math.max(0, Math.min(1, rain * 1.25 - (i % 4) * 0.08));
        if (fall <= 0) continue;
        const x = landX;
        const y = landY - effectRadius * 2.05 + fall * effectRadius * 2.28;
        const slant = (i % 2 ? -1 : 1) * 2;
        renderer.drawGfxArrow(x - slant, y - 42, x + slant, y + 30, i % 3 === 0 ? light : tint, alpha * (0.34 + fall * 0.34), z + 28 + i, i % 3 === 0 ? 4 : 3);
      }

      return true;
    }

    if (s.includes("arrow_rain")) {
      const rainRadius = effectRadius;
      const warn = kind === "warning";
      if (warn) return true;
      const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
      if (rainProgress <= 0) return true;
      renderer.drawGfxCircle(effect.x, effect.y, rainRadius, "#4a3415", alpha * 0.026, "#f1d08b", alpha * (0.22 + rainProgress * 0.16), 2, z - 12, "add", 56);
      renderer.drawGfxCircle(effect.x, effect.y, rainRadius * 0.72, "#000000", 0, "#fde68a", alpha * (0.07 + rainProgress * 0.07), 1.2, z - 11, "add", 42);
      const dropCount = 8;
      for (let i = 0; i < dropCount; i += 1) {
        const seed = renderer.noise(i * 19 + effect.x, effect.y * 0.1);
        const lane = (i - (dropCount - 1) / 2) * rainRadius * 0.12 + (seed - 0.5) * rainRadius * 0.1;
        const landX = effect.x + lane;
        const landY = effect.y + (renderer.noise(i * 7, effect.x) - 0.5) * rainRadius * 0.32;
        const fall = (rainProgress * 1.35 + i / dropCount) % 1;
        const x = landX;
        const y = landY - rainRadius * 2.05 + fall * rainRadius * 2.32;
        const slant = (i % 2 ? -1 : 1) * 2;
        renderer.drawGfxArrow(x - slant, y - 46, x + slant, y + 32, i % 3 === 0 ? "#fff7ed" : "#f1d08b", alpha * (0.36 + rainProgress * 0.3), z + i, i % 3 === 0 ? 4 : 3);
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
      renderer.drawGfxCircle(end.fromX, end.fromY, beamWidth * (0.28 + peak * 0.08), "#12301f", alpha * 0.12, light, alpha * 0.32, 2, z - 4, "add", 16);
      renderer.drawGfxCapsule(tailX, tailY, headX, headY, beamWidth * 1.2, "#12301f", alpha * 0.34, z - 15);
      renderer.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 0.84, tint, alpha * 0.82, z - 7, "add");
      renderer.drawGfxLine(tailX, tailY, headX, headY, Math.max(8, beamWidth * 0.24), light, alpha * 0.92, z - 2, "add");
      renderer.drawGfxImpactBurst(headX, headY, beamWidth * (0.68 + peak * 0.2), light, alpha * 0.34, z + 9, progress, 8);
      for (let i = 1; i <= 5; i += 1) {
        const t = i / 6;
        if (t < tail || t > travel) continue;
        const x = end.fromX + dx * t;
        const y = end.fromY + dy * t;
        const mark = 12 + (i % 2) * 5 + peak * 3;
        renderer.drawGfxLine(x - ux * mark + px * mark * 0.7, y - uy * mark + py * mark * 0.7, x + ux * mark, y + uy * mark, 4, light, alpha * 0.38, z + i, "add");
        renderer.drawGfxLine(x - ux * mark - px * mark * 0.7, y - uy * mark - py * mark * 0.7, x + ux * mark, y + uy * mark, 4, tint, alpha * 0.32, z + 6 + i, "add");
      }
      if (travel > 0.86) {
        renderer.drawGfxImpactBurst(end.toX, end.toY, beamWidth * 1.36, tint, alpha * 0.32, z + 10, progress, 10);
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
        renderer.drawGfxCircle(end.fromX, end.fromY, laneWidth * 0.38, tint, alpha * 0.12, light, alpha * 0.24, 1.5, z - 6, "add", 12);
        renderer.drawGfxCapsule(tailX, tailY, headX, headY, laneWidth, tint, alpha * 0.4, z - 12);
        renderer.drawGfxLine(tailX, tailY, headX, headY, Math.max(6, laneWidth * 0.22), light, alpha * 0.52, z - 8, "add");
        renderer.drawGfxLine(tailX + px * laneWidth * 0.36, tailY + py * laneWidth * 0.36, headX + px * laneWidth * 0.22, headY + py * laneWidth * 0.22, 2, tint, alpha * 0.3, z - 7, "add");
        renderer.drawGfxLine(tailX - px * laneWidth * 0.36, tailY - py * laneWidth * 0.36, headX - px * laneWidth * 0.22, headY - py * laneWidth * 0.22, 2, tint, alpha * 0.3, z - 7, "add");
        renderer.drawGfxArrow(headX - ux * 74, headY - uy * 74, headX + ux * 12, headY + uy * 12, light, alpha * 0.92, z + 3, 8);
        if (travel > 0.86) {
          renderer.drawGfxImpactBurst(end.toX, end.toY, laneWidth * 1.25, tint, alpha * 0.26, z + 8, progress, 8);
        }
      } else {
        const count = assassin ? 5 : s.includes("barrage") || s.includes("volley") ? 5 : 3;
        const spread = assassin ? 0.78 : count >= 5 ? 0.7 : 0.48;
        const fanRadius = Math.max(radius, effectRadius * 0.82);
        drawBowMark(1);
        for (let i = 0; i < count; i += 1) {
          const t = count === 1 ? 0 : i / (count - 1) - 0.5;
          const a = angle + t * spread;
          const px = -Math.sin(a);
          const py = Math.cos(a);
          const length = fanRadius * (assassin ? 0.92 : 1.2);
          const sx = effect.x - Math.cos(a) * length * 0.36 + px * t * 12;
          const sy = effect.y - Math.sin(a) * length * 0.36 + py * t * 12;
          const tx = effect.x + Math.cos(a) * length * 0.66 + px * t * 8;
          const ty = effect.y + Math.sin(a) * length * 0.66 + py * t * 8;
          const center = i === Math.floor(count / 2);
          renderer.drawGfxArrow(sx, sy, tx, ty, center ? light : tint, alpha * (center ? 0.9 : 0.62), z + i, assassin ? 4 : 5);
          renderer.drawGfxLine(sx - Math.cos(a) * 30, sy - Math.sin(a) * 30, sx, sy, 2, tint, alpha * 0.22, z - 4 + i, "add");
          if (poison) renderer.drawGfxCircle(tx - Math.cos(a) * 9, ty - Math.sin(a) * 9, 5 + peak * 2, "#bef264", alpha * 0.28, "#ecfccb", alpha * 0.22, 1, z + 8 + i, "add", 8);
        }
        if (poison) {
          const cloudX = effect.x + Math.cos(angle) * fanRadius * 0.44;
          const cloudY = effect.y + Math.sin(angle) * fanRadius * 0.44;
          renderer.drawGfxCircle(cloudX, cloudY, 26 + peak * 10, "#bef264", alpha * 0.16, "#d9f99d", alpha * 0.24, 2, z + 8, "add", 18);
          renderer.drawGfxSparkSpray(cloudX, cloudY, 32, "#bef264", alpha * 0.18, z + 10, 6, progress * 2.2, angle, Math.PI * 0.9);
        }
      }
      return true;
    }

    return false;
  }

  function renderCrispMageEffect(renderer, context) {
    const { effect, progress, alpha, s, kind, peak, pulse, effectRadius, end, z, angle, styleInfo, skinPalette } = context;
    const cx = effect.x;
    const cy = effect.y;
    const t = Math.max(0, Math.min(1, progress));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.78) / 0.22);
    const phase = Number(effect.seed || 0) * 0.19 + t * Math.PI * 2;

    const flameWave = s.includes("flame_wave");
    if ((s.includes("frost") || s.includes("freeze") || s.includes("ice") || flameWave) && !isMeteorFallEffect(context)) {
      const frostRadius = effectRadius;
      if (s.includes("frost_breath")) {
        const auraAlpha = alpha * 0.85;
        renderer.drawGfxCircle(cx, cy, frostRadius * 0.82, "#081923", auraAlpha * 0.028, "#93c5fd", auraAlpha * 0.09, 1.5, z - 16, "add", 64);
        renderer.drawGfxCircle(cx, cy, frostRadius * 0.52, "#000000", 0, "#dbeafe", auraAlpha * 0.045, 1, z - 15, "add", 44);
        for (let i = 0; i < 3; i += 1) {
          const a = phase * 0.08 + (Math.PI * 2 * i) / 3;
          renderer.drawGfxArc(cx, cy, frostRadius * (0.48 + i * 0.11), a - 0.34, a + 0.54, 2, i % 2 ? "#dbeafe" : "#93c5fd", auraAlpha * 0.075, z - 8 + i, "add", 8);
        }
        for (let i = 0; i < 5; i += 1) {
          const a = phase * 0.12 + (Math.PI * 2 * i) / 5;
          const r = frostRadius * (0.24 + (i % 3) * 0.13);
          renderer.drawGfxDiamond(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.72, 3.5 + (i % 2), "#dbeafe", auraAlpha * 0.1, z - 2 + i, a, "#93c5fd");
        }
        return true;
      }

      const wave = Math.min(1, t / 0.32);
      const ease = 1 - Math.pow(1 - wave, 2.4);
      const ring = frostRadius * (0.18 + ease * 0.78);
      const iceAlpha = alpha * fade;
      const waveDark = flameWave ? "#2a120b" : "#06131f";
      const waveMain = flameWave ? "#fb923c" : "#93c5fd";
      const waveHot = flameWave ? "#ffedd5" : "#dbeafe";
      const waveLight = flameWave ? "#fed7aa" : "#e0f2fe";
      renderer.drawGfxCircle(cx, cy, frostRadius * 0.82, waveDark, iceAlpha * 0.045, waveMain, iceAlpha * 0.12, 2, z - 14, "add", 58);
      renderer.drawGfxCircle(cx, cy, ring, "#000000", 0, waveHot, iceAlpha * 0.58, 4, z - 8, "add", 58);
      renderer.drawGfxCircle(cx, cy, Math.max(18, ring * 0.42), waveHot, iceAlpha * 0.035, waveMain, iceAlpha * 0.16, 1.5, z - 7, "add", 34);
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + 0.18;
        const inner = ring * 0.18;
        const outer = ring * (0.72 + (i % 3) * 0.045);
        renderer.drawGfxLine(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * 0.92, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.92, i % 2 ? 2.4 : 3.4, i % 2 ? waveMain : waveLight, iceAlpha * 0.34, z + i, "add");
      }
      for (let i = 0; i < 5; i += 1) {
        const a = phase * 0.06 + (Math.PI * 2 * i) / 5;
        const r = ring * (0.62 + (i % 2) * 0.08);
        renderer.drawGfxDiamond(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, 5 + (i % 2), waveHot, iceAlpha * 0.24, z + 14 + i, a, waveMain);
      }
      if (skinPalette) {
        const glyphCount = skinPalette.shape === "star" ? 8 : 6;
        for (let i = 0; i < glyphCount; i += 1) {
          const a = phase * 0.04 + (Math.PI * 2 * i) / glyphCount;
          const r = Math.min(frostRadius * 0.76, ring * (0.68 + (i % 2) * 0.08));
          drawMageSkinGlyph(renderer, skinPalette, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.92, Math.max(5, frostRadius * 0.055), iceAlpha * 0.62, z + 24 + i, a + Math.PI * 0.5);
        }
      }
      if (s.includes("lock") || s.includes("shatter")) {
        renderer.drawGfxImpactBurst(cx, cy, frostRadius * 0.38, waveHot, alpha * 0.22, z + 20, t * 1.6, 7);
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
      const iceMeteor = Boolean(effect.iceMeteor);
      const icePalette = iceMeteor ? {
        main: "#38bdf8",
        dark: "#082f49",
        hot: "#e0f2fe",
        mid: "#7dd3fc",
        core: "#f0f9ff",
        rock: "#0c4a6e",
        shadow: "#020617",
      } : {};
      const themedSkinPalette = iceMeteor && skinPalette ? { ...skinPalette, ...icePalette } : skinPalette;
      const meteorTint = icePalette.main || skinPalette?.main || "#fb923c";
      const meteorHot = icePalette.hot || skinPalette?.hot || "#fed7aa";
      const meteorDark = icePalette.dark || skinPalette?.dark || "#2a120b";
      const targetAlpha = alpha * Math.max(0.06, 0.3 - impact * 0.14);
      drawMeteorLandingShadow(renderer, cx, cy, meteorRadius, fall, impact, alpha, z - 20, icePalette);
      renderer.drawGfxCircle(cx, cy, meteorRadius * (0.42 + impact * 0.5), meteorDark, alpha * (0.04 + impact * 0.045), meteorTint, targetAlpha, 2.5, z - 18, "add", 48);
      renderer.drawGfxArc(cx, cy, meteorRadius * 0.88, Math.PI * 0.1, Math.PI * 0.86, 4, meteorHot, targetAlpha * 0.78, z - 16, "add", 14);
      renderer.drawGfxArc(cx, cy, meteorRadius * 0.88, -Math.PI * 0.86, -Math.PI * 0.1, 4, meteorTint, targetAlpha * 0.78, z - 15, "add", 14);
      if (impact <= 0.04) {
        const meteorSize = meteorRadius * (0.2 + fall * 0.075);
        const tailX = mx - Math.cos(meteorAngle) * meteorRadius * 0.75;
        const tailY = my - Math.sin(meteorAngle) * meteorRadius * 0.75;
        if (themedSkinPalette) {
          renderer.drawGfxLine?.(tailX, tailY, mx, my, meteorSize * 1.15, meteorDark, alpha * 0.28, z - 5 + fall * 10, "add");
          renderer.drawGfxLine?.(tailX, tailY, mx, my, meteorSize * 0.5, meteorTint, alpha * 0.64, z - 4 + fall * 10, "add");
          drawMageSkinGlyph(renderer, themedSkinPalette, mx, my, meteorSize * 1.25, alpha * 0.96, z + 12 + fall * 12, meteorAngle + t * 1.8);
        } else {
          drawMeteorTrail(renderer, tailX, tailY, mx, my, meteorSize, alpha * 0.82, z - 4 + fall * 10, t, icePalette);
          renderer.drawGfxPath?.(meteorRockPoints(mx, my, meteorAngle, meteorSize * 1.52, meteorSize * 0.98, t * 4), icePalette.rock || "#3f1f13", alpha * 0.9, meteorHot, alpha * 0.56, 2.2, z + 10 + fall * 12, "normal");
          renderer.drawGfxLine?.(mx - Math.cos(meteorAngle) * meteorSize * 0.55, my - Math.sin(meteorAngle) * meteorSize * 0.55, mx + Math.cos(meteorAngle) * meteorSize * 0.28, my + Math.sin(meteorAngle) * meteorSize * 0.28, Math.max(3, meteorSize * 0.18), icePalette.mid || "#fde68a", alpha * 0.36, z + 14 + fall * 12, "add");
        }
      } else {
        const shock = meteorRadius * (0.4 + impact * 0.5);
        renderer.drawGfxCircle(cx, cy + meteorRadius * 0.06, shock, meteorDark, alpha * (0.11 - impact * 0.03), meteorTint, alpha * (0.36 - impact * 0.14), 4, z + 8, "add", 42);
        renderer.drawGfxImpactBurst(cx, cy, meteorRadius * (0.58 + impact * 0.28), meteorTint, alpha * (0.28 - impact * 0.08), z + 18, t * 2.1, 10);
        if (themedSkinPalette) drawMageSkinGlyph(renderer, themedSkinPalette, cx, cy, meteorRadius * 0.24, alpha * (0.66 - impact * 0.28), z + 23, t * 2.4);
        drawMeteorFragments(renderer, cx, cy, meteorRadius * (0.36 + impact * 0.18), alpha * impact * 0.62, z + 24, t * 4.6, icePalette);
      }
      return true;
    }

    if (styleInfo ? styleInfo.lightningSkill || s.includes("drone_laser") : s.includes("chain_lightning") || s.includes("lightning") || s.includes("electric") || s.includes("overclock") || s.includes("rail_") || s.includes("drone_laser") || s.includes("turret_bolt")) {
      const empowered = s.includes("empowered_current");
      const rail = s.includes("rail");
      const engineerArc = s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("overclock") || s.includes("coil");
      const mageChain = (s.includes("chain_lightning") || (kind === "chain" && !engineerArc && !s.includes("assassin") && !s.includes("puppet") && !s.includes("elite"))) && !s.includes("mark_chain");
      const tint = mageChain && skinPalette ? skinPalette.main : rail ? "#fde68a" : empowered ? "#ef4444" : engineerArc ? "#67e8f9" : "#9ee6ff";
      const core = mageChain && skinPalette ? skinPalette.hot : empowered ? "#fee2e2" : "#f8fafc";
      if (mageChain) {
        const dx = end.toX - end.fromX;
        const dy = end.toY - end.fromY;
        const length = Math.hypot(dx, dy) || 1;
        const ux = dx / length;
        const uy = dy / length;
        const px = -uy;
        const py = ux;
        const width = empowered ? 8 : 7;
        if (skinPalette?.shape === "star") {
          renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width + 9, skinPalette.dark, alpha * 0.3, z - 4, "add");
          renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width + 3, tint, alpha * 0.76, z, "add");
          renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(2.4, width * 0.36), core, alpha * 0.96, z + 4, "add");
        } else {
          renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.86, z, width, skinPalette?.shape === "leaf" ? 6 : 8, skinPalette?.shape === "void" ? 22 : 16, t * 1.35);
          renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.2, z + 4, Math.max(2, width * 0.34), 5, 8, t * 1.35 + 0.31);
        }
        const branchCount = skinPalette?.shape === "star" ? 4 : 3;
        for (let i = 0; i < branchCount; i += 1) {
          const along = (i + 1) / 4;
          const bx = end.fromX + dx * along;
          const by = end.fromY + dy * along;
          const side = i % 2 ? 1 : -1;
          const len = 30 + i * 5;
          if (skinPalette?.shape === "star") {
            drawMageSkinGlyph(renderer, skinPalette, bx, by, 6 + (i % 2) * 2, alpha * 0.62, z + 8 + i, t + i * 0.27);
          } else if (skinPalette?.shape === "leaf") {
            drawMageSkinGlyph(renderer, skinPalette, bx + px * side * 5, by + py * side * 5, 7, alpha * 0.48, z + 8 + i, Math.atan2(dy, dx) + side * 0.5);
          } else {
            renderer.drawGfxLightning(bx, by, bx + ux * len * 0.2 + px * side * len, by + uy * len * 0.2 + py * side * len, tint, alpha * (0.24 - i * 0.035), z + 8 + i, 2.6, 3, 7, t + i * 0.27);
          }
        }
        renderer.drawGfxCircle(end.fromX, end.fromY, 9 + peak * 3, tint, alpha * 0.08, core, alpha * 0.22, 2, z + 7, "add", 12);
        renderer.drawGfxCircle(end.toX, end.toY, 15 + peak * 6, tint, alpha * 0.12, core, alpha * 0.34, 2.5, z + 12, "add", 14);
        return true;
      }
      const coil = s.includes("coil");
      const width = coil ? 12 : rail ? 8 : empowered ? 10 : engineerArc ? 8 : 9;
      const boltSegments = rail ? 5 : coil ? 11 : s.includes("chain_lightning") ? 9 : engineerArc ? 8 : 8;
      const boltJitter = rail ? 5 : coil ? 24 : s.includes("chain_lightning") ? 23 : engineerArc ? 19 : 18;
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.94, z, width, boltSegments, boltJitter, progress * 1.7);
      if (coil) {
        const dx = end.toX - end.fromX;
        const dy = end.toY - end.fromY;
        const length = Math.hypot(dx, dy) || 1;
        const px = -dy / length;
        const py = dx / length;
        for (const side of [-1, 1]) {
          renderer.drawGfxLightning(end.fromX + px * side * 28, end.fromY + py * side * 28, end.toX + px * side * 20, end.toY + py * side * 20, tint, alpha * 0.28, z - 2, 5, 5, 15, progress + side * 0.23);
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
          renderer.drawGfxLightning(bx, by, bx + Math.cos(branchAngle) * branchLength, by + Math.sin(branchAngle) * branchLength, tint, alpha * (0.28 - i * 0.035), z + 8 + i, Math.max(2.2, width * 0.38), 3, 9 + i * 2, progress + i * 0.31);
        }
        renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, core, alpha * 0.14, z + 4, Math.max(2, width * 0.3), 5, boltJitter * 0.55, progress + 0.37);
      }
      renderer.drawGfxCircle(end.fromX, end.fromY, 10 + peak * 4, tint, alpha * 0.08, core, alpha * 0.18, 2, z + 5, "add", 10);
      renderer.drawGfxCircle(end.toX, end.toY, 18 + peak * 9, tint, alpha * 0.16, core, alpha * 0.42, 3, z + 8, "add", 14);
      renderer.renderParticlePreset?.("hitSpark", {
        x: end.toX,
        y: end.toY,
        radius: 42 + peak * 10,
        color: core,
        alpha: alpha * 0.46,
        zIndex: z + 12,
        phase: progress * 4.1,
        count: 11
      }) || renderer.drawGfxSparkSpray(end.toX, end.toY, 42 + peak * 10, core, alpha * 0.36, z + 12, 11, progress * 4.1);
      return true;
    }

    if (s.includes("star_orb_pierce_impact")) {
      const tint = skinPalette?.main || "#c4b5fd";
      const core = skinPalette?.hot || "#f8fafc";
      const hitRadius = Math.max(18, Math.min(72, effectRadius * 0.34));
      const impactAngle = Number.isFinite(effect.angle)
        ? effect.angle
        : Math.atan2(end.toY - end.fromY, end.toX - end.fromX);
      renderer.drawGfxCircle(cx, cy, hitRadius * (0.72 + peak * 0.16), "#000000", 0, tint, alpha * 0.2, 2, z - 2, "add", 18);
      renderer.drawGfxStar(cx, cy, Math.max(10, hitRadius * 0.42), core, alpha * 0.48, z + 2, 6);
      renderer.drawGfxImpactBurst(cx, cy, hitRadius * 0.7, tint, alpha * 0.14, z + 4, impactAngle, 6);
      return true;
    }

    if (s.includes("arcane_orb") || s.includes("star_orb") || s.includes("star_shard") || s.includes("star_burst") || s.includes("star_split") || s.includes("arcane_splash") || s.includes("blink")) {
      const blink = s.includes("blink");
      const burst = s.includes("burst") || s.includes("splash");
      const split = s.includes("split");
      const tint = skinPalette?.main || (blink ? "#93c5fd" : burst ? "#d8b4fe" : "#c4b5fd");
      const core = skinPalette?.hot || (blink ? "#e0f2fe" : "#f8fafc");
      const starRadius = Math.max(34, effectRadius * (burst ? 1 : 0.42) * (0.94 + peak * 0.06));
      if (s.includes("giant_star_orb_launch")) {
        const gather = 1 - Math.pow(progress, 0.62);
        const coreRadius = Math.max(18, effectRadius * (0.16 + peak * 0.025));
        const gatherRadius = effectRadius * (0.42 + gather * 0.5);
        renderer.drawGfxCircle(cx, cy, gatherRadius, skinPalette?.dark || "#180f2a", alpha * 0.035, tint, alpha * 0.2, 2, z - 8, "add", 32);
        renderer.drawGfxArc(cx, cy, gatherRadius * 0.82, phase, phase + Math.PI * 1.25, 3, core, alpha * 0.34, z - 4, "add", 18);
        renderer.drawGfxArc(cx, cy, gatherRadius * 0.82, phase + Math.PI, phase + Math.PI * 2.25, 3, tint, alpha * 0.3, z - 3, "add", 18);
        for (let i = 0; i < 8; i += 1) {
          const a = phase * 0.18 + (Math.PI * 2 * i) / 8;
          const outer = gatherRadius * 0.86;
          renderer.drawGfxLine(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, cx + Math.cos(a) * coreRadius * 0.72, cy + Math.sin(a) * coreRadius * 0.72, 2, tint, alpha * 0.2, z + i, "add");
        }
        renderer.drawGfxStar(cx, cy, coreRadius, core, alpha * 0.72, z + 12, 8);
        renderer.drawGfxDiamond(cx, cy, coreRadius * 0.34, "#ffffff", alpha * 0.8, z + 14, phase * 0.6, tint);
        return true;
      }
      if (s.includes("giant_star_orb_impact") || s.includes("giant_star_orb_wall_impact")) {
        const wallImpact = s.includes("wall_impact");
        const impactRadius = effectRadius * (wallImpact ? 0.92 : 0.72);
        const shockRadius = impactRadius * (0.28 + progress * 0.78);
        const ux = Math.cos(angle);
        const uy = Math.sin(angle);
        const px = -uy;
        const py = ux;
        renderer.drawGfxCircle(cx, cy, shockRadius, skinPalette?.dark || "#180f2a", alpha * 0.05, tint, alpha * 0.46, Math.max(2, impactRadius * 0.025), z - 7, "add", 30);
        renderer.drawGfxArc(cx, cy, shockRadius * 0.86, angle - Math.PI * 0.72, angle + Math.PI * 0.72, Math.max(3, impactRadius * 0.045), core, alpha * 0.58, z - 3, "add", 18);
        renderer.drawGfxLine(cx - ux * impactRadius * 0.72, cy - uy * impactRadius * 0.72, cx + ux * impactRadius * 0.54, cy + uy * impactRadius * 0.54, Math.max(3, impactRadius * 0.075), core, alpha * 0.5, z + 1, "add");
        renderer.drawGfxStar(cx, cy, Math.max(16, impactRadius * (0.34 - progress * 0.12)), core, alpha * 0.76, z + 6, 8);
        for (let i = 0; i < 6; i += 1) {
          const side = i % 2 === 0 ? -1 : 1;
          const lane = Math.ceil((i + 1) / 2);
          const travel = impactRadius * (0.25 + progress * (0.38 + lane * 0.06));
          const sx = cx - ux * travel + px * side * impactRadius * (0.12 + lane * 0.08);
          const sy = cy - uy * travel + py * side * impactRadius * (0.12 + lane * 0.08);
          renderer.drawGfxDiamond(sx, sy, Math.max(3.5, impactRadius * 0.045), i % 2 ? tint : core, alpha * 0.42, z + 8 + i, angle + side * 0.55, tint);
        }
        return true;
      }
      if (s.includes("giant_star_orb_shockwave")) {
        const shockRadius = effectRadius * (0.16 + progress * 0.84);
        renderer.drawGfxCircle(cx, cy, shockRadius, skinPalette?.dark || "#180f2a", alpha * 0.018, tint, alpha * 0.32, Math.max(2, effectRadius * 0.012), z - 9, "add", 42);
        renderer.drawGfxCircle(cx, cy, shockRadius * 0.82, "#000000", 0, core, alpha * 0.12, 1.5, z - 8, "add", 36);
        renderer.drawGfxImpactBurst(cx, cy, Math.min(effectRadius * 0.34, 92), tint, alpha * 0.22, z + 2, angle, 8);
        return true;
      }
      if (blink) {
        const fromX = Number.isFinite(effect.fromX) ? effect.fromX : end.fromX;
        const fromY = Number.isFinite(effect.fromY) ? effect.fromY : end.fromY;
        const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
        const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
        const portalRadius = Math.max(26, effectRadius * 0.28);
        for (const portal of [
          { x: fromX, y: fromY, dir: -1, a: alpha * 0.48 },
          { x: toX, y: toY, dir: 1, a: alpha * 0.78 }
        ]) {
          renderer.drawGfxCircle(portal.x, portal.y, portalRadius * (portal.dir > 0 ? 1.08 : 0.86), "#071923", portal.a * 0.08, "#93c5fd", portal.a * 0.2, 2, z - 6 + portal.dir * 4, "add", 28);
          renderer.drawGfxArc(portal.x, portal.y, portalRadius, phase * portal.dir, phase * portal.dir + Math.PI * 1.35, 3, "#dbeafe", portal.a * 0.42, z + portal.dir * 4, "add", 16);
          renderer.drawGfxArc(portal.x, portal.y, portalRadius * 0.62, -phase * portal.dir, -phase * portal.dir + Math.PI * 0.95, 2, "#93c5fd", portal.a * 0.28, z + portal.dir * 4 + 1, "add", 12);
        }
        renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(2, portalRadius * 0.1), "#93c5fd", alpha * 0.11, z - 8, "add");
        for (let i = 0; i < 4; i += 1) {
          const a = phase * 0.45 + (Math.PI * 2 * i) / 4;
          renderer.drawGfxDiamond(toX + Math.cos(a) * portalRadius * 0.58, toY + Math.sin(a) * portalRadius * 0.48, 4.5, core, alpha * 0.28, z + 9 + i, a, tint);
        }
        return true;
      }
      const softHit = s.includes("arcane_splash") || (kind === "impact" && (s.includes("arcane_orb") || s.includes("star_orb") || s.includes("star_shard")));
      const hitAlpha = alpha * (softHit ? 0.44 : 1);
      const hitRadius = softHit ? starRadius * 0.76 : starRadius;
      renderer.drawGfxCircle(cx, cy, hitRadius * 0.94, skinPalette?.dark || "#180f2a", hitAlpha * 0.07, tint, hitAlpha * 0.2, 2, z - 8, "add", 34);
      renderer.drawGfxCircle(cx, cy, hitRadius * 0.54, "#000000", 0, core, hitAlpha * 0.16, 1.4, z - 7, "add", 24);
      renderer.drawGfxRuneRing(cx, cy, hitRadius * 0.9, tint, hitAlpha * 0.28, z - 5, phase * 0.22, burst ? 8 : 6);
      if (skinPalette) drawMageSkinGlyph(renderer, skinPalette, cx, cy, Math.max(softHit ? 13 : 20, hitRadius * 0.62), hitAlpha * 0.82, z + 2, phase * 0.2);
      else renderer.drawGfxStar(cx, cy, Math.max(softHit ? 13 : 20, hitRadius * 0.62), core, hitAlpha * 0.62, z + 2, burst ? 8 : 6);
      const orbitCount = burst ? 8 : 6;
      for (let i = 0; i < orbitCount; i += 1) {
        const a = phase * (burst ? 0.16 : 0.1) + (Math.PI * 2 * i) / orbitCount;
        const inner = hitRadius * 0.26;
        const outer = hitRadius * (0.78 + (i % 2) * 0.06);
        renderer.drawGfxLine(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, i % 2 ? 2.4 : 3.4, tint, hitAlpha * 0.24, z + 7 + i, "add");
        if (i % 2 === 0) renderer.drawGfxDiamond(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, softHit ? 3.5 + (i % 2) : 4.5 + (i % 3), core, hitAlpha * 0.26, z + 18 + i, a, tint);
      }
      if (split) {
        for (let i = 0; i < 3; i += 1) {
          const a = -Math.PI / 2 + (Math.PI * 2 * i) / 3 + phase * 0.08;
          const x = cx + Math.cos(a) * starRadius * 0.62;
          const y = cy + Math.sin(a) * starRadius * 0.62;
          renderer.drawGfxStar(x, y, Math.max(8, starRadius * 0.18), "#dbeafe", alpha * 0.34, z + 32 + i, 5);
        }
      }
      renderer.drawGfxImpactBurst(cx, cy, hitRadius * (burst ? 0.72 : 0.5), tint, hitAlpha * (burst ? 0.2 : 0.13), z + 20, phase * 0.2, burst ? 8 : 6);
      return true;
    }

    return false;
  }

  function renderCrispEngineerEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, effectRadius, end, z, styleInfo } = context;
    if (!((styleInfo && (styleInfo.engineer || styleInfo.basicTechBolt)) || s.includes("engineer") || s.includes("mecha_bolt") || s.includes("turret") || s.includes("drone") || s.includes("shock_mine") || s.includes("mini_turret"))) return false;
    if (s.includes("drone_bolt")) {
      return renderEngineerDroneBoltEffect(renderer, context);
    }
    if (s.includes("single_laser")) {
      const beamWidth = Math.max(3, Number(effect.width || 4.5));
      const tint = effect.color || "#67e8f9";
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 5, "#06131f", alpha * 0.24, z - 5, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, tint, alpha * 0.78, z - 2, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(1.5, beamWidth * 0.3), "#f8fafc", alpha * 0.86, z + 1, "add");
      renderer.drawGfxCircle(end.toX, end.toY, beamWidth * (2.1 + peak * 0.5), tint, alpha * 0.16, "#f8fafc", alpha * 0.3, 2, z + 4, "add", 10);
      return true;
    }
    if ((styleInfo && styleInfo.mechaMuzzle) || s.includes("mecha_hand_laser") || s.includes("mecha_giant_laser") || s.includes("engineer_laser_module_beam") || s.includes("turret_laser") || s.includes("drone_laser")) {
      const giant = s.includes("mecha_giant_laser") || s.includes("engineer_laser_module_beam");
      const handLaser = s.includes("mecha_hand_laser");
      const continuousLaser = s.includes("adaptive_continuous_laser");
      const transmittedHitRadius = Number(effect.hitRadius);
      const adaptiveHitWidth = Number.isFinite(transmittedHitRadius) && transmittedHitRadius > 0
        ? transmittedHitRadius * 2
        : Math.max(2, Number(effect.width) || 16);
      const beamWidth = giant
        ? Math.max(44, Number(effect.width || 56))
        : handLaser
          ? continuousLaser ? adaptiveHitWidth : Math.max(13, Number(effect.width || 16))
          : s.includes("turret") ? 12 : 8;
      const tint = giant ? (effect.color || "#c084fc") : s.includes("turret") && !handLaser ? "#fde68a" : "#67e8f9";
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, continuousLaser ? beamWidth : beamWidth + 8, "#08111f", alpha * 0.34, z - 8, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, continuousLaser ? Math.max(2, beamWidth - 2) : beamWidth, tint, alpha * 0.74, z - 4, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(3, beamWidth * 0.34), "#f8fafc", alpha * 0.8, z - 1, "add");
      if (!continuousLaser) {
        for (let i = 1; i <= 4; i += 1) {
          const t = i / 5;
          const x = end.fromX + (end.toX - end.fromX) * t;
          const y = end.fromY + (end.toY - end.fromY) * t;
          renderer.drawGfxCircle(x, y, 4 + (i % 2) * 2 + peak * 2, tint, alpha * 0.24, "#f8fafc", alpha * 0.12, 1, z + i, "add", 8);
        }
        renderer.drawGfxImpactBurst(end.toX, end.toY, beamWidth * (2.1 + peak * 0.4), tint, alpha * 0.26, z + 8, progress * 2.4, 7);
      }
    } else if (s.includes("engineer_laser_module_core") || s.includes("mecha_laser_core")) {
      const coreRadius = Math.max(48, effectRadius * 0.58);
      renderer.drawGfxCircle(effect.x, effect.y, coreRadius * (0.72 + peak * 0.16), "#170728", alpha * 0.22, "#c084fc", alpha * 0.58, 4, z - 2, "add", 28);
      renderer.drawGfxCircle(effect.x, effect.y, coreRadius * (0.28 + peak * 0.08), "#c084fc", alpha * 0.36, "#f5d0fe", alpha * 0.72, 3, z + 8, "add", 16);
      renderer.drawGfxImpactBurst(effect.x, effect.y, coreRadius * (0.82 + peak * 0.18), "#c084fc", alpha * 0.38, z + 12, progress * 2.8, 10);
    } else if (s.includes("missile_explosion") || s.includes("kamikaze_explosion")) {
      const big = s.includes("kamikaze");
      const r = effectRadius * (big ? 1.05 : 0.9);
      renderExplosionRangeBoundary(renderer, context, {
        edge: "#fb923c",
        hot: "#fff7ed",
        dark: "#7c2d12"
      });
      renderer.drawGfxCircle(effect.x, effect.y, r * (0.55 + peak * 0.18), "#7c2d12", alpha * 0.18, "#fb923c", alpha * 0.48, 5, z - 8, "add", 28);
      renderer.drawGfxImpactBurst(effect.x, effect.y, r * (0.5 + peak * 0.16), "#fde68a", alpha * 0.42, z + 3, progress * 3.4, big ? 15 : 11);
      for (let i = 0; i < (big ? 14 : 10); i += 1) {
        const a = (Math.PI * 2 * i) / (big ? 14 : 10) + progress * 0.18;
        const inner = r * (0.1 + (i % 3) * 0.05);
        const outer = r * (0.42 + (i % 4) * 0.08 + peak * 0.06);
        renderer.drawGfxLine(
          effect.x + Math.cos(a) * inner,
          effect.y + Math.sin(a) * inner,
          effect.x + Math.cos(a) * outer,
          effect.y + Math.sin(a) * outer,
          i % 2 ? 4 : 6,
          i % 3 ? "#fb923c" : "#fde68a",
          alpha * (0.32 - i * 0.008),
          z + i,
          "add"
        );
      }
      renderer.renderParticlePreset?.("fireBurst", {
        x: effect.x,
        y: effect.y,
        radius: r * 0.72,
        color: "#fde68a",
        alpha: alpha * 0.48,
        zIndex: z + 24,
        phase: progress * 2.8,
        count: big ? 14 : 10
      }) || renderer.drawGfxSparkSpray(effect.x, effect.y, r * 0.62, "#fde68a", alpha * 0.26, z + 24, big ? 14 : 10, progress * 2.8);
    } else if (s.includes("missile_launch")) {
      renderer.drawGfxLine(end.fromX, end.fromY, effect.x + Math.cos(angle) * 28, effect.y + Math.sin(angle) * 28, 8, "#fb923c", alpha * 0.32, z - 5, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, effect.x + Math.cos(angle) * 18, effect.y + Math.sin(angle) * 18, 4, "#fde68a", alpha * 0.46, z - 3, "add");
      renderer.drawGfxImpactBurst(effect.x, effect.y, 24 + peak * 8, "#fb923c", alpha * 0.2, z + 2, progress * 2, 6);
    } else if (styleInfo ? styleInfo.basicTechBolt : s.includes("engineer_bolt") || s.includes("mecha_bolt")) {
      const boltTint = s.includes("mecha") ? "#67e8f9" : "#d6b76d";
      const core = "#f8fafc";
      const width = Math.max(5, effectRadius * 0.07);
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width + 7, "#06131f", alpha * 0.3, z - 2, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width, boltTint, alpha * 0.72, z + 1, "add");
      renderer.drawGfxLine(end.fromX + Math.cos(angle) * 12, end.fromY + Math.sin(angle) * 12, end.toX, end.toY, Math.max(2, width * 0.32), core, alpha * 0.68, z + 4, "add");
      renderer.drawGfxCircle(end.toX, end.toY, 12 + peak * 6, boltTint, alpha * 0.14, core, alpha * 0.34, 2, z + 8, "add", 12);
      renderer.renderParticlePreset?.("hitSpark", {
        x: end.toX,
        y: end.toY,
        radius: 34 + peak * 8,
        color: boltTint,
        alpha: alpha * 0.26,
        zIndex: z + 14,
        count: 6,
        phase: progress * 3.6,
        direction: angle,
        spread: Math.PI * 0.72
      }) || renderer.drawGfxSparkSpray(end.toX, end.toY, 34 + peak * 8, boltTint, alpha * 0.22, z + 14, 7, progress * 3.6, angle, Math.PI * 0.72);
    } else if (s.includes("shock_mine")) {
      const mineRadius = effectRadius;
      renderer.drawGfxArc(effect.x, effect.y, mineRadius * 0.9, -Math.PI * 0.9, -Math.PI * 0.08, 4, "#9ee6ff", alpha * 0.3, z - 9, "add", 12);
      renderer.drawGfxArc(effect.x, effect.y, mineRadius * 0.9, Math.PI * 0.08, Math.PI * 0.9, 4, "#9ee6ff", alpha * 0.3, z - 9, "add", 12);
      renderer.drawGfxGear(effect.x, effect.y, mineRadius * 0.42, "#9ee6ff", alpha * 0.46, z - 4, progress * 2.8, 12);
      renderer.drawGfxGear(effect.x, effect.y, mineRadius * 0.25, "#dbeafe", alpha * 0.28, z - 3, -progress * 3.2, 8);
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + progress * 1.2;
        renderer.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * mineRadius * 0.72, effect.y + Math.sin(a) * mineRadius * 0.72, "#67e8f9", alpha * 0.42, z + i, 4, 4, 11, progress + i * 0.19);
      }
      renderer.drawGfxLine(effect.x - mineRadius * 0.26, effect.y + 12, effect.x + mineRadius * 0.26, effect.y + 12, 8, "#2b2118", alpha * 0.7, z + 7, "normal");
      renderer.drawGfxCircle(effect.x, effect.y, 16 + peak * 6, "#dbeafe", alpha * 0.32, "#9ee6ff", alpha * 0.34, 2, z + 9, "add", 12);
    } else if (s.includes("turret") || s.includes("device_throw")) {
      const device = String(effect.device || "");
      const mineLike = device.includes("mine");
      const chargedMine = device.includes("charged");
      const deviceTint = mineLike ? (chargedMine ? "#a78bfa" : "#67e8f9") : "#d6b76d";
      const deviceDark = mineLike ? "#06121f" : "#4b3b22";
      const throwLike = s.includes("throw");
      const deploy = Math.min(1, throwLike ? progress * 1.25 : 1);
      const arcLift = throwLike ? Math.sin(deploy * Math.PI) * 42 : 0;
      const deviceX = throwLike ? end.fromX + (end.toX - end.fromX) * deploy : effect.x;
      const deviceY = throwLike ? end.fromY + (end.toY - end.fromY) * deploy - arcLift : effect.y;
      if (throwLike) {
        renderer.drawGfxLine(end.fromX, end.fromY, deviceX, deviceY, 6, deviceTint, alpha * 0.22, z - 10, "add");
        renderer.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, deviceTint, alpha * 0.28, z - 12, 3);
      }
      renderer.drawGfxGear(deviceX, deviceY, 30 + peak * 5, deviceTint, alpha * 0.46, z - 1, progress * 2.2, 10);
      renderer.drawGfxLine(deviceX - 20, deviceY + 13, deviceX + 20, deviceY + 13, 8, deviceDark, alpha * 0.74, z + 2, "normal");
      renderer.drawGfxLine(deviceX - 4, deviceY + 10, deviceX + Math.cos(angle) * 34, deviceY + Math.sin(angle) * 21, 9, deviceTint, alpha * 0.82, z + 3, "normal");
      renderer.drawGfxLine(deviceX - 16, deviceY + 20, deviceX - 28, deviceY + 32, 5, deviceDark, alpha * 0.66, z + 2, "normal");
      renderer.drawGfxLine(deviceX + 16, deviceY + 20, deviceX + 28, deviceY + 32, 5, deviceDark, alpha * 0.66, z + 2, "normal");
      renderer.drawGfxCircle(deviceX, deviceY, 9, "#9ee6ff", alpha * 0.32, "#dbeafe", alpha * 0.26, 2, z + 4, "add", 10);
      renderer.renderParticlePreset?.("hitSpark", {
        x: deviceX + Math.cos(angle) * 30,
        y: deviceY + Math.sin(angle) * 20,
        radius: 28,
        color: "#9ee6ff",
        alpha: alpha * 0.36,
        zIndex: z + 8,
        phase: progress * 3.4,
        count: 7,
        direction: angle,
        spread: Math.PI * 0.9
      }) || renderer.drawGfxSparkSpray(deviceX + Math.cos(angle) * 30, deviceY + Math.sin(angle) * 20, 28, "#9ee6ff", alpha * 0.28, z + 8, 7, progress * 3.4, angle, Math.PI * 0.9);
      if (throwLike && deploy > 0.72) {
        const land = (deploy - 0.72) / 0.28;
        renderer.drawGfxImpactBurst(end.toX, end.toY, 28 + land * 12, "#d6b76d", alpha * land * 0.18, z + 10, progress * 2, 6);
      }
    } else if (s.includes("drone")) {
      renderer.drawGfxCircle(effect.x, effect.y - 12, 24 + peak * 5, "#9ee6ff", alpha * 0.06, "#9ee6ff", alpha * 0.22, 2, z - 1, "add", 20);
      renderer.drawGfxGear(effect.x, effect.y - 12, 28 + peak * 3, "#9ee6ff", alpha * 0.24, z - 2, -progress * 3.4, 8);
      for (let i = 0; i < 4; i += 1) {
        const a = Math.PI / 4 + (Math.PI * 2 * i) / 4 + progress * 1.6;
        renderer.drawGfxLine(effect.x + Math.cos(a) * 8, effect.y - 12 + Math.sin(a) * 8, effect.x + Math.cos(a) * 28, effect.y - 12 + Math.sin(a) * 28, 5, "#d6b76d", alpha * 0.72, z + i, "add");
        renderer.drawGfxArc(effect.x, effect.y - 12, 22 + (i % 2) * 5, a - 0.2, a + 0.2, 3, "#9ee6ff", alpha * 0.24, z + 4 + i, "add", 4);
      }
      renderer.drawGfxLine(effect.x - 18, effect.y + 18, effect.x + 18, effect.y + 18, 5, "#4b3b22", alpha * 0.5, z + 1, "normal");
    } else {
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#67e8f9", alpha * 0.78, z, 7, 7, 17, progress * 1.5);
    }
    return true;
  }

  function renderCrispPrimaryClassStyledEffect(renderer, context) {
    if (!context) return false;
    return (
      renderCrispRangerEffect(renderer, context) ||
      renderCrispMageEffect(renderer, context) ||
      renderCrispEngineerEffect(renderer, context)
    );
  }

  function renderCrispAlchemistEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, effectRadius, peak, end, z } = context;
    if (!(s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("fire_tick"))) return false;
    const mode = String(effect.mode || effect.flask || effect.damageType || "").toLowerCase();
    const hasThrowPath = Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY) && Number.isFinite(effect.toX) && Number.isFinite(effect.toY);
    const bomb = mode.includes("bomb") || s.includes("bomb");
    const fire = mode.includes("fire") || s.includes("fire") || s.includes("reaction");
    const heal = s.includes("elixir");
    const acid = !fire && !heal && !bomb;
    const tint = heal ? "#bbf7d0" : bomb ? "#fbbf24" : fire ? "#fb923c" : "#bef264";
    const throwLike = s.includes("throw") || s.includes("bottle") || (bomb && hasThrowPath);
    if (throwLike) {
      const fly = Math.min(1, progress * 1.18);
      const arcLift = Math.sin(fly * Math.PI) * Math.min(58, Math.max(30, effectRadius * 0.3));
      const fx = end.fromX + (end.toX - end.fromX) * fly;
      const fy = end.fromY + (end.toY - end.fromY) * fly - arcLift;
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 3, tint, alpha * 0.16, z - 12, "add");
      for (let i = 0; i < 4; i += 1) {
        const t = Math.max(0, fly - i * 0.11);
        const lift = Math.sin(t * Math.PI) * Math.min(58, Math.max(30, effectRadius * 0.3));
        const tx = end.fromX + (end.toX - end.fromX) * t;
        const ty = end.fromY + (end.toY - end.fromY) * t - lift;
        renderer.drawGfxCircle(tx, ty, 7 - i, tint, alpha * (0.22 - i * 0.035), "#fff7ed", alpha * (0.08 - i * 0.012), 1, z - 8 + i, "add", 8);
      }
      renderer.renderParticlePreset?.(fire ? "fireBurst" : acid ? "poisonBurst" : "hitSpark", {
        x: fx - Math.cos(angle) * 10,
        y: fy - Math.sin(angle) * 10,
        radius: 28,
        color: tint,
        alpha: alpha * 0.24,
        zIndex: z - 3,
        phase: progress * 2,
        count: 5,
        direction: angle + Math.PI,
        spread: Math.PI * 0.8
      }) || renderer.drawGfxSparkSpray(fx - Math.cos(angle) * 10, fy - Math.sin(angle) * 10, 28, tint, alpha * 0.18, z - 3, 5, progress * 2, angle + Math.PI, Math.PI * 0.8);
      renderer.drawGfxFlask(fx, fy, angle + progress * 4.6, tint, alpha * 0.9, z + 4, bomb ? 1.08 : 0.96);
      if (fly > 0.72) {
        const hit = (fly - 0.72) / 0.28;
        renderer.drawGfxImpactBurst(end.toX, end.toY, effectRadius * (0.26 + hit * 0.2), tint, alpha * hit * 0.28, z + 8, progress * 3, bomb ? 12 : 8);
      }
    }
    if (heal) {
      renderer.drawGfxCircle(effect.x, effect.y, effectRadius * 0.7, "#bbf7d0", alpha * 0.06, "#86efac", alpha * 0.18, 2, z - 3, "add", 28);
      renderer.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.46, "#bbf7d0", alpha * 0.32, z + 1, progress * 1.8, 8);
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + progress * 0.7;
        const r = effectRadius * (0.2 + (i % 3) * 0.08);
        const x = effect.x + Math.cos(a) * r;
        const y = effect.y + Math.sin(a) * r * 0.56;
        renderer.drawGfxCircle(x, y - peak * 12, 6 + (i % 2) * 2, "#bbf7d0", alpha * 0.2, "#f0fdf4", alpha * 0.16, 1, z + i, "add", 8);
        renderer.drawGfxLine(x, y + 14, x, y - 16 - peak * 14, 2.5, "#bbf7d0", alpha * 0.16, z + 10 + i, "add");
      }
      renderer.drawGfxLine(effect.x - 24, effect.y, effect.x + 24, effect.y, 7, "#f0fdf4", alpha * 0.58, z + 24, "add");
      renderer.drawGfxLine(effect.x, effect.y - 24, effect.x, effect.y + 24, 7, "#f0fdf4", alpha * 0.58, z + 25, "add");
      renderer.renderParticlePreset?.("healMist", {
        x: effect.x,
        y: effect.y,
        radius: effectRadius * 0.62,
        color: "#bbf7d0",
        alpha: alpha * 0.62,
        zIndex: z + 18,
        phase: progress * 1.6,
        count: 8
      });
    } else if (!throwLike || s.includes("reaction") || s.includes("tick")) {
      if (bomb && !fire) {
        renderer.drawGfxRuneRing(effect.x, effect.y, effectRadius * 0.56, tint, alpha * 0.26, z - 2, progress * 2.6, 10);
        renderer.drawGfxImpactBurst(effect.x, effect.y, effectRadius * (0.42 + peak * 0.08), tint, alpha * 0.3, z + 3, progress * 2, 12);
        renderer.renderParticlePreset?.("hitSpark", {
          x: effect.x,
          y: effect.y,
          radius: effectRadius * 0.52,
          color: "#fff7ed",
          alpha: alpha * 0.34,
          zIndex: z + 9,
          phase: progress * 2.4,
          count: 10
        }) || renderer.drawGfxSparkSpray(effect.x, effect.y, effectRadius * 0.52, "#fff7ed", alpha * 0.22, z + 9, 10, progress * 2.4);
        return true;
      }
      renderer.drawGfxCircle(effect.x, effect.y, effectRadius * (fire ? 0.72 : 0.64), tint, alpha * (fire ? 0.11 : 0.09), tint, alpha * 0.2, 2, z - 3, "add", 28);
      renderer.drawGfxSwirl(effect.x, effect.y, effectRadius * (fire ? 0.5 : 0.44), tint, alpha * 0.18, z - 1, progress * (fire ? 2.4 : 1.3), fire ? 5 : 3);
      if (fire) {
        for (let i = 0; i < 10; i += 1) {
          const a = (Math.PI * 2 * i) / 10 + progress * 0.35;
          const r = effectRadius * (0.22 + (i % 4) * 0.075);
          const x = effect.x + Math.cos(a) * r;
          const y = effect.y + Math.sin(a) * r * 0.58;
          const flame = 12 + peak * 12 + (i % 3) * 3;
          renderer.drawGfxPath([{ x, y: y - flame }, { x: x + 9, y: y + 10 }, { x: x - 9, y: y + 10 }], i % 2 ? "#fb923c" : "#fde68a", alpha * 0.4, "#ef4444", alpha * 0.16, 1, z + i, "add");
        }
        renderer.renderParticlePreset?.("fireBurst", {
          x: effect.x,
          y: effect.y,
          radius: effectRadius * 0.44,
          color: "#fde68a",
          alpha: alpha * 0.42,
          zIndex: z + 16,
          phase: progress * 3,
          count: 9
        }) || renderer.drawGfxSparkSpray(effect.x, effect.y, effectRadius * 0.44, "#fde68a", alpha * 0.2, z + 16, 9, progress * 3);
      } else if (acid) {
        for (let i = 0; i < 9; i += 1) {
          const a = (Math.PI * 2 * i) / 9 + progress * 0.25;
          const r = effectRadius * (0.18 + (i % 4) * 0.085);
          const x = effect.x + Math.cos(a) * r;
          const y = effect.y + Math.sin(a) * r * 0.68;
          renderer.drawGfxCircle(x, y, 7 + (i % 3) * 3 + peak * 2, "#bef264", alpha * 0.22, "#ecfccb", alpha * 0.16, 1, z + i, "add", 8);
          if (i % 2 === 0) renderer.drawGfxLine(x - 8, y + 8, x + 10, y + 16, 2.5, "#d9f99d", alpha * 0.18, z + 12 + i, "add");
        }
        renderer.renderParticlePreset?.("poisonBurst", {
          x: effect.x,
          y: effect.y,
          radius: effectRadius * 0.36,
          color: "#ecfccb",
          alpha: alpha * 0.36,
          zIndex: z + 18,
          phase: progress * 1.8,
          count: 7
        }) || renderer.drawGfxSparkSpray(effect.x, effect.y, effectRadius * 0.36, "#ecfccb", alpha * 0.18, z + 18, 7, progress * 1.8);
      }
    }
    return true;
  }

  function renderCrispPuppetEffect(renderer, context) {
    const { effect, progress, alpha, s, effectRadius, peak, end, z } = context;
    if (!(s.includes("puppet") || s.includes("thread"))) return false;
    const tint = "#f5d0fe";
    const wireWidth = s.includes("cage") || s.includes("theater") ? 5 : 3;
    renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.42, z - 2, wireWidth, 6, 10, progress);
    renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#b985c8", alpha * 0.18, z - 5, 2, 4, 16, progress + 0.45);
    renderer.drawGfxRuneRing(effect.x, effect.y, Math.max(28, effectRadius * 0.34), "#b985c8", alpha * 0.2, z - 3, progress * 2.2, 7);
    if (s.includes("cage") || s.includes("theater")) {
      const cageRadius = effectRadius * 0.78;
      renderer.drawGfxRuneRing(effect.x, effect.y, cageRadius * 0.92, tint, alpha * 0.22, z - 2, -progress * 1.2, 12);
      renderer.drawGfxLine(effect.x, effect.y, end.fromX, end.fromY, 4, tint, alpha * 0.34, z + 1, "add");
      renderer.drawGfxLine(effect.x, effect.y, end.toX, end.toY, 4, tint, alpha * 0.34, z + 1, "add");
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8;
        const x = effect.x + Math.cos(a) * cageRadius;
        const y = effect.y + Math.sin(a) * cageRadius;
        renderer.drawGfxLine(x, y - 24, x, y + 24, 2, tint, alpha * 0.28, z + i, "add");
      }
    }
    if (s.includes("swap")) {
      const swapRadius = Math.max(36, effectRadius * 0.32);
      renderer.drawGfxRuneRing(end.fromX, end.fromY, swapRadius, tint, alpha * 0.28, z + 1, progress * 2.6, 8);
      renderer.drawGfxRuneRing(end.toX, end.toY, swapRadius, tint, alpha * 0.28, z + 1, -progress * 2.6, 8);
      renderer.renderParticlePreset?.("smokePuff", {
        x: end.fromX,
        y: end.fromY,
        radius: swapRadius * 0.9,
        color: tint,
        alpha: alpha * 0.28,
        zIndex: z + 8,
        phase: progress * 2.2,
        count: 7
      }) || renderer.drawGfxSparkSpray(end.fromX, end.fromY, swapRadius * 0.9, tint, alpha * 0.22, z + 8, 7, progress * 2.2);
      renderer.renderParticlePreset?.("smokePuff", {
        x: end.toX,
        y: end.toY,
        radius: swapRadius * 0.9,
        color: tint,
        alpha: alpha * 0.28,
        zIndex: z + 8,
        phase: progress * 2.2 + 1,
        count: 7
      }) || renderer.drawGfxSparkSpray(end.toX, end.toY, swapRadius * 0.9, tint, alpha * 0.22, z + 8, 7, progress * 2.2 + 1);
    }
    if (s.includes("summon") || s.includes("ambush") || s.includes("lunge")) {
      const puppetX = end.toX;
      const puppetY = end.toY;
      const materialize = Math.min(1, progress * 1.7);
      renderer.drawGfxSwirl(puppetX, puppetY, 36 + peak * 8, tint, alpha * 0.18, z + 1, progress * 2.4, 3);
      for (let i = -2; i <= 2; i += 1) {
        const side = i * 8;
        renderer.drawGfxLine(end.fromX + side, end.fromY - 18, puppetX + side * 0.28, puppetY - 18 + materialize * 12, 2.5, tint, alpha * (0.18 + materialize * 0.18), z + 2 + i, "add");
      }
      renderer.drawGfxLine(puppetX - 22, puppetY + 18, puppetX + 22, puppetY + 18, 8, "#44254f", alpha * 0.72 * materialize, z + 2, "normal");
      renderer.drawGfxLine(puppetX, puppetY - 4, puppetX, puppetY + 24, 7, "#b985c8", alpha * 0.58 * materialize, z + 3, "normal");
      renderer.drawGfxLine(puppetX - 19, puppetY + 2, puppetX + 19, puppetY + 2, 5, tint, alpha * 0.38 * materialize, z + 4, "add");
      renderer.drawGfxCircle(puppetX, puppetY - 14, 12 + peak * 2, "#b985c8", alpha * 0.58 * materialize, tint, alpha * 0.36 * materialize, 2, z + 5, "normal", 10);
      if (s.includes("ambush") || s.includes("lunge")) {
        renderer.drawGfxArc(puppetX, puppetY, effectRadius * 0.32, -0.9, 0.9, 6, tint, alpha * 0.42, z + 7, "add", 10);
        renderer.renderParticlePreset?.("smokePuff", {
          x: puppetX,
          y: puppetY,
          radius: effectRadius * 0.3,
          color: tint,
          alpha: alpha * 0.32,
          zIndex: z + 9,
          phase: progress * 2.8,
          count: 8
        }) || renderer.drawGfxSparkSpray(puppetX, puppetY, effectRadius * 0.3, tint, alpha * 0.24, z + 9, 8, progress * 2.8);
      }
    }
    return true;
  }

  function renderCrispMartialEffect(renderer, context) {
    const { effect, progress, alpha, radius, s, angle, effectRadius, peak, end, z } = context;
    if (!s.includes("martial")) return false;
    const tint = "#fde68a";
    if (s.includes("palm")) {
      const laneWidth = Math.max(38, radius * 0.42);
      renderer.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, laneWidth, tint, alpha * 0.34, z - 5);
      for (let i = 0; i < 3; i += 1) {
        const push = i * 28 + progress * 18;
        const cx = effect.x + Math.cos(angle) * (42 + push);
        const cy = effect.y + Math.sin(angle) * (42 + push);
        renderer.drawGfxArc(cx, cy, laneWidth * (0.64 + i * 0.12), angle - 0.8, angle + 0.8, 7 - i, tint, alpha * (0.42 - i * 0.09), z + i, "add", 12);
      }
      renderer.drawGfxLine(effect.x - Math.cos(angle) * 8, effect.y - Math.sin(angle) * 8, end.toX, end.toY, 10, "#f8f3e9", alpha * 0.2, z + 5, "add");
      renderer.drawGfxImpactBurst(end.toX, end.toY, laneWidth * (0.78 + peak * 0.16), tint, alpha * 0.28, z + 8, progress * 3, 9);
    } else if (s.includes("rising")) {
      const lift = 26 + peak * 24;
      renderer.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, 34, tint, alpha * 0.42, z - 4);
      for (let i = 0; i < 4; i += 1) {
        const t = i / 3;
        const x = end.fromX + (end.toX - end.fromX) * t;
        const y = end.fromY + (end.toY - end.fromY) * t - lift * t;
        renderer.drawGfxLine(x - Math.cos(angle) * 8, y + 20, x + Math.cos(angle) * 24, y - 22, i === 3 ? 9 : 5, i === 3 ? "#f8f3e9" : tint, alpha * (0.22 + t * 0.22), z + i, "add");
        renderer.drawGfxArc(x, y, 20 + t * 18, angle - 0.95, angle + 0.28, 5, tint, alpha * (0.18 + t * 0.16), z + 4 + i, "add", 8);
      }
      renderer.drawGfxImpactBurst(end.toX, end.toY - lift * 0.42, 58 + peak * 12, tint, alpha * 0.32, z + 10, progress, 10);
    } else if (s.includes("focus")) {
      for (let i = 0; i < 10; i += 1) {
        const a = (Math.PI * 2 * i) / 10 + progress * 0.45;
        renderer.drawGfxArc(effect.x, effect.y, effectRadius * (0.42 + (i % 3) * 0.11), a - 0.16, a + 0.16, i % 2 ? 4 : 6, tint, alpha * 0.26, z + i, "add", 4);
        renderer.drawGfxLine(effect.x + Math.cos(a) * 28, effect.y + Math.sin(a) * 28, effect.x + Math.cos(a) * effectRadius * 0.86, effect.y + Math.sin(a) * effectRadius * 0.86, i % 2 ? 3 : 5, tint, alpha * 0.24, z + 12 + i, "add");
      }
      renderer.drawGfxStar(effect.x, effect.y, 30 + peak * 9, "#f8f3e9", alpha * 0.42, z + 24, 6);
    } else if (s.includes("combo") || s.includes("flurry")) {
      const count = s.includes("finisher") ? 5 : 3;
      const spread = s.includes("flurry") ? 0.82 : 0.5;
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const a = angle + t * spread;
        const len = radius * (0.48 + (i % 2) * 0.12);
        const sx = effect.x + Math.cos(a) * 12;
        const sy = effect.y + Math.sin(a) * 12;
        const tx = effect.x + Math.cos(a) * len;
        const ty = effect.y + Math.sin(a) * len;
        renderer.drawGfxLine(sx, sy, tx, ty, i === Math.floor(count / 2) ? 9 : 6, i === Math.floor(count / 2) ? "#f8f3e9" : tint, alpha * (0.34 + i * 0.04), z + i, "add");
        renderer.drawGfxCircle(tx, ty, 10 + peak * 4, tint, alpha * 0.18, "#f8f3e9", alpha * 0.28, 2, z + 8 + i, "add", 10);
      }
      if (s.includes("finisher")) renderer.drawGfxImpactBurst(effect.x + Math.cos(angle) * radius * 0.62, effect.y + Math.sin(angle) * radius * 0.62, 44 + peak * 8, tint, alpha * 0.28, z + 18, progress, 9);
    }
    return s.includes("palm") || s.includes("rising") || s.includes("focus") || s.includes("combo") || s.includes("flurry");
  }

  function renderCrispAssassinEffect(renderer, context) {
    const { effect, progress, alpha, s, kind, angle, radius, effectRadius, peak, end, z } = context;
    if (!(s.includes("assassin") || s.includes("shadow") || s.includes("smoke_bomb") || s.includes("stalker"))) return false;
    const tint = "#c4b5fd";
    const dark = "#21142f";
    const slashLike = s.includes("fan") || s.includes("slash") || s.includes("blade") || s.includes("cut");
    if (s.includes("smoke")) {
      renderer.drawGfxCircle(effect.x, effect.y, effectRadius * 0.86, dark, alpha * 0.2, tint, alpha * 0.12, 2, z - 6, "add", 32);
      renderer.drawGfxSwirl(effect.x, effect.y, effectRadius * 0.74, tint, alpha * 0.18, z - 4, progress * 2.8, 5);
      for (let i = 0; i < 7; i += 1) {
        const a = (Math.PI * 2 * i) / 7 + progress * 0.9;
        const x = effect.x + Math.cos(a) * effectRadius * (0.26 + (i % 3) * 0.06);
        const y = effect.y + Math.sin(a) * effectRadius * 0.22;
        renderer.drawGfxCircle(x, y, 16 + peak * 7, "#35204c", alpha * 0.13, tint, alpha * 0.08, 1, z + i, "add", 12);
      }
      for (let i = 0; i < 3; i += 1) {
        const a = angle + (i - 1) * 1.2 + progress * 0.2;
        const x = effect.x + Math.cos(a) * effectRadius * 0.32;
        const y = effect.y + Math.sin(a) * effectRadius * 0.18;
        renderer.drawGfxLine(x, y - 18, x, y + 16, 7, "#2d1a40", alpha * 0.5, z + 18 + i, "normal");
        renderer.drawGfxCircle(x, y - 26, 8, "#2d1a40", alpha * 0.48, tint, alpha * 0.16, 1, z + 20 + i, "normal", 8);
        renderer.drawGfxArc(x + Math.cos(a) * 12, y, 28, a - 0.65, a + 0.28, 4, tint, alpha * 0.32, z + 26 + i, "add", 8);
      }
    } else if (s.includes("lunge") || kind === "dash") {
      const lane = Math.max(34, Math.min(62, effectRadius * 0.35));
      const midX = (end.fromX + end.toX) * 0.5;
      const midY = (end.fromY + end.toY) * 0.5;
      renderer.drawGfxCircle(midX, midY, lane * 0.62, dark, alpha * 0.12, tint, alpha * 0.09, 1, z - 10, "add", 14);
      renderer.renderParticlePreset?.("smokePuff", {
        x: midX,
        y: midY,
        radius: lane * 1.2,
        color: tint,
        alpha: alpha * 0.16,
        zIndex: z - 4,
        count: 7,
        phase: progress * 2
      });
      renderer.drawGfxArc(end.toX, end.toY, 42 + peak * 8, angle - 1.05, angle + 0.34, 8, tint, alpha * 0.7, z + 8, "add", 10);
      renderer.drawGfxImpactBurst(end.toX, end.toY, 48 + peak * 10, tint, alpha * 0.3, z + 14, progress * 2.4, 9);
    } else if (s.includes("mark_chain")) {
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.54, z - 1, 4, 5, 10, progress);
      renderer.drawGfxStar(end.fromX, end.fromY, 18 + peak * 4, tint, alpha * 0.34, z + 4, 4);
      renderer.drawGfxStar(end.toX, end.toY, 22 + peak * 5, tint, alpha * 0.46, z + 5, 4);
    } else if (s.includes("mark") || s.includes("shuriken") || s.includes("echo")) {
      const shuriken = s.includes("shuriken") || s.includes("echo");
      renderer.drawGfxStar(effect.x, effect.y, shuriken ? 24 + peak * 5 : 34 + peak * 7, tint, alpha * 0.56, z + 2, shuriken ? 6 : 4);
      renderer.drawGfxRuneRing(effect.x, effect.y, shuriken ? 34 + peak * 4 : 48 + peak * 5, tint, alpha * 0.24, z, progress * 3.4, shuriken ? 6 : 8);
      if (shuriken) {
        for (let i = 0; i < 3; i += 1) {
          const a = angle + (i - 1) * 0.32;
          const sx = effect.x - Math.cos(a) * 46;
          const sy = effect.y - Math.sin(a) * 46;
          const tx = effect.x + Math.cos(a) * 26;
          const ty = effect.y + Math.sin(a) * 26;
          renderer.drawGfxLine(sx, sy, tx, ty, 4, tint, alpha * 0.28, z - 4 + i, "add");
          renderer.drawGfxStar(tx, ty, 11, "#f5d0fe", alpha * 0.36, z + 8 + i, 4);
        }
      } else {
        renderer.drawGfxLine(effect.x - 18, effect.y - 22, effect.x + 18, effect.y + 22, 5, "#f5d0fe", alpha * 0.38, z + 10, "add");
        renderer.drawGfxLine(effect.x + 18, effect.y - 22, effect.x - 18, effect.y + 22, 5, "#f5d0fe", alpha * 0.38, z + 11, "add");
      }
    } else if (slashLike) {
      const count = s.includes("fan") ? 5 : 3;
      const spread = s.includes("fan") ? 1.05 : 0.6;
      const reach = Math.max(radius * 0.56, effectRadius * 0.82);
      for (let i = 0; i < count; i += 1) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const a = angle + t * spread;
        const sx = effect.x - Math.cos(a) * 18 + Math.sin(a) * t * 18;
        const sy = effect.y - Math.sin(a) * 18 - Math.cos(a) * t * 18;
        const tx = effect.x + Math.cos(a) * reach;
        const ty = effect.y + Math.sin(a) * reach;
        renderer.drawGfxLine(sx, sy, tx, ty, i === Math.floor(count / 2) ? 9 : 6, i === Math.floor(count / 2) ? "#f5d0fe" : tint, alpha * (0.34 + i * 0.03), z + i, "add");
        renderer.drawGfxArc(tx, ty, 18 + peak * 5, a - 0.55, a + 0.2, 4, tint, alpha * 0.22, z + 8 + i, "add", 6);
      }
      renderer.renderParticlePreset?.("slashTrail", {
        x: effect.x + Math.cos(angle) * reach * 0.66,
        y: effect.y + Math.sin(angle) * reach * 0.66,
        radius: 42,
        color: tint,
        alpha: alpha * 0.3,
        zIndex: z + 20,
        phase: progress,
        count: 8,
        direction: angle,
        spread
      }) || renderer.drawGfxSparkSpray(effect.x + Math.cos(angle) * reach * 0.66, effect.y + Math.sin(angle) * reach * 0.66, 42, tint, alpha * 0.22, z + 20, 8, progress, angle, spread);
    } else {
      renderer.drawGfxStar(effect.x, effect.y, 22 + peak * 6, tint, alpha * 0.38, z, 4);
    }
    return true;
  }

  function renderCrispClassStyledEffect(renderer, context) {
    if (!context) return false;
    return (
      renderCrispAlchemistEffect(renderer, context) ||
      renderCrispPuppetEffect(renderer, context) ||
      renderCrispMartialEffect(renderer, context) ||
      renderCrispAssassinEffect(renderer, context)
    );
  }

  function skillPolishPalette(context) {
    const s = context?.s || "";
    if (s.includes("empowered_current") || s.includes("red_lightning")) {
      return { tint: "#ef4444", light: "#fee2e2", preset: "lightningFork", soft: "#7f1d1d" };
    }
    if (s.includes("frost") || s.includes("freeze") || s.includes("ice") || s.includes("blink")) {
      return { tint: "#93c5fd", light: "#dbeafe", preset: "frostBurst", soft: "#3b82f6" };
    }
    if (s.includes("meteor") || s.includes("fire") || s.includes("flame") || s.includes("burn")) {
      return { tint: "#f97316", light: "#fde68a", preset: "fireBurst", soft: "#7c2d12" };
    }
    if (s.includes("lightning") || s.includes("electric") || s.includes("overclock") || s.includes("shock") || s.includes("rail")) {
      return { tint: "#9ee6ff", light: "#dbeafe", preset: "lightningFork", soft: "#2563eb" };
    }
    if (s.includes("poison") || s.includes("acid") || s.includes("venom")) {
      return { tint: "#bef264", light: "#ecfccb", preset: "poisonBurst", soft: "#3f6212" };
    }
    if (s.includes("heal") || s.includes("elixir") || s.includes("holy")) {
      return { tint: "#86efac", light: "#f0fdf4", preset: "healMist", soft: "#14532d" };
    }
    if (s.includes("puppet") || s.includes("thread")) {
      return { tint: "#f5d0fe", light: "#fdf4ff", preset: "arcaneDust", soft: "#581c87" };
    }
    if (s.includes("shadow") || s.includes("assassin") || s.includes("stalker") || s.includes("smoke")) {
      return { tint: "#c4b5fd", light: "#f5d0fe", preset: "smokePuff", soft: "#21142f" };
    }
    if (s.includes("engineer") || s.includes("turret") || s.includes("mine") || s.includes("drone")) {
      return { tint: "#d6b76d", light: "#fef3c7", preset: "metalSpark", soft: "#4b3b22" };
    }
    if (s.includes("martial") || s.includes("palm") || s.includes("combo") || s.includes("rising")) {
      return { tint: "#fde68a", light: "#f8f3e9", preset: "shockRing", soft: "#78350f" };
    }
    if (s.includes("warrior") || s.includes("cleave") || s.includes("shield") || s.includes("taunt") || s.includes("spin")) {
      return { tint: "#f97316", light: "#fde68a", preset: "bladeGlint", soft: "#6b3425" };
    }
    if (s.includes("ranger") || s.includes("arrow") || s.includes("piercing") || s.includes("barrage")) {
      return { tint: "#f1d08b", light: "#fff7ed", preset: "bladeGlint", soft: "#6b4a2b" };
    }
    return { tint: context?.color || "#f8f3e9", light: "#f8f3e9", preset: "hitSpark", soft: "#3f3426" };
  }

  function pixelSnap(value, grid = 4) {
    return Math.round((Number(value) || 0) / grid) * grid;
  }

  function pixelStepAngle(angle) {
    return Math.round((Number(angle) || 0) / (Math.PI / 8)) * (Math.PI / 8);
  }

  function pixelBlockSize(size, min = 4, max = 18) {
    return Math.max(min, Math.min(max, Math.round((Number(size) || min) / 2) * 2));
  }

  function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, Number(value)));
  }

  function coneHalfAngleFromArcDot(effect, fallback = Math.PI * 0.52) {
    const arcDot = Number(effect?.arcDot);
    if (!Number.isFinite(arcDot)) return fallback;
    return Math.acos(clampNumber(arcDot, -0.99, 0.99));
  }

  function renderPixelBlock(renderer, x, y, size, color, alpha, zIndex, rotation = 0, blendMode = "add") {
    if (!renderer?.gfx || alpha <= 0.01) return false;
    const blockSize = pixelBlockSize(size);
    const graphics = renderer.gfx(zIndex, blendMode);
    graphics.position.set(pixelSnap(x), pixelSnap(y));
    graphics.rotation = pixelStepAngle(rotation);
    graphics.rect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
    graphics.fill({ color: renderer.tint ? renderer.tint(color) : color, alpha });
    return true;
  }

  function renderPixelLine(renderer, fromX, fromY, toX, toY, color, alpha, zIndex, options = {}) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy);
    if (length < 8) return false;
    const count = Math.max(2, Math.min(options.maxCount || 18, Math.round(length / (options.step || 22))));
    const angle = Math.atan2(dy, dx);
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    const jitter = Number(options.jitter || 0);
    const size = Number(options.size || 6);
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const fade = options.fadeTail ? 0.35 + t * 0.65 : 1 - Math.abs(t - 0.5) * 0.35;
      const offset = jitter ? Math.sin(i * 2.17 + Number(options.phase || 0)) * jitter : 0;
      const px = fromX + dx * t + nx * offset;
      const py = fromY + dy * t + ny * offset;
      drew = renderPixelBlock(renderer, px, py, size * (0.82 + (i % 3) * 0.16), color, alpha * fade, zIndex + i, angle, options.blendMode || "add") || drew;
    }
    return drew;
  }

  function renderPixelArc(renderer, x, y, radius, startAngle, endAngle, color, alpha, zIndex, options = {}) {
    const span = endAngle - startAngle;
    const count = Math.max(4, Math.min(options.maxCount || 18, Math.round(Math.abs(span) * radius / (options.step || 24))));
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const a = startAngle + span * t;
      const wobble = Math.sin(i * 2.31 + Number(options.phase || 0)) * Number(options.jitter || 0);
      const px = x + Math.cos(a) * (radius + wobble);
      const py = y + Math.sin(a) * (radius + wobble);
      const head = options.headBright ? 0.45 + t * 0.65 : 1 - Math.abs(t - 0.5) * 0.35;
      drew = renderPixelBlock(renderer, px, py, Number(options.size || 7) * (0.85 + (i % 2) * 0.18), color, alpha * head, zIndex + i, a + Math.PI / 2, options.blendMode || "add") || drew;
    }
    return drew;
  }

  function renderPixelBurst(renderer, x, y, radius, palette, alpha, zIndex, options = {}) {
    const count = Math.max(6, Math.min(options.maxCount || 14, Math.round(radius / 8)));
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const a = Number(options.angle || 0) + (Math.PI * 2 * i) / count + Number(options.phase || 0) * 0.35;
      const dist = radius * (0.2 + ((i % 4) + 1) * 0.14);
      const color = i % 3 === 0 ? palette.light : i % 2 === 0 ? palette.tint : palette.soft;
      drew = renderPixelBlock(renderer, x + Math.cos(a) * dist, y + Math.sin(a) * dist, 5 + (i % 3) * 2, color, alpha * (0.36 + (i % 3) * 0.08), zIndex + i, a) || drew;
    }
    return drew;
  }

  function renderPixelSword(renderer, hiltX, hiltY, angle, palette, alpha, zIndex, options = {}) {
    if (!renderer?.gfx || alpha <= 0.01) return false;
    const length = Math.max(58, Math.min(Number(options.maxLength || 260), Number(options.length || 112)));
    const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 10;
    const width = Math.max(minWidth, Math.min(Number(options.maxWidth || 28), Number(options.width || 16)));
    const guard = Math.max(18, Math.min(Number(options.maxGuard || 42), Number(options.guard || width * 1.9)));
    const bladeColor = options.bladeColor || "#f8f3e9";
    const edgeColor = options.edgeColor || palette.light || "#fff7ed";
    const coreColor = options.coreColor || palette.tint || "#f97316";
    const shadowColor = options.shadowColor || "#432818";
    const hiltColor = options.hiltColor || "#7c2d12";
    const graphics = renderer.gfx(zIndex, options.blendMode || "normal");
    graphics.position.set(pixelSnap(hiltX, 2), pixelSnap(hiltY, 2));
    graphics.rotation = pixelStepAngle(angle);

    const tint = (value) => renderer.tint ? renderer.tint(value) : value;
    const bladeStart = Math.round(width * 0.95);
    const bladeLength = Math.max(34, length - bladeStart - width * 0.42);
    const half = width / 2;

    graphics.rect(-width * 1.25, -width * 0.26, width * 1.35, width * 0.52);
    graphics.fill({ color: tint(hiltColor), alpha: alpha * 0.92 });
    graphics.rect(-width * 1.6, -width * 0.38, width * 0.45, width * 0.76);
    graphics.fill({ color: tint(coreColor), alpha: alpha * 0.9 });
    graphics.rect(width * 0.08, -guard / 2, width * 0.48, guard);
    graphics.fill({ color: tint(coreColor), alpha: alpha * 0.88 });
    graphics.rect(width * 0.34, -half - 3, bladeLength, width + 6);
    graphics.fill({ color: tint(shadowColor), alpha: alpha * 0.34 });
    graphics.rect(bladeStart, -half, bladeLength, width);
    graphics.fill({ color: tint(bladeColor), alpha: alpha * 0.82 });
    graphics.rect(bladeStart + width * 0.4, -half, bladeLength * 0.72, Math.max(3, width * 0.22));
    graphics.fill({ color: tint(edgeColor), alpha: alpha * 0.72 });
    graphics.rect(bladeStart + width * 0.55, half - Math.max(4, width * 0.25), bladeLength * 0.62, Math.max(3, width * 0.18));
    graphics.fill({ color: tint(coreColor), alpha: alpha * 0.22 });
    graphics.rect(bladeStart + bladeLength - 2, -half * 0.76, width * 0.72, width * 0.76);
    graphics.fill({ color: tint(edgeColor), alpha: alpha * 0.74 });
    graphics.rect(bladeStart + bladeLength + width * 0.42, -half * 0.42, width * 0.42, width * 0.42);
    graphics.fill({ color: tint(edgeColor), alpha: alpha * 0.62 });
    return true;
  }

  function renderPixelSwordTipSpark(renderer, x, y, angle, palette, alpha, zIndex, size = 12) {
    if (alpha <= 0.01) return false;
    renderPixelBlock(renderer, x, y, size, palette.light, alpha * 0.82, zIndex + 4, angle);
    renderPixelBlock(renderer, x - Math.cos(angle) * size * 0.85, y - Math.sin(angle) * size * 0.85, size * 0.62, palette.tint, alpha * 0.54, zIndex + 3, angle + Math.PI / 4);
    renderPixelBlock(renderer, x - Math.sin(angle) * size * 0.55, y + Math.cos(angle) * size * 0.55, size * 0.44, palette.light, alpha * 0.4, zIndex + 2, angle);
    renderPixelBlock(renderer, x + Math.sin(angle) * size * 0.55, y - Math.cos(angle) * size * 0.55, size * 0.44, palette.light, alpha * 0.4, zIndex + 2, angle);
    return true;
  }

  function renderPixelSwordTipTrail(renderer, originX, originY, length, startAngle, endAngle, palette, alpha, zIndex, options = {}) {
    const span = endAngle - startAngle;
    const count = Math.max(5, Math.min(options.maxCount || 18, Math.round(Math.abs(span) * length / 26)));
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const a = startAngle + span * t;
      const trailAlpha = alpha * (options.reverse ? 1 - t * 0.72 : 0.24 + t * 0.72);
      const d = length * (0.88 + (i % 2) * 0.035);
      const x = originX + Math.cos(a) * d;
      const y = originY + Math.sin(a) * d;
      drew = renderPixelBlock(renderer, x, y, options.heavy ? 10 : 7, i % 2 ? palette.light : palette.tint, trailAlpha, zIndex + i, a + Math.PI / 2) || drew;
    }
    return drew;
  }

  function renderPixelGroundCleave(renderer, originX, originY, angle, reach, palette, alpha, zIndex) {
    let drew = false;
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    for (let i = 1; i <= 9; i += 1) {
      const t = i / 9;
      const centerX = originX + Math.cos(angle) * reach * t;
      const centerY = originY + Math.sin(angle) * reach * t;
      const spread = (i % 2 ? 1 : -1) * (10 + i * 1.5);
      renderPixelBlock(renderer, centerX + px * spread, centerY + py * spread, 8 + (i % 3) * 3, "#3f2416", alpha * (0.3 - t * 0.12), zIndex + i, angle, "normal");
      renderPixelBlock(renderer, centerX - px * spread * 0.42, centerY - py * spread * 0.42, 6 + (i % 2) * 2, palette.tint, alpha * (0.22 - t * 0.08), zIndex + 16 + i, angle);
      drew = true;
    }
    return drew;
  }

  function renderPixelConeHitEdge(renderer, originX, originY, angle, reach, halfAngle, palette, alpha, zIndex, options = {}) {
    const outer = Math.max(40, reach);
    const inner = Math.max(18, outer * 0.28);
    const tickCount = Math.max(8, Math.min(options.heavy ? 28 : 20, Math.round((halfAngle * 2 * outer) / 22)));
    let drew = false;
    for (let i = 0; i < tickCount; i += 1) {
      const t = tickCount === 1 ? 0.5 : i / (tickCount - 1);
      const a = angle - halfAngle + halfAngle * 2 * t;
      const edgeAlpha = alpha * (options.heavy ? 0.34 : 0.2) * (0.6 + Math.sin(t * Math.PI) * 0.4);
      drew = renderPixelBlock(renderer, originX + Math.cos(a) * outer, originY + Math.sin(a) * outer, options.heavy ? 8 : 6, i % 2 ? palette.light : palette.tint, edgeAlpha, zIndex + i, a + Math.PI / 2) || drew;
    }
    for (let side = -1; side <= 1; side += 2) {
      const a = angle + side * halfAngle;
      drew = renderPixelLine(renderer, originX + Math.cos(a) * inner, originY + Math.sin(a) * inner, originX + Math.cos(a) * outer, originY + Math.sin(a) * outer, palette.tint, alpha * (options.heavy ? 0.22 : 0.12), zIndex + 34 + side, {
        size: options.heavy ? 7 : 5,
        step: 20,
        maxCount: options.heavy ? 12 : 8,
        fadeTail: true
      }) || drew;
    }
    return drew;
  }

  function renderPixelCircleHitEdge(renderer, x, y, radius, palette, alpha, zIndex, options = {}) {
    const r = Math.max(34, Number(radius || 0));
    const count = Math.max(14, Math.min(options.maxCount || 42, Math.round((Math.PI * 2 * r) / (options.step || 30))));
    const squashY = Number(options.squashY || 1);
    const phase = Number(options.phase || 0);
    const chunky = Boolean(options.chunky);
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      const a = Math.PI * 2 * t + phase;
      const color = options.color || (i % 2 ? palette.light : palette.tint);
      const edgeAlpha = alpha * (0.52 + Math.sin(t * Math.PI * 2 + phase) * 0.1);
      const block = chunky ? 10 : 7;
      drew = renderPixelBlock(renderer, x + Math.cos(a) * r, y + Math.sin(a) * r * squashY, block + (i % 3 === 0 ? 2 : 0), color, edgeAlpha, zIndex + i, a + Math.PI / 2, options.blendMode || "add") || drew;
    }
    if (options.inner) {
      const innerR = r * Number(options.inner);
      const innerCount = Math.max(10, Math.min(28, Math.round((Math.PI * 2 * innerR) / 34)));
      for (let i = 0; i < innerCount; i += 1) {
        if (i % 3 === 1) continue;
        const a = Math.PI * 2 * (i / innerCount) - phase * 0.7;
        drew = renderPixelBlock(renderer, x + Math.cos(a) * innerR, y + Math.sin(a) * innerR * squashY, chunky ? 7 : 5, palette.tint, alpha * 0.28, zIndex + 60 + i, a, options.blendMode || "add") || drew;
      }
    }
    return drew;
  }

  function renderPixelCleaveCrescent(renderer, originX, originY, angle, reach, halfAngle, palette, alpha, zIndex, options = {}) {
    const outer = Math.max(90, reach);
    const heavy = Boolean(options.heavy);
    const start = angle - halfAngle;
    const end = angle + halfAngle;
    let drew = false;
    const layers = heavy
      ? [
          { r: 1.0, size: 16, color: "#fff7ed", alpha: 0.72, step: 17 },
          { r: 0.91, size: 12, color: "#facc15", alpha: 0.56, step: 19 },
          { r: 0.78, size: 8, color: palette.tint, alpha: 0.34, step: 23 }
        ]
      : [
          { r: 1.0, size: 9, color: "#fff7ed", alpha: 0.38, step: 25 },
          { r: 0.84, size: 6, color: palette.tint, alpha: 0.24, step: 30 }
        ];
    for (let layer = 0; layer < layers.length; layer += 1) {
      const item = layers[layer];
      drew = renderPixelArc(renderer, originX, originY, outer * item.r, start, end, item.color, alpha * item.alpha, zIndex + layer * 24, {
        size: item.size,
        step: item.step,
        maxCount: heavy ? 46 : 24,
        jitter: heavy ? 7 - layer * 2 : 3,
        phase: Number(options.phase || 0) + layer * 1.7,
        headBright: true
      }) || drew;
    }
    const shockCount = heavy ? 9 : 4;
    for (let i = 0; i < shockCount; i += 1) {
      const t = shockCount === 1 ? 0.5 : i / (shockCount - 1);
      const a = start + (end - start) * t;
      const sx = originX + Math.cos(a) * outer * 0.66;
      const sy = originY + Math.sin(a) * outer * 0.66;
      const tx = originX + Math.cos(a) * outer * (heavy ? 1.08 : 0.96);
      const ty = originY + Math.sin(a) * outer * (heavy ? 1.08 : 0.96);
      drew = renderPixelLine(renderer, sx, sy, tx, ty, i % 2 ? palette.tint : palette.light, alpha * (heavy ? 0.28 : 0.16), zIndex + 90 + i, {
        size: heavy ? 8 : 5,
        step: 22,
        maxCount: heavy ? 7 : 4,
        fadeTail: true
      }) || drew;
    }
    return drew;
  }

  function renderPixelBladeShard(renderer, x, y, angle, length, palette, alpha, zIndex, options = {}) {
    const bladeLength = Math.max(22, Math.min(76, Number(length || 42)));
    const width = Math.max(5, Math.min(14, bladeLength * 0.18));
    const backX = x - Math.cos(angle) * bladeLength * 0.42;
    const backY = y - Math.sin(angle) * bladeLength * 0.42;
    const tipX = x + Math.cos(angle) * bladeLength * 0.58;
    const tipY = y + Math.sin(angle) * bladeLength * 0.58;
    let drew = false;
    drew = renderPixelLine(renderer, backX, backY, tipX, tipY, palette.light, alpha * 0.72, zIndex, {
      size: width,
      step: 13,
      maxCount: 5,
      fadeTail: true
    }) || drew;
    renderPixelBlock(renderer, tipX, tipY, width * 1.05, options.tipColor || "#fff7ed", alpha * 0.82, zIndex + 7, angle + Math.PI / 4);
    renderPixelBlock(renderer, x - Math.sin(angle) * width * 0.8, y + Math.cos(angle) * width * 0.8, width * 0.72, palette.tint, alpha * 0.42, zIndex + 4, angle);
    return drew;
  }

  function renderPixelBladeWhirlwind(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, peak, z, angle } = context;
    const originX = Number.isFinite(effect.originX) ? Number(effect.originX) : effect.x;
    const originY = Number.isFinite(effect.originY) ? Number(effect.originY) : effect.y;
    const radius = Math.max(92, Number(effect.rangeRadius || effect.radius || effectRadius));
    let drew = false;
    const t = Math.max(0, Math.min(1, progress));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.82) / 0.18);
    const activeAlpha = alpha * fade * (0.76 + peak * 0.18);
    const phase = Number(effect.seed || 0) * 0.13 + Number(angle || 0) * 0.22 + t * Math.PI * 4.6;
    const swirlRadius = radius * 0.98;

    renderer.drawGfxCircle?.(originX, originY, radius, "#160b07", activeAlpha * 0.04, "#f97316", activeAlpha * 0.18, 3, z + 4, "add", 64);
    renderer.drawGfxCircle?.(originX, originY, swirlRadius * 0.42, "#160b07", activeAlpha * 0.025, "#fde68a", activeAlpha * 0.16, 2, z + 6, "add", 40);

    for (let i = 0; i < 3; i += 1) {
      const a = phase + (Math.PI * 2 * i) / 3;
      const start = a - 0.58;
      const end = a + 0.98;
      const outer = swirlRadius * (0.98 + (i % 2) * 0.02);
      const inner = swirlRadius * 0.54;
      renderer.drawGfxCleaveRibbon?.(originX, originY, inner, outer, start, end, "#fff7ed", activeAlpha * 0.11, "#fde68a", activeAlpha * 0.22, 3, z + 22 + i * 8, "add", 14);
      drew = renderPixelArc(renderer, originX, originY, outer, start + 0.08, end - 0.05, "#fff7ed", activeAlpha * 0.3, z + 36 + i * 8, {
        size: 6,
        step: 16,
        maxCount: 16,
        jitter: 1,
        phase: progress * 4 + i
      }) || drew;
      drew = renderPixelArc(renderer, originX, originY, inner * 0.92, start + 0.26, end - 0.22, "#f97316", activeAlpha * 0.18, z + 40 + i * 8, {
        size: 4,
        step: 18,
        maxCount: 12,
        jitter: 1,
        phase: progress * 3 + i
      }) || drew;
    }
    renderer.renderParticlePreset?.("slashTrail", {
      x: originX,
      y: originY,
      radius: swirlRadius * 0.5,
      angle: phase,
      color: "#fde68a",
      alpha: activeAlpha * 0.18,
      zIndex: z + 116,
      count: 8,
      phase
    });
    return drew;
  }

  function renderPixelWarriorSwordSwing(renderer, context, palette) {
    if (!renderer || !context) return false;
    const { effect, progress, alpha, s, kind, angle, effectRadius, peak, z } = context;
    const cleave = s.includes("warrior_cleave") || s.includes("wide");
    const spin = kind === "spin" || s.includes("warrior_spin");
    const originX = Number.isFinite(effect.originX) ? Number(effect.originX) : effect.x - Math.cos(angle) * effectRadius * 0.34;
    const originY = Number.isFinite(effect.originY) ? Number(effect.originY) : effect.y - Math.sin(angle) * effectRadius * 0.34;
    const reach = Math.max(72, Math.min(420, Number(effect.reach || effect.rangeRadius || effectRadius * (spin ? 0.62 : 0.72))));
    const halfAngle = coneHalfAngleFromArcDot(effect, cleave ? Math.PI * 0.58 : Math.PI * 0.5);
    const side = Number(effect.swingSide || 1) < 0 ? -1 : 1;
    const active = Math.min(1, Math.max(0, progress / (spin ? 0.96 : cleave ? 0.92 : 0.68)));
    const ease = active * active * (3 - 2 * active);
    let currentAngle;
    let previousAngle;
    let swordLength;
    let swordWidth;

    if (spin) {
      return renderPixelBladeWhirlwind(renderer, context, palette);
    }

    if (cleave) {
      swordLength = Math.max(150, Math.min(320, reach));
      swordWidth = Math.max(26, Math.min(64, swordLength * 0.18));
      const startAngle = angle - side * halfAngle;
      const finishAngle = angle + side * halfAngle;
      currentAngle = startAngle + (finishAngle - startAngle) * ease;
      previousAngle = startAngle + (finishAngle - startAngle) * Math.max(0, ease - 0.28);
      renderPixelCleaveCrescent(renderer, originX, originY, angle, reach, halfAngle, palette, alpha * (0.72 + peak * 0.12), z + 28, {
        heavy: true,
        phase: progress * 4
      });
      renderPixelConeHitEdge(renderer, originX, originY, angle, reach, halfAngle, palette, alpha, z + 18, { heavy: true });
      renderPixelGroundCleave(renderer, originX, originY, angle, reach, palette, alpha, z + 22);
      renderPixelSwordTipTrail(renderer, originX, originY, swordLength, previousAngle, currentAngle, palette, alpha * 0.76, z + 46, {
        heavy: true,
        maxCount: 34
      });
      for (let i = 1; i <= 3; i += 1) {
        const ghostT = Math.max(0, ease - i * 0.19);
        const ghostAngle = startAngle + (finishAngle - startAngle) * ghostT;
        renderPixelSword(renderer, originX, originY, ghostAngle, palette, alpha * (0.2 - i * 0.04), z + 60 - i, {
          length: swordLength * (1 - i * 0.03),
          width: swordWidth * (0.85 - i * 0.06),
          guard: swordWidth * 2.5,
          coreColor: "#facc15",
          bladeColor: "#fff7ed",
          edgeColor: "#fef3c7",
          maxLength: 360,
          maxWidth: 64,
          maxGuard: 108,
          blendMode: "add"
        });
      }
      renderPixelSword(renderer, originX, originY, currentAngle, palette, alpha, z + 98, {
        length: swordLength,
        width: swordWidth,
        guard: swordWidth * 2.7,
        coreColor: "#facc15",
        bladeColor: "#fff7ed",
        edgeColor: "#fef3c7",
        shadowColor: "#5f2a18",
        hiltColor: "#92400e",
        maxLength: 360,
        maxWidth: 64,
        maxGuard: 108
      });
      renderPixelSwordTipSpark(
        renderer,
        originX + Math.cos(currentAngle) * swordLength,
        originY + Math.sin(currentAngle) * swordLength,
        currentAngle,
        palette,
        alpha * 0.84,
        z + 122,
        20
      );
      return true;
    }

    const hiltOffset = Math.max(24, Math.min(42, reach * 0.3));
    swordLength = Math.max(58, Math.min(150, reach - hiltOffset));
    const rangeWidthScale = Math.max(1, Math.min(1.7, Math.sqrt(Math.max(1, reach / 100))));
    swordWidth = Math.max(7, Math.min(18, swordLength * 0.065 * rangeWidthScale));
    const startAngle = angle - side * halfAngle;
    const finishAngle = angle + side * halfAngle;
    currentAngle = startAngle + (finishAngle - startAngle) * ease;
    previousAngle = startAngle + (finishAngle - startAngle) * Math.max(0, ease - 0.16);

    renderPixelConeHitEdge(renderer, originX, originY, angle, reach, halfAngle, palette, alpha, z + 16, { heavy: false });
    renderPixelSwordTipTrail(renderer, originX, originY, reach, previousAngle, currentAngle, palette, alpha * 0.36, z + 44, {
      heavy: false,
      maxCount: 16
    });
    for (let i = 1; i <= 1; i += 1) {
      const ghostT = Math.max(0, ease - i * 0.14);
      const ghostAngle = startAngle + (finishAngle - startAngle) * ghostT;
      const ghostHiltX = originX + Math.cos(ghostAngle) * hiltOffset;
      const ghostHiltY = originY + Math.sin(ghostAngle) * hiltOffset;
      renderPixelSword(renderer, ghostHiltX, ghostHiltY, ghostAngle, palette, alpha * (0.16 - i * 0.045), z + 58 - i, {
        length: swordLength * (1 - i * 0.04),
        width: swordWidth * (0.9 - i * 0.08),
        guard: swordWidth * 1.55,
        coreColor: palette.tint,
        bladeColor: palette.light,
        edgeColor: "#fff7ed",
        minWidth: 6,
        maxWidth: 18,
        blendMode: "add"
      });
    }
    const hiltX = originX + Math.cos(currentAngle) * hiltOffset;
    const hiltY = originY + Math.sin(currentAngle) * hiltOffset;
    renderPixelSword(renderer, hiltX, hiltY, currentAngle, palette, alpha * 0.98, z + 92, {
      length: swordLength,
      width: swordWidth,
      guard: swordWidth * 1.75,
      coreColor: "#f97316",
      bladeColor: "#fff7ed",
      edgeColor: "#fef3c7",
      minWidth: 6,
      maxWidth: 18
    });
    renderPixelSwordTipSpark(
      renderer,
      originX + Math.cos(currentAngle) * reach,
      originY + Math.sin(currentAngle) * reach,
      currentAngle,
      palette,
      alpha * 0.5,
      z + 114,
      12
    );
    return true;
  }

  function renderPixelSkillLayer(renderer, context, palette = skillPolishPalette(context)) {
    if (!renderer || !context || context.alpha <= 0.02) return false;
    const { effect, progress, alpha, s, kind, angle, radius, effectRadius, end, peak, z } = context;
    const arrowRain = s.includes("arrow_rain");
    const directional =
      !arrowRain &&
      (kind === "shot" ||
        kind === "dash" ||
        kind === "chain" ||
        s.includes("charge") ||
        s.includes("lunge") ||
        s.includes("piercing") ||
        s.includes("throw") ||
        s.includes("beam") ||
        s.includes("laser") ||
        s.includes("palm") ||
        s.includes("rising") ||
        s.includes("rail"));
    let drew = false;

    if (directional && end && Number.isFinite(end.fromX) && Number.isFinite(end.toX)) {
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const length = Math.hypot(dx, dy);
      const ux = length > 0 ? dx / length : Math.cos(angle);
      const uy = length > 0 ? dy / length : Math.sin(angle);
      const fromX = end.fromX + ux * Math.min(24, length * 0.08);
      const fromY = end.fromY + uy * Math.min(24, length * 0.08);
      const toX = end.toX - ux * Math.min(18, length * 0.06);
      const toY = end.toY - uy * Math.min(18, length * 0.06);
      const chunky = s.includes("shield_charge") || s.includes("rising") || s.includes("palm");
      drew = renderPixelLine(renderer, fromX, fromY, toX, toY, palette.light, alpha * 0.52, z + 34, {
        size: chunky ? 10 : 7,
        step: chunky ? 20 : 24,
        maxCount: chunky ? 20 : 16,
        jitter: s.includes("lightning") || kind === "chain" ? 14 : chunky ? 5 : 2,
        phase: progress * 6,
        fadeTail: true
      }) || drew;
      drew = renderPixelLine(renderer, fromX - uy * 12, fromY + ux * 12, toX - uy * 6, toY + ux * 6, palette.tint, alpha * 0.28, z + 24, {
        size: chunky ? 8 : 5,
        step: 28,
        maxCount: 12,
        jitter: s.includes("lightning") || kind === "chain" ? 9 : 0,
        phase: progress * 4.4,
        fadeTail: true
      }) || drew;
    }

    if (kind === "slash" || kind === "spin" || s.includes("cleave") || s.includes("slash") || s.includes("spin") || s.includes("warrior_basic")) {
      const slashRadius = Math.max(42, Math.min(180, effectRadius * (kind === "spin" ? 0.68 : 0.58)));
      const sweep = kind === "spin" ? Math.PI * 2.05 : s.includes("cleave") ? Math.PI * 1.05 : Math.PI * 0.74;
      const center = angle - sweep * 0.45 + progress * (kind === "spin" ? Math.PI * 2.2 : sweep * 0.85);
      drew = renderPixelArc(renderer, effect.x, effect.y, slashRadius, center - sweep * 0.38, center + sweep * 0.18, palette.light, alpha * 0.58, z + 38, {
        size: s.includes("cleave") ? 11 : 8,
        step: s.includes("cleave") ? 20 : 24,
        maxCount: kind === "spin" ? 22 : 15,
        jitter: 4 + peak * 5,
        phase: progress * 5,
        headBright: true
      }) || drew;
      drew = renderPixelArc(renderer, effect.x, effect.y, slashRadius * 0.78, center - sweep * 0.28, center + sweep * 0.08, palette.tint, alpha * 0.28, z + 30, {
        size: 6,
        step: 28,
        maxCount: 12,
        jitter: 3,
        phase: progress * 3,
        headBright: true
      }) || drew;
    }

    const meteorLike = kind === "meteor" || s.includes("meteor");
    const impactLike =
      kind === "impact" ||
      kind === "explosion" ||
      kind === "death" ||
      kind === "meteor" ||
      s.includes("impact") ||
      s.includes("slam") ||
      s.includes("meteor") ||
      s.includes("reaction") ||
      s.includes("burst") ||
      s.includes("finisher");
    if (impactLike && (!meteorLike || progress >= 0.72)) {
      const burstRadius = Math.max(28, Math.min(112, effectRadius * (meteorLike || kind === "explosion" ? 0.62 : 0.46)));
      drew = renderPixelBurst(renderer, effect.x, effect.y, burstRadius, palette, alpha * (0.72 + peak * 0.12), z + 48, {
        maxCount: meteorLike || kind === "explosion" ? 18 : 12,
        phase: progress * 5,
        angle
      }) || drew;
      renderPixelBlock(renderer, effect.x, effect.y, Math.max(8, burstRadius * 0.16), palette.light, alpha * 0.48, z + 70, angle);
    }

    const auraLike =
      kind === "shield" ||
      kind === "cleanse" ||
      kind === "revive" ||
      kind === "holy" ||
      kind === "freeze" ||
      kind === "slow" ||
      s.includes("taunt") ||
      s.includes("focus") ||
      s.includes("cage") ||
      s.includes("theater") ||
      s.includes("smoke") ||
      s.includes("frost") ||
      s.includes("elixir");
    if (auraLike) {
      if (s.includes("frost_breath")) {
        const ringRadius = Math.max(42, effectRadius * 0.62);
        const baseAngle = Number(effect.seed || 0) * 0.19;
        for (let i = 0; i < 4; i += 1) {
          const a = baseAngle + (Math.PI * 2 * i) / 4;
          const r = ringRadius * (0.82 + i * 0.035);
          renderPixelBlock(renderer, effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r, i % 2 ? 4 : 5, i % 2 ? palette.tint : palette.light, alpha * 0.08, z + 8 + i, a);
        }
        return true;
      }
      const ringRadius = Math.max(36, Math.min(150, effectRadius * (s.includes("taunt") ? 0.78 : 0.56)));
      const count = Math.max(8, Math.min(20, Math.round(ringRadius / 8)));
      for (let i = 0; i < count; i += 1) {
        if ((i + Math.floor(progress * 6)) % 4 === 1) continue;
        const a = progress * (s.includes("taunt") ? 2.4 : 1.1) + (Math.PI * 2 * i) / count;
        const r = ringRadius * (0.82 + ((i % 3) - 1) * 0.045);
        const color = i % 2 ? palette.tint : palette.light;
        drew = renderPixelBlock(renderer, effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r, s.includes("taunt") ? 10 : 7, color, alpha * (s.includes("taunt") ? 0.42 : 0.26), z + 20 + i, a) || drew;
      }
    }

    return drew;
  }

  function isPixelOnlySkillContext(context) {
    if (!context) return false;
    const kind = String(context.kind || "").toLowerCase();
    const s = String(context.s || "").toLowerCase();
    if (!kind && !s) return false;
    if (kind === "warning" && !s.includes("taunt")) return false;
    if (kind === "damage" || kind === "heal" || kind === "xp" || kind === "chest" || kind === "level") return false;
    if (kind === "poison" && context.effect?.value) return false;
    return Boolean(s) || [
      "arcane",
      "chain",
      "cleanse",
      "dash",
      "death",
      "explosion",
      "freeze",
      "holy",
      "impact",
      "meteor",
      "poison",
      "revive",
      "shield",
      "shot",
      "slash",
      "slow",
      "spin",
      "star",
      "trap"
    ].includes(kind);
  }

  function renderPixelArrowHead(renderer, x, y, angle, palette, alpha, zIndex, size = 8) {
    renderPixelBlock(renderer, x, y, size + 2, palette.light, alpha, zIndex + 2, angle);
    renderPixelBlock(renderer, x - Math.cos(angle) * size + Math.sin(angle) * size * 0.65, y - Math.sin(angle) * size - Math.cos(angle) * size * 0.65, size * 0.72, palette.tint, alpha * 0.78, zIndex + 1, angle + Math.PI / 4);
    renderPixelBlock(renderer, x - Math.cos(angle) * size - Math.sin(angle) * size * 0.65, y - Math.sin(angle) * size + Math.cos(angle) * size * 0.65, size * 0.72, palette.tint, alpha * 0.78, zIndex + 1, angle - Math.PI / 4);
  }

  function renderPixelShieldFace(renderer, x, y, angle, palette, alpha, zIndex, size = 34) {
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    renderPixelBlock(renderer, x, y, size * 0.72, palette.soft, alpha * 0.86, zIndex, angle);
    renderPixelBlock(renderer, x + ux * size * 0.18, y + uy * size * 0.18, size * 0.52, palette.tint, alpha * 0.74, zIndex + 1, angle);
    renderPixelBlock(renderer, x + ux * size * 0.34, y + uy * size * 0.34, size * 0.34, palette.light, alpha * 0.84, zIndex + 2, angle);
    renderPixelBlock(renderer, x + px * size * 0.42, y + py * size * 0.42, size * 0.22, palette.light, alpha * 0.5, zIndex + 3, angle);
    renderPixelBlock(renderer, x - px * size * 0.42, y - py * size * 0.42, size * 0.22, palette.light, alpha * 0.5, zIndex + 3, angle);
  }

  function renderPixelTowerShield(renderer, x, y, angle, palette, alpha, zIndex, size = 46) {
    if (!renderer?.gfx || alpha <= 0.01) return false;
    const width = Math.max(28, Math.min(74, size * 0.78));
    const height = Math.max(40, Math.min(96, size * 1.18));
    const tint = (value) => renderer.tint ? renderer.tint(value) : value;
    const graphics = renderer.gfx(zIndex, "normal");
    graphics.position.set(pixelSnap(x, 2), pixelSnap(y, 2));
    graphics.rotation = pixelStepAngle(angle);
    graphics.rect(-width * 0.34, -height * 0.5, width * 0.68, height);
    graphics.fill({ color: tint("#3f2a1a"), alpha: alpha * 0.92 });
    graphics.rect(-width * 0.48, -height * 0.36, width * 0.96, height * 0.72);
    graphics.fill({ color: tint(palette.soft || "#6b3425"), alpha: alpha * 0.86 });
    graphics.rect(-width * 0.36, -height * 0.27, width * 0.72, height * 0.54);
    graphics.fill({ color: tint(palette.tint || "#f97316"), alpha: alpha * 0.62 });
    graphics.rect(-width * 0.12, -height * 0.42, width * 0.24, height * 0.84);
    graphics.fill({ color: tint(palette.light || "#fde68a"), alpha: alpha * 0.78 });
    graphics.rect(-width * 0.42, -height * 0.08, width * 0.84, height * 0.16);
    graphics.fill({ color: tint(palette.light || "#fde68a"), alpha: alpha * 0.66 });
    graphics.rect(width * 0.34, -height * 0.3, width * 0.18, height * 0.6);
    graphics.fill({ color: tint("#fff7ed"), alpha: alpha * 0.62 });
    return true;
  }

  function renderPixelTauntAura(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, peak, z } = context;
    const radius = Math.max(92, Math.min(430, Number(effect.rangeRadius || effect.radius || effectRadius)));
    const t = Math.max(0, Math.min(1, progress));
    const ease = 1 - Math.pow(1 - t, 2.45);
    const ringRadius = Math.max(18, radius * (0.1 + 0.9 * ease));
    const fade = 1 - Math.max(0, (t - 0.72) / 0.28);
    let drew = false;
    const tauntPalette = {
      ...palette,
      tint: "#ef4444",
      light: "#fecaca",
      dark: "#7f1d1d"
    };

    renderer.drawGfxCircle?.(effect.x, effect.y, radius, "#7f1d1d", alpha * 0.025, "#ef4444", alpha * 0.13, 2, z + 4, "add", 72);
    renderer.drawGfxCircle?.(effect.x, effect.y, ringRadius, "#ef4444", alpha * 0.055 * fade, "#ff2d55", alpha * (0.65 + peak * 0.12) * fade, 7, z + 34, "add", 80);
    renderer.drawGfxCircle?.(effect.x, effect.y, ringRadius * 0.82, "#7f1d1d", alpha * 0.035 * fade, "#991b1b", alpha * 0.28 * fade, 3, z + 22, "add", 72);
    drew = renderPixelCircleHitEdge(renderer, effect.x, effect.y, ringRadius, tauntPalette, alpha * 0.62 * fade, z + 50, {
      maxCount: 58,
      step: 24,
      phase: t * Math.PI * 0.3,
      chunky: false,
      inner: 0.72,
      color: "#ff2d55"
    }) || drew;

    for (let i = 0; i < 16; i += 1) {
      const a = (Math.PI * 2 * i) / 16 + t * 0.8;
      const sparkRadius = ringRadius * (0.94 + (i % 3) * 0.035);
      drew = renderPixelBlock(renderer, effect.x + Math.cos(a) * sparkRadius, effect.y + Math.sin(a) * sparkRadius, i % 2 ? 7 : 10, i % 3 ? "#ef4444" : "#fecaca", alpha * (0.28 + peak * 0.08) * fade, z + 92 + i, a) || drew;
    }
    renderPixelBurst(renderer, effect.x, effect.y, 42 + peak * 18, tauntPalette, alpha * 0.32, z + 118, { maxCount: 12, phase: progress * 6 });
    return drew;
  }

  function renderPixelShieldChargeCapsule(renderer, context, palette) {
    const { effect, progress, alpha, angle, radius, effectRadius, end, peak, z } = context;
    const line = end || {
      fromX: effect.x - Math.cos(angle) * radius,
      fromY: effect.y - Math.sin(angle) * radius,
      toX: effect.x + Math.cos(angle) * radius,
      toY: effect.y + Math.sin(angle) * radius
    };
    const dx = line.toX - line.fromX;
    const dy = line.toY - line.fromY;
    const length = Math.hypot(dx, dy);
    if (length < 12) return false;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
    const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
    const travel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
    const headX = line.fromX + dx * travel;
    const headY = line.fromY + dy * travel;
    const contactRadius = Math.max(48, Math.min(130, Number(effect.contactRadius || effectRadius * 0.32)));
    const shieldSize = Math.max(58, Math.min(118, contactRadius * 1.02));
    let drew = false;

    for (let side = -1; side <= 1; side += 2) {
      const railX = nx * contactRadius * side;
      const railY = ny * contactRadius * side;
      drew = renderPixelLine(renderer, line.fromX + railX, line.fromY + railY, line.toX + railX, line.toY + railY, side > 0 ? "#60a5fa" : "#facc15", alpha * 0.34, z + 14 + side, {
        size: 9,
        step: 24,
        maxCount: 24,
        phase: progress * 4,
        fadeTail: false
      }) || drew;
    }
    drew = renderPixelLine(renderer, line.fromX, line.fromY, line.toX, line.toY, "#bfdbfe", alpha * 0.22, z + 16, {
      size: 11,
      step: 26,
      maxCount: 22,
      jitter: 3,
      phase: progress * 5,
      fadeTail: false
    }) || drew;

    for (let i = 0; i < 8; i += 1) {
      const t = (i + 0.5) / 8;
      const x = line.fromX + dx * t;
      const y = line.fromY + dy * t;
      const side = i % 2 ? 1 : -1;
      renderPixelBlock(renderer, x + nx * contactRadius * 0.62 * side, y + ny * contactRadius * 0.62 * side, 8 + (i % 3), i % 2 ? "#facc15" : "#60a5fa", alpha * 0.24, z + 34 + i, angle);
    }

    const wakeFrom = Math.max(0, travel - 0.34);
    const wakeX = line.fromX + dx * wakeFrom;
    const wakeY = line.fromY + dy * wakeFrom;
    drew = renderPixelLine(renderer, wakeX, wakeY, headX, headY, palette.light, alpha * 0.48, z + 52, {
      size: 14,
      step: 18,
      maxCount: 20,
      jitter: 5,
      phase: progress * 6,
      fadeTail: true
    }) || drew;

    const shieldX = headX + ux * shieldSize * 0.38;
    const shieldY = headY + uy * shieldSize * 0.38;
    renderPixelTowerShield(renderer, shieldX, shieldY, angle, palette, alpha * (0.92 + peak * 0.08), z + 92, shieldSize);
    renderPixelShieldFace(renderer, headX - ux * shieldSize * 0.16, headY - uy * shieldSize * 0.16, angle, palette, alpha * 0.44, z + 78, shieldSize * 0.64);
    renderPixelBurst(renderer, shieldX + ux * shieldSize * 0.38, shieldY + uy * shieldSize * 0.38, 38 + peak * 16, palette, alpha * 0.42, z + 112, { maxCount: 12, phase: progress * 5, angle });

    if (travel >= 0.94) {
      renderPixelBurst(renderer, line.toX, line.toY, contactRadius * 0.72, palette, alpha * 0.5, z + 116, { maxCount: 16, phase: progress * 5.5, angle });
      for (let i = -2; i <= 2; i += 1) {
        const spread = i * 0.16;
        const a = angle + spread;
        renderPixelLine(renderer, line.toX, line.toY, line.toX + Math.cos(a) * contactRadius * 0.95, line.toY + Math.sin(a) * contactRadius * 0.95, i === 0 ? "#fff7ed" : "#facc15", alpha * 0.32, z + 128 + i, {
          size: i === 0 ? 9 : 6,
          step: 18,
          maxCount: 6,
          fadeTail: true
        });
      }
    }
    return drew;
  }

  function renderPixelRain(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, z } = context;
    const radius = Math.max(70, Math.min(180, effectRadius));
    const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
    if (rainProgress <= 0) return false;
    let drew = false;
    drew = renderPixelArc(renderer, effect.x, effect.y, radius, 0, Math.PI * 2, palette.tint, alpha * (0.24 + rainProgress * 0.16), z + 12, {
      size: 5,
      step: 22,
      maxCount: 34,
      phase: progress * 2
    }) || drew;
    drew = renderPixelArc(renderer, effect.x, effect.y, radius * 0.72, 0, Math.PI * 2, palette.light, alpha * (0.08 + rainProgress * 0.08), z + 13, {
      size: 3,
      step: 28,
      maxCount: 24,
      phase: progress * 2.4
    }) || drew;
    for (let i = 0; i < 8; i += 1) {
      const seed = i * 5.37 + Number(effect.seed || 0);
      const lane = (i - 3.5) * radius * 0.12 + Math.sin(seed) * radius * 0.06;
      const fall = (rainProgress * 1.35 + i * 0.13) % 1;
      const x = effect.x + lane;
      const landY = effect.y + Math.sin(seed) * radius * 0.18;
      const y = landY - radius * 1.86 + fall * radius * 2.2;
      const a = Math.PI / 2 + Math.sin(seed) * 0.08;
      drew = renderPixelLine(renderer, x, y - 28, x, y + 20, i % 3 === 0 ? palette.light : palette.tint, alpha * (0.26 + rainProgress * 0.32), z + 24 + i, {
        size: i % 3 === 0 ? 6 : 5,
        step: 14,
        maxCount: 5,
        phase: seed,
        fadeTail: true
      }) || drew;
    }
    return drew;
  }

  function renderPixelArrowRainLaunch(renderer, context, palette) {
    const { progress, alpha, effectRadius, end, z } = context;
    if (!end || !Number.isFinite(end.fromX) || !Number.isFinite(end.fromY) || !Number.isFinite(end.toX) || !Number.isFinite(end.toY)) return false;
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;
    const px = -uy;
    const py = ux;
    const lift = Math.max(170, Math.min(420, dist * 0.44 + effectRadius * 0.52));
    const apexX = end.fromX + dx * 0.5;
    const apexY = Math.min(end.fromY, end.toY) - lift;
    const launch = Math.max(0.05, Math.min(0.94, progress * 0.98));
    const point = (t, lane = 0) => {
      const one = 1 - t;
      return {
        x: one * one * end.fromX + 2 * one * t * apexX + t * t * end.toX + px * lane,
        y: one * one * end.fromY + 2 * one * t * apexY + t * t * end.toY + py * lane
      };
    };
    let drew = false;
    let prev = point(0);
    for (let i = 1; i <= 18; i += 1) {
      const p = point(i / 18);
      drew = renderPixelLine(renderer, prev.x, prev.y, p.x, p.y, i % 2 ? palette.light : palette.tint, alpha * 0.42, z + 34 + i, {
        size: i % 2 ? 7 : 5,
        step: 18,
        maxCount: 5,
        jitter: 0,
        fadeTail: true
      }) || drew;
      prev = p;
    }
    const head = point(launch);
    const ahead = point(Math.min(1, launch + 0.04));
    renderPixelArrowHead(renderer, head.x, head.y, Math.atan2(ahead.y - head.y, ahead.x - head.x), palette, alpha * 0.84, z + 68, 10);
    return drew;
  }

  function renderPixelMeteor(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, z } = context;
    const radius = Math.max(90, Math.min(190, effectRadius));
    const fallEnd = meteorFallEndProgress(effect);
    const fallT = Math.max(0, Math.min(1, progress / fallEnd));
    const fall = fallT * fallT * (3 - fallT * 2);
    const impact = Math.max(0, Math.min(1, (progress - fallEnd) / (1 - fallEnd)));
    const sx = effect.x - radius * 0.86;
    const sy = effect.y - radius * 3.05;
    const mx = sx + (effect.x - sx) * fall;
    const my = sy + (effect.y - sy) * fall;
    let drew = false;
    renderer.drawGfxCircle?.(effect.x, effect.y + radius * 0.08, radius * (0.24 + fall * 0.46), "#000000", alpha * (0.04 + fall * 0.14) * Math.max(0, 1 - impact), "#f97316", alpha * fall * 0.06, 1.2, z + 18, "normal", 28);
    if (impact <= 0.05) {
      if (renderer.drawGfxLine) {
        const lineAlpha = alpha * (0.2 + fall * 0.18);
        renderer.drawGfxLine(sx, sy, mx, my, Math.max(10, radius * 0.08), palette.tint, lineAlpha * 0.55, z + 30, "add");
        renderer.drawGfxLine(sx + 10, sy - 8, mx + 4, my - 3, Math.max(4, radius * 0.035), palette.light, lineAlpha * 0.72, z + 34, "add");
        drew = true;
      } else {
        drew = renderPixelLine(renderer, sx, sy, mx, my, palette.tint, alpha * 0.26, z + 30, {
          size: 7,
          step: 24,
          maxCount: 10,
          jitter: 4,
          phase: progress * 7,
          fadeTail: true
        }) || drew;
      }
    }
    if (impact > 0) {
      drew = renderPixelBurst(renderer, effect.x, effect.y, radius * (0.26 + impact * 0.38), palette, alpha * 0.86, z + 76, {
        maxCount: 20,
        phase: progress * 5
      }) || drew;
      for (let i = 0; i < 18; i += 1) {
        const a = (Math.PI * 2 * i) / 18 + progress;
        const d = radius * (0.12 + (i % 4) * 0.055 + impact * 0.23);
        renderPixelBlock(renderer, effect.x + Math.cos(a) * d, effect.y + Math.sin(a) * d * 0.72, 8 + (i % 3) * 3, i % 2 ? palette.tint : palette.light, alpha * 0.34 * (1 - impact * 0.25), z + 64 + i, a);
      }
    }
    return drew;
  }

  function renderPixelFrost(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, z, peak } = context;
    const radius = Math.max(54, Math.min(150, effectRadius * 0.72));
    let drew = false;
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8 + progress * 0.18;
      const inner = radius * (0.18 + peak * 0.08);
      const outer = radius * (0.78 + (i % 2) * 0.08);
      drew = renderPixelLine(renderer, effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner, effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer, i % 2 ? palette.tint : palette.light, alpha * 0.48, z + 34 + i, {
        size: i % 2 ? 6 : 8,
        step: 18,
        maxCount: 7,
        jitter: 0,
        fadeTail: true
      }) || drew;
      renderPixelBlock(renderer, effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer, 9, palette.light, alpha * 0.5, z + 50 + i, a);
    }
    renderPixelBlock(renderer, effect.x, effect.y, 18 + peak * 6, "#dbeafe", alpha * 0.52, z + 64, Math.PI / 4);
    return drew;
  }

  function renderPixelLightning(renderer, context, palette) {
    const { effect, progress, alpha, angle, radius, effectRadius, end, z, s } = context;
    const fromX = end && Number.isFinite(end.fromX) ? end.fromX : effect.x - Math.cos(angle) * radius;
    const fromY = end && Number.isFinite(end.fromY) ? end.fromY : effect.y - Math.sin(angle) * radius;
    const toX = end && Number.isFinite(end.toX) ? end.toX : effect.x + Math.cos(angle) * radius;
    const toY = end && Number.isFinite(end.toY) ? end.toY : effect.y + Math.sin(angle) * radius;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const nx = -uy;
    const ny = ux;
    const empowered = String(s || "").includes("empowered_current") || String(s || "").includes("red_lightning");
    const tint = empowered ? "#ef4444" : palette.tint;
    const core = empowered ? "#fee2e2" : palette.light;
    const phase = progress * 2.9 + Number(effect.seed || 0) * 0.37 + length * 0.002;
    const mainWidth = Math.max(7, Math.min(18, effectRadius * 0.075));

    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(fromX, fromY, toX, toY, tint, alpha * 0.98, z + 46, mainWidth, 8, Math.max(18, Math.min(36, effectRadius * 0.18)), phase);
      renderer.drawGfxLightning(fromX + nx * 13, fromY + ny * 13, toX + nx * 7, toY + ny * 7, core, alpha * 0.3, z + 50, Math.max(2.5, mainWidth * 0.32), 5, 12, phase + 0.43);
      for (let i = 1; i <= 3; i += 1) {
        const t = i / 4;
        const side = i % 2 ? 1 : -1;
        const bx = fromX + dx * t + nx * Math.sin(phase + i) * 8;
        const by = fromY + dy * t + ny * Math.sin(phase + i) * 8;
        const branch = Math.min(58, 24 + effectRadius * 0.13 + i * 5);
        renderer.drawGfxLightning(
          bx,
          by,
          bx + nx * side * branch + ux * branch * 0.22,
          by + ny * side * branch + uy * branch * 0.22,
          tint,
          alpha * (0.3 - i * 0.035),
          z + 58 + i,
          Math.max(2.2, mainWidth * 0.34),
          3,
          9 + i * 2,
          phase + i * 0.29
        );
      }
      renderer.drawGfxCircle?.(toX, toY, Math.max(8, mainWidth * 1.35), tint, alpha * 0.2, core, alpha * 0.42, 2, z + 72, "add", 12);
      renderer.renderParticlePreset?.("lightningFork", {
        x: toX,
        y: toY,
        radius: Math.max(26, effectRadius * 0.26),
        color: tint,
        alpha: alpha * 0.32,
        zIndex: z + 74,
        count: 5,
        phase,
        direction: Math.atan2(dy, dx),
        spread: Math.PI * 0.72
      });
      return true;
    }

    const segments = Math.max(4, Math.min(9, Math.round(length / 78)));
    let px = fromX;
    let py = fromY;
    let drew = false;
    for (let i = 1; i <= segments; i += 1) {
      const t = i / segments;
      const jump = Math.sin(i * 3.71 + progress * 9) * Math.min(34, effectRadius * 0.18);
      const tx = fromX + dx * t + nx * jump;
      const ty = fromY + dy * t + ny * jump;
      drew = renderPixelLine(renderer, px, py, tx, ty, i % 2 ? core : tint, alpha * 0.72, z + 40 + i, {
        size: i % 2 ? 7 : 5,
        step: 16,
        maxCount: 8,
        jitter: 0,
        fadeTail: true
      }) || drew;
      if (i % 2 === 0) {
        const bx = tx + nx * 18;
        const by = ty + ny * 18;
        renderPixelLine(renderer, tx, ty, bx + ux * 28, by + uy * 28, core, alpha * 0.36, z + 52 + i, {
          size: 4,
          step: 14,
          maxCount: 4,
          fadeTail: true
        });
      }
      px = tx;
      py = ty;
    }
    renderPixelBlock(renderer, toX, toY, 13, core, alpha * 0.7, z + 70, progress);
    return drew;
  }

  function renderPixelOnlySkillEffect(renderer, context) {
    if (!isPixelOnlySkillContext(context)) return false;
    const palette = skillPolishPalette(context);
    const { effect, progress, alpha, s, kind, angle, radius, effectRadius, end, peak, z } = context;
    let drew = false;
    const effectAlpha = alpha * (0.88 + peak * 0.08);

    if (s.includes("arrow_rain_launch")) {
      drew = renderPixelArrowRainLaunch(renderer, context, palette) || drew;
    } else if (s.includes("arrow_rain")) {
      drew = renderPixelRain(renderer, context, palette) || drew;
    } else if (s.includes("meteor") || kind === "meteor") {
      drew = renderPixelMeteor(renderer, context, palette) || drew;
    } else if (s.includes("lightning") || s.includes("electric") || s.includes("overclock") || kind === "chain") {
      drew = renderPixelLightning(renderer, context, palette) || drew;
    } else if (s.includes("frost") || s.includes("freeze") || s.includes("ice") || kind === "freeze" || kind === "slow") {
      drew = renderPixelFrost(renderer, context, palette) || drew;
    }

    if (s.includes("shield_charge")) {
      drew = renderPixelShieldChargeCapsule(renderer, context, palette) || drew;
    } else if (kind === "dash" || s.includes("dash") || s.includes("lunge")) {
      const line = end || { fromX: effect.x - Math.cos(angle) * radius, fromY: effect.y - Math.sin(angle) * radius, toX: effect.x + Math.cos(angle) * radius, toY: effect.y + Math.sin(angle) * radius };
      const warriorDash = s.includes("warrior_dash");
      if (warriorDash && renderer.drawGfxDashDust) {
        renderer.drawGfxDashDust(line.fromX, line.fromY, line.toX, line.toY, Math.max(30, Math.min(70, effectRadius * 0.28)), angle, "#caa35a", alpha * 0.68, z + 28, progress, {});
        drew = true;
      } else {
        const shadow = s.includes("shadow") || s.includes("assassin") || s.includes("stalker");
        renderer.renderParticlePreset?.(shadow ? "smokePuff" : "hitSpark", {
          x: line.toX,
          y: line.toY,
          radius: effectRadius * 0.32,
          color: shadow ? "#c4b5fd" : palette.light,
          alpha: alpha * 0.18,
          zIndex: z + 42,
          count: 7,
          phase: progress * 2
        });
        for (let i = 0; i < 12; i += 1) {
          const t = (i * 0.53 + progress * 0.22) % 1;
          const side = Math.sin(i * 2.4 + progress * 8) * effectRadius * 0.18;
          renderPixelBlock(renderer, line.toX - Math.cos(angle) * radius * t - Math.sin(angle) * side, line.toY - Math.sin(angle) * radius * t + Math.cos(angle) * side, 5 + (i % 3) * 2, i % 2 ? palette.tint : palette.light, alpha * 0.18, z + 34 + i, angle + i);
        }
        drew = true;
      }
      renderPixelBurst(renderer, line.toX, line.toY, 34, palette, alpha * 0.34, z + 58, { maxCount: 8, phase: progress * 3, angle });
    }

    if (!s.includes("arrow_rain") && (kind === "shot" || s.includes("arrow") || s.includes("piercing") || s.includes("barrage") || s.includes("throw") || s.includes("rail"))) {
      const line = end || { fromX: effect.x - Math.cos(angle) * radius, fromY: effect.y - Math.sin(angle) * radius, toX: effect.x + Math.cos(angle) * radius, toY: effect.y + Math.sin(angle) * radius };
      const count = s.includes("barrage") || s.includes("fan") ? 3 : 1;
      for (let i = 0; i < count; i += 1) {
        const offset = (i - (count - 1) / 2) * 18;
        const px = -Math.sin(angle);
        const py = Math.cos(angle);
        drew = renderPixelLine(renderer, line.fromX + px * offset, line.fromY + py * offset, line.toX + px * offset * 0.55, line.toY + py * offset * 0.55, palette.light, alpha * (count > 1 ? 0.42 : 0.62), z + 44 + i, {
          size: s.includes("rail") ? 9 : 6,
          step: s.includes("rail") ? 16 : 22,
          maxCount: s.includes("rail") ? 18 : 13,
          jitter: s.includes("poison") ? 5 : 0,
          phase: progress * 4,
          fadeTail: true
        }) || drew;
        renderPixelArrowHead(renderer, line.toX + px * offset * 0.55, line.toY + py * offset * 0.55, angle, palette, alpha * 0.78, z + 66 + i, s.includes("rail") ? 11 : 8);
      }
    }

    if (s.includes("warrior_basic") || s.includes("warrior_cleave") || s.includes("warrior_spin") || (kind === "spin" && s.includes("warrior"))) {
      drew = renderPixelWarriorSwordSwing(renderer, context, palette) || drew;
    } else if (kind === "slash" || s.includes("slash") || s.includes("palm") || s.includes("combo")) {
      const slashRadius = Math.max(46, Math.min(220, effectRadius * (kind === "spin" ? 0.78 : s.includes("cleave") ? 0.72 : 0.58)));
      const sweep = kind === "spin" ? Math.PI * 2.1 : s.includes("cleave") ? Math.PI * 1.24 : s.includes("palm") ? Math.PI * 0.34 : Math.PI * 0.78;
      const start = angle - sweep * 0.52 + progress * (kind === "spin" ? Math.PI * 2.25 : sweep * 0.65);
      const endAngle = start + sweep * (kind === "spin" ? 0.48 : 0.72);
      drew = renderPixelArc(renderer, effect.x, effect.y, slashRadius, start, endAngle, palette.light, effectAlpha * 0.72, z + 70, {
        size: s.includes("cleave") || kind === "spin" ? 12 : 8,
        step: s.includes("cleave") ? 18 : 22,
        maxCount: kind === "spin" ? 28 : 18,
        jitter: 5 + peak * 6,
        phase: progress * 6,
        headBright: true
      }) || drew;
      drew = renderPixelArc(renderer, effect.x, effect.y, slashRadius * 0.76, start + 0.1, endAngle - 0.12, palette.tint, alpha * 0.42, z + 56, {
        size: 6,
        step: 28,
        maxCount: 14,
        jitter: 2,
        phase: progress * 3,
        headBright: true
      }) || drew;
    }

    if (s === "taunt" || (kind === "warning" && s.includes("taunt"))) {
      drew = renderPixelTauntAura(renderer, context, palette) || drew;
    }

    if (!s.includes("shield_charge") && (kind === "shield" || kind === "cleanse" || kind === "revive" || kind === "holy" || s.includes("shield") || s.includes("barrier") || s.includes("elixir") || s.includes("heal"))) {
      const shieldRadius = Math.max(44, Math.min(130, effectRadius * 0.58));
      const count = 12;
      for (let i = 0; i < count; i += 1) {
        const a = (Math.PI * 2 * i) / count + progress * 0.8;
        const color = i % 2 ? palette.light : palette.tint;
        renderPixelBlock(renderer, effect.x + Math.cos(a) * shieldRadius, effect.y + Math.sin(a) * shieldRadius, 8 + (i % 3), color, alpha * 0.34, z + 38 + i, a);
      }
      if (kind === "holy" || kind === "cleanse" || kind === "revive" || s.includes("heal") || s.includes("elixir")) {
        renderPixelBlock(renderer, effect.x, effect.y - 12, 13, palette.light, alpha * 0.54, z + 66, 0);
        renderPixelBlock(renderer, effect.x, effect.y + 6, 13, palette.light, alpha * 0.54, z + 66, 0);
        renderPixelBlock(renderer, effect.x - 9, effect.y - 3, 13, palette.light, alpha * 0.54, z + 66, 0);
        renderPixelBlock(renderer, effect.x + 9, effect.y - 3, 13, palette.light, alpha * 0.54, z + 66, 0);
      }
      drew = true;
    }

    if (kind === "trap" || s.includes("mine") || s.includes("turret") || s.includes("drone") || s.includes("engineer")) {
      const r = Math.max(34, Math.min(92, effectRadius * 0.42));
      for (let i = 0; i < 10; i += 1) {
        const a = (Math.PI * 2 * i) / 10 + progress * 1.8;
        renderPixelBlock(renderer, effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r, i % 2 ? 8 : 6, i % 2 ? palette.light : palette.tint, alpha * 0.38, z + 42 + i, a);
      }
      renderPixelBlock(renderer, effect.x, effect.y, 20, palette.soft, alpha * 0.72, z + 60, Math.PI / 4, "normal");
      renderPixelBlock(renderer, effect.x, effect.y, 11, palette.light, alpha * 0.64, z + 62, 0);
      drew = true;
    }

    if (kind === "poison" || s.includes("poison") || s.includes("acid") || s.includes("alchemy") || s.includes("flask")) {
      const r = Math.max(36, Math.min(120, effectRadius * 0.48));
      for (let i = 0; i < 15; i += 1) {
        const a = (Math.PI * 2 * i) / 15 + Number(effect.seed || 0);
        const d = r * (0.18 + (i % 5) * 0.11 + progress * 0.12);
        renderPixelBlock(renderer, effect.x + Math.cos(a) * d, effect.y + Math.sin(a) * d * 0.72, 7 + (i % 4) * 2, i % 3 ? palette.tint : palette.light, alpha * 0.32, z + 36 + i, a);
      }
      drew = true;
    }

    if (kind === "impact" || kind === "explosion" || kind === "death" || s.includes("impact") || s.includes("slam") || s.includes("burst") || s.includes("finisher")) {
      const burstRadius = Math.max(30, Math.min(140, effectRadius * (kind === "explosion" ? 0.68 : 0.48)));
      drew = renderPixelBurst(renderer, effect.x, effect.y, burstRadius, palette, effectAlpha, z + 86, {
        maxCount: kind === "explosion" ? 22 : 14,
        phase: progress * 6,
        angle
      }) || drew;
    }

    if (!drew) {
      drew = renderPixelSkillLayer(renderer, context, palette);
    }
    if (!drew) {
      renderPixelBurst(renderer, effect.x, effect.y, Math.max(34, effectRadius * 0.42), palette, alpha * 0.62, z + 50, { maxCount: 10, phase: progress * 4, angle });
      drew = true;
    }
    return drew;
  }

  function renderSkillDirectionPolish(renderer, context, palette) {
    const { progress, alpha, s, kind, angle, radius, effectRadius, end, z } = context;
    if (!end || !Number.isFinite(end.fromX) || !Number.isFinite(end.fromY) || !Number.isFinite(end.toX) || !Number.isFinite(end.toY)) return false;
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const length = Math.hypot(dx, dy);
    if (length < 34) return false;
    const dashLike = kind === "dash" || s.includes("dash") || s.includes("lunge");
    if (dashLike) {
      if (s.includes("warrior_dash") && renderer.drawGfxDashDust) {
        renderer.drawGfxDashDust(end.fromX, end.fromY, end.toX, end.toY, Math.max(28, Math.min(74, effectRadius * 0.26)), angle, "#caa35a", alpha * 0.58, z - 26, progress, {});
        return true;
      }
      return false;
    }
    if (s.includes("shield_charge")) return false;
    const directional =
      kind === "shot" ||
      kind === "dash" ||
      kind === "chain" ||
      s.includes("charge") ||
      s.includes("lunge") ||
      s.includes("piercing") ||
      s.includes("throw") ||
      s.includes("beam") ||
      s.includes("laser") ||
      s.includes("palm") ||
      s.includes("rising") ||
      s.includes("rail");
    if (!directional) return false;

    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    const laneWidth = Math.max(12, Math.min(42, effectRadius * 0.18));
    const pulse = 0.62 + Math.sin(progress * Math.PI) * 0.38;
    const fromX = end.fromX + Math.cos(angle) * Math.min(18, length * 0.08);
    const fromY = end.fromY + Math.sin(angle) * Math.min(18, length * 0.08);
    const toX = end.toX - Math.cos(angle) * Math.min(16, length * 0.06);
    const toY = end.toY - Math.sin(angle) * Math.min(16, length * 0.06);

    if (renderer.drawGfxCapsule) {
      renderer.drawGfxCapsule(fromX, fromY, toX, toY, laneWidth, palette.tint, alpha * 0.14 * pulse, z - 28);
    }
    if (renderer.drawGfxLine) {
      renderer.drawGfxLine(fromX + px * laneWidth * 0.42, fromY + py * laneWidth * 0.42, toX + px * laneWidth * 0.2, toY + py * laneWidth * 0.2, 2.5, palette.light, alpha * 0.22 * pulse, z - 20, "add");
      renderer.drawGfxLine(fromX - px * laneWidth * 0.42, fromY - py * laneWidth * 0.42, toX - px * laneWidth * 0.2, toY - py * laneWidth * 0.2, 2.5, palette.tint, alpha * 0.18 * pulse, z - 21, "add");
    }
    renderer.renderParticlePreset?.(palette.preset, {
      x: toX,
      y: toY,
      radius: Math.max(26, Math.min(70, radius * 0.62)),
      color: palette.light,
      alpha: alpha * 0.22,
      zIndex: z + 18,
      phase: progress * 2.8,
      count: 5,
      direction: angle,
      spread: Math.PI * 0.7
    });
    return true;
  }

  function renderSkillImpactPolish(renderer, context, palette) {
    const { effect, progress, alpha, s, kind, angle, radius, effectRadius, peak, z } = context;
    const meteorLike = kind === "meteor" || s.includes("meteor");
    const impactLike =
      kind === "impact" ||
      kind === "explosion" ||
      kind === "death" ||
      kind === "meteor" ||
      s.includes("impact") ||
      s.includes("slam") ||
      s.includes("meteor") ||
      s.includes("reaction") ||
      s.includes("burst") ||
      s.includes("finale") ||
      s.includes("finisher");
    if (!impactLike) return false;
    if (meteorLike && progress < 0.72) return false;

    const punch = Math.max(26, Math.min(96, effectRadius * (kind === "explosion" || meteorLike ? 0.58 : 0.42)));
    if (renderer.drawGfxImpactBurst) {
      renderer.drawGfxImpactBurst(effect.x, effect.y, punch * (0.8 + peak * 0.18), palette.tint, alpha * 0.18, z + 26, progress * 3.3, meteorLike || kind === "explosion" ? 12 : 8);
    }
    if (renderer.drawGfxArc) {
      const ring = punch * (0.72 + progress * 0.24);
      for (let i = 0; i < 4; i += 1) {
        const a = angle + progress * 0.45 + (Math.PI * 2 * i) / 4;
        renderer.drawGfxArc(effect.x, effect.y, ring + i * 7, a - 0.18, a + 0.18, i % 2 ? 3 : 5, i % 2 ? palette.tint : palette.light, alpha * (0.2 - i * 0.028), z + 8 + i, "add", 4);
      }
    }
    renderer.renderParticlePreset?.(meteorLike ? "fireBurst" : palette.preset, {
      x: effect.x,
      y: effect.y,
      radius: punch * 0.95,
      color: palette.light,
      alpha: alpha * 0.34,
      zIndex: z + 32,
      phase: progress * 2.5,
      count: meteorLike || kind === "explosion" ? 10 : 7,
      direction: Number.isFinite(effect.angle) ? Number(effect.angle) : undefined,
      spread: Math.PI * 1.2
    });
    return true;
  }

  function renderSkillAuraPolish(renderer, context, palette) {
    const { effect, progress, alpha, s, kind, effectRadius, peak, z } = context;
    if (s.includes("taunt")) return false;
    if (s.includes("frost_breath")) {
      const baseRadius = Math.max(36, effectRadius * 0.88);
      const baseAngle = Number(effect.seed || 0) * 0.17;
      renderer.drawGfxCircle?.(effect.x, effect.y, baseRadius, "#071923", alpha * 0.014, "#93c5fd", alpha * 0.07, 1.5, z - 20, "add", 52);
      if (renderer.drawGfxArc) {
        for (let i = 0; i < 3; i += 1) {
          const a = baseAngle + (Math.PI * 2 * i) / 3;
          renderer.drawGfxArc(effect.x, effect.y, baseRadius * (0.62 + i * 0.11), a - 0.2, a + 0.34, 2, i % 2 ? palette.tint : palette.light, alpha * 0.055, z - 16 + i, "add", 6);
        }
      }
      return true;
    }
    const auraLike =
      kind === "warning" ||
      kind === "shield" ||
      kind === "cleanse" ||
      kind === "revive" ||
      kind === "holy" ||
      kind === "freeze" ||
      kind === "slow" ||
      s.includes("focus") ||
      s.includes("cage") ||
      s.includes("theater") ||
      s.includes("smoke") ||
      s.includes("frost") ||
      s.includes("elixir");
    if (!auraLike) return false;

    const fullFrostWave = s.includes("frost_wave");
    const baseRadius = fullFrostWave
      ? Math.max(32, effectRadius * 0.86)
      : Math.max(32, Math.min(150, effectRadius * (kind === "warning" ? 0.86 : 0.58)));
    if (renderer.drawGfxRuneRing && !s.includes("taunt") && kind !== "warning") {
      renderer.drawGfxRuneRing(effect.x, effect.y, baseRadius * (0.74 + peak * 0.04), palette.tint, alpha * 0.18, z - 16, progress * 2.1, s.includes("cage") || s.includes("theater") ? 12 : 8);
    }
    if (renderer.drawGfxArc) {
      const spokes = kind === "warning" ? 6 : 5;
      for (let i = 0; i < spokes; i += 1) {
        const a = progress * 0.5 + (Math.PI * 2 * i) / spokes;
        const span = kind === "warning" ? 0.08 : 0.13;
        renderer.drawGfxArc(effect.x, effect.y, baseRadius * (0.92 + (i % 2) * 0.06), a - span, a + span, kind === "warning" ? 4 : 3, i % 2 ? palette.light : palette.tint, alpha * (kind === "warning" ? 0.22 : 0.16), z - 12 + i, "add", 4);
      }
    }
    return true;
  }

  function renderNeonBladeWhirlwind(renderer, context, palette) {
    const { effect, progress, alpha, effectRadius, peak, z, angle } = context;
    const cx = Number.isFinite(effect.originX) ? Number(effect.originX) : effect.x;
    const cy = Number.isFinite(effect.originY) ? Number(effect.originY) : effect.y;
    const radius = Math.max(84, Math.min(360, Number(effect.rangeRadius || effect.radius || effectRadius || 128)));
    const t = Math.max(0, Math.min(1, progress));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.82) / 0.18);
    const activeAlpha = alpha * fade * (0.76 + peak * 0.18);
    const phase = Number(effect.seed || 0) * 0.13 + Number(angle || 0) * 0.22 + t * Math.PI * 4.6;
    const swirlRadius = Math.max(92, Math.min(164, radius * 0.72));
    let drew = false;

    renderer.drawGfxCircle?.(cx, cy, swirlRadius * 0.88, "#160b07", activeAlpha * 0.04, "#f97316", activeAlpha * 0.18, 3, z + 22, "add", 64);
    renderer.drawGfxCircle?.(cx, cy, swirlRadius * 0.42, "#160b07", activeAlpha * 0.025, "#fde68a", activeAlpha * 0.16, 2, z + 24, "add", 40);
    for (let i = 0; i < 3; i += 1) {
      const a = phase + (Math.PI * 2 * i) / 3;
      const start = a - 0.58;
      const end = a + 0.98;
      const outer = swirlRadius * (0.82 + (i % 2) * 0.03);
      const inner = swirlRadius * 0.54;
      renderer.drawGfxCleaveRibbon?.(cx, cy, inner, outer, start, end, "#fff7ed", activeAlpha * 0.13, "#fde68a", activeAlpha * 0.28, 3, z + 56 + i * 8, "add", 14);
      renderer.drawGfxArc?.(cx, cy, outer * 1.01, start + 0.08, end - 0.05, 6, "#fff7ed", activeAlpha * 0.42, z + 62 + i * 8, "add", 12);
      renderer.drawGfxArc?.(cx, cy, inner * 0.92, start + 0.26, end - 0.22, 3, "#f97316", activeAlpha * 0.2, z + 66 + i * 8, "add", 9);
    }
    renderer.drawGfxImpactBurst?.(cx, cy, swirlRadius * 0.16, "#fde68a", activeAlpha * 0.08, z + 116, phase, 6);
    renderer.renderParticlePreset?.("slashTrail", {
      x: cx,
      y: cy,
      radius: swirlRadius * 0.5,
      angle: phase,
      color: "#fde68a",
      alpha: activeAlpha * 0.18,
      zIndex: z + 120,
      count: 8,
      phase
    });
    drew = true;
    return drew;
  }

  function renderNeonClassSignatureLayer(renderer, context, palette) {
    if (!renderer || !context || context.alpha <= 0.02) return false;
    const { effect, progress, alpha, s, kind, angle, effectRadius, end, peak, z } = context;
    const cx = effect.x;
    const cy = effect.y;
    const radius = Math.max(42, Math.min(360, effectRadius || context.radius || Number(effect.radius || 72)));
    const phase = Number(effect.seed || 0) + progress * Math.PI * 2;
    const glow = alpha * (0.18 + peak * 0.24);
    let drew = false;

    const drawShardRing = (count, ringRadius, color, width = 3, spin = 1) => {
      for (let i = 0; i < count; i += 1) {
        const a = phase * spin + (Math.PI * 2 * i) / count;
        const inner = ringRadius * (0.64 + (i % 2) * 0.08);
        const outer = ringRadius * (0.94 + (i % 3) * 0.04);
        renderer.drawGfxLine(
          cx + Math.cos(a) * inner,
          cy + Math.sin(a) * inner,
          cx + Math.cos(a) * outer,
          cy + Math.sin(a) * outer,
          width,
          color,
          glow * (0.72 - (i % 3) * 0.09),
          z + 30 + i,
          "add"
        );
      }
      drew = true;
    };

    const directional = end && Number.isFinite(end.fromX) && Number.isFinite(end.toX);
    if (directional && s.includes("warrior_dash")) {
      if (renderer.drawGfxDashDust) {
        renderer.drawGfxDashDust(end.fromX, end.fromY, end.toX, end.toY, Math.max(34, radius * 0.34), angle, "#caa35a", alpha * 0.7, z + 28, progress, {});
      }
      renderer.renderParticlePreset?.("hitSpark", {
        x: end.toX,
        y: end.toY,
        radius: radius * 0.34,
        color: "#fde68a",
        alpha: alpha * 0.2,
        zIndex: z + 62,
        count: 8,
        phase
      });
      return true;
    }
    if (s.includes("warrior_spin") || (kind === "spin" && s.includes("warrior"))) {
      return renderNeonBladeWhirlwind(renderer, context, palette);
    }
    if (s.includes("taunt")) {
      return false;
    }
    if (s.includes("warrior") || s.includes("cleave") || s.includes("spin") || kind === "slash" || kind === "spin") {
      const sweep = s.includes("cleave") ? 1.85 : s.includes("spin") ? Math.PI * 1.55 : 1.2;
      const base = angle - sweep * 0.44 + progress * 0.45;
      for (let i = 0; i < 4; i += 1) {
        renderer.drawGfxArc(cx, cy, radius * (0.38 + i * 0.12), base + i * 0.12, base + sweep - i * 0.08, 8 - i, i === 0 ? "#fff7ed" : palette.tint, alpha * (0.42 - i * 0.055), z + 50 + i, "add", 14);
      }
      const bladeAngle = s.includes("spin") ? angle + progress * Math.PI * 2.2 : angle + (progress - 0.5) * sweep * 0.52;
      const hiltX = cx - Math.cos(bladeAngle) * radius * 0.12;
      const hiltY = cy - Math.sin(bladeAngle) * radius * 0.12;
      const tipX = cx + Math.cos(bladeAngle) * radius * (s.includes("cleave") ? 0.86 : 0.72);
      const tipY = cy + Math.sin(bladeAngle) * radius * (s.includes("cleave") ? 0.86 : 0.72);
      const guard = Math.max(12, radius * 0.13);
      renderer.drawGfxLine(hiltX, hiltY, tipX, tipY, s.includes("cleave") ? 11 : 8, "#fff7ed", alpha * 0.64, z + 88, "add");
      renderer.drawGfxLine(hiltX - Math.sin(bladeAngle) * guard, hiltY + Math.cos(bladeAngle) * guard, hiltX + Math.sin(bladeAngle) * guard, hiltY - Math.cos(bladeAngle) * guard, 5, palette.tint, alpha * 0.48, z + 89, "add");
      renderer.drawGfxImpactBurst?.(tipX, tipY, radius * 0.18, palette.light, alpha * 0.2, z + 92, phase, 7);
      drawShardRing(s.includes("spin") ? 18 : 10, radius * 0.56, palette.light, 4, s.includes("spin") ? 1.8 : 0.8);
      renderer.renderParticlePreset?.("slashTrail", { x: cx, y: cy, radius: radius * 0.64, angle, color: palette.light, alpha: alpha * 0.46, zIndex: z + 82, count: s.includes("cleave") ? 16 : 10, phase });
      return true;
    }

    if (s.includes("ranger") || s.includes("arrow") || s.includes("piercing") || s.includes("barrage") || kind === "shot") {
      if (directional) {
        const dx = end.toX - end.fromX;
        const dy = end.toY - end.fromY;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        for (let lane = -1; lane <= 1; lane += 1) {
          const offset = lane * Math.min(32, radius * 0.16);
          renderer.drawGfxLine(end.fromX + px * offset, end.fromY + py * offset, end.toX + px * offset * 0.35, end.toY + py * offset * 0.35, lane === 0 ? 7 : 3, lane === 0 ? "#f8fafc" : palette.tint, alpha * (lane === 0 ? 0.46 : 0.26), z + 45 + lane, "add");
        }
        for (let i = 0; i < 5; i += 1) {
          const t = 0.22 + i * 0.15;
          const x = end.fromX + dx * t;
          const y = end.fromY + dy * t;
          renderer.drawGfxLine(x - ux * 18 + px * 9, y - uy * 18 + py * 9, x + ux * 18, y + uy * 18, 3, palette.light, alpha * 0.3, z + 60 + i, "add");
          renderer.drawGfxLine(x - ux * 18 - px * 9, y - uy * 18 - py * 9, x + ux * 18, y + uy * 18, 3, palette.light, alpha * 0.3, z + 61 + i, "add");
        }
        for (let i = 0; i < 4; i += 1) {
          const t = 0.18 + i * 0.2;
          const x = end.fromX + dx * t;
          const y = end.fromY + dy * t;
          const size = 9 + (i % 2) * 3;
          renderer.drawGfxLine(x - ux * size + px * size * 0.7, y - uy * size + py * size * 0.7, x + ux * size, y + uy * size, 4, "#f8fafc", alpha * 0.34, z + 76 + i, "add");
          renderer.drawGfxLine(x - ux * size - px * size * 0.7, y - uy * size - py * size * 0.7, x + ux * size, y + uy * size, 4, palette.tint, alpha * 0.28, z + 80 + i, "add");
        }
        renderer.renderParticlePreset?.("bladeGlint", { x: end.toX, y: end.toY, radius: radius * 0.28, color: palette.light, alpha: alpha * 0.3, zIndex: z + 86, count: 7, phase, direction: angle, spread: Math.PI * 0.45 });
      }
      renderer.drawGfxCircle(cx, cy, radius * 0.32, "#000000", 0, palette.tint, alpha * 0.28, 3, z + 20, "add", 26);
      return true;
    }

    if (s.includes("mage") || s.includes("frost") || s.includes("meteor") || s.includes("lightning") || kind === "chain" || kind === "freeze" || kind === "meteor") {
      const cold = s.includes("frost") || s.includes("freeze") || kind === "freeze";
      const fire = s.includes("meteor") || s.includes("fire") || kind === "meteor";
      if (fire && progress < 0.72) return false;
      const core = cold ? "#dbeafe" : fire ? "#fed7aa" : "#e0e7ff";
      renderer.drawGfxCircle(cx, cy, radius * 0.5, cold ? "#38bdf8" : fire ? "#f97316" : "#7dd3fc", alpha * 0.06, core, alpha * 0.28, 3, z + 20, "add", 38);
      renderer.drawGfxCircle(cx, cy, radius * (0.22 + peak * 0.08), core, alpha * 0.12, core, alpha * 0.42, 2, z + 35, "add", 24);
      renderer.drawGfxRuneRing?.(cx, cy, radius * 0.44, core, alpha * 0.28, z + 48, phase * (cold ? -0.2 : 0.28), fire ? 10 : 8);
      if (!cold && !fire) renderer.drawGfxStar?.(cx, cy, radius * 0.34, "#c4b5fd", alpha * 0.26, z + 54, 8);
      if (fire) renderer.drawGfxImpactBurst?.(cx, cy, radius * 0.36, "#fb923c", alpha * 0.18, z + 56, phase, 11);
      drawShardRing(cold ? 16 : fire ? 12 : 18, radius * 0.54, core, cold ? 4 : 3, cold ? 0.25 : 1.4);
      if (fire) renderer.renderParticlePreset?.("fire", { x: cx, y: cy, radius: radius * 0.72, color: "#f97316", alpha: alpha * 0.36, zIndex: z + 70, count: 20, phase });
      if (cold && !s.includes("frost_breath")) renderer.renderParticlePreset?.("frost", { x: cx, y: cy, radius: radius * 0.62, color: "#93c5fd", alpha: alpha * 0.4, zIndex: z + 70, count: 18, phase });
      return true;
    }

    if (s.includes("engineer") || s.includes("turret") || s.includes("mine") || s.includes("drone") || s.includes("rail")) {
      renderer.drawGfxCircle(cx, cy, radius * 0.42, "#0f172a", alpha * 0.16, "#67e8f9", alpha * 0.36, 3, z + 18, "add", 6);
      renderer.drawGfxGear?.(cx, cy, radius * 0.46, "#67e8f9", alpha * 0.42, z + 26, phase * 0.18, 12);
      for (let i = 0; i < 8; i += 1) {
        const a = phase * 0.35 + (Math.PI * 2 * i) / 8;
        renderer.drawGfxLine(cx + Math.cos(a) * radius * 0.28, cy + Math.sin(a) * radius * 0.28, cx + Math.cos(a) * radius * 0.56, cy + Math.sin(a) * radius * 0.56, 4, i % 2 ? "#ffd166" : "#67e8f9", alpha * 0.32, z + 35 + i, "add");
      }
      if (directional) {
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 5, "#67e8f9", alpha * 0.34, z + 48, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 11, "#22d3ee", alpha * 0.1, z + 47, "add");
      }
      return true;
    }

    if (s.includes("puppet") || s.includes("thread")) {
      const r = radius * 0.56;
      for (let i = 0; i < 6; i += 1) {
        const a = phase * 0.25 + (Math.PI * 2 * i) / 6;
        const b = a + Math.PI * 0.74;
        renderer.drawGfxLine(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(b) * r, cy + Math.sin(b) * r, 2.5, i % 2 ? "#f5d0fe" : palette.tint, alpha * 0.34, z + 30 + i, "add");
      }
      for (let i = 0; i < 4; i += 1) {
        const a = phase * -0.18 + (Math.PI * 2 * i) / 4 + Math.PI / 4;
        renderer.drawGfxDiamond?.(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72, 7 + (i % 2) * 2, "#f5d0fe", alpha * 0.36, z + 46 + i, a, palette.tint);
      }
      renderer.drawGfxCircle(cx, cy, radius * 0.18, "#581c87", alpha * 0.18, "#f5d0fe", alpha * 0.32, 2, z + 50, "add", 18);
      return true;
    }

    if (s.includes("martial") || s.includes("palm") || s.includes("rising") || s.includes("combo")) {
      for (let i = 0; i < 3; i += 1) {
        renderer.drawGfxCircle(cx, cy, radius * (0.22 + i * 0.16 + progress * 0.12), "#000000", 0, i === 1 ? "#fff7ed" : "#fb923c", alpha * (0.34 - i * 0.07), 4 - i * 0.5, z + 24 + i, "add", 30);
      }
      for (let i = 0; i < 5; i += 1) {
        const a = angle + (i - 2) * 0.28;
        renderer.drawGfxLine(cx + Math.cos(a) * radius * 0.12, cy + Math.sin(a) * radius * 0.12, cx + Math.cos(a) * radius * (0.48 + i * 0.04), cy + Math.sin(a) * radius * (0.48 + i * 0.04), i === 2 ? 8 : 4, i === 2 ? "#fff7ed" : "#fdba74", alpha * (i === 2 ? 0.42 : 0.24), z + 46 + i, "add");
      }
      drawShardRing(12, radius * 0.46, "#fed7aa", 4, 0.6);
      return true;
    }

    if (s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("flask") || s.includes("poison") || kind === "poison") {
      renderer.drawGfxCircle(cx, cy, radius * 0.5, "#16340e", alpha * 0.18, "#bef264", alpha * 0.3, 3, z + 16, "add", 32);
      renderer.drawGfxFlask?.(cx - Math.cos(angle) * radius * 0.08, cy - Math.sin(angle) * radius * 0.08, angle - 0.6 + progress * 1.2, s.includes("fire") ? "#fb923c" : "#bef264", alpha * 0.58, z + 42, Math.max(1, radius / 90));
      for (let i = 0; i < 14; i += 1) {
        const a = phase * 0.4 + (Math.PI * 2 * i) / 14;
        const d = radius * (0.2 + (i % 5) * 0.085 + progress * 0.08);
        renderer.drawGfxCircle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.72, 5 + (i % 3) * 3, i % 2 ? "#bef264" : "#67e8f9", alpha * 0.2, "#ecfccb", alpha * 0.16, 1, z + 30 + i, "add", 8);
      }
      return true;
    }

    if (s.includes("assassin") || s.includes("shadow") || s.includes("smoke") || s.includes("stalker")) {
      for (let i = 0; i < 5; i += 1) {
        const side = i - 2;
        const off = side * radius * 0.09;
        renderer.drawGfxLine(cx - Math.cos(angle) * radius * 0.58 - Math.sin(angle) * off, cy - Math.sin(angle) * radius * 0.58 + Math.cos(angle) * off, cx + Math.cos(angle) * radius * 0.72 - Math.sin(angle) * off, cy + Math.sin(angle) * radius * 0.72 + Math.cos(angle) * off, i === 2 ? 7 : 3, i === 2 ? "#f5d0fe" : palette.tint, alpha * (i === 2 ? 0.48 : 0.22), z + 40 + i, "add");
      }
      for (let i = 0; i < 2; i += 1) {
        const a = angle + (i ? Math.PI * 0.5 : -Math.PI * 0.5);
        renderer.drawGfxLine(cx - Math.cos(a) * radius * 0.18, cy - Math.sin(a) * radius * 0.18, cx + Math.cos(a) * radius * 0.52, cy + Math.sin(a) * radius * 0.52, 5, "#f5d0fe", alpha * 0.32, z + 54 + i, "add");
      }
      renderer.renderParticlePreset?.("smokePuff", { x: cx, y: cy, radius: radius * 0.52, color: "#c084fc", alpha: alpha * 0.24, zIndex: z + 58, count: 10, phase });
      renderer.drawGfxCircle(cx, cy, radius * 0.46, "#160824", alpha * 0.18, "#c084fc", alpha * 0.18, 2, z + 22, "add", 28);
      return true;
    }

    if (s.includes("holy") || s.includes("cleanse") || s.includes("revive") || kind === "heal" || kind === "shield") {
      renderer.drawGfxCircle(cx, cy, radius * 0.48, "#064e3b", alpha * 0.08, "#bbf7d0", alpha * 0.32, 3, z + 22, "add", 34);
      renderer.drawGfxRuneRing?.(cx, cy, radius * 0.46, "#bbf7d0", alpha * 0.22, z + 32, phase * -0.12, 10);
      renderer.drawGfxLine(cx - radius * 0.18, cy, cx + radius * 0.18, cy, 7, "#f0fdf4", alpha * 0.48, z + 45, "add");
      renderer.drawGfxLine(cx, cy - radius * 0.18, cx, cy + radius * 0.18, 7, "#f0fdf4", alpha * 0.48, z + 46, "add");
      drawShardRing(10, radius * 0.52, "#86efac", 3, -0.5);
      return true;
    }

    return drew;
  }

  function renderSkillEffectPolishLayer(renderer, context) {
    if (!renderer || !context || !context.s || context.alpha <= 0.02) return false;
    if (context.s.includes("drone_bolt") || context.s.includes("single_laser") || context.s.includes("adaptive_continuous_laser")) return false;
    if (context.s.includes("warrior_forward_whirlwind_launch")) return false;
    if (
      context.s.includes("frost") ||
      context.s.includes("flame_wave") ||
      context.s.includes("flame_breath") ||
      context.s.includes("freeze") ||
      context.s.includes("ice") ||
      context.s.includes("meteor") ||
      context.s.includes("star_orb") ||
      context.s.includes("star_burst") ||
      context.s.includes("star_split") ||
      context.s.includes("arcane_splash") ||
      context.s.includes("mage_blink") ||
      context.s.includes("chain_lightning")
    ) {
      return false;
    }
    const palette = skillPolishPalette(context);
    const drewNeon = renderNeonClassSignatureLayer(renderer, context, palette);
    const drewDirection = renderSkillDirectionPolish(renderer, context, palette);
    const drewImpact = renderSkillImpactPolish(renderer, context, palette);
    const drewAura = renderSkillAuraPolish(renderer, context, palette);
    return drewNeon || drewDirection || drewImpact || drewAura;
  }

  window.RoguePixiSkillEffects = Object.freeze({
    normalizeSkillStyle,
    skillEffectPhase,
    fallbackEffectEndpoints,
    createStyledSkillContext,
    shouldRenderStyledSkill,
    renderWarriorStyledSkillEffect,
    renderWarriorImpactEffect,
    renderWarriorShieldChargeEffect,
    renderWarriorSpinEffect,
    renderWarriorTauntRingEffect,
    renderWarriorSlamEffect,
    renderWarriorBodyEffect,
    renderRangerStyledSkillEffect,
    renderRangerArrowRainEffect,
    renderRangerVolleyEffect,
    renderMageStyledSkillEffect,
    renderMageFlameEffect,
    renderMageFrostEffect,
    renderMageMeteorEffect,
    renderMageChainEffect,
    renderMageStarBurstEffect,
    renderMageBlinkEffect,
    renderEngineerStyledSkillEffect,
    renderEngineerBeamEffect,
    renderEngineerDroneBoltEffect,
    renderEngineerDroneEffect,
    renderEngineerMineEffect,
    renderEngineerDeviceEffect,
    renderPuppetStyledSkillEffect,
    renderPuppetThreadLinesEffect,
    renderPuppetSummonEffect,
    renderPuppetSlashEffect,
    renderPuppetThreadKnotEffect,
    renderMartialStyledSkillEffect,
    renderMartialPalmEffect,
    renderMartialRisingEffect,
    renderMartialMeleeEffect,
    renderAlchemistStyledSkillEffect,
    renderAlchemistThrowEffect,
    renderAlchemistElixirEffect,
    renderAlchemistReactionEffect,
    renderAssassinStyledSkillEffect,
    renderAssassinLungeEffect,
    renderAssassinSmokeEffect,
    renderAssassinMarkEffect,
    renderAssassinMeleeEffect,
    commonDangerColor,
    renderCommonStyledEffect,
    renderCommonWarningEffect,
    renderCommonImpactEffect,
    renderExplosionRangeBoundary,
    renderCrispCommonStyledEffect,
    renderCrispPrimaryClassStyledEffect,
    renderCrispRangerEffect,
    renderCrispMageEffect,
    renderCrispEngineerEffect,
    renderCrispClassStyledEffect,
    renderCrispAlchemistEffect,
    renderCrispPuppetEffect,
    renderCrispMartialEffect,
    renderCrispAssassinEffect,
    skillPolishPalette,
    renderSkillDirectionPolish,
    renderSkillImpactPolish,
    renderSkillAuraPolish,
    renderNeonClassSignatureLayer,
    renderPixelOnlySkillEffect,
    renderPixelSkillLayer,
    renderSkillEffectPolishLayer,
  });
})();
