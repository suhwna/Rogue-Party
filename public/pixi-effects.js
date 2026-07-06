(() => {
  function clamp01(value) {
    return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  }

  function effectProgress(effect) {
    return clamp01(Number(effect.age || 0) / Math.max(0.1, Number(effect.ttl || 0.7)));
  }

  function effectRadius(effect, fallbackRadius) {
    const rawRadius = Math.max(18, Number(fallbackRadius || effect.radius || 42));
    if (effect.kind === "warning") return Math.min(rawRadius, 190);
    if (effect.kind === "meteor") return Math.min(rawRadius, 150);
    if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") {
      return Math.min(rawRadius, 92);
    }
    if (effect.kind === "freeze" || effect.kind === "slow") return Math.min(rawRadius, 120);
    return Math.min(rawRadius, 110);
  }

  function floatingTextStyle(effect, color) {
    return {
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fontSize: effect.critical ? 26 : effect.kind === "xp" ? 15 : 18,
      fill: effect.kind === "heal" ? "#bbf7d0" : effect.kind === "xp" ? "#dbeafe" : color,
      stroke: { color: "#000000", width: effect.critical ? 5 : 3 },
    };
  }

  function floatingTextValue(effect) {
    if (effect.kind === "xp") return `+${effect.value || 0} XP`;
    if (effect.kind === "heal") return `+${effect.value || 0}`;
    return String(effect.value || "");
  }

  function isFloatingTextEffect(effect) {
    return effect.kind === "damage" || effect.kind === "heal" || effect.kind === "xp" || (effect.kind === "poison" && effect.value);
  }

  function renderFloatingTextEffect(renderer, effect, progress, alpha, color) {
    if (!isFloatingTextEffect(effect)) return false;
    const text = renderer.textPool.next(renderer.layers.effect, floatingTextStyle(effect, color));
    text.text = floatingTextValue(effect);
    text.position.set(effect.x, effect.y - progress * 28);
    text.alpha = alpha;
    text.scale.set(1 + (effect.critical ? 0.24 : 0.1) * Math.max(0, 1 - progress * 3));
    text.zIndex = effect.y + 100;
    return true;
  }

  function renderSlashEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "slash") return false;
    const cleave = style.includes("cleave") || style.includes("brute") || style.includes("mini_cleave") || style.includes("warrior");
    const puppet = style.includes("puppet") || style.includes("thread");
    const assassin = style.includes("shadow") || style.includes("assassin") || style.includes("stalker");
    const key = cleave ? "fx-cleave" : "fx-sword-cut";
    const angle = Number(effect.angle || 0);
    const slashScale = (cleave ? 0.72 : 0.82) + progress * (cleave ? 0.32 : 0.24);
    renderer.fx(key, effect.x, effect.y, slashScale, slashScale, assassin ? "#8a6f9e" : puppet ? "#f5d0fe" : color, alpha * 0.92, effect.y + 96, angle + progress * 0.42, "add");
    if (assassin || puppet) {
      const smoke = renderer.fx(
        assassin ? "fx-smoke" : "fx-lightning",
        effect.x - Math.cos(angle) * 18,
        effect.y - Math.sin(angle) * 18,
        0.55,
        0.42,
        assassin ? "#21142f" : "#b985c8",
        alpha * 0.32,
        effect.y + 88,
        angle,
        "add",
      );
      smoke.alpha *= 0.8;
    }
    if (style.includes("shield") || style.includes("slam")) {
      renderer.fx("fx-impact-star", effect.x, effect.y, radius / 62, radius / 62, "#facc15", alpha * 0.58, effect.y + 100, progress * 0.8, "add");
    }
    return true;
  }

  function renderSpinEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "spin") return false;
    const spin = renderer.fx("fx-spin", effect.x, effect.y, radius / 50 + progress * 0.35, radius / 50 + progress * 0.35, color, alpha * 0.78, effect.y + 94, Number(effect.angle || 0) + progress * 2.6, "add");
    spin.alpha *= style.includes("warrior") ? 1 : 0.82;
    return true;
  }

  function renderChainEffect(renderer, effect, progress, alpha, radius) {
    const angle = Number(effect.angle || 0);
    const bolt = renderer.fx("fx-lightning", effect.x, effect.y, Math.max(0.75, radius / 68), 0.9, "#9ee6ff", alpha * 0.92, effect.y + 92, angle, "add");
    renderer.fx("fx-impact-star", effect.x - Math.cos(angle) * radius * 0.45, effect.y - Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, progress, "add");
    renderer.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, -progress, "add");
    bolt.alpha *= 0.95;
  }

  function renderShotEffect(renderer, effect, alpha, radius, color, style) {
    const angle = Number(effect.angle || 0);
    const poison = style.includes("poison") || style.includes("venom") || style.includes("acid") || color === "#9aa15f";
    const sniper = style.includes("sniper") || style.includes("snipe");
    const fire = style.includes("fire") || style.includes("mortar") || style.includes("meteor");
    const key = fire ? "fx-fire-bloom" : poison ? "fx-poison-cloud" : "fx-arrow-streak";
    const sx = fire ? 0.42 + radius / 110 : poison ? 0.46 + radius / 150 : Math.max(0.85, radius / 74);
    const sy = fire ? 0.32 + radius / 160 : poison ? 0.34 + radius / 190 : sniper ? 0.72 : 0.82;
    renderer.fx(key, effect.x, effect.y, sx, sy, poison ? "#bef264" : fire ? "#f97316" : sniper ? "#fee2e2" : color, alpha * (sniper ? 0.92 : 0.76), effect.y + 90, angle, "add");
    if (sniper) renderer.fx("beam", effect.x, effect.y, Math.max(2.4, radius / 9), 0.34, "#ef4444", alpha * 0.3, effect.y + 86, angle, "add");
  }

  function renderDashEffect(renderer, effect, progress, alpha, radius, color, style) {
    const angle = Number(effect.angle || 0);
    const charge = style.includes("shield_charge");
    const blink = style.includes("mage_blink");
    const shadow = style.includes("shadow");
    const martial = style.includes("martial");
    const key = blink ? "fx-frost-shards" : shadow ? "fx-smoke" : charge ? "fx-shield-hex" : martial ? "fx-impact-star" : "beam";
    const sx = charge ? Math.max(0.7, radius / 80) : blink ? 0.5 : shadow ? Math.max(0.55, radius / 95) : Math.max(1.7, radius / 14);
    const sy = charge ? 0.56 : blink ? 0.5 : shadow ? 0.46 : Math.max(0.52, radius / 76);
    renderer.fx(key, effect.x, effect.y, sx, sy, blink ? "#93c5fd" : shadow ? "#8a6f9e" : martial ? "#fde68a" : color, alpha * 0.68, effect.y + 88, angle, "add");
    if (charge) {
      renderer.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.72, 0.72, "#facc15", alpha * 0.52, effect.y + 98, progress, "add");
    }
  }

  function renderMobilityOrProjectileEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "dash" && effect.kind !== "shot" && effect.kind !== "chain") return false;
    if (effect.kind === "chain" || style.includes("chain") || style.includes("lightning") || style.includes("electric")) {
      renderChainEffect(renderer, effect, progress, alpha, radius);
    } else if (effect.kind === "shot") {
      renderShotEffect(renderer, effect, alpha, radius, color, style);
    } else {
      renderDashEffect(renderer, effect, progress, alpha, radius, color, style);
    }
    return true;
  }

  function renderCoreSkillEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = String(rawStyle || "").toLowerCase();
    return (
      renderSlashEffect(renderer, effect, progress, alpha, radius, color, style) ||
      renderSpinEffect(renderer, effect, progress, alpha, radius, color, style) ||
      renderMobilityOrProjectileEffect(renderer, effect, progress, alpha, radius, color, style)
    );
  }

  function renderMeteorEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "meteor") return false;
    const fall = Math.min(1, progress * 1.35);
    const meteor = renderer.fx("fx-fire-bloom", effect.x - radius * 0.75 * (1 - fall), effect.y - radius * 1.85 * (1 - fall), 0.48 + fall * 0.42, 0.48 + fall * 0.42, "#f97316", alpha * 0.9, effect.y + 104, 0.78, "add");
    renderer.fx("beam", effect.x - radius * 0.38 * (1 - fall), effect.y - radius * 0.94 * (1 - fall), radius / 18, 1.2, "#f97316", alpha * 0.22, effect.y + 98, 0.78, "add");
    if (progress > 0.42) {
      renderer.fx("fx-fire-bloom", effect.x, effect.y, radius / 82 + progress * 0.34, radius / 82 + progress * 0.34, "#f97316", alpha * 0.62, effect.y + 100, progress * 1.4, "add");
      renderer.ring(effect.x, effect.y, radius * (0.35 + progress * 0.7), "#f97316", alpha * 0.2, 5);
    }
    meteor.alpha *= 0.94;
    return true;
  }

  function renderFreezeEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "freeze" && effect.kind !== "slow") return false;
    const snap = progress < 0.32 ? 1 + progress * 0.4 : 1.12 - (progress - 0.32) * 0.3;
    renderer.fx("fx-frost-shards", effect.x, effect.y, radius / 88 * snap, radius / 88 * snap, "#dbeafe", alpha * 0.8, effect.y + 92, progress * 0.4, "add");
    renderer.ring(effect.x, effect.y, radius * (0.82 + progress * 0.12), "#93c5fd", alpha * 0.28, 3);
    return true;
  }

  function renderWarningEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "warning") return false;
    const danger = style.includes("sniper") || style.includes("lock") ? "#ef4444" : color || "#ef4444";
    renderer.fx("fx-warning-target", effect.x, effect.y, radius / 48, radius / 48, danger, 0.2 + alpha * 0.34, effect.y + 50, progress * 0.18, "add");
    if (style.includes("boss") || style.includes("bomber") || radius > 90) {
      renderer.ring(effect.x, effect.y, radius * (0.98 - progress * 0.05), danger, 0.16 + alpha * 0.18, 4);
    }
    return true;
  }

  function renderSupportEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "shield" && effect.kind !== "cleanse" && effect.kind !== "revive" && effect.kind !== "holy") return false;
    const heal = effect.kind === "holy" || effect.kind === "revive" || effect.kind === "cleanse" || style.includes("heal");
    renderer.fx(heal ? "fx-heal-cross" : "fx-shield-hex", effect.x, effect.y, radius / 76 + progress * 0.16, radius / 76 + progress * 0.16, heal ? "#bbf7d0" : color, alpha * (heal ? 0.5 : 0.56), effect.y + 82, heal ? progress * 0.65 : progress * 0.18, "add");
    renderer.ring(effect.x, effect.y, radius * (0.62 + progress * 0.28), heal ? "#86efac" : color, alpha * 0.22, heal ? 2 : 4);
    return true;
  }

  function renderPoisonEffect(renderer, effect, progress, alpha, radius) {
    if (effect.kind !== "poison") return false;
    renderer.fx("fx-poison-cloud", effect.x, effect.y, radius / 76, radius / 90, "#bef264", alpha * 0.46, effect.y + 80, progress * 0.22, "add");
    return true;
  }

  function renderTrapEffect(renderer, effect, progress, alpha, radius, color) {
    if (effect.kind !== "trap") return false;
    renderer.fx("fx-warning-target", effect.x, effect.y, radius / 62, radius / 62, color, alpha * 0.42, effect.y + 76, progress * 0.8, "add");
    return true;
  }

  function renderRewardBurstEffect(renderer, effect, progress, alpha, radius, color) {
    if (effect.kind !== "arcane" && effect.kind !== "star" && effect.kind !== "level" && effect.kind !== "chest") return false;
    const tint = effect.kind === "chest" ? "#facc15" : effect.kind === "level" ? "#dbeafe" : color;
    renderer.fx("fx-impact-star", effect.x, effect.y, radius / 72 + progress * 0.2, radius / 72 + progress * 0.2, tint, alpha * 0.62, effect.y + 86, progress * 1.8, "add");
    renderer.ring(effect.x, effect.y, radius * (0.45 + progress * 0.45), tint, alpha * 0.22, 3);
    return true;
  }

  function renderImpactEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "impact") return false;
    const heavy = style.includes("heavy") || style.includes("critical") || style.includes("slam") || effect.heavy;
    const playerHit = style.includes("player");
    renderer.fx("fx-impact-star", effect.x, effect.y, radius / (heavy ? 58 : 78), radius / (heavy ? 58 : 78), playerHit ? "#ef4444" : color, alpha * (heavy ? 0.82 : 0.52), effect.y + 94, progress * 1.2, "add");
    if (heavy) renderer.ring(effect.x, effect.y, radius * (0.4 + progress * 0.34), color, alpha * 0.2, 4);
    return true;
  }

  function renderExplosionEffect(renderer, effect, progress, alpha, radius, color, style) {
    if (effect.kind !== "explosion" && effect.kind !== "death") return false;
    const poison = style.includes("poison") || style.includes("splitter");
    const fire = style.includes("fire") || style.includes("bomber") || style.includes("blast") || style.includes("meteor");
    renderer.fx(poison ? "fx-poison-cloud" : fire ? "fx-fire-bloom" : "fx-impact-star", effect.x, effect.y, radius / 78 + progress * 0.3, radius / 78 + progress * 0.3, poison ? "#bef264" : fire ? "#f97316" : color, alpha * 0.62, effect.y + 90, progress * 1.1, "add");
    renderer.ring(effect.x, effect.y, radius * (0.5 + progress * 0.48), poison ? "#bef264" : fire ? "#f97316" : color, alpha * 0.2, 5);
    return true;
  }

  function renderSecondaryEffect(renderer, effect, progress, alpha, radius, color, rawStyle) {
    const style = String(rawStyle || "").toLowerCase();
    return (
      renderMeteorEffect(renderer, effect, progress, alpha, radius) ||
      renderFreezeEffect(renderer, effect, progress, alpha, radius) ||
      renderWarningEffect(renderer, effect, progress, alpha, radius, color, style) ||
      renderSupportEffect(renderer, effect, progress, alpha, radius, color, style) ||
      renderPoisonEffect(renderer, effect, progress, alpha, radius) ||
      renderTrapEffect(renderer, effect, progress, alpha, radius, color) ||
      renderRewardBurstEffect(renderer, effect, progress, alpha, radius, color) ||
      renderImpactEffect(renderer, effect, progress, alpha, radius, color, style) ||
      renderExplosionEffect(renderer, effect, progress, alpha, radius, color, style)
    );
  }

  function renderDefaultBurstEffect(renderer, effect, progress, alpha, radius, color) {
    const burst = renderer.sprite("burst", renderer.layers.effect, effect.x, effect.y, radius / 48, radius / 48, color, alpha * 0.42);
    burst.zIndex = effect.y + 80;
    return true;
  }

  window.RoguePixiEffects = Object.freeze({
    effectProgress,
    effectRadius,
    floatingTextStyle,
    floatingTextValue,
    isFloatingTextEffect,
    renderFloatingTextEffect,
    renderSlashEffect,
    renderSpinEffect,
    renderChainEffect,
    renderShotEffect,
    renderDashEffect,
    renderMobilityOrProjectileEffect,
    renderCoreSkillEffect,
    renderMeteorEffect,
    renderFreezeEffect,
    renderWarningEffect,
    renderSupportEffect,
    renderPoisonEffect,
    renderTrapEffect,
    renderRewardBurstEffect,
    renderImpactEffect,
    renderExplosionEffect,
    renderSecondaryEffect,
    renderDefaultBurstEffect,
  });
})();
