const SPECIAL_PATTERN_CYCLE = 10;
const SPECIAL_PATTERN_STEPS = new Set([3, 7, 10]);

function isEnemyTypeUnlocked(type, wave, blockadeRunnerTypes = []) {
  if (blockadeRunnerTypes.includes(type)) return true;
  if (type === "slime" || type === "bat") return true;
  if (type === "brute" || type === "bomber") return wave >= 2;
  if (type === "sniper") return wave >= 2;
  if (type === "splitter") return wave >= 2;
  if (type === "spitter") return wave >= 4;
  if (type === "guardian" || type === "shaman") return wave >= 3;
  if (type === "charger") return wave >= 5;
  if (type === "mortar") return wave >= 5;
  if (type === "stalker") return wave >= 7;
  if (type === "splinter") return false;
  return true;
}

function isRangedPressureEnemyType(type) {
  return type === "spitter" || type === "sniper" || type === "mortar" || type === "boss";
}

function getHostileProjectileCap(options = {}) {
  const playerCount = Math.max(1, options.playerCount || 1);
  const chapter = Math.max(1, options.chapter || 1);
  const stageKind = options.stageKind || "combat";
  const bossBonus = stageKind === "boss" ? 10 : 0;
  const cap = Math.round(14 + playerCount * 4 + chapter * 1.5 + bossBonus);
  return Math.min(stageKind === "boss" ? 48 : 30, cap);
}

function countHostileProjectiles(projectiles) {
  return (projectiles || []).reduce((count, projectile) => count + (projectile.hostile && !projectile.dead ? 1 : 0), 0);
}

function canSpawnHostileProjectile(projectiles, options = {}) {
  return countHostileProjectiles(projectiles) < getHostileProjectileCap(options);
}

function countEnemiesOfType(enemies, type) {
  return (enemies || []).reduce((count, enemy) => count + (enemy.hp > 0 && enemy.type === type ? 1 : 0), 0);
}

function nearestLivingPlayer(players, point) {
  let best = null;
  let bestDistance = Infinity;
  for (const player of players || []) {
    const current = Math.hypot(point.x - player.x, point.y - player.y);
    if (current < bestDistance) {
      best = player;
      bestDistance = current;
    }
  }
  return best;
}

function nearestLivingPlayerWithin(players, point, maxDistance, getCollisionRadius = () => 0) {
  let best = null;
  let bestDistance = maxDistance;
  for (const player of players || []) {
    const current = Math.hypot(point.x - player.x, point.y - player.y) - getCollisionRadius(player);
    if (current <= bestDistance) {
      best = player;
      bestDistance = current;
    }
  }
  return best;
}

function lowestHealthLivingPlayer(players) {
  let best = null;
  let bestRatio = Infinity;
  for (const player of players || []) {
    const ratio = player.hp / Math.max(1, player.maxHp);
    if (ratio < bestRatio) {
      best = player;
      bestRatio = ratio;
    }
  }
  return best;
}

function nearestEnemy(enemies, point, maxDistance) {
  let best = null;
  let bestDistance = maxDistance;
  for (const enemy of enemies || []) {
    if (enemy.hp <= 0) continue;
    const current = Math.hypot(enemy.x - point.x, enemy.y - point.y);
    if (current < bestDistance) {
      best = enemy;
      bestDistance = current;
    }
  }
  return best;
}

function getDefensePlayerAggroRadius(enemy) {
  const base =
    enemy.type === "brute" ? 230 :
    enemy.type === "guardian" ? 215 :
    enemy.type === "charger" ? 190 :
    enemy.type === "bomber" ? 185 :
    enemy.type === "bat" ? 160 :
    180;
  return base + (enemy.elite ? 30 : 0) + Math.max(0, (enemy.radius || 18) - 18) * 0.55;
}

function getDefensePushbackTriggerCount(previousHp, currentHp, maxHp, alreadyTriggered = 0) {
  const safeMaxHp = Math.max(1, Number(maxHp) || 1);
  const before = Math.max(0, Number(previousHp) || 0);
  const after = Math.max(0, Number(currentHp) || 0);
  const thresholds = [safeMaxHp * (2 / 3), safeMaxHp * (1 / 3)];
  let triggered = Math.max(0, Math.min(thresholds.length, Math.floor(Number(alreadyTriggered) || 0)));

  while (triggered < thresholds.length) {
    const threshold = thresholds[triggered];
    if (!(before > threshold && after <= threshold)) break;
    triggered += 1;
  }
  return triggered;
}

