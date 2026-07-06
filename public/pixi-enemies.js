(() => {
  const SPRITE_SIZE = 64;
  const BOSS_SIZE = 128;

  function enemyFrame(enemy, now) {
    return Math.floor(now / (enemy.type === "bat" ? 95 : 160)) % 4;
  }

  function enemyFace(enemy, pos, last) {
    const dx = pos.x - last.x;
    const targetX = Number.isFinite(enemy.windup?.x)
      ? enemy.windup.x
      : Number.isFinite(enemy.chargeMove?.toX)
        ? enemy.chargeMove.toX
        : pos.x + dx;
    return targetX >= pos.x ? 1 : -1;
  }

  function enemyTextureKey(renderer, enemy, now) {
    if (enemy.type === "boss") return renderer.bossTextureKey(enemy, now);
    return renderer.enemyTextureKey(enemy.type || "slime", enemyFrame(enemy, now));
  }

  function enemyScale(enemy) {
    const size = enemy.type === "boss" ? BOSS_SIZE : SPRITE_SIZE;
    return Math.max(0.72, (enemy.radius * (enemy.type === "boss" ? 4.75 : 4.05)) / size);
  }

  function renderEnemy(renderer, enemy, now, visuals) {
    const pos = renderer.visualPosition(visuals.enemies, enemy);
    const last = renderer.lastEnemyPositions.get(String(enemy.id)) || pos;
    const face = enemyFace(enemy, pos, last);
    renderer.lastEnemyPositions.set(String(enemy.id), { x: pos.x, y: pos.y });

    const shadowScale = Math.max(0.55, enemy.radius / 28);
    renderer.sprite("shadow", renderer.layers.actor, pos.x, pos.y + enemy.radius * 0.66, shadowScale, shadowScale, "#000000", 0.74).zIndex = pos.y - 2;

    const key = enemyTextureKey(renderer, enemy, now);
    const scale = enemyScale(enemy);
    const sprite = renderer.sprite(key, renderer.layers.actor, pos.x, pos.y, scale * face, scale, "#ffffff", 1);
    sprite.zIndex = pos.y;
    if (enemy.windup) {
      sprite.rotation = Math.sin(now / 90) * 0.035;
      sprite.alpha = 0.86 + Math.sin(now / 80) * 0.12;
    }
    if (enemy.type === "boss" && enemy.phaseTransitionTime > 0) {
      const maxTime = Math.max(0.1, Number(enemy.phaseTransitionTimeMax || enemy.phaseTransitionTime || 1));
      const ratio = Math.max(0, Math.min(1, Number(enemy.phaseTransitionTime || 0) / maxTime));
      const pulse = 1 + Math.sin(now / 70) * 0.08;
      const color = enemy.phaseAuraColor || enemy.color || "#f97316";
      renderer.ring(pos.x, pos.y, enemy.radius * 1.92 * pulse, color, 0.46 * ratio, 5);
      renderer.ring(pos.x, pos.y, enemy.radius * (1.34 + (1 - ratio) * 0.42), "#fff7ed", 0.2 * ratio, 3);
      renderer.fx("fx-impact-star", pos.x, pos.y - enemy.radius * 0.18, enemy.radius / 42, enemy.radius / 42, color, 0.42 * ratio, pos.y + 160, now / 180, "add");
    }
    if (enemy.statusEffects?.includes("freeze")) renderer.ring(pos.x, pos.y, enemy.radius * 1.35, "#93c5fd", 0.52, 3);
    if (enemy.statusEffects?.includes("barrier") || enemy.barrier > 0) renderer.ring(pos.x, pos.y, enemy.radius * 1.58, "#bfdbfe", 0.42, 3);
    if (enemy.elite) renderer.drawEliteCrown(pos.x, pos.y - enemy.radius * 1.1, enemy.affix || "", enemy.color || "#facc15", pos.y + 1);
    renderer.bar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, 5, enemy.hp / enemy.maxHp, "#ef4444");
  }

  function renderEnemies(renderer, enemies, now) {
    const visuals = renderer.getVisuals();
    for (const enemy of enemies) renderEnemy(renderer, enemy, now, visuals);
  }

  window.RoguePixiEnemies = Object.freeze({
    enemyFrame,
    enemyFace,
    enemyTextureKey,
    enemyScale,
    renderEnemy,
    renderEnemies
  });
})();
