(() => {
  const skinEffects = window.RoguePixiSkinEffects || {};
  const CLASS_NEON = Object.freeze({
    novice: { color: "#d9e2ef", dark: "#111827", accent: "#94a3b8", glyph: "?" },
    warrior: { color: "#ff4d6d", dark: "#261016", accent: "#ffd166", glyph: "W" },
    ranger: { color: "#39ff88", dark: "#092217", accent: "#f1d08b", glyph: "R" },
    mage: { color: "#55ccff", dark: "#071a2b", accent: "#c084fc", glyph: "M" },
    engineer: { color: "#ffd166", dark: "#241a07", accent: "#67e8f9", glyph: "E" },
    puppeteer: { color: "#d783ff", dark: "#1e1230", accent: "#f9a8d4", glyph: "P" },
    martialist: { color: "#ff9f1c", dark: "#251307", accent: "#fef3c7", glyph: "K" },
    alchemist: { color: "#a3ff4f", dark: "#102508", accent: "#67e8f9", glyph: "A" },
    assassin: { color: "#b68cff", dark: "#10091f", accent: "#f5d0fe", glyph: "S" },
  });

  function metaFor(player) {
    return CLASS_NEON[player?.classId || "warrior"] || CLASS_NEON.warrior;
  }

  function playerFace(player) {
    return Math.cos(Number(player.facing || 0)) >= 0 ? 1 : -1;
  }

  function playerMoving(player, pos, last) {
    return Math.hypot(pos.x - last.x, pos.y - last.y) > 0.2 || player.dashMove?.active;
  }

  function playerFrame(now, moving) {
    return Math.floor(now / (moving ? 100 : 220)) % 4;
  }

  function playerScale(player, selfId) {
    const scaleBase = (player.id === selfId ? 1.14 : 1.02) * (player.sizeScale || 1);
    return {
      scaleBase,
      radius: (player.id === selfId ? 25 : 22) * scaleBase,
    };
  }

  function classColor(player) {
    return player.color || metaFor(player).color;
  }

  function drawTextGlyph(renderer, text, x, y, color, alpha, zIndex, size = 17) {
    const label = renderer.textPool.next(renderer.layers.effect, {
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fontSize: size,
      fill: color,
      stroke: { color: "#020617", width: 4 },
    });
    label.text = text;
    label.anchor.set(0.5);
    label.position.set(x, y);
    label.alpha = alpha;
    label.zIndex = zIndex;
    label.blendMode = "add";
    return label;
  }

  function drawShield(renderer, x, y, angle, size, color, alpha, zIndex) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const front = size * 0.44;
    const back = size * 0.28;
    const half = size * 0.42;
    const points = [
      { x: x - ux * back - px * half * 0.76, y: y - uy * back - py * half * 0.76 },
      { x: x + ux * front - px * half, y: y + uy * front - py * half },
      { x: x + ux * front * 1.24, y: y + uy * front * 1.24 },
      { x: x + ux * front + px * half, y: y + uy * front + py * half },
      { x: x - ux * back + px * half * 0.76, y: y - uy * back + py * half * 0.76 },
    ];
    renderer.drawGfxPath(points, "#08111f", alpha * 0.74, color, alpha * 0.88, 3, zIndex, "add");
    renderer.drawGfxLine(x + ux * 2 - px * half * 0.58, y + uy * 2 - py * half * 0.58, x + ux * 2 + px * half * 0.58, y + uy * 2 + py * half * 0.58, 4, "#e0f2fe", alpha * 0.62, zIndex + 1, "add");
  }

  function drawSword(renderer, x, y, angle, length, color, alpha, zIndex) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const base = length * 0.24;
    const tip = length;
    const width = length * 0.08;
    const startX = x + ux * base;
    const startY = y + uy * base;
    const tipX = x + ux * tip;
    const tipY = y + uy * tip;
    renderer.drawGfxPath(
      [
        { x: startX - px * width, y: startY - py * width },
        { x: tipX - px * width * 0.58, y: tipY - py * width * 0.58 },
        { x: tipX + ux * width * 1.5, y: tipY + uy * width * 1.5 },
        { x: tipX + px * width * 0.58, y: tipY + py * width * 0.58 },
        { x: startX + px * width, y: startY + py * width },
      ],
      "#f8fafc",
      alpha * 0.86,
      color,
      alpha * 0.74,
      2,
      zIndex,
      "add",
    );
    renderer.drawGfxLine(x - px * width * 1.5, y - py * width * 1.5, x + px * width * 1.5, y + py * width * 1.5, 4, "#ffd166", alpha * 0.72, zIndex + 1, "add");
  }

  function drawBow(renderer, x, y, angle, size, color, alpha, zIndex) {
    const px = -Math.sin(angle);
    const py = Math.cos(angle);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    renderer.drawGfxArc(x, y, size * 0.8, angle - 0.96, angle + 0.96, 4, color, alpha * 0.82, zIndex, "add", 12);
    renderer.drawGfxLine(x + px * size * 0.48, y + py * size * 0.48, x - px * size * 0.48, y - py * size * 0.48, 2, "#f8fafc", alpha * 0.58, zIndex + 1, "add");
    renderer.drawGfxLine(x - ux * size * 0.28, y - uy * size * 0.28, x + ux * size * 0.88, y + uy * size * 0.88, 4, "#f1d08b", alpha * 0.78, zIndex + 2, "add");
  }

  function drawClassSymbol(renderer, player, pos, radius, face, now, bob, alpha, zIndex) {
    const meta = metaFor(player);
    const color = classColor(player);
    const accent = meta.accent;
    const angle = Number(player.facing || 0);
    const classId = player.classId || "warrior";
    const pulse = 0.5 + Math.sin(now / 240 + renderer.hash(player.id) * 6) * 0.5;

    renderer.drawGfxCircle(pos.x, pos.y + bob + 2, radius * 0.9, meta.dark, alpha * 0.62, color, alpha * 0.58, 3, zIndex, "add", 22);
    renderer.drawGfxCircle(pos.x, pos.y + bob + 2, radius * (1.06 + pulse * 0.04), "#000000", 0, color, alpha * (0.22 + pulse * 0.1), 2, zIndex + 1, "add", 24);

    if (classId === "warrior") {
      drawSword(renderer, pos.x - face * radius * 0.18, pos.y + bob + 3, angle - face * 0.18, radius * 1.7, color, alpha, zIndex + 8);
      drawShield(renderer, pos.x + face * radius * 0.46, pos.y + bob + 3, angle, radius * 0.98, "#ffd166", alpha, zIndex + 10);
    } else if (classId === "ranger") {
      drawBow(renderer, pos.x, pos.y + bob + 2, angle, radius * 1.08, color, alpha, zIndex + 8);
      renderer.drawGfxDiamond(pos.x + Math.cos(angle) * radius * 0.9, pos.y + bob + Math.sin(angle) * radius * 0.9, radius * 0.13, accent, alpha * 0.86, zIndex + 12, angle);
    } else if (classId === "mage") {
      renderer.drawGfxRuneRing(pos.x, pos.y + bob + 2, radius * 0.92, color, alpha * 0.86, zIndex + 8, now / 900, 7);
      renderer.drawGfxDiamond(pos.x + face * radius * 0.9, pos.y + bob - radius * 0.64, radius * 0.18, accent, alpha * 0.92, zIndex + 13, now / 260);
    } else if (classId === "engineer") {
      renderer.drawGfxGear(pos.x, pos.y + bob + 2, radius * 0.88, color, alpha * 0.95, zIndex + 8, now / 680, 8);
      renderer.drawGfxLine(pos.x - radius * 0.62, pos.y + bob, pos.x + radius * 0.62, pos.y + bob, 3, accent, alpha * 0.5, zIndex + 11, "add");
    } else if (classId === "puppeteer") {
      renderer.drawGfxDiamond(pos.x, pos.y + bob + 2, radius * 0.86, color, alpha * 0.58, zIndex + 8, now / 620, accent);
      for (let i = -1; i <= 1; i += 1) {
        renderer.drawGfxLine(pos.x + i * radius * 0.34, pos.y + bob - radius * 1.22, pos.x + i * radius * 0.18, pos.y + bob + radius * 0.38, 2, accent, alpha * 0.42, zIndex + 10 + i, "add");
      }
    } else if (classId === "martialist") {
      for (let i = 0; i < 3; i += 1) {
        const a = angle + (i - 1) * 0.64;
        renderer.drawGfxCircle(pos.x + Math.cos(a) * radius * 0.72, pos.y + bob + Math.sin(a) * radius * 0.44, radius * 0.24, accent, alpha * 0.32, color, alpha * 0.62, 3, zIndex + 8 + i, "add", 14);
      }
    } else if (classId === "alchemist") {
      renderer.drawGfxFlask(pos.x, pos.y + bob + 2, angle + 0.3 * face, color, alpha * 0.9, zIndex + 8, radius / 20);
      renderer.drawGfxCircle(pos.x - face * radius * 0.56, pos.y + bob - radius * 0.52, radius * 0.16, accent, alpha * 0.36, accent, alpha * 0.72, 2, zIndex + 12, "add", 12);
    } else if (classId === "assassin") {
      for (let i = -1; i <= 1; i += 1) {
        const offset = i * radius * 0.24;
        renderer.drawGfxLine(pos.x - Math.cos(angle) * radius * 0.6 - Math.sin(angle) * offset, pos.y + bob - Math.sin(angle) * radius * 0.6 + Math.cos(angle) * offset, pos.x + Math.cos(angle) * radius * 0.92 - Math.sin(angle) * offset, pos.y + bob + Math.sin(angle) * radius * 0.92 + Math.cos(angle) * offset, i === 0 ? 5 : 3, i === 0 ? accent : color, alpha * (i === 0 ? 0.78 : 0.4), zIndex + 8 + i, "add");
      }
    } else {
      drawTextGlyph(renderer, meta.glyph, pos.x, pos.y + bob + 1, accent, alpha * 0.88, zIndex + 9, 18);
    }

    drawTextGlyph(renderer, meta.glyph, pos.x, pos.y + bob + radius * 0.1, "#e0f2fe", alpha * 0.5, zIndex + 20, 11);
  }

  const GEAR_RARITY_COLORS = Object.freeze({
    common: "#cbd5e1", rare: "#38bdf8", epic: "#c084fc", legendary: "#fbbf24", mythic: "#fb7185",
  });

  function renderEquipmentAppearance(renderer, player, pos, radius, now, bob, alpha, zIndex) {
    const gear = Array.isArray(player.gearAppearance) ? player.gearAppearance : [];
    if (!gear.length) return;
    const angle = Number(player.facing || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const centerY = pos.y + bob + 2;
    const bySlot = new Map(gear.map((entry) => [entry.slot, entry]));
    const colorFor = (entry) => GEAR_RARITY_COLORS[entry?.rarity] || GEAR_RARITY_COLORS.common;
    const armor = bySlot.get("armor");
    if (armor) {
      const color = colorFor(armor);
      for (const side of [-1, 1]) {
        const sx = pos.x + px * side * radius * 0.76 - ux * radius * 0.08;
        const sy = centerY + py * side * radius * 0.76 - uy * radius * 0.08;
        renderer.drawGfxDiamond(sx, sy, radius * 0.24, color, alpha * 0.82, zIndex + 1, angle + Math.PI / 4, "#f8fafc");
      }
    }
    const weapon = bySlot.get("weapon");
    if (weapon) {
      const color = colorFor(weapon);
      const sx = pos.x - px * radius * 0.86 - ux * radius * 0.2;
      const sy = centerY - py * radius * 0.86 - uy * radius * 0.2;
      renderer.drawGfxLine(sx, sy, sx + ux * radius * 1.18, sy + uy * radius * 1.18, 3.2, color, alpha * 0.72, zIndex + 2, "add");
      renderer.drawGfxDiamond(sx + ux * radius * 1.22, sy + uy * radius * 1.22, radius * 0.12, "#f8fafc", alpha * 0.88, zIndex + 3, angle);
    }
    const amulet = bySlot.get("amulet");
    if (amulet) {
      const color = colorFor(amulet);
      renderer.drawGfxDiamond(pos.x + ux * radius * 0.18, centerY + uy * radius * 0.18, radius * 0.14, color, alpha * 0.9, zIndex + 4, now / 900, "#ffffff");
    }
    const core = bySlot.get("core");
    if (core) {
      const color = colorFor(core);
      renderer.drawGfxCircle(pos.x - ux * radius * 0.52, centerY - uy * radius * 0.52, radius * 0.12, color, alpha * 0.48, "#ffffff", alpha * 0.68, 1.4, zIndex + 4, "add", 12);
    }
    const setCounts = gear.reduce((counts, entry) => {
      if (entry.setId) counts[entry.setId] = (counts[entry.setId] || 0) + 1;
      return counts;
    }, {});
    const completeSet = Object.entries(setCounts).find(([, count]) => count >= 4);
    if (completeSet) {
      const pulse = 0.74 + Math.sin(now / 420) * 0.08;
      const bestGear = gear.slice().sort((a, b) => Object.keys(GEAR_RARITY_COLORS).indexOf(b.rarity) - Object.keys(GEAR_RARITY_COLORS).indexOf(a.rarity))[0];
      renderer.drawGfxRuneRing(pos.x, centerY, radius * 1.24, colorFor(bestGear), alpha * pulse * 0.42, zIndex + 5, now / 1200, 4);
    }
  }

  function renderPlayerAttackEffect(renderer, player, pos, face, bob) {
    const age = Date.now() - Number(player.lastAttackAt || 0);
    if (age >= 160) return;
    const progress = Math.max(0, Math.min(1, age / 160));
    const angle = Number(player.facing || 0);
    const color = classColor(player);
    if ((player.classId || "warrior") === "warrior") return;
    const radius = Math.max(34, Number(player.radius || 18) * 2.2);
    const reach = radius * (player.classId === "warrior" ? 2.1 : 1.55);
    const x = pos.x + Math.cos(angle) * reach * 0.42;
    const y = pos.y + bob + Math.sin(angle) * reach * 0.22;
    const z = pos.y + 120;
    const side = face >= 0 ? 1 : -1;
    const start = angle - 0.82 * side + progress * 1.54 * side;
    renderer.drawGfxArc(pos.x, pos.y + bob, reach * 0.62, start - 0.32 * side, start, 6, color, 0.78 * (1 - progress), z, "add", 8);
    renderer.drawGfxLine(pos.x + Math.cos(start) * radius * 0.55, pos.y + bob + Math.sin(start) * radius * 0.4, x + Math.cos(start) * reach * 0.36, y + Math.sin(start) * reach * 0.28, 5, "#f8fafc", 0.64 * (1 - progress), z + 1, "add");
  }

  function renderEngineerLaserChargeHud(renderer, player, x, y, radius, now, z) {
    const max = Math.max(0, Math.floor(Number(player.engineerLaserChargeMax || 0)));
    const charge = Math.max(0, Math.min(max, Math.floor(Number(player.engineerLaserCharge || 0))));
    if (max <= 0 || charge <= 0 || !renderer.drawGfxCircle) return;

    const ratio = charge / max;
    const pulse = 0.5 + Math.sin(now / 88 + renderer.hash(player.id) * 0.17) * 0.5;
    const orbitRadius = radius * (1.04 + ratio * 0.42);
    const coreRadius = radius * (0.2 + ratio * 0.27 + pulse * 0.045);
    const tint = "#c084fc";
    const hot = charge >= max - 1 ? "#f5d0fe" : "#67e8f9";
    const alpha = 0.34 + ratio * 0.38 + pulse * 0.12;
    const spin = now / (230 - ratio * 70);

    renderer.drawGfxCircle(x, y, orbitRadius, "#170728", 0.1 + ratio * 0.05, tint, 0.2 + ratio * 0.26, 2 + ratio * 2.2, z + 46, "add", 34);
    renderer.drawGfxRuneRing?.(x, y, orbitRadius * 0.82, tint, 0.24 + ratio * 0.22, z + 47, -spin, max);
    renderer.drawGfxCircle(x, y, coreRadius * 1.52, tint, 0.2 + ratio * 0.2, hot, alpha, 2, z + 50, "add", 18);
    renderer.drawGfxCircle(x, y, coreRadius * 0.62, hot, 0.38 + ratio * 0.32, "#ffffff", 0.3 + ratio * 0.36, 1.6, z + 52, "add", 12);

    for (let i = 0; i < max; i += 1) {
      const lit = i < charge;
      const a = -Math.PI * 0.5 + (i - (max - 1) / 2) * 0.42;
      const pipX = x + Math.cos(a) * orbitRadius * 0.74;
      const pipY = y + Math.sin(a) * orbitRadius * 0.54;
      renderer.drawGfxCircle(
        pipX,
        pipY,
        radius * (lit ? 0.12 + pulse * 0.02 : 0.08),
        lit ? hot : "#111827",
        lit ? 0.62 : 0.18,
        lit ? "#ffffff" : "#334155",
        lit ? 0.48 : 0.26,
        lit ? 1.5 : 1,
        z + 54 + i,
        "add",
        10,
      );
    }

    for (let i = 0; i < charge; i += 1) {
      const a = spin + (Math.PI * 2 * i) / Math.max(1, charge);
      const sx = x + Math.cos(a) * orbitRadius * 1.05;
      const sy = y + Math.sin(a) * orbitRadius * 0.72;
      const ex = x + Math.cos(a) * coreRadius * 0.32;
      const ey = y + Math.sin(a) * coreRadius * 0.22;
      renderer.drawGfxLine?.(sx, sy, ex, ey, 2.2 + ratio * 1.8, hot, 0.28 + ratio * 0.3, z + 49 + i, "add");
    }
  }

  function renderMechaSuitAura(renderer, player, pos, radius, now, bob, z) {
    const angle = Number(player.facing || 0);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const pulse = 0.5 + Math.sin(now / 118 + renderer.hash(player.id)) * 0.5;
    const cx = pos.x;
    const cy = pos.y + bob + 2;
    const coreRadius = radius * 2.02;
    renderer.drawGfxCircle(cx, cy + radius * 0.22, coreRadius * 0.72, "#0f172a", 0.15, "#d6b76d", 0.28, 2, z + 28, "add", 28);
    renderer.drawGfxGear?.(cx, cy, coreRadius * (0.48 + pulse * 0.03), "#d6b76d", 0.34, z + 31, now / 520, 10);
    renderer.drawGfxRuneRing?.(cx, cy, coreRadius * 0.58, "#67e8f9", 0.26, z + 32, -now / 720, 6);

    for (const side of [-1, 1]) {
      const sx = cx + px * side * radius * 1.04 - ux * radius * 0.05;
      const sy = cy + py * side * radius * 1.04 - uy * radius * 0.05;
      const shoulder = [
        { x: sx + ux * radius * 0.72, y: sy + uy * radius * 0.72 },
        { x: sx - ux * radius * 0.18 + px * side * radius * 0.48, y: sy - uy * radius * 0.18 + py * side * radius * 0.48 },
        { x: sx - ux * radius * 0.86 + px * side * radius * 0.2, y: sy - uy * radius * 0.86 + py * side * radius * 0.2 },
        { x: sx - ux * radius * 0.46 - px * side * radius * 0.34, y: sy - uy * radius * 0.46 - py * side * radius * 0.34 },
      ];
      renderer.drawGfxPath?.(shoulder, "#241a07", 0.72, "#d6b76d", 0.82, 3, z + 36 + side, "normal");
      renderer.drawGfxLine?.(sx - ux * radius * 0.42, sy - uy * radius * 0.42, sx + ux * radius * 0.5, sy + uy * radius * 0.5, 4, "#67e8f9", 0.42, z + 39 + side, "add");

      const bx = cx - ux * radius * 1.02 + px * side * radius * 0.62;
      const by = cy - uy * radius * 1.02 + py * side * radius * 0.62;
      renderer.drawGfxLine?.(bx, by, bx - ux * radius * (0.82 + pulse * 0.22), by - uy * radius * (0.82 + pulse * 0.22), 7, "#f97316", 0.22 + pulse * 0.08, z + 27 + side, "add");
      renderer.drawGfxCircle?.(bx, by, radius * 0.14, "#67e8f9", 0.42, "#f8f3e9", 0.36, 1.4, z + 40 + side, "add", 10);
    }

    renderer.drawGfxCircle?.(cx + ux * radius * 0.64, cy + uy * radius * 0.64, radius * 0.19, "#67e8f9", 0.48, "#f8f3e9", 0.62, 2, z + 42, "add", 12);
    renderEngineerLaserChargeHud(renderer, player, cx, cy, radius, now, z);
  }

  function renderPlayer(renderer, player, now, visuals, selfId) {
    if (player.spectator) return;
    const pos = renderer.visualPosition(visuals.players, player);
    const last = renderer.lastPlayerPositions.get(String(player.id)) || pos;
    const moving = playerMoving(player, pos, last);
    renderer.lastPlayerPositions.set(String(player.id), { x: pos.x, y: pos.y });

    const face = playerFace(player);
    const { scaleBase, radius } = playerScale(player, selfId);
    const bob = Math.sin(now / (moving ? 105 : 240) + renderer.hash(player.id) * 4) * (moving ? 2 : 0.6);
    const color = classColor(player);
    const z = pos.y + 12;
    const alpha = player.downed ? 0.48 : 1;

    renderer.rect(renderer.layers.actor, pos.x, pos.y + radius * 1.04, radius * 2.28, radius * 0.44, "#000000", 0.58).zIndex = pos.y - 4;
    const dashActive = Boolean(player.dashMove?.active);
    const warriorDash = (player.classId || "warrior") === "warrior";
    if (dashActive && warriorDash && renderer.drawGfxDashDust) {
      const dx = pos.x - last.x;
      const dy = pos.y - last.y;
      const travel = Math.hypot(dx, dy);
      const angle = travel > 3 ? Math.atan2(dy, dx) : Number(player.facing || 0);
      const fromX = travel > 3 ? last.x : pos.x - Math.cos(angle) * radius * 2.2;
      const fromY = travel > 3 ? last.y : pos.y - Math.sin(angle) * radius * 2.2;
      renderer.drawGfxDashDust(fromX, fromY, pos.x, pos.y, radius * 1.1, angle, "#caa35a", 0.58, z - 3, now / 180, {});
    } else if (moving && !dashActive) {
      const trailAlpha = 0.16;
      for (let i = 1; i <= 3; i += 1) {
        const tx = pos.x - Math.cos(Number(player.facing || 0)) * radius * 0.42 * i;
        const ty = pos.y - Math.sin(Number(player.facing || 0)) * radius * 0.22 * i;
        renderer.drawGfxCircle(tx, ty + bob, radius * (1.05 - i * 0.12), "#000000", 0, color, trailAlpha / i, 2, z - i, "add", 18);
      }
    }

    drawClassSymbol(renderer, player, pos, radius, face, now, bob, alpha, z + 8);
    renderEquipmentAppearance(renderer, player, pos, radius, now, bob, alpha, z + 29);
    const skinAttackOverride = skinEffects.renderPlayerAttackOverride?.(renderer, player, pos, radius, now, bob, z);
    if (!skinAttackOverride) renderPlayerAttackEffect(renderer, player, pos, face, bob);
    skinEffects.renderPlayerBodyEffect?.(renderer, player, pos, radius, now, bob, z);

    if (player.shield > 0) renderer.drawGfxCircle(pos.x, pos.y + bob + 2, radius * 1.42, "#000000", 0, "#67e8f9", 0.46, 4, z + 30, "add", 26);
    const poisonStacks = Math.max(0, Math.min(3, Math.floor(Number(player.poisonStacks || 0))));
    for (let i = 0; i < poisonStacks; i += 1) {
      const dotX = pos.x + (i - (poisonStacks - 1) / 2) * 10;
      const dotY = pos.y - radius * 1.72 + Math.sin(now / 150 + i) * 1.4;
      renderer.drawGfxCircle(dotX, dotY, 4.2, "#365314", 0.82, "#a3ff4f", 0.9, 1.5, z + 34 + i, "add", 10);
    }
    if (player.statusEffects?.includes("taunt_guard")) renderer.drawGfxRuneRing(pos.x, pos.y + bob + 2, radius * 1.78, "#ff4d6d", 0.34, z + 31, now / 440, 10);
    if (player.statusEffects?.includes("mecha")) {
      renderMechaSuitAura(renderer, player, pos, radius, now, bob, z);
    }
    if (player.id === selfId) {
      renderer.healthShieldBar(pos.x, pos.y - 56 * scaleBase, 86, 8, player.hp, player.maxHp, player.shield, "#ff4d6d");
      const dashMax = Math.max(0.1, Number(player.stats?.dashCooldownMax || 1.35));
      const maxCharges = Math.max(1, Math.floor(Number(player.dashMaxCharges || 1)));
      const charges = Math.max(0, Math.min(maxCharges, Math.floor(Number(player.dashCharges || 0))));
      const recharge = Math.max(0, 1 - Number(player.dashRechargeCooldown || player.dashCooldown || 0) / dashMax);
      const dashRatio = maxCharges > 1 ? Math.min(1, (charges + (charges < maxCharges ? recharge : 0)) / maxCharges) : player.dashReady ? 1 : recharge;
      renderer.bar(pos.x, pos.y - 45 * scaleBase, 86, 4, dashRatio, "#8aa8bd");
    }
  }

  function renderPlayers(renderer, players, now) {
    const visuals = renderer.getVisuals();
    const selfId = renderer.getSelfId();
    for (const player of players) renderPlayer(renderer, player, now, visuals, selfId);
  }

  window.RoguePixiPlayers = Object.freeze({
    playerFace,
    playerMoving,
    playerFrame,
    playerScale,
    renderPlayerAttackEffect,
    renderPlayer,
    renderPlayers,
  });
})();
