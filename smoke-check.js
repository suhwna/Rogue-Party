const vm = require("node:vm");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ORIGIN = process.env.SMOKE_ORIGIN || "http://localhost:5173";
const WS_ORIGIN = ORIGIN.replace(/^http/, "ws");
const MIN_LINKED_ASSET_COUNT = 38;

async function checkLinkedAssetResponses(html) {
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((ref) => ref && ref.startsWith("/") && !ref.startsWith("//"));
  const uniqueRefs = [...new Set(refs)];
  if (uniqueRefs.length < MIN_LINKED_ASSET_COUNT) {
    throw new Error(`linked asset coverage is too low: ${uniqueRefs.length}`);
  }

  for (const ref of uniqueRefs) {
    const assetResponse = await fetch(`${ORIGIN}${ref}`);
    const body = await assetResponse.text();
    if (!assetResponse.ok) {
      throw new Error(`linked asset failed ${ref}: ${assetResponse.status}`);
    }
    if ((ref.endsWith(".js") || ref.endsWith(".css")) && body.trimStart().startsWith("<!DOCTYPE")) {
      throw new Error(`linked asset returned html fallback: ${ref}`);
    }
  }
  return uniqueRefs.length;
}

async function loadWindowBridge(path, globalName) {
  const response = await fetch(`${ORIGIN}${path}`);
  const source = await response.text();
  if (!response.ok) {
    throw new Error(`window bridge fetch failed ${path}`);
  }
  const sandbox = { window: {}, JSON };
  vm.runInNewContext(source, sandbox, { filename: path.replace(/^\//, "") });
  const bridge = sandbox.window[globalName];
  if (!bridge) {
    throw new Error(`window bridge missing ${globalName}`);
  }
  return bridge;
}

function checkServerCollisionContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const roomManagerSource = fs.readFileSync("server-room-manager.js", "utf8");
  if (
    !serverSource.includes("MAP_EDGE_WALL_THICKNESS = 36") ||
    !serverSource.includes("function ensureRoomEdgeWalls") ||
    !serverSource.includes("function getRoomCollisionWalls") ||
    !serverSource.includes("createWorldEdgeWalls(room.world)") ||
    !serverSource.includes("const walls = getRoomCollisionWalls(room)") ||
    !serverSource.includes("for (const wall of getRoomCollisionWalls(room))") ||
    !serverSource.includes("function stopProjectileOnMapWall") ||
    !serverSource.includes("function getProjectileWallCollision") ||
    !serverSource.includes("function clipSegmentAxis") ||
    !serverSource.includes("const prevX = projectile.x") ||
    !serverSource.includes("if (stopProjectileOnMapWall(room, projectile, prevX, prevY))") ||
    !roomManagerSource.includes("mapEdgeWalls") ||
    !roomManagerSource.includes("mapEdgeWallsKey")
  ) {
    throw new Error("map edge wall collision contract failed");
  }
  console.log("collision contract ok");
}

function checkBossPatternContract() {
  const bossSystem = require("./server-boss-system");
  const serverSource = fs.readFileSync("server.js", "utf8");
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const pixiEnemySource = fs.readFileSync("public/pixi-enemies.js", "utf8");
  const pixiHazardSource = fs.readFileSync("public/pixi-hazards.js", "utf8");
  const profile = {
    signaturePatterns: ["phase_one", "phase_two", "phase_three"],
    phasePatterns: {
      1: ["phase_one"],
      2: ["phase_two", "phase_three"]
    }
  };
  const enemy = { bossPhase: 1, bossPatternCursor: 0, currentBossPattern: "" };
  if (bossSystem.nextBossPattern(enemy, profile) !== "phase_one") {
    throw new Error("boss phase-one pattern deck contract failed");
  }
  enemy.bossPhase = 2;
  enemy.bossPatternCursor = 0;
  enemy.currentBossPattern = "phase_two";
  if (bossSystem.nextBossPattern(enemy, profile) !== "phase_three") {
    throw new Error("boss immediate pattern repeat guard failed");
  }

  const executionPhaseTwo = bossSystem.getBossPhaseTransition({ hp: 79, maxHp: 100, bossPhase: 1, executionBoss: true });
  const executionPhaseThree = bossSystem.getBossPhaseTransition({ hp: 54, maxHp: 100, bossPhase: 2, executionBoss: true });
  const executionPhaseFour = bossSystem.getBossPhaseTransition({ hp: 27, maxHp: 100, bossPhase: 3, executionBoss: true });
  if (executionPhaseTwo?.phase !== 2 || executionPhaseThree?.phase !== 3 || executionPhaseFour?.phase !== 4) {
    throw new Error("execution boss four-phase contract failed");
  }

  const firstGateDamage = bossSystem.getBossDamageAllowance({ hp: 100, maxHp: 100, bossPhase: 1 }, 90);
  const lockedAtGate = bossSystem.getBossDamageAllowance({ hp: 72, maxHp: 100, bossPhase: 1 }, 10);
  const secondGateDamage = bossSystem.getBossDamageAllowance({ hp: 72, maxHp: 100, bossPhase: 2 }, 50);
  const transitionDamage = bossSystem.getBossDamageAllowance({ hp: 90, maxHp: 100, bossPhase: 1, phaseTransitionTimer: 0.5 }, 10);
  const miniBossGateDamage = bossSystem.getBossDamageAllowance({ hp: 100, maxHp: 100, bossPhase: 1, miniBoss: true }, 80);
  const executionGateDamage = bossSystem.getBossDamageAllowance({ hp: 100, maxHp: 100, bossPhase: 1, executionBoss: true }, 90);
  if (
    firstGateDamage !== 28 ||
    lockedAtGate !== 0 ||
    secondGateDamage !== 32 ||
    transitionDamage !== 10 ||
    miniBossGateDamage !== 50 ||
    executionGateDamage !== 20
  ) {
    throw new Error("boss health gate contract failed");
  }
  const earlyPhaseTransitionIndex = serverSource.indexOf("if (startPendingBossPhaseTransition(room, enemy)) continue;");
  const knockbackShortCircuitIndex = serverSource.indexOf("if (updateEnemyKnockback(room, enemy, dt))");
  const freezeShortCircuitIndex = serverSource.indexOf("if (enemy.freezeTimer > 0) continue;");
  if (
    earlyPhaseTransitionIndex < 0 ||
    earlyPhaseTransitionIndex > knockbackShortCircuitIndex ||
    earlyPhaseTransitionIndex > freezeShortCircuitIndex ||
    !serverSource.includes("function startPendingBossPhaseTransition(room, enemy, preferredTarget = null)")
  ) {
    throw new Error("boss phase gate crowd-control escape contract failed");
  }

  const expandedPatterns = [
    "iron_sweeping_arc",
    "iron_fortress_gap",
    "hive_safe_bloom",
    "hive_venom_fan",
    "void_mirror_volley",
    "void_collapse",
    "iron_furnace_refuge",
    "hive_spore_maelstrom",
    "void_final_eclipse",
    "execution_annihilation",
    "duelist_blade_fan",
    "duelist_guard_break",
    "plague_safe_bloom",
    "plague_venom_fan",
    "hunter_crossfire",
    "hunter_marked_blast",
    "iron_anvil_corridor",
    "iron_rotor_barrage",
    "hive_quarantine",
    "hive_creeping_orbit",
    "void_gravity_clock",
    "void_starless_trial",
    "duelist_pinwheel",
    "duelist_pincer",
    "plague_spore_clock",
    "plague_quarantine",
    "hunter_blink_ring",
    "hunter_ricochet"
  ];
  if (
    expandedPatterns.some((pattern) => !serverSource.includes(pattern)) ||
    !serverSource.includes("function getMiniBossPhaseTransition") ||
    !serverSource.includes("function startBossProjectileVolley") ||
    !serverSource.includes("function castBossGapBloom") ||
    !serverSource.includes("const EXECUTION_BOSS_PROFILE") ||
    !serverSource.includes("function updateBossOverlapPressure") ||
    !serverSource.includes("function updateExecutionBoss") ||
    !serverSource.includes("function castBossFieldJudgment") ||
    !serverSource.includes("function startBossSpiralBarrage") ||
    !serverSource.includes('type: "boss_field_judgment"') ||
    !serverSource.includes('type: "boss_safe_zone"') ||
    !serverSource.includes('type: "boss_spiral_emitter"') ||
    !serverSource.includes('enemy.lethalCastLabel = "파란 원으로 도망치세요";') ||
    !serverSource.includes("room.projectiles = room.projectiles.filter((projectile) => projectile.ownerId !== enemy.id);") ||
    !serverSource.includes("function findBotLethalSafeZone(room, bot)") ||
    !serverSource.includes("function moveBotToLethalSafeZone(room, bot, safeZone, now)") ||
    !serverSource.includes('if (hazard.type === "boss_field_judgment") continue;') ||
    !serverSource.includes("enemy.targetLockTimer > 0 && enemy.targetId") ||
    !clientSource.includes("파란 원으로 도망치세요") ||
    clientSource.includes("즉사 패턴 시전") ||
    !clientSource.includes('document.body.classList.add("boss-field-warning")') ||
    !serverSource.includes("execution_crimson_cage") ||
    !serverSource.includes("execution_relentless_hunt") ||
    !serverSource.includes("execution_crossfire") ||
    !serverSource.includes("execution_final_sentence") ||
    !serverSource.includes("triggerBossPhaseTransition(room, enemy, profile, target);") ||
    !serverSource.includes("if ((enemy.phaseTransitionTimer || 0) > 0) return true") ||
    !serverSource.includes("bossSystem.isBossDamageLocked(enemy)") ||
    !serverSource.includes("let bossGateFailOpen = false;") ||
    !serverSource.includes("startPendingBossPhaseTransition(room, enemy, owner);") ||
    !serverSource.includes("if (isBossTarget && !bossGateFailOpen)") ||
    !serverSource.includes("bossSystem.getBossDamageAllowance(enemy, finalDamage)") ||
    !serverSource.includes("CHAPTER_BOSS_HEALTH_MUL = 6") ||
    !serverSource.includes("MINIBOSS_HEALTH_MUL = 4") ||
    !serverSource.includes("SURVIVAL_EXECUTION_BOSS_HP_MUL = 20") ||
    !clientSource.includes('"boss_volley"') ||
    !pixiEnemySource.includes('"boss_volley"') ||
    !pixiHazardSource.includes("function renderBossFieldJudgment") ||
    !pixiHazardSource.includes("function renderBossSafeZone") ||
    !pixiHazardSource.includes('const warningColor = "#ef4444"') ||
    !pixiHazardSource.includes("function renderBossSpiralEmitter")
  ) {
    throw new Error("expanded boss pattern contract failed");
  }
  console.log("boss pattern contract ok");
}

function checkDefensePushbackContract() {
  const enemySystem = require("./server-enemy-system");
  const firstTrigger = enemySystem.getDefensePushbackTriggerCount(70, 66, 100, 0);
  const beforeSecondTrigger = enemySystem.getDefensePushbackTriggerCount(66, 34, 100, firstTrigger);
  const secondTrigger = enemySystem.getDefensePushbackTriggerCount(34, 33, 100, beforeSecondTrigger);
  const largeHitTriggersBoth = enemySystem.getDefensePushbackTriggerCount(100, 20, 100, 0);
  const repeatedDamageStaysCapped = enemySystem.getDefensePushbackTriggerCount(33, 10, 100, secondTrigger);
  if (
    firstTrigger !== 1 ||
    beforeSecondTrigger !== 1 ||
    secondTrigger !== 2 ||
    largeHitTriggersBoth !== 2 ||
    repeatedDamageStaysCapped !== 2
  ) {
    throw new Error("defense pushback threshold contract failed");
  }

  const horizontalPush = enemySystem.getDefenseWallPush(
    { w: 1800, h: 1120 },
    { x: 900, y: 560 },
    { id: "right", x: 1000, y: 560, radius: 20 }
  );
  const verticalPush = enemySystem.getDefenseWallPush(
    { w: 1800, h: 1120 },
    { x: 900, y: 560 },
    { id: "top", x: 900, y: 400, radius: 20 }
  );
  if (
    Math.abs(horizontalPush.dirX - 1) > 0.001 ||
    Math.abs(horizontalPush.dirY) > 0.001 ||
    Math.abs(horizontalPush.distance - 736) > 0.001 ||
    Math.abs(verticalPush.dirX) > 0.001 ||
    Math.abs(verticalPush.dirY + 1) > 0.001 ||
    Math.abs(verticalPush.distance - 336) > 0.001
  ) {
    throw new Error("defense wall push destination contract failed");
  }
  console.log("defense pushback contract ok");
}

function checkHostileProjectileContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const hazardSource = fs.readFileSync("public/pixi-hazards.js", "utf8");
  const projectileSource = fs.readFileSync("public/pixi-projectiles.js", "utf8");
  const effectSource = fs.readFileSync("public/pixi-effects.js", "utf8");
  if (
    !serverSource.includes("HOSTILE_PROJECTILE_TRAVEL_DISTANCE") ||
    !serverSource.includes("function launchMortarBlast") ||
    !serverSource.includes('type: "mortar_blast"') ||
    !serverSource.includes('damageType: "mortar_blast"') ||
    !serverSource.includes("hostileAttackInFlight") ||
    !serverSource.includes("projectile.hostile && !projectile.dead") ||
    !serverSource.includes("maxStacks: 3") ||
    !serverSource.includes("nextBaseDps * nextStacks") ||
    serverSource.includes("function castMortarPool") ||
    !hazardSource.includes("function renderMortarBlast") ||
    !projectileSource.includes("function drawHostileSpit") ||
    !projectileSource.includes("function drawHostileSniper") ||
    !projectileSource.includes("function drawHostileShuriken") ||
    !projectileSource.includes("function drawHostileOrb") ||
    !hazardSource.includes("const x1 = hazard.x") ||
    !hazardSource.includes("const x2 = hazard.x + ux * hazard.length") ||
    !effectSource.includes('style.includes("boss_beam_fire")') ||
    !effectSource.includes("const length = Math.max(80, Number(effect.length)")
  ) {
    throw new Error("hostile projectile persistence contract failed");
  }
  console.log("hostile projectile contract ok");
}

function checkWarriorUpgradeContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const skillSource = fs.readFileSync("src/data/skillUpgrades.ts", "utf8");
  const pixiRendererSource = fs.readFileSync("public/pixi-renderer.js", "utf8");
  const pixiSkillEffectsSource = fs.readFileSync("public/pixi-skill-effects.js", "utf8");
  const pixiHazardsSource = fs.readFileSync("public/pixi-hazards.js", "utf8");
  const cleaveStart = serverSource.indexOf('if (slot === "f" && hasUpgrade(player, "warrior_cleave"))');
  const cleaveEnd = serverSource.indexOf('if (player.classId === "martialist")', cleaveStart);
  const cleaveSource = serverSource.slice(cleaveStart, cleaveEnd);
  const damageIndex = cleaveSource.indexOf("const dealt = dealDamage");
  const executeCheckIndex = cleaveSource.indexOf("const executionReady = dealt > 0 && hasExecution && canWarriorCleaveExecute(enemy, player)");
  if (
    cleaveStart < 0 ||
    cleaveEnd < 0 ||
    damageIndex < 0 ||
    executeCheckIndex <= damageIndex ||
    cleaveSource.includes("executionReady ? 1.65") ||
    !serverSource.includes("WARRIOR_CHARGE_GATHER_RADIUS_MUL = 1.6") ||
    !serverSource.includes("gatherRadius: options.gatherRadius") ||
    !serverSource.includes("pathDistance <= enemy.radius + gatherRadius") ||
    !serverSource.includes('if (player.classId === "warrior") player.immunityTimer') ||
    !serverSource.includes("player.maxHp * 0.38") ||
    !serverSource.includes("bossExecutionBonus") ||
    !pixiRendererSource.includes('const reach = Math.max(74, Number(effect.reach || reachFromRadius));') ||
    !pixiRendererSource.includes('this.drawGfxArc(originX, originY, reach,') ||
    pixiRendererSource.includes("Math.min(142, Number(effect.reach || reachFromRadius))") ||
    !pixiRendererSource.includes("const slashRadius = hitRadius * 0.96") ||
    pixiRendererSource.includes("Math.min(250, baseRadius * 0.82)") ||
    !pixiSkillEffectsSource.includes("const swirlRadius = radius * 0.98") ||
    !pixiHazardsSource.includes("renderer.drawGfxCircle(hazard.x, hazard.y, radius, dark") ||
    !skillSource.includes("피해가 적용된 뒤 남은 체력이 최대 체력의 25% 이하") ||
    !skillSource.includes("보스에게는 광역 베기 피해가 35% 증가") ||
    !skillSource.includes("끌어모으는 반경이 일반 돌진보다 60% 넓어집니다")
  ) {
    throw new Error("warrior execute/gather upgrade contract failed");
  }
  console.log("warrior upgrade contract ok");
}

function checkEngineerBalanceContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const classSource = fs.readFileSync("src/data/classes.ts", "utf8");
  const skillSource = fs.readFileSync("src/data/skillUpgrades.ts", "utf8");
  const droneDeploySource = serverSource.slice(
    serverSource.indexOf("function deployEngineerDrone"),
    serverSource.indexOf("function getEngineerDurationMul")
  );
  if (
    !serverSource.includes("const ENGINEER_MECHA_MOVE_MUL = 0.78") ||
    !serverSource.includes("const ENGINEER_MECHA_ATTACK_DAMAGE_MUL = 1.08") ||
    !serverSource.includes("const ENGINEER_MECHA_ATTACK_COOLDOWN_MUL = 0.8") ||
    !serverSource.includes("const ENGINEER_MECHA_LASER_MODULE_SHOTS = 3") ||
    !serverSource.includes("const ENGINEER_ADAPTIVE_MECHA_DURATION_MUL = 0.92") ||
    !serverSource.includes("const ENGINEER_ADAPTIVE_LASER_KNOCKBACK = 2.5") ||
    !serverSource.includes("const ENGINEER_SWARM_AUXILIARY_DAMAGE_MUL = 0.4") ||
    !serverSource.includes("function getAdaptiveMechaLaserRadius") ||
    !serverSource.includes("return 18 * Math.max(0.4, Number(player?.areaMul) || 1);") ||
    !serverSource.includes("const beamRadius = getAdaptiveMechaLaserRadius(player)") ||
    !serverSource.includes("distanceToSegment(enemy, muzzleX, muzzleY, endpoint.x, endpoint.y) > beamRadius + enemy.radius") ||
    !serverSource.includes("hitRadius: round2(beam.beamRadius)") ||
    !serverSource.includes("width: round2(beam.beamRadius * 2)") ||
    !serverSource.includes("const damageMul = charged ? 3.9 : 3.5") ||
    !serverSource.includes("hazard.charged ? 2.4 : 1.8") ||
    !serverSource.includes('hasUpgrade(player, "engineer_factory") ? 18 : 14') ||
    !serverSource.includes("hazard.damage * 3.1") ||
    !classSource.includes("skillCd: 7.4") ||
    !skillSource.includes("기본공격을 3회 사용하면") ||
    !skillSource.includes("큰 피해를 주고 둔화시키는 전기 지뢰") ||
    !skillSource.includes('"id": "engineer_auto_mine"') ||
    !skillSource.includes("지뢰 쿨타임이 끝날 때마다 충전이 1개씩 회복") ||
    !serverSource.includes('"id": "engineer_auto_mine"') ||
    !serverSource.includes('"name": "자동 기뢰 살포"') ||
    !serverSource.includes("player.engineerMineCharges += 1") ||
    !serverSource.includes('hasUpgrade(player, "engineer_auto_mine")') ||
    !serverSource.includes("7.5 * skillSystem.getSkillCooldownMultiplier(player)") ||
    !serverSource.includes('room.status === "lobby" && room.enemies.some((enemy) => enemy.trainingDummy)') ||
    !skillSource.includes("설치 주기는 스킬 가속의 영향을 받습니다") ||
    !serverSource.includes("function getAttackSpeedCooldownMultiplier(player)") ||
    !serverSource.includes("getAttackSpeedCooldownMultiplier(player);") ||
    !serverSource.includes("missileAttackSpeedMul: fireRateMul") ||
    !serverSource.includes('skillTag: "engineer_turret_missile"') ||
    !serverSource.includes('skillTag: "engineer_drone_missile"') ||
    !serverSource.includes("splash: 140 * (owner.areaMul || 1)") ||
    !serverSource.includes("splash: 120 * (owner.areaMul || 1)") ||
    !serverSource.includes("const swarmAuxiliary = index >= baseCount") ||
    !serverSource.includes("damageMul: swarmAuxiliary ? ENGINEER_SWARM_AUXILIARY_DAMAGE_MUL : 1") ||
    !droneDeploySource.includes("radius: swarmAuxiliary ? 14 : 17") ||
    !droneDeploySource.includes("Number(options.damageMul) || 1") ||
    serverSource.includes("const pickup = {\n    id: pickupId,\n    type,\n    x: clamp(enemy.x, 28, room.world.w - 28),\n    y: clamp(enemy.y, 28, room.world.h - 28),\n    vx: Math.cos(angle) * 82,\n    vy: Math.sin(angle) * 82,\n    radius: swarmAuxiliary")
  ) {
    throw new Error("engineer skill balance contract failed");
  }
  console.log("engineer skill balance contract ok");
}

function checkBotSurvivalContract() {
  const botSystem = require("./server-bot-system");
  const serverSource = fs.readFileSync("server.js", "utf8");
  const bot = {
    classId: "ranger",
    hp: 100,
    maxHp: 100,
    choices: [
      { id: "iron_plate" },
      { id: "power_core" },
      { id: "swift_boots" }
    ]
  };
  const selected = botSystem.pickBestBotRelicChoice(bot, () => 0);
  if (
    selected?.id !== "power_core" ||
    !serverSource.includes("function getBotBeamAvoidance") ||
    !serverSource.includes("function getBotArenaPressureVector") ||
    !serverSource.includes("function findNearestBotHealthPotion") ||
    !serverSource.includes("distanceToSegment(point, hazard.x, hazard.y, endX, endY) - hazard.width")
  ) {
    throw new Error("bot survival decision contract failed");
  }
  console.log("bot survival decision contract ok");
}

