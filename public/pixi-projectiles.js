(() => {
  function projectileStyle(projectile) {
    return projectile.style || projectile.classId || "";
  }

  function classifyProjectile(projectile) {
    const style = projectileStyle(projectile);
    return {
      style,
      poison: projectile.poison || style.includes("poison") || style.includes("venom") || style.includes("acid"),
      fire: style.includes("fire") || style.includes("meteor") || style.includes("mortar") || style.includes("bomb"),
      lightning: style.includes("electric") || style.includes("chain") || style.includes("rail") || style.includes("shock"),
      arrow: style.includes("arrow") || style.includes("ranger") || style.includes("sniper") || style.includes("shuriken"),
      thread: style.includes("thread"),
      flask: style.includes("alchemy") || style.includes("bottle"),
      shadow: style.includes("shuriken") || style.includes("shadow") || style.includes("assassin")
    };
  }

  function projectileSpriteKey(renderer, projectile, tags) {
    if (tags.thread) return "fx-thread-knot";
    if (tags.flask) return "fx-flask";
    if (tags.shadow) return "fx-shadow-cut";
    if (tags.lightning) return "fx-lightning";
    if (tags.fire) return "fx-fire-bloom";
    if (tags.poison) return "fx-poison-cloud";
    if (tags.arrow) return tags.style.includes("piercing") || projectile.pierce > 0 ? "fx-pierce-lance" : "fx-arrow-streak";
    return renderer.projectileTextureKey(projectile);
  }

  function projectileScale(projectile, tags) {
    const base = Math.max(0.55, (projectile.radius || 6) / 7);
    const scaleX =
      tags.thread ? Math.max(0.38, base * 0.52) :
      tags.flask ? Math.max(0.45, base * 0.58) :
      tags.shadow ? Math.max(0.35, base * 0.54) :
      tags.lightning ? Math.max(0.62, base * 0.78) :
      tags.arrow ? Math.max(0.62, base * (tags.style.includes("piercing") ? 0.72 : 0.95)) :
      tags.fire ? Math.max(0.34, base * 0.48) :
      tags.poison ? Math.max(0.28, base * 0.44) :
      base;
    const scaleY =
      tags.thread ? Math.max(0.28, base * 0.36) :
      tags.flask ? Math.max(0.45, base * 0.58) :
      tags.shadow ? Math.max(0.22, base * 0.34) :
      tags.lightning ? Math.max(0.38, base * 0.52) :
      tags.arrow ? Math.max(0.38, base * (tags.style.includes("piercing") ? 0.42 : 0.62)) :
      tags.fire ? Math.max(0.34, base * 0.48) :
      tags.poison ? Math.max(0.26, base * 0.36) :
      base;
    return { scaleX, scaleY };
  }

  function projectileTint(projectile, tags) {
    if (tags.thread) return "#f5d0fe";
    if (tags.flask) return tags.style.includes("fire") ? "#f97316" : "#bef264";
    if (tags.shadow) return "#c4b5fd";
    if (tags.poison) return "#bef264";
    if (tags.fire) return "#f97316";
    if (tags.lightning) return "#9ee6ff";
    if (projectile.hostile) return "#f87171";
    return projectile.color || "#f8f3e9";
  }

  function renderProjectiles(renderer, projectiles, now) {
    for (const projectile of projectiles) {
      const tags = classifyProjectile(projectile);
      const key = projectileSpriteKey(renderer, projectile, tags);
      const { scaleX, scaleY } = projectileScale(projectile, tags);
      const tint = projectileTint(projectile, tags);
      const sprite = renderer.sprite(key, renderer.layers.projectile, projectile.x, projectile.y, scaleX, scaleY, tint, 1);
      sprite.rotation = projectile.angle || 0;
      sprite.blendMode = tags.fire || tags.lightning || tags.poison || tags.thread || tags.shadow ? "add" : "normal";
      sprite.zIndex = projectile.y + 4;

      if (tags.thread) {
        const trail = renderer.sprite(
          "fx-lightning",
          renderer.layers.projectile,
          projectile.x - Math.cos(projectile.angle || 0) * 18,
          projectile.y - Math.sin(projectile.angle || 0) * 18,
          0.32,
          0.18,
          "#b985c8",
          0.36
        );
        trail.rotation = projectile.angle || 0;
        trail.blendMode = "add";
        trail.zIndex = projectile.y + 3;
      }

      if (tags.flask) {
        const drop = renderer.sprite(
          tags.style.includes("fire") ? "fx-fire-pool" : "fx-acid-splash",
          renderer.layers.projectile,
          projectile.x - Math.cos(projectile.angle || 0) * 14,
          projectile.y - Math.sin(projectile.angle || 0) * 14,
          0.22,
          0.18,
          tags.style.includes("fire") ? "#f97316" : "#bef264",
          0.22
        );
        drop.rotation = projectile.angle || 0;
        drop.blendMode = "add";
        drop.zIndex = projectile.y + 2;
      }

      if (projectile.splash) {
        renderer.ring(projectile.x, projectile.y, projectile.splash, projectile.hostile ? "#f87171" : "#7e9fb2", 0.08, 2);
      }
    }
  }

  window.RoguePixiProjectiles = Object.freeze({
    classifyProjectile,
    projectileSpriteKey,
    projectileScale,
    projectileTint,
    renderProjectiles
  });
})();
