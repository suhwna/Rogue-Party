(function () {
  const SKINS = Object.freeze({
    victory_trim: { main: "#facc15", hot: "#fff7cc", dark: "#713f12", shape: "star" },
    abyss_glow: { main: "#c084fc", hot: "#67e8f9", dark: "#240046", shape: "void" },
    season_ember: { main: "#ff5a1f", hot: "#fff1a8", dark: "#7f1d1d", shape: "ember" },
    season_verdant: { main: "#34d399", hot: "#ecfccb", dark: "#064e3b", shape: "leaf" },
  });

  function palette(skin) {
    return SKINS[String(skin || "")] || null;
  }

  function drawStar(renderer, x, y, size, colors, alpha, z, rotation) {
    renderer.drawGfxDiamond?.(x, y, size, colors.hot, alpha, z, rotation, colors.main);
    renderer.drawGfxLine?.(x - size * 1.35, y, x + size * 1.35, y, 1.5, colors.hot, alpha * 0.62, z + 1, "add");
    renderer.drawGfxLine?.(x, y - size * 1.35, x, y + size * 1.35, 1.5, colors.hot, alpha * 0.62, z + 1, "add");
  }

  function drawLeaf(renderer, x, y, size, colors, alpha, z, rotation) {
    renderer.drawGfxDiamond?.(x, y, size, colors.main, alpha, z, rotation, colors.hot);
    const ux = Math.cos(rotation);
    const uy = Math.sin(rotation);
    renderer.drawGfxLine?.(x - ux * size * 0.8, y - uy * size * 0.8, x + ux * size * 0.8, y + uy * size * 0.8, 1.2, colors.hot, alpha * 0.72, z + 1, "add");
  }

  function drawFlame(renderer, x, y, size, colors, alpha, z, rotation) {
    const ux = Math.cos(rotation);
    const uy = Math.sin(rotation);
    const px = -uy;
    const py = ux;
    renderer.drawGfxLine?.(x - ux * size * 1.15, y - uy * size * 1.15, x + ux * size * 0.72, y + uy * size * 0.72, Math.max(2, size * 0.72), colors.main, alpha * 0.66, z, "add");
    renderer.drawGfxLine?.(x - ux * size * 0.5 + px * size * 0.22, y - uy * size * 0.5 + py * size * 0.22, x + ux * size * 0.48, y + uy * size * 0.48, Math.max(1, size * 0.3), colors.hot, alpha, z + 1, "add");
  }

  function drawVoidShard(renderer, x, y, size, colors, alpha, z, rotation) {
    renderer.drawGfxDiamond?.(x, y, size, colors.dark, alpha * 0.76, z, rotation, colors.main);
    renderer.drawGfxArc?.(x, y, size * 1.45, rotation - 0.72, rotation + 0.72, Math.max(1.5, size * 0.22), colors.hot, alpha * 0.68, z + 1, "add", 8);
  }

  function drawSkinMotif(renderer, shape, x, y, size, colors, alpha, z, rotation) {
    if (shape === "star") drawStar(renderer, x, y, size, colors, alpha, z, rotation);
    else if (shape === "void") drawVoidShard(renderer, x, y, size, colors, alpha, z, rotation);
    else if (shape === "ember") drawFlame(renderer, x, y, size, colors, alpha, z, rotation);
    else drawLeaf(renderer, x, y, size, colors, alpha, z, rotation);
  }

  function renderPlayerSkinEffect(renderer, player, pos, radius, now, bob, z) {
    const colors = palette(player.skin);
    if (!colors) return;
    const centerY = pos.y + bob;
    const attackAge = Date.now() - Number(player.lastAttackAt || 0);
    const skillAge = Date.now() - Number(player.lastSkillAt || 0);
    const angle = Number(player.facing || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;

    const idlePhase = now / 900 + Number(player.id || 0) * 0.41;
    const idleRing = radius * 1.16;
    if (colors.shape === "star") {
      renderer.drawGfxArc?.(pos.x, centerY, idleRing, idlePhase, idlePhase + Math.PI * 0.72, 2.4, colors.main, 0.34, z + 31, "add", 10);
      renderer.drawGfxArc?.(pos.x, centerY, idleRing, idlePhase + Math.PI, idlePhase + Math.PI * 1.72, 2.4, colors.hot, 0.24, z + 32, "add", 10);
      drawStar(renderer, pos.x, centerY - radius * 1.48, radius * 0.16, colors, 0.82, z + 35, idlePhase);
    } else if (colors.shape === "void") {
      renderer.drawGfxCircle?.(pos.x, centerY, radius * 1.12, colors.dark, 0.13, colors.main, 0.48, 2.8, z + 31, "add", 20);
      renderer.drawGfxArc?.(pos.x, centerY, radius * 1.35, idlePhase, idlePhase + Math.PI * 1.18, 3, colors.hot, 0.38, z + 33, "add", 14);
      renderer.drawGfxArc?.(pos.x, centerY, radius * 1.35, idlePhase + Math.PI, idlePhase + Math.PI * 2.18, 3, colors.main, 0.42, z + 34, "add", 14);
    } else if (colors.shape === "ember") {
      for (let i = 0; i < 3; i += 1) {
        const a = idlePhase + i * Math.PI * 2 / 3;
        drawFlame(renderer, pos.x + Math.cos(a) * idleRing, centerY + Math.sin(a) * idleRing * 0.62, radius * 0.13, colors, 0.62, z + 32 + i, a - Math.PI * 0.5);
      }
    } else {
      renderer.drawGfxArc?.(pos.x, centerY, idleRing, 0, Math.PI * 2, 2, colors.main, 0.28, z + 31, "add", 22);
      for (let i = 0; i < 4; i += 1) {
        const a = idlePhase * 0.7 + i * Math.PI * 0.5;
        drawLeaf(renderer, pos.x + Math.cos(a) * idleRing, centerY + Math.sin(a) * idleRing * 0.66, radius * 0.12, colors, 0.7, z + 33 + i, a + Math.PI * 0.5);
      }
    }

    if (attackAge >= 0 && attackAge < 230) {
      const t = attackAge / 230;
      const alpha = (1 - t) * 0.98;
      const reach = radius * (1.55 + t * 1.5);
      const tipX = pos.x + ux * reach;
      const tipY = centerY + uy * reach * 0.72;
      if (colors.shape === "star") {
        renderer.drawGfxLine?.(pos.x + ux * radius * 0.3, centerY + uy * radius * 0.3, tipX, tipY, 6, colors.main, alpha * 0.68, z + 45, "add");
        renderer.drawGfxLine?.(pos.x + ux * radius + px * 6, centerY + uy * radius + py * 6, tipX + px * 9, tipY + py * 9, 2.5, colors.hot, alpha * 0.82, z + 46, "add");
        drawStar(renderer, tipX, tipY, radius * 0.28, colors, alpha, z + 47, now / 180);
      } else if (colors.shape === "void") {
        renderer.drawGfxArc?.(pos.x, centerY, reach * 0.78, angle - 0.82, angle + 0.82, 7, colors.main, alpha * 0.62, z + 45, "add", 12);
        renderer.drawGfxArc?.(pos.x, centerY, reach * 0.58, angle - 0.52, angle + 0.52, 3, colors.hot, alpha * 0.76, z + 46, "add", 10);
        drawVoidShard(renderer, tipX, tipY, radius * 0.25, colors, alpha, z + 47, angle);
      } else if (colors.shape === "ember") {
        renderer.drawGfxLine?.(pos.x - ux * radius * 0.2, centerY - uy * radius * 0.2, tipX, tipY, 10, colors.main, alpha * 0.44, z + 44, "add");
        for (let i = 0; i < 5; i += 1) {
          const d = reach * (0.5 + i * 0.2);
          drawFlame(renderer, pos.x + ux * d + px * (i - 2) * 4, centerY + uy * d + py * (i - 2) * 4, radius * Math.max(0.08, 0.18 - i * 0.018), colors, alpha * (0.82 - i * 0.1), z + 46 + i, angle);
        }
      } else {
        renderer.drawGfxArc?.(pos.x, centerY, reach * 0.68, angle - 0.7, angle + 0.7, 4, colors.main, alpha * 0.5, z + 44, "add", 12);
        for (let i = 0; i < 5; i += 1) {
          const d = reach * (0.48 + i * 0.2);
          drawLeaf(renderer, pos.x + ux * d + px * (i - 2) * 6, centerY + uy * d + py * (i - 2) * 6, radius * 0.18, colors, alpha * (0.9 - i * 0.11), z + 46 + i, angle + i * 0.72);
        }
      }
    }

    if (skillAge >= 0 && skillAge < 520) {
      const t = skillAge / 520;
      const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.94;
      const ring = radius * (1.25 + t * 2.35);
      if (colors.shape === "star") {
        renderer.drawGfxRuneRing?.(pos.x, centerY, ring, colors.main, alpha * 0.72, z + 40, -now / 420, 10);
        for (let i = 0; i < 8; i += 1) {
          const a = now / 420 + i * Math.PI * 0.25;
          drawStar(renderer, pos.x + Math.cos(a) * ring, centerY + Math.sin(a) * ring * 0.68, radius * 0.16, colors, alpha * 0.86, z + 43 + i, a);
        }
      } else if (colors.shape === "void") {
        renderer.drawGfxCircle?.(pos.x, centerY, ring, colors.dark, alpha * 0.14, colors.main, alpha * 0.62, 5, z + 40, "add", 42);
        for (let i = 0; i < 3; i += 1) renderer.drawGfxArc?.(pos.x, centerY, ring * (0.52 + i * 0.2), now / (280 + i * 80) + i, now / (280 + i * 80) + i + Math.PI * 1.25, 3 + i, i % 2 ? colors.main : colors.hot, alpha * (0.72 - i * 0.1), z + 42 + i, "add", 18);
      } else if (colors.shape === "ember") {
        renderer.drawGfxArc?.(pos.x, centerY, ring, Math.PI * 0.08, Math.PI * 1.92, 8, colors.main, alpha * 0.66, z + 40, "add", 24);
        for (let i = 0; i < 9; i += 1) {
          const a = i * 2.399 + now / 760;
          const d = ring * (0.55 + (i % 2) * 0.32);
          drawFlame(renderer, pos.x + Math.cos(a) * d, centerY + Math.sin(a) * d * 0.7, radius * 0.16, colors, alpha * 0.88, z + 43 + i, a - Math.PI * 0.5);
        }
      } else {
        renderer.drawGfxArc?.(pos.x, centerY, ring, 0, Math.PI * 2, 6, colors.main, alpha * 0.52, z + 40, "add", 30);
        renderer.drawGfxArc?.(pos.x, centerY, ring * 0.72, now / 540, now / 540 + Math.PI * 1.6, 3, colors.hot, alpha * 0.62, z + 41, "add", 20);
        for (let i = 0; i < 10; i += 1) {
          const a = i * Math.PI / 5 + now / 900;
          drawLeaf(renderer, pos.x + Math.cos(a) * ring, centerY + Math.sin(a) * ring * 0.72, radius * 0.16, colors, alpha * 0.88, z + 43 + i, a + Math.PI * 0.5);
        }
      }
    }
  }

  function renderProjectileSkinEffect(renderer, projectile, now, tags = {}) {
    const colors = palette(projectile.skin);
    if (!colors || projectile.hostile) return;
    const radius = Math.max(6, Number(projectile.radius || 6));
    const angle = Number(projectile.angle || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const z = projectile.y + 18;
    const style = String(projectile.style || "").toLowerCase();
    const isArrow = Boolean(tags.arrow) || style.includes("arrow");
    const isArcane = Boolean(tags.arcane) || projectile.classId === "mage";
    const isTech = Boolean(tags.laser || tags.missile || tags.tool) || projectile.classId === "engineer";
    const isFlask = Boolean(tags.flask) || projectile.classId === "alchemist";
    const tailX = projectile.x - ux * radius * (isArrow ? 2.9 : 2.1);
    const tailY = projectile.y - uy * radius * (isArrow ? 2.9 : 2.1);

    renderer.drawGfxLine?.(tailX, tailY, projectile.x - ux * radius * 0.35, projectile.y - uy * radius * 0.35, Math.max(1.4, radius * 0.18), colors.main, 0.42, z - 2, "add");
    if (isArrow) {
      for (const side of [-1, 1]) {
        renderer.drawGfxLine?.(tailX, tailY, tailX - ux * radius * 0.72 + px * side * radius * 0.42, tailY - uy * radius * 0.72 + py * side * radius * 0.42, 1.6, colors.hot, 0.72, z + 1, "add");
      }
    } else if (isArcane) {
      renderer.drawGfxArc?.(projectile.x, projectile.y, radius * 1.18, now / 260, now / 260 + Math.PI * 1.25, 1.6, colors.hot, 0.56, z + 2, "add", 10);
    } else if (isTech) {
      renderer.drawGfxLine?.(tailX + px * radius * 0.45, tailY + py * radius * 0.45, projectile.x + px * radius * 0.45, projectile.y + py * radius * 0.45, 1.5, colors.hot, 0.6, z + 2, "add");
    } else if (isFlask) {
      renderer.drawGfxArc?.(projectile.x, projectile.y, radius * 0.8, angle - 1.2, angle + 0.35, 1.8, colors.hot, 0.58, z + 2, "add", 8);
    } else {
      drawSkinMotif(renderer, colors.shape, tailX, tailY, radius * 0.18, colors, 0.46, z, angle);
    }
  }

  function renderHazardSkinEffect(renderer, hazard, now) {
    const colors = palette(hazard.skin);
    if (!colors || hazard.hostile) return;
    const radius = Math.max(18, Number(hazard.radius || 24));
    const z = hazard.y + 36;
    const phase = now / 700 + Number(hazard.id || 0) * 0.37;
    const accentRadius = Math.min(radius * 0.82, 112);
    renderer.drawGfxArc?.(hazard.x, hazard.y, accentRadius, phase, phase + Math.PI * 0.58, 2.2, colors.main, 0.3, z, "add", 12);
    renderer.drawGfxArc?.(hazard.x, hazard.y, accentRadius, phase + Math.PI, phase + Math.PI * 1.58, 1.5, colors.hot, 0.24, z + 1, "add", 12);
    const type = String(hazard.type || "");
    if (["engineer_turret", "engineer_drone", "engineer_mine", "puppet", "alchemy_bomb"].includes(type)) {
      drawSkinMotif(renderer, colors.shape, hazard.x, hazard.y - Math.min(9, radius * 0.18), Math.max(3.5, Math.min(6, radius * 0.07)), colors, 0.5, z + 3, phase);
    }
  }

  function point(x, y, ux, uy, px, py, forward, side) {
    return { x: x + ux * forward + px * side, y: y + uy * forward + py * side };
  }

  function renderPlayerBodyEffect(renderer, player, pos, radius, now, bob, z) {
    const colors = palette(player.skin);
    if (!colors) return false;
    const x = pos.x;
    const y = pos.y + bob;
    const angle = Number(player.facing || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const pulse = 0.68 + Math.sin(now / 620 + (renderer.hash?.(player.id) || 0)) * 0.1;
    const classId = String(player.classId || "warrior");
    const back = point(x, y, ux, uy, px, py, -radius * 0.62, 0);

    if (classId === "warrior") {
      for (const side of [-1, 1]) {
        const shoulder = point(x, y, ux, uy, px, py, -radius * 0.12, side * radius * 0.68);
        renderer.drawGfxLine?.(shoulder.x - ux * radius * 0.34, shoulder.y - uy * radius * 0.34, shoulder.x + ux * radius * 0.22, shoulder.y + uy * radius * 0.22, 3.2, colors.main, pulse, z + 32, "normal");
      }
    } else if (classId === "ranger") {
      for (let i = -1; i <= 1; i += 1) {
        const q = point(back.x, back.y, ux, uy, px, py, -radius * 0.15, i * radius * 0.2);
        renderer.drawGfxLine?.(q.x, q.y, q.x - ux * radius * 0.72 + px * i * radius * 0.12, q.y - uy * radius * 0.72 + py * i * radius * 0.12, 1.8, i === 0 ? colors.hot : colors.main, pulse, z + 32 + i, "normal");
      }
    } else if (classId === "mage") {
      const focus = point(x, y, ux, uy, px, py, radius * 0.18, radius * 0.72);
      renderer.drawGfxArc?.(focus.x, focus.y, radius * 0.27, now / 680, now / 680 + Math.PI * 1.45, 1.8, colors.main, pulse, z + 33, "add", 9);
      drawSkinMotif(renderer, colors.shape, focus.x, focus.y, radius * 0.09, colors, 0.72, z + 35, now / 900);
    } else if (classId === "engineer") {
      const pack = [point(back.x, back.y, ux, uy, px, py, -radius * 0.3, -radius * 0.4), point(back.x, back.y, ux, uy, px, py, radius * 0.25, -radius * 0.4), point(back.x, back.y, ux, uy, px, py, radius * 0.25, radius * 0.4), point(back.x, back.y, ux, uy, px, py, -radius * 0.3, radius * 0.4)];
      renderer.drawGfxPath?.(pack, colors.dark, 0.62, colors.main, pulse, 1.8, z + 32, "normal");
      renderer.drawGfxCircle?.(back.x, back.y, radius * 0.12, colors.hot, 0.74, colors.main, 0.7, 1.2, z + 34, "add", 8);
    } else if (classId === "puppeteer") {
      for (const side of [-1, 1]) {
        const spool = point(x, y, ux, uy, px, py, -radius * 0.38, side * radius * 0.62);
        renderer.drawGfxCircle?.(spool.x, spool.y, radius * 0.13, colors.dark, 0.8, colors.main, pulse, 1.6, z + 33, "normal", 9);
        renderer.drawGfxLine?.(spool.x, spool.y, x + ux * radius * 0.5, y + uy * radius * 0.5, 1, colors.hot, 0.34, z + 32, "add");
      }
    } else if (classId === "martialist") {
      for (const side of [-1, 1]) {
        const fist = point(x, y, ux, uy, px, py, radius * 0.52, side * radius * 0.55);
        renderer.drawGfxArc?.(fist.x, fist.y, radius * 0.2, angle - 0.9, angle + 0.9, 2.8, colors.main, pulse, z + 34, "normal", 8);
      }
    } else if (classId === "alchemist") {
      for (let i = -1; i <= 1; i += 1) {
        const vial = point(back.x, back.y, ux, uy, px, py, 0, i * radius * 0.32);
        renderer.drawGfxCircle?.(vial.x, vial.y, radius * 0.1, colors.dark, 0.8, i === 0 ? colors.hot : colors.main, pulse, 1.4, z + 33 + i, "normal", 8);
      }
    } else {
      renderer.drawGfxArc?.(x - ux * radius * 0.18, y - uy * radius * 0.18, radius * 0.82, angle + 2.2, angle + 4.08, 2.4, colors.main, pulse, z + 33, "normal", 12);
      for (const side of [-1, 1]) {
        const blade = point(x, y, ux, uy, px, py, -radius * 0.32, side * radius * 0.58);
        renderer.drawGfxLine?.(blade.x, blade.y, blade.x - ux * radius * 0.55 + px * side * radius * 0.18, blade.y - uy * radius * 0.55 + py * side * radius * 0.18, 2, colors.hot, pulse, z + 34, "normal");
      }
    }
    drawSkinMotif(renderer, colors.shape, x + ux * radius * 0.18, y + uy * radius * 0.18, radius * 0.08, colors, 0.58, z + 36, angle);
    return true;
  }

  function renderPlayerAttackOverride(renderer, player, pos, radius, now, bob, z) {
    const colors = palette(player.skin);
    if (!colors) return false;
    const age = Date.now() - Number(player.lastAttackAt || 0);
    if (age < 0 || age >= 190) return false;
    const t = Math.max(0, Math.min(1, age / 190));
    const fade = 1 - t;
    const angle = Number(player.facing || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const x = pos.x;
    const y = pos.y + bob;
    const reach = radius * (1.55 + t * 0.85);
    const classId = String(player.classId || "warrior");
    if (["warrior", "martialist", "assassin"].includes(classId)) {
      const spread = classId === "assassin" ? 0.72 : classId === "martialist" ? 0.48 : 0.88;
      renderer.drawGfxArc?.(x, y, reach, angle - spread, angle + spread, classId === "warrior" ? 3.4 : 2.2, colors.main, fade * 0.48, z + 47, "add", 12);
      if (classId === "assassin") renderer.drawGfxArc?.(x, y, reach * 0.78, angle - spread * 0.72, angle + spread * 0.72, 1.6, colors.hot, fade * 0.62, z + 48, "add", 10);
    } else if (classId === "ranger") {
      const tip = point(x, y, ux, uy, px, py, reach, 0);
      renderer.drawGfxLine?.(x + px * radius * 0.58, y + py * radius * 0.58, tip.x, tip.y, 1.6, colors.main, fade * 0.48, z + 46, "add");
      drawSkinMotif(renderer, colors.shape, tip.x, tip.y, radius * 0.1, colors, fade * 0.62, z + 48, angle);
    } else if (classId === "mage") {
      const focus = point(x, y, ux, uy, px, py, radius * 0.82, 0);
      renderer.drawGfxArc?.(focus.x, focus.y, radius * (0.28 + t * 0.2), now / 220, now / 220 + Math.PI * 1.5, 2, colors.main, fade * 0.62, z + 47, "add", 10);
    } else if (classId === "engineer") {
      for (const side of [-1, 1]) renderer.drawGfxLine?.(x + ux * radius * 0.65 + px * side * radius * 0.2, y + uy * radius * 0.65 + py * side * radius * 0.2, x + ux * reach + px * side * radius * 0.32, y + uy * reach + py * side * radius * 0.32, 1.7, side < 0 ? colors.main : colors.hot, fade * 0.5, z + 47, "add");
    } else {
      const tip = point(x, y, ux, uy, px, py, reach * 0.8, 0);
      renderer.drawGfxLine?.(x, y, tip.x, tip.y, 1.5, colors.main, fade * 0.4, z + 46, "add");
      drawSkinMotif(renderer, colors.shape, tip.x, tip.y, radius * 0.09, colors, fade * 0.56, z + 47, angle);
    }
    return false;
  }

  function renderProjectileOverride(renderer, projectile, now, tags = {}) {
    if (!palette(projectile.skin) || projectile.hostile) return false;
    renderProjectileSkinEffect(renderer, projectile, now, tags);
    return false;
  }

  function renderSkinnedArea(renderer, skin, x, y, radius, alpha, now, z) {
    const colors = palette(skin);
    if (!colors) return false;
    const phase = now / 760;
    const safeRadius = Math.max(18, radius);
    if (colors.shape === "star") {
      renderer.drawGfxCircle?.(x, y, safeRadius, colors.dark, alpha * 0.14, colors.main, alpha * 0.78, 2.5, z, "normal", 12);
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI / 4;
        renderer.drawGfxLine?.(x + Math.cos(a) * safeRadius * 0.38, y + Math.sin(a) * safeRadius * 0.38, x + Math.cos(a) * safeRadius, y + Math.sin(a) * safeRadius, 2.4, i % 2 ? colors.hot : colors.main, alpha * 1.8, z + 2, "add");
      }
    } else if (colors.shape === "void") {
      renderer.drawGfxCircle?.(x, y, safeRadius * 0.82, colors.dark, alpha * 0.8, colors.main, alpha * 0.62, 3, z, "normal", 24);
      for (let i = 0; i < 3; i += 1) renderer.drawGfxArc?.(x, y, safeRadius * (0.52 + i * 0.22), phase * (i % 2 ? -1 : 1) + i, phase * (i % 2 ? -1 : 1) + i + Math.PI * 1.2, 2 + i, i === 1 ? colors.hot : colors.main, alpha * 1.9, z + 2 + i, "add", 14);
    } else if (colors.shape === "ember") {
      renderer.drawGfxCircle?.(x, y, safeRadius * 0.78, colors.dark, alpha * 0.42, colors.main, alpha * 0.58, 3, z, "normal", 20);
      for (let i = 0; i < 10; i += 1) {
        const a = i * Math.PI / 5 + phase * 0.2;
        const start = safeRadius * (0.18 + (i % 3) * 0.1);
        const end = safeRadius * (0.72 + (i % 2) * 0.24);
        renderer.drawGfxLine?.(x + Math.cos(a) * start, y + Math.sin(a) * start, x + Math.cos(a) * end, y + Math.sin(a) * end, 3 + (i % 3), i % 2 ? colors.hot : colors.main, alpha * 1.7, z + 2 + i, "add");
      }
    } else {
      for (let i = 0; i < 7; i += 1) {
        const a = i * Math.PI * 2 / 7 + phase * 0.08;
        const bend = a + (i % 2 ? 0.28 : -0.28);
        const midX = x + Math.cos(bend) * safeRadius * 0.54;
        const midY = y + Math.sin(bend) * safeRadius * 0.54;
        const endX = x + Math.cos(a) * safeRadius;
        const endY = y + Math.sin(a) * safeRadius;
        renderer.drawGfxLine?.(x, y, midX, midY, 3, colors.main, alpha * 1.7, z + i, "normal");
        renderer.drawGfxLine?.(midX, midY, endX, endY, 2, colors.hot, alpha * 1.5, z + i + 1, "normal");
        drawLeaf(renderer, endX, endY, Math.max(4, safeRadius * 0.07), colors, alpha * 2.4, z + 10 + i, a);
      }
    }
    return true;
  }

  function renderHazardOverride(renderer, hazard, now) {
    if (!palette(hazard.skin) || hazard.hostile) return false;
    renderHazardSkinEffect(renderer, hazard, now);
    return false;
  }

  function resolveEffectSkin(renderer, effect) {
    if (palette(effect.skin)) return effect.skin;
    if (!effect.ownerId) return "";
    const state = renderer.getState?.();
    const owner = state?.players?.find((player) => String(player.id) === String(effect.ownerId));
    return owner?.skin || "";
  }

  function renderSkillEffectOverride(renderer, effect, progress, alpha, radius, now) {
    if (["damage", "heal", "xp", "death", "warning"].includes(String(effect.kind || ""))) return false;
    const skin = resolveEffectSkin(renderer, effect);
    const colors = palette(skin);
    if (!colors) return false;
    const state = renderer.getState?.();
    const owner = state?.players?.find((player) => String(player.id) === String(effect.ownerId));
    const classId = String(owner?.classId || "");
    const style = String(effect.style || "").toLowerCase();
    const effectRadius = Math.max(16, radius * (0.34 + progress * 0.54));
    const fade = Math.min(0.46, alpha * 0.42);
    const z = effect.y + 88;
    const phase = now / 620 + (renderer.hash?.(effect.id || effect.ownerId) || 0);

    if (classId === "warrior" || style.includes("warrior")) {
      renderer.drawGfxArc?.(effect.x, effect.y, effectRadius, phase - 0.72, phase + 0.72, 2.6, colors.main, fade, z, "add", 12);
    } else if (classId === "ranger" || style.includes("arrow")) {
      for (let i = 0; i < 3; i += 1) {
        const angle = phase + i * Math.PI * 2 / 3;
        renderer.drawGfxLine?.(effect.x + Math.cos(angle) * effectRadius * 0.68, effect.y + Math.sin(angle) * effectRadius * 0.68, effect.x + Math.cos(angle) * effectRadius, effect.y + Math.sin(angle) * effectRadius, 1.8, i === 1 ? colors.hot : colors.main, fade, z + i, "add");
      }
    } else if (classId === "mage" || style.includes("meteor") || style.includes("star")) {
      renderer.drawGfxArc?.(effect.x, effect.y, effectRadius * 0.82, phase, phase + Math.PI * 1.28, 1.8, colors.main, fade, z, "add", 12);
      renderer.drawGfxArc?.(effect.x, effect.y, effectRadius * 0.56, -phase, -phase + Math.PI * 0.9, 1.3, colors.hot, fade * 0.82, z + 1, "add", 10);
    } else if (classId === "engineer" || style.includes("engineer")) {
      for (let i = 0; i < 4; i += 1) {
        const angle = Math.PI * 0.25 + i * Math.PI * 0.5;
        const cx = effect.x + Math.cos(angle) * effectRadius * 0.78;
        const cy = effect.y + Math.sin(angle) * effectRadius * 0.78;
        renderer.drawGfxLine?.(cx, cy, cx + Math.cos(angle) * effectRadius * 0.22, cy + Math.sin(angle) * effectRadius * 0.22, 1.8, i % 2 ? colors.hot : colors.main, fade, z + i, "add");
      }
    } else {
      for (const side of [-1, 1]) {
        const angle = phase + side * 1.2;
        drawSkinMotif(renderer, colors.shape, effect.x + Math.cos(angle) * effectRadius * 0.72, effect.y + Math.sin(angle) * effectRadius * 0.72, Math.max(3, effectRadius * 0.06), colors, fade, z + side, angle);
      }
    }
    return false;
  }

  window.RoguePixiSkinEffects = Object.freeze({
    palette,
    renderPlayerSkinEffect,
    renderProjectileSkinEffect,
    renderHazardSkinEffect,
    renderPlayerBodyEffect,
    renderPlayerAttackOverride,
    renderProjectileOverride,
    renderHazardOverride,
    renderSkillEffectOverride,
  });
})();
