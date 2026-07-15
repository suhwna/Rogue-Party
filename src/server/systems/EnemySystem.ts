const SPECIAL_PATTERN_CYCLE = 10;
const SPECIAL_PATTERN_STEPS = new Set([3, 7, 10]);

export interface ProjectileLike {
  readonly hostile?: boolean;
  readonly dead?: boolean;
}

export interface EnemyLike {
  readonly hp: number;
  readonly type: string;
  readonly id?: string | number;
  readonly x?: number;
  readonly y?: number;
  readonly elite?: boolean;
  readonly radius?: number;
}

export interface HostileProjectileCapOptions {
  readonly playerCount?: number;
  readonly chapter?: number;
  readonly stageKind?: string;
}

export interface PointLike {
  readonly x: number;
  readonly y: number;
}

export interface WorldSizeLike {
  readonly w?: number;
  readonly h?: number;
}

export interface DefenseWallPush {
  readonly dirX: number;
  readonly dirY: number;
  readonly distance: number;
}

export interface PlayerLike extends PointLike {
  readonly hp: number;
  readonly maxHp: number;
}

export function isEnemyTypeUnlocked(type: string, wave: number, blockadeRunnerTypes: readonly string[] = []): boolean {
  if (blockadeRunnerTypes.includes(type)) return true;
  if (type === "slime" || type === "bat") return true;
  if (type === "brute" || type === "bomber") return wave >= 2;
  if (type === "sniper") return wave >= 2;
  if (type === "splitter") return wave >= 2;
  if (type === "spitter") return wave >= 4;
  if (type === "guardian" || type === "shaman") return wave >= 3;
  if (type === "charger") return wave >= 7;
  if (type === "mortar") return wave >= 8;
  if (type === "stalker") return wave >= 7;
  if (type === "splinter") return false;
  return true;
}

export function isRangedPressureEnemyType(type: string): boolean {
  return type === "spitter" || type === "sniper" || type === "mortar" || type === "boss";
}

export function getHostileProjectileCap(options: HostileProjectileCapOptions = {}): number {
  const playerCount = Math.max(1, options.playerCount ?? 1);
  const chapter = Math.max(1, options.chapter ?? 1);
  const stageKind = options.stageKind ?? "combat";
  const bossBonus = stageKind === "boss" ? 5 : 0;
  const cap = Math.round(14 + playerCount * 4 + chapter * 1.5 + bossBonus);
  return Math.min(stageKind === "boss" ? 38 : 30, cap);
}

export function countHostileProjectiles(projectiles: Iterable<ProjectileLike>): number {
  return [...projectiles].reduce((count, projectile) => count + (projectile.hostile && !projectile.dead ? 1 : 0), 0);
}

export function canSpawnHostileProjectile(projectiles: Iterable<ProjectileLike>, options: HostileProjectileCapOptions = {}): boolean {
  return countHostileProjectiles(projectiles) < getHostileProjectileCap(options);
}

export function countEnemiesOfType(enemies: Iterable<EnemyLike>, type: string): number {
  return [...enemies].reduce((count, enemy) => count + (enemy.hp > 0 && enemy.type === type ? 1 : 0), 0);
}

export function nearestLivingPlayer<T extends PlayerLike>(players: Iterable<T>, point: PointLike): T | null {
  let best: T | null = null;
  let bestDistance = Infinity;
  for (const player of players) {
    const current = Math.hypot(point.x - player.x, point.y - player.y);
    if (current < bestDistance) {
      best = player;
      bestDistance = current;
    }
  }
  return best;
}

export function nearestLivingPlayerWithin<T extends PlayerLike>(
  players: Iterable<T>,
  point: PointLike,
  maxDistance: number,
  getCollisionRadius: (player: T) => number = () => 0,
): T | null {
  let best: T | null = null;
  let bestDistance = maxDistance;
  for (const player of players) {
    const current = Math.hypot(point.x - player.x, point.y - player.y) - getCollisionRadius(player);
    if (current <= bestDistance) {
      best = player;
      bestDistance = current;
    }
  }
  return best;
}

