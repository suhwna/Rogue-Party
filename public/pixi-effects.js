(() => {
  const styleClassifier = window.RogueEffectStyle || {};

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }

  function effectProgress(effect) {
    return clamp01(Number(effect.age || 0) / Math.max(0.1, Number(effect.ttl || 0.7)));
  }

  function effectRadius(effect, fallbackRadius) {
    const rawRadius = Math.max(18, Number(fallbackRadius || effect.radius || 42));
    const style = styleText("", effect);
    if (effect.kind === "warning") return Math.min(rawRadius, 220);
    if (effect.kind === "meteor") return Math.min(rawRadius, 180);
    if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") return Math.min(rawRadius, 120);
    if ((effect.kind === "freeze" || effect.kind === "slow") && (style.includes("frost_wave") || style.includes("frost_breath"))) return Math.min(rawRadius, 520);
    if (effect.kind === "freeze" || effect.kind === "slow") return Math.min(rawRadius, 140);
    return Math.min(rawRadius, 140);
  }

  function floatingTextStyle(effect, color) {
    const tint = styleText("", effect).includes("venom") ? "#c084fc" : color;
    return {
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fontSize: effect.critical ? 26 : effect.kind === "xp" ? 15 : 18,
      fill: effect.kind === "heal" ? "#86efac" : effect.kind === "xp" ? "#67e8f9" : tint,
      stroke: { color: "#020617", width: effect.critical ? 5 : 3 },
    };
  }

  function floatingTextValue(effect) {
    if (effect.kind === "xp") return `+${effect.value || 0} XP`;
    if (effect.kind === "heal") return `+${effect.value || 0}`;
    return String(effect.value || "");
  }

  function isFloatingTextEffect(effect) {
    return effect.kind === "damage" || effect.kind === "heal" || effect.kind === "xp" || (effect.kind === "poison" && effect.value);
  }

  function renderFloatingTextEffect(renderer, effect, progress, alpha, color) {
    if (!isFloatingTextEffect(effect)) return false;
    const text = renderer.textPool.next(renderer.layers.effect, floatingTextStyle(effect, color));
    text.text = floatingTextValue(effect);
    text.position.set(effect.x, effect.y - progress * 30);
    text.alpha = alpha;
    text.scale.set(1 + (effect.critical ? 0.24 : 0.1) * Math.max(0, 1 - progress * 3));
    text.zIndex = effect.y + 100;
    text.blendMode = effect.critical ? "add" : "normal";
    return true;
  }

  function styleText(rawStyle, effect) {
    return `${rawStyle || ""} ${effect?.style || ""} ${effect?.kind || ""}`.toLowerCase();
  }

  function endpoints(effect, radius, angle) {
    if (Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY) && Number.isFinite(effect.toX) && Number.isFinite(effect.toY)) {
      return { fromX: effect.fromX, fromY: effect.fromY, toX: effect.toX, toY: effect.toY };
    }
    const half = Math.max(28, radius * 0.7);
    return {
      fromX: effect.x - Math.cos(angle) * half,
      fromY: effect.y - Math.sin(angle) * half,
      toX: effect.x + Math.cos(angle) * half,
      toY: effect.y + Math.sin(angle) * half,
    };
  }

  function colorFor(effect, color, style) {
    if (style.includes("warrior") || style.includes("cleave") || style.includes("shield_charge")) return "#ff4d6d";
    if (style.includes("ranger") || style.includes("arrow")) return "#39ff88";
    if (style.includes("mage") || style.includes("arcane") || style.includes("star")) return "#55ccff";
    if (style.includes("engineer") || style.includes("electric")) return "#ffd166";
    if (style.includes("puppet") || style.includes("thread")) return "#d783ff";
    if (style.includes("martial")) return "#ff9f1c";
    if (style.includes("alchemist") || style.includes("acid")) return "#a3ff4f";
    if (style.includes("assassin") || style.includes("shadow")) return "#b68cff";
    return color || "#f8fafc";
  }

  function drawCrosshair(renderer, x, y, radius, color, alpha, z, phase = 0) {
    renderer.drawGfxCircle(x, y, radius, "#000000", 0.02, color, alpha * 0.72, 3, z, "add", 36);
    renderer.drawGfxCircle(x, y, radius * 0.55, "#000000", 0, color, alpha * 0.42, 2, z + 1, "add", 28);
    for (let i = 0; i < 4; i += 1) {
      const a = phase + (Math.PI * 0.5 * i);
      renderer.drawGfxLine(x + Math.cos(a) * radius * 0.7, y + Math.sin(a) * radius * 0.7, x + Math.cos(a) * radius * 1.08, y + Math.sin(a) * radius * 1.08, 4, color, alpha * 0.42, z + 2 + i, "add");
    }
  }

  function renderSlashEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "slash") return false;
    const style = styleText(rawStyle, effect);
    const tint = colorFor(effect, color, style);
    const angle = Number(effect.angle || 0);
    const side = Number(effect.swingSide || 1) >= 0 ? 1 : -1;
    const heavy = style.includes("cleave") || style.includes("wide") || style.includes("brute");
    const reach = Math.max(64, Number(effect.reach || radius * (heavy ? 1.38 : 1.04)));
    const originX = Number.isFinite(effect.originX) ? effect.originX : effect.x - Math.cos(angle) * reach * 0.5;
    const originY = Number.isFinite(effect.originY) ? effect.originY : effect.y - Math.sin(angle) * reach * 0.5;
    const active = 1 - Math.pow(1 - Math.min(1, progress * 1.18), 3);
    const sweep = heavy ? 2.45 : 1.58;
    const bladeAngle = angle - sweep * 0.5 * side + sweep * active * side;
    const trailStart = bladeAngle - sweep * (heavy ? 0.44 : 0.32) * side;
    const z = originY + Math.sin(angle) * reach * 0.65 + 118;
    const fade = Math.max(0, 1 - Math.max(0, progress - 0.76) / 0.24);

    renderer.drawGfxCleaveRibbon(originX, originY, reach * (heavy ? 0.36 : 0.42), reach * (heavy ? 1.12 : 0.86), trailStart, bladeAngle, tint, alpha * fade * (heavy ? 0.1 : 0.06), "#f8fafc", alpha * fade * (heavy ? 0.28 : 0.18), heavy ? 5 : 3, z, "add", heavy ? 22 : 12);
    renderer.drawGfxArc(originX, originY, reach * (heavy ? 1.06 : 0.82), trailStart + side * 0.04, bladeAngle, heavy ? 9 : 6, "#f8fafc", alpha * fade * (heavy ? 0.62 : 0.5), z + 8, "add", heavy ? 22 : 12);
    if (heavy) {
      renderer.drawGfxGreatsword(originX, originY, bladeAngle, reach * 1.06, tint, alpha * fade * 0.9, z + 18, true);
    } else {
      renderer.drawGfxSword(originX, originY, bladeAngle, reach * 0.95, 0, tint, alpha * fade * 0.88, z + 18, true);
    }
    const tipX = originX + Math.cos(bladeAngle) * reach * (heavy ? 1.1 : 0.94);
    const tipY = originY + Math.sin(bladeAngle) * reach * (heavy ? 1.1 : 0.94);
    renderer.drawGfxSparkSpray(tipX, tipY, reach * (heavy ? 0.36 : 0.22), tint, alpha * fade * 0.34, z + 28, heavy ? 13 : 8, progress * 5, bladeAngle, Math.PI * 0.7);
    return true;
  }

  function renderSpinEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "spin") return false;
    const style = styleText(rawStyle, effect);
    const tint = colorFor(effect, color, style);
    const z = effect.y + 112;
    const spin = progress * Math.PI * 2.8 + Number(effect.angle || 0);
    renderer.drawGfxRuneRing(effect.x, effect.y, radius * (0.84 + progress * 0.08), tint, alpha * 0.62, z, spin, 12);
    for (let i = 0; i < 6; i += 1) {
      const a = spin + (Math.PI * 2 * i) / 6;
      const r = radius * (0.34 + (i % 3) * 0.16);
      renderer.drawGfxArc(effect.x, effect.y, r, a - 0.58, a + 0.46, 6 - (i % 2), i % 2 ? "#f8fafc" : tint, alpha * (0.42 - i * 0.035), z + i, "add", 8);
      renderer.drawGfxLine(effect.x + Math.cos(a) * r * 0.82, effect.y + Math.sin(a) * r * 0.82, effect.x + Math.cos(a) * radius * 0.95, effect.y + Math.sin(a) * radius * 0.95, 4, tint, alpha * 0.22, z + 10 + i, "add");
    }
    renderer.drawGfxSparkSpray(effect.x, effect.y, radius * 0.92, tint, alpha * 0.25, z + 20, 12, spin);
    return true;
  }

  function renderChainEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = styleText(rawStyle, effect);
    const angle = Number(effect.angle || 0);
    const end = endpoints(effect, radius, angle);
    const length = Math.hypot(end.toX - end.fromX, end.toY - end.fromY);
    const dx = end.toX - end.fromX;
    const dy = end.toY - end.fromY;
    const ux = dx / Math.max(1, length);
    const uy = dy / Math.max(1, length);
    const nx = -uy;
    const ny = ux;
    const empowered = style.includes("empowered_current") || style.includes("red_lightning");
    const engineer = style.includes("engineer") || style.includes("turret") || style.includes("drone") || style.includes("overclock") || style.includes("mecha");
    const tint = empowered ? "#ef4444" : engineer ? "#67e8f9" : colorFor(effect, color, `${style} electric`);
    const core = empowered ? "#fee2e2" : "#f8fafc";
    const width = empowered ? 10 : engineer ? 8 : 9;
    const jitter = empowered ? 22 : engineer ? 19 : 21;
    const phase = progress * 1.7 + Number(effect.seed || 0) * 0.13;
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, tint, alpha * 0.94, effect.y + 100, width, 8, jitter, phase);
      renderer.drawGfxLightning(end.fromX + nx * 10, end.fromY + ny * 10, end.toX + nx * 6, end.toY + ny * 6, core, alpha * 0.24, effect.y + 104, Math.max(2, width * 0.32), 5, 12, phase + 0.41);
      for (let i = 0; i < 3; i += 1) {
        const side = i % 2 ? 1 : -1;
        const t = (i + 1) / 4;
        const bx = end.fromX + dx * t;
        const by = end.fromY + dy * t;
        const branch = Math.min(58, 30 + jitter * 0.9 + i * 5);
        renderer.drawGfxLightning(bx, by, bx + nx * side * branch + ux * branch * 0.22, by + ny * side * branch + uy * branch * 0.22, tint, alpha * (0.3 - i * 0.04), effect.y + 110 + i, Math.max(2.2, width * 0.38), 3, 9 + i * 2, phase + i * 0.29);
      }
    } else {
      const steps = Math.max(4, Math.min(9, Math.round(length / 42)));
      let prevX = end.fromX;
      let prevY = end.fromY;
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const baseX = end.fromX + dx * t;
        const baseY = end.fromY + dy * t;
        const jump = Math.sin(progress * 24 + i * 3.17) * radius * 0.12;
        const x = baseX + nx * jump;
        const y = baseY + ny * jump;
        renderer.drawGfxLine(prevX, prevY, x, y, i % 2 ? 8 : 5, i % 2 ? core : tint, alpha * 0.76, effect.y + 100 + i, "add");
        prevX = x;
        prevY = y;
      }
    }
    renderer.drawGfxCircle?.(end.fromX, end.fromY, 10, tint, alpha * 0.08, core, alpha * 0.18, 2, effect.y + 112, "add", 10);
    renderer.drawGfxCircle?.(end.toX, end.toY, 18, tint, alpha * 0.16, core, alpha * 0.42, 3, effect.y + 116, "add", 14);
    renderer.drawGfxImpactBurst(end.toX, end.toY, radius * 0.24, tint, alpha * 0.45, effect.y + 118, progress * 3, 8);
  }

  function renderShotEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = styleText(rawStyle, effect);
    const styleInfo = styleClassifier.classifyEffectStyle
      ? styleClassifier.classifyEffectStyle(style, effect.kind)
      : null;
    const angle = Number(effect.angle || 0);
    const tint = colorFor(effect, color, style);
    const end = endpoints(effect, radius * 1.2, angle);
    const z = effect.y + 96;
    const mechaMuzzle = styleInfo ? styleInfo.mechaMuzzle : style.includes("mecha_laser_muzzle") || style.includes("mecha_hand_laser");
    const continuousLaser = style.includes("adaptive_continuous_laser");
    if (style.includes("single_laser")) {
      const beamWidth = Math.max(3, Number(effect.width || 4.5));
      const beamColor = effect.color || tint || "#67e8f9";
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth + 5, "#06131f", alpha * 0.24, z - 4, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, beamWidth, beamColor, alpha * 0.82, z, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(1.5, beamWidth * 0.3), "#f8fafc", alpha * 0.88, z + 2, "add");
      renderer.drawGfxCircle?.(end.fromX, end.fromY, Math.max(4, beamWidth * 1.2), beamColor, alpha * 0.08, "#f8fafc", alpha * 0.16, 1, z + 3, "add", 8);
      renderer.drawGfxCircle?.(end.toX, end.toY, Math.max(6, beamWidth * 1.7), beamColor, alpha * 0.14, "#f8fafc", alpha * 0.3, 1.5, z + 4, "add", 10);
      return;
    }
    if (mechaMuzzle) {
      const transmittedHitRadius = Number(effect.hitRadius);
      const adaptiveHitWidth = Number.isFinite(transmittedHitRadius) && transmittedHitRadius > 0
        ? transmittedHitRadius * 2
        : Math.max(2, Number(effect.width) || 16);
      const beamWidth = continuousLaser ? adaptiveHitWidth : Math.max(7, radius * 0.14);
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, continuousLaser ? beamWidth : beamWidth + 8, "#06131f", alpha * 0.24, z - 4, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, continuousLaser ? Math.max(2, beamWidth - 2) : beamWidth, "#67e8f9", alpha * 0.68, z, "add");
      renderer.drawGfxLine(end.fromX + Math.cos(angle) * 12, end.fromY + Math.sin(angle) * 12, end.toX, end.toY, Math.max(2.4, beamWidth * 0.28), "#f8fafc", alpha * 0.82, z + 3, "add");
      if (!continuousLaser) {
        renderer.drawGfxCircle(end.toX, end.toY, 10 + radius * 0.08, "#67e8f9", alpha * 0.18, "#f8fafc", alpha * 0.36, 1.8, z + 6, "add", 12);
      }
      return;
    }
    if (styleInfo ? styleInfo.basicEngineerBolt : style.includes("engineer_bolt") && !style.includes("mecha")) {
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 10, "#2b2118", alpha * 0.48, z - 2, "normal");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 5, "#d6b76d", alpha * 0.72, z, "normal");
      renderer.drawGfxLine(end.fromX + Math.cos(angle) * 14, end.fromY + Math.sin(angle) * 14, end.toX, end.toY, 2.4, "#fff7ed", alpha * 0.58, z + 2, "add");
      renderer.drawGfxCircle(end.toX, end.toY, 8, "#67e8f9", alpha * 0.18, "#f8fafc", alpha * 0.28, 1.5, z + 4, "add", 10);
      renderer.drawGfxSparkSpray?.(end.toX, end.toY, radius * 0.26, "#d6b76d", alpha * 0.22, z + 8, 5, progress * 3.4, angle, Math.PI * 0.7);
      return;
    }
    const electric = styleInfo
      ? styleInfo.lightningSkill && !styleInfo.beam
      : (style.includes("electric") || style.includes("shock")) && !style.includes("laser") && !style.includes("rail");
    if (electric) {
      const boltTint = style.includes("mecha") ? "#f5d0fe" : "#67e8f9";
      if (renderer.drawGfxLightning) {
        renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, boltTint, alpha * 0.9, z, Math.max(6, radius * 0.12), 7, Math.max(14, radius * 0.32), Number(effect.seed || 0) + effect.x * 0.01);
        renderer.drawGfxLightning(end.fromX, end.fromY, end.toX, end.toY, "#f8fafc", alpha * 0.2, z + 4, 2.4, 4, 9, Number(effect.seed || 0) + progress);
      } else {
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 9, boltTint, alpha * 0.72, z, "add");
        renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 3, "#f8fafc", alpha * 0.52, z + 2, "add");
      }
      renderer.drawGfxImpactBurst(end.toX, end.toY, radius * 0.2, boltTint, alpha * 0.36, z + 8, progress * 2.4, 7);
      return;
    }
    if (style.includes("arrow_rain") || style.includes("rain")) {
      if (style.includes("launch")) {
        const dx = end.toX - end.fromX;
        const dy = end.toY - end.fromY;
        const dist = Math.hypot(dx, dy) || 1;
        const lift = Math.max(170, Math.min(420, dist * 0.44 + radius * 0.58));
        const controlX = end.fromX + dx * 0.5;
        const controlY = Math.min(end.fromY, end.toY) - lift;
        let prevX = end.fromX;
        let prevY = end.fromY;
        for (let i = 1; i <= 22; i += 1) {
          const t = i / 22;
          const one = 1 - t;
          const x = one * one * end.fromX + 2 * one * t * controlX + t * t * end.toX;
          const y = one * one * end.fromY + 2 * one * t * controlY + t * t * end.toY;
          renderer.drawGfxLine(prevX, prevY, x, y, 6, "#4a3415", alpha * 0.12, z - 22 + i, "add");
          renderer.drawGfxLine(prevX, prevY, x, y, 3, tint, alpha * (0.24 + Math.sin(t * Math.PI) * 0.12), z - 20 + i, "add");
          prevX = x;
          prevY = y;
        }
        const headT = Math.max(0.05, Math.min(0.94, progress * 0.96));
        const one = 1 - headT;
        const headX = one * one * end.fromX + 2 * one * headT * controlX + headT * headT * end.toX;
        const headY = one * one * end.fromY + 2 * one * headT * controlY + headT * headT * end.toY;
        const tx = 2 * one * (controlX - end.fromX) + 2 * headT * (end.toX - controlX);
        const ty = 2 * one * (controlY - end.fromY) + 2 * headT * (end.toY - controlY);
        const len = Math.hypot(tx, ty) || 1;
        const ux = tx / len;
        const uy = ty / len;
        renderer.drawGfxLine(headX - ux * 58, headY - uy * 58, headX + ux * 12, headY + uy * 12, 5, "#fff7ed", alpha * 0.85, z + 18, "add");
        renderer.drawGfxDiamond(headX + ux * 14, headY + uy * 14, 7, "#fff7ed", alpha * 0.86, z + 20, Math.atan2(uy, ux));
      } else {
        const rainProgress = Math.max(0, Math.min(1, (progress - 0.68) / 0.32));
        if (rainProgress <= 0) return;
        const dropCount = 8;
        renderer.drawGfxCircle(effect.x, effect.y, radius, "#4a3415", alpha * 0.024, "#f1d08b", alpha * (0.22 + rainProgress * 0.16), 2, z - 12, "add", 56);
        renderer.drawGfxCircle(effect.x, effect.y, radius * 0.72, "#000000", 0, "#fde68a", alpha * (0.07 + rainProgress * 0.07), 1.2, z - 11, "add", 42);
        for (let i = 0; i < dropCount; i += 1) {
          const seed = renderer.noise(i * 19 + effect.x, effect.y * 0.1);
          const lane = (i - (dropCount - 1) / 2) * radius * 0.12 + (seed - 0.5) * radius * 0.12;
          const fall = (rainProgress * 1.35 + i / dropCount) % 1;
          const x = effect.x + lane;
          const landY = effect.y + (renderer.noise(i * 7, effect.x) - 0.5) * radius * 0.28;
          const y = landY - radius * 2.05 + fall * radius * 2.32;
          const slant = (i % 2 ? -1 : 1) * 2;
          renderer.drawGfxLine(x - slant, y - 44, x + slant, y + 30, i % 3 === 0 ? "#fff7ed" : tint, alpha * (0.38 + rainProgress * 0.28), z + i, "add");
        }
      }
      return;
    }
    if (style.includes("laser_arrow")) {
      const beamWidth = Math.max(24, Number(effect.width || radius * 0.22));
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const travel = Math.max(0.05, Math.min(1, progress * 1.05));
      const tail = Math.max(0, travel - 0.34);
      const headX = end.fromX + dx * travel;
      const headY = end.fromY + dy * travel;
      const tailX = end.fromX + dx * tail;
      const tailY = end.fromY + dy * tail;
      const beamAlpha = Math.min(1, alpha * 1.18 + 0.12);
      const muzzleAlpha = alpha * Math.max(0, 1 - progress * 1.8);
      renderer.drawGfxCircle?.(end.fromX, end.fromY, beamWidth * (0.42 + muzzleAlpha * 0.3), "#12301f", muzzleAlpha * 0.18, "#f8fff1", muzzleAlpha * 0.38, 2, z - 3, "add", 16);
      renderer.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 2.05, "#12301f", beamAlpha * 0.22, z - 4, "add");
      renderer.drawGfxLine(tailX, tailY, headX, headY, beamWidth * 1.08, tint, beamAlpha * 0.82, z, "add");
      renderer.drawGfxLine(tailX, tailY, headX, headY, Math.max(7, beamWidth * 0.3), "#f8fff1", beamAlpha * 0.9, z + 2, "add");
      renderer.drawGfxLine(headX - ux * beamWidth * 1.25 + px * beamWidth * 0.44, headY - uy * beamWidth * 1.25 + py * beamWidth * 0.44, headX + ux * beamWidth * 0.42, headY + uy * beamWidth * 0.42, Math.max(4, beamWidth * 0.16), "#f8fff1", beamAlpha * 0.78, z + 5, "add");
      renderer.drawGfxLine(headX - ux * beamWidth * 1.25 - px * beamWidth * 0.44, headY - uy * beamWidth * 1.25 - py * beamWidth * 0.44, headX + ux * beamWidth * 0.42, headY + uy * beamWidth * 0.42, Math.max(4, beamWidth * 0.16), tint, beamAlpha * 0.72, z + 5, "add");
      renderer.drawGfxCircle?.(headX, headY, Math.max(8, beamWidth * 0.28), "#f8fff1", beamAlpha * 0.34, "#f8fff1", beamAlpha * 0.62, 1.6, z + 6, "add", 12);
      if (travel > 0.88) {
        renderer.drawGfxImpactBurst?.(end.toX, end.toY, beamWidth * 1.14, tint, alpha * 0.34, z + 8, progress * 2.2, 9);
      }
      return;
    }
    if (style.includes("sniper")) {
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 8, "#ff2d55", alpha * 0.82, z, "add");
      renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 3, "#fee2e2", alpha * 0.62, z + 1, "add");
      renderer.drawGfxDiamond(end.toX, end.toY, 7, "#fee2e2", alpha * 0.72, z + 4, angle);
      return;
    }
    renderer.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, style.includes("poison") ? 9 : 6, tint, alpha * 0.66, z, "add");
    renderer.drawGfxLine(end.fromX + Math.cos(angle) * 14, end.fromY + Math.sin(angle) * 14, end.toX, end.toY, 3, "#f8fafc", alpha * 0.54, z + 1, "add");
    renderer.drawGfxDiamond(end.toX, end.toY, style.includes("poison") ? 8 : 6, tint, alpha * 0.72, z + 3, angle);
  }

  function renderDashEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = styleText(rawStyle, effect);
    const angle = Number(effect.angle || 0);
    const tint = colorFor(effect, color, style);
    const end = endpoints(effect, radius * 1.4, angle);
    const z = effect.y + 104;
    if (style.includes("mage_blink")) {
      renderer.drawGfxRuneRing(effect.x, effect.y, radius * 0.55, "#55ccff", alpha * 0.5, z, progress * 4, 8);
      renderer.drawGfxShardBurst(effect.x, effect.y, radius * 0.8, "#93c5fd", alpha * 0.36, z + 4, 10, progress * 5);
      return;
    }
    if (style.includes("shield_charge")) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const shieldX = end.toX + ux * radius * 0.16;
      const shieldY = end.toY + uy * radius * 0.16;
      renderer.drawGfxShieldWake?.(end.fromX, end.fromY, end.toX, end.toY, radius * 0.88, angle, "#f97316", alpha * 0.72, z, progress);
      if (renderer.drawGfxFrontShield) {
        renderer.drawGfxFrontShield(shieldX, shieldY, angle, radius * 0.92, "#f97316", alpha * 0.9, z + 16, progress);
      } else {
        renderer.drawGfxShieldWall?.(shieldX, shieldY, angle, radius * 0.82, "#ffd166", alpha * 0.9, z + 12, progress > 0.62);
      }
      renderer.drawGfxSparkSpray?.(shieldX + ux * radius * 0.26, shieldY + uy * radius * 0.26, radius * 0.38, "#fde68a", alpha * 0.24, z + 24, 7, progress * 3, angle, Math.PI * 0.62);
      return;
    }
    if (style.includes("warrior_dash")) {
      renderer.drawGfxDashDust?.(end.fromX, end.fromY, end.toX, end.toY, Math.max(28, radius * 0.62), angle, "#caa35a", alpha * 0.78, z, progress, {});
      renderer.drawGfxSparkSpray?.(end.toX, end.toY, radius * 0.38, "#fde68a", alpha * 0.22, z + 10, 7, progress * 4, angle, Math.PI * 0.8);
      return;
    }
    if (style.includes("shadow") || style.includes("assassin") || style.includes("stalker")) {
      renderer.fx("fx-smoke", effect.x, effect.y, Math.max(0.54, radius / 95), 0.46, "#21142f", alpha * 0.48, z - 6, angle, "add");
      renderer.fx("fx-shadow-cut", end.toX, end.toY, 0.82, 0.56, "#c4b5fd", alpha * 0.7, z + 4, angle, "add");
      return;
    }
    if (style.includes("martial")) {
      renderer.fx("fx-impact-star", end.toX, end.toY, 0.68, 0.68, "#fde68a", alpha * 0.54, z + 4, progress, "add");
      renderer.drawGfxSparkSpray?.(end.toX, end.toY, radius * 0.36, "#f8f3e9", alpha * 0.22, z + 10, 7, progress * 4, angle, Math.PI * 0.72);
      return;
    }
    renderer.drawGfxSparkSpray?.(end.toX, end.toY, radius * 0.42, tint, alpha * 0.28, z + 10, 8, progress * 4, angle, Math.PI * 0.9);
  }

  function renderMobilityOrProjectileEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = styleText(rawStyle, effect);
    const styleInfo = styleClassifier.classifyEffectStyle
      ? styleClassifier.classifyEffectStyle(style, effect.kind)
      : null;
    if (effect.kind !== "dash" && effect.kind !== "shot" && effect.kind !== "chain") return false;
    if (styleInfo ? styleInfo.lightningSkill : effect.kind === "chain" || style.includes("chain") || style.includes("lightning") || style.includes("electric")) {
      renderChainEffect(renderer, effect, progress, alpha, radius, color, style);
    } else if (effect.kind === "shot") {
      renderShotEffect(renderer, effect, progress, alpha, radius, color, style);
    } else {
      renderDashEffect(renderer, effect, progress, alpha, radius, color, style);
    }
    return true;
  }

  function renderCoreSkillEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    return (
      renderSlashEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderSpinEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderMobilityOrProjectileEffect(renderer, effect, progress, alpha, radius, color, rawStyle)
    );
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

  function drawMeteorTrail(renderer, fromX, fromY, toX, toY, width, alpha, z, phase = 0) {
    if (!renderer.drawGfxPath || !renderer.drawGfxLine) return false;
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
      "#f97316",
      alpha * 0.16,
      "#fed7aa",
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
      "#fde68a",
      alpha * 0.16,
      "#fff7ed",
      alpha * 0.18,
      1,
      z + 1,
      "add",
    );
    renderer.drawGfxLine(fromX, fromY, toX - ux * width * 0.32, toY - uy * width * 0.32, Math.max(3, width * 0.18), "#fff7ed", alpha * 0.26, z + 2, "add");
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

  function drawMeteorFragments(renderer, x, y, radius, alpha, z, phase = 0) {
    if (!renderer.drawGfxPath) return;
    const count = 8;
    for (let i = 0; i < count; i += 1) {
      const angle = phase * 0.32 + (Math.PI * 2 * i) / count;
      const dist = radius * (0.26 + (i % 3) * 0.08);
      const cx = x + Math.cos(angle) * dist;
      const cy = y + Math.sin(angle) * dist * 0.64;
      const size = 5 + (i % 3) * 2;
      renderer.drawGfxPath(meteorRockPoints(cx, cy, angle, size * 1.25, size * 0.74, phase + i), i % 2 ? "#7c2d12" : "#3f1f13", alpha * 0.36, "#fed7aa", alpha * 0.24, 1.2, z + i, "normal");
    }
  }

  function drawMeteorLandingShadow(renderer, x, y, radius, fall, impact, alpha, z) {
    const shadowAlpha = alpha * Math.max(0, 1 - impact * 0.85) * (0.05 + fall * 0.18);
    const shadowRadius = radius * (0.24 + fall * 0.46);
    renderer.drawGfxCircle(x, y + radius * 0.08, shadowRadius, "#000000", shadowAlpha, "#7c2d12", alpha * fall * 0.08, 1.5, z, "normal", 34);
    renderer.drawGfxCircle(x, y + radius * 0.08, shadowRadius * 0.58, "#0b0604", shadowAlpha * 0.9, "#f97316", alpha * fall * 0.06, 1, z + 1, "add", 24);
  }

  function drawMeteorImpactBloom(renderer, x, y, radius, impact, alpha, z, phase) {
    if (impact <= 0) return;
    const flash = Math.max(0, 1 - impact);
    renderer.drawGfxCircle(x, y, radius * (0.28 + impact * 0.2), "#fff7ed", alpha * flash * 0.22, "#fed7aa", alpha * flash * 0.62, 5, z + 8, "add", 24);
    renderer.drawGfxCircle(x, y, radius * (0.48 + impact * 0.54), "#7c2d12", alpha * (0.12 - impact * 0.05), "#f97316", alpha * (0.36 - impact * 0.18), 5, z + 9, "add", 42);
    renderer.drawGfxImpactBurst(x, y, radius * (0.62 + impact * 0.42), "#f97316", alpha * (0.58 - impact * 0.16), z + 16, phase, 16);
    renderer.drawGfxSparkSpray?.(x, y, radius * (0.7 + impact * 0.42), "#fde68a", alpha * (0.42 - impact * 0.12), z + 24, 18, phase * 4.2);
    drawMeteorFragments(renderer, x, y, radius * (0.52 + impact * 0.24), alpha * Math.min(1, impact * 1.4), z + 28, phase * 4);
  }

  function renderMeteorEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "meteor") return false;
    const fallEnd = 0.72;
    const fallT = Math.max(0, Math.min(1, progress / fallEnd));
    const fall = fallT * fallT * (3 - fallT * 2);
    const impact = Math.max(0, Math.min(1, (progress - fallEnd) / (1 - fallEnd)));
    const startX = effect.x - radius * 0.84;
    const startY = effect.y - radius * 3.2;
    const sx = startX + (effect.x - startX) * fall;
    const sy = startY + (effect.y - startY) * fall;
    const z = effect.y + 120;
    const angle = Math.atan2(effect.y - startY, effect.x - startX);
    drawMeteorLandingShadow(renderer, effect.x, effect.y, radius, fall, impact, alpha, z - 22);
    renderer.drawGfxArc?.(effect.x, effect.y, radius * 0.9, Math.PI * 0.12, Math.PI * 0.92, 3.5, "#f97316", alpha * Math.max(0.04, 0.18 - impact * 0.1), z - 18, "add", 12);
    renderer.drawGfxArc?.(effect.x, effect.y, radius * 0.9, -Math.PI * 0.92, -Math.PI * 0.12, 3.5, "#f97316", alpha * Math.max(0.04, 0.18 - impact * 0.1), z - 18, "add", 12);
    if (impact <= 0.05) {
      const tailX = sx - Math.cos(angle) * radius * (0.7 + fall * 0.14);
      const tailY = sy - Math.sin(angle) * radius * (0.7 + fall * 0.14);
      drawMeteorTrail(renderer, tailX, tailY, sx, sy, radius * (0.21 + fall * 0.08), alpha, z - 6 + fall * 8, progress);
    }
    drawMeteorImpactBloom(renderer, effect.x, effect.y, radius, impact, alpha, z + 4, progress * 5);
    return true;
  }

  function renderFreezeEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "freeze" && effect.kind !== "slow") return false;
    const style = styleText("", effect);
    if (style.includes("frost_breath")) {
      const z = effect.y + 76;
      const softAlpha = alpha * (effect.active ? 0.14 : 0.09);
      const baseAngle = Number(effect.seed || 0) * 0.17;
      renderer.drawGfxCircle(effect.x, effect.y, radius * 0.9, "#071923", softAlpha * 0.14, "#93c5fd", softAlpha, 2, z, "add", 44);
      renderer.drawGfxCircle(effect.x, effect.y, radius * 0.58, "#0c1f2e", softAlpha * 0.06, "#dbeafe", softAlpha * 0.28, 1.5, z + 2, "add", 32);
      if (renderer.drawGfxArc) {
        for (let i = 0; i < 3; i += 1) {
          const a = baseAngle + (Math.PI * 2 * i) / 3;
          renderer.drawGfxArc(effect.x, effect.y, radius * (0.54 + i * 0.13), a - 0.28, a + 0.42, 2, i % 2 ? "#bfdbfe" : "#93c5fd", softAlpha * 0.26, z + 4 + i, "add", 6);
        }
      }
      return true;
    }
    const snap = progress < 0.18 ? progress / 0.18 : Math.max(0, 1 - (progress - 0.18) / 0.82);
    const z = effect.y + 100;
    renderer.drawGfxCircle(effect.x, effect.y, radius * (0.86 + snap * 0.08), "#0c1f2e", alpha * 0.1, "#93c5fd", alpha * 0.64, 5, z, "add", 30);
    renderer.drawGfxShardBurst(effect.x, effect.y, radius * 0.92, "#dbeafe", alpha * 0.62, z + 4, 14, progress * 2);
    renderer.drawGfxRuneRing(effect.x, effect.y, radius * 0.62, "#55ccff", alpha * 0.32, z + 16, progress * 4, 8);
    return true;
  }

  function renderWarningEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "warning") return false;
    const style = styleText(rawStyle, effect);
    if (style.includes("sniper_lock") || style.includes("charge_predict") || style.includes("spit_cast")) return true;
    if (style.includes("boss_arrival")) {
      const tint = style.includes("execution") ? "#ef4444" : color || "#f97316";
      const collapseRadius = radius * (1.08 - progress * 0.34);
      const z = effect.y + 70;
      renderer.drawGfxRuneRing(effect.x, effect.y, collapseRadius, tint, 0.3 + alpha * 0.38, z, -progress * 4.5, 12);
      renderer.drawGfxCircle(effect.x, effect.y, radius * (0.34 + progress * 0.2), "#000000", alpha * 0.14, tint, alpha * 0.42, 4, z + 3, "add", 24);
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + progress * 0.55;
        const outerX = effect.x + Math.cos(angle) * collapseRadius;
        const outerY = effect.y + Math.sin(angle) * collapseRadius;
        const innerX = effect.x + Math.cos(angle) * radius * 0.34;
        const innerY = effect.y + Math.sin(angle) * radius * 0.34;
        renderer.drawGfxLine(outerX, outerY, innerX, innerY, 3, tint, alpha * 0.28, z + 5 + i, "add");
      }
      return true;
    }
    const danger = style.includes("poison") ? "#a3ff4f" : style.includes("sniper") || style.includes("lock") ? "#ff2d55" : color || "#ff4d6d";
    const z = effect.y + 42;
    drawCrosshair(renderer, effect.x, effect.y, radius * (0.98 - progress * 0.06), danger, 0.32 + alpha * 0.36, z, progress * 1.6);
    if (style.includes("sniper") && Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY)) {
      renderer.drawGfxLine(effect.fromX, effect.fromY, effect.x, effect.y, 10, danger, 0.16 + alpha * 0.2, z - 1, "add");
    }
    return true;
  }

  function renderSupportEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "shield" && effect.kind !== "cleanse" && effect.kind !== "revive" && effect.kind !== "holy") return false;
    const heal = effect.kind === "holy" || effect.kind === "revive" || effect.kind === "cleanse" || styleText(rawStyle, effect).includes("heal");
    const tint = heal ? "#86efac" : color || "#67e8f9";
    const z = effect.y + 88;
    renderer.drawGfxRuneRing(effect.x, effect.y, radius * (0.66 + progress * 0.18), tint, alpha * 0.58, z, progress * 2, heal ? 10 : 8);
    if (heal) {
      renderer.drawGfxLine(effect.x - radius * 0.28, effect.y, effect.x + radius * 0.28, effect.y, 6, "#dcfce7", alpha * 0.58, z + 10, "add");
      renderer.drawGfxLine(effect.x, effect.y - radius * 0.28, effect.x, effect.y + radius * 0.28, 6, "#dcfce7", alpha * 0.58, z + 11, "add");
    } else {
      renderer.drawGfxPath([
        { x: effect.x, y: effect.y - radius * 0.46 },
        { x: effect.x + radius * 0.42, y: effect.y - radius * 0.1 },
        { x: effect.x + radius * 0.26, y: effect.y + radius * 0.42 },
        { x: effect.x - radius * 0.26, y: effect.y + radius * 0.42 },
        { x: effect.x - radius * 0.42, y: effect.y - radius * 0.1 },
      ], "#08111f", alpha * 0.18, tint, alpha * 0.62, 4, z + 10, "add");
    }
    return true;
  }

  function renderPoisonEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "poison") return false;
    const tint = styleText("", effect).includes("venom") ? "#c084fc" : effect.color || "#a3ff4f";
    const fill = styleText("", effect).includes("venom") ? "#2e1065" : "#365314";
    const light = styleText("", effect).includes("venom") ? "#f5d0fe" : "#ecfccb";
    const z = effect.y + 70;
    renderer.drawGfxCircle(effect.x, effect.y, radius * (0.55 + progress * 0.18), fill, alpha * 0.08, tint, alpha * 0.28, 3, z, "add", 18);
    for (let i = 0; i < 6; i += 1) {
      const a = progress * 2 + (Math.PI * 2 * i) / 6;
      const r = radius * (0.18 + (i % 3) * 0.15);
      renderer.drawGfxCircle(effect.x + Math.cos(a) * r, effect.y + Math.sin(a) * r, radius * 0.08, tint, alpha * 0.16, light, alpha * 0.28, 1.5, z + i, "add", 10);
    }
    return true;
  }

  function renderTrapEffect(renderer, effect, progress, alpha, radius, color) {
    if (effect.kind !== "trap") return false;
    const tint = color || "#39ff88";
    renderer.drawGfxRuneRing(effect.x, effect.y, radius * 0.72, tint, alpha * 0.46, effect.y + 72, progress * 4, 6);
    renderer.drawGfxLine(effect.x - radius * 0.55, effect.y, effect.x + radius * 0.55, effect.y, 3, tint, alpha * 0.36, effect.y + 74, "add");
    renderer.drawGfxLine(effect.x, effect.y - radius * 0.55, effect.x, effect.y + radius * 0.55, 3, tint, alpha * 0.36, effect.y + 75, "add");
    return true;
  }

  function renderRewardBurstEffect(renderer, effect, progress, alpha, radius, color) {
    if (effect.kind !== "arcane" && effect.kind !== "star" && effect.kind !== "level" && effect.kind !== "chest") return false;
    const tint = effect.kind === "chest" ? "#ffd166" : effect.kind === "level" ? "#67e8f9" : color || "#f8fafc";
    renderer.drawGfxImpactBurst(effect.x, effect.y, radius * (0.48 + progress * 0.28), tint, alpha * 0.58, effect.y + 86, progress * 2, 12);
    renderer.drawGfxRuneRing(effect.x, effect.y, radius * (0.48 + progress * 0.36), tint, alpha * 0.34, effect.y + 92, progress * 3, 8);
    return true;
  }

  function renderImpactEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "impact") return false;
    const style = styleText(rawStyle, effect);
    const heavy = style.includes("heavy") || style.includes("critical") || style.includes("slam") || effect.heavy;
    const tint = style.includes("player") ? "#ff2d55" : color || "#f8fafc";
    renderer.drawGfxImpactBurst(effect.x, effect.y, radius * (heavy ? 0.7 : 0.46), tint, alpha * (heavy ? 0.72 : 0.48), effect.y + 94, progress * 3, heavy ? 16 : 9);
    if (heavy) renderer.drawGfxCircle(effect.x, effect.y, radius * (0.32 + progress * 0.34), "#000000", 0, tint, alpha * 0.2, 4, effect.y + 100, "add", 20);
    return true;
  }

  function renderExplosionEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    if (effect.kind !== "explosion" && effect.kind !== "death") return false;
    const style = styleText(rawStyle, effect);
    if (style.includes("boss_beam_fire")) {
      const angle = Number(effect.angle) || 0;
      const length = Math.max(80, Number(effect.length) || radius * 8);
      const width = Math.max(10, Number(effect.radius) || radius);
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const half = length / 2;
      const x1 = effect.x - ux * half;
      const y1 = effect.y - uy * half;
      const x2 = effect.x + ux * half;
      const y2 = effect.y + uy * half;
      const tint = color || "#ef4444";
      const flash = Math.max(0, 1 - progress * 1.18);
      const z = effect.y + 96;
      renderer.drawGfxLine(x1, y1, x2, y2, width * 2.2, "#22050b", alpha * 0.5 * flash, z - 4, "normal");
      renderer.drawGfxLine(x1, y1, x2, y2, width * 1.58, tint, alpha * 0.84 * flash, z - 2, "add");
      renderer.drawGfxLine(x1, y1, x2, y2, Math.max(5, width * 0.34), "#fff1f2", alpha * 0.96 * flash, z + 1, "add");
      renderer.drawGfxLine(x1, y1, x2, y2, Math.max(2, width * 0.1), "#ffffff", alpha * flash, z + 3, "add");
      renderer.drawGfxCircle(x1, y1, width * 0.72, "#3f0712", alpha * 0.38 * flash, tint, alpha * 0.7 * flash, 3, z + 4, "add", 14);
      renderer.drawGfxImpactBurst(x2, y2, width * 0.82, tint, alpha * 0.52 * flash, z + 6, progress * 2.4, 8);
      return true;
    }
    if (style.includes("boss_arrival_sacrifice")) {
      const tint = color || "#f97316";
      const z = effect.y + 92;
      renderer.drawGfxCircle(effect.x, effect.y, radius * (0.9 - progress * 0.62), "#000000", alpha * 0.2, tint, alpha * 0.5, 4, z, "add", 20);
      renderer.drawGfxSparkSpray(effect.x, effect.y, radius * (0.7 + progress * 0.2), tint, alpha * 0.42, z + 4, 10, -progress * 4);
      return true;
    }
    const poison = style.includes("poison") || style.includes("splitter");
    const fire = style.includes("fire") || style.includes("bomber") || style.includes("blast") || style.includes("meteor");
    const iceMeteor = Boolean(effect.iceMeteor) && style.includes("meteor");
    const tint = poison ? "#a3ff4f" : iceMeteor ? "#38bdf8" : fire ? "#f97316" : color || "#f8fafc";
    const impactDark = iceMeteor ? "#082f49" : "#7c2d12";
    const impactHot = iceMeteor ? "#e0f2fe" : "#fed7aa";
    const z = effect.y + 92;
    renderer.drawGfxCircle(effect.x, effect.y, radius * (0.35 + progress * 0.66), tint, alpha * 0.08, tint, alpha * 0.38, 5, z, "add", 26);
    renderer.drawGfxSparkSpray(effect.x, effect.y, radius * (0.85 + progress * 0.28), tint, alpha * 0.44, z + 4, fire ? 18 : 12, progress * 5);
    if (fire) renderer.drawGfxCircle(effect.x, effect.y, radius * 0.62, impactDark, alpha * 0.12, impactHot, alpha * 0.2, 3, z + 12, "add", 20);
    return true;
  }

  function renderDefaultBurstEffect(renderer, effect, progress, alpha, radius, color) {
    renderer.drawGfxImpactBurst(effect.x, effect.y, radius * 0.52, color || "#f8fafc", alpha * 0.5, effect.y + 80, progress * 3, 10);
    return true;
  }

  function renderNeonEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    return (
      renderCoreSkillEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderMeteorEffect(renderer, effect, progress, alpha, radius) ||
      renderFreezeEffect(renderer, effect, progress, alpha, radius) ||
      renderWarningEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderSupportEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderPoisonEffect(renderer, effect, progress, alpha, radius) ||
      renderTrapEffect(renderer, effect, progress, alpha, radius, color) ||
      renderRewardBurstEffect(renderer, effect, progress, alpha, radius, color) ||
      renderImpactEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderExplosionEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderDefaultBurstEffect(renderer, effect, progress, alpha, radius, color)
    );
  }

  function renderSecondaryEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    return (
      renderMeteorEffect(renderer, effect, progress, alpha, radius) ||
      renderFreezeEffect(renderer, effect, progress, alpha, radius) ||
      renderWarningEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderSupportEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderPoisonEffect(renderer, effect, progress, alpha, radius) ||
      renderTrapEffect(renderer, effect, progress, alpha, radius, color) ||
      renderRewardBurstEffect(renderer, effect, progress, alpha, radius, color) ||
      renderImpactEffect(renderer, effect, progress, alpha, radius, color, rawStyle) ||
      renderExplosionEffect(renderer, effect, progress, alpha, radius, color, rawStyle)
    );
  }

  window.RoguePixiEffects = Object.freeze({
    effectProgress,
    effectRadius,
    floatingTextStyle,
    floatingTextValue,
    isFloatingTextEffect,
    renderFloatingTextEffect,
    renderSlashEffect,
    renderSpinEffect,
    renderChainEffect,
    renderShotEffect,
    renderDashEffect,
    renderMobilityOrProjectileEffect,
    renderCoreSkillEffect,
    renderMeteorEffect,
    renderFreezeEffect,
    renderWarningEffect,
    renderSupportEffect,
    renderPoisonEffect,
    renderTrapEffect,
    renderRewardBurstEffect,
    renderImpactEffect,
    renderExplosionEffect,
    renderSecondaryEffect,
    renderDefaultBurstEffect,
    renderNeonEffect,
  });
})();