function getDefenseWallPush(world, objective, enemy, wallThickness = 36) {
  const width = Math.max(1, Number(world?.w) || 1800);
  const height = Math.max(1, Number(world?.h) || 1120);
  const radius = Math.max(1, Number(enemy?.radius) || 18);
  const inset = Math.max(0, Number(wallThickness) || 0) + radius + 8;
  const minX = Math.min(width / 2, inset);
  const maxX = Math.max(width / 2, width - inset);
  const minY = Math.min(height / 2, inset);
  const maxY = Math.max(height / 2, height - inset);
  const enemyX = Number.isFinite(enemy?.x) ? enemy.x : width / 2;
  const enemyY = Number.isFinite(enemy?.y) ? enemy.y : height / 2;
  const originX = Number.isFinite(objective?.x) ? objective.x : width / 2;
  const originY = Number.isFinite(objective?.y) ? objective.y : height / 2;
  let dx = enemyX - originX;
  let dy = enemyY - originY;

  if (Math.hypot(dx, dy) < 0.001) {
    const text = String(enemy?.id ?? "0");
    let seed = 0;
    for (let i = 0; i < text.length; i += 1) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
    const angle = ((seed % 360) * Math.PI) / 180;
    dx = Math.cos(angle);
    dy = Math.sin(angle);
  }

  const length = Math.hypot(dx, dy) || 1;
  const dirX = dx / length;
  const dirY = dy / length;
  const travelX = Math.abs(dirX) < 0.0001 ? Infinity : dirX > 0 ? (maxX - enemyX) / dirX : (minX - enemyX) / dirX;
  const travelY = Math.abs(dirY) < 0.0001 ? Infinity : dirY > 0 ? (maxY - enemyY) / dirY : (minY - enemyY) / dirY;
  const distance = Math.max(0, Math.min(travelX, travelY));

  return { dirX, dirY, distance };
}

function getEnemyCrowdPush(enemies, enemy) {
  let x = 0;
  let y = 0;
  for (const other of enemies || []) {
    if (other.id === enemy.id || other.hp <= 0) continue;
    const dx = enemy.x - other.x;
    const dy = enemy.y - other.y;
    const dist = Math.hypot(dx, dy);
    const min = enemy.radius + other.radius;
    if (dist > 0 && dist < min) {
      const force = (min - dist) * 4;
      x += (dx / dist) * force;
      y += (dy / dist) * force;
    }
  }
  return { x, y };
}

function getEnemyCollisionMass(enemy) {
  let mass = Math.max(0.8, enemy.radius / 18);
  if (enemy.type === "boss") mass *= 4.2;
  if (enemy.type === "guardian" || enemy.type === "brute") mass *= 1.7;
  if (enemy.type === "charger") mass *= 1.35;
  if (enemy.elite) mass *= 1.45;
  return mass;
}

function getEnemyStatusEffects(enemy) {
  const effects = [];
  if (enemy.slowTimer > 0) effects.push("slow");
  if (enemy.freezeTimer > 0) effects.push("freeze");
  if (enemy.poisonTimer > 0) effects.push("poison");
  if (enemy.venomTimer > 0) effects.push("venom");
  if (enemy.burnTimer > 0) effects.push("burn");
  if (enemy.vulnerableTimer > 0) effects.push("vulnerable");
  if (enemy.weakenTimer > 0) effects.push("weaken");
  if (enemy.assassinMarkTimer > 0) effects.push("marked");
  if (enemy.threadMarkTimer > 0) effects.push("threaded");
  if (enemy.barrier > 0 && enemy.barrierTimer > 0) effects.push("barrier");
  if (enemy.tauntTimer > 0) effects.push("taunt");
  if (enemy.elite) effects.push("elite");
  return effects;
}

function getEnemyWindupChannel(kind) {
  if (!kind) return "";
  if (kind === "heal" || kind.includes("barrier")) return "support";
  if (kind.includes("snipe") || kind.includes("spit") || kind.includes("mortar") || kind.includes("shuriken") || kind.includes("crossfire") || kind.includes("volley") || kind.includes("ring")) return "ranged";
  if (kind.includes("charge")) return "charge";
  if (kind.includes("cleave") || kind.includes("stab") || kind.includes("swing")) return "melee";
  return "special";
}

