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
    renderer.sprite("xp", renderer.layers.pickup, orb.x, orb.y + bob, scale, scale, "#7e9fb2", 0.94).zIndex = orb.y;
  }

  function renderRelicChest(renderer, chest, now) {
    const scale = relicChestScale(chest);
    renderer.sprite("chest", renderer.layers.pickup, chest.x, chest.y + Math.sin(now / 220) * 2, scale, scale, "#facc15", 1).zIndex = chest.y;
    renderer.ring(chest.x, chest.y, (chest.radius || 22) * 1.7, "#facc15", 0.18 + Math.sin(now / 180) * 0.05, 2);
  }

  function renderPickups(renderer, state, now) {
    for (const orb of state.xpOrbs || []) {
      renderXpOrb(renderer, orb, now);
    }
    for (const chest of state.relicChests || []) {
      renderRelicChest(renderer, chest, now);
    }
  }

  window.RoguePixiPickups = Object.freeze({
    xpOrbBob,
    xpOrbScale,
    relicChestScale,
    renderXpOrb,
    renderRelicChest,
    renderPickups
  });
})();
