export interface SerializableRoomLike {
  readonly status: string;
  readonly hostId: string | null;
  readonly mapDeadline?: number;
  readonly choiceDeadline?: number;
  readonly advancementDeadline?: number;
  readonly restartAt?: number;
}

export interface RoomTimerView {
  readonly mapTimeLeft: number;
  readonly choiceTimeLeft: number;
  readonly advancementTimeLeft: number;
  readonly restartIn: number;
}

export interface RoomCapabilityOptions {
  readonly activePlayerCount: number;
  readonly botCount: number;
  readonly maxPlayers: number;
  readonly allReady: boolean;
}

export interface RoomCapabilityView {
  readonly canStart: boolean;
  readonly canReturnLobby: boolean;
  readonly canManageBots: boolean;
  readonly canAddBot: boolean;
  readonly canRemoveBot: boolean;
}

export interface RoomIdentityLike {
  readonly code: string;
  readonly wave: number;
  readonly floor: number;
  readonly status: string;
  readonly hostId: string | null;
}

export interface RoomIdentityViewOptions {
  readonly maxChapters: number;
  readonly hostName: string;
}

export interface RoomIdentityView {
  readonly code: string;
  readonly wave: number;
  readonly floor: number;
  readonly chapter: number;
  readonly maxChapters: number;
  readonly status: string;
  readonly hostId: string | null;
  readonly hostName: string;
}

export interface RoomPopulationViewOptions {
  readonly readyCount: number;
  readonly allReady: boolean;
  readonly choicePending: number;
  readonly advancementPending: number;
  readonly botCount: number;
  readonly canManageBots: boolean;
  readonly canAddBot: boolean;
  readonly canRemoveBot: boolean;
  readonly playerCount: number;
  readonly activePlayerCount: number;
  readonly spectatorCount: number;
  readonly maxPlayers: number;
}

export interface RoomPopulationView extends RoomPopulationViewOptions {}

export interface RoomStageSummaryLike {
  readonly threatLevel?: number;
}

export interface RoomStageSummaryViewOptions {
  readonly activeRisk: unknown;
  readonly stageModifier?: unknown;
  readonly waveTrait: unknown;
  readonly stageKind: string;
  readonly stage: unknown;
}

export interface RoomStageSummaryView {
  readonly canChooseRisk: boolean;
  readonly riskChoices: readonly unknown[];
  readonly activeRisk: unknown;
  readonly stageModifier: unknown;
  readonly waveTrait: unknown;
  readonly threatLevel: number;
  readonly stageKind: string;
  readonly stage: unknown;
}

export interface ProjectileLike {
  readonly id: string | number;
  readonly classId: string;
  readonly x: number;
  readonly y: number;
  readonly vx?: number;
  readonly vy?: number;
  readonly radius: number;
  readonly hostile?: boolean;
  readonly style?: string;
  readonly poison?: boolean | number;
  readonly splash?: number;
  readonly pierce?: number;
}

export interface ProjectileView {
  readonly id: string | number;
  readonly classId: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hostile: boolean;
  readonly angle: number;
  readonly style: string;
  readonly poison: boolean;
  readonly splash: number;
  readonly pierce: number;
}

export interface MovementLike {
  readonly key?: string;
  readonly style?: string;
  readonly elapsed: number;
  readonly duration: number;
  readonly startX?: number;
  readonly startY?: number;
  readonly x?: number;
  readonly y?: number;
}

export interface MovementView {
  readonly active: true;
  readonly key?: string;
  readonly style?: string;
  readonly progress: number;
  readonly fromX?: number;
  readonly fromY?: number;
  readonly toX?: number;
  readonly toY?: number;
}

export interface EnemyDefinitionLike {
  readonly label: string;
  readonly color: string;
}

export interface EnemyLike {
  readonly id: string | number;
  readonly type: string;
  readonly label?: string;
  readonly color?: string;
  readonly bossId?: string;
  readonly bossPattern?: string;
  readonly currentBossPattern?: string;
  readonly bossPhase?: number;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly barrier?: number;
  readonly radius: number;
  readonly role?: string;
  readonly blockadeRunner?: boolean;
  readonly elite?: boolean;
  readonly affix?: string;
  readonly windup?: unknown;
  readonly chargeMove?: MovementLike | null;
  readonly knockbackMove?: MovementLike | null;
}