function getEnemyAiState(enemy) {
  if (!enemy || enemy.dead || enemy.hp <= 0) return "dead";
  if (enemy.trainingDummy) return "idle";
  if (enemy.freezeTimer > 0) return "frozen";
  if (enemy.knockbackMove) return "recover";
  if (enemy.chargeMove) return "special_attack";
  if (enemy.windup) return "casting";
  if (enemy.blockadeRunner) return "advance";
  if (enemy.focusingDefenseObjective) return "objective";
  if (enemy.tauntTimer > 0) return "taunted";
  return "chase";
}

function tickEnemyTimers(enemy, dt) {
  enemy.focusingDefenseObjective = false;
  enemy.attackTimer = Math.max(0, (enemy.attackTimer || 0) - dt);
  enemy.shotTimer = Math.max(0, (enemy.shotTimer || 0) - dt);
  enemy.healTimer = Math.max(0, (enemy.healTimer || 0) - dt);
  enemy.chargeTimer = Math.max(0, (enemy.chargeTimer || 0) - dt);
  enemy.specialTimer = Math.max(0, (enemy.specialTimer || 0) - dt);
  enemy.eliteSpecialTimer = Math.max(0, (enemy.eliteSpecialTimer || 0) - dt);
  enemy.phaseTransitionTimer = Math.max(0, (enemy.phaseTransitionTimer || 0) - dt);
  enemy.slowTimer = Math.max(0, (enemy.slowTimer || 0) - dt);
  enemy.freezeTimer = Math.max(0, (enemy.freezeTimer || 0) - dt);
  enemy.tauntTimer = Math.max(0, (enemy.tauntTimer || 0) - dt);
  enemy.vulnerableTimer = Math.max(0, (enemy.vulnerableTimer || 0) - dt);
  enemy.weakenTimer = Math.max(0, (enemy.weakenTimer || 0) - dt);
  enemy.assassinMarkTimer = Math.max(0, (enemy.assassinMarkTimer || 0) - dt);
  enemy.threadMarkTimer = Math.max(0, (enemy.threadMarkTimer || 0) - dt);

  if (enemy.barrierTimer > 0) {
    enemy.barrierTimer = Math.max(0, enemy.barrierTimer - dt);
    if (enemy.barrierTimer <= 0) enemy.barrier = 0;
  }

  if (enemy.tauntTimer <= 0) enemy.tauntTargetId = null;
  if (enemy.assassinMarkTimer <= 0) enemy.assassinMarkOwnerId = null;
  if (enemy.threadMarkTimer <= 0) {
    enemy.threadMarkOwnerId = null;
    enemy.threadMarkStacks = 0;
  }
}

function advanceEnemyWindup(enemy, kind, dt) {
  if (!enemy.windup || enemy.windup.kind !== kind) {
    return { active: false, ready: false, windup: null };
  }

  enemy.windup.time -= dt;
  if (enemy.windup.time > 0) {
    return { active: true, ready: false, windup: enemy.windup };
  }

  const windup = enemy.windup;
  enemy.windup = null;
  return { active: true, ready: true, windup };
}

function isInterruptibleWindupKind(kind, isEliteSpecialWindup = () => false) {
  return (
    kind === "charge" ||
    kind === "guardian_barrier" ||
    kind === "stalk" ||
    kind === "stalker_stab" ||
    kind === "stalker_shuriken" ||
    kind === "brute_swing" ||
    kind === "snipe" ||
    kind === "mortar" ||
    kind === "spit" ||
    kind === "heal" ||
    isEliteSpecialWindup(kind)
  );
}

function isEliteSpecialWindupKind(kind) {
  return (
    kind === "elite_slam" ||
    kind === "elite_screech" ||
    kind === "elite_quake" ||
    kind === "elite_fortify" ||
    kind === "elite_totem" ||
    kind === "elite_volley" ||
    kind === "elite_mine" ||
    kind === "elite_fracture" ||
    kind === "elite_shadow" ||
    kind === "elite_cluster_mortar" ||
    kind === "elite_crossfire"
  );
}

