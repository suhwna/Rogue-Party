(() => {
  function hazardFlavor(hazard) {
    return `${hazard.type || ""} ${hazard.style || ""} ${hazard.damageType || ""}`.toLowerCase();
  }

  function hazardState(hazard, now) {
    const color = hazard.color || (hazard.hostile ? "#f87171" : "#7e9fb2");
    const armed = hazard.armed || !hazard.armTime;
    const alpha = armed ? 0.32 : 0.16 + Math.sin(now / 90) * 0.08;
    const radius = hazard.radius || 40;
    const flavor = hazardFlavor(hazard);
    return { color, armed, alpha, radius, flavor };
  }

  function renderBeamHazard(renderer, hazard, state) {
    if (!hazard.length || !hazard.width) return false;
    const beamColor = state.flavor.includes("sniper") || state.flavor.includes("laser") || hazard.hostile ? "#ef4444" : state.color;
    const beam = renderer.sprite("beam", renderer.layers.hazard, hazard.x, hazard.y, hazard.length / 32, Math.max(0.55, hazard.width / 9), beamColor, state.armed ? 0.5 : 0.24);
    beam.rotation = hazard.angle || 0;
    beam.blendMode = "add";
    beam.zIndex = hazard.y - 8;
    return true;
  }

  function renderEngineerTurret(renderer, hazard, state, now) {
    const size = hazard.small ? 0.72 : 0.92;
    const turret = renderer.sprite("fx-turret", renderer.layers.hazard, hazard.x, hazard.y + Math.sin(now / 170 + hazard.id) * 1.2, size, size, "#d6b76d", 0.96);
    turret.zIndex = hazard.y + 8;
    renderer.sprite("shadow", renderer.layers.hazard, hazard.x, hazard.y + 25, 0.72, 0.56, "#000000", 0.55).zIndex = hazard.y - 2;
    renderer.sprite("fx-lightning", renderer.layers.hazard, hazard.x + 18, hazard.y - 10, 0.35, 0.24, "#9ee6ff", state.armed ? 0.38 + Math.sin(now / 90) * 0.1 : 0.16).zIndex = hazard.y + 9;
    if (!state.armed) renderer.ring(hazard.x, hazard.y, state.radius * 0.72, "#9ee6ff", 0.16 + Math.sin(now / 80) * 0.05, 2);
  }

  function renderEngineerDrone(renderer, hazard, now) {
    const drone = renderer.sprite("fx-drone", renderer.layers.hazard, hazard.x, hazard.y - 8 + Math.sin(now / 120 + hazard.id) * 4, 0.76, 0.76, "#d6b76d", 0.96);
    drone.zIndex = hazard.y + 22;
    drone.blendMode = "normal";
    renderer.sprite("shadow", renderer.layers.hazard, hazard.x, hazard.y + 18, 0.54, 0.38, "#000000", 0.38).zIndex = hazard.y - 2;
    renderer.sprite("fx-lightning", renderer.layers.hazard, hazard.x, hazard.y - 4, 0.48, 0.2, "#9ee6ff", 0.28 + Math.sin(now / 110) * 0.08).zIndex = hazard.y + 23;
  }

  function renderEngineerMine(renderer, hazard, state, now) {
    const mine = renderer.sprite("fx-mine", renderer.layers.hazard, hazard.x, hazard.y, 0.72, 0.72, state.armed ? "#9ee6ff" : "#d6b76d", 0.92);
    mine.rotation = Math.sin(now / 160 + hazard.id) * 0.08;
    mine.blendMode = "add";
    mine.zIndex = hazard.y + 2;
    renderer.ring(hazard.x, hazard.y, Math.max(28, state.radius * (state.armed ? 0.78 : 0.56)), "#9ee6ff", state.armed ? 0.18 : 0.12 + Math.sin(now / 95) * 0.05, 2);
  }

  function renderPuppet(renderer, hazard, now) {
    if (Number.isFinite(hazard.moveFromX) && Number.isFinite(hazard.moveFromY) && (hazard.moveTime || 0) > 0) {
      renderer.lineFx("fx-lightning", hazard.moveFromX, hazard.moveFromY, hazard.x, hazard.y, 10, "#f5d0fe", 0.4, hazard.y + 50, "add");
    }
    const puppet = renderer.sprite("fx-puppet", renderer.layers.hazard, hazard.x, hazard.y + Math.sin(now / 190 + hazard.id) * 1.5, 0.84, 0.84, "#b985c8", 0.98);
    puppet.zIndex = hazard.y + 10;
    renderer.sprite("fx-thread-knot", renderer.layers.hazard, hazard.x, hazard.y - 28, 0.46, 0.46, "#f5d0fe", 0.42 + Math.sin(now / 140) * 0.1).zIndex = hazard.y + 12;
  }

  function renderArrowRain(renderer, hazard, state, now) {
    const warning = renderer.sprite("fx-warning-target", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 49, state.radius / 49, "#f1d08b", state.armed ? 0.18 : 0.34);
    warning.rotation = now / 900;
    warning.blendMode = "add";
    warning.zIndex = hazard.y - 12;
    const dropCount = state.armed ? 8 : 4;
    for (let i = 0; i < dropCount; i += 1) {
      const t = (now / 240 + i * 0.37 + hazard.id * 0.11) % 1;
      const a = renderer.noise(hazard.id + i * 17, 4) * Math.PI * 2;
      const r = Math.sqrt(renderer.noise(hazard.id + i * 31, 9)) * state.radius * 0.78;
      const x = hazard.x + Math.cos(a) * r;
      const y = hazard.y + Math.sin(a) * r - 80 + t * 112;
      const arrow = renderer.sprite("fx-arrow-rain", renderer.layers.hazard, x, y, 0.38, 0.48, "#f1d08b", state.armed ? 0.76 : 0.44);
      arrow.zIndex = hazard.y + 28 + i;
      arrow.blendMode = "add";
    }
  }

  function renderAlchemyBomb(renderer, hazard, state, now) {
    if (Number.isFinite(hazard.spawnFromX) && Number.isFinite(hazard.spawnFromY)) {
      renderer.lineFx("beam", hazard.spawnFromX, hazard.spawnFromY, hazard.x, hazard.y, 5, "#bef264", 0.18, hazard.y + 4, "add");
    }
    const bomb = renderer.sprite("fx-flask", renderer.layers.hazard, hazard.x, hazard.y - (state.armed ? 0 : Math.sin(now / 90) * 3), 0.74, 0.74, "#bef264", 0.94);
    bomb.rotation = Math.sin(now / 130 + hazard.id) * 0.25;
    bomb.zIndex = hazard.y + 6;
    renderer.ring(hazard.x, hazard.y, state.radius, "#bef264", state.armed ? 0.18 : 0.12 + Math.sin(now / 90) * 0.06, 2);
  }

  function renderAlchemyPool(renderer, hazard, state, now) {
    const fireMode = hazard.mode === "fire" || state.flavor.includes("fire");
    const key = fireMode ? "fx-fire-pool" : "fx-acid-splash";
    const tint = fireMode ? "#f97316" : "#bef264";
    const pool = renderer.sprite(key, renderer.layers.hazard, hazard.x, hazard.y, state.radius / 70, state.radius / 86, tint, state.armed ? (fireMode ? 0.46 : 0.32) : 0.24);
    pool.blendMode = "add";
    pool.zIndex = hazard.y - 10;
    renderer.ring(hazard.x, hazard.y, state.radius, tint, 0.12 + Math.sin(now / 180 + hazard.id) * 0.03, 2);
  }

  function renderElixirMist(renderer, hazard, state, now) {
    const mist = renderer.sprite("fx-heal-cross", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 86, state.radius / 86, "#bbf7d0", 0.3 + Math.sin(now / 160) * 0.06);
    mist.blendMode = "add";
    mist.zIndex = hazard.y - 8;
    renderer.ring(hazard.x, hazard.y, state.radius, "#bbf7d0", 0.13, 2);
  }

  function renderMeteorHazard(renderer, hazard, state, now) {
    const marker = renderer.sprite("fx-warning-target", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 48, state.radius / 48, "#f97316", state.armed ? 0.24 : 0.42);
    marker.rotation = now / 720;
    marker.blendMode = "add";
    marker.zIndex = hazard.y - 14;
    renderer.sprite("fx-meteor-fall", renderer.layers.hazard, hazard.x - 48, hazard.y - 112, 0.72, 0.72, "#f97316", Math.max(0.16, 0.42 - (hazard.armTime || 0) * 0.1)).zIndex = hazard.y + 26;
  }

  function renderDefaultHazard(renderer, hazard, state) {
    const poison = state.flavor.includes("poison") || state.flavor.includes("acid") || state.flavor.includes("venom");
    const fire = state.flavor.includes("fire") || state.flavor.includes("flame") || state.flavor.includes("burn") || state.flavor.includes("meteor") || state.flavor.includes("bomber") || state.flavor.includes("blast");
    const heal = state.flavor.includes("heal") || state.flavor.includes("elixir") || state.flavor.includes("holy");
    const shield = state.flavor.includes("shield") || state.flavor.includes("barrier");
    if (poison) {
      const cloud = renderer.sprite("fx-poison-cloud", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 54, state.radius / 70, "#bef264", state.armed ? 0.34 : 0.2);
      cloud.blendMode = "add";
      cloud.zIndex = hazard.y - 12;
    } else if (fire) {
      const flame = renderer.sprite("fx-fire-bloom", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 64, state.radius / 64, "#f97316", state.armed ? 0.28 : 0.17);
      flame.blendMode = "add";
      flame.zIndex = hazard.y - 12;
    } else if (heal) {
      const cross = renderer.sprite("fx-heal-cross", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 76, state.radius / 76, "#86efac", state.armed ? 0.28 : 0.16);
      cross.blendMode = "add";
      cross.zIndex = hazard.y - 12;
    } else if (shield) {
      const hex = renderer.sprite("fx-shield-hex", renderer.layers.hazard, hazard.x, hazard.y, state.radius / 76, state.radius / 76, "#bfdbfe", state.armed ? 0.34 : 0.2);
      hex.blendMode = "add";
      hex.zIndex = hazard.y - 12;
    }
    renderer.ring(hazard.x, hazard.y, state.radius, poison ? "#bef264" : fire ? "#f97316" : heal ? "#86efac" : state.color, state.alpha, state.armed ? 3 : 2);
    if (state.armed) {
      const warningKey = hazard.hostile ? "fx-warning-target" : "warning-ring";
      const warning = renderer.sprite(warningKey, renderer.layers.hazard, hazard.x, hazard.y, state.radius / 45, state.radius / 45, poison ? "#bef264" : fire ? "#f97316" : state.color, hazard.hostile ? 0.16 : 0.14);
      warning.blendMode = "add";
      warning.zIndex = hazard.y - 10;
    }
  }

  function renderHazard(renderer, hazard, now) {
    const state = hazardState(hazard, now);
    if (renderBeamHazard(renderer, hazard, state)) return;
    if (hazard.type === "engineer_turret") return renderEngineerTurret(renderer, hazard, state, now);
    if (hazard.type === "engineer_drone") return renderEngineerDrone(renderer, hazard, now);
    if (hazard.type === "engineer_mine") return renderEngineerMine(renderer, hazard, state, now);
    if (hazard.type === "puppet") return renderPuppet(renderer, hazard, now);
    if (hazard.type === "arrow_rain") return renderArrowRain(renderer, hazard, state, now);
    if (hazard.type === "alchemy_bomb") return renderAlchemyBomb(renderer, hazard, state, now);
    if (hazard.type === "alchemy_pool" || hazard.type === "acid_pool") return renderAlchemyPool(renderer, hazard, state, now);
    if (hazard.type === "alchemy_elixir_mist") return renderElixirMist(renderer, hazard, state, now);
    if (hazard.type === "meteor") return renderMeteorHazard(renderer, hazard, state, now);
    return renderDefaultHazard(renderer, hazard, state);
  }

  function renderHazards(renderer, hazards, now) {
    for (const hazard of hazards) renderHazard(renderer, hazard, now);
  }

  window.RoguePixiHazards = Object.freeze({
    hazardFlavor,
    hazardState,
    renderHazard,
    renderHazards
  });
})();
