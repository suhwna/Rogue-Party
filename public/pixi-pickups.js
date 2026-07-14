(() => {
  const EQUIPMENT_RARITY_VISUALS = Object.freeze({
    common: { color: "#cbd5e1", core: "#475569", rank: 0 },
    rare: { color: "#60a5fa", core: "#1e3a8a", rank: 1 },
    epic: { color: "#c084fc", core: "#581c87", rank: 2 },
    legendary: { color: "#fbbf24", core: "#78350f", rank: 3 },
    mythic: { color: "#fb7185", core: "#881337", rank: 4 },
  });

  function xpOrbBob(orb, now) {
    return Math.sin(now / 180 + Number(orb.id || 0)) * 3;
  }

  function xpOrbScale(orb) {
    return Math.max(0.45, (orb.radius || 10) / 16);
  }

  function relicChestScale(chest) {
    return Math.max(0.8, (chest.radius || 18) / 20);
  }

  function renderXpOrb(renderer, orb, now) {
    const bob = xpOrbBob(orb, now);
    const scale = xpOrbScale(orb);
    const r = 9 * scale;
    const z = orb.y + 8;
    renderer.drawGfxCircle(orb.x, orb.y + bob, r, "#071a24", 0.7, "#67e8f9", 0.68, 2, z, "add", 14);
    renderer.drawGfxDiamond(orb.x, orb.y + bob, r * 0.58, "#e0f2fe", 0.42, z + 2, now / 500);
  }

  function renderRelicChest(renderer, chest, now) {
    const scale = relicChestScale(chest);
    const r = Math.max(22, (chest.radius || 18) * scale);
    const y = chest.y + Math.sin(now / 220) * 2;
    const z = chest.y + 18;
    renderer.drawGfxPath(
      [
        { x: chest.x, y: y - r * 0.7 },
        { x: chest.x + r * 0.74, y: y - r * 0.2 },
        { x: chest.x + r * 0.55, y: y + r * 0.58 },
        { x: chest.x - r * 0.55, y: y + r * 0.58 },
        { x: chest.x - r * 0.74, y: y - r * 0.2 },
      ],
      "#241a07",
      0.8,
      "#ffd166",
      0.86,
      4,
      z,
      "add",
    );
    renderer.drawGfxLine(chest.x - r * 0.48, y, chest.x + r * 0.48, y, 4, "#f8fafc", 0.38, z + 2, "add");
    renderer.drawGfxDiamond(chest.x, y, r * 0.22, "#67e8f9", 0.48, z + 4, now / 600, "#f8fafc");
    renderer.drawGfxRuneRing(chest.x, chest.y, (chest.radius || 22) * 1.7, "#ffd166", 0.18 + Math.sin(now / 180) * 0.05, z + 5, now / 900, 8);
  }

  function renderEquipmentPickup(renderer, pickup, x, y, z, pulse, now) {
    const rarity = EQUIPMENT_RARITY_VISUALS[pickup.rarity] || EQUIPMENT_RARITY_VISUALS.common;
    const rank = rarity.rank;
    const scale = 0.94 + (pulse - 0.88) * 0.5;
    const beamTop = y - 21 - rank * 7;

    renderer.drawGfxCircle(x, y + 10, 14 + rank * 0.8, "#05070a", 0.34, "#000000", 0, 0, z - 4, "normal", 18);
    if (rank > 0) renderer.drawGfxLine(x, beamTop, x, y + 7, 4 + rank * 1.35, rarity.color, 0.1 + rank * 0.035, z - 3, "add");
    if (rank === 4) {
      renderer.drawGfxLine(x - 5, beamTop + 8, x - 2, y + 7, 2.5, "#fda4af", 0.18, z - 2, "add");
      renderer.drawGfxLine(x + 5, beamTop + 8, x + 2, y + 7, 2.5, "#fecdd3", 0.18, z - 2, "add");
    }

    renderer.drawGfxPath(
      [
        { x: x - 11 * scale, y: y - 6 * scale },
        { x: x - 5 * scale, y: y - 11 * scale },
        { x, y: y - 8 * scale },
        { x: x + 5 * scale, y: y - 11 * scale },
        { x: x + 11 * scale, y: y - 6 * scale },
        { x: x + 8 * scale, y: y + 9 * scale },
        { x, y: y + 13 * scale },
        { x: x - 8 * scale, y: y + 9 * scale },
      ],
      "#111827",
      0.98,
      rarity.color,
      0.98,
      2.2 + rank * 0.25,
      z + 1,
      "normal",
    );
    renderer.drawGfxPath(
      [
        { x: x - 5.5 * scale, y: y - 3 * scale },
        { x, y: y + 1 * scale },
        { x: x + 5.5 * scale, y: y - 3 * scale },
        { x: x + 4 * scale, y: y + 5 * scale },
        { x, y: y + 8 * scale },
        { x: x - 4 * scale, y: y + 5 * scale },
      ],
      rarity.core,
      0.96,
      rarity.color,
      0.72,
      1.4,
      z + 2,
      rank >= 2 ? "add" : "normal",
    );

    if (rank >= 2) renderer.drawGfxArc(x, y + 1, 16 + rank, 0.18, Math.PI - 0.18, 1.8, rarity.color, 0.42, z + 3, "add", 12);
    for (let i = 0; i < rank; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      const sx = x + side * (15 + row * 3);
      const sy = y - 8 - row * 8 + Math.sin(now / 240 + i * 1.7) * 2;
      renderer.drawGfxDiamond(sx, sy, 2.4 + rank * 0.25, rarity.color, 0.62 + rank * 0.06, z + 4, now / 700 + i, "#ffffff");
    }
  }

  function renderHealthFoodPickup(renderer, x, y, z, pulse) {
    const scale = 0.96 + (pulse - 0.88) * 0.4;
    const angle = -0.55;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const point = (localX, localY) => ({
      x: x + (localX * cos - localY * sin) * scale,
      y: y + (localX * sin + localY * cos) * scale,
    });
    const boneStart = point(1, 0);
    const boneEnd = point(17, 0);
    const knobA = point(18, -3.4);
    const knobB = point(18, 3.4);

    renderer.drawGfxCircle(x - 1, y + 10, 13, "#050403", 0.24, "#000000", 0, 0, z - 3, "normal", 18);
    renderer.drawGfxLine(boneStart.x, boneStart.y, boneEnd.x, boneEnd.y, 7 * scale, "#6b4428", 1, z, "normal");
    renderer.drawGfxLine(boneStart.x, boneStart.y, boneEnd.x, boneEnd.y, 4.2 * scale, "#fff3d6", 1, z + 1, "normal");
    renderer.drawGfxCircle(knobA.x, knobA.y, 3.8 * scale, "#fff3d6", 1, "#6b4428", 0.9, 1.3, z + 2, "normal", 10);
    renderer.drawGfxCircle(knobB.x, knobB.y, 3.8 * scale, "#fff3d6", 1, "#6b4428", 0.9, 1.3, z + 2, "normal", 10);
    renderer.drawGfxPath(
      [[-14, -3], [-11, -9], [-4, -12], [3, -9], [6, -4], [5, 3], [0, 8], [-8, 10], [-14, 6]].map(([px, py]) => point(px, py)),
      "#b45309",
      1,
      "#3f1d0b",
      0.98,
      2.4,
      z + 3,
      "normal",
    );
    const crisp = [[-11, -2], [-8, -7], [-3, -9], [1, -7]].map(([px, py]) => point(px, py));
    renderer.drawGfxLine(crisp[0].x, crisp[0].y, crisp[1].x, crisp[1].y, 3, "#f59e0b", 0.9, z + 4, "normal");
    renderer.drawGfxLine(crisp[1].x, crisp[1].y, crisp[2].x, crisp[2].y, 3, "#fbbf24", 0.74, z + 4, "normal");
    renderer.drawGfxLine(crisp[2].x, crisp[2].y, crisp[3].x, crisp[3].y, 2, "#fde68a", 0.72, z + 5, "add");
    renderer.drawGfxLine(x - 15, y - 15, x - 9, y - 15, 2.2, "#86efac", 0.84, z + 5, "add");
    renderer.drawGfxLine(x - 12, y - 18, x - 12, y - 12, 2.2, "#86efac", 0.84, z + 5, "add");
  }

  function renderFieldPickup(renderer, pickup, now) {
    const visuals = renderer.getVisuals ? renderer.getVisuals() : null;
    const pos = visuals?.fieldPickups ? renderer.visualPosition(visuals.fieldPickups, pickup) : pickup;
    const bob = Math.sin(now / 170 + Number(pickup.id || 0)) * 2.5;
    const x = pos.x;
    const y = pos.y + bob;
    const z = pos.y + 12;
    const pulse = 0.88 + Math.sin(now / 210 + Number(pickup.id || 0)) * 0.08;

    if (pickup.type === "equipment") {
      renderEquipmentPickup(renderer, pickup, x, y, z, pulse, now);
      return;
    }

    if (pickup.type === "health_potion") {
      renderHealthFoodPickup(renderer, x, y, z, pulse);
      return;
    }

    renderer.drawGfxCircle(x, y + 2, 13, "#07141d", 0.78, "#67e8f9", 0.36, 2, z, "normal", 14);
    renderer.drawGfxArc(x, y, 8 * pulse, 0.05, Math.PI * 0.5, 5, "#fb7185", 0.92, z + 2, "normal", 10);
    renderer.drawGfxArc(x, y, 8 * pulse, Math.PI * 0.5, Math.PI - 0.05, 5, "#60a5fa", 0.92, z + 3, "normal", 10);
    renderer.drawGfxCircle(x + 8 * pulse, y, 3, "#fecdd3", 0.9, "", 0, 0, z + 4, "normal", 8);
    renderer.drawGfxCircle(x - 8 * pulse, y, 3, "#bfdbfe", 0.9, "", 0, 0, z + 4, "normal", 8);
  }

  function renderPickups(renderer, state, now) {
    for (const orb of state.xpOrbs || []) {
      if (renderer.isWorldVisible?.(orb, 48) === false) continue;
      renderXpOrb(renderer, orb, now);
    }
    for (const chest of state.relicChests || []) {
      if (renderer.isWorldVisible?.(chest, 96) === false) continue;
      renderRelicChest(renderer, chest, now);
    }
    for (const pickup of state.fieldPickups || []) {
      if (renderer.isWorldVisible?.(pickup, 64) === false) continue;
      renderFieldPickup(renderer, pickup, now);
    }
  }

  window.RoguePixiPickups = Object.freeze({
    xpOrbBob,
    xpOrbScale,
    relicChestScale,
    renderXpOrb,
    renderRelicChest,
    renderEquipmentPickup,
    renderHealthFoodPickup,
    renderFieldPickup,
    renderPickups,
  });
})();