export function lowestHealthLivingPlayer<T extends PlayerLike>(players: Iterable<T>): T | null {
  let best: T | null = null;
  let bestRatio = Infinity;
  for (const player of players) {
    const ratio = player.hp / Math.max(1, player.maxHp);
    if (ratio < bestRatio) {
      best = player;
      bestRatio = ratio;
    }
  }
  return best;
}

export function nearestEnemy<T extends EnemyLike & PointLike>(enemies: Iterable<T>, point: PointLike, maxDistance: number): T | null {
  let best: T | null = null;
  let bestDistance = maxDistance;
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const current = Math.hypot(enemy.x - point.x, enemy.y - point.y);
    if (current < bestDistance) {
      best = enemy;
      bestDistance = current;
    }
  }
  return best;
}

export function getDefensePlayerAggroRadius(enemy: EnemyLike): number {
  const base =
    enemy.type === "brute" ? 230 :
    enemy.type === "guardian" ? 215 :
    enemy.type === "charger" ? 190 :
    enemy.type === "bomber" ? 185 :
    enemy.type === "bat" ? 160 :
    180;
  return base + (enemy.elite ? 30 : 0) + Math.max(0, (enemy.radius ?? 18) - 18) * 0.55;
}

export function getDefensePushbackTriggerCount(
  previousHp: number,
  currentHp: number,
  maxHp: number,
  alreadyTriggered = 0,
): number {
  const safeMaxHp = Math.max(1, Number(maxHp) || 1);
  const before = Math.max(0, Number(previousHp) || 0);
  const after = Math.max(0, Number(currentHp) || 0);
  const thresholds = [safeMaxHp * (2 / 3), safeMaxHp * (1 / 3)];
  let triggered = Math.max(0, Math.min(thresholds.length, Math.floor(Number(alreadyTriggered) || 0)));

  while (triggered < thresholds.length) {
    const threshold = thresholds[triggered];
    if (threshold === undefined || !(before > threshold && after <= threshold)) break;
    triggered += 1;
  }
  return triggered;
}

