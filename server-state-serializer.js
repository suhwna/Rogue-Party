function secondsUntil(deadline, now = Date.now()) {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

function getRoomTimers(room, now = Date.now()) {
  return {
    mapTimeLeft: room.status === "map" ? secondsUntil(room.mapDeadline, now) : 0,
    choiceTimeLeft: room.status === "choice" ? secondsUntil(room.choiceDeadline, now) : 0,
    advancementTimeLeft: room.status === "advancement" ? secondsUntil(room.advancementDeadline, now) : 0,
    restartIn: room.status === "gameover" ? secondsUntil(room.restartAt, now) : 0
  };
}

function getRoomCapabilities(room, selfId, options = {}) {
  const activePlayers = options.activePlayers || [];
  const botPlayers = options.botPlayers || [];
  const maxPlayers = options.maxPlayers || 4;
  const allReady = Boolean(options.allReady);

  return {
    canStart: selfId === room.hostId && room.status === "lobby" && allReady,
    canReturnLobby: room.status === "gameover",
    canManageBots: selfId === room.hostId && room.status === "lobby",
    canAddBot: selfId === room.hostId && room.status === "lobby" && activePlayers.length < maxPlayers,
    canRemoveBot: selfId === room.hostId && room.status === "lobby" && botPlayers.length > 0
  };
}

function roomIdentityView(room, options = {}) {
  return {
    code: room.code,
    wave: room.wave,
    floor: room.floor,
    chapter: room.floor,
    maxChapters: options.maxChapters || room.floor,
    status: room.status,
    hostId: room.hostId,
    hostName: options.hostName || ""
  };
}

function roomPopulationView(options = {}) {
  const playerCount = options.playerCount || 0;
  return {
    readyCount: options.readyCount || 0,
    allReady: Boolean(options.allReady),
    choicePending: options.choicePending || 0,
    advancementPending: options.advancementPending || 0,
    botCount: options.botCount || 0,
    canManageBots: Boolean(options.canManageBots),
    canAddBot: Boolean(options.canAddBot),
    canRemoveBot: Boolean(options.canRemoveBot),
    playerCount,
    activePlayerCount: options.activePlayerCount ?? playerCount,
    spectatorCount: options.spectatorCount || 0,
    maxPlayers: options.maxPlayers || 0
  };
}

function roomStageSummaryView(room, options = {}) {
  return {
    canChooseRisk: false,
    riskChoices: [],
    activeRisk: options.activeRisk,
    stageModifier: options.stageModifier ?? options.activeRisk,
    waveTrait: options.waveTrait,
    threatLevel: round2(room.threatLevel || 1),
    stageKind: options.stageKind || "combat",
    stage: options.stage
  };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function round1(value) {
  return Number(value.toFixed(1));
}

function playerIdentityView(player, options = {}) {
  const classDef = options.classDef || {};
  return {
    id: player.id,
    name: player.name,
    bot: Boolean(player.bot),
    spectator: Boolean(player.spectator),
    classId: player.classId,
    classLabel: options.classLabel || "",
    passive: options.passive || null,
    icon: classDef.icon || "",
    color: classDef.color || ""
  };
}

function playerPositionView(player) {
  return {
    x: round2(player.x),
    y: round2(player.y)
  };
}

function projectileView(projectile) {
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
    pierce: projectile.pierce || 0
  };
}

function projectileViews(projectiles) {
  return (projectiles || []).map(projectileView);
}

function movementView(move, includeKey = false) {
  if (!move) return null;
  const view = {
    active: true,
    progress: round2(move.elapsed / Math.max(0.01, move.duration))
  };
  if (includeKey) view.key = move.key || "";
  if (move.style !== undefined) view.style = move.style || "";
  if (move.startX !== undefined) {
    view.fromX = round2(move.startX);
    view.fromY = round2(move.startY);
    view.toX = round2(move.x);
    view.toY = round2(move.y);
  }
  return view;
}

function enemyView(enemy, options = {}) {
  const enemyDefs = options.enemyDefs || {};
  const getStatusEffects = options.getStatusEffects || (() => []);
  const getAiState = options.getAiState || (() => "");
  const getWindupChannel = options.getWindupChannel || (() => "");
  const def = enemyDefs[enemy.type];
  return {
    id: enemy.id,
    type: enemy.type,
    label: enemy.label || def.label,
    color: enemy.color || def.color,
    bossId: enemy.bossId || "",
    bossPattern: enemy.bossPattern || "",
    currentBossPattern: enemy.currentBossPattern || "",
    bossPhase: enemy.bossPhase || 0,
    phaseTitle: enemy.phaseTitle || "",
    phaseTransitionTime: round2(enemy.phaseTransitionTimer || 0),
    phaseTransitionTimeMax: round2(enemy.phaseTransitionTimerMax || 0),
    phaseAuraColor: enemy.phaseAuraColor || "",
    x: round2(enemy.x),
    y: round2(enemy.y),
    hp: Math.max(0, Math.ceil(enemy.hp)),
    maxHp: enemy.maxHp,
    barrier: Math.max(0, Math.ceil(enemy.barrier || 0)),
    radius: enemy.radius,
    role: enemy.role,
    aiState: getAiState(enemy),
    blockadeRunner: Boolean(enemy.blockadeRunner),
    elite: Boolean(enemy.elite),
    affix: enemy.affix || "",
    statusEffects: getStatusEffects(enemy),
    windupChannel: getWindupChannel(enemy.windup?.kind),
    windup: enemy.windup,
    chargeMove: movementView(enemy.chargeMove, true),
    knockbackMove: movementView(enemy.knockbackMove, true)
  };
}

function enemyViews(enemies, options = {}) {
  return (enemies || []).map((enemy) => enemyView(enemy, options));
}

function hazardView(hazard) {
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
    spawnFromX: Number.isFinite(hazard.spawnFromX) ? round2(hazard.spawnFromX) : null,
    spawnFromY: Number.isFinite(hazard.spawnFromY) ? round2(hazard.spawnFromY) : null,
    moveFromX: Number.isFinite(hazard.moveFromX) ? round2(hazard.moveFromX) : null,
    moveFromY: Number.isFinite(hazard.moveFromY) ? round2(hazard.moveFromY) : null,
    moveTime: round2(hazard.moveTime || 0),
    moveTimeMax: round2(hazard.moveTimeMax || hazard.moveTime || 0),
    armed: !hazard.armTime || hazard.armTime <= 0,
    hostile: Boolean(hazard.hostile),
    color: hazard.color || ""
  };
}