function checkSkillHasteContract() {
  const skillSystem = require("./server-skill-system");
  const serverSource = fs.readFileSync("server.js", "utf8");
  const noHaste = skillSystem.getSkillCooldownMultiplier({ skillHaste: 0 });
  const hundredHaste = skillSystem.getSkillCooldownMultiplier({ skillHaste: 100 });
  const cappedHaste = skillSystem.getSkillCooldownMultiplier({ skillHaste: 900 });
  if (
    noHaste !== 1 ||
    hundredHaste !== 0.5 ||
    Math.abs(cappedHaste - (1 / 6)) > 0.000001 ||
    skillSystem.getSkillHaste({ skillHaste: 900 }) !== 500 ||
    !serverSource.includes("player.skillHaste = Math.min(500") ||
    !serverSource.includes("player.attackSpeed = Math.min(500") ||
    !serverSource.includes("100 / (100 + attackSpeed)") ||
    !serverSource.includes('id: "rapid_loader"')
  ) {
    throw new Error("skill haste and attack speed formula contract failed");
  }
  console.log("skill haste and attack speed contract ok");
}

function checkSoloBalanceContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const difficultySource = fs.readFileSync("src/data/difficulty.ts", "utf8");
  if (
    !serverSource.includes('label: "SOLO"') ||
    !serverSource.includes("spawnMul: 0.54") ||
    !serverSource.includes("hpMul: 0.78") ||
    !serverSource.includes("damageMul: 0.74") ||
    !serverSource.includes("eliteCap: 0.2") ||
    !serverSource.includes("xpMul: 1.14") ||
    !serverSource.includes("const solo = players === 1") ||
    !serverSource.includes("solo ? 26 + minute * 3.6 : 32 + minute * 5") ||
    !serverSource.includes("solo ? 0.42 : 0.3") ||
    !serverSource.includes("def.damage * 2.55") ||
    !serverSource.includes("def.damage * 3.7 * bossExecutionBonus") ||
    !serverSource.includes("const bolts = 10 + getProjectileCountBonus(player)") ||
    !serverSource.includes("0.5 / splitShardCount") ||
    !serverSource.includes("getEngineerMechaAttackDamageMul(player) * 1.1") ||
    !serverSource.includes("mini ? 0.72 : 1.1") ||
    !difficultySource.includes("spawnMul: 0.54") ||
    !difficultySource.includes("hpMul: 0.78") ||
    !difficultySource.includes("damageMul: 0.74")
  ) {
    throw new Error("solo class viability contract failed");
  }
  console.log("solo class viability contract ok");
}

function checkBalanceCorrectionsContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const saveSource = fs.readFileSync("public/client-save.js", "utf8");
  const progressionSource = fs.readFileSync("public/client-progression.js", "utf8");
  const relicSource = fs.readFileSync("src/data/relics.ts", "utf8");
  const relicRegistrySource = fs.readFileSync("server-data-registry.js", "utf8");
  const skillSource = fs.readFileSync("src/data/skillUpgrades.ts", "utf8");
  if (
    !serverSource.includes("ENEMY_POISON_BOSS_MAX_HP_DPS = 0.003") ||
    !serverSource.includes("BOSS_VENOM_POISON_RATIO = 0.5") ||
    !serverSource.includes('options.element === "poison" || options.element === "venom"') ||
    !serverSource.includes("finalDamage *= owner.statusDamageMul || 1") ||
    serverSource.includes("function hasCombatStatus") ||
    !serverSource.includes("RANGER_PIERCE_GROWTH_FULL_KILLS = 20") ||
    !serverSource.includes("RANGER_PIERCE_GROWTH_HALF_KILLS = 50") ||
    !serverSource.includes("RANGER_PIERCE_GROWTH_CAP = 100") ||
    !serverSource.includes("0.5 / splitShardCount") ||
    !serverSource.includes("player.attackPowerBonus = gear.attackBonus") ||
    !serverSource.includes("player.damageMul += (accountBonuses.damageMul - 1) + (bonuses.damageMul - 1) + (gear.damageMul - 1)") ||
    !serverSource.includes("(baseAttackPower + equipmentAttackPower) / baseAttackPower") ||
    !serverSource.includes("eliteBossDamageMul: clampNumber") ||
    !serverSource.includes("baseCritDamageMul + Math.max(0, (owner.critDamageMul || 1) - 1)") ||
    !serverSource.includes("player.crit = Math.min(0.85, player.crit + 0.05)") ||
    !serverSource.includes("Math.min(0.1, gainedLevels * 0.003)") ||
    !saveSource.includes("Math.min(0.1, gainedLevels * 0.003)") ||
    !relicRegistrySource.includes('sharp_eye: [{ op: "capAdd", key: "crit", value: 0.05, max: 0.85 }]') ||
    !progressionSource.includes("const RARITY_CRIT_SCALE = [1, 1.2, 1.4, 1.7, 2, 2.5]") ||
    !progressionSource.includes("const CRIT_ENHANCE_STEP = 0.0008") ||
    !progressionSource.includes('{ id: "critical", value: 0.04, weight: 0.8 }') ||
    !saveSource.includes('{ id: "damage", label: "피해 증폭"') ||
    !clientSource.includes('attackBonus: add("attackBonus")') ||
    !clientSource.includes('damageMul: addMultiplier("damageMul")') ||
    !clientSource.includes('["고정 공격력", formatSignedFlat(bonuses.attackBonus || 0)]') ||
    !progressionSource.includes('{ id: "attack_flat", label: "고정 공격력"') ||
    !progressionSource.includes('{ id: "power", label: "피해 증폭"') ||
    !progressionSource.includes('["고정 공격력", `+${Math.round(bonuses.attackBonus * 10) / 10}`]') ||
    !progressionSource.includes('["정예/보스 피해", percent(bonuses.eliteBossDamageMul - 1)') ||
    !serverSource.includes("armorBonus: clampNumber(bonuses.armorBonus || 0, 0, 10)") ||
    !progressionSource.includes("bonuses.armorBonus = Math.min(10, bonuses.armorBonus)") ||
    !progressionSource.includes('unit: "방어 +1"') ||
    !relicSource.includes('text: "방어력이 1 증가합니다."') ||
    !skillSource.includes("최대 +100") ||
    !skillSource.includes("파편 총 피해는 원본의 50%")
  ) {
    throw new Error("balance corrections contract failed");
  }
  console.log("balance corrections contract ok");
}

function checkUniqueEquipmentContract() {
  const progressionSource = fs.readFileSync("public/client-progression.js", "utf8");
  const serverSource = fs.readFileSync("server.js", "utf8");
  const choiceSource = fs.readFileSync("public/client-choice.js", "utf8");
  const serializerSource = fs.readFileSync("server-state-serializer.js", "utf8");
  const playerRenderSource = fs.readFileSync("public/pixi-players.js", "utf8");
  const hazardRenderSource = fs.readFileSync("public/pixi-hazards.js", "utf8");
  const hazardUpdateSource = serverSource.slice(
    serverSource.indexOf("function updateHazards"),
    serverSource.indexOf("function updateEnemies")
  );
  const enemyUpdateSource = serverSource.slice(
    serverSource.indexOf("function updateEnemies"),
    serverSource.indexOf("function updateFieldPickups")
  );
  const mageDashStart = serverSource.indexOf('if (player.classId === "mage") {', serverSource.indexOf("function performDash"));
  const mageDashEnd = serverSource.indexOf("return;", mageDashStart);
  const mageDashSource = serverSource.slice(mageDashStart, mageDashEnd);
  const itemIds = [
    "triple_aegis", "plague_heirloom", "auxiliary_drone_core", "guardian_necklace", "time_eater_core",
    "vampire_necklace", "double_edged_blade", "silent_warblade", "ritual_only_core", "swift_god_boots",
    "magnet_necklace", "execution_arc_blade", "endless_cleave_blade", "destructive_shout_core",
    "vortex_grip_core", "collision_charge_plate", "seeker_bow", "omnidirectional_quiver",
    "scorching_laser_bow", "gravity_rain_charm", "limitbreaker_arrowhead", "comet_core_staff",
    "flame_wave_robe", "devouring_limit_staff", "glacial_meteor_core", "infinite_chain_prism",
    "adaptive_mecha_core", "incendiary_mine_core", "swarm_controller", "eternal_drone_core",
  ];
  if (
    itemIds.some((id) => !progressionSource.includes(`id: "${id}"`))
    || !serverSource.includes("function updateEquipmentPassives")
    || !serverSource.includes("function spreadEquipmentPoisonOnDeath")
    || !serverSource.includes("player.skillsDisabled")
    || !serverSource.includes("player.primaryDisabled")
    || !serverSource.includes("player.rangerRadialQ")
    || !serverSource.includes("player.mageIceMeteor")
    || !serverSource.includes("function fireAdaptiveMechaContinuousLaser")
    || serverSource.includes("function triggerAdaptiveMechaAttack")
    || !serverSource.includes('type: "fire_line"')
    || !serverSource.includes("x: (fromX + toX) * 0.5")
    || !serverSource.includes("y: (fromY + toY) * 0.5")
    || !serverSource.includes("const attackBasedTotal = owner ? getPlayerAttackDamage(owner, owner.classId) * attackDamageRatio : 0")
    || !serverSource.includes("burnAttackRatio: 0.65")
    || !serverSource.includes("function trimOwnedSkillDrones")
    || !serverSource.includes("function performWarriorHorizontalFollowupCleave")
    || !serverSource.includes('style: "warrior_cleave_repeat_horizontal"')
    || !serverSource.includes("WARRIOR_REPEAT_CLEAVE_EFFECT_DELAY = 0.92")
    || !serverSource.includes("WARRIOR_REPEAT_CLEAVE_IMPACT_DELAY = 0.26")
    || !serverSource.includes("function getEquipmentAdjustedSkillView")
    || !serverSource.includes('return modify("확장 별빛"')
    || !serverSource.includes('return modify("강화 핵"')
    || !serverSource.includes("vx: aim.x * 620")
    || serverSource.includes("giantStarShockwave")
    || !serverSource.includes("projectile.splash > 0 && !giantStarOrb")
    || !serverSource.includes("function explodeGiantStarOrbOnWall")
    || !serverSource.includes("if (giantStarOrb) explodeGiantStarOrbOnWall(room, projectile, hit.x, hit.y)")
    || !serverSource.includes("if (!projectile.hostile && !giantStarOrb)")
    || !serverSource.includes("Number(projectile.damage) || 0) * 0.52")
    || !fs.readFileSync("public/pixi-skill-effects.js", "utf8").includes('s.includes("star_orb_pierce_impact")')
    || !choiceSource.includes("choice.equipmentModified")
    || mageDashSource.includes("dealDamage")
    || mageDashSource.includes("slowTimer")
    || !serializerSource.includes("projectileShieldCharges")
    || !serverSource.includes("projectileShieldCharges: vitalsView.projectileShieldCharges")
    || !serverSource.includes("function tryBlockHostileProjectileWithAegis")
    || !serverSource.includes("collisionSystem.segmentIntersectsCircle(plate, plateRadius")
    || !serverSource.includes("if (tryBlockHostileProjectileWithAegis(room, projectile, prevX, prevY, now)) continue;")
    || !playerRenderSource.includes("const PROJECTILE_AEGIS_ORBIT_RADIUS = 62")
    || !playerRenderSource.includes("function renderProjectileAegis")
    || !playerRenderSource.includes('entry?.special === "engineer_mecha_module"')
    || !hazardRenderSource.includes("Boolean(hazard.iceMeteor)")
    || !hazardRenderSource.includes("function renderFireLine")
    || !hazardUpdateSource.includes('hazard.type === "ice_pool"')
    || enemyUpdateSource.includes('hazard.type === "ice_pool"')
  ) {
    throw new Error("unique equipment contract failed");
  }
  console.log("unique equipment contract ok");
}

function checkSurvivalModeContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const enemySystem = require("./server-enemy-system");
  const hudSource = fs.readFileSync("public/client-hud.js", "utf8");
  const enemySource = fs.readFileSync("public/pixi-enemies.js", "utf8");
  const effectsSource = fs.readFileSync("public/pixi-effects.js", "utf8");
  const checkpointIntroStart = serverSource.indexOf("function spawnSurvivalCheckpointBoss");
  const checkpointIntroEnd = serverSource.indexOf("function getSurvivalBossSpawnPoint", checkpointIntroStart);
  const checkpointIntroSource = serverSource.slice(checkpointIntroStart, checkpointIntroEnd);
  const resumeStart = serverSource.indexOf("function resumeSurvivalAfterCheckpointReward");
  const resumeEnd = serverSource.indexOf("function preparePartyForExecutionBoss", resumeStart);
  const resumeSource = serverSource.slice(resumeStart, resumeEnd);
  if (
    !serverSource.includes("SURVIVAL_DURATION_SEC = 9 * 60") ||
    !serverSource.includes("SURVIVAL_BOSS_CHECKPOINTS") ||
    !serverSource.includes("SURVIVAL_MINIBOSS_SCHEDULE") ||
    !serverSource.includes("{ minute: 1, count: 1 }") ||
    !serverSource.includes("{ minute: 2, count: 1 }") ||
    !serverSource.includes("{ minute: 4, count: 1 }") ||
    !serverSource.includes("{ minute: 5, count: 1 }") ||
    !serverSource.includes("{ minute: 7, count: 1 }") ||
    !serverSource.includes("{ minute: 8, count: 1 }") ||
    !serverSource.includes("function startSurvivalMode") ||
    !serverSource.includes("function updateSurvivalMode") ||
    !serverSource.includes("solo ? 26 + minute * 3.6 : 32 + minute * 5") ||
    !serverSource.includes(": 5 + players") ||
    !serverSource.includes("const multiplayerBatchGrowth = [120, 390, 450, 510]") ||
    !serverSource.includes(": 2 + multiplayerBatchGrowth + (players >= 3 ? 1 : 0)") ||
    enemySystem.isEnemyTypeUnlocked("charger", 6) ||
    enemySystem.isEnemyTypeUnlocked("mortar", 7) ||
    !enemySystem.isEnemyTypeUnlocked("charger", 7) ||
    !enemySystem.isEnemyTypeUnlocked("mortar", 8) ||
    !serverSource.includes(": 0.92 - elapsedRatio * 0.52") ||
    !serverSource.includes("function spawnScheduledSurvivalMiniBosses") ||
    !serverSource.includes("function spawnSurvivalMiniBossWave(room, minute, count) {\n  const total = 1;") ||
    !serverSource.includes('const survivalRegularEnemy = Boolean(room.survival?.active && type !== "boss")') ||
    !serverSource.includes("const chapterStep = survivalRegularEnemy ? 0 : chapter - 1") ||
    !serverSource.includes("const statChapterDifficulty = survivalRegularEnemy ? CHAPTER_DIFFICULTY[1] : chapterDifficulty") ||
    !serverSource.includes("function clearSurvivalRegularEnemiesForBoss") ||
    !serverSource.includes("boss.survivalMiniBoss = true") ||
    !serverSource.includes("boss.guaranteedRelicDrop = true") ||
    !serverSource.includes('room.survival?.bossActive && type !== "boss"') ||
    !serverSource.includes("spawnRelicChestForEnemy(room, enemy, { survivalMiniBoss: true })") ||
    !serverSource.includes("function spawnSurvivalCheckpointBoss") ||
    !serverSource.includes("function updateSurvivalBossIntro") ||
    !serverSource.includes("function manifestSurvivalCheckpointBoss") ||
    !serverSource.includes("SURVIVAL_BOSS_INTRO_DELAY_MS = 2400") ||
    !serverSource.includes("bossArrivalStasisUntil") ||
    !serverSource.includes('style: "boss_arrival_sacrifice"') ||
    !serverSource.includes('style: "boss_arrival_manifest"') ||
    !serverSource.includes('"boss_arrival_execution"') ||
    checkpointIntroSource.includes("regroupPartyForStage(room)") ||
    resumeSource.includes("regroupPartyForStage(room)") ||
    serverSource.includes("waveTraits") ||
    serverSource.includes("waveTrait") ||
    !serverSource.includes("function spawnSurvivalExecutionBoss") ||
    !serverSource.includes('id: "fate_executioner"') ||
    !serverSource.includes("boss.bossId = EXECUTION_BOSS_PROFILE.id") ||
    !effectsSource.includes('style.includes("boss_arrival")') ||
    !effectsSource.includes('style.includes("boss_arrival_sacrifice")') ||
    !hudSource.includes("9:00") ||
    !enemySource.includes("enemy.executionBoss")
  ) {
    throw new Error("nine-minute survival contract failed");
  }
  console.log("survival contract ok");
}

function checkExperienceCurveContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  if (
    !serverSource.includes("const baseRequirement = 120 + level * 95") ||
    !serverSource.includes("const lateRequirement = Math.max(0, level - 3) * 20")
  ) {
    throw new Error("experience curve source contract failed");
  }

  const requirement = (level) => Math.round((120 + level * 95 + Math.max(0, level - 3) * 20) / 5) * 5;
  const levelFourTotal = [1, 2, 3].reduce((total, level) => total + requirement(level), 0);
  const maxLevelTotal = Array.from({ length: 14 }, (_, index) => index + 1)
    .reduce((total, level) => total + requirement(level), 0);
  if (levelFourTotal !== 930 || maxLevelTotal !== 12975) {
    throw new Error("experience curve timing target contract failed");
  }
  console.log("experience curve contract ok");
}

function checkAscensionDifficultyContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const saveSource = fs.readFileSync("public/client-save.js", "utf8");
  const progressionSource = fs.readFileSync("public/client-progression.js", "utf8");
  const authoritativeStart = serverSource.indexOf("function getAuthoritativeGrowthLoadout");
  const authoritativeEnd = serverSource.indexOf("function handleAccountProgressAction", authoritativeStart);
  const authoritativeSource = serverSource.slice(authoritativeStart, authoritativeEnd);
  if (
    !serverSource.includes("const MAX_ASCENSION_LEVEL = 5") ||
    !serverSource.includes("hpMul: 16") ||
    !serverSource.includes("damageMul: 16") ||
    !clientSource.includes("damageMul: 16") ||
    !serverSource.includes("ascensionProfile:") ||
    !clientSource.includes("state?.room?.ascensionProfile") ||
    !clientSource.includes("run-ascension-special-rules") ||
    !serverSource.includes("spawnMul: 1.68") ||
    !serverSource.includes("cadenceMul: 0.36") ||
    !serverSource.includes("rewardMul: 16") ||
    !serverSource.includes("statChapterDifficulty.cadenceMul *\n    abyssDifficulty.cadenceMul") ||
    !serverSource.includes("baseMaxAlive * ascensionDifficulty.spawnMul") ||
    !serverSource.includes("EQUIPMENT_DROP_CHANCE * ascensionDropMul") ||
    !serverSource.includes("Math.floor(selectedAscension * progress)") ||
    !serverSource.includes('elapsed < 180 ? "rare" : elapsed < 360 ? "epic" : elapsed < 450 ? "legendary" : elapsed < 510 ? "mythic" : "unique"') ||
    !serverSource.includes('selectedAscension >= 4 ? "unique" : selectedAscension >= 3 ? "mythic" : "legendary"') ||
    !serverSource.includes("Math.min(rarityOrder.indexOf(timeRarityCap), rarityOrder.indexOf(ascensionRarityCap))") ||
    authoritativeSource.includes("highestAscension") ||
    authoritativeSource.includes("unlockedAscension") ||
    !clientSource.includes("전 단계 즉시 선택 가능") ||
    clientSource.includes("level >= unlocked") ||
    !saveSource.includes("const MAX_ASCENSION_LEVEL = 5") ||
    !saveSource.includes("[1, 2, 4, 8, 12, 16]") ||
    !progressionSource.includes("integer(result?.ascensionLevel) * 3") ||
    !progressionSource.includes("[1, 1.8, 2.8, 4.2, 6, 8]")
  ) {
    throw new Error("five-tier unrestricted ascension contract failed");
  }
  console.log("ascension difficulty contract ok");
}

