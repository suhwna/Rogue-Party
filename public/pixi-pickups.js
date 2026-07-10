(() => {
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

  function renderPickups(renderer, state, now) {
    for (const orb of state.xpOrbs || []) renderXpOrb(renderer, orb, now);
    for (const chest of state.relicChests || []) renderRelicChest(renderer, chest, now);
  }

  window.RoguePixiPickups = Object.freeze({
    xpOrbBob,
    xpOrbScale,
    relicChestScale,
    renderXpOrb,
    renderRelicChest,
    renderPickups,
  });
})();