function hazardViews(hazards) {
  return (hazards || []).map(hazardView);
}

function relicChestView(chest) {
  return {
    id: chest.id,
    x: round2(chest.x),
    y: round2(chest.y),
    radius: chest.radius
  };
}

function relicChestViews(chests) {
  return (chests || []).map(relicChestView);
}

function xpOrbView(orb) {
  return {
    id: orb.id,
    x: round2(orb.x),
    y: round2(orb.y),
    radius: orb.radius,
    value: orb.value
  };
}

function xpOrbViews(orbs) {
  return (orbs || []).map(xpOrbView);
}

function stageObjectiveView(objective, options = {}) {
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
    laneCount: objective.laneCount || 0
  };
}

function skillSlotView(player, slot, options = {}) {
  const getUnlockedSlotUpgrade = options.getUnlockedSlotUpgrade;
  const getSkillCooldown = options.getSkillCooldown;
  const getPrimarySkillName = options.getPrimarySkillName;
  const getSkillIcon = options.getSkillIcon;
  const upgrade = getUnlockedSlotUpgrade(player, slot);
  const unlocked = slot === "q" || Boolean(upgrade);
  const cooldownMax = getSkillCooldown(player, slot);
  const id = slot === "q" ? `${player.classId}_primary` : upgrade ? upgrade.id : "";
  return {
    id,
    slot: slot.toUpperCase(),
    key: slot,
    unlocked,
    name: slot === "q" ? getPrimarySkillName(player) : upgrade ? upgrade.name : "잠김",
    icon: unlocked ? getSkillIcon(id) : "",
    cooldown: round1(player.skillTimers[slot]),
    cooldownMax: round1(cooldownMax),
    ready: unlocked && player.skillTimers[slot] <= 0
  };
}

function skillSlotViews(player, slots, options = {}) {
  return (slots || []).map((slot) => skillSlotView(player, slot, options));
}

function playerInputView(player) {
  const aimX = Number.isFinite(player.input?.aimX) ? player.input.aimX : player.x + 1;
  const aimY = Number.isFinite(player.input?.aimY) ? player.input.aimY : player.y;
  const moveX = Number.isFinite(player.input?.mx) ? player.input.mx : 0;
  const moveY = Number.isFinite(player.input?.my) ? player.input.my : 0;
  return {
    aimX: round2(aimX),
    aimY: round2(aimY),
    facing: round2(Math.atan2(aimY - player.y, aimX - player.x)),
    moveX: round2(moveX),
    moveY: round2(moveY),
    attacking: Boolean(player.input?.attacking)
  };
}

