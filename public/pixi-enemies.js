(() => {
  const ENEMY_NEON = Object.freeze({
    slime: { color: "#7cff6b", dark: "#071d0b", shape: "blob" },
    bat: { color: "#a78bfa", dark: "#140d24", shape: "wing" },
    brute: { color: "#ff9f1c", dark: "#251307", shape: "block" },
    guardian: { color: "#67e8f9", dark: "#071a24", shape: "shield" },
    shaman: { color: "#86efac", dark: "#082014", shape: "cross" },
    spitter: { color: "#bef264", dark: "#172107", shape: "spit" },
    bomber: { color: "#fb7185", dark: "#2b0710", shape: "bomb" },
    charger: { color: "#facc15", dark: "#251b05", shape: "arrow" },
    stalker: { color: "#c084fc", dark: "#160b24", shape: "blade" },
    sniper: { color: "#f87171", dark: "#250909", shape: "scope" },
    mortar: { color: "#f97316", dark: "#260f05", shape: "mortar" },
    splitter: { color: "#5eead4", dark: "#06211d", shape: "split" },
    mini_boss: { color: "#f97316", dark: "#220b04", shape: "boss" },
    gatekeeper: { color: "#facc15", dark: "#1f1705", shape: "boss" },
    boss: { color: "#ff2d55", dark: "#250610", shape: "boss" },
    training_dummy: { color: "#94a3b8", dark: "#111827", shape: "dummy" },
  });

  const STATUS_MARKERS = Object.freeze([
    { id: "freeze", label: "F", color: "#bfdbfe" },
    { id: "slow", label: "S", color: "#8aa8bd" },
    { id: "poison", label: "P", color: "#bef264" },
    { id: "venom", label: "v", color: "#c084fc" },
    { id: "burn", label: "B", color: "#fb923c" },
    { id: "vulnerable", label: "V", color: "#facc15" },
    { id: "marked", label: "M", color: "#c4b5fd" },
    { id: "threaded", label: "L", color: "#d8b4fe" },
    { id: "taunt", label: "T", color: "#e8794f" },
    { id: "barrier", label: "G", color: "#93c5fd" },
  ]);
  const ENEMY_DANGER = "#ff2d55";
  const ENEMY_DANGER_DARK = "#2b0710";

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

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function enemyDirectionAngle(enemy, pos, last, face) {
    const explicitAngle =
      finiteNumber(enemy.windup?.angle) ??
      finiteNumber(enemy.chargeMove?.angle) ??
      finiteNumber(enemy.facing);
    if (explicitAngle !== null) return explicitAngle;

    const windupTargetX = finiteNumber(enemy.windup?.x);
    const windupTargetY = finiteNumber(enemy.windup?.y);
    if (windupTargetX !== null && windupTargetY !== null) {
      const fromX = finiteNumber(enemy.windup?.startX) ?? pos.x;
      const fromY = finiteNumber(enemy.windup?.startY) ?? pos.y;
      return Math.atan2(windupTargetY - fromY, windupTargetX - fromX);
    }

    const chargeToX = finiteNumber(enemy.chargeMove?.toX);
    const chargeToY = finiteNumber(enemy.chargeMove?.toY);
    if (chargeToX !== null && chargeToY !== null) {
      const fromX = finiteNumber(enemy.chargeMove?.fromX) ?? pos.x;
      const fromY = finiteNumber(enemy.chargeMove?.fromY) ?? pos.y;
      return Math.atan2(chargeToY - fromY, chargeToX - fromX);
    }

    const dx = pos.x - last.x;
    const dy = pos.y - last.y;
    if (Math.hypot(dx, dy) > 0.2) return Math.atan2(dy, dx);
    return face >= 0 ? 0 : Math.PI;
  }

  function enemyTextureKey(renderer, enemy, now) {
    return `neon:${enemy?.type || "slime"}:${enemyFrame(enemy || {}, now)}`;
  }

  function enemyScale(enemy) {
    return Math.max(0.72, (enemy.radius || 18) / 18);
  }

  function metaFor(enemy) {
    return ENEMY_NEON[enemy?.role] || ENEMY_NEON[enemy?.type] || ENEMY_NEON.slime;
  }

  function typeColor(enemy) {
    return enemy.color || metaFor(enemy).color;
  }

  function eliteAffixColor(affix, fallback = "#facc15") {
    if (affix === "venom") return "#bef264";
    if (affix === "volatile") return "#fb7185";
    if (affix === "frenzy") return "#fb923c";
    if (affix === "bulwark") return "#93c5fd";
    return fallback;
  }

  function polygon(x, y, radius, sides, rotation = 0) {
    const points = [];
    for (let i = 0; i < sides; i += 1) {
      const a = rotation + (Math.PI * 2 * i) / sides;
      points.push({ x: x + Math.cos(a) * radius, y: y + Math.sin(a) * radius });
    }
    return points;
  }

  function enemyStatusEffects(enemy) {
    return new Set(Array.isArray(enemy?.statusEffects) ? enemy.statusEffects : []);
  }

  function enemyStatusActive(enemy, effects, id) {
    if (id === "freeze") return effects.has("freeze") || effects.has("frozen");
    if (id === "barrier") return effects.has("barrier") || Number(enemy?.barrier || 0) > 0;
    return effects.has(id);
  }

  function poisonStackCount(enemy) {
    return Math.max(0, Math.min(3, Math.floor(Number(enemy?.poisonStacks || 0))));
  }

  function enemyStatusMarkerLabel(enemy, marker) {
    if (marker.id !== "poison") return marker.label;
    const stacks = poisonStackCount(enemy);
    return stacks > 0 ? `P${stacks}` : marker.label;
  }

  function enemyStatusMarkers(enemy) {
    const effects = enemyStatusEffects(enemy);
    const markers = [];
    for (const marker of STATUS_MARKERS) {
      if (enemyStatusActive(enemy, effects, marker.id)) markers.push(marker);
    }
    return markers;
  }

  function enemyWindupProgress(windup) {
    const duration = Math.max(0.1, Number(windup?.duration || windup?.time || 1));
    return 1 - Math.max(0, Math.min(1, Number(windup?.time || 0) / duration));
  }

  function isEnemyLineWindupKind(kind) {
    return (
      kind === "charge" ||
      kind === "snipe" ||
      kind === "spit" ||
      kind === "boss_volley" ||
      kind === "stalker_shuriken" ||
      kind === "elite_volley" ||
      kind === "elite_quake" ||
      kind === "elite_crossfire"
    );
  }

  function drawEnemyCastAura(renderer, enemy, pos, radius, now, z) {
    if (!enemy?.windup || isEnemyLineWindupKind(enemy.windup.kind) || !renderer.drawGfxCircle) return;
    const progress = enemyWindupProgress(enemy.windup);
    const pulse = 0.5 + Math.sin(now / 95) * 0.5;
    const ringRadius = radius * (1.2 + progress * 0.12 + pulse * 0.04);
    const alpha = 0.26 + progress * 0.2;

    renderer.drawGfxCircle(pos.x, pos.y, ringRadius, ENEMY_DANGER_DARK, 0.045 + progress * 0.035, ENEMY_DANGER, alpha, 3, z, "add", 24);
    renderer.drawGfxLine?.(pos.x - radius * 0.52, pos.y, pos.x + radius * 0.52, pos.y, 3, ENEMY_DANGER, 0.28 + progress * 0.34, z + 1, "add");
    renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.52, pos.x, pos.y + radius * 0.52, 3, ENEMY_DANGER, 0.24 + progress * 0.3, z + 2, "add");
  }

  function clipEnemyDangerLineToWorld(fromX, fromY, toX, toY, lineWidth, world) {
    const worldWidth = Number(world?.w);
    const worldHeight = Number(world?.h);
    if (!Number.isFinite(worldWidth) || !Number.isFinite(worldHeight) || worldWidth <= 0 || worldHeight <= 0) {
      return { fromX, fromY, toX, toY };
    }

    const inset = Math.max(0, lineWidth * 0.5 + 1);
    const minX = Math.min(inset, worldWidth * 0.5);
    const maxX = Math.max(minX, worldWidth - inset);
    const minY = Math.min(inset, worldHeight * 0.5);
    const maxY = Math.max(minY, worldHeight - inset);
    const clippedFromX = Math.max(minX, Math.min(maxX, fromX));
    const clippedFromY = Math.max(minY, Math.min(maxY, fromY));
    const dx = toX - clippedFromX;
    const dy = toY - clippedFromY;
    let scale = 1;
    if (dx > 0) scale = Math.min(scale, (maxX - clippedFromX) / dx);
    else if (dx < 0) scale = Math.min(scale, (minX - clippedFromX) / dx);
    if (dy > 0) scale = Math.min(scale, (maxY - clippedFromY) / dy);
    else if (dy < 0) scale = Math.min(scale, (minY - clippedFromY) / dy);
    scale = Math.max(0, Math.min(1, scale));
    return {
      fromX: clippedFromX,
      fromY: clippedFromY,
      toX: clippedFromX + dx * scale,
      toY: clippedFromY + dy * scale,
    };
  }

  function drawEnemyDangerLine(renderer, fromX, fromY, toX, toY, width, progress, z, world) {
    const line = clipEnemyDangerLineToWorld(fromX, fromY, toX, toY, width, world);
    const length = Math.hypot(line.toX - line.fromX, line.toY - line.fromY);
    if (!renderer.drawGfxLine || length < 1) return;

    renderer.drawGfxLine(line.fromX, line.fromY, line.toX, line.toY, width, ENEMY_DANGER, 0.14 + progress * 0.2, z, "add");
  }

  function drawEnemyWindupTelegraph(renderer, enemy, pos, now, z, world) {
    const windup = enemy?.windup;
    if (!windup) return;
    const kind = windup.kind;
    const progress = enemyWindupProgress(windup);
    const radius = Math.max(12, Number(enemy.radius || 18));

    if (kind === "charge" || kind === "snipe" || kind === "spit") {
      const fromX = kind === "charge" && Number.isFinite(windup.startX) ? windup.startX : pos.x;
      const fromY = kind === "charge" && Number.isFinite(windup.startY) ? windup.startY : pos.y;
      const targetX = Number.isFinite(windup.x) ? windup.x : pos.x + Math.cos(Number(windup.angle || 0)) * 420;
      const targetY = Number.isFinite(windup.y) ? windup.y : pos.y + Math.sin(Number(windup.angle || 0)) * 420;
      const dx = targetX - fromX;
      const dy = targetY - fromY;
      const length = Math.hypot(dx, dy) || 1;
      const extend = kind === "snipe" ? Math.max(220, radius * 7) : kind === "spit" ? radius * 1.35 : 0;
      const toX = targetX + (dx / length) * extend;
      const toY = targetY + (dy / length) * extend;
      const width = kind === "snipe" ? 22 : kind === "spit" ? Math.max(12, radius * 0.95) : Math.max(20, radius * 1.35);
      drawEnemyDangerLine(renderer, fromX, fromY, toX, toY, width, progress, z, world);
      return;
    }

    if (kind === "elite_quake") {
      const dirX = Number.isFinite(windup.dirX) ? windup.dirX : Math.cos(Number(windup.angle || 0));
      const dirY = Number.isFinite(windup.dirY) ? windup.dirY : Math.sin(Number(windup.angle || 0));
      const length = Math.max(120, Number(windup.radius || windup.range || 250));
      const width = Math.max(18, Number(windup.width || 64));
      drawEnemyDangerLine(renderer, pos.x, pos.y, pos.x + dirX * length, pos.y + dirY * length, width, progress, z, world);
      return;
    }

    if (kind === "elite_crossfire" && Array.isArray(windup.points)) {
      const length = Math.max(520, Number(windup.range || 900));
      for (const point of windup.points) {
        const angle = Number.isFinite(point.angle) ? point.angle : Math.atan2(Number(point.y || pos.y) - pos.y, Number(point.x || pos.x) - pos.x);
        drawEnemyDangerLine(renderer, pos.x, pos.y, pos.x + Math.cos(angle) * length, pos.y + Math.sin(angle) * length, 20, progress, z, world);
      }
      return;
    }

    if (kind === "stalker_shuriken" || kind === "elite_volley" || kind === "boss_volley") {
      const angle = Number.isFinite(windup.angle)
        ? windup.angle
        : Math.atan2(Number(windup.y || pos.y) - pos.y, Number(windup.x || pos.x) - pos.x);
      const spread = Math.max(0.16, Number(windup.spread || 0.34));
      const range = Math.max(320, Number(windup.range || 620));
      for (const offset of [-spread, 0, spread]) {
        const lane = angle + offset;
        drawEnemyDangerLine(renderer, pos.x, pos.y, pos.x + Math.cos(lane) * range, pos.y + Math.sin(lane) * range, offset === 0 ? 18 : 12, progress, z, world);
      }
    }
  }

  function drawEnemyStatusGraphics(renderer, enemy, pos, now, z) {
    if (!renderer.drawGfxCircle) return;
    const effects = enemyStatusEffects(enemy);
    if (!effects.size && !(Number(enemy?.barrier || 0) > 0)) return;

    const radius = Math.max(10, Number(enemy.radius || 18));
    const phase = now / 360 + (renderer.hash?.(enemy.id) || 0) * 0.2;
    const pulse = 0.5 + Math.sin(phase * 2.2) * 0.5;
    const baseZ = z + 38;

    if (enemyStatusActive(enemy, effects, "slow")) {
      renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.98 + pulse * 0.08), Math.PI * 0.1, Math.PI * 0.92, 4, "#8aa8bd", 0.34, baseZ, "add", 12);
      renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.72 + pulse * 0.06), Math.PI * 1.08, Math.PI * 1.9, 3, "#dbeafe", 0.2, baseZ + 1, "add", 12);
    }

    if (enemyStatusActive(enemy, effects, "freeze")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 1.05, "#dbeafe", 0.06, "#93c5fd", 0.52, 3, baseZ + 5, "add", 24);
      for (let i = 0; i < 5; i += 1) {
        const a = phase + (Math.PI * 2 * i) / 5;
        const inner = radius * (0.16 + (i % 2) * 0.08);
        const outer = radius * (0.72 + (i % 3) * 0.1);
        renderer.drawGfxLine?.(pos.x + Math.cos(a) * inner, pos.y + Math.sin(a) * inner, pos.x + Math.cos(a) * outer, pos.y + Math.sin(a) * outer, 2.5, i % 2 ? "#bfdbfe" : "#f8fafc", 0.46, baseZ + 7 + i, "add");
      }
    }

    if (enemyStatusActive(enemy, effects, "poison")) {
      const stacks = Math.max(1, poisonStackCount(enemy));
      renderer.drawGfxCircle(pos.x, pos.y + radius * 0.18, radius * 1.08, "#365314", 0.08, "#bef264", 0.18, 2, baseZ + 3, "add", 18);
      for (let i = 0; i < 4; i += 1) {
        const a = phase * 1.3 + (Math.PI * 2 * i) / 4;
        const d = radius * (0.44 + (i % 2) * 0.28);
        const bubble = radius * (0.12 + (i % 3) * 0.035);
        renderer.drawGfxCircle(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d * 0.7, bubble, "#bef264", 0.18, "#ecfccb", 0.24, 1, baseZ + 12 + i, "add", 10);
      }
      for (let i = 0; i < stacks; i += 1) {
        const offset = (i - (stacks - 1) / 2) * radius * 0.3;
        renderer.drawGfxCircle(pos.x + offset, pos.y - radius * 1.12, radius * 0.12, "#bef264", 0.72, "#ecfccb", 0.58, 1, baseZ + 18 + i, "add", 10);
      }
    }

    if (enemyStatusActive(enemy, effects, "burn")) {
      for (let i = 0; i < 4; i += 1) {
        const side = i % 2 ? 1 : -1;
        const x = pos.x + side * radius * (0.32 + i * 0.04);
        const y = pos.y - radius * (0.45 - i * 0.08);
        const height = radius * (0.44 + pulse * 0.12);
        renderer.drawGfxLine?.(x, y + height * 0.34, x + side * radius * 0.08, y - height * 0.54, 5 - i * 0.45, i % 2 ? "#fdba74" : "#f97316", 0.48, baseZ + 14 + i, "add");
        renderer.drawGfxCircle(x, y - height * 0.28, radius * 0.13, "#f97316", 0.22, "#fed7aa", 0.28, 1, baseZ + 18 + i, "add", 8);
      }
    }

    if (enemyStatusActive(enemy, effects, "vulnerable")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 1.26, "#000000", 0, "#facc15", 0.38, 2, baseZ + 20, "add", 26);
      for (let i = 0; i < 4; i += 1) {
        const a = phase * 0.25 + (Math.PI * 2 * i) / 4;
        renderer.drawGfxLine?.(pos.x + Math.cos(a) * radius * 0.98, pos.y + Math.sin(a) * radius * 0.98, pos.x + Math.cos(a) * radius * 1.32, pos.y + Math.sin(a) * radius * 1.32, 3, "#fde68a", 0.5, baseZ + 22 + i, "add");
      }
    }

    if (enemyStatusActive(enemy, effects, "marked")) {
      renderer.drawGfxLine?.(pos.x - radius * 0.48, pos.y - radius * 0.48, pos.x + radius * 0.48, pos.y + radius * 0.48, 4, "#c4b5fd", 0.62, baseZ + 28, "add");
      renderer.drawGfxLine?.(pos.x + radius * 0.48, pos.y - radius * 0.48, pos.x - radius * 0.48, pos.y + radius * 0.48, 4, "#f5d0fe", 0.46, baseZ + 29, "add");
      renderer.drawGfxDiamond?.(pos.x, pos.y, radius * 0.2, "#c4b5fd", 0.34, baseZ + 30, phase, "#f5d0fe");
    }

    if (enemyStatusActive(enemy, effects, "threaded")) {
      for (let i = 0; i < 3; i += 1) {
        const offset = (i - 1) * radius * 0.42;
        renderer.drawGfxLine?.(pos.x + offset, pos.y - radius * 1.05, pos.x - offset * 0.36, pos.y + radius * 1.04, 2, "#d8b4fe", 0.44, baseZ + 31 + i, "add");
        renderer.drawGfxCircle(pos.x - offset * 0.36, pos.y + radius * (0.5 - i * 0.08), radius * 0.08, "#d8b4fe", 0.34, "#f5d0fe", 0.22, 1, baseZ + 35 + i, "add", 8);
      }
    }

    if (enemyStatusActive(enemy, effects, "taunt")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * (1.42 + pulse * 0.12), "#7f1d1d", 0.03, "#ef4444", 0.46, 3, baseZ + 40, "add", 26);
      renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.95, pos.x, pos.y - radius * 0.28, 5, "#fecaca", 0.68, baseZ + 43, "add");
      renderer.drawGfxCircle(pos.x, pos.y - radius * 0.08, radius * 0.1, "#fecaca", 0.62, "#ef4444", 0.3, 1, baseZ + 44, "add", 8);
    }
  }

  function drawEnemyStatusPips(renderer, enemy, pos, z) {
    const markers = enemyStatusMarkers(enemy);
    if (!markers.length || !renderer.drawGfxCircle) return;

    const size = 14;
    const gap = 3;
    const perRow = 6;
    const rowGap = 15;
    const pipY = pos.y + Math.max(14, Number(enemy.radius || 18) + 11);
    const textParent = renderer.layers?.effect || renderer.layers?.actor;
    const textStyleBase = {
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fontSize: 8,
      stroke: { color: "#020617", width: 2 },
    };

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const count = Math.min(perRow, markers.length - row * perRow);
      const startX = pos.x - ((count - 1) * (size + gap)) / 2;
      const x = startX + col * (size + gap);
      const y = pipY + row * rowGap;
      renderer.drawGfxCircle(x, y, size / 2, "#05070c", 0.86, marker.color, 0.88, 1.4, z + 58 + row, "normal", 12);
      if (!renderer.textPool?.next || !textParent) continue;
      const label = enemyStatusMarkerLabel(enemy, marker);
      const text = renderer.textPool.next(textParent, { ...textStyleBase, fontSize: label.length > 1 ? 7 : 8, fill: marker.color });
      text.text = label;
      text.position.set(x, y + 0.2);
      text.alpha = 0.98;
      text.scale.set(1);
      text.zIndex = z + 59 + row;
    }
  }

  function drawWing(renderer, x, y, radius, color, alpha, z, face, now) {
    const flap = Math.sin(now / 90) * radius * 0.16;
    renderer.drawGfxPath(
      [
        { x, y },
        { x: x - face * radius * 1.24, y: y - radius * 0.36 - flap },
        { x: x - face * radius * 0.48, y: y + radius * 0.28 },
      ],
      color,
      alpha * 0.2,
      color,
      alpha * 0.76,
      3,
      z,
      "add",
    );
    renderer.drawGfxPath(
      [
        { x, y },
        { x: x + face * radius * 1.24, y: y - radius * 0.36 + flap },
        { x: x + face * radius * 0.48, y: y + radius * 0.28 },
      ],
      color,
      alpha * 0.2,
      color,
      alpha * 0.76,
      3,
      z + 1,
      "add",
    );
  }

  function drawEliteMutation(renderer, enemy, pos, radius, alpha, z) {
    if (!enemy.elite || enemy.type === "boss") return;

    const color = eliteAffixColor(enemy.affix, "#facc15");
    const dark = "#111827";
    const bone = "#f8fafc";
    const baseZ = z + 18;

    if (enemy.affix === "bulwark") {
      for (const side of [-1, 1]) {
        renderer.drawGfxPath?.(
          [
            { x: pos.x + side * radius * 0.18, y: pos.y - radius * 0.52 },
            { x: pos.x + side * radius * 0.72, y: pos.y - radius * 0.46 },
            { x: pos.x + side * radius * 0.94, y: pos.y - radius * 0.08 },
            { x: pos.x + side * radius * 0.58, y: pos.y + radius * 0.2 },
            { x: pos.x + side * radius * 0.24, y: pos.y + radius * 0.04 },
          ],
          dark,
          alpha * 0.84,
          color,
          alpha * 0.72,
          2.4,
          baseZ + side,
          "normal",
        );
      }
      renderer.drawGfxPath?.(
        polygon(pos.x, pos.y + radius * 0.08, radius * 0.38, 6, Math.PI / 6),
        "#1e293b",
        alpha * 0.84,
        bone,
        alpha * 0.38,
        2,
        baseZ + 3,
        "normal",
      );
      renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.2, pos.x, pos.y + radius * 0.34, 3, color, alpha * 0.56, baseZ + 4, "normal");
      return;
    }

    if (enemy.affix === "venom") {
      const sacs = [
        [-0.4, 0.22, 0.26],
        [0.04, 0.34, 0.32],
        [0.46, 0.18, 0.22],
      ];
      for (let i = 0; i < sacs.length; i += 1) {
        const [ox, oy, size] = sacs[i];
        renderer.drawGfxCircle(
          pos.x + ox * radius,
          pos.y + oy * radius,
          radius * size,
          "#365314",
          alpha * 0.82,
          color,
          alpha * 0.62,
          1.8,
          baseZ + i,
          "normal",
          12,
        );
      }
      for (const side of [-1, 1]) {
        renderer.drawGfxPath?.(
          [
            { x: pos.x + side * radius * 0.16, y: pos.y - radius * 0.1 },
            { x: pos.x + side * radius * 0.34, y: pos.y - radius * 0.04 },
            { x: pos.x + side * radius * 0.24, y: pos.y + radius * 0.24 },
          ],
          bone,
          alpha * 0.78,
          color,
          alpha * 0.46,
          1.2,
          baseZ + 4,
          "normal",
        );
      }
      return;
    }

    if (enemy.affix === "volatile") {
      renderer.drawGfxPath?.(
        polygon(pos.x, pos.y + radius * 0.02, radius * 0.34, 6, Math.PI / 6),
        "#7f1d1d",
        alpha * 0.92,
        color,
        alpha * 0.78,
        2.2,
        baseZ,
        "normal",
      );
      renderer.drawGfxCircle(pos.x, pos.y + radius * 0.02, radius * 0.13, bone, alpha * 0.72, color, alpha * 0.46, 1.2, baseZ + 1, "normal", 10);
      const cracks = [
        [-0.16, -0.18, -0.54, -0.54],
        [0.16, -0.14, 0.58, -0.42],
        [-0.14, 0.18, -0.48, 0.56],
        [0.14, 0.2, 0.52, 0.52],
      ];
      for (let i = 0; i < cracks.length; i += 1) {
        const [x1, y1, x2, y2] = cracks[i];
        renderer.drawGfxLine?.(
          pos.x + x1 * radius,
          pos.y + y1 * radius,
          pos.x + x2 * radius,
          pos.y + y2 * radius,
          2.2,
          color,
          alpha * 0.62,
          baseZ + 2 + i,
          "normal",
        );
      }
      return;
    }

    for (const side of [-1, 1]) {
      renderer.drawGfxPath?.(
        [
          { x: pos.x + side * radius * 0.12, y: pos.y - radius * 0.58 },
          { x: pos.x + side * radius * 0.8, y: pos.y - radius * 1.05 },
          { x: pos.x + side * radius * 0.52, y: pos.y - radius * 0.34 },
        ],
        dark,
        alpha * 0.9,
        color,
        alpha * 0.74,
        2,
        baseZ + side,
        "normal",
      );
    }
    const scars = [
      [-0.46, -0.06, 0.18, 0.28],
      [-0.24, -0.3, 0.42, 0.04],
    ];
    for (let i = 0; i < scars.length; i += 1) {
      const [x1, y1, x2, y2] = scars[i];
      renderer.drawGfxLine?.(
        pos.x + x1 * radius,
        pos.y + y1 * radius,
        pos.x + x2 * radius,
        pos.y + y2 * radius,
        2.6,
        color,
        alpha * 0.68,
        baseZ + 3 + i,
        "normal",
      );
    }
  }

  function drawNeonEnemyShape(renderer, enemy, pos, face, now, z, last) {
    const meta = metaFor(enemy);
    const color = typeColor(enemy);
    const accent = enemy.elite ? "#f8fafc" : color;
    const dark = meta.dark;
    const radius = Math.max(10, Number(enemy.radius || 18));
    const alpha = enemy.dying ? 0.5 : 1;
    const pulse = 0.5 + Math.sin(now / 170 + renderer.hash(enemy.id) * 7) * 0.5;
    const shape = enemy.type === "boss" ? "boss" : meta.shape;

    renderer.drawGfxCircle(pos.x, pos.y + radius * 0.62, radius * 1.08, "#000000", 0.18, "#000000", 0, 1, z - 20, "normal", 18);

    if (shape === "wing") {
      drawWing(renderer, pos.x, pos.y, radius, color, alpha, z, face, now);
      renderer.drawGfxCircle(pos.x, pos.y, radius * 0.52, dark, alpha * 0.78, color, alpha * 0.72, 2, z + 3, "add", 14);
    } else if (shape === "block") {
      renderer.drawGfxPath(polygon(pos.x, pos.y, radius * 0.94, 8, Math.PI / 8), dark, alpha * 0.72, color, alpha * 0.78, 3, z, "add");
      renderer.drawGfxLine(pos.x - radius * 0.5, pos.y - radius * 0.18, pos.x + radius * 0.5, pos.y - radius * 0.18, 4, "#fed7aa", alpha * 0.52, z + 2, "add");
    } else if (shape === "shield") {
      renderer.drawGfxPath(polygon(pos.x, pos.y, radius * 1.02, 6, Math.PI / 6), dark, alpha * 0.76, color, alpha * 0.9, 4, z, "add");
      renderer.drawGfxCircle(pos.x, pos.y, radius * (1.32 + pulse * 0.06), "#000000", 0, color, alpha * 0.28, 3, z + 2, "add", 20);
      renderer.drawGfxLine(pos.x, pos.y - radius * 0.62, pos.x, pos.y + radius * 0.62, 4, "#dbeafe", alpha * 0.48, z + 3, "add");
    } else if (shape === "cross") {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 0.9, dark, alpha * 0.68, color, alpha * 0.7, 3, z, "add", 20);
      renderer.drawGfxLine(pos.x - radius * 0.55, pos.y, pos.x + radius * 0.55, pos.y, 5, "#bbf7d0", alpha * 0.68, z + 2, "add");
      renderer.drawGfxLine(pos.x, pos.y - radius * 0.55, pos.x, pos.y + radius * 0.55, 5, "#bbf7d0", alpha * 0.68, z + 3, "add");
    } else if (shape === "spit") {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 0.82, dark, alpha * 0.68, color, alpha * 0.68, 3, z, "add", 18);
      renderer.drawGfxLine(pos.x, pos.y, pos.x + face * radius * 1.08, pos.y - radius * 0.08, 6, color, alpha * 0.72, z + 2, "add");
      renderer.drawGfxCircle(pos.x + face * radius * 1.08, pos.y - radius * 0.08, radius * 0.2, color, alpha * 0.32, "#f7fee7", alpha * 0.5, 2, z + 3, "add", 10);
    } else if (shape === "bomb") {
      renderer.drawGfxDiamond(pos.x, pos.y, radius * 0.88, dark, alpha * 0.78, z, Math.PI / 4, color);
      renderer.drawGfxCircle(pos.x, pos.y, radius * (1.14 + pulse * 0.2), "#000000", 0, color, alpha * (0.2 + pulse * 0.16), 3, z + 2, "add", 18);
      renderer.drawGfxLine(pos.x - radius * 0.34, pos.y - radius * 0.34, pos.x + radius * 0.34, pos.y + radius * 0.34, 4, "#fecdd3", alpha * 0.56, z + 3, "add");
    } else if (shape === "arrow") {
      const a = enemyDirectionAngle(enemy, pos, last || pos, face);
      const ux = Math.cos(a);
      const uy = Math.sin(a);
      const px = -uy;
      const py = ux;
      const charging = Boolean(enemy.chargeMove?.active);
      const windupCharge = enemy.windup?.kind === "charge";
      const nose = charging ? 1.48 : windupCharge ? 1.34 : 1.24;
      const tail = charging ? 0.98 : 0.8;
      if (charging) {
        renderer.drawGfxLine(pos.x - ux * radius * 1.8, pos.y - uy * radius * 1.8, pos.x - ux * radius * 0.46, pos.y - uy * radius * 0.46, 8, color, alpha * 0.24, z - 3, "add");
        renderer.drawGfxLine(pos.x - ux * radius * 1.36 + px * radius * 0.38, pos.y - uy * radius * 1.36 + py * radius * 0.38, pos.x - ux * radius * 0.64 + px * radius * 0.18, pos.y - uy * radius * 0.64 + py * radius * 0.18, 3, "#fef9c3", alpha * 0.28, z - 2, "add");
        renderer.drawGfxLine(pos.x - ux * radius * 1.36 - px * radius * 0.38, pos.y - uy * radius * 1.36 - py * radius * 0.38, pos.x - ux * radius * 0.64 - px * radius * 0.18, pos.y - uy * radius * 0.64 - py * radius * 0.18, 3, "#fef9c3", alpha * 0.28, z - 2, "add");
      }
      renderer.drawGfxPath(
        [
          { x: pos.x + ux * radius * nose, y: pos.y + uy * radius * nose },
          { x: pos.x - ux * radius * tail - px * radius * 0.56, y: pos.y - uy * radius * tail - py * radius * 0.56 },
          { x: pos.x - ux * radius * 0.36, y: pos.y - uy * radius * 0.36 },
          { x: pos.x - ux * radius * tail + px * radius * 0.56, y: pos.y - uy * radius * tail + py * radius * 0.56 },
        ],
        dark,
        alpha * 0.7,
        color,
        alpha * 0.88,
        3,
        z,
        "add",
      );
      renderer.drawGfxLine(pos.x - ux * radius * 1.25, pos.y - uy * radius * 1.25, pos.x - ux * radius * 0.32, pos.y - uy * radius * 0.32, 3, color, alpha * 0.32, z - 2, "add");
    } else if (shape === "blade") {
      renderer.drawGfxDiamond(pos.x, pos.y, radius * 0.82, dark, alpha * 0.72, z, now / 380, color);
      renderer.drawGfxLine(pos.x - face * radius * 0.88, pos.y + radius * 0.46, pos.x + face * radius * 0.88, pos.y - radius * 0.46, 5, "#f5d0fe", alpha * 0.72, z + 2, "add");
      renderer.drawGfxLine(pos.x - face * radius * 0.56, pos.y - radius * 0.5, pos.x + face * radius * 0.56, pos.y + radius * 0.5, 3, color, alpha * 0.42, z + 3, "add");
    } else if (shape === "scope") {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 0.86, dark, alpha * 0.72, color, alpha * 0.82, 3, z, "add", 20);
      renderer.drawGfxLine(pos.x - radius, pos.y, pos.x + radius, pos.y, 3, "#fee2e2", alpha * 0.62, z + 2, "add");
      renderer.drawGfxLine(pos.x, pos.y - radius, pos.x, pos.y + radius, 3, "#fee2e2", alpha * 0.62, z + 3, "add");
    } else if (shape === "mortar") {
      renderer.drawGfxPath(polygon(pos.x, pos.y, radius * 0.86, 5, -Math.PI / 2), dark, alpha * 0.72, color, alpha * 0.74, 3, z, "add");
      renderer.drawGfxArc(pos.x, pos.y - radius * 0.18, radius * 0.94, -Math.PI * 0.92, -Math.PI * 0.08, 4, "#fed7aa", alpha * 0.48, z + 3, "add", 10);
    } else if (shape === "split") {
      for (let i = 0; i < 3; i += 1) {
        const a = now / 620 + (Math.PI * 2 * i) / 3;
        renderer.drawGfxCircle(pos.x + Math.cos(a) * radius * 0.42, pos.y + Math.sin(a) * radius * 0.32, radius * 0.42, dark, alpha * 0.58, color, alpha * 0.58, 2, z + i, "add", 14);
      }
    } else if (shape === "boss") {
      const phase = Number(enemy.phase || 1);
      const execution = Boolean(enemy.executionBoss);
      renderer.drawGfxCircle(pos.x, pos.y, radius * 1.08, execution ? "#090205" : dark, alpha * 0.78, color, alpha * 0.88, execution ? 7 : 5, z, "add", 28);
      renderer.drawGfxRuneRing(pos.x, pos.y, radius * (1.32 + pulse * 0.1), color, alpha * (execution ? 0.78 : 0.58), z + 3, now / (execution ? 420 : 780), execution ? 16 : 12);
      renderer.drawGfxPath(polygon(pos.x, pos.y, radius * 0.72, phase >= 3 ? 5 : 4, now / 460), "#020617", alpha * 0.7, "#f8fafc", alpha * 0.42, 3, z + 6, "add");
      const spokeCount = execution ? 10 : 6;
      for (let i = 0; i < spokeCount; i += 1) {
        const a = now / (execution ? 560 : 920) + (Math.PI * 2 * i) / spokeCount;
        renderer.drawGfxLine(pos.x + Math.cos(a) * radius * 0.62, pos.y + Math.sin(a) * radius * 0.62, pos.x + Math.cos(a) * radius * 1.12, pos.y + Math.sin(a) * radius * 1.12, 3, i % 2 ? color : "#f8fafc", alpha * 0.34, z + 8 + i, "add");
      }
      if (execution) {
        renderer.drawGfxDiamond(pos.x, pos.y, radius * 0.38, "#020103", 0.95, z + 22, now / 260, "#fecaca");
        renderer.drawGfxCircle(pos.x, pos.y, radius * (0.18 + pulse * 0.05), "#fff1f2", 0.82, "#ef4444", 0.92, 3, z + 24, "add", 14);
      }
    } else if (shape === "dummy") {
      renderer.drawGfxPath(polygon(pos.x, pos.y, radius * 0.82, 4, Math.PI / 4), dark, alpha * 0.72, color, alpha * 0.68, 3, z, "add");
      renderer.drawGfxLine(pos.x - radius * 0.52, pos.y, pos.x + radius * 0.52, pos.y, 3, color, alpha * 0.52, z + 2, "add");
    } else {
      renderer.drawGfxCircle(pos.x, pos.y, radius * (0.78 + pulse * 0.04), dark, alpha * 0.72, color, alpha * 0.72, 3, z, "add", 18);
      renderer.drawGfxCircle(pos.x - face * radius * 0.26, pos.y - radius * 0.18, radius * 0.14, accent, alpha * 0.68, accent, alpha * 0.22, 1, z + 2, "add", 10);
      renderer.drawGfxCircle(pos.x + face * radius * 0.26, pos.y - radius * 0.18, radius * 0.14, accent, alpha * 0.68, accent, alpha * 0.22, 1, z + 2, "add", 10);
    }

    drawEliteMutation(renderer, enemy, pos, radius, alpha, z);
    drawEnemyCastAura(renderer, enemy, pos, radius, now, z + 28);
  }

  function renderEnemy(renderer, enemy, now, visuals, world) {
    const pos = renderer.visualPosition(visuals.enemies, enemy);
    const last = renderer.lastEnemyPositions.get(String(enemy.id)) || pos;
    const face = enemyFace(enemy, pos, last);
    renderer.lastEnemyPositions.set(String(enemy.id), { x: pos.x, y: pos.y });

    const z = pos.y + (enemy.type === "boss" ? 80 : 20);
    const color = typeColor(enemy);
    drawEnemyWindupTelegraph(renderer, enemy, pos, now, z - 36, world);
    drawNeonEnemyShape(renderer, enemy, pos, face, now, z, last);

    if (enemy.type === "boss" && enemy.phaseTransitionTime > 0) {
      const maxTime = Math.max(0.1, Number(enemy.phaseTransitionTimeMax || enemy.phaseTransitionTime || 1));
      const ratio = Math.max(0, Math.min(1, Number(enemy.phaseTransitionTime || 0) / maxTime));
      renderer.drawGfxRuneRing(pos.x, pos.y, enemy.radius * 1.92, enemy.phaseAuraColor || color, 0.42 * ratio, z + 45, now / 280, 14);
      renderer.drawGfxSparkSpray(pos.x, pos.y, enemy.radius * 1.58, enemy.phaseAuraColor || color, 0.28 * ratio, z + 52, 16, now / 420);
    }
    if (enemy.statusEffects?.includes("freeze")) renderer.drawGfxRuneRing(pos.x, pos.y, enemy.radius * 1.35, "#93c5fd", 0.5, z + 34, now / 360, 8);
    if (enemy.statusEffects?.includes("barrier") || enemy.barrier > 0) renderer.drawGfxCircle(pos.x, pos.y, enemy.radius * 1.58, "#000000", 0, "#67e8f9", 0.42, 3, z + 35, "add", 22);
    drawEnemyStatusGraphics(renderer, enemy, pos, now, z);
    drawEnemyStatusPips(renderer, enemy, pos, z);
    renderer.bar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, enemy.executionBoss ? 8 : 5, enemy.hp / enemy.maxHp, enemy.executionBoss ? "#dc2626" : "#ff4d6d");
  }

  function renderEnemies(renderer, enemies, now, world) {
    const visuals = renderer.getVisuals();
    for (const enemy of enemies) renderEnemy(renderer, enemy, now, visuals, world);
  }

  window.RoguePixiEnemies = Object.freeze({
    enemyFrame,
    enemyFace,
    enemyTextureKey,
    enemyScale,
    enemyStatusMarkers,
    renderEnemy,
    renderEnemies,
  });
})();