export function getDefenseWallPush(
  world: WorldSizeLike,
  objective: Partial<PointLike>,
  enemy: EnemyLike,
  wallThickness = 36,
): DefenseWallPush {
  const width = Math.max(1, Number(world?.w) || 1800);
  const height = Math.max(1, Number(world?.h) || 1120);
  const radius = Math.max(1, Number(enemy.radius) || 18);
  const inset = Math.max(0, Number(wallThickness) || 0) + radius + 8;
  const minX = Math.min(width / 2, inset);
  const maxX = Math.max(width / 2, width - inset);
  const minY = Math.min(height / 2, inset);
  const maxY = Math.max(height / 2, height - inset);
  const enemyX = Number.isFinite(enemy.x) ? Number(enemy.x) : width / 2;
  const enemyY = Number.isFinite(enemy.y) ? Number(enemy.y) : height / 2;
  const originX = Number.isFinite(objective.x) ? Number(objective.x) : width / 2;
  const originY = Number.isFinite(objective.y) ? Number(objective.y) : height / 2;
  let dx = enemyX - originX;
  let dy = enemyY - originY;

  if (Math.hypot(dx, dy) < 0.001) {
    const text = String(enemy.id ?? "0");
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

export interface EnemyCrowdLike {
  readonly id: string | number;
  readonly hp: number;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly elite?: boolean;
}

export interface EnemyStatusLike {
  readonly dead?: boolean;
  readonly hp?: number;
  readonly trainingDummy?: boolean;
  readonly knockbackMove?: unknown;
  readonly chargeMove?: unknown;
  readonly windup?: { readonly kind?: string } | null;
  readonly blockadeRunner?: boolean;
  readonly focusingDefenseObjective?: boolean;
  readonly slowTimer?: number;
  readonly freezeTimer?: number;
  readonly poisonTimer?: number;
  readonly venomTimer?: number;
  readonly burnTimer?: number;
  readonly vulnerableTimer?: number;
  readonly assassinMarkTimer?: number;
  readonly threadMarkTimer?: number;
  readonly barrier?: number;
  readonly barrierTimer?: number;
  readonly tauntTimer?: number;
  readonly elite?: boolean;
}

export interface EnemyTimerLike {
  focusingDefenseObjective?: boolean;
  attackTimer?: number;
  shotTimer?: number;
  healTimer?: number;
  chargeTimer?: number;
  specialTimer?: number;
  eliteSpecialTimer?: number;
  phaseTransitionTimer?: number;
  slowTimer?: number;
  freezeTimer?: number;
  tauntTimer?: number;
  vulnerableTimer?: number;
  assassinMarkTimer?: number;
  threadMarkTimer?: number;
  barrierTimer?: number;
  barrier?: number;
  tauntTargetId?: string | number | null;
  assassinMarkOwnerId?: string | number | null;
  threadMarkOwnerId?: string | number | null;
  threadMarkStacks?: number;
}

export interface EnemyWindupLike {
  kind?: string;
  time: number;
}

export interface EnemyWindupOwnerLike {
  windup?: EnemyWindupLike | null;
}

export interface EnemyWindupTickResult<TWindup> {
  readonly active: boolean;
  readonly ready: boolean;
  readonly windup: TWindup | null;
}

export interface EnemyInterruptLike extends EnemyWindupOwnerLike {
  readonly type?: string;
  readonly elite?: boolean;
  readonly cadenceMul?: number;
  readonly miniBoss?: boolean;
  readonly bossPhase?: number;
  chargeTimer?: number;
  specialTimer?: number;
  attackTimer?: number;
  shotTimer?: number;
  healTimer?: number;
  eliteSpecialTimer?: number;
}

export interface EnemyInterruptOptions<TEnemy> {
  readonly allowBoss?: boolean;
  readonly isEliteSpecialWindup?: (kind: string | undefined) => boolean;
  readonly getEliteSpecialCooldown?: (enemy: TEnemy) => number;
}

export interface EnemyInterruptResult {
  readonly interrupted: boolean;
  readonly kind: string;
}

export interface EnemySupportCastLike {
  readonly elite?: boolean;
  readonly cadenceMul?: number;
}

export interface EnemySupportCastProfile {
  readonly radius: number;
  readonly windupTime: number;
  readonly recoveryTime: number;
}

export interface EnemyRangedCastLike {
  readonly elite?: boolean;
  readonly cadenceMul?: number;
  readonly radius?: number;
}

export interface EnemyRangedCastProfile {
  readonly radius: number;
  readonly windupTime: number;
  readonly recoveryTime: number;
  readonly warningRadius?: number;
  readonly projectileSpeed?: number;
  readonly minRange?: number;
  readonly maxRange?: number;
}

export interface SpecialPatternEnemyLike {
  readonly type?: string;
  readonly miniBoss?: boolean;
  readonly bossPhase?: number;
  readonly cadenceMul?: number;
  readonly rangedPressureMul?: number;
  eliteSpecialTimer?: number;
  chargeTimer?: number;
  shotTimer?: number;
  specialTimer?: number;
  [key: string]: unknown;
}

export function getEnemyCrowdPush(enemies: Iterable<EnemyCrowdLike>, enemy: EnemyCrowdLike): PointLike {
  let x = 0;
  let y = 0;
  for (const other of enemies) {
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

export function getEnemyCollisionMass(enemy: EnemyLike): number {
  let mass = Math.max(0.8, (enemy.radius ?? 18) / 18);
  if (enemy.type === "boss") mass *= 4.2;
  if (enemy.type === "guardian" || enemy.type === "brute") mass *= 1.7;
  if (enemy.type === "charger") mass *= 1.35;
  if (enemy.elite) mass *= 1.45;
  return mass;
}

export function getEnemyStatusEffects(enemy: EnemyStatusLike): string[] {
  const effects: string[] = [];
  if ((enemy.slowTimer ?? 0) > 0) effects.push("slow");
  if ((enemy.freezeTimer ?? 0) > 0) effects.push("freeze");
  if ((enemy.poisonTimer ?? 0) > 0) effects.push("poison");
  if ((enemy.venomTimer ?? 0) > 0) effects.push("venom");
  if ((enemy.burnTimer ?? 0) > 0) effects.push("burn");
  if ((enemy.vulnerableTimer ?? 0) > 0) effects.push("vulnerable");
  if ((enemy.assassinMarkTimer ?? 0) > 0) effects.push("marked");
  if ((enemy.threadMarkTimer ?? 0) > 0) effects.push("threaded");
  if ((enemy.barrier ?? 0) > 0 && (enemy.barrierTimer ?? 0) > 0) effects.push("barrier");
  if ((enemy.tauntTimer ?? 0) > 0) effects.push("taunt");
  if (enemy.elite) effects.push("elite");
  return effects;
}

export function getEnemyWindupChannel(kind: string | undefined): string {
  if (!kind) return "";
  if (kind === "heal" || kind.includes("barrier")) return "support";
  if (kind.includes("snipe") || kind.includes("spit") || kind.includes("mortar") || kind.includes("shuriken") || kind.includes("crossfire") || kind.includes("volley") || kind.includes("ring")) return "ranged";
  if (kind.includes("charge")) return "charge";
  if (kind.includes("cleave") || kind.includes("stab") || kind.includes("swing")) return "melee";
  return "special";
}

export function getEnemyAiState(enemy: EnemyStatusLike): string {
  if (enemy.dead || (enemy.hp ?? 1) <= 0) return "dead";
  if (enemy.trainingDummy) return "idle";
  if ((enemy.freezeTimer ?? 0) > 0) return "frozen";
  if (enemy.knockbackMove) return "recover";
  if (enemy.chargeMove) return "special_attack";
  if (enemy.windup) return "casting";
  if (enemy.blockadeRunner) return "advance";
  if (enemy.focusingDefenseObjective) return "objective";
  if ((enemy.tauntTimer ?? 0) > 0) return "taunted";
  return "chase";
}

export function tickEnemyTimers(enemy: EnemyTimerLike, dt: number): void {
  enemy.focusingDefenseObjective = false;
  enemy.attackTimer = Math.max(0, (enemy.attackTimer ?? 0) - dt);
  enemy.shotTimer = Math.max(0, (enemy.shotTimer ?? 0) - dt);
  enemy.healTimer = Math.max(0, (enemy.healTimer ?? 0) - dt);
  enemy.chargeTimer = Math.max(0, (enemy.chargeTimer ?? 0) - dt);
  enemy.specialTimer = Math.max(0, (enemy.specialTimer ?? 0) - dt);
  enemy.eliteSpecialTimer = Math.max(0, (enemy.eliteSpecialTimer ?? 0) - dt);
  enemy.phaseTransitionTimer = Math.max(0, (enemy.phaseTransitionTimer ?? 0) - dt);
  enemy.slowTimer = Math.max(0, (enemy.slowTimer ?? 0) - dt);
  enemy.freezeTimer = Math.max(0, (enemy.freezeTimer ?? 0) - dt);
  enemy.tauntTimer = Math.max(0, (enemy.tauntTimer ?? 0) - dt);
  enemy.vulnerableTimer = Math.max(0, (enemy.vulnerableTimer ?? 0) - dt);
  enemy.assassinMarkTimer = Math.max(0, (enemy.assassinMarkTimer ?? 0) - dt);
  enemy.threadMarkTimer = Math.max(0, (enemy.threadMarkTimer ?? 0) - dt);

  if ((enemy.barrierTimer ?? 0) > 0) {
    enemy.barrierTimer = Math.max(0, (enemy.barrierTimer ?? 0) - dt);
    if (enemy.barrierTimer <= 0) enemy.barrier = 0;
  }

  if ((enemy.tauntTimer ?? 0) <= 0) enemy.tauntTargetId = null;
  if ((enemy.assassinMarkTimer ?? 0) <= 0) enemy.assassinMarkOwnerId = null;
  if ((enemy.threadMarkTimer ?? 0) <= 0) {
    enemy.threadMarkOwnerId = null;
    enemy.threadMarkStacks = 0;
  }
}

export function advanceEnemyWindup<TEnemy extends EnemyWindupOwnerLike>(
  enemy: TEnemy,
  kind: string,
  dt: number,
): EnemyWindupTickResult<NonNullable<TEnemy["windup"]>> {
  if (!enemy.windup || enemy.windup.kind !== kind) {
    return { active: false, ready: false, windup: null };
  }

  enemy.windup.time -= dt;
  if (enemy.windup.time > 0) {
    return { active: true, ready: false, windup: enemy.windup as NonNullable<TEnemy["windup"]> };
  }

  const windup = enemy.windup as NonNullable<TEnemy["windup"]>;
  enemy.windup = null;
  return { active: true, ready: true, windup };
}

export function isInterruptibleWindupKind(
  kind: string | undefined,
  isEliteSpecialWindup: (kind: string | undefined) => boolean = () => false,
): boolean {
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

export function isEliteSpecialWindupKind(kind: string | undefined): boolean {
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

function getInterruptedWindupCooldown<TEnemy extends EnemyInterruptLike>(
  enemy: TEnemy,
  kind: string | undefined,
  options: EnemyInterruptOptions<TEnemy> = {},
): { field: "chargeTimer" | "specialTimer" | "attackTimer" | "shotTimer" | "healTimer" | "eliteSpecialTimer"; value: number } | null {
  const cadence = enemy.cadenceMul ?? 1;
  if (kind === "charge") return { field: "chargeTimer", value: (enemy.type === "boss" ? 1.25 : enemy.elite ? 1.05 : 1.35) * cadence };
  if (kind === "guardian_barrier") return { field: "specialTimer", value: (enemy.elite ? 1.0 : 1.25) * cadence };
  if (kind === "stalk" || kind === "stalker_stab" || kind === "stalker_shuriken") return { field: "specialTimer", value: (enemy.elite ? 1.05 : 1.4) * cadence };
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

export function interruptEnemyWindup<TEnemy extends EnemyInterruptLike>(
  enemy: TEnemy,
  options: EnemyInterruptOptions<TEnemy> = {},
): EnemyInterruptResult {
  if (!enemy.windup) return { interrupted: false, kind: "" };
  if (enemy.type === "boss" && !options.allowBoss) return { interrupted: false, kind: enemy.windup.kind ?? "" };
  const kind = enemy.windup.kind;
  if (!isInterruptibleWindupKind(kind, options.isEliteSpecialWindup)) return { interrupted: false, kind: kind ?? "" };

  enemy.windup = null;
  const cooldown = getInterruptedWindupCooldown(enemy, kind, options);
  if (cooldown) {
    enemy[cooldown.field] = Math.max(enemy[cooldown.field] ?? 0, cooldown.value);
  }
  return { interrupted: true, kind: kind ?? "" };
}

export function getChargeDashCooldown(enemy: EnemyInterruptLike): number {
  return (
    enemy.type === "boss"
      ? enemy.miniBoss
        ? 2.15
        : (enemy.bossPhase ?? 1) >= 3
          ? 1.85
          : (enemy.bossPhase ?? 1) >= 2
            ? 2.25
            : 2.65
      : enemy.elite
        ? 3.55
        : 4.35
  ) * (enemy.cadenceMul ?? 1);
}

export function getSupportCastProfile(enemy: EnemySupportCastLike, kind: string): EnemySupportCastProfile {
  const cadence = enemy.cadenceMul ?? 1;
  if (kind === "heal") {
    return {
      radius: enemy.elite ? 190 : 160,
      windupTime: (enemy.elite ? 0.78 : 1.05) * Math.max(0.88, cadence),
      recoveryTime: (enemy.elite ? 2.25 : 2.95) * cadence,
    };
  }
  if (kind === "guardian_barrier") {
    return {
      radius: enemy.elite ? 255 : 220,
      windupTime: (enemy.elite ? 0.62 : 0.78) * Math.max(0.9, cadence),
      recoveryTime: (enemy.elite ? 3.0 : 3.65) * cadence,
    };
  }
  return {
    radius: 0,
    windupTime: Math.max(0.1, cadence),
    recoveryTime: Math.max(0.1, cadence),
  };
}

export function getRangedCastProfile(enemy: EnemyRangedCastLike, kind: string, pressureMul = 1): EnemyRangedCastProfile {
  const cadence = enemy.cadenceMul ?? 1;
  if (kind === "mortar") {
    return {
      radius: enemy.elite ? 108 : 86,
      windupTime: (enemy.elite ? 1.08 : 1.34) * Math.max(0.95, cadence) * Math.min(1.18, pressureMul),
      recoveryTime: (enemy.elite ? 2.72 : 3.36) * cadence * pressureMul,
      warningRadius: enemy.elite ? 108 : 86,
    };
  }
  if (kind === "snipe") {
    return {
      radius: 42,
      windupTime: (enemy.elite ? 1.02 : 1.2) * Math.max(0.94, cadence) * Math.min(1.16, pressureMul),
      recoveryTime: (enemy.elite ? 2.35 : 3.05) * cadence * pressureMul,
      projectileSpeed: enemy.elite ? 820 : 730,
      minRange: 180,
      maxRange: 820,
    };
  }
  if (kind === "spit") {
    return {
      radius: (enemy.radius ?? 18) + 34,
      windupTime: (enemy.elite ? 0.43 : 0.54) * Math.max(0.94, cadence) * Math.min(1.12, pressureMul),
      recoveryTime: (enemy.elite ? 1.28 : 1.72) * cadence * pressureMul,
      maxRange: 560,
    };
  }
  return {
    radius: 0,
    windupTime: Math.max(0.1, cadence),
    recoveryTime: Math.max(0.1, cadence),
  };
}

export function allowSpecialPatternNow(enemy: SpecialPatternEnemyLike, channel: string): boolean {
  const key = `${channel}PatternStep`;
  const current = typeof enemy[key] === "number" ? enemy[key] as number : 0;
  enemy[key] = (current % SPECIAL_PATTERN_CYCLE) + 1;
  if (SPECIAL_PATTERN_STEPS.has(enemy[key] as number)) return true;
  deferSpecialPattern(enemy, channel);
  return false;
}

export function deferSpecialPattern(enemy: SpecialPatternEnemyLike, channel: string): void {
  setSpecialPatternTimer(enemy, channel, getBasicPatternWindow(enemy, channel));
}

export function setSpecialPatternTimer(enemy: SpecialPatternEnemyLike, channel: string, seconds: number): void {
  const value = Math.max(0.18, seconds) * Math.max(0.78, enemy.cadenceMul ?? 1);
  if (channel === "elite") {
    enemy.eliteSpecialTimer = Math.max(enemy.eliteSpecialTimer ?? 0, value);
    return;
  }
  if (channel.includes("charge")) {
    enemy.chargeTimer = Math.max(enemy.chargeTimer ?? 0, value);
    return;
  }
  if (channel.includes("shot")) {
    enemy.shotTimer = Math.max(enemy.shotTimer ?? 0, value);
    return;
  }
  enemy.specialTimer = Math.max(enemy.specialTimer ?? 0, value);
}

export function getBasicPatternWindow(enemy: SpecialPatternEnemyLike, channel: string): number {
  if (channel === "elite") {
    if (enemy.type === "sniper" || enemy.type === "mortar") return 1.75;
    if (enemy.type === "charger" || enemy.type === "stalker") return 1.45;
    return 1.32;
  }
  if (channel.includes("charge")) return enemy.miniBoss ? 1.55 : 1.85;
  if (channel.includes("shot")) return enemy.miniBoss ? 1.65 : 1.95;
  if (enemy.miniBoss) return 1.38;
  if ((enemy.bossPhase ?? 0) >= 3) return 1.55;
  if ((enemy.bossPhase ?? 0) >= 2) return 1.7;
  return 1.85;
}

export function getSpecialPatternCooldownMultiplier(enemy: SpecialPatternEnemyLike, channel: string): number {
  if (channel === "elite") return 1.22;
  if (enemy.miniBoss) return 1.3;
  return (enemy.bossPhase ?? 0) >= 3 ? 1.18 : 1.26;
}

export function getEliteSpecialCooldown(enemy: SpecialPatternEnemyLike): number {
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
  return base * Math.max(0.72, enemy.cadenceMul ?? 1) * (enemy.rangedPressureMul ?? 1);
}
