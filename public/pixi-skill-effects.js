(() => {
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

  function createStyledSkillContext(renderer, effect, progress, alpha, radius, color, style) {
    const s = normalizeSkillStyle(style);
    if (!s) return null;
    const kind = effect.kind || "";
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
      angle,
      peak: phase.peak,
      pulse: phase.pulse,
      effectRadius,
      end,
      z: effect.y + 108,
    };
  }

  function shouldRenderStyledSkill(style) {
    return normalizeSkillStyle(style).length > 0;
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
    renderer.drawGfxShieldWake(end.fromX, end.fromY, headX, headY, width * 1.08, angle, "#f97316", wakeAlpha, z - 14, progress);
    renderer.drawGfxShieldPlow(headX, headY, angle, width * 1.18, "#f97316", chargeAlpha, z + 8, progress);
    renderer.drawGfxShieldWall(headX + Math.cos(angle) * width * 0.18, headY + Math.sin(angle) * width * 0.18, angle, width * 0.72, "#f97316", alpha * 0.52, z + 12, false);
    for (let i = -2; i <= 2; i += 1) {
      const side = i * width * 0.2;
      const sx = headX - Math.cos(angle) * width * (0.86 + Math.abs(i) * 0.04) + px * side;
      const sy = headY - Math.sin(angle) * width * (0.86 + Math.abs(i) * 0.04) + py * side;
      const ex = headX - Math.cos(angle) * width * (0.22 + Math.abs(i) * 0.06) + px * side * 0.72;
      const ey = headY - Math.sin(angle) * width * (0.22 + Math.abs(i) * 0.06) + py * side * 0.72;
      renderer.drawGfxLine(sx, sy, ex, ey, i === 0 ? 10 : 5, i === 0 ? "#fff7ed" : "#fde68a", alpha * (i === 0 ? 0.34 : 0.2), z - 5 + i, "add");
    }
    renderer.renderParticlePreset?.("hitSpark", {
      x: headX + Math.cos(angle) * width * 0.48,
      y: headY + Math.sin(angle) * width * 0.48,
      radius: width * 0.56,
      color: "#fde68a",
      alpha: alpha * 0.46,
      zIndex: z + 18,
      phase: progress * 3.1,
      count: 11,
      direction: angle,
      spread: Math.PI * 0.68
    }) || renderer.drawGfxSparkSpray(headX + Math.cos(angle) * width * 0.48, headY + Math.sin(angle) * width * 0.48, width * 0.56, "#fde68a", alpha * 0.36, z + 18, 11, progress * 3.1, angle, Math.PI * 0.68);
    if (travel >= 1) {
      renderer.drawGfxShieldCrash(end.toX, end.toY, angle, width, "#f97316", alpha * Math.max(0.2, 1 - (progress - moveDuration / fullDuration) * 3), z + 18, progress);
    }
    return true;
  }

  function renderWarriorSpinEffect(renderer, context) {
    const { effect, progress, alpha, radius, angle, peak, z, kind } = context;
    if (kind !== "spin") return false;
    const spinRadius = Math.max(120, Number(effect.rangeRadius || effect.radius || radius));
    const ease = 1 - Math.pow(1 - progress, 3);
    const bladeAngle = angle - Math.PI * 0.5 + progress * Math.PI * 2;
    const bladeReach = spinRadius * (0.84 + peak * 0.04);
    const waveRadius = spinRadius * (0.3 + ease * 0.68);
    for (let layer = 0; layer < 3; layer += 1) {
      const r = waveRadius - layer * 14;
      const pieces = 10 + layer * 2;
      if (r < 32) continue;
      for (let i = 0; i < pieces; i += 1) {
        if ((i + layer) % 3 === 1) continue;
        const a = (Math.PI * 2 * i) / pieces + progress * 0.5;
        const span = 0.11 + layer * 0.025;
        renderer.drawGfxArc(effect.x, effect.y, r, a - span, a + span, layer === 0 ? 5 : 3.5, layer === 1 ? "#fde68a" : "#f97316", alpha * (0.26 - layer * 0.055), z - 12 + layer * 2 + i, "add", 4);
      }
    }
    for (let i = 3; i >= 1; i -= 1) {
      const ghostAngle = bladeAngle - i * 0.34;
      renderer.drawGfxGreatsword(effect.x, effect.y, ghostAngle, bladeReach * (0.96 - i * 0.035), i === 1 ? "#fde68a" : "#f97316", alpha * (0.15 + (3 - i) * 0.055), z + 5 - i, false);
    }
    renderer.drawGfxCleaveRibbon(effect.x, effect.y, spinRadius * 0.42, bladeReach * 0.98, bladeAngle - 0.72, bladeAngle - 0.12, "#f97316", alpha * 0.07, "#fde68a", alpha * 0.18, 3, z + 4, "add", 14);
    renderer.drawGfxGreatsword(effect.x, effect.y, bladeAngle, bladeReach, "#f97316", alpha * (0.88 + peak * 0.1), z + 12, true);
    const tipX = effect.x + Math.cos(bladeAngle) * bladeReach * 0.96;
    const tipY = effect.y + Math.sin(bladeAngle) * bladeReach * 0.96;
    renderer.renderParticlePreset?.("slashTrail", {
      x: tipX,
      y: tipY,
      radius: 42,
      color: "#fde68a",
      alpha: alpha * 0.44,
      zIndex: z + 18,
      phase: progress * 3.2,
      count: 10,
      direction: bladeAngle,
      spread: Math.PI * 0.58
    }) || renderer.drawGfxSparkSpray(tipX, tipY, 42, "#fde68a", alpha * 0.36, z + 18, 10, progress * 3.2, bladeAngle, Math.PI * 0.58);
    renderer.drawGfxImpactBurst(tipX, tipY, 28 + peak * 10, "#f97316", alpha * 0.16, z + 20, progress * 2.4, 6);
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
    if (renderWarriorSpinEffect(renderer, context)) return true;
    if (renderWarriorSlamEffect(renderer, context)) return true;
    renderer.renderWarriorConeEffect(effect, progress, alpha, color, s.includes("cleave"));
    return true;
  }

  function renderWarriorStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const { effect, progress, alpha, radius, s, z } = context;
    if (s.includes("taunt")) {
      const tauntRadius = Math.max(80, Number(effect.rangeRadius || effect.radius || radius));
      renderer.drawGfxShoutWave(effect.x, effect.y, tauntRadius, "#f97316", alpha * 0.9, z, progress);
      renderer.renderParticlePreset?.("hitSpark", {
        x: effect.x,
        y: effect.y - 10,
        radius: tauntRadius * 0.42,
        color: "#fde68a",
        alpha: alpha * 0.42,
        zIndex: z + 12,
        phase: progress * 3.6,
        count: 10,
        direction: -Math.PI / 2,
        spread: Math.PI * 0.82
      }) || renderer.drawGfxSparkSpray(effect.x, effect.y - 10, tauntRadius * 0.42, "#fde68a", alpha * 0.34, z + 12, 10, progress * 3.6, -Math.PI / 2, Math.PI * 0.82);
      return true;
    }
    return (
      renderWarriorImpactEffect(renderer, context) ||
      renderWarriorShieldChargeEffect(renderer, context) ||
      renderWarriorBodyEffect(renderer, context)
    );
  }

  function renderRangerArrowRainEffect(renderer, context) {
    const { effect, progress, alpha, effectRadius, kind, z, s } = context;
    if (!s.includes("arrow_rain")) return false;
    const rainRadius = effectRadius;
    renderer.fx("fx-warning-target", effect.x, effect.y, rainRadius / 48, rainRadius / 48, "#f1d08b", alpha * (kind === "warning" ? 0.56 : 0.28), z - 22, progress * 0.8, "add");
    const dropCount = kind === "warning" ? 5 : 8;
    for (let i = 0; i < dropCount; i += 1) {
      const a = (Math.PI * 2 * i) / dropCount + renderer.noise(i, effect.x) * 0.5;
      const r = rainRadius * (0.16 + renderer.noise(i * 3, effect.y) * 0.62);
      const fall = (progress + i / dropCount) % 1;
      const x = effect.x + Math.cos(a) * r;
      const y = effect.y + Math.sin(a) * r - 80 + fall * 120;
      const arrow = renderer.fx("fx-arrow-rain", x, y, 0.42, 0.5, "#f1d08b", alpha * 0.82, z + i, 0, "add");
      arrow.alpha *= kind === "warning" ? 0.7 : 1;
    }
    return true;
  }

  function renderRangerVolleyEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, end, z } = context;
    if (!(s.includes("ranger_barrage") || s.includes("arrow_fan") || s.includes("piercing") || s.includes("poison_volley") || s.includes("poison_arrow"))) {
      return false;
    }
    if (s.includes("piercing")) {
      renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 9, "#f1d08b", alpha * 0.22, z - 8, "add");
      renderer.fx("fx-pierce-lance", effect.x, effect.y, 1.02 + peak * 0.2, 0.92, "#f1d08b", alpha * 0.9, z, angle, "add");
      renderer.fx("fx-impact-star", end.toX, end.toY, 0.42, 0.42, "#fde68a", alpha * 0.5, z + 3, progress * 1.4, "add");
    } else {
      const poisonTint = s.includes("poison") ? "#bef264" : "#f1d08b";
      renderer.fx("fx-arrow-fan", effect.x, effect.y, 0.98 + peak * 0.16, 0.9 + peak * 0.1, poisonTint, alpha * 0.88, z, angle, "add");
      if (s.includes("poison")) {
        renderer.fx("fx-poison-cloud", effect.x + Math.cos(angle) * 42, effect.y + Math.sin(angle) * 22, 0.46, 0.36, "#bef264", alpha * 0.46, z + 2, progress, "add");
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
    if (!s.includes("frost")) return false;
    const frostRadius = effectRadius;
    const snap = progress < 0.24 ? 1.24 : 1.08 - (progress - 0.24) * 0.28;
    renderer.fx("fx-frost-snap", effect.x, effect.y, frostRadius / 86 * snap, frostRadius / 86 * snap, "#dbeafe", alpha * 0.95, z, progress * 0.15, "add");
    renderer.fx("fx-frost-shards", effect.x, effect.y, frostRadius / 94 * pulse, frostRadius / 94 * pulse, "#93c5fd", alpha * 0.45, z - 2, -progress * 0.35, "add");
    renderer.ring(effect.x, effect.y, frostRadius * (0.72 + peak * 0.1), "#93c5fd", alpha * 0.25, 4);
    return true;
  }

  function renderMageMeteorEffect(renderer, context) {
    const { effect, progress, alpha, effectRadius, peak, z, s } = context;
    if (!s.includes("meteor")) return false;
    const meteorRadius = effectRadius;
    const fall = Math.min(1, progress * 1.45);
    const startX = effect.x - meteorRadius * 0.62;
    const startY = effect.y - meteorRadius * 1.65;
    const x = startX + (effect.x - startX) * fall;
    const y = startY + (effect.y - startY) * fall;
    renderer.fx("fx-meteor-fall", x, y, 0.82 + fall * 0.34, 0.82 + fall * 0.34, "#f97316", alpha * 0.94, z + 4, 0.78, "add");
    renderer.lineFx("beam", startX, startY, x, y, 18, "#f97316", alpha * 0.22, z - 4, "add");
    if (progress > 0.4) {
      renderer.fx("fx-fire-bloom", effect.x, effect.y, meteorRadius / 70 + peak * 0.28, meteorRadius / 70 + peak * 0.28, "#f97316", alpha * 0.74, z + 8, progress * 1.6, "add");
      renderer.fx("fx-fire-pool", effect.x, effect.y + 12, meteorRadius / 78, meteorRadius / 90, "#f97316", alpha * 0.48, z + 1, 0, "add");
    }
    return true;
  }

  function renderMageChainEffect(renderer, context) {
    const { effect, progress, alpha, s, kind, peak, end, z } = context;
    if (!(s.includes("chain_lightning") || s.includes("engineer_overclock") || (kind === "chain" && (s.includes("lightning") || s.includes("electric"))))) {
      return false;
    }
    renderer.lineFx("fx-lightning", end.fromX, end.fromY, end.toX, end.toY, 18, "#9ee6ff", alpha * 0.96, z, "add");
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 6, "#dbeafe", alpha * 0.28, z - 2, "add");
    renderer.fx("fx-impact-star", end.toX, end.toY, 0.46 + peak * 0.12, 0.46 + peak * 0.12, "#dbeafe", alpha * 0.62, z + 4, progress * 2, "add");
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
      renderMageFrostEffect(renderer, context) ||
      renderMageMeteorEffect(renderer, context) ||
      renderMageChainEffect(renderer, context) ||
      renderMageStarBurstEffect(renderer, context) ||
      renderMageBlinkEffect(renderer, context)
    );
  }

  function renderEngineerBeamEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, end, z } = context;
    if (!(s.includes("turret_fire") || s.includes("rail_turret") || s.includes("drone_laser") || s.includes("engineer_bolt"))) {
      return false;
    }
    const rail = s.includes("rail");
    renderer.lineFx(rail ? "beam" : "fx-lightning", end.fromX, end.fromY, end.toX, end.toY, rail ? 12 : 10, rail ? "#fde68a" : "#9ee6ff", alpha * 0.72, z, "add");
    renderer.fx("fx-impact-star", effect.x, effect.y, 0.36 + peak * 0.1, 0.36 + peak * 0.1, "#9ee6ff", alpha * 0.52, z + 2, progress * 2, "add");
    return true;
  }

  function renderEngineerDroneEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, z } = context;
    if (!s.includes("drone")) return false;
    renderer.fx("fx-drone", effect.x, effect.y - 8, 0.82 + peak * 0.12, 0.82 + peak * 0.12, "#d6b76d", alpha * 0.86, z, progress * 0.1, "normal");
    renderer.fx("fx-lightning", effect.x, effect.y, 0.58, 0.26, "#9ee6ff", alpha * 0.42, z + 2, angle, "add");
    return true;
  }

  function renderEngineerMineEffect(renderer, context) {
    const { effect, progress, alpha, s, peak, effectRadius, z } = context;
    if (!s.includes("shock_mine")) return false;
    renderer.fx("fx-mine", effect.x, effect.y, 0.94 + peak * 0.18, 0.94 + peak * 0.18, "#9ee6ff", alpha * 0.82, z, progress * 1.4, "add");
    renderer.fx("fx-lightning", effect.x, effect.y, effectRadius / 88, 0.62, "#9ee6ff", alpha * 0.56, z + 1, progress * 2.2, "add");
    return true;
  }

  function renderEngineerDeviceEffect(renderer, context) {
    const { effect, alpha, s, angle, peak, end, z } = context;
    if (!(s.includes("engineer") || s.includes("turret") || s.includes("rail_"))) return false;
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 7, "#d6b76d", alpha * 0.22, z - 4, "add");
    renderer.fx("fx-turret", effect.x, effect.y, 0.78 + peak * 0.14, 0.78 + peak * 0.14, "#d6b76d", alpha * 0.86, z, angle, "normal");
    return true;
  }

  function renderEngineerStyledSkillEffect(renderer, context) {
    if (!context) return false;
    const s = context.s;
    if (!(s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("shock_mine") || s.includes("rail_"))) {
      return false;
    }
    return (
      renderEngineerBeamEffect(renderer, context) ||
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
    renderer.lineFx("beam", end.fromX, end.fromY, end.toX, end.toY, 15, "#8a6f9e", alpha * 0.28, z - 4, "add");
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

  function renderCommonImpactEffect(renderer, context) {
    const { effect, progress, alpha, color, s, kind, effectRadius, z } = context;
    if (!(kind === "explosion" || kind === "death" || kind === "impact")) return false;
    const fire = s.includes("fire") || s.includes("bomber") || s.includes("blast") || s.includes("meteor");
    const poison = s.includes("poison") || s.includes("acid") || s.includes("splitter");
    const tint = poison ? "#bef264" : fire ? "#f97316" : color;
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
    if (s.includes("arrow_rain")) {
      const rainRadius = effectRadius;
      const warn = kind === "warning";
      const castLift = Math.min(1, progress * 1.7);
      const skyY = effect.y - rainRadius * (1.28 + castLift * 0.2);
      renderer.drawGfxArc(effect.x, effect.y, rainRadius, -Math.PI * 0.95, -Math.PI * 0.05, warn ? 4 : 3, "#f1d08b", alpha * (warn ? 0.32 : 0.2), z - 22, "add", 14);
      renderer.drawGfxArc(effect.x, effect.y, rainRadius, Math.PI * 0.05, Math.PI * 0.95, warn ? 4 : 3, "#f1d08b", alpha * (warn ? 0.32 : 0.2), z - 22, "add", 14);
      renderer.drawGfxRuneRing(effect.x, effect.y, rainRadius * 0.74, "#fde68a", alpha * (warn ? 0.12 : 0.18), z - 20, -progress * 1.2, 8);
      renderer.drawGfxArrow(end.fromX, end.fromY, effect.x - rainRadius * 0.18, skyY, "#f1d08b", alpha * (warn ? 0.32 : 0.56), z - 12, 4);
      renderer.drawGfxArrow(end.fromX + Math.cos(angle + Math.PI / 2) * 16, end.fromY + Math.sin(angle + Math.PI / 2) * 16, effect.x + rainRadius * 0.14, skyY + 18, "#fde68a", alpha * (warn ? 0.22 : 0.42), z - 11, 3);
      const dropCount = warn ? 7 : 15;
      for (let i = 0; i < dropCount; i += 1) {
        const seed = renderer.noise(i * 19 + effect.x, effect.y * 0.1);
        const a = Math.PI * 2 * seed + i * 0.28;
        const r = rainRadius * (0.18 + renderer.noise(i * 7, effect.x) * 0.68);
        const fall = (progress * 1.45 + i / dropCount) % 1;
        const x = effect.x + Math.cos(a) * r;
        const y = effect.y + Math.sin(a) * r;
        const topX = x - 26 + fall * 28;
        const topY = skyY + fall * (rainRadius * 1.48 + (i % 3) * 12);
        const impactAlpha = fall > 0.72 ? alpha * (fall - 0.72) * 1.8 : 0;
        renderer.drawGfxArrow(topX - 18, topY - 44, topX + 10, topY + 36, i % 3 === 0 ? "#fde68a" : "#f1d08b", alpha * (warn ? 0.42 : 0.82), z + i, warn ? 3 : 4);
        renderer.drawGfxArc(x, y, 10 + peak * 4, -Math.PI * 0.05, Math.PI * 1.05, 2, "#fde68a", impactAlpha * 0.42, z + 18 + i, "add", 8);
        if (!warn && fall > 0.7) {
          renderer.renderParticlePreset?.("hitSpark", {
            x,
            y,
            radius: 20,
            color: "#fde68a",
            alpha: alpha * 0.28,
            zIndex: z + 24 + i,
            phase: progress + i,
            count: 4
          }) || renderer.drawGfxSparkSpray(x, y, 20, "#fde68a", alpha * 0.2, z + 24 + i, 4, progress + i);
        }
      }
      return true;
    }

    if (s.includes("piercing") || s.includes("arrow_fan") || s.includes("ranger_barrage") || s.includes("poison_volley") || s.includes("poison_arrow") || s.includes("assassin_fan")) {
      const poison = s.includes("poison") || s.includes("venom");
      const tint = poison ? "#bef264" : s.includes("assassin") ? "#c4b5fd" : "#f1d08b";
      if (s.includes("piercing")) {
        const laneWidth = Math.max(26, radius * 0.42);
        const px = -Math.sin(angle);
        const py = Math.cos(angle);
        renderer.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, laneWidth, tint, alpha * 0.5, z - 12);
        renderer.drawGfxLine(end.fromX + px * laneWidth * 0.34, end.fromY + py * laneWidth * 0.34, end.toX + px * laneWidth * 0.34, end.toY + py * laneWidth * 0.34, 3, tint, alpha * 0.38, z - 8, "add");
        renderer.drawGfxLine(end.fromX - px * laneWidth * 0.34, end.fromY - py * laneWidth * 0.34, end.toX - px * laneWidth * 0.34, end.toY - py * laneWidth * 0.34, 3, tint, alpha * 0.38, z - 8, "add");
        renderer.drawGfxArrow(end.fromX - Math.cos(angle) * 18, end.fromY - Math.sin(angle) * 18, end.toX, end.toY, "#f8f3e9", alpha * 0.92, z + 3, 8);
        renderer.drawGfxArrow(end.fromX + px * 11, end.fromY + py * 11, end.toX + px * 11, end.toY + py * 11, tint, alpha * 0.48, z + 2, 4);
        renderer.drawGfxArrow(end.fromX - px * 11, end.fromY - py * 11, end.toX - px * 11, end.toY - py * 11, tint, alpha * 0.48, z + 2, 4);
        renderer.drawGfxImpactBurst(end.toX, end.toY, laneWidth * 1.1, tint, alpha * 0.2, z + 8, progress, 7);
      } else {
        const count = s.includes("assassin") ? 5 : s.includes("barrage") || s.includes("volley") ? 5 : 3;
        const spread = s.includes("assassin") ? 0.78 : count >= 5 ? 0.64 : 0.46;
        for (let i = 0; i < count; i += 1) {
          const t = count === 1 ? 0 : i / (count - 1) - 0.5;
          const a = angle + t * spread;
          const length = radius * (s.includes("assassin") ? 0.86 : 1.18);
          const sx = effect.x - Math.cos(a) * length * 0.42;
          const sy = effect.y - Math.sin(a) * length * 0.42;
          const tx = effect.x + Math.cos(a) * length * 0.58;
          const ty = effect.y + Math.sin(a) * length * 0.58;
          renderer.drawGfxArrow(sx, sy, tx, ty, i === Math.floor(count / 2) ? "#f8f3e9" : tint, alpha * (i === Math.floor(count / 2) ? 0.86 : 0.62), z + i, s.includes("assassin") ? 4 : 5);
          renderer.drawGfxLine(sx - Math.cos(a) * 28, sy - Math.sin(a) * 28, sx, sy, 2, tint, alpha * 0.24, z - 4 + i, "add");
        }
        if (poison) renderer.drawGfxCircle(effect.x + Math.cos(angle) * radius * 0.38, effect.y + Math.sin(angle) * radius * 0.38, 24 + peak * 8, "#bef264", alpha * 0.16, "#d9f99d", alpha * 0.22, 2, z + 8, "add", 18);
      }
      return true;
    }

    return false;
  }

  function renderCrispMageEffect(renderer, context) {
    const { effect, progress, alpha, s, kind, angle, peak, pulse, effectRadius, end, z } = context;
    if (s.includes("frost") || s.includes("freeze") || s.includes("ice")) {
      const frostRadius = effectRadius;
      const snap = progress < 0.16 ? progress / 0.16 : Math.max(0, 1 - (progress - 0.16) / 0.72);
      const crackAlpha = alpha * Math.min(1, snap * 1.35);
      renderer.drawGfxCircle(effect.x, effect.y, frostRadius * (0.92 + peak * 0.04), "#93c5fd", alpha * 0.035, "#dbeafe", alpha * 0.16, 3, z - 12, "add", 40);
      renderer.drawGfxShardBurst(effect.x, effect.y, frostRadius * (0.82 + snap * 0.08), "#dbeafe", crackAlpha * 0.72, z, s.includes("lock") ? 8 : 14, progress * 0.15);
      for (let i = 0; i < 9; i += 1) {
        const a = (Math.PI * 2 * i) / 9 + 0.35;
        const inner = frostRadius * (0.12 + (i % 2) * 0.05);
        const outer = frostRadius * (0.54 + (i % 3) * 0.08);
        renderer.drawGfxLine(effect.x + Math.cos(a) * inner, effect.y + Math.sin(a) * inner, effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer, i % 3 === 0 ? 5 : 3, i % 2 ? "#93c5fd" : "#dbeafe", crackAlpha * (0.38 - i * 0.014), z + i, "add");
        if (i % 2 === 0) renderer.drawGfxDiamond(effect.x + Math.cos(a) * outer, effect.y + Math.sin(a) * outer, 7 + peak * 2, "#dbeafe", crackAlpha * 0.34, z + 12 + i, a);
      }
      renderer.renderParticlePreset?.("frostBurst", {
        x: effect.x,
        y: effect.y,
        radius: frostRadius * 0.5,
        color: "#dbeafe",
        alpha: crackAlpha * 0.54,
        zIndex: z + 20,
        phase: progress * 0.8,
        count: 8
      });
      return true;
    }

    if (s.includes("meteor")) {
      const meteorRadius = effectRadius;
      const fall = Math.min(1, Math.max(0, (progress - 0.04) * 1.55));
      const impact = Math.max(0, (progress - 0.48) / 0.52);
      const startX = effect.x - meteorRadius * 0.95;
      const startY = effect.y - meteorRadius * 3.05;
      const mx = startX + (effect.x - startX) * fall;
      const my = startY + (effect.y - startY) * fall;
      renderer.drawGfxCircle(effect.x, effect.y, meteorRadius * (0.58 + impact * 0.24), "#f97316", alpha * 0.055, "#f97316", alpha * 0.22, 3, z - 18, "add", 36);
      renderer.drawGfxArc(effect.x, effect.y, meteorRadius * 0.96, Math.PI * 0.12, Math.PI * 0.92, 5, "#f97316", alpha * 0.26, z - 16, "add", 14);
      renderer.drawGfxArc(effect.x, effect.y, meteorRadius * 0.96, -Math.PI * 0.92, -Math.PI * 0.12, 5, "#f97316", alpha * 0.26, z - 16, "add", 14);
      renderer.drawGfxLine(startX, startY, mx, my, 20, "#f97316", alpha * 0.24, z - 3, "add");
      renderer.drawGfxLine(startX + 18, startY - 12, mx + 9, my - 4, 8, "#fde68a", alpha * 0.32, z - 2, "add");
      renderer.drawGfxCircle(mx, my, 24 + peak * 8, "#2b170e", alpha * 0.72, "#fde68a", alpha * 0.46, 3, z + 6, "add", 16);
      renderer.renderParticlePreset?.("fireBurst", {
        x: mx,
        y: my,
        radius: meteorRadius * 0.34,
        color: "#fde68a",
        alpha: alpha * 0.42,
        zIndex: z + 7,
        phase: progress * 2.2,
        count: 10,
        direction: Math.PI * 0.75,
        spread: Math.PI * 0.9
      }) || renderer.drawGfxSparkSpray(mx, my, meteorRadius * 0.34, "#fde68a", alpha * 0.34, z + 7, 10, progress * 2.2, Math.PI * 0.75, Math.PI * 0.9);
      if (impact > 0) {
        renderer.drawGfxImpactBurst(effect.x, effect.y, meteorRadius * (0.58 + impact * 0.18), "#f97316", alpha * 0.26, z + 8, progress * 2.2, 12);
        for (let i = 0; i < 11; i += 1) {
          const a = (Math.PI * 2 * i) / 11 + progress * 0.4;
          const r = meteorRadius * (0.28 + (i % 4) * 0.075 + impact * 0.12);
          const x = effect.x + Math.cos(a) * r;
          const y = effect.y + Math.sin(a) * r * 0.62;
          renderer.drawGfxPath(
            [
              { x, y: y - 14 - peak * 4 },
              { x: x + 8, y: y + 12 },
              { x: x - 8, y: y + 12 }
            ],
            i % 2 ? "#f97316" : "#fde68a",
            alpha * impact * 0.48,
            "#f97316",
            alpha * impact * 0.18,
            1,
            z + 10 + i,
            "add"
          );
        }
        renderer.renderParticlePreset?.("fireBurst", {
          x: effect.x,
          y: effect.y,
          radius: meteorRadius * (0.42 + impact * 0.16),
          color: "#fde68a",
          alpha: alpha * impact * 0.52,
          zIndex: z + 24,
          phase: progress * 3.2,
          count: 12
        });
      }
      return true;
    }

    if (s.includes("chain_lightning") || s.includes("lightning") || s.includes("electric") || s.includes("overclock") || s.includes("rail_") || s.includes("drone_laser") || s.includes("turret_bolt") || s.includes("engineer_bolt")) {
      const tint = s.includes("rail") ? "#fde68a" : s.includes("overclock") ? "#9ee6ff" : "#9ee6ff";
      const width = s.includes("rail") ? 10 : s.includes("overclock") ? 9 : 7;
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.82, z, width, s.includes("rail") ? 4 : 7, s.includes("rail") ? 3 : 12, progress);
      if (!s.includes("rail")) {
        renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#dbeafe", alpha * 0.32, z + 4, Math.max(2, width * 0.42), 5, 18, progress + 0.37);
        for (let i = -1; i <= 1; i += 2) {
          const t = 0.4 + i * 0.06;
          const bx = end.fromX + (end.toX - end.fromX) * t;
          const by = end.fromY + (end.toY - end.fromY) * t;
          const branchAngle = angle + i * 0.88;
          renderer.drawGfxLightning(bx, by, bx + Math.cos(branchAngle) * 46, by + Math.sin(branchAngle) * 46, "#dbeafe", alpha * 0.28, z + 6 + i, 3, 3, 6, progress + i);
        }
      }
      renderer.drawGfxCircle(end.toX, end.toY, 16 + peak * 8, tint, alpha * 0.14, "#dbeafe", alpha * 0.36, 3, z + 8, "add", 14);
      renderer.renderParticlePreset?.("hitSpark", {
        x: end.toX,
        y: end.toY,
        radius: 36 + peak * 8,
        color: "#dbeafe",
        alpha: alpha * 0.4,
        zIndex: z + 12,
        phase: progress * 4.1,
        count: 9
      }) || renderer.drawGfxSparkSpray(end.toX, end.toY, 36 + peak * 8, "#dbeafe", alpha * 0.32, z + 12, 9, progress * 4.1);
      return true;
    }

    if (s.includes("star_orb") || s.includes("star_burst") || s.includes("arcane_splash") || s.includes("blink_")) {
      const tint = s.includes("blink") ? "#93c5fd" : "#dbeafe";
      const starRadius = effectRadius * (s.includes("burst") ? 0.78 : 0.46) * pulse;
      renderer.drawGfxRuneRing(effect.x, effect.y, Math.max(30, starRadius * 0.78), tint, alpha * 0.24, z - 5, progress * 2.6, s.includes("burst") ? 10 : 7);
      renderer.drawGfxStar(effect.x, effect.y, Math.max(22, starRadius), tint, alpha * 0.64, z, s.includes("burst") ? 10 : 6);
      for (let i = 0; i < (s.includes("burst") ? 8 : 5); i += 1) {
        const a = progress * 1.4 + (Math.PI * 2 * i) / (s.includes("burst") ? 8 : 5);
        renderer.drawGfxLine(effect.x + Math.cos(a) * starRadius * 0.34, effect.y + Math.sin(a) * starRadius * 0.34, effect.x + Math.cos(a) * starRadius * 0.88, effect.y + Math.sin(a) * starRadius * 0.88, i % 2 ? 3 : 5, tint, alpha * 0.26, z + 3 + i, "add");
      }
      renderer.renderParticlePreset?.("hitSpark", {
        x: effect.x,
        y: effect.y,
        radius: Math.max(42, effectRadius * 0.68),
        color: tint,
        alpha: alpha * 0.3,
        zIndex: z + 12,
        phase: progress * 3.8,
        count: s.includes("burst") ? 12 : 7
      }) || renderer.drawGfxSparkSpray(effect.x, effect.y, Math.max(42, effectRadius * 0.68), tint, alpha * 0.24, z + 12, s.includes("burst") ? 12 : 7, progress * 3.8);
      return true;
    }

    return false;
  }

  function renderCrispEngineerEffect(renderer, context) {
    const { effect, progress, alpha, s, angle, peak, effectRadius, end, z } = context;
    if (!(s.includes("engineer") || s.includes("turret") || s.includes("drone") || s.includes("shock_mine") || s.includes("mini_turret"))) return false;
    if (s.includes("shock_mine")) {
      const mineRadius = effectRadius;
      renderer.drawGfxArc(effect.x, effect.y, mineRadius * 0.9, -Math.PI * 0.9, -Math.PI * 0.08, 4, "#9ee6ff", alpha * 0.3, z - 9, "add", 12);
      renderer.drawGfxArc(effect.x, effect.y, mineRadius * 0.9, Math.PI * 0.08, Math.PI * 0.9, 4, "#9ee6ff", alpha * 0.3, z - 9, "add", 12);
      renderer.drawGfxGear(effect.x, effect.y, mineRadius * 0.42, "#9ee6ff", alpha * 0.46, z - 4, progress * 2.8, 12);
      renderer.drawGfxGear(effect.x, effect.y, mineRadius * 0.25, "#fde68a", alpha * 0.28, z - 3, -progress * 3.2, 8);
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 + progress * 1.2;
        renderer.drawGfxLightning(effect.x, effect.y, effect.x + Math.cos(a) * mineRadius * 0.72, effect.y + Math.sin(a) * mineRadius * 0.72, "#9ee6ff", alpha * 0.36, z + i, 3, 3, 5, progress + i);
      }
      renderer.drawGfxLine(effect.x - mineRadius * 0.26, effect.y + 12, effect.x + mineRadius * 0.26, effect.y + 12, 8, "#2b2118", alpha * 0.7, z + 7, "normal");
      renderer.drawGfxCircle(effect.x, effect.y, 16 + peak * 6, "#dbeafe", alpha * 0.32, "#9ee6ff", alpha * 0.34, 2, z + 9, "add", 12);
    } else if (s.includes("turret") || s.includes("device_throw")) {
      const throwLike = s.includes("throw");
      const deploy = Math.min(1, throwLike ? progress * 1.25 : 1);
      const arcLift = throwLike ? Math.sin(deploy * Math.PI) * 42 : 0;
      const deviceX = throwLike ? end.fromX + (end.toX - end.fromX) * deploy : effect.x;
      const deviceY = throwLike ? end.fromY + (end.toY - end.fromY) * deploy - arcLift : effect.y;
      if (throwLike) {
        renderer.drawGfxLine(end.fromX, end.fromY, deviceX, deviceY, 6, "#d6b76d", alpha * 0.22, z - 10, "add");
        renderer.drawGfxArrow(end.fromX, end.fromY, end.toX, end.toY, "#d6b76d", alpha * 0.28, z - 12, 3);
      }
      renderer.drawGfxGear(deviceX, deviceY, 30 + peak * 5, "#d6b76d", alpha * 0.46, z - 1, progress * 2.2, 10);
      renderer.drawGfxLine(deviceX - 20, deviceY + 13, deviceX + 20, deviceY + 13, 8, "#4b3b22", alpha * 0.74, z + 2, "normal");
      renderer.drawGfxLine(deviceX - 4, deviceY + 10, deviceX + Math.cos(angle) * 34, deviceY + Math.sin(angle) * 21, 9, "#d6b76d", alpha * 0.82, z + 3, "normal");
      renderer.drawGfxLine(deviceX - 16, deviceY + 20, deviceX - 28, deviceY + 32, 5, "#4b3b22", alpha * 0.66, z + 2, "normal");
      renderer.drawGfxLine(deviceX + 16, deviceY + 20, deviceX + 28, deviceY + 32, 5, "#4b3b22", alpha * 0.66, z + 2, "normal");
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
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#9ee6ff", alpha * 0.7, z, 6, 6, 8, progress);
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
      renderer.drawGfxCapsule(end.fromX, end.fromY, end.toX, end.toY, lane, tint, alpha * 0.36, z - 10);
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 10, "#f5d0fe", alpha * 0.34, z - 1, "add");
      for (let i = 0; i < 4; i += 1) {
        const t = 0.18 + i * 0.2;
        const x = end.fromX + (end.toX - end.fromX) * t;
        const y = end.fromY + (end.toY - end.fromY) * t;
        const side = i % 2 ? 1 : -1;
        renderer.drawGfxLine(x - Math.sin(angle) * side * 12, y + Math.cos(angle) * side * 12, x - Math.cos(angle) * 34, y - Math.sin(angle) * 34, 7 - i, "#7c3aed", alpha * (0.22 - i * 0.03), z + i, "add");
      }
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

  function renderSkillDirectionPolish(renderer, context, palette) {
    const { progress, alpha, s, kind, angle, radius, effectRadius, end, z } = context;
    if (!end || !Number.isFinite(end.fromX) || !Number.isFinite(end.fromY) || !Number.isFinite(end.toX) || !Number.isFinite(end.toY)) return false;
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const length = Math.hypot(dx, dy);
    if (length < 34) return false;
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

    const punch = Math.max(26, Math.min(96, effectRadius * (kind === "explosion" || s.includes("meteor") ? 0.58 : 0.42)));
    if (renderer.drawGfxImpactBurst) {
      renderer.drawGfxImpactBurst(effect.x, effect.y, punch * (0.8 + peak * 0.18), palette.tint, alpha * 0.18, z + 26, progress * 3.3, s.includes("meteor") || kind === "explosion" ? 12 : 8);
    }
    if (renderer.drawGfxArc) {
      const ring = punch * (0.72 + progress * 0.24);
      for (let i = 0; i < 4; i += 1) {
        const a = angle + progress * 0.45 + (Math.PI * 2 * i) / 4;
        renderer.drawGfxArc(effect.x, effect.y, ring + i * 7, a - 0.18, a + 0.18, i % 2 ? 3 : 5, i % 2 ? palette.tint : palette.light, alpha * (0.2 - i * 0.028), z + 8 + i, "add", 4);
      }
    }
    renderer.renderParticlePreset?.(s.includes("meteor") ? "fireBurst" : palette.preset, {
      x: effect.x,
      y: effect.y,
      radius: punch * 0.95,
      color: palette.light,
      alpha: alpha * 0.34,
      zIndex: z + 32,
      phase: progress * 2.5,
      count: s.includes("meteor") || kind === "explosion" ? 10 : 7,
      direction: Number.isFinite(effect.angle) ? Number(effect.angle) : undefined,
      spread: Math.PI * 1.2
    });
    return true;
  }

  function renderSkillAuraPolish(renderer, context, palette) {
    const { effect, progress, alpha, s, kind, effectRadius, peak, z } = context;
    const auraLike =
      kind === "warning" ||
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
    if (!auraLike) return false;

    const baseRadius = Math.max(32, Math.min(150, effectRadius * (kind === "warning" ? 0.86 : 0.58)));
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
    if (s.includes("taunt")) {
      renderer.renderParticlePreset?.("shockRing", {
        x: effect.x,
        y: effect.y,
        radius: baseRadius * 0.9,
        color: palette.light,
        alpha: alpha * 0.28,
        zIndex: z + 20,
        phase: progress * 2.5,
        count: 8
      });
    }
    return true;
  }

  function renderSkillEffectPolishLayer(renderer, context) {
    if (!renderer || !context || !context.s || context.alpha <= 0.02) return false;
    const palette = skillPolishPalette(context);
    const drewDirection = renderSkillDirectionPolish(renderer, context, palette);
    const drewImpact = renderSkillImpactPolish(renderer, context, palette);
    const drewAura = renderSkillAuraPolish(renderer, context, palette);
    return drewDirection || drewImpact || drewAura;
  }

  function assetSkillSheetKey(context) {
    const s = context?.s || "";
    const kind = context?.kind || "";
    if (s.includes("shield_charge")) return "asset-fx-shield-charge";
    if (s.includes("shield") || s.includes("slam")) return "asset-fx-shield";
    if (s.includes("taunt")) return "asset-fx-shout";
    if (s.includes("arrow_rain")) return "asset-fx-arrow-rain";
    if (s.includes("ranger") || s.includes("arrow") || s.includes("piercing") || s.includes("barrage")) return "asset-fx-arrow";
    if (s.includes("frost") || s.includes("freeze") || s.includes("ice") || kind === "freeze" || kind === "slow") return "asset-fx-frost";
    if (s.includes("meteor") || s.includes("fire") || s.includes("flame")) return "asset-fx-meteor";
    if (s.includes("chain_lightning") || s.includes("lightning") || s.includes("electric") || s.includes("overclock") || s.includes("rail")) return "asset-fx-lightning";
    if (s.includes("engineer") || s.includes("turret") || s.includes("mine") || s.includes("drone")) return "asset-fx-engineer";
    if (s.includes("puppet") || s.includes("thread")) return "asset-fx-puppet";
    if (s.includes("martial") || s.includes("palm") || s.includes("combo") || s.includes("rising")) return "asset-fx-martial";
    if (s.includes("alchemy") || s.includes("alchemist") || s.includes("acid") || s.includes("elixir") || s.includes("flask") || s.includes("poison")) return "asset-fx-alchemy";
    if (s.includes("shadow") || s.includes("assassin") || s.includes("stalker") || s.includes("smoke")) return "asset-fx-shadow";
    if (s.includes("warrior") || s.includes("cleave") || s.includes("spin") || kind === "slash" || kind === "spin") return "asset-fx-slash";
    if (kind === "impact" || kind === "explosion" || kind === "death" || s.includes("impact") || s.includes("burst")) return "asset-fx-impact";
    return "";
  }

  function renderAssetDirectionalTrail(renderer, context, sheetKey, scale, alpha) {
    const { progress, angle, end, z } = context;
    if (!end || !Number.isFinite(end.fromX) || !Number.isFinite(end.toX)) return false;
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const length = Math.hypot(dx, dy);
    if (length < 52) return false;
    const count = Math.max(1, Math.min(4, Math.round(length / 120)));
    let drew = false;
    for (let i = 0; i < count; i += 1) {
      const t = (i + 1) / (count + 1);
      const x = end.fromX + dx * t;
      const y = end.fromY + dy * t;
      const sprite = renderer.assetEffectFx(sheetKey, x, y, {
        progress: Math.max(0, Math.min(1, progress - i * 0.05)),
        scaleX: scale * (0.72 + t * 0.26),
        scaleY: scale * 0.76,
        alpha: alpha * (0.22 + t * 0.16),
        rotation: angle,
        zIndex: z - 18 + i,
        blendMode: "add"
      });
      drew = !!sprite || drew;
    }
    return drew;
  }

  function renderAssetStyledSkillEffect(renderer, context) {
    if (!renderer?.assetEffectFx || !context) return false;
    const { effect, progress, alpha, radius, s, kind, angle, effectRadius, end, z } = context;
    const sheetKey = assetSkillSheetKey(context);
    if (!sheetKey) return false;

    const baseScale = Math.max(0.72, Math.min(3.1, effectRadius / 64));
    const directional =
      kind === "shot" ||
      kind === "dash" ||
      kind === "chain" ||
      s.includes("charge") ||
      s.includes("lunge") ||
      s.includes("piercing") ||
      s.includes("throw") ||
      s.includes("beam") ||
      s.includes("rail") ||
      s.includes("palm") ||
      s.includes("rising");
    const aura =
      kind === "warning" ||
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
    const impact =
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

    let x = effect.x;
    let y = effect.y;
    let scaleX = baseScale;
    let scaleY = baseScale;
    let rotation = angle;
    let frameProgress = progress;
    let blendMode = "add";

    if (s.includes("shield_charge") && end) {
      const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
      const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
      const travel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
      x = end.fromX + (end.toX - end.fromX) * travel;
      y = end.fromY + (end.toY - end.fromY) * travel;
      scaleX = Math.max(1.05, baseScale * 1.18);
      scaleY = Math.max(0.82, baseScale * 0.92);
    } else if (s.includes("meteor")) {
      const fall = Math.min(1, Math.max(0, (progress - 0.04) * 1.55));
      const meteorRadius = Math.max(radius, effectRadius);
      x = effect.x - meteorRadius * 0.85 * (1 - fall);
      y = effect.y - meteorRadius * 2.45 * (1 - fall);
      scaleX = baseScale * (0.86 + fall * 0.22);
      scaleY = baseScale * (0.86 + fall * 0.22);
      rotation = 0.78;
    } else if (directional && end) {
      const centerX = (end.fromX + end.toX) / 2;
      const centerY = (end.fromY + end.toY) / 2;
      const length = Math.hypot(end.toX - end.fromX, end.toY - end.fromY);
      x = centerX;
      y = centerY;
      scaleX = Math.max(baseScale, Math.min(4.2, length / 92));
      scaleY = Math.max(0.55, Math.min(1.8, baseScale * 0.72));
    } else if (aura) {
      scaleX = baseScale * 1.08;
      scaleY = baseScale * 1.08;
      rotation = s.includes("arrow_rain") ? 0 : angle + progress * 0.15;
    } else if (impact) {
      scaleX = baseScale * 1.16;
      scaleY = baseScale * 1.16;
      rotation = Number.isFinite(effect.angle) ? Number(effect.angle) : progress * 0.5;
    }

    const main = renderer.assetEffectFx(sheetKey, x, y, {
      progress: frameProgress,
      scaleX,
      scaleY,
      alpha: alpha * (impact ? 0.98 : 0.92),
      rotation,
      zIndex: z + (impact ? 24 : 8),
      blendMode
    });
    if (!main) return false;

    if (directional && !s.includes("meteor")) {
      renderAssetDirectionalTrail(renderer, context, sheetKey, Math.max(0.56, baseScale * 0.72), alpha);
    }
    if (s.includes("arrow_rain")) {
      for (let i = 0; i < 3; i += 1) {
        const offset = (i - 1) * effectRadius * 0.24;
        renderer.assetEffectFx(sheetKey, effect.x + offset, effect.y - effectRadius * 0.18 + i * 8, {
          progress: (progress + i * 0.12) % 1,
          scaleX: Math.max(0.7, baseScale * 0.78),
          scaleY: Math.max(0.7, baseScale * 0.78),
          alpha: alpha * 0.52,
          rotation: 0,
          zIndex: z + 12 + i,
          blendMode: "add"
        });
      }
    }
    if (s.includes("meteor") && progress > 0.44) {
      renderer.assetEffectFx("asset-fx-impact", effect.x, effect.y, {
        progress: Math.min(1, (progress - 0.44) / 0.56),
        scaleX: baseScale * 1.24,
        scaleY: baseScale * 0.92,
        alpha: alpha * 0.84,
        rotation: 0,
        zIndex: z + 30,
        blendMode: "add"
      });
    }
    return true;
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
    renderWarriorSlamEffect,
    renderWarriorBodyEffect,
    renderRangerStyledSkillEffect,
    renderRangerArrowRainEffect,
    renderRangerVolleyEffect,
    renderMageStyledSkillEffect,
    renderMageFrostEffect,
    renderMageMeteorEffect,
    renderMageChainEffect,
    renderMageStarBurstEffect,
    renderMageBlinkEffect,
    renderEngineerStyledSkillEffect,
    renderEngineerBeamEffect,
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
    renderSkillEffectPolishLayer,
    assetSkillSheetKey,
    renderAssetDirectionalTrail,
    renderAssetStyledSkillEffect,
  });
})();