function checkLongTermProgressionContract() {
  const serverSource = fs.readFileSync("server.js", "utf8");
  const progressionSource = fs.readFileSync("public/client-progression.js", "utf8");
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const skinEffectsSource = fs.readFileSync("public/pixi-skin-effects.js", "utf8");
  const indexSource = fs.readFileSync("public/index.html", "utf8");
  const skillUpgradeSource = fs.readFileSync("src/data/skillUpgrades.ts", "utf8");
  const progressionRuntime = require("./server-progression-service");
  const batchBase = progressionRuntime.getDefaultProgress();
  batchBase.inventory.items = [{ id: "batch-a" }, { id: "batch-b" }, { id: "keep-c" }];
  const batchSalvage = progressionRuntime.performAction(batchBase, { action: "salvage-items", itemIds: ["batch-a", "batch-b"] });
  const performDashSource = serverSource.slice(
    serverSource.indexOf("function performDash"),
    serverSource.indexOf("function beginPlayerDashMove")
  );
  const requiredServer = [
    "function nextRoomRandom",
    "challengeLeaderboards",
    "ASCENSION_DIFFICULTY_PROFILES",
    "hpMul: 16",
    "spawnMul: 1.68",
    "cadenceMul: 0.36",
    "rewardMul: 16",
    "Math.min(0.9",
    "room?.ascensionLevel || 0) >= 3",
    "room.ascensionLevel || 0) >= 4",
    "room.ascensionLevel || 0) >= 5",
    "turretKillDurationBonus",
    "stats.poisonDamage",
    "weeklyBossId",
    "persistAccountRunResults",
    "accountProgressAction",
    "getAuthoritativeGrowthLoadout",
    "function calculateAccountLevelBonuses",
    "player.damageMul += (accountBonuses.damageMul - 1) + (bonuses.damageMul - 1) + (gear.damageMul - 1)",
    "accountBonuses.maxHpMul * bonuses.maxHpMul",
    "accountBonuses.armorBonus + bonuses.armorBonus",
    "function recordEnemyDefeatDiscovery",
    "outcomeMultiplier = result?.outcome === \"victory\" ? 2 : 0.5",
    "equipmentPickup:",
    "enemy-defeat-discovery",
    "room.runDefeatedMonsters",
    "room.runDefeatedBosses",
    "warriorWhirlwindEcho",
    "rangerVolleyBonus",
    "mageStarSplit",
    "engineerAuxTurret",
    "mechanistTurretMine",
    "explosiveArrow: fireArrow",
    "ranger_explosive_arrow",
    "runWithEffectOwner",
    "fire_pool_tick"
  ];
  if (!clientSource.includes("function showEquipmentPickupToast") || !clientSource.includes('message.reason === "equipment-drop"')) {
    throw new Error("field equipment pickup feedback contract failed");
  }
  if (
    !clientSource.includes("function requestScreenShake") ||
    !clientSource.includes("SCREEN_SHAKE_INTERVAL_MS") ||
    !clientSource.includes("screenShakeHitStreak") ||
    !clientSource.includes("requestScreenShake(effect, shake)") ||
    !clientSource.includes("requestScreenShake(effect, effect.pendingShake)")
  ) {
    throw new Error("high-frequency screen shake limiter contract failed");
  }
  const requiredProgression = [
    "warden_bulwark",
    "SET_BONUSES",
    "SEASON_REWARDS",
    "combatByClass",
    "MONSTER_CATALOG",
    "BOSS_CATALOG",
    "RELIC_CATALOG",
    "personal-missions",
    "getMissionProgressGain",
    "burnDamageMul",
    "function grantEquipmentDrop",
    "items: []",
    "data-progression-filter=\"itemRarity\"",
    "data-progression-filter=\"runeTier\"",
    "data-inventory-select",
    "action === \"salvage-items\"",
    "function ensureCodexActorRenderer",
    "setTimeout(ensureCodexActorRenderer, 0)",
    "canvas.replaceWith(rendererCanvas)",
    "vanguardWhirlwindGuard",
    "hunterRainBarrage",
    "arcanistPiercingFragments",
    "mechanistTurretMine",
    "보조 드론 피해 40%",
    "meta-equipped-card",
    "meta-equipped-set",
    "meta-loadout-column",
    "function getRaritySpecialText"
  ];
  const requiredSkinEffects = [
    "victory_trim",
    "abyss_glow",
    "season_ember",
    "season_verdant",
    "renderPlayerSkinEffect",
    "renderProjectileSkinEffect",
    "renderHazardSkinEffect",
    "renderProjectileOverride",
    "renderHazardOverride",
    "renderSkillEffectOverride",
    "renderPlayerAttackOverride",
    "drawSkinMotif",
    "drawFlame",
    "drawVoidShard"
  ];
  const serializer = require("./server-state-serializer");
  const skinSandbox = { window: {} };
  vm.runInNewContext(skinEffectsSource, skinSandbox, { filename: "pixi-skin-effects.js" });
  const skinApi = skinSandbox.window.RoguePixiSkinEffects;
  const skinDrawCalls = [];
  const skinRenderer = {
    hash: () => 7,
    getState: () => ({ players: [{ id: "skin-owner", skin: "abyss_glow" }] }),
    drawGfxPath: (...args) => skinDrawCalls.push(["path", args.length]),
    drawGfxLine: (...args) => skinDrawCalls.push(["line", args.length]),
    drawGfxCircle: (...args) => skinDrawCalls.push(["circle", args.length]),
    drawGfxArc: (...args) => skinDrawCalls.push(["arc", args.length]),
    drawGfxDiamond: (...args) => skinDrawCalls.push(["diamond", args.length]),
    drawGfxRuneRing: (...args) => skinDrawCalls.push(["rune", args.length]),
  };
  const skinProjectileOverride = skinApi?.renderProjectileOverride(skinRenderer, { id: 1, x: 10, y: 20, angle: 0, radius: 8, skin: "victory_trim" }, 1000, {});
  const skinHazardOverride = skinApi?.renderHazardOverride(skinRenderer, { id: 2, x: 20, y: 30, radius: 60, skin: "season_verdant", type: "pool", armed: true }, 1000);
  const skinSkillOverride = skinApi?.renderSkillEffectOverride(skinRenderer, { kind: "slash", ownerId: "skin-owner", x: 30, y: 40 }, 0.3, 0.7, 70, 1000);
  const themedPlayers = [
    { id: "ranger-owner", classId: "ranger", skin: "victory_trim" },
    { id: "mage-owner", classId: "mage", skin: "victory_trim" },
    { id: "warrior-owner", classId: "warrior", skin: "season_ember" },
  ];
  skinRenderer.getState = () => ({ players: themedPlayers });
  const themedLaserOverride = skinApi?.renderProjectileOverride(skinRenderer, {
    id: 3, x: 40, y: 50, angle: 0, radius: 8, skin: "victory_trim", classId: "ranger", style: "ranger_laser_arrow"
  }, 1000, { arrow: true, laser: true });
  const themedRainOverride = skinApi?.renderHazardOverride(skinRenderer, {
    id: 4, x: 50, y: 60, radius: 90, skin: "victory_trim", type: "arrow_rain", armTime: 0
  }, 1000);
  const themedMeteorOverride = skinApi?.renderSkillEffectOverride(skinRenderer, {
    id: 5, kind: "meteor", style: "meteor_call", ownerId: "mage-owner", x: 60, y: 70
  }, 0.45, 0.9, 100, 1000);
  const themedChainOverride = skinApi?.renderSkillEffectOverride(skinRenderer, {
    id: 6, kind: "chain", style: "chain_lightning", ownerId: "mage-owner", x: 70, y: 80, angle: 0
  }, 0.35, 0.9, 100, 1000);
  const projectileSkinView = serializer.projectileView({ id: 1, ownerId: 7, x: 0, y: 0 }, {
    getOwnerSkin: (ownerId) => ownerId === 7 ? "season_ember" : ""
  });
  const hazardSkinView = serializer.hazardView({ id: 2, ownerId: 8, type: "test", x: 0, y: 0 }, {
    getOwnerSkin: (ownerId) => ownerId === 8 ? "season_verdant" : ""
  });
  const trainingDummy = {
    id: 9,
    type: "training_dummy",
    x: 100,
    y: 100,
    hp: 360,
    maxHp: 360,
    radius: 28,
    role: "dummy",
    trainingDummy: true,
    trainingDamageTotal: 500,
    trainingLastHitAt: 9000,
    trainingDamageSamples: [{ at: 6000, damage: 100 }, { at: 9000, damage: 200 }],
  };
  const trainingDummyView = serializer.enemyView(trainingDummy, {
    now: 10000,
    enemyDefs: { training_dummy: { label: "Training Dummy", color: "#94a3b8" } },
  });
  const idleTrainingDummyView = serializer.enemyView(trainingDummy, {
    now: 12001,
    enemyDefs: { training_dummy: { label: "Training Dummy", color: "#94a3b8" } },
  });
  const skinnedPlayerIdentity = serializer.playerIdentityView({
    id: 3, classId: "ranger", appearanceColor: "#fb923c", cosmeticSkin: "season_ember"
  }, { classDef: { color: "#22c55e" } });
  if (
    requiredServer.some((value) => !serverSource.includes(value)) ||
    requiredProgression.some((value) => !progressionSource.includes(value)) ||
    skinProjectileOverride !== false ||
    skinHazardOverride !== false ||
    skinSkillOverride !== false ||
    themedLaserOverride !== false ||
    themedRainOverride !== false ||
    themedMeteorOverride !== false ||
    themedChainOverride !== false ||
    skinDrawCalls.length < 5 ||
    skinnedPlayerIdentity.color !== "#22c55e" ||
    skinnedPlayerIdentity.skinColor !== "#fb923c" ||
    !performDashSource.includes('player.classId === "warrior"') ||
    !performDashSource.includes("contactRadius: 58,") ||
    performDashSource.includes("contactRadius: 58 * player.areaMul") ||
    serverSource.includes("dashDamageMul") ||
    serverSource.includes("dashFollowupMul") ||
    progressionSource.includes("dashDamageMul") ||
    progressionSource.includes("dashFollowupMul") ||
    progressionSource.includes('id: "dash"') ||
    serverSource.includes("ascension_wall") ||
    serverSource.includes("asc-wall-") ||
    serverSource.includes("engineer_chain_mine") ||
    skillUpgradeSource.includes("engineer_chain_mine") ||
    serverSource.includes("대시 지뢰") ||
    skillUpgradeSource.includes("대시 지뢰") ||
    !skillUpgradeSource.includes('"name": "폭발 화살"') ||
    !skillUpgradeSource.includes("범위 폭발을 일으키고") ||
    skillUpgradeSource.includes('"name": "화염 화살"') ||
    requiredSkinEffects.some((value) => !skinEffectsSource.includes(value)) ||
    !clientSource.includes("pendingProgressionScrollTop") ||
    !clientSource.includes("renderProgressionUiState({ scrollTop: pendingProgressionScrollTop })") ||
    !clientSource.includes("function restoreProgressionScroll") ||
    !clientSource.includes("progressionScrollLockUntil") ||
    !indexSource.includes('/pixi-skin-effects.js') ||
    projectileSkinView.skin !== "season_ember" ||
    hazardSkinView.skin !== "season_verdant" ||
    trainingDummyView.trainingDps !== 75 ||
    trainingDummyView.trainingTotalDamage !== 500 ||
    idleTrainingDummyView.trainingDps !== 0 ||
    !batchSalvage.changed ||
    batchSalvage.progress.inventory.items.length !== 1 ||
    batchSalvage.progress.inventory.items[0].id !== "keep-c" ||
    batchSalvage.progress.statistics.itemsSalvaged !== 2
  ) {
    throw new Error("long-term progression detail contract failed");
  }
  console.log("long-term progression contract ok");
}

function checkServerAccountStoreContract() {
  const progression = require("./server-progression-service");
  const { createAccountStore } = require("./server-account-store");
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "rogue-account-smoke-"));
  try {
    const ascensionResult = {
      resultKey: "party-ascension-5",
      outcome: "victory",
      ascensionLevel: 5,
      stagesCleared: 1,
      highestLevel: 1,
      classId: "warrior",
    };
    const hostClear = progression.recordRunResult({ ...progression.getDefaultProgress(), records: { highestAscension: 4 } }, ascensionResult);
    const memberClear = progression.recordRunResult({ ...progression.getDefaultProgress(), records: { highestAscension: 0 } }, ascensionResult);
    if (hostClear.records.highestAscension !== 5 || memberClear.records.highestAscension !== 5) {
      throw new Error("party ascension clear record failed");
    }
    const store = createAccountStore({ progression, dataDir });
    const catalog = progression.getCatalogSnapshot();
    const admin = store.createAdmin({ displayName: "Admin Smoke" });
    const created = store.createGuest({
      displayName: "Account Smoke",
      progress: {
        ...progression.getDefaultProgress(),
        currencies: { abyssShards: 125 },
      },
    });
    const recoveryKey = `${created.account.id}.${created.recoveryCode}`;
    if (
      !created.account.id.startsWith("RP-") ||
      created.account.role !== "user" ||
      catalog.itemBases.length < 100 ||
      catalog.runes.length < 20 ||
      admin.account.role !== "admin" ||
      !admin.sessionToken ||
      !store.authenticate(admin.account.id, admin.sessionToken) ||
      !created.sessionToken ||
      created.progress.currencies.abyssShards !== 125 ||
      !store.authenticate(created.account.id, created.sessionToken)
    ) {
      throw new Error("server account creation contract failed");
    }
    const action = progression.performAction(created.progress, {
      action: "spend-mastery",
      classId: "warrior",
      nodeId: "damage",
    });
    const saved = store.updateProgress(created.account.id, action.progress, "smoke-action");
    const runProgress = progression.recordRunResult(saved.progress, {
      resultKey: "account-store-run-1",
      outcome: "victory",
      chapter: 1,
      wave: 3,
      stagesCleared: 3,
      highestLevel: 4,
      totalScore: 900,
      totalRelics: 2,
      durationSec: 60,
      classId: "warrior",
      combatStats: { damage: 5000, kills: 20 },
      noDown: true,
    });
    store.updateProgress(created.account.id, runProgress, "smoke-run");
    const reloaded = createAccountStore({ progression, dataDir });
    const restored = reloaded.getSession(created.account.id, created.sessionToken);
    if (
      !saved ||
      saved.account.revision <= created.account.revision ||
      restored?.progress?.mastery?.shared?.nodes?.damage !== 1 ||
      restored?.progress?.statistics?.runs !== 1 ||
      restored?.progress?.records?.highestAscension !== 0 ||
      restored?.progress?.records?.lastRunKey !== "account-store-run-1"
    ) {
      throw new Error("server account persistence contract failed");
    }
    const recovered = reloaded.recover(recoveryKey);
    if (
      !recovered?.sessionToken ||
      reloaded.authenticate(created.account.id, created.sessionToken) ||
      !reloaded.authenticate(created.account.id, recovered.sessionToken)
    ) {
      throw new Error("server account recovery contract failed");
    }
    const reset = reloaded.resetProgress(created.account.id, recovered.sessionToken);
    if (
      !reset?.reset ||
      reset.account.id !== created.account.id ||
      reset.account.revision <= recovered.account.revision ||
      reset.progress.account.level !== 1 ||
      reset.progress.statistics.runs !== 0 ||
      reset.progress.inventory.items.length !== 0 ||
      !reloaded.authenticate(created.account.id, recovered.sessionToken)
    ) {
      throw new Error("server account reset contract failed");
    }
    const persistedText = fs.readFileSync(path.join(dataDir, "accounts.json"), "utf8");
    if (
      !fs.existsSync(store.backupPath) ||
      persistedText.includes(created.sessionToken) ||
      persistedText.includes(created.recoveryCode) ||
      persistedText.includes(admin.sessionToken) ||
      persistedText.includes(admin.recoveryCode)
    ) {
      throw new Error("server account secret hashing contract failed");
    }
  } finally {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
  console.log("server account store contract ok");
}

