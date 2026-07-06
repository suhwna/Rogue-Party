(() => {
  function resolveChapter(room) {
    return Math.max(1, Math.min(3, Math.round(Number(room?.chapter || room?.floor || 1))));
  }

  function chapterTheme(chapter, profile = null) {
    const tone = profile?.visualTone;
    if (tone) {
      return {
        base: tone.base || "#0f0c0c",
        side: tone.side || "#11100f",
        torch: tone.torch || "#f97316",
        torchSoft: tone.torchSoft || "#facc15",
        scarA: tone.scarA || "#d6b76d",
        scarB: tone.scarB || "#7e9fb2",
        fog: tone.fog || "#3f2f24",
        rune: tone.rune || tone.torch || "#d6b76d"
      };
    }
    if (chapter === 2) {
      return {
        base: "#09140f",
        side: "#0d1c13",
        torch: "#84cc16",
        torchSoft: "#bef264",
        scarA: "#84cc16",
        scarB: "#6ba79e",
        fog: "#16351f",
        rune: "#bef264"
      };
    }
    if (chapter === 3) {
      return {
        base: "#080913",
        side: "#0d1020",
        torch: "#8b5cf6",
        torchSoft: "#93c5fd",
        scarA: "#b985c8",
        scarB: "#7e9fb2",
        fog: "#171b3d",
        rune: "#93c5fd"
      };
    }
    return {
      base: "#0f0c0c",
      side: "#11100f",
      torch: "#f97316",
      torchSoft: "#facc15",
      scarA: "#d6b76d",
      scarB: "#7e9fb2",
      fog: "#3f2f24",
      rune: "#d6b76d"
    };
  }

  function resolveStageKind(room) {
    const stage = room?.stage || {};
    return String(stage.resolvedKind || stage.kind || room?.stageKind || room?.objective?.type || "combat").toLowerCase();
  }

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function stageAccent(kind, theme) {
    if (kind === "boss") return "#ef4444";
    if (kind === "miniboss") return "#fb7185";
    if (kind === "elite") return "#facc15";
    if (kind === "defense") return "#86efac";
    if (kind === "blockade") return "#f87171";
    if (kind === "reward") return "#facc15";
    if (kind === "random") return "#93c5fd";
    return theme.rune || theme.torch;
  }

  function renderStageAtmosphere(renderer, world, now, room, theme, chapter) {
    const kind = resolveStageKind(room);
    const objective = room?.objective || null;
    const accent = stageAccent(kind, theme);
    const pulse = 0.5 + Math.sin(now / 420) * 0.5;

    renderer.rect(renderer.layers.floor, world.w / 2, 24, world.w, 48, theme.fog, 0.16).zIndex = -2100;
    renderer.rect(renderer.layers.floor, world.w / 2, world.h - 24, world.w, 48, theme.fog, 0.18).zIndex = -2100;
    renderer.rect(renderer.layers.floor, 24, world.h / 2, 48, world.h, theme.fog, 0.16).zIndex = -2100;
    renderer.rect(renderer.layers.floor, world.w - 24, world.h / 2, 48, world.h, theme.fog, 0.16).zIndex = -2100;

    if (kind === "blockade" || objective?.type === "blockade") {
      renderBlockadeBackdrop(renderer, world, now, objective, accent);
      return;
    }
    if (kind === "defense" || objective?.type === "defense") {
      renderDefenseBackdrop(renderer, world, now, objective, accent, theme);
      return;
    }
    if (kind === "reward" || objective?.type === "reward") {
      renderRewardBackdrop(renderer, world, now, accent, theme);
      return;
    }
    if (kind === "boss" || kind === "miniboss") {
      renderBossBackdrop(renderer, world, now, kind, accent, theme, chapter);
      return;
    }
    if (kind === "elite") {
      renderEliteBackdrop(renderer, world, now, accent, theme);
      return;
    }

    renderTraitBackdrop(renderer, world, now, room?.waveTrait?.id || "", theme, pulse);
  }

  function renderTraitBackdrop(renderer, world, now, traitId, theme, pulse) {
    if (traitId === "ritual") {
      for (let i = 0; i < 6; i += 1) {
        const x = world.w * (0.18 + i * 0.13);
        const y = world.h * (0.22 + (i % 3) * 0.22);
        renderer.sprite("fx-heal-cross", renderer.layers.floor, x, y, 0.48, 0.48, "#86efac", 0.06 + pulse * 0.035).zIndex = -1700;
      }
    } else if (traitId === "volatile") {
      for (let i = 0; i < 7; i += 1) {
        const x = world.w * (0.15 + (i % 4) * 0.22);
        const y = world.h * (0.18 + Math.floor(i / 4) * 0.44 + (i % 2) * 0.09);
        renderer.sprite("fx-fire-bloom", renderer.layers.floor, x, y, 0.42, 0.34, "#f97316", 0.055 + pulse * 0.035).zIndex = -1710;
      }
    } else if (traitId === "bulwark") {
      for (let i = 0; i < 5; i += 1) {
        const x = world.w * (0.2 + i * 0.15);
        const y = i % 2 ? world.h * 0.7 : world.h * 0.3;
        renderer.sprite("fx-shield-hex", renderer.layers.floor, x, y, 0.58, 0.58, theme.rune, 0.06 + pulse * 0.03).zIndex = -1710;
      }
    }
  }

  function renderBlockadeBackdrop(renderer, world, now, objective, accent) {
    const laneTop = finite(objective?.laneTop, world.h * 0.23);
    const laneBottom = finite(objective?.laneBottom, world.h * 0.77);
    const goalX = finite(objective?.goalX, 58);
    const laneH = Math.max(160, laneBottom - laneTop);
    const midY = (laneTop + laneBottom) / 2;
    const pulse = 0.5 + Math.sin(now / 170) * 0.5;

    renderer.rect(renderer.layers.floor, world.w / 2, midY, world.w, laneH + 36, "#170b0b", 0.28).zIndex = -1950;
    renderer.rect(renderer.layers.floor, goalX - 24, midY, 34, laneH + 126, "#ef4444", 0.18 + pulse * 0.08).zIndex = -1550;
    for (let i = 0; i < 6; i += 1) {
      renderer.rect(renderer.layers.floor, goalX - 52 - i * 18, midY, 10, laneH + 98, "#ef4444", 0.13 - i * 0.014).zIndex = -1560 + i;
    }
    renderer.rect(renderer.layers.floor, world.w / 2, laneTop, world.w, 5, accent, 0.18 + pulse * 0.06).zIndex = -1500;
    renderer.rect(renderer.layers.floor, world.w / 2, laneBottom, world.w, 5, accent, 0.18 + pulse * 0.06).zIndex = -1500;

    const laneCount = Math.max(3, Math.round(objective?.laneCount || 4));
    for (let i = 0; i < laneCount; i += 1) {
      const y = laneTop + ((i + 0.5) / laneCount) * laneH;
      renderer.rect(renderer.layers.floor, world.w / 2, y, world.w, 2, "#fca5a5", 0.06).zIndex = -1510;
      for (let j = 0; j < 4; j += 1) {
        const x = world.w - 160 - j * 220 + ((now / 38 + i * 37) % 190);
        const arrow = renderer.sprite("fx-arrow-streak", renderer.layers.floor, x, y, 0.5, 0.32, "#f87171", 0.16 + pulse * 0.04);
        arrow.rotation = Math.PI;
        arrow.zIndex = -1490;
      }
    }
  }

  function renderDefenseBackdrop(renderer, world, now, objective, accent, theme) {
    const x = finite(objective?.x, world.w / 2);
    const y = finite(objective?.y, world.h / 2);
    const radius = Math.max(80, finite(objective?.radius, 42) * 2.35);
    const pulse = 0.5 + Math.sin(now / 210) * 0.5;
    renderer.sprite("fx-shield-hex", renderer.layers.floor, x, y, radius / 60, radius / 60, accent, 0.13 + pulse * 0.05).zIndex = -1450;
    renderer.sprite("fx-impact-star", renderer.layers.floor, x, y, 0.72, 0.72, theme.torchSoft, 0.16 + pulse * 0.05).zIndex = -1430;
    renderer.ring(x, y, radius, accent, 0.14 + pulse * 0.04, 4);
    renderer.ring(x, y, radius * 0.62, theme.torchSoft, 0.1 + pulse * 0.035, 3);
    for (let i = 0; i < 4; i += 1) {
      const a = now / 1900 + i * Math.PI * 0.5;
      const sx = x + Math.cos(a) * radius * 0.82;
      const sy = y + Math.sin(a) * radius * 0.82;
      renderer.sprite("fx-heal-cross", renderer.layers.floor, sx, sy, 0.38, 0.38, accent, 0.18).zIndex = -1420;
    }
  }

  function renderRewardBackdrop(renderer, world, now, accent, theme) {
    const centerX = world.w / 2;
    const centerY = world.h / 2;
    const pulse = 0.5 + Math.sin(now / 240) * 0.5;
    const spots = [
      { x: centerX - 120, y: centerY },
      { x: centerX, y: centerY - 84 },
      { x: centerX + 120, y: centerY }
    ];
    renderer.sprite("fx-warning-target", renderer.layers.floor, centerX, centerY, 3.2, 2.2, accent, 0.08 + pulse * 0.03).zIndex = -1600;
    for (const spot of spots) {
      renderer.sprite("fx-impact-star", renderer.layers.floor, spot.x, spot.y, 0.82, 0.82, accent, 0.22 + pulse * 0.08).zIndex = -1420;
      renderer.ring(spot.x, spot.y, 54, accent, 0.15 + pulse * 0.05, 3);
      renderer.rect(renderer.layers.floor, spot.x, spot.y + 30, 72, 16, theme.side, 0.6).zIndex = -1410;
    }
  }

  function renderBossBackdrop(renderer, world, now, kind, accent, theme, chapter) {
    const x = world.w / 2;
    const y = world.h / 2;
    const pulse = 0.5 + Math.sin(now / 180) * 0.5;
    const scale = kind === "boss" ? 4.1 : 3.0;
    renderer.rect(renderer.layers.floor, x, y, world.w, world.h, "#000000", kind === "boss" ? 0.14 : 0.08).zIndex = -2050;
    renderer.sprite("fx-warning-target", renderer.layers.floor, x, y, scale, scale, accent, 0.09 + pulse * 0.05).zIndex = -1500;
    renderer.sprite(chapter === 3 ? "fx-frost-shards" : "fx-fire-bloom", renderer.layers.floor, x, y, 1.5, 1.1, theme.rune, 0.1 + pulse * 0.04).zIndex = -1490;
    renderer.ring(x, y, kind === "boss" ? 260 : 190, accent, 0.12 + pulse * 0.04, kind === "boss" ? 5 : 4);
    for (let i = 0; i < 8; i += 1) {
      const a = now / 2600 + (Math.PI * 2 * i) / 8;
      const r = kind === "boss" ? 305 : 230;
      renderer.sprite("fx-impact-star", renderer.layers.floor, x + Math.cos(a) * r, y + Math.sin(a) * r, 0.38, 0.38, accent, 0.12).zIndex = -1480;
    }
  }

  function renderEliteBackdrop(renderer, world, now, accent, theme) {
    const pulse = 0.5 + Math.sin(now / 260) * 0.5;
    const centerX = world.w / 2;
    const centerY = world.h / 2;
    renderer.sprite("fx-assassin-mark", renderer.layers.floor, centerX, centerY, 2.5, 1.8, accent, 0.07 + pulse * 0.035).zIndex = -1540;
    for (let i = 0; i < 4; i += 1) {
      const x = i < 2 ? 160 + i * (world.w - 320) : i === 2 ? centerX : centerX;
      const y = i < 2 ? centerY : 150 + (i - 2) * (world.h - 300);
      renderer.sprite("fx-shield-hex", renderer.layers.floor, x, y, 0.75, 0.75, theme.rune, 0.09 + pulse * 0.03).zIndex = -1510;
    }
  }

  function renderDungeon(renderer, world, now, room = {}) {
    if (!world) return;
    const chapter = resolveChapter(room);
    const theme = chapterTheme(chapter, room?.chapterProfile);
    renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, theme.base, 1).zIndex = -2400;
    const tileSize = 96;
    for (let y = tileSize / 2; y < world.h; y += tileSize) {
      for (let x = tileSize / 2; x < world.w; x += tileSize) {
        const variant = Math.floor(renderer.noise(Math.floor(x / tileSize) * 23, Math.floor(y / tileSize) * 31) * 6) % 6;
        const tile = renderer.sprite(`floor-tile-${chapter}-${variant}`, renderer.layers.floor, x, y, tileSize / 64, tileSize / 64, "#ffffff", 0.96);
        tile.zIndex = -2200;
      }
    }
    for (let x = tileSize / 2; x < world.w; x += tileSize) {
      const top = renderer.sprite(`wall-block-${chapter}`, renderer.layers.floor, x, 28, tileSize / 64, 0.9, "#ffffff", 1);
      const bottom = renderer.sprite(`wall-block-${chapter}`, renderer.layers.floor, x, world.h - 26, tileSize / 64, 0.9, "#ffffff", 1);
      top.zIndex = -900;
      bottom.zIndex = world.h + 900;
    }
    for (let y = tileSize / 2; y < world.h; y += tileSize) {
      renderer.rect(renderer.layers.floor, 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
      renderer.rect(renderer.layers.floor, world.w - 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
    }
    renderStageAtmosphere(renderer, world, now, room, theme, chapter);
    for (let i = 0; i < 20; i += 1) {
      const side = i % 4;
      const t = renderer.noise(i * 19, 3);
      const x = side < 2 ? 150 + t * (world.w - 300) : side === 2 ? 58 : world.w - 58;
      const y = side >= 2 ? 150 + t * (world.h - 300) : side === 0 ? 70 : world.h - 70;
      const glow = 0.08 + Math.sin(now / 240 + i) * 0.025;
      renderer.sprite(`torch-${chapter}`, renderer.layers.floor, x, y, 1.25, 1.25, "#ffffff", 0.82).zIndex = y - 12;
      renderer.rect(renderer.layers.floor, x, y - 4, 96, 34, theme.torch, glow).zIndex = y - 20;
    }
    for (let i = 0; i < 44; i += 1) {
      const x = renderer.noise(i * 19, 3) * world.w;
      const y = renderer.noise(i * 31, 9) * world.h;
      const w = 36 + renderer.noise(i, 14) * 82;
      const h = 4 + renderer.noise(i, 18) * 7;
      renderer.rect(renderer.layers.floor, x, y, w, h, i % 3 === 0 ? theme.scarB : theme.scarA, 0.04 + Math.sin(now / 1700 + i) * 0.012);
    }
    if (chapter >= 2) {
      const count = chapter === 2 ? 28 : 36;
      for (let i = 0; i < count; i += 1) {
        const x = renderer.noise(i * 17, chapter * 41) * world.w;
        const y = renderer.noise(i * 29, chapter * 53) * world.h;
        const scale = chapter === 2 ? 0.5 + renderer.noise(i, 5) * 0.35 : 0.34 + renderer.noise(i, 7) * 0.28;
        const key = chapter === 2 ? "fx-poison-cloud" : "fx-frost-shards";
        const tint = chapter === 2 ? "#84cc16" : "#8b5cf6";
        const sprite = renderer.sprite(key, renderer.layers.floor, x, y, scale, scale * 0.62, tint, chapter === 2 ? 0.08 : 0.07);
        sprite.blendMode = "add";
        sprite.zIndex = -1800;
        sprite.rotation = renderer.noise(i, 11) * Math.PI;
      }
    }
  }

  function renderObjective(renderer, objective, now) {
    if (!objective) return;
    if (objective.type === "blockade") {
      renderBlockadeObjective(renderer, objective, now);
      return;
    }
    if (!Number.isFinite(Number(objective.x)) || !Number.isFinite(Number(objective.y))) return;
    const color = objective.type === "defense" ? "#86efac" : "#caa35a";
    const radius = objective.radius || 70;
    if (objective.type === "defense") {
      const pulse = 0.5 + Math.sin(now / 180) * 0.5;
      renderer.sprite("fx-shield-hex", renderer.layers.pickup, objective.x, objective.y, radius / 34, radius / 34, color, 0.78).zIndex = objective.y;
      renderer.sprite("fx-impact-star", renderer.layers.pickup, objective.x, objective.y - 5, 0.58, 0.58, "#f8f3e9", 0.32 + pulse * 0.1).zIndex = objective.y + 2;
      renderer.ring(objective.x, objective.y, radius + 24, color, 0.24 + pulse * 0.08, 3);
    } else {
      renderer.sprite("chest", renderer.layers.pickup, objective.x, objective.y, 1.5, 1.5, color, 0.72).zIndex = objective.y;
      renderer.ring(objective.x, objective.y, radius, color, 0.22 + Math.sin(now / 250) * 0.06, 2);
    }
    if (objective.maxHp > 0) {
      renderer.bar(objective.x, objective.y - radius - 24, 90, 8, objective.hp / objective.maxHp, "#86efac");
    }
  }

  function renderBlockadeObjective(renderer, objective, now) {
    const goalX = finite(objective.goalX, 58);
    const top = finite(objective.laneTop, 140);
    const bottom = finite(objective.laneBottom, 520);
    const midY = (top + bottom) / 2;
    const height = Math.max(160, bottom - top);
    const leakLimit = Math.max(1, objective.leakLimit || 1);
    const safety = clamp01(1 - (objective.leaked || 0) / leakLimit);
    const pulse = 0.5 + Math.sin(now / 150) * 0.5;

    renderer.rect(renderer.layers.pickup, goalX, midY, 22, height + 92, "#7f1d1d", 0.88).zIndex = midY + 8;
    renderer.rect(renderer.layers.pickup, goalX + 18, top - 32, 54, 18, "#ef4444", 0.54 + pulse * 0.12).zIndex = top + 10;
    renderer.rect(renderer.layers.pickup, goalX + 18, bottom + 32, 54, 18, "#ef4444", 0.54 + pulse * 0.12).zIndex = bottom + 10;
    renderer.sprite("fx-warning-target", renderer.layers.pickup, goalX + 32, midY, 0.9, height / 118, "#ef4444", 0.18 + pulse * 0.08).zIndex = midY + 12;
    renderer.bar(goalX + 72, top - 24, 118, 8, safety, safety > 0.35 ? "#facc15" : "#ef4444");
  }

  window.RoguePixiWorld = Object.freeze({
    resolveChapter,
    chapterTheme,
    renderDungeon,
    renderObjective
  });
})();
