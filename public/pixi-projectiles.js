(() => {
  const styleClassifier = window.RogueEffectStyle || {};
  const skinEffects = window.RoguePixiSkinEffects || {};

  function projectileStyle(projectile) {
    return projectile.style || projectile.classId || "";
  }

  function classifyProjectile(projectile) {
    const style = projectileStyle(projectile).toLowerCase();
    const styleInfo = styleClassifier.classifyProjectileStyle
      ? styleClassifier.classifyProjectileStyle(style, projectile.classId)
      : null;
    if (styleInfo) {
      return {
        style,
        poison: projectile.poison || styleInfo.poison,
        fire: styleInfo.fire,
        lightning: styleInfo.lightning,
        tool: styleInfo.tool,
        laser: styleInfo.laser,
        missile: styleInfo.missile,
        arcane: styleInfo.arcane,
        arrow: styleInfo.arrow,
        thread: styleInfo.thread,
        flask: styleInfo.flask,
        shadow: styleInfo.shadow,
        styleInfo,
      };
    }
    return {
      style,
      poison: projectile.poison || style.includes("poison") || style.includes("venom") || style.includes("acid"),
      fire: style.includes("fire") || style.includes("meteor") || style.includes("mortar") || style.includes("bomb"),
      lightning: style.includes("electric") || style.includes("chain") || style.includes("rail") || style.includes("shock"),
      tool: style.includes("engineer_bolt") || style.includes("wrench"),
      laser: style.includes("mecha_laser_shot") || style.includes("laser_shot"),
      missile: style.includes("missile") || style.includes("rocket"),
      arcane: projectile.classId === "mage" || style.includes("arcane") || style.includes("star_orb"),
      arrow: style.includes("arrow") || style.includes("ranger") || style.includes("sniper") || style.includes("shuriken"),
      thread: style.includes("thread"),
      flask: style.includes("alchemy") || style.includes("bottle") || style.includes("flask"),
      shadow: style.includes("shuriken") || style.includes("shadow") || style.includes("assassin"),
    };
  }

  function isHostileProjectile(projectile, tags) {
    return Boolean(projectile.hostile) || tags.style === "stalker_shuriken" || tags.style === "sniper_bolt" || tags.style === "venom_spit";
  }

  function projectileSpriteKey(renderer, projectile, tags) {
    if (tags.thread) return "neon-thread";
    if (tags.flask) return "neon-flask";
    if (tags.shadow) return "neon-shadow";
    if (tags.tool) return "neon-wrench";
    if (tags.missile) return "neon-missile";
    if (tags.laser) return "neon-projectile";
    if (tags.lightning) return "neon-lightning";
    if (tags.fire) return "neon-fire";
    if (tags.poison) return "neon-poison";
    if (tags.arrow) return tags.style.includes("piercing") || projectile.pierce > 0 ? "neon-pierce" : "neon-arrow";
    return "neon-projectile";
  }

  function projectileScale(projectile, tags) {
    const base = Math.max(0.55, (projectile.radius || 6) / 7);
    return {
      scaleX: tags.lightning || tags.arrow || tags.thread ? base * 1.2 : base,
      scaleY: tags.flask || tags.fire || tags.poison ? base : base * 0.62,
    };
  }

  function projectileTint(projectile, tags) {
    if (isHostileProjectile(projectile, tags)) return "#ff2d55";
    if (tags.thread) return "#d783ff";
    if (tags.flask) return tags.style.includes("fire") ? "#f97316" : "#a3ff4f";
    if (tags.shadow) return "#b68cff";
    if (tags.tool) return projectile.color || "#d6b76d";
    if (tags.missile) return "#f97316";
    if (tags.laser) return "#67e8f9";
    if (tags.poison) return "#a3ff4f";
    if (tags.arcane) return projectile.color || "#b985c8";
    if (tags.fire) return "#f97316";
    if (tags.lightning) return "#67e8f9";
    if (tags.arrow) return projectile.color || "#f1d08b";
    return projectile.color || "#f8fafc";
  }

  function drawSkinnedMageOrb(renderer, projectile, palette, z, now) {
    const radius = Math.max(7, Number(projectile.radius || 6));
    const angle = Number(projectile.angle || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const phase = now / 420 + Number(projectile.id || 0) * 0.37;
    const x = projectile.x;
    const y = projectile.y;
    const tail = radius * 3.3;

    renderer.drawGfxLine?.(x - ux * tail, y - uy * tail, x - ux * radius * 0.25, y - uy * radius * 0.25, radius * 0.7, palette.dark, 0.22, z - 5, "add");
    renderer.drawGfxLine?.(x - ux * tail * 0.78, y - uy * tail * 0.78, x, y, Math.max(2, radius * 0.28), palette.main, 0.48, z - 4, "add");

    if (palette.shape === "star") {
      renderer.drawGfxStar?.(x, y, radius * 1.16, palette.hot, 0.92, z + 1, 8);
      renderer.drawGfxDiamond?.(x, y, radius * 0.38, "#ffffff", 0.9, z + 3, phase, palette.main);
      renderer.drawGfxLine?.(x - px * radius * 1.35, y - py * radius * 1.35, x + px * radius * 1.35, y + py * radius * 1.35, 1.5, palette.hot, 0.58, z + 2, "add");
    } else if (palette.shape === "void") {
      renderer.drawGfxDiamond?.(x, y, radius * 1.02, palette.dark, 0.96, z + 1, angle + Math.PI * 0.25, palette.main);
      renderer.drawGfxArc?.(x, y, radius * 1.28, phase, phase + Math.PI * 1.15, 2.6, palette.hot, 0.74, z + 3, "add", 9);
      renderer.drawGfxArc?.(x, y, radius * 1.28, phase + Math.PI, phase + Math.PI * 2.15, 2.6, palette.main, 0.68, z + 4, "add", 9);
    } else if (palette.shape === "ember") {
      renderer.drawGfxPath?.([
        { x: x + ux * radius * 1.35, y: y + uy * radius * 1.35 },
        { x: x - ux * radius * 0.9 + px * radius * 0.72, y: y - uy * radius * 0.9 + py * radius * 0.72 },
        { x: x - ux * radius * 0.42, y: y - uy * radius * 0.42 },
        { x: x - ux * radius * 0.9 - px * radius * 0.72, y: y - uy * radius * 0.9 - py * radius * 0.72 },
      ], palette.main, 0.82, palette.hot, 0.82, 1.8, z + 1, "add");
      renderer.drawGfxDiamond?.(x + ux * radius * 0.2, y + uy * radius * 0.2, radius * 0.38, palette.hot, 0.94, z + 3, angle, "#ffffff");
    } else {
      renderer.drawGfxDiamond?.(x, y, radius * 1.02, palette.main, 0.86, z + 1, angle + Math.PI * 0.25, palette.hot);
      for (const side of [-1, 1]) {
        renderer.drawGfxDiamond?.(x - ux * radius * 0.42 + px * side * radius * 0.62, y - uy * radius * 0.42 + py * side * radius * 0.62, radius * 0.46, side > 0 ? palette.hot : palette.main, 0.68, z + 2, angle + side * 0.72, palette.hot);
      }
      renderer.drawGfxLine?.(x - ux * radius * 0.82, y - uy * radius * 0.82, x + ux * radius * 0.72, y + uy * radius * 0.72, 1.5, palette.hot, 0.78, z + 4, "add");
    }
  }

  function drawCondensedStarlight(renderer, projectile, palette, z, now) {
    const radius = Math.max(18, Number(projectile.radius || 32));
    const angle = Number(projectile.angle || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const phase = now / 520 + Number(projectile.id || 0) * 0.41;
    const pulse = 0.98 + Math.sin(now / 140 + Number(projectile.id || 0)) * 0.025;
    const style = String(projectile.style || "").toLowerCase();
    const expanded = style.includes("expanded_star");
    const empowered = style.includes("empowered_core");
    const main = palette?.main || "#a78bfa";
    const hot = palette?.hot || "#f5d0fe";
    const dark = palette?.dark || "#211334";
    const x = Number(projectile.x || 0);
    const y = Number(projectile.y || 0);
    const tailLength = radius * (expanded ? 3.45 : 3.05);

    if (Number(projectile.splash || 0) > radius) {
      renderer.drawGfxCircle(x, y, projectile.splash, "#000000", 0, main, 0.055, 1.5, z - 12, "add", 40);
    }

    renderer.drawGfxLine(x - ux * tailLength, y - uy * tailLength, x - ux * radius * 0.24, y - uy * radius * 0.24, Math.max(8, radius * 0.34), dark, 0.16, z - 8, "add");
    renderer.drawGfxLine(x - ux * tailLength * 0.86, y - uy * tailLength * 0.86, x, y, Math.max(3, radius * 0.11), main, 0.34, z - 6, "add");
    for (const side of [-1, 1]) {
      renderer.drawGfxLine(
        x - ux * radius * 1.5 + px * side * radius * 0.22,
        y - uy * radius * 1.5 + py * side * radius * 0.22,
        x - ux * radius * 0.15 + px * side * radius * 0.06,
        y - uy * radius * 0.15 + py * side * radius * 0.06,
        Math.max(1.5, radius * 0.035),
        hot,
        0.28,
        z - 4,
        "add"
      );
    }

    renderer.drawGfxLine(x - ux * radius * 0.2, y - uy * radius * 0.2, x + ux * radius * 1.08, y + uy * radius * 1.08, Math.max(2, radius * 0.055), hot, 0.48, z + 1, "add");
    renderer.drawGfxDiamond(x + ux * radius * 0.92, y + uy * radius * 0.92, radius * 0.11, "#ffffff", 0.8, z + 6, angle, main);

    renderer.drawGfxCircle(x, y, radius * pulse, dark, 0.2, main, 0.42, Math.max(2, radius * 0.035), z - 2, "add", 28);
    renderer.drawGfxCircle(x, y, radius * 0.7, dark, 0.32, hot, 0.16, Math.max(1.5, radius * 0.022), z, "add", 24);
    renderer.drawGfxArc(x, y, radius * 0.84, phase, phase + Math.PI * 1.18, Math.max(2, radius * 0.035), hot, 0.5, z + 2, "add", 16);
    renderer.drawGfxArc(x, y, radius * 0.84, phase + Math.PI, phase + Math.PI * 2.18, Math.max(2, radius * 0.035), main, 0.44, z + 3, "add", 16);
    if (expanded) {
      renderer.drawGfxArc(x, y, radius * 1.02, -phase * 0.72, -phase * 0.72 + Math.PI * 0.78, Math.max(1.5, radius * 0.025), hot, 0.26, z + 4, "add", 14);
    }
    renderer.drawGfxStar(x, y, radius * 0.49, hot, 0.74, z + 5, 8);
    renderer.drawGfxDiamond(x, y, radius * (empowered ? 0.2 : 0.16), "#ffffff", empowered ? 0.92 : 0.78, z + 7, phase * 0.8, main);
  }

  function drawArrow(renderer, projectile, tint, z, now) {
    const angle = projectile.angle || 0;
    const r = Math.max(7, projectile.radius || 6);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const tailX = projectile.x - ux * r * 2.3;
    const tailY = projectile.y - uy * r * 2.3;
    const tipX = projectile.x + ux * r * 2.1;
    const tipY = projectile.y + uy * r * 2.1;
    renderer.drawGfxLine(tailX, tailY, tipX, tipY, projectile.pierce > 0 ? 6 : 4, tint, 0.78, z, "add");
    renderer.drawGfxLine(tipX - ux * r * 0.5 - px * r * 0.42, tipY - uy * r * 0.5 - py * r * 0.42, tipX, tipY, 3, "#f8fafc", 0.66, z + 1, "add");
    renderer.drawGfxLine(tipX - ux * r * 0.5 + px * r * 0.42, tipY - uy * r * 0.5 + py * r * 0.42, tipX, tipY, 3, "#f8fafc", 0.66, z + 2, "add");
  }

  function drawFireArrow(renderer, projectile, z, now) {
    const angle = projectile.angle || 0;
    const r = Math.max(8, projectile.radius || 7);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const phase = now / 82 + Number(projectile.id || 0) * 0.47;
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
        "add"
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
      const a = (1 - t) * 0.38;
      renderer.drawGfxCircle(x, y, r * (0.12 + (i % 2) * 0.04), i % 2 ? "#fde68a" : "#fb923c", a, "#fff7ed", a * 0.45, 1, z + 7 + i, "add", 8);
    }
  }

  function drawPoisonArrow(renderer, projectile, z, now) {
    const angle = projectile.angle || 0;
    const r = Math.max(8, projectile.radius || 7);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const phase = now / 120 + Number(projectile.id || 0) * 0.39;
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
  }

  function drawFlask(renderer, projectile, tint, z) {
    renderer.drawGfxFlask(projectile.x, projectile.y, projectile.angle || 0, tint, 0.86, z, Math.max(0.72, (projectile.radius || 7) / 6));
    renderer.drawGfxSparkSpray(projectile.x, projectile.y, Math.max(20, (projectile.radius || 7) * 2.3), tint, 0.18, z + 3, 5, projectile.x * 0.01);
  }

  function drawWrench(renderer, projectile, tint, z, now) {
    const travelAngle = projectile.angle || 0;
    const r = Math.max(8, projectile.radius || 7);
    const spin = now / 58 + Number(projectile.id || 0) * 0.73;
    const angle = travelAngle + spin;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const tailX = projectile.x - ux * r * 2.25;
    const tailY = projectile.y - uy * r * 2.25;
    const neckX = projectile.x + ux * r * 0.88;
    const neckY = projectile.y + uy * r * 0.88;
    const jawX = projectile.x + ux * r * 1.82;
    const jawY = projectile.y + uy * r * 1.82;

    renderer.drawGfxLine(tailX, tailY, neckX, neckY, 9, "#2b2118", 0.9, z, "normal");
    renderer.drawGfxLine(tailX + px * r * 0.05, tailY + py * r * 0.05, neckX + px * r * 0.05, neckY + py * r * 0.05, 5, tint, 0.82, z + 1, "normal");
    renderer.drawGfxLine(tailX + px * r * 0.38, tailY + py * r * 0.38, neckX + px * r * 0.16, neckY + py * r * 0.16, 2, "#fff7ed", 0.52, z + 2, "add");

    renderer.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.52, "#2b2118", 0.66, "#f8fafc", 0.62, 3, z + 3, "normal", 14);
    renderer.drawGfxCircle(tailX - ux * r * 0.12, tailY - uy * r * 0.12, r * 0.24, "#07111f", 0.74, "#9ee6ff", 0.22, 1.5, z + 4, "add", 10);

    renderer.drawGfxLine(neckX - px * r * 0.38, neckY - py * r * 0.38, jawX - px * r * 0.85, jawY - py * r * 0.85, 6, "#f8fafc", 0.74, z + 5, "normal");
    renderer.drawGfxLine(neckX + px * r * 0.38, neckY + py * r * 0.38, jawX + px * r * 0.85, jawY + py * r * 0.85, 6, "#f8fafc", 0.74, z + 6, "normal");
    renderer.drawGfxLine(jawX - px * r * 0.85, jawY - py * r * 0.85, jawX - px * r * 0.38 + ux * r * 0.34, jawY - py * r * 0.38 + uy * r * 0.34, 4, "#d6b76d", 0.7, z + 7, "add");
    renderer.drawGfxLine(jawX + px * r * 0.85, jawY + py * r * 0.85, jawX + px * r * 0.38 + ux * r * 0.34, jawY + py * r * 0.38 + uy * r * 0.34, 4, "#d6b76d", 0.7, z + 8, "add");
  }

  function drawLightningProjectile(renderer, projectile, tint, z, now, tags) {
    const angle = projectile.angle || 0;
    const mechaShot = tags.style.includes("mecha_laser_shot");
    const radius = mechaShot ? Math.max(3.5, projectile.radius || 4.5) : Math.max(7, projectile.radius || 6);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const tail = mechaShot ? radius * 3.1 : radius * 2.35;
    const tip = mechaShot ? radius * 3.5 : radius * 2.25;
    const fromX = projectile.x - ux * tail;
    const fromY = projectile.y - uy * tail;
    const toX = projectile.x + ux * tip;
    const toY = projectile.y + uy * tip;
    const width = mechaShot ? Math.max(3.2, radius * 0.46) : Math.max(5, radius * 0.62);
    const phase = now / 96 + Number(projectile.id || 0) * 0.37;
    if (renderer.drawGfxLightning) {
      renderer.drawGfxLightning(fromX, fromY, toX, toY, tint, 0.88, z, width, 7, radius * 1.15, phase);
      renderer.drawGfxLightning(
        projectile.x - ux * radius * 0.85,
        projectile.y - uy * radius * 0.85,
        toX + ux * radius * 0.35,
        toY + uy * radius * 0.35,
        "#f8fafc",
        0.46,
        z + 7,
        Math.max(2, width * 0.32),
        4,
        radius * 0.54,
        phase + 0.41
      );
    } else {
      renderer.drawGfxLine(fromX, fromY, toX, toY, width + 5, "#06131f", 0.3, z - 2, "add");
      renderer.drawGfxLine(fromX, fromY, toX, toY, width, tint, 0.74, z, "add");
      renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(2, width * 0.32), "#f8fafc", 0.72, z + 2, "add");
    }
    renderer.drawGfxCircle(toX, toY, Math.max(5, radius * 0.62), tint, 0.24, "#f8fafc", 0.36, 1.8, z + 10, "add", 10);
  }

  function drawMechaLaserProjectile(renderer, projectile, tint, z, now) {
    const angle = projectile.angle || 0;
    const radius = Math.max(3.5, projectile.radius || 4.5);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const fromX = projectile.x - ux * radius * 3.3;
    const fromY = projectile.y - uy * radius * 3.3;
    const toX = projectile.x + ux * radius * 3.15;
    const toY = projectile.y + uy * radius * 3.15;
    const pulse = 0.82 + Math.sin(now / 70 + Number(projectile.id || 0) * 0.37) * 0.08;
    renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(6, radius * 1.18), "#06131f", 0.28 * pulse, z - 2, "add");
    renderer.drawGfxLine(fromX, fromY, toX, toY, Math.max(3.6, radius * 0.72), tint, 0.72 * pulse, z, "add");
    renderer.drawGfxLine(fromX + ux * radius * 0.6, fromY + uy * radius * 0.6, toX, toY, Math.max(1.8, radius * 0.26), "#f8fafc", 0.78, z + 3, "add");
    renderer.drawGfxCircle(toX, toY, Math.max(4, radius * 0.58), tint, 0.18, "#f8fafc", 0.36, 1.6, z + 5, "add", 10);
  }

  function drawMissile(renderer, projectile, tint, z, now) {
    const angle = projectile.angle || 0;
    const r = Math.max(10, projectile.radius || 10);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const tailX = projectile.x - ux * r * 1.85;
    const tailY = projectile.y - uy * r * 1.85;
    const noseX = projectile.x + ux * r * 2.15;
    const noseY = projectile.y + uy * r * 2.15;
    const bodyBackX = projectile.x - ux * r * 1.1;
    const bodyBackY = projectile.y - uy * r * 1.1;
    const bodyFrontX = projectile.x + ux * r * 1.05;
    const bodyFrontY = projectile.y + uy * r * 1.05;
    const flamePulse = 0.65 + Math.sin(now / 70 + projectile.id) * 0.18;

    renderer.drawGfxLine(tailX - ux * r * 1.45, tailY - uy * r * 1.45, tailX, tailY, r * 0.9, "#fb923c", 0.18 * flamePulse, z - 3, "add");
    renderer.drawGfxLine(tailX - ux * r * 1.05, tailY - uy * r * 1.05, tailX, tailY, r * 0.42, "#fde68a", 0.34 * flamePulse, z - 2, "add");
    renderer.drawGfxPath(
      [
        { x: bodyBackX + px * r * 0.58, y: bodyBackY + py * r * 0.58 },
        { x: bodyFrontX + px * r * 0.42, y: bodyFrontY + py * r * 0.42 },
        { x: noseX, y: noseY },
        { x: bodyFrontX - px * r * 0.42, y: bodyFrontY - py * r * 0.42 },
        { x: bodyBackX - px * r * 0.58, y: bodyBackY - py * r * 0.58 },
      ],
      "#2b2118",
      0.9,
      "#fff7ed",
      0.48,
      2,
      z,
      "normal"
    );
    renderer.drawGfxLine(bodyBackX, bodyBackY, bodyFrontX, bodyFrontY, r * 0.72, tint, 0.72, z + 2, "normal");
    renderer.drawGfxLine(bodyBackX + px * r * 0.28, bodyBackY + py * r * 0.28, bodyFrontX + px * r * 0.16, bodyFrontY + py * r * 0.16, 3, "#fff7ed", 0.58, z + 3, "add");
    renderer.drawGfxPath(
      [
        { x: bodyBackX + px * r * 0.6, y: bodyBackY + py * r * 0.6 },
        { x: tailX + px * r * 1.1 - ux * r * 0.12, y: tailY + py * r * 1.1 - uy * r * 0.12 },
        { x: tailX + px * r * 0.28, y: tailY + py * r * 0.28 },
      ],
      "#67e8f9",
      0.5,
      "#e0f2fe",
      0.2,
      1.5,
      z + 4,
      "add"
    );
    renderer.drawGfxPath(
      [
        { x: bodyBackX - px * r * 0.6, y: bodyBackY - py * r * 0.6 },
        { x: tailX - px * r * 1.1 - ux * r * 0.12, y: tailY - py * r * 1.1 - uy * r * 0.12 },
        { x: tailX - px * r * 0.28, y: tailY - py * r * 0.28 },
      ],
      "#67e8f9",
      0.5,
      "#e0f2fe",
      0.2,
      1.5,
      z + 5,
      "add"
    );
  }

  function hostileProjectileBasis(projectile) {
    const angle = projectile.angle || 0;
    return {
      angle,
      r: Math.max(7, projectile.radius || 7),
      ux: Math.cos(angle),
      uy: Math.sin(angle),
      px: -Math.sin(angle),
      py: Math.cos(angle),
    };
  }

  function drawHostileSpit(renderer, projectile, z, now) {
    const { r, ux, uy, px, py } = hostileProjectileBasis(projectile);
    const venom = String(projectile.style || "").toLowerCase().includes("venom");
    const phase = now / 95 + Number(projectile.id || 0) * 0.7;
    const dark = venom ? "#173c2b" : "#29450f";
    const body = venom ? "#34d399" : "#84cc16";
    const core = venom ? "#a7f3d0" : "#d9f99d";

    for (let i = 1; i <= 3; i += 1) {
      const wobble = Math.sin(phase - i * 1.1) * r * 0.28;
      const size = r * (0.42 - i * 0.075);
      renderer.drawGfxCircle(
        projectile.x - ux * r * (1.15 + i * 0.78) + px * wobble,
        projectile.y - uy * r * (1.15 + i * 0.78) + py * wobble,
        size,
        body,
        0.34 - i * 0.055,
        core,
        0,
        0,
        z - i,
        "normal",
        10
      );
    }

    renderer.drawGfxPath(
      [
        { x: projectile.x + ux * r * 1.18, y: projectile.y + uy * r * 1.18 },
        { x: projectile.x + px * r * 0.82, y: projectile.y + py * r * 0.82 },
        { x: projectile.x - ux * r * 0.84 + px * r * 0.38, y: projectile.y - uy * r * 0.84 + py * r * 0.38 },
        { x: projectile.x - ux * r * 1.08, y: projectile.y - uy * r * 1.08 },
        { x: projectile.x - ux * r * 0.62 - px * r * 0.58, y: projectile.y - uy * r * 0.62 - py * r * 0.58 },
        { x: projectile.x - px * r * 0.9, y: projectile.y - py * r * 0.9 },
      ],
      dark,
      0.96,
      body,
      0.95,
      2.2,
      z,
      "normal"
    );
    renderer.drawGfxCircle(projectile.x + ux * r * 0.18 - px * r * 0.2, projectile.y + uy * r * 0.18 - py * r * 0.2, r * 0.34, core, 0.86, "#ffffff", 0, 0, z + 2, "add", 9);
  }

  function drawHostileSniper(renderer, projectile, z) {
    const { r, ux, uy, px, py } = hostileProjectileBasis(projectile);
    const tailX = projectile.x - ux * r * 5.8;
    const tailY = projectile.y - uy * r * 5.8;
    const tipX = projectile.x + ux * r * 2.2;
    const tipY = projectile.y + uy * r * 2.2;
    renderer.drawGfxLine(tailX, tailY, tipX, tipY, Math.max(5, r * 0.72), "#3f0711", 0.48, z - 2, "normal");
    renderer.drawGfxLine(tailX, tailY, tipX, tipY, Math.max(2, r * 0.22), "#fb7185", 0.92, z, "add");
    renderer.drawGfxPath(
      [
        { x: tipX, y: tipY },
        { x: projectile.x - ux * r * 0.45 + px * r * 0.48, y: projectile.y - uy * r * 0.45 + py * r * 0.48 },
        { x: projectile.x - ux * r * 1.35, y: projectile.y - uy * r * 1.35 },
        { x: projectile.x - ux * r * 0.45 - px * r * 0.48, y: projectile.y - uy * r * 0.45 - py * r * 0.48 },
      ],
      "#4c0519",
      1,
      "#fecdd3",
      0.9,
      1.6,
      z + 2,
      "normal"
    );
  }

  function drawHostileShuriken(renderer, projectile, z, now) {
    const r = Math.max(8, projectile.radius || 7);
    const rotation = now / 72 + Number(projectile.id || 0) * 0.9;
    const points = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = rotation + (Math.PI * i) / 4;
      const size = i % 2 === 0 ? r * 1.55 : r * 0.42;
      points.push({ x: projectile.x + Math.cos(angle) * size, y: projectile.y + Math.sin(angle) * size });
    }
    renderer.drawGfxCircle(projectile.x, projectile.y, r * 1.7, "#7f1d1d", 0.12, "#ef4444", 0, 0, z - 2, "add", 16);
    renderer.drawGfxPath(points, "#1f1724", 1, "#f87171", 0.92, 2, z, "normal");
    renderer.drawGfxCircle(projectile.x, projectile.y, r * 0.34, "#fca5a5", 0.96, "#fff1f2", 0.8, 1, z + 2, "normal", 8);
  }

  function drawHostileOrb(renderer, projectile, z, now) {
    const { r, ux, uy } = hostileProjectileBasis(projectile);
    const pulse = 0.9 + Math.sin(now / 110 + Number(projectile.id || 0)) * 0.08;
    renderer.drawGfxLine(projectile.x - ux * r * 2.5, projectile.y - uy * r * 2.5, projectile.x, projectile.y, Math.max(3, r * 0.42), "#ef4444", 0.22, z - 2, "add");
    renderer.drawGfxCircle(projectile.x, projectile.y, r * pulse, "#3f0a12", 0.96, "#ef4444", 0.9, 2.2, z, "normal", 12);
    renderer.drawGfxCircle(projectile.x + ux * r * 0.18, projectile.y + uy * r * 0.18, r * 0.32, "#fee2e2", 0.9, "#ffffff", 0, 0, z + 2, "add", 8);
  }

  function drawHostileProjectile(renderer, projectile, z, now) {
    const style = String(projectile.style || "").toLowerCase();
    if (style.includes("spit") || style.includes("venom") || projectile.poison) {
      drawHostileSpit(renderer, projectile, z, now);
      return;
    }
    if (style.includes("sniper")) {
      drawHostileSniper(renderer, projectile, z);
      return;
    }
    if (style.includes("shuriken")) {
      drawHostileShuriken(renderer, projectile, z, now);
      return;
    }
    drawHostileOrb(renderer, projectile, z, now);
  }

  function renderProjectiles(renderer, projectiles, now) {
    for (const projectile of projectiles) {
      if (renderer.isWorldVisible?.(projectile, Math.max(96, Number(projectile.splash || 0) + 32)) === false) continue;
      const tags = classifyProjectile(projectile);
      const skinPalette = !isHostileProjectile(projectile, tags) ? skinEffects.palette?.(projectile.skin) : null;
      const tint = skinPalette?.main || projectileTint(projectile, tags);
      const angle = projectile.angle || 0;
      const radius = Math.max(7, projectile.radius || 6);
      const z = projectile.y + 4;
      projectileSpriteKey(renderer, projectile, tags);
      projectileScale(projectile, tags);

      const condensedStarlight = tags.style.includes("giant_star_orb");
      const skinOverride = !condensedStarlight && !isHostileProjectile(projectile, tags) && skinEffects.renderProjectileOverride?.(renderer, projectile, now, tags);
      if (condensedStarlight) {
        drawCondensedStarlight(renderer, projectile, skinPalette, z, now);
      } else if (skinOverride) {
        // A skin may replace the complete projectile silhouette and its splash preview.
      } else if (isHostileProjectile(projectile, tags)) {
        drawHostileProjectile(renderer, projectile, z, now);
      } else if (tags.laser) {
        drawMechaLaserProjectile(renderer, projectile, tint, z, now);
      } else if (tags.lightning) {
        drawLightningProjectile(renderer, projectile, tint, z, now, tags);
      } else if (tags.tool) {
        drawWrench(renderer, projectile, tint, z, now);
      } else if (tags.missile) {
        drawMissile(renderer, projectile, tint, z, now);
      } else if (tags.flask) {
        drawFlask(renderer, projectile, tint, z);
      } else if (tags.shadow) {
        renderer.drawGfxDiamond(projectile.x, projectile.y, radius * 1.1, tint, 0.62, z, angle, "#f5d0fe");
        renderer.drawGfxLine(projectile.x - Math.cos(angle) * radius * 2.2, projectile.y - Math.sin(angle) * radius * 2.2, projectile.x, projectile.y, 4, tint, 0.28, z - 1, "add");
      } else if (tags.thread) {
        renderer.drawGfxLine(projectile.x - Math.cos(angle) * radius * 2.6, projectile.y - Math.sin(angle) * radius * 2.6, projectile.x + Math.cos(angle) * radius * 1.4, projectile.y + Math.sin(angle) * radius * 1.4, 4, tint, 0.58, z, "add");
        renderer.drawGfxDiamond(projectile.x, projectile.y, radius * 0.7, "#f9a8d4", 0.5, z + 2, now / 300);
      } else if (tags.style.includes("fire_arrow")) {
        drawFireArrow(renderer, projectile, z, now);
      } else if (tags.style.includes("poison_arrow")) {
        drawPoisonArrow(renderer, projectile, z, now);
      } else if (tags.arrow) {
        drawArrow(renderer, projectile, tint, z, now);
      } else if (tags.arcane) {
        if (skinPalette) {
          drawSkinnedMageOrb(renderer, projectile, skinPalette, z, now);
        } else {
          const fill = tags.style.includes("star_orb") ? "#3b184b" : "#1d1230";
          const core = tags.style.includes("star_orb") ? "#f0abfc" : tint;
          renderer.drawGfxCircle(projectile.x, projectile.y, radius * 1.18, fill, 0.5, tint, 0, 0, z, "add", 14);
          renderer.drawGfxCircle(projectile.x, projectile.y, radius * 0.52, core, 0.82, "#ffffff", 0, 0, z + 1, "add", 10);
        }
      } else if (tags.fire || tags.poison) {
        renderer.drawGfxCircle(projectile.x, projectile.y, radius * 1.12, tags.fire ? "#7c2d12" : "#365314", 0.18, tint, 0.54, 3, z, "add", 14);
        renderer.drawGfxLine(projectile.x - Math.cos(angle) * radius * 1.7, projectile.y - Math.sin(angle) * radius * 1.7, projectile.x, projectile.y, 5, tint, 0.24, z - 1, "add");
      } else {
        renderer.drawGfxCircle(projectile.x, projectile.y, radius, "#07111f", 0.54, tint, 0.74, 3, z, "add", 14);
      }

      if (projectile.splash && projectile.classId !== "mage" && !isHostileProjectile(projectile, tags) && !skinOverride) {
        renderer.drawGfxCircle(projectile.x, projectile.y, projectile.splash, "#000000", 0, tags.missile ? "#fb923c" : "#67e8f9", tags.missile ? 0.14 : 0.1, 2, z + 5, "add", 28);
      }
    }
  }

  window.RoguePixiProjectiles = Object.freeze({
    classifyProjectile,
    isHostileProjectile,
    projectileSpriteKey,
    projectileScale,
    projectileTint,
    renderProjectiles,
  });
})();