async function checkHttp() {
  const response = await fetch(ORIGIN);
  const html = await response.text();
  const linkedAssetCount = await checkLinkedAssetResponses(html);
  if (linkedAssetCount < MIN_LINKED_ASSET_COUNT) {
    throw new Error("linked asset contract check failed");
  }
  if (!response.ok || !html.includes("roomSubmitButton")) {
    throw new Error("HTTP 확인 실패");
  }
  if (
    !html.includes("전투 준비실") ||
    !html.includes("원정 집결소") ||
    !html.includes("menuCreateButton") ||
    !html.includes("roomList") ||
    !html.includes("settingsOverlay") ||
    !html.includes("그래픽 품질") ||
    !html.includes("/ui-benchmark.css") ||
    !html.includes("lobbyWorkspaceNav") ||
    !html.includes("lobbyArenaToggle") ||
    !html.includes("lobbyArenaDock") ||
    !html.includes("accountStatusLabel") ||
    !html.includes("accountRecoveryInput") ||
    !html.includes("accountResetButton") ||
    !html.includes("/client-account.js") ||
    !html.includes('data-lobby-view="challenges"') ||
    !html.includes("runContext") ||
    !html.includes("result-report-layout")
  ) {
    throw new Error("Phase 10 UI shell 확인 실패");
  }
  const guestResponse = await fetch(`${ORIGIN}/api/account/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "HTTP Account", localProgress: { currencies: { abyssShards: 37 } } }),
  });
  const guestSession = await guestResponse.json();
  if (
    guestResponse.status !== 201 ||
    !guestSession.account?.id ||
    !guestSession.sessionToken ||
    !guestSession.recoveryCode ||
    guestSession.progress?.currencies?.abyssShards !== 37
  ) {
    throw new Error("account guest API contract failed");
  }
  const accountSessionResponse = await fetch(`${ORIGIN}/api/account/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId: guestSession.account.id, sessionToken: guestSession.sessionToken }),
  });
  const accountSession = await accountSessionResponse.json();
  if (!accountSessionResponse.ok || accountSession.account?.id !== guestSession.account.id) {
    throw new Error("account session API contract failed");
  }
  const styleResponse = await fetch(`${ORIGIN}/styles.css`);
  const styleSource = await styleResponse.text();
  const uiStyleResponse = await fetch(`${ORIGIN}/ui-benchmark.css`);
  const uiStyleSource = await uiStyleResponse.text();
  if (
    !styleResponse.ok ||
    !styleSource.includes(".map-choice-top") ||
    !styleSource.includes(".settings-modal") ||
    !styleSource.includes(".settings-key-button") ||
    !styleSource.includes(".lobby-workspace-nav") ||
    !styleSource.includes(".lobby-panel.arena-focus") ||
    !styleSource.includes(".lobby-arena-skill-list") ||
    !styleSource.includes(".account-strip") ||
    !styleSource.includes(".account-recovery-row") ||
    !styleSource.includes(".result-player-metrics") ||
    !uiStyleResponse.ok ||
    !uiStyleSource.includes("--rp-gold") ||
    !uiStyleSource.includes(".room-product-lockup") ||
    !uiStyleSource.includes(".run-context") ||
    !uiStyleSource.includes(".bottom-hud") ||
    !uiStyleSource.includes(".choice-button") ||
    !uiStyleSource.includes(".lobby-test-skill-groups") ||
    !uiStyleSource.includes("@media (max-width: 720px)")
  ) {
    throw new Error("Phase 10 UI style 확인 실패");
  }
  const roomsResponse = await fetch(`${ORIGIN}/rooms`);
  const roomsPayload = await roomsResponse.json();
  if (!roomsResponse.ok || !Array.isArray(roomsPayload.rooms)) {
    throw new Error("방 목록 API 확인 실패");
  }
  const leaderboardResponse = await fetch(`${ORIGIN}/leaderboards`);
  const leaderboardPayload = await leaderboardResponse.json();
  if (!leaderboardResponse.ok || !leaderboardPayload.leaderboards || typeof leaderboardPayload.leaderboards !== "object") {
    throw new Error("leaderboard API contract failed");
  }
  for (const room of roomsPayload.rooms) {
    if (
      typeof room.code !== "string" ||
      typeof room.status !== "string" ||
      typeof room.wave !== "number" ||
      typeof room.playerCount !== "number" ||
      typeof room.maxPlayers !== "number" ||
      typeof room.hostName !== "string"
    ) {
      throw new Error("/rooms response shape check failed");
    }
  }
  const assetManifestResponse = await fetch(`${ORIGIN}/assets/asset-manifest.json`);
  const assetManifest = await assetManifestResponse.json();
  if (
    !assetManifestResponse.ok ||
    assetManifest.scope !== "visual-only" ||
    assetManifest.audio !== false ||
    !assetManifest.directories?.sprites ||
    !assetManifest.directories?.icons ||
    !assetManifest.directories?.effects ||
    !assetManifest.texturePolicy?.priority?.includes("Pixi Graphics neon vector renderer is the primary path for actors, enemies, hazards, world, and skill effects") ||
    !assetManifest.texturePolicy?.priority?.includes("generatedAssets entries document procedural neon keys only") ||
    !assetManifest.texturePolicy?.skillEffects?.includes("Pixi Graphics neon vector effects are the only active skill effect path") ||
    !assetManifest.textureKeyGuide?.actor ||
    !assetManifest.textureKeyGuide?.effect ||
    !assetManifest.generatedAssets?.some((asset) => asset.textureKey === "neon:effect:slash") ||
    assetManifest.generatedAssets?.some((asset) => String(asset.textureKey || "").startsWith("asset-fx"))
  ) {
    throw new Error("Phase 11 visual asset manifest 확인 실패");
  }
  if (!assetManifest.texturePolicy?.skillEffects?.includes("External spritesheet and Canvas 2D skill rendering are not used")) {
    throw new Error("neon effect policy check failed");
  }
  const assetManifestSampleResponse = await fetch(`${ORIGIN}/assets/asset-manifest.sample.json`);
  const assetManifestSample = await assetManifestSampleResponse.json();
  if (
    !assetManifestSampleResponse.ok ||
    assetManifestSample.audio !== false ||
    !assetManifestSample.generatedAssets?.some((asset) => asset.textureKey === "neon:actor:warrior") ||
    !assetManifestSample.generatedAssets?.some((asset) => Array.isArray(asset.aliases) && asset.aliases.includes("neon:enemy:charger")) ||
    !assetManifestSample.generatedAssets?.some((asset) => asset.textureKey === "neon:effect:slash")
  ) {
    throw new Error("Phase 11 visual asset manifest sample check failed");
  }
  const pixiRendererResponse = await fetch(`${ORIGIN}/pixi-renderer.js`);
  const pixiRendererSource = await pixiRendererResponse.text();
  if (
    !pixiRendererResponse.ok ||
    !pixiRendererSource.includes("RoguePixiRuntime") ||
    !pixiRendererSource.includes("RoguePixiPools") ||
    !pixiRendererSource.includes("RoguePixiScene") ||
    !pixiRendererSource.includes("RoguePixiWorld") ||
    !pixiRendererSource.includes("RoguePixiPickups") ||
    !pixiRendererSource.includes("RoguePixiProjectiles") ||
    !pixiRendererSource.includes("RoguePixiHazards") ||
    !pixiRendererSource.includes("RoguePixiEnemies") ||
    !pixiRendererSource.includes("RoguePixiPlayers") ||
    !pixiRendererSource.includes("RoguePixiEffects") ||
    !pixiRendererSource.includes("RoguePixiSkillEffects") ||
    !pixiRendererSource.includes("RoguePixiParticles") ||
    !pixiRendererSource.includes("RoguePixiPrimitives") ||
    !pixiRendererSource.includes("RoguePixiPalettes") ||
    !pixiRendererSource.includes("EFFECT_DRAW_BUDGET") ||
    !pixiRendererSource.includes("chooseRendererPreference") ||
    !pixiRendererSource.includes("__rogueRendererStats") ||
    !pixiRendererSource.includes("webgpu") ||
    !pixiRendererSource.includes("QUALITY_PRESETS") ||
    !pixiRendererSource.includes("particleBudget") ||
    !pixiRendererSource.includes("getParticleBudget") ||
    !pixiRendererSource.includes("renderStyledSkillEffect") ||
    !pixiRendererSource.includes("renderSkillEffectPolishLayer") ||
    !pixiRendererSource.includes("renderCrispStyledSkillEffect") ||
    !pixiRendererSource.includes("renderCrispPrimaryClassStyledEffect") ||
    !pixiRendererSource.includes("renderCrispClassStyledEffect") ||
    !pixiRendererSource.includes("renderCrispCommonStyledEffect")
  ) {
    throw new Error("Pixi 렌더러 배포 확인 실패");
  }
  if (
    pixiRendererSource.includes("RogueVisualAssets") ||
    pixiRendererSource.includes("assetDescriptorForTexture") ||
    pixiRendererSource.includes("assetEffectFx")
  ) {
    throw new Error("legacy visual asset renderer path should be removed");
  }
  const pixiRuntimeResponse = await fetch(`${ORIGIN}/pixi-runtime.js`);
  const pixiRuntimeSource = await pixiRuntimeResponse.text();
  if (
    !pixiRuntimeResponse.ok ||
    !pixiRuntimeSource.includes("RoguePixiRuntime") ||
    !pixiRuntimeSource.includes("QUALITY_PRESETS") ||
    !pixiRuntimeSource.includes("createSpritePool") ||
    !pixiRuntimeSource.includes("createTextPool") ||
    !pixiRuntimeSource.includes("createGraphicsPool") ||
    !pixiRuntimeSource.includes("createCanvasTexture") ||
    !pixiRuntimeSource.includes("createTextureRegistry") ||
    !pixiRuntimeSource.includes("createLayerSet") ||
    !pixiRuntimeSource.includes("clearLayerSet") ||
    !pixiRuntimeSource.includes("effectStartIndex") ||
    !pixiRuntimeSource.includes("particleBudget")
  ) {
    throw new Error("pixi runtime bridge check failed");
  }
  const pixiPoolsResponse = await fetch(`${ORIGIN}/pixi-pools.js`);
  const pixiPoolsSource = await pixiPoolsResponse.text();
  if (
    !pixiPoolsResponse.ok ||
    !pixiPoolsSource.includes("RoguePixiPools") ||
    !pixiPoolsSource.includes("SpritePool") ||
    !pixiPoolsSource.includes("TextPool") ||
    !pixiPoolsSource.includes("GraphicsPool") ||
    !pixiPoolsSource.includes("createSpritePool") ||
    !pixiPoolsSource.includes("createTextPool") ||
    !pixiPoolsSource.includes("createGraphicsPool")
  ) {
    throw new Error("pixi pool bridge check failed");
  }
  const pixiCameraResponse = await fetch(`${ORIGIN}/pixi-camera.js`);
  const pixiCameraSource = await pixiCameraResponse.text();
  if (
    !pixiCameraResponse.ok ||
    !pixiCameraSource.includes("RoguePixiCamera") ||
    !pixiCameraSource.includes("createCameraContext") ||
    !pixiCameraSource.includes("applyCamera") ||
    !pixiCameraSource.includes("resetCamera")
  ) {
    throw new Error("pixi camera bridge check failed");
  }
  const pixiSceneResponse = await fetch(`${ORIGIN}/pixi-scene.js`);
  const pixiSceneSource = await pixiSceneResponse.text();
  if (
    !pixiSceneResponse.ok ||
    !pixiSceneSource.includes("RoguePixiScene") ||
    !pixiSceneSource.includes("RoguePixiCamera") ||
    !pixiSceneSource.includes("SECTION_ORDER") ||
    !pixiSceneSource.includes("renderGameScene") ||
    !pixiSceneSource.includes("renderWorldSections") ||
    !pixiSceneSource.includes("renderActorSections") ||
    !pixiSceneSource.includes("renderEffectSections")
  ) {
    throw new Error("pixi scene bridge check failed");
  }
  const pixiWorldResponse = await fetch(`${ORIGIN}/pixi-world.js`);
  const pixiWorldSource = await pixiWorldResponse.text();
  if (
    !pixiWorldResponse.ok ||
    !pixiWorldSource.includes("RoguePixiWorld") ||
    !pixiWorldSource.includes("renderDungeon") ||
    !pixiWorldSource.includes("renderObjective") ||
    !pixiWorldSource.includes("chapterTheme") ||
    !pixiWorldSource.includes("renderStageAtmosphere") ||
    !pixiWorldSource.includes("renderBlockadeBackdrop") ||
    !pixiWorldSource.includes("renderDefenseBackdrop") ||
    !pixiWorldSource.includes("renderRewardBackdrop")
  ) {
    throw new Error("pixi world bridge check failed");
  }
  const pixiPickupsResponse = await fetch(`${ORIGIN}/pixi-pickups.js`);
  const pixiPickupsSource = await pixiPickupsResponse.text();
  if (
    !pixiPickupsResponse.ok ||
    !pixiPickupsSource.includes("RoguePixiPickups") ||
    !pixiPickupsSource.includes("xpOrbBob") ||
    !pixiPickupsSource.includes("xpOrbScale") ||
    !pixiPickupsSource.includes("relicChestScale") ||
    !pixiPickupsSource.includes("renderXpOrb") ||
    !pixiPickupsSource.includes("renderRelicChest") ||
    !pixiPickupsSource.includes("EQUIPMENT_RARITY_VISUALS") ||
    !pixiPickupsSource.includes("renderEquipmentPickup") ||
    !pixiPickupsSource.includes("renderHealthFoodPickup") ||
    !pixiPickupsSource.includes("renderFieldPickup") ||
    !pixiPickupsSource.includes("renderPickups")
  ) {
    throw new Error("pixi pickup bridge check failed");
  }
  const pixiProjectilesResponse = await fetch(`${ORIGIN}/pixi-projectiles.js`);
  const pixiProjectilesSource = await pixiProjectilesResponse.text();
  if (
    !pixiProjectilesResponse.ok ||
    !pixiProjectilesSource.includes("RoguePixiProjectiles") ||
    !pixiProjectilesSource.includes("classifyProjectile") ||
    !pixiProjectilesSource.includes("projectileSpriteKey") ||
    !pixiProjectilesSource.includes("renderProjectiles")
  ) {
    throw new Error("pixi projectile bridge check failed");
  }
  const pixiHazardsResponse = await fetch(`${ORIGIN}/pixi-hazards.js`);
  const pixiHazardsSource = await pixiHazardsResponse.text();
  if (
    !pixiHazardsResponse.ok ||
    !pixiHazardsSource.includes("RoguePixiHazards") ||
    !pixiHazardsSource.includes("hazardState") ||
    !pixiHazardsSource.includes("renderHazard") ||
    !pixiHazardsSource.includes("renderHazards")
  ) {
    throw new Error("pixi hazard bridge check failed");
  }
  const pixiEnemiesResponse = await fetch(`${ORIGIN}/pixi-enemies.js`);
  const pixiEnemiesSource = await pixiEnemiesResponse.text();
  if (
    !pixiEnemiesResponse.ok ||
    !pixiEnemiesSource.includes("RoguePixiEnemies") ||
    !pixiEnemiesSource.includes("enemyTextureKey") ||
    !pixiEnemiesSource.includes("enemyScale") ||
    !pixiEnemiesSource.includes("renderEnemies")
  ) {
    throw new Error("pixi enemy bridge check failed");
  }
  const pixiPlayersResponse = await fetch(`${ORIGIN}/pixi-players.js`);
  const pixiPlayersSource = await pixiPlayersResponse.text();
  if (
    !pixiPlayersResponse.ok ||
    !pixiPlayersSource.includes("RoguePixiPlayers") ||
    !pixiPlayersSource.includes("playerScale") ||
    !pixiPlayersSource.includes("renderPlayerAttackEffect") ||
    !pixiPlayersSource.includes("renderPlayers")
  ) {
    throw new Error("pixi player bridge check failed");
  }
  const pixiEffectsResponse = await fetch(`${ORIGIN}/pixi-effects.js`);
  const pixiEffectsSource = await pixiEffectsResponse.text();
  if (
    !pixiEffectsResponse.ok ||
    !pixiEffectsSource.includes("RoguePixiEffects") ||
    !pixiEffectsSource.includes("effectProgress") ||
    !pixiEffectsSource.includes("effectRadius") ||
    !pixiEffectsSource.includes("renderFloatingTextEffect") ||
    !pixiEffectsSource.includes("renderSlashEffect") ||
    !pixiEffectsSource.includes("renderSpinEffect") ||
    !pixiEffectsSource.includes("renderMobilityOrProjectileEffect") ||
    !pixiEffectsSource.includes("renderCoreSkillEffect") ||
    !pixiEffectsSource.includes("renderMeteorEffect") ||
    !pixiEffectsSource.includes("renderWarningEffect") ||
    !pixiEffectsSource.includes("renderExplosionEffect") ||
    !pixiEffectsSource.includes("renderSecondaryEffect") ||
    !pixiEffectsSource.includes("renderDefaultBurstEffect") ||
    !pixiEffectsSource.includes("renderNeonEffect")
  ) {
    throw new Error("pixi effects bridge check failed");
  }
  const pixiPrimitivesResponse = await fetch(`${ORIGIN}/pixi-primitives.js`);
  const pixiPrimitivesSource = await pixiPrimitivesResponse.text();
  if (
    !pixiPrimitivesResponse.ok ||
    !pixiPrimitivesSource.includes("RoguePixiPrimitives") ||
    !pixiPrimitivesSource.includes("circlePoints") ||
    !pixiPrimitivesSource.includes("arcPoints") ||
    !pixiPrimitivesSource.includes("coneShape") ||
    !pixiPrimitivesSource.includes("cleaveRibbonPoints") ||
    !pixiPrimitivesSource.includes("capsuleSegments") ||
    !pixiPrimitivesSource.includes("lightningPoints") ||
    !pixiPrimitivesSource.includes("starPoints") ||
    !pixiPrimitivesSource.includes("diamondPoints") ||
    !pixiPrimitivesSource.includes("gearPoints")
  ) {
    throw new Error("pixi primitives bridge check failed");
  }
  const pixiActorTexturesResponse = await fetch(`${ORIGIN}/pixi-actor-textures.js`);
  const pixiActorTexturesSource = await pixiActorTexturesResponse.text();
  if (
    !pixiActorTexturesResponse.ok ||
    !pixiActorTexturesSource.includes("RoguePixiActorTextures") ||
    !pixiActorTexturesSource.includes("drawActorSheetFrame") ||
    !pixiActorTexturesSource.includes("drawWarrior") ||
    !pixiActorTexturesSource.includes("drawRanger") ||
    !pixiActorTexturesSource.includes("drawMage") ||
    !pixiActorTexturesSource.includes("drawEngineer") ||
    !pixiActorTexturesSource.includes("drawPuppeteer") ||
    !pixiActorTexturesSource.includes("drawMartialist") ||
    !pixiActorTexturesSource.includes("gem") ||
    !pixiActorTexturesSource.includes("buckle") ||
    !pixiActorTexturesSource.includes("hairSpike") ||
    !pixiActorTexturesSource.includes("bootStraps") ||
    !pixiActorTexturesSource.includes("warrior") ||
    !pixiActorTexturesSource.includes("ranger") ||
    !pixiActorTexturesSource.includes("mage") ||
    !pixiActorTexturesSource.includes("engineer") ||
    !pixiActorTexturesSource.includes("puppeteer") ||
    !pixiActorTexturesSource.includes("martialist") ||
    !pixiActorTexturesSource.includes("alchemist") ||
    !pixiActorTexturesSource.includes("assassin")
  ) {
    throw new Error("pixi actor texture bridge check failed");
  }
  const pixiEnemyTexturesResponse = await fetch(`${ORIGIN}/pixi-enemy-textures.js`);
  const pixiEnemyTexturesSource = await pixiEnemyTexturesResponse.text();
  if (!pixiEnemyTexturesResponse.ok) {
    throw new Error(`pixi enemy texture bridge failed ${pixiEnemyTexturesResponse.status}`);
  }
  for (const expected of [
    "RoguePixiEnemyTextures",
    "drawEnemySheetFrame",
    "slime",
    "bat",
    "charger",
    "guardian",
    "shaman",
    "spitter",
    "bomber",
    "stalker",
    "mortar",
    "sniper",
    "brute",
    "runner",
    "training_dummy",
    "splitter",
    "splinter",
  ]) {
    if (!pixiEnemyTexturesSource.includes(expected)) {
      throw new Error(`pixi enemy texture bridge missing ${expected}`);
    }
  }
  const pixiBossTexturesResponse = await fetch(`${ORIGIN}/pixi-boss-textures.js`);
  const pixiBossTexturesSource = await pixiBossTexturesResponse.text();
  if (!pixiBossTexturesResponse.ok) {
    throw new Error(`pixi boss texture bridge failed ${pixiBossTexturesResponse.status}`);
  }
  for (const expected of [
    "RoguePixiBossTextures",
    "drawBossSheetFrame",
    "iron",
    "charge",
    "hive",
    "summon",
    "phase",
  ]) {
    if (!pixiBossTexturesSource.includes(expected)) {
      throw new Error(`pixi boss texture bridge missing ${expected}`);
    }
  }
  const pixiPalettesResponse = await fetch(`${ORIGIN}/pixi-palettes.js`);
  const pixiPalettesSource = await pixiPalettesResponse.text();
  if (
    !pixiPalettesResponse.ok ||
    !pixiPalettesSource.includes("RoguePixiPalettes") ||
    !pixiPalettesSource.includes("classPalettes") ||
    !pixiPalettesSource.includes("enemyPalettes") ||
    !pixiPalettesSource.includes("classPalette") ||
    !pixiPalettesSource.includes("enemyPalette")
  ) {
    throw new Error("pixi palettes bridge check failed");
  }
  const pixiTextureKeysResponse = await fetch(`${ORIGIN}/pixi-texture-keys.js`);
  const pixiTextureKeysSource = await pixiTextureKeysResponse.text();
  if (
    !pixiTextureKeysResponse.ok ||
    !pixiTextureKeysSource.includes("RoguePixiTextureKeys") ||
    !pixiTextureKeysSource.includes("actorTextureKey") ||
    !pixiTextureKeysSource.includes("enemyTextureKey") ||
    !pixiTextureKeysSource.includes("bossTextureInfo") ||
    !pixiTextureKeysSource.includes("projectileTextureKey") ||
    !pixiTextureKeysSource.includes("projectileColor") ||
    !pixiTextureKeysSource.includes("floorTileKey") ||
    !pixiTextureKeysSource.includes("wallBlockKey")
  ) {
    throw new Error("pixi texture key bridge check failed");
  }
  const pixiWorldTexturesResponse = await fetch(`${ORIGIN}/pixi-world-textures.js`);
  const pixiWorldTexturesSource = await pixiWorldTexturesResponse.text();
  if (
    !pixiWorldTexturesResponse.ok ||
    !pixiWorldTexturesSource.includes("RoguePixiWorldTextures") ||
    !pixiWorldTexturesSource.includes("chapterTileThemes") ||
    !pixiWorldTexturesSource.includes("drawFloorTile") ||
    !pixiWorldTexturesSource.includes("drawLegacyFloorTile") ||
    !pixiWorldTexturesSource.includes("drawDefaultWallBlock") ||
    !pixiWorldTexturesSource.includes("drawWallBlock") ||
    !pixiWorldTexturesSource.includes("drawDefaultTorch") ||
    !pixiWorldTexturesSource.includes("drawTorch")
  ) {
    throw new Error("pixi world texture bridge check failed");
  }
  const pixiCommonTexturesResponse = await fetch(`${ORIGIN}/pixi-common-textures.js`);
  const pixiCommonTexturesSource = await pixiCommonTexturesResponse.text();
  if (
    !pixiCommonTexturesResponse.ok ||
    !pixiCommonTexturesSource.includes("RoguePixiCommonTextures") ||
    !pixiCommonTexturesSource.includes("drawShadow") ||
    !pixiCommonTexturesSource.includes("drawReticle") ||
    !pixiCommonTexturesSource.includes("drawXpOrb") ||
    !pixiCommonTexturesSource.includes("drawChest") ||
    !pixiCommonTexturesSource.includes("drawWarningRing") ||
    !pixiCommonTexturesSource.includes("drawSlashArc") ||
    !pixiCommonTexturesSource.includes("drawBurst") ||
    !pixiCommonTexturesSource.includes("drawBeam")
  ) {
    throw new Error("pixi common texture bridge check failed");
  }
  const pixiMeleeTexturesResponse = await fetch(`${ORIGIN}/pixi-melee-textures.js`);
  const pixiMeleeTexturesSource = await pixiMeleeTexturesResponse.text();
  if (
    !pixiMeleeTexturesResponse.ok ||
    !pixiMeleeTexturesSource.includes("RoguePixiMeleeTextures") ||
    !pixiMeleeTexturesSource.includes("drawSwordCut") ||
    !pixiMeleeTexturesSource.includes("drawCleave") ||
    !pixiMeleeTexturesSource.includes("drawWarriorCone") ||
    !pixiMeleeTexturesSource.includes("drawWarriorCleaveCone") ||
    !pixiMeleeTexturesSource.includes("drawWarriorBlade") ||
    !pixiMeleeTexturesSource.includes("drawWarriorSpinBlade") ||
    !pixiMeleeTexturesSource.includes("drawChargeLane") ||
    !pixiMeleeTexturesSource.includes("drawSpin") ||
    !pixiMeleeTexturesSource.includes("drawImpactStar") ||
    !pixiMeleeTexturesSource.includes("drawShieldWedge") ||
    !pixiMeleeTexturesSource.includes("drawTauntBurst")
  ) {
    throw new Error("pixi melee texture bridge check failed");
  }
  const pixiRangedTexturesResponse = await fetch(`${ORIGIN}/pixi-ranged-textures.js`);
  const pixiRangedTexturesSource = await pixiRangedTexturesResponse.text();
  if (
    !pixiRangedTexturesResponse.ok ||
    !pixiRangedTexturesSource.includes("RoguePixiRangedTextures") ||
    !pixiRangedTexturesSource.includes("drawArrowStreak") ||
    !pixiRangedTexturesSource.includes("drawArrowFan") ||
    !pixiRangedTexturesSource.includes("drawArrowRain") ||
    !pixiRangedTexturesSource.includes("drawPierceLance")
  ) {
    throw new Error("pixi ranged texture bridge check failed");
  }
  const pixiElementalTexturesResponse = await fetch(`${ORIGIN}/pixi-elemental-textures.js`);
  const pixiElementalTexturesSource = await pixiElementalTexturesResponse.text();
  if (
    !pixiElementalTexturesResponse.ok ||
    !pixiElementalTexturesSource.includes("RoguePixiElementalTextures") ||
    !pixiElementalTexturesSource.includes("drawLightning") ||
    !pixiElementalTexturesSource.includes("drawFrostShards") ||
    !pixiElementalTexturesSource.includes("drawFireBloom") ||
    !pixiElementalTexturesSource.includes("drawPoisonCloud") ||
    !pixiElementalTexturesSource.includes("drawHealCross") ||
    !pixiElementalTexturesSource.includes("drawShieldHex") ||
    !pixiElementalTexturesSource.includes("drawWarningTarget") ||
    !pixiElementalTexturesSource.includes("drawStarBurst") ||
    !pixiElementalTexturesSource.includes("drawMeteorFall") ||
    !pixiElementalTexturesSource.includes("drawFrostSnap") ||
    !pixiElementalTexturesSource.includes("drawAcidSplash") ||
    !pixiElementalTexturesSource.includes("drawFirePool") ||
    !pixiElementalTexturesSource.includes("drawSmoke")
  ) {
    throw new Error("pixi elemental texture bridge check failed");
  }
  const pixiClassTexturesResponse = await fetch(`${ORIGIN}/pixi-class-textures.js`);
  const pixiClassTexturesSource = await pixiClassTexturesResponse.text();
  if (
    !pixiClassTexturesResponse.ok ||
    !pixiClassTexturesSource.includes("RoguePixiClassTextures") ||
    !pixiClassTexturesSource.includes("drawTurret") ||
    !pixiClassTexturesSource.includes("drawMine") ||
    !pixiClassTexturesSource.includes("drawDrone") ||
    !pixiClassTexturesSource.includes("drawPuppet") ||
    !pixiClassTexturesSource.includes("drawThreadKnot") ||
    !pixiClassTexturesSource.includes("drawFist") ||
    !pixiClassTexturesSource.includes("drawPalmWave") ||
    !pixiClassTexturesSource.includes("drawFlask") ||
    !pixiClassTexturesSource.includes("drawAssassinMark") ||
    !pixiClassTexturesSource.includes("drawShadowCut")
  ) {
    throw new Error("pixi class texture bridge check failed");
  }
  const pixiSkillEffectsResponse = await fetch(`${ORIGIN}/pixi-skill-effects.js`);
  const pixiSkillEffectsSource = await pixiSkillEffectsResponse.text();
  if (
    !pixiSkillEffectsResponse.ok ||
    !pixiSkillEffectsSource.includes("RoguePixiSkillEffects") ||
    !pixiSkillEffectsSource.includes("normalizeSkillStyle") ||
    !pixiSkillEffectsSource.includes("skillEffectPhase") ||
    !pixiSkillEffectsSource.includes("createStyledSkillContext") ||
    !pixiSkillEffectsSource.includes("shouldRenderStyledSkill") ||
    !pixiSkillEffectsSource.includes("renderWarriorStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderWarriorShieldChargeEffect") ||
    !pixiSkillEffectsSource.includes("renderWarriorSpinEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerArrowRainEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerVolleyEffect") ||
    !pixiSkillEffectsSource.includes("renderMageStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderMageMeteorEffect") ||
    !pixiSkillEffectsSource.includes("renderMageChainEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerBeamEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerMineEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetThreadLinesEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetThreadKnotEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialPalmEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialRisingEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistThrowEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistElixirEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistReactionEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinLungeEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinSmokeEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinMarkEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonWarningEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonImpactEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispCommonStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispPrimaryClassStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispRangerEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispMageEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispEngineerEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispClassStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispAlchemistEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispPuppetEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispMartialEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispAssassinEffect") ||
    !pixiSkillEffectsSource.includes("renderSkillEffectPolishLayer") ||
    !pixiSkillEffectsSource.includes("renderNeonClassSignatureLayer") ||
    !pixiSkillEffectsSource.includes("renderSkillDirectionPolish") ||
    !pixiSkillEffectsSource.includes("renderSkillImpactPolish") ||
    !pixiSkillEffectsSource.includes("renderSkillAuraPolish") ||
    !pixiSkillEffectsSource.includes('kind === "warning" && !s.includes("taunt")') ||
    !pixiSkillEffectsSource.includes("coneHalfAngleFromArcDot") ||
    !pixiSkillEffectsSource.includes("warrior_basic") ||
    !pixiSkillEffectsSource.includes("warrior_cleave") ||
    !pixiSkillEffectsSource.includes("warrior_spin")
  ) {
    throw new Error("pixi skill effects bridge check failed");
  }
  const pixiParticlesResponse = await fetch(`${ORIGIN}/pixi-particles.js`);
  const pixiParticlesSource = await pixiParticlesResponse.text();
  if (
    !pixiParticlesResponse.ok ||
    !pixiParticlesSource.includes("RoguePixiParticles") ||
    !pixiParticlesSource.includes("ParticleEngine") ||
    !pixiParticlesSource.includes("PARTICLE_PRESETS") ||
    !pixiParticlesSource.includes("DEFAULT_PARTICLE_BUDGETS") ||
    !pixiParticlesSource.includes("renderPreset") ||
    !pixiParticlesSource.includes("pressure") ||
    !pixiParticlesSource.includes("hitSpark") ||
    !pixiParticlesSource.includes("slashTrail") ||
    !pixiParticlesSource.includes("fireBurst") ||
    !pixiParticlesSource.includes("poisonBurst") ||
    !pixiParticlesSource.includes("frostBurst") ||
    !pixiParticlesSource.includes("healMist") ||
    !pixiParticlesSource.includes("smokePuff") ||
    !pixiParticlesSource.includes("bladeGlint") ||
    !pixiParticlesSource.includes("arcaneDust") ||
    !pixiParticlesSource.includes("lightningFork")
  ) {
    throw new Error("pixi particle bridge check failed");
  }
  const clientResponse = await fetch(`${ORIGIN}/client.js`);
  const clientSource = await clientResponse.text();
  if (
    !clientResponse.ok ||
    !clientSource.includes("SETTINGS_VERSION") ||
    !clientSource.includes("__rogueSettings") ||
    !clientSource.includes("__rogueProgress") ||
    !clientSource.includes("recordDisplayedResult") ||
    !clientSource.includes("getResultSaveKey") ||
    !clientSource.includes("progressRuns") ||
    !clientSource.includes("exportUserProgress") ||
    !clientSource.includes("importUserProgress") ||
    !clientSource.includes("RogueClientRuntime") ||
    !clientSource.includes("RogueInputManager") ||
    !clientSource.includes("lobbySetSkillUpgrade") ||
    !clientSource.includes("lobbySetRelicLevel") ||
    !clientSource.includes("renderLobbyTestCustomizer") ||
    !clientSource.includes("renderLobbyWorkspaceChrome") ||
    !clientSource.includes("renderLobbyArenaMode") ||
    !clientSource.includes("requestLobbyClassChange") ||
    !clientSource.includes("bootstrapServerAccount") ||
    !clientSource.includes("accountProgressAction") ||
    !clientSource.includes("applyServerProgress") ||
    !clientSource.includes("renderRunContextHud") ||
    !clientSource.includes("drawHealthShieldGauge") ||
    !pixiRendererSource.includes("healthShieldBar") ||
    !clientSource.includes("sendClientMessage") ||
    !clientSource.includes("startHeartbeat") ||
    !clientSource.includes("scheduleReconnect")
  ) {
    throw new Error("클라이언트 런타임 배포 확인 실패");
  }
  const clientRuntimeResponse = await fetch(`${ORIGIN}/client-runtime.js`);
  const clientRuntimeSource = await clientRuntimeResponse.text();
  if (
    !clientRuntimeResponse.ok ||
    !clientRuntimeSource.includes("RogueClientRuntime") ||
    !clientRuntimeSource.includes("normalizeSettings") ||
    !clientRuntimeSource.includes("migrateSettings") ||
    !clientRuntimeSource.includes("LEGACY_SETTINGS_KEYS") ||
    !clientRuntimeSource.includes("matchesActionKey") ||
    !clientRuntimeSource.includes("getReconnectDelay") ||
    !clientRuntimeSource.includes("createDiagnostics")
  ) {
    throw new Error("client runtime bridge check failed");
  }
  const clientAccountResponse = await fetch(`${ORIGIN}/client-account.js`);
  const clientAccountSource = await clientAccountResponse.text();
  if (
    !clientAccountResponse.ok ||
    !clientAccountSource.includes("RogueAccountManager") ||
    !clientAccountSource.includes("/api/account/session") ||
    !clientAccountSource.includes("getRecoveryKey")
  ) {
    throw new Error("client account bridge check failed");
  }
  const clientSaveResponse = await fetch(`${ORIGIN}/client-save.js`);
  const clientSaveSource = await clientSaveResponse.text();
  if (
    !clientSaveResponse.ok ||
    !clientSaveSource.includes("RogueSaveManager") ||
    !clientSaveSource.includes("SAVE_VERSION") ||
    !clientSaveSource.includes("PROGRESS_KEY") ||
    !clientSaveSource.includes("normalizeProgress") ||
    !clientSaveSource.includes("migrateProgress") ||
    !clientSaveSource.includes("exportUserProgress") ||
    !clientSaveSource.includes("importUserProgress") ||
    !clientSaveSource.includes("recordRunResult") ||
    !clientSaveSource.includes("calculateRunRewards") ||
    !clientSaveSource.includes("spendMasteryPoint") ||
    !clientSaveSource.includes("getGrowthLoadout")
  ) {
    throw new Error("client save manager bridge check failed");
  }
  const clientInputResponse = await fetch(`${ORIGIN}/client-input.js`);
  const clientInputSource = await clientInputResponse.text();
  if (
    !clientInputResponse.ok ||
    !clientInputSource.includes("RogueInputManager") ||
    !clientInputSource.includes("readMove") ||
    !clientInputSource.includes("getSkillSeqs") ||
    !clientInputSource.includes("getDashSeq")
  ) {
    throw new Error("client input bridge check failed");
  }
  const clientNetworkResponse = await fetch(`${ORIGIN}/client-network.js`);
  const clientNetworkSource = await clientNetworkResponse.text();
  if (
    !clientNetworkResponse.ok ||
    !clientNetworkSource.includes("RogueNetworkBridge") ||
    !clientNetworkSource.includes("canSend") ||
    !clientNetworkSource.includes("createSocket") ||
    !clientNetworkSource.includes("closeSocket") ||
    !clientNetworkSource.includes("createConnectionSupervisor") ||
    !clientNetworkSource.includes("JSON.stringify")
  ) {
    throw new Error("client network bridge check failed");
  }
  const clientHudResponse = await fetch(`${ORIGIN}/client-hud.js`);
  const clientHudSource = await clientHudResponse.text();
  if (
    !clientHudResponse.ok ||
    !clientHudSource.includes("RogueHudController") ||
    !clientHudSource.includes("renderTop") ||
    !clientHudSource.includes("setConnection") ||
    !clientHudSource.includes("formatStageLabel")
  ) {
    throw new Error("client hud bridge check failed");
  }
  const clientChoiceResponse = await fetch(`${ORIGIN}/client-choice.js`);
  const clientChoiceSource = await clientChoiceResponse.text();
  if (
    !clientChoiceResponse.ok ||
    !clientChoiceSource.includes("RogueChoiceController") ||
    !clientChoiceSource.includes("renderRelicChoices") ||
    !clientChoiceSource.includes("renderSkillChoices")
  ) {
    throw new Error("client choice controller check failed");
  }
  const clientLobbyResponse = await fetch(`${ORIGIN}/client-lobby.js`);
  const clientLobbySource = await clientLobbyResponse.text();
  if (
    !clientLobbyResponse.ok ||
    !clientLobbySource.includes("RogueLobbyController") ||
    !clientLobbySource.includes("renderParty") ||
    !clientLobbySource.includes("renderClassDetail")
  ) {
    throw new Error("client lobby controller check failed");
  }
  const clientMapResponse = await fetch(`${ORIGIN}/client-map.js`);
  const clientMapSource = await clientMapResponse.text();
  if (
    !clientMapResponse.ok ||
    !clientMapSource.includes("RogueMapController") ||
    !clientMapSource.includes("renderChoices") ||
    !clientMapSource.includes("renderBoard")
  ) {
    throw new Error("client map controller check failed");
  }
  const clientResultResponse = await fetch(`${ORIGIN}/client-result.js`);
  const clientResultSource = await clientResultResponse.text();
  if (
    !clientResultResponse.ok ||
    !clientResultSource.includes("RogueResultController") ||
    !clientResultSource.includes("renderStats") ||
    !clientResultSource.includes("renderPlayers") ||
    !clientResultSource.includes("result-player-metrics")
  ) {
    throw new Error("client result controller check failed");
  }
  console.log("http ok");
}