function getInterruptedWindupCooldown(enemy, kind, options = {}) {
  const cadence = enemy.cadenceMul || 1;
  if (kind === "charge") return { field: "chargeTimer", value: (enemy.type === "boss" ? 1.25 : enemy.elite ? 1.05 : 1.35) * cadence };
  if (kind === "guardian_barrier") return { field: "specialTimer", value: (enemy.elite ? 1.0 : 1.25) * cadence };
  if (kind === "stalk" || kind === "stalker_stab" || kind === "stalker_shuriken") {
    return { field: "specialTimer", value: (enemy.elite ? 1.05 : 1.4) * cadence };
  }
  if (kind === "brute_swing") return { field: "attackTimer", value: (enemy.elite ? 0.52 : 0.72) * cadence };
  if (kind === "snipe") return { field: "specialTimer", value: (enemy.type === "boss" ? 1.1 : enemy.elite ? 1.05 : 1.35) * cadence };
  if (kind === "mortar") return { field: "specialTimer", value: (enemy.elite ? 1.08 : 1.45) * cadence };
  if (kind === "spit") return { field: "shotTimer", value: (enemy.elite ? 0.62 : 0.86) * cadence };
  if (kind === "heal") return { field: "healTimer", value: (enemy.elite ? 1.0 : 1.35) * cadence };
  if (options.isEliteSpecialWindup?.(kind)) {
    const cooldown = options.getEliteSpecialCooldown ? options.getEliteSpecialCooldown(enemy) : 5.2;
    return { field: "eliteSpecialTimer", value: Math.min(2.2, cooldown * 0.42) };
  }
  return null;
}

function interruptEnemyWindup(enemy, options = {}) {
  if (!enemy || !enemy.windup) return { interrupted: false, kind: "" };
  if (enemy.type === "boss" && !options.allowBoss) return { interrupted: false, kind: enemy.windup.kind || "" };
  const kind = enemy.windup.kind;
  if (!isInterruptibleWindupKind(kind, options.isEliteSpecialWindup)) return { interrupted: false, kind };

  enemy.windup = null;
  const cooldown = getInterruptedWindupCooldown(enemy, kind, options);
  if (cooldown) {
    enemy[cooldown.field] = Math.max(enemy[cooldown.field] || 0, cooldown.value);
  }
  return { interrupted: true, kind };
}

function getChargeDashCooldown(enemy) {
  return (
    enemy.type === "boss"
      ? enemy.miniBoss
        ? 2.15
        : enemy.bossPhase >= 3
          ? 1.85
          : enemy.bossPhase >= 2
            ? 2.25
            : 2.65
      : enemy.elite
        ? 3.55
        : 4.35
  ) * (enemy.cadenceMul || 1);
}

function getSupportCastProfile(enemy, kind) {
  const cadence = enemy.cadenceMul || 1;
  if (kind === "heal") {
    return {
      radius: enemy.elite ? 190 : 160,
      windupTime: (enemy.elite ? 0.78 : 1.05) * Math.max(0.88, cadence),
      recoveryTime: (enemy.elite ? 2.25 : 2.95) * cadence
    };
  }
  if (kind === "guardian_barrier") {
    return {
      radius: enemy.elite ? 255 : 220,
      windupTime: (enemy.elite ? 0.62 : 0.78) * Math.max(0.9, cadence),
      recoveryTime: (enemy.elite ? 3.0 : 3.65) * cadence
    };
  }
  return {
    radius: 0,
    windupTime: Math.max(0.1, cadence),
    recoveryTime: Math.max(0.1, cadence)
  };
}

function getRangedCastProfile(enemy, kind, pressureMul = 1) {
  const cadence = enemy.cadenceMul || 1;
  if (kind === "mortar") {
    return {
      radius: enemy.elite ? 108 : 86,
      windupTime: (enemy.elite ? 1.08 : 1.34) * Math.max(0.95, cadence) * Math.min(1.18, pressureMul),
      recoveryTime: (enemy.elite ? 2.72 : 3.36) * cadence * pressureMul,
      warningRadius: enemy.elite ? 108 : 86
    };
  }
  if (kind === "snipe") {
    return {
      radius: 42,
      windupTime: (enemy.elite ? 1.02 : 1.2) * Math.max(0.94, cadence) * Math.min(1.16, pressureMul),
      recoveryTime: (enemy.elite ? 2.35 : 3.05) * cadence * pressureMul,
      projectileSpeed: enemy.elite ? 820 : 730,
      minRange: 180,
      maxRange: 820
    };
  }
  if (kind === "spit") {
    return {
      radius: (enemy.radius || 18) + 34,
      windupTime: (enemy.elite ? 0.43 : 0.54) * Math.max(0.94, cadence) * Math.min(1.12, pressureMul),
      recoveryTime: (enemy.elite ? 1.28 : 1.72) * cadence * pressureMul,
      maxRange: 560
    };
  }
  return {
    radius: 0,
    windupTime: Math.max(0.1, cadence),
    recoveryTime: Math.max(0.1, cadence)
  };
}