export interface EnemyView {
  readonly id: string | number;
  readonly type: string;
  readonly label: string;
  readonly color: string;
  readonly bossId: string;
  readonly bossPattern: string;
  readonly currentBossPattern: string;
  readonly bossPhase: number;
  readonly x: number;
  readonly y: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly barrier: number;
  readonly radius: number;
  readonly role: string | undefined;
  readonly blockadeRunner: boolean;
  readonly elite: boolean;
  readonly affix: string;
  readonly statusEffects: readonly string[];
  readonly windup: unknown;
  readonly chargeMove: MovementView | null;
  readonly knockbackMove: MovementView | null;
}

export interface EnemyViewOptions {
  readonly enemyDefs: Record<string, EnemyDefinitionLike>;
  readonly getStatusEffects?: (enemy: EnemyLike) => readonly string[];
}

export interface HazardLike {
  readonly id: string | number;
  readonly type: string;
  readonly mode?: string;
  readonly style?: string;
  readonly small?: boolean;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly angle?: number;
  readonly length?: number;
  readonly width?: number;
  readonly timer: number;
  readonly armTime?: number;
  readonly armTimeMax?: number;
  readonly spawnFromX?: number;
  readonly spawnFromY?: number;
  readonly moveFromX?: number;
  readonly moveFromY?: number;
  readonly moveTime?: number;
  readonly moveTimeMax?: number;
  readonly hostile?: boolean;
  readonly color?: string;
}

export interface HazardView {
  readonly id: string | number;
  readonly type: string;
  readonly mode: string;
  readonly style: string;
  readonly small: boolean;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly angle: number;
  readonly length: number;
  readonly width: number;
  readonly timer: number;
  readonly armTime: number;
  readonly armTimeMax: number;
  readonly spawnFromX: number | null;
  readonly spawnFromY: number | null;
  readonly moveFromX: number | null;
  readonly moveFromY: number | null;
  readonly moveTime: number;
  readonly moveTimeMax: number;
  readonly armed: boolean;
  readonly hostile: boolean;
  readonly color: string;
}