async function checkClientSaveRuntimeContract() {
  const clientSaveResponse = await fetch(`${ORIGIN}/client-save.js`);
  const clientSaveSource = await clientSaveResponse.text();
  if (!clientSaveResponse.ok) {
    throw new Error("client save runtime contract fetch failed");
  }

  const storage = new Map();
  const sandbox = {
    window: {},
    structuredClone: globalThis.structuredClone,
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => {
        storage.set(key, String(value));
      },
      removeItem: (key) => {
        storage.delete(key);
      }
    },
    JSON,
    Date
  };
  sandbox.window.localStorage = sandbox.localStorage;
  vm.runInNewContext(clientSaveSource, sandbox, { filename: "client-save.js" });
  const clientProgressionResponse = await fetch(`${ORIGIN}/client-progression.js`);
  const clientProgressionSource = await clientProgressionResponse.text();
  if (!clientProgressionResponse.ok) {
    throw new Error("client progression runtime contract fetch failed");
  }
  if (
    !clientProgressionSource.includes("warden_bulwark") ||
    !clientProgressionSource.includes("SET_BONUSES") ||
    !clientProgressionSource.includes("ranger_poison_million") ||
    !clientProgressionSource.includes("turretKillDurationBonus") ||
    !clientProgressionSource.includes("SEASON_REWARDS") ||
    !clientProgressionSource.includes("meta-codex-list") ||
    !clientProgressionSource.includes("personal-missions")
  ) {
    throw new Error("detailed progression content contract missing");
  }
  vm.runInNewContext(clientProgressionSource, sandbox, { filename: "client-progression.js" });
  const manager = sandbox.window.RogueSaveManager;
  if (!manager || manager.SAVE_VERSION !== 4 || !manager.PROGRESS_KEY || !manager.LEGACY_PROGRESS_KEYS) {
    throw new Error("client save runtime manager missing");
  }
  const defeatRewards = manager.calculateRunRewards({ outcome: "defeat", stagesCleared: 2, highestLevel: 7, totalScore: 1200, totalRelics: 3 });
  const victoryRewards = manager.calculateRunRewards({ outcome: "victory", stagesCleared: 3, highestLevel: 15, totalScore: 5000, totalRelics: 8 });
  if (
    !defeatRewards.rewardBreakdown.some((entry) => entry.id === "outcome" && entry.value === "50%") ||
    !victoryRewards.rewardBreakdown.some((entry) => entry.id === "outcome" && entry.value === "200%") ||
    victoryRewards.earnedShards <= defeatRewards.earnedShards ||
    victoryRewards.earnedAccountXp <= defeatRewards.earnedAccountXp
  ) {
    throw new Error("run outcome reward multiplier contract failed");
  }
  const archiveHtml = manager.renderProgressionPanel(manager.defaultProgress, { activeTab: "archive", classId: "warrior", embedded: true });
  const cosmeticsHtml = manager.renderProgressionPanel(manager.normalizeProgress({
    skins: ["victory_trim", "abyss_glow", "season_ember", "season_verdant"],
    cosmetics: { selectedSkin: "season_ember" },
  }), { activeTab: "cosmetics", classId: "warrior", embedded: true });
  const equipmentCodexHtml = manager.renderCodexEntryDetail("equipment", "vanguard_blade", true);
  const runeCodexHtml = manager.renderCodexEntryDetail("rune", "ward", true);
  const eclipseRuneCodexHtml = manager.renderCodexEntryDetail("rune", "eclipse", true);
  const defeatDiscoveries = manager.recordWorldDiscoveries(manager.defaultProgress, {
    enemies: [{ type: "slime" }, { type: "boss", bossId: "iron_warden" }],
    players: [],
  });
  const monsterCodexHtml = manager.renderCodexEntryDetail("monster", "guardian", true);
  const bossCodexHtml = manager.renderCodexEntryDetail("boss", "fate_executioner", false);
  const relicCodexHtml = manager.renderCodexEntryDetail("relic", "cooling_gear", true);
  const migratedDashItemProgress = manager.normalizeProgress({
    inventory: {
      items: [{
        id: "legacy-dash-item",
        baseId: "afterimage_bow",
        rarity: "epic",
        affixes: [{ id: "dash", value: 0.1 }, { id: "power", value: 0.04 }],
      }],
      runes: [],
      bossMaterials: {},
    },
  });
  const migratedDashItem = migratedDashItemProgress.inventory.items[0];
  const signatureBonuses = {};
  for (const classId of ["warrior", "ranger", "mage", "engineer"]) {
    const items = ["weapon", "armor", "amulet", "core"].map((slot) => ({
      id: `${classId}-${slot}-signature`,
      baseId: `${classId}_${slot}_1`,
      rarity: "epic",
      itemLevel: 1,
      enhance: 0,
      affixes: [],
      rerolls: 0,
      lockedAffixIndex: -1,
    }));
    const progress = manager.normalizeProgress({
      inventory: { items, runes: [], bossMaterials: {} },
      equipment: {
        [classId]: {
          weapon: `${classId}-weapon-signature`,
          armor: `${classId}-armor-signature`,
          amulet: `${classId}-amulet-signature`,
          core: `${classId}-core-signature`,
          runes: [],
        },
      },
    });
    signatureBonuses[classId] = manager.calculateEquipmentBonuses(progress, classId);
  }
  const bossItemBonuses = {};
  for (const [baseId, slot] of [["warden_bulwark", "armor"], ["prophet_censer", "amulet"], ["regent_engine", "core"], ["abyss_crown", "amulet"]]) {
    const itemId = `boss-contract-${baseId}`;
    const progress = manager.normalizeProgress({
      inventory: {
        items: [{ id: itemId, baseId, rarity: "mythic", itemLevel: 1, enhance: 5, affixes: [], rerolls: 0 }],
        runes: [],
        bossMaterials: {},
      },
      equipment: { warrior: { weapon: "", armor: "", amulet: "", core: "", runes: [], [slot]: itemId } },
    });
    bossItemBonuses[baseId] = manager.calculateEquipmentBonuses(progress, "warrior");
  }
  const bossDropTargets = new Set(["warden_bulwark", "prophet_censer", "regent_engine", "abyss_crown"]);
  const regularBossDropBases = new Set();
  for (let index = 0; index < 2000 && regularBossDropBases.size < bossDropTargets.size; index += 1) {
    const drop = manager.grantEquipmentDrop(manager.defaultProgress, {
      dropId: `boss-pool-contract-${index}`,
      classId: "warrior",
      highestLevel: 30,
      abyssDepth: 10,
      ascensionLevel: 5,
      rarity: "epic",
    });
    if (bossDropTargets.has(drop.item?.baseId)) regularBossDropBases.add(drop.item.baseId);
  }
  const bossForgeHtml = manager.renderProgressionPanel(manager.defaultProgress, { activeTab: "forge", classId: "warrior", embedded: true });
  if (
    !archiveHtml.includes("data-codex-entry") ||
    !archiveHtml.includes("meta-codex-inspector") ||
    archiveHtml.includes("meta-cosmetic-list") ||
    !cosmeticsHtml.includes("skin-choice active") ||
    !cosmeticsHtml.includes("직업 장비에 왕실 금장과 태양 문장") ||
    !cosmeticsHtml.includes("직업 공격에 심연 균열 잔광") ||
    !cosmeticsHtml.includes("직업 무기와 스킬에 잿불 궤적") ||
    !cosmeticsHtml.includes("직업 장비에 생명 문양과 잎 장식") ||
    !equipmentCodexHtml.includes("슬롯별 주 능력치") ||
    !equipmentCodexHtml.includes("+5 / +10 / +15 / +20") ||
    !equipmentCodexHtml.includes("최대 체력 +7%") ||
    !runeCodexHtml.includes("X") ||
    !runeCodexHtml.includes("방어 +1.85") ||
    !eclipseRuneCodexHtml.includes(">contrast<") ||
    eclipseRuneCodexHtml.includes(">eclipse<") ||
    !defeatDiscoveries.changed ||
    !defeatDiscoveries.progress.collections.monsters.includes("slime") ||
    !defeatDiscoveries.progress.collections.bosses.includes("iron_warden") ||
    !monsterCodexHtml.includes("기본 체력") ||
    !monsterCodexHtml.includes("185") ||
    !bossCodexHtml.includes("운명의 집행자") ||
    !bossCodexHtml.includes("체력 80% / 55% / 28%") ||
    !relicCodexHtml.includes("+50") ||
    !relicCodexHtml.includes("최대 스킬 가속은 500") ||
    migratedDashItem.special !== "crit_amp" ||
    migratedDashItem.affixes.some((affix) => affix.id === "dash") ||
    new Set(migratedDashItem.affixes.map((affix) => affix.id)).size !== migratedDashItem.affixes.length ||
    signatureBonuses.warrior.warriorWhirlwindEcho !== 1 ||
    signatureBonuses.warrior.vanguardWhirlwindGuard !== 1 ||
    signatureBonuses.ranger.rangerVolleyBonus !== 2 ||
    signatureBonuses.ranger.hunterRainBarrage !== 1 ||
    signatureBonuses.mage.mageStarSplit !== 1 ||
    signatureBonuses.mage.arcanistPiercingFragments !== 1 ||
    signatureBonuses.engineer.engineerAuxTurret !== 1 ||
    signatureBonuses.engineer.mechanistTurretMine !== 1 ||
    bossItemBonuses.warden_bulwark.lowHpShieldRatio !== 0.35 ||
    bossItemBonuses.warden_bulwark.maxHpMul < 1.12 ||
    bossItemBonuses.warden_bulwark.armorBonus < 1.5 ||
    bossItemBonuses.prophet_censer.statusDamageMul < 1.22 ||
    bossItemBonuses.prophet_censer.poisonStackCapBonus !== 2 ||
    bossItemBonuses.prophet_censer.regenBonus < 0.35 ||
    bossItemBonuses.regent_engine.damageMul < 1.1 ||
    bossItemBonuses.regent_engine.areaMul < 1.14 ||
    bossItemBonuses.regent_engine.skillHaste < 8 ||
    bossItemBonuses.abyss_crown.damageMul < 1.12 ||
    bossItemBonuses.abyss_crown.eliteBossDamageMul < 1.25 ||
    bossItemBonuses.abyss_crown.bossFinisherMul !== 1.45 ||
    bossItemBonuses.abyss_crown.bossFinisherThreshold !== 0.2 ||
    regularBossDropBases.size !== bossDropTargets.size ||
    bossForgeHtml.includes('data-progression-action="craft-boss"') ||
    clientProgressionSource.includes("BOSS_RECIPES") ||
    clientProgressionSource.includes("bossCraft")
  ) {
    throw new Error("interactive archive codex detail contract failed");
  }

  const result = manager.recordRunResult(manager.defaultProgress, {
    outcome: "victory",
    resultKey: "contract-run-1",
    chapter: 2,
    wave: 5,
    highestLevel: 7,
    totalScore: 1234,
    totalRelics: 6,
    durationSec: 91,
    stagesCleared: 100,
    abyssDepth: 2,
    ascensionLevel: 3,
    classId: "mage",
    combatStats: { damage: 1000000, poisonDamage: 220, burnDamage: 3300, kills: 1000, eliteKills: 100, turretKills: 0, bossKills: 10 },
    bossDefeats: ["hive_prophet"],
    noDown: true
  });
  if (
    result.version !== 4 ||
    result.statistics.runs !== 1 ||
    result.statistics.victories !== 1 ||
    result.statistics.highestChapter !== 2 ||
    result.bestClear.outcome !== "victory" ||
    result.currencies.abyssShards <= 0 ||
    result.account.xp <= 0 ||
    result.records.highestAbyssDepth !== 2 ||
    result.records.highestAscension !== 3 ||
    result.records.classBestAscension.mage !== 3 ||
    result.inventory.items.length !== 0 ||
    result.inventory.runes.length === 0 ||
    result.currencies.enhancementStones <= 0 ||
    Number(result.inventory.bossMaterials.hive_prophet || 0) !== 0 ||
    result.combatByClass.mage.burnDamage !== 3300 ||
    result.combatByClass.mage.eliteKills !== 100 ||
    !result.challenges.daily.completed ||
    !result.challenges.weekly.completed ||
    result.combatByClass.mage.noDownWins !== 1
  ) {
    throw new Error("client save runtime result recording failed");
  }
  const fieldDropInput = {
    dropId: "smoke-field-equipment-1",
    classId: "mage",
    highestLevel: 7,
    abyssDepth: 2,
    ascensionLevel: 3,
  };
  const fieldDropPreview = manager.getEquipmentDropPreview(fieldDropInput);
  const fieldDrop = manager.grantEquipmentDrop(result, fieldDropInput);
  if (
    !fieldDrop.item ||
    fieldDrop.item.rarity !== fieldDropPreview.rarity ||
    fieldDrop.progress.inventory.items.length !== 1 ||
    fieldDrop.progress.statistics.itemsFound !== 1
  ) {
    throw new Error("field equipment drop grant failed");
  }
  const cappedFieldDrop = manager.grantEquipmentDrop(fieldDrop.progress, {
    ...fieldDropInput,
    dropId: "smoke-field-equipment-cap",
    rarity: "mythic",
    rarityCap: "rare",
  });
  if (!cappedFieldDrop.item || cappedFieldDrop.item.rarity !== "rare") {
    throw new Error("early field equipment rarity cap failed");
  }
  if (!manager.getLiveEvent || !manager.getLiveEvent(new Date("2026-07-11T12:00:00")).active) {
    throw new Error("client progression live event failed");
  }
  const duplicate = manager.recordRunResult(result, {
    outcome: "victory",
    resultKey: "contract-run-1",
    chapter: 2,
    wave: 5,
    highestLevel: 7,
    totalScore: 1234,
    totalRelics: 6,
    durationSec: 91,
    abyssDepth: 2,
    ascensionLevel: 3
  });
  if (duplicate.statistics.runs !== 1 || duplicate.currencies.abyssShards !== result.currencies.abyssShards) {
    throw new Error("client save runtime duplicate reward guard failed");
  }

  const spendable = manager.normalizeProgress({
    ...fieldDrop.progress,
    currencies: { abyssShards: 999 },
    mastery: {
      shared: { points: 0, nodes: { damage: 0, maxHp: 0, regen: 0, moveSpeed: 0, cooldown: 0, critDamage: 0, area: 0 } }
    }
  });
  const masterySpend = manager.spendMasteryPoint(spendable, "warrior", "damage");
  const invested = masterySpend.progress;
  if (
    !masterySpend.spent ||
    masterySpend.cost <= 0 ||
    invested.mastery.shared.nodes.damage !== 1 ||
    invested.currencies.abyssShards >= spendable.currencies.abyssShards
  ) {
    throw new Error("client save runtime mastery spend failed");
  }
  const growthLoadout = manager.getGrowthLoadout(invested, "warrior", 2);
  if (
    growthLoadout.classId !== "warrior" ||
    growthLoadout.nodes.damage !== 1 ||
    growthLoadout.ascensionLevel !== 2 ||
    !growthLoadout.gearBonuses ||
    !growthLoadout.accountBonuses ||
    !growthLoadout.challenge ||
    !growthLoadout.cosmetic ||
    Object.prototype.hasOwnProperty.call(growthLoadout, "startPerkId")
  ) {
    throw new Error("client save runtime growth loadout failed");
  }
  const accountBonuses = manager.calculateAccountLevelBonuses(12);
  const maxAccountBonuses = manager.calculateAccountLevelBonuses(999);
  if (
    accountBonuses.damageMul !== 1.11 ||
    accountBonuses.maxHpMul !== 1.11 ||
    accountBonuses.armorBonus !== 1.32 ||
    accountBonuses.critChanceBonus !== 0.033 ||
    accountBonuses.areaMul !== 1.055 ||
    maxAccountBonuses.critChanceBonus !== 0.1
  ) {
    throw new Error("account level global stat bonus contract failed");
  }
  const migratedMastery = manager.normalizeProgress({
    mastery: {
      warrior: { points: 8, nodes: { attack: 2, survival: 3, speed: 4, special: 5 } }
    }
  }).mastery.shared.nodes;
  if (
    migratedMastery.damage !== 2 ||
    migratedMastery.critDamage !== 2 ||
    migratedMastery.maxHp !== 3 ||
    migratedMastery.regen !== 3 ||
    migratedMastery.moveSpeed !== 4 ||
    migratedMastery.cooldown !== 4 ||
    migratedMastery.area !== 5 ||
    Object.prototype.hasOwnProperty.call(migratedMastery, "special")
  ) {
    throw new Error("legacy bundled mastery migration failed");
  }
  const combinedLegacy = manager.normalizeProgress({
    mastery: {
      warrior: { nodes: { damage: 2 } },
      mage: { nodes: { damage: 3, area: 1 } },
    },
  });
  const normalizedAgain = manager.normalizeProgress(combinedLegacy);
  if (
    combinedLegacy.mastery.shared.nodes.damage !== 5 ||
    combinedLegacy.mastery.shared.nodes.area !== 1 ||
    normalizedAgain.mastery.shared.nodes.damage !== 5 ||
    Object.keys(normalizedAgain.mastery).length !== 1
  ) {
    throw new Error("shared mastery migration failed");
  }
  const splitNodes = { damage: 2, maxHp: 2, regen: 2, moveSpeed: 2, cooldown: 2, critDamage: 2, area: 2 };
  const warriorGrowth = manager.calculateGrowthBonuses("warrior", splitNodes);
  const mageGrowth = manager.calculateGrowthBonuses("mage", splitNodes);
  if (
    JSON.stringify(warriorGrowth) !== JSON.stringify(mageGrowth) ||
    warriorGrowth.armorBonus !== 0 ||
    warriorGrowth.critChanceBonus !== 0 ||
    warriorGrowth.skillDamageMul !== 1 ||
    warriorGrowth.constructDamageMul !== 1
  ) {
    throw new Error("class-specific mastery bonus was not removed");
  }

  const lootItem = invested.inventory.items[0];
  const equipped = manager.performProgressionAction(invested, {
    action: "equip-item",
    classId: lootItem.classId === "all" ? "warrior" : lootItem.classId,
    itemId: lootItem.id
  });
  if (!equipped.changed || !equipped.affectsLoadout) {
    throw new Error("client progression equipment action failed");
  }
  const forgeBase = manager.normalizeProgress({
    currencies: { enhancementStones: 999, reforgingDust: 999 },
    inventory: {
      items: [{
        id: "forge-contract-item",
        baseId: "hunter_talisman",
        rarity: "epic",
        itemLevel: 10,
        enhance: 10,
        rerolls: 0,
        lockedAffixIndex: -1,
        affixes: [
          { id: "power", value: 0.08 },
          { id: "vitality", value: 0.09 },
          { id: "critical", value: 0.07 },
        ],
      }],
      runes: [],
      bossMaterials: {},
    },
    equipment: { warrior: { weapon: "", armor: "", amulet: "forge-contract-item", core: "", runes: [] } },
  });
  const makeMilestoneProgress = (enhance) => manager.normalizeProgress({
    inventory: {
      items: [{ id: "milestone-weapon", baseId: "vanguard_blade", rarity: "common", itemLevel: 10, enhance, affixes: [{ id: "vitality", value: 0.2 }] }],
      runes: [], bossMaterials: {},
    },
    equipment: { warrior: { weapon: "milestone-weapon", armor: "", amulet: "", core: "", runes: [] } },
  });
  const milestoneFour = makeMilestoneProgress(4);
  const milestoneFive = makeMilestoneProgress(5);
  const uniqueMilestoneFive = manager.normalizeProgress({
    inventory: {
      items: [{ id: "unique-milestone-weapon", baseId: "vanguard_blade", rarity: "unique", itemLevel: 10, enhance: 5, milestoneAffixes: [{ id: "vitality", value: 0.04, milestone: 5, quality: 100 }] }],
      runes: [], bossMaterials: {},
    },
    equipment: { warrior: { weapon: "unique-milestone-weapon", armor: "", amulet: "", core: "", runes: [] } },
  });
  const makeQualityProgress = (id, quality) => manager.normalizeProgress({
    inventory: {
      items: [{ id, baseId: "vanguard_blade", rarity: "unique", itemLevel: 10, enhance: 5, milestoneAffixes: [{ id: "vitality", value: 0.04, milestone: 5, quality }] }],
      runes: [], bossMaterials: {},
    },
    equipment: { warrior: { weapon: id, armor: "", amulet: "", core: "", runes: [] } },
  });
  const qualityFloorProgress = makeQualityProgress("quality-floor-weapon", 1);
  const qualityCeilingProgress = makeQualityProgress("quality-ceiling-weapon", 100);
  const legacyQualityInput = {
    inventory: { items: [{ id: "legacy-quality-weapon", baseId: "vanguard_blade", rarity: "epic", itemLevel: 10, enhance: 5, milestoneAffixes: [{ id: "vitality", value: 0.04, milestone: 5 }] }], runes: [], bossMaterials: {} },
  };
  const legacyQualityA = manager.normalizeProgress(legacyQualityInput).inventory.items[0].milestoneAffixes[0].quality;
  const legacyQualityB = manager.normalizeProgress(legacyQualityInput).inventory.items[0].milestoneAffixes[0].quality;
  const mythicWeaponProgress = manager.normalizeProgress({
    inventory: { items: [{ id: "mythic-weapon", baseId: "vanguard_blade", rarity: "mythic", itemLevel: 10, enhance: 4 }], runes: [], bossMaterials: {} },
    equipment: { warrior: { weapon: "mythic-weapon", armor: "", amulet: "", core: "", runes: [] } },
  });
  const uniqueWeaponProgress = manager.normalizeProgress({
    inventory: { items: [{ id: "unique-weapon", baseId: "vanguard_blade", rarity: "unique", itemLevel: 10, enhance: 4 }], runes: [], bossMaterials: {} },
    equipment: { warrior: { weapon: "unique-weapon", armor: "", amulet: "", core: "", runes: [] } },
  });
  const rareWeaponProgress = manager.normalizeProgress({
    inventory: { items: [{ id: "rare-weapon", baseId: "vanguard_blade", rarity: "rare", itemLevel: 10, enhance: 4 }], runes: [], bossMaterials: {} },
    equipment: { warrior: { weapon: "rare-weapon", armor: "", amulet: "", core: "", runes: [] } },
  });
  const uniqueCritProgress = manager.normalizeProgress({
    inventory: {
      items: [{
        id: "unique-crit-amulet",
        baseId: "magnet_necklace",
        rarity: "unique",
        itemLevel: 10,
        enhance: 20,
        affixes: [{ id: "critical", value: 0.026 }],
        milestoneAffixes: [
          { id: "vitality", milestone: 5, quality: 100 },
          { id: "armor", milestone: 10, quality: 100 },
          { id: "regeneration", milestone: 15, quality: 100 },
          { id: "critical", milestone: 20, quality: 100 },
        ],
      }],
      runes: [], bossMaterials: {},
    },
    equipment: { warrior: { weapon: "", armor: "", amulet: "unique-crit-amulet", core: "", runes: [] } },
  });
  const weaponFour = milestoneFour.inventory.items[0];
  const bonusFour = manager.calculateEquipmentBonuses(milestoneFour, "warrior");
  const bonusFive = manager.calculateEquipmentBonuses(milestoneFive, "warrior");
  const uniqueMilestoneBonus = manager.calculateEquipmentBonuses(uniqueMilestoneFive, "warrior");
  const qualityFloorBonus = manager.calculateEquipmentBonuses(qualityFloorProgress, "warrior");
  const qualityCeilingBonus = manager.calculateEquipmentBonuses(qualityCeilingProgress, "warrior");
  const mythicWeaponBonus = manager.calculateEquipmentBonuses(mythicWeaponProgress, "warrior");
  const uniqueWeaponBonus = manager.calculateEquipmentBonuses(uniqueWeaponProgress, "warrior");
  const rareWeaponBonus = manager.calculateEquipmentBonuses(rareWeaponProgress, "warrior");
  const uniqueCritBonus = manager.calculateEquipmentBonuses(uniqueCritProgress, "warrior");
  const uniqueGearHtml = manager.renderProgressionPanel(manager.performProgressionAction(uniqueWeaponProgress, { action: "unequip-slot", classId: "warrior", slot: "weapon" }).progress, { activeTab: "gear", classId: "warrior", embedded: true });
  const armorPrimary = manager.normalizeProgress({ inventory: { items: [{ id: "armor-primary-contract", baseId: "vanguard_plate", rarity: "rare", itemLevel: 10, affixes: [{ id: "power", value: 1 }] }] } }).inventory.items[0]?.affixes?.[0];
  const randomizedMilestoneItem = manager.normalizeProgress({
    inventory: {
      items: [{
        id: "randomized-milestone-contract",
        baseId: "vanguard_blade",
        rarity: "common",
        itemLevel: 10,
        enhance: 20,
        milestoneAffixes: [5, 10, 15, 20].map((milestone) => ({ id: "power", value: 0.1, milestone })),
      }],
      runes: [], bossMaterials: {},
    },
  }).inventory.items[0];
  const randomizedMilestoneIds = randomizedMilestoneItem.milestoneAffixes.map((affix) => affix.id);
  if (
    weaponFour.affixes.length !== 1 || weaponFour.affixes[0].id !== "attack_flat" ||
    !["armor_flat", "health_flat"].includes(armorPrimary?.id) ||
    weaponFour.milestoneAffixes.length !== 0 || milestoneFive.inventory.items[0].milestoneAffixes.length !== 1 ||
    bonusFive.attackBonus <= bonusFour.attackBonus || uniqueMilestoneBonus.maxHpMul < 1.39 ||
    qualityFloorProgress.inventory.items[0].milestoneAffixes[0].quality !== 1 ||
    qualityCeilingProgress.inventory.items[0].milestoneAffixes[0].quality !== 100 ||
    qualityCeilingBonus.maxHpMul <= qualityFloorBonus.maxHpMul + 0.6 ||
    legacyQualityA !== legacyQualityB || legacyQualityA < 1 || legacyQualityA > 100 ||
    randomizedMilestoneIds[0] !== "power" || new Set(randomizedMilestoneIds).size !== 4 ||
    !clientProgressionSource.includes('{ id: "power", value: 0.1, weight: 0.65 }') ||
    !clientProgressionSource.includes("const MILESTONE_VALUE_SCALE = { 5: 0.55, 10: 0.7, 15: 0.85, 20: 1 }") ||
    !clientProgressionSource.includes("affix.value * rarityScale * (quality / 100)") ||
    bonusFour.eliteBossDamageMul !== 1 || rareWeaponBonus.eliteBossDamageMul !== 1 ||
    mythicWeaponBonus.attackBonus < bonusFour.attackBonus * 4.8 || mythicWeaponBonus.eliteBossDamageMul <= 1.3 ||
    uniqueWeaponBonus.attackBonus < bonusFour.attackBonus * 9.8 || uniqueWeaponBonus.eliteBossDamageMul <= 1.45 ||
    Math.abs(uniqueCritBonus.critChanceBonus - 0.205) > 0.0001 ||
    !uniqueGearHtml.includes('data-rarity="unique"') || !uniqueGearHtml.includes('<span class="meta-rarity">고유</span>') ||
    uniqueGearHtml.includes("주 능력 1000%") || uniqueGearHtml.includes("고유 옵션 500%")
  ) {
    throw new Error("slot primary stat, fixed enhancement, milestone, or rarity special contract failed");
  }
  const accessoryItem = forgeBase.inventory.items[0];
  if (accessoryItem.affixes.length !== 1 || accessoryItem.milestoneAffixes.length !== 2 || accessoryItem.lockedAffixIndices.length) {
    throw new Error("accessory primary affix migration failed");
  }
  const beforePrimary = JSON.stringify(accessoryItem.affixes);
  const beforeMilestones = JSON.stringify(accessoryItem.milestoneAffixes);
  const unlockedReforge = manager.performProgressionAction(forgeBase, {
    action: "reforge-item", classId: "warrior", itemId: "forge-contract-item",
  });
  const unlockedCost = forgeBase.currencies.reforgingDust - unlockedReforge.progress.currencies.reforgingDust;
  const repeatedReforgeBase = manager.normalizeProgress({
    ...forgeBase,
    inventory: {
      ...forgeBase.inventory,
      items: forgeBase.inventory.items.map((entry) => ({ ...entry, rerolls: 25, reforgePreview: null })),
    },
  });
  const repeatedReforge = manager.performProgressionAction(repeatedReforgeBase, {
    action: "reforge-item", classId: "warrior", itemId: "forge-contract-item",
  });
  const repeatedCost = repeatedReforgeBase.currencies.reforgingDust - repeatedReforge.progress.currencies.reforgingDust;
  const lockResult = manager.performProgressionAction(forgeBase, {
    action: "lock-affix", classId: "warrior", itemId: "forge-contract-item", affixIndex: 0,
  });
  const dustBefore = lockResult.progress.currencies.reforgingDust;
  const reforge = manager.performProgressionAction(lockResult.progress, {
    action: "reforge-item", classId: "warrior", itemId: "forge-contract-item",
  });
  const previewItem = reforge.progress.inventory.items[0];
  const lockedCost = dustBefore - reforge.progress.currencies.reforgingDust;
  if (
    !lockResult.changed ||
    !reforge.changed ||
    !previewItem.reforgePreview ||
    JSON.stringify(previewItem.affixes) !== beforePrimary ||
    JSON.stringify(previewItem.milestoneAffixes) !== beforeMilestones ||
    previewItem.reforgePreview.milestoneAffixes.length !== previewItem.milestoneAffixes.length ||
    JSON.stringify(previewItem.reforgePreview.milestoneAffixes[0]) !== JSON.stringify(previewItem.milestoneAffixes[0]) ||
    previewItem.reforgePreview.milestoneAffixes.some((affix) => affix.quality < 1 || affix.quality > 100) ||
    previewItem.reforgePreview.milestoneAffixes[1].id === previewItem.milestoneAffixes[1].id ||
    lockedCost <= unlockedCost ||
    repeatedCost !== unlockedCost
  ) {
    throw new Error(`milestone reforge preview failed: changed=${reforge.changed} preview=${Boolean(previewItem.reforgePreview)} primary=${beforePrimary}->${JSON.stringify(previewItem.affixes)} milestones=${beforeMilestones}->${JSON.stringify(previewItem.reforgePreview?.milestoneAffixes)} cost=${unlockedCost}/${lockedCost}/${repeatedCost}`);
  }
  const firstPreview = JSON.stringify(previewItem.reforgePreview.milestoneAffixes);
  const continueDustBefore = reforge.progress.currencies.reforgingDust;
  const continuedReforge = manager.performProgressionAction(reforge.progress, {
    action: "continue-reforge", classId: "warrior", itemId: "forge-contract-item",
  });
  const continuedItem = continuedReforge.progress.inventory.items[0];
  const continueCost = continueDustBefore - continuedReforge.progress.currencies.reforgingDust;
  if (
    !continuedReforge.changed ||
    !continuedItem.reforgePreview ||
    JSON.stringify(continuedItem.affixes) !== beforePrimary ||
    JSON.stringify(continuedItem.milestoneAffixes) !== beforeMilestones ||
    JSON.stringify(continuedItem.reforgePreview.milestoneAffixes) === firstPreview ||
    JSON.stringify(continuedItem.reforgePreview.milestoneAffixes[0]) !== JSON.stringify(continuedItem.milestoneAffixes[0]) ||
    continuedItem.reforgePreview.milestoneAffixes.some((affix) => affix.quality < 1 || affix.quality > 100) ||
    continueCost !== lockedCost
  ) {
    throw new Error("continuous milestone reforge failed");
  }
  const appliedReforge = manager.performProgressionAction(continuedReforge.progress, {
    action: "apply-reforge", classId: "warrior", itemId: "forge-contract-item",
  });
  if (!appliedReforge.changed || appliedReforge.progress.inventory.items[0].reforgePreview) {
    throw new Error("reforge apply failed");
  }
  const enhance = manager.performProgressionAction(appliedReforge.progress, {
    action: "enhance-item", classId: "warrior", itemId: "forge-contract-item",
  });
  const enhancedItem = enhance.progress.inventory.items[0];
  if (
    !enhance.changed ||
    enhance.progress.currencies.enhancementStones >= appliedReforge.progress.currencies.enhancementStones ||
    ![10, 11].includes(enhancedItem.enhance) ||
    !/강화 (성공|실패)/.test(enhance.message)
  ) {
    throw new Error("probabilistic enhancement failed");
  }
  const forgeHtml = manager.renderProgressionPanel(continuedReforge.progress, { activeTab: "forge", classId: "warrior", embedded: true });
  const unequippedForgeBase = manager.performProgressionAction(forgeBase, { action: "unequip-slot", classId: "warrior", slot: "amulet" }).progress;
  const gearHtml = manager.renderProgressionPanel(unequippedForgeBase, { activeTab: "gear", classId: "warrior", embedded: true });
  const inventoryFilterProgress = manager.normalizeProgress({
    inventory: {
      items: [
        { id: "search-hunter-item", baseId: "ranger_weapon_1", rarity: "rare", itemLevel: 8, affixes: [] },
        { id: "search-vanguard-item", baseId: "vanguard_plate", rarity: "rare", itemLevel: 8, affixes: [] },
      ],
      runes: [
        { id: "equipped-precision-rune", runeId: "precision", tier: 3 },
        { id: "free-ward-rune", runeId: "ward", tier: 2 },
      ],
      bossMaterials: {},
    },
    equipment: { warrior: { weapon: "", armor: "", amulet: "", core: "", runes: ["equipped-precision-rune", "", ""] } },
  });
  const setSearchHtml = manager.renderProgressionPanel(inventoryFilterProgress, {
    activeTab: "gear", classId: "warrior", embedded: true,
    inventoryUi: { itemQuery: "추적자 바람", itemClass: "all" },
  });
  const runeSearchHtml = manager.renderProgressionPanel(inventoryFilterProgress, {
    activeTab: "gear", classId: "warrior", embedded: true,
    inventoryUi: { runeQuery: "치명타 확률" },
  });
  const runeLoadoutHtml = manager.renderProgressionPanel(inventoryFilterProgress, { activeTab: "gear", classId: "warrior", embedded: true });
  const equippedGearHtml = manager.renderProgressionPanel(forgeBase, { activeTab: "gear", classId: "warrior", embedded: true });
  if (
    !forgeHtml.includes("보조 옵션 재련 결과") ||
    !forgeHtml.includes(`가루 ${lockedCost} 소모 완료`) ||
    forgeHtml.includes("미확정") ||
    !forgeHtml.includes('data-progression-action="apply-reforge"') ||
    !forgeHtml.includes('data-progression-action="continue-reforge"') ||
    !forgeHtml.includes("현재 옵션 유지") ||
    !forgeHtml.includes("계속 재련") ||
    !forgeHtml.includes("새 옵션 적용") ||
    !forgeHtml.includes("meta-forge-primary-values") ||
    !forgeHtml.includes('title="기본 수치"') ||
    !forgeHtml.includes('title="강화 증가"') ||
    forgeHtml.includes(">MAX<") ||
    !forgeHtml.includes("quality-fill") ||
    !forgeHtml.includes("--affix-roll:") ||
    !forgeHtml.includes("data-affix-roll=") ||
    forgeHtml.includes("meta-affix-roll") ||
    forgeHtml.includes("품질 ") ||
    /<span class="meta-affix-stat[^"]*"[^>]*><small>\+\d+ · /.test(forgeHtml) ||
    !forgeHtml.includes('data-progression-action="lock-affix"') ||
    /<button[^>]*data-progression-action="lock-affix"[^>]*>\s*<span/.test(forgeHtml) ||
    !gearHtml.includes("meta-affix-stat") ||
    !setSearchHtml.includes("바람 병기") ||
    setSearchHtml.includes("선봉대 판금") ||
    !runeSearchHtml.includes("정밀 룬") ||
    runeSearchHtml.includes("수호 룬") ||
    !runeLoadoutHtml.includes("슬롯 1") ||
    !runeLoadoutHtml.includes("현재 효과") ||
    !runeLoadoutHtml.includes('data-rune-id="free-ward-rune" data-rune-slot="1">장착</button>') ||
    runeLoadoutHtml.includes('data-rune-id="equipped-precision-rune" data-rune-slot="1"') ||
    !equippedGearHtml.includes('class="meta-equipped-card"') ||
    !equippedGearHtml.includes('data-equipped-item-id="forge-contract-item"') ||
    !equippedGearHtml.includes("거인 사냥") ||
    !equippedGearHtml.includes("meta-special-bonuses") ||
    !equippedGearHtml.includes("보스 피해") ||
    !equippedGearHtml.includes("2세트 · 치명타 +4%") ||
    !equippedGearHtml.includes('data-progression-action="unequip-slot"')
  ) {
    throw new Error(`forge UI missing: compare=${forgeHtml.includes("재련 결과 비교")} apply=${forgeHtml.includes('data-progression-action="apply-reforge"')} stats=${gearHtml.includes("meta-affix-stat")}`);
  }
  if (manager.getActiveChallenge(equipped.progress).mode !== "standard" || Object.prototype.hasOwnProperty.call(equipped.progress, "startPerks")) {
    throw new Error("client personal mission migration failed");
  }

  const sharedClear = manager.recordRunResult(manager.defaultProgress, {
    outcome: "victory",
    resultKey: "shared-ascension-clear",
    ascensionLevel: 5,
    stagesCleared: 1,
    highestLevel: 1,
    classId: "warrior",
  });
  const failedClear = manager.recordRunResult(manager.defaultProgress, {
    outcome: "defeat",
    resultKey: "failed-ascension-clear",
    ascensionLevel: 5,
    stagesCleared: 1,
    highestLevel: 1,
    classId: "warrior",
  });
  if (sharedClear.records.highestAscension !== 5 || failedClear.records.highestAscension !== 0) {
    throw new Error("client ascension clear record failed");
  }

  const exported = manager.exportUserProgress(result);
  const imported = manager.importUserProgress(exported);
  if (imported.statistics.totalScore !== 1234 || imported.statistics.totalRelics !== 6 || imported.version !== 4) {
    throw new Error("client save runtime import/export failed");
  }

  if (!manager.saveUserProgress(imported)) {
    throw new Error("client save runtime save failed");
  }
  const loaded = manager.loadUserProgress();
  if (loaded.statistics.runs !== 1 || loaded.bestClear.chapter !== 2) {
    throw new Error("client save runtime load failed");
  }

  storage.set(manager.PROGRESS_KEY, "{broken-json");
  const recovered = manager.loadUserProgress();
  if (recovered.statistics.runs !== 0 || recovered.bestClear.outcome !== "none" || recovered.currencies.abyssShards !== 0) {
    throw new Error("client save runtime broken json recovery failed");
  }

  storage.delete(manager.PROGRESS_KEY);
  storage.set(manager.LEGACY_PROGRESS_KEYS[0], JSON.stringify({
    version: 1,
    unlockedClasses: ["warrior"],
    statistics: { runs: 2, totalScore: 77 },
    bestClear: { outcome: "defeat", chapter: 1, stage: 2, cleared: false, completedAt: null }
  }));
  const migrated = manager.loadUserProgress();
  if (migrated.version !== 4 || migrated.statistics.runs !== 2 || migrated.statistics.totalScore !== 77 || !storage.has(manager.PROGRESS_KEY)) {
    throw new Error("client save runtime v1 migration failed");
  }

  console.log("save contract ok");
}

