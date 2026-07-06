(function () {
  function safeText(value, fallback) {
    const text = String(value || fallback || "").trim();
    return text || fallback;
  }

  function safeNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function actorTextureKey(classId, frame, state) {
    return `actor:${safeText(classId, "warrior")}:${Math.max(0, Math.floor(safeNumber(frame, 0)))}:${safeText(state, "idle")}`;
  }

  function enemyTextureKey(type, frame) {
    return `enemy:${safeText(type, "slime")}:${Math.max(0, Math.floor(safeNumber(frame, 0)))}`;
  }

  function bossTextureInfo(enemy, now) {
    const phase = Math.max(1, Math.floor(safeNumber(enemy?.bossPhase, 1)));
    const id = safeText(enemy?.bossId || enemy?.bossPattern, "boss");
    const frame = Math.floor(safeNumber(now, 0) / 220) % 3;
    return {
      id,
      phase,
      frame,
      key: `boss:${id}:${phase}:${frame}`
    };
  }

  function projectileStyle(projectile) {
    return safeText(projectile?.style || projectile?.classId || (projectile?.hostile ? "hostile" : "bolt"), "bolt");
  }

  function projectileTextureKey(projectile) {
    return `projectile:${projectileStyle(projectile)}`;
  }

  function projectileColor(style) {
    const text = String(style || "").toLowerCase();
    if (text.includes("fire") || text.includes("meteor") || text.includes("mortar") || text.includes("bomb")) return "#f97316";
    if (text.includes("poison") || text.includes("venom") || text.includes("acid")) return "#bef264";
    if (text.includes("arrow") || text.includes("ranger") || text.includes("sniper") || text.includes("shuriken")) return "#f1d08b";
    if (text.includes("electric") || text.includes("chain") || text.includes("shock") || text.includes("rail")) return "#9ee6ff";
    if (text.includes("thread") || text.includes("puppet")) return "#f5d0fe";
    if (text.includes("shadow") || text.includes("assassin")) return "#c4b5fd";
    if (text.includes("hostile")) return "#f87171";
    return "#dbeafe";
  }

  function floorTileKey(chapter, variant) {
    return `floor-tile-${Math.max(1, Math.floor(safeNumber(chapter, 1)))}-${Math.max(0, Math.floor(safeNumber(variant, 0)))}`;
  }

  function legacyFloorTileKey(variant) {
    return `floor-tile-${Math.max(0, Math.floor(safeNumber(variant, 0)))}`;
  }

  function wallBlockKey(chapter) {
    return `wall-block-${Math.max(1, Math.floor(safeNumber(chapter, 1)))}`;
  }

  window.RoguePixiTextureKeys = Object.freeze({
    actorTextureKey,
    enemyTextureKey,
    bossTextureInfo,
    projectileStyle,
    projectileTextureKey,
    projectileColor,
    floorTileKey,
    legacyFloorTileKey,
    wallBlockKey
  });
})();