export interface RelicChestLike {
  readonly id: string | number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface RelicChestView extends RelicChestLike {}

export interface XpOrbLike {
  readonly id: string | number;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly value: number;
}

export interface XpOrbView extends XpOrbLike {}

export interface StageNodeMetaLike {
  readonly label?: string;
}

export interface StageObjectiveLike {
  readonly type: string;
  readonly label?: string;
  readonly text?: string;
  readonly x?: number;
  readonly y?: number;
  readonly radius?: number;
  readonly hp?: number;
  readonly maxHp?: number;
  readonly total?: number;
  readonly remaining?: number;
  readonly spawned?: number;
  readonly defeated?: number;
  readonly leaked?: number;
  readonly leakLimit?: number;
  readonly goalX?: number;
  readonly laneTop?: number;
  readonly laneBottom?: number;
  readonly laneCount?: number;
}

export interface StageObjectiveView {
  readonly type: string;
  readonly label: string;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly total: number;
  readonly remaining: number;
  readonly spawned: number;
  readonly defeated: number;
  readonly leaked: number;
  readonly leakLimit: number;
  readonly goalX: number;
  readonly laneTop: number;
  readonly laneBottom: number;
  readonly laneCount: number;
}

export interface StageObjectiveViewOptions {
  readonly stageNodeMeta?: Record<string, StageNodeMetaLike>;
}

export interface SkillSlotPlayerLike {
  readonly classId: string;
  readonly skillTimers: Record<string, number>;
}

export interface SkillSlotUpgradeLike {
  readonly id: string;
  readonly name: string;
}

export interface SkillSlotViewOptions<TPlayer extends SkillSlotPlayerLike> {
  readonly getUnlockedSlotUpgrade: (player: TPlayer, slot: string) => SkillSlotUpgradeLike | undefined;
  readonly getSkillCooldown: (player: TPlayer, slot: string) => number;
  readonly getPrimarySkillName: (player: TPlayer) => string;
  readonly getSkillIcon: (id: string) => string;
}

export interface SkillSlotView {
  readonly id: string;
  readonly slot: string;
  readonly key: string;
  readonly unlocked: boolean;
  readonly name: string;
  readonly icon: string;
  readonly cooldown: number;
  readonly cooldownMax: number;
  readonly ready: boolean;
}

export interface ClassVisualLike {
  readonly icon?: string;
  readonly color?: string;
}

export interface PlayerIdentityLike {
  readonly id: string;
  readonly name: string;
  readonly bot?: boolean;
  readonly spectator?: boolean;
  readonly classId: string;
}

export interface PlayerIdentityViewOptions {
  readonly classDef?: ClassVisualLike;
  readonly classLabel: string;
  readonly passive: unknown;
}

export interface PlayerIdentityView {
  readonly id: string;
  readonly name: string;
  readonly bot: boolean;
  readonly spectator: boolean;
  readonly classId: string;
  readonly classLabel: string;
  readonly passive: unknown;
  readonly icon: string;
  readonly color: string;
}

export interface PlayerPositionLike {
  readonly x: number;
  readonly y: number;
}

export interface PlayerPositionView {
  readonly x: number;
  readonly y: number;
}

export interface PlayerInputLike {
  readonly x: number;
  readonly y: number;
  readonly input?: {
    readonly aimX?: number;
    readonly aimY?: number;
    readonly mx?: number;
    readonly my?: number;
    readonly attacking?: boolean;
  };
}

export interface PlayerInputView {
  readonly aimX: number;
  readonly aimY: number;
  readonly facing: number;
  readonly moveX: number;
  readonly moveY: number;
  readonly attacking: boolean;
}

export interface PlayerVitalsLike {
  readonly hp: number;
  readonly maxHp: number;
  readonly shield: number;
  readonly speedMul: number;
  readonly hitIFrameTimer?: number;
  readonly tauntGuardTimer?: number;
  readonly martialChi?: number;
}

export interface PlayerVitalsViewOptions {
  readonly classSpeed: number;
  readonly sizeScale: number;
  readonly martialChiMax: number;
}

export interface PlayerVitalsView {
  readonly speed: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly shield: number;
  readonly hitIFrameTime: number;
  readonly sizeScale: number;
  readonly tauntGuardTime: number;
  readonly martialChi: number;
  readonly martialChiMax: number;
}

export interface PlayerProgressionLike {
  readonly level: number;
  readonly xp: number;
  readonly score: number;
  readonly relics: readonly unknown[];
  readonly jobTier: number;
}

export interface RelicStackLike {
  readonly current: number;
  readonly max: number;
}

export interface PlayerProgressionViewOptions {
  readonly maxLevel: number;
  readonly xpNext: number;
  readonly relicStacks: RelicStackLike;
  readonly nextAdvancementLevel: number | null;
}

export interface PlayerProgressionView {
  readonly level: number;
  readonly maxLevel: number;
  readonly xp: number;
  readonly xpNext: number;
  readonly score: number;
  readonly relicCount: number;
  readonly relicMaxCount: number;
  readonly uniqueRelicCount: number;
  readonly jobTier: number;
  readonly nextAdvancementLevel: number | null;
}

export interface PlayerLoadoutLike<TSkillChoice = unknown> {
  readonly relics: readonly unknown[];
  readonly skillUpgrades: readonly string[];
  readonly pendingSkillChoices: readonly TSkillChoice[];
  readonly choicePending?: boolean;
}

export interface PlayerLoadoutViewOptions<TSkillChoice = unknown, TSkillChoiceView = unknown> {
  readonly isSelf: boolean;
  readonly skillUpgradeName: (upgradeId: string) => string;
  readonly skillChoiceView: (choice: TSkillChoice) => TSkillChoiceView;
}

export interface PlayerLoadoutView<TSkillChoiceView = unknown> {
  readonly relics: readonly unknown[];
  readonly skillUpgrades: readonly string[];
  readonly skillUpgradeNames: readonly string[];
  readonly pendingSkillChoices: readonly TSkillChoiceView[];
  readonly choicePending: boolean;
}

export interface PlayerActionStateLike {
  readonly hp: number;
  readonly skillTimers: Record<string, number>;
  readonly dashCharges?: number;
  readonly dashRechargeTimer?: number;
  readonly ready?: boolean;
  readonly lastAttackAt: number;
  readonly lastSkillAt: number;
  readonly lastDashAt: number;
}

export interface PlayerActionStateViewOptions {
  readonly dashReady: boolean;
  readonly dashCooldown: number;
  readonly dashMaxCharges: number;
}

export interface PlayerActionStateView {
  readonly downed: boolean;
  readonly skillReady: boolean;
  readonly skillCooldown: number;
  readonly dashReady: boolean;
  readonly dashCooldown: number;
  readonly dashCharges: number;
  readonly dashMaxCharges: number;
  readonly dashRechargeCooldown: number;
  readonly ready: boolean;
  readonly lastAttackAt: number;
  readonly lastSkillAt: number;
  readonly lastDashAt: number;
}

export interface RunResultPlayerLike {
  readonly id: string;
  readonly name: string;
  readonly level: number;
  readonly score: number;
  readonly relics: readonly unknown[];
  readonly hp: number;
}

export interface RunResultPlayerViewOptions {
  readonly classLabel: string;
  readonly relicStacks: RelicStackLike;
}

export interface RunResultPlayerView {
  readonly id: string;
  readonly name: string;
  readonly classLabel: string;
  readonly level: number;
  readonly score: number;
  readonly relicCount: number;
  readonly relicMaxCount: number;
  readonly uniqueRelicCount: number;
  readonly downed: boolean;
}

export interface RunResultRoomLike {
  readonly floor: number;
  readonly wave: number;
}

export interface RunResultSummaryViewOptions {
  readonly outcome: string;
  readonly message: string;
  readonly maxChapters: number;
  readonly stagesCleared: number;
  readonly totalStages: number;
  readonly durationSec: number;
  readonly totalScore: number;
  readonly totalRelics: number;
  readonly totalRelicMax: number;
  readonly highestLevel: number;
  readonly players: readonly RunResultPlayerView[];
}

export interface RunResultSummaryView extends RunResultSummaryViewOptions {
  readonly title: string;
  readonly chapter: number;
  readonly floor: number;
  readonly wave: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round1(value: number): number {
  return Number(value.toFixed(1));
}

export function secondsUntil(deadline: number | undefined, now = Date.now()): number {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function getRoomTimers(room: SerializableRoomLike, now = Date.now()): RoomTimerView {
  return {
    mapTimeLeft: room.status === "map" ? secondsUntil(room.mapDeadline, now) : 0,
    choiceTimeLeft: room.status === "choice" ? secondsUntil(room.choiceDeadline, now) : 0,
    advancementTimeLeft: room.status === "advancement" ? secondsUntil(room.advancementDeadline, now) : 0,
    restartIn: room.status === "gameover" ? secondsUntil(room.restartAt, now) : 0,
  };
}

export function getRoomCapabilities(
  room: SerializableRoomLike,
  selfId: string,
  options: RoomCapabilityOptions,
): RoomCapabilityView {
  return {
    canStart: selfId === room.hostId && room.status === "lobby" && options.allReady,
    canReturnLobby: room.status === "gameover",
    canManageBots: selfId === room.hostId && room.status === "lobby",
    canAddBot: selfId === room.hostId && room.status === "lobby" && options.activePlayerCount < options.maxPlayers,
    canRemoveBot: selfId === room.hostId && room.status === "lobby" && options.botCount > 0,
  };
}

export function roomIdentityView(room: RoomIdentityLike, options: RoomIdentityViewOptions): RoomIdentityView {
  return {
    code: room.code,
    wave: room.wave,
    floor: room.floor,
    chapter: room.floor,
    maxChapters: options.maxChapters,
    status: room.status,
    hostId: room.hostId,
    hostName: options.hostName,
  };
}

export function roomPopulationView(options: RoomPopulationViewOptions): RoomPopulationView {
  return {
    readyCount: options.readyCount,
    allReady: options.allReady,
    choicePending: options.choicePending,
    advancementPending: options.advancementPending,
    botCount: options.botCount,
    canManageBots: options.canManageBots,
    canAddBot: options.canAddBot,
    canRemoveBot: options.canRemoveBot,
    playerCount: options.playerCount,
    activePlayerCount: options.activePlayerCount,
    spectatorCount: options.spectatorCount,
    maxPlayers: options.maxPlayers,
  };
}

export function roomStageSummaryView(
  room: RoomStageSummaryLike,
  options: RoomStageSummaryViewOptions,
): RoomStageSummaryView {
  return {
    canChooseRisk: false,
    riskChoices: [],
    activeRisk: options.activeRisk,
    stageModifier: options.stageModifier ?? options.activeRisk,
    waveTrait: options.waveTrait,
    threatLevel: round2(room.threatLevel || 1),
    stageKind: options.stageKind,
    stage: options.stage,
  };
}

export function projectileView(projectile: ProjectileLike): ProjectileView {
  return {
    id: projectile.id,
    classId: projectile.classId,
    x: round2(projectile.x),
    y: round2(projectile.y),
    radius: projectile.radius,
    hostile: Boolean(projectile.hostile),
    angle: round2(Math.atan2(projectile.vy || 0, projectile.vx || 1)),
    style: projectile.style || "",
    poison: Boolean(projectile.poison),
    splash: round2(projectile.splash || 0),
    pierce: projectile.pierce || 0,
  };
}

export function projectileViews(projectiles: Iterable<ProjectileLike>): ProjectileView[] {
  return [...projectiles].map(projectileView);
}

export function movementView(move: MovementLike | null | undefined, includeKey = false): MovementView | null {
  if (!move) return null;
  const view: {
    active: true;
    key?: string;
    style?: string;
    progress: number;
    fromX?: number;
    fromY?: number;
    toX?: number;
    toY?: number;
  } = {
    active: true,
    progress: round2(move.elapsed / Math.max(0.01, move.duration)),
  };
  if (includeKey) view.key = move.key || "";
  if (move.style !== undefined) view.style = move.style || "";
  if (move.startX !== undefined) {
    view.fromX = round2(move.startX);
    view.fromY = round2(move.startY ?? 0);
    view.toX = round2(move.x ?? 0);
    view.toY = round2(move.y ?? 0);
  }
  return view;
}

export function enemyView(enemy: EnemyLike, options: EnemyViewOptions): EnemyView {
  const def = options.enemyDefs[enemy.type]!;
  const getStatusEffects = options.getStatusEffects ?? (() => []);
  return {
    id: enemy.id,
    type: enemy.type,
    label: enemy.label || def.label,
    color: enemy.color || def.color,
    bossId: enemy.bossId || "",
    bossPattern: enemy.bossPattern || "",
    currentBossPattern: enemy.currentBossPattern || "",
    bossPhase: enemy.bossPhase || 0,
    x: round2(enemy.x),
    y: round2(enemy.y),
    hp: Math.max(0, Math.ceil(enemy.hp)),
    maxHp: enemy.maxHp,
    barrier: Math.max(0, Math.ceil(enemy.barrier || 0)),
    radius: enemy.radius,
    role: enemy.role,
    blockadeRunner: Boolean(enemy.blockadeRunner),
    elite: Boolean(enemy.elite),
    affix: enemy.affix || "",
    statusEffects: getStatusEffects(enemy),
    windup: enemy.windup,
    chargeMove: movementView(enemy.chargeMove, true),
    knockbackMove: movementView(enemy.knockbackMove, true),
  };
}

export function enemyViews(enemies: Iterable<EnemyLike>, options: EnemyViewOptions): EnemyView[] {
  return [...enemies].map((enemy) => enemyView(enemy, options));
}

export function hazardView(hazard: HazardLike): HazardView {
  return {
    id: hazard.id,
    type: hazard.type,
    mode: hazard.mode || "",
    style: hazard.style || "",
    small: Boolean(hazard.small),
    x: round2(hazard.x),
    y: round2(hazard.y),
    radius: hazard.radius,
    angle: round2(hazard.angle || 0),
    length: round2(hazard.length || 0),
    width: round2(hazard.width || 0),
    timer: round2(hazard.timer),
    armTime: round2(hazard.armTime || 0),
    armTimeMax: round2(hazard.armTimeMax || hazard.armTime || 0),
    spawnFromX: Number.isFinite(hazard.spawnFromX) ? round2(hazard.spawnFromX as number) : null,
    spawnFromY: Number.isFinite(hazard.spawnFromY) ? round2(hazard.spawnFromY as number) : null,
    moveFromX: Number.isFinite(hazard.moveFromX) ? round2(hazard.moveFromX as number) : null,
    moveFromY: Number.isFinite(hazard.moveFromY) ? round2(hazard.moveFromY as number) : null,
    moveTime: round2(hazard.moveTime || 0),
    moveTimeMax: round2(hazard.moveTimeMax || hazard.moveTime || 0),
    armed: !hazard.armTime || hazard.armTime <= 0,
    hostile: Boolean(hazard.hostile),
    color: hazard.color || "",
  };
}

export function hazardViews(hazards: Iterable<HazardLike>): HazardView[] {
  return [...hazards].map(hazardView);
}

export function relicChestView(chest: RelicChestLike): RelicChestView {
  return {
    id: chest.id,
    x: round2(chest.x),
    y: round2(chest.y),
    radius: chest.radius,
  };
}

export function relicChestViews(chests: Iterable<RelicChestLike>): RelicChestView[] {
  return [...chests].map(relicChestView);
}

export function xpOrbView(orb: XpOrbLike): XpOrbView {
  return {
    id: orb.id,
    x: round2(orb.x),
    y: round2(orb.y),
    radius: orb.radius,
    value: orb.value,
  };
}

export function xpOrbViews(orbs: Iterable<XpOrbLike>): XpOrbView[] {
  return [...orbs].map(xpOrbView);
}

export function stageObjectiveView(
  objective: StageObjectiveLike | null | undefined,
  options: StageObjectiveViewOptions = {},
): StageObjectiveView | null {
  if (!objective) return null;
  const stageNodeMeta = options.stageNodeMeta || {};
  return {
    type: objective.type,
    label: objective.label || stageNodeMeta[objective.type]?.label || "",
    text: objective.text || "",
    x: round2(objective.x || 0),
    y: round2(objective.y || 0),
    radius: round2(objective.radius || 0),
    hp: Math.ceil(objective.hp || 0),
    maxHp: Math.ceil(objective.maxHp || 0),
    total: objective.total || 0,
    remaining: objective.remaining || 0,
    spawned: objective.spawned || 0,
    defeated: objective.defeated || 0,
    leaked: objective.leaked || 0,
    leakLimit: objective.leakLimit || 0,
    goalX: round2(objective.goalX || 0),
    laneTop: round2(objective.laneTop || 0),
    laneBottom: round2(objective.laneBottom || 0),
    laneCount: objective.laneCount || 0,
  };
}

export function skillSlotView<TPlayer extends SkillSlotPlayerLike>(
  player: TPlayer,
  slot: string,
  options: SkillSlotViewOptions<TPlayer>,
): SkillSlotView {
  const upgrade = options.getUnlockedSlotUpgrade(player, slot);
  const unlocked = slot === "q" || Boolean(upgrade);
  const cooldownMax = options.getSkillCooldown(player, slot);
  const id = slot === "q" ? `${player.classId}_primary` : upgrade ? upgrade.id : "";
  return {
    id,
    slot: slot.toUpperCase(),
    key: slot,
    unlocked,
    name: slot === "q" ? options.getPrimarySkillName(player) : upgrade ? upgrade.name : "잠김",
    icon: unlocked ? options.getSkillIcon(id) : "",
    cooldown: round1(player.skillTimers[slot] ?? 0),
    cooldownMax: round1(cooldownMax),
    ready: unlocked && (player.skillTimers[slot] ?? 0) <= 0,
  };
}

export function skillSlotViews<TPlayer extends SkillSlotPlayerLike>(
  player: TPlayer,
  slots: readonly string[],
  options: SkillSlotViewOptions<TPlayer>,
): SkillSlotView[] {
  return slots.map((slot) => skillSlotView(player, slot, options));
}

export function playerIdentityView(
  player: PlayerIdentityLike,
  options: PlayerIdentityViewOptions,
): PlayerIdentityView {
  return {
    id: player.id,
    name: player.name,
    bot: Boolean(player.bot),
    spectator: Boolean(player.spectator),
    classId: player.classId,
    classLabel: options.classLabel,
    passive: options.passive,
    icon: options.classDef?.icon || "",
    color: options.classDef?.color || "",
  };
}

export function playerPositionView(player: PlayerPositionLike): PlayerPositionView {
  return {
    x: round2(player.x),
    y: round2(player.y),
  };
}

export function playerInputView(player: PlayerInputLike): PlayerInputView {
  const aimX = Number.isFinite(player.input?.aimX) ? Number(player.input?.aimX) : player.x + 1;
  const aimY = Number.isFinite(player.input?.aimY) ? Number(player.input?.aimY) : player.y;
  const moveX = Number.isFinite(player.input?.mx) ? Number(player.input?.mx) : 0;
  const moveY = Number.isFinite(player.input?.my) ? Number(player.input?.my) : 0;
  return {
    aimX: round2(aimX),
    aimY: round2(aimY),
    facing: round2(Math.atan2(aimY - player.y, aimX - player.x)),
    moveX: round2(moveX),
    moveY: round2(moveY),
    attacking: Boolean(player.input?.attacking),
  };
}

export function playerVitalsView(player: PlayerVitalsLike, options: PlayerVitalsViewOptions): PlayerVitalsView {
  return {
    speed: round2(options.classSpeed * player.speedMul),
    hp: Math.ceil(player.hp),
    maxHp: player.maxHp,
    shield: Math.ceil(player.shield),
    hitIFrameTime: round2(player.hitIFrameTimer || 0),
    sizeScale: round2(options.sizeScale),
    tauntGuardTime: round2(player.tauntGuardTimer || 0),
    martialChi: round2(player.martialChi || 0),
    martialChiMax: options.martialChiMax,
  };
}

export function playerProgressionView(
  player: PlayerProgressionLike,
  options: PlayerProgressionViewOptions,
): PlayerProgressionView {
  return {
    level: player.level,
    maxLevel: options.maxLevel,
    xp: player.xp,
    xpNext: options.xpNext,
    score: player.score,
    relicCount: options.relicStacks.current,
    relicMaxCount: options.relicStacks.max,
    uniqueRelicCount: player.relics.length,
    jobTier: player.jobTier,
    nextAdvancementLevel: options.nextAdvancementLevel,
  };
}

export function playerLoadoutView<TSkillChoice, TSkillChoiceView>(
  player: PlayerLoadoutLike<TSkillChoice>,
  options: PlayerLoadoutViewOptions<TSkillChoice, TSkillChoiceView>,
): PlayerLoadoutView<TSkillChoiceView> {
  return {
    relics: options.isSelf ? player.relics : [],
    skillUpgrades: player.skillUpgrades,
    skillUpgradeNames: player.skillUpgrades.map(options.skillUpgradeName),
    pendingSkillChoices: options.isSelf ? player.pendingSkillChoices.map(options.skillChoiceView) : [],
    choicePending: Boolean(player.choicePending),
  };
}

export function playerActionStateView(
  player: PlayerActionStateLike,
  options: PlayerActionStateViewOptions,
): PlayerActionStateView {
  return {
    downed: player.hp <= 0,
    skillReady: (player.skillTimers.q ?? 0) <= 0,
    skillCooldown: round1(player.skillTimers.q ?? 0),
    dashReady: options.dashReady,
    dashCooldown: round1(options.dashCooldown),
    dashCharges: player.dashCharges ?? options.dashMaxCharges,
    dashMaxCharges: options.dashMaxCharges,
    dashRechargeCooldown: round1(player.dashRechargeTimer || 0),
    ready: Boolean(player.ready),
    lastAttackAt: player.lastAttackAt,
    lastSkillAt: player.lastSkillAt,
    lastDashAt: player.lastDashAt,
  };
}

export function runResultPlayerView(
  player: RunResultPlayerLike,
  options: RunResultPlayerViewOptions,
): RunResultPlayerView {
  return {
    id: player.id,
    name: player.name,
    classLabel: options.classLabel,
    level: player.level,
    score: player.score,
    relicCount: options.relicStacks.current,
    relicMaxCount: options.relicStacks.max,
    uniqueRelicCount: player.relics.length,
    downed: player.hp <= 0,
  };
}

export function runResultSummaryView(
  room: RunResultRoomLike,
  options: RunResultSummaryViewOptions,
): RunResultSummaryView {
  return {
    outcome: options.outcome,
    title: options.outcome === "victory" ? "스테이지 완전 클리어" : "스테이지 실패",
    message: options.message,
    chapter: room.floor,
    maxChapters: options.maxChapters,
    floor: room.floor,
    wave: room.wave,
    stagesCleared: options.stagesCleared,
    totalStages: options.totalStages,
    durationSec: options.durationSec,
    totalScore: options.totalScore,
    totalRelics: options.totalRelics,
    totalRelicMax: options.totalRelicMax,
    highestLevel: options.highestLevel,
    players: options.players,
  };
}