async function checkClientUiControllerRuntimeContract() {
  const indexSource = fs.readFileSync("public/index.html", "utf8");
  const uiSource = fs.readFileSync("public/ui-benchmark.css", "utf8");
  const stylesSource = fs.readFileSync("public/styles.css", "utf8");
  const clientSource = fs.readFileSync("public/client.js", "utf8");
  const progressionSource = fs.readFileSync("public/client-progression.js", "utf8");
  const serverSource = fs.readFileSync("server.js", "utf8");
  const skillEffectsSource = fs.readFileSync("public/pixi-skill-effects.js", "utf8");
  const coreEffectsSource = fs.readFileSync("public/pixi-effects.js", "utf8");
  if (
    !indexSource.includes("Material+Symbols+Rounded") ||
    !indexSource.includes('data-icon="settings"') ||
    !indexSource.includes('data-lobby-view="loadout" data-icon="shield"') ||
    !indexSource.includes('id="runAscension"') ||
    indexSource.includes('class="top-stat room-top-stat"') ||
    indexSource.includes('class="connection-state"') ||
    !uiSource.includes('font-family: "Material Symbols Rounded"') ||
    !uiSource.includes("button[data-progression-action=\"equip-item\"]::before") ||
    !uiSource.includes("button[data-lobby-relic-id][data-delta=\"1\"]::before") ||
    !uiSource.includes(".meta-codex-workspace") ||
    !uiSource.includes("button.meta-codex-entry.selected") ||
    !clientSource.includes('closest("[data-codex-entry]")') ||
    !clientSource.includes("renderCodexEntryDetail") ||
    !clientSource.includes("runAscension.textContent") ||
    !clientSource.includes("selectionEnd = Number.isFinite(options.selectionEnd)") ||
    !clientSource.includes("renderProgressionSearchResults(key)") ||
    !clientSource.includes("currentList.replaceChildren(...nextList.childNodes)") ||
    !progressionSource.includes('data-inventory-section="items"') ||
    !progressionSource.includes('data-inventory-section="runes"') ||
    !stylesSource.includes(".meta-filter-search") ||
    !stylesSource.includes("margin: 0 !important") ||
    !uiSource.includes("grid-template-columns: minmax(58px, 1fr) 36px 36px") ||
    !serverSource.includes("rangeRadius: projectile.splash") ||
    !skillEffectsSource.includes("effectRadius * (burst ? 1 : 0.42)")
  ) {
    throw new Error("Google Material Symbols UI contract failed");
  }

  const skillEffectSandbox = { window: { RogueEffectStyle: {} } };
  vm.runInNewContext(skillEffectsSource, skillEffectSandbox, { filename: "pixi-skill-effects.js" });
  const skillEffectDrawCalls = [];
  const skillEffectRenderer = new Proxy({}, {
    get: (_target, property) => (...args) => {
      skillEffectDrawCalls.push([property, ...args]);
      return true;
    },
  });
  const cometImpactRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderCrispMageEffect(skillEffectRenderer, {
    effect: { x: 320, y: 240, angle: 0.42, kind: "impact" },
    progress: 0.5,
    alpha: 1,
    s: "star_orb_pierce_impact",
    kind: "impact",
    peak: 1,
    pulse: 1,
    effectRadius: 96,
    end: { fromX: 260, fromY: 240, toX: 360, toY: 280 },
    z: 240,
    styleInfo: null,
    skinPalette: null,
  });
  if (!cometImpactRendered || !skillEffectDrawCalls.some(([name]) => name === "drawGfxImpactBurst")) {
    throw new Error("comet core impact renderer contract failed");
  }
  const wallImpactCallStart = skillEffectDrawCalls.length;
  const cometWallImpactRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderCrispMageEffect(skillEffectRenderer, {
    effect: { x: 320, y: 240, angle: 0.42, kind: "impact" },
    progress: 0.5,
    alpha: 1,
    s: "giant_star_orb_wall_impact",
    kind: "impact",
    peak: 1,
    pulse: 1,
    effectRadius: 210,
    end: { fromX: 260, fromY: 240, toX: 360, toY: 280 },
    z: 240,
    angle: 0.42,
    styleInfo: null,
    skinPalette: null,
  });
  const wallImpactDrawCalls = skillEffectDrawCalls.slice(wallImpactCallStart);
  if (!cometWallImpactRendered || !wallImpactDrawCalls.some(([name]) => name === "drawGfxArc")) {
    throw new Error("comet core wall impact renderer contract failed");
  }

  const missileCallStart = skillEffectDrawCalls.length;
  const missileExplosionRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderCrispEngineerEffect(skillEffectRenderer, {
    effect: { x: 320, y: 240, kind: "explosion", rangeRadius: 180 },
    progress: 0.5,
    alpha: 1,
    s: "engineer_missile_explosion",
    kind: "explosion",
    peak: 1,
    pulse: 1,
    effectRadius: 180,
    end: { fromX: 320, fromY: 240, toX: 320, toY: 240 },
    z: 240,
    styleInfo: { engineer: true },
    skinPalette: null,
  });
  const missileDrawCalls = skillEffectDrawCalls.slice(missileCallStart);
  if (!missileExplosionRendered || !missileDrawCalls.some(([name, , , radius]) => name === "drawGfxCircle" && radius === 180)) {
    throw new Error("missile explosion hit radius renderer contract failed");
  }

  const explosiveArrowCallStart = skillEffectDrawCalls.length;
  const explosiveArrowRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderCrispRangerEffect(skillEffectRenderer, {
    effect: { x: 320, y: 240, kind: "explosion", rangeRadius: 156 },
    progress: 0.5,
    alpha: 1,
    radius: 156,
    s: "ranger_explosive_arrow",
    kind: "explosion",
    angle: 0,
    peak: 1,
    pulse: 1,
    effectRadius: 156,
    end: { fromX: 320, fromY: 240, toX: 320, toY: 240 },
    z: 240,
    styleInfo: null,
    skinPalette: null,
  });
  const explosiveArrowDrawCalls = skillEffectDrawCalls.slice(explosiveArrowCallStart);
  if (!explosiveArrowRendered || !explosiveArrowDrawCalls.some(([name, , , radius]) => name === "drawGfxCircle" && radius === 156)) {
    throw new Error("explosive arrow hit radius renderer contract failed");
  }

  const adaptiveLaserContext = {
    effect: { x: 320, y: 240, kind: "shot", width: 80, hitRadius: 40 },
    progress: 0.5,
    alpha: 1,
    radius: 260,
    s: "engineer_mecha_hand_laser adaptive_continuous_laser",
    kind: "shot",
    angle: 0,
    peak: 1,
    pulse: 1,
    effectRadius: 260,
    end: { fromX: 120, fromY: 240, toX: 520, toY: 240 },
    z: 240,
    styleInfo: null,
    skinPalette: null,
  };
  const adaptiveLaserCallStart = skillEffectDrawCalls.length;
  const adaptiveLaserRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderCrispEngineerEffect(skillEffectRenderer, adaptiveLaserContext);
  const adaptiveLaserDrawCalls = skillEffectDrawCalls.slice(adaptiveLaserCallStart);
  const adaptiveLaserLineWidths = adaptiveLaserDrawCalls
    .filter(([name]) => name === "drawGfxLine")
    .map((call) => Number(call[5]));
  if (
    !adaptiveLaserRendered ||
    !adaptiveLaserLineWidths.includes(80) ||
    adaptiveLaserLineWidths.some((width) => width > 80) ||
    adaptiveLaserDrawCalls.some(([name]) => name === "drawGfxImpactBurst")
  ) {
    throw new Error("adaptive mecha laser hit width renderer contract failed");
  }
  const adaptivePolishCallStart = skillEffectDrawCalls.length;
  const adaptivePolishRendered = skillEffectSandbox.window.RoguePixiSkillEffects.renderSkillEffectPolishLayer(skillEffectRenderer, adaptiveLaserContext);
  if (adaptivePolishRendered || skillEffectDrawCalls.length !== adaptivePolishCallStart) {
    throw new Error("adaptive mecha laser generic polish isolation contract failed");
  }

  const coreEffectSandbox = { window: { RogueEffectStyle: {} } };
  vm.runInNewContext(coreEffectsSource, coreEffectSandbox, { filename: "pixi-effects.js" });
  const renderAdaptiveCoreLaserWidths = (hitRadius) => {
    const drawCalls = [];
    const renderer = new Proxy({}, {
      get: (_target, property) => (...args) => {
        drawCalls.push([property, ...args]);
        return true;
      },
    });
    const rendered = coreEffectSandbox.window.RoguePixiEffects.renderNeonEffect(renderer, {
      x: 320,
      y: 240,
      kind: "shot",
      fromX: 120,
      fromY: 240,
      toX: 520,
      toY: 240,
      radius: 260,
      hitRadius,
      width: hitRadius * 2,
      style: "engineer_mecha_hand_laser adaptive_continuous_laser",
    }, 0.5, 1, 140, "#38bdf8", "engineer_mecha_hand_laser adaptive_continuous_laser");
    return {
      rendered,
      widths: drawCalls.filter(([name]) => name === "drawGfxLine").map((call) => Number(call[5])),
      hasOversizedCap: drawCalls.some(([name]) => name === "drawGfxCircle"),
    };
  };
  const baseAdaptiveLaser = renderAdaptiveCoreLaserWidths(18);
  const doubledAdaptiveLaser = renderAdaptiveCoreLaserWidths(36);
  if (
    !baseAdaptiveLaser.rendered ||
    !doubledAdaptiveLaser.rendered ||
    !baseAdaptiveLaser.widths.includes(36) ||
    !doubledAdaptiveLaser.widths.includes(72) ||
    baseAdaptiveLaser.widths.some((width) => width > 36) ||
    doubledAdaptiveLaser.widths.some((width) => width > 72) ||
    baseAdaptiveLaser.hasOversizedCap ||
    doubledAdaptiveLaser.hasOversizedCap
  ) {
    throw new Error("adaptive mecha laser live renderer area scaling contract failed");
  }

  const choiceBridge = await loadWindowBridge("/client-choice.js", "RogueChoiceController");
  const choiceController = choiceBridge.create({
    getRelicStackLabel: () => "1/3",
    getSkillTypeLabel: () => "Q"
  });
  const relicHtml = choiceController.renderRelicChoices([
    {
      id: "relic-test",
      name: "<Blade>",
      text: "Power & speed",
      icon: "B",
      target: "Warrior"
    }
  ]);
  if (
    !relicHtml.includes('data-relic="relic-test"') ||
    relicHtml.includes("data-rarity") ||
    !relicHtml.includes("&lt;Blade&gt;") ||
    relicHtml.includes("<Blade>")
  ) {
    throw new Error("choice controller relic render contract failed");
  }

  const skillHtml = choiceController.renderSkillChoices([
    {
      id: "skill-test",
      name: "Wide Cut",
      text: "Bigger arc",
      icon: "Q"
    }
  ]);
  if (
    !skillHtml.includes('data-skill="skill-test"') ||
    !skillHtml.includes("choice-action-row") ||
    !skillHtml.includes("choice-forward-icon")
  ) {
    throw new Error("choice controller skill render contract failed");
  }

  const resultBridge = await loadWindowBridge("/client-result.js", "RogueResultController");
  const resultController = resultBridge.create({ formatRelicCount: () => "2/5" });
  const statsHtml = resultController.renderStats([["Score", 1000]]);
  const playersHtml = resultController.renderPlayers([
    {
      name: "<Hero>",
      classLabel: "Warrior",
      level: 3,
      score: 120,
      downed: true,
      relicCount: 2,
      combatStats: { damage: 12000, poisonDamage: 300, burnDamage: 700, kills: 24, bossKills: 1 }
    }
  ]);
  if (
    !statsHtml.includes("result-stat") ||
    !playersHtml.includes("result-player downed") ||
    !playersHtml.includes("result-player-metrics") ||
    !playersHtml.includes("상태 피해") ||
    !playersHtml.includes("&lt;Hero&gt;") ||
    playersHtml.includes("<Hero>")
  ) {
    throw new Error("result controller render contract failed");
  }

  const mapBridge = await loadWindowBridge("/client-map.js", "RogueMapController");
  const mapController = mapBridge.create();
  const mapContext = {
    visibleVote: "",
    serverVote: "",
    localVoteFresh: false,
    localMapVote: "",
    voteLocked: false,
    selfVote: "",
    getStageNodeMeta: (node) => ({ kind: node.kind || "combat", resolvedKind: node.resolvedKind || "" }),
    formatStageNodeLabel: (node) => node.label || node.kind || "NORMAL",
    getStageNodeDescription: (node) => node.text || "Stage description",
    getMapNodePosition: (node) => ({ x: node.depth * 24, y: 20 + node.lane * 24 }),
    mapEdgePath: (from, to) => `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
    isMapPathEdge: () => false,
    mapNodeGlyph: (node) => (node.kind || "?").slice(0, 1).toUpperCase()
  };
  const mapChoiceHtml = mapController.renderChoices([{ id: "node-a", kind: "elite", label: "Elite", votes: 1 }], mapContext);
  const mapBoardHtml = mapController.renderBoard(
    {
      nodes: [
        { id: "node-a", depth: 1, lane: 0, kind: "elite" },
        { id: "node-b", depth: 2, lane: 1, kind: "boss", boss: { name: "Boss", text: "Boss fight" } }
      ],
      edges: [["node-a", "node-b"]],
      availableNodeIds: ["node-a"],
      pathNodeIds: [],
      lanes: 2,
      depth: 2
    },
    mapContext
  );
  if (
    !mapChoiceHtml.includes('data-node="node-a"') ||
    !mapChoiceHtml.includes("choice-action-row") ||
    !mapChoiceHtml.includes("material-symbols-rounded") ||
    !mapBoardHtml.includes("map-route") ||
    !mapBoardHtml.includes("map-edge") ||
    !mapBoardHtml.includes('data-node="node-a"') ||
    !mapBoardHtml.includes("Boss")
  ) {
    throw new Error("map controller render contract failed");
  }

  console.log("ui contract ok");
}

function checkWebSocket() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => reject(new Error("WebSocket 상태 대기 시간 초과")), 4000);
    let sawLobby = false;
    let requestedLobbyAction = false;
    let confirmedLobbyAction = false;
    let changedClass = false;
    const lobbyClassCheckOrder = ["ranger", "warrior", "engineer", "mage"];
    let lobbyClassCheckIndex = 0;
    let startedRun = false;
    let sawPong = false;
    const mageGrowthLoadout = {
      version: 3,
      classId: "mage",
      accountLevel: 12,
      ascensionLevel: 2,
      points: 8,
      nodes: { damage: 2, maxHp: 2, regen: 2, moveSpeed: 2, cooldown: 2, critDamage: 2, area: 2 },
      gearBonuses: {
        damageMul: 1.12,
        maxHpMul: 1.1,
        skillHaste: 8,
        wallBounceBonus: 1,
        poisonStackCapBonus: 1,
        lowHpShieldRatio: 0.18,
        burnDamageMul: 1.2,
        dashFollowupMul: 1.35,
        dashDamageMul: 1.4,
        turretKillDurationBonus: 0.8
      },
      cosmetic: { title: "스모크 칭호", skin: "season_ember" },
      challenge: {
        mode: "daily",
        key: "SMOKE-DAILY",
        seed: 42,
        modifierId: "glass_cannon"
      }
    };

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
      socket.send(
        JSON.stringify({
          type: "join",
          name: "스모크",
          room: "SMOKE",
          classId: "warrior",
          intent: "create"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "pong") {
        sawPong = true;
        return;
      }
      if (message.type !== "state") {
        return;
      }
      if (!message.players.some((player) => player.name === "스모크")) {
        reject(new Error("입장한 플레이어가 상태에 없습니다"));
        socket.close();
        return;
      }
      const self = message.players.find((player) => player.name === "스모크");

      if (!sawLobby) {
        if (message.room.status !== "lobby") {
          reject(new Error(`입장 직후 대기실이어야 합니다. 현재 상태: ${message.room.status}`));
          socket.close();
          return;
        }
        if (message.room.canStart) {
          reject(new Error("준비 전에는 방장이 시작할 수 없어야 합니다"));
          socket.close();
          return;
        }
        if (!Array.isArray(self.skillSlots) || self.skillSlots.some((slot) => !slot.unlocked)) {
          reject(new Error("대기방 테스트 상태에서는 모든 스킬 슬롯이 열려 있어야 합니다"));
          socket.close();
          return;
        }
        if (!Array.isArray(message.enemies) || !message.enemies.some((enemy) => enemy.type === "training_dummy")) {
          return;
        }
        sawLobby = true;
        requestedLobbyAction = true;
        socket.send(
          JSON.stringify({
            type: "input",
            mx: 1,
            my: 0,
            aimX: Math.min(1780, self.x + 240),
            aimY: self.y,
            attacking: true,
            skillSeqs: { q: 1, e: 1, r: 1, f: 1 },
            dashSeq: 1
          })
        );
        return;
      }

      if (message.room.status === "lobby") {
        if (requestedLobbyAction && !confirmedLobbyAction) {
          if (self.lastAttackAt > 0 && self.lastSkillAt > 0 && self.lastDashAt > 0) {
            confirmedLobbyAction = true;
            socket.send(JSON.stringify({ type: "changeClass", classId: lobbyClassCheckOrder[lobbyClassCheckIndex] }));
          }
          return;
        }

        if (!changedClass) {
          const expectedClass = lobbyClassCheckOrder[lobbyClassCheckIndex];
          if (self.classId !== expectedClass) return;
          if (!Array.isArray(self.skillSlots) || self.skillSlots.some((slot) => !slot.unlocked)) {
            reject(new Error("직업 변경 후에도 대기방 스킬 슬롯이 모두 열려 있어야 합니다"));
            socket.close();
            return;
          }
          if (
            expectedClass === "mage" &&
            (!self.growth?.applied ||
              self.growth.accountLevel !== 12 ||
              self.growth.gearBonuses?.wallBounceBonus !== 1 ||
              Object.prototype.hasOwnProperty.call(self.growth.gearBonuses || {}, "dashFollowupMul") ||
              Object.prototype.hasOwnProperty.call(self.growth.gearBonuses || {}, "dashDamageMul") ||
              self.growth.challenge?.mode !== "standard" ||
              self.growth.challenge?.modifierId !== "" ||
              Object.prototype.hasOwnProperty.call(self.growth, "startPerkId"))
          ) {
            reject(new Error("permanent equipment growth was not applied in lobby"));
            socket.close();
            return;
          }
          lobbyClassCheckIndex += 1;
          if (lobbyClassCheckIndex < lobbyClassCheckOrder.length) {
            const nextClassId = lobbyClassCheckOrder[lobbyClassCheckIndex];
            socket.send(JSON.stringify({
              type: "changeClass",
              classId: nextClassId,
              growthLoadout: nextClassId === "mage" ? mageGrowthLoadout : undefined
            }));
            return;
          }
          changedClass = true;
          socket.send(JSON.stringify({ type: "toggleReady" }));
          return;
        }

        if (!startedRun && self.ready && message.room.canStart) {
          startedRun = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (message.room.status !== "combat") {
        reject(new Error(`런 시작 직후 생존 전투 상태여야 합니다. 현재 상태: ${message.room.status}`));
        socket.close();
        return;
      }
      if (
        !message.room.survival?.active ||
        message.room.survival.duration !== 540 ||
        typeof message.room.survival.elapsed !== "number" ||
        message.room.mapChoices?.length
      ) {
        reject(new Error("nine-minute survival state is missing after run start"));
        socket.close();
        return;
      }
      if (!message.room.stageModifier) {
        reject(new Error("웨이브 특성 또는 방 변형 정보가 없습니다"));
        socket.close();
        return;
      }
      if (!sawPong) {
        socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
        return;
      }
      if (message.room.maxChapters !== 3) {
        reject(new Error(`3챕터 구조여야 합니다. 현재: ${message.room.maxChapters}`));
        socket.close();
        return;
      }
      if (
        message.room.challengeMode !== "standard" ||
        message.room.challengeModifierId !== "" ||
        !Array.isArray(message.room.challengeLeaderboard) ||
        !self.growth?.applied ||
        self.growth.gearBonuses?.wallBounceBonus !== 1
      ) {
        reject(new Error("challenge or equipment growth state is missing after run start"));
        socket.close();
        return;
      }
      if (
        !message.room.chapterProfile ||
        message.room.chapterProfile.chapter !== message.room.floor ||
        typeof message.room.chapterProfile.combatFocus !== "string" ||
        typeof message.room.chapterProfile.bossTelegraphBias !== "number" ||
        !message.room.chapterProfile.visualTone ||
        typeof message.room.chapterProfile.visualTone.base !== "string" ||
        typeof message.room.chapterProfile.visualTone.rune !== "string"
      ) {
        reject(new Error("chapter profile state is missing"));
        socket.close();
        return;
      }
      if (typeof message.room.advancementPending !== "number") {
        reject(new Error("전직 선택 대기 상태 정보가 없습니다"));
        socket.close();
        return;
      }
      if (typeof message.room.advancementTimeLeft !== "number" || typeof message.room.choicePending !== "number") {
        reject(new Error("선택 제한시간 또는 유물 선택 대기 정보가 없습니다"));
        socket.close();
        return;
      }
      if (self.classId !== "mage" || self.level !== 1) {
        reject(new Error(`런 시작 후에는 선택 직업 Lv.1이어야 합니다. 현재: ${self.classId} Lv.${self.level}`));
        socket.close();
        return;
      }
      if (!self.stats || typeof self.stats.damage !== "number") {
        reject(new Error("상세 플레이어 스탯이 없습니다"));
        socket.close();
        return;
      }
      if (!Array.isArray(self.skillSlots) || self.skillSlots.length !== 4) {
        reject(new Error("스킬 슬롯 정보가 없습니다"));
        socket.close();
        return;
      }
      if (
        !Array.isArray(message.effects) ||
        !Array.isArray(message.hazards) ||
        !Array.isArray(message.relicChests) ||
        !Array.isArray(message.xpOrbs) ||
        !Array.isArray(message.fieldPickups)
      ) {
        reject(new Error("이펙트, 위험 장판, 유물 상자, 경험치 오브 배열이 없습니다"));
        socket.close();
        return;
      }
      clearTimeout(timer);
      console.log("ws ok");
      socket.close();
      resolve();
    });

    socket.addEventListener("error", () => reject(new Error("WebSocket 실패")));
  });
}

function checkRoomListVisibility() {
  return new Promise((resolve, reject) => {
    const room = `LIST${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("room list visibility check timed out")), 5000);
    let finished = false;
    let checked = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("room list ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "ListHost",
          room,
          classId: "warrior",
          intent: "create"
        })
      );
    });

    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished || checked) return;
      if (message.room.status !== "lobby" || message.room.code !== room) return;
      checked = true;

      try {
        const roomsResponse = await fetch(`${ORIGIN}/rooms`);
        const roomsPayload = await roomsResponse.json();
        const listed = roomsPayload.rooms.find((entry) => entry.code === room);
        if (!roomsResponse.ok || !listed) {
          finish(new Error("joined room was not visible in /rooms"));
          return;
        }
        if (
          listed.status !== "lobby" ||
          listed.playerCount !== 1 ||
          listed.maxPlayers !== 4 ||
          listed.hostName !== "ListHost"
        ) {
          finish(new Error("joined room has wrong /rooms public fields"));
          return;
        }
        finish();
      } catch (error) {
        finish(error);
      }
    });

    socket.addEventListener("error", () => finish(new Error("room list visibility WebSocket failed")));
  });
}

