(() => {
  function resolveChapter(room) {
    return Math.max(1, Math.min(3, Math.round(Number(room?.chapter || room?.floor || 1))));
  }

  function chapterTheme(chapter, profile = null) {
    const tone = profile?.visualTone;
    if (tone) {
      return {
        base: tone.base || "#05070d",
        side: tone.side || "#08111f",
        torch: tone.torch || "#67e8f9",
        torchSoft: tone.torchSoft || "#f8fafc",
        scarA: tone.scarA || "#67e8f9",
        scarB: tone.scarB || "#ff2d55",
        fog: tone.fog || "#08111f",
        rune: tone.rune || tone.torch || "#67e8f9",
      };
    }
    if (chapter === 2) {
      return {
        base: "#03130f",
        side: "#06211d",
        torch: "#39ff88",
        torchSoft: "#a3ff4f",
        scarA: "#39ff88",
        scarB: "#ffd166",
        fog: "#08251d",
        rune: "#39ff88",
      };
    }
    if (chapter === 3) {
      return {
        base: "#070615",
        side: "#10091f",
        torch: "#b68cff",
        torchSoft: "#55ccff",
        scarA: "#b68cff",
        scarB: "#ff2d55",
        fog: "#10091f",
        rune: "#b68cff",
      };
    }
    return {
      base: "#070503",
      side: "#19110a",
      torch: "#f97316",
      torchSoft: "#ffd166",
      scarA: "#9a6b36",
      scarB: "#3f2f24",
      fog: "#050302",
      rune: "#c08438",
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
    if (kind === "boss") return "#ff2d55";
    if (kind === "miniboss") return "#ff7a3d";
    if (kind === "elite") return "#ffd166";
    if (kind === "defense") return "#39ff88";
    if (kind === "blockade") return "#ff2d55";
    if (kind === "reward") return "#ffd166";
    if (kind === "random") return "#55ccff";
    return theme.rune || theme.torch;
  }

  function renderStageAtmosphere(renderer, world, now, room, theme, chapter) {
    const kind = resolveStageKind(room);
    const objective = room?.objective || null;
    const accent = stageAccent(kind, theme);
    const pulse = 0.5 + Math.sin(now / 420) * 0.5;

    renderer.rect(renderer.layers.floor, world.w / 2, 22, world.w, 44, theme.fog, 0.3).zIndex = -2100;
    renderer.rect(renderer.layers.floor, world.w / 2, world.h - 22, world.w, 44, theme.fog, 0.32).zIndex = -2100;
    renderer.rect(renderer.layers.floor, 22, world.h / 2, 44, world.h, theme.fog, 0.28).zIndex = -2100;
    renderer.rect(renderer.layers.floor, world.w - 22, world.h / 2, 44, world.h, theme.fog, 0.28).zIndex = -2100;

    if (kind === "blockade" || objective?.type === "blockade") return renderBlockadeBackdrop(renderer, world, now, objective, accent);
    if (kind === "defense" || objective?.type === "defense") return renderDefenseBackdrop(renderer, world, now, objective, accent, theme);
    if (kind === "reward" || objective?.type === "reward") return renderRewardBackdrop(renderer, world, now, accent, theme);
    if (kind === "boss" || kind === "miniboss") return renderBossBackdrop(renderer, world, now, kind, accent, theme, chapter);
    if (kind === "elite") return renderEliteBackdrop(renderer, world, now, accent, theme);

    return renderTraitBackdrop(renderer, world, now, room?.waveTrait?.id || "", theme, pulse);
  }

  function renderTraitBackdrop(renderer, world, now, traitId, theme, pulse) {
    const color = traitId === "volatile" ? "#ff7a3d" : traitId === "ritual" ? "#39ff88" : traitId === "bulwark" ? "#67e8f9" : theme.rune;
    const count = traitId === "horde" ? 8 : traitId ? 6 : 4;
    for (let i = 0; i < count; i += 1) {
      const x = world.w * (0.14 + ((i * 0.17) % 0.74));
      const y = world.h * (0.2 + ((i * 0.29) % 0.58));
      renderer.drawGfxRuneRing(x, y, 42 + (i % 3) * 18, color, 0.05 + pulse * 0.025, -1600 + i, now / (900 + i * 50), 7 + (i % 4));
    }
  }

  function renderBlockadeBackdrop(renderer, world, now, objective, accent) {
    const laneTop = finite(objective?.laneTop, world.h * 0.23);
    const laneBottom = finite(objective?.laneBottom, world.h * 0.77);
    const goalX = finite(objective?.goalX, 58);
    const laneH = Math.max(160, laneBottom - laneTop);
    const midY = (laneTop + laneBottom) / 2;
    const pulse = 0.5 + Math.sin(now / 170) * 0.5;

    renderer.rect(renderer.layers.floor, world.w / 2, midY, world.w, laneH + 36, "#170613", 0.44).zIndex = -1950;
    renderer.rect(renderer.layers.floor, goalX - 28, midY, 42, laneH + 126, "#ff2d55", 0.18 + pulse * 0.08).zIndex = -1550;
    for (let i = 0; i < 8; i += 1) {
      renderer.rect(renderer.layers.floor, goalX - 62 - i * 18, midY, 10, laneH + 108, "#ff2d55", 0.14 - i * 0.012).zIndex = -1560 + i;
    }
    renderer.rect(renderer.layers.floor, world.w / 2, laneTop, world.w, 5, accent, 0.3 + pulse * 0.08).zIndex = -1500;
    renderer.rect(renderer.layers.floor, world.w / 2, laneBottom, world.w, 5, accent, 0.3 + pulse * 0.08).zIndex = -1500;

    const laneCount = Math.max(3, Math.round(objective?.laneCount || 4));
    for (let i = 0; i < laneCount; i += 1) {
      const y = laneTop + ((i + 0.5) / laneCount) * laneH;
      renderer.rect(renderer.layers.floor, world.w / 2, y, world.w, 2, "#fda4af", 0.08).zIndex = -1510;
      for (let j = 0; j < 5; j += 1) {
        const x = world.w - 160 - j * 220 + ((now / 38 + i * 37) % 190);
        renderer.drawGfxLine(x + 18, y, x - 18, y, 4, "#ff2d55", 0.14 + pulse * 0.04, -1490 + i * 3 + j, "add");
      }
    }
  }

  function renderDefenseBackdrop(renderer, world, now, objective, accent, theme) {
    const x = finite(objective?.x, world.w / 2);
    const y = finite(objective?.y, world.h / 2);
    const radius = Math.max(80, finite(objective?.radius, 42) * 2.35);
    const pulse = 0.5 + Math.sin(now / 210) * 0.5;
    renderer.drawGfxCircle(x, y, radius, "#052e16", 0.08, accent, 0.18 + pulse * 0.04, 5, -1450, "add", 36);
    renderer.drawGfxRuneRing(x, y, radius * 0.62, theme.torchSoft, 0.14 + pulse * 0.04, -1430, now / 700, 10);
    for (let i = 0; i < 4; i += 1) {
      const a = now / 1900 + i * Math.PI * 0.5;
      const sx = x + Math.cos(a) * radius * 0.82;
      const sy = y + Math.sin(a) * radius * 0.82;
      renderer.drawGfxDiamond(sx, sy, 9, accent, 0.18, -1420 + i, a);
    }
  }

  function renderRewardBackdrop(renderer, world, now, accent, theme) {
    const centerX = world.w / 2;
    const centerY = world.h / 2;
    const pulse = 0.5 + Math.sin(now / 240) * 0.5;
    const spots = [
      { x: centerX - 120, y: centerY },
      { x: centerX, y: centerY - 84 },
      { x: centerX + 120, y: centerY },
    ];
    renderer.drawGfxRuneRing(centerX, centerY, 210, accent, 0.08 + pulse * 0.03, -1600, now / 900, 12);
    for (const spot of spots) {
      renderer.drawGfxImpactBurst(spot.x, spot.y, 42, accent, 0.16 + pulse * 0.04, -1420, now / 400, 8);
      renderer.drawGfxCircle(spot.x, spot.y, 54, theme.side, 0.1, accent, 0.18 + pulse * 0.05, 3, -1410, "add", 22);
    }
  }

  function renderBossBackdrop(renderer, world, now, kind, accent, theme, chapter) {
    const x = world.w / 2;
    const y = world.h / 2;
    const pulse = 0.5 + Math.sin(now / 180) * 0.5;
    renderer.rect(renderer.layers.floor, x, y, world.w, world.h, "#000000", kind === "boss" ? 0.28 : 0.18).zIndex = -2050;
    renderer.drawGfxRuneRing(x, y, kind === "boss" ? 280 : 210, accent, 0.16 + pulse * 0.04, -1500, now / 780, kind === "boss" ? 16 : 12);
    renderer.drawGfxCircle(x, y, kind === "boss" ? 180 : 130, "#180616", 0.08, theme.rune, 0.1 + pulse * 0.04, 6, -1490, "add", 40);
    for (let i = 0; i < 10; i += 1) {
      const a = now / 2600 + (Math.PI * 2 * i) / 10;
      const r = kind === "boss" ? 320 : 235;
      renderer.drawGfxDiamond(x + Math.cos(a) * r, y + Math.sin(a) * r, chapter === 3 ? 10 : 7, accent, 0.14, -1480 + i, a);
    }
  }

  function renderEliteBackdrop(renderer, world, now, accent, theme) {
    const pulse = 0.5 + Math.sin(now / 260) * 0.5;
    const centerX = world.w / 2;
    const centerY = world.h / 2;
    renderer.drawGfxRuneRing(centerX, centerY, 210, accent, 0.1 + pulse * 0.04, -1540, now / 650, 9);
    for (let i = 0; i < 4; i += 1) {
      const x = i < 2 ? 160 + i * (world.w - 320) : centerX;
      const y = i < 2 ? centerY : 150 + (i - 2) * (world.h - 300);
      renderer.drawGfxDiamond(x, y, 18, theme.rune, 0.11 + pulse * 0.03, -1510 + i, now / 900 + i);
    }
  }

  function mapWallStyle(chapter, wall, theme) {
    const kind = String(wall?.kind || "");
    if (chapter === 2 || kind.includes("moss") || kind.includes("root")) {
      return {
        fill: kind.includes("root") ? "#102417" : "#17251a",
        top: "#36513a",
        edge: "#8bd17c",
        shadow: "#03100a",
        crack: "#6ee7b7",
      };
    }
    if (chapter === 3 || kind.includes("void") || kind.includes("rift")) {
      return {
        fill: "#12101f",
        top: "#2a2140",
        edge: "#b68cff",
        shadow: "#05030d",
        crack: "#55ccff",
      };
    }
    return {
      fill: "#21170e",
      top: "#4a3320",
      edge: theme.torchSoft || "#facc15",
      shadow: "#080503",
      crack: "#9a6b36",
    };
  }

  function renderChapterAmbience(renderer, world, now, theme, chapter, walls) {
    if (chapter === 1) {
      renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, "#020100", 0.38).zIndex = -2185;
      const staticTorches = [
        { x: 94, y: 116 },
        { x: world.w - 94, y: 128 },
        { x: 112, y: world.h - 128 },
        { x: world.w - 118, y: world.h - 132 },
      ];
      const wallTorches = (walls || []).slice(0, 5).map((wall, index) => ({
        x: wall.x + (index % 2 === 0 ? -wall.w / 2 - 28 : wall.w / 2 + 28),
        y: wall.y + (index % 3 - 1) * 18,
      }));
      [...staticTorches, ...wallTorches].forEach((torch, index) => renderTorchPocket(renderer, torch.x, torch.y, now, theme, index));
      return;
    }

    if (chapter === 2) {
      renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, "#02110a", 0.18).zIndex = -2185;
      for (let i = 0; i < 24; i += 1) {
        const x = renderer.noise(i * 17, 41) * world.w;
        const y = renderer.noise(i * 29, 53) * world.h;
        const r = 18 + renderer.noise(i, 7) * 38;
        renderer.drawGfxCircle(x, y, r, "#39ff88", 0.025, "#a3ff4f", 0.025, 2, -1800 + i, "add", 18);
      }
      return;
    }

    renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, "#02010a", 0.24).zIndex = -2185;
    for (let i = 0; i < 12; i += 1) {
      const x = renderer.noise(i * 37, 81) * world.w;
      const y = renderer.noise(i * 23, 17) * world.h;
      const length = 80 + renderer.noise(i, 33) * 170;
      const angle = renderer.noise(i, 47) * Math.PI;
      renderer.drawGfxLine(
        x - Math.cos(angle) * length * 0.5,
        y - Math.sin(angle) * length * 0.5,
        x + Math.cos(angle) * length * 0.5,
        y + Math.sin(angle) * length * 0.5,
        3,
        i % 2 === 0 ? "#b68cff" : "#55ccff",
        0.08 + Math.sin(now / 900 + i) * 0.025,
        -1760 + i,
        "add",
      );
    }
  }

  function renderTorchPocket(renderer, x, y, now, theme, index) {
    const flicker = 0.65 + Math.sin(now / 150 + index * 1.7) * 0.18;
    renderer.drawGfxCircle(x, y, 156, theme.torch, 0.045 * flicker, theme.torchSoft, 0.035 * flicker, 2, -1710 + index, "add", 28);
    renderer.drawGfxCircle(x, y, 78, theme.torch, 0.07 * flicker, theme.torchSoft, 0.05 * flicker, 2, -1700 + index, "add", 24);
    renderer.rect(renderer.layers.floor, x, y + 3, 18, 24, "#2a1608", 0.7).zIndex = y - 10;
    renderer.drawGfxDiamond(x, y - 10, 8, theme.torchSoft, 0.32 * flicker, y - 8, now / 500 + index);
  }

  function renderMapWalls(renderer, walls, theme, chapter, now) {
    if (!Array.isArray(walls) || walls.length === 0) return;
    for (let index = 0; index < walls.length; index += 1) {
      const wall = walls[index];
      const x = finite(wall?.x, 0);
      const y = finite(wall?.y, 0);
      const w = Math.max(8, finite(wall?.w, 8));
      const h = Math.max(8, finite(wall?.h, 8));
      const style = mapWallStyle(chapter, wall, theme);
      const wallLayer = renderer.layers.actor || renderer.layers.hazard || renderer.layers.floor;
      const z = y + h / 2 - 12;

      renderer.rect(wallLayer, x, y, w, h, style.fill, 0.98).zIndex = z;
      renderer.rect(wallLayer, x, y - h / 2 + 5, w * 0.96, 9, style.top, 0.62).zIndex = z + 1;
      renderer.rect(wallLayer, x, y + h / 2 - 6, w * 0.96, 10, style.shadow, 0.44).zIndex = z + 2;
      renderer.rect(wallLayer, x - w / 2 + 5, y, 9, h * 0.86, style.shadow, 0.36).zIndex = z + 3;
      renderer.rect(wallLayer, x + w / 2 - 5, y, 9, h * 0.86, style.top, 0.24).zIndex = z + 3;

      for (let i = 0; i < 4; i += 1) {
        const t = renderer.noise(index * 31 + i * 7, 12);
        const sx = x - w * 0.34 + t * w * 0.68;
        const sy = y - h * 0.28 + renderer.noise(index * 17 + i * 13, 19) * h * 0.56;
        const len = 18 + renderer.noise(index * 11 + i, 25) * 34;
        const angle = (renderer.noise(index * 29 + i, 31) - 0.5) * 1.2;
        renderer.drawGfxLine(sx, sy, sx + Math.cos(angle) * len, sy + Math.sin(angle) * len, 2, style.crack, 0.18, z + 6 + i, "normal");
      }

      if (chapter === 2) {
        renderer.drawGfxLine(x - w * 0.42, y - h * 0.18, x + w * 0.38, y + h * 0.14, 4, "#39ff88", 0.12, z + 8, "add");
        renderer.drawGfxCircle(x + w * 0.28, y - h * 0.2, Math.min(24, Math.max(10, h * 0.32)), "#84cc16", 0.06, "#bef264", 0.08, 2, z + 9, "add", 18);
      } else if (chapter === 3) {
        renderer.drawGfxLine(x - w * 0.45, y, x + w * 0.45, y, 3, style.edge, 0.16 + Math.sin(now / 360 + index) * 0.04, z + 8, "add");
        renderer.drawGfxDiamond(x, y, Math.min(18, Math.max(8, h * 0.24)), style.edge, 0.12, z + 9, now / 800 + index);
      } else {
        renderer.rect(wallLayer, x, y - h / 2 - 6, Math.min(w * 0.72, 150), 8, style.edge, 0.16).zIndex = z + 8;
      }
    }
  }

  function renderDungeon(renderer, world, now, room = {}) {
    if (!world) return;
    const chapter = resolveChapter(room);
    const theme = chapterTheme(chapter, room?.chapterProfile);
    const walls = Array.isArray(room?.mapWalls) ? room.mapWalls : [];
    renderer.rect(renderer.layers.floor, world.w / 2, world.h / 2, world.w, world.h, theme.base, 1).zIndex = -2400;

    const major = 160;
    const minor = 80;
    for (let x = 0; x <= world.w; x += minor) {
      const alpha = x % major === 0 ? 0.11 : 0.045;
      renderer.rect(renderer.layers.floor, x, world.h / 2, 2, world.h, theme.rune, alpha).zIndex = -2220;
    }
    for (let y = 0; y <= world.h; y += minor) {
      const alpha = y % major === 0 ? 0.11 : 0.045;
      renderer.rect(renderer.layers.floor, world.w / 2, y, world.w, 2, theme.rune, alpha).zIndex = -2220;
    }

    renderer.rect(renderer.layers.floor, world.w / 2, 18, world.w, 36, theme.side, 0.92).zIndex = -900;
    renderer.rect(renderer.layers.floor, world.w / 2, world.h - 18, world.w, 36, theme.side, 0.92).zIndex = world.h + 900;
    renderer.rect(renderer.layers.floor, 18, world.h / 2, 36, world.h, theme.side, 0.92).zIndex = -880;
    renderer.rect(renderer.layers.floor, world.w - 18, world.h / 2, 36, world.h, theme.side, 0.92).zIndex = -880;

    renderStageAtmosphere(renderer, world, now, room, theme, chapter);
    renderChapterAmbience(renderer, world, now, theme, chapter, walls);
    renderMapWalls(renderer, walls, theme, chapter, now);

    for (let i = 0; i < 24; i += 1) {
      const side = i % 4;
      const t = renderer.noise(i * 19, 3);
      const x = side < 2 ? 150 + t * (world.w - 300) : side === 2 ? 58 : world.w - 58;
      const y = side >= 2 ? 150 + t * (world.h - 300) : side === 0 ? 70 : world.h - 70;
      const glow = 0.08 + Math.sin(now / 240 + i) * 0.025;
      renderer.rect(renderer.layers.floor, x, y, 92, 20, theme.torch, glow).zIndex = y - 20;
      renderer.drawGfxDiamond(x, y, 9, theme.torchSoft, 0.18 + glow, y - 12, now / 800 + i);
    }

    for (let i = 0; i < 56; i += 1) {
      const x = renderer.noise(i * 19, 3) * world.w;
      const y = renderer.noise(i * 31, 9) * world.h;
      const w = 36 + renderer.noise(i, 14) * 82;
      const h = 3 + renderer.noise(i, 18) * 6;
      renderer.rect(renderer.layers.floor, x, y, w, h, i % 3 === 0 ? theme.scarB : theme.scarA, 0.035 + Math.sin(now / 1700 + i) * 0.01).zIndex = -2000 + i;
    }
  }

  function renderObjective(renderer, objective, now) {
    if (!objective) return;
    if (objective.type === "blockade") {
      renderBlockadeObjective(renderer, objective, now);
      return;
    }
    if (!Number.isFinite(Number(objective.x)) || !Number.isFinite(Number(objective.y))) return;
    const color = objective.type === "defense" ? "#39ff88" : "#ffd166";
    const radius = objective.radius || 70;
    const pulse = 0.5 + Math.sin(now / 180) * 0.5;
    if (objective.type === "defense") {
      renderer.drawGfxCircle(objective.x, objective.y, radius, "#052e16", 0.18, color, 0.62, 5, objective.y, "add", 26);
      renderer.drawGfxRuneRing(objective.x, objective.y, radius + 24, color, 0.32 + pulse * 0.08, objective.y + 4, now / 640, 10);
    } else {
      renderer.drawGfxDiamond(objective.x, objective.y, radius * 0.42, color, 0.6, objective.y, now / 900, "#f8fafc");
      renderer.drawGfxCircle(objective.x, objective.y, radius, "#000000", 0, color, 0.22 + Math.sin(now / 250) * 0.06, 2, objective.y + 2, "add", 24);
    }
    if (objective.maxHp > 0) {
      renderer.bar(objective.x, objective.y - radius - 24, 90, 8, objective.hp / objective.maxHp, "#39ff88");
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

    renderer.rect(renderer.layers.pickup, goalX, midY, 24, height + 92, "#7f1d1d", 0.88).zIndex = midY + 8;
    renderer.rect(renderer.layers.pickup, goalX + 18, top - 32, 58, 18, "#ff2d55", 0.54 + pulse * 0.12).zIndex = top + 10;
    renderer.rect(renderer.layers.pickup, goalX + 18, bottom + 32, 58, 18, "#ff2d55", 0.54 + pulse * 0.12).zIndex = bottom + 10;
    renderer.drawGfxLine(goalX + 32, top - 22, goalX + 32, bottom + 22, 9, "#ff2d55", 0.2 + pulse * 0.08, midY + 12, "add");
    renderer.bar(goalX + 72, top - 24, 118, 8, safety, safety > 0.35 ? "#ffd166" : "#ff2d55");
  }

  window.RoguePixiWorld = Object.freeze({
    resolveChapter,
    chapterTheme,
    renderDungeon,
    renderObjective,
  });
})();