function allowSpecialPatternNow(enemy, channel) {
  const key = `${channel}PatternStep`;
  enemy[key] = ((enemy[key] || 0) % SPECIAL_PATTERN_CYCLE) + 1;
  if (SPECIAL_PATTERN_STEPS.has(enemy[key])) return true;
  deferSpecialPattern(enemy, channel);
  return false;
}

function deferSpecialPattern(enemy, channel) {
  setSpecialPatternTimer(enemy, channel, getBasicPatternWindow(enemy, channel));
}

function setSpecialPatternTimer(enemy, channel, seconds) {
  const cadenceFloor = enemy.executionBoss ? 0.42 : 0.78;
  const value = Math.max(0.18, seconds) * Math.max(cadenceFloor, enemy.cadenceMul || 1);
  if (channel === "elite") {
    enemy.eliteSpecialTimer = Math.max(enemy.eliteSpecialTimer || 0, value);
    return;
  }
  if (channel.includes("charge")) {
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, value);
    return;
  }
  if (channel.includes("shot")) {
    enemy.shotTimer = Math.max(enemy.shotTimer || 0, value);
    return;
  }
  enemy.specialTimer = Math.max(enemy.specialTimer || 0, value);
}

function getBasicPatternWindow(enemy, channel) {
  if (channel === "elite") {
    if (enemy.type === "sniper" || enemy.type === "mortar") return 1.75;
    if (enemy.type === "charger" || enemy.type === "stalker") return 1.45;
    return 1.32;
  }
  if (channel.includes("charge")) return enemy.miniBoss ? 1.55 : 1.85;
  if (channel.includes("shot")) return enemy.miniBoss ? 1.65 : 1.95;
  if (enemy.miniBoss) return 1.38;
  if (enemy.executionBoss) return enemy.bossPhase >= 4 ? 0.72 : enemy.bossPhase >= 3 ? 0.82 : 0.92;
  if (enemy.bossPhase >= 3) return 1.08;
  if (enemy.bossPhase >= 2) return 1.22;
  return 1.42;
}

function getSpecialPatternCooldownMultiplier(enemy, channel) {
  if (channel === "elite") return 1.22;
  if (enemy.miniBoss) return 1.3;
  if (enemy.executionBoss) return enemy.bossPhase >= 4 ? 0.68 : enemy.bossPhase >= 3 ? 0.74 : 0.82;
  return enemy.bossPhase >= 3 ? 0.9 : enemy.bossPhase >= 2 ? 0.98 : 1.05;
}

function getEliteSpecialCooldown(enemy) {
  const base =
    enemy.type === "slime" ? 4.6 :
    enemy.type === "bat" ? 3.7 :
    enemy.type === "brute" ? 4.25 :
    enemy.type === "guardian" ? 5.4 :
    enemy.type === "shaman" ? 5.2 :
    enemy.type === "spitter" ? 3.8 :
    enemy.type === "bomber" ? 4.4 :
    enemy.type === "charger" ? 4.8 :
    enemy.type === "splitter" ? 5.1 :
    enemy.type === "stalker" ? 4.3 :
    enemy.type === "mortar" ? 5.0 :
    enemy.type === "sniper" ? 4.7 :
    4.8;
  return base * Math.max(0.72, enemy.cadenceMul || 1) * (enemy.rangedPressureMul || 1);
}

module.exports = {
  advanceEnemyWindup,
  allowSpecialPatternNow,
  canSpawnHostileProjectile,
  countEnemiesOfType,
  countHostileProjectiles,
  deferSpecialPattern,
  getBasicPatternWindow,
  getDefensePlayerAggroRadius,
  getDefensePushbackTriggerCount,
  getDefenseWallPush,
  getChargeDashCooldown,
  getEliteSpecialCooldown,
  getEnemyAiState,
  getEnemyCollisionMass,
  getEnemyCrowdPush,
  getEnemyStatusEffects,
  getEnemyWindupChannel,
  getHostileProjectileCap,
  getRangedCastProfile,
  getSpecialPatternCooldownMultiplier,
  getSupportCastProfile,
  isEliteSpecialWindupKind,
  isEnemyTypeUnlocked,
  interruptEnemyWindup,
  isInterruptibleWindupKind,
  isRangedPressureEnemyType,
  lowestHealthLivingPlayer,
  nearestEnemy,
  nearestLivingPlayer,
  nearestLivingPlayerWithin,
  setSpecialPatternTimer,
  tickEnemyTimers
};