function checkCodeJoinRequiresExistingRoom() {
  return new Promise((resolve, reject) => {
    const room = `MISS${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("missing room join check timed out")), 4000);
    let finished = false;

    async function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }

      try {
        const roomsResponse = await fetch(`${ORIGIN}/rooms`);
        const roomsPayload = await roomsResponse.json();
        if (roomsPayload.rooms.some((entry) => entry.code === room)) {
          reject(new Error("missing room join created a public room"));
          return;
        }
        console.log("code join ok");
        resolve();
      } catch (fetchError) {
        reject(fetchError);
      }
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "MissingJoin",
          room,
          classId: "warrior",
          intent: "join"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "state" || message.type === "joined") {
        finish(new Error("missing room join unexpectedly succeeded"));
        return;
      }
      if (message.type === "error" && String(message.message || "").includes("존재하지")) {
        finish();
      }
    });

    socket.addEventListener("error", () => finish(new Error("missing room join WebSocket failed")));
  });
}

function checkAllPlayerSurvivalStart() {
  return new Promise((resolve, reject) => {
    const room = `SURV${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const sockets = [new WebSocket(`${WS_ORIGIN}/ws`), new WebSocket(`${WS_ORIGIN}/ws`)];
    const readySent = new Set();
    const combatSeen = new Set();
    const timer = setTimeout(() => finish(new Error("전원 생존 전투 즉시 진입 확인 실패")), 5000);
    let started = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      sockets.forEach((socket) => socket.close());
      if (error) {
        reject(error);
        return;
      }
      console.log("survival start ok");
      resolve();
    }

    sockets.forEach((socket, index) => {
      socket.addEventListener("open", () => {
        socket.send(
          JSON.stringify({
            type: "join",
            name: `생존${index + 1}`,
            room,
            classId: index === 0 ? "warrior" : "ranger",
            intent: index === 0 ? "create" : "join"
          })
        );
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type !== "state" || finished) return;

        if (message.room.status === "lobby" && message.room.playerCount === 2) {
          if (!readySent.has(index)) {
            readySent.add(index);
            socket.send(JSON.stringify({ type: "toggleReady" }));
            return;
          }

          if (!started && message.room.canStart) {
            started = true;
            socket.send(JSON.stringify({ type: "start" }));
          }
          return;
        }

        if (started && message.room.status === "combat") {
          if (!message.room.survival?.active || message.room.survival.duration !== 540 || message.room.mapChoices?.length) {
            finish(new Error("survival room state is invalid"));
            return;
          }
          const initialEnemies = (message.enemies || []).filter((enemy) => enemy.hp > 0 && enemy.type !== "training_dummy");
          if (initialEnemies.length < 7) {
            finish(new Error(`survival opening density is too low: ${initialEnemies.length}`));
            return;
          }
          combatSeen.add(index);
          if (combatSeen.size === 2) finish();
        }
      });

      socket.addEventListener("error", () => finish(new Error("전원 생존 시작 WebSocket 실패")));
    });
  });
}

