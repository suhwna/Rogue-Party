(() => {
  const skinEffects = window.RoguePixiSkinEffects || {};
  function hazardFlavor(hazard) {
    return `${hazard.type || ""} ${hazard.style || ""} ${hazard.damageType || ""}`.toLowerCase();
  }

  function hazardState(hazard, now) {
    const color = hazard.color || (hazard.hostile ? "#ff2d55" : "#67e8f9");
    const armed = hazard.armed || !hazard.armTime;
    const alpha = armed ? 0.34 : 0.16 + Math.sin(now / 90) * 0.08;
    const radius = hazard.radius || 40;
    const flavor = hazardFlavor(hazard);
    return { color, armed, alpha, radius, flavor };
  }

  function drawNeonRing(renderer, x, y, radius, color, alpha, z, phase = 0, danger = false) {
    renderer.drawGfxCircle(x, y, radius, "#000000", danger ? alpha * 0.05 : 0.01, color, alpha, danger ? 5 : 3, z, "add", 36);
    renderer.drawGfxRuneRing(x, y, radius * 0.72, color, alpha * 0.42, z + 1, phase, danger ? 12 : 8);
  }

  function drawHostileHazardBoundary(renderer, hazard, state, now) {
    if (!hazard.hostile || (hazard.length && hazard.width)) return;
    const pulse = 0.82 + Math.sin(now / 110 + Number(hazard.id || 0)) * 0.1;
    const z = hazard.y + 14;
    renderer.drawGfxCircle(
      hazard.x,
      hazard.y,
      state.radius * 1.01,
      "#450a0a",
      state.armed ? 0.035 : 0.02,
      "#ff2d55",
      (state.armed ? 0.5 : 0.34) * pulse,
      state.armed ? 4 : 3,
      z,
      "normal",
      40
    );
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + (Math.PI * 2 * i) / 4;
      renderer.drawGfxLine(
        hazard.x + Math.cos(angle) * state.radius * 0.84,
        hazard.y + Math.sin(angle) * state.radius * 0.84,
        hazard.x + Math.cos(angle) * state.radius * 1.04,
        hazard.y + Math.sin(angle) * state.radius * 1.04,
        4,
        "#ff2d55",
        state.armed ? 0.62 : 0.42,
        z + 1 + i,
        "normal"
      );
    }
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
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const flutter = Math.sin(phase * 8) * width * 0.08;
    renderer.drawGfxPath(
      [
        { x: toX - ux * width * 0.16 + px * width * 0.58, y: toY - uy * width * 0.16 + py * width * 0.58 },
        { x: fromX + px * (width * 0.18 + flutter), y: fromY + py * (width * 0.18 + flutter) },
        { x: fromX - ux * width * 1.45, y: fromY - uy * width * 1.45 },
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
    renderer.drawGfxLine(fromX, fromY, toX - ux * width * 0.32, toY - uy * width * 0.32, Math.max(3, width * 0.18), "#fff7ed", alpha * 0.26, z + 1, "add");
  }

  function drawMeteorRock(renderer, x, y, angle, size, alpha, z, phase = 0) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    renderer.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.62, size * 1.02, phase), "#f97316", alpha * 0.12, "#fed7aa", alpha * 0.16, 2, z - 1, "add");
    renderer.drawGfxPath(meteorRockPoints(x, y, angle, size * 1.28, size * 0.78, phase + 0.17), "#3f1f13", alpha * 0.92, "#fed7aa", alpha * 0.54, 2.6, z, "normal");
    renderer.drawGfxLine(x - ux * size * 0.42 - px * size * 0.2, y - uy * size * 0.42 - py * size * 0.2, x + ux * size * 0.28 + px * size * 0.12, y + uy * size * 0.28 + py * size * 0.12, 2.4, "#f97316", alpha * 0.38, z + 1, "add");
    renderer.drawGfxLine(x - ux * size * 0.12 + px * size * 0.28, y - uy * size * 0.12 + py * size * 0.28, x + ux * size * 0.36 + px * size * 0.08, y + uy * size * 0.36 + py * size * 0.08, 1.6, "#fde68a", alpha * 0.28, z + 2, "add");
  }

  function renderBeamHazard(renderer, hazard, state, now) {
    if (!hazard.length || !hazard.width) return false;
    const angle = hazard.angle || 0;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    const width = Math.max(8, Number(hazard.width) || 8);
    const beamColor = state.color || "#ff2d55";
    const armMax = Math.max(0.1, Number(hazard.armTimeMax || hazard.armTime || 1));
    const charge = Math.max(0, Math.min(1, 1 - Number(hazard.armTime || 0) / armMax));
    const pulse = 0.82 + Math.sin(now / 70 + Number(hazard.id || 0)) * 0.18;
    const x1 = hazard.x;
    const y1 = hazard.y;
    const x2 = hazard.x + ux * hazard.length;
    const y2 = hazard.y + uy * hazard.length;
    const z = hazard.y - 8;

    renderer.drawGfxLine(x1, y1, x2, y2, width * 2, "#300711", 0.045 + charge * 0.055, z - 3, "normal");
    renderer.drawGfxLine(x1, y1, x2, y2, width * 1.82, beamColor, (0.07 + charge * 0.06) * pulse, z - 2, "add");
    for (const side of [-1, 1]) {
      renderer.drawGfxLine(
        x1 + px * width * side,
        y1 + py * width * side,
        x2 + px * width * side,
        y2 + py * width * side,
        Math.max(2, width * 0.09),
        beamColor,
        0.34 + charge * 0.28,
        z + side + 3,
        "normal"
      );
    }
    renderer.drawGfxLine(x1, y1, x2, y2, Math.max(2, width * 0.08), "#fff1f2", (0.28 + charge * 0.42) * pulse, z + 6, "add");
    renderer.drawGfxCircle(x1, y1, width * (0.34 + charge * 0.18), "#3f0712", 0.42, beamColor, 0.58, 2, z + 7, "add", 12);
    renderer.drawGfxCircle(x2, y2, Math.max(5, width * 0.16), beamColor, 0.12, "#fff1f2", 0.34, 1.5, z + 7, "add", 10);
    return true;
  }

  function renderEngineerTurret(renderer, hazard, state, now) {
    const z = hazard.y + 8;
    const bob = Math.sin(now / 170 + hazard.id) * 1.2;
    const laser = String(hazard.style || "").includes("laser");
    renderer.rect(renderer.layers.hazard, hazard.x, hazard.y + 25, 38, 12, "#000000", 0.42).zIndex = hazard.y - 2;
    renderer.drawGfxGear(hazard.x, hazard.y + bob, state.radius * 0.44, "#ffd166", 0.86, z, now / 760, 8);
    renderer.drawGfxCircle(hazard.x, hazard.y + bob, state.radius * 0.22, "#06121f", 0.78, "#67e8f9", 0.68, 3, z + 3, "add", 14);
    const barrelAngle = Number.isFinite(hazard.angle) ? hazard.angle : -0.22;
    const bx = hazard.x + Math.cos(barrelAngle) * (laser ? 36 : 30);
    const by = hazard.y + bob + Math.sin(barrelAngle) * (laser ? 24 : 20);
    renderer.drawGfxLine(hazard.x, hazard.y + bob, bx, by, laser ? 8 : 5, laser ? "#fde68a" : "#67e8f9", state.armed ? 0.5 : 0.2, z + 4, "add");
    if (laser) {
      renderer.drawGfxCircle(bx, by, 7 + Math.sin(now / 80) * 1.5, "#fde68a", 0.22, "#fff7ed", 0.36, 2, z + 6, "add", 10);
    }
    if (!state.armed) drawNeonRing(renderer, hazard.x, hazard.y, state.radius * 0.72, "#67e8f9", 0.16 + Math.sin(now / 80) * 0.05, z + 5, now / 500);
  }

  function renderEngineerDrone(renderer, hazard, now) {
    const style = String(hazard.style || "");
    const kamikaze = style.includes("kamikaze");
    const missile = style.includes("missile");
    const z = hazard.y + 22;
    const y = hazard.y - 8 + Math.sin(now / 120 + hazard.id) * 4;
    const angle = Number.isFinite(hazard.angle) ? hazard.angle : now / 720;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    renderer.rect(renderer.layers.hazard, hazard.x, hazard.y + 18, 40, 12, "#000000", 0.34).zIndex = hazard.y - 2;
    for (let i = 0; i < 4; i += 1) {
      const side = i < 2 ? -1 : 1;
      const front = i % 2 ? -1 : 1;
      const rx = hazard.x + px * side * 24 + ux * front * 9;
      const ry = y + py * side * 24 + uy * front * 9;
      renderer.drawGfxCircle(rx, ry, 10, "#071a24", 0.64, "#67e8f9", 0.34, 2, z + i, "add", 12);
      renderer.drawGfxArc(rx, ry, 13, now / 90 + i, now / 90 + i + Math.PI * 1.15, 3, "#dbeafe", 0.36, z + 6 + i, "add", 8);
    }
    renderer.drawGfxPath(
      [
        { x: hazard.x + ux * 22, y: y + uy * 22 },
        { x: hazard.x - ux * 17 + px * 16, y: y - uy * 17 + py * 16 },
        { x: hazard.x - ux * 9, y: y - uy * 9 },
        { x: hazard.x - ux * 17 - px * 16, y: y - uy * 17 - py * 16 },
      ],
      "#071a24",
      0.78,
      kamikaze ? "#fb923c" : "#67e8f9",
      0.58,
      2,
      z + 12,
      "add"
    );
    renderer.drawGfxCircle(hazard.x + ux * 4, y + uy * 4, 9, kamikaze ? "#7c2d12" : "#06121f", 0.86, kamikaze ? "#fde68a" : "#67e8f9", 0.72, 3, z + 14, "add", 14);
    if (missile) {
      renderer.drawGfxLine(hazard.x - px * 10 - ux * 10, y - py * 10 - uy * 10, hazard.x - px * 10 - ux * 28, y - py * 10 - uy * 28, 5, "#fb923c", 0.5, z + 15, "add");
      renderer.drawGfxLine(hazard.x + px * 10 - ux * 10, y + py * 10 - uy * 10, hazard.x + px * 10 - ux * 28, y + py * 10 - uy * 28, 5, "#fb923c", 0.5, z + 16, "add");
    }
    if (kamikaze) {
      renderer.drawGfxLine(hazard.x - ux * 18, y - uy * 18, hazard.x - ux * 54, y - uy * 54, 12, "#fb923c", 0.25, z - 2, "add");
      renderer.drawGfxLine(hazard.x - ux * 16, y - uy * 16, hazard.x - ux * 42, y - uy * 42, 6, "#fde68a", 0.42, z - 1, "add");
    }
  }

  function renderEngineerMine(renderer, hazard, state, now) {
    const z = hazard.y + 2;
    const style = String(hazard.style || "");
    const dash = style.includes("dash");
    const charged = style.includes("charged");
    const tint = charged ? "#a78bfa" : "#67e8f9";
    const coreTint = state.armed ? tint : charged ? "#c4b5fd" : "#9ee6ff";
    renderer.drawGfxDiamond(hazard.x, hazard.y, dash ? 14 : 18, coreTint, state.armed ? 0.62 : 0.5, z, Math.sin(now / 160 + hazard.id) * 0.2, "#e0f2fe");
    renderer.drawGfxCircle(hazard.x, hazard.y, Math.max(24, state.radius * (state.armed ? 0.72 : 0.52)), "#000000", 0, tint, state.armed ? 0.18 : 0.12 + Math.sin(now / 95) * 0.05, 2, z + 2, "add", 24);
    if (dash) renderer.drawGfxLightning(hazard.x - 16, hazard.y, hazard.x + 16, hazard.y, "#67e8f9", 0.34, z + 3, 3, 4, 6, now / 140);
    if (charged) renderer.drawGfxRuneRing(hazard.x, hazard.y, Math.max(32, state.radius * 0.42), "#a78bfa", 0.24, z + 4, now / 520, 6);
  }

  function renderPuppet(renderer, hazard, now) {
    if (Number.isFinite(hazard.moveFromX) && Number.isFinite(hazard.moveFromY) && (hazard.moveTime || 0) > 0) {
      renderer.drawGfxLine(hazard.moveFromX, hazard.moveFromY, hazard.x, hazard.y, 6, "#d783ff", 0.3, hazard.y + 50, "add");
    }
    const z = hazard.y + 10;
    const y = hazard.y + Math.sin(now / 190 + hazard.id) * 1.5;
    renderer.drawGfxDiamond(hazard.x, y, 20, "#1e1230", 0.72, z, now / 700, "#d783ff");
    renderer.drawGfxLine(hazard.x - 12, y - 32, hazard.x - 6, y + 6, 2, "#f9a8d4", 0.48, z + 2, "add");
    renderer.drawGfxLine(hazard.x + 12, y - 32, hazard.x + 6, y + 6, 2, "#f9a8d4", 0.48, z + 3, "add");
    renderer.drawGfxCircle(hazard.x, y - 32, 7, "#f9a8d4", 0.22, "#f5d0fe", 0.42, 2, z + 4, "add", 10);
  }

  function renderArrowRain(renderer, hazard, state, now) {
    const z = hazard.y + 20;
    const id = hazard.id || 0;
    const pulse = 1 + Math.sin(now / 210 + id) * 0.012;
    const skin = skinEffects.palette?.(hazard.skin);
    const dark = skin?.dark || "#4a3415";
    const main = skin?.main || "#f1d08b";
    const hot = skin?.hot || "#fde68a";
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * pulse, dark, state.armed ? 0.035 : 0.025, main, state.armed ? 0.36 : 0.24, state.armed ? 2.4 : 1.8, z - 16, "add", 56);
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 0.72, "#000000", 0, hot, state.armed ? 0.12 : 0.08, 1.2, z - 15, "add", 42);
    if (!state.armed) return;
    const dropCount = 9;
    const skyY = hazard.y - state.radius * 2.1;
    for (let i = 0; i < dropCount; i += 1) {
      const seed = renderer.noise(id + i * 17, 4);
      const t = (now / 360 + i * 0.19 + id * 0.07) % 1;
      const lane = (i - (dropCount - 1) / 2) * state.radius * 0.12 + (seed - 0.5) * state.radius * 0.12;
      const x = hazard.x + lane;
      const slant = (i % 2 ? -1 : 1) * 3;
      const topY = skyY + t * state.radius * 2.45;
      renderer.drawGfxArrow(x - slant, topY - 42, x + slant, topY + 30, i % 3 === 0 ? hot : main, 0.58 + t * 0.18, z + i, i % 3 === 0 ? 4 : 3);
    }
  }

  function renderAlchemyBomb(renderer, hazard, state, now) {
    if (Number.isFinite(hazard.spawnFromX) && Number.isFinite(hazard.spawnFromY)) {
      renderer.drawGfxLine(hazard.spawnFromX, hazard.spawnFromY, hazard.x, hazard.y, 5, "#a3ff4f", 0.18, hazard.y + 4, "add");
    }
    const z = hazard.y + 6;
    renderer.drawGfxFlask(hazard.x, hazard.y - (state.armed ? 0 : Math.sin(now / 90) * 3), Math.sin(now / 130 + hazard.id) * 0.25, "#a3ff4f", 0.88, z, 1.15);
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius, "#000000", 0, "#a3ff4f", state.armed ? 0.18 : 0.12 + Math.sin(now / 90) * 0.06, 2, z + 3, "add", 22);
  }

  function renderAlchemyPool(renderer, hazard, state, now) {
    const fireMode = hazard.mode === "fire" || state.flavor.includes("fire");
    const tint = fireMode ? "#f97316" : "#a3ff4f";
    const fill = fireMode ? "#7c2d12" : "#365314";
    const z = hazard.y - 10;
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 0.82, fill, state.armed ? 0.1 : 0.06, tint, state.armed ? 0.28 : 0.16, 4, z, "add", 28);
    for (let i = 0; i < 7; i += 1) {
      const a = now / 900 + (Math.PI * 2 * i) / 7;
      const r = state.radius * (0.18 + (i % 3) * 0.16);
      renderer.drawGfxCircle(hazard.x + Math.cos(a) * r, hazard.y + Math.sin(a) * r * 0.72, 5 + (i % 2) * 3, tint, state.armed ? 0.16 : 0.08, tint, 0.18, 1.5, z + i, "add", 10);
    }
  }

  function renderElixirMist(renderer, hazard, state, now) {
    const z = hazard.y - 8;
    renderer.drawGfxRuneRing(hazard.x, hazard.y, state.radius, "#86efac", 0.2 + Math.sin(now / 160) * 0.04, z, now / 700, 9);
    renderer.drawGfxLine(hazard.x - state.radius * 0.24, hazard.y, hazard.x + state.radius * 0.24, hazard.y, 6, "#dcfce7", 0.24, z + 2, "add");
    renderer.drawGfxLine(hazard.x, hazard.y - state.radius * 0.24, hazard.x, hazard.y + state.radius * 0.24, 6, "#dcfce7", 0.24, z + 3, "add");
  }

  function renderMeteorHazard(renderer, hazard, state, now) {
    const z = hazard.y - 14;
    const skin = skinEffects.palette?.(hazard.skin);
    const main = skin?.main || "#f97316";
    const dark = skin?.dark || "#7c2d12";
    const hot = skin?.hot || "#fed7aa";
    drawNeonRing(renderer, hazard.x, hazard.y, state.radius, main, state.armed ? 0.24 : 0.42, z, now / 720, true);
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 0.38, dark, 0.05, hot, 0.14, 2, z + 2, "add", 24);
  }

  function renderMortarBlast(renderer, hazard, state, now) {
    const fromX = Number.isFinite(hazard.spawnFromX) ? hazard.spawnFromX : hazard.x;
    const fromY = Number.isFinite(hazard.spawnFromY) ? hazard.spawnFromY : hazard.y;
    const armMax = Math.max(0.1, Number(hazard.armTimeMax || hazard.armTime || 0.62));
    const rawProgress = Math.max(0, Math.min(1, 1 - Number(hazard.armTime || 0) / armMax));
    const travel = rawProgress * rawProgress * (3 - 2 * rawProgress);
    const dx = hazard.x - fromX;
    const dy = hazard.y - fromY;
    const distance = Math.hypot(dx, dy) || 1;
    const lift = Math.max(150, Math.min(360, distance * 0.36));
    const controlX = fromX + dx * 0.5;
    const controlY = Math.min(fromY, hazard.y) - lift;
    const one = 1 - travel;
    const shellX = one * one * fromX + 2 * one * travel * controlX + travel * travel * hazard.x;
    const shellY = one * one * fromY + 2 * one * travel * controlY + travel * travel * hazard.y;
    const tangentX = 2 * one * (controlX - fromX) + 2 * travel * (hazard.x - controlX);
    const tangentY = 2 * one * (controlY - fromY) + 2 * travel * (hazard.y - controlY);
    const angle = Math.atan2(tangentY, tangentX);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const z = Math.max(hazard.y + 36, shellY + 92);
    const pulse = 0.86 + Math.sin(now / 70 + Number(hazard.id || 0)) * 0.08;

    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 0.78, "#450a0a", 0.025, "#fb923c", 0.24, 2, hazard.y + 15, "normal", 32);
    renderer.drawGfxLine(shellX - ux * 46, shellY - uy * 46, shellX - ux * 8, shellY - uy * 8, 13, "#7c2d12", 0.3 * pulse, z - 4, "add");
    renderer.drawGfxLine(shellX - ux * 34, shellY - uy * 34, shellX, shellY, 5, "#f97316", 0.72 * pulse, z - 2, "add");
    renderer.drawGfxPath(
      meteorRockPoints(shellX, shellY, angle, 13, 10, now / 180),
      "#2b1710",
      0.96,
      "#fb923c",
      0.9,
      2.6,
      z,
      "normal"
    );
    renderer.drawGfxCircle(shellX + ux * 3, shellY + uy * 3, 4.2, "#fff7ed", 0.82, "#ffffff", 0.5, 1.2, z + 3, "add", 8);
  }

  function renderWarriorForwardWhirlwind(renderer, hazard, state, now) {
    const radius = Math.max(72, state.radius);
    const angle = Number.isFinite(hazard.angle) ? hazard.angle : 0;
    const spin = now / 155 + Number(hazard.id || 0) * 0.41;
    const skin = skinEffects.palette?.(hazard.skin);
    const tint = skin?.main || hazard.color || "#f97316";
    const edge = skin?.hot || "#fff7ed";
    const dark = skin?.dark || "#2a0f05";
    const z = hazard.y + 42;
    renderer.drawGfxCircle(hazard.x, hazard.y, radius * 0.82, dark, 0.045, tint, 0.16, 4, z - 8, "add", 42);
    renderer.drawGfxRuneRing(hazard.x, hazard.y, radius * 0.5, edge, 0.14, z - 5, -spin * 0.35, 9);

    for (let i = 0; i < 5; i += 1) {
      const lane = i / 5;
      const r = radius * (0.34 + lane * 0.13);
      const start = spin + i * 1.24;
      const end = start + 1.35 + lane * 0.42;
      const width = 4 + i;
      renderer.drawGfxArc(hazard.x, hazard.y, r, start, end, width, i % 2 ? tint : edge, 0.2 + lane * 0.08, z + i, "add", 18);
      renderer.drawGfxArc(hazard.x, hazard.y, r * 1.08, start + 0.18, end + 0.08, Math.max(2, width - 2), tint, 0.11 + lane * 0.04, z + i + 5, "add", 16);
    }

    renderer.drawGfxLine(
      hazard.x - Math.cos(angle) * radius * 0.95,
      hazard.y - Math.sin(angle) * radius * 0.95,
      hazard.x + Math.cos(angle) * radius * 0.72,
      hazard.y + Math.sin(angle) * radius * 0.72,
      7,
      tint,
      0.16,
      z - 14,
      "add"
    );
  }

  function renderBossFieldJudgment(renderer, hazard, state, now) {
    const armMax = Math.max(0.1, Number(hazard.armTimeMax || 1));
    const progress = Math.max(0, Math.min(1, 1 - Number(hazard.armTime || 0) / armMax));
    const pulse = 0.72 + Math.sin(now / 95) * 0.16;
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius, "#450a0a", 0.055 + progress * 0.045, state.color, 0.16 + progress * 0.18, 9, -10000, "normal", 96);
    renderer.drawGfxRuneRing(hazard.x, hazard.y, Math.min(state.radius * 0.72, 680), state.color, (0.12 + progress * 0.2) * pulse, 9990, -now / 520, 18);
  }

  function renderBossSafeZone(renderer, hazard, state, now) {
    const armMax = Math.max(0.1, Number(hazard.armTimeMax || 1));
    const progress = Math.max(0, Math.min(1, 1 - Number(hazard.armTime || 0) / armMax));
    const pulse = 0.9 + Math.sin(now / 120 + Number(hazard.id || 0)) * 0.06;
    const radius = state.radius * pulse;
    renderer.drawGfxCircle(hazard.x, hazard.y, radius, "#083344", 0.2, "#67e8f9", 0.72, 6, hazard.y + 9000, "add", 48);
    renderer.drawGfxCircle(hazard.x, hazard.y, radius * 0.78, "#cffafe", 0.055 + progress * 0.025, "#ecfeff", 0.34, 2, hazard.y + 9001, "add", 40);
    renderer.drawGfxRuneRing(hazard.x, hazard.y, radius * 0.62, "#a5f3fc", 0.38, hazard.y + 9002, now / 760, 12);
  }

  function renderBossSpiralEmitter(renderer, hazard, state, now) {
    const spin = now / 260;
    const z = hazard.y + 24;
    for (let i = 0; i < 4; i += 1) {
      const start = spin + i * Math.PI * 0.5;
      renderer.drawGfxArc(hazard.x, hazard.y, state.radius * (0.48 + i * 0.1), start, start + 1.05, 4, state.color, 0.26, z + i, "add", 14);
    }
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 0.24, "#14070b", 0.5, state.color, 0.5, 3, z + 6, "add", 16);
  }

  function renderDefaultHazard(renderer, hazard, state, now) {
    const poison = state.flavor.includes("poison") || state.flavor.includes("acid") || state.flavor.includes("venom");
    const fire = state.flavor.includes("fire") || state.flavor.includes("flame") || state.flavor.includes("burn") || state.flavor.includes("meteor") || state.flavor.includes("bomber") || state.flavor.includes("blast");
    const heal = state.flavor.includes("heal") || state.flavor.includes("elixir") || state.flavor.includes("holy");
    const shield = state.flavor.includes("shield") || state.flavor.includes("barrier");
    const tint = poison ? "#a3ff4f" : fire ? "#f97316" : heal ? "#86efac" : shield ? "#67e8f9" : state.color;
    const fill = poison ? "#365314" : fire ? "#7c2d12" : heal ? "#052e16" : "#06121f";
    const danger = hazard.hostile || fire || poison;
    renderer.drawGfxCircle(hazard.x, hazard.y, state.radius, fill, danger ? 0.07 : 0.035, tint, state.alpha, danger ? 4 : 3, hazard.y - 10, "add", 32);
    renderer.drawGfxRuneRing(hazard.x, hazard.y, state.radius * 0.72, tint, state.alpha * 0.38, hazard.y - 8, now / 780, danger ? 10 : 7);
    if (state.armed && danger) {
      renderer.drawGfxCircle(hazard.x, hazard.y, state.radius * 1.05, "#000000", 0, tint, 0.16, 5, hazard.y - 6, "add", 32);
    }
  }

  function renderHazard(renderer, hazard, now) {
    const state = hazardState(hazard, now);
    if (hazard.type === "boss_field_judgment") return renderBossFieldJudgment(renderer, hazard, state, now);
    if (hazard.type === "boss_safe_zone") return renderBossSafeZone(renderer, hazard, state, now);
    if (hazard.type === "boss_spiral_emitter") return renderBossSpiralEmitter(renderer, hazard, state, now);
    if (renderBeamHazard(renderer, hazard, state, now)) return;
    drawHostileHazardBoundary(renderer, hazard, state, now);
    if (hazard.type === "engineer_turret") return renderEngineerTurret(renderer, hazard, state, now);
    if (hazard.type === "engineer_drone") return renderEngineerDrone(renderer, hazard, now);
    if (hazard.type === "engineer_mine") return renderEngineerMine(renderer, hazard, state, now);
    if (hazard.type === "puppet") return renderPuppet(renderer, hazard, now);
    if (hazard.type === "arrow_rain") return renderArrowRain(renderer, hazard, state, now);
    if (hazard.type === "alchemy_bomb") return renderAlchemyBomb(renderer, hazard, state, now);
    if (hazard.type === "alchemy_pool" || hazard.type === "acid_pool" || hazard.type === "poison_pool") return renderAlchemyPool(renderer, hazard, state, now);
    if (hazard.type === "alchemy_elixir_mist") return renderElixirMist(renderer, hazard, state, now);
    if (hazard.type === "meteor") return renderMeteorHazard(renderer, hazard, state, now);
    if (hazard.type === "mortar_blast") return renderMortarBlast(renderer, hazard, state, now);
    if (hazard.type === "warrior_whirlwind_projectile") return renderWarriorForwardWhirlwind(renderer, hazard, state, now);
    if (hazard.type === "warrior_followup_cleave") return;
    return renderDefaultHazard(renderer, hazard, state, now);
  }

  function renderHazards(renderer, hazards, now) {
    for (const hazard of hazards) {
      const skinOverride = skinEffects.renderHazardOverride?.(renderer, hazard, now);
      if (!skinOverride) renderHazard(renderer, hazard, now);
    }
  }

  window.RoguePixiHazards = Object.freeze({
    hazardFlavor,
    hazardState,
    renderHazard,
    renderHazards,
  });
})();
