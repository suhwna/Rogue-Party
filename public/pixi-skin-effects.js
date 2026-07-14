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

  function drawThemeTrail(renderer, colors, x, y, angle, length, width, alpha, z, now) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const tailX = x - ux * length;
    const tailY = y - uy * length;
    if (colors.shape === "void") {
      renderer.drawGfxLine?.(tailX, tailY, x, y, width * 1.9, colors.dark, alpha * 0.72, z, "normal");
      renderer.drawGfxLine?.(tailX + px * width, tailY + py * width, x, y, width * 0.36, colors.hot, alpha * 0.82, z + 1, "add");
    } else if (colors.shape === "ember") {
      renderer.drawGfxLine?.(tailX, tailY, x, y, width * 1.7, colors.main, alpha * 0.34, z, "add");
      for (let i = 0; i < 3; i += 1) {
        const t = 0.2 + i * 0.28;
        const sway = Math.sin(now / 75 + i * 2.1) * width;
        drawFlame(renderer, x - ux * length * t + px * sway, y - uy * length * t + py * sway, width * 0.75, colors, alpha * (0.8 - i * 0.16), z + 1 + i, angle);
      }
    } else if (colors.shape === "leaf") {
      renderer.drawGfxLine?.(tailX, tailY, x, y, width * 0.62, colors.main, alpha * 0.7, z, "normal");
      for (let i = 0; i < 3; i += 1) {
        const t = 0.22 + i * 0.3;
        drawLeaf(renderer, x - ux * length * t + px * (i % 2 ? width : -width), y - uy * length * t + py * (i % 2 ? width : -width), width * 0.62, colors, alpha * 0.78, z + i + 1, angle + (i % 2 ? 0.8 : -0.8));
      }
    } else {
      renderer.drawGfxLine?.(tailX, tailY, x, y, width * 1.65, colors.main, alpha * 0.24, z, "add");
      renderer.drawGfxLine?.(tailX + ux * length * 0.18, tailY + uy * length * 0.18, x, y, width * 0.38, colors.hot, alpha * 0.9, z + 1, "add");
      for (let i = 0; i < 3; i += 1) {
        const t = 0.18 + i * 0.3;
        drawStar(renderer, x - ux * length * t + px * (i - 1) * width, y - uy * length * t + py * (i - 1) * width, width * 0.48, colors, alpha * (0.8 - i * 0.13), z + 2 + i, now / 260 + i);
      }
    }
  }

  function drawThemedArrow(renderer, projectile, colors, now, tags) {
    const angle = Number(projectile.angle || 0);
    const r = Math.max(7, Number(projectile.radius || 7));
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const z = projectile.y + 22;
    const style = String(projectile.style || "").toLowerCase();
    const laser = Boolean(tags.laser) || style.includes("laser");
    const poison = style.includes("poison");
    const fire = style.includes("fire") || style.includes("explosive");
    const tip = point(projectile.x, projectile.y, ux, uy, px, py, r * (laser ? 4.4 : 2.35), 0);
    const tail = point(projectile.x, projectile.y, ux, uy, px, py, -r * (laser ? 4 : 2.4), 0);
    const main = poison ? "#a3e635" : fire ? "#fb923c" : colors.main;
    const hot = poison ? "#ecfccb" : fire ? "#fff7ed" : colors.hot;

    drawThemeTrail(renderer, colors, projectile.x - ux * r * 0.4, projectile.y - uy * r * 0.4, angle, r * (laser ? 7.5 : 5.2), laser ? r * 0.7 : r * 0.34, 0.78, z - 5, now);
    if (laser) {
      renderer.drawGfxLine?.(tail.x, tail.y, tip.x, tip.y, Math.max(8, r * 1.1), colors.dark, 0.36, z - 1, colors.shape === "void" ? "normal" : "add");
      renderer.drawGfxLine?.(tail.x, tail.y, tip.x, tip.y, Math.max(3, r * 0.46), main, 0.96, z, "add");
      renderer.drawGfxLine?.(projectile.x, projectile.y, tip.x, tip.y, Math.max(1.4, r * 0.17), hot, 1, z + 1, "add");
      drawSkinMotif(renderer, colors.shape, tip.x, tip.y, r * 0.42, colors, 0.96, z + 3, angle);
      return;
    }
    renderer.drawGfxLine?.(tail.x, tail.y, tip.x, tip.y, Math.max(3, r * 0.42), colors.dark, 0.96, z, "normal");
    renderer.drawGfxLine?.(tail.x + ux * r * 0.5, tail.y + uy * r * 0.5, tip.x, tip.y, Math.max(1.5, r * 0.19), main, 0.96, z + 1, "add");
    for (const side of [-1, 1]) {
      const wing = point(tip.x, tip.y, ux, uy, px, py, -r * 0.78, side * r * 0.58);
      renderer.drawGfxLine?.(wing.x, wing.y, tip.x, tip.y, Math.max(2, r * 0.25), hot, 0.92, z + 2, "add");
      const feather = point(tail.x, tail.y, ux, uy, px, py, -r * 0.35, side * r * 0.52);
      renderer.drawGfxLine?.(tail.x + ux * r * 0.45, tail.y + uy * r * 0.45, feather.x, feather.y, 1.8, main, 0.82, z + 2, "normal");
    }
    if (fire) drawFlame(renderer, tail.x, tail.y, r * 0.8, { ...colors, main, hot }, 0.94, z + 4, angle);
    if (poison) renderer.drawGfxCircle?.(tip.x - ux * r * 0.42, tip.y - uy * r * 0.42, r * 0.28, "#365314", 0.7, main, 0.72, 1.4, z + 4, "add", 9);
  }

  function drawThemedMageOrb(renderer, projectile, colors, now) {
    const r = Math.max(7, Number(projectile.radius || 7));
    const z = projectile.y + 20;
    const angle = Number(projectile.angle || 0);
    drawThemeTrail(renderer, colors, projectile.x, projectile.y, angle, r * 4.4, r * 0.42, 0.7, z - 4, now);
    if (colors.shape === "star") {
      drawStar(renderer, projectile.x, projectile.y, r * 1.05, colors, 0.98, z, now / 240);
      renderer.drawGfxCircle?.(projectile.x, projectile.y, r * 1.4, colors.dark, 0.08, colors.main, 0.18, 2, z - 1, "add", 16);
    } else if (colors.shape === "void") {
      renderer.drawGfxCircle?.(projectile.x, projectile.y, r * 1.08, "#05010a", 0.96, colors.main, 0.82, 3, z, "normal", 18);
      renderer.drawGfxArc?.(projectile.x, projectile.y, r * 1.45, now / 180, now / 180 + Math.PI * 1.25, 2.4, colors.hot, 0.72, z + 1, "add", 13);
    } else if (colors.shape === "ember") {
      renderer.drawGfxCircle?.(projectile.x, projectile.y, r * 0.72, colors.dark, 0.86, colors.hot, 0.88, 2, z, "add", 12);
      for (let i = 0; i < 4; i += 1) drawFlame(renderer, projectile.x + Math.cos(now / 160 + i * 1.57) * r * 0.7, projectile.y + Math.sin(now / 160 + i * 1.57) * r * 0.7, r * 0.5, colors, 0.76, z + i + 1, now / 160 + i * 1.57);
    } else {
      renderer.drawGfxCircle?.(projectile.x, projectile.y, r * 0.72, colors.dark, 0.84, colors.main, 0.88, 2, z, "normal", 12);
      for (let i = 0; i < 4; i += 1) drawLeaf(renderer, projectile.x + Math.cos(now / 340 + i * 1.57) * r, projectile.y + Math.sin(now / 340 + i * 1.57) * r, r * 0.36, colors, 0.9, z + i + 1, now / 340 + i * 1.57);
    }
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
      const swordHilt = point(x, y, ux, uy, px, py, radius * 0.18, radius * 0.72);
      const swordTip = point(swordHilt.x, swordHilt.y, ux, uy, px, py, radius * 1.38, 0);
      const shield = point(x, y, ux, uy, px, py, radius * 0.18, -radius * 0.78);
      renderer.drawGfxLine?.(swordHilt.x, swordHilt.y, swordTip.x, swordTip.y, radius * 0.24, colors.dark, 0.96, z + 32, "normal");
      renderer.drawGfxLine?.(swordHilt.x + ux * radius * 0.2, swordHilt.y + uy * radius * 0.2, swordTip.x, swordTip.y, radius * 0.09, colors.hot, pulse, z + 33, "add");
      renderer.drawGfxLine?.(swordHilt.x - px * radius * 0.34, swordHilt.y - py * radius * 0.34, swordHilt.x + px * radius * 0.34, swordHilt.y + py * radius * 0.34, 3, colors.main, 0.9, z + 34, "normal");
      renderer.drawGfxCircle?.(shield.x, shield.y, radius * 0.58, colors.dark, 0.86, colors.main, 0.9, 3, z + 33, "normal", colors.shape === "star" ? 8 : 14);
      drawSkinMotif(renderer, colors.shape, shield.x, shield.y, radius * 0.18, colors, 0.86, z + 35, angle);
    } else if (classId === "ranger") {
      const bow = point(x, y, ux, uy, px, py, radius * 0.12, radius * 0.78);
      renderer.drawGfxArc?.(bow.x, bow.y, radius * 0.72, angle - 1.18, angle + 1.18, 3.2, colors.main, 0.9, z + 32, "normal", 12);
      renderer.drawGfxLine?.(bow.x + ux * radius * 0.28 - px * radius * 0.66, bow.y + uy * radius * 0.28 - py * radius * 0.66, bow.x + ux * radius * 0.28 + px * radius * 0.66, bow.y + uy * radius * 0.28 + py * radius * 0.66, 1.2, colors.hot, 0.76, z + 33, "add");
      for (let i = -1; i <= 1; i += 1) {
        const q = point(back.x, back.y, ux, uy, px, py, -radius * 0.15, i * radius * 0.2);
        renderer.drawGfxLine?.(q.x, q.y, q.x - ux * radius * 0.72 + px * i * radius * 0.12, q.y - uy * radius * 0.72 + py * i * radius * 0.12, 1.8, i === 0 ? colors.hot : colors.main, pulse, z + 34 + i, "normal");
      }
    } else if (classId === "mage") {
      const focus = point(x, y, ux, uy, px, py, radius * 0.18, radius * 0.72);
      renderer.drawGfxArc?.(focus.x, focus.y, radius * 0.36, now / 680, now / 680 + Math.PI * 1.45, 2.2, colors.main, pulse, z + 33, "add", 9);
      drawSkinMotif(renderer, colors.shape, focus.x, focus.y, radius * 0.2, colors, 0.9, z + 35, now / 900);
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
    return false;
  }

  function renderProjectileOverride(renderer, projectile, now, tags = {}) {
    const colors = palette(projectile.skin);
    if (!colors || projectile.hostile) return false;
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
    const colors = palette(hazard.skin);
    if (!colors || hazard.hostile) return false;
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

  function resolveEffectPalette(renderer, effect) {
    return palette(resolveEffectSkin(renderer, effect));
  }

  function renderSkillEffectOverride(renderer, effect, progress, alpha, radius, now) {
    if (["damage", "heal", "xp", "death", "warning"].includes(String(effect.kind || ""))) return false;
    const skin = resolveEffectSkin(renderer, effect);
    const colors = palette(skin);
    if (!colors) return false;
    const state = renderer.getState?.();
    const owner = state?.players?.find((player) => String(player.id) === String(effect.ownerId));
    const classId = String(owner?.classId || "");
    if (classId === "mage") return false;
    const style = String(effect.style || "").toLowerCase();
    const exactRadius = Math.max(16, Number(effect.rangeRadius || effect.radius || radius || 16));
    const fade = Math.min(0.72, alpha * 0.7);
    const z = effect.y + 88;
    const phase = now / 620 + (renderer.hash?.(effect.id || effect.ownerId) || 0);

    const areaEffect = style.includes("frost") || style.includes("spin") || style.includes("taunt") || style.includes("burst") || style.includes("explosion");
    if (areaEffect) {
      const displayedRadius = exactRadius * (0.28 + Math.min(1, progress * 1.45) * 0.72);
      for (let i = 0; i < 5; i += 1) {
        const angle = phase * 0.14 + i * Math.PI * 0.4;
        const distance = displayedRadius * (0.42 + (i % 2) * 0.34);
        drawSkinMotif(renderer, colors.shape, effect.x + Math.cos(angle) * distance, effect.y + Math.sin(angle) * distance, Math.max(3.5, Math.min(9, exactRadius * 0.045)), colors, fade * 0.68, z + i, angle);
      }
    } else if (effect.kind === "chain" || style.includes("laser") || style.includes("piercing")) {
      const angle = Number(effect.angle || 0);
      const line = renderer.effectEndpoints?.(effect, exactRadius, angle);
      if (line) {
        for (let i = 1; i <= 2; i += 1) {
          const t = i / 3;
          drawSkinMotif(renderer, colors.shape, line.fromX + (line.toX - line.fromX) * t, line.fromY + (line.toY - line.fromY) * t, 4.5, colors, fade * 0.54, z + i, angle);
        }
      }
    } else if (classId) {
      drawSkinMotif(renderer, colors.shape, effect.x, effect.y, Math.max(4, Math.min(10, exactRadius * 0.06)), colors, fade * 0.42, z, phase);
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
    resolveEffectPalette,
    renderSkillEffectOverride,
  });
})();