function checkSoloPauseAndLobbyReturn() {
  return new Promise((resolve, reject) => {
    const room = `PAUSE${Date.now().toString(36).slice(-3)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("solo pause check timed out")), 7000);
    let readySent = false;
    let started = false;
    let pauseRequested = false;
    let pausedAt = 0;
    let pausedElapsed = 0;
    let lobbyRequested = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) return reject(error);
      console.log("solo pause and lobby return ok");
      resolve();
    }

    socket.addEventListener("open", () => socket.send(JSON.stringify({
      type: "join",
      name: "SoloPause",
      room,
      classId: "warrior",
      intent: "create",
    })));

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished) return;
      if (message.room.status === "lobby") {
        if (lobbyRequested) {
          if (message.room.paused || message.room.canPause) return finish(new Error("pause state leaked into lobby"));
          return finish();
        }
        if (!readySent) {
          readySent = true;
          socket.send(JSON.stringify({ type: "toggleReady" }));
        } else if (!started && message.room.canStart) {
          started = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (!started || message.room.status !== "combat") return;
      if (!message.room.canPause || !message.room.canReturnLobby) {
        return finish(new Error("solo combat capabilities are missing"));
      }
      if (!pauseRequested) {
        pauseRequested = true;
        socket.send(JSON.stringify({ type: "togglePause" }));
        return;
      }
      if (!message.room.paused) return;
      if (!pausedAt) {
        pausedAt = Date.now();
        pausedElapsed = Number(message.room.survival?.elapsed || 0);
        return;
      }
      if (Date.now() - pausedAt < 350) return;
      if (Math.abs(Number(message.room.survival?.elapsed || 0) - pausedElapsed) > 0.03) {
        return finish(new Error("survival timer advanced while paused"));
      }
      if (!lobbyRequested) {
        lobbyRequested = true;
        socket.send(JSON.stringify({ type: "returnLobby" }));
      }
    });

    socket.addEventListener("error", () => finish(new Error("solo pause WebSocket failed")));
  });
}

function checkBotPlayer() {
  return new Promise((resolve, reject) => {
    const room = `BOT${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("bot auto-play check timed out")), 7000);
    let addedBot = false;
    let readied = false;
    let started = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("bot ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "BotHost",
          room,
          classId: "warrior",
          intent: "create"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished) return;

      if (message.room.status === "lobby") {
        if (!addedBot) {
          addedBot = true;
          socket.send(JSON.stringify({ type: "addBot" }));
          return;
        }
        const bot = message.players.find((player) => player.bot);
        if (!bot) return;
        if (message.room.botCount !== 1 || !bot.ready) {
          finish(new Error("bot was not added as a ready lobby player"));
          return;
        }
        if (!readied) {
          readied = true;
          socket.send(JSON.stringify({ type: "toggleReady" }));
          return;
        }
        if (!started && message.room.canStart) {
          started = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (started && message.room.status === "combat") {
        if (message.room.botCount !== 1 || !message.players.some((player) => player.bot)) {
          finish(new Error("bot missing after run start"));
          return;
        }
        if (!message.room.survival?.active) {
          finish(new Error("bot run did not enter survival mode"));
          return;
        }
        finish();
      }
    });

    socket.addEventListener("error", () => finish(new Error("bot WebSocket failed")));
  });
}

function checkSpectatorBots() {
  return new Promise((resolve, reject) => {
    const room = `SPEC${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("spectator bot-only check timed out")), 9000);
    let toggledSpectator = false;
    let started = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("spectator ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "SpectatorHost",
          room,
          classId: "mage",
          intent: "create"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished) return;
      const self = message.players.find((player) => player.id === message.selfId);

      if (message.room.status === "lobby") {
        if (!toggledSpectator) {
          toggledSpectator = true;
          socket.send(JSON.stringify({ type: "toggleSpectator" }));
          return;
        }

        if (!self?.spectator) return;

        if ((message.room.botCount || 0) < 4) {
          socket.send(JSON.stringify({ type: "addBot" }));
          return;
        }

        const bots = message.players.filter((player) => player.bot);
        if (message.room.playerCount !== 4 || message.room.spectatorCount !== 1 || bots.length !== 4) {
          finish(new Error("spectator room counts are wrong"));
          return;
        }

        if (!started && message.room.canStart) {
          started = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (started && message.room.status === "combat") {
        const bots = message.players.filter((player) => player.bot && !player.spectator);
        if (!self?.spectator || bots.length !== 4 || message.room.playerCount !== 4) {
          finish(new Error("bot-only spectator run state is wrong"));
          return;
        }
        finish();
      }
    });

    socket.addEventListener("error", () => finish(new Error("spectator WebSocket failed")));
  });
}

async function checkAccountProgressionWebSocket() {
  const guestResponse = await fetch(`${ORIGIN}/api/account/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "WS Account", localProgress: { currencies: { abyssShards: 100 } } }),
  });
  const guest = await guestResponse.json();
  if (!guestResponse.ok) throw new Error("account WebSocket setup failed");
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const room = `A${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const timer = setTimeout(() => finish(new Error("account progression WebSocket timeout")), 5000);
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) reject(error);
      else {
        console.log("account progression ws ok");
        resolve();
      }
    };
    socket.addEventListener("open", () => socket.send(JSON.stringify({
      type: "join",
      name: "WS Account",
      room,
      classId: "warrior",
      intent: "create",
      accountId: guest.account.id,
      accountToken: guest.sessionToken,
    })));
    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "joined") {
        if (message.account?.id !== guest.account.id || !message.progress) {
          finish(new Error("account join payload contract failed"));
          return;
        }
        socket.send(JSON.stringify({
          type: "accountProgressAction",
          actionPayload: { action: "spend-mastery", classId: "warrior", nodeId: "damage" },
        }));
        return;
      }
      if (message.type !== "accountProgress" || message.reason !== "action-applied") return;
      if (
        message.progress?.mastery?.shared?.nodes?.damage !== 1 ||
        !message.progress?.challenges?.daily ||
        Object.prototype.hasOwnProperty.call(message.progress, "startPerks")
      ) {
        finish(new Error("server authoritative progression action failed"));
        return;
      }
      const sessionResponse = await fetch(`${ORIGIN}/api/account/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: guest.account.id, sessionToken: guest.sessionToken }),
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok || session.progress?.mastery?.shared?.nodes?.damage !== 1) {
        finish(new Error("account progression persistence failed"));
        return;
      }
      finish();
    });
    socket.addEventListener("error", () => finish(new Error("account progression WebSocket failed")));
  });
}

function checkHostAscensionSelection() {
  return new Promise((resolve, reject) => {
    const hostSocket = new WebSocket(`${WS_ORIGIN}/ws`);
    let memberSocket = null;
    const room = `ASC${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const timer = setTimeout(() => finish(new Error("host ascension selection timeout")), 5000);
    let finished = false;
    let memberStarted = false;
    let attemptedOverride = false;
    let postAttemptStates = 0;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      hostSocket.close();
      memberSocket?.close();
      if (error) reject(error);
      else {
        console.log("host ascension selection ok");
        resolve();
      }
    };
    hostSocket.addEventListener("open", () => hostSocket.send(JSON.stringify({
      type: "join",
      name: "승천방장",
      room,
      classId: "engineer",
      intent: "create",
      growthLoadout: {
        version: 3,
        classId: "engineer",
        ascensionLevel: 5,
        nodes: { damage: 0, maxHp: 0, regen: 0, moveSpeed: 0, cooldown: 0, critDamage: 0, area: 0 },
        gearBonuses: { dashFollowupMul: 1.35, dashDamageMul: 1.4, burnDamageMul: 1.2, turretKillDurationBonus: 0.8 },
        cosmetic: { title: "승천장", skin: "season_ember" },
        challenge: { mode: "weekly", key: "SMOKE-WEEK", seed: 73, modifierId: "elite_hunt", ruleId: "venom_week" }
      }
    })));
    hostSocket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state") return;
      const self = message.players.find((player) => player.id === message.selfId);
      if (message.room.status !== "lobby") return;
      if (
        message.room.ascensionLevel !== 5 ||
        message.room.challengeMode !== "standard" ||
        self?.growth?.challenge?.mode !== "standard" ||
        Object.prototype.hasOwnProperty.call(self?.growth?.gearBonuses || {}, "dashFollowupMul") ||
        Object.prototype.hasOwnProperty.call(self?.growth?.gearBonuses || {}, "dashDamageMul") ||
        Object.prototype.hasOwnProperty.call(self?.growth || {}, "startPerkId")
      ) {
        finish(new Error("host ascension or personal mission sanitization failed"));
        return;
      }
      if (!memberStarted) {
        memberStarted = true;
        memberSocket = new WebSocket(`${WS_ORIGIN}/ws`);
        memberSocket.addEventListener("open", () => memberSocket.send(JSON.stringify({
          type: "join",
          name: "승천대원",
          room,
          classId: "warrior",
          intent: "join",
          growthLoadout: { version: 3, classId: "warrior", ascensionLevel: 0, nodes: {} },
        })));
        memberSocket.addEventListener("message", (memberEvent) => {
          const memberMessage = JSON.parse(memberEvent.data);
          if (memberMessage.type !== "state" || memberMessage.room.status !== "lobby") return;
          const memberSelf = memberMessage.players.find((player) => player.id === memberMessage.selfId);
          if (!attemptedOverride && memberMessage.room.playerCount === 2) {
            attemptedOverride = true;
            memberSocket.send(JSON.stringify({
              type: "setGrowthLoadout",
              growthLoadout: { version: 3, classId: "warrior", ascensionLevel: 9, nodes: {} },
            }));
            return;
          }
          if (!attemptedOverride) return;
          postAttemptStates += 1;
          if (postAttemptStates < 2) return;
          if (memberMessage.room.ascensionLevel !== 5 || memberSelf?.growth?.ascensionLevel !== 0) {
            finish(new Error("non-host changed the room ascension"));
            return;
          }
          finish();
        });
        memberSocket.addEventListener("error", () => finish(new Error("member ascension WebSocket failed")));
        return;
      }
    });
    hostSocket.addEventListener("error", () => finish(new Error("host ascension WebSocket failed")));
  });
}

Promise.resolve()
  .then(checkServerCollisionContract)
  .then(checkBossPatternContract)
  .then(checkDefensePushbackContract)
  .then(checkBotSurvivalContract)
  .then(checkHostileProjectileContract)
  .then(checkWarriorUpgradeContract)
  .then(checkEngineerBalanceContract)
  .then(checkSkillHasteContract)
  .then(checkSoloBalanceContract)
  .then(checkBalanceCorrectionsContract)
  .then(checkUniqueEquipmentContract)
  .then(checkSurvivalModeContract)
  .then(checkExperienceCurveContract)
  .then(checkAscensionDifficultyContract)
  .then(checkLongTermProgressionContract)
  .then(checkServerAccountStoreContract)
  .then(checkHttp)
  .then(checkClientSaveRuntimeContract)
  .then(checkClientUiControllerRuntimeContract)
  .then(checkWebSocket)
  .then(checkAccountProgressionWebSocket)
  .then(checkHostAscensionSelection)
  .then(checkRoomListVisibility)
  .then(checkCodeJoinRequiresExistingRoom)
  .then(checkAllPlayerSurvivalStart)
  .then(checkSoloPauseAndLobbyReturn)
  .then(checkBotPlayer)
  .then(checkSpectatorBots)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