function playerVitalsView(player, options = {}) {
  const classSpeed = options.classSpeed || 0;
  const sizeScale = options.sizeScale || 1;
  const martialChiMax = options.martialChiMax || 0;
  return {
    speed: round2(classSpeed * player.speedMul),
    hp: Math.ceil(player.hp),
    maxHp: player.maxHp,
    shield: Math.ceil(player.shield),
    hitIFrameTime: round2(player.hitIFrameTimer || 0),
    sizeScale: round2(sizeScale),
    tauntGuardTime: round2(player.tauntGuardTimer || 0),
    martialChi: round2(player.martialChi || 0),
    martialChiMax
  };
}

function playerProgressionView(player, options = {}) {
  const relicStacks = options.relicStacks || { current: 0, max: 0 };
  return {
    level: player.level,
    maxLevel: options.maxLevel || player.level,
    xp: player.xp,
    xpNext: options.xpNext || 0,
    score: player.score,
    relicCount: relicStacks.current,
    relicMaxCount: relicStacks.max,
    uniqueRelicCount: player.relics.length,
    jobTier: player.jobTier,
    nextAdvancementLevel: options.nextAdvancementLevel || null
  };
}

function playerLoadoutView(player, options = {}) {
  const isSelf = Boolean(options.isSelf);
  const skillUpgradeName = options.skillUpgradeName || ((id) => id);
  const skillChoiceView = options.skillChoiceView || ((choice) => choice);
  const skillUpgrades = player.skillUpgrades || [];
  return {
    relics: isSelf ? player.relics : [],
    skillUpgrades,
    skillUpgradeNames: skillUpgrades.map(skillUpgradeName),
    pendingSkillChoices: isSelf ? (player.pendingSkillChoices || []).map(skillChoiceView) : [],
    choicePending: Boolean(player.choicePending)
  };
}

function playerActionStateView(player, options = {}) {
  const dashMaxCharges = options.dashMaxCharges ?? player.dashCharges ?? 1;
  return {
    downed: player.hp <= 0,
    skillReady: player.skillTimers.q <= 0,
    skillCooldown: round1(player.skillTimers.q),
    dashReady: Boolean(options.dashReady),
    dashCooldown: round1(options.dashCooldown || 0),
    dashCharges: player.dashCharges ?? dashMaxCharges,
    dashMaxCharges,
    dashRechargeCooldown: round1(player.dashRechargeTimer || 0),
    ready: Boolean(player.ready),
    lastAttackAt: player.lastAttackAt,
    lastSkillAt: player.lastSkillAt,
    lastDashAt: player.lastDashAt
  };
}

function runResultPlayerView(player, options = {}) {
  const relicStacks = options.relicStacks || { current: 0, max: 0 };
  return {
    id: player.id,
    name: player.name,
    classLabel: options.classLabel || "",
    level: player.level,
    score: player.score,
    relicCount: relicStacks.current,
    relicMaxCount: relicStacks.max,
    uniqueRelicCount: player.relics.length,
    downed: player.hp <= 0
  };
}

function runResultSummaryView(room, options = {}) {
  const outcome = options.outcome || "defeat";
  return {
    outcome,
    title: outcome === "victory" ? "스테이지 완전 클리어" : "스테이지 실패",
    message: options.message || "",
    chapter: room.floor,
    maxChapters: options.maxChapters || room.floor,
    floor: room.floor,
    wave: room.wave,
    stagesCleared: options.stagesCleared || 0,
    totalStages: options.totalStages || 0,
    durationSec: options.durationSec || 0,
    totalScore: options.totalScore || 0,
    totalRelics: options.totalRelics || 0,
    totalRelicMax: options.totalRelicMax || 0,
    highestLevel: options.highestLevel || 1,
    players: options.players || []
  };
}

module.exports = {
  enemyView,
  enemyViews,
  getRoomCapabilities,
  getRoomTimers,
  hazardView,
  hazardViews,
  movementView,
  playerActionStateView,
  playerIdentityView,
  playerInputView,
  playerLoadoutView,
  playerPositionView,
  playerProgressionView,
  playerVitalsView,
  projectileView,
  projectileViews,
  relicChestView,
  relicChestViews,
  roomIdentityView,
  roomPopulationView,
  roomStageSummaryView,
  runResultPlayerView,
  runResultSummaryView,
  secondsUntil,
  skillSlotView,
  skillSlotViews,
  stageObjectiveView,
  xpOrbView,
  xpOrbViews
};
