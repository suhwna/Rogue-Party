const http = require("http");
const fs = require("fs");
const path = require("path");
const bossSystem = require("./server-boss-system");
const botSystem = require("./server-bot-system");
const collisionSystem = require("./server-collision-system");
const dataRegistry = require("./server-data-registry");
const enemySystem = require("./server-enemy-system");
const hazardSystem = require("./server-hazard-system");
const networkServer = require("./server-network-server");
const projectileSystem = require("./server-projectile-system");
const progressionService = require("./server-progression-service");
const roomManager = require("./server-room-manager");
const playerSystem = require("./server-player-system");
const rewardSystem = require("./server-reward-system");
const skillSystem = require("./server-skill-system");
const stateSerializer = require("./server-state-serializer");
const stageSystem = require("./server-stage-system");
const { createAccountStore } = require("./server-account-store");

const PORT = Number(process.env.PORT || 5173);
const PUBLIC_DIR = path.join(__dirname, "public");
const accountStore = createAccountStore({ progression: progressionService });
const TICK_RATE = 60;
const STATE_RATE = 30;
const MAX_PLAYERS = 4;
const DASH_COOLDOWN = 1.15;
const DASH_DISTANCE = 175;
const WARRIOR_TAUNT_GUARD_DURATION = 4;
const WARRIOR_TAUNT_DAMAGE_MUL = 0.72;
const WARRIOR_TAUNT_SIZE_SCALE = 1.3;
const WARRIOR_CLEAVE_EXECUTE_THRESHOLD = 0.25;
const WARRIOR_CHARGE_GATHER_RADIUS_MUL = 1.6;
const WARRIOR_REPEAT_CLEAVE_EFFECT_DELAY = 0.92;
const WARRIOR_REPEAT_CLEAVE_IMPACT_DELAY = 0.26;
const PROJECTILE_AEGIS_ORBIT_RADIUS = 62;
const PROJECTILE_AEGIS_ORBIT_Y_SCALE = 0.68;
const PROJECTILE_AEGIS_PLATE_RADIUS = 18;
const PROJECTILE_AEGIS_ROTATION_MS = 780;
const RELIC_DROP_CHANCE = 0.008;
const HEALTH_POTION_DROP_CHANCE = 0.012;
const XP_MAGNET_DROP_CHANCE = 0.006;
const EQUIPMENT_DROP_CHANCE = 0.004;
const FIELD_PICKUP_LIFETIME = 24;
const XP_ORB_SOFT_CAP = 120;
const XP_ORB_HARD_CAP = 180;
const XP_ORB_MERGE_RADIUS = 180;
const RELIC_CHOICE_TIMEOUT_MS = 10000;
const ADVANCEMENT_CHOICE_TIMEOUT_MS = 15000;
const MAP_VOTE_TIMEOUT_MS = 15000;
const MAP_DEPTH = 8;
const MAX_CHAPTERS = 3;
const MAP_EDGE_WALL_THICKNESS = 36;
const PLAYER_PROJECTILE_TRAVEL_PADDING = 96;
const MAP_LANES = 3;
const MAX_PLAYER_LEVEL = 15;
const MAX_WS_PAYLOAD_BYTES = 16 * 1024;
const MAX_ACCOUNT_HTTP_BODY_BYTES = 512 * 1024;
const MAX_INPUT_SEQUENCE = 1_000_000;
const SAFE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;
const MINIBOSS_MIN_DEPTH_BY_CHAPTER = { 1: 6, 2: 4, 3: 3 };
const XP_ASSIST_SHARE = 0.34;
const ADVANCEMENT_LEVELS = Array.from({ length: MAX_PLAYER_LEVEL - 1 }, (_, index) => index + 2);
const SKILL_SLOTS = ["q", "e", "r", "f"];
const STARTING_CLASSES = new Set(["warrior", "ranger", "mage", "engineer"]);
const GROWTH_NODE_IDS = ["damage", "maxHp", "regen", "moveSpeed", "attackSpeed", "cooldown", "critDamage", "area"];
const LEGACY_GROWTH_NODE_IDS = Object.freeze({
  damage: "attack",
  maxHp: "survival",
  regen: "survival",
  moveSpeed: "speed",
  attackSpeed: "",
  cooldown: "speed",
  critDamage: "attack",
  area: "special"
});
const MAX_GROWTH_NODE_LEVEL = 9999;
const MAX_ASCENSION_LEVEL = 5;
const ASCENSION_DIFFICULTY_PROFILES = Object.freeze([
  Object.freeze({ hpMul: 1, damageMul: 1, speedMul: 1, spawnMul: 1, cadenceMul: 1, eliteBonus: 0, rewardMul: 1 }),
  Object.freeze({ hpMul: 2, damageMul: 2, speedMul: 1.08, spawnMul: 1.12, cadenceMul: 0.88, eliteBonus: 0.12, rewardMul: 2 }),
  Object.freeze({ hpMul: 4, damageMul: 4, speedMul: 1.16, spawnMul: 1.24, cadenceMul: 0.76, eliteBonus: 0.24, rewardMul: 4 }),
  Object.freeze({ hpMul: 8, damageMul: 8, speedMul: 1.24, spawnMul: 1.38, cadenceMul: 0.64, eliteBonus: 0.4, rewardMul: 8 }),
  Object.freeze({ hpMul: 12, damageMul: 12, speedMul: 1.34, spawnMul: 1.52, cadenceMul: 0.5, eliteBonus: 0.6, rewardMul: 12 }),
  Object.freeze({ hpMul: 16, damageMul: 16, speedMul: 1.46, spawnMul: 1.68, cadenceMul: 0.36, eliteBonus: 0.84, rewardMul: 16 }),
]);
const ACCOUNT_PROGRESS_ACTIONS = new Set([
  "spend-mastery",
  "equip-item",
  "unequip-slot",
  "salvage-item",
  "salvage-items",
  "enhance-item",
  "reforge-item",
  "continue-reforge",
  "apply-reforge",
  "cancel-reforge",
  "lock-affix",
  "equip-rune",
  "unequip-rune",
  "merge-rune",
  "select-title",
  "select-skin",
]);
const SKIN_COLORS = Object.freeze({
  victory_trim: "#f4d06f",
  abyss_glow: "#b89cff",
  season_ember: "#fb923c",
  season_verdant: "#5ee3a1"
});
const ABYSS_DECISION_ESCAPE_ID = "abyss_escape";
const ABYSS_DECISION_ENTER_ID = "abyss_enter";
const BOT_CLASS_ROTATION = ["warrior", "ranger", "mage", "engineer"];
const BOT_NAMES = ["Aegis Bot", "Rain Bot", "Nova Bot", "Gear Bot", "Thread Bot", "Combo Bot", "Flask Bot", "Shade Bot"];
const PLAYER_POISON_TICK_INTERVAL = 1.15;
const ENEMY_POISON_DURATION = 4;
const ENEMY_POISON_MAX_STACKS = 3;
const ENEMY_POISON_TICK_DISPLAY_INTERVAL = 0.45;
const ENEMY_VENOM_DURATION = 4;
const ENEMY_POISON_MAX_HP_DPS = 0.02;
const ENEMY_POISON_ELITE_MAX_HP_DPS = 0.014;
const ENEMY_POISON_BOSS_MAX_HP_DPS = 0.003;
const BOSS_VENOM_POISON_RATIO = 0.5;
const ENEMY_BURN_DURATION = 2;
const ENEMY_BURN_TICK_DISPLAY_INTERVAL = 0.45;
const ENEMY_BURN_TOTAL_DAMAGE_RATIO = 0.8;
const MAGE_CHAIN_BASE_JUMPS = 5;
const MAGE_CHAIN_BASE_RANGE = 260;
const MAGE_CHAIN_BASE_CURSOR_ACQUIRE = 390;
const MAGE_CHAIN_BASE_SELF_ACQUIRE = 500;
const MAGE_CHAIN_GEAR_JUMPS = 9;
const MAGE_CHAIN_GEAR_RANGE = 380;
const MAGE_CHAIN_GEAR_CURSOR_ACQUIRE = 560;
const MAGE_CHAIN_GEAR_SELF_ACQUIRE = 680;
const RANGER_PIERCE_GROWTH_FULL_KILLS = 20;
const RANGER_PIERCE_GROWTH_HALF_KILLS = 50;
const RANGER_PIERCE_GROWTH_CAP = 100;
const RANGER_LASER_ARROW_BASE_WIDTH = 120;
const PLAYER_HIT_IFRAME_DURATION = 0.22;
const PLAYER_HAZARD_IFRAME_DURATION = 0.15;
const BASE_HEALTH_REGEN = 0.5;
const STAGE_CLEAR_HEAL_RATIO = 0.15;
const STAGE_CLEAR_REVIVE_RATIO = 0.35;
const SURVIVAL_DURATION_SEC = 9 * 60;
const SURVIVAL_BOSS_CHECKPOINTS = Object.freeze([3 * 60, 6 * 60, 9 * 60]);
const CHAPTER_BOSS_HEALTH_MUL = 6;
const MINIBOSS_HEALTH_MUL = 4;
const SURVIVAL_MINIBOSS_SCHEDULE = Object.freeze([
  { minute: 1, count: 1 },
  { minute: 2, count: 1 },
  { minute: 4, count: 1 },
  { minute: 5, count: 1 },
  { minute: 7, count: 1 },
  { minute: 8, count: 1 }
]);
const SURVIVAL_EXECUTION_SPAWN_DELAY_MS = 2800;
const SURVIVAL_EXECUTION_BOSS_HP_MUL = 20;
const SURVIVAL_BOSS_INTRO_DELAY_MS = 2400;
const SURVIVAL_BOSS_DISSOLVE_START_MS = 220;
const SURVIVAL_BOSS_DISSOLVE_END_LEAD_MS = 620;
const HOSTILE_PROJECTILE_TRAVEL_DISTANCE = Object.freeze({
  default: 820,
  spit: 760,
  sniper: 1080
});
const SHAMAN_TARGET_HEAL_LOCK_MS = 1400;
const CHEST_PITY_KILLS = 105;
const ELITE_BASE_CHANCE = 0.12;
const ELITE_NODE_BONUS = 0.24;
const ELITE_AFFIXES = ["frenzy", "bulwark", "venom", "volatile"];
const SPECIAL_PATTERN_CYCLE = 10;
const SPECIAL_PATTERN_STEPS = new Set([3, 7, 10]);
const PARTY_DIFFICULTY = {
  1: {
    label: "SOLO",
    spawnMul: 0.54,
    hpMul: 0.78,
    damageMul: 0.74,
    eliteMul: 0.24,
    eliteCap: 0.2,
    xpMul: 1.14,
    chestMul: 1,
    anchorBonus: -1,
    maxAnchors: 2
  },
  2: {
    label: "DUO",
    spawnMul: 0.96,
    hpMul: 1.02,
    damageMul: 0.94,
    eliteMul: 0.62,
    eliteCap: 0.38,
    xpMul: 1,
    chestMul: 0.78,
    anchorBonus: 0,
    maxAnchors: 5
  },
  3: {
    label: "TRIO",
    spawnMul: 1.24,
    hpMul: 1.14,
    damageMul: 1,
    eliteMul: 0.82,
    eliteCap: 0.48,
    xpMul: 0.94,
    chestMul: 0.72,
    anchorBonus: 0,
    maxAnchors: 5
  },
  4: {
    label: "FULL PARTY",
    spawnMul: 1.55,
    hpMul: 1.3,
    damageMul: 1.04,
    eliteMul: 0.94,
    eliteCap: 0.56,
    xpMul: 0.88,
    chestMul: 0.66,
    anchorBonus: 0,
    maxAnchors: 6
  }
};

const STAGE_DIFFICULTY = {
  1: {
    countMul: 0.54,
    hpMul: 0.78,
    damageMul: 0.66,
    speedMul: 0.9,
    cadenceMul: 1.18,
    eliteMul: 0,
    anchorBonus: -1,
    threatMul: 0.7,
    pressureMin: 0.68,
    riskMul: 0.62
  },
  2: {
    countMul: 0.68,
    hpMul: 0.86,
    damageMul: 0.76,
    speedMul: 0.94,
    cadenceMul: 1.11,
    eliteMul: 0.12,
    anchorBonus: -1,
    threatMul: 0.82,
    pressureMin: 0.78,
    riskMul: 0.68
  },
  3: {
    countMul: 0.84,
    hpMul: 0.94,
    damageMul: 0.85,
    speedMul: 0.98,
    cadenceMul: 1.05,
    eliteMul: 0.36,
    anchorBonus: 0,
    threatMul: 0.94,
    pressureMin: 0.88,
    riskMul: 0.76
  },
  4: {
    countMul: 0.96,
    hpMul: 1,
    damageMul: 0.93,
    speedMul: 1,
    cadenceMul: 1.03,
    eliteMul: 0.62,
    anchorBonus: 0,
    threatMul: 1,
    pressureMin: 0.92,
    riskMul: 0.84
  },
  5: {
    countMul: 1.04,
    hpMul: 1.07,
    damageMul: 0.99,
    speedMul: 1.01,
    cadenceMul: 1.01,
    eliteMul: 0.78,
    anchorBonus: 0,
    threatMul: 1.08,
    pressureMin: 0.96,
    riskMul: 0.92
  },
  6: {
    countMul: 1.09,
    hpMul: 1.13,
    damageMul: 1.04,
    speedMul: 1.02,
    cadenceMul: 0.99,
    eliteMul: 0.9,
    anchorBonus: 1,
    threatMul: 1.15,
    pressureMin: 1,
    riskMul: 1
  },
  7: {
    countMul: 1.12,
    hpMul: 1.2,
    damageMul: 1.09,
    speedMul: 1.03,
    cadenceMul: 0.98,
    eliteMul: 0.98,
    anchorBonus: 1,
    threatMul: 1.2,
    pressureMin: 1,
    riskMul: 1
  },
  8: {
    countMul: 0.94,
    hpMul: 1.28,
    damageMul: 1.13,
    speedMul: 1.02,
    cadenceMul: 1,
    eliteMul: 1.05,
    anchorBonus: 1,
    threatMul: 1.22,
    pressureMin: 1,
    riskMul: 1
  }
};

const CHAPTER_DIFFICULTY = {
  1: {
    spawnMul: 1,
    hpMul: 1,
    damageMul: 1,
    speedMul: 1,
    cadenceMul: 1,
    eliteMul: 1,
    initialSpawnRatio: 0.68,
    reinforcementBatches: 1,
    reinforcementDelay: 7.2,
    reinforcementGap: 7.2
  },
  2: {
    spawnMul: 1,
    hpMul: 1.18,
    damageMul: 1.12,
    speedMul: 1.035,
    cadenceMul: 0.98,
    eliteMul: 1.08,
    initialSpawnRatio: 0.52,
    reinforcementBatches: 2,
    reinforcementDelay: 7,
    reinforcementGap: 7.4
  },
  3: {
    spawnMul: 1.02,
    hpMul: 1.42,
    damageMul: 1.24,
    speedMul: 1.06,
    cadenceMul: 0.96,
    eliteMul: 1.18,
    initialSpawnRatio: 0.42,
    reinforcementBatches: 3,
    reinforcementDelay: 6.8,
    reinforcementGap: 7
  }
};

const CHAPTER_BOSSES = {
  1: {
    id: "iron_warden",
    name: "Iron Warden",
    text: "Armored charge boss. Dodge charge lanes, shockwaves, and blade beams.",
    chapterTitle: "Gate of Iron",
    role: "lane pressure bruiser",
    color: "#c9824c",
    hpMul: 2.35,
    damageMul: 1.14,
    speedMul: 1.08,
    radiusMul: 1.16,
    xpMul: 1.25,
    modifierId: "safe_path",
    pattern: "charge",
    patternTags: ["charge_lane", "shockwave", "blade_beam"],
    signaturePatterns: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break", "iron_sweeping_arc", "iron_fortress_gap", "iron_furnace_refuge", "iron_anvil_corridor", "iron_rotor_barrage"],
    phasePatterns: {
      1: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break"],
      2: ["iron_ground_break", "iron_anvil_corridor", "iron_sweeping_arc", "iron_furnace_refuge", "iron_cross_shock", "iron_beam_fan"],
      3: ["iron_rotor_barrage", "iron_furnace_refuge", "iron_fortress_gap", "iron_anvil_corridor", "iron_sweeping_arc", "iron_ground_break", "iron_cross_shock", "iron_beam_fan"]
    },
    phaseTitles: ["Armored Guard", "Broken Plating", "Overheated Core"],
    telegraph: { primary: 0.92, special: 1.08, phase: 1.48 },
    patternMix: { basic: 0.55, special: 0.34, punish: 0.11 },
    escorts: ["guardian", "charger"]
  },
  2: {
    id: "hive_prophet",
    name: "Hive Prophet",
    text: "Ritual boss. Break shields while dodging bloom blasts and poison rites.",
    chapterTitle: "Verdant Rite",
    role: "area denial summoner",
    color: "#6ba79e",
    hpMul: 3.55,
    damageMul: 1.22,
    speedMul: 0.98,
    radiusMul: 1.22,
    xpMul: 1.45,
    modifierId: "safe_path",
    pattern: "summon",
    patternTags: ["summon", "acid_pool", "barrier_rite"],
    signaturePatterns: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross", "hive_safe_bloom", "hive_venom_fan", "hive_spore_maelstrom", "hive_quarantine", "hive_creeping_orbit"],
    phasePatterns: {
      1: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"],
      2: ["hive_safe_bloom", "hive_quarantine", "hive_spore_maelstrom", "hive_acid_ring", "hive_venom_fan", "hive_bloom_adds"],
      3: ["hive_creeping_orbit", "hive_spore_maelstrom", "hive_quarantine", "hive_venom_fan", "hive_safe_bloom", "hive_ritual_cross", "hive_acid_ring", "hive_bloom_adds"]
    },
    phaseTitles: ["Quiet Chant", "Blooming Rite", "Hungering Hive"],
    telegraph: { primary: 0.95, special: 1.11, phase: 1.56 },
    patternMix: { basic: 0.52, special: 0.35, punish: 0.13 },
    escorts: ["shaman", "splitter", "spitter"]
  },
  3: {
    id: "void_regent",
    name: "Void Regent",
    text: "Final boss. Predictive blasts, void beams, and execution shots punish standing still.",
    chapterTitle: "Void Throne",
    role: "prediction and beam control",
    color: "#8d7cae",
    hpMul: 4.25,
    damageMul: 1.32,
    speedMul: 1.05,
    radiusMul: 1.32,
    xpMul: 1.7,
    modifierId: "safe_path",
    pattern: "void",
    patternTags: ["void_beam", "prediction_snipe", "blast_grid"],
    signaturePatterns: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring", "void_mirror_volley", "void_collapse", "void_final_eclipse", "void_gravity_clock", "void_starless_trial"],
    phasePatterns: {
      1: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"],
      2: ["void_mirror_volley", "void_gravity_clock", "void_cross_laser", "void_final_eclipse", "void_reposition_snipe", "void_collapse"],
      3: ["void_starless_trial", "void_final_eclipse", "void_gravity_clock", "void_collapse", "void_mirror_volley", "void_orb_ring", "void_cross_laser", "void_reposition_snipe"]
    },
    phaseTitles: ["Distant Crown", "Fractured Orbit", "Regent Unbound"],
    telegraph: { primary: 0.86, special: 1, phase: 1.6 },
    patternMix: { basic: 0.48, special: 0.38, punish: 0.14 },
    escorts: ["mortar", "sniper", "stalker"]
  }
};

const EXECUTION_BOSS_PROFILE = {
  id: "fate_executioner",
  name: "운명의 집행자",
  text: "도망칠 공간을 차례로 지우며 추적하는 최종 집행자입니다.",
  chapterTitle: "Fate Execution",
  role: "relentless pattern executioner",
  color: "#dc2626",
  pattern: "execution",
  patternTags: ["crimson_cage", "relentless_hunt", "crossfire", "final_sentence"],
  signaturePatterns: ["execution_crimson_cage", "execution_relentless_hunt", "execution_crossfire", "execution_final_sentence", "execution_annihilation"],
  phasePatterns: {
    1: ["execution_relentless_hunt", "execution_crossfire", "execution_crimson_cage"],
    2: ["execution_crimson_cage", "execution_relentless_hunt", "execution_annihilation", "execution_crossfire", "execution_final_sentence"],
    3: ["execution_annihilation", "execution_crossfire", "execution_final_sentence", "execution_relentless_hunt", "execution_crimson_cage"],
    4: ["execution_annihilation", "execution_final_sentence", "execution_relentless_hunt", "execution_crimson_cage", "execution_crossfire"]
  },
  phaseTitles: ["붉은 추적", "운명 봉쇄", "피할 수 없는 선고", "종말 집행"],
  telegraph: { primary: 0.72, special: 0.88, phase: 1.35 },
  patternMix: { basic: 0.28, special: 0.5, punish: 0.22 },
  escorts: []
};

const MINI_BOSSES = {
  1: {
    id: "blade_duelist",
    name: "검투 문지기",
    text: "짧은 돌진과 전방 검격으로 압박하는 준보스입니다.",
    color: "#d6b76d",
    pattern: "duelist",
    role: "melee duel miniboss",
    patternTags: ["cleave", "short_charge"],
    signaturePatterns: ["duelist_cross", "duelist_charge", "duelist_cleave", "duelist_blade_fan", "duelist_guard_break", "duelist_pinwheel", "duelist_pincer"],
    phasePatterns: {
      1: ["duelist_cleave", "duelist_charge", "duelist_cross"],
      2: ["duelist_pinwheel", "duelist_blade_fan", "duelist_pincer", "duelist_charge", "duelist_guard_break", "duelist_cleave", "duelist_cross"]
    },
    phaseTitles: ["검투 자세", "해방된 연격"],
    telegraph: { primary: 0.76, special: 1.05, phase: 1.14 },
    patternMix: { basic: 0.76, special: 0.2, punish: 0.04 },
    hpMul: 0.54,
    damageMul: 0.78,
    speedMul: 1.04
  },
  2: {
    id: "plague_acolyte",
    name: "역병 의식술사",
    text: "독 장판과 느린 탄막으로 공간을 잠그는 준보스입니다.",
    color: "#9aa15f",
    pattern: "plague",
    role: "poison space control miniboss",
    patternTags: ["poison_pool", "spit", "ritual_burst"],
    signaturePatterns: ["plague_pool", "plague_spit_ring", "plague_barrier_burst", "plague_safe_bloom", "plague_venom_fan", "plague_spore_clock", "plague_quarantine"],
    phasePatterns: {
      1: ["plague_pool", "plague_spit_ring", "plague_barrier_burst"],
      2: ["plague_spore_clock", "plague_safe_bloom", "plague_quarantine", "plague_venom_fan", "plague_pool", "plague_barrier_burst", "plague_spit_ring"]
    },
    phaseTitles: ["잠복 감염", "번지는 역병"],
    telegraph: { primary: 0.83, special: 1.1, phase: 1.18 },
    patternMix: { basic: 0.74, special: 0.22, punish: 0.04 },
    hpMul: 0.82,
    damageMul: 0.86,
    speedMul: 0.98
  },
  3: {
    id: "void_hunter",
    name: "공허 추적자",
    text: "순간 위치 전환과 표창, 짧은 저격으로 빈틈을 노리는 준보스입니다.",
    color: "#8d7cae",
    pattern: "hunter",
    role: "shadow pursuit miniboss",
    patternTags: ["shadow_stab", "shuriken", "blink"],
    signaturePatterns: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe", "hunter_crossfire", "hunter_marked_blast", "hunter_blink_ring", "hunter_ricochet"],
    phasePatterns: {
      1: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe"],
      2: ["hunter_blink_ring", "hunter_crossfire", "hunter_ricochet", "hunter_shadow_stab", "hunter_marked_blast", "hunter_shuriken_fan", "hunter_snipe"]
    },
    phaseTitles: ["그림자 추적", "공허의 사냥"],
    telegraph: { primary: 0.79, special: 1.08, phase: 1.2 },
    patternMix: { basic: 0.72, special: 0.24, punish: 0.04 },
    hpMul: 0.86,
    damageMul: 0.92,
    speedMul: 1.12
  }
};

const CHAPTER_STAGE_PROFILES = {
  1: {
    chapter: 1,
    name: "Torch Cave",
    theme: "dark cave paths, rock walls, and torch pockets",
    combatFocus: "learning enemy tells while fighting around simple cave cover",
    visualTone: {
      base: "#070503",
      side: "#19110a",
      torch: "#f97316",
      torchSoft: "#facc15",
      scarA: "#9a6b36",
      scarB: "#3f2f24",
      fog: "#050302",
      rune: "#c08438"
    },
    stagePressureMul: 1,
    specialEnemyBudget: 0.72,
    bossTelegraphBias: 1.12
  },
  2: {
    chapter: 2,
    name: "Green Warren",
    theme: "overgrown ruins, moss walls, and poison lanes",
    combatFocus: "mixed roles, area denial, and rescue pressure",
    visualTone: {
      base: "#09140f",
      side: "#0d1c13",
      torch: "#84cc16",
      torchSoft: "#bef264",
      scarA: "#84cc16",
      scarB: "#6ba79e",
      fog: "#16351f",
      rune: "#bef264"
    },
    stagePressureMul: 1.18,
    specialEnemyBudget: 0.94,
    bossTelegraphBias: 1.04
  },
  3: {
    chapter: 3,
    name: "Void Crown",
    theme: "fractured halls, obsidian walls, and void rifts",
    combatFocus: "boss pressure, movement checks, and coordinated burst windows",
    visualTone: {
      base: "#080913",
      side: "#0d1020",
      torch: "#8b5cf6",
      torchSoft: "#93c5fd",
      scarA: "#b985c8",
      scarB: "#7e9fb2",
      fog: "#171b3d",
      rune: "#93c5fd"
    },
    stagePressureMul: 1.38,
    specialEnemyBudget: 1.12,
    bossTelegraphBias: 1
  }
};

const risks = [
  {
    id: "safe_path",
    name: "보통 방",
    text: "추가 변형이 없는 표준 전투입니다.",
    xpMul: 1,
    spawnMul: 1,
    noClearHeal: false,
    earlyBoss: false
  },
  {
    id: "swarm_contract",
    name: "군세 방",
    text: "적 수 +30%.",
    xpMul: 1,
    spawnMul: 1.3,
    noClearHeal: false,
    earlyBoss: false
  },
  {
    id: "glass_run",
    name: "유리 방",
    text: "클리어 회복이 사라지는 대신 경험치가 1.2배입니다.",
    xpMul: 1.18,
    spawnMul: 1.08,
    noClearHeal: true,
    earlyBoss: false
  },
  {
    id: "early_boss",
    name: "문지기 방",
    text: "미니 문지기가 추가됩니다.",
    xpMul: 1.04,
    spawnMul: 1.08,
    noClearHeal: false,
    earlyBoss: true
  }
];

const ENEMY_SPAWN_WEIGHTS = [
  ["slime", 0.24],
  ["bat", 0.2],
  ["brute", 0.14],
  ["splitter", 0.1],
  ["bomber", 0.09],
  ["spitter", 0.07],
  ["guardian", 0.055],
  ["shaman", 0.045],
  ["sniper", 0.035],
  ["mortar", 0.03],
  ["charger", 0.025],
  ["stalker", 0.01]
];

const STAGE_NODE_META = {
  combat: {
    label: "NORMAL",
    glyph: "N",
    text: "Standard fight with mixed enemies."
  },
  elite: {
    label: "ELITE",
    glyph: "E",
    text: "Elite enemies appear. Higher risk, better reward chance."
  },
  miniboss: {
    label: "MINI BOSS",
    glyph: "M",
    text: "A smaller boss blocks this route."
  },
  defense: {
    label: "DEFENSE",
    glyph: "D",
    text: "Protect the target. Ranged enemies do not appear."
  },
  blockade: {
    label: "BLOCK",
    glyph: "K",
    text: "Stop runners from reaching the left gate."
  },
  random: {
    label: "RANDOM",
    glyph: "?",
    text: "Unknown room. Reveals when the stage starts."
  },
  reward: {
    label: "REWARD",
    glyph: "R",
    text: "Collect three relic chests. Rare route."
  },
  boss: {
    label: "BOSS",
    glyph: "B",
    text: "Chapter boss."
  },
  escape: {
    label: "ESCAPE",
    glyph: "O",
    text: "Run ends now and rewards are settled."
  },
  abyss: {
    label: "ABYSS",
    glyph: "A",
    text: "Enter the next endless abyss depth for stronger enemies and better rewards."
  }
};

const STAGE_REWARD_RULES = {
  combat: { xpMul: 1, clearXp: 14, chestBonus: 0, clearChest: 0, label: "Normal reward" },
  elite: { xpMul: 1.08, clearXp: 26, chestBonus: 0.01, clearChest: 1, label: "Elite reward" },
  miniboss: { xpMul: 1.12, clearXp: 38, chestBonus: 0.014, clearChest: 1, label: "Mini-boss reward" },
  defense: { xpMul: 1.05, clearXp: 24, chestBonus: 0.008, clearChest: 0, label: "Defense reward" },
  blockade: { xpMul: 1.06, clearXp: 24, chestBonus: 0.009, clearChest: 0, label: "Blockade reward" },
  random: { xpMul: 1.09, clearXp: 28, chestBonus: 0.009, clearChest: 0, label: "Random reward" },
  reward: { xpMul: 0.62, clearXp: 6, chestBonus: 0, clearChest: 0, label: "Treasure reward" },
  boss: { xpMul: 1.18, clearXp: 54, chestBonus: 0.016, clearChest: 0, label: "Boss reward" }
};

const BLOCKADE_RUNNER_TYPES = ["runner", "runner_tank", "runner_fast"];
const DEFENSE_ALLOWED_TYPES = ["slime", "bat", "brute", "bomber", "charger", "splitter", "guardian"];
const BASIC_ENEMY_TYPES = new Set(["slime", "bat", "brute"]);

let nextClientId = 1;
let nextEnemyId = 1;
let nextProjectileId = 1;
let nextHazardId = 1;
let nextEffectId = 1;
let nextChestId = 1;
let nextXpOrbId = 1;
let nextFieldPickupId = 1;
let nextBotId = 1;

const clients = new Map();
const rooms = new Map();
const challengeLeaderboards = new Map();

const classes = {
  novice: {
    label: "모험가",
    icon: "N",
    color: "#d6d0c4",
    maxHp: 135,
    speed: 200,
    damage: 17,
    range: 360,
    attackCd: 0.42,
    skillCd: 6.5,
    projectileSpeed: 520,
    armor: 0,
    crit: 0.03,
    regen: 0.25
  },
  warrior: {
    label: "전사",
    icon: "W",
    color: "#c9824c",
    maxHp: 186,
    speed: 170,
    damage: 28,
    range: 96,
    attackCd: 0.52,
    skillCd: 7.8,
    projectileSpeed: 0,
    armor: 4,
    crit: 0.02,
    regen: 0.22
  },
  ranger: {
    label: "궁수",
    icon: "R",
    color: "#7fa671",
    maxHp: 114,
    speed: 238,
    damage: 20,
    range: 540,
    attackCd: 0.3,
    skillCd: 7.35,
    projectileSpeed: 650,
    armor: 1,
    crit: 0.09,
    regen: 0.2
  },
  mage: {
    label: "마법사",
    icon: "M",
    color: "#8d7cae",
    maxHp: 122,
    speed: 202,
    damage: 41,
    range: 500,
    attackCd: 0.52,
    skillCd: 7.7,
    projectileSpeed: 560,
    armor: 0,
    crit: 0.04,
    regen: 0.2
  },
  engineer: {
    label: "기계공",
    icon: "E",
    color: "#d6b76d",
    maxHp: 132,
    speed: 205,
    damage: 22,
    range: 450,
    attackCd: 0.38,
    skillCd: 7.4,
    projectileSpeed: 620,
    armor: 2,
    crit: 0.04,
    regen: 0.22
  },
  puppeteer: {
    label: "인형사",
    icon: "P",
    color: "#b985c8",
    maxHp: 122,
    speed: 214,
    damage: 24,
    range: 480,
    attackCd: 0.42,
    skillCd: 8.4,
    projectileSpeed: 590,
    armor: 1.5,
    crit: 0.05,
    regen: 0.2
  },
  martialist: {
    label: "무투가",
    icon: "F",
    color: "#d08b5f",
    maxHp: 144,
    speed: 232,
    damage: 20,
    range: 118,
    attackCd: 0.34,
    skillCd: 6.9,
    projectileSpeed: 0,
    armor: 2.5,
    crit: 0.07,
    regen: 0.24
  },
  alchemist: {
    label: "연금술사",
    icon: "A",
    color: "#9aa15f",
    maxHp: 124,
    speed: 202,
    damage: 21,
    range: 470,
    attackCd: 0.48,
    skillCd: 7.2,
    projectileSpeed: 610,
    armor: 1,
    crit: 0.04,
    regen: 0.2
  },
  assassin: {
    label: "암살자",
    icon: "S",
    color: "#8a6f9e",
    maxHp: 110,
    speed: 252,
    damage: 22,
    range: 132,
    attackCd: 0.31,
    skillCd: 7.1,
    projectileSpeed: 720,
    armor: 0.5,
    crit: 0.13,
    regen: 0.18
  }
};

const dashProfiles = {
  novice: { cooldown: 1.05, distance: 178, style: "player_dash" },
  warrior: { cooldown: 1.35, distance: 146, style: "warrior_dash" },
  ranger: { cooldown: 1.15, distance: 154, style: "ranger_dash", charges: 2, chainCooldown: 0.16 },
  mage: { cooldown: 1.55, distance: 206, style: "mage_blink" },
  engineer: { cooldown: 1.28, distance: 166, style: "engineer_dash" },
  puppeteer: { cooldown: 1.22, distance: 168, style: "puppet_step" },
  martialist: { cooldown: 1.05, distance: 168, style: "martial_dash", charges: 2, chainCooldown: 0.18 },
  alchemist: { cooldown: 1.28, distance: 164, style: "alchemist_dash" },
  assassin: { cooldown: 0.95, distance: 190, style: "shadow_dash", charges: 2, chainCooldown: 0.14 }
};

const DISABLED_RELIC_IDS = new Set();
const DISABLED_SKILL_UPGRADES = new Set();
const ENGINEER_MECHA_MOVE_MUL = 0.78;
const ENGINEER_MECHA_ATTACK_DAMAGE_MUL = 1.08;
const ENGINEER_MECHA_ATTACK_COOLDOWN_MUL = 0.8;
const ENGINEER_MECHA_HAND_LASER_WIDTH = 5.5;
const ENGINEER_MECHA_LASER_MODULE_SHOTS = 3;
const ENGINEER_MECHA_GIANT_LASER_WIDTH = 88;
const ENGINEER_MECHA_GIANT_LASER_COLOR = "#c084fc";
const ENGINEER_ADAPTIVE_MECHA_DURATION_MUL = 0.92;
const ENGINEER_ADAPTIVE_LASER_KNOCKBACK = 2.5;
const ENGINEER_ADAPTIVE_LASER_MAX_PUSH = 4;
const ENGINEER_SWARM_AUXILIARY_DAMAGE_MUL = 0.4;

const skillUpgrades = {
  "warrior": [
    {
      "id": "warrior_guardian",
      "requires": [
        "warrior_primary"
      ],
      "minLevel": 2,
      "name": "전진하는 회오리",
      "text": "Q 강철 회오리 발동 후 조준 방향으로 전진하는 회오리를 발사합니다."
    },
    {
      "id": "warrior_sword_reach",
      "requires": [
        "warrior_primary"
      ],
      "minLevel": 3,
      "name": "긴 검날",
      "text": "Q 강철 회오리 범위가 50% 증가합니다. 범위 유물 증가분과 합산됩니다."
    },
    {
      "id": "warrior_taunt",
      "slot": "e",
      "minLevel": 2,
      "name": "도발",
      "text": "E: 주변 적을 도발하고 전사 쪽으로 주의를 끌어옵니다."
    },
    {
      "id": "warrior_taunt_pull",
      "requires": [
        "warrior_taunt"
      ],
      "minLevel": 3,
      "name": "끌어당기는 도전",
      "text": "도발한 적이 전사 쪽으로 강하게 끌려옵니다."
    },
    {
      "id": "warrior_taunt_break",
      "requires": [
        "warrior_taunt"
      ],
      "minLevel": 4,
      "name": "보호의 함성",
      "text": "도발을 외칠 때 최대 체력의 38%만큼 방어막을 부여합니다."
    },
    {
      "id": "warrior_charge",
      "slot": "r",
      "minLevel": 4,
      "name": "방패 돌진",
      "text": "R: 방패를 앞세워 돌진하며 경로의 적을 밀쳐냅니다."
    },
    {
      "id": "warrior_charge_gather",
      "requires": [
        "warrior_charge"
      ],
      "minLevel": 5,
      "name": "응집 돌진",
      "text": "방패 돌진이 적을 밀쳐내는 대신 끝 지점까지 끌고 가며, 끌어모으는 반경이 일반 돌진보다 60% 넓어집니다."
    },
    {
      "id": "warrior_charge_collision",
      "requires": [
        "warrior_charge"
      ],
      "minLevel": 6,
      "name": "연속 돌진",
      "text": "방패 돌진을 사용한 뒤 짧은 시간 안에 한 번 더 연속으로 사용할 수 있습니다."
    },
    {
      "id": "warrior_cleave",
      "slot": "f",
      "minLevel": 6,
      "name": "광역 베기",
      "text": "F: 전방을 크게 베어 다수의 적을 타격합니다."
    },
    {
      "id": "warrior_cleave_execution",
      "requires": [
        "warrior_cleave"
      ],
      "minLevel": 7,
      "name": "처형의 호",
      "text": "광역 베기 피해가 적용된 뒤 남은 체력이 최대 체력의 25% 이하인 일반 적을 즉시 처형합니다. 보스에게는 광역 베기 피해가 35% 증가합니다."
    },
    {
      "id": "warrior_cleave_wave",
      "requires": [
        "warrior_cleave"
      ],
      "minLevel": 8,
      "name": "연속 베기",
      "text": "광역 베기 후 전방으로 세로 베기를 한 번 더 발동합니다."
    }
  ],
  "ranger": [
    {
      "id": "ranger_multishot",
      "requires": [
        "ranger_primary"
      ],
      "minLevel": 2,
      "name": "유도 사격",
      "text": "Q 연발 사격의 화살이 적을 추적하며 휘어 들어갑니다."
    },
    {
      "id": "ranger_storm_quiver",
      "requires": [
        "ranger_primary"
      ],
      "minLevel": 3,
      "name": "폭발 화살",
      "text": "Q 연발 사격의 화살이 적중하면 범위 폭발을 일으키고, 직격 대상과 폭발에 맞은 적에게 화상을 부여합니다."
    },
    {
      "id": "ranger_pierce",
      "slot": "e",
      "minLevel": 2,
      "name": "관통 사격",
      "text": "E: 직선으로 관통하는 강한 화살을 발사합니다."
    },
    {
      "id": "ranger_pierce_momentum",
      "requires": [
        "ranger_pierce"
      ],
      "minLevel": 3,
      "name": "관통 성장",
      "text": "관통 사격으로 적을 처치하면 피해가 증가합니다. 20회까지 +2, 50회까지 +1, 이후 +0.5씩 증가하며 최대 +100입니다."
    },
    {
      "id": "ranger_pierce_blast",
      "requires": [
        "ranger_pierce"
      ],
      "minLevel": 4,
      "name": "레이저 화살",
      "text": "관통 사격이 화살 대신 맵 뒤쪽에서 끝까지 꿰뚫는 굵은 레이저를 발사하며, 거대 렌즈로 폭이 증가합니다."
    },
    {
      "id": "ranger_trap",
      "slot": "r",
      "minLevel": 4,
      "name": "레인 에로우",
      "text": "R: 넓은 조준 지점에 3.2초 동안 화살비를 내려 다수의 적을 지속 타격합니다. 화살비가 끝난 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "ranger_rain_slow",
      "requires": [
        "ranger_trap"
      ],
      "minLevel": 5,
      "name": "무거운 화살비",
      "text": "화살비에 맞은 적이 감속됩니다."
    },
    {
      "id": "ranger_rain_shred",
      "requires": [
        "ranger_trap"
      ],
      "minLevel": 6,
      "name": "장대비",
      "text": "화살비 유지 시간이 50% 증가합니다."
    },
    {
      "id": "ranger_poison",
      "slot": "f",
      "minLevel": 6,
      "name": "독화살",
      "text": "F: 독화살 한 발을 발사해 지속 피해를 남깁니다."
    },
    {
      "id": "ranger_poison_cloud",
      "requires": [
        "ranger_poison"
      ],
      "minLevel": 7,
      "name": "독구름",
      "text": "독화살이 명중한 지점에 넓고 오래 유지되는 독장판을 남깁니다."
    },
    {
      "id": "ranger_poison_burst",
      "requires": [
        "ranger_poison"
      ],
      "minLevel": 8,
      "name": "맹독",
      "text": "독화살 명중 시 독과 별개의 맹독을 부여합니다. 맹독은 독 3중첩과 같은 피해를 줍니다."
    }
  ],
  "mage": [
    {
      "id": "mage_star_surge",
      "requires": [
        "mage_primary"
      ],
      "minLevel": 2,
      "name": "유도 별빛",
      "text": "Q 별빛 폭발의 별탄이 궁수의 유도 사격처럼 적을 추적합니다."
    },
    {
      "id": "mage_storm_core",
      "requires": [
        "mage_primary"
      ],
      "minLevel": 3,
      "name": "분열 핵",
      "text": "Q 별빛 폭발이 처음 적중하면 작은 별빛 파편 3갈래로 흩어집니다. 파편 총 피해는 원본의 50%를 넘지 않으며, 분열 핵 유물의 투사체 증가 효과가 원본과 파편 모두에 적용됩니다."
    },
    {
      "id": "mage_frost",
      "slot": "e",
      "minLevel": 2,
      "name": "빙결 파동",
      "text": "E: 주변에 냉기 파동을 퍼뜨려 적에게 피해를 주고 느리게 합니다."
    },
    {
      "id": "mage_frost_shatter",
      "requires": [
        "mage_frost"
      ],
      "minLevel": 3,
      "name": "파쇄 반응",
      "text": "빙결 파동에 맞은 적을 기존 빙결보다 조금 더 길게 얼립니다."
    },
    {
      "id": "mage_frost_echo",
      "requires": [
        "mage_frost"
      ],
      "minLevel": 4,
      "name": "빙결의 숨결",
      "text": "패시브: 마법사 주위에 작은 냉기 오라가 생겨 가까운 적을 지속적으로 느리게 합니다."
    },
    {
      "id": "mage_meteor",
      "slot": "r",
      "minLevel": 4,
      "name": "운석",
      "text": "R: 하늘에서 운석을 떨어뜨려 폭발을 일으킵니다."
    },
    {
      "id": "mage_meteor_growth",
      "requires": [
        "mage_meteor"
      ],
      "minLevel": 5,
      "name": "포식하는 운석",
      "text": "운석으로 적을 처치할 때마다 이번 원정 동안 운석 크기가 0.1% 증가합니다. 최대 50%까지 증가합니다."
    },
    {
      "id": "mage_wildfire",
      "requires": [
        "mage_meteor"
      ],
      "minLevel": 6,
      "name": "불바다",
      "text": "운석이 떨어진 자리에 불바다가 남아 화상을 남깁니다."
    },
    {
      "id": "mage_chain",
      "slot": "f",
      "minLevel": 6,
      "name": "연쇄 번개",
      "text": "F: 적 사이를 튕기는 번개를 방출합니다."
    },
    {
      "id": "mage_chain_no_falloff",
      "requires": [
        "mage_chain"
      ],
      "minLevel": 7,
      "name": "순수 전류",
      "text": "연쇄 번개의 후속 타격이 약해지지 않습니다."
    },
    {
      "id": "mage_chain_paralyze",
      "requires": [
        "mage_chain"
      ],
      "minLevel": 8,
      "name": "강화 전류",
      "text": "연쇄 번개가 붉은 강화 전류로 변하고 치명타 확률이 100%가 됩니다."
    }
  ],
  "engineer": [
    {
      "id": "engineer_overclock",
      "requires": [
        "engineer_mecha"
      ],
      "minLevel": 2,
      "name": "레이저 모듈",
      "text": "메카 탑승 중 기본공격을 3회 사용하면 플레이어 중앙에서 강력한 거대 레이저를 발사합니다. 거대 렌즈로 폭이 증가합니다."
    },
    {
      "id": "engineer_singularity_core",
      "requires": [
        "engineer_mecha"
      ],
      "minLevel": 3,
      "name": "확장 동력",
      "text": "메카 탑승 중 이동속도 감소가 사라집니다."
    },
    {
      "id": "engineer_mecha",
      "slot": "e",
      "minLevel": 2,
      "name": "메카 탑승",
      "text": "E: 8.5초 동안 메카에 탑승해 방어력과 방어막을 얻고, 빠른 양손 레이저 기본공격을 사용합니다. 탑승이 끝난 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "engineer_rail_turret",
      "requires": [
        "engineer_primary"
      ],
      "minLevel": 3,
      "name": "레이저 터렛",
      "text": "터렛이 탄환 대신 적 하나를 계속 조준해 지속 피해를 주는 추적 레이저를 발사합니다."
    },
    {
      "id": "engineer_turret_missile",
      "requires": [
        "engineer_primary"
      ],
      "minLevel": 4,
      "name": "미사일 모듈",
      "text": "터렛이 일정 횟수 공격한 뒤 범위 미사일을 발사합니다."
    },
    {
      "id": "engineer_mine",
      "slot": "r",
      "minLevel": 4,
      "name": "감전 지뢰",
      "text": "R: 적이 밟으면 넓게 폭발해 큰 피해를 주고 둔화시키는 전기 지뢰를 설치합니다."
    },
    {
      "id": "engineer_mine_field",
      "requires": [
        "engineer_mine"
      ],
      "minLevel": 6,
      "name": "충전식 지뢰",
      "text": "감전 지뢰를 최대 3회까지 저장합니다. 지뢰 쿨타임이 끝날 때마다 충전이 1개씩 회복됩니다."
    },
    {
      "id": "engineer_auto_mine",
      "requires": [
        "engineer_mine"
      ],
      "minLevel": 7,
      "name": "자동 기뢰 살포",
      "text": "패시브: 일정 시간마다 캐릭터 주변 무작위 위치에 지뢰를 자동 설치합니다. 설치 주기는 스킬 가속의 영향을 받습니다."
    },
    {
      "id": "engineer_drone",
      "slot": "f",
      "minLevel": 6,
      "name": "호위 드론",
      "text": "F: 14초 동안 주변을 비행하며 적을 빠르게 지원 사격하는 드론을 호출합니다. 마지막 드론이 사라진 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "engineer_drone_missile",
      "requires": [
        "engineer_drone"
      ],
      "minLevel": 7,
      "name": "폭격 드론",
      "text": "드론이 일반 공격 대신 광역 폭발 미사일을 발사합니다."
    },
    {
      "id": "engineer_drone_kamikaze",
      "requires": [
        "engineer_drone"
      ],
      "minLevel": 8,
      "name": "자폭 귀환",
      "text": "드론 지속 시간이 끝나면 적에게 직접 날아가 충돌 폭발을 일으키고 화상을 남깁니다."
    }
  ],
  "puppeteer": [
    {
      "id": "puppeteer_dual_cast",
      "requires": [
        "puppeteer_primary"
      ],
      "minLevel": 2,
      "name": "쌍실 조종",
      "text": "Q 인형 조종이 더 많은 실표식을 남깁니다."
    },
    {
      "id": "puppeteer_grand_theater",
      "requires": [
        "puppeteer_primary"
      ],
      "minLevel": 3,
      "name": "대극장",
      "text": "Q 인형 조종 후 본체와 인형 사이에 큰 실 베기가 발생합니다."
    },
    {
      "id": "puppeteer_puppet",
      "slot": "e",
      "minLevel": 2,
      "name": "살아있는 인형",
      "text": "E: 인형을 소환하거나 인형을 이동시켜 실표식을 남깁니다."
    },
    {
      "id": "puppeteer_puppet_trail",
      "requires": [
        "puppeteer_puppet"
      ],
      "minLevel": 3,
      "name": "실 흔적",
      "text": "인형이 이동한 경로에 실 흔적을 남겨 닿은 적에게 실표식을 쌓습니다."
    },
    {
      "id": "puppeteer_puppet_threadcut",
      "requires": [
        "puppeteer_puppet"
      ],
      "minLevel": 4,
      "name": "절단 실",
      "text": "본체와 인형 사이의 실에 닿은 적을 절단합니다."
    },
    {
      "id": "puppeteer_bind",
      "slot": "r",
      "minLevel": 4,
      "name": "실 결계",
      "text": "R: 실 결계를 펼쳐 적에게 실표식을 쌓습니다."
    },
    {
      "id": "puppeteer_cross_bind",
      "requires": [
        "puppeteer_bind"
      ],
      "minLevel": 5,
      "name": "십자 결계",
      "text": "결계 중심에 십자 실이 펼쳐져 실표식을 빠르게 쌓습니다."
    },
    {
      "id": "puppeteer_bind_execute",
      "requires": [
        "puppeteer_bind"
      ],
      "minLevel": 6,
      "name": "결박 절단",
      "text": "실표식이 가득 찬 적은 잠깐 묶인 뒤 절단됩니다."
    },
    {
      "id": "puppeteer_swap",
      "slot": "f",
      "minLevel": 6,
      "name": "피날레 교대",
      "text": "F: 본체와 인형의 위치를 교대합니다."
    },
    {
      "id": "puppeteer_swap_cut",
      "requires": [
        "puppeteer_swap"
      ],
      "minLevel": 7,
      "name": "교대 베기",
      "text": "교대 경로에 실 베기가 발생합니다."
    },
    {
      "id": "puppeteer_finale",
      "requires": [
        "puppeteer_swap"
      ],
      "minLevel": 8,
      "name": "피날레 절단",
      "text": "교대 후 인형이 주변 실표식 적을 한 번 더 찢어냅니다."
    }
  ],
  "martialist": [
    {
      "id": "martial_combo_flow",
      "requires": [
        "martialist_primary"
      ],
      "minLevel": 2,
      "name": "연환 흐름",
      "text": "Q 연환권이 적중하면 기력이 더 빠르게 차오르고 다음 기술로 이어집니다."
    },
    {
      "id": "martial_infinite_combo",
      "requires": [
        "martialist_primary"
      ],
      "minLevel": 3,
      "name": "무한 연격",
      "text": "Q 연환권이 풀기력에서 더 강한 연속 타격으로 바뀝니다."
    },
    {
      "id": "martial_palm",
      "slot": "e",
      "minLevel": 2,
      "name": "파쇄장",
      "text": "E: 기를 담은 장풍으로 전방을 타격합니다."
    },
    {
      "id": "martial_palm_echo",
      "requires": [
        "martial_palm"
      ],
      "minLevel": 3,
      "name": "이중 충격",
      "text": "풀기력 파쇄장 사용 시 두 번째 충격파가 한 박자 늦게 터집니다."
    },
    {
      "id": "martial_pressure_mark",
      "requires": [
        "martial_palm"
      ],
      "minLevel": 4,
      "name": "기압 표식",
      "text": "파쇄장에 맞은 적에게 기압 표식이 남고 다음 근접 타격 시 터집니다."
    },
    {
      "id": "martial_rising",
      "slot": "r",
      "minLevel": 4,
      "name": "승룡각",
      "text": "R: 앞으로 파고들어 적을 띄우듯 밀어냅니다."
    },
    {
      "id": "martial_rising_shockwave",
      "requires": [
        "martial_rising"
      ],
      "minLevel": 5,
      "name": "착지 충격",
      "text": "밀려난 적의 착지 지점에 충격파가 남습니다."
    },
    {
      "id": "martial_dragon_afterimage",
      "requires": [
        "martial_rising"
      ],
      "minLevel": 6,
      "name": "용의 잔상",
      "text": "명중한 적 뒤로 용의 잔상이 지나가며 후속 타격을 남깁니다."
    },
    {
      "id": "martial_focus",
      "slot": "f",
      "minLevel": 6,
      "name": "기합 폭발",
      "text": "F: 기합을 터뜨려 주변을 밀쳐냅니다."
    },
    {
      "id": "martial_focus_push",
      "requires": [
        "martial_focus"
      ],
      "minLevel": 7,
      "name": "외공 파동",
      "text": "기합 폭발에 맞은 적을 바깥으로 강하게 밀쳐냅니다."
    },
    {
      "id": "martial_counter_wave",
      "requires": [
        "martial_focus"
      ],
      "minLevel": 8,
      "name": "반격 파동",
      "text": "기합 폭발 후 짧은 시간 동안 피격 시 반격 파동이 발생합니다."
    }
  ],
  "alchemist": [
    {
      "id": "alchemist_bigger_bottle",
      "requires": [
        "alchemist_primary"
      ],
      "minLevel": 2,
      "name": "대형 촉매병",
      "text": "Q 촉매 폭탄의 반응 반경이 커집니다."
    },
    {
      "id": "alchemist_chain_reaction",
      "requires": [
        "alchemist_primary"
      ],
      "minLevel": 3,
      "name": "연쇄 반응",
      "text": "Q 촉매 폭탄이 터진 뒤 추가 반응 폭발을 남깁니다."
    },
    {
      "id": "alchemist_acid",
      "slot": "e",
      "minLevel": 2,
      "name": "산성 플라스크",
      "text": "E: 산성 장판을 남기는 플라스크를 던집니다."
    },
    {
      "id": "alchemist_acid_slow",
      "requires": [
        "alchemist_acid"
      ],
      "minLevel": 3,
      "name": "끈적한 산성",
      "text": "산성 장판 위의 적에게 중독과 감속을 남깁니다."
    },
    {
      "id": "alchemist_acid_distill",
      "requires": [
        "alchemist_acid"
      ],
      "minLevel": 4,
      "name": "증류 반응",
      "text": "산성 장판이 화염 장판과 만나면 증류 폭발이 발생합니다."
    },
    {
      "id": "alchemist_fire",
      "slot": "r",
      "minLevel": 4,
      "name": "화염 플라스크",
      "text": "R: 화염 장판을 남기는 플라스크를 던집니다."
    },
    {
      "id": "alchemist_fire_burn",
      "requires": [
        "alchemist_fire"
      ],
      "minLevel": 5,
      "name": "맹렬한 화염",
      "text": "화염 장판이 적에게 화상을 남깁니다."
    },
    {
      "id": "alchemist_fire_vapor",
      "requires": [
        "alchemist_fire"
      ],
      "minLevel": 6,
      "name": "독성 증기",
      "text": "화염 플라스크를 산성 장판 위에 던지면 독성 증기가 퍼집니다."
    },
    {
      "id": "alchemist_elixir",
      "slot": "f",
      "minLevel": 6,
      "name": "전투 영약",
      "text": "F: 영약을 던져 아군을 돕는 반응 구역을 만듭니다."
    },
    {
      "id": "alchemist_elixir_mist",
      "requires": [
        "alchemist_elixir"
      ],
      "minLevel": 7,
      "name": "치유 안개",
      "text": "영약이 터진 자리에 치유 안개가 남습니다."
    },
    {
      "id": "alchemist_elixir_catalyst",
      "requires": [
        "alchemist_elixir"
      ],
      "minLevel": 8,
      "name": "촉매 영약",
      "text": "영약 안의 아군 첫 공격이 촉매 반응 폭발을 일으킵니다."
    }
  ],
  "assassin": [
    {
      "id": "assassin_fan",
      "requires": [
        "assassin_primary"
      ],
      "minLevel": 2,
      "name": "부채 칼날",
      "text": "Q 칼날 난무가 더 넓은 부채꼴 베기로 바뀝니다."
    },
    {
      "id": "assassin_death_blossom",
      "requires": [
        "assassin_primary"
      ],
      "minLevel": 3,
      "name": "죽음의 꽃",
      "text": "Q 칼날 난무 후 그림자 칼날이 한 번 더 피어납니다."
    },
    {
      "id": "assassin_mark",
      "slot": "e",
      "minLevel": 2,
      "name": "사신 표식",
      "text": "E: 적에게 사신 표식을 새깁니다. 표식은 다음 타격 피해를 1회 1.5배로 증폭한 뒤 사라집니다."
    },
    {
      "id": "assassin_mark_spread",
      "requires": [
        "assassin_mark"
      ],
      "minLevel": 3,
      "name": "번지는 표식",
      "text": "표식 대상이 사망하면 주변 적에게 표식이 전염됩니다."
    },
    {
      "id": "assassin_mark_blades",
      "requires": [
        "assassin_mark"
      ],
      "minLevel": 4,
      "name": "그림자 칼날",
      "text": "표식 대상 주변에 그림자 칼날이 잠시 맴돌다 베어냅니다."
    },
    {
      "id": "assassin_lunge",
      "slot": "r",
      "minLevel": 4,
      "name": "그림자 찌르기",
      "text": "R: 그림자처럼 파고들어 적을 찌릅니다."
    },
    {
      "id": "assassin_lunge_afterimage",
      "requires": [
        "assassin_lunge"
      ],
      "minLevel": 5,
      "name": "후방 관통",
      "text": "표식 대상에게 명중하면 적 뒤로 빠져나가며 그림자 잔상을 남깁니다."
    },
    {
      "id": "assassin_lunge_shards",
      "requires": [
        "assassin_lunge"
      ],
      "minLevel": 6,
      "name": "그림자 파편",
      "text": "처형에 성공하면 주변 표식 대상에게 그림자 파편이 튑니다."
    },
    {
      "id": "assassin_smoke",
      "slot": "f",
      "minLevel": 6,
      "name": "연막 분신",
      "text": "F: 연막을 펼치고 분신을 남깁니다."
    },
    {
      "id": "assassin_smoke_clone",
      "requires": [
        "assassin_smoke"
      ],
      "minLevel": 7,
      "name": "살의 분신",
      "text": "분신이 표식 대상에게 자동으로 추가 베기를 날립니다."
    },
    {
      "id": "assassin_smoke_confuse",
      "requires": [
        "assassin_smoke"
      ],
      "minLevel": 8,
      "name": "혼란 연막",
      "text": "연막 안의 적은 잠깐 방향을 잃고 멈칫합니다."
    }
  ]
};

const relics = [
  {
    id: "power_core",
    name: "힘의 핵",
    text: "모든 피해 증폭이 10% 증가합니다.",
    target: "공용 · 공격",
    maxLevel: 5,
    icon: "힘",
    apply(player) {
      player.damageMul += 0.1;
    }
  },
  {
    id: "iron_plate",
    name: "강철 갑판",
    text: "방어력이 1 증가합니다.",
    target: "공용 · 방어",
    maxLevel: 5,
    icon: "방",
    apply(player) {
      player.armor = Math.min(18, player.armor + 1);
    }
  },
  {
    id: "swift_boots",
    name: "신속의 장화",
    text: "이동 속도가 10% 증가합니다.",
    target: "공용 · 이동",
    maxLevel: 5,
    icon: "속",
    apply(player) {
      player.speedMul *= 1.1;
    }
  },
  {
    id: "cooling_gear",
    name: "냉각 장치",
    text: "스킬 가속이 10 증가합니다.",
    target: "공용 · 스킬 가속",
    maxLevel: 5,
    icon: "쿨",
    apply(player) {
      player.skillHaste = Math.min(500, (player.skillHaste || 0) + 10);
    }
  },
  {
    id: "rapid_loader",
    name: "속사 장치",
    text: "공격 속도가 10 증가합니다.",
    target: "공용 · 공격 속도",
    maxLevel: 5,
    icon: "속",
    apply(player) {
      player.attackSpeed = Math.min(500, (player.attackSpeed || 0) + 10);
    }
  },
  {
    id: "splitter_core",
    name: "분열 핵",
    text: "투사체 계열 발사 수가 1 증가합니다. 최대 1중첩.",
    target: "공용 · 투사체",
    maxLevel: 1,
    icon: "분",
    classes: ["ranger", "mage", "engineer", "puppeteer", "alchemist"],
    apply(player) {
      player.projectileCountBonus = Math.min(1, (player.projectileCountBonus || 0) + 1);
    }
  },
  {
    id: "giant_lens",
    name: "거대 렌즈",
    text: "범위와 폭발 반경이 10% 증가합니다.",
    target: "공용 · 크기",
    maxLevel: 5,
    icon: "대",
    apply(player) {
      player.areaMul *= 1.1;
    }
  },
  {
    id: "sharp_eye",
    name: "예리한 눈",
    text: "치명타 확률이 5% 증가합니다.",
    target: "공용 · 치명타",
    maxLevel: 5,
    icon: "확",
    apply(player) {
      player.crit = Math.min(0.85, player.crit + 0.05);
    }
  },
  {
    id: "fatal_mark",
    name: "치명 표식",
    text: "치명타 피해 배율에 10%p를 더합니다.",
    target: "공용 · 치명 피해",
    maxLevel: 5,
    icon: "치",
    apply(player) {
      player.critDamageMul += 0.1;
    }
  },
  {
    id: "living_moss",
    name: "살아있는 이끼",
    text: "체력 재생량이 초당 0.5 증가합니다.",
    target: "공용 · 재생",
    maxLevel: 5,
    icon: "재",
    apply(player) {
      player.regen += 0.5;
    }
  },
  {
    id: "heartstone",
    name: "심장석",
    text: "최대 체력이 25 증가합니다.",
    target: "공용 · 체력",
    maxLevel: 5,
    icon: "체",
    apply(player) {
      player.maxHp += 25;
      player.hp += 25;
    }
  }
];

const supplyRewards = [
  {
    id: "supply_heal",
    name: "응급 보급",
    text: "즉시 체력을 35% 회복합니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    consumable: true,
    apply(player) {
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.35);
    }
  },
  {
    id: "supply_shield",
    name: "방어 보급",
    text: "짧은 보호막을 얻습니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    consumable: true,
    apply(player) {
      player.shield = Math.max(player.shield, Math.min(90, player.maxHp * 0.35));
      player.shieldTimer = Math.max(player.shieldTimer, 4);
    }
  },
  {
    id: "supply_focus",
    name: "전술 보급",
    text: "현재 스킬 쿨다운을 4초 줄입니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    consumable: true,
    apply(player) {
      for (const slot of SKILL_SLOTS) {
        player.skillTimers[slot] = Math.max(0, player.skillTimers[slot] - 4);
      }
    }
  }
];

const relicIcons = {
  supply_heal: "구",
  supply_shield: "방",
  supply_focus: "집",
  power_core: "힘",
  iron_plate: "방",
  swift_boots: "속",
  cooling_gear: "쿨",
  rapid_loader: "속",
  splitter_core: "분",
  giant_lens: "대",
  sharp_eye: "확",
  fatal_mark: "치",
  living_moss: "재",
  heartstone: "체"
};

const skillIcons = {
  job_warrior: "전",
  job_ranger: "궁",
  job_mage: "마",
  novice_primary: "응",
  warrior_primary: "회",
  ranger_primary: "연",
  mage_primary: "별",
  warrior_taunt: "도",
  warrior_charge: "돌",
  warrior_cleave: "베",
  warrior_guardian: "전",
  warrior_warlord: "지",
  warrior_taunt_bastion: "요",
  warrior_taunt_pull: "끌",
  warrior_charge_gather: "응",
  warrior_charge_collision: "연",
  warrior_charge_crash: "연",
  warrior_charge_aftershock: "충",
  warrior_cleave_execution: "처",
  warrior_cleave_guard: "수",
  warrior_sword_reach: "검",
  warrior_blood_heat: "열",
  warrior_unbreakable: "불",
  warrior_vanguard_stride: "선",
  warrior_riposte: "반",
  ranger_pierce: "관",
  ranger_trap: "비",
  ranger_poison: "독",
  ranger_eagle_eye: "눈",
  ranger_quickdraw: "속",
  ranger_multishot: "유",
  ranger_pierce_momentum: "증",
  ranger_pierce_blast: "광",
  ranger_bodkin: "광",
  ranger_trap_barbs: "폭",
  ranger_trap_chain: "뢰",
  ranger_rain_slow: "중",
  ranger_rain_shred: "장",
  ranger_poison_focus: "맹",
  ranger_poison_cloud: "장",
  ranger_poison_burst: "맹",
  ranger_kiting: "카",
  ranger_execution: "표",
  ranger_focus_fire: "집",
  ranger_soft_spot: "약",
  ranger_double_step: "스",
  mage_frost: "빙",
  mage_meteor: "운",
  mage_chain: "번",
  mage_arcane_focus: "비",
  mage_star_surge: "유",
  mage_storm_core: "분",
  mage_absolute_zero: "영",
  mage_frost_shatter: "파",
  mage_frost_echo: "숨",
  mage_wildfire: "화",
  mage_chain_paralyze: "강",
  mage_chain_overload: "과",
  mage_chain_anchor: "닻",
  mage_starlance: "별",
  mage_mana_surge: "마",
  mage_orbit_expansion: "궤",
  mage_ember_skin: "잿",
  mage_quick_cast: "속"
};

Object.assign(skillIcons, {
  warrior_colossus: "CO",
  warrior_worldsplitter: "연",
  ranger_storm_quiver: "화",
  ranger_plague_garden: "PG",
  mage_supercell: "SC",
  mage_apocalypse: "AP",
  job_engineer: "EN",
  job_puppeteer: "PP",
  engineer_primary: "TU",
  engineer_mecha: "ME",
  engineer_turret: "TU",
  engineer_mine: "MI",
  engineer_mine_field: "C3",
  engineer_auto_mine: "AM",
  engineer_drone: "DR",
  engineer_calibration: "FC",
  engineer_reinforced_frame: "RF",
  engineer_twin_turret: "TT",
  engineer_rail_turret: "RL",
  engineer_drone_swarm: "DS",
  engineer_interceptor: "IC",
  engineer_overclock: "LM",
  engineer_mine_field: "CH",
  engineer_factory: "PF",
  engineer_singularity_core: "EX",
  puppeteer_primary: "TH",
  puppeteer_puppet: "LP",
  puppeteer_bind: "BD",
  puppeteer_swap: "SW",
  puppeteer_fine_thread: "FT",
  puppeteer_soul_stitch: "SS",
  puppeteer_razor_puppet: "RP",
  puppeteer_guard_puppet: "GP",
  puppeteer_thread_saw: "TS",
  puppeteer_cross_bind: "CB",
  puppeteer_backstage: "BS",
  puppeteer_finale: "FN",
  puppeteer_dual_cast: "DC",
  puppeteer_twin_souls: "TS",
  puppeteer_grand_theater: "GT",
  job_martialist: "MF",
  job_alchemist: "AL",
  job_assassin: "AS",
  martialist_primary: "권",
  martial_combo_flow: "연",
  martial_palm: "장",
  martial_rising: "각",
  martial_focus: "기",
  martial_iron_body: "금",
  martial_afterimage: "잔",
  martial_dragon_pulse: "용",
  martial_counter: "반",
  martial_palm_breaker: "쇄",
  martial_rising_chain: "승",
  martial_focus_guard: "호",
  martial_dragon_soul: "혼",
  martial_infinite_combo: "무",
  alchemist_primary: "촉",
  alchemist_acid: "산",
  alchemist_fire: "화",
  alchemist_elixir: "영",
  alchemist_bigger_bottle: "병",
  alchemist_fast_mix: "배",
  alchemist_corrosive: "부",
  alchemist_chain_reaction: "연",
  alchemist_panacea: "만",
  alchemist_acid_storm: "폭",
  alchemist_fire_sea: "불",
  alchemist_elixir_cloud: "안",
  alchemist_philosopher: "현",
  alchemist_homunculus_mix: "호",
  assassin_primary: "난",
  assassin_mark: "표",
  assassin_lunge: "찌",
  assassin_smoke: "연",
  assassin_quick_blade: "속",
  assassin_deep_cut: "상",
  assassin_shadowstep: "그",
  assassin_fan: "부",
  assassin_mark_reaper: "수",
  assassin_lunge_reset: "회",
  assassin_smoke_bomb: "짙",
  assassin_nightfall: "밤",
  assassin_death_blossom: "사"
});

const enemyDefs = {
  training_dummy: {
    label: "훈련 표적",
    color: "#d6b76d",
    hp: 360,
    speed: 0,
    damage: 0,
    radius: 28,
    xp: 0,
    role: "dummy"
  },
  slime: {
    label: "슬라임",
    color: "#7fa671",
    hp: 50,
    speed: 94,
    damage: 12,
    radius: 18,
    xp: 14
  },
  bat: {
    label: "박쥐",
    color: "#7e9fb2",
    hp: 32,
    speed: 166,
    damage: 9,
    radius: 14,
    xp: 12
  },
  brute: {
    label: "투사",
    color: "#c85d56",
    hp: 138,
    speed: 70,
    damage: 23,
    radius: 25,
    xp: 32
  },
  guardian: {
    label: "수호자",
    color: "#64748b",
    hp: 185,
    speed: 64,
    damage: 15,
    radius: 32,
    xp: 40,
    role: "tank"
  },
  shaman: {
    label: "주술사",
    color: "#6ba79e",
    hp: 92,
    speed: 78,
    damage: 12,
    radius: 20,
    xp: 35,
    role: "healer"
  },
  spitter: {
    label: "침 뱉는 괴물",
    color: "#9aa15f",
    hp: 68,
    speed: 90,
    damage: 7,
    radius: 17,
    xp: 27,
    role: "ranged"
  },
  bomber: {
    label: "자폭병",
    color: "#c85d56",
    hp: 60,
    speed: 138,
    damage: 30,
    radius: 18,
    xp: 30,
    role: "bomber"
  },
  charger: {
    label: "돌진병",
    color: "#caa35a",
    hp: 104,
    speed: 96,
    damage: 17,
    radius: 22,
    xp: 34,
    role: "charger"
  },
  splitter: {
    label: "분열체",
    color: "#b98243",
    hp: 88,
    speed: 104,
    damage: 14,
    radius: 23,
    xp: 30,
    role: "splitter"
  },
  splinter: {
    label: "파편체",
    color: "#c9824c",
    hp: 24,
    speed: 156,
    damage: 9,
    radius: 11,
    xp: 4,
    role: "swarm"
  },
  runner: {
    label: "Runner",
    color: "#b98243",
    hp: 46,
    speed: 118,
    damage: 0,
    radius: 16,
    xp: 8,
    role: "runner"
  },
  runner_tank: {
    label: "Bulky Runner",
    color: "#64748b",
    hp: 128,
    speed: 66,
    damage: 0,
    radius: 25,
    xp: 12,
    role: "runner"
  },
  runner_fast: {
    label: "Swift Runner",
    color: "#7fa671",
    hp: 34,
    speed: 176,
    damage: 0,
    radius: 14,
    xp: 9,
    role: "runner"
  },
  stalker: {
    label: "암살자",
    color: "#8d7cae",
    hp: 62,
    speed: 142,
    damage: 16,
    radius: 18,
    xp: 32,
    role: "assassin"
  },
  mortar: {
    label: "포격수",
    color: "#7e9fb2",
    hp: 106,
    speed: 62,
    damage: 10,
    radius: 22,
    xp: 38,
    role: "artillery"
  },
  sniper: {
    label: "저격수",
    color: "#d6d0c4",
    hp: 64,
    speed: 88,
    damage: 10,
    radius: 17,
    xp: 34,
    role: "sniper"
  },
  boss: {
    label: "문지기",
    color: "#b98243",
    hp: 690,
    speed: 84,
    damage: 34,
    radius: 42,
    xp: 120
  }
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/account/")) {
    handleAccountRequest(req, res, url).catch((error) => {
      console.error("[account] request failed", error);
      sendJson(res, Number(error?.statusCode || 500), {
        error: error?.statusCode === 400
          ? "계정 요청 형식을 확인해 주세요."
          : error?.statusCode === 413
            ? "계정 데이터가 너무 큽니다."
            : "계정 서버에서 요청을 처리하지 못했습니다.",
      });
    });
    return;
  }
  if (url.pathname === "/rooms") {
    const body = JSON.stringify({ rooms: getPublicRooms() });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(body);
    return;
  }

  if (url.pathname === "/leaderboards") {
    const body = JSON.stringify({ leaderboards: Object.fromEntries(challengeLeaderboards) });
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(body);
    return;
  }

  let filePath;
  try {
    filePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  } catch {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }
  filePath = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");

  const webPath = filePath.replace(/\\/g, "/");
  const vendorPixiPath = path.join(__dirname, "node_modules", "pixi.js", "dist", "pixi.js");
  const absolutePath = webPath === "vendor/pixi.js" ? vendorPixiPath : path.join(PUBLIC_DIR, filePath);
  const relativePath = webPath === "vendor/pixi.js" ? "vendor/pixi.js" : path.relative(PUBLIC_DIR, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    res.writeHead(403);
    res.end("접근할 수 없습니다");
    return;
  }

  fs.readFile(absolutePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("찾을 수 없습니다");
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
});

async function handleAccountRequest(req, res, url) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "지원하지 않는 요청입니다." }, { Allow: "POST" });
    return;
  }
  const body = await readJsonBody(req, MAX_ACCOUNT_HTTP_BODY_BYTES);
  if (url.pathname === "/api/account/guest") {
    const session = accountStore.createGuest({
      displayName: body.displayName,
      progress: body.localProgress,
    });
    sendJson(res, 201, session);
    return;
  }
  if (url.pathname === "/api/account/session") {
    const session = accountStore.getSession(body.accountId, body.sessionToken);
    if (!session) {
      sendJson(res, 401, { error: "저장된 계정 세션이 만료되었거나 올바르지 않습니다." });
      return;
    }
    sendJson(res, 200, session);
    return;
  }
  if (url.pathname === "/api/account/recover") {
    const session = accountStore.recover(body.recoveryKey);
    if (!session) {
      sendJson(res, 401, { error: "복구 키를 확인해 주세요." });
      return;
    }
    sendJson(res, 200, session);
    return;
  }
  if (url.pathname === "/api/account/reset") {
    const session = accountStore.resetProgress(body.accountId, body.sessionToken);
    if (!session) {
      sendJson(res, 401, { error: "계정 세션을 확인하지 못했습니다." });
      return;
    }
    sendJson(res, 200, session);
    return;
  }
  sendJson(res, 404, { error: "계정 API를 찾을 수 없습니다." });
}

function readJsonBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("account payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(Object.assign(new Error("invalid account json"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  if (res.headersSent) return;
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

server.on("upgrade", (req, socket) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  socket.write(networkServer.createWebSocketHandshakeResponse(key));

  const client = {
    id: String(nextClientId++),
    socket,
    buffer: Buffer.alloc(0),
    room: null,
    playerId: null,
    accountId: null,
    joined: false
  };
  clients.set(client.id, client);

  socket.on("data", (chunk) => handleSocketData(client, chunk));
  socket.on("close", () => removeClient(client));
  socket.on("error", () => removeClient(client));
});

function handleSocketData(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);
  if (client.buffer.length > MAX_WS_PAYLOAD_BYTES * 2) {
    send(client, { type: "error", message: "패킷 크기가 너무 큽니다." });
    client.socket.end();
    removeClient(client);
    return;
  }

  while (client.buffer.length >= 2) {
    const frame = readFrame(client.buffer);
    if (!frame) return;
    client.buffer = client.buffer.slice(frame.offset);

    if (frame.opcode === 8) {
      client.socket.end();
      removeClient(client);
      return;
    }

    if (frame.opcode !== 1) continue;
    if (frame.payload.length > MAX_WS_PAYLOAD_BYTES) {
      send(client, { type: "error", message: "패킷 크기가 너무 큽니다." });
      client.socket.end();
      removeClient(client);
      return;
    }

    try {
      handleMessage(client, JSON.parse(frame.payload.toString("utf8")));
    } catch (error) {
      console.error("[ws] invalid packet", error);
      send(client, { type: "error", message: "잘못된 패킷입니다." });
    }
  }
}

function readFrame(buffer) {
  return networkServer.readFrame(buffer);
}

function handleMessage(client, message) {
  if (!message || typeof message !== "object" || typeof message.type !== "string") {
    send(client, { type: "error", message: "잘못된 메시지입니다." });
    return;
  }

  if (message.type === "ping") {
    send(client, { type: "pong", t: Number.isFinite(message.t) ? message.t : Date.now(), serverTime: Date.now() });
    return;
  }

  if (message.type === "join") {
    joinRoom(client, message);
    return;
  }

  const room = client.room ? rooms.get(client.room) : null;
  const player = room && client.playerId ? room.players.get(client.playerId) : null;
  if (!room || !player) return;

  if (message.type === "input") {
    if (player.spectator) {
      resetBotInput(player);
      return;
    }
    const incomingSkillSeqs = message.skillSeqs && typeof message.skillSeqs === "object" ? message.skillSeqs : {};
    player.input = {
      mx: clampNumber(message.mx, -1, 1),
      my: clampNumber(message.my, -1, 1),
      aimX: clampNumber(message.aimX, 0, room.world.w),
      aimY: clampNumber(message.aimY, 0, room.world.h),
      attacking: Boolean(message.attacking),
      skillSeqs: {
        q: clampSequence(
          Number.isFinite(incomingSkillSeqs.q) ? incomingSkillSeqs.q : Number.isFinite(message.skillSeq) ? message.skillSeq : player.input.skillSeqs.q,
          player.input.skillSeqs.q
        ),
        e: clampSequence(incomingSkillSeqs.e, player.input.skillSeqs.e),
        r: clampSequence(incomingSkillSeqs.r, player.input.skillSeqs.r),
        f: clampSequence(incomingSkillSeqs.f, player.input.skillSeqs.f)
      },
      dashSeq: clampSequence(message.dashSeq, player.input.dashSeq)
    };
    return;
  }

  if (message.type === "choose") {
    chooseRelic(room, player, sanitizeMessageId(message.relicId));
    return;
  }

  if (message.type === "chooseSkill") {
    chooseSkillUpgrade(room, player, sanitizeMessageId(message.upgradeId));
    return;
  }

  if (message.type === "chooseRisk") {
    chooseRisk(room, player, sanitizeMessageId(message.riskId));
    return;
  }

  if (message.type === "chooseMap") {
    chooseMapNode(room, player, sanitizeMessageId(message.nodeId));
    return;
  }

  if (message.type === "changeClass") {
    const nextClassId = sanitizeStartingClass(message.classId);
    player.growthLoadout = getAuthoritativeGrowthLoadout(player, nextClassId, message.growthLoadout);
    changePlayerClass(room, player, nextClassId);
    return;
  }
  if (message.type === "setGrowthLoadout") {
    setPlayerGrowthLoadout(room, player, message.growthLoadout);
    return;
  }
  if (message.type === "accountProgressAction") {
    handleAccountProgressAction(room, player, message.actionPayload);
    return;
  }

  if (message.type === "lobbySetSkillUpgrade") {
    setLobbySkillUpgrade(room, player, sanitizeMessageId(message.upgradeId), message.enabled !== false);
    return;
  }

  if (message.type === "lobbySetRelicLevel") {
    setLobbyRelicLevel(room, player, sanitizeMessageId(message.relicId), message.level);
    return;
  }

  if (message.type === "lobbyResetTestLoadout") {
    resetLobbyTestLoadout(room, player);
    return;
  }

  if (message.type === "toggleReady") {
    toggleReady(room, player);
    return;
  }

  if (message.type === "toggleSpectator") {
    toggleSpectator(room, player);
    return;
  }

  if (message.type === "addBot") {
    addBotToRoom(room, player);
    return;
  }

  if (message.type === "removeBot") {
    removeBotFromRoom(room, player);
    return;
  }

  if (message.type === "returnLobby") {
    returnRoomToLobby(room, player);
    return;
  }

  if (message.type === "togglePause") {
    toggleSoloPause(room, player);
    return;
  }

  if (message.type === "start") {
    startRunFromLobby(room, player);
  }
}

function joinRoom(client, message) {
  const roomCode = sanitizeRoom(message.room);
  const intent = message.intent === "create" ? "create" : "join";
  const existingRoom = rooms.get(roomCode);
  const alreadyInTarget = existingRoom && client.room === existingRoom.code && existingRoom.players.has(client.playerId);

  if (!existingRoom && intent !== "create") {
    send(client, { type: "error", message: "존재하지 않는 방입니다." });
    return;
  }

  if (existingRoom && intent === "create" && !alreadyInTarget) {
    send(client, { type: "error", message: "이미 존재하는 방입니다." });
    return;
  }

  const room = existingRoom || getRoom(roomCode);

  if (getActivePlayers(room).length >= MAX_PLAYERS && !alreadyInTarget) {
    send(client, { type: "error", message: "방이 가득 찼습니다." });
    return;
  }

  const hasAccountCredentials = Boolean(message.accountId || message.accountToken);
  const account = hasAccountCredentials
    ? accountStore.authenticate(message.accountId, message.accountToken)
    : null;
  if (hasAccountCredentials && !account) {
    send(client, { type: "error", message: "계정 세션을 확인하지 못했습니다. 계정 복구 후 다시 입장해 주세요." });
    return;
  }

  if (client.room) removeClientFromRoom(client, false);

  const player = createPlayer(client.id, sanitizeName(message.name), sanitizeStartingClass(message.classId), room);
  client.accountId = account?.id || null;
  player.accountId = account?.id || null;
  player.accountRevision = Number(account?.revision || 0);
  player.growthLoadout = getAuthoritativeGrowthLoadout(player, player.classId, message.growthLoadout);
  if (room.status === "lobby") {
    configurePlayerForLobbyTest(player, room, player.classId);
  }

  room.players.set(player.id, player);
  if (!room.hostId) room.hostId = player.id;
  if (room.hostId === player.id) {
    room.ascensionLevel = player.growthLoadout?.ascensionLevel || 0;
  }
  client.room = room.code;
  client.playerId = player.id;
  client.joined = true;

  pushEvent(room, `${player.name} 님이 ${room.code} 방에 입장했습니다.`);

  if (room.status === "choice") {
    player.choicePending = true;
    player.choices = pickRelics(room, player);
  }

  const accountSession = account ? accountStore.updateDisplayName(account.id, player.name) : null;
  send(client, {
    type: "joined",
    id: player.id,
    room: room.code,
    account: accountSession?.account || null,
    progress: accountSession?.progress || null,
  });
}

function startRunFromLobby(room, player) {
  if (room.hostId !== player.id) return;
  if (room.status !== "lobby") return;
  if (!areAllPlayersReady(room)) return;
  if (getActivePlayers(room).length === 0) return;

  pushEvent(room, `${player.name} 님이 런을 시작했습니다.`);
  startRun(room);
}

function returnRoomToLobby(room, player) {
  if (!room.players.has(player.id)) return;
  const returningFromGameover = room.status === "gameover";
  if (!returningFromGameover && !(room.status === "combat" && isSoloRoomOwner(room, player))) return;

  room.wave = 0;
  room.stageIndex = 0;
  room.floor = 1;
  room.abyssDepth = 0;
  room.ascensionLevel = 0;
  room.abyssDecision = false;
  room.challengeMode = "standard";
  room.challengeKey = "";
  room.challengeSeed = 0;
  room.challengeModifierId = "";
  room.challengeRuleId = "";
  room.weeklyBossId = "";
  room.runSeed = 0;
  room.randomState = 0;
  room.status = "lobby";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.effects = [];
  room.riskChoices = [];
  room.activeRisk = risks[0];
  room.stageMap = null;
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapPath = [];
  room.mapDeadline = 0;
  room.killsSinceChest = 0;
  room.threatLevel = 1;
  room.stageObjective = null;
  room.clearSummary = null;
  room.choiceDeadline = 0;
  room.pausedStatus = null;
  room.paused = false;
  room.pauseStartedAt = 0;
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  room.restartAt = 0;
  room.runStartedAt = 0;
  room.runBossDefeats = [];
  room.runDiscoveredMonsters = [];
  room.runDiscoveredBosses = [];
  room.runDefeatedMonsters = [];
  room.runDefeatedBosses = [];
  room.survival = null;
  room.result = null;

  for (const member of room.players.values()) {
    if (member.spectator) {
      resetBotInput(member);
      member.ready = false;
      member.choicePending = false;
      member.choices = [];
      member.pendingSkillChoices = [];
      continue;
    }
    configurePlayerForLobbyTest(member, room, member.classId);
    if (member.bot) member.ready = true;
  }

  ensureLobbyTrainingArena(room);
  room.ascensionLevel = getRoomAscensionLevel(room);
  pushEvent(room, `${player.name} 님이 방 로비로 돌아왔습니다.`);
}

function isSoloRoomOwner(room, player) {
  const activePlayers = getActivePlayers(room);
  return room.hostId === player?.id
    && activePlayers.length === 1
    && activePlayers[0]?.id === player.id
    && !activePlayers[0]?.bot
    && getBotPlayers(room).length === 0;
}

function shiftPauseDeadlines(room, pausedForMs) {
  if (!Number.isFinite(pausedForMs) || pausedForMs <= 0) return;
  if (room.runStartedAt) room.runStartedAt += pausedForMs;
  if (room.survival?.nextSpawnAt) room.survival.nextSpawnAt += pausedForMs;
  if (room.survival?.executionSpawnAt) room.survival.executionSpawnAt += pausedForMs;
}

function toggleSoloPause(room, player) {
  if (room.status !== "combat" || !isSoloRoomOwner(room, player)) return;
  const now = Date.now();
  if (room.paused) {
    shiftPauseDeadlines(room, now - Number(room.pauseStartedAt || now));
    room.paused = false;
    room.pauseStartedAt = 0;
    pushEvent(room, "전투를 계속합니다.");
    return;
  }
  room.paused = true;
  room.pauseStartedAt = now;
  pushEvent(room, "전투가 일시정지되었습니다.");
}

function changePlayerClass(room, player, classId) {
  if (room.status !== "lobby") return;
  const nextClassId = sanitizeStartingClass(classId);
  configurePlayerForLobbyTest(player, room, nextClassId);
  player.ready = false;
  pushEvent(room, `${player.name} 님이 ${classes[player.classId].label} 테스트로 변경했습니다.`);
}

function setPlayerGrowthLoadout(room, player, growthLoadout) {
  if (!player || player.bot || player.spectator) return;
  const isHost = room.hostId === player.id;
  const requestedLoadout = {
    ...(growthLoadout && typeof growthLoadout === "object" ? growthLoadout : {}),
    ascensionLevel: isHost
      ? growthLoadout?.ascensionLevel
      : player.growthLoadout?.ascensionLevel || 0,
  };
  player.growthLoadout = getAuthoritativeGrowthLoadout(player, player.classId, requestedLoadout);
  if (isHost && room.status === "lobby") {
    room.ascensionLevel = player.growthLoadout.ascensionLevel;
  }
  if (room.status === "lobby" && player.growthLoadout.classId === player.classId) {
    const wasReady = player.ready;
    configurePlayerForLobbyTest(player, room, player.classId);
    player.ready = wasReady;
  }
}

function getAuthoritativeGrowthLoadout(player, classId, requestedLoadout = null) {
  const safeClassId = sanitizeStartingClass(classId);
  const account = player?.accountId ? accountStore.getTrusted(player.accountId) : null;
  if (!account) return sanitizeGrowthLoadout(requestedLoadout, safeClassId);
  const requestedAscension = clamp(
    Math.floor(Number(requestedLoadout?.ascensionLevel || 0)),
    0,
    MAX_ASCENSION_LEVEL,
  );
  return sanitizeGrowthLoadout(
    progressionService.getGrowthLoadout(account.progress, safeClassId, requestedAscension),
    safeClassId,
  );
}

function handleAccountProgressAction(room, player, actionPayload) {
  if (room.status !== "lobby" || player.bot || player.spectator || !player.accountId) return;
  const account = accountStore.getTrusted(player.accountId);
  if (!account) return;
  const payload = sanitizeAccountActionPayload(actionPayload, player.classId);
  if (!payload) {
    sendAccountProgress(player, account, "action-rejected", "지원하지 않는 성장 요청입니다.");
    return;
  }
  const result = progressionService.performAction(account.progress, payload);
  if (!result.changed) {
    sendAccountProgress(player, account, "action-unchanged", result.message || "변경 조건을 충족하지 못했습니다.");
    return;
  }
  const session = accountStore.updateProgress(account.id, result.progress, `action:${payload.action}`);
  player.accountRevision = Number(session?.account?.revision || player.accountRevision || 0);
  if (result.affectsLoadout) {
    setPlayerGrowthLoadout(room, player, {
      ...(player.growthLoadout || {}),
      ascensionLevel: player.growthLoadout?.ascensionLevel || 0,
    });
  }
  sendAccountProgress(player, session, "action-applied", result.message || "서버에 저장되었습니다.");
}

function sanitizeAccountActionPayload(value, fallbackClassId) {
  const source = value && typeof value === "object" ? value : {};
  const action = String(source.action || "");
  if (!ACCOUNT_PROGRESS_ACTIONS.has(action)) return null;
  const nodeId = GROWTH_NODE_IDS.includes(source.nodeId) ? source.nodeId : "damage";
  const slot = ["weapon", "armor", "amulet", "core"].includes(source.slot) ? source.slot : "";
  return {
    action,
    classId: sanitizeStartingClass(source.classId || fallbackClassId),
    nodeId,
    itemId: sanitizeMessageId(source.itemId),
    itemIds: (Array.isArray(source.itemIds) ? source.itemIds : []).slice(0, 240).map(sanitizeMessageId).filter(Boolean),
    slot,
    affixIndex: clamp(Math.floor(Number(source.affixIndex || 0)), 0, 4),
    runeId: sanitizeMessageId(source.runeId),
    runeSlot: clamp(Math.floor(Number(source.runeSlot || 0)), 0, 2),
    runeType: sanitizeMessageId(source.runeType),
    tier: clamp(Math.floor(Number(source.tier || 1)), 1, 5),
    recipeId: sanitizeMessageId(source.recipeId),
    title: String(source.title || "").slice(0, 80),
    skin: sanitizeMessageId(source.skin),
  };
}

function sendAccountProgress(player, session, reason, message = "", extra = {}) {
  const client = player ? clients.get(String(player.id)) : null;
  if (!client || !session) return;
  send(client, {
    type: "accountProgress",
    account: session.account || {
      id: session.id,
      revision: session.revision,
      updatedAt: session.updatedAt,
    },
    progress: session.progress,
    reason,
    message,
    ...(extra && typeof extra === "object" ? extra : {}),
  });
}

function toggleReady(room, player) {
  if (room.status !== "lobby") return;
  if (player.bot || player.spectator) return;
  player.ready = !player.ready;
  pushEvent(room, `${player.name} 님이 ${player.ready ? "준비 완료" : "준비 취소"} 상태가 되었습니다.`);
}

function toggleSpectator(room, player) {
  if (room.status !== "lobby") return;
  if (player.bot) return;

  if (player.spectator) {
    if (getActivePlayers(room).length >= MAX_PLAYERS) {
      pushEvent(room, "파티가 가득 차서 관전을 해제할 수 없습니다.");
      return;
    }
    player.spectator = false;
    configurePlayerForLobbyTest(player, room, player.classId);
    player.ready = false;
    pushEvent(room, `${player.name} 님이 플레이어로 전환했습니다.`);
    return;
  }

  player.spectator = true;
  player.ready = false;
  player.choicePending = false;
  player.choices = [];
  player.pendingSkillChoices = [];
  resetBotInput(player);
  if (room.mapVotes) delete room.mapVotes[player.id];
  pushEvent(room, `${player.name} 님이 관전자 모드로 전환했습니다.`);
}

function addBotToRoom(room, player) {
  if (room.status !== "lobby" || room.hostId !== player.id) return;
  const activeCount = getActivePlayers(room).length;
  if (activeCount >= MAX_PLAYERS) return;

  const botNumber = nextBotId++;
  const identity = botSystem.createBotIdentity(room.code, activeCount, botNumber, BOT_CLASS_ROTATION, BOT_NAMES);
  const bot = createPlayer(identity.id, identity.name, identity.classId, room);
  bot.bot = true;
  bot.botBrain = createBotBrain();
  configurePlayerForLobbyTest(bot, room, identity.classId);
  bot.ready = true;
  placeBotNearParty(room, bot);
  room.players.set(bot.id, bot);
  pushEvent(room, `${bot.name} joined as an auto-play bot.`);
}

function removeBotFromRoom(room, player) {
  if (room.status !== "lobby" || room.hostId !== player.id) return;
  const bots = getBotPlayers(room);
  const bot = bots[bots.length - 1];
  if (!bot) return;
  room.players.delete(bot.id);
  if (room.mapVotes) delete room.mapVotes[bot.id];
  pushEvent(room, `${bot.name} was removed.`);
}

function getBotPlayers(room) {
  return playerSystem.getBotPlayers(room);
}

function getHumanPlayers(room) {
  return playerSystem.getHumanPlayers(room);
}

function isActivePlayer(player) {
  return playerSystem.isActivePlayer(player);
}

function getActivePlayers(room) {
  return playerSystem.getActivePlayers(room);
}

function isActiveLivingPlayer(player) {
  return playerSystem.isActiveLivingPlayer(player);
}

function getActiveLivingPlayers(room) {
  return playerSystem.getActiveLivingPlayers(room);
}

function countSpectators(room) {
  return playerSystem.countSpectators(room);
}

function createBotBrain() {
  return botSystem.createBotBrain();
}

function ensureBotBrain(player) {
  return botSystem.ensureBotBrain(player);
}

function placeBotNearParty(room, bot) {
  const humans = getHumanPlayers(room);
  const anchor = humans[0] || { x: room.world.w / 2, y: room.world.h / 2 };
  const index = getBotPlayers(room).length;
  const angle = -Math.PI / 2 + index * 1.7;
  bot.x = clamp(anchor.x + Math.cos(angle) * 76, 42, room.world.w - 42);
  bot.y = clamp(anchor.y + Math.sin(angle) * 76, 42, room.world.h - 42);
}

function sanitizeRoom(value) {
  return String(value || "TAVERN")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "TAVERN";
}

function sanitizeName(value) {
  return String(value || "Player")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 16) || "Player";
}

function sanitizeStartingClass(value) {
  const classId = String(value || "").toLowerCase();
  return STARTING_CLASSES.has(classId) ? classId : "warrior";
}

function sanitizeGrowthLoadout(loadout, fallbackClassId = "warrior") {
  const source = loadout && typeof loadout === "object" ? loadout : {};
  const classId = sanitizeStartingClass(source.classId || fallbackClassId);
  const rawNodes = source.nodes && typeof source.nodes === "object" ? source.nodes : {};
  const nodes = {};
  for (const nodeId of GROWTH_NODE_IDS) {
    const legacyNodeId = LEGACY_GROWTH_NODE_IDS[nodeId];
    nodes[nodeId] = clamp(Math.floor(Number(rawNodes[nodeId] ?? rawNodes[legacyNodeId]) || 0), 0, MAX_GROWTH_NODE_LEVEL);
  }
  const spentPoints = GROWTH_NODE_IDS.reduce((sum, nodeId) => sum + nodes[nodeId], 0);
  return {
    version: clamp(Math.floor(Number(source.version) || 2), 2, 3),
    classId,
    accountLevel: clamp(Math.floor(Number(source.accountLevel) || 1), 1, 9999),
    ascensionLevel: clamp(Math.floor(Number(source.ascensionLevel) || 0), 0, MAX_ASCENSION_LEVEL),
    points: clamp(Math.floor(Number(source.points) || spentPoints), spentPoints, MAX_GROWTH_NODE_LEVEL * GROWTH_NODE_IDS.length),
    nodes,
    gearBonuses: sanitizeGearBonuses(source.gearBonuses),
    gearAppearance: sanitizeGearAppearance(source.gearAppearance),
    challenge: sanitizeChallengeLoadout(source.challenge),
    cosmetic: sanitizeCosmeticLoadout(source.cosmetic)
  };
}

function sanitizeGearAppearance(source) {
  const allowedSlots = new Set(["weapon", "armor", "amulet", "core"]);
  const allowedRarities = new Set(["common", "rare", "epic", "legendary", "mythic", "unique"]);
  return (Array.isArray(source) ? source : []).slice(0, 4).map((entry) => ({
    slot: allowedSlots.has(String(entry?.slot || "")) ? String(entry.slot) : "core",
    rarity: allowedRarities.has(String(entry?.rarity || "")) ? String(entry.rarity) : "common",
    setId: String(entry?.setId || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 32),
    special: String(entry?.special || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 32),
    icon: String(entry?.icon || "").replace(/[^a-z0-9_]/gi, "").slice(0, 32)
  }));
}

function sanitizeCosmeticLoadout(source) {
  const cosmetic = source && typeof source === "object" ? source : {};
  return {
    title: String(cosmetic.title || "").replace(/[<>]/g, "").slice(0, 24),
    skin: Object.prototype.hasOwnProperty.call(SKIN_COLORS, String(cosmetic.skin || "")) ? String(cosmetic.skin || "") : ""
  };
}

function sanitizeGearBonuses(source) {
  const bonuses = source && typeof source === "object" ? source : {};
  const legacyEliteBossDamageMul = 1
    + Math.max(0, Number(bonuses.eliteDamageMul || 1) - 1)
    + Math.max(0, Number(bonuses.bossDamageMul || 1) - 1);
  const legacyCooldownMul = clampNumber(bonuses.skillCooldownMul || 1, 0.1, 1);
  const legacySkillHaste = Math.max(0, (100 / legacyCooldownMul) - 100);
  return {
    attackBonus: clampNumber(bonuses.attackBonus || 0, 0, 1000),
    maxHpBonus: clampNumber(bonuses.maxHpBonus || 0, 0, 10000),
    damageMul: clampNumber(bonuses.damageMul || 1, 1, 10),
    maxHpMul: clampNumber(bonuses.maxHpMul || 1, 1, 10),
    regenBonus: clampNumber(bonuses.regenBonus || 0, 0, 100),
    speedMul: clampNumber(bonuses.speedMul || 1, 1, 5),
    attackSpeed: clampNumber(bonuses.attackSpeed || 0, 0, 500),
    skillHaste: clampNumber(bonuses.skillHaste ?? legacySkillHaste, 0, 500),
    armorBonus: clampNumber(bonuses.armorBonus || 0, 0, 10),
    critChanceBonus: clampNumber(bonuses.critChanceBonus || 0, 0, 0.85),
    critDamageMul: clampNumber(bonuses.critDamageMul || 1, 1, 10),
    eliteBossDamageMul: clampNumber(bonuses.eliteBossDamageMul || legacyEliteBossDamageMul, 1, 10),
    bossFinisherMul: clampNumber(bonuses.bossFinisherMul || 1, 1, 1.45),
    bossFinisherThreshold: clampNumber(bonuses.bossFinisherThreshold || 0, 0, 0.2),
    statusDamageMul: clampNumber(bonuses.statusDamageMul || 1, 1, 10),
    areaMul: clampNumber(bonuses.areaMul || 1, 1, 5),
    constructDamageMul: clampNumber(bonuses.constructDamageMul || 1, 1, 10),
    constructDurationMul: clampNumber(bonuses.constructDurationMul || 1, 1, 10),
    burnDamageMul: clampNumber(bonuses.burnDamageMul || 1, 1, 10),
    turretKillDurationBonus: clampNumber(bonuses.turretKillDurationBonus || 0, 0, 2),
    wallBounceBonus: clamp(Math.floor(Number(bonuses.wallBounceBonus) || 0), 0, 2),
    poisonStackCapBonus: clamp(Math.floor(Number(bonuses.poisonStackCapBonus) || 0), 0, 2),
    lowHpShieldRatio: clampNumber(bonuses.lowHpShieldRatio || 0, 0, 0.35),
    warriorWhirlwindEcho: clamp(Math.floor(Number(bonuses.warriorWhirlwindEcho) || 0), 0, 1),
    rangerVolleyBonus: clamp(Math.floor(Number(bonuses.rangerVolleyBonus) || 0), 0, 2),
    mageStarSplit: clamp(Math.floor(Number(bonuses.mageStarSplit) || 0), 0, 1),
    engineerAuxTurret: clamp(Math.floor(Number(bonuses.engineerAuxTurret) || 0), 0, 1),
    vanguardWhirlwindGuard: clamp(Math.floor(Number(bonuses.vanguardWhirlwindGuard) || 0), 0, 1),
    hunterRainBarrage: clamp(Math.floor(Number(bonuses.hunterRainBarrage) || 0), 0, 1),
    arcanistPiercingFragments: clamp(Math.floor(Number(bonuses.arcanistPiercingFragments) || 0), 0, 1),
    mechanistTurretMine: clamp(Math.floor(Number(bonuses.mechanistTurretMine) || 0), 0, 1),
    projectileShieldCharges: clamp(Math.floor(Number(bonuses.projectileShieldCharges) || 0), 0, 3),
    projectileShieldCooldown: clampNumber(bonuses.projectileShieldCooldown || 0, 0, 15),
    poisonSpread: clamp(Math.floor(Number(bonuses.poisonSpread) || 0), 0, 1),
    commonDrone: clamp(Math.floor(Number(bonuses.commonDrone) || 0), 0, 1),
    periodicShieldRatio: clampNumber(bonuses.periodicShieldRatio || 0, 0, 0.18),
    killCooldownRefund: clampNumber(bonuses.killCooldownRefund || 0, 0, 0.8),
    lifeSteal: clampNumber(bonuses.lifeSteal || 0, 0, 0.036),
    armorLockZero: clamp(Math.floor(Number(bonuses.armorLockZero) || 0), 0, 1),
    maxHpPenalty: clampNumber(bonuses.maxHpPenalty || 0, 0, 0.3),
    armorPenalty: clampNumber(bonuses.armorPenalty || 0, 0, 0.55),
    basicAttackDamageMul: clampNumber(bonuses.basicAttackDamageMul || 1, 1, 2),
    skillsDisabled: clamp(Math.floor(Number(bonuses.skillsDisabled) || 0), 0, 1),
    primaryDisabled: clamp(Math.floor(Number(bonuses.primaryDisabled) || 0), 0, 1),
    dashChargeBonus: clamp(Math.floor(Number(bonuses.dashChargeBonus) || 0), 0, 1),
    xpMagnet: clamp(Math.floor(Number(bonuses.xpMagnet) || 0), 0, 1),
    warriorExecutionThreshold: clampNumber(bonuses.warriorExecutionThreshold || 0.25, 0.25, 0.35),
    warriorCleaveRepeat: clamp(Math.floor(Number(bonuses.warriorCleaveRepeat) || 0), 0, 1),
    warriorShoutDamageMul: clampNumber(bonuses.warriorShoutDamageMul || 0, 0, 2.2),
    warriorWhirlwindPull: clamp(Math.floor(Number(bonuses.warriorWhirlwindPull) || 0), 0, 1),
    warriorCollisionCharge: clamp(Math.floor(Number(bonuses.warriorCollisionCharge) || 0), 0, 1),
    rangerPrimaryHoming: clamp(Math.floor(Number(bonuses.rangerPrimaryHoming) || 0), 0, 1),
    rangerRadialQ: clamp(Math.floor(Number(bonuses.rangerRadialQ) || 0), 0, 1),
    rangerLaserFire: clamp(Math.floor(Number(bonuses.rangerLaserFire) || 0), 0, 1),
    rangerRainPull: clamp(Math.floor(Number(bonuses.rangerRainPull) || 0), 0, 1),
    rangerPierceCapBonus: clampNumber(bonuses.rangerPierceCapBonus || 0, 0, 60),
    mageGiantOrb: clamp(Math.floor(Number(bonuses.mageGiantOrb) || 0), 0, 1),
    mageFlameWave: clamp(Math.floor(Number(bonuses.mageFlameWave) || 0), 0, 1),
    mageMeteorGrowthCapBonus: clampNumber(bonuses.mageMeteorGrowthCapBonus || 0, 0, 360),
    mageIceMeteor: clamp(Math.floor(Number(bonuses.mageIceMeteor) || 0), 0, 1),
    mageChainBoost: clamp(Math.floor(Number(bonuses.mageChainBoost) || 0), 0, 1),
    engineerMechaModule: clamp(Math.floor(Number(bonuses.engineerMechaModule) || 0), 0, 1),
    engineerMineFire: clamp(Math.floor(Number(bonuses.engineerMineFire) || 0), 0, 1),
    engineerDroneBonus: clamp(Math.floor(Number(bonuses.engineerDroneBonus) || 0), 0, 2),
    engineerPermanentDrone: clamp(Math.floor(Number(bonuses.engineerPermanentDrone) || 0), 0, 1)
  };
}

function sanitizeChallengeLoadout(source) {
  return {
    mode: "standard",
    key: "",
    seed: 0,
    modifierId: "",
    ruleId: ""
  };
}

function growthCurve(level) {
  return Math.log1p(clamp(Math.floor(Number(level) || 0), 0, MAX_GROWTH_NODE_LEVEL)) * 2.4;
}

function roundBonus(value) {
  return Math.round(value * 10000) / 10000;
}

function calculateGrowthBonuses(classId, nodes = {}) {
  const damage = growthCurve(nodes.damage);
  const maxHp = growthCurve(nodes.maxHp);
  const regen = growthCurve(nodes.regen);
  const moveSpeed = growthCurve(nodes.moveSpeed);
  const attackSpeed = growthCurve(nodes.attackSpeed);
  const cooldown = growthCurve(nodes.cooldown);
  const critDamage = growthCurve(nodes.critDamage);
  const area = growthCurve(nodes.area);
  const bonuses = {
    damageMul: 1 + Math.min(0.6, damage * 0.025),
    maxHpMul: 1 + Math.min(0.58, maxHp * 0.027),
    regenBonus: Math.min(2.5, regen * 0.08),
    speedMul: 1 + Math.min(0.26, moveSpeed * 0.014),
    attackSpeed: Math.min(40, attackSpeed * 2),
    skillHaste: Math.min(28, cooldown * 1.6),
    armorBonus: 0,
    critChanceBonus: 0,
    critDamageMul: 1 + Math.min(0.45, critDamage * 0.018),
    projectileSpeedMul: 1,
    poisonDurationMul: 1,
    skillDamageMul: 1,
    areaMul: 1 + Math.min(0.24, area * 0.012),
    constructDamageMul: 1,
    constructDurationMul: 1,
    droneCooldownMul: 1,
    tauntRangeMul: 1,
    meleeRangeMul: 1
  };
  return {
    damageMul: roundBonus(bonuses.damageMul),
    maxHpMul: roundBonus(bonuses.maxHpMul),
    regenBonus: roundBonus(bonuses.regenBonus),
    speedMul: roundBonus(bonuses.speedMul),
    attackSpeed: roundBonus(Math.min(500, bonuses.attackSpeed)),
    skillHaste: roundBonus(Math.min(500, bonuses.skillHaste)),
    armorBonus: roundBonus(bonuses.armorBonus),
    critChanceBonus: roundBonus(bonuses.critChanceBonus),
    critDamageMul: roundBonus(bonuses.critDamageMul),
    projectileSpeedMul: roundBonus(bonuses.projectileSpeedMul),
    poisonDurationMul: roundBonus(bonuses.poisonDurationMul),
    skillDamageMul: roundBonus(bonuses.skillDamageMul),
    areaMul: roundBonus(bonuses.areaMul),
    constructDamageMul: roundBonus(bonuses.constructDamageMul),
    constructDurationMul: roundBonus(bonuses.constructDurationMul),
    droneCooldownMul: roundBonus(Math.max(0.6, bonuses.droneCooldownMul)),
    tauntRangeMul: roundBonus(bonuses.tauntRangeMul),
    meleeRangeMul: roundBonus(bonuses.meleeRangeMul)
  };
}

function calculateAccountLevelBonuses(accountLevel) {
  const gainedLevels = clamp(Math.floor(Number(accountLevel) || 1) - 1, 0, 9999);
  return {
    damageMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
    maxHpMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
    regenBonus: roundBonus(Math.min(2, gainedLevels * 0.04)),
    speedMul: roundBonus(1 + Math.min(0.15, gainedLevels * 0.003)),
    skillHaste: roundBonus(Math.min(20, gainedLevels * 0.3)),
    armorBonus: roundBonus(Math.min(6, gainedLevels * 0.12)),
    critChanceBonus: roundBonus(Math.min(0.1, gainedLevels * 0.003)),
    critDamageMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
    areaMul: roundBonus(1 + Math.min(0.25, gainedLevels * 0.005))
  };
}

function applyPlayerGrowthBonuses(player, room) {
  if (!player || player.bot || player.spectator) {
    player.permanentGrowth = { applied: false };
    return;
  }
  let loadout = sanitizeGrowthLoadout(player.growthLoadout, player.classId);
  if (loadout.classId !== player.classId) {
    loadout = sanitizeGrowthLoadout({ classId: player.classId }, player.classId);
  }
  const bonuses = calculateGrowthBonuses(player.classId, loadout.nodes);
  const accountBonuses = calculateAccountLevelBonuses(loadout.accountLevel);
  const gear = sanitizeGearBonuses(loadout.gearBonuses);
  player.growthLoadout = loadout;
  player.attackPowerBonus = gear.attackBonus;
  player.damageMul += (accountBonuses.damageMul - 1) + (bonuses.damageMul - 1) + (gear.damageMul - 1);
  player.maxHp = Math.max(1, Math.round((player.maxHp + gear.maxHpBonus) * accountBonuses.maxHpMul * bonuses.maxHpMul * gear.maxHpMul * (1 - gear.maxHpPenalty)));
  player.hp = player.maxHp;
  player.regen += accountBonuses.regenBonus + bonuses.regenBonus + gear.regenBonus;
  player.speedMul *= accountBonuses.speedMul * bonuses.speedMul * gear.speedMul;
  player.attackSpeed = Math.min(500, (player.attackSpeed || 0) + bonuses.attackSpeed + gear.attackSpeed);
  player.skillHaste = Math.min(500, (player.skillHaste || 0) + accountBonuses.skillHaste + bonuses.skillHaste + gear.skillHaste);
  player.armor = gear.armorLockZero
    ? 0
    : clamp(((player.armor || 0) + accountBonuses.armorBonus + bonuses.armorBonus + gear.armorBonus) * (1 - gear.armorPenalty), 0, 18);
  player.crit = clamp((player.crit || 0) + accountBonuses.critChanceBonus + bonuses.critChanceBonus + gear.critChanceBonus, 0, 0.85);
  player.critDamageMul += (accountBonuses.critDamageMul - 1) + (bonuses.critDamageMul - 1) + (gear.critDamageMul - 1);
  player.projectileSpeedMul = bonuses.projectileSpeedMul;
  player.poisonDurationMul = bonuses.poisonDurationMul;
  player.skillDamageMul = bonuses.skillDamageMul;
  player.areaMul *= accountBonuses.areaMul * bonuses.areaMul * gear.areaMul;
  player.constructDamageMul = bonuses.constructDamageMul * gear.constructDamageMul;
  player.constructDurationMul = bonuses.constructDurationMul * gear.constructDurationMul;
  player.droneCooldownMul = bonuses.droneCooldownMul;
  player.tauntRangeMul = bonuses.tauntRangeMul;
  player.rangeMul *= bonuses.meleeRangeMul;
  player.eliteBossDamageMul = gear.eliteBossDamageMul;
  player.bossFinisherMul = gear.bossFinisherMul;
  player.bossFinisherThreshold = gear.bossFinisherThreshold;
  player.statusDamageMul *= gear.statusDamageMul;
  player.wallBounceBonus = gear.wallBounceBonus;
  player.poisonStackCapBonus = gear.poisonStackCapBonus;
  player.lowHpShieldRatio = gear.lowHpShieldRatio;
  player.burnDamageMul = gear.burnDamageMul;
  player.poisonDamageMul = 1;
  player.turretKillDurationBonus = gear.turretKillDurationBonus;
  player.warriorWhirlwindEcho = gear.warriorWhirlwindEcho;
  player.rangerVolleyBonus = gear.rangerVolleyBonus;
  player.mageStarSplit = gear.mageStarSplit;
  player.engineerAuxTurret = gear.engineerAuxTurret;
  player.vanguardWhirlwindGuard = gear.vanguardWhirlwindGuard;
  player.hunterRainBarrage = gear.hunterRainBarrage;
  player.arcanistPiercingFragments = gear.arcanistPiercingFragments;
  player.mechanistTurretMine = gear.mechanistTurretMine;
  player.projectileShieldMaxCharges = gear.projectileShieldCharges;
  player.projectileShieldCharges = gear.projectileShieldCharges;
  player.projectileShieldCooldown = gear.projectileShieldCooldown;
  player.projectileShieldRespawnTimer = 0;
  player.poisonSpread = gear.poisonSpread;
  player.commonDrone = gear.commonDrone;
  player.periodicShieldRatio = gear.periodicShieldRatio;
  player.periodicShieldTimer = gear.periodicShieldRatio > 0 ? 2.5 : 0;
  player.onKillCooldownRefund += gear.killCooldownRefund;
  player.lifeSteal += gear.lifeSteal;
  player.armorLockZero = Boolean(gear.armorLockZero);
  player.basicAttackDamageMul = gear.basicAttackDamageMul;
  player.skillsDisabled = Boolean(gear.skillsDisabled);
  player.primaryDisabled = Boolean(gear.primaryDisabled && !gear.skillsDisabled);
  player.dashChargeBonus = gear.dashChargeBonus;
  player.xpMagnet = Boolean(gear.xpMagnet);
  player.warriorExecutionThreshold = gear.warriorExecutionThreshold;
  player.warriorCleaveRepeat = gear.warriorCleaveRepeat;
  player.warriorShoutDamageMul = gear.warriorShoutDamageMul;
  player.warriorWhirlwindPull = gear.warriorWhirlwindPull;
  player.warriorCollisionCharge = gear.warriorCollisionCharge;
  player.rangerPrimaryHoming = gear.rangerPrimaryHoming;
  player.rangerRadialQ = gear.rangerRadialQ;
  player.rangerLaserFire = gear.rangerLaserFire;
  player.rangerRainPull = gear.rangerRainPull;
  player.rangerPierceCapBonus = gear.rangerPierceCapBonus;
  player.mageGiantOrb = gear.mageGiantOrb;
  player.mageFlameWave = gear.mageFlameWave;
  player.mageMeteorGrowthCapBonus = gear.mageMeteorGrowthCapBonus;
  player.mageIceMeteor = gear.mageIceMeteor;
  player.mageChainBoost = gear.mageChainBoost;
  player.engineerMechaModule = gear.engineerMechaModule;
  player.engineerMineFire = gear.engineerMineFire;
  player.engineerDroneBonus = gear.engineerDroneBonus;
  player.engineerPermanentDrone = gear.engineerPermanentDrone;
  resetDashCharges(player);
  player.cosmeticTitle = loadout.cosmetic.title;
  player.cosmeticSkin = loadout.cosmetic.skin;
  player.appearanceColor = SKIN_COLORS[loadout.cosmetic.skin] || "";
  player.gearAppearance = loadout.gearAppearance;
  const activeModifier = room?.challengeModifierId || loadout.challenge.modifierId;
  if (activeModifier === "healing_drought") player.healingMul *= 0.6;
  if (activeModifier === "glass_cannon") player.damageMul += 0.18;
  if ((room?.ascensionLevel || 0) >= 3) player.healingMul *= 0.65;
  const weeklyRuleId = room?.challengeRuleId || loadout.challenge.ruleId;
  if (weeklyRuleId === "venom_week") {
    player.poisonDamageMul *= 1.35;
    player.burnDamageMul *= 0.72;
  } else if (weeklyRuleId === "ember_week") {
    player.burnDamageMul *= 1.35;
    player.poisonDamageMul *= 0.72;
  } else if (weeklyRuleId === "construct_week") {
    player.constructDamageMul *= 1.25;
    player.constructDurationMul *= 1.15;
  }
  player.permanentGrowth = {
    applied: true,
    classId: loadout.classId,
    accountLevel: loadout.accountLevel,
    ascensionLevel: loadout.ascensionLevel,
    points: loadout.points,
    nodes: { ...loadout.nodes },
    accountBonuses,
    bonuses,
    gearBonuses: gear,
    challenge: { ...loadout.challenge, modifierId: activeModifier || "", ruleId: weeklyRuleId || "" },
    cosmetic: loadout.cosmetic
  };
}

function getPlayerGrowthView(player) {
  if (!player || player.bot || player.spectator) return { applied: false };
  const loadout = sanitizeGrowthLoadout(player.growthLoadout, player.classId);
  return {
    applied: Boolean(player.permanentGrowth?.applied),
    classId: loadout.classId,
    accountLevel: loadout.accountLevel,
    ascensionLevel: loadout.ascensionLevel,
    points: loadout.points,
    nodes: { ...loadout.nodes },
    accountBonuses: player.permanentGrowth?.accountBonuses || calculateAccountLevelBonuses(loadout.accountLevel),
    bonuses: player.permanentGrowth?.bonuses || calculateGrowthBonuses(loadout.classId, loadout.nodes),
    gearBonuses: player.permanentGrowth?.gearBonuses || sanitizeGearBonuses(loadout.gearBonuses),
    challenge: player.permanentGrowth?.challenge || loadout.challenge,
    cosmetic: player.permanentGrowth?.cosmetic || loadout.cosmetic,
    gearAppearance: player.gearAppearance || loadout.gearAppearance
  };
}

function getRoomChallenge(room) {
  const host = room.hostId ? room.players.get(room.hostId) : null;
  const source = host && !host.bot && !host.spectator
    ? sanitizeGrowthLoadout(host.growthLoadout, host.classId).challenge
    : { mode: "standard", key: "", seed: 0, modifierId: "" };
  return sanitizeChallengeLoadout(source);
}

function getRoomAscensionLevel(room) {
  const host = room.hostId ? room.players.get(room.hostId) : null;
  if (!host || host.bot || host.spectator) return 0;
  const loadout = sanitizeGrowthLoadout(host.growthLoadout, host.classId);
  return clamp(loadout.ascensionLevel, 0, MAX_ASCENSION_LEVEL);
}

function getAbyssDifficulty(room) {
  const depth = Math.max(0, Math.floor(Number(room.abyssDepth || 0)));
  const ascension = clamp(Math.floor(Number(room.ascensionLevel || 0)), 0, MAX_ASCENSION_LEVEL);
  const profile = ASCENSION_DIFFICULTY_PROFILES[ascension] || ASCENSION_DIFFICULTY_PROFILES[0];
  const modifierId = room.challengeModifierId || "";
  const modifier = {
    spawnMul: modifierId === "elite_hunt" ? 1.08 : modifierId === "enemy_haste" ? 1.1 : 1,
    hpMul: modifierId === "elite_hunt" ? 1.16 : 1,
    damageMul: modifierId === "glass_cannon" ? 1.25 : modifierId === "enemy_haste" ? 1.08 : 1,
    speedMul: modifierId === "enemy_haste" ? 1.12 : 1,
    threatMul: modifierId ? 1.08 : 1,
    eliteBonus: modifierId === "elite_hunt" ? 0.12 : 0
  };
  return {
    depth,
    ascension,
    spawnMul: (1 + depth * 0.1) * profile.spawnMul * modifier.spawnMul,
    hpMul: (1 + depth * 0.16) * profile.hpMul * modifier.hpMul,
    damageMul: (1 + depth * 0.09) * profile.damageMul * modifier.damageMul,
    speedMul: (1 + Math.min(0.24, depth * 0.012)) * profile.speedMul * modifier.speedMul,
    cadenceMul: profile.cadenceMul,
    threatMul: (1 + depth * 0.08) * (1 + ascension * 0.16) * modifier.threatMul,
    eliteBonus: Math.min(0.9, depth * 0.012 + profile.eliteBonus + modifier.eliteBonus),
    rewardMul: profile.rewardMul * (modifierId ? 1.15 : 1)
  };
}

function calculateRunRewardSummary(result) {
  const stagesCleared = Math.max(0, Math.floor(Number(result?.stagesCleared || 0)));
  const highestLevel = Math.max(1, Math.floor(Number(result?.highestLevel || 1)));
  const totalScore = Math.max(0, Math.floor(Number(result?.totalScore || 0)));
  const totalRelics = Math.max(0, Math.floor(Number(result?.totalRelics || 0)));
  const abyssDepth = Math.max(0, Math.floor(Number(result?.abyssDepth || 0)));
  const ascensionLevel = clamp(Math.floor(Number(result?.ascensionLevel || 0)), 0, MAX_ASCENSION_LEVEL);
  const progressReward = Math.floor(stagesCleared * 5 + highestLevel * 2 + totalRelics * 3 + Math.sqrt(totalScore) * 0.42);
  const victoryReward = result?.outcome === "victory" ? 45 : 0;
  const abyssReward = abyssDepth > 0 ? abyssDepth * 18 + Math.floor(Math.pow(abyssDepth, 1.22) * 8) : 0;
  const ascensionMultiplier = ASCENSION_DIFFICULTY_PROFILES[ascensionLevel]?.rewardMul || 1;
  const challengeMultiplier = result?.challengeModifierId ? 1.15 : 1;
  const outcomeMultiplier = result?.outcome === "victory" ? 2 : 0.5;
  const rewardBase = progressReward + victoryReward + abyssReward;
  const shardReward = rewardBase * ascensionMultiplier * challengeMultiplier * 1.45;
  const accountXpReward = rewardBase * ascensionMultiplier * challengeMultiplier * 1.75 + stagesCleared * 3 + highestLevel * 6;
  return {
    earnedShards: Math.max(result?.outcome === "victory" ? 6 : 1, Math.floor(shardReward * outcomeMultiplier)),
    earnedAccountXp: Math.max(result?.outcome === "victory" ? 20 : 5, Math.floor(accountXpReward * outcomeMultiplier)),
    abyssDepth,
    ascensionLevel,
    rewardBreakdown: [
      { id: "progress", label: "진행 보상", value: progressReward },
      { id: "victory", label: "승리 보너스", value: victoryReward },
      { id: "abyss", label: "심연 보너스", value: abyssReward },
      { id: "ascension", label: "승천 배율", value: `${Math.round(ascensionMultiplier * 100)}%` },
      { id: "challenge", label: "도전 배율", value: `${Math.round(challengeMultiplier * 100)}%` },
      { id: "outcome", label: result?.outcome === "victory" ? "런 성공 보너스" : "생존 실패 감산", value: `${Math.round(outcomeMultiplier * 100)}%` }
    ]
  };
}

function sanitizeMessageId(value) {
  const id = String(value || "").trim().slice(0, 64);
  return SAFE_ID_PATTERN.test(id) ? id : "";
}

function clampSequence(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return clamp(Math.floor(number), 0, MAX_INPUT_SEQUENCE);
}

function getPublicRooms() {
  return roomManager.getPublicRooms(rooms, {
    getActivePlayers,
    countSpectators,
    maxPlayers: MAX_PLAYERS
  });
}

function getRoom(code) {
  return roomManager.getOrCreateRoom(rooms, code, { activeRisk: risks[0] });
}

function createPlayer(id, name, classId, room) {
  const def = classes[classId];
  const angle = Math.random() * Math.PI * 2;
  const spawnDistance = 70 + Math.random() * 80;
  const x = room.world.w / 2 + Math.cos(angle) * spawnDistance;
  const y = room.world.h / 2 + Math.sin(angle) * spawnDistance;

  return {
    id,
    name,
    classId,
    x,
    y,
    hp: def.maxHp,
    maxHp: def.maxHp,
    level: 1,
    xp: 0,
    score: 0,
    relics: [],
    skillUpgrades: [],
    lobbyTestClassId: classId,
    lobbyTestSkillIds: null,
    lobbyTestRelicLevels: {},
    growthLoadout: sanitizeGrowthLoadout(null, classId),
    permanentGrowth: { applied: false },

    skillMechanics: {},
    pendingSkillChoices: [],
    claimedAdvancementLevels: [],
    jobTier: classId === "novice" ? 0 : 1,
    input: {
      mx: 0,
      my: 0,
      aimX: x + 1,
      aimY: y,
      attacking: false,
      skillSeqs: { q: 0, e: 0, r: 0, f: 0 },
      dashSeq: 0
    },
    attackTimer: 0,
    skillTimers: { q: 0, e: 0, r: 0, f: 0 },
    deferredSkillCooldowns: {},
    dashTimer: 0,
    dashCharges: getDashMaxChargesForClass(classId),
    dashRechargeTimer: 0,
    dashMove: null,
    knockbackMove: null,
    warriorChargeChainCharges: 0,
    warriorChargeChainWindow: 0,
    warriorChargeChainCooldown: 0,
    warriorChargeSucceeded: false,
    engineerMineCharges: 0,
    engineerMineChargesInitialized: false,
    engineerAutoMineTimer: 0,
    engineerAutoMineInitialized: false,
    engineerMechaTimer: 0,
    rangerPierceKills: 0,
    rangerPierceDamageBonus: 0,
    lastSkillSeqs: { q: 0, e: 0, r: 0, f: 0 },
    lastDashSeq: 0,
    damageMul: 1,
    attackPowerBonus: 0,
    speedMul: 1,
    cooldownMul: 1,
    attackSpeed: 0,
    skillHaste: 0,
    rangeMul: 1,
    areaMul: 1,
    projectileSpeedMul: 1,
    poisonDurationMul: 1,
    skillDamageMul: 1,
    constructDamageMul: 1,
    constructDurationMul: 1,
    droneCooldownMul: 1,
    tauntRangeMul: 1,
    splashBonus: 0,
    armor: def.armor || 0,
    crit: def.crit ?? 0.03,
    critDamageMul: 1,
    lifeSteal: 0,
    regen: BASE_HEALTH_REGEN + (def.regen ?? 0),
    lowHpCritBonus: 0,
    missingHpDamageBonus: 0,
    eliteBossDamageMul: 1,
    bossFinisherMul: 1,
    bossFinisherThreshold: 0,
    statusDamageMul: 1,
    dashCooldownMul: 1,
    dashDistanceMul: 1,
    dashSpeedTimer: 0,
    dashSpeedMul: 1,
    onKillHeal: 0,
    onKillCooldownRefund: 0,
    onKillTeamHeal: 0,
    chestDropBonus: 0,
    thornsMul: 0,
    healingMul: 1,
    shieldMul: 1,
    clearHealBonus: 0,
    projectileCountBonus: 0,
    wallBounceBonus: 0,
    poisonStackCapBonus: 0,
    lowHpShieldRatio: 0,
    burnDamageMul: 1,
    poisonDamageMul: 1,
    turretKillDurationBonus: 0,
    cosmeticTitle: "",
    cosmeticSkin: "",
    appearanceColor: "",
    gearAppearance: [],
    runStats: createEmptyRunStats(),
    lowHpShieldUsed: false,
    deathSaveCharges: 0,
    deathSaveHealRatio: 0,
    shield: 0,
    shieldTimer: 0,
    tauntGuardTimer: 0,
    immunityTimer: 0,
    hitIFrameTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    poisonBaseDps: 0,
    poisonStacks: 0,
    poisonTickTimer: 0,
    poisonOwnerId: null,
    choicePending: false,
    choices: [],
    ready: false,
    spectator: false,
    bot: false,
    botBrain: null,
    downedAt: 0,
    lastAttackAt: 0,
    lastSkillAt: 0,
    lastDashAt: 0,
    attackSwingSide: 1,
    comboCounter: 0,
    comboTimer: 0,
    martialChi: 0,
    martialChiTimer: 0,
    martialFlowTimer: 0,
    stealthTimer: 0,
    inputGraceUntil: 0
  };
}

function startRun(room) {
  room.wave = 1;
  room.stageIndex = 0;
  room.floor = 1;
  room.abyssDepth = 0;
  room.ascensionLevel = getRoomAscensionLevel(room);
  const challenge = getRoomChallenge(room);
  room.challengeMode = challenge.mode;
  room.challengeKey = challenge.key;
  room.challengeSeed = challenge.seed;
  room.challengeModifierId = challenge.modifierId;
  room.challengeRuleId = challenge.ruleId;
  room.runSeed = challenge.seed || hashString(`${room.code}:${Date.now()}`);
  room.randomState = room.runSeed;
  if (room.challengeMode === "weekly") {
    const profiles = Object.values(CHAPTER_BOSSES);
    room.weeklyBossId = profiles[room.challengeSeed % profiles.length]?.id || CHAPTER_BOSSES[MAX_CHAPTERS].id;
  } else {
    room.weeklyBossId = "";
  }
  room.abyssDecision = false;
  room.status = "combat";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.effects = [];
  room.riskChoices = [];
  room.activeRisk = risks[0];
  room.stageMap = null;
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapPath = [];
  room.mapDeadline = 0;
  room.killsSinceChest = 0;
  room.threatLevel = 1;
  room.stageObjective = null;
  room.clearSummary = null;
  room.choiceDeadline = 0;
  room.pausedStatus = null;
  room.paused = false;
  room.pauseStartedAt = 0;
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  room.restartAt = 0;
  room.runStartedAt = Date.now();
  room.runBossDefeats = [];
  room.runDiscoveredMonsters = [];
  room.runDiscoveredBosses = [];
  room.runDefeatedMonsters = [];
  room.runDefeatedBosses = [];
  room.survival = null;
  room.result = null;

  for (const player of room.players.values()) {
    if (player.spectator) {
      resetBotInput(player);
      player.ready = false;
      player.choicePending = false;
      player.choices = [];
      player.pendingSkillChoices = [];
      continue;
    }
    resetPlayerForRun(player, room);
  }

  startSurvivalMode(room);
}

function resetPlayerForRun(player, room) {
  if (!STARTING_CLASSES.has(player.classId)) player.classId = "warrior";
  player.jobTier = 1;
  const def = classes[player.classId];
  player.maxHp = def.maxHp;
  player.hp = def.maxHp;
  player.level = 1;
  player.xp = 0;
  player.score = 0;
  player.relics = [];
  player.skillUpgrades = [];
  player.skillMechanics = {};
  player.pendingSkillChoices = [];
  player.claimedAdvancementLevels = [];
  player.mageMeteorGrowthStacks = 0;
  player.mageFrostBreathTick = 0;
  player.damageMul = 1;
  player.attackPowerBonus = 0;
  player.speedMul = 1;
  player.cooldownMul = 1;
  player.attackSpeed = 0;
  player.skillHaste = 0;
  player.rangeMul = 1;
  player.areaMul = 1;
  player.projectileSpeedMul = 1;
  player.poisonDurationMul = 1;
  player.skillDamageMul = 1;
  player.constructDamageMul = 1;
  player.constructDurationMul = 1;
  player.droneCooldownMul = 1;
  player.tauntRangeMul = 1;
  player.splashBonus = 0;
  player.armor = def.armor || 0;
  player.crit = def.crit ?? 0.03;
  player.critDamageMul = 1;
  player.lifeSteal = 0;
  player.regen = BASE_HEALTH_REGEN + (def.regen ?? 0);
  player.lowHpCritBonus = 0;
  player.missingHpDamageBonus = 0;
  player.eliteBossDamageMul = 1;
  player.bossFinisherMul = 1;
  player.bossFinisherThreshold = 0;
  player.statusDamageMul = 1;
  player.dashCooldownMul = 1;
  player.dashDistanceMul = 1;
  player.dashSpeedTimer = 0;
  player.dashSpeedMul = 1;
  player.onKillHeal = 0;
  player.onKillCooldownRefund = 0;
  player.onKillTeamHeal = 0;
  player.chestDropBonus = 0;
  player.thornsMul = 0;
  player.healingMul = 1;
  player.shieldMul = 1;
  player.clearHealBonus = 0;
  player.projectileCountBonus = 0;
  player.wallBounceBonus = 0;
  player.poisonStackCapBonus = 0;
  player.lowHpShieldRatio = 0;
  player.burnDamageMul = 1;
  player.poisonDamageMul = 1;
  player.turretKillDurationBonus = 0;
  player.cosmeticTitle = "";
  player.cosmeticSkin = "";
  player.appearanceColor = "";
  player.gearAppearance = [];
  player.runStats = createEmptyRunStats();
  player.lowHpShieldUsed = false;
  player.deathSaveCharges = 0;
  player.deathSaveHealRatio = 0;
  player.shield = 0;
  player.shieldTimer = 0;
  player.tauntGuardTimer = 0;
  player.immunityTimer = 0;
  player.hitIFrameTimer = 0;
  player.poisonTimer = 0;
  player.poisonDps = 0;
  player.poisonBaseDps = 0;
  player.poisonStacks = 0;
  player.poisonTickTimer = 0;
  player.poisonOwnerId = null;
  player.choicePending = false;
  player.choices = [];
  player.ready = false;
  if (player.bot) player.botBrain = createBotBrain();
  player.attackTimer = 0;
  player.skillTimers = { q: 0, e: 0, r: 0, f: 0 };
  player.deferredSkillCooldowns = {};
  player.dashTimer = 0;
  resetDashCharges(player);
  player.dashMove = null;
  player.knockbackMove = null;
  player.warriorChargeChainCharges = 0;
  player.warriorChargeChainWindow = 0;
  player.warriorChargeChainCooldown = 0;
  player.warriorChargeSucceeded = false;
  player.engineerMineCharges = 0;
  player.engineerMineChargesInitialized = false;
  player.engineerAutoMineTimer = 0;
  player.engineerAutoMineInitialized = false;
  player.engineerMechaTimer = 0;
  player.rangerPierceKills = 0;
  player.rangerPierceDamageBonus = 0;
  player.lastSkillSeqs = { ...player.input.skillSeqs };
  player.lastDashSeq = player.input.dashSeq;
  player.downedAt = 0;
  player.lastDashAt = 0;
  player.attackSwingSide = 1;
  player.comboCounter = 0;
  player.comboTimer = 0;
  player.martialChi = 0;
  player.martialChiTimer = 0;
  player.martialFlowTimer = 0;
  player.stealthTimer = 0;
  player.inputGraceUntil = 0;
  applyPlayerGrowthBonuses(player, room);

  const angle = nextRoomRandom(room) * Math.PI * 2;
  player.x = room.world.w / 2 + Math.cos(angle) * 80;
  player.y = room.world.h / 2 + Math.sin(angle) * 80;
}

function configurePlayerForLobbyTest(player, room, classId) {
  const keepX = Number.isFinite(player.x) ? player.x : null;
  const keepY = Number.isFinite(player.y) ? player.y : null;
  const keepInput = player.input ? {
    aimX: player.input.aimX,
    aimY: player.input.aimY,
    mx: player.input.mx,
    my: player.input.my,
    attacking: player.input.attacking,
    skillSeqs: { ...player.input.skillSeqs },
    dashSeq: player.input.dashSeq
  } : null;
  player.classId = sanitizeStartingClass(classId);
  ensureLobbyTestLoadout(player, player.classId);
  resetPlayerForRun(player, room);

  if (keepX !== null && keepY !== null) {
    player.x = clamp(keepX, 42, room.world.w - 42);
    player.y = clamp(keepY, 42, room.world.h - 42);
  }
  if (keepInput) {
    player.input = {
      ...player.input,
      ...keepInput,
      aimX: clamp(keepInput.aimX, 0, room.world.w),
      aimY: clamp(keepInput.aimY, 0, room.world.h)
    };
  }

  player.level = MAX_PLAYER_LEVEL;
  player.xp = 0;
  player.score = 0;
  player.claimedAdvancementLevels = [...ADVANCEMENT_LEVELS];
  player.jobTier = 4;
  player.skillUpgrades = [];
  player.skillMechanics = {};
  const selectedSkills = new Set(player.lobbyTestSkillIds || []);
  for (const upgrade of skillUpgrades[player.classId] || []) {
    if (!selectedSkills.has(upgrade.id)) continue;
    player.skillUpgrades.push(upgrade.id);
    applySkillUpgrade(player, upgrade.id);
  }
  applyLobbyRelicLevels(player);
  player.hp = player.maxHp;
  player.shield = 0;
  player.skillTimers = { q: 0, e: 0, r: 0, f: 0 };
  player.deferredSkillCooldowns = {};
  player.dashTimer = 0;
  resetDashCharges(player);
  player.ready = false;
}

function getDefaultLobbySkillIds(classId) {
  return (skillUpgrades[classId] || [])
    .filter((upgrade) => upgrade && !DISABLED_SKILL_UPGRADES.has(upgrade.id))
    .map((upgrade) => upgrade.id);
}

function isLobbyBaseSkillUpgrade(upgrade) {
  return Boolean(upgrade && upgrade.slot);
}

function isLobbyToggleableSkillUpgrade(upgrade) {
  return Boolean(upgrade && !upgrade.slot && Array.isArray(upgrade.requires) && upgrade.requires.length > 0);
}

function getLobbySkillRootUpgrade(player, classId, upgradeId, visited = new Set()) {
  if (!upgradeId || visited.has(upgradeId)) return null;
  if (upgradeId === `${classId}_primary`) {
    return getPrimarySkillDefinition({ ...player, classId });
  }
  visited.add(upgradeId);
  const upgrade = getSkillUpgradeByIdForClass(classId, upgradeId);
  if (!upgrade) return null;
  if (upgrade.slot) return getEquipmentAdjustedSkillView(player, upgrade);
  for (const requiredId of upgrade.requires || []) {
    const root = getLobbySkillRootUpgrade(player, classId, requiredId, visited);
    if (root) return root;
  }
  return null;
}

function getLobbyBaseSkillViews(player) {
  const classId = sanitizeStartingClass(player.classId);
  const baseBySlot = new Map(
    (skillUpgrades[classId] || [])
      .filter((upgrade) => upgrade && !DISABLED_SKILL_UPGRADES.has(upgrade.id) && isLobbyBaseSkillUpgrade(upgrade))
      .map((upgrade) => [upgrade.slot, upgrade])
  );

  return SKILL_SLOTS.map((slot) => {
    if (slot === "q") {
      return {
        ...getPrimarySkillDefinition(player),
        fixed: true
      };
    }
    const upgrade = baseBySlot.get(slot);
    return getEquipmentAdjustedSkillView(player, {
      id: upgrade?.id || `${classId}_${slot}_skill`,
      slot,
      name: upgrade?.name || `${slot.toUpperCase()} Skill`,
      text: upgrade?.text || "",
      fixed: true
    });
  });
}

function getLobbyBaseSkillIds(classId) {
  return (skillUpgrades[classId] || [])
    .filter((upgrade) => upgrade && !DISABLED_SKILL_UPGRADES.has(upgrade.id) && isLobbyBaseSkillUpgrade(upgrade))
    .map((upgrade) => upgrade.id);
}

function ensureLobbyBaseSkillIds(classId, ids) {
  const selectedIds = new Set(ids || []);
  for (const baseId of getLobbyBaseSkillIds(classId)) {
    selectedIds.add(baseId);
  }
  return selectedIds;
}

function ensureLobbyTestLoadout(player, classId) {
  const sanitizedClassId = sanitizeStartingClass(classId);
  const validIds = new Set(getDefaultLobbySkillIds(sanitizedClassId));
  const classChanged = player.lobbyTestClassId !== sanitizedClassId;
  player.lobbyTestClassId = sanitizedClassId;
  if (classChanged || !Array.isArray(player.lobbyTestSkillIds)) {
    player.lobbyTestSkillIds = sortLobbySkillIds(sanitizedClassId, validIds);
  } else {
    const selectedIds = ensureLobbyBaseSkillIds(
      sanitizedClassId,
      player.lobbyTestSkillIds.filter((id) => validIds.has(id))
    );
    player.lobbyTestSkillIds = sortLobbySkillIds(sanitizedClassId, selectedIds);
  }

  if (!player.lobbyTestRelicLevels || typeof player.lobbyTestRelicLevels !== "object" || Array.isArray(player.lobbyTestRelicLevels)) {
    player.lobbyTestRelicLevels = {};
  }
  for (const relicId of Object.keys(player.lobbyTestRelicLevels)) {
    const relic = getRewardById(relicId);
    if (!relic || relic.consumable || !isRelicAvailableForPlayer(relic, { ...player, classId: sanitizedClassId })) {
      delete player.lobbyTestRelicLevels[relicId];
      continue;
    }
    const level = clamp(Math.round(Number(player.lobbyTestRelicLevels[relicId]) || 0), 0, getRelicMaxLevel(relic));
    if (level <= 0) {
      delete player.lobbyTestRelicLevels[relicId];
    } else {
      player.lobbyTestRelicLevels[relicId] = level;
    }
  }
}

function applyLobbyRelicLevels(player) {
  const levels = player.lobbyTestRelicLevels || {};
  for (const relic of relics) {
    if (!isRelicAvailableForPlayer(relic, player)) continue;
    const level = clamp(Math.round(Number(levels[relic.id]) || 0), 0, getRelicMaxLevel(relic));
    for (let stack = 0; stack < level; stack += 1) {
      applyRelicChoice(player, { id: relic.id });
    }
  }
}

function getSkillUpgradeByIdForClass(classId, upgradeId) {
  return (skillUpgrades[classId] || []).find((upgrade) => upgrade.id === upgradeId) || null;
}

function addSkillWithRequirements(classId, upgradeId, selectedIds) {
  const upgrade = getSkillUpgradeByIdForClass(classId, upgradeId);
  if (!upgrade || DISABLED_SKILL_UPGRADES.has(upgrade.id)) return;
  for (const requiredId of upgrade.requires || []) {
    addSkillWithRequirements(classId, requiredId, selectedIds);
  }
  selectedIds.add(upgrade.id);
}

function removeSkillWithDependents(classId, upgradeId, selectedIds) {
  selectedIds.delete(upgradeId);
  for (const upgrade of skillUpgrades[classId] || []) {
    if ((upgrade.requires || []).includes(upgradeId)) {
      removeSkillWithDependents(classId, upgrade.id, selectedIds);
    }
  }
}

function sortLobbySkillIds(classId, ids) {
  const selected = new Set(ids);
  return (skillUpgrades[classId] || []).filter((upgrade) => selected.has(upgrade.id)).map((upgrade) => upgrade.id);
}

function setLobbySkillUpgrade(room, player, upgradeId, enabled) {
  if (room.status !== "lobby" || player.spectator) return;
  const classId = sanitizeStartingClass(player.classId);
  ensureLobbyTestLoadout(player, classId);
  const upgrade = getSkillUpgradeByIdForClass(classId, upgradeId);
  if (!upgrade || DISABLED_SKILL_UPGRADES.has(upgrade.id) || !isLobbyToggleableSkillUpgrade(upgrade)) return;
  const selectedIds = ensureLobbyBaseSkillIds(classId, player.lobbyTestSkillIds || []);
  if (enabled) {
    addSkillWithRequirements(classId, upgrade.id, selectedIds);
  } else {
    removeSkillWithDependents(classId, upgrade.id, selectedIds);
  }
  player.lobbyTestSkillIds = sortLobbySkillIds(classId, ensureLobbyBaseSkillIds(classId, selectedIds));
  configurePlayerForLobbyTest(player, room, classId);
  pushEvent(room, `${player.name} lobby skill test updated.`);
}

function setLobbyRelicLevel(room, player, relicId, level) {
  if (room.status !== "lobby" || player.spectator) return;
  const classId = sanitizeStartingClass(player.classId);
  ensureLobbyTestLoadout(player, classId);
  const relic = getRewardById(relicId);
  if (!relic || relic.consumable || !isRelicAvailableForPlayer(relic, player)) return;
  const nextLevel = clamp(Math.round(Number(level) || 0), 0, getRelicMaxLevel(relic));
  if (nextLevel <= 0) {
    delete player.lobbyTestRelicLevels[relic.id];
  } else {
    player.lobbyTestRelicLevels[relic.id] = nextLevel;
  }
  configurePlayerForLobbyTest(player, room, classId);
  pushEvent(room, `${player.name} lobby relic test updated.`);
}

function resetLobbyTestLoadout(room, player) {
  if (room.status !== "lobby" || player.spectator) return;
  const classId = sanitizeStartingClass(player.classId);
  player.lobbyTestClassId = classId;
  player.lobbyTestSkillIds = getDefaultLobbySkillIds(classId);
  player.lobbyTestRelicLevels = {};
  configurePlayerForLobbyTest(player, room, classId);
  pushEvent(room, `${player.name} lobby test loadout reset.`);
}

function getLobbyTestView(player) {
  const classId = sanitizeStartingClass(player.classId);
  ensureLobbyTestLoadout(player, classId);
  const enabledSkills = new Set(player.skillUpgrades || []);
  const skillItems = (skillUpgrades[classId] || [])
    .filter((upgrade) => !DISABLED_SKILL_UPGRADES.has(upgrade.id) && isLobbyToggleableSkillUpgrade(upgrade))
    .map((upgrade) => {
      const adjusted = getEquipmentAdjustedSkillView(player, upgrade);
      const root = getLobbySkillRootUpgrade(player, classId, upgrade.id);
      return {
        id: upgrade.id,
        name: adjusted.name,
        text: adjusted.text,
        equipmentModified: Boolean(adjusted.equipmentModified),
        equipmentLabel: adjusted.equipmentLabel || "",
        slot: "",
        baseSlot: root?.slot || "",
        baseSkillId: root?.id || "",
        baseSkillName: root?.name || "",
        minLevel: upgrade.minLevel || 1,
        requires: upgrade.requires || [],
        icon: getSkillIcon(upgrade.id),
        enabled: enabledSkills.has(upgrade.id)
      };
    });
  const relicItems = relics
    .filter((relic) => isRelicAvailableForPlayer(relic, player))
    .map((relic) => {
      const owned = getOwnedRelic(player, relic.id);
      const level = owned ? owned.level || 1 : clamp(Math.round(Number(player.lobbyTestRelicLevels?.[relic.id]) || 0), 0, getRelicMaxLevel(relic));
      return relicView(relic, level, { upgrading: level > 0 });
    });

  return {
    baseSkills: getLobbyBaseSkillViews(player),
    skills: skillItems,
    relics: relicItems
  };
}

function ensureLobbyTrainingArena(room) {
  const anchors = [
    { x: room.world.w * 0.47, y: room.world.h * 0.35 },
    { x: room.world.w * 0.58, y: room.world.h * 0.5 },
    { x: room.world.w * 0.47, y: room.world.h * 0.65 }
  ];
  room.enemies = room.enemies.filter((enemy) => enemy.trainingDummy);

  for (let i = room.enemies.length; i < anchors.length; i += 1) {
    room.enemies.push(createTrainingDummy(room, i, anchors[i]));
  }

  room.enemies.forEach((dummy, index) => {
    const anchor = anchors[index % anchors.length];
    dummy.label = `훈련 표적 ${index + 1}`;
    dummy.role = "dummy";
    dummy.trainingDummy = true;
    dummy.homeX = anchor.x;
    dummy.homeY = anchor.y;
    dummy.damage = 0;
    dummy.xp = 0;
    dummy.elite = false;
    dummy.affix = "";
    if (dummy.hp <= 0 || !Number.isFinite(dummy.hp)) dummy.hp = dummy.maxHp;
    if (dummy.maxHp <= 0) dummy.maxHp = enemyDefs.training_dummy.hp;
    if (!Number.isFinite(dummy.x) || !Number.isFinite(dummy.y)) {
      dummy.x = anchor.x;
      dummy.y = anchor.y;
    }
  });
}

function createTrainingDummy(room, index, anchor) {
  const def = enemyDefs.training_dummy;
  return {
    id: nextEnemyId++,
    type: "training_dummy",
    label: `훈련 표적 ${index + 1}`,
    color: def.color,
    bossId: "",
    bossPattern: "",
    bossPhase: 0,
    x: anchor.x,
    y: anchor.y,
    homeX: anchor.x,
    homeY: anchor.y,
    hp: def.hp,
    maxHp: def.hp,
    speed: 0,
    damage: 0,
    radius: def.radius,
    role: "dummy",
    elite: false,
    affix: "",
    trainingDummy: true,
    orbitDir: 1,
    aiPhase: 0,
    attackTimer: 0,
    shotTimer: 0,
    healTimer: 0,
    chargeTimer: 0,
    specialTimer: 0,
    cadenceMul: 1,
    windup: null,
    chargeMove: null,
    knockbackMove: null,
    slowTimer: 0,
    freezeTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    poisonTickTimer: 0,
    poisonDisplayDamage: 0,
    poisonDotStacks: 0,
    poisonOwnerId: null,
    venomTimer: 0,
    venomDps: 0,
    venomTickTimer: 0,
    venomDisplayDamage: 0,
    venomOwnerId: null,
    shamanHealLockUntil: 0,
    burnTimer: 0,
    burnDps: 0,
    burnTickTimer: 0,
    burnDisplayDamage: 0,
    burnOwnerId: null,
    vulnerableTimer: 0,
    weakenTimer: 0,
    tauntTimer: 0,
    tauntTargetId: null,
    dummyReturnCooldown: 0,
    trainingDamageTotal: 0,
    trainingDamageSamples: [],
    trainingLastHitAt: 0,
    xp: 0
  };
}

function startSurvivalMode(room) {
  const now = Date.now();
  room.status = "combat";
  room.floor = 1;
  room.wave = 1;
  room.stageIndex = 0;
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapPath = [];
  room.mapDeadline = 0;
  room.choiceDeadline = 0;
  room.clearSummary = null;
  room.activeRisk = risks[0];
  room.survival = {
    active: true,
    elapsed: 0,
    duration: SURVIVAL_DURATION_SEC,
    checkpointIndex: 0,
    bossActive: false,
    bossEnemyId: null,
    bossIntro: null,
    minibossScheduleIndex: 0,
    rewardCheckpointPending: 0,
    nextSpawnAt: now + 650,
    finalBossMaxHp: 0,
    finalBossDefeated: false,
    completed: false,
    completedAbyssDepths: 0,
    executionSpawnAt: 0,
    executionSpawnPoint: null,
    executionBossActive: false,
    executionBossId: null,
    secretVictory: false
  };
  setSurvivalCombatNode(room);
  room.stageObjective = {
    type: "survival",
    label: "9 MIN SURVIVAL",
    text: "3분마다 보스를 처치하고 9분을 버티세요."
  };
  regroupPartyForStage(room);
  ensureRoomMapWalls(room);
  spawnSurvivalEnemies(room, now, true);
  pushEvent(room, "9분 생존 시작. 3분마다 보스가 등장합니다.");
}

function setSurvivalCombatNode(room) {
  const depth = clamp(Math.max(1, room.wave || 1), 1, MAP_DEPTH);
  room.activeMapNode = {
    id: `survival-c${room.floor}-m${room.wave}`,
    floor: room.floor,
    depth,
    lane: 1,
    kind: "combat",
    resolvedKind: "combat",
    modifierId: "safe_path",
    bossId: ""
  };
  room.currentMapNodeId = room.activeMapNode.id;
}

function updateSurvivalMode(room, dt, now) {
  const survival = room.survival;
  if (!survival?.active || room.status !== "combat") return;

  if (survival.finalBossDefeated) {
    if (survival.executionBossActive) {
      const executionBoss = room.enemies.find((enemy) => enemy.id === survival.executionBossId && enemy.hp > 0);
      if (!executionBoss) {
        survival.executionBossActive = false;
        survival.secretVictory = true;
        survival.active = false;
        survival.completed = true;
        enterAbyssDecision(room);
      }
      return;
    }
    if (survival.executionSpawnAt && now >= survival.executionSpawnAt) spawnSurvivalExecutionBoss(room);
    return;
  }

  if (survival.bossIntro) {
    updateSurvivalBossIntro(room, now);
    return;
  }

  if (survival.bossActive) {
    const boss = room.enemies.find((enemy) => enemy.id === survival.bossEnemyId && enemy.hp > 0);
    if (!boss) finishSurvivalCheckpointBoss(room, now);
    return;
  }

  survival.elapsed = Math.min(SURVIVAL_DURATION_SEC, survival.elapsed + dt);
  room.wave = clamp(Math.floor(survival.elapsed / 60) + 1, 1, 9);
  setSurvivalCombatNode(room);
  room.threatLevel = round2(1 + (survival.elapsed / SURVIVAL_DURATION_SEC) * 1.35);

  const checkpointTime = SURVIVAL_BOSS_CHECKPOINTS[survival.checkpointIndex];
  if (Number.isFinite(checkpointTime) && survival.elapsed >= checkpointTime) {
    spawnSurvivalCheckpointBoss(room, survival.checkpointIndex + 1);
    return;
  }

  spawnScheduledSurvivalMiniBosses(room);
  spawnSurvivalEnemies(room, now, false);
}

function spawnSurvivalEnemies(room, now, force = false) {
  const survival = room.survival;
  if (!survival?.active || survival.bossActive || survival.bossIntro || survival.finalBossDefeated) return;
  if (!force && now < survival.nextSpawnAt) return;

  const elapsedRatio = clamp(survival.elapsed / SURVIVAL_DURATION_SEC, 0, 1);
  const minute = survival.elapsed / 60;
  const players = Math.max(1, getActivePlayers(room).length);
  const solo = players === 1;
  const alive = room.enemies.filter((enemy) => enemy.hp > 0 && !enemy.trainingDummy).length;
  const ascensionDifficulty = getAbyssDifficulty(room);
  const baseMaxAlive = (solo ? 26 + minute * 3.6 : 32 + minute * 5) + (players - 1) * 9;
  const maxAlive = Math.round(baseMaxAlive * ascensionDifficulty.spawnMul);
  const multiplayerBatchGrowth = [120, 390, 450, 510]
    .reduce((growth, threshold) => growth + (survival.elapsed >= threshold ? 1 : 0), 0);
  const baseBatchTarget = force
    ? solo
      ? 4
      : 5 + players
    : solo
      ? 2 + Math.floor(survival.elapsed / 180)
      : 2 + multiplayerBatchGrowth + (players >= 3 ? 1 : 0);
  const batchTarget = Math.ceil(baseBatchTarget * Math.min(1.5, 0.75 + ascensionDifficulty.spawnMul * 0.25));
  const batchSize = Math.min(maxAlive - alive, batchTarget);
  const baseInterval = solo ? 1.02 - elapsedRatio * 0.46 : 0.92 - elapsedRatio * 0.52;
  const interval = baseInterval / Math.min(1.35, ascensionDifficulty.spawnMul);
  survival.nextSpawnAt = now + Math.round(Math.max(0.4, interval) * 1000);
  if (batchSize <= 0) return;

  const rawEliteChance = survival.elapsed < 180
    ? ascensionDifficulty.eliteBonus * 0.5
    : 0.035 + ((survival.elapsed - 180) / 360) * 0.2 + ascensionDifficulty.eliteBonus;
  const eliteChance = Math.min(solo ? 0.48 : 0.58, rawEliteChance * (solo ? 0.8 : 1));
  for (let index = 0; index < batchSize; index += 1) {
    const type = pickEnemyType(room.wave, () => nextRoomRandom(room));
    const elite = nextRoomRandom(room) < eliteChance && alive + index >= 6;
    spawnEnemy(room, type, { elite });
  }
}

function spawnScheduledSurvivalMiniBosses(room) {
  const survival = room.survival;
  if (!survival?.active || survival.bossActive || survival.bossIntro || survival.finalBossDefeated) return;

  while (survival.minibossScheduleIndex < SURVIVAL_MINIBOSS_SCHEDULE.length) {
    const schedule = SURVIVAL_MINIBOSS_SCHEDULE[survival.minibossScheduleIndex];
    if (survival.elapsed < schedule.minute * 60) return;
    survival.minibossScheduleIndex += 1;
    spawnSurvivalMiniBossWave(room, schedule.minute, schedule.count);
  }
}

function spawnSurvivalMiniBossWave(room, minute, count) {
  const total = 1;
  const centerX = room.world.w * 0.5;
  const centerY = room.world.h * 0.5;
  const ring = Math.min(330, Math.max(220, Math.min(room.world.w, room.world.h) * 0.28));
  let spawned = 0;

  for (let index = 0; index < total; index += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total + minute * 0.31;
    const boss = spawnMiniBoss(room, {
      survival: true,
      minute,
      index,
      count: total,
      x: centerX + Math.cos(angle) * ring,
      y: centerY + Math.sin(angle) * ring
    });
    if (boss) spawned += 1;
  }

  if (spawned > 0) pushEvent(room, `${minute}분 생존 미니보스 ${spawned}마리 등장. 각 미니보스는 유물을 확정 드롭합니다.`);
}

function clearSurvivalRegularEnemiesForBoss(room) {
  const survivingMiniBosses = room.enemies.filter((enemy) => enemy.hp > 0 && enemy.miniBoss);
  room.enemies = survivingMiniBosses;
  room.projectiles = [];
  room.hazards = [];
  room.pendingReinforcements = [];
  return survivingMiniBosses.length;
}

function spawnSurvivalCheckpointBoss(room, checkpoint) {
  const survival = room.survival;
  if (!survival?.active || survival.bossActive || survival.bossIntro) return;
  room.floor = clamp(checkpoint, 1, MAX_CHAPTERS);
  room.wave = checkpoint * 3;
  const profile = room.challengeMode === "weekly" && checkpoint === SURVIVAL_BOSS_CHECKPOINTS.length
    ? getBossProfileById(room.weeklyBossId) || getChapterBossProfile(room.floor)
    : getChapterBossProfile(room.floor);
  const now = Date.now();
  const spawnPoint = getSurvivalBossSpawnPoint(room);
  const enemyIds = room.enemies
    .filter((enemy) => enemy.hp > 0 && !enemy.miniBoss)
    .sort((left, right) => distance(right, spawnPoint) - distance(left, spawnPoint))
    .map((enemy) => enemy.id);
  const miniBossCount = room.enemies.filter((enemy) => enemy.hp > 0 && enemy.miniBoss).length;

  room.projectiles = [];
  room.hazards = [];
  room.pendingReinforcements = [];
  room.activeMapNode = {
    id: `survival-boss-${checkpoint}`,
    floor: room.floor,
    depth: clamp(room.wave, 1, MAP_DEPTH),
    lane: 1,
    kind: "boss",
    resolvedKind: "boss",
    modifierId: "safe_path",
    bossId: profile.id
  };
  room.currentMapNodeId = room.activeMapNode.id;
  survival.bossEnemyId = null;
  survival.bossIntro = {
    checkpoint,
    profileId: profile.id,
    profileName: profile.name,
    color: profile.color,
    startedAt: now,
    spawnAt: now + SURVIVAL_BOSS_INTRO_DELAY_MS,
    x: spawnPoint.x,
    y: spawnPoint.y,
    enemyIds,
    dissolveCursor: 0,
    miniBossCount
  };

  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    enemy.bossArrivalStasisUntil = survival.bossIntro.spawnAt;
    enemy.windup = null;
    enemy.chargeMove = null;
  }

  room.stageObjective = {
    type: "survival_boss_intro",
    label: checkpoint === 3 ? "FINAL BOSS APPROACHING" : `${checkpoint * 3} MIN BOSS APPROACHING`,
    text: "전장의 적들이 소환 의식에 흡수되고 있습니다."
  };
  addBossArrivalOmen(room, spawnPoint.x, spawnPoint.y, profile.color, SURVIVAL_BOSS_INTRO_DELAY_MS / 1000, "boss_arrival_omen");
  pushEvent(room, `${checkpoint * 3}분 보스의 기척이 전장을 뒤덮습니다.`);
}

function getSurvivalBossSpawnPoint(room) {
  return {
    x: room.world.w / 2,
    y: Math.max(150, room.world.h / 2 - 300)
  };
}

function addBossArrivalOmen(room, x, y, color, duration, style) {
  addEffect(room, "warning", x, y, {
    color,
    radius: 220,
    style,
    duration
  });
  addEffect(room, "arcane", x, y, {
    color,
    radius: 180,
    style: `${style}_ritual`,
    duration
  });
}

function updateSurvivalBossIntro(room, now) {
  const survival = room.survival;
  const intro = survival?.bossIntro;
  if (!intro) return;

  const dissolveStart = intro.startedAt + SURVIVAL_BOSS_DISSOLVE_START_MS;
  const dissolveEnd = intro.spawnAt - SURVIVAL_BOSS_DISSOLVE_END_LEAD_MS;
  const dissolveProgress = clamp((now - dissolveStart) / Math.max(1, dissolveEnd - dissolveStart), 0, 1);
  const targetCursor = Math.ceil(intro.enemyIds.length * dissolveProgress);

  while (intro.dissolveCursor < targetCursor) {
    const sequence = intro.dissolveCursor;
    const enemyId = intro.enemyIds[intro.dissolveCursor++];
    const enemy = room.enemies.find((candidate) => candidate.id === enemyId && candidate.hp > 0 && !candidate.miniBoss);
    if (!enemy) continue;

    enemy.hp = 0;
    enemy.windup = null;
    enemy.chargeMove = null;
    addEffect(room, "death", enemy.x, enemy.y, {
      color: intro.color,
      radius: enemy.radius + 34,
      style: "boss_arrival_sacrifice",
      duration: 0.58
    });
    if (sequence % 3 === 0) {
      addEffect(room, "dash", (enemy.x + intro.x) / 2, (enemy.y + intro.y) / 2, {
        color: intro.color,
        fromX: round2(enemy.x),
        fromY: round2(enemy.y),
        toX: round2(intro.x),
        toY: round2(intro.y),
        radius: 120,
        style: "boss_arrival_soul_pull",
        duration: 0.5
      });
    }
  }

  if (now < intro.spawnAt) return;
  manifestSurvivalCheckpointBoss(room, intro);
}

function manifestSurvivalCheckpointBoss(room, intro) {
  const survival = room.survival;
  if (!survival?.active || !intro) return;
  const profile = getBossProfileById(intro.profileId) || getChapterBossProfile(room.floor);
  const survivingMiniBosses = clearSurvivalRegularEnemiesForBoss(room);
  survival.bossIntro = null;
  survival.bossActive = true;
  survival.bossEnemyId = null;

  spawnChapterBoss(room);
  const boss = [...room.enemies].reverse().find((enemy) => enemy.type === "boss" && !enemy.miniBoss && enemy.hp > 0);
  if (!boss) {
    survival.bossActive = false;
    return;
  }
  boss.survivalCheckpoint = intro.checkpoint;
  boss.phaseTransitionTimer = Math.max(boss.phaseTransitionTimer || 0, 1.05);
  boss.phaseTransitionTimerMax = Math.max(boss.phaseTransitionTimerMax || 0, 1.05);
  survival.bossEnemyId = boss.id;
  if (intro.checkpoint === SURVIVAL_BOSS_CHECKPOINTS.length) survival.finalBossMaxHp = boss.maxHp;
  room.stageObjective = {
    type: "survival_boss",
    label: intro.checkpoint === 3 ? "9 MIN FINAL BOSS" : `${intro.checkpoint * 3} MIN BOSS`,
    text: `${profile.name}을 처치해야 생존 시간이 다시 흐릅니다.`,
    targetId: boss.id
  };
  addEffect(room, "explosion", boss.x, boss.y, {
    color: profile.color,
    radius: boss.radius + 190,
    style: "boss_arrival_manifest",
    duration: 0.92
  });
  addEffect(room, "arcane", boss.x, boss.y, {
    color: profile.color,
    radius: boss.radius + 130,
    style: "boss_arrival_manifest",
    duration: 1.15
  });
  pushEvent(
    room,
    `${intro.checkpoint * 3}분 보스 ${profile.name} 등장. 생존 시간이 정지됩니다.${
      survivingMiniBosses > 0 ? ` 생존 미니보스 ${survivingMiniBosses}마리는 전투에 남습니다.` : ""
    }`
  );
}

function finishSurvivalCheckpointBoss(room, now) {
  const survival = room.survival;
  if (!survival?.active || !survival.bossActive) return;
  const checkpoint = survival.checkpointIndex + 1;
  survival.bossActive = false;
  survival.bossEnemyId = null;
  survival.checkpointIndex = checkpoint;
  room.projectiles = [];
  room.hazards = [];
  room.pendingReinforcements = [];

  if (checkpoint >= SURVIVAL_BOSS_CHECKPOINTS.length) {
    room.enemies = [];
    survival.finalBossDefeated = true;
    survival.executionSpawnAt = now + SURVIVAL_EXECUTION_SPAWN_DELAY_MS;
    survival.executionSpawnPoint = getSurvivalBossSpawnPoint(room);
    preparePartyForExecutionBoss(room);
    room.stageObjective = {
      type: "execution",
      label: "SURVIVAL COMPLETE",
      text: "무언가가 전장으로 다가오고 있습니다."
    };
    addBossArrivalOmen(
      room,
      survival.executionSpawnPoint.x,
      survival.executionSpawnPoint.y,
      EXECUTION_BOSS_PROFILE.color,
      SURVIVAL_EXECUTION_SPAWN_DELAY_MS / 1000,
      "boss_arrival_execution"
    );
    pushEvent(room, "9분 생존 성공. 그러나 전투는 아직 끝나지 않았습니다.");
    return;
  }

  room.enemies = room.enemies.filter((enemy) => enemy.hp > 0 && enemy.miniBoss);

  room.floor = checkpoint + 1;
  healPartyAfterSurvivalBoss(room);
  setSurvivalCombatNode(room);
  survival.rewardCheckpointPending = checkpoint;
  room.status = "choice";
  room.choiceDeadline = now + RELIC_CHOICE_TIMEOUT_MS;
  room.clearSummary = {
    chapter: checkpoint,
    stage: checkpoint * 3,
    xpOrbs: 0,
    xpTotal: 0,
    stageXp: 0,
    rewardChests: 1,
    chests: 1,
    relicChoice: true,
    reward: { label: `${checkpoint * 3}분 보스 보상`, chestBonus: 0 },
    createdAt: now
  };
  rewardSystem.beginRelicChoiceForPlayers(getActivePlayers(room), (player) => pickRelics(room, player));
  pushEvent(room, `${checkpoint * 3}분 보스 처치. 유물을 선택한 뒤 다음 구간으로 진입합니다.`);
}

function healPartyAfterSurvivalBoss(room) {
  const solo = getActivePlayers(room).length === 1;
  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) {
      player.hp = Math.max(1, Math.floor(player.maxHp * 0.35));
      player.downedAt = 0;
    }
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * (solo ? 0.42 : 0.3) * (player.healingMul || 1));
    clearPlayerPoison(player);
  }
}

function resumeSurvivalAfterCheckpointReward(room) {
  const survival = room.survival;
  if (!survival?.active || !survival.rewardCheckpointPending) return false;
  survival.rewardCheckpointPending = 0;
  survival.nextSpawnAt = Date.now() + 700;
  room.status = "combat";
  room.clearSummary = null;
  room.stageObjective = {
    type: "survival",
    label: "9 MIN SURVIVAL",
    text: "다음 보스 체크포인트까지 버티세요."
  };
  setSurvivalCombatNode(room);
  pushEvent(room, `${room.floor}챕터 생존 구간이 시작됩니다.`);
  return true;
}

function preparePartyForExecutionBoss(room) {
  for (const player of getActivePlayers(room)) {
    player.hp = player.maxHp;
    player.downedAt = 0;
    player.shield = Math.max(player.shield || 0, Math.round(player.maxHp * 0.25));
    player.shieldTimer = Math.max(player.shieldTimer || 0, 5);
    player.immunityTimer = Math.max(player.immunityTimer || 0, SURVIVAL_EXECUTION_SPAWN_DELAY_MS / 1000);
    player.attackTimer = 0;
    for (const slot of SKILL_SLOTS) player.skillTimers[slot] = 0;
    resetDashCharges(player);
    clearPlayerPoison(player);
  }
}

function spawnSurvivalExecutionBoss(room) {
  const survival = room.survival;
  if (!survival?.active || !survival.finalBossDefeated || survival.executionBossActive) return;
  survival.executionSpawnAt = 0;
  room.floor = MAX_CHAPTERS;
  room.wave = 9;
  room.projectiles = [];
  room.hazards = [];
  const profile = getChapterBossProfile(MAX_CHAPTERS);
  const spawnPoint = survival.executionSpawnPoint || getSurvivalBossSpawnPoint(room);
  survival.executionSpawnPoint = null;
  room.activeMapNode = {
    id: "survival-execution-boss",
    floor: MAX_CHAPTERS,
    depth: MAP_DEPTH,
    lane: 1,
    kind: "boss",
    resolvedKind: "boss",
    modifierId: "safe_path",
    bossId: profile.id
  };
  room.currentMapNodeId = room.activeMapNode.id;
  const boss = spawnEnemy(room, "boss", {
    bossId: profile.id,
    x: spawnPoint.x,
    y: spawnPoint.y,
    scale: 1.18
  });
  if (!boss) return;

  const partyMaxHp = Math.max(...getActivePlayers(room).map((player) => player.maxHp || 1), 1);
  boss.executionBoss = true;
  boss.bossId = EXECUTION_BOSS_PROFILE.id;
  boss.bossPattern = EXECUTION_BOSS_PROFILE.pattern;
  boss.patternMix = EXECUTION_BOSS_PROFILE.patternMix;
  boss.label = EXECUTION_BOSS_PROFILE.name;
  boss.color = EXECUTION_BOSS_PROFILE.color;
  boss.phaseAuraColor = "#f87171";
  boss.maxHp = Math.max(
    Math.round(Math.max(1, survival.finalBossMaxHp) * SURVIVAL_EXECUTION_BOSS_HP_MUL),
    Math.round(boss.maxHp * 12)
  );
  boss.hp = boss.maxHp;
  boss.damage = Math.max(Math.round(boss.damage * 2.4), Math.round(partyMaxHp * 0.62));
  boss.speed *= 1.38;
  boss.radius = Math.round(boss.radius * 1.14);
  boss.cadenceMul = Math.max(0.62, (boss.cadenceMul || 1) * 0.66);
  boss.bossPhase = 1;
  boss.phaseTitle = EXECUTION_BOSS_PROFILE.phaseTitles[0];
  boss.executionPatternTimer = 1.15;
  boss.bossPatternCursor = 0;
  boss.specialTimer = 1.8;
  boss.chargeTimer = 1.6;
  boss.shotTimer = 1.45;
  boss.barrier = Math.round(boss.maxHp * 0.08);
  boss.barrierTimer = 8;
  survival.executionBossActive = true;
  survival.executionBossId = boss.id;
  room.stageObjective = {
    type: "execution",
    label: "FATE EXECUTION",
    text: "살아남으면 클리어, 쓰러뜨리면 히든 클리어입니다.",
    targetId: boss.id
  };
  addEffect(room, "warning", boss.x, boss.y, {
    color: boss.color,
    radius: boss.radius + 180,
    style: "execution_boss_spawn",
    duration: 1.8
  });
  addEffect(room, "explosion", boss.x, boss.y, {
    color: boss.color,
    radius: boss.radius + 230,
    style: "boss_arrival_execution_manifest",
    duration: 1.05
  });
  addEffect(room, "arcane", boss.x, boss.y, {
    color: boss.color,
    radius: boss.radius + 160,
    style: "boss_arrival_execution_manifest",
    duration: 1.35
  });
  pushEvent(room, "운명의 집행자 등장. 이 전투에서 죽어도 생존 성공으로 기록됩니다.");
}

function spawnWave(room) {
  room.status = "combat";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  room.choiceDeadline = 0;
  room.clearSummary = null;
  room.stageObjective = null;
  room.pausedStatus = null;
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  ensureRoomMapWalls(room);

  const partyDifficulty = getPartyDifficulty(room);
  const stageDifficulty = getStageDifficulty(room);
  const risk = room.activeRisk || risks[0];
  const abyssDifficulty = getAbyssDifficulty(room);
  const threat = getWaveThreatLevel(room, risk);
  room.threatLevel = threat;
  const nodeKind = getActiveStageKind(room);
  const chapter = Math.max(1, room.floor || 1);
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const chapterDifficulty = getChapterDifficulty(room);
  const stagePressureMul = getChapterStagePressureMul(room);
  const countPressure = clamp(threat * 0.6 * stagePressureMul * abyssDifficulty.threatMul, stageDifficulty.pressureMin, 1.75);
  const riskSpawnMul = 1 + ((risk.spawnMul || 1) - 1) * stageDifficulty.riskMul;
  const baseCount = Math.ceil(
    (6.5 + room.wave * 0.78 + depth * 1.55 + chapter) *
      partyDifficulty.spawnMul *
      riskSpawnMul *
      chapterDifficulty.spawnMul *
      abyssDifficulty.spawnMul *
      countPressure *
      stageDifficulty.countMul *
      (nodeKind === "boss" ? 0.72 : 1)
  );

  if (nodeKind === "boss") {
    spawnChapterBoss(room);
    for (const player of getActivePlayers(room)) {
      if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
      player.choicePending = false;
      player.choices = [];
    }
    regroupPartyForStage(room);
    pushEvent(room, `${room.wave} 보스전 시작`);
    return;
  } else if (nodeKind === "reward") {
    startRewardStage(room);
    return;
  } else if (nodeKind === "blockade") {
    startBlockadeStage(room);
    return;
  } else if (nodeKind === "miniboss") {
    spawnMiniBoss(room);
    for (const player of getActivePlayers(room)) {
      if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
      player.choicePending = false;
      player.choices = [];
    }
    regroupPartyForStage(room);
    const support = preparePartyForMiniBoss(room);
    pushEvent(room, `${room.wave} 준보스전 시작.${support ? " 파티가 숨을 고르고 진입합니다." : ""}`);
    return;
  } else if (risk.earlyBoss) {
    const earlyBoss = spawnEnemy(room, "boss", { elite: Boolean(risk.earlyBoss) });
    tuneEarlyRiskBoss(room, earlyBoss);
  }

  if (nodeKind === "elite") {
    spawnEnemy(room, pickEliteAnchorType(room), { elite: true });
    if (room.wave >= 3) spawnEnemy(room, pickEnemyType(room.wave), { elite: true });
  }

  if (nodeKind === "defense") {
    startDefenseObjective(room);
  }

  const spawnPlan = createEnemySpawnPlan(room, baseCount, nodeKind, risk);
  const initialCount = getInitialSpawnCount(room, spawnPlan.length, risk, nodeKind);
  spawnPlannedEnemies(room, spawnPlan.slice(0, initialCount));
  scheduleReinforcements(room, spawnPlan.slice(initialCount), risk, nodeKind);

  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
    player.choicePending = false;
    player.choices = [];
  }
  regroupPartyForStage(room);

  pushEvent(room, `${room.wave} 스테이지 시작${risk.id !== "safe_path" ? `: ${risk.name}` : ""}`);
}

function spawnChapterBoss(room) {
  const profile = getBossProfileById(room.activeMapNode?.bossId) || getChapterBossProfile(room.floor);
  const boss = spawnEnemy(room, "boss", {
    bossId: profile.id,
    x: room.world.w / 2,
    y: Math.max(150, room.world.h / 2 - 300),
    scale: 1
  });
  if (!boss) return;

  const tuning = getChapterBossOpeningTuning(room);
  boss.maxHp = Math.max(tuning.minHp * CHAPTER_BOSS_HEALTH_MUL, Math.round(boss.maxHp * tuning.hpMul * CHAPTER_BOSS_HEALTH_MUL));
  boss.hp = boss.maxHp;
  boss.damage = Math.max(1, Math.round(boss.damage * tuning.damageMul));
  boss.bossPhase = 1;
  boss.specialTimer = tuning.specialTimer;
  boss.chargeTimer = profile.pattern === "charge" ? tuning.chargeTimer : Math.max(boss.chargeTimer, tuning.chargeTimer);
  boss.shotTimer = profile.pattern === "void" ? tuning.shotTimer : Math.max(boss.shotTimer, tuning.shotTimer);
  boss.barrier = Math.round(boss.maxHp * tuning.barrierRatio);
  boss.barrierTimer = Math.max(boss.barrierTimer || 0, tuning.barrierTimer);

  addEffect(room, "warning", boss.x, boss.y, {
    color: profile.color,
    radius: boss.radius + 92,
    style: "chapter_boss_spawn"
  });
  pushEvent(room, `${profile.name} 등장. ${profile.text}`);
}

function getChapterBossOpeningTuning(room) {
  const chapter = Math.max(1, room.floor || 1);
  if (chapter === 1) {
    return {
      hpMul: 0.86,
      damageMul: 0.92,
      minHp: 620,
      barrierRatio: 0.045,
      barrierTimer: 4.8,
      specialTimer: 3.75,
      chargeTimer: 3.15,
      shotTimer: 3.35
    };
  }
  return {
    hpMul: 1,
    damageMul: 1,
    minHp: 900,
    barrierRatio: 0.09,
    barrierTimer: 6.2,
    specialTimer: 2.8,
    chargeTimer: 2.15,
    shotTimer: 2.4
  };
}

function tuneEarlyRiskBoss(room, boss) {
  if (!boss) return;
  const chapter = Math.max(1, room.floor || 1);
  const depth = Math.max(1, room.activeMapNode?.depth || room.wave || 1);
  const hpMul = chapter === 1 && depth <= 5 ? 0.52 : chapter === 1 ? 0.64 : 0.78;
  boss.maxHp = Math.max(chapter === 1 ? 360 : 520, Math.round(boss.maxHp * hpMul));
  boss.hp = Math.min(boss.hp, boss.maxHp);
  boss.barrier = Math.min(boss.barrier || 0, Math.round(boss.maxHp * (chapter === 1 ? 0.04 : 0.06)));
  boss.specialTimer = Math.max(boss.specialTimer || 0, chapter === 1 ? 3.6 : 2.8);
  boss.chargeTimer = Math.max(boss.chargeTimer || 0, chapter === 1 ? 3.1 : 2.4);
  boss.shotTimer = Math.max(boss.shotTimer || 0, chapter === 1 ? 3.2 : 2.5);
}

function getMiniBossIntroTuning(room) {
  const chapter = Math.max(1, room.floor || 1);
  const depth = Math.max(1, room.activeMapNode?.depth || room.wave || 1);
  if (chapter === 1 && depth <= 6) {
    return {
      hpMul: 0.58,
      damageMul: 0.72,
      speedMul: 0.92,
      cadenceMul: 1.24,
      minHp: 190,
      minDamage: 8,
      minSpeed: 88,
      specialTimer: 3.8,
      chargeTimer: 3.15,
      shotTimer: 3.35,
      attackTimer: 0.58,
      prepHpRatio: 0.82,
      prepShieldRatio: 0.14,
      prepImmunity: 1.25
    };
  }
  if (chapter === 1) {
    return {
      hpMul: 0.7,
      damageMul: 0.82,
      speedMul: 0.98,
      cadenceMul: 1.12,
      minHp: 240,
      minDamage: 10,
      minSpeed: 94,
      specialTimer: 3.25,
      chargeTimer: 2.75,
      shotTimer: 2.95,
      attackTimer: 0.45,
      prepHpRatio: 0.72,
      prepShieldRatio: 0.1,
      prepImmunity: 1
    };
  }
  return {
    hpMul: 1,
    damageMul: 1,
    speedMul: 1,
    cadenceMul: 1,
    minHp: 360,
    minDamage: 16,
    minSpeed: 104,
    specialTimer: 2.35,
    chargeTimer: 1.85,
    shotTimer: 2.15,
    attackTimer: 0.25,
    prepHpRatio: 0.58,
    prepShieldRatio: 0.06,
    prepImmunity: 0.8
  };
}

function spawnMiniBoss(room, options = {}) {
  const profile = getChapterBossProfile(room.floor);
  const miniProfile = getMiniBossProfile(room.floor);
  const tuning = getMiniBossIntroTuning(room);
  const boss = spawnEnemy(room, "boss", {
    bossId: profile.id,
    x: Number.isFinite(options.x) ? options.x : room.world.w / 2,
    y: Number.isFinite(options.y) ? options.y : Math.max(180, room.world.h / 2 - 250),
    scale: 0.62
  });
  if (!boss) return null;

  boss.label = miniProfile.name;
  boss.color = miniProfile.color;
  boss.miniPattern = miniProfile.pattern;
  boss.patternMix = miniProfile.patternMix || boss.patternMix || null;
  boss.maxHp = Math.max(tuning.minHp * MINIBOSS_HEALTH_MUL, Math.round(boss.maxHp * miniProfile.hpMul * tuning.hpMul * MINIBOSS_HEALTH_MUL));
  boss.hp = boss.maxHp;
  boss.damage = Math.max(tuning.minDamage, Math.round(boss.damage * miniProfile.damageMul * tuning.damageMul));
  boss.radius = Math.max(36, Math.round(boss.radius * 0.76));
  boss.speed = Math.max(boss.speed * miniProfile.speedMul * tuning.speedMul, tuning.minSpeed);
  boss.cadenceMul = Math.max(0.76, (boss.cadenceMul || 1) * tuning.cadenceMul);
  boss.bossPhase = 1;
  boss.specialTimer = tuning.specialTimer;
  boss.chargeTimer = tuning.chargeTimer;
  boss.shotTimer = tuning.shotTimer;
  boss.attackTimer = tuning.attackTimer;
  boss.miniBoss = true;
  if (options.survival) {
    const stagger = Math.max(0, Math.floor(options.index || 0)) * 0.28;
    boss.survivalMiniBoss = true;
    boss.survivalSpawnMinute = Math.max(1, Math.floor(options.minute || 1));
    boss.guaranteedRelicDrop = true;
    boss.specialTimer += stagger;
    boss.chargeTimer += stagger;
    boss.shotTimer += stagger;
  }

  if (!options.survival) {
    room.stageObjective = {
      type: "miniboss",
      label: "MINI BOSS",
      text: miniProfile.text,
      targetId: boss.id
    };
  }

  addEffect(room, "warning", boss.x, boss.y, {
    color: miniProfile.color,
    radius: boss.radius + 74,
    style: "chapter_boss_spawn"
  });
  return boss;
}

function preparePartyForMiniBoss(room) {
  const tuning = getMiniBossIntroTuning(room);
  let supported = false;
  for (const player of getActivePlayers(room)) {
    if (player.spectator || player.hp <= 0) continue;
    const hpFloor = Math.floor(player.maxHp * tuning.prepHpRatio);
    if (player.hp < hpFloor) {
      player.hp = hpFloor;
      supported = true;
    }
    const shieldFloor = Math.round(player.maxHp * tuning.prepShieldRatio);
    if (shieldFloor > 0 && (player.shield || 0) < shieldFloor) {
      player.shield = shieldFloor;
      supported = true;
      addEffect(room, "shield", player.x, player.y, {
        color: classes[player.classId]?.color || "#f6f1e8",
        radius: getPlayerCollisionRadius(player) + 18
      });
    }
    player.immunityTimer = Math.max(player.immunityTimer || 0, tuning.prepImmunity);
  }
  return supported;
}

function startRewardStage(room) {
  room.stageObjective = {
    type: "reward",
    label: "REWARD",
    text: "Collect all three relic chests.",
    total: 3,
    remaining: 3
  };

  const centerX = room.world.w / 2;
  const centerY = room.world.h / 2;
  const spots = [
    { x: centerX - 120, y: centerY },
    { x: centerX, y: centerY - 84 },
    { x: centerX + 120, y: centerY }
  ];

  room.relicChests = spots.map((spot, index) => ({
    id: nextChestId++,
    x: spot.x,
    y: spot.y,
    radius: 26,
    rewardRoom: true,
    dead: false
  }));

  for (const chest of room.relicChests) {
    addEffect(room, "chest", chest.x, chest.y, { color: "#facc15", radius: 64 });
  }

  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
    player.choicePending = false;
    player.choices = [];
  }
  regroupPartyForStage(room);
  pushEvent(room, "Reward room. Collect all relic chests.");
}

function startDefenseObjective(room) {
  const maxHp = Math.round((260 + room.wave * 24 + room.floor * 36) * getPartyDifficulty(room).hpMul);
  room.stageObjective = {
    type: "defense",
    label: "DEFENSE",
    text: "Protect the ward.",
    x: room.world.w / 2,
    y: room.world.h / 2,
    hp: maxHp,
    maxHp,
    radius: 42,
    pushbackCount: 0
  };
  addEffect(room, "shield", room.stageObjective.x, room.stageObjective.y, {
    color: "#7fa671",
    radius: 90,
    style: "defense_objective"
  });
  pushEvent(room, "Defense stage. Protect the ward.");
}

function startBlockadeStage(room) {
  const partyDifficulty = getPartyDifficulty(room);
  const total = Math.round((13 + room.floor * 2 + (room.activeMapNode?.depth || 1) * 1.6) * (0.82 + partyDifficulty.players * 0.16));
  const laneHeight = Math.round(room.world.h * 0.54);
  const laneTop = Math.round((room.world.h - laneHeight) / 2);
  const laneBottom = laneTop + laneHeight;
  room.stageObjective = {
    type: "blockade",
    label: "BLOCK",
    text: "Stop runners before they reach the left gate.",
    total,
    spawned: 0,
    defeated: 0,
    leaked: 0,
    leakLimit: Math.max(3, 6 - Math.min(2, partyDifficulty.players - 1)),
    nextSpawnAt: Date.now() + 700,
    spawnGapMs: Math.max(520, 920 - room.floor * 70 - partyDifficulty.players * 45),
    goalX: 58,
    laneTop,
    laneBottom,
    laneCount: 4
  };

  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
    player.choicePending = false;
    player.choices = [];
  }
  regroupPartyForStage(room);
  pushEvent(room, "Block stage. Stop runners from crossing the left gate.");
}

function regroupPartyForStage(room) {
  const party = getActivePlayers(room);
  const count = Math.max(1, party.length);
  const centerX = room.world.w / 2;
  const centerY = room.world.h / 2;
  const ring = count === 1 ? 0 : 56;

  party.forEach((player, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    player.x = clamp(centerX + Math.cos(angle) * ring, 32, room.world.w - 32);
    player.y = clamp(centerY + Math.sin(angle) * ring, 32, room.world.h - 32);
    resolveEntityMapWalls(room, player, getPlayerCollisionRadius(player), 32);
    player.input.mx = 0;
    player.input.my = 0;
    player.input.attacking = false;
    player.dashMove = null;
    player.knockbackMove = null;
    syncPlayerInputSequences(player);
    player.inputGraceUntil = Date.now() + 450;
    player.poisonTimer = 0;
    player.poisonDps = 0;
    player.poisonBaseDps = 0;
    player.poisonStacks = 0;
    player.poisonTickTimer = 0;
    player.poisonOwnerId = null;
    player.immunityTimer = Math.max(player.immunityTimer, 0.72);
    player.shield = Math.max(player.shield, Math.min(16, player.maxHp * 0.06));
    player.shieldTimer = Math.max(player.shieldTimer, 1.35);
    addEffect(room, "cleanse", player.x, player.y, {
      color: classes[player.classId]?.color || classes.novice.color,
      radius: 58,
      style: "stage_regroup"
    });
  });
}

function getChapterPressure(room) {
  const chapter = Math.max(1, room.floor || 1);
  const wave = Math.max(1, room.wave || 1);
  const depth = room.activeMapNode?.depth || ((wave - 1) % MAP_DEPTH) + 1;
  return 1 + (chapter - 1) * 0.34 + Math.max(0, wave - 1) * 0.006 + Math.max(0, depth - 1) * 0.022;
}

function getPartyDifficulty(room) {
  const players = Math.min(MAX_PLAYERS, Math.max(1, getActivePlayers(room).length));
  return { players, ...PARTY_DIFFICULTY[players] };
}

function getStageDifficulty(room) {
  const fallbackDepth = ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  const depth = clamp(Math.round(room.activeMapNode?.depth || fallbackDepth), 1, MAP_DEPTH);
  return STAGE_DIFFICULTY[depth] || STAGE_DIFFICULTY[MAP_DEPTH];
}

function getChapterDifficulty(roomOrChapter) {
  const chapter = typeof roomOrChapter === "number" ? roomOrChapter : Math.max(1, roomOrChapter?.floor || 1);
  const index = clamp(Math.round(chapter), 1, MAX_CHAPTERS);
  return CHAPTER_DIFFICULTY[index] || CHAPTER_DIFFICULTY[1];
}

function getStageNodeThreatMultiplier(room, nodeKind) {
  const chapter = Math.max(1, room.floor || 1);
  const depth = Math.max(1, room.activeMapNode?.depth || room.wave || 1);
  if (nodeKind === "elite") return 1.22;
  if (nodeKind === "miniboss") {
    if (chapter === 1 && depth <= 6) return 0.94;
    if (chapter === 1) return 1.04;
    return 1.26;
  }
  if (nodeKind === "defense") return 1.08;
  if (nodeKind === "blockade") return 1.05;
  if (nodeKind === "boss") return chapter === 1 ? 1.16 : 1.42;
  return 1;
}

function getWaveThreatLevel(room, risk) {
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const stageDifficulty = getStageDifficulty(room);
  const nodeKind = getActiveStageKind(room);
  const nodeMul = getStageNodeThreatMultiplier(room, nodeKind);
  const abyssDifficulty = getAbyssDifficulty(room);
  const riskMul = risk.id === "safe_path" ? 1 : risk.id === "glass_run" ? 1.12 : risk.id === "early_boss" ? 1.18 : 1.22;
  return Math.min(
    2.45 + abyssDifficulty.depth * 0.12 + abyssDifficulty.ascension * 0.04,
    (1 + Math.max(0, depth - 1) * 0.065) *
      getChapterPressure(room) *
      nodeMul *
      riskMul *
      stageDifficulty.threatMul *
      abyssDifficulty.threatMul
  );
}

function getEliteChance(room, risk) {
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const partyDifficulty = getPartyDifficulty(room);
  const stageDifficulty = getStageDifficulty(room);
  const nodeKind = getActiveStageKind(room);
  const nodeBonus = nodeKind === "elite" ? ELITE_NODE_BONUS : nodeKind === "miniboss" ? 0.06 : nodeKind === "boss" ? 0.14 : 0;
  const riskBonus = risk.id === "early_boss" ? 0.09 : risk.id === "swarm_contract" ? 0.06 : risk.id === "glass_run" ? 0.025 : 0;
  const chapterBonus = Math.max(0, (room.floor || 1) - 1) * 0.045;
  const lateBonus = Math.max(0, (room.wave || 1) - MAP_DEPTH) * 0.004;
  const chapterDifficulty = getChapterDifficulty(room);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  const abyssDifficulty = getAbyssDifficulty(room);
  const cap = Math.min(0.82, partyDifficulty.eliteCap + abyssDifficulty.eliteBonus * 0.5);
  const chance = ELITE_BASE_CHANCE + depth * 0.018 + nodeBonus + riskBonus + chapterBonus + lateBonus;
  return Math.min(
    cap,
    chance * partyDifficulty.eliteMul * stageDifficulty.eliteMul * chapterDifficulty.eliteMul * clamp(specialBudget, 0.76, 1.12) +
      abyssDifficulty.eliteBonus
  );
}

function createEnemySpawnPlan(room, baseCount, nodeKind, risk) {
  const plan = [];
  const random = () => nextRoomRandom(room);
  const minimumBasicCount = getMinimumBasicSpawnCount(room, baseCount, nodeKind);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  let basicSpawned = 0;
  for (let i = 0; i < baseCount; i += 1) {
    const basicDeficit = minimumBasicCount - basicSpawned;
    const remainingSlots = baseCount - i;
    const expectedBasicByNow = Math.floor(((i + 1) / Math.max(1, baseCount)) * minimumBasicCount);
    const forceBasic = basicDeficit > 0 && (basicSpawned < expectedBasicByNow || remainingSlots <= basicDeficit);
    const budgetPrefersBasic = !forceBasic && specialBudget < 1 && random() > specialBudget;
    const type =
      nodeKind === "defense"
        ? pickDefenseEnemyType(room.wave, forceBasic || budgetPrefersBasic, random)
        : forceBasic || budgetPrefersBasic
          ? pickBasicEnemyType(room.wave, random)
          : pickEnemyType(room.wave, random);
    const elite = random() < getEliteChance(room, risk);
    plan.push({ type, elite });
    if (isBasicEnemyType(type)) basicSpawned += 1;
  }
  return plan;
}

function pickDefenseEnemyType(wave, forceBasic = false, random = Math.random) {
  if (forceBasic) return pickBasicEnemyType(wave, random);
  const weights = [
    ["slime", 0.24],
    ["bat", 0.2],
    ["brute", 0.18],
    ["bomber", wave >= 2 ? 0.12 : 0],
    ["splitter", wave >= 2 ? 0.1 : 0],
    ["guardian", wave >= 3 ? 0.08 : 0],
    ["charger", wave >= 7 ? 0.05 : 0]
  ].filter(([type, weight]) => weight > 0 && DEFENSE_ALLOWED_TYPES.includes(type) && isEnemyTypeUnlocked(type, wave));
  return pickWeightedEnemyType(weights, random) || pickBasicEnemyType(wave, random);
}

function getInitialSpawnCount(room, total, risk, nodeKind) {
  if (total <= 0) return 0;
  const chapterDifficulty = getChapterDifficulty(room);
  let ratio = chapterDifficulty.initialSpawnRatio;
  if (risk?.id === "swarm_contract") ratio -= 0.06;
  if (nodeKind === "elite") ratio += 0.08;
  const minimum = Math.min(total, nodeKind === "elite" ? 6 : 5);
  return clamp(Math.ceil(total * clamp(ratio, 0.38, 0.78)), minimum, total);
}

function spawnPlannedEnemies(room, plan) {
  for (const entry of plan) {
    spawnEnemy(room, entry.type, { elite: entry.elite });
  }
}

function scheduleReinforcements(room, plan, risk, nodeKind) {
  room.pendingReinforcements = [];
  if (!plan.length || nodeKind === "boss") return;

  const chapterDifficulty = getChapterDifficulty(room);
  const batchCount = clamp(
    Math.min(chapterDifficulty.reinforcementBatches, Math.ceil(plan.length / 5)),
    1,
    Math.max(1, plan.length)
  );
  const now = Date.now();
  let cursor = 0;
  for (let i = 0; i < batchCount; i += 1) {
    const remaining = plan.length - cursor;
    const take = Math.ceil(remaining / (batchCount - i));
    const spawns = plan.slice(cursor, cursor + take);
    cursor += take;
    const delay =
      (chapterDifficulty.reinforcementDelay + chapterDifficulty.reinforcementGap * i) *
      (risk?.id === "swarm_contract" ? 0.92 : 1);
    room.pendingReinforcements.push({
      at: now + Math.round(delay * 1000),
      spawns,
      threshold: Math.max(2, Math.ceil(spawns.length * (room.floor >= 3 ? 0.46 : 0.38)))
    });
  }
}

function updateReinforcements(room, now) {
  if (room.status !== "combat" || !room.pendingReinforcements?.length) return;
  const living = room.enemies.filter((enemy) => enemy.hp > 0 && !enemy.trainingDummy).length;
  const next = room.pendingReinforcements[0];
  if (!next) return;
  if (now < next.at && living > next.threshold) return;

  room.pendingReinforcements.shift();
  spawnPlannedEnemies(room, next.spawns || []);
  pushEvent(room, `증원 ${next.spawns?.length || 0}마리가 전장에 합류했습니다.`);
}

function pickEliteAnchorType(room) {
  const wave = Math.max(1, room?.wave || 1);
  return isEnemyTypeUnlocked("sniper", wave) && Math.random() < 0.55 ? "sniper" : "brute";
}

function getMinimumBasicSpawnCount(room, baseCount, nodeKind) {
  if (baseCount <= 0) return 0;

  const depth = room.activeMapNode?.depth || room.wave || 1;
  const chapter = Math.max(1, room.floor || 1);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  let ratio = 0.48;

  ratio += Math.max(0, chapter - 1) * 0.015;
  ratio += (1 - specialBudget) * 0.16;
  ratio += depth >= 5 ? 0.035 : 0;
  if (nodeKind === "elite") ratio -= 0.02;
  if (nodeKind === "boss") ratio -= 0.04;

  const minimum = Math.ceil(baseCount * clamp(ratio, 0.4, 0.62));
  const cap = Math.max(1, Math.floor(baseCount * 0.68));
  return Math.min(minimum, cap);
}

function isBasicEnemyType(type) {
  return BASIC_ENEMY_TYPES.has(type);
}

function pickBasicEnemyType(wave, random = Math.random) {
  const weights = [
    ["slime", 0.42],
    ["bat", 0.34],
    ["brute", 0.24]
  ];
  return pickWeightedEnemyType(weights.filter(([type]) => isEnemyTypeUnlocked(type, wave)), random) || "slime";
}

function pickWeightedEnemyType(weightedTypes, random = Math.random) {
  if (!weightedTypes.length) return null;
  const total = weightedTypes.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [type, weight] of weightedTypes) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return weightedTypes[weightedTypes.length - 1][0];
}

function pickEnemyType(wave, random = Math.random) {
  const available = ENEMY_SPAWN_WEIGHTS.filter(([type]) => {
    return isEnemyTypeUnlocked(type, wave);
  });
  const weightedType = pickWeightedEnemyType(available, random);
  if (weightedType) return weightedType;

  const roll = random();
  if (wave >= 2 && roll > 0.88) return "sniper";
  if (wave >= 8 && roll > 0.86) return "mortar";
  if (wave >= 7 && roll > 0.82) return "charger";
  if (wave >= 4 && roll > 0.66) return "spitter";
  if (wave >= 2 && roll > 0.56) return "bomber";
  if (wave >= 2 && roll > 0.46) return "brute";
  if (wave >= 3 && roll > 0.36) return "guardian";
  if (wave >= 3 && roll > 0.28) return "shaman";
  if (wave >= 2 && roll > 0.28) return "splitter";
  if (wave >= 2 && roll > 0.14) return "bat";
  return "slime";
}

function isEnemyTypeUnlocked(type, wave) {
  return enemySystem.isEnemyTypeUnlocked(type, wave, BLOCKADE_RUNNER_TYPES);
}

function getChapterBossProfile(chapter) {
  return bossSystem.getChapterBossProfile(chapter, CHAPTER_BOSSES, MAX_CHAPTERS);
}

function getMiniBossProfile(chapter) {
  return bossSystem.getMiniBossProfile(chapter, MINI_BOSSES, MAX_CHAPTERS);
}

function getChapterStageProfile(chapter) {
  const index = clamp(Math.round(chapter || 1), 1, MAX_CHAPTERS);
  return CHAPTER_STAGE_PROFILES[index] || CHAPTER_STAGE_PROFILES[1];
}

function getChapterStagePressureMul(room) {
  const profile = getChapterStageProfile(room?.floor || 1);
  return Number.isFinite(profile.stagePressureMul) ? profile.stagePressureMul : 1;
}

function getChapterSpecialEnemyBudget(room) {
  const profile = getChapterStageProfile(room?.floor || 1);
  return Number.isFinite(profile.specialEnemyBudget) ? profile.specialEnemyBudget : 1;
}

function getBossTelegraphBias(room) {
  const profile = getChapterStageProfile(room?.floor || 1);
  return Number.isFinite(profile.bossTelegraphBias) ? profile.bossTelegraphBias : 1;
}

function getBossProfileForEnemy(room, enemy) {
  if (!enemy || enemy.type !== "boss") return null;
  if (enemy.miniBoss) return getMiniBossProfile(room?.floor || 1);
  return getBossProfileById(enemy.bossId) || getChapterBossProfile(room?.floor || 1);
}

function getEnemyTelegraphTime(room, enemy, channel, fallback) {
  const base = Number.isFinite(fallback) ? fallback : 1;
  const profile = getBossProfileForEnemy(room, enemy);
  if (!profile) return base;
  const profileTime = Number.isFinite(profile.telegraph?.[channel]) ? profile.telegraph[channel] : base;
  const phaseMul = enemy.bossPhase >= 3 ? 0.92 : enemy.bossPhase >= 2 ? 0.97 : 1;
  return Math.max(base, profileTime * getBossTelegraphBias(room) * phaseMul);
}

function chapterStageProfileView(chapter) {
  const profile = getChapterStageProfile(chapter);
  return {
    chapter: profile.chapter,
    name: profile.name,
    theme: profile.theme,
    combatFocus: profile.combatFocus,
    visualTone: profile.visualTone,
    stagePressureMul: profile.stagePressureMul,
    specialEnemyBudget: profile.specialEnemyBudget,
    bossTelegraphBias: profile.bossTelegraphBias
  };
}

function ensureRoomMapWalls(room) {
  if (!room?.world) return [];
  room.mapWalls = [];
  room.mapWallsKey = "disabled";
  return room.mapWalls;
}

function ensureRoomEdgeWalls(room) {
  if (!room?.world) return [];
  const key = `${Math.round(room.world.w || 0)}:${Math.round(room.world.h || 0)}:${MAP_EDGE_WALL_THICKNESS}`;
  if (!Array.isArray(room.mapEdgeWalls) || room.mapEdgeWallsKey !== key) {
    room.mapEdgeWalls = createWorldEdgeWalls(room.world);
    room.mapEdgeWallsKey = key;
  }
  return room.mapEdgeWalls;
}

function getRoomCollisionWalls(room) {
  const mapWalls = ensureRoomMapWalls(room);
  const edgeWalls = ensureRoomEdgeWalls(room);
  if (!mapWalls.length) return edgeWalls;
  if (!edgeWalls.length) return mapWalls;
  return [...mapWalls, ...edgeWalls];
}

function createWorldEdgeWalls(world) {
  const w = Math.max(1, Number(world?.w) || 1800);
  const h = Math.max(1, Number(world?.h) || 1120);
  const thickness = MAP_EDGE_WALL_THICKNESS;
  const half = thickness / 2;
  return [
    { id: "edge-top", x: w / 2, y: half, w, h: thickness, kind: "edge_wall" },
    { id: "edge-bottom", x: w / 2, y: h - half, w, h: thickness, kind: "edge_wall" },
    { id: "edge-left", x: half, y: h / 2, w: thickness, h, kind: "edge_wall" },
    { id: "edge-right", x: w - half, y: h / 2, w: thickness, h, kind: "edge_wall" }
  ];
}

function getMinibossMinDepth(floor) {
  const chapter = clamp(Math.round(floor || 1), 1, MAX_CHAPTERS);
  return MINIBOSS_MIN_DEPTH_BY_CHAPTER[chapter] || 4;
}

function canRollMinibossAt(floor, depth) {
  const stageDepth = Math.max(1, Math.round(depth || 1));
  return stageDepth >= getMinibossMinDepth(floor) && stageDepth < MAP_DEPTH;
}

function getBossProfileById(id) {
  if (id === EXECUTION_BOSS_PROFILE.id) return EXECUTION_BOSS_PROFILE;
  return bossSystem.getBossProfileById(id, CHAPTER_BOSSES);
}

function bossProfileView(profile) {
  return bossSystem.bossProfileView(profile);
}

function riskView(risk) {
  const source = risk || risks[0];
  return {
    id: source.id,
    name: source.name,
    text: source.text,
    xpMul: source.xpMul || 1,
    spawnMul: source.spawnMul || 1,
    noClearHeal: Boolean(source.noClearHeal),
    earlyBoss: Boolean(source.earlyBoss)
  };
}

function nextBossPattern(enemy, profile, fallbackPatterns) {
  return bossSystem.nextBossPattern(enemy, profile, fallbackPatterns);
}

function getBossPhaseTransition(enemy) {
  return bossSystem.getBossPhaseTransition(enemy);
}

function pickStageNodeKind(floor, depth, lane, random = Math.random) {
  if (depth === MAP_DEPTH) return "boss";
  if (depth === 1) return random() < 0.18 ? "defense" : "combat";
  if (depth % 4 === 0 || (floor >= 2 && depth === 6) || (floor >= 3 && depth === 3)) return "elite";

  const canMiniboss = canRollMinibossAt(floor, depth);
  const earlyChapterOne = Math.max(1, floor || 1) === 1 && depth <= 2;
  const weights = [
    ["combat", earlyChapterOne ? 0.38 : 0.31],
    ["defense", 0.16],
    ["blockade", 0.15],
    ["miniboss", canMiniboss ? (depth >= 6 ? 0.12 : 0.08) : 0],
    ["random", 0.11],
    ["reward", depth >= 2 ? 0.06 : 0],
    ["elite", earlyChapterOne ? 0 : depth >= 3 ? 0.09 : 0.04]
  ].filter(([, weight]) => weight > 0);
  return pickWeightedEnemyType(weights, random) || "combat";
}

function resolveRandomStageKind(node, random = Math.random) {
  if (!node || node.kind !== "random") return node?.kind || "combat";
  const floor = Math.max(1, node.floor || 1);
  const depth = Math.max(1, node.depth || 1);
  const canMiniboss = canRollMinibossAt(floor, depth);
  const earlyChapterOne = floor === 1 && depth <= 3;
  const weights = [
    ["combat", earlyChapterOne ? 0.38 : 0.26],
    ["elite", earlyChapterOne ? 0.04 : 0.2],
    ["miniboss", canMiniboss ? 0.15 : 0],
    ["defense", 0.2],
    ["blockade", earlyChapterOne ? 0.12 : 0.17]
  ].filter(([, weight]) => weight > 0);
  return pickWeightedEnemyType(weights, random) || "combat";
}

function getNodeGameplayKind(node) {
  return stageSystem.getNodeGameplayKind(node);
}

function getActiveStageKind(room) {
  return getNodeGameplayKind(room.activeMapNode);
}

function getStageRewardPreview(kind, floor = 1, depth = 1) {
  const base = STAGE_REWARD_RULES[kind] || STAGE_REWARD_RULES.combat;
  return dataRegistry.getStageRewardPreview(base, floor, depth);
}

function stageNodeMetaView(node) {
  const kind = typeof node === "string" ? node : node?.kind || "combat";
  const resolvedKind = typeof node === "string" ? "" : node?.resolvedKind || "";
  const meta = STAGE_NODE_META[kind] || STAGE_NODE_META.combat;
  const resolvedMeta = resolvedKind ? STAGE_NODE_META[resolvedKind] || null : null;
  const rewardKind = resolvedKind || kind;
  const reward = getStageRewardPreview(
    rewardKind,
    typeof node === "string" ? 1 : node?.floor || 1,
    typeof node === "string" ? 1 : node?.depth || 1
  );
  return {
    kind,
    resolvedKind,
    label: meta.label,
    glyph: meta.glyph,
    text: meta.text,
    resolvedLabel: resolvedMeta ? resolvedMeta.label : "",
    reward
  };
}

function generateStageMap(floor, random = Math.random, options = {}) {
  const nodes = [];
  const edges = [];
  const normalModifiers = risks;
  const bossProfile = getBossProfileById(options.bossId) || getChapterBossProfile(floor);

  for (let depth = 1; depth <= MAP_DEPTH; depth += 1) {
    const bossDepth = depth === MAP_DEPTH;
    const lanes = bossDepth ? [1] : [0, 1, 2];
    for (const lane of lanes) {
      const kind = pickStageNodeKind(floor, depth, lane, random);
      const fixedObjectiveKind = ["reward", "blockade", "defense", "miniboss"].includes(kind);
      const modifier =
        bossDepth
          ? risks.find((item) => item.id === bossProfile.modifierId) || risks[0]
          : fixedObjectiveKind
            ? risks[0]
          : weightedModifier(normalModifiers, depth, floor, random);
      nodes.push({
        id: `f${floor}-d${depth}-l${lane}`,
        floor,
        depth,
        lane,
        kind,
        modifierId: modifier.id,
        bossId: bossDepth ? bossProfile.id : ""
      });
    }
  }

  for (const node of nodes) {
    const nextNodes = nodes.filter(
      (candidate) => candidate.depth === node.depth + 1 && Math.abs(candidate.lane - node.lane) <= 1
    );
    const shuffled = nextNodes.sort(() => random() - 0.5);
    const take = node.depth === MAP_DEPTH - 1 ? shuffled : shuffled.slice(0, 2 + Math.floor(random() * 2));
    node.nextIds = take.map((candidate) => candidate.id);
    for (const nextId of node.nextIds) edges.push([node.id, nextId]);
  }

  return {
    floor,
    depth: MAP_DEPTH,
    lanes: MAP_LANES,
    nodes,
    edges
  };
}

function weightedModifier(modifiers, depth, floor = 1, random = Math.random) {
  const weights = modifiers.map((modifier) => {
    const chapterPressure = Math.max(0, floor - 1) * 0.05;
    if (modifier.id === "safe_path") {
      if (depth <= 1) return Math.max(0.58, 0.7 - chapterPressure);
      if (depth <= 2) return Math.max(0.46, 0.58 - chapterPressure);
      if (depth <= 3) return Math.max(0.34, 0.44 - chapterPressure);
      return Math.max(0.14, 0.26 - chapterPressure);
    }
    if (modifier.id === "swarm_contract") {
      if (depth <= 1) return 0.08 + chapterPressure * 0.25;
      if (depth <= 2) return 0.16 + chapterPressure * 0.5;
      if (depth <= 3) return 0.26 + chapterPressure;
      return 0.36 + chapterPressure;
    }
    if (modifier.id === "glass_run") {
      if (depth <= 1) return 0;
      if (depth <= 2) return 0.05 + chapterPressure * 0.35;
      if (depth <= 3) return 0.12 + chapterPressure * 0.7;
      return 0.26 + chapterPressure;
    }
    if (modifier.id === "early_boss") {
      if (depth <= 3) return 0;
      return depth >= 5 ? 0.22 + chapterPressure : 0.1 + chapterPressure * 0.6;
    }
    return 0.1;
  });
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let i = 0; i < modifiers.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return modifiers[i];
  }
  return modifiers[0];
}

function getMapNode(room, nodeId) {
  return stageSystem.getMapNode(room.stageMap, nodeId);
}

function getAvailableMapNodes(room) {
  return stageSystem.getAvailableMapNodes(room);
}

function getAbyssDecisionNodes(room) {
  if (!room.stageMap || !room.abyssDecision) return [];
  return room.stageMap.nodes.filter((node) => node.id === ABYSS_DECISION_ESCAPE_ID || node.id === ABYSS_DECISION_ENTER_ID);
}

function abyssDecisionNodeView(room, node) {
  const voteCounts = countMapVotes(room);
  const entering = node.id === ABYSS_DECISION_ENTER_ID;
  const nextDepth = Math.max(1, Math.floor(Number(room.abyssDepth || 0)) + 1);
  const stage = entering
    ? {
        kind: "abyss",
        resolvedKind: "",
        label: `ABYSS ${nextDepth}`,
        glyph: "A",
        text: `심연 ${nextDepth}층으로 진입합니다. 적이 강해지고 결산 보상이 증가합니다.`,
        resolvedLabel: "",
        reward: null
      }
    : {
        kind: "escape",
        resolvedKind: "",
        label: "ESCAPE",
        glyph: "O",
        text: "지금 런을 클리어 처리하고 결산 보상을 받습니다.",
        resolvedLabel: "",
        reward: null
      };
  return {
    id: node.id,
    floor: node.floor,
    depth: node.depth,
    lane: node.lane,
    kind: stage.kind,
    resolvedKind: "",
    stage,
    modifier: null,
    boss: null,
    votes: voteCounts[node.id] || 0
  };
}

function refreshAbyssDecisionChoices(room) {
  room.mapChoices = getAbyssDecisionNodes(room).map((node) => abyssDecisionNodeView(room, node));
  return room.mapChoices;
}

function enterAbyssDecision(room) {
  if (room.survival?.completed && room.abyssDepth > 0) {
    room.survival.completedAbyssDepths = Math.max(room.survival.completedAbyssDepths || 0, room.abyssDepth);
  }
  room.status = "map";
  room.abyssDecision = true;
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapVotes = {};
  room.mapDeadline = Date.now() + MAP_VOTE_TIMEOUT_MS;
  room.stageMap = {
    floor: room.floor,
    depth: 1,
    lanes: 2,
    nodes: [
      { id: ABYSS_DECISION_ESCAPE_ID, floor: room.floor, depth: 1, lane: 0, kind: "escape", nextIds: [] },
      { id: ABYSS_DECISION_ENTER_ID, floor: room.floor, depth: 1, lane: 1, kind: "abyss", nextIds: [] }
    ],
    edges: []
  };
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapPath = [];
  refreshAbyssDecisionChoices(room);
  pushEvent(room, "최종 관문 돌파. 탈출하거나 더 깊은 심연으로 진입하세요.");
}

function enterMapChoice(room) {
  room.status = "map";
  room.abyssDecision = false;
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.fieldPickups = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapVotes = {};
  room.mapDeadline = Date.now() + MAP_VOTE_TIMEOUT_MS;
  const progression = ensureMapProgression(room);
  if (progression.status === "complete") {
    if (room.floor >= MAX_CHAPTERS) {
      enterAbyssDecision(room);
      return;
    }
    finishRun(room, "victory", "3챕터의 모든 스테이지를 클리어했습니다.");
    return;
  }
  refreshMapChoices(room, progression.availableNodes);
  pushEvent(room, "지도에서 다음 방을 투표하세요.");
}

function chooseMapNode(room, player, nodeId) {
  if (room.status !== "map") return;
  if (room.abyssDecision) {
    chooseAbyssDecision(room, player, nodeId);
    return;
  }
  if (!isActivePlayer(player)) return;
  if (room.mapVotes[player.id]) return;
  const available = new Set(getAvailableMapNodes(room).map((node) => node.id));
  if (!available.has(nodeId)) return;
  room.mapVotes[player.id] = nodeId;
  pushEvent(room, `${player.name} 님이 다음 방에 투표했습니다.`);
  resolveMapChoiceIfReady(room, Date.now());
}

function updateMapChoice(room, now) {
  if (room.abyssDecision) {
    resolveAbyssDecisionIfReady(room, now);
    return;
  }
  if (!room.stageMap) {
    room.stageMap = generateStageMap(room.floor, () => nextRoomRandom(room), { bossId: room.weeklyBossId });
    room.currentMapNodeId = null;
    refreshMapChoices(room);
  }
  resolveMapChoiceIfReady(room, now);
}

function resolveMapChoiceIfReady(room, now) {
  if (room.status !== "map") return false;
  if (room.abyssDecision) return resolveAbyssDecisionIfReady(room, now);
  const voters = getActivePlayers(room).map((player) => player.id);
  let available = getAvailableMapNodes(room);
  if (available.length === 0) {
    const progression = ensureMapProgression(room);
    if (progression.status === "complete") {
      if (room.floor >= MAX_CHAPTERS) {
        enterAbyssDecision(room);
        return true;
      }
      finishRun(room, "victory", "3챕터의 모든 스테이지를 클리어했습니다.");
      return true;
    }
    available = progression.availableNodes;
    refreshMapChoices(room, available);
    room.mapVotes = {};
    room.mapDeadline = Date.now() + MAP_VOTE_TIMEOUT_MS;
    return false;
  }

  const counts = countMapVotes(room);
  const allVoted = voters.length > 0 && voters.every((id) => room.mapVotes[id]);
  const timedOut = room.mapDeadline && now >= room.mapDeadline;
  if (!allVoted && !timedOut) {
    refreshMapChoices(room, available);
    return false;
  }

  let chosenId = pickVoteWinner(room, available);
  if (!chosenId) chosenId = available[0].id;
  const chosen = getMapNode(room, chosenId) || available[0];
  startMapNode(room, chosen);
  return true;
}

function chooseAbyssDecision(room, player, nodeId) {
  if (!isActivePlayer(player)) return;
  if (room.mapVotes[player.id]) return;
  const available = new Set(getAbyssDecisionNodes(room).map((node) => node.id));
  if (!available.has(nodeId)) return;
  room.mapVotes[player.id] = nodeId;
  pushEvent(room, `${player.name} 님이 ${nodeId === ABYSS_DECISION_ENTER_ID ? "심연 진입" : "탈출"}에 투표했습니다.`);
  resolveAbyssDecisionIfReady(room, Date.now());
}

function resolveAbyssDecisionIfReady(room, now) {
  if (room.status !== "map" || !room.abyssDecision) return false;
  const voters = getActivePlayers(room).map((player) => player.id);
  const available = getAbyssDecisionNodes(room);
  const allVoted = voters.length > 0 && voters.every((id) => room.mapVotes[id]);
  const timedOut = room.mapDeadline && now >= room.mapDeadline;
  if (!allVoted && !timedOut) {
    refreshAbyssDecisionChoices(room);
    return false;
  }
  const chosenId = pickVoteWinner(room, available) || ABYSS_DECISION_ENTER_ID;
  room.abyssDecision = false;
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  if (chosenId === ABYSS_DECISION_ESCAPE_ID) {
    finishRun(room, "victory", "파티가 심연 입구에서 탈출했습니다.");
    return true;
  }
  enterAbyssDepth(room);
  return true;
}

function pickVoteWinner(room, available) {
  return stageSystem.pickVoteWinner(available, countMapVotes(room), () => nextRoomRandom(room));
}

function countMapVotes(room) {
  return stageSystem.countMapVotes(room.mapVotes);
}

function startMapNode(room, node) {
  const started = stageSystem.applyMapNodeStart(room, node, {
    resolveRandomStageKind: (item) => resolveRandomStageKind(item, () => nextRoomRandom(room)),
    getModifier: (item) => risks.find((risk) => risk.id === item.modifierId) || risks[0],
    getBossProfile: (item) => getBossProfileById(item.bossId) || getChapterBossProfile(item.floor)
  });
  pushEvent(
    room,
    started.bossProfile
      ? `${node.floor}챕터 보스전: ${started.bossProfile.name}`
      : `${node.depth}번째 방으로 이동합니다: ${started.modifier.name}`
  );
  spawnWave(room);
}

function mapNodeView(room, node) {
  return stageSystem.getMapNodeView(room, node, {
    getModifier: (item) => risks.find((risk) => risk.id === item.modifierId) || risks[0],
    getBossProfile: (item) => getBossProfileById(item.bossId) || getChapterBossProfile(item.floor),
    stageNodeMetaView,
    riskView,
    bossProfileView,
    voteCounts: countMapVotes(room)
  });
}

function refreshMapChoices(room, availableNodes) {
  return stageSystem.refreshMapChoices(room, {
    availableNodes,
    mapNodeView: (node) => mapNodeView(room, node)
  });
}

function ensureMapProgression(room) {
  return stageSystem.ensureMapProgression(room, {
    maxChapters: MAX_CHAPTERS,
    generateStageMap
  });
}

function stageMapView(room) {
  return stageSystem.getStageMapView(room, {
    mapNodeView: (node) => mapNodeView(room, node)
  });
}

function isRangedPressureEnemyType(type) {
  return enemySystem.isRangedPressureEnemyType(type);
}

function getRangedPressureMul(room, type, elite = false) {
  if (!isRangedPressureEnemyType(type)) return 1;
  const chapter = Math.max(1, room.floor || 1);
  const depth = room.activeMapNode?.depth || ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  const stageKind = getActiveStageKind(room);
  let mul = 1 + Math.max(0, chapter - 1) * 0.1 + Math.max(0, depth - 4) * 0.025;
  if (chapter >= 3) mul += 0.05;
  if (elite) mul += 0.05;
  if (stageKind === "boss") mul += type === "boss" ? 0.08 : 0.1;
  return clamp(mul, 1, 1.34);
}

function getHostileProjectileCap(room) {
  const playerCount = Math.max(1, getActiveLivingPlayers(room).length || getActivePlayers(room).length || 1);
  const chapter = Math.max(1, room.floor || 1);
  const stageKind = getActiveStageKind(room);
  return enemySystem.getHostileProjectileCap({ playerCount, chapter, stageKind });
}

function countHostileProjectiles(room) {
  return enemySystem.countHostileProjectiles(room.projectiles);
}

function canSpawnHostileProjectile(room) {
  const playerCount = Math.max(1, getActiveLivingPlayers(room).length || getActivePlayers(room).length || 1);
  const chapter = Math.max(1, room.floor || 1);
  const stageKind = getActiveStageKind(room);
  return enemySystem.canSpawnHostileProjectile(room.projectiles, { playerCount, chapter, stageKind });
}

function spawnEnemy(room, type, options = {}) {
  if (room.survival?.bossActive && type !== "boss" && !options.allowDuringSurvivalBoss) return null;
  const def = enemyDefs[type];
  if (!def) return;
  const random = () => nextRoomRandom(room);
  const side = Math.floor(random() * 4);
  const margin = 50;
  let x = margin;
  let y = margin;

  if (side === 0) {
    x = random() * room.world.w;
    y = margin;
  } else if (side === 1) {
    x = room.world.w - margin;
    y = random() * room.world.h;
  } else if (side === 2) {
    x = random() * room.world.w;
    y = room.world.h - margin;
  } else {
    x = margin;
    y = random() * room.world.h;
  }

  if (Number.isFinite(options.x)) x = clamp(options.x, 24, room.world.w - 24);
  if (Number.isFinite(options.y)) y = clamp(options.y, 24, room.world.h - 24);

  const chapter = Math.max(1, room.floor || 1);
  const depth = room.activeMapNode?.depth || ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  const nodeKind = getActiveStageKind(room);
  const nodePower = nodeKind === "boss" ? 0.16 : nodeKind === "miniboss" ? 0.11 : nodeKind === "elite" ? 0.1 : 0;
  const chapterDifficulty = getChapterDifficulty(room);
  const survivalRegularEnemy = Boolean(room.survival?.active && type !== "boss");
  const chapterStep = survivalRegularEnemy ? 0 : chapter - 1;
  const statChapterDifficulty = survivalRegularEnemy ? CHAPTER_DIFFICULTY[1] : chapterDifficulty;
  const waveScale = 1 + (room.wave - 1) * 0.095 + chapterStep * 0.12 + (depth - 1) * 0.038 + nodePower;
  const xpScale = 1 + (room.wave - 1) * 0.028 + (chapter - 1) * 0.05;
  const damageScale =
    1 + Math.max(0, room.wave - 1) * 0.05 + chapterStep * 0.09 + (depth - 1) * 0.026 + (nodeKind === "boss" ? 0.1 : nodeKind === "elite" ? 0.055 : 0);
  const speedScale = 1 + Math.min(0.36, Math.max(0, room.wave - 1) * 0.009 + chapterStep * 0.018 + (depth - 1) * 0.007);
  const stageDifficulty = getStageDifficulty(room);
  const abyssDifficulty = getAbyssDifficulty(room);
  const cadenceMul =
    Math.max(0.72, 1 - Math.max(0, room.wave - 1) * 0.003 - chapterStep * 0.009 - (depth - 1) * 0.0015 - (nodeKind === "boss" ? 0.02 : 0)) *
    stageDifficulty.cadenceMul *
    statChapterDifficulty.cadenceMul *
    abyssDifficulty.cadenceMul;
  const partyDifficulty = getPartyDifficulty(room);
  const elite = Boolean(options.elite);
  const affix = options.affix || (elite ? pickEliteAffix(type, random) : "");
  const bossProfile =
    type === "boss"
      ? getBossProfileById(options.bossId || (getActiveStageKind(room) === "boss" ? room.activeMapNode?.bossId : ""))
      : null;
  const eliteHpMul = elite ? (type === "boss" ? 1.48 : 1.72) : 1;
  const eliteDamageMul = elite ? (type === "boss" ? 1.14 : 1.18) : 1;
  const eliteSpeedMul = elite && affix === "frenzy" ? 1.14 : elite ? 1.05 : 1;
  const eliteRadiusMul = elite ? 1.12 : 1;
  const scale = Number.isFinite(options.scale) ? options.scale : 1;
  const xpMul = Number.isFinite(options.xpMul) ? options.xpMul : 1;
  const bossHpMul = bossProfile ? bossProfile.hpMul : 1;
  const bossDamageMul = bossProfile ? bossProfile.damageMul : 1;
  const bossSpeedMul = bossProfile ? bossProfile.speedMul : 1;
  const bossRadiusMul = bossProfile ? bossProfile.radiusMul : 1;
  const bossXpMul = bossProfile ? bossProfile.xpMul : 1;
  const maxHp = Math.round(
    def.hp *
      waveScale *
      partyDifficulty.hpMul *
      stageDifficulty.hpMul *
      statChapterDifficulty.hpMul *
      eliteHpMul *
      scale *
      bossHpMul *
      abyssDifficulty.hpMul
  );
  const radius = Math.round(def.radius * eliteRadiusMul * Math.sqrt(scale) * bossRadiusMul);
  const spawnPosition = findFreeEnemySpawnPosition(room, x, y, radius);
  x = spawnPosition.x;
  y = spawnPosition.y;

  const enemy = {
    id: nextEnemyId++,
    type,
    label: bossProfile ? bossProfile.name : def.label,
    color: bossProfile ? bossProfile.color : def.color,
    bossId: bossProfile ? bossProfile.id : "",
    bossPattern: bossProfile ? bossProfile.pattern : "",
    patternMix: bossProfile ? bossProfile.patternMix : null,
    bossPhase: 0,
    phaseTitle: "",
    phaseTransitionTimer: 0,
    phaseTransitionTimerMax: 0,
    phaseAuraColor: "",
    lethalCastTimer: 0,
    lethalCastTimerMax: 0,
    lethalCastLabel: "",
    x,
    y,
    hp: maxHp,
    maxHp,
    speed: def.speed * speedScale * stageDifficulty.speedMul * statChapterDifficulty.speedMul * eliteSpeedMul * bossSpeedMul * abyssDifficulty.speedMul,
    damage: Math.round(
      def.damage *
        damageScale *
        partyDifficulty.damageMul *
        stageDifficulty.damageMul *
        statChapterDifficulty.damageMul *
        eliteDamageMul *
        bossDamageMul *
        abyssDifficulty.damageMul
    ),
    radius,
    role: def.role || type,
    elite,
    affix,
    orbitDir: random() < 0.5 ? -1 : 1,
    aiPhase: random() * Math.PI * 2,
    attackTimer: 0,
    shotTimer: (0.75 + random() * 0.75) * cadenceMul,
    healTimer: (1.55 + random() * 1.05) * cadenceMul,
    chargeTimer: (1.05 + random() * 1.05) * cadenceMul,
    specialTimer: (1.65 + random() * 1.35) * cadenceMul,
    eliteSpecialTimer: elite && type !== "boss" ? (4.2 + random() * 2.8) * cadenceMul : 999,
    cadenceMul: elite ? Math.max(0.66, cadenceMul - 0.04) : cadenceMul,
    rangedPressureMul: getRangedPressureMul(room, type, elite),
    windup: null,
    chargeMove: null,
    knockbackMove: null,
    slowTimer: 0,
    freezeTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    poisonTickTimer: 0,
    poisonDisplayDamage: 0,
    poisonDotStacks: 0,
    poisonOwnerId: null,
    venomTimer: 0,
    venomDps: 0,
    venomTickTimer: 0,
    venomDisplayDamage: 0,
    venomOwnerId: null,
    shamanHealLockUntil: 0,
    burnTimer: 0,
    burnDps: 0,
    burnTickTimer: 0,
    burnDisplayDamage: 0,
    burnOwnerId: null,
    vulnerableTimer: 0,
    weakenTimer: 0,
    barrier: 0,
    barrierTimer: 0,
    tauntTimer: 0,
    tauntTargetId: null,
    xp: Math.round(def.xp * xpScale * partyDifficulty.xpMul * (elite ? 2.05 : 1) * xpMul * bossXpMul * (1 + abyssDifficulty.depth * 0.06 + abyssDifficulty.ascension * 0.04))
  };
  room.enemies.push(enemy);
  if (room.status !== "lobby") {
    if (!Array.isArray(room.runDiscoveredMonsters)) room.runDiscoveredMonsters = [];
    if (!room.runDiscoveredMonsters.includes(enemy.type)) room.runDiscoveredMonsters.push(enemy.type);
    if (enemy.bossId) {
      if (!Array.isArray(room.runDiscoveredBosses)) room.runDiscoveredBosses = [];
      if (!room.runDiscoveredBosses.includes(enemy.bossId)) room.runDiscoveredBosses.push(enemy.bossId);
    }
  }
  return enemy;
}

function pickEliteAffix(type, random = Math.random) {
  if (type === "boss") return "bulwark";
  return ELITE_AFFIXES[Math.floor(random() * ELITE_AFFIXES.length)];
}

let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = Math.min(0.05, (now - lastTick) / 1000);
  lastTick = now;

  for (const room of rooms.values()) {
    if (room.players.size === 0 || getHumanPlayers(room).length === 0) {
      rooms.delete(room.code);
      continue;
    }
    updateRoom(room, dt, now);
    if (now - room.lastBroadcast > 1000 / STATE_RATE) {
      room.lastBroadcast = now;
      broadcastState(room);
    }
  }
}, 1000 / TICK_RATE);

function updateBots(room, dt, now) {
  const bots = getBotPlayers(room);
  if (!bots.length) return;

  for (const bot of bots) {
    const brain = ensureBotBrain(bot);
    if (room.status === "lobby") {
      bot.ready = true;
      updateBotCombatInput(room, bot, dt, now, true);
      continue;
    }

    if (room.status === "map") {
      resetBotInput(bot);
      if (!room.mapVotes?.[bot.id] && now >= brain.nextVoteAt) {
        const node = pickBotMapNode(room);
        if (node) chooseMapNode(room, bot, node.id);
        brain.nextVoteAt = now + 300 + Math.random() * 420;
      }
      continue;
    }

    if (room.status === "choice") {
      resetBotInput(bot);
      if (bot.choicePending && bot.choices.length > 0 && now >= brain.nextChoiceAt) {
        const choice = pickBestBotRelicChoice(bot);
        if (choice) chooseRelic(room, bot, choice.id);
        brain.nextChoiceAt = now + 220 + Math.random() * 280;
      }
      continue;
    }

    if (room.status === "advancement") {
      resetBotInput(bot);
      if (bot.pendingSkillChoices.length > 0 && now >= brain.nextChoiceAt) {
        const choice = pickBestBotSkillChoice(bot);
        if (choice) chooseSkillUpgrade(room, bot, choice.id);
        brain.nextChoiceAt = now + 220 + Math.random() * 280;
      }
      continue;
    }

    if (room.status === "risk") {
      resetBotInput(bot);
      if (room.hostId === bot.id && room.riskChoices?.length) {
        chooseRisk(room, bot, room.riskChoices[0].id);
      }
      continue;
    }

    if (room.status === "combat") {
      updateBotCombatInput(room, bot, dt, now, false);
    }
  }
}

function resetBotInput(bot) {
  botSystem.resetBotInput(bot);
}

function pickBotMapNode(room) {
  return botSystem.pickBotMapNode(getAvailableMapNodes(room), getNodeGameplayKind);
}

function pickBestBotRelicChoice(bot) {
  return botSystem.pickBestBotRelicChoice(bot);
}

function scoreBotRelicChoice(bot, choice) {
  return botSystem.scoreBotRelicChoice(bot, choice);
}

function pickBestBotSkillChoice(bot) {
  return botSystem.pickBestBotSkillChoice(bot);
}

function scoreBotSkillChoice(bot, choice) {
  return botSystem.scoreBotSkillChoice(bot, choice);
}

function updateBotCombatInput(room, bot, dt, now, lobbyMode) {
  const brain = ensureBotBrain(bot);
  if (bot.hp <= 0) {
    resetBotInput(bot);
    return;
  }

  const lethalSafeZone = !lobbyMode ? findBotLethalSafeZone(room, bot) : null;
  if (lethalSafeZone) {
    moveBotToLethalSafeZone(room, bot, lethalSafeZone, now);
    return;
  }

  const target = findBotPriorityTarget(room, bot, lobbyMode);
  const avoidance = getBotAvoidanceVector(room, bot);
  const survivalWeight = bot.classId === "warrior" ? 1.05 : 1.55;
  let moveX = avoidance.x * survivalWeight;
  let moveY = avoidance.y * survivalWeight;
  let aimX = bot.input.aimX;
  let aimY = bot.input.aimY;
  let attacking = false;

  if (target) {
    const point = getBotTargetPoint(target);
    aimX = point.x;
    aimY = point.y;
    const dx = point.x - bot.x;
    const dy = point.y - bot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;

    if (target.kind === "enemy") {
      const desired = getBotDesiredRange(bot, target.entity, lobbyMode);
      const closeRange = Math.max(58, desired * (bot.classId === "warrior" ? 0.42 : 0.62));
      if (dist > desired * 1.1) {
        moveX += nx;
        moveY += ny;
      } else if (dist < closeRange && bot.classId !== "warrior") {
        moveX -= nx * 1.1;
        moveY -= ny * 1.1;
      } else {
        const strafe = brain.strafeDir || 1;
        moveX += -ny * 0.38 * strafe;
        moveY += nx * 0.38 * strafe;
        if (Math.random() < dt * 0.45) brain.strafeDir = -strafe;
      }
      attacking = dist <= getBotAttackRange(bot, target.entity, lobbyMode);
      triggerBotSkills(room, bot, target.entity, dist, now, lobbyMode);
      triggerBotDash(room, bot, target.entity, dist, avoidance, now);
    } else {
      moveX += nx * 1.25;
      moveY += ny * 1.25;
    }
  } else if (!lobbyMode) {
    const center = room.stageObjective?.type === "defense" ? room.stageObjective : { x: room.world.w / 2, y: room.world.h / 2 };
    const dx = center.x - bot.x;
    const dy = center.y - bot.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > 95) {
      moveX += dx / dist;
      moveY += dy / dist;
    }
  }

  if (avoidance.forceDash && now >= brain.nextDashAt && canUseDash(bot)) {
    bot.input.dashSeq += 1;
    brain.nextDashAt = now + 420;
  }

  const moveLength = Math.hypot(moveX, moveY);
  bot.input.mx = moveLength > 0.08 ? clamp(moveX / moveLength, -1, 1) : 0;
  bot.input.my = moveLength > 0.08 ? clamp(moveY / moveLength, -1, 1) : 0;
  bot.input.aimX = clamp(aimX, 0, room.world.w);
  bot.input.aimY = clamp(aimY, 0, room.world.h);
  bot.input.attacking = attacking;
}

function findBotLethalSafeZone(room, bot) {
  const judgment = (room.hazards || []).find((hazard) =>
    !hazard.dead && hazard.type === "boss_field_judgment" && (hazard.armTime || 0) > 0
  );
  if (!judgment) return null;
  let best = null;
  let bestDistance = Infinity;
  for (const zone of room.hazards || []) {
    if (zone.dead || zone.type !== "boss_safe_zone" || zone.mechanicId !== judgment.mechanicId) continue;
    const current = distance(bot, zone);
    if (current < bestDistance) {
      best = zone;
      bestDistance = current;
    }
  }
  return best ? { zone: best, distance: bestDistance, timeLeft: judgment.armTime || 0 } : null;
}

function moveBotToLethalSafeZone(room, bot, safeZone, now) {
  const brain = ensureBotBrain(bot);
  const dx = safeZone.zone.x - bot.x;
  const dy = safeZone.zone.y - bot.y;
  const dist = Math.hypot(dx, dy) || 1;
  const safeInside = dist <= Math.max(24, safeZone.zone.radius * 0.58);
  bot.input.mx = safeInside ? 0 : clamp(dx / dist, -1, 1);
  bot.input.my = safeInside ? 0 : clamp(dy / dist, -1, 1);
  bot.input.aimX = safeZone.zone.x;
  bot.input.aimY = safeZone.zone.y;
  bot.input.attacking = false;
  if (!safeInside && safeZone.timeLeft < 1.15 && now >= brain.nextDashAt && canUseDash(bot)) {
    bot.input.dashSeq += 1;
    brain.nextDashAt = now + 420;
  }
}

function findBotPriorityTarget(room, bot, lobbyMode = false) {
  const chest = findNearestBotChest(room, bot);
  const enemy = findNearestBotEnemy(room, bot, lobbyMode);
  const xp = findNearestBotXp(room, bot);
  const healthPotion = !lobbyMode ? findNearestBotHealthPotion(room, bot) : null;
  const stageKind = getActiveStageKind(room);
  const hpRatio = bot.hp / Math.max(1, bot.maxHp);

  if (healthPotion && (hpRatio <= 0.35 || (hpRatio <= 0.62 && healthPotion.distance < 720))) {
    return { kind: "health_potion", entity: healthPotion.entity, distance: healthPotion.distance };
  }

  if (chest && (stageKind === "reward" || !enemy || enemy.distance > 260 || chest.distance < 110)) {
    return { kind: "chest", entity: chest.entity, distance: chest.distance };
  }
  if (xp && (xp.distance < 230 || (!enemy && xp.distance < 620) || (enemy && enemy.distance > 420 && xp.distance < 360))) {
    return { kind: "xp", entity: xp.entity, distance: xp.distance };
  }
  if (enemy) return { kind: "enemy", entity: enemy.entity, distance: enemy.distance };
  if (chest) return { kind: "chest", entity: chest.entity, distance: chest.distance };
  return null;
}

function getBotTargetPoint(target) {
  const entity = target.entity;
  return { x: entity.x, y: entity.y };
}

function findNearestBotChest(room, bot) {
  let best = null;
  let bestDistance = Infinity;
  for (const chest of room.relicChests || []) {
    if (chest.dead) continue;
    const current = distance(bot, chest);
    if (current < bestDistance) {
      best = chest;
      bestDistance = current;
    }
  }
  return best ? { entity: best, distance: bestDistance } : null;
}

function findNearestBotXp(room, bot) {
  let best = null;
  let bestDistance = Infinity;
  for (const orb of room.xpOrbs || []) {
    if (orb.dead) continue;
    const current = distance(bot, orb);
    if (current < bestDistance) {
      best = orb;
      bestDistance = current;
    }
  }
  return best ? { entity: best, distance: bestDistance } : null;
}

function findNearestBotHealthPotion(room, bot) {
  let best = null;
  let bestDistance = Infinity;
  for (const pickup of room.fieldPickups || []) {
    if (pickup.dead || pickup.type !== "health_potion") continue;
    const current = distance(bot, pickup);
    if (current < bestDistance) {
      best = pickup;
      bestDistance = current;
    }
  }
  return best ? { entity: best, distance: bestDistance } : null;
}

function findNearestBotEnemy(room, bot, lobbyMode = false) {
  let best = null;
  let bestScore = Infinity;
  let bestDistance = Infinity;
  for (const enemy of room.enemies || []) {
    if (enemy.hp <= 0) continue;
    if (!lobbyMode && enemy.trainingDummy) continue;
    const current = distance(bot, enemy);
    const score = current - getBotEnemyPriority(enemy) * 76 - (enemy.elite ? 96 : 0) - (enemy.blockadeRunner ? 130 : 0);
    if (score < bestScore) {
      best = enemy;
      bestScore = score;
      bestDistance = current;
    }
  }
  return best ? { entity: best, distance: bestDistance } : null;
}

function getBotEnemyPriority(enemy) {
  if (enemy.type === "boss") return 12;
  if (enemy.type === "shaman") return 10;
  if (enemy.type === "sniper" || enemy.type === "mortar") return 9;
  if (enemy.type === "spitter" || enemy.type === "stalker") return 8;
  if (enemy.type === "bomber" || enemy.type === "charger") return 7;
  if (enemy.type === "guardian") return 6;
  if (enemy.type === "brute" || enemy.type === "splitter") return 5;
  if (enemy.blockadeRunner) return 11;
  return 3;
}

function getBotDesiredRange(bot, enemy, lobbyMode = false) {
  if (enemy?.blockadeRunner) return 130;
  if (bot.classId === "warrior") return lobbyMode ? 170 : 105;
  if (bot.classId === "ranger") return 430;
  if (bot.classId === "mage") return 390;
  if (bot.classId === "engineer") return 360;
  if (bot.classId === "puppeteer") return 340;
  if (bot.classId === "martialist") return lobbyMode ? 150 : 118;
  if (bot.classId === "alchemist") return 390;
  if (bot.classId === "assassin") return lobbyMode ? 150 : 132;
  return 260;
}

function getBotAttackRange(bot, enemy, lobbyMode = false) {
  const def = classes[bot.classId] || classes.warrior;
  if (bot.classId === "warrior") return def.range * bot.rangeMul * bot.areaMul * (lobbyMode ? 1.9 : 1.35) + (enemy?.radius || 0);
  if (bot.classId === "martialist" || bot.classId === "assassin") {
    return def.range * bot.rangeMul * bot.areaMul * (lobbyMode ? 1.75 : 1.35) + (enemy?.radius || 0);
  }
  return def.range * bot.rangeMul + (enemy?.radius || 0) + 70;
}

function getBotAvoidanceVector(room, bot) {
  let x = 0;
  let y = 0;
  let forceDash = false;

  for (const hazard of room.hazards || []) {
    if (!hazard.hostile || hazard.dead) continue;
    if (hazard.type === "boss_field_judgment") continue;
    if (hazard.type === "boss_beam" || (hazard.length && hazard.width)) {
      const beam = getBotBeamAvoidance(bot, hazard);
      x += beam.x;
      y += beam.y;
      forceDash = forceDash || beam.forceDash;
      continue;
    }
    const dist = getDistanceToHazard(bot, hazard);
    const dangerRadius = (hazard.radius || hazard.width || 70) + 84;
    if (dist > dangerRadius) continue;
    const dx = bot.x - hazard.x;
    const dy = bot.y - hazard.y;
    const length = Math.hypot(dx, dy) || 1;
    const armed = !hazard.armTime || hazard.armTime <= 0;
    const weight = (1 - dist / dangerRadius) * (armed ? 2.4 : 1.4);
    x += (dx / length) * weight;
    y += (dy / length) * weight;
    if (armed || hazard.armTime < 0.32) forceDash = forceDash || dist < dangerRadius * 0.58;
  }

  for (const projectile of room.projectiles || []) {
    if (!projectile.hostile || projectile.dead) continue;
    const dist = distance(bot, projectile);
    if (dist > 138) continue;
    const dx = bot.x - projectile.x;
    const dy = bot.y - projectile.y;
    const length = Math.hypot(dx, dy) || 1;
    const weight = 1.2 * (1 - dist / 138);
    x += (dx / length) * weight;
    y += (dy / length) * weight;
    if (dist < 58 + (projectile.radius || 0)) forceDash = true;
  }

  const pressure = getBotArenaPressureVector(room, bot);
  x += pressure.x;
  y += pressure.y;
  forceDash = forceDash || pressure.forceDash;

  return { x, y, forceDash };
}

function getBotBeamAvoidance(bot, hazard) {
  const angle = hazard.angle || 0;
  const length = hazard.length || hazard.radius || 800;
  const startX = hazard.x;
  const startY = hazard.y;
  const endX = startX + Math.cos(angle) * length;
  const endY = startY + Math.sin(angle) * length;
  const nearest = nearestPointOnSegment(bot.x, bot.y, startX, startY, endX, endY);
  let dx = bot.x - nearest.x;
  let dy = bot.y - nearest.y;
  let dist = Math.hypot(dx, dy);
  const dangerRadius = (hazard.width || 34) + getPlayerCollisionRadius(bot) + 62;
  if (dist > dangerRadius) return { x: 0, y: 0, forceDash: false };
  if (dist < 1) {
    const side = ensureBotBrain(bot).strafeDir || 1;
    const canonicalAngle = ((angle % Math.PI) + Math.PI) % Math.PI;
    dx = -Math.sin(canonicalAngle) * side;
    dy = Math.cos(canonicalAngle) * side;
    dist = 1;
  }
  const timeLeft = Number.isFinite(hazard.armTime) ? hazard.armTime : 0;
  const urgency = timeLeft <= 0.48 ? 3.4 : timeLeft <= 0.85 ? 2.5 : 1.75;
  const weight = (1 - dist / dangerRadius) * urgency;
  return {
    x: (dx / dist) * weight,
    y: (dy / dist) * weight,
    forceDash: timeLeft <= 0.48 && dist < dangerRadius * 0.78
  };
}

function nearestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby || 1;
  const t = clamp(((px - ax) * abx + (py - ay) * aby) / lengthSq, 0, 1);
  return { x: ax + abx * t, y: ay + aby * t };
}

function getBotArenaPressureVector(room, bot) {
  const ranged = bot.classId !== "warrior" && bot.classId !== "martialist" && bot.classId !== "assassin";
  const edgeMargin = ranged ? 230 : 145;
  let x = 0;
  let y = 0;
  let edgeAxes = 0;
  if (bot.x < edgeMargin) {
    x += (edgeMargin - bot.x) / edgeMargin;
    edgeAxes += 1;
  } else if (bot.x > room.world.w - edgeMargin) {
    x -= (bot.x - (room.world.w - edgeMargin)) / edgeMargin;
    edgeAxes += 1;
  }
  if (bot.y < edgeMargin) {
    y += (edgeMargin - bot.y) / edgeMargin;
    edgeAxes += 1;
  } else if (bot.y > room.world.h - edgeMargin) {
    y -= (bot.y - (room.world.h - edgeMargin)) / edgeMargin;
    edgeAxes += 1;
  }

  let crowdX = 0;
  let crowdY = 0;
  let crowdCount = 0;
  const crowdRadius = ranged ? 340 : 245;
  for (const enemy of room.enemies || []) {
    if (enemy.hp <= 0) continue;
    const dx = bot.x - enemy.x;
    const dy = bot.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > crowdRadius) continue;
    const weight = 1 - dist / crowdRadius;
    crowdX += (dx / dist) * weight;
    crowdY += (dy / dist) * weight;
    crowdCount += 1;
  }
  const crowdThreshold = ranged ? 4 : 7;
  if (crowdCount >= crowdThreshold) {
    const crowdLength = Math.hypot(crowdX, crowdY) || 1;
    x += (crowdX / crowdLength) * (ranged ? 1.4 : 0.75);
    y += (crowdY / crowdLength) * (ranged ? 1.4 : 0.75);
    const centerDx = room.world.w * 0.5 - bot.x;
    const centerDy = room.world.h * 0.5 - bot.y;
    const centerLength = Math.hypot(centerDx, centerDy) || 1;
    x += (centerDx / centerLength) * (edgeAxes > 0 ? 1.5 : 0.45);
    y += (centerDy / centerLength) * (edgeAxes > 0 ? 1.5 : 0.45);
  }
  return {
    x,
    y,
    forceDash: ranged && crowdCount >= 6 && edgeAxes > 0
  };
}

function getDistanceToHazard(point, hazard) {
  if (hazard.length && hazard.width) {
    const angle = hazard.angle || 0;
    const endX = hazard.x + Math.cos(angle) * hazard.length;
    const endY = hazard.y + Math.sin(angle) * hazard.length;
    return distanceToSegment(point, hazard.x, hazard.y, endX, endY) - hazard.width;
  }
  return distance(point, hazard);
}

function triggerBotDash(room, bot, enemy, dist, avoidance, now) {
  const brain = ensureBotBrain(bot);
  if (!canUseDash(bot) || now < brain.nextDashAt) return;
  const closeThreat = enemy && bot.classId !== "warrior" && dist < getBotDesiredRange(bot, enemy) * 0.52;
  const warriorEngage = enemy && bot.classId === "warrior" && dist > 210 && dist < 430;
  const meleeEngage = enemy && (bot.classId === "martialist" || bot.classId === "assassin") && dist > 190 && dist < 520;
  if (!avoidance.forceDash && !closeThreat && !warriorEngage && !meleeEngage) return;

  if (closeThreat && Math.hypot(avoidance.x, avoidance.y) < 0.1) {
    bot.input.mx = clamp((bot.x - enemy.x) / Math.max(1, dist), -1, 1);
    bot.input.my = clamp((bot.y - enemy.y) / Math.max(1, dist), -1, 1);
  } else if (meleeEngage) {
    bot.input.mx = clamp((enemy.x - bot.x) / Math.max(1, dist), -1, 1);
    bot.input.my = clamp((enemy.y - bot.y) / Math.max(1, dist), -1, 1);
  }
  bot.input.dashSeq += 1;
  brain.nextDashAt = now + (bot.classId === "ranger" || bot.classId === "assassin" || bot.classId === "martialist" ? 260 : 520);
}

function triggerBotSkills(room, bot, enemy, dist, now, lobbyMode = false) {
  const brain = ensureBotBrain(bot);
  if (!enemy || now < brain.nextSkillAt) return;
  const slotOrder = getBotSkillOrder(bot);
  for (const slot of slotOrder) {
    if (!canTriggerSkillSlot(bot, slot)) continue;
    if (!shouldBotUseSkillSlot(room, bot, enemy, dist, slot, lobbyMode)) continue;
    bot.input.skillSeqs[slot] += 1;
    brain.nextSkillAt = now + 260 + Math.random() * 180;
    return;
  }
}

function getBotSkillOrder(bot) {
  if (bot.classId === "warrior") return ["r", "e", "f", "q"];
  if (bot.classId === "ranger") return ["r", "e", "f", "q"];
  if (bot.classId === "mage") return ["r", "f", "e", "q"];
  if (bot.classId === "engineer") return ["e", "r", "f", "q"];
  if (bot.classId === "puppeteer") return ["e", "r", "f", "q"];
  if (bot.classId === "martialist") return ["r", "e", "f", "q"];
  if (bot.classId === "alchemist") return ["e", "r", "f", "q"];
  if (bot.classId === "assassin") return ["e", "r", "f", "q"];
  return ["q", "e", "r", "f"];
}

function shouldBotUseSkillSlot(room, bot, enemy, dist, slot, lobbyMode) {
  const nearbySelf = countEnemiesNear(room, bot.x, bot.y, bot.classId === "warrior" ? 300 : 240);
  const nearbyTarget = countEnemiesNear(room, enemy.x, enemy.y, 180);

  if (bot.classId === "warrior") {
    if (slot === "r") return dist > 130 && dist < 520;
    if (slot === "e") return nearbySelf >= 2 || enemy.type === "boss";
    if (slot === "f") return dist < 360;
    return dist < 230 || lobbyMode;
  }
  if (bot.classId === "ranger") {
    if (slot === "r") return nearbyTarget >= 2 || enemy.type === "boss";
    if (slot === "e") return dist > 95 && dist < 820;
    if (slot === "f") return dist < 760;
    return dist < 760 || lobbyMode;
  }
  if (bot.classId === "mage") {
    if (slot === "e") return nearbySelf >= 2 || dist < 250;
    if (slot === "r") return dist < 760;
    if (slot === "f") return nearbyTarget >= 2 || enemy.type === "boss";
    return dist < 560 || lobbyMode;
  }
  if (bot.classId === "engineer") {
    if (slot === "e") return dist < 620;
    if (slot === "r") return dist < 420 || nearbySelf >= 2;
    if (slot === "f") return dist < 760;
    return dist < 660 || lobbyMode;
  }
  if (bot.classId === "puppeteer") {
    if (slot === "e") return dist < 620;
    if (slot === "r") return dist < 500 || nearbySelf >= 2;
    if (slot === "f") return enemy.type === "boss" || nearbyTarget >= 2;
    return dist < 620 || lobbyMode;
  }
  if (bot.classId === "martialist") {
    if (slot === "r") return dist > 95 && dist < 430;
    if (slot === "e") return dist < 360;
    if (slot === "f") return nearbySelf >= 2 || enemy.type === "boss";
    return dist < 230 || lobbyMode;
  }
  if (bot.classId === "alchemist") {
    if (slot === "e") return nearbyTarget >= 2 || enemy.type === "boss";
    if (slot === "r") return nearbyTarget >= 2 || enemy.type === "boss";
    if (slot === "f") return bot.hp < bot.maxHp * 0.72 || nearbySelf >= 2;
    return dist < 620 || lobbyMode;
  }
  if (bot.classId === "assassin") {
    if (slot === "e") return dist < 560;
    if (slot === "r") return dist > 80 && dist < 430;
    if (slot === "f") return nearbySelf >= 2 || bot.hp < bot.maxHp * 0.55;
    return dist < 260 || lobbyMode;
  }
  return slot === "q";
}

function countEnemiesNear(room, x, y, radius) {
  let count = 0;
  for (const enemy of room.enemies || []) {
    if (enemy.hp <= 0) continue;
    if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) count += 1;
  }
  return count;
}

function updateRoom(room, dt, now) {
  if (room.status === "gameover") {
    return;
  }

  if (room.paused) {
    if (room.status !== "combat" || getActivePlayers(room).length !== 1 || getBotPlayers(room).length > 0) {
      shiftPauseDeadlines(room, now - Number(room.pauseStartedAt || now));
      room.paused = false;
      room.pauseStartedAt = 0;
    } else {
      return;
    }
  }

  updateBots(room, dt, now);

  if (room.status === "choice") {
    updateRelicChoice(room, now);
    return;
  }

  if (room.status === "map") {
    updateMapChoice(room, now);
    return;
  }

  if (room.status === "risk") {
    return;
  }

  if (room.status === "advancement") {
    updateAdvancementChoice(room, now);
    return;
  }

  if (room.status === "lobby") {
    ensureLobbyTrainingArena(room);
  }

  for (const player of getActivePlayers(room)) {
    updatePlayer(room, player, dt, now);
  }

  updateProjectiles(room, dt);
  updateHazards(room, dt);
  for (const player of getActivePlayers(room)) {
    updateDeferredSkillCooldowns(room, player);
  }
  updateRelicChests(room);
  updateEnemies(room, dt, now);
  updateFieldPickups(room, dt);
  updateXpOrbs(room, dt);
  resolveCombatCollisions(room);

  room.enemies = room.enemies.filter((enemy) => enemy.hp > 0);
  room.projectiles = projectileSystem.filterLiveProjectiles(room.projectiles);
  room.hazards = hazardSystem.filterLiveHazards(room.hazards);
  room.relicChests = room.relicChests.filter((chest) => !chest.dead);
  room.xpOrbs = room.xpOrbs.filter((orb) => !orb.dead);
  room.fieldPickups = (room.fieldPickups || []).filter((pickup) => !pickup.dead);
  updateReinforcements(room, now);
  updateStageObjective(room, dt, now);
  if (room.survival?.active) updateSurvivalMode(room, dt, now);
  if (room.status === "gameover") return;

  if (isStageObjectiveFailed(room)) {
    finishRun(room, "defeat", getStageObjectiveFailureReason(room));
    return;
  }

  if (room.status === "combat" && !room.survival?.active && isStageClearReady(room)) {
    completeWave(room);
  }

  const livingPlayers = getActiveLivingPlayers(room);
  if (room.status === "combat" && livingPlayers.length === 0) {
    if (room.survival?.finalBossDefeated) {
      finishRun(room, "victory", "9분 생존 성공. 운명의 집행자에게 최후를 맞았습니다.");
    } else {
      finishRun(room, "defeat", `${Math.floor(room.survival?.elapsed || 0)}초 생존 후 파티가 전멸했습니다.`);
    }
  }
}

function updateStageObjective(room, dt, now) {
  const objective = room.stageObjective;
  if (!objective || room.status !== "combat") return;

  if (objective.type === "blockade") {
    spawnBlockadeRunners(room, objective, now);
    return;
  }

  if (objective.type === "defense") {
    updateDefenseObjectiveDamage(room, objective, dt);
  }

  if (objective.type === "reward") {
    objective.remaining = (room.relicChests || []).filter((chest) => !chest.dead).length;
  }
}

function spawnBlockadeRunners(room, objective, now) {
  while (objective.spawned < objective.total && now >= objective.nextSpawnAt) {
    const type = pickBlockadeRunnerType(room, objective);
    const laneTop = Number.isFinite(objective.laneTop) ? objective.laneTop : 150;
    const laneBottom = Number.isFinite(objective.laneBottom) ? objective.laneBottom : room.world.h - 150;
    const laneCount = Math.max(3, objective.laneCount || 4);
    const lane = objective.spawned % laneCount;
    const y = laneTop + lane * ((laneBottom - laneTop) / Math.max(1, laneCount - 1)) + (Math.random() - 0.5) * 24;
    const enemy = spawnEnemy(room, type, {
      x: room.world.w - 42,
      y: clamp(y, laneTop + 24, laneBottom - 24),
      scale: type === "runner_tank" ? 1.04 : 1
    });
    if (enemy) {
      enemy.blockadeRunner = true;
      enemy.goalX = objective.goalX || 58;
      enemy.damage = 0;
      enemy.attackTimer = 999;
      enemy.specialTimer = 999;
      enemy.xp = Math.max(3, Math.round(enemy.xp * 0.55));
    }
    objective.spawned += 1;
    objective.nextSpawnAt += objective.spawnGapMs;
  }
}

function pickBlockadeRunnerType(room, objective) {
  const progress = objective.total > 0 ? objective.spawned / objective.total : 0;
  const weights = [
    ["runner", 0.56],
    ["runner_tank", 0.18 + progress * 0.12 + Math.max(0, room.floor - 1) * 0.04],
    ["runner_fast", 0.22 + progress * 0.1]
  ];
  return pickWeightedEnemyType(weights) || "runner";
}

function updateDefenseObjectiveDamage(room, objective, dt) {
  if (!objective || objective.hp <= 0) return;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.dead || enemy.trainingDummy || enemy.blockadeRunner) continue;
    enemy.objectiveAttackTimer = Math.max(0, (enemy.objectiveAttackTimer || 0) - dt);
    if (!enemy.focusingDefenseObjective) continue;
    if (enemy.objectiveAttackTimer > 0) continue;
    if (distance(enemy, objective) > enemy.radius + (objective.radius || 42) + 22) continue;
    damageDefenseObjective(room, objective, enemy);
  }
}

function damageDefenseObjective(room, objective, enemy, multiplier = getDefenseObjectiveDamageMultiplier(enemy), options = {}) {
  if (!objective || objective.type !== "defense" || objective.hp <= 0 || !enemy || enemy.hp <= 0) return;
  const baseDamage = Number.isFinite(enemy.damage) ? enemy.damage : 8;
  const damage = Math.max(options.minDamage ?? 4, baseDamage * multiplier);
  const previousHp = objective.hp;
  objective.hp = Math.max(0, objective.hp - damage);
  enemy.objectiveAttackTimer = (options.cooldown ?? (enemy.elite ? 0.72 : 0.95)) * Math.max(0.72, enemy.cadenceMul || 1);
  addEffect(room, "impact", objective.x, objective.y, {
    color: options.color || "#7fa671",
    radius: options.radius || (objective.radius || 42) + 18,
    style: options.style || "defense_hit"
  });

  const previousPushbackCount = Math.max(0, Math.min(2, Math.floor(objective.pushbackCount || 0)));
  const nextPushbackCount = enemySystem.getDefensePushbackTriggerCount(
    previousHp,
    objective.hp,
    objective.maxHp,
    previousPushbackCount
  );
  if (nextPushbackCount > previousPushbackCount) {
    objective.pushbackCount = nextPushbackCount;
    triggerDefenseObjectivePushback(room, objective, nextPushbackCount);
  }
}

function triggerDefenseObjectivePushback(room, objective, triggerCount) {
  let pushedEnemies = 0;
  for (const target of room.enemies) {
    if (target.hp <= 0 || target.dead || target.trainingDummy || target.blockadeRunner) continue;
    const push = enemySystem.getDefenseWallPush(room.world, objective, target, MAP_EDGE_WALL_THICKNESS);
    if (!Number.isFinite(push.distance) || push.distance <= 2) continue;

    target.windup = null;
    target.chargeMove = null;
    target.focusingDefenseObjective = false;
    target.objectiveAttackTimer = Math.max(target.objectiveAttackTimer || 0, 1.1);
    target.attackTimer = Math.max(target.attackTimer || 0, 0.65);
    target.specialTimer = Math.max(target.specialTimer || 0, 0.65);
    startEnemyKnockback(room, target, push.dirX, push.dirY, push.distance, {
      replace: true,
      interruptCharge: true,
      maxDistance: Math.hypot(room.world.w, room.world.h),
      duration: clamp(push.distance / 1450, 0.32, 0.78),
      style: "defense_ward_push"
    });
    pushedEnemies += 1;
  }

  addEffect(room, "shield", objective.x, objective.y, {
    color: "#86efac",
    radius: 120,
    style: "defense_ward_push",
    duration: 0.78
  });
  addEffect(room, "impact", objective.x, objective.y, {
    color: "#dcfce7",
    radius: 280,
    style: "defense_ward_push",
    heavy: true,
    duration: 0.72
  });
  const thresholdLabel = triggerCount >= 2 ? "1/3" : "2/3";
  pushEvent(room, `수호 장치 체력 ${thresholdLabel}. 충격파가 적 ${pushedEnemies}명을 외벽까지 밀어냈습니다.`);
}

function getDefenseObjectiveDamageMultiplier(enemy) {
  if (enemy.type === "brute") return enemy.elite ? 0.54 : 0.46;
  if (enemy.type === "charger") return enemy.elite ? 0.5 : 0.4;
  if (enemy.type === "guardian") return enemy.elite ? 0.46 : 0.36;
  if (enemy.type === "bat") return enemy.elite ? 0.34 : 0.27;
  if (enemy.type === "bomber") return enemy.elite ? 0.48 : 0.38;
  return enemy.elite ? 0.42 : 0.32;
}

function getDefenseObjectiveAttackReach(enemy) {
  if (enemy.type === "brute") return 34;
  if (enemy.type === "guardian") return 28;
  if (enemy.type === "bat") return 14;
  if (enemy.type === "charger") return 24;
  return 22;
}

function updateBlockadeRunner(room, enemy, dt) {
  const objective = room.stageObjective;
  const goalX = enemy.goalX || objective?.goalX || 58;
  const laneTop = Number.isFinite(objective?.laneTop) ? objective.laneTop : 40;
  const laneBottom = Number.isFinite(objective?.laneBottom) ? objective.laneBottom : room.world.h - 40;
  const speedMul = enemy.slowTimer > 0 ? 0.52 : 1;
  enemy.x = clamp(enemy.x - enemy.speed * speedMul * dt, 20, room.world.w - 20);
  enemy.y = clamp(enemy.y + Math.sin(Date.now() / 260 + enemy.aiPhase) * 8 * dt, laneTop + enemy.radius + 4, laneBottom - enemy.radius - 4);
  if (enemy.x <= goalX) {
    enemy.dead = true;
    enemy.hp = 0;
    if (objective && objective.type === "blockade") {
      objective.leaked = (objective.leaked || 0) + 1;
      addEffect(room, "warning", goalX, enemy.y, {
        color: "#c85d56",
        radius: 64,
        style: "bomber_explode",
        duration: 0.34
      });
      pushEvent(room, `Runner leaked (${objective.leaked}/${objective.leakLimit}).`);
    }
  }
}

function isStageObjectiveFailed(room) {
  const objective = room.stageObjective;
  if (!objective) return false;
  if (objective.type === "defense") return objective.hp <= 0;
  if (objective.type === "blockade") return (objective.leaked || 0) >= (objective.leakLimit || 1);
  return false;
}

function getStageObjectiveFailureReason(room) {
  const objective = room.stageObjective;
  if (objective?.type === "defense") return "Defense target was destroyed.";
  if (objective?.type === "blockade") return "Too many runners reached the gate.";
  return "Stage objective failed.";
}

function isStageClearReady(room) {
  const objective = room.stageObjective;
  const hostileAttackInFlight =
    room.projectiles.some((projectile) => projectile.hostile && !projectile.dead) ||
    room.hazards.some((hazard) => hazard.hostile && !hazard.dead && hazard.type === "mortar_blast");
  const noEnemies =
    room.enemies.length === 0 &&
    (!room.pendingReinforcements || room.pendingReinforcements.length === 0) &&
    !hostileAttackInFlight;
  if (!objective) return noEnemies;
  if (objective.type === "reward") {
    return noEnemies && (room.relicChests || []).filter((chest) => !chest.dead).length === 0;
  }
  if (objective.type === "blockade") {
    return objective.spawned >= objective.total && noEnemies;
  }
  return noEnemies;
}

function updatePlayer(room, player, dt, now) {
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  for (const slot of SKILL_SLOTS) {
    player.skillTimers[slot] = Math.max(0, player.skillTimers[slot] - dt);
  }
  updateEngineerMineCharges(player);
  updateEngineerAutoMine(room, player, dt);
  updateWarriorChargeChain(player, dt);
  player.engineerMechaTimer = Math.max(0, (player.engineerMechaTimer || 0) - dt);
  updateDashAvailability(player, dt);
  player.dashSpeedTimer = Math.max(0, (player.dashSpeedTimer || 0) - dt);
  if (player.dashSpeedTimer <= 0) player.dashSpeedMul = 1;
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  player.tauntGuardTimer = Math.max(0, (player.tauntGuardTimer || 0) - dt);
  player.immunityTimer = Math.max(0, player.immunityTimer - dt);
  player.hitIFrameTimer = Math.max(0, (player.hitIFrameTimer || 0) - dt);
  player.comboTimer = Math.max(0, (player.comboTimer || 0) - dt);
  if (player.comboTimer <= 0) player.comboCounter = 0;
  player.martialChiTimer = Math.max(0, (player.martialChiTimer || 0) - dt);
  player.martialFlowTimer = Math.max(0, (player.martialFlowTimer || 0) - dt);
  if (player.martialChiTimer <= 0) player.martialChi = 0;
  player.stealthTimer = Math.max(0, (player.stealthTimer || 0) - dt);
  if (player.shieldTimer <= 0) player.shield = 0;
  updateEquipmentPassives(room, player, dt);

  if (player.poisonTimer > 0 && player.immunityTimer <= 0) {
    const activeWindow = player.poisonTimer;
    player.poisonTimer = Math.max(0, player.poisonTimer - dt);
    player.poisonTickTimer = Math.max(0, (player.poisonTickTimer || 0) - dt);
    if (player.poisonTickTimer <= 0) {
      const tickWindow = Math.min(PLAYER_POISON_TICK_INTERVAL, activeWindow);
      damagePlayer(room, player, player.poisonDps * tickWindow, player.poisonOwnerId, player.x, player.y, {
        poison: true,
        damageType: "poison_tick"
      });
      player.poisonTickTimer = PLAYER_POISON_TICK_INTERVAL;
    }
    if (player.poisonTimer <= 0) clearPlayerPoison(player);
  }

  if (player.hp <= 0) {
    player.vx = 0;
    player.vy = 0;
    return;
  }

  updateMageFrostBreathAura(room, player, dt);

  const def = classes[player.classId];
  if (player.knockbackMove) {
    updatePlayerKnockback(room, player, dt);
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
    return;
  }

  if (player.dashMove) {
    updatePlayerDashMove(room, player, dt, now);
    player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
    return;
  }

  const length = Math.hypot(player.input.mx, player.input.my) || 1;
  const mx = player.input.mx / length;
  const my = player.input.my / length;
  const speed = def.speed * player.speedMul * (player.dashSpeedMul || 1) * getEngineerMechaMoveMultiplier(player);
  const prevX = player.x;
  const prevY = player.y;

  movePlayerBy(room, player, mx * speed * dt, my * speed * dt);
  updatePlayerVelocity(player, prevX, prevY, dt);
  player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);

  const canUseCombatActions = room.status === "combat" || room.status === "lobby";
  if (!canUseCombatActions) {
    syncPlayerInputSequences(player);
    return;
  }

  if (room.status === "combat" && player.inputGraceUntil && now < player.inputGraceUntil) {
    syncPlayerInputSequences(player);
    return;
  }
  player.inputGraceUntil = 0;

  if (player.input.dashSeq !== player.lastDashSeq) {
    player.lastDashSeq = player.input.dashSeq;
    if (canUseDash(player)) {
      runWithEffectOwner(room, player.id, () => performDash(room, player, now));
      consumeDashCharge(player);
    }
  }

  const adaptiveMechaLaserActive = Boolean(
    player.input.attacking &&
    !player.primaryDisabled &&
    player.classId === "engineer" &&
    player.engineerMechaModule &&
    isEngineerMechaActive(player)
  );
  if (adaptiveMechaLaserActive) {
    const adaptiveDef = {
      ...def,
      damage: def.damage * Math.max(1, player.basicAttackDamageMul || 1)
    };
    runWithEffectOwner(room, player.id, () => updateAdaptiveMechaContinuousLaser(room, player, adaptiveDef, dt));
  } else {
    player.adaptiveMechaLaserTick = 0;
    player.adaptiveMechaLaserVisualTick = 0;
  }

  if (!adaptiveMechaLaserActive && player.input.attacking && player.attackTimer <= 0 && !player.primaryDisabled) {
    runWithEffectOwner(room, player.id, () => performAttack(room, player, now));
    player.attackTimer = def.attackCd * player.cooldownMul * getAttackCooldownMultiplier(player);
  }

  for (const slot of SKILL_SLOTS) {
    if (player.input.skillSeqs[slot] !== player.lastSkillSeqs[slot]) {
      player.lastSkillSeqs[slot] = player.input.skillSeqs[slot];
      if (canTriggerSkillSlot(player, slot)) {
        runWithEffectOwner(room, player.id, () => performSkill(room, player, slot, now));
        applySkillCooldown(player, slot);
      }
    }
  }
}

function updateMageFrostBreathAura(room, player, dt) {
  if (player.classId !== "mage" || !hasUpgrade(player, "mage_frost_echo")) {
    player.mageFrostBreathTick = 0;
    return;
  }

  player.mageFrostBreathTick = Math.max(0, (player.mageFrostBreathTick || 0) - dt);
  if (player.mageFrostBreathTick > 0) return;

  const radius = 142 * (player.areaMul || 1);
  const flameBreath = Boolean(player.mageFlameWave);
  let touched = false;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance(player, enemy) > radius + enemy.radius) continue;
    if (flameBreath) {
      applyBurnToEnemy(room, enemy, player.id, getPlayerAttackDamage(player, "mage") * 0.12, {
        duration: 1.1,
        totalDamageRatio: 0.18,
        attackDamageRatio: 0.2
      });
    } else {
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.72);
    }
    touched = true;
  }

  addEffect(room, "slow", player.x, player.y, {
    color: flameBreath ? "#fb923c" : "#93c5fd",
    radius,
    rangeRadius: radius,
    ownerId: player.id,
    style: flameBreath ? "flame_breath_aura" : "frost_breath_aura",
    duration: 0.72,
    passive: true,
    active: touched
  });
  player.mageFrostBreathTick = 0.48;
}

function syncPlayerInputSequences(player) {
  player.lastDashSeq = player.input.dashSeq;
  for (const slot of SKILL_SLOTS) {
    player.lastSkillSeqs[slot] = player.input.skillSeqs[slot];
  }
}

function performDash(room, player, now) {
  const def = classes[player.classId];
  const profile = getDashProfile(player);
  const moveLength = Math.hypot(player.input.mx, player.input.my);
  const aim = getAimVector(player);
  const dir =
    moveLength > 0.15
      ? { x: player.input.mx / moveLength, y: player.input.my / moveLength }
      : aim;
  const startX = player.x;
  const startY = player.y;
  const dashDistance = getDashDistance(player);
  const endpoint = getBoundedDashEndpoint(room, startX, startY, dir.x, dir.y, dashDistance, 32);
  const wallEndpoint = getMapBoundedMovementEndpoint(room, player, endpoint.x - startX, endpoint.y - startY, 32, getPlayerCollisionRadius(player));
  const endX = wallEndpoint.x;
  const endY = wallEndpoint.y;
  const actualDistance = Math.hypot(endX - startX, endY - startY);
  const dashDuration = getPlayerDashDuration(player, actualDistance);
  player.lastDashAt = now;

  if (actualDistance < 6) {
    addEffect(room, "impact", startX, startY, {
      color: classes[player.classId].color,
      radius: 26,
      style: "wall_bump"
    });
    return;
  }

  addEffect(room, "dash", (startX + endX) / 2, (startY + endY) / 2, {
    angle: Math.atan2(dir.y, dir.x),
    color: classes[player.classId].color,
    radius: Math.max(28, actualDistance * 0.55),
    style: profile.style,
    fromX: round2(startX),
    fromY: round2(startY),
    toX: round2(endX),
    toY: round2(endY),
    moveDuration: round2(dashDuration)
  });

  if (player.classId === "mage") {
    movePlayerBy(room, player, endX - startX, endY - startY);
    updatePlayerVelocity(player, startX, startY, 0.16);
    player.immunityTimer = Math.max(player.immunityTimer, 0.58);
    addEffect(room, "arcane", startX, startY, { color: classes.mage.color, radius: 74, style: "blink_depart" });
    addEffect(room, "arcane", player.x, player.y, { color: classes.mage.color, radius: 96, style: "blink_arrive" });
    return;
  }

  const dashOptions =
    player.classId === "warrior"
      ? {
          contactRadius: 58,
          damageMul: 1.15,
          knockback: 280,
          pushScale: 1.65,
          impactScale: 1.22
        }
      : player.classId === "martialist"
        ? {
            contactRadius: 46 * player.areaMul,
            damageMul: 0.82,
            knockback: 128,
            impactScale: 0.82
          }
        : player.classId === "assassin"
          ? {
              contactRadius: 38 * player.areaMul,
              damageMul: 0.7,
              knockback: 64,
              impactScale: 0.76
            }
          : {};

  beginPlayerDashMove(room, player, dir, startX, startY, endX, endY, actualDistance, profile.style, dashOptions);
}

function beginPlayerDashMove(room, player, dir, startX, startY, endX, endY, dashDistance, style, options = {}) {
  const duration = options.duration || getPlayerDashDuration(player, dashDistance);
  player.dashMove = {
    classId: player.classId,
    style,
    startX,
    startY,
    x: endX,
    y: endY,
    dirX: dir.x,
    dirY: dir.y,
    elapsed: 0,
    duration,
    contactRadius: options.contactRadius || 38,
    gatherRadius: options.gatherRadius || options.contactRadius || 38,
    damageMul: options.damageMul || 0.86,
    knockback: options.knockback || 180,
    pushScale: options.pushScale || 1,
    pushMaxDistance: options.pushMaxDistance || 0,
    gather: Boolean(options.gather),
    collisionBurst: Boolean(options.collisionBurst),
    gatherScale: options.gatherScale || 1,
    impactScale: options.impactScale || 1.04,
    carriedEnemies: [],
    hitIds: []
  };

  if (player.classId === "warrior") player.immunityTimer = Math.max(player.immunityTimer, duration + 0.08);

  if (player.classId === "ranger") {
    player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.22);
    player.dashSpeedTimer = Math.max(player.dashSpeedTimer || 0, 1.25);
    player.immunityTimer = Math.max(player.immunityTimer, duration + 0.03);
    addEffect(room, "shot", endX - dir.x * 20, endY - dir.y * 20, {
      angle: Math.atan2(dir.y, dir.x),
      color: classes.ranger.color,
      radius: 54,
      style: "ranger_dash_ready"
    });
  }

  if (player.classId === "martialist") {
    player.comboTimer = Math.max(player.comboTimer || 0, 2.6);
    player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.16);
    player.dashSpeedTimer = Math.max(player.dashSpeedTimer || 0, 0.95);
    player.immunityTimer = Math.max(player.immunityTimer, duration + 0.02);
  }

  if (player.classId === "assassin") {
    player.stealthTimer = Math.max(player.stealthTimer || 0, 0.62);
    player.immunityTimer = Math.max(player.immunityTimer, duration + 0.04);
  }
}

function getPlayerDashDuration(player, dashDistance) {
  if (player.classId === "warrior") return clamp(dashDistance / 820, 0.16, 0.22);
  if (player.classId === "ranger") return clamp(dashDistance / 1350, 0.13, 0.18);
  if (player.classId === "martialist") return clamp(dashDistance / 1220, 0.13, 0.18);
  if (player.classId === "assassin") return clamp(dashDistance / 1420, 0.11, 0.16);
  return clamp(dashDistance / 1050, 0.14, 0.2);
}

function updatePlayerDashMove(room, player, dt) {
  const dash = player.dashMove;
  if (!dash) return;

  const prevX = player.x;
  const prevY = player.y;
  dash.elapsed = Math.min(dash.duration, dash.elapsed + dt);
  const progress = clamp(dash.elapsed / Math.max(0.01, dash.duration), 0, 1);
  const eased = dash.style === "shield_charge" ? chargeEase(progress) : 1 - Math.pow(1 - progress, 2);
  const targetX = clamp(dash.startX + (dash.x - dash.startX) * eased, 32, room.world.w - 32);
  const targetY = clamp(dash.startY + (dash.y - dash.startY) * eased, 32, room.world.h - 32);

  movePlayerBy(room, player, targetX - player.x, targetY - player.y);
  updatePlayerVelocity(player, prevX, prevY, dt);

  if (dash.classId === "warrior") {
    applyWarriorDashContacts(room, player, dash, prevX, prevY);
    updateWarriorDashCarriedEnemies(room, player, dash, progress, dt);
  }
  if (dash.classId === "martialist") {
    applyMartialDashContacts(room, player, dash, prevX, prevY);
  }
  if (dash.classId === "assassin") {
    applyAssassinDashContacts(room, player, dash, prevX, prevY);
  }

  if (progress >= 1) {
    player.dashMove = null;
  }
}

function applyWarriorDashContacts(room, player, dash, prevX, prevY) {
  const def = classes.warrior;
  const dir = { x: dash.dirX, y: dash.dirY };
  const contactRadius = dash.contactRadius || 38;
  const gatherRadius = Math.max(contactRadius, dash.gatherRadius || contactRadius);
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const pathDistance = distanceToSegment(enemy, prevX, prevY, player.x, player.y);
    const withinContact = pathDistance <= enemy.radius + contactRadius;
    const alreadyHit = dash.hitIds.includes(enemy.id);
    const alreadyGathered = dash.carriedEnemies.some((carry) => carry.id === enemy.id);

    if (withinContact && !alreadyHit) {
      dash.hitIds.push(enemy.id);
      const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.86), player.id);
      if (dealt > 0) {
        if (dash.gather) {
          if (!alreadyGathered && enemy.hp > 0) applyWarriorDashGather(room, player, enemy, dash, dir);
          addMeleeImpact(room, enemy, "shield_gather", dash.impactScale || 1.04);
        } else {
          const pushDir = getWarriorDashPushDirection(enemy, prevX, prevY, player.x, player.y, dir, dash.style === "shield_charge");
          applyWarriorDashPush(room, player, enemy, pushDir, dash.pushScale || 1, {
            collisionBurst: dash.collisionBurst,
            ownerId: player.id,
            maxDistance: dash.pushMaxDistance || 0
          });
          addMeleeImpact(room, enemy, "shield_slam", dash.impactScale || 1.04);
        }
      }
    }

    if (
      dash.gather &&
      enemy.hp > 0 &&
      enemy.type !== "boss" &&
      !dash.carriedEnemies.some((carry) => carry.id === enemy.id) &&
      pathDistance <= enemy.radius + gatherRadius
    ) {
      applyWarriorDashGather(room, player, enemy, dash, dir);
    }
  }
}

function triggerWarriorChargeCollision(room, player, enemy, collidedEnemy = null) {
  if (!player || player.hp <= 0 || !enemy || enemy.hp <= 0) return;
  const bonusDamage = getPlayerAttackDamage(player, "warrior") * 1.45;
  dealDamage(room, enemy, bonusDamage, player.id, { skillTag: "warrior_collision_charge", noVulnerable: true });
  if (collidedEnemy?.hp > 0) {
    dealDamage(room, collidedEnemy, bonusDamage * 0.72, player.id, { skillTag: "warrior_collision_charge", noVulnerable: true });
  }
  addEffect(room, "explosion", enemy.x, enemy.y, {
    color: classes.warrior.color,
    radius: 96 * (player.areaMul || 1),
    style: "warrior_charge_collision"
  });
}

function updateEquipmentPassives(room, player, dt) {
  if (!player || player.hp <= 0) return;

  if ((player.projectileShieldMaxCharges || 0) > 0 && (player.projectileShieldCharges || 0) <= 0) {
    player.projectileShieldRespawnTimer = Math.max(0, (player.projectileShieldRespawnTimer || 0) - dt);
    if (player.projectileShieldRespawnTimer <= 0) {
      player.projectileShieldCharges = player.projectileShieldMaxCharges;
      addEffect(room, "shield", player.x, player.y, {
        color: "#67e8f9",
        radius: 72,
        style: "equipment_projectile_aegis_restore"
      });
    }
  }

  if ((player.periodicShieldRatio || 0) > 0) {
    player.periodicShieldTimer = Math.max(0, (player.periodicShieldTimer || 0) - dt);
    if (player.periodicShieldTimer <= 0) {
      const shield = Math.max(18, Math.round(player.maxHp * player.periodicShieldRatio));
      player.shield = Math.max(player.shield || 0, shield);
      player.shieldTimer = Math.max(player.shieldTimer || 0, 8);
      player.periodicShieldTimer = 12;
      addEffect(room, "shield", player.x, player.y, {
        value: shield,
        color: "#93c5fd",
        radius: 62,
        style: "equipment_periodic_shield"
      });
    }
  }

  const activeInTraining = room.status === "lobby" && room.enemies.some((enemy) => enemy.trainingDummy);
  const canSpawn = room.status === "combat" || activeInTraining;
  ensureEquipmentDrone(room, player, "common_gear_drone", Boolean(player.commonDrone), Math.PI * 0.35, canSpawn);
  ensureEquipmentDrone(room, player, "permanent_engineer_drone", Boolean(player.engineerPermanentDrone && player.classId === "engineer"), -Math.PI * 0.35, canSpawn);
  if (!canSpawn) return;
}

function ensureEquipmentDrone(room, player, gearDroneType, enabled, phase, canSpawn) {
  const existing = room.hazards.find((hazard) => hazard.ownerId === player.id && hazard.gearDroneType === gearDroneType && !hazard.dead);
  if (!enabled) {
    if (existing) existing.dead = true;
    return;
  }
  if (existing || !canSpawn) return;
  deployEngineerDrone(room, player, classes.engineer, phase);
  const drone = room.hazards[room.hazards.length - 1];
  if (!drone || drone.type !== "engineer_drone") return;
  drone.gearDroneType = gearDroneType;
  drone.timer = 999999;
  drone.kamikaze = false;
  drone.style = gearDroneType === "common_gear_drone" ? "drone_support_gear" : "drone_permanent";
}

function applyWarriorDashGather(room, player, enemy, dash, dir) {
  if (enemy.type === "boss") return;
  const contactRadius = Math.max(44, dash.contactRadius || 70);
  const endX = Number.isFinite(dash.x) ? dash.x : player.x;
  const endY = Number.isFinite(dash.y) ? dash.y : player.y;
  const endBackOffset = Math.min(24, contactRadius * 0.18);
  const targetX = clamp(endX - dir.x * endBackOffset, 40, room.world.w - 40);
  const targetY = clamp(endY - dir.y * endBackOffset, 40, room.world.h - 40);
  const side = dash.carriedEnemies.length % 2 === 0 ? -1 : 1;
  const lane = Math.ceil((dash.carriedEnemies.length + 1) / 2);
  const sideOffset = Math.min(42, 16 + lane * 7);
  const carry = {
    id: enemy.id,
    targetX,
    targetY,
    sideX: -dir.y * side * sideOffset,
    sideY: dir.x * side * sideOffset
  };
  dash.carriedEnemies.push(carry);
  enemy.windup = enemy.windup?.kind === "bomber_explode" ? enemy.windup : null;
  enemy.chargeMove = null;
  enemy.knockbackMove = null;
  updateWarriorDashCarriedEnemy(room, enemy, carry, dash);
}

function updateWarriorDashCarriedEnemies(room, player, dash, progress, dt) {
  if (!dash.gather || !Array.isArray(dash.carriedEnemies) || dash.carriedEnemies.length === 0) return;
  for (const carry of dash.carriedEnemies) {
    const enemy = room.enemies.find((candidate) => candidate.id === carry.id);
    if (!enemy || enemy.hp <= 0) continue;
    updateWarriorDashCarriedEnemy(room, enemy, carry, dash, progress, dt);
  }
}

function updateWarriorDashCarriedEnemy(room, enemy, carry, dash, progressOverride, dtOverride) {
  const progress = Number.isFinite(progressOverride)
    ? progressOverride
    : clamp((dash.elapsed || 0) / Math.max(0.01, dash.duration || 0.34), 0, 1);
  const dt = Number.isFinite(dtOverride) ? dtOverride : 1 / TICK_RATE;
  const shieldOffset = Math.min(38, Math.max(18, (dash.contactRadius || 70) * 0.24));
  const frontX = clamp(
    dash.startX + (dash.x - dash.startX) * progress + dash.dirX * shieldOffset,
    40,
    room.world.w - 40
  );
  const frontY = clamp(
    dash.startY + (dash.y - dash.startY) * progress + dash.dirY * shieldOffset,
    40,
    room.world.h - 40
  );
  const endBias = clamp(progress * 0.72, 0, 0.72);
  const followX = frontX * (1 - endBias) + (carry.targetX + carry.sideX) * endBias;
  const followY = frontY * (1 - endBias) + (carry.targetY + carry.sideY) * endBias;
  const finalSnap = progress >= 0.98;
  const targetX = finalSnap ? carry.targetX + carry.sideX : followX;
  const targetY = finalSnap ? carry.targetY + carry.sideY : followY;
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const maxStep = finalSnap ? Math.hypot(dx, dy) : Math.max(34, 1320 * dt * (dash.gatherScale || 1));
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.5) return;
  const step = Math.min(dist, maxStep);
  enemy.knockbackMove = null;
  moveEnemyBy(room, enemy, (dx / dist) * step, (dy / dist) * step);
  if (enemy.trainingDummy) {
    enemy.dummyReturnCooldown = Math.max(enemy.dummyReturnCooldown || 0, (dash.duration || 0.34) + 0.8);
  }
}

function applyMartialDashContacts(room, player, dash, prevX, prevY) {
  const def = classes.martialist;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || dash.hitIds.includes(enemy.id)) continue;
    if (distanceToSegment(enemy, prevX, prevY, player.x, player.y) > enemy.radius + (dash.contactRadius || 42)) continue;
    dash.hitIds.push(enemy.id);
    const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.82), player.id, {
      noVulnerable: true
    });
    if (dealt > 0) {
      startEnemyKnockback(room, enemy, enemy.x - player.x, enemy.y - player.y, dash.knockback || 118, {
        duration: 0.16,
        maxDistance: 140,
        style: "hit_knockback",
        interruptCharge: true
      });
      addMeleeImpact(room, enemy, "martial_impact", dash.impactScale || 0.82);
    }
  }
}

function applyAssassinDashContacts(room, player, dash, prevX, prevY) {
  const def = classes.assassin;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || dash.hitIds.includes(enemy.id)) continue;
    if (distanceToSegment(enemy, prevX, prevY, player.x, player.y) > enemy.radius + (dash.contactRadius || 36)) continue;
    dash.hitIds.push(enemy.id);
    const marked = isAssassinMarked(enemy, player);
    const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.7), player.id, {
      noVulnerable: true
    });
    if (dealt > 0) addMeleeImpact(room, enemy, marked ? "assassin_mark_hit" : "blade_impact", dash.impactScale || 0.76);
  }
}

function getDashProfile(player) {
  return dashProfiles[player.classId] || dashProfiles.novice;
}

function getDashProfileForClass(classId) {
  return dashProfiles[classId] || dashProfiles.novice;
}

function getDashMaxChargesForClass(classId) {
  return getDashProfileForClass(classId).charges || 1;
}

function getDashMaxCharges(player) {
  const gearBonus = Math.max(0, Math.floor(player.dashChargeBonus || 0));
  const mechaBonus = player.engineerMechaModule && isEngineerMechaActive(player) ? 1 : 0;
  return getDashMaxChargesForClass(player.classId) + gearBonus + mechaBonus;
}

function getDashCooldown(player) {
  return getDashProfile(player).cooldown * (player.dashCooldownMul || 1);
}

function getDashChainCooldown(player) {
  return (getDashProfile(player).chainCooldown || 0) * (player.dashCooldownMul || 1);
}

function resetDashCharges(player) {
  const maxCharges = getDashMaxCharges(player);
  player.dashCharges = maxCharges;
  player.dashRechargeTimer = 0;
  player.dashTimer = 0;
}

function updateDashAvailability(player, dt) {
  const maxCharges = getDashMaxCharges(player);
  player.dashTimer = Math.max(0, (player.dashTimer || 0) - dt);

  if (maxCharges <= 1) {
    player.dashCharges = 1;
    player.dashRechargeTimer = 0;
    return;
  }

  player.dashCharges = clamp(Math.floor(player.dashCharges ?? maxCharges), 0, maxCharges);
  if (player.dashCharges >= maxCharges) {
    player.dashRechargeTimer = 0;
    return;
  }

  player.dashRechargeTimer = Math.max(0, (player.dashRechargeTimer || 0) - dt);
  if (player.dashRechargeTimer > 0) return;

  player.dashCharges = Math.min(maxCharges, player.dashCharges + 1);
  player.dashRechargeTimer = player.dashCharges < maxCharges ? getDashCooldown(player) : 0;
}

function canUseDash(player) {
  const maxCharges = getDashMaxCharges(player);
  if (maxCharges <= 1) return player.dashTimer <= 0;
  return player.dashTimer <= 0 && (player.dashCharges || 0) > 0;
}

function consumeDashCharge(player) {
  const maxCharges = getDashMaxCharges(player);
  if (maxCharges <= 1) {
    player.dashTimer = getDashCooldown(player);
    return;
  }

  player.dashCharges = clamp((player.dashCharges ?? maxCharges) - 1, 0, maxCharges);
  player.dashTimer = player.dashCharges > 0 ? getDashChainCooldown(player) : 0;
  if (player.dashRechargeTimer <= 0) {
    player.dashRechargeTimer = getDashCooldown(player);
  }
}

function getDashCooldownRemaining(player) {
  const maxCharges = getDashMaxCharges(player);
  if (maxCharges <= 1) return Math.max(0, player.dashTimer || 0);
  if ((player.dashCharges || 0) > 0) return Math.max(0, player.dashTimer || 0);
  return Math.max(0, player.dashRechargeTimer || 0);
}

function getDashDistance(player) {
  const profile = getDashProfile(player);
  return profile.distance * Math.min(1.18, player.speedMul) * (player.dashDistanceMul || 1);
}

function getBoundedDashEndpoint(room, startX, startY, dirX, dirY, distanceAmount, margin = 32) {
  const length = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / length;
  const uy = dirY / length;
  let travel = Math.max(0, distanceAmount || 0);

  if (Math.abs(ux) > 0.0001) {
    const wallX = ux > 0 ? room.world.w - margin : margin;
    travel = Math.min(travel, Math.max(0, (wallX - startX) / ux));
  }
  if (Math.abs(uy) > 0.0001) {
    const wallY = uy > 0 ? room.world.h - margin : margin;
    travel = Math.min(travel, Math.max(0, (wallY - startY) / uy));
  }

  return {
    x: clamp(startX + ux * travel, margin, room.world.w - margin),
    y: clamp(startY + uy * travel, margin, room.world.h - margin),
    distance: travel
  };
}

function applyWarriorDashPush(room, player, enemy, dir, scale = 1, options = {}) {
  const shieldCharge = scale > 2;
  const typeResist = enemy.type === "boss" ? 0.36 : enemy.elite ? 0.68 : enemy.type === "guardian" || enemy.type === "brute" ? 0.82 : 1;
  const push = 116 * typeResist * scale;
  startEnemyKnockback(room, enemy, dir.x, dir.y, push, {
    duration: clamp(push / (shieldCharge ? 760 : 920), shieldCharge ? 0.4 : 0.18, shieldCharge ? 0.62 : 0.3),
    maxDistance: options.maxDistance > 0 ? options.maxDistance : shieldCharge ? 520 : 260,
    style: shieldCharge ? "shield_charge_push" : "warrior_dash_push",
    interruptCharge: true,
    collisionBurst: options.collisionBurst ? { ownerId: options.ownerId || player.id, triggered: false } : null
  });
}

function getWarriorDashPushDirection(enemy, fromX, fromY, toX, toY, forwardDir, shieldCharge = false) {
  const fx = Number.isFinite(forwardDir.x) ? forwardDir.x : 1;
  const fy = Number.isFinite(forwardDir.y) ? forwardDir.y : 0;
  const forwardLength = Math.hypot(fx, fy) || 1;
  const forwardX = fx / forwardLength;
  const forwardY = fy / forwardLength;
  const segmentX = toX - fromX;
  const segmentY = toY - fromY;
  const segmentLengthSq = segmentX * segmentX + segmentY * segmentY;
  if (segmentLengthSq <= 0.001) return { x: forwardX, y: forwardY };

  const t = clamp(((enemy.x - fromX) * segmentX + (enemy.y - fromY) * segmentY) / segmentLengthSq, 0, 1);
  const closestX = fromX + segmentX * t;
  const closestY = fromY + segmentY * t;
  const lateralX = enemy.x - closestX;
  const lateralY = enemy.y - closestY;
  const lateralLength = Math.hypot(lateralX, lateralY);
  if (lateralLength <= 0.001) return { x: forwardX, y: forwardY };

  const lateralWeight = shieldCharge ? 0.34 : 0.22;
  const combinedX = forwardX + (lateralX / lateralLength) * lateralWeight;
  const combinedY = forwardY + (lateralY / lateralLength) * lateralWeight;
  const combinedLength = Math.hypot(combinedX, combinedY) || 1;
  return { x: combinedX / combinedLength, y: combinedY / combinedLength };
}

function startEnemyKnockback(room, enemy, dirX, dirY, distanceAmount, options = {}) {
  if (!enemy || enemy.hp <= 0 || !Number.isFinite(distanceAmount) || distanceAmount <= 0) return;
  const length = Math.hypot(dirX, dirY) || 1;
  const baseX = (dirX / length) * distanceAmount;
  const baseY = (dirY / length) * distanceAmount;
  const existing = options.replace ? null : enemy.knockbackMove;
  let combinedX = baseX;
  let combinedY = baseY;

  if (existing) {
    const existingProgress = clamp(existing.elapsed / Math.max(0.01, existing.duration), 0, 1);
    const remaining = existing.distance * (1 - existingProgress) * 0.45;
    combinedX += existing.dirX * remaining;
    combinedY += existing.dirY * remaining;
  }

  const maxDistance = Number.isFinite(options.maxDistance) ? options.maxDistance : 360;
  const combinedDistance = clamp(Math.hypot(combinedX, combinedY), 0, maxDistance);
  if (combinedDistance <= 0) return;
  if (enemy.windup?.kind === "bomber_explode") {
    if (options.interruptCharge) enemy.chargeMove = null;
    return;
  }

  const combinedLength = Math.hypot(combinedX, combinedY) || 1;
  const duration = Number.isFinite(options.duration) ? options.duration : clamp(combinedDistance / 920, 0.12, 0.36);

  enemy.knockbackMove = {
    dirX: combinedX / combinedLength,
    dirY: combinedY / combinedLength,
    distance: combinedDistance,
    elapsed: 0,
    duration,
    style: options.style || "hit_knockback",
    collisionBurst: options.collisionBurst || null,
    key: `${Math.round(enemy.x)}:${Math.round(enemy.y)}:${Math.round(combinedDistance)}:${Date.now()}`
  };

  if (enemy.trainingDummy) {
    enemy.dummyReturnCooldown = Math.max(enemy.dummyReturnCooldown || 0, duration + 0.65);
  }

  if (options.interruptCharge) {
    if (enemy.windup?.kind !== "bomber_explode") enemy.windup = null;
    enemy.chargeMove = null;
  }
}

function updateEnemyKnockback(room, enemy, dt) {
  const move = enemy.knockbackMove;
  if (!move) return false;

  const previousProgress = clamp(move.elapsed / Math.max(0.01, move.duration), 0, 1);
  move.elapsed = Math.min(move.duration, move.elapsed + dt);
  const nextProgress = clamp(move.elapsed / Math.max(0.01, move.duration), 0, 1);
  const previousEase = enemyKnockbackEase(previousProgress, move.style);
  const nextEase = enemyKnockbackEase(nextProgress, move.style);
  const step = Math.max(0, nextEase - previousEase) * move.distance;

  if (step > 0) {
    const previousX = enemy.x;
    const previousY = enemy.y;
    const requestedX = previousX + move.dirX * step;
    const requestedY = previousY + move.dirY * step;
    const collidedEnemy = move.collisionBurst && !move.collisionBurst.triggered
      ? room.enemies.find((other) => {
          if (other.id === enemy.id || other.hp <= 0) return false;
          const contactDistance = enemy.radius + other.radius + 3;
          const along = (other.x - previousX) * move.dirX + (other.y - previousY) * move.dirY;
          if (along <= Math.max(6, contactDistance * 0.18) || along > step + contactDistance) return false;
          return distanceToSegment(other, previousX, previousY, requestedX, requestedY) <= contactDistance;
        })
      : null;
    moveEnemyBy(room, enemy, move.dirX * step, move.dirY * step);
    if (move.collisionBurst && !move.collisionBurst.triggered) {
      const actualForward = (enemy.x - previousX) * move.dirX + (enemy.y - previousY) * move.dirY;
      const hitWall = step >= 3 && actualForward < step * 0.7;
      if (hitWall || collidedEnemy) {
        move.collisionBurst.triggered = true;
        const owner = room.players.get(move.collisionBurst.ownerId);
        triggerWarriorChargeCollision(room, owner, enemy, collidedEnemy);
        enemy.knockbackMove = null;
        return true;
      }
    }
  }

  if (nextProgress >= 1) {
    enemy.knockbackMove = null;
  }
  return true;
}

function startPlayerKnockback(room, player, dirX, dirY, distanceAmount, options = {}) {
  if (!player || player.hp <= 0 || !Number.isFinite(distanceAmount) || distanceAmount <= 0) return;
  const length = Math.hypot(dirX, dirY) || 1;
  const classResist = clamp(1.25 / getPlayerCollisionMass(player), 0.62, 1.08);
  const guardResist = player.tauntGuardTimer > 0 ? 0.72 : 1;
  const baseDistance = distanceAmount * classResist * guardResist;
  const baseX = (dirX / length) * baseDistance;
  const baseY = (dirY / length) * baseDistance;
  const existing = player.knockbackMove;
  let combinedX = baseX;
  let combinedY = baseY;

  if (existing) {
    const existingProgress = clamp(existing.elapsed / Math.max(0.01, existing.duration), 0, 1);
    const remaining = existing.distance * (1 - existingProgress) * 0.38;
    combinedX += existing.dirX * remaining;
    combinedY += existing.dirY * remaining;
  }

  const maxDistance = Number.isFinite(options.maxDistance) ? options.maxDistance : 165;
  const combinedDistance = clamp(Math.hypot(combinedX, combinedY), 0, maxDistance);
  if (combinedDistance <= 0) return;

  const combinedLength = Math.hypot(combinedX, combinedY) || 1;
  const duration = Number.isFinite(options.duration) ? options.duration : clamp(combinedDistance / 720, 0.1, 0.28);

  player.knockbackMove = {
    dirX: combinedX / combinedLength,
    dirY: combinedY / combinedLength,
    distance: combinedDistance,
    elapsed: 0,
    duration,
    style: options.style || "player_knockback",
    key: `${Math.round(player.x)}:${Math.round(player.y)}:${Math.round(combinedDistance)}:${Date.now()}`
  };

  if (options.interruptDash !== false) player.dashMove = null;
}

function updatePlayerKnockback(room, player, dt) {
  const move = player.knockbackMove;
  if (!move) return false;

  const prevX = player.x;
  const prevY = player.y;
  const previousProgress = clamp(move.elapsed / Math.max(0.01, move.duration), 0, 1);
  move.elapsed = Math.min(move.duration, move.elapsed + dt);
  const nextProgress = clamp(move.elapsed / Math.max(0.01, move.duration), 0, 1);
  const previousEase = playerKnockbackEase(previousProgress, move.style);
  const nextEase = playerKnockbackEase(nextProgress, move.style);
  const step = Math.max(0, nextEase - previousEase) * move.distance;

  if (step > 0) {
    movePlayerBy(room, player, move.dirX * step, move.dirY * step);
    updatePlayerVelocity(player, prevX, prevY, dt);
  }

  if (nextProgress >= 1) {
    player.knockbackMove = null;
  }
  return true;
}

function playerKnockbackEase(progress, style = "") {
  const t = clamp(progress, 0, 1);
  if (style === "shockwave_push") return Math.sin(t * Math.PI * 0.5);
  if (style === "charge_hit") return 1 - Math.pow(1 - t, 2.55);
  return 1 - Math.pow(1 - t, 2.15);
}

function updateTrainingDummyReturn(room, dummy, dt) {
  const homeX = Number.isFinite(dummy.homeX) ? dummy.homeX : dummy.x;
  const homeY = Number.isFinite(dummy.homeY) ? dummy.homeY : dummy.y;
  dummy.homeX = homeX;
  dummy.homeY = homeY;
  dummy.dummyReturnCooldown = Math.max(0, (dummy.dummyReturnCooldown || 0) - dt);
  if (dummy.dummyReturnCooldown > 0) return;

  const dx = homeX - dummy.x;
  const dy = homeY - dummy.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 8) return;

  const speed = dist > 320 ? 190 : 112;
  const step = Math.min(dist, speed * dt);
  moveEnemyBy(room, dummy, (dx / dist) * step, (dy / dist) * step);
}

function enemyKnockbackEase(progress, style = "") {
  const t = clamp(progress, 0, 1);
  if (style === "defense_ward_push") return Math.sin(t * Math.PI * 0.5);
  if (style === "shield_charge_push") return Math.sin(t * Math.PI * 0.5);
  if (style === "shield_charge_gather") return 1 - Math.pow(1 - t, 2.05);
  return 1 - Math.pow(1 - t, 2.35);
}

function performAttack(room, player, now) {
  const def = classes[player.classId];
  const basicDamageMul = Math.max(1, player.basicAttackDamageMul || 1);
  const aim = getAimVector(player);
  player.lastAttackAt = now;

  if (player.classId === "warrior") {
    player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
    const swingSide = player.attackSwingSide;
    const reach = def.range * player.rangeMul * player.areaMul * (hasUpgrade(player, "warrior_cleave") ? 1.22 : 1);
    addEffect(room, "slash", player.x + aim.x * reach * 0.58, player.y + aim.y * reach * 0.58, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.warrior.color,
      radius: reach * 1.24,
      style: "warrior_basic",
      originX: round2(player.x),
      originY: round2(player.y),
      reach: round2(reach),
      arcDot: -0.05,
      rangeType: "cone",
      duration: 0.34,
      swingSide
    });
    for (const enemy of room.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance > reach + enemy.radius) continue;
      const dot = (dx / (distance || 1)) * aim.x + (dy / (distance || 1)) * aim.y;
      if (dot > -0.05) {
        const dealt = dealDamage(room, enemy, def.damage * basicDamageMul * 1.18, player.id, { knockback: 90, basicAttack: true });
        if (dealt > 0) addMeleeImpact(room, enemy, "blade_impact", 0.9);
      }
    }
    return;
  }

  if (player.classId === "martialist") {
    player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
    player.comboCounter = ((player.comboCounter || 0) % 3) + 1;
    player.comboTimer = Math.max(player.comboTimer || 0, 2.45);
    const comboHit = player.comboCounter === 3;
    const reach = def.range * player.rangeMul * player.areaMul * (comboHit ? 1.18 : 1);
    const arcDot = comboHit ? -0.04 : 0.16;
    addEffect(room, "slash", player.x + aim.x * reach * 0.52, player.y + aim.y * reach * 0.52, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.martialist.color,
      radius: reach * (comboHit ? 1.28 : 1.04),
      style: comboHit ? "martial_combo_finisher" : "martial_combo",
      originX: round2(player.x),
      originY: round2(player.y),
      reach: round2(reach),
      arcDot,
      rangeType: "cone",
      duration: comboHit ? 0.36 : 0.28,
      swingSide: player.attackSwingSide
    });
    for (const enemy of room.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + enemy.radius) continue;
      const dot = (dx / (dist || 1)) * aim.x + (dy / (dist || 1)) * aim.y;
      if (dot <= arcDot) continue;
      const damage = def.damage * (comboHit ? 1.46 : 0.94) * (hasUpgrade(player, "martial_dragon_pulse") ? 1.08 : 1);
      const dealt = dealDamage(room, enemy, damage, player.id, { knockback: comboHit ? 112 : 50, noVulnerable: true });
      if (dealt > 0) addMeleeImpact(room, enemy, comboHit ? "martial_impact" : "blade_impact", comboHit ? 1.02 : 0.78);
    }
    return;
  }

  if (player.classId === "alchemist") {
    pushPlayerProjectile(room, player, {
      ownerId: player.id,
      classId: "alchemist",
      x: player.x + aim.x * 30,
      y: player.y + aim.y * 30,
      vx: aim.x * def.projectileSpeed * (player.projectileSpeedMul || 1),
      vy: aim.y * def.projectileSpeed * (player.projectileSpeedMul || 1),
      distanceLeft: getPlayerProjectileTravelDistance(room, hasUpgrade(player, "alchemist_bigger_bottle") ? 12 : 10),
      damage: def.damage * 0.92,
      radius: hasUpgrade(player, "alchemist_bigger_bottle") ? 12 : 10,
      pierce: 0,
      splash: (hasUpgrade(player, "alchemist_bigger_bottle") ? 98 : 74) * player.areaMul + player.splashBonus,
      poison: hasUpgrade(player, "alchemist_corrosive"),
      poisonDurationBonus: hasUpgrade(player, "alchemist_acid_storm") ? 1.1 : 0,
      poisonStacks: hasUpgrade(player, "alchemist_corrosive") ? 2 : 1,
      slow: hasUpgrade(player, "alchemist_acid") ? 0.48 : 0,
      chain: 0,
      style: "alchemy_bottle",
      hostile: false,
      dead: false
    }, aim);
    addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.alchemist.color,
      radius: 46,
      style: "alchemy_throw"
    });
    return;
  }

  if (player.classId === "assassin") {
    player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
    const reach = def.range * player.rangeMul * player.areaMul;
    addEffect(room, "slash", player.x + aim.x * reach * 0.55, player.y + aim.y * reach * 0.55, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.assassin.color,
      radius: reach * 1.05,
      style: "assassin_slash",
      originX: round2(player.x),
      originY: round2(player.y),
      reach: round2(reach),
      arcDot: 0.05,
      rangeType: "cone",
      duration: 0.25,
      swingSide: player.attackSwingSide
    });
    for (const enemy of room.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + enemy.radius) continue;
      const dot = (dx / (dist || 1)) * aim.x + (dy / (dist || 1)) * aim.y;
      if (dot <= 0.05) continue;
      const marked = isAssassinMarked(enemy, player);
      const damage = def.damage * 1.08 * (hasUpgrade(player, "assassin_deep_cut") ? 1.08 : 1);
      const dealt = dealDamage(room, enemy, damage, player.id, { noVulnerable: true });
      if (dealt > 0) {
        addMeleeImpact(room, enemy, marked ? "assassin_mark_hit" : "blade_impact", marked ? 1.04 : 0.76);
      }
    }
    return;
  }

  if (player.classId === "engineer") {
    const mechaActive = isEngineerMechaActive(player);
    if (mechaActive) {
      const boostedDef = basicDamageMul > 1 ? { ...def, damage: def.damage * basicDamageMul } : def;
      if (player.engineerMechaModule) {
        fireAdaptiveMechaContinuousLaser(room, player, aim, boostedDef);
        return;
      }
      fireEngineerMechaHandLasers(room, player, aim, boostedDef);
      triggerEngineerLaserModule(room, player, aim, boostedDef);
      return;
    }
    const projectileSpeed = def.projectileSpeed * (player.projectileSpeedMul || 1);
    const projectileRadius = 10;
    pushPlayerProjectile(room, player, {
      ownerId: player.id,
      classId: "engineer",
      x: player.x + aim.x * 30,
      y: player.y + aim.y * 30,
      vx: aim.x * projectileSpeed,
      vy: aim.y * projectileSpeed,
      distanceLeft: getPlayerProjectileTravelDistance(room, projectileRadius),
      damage: def.damage * basicDamageMul * getEngineerMechaAttackDamageMul(player) * 1.1,
      radius: projectileRadius,
      pierce: 0,
      splash: 0,
      poison: false,
      slow: 0,
      chain: 0,
      style: "engineer_bolt",
      basicAttack: true,
      hostile: false,
      dead: false
    }, aim, { originDistance: 30, spreadStep: 0.12 });
    addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.engineer.color,
      radius: 42,
      style: "engineer_bolt"
    });
    return;
  }

  if (player.classId === "puppeteer") {
    pushPlayerProjectile(room, player, {
      ownerId: player.id,
      classId: "puppeteer",
      x: player.x + aim.x * 28,
      y: player.y + aim.y * 28,
      vx: aim.x * def.projectileSpeed * (player.projectileSpeedMul || 1),
      vy: aim.y * def.projectileSpeed * (player.projectileSpeedMul || 1),
      distanceLeft: getPlayerProjectileTravelDistance(room, 8),
      damage: def.damage * 0.94,
      radius: 8,
      pierce: 1,
      splash: 0,
      poison: false,
      slow: 0,
      chain: 0,
      style: "thread_needle",
      hostile: false,
      dead: false
    }, aim);
    const puppet = getActivePuppet(room, player.id);
    if (puppet) {
      puppetSlash(room, player, puppet, def.damage * 0.82, 128);
    }
    addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.puppeteer.color,
      radius: 48,
      style: "thread_needle"
    });
    return;
  }

  const radius = player.classId === "mage" ? 14 * player.areaMul : 9;
  const projectile = {
    ownerId: player.id,
    classId: player.classId,
    x: player.x + aim.x * 30,
    y: player.y + aim.y * 30,
    vx: aim.x * def.projectileSpeed * (player.projectileSpeedMul || 1),
    vy: aim.y * def.projectileSpeed * (player.projectileSpeedMul || 1),
    distanceLeft: getPlayerProjectileTravelDistance(room, radius),
    damage: def.damage * basicDamageMul * (player.classId === "ranger" ? 1.08 : player.classId === "mage" ? 1.12 : 1),
    radius,
    pierce: 0,
    splash: player.classId === "mage" ? 98 * player.areaMul + player.splashBonus : 0,
    poison: false,
    slow: 0,
    chain: 0,
    style:
      player.classId === "mage"
        ? "arcane_orb"
        : player.classId === "ranger"
          ? "arrow"
          : "novice_bolt",
    basicAttack: true,
    homing: Boolean(player.classId === "ranger" && player.rangerPrimaryHoming),
    homingRange: player.rangerPrimaryHoming ? 720 : 0,
    homingTurnRate: player.rangerPrimaryHoming ? 13.5 : 0,
    homingAcquireDot: -0.68,
    hostile: false,
    dead: false
  };
  pushPlayerProjectile(room, player, projectile, aim);
}

function getProjectileCountBonus(player) {
  return clamp(Math.floor(player?.projectileCountBonus || 0), 0, 1);
}

function getProjectileSpreadAngles(baseCount, maxSpread, player) {
  const count = Math.max(1, Math.floor(baseCount + getProjectileCountBonus(player)));
  if (count === 1) return [0];
  const step = (maxSpread * 2) / (count - 1);
  return Array.from({ length: count }, (_, index) => -maxSpread + step * index);
}

function getPlayerProjectileTravelDistance(room, radius = 0) {
  const world = room?.world || {};
  const width = Number.isFinite(world.w) ? world.w : 1600;
  const height = Number.isFinite(world.h) ? world.h : 1000;
  const padding = Math.max(PLAYER_PROJECTILE_TRAVEL_PADDING, (Number(radius) || 0) * 2);
  return Math.hypot(width, height) + padding * 2;
}

function pushPlayerProjectile(room, player, projectile, baseDir, options = {}) {
  const count = 1 + getProjectileCountBonus(player);
  const rawDir = baseDir || { x: projectile.vx || 1, y: projectile.vy || 0 };
  const dirLength = Math.hypot(rawDir.x || 0, rawDir.y || 0) || 1;
  const forward = { x: (rawDir.x || 0) / dirLength, y: (rawDir.y || 0) / dirLength };
  const speed = Math.hypot(projectile.vx || 0, projectile.vy || 0);
  const originX = options.originX ?? player.x;
  const originY = options.originY ?? player.y;
  const originDistance =
    options.originDistance ?? Math.hypot((projectile.x ?? originX) - originX, (projectile.y ?? originY) - originY);
  const spreadStep = options.spreadStep ?? 0.12;
  const distanceLeft = projectile.hostile
    ? projectile.distanceLeft
    : getPlayerProjectileTravelDistance(room, projectile.radius);

  for (let index = 0; index < count; index += 1) {
    const offsetIndex = index === 0 ? 0 : Math.ceil(index / 2) * (index % 2 === 1 ? -1 : 1);
    const dir = offsetIndex === 0 ? forward : rotate(forward, offsetIndex * spreadStep);
    room.projectiles.push({
      ...projectile,
      id: nextProjectileId++,
      x: originX + dir.x * originDistance,
      y: originY + dir.y * originDistance,
      vx: speed > 0 ? dir.x * speed : projectile.vx,
      vy: speed > 0 ? dir.y * speed : projectile.vy,
      distanceLeft,
      hitEnemyIds: Array.isArray(projectile.hitEnemyIds) ? [...projectile.hitEnemyIds] : projectile.hitEnemyIds
    });
  }
}

function spawnMageStarSplitFragments(room, projectile, enemy) {
  if (!projectile?.splitOnHit || projectile.splitTriggered || Math.floor(projectile.splitDepth || 0) > 0) return;
  const owner = room.players.get(projectile.ownerId);
  if (!owner) return;
  projectile.splitTriggered = true;

  const speed = Math.max(420, Math.hypot(projectile.vx || 0, projectile.vy || 0) * 1.08 || 560);
  const baseAngle =
    Math.hypot(projectile.vx || 0, projectile.vy || 0) > 0
      ? Math.atan2(projectile.vy || 0, projectile.vx || 0)
      : Number(projectile.angle || 0);
  const shardCount = Math.max(1, Math.floor(projectile.splitShardCount || 3));
  const spread = Math.PI * 0.74;
  const start = shardCount === 1 ? 0 : -spread / 2;
  const step = shardCount === 1 ? 0 : spread / (shardCount - 1);
  const originX = Number.isFinite(enemy?.x) ? enemy.x : projectile.x;
  const originY = Number.isFinite(enemy?.y) ? enemy.y : projectile.y;
  const originDistance = Math.max((enemy?.radius || 18) + 12, (projectile.radius || 8) + 18);
  const shardRadius = Math.max(6, (projectile.radius || 12) * 0.56);
  const hitEnemyIds = Array.isArray(projectile.hitEnemyIds) ? [...projectile.hitEnemyIds] : enemy?.id ? [enemy.id] : [];

  addEffect(room, "star", originX, originY, {
    color: classes.mage.color,
    radius: Math.max(44, shardRadius * 5.2),
    style: "star_split"
  });

  for (let i = 0; i < shardCount; i += 1) {
    const angle = baseAngle + start + step * i;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    pushPlayerProjectile(
      room,
      owner,
      {
        ownerId: projectile.ownerId,
        classId: "mage",
        x: originX + dir.x * originDistance,
        y: originY + dir.y * originDistance,
        vx: dir.x * speed,
        vy: dir.y * speed,
        distanceLeft: getPlayerProjectileTravelDistance(room, shardRadius),
        damage: Math.max(1, projectile.damage * Math.max(0.1, Number(projectile.splitDamageMul || 0.32))),
        radius: shardRadius,
        pierce: Math.max(0, Math.floor(projectile.splitShardPierce || 0)),
        splash: 0,
        poison: false,
        slow: 0,
        chain: 0,
        homing: false,
        homingRange: 0,
        homingTurnRate: 0,
        homingAcquireDot: -0.62,
        homingDelay: 0,
        homingTargetOffset: 0,
        splitOnHit: false,
        splitDepth: Math.floor(projectile.splitDepth || 0) + 1,
        hitEnemyIds,
        style: "star_shard",
        hostile: false,
        dead: false
      },
      dir,
      { originX, originY, originDistance, spreadStep: 0.085 }
    );
  }
}

function steerHomingProjectile(room, projectile, dt) {
  if (!projectile.homing || projectile.hostile || projectile.dead) return;
  const speed = Math.hypot(projectile.vx || 0, projectile.vy || 0);
  if (speed <= 0) return;
  if ((projectile.homingDelay || 0) > 0) {
    projectile.homingDelay = Math.max(0, projectile.homingDelay - dt);
    return;
  }
  const range = projectile.homingRange || 680;
  const forwardX = (projectile.vx || 0) / speed;
  const forwardY = (projectile.vy || 0) / speed;
  const hitEnemyIds = Array.isArray(projectile.hitEnemyIds) ? projectile.hitEnemyIds : [];
  let target =
    projectile.homingTargetId === undefined
      ? null
      : room.enemies.find((enemy) => enemy.id === projectile.homingTargetId && enemy.hp > 0 && !hitEnemyIds.includes(enemy.id)) || null;
  if (!target && projectile.homingTargetId !== undefined) projectile.homingTargetId = undefined;
  if (target && Math.hypot(target.x - projectile.x, target.y - projectile.y) > range + target.radius + 220) {
    target = null;
    projectile.homingTargetId = undefined;
  }
  let bestScore = Infinity;
  if (!target) {
    const acquireDot = projectile.homingAcquireDot ?? -0.55;
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || hitEnemyIds.includes(enemy.id)) continue;
      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= 0 || dist > range + enemy.radius) continue;
      const dot = (dx / dist) * forwardX + (dy / dist) * forwardY;
      if (dot < acquireDot) continue;
      const anglePenalty = Math.abs(Math.atan2(forwardX * dy - forwardY * dx, forwardX * dx + forwardY * dy)) * 42;
      const score = dist - dot * 180 + anglePenalty;
      if (score < bestScore) {
        bestScore = score;
        target = enemy;
      }
    }
  }
  if (!target) return;
  projectile.homingTargetId = target.id;
  const currentAngle = Math.atan2(projectile.vy || 0, projectile.vx || 0);
  const targetAngle = Math.atan2(target.y - projectile.y, target.x - projectile.x);
  const targetOffset = projectile.homingTargetOffset || 0;
  const desiredX = target.x + Math.cos(targetAngle + Math.PI / 2) * targetOffset;
  const desiredY = target.y + Math.sin(targetAngle + Math.PI / 2) * targetOffset;
  const desiredAngle = Math.atan2(desiredY - projectile.y, desiredX - projectile.x);
  const targetDistance = Math.hypot(desiredX - projectile.x, desiredY - projectile.y);
  const closeTurnBoost = targetDistance < 220 ? 1.35 : 1;
  const maxTurn = (projectile.homingTurnRate || 11.5) * closeTurnBoost * dt;
  const delta = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
  const nextAngle = currentAngle + Math.max(-maxTurn, Math.min(maxTurn, delta));
  projectile.vx = Math.cos(nextAngle) * speed;
  projectile.vy = Math.sin(nextAngle) * speed;
}

function addMeleeImpact(room, enemy, style = "blade_impact", scale = 1) {
  addEffect(room, "impact", enemy.x, enemy.y, {
    color: "#fbbf24",
    radius: (enemy.radius + 24) * scale,
    style
  });
}

function canUseSkillSlot(player, slot) {
  return skillSystem.canUseSkillSlot(player, slot, skillUpgrades);
}

function canTriggerSkillSlot(player, slot) {
  if (player.skillsDisabled) return false;
  if (player.deferredSkillCooldowns?.[slot]) return false;
  if (player.engineerPermanentDrone && player.classId === "engineer" && slot === "f") return false;
  if (slot === "r" && player.classId === "engineer" && hasUpgrade(player, "engineer_mine_field")) {
    return canUseSkillSlot(player, slot) && (player.engineerMineCharges || 0) > 0;
  }
  return skillSystem.canTriggerSkillSlot(player, slot, skillUpgrades);
}

function getUnlockedSlotUpgrade(player, slot) {
  return skillSystem.getUnlockedSlotUpgrade(player, slot, skillUpgrades);
}

function getSkillCooldown(player, slot) {
  return skillSystem.getSkillCooldown(player, slot, classes);
}

function applySkillCooldown(player, slot) {
  const deferredType = getDeferredSkillCooldownType(player, slot);
  if (deferredType) {
    if (!player.deferredSkillCooldowns) player.deferredSkillCooldowns = {};
    player.deferredSkillCooldowns[slot] = { type: deferredType };
    player.skillTimers[slot] = 0;
    return 0;
  }

  if (slot === "r" && player.classId === "engineer" && hasUpgrade(player, "engineer_mine_field")) {
    if ((player.engineerMineCharges || 0) < getEngineerMineMaxCharges(player) && (player.skillTimers[slot] || 0) <= 0) {
      player.skillTimers[slot] = getSkillCooldown(player, slot);
    }
    return player.skillTimers[slot];
  }

  if (slot === "r" && player.classId === "warrior" && hasUpgrade(player, "warrior_charge_collision") && player.warriorChargeSucceeded) {
    player.warriorChargeSucceeded = false;
    const usingChainCharge = (player.warriorChargeChainCharges || 0) > 0;
    if (usingChainCharge) {
      player.warriorChargeChainCharges = 0;
      player.warriorChargeChainWindow = 0;
      player.warriorChargeChainCooldown = 0;
      return skillSystem.applySkillCooldown(player, slot, classes);
    }

    const fullCooldown = getSkillCooldown(player, slot);
    player.warriorChargeChainCharges = 1;
    player.warriorChargeChainWindow = 2.6;
    player.warriorChargeChainCooldown = fullCooldown;
    player.skillTimers[slot] = 0.18;
    return player.skillTimers[slot];
  }
  if (slot === "r" && player.classId === "warrior") {
    player.warriorChargeSucceeded = false;
    player.warriorChargeChainCharges = 0;
    player.warriorChargeChainWindow = 0;
    player.warriorChargeChainCooldown = 0;
  }
  return skillSystem.applySkillCooldown(player, slot, classes);
}

function getDeferredSkillCooldownType(player, slot) {
  if (player.classId === "ranger" && slot === "r" && hasUpgrade(player, "ranger_trap")) return "arrow_rain";
  if (player.classId !== "engineer") return "";
  if (slot === "q") return "engineer_turret";
  if (slot === "e" && hasUpgrade(player, "engineer_mecha")) return "engineer_mecha";
  if (slot === "f" && hasUpgrade(player, "engineer_drone") && !player.engineerPermanentDrone) return "engineer_drone";
  return "";
}

function updateDeferredSkillCooldowns(room, player) {
  const deferred = player.deferredSkillCooldowns;
  if (!deferred) return;
  for (const [slot, entry] of Object.entries(deferred)) {
    let active = false;
    if (entry.type === "engineer_mecha") {
      active = (player.engineerMechaTimer || 0) > 0;
    } else {
      active = room.hazards.some((hazard) =>
        !hazard.dead &&
        hazard.ownerId === player.id &&
        hazard.type === entry.type &&
        hazard.cooldownSourceSlot === slot
      );
    }
    if (active) continue;
    player.skillTimers[slot] = getSkillCooldown(player, slot);
    delete deferred[slot];
  }
}

function updateWarriorChargeChain(player, dt) {
  if (!player || player.classId !== "warrior") return;
  if (!player.warriorChargeChainCharges && !player.warriorChargeChainWindow && !player.warriorChargeChainCooldown) return;

  if (!hasUpgrade(player, "warrior_charge_collision")) {
    player.warriorChargeChainCharges = 0;
    player.warriorChargeChainWindow = 0;
    player.warriorChargeChainCooldown = 0;
    return;
  }

  player.warriorChargeChainCooldown = Math.max(0, (player.warriorChargeChainCooldown || 0) - dt);
  if ((player.warriorChargeChainCharges || 0) <= 0) return;

  player.warriorChargeChainWindow = Math.max(0, (player.warriorChargeChainWindow || 0) - dt);
  if (player.warriorChargeChainWindow > 0) return;

  player.warriorChargeChainCharges = 0;
  if ((player.skillTimers?.r || 0) <= 0) {
    player.skillTimers.r = Math.max(player.skillTimers.r || 0, player.warriorChargeChainCooldown || 0);
  }
  player.warriorChargeChainCooldown = 0;
}

function performSkill(room, player, slot, now) {
  const def = classes[player.classId];
  const aim = getAimVector(player);
  player.lastSkillAt = now;

  if (player.classId === "novice") {
    if (slot !== "q") return;
    const radius = 150;
    player.hp = Math.min(player.maxHp, player.hp + 24);
    addEffect(room, "shield", player.x, player.y, { color: classes.novice.color, radius, style: "novice_pulse" });
    for (const enemy of room.enemies) {
      if (distance(player, enemy) <= radius + enemy.radius) {
        dealDamage(room, enemy, def.damage * 1.35, player.id, { knockback: 120 });
      }
    }
    pushEvent(room, `${player.name} 님이 모험가의 응급 전투술을 사용했습니다.`);
    return;
  }

  if (player.classId === "warrior") {
    if (slot === "q") {
      const radius =
        190 *
        (1 +
          Math.max(0, (player.areaMul || 1) - 1) +
          (hasUpgrade(player, "warrior_warlord") ? 0.15 : 0) +
          (hasUpgrade(player, "warrior_sword_reach") ? 0.5 : 0));
      player.hp = Math.min(player.maxHp, player.hp + 14);
      player.shield = Math.min(player.maxHp * 0.28, player.shield + 24);
      player.shieldTimer = 4.4;
      addEffect(room, "spin", player.x, player.y, {
        color: classes.warrior.color,
        radius,
        style: "warrior_spin",
        originX: round2(player.x),
        originY: round2(player.y),
        rangeRadius: round2(radius),
        rangeType: "circle",
        duration: 0.95
      });
      for (const enemy of room.enemies) {
        if (distance(player, enemy) <= radius + enemy.radius) {
          const dealt = dealDamage(room, enemy, def.damage * 2.55, player.id, { knockback: 175, skillTag: "warrior_whirlwind" });
          if (dealt > 0) addMeleeImpact(room, enemy, "spin_impact", 1.08);
        }
      }
      if (hasUpgrade(player, "warrior_guardian")) spawnWarriorForwardWhirlwind(room, player, aim, radius, def.damage);
      if (player.warriorWhirlwindEcho) {
        spawnWarriorForwardWhirlwind(room, player, aim, radius, def.damage, {
          damageMul: 0.72,
          radiusMul: 0.82,
          angleOffset: 0.13,
          style: "warrior_forward_whirlwind_launch_gear"
        });
      }
      if (player.vanguardWhirlwindGuard) {
        player.shield = Math.max(player.shield, player.maxHp * 0.12);
        player.shieldTimer = Math.max(player.shieldTimer, 4.4);
      }
      pushEvent(room, `${player.name} 님이 강철 회오리를 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "warrior_taunt")) {
      const radius =
        320 *
        player.areaMul *
        (player.tauntRangeMul || 1) *
        (hasUpgrade(player, "warrior_taunt_pull") ? 1.1 : 1) *
        (hasUpgrade(player, "warrior_colossus") ? 1.22 : 1);
      const tauntTime =
        (hasUpgrade(player, "warrior_taunt_bastion") ? 5.4 : 4.2) +
        (hasUpgrade(player, "warrior_colossus") ? 1.15 : 0);
      addEffect(room, "warning", player.x, player.y, {
        color: classes.warrior.color,
        radius,
        style: "taunt",
        rangeRadius: round2(radius),
        rangeType: "circle",
        duration: 1.05
      });
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        if (distance(player, enemy) > radius + enemy.radius) continue;
        enemy.tauntTargetId = player.id;
        enemy.tauntTimer = Math.max(enemy.tauntTimer, tauntTime);
        if (enemy.type !== "boss") {
          if (enemy.windup?.kind !== "bomber_explode") enemy.windup = null;
          enemy.shotTimer = Math.max(enemy.shotTimer || 0, 0.35);
          enemy.healTimer = Math.max(enemy.healTimer || 0, 0.55);
          enemy.specialTimer = Math.max(enemy.specialTimer || 0, 0.45);
        }
        if (hasUpgrade(player, "warrior_taunt_pull") && enemy.type !== "boss") {
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const pull = enemy.elite ? 58 : 92;
          startEnemyKnockback(room, enemy, dx, dy, pull, {
            duration: 0.22,
            maxDistance: 110,
            style: "shield_charge_push",
            interruptCharge: true
          });
        }
        if ((player.warriorShoutDamageMul || 0) > 0) {
          const dealt = dealDamage(room, enemy, def.damage * player.warriorShoutDamageMul, player.id, {
            knockback: 72,
            skillTag: "warrior_destructive_shout"
          });
          if (dealt > 0) addMeleeImpact(room, enemy, "shout_impact", 0.86);
        }
      }
      if (hasUpgrade(player, "warrior_taunt_bastion")) {
        const tauntShield = Math.max(72, player.maxHp * 0.38) + (hasUpgrade(player, "warrior_colossus") ? Math.max(40, player.maxHp * 0.18) : 0);
        player.shield = Math.max(player.shield, tauntShield);
        player.shieldTimer = 5 + (hasUpgrade(player, "warrior_colossus") ? 0.8 : 0);
        addEffect(room, "shield", player.x, player.y, {
          color: classes.warrior.color,
          radius: 76,
          style: "protective_shout"
        });
      }
      player.tauntGuardTimer = Math.max(
        player.tauntGuardTimer || 0,
        hasUpgrade(player, "warrior_taunt_bastion") ? 5.4 : WARRIOR_TAUNT_GUARD_DURATION
      );
      pushEvent(room, `${player.name} 님이 적을 도발했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "warrior_charge")) {
      const startX = player.x;
      const startY = player.y;
      const collisionCharge = Boolean(player.warriorCollisionCharge);
      const gatherCharge = hasUpgrade(player, "warrior_charge_gather") && !collisionCharge;
      const chainCharge = hasUpgrade(player, "warrior_charge_collision");
      player.warriorChargeSucceeded = false;
      const chargeDistance =
        365 *
        (collisionCharge ? 0.48 : 1) *
        Math.min(1.12, player.speedMul) *
        (player.dashDistanceMul || 1) *
        (hasUpgrade(player, "warrior_colossus") ? 1.12 : 1);
      const endpoint = getBoundedDashEndpoint(room, startX, startY, aim.x, aim.y, chargeDistance, 32);
      const endX = endpoint.x;
      const endY = endpoint.y;
      const actualDistance = Math.hypot(endX - startX, endY - startY);
      if (actualDistance < 18) {
        addEffect(room, "impact", startX, startY, {
          color: classes.warrior.color,
          radius: 38,
          style: "shield_wall_bump"
        });
        return;
      }
      const chargeDuration = clamp(actualDistance / 980, 0.3, 0.46);
      const baseContactRadius = 88 * player.areaMul * (hasUpgrade(player, "warrior_colossus") ? 1.22 : 1);
      const contactRadius = baseContactRadius * (gatherCharge ? 1.15 : 1);
      const gatherRadius = baseContactRadius * (gatherCharge ? WARRIOR_CHARGE_GATHER_RADIUS_MUL : 1);
      addEffect(room, "dash", (startX + endX) / 2, (startY + endY) / 2, {
        color: classes.warrior.color,
        angle: Math.atan2(aim.y, aim.x),
        radius: Math.max(34, actualDistance * 0.62),
        style: gatherCharge ? "shield_charge_gather" : chainCharge ? "shield_charge_chain" : "shield_charge",
        fromX: round2(startX),
        fromY: round2(startY),
        toX: round2(endX),
        toY: round2(endY),
        contactRadius: round2(contactRadius),
        rangeType: "capsule",
        moveDuration: round2(chargeDuration),
        duration: round2(chargeDuration + 0.18)
      });
      player.warriorChargeSucceeded = true;
      beginPlayerDashMove(room, player, aim, startX, startY, endX, endY, actualDistance, "shield_charge", {
        duration: chargeDuration,
        contactRadius,
        gatherRadius,
        damageMul:
          (collisionCharge ? 3.05 : 2.48) *
          (hasUpgrade(player, "warrior_colossus") ? 1.1 : 1),
        knockback: (collisionCharge ? 980 : 520) * (hasUpgrade(player, "warrior_colossus") ? 1.22 : 1),
        pushScale: (collisionCharge ? 8.4 : 3.65) * (hasUpgrade(player, "warrior_colossus") ? 1.22 : 1),
        pushMaxDistance: collisionCharge ? 900 : 0,
        gather: gatherCharge,
        collisionBurst: collisionCharge,
        gatherScale: (gatherCharge ? 1.22 : 1) * (hasUpgrade(player, "warrior_colossus") ? 1.14 : 1),
        impactScale: gatherCharge ? 1.62 : 1.78
      });
      player.shield = Math.min(player.maxHp * 0.3, player.shield + Math.max(24, player.maxHp * 0.14));
      player.shieldTimer = Math.max(player.shieldTimer, 3.4);
      player.immunityTimer = Math.max(player.immunityTimer, 0.24);
      pushEvent(room, `${player.name} 님이 방패 돌진을 사용했습니다.`);
      return;
    }

    if (slot === "f" && hasUpgrade(player, "warrior_cleave")) {
      player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
      const swingSide = player.attackSwingSide;
      const reach = def.range * player.rangeMul * player.areaMul * 2.45;
      const hasExecution = hasUpgrade(player, "warrior_cleave_execution");
      addEffect(room, "slash", player.x + aim.x * reach * 0.55, player.y + aim.y * reach * 0.55, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.warrior.color,
        radius: reach * 1.16,
        style: "warrior_cleave",
        originX: round2(player.x),
        originY: round2(player.y),
        reach: round2(reach),
        arcDot: -0.25,
        rangeType: "cone",
        duration: 0.46,
        swingSide
      });
      let executionHits = 0;
      for (const enemy of room.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dot = (dx / dist) * aim.x + (dy / dist) * aim.y;
        if (dist <= reach + enemy.radius && dot > -0.25) {
          const bossExecutionBonus = hasExecution && (enemy.type === "boss" || enemy.bossId) ? 1.35 : 1;
          const dealt = dealDamage(room, enemy, def.damage * 3.7 * bossExecutionBonus, player.id, {
            knockback: 220
          });
          const executionReady = dealt > 0 && hasExecution && canWarriorCleaveExecute(enemy, player);
          if (dealt > 0 && hasUpgrade(player, "warrior_cleave_guard")) {
            player.shield = Math.min(player.maxHp * 0.3, player.shield + 7);
            player.shieldTimer = Math.max(player.shieldTimer, 3.2);
          }
          if (executionReady && triggerWarriorCleaveExecution(room, player, enemy, reach, Math.atan2(aim.y, aim.x))) {
            executionHits += 1;
          }
          if (dealt > 0) addMeleeImpact(room, enemy, executionReady ? "cleave_execute" : "cleave_impact", executionReady ? 1.72 : 1.32);
        }
      }
      pushEvent(room, `${player.name} 님이 광역 베기를 사용했습니다.`);
      if (hasUpgrade(player, "warrior_worldsplitter")) performWarriorFollowupCleave(room, player, aim, def, reach, swingSide);
      if (player.warriorCleaveRepeat) {
        const repeatDef = { ...def, damage: def.damage * 0.72 };
        performWarriorHorizontalFollowupCleave(room, player, aim, repeatDef, reach, -swingSide, {
          effectDelay: WARRIOR_REPEAT_CLEAVE_EFFECT_DELAY,
          impactDelay: WARRIOR_REPEAT_CLEAVE_IMPACT_DELAY
        });
      }
      if (executionHits > 0) pushEvent(room, `${player.name} 님이 처형의 호를 발동했습니다.`);
      return;
    }
    return;
  }

  if (player.classId === "martialist") {
    performMartialistSkill(room, player, slot, aim, def);
    return;
  }

  if (player.classId === "alchemist") {
    performAlchemistSkill(room, player, slot, aim, def);
    return;
  }

  if (player.classId === "assassin") {
    performAssassinSkill(room, player, slot, aim, def);
    return;
  }

  if (player.classId === "ranger") {
    if (slot === "q") {
      const homingShot = hasUpgrade(player, "ranger_multishot");
      const fireArrow = hasUpgrade(player, "ranger_storm_quiver");
      const gearVolleyBonus = Math.max(0, Math.floor(player.rangerVolleyBonus || 0));
      const radialShot = Boolean(player.rangerRadialQ);
      const radialCount = 12 + getProjectileCountBonus(player);
      const spread = radialShot
        ? Array.from({ length: radialCount }, (_, index) => (Math.PI * 2 * index) / radialCount)
        : getProjectileSpreadAngles(7 + gearVolleyBonus, homingShot ? 0.38 : 0.3, player);
      for (let index = 0; index < spread.length; index += 1) {
        const angle = spread[index];
        const lane = index - (spread.length - 1) / 2;
        const gearArrow = gearVolleyBonus > 0 && (index === 0 || index === spread.length - 1);
        const projectileHoming = homingShot || gearArrow;
        const projectileSpeed = projectileHoming ? 620 : 700;
        const dir = rotate(aim, angle);
        const sideX = -aim.y;
        const sideY = aim.x;
        const laneOffset = projectileHoming ? lane * 9 : 0;
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "ranger",
          x: player.x + dir.x * 30 + sideX * laneOffset,
          y: player.y + dir.y * 30 + sideY * laneOffset,
          vx: dir.x * projectileSpeed,
          vy: dir.y * projectileSpeed,
          distanceLeft: getPlayerProjectileTravelDistance(room, 9),
          damage: def.damage * (radialShot ? 0.72 : homingShot ? 1.18 : 1.24),
          radius: 9,
          pierce: 0,
          splash: fireArrow ? 86 * player.areaMul + player.splashBonus : 0,
          poison: false,
          burn: fireArrow ? { duration: ENEMY_BURN_DURATION, totalDamageRatio: 0.7 } : null,
          explosiveArrow: fireArrow,
          slow: 0,
          chain: gearArrow ? 1 : 0,
          homing: projectileHoming,
          homingRange: 760,
          homingTurnRate: 14.5,
          homingAcquireDot: -0.62,
          homingDelay: projectileHoming ? 0.05 + Math.abs(lane) * 0.018 : 0,
          homingTargetOffset: projectileHoming ? Math.max(-18, Math.min(18, lane * 5.5)) : 0,
          style: fireArrow ? "fire_arrow" : radialShot ? "arrow_radial" : "arrow_fan",
          hostile: false,
          dead: false
        });
      }
      addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.ranger.color,
        radius: 58,
        style: fireArrow ? "fire_arrow" : radialShot ? "ranger_radial_barrage" : "ranger_barrage"
      });
      pushEvent(room, `${player.name} 님이 연발 사격을 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "ranger_pierce")) {
      const laserArrow = hasUpgrade(player, "ranger_pierce_blast");
      const killDamageBonus = hasUpgrade(player, "ranger_pierce_momentum")
        ? Math.max(0, player.rangerPierceDamageBonus || 0)
        : 0;
      const damage = def.damage * (laserArrow ? 3.2 : 2.55) + killDamageBonus;
      if (laserArrow) {
        const laserWidth = RANGER_LASER_ARROW_BASE_WIDTH * (player.areaMul || 1);
        castRangerPierceLaser(room, player, aim, damage, laserWidth);
        pushEvent(room, `${player.name} 님이 레이저 화살을 발사했습니다.`);
        return;
      }

      const radius = 24 * Math.sqrt(player.areaMul || 1);
      const distanceLeft = getPlayerProjectileTravelDistance(room, radius);
      const speed = 900;
      pushPlayerProjectile(room, player, {
        ownerId: player.id,
        classId: "ranger",
        x: player.x + aim.x * 42,
        y: player.y + aim.y * 42,
        vx: aim.x * speed,
        vy: aim.y * speed,
        distanceLeft,
        damage,
        radius,
        pierce: 8,
        splash: 0,
        poison: false,
        slow: 0,
        chain: 0,
        skillTag: "ranger_pierce",
        style: "piercing_arrow",
        hostile: false,
        dead: false
      }, aim, { originDistance: 42, spreadStep: 0.09 });
      addEffect(room, "shot", player.x + aim.x * 84, player.y + aim.y * 84, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.ranger.color,
        radius: 118,
        style: "piercing_shot",
        width: radius,
        duration: 0.32
      });
      pushEvent(room, `${player.name} 님이 관통 사격을 사용했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "ranger_trap")) {
      const storm = hasUpgrade(player, "ranger_trap_barbs");
      const lightning = hasUpgrade(player, "ranger_trap_chain");
      const plague = hasUpgrade(player, "ranger_plague_garden");
      const heavyRain = hasUpgrade(player, "ranger_rain_slow");
      const shredRain = hasUpgrade(player, "ranger_rain_shred");
      const targetX = clamp(player.input.aimX, 56, room.world.w - 56);
      const targetY = clamp(player.input.aimY, 56, room.world.h - 56);
      const radius = (storm ? 220 : 180) * player.areaMul * (plague ? 1.1 : 1);
      const armTime = storm ? 0.82 : 0.72;
      const rainDuration = (storm ? 4 : 3.2) * (shredRain ? 1.5 : 1);
      room.hazards.push({
        id: nextHazardId++,
        type: "arrow_rain",
        ownerId: player.id,
        cooldownSourceSlot: "r",
        x: targetX,
        y: targetY,
        radius,
        timer: rainDuration + armTime,
        armTime,
        armTimeMax: armTime,
        tick: 0.08,
        tickRate: (storm ? 0.22 : 0.25) * (player.hunterRainBarrage ? 0.75 : 1),
        damage: def.damage * (storm ? 0.75 : 0.5) * (plague ? 0.92 : 1),
        chain: lightning ? 1 : 0,
        slowDuration: heavyRain ? 1.15 : 0,
        poisonGarden: plague,
        pullEnemies: Boolean(player.rangerRainPull),
        color: classes.ranger.color,
        dead: false
      });
      addEffect(room, "warning", targetX, targetY, {
        color: classes.ranger.color,
        radius,
        style: "arrow_rain",
        duration: armTime
      });
      addEffect(room, "shot", (player.x + targetX) / 2, (player.y + targetY) / 2, {
        angle: Math.atan2(targetY - player.y, targetX - player.x),
        color: classes.ranger.color,
        radius,
        style: "arrow_rain_launch",
        fromX: round2(player.x),
        fromY: round2(player.y),
        toX: round2(targetX),
        toY: round2(targetY),
        duration: armTime + 0.18
      });
      addEffect(room, "shot", targetX, targetY, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.ranger.color,
        radius,
        style: "arrow_rain",
        duration: armTime + 0.28
      });
      pushEvent(room, `${player.name} 님이 레인 에로우를 사용했습니다.`);
      return;
    }

    if (slot === "f" && hasUpgrade(player, "ranger_poison")) {
      for (const angle of getProjectileSpreadAngles(1, 0.16, player)) {
        const dir = rotate(aim, angle);
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "ranger",
          x: player.x + dir.x * 30,
          y: player.y + dir.y * 30,
          vx: dir.x * 690,
          vy: dir.y * 690,
          distanceLeft: getPlayerProjectileTravelDistance(room, 10),
          damage: def.damage * 1.36,
          radius: 10,
          pierce: 0,
          splash: 0,
          poison: true,
          poisonStacks: hasUpgrade(player, "ranger_poison_focus") ? 2 : 1,
          poisonDurationBonus: hasUpgrade(player, "ranger_poison_focus") ? 1.4 : 0,
          poisonCloud: hasUpgrade(player, "ranger_poison_cloud"),
          venom: hasUpgrade(player, "ranger_poison_burst"),
          slow: 0,
          chain: hasUpgrade(player, "ranger_plague_garden") ? 1 : 0,
          style: "poison_arrow",
          hostile: false,
          dead: false
        });
      }
      addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
        angle: Math.atan2(aim.y, aim.x),
        color: "#9aa15f",
        radius: 68,
        style: "poison_volley"
      });
      pushEvent(room, `${player.name} 님이 독화살을 사용했습니다.`);
      return;
    }
    return;
  }

  if (player.classId === "mage") {
    if (slot === "q") {
      const homingStar = hasUpgrade(player, "mage_star_surge");
      const splitCore = hasUpgrade(player, "mage_storm_core");
      const gearSplit = Boolean(player.mageStarSplit || player.arcanistPiercingFragments);
      const piercingFragments = Boolean(player.arcanistPiercingFragments);
      const bolts = 10 + getProjectileCountBonus(player);
      const splitShardCount = (splitCore ? 3 : 2) + (piercingFragments ? 2 : 0);
      const splitDamageMul = Math.min(splitCore ? 0.2 : 0.15, 0.5 / splitShardCount);
      if (player.mageGiantOrb) {
        const expandedStar = homingStar;
        const empoweredCore = splitCore;
        const giantRadius = 64 * player.areaMul * (expandedStar ? 1.5 : 1);
        const giantSplash = (210 * player.areaMul + player.splashBonus) * (expandedStar ? 1.5 : 1);
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "mage",
          x: player.x + aim.x * 44,
          y: player.y + aim.y * 44,
          vx: aim.x * 620,
          vy: aim.y * 620,
          distanceLeft: getPlayerProjectileTravelDistance(room, giantRadius),
          damage: def.damage * 4.8,
          radius: giantRadius,
          pierce: 999,
          splash: giantSplash,
          poison: false,
          slow: 0,
          chain: 0,
          forceCrit: empoweredCore,
          splitOnHit: gearSplit,
          splitDepth: 0,
          splitShardCount,
          splitDamageMul: Math.min(splitDamageMul, 0.12),
          splitShardPierce: piercingFragments ? 1 : 0,
          style: `giant_star_orb${expandedStar ? " expanded_star" : ""}${empoweredCore ? " empowered_core" : ""}`,
          hostile: false,
          dead: false
        });
        addEffect(room, "star", player.x + aim.x * 54, player.y + aim.y * 54, {
          color: classes.mage.color,
          radius: giantRadius * 2.35,
          angle: Math.atan2(aim.y, aim.x),
          style: "giant_star_orb_launch"
        });
        pushEvent(room, `${player.name} 님이 응축 별빛을 발사했습니다.`);
        return;
      }
      for (let i = 0; i < bolts; i += 1) {
        const angle = (Math.PI * 2 * i) / bolts;
        const lane = i - (bolts - 1) / 2;
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "mage",
          x: player.x + Math.cos(angle) * 22,
          y: player.y + Math.sin(angle) * 22,
          vx: Math.cos(angle) * (homingStar ? 520 : 470),
          vy: Math.sin(angle) * (homingStar ? 520 : 470),
          distanceLeft: getPlayerProjectileTravelDistance(room, 14 * player.areaMul),
          damage: def.damage * (homingStar ? 1.2 : 1.14),
          radius: 14 * player.areaMul,
          pierce: 1,
          splash: 96 * player.areaMul + player.splashBonus,
          poison: false,
          slow: 0,
          chain: 0,
          homing: homingStar,
          homingRange: 720,
          homingTurnRate: 12.8,
          homingAcquireDot: -0.7,
          homingDelay: homingStar ? 0.04 + Math.abs(lane) * 0.006 : 0,
          homingTargetOffset: homingStar ? Math.max(-20, Math.min(20, Math.sin(angle) * 14)) : 0,
          splitOnHit: splitCore || gearSplit,
          splitDepth: 0,
          splitShardCount,
          splitDamageMul,
          splitShardPierce: piercingFragments ? 1 : 0,
          style: "star_orb",
          hostile: false,
          dead: false
        });
      }
      addEffect(room, "star", player.x, player.y, {
        color: classes.mage.color,
        radius: homingStar ? 168 : 150,
        style: "star_burst"
      });
      pushEvent(room, `${player.name} 님이 별빛 폭발을 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "mage_frost")) {
      const shatterReaction = hasUpgrade(player, "mage_frost_shatter");
      const flameWave = Boolean(player.mageFlameWave);
      const radius = 285 * player.areaMul;
      addEffect(room, "slow", player.x, player.y, {
        color: flameWave ? "#fb923c" : "#93c5fd",
        radius,
        rangeRadius: radius,
        style: flameWave ? "flame_wave" : "frost_wave"
      });
      for (const enemy of room.enemies) {
        if (distance(player, enemy) <= radius + enemy.radius) {
          const burningBeforeHit = (enemy.burnTimer || 0) > 0;
          if (!flameWave) enemy.slowTimer = Math.max(enemy.slowTimer, 3.2);
          if (shatterReaction && !flameWave) {
            const freezeDuration = enemy.type === "boss" ? 0.55 : enemy.elite ? 0.9 : 1.32;
            enemy.freezeTimer = Math.max(enemy.freezeTimer || 0, freezeDuration);
            addEffect(room, "freeze", enemy.x, enemy.y, {
              color: "#93c5fd",
              radius: enemy.radius + 30,
              style: "frost_shatter"
            });
          }
          const dealt = dealDamage(room, enemy, def.damage * (shatterReaction ? 1.66 : 1.22), player.id, {
            element: flameWave ? "burn" : undefined,
            skillTag: flameWave ? "mage_flame_wave" : "mage_frost_wave",
            interruptBossCast: true
          });
          if (flameWave && dealt > 0) {
            applyBurnToEnemy(room, enemy, player.id, dealt, { duration: 3.6, totalDamageRatio: 0.48 });
            if (shatterReaction && burningBeforeHit) {
              addEffect(room, "explosion", enemy.x, enemy.y, { color: "#f97316", radius: 92 * player.areaMul, style: "flame_shatter" });
              damageEnemiesInRadius(room, player, enemy.x, enemy.y, 92 * player.areaMul, def.damage * 0.74, {
                element: "burn",
                skillTag: "mage_flame_shatter",
                noVulnerable: true
              });
            }
          }
        }
      }
      pushEvent(room, `${player.name} 님이 ${flameWave ? "화염" : "빙결"} 파동을 사용했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "mage_meteor")) {
      const growthStacks = hasUpgrade(player, "mage_meteor_growth") ? Math.max(0, player.mageMeteorGrowthStacks || 0) : 0;
      const meteorGrowthCap = 500 + Math.max(0, player.mageMeteorGrowthCapBonus || 0);
      const meteorGrowthMul = 1 + Math.min(meteorGrowthCap, growthStacks) * 0.001;
      const impactDelay = 1;
      const impactTail = 0.42;
      const meteorRadius =
        158 *
        player.areaMul *
        meteorGrowthMul *
        (hasUpgrade(player, "mage_apocalypse") ? 1.1 : 1);
      room.hazards.push({
        id: nextHazardId++,
        type: "meteor",
        ownerId: player.id,
        x: player.input.aimX,
        y: player.input.aimY,
        radius: meteorRadius,
        timer: impactDelay,
        armTimeMax: impactDelay,
        damage:
          def.damage *
          4.6 *
          (hasUpgrade(player, "mage_wildfire") ? 1.1 : 1) *
          (hasUpgrade(player, "mage_apocalypse") ? 1.12 : 1),
        growth: hasUpgrade(player, "mage_meteor_growth"),
        wildfire: hasUpgrade(player, "mage_wildfire") || hasUpgrade(player, "mage_apocalypse"),
        apocalypse: hasUpgrade(player, "mage_apocalypse"),
        iceMeteor: Boolean(player.mageIceMeteor),
        style: "meteor",
        dead: false
      });
      addEffect(room, "meteor", player.input.aimX, player.input.aimY, {
        color: player.mageIceMeteor ? "#93c5fd" : classes.mage.color,
        radius: meteorRadius,
        style: "meteor_call",
        iceMeteor: Boolean(player.mageIceMeteor),
        impactAt: impactDelay,
        duration: impactDelay + impactTail
      });
      pushEvent(room, `${player.name} 님이 운석을 호출했습니다.`);
      return;
    }

    if (slot === "f" && hasUpgrade(player, "mage_chain")) {
      const pureCurrent = hasUpgrade(player, "mage_chain_no_falloff");
      const empoweredCurrent = hasUpgrade(player, "mage_chain_paralyze");
      const gearChainBoost = Boolean(player.mageChainBoost);
      const chainColor = empoweredCurrent ? "#ff2d55" : "#9ee6ff";
      const chainStyle = empoweredCurrent ? "chain_lightning empowered_current red_lightning" : "chain_lightning";
      const source =
        nearestEnemy(room, player.input.aimX, player.input.aimY, gearChainBoost ? MAGE_CHAIN_GEAR_CURSOR_ACQUIRE : MAGE_CHAIN_BASE_CURSOR_ACQUIRE) ||
        nearestEnemy(room, player.x, player.y, gearChainBoost ? MAGE_CHAIN_GEAR_SELF_ACQUIRE : MAGE_CHAIN_BASE_SELF_ACQUIRE);
      if (source) {
        addEffect(room, "chain", (player.x + source.x) / 2, (player.y + source.y) / 2, {
          color: chainColor,
          radius: distance(player, source),
          fromX: round2(player.x),
          fromY: round2(player.y),
          toX: round2(source.x),
          toY: round2(source.y),
          style: chainStyle
        });
        dealDamage(room, source, def.damage * 2.2, player.id, { forceCrit: empoweredCurrent });
        chainLightning(room, player.id, source, def.damage * 1.44, gearChainBoost ? MAGE_CHAIN_GEAR_JUMPS : MAGE_CHAIN_BASE_JUMPS, {
          range: gearChainBoost ? MAGE_CHAIN_GEAR_RANGE : MAGE_CHAIN_BASE_RANGE,
          falloff: pureCurrent ? 0 : 0.11,
          minDamageMul: pureCurrent ? 1 : 0.42,
          forceCrit: empoweredCurrent,
          color: chainColor,
          style: chainStyle
        });
      }
      pushEvent(room, `${player.name} 님이 연쇄 번개를 사용했습니다.`);
      return;
    }
    return;
  }

  if (player.classId === "engineer") {
    performEngineerSkill(room, player, slot, aim, def);
    return;
  }

  if (player.classId === "puppeteer") {
    performPuppeteerSkill(room, player, slot, aim, def);
    return;
  }
}

function spawnWarriorForwardWhirlwind(room, player, aim, sourceRadius, baseDamage, options = {}) {
  const direction = options.angleOffset ? rotate(aim, options.angleOffset) : aim;
  const angle = Math.atan2(direction.y, direction.x);
  const spawnOffset = Math.min(150, Math.max(70, sourceRadius * 0.38));
  const radius = Math.max(72, Math.max(92, sourceRadius * 0.58) * (options.radiusMul || 1));
  const speed = 520;
  const x = clamp(player.x + direction.x * spawnOffset, 40, room.world.w - 40);
  const y = clamp(player.y + direction.y * spawnOffset, 40, room.world.h - 40);
  room.hazards.push({
    id: nextHazardId++,
    type: "warrior_whirlwind_projectile",
    ownerId: player.id,
    x,
    y,
    vx: direction.x * speed,
    vy: direction.y * speed,
    angle,
    radius,
    timer: 0.9,
    tick: 0.02,
    tickInterval: 0.04,
    damage: baseDamage * 1.55 * (options.damageMul || 1),
    pullEnemies: Boolean(player.warriorWhirlwindPull),
    hitIds: [],
    color: classes.warrior.color,
    style: options.style || "warrior_forward_whirlwind",
    hostile: false,
    dead: false
  });
  addEffect(room, "spin", x, y, {
    color: classes.warrior.color,
    radius,
    style: options.style || "warrior_forward_whirlwind_launch",
    angle,
    duration: 0.35
  });
}

function damageEnemiesInCone(room, owner, x, y, aim, reach, dotMin, damage, options = {}) {
  let hits = 0;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist > reach + enemy.radius) continue;
    const dot = (dx / (dist || 1)) * aim.x + (dy / (dist || 1)) * aim.y;
    if (dot <= dotMin) continue;
    if (options.slow) enemy.slowTimer = Math.max(enemy.slowTimer, options.slow);
    const dealt = dealDamage(room, enemy, damage * (options.damageMul ? options.damageMul(enemy) : 1), owner.id, {
      noVulnerable: true,
      knockback: options.knockback || 0
    });
    if (dealt > 0) {
      hits += 1;
      if (options.impactStyle) addMeleeImpact(room, enemy, options.impactStyle, options.impactScale || 1);
      if (options.push && enemy.type !== "boss") {
        startEnemyKnockback(room, enemy, enemy.x - x, enemy.y - y, options.push, {
          duration: 0.18,
          maxDistance: options.maxPush || 150,
          style: "hit_knockback",
          interruptCharge: true
        });
      }
    }
  }
  return hits;
}

function damageEnemiesOnLine(room, owner, ax, ay, bx, by, width, damage, options = {}) {
  let hits = 0;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    if (distanceToSegment(enemy, ax, ay, bx, by) > width + enemy.radius) continue;
    if (options.slow) enemy.slowTimer = Math.max(enemy.slowTimer, options.slow);
    if (options.threadMark) applyThreadMark(room, owner, enemy, options.threadMark, options.threadDuration || 6.2);
    const dealt = dealDamage(room, enemy, damage * (options.damageMul ? options.damageMul(enemy) : 1), owner.id, {
      noVulnerable: true
    });
    if (dealt > 0) {
      hits += 1;
      if (options.impactStyle) addMeleeImpact(room, enemy, options.impactStyle, options.impactScale || 1);
      if (options.knockback && enemy.type !== "boss") {
        startEnemyKnockback(room, enemy, enemy.x - ax, enemy.y - ay, options.knockback, {
          duration: 0.18,
          maxDistance: options.maxPush || 170,
          style: "hit_knockback",
          interruptCharge: true
        });
      }
    }
  }
  return hits;
}

function distanceToWorldEdge(room, x, y, dx, dy, padding = 12) {
  const worldWidth = room.world?.w || 0;
  const worldHeight = room.world?.h || 0;
  const left = padding;
  const right = Math.max(left, worldWidth - padding);
  const top = padding;
  const bottom = Math.max(top, worldHeight - padding);
  const distances = [];
  if (dx > 0) distances.push((right - x) / dx);
  if (dx < 0) distances.push((left - x) / dx);
  if (dy > 0) distances.push((bottom - y) / dy);
  if (dy < 0) distances.push((top - y) / dy);
  const valid = distances.filter((value) => Number.isFinite(value) && value >= 0);
  return valid.length > 0 ? Math.min(...valid) : 0;
}

function castRangerPierceLaser(room, player, aim, damage, width) {
  const padding = 12;
  const backDistance = distanceToWorldEdge(room, player.x, player.y, -aim.x, -aim.y, padding);
  const frontDistance = distanceToWorldEdge(room, player.x, player.y, aim.x, aim.y, padding);
  const fromX = clamp(player.x - aim.x * backDistance, padding, room.world.w - padding);
  const fromY = clamp(player.y - aim.y * backDistance, padding, room.world.h - padding);
  const toX = clamp(player.x + aim.x * frontDistance, padding, room.world.w - padding);
  const toY = clamp(player.y + aim.y * frontDistance, padding, room.world.h - padding);
  const length = Math.hypot(toX - fromX, toY - fromY);
  addEffect(room, "shot", (fromX + toX) / 2, (fromY + toY) / 2, {
    angle: Math.atan2(aim.y, aim.x),
    color: classes.ranger.color,
    radius: length / 2,
    fromX: round2(fromX),
    fromY: round2(fromY),
    toX: round2(toX),
    toY: round2(toY),
    width: round2(width),
    rangeType: "line",
    style: "ranger_laser_arrow",
    duration: 0.38
  });

  const hits = room.enemies
    .filter((enemy) => enemy.hp > 0)
    .map((enemy) => ({
      enemy,
      along: (enemy.x - fromX) * aim.x + (enemy.y - fromY) * aim.y,
      distance: distanceToSegment(enemy, fromX, fromY, toX, toY)
    }))
    .filter((hit) => hit.distance <= width + hit.enemy.radius)
    .sort((a, b) => a.along - b.along);

  let hitCount = 0;
  for (const hit of hits) {
    const dealt = dealDamage(room, hit.enemy, damage, player.id, {
      noVulnerable: true,
      knockback: 54,
      skillTag: "ranger_pierce"
    });
    if (dealt <= 0) continue;
    hitCount += 1;
    addEffect(room, "impact", hit.enemy.x, hit.enemy.y, {
      color: classes.ranger.color,
      radius: hit.enemy.radius + 28,
      style: "ranger_laser_arrow_hit"
    });
  }
  if (player.rangerLaserFire) {
    room.hazards.push({
      id: nextHazardId++,
      type: "fire_line",
      ownerId: player.id,
      x: (fromX + toX) * 0.5,
      y: (fromY + toY) * 0.5,
      angle: Math.atan2(aim.y, aim.x),
      length,
      width: Math.max(36, width * 0.72),
      timer: 4.2,
      tick: 0.08,
      damage: Math.max(1, getPlayerAttackDamage(player, "ranger") * 0.055),
      burnTime: 3.2,
      burnAttackRatio: 0.65,
      style: "ranger_laser_fire_line",
      hostile: false,
      dead: false
    });
  }
  return hitCount;
}

function isAssassinMarked(enemy, player) {
  return enemy.assassinMarkOwnerId === player.id && (enemy.assassinMarkTimer || 0) > 0;
}

function applyAssassinMark(room, player, enemy, duration) {
  if (!enemy || enemy.hp <= 0) return false;
  enemy.assassinMarkOwnerId = player.id;
  enemy.assassinMarkTimer = Math.max(enemy.assassinMarkTimer || 0, duration);
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: classes.assassin.color,
    radius: enemy.radius + 38,
    style: "assassin_mark",
    duration: 0.42
  });
  return true;
}

function consumeAssassinMark(room, player, enemy) {
  if (!isAssassinMarked(enemy, player)) return false;
  enemy.assassinMarkOwnerId = null;
  enemy.assassinMarkTimer = 0;
  addEffect(room, "impact", enemy.x, enemy.y, {
    color: classes.assassin.color,
    radius: enemy.radius + 46,
    style: "assassin_mark_consume"
  });
  return true;
}

function getMartialChiMax(player) {
  return 3;
}

function gainMartialChi(player, amount = 1) {
  if (player.classId !== "martialist") return 0;
  const maxChi = getMartialChiMax(player);
  const afterimageBonus = hasUpgrade(player, "martial_afterimage") && (player.dashSpeedTimer || 0) > 0 ? 0.5 : 0;
  player.martialChi = clamp((player.martialChi || 0) + amount + afterimageBonus, 0, maxChi);
  player.martialChiTimer = Math.max(player.martialChiTimer || 0, 6.4);
  return player.martialChi;
}

function consumeMartialChi(player, keepOne = false) {
  const value = clamp(player.martialChi || 0, 0, getMartialChiMax(player));
  player.martialChi = keepOne && value > 0 ? 1 : 0;
  player.martialChiTimer = player.martialChi > 0 ? Math.max(player.martialChiTimer || 0, 4.5) : 0;
  return value;
}

function martialChiScale(player, value) {
  const chi = Number.isFinite(value) ? value : player.martialChi || 0;
  return 1 + chi * (hasUpgrade(player, "martial_dragon_pulse") ? 0.14 : 0.1);
}

function applyThreadMark(room, player, enemy, stacks = 1, duration = 6.2) {
  if (!enemy || enemy.hp <= 0 || player.classId !== "puppeteer") return 0;
  const maxStacks =
    4 +
    (hasUpgrade(player, "puppeteer_soul_stitch") ? 1 : 0) +
    (hasUpgrade(player, "puppeteer_grand_theater") ? 1 : 0);
  const current = enemy.threadMarkOwnerId === player.id && enemy.threadMarkTimer > 0 ? enemy.threadMarkStacks || 0 : 0;
  enemy.threadMarkOwnerId = player.id;
  enemy.threadMarkStacks = clamp(current + stacks, 1, maxStacks);
  enemy.threadMarkTimer = Math.max(enemy.threadMarkTimer || 0, duration + (hasUpgrade(player, "puppeteer_fine_thread") ? 1.4 : 0));
  if (enemy.threadMarkStacks >= maxStacks || Math.random() < 0.22) {
    addEffect(room, "warning", enemy.x, enemy.y, {
      color: classes.puppeteer.color,
      radius: enemy.radius + 20 + enemy.threadMarkStacks * 4,
      style: "thread_mark",
      duration: 0.28
    });
  }
  return enemy.threadMarkStacks;
}

function detonateThreadMark(room, player, enemy, baseDamage, options = {}) {
  if (!enemy || enemy.hp <= 0 || enemy.threadMarkOwnerId !== player.id || (enemy.threadMarkTimer || 0) <= 0) return 0;
  const stacks = Math.max(1, enemy.threadMarkStacks || 1);
  const lowHpMul = hasUpgrade(player, "puppeteer_finale") && enemy.hp <= enemy.maxHp * 0.34 ? 1.35 : 1;
  const razorMul = hasUpgrade(player, "puppeteer_razor_puppet") ? 1.12 : 1;
  const damage = baseDamage * (0.44 + stacks * 0.26) * lowHpMul * razorMul;
  enemy.threadMarkTimer = 0;
  enemy.threadMarkStacks = 0;
  enemy.threadMarkOwnerId = null;
  enemy.slowTimer = Math.max(enemy.slowTimer || 0, options.slow || 0.9);
  addEffect(room, "explosion", enemy.x, enemy.y, {
    color: classes.puppeteer.color,
    radius: enemy.radius + 34 + stacks * 8,
    style: "thread_snap"
  });
  return dealDamage(room, enemy, damage, player.id, { noVulnerable: true });
}

function detonateThreadMarksInRadius(room, player, x, y, radius, baseDamage, options = {}) {
  let hits = 0;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance({ x, y }, enemy) > radius + enemy.radius) continue;
    if (detonateThreadMark(room, player, enemy, baseDamage, options) > 0) hits += 1;
  }
  return hits;
}

function triggerAlchemyReaction(room, player, x, y, radius, def, options = {}) {
  const reactionRadius =
    radius *
    (hasUpgrade(player, "alchemist_bigger_bottle") ? 1.12 : 1) *
    (hasUpgrade(player, "alchemist_philosopher") ? 1.12 : 1);
  const damage =
    def.damage *
    (options.small ? 1.12 : 1.95) *
    (hasUpgrade(player, "alchemist_chain_reaction") ? 1.18 : 1) *
    (hasUpgrade(player, "alchemist_philosopher") ? 1.18 : 1);
  addEffect(room, "explosion", x, y, {
    color: "#e8b15e",
    radius: reactionRadius,
    style: "alchemy_reaction"
  });
  damageEnemiesInRadius(room, player, x, y, reactionRadius, damage, {
    slow: 0.72,
    knockback: options.knockback || 82,
    poison: { duration: hasUpgrade(player, "alchemist_acid_storm") ? ENEMY_POISON_DURATION + 1 : ENEMY_POISON_DURATION, stacks: hasUpgrade(player, "alchemist_corrosive") ? 2 : 1 },
    burn: { duration: ENEMY_BURN_DURATION }
  });
  room.hazards.push({
    id: nextHazardId++,
    type: "alchemy_pool",
    ownerId: player.id,
    mode: "reaction",
    x,
    y,
    radius: reactionRadius * 0.72,
    timer: options.small ? 1.9 : 2.8,
    tick: 0.12,
    tickInterval: 0.46,
    damage: def.damage * (options.small ? 0.28 : 0.42),
    color: "#e8b15e",
    dead: false
  });
}

function reactOverlappingAlchemyPools(room, player, pool, def, force = false) {
  if (!pool || pool.dead || !["acid", "fire"].includes(pool.mode)) return false;
  let reacted = false;
  for (const other of room.hazards) {
    if (
      other === pool ||
      other.dead ||
      other.type !== "alchemy_pool" ||
      other.ownerId !== player.id ||
      !["acid", "fire"].includes(other.mode) ||
      other.mode === pool.mode
    ) {
      continue;
    }
    const overlapDistance = (pool.radius || 0) + (other.radius || 0) + (force ? 70 : 0);
    if (distance(pool, other) > overlapDistance) continue;
    const x = (pool.x + other.x) / 2;
    const y = (pool.y + other.y) / 2;
    const radius = Math.max(92, Math.min(220, (pool.radius + other.radius) * 0.62));
    triggerAlchemyReaction(room, player, x, y, radius, def, { knockback: 96 });
    if (!hasUpgrade(player, "alchemist_philosopher")) {
      pool.timer *= 0.55;
      other.timer *= 0.55;
    }
    reacted = true;
  }
  return reacted;
}

function triggerAlchemyReactionsNear(room, player, x, y, radius, def) {
  let reacted = false;
  for (const hazard of room.hazards) {
    if (hazard.dead || hazard.ownerId !== player.id || hazard.type !== "alchemy_pool" || !["acid", "fire"].includes(hazard.mode)) continue;
    if (distance({ x, y }, hazard) > radius + hazard.radius) continue;
    triggerAlchemyReaction(room, player, hazard.x, hazard.y, Math.max(92, hazard.radius * 0.9), def, { small: false });
    hazard.timer *= hasUpgrade(player, "alchemist_philosopher") ? 0.72 : 0.42;
    reacted = true;
  }
  return reacted;
}

function triggerAssassinEcho(room, player, enemy, damage, options = {}) {
  if (!enemy || enemy.hp <= 0) return 0;
  const marked = isAssassinMarked(enemy, player);
  const echoMul = (marked ? 1 : 0.72) * (hasUpgrade(player, "assassin_nightfall") ? 1.12 : 1);
  addEffect(room, "slash", enemy.x, enemy.y, {
    angle: Math.atan2(enemy.y - player.y, enemy.x - player.x) + Math.PI * 0.7,
    color: classes.assassin.color,
    radius: enemy.radius + (options.big ? 74 : 52),
    style: "assassin_echo"
  });
  const dealt = dealDamage(room, enemy, damage * echoMul, player.id, {
    noVulnerable: true,
    noAssassinMarkConsume: Boolean(options.noAssassinMarkConsume)
  });
  if (dealt > 0 && marked) player.skillTimers.q = Math.max(0, player.skillTimers.q - (hasUpgrade(player, "assassin_quick_blade") ? 0.38 : 0.24));
  return dealt;
}

function triggerAssassinEchoAroundMarked(room, player, x, y, radius, damage, limit = 3) {
  const targets = room.enemies
    .filter((enemy) => enemy.hp > 0 && isAssassinMarked(enemy, player) && distance({ x, y }, enemy) <= radius + enemy.radius)
    .sort((a, b) => distance({ x, y }, a) - distance({ x, y }, b))
    .slice(0, limit);
  let hits = 0;
  for (const target of targets) {
    if (triggerAssassinEcho(room, player, target, damage, { big: hasUpgrade(player, "assassin_fan") }) > 0) hits += 1;
  }
  return hits;
}

function canWarriorCleaveExecute(enemy, player = null) {
  const threshold = clamp(player?.warriorExecutionThreshold || WARRIOR_CLEAVE_EXECUTE_THRESHOLD, WARRIOR_CLEAVE_EXECUTE_THRESHOLD, 0.35);
  return enemy.hp > 0 && enemy.type !== "boss" && enemy.hp <= enemy.maxHp * threshold;
}

function triggerWarriorCleaveExecution(room, player, enemy, reach, angle) {
  if (!canWarriorCleaveExecute(enemy, player)) return false;
  const radius = enemy.radius + Math.min(56, Math.max(34, reach * 0.22));
  addEffect(room, "impact", enemy.x, enemy.y, {
    color: "#ef4444",
    radius,
    style: "cleave_execute",
    angle,
    duration: 0.56
  });
  dealDamage(room, enemy, enemy.hp + 1, player.id, {
    fixedDamage: true,
    silent: true,
    noLifeSteal: true,
    noVulnerable: true
  });
  return enemy.hp <= 0;
}

function performWarriorFollowupCleave(room, player, aim, def, reach, swingSide, options = {}) {
  const followupDelay = Math.max(0, Number(options.effectDelay ?? 0.16));
  const followupImpactDelay = Math.max(0.05, Number(options.impactDelay ?? 0.4));
  const lineReach = reach * 1.95;
  const startX = clamp(player.x - aim.x * 26, 36, room.world.w - 36);
  const startY = clamp(player.y - aim.y * 26, 36, room.world.h - 36);
  const endX = clamp(player.x + aim.x * lineReach, 36, room.world.w - 36);
  const endY = clamp(player.y + aim.y * lineReach, 36, room.world.h - 36);
  const width = Math.max(48, 62 * player.areaMul);
  const angle = Math.atan2(aim.y, aim.x);
  const centerX = (startX + endX) / 2;
  const centerY = (startY + endY) / 2;
  addEffect(room, "slash", centerX, centerY, {
    angle,
    color: classes.warrior.color,
    radius: lineReach,
    style: options.style || "warrior_cleave_vertical",
    fromX: round2(startX),
    fromY: round2(startY),
    toX: round2(endX),
    toY: round2(endY),
    lineWidth: round2(width),
    reach: round2(lineReach),
    rangeType: "line",
    delay: followupDelay,
    duration: 1.08,
    swingSide
  });

  room.hazards.push({
    id: nextHazardId++,
    type: "warrior_followup_cleave",
    ownerId: player.id,
    x: centerX,
    y: centerY,
    fromX: startX,
    fromY: startY,
    toX: endX,
    toY: endY,
    width,
    damage: def.damage * 1.95,
    armTime: followupDelay + followupImpactDelay,
    timer: 1.08,
    dead: false
  });
  return 0;
}

function performWarriorHorizontalFollowupCleave(room, player, aim, def, reach, swingSide, options = {}) {
  const effectDelay = Math.max(0, Number(options.effectDelay ?? WARRIOR_REPEAT_CLEAVE_EFFECT_DELAY));
  const impactDelay = Math.max(0.05, Number(options.impactDelay ?? WARRIOR_REPEAT_CLEAVE_IMPACT_DELAY));
  const angle = Math.atan2(aim.y, aim.x);
  addEffect(room, "slash", player.x + aim.x * reach * 0.55, player.y + aim.y * reach * 0.55, {
    angle,
    color: classes.warrior.color,
    radius: reach * 1.16,
    style: "warrior_cleave_repeat_horizontal",
    originX: round2(player.x),
    originY: round2(player.y),
    reach: round2(reach),
    arcDot: -0.25,
    rangeType: "cone",
    delay: effectDelay,
    duration: 0.46,
    swingSide
  });
  room.hazards.push({
    id: nextHazardId++,
    type: "warrior_followup_cleave",
    mode: "horizontal",
    ownerId: player.id,
    x: player.x,
    y: player.y,
    aimX: aim.x,
    aimY: aim.y,
    reach,
    arcDot: -0.25,
    damage: def.damage * 1.95,
    armTime: effectDelay + impactDelay,
    timer: effectDelay + impactDelay + 0.3,
    dead: false
  });
}

function updateWarriorFollowupCleaveHazard(room, hazard, dt) {
  const owner = room.players.get(hazard.ownerId);
  if (!owner || owner.hp <= 0) {
    hazard.dead = true;
    return;
  }
  hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
  if (hazard.armTime > 0) return;

  let hits = 0;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    if (hazard.mode === "horizontal") {
      const dx = enemy.x - hazard.x;
      const dy = enemy.y - hazard.y;
      const dist = Math.hypot(dx, dy) || 1;
      const dot = (dx / dist) * (hazard.aimX || 0) + (dy / dist) * (hazard.aimY || 0);
      if (dist > (hazard.reach || 0) + enemy.radius || dot <= (hazard.arcDot ?? -0.25)) continue;
    } else if (distanceToSegment(enemy, hazard.fromX, hazard.fromY, hazard.toX, hazard.toY) > (hazard.width || 48) + enemy.radius) {
      continue;
    }
    const bossExecutionBonus = hasUpgrade(owner, "warrior_cleave_execution") && (enemy.type === "boss" || enemy.bossId) ? 1.35 : 1;
    const dealt = dealDamage(room, enemy, (hazard.damage || classes.warrior.damage * 1.95) * bossExecutionBonus, owner.id, {
      knockback: 180
    });
    if (dealt <= 0) continue;
    const executionReady = hasUpgrade(owner, "warrior_cleave_execution") && canWarriorCleaveExecute(enemy, owner);
    hits += 1;
    if (executionReady) {
      const executionReach = hazard.mode === "horizontal" ? hazard.reach : hazard.width * 2.5;
      const executionAngle = hazard.mode === "horizontal"
        ? Math.atan2(hazard.aimY || 0, hazard.aimX || 1)
        : Math.atan2(hazard.toY - hazard.fromY, hazard.toX - hazard.fromX);
      triggerWarriorCleaveExecution(room, owner, enemy, executionReach, executionAngle);
    }
    addMeleeImpact(room, enemy, executionReady ? "cleave_execute" : "cleave_followup_impact", executionReady ? 1.56 : 1.18);
  }
  if (hits > 0 && hasUpgrade(owner, "warrior_cleave_guard")) {
    owner.shield = Math.min(owner.maxHp * 0.3, owner.shield + hits * 4);
    owner.shieldTimer = Math.max(owner.shieldTimer, 3.2);
  }
  hazard.dead = true;
}

function performMartialistSkill(room, player, slot, aim, def) {
  if (slot === "q") {
    const chi = gainMartialChi(player, 1);
    const fullChi = chi >= getMartialChiMax(player);
    player.comboTimer = Math.max(player.comboTimer || 0, 2.6);
    player.comboCounter = Math.max(1, player.comboCounter || 1);
    const radius = 160 * player.areaMul * (hasUpgrade(player, "martial_dragon_pulse") ? 1.1 : 1) * (fullChi ? 1.12 : 1);
    addEffect(room, "spin", player.x, player.y, {
      color: classes.martialist.color,
      radius,
      style: fullChi ? "martial_flurry_finisher" : "martial_flurry"
    });
    const hits = damageEnemiesInCone(room, player, player.x, player.y, aim, radius, -0.32, def.damage * (hasUpgrade(player, "martial_infinite_combo") ? 2.34 : 1.88) * martialChiScale(player, fullChi ? chi : chi * 0.65), {
      impactStyle: "martial_impact",
      impactScale: 0.98,
      push: fullChi ? 98 : 54,
      slow: fullChi ? 0.55 : 0.28
    });
    if (fullChi) {
      const endX = clamp(player.x + aim.x * (radius + 72), 32, room.world.w - 32);
      const endY = clamp(player.y + aim.y * (radius + 72), 32, room.world.h - 32);
      addEffect(room, "slash", (player.x + endX) / 2, (player.y + endY) / 2, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.martialist.color,
        radius: radius + 76,
        style: "martial_palm"
      });
      damageEnemiesOnLine(room, player, player.x, player.y, endX, endY, 78 * player.areaMul, def.damage * 0.98 * martialChiScale(player, chi), {
        impactStyle: "martial_impact",
        knockback: 96,
        slow: 0.42
      });
      if (hasUpgrade(player, "martial_infinite_combo")) {
        player.martialFlowTimer = Math.max(player.martialFlowTimer || 0, 2.6);
      }
      consumeMartialChi(player, false);
    }
    if ((hits > 0 || fullChi) && hasUpgrade(player, "martial_infinite_combo")) {
      for (const slotKey of SKILL_SLOTS) player.skillTimers[slotKey] = Math.max(0, player.skillTimers[slotKey] - 0.22);
    }
    if (hits > 0 && hasUpgrade(player, "martial_combo_flow")) {
      player.martialChi = Math.min(getMartialChiMax(player), (player.martialChi || 0) + 0.45);
      for (const slotKey of ["e", "r", "f"]) {
        player.skillTimers[slotKey] = Math.max(0, player.skillTimers[slotKey] - 0.14);
      }
      addEffect(room, "impact", player.x, player.y, {
        color: classes.martialist.color,
        radius: radius * 0.72,
        style: "martial_combo_flow"
      });
    }
    pushEvent(room, `${player.name} 님이 연환권을 사용했습니다.`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "martial_palm")) {
    const chi = consumeMartialChi(player, false);
    const fullChi = chi >= getMartialChiMax(player);
    const chiScale = martialChiScale(player, chi);
    const reach = (hasUpgrade(player, "martial_palm_breaker") ? 360 : 300) * player.areaMul;
    const width = (hasUpgrade(player, "martial_palm_breaker") ? 86 : 68) * player.areaMul * (fullChi ? 1.18 : 1);
    const endX = clamp(player.x + aim.x * reach, 32, room.world.w - 32);
    const endY = clamp(player.y + aim.y * reach, 32, room.world.h - 32);
    addEffect(room, "slash", (player.x + endX) / 2, (player.y + endY) / 2, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.martialist.color,
      radius: reach * (fullChi ? 1.16 : 1),
      style: fullChi ? "martial_palm_finisher" : "martial_palm"
    });
    damageEnemiesOnLine(room, player, player.x, player.y, endX, endY, width, def.damage * (hasUpgrade(player, "martial_palm_breaker") ? 2.38 : 2.02) * chiScale, {
      impactStyle: "martial_impact",
      impactScale: 1.08,
      knockback: (hasUpgrade(player, "martial_palm_breaker") ? 168 : 126) + chi * 22,
      maxPush: fullChi ? 260 : 210,
      slow: fullChi ? 1.15 : 0.9
    });
    if (fullChi || hasUpgrade(player, "martial_dragon_soul")) {
      const burstRadius = (fullChi ? 132 : 92) * player.areaMul;
      damageEnemiesInRadius(room, player, endX, endY, burstRadius, def.damage * (fullChi ? 1.32 : 1.14) * chiScale, { slow: 0.45, knockback: fullChi ? 112 : 64 });
      addEffect(room, "impact", endX, endY, { color: classes.martialist.color, radius: burstRadius + 28, style: "martial_impact" });
    }
    pushEvent(room, `${player.name} 님이 파쇄장을 사용했습니다.`);
    return;
  }

  if (slot === "r" && hasUpgrade(player, "martial_rising")) {
    const chi = consumeMartialChi(player, false);
    const fullChi = chi >= getMartialChiMax(player);
    const chiScale = martialChiScale(player, chi);
    const startX = player.x;
    const startY = player.y;
    const distanceAmount = ((hasUpgrade(player, "martial_rising_chain") ? 282 : 238) + chi * 24) * player.dashDistanceMul;
    const endpoint = getBoundedDashEndpoint(room, startX, startY, aim.x, aim.y, distanceAmount, 32);
    const actualDistance = Math.hypot(endpoint.x - startX, endpoint.y - startY);
    if (actualDistance < 6) return;
    const duration = clamp(actualDistance / 1080, 0.13, 0.23);
    addEffect(room, "dash", (startX + endpoint.x) / 2, (startY + endpoint.y) / 2, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.martialist.color,
      radius: Math.max(36, actualDistance * 0.62),
      style: "martial_rising",
      fromX: round2(startX),
      fromY: round2(startY),
      toX: round2(endpoint.x),
      toY: round2(endpoint.y),
      moveDuration: round2(duration)
    });
    beginPlayerDashMove(room, player, aim, startX, startY, endpoint.x, endpoint.y, actualDistance, "martial_rising", {
      duration,
      contactRadius: (hasUpgrade(player, "martial_rising_chain") ? 78 : 64) * player.areaMul * (fullChi ? 1.16 : 1),
      damageMul: (hasUpgrade(player, "martial_rising_chain") ? 1.95 : 1.58) * chiScale,
      knockback: (hasUpgrade(player, "martial_rising_chain") ? 188 : 144) + chi * 28,
      impactScale: 1.1
    });
    if (fullChi || hasUpgrade(player, "martial_dragon_soul")) {
      damageEnemiesOnLine(room, player, startX, startY, endpoint.x, endpoint.y, 84 * player.areaMul, def.damage * 0.9, {
        impactStyle: "martial_impact",
        knockback: fullChi ? 118 : 78,
        slow: fullChi ? 0.58 : 0.35
      });
      if (fullChi) {
        damageEnemiesInRadius(room, player, endpoint.x, endpoint.y, 126 * player.areaMul, def.damage * 1.18 * chiScale, {
          slow: 0.45,
          knockback: 126
        });
      }
    }
    pushEvent(room, `${player.name} 님이 승룡각을 사용했습니다.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "martial_focus")) {
    const chi = consumeMartialChi(player, hasUpgrade(player, "martial_focus_guard"));
    const chiScale = martialChiScale(player, chi);
    const focusPush = hasUpgrade(player, "martial_focus_push");
    const radius = (hasUpgrade(player, "martial_focus_guard") ? 218 : focusPush ? 202 : 176) * player.areaMul * (1 + chi * 0.08);
    player.shield = Math.max(player.shield, ((hasUpgrade(player, "martial_focus_guard") ? 60 : 40) + chi * 12) * (player.shieldMul || 1));
    player.shieldTimer = Math.max(player.shieldTimer, (hasUpgrade(player, "martial_focus_guard") ? 4.6 : 3.4) + chi * 0.35);
    player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.16 + chi * 0.035);
    player.dashSpeedTimer = Math.max(player.dashSpeedTimer || 0, (hasUpgrade(player, "martial_focus_guard") ? 2.5 : 1.7) + chi * 0.25);
    addEffect(room, "shield", player.x, player.y, {
      color: classes.martialist.color,
      radius,
      style: "martial_focus"
    });
    damageEnemiesInRadius(room, player, player.x, player.y, radius, def.damage * 1.56 * chiScale, {
      slow: 0.5 + chi * 0.08,
      knockback: (focusPush ? 210 : 132) + chi * (focusPush ? 46 : 34)
    });
    pushEvent(room, `${player.name} 님이 기합 폭발을 사용했습니다.`);
  }
}

function performAlchemistSkill(room, player, slot, aim, def) {
  const targetX = clamp(player.input.aimX, 48, room.world.w - 48);
  const targetY = clamp(player.input.aimY, 48, room.world.h - 48);

  if (slot === "q") {
    const radius = (hasUpgrade(player, "alchemist_bigger_bottle") ? 128 : 106) * player.areaMul;
    deployAlchemyBomb(room, player, targetX, targetY, radius, def.damage * (hasUpgrade(player, "alchemist_chain_reaction") ? 2.28 : 1.88), {
      armTime: 0.48,
      reactionRadius: radius + 92,
      slow: 0.52,
      reactedSlow: 0.78,
      knockback: 58,
      reactedKnockback: 86,
      style: "alchemy_bomb"
    });
    if (hasUpgrade(player, "alchemist_chain_reaction") || hasUpgrade(player, "alchemist_homunculus_mix")) {
      const count = hasUpgrade(player, "alchemist_homunculus_mix") ? 5 : 3;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.atan2(aim.y, aim.x) + (i - (count - 1) / 2) * 0.72;
        const x = clamp(targetX + Math.cos(angle) * 94, 48, room.world.w - 48);
        const y = clamp(targetY + Math.sin(angle) * 94, 48, room.world.h - 48);
        if (hasUpgrade(player, "alchemist_homunculus_mix")) {
          createAlchemyPool(room, player, x, y, i % 2 === 0 ? "acid" : "fire", def, { small: true, armTime: 0.42 });
        } else {
          deployAlchemyBomb(room, player, x, y, 58 * player.areaMul, def.damage * 0.68, {
            armTime: 0.36 + i * 0.04,
            reactionRadius: 88 * player.areaMul,
            slow: 0.3,
            knockback: 36,
            small: true,
            style: "alchemy_bomb_small"
          });
        }
      }
    }
    pushEvent(room, `${player.name} 님이 촉매 폭탄을 던졌습니다.`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "alchemist_acid")) {
    createAlchemyPool(room, player, targetX, targetY, "acid", def);
    pushEvent(room, `${player.name} 님이 산성 플라스크를 던졌습니다.`);
    return;
  }

  if (slot === "r" && hasUpgrade(player, "alchemist_fire")) {
    createAlchemyPool(room, player, targetX, targetY, "fire", def);
    pushEvent(room, `${player.name} 님이 화염 플라스크를 던졌습니다.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "alchemist_elixir")) {
    const radius = (hasUpgrade(player, "alchemist_elixir_cloud") ? 300 : 230) * player.areaMul;
    addEffect(room, "shot", player.x, player.y, {
      color: classes.alchemist.color,
      radius,
      style: "alchemist_elixir_spray",
      duration: 0.62
    });
    for (const ally of getActiveLivingPlayers(room)) {
      if (distance(player, ally) > radius) continue;
      const heal = (hasUpgrade(player, "alchemist_panacea") ? 34 : 24) + ally.maxHp * (hasUpgrade(player, "alchemist_panacea") ? 0.12 : 0.08);
      ally.hp = Math.min(ally.maxHp, ally.hp + heal * (player.healingMul || 1));
      ally.shield = Math.max(ally.shield, (hasUpgrade(player, "alchemist_panacea") ? 34 : 22) * (player.shieldMul || 1));
      ally.shieldTimer = Math.max(ally.shieldTimer, 3.8);
      ally.dashSpeedMul = Math.max(ally.dashSpeedMul || 1, 1.12);
      ally.dashSpeedTimer = Math.max(ally.dashSpeedTimer || 0, 2.2);
      if (hasUpgrade(player, "alchemist_elixir_cloud") && ally.poisonTimer > 0) {
        ally.poisonTimer = Math.max(0, ally.poisonTimer - 2.2);
        if (ally.poisonTimer <= 0) clearPlayerPoison(ally);
      }
      addEffect(room, "heal", ally.x, ally.y, { value: Math.round(heal), color: classes.alchemist.color, style: "alchemist_elixir" });
    }
    addEffect(room, "shield", player.x, player.y, { color: classes.alchemist.color, radius, style: "alchemist_elixir" });
    room.hazards.push({
      id: nextHazardId++,
      type: "alchemy_elixir_mist",
      ownerId: player.id,
      x: player.x,
      y: player.y,
      radius: radius * 0.72,
      timer: hasUpgrade(player, "alchemist_panacea") ? 4.2 : 3.0,
      tick: 0.12,
      tickInterval: 0.7,
      heal: (hasUpgrade(player, "alchemist_panacea") ? 6.8 : 4.6) * (player.healingMul || 1),
      color: classes.alchemist.color,
      dead: false
    });
    if (hasUpgrade(player, "alchemist_homunculus_mix")) {
      for (const angle of [0, Math.PI * 0.66, Math.PI * 1.33]) {
        createAlchemyPool(
          room,
          player,
          clamp(player.x + Math.cos(angle) * 110, 48, room.world.w - 48),
          clamp(player.y + Math.sin(angle) * 110, 48, room.world.h - 48),
          "acid",
          def,
          { small: true }
        );
      }
    }
    pushEvent(room, `${player.name} 님이 전투 영약을 살포했습니다.`);
  }
}

function addAlchemyThrowEffect(room, player, x, y, flask = "acid", duration = 0.48, options = {}) {
  const fromX = player.x;
  const fromY = player.y;
  const dist = Math.hypot(x - fromX, y - fromY);
  const color = flask === "fire" ? "#c9824c" : flask === "bomb" ? "#e8b15e" : classes.alchemist.color;
  addEffect(room, "shot", (fromX + x) / 2, (fromY + y) / 2, {
    angle: Math.atan2(y - fromY, x - fromX),
    color,
    radius: options.radius || (flask === "bomb" ? 74 : 56),
    style: "alchemy_throw",
    flask,
    fromX: round2(fromX),
    fromY: round2(fromY),
    toX: round2(x),
    toY: round2(y),
    duration: clamp(duration + Math.min(0.14, dist / 2600), 0.34, 0.78)
  });
}

function deployAlchemyBomb(room, player, x, y, radius, damage, options = {}) {
  const armTime = options.armTime ?? 0.46;
  const targetX = clamp(x, 48, room.world.w - 48);
  const targetY = clamp(y, 48, room.world.h - 48);
  room.hazards.push({
    id: nextHazardId++,
    type: "alchemy_bomb",
    ownerId: player.id,
    x: targetX,
    y: targetY,
    radius,
    timer: armTime + 0.32,
    armTime,
    armTimeMax: armTime,
    damage,
    reactionRadius: options.reactionRadius || radius + 80,
    slow: options.slow || 0.48,
    reactedSlow: options.reactedSlow || 0.72,
    knockback: options.knockback || 52,
    reactedKnockback: options.reactedKnockback || 78,
    small: Boolean(options.small),
    style: options.style || "alchemy_bomb",
    color: classes.alchemist.color,
    dead: false
  });
  addAlchemyThrowEffect(room, player, targetX, targetY, "bomb", armTime, { radius });
  addEffect(room, "warning", targetX, targetY, {
    color: classes.alchemist.color,
    radius,
    style: "alchemy_bomb",
    duration: armTime
  });
}

function detonateAlchemyBomb(room, hazard) {
  if (!hazard || hazard.dead) return;
  const owner = room.players.get(hazard.ownerId);
  if (!owner) {
    hazard.dead = true;
    return;
  }
  const reacted = triggerAlchemyReactionsNear(room, owner, hazard.x, hazard.y, hazard.reactionRadius || hazard.radius + 80, classes.alchemist);
  addEffect(room, "explosion", hazard.x, hazard.y, {
    color: hazard.color || classes.alchemist.color,
    radius: hazard.radius * (reacted ? 1.08 : 1),
    style: reacted ? "alchemy_reaction" : hazard.style || "alchemy_bomb"
  });
  damageEnemiesInRadius(room, owner, hazard.x, hazard.y, hazard.radius, hazard.damage * (reacted ? 1.12 : 1), {
    slow: reacted ? hazard.reactedSlow || 0.72 : hazard.slow || 0.48,
    knockback: reacted ? hazard.reactedKnockback || 78 : hazard.knockback || 52
  });
  hazard.dead = true;
}

function createAlchemyPool(room, player, x, y, mode, def, options = {}) {
  const fire = mode === "fire";
  const radiusBase = fire ? 118 : 128;
  const radius =
    radiusBase *
    player.areaMul *
    (hasUpgrade(player, "alchemist_bigger_bottle") ? 1.14 : 1) *
    (fire && hasUpgrade(player, "alchemist_fire_sea") ? 1.12 : 1) *
    (!fire && hasUpgrade(player, "alchemist_acid_storm") ? 1.08 : 1) *
    (options.small ? 0.56 : 1);
  const tickInterval = (fire ? 0.46 : 0.54) * (hasUpgrade(player, fire ? "alchemist_fire_sea" : "alchemist_acid_storm") ? 0.84 : 1);
  const armTime = options.armTime ?? (options.small ? 0.38 : 0.48);
  const pool = {
    id: nextHazardId++,
    type: "alchemy_pool",
    ownerId: player.id,
    mode,
    x,
    y,
    radius,
    timer: (fire ? 4.2 : 4.6) * (options.small ? 0.62 : 1) + armTime,
    armTime,
    armTimeMax: armTime,
    reactedOnArm: false,
    tick: 0.18,
    tickInterval,
    damage: def.damage * (fire ? 0.68 : 0.6) * (options.small ? 0.58 : 1),
    color: fire ? "#c9824c" : classes.alchemist.color,
    dead: false
  };
  room.hazards.push(pool);
  addAlchemyThrowEffect(room, player, x, y, fire ? "fire" : "acid", armTime, { radius });
  addEffect(room, "trap", x, y, {
    color: fire ? "#c9824c" : classes.alchemist.color,
    radius,
    style: fire ? "alchemy_fire" : "alchemy_acid",
    duration: armTime + 0.3
  });
  return pool;
}

function performAssassinSkill(room, player, slot, aim, def) {
  if (slot === "q") {
    const radius = (hasUpgrade(player, "assassin_fan") ? 188 : 154) * player.areaMul;
    addEffect(room, "slash", player.x + aim.x * radius * 0.42, player.y + aim.y * radius * 0.42, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.assassin.color,
      radius: radius * 1.06,
      style: "assassin_fan",
      swingSide: player.attackSwingSide === -1 ? -1 : 1
    });
    const hits = damageEnemiesInCone(room, player, player.x, player.y, aim, radius, -0.18, def.damage * (hasUpgrade(player, "assassin_fan") ? 2.16 : 1.82), {
      impactStyle: "assassin_mark_hit",
      impactScale: 0.92,
      push: 34
    });
    if (hits > 0) {
      triggerAssassinEchoAroundMarked(room, player, player.x, player.y, radius + 88, def.damage * 0.76, hasUpgrade(player, "assassin_fan") ? 4 : 2);
    }
    if (hasUpgrade(player, "assassin_death_blossom")) {
      const sideAim = rotate(aim, 0.45);
      damageEnemiesInCone(room, player, player.x, player.y, sideAim, radius * 0.94, -0.08, def.damage * 1.2, {
        impactStyle: "assassin_mark_hit"
      });
    }
    pushEvent(room, `${player.name} 님이 칼날 난무를 사용했습니다.`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "assassin_mark")) {
    const target =
      nearestEnemy(room, player.input.aimX, player.input.aimY, hasUpgrade(player, "assassin_mark_reaper") ? 340 : 280) ||
      nearestEnemy(room, player.x, player.y, hasUpgrade(player, "assassin_mark_reaper") ? 520 : 430);
    if (target) {
      const duration = hasUpgrade(player, "assassin_mark_reaper") ? 8.5 : 6.2;
      const maxTargets = hasUpgrade(player, "assassin_mark_reaper") ? 4 : 3;
      const marked = room.enemies
        .filter((enemy) => enemy.hp > 0 && distance(target, enemy) <= (hasUpgrade(player, "assassin_mark_reaper") ? 220 : 170) + enemy.radius)
        .sort((a, b) => distance(target, a) - distance(target, b))
        .slice(0, maxTargets);
      for (const enemy of marked) {
        applyAssassinMark(room, player, enemy, duration);
        if (enemy.id !== target.id) {
          addEffect(room, "chain", (target.x + enemy.x) / 2, (target.y + enemy.y) / 2, {
            color: classes.assassin.color,
            radius: distance(target, enemy),
            fromX: round2(target.x),
            fromY: round2(target.y),
            toX: round2(enemy.x),
            toY: round2(enemy.y),
            style: "assassin_mark_chain"
          });
        }
      }
      triggerAssassinEcho(room, player, target, def.damage * 0.42, { big: false, noAssassinMarkConsume: true });
      pushEvent(room, `${player.name} 님이 사신 표식을 새겼습니다.`);
    }
    return;
  }

  if (slot === "r" && hasUpgrade(player, "assassin_lunge")) {
    const startX = player.x;
    const startY = player.y;
    const distanceAmount = (hasUpgrade(player, "assassin_lunge_reset") ? 330 : 285) * player.dashDistanceMul;
    const endpoint = getBoundedDashEndpoint(room, startX, startY, aim.x, aim.y, distanceAmount, 32);
    const actualDistance = Math.hypot(endpoint.x - startX, endpoint.y - startY);
    if (actualDistance < 6) return;
    const duration = clamp(actualDistance / 1500, 0.1, 0.17);
    addEffect(room, "dash", (startX + endpoint.x) / 2, (startY + endpoint.y) / 2, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.assassin.color,
      radius: Math.max(42, actualDistance * 0.58),
      style: "shadow_lunge",
      fromX: round2(startX),
      fromY: round2(startY),
      toX: round2(endpoint.x),
      toY: round2(endpoint.y),
      moveDuration: round2(duration)
    });
    beginPlayerDashMove(room, player, aim, startX, startY, endpoint.x, endpoint.y, actualDistance, "shadow_lunge", {
      duration,
      contactRadius: (hasUpgrade(player, "assassin_lunge_reset") ? 52 : 44) * player.areaMul,
      damageMul: hasUpgrade(player, "assassin_lunge_reset") ? 2.55 : 2.16,
      knockback: 82,
      impactScale: 1.04
    });
    const lineHits = damageEnemiesOnLine(room, player, startX, startY, endpoint.x, endpoint.y, 54 * player.areaMul, def.damage * 0.84, {
      impactStyle: "assassin_mark_hit",
      slow: 0.28
    });
    if (lineHits > 0) {
      triggerAssassinEchoAroundMarked(room, player, endpoint.x, endpoint.y, 240 * player.areaMul, def.damage * (hasUpgrade(player, "assassin_lunge_reset") ? 0.98 : 0.76), hasUpgrade(player, "assassin_nightfall") ? 4 : 2);
    }
    if (hasUpgrade(player, "assassin_lunge_reset")) {
      player.skillTimers.q = Math.max(0, player.skillTimers.q - 1.4);
    }
    pushEvent(room, `${player.name} 님이 그림자 찌르기를 사용했습니다.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "assassin_smoke")) {
    const radius = (hasUpgrade(player, "assassin_smoke_bomb") ? 230 : 178) * player.areaMul;
    player.stealthTimer = Math.max(player.stealthTimer || 0, hasUpgrade(player, "assassin_smoke_bomb") ? 2.1 : 1.35);
    player.immunityTimer = Math.max(player.immunityTimer, hasUpgrade(player, "assassin_smoke_bomb") ? 1.05 : 0.72);
    player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.24);
    player.dashSpeedTimer = Math.max(player.dashSpeedTimer || 0, 2.2);
    addEffect(room, "warning", player.x, player.y, {
      color: classes.assassin.color,
      radius,
      style: "smoke_bomb",
      duration: 0.54
    });
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || distance(player, enemy) > radius + enemy.radius) continue;
      enemy.slowTimer = Math.max(enemy.slowTimer, hasUpgrade(player, "assassin_smoke_bomb") ? 1.7 : 1.05);
      if (hasUpgrade(player, "assassin_nightfall")) applyAssassinMark(room, player, enemy, 3.2);
    }
    const echoLimit = hasUpgrade(player, "assassin_smoke_bomb") ? 5 : 3;
    triggerAssassinEchoAroundMarked(room, player, player.x, player.y, radius + 86, def.damage * 0.94, echoLimit);
    const nearest = nearestEnemy(room, player.x, player.y, radius + 80);
    if (nearest && !isAssassinMarked(nearest, player)) {
      triggerAssassinEcho(room, player, nearest, def.damage * 0.6, { big: false });
    }
    pushEvent(room, `${player.name} 님이 연막을 펼쳤습니다.`);
  }
}

function isEngineerMechaActive(player) {
  return player?.classId === "engineer" && (player.engineerMechaTimer || 0) > 0;
}

function getEngineerMechaDuration(player) {
  const equipmentDurationMul = player.engineerMechaModule ? ENGINEER_ADAPTIVE_MECHA_DURATION_MUL : 1;
  return 8.5 * equipmentDurationMul * (hasUpgrade(player, "engineer_reinforced_frame") ? 1.08 : 1);
}

function getEngineerMechaAttackDamageMul(player) {
  if (!isEngineerMechaActive(player)) return 1.05;
  return ENGINEER_MECHA_ATTACK_DAMAGE_MUL;
}

function getEngineerMechaArmorBonus(player) {
  if (!isEngineerMechaActive(player)) return 0;
  return hasUpgrade(player, "engineer_reinforced_frame") ? 8 : 7;
}

function getEngineerMechaMoveMultiplier(player) {
  if (!isEngineerMechaActive(player)) return 1;
  return hasUpgrade(player, "engineer_singularity_core") ? 1 : ENGINEER_MECHA_MOVE_MUL;
}

function getAttackCooldownMultiplier(player) {
  const classMul = isEngineerMechaActive(player) ? ENGINEER_MECHA_ATTACK_COOLDOWN_MUL : 1;
  return classMul * getAttackSpeedCooldownMultiplier(player);
}

function getAttackSpeedCooldownMultiplier(player) {
  const attackSpeed = clamp(Number(player?.attackSpeed) || 0, 0, 500);
  return 100 / (100 + attackSpeed);
}

function getEngineerMechaLaserAreaMul(player) {
  return clamp(Math.max(0.4, player.areaMul || 1), 0.75, 2.05);
}

function getAdaptiveMechaLaserRadius(player) {
  return 18 * Math.max(0.4, Number(player?.areaMul) || 1);
}

function fireEngineerMechaHandLasers(room, player, aim, def) {
  const size = getPlayerSizeScale(player);
  const side = { x: -aim.y, y: aim.x };
  const startForward = 32 * size;
  const handOffset = 19 * size;
  const radius = ENGINEER_MECHA_HAND_LASER_WIDTH * getEngineerMechaLaserAreaMul(player);
  const speed = def.projectileSpeed * 1.58 * (player.projectileSpeedMul || 1);
  const damage = def.damage * getEngineerMechaAttackDamageMul(player) * 0.68;

  for (const handSide of [-1, 1]) {
    const x = player.x + aim.x * startForward + side.x * handSide * handOffset;
    const y = player.y + aim.y * startForward + side.y * handSide * handOffset;
    room.projectiles.push({
      id: nextProjectileId++,
      ownerId: player.id,
      classId: "engineer",
      x,
      y,
      vx: aim.x * speed,
      vy: aim.y * speed,
      distanceLeft: getPlayerProjectileTravelDistance(room, radius),
      damage,
      radius,
      pierce: 0,
      splash: 0,
      poison: false,
      slow: 0,
      chain: 0,
      style: "engineer_mecha_laser_shot",
      hostile: false,
      dead: false
    });
    addEffect(room, "shot", x + aim.x * radius * 0.8, y + aim.y * radius * 0.8, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.engineer.color,
      radius: radius * 3.2,
      style: "engineer_mecha_laser_muzzle",
      handSide,
      duration: 0.13
    });
  }
}

function triggerEngineerLaserModule(room, player, aim, def) {
  if (!hasUpgrade(player, "engineer_overclock")) return;
  if (!player.skillMechanics) player.skillMechanics = {};
  const nextCharge = Math.max(0, Math.floor(player.skillMechanics.engineerMechaLaserCharge || 0)) + 1;
  addEngineerLaserModuleChargeEffect(room, player, nextCharge, ENGINEER_MECHA_LASER_MODULE_SHOTS, nextCharge >= ENGINEER_MECHA_LASER_MODULE_SHOTS);
  if (nextCharge < ENGINEER_MECHA_LASER_MODULE_SHOTS) {
    player.skillMechanics.engineerMechaLaserCharge = nextCharge;
    return;
  }
  player.skillMechanics.engineerMechaLaserCharge = 0;
  fireEngineerMechaGiantLaser(room, player, aim, def);
}

function addEngineerLaserModuleChargeEffect(room, player, chargeStep, chargeMax, release = false) {
  const step = clamp(Math.max(1, Math.floor(chargeStep || 1)), 1, Math.max(1, chargeMax || ENGINEER_MECHA_LASER_MODULE_SHOTS));
  const max = Math.max(1, Math.floor(chargeMax || ENGINEER_MECHA_LASER_MODULE_SHOTS));
  const ratio = step / max;
  addEffect(room, "impact", player.x, player.y, {
    color: ENGINEER_MECHA_GIANT_LASER_COLOR,
    radius: 44 + ratio * 42,
    style: "engineer_laser_module_charge",
    chargeStep: step,
    chargeMax: max,
    release,
    duration: release ? 0.28 : 0.42
  });
}

function fireEngineerMechaGiantLaser(room, player, aim, def) {
  const padding = 12;
  const range = distanceToWorldEdge(room, player.x, player.y, aim.x, aim.y, padding);
  const fromX = player.x;
  const fromY = player.y;
  const toX = clamp(player.x + aim.x * range, padding, room.world.w - padding);
  const toY = clamp(player.y + aim.y * range, padding, room.world.h - padding);
  const length = Math.hypot(toX - fromX, toY - fromY);
  const width = ENGINEER_MECHA_GIANT_LASER_WIDTH * getEngineerMechaLaserAreaMul(player);
  addEffect(room, "shot", (fromX + toX) / 2, (fromY + toY) / 2, {
    angle: Math.atan2(aim.y, aim.x),
    color: ENGINEER_MECHA_GIANT_LASER_COLOR,
    radius: length / 2,
    fromX: round2(fromX),
    fromY: round2(fromY),
    toX: round2(toX),
    toY: round2(toY),
    width: round2(width),
    rangeType: "line",
    style: "engineer_laser_module_beam",
    duration: 0.52
  });
  addEffect(room, "impact", player.x, player.y, {
    color: ENGINEER_MECHA_GIANT_LASER_COLOR,
    radius: width * 1.15,
    style: "engineer_laser_module_core",
    duration: 0.28
  });
  damageEnemiesOnLine(room, player, fromX, fromY, toX, toY, width, def.damage * 4.25, {
    impactStyle: "electric_hit",
    impactScale: 0.82,
    knockback: 82,
    maxPush: 128
  });
}

function activateEngineerMecha(room, player, def) {
  const duration = getEngineerMechaDuration(player);
  player.engineerMechaTimer = Math.max(player.engineerMechaTimer || 0, duration);
  if (!player.skillMechanics) player.skillMechanics = {};
  player.skillMechanics.engineerMechaLaserCharge = 0;
  player.shield = Math.max(player.shield, Math.round(player.maxHp * 0.36 * (player.shieldMul || 1)));
  player.shieldTimer = Math.max(player.shieldTimer, duration);
  player.immunityTimer = Math.max(player.immunityTimer || 0, 0.22);
  addEffect(room, "shield", player.x, player.y, {
    color: classes.engineer.color,
    radius: 106,
    style: "engineer_mecha_board",
    duration: 0.58
  });
  addEffect(room, "shot", player.x, player.y, {
    color: classes.engineer.color,
    radius: 76,
    style: "engineer_mecha_boot",
    duration: 0.34
  });
  pushEvent(room, `${player.name} 님이 메카에 탑승했습니다.`);
}

function performEngineerSkill(room, player, slot, aim, def) {
  if (slot === "q") {
    const x = clamp(player.input.aimX, 44, room.world.w - 44);
    const y = clamp(player.input.aimY, 44, room.world.h - 44);
    deployEngineerTurret(room, player, x, y, def, false);
    if (hasUpgrade(player, "engineer_twin_turret") || player.engineerAuxTurret) {
      const side = rotate(aim, Math.PI / 2);
      deployEngineerTurret(room, player, clamp(x + side.x * 62, 44, room.world.w - 44), clamp(y + side.y * 62, 44, room.world.h - 44), def, true);
    }
    if (player.mechanistTurretMine) deployEngineerMine(room, player, x, y, def, { passive: true });
    trimOwnedHazards(room, player.id, "engineer_turret", hasUpgrade(player, "engineer_twin_turret") || player.engineerAuxTurret ? 4 : 2);
    pushEvent(room, `${player.name} 님이 자동 터렛을 설치했습니다.`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "engineer_mecha")) {
    activateEngineerMecha(room, player, def);
    return;
  }

  if (slot === "r" && hasUpgrade(player, "engineer_mine")) {
    const x = clamp(player.input.aimX, 44, room.world.w - 44);
    const y = clamp(player.input.aimY, 44, room.world.h - 44);
    const charged = hasUpgrade(player, "engineer_mine_field");
    const remainingCharges = consumeEngineerMineCharge(player);
    deployEngineerMine(room, player, x, y, def, { charged });
    addEffect(room, "trap", x, y, { color: classes.engineer.color, radius: charged ? 78 : 68, style: charged ? "charged_mine" : "shock_mine" });
    pushEvent(room, remainingCharges > 0
      ? `${player.name} 님이 감전 지뢰를 설치했습니다. (${remainingCharges}회 충전 남음)`
      : `${player.name} 님이 감전 지뢰를 설치했습니다.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "engineer_drone")) {
    const baseCount = hasUpgrade(player, "engineer_drone_swarm") ? 2 : 1;
    const droneCount = baseCount + Math.max(0, Math.floor(player.engineerDroneBonus || 0));
    for (let index = 0; index < droneCount; index += 1) {
      const swarmAuxiliary = index >= baseCount;
      deployEngineerDrone(room, player, def, (Math.PI * 2 * index) / droneCount, {
        cooldownSourceSlot: "f",
        damageMul: swarmAuxiliary ? ENGINEER_SWARM_AUXILIARY_DAMAGE_MUL : 1,
        swarmAuxiliary
      });
    }
    trimOwnedSkillDrones(room, player.id, droneCount);
    if (hasUpgrade(player, "engineer_interceptor")) {
      player.shield = Math.max(player.shield, 32);
      player.shieldTimer = Math.max(player.shieldTimer, 4.4);
    }
    pushEvent(room, `${player.name} launched drone.`);
  }
}

function performPuppeteerSkill(room, player, slot, aim, def) {
  const targetX = clamp(player.input.aimX, 48, room.world.w - 48);
  const targetY = clamp(player.input.aimY, 48, room.world.h - 48);

  if (slot === "q") {
    let puppet = getActivePuppet(room, player.id);
    if (!puppet) {
      puppet = deployPuppet(room, player, targetX, targetY, def, { opening: true });
      pushEvent(room, `${player.name} called a puppet.`);
      return;
    }
    commandPuppetDash(room, player, puppet, targetX, targetY, def.damage * 1.6, {
      width: 62 * player.areaMul,
      impactRadius: 128 * player.areaMul,
      impactDamage: def.damage * 1.18,
      style: "puppet_command",
      threadMark: hasUpgrade(player, "puppeteer_dual_cast") ? 2 : 1,
      detonate: true
    });
    addEffect(room, "chain", (player.x + puppet.x) / 2, (player.y + puppet.y) / 2, {
      color: classes.puppeteer.color,
      radius: distance(player, puppet),
      fromX: round2(player.x),
      fromY: round2(player.y),
      toX: round2(puppet.x),
      toY: round2(puppet.y),
      style: "thread_bind"
    });
    if (hasUpgrade(player, "puppeteer_grand_theater")) {
      damageEnemiesInRadius(room, player, player.x, player.y, 148 * player.areaMul, def.damage * 1.45, { slow: 1.2, knockback: 70, threadMark: 2 });
      detonateThreadMarksInRadius(room, player, player.x, player.y, 240 * player.areaMul, def.damage * 1.18, { slow: 1.2 });
      addEffect(room, "slash", player.x, player.y, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.puppeteer.color,
        radius: 170 * player.areaMul,
        style: "thread_theater"
      });
    }
    pushEvent(room, `${player.name} commanded puppet cut.`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "puppeteer_puppet")) {
    const puppet = getActivePuppet(room, player.id);
    if (!puppet) {
      deployPuppet(room, player, targetX, targetY, def, { opening: true });
      pushEvent(room, `${player.name} summoned puppet.`);
      return;
    }
    commandPuppetDash(room, player, puppet, targetX, targetY, def.damage * (hasUpgrade(player, "puppeteer_razor_puppet") ? 2.25 : 1.85), {
      width: (hasUpgrade(player, "puppeteer_razor_puppet") ? 78 : 62) * player.areaMul,
      impactRadius: (hasUpgrade(player, "puppeteer_guard_puppet") ? 166 : 134) * player.areaMul,
      impactDamage: def.damage * (hasUpgrade(player, "puppeteer_razor_puppet") ? 1.55 : 1.12),
      style: "puppet_ambush",
      refresh: true,
      threadMark: hasUpgrade(player, "puppeteer_razor_puppet") ? 2 : 1,
      detonate: hasUpgrade(player, "puppeteer_razor_puppet")
    });
    pushEvent(room, `${player.name} ordered puppet ambush.`);
    return;
  }

  if (slot === "r" && hasUpgrade(player, "puppeteer_bind")) {
    let puppet = getActivePuppet(room, player.id);
    if (!puppet) {
      puppet = deployPuppet(room, player, targetX, targetY, def, { opening: false });
    }
    performThreadCage(room, player, puppet, { x: targetX, y: targetY }, def);
    pushEvent(room, `${player.name} cast thread cage.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "puppeteer_swap")) {
    const puppet = getActivePuppet(room, player.id);
    if (!puppet) {
      deployPuppet(room, player, targetX, targetY, def, { opening: true });
      return;
    }
    const oldX = player.x;
    const oldY = player.y;
    const oldPuppetX = puppet.x;
    const oldPuppetY = puppet.y;
    const playerSwapPoint = getMapBoundedMovementEndpoint(
      room,
      player,
      oldPuppetX - oldX,
      oldPuppetY - oldY,
      32,
      getPlayerCollisionRadius(player)
    );
    const puppetSwapPoint = getMapBoundedMovementEndpoint(
      room,
      puppet,
      oldX - oldPuppetX,
      oldY - oldPuppetY,
      Math.max(32, (puppet.radius || 25) + 8),
      puppet.radius || 25
    );
    player.x = playerSwapPoint.x;
    player.y = playerSwapPoint.y;
    puppet.x = puppetSwapPoint.x;
    puppet.y = puppetSwapPoint.y;
    puppet.attackTimer = 0;
    puppet.timer = Math.max(puppet.timer || 0, getPuppetDuration(player) * 0.58);
    const radius = (hasUpgrade(player, "puppeteer_finale") ? 206 : 154) * player.areaMul;
    addEffect(room, "dash", (oldX + player.x) / 2, (oldY + player.y) / 2, {
      color: classes.puppeteer.color,
      angle: Math.atan2(player.y - oldY, player.x - oldX),
      radius: distance({ x: oldX, y: oldY }, player) * 0.5,
      style: "puppet_swap",
      fromX: round2(oldX),
      fromY: round2(oldY),
      toX: round2(player.x),
      toY: round2(player.y)
    });
    addEffect(room, "chain", (oldX + oldPuppetX) / 2, (oldY + oldPuppetY) / 2, {
      color: classes.puppeteer.color,
      radius: Math.hypot(oldPuppetX - oldX, oldPuppetY - oldY),
      fromX: round2(oldX),
      fromY: round2(oldY),
      toX: round2(oldPuppetX),
      toY: round2(oldPuppetY),
      style: "thread_bind"
    });
    damageThreadSegment(room, player, oldX, oldY, oldPuppetX, oldPuppetY, 70 * player.areaMul, def.damage * 1.35, {
      slow: 1.1,
      pullTo: { x: (oldX + oldPuppetX) / 2, y: (oldY + oldPuppetY) / 2 },
      threadMark: 2,
      detonate: true
    });
    damagePuppeteerFinaleBurst(room, player, player.x, player.y, radius, def.damage * (hasUpgrade(player, "puppeteer_finale") ? 2.65 : 1.82));
    damagePuppeteerFinaleBurst(room, player, puppet.x, puppet.y, radius * 0.88, def.damage * (hasUpgrade(player, "puppeteer_finale") ? 2.05 : 1.28));
    player.immunityTimer = Math.max(player.immunityTimer, 0.22);
    if (hasUpgrade(player, "puppeteer_backstage")) {
      player.shield = Math.max(player.shield, 38);
      player.shieldTimer = Math.max(player.shieldTimer, 3.4);
      player.dashSpeedTimer = Math.max(player.dashSpeedTimer, 1.6);
      player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.18);
    }
    pushEvent(room, `${player.name} performed finale swap.`);
  }
}

function getPuppetDuration(player) {
  return (hasUpgrade(player, "puppeteer_soul_stitch") ? 18 : 13.5) * (hasUpgrade(player, "puppeteer_twin_souls") ? 1.24 : 1);
}

function deployPuppet(room, player, x, y, def, options = {}) {
  removeOwnedHazards(room, player.id, "puppet");
  const summonTime = options.opening ? 0.56 : 0.44;
  const puppetRadius = hasUpgrade(player, "puppeteer_guard_puppet") ? 31 : 25;
  const rawX = clamp(x, 48, room.world.w - 48);
  const rawY = clamp(y, 48, room.world.h - 48);
  const spawnPoint = getMapBoundedMovementEndpoint(
    room,
    player,
    rawX - player.x,
    rawY - player.y,
    Math.max(48, puppetRadius + 8),
    puppetRadius
  );
  const puppet = {
    id: nextHazardId++,
    type: "puppet",
    ownerId: player.id,
    x: spawnPoint.x,
    y: spawnPoint.y,
    radius: puppetRadius,
    timer: getPuppetDuration(player),
    armTime: summonTime,
    armTimeMax: summonTime,
    spawnFromX: round2(player.x),
    spawnFromY: round2(player.y),
    moveTime: summonTime,
    moveTimeMax: summonTime,
    moveFromX: round2(player.x),
    moveFromY: round2(player.y),
    attackTimer: 0,
    damage: def.damage * (hasUpgrade(player, "puppeteer_razor_puppet") ? 1.34 : 1.05),
    color: classes.puppeteer.color,
    dead: false
  };
  room.hazards.push(puppet);
  addEffect(room, "dash", (player.x + puppet.x) / 2, (player.y + puppet.y) / 2, {
    color: classes.puppeteer.color,
    angle: Math.atan2(puppet.y - player.y, puppet.x - player.x),
    radius: Math.max(58, distance(player, puppet) * 0.54),
    style: "puppet_summon_thread",
    fromX: round2(player.x),
    fromY: round2(player.y),
    toX: round2(puppet.x),
    toY: round2(puppet.y),
    moveDuration: round2(summonTime)
  });
  addEffect(room, "chain", (player.x + puppet.x) / 2, (player.y + puppet.y) / 2, {
    color: classes.puppeteer.color,
    radius: distance(player, puppet),
    fromX: round2(player.x),
    fromY: round2(player.y),
    toX: round2(puppet.x),
    toY: round2(puppet.y),
    style: "thread_bind",
    duration: summonTime + 0.18
  });
  addEffect(room, "shield", puppet.x, puppet.y, {
    color: classes.puppeteer.color,
    radius: options.opening ? 92 : 68,
    style: "puppet_summon"
  });
  if (options.opening) {
    damageEnemiesInRadius(room, player, puppet.x, puppet.y, 132 * player.areaMul, def.damage * 0.92, {
      slow: 1.2,
      pullTo: { x: puppet.x, y: puppet.y }
    });
  }
  return puppet;
}

function commandPuppetDash(room, player, puppet, x, y, damage, options = {}) {
  if (!puppet || puppet.dead) return;
  const startX = puppet.x;
  const startY = puppet.y;
  const rawEndX = clamp(x, 40, room.world.w - 40);
  const rawEndY = clamp(y, 40, room.world.h - 40);
  const endPoint = getMapBoundedMovementEndpoint(
    room,
    puppet,
    rawEndX - startX,
    rawEndY - startY,
    Math.max(40, (puppet.radius || 25) + 8),
    puppet.radius || 25
  );
  const endX = endPoint.x;
  const endY = endPoint.y;
  const dashDistance = Math.hypot(endX - startX, endY - startY);
  const width = options.width || 56 * player.areaMul;
  const impactRadius = options.impactRadius || 118 * player.areaMul;
  const duration = clamp(dashDistance / 940, 0.16, 0.34);

  puppet.moveFromX = round2(startX);
  puppet.moveFromY = round2(startY);
  puppet.moveTime = duration;
  puppet.moveTimeMax = duration;
  puppet.armTime = 0;
  puppet.armTimeMax = 0;

  addEffect(room, "dash", (startX + endX) / 2, (startY + endY) / 2, {
    color: classes.puppeteer.color,
    angle: Math.atan2(endY - startY, endX - startX),
    radius: Math.max(48, dashDistance * 0.55),
    style: options.style || "puppet_lunge",
    fromX: round2(startX),
    fromY: round2(startY),
    toX: round2(endX),
    toY: round2(endY),
    moveDuration: round2(duration)
  });
  addEffect(room, "chain", (startX + endX) / 2, (startY + endY) / 2, {
    color: classes.puppeteer.color,
    radius: dashDistance,
    fromX: round2(startX),
    fromY: round2(startY),
    toX: round2(endX),
    toY: round2(endY),
    style: "thread_bind"
  });

  damageThreadSegment(room, player, startX, startY, endX, endY, width, damage, {
    slow: hasUpgrade(player, "puppeteer_twin_souls") ? 1.8 : 1.2,
    pullTo: { x: endX, y: endY },
    knockback: hasUpgrade(player, "puppeteer_razor_puppet") ? 92 : 58,
    threadMark: options.threadMark || 1,
    detonate: Boolean(options.detonate)
  });

  puppet.x = endX;
  puppet.y = endY;
  puppet.attackTimer = 0;
  if (options.refresh) puppet.timer = Math.max(puppet.timer || 0, getPuppetDuration(player) * 0.72);
  addEffect(room, "slash", endX, endY, {
    angle: Math.atan2(endY - startY, endX - startX),
    color: classes.puppeteer.color,
    radius: impactRadius,
    style: "puppet_slash"
  });
  damageEnemiesInRadius(room, player, endX, endY, impactRadius, options.impactDamage || damage * 0.72, {
    slow: 1.1,
    knockback: options.knockback || 72,
    threadMark: options.threadMark || 1
  });
  if (options.detonate) {
    detonateThreadMarksInRadius(room, player, endX, endY, impactRadius * 1.05, damage * 0.72, { slow: 1.1 });
  }
}

function performThreadCage(room, player, puppet, anchor, def) {
  const width = (hasUpgrade(player, "puppeteer_thread_saw") ? 68 : 50) * player.areaMul;
  const center = {
    x: (player.x + puppet.x + anchor.x) / 3,
    y: (player.y + puppet.y + anchor.y) / 3
  };
  const baseDamage = def.damage * (hasUpgrade(player, "puppeteer_thread_saw") ? 1.72 : 1.28);
  const bindTime = hasUpgrade(player, "puppeteer_twin_souls") ? 3.1 : 2.2;

  damageThreadSegment(room, player, player.x, player.y, puppet.x, puppet.y, width, baseDamage, { slow: bindTime, pullTo: center, threadMark: 2, detonate: hasUpgrade(player, "puppeteer_thread_saw") });
  damageThreadSegment(room, player, puppet.x, puppet.y, anchor.x, anchor.y, width, baseDamage, { slow: bindTime, pullTo: center, threadMark: 2, detonate: hasUpgrade(player, "puppeteer_thread_saw") });
  damageThreadSegment(room, player, anchor.x, anchor.y, player.x, player.y, width, baseDamage, { slow: bindTime, pullTo: center, threadMark: 2, detonate: hasUpgrade(player, "puppeteer_thread_saw") });

  addEffect(room, "warning", center.x, center.y, {
    color: classes.puppeteer.color,
    radius: Math.max(120, Math.hypot(player.x - puppet.x, player.y - puppet.y) * 0.28),
    style: "thread_cage",
    duration: 0.42
  });

  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const inside = pointInTriangle(enemy, player, puppet, anchor);
    const nearCenter = distance(enemy, center) <= 120 * player.areaMul + enemy.radius;
    if (!inside && !nearCenter) continue;
    enemy.slowTimer = Math.max(enemy.slowTimer, bindTime + 0.4);
    applyThreadMark(room, player, enemy, inside ? 2 : 1, bindTime + 3.2);
    if (enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, center.x - enemy.x, center.y - enemy.y, hasUpgrade(player, "puppeteer_thread_saw") ? 112 : 82, {
        duration: 0.24,
        maxDistance: 140,
        style: "hit_knockback"
      });
    }
    dealDamage(room, enemy, def.damage * (inside ? 1.36 : 0.84), player.id, { noVulnerable: true });
    if (inside || hasUpgrade(player, "puppeteer_thread_saw")) detonateThreadMark(room, player, enemy, def.damage * 0.78, { slow: bindTime });
  }

  if (hasUpgrade(player, "puppeteer_cross_bind")) {
    const sideA = normalizeVector(puppet.x - player.x, puppet.y - player.y);
    const sideB = { x: -sideA.y, y: sideA.x };
    const cross = 240 * player.areaMul;
    damageThreadSegment(room, player, center.x - sideA.x * cross, center.y - sideA.y * cross, center.x + sideA.x * cross, center.y + sideA.y * cross, width * 0.82, def.damage * 1.05, { slow: 1.5, pullTo: center, threadMark: 2, detonate: true });
    damageThreadSegment(room, player, center.x - sideB.x * cross, center.y - sideB.y * cross, center.x + sideB.x * cross, center.y + sideB.y * cross, width * 0.82, def.damage * 1.05, { slow: 1.5, pullTo: center, threadMark: 2, detonate: true });
  }

  if (hasUpgrade(player, "puppeteer_twin_souls")) {
    commandPuppetDash(room, player, puppet, center.x, center.y, def.damage * 1.22, {
      width: width * 0.8,
      impactRadius: 126 * player.areaMul,
      impactDamage: def.damage * 1.1,
      style: "puppet_lunge",
      refresh: true
    });
  }
}

function damageThreadSegment(room, player, ax, ay, bx, by, width, damage, options = {}) {
  const length = Math.hypot(bx - ax, by - ay);
  addEffect(room, "chain", (ax + bx) / 2, (ay + by) / 2, {
    color: classes.puppeteer.color,
    radius: length,
    fromX: round2(ax),
    fromY: round2(ay),
    toX: round2(bx),
    toY: round2(by),
    style: "thread_bind"
  });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distanceToSegment(enemy, ax, ay, bx, by) > width + enemy.radius) continue;
    if (options.slow) enemy.slowTimer = Math.max(enemy.slowTimer, options.slow);
    const markStacks = options.threadMark || (hasUpgrade(player, "puppeteer_thread_saw") ? 2 : 1);
    applyThreadMark(room, player, enemy, markStacks, options.threadDuration || 6.4);
    if (options.pullTo && enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, options.pullTo.x - enemy.x, options.pullTo.y - enemy.y, 72, {
        duration: 0.2,
        maxDistance: 112,
        style: "hit_knockback"
      });
    }
    const dealt = dealDamage(room, enemy, damage, player.id, { noVulnerable: true });
    if (dealt > 0 && options.detonate) detonateThreadMark(room, player, enemy, damage * 0.72, { slow: options.slow || 0.9 });
    if (dealt > 0 && options.knockback) {
      const midX = (ax + bx) / 2;
      const midY = (ay + by) / 2;
      startEnemyKnockback(room, enemy, enemy.x - midX, enemy.y - midY, options.knockback, {
        duration: 0.16,
        maxDistance: 120,
        style: "hit_knockback"
      });
    }
  }
}

function damagePuppeteerFinaleBurst(room, player, x, y, radius, damage) {
  addEffect(room, "slash", x, y, {
    angle: Math.random() * Math.PI * 2,
    color: classes.puppeteer.color,
    radius,
    style: "thread_theater"
  });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance({ x, y }, enemy) > radius + enemy.radius) continue;
    const lowHpMul = hasUpgrade(player, "puppeteer_finale") && enemy.hp <= enemy.maxHp * 0.34 ? 1.55 : 1;
    enemy.slowTimer = Math.max(enemy.slowTimer, 1.2);
    applyThreadMark(room, player, enemy, hasUpgrade(player, "puppeteer_finale") ? 2 : 1, 5.5);
    const dealt = dealDamage(room, enemy, damage * lowHpMul, player.id, { noVulnerable: true });
    if (dealt > 0) detonateThreadMark(room, player, enemy, damage * 0.52, { slow: 1.2 });
    if (dealt > 0 && enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, enemy.x - x, enemy.y - y, 105, {
        duration: 0.18,
        maxDistance: 135,
        style: "hit_knockback"
      });
    }
  }
}

function pointInTriangle(point, a, b, c) {
  const area = (p1, p2, p3) => Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2);
  const whole = area(a, b, c);
  if (whole <= 1) return false;
  const sum = area(point, b, c) + area(a, point, c) + area(a, b, point);
  return Math.abs(sum - whole) <= Math.max(18, whole * 0.08);
}

function deployEngineerTurret(room, player, x, y, def, mini = false) {
  const armTime = mini ? 0.38 : 0.46;
  const fireRateMul = getEngineerFireRateMul(player);
  room.hazards.push({
    id: nextHazardId++,
    type: "engineer_turret",
    ownerId: player.id,
    cooldownSourceSlot: "q",
    x,
    y,
    radius: mini ? 17 : 23,
    timer: (mini ? 12 : 17.5) * getEngineerDurationMul(player),
    fireTimer: 0,
    fireRate: (mini ? 0.64 : 0.5) * fireRateMul,
    missileTimer: hasUpgrade(player, "engineer_turret_missile") ? (mini ? 1.65 : 1.35) * fireRateMul : 999,
    missileAttackSpeedMul: fireRateMul,
    armTime,
    armTimeMax: armTime,
    damage: def.damage * (mini ? 0.72 : 1.1),
    range: (hasUpgrade(player, "engineer_rail_turret") ? 560 : 440) * player.rangeMul,
    rail: hasUpgrade(player, "engineer_rail_turret"),
    missileModule: hasUpgrade(player, "engineer_turret_missile"),
    style: hasUpgrade(player, "engineer_rail_turret") ? "laser_turret" : "turret",
    fireCount: 0,
    overclockTimer: 0,
    color: classes.engineer.color,
    dead: false
  });
  addEngineerDeviceThrowEffect(room, player, x, y, mini ? "mini_turret" : "turret", mini ? 0.4 : 0.46);
  addEffect(room, "shield", x, y, { color: classes.engineer.color, radius: mini ? 44 : 58, style: mini ? "mini_turret" : "turret_deploy" });
}

function addEngineerDeviceThrowEffect(room, player, x, y, device, duration = 0.46) {
  const dx = x - player.x;
  const dy = y - player.y;
  const distanceToTarget = Math.hypot(dx, dy);
  const safeDuration = clamp(duration + Math.min(0.14, distanceToTarget / 2600), 0.34, 0.68);
  addEffect(room, "shot", (player.x + x) / 2, (player.y + y) / 2, {
    color: classes.engineer.color,
    radius: device === "turret" ? 72 : device === "mini_turret" ? 58 : 52,
    style: "engineer_device_throw",
    device,
    fromX: round2(player.x),
    fromY: round2(player.y),
    toX: round2(x),
    toY: round2(y),
    duration: round2(safeDuration)
  });
}

function getEngineerMineMaxCharges(player) {
  return hasUpgrade(player, "engineer_mine_field") ? 3 : 1;
}

function updateEngineerMineCharges(player) {
  if (!player || player.classId !== "engineer") return;
  if (!hasUpgrade(player, "engineer_mine")) {
    player.engineerMineCharges = 0;
    player.engineerMineChargesInitialized = false;
    return;
  }
  const maxCharges = getEngineerMineMaxCharges(player);
  if (maxCharges <= 1) {
    player.engineerMineCharges = 0;
    player.engineerMineChargesInitialized = false;
    return;
  }
  if (!player.engineerMineChargesInitialized) {
    player.engineerMineCharges = maxCharges;
    player.engineerMineChargesInitialized = true;
    return;
  }
  player.engineerMineCharges = clamp(Math.floor(Number(player.engineerMineCharges) || 0), 0, maxCharges);
  if (player.engineerMineCharges < maxCharges && (player.skillTimers?.r || 0) <= 0) {
    player.engineerMineCharges += 1;
    if (player.engineerMineCharges < maxCharges) player.skillTimers.r = getSkillCooldown(player, "r");
  }
}

function trimOwnedSkillDrones(room, ownerId, maxCount) {
  const drones = room.hazards.filter((hazard) => hazard.ownerId === ownerId && hazard.type === "engineer_drone" && !hazard.gearDroneType && !hazard.dead);
  while (drones.length > maxCount) {
    const oldest = drones.shift();
    if (oldest) oldest.dead = true;
  }
}

function fireAdaptiveMechaContinuousLaser(room, player, aim, def) {
  const probeDistance = Math.hypot(room.world.w, room.world.h);
  const muzzleX = player.x + aim.x * 42;
  const muzzleY = player.y + aim.y * 42;
  const endpoint = getMapBoundedMovementEndpoint(room, { x: muzzleX, y: muzzleY }, aim.x * probeDistance, aim.y * probeDistance, 4, 4);
  const beamRadius = getAdaptiveMechaLaserRadius(player);
  const attackCycle = Math.max(0.08, def.attackCd * player.cooldownMul * getAttackCooldownMultiplier(player));
  const tickInterval = clamp(attackCycle / 4, 0.055, 0.12);
  const tickDamage = def.damage * 0.82 * (tickInterval / attackCycle);
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distanceToSegment(enemy, muzzleX, muzzleY, endpoint.x, endpoint.y) > beamRadius + enemy.radius) continue;
    const dealt = dealDamage(room, enemy, tickDamage, player.id, {
      skillTag: "engineer_adaptive_continuous_laser",
      basicAttack: true,
      noVulnerable: true
    });
    if (dealt > 0 && enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, aim.x, aim.y, ENGINEER_ADAPTIVE_LASER_KNOCKBACK, {
        duration: 0.05,
        maxDistance: ENGINEER_ADAPTIVE_LASER_MAX_PUSH,
        style: "adaptive_laser_push"
      });
    }
  }
  return { muzzleX, muzzleY, endpoint, beamRadius, tickInterval };
}

function updateAdaptiveMechaContinuousLaser(room, player, def, dt) {
  const aim = getAimVector(player);
  player.lastAttackAt = Date.now();
  player.adaptiveMechaLaserTick = Math.max(0, Number(player.adaptiveMechaLaserTick || 0) - dt);
  player.adaptiveMechaLaserVisualTick = Math.max(0, Number(player.adaptiveMechaLaserVisualTick || 0) - dt);

  let beam = null;
  if (player.adaptiveMechaLaserTick <= 0) {
    beam = fireAdaptiveMechaContinuousLaser(room, player, aim, def);
    player.adaptiveMechaLaserTick = beam.tickInterval;
  }
  if (player.adaptiveMechaLaserVisualTick > 0) return;

  if (!beam) {
    const probeDistance = Math.hypot(room.world.w, room.world.h);
    const muzzleX = player.x + aim.x * 42;
    const muzzleY = player.y + aim.y * 42;
    beam = {
      muzzleX,
      muzzleY,
      endpoint: getMapBoundedMovementEndpoint(room, { x: muzzleX, y: muzzleY }, aim.x * probeDistance, aim.y * probeDistance, 4, 4),
      beamRadius: getAdaptiveMechaLaserRadius(player)
    };
  }
  const beamLength = Math.hypot(beam.endpoint.x - beam.muzzleX, beam.endpoint.y - beam.muzzleY);
  addEffect(room, "shot", (beam.muzzleX + beam.endpoint.x) / 2, (beam.muzzleY + beam.endpoint.y) / 2, {
    color: "#38bdf8",
    fromX: round2(beam.muzzleX),
    fromY: round2(beam.muzzleY),
    toX: round2(beam.endpoint.x),
    toY: round2(beam.endpoint.y),
    aimX: round2(player.input.aimX),
    aimY: round2(player.input.aimY),
    beamLength: round2(beamLength),
    muzzleDistance: 42,
    hitRadius: round2(beam.beamRadius),
    width: round2(beam.beamRadius * 2),
    radius: beamLength * 0.5,
    angle: Math.atan2(aim.y, aim.x),
    rangeType: "line",
    style: "engineer_mecha_hand_laser adaptive_continuous_laser",
    duration: 0.14
  });
  player.adaptiveMechaLaserVisualTick = 0.05;
}

function consumeEngineerMineCharge(player) {
  const maxCharges = getEngineerMineMaxCharges(player);
  if (maxCharges <= 1) {
    player.engineerMineCharges = 0;
    return 0;
  }
  player.engineerMineCharges = clamp(Math.floor(Number(player.engineerMineCharges) || 0), 0, maxCharges);
  player.engineerMineCharges = Math.max(0, player.engineerMineCharges - 1);
  return player.engineerMineCharges;
}

function getEngineerAutoMineCooldown(player) {
  return 7.5 * skillSystem.getSkillCooldownMultiplier(player);
}

function updateEngineerAutoMine(room, player, dt) {
  if (!player || player.classId !== "engineer" || !hasUpgrade(player, "engineer_auto_mine")) {
    if (player) {
      player.engineerAutoMineTimer = 0;
      player.engineerAutoMineInitialized = false;
    }
    return;
  }
  if (!player.engineerAutoMineInitialized) {
    player.engineerAutoMineTimer = getEngineerAutoMineCooldown(player);
    player.engineerAutoMineInitialized = true;
    return;
  }
  const activeInTraining = room.status === "lobby" && room.enemies.some((enemy) => enemy.trainingDummy);
  if ((room.status !== "combat" && !activeInTraining) || player.hp <= 0) return;
  player.engineerAutoMineTimer = Math.max(0, (player.engineerAutoMineTimer || 0) - dt);
  if (player.engineerAutoMineTimer > 0) return;
  const angle = nextRoomRandom(room) * Math.PI * 2;
  const distanceFromPlayer = 72 + nextRoomRandom(room) * 118;
  const preferredX = player.x + Math.cos(angle) * distanceFromPlayer;
  const preferredY = player.y + Math.sin(angle) * distanceFromPlayer;
  const position = findFreeEnemySpawnPosition(room, preferredX, preferredY, 18);
  deployEngineerMine(room, player, position.x, position.y, classes.engineer, {
    charged: hasUpgrade(player, "engineer_mine_field"),
    passive: true,
  });
  addEffect(room, "trap", position.x, position.y, {
    color: classes.engineer.color,
    radius: hasUpgrade(player, "engineer_mine_field") ? 78 : 68,
    style: "auto_mine_drop",
  });
  player.engineerAutoMineTimer = getEngineerAutoMineCooldown(player);
}

function deployEngineerMine(room, player, x, y, def, options = {}) {
  const charged = Boolean(options.charged);
  const passive = Boolean(options.passive);
  const armTime = charged ? 0.58 : 0.62;
  const radius = (charged ? 124 : 112) * player.areaMul;
  const triggerRadius = (charged ? 92 : 82) * player.areaMul;
  const damageMul = charged ? 3.9 : 3.5;
  room.hazards.push({
    id: nextHazardId++,
    type: "engineer_mine",
    ownerId: player.id,
    x: clamp(x, 38, room.world.w - 38),
    y: clamp(y, 38, room.world.h - 38),
    radius,
    triggerRadius,
    timer: 13.5 * getEngineerDurationMul(player),
    armTime,
    armTimeMax: armTime,
    damage: def.damage * damageMul,
    charged,
    leaveFire: Boolean(player.engineerMineFire),
    style: passive ? (charged ? "auto_charged_mine" : "auto_shock_mine") : charged ? "charged_mine" : "shock_mine",
    color: classes.engineer.color,
    dead: false
  });
  const mineLimit = hasUpgrade(player, "engineer_auto_mine") ? (charged ? 9 : 7) : charged ? 7 : 5;
  trimOwnedHazards(room, player.id, "engineer_mine", mineLimit);
  addEngineerDeviceThrowEffect(room, player, x, y, passive ? "auto_mine" : charged ? "charged_mine" : "mine", 0.48);
}

function deployEngineerDrone(room, player, def, phase = 0, options = {}) {
  const swarmAuxiliary = Boolean(options.swarmAuxiliary);
  room.hazards.push({
    id: nextHazardId++,
    type: "engineer_drone",
    ownerId: player.id,
    cooldownSourceSlot: options.cooldownSourceSlot || "",
    x: player.x + Math.cos(phase) * 68,
    y: player.y + Math.sin(phase) * 68,
    radius: swarmAuxiliary ? 14 : 17,
    timer: (hasUpgrade(player, "engineer_factory") ? 18 : 14) * getEngineerDurationMul(player),
    fireTimer: 0,
    fireRate: 0.4 * getEngineerFireRateMul(player),
    damage: def.damage * (hasUpgrade(player, "engineer_interceptor") ? 0.92 : 0.78) * Math.max(0.1, Number(options.damageMul) || 1),
    range: (hasUpgrade(player, "engineer_interceptor") ? 520 : 430) * player.rangeMul,
    orbitPhase: phase,
    missileMode: hasUpgrade(player, "engineer_drone_missile"),
    kamikaze: hasUpgrade(player, "engineer_drone_kamikaze"),
    swarmAuxiliary,
    style: hasUpgrade(player, "engineer_drone_missile") ? "drone_missile" : "drone_guard",
    overclockTimer: 0,
    color: classes.engineer.color,
    dead: false
  });
  addEffect(room, "shot", player.x, player.y, { color: classes.engineer.color, radius: 64, style: "drone_launch" });
}

function getEngineerDurationMul(player) {
  return (hasUpgrade(player, "engineer_reinforced_frame") ? 1.22 : 1) * (hasUpgrade(player, "engineer_factory") ? 1.16 : 1) * (player.constructDurationMul || 1);
}

function getEngineerFireRateMul(player) {
  return (hasUpgrade(player, "engineer_calibration") ? 0.86 : 1) *
    (player.droneCooldownMul || 1) *
    getAttackSpeedCooldownMultiplier(player);
}

function overclockEngineerDeployables(room, player, def) {
  let boosted = 0;
  for (const hazard of room.hazards) {
    if (hazard.ownerId !== player.id || !["engineer_turret", "engineer_drone", "engineer_mine"].includes(hazard.type)) continue;
    boosted += 1;
    hazard.overclockTimer = Math.max(hazard.overclockTimer || 0, hasUpgrade(player, "engineer_overclock") ? 5.2 : 3.8);
    if (hazard.type === "engineer_mine") {
      hazard.armTime = Math.min(hazard.armTime || 0, 0.14);
    } else {
      hazard.fireTimer = 0;
    }
    hazard.timer += hasUpgrade(player, "engineer_factory") ? 2.4 : 1.2;
    addEffect(room, "chain", hazard.x, hazard.y, { color: classes.engineer.color, radius: hazard.radius + 46, style: "engineer_overclock" });
    if (hasUpgrade(player, "engineer_factory")) {
      damageEnemiesInRadius(room, player, hazard.x, hazard.y, 92 * player.areaMul, def.damage * 0.9, { slow: 0.8 });
    }
  }
  return boosted;
}

function updateEngineerTurret(room, hazard, dt) {
  const owner = room.players.get(hazard.ownerId);
  if (!owner || owner.hp <= 0) {
    hazard.dead = true;
    return true;
  }
  hazard.overclockTimer = Math.max(0, (hazard.overclockTimer || 0) - dt);
  hazard.fireTimer = Math.max(0, (hazard.fireTimer || 0) - dt);
  hazard.missileTimer = Math.max(0, (hazard.missileTimer || 0) - dt);
  if (hazard.fireTimer > 0) return true;
  const target = nearestEnemy(room, hazard.x, hazard.y, hazard.range || 420);
  if (!target) return true;
  const dx = target.x - hazard.x;
  const dy = target.y - hazard.y;
  const dist = Math.hypot(dx, dy) || 1;
  const aim = { x: dx / dist, y: dy / dist };
  hazard.angle = Math.atan2(dy, dx);
  if (hazard.rail) {
    const beamDamage = hazard.damage * 0.42 * (hazard.overclockTimer > 0 ? 1.32 : 1);
    const dealt = dealDamage(room, target, beamDamage, hazard.ownerId, { noVulnerable: true, skillTag: "engineer_laser_turret" });
    if (dealt > 0) addMeleeImpact(room, target, "electric_hit", 0.48);
    addEffect(room, "chain", (hazard.x + target.x) / 2, (hazard.y + target.y) / 2, {
      color: classes.engineer.color,
      radius: dist,
      fromX: round2(hazard.x + aim.x * (hazard.radius + 6)),
      fromY: round2(hazard.y + aim.y * (hazard.radius + 6)),
      toX: round2(target.x),
      toY: round2(target.y),
      angle: hazard.angle,
      style: "engineer_turret_laser",
      duration: 0.18
    });
  } else {
    const dealt = dealDamage(room, target, hazard.damage * (hazard.overclockTimer > 0 ? 1.28 : 1), hazard.ownerId, {
      skillTag: "engineer_turret_single_laser"
    });
    if (dealt > 0) addMeleeImpact(room, target, "electric_hit", 0.38);
    addEffect(room, "shot", (hazard.x + target.x) / 2, (hazard.y + target.y) / 2, {
      angle: hazard.angle,
      color: classes.engineer.color,
      radius: dist,
      fromX: round2(hazard.x + aim.x * (hazard.radius + 8)),
      fromY: round2(hazard.y + aim.y * (hazard.radius + 8)),
      toX: round2(target.x),
      toY: round2(target.y),
      width: hazard.overclockTimer > 0 ? 6 : 4.5,
      style: "engineer_single_laser turret_single_laser",
      duration: 0.16
    });
  }
  hazard.fireCount = (hazard.fireCount || 0) + 1;
  if (hazard.missileModule && hazard.missileTimer <= 0) {
    pushPlayerProjectile(room, owner, {
      ownerId: hazard.ownerId,
      classId: "engineer",
      x: hazard.x + aim.x * (hazard.radius + 6),
      y: hazard.y + aim.y * (hazard.radius + 6),
      vx: aim.x * 620,
      vy: aim.y * 620,
      distanceLeft: getPlayerProjectileTravelDistance(room, 15),
      damage: hazard.damage * 1.45 * (hazard.overclockTimer > 0 ? 1.18 : 1),
      radius: 15,
      pierce: 0,
      splash: 140 * (owner.areaMul || 1),
      poison: false,
      slow: 0,
      chain: 0,
      skillTag: "engineer_turret_missile",
      style: "engineer_missile",
      hostile: false,
      dead: false
    }, aim, { originX: hazard.x, originY: hazard.y, originDistance: hazard.radius + 6, spreadStep: 0.1 });
    addEffect(room, "shot", hazard.x, hazard.y, {
      angle: hazard.angle,
      color: classes.engineer.color,
      radius: 58,
      style: "engineer_missile_launch",
      duration: 0.34
    });
    hazard.missileTimer = Math.max(
      0.32,
      (hazard.rail ? 1.25 : 1.55) * (hazard.missileAttackSpeedMul || 1) * (hazard.overclockTimer > 0 ? 0.72 : 1),
    );
  }
  if (!hazard.rail) {
    addEffect(room, "shot", hazard.x, hazard.y, {
      angle: hazard.angle,
      color: classes.engineer.color,
      radius: hazard.radius + 24,
      style: "turret_fire"
    });
  }
  hazard.fireTimer = Math.max(hazard.rail ? 0.08 : 0.12, (hazard.rail ? 0.14 : hazard.fireRate || 0.56) * (hazard.overclockTimer > 0 ? 0.58 : 1));
  return true;
}

function updateEngineerMine(room, hazard, dt = 0) {
  hazard.overclockTimer = Math.max(0, (hazard.overclockTimer || 0) - dt);
  if ((hazard.armTime || 0) > 0) return true;
  const overclocked = hazard.overclockTimer > 0;
  const triggerRadius = (hazard.triggerRadius || hazard.radius || 80) * (overclocked ? 1.2 : 1);
  const damage = hazard.damage * (overclocked ? 1.24 : 1);
  const blastRadius = hazard.radius * (overclocked ? 1.12 : 1);
  const target = nearestEnemy(room, hazard.x, hazard.y, triggerRadius);
  if (!target) return true;
  const owner = room.players.get(hazard.ownerId);
  if (!owner) {
    hazard.dead = true;
    return true;
  }
  addEffect(room, "explosion", hazard.x, hazard.y, {
    color: classes.engineer.color,
    radius: blastRadius,
    style: hazard.charged ? "engineer_charged_mine_blast" : "shock_mine"
  });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance(hazard, enemy) > blastRadius + enemy.radius) continue;
    const dealt = dealDamage(room, enemy, damage, hazard.ownerId, {
      knockback: hazard.charged ? 108 : 90,
      skillTag: "engineer_mine"
    });
    if (dealt > 0) {
      enemy.slowTimer = Math.max(enemy.slowTimer || 0, hazard.charged ? 2.4 : 1.8);
      addMeleeImpact(room, enemy, "shield_slam", 0.82);
      addEffect(room, "slow", enemy.x, enemy.y, { color: classes.engineer.color, radius: enemy.radius + 14 });
    }
  }
  if (hazard.leaveFire) {
    room.hazards.push({
      id: nextHazardId++,
      type: "fire_pool",
      ownerId: hazard.ownerId,
      x: hazard.x,
      y: hazard.y,
      radius: blastRadius * 0.82,
      timer: hazard.charged ? 5.2 : 4.4,
      tick: 0.08,
      damage: Math.max(1, getPlayerAttackDamage(owner, "engineer") * 0.065),
      burnTime: 3.2,
      burnAttackRatio: 0.55,
      color: "#f97316",
      style: "engineer_mine_fire",
      hostile: false,
      dead: false
    });
  }
  hazard.dead = true;
  return true;
}

function updateEngineerDrone(room, hazard, dt) {
  const owner = room.players.get(hazard.ownerId);
  if (!owner || owner.hp <= 0) {
    hazard.dead = true;
    return true;
  }
  if (hazard.kamikazeActive) {
    return updateEngineerDroneKamikaze(room, hazard, owner, dt);
  }
  hazard.overclockTimer = Math.max(0, (hazard.overclockTimer || 0) - dt);
  hazard.orbitPhase = (hazard.orbitPhase || 0) + dt * (hazard.overclockTimer > 0 ? 3.1 : 2.2);
  const orbitRadius = hasUpgrade(owner, "engineer_interceptor") ? 92 : 76;
  const desiredX = owner.x + Math.cos(hazard.orbitPhase) * orbitRadius;
  const desiredY = owner.y + Math.sin(hazard.orbitPhase) * orbitRadius;
  hazard.x = clamp(hazard.x + (desiredX - hazard.x) * Math.min(1, dt * 6.5), 24, room.world.w - 24);
  hazard.y = clamp(hazard.y + (desiredY - hazard.y) * Math.min(1, dt * 6.5), 24, room.world.h - 24);
  hazard.fireTimer = Math.max(0, (hazard.fireTimer || 0) - dt);
  if (hazard.fireTimer <= 0) {
    const target = nearestEnemy(room, hazard.x, hazard.y, hazard.range || 360);
    if (target) {
      const dx = target.x - hazard.x;
      const dy = target.y - hazard.y;
      const dist = Math.hypot(dx, dy) || 1;
      const aim = { x: dx / dist, y: dy / dist };
      const missileMode = Boolean(hazard.missileMode);
      hazard.angle = Math.atan2(dy, dx);
      if (missileMode) {
        pushPlayerProjectile(room, owner, {
          ownerId: hazard.ownerId,
          classId: "engineer",
          x: hazard.x,
          y: hazard.y,
          vx: aim.x * 700,
          vy: aim.y * 700,
          distanceLeft: getPlayerProjectileTravelDistance(room, 12),
          damage: hazard.damage * 1.45 * (hazard.overclockTimer > 0 ? 1.22 : 1),
          radius: 12,
          pierce: 0,
          splash: 120 * (owner.areaMul || 1),
          poison: false,
          slow: 0,
          chain: 0,
          skillTag: "engineer_drone_missile",
          style: "drone_missile",
          hostile: false,
          dead: false
        }, aim, { originX: hazard.x, originY: hazard.y, originDistance: 0, spreadStep: 0.08 });
        addEffect(room, "shot", hazard.x, hazard.y, {
          angle: hazard.angle,
          color: classes.engineer.color,
          radius: 52,
          style: "drone_missile_launch",
          duration: 0.34
        });
      } else {
        const dealt = dealDamage(room, target, hazard.damage * 0.78 * (hazard.overclockTimer > 0 ? 1.22 : 1), hazard.ownerId, {
          noVulnerable: true,
          skillTag: "engineer_drone_single_laser"
        });
        if (dealt > 0) addMeleeImpact(room, target, "electric_hit", 0.42);
        addEffect(room, "shot", (hazard.x + target.x) / 2, (hazard.y + target.y) / 2, {
          angle: hazard.angle,
          color: classes.engineer.color,
          radius: dist,
          fromX: round2(hazard.x),
          fromY: round2(hazard.y),
          toX: round2(target.x),
          toY: round2(target.y),
          width: hazard.overclockTimer > 0 ? 5.5 : 4,
          style: "engineer_single_laser drone_single_laser",
          duration: 0.16
        });
      }
    }
    hazard.fireTimer = Math.max(0.1, (hazard.fireRate || 0.46) * (hazard.overclockTimer > 0 ? 0.55 : 1));
  }
  return true;
}

function beginEngineerDroneKamikaze(room, hazard) {
  const target = nearestEnemy(room, hazard.x, hazard.y, hazard.range || 460);
  hazard.kamikazeActive = true;
  hazard.kamikazeTargetId = target ? target.id : null;
  hazard.kamikazeTimer = 2.25;
  hazard.style = "drone_kamikaze";
  hazard.fireTimer = 999;
  if (target) hazard.angle = Math.atan2(target.y - hazard.y, target.x - hazard.x);
  addEffect(room, "dash", hazard.x, hazard.y, {
    color: classes.engineer.color,
    radius: 78,
    angle: hazard.angle || 0,
    style: "drone_kamikaze_start",
    duration: 0.34
  });
}

function explodeEngineerDroneKamikaze(room, hazard, owner) {
  const radius = 152 * (owner?.areaMul || 1);
  addEffect(room, "explosion", hazard.x, hazard.y, {
    color: classes.engineer.color,
    radius,
    style: "drone_kamikaze_explosion",
    duration: 0.62
  });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance(hazard, enemy) > radius + enemy.radius) continue;
    const dealt = dealDamage(room, enemy, hazard.damage * 3.1, hazard.ownerId, {
      knockback: 112,
      skillTag: "engineer_drone_kamikaze"
    });
    if (dealt > 0) {
      applyBurnToEnemy(room, enemy, hazard.ownerId, dealt, { duration: 3.4, totalDamageRatio: 0.5 });
      addMeleeImpact(room, enemy, "fire_tick", 0.92);
    }
  }
  hazard.dead = true;
}

function updateEngineerDroneKamikaze(room, hazard, owner, dt) {
  hazard.kamikazeTimer = Math.max(0, (hazard.kamikazeTimer || 0) - dt);
  const target =
    room.enemies.find((enemy) => enemy.id === hazard.kamikazeTargetId && enemy.hp > 0) ||
    nearestEnemy(room, hazard.x, hazard.y, hazard.range || 520);
  if (target) {
    hazard.kamikazeTargetId = target.id;
    const dx = target.x - hazard.x;
    const dy = target.y - hazard.y;
    const dist = Math.hypot(dx, dy) || 1;
    hazard.angle = Math.atan2(dy, dx);
    const step = Math.min(dist, 680 * dt);
    hazard.x = clamp(hazard.x + (dx / dist) * step, 24, room.world.w - 24);
    hazard.y = clamp(hazard.y + (dy / dist) * step, 24, room.world.h - 24);
    if (dist <= target.radius + hazard.radius + 10) {
      explodeEngineerDroneKamikaze(room, hazard, owner);
      return true;
    }
  } else {
    const angle = hazard.angle || 0;
    hazard.x = clamp(hazard.x + Math.cos(angle) * 520 * dt, 24, room.world.w - 24);
    hazard.y = clamp(hazard.y + Math.sin(angle) * 520 * dt, 24, room.world.h - 24);
  }
  if (hazard.kamikazeTimer <= 0) explodeEngineerDroneKamikaze(room, hazard, owner);
  return true;
}

function updatePuppetHazard(room, hazard, dt) {
  const owner = room.players.get(hazard.ownerId);
  if (!owner || owner.hp <= 0) {
    hazard.dead = true;
    return true;
  }
  hazard.attackTimer = Math.max(0, (hazard.attackTimer || 0) - dt);
  const target = nearestEnemy(room, hazard.x, hazard.y, 420);
  const desired = target || { x: owner.input.aimX, y: owner.input.aimY, radius: 0 };
  const dx = desired.x - hazard.x;
  const dy = desired.y - hazard.y;
  const dist = Math.hypot(dx, dy) || 1;
  const followOwnerDist = distance(hazard, owner);
  const speed = target ? 280 : followOwnerDist > 540 ? 420 : 230;
  if (dist > (target ? hazard.radius + (target.radius || 0) + 42 : 26)) {
    hazard.x = clamp(hazard.x + (dx / dist) * speed * dt, 24, room.world.w - 24);
    hazard.y = clamp(hazard.y + (dy / dist) * speed * dt, 24, room.world.h - 24);
  }
  if (target && hazard.attackTimer <= 0) {
    puppetSlash(room, owner, hazard, hazard.damage || classes.puppeteer.damage, hasUpgrade(owner, "puppeteer_razor_puppet") ? 154 : 124);
    hazard.attackTimer = hasUpgrade(owner, "puppeteer_razor_puppet") ? 0.58 : 0.72;
  }
  if (hasUpgrade(owner, "puppeteer_guard_puppet")) {
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || distance(hazard, enemy) > 210 + enemy.radius) continue;
      enemy.slowTimer = Math.max(enemy.slowTimer, 0.18);
    }
  }
  return true;
}

function puppetSlash(room, owner, puppet, damage, radius) {
  addEffect(room, "slash", puppet.x, puppet.y, {
    angle: Math.atan2((owner.input?.aimY || puppet.y) - puppet.y, (owner.input?.aimX || puppet.x + 1) - puppet.x),
    color: classes.puppeteer.color,
    radius,
    style: "puppet_slash"
  });
  damageEnemiesInRadius(room, owner, puppet.x, puppet.y, radius, damage, {
    slow: 0.8,
    knockback: 54,
    threadMark: hasUpgrade(owner, "puppeteer_razor_puppet") ? 2 : 1
  });
  if (hasUpgrade(owner, "puppeteer_dual_cast")) {
    detonateThreadMarksInRadius(room, owner, puppet.x, puppet.y, radius * 0.82, damage * 0.72, { slow: 0.9 });
  }
}

function getEnemyPoisonDpsRatio(enemy) {
  if (enemy?.type === "boss") return ENEMY_POISON_BOSS_MAX_HP_DPS;
  if (enemy?.elite) return ENEMY_POISON_ELITE_MAX_HP_DPS;
  return ENEMY_POISON_MAX_HP_DPS;
}

function getEnemyPoisonDpsForStacks(enemy, stacks) {
  const maxStacks = Math.max(ENEMY_POISON_MAX_STACKS, Math.floor(enemy?.poisonMaxStacks || ENEMY_POISON_MAX_STACKS));
  const clampedStacks = Math.min(maxStacks, Math.max(0, Math.floor(stacks || 0)));
  return Math.max(0, (enemy.maxHp || enemy.hp || 1) * getEnemyPoisonDpsRatio(enemy) * clampedStacks);
}

function refreshEnemyPoisonDps(enemy) {
  const maxStacks = Math.max(ENEMY_POISON_MAX_STACKS, Math.floor(enemy.poisonMaxStacks || ENEMY_POISON_MAX_STACKS));
  const stacks = Math.min(maxStacks, Math.max(0, Math.floor(enemy.poisonDotStacks || 0)));
  enemy.poisonDotStacks = stacks;
  enemy.poisonDps = getEnemyPoisonDpsForStacks(enemy, stacks);
}

function applyPoisonToEnemy(enemy, ownerId, options = {}) {
  if (!enemy || enemy.hp <= 0) return null;
  const duration = Number.isFinite(options.duration) ? options.duration : ENEMY_POISON_DURATION;
  const stacks = Number.isFinite(options.stacks) ? options.stacks : 1;
  const maxStacks = Math.max(ENEMY_POISON_MAX_STACKS, Math.floor(options.maxStacks || enemy.poisonMaxStacks || ENEMY_POISON_MAX_STACKS));
  enemy.poisonMaxStacks = maxStacks;
  const previousStacks = Math.min(maxStacks, Math.max(0, Math.floor(enemy.poisonDotStacks || 0)));
  enemy.poisonDotStacks = Math.min(
    maxStacks,
    previousStacks + Math.max(1, Math.floor(stacks))
  );
  enemy.poisonTimer = Math.max(enemy.poisonTimer || 0, Math.max(0.1, duration));
  enemy.poisonOwnerId = ownerId;
  refreshEnemyPoisonDps(enemy);
  return {
    before: previousStacks,
    after: enemy.poisonDotStacks
  };
}

function showPoisonStackEffect(room, enemy, stackChange) {
  if (!room || !enemy || !stackChange || stackChange.after <= stackChange.before) return;
  addEffect(room, "poison", enemy.x, enemy.y - enemy.radius - 12, {
    value: `P${stackChange.after}`,
    color: "#bef264",
    radius: enemy.radius + 14,
    style: "poison_stack",
    targetId: enemy.id
  });
}

function stackPoisonOnEnemy(room, enemy, ownerId, options = {}) {
  const owner = room?.players?.get(ownerId);
  const maxStacks = ENEMY_POISON_MAX_STACKS + Math.max(0, Math.floor(owner?.poisonStackCapBonus || 0));
  const stackChange = applyPoisonToEnemy(enemy, ownerId, { ...options, maxStacks });
  showPoisonStackEffect(room, enemy, stackChange);
  return stackChange;
}

function clearEnemyPoison(enemy) {
  enemy.poisonTimer = 0;
  enemy.poisonDps = 0;
  enemy.poisonTickTimer = 0;
  enemy.poisonDisplayDamage = 0;
  enemy.poisonDotStacks = 0;
  enemy.poisonMaxStacks = ENEMY_POISON_MAX_STACKS;
  enemy.poisonOwnerId = null;
}

function applyVenomToEnemy(room, enemy, ownerId, options = {}) {
  if (!enemy || enemy.hp <= 0) return;
  const duration = Number.isFinite(options.duration) ? options.duration : ENEMY_VENOM_DURATION;
  const venomDps = enemy.type === "boss"
    ? Math.max(0, enemy.poisonDps || getEnemyPoisonDpsForStacks(enemy, 1)) * BOSS_VENOM_POISON_RATIO
    : getEnemyPoisonDpsForStacks(enemy, ENEMY_POISON_MAX_STACKS);
  enemy.venomTimer = Math.max(enemy.venomTimer || 0, Math.max(0.1, duration));
  enemy.venomDps = Math.max(enemy.venomDps || 0, venomDps);
  enemy.venomOwnerId = ownerId;
  enemy.venomTickTimer = Math.min(
    enemy.venomTickTimer || ENEMY_POISON_TICK_DISPLAY_INTERVAL,
    ENEMY_POISON_TICK_DISPLAY_INTERVAL
  );
  addEffect(room, "poison", enemy.x, enemy.y - enemy.radius - 10, {
    value: "맹",
    color: "#c084fc",
    radius: enemy.radius + 16,
    style: "venom_apply",
    targetId: enemy.id
  });
}

function clearEnemyVenom(enemy) {
  enemy.venomTimer = 0;
  enemy.venomDps = 0;
  enemy.venomTickTimer = 0;
  enemy.venomDisplayDamage = 0;
  enemy.venomOwnerId = null;
}

function createRangerPoisonPool(room, ownerId, x, y, options = {}) {
  if (!room) return;
  const owner = room.players.get(ownerId);
  const areaMul = Math.max(0.2, Number(owner?.areaMul || 1));
  const radius = (Number.isFinite(options.radius) ? options.radius : 112) * areaMul;
  const tickInterval = Number.isFinite(options.tickInterval) ? options.tickInterval : 0.42;
  room.hazards.push({
    id: nextHazardId++,
    type: "poison_pool",
    ownerId,
    style: "poison_pool",
    x,
    y,
    radius,
    timer: Number.isFinite(options.duration) ? options.duration : 4.2,
    tick: Number.isFinite(options.initialTickDelay) ? options.initialTickDelay : tickInterval,
    tickInterval,
    poisonDuration: Number.isFinite(options.poisonDuration) ? options.poisonDuration : ENEMY_POISON_DURATION * 0.82,
    poisonStacks: Number.isFinite(options.poisonStacks) ? options.poisonStacks : 1,
    skipFirstPoisonEnemyId: options.skipFirstPoisonEnemyId ?? null,
    color: "#9aa15f",
    dead: false
  });
  addEffect(room, "poison", x, y, {
    color: "#9aa15f",
    radius,
    style: "poison_cloud",
    duration: 0.56
  });
}

function applyBurnToEnemy(room, enemy, ownerId, sourceDamage, options = {}) {
  if (!enemy || enemy.hp <= 0) return;
  const duration = Math.max(0.1, Number.isFinite(options.duration) ? options.duration : ENEMY_BURN_DURATION);
  const totalDamageRatio = Number.isFinite(options.totalDamageRatio) ? options.totalDamageRatio : ENEMY_BURN_TOTAL_DAMAGE_RATIO;
  const baseDamage = Number.isFinite(sourceDamage) ? sourceDamage : 0;
  const owner = room.players.get(ownerId);
  const attackDamageRatio = Math.max(0, Number(options.attackDamageRatio) || 0);
  const sourceBasedTotal = Math.max(0, baseDamage) * Math.max(0, totalDamageRatio);
  const attackBasedTotal = owner ? getPlayerAttackDamage(owner, owner.classId) * attackDamageRatio : 0;
  const nextDps = Math.max(sourceBasedTotal, attackBasedTotal) / duration;
  if (nextDps <= 0) return;
  const wasInactive = (enemy.burnTimer || 0) <= 0;
  const stronger = nextDps >= (enemy.burnDps || 0);
  if (wasInactive || stronger) {
    enemy.burnTimer = Math.max(enemy.burnTimer || 0, duration);
    enemy.burnDps = nextDps;
    enemy.burnOwnerId = ownerId;
    enemy.burnTickTimer = Math.min(
      enemy.burnTickTimer || ENEMY_BURN_TICK_DISPLAY_INTERVAL,
      ENEMY_BURN_TICK_DISPLAY_INTERVAL
    );
  }
}

function clearEnemyBurn(enemy) {
  enemy.burnTimer = 0;
  enemy.burnDps = 0;
  enemy.burnTickTimer = 0;
  enemy.burnDisplayDamage = 0;
  enemy.burnOwnerId = null;
}

function damageEnemiesInRadius(room, owner, x, y, radius, damage, options = {}) {
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance({ x, y }, enemy) > radius + enemy.radius) continue;
    if (options.slow) enemy.slowTimer = Math.max(enemy.slowTimer, options.slow);
    if (options.threadMark) applyThreadMark(room, owner, enemy, options.threadMark, options.threadDuration || 6.2);
    if (options.pullTo && enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, options.pullTo.x - enemy.x, options.pullTo.y - enemy.y, 72, {
        duration: 0.2,
        maxDistance: 96,
        style: "hit_knockback"
      });
    }
    const hitDamage = damage * (options.damageMul ? options.damageMul(enemy) : 1);
    const dealt = dealDamage(room, enemy, hitDamage, owner.id, { noVulnerable: true });
    if (options.poison && (dealt > 0 || enemy.hp > 0)) stackPoisonOnEnemy(room, enemy, owner.id, options.poison);
    if (dealt > 0 && options.burn) applyBurnToEnemy(room, enemy, owner.id, dealt, options.burn);
    if (dealt > 0 && options.knockback) {
      startEnemyKnockback(room, enemy, enemy.x - x, enemy.y - y, options.knockback, {
        duration: 0.18,
        maxDistance: 130,
        style: "hit_knockback"
      });
    }
  }
}

function damageEnemiesOnSegment(room, owner, ax, ay, bx, by, width, damage) {
  addEffect(room, "chain", (ax + bx) / 2, (ay + by) / 2, {
    color: classes.puppeteer.color,
    radius: Math.hypot(bx - ax, by - ay),
    fromX: round2(ax),
    fromY: round2(ay),
    toX: round2(bx),
    toY: round2(by),
    style: "thread_bind"
  });
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distanceToSegment(enemy, ax, ay, bx, by) > width + enemy.radius) continue;
    enemy.slowTimer = Math.max(enemy.slowTimer, 1.25);
    dealDamage(room, enemy, damage, owner.id, { noVulnerable: true });
  }
}

function getActivePuppet(room, ownerId) {
  return room.hazards.find((hazard) => hazard.ownerId === ownerId && hazard.type === "puppet" && !hazard.dead) || null;
}

function trimOwnedHazards(room, ownerId, type, maxCount) {
  const owned = hazardSystem.getOwnedHazards(room.hazards, ownerId, type);
  while (owned.length > maxCount) {
    const oldest = owned.shift();
    if (oldest) oldest.dead = true;
  }
}

function removeOwnedHazards(room, ownerId, type) {
  for (const hazard of room.hazards) {
    if (hazard.ownerId === ownerId && hazard.type === type) hazard.dead = true;
  }
}

function getProjectileAegisVisualHash(value) {
  const text = String(value || "0");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  return hash / 9973;
}

function tryBlockHostileProjectileWithAegis(room, projectile, fromX, fromY, now) {
  let closestBlock = null;
  const travelX = projectile.x - fromX;
  const travelY = projectile.y - fromY;
  const travelLengthSq = travelX * travelX + travelY * travelY || 1;

  for (const player of getActiveLivingPlayers(room)) {
    const charges = Math.max(0, Math.min(3, Math.floor(Number(player.projectileShieldCharges || 0))));
    if (charges <= 0) continue;
    const sizeScale = Math.max(0.75, Number(player.sizeScale || 1));
    const orbit = PROJECTILE_AEGIS_ORBIT_RADIUS * sizeScale;
    const plateRadius = PROJECTILE_AEGIS_PLATE_RADIUS * sizeScale;
    const spin = now / PROJECTILE_AEGIS_ROTATION_MS + getProjectileAegisVisualHash(player.id) * 0.05;

    for (let i = 0; i < charges; i += 1) {
      const angle = spin + (Math.PI * 2 * i) / 3;
      const plate = {
        x: player.x + Math.cos(angle) * orbit,
        y: player.y + Math.sin(angle) * orbit * PROJECTILE_AEGIS_ORBIT_Y_SCALE
      };
      if (!collisionSystem.segmentIntersectsCircle(plate, plateRadius, fromX, fromY, projectile.x, projectile.y, projectile.radius || 0)) continue;
      const t = clamp(((plate.x - fromX) * travelX + (plate.y - fromY) * travelY) / travelLengthSq, 0, 1);
      if (!closestBlock || t < closestBlock.t) closestBlock = { player, plate, t };
    }
  }

  if (!closestBlock) return false;
  const { player, plate } = closestBlock;
  player.projectileShieldCharges = Math.max(0, (player.projectileShieldCharges || 0) - 1);
  if (player.projectileShieldCharges <= 0) {
    player.projectileShieldRespawnTimer = Math.max(1, player.projectileShieldCooldown || 12);
  }
  projectile.x = plate.x;
  projectile.y = plate.y;
  projectile.dead = true;
  addEffect(room, "shield", plate.x, plate.y, {
    color: "#67e8f9",
    radius: 46,
    style: "equipment_projectile_aegis_block"
  });
  return true;
}

function updateProjectiles(room, dt) {
  const now = Date.now();
  for (const projectile of room.projectiles) {
    if (projectile.dead) continue;
    const prevX = projectile.x;
    const prevY = projectile.y;
    steerHomingProjectile(room, projectile, dt);
    projectileSystem.advanceProjectile(projectile, dt);

    if (stopProjectileOnMapWall(room, projectile, prevX, prevY)) {
      continue;
    }

    if (projectileSystem.expireProjectileIfNeeded(projectile, room.world)) {
      continue;
    }

    if (projectile.hostile) {
      if (tryBlockHostileProjectileWithAegis(room, projectile, prevX, prevY, now)) continue;
      for (const player of getActiveLivingPlayers(room)) {
        if (!collisionSystem.circlesOverlap(projectile, projectile.radius, player, getPlayerCollisionRadius(player))) continue;
        const dealt = damagePlayer(room, player, projectile.damage, projectile.ownerId, projectile.x, projectile.y, {
          projectile: true,
          damageType: projectile.damageType || projectile.style || "projectile",
          knockbackDirX: projectile.vx,
          knockbackDirY: projectile.vy
        });
        addEffect(room, "impact", projectile.x, projectile.y, {
          color: projectile.style === "stalker_shuriken" ? enemyDefs.stalker.color : projectile.poison ? "#9aa15f" : "#c85d56",
          radius: projectile.radius + 18,
          style: projectile.style || "spit"
        });
        if (dealt > 0 && projectile.poison && player.immunityTimer <= 0) {
          applyPoisonToPlayer(player, projectile.poison, projectile.poisonDuration || 3, projectile.ownerId, {
            stack: true,
            maxStacks: 3
          });
        }
        projectile.dead = true;
        break;
      }
      continue;
    }

    for (const enemy of room.enemies) {
      if (enemy.hp <= 0) continue;
      if (projectile.hitEnemyIds?.includes(enemy.id)) continue;
      if (!collisionSystem.circlesOverlap(projectile, projectile.radius, enemy, enemy.radius)) continue;

      if (!projectile.hitEnemyIds) projectile.hitEnemyIds = [];
      projectile.hitEnemyIds.push(enemy.id);
      if (projectile.homingTargetId === enemy.id) projectile.homingTargetId = undefined;
      const dealt = dealDamage(room, enemy, projectile.damage, projectile.ownerId, {
        skillTag: projectile.skillTag,
        basicAttack: projectile.basicAttack,
        forceCrit: Boolean(projectile.forceCrit)
      });
      applyProjectileStatus(room, projectile, enemy, dealt);
      const giantStarOrb = String(projectile.style || "").includes("giant_star_orb");
      const projectileAngle = Math.atan2(projectile.vy || 0, projectile.vx || 1);
      addEffect(room, "impact", projectile.x, projectile.y, {
        color:
          projectile.burn
            ? "#f97316"
            : String(projectile.style || "").includes("mecha_laser_shot")
            ? "#67e8f9"
            : projectile.poison
            ? "#9aa15f"
            : classes[projectile.classId]
              ? classes[projectile.classId].color
              : "#f8f3e9",
        radius: projectile.radius + 18,
        style: giantStarOrb ? "star_orb_pierce_impact" : projectile.style || "",
        angle: projectileAngle,
        duration: projectile.classId === "mage" ? 0.24 : undefined
      });
      if (giantStarOrb && dealt > 0 && enemy.type !== "boss") {
        startEnemyKnockback(room, enemy, projectile.vx || 1, projectile.vy || 0, 34, {
          duration: 0.12,
          maxDistance: 42,
          style: "giant_star_orb_push",
          interruptCharge: true
        });
      }

      if (projectile.splash > 0 && !giantStarOrb) {
        const splashColor = classes[projectile.classId]?.color || classes.mage.color;
        const missileSplash = String(projectile.style || "").includes("missile");
        const explosiveArrow = Boolean(projectile.explosiveArrow);
        addEffect(room, missileSplash || explosiveArrow ? "explosion" : "arcane", enemy.x, enemy.y, {
          color: missileSplash || explosiveArrow ? "#f97316" : splashColor,
          radius: projectile.splash,
          rangeRadius: projectile.splash,
          style: missileSplash
            ? "engineer_missile_explosion"
            : explosiveArrow
              ? "ranger_explosive_arrow"
              : projectile.classId === "alchemist"
                  ? "alchemy_splash"
                  : "arcane_splash",
          duration: projectile.classId === "mage" ? 0.3 : undefined
        });
        for (const nearby of room.enemies) {
          if (nearby.id === enemy.id || nearby.hp <= 0) continue;
          if (distance(enemy, nearby) <= projectile.splash + nearby.radius) {
            const splashDealt = dealDamage(room, nearby, projectile.damage * 0.52, projectile.ownerId, {
              skillTag: projectile.skillTag,
              forceCrit: Boolean(projectile.forceCrit)
            });
            applyProjectileStatus(room, projectile, nearby, splashDealt);
          }
        }
      }

      const projectileOwner = room.players.get(projectile.ownerId);
      if (projectile.classId === "alchemist" && projectileOwner && projectile.splash > 0) {
        triggerAlchemyReactionsNear(room, projectileOwner, enemy.x, enemy.y, projectile.splash + 38, classes.alchemist);
      }
      spawnMageStarSplitFragments(room, projectile, enemy);
      const chainCount = Math.max(0, Math.floor(projectile.chain || 0));
      if (chainCount > 0) {
        chainLightning(room, projectile.ownerId, enemy, projectile.damage * 0.55, chainCount);
      }

      projectile.pierce -= 1;
      if (projectile.pierce < 0) {
        if (projectile.finalBlast) {
          const blastRadius = projectile.finalBlastRadius || 96;
          addEffect(room, "explosion", enemy.x, enemy.y, {
            color: classes.ranger.color,
            radius: blastRadius,
            style: "ranger_pierce_blast"
          });
          damageEnemiesInRadius(room, room.players.get(projectile.ownerId) || { id: projectile.ownerId }, enemy.x, enemy.y, blastRadius, projectile.damage * 0.58, {
            noVulnerable: true,
            knockback: 48
          });
        }
        projectile.dead = true;
      }
      break;
    }
  }
}

function updateHazards(room, dt) {
  for (const hazard of room.hazards) {
    if (hazard.dead) continue;
    hazard.timer -= dt;

    if (hazard.type === "engineer_turret") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.timer <= 0) hazard.dead = true;
      if (!hazard.dead && hazard.armTime <= 0) updateEngineerTurret(room, hazard, dt);
      continue;
    }

    if (hazard.type === "engineer_mine") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.timer <= 0) hazard.dead = true;
      if (!hazard.dead) updateEngineerMine(room, hazard, dt);
      continue;
    }

    if (hazard.type === "engineer_drone") {
      if (hazard.timer <= 0) {
        if (hazard.kamikaze && !hazard.kamikazeActive) {
          beginEngineerDroneKamikaze(room, hazard);
        } else if (!hazard.kamikazeActive) {
          hazard.dead = true;
        }
      }
      if (!hazard.dead) updateEngineerDrone(room, hazard, dt);
      continue;
    }

    if (hazard.type === "warrior_whirlwind_projectile") {
      updateWarriorForwardWhirlwind(room, hazard, dt);
      continue;
    }

    if (hazard.type === "warrior_followup_cleave") {
      updateWarriorFollowupCleaveHazard(room, hazard, dt);
      continue;
    }

    if (hazard.type === "puppet") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      hazard.moveTime = Math.max(0, (hazard.moveTime || 0) - dt);
      if (hazard.timer <= 0) hazard.dead = true;
      if (!hazard.dead && hazard.armTime <= 0) updatePuppetHazard(room, hazard, dt);
      continue;
    }

    if (hazard.type === "alchemy_bomb") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        detonateAlchemyBomb(room, hazard);
        continue;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "alchemy_elixir_mist") {
      if (hazard.timer <= 0) {
        hazard.dead = true;
        continue;
      }
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const ally of getActiveLivingPlayers(room)) {
          if (distance(hazard, ally) > hazard.radius + getPlayerCollisionRadius(ally)) continue;
          ally.hp = Math.min(ally.maxHp, ally.hp + (hazard.heal || 4));
          addEffect(room, "heal", ally.x, ally.y, {
            value: Math.round(hazard.heal || 4),
            color: hazard.color || classes.alchemist.color,
            style: "alchemist_elixir"
          });
        }
        hazard.tick = hazard.tickInterval || 0.7;
      }
      continue;
    }

    if (hazard.type === "alchemy_pool") {
      const previousArmTime = hazard.armTime || 0;
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.timer <= 0) {
        hazard.dead = true;
        continue;
      }
      if (hazard.armTime > 0) {
        continue;
      }
      if (previousArmTime > 0 && !hazard.reactedOnArm) {
        const owner = room.players.get(hazard.ownerId);
        if (owner) reactOverlappingAlchemyPools(room, owner, hazard, classes.alchemist, true);
        hazard.reactedOnArm = true;
      }
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        const owner = room.players.get(hazard.ownerId);
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { noVulnerable: true, silent: false });
          if (hazard.mode === "reaction") {
            if (dealt > 0) applyBurnToEnemy(room, enemy, hazard.ownerId, dealt);
            stackPoisonOnEnemy(room, enemy, hazard.ownerId, {
              duration: ENEMY_POISON_DURATION,
              stacks: owner && hasUpgrade(owner, "alchemist_corrosive") ? 2 : 1
            });
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.35);
          } else if (hazard.mode === "fire" && dealt > 0) {
            applyBurnToEnemy(room, enemy, hazard.ownerId, dealt);
          } else if (hazard.mode !== "fire") {
            stackPoisonOnEnemy(room, enemy, hazard.ownerId, {
              duration: ENEMY_POISON_DURATION,
              stacks: owner && hasUpgrade(owner, "alchemist_corrosive") ? 2 : 1
            });
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.42);
          }
          if (
            owner &&
            hasUpgrade(owner, "alchemist_philosopher") &&
            enemy.burnTimer > 0 &&
            enemy.poisonTimer > 0 &&
            Math.random() < 0.24
          ) {
            addEffect(room, "explosion", enemy.x, enemy.y, {
              color: classes.alchemist.color,
              radius: enemy.radius + 44,
              style: "alchemy_reaction"
            });
            dealDamage(room, enemy, classes.alchemist.damage * 0.72, hazard.ownerId, { noVulnerable: true });
          }
          if (dealt > 0 && Math.random() < 0.22) {
            addEffect(room, hazard.mode === "fire" ? "explosion" : "poison", enemy.x, enemy.y, {
              color: hazard.color || classes.alchemist.color,
              radius: enemy.radius + 18,
              style: hazard.mode === "fire" ? "fire_tick" : "acid_tick"
            });
          }
        }
        hazard.tick = hazard.tickInterval || 0.55;
      }
      continue;
    }

    if (hazard.type === "arrow_rain") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      hazard.tick -= dt;
      if (hazard.armTime > 0) {
        if (hazard.timer <= 0) hazard.dead = true;
        continue;
      }

      if (hazard.tick <= 0) {
        let chainSource = null;
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          const centerDistance = Math.hypot(enemy.x - hazard.x, enemy.y - hazard.y);
          const falloff = clamp(1 - centerDistance / Math.max(1, hazard.radius + enemy.radius), 0.42, 1);
          const dealt = dealDamage(room, enemy, hazard.damage * falloff, hazard.ownerId, { noVulnerable: true });
          if ((hazard.slowDuration || 0) > 0) enemy.slowTimer = Math.max(enemy.slowTimer, hazard.slowDuration);
          if (hazard.pullEnemies && enemy.type !== "boss") {
            startEnemyKnockback(room, enemy, hazard.x - enemy.x, hazard.y - enemy.y, enemy.elite ? 18 : 30, {
              duration: 0.16,
              maxDistance: 34,
              style: "shield_charge_gather",
              interruptCharge: true
            });
          }
          if (hazard.poisonGarden) {
            stackPoisonOnEnemy(room, enemy, hazard.ownerId, { duration: ENEMY_POISON_DURATION, stacks: 1 });
          }
          if (dealt > 0 && Math.random() < 0.32) {
            addEffect(room, "impact", enemy.x, enemy.y, {
              color: hazard.poisonGarden ? "#9aa15f" : hazard.color || classes.ranger.color,
              radius: enemy.radius + 20,
              style: "arrow_rain_hit"
            });
          }
          if (hazard.chain && dealt > 0 && !chainSource && Math.random() < 0.42) {
            chainSource = enemy;
          }
        }
        addEffect(room, "shot", hazard.x + (Math.random() - 0.5) * hazard.radius * 1.1, hazard.y + (Math.random() - 0.5) * hazard.radius * 1.1, {
          angle: Math.PI / 2,
          color: hazard.color || classes.ranger.color,
          radius: Math.min(78, hazard.radius * 0.46),
          style: "arrow_rain_tick",
          duration: 0.22
        });
        if (chainSource) {
          chainLightning(room, hazard.ownerId, chainSource, hazard.damage * 0.46, 2, {
            range: 310,
            falloff: 0.16,
            minDamageMul: 0.42
          });
        }
        hazard.tick = hazard.tickRate || 0.3;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "poison_pool") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          if (hazard.skipFirstPoisonEnemyId != null && enemy.id === hazard.skipFirstPoisonEnemyId) continue;
          stackPoisonOnEnemy(room, enemy, hazard.ownerId, {
            duration: hazard.poisonDuration || ENEMY_POISON_DURATION * 0.82,
            stacks: hazard.poisonStacks || 1
          });
          if (Math.random() < 0.24) {
            addEffect(room, "poison", enemy.x, enemy.y, {
              color: "#9aa15f",
              radius: enemy.radius + 18,
              style: "poison_pool_tick"
            });
          }
        }
        hazard.skipFirstPoisonEnemyId = null;
        hazard.tick = hazard.tickInterval || 0.48;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "acid_pool") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      hazard.tick -= dt;
      if (hazard.armTime <= 0 && hazard.tick <= 0) {
        for (const player of getActiveLivingPlayers(room)) {
          if (distance(hazard, player) > hazard.radius + getPlayerCollisionRadius(player)) continue;
          const dealt = damagePlayer(room, player, hazard.damage, hazard.ownerId, player.x, player.y, {
            poison: true,
            hazard: true,
            damageType: hazard.damageType || hazard.type
          });
          if (dealt > 0 && player.immunityTimer <= 0) {
            applyPoisonToPlayer(player, hazard.poison || 2, 2.2, hazard.ownerId);
          }
        }
        hazard.tick = 0.75;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_spiral_emitter") {
      const sourceEnemy = room.enemies.find((enemy) => enemy.id === hazard.ownerId && enemy.hp > 0);
      if (!sourceEnemy) {
        hazard.dead = true;
        continue;
      }
      hazard.x = sourceEnemy.x;
      hazard.y = sourceEnemy.y;
      hazard.fireTimer = (hazard.fireTimer || 0) - dt;
      if (hazard.fireTimer <= 0 && (hazard.wavesRemaining || 0) > 0) {
        const shots = Math.max(8, Math.floor(hazard.projectileCount || 14));
        const gapSize = Math.max(1, Math.floor(hazard.gapSize || 2));
        const gapIndex = Math.floor(hazard.gapIndex || 0) % shots;
        for (let i = 0; i < shots; i += 1) {
          const gapDistance = (i - gapIndex + shots) % shots;
          if (gapDistance < gapSize) continue;
          const angle = (hazard.rotation || 0) + (Math.PI * 2 * i) / shots;
          fireEnemyProjectileAtAngle(room, sourceEnemy, angle, {
            speed: hazard.projectileSpeed || 380,
            damageMul: hazard.damageMul || 0.2,
            radius: hazard.projectileRadius || 6,
            poison: hazard.poison || 0,
            poisonDuration: hazard.poisonDuration || 0,
            style: hazard.projectileStyle || "boss_spiral_bolt",
            damageType: hazard.damageType || "boss_spiral_barrage",
            distanceLeft: hazard.distanceLeft || 980
          });
        }
        addEffect(room, "shot", sourceEnemy.x, sourceEnemy.y, {
          color: hazard.color || "#c85d56",
          radius: sourceEnemy.radius + 54,
          style: hazard.projectileStyle || "boss_spiral_bolt"
        });
        hazard.wavesRemaining -= 1;
        hazard.rotation = (hazard.rotation || 0) + (hazard.rotationStep || 0.28);
        hazard.gapIndex = gapIndex + Math.max(1, Math.floor(shots * 0.13));
        hazard.fireTimer += hazard.waveInterval || 0.42;
      }
      if (hazard.timer <= 0 || (hazard.wavesRemaining || 0) <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_safe_zone") {
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_field_judgment") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        const sourceEnemy = room.enemies.find((enemy) => enemy.id === hazard.ownerId && enemy.hp > 0);
        const safeZones = room.hazards.filter((zone) =>
          !zone.dead && zone.type === "boss_safe_zone" && zone.mechanicId === hazard.mechanicId
        );
        if (sourceEnemy) {
          for (const player of getActiveLivingPlayers(room)) {
            const safe = safeZones.some((zone) =>
              distance(zone, player) <= Math.max(12, zone.radius - getPlayerCollisionRadius(player) * 0.35)
            );
            if (safe) continue;
            player.immunityTimer = 0;
            player.hitIFrameTimer = 0;
            damagePlayer(
              room,
              player,
              player.maxHp + player.shield + (player.armor || 0) + 9999,
              sourceEnemy.id,
              player.x,
              player.y,
              { damageType: "boss_field_judgment", ignoreIFrames: true }
            );
          }
          addEffect(room, "explosion", hazard.x, hazard.y, {
            color: hazard.color || "#dc2626",
            radius: hazard.radius,
            style: "boss_field_judgment"
          });
        }
        for (const zone of safeZones) zone.dead = true;
        hazard.dead = true;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_beam") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        const angle = hazard.angle || 0;
        const endX = hazard.x + Math.cos(angle) * (hazard.length || hazard.radius || 800);
        const endY = hazard.y + Math.sin(angle) * (hazard.length || hazard.radius || 800);
        for (const player of getActiveLivingPlayers(room)) {
          const hitDistance = distanceToSegment(player, hazard.x, hazard.y, endX, endY);
          if (hitDistance > (hazard.width || 34) + getPlayerCollisionRadius(player)) continue;
          damagePlayer(room, player, hazard.damage, hazard.ownerId, player.x, player.y, {
            hazard: true,
            damageType: "boss_beam",
            knockbackDirX: Math.cos(angle),
            knockbackDirY: Math.sin(angle)
          });
        }
        addEffect(room, "explosion", (hazard.x + endX) / 2, (hazard.y + endY) / 2, {
          color: hazard.color || "#c85d56",
          radius: hazard.width || 36,
          angle,
          length: hazard.length || hazard.radius || 800,
          style: "boss_beam_fire"
        });
        hazard.dead = true;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_shockwave") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        const sourceEnemy = room.enemies.find((enemy) => enemy.id === hazard.ownerId);
        if (sourceEnemy && sourceEnemy.hp > 0) {
          for (const player of getActiveLivingPlayers(room)) {
            if (distance(hazard, player) > hazard.radius + getPlayerCollisionRadius(player)) continue;
            damagePlayer(room, player, hazard.damage, hazard.ownerId, player.x, player.y, {
              hazard: true,
              damageType: "boss_shockwave",
              knockback: hazard.knockback,
              knockbackOrigin: { x: hazard.x, y: hazard.y }
            });
          }
          addEffect(room, "explosion", hazard.x, hazard.y, {
            color: hazard.color || "#c85d56",
            radius: hazard.radius,
            style: "boss_shockwave"
          });
        }
        hazard.dead = true;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "boss_blast") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        for (const player of getActiveLivingPlayers(room)) {
          if (distance(hazard, player) > hazard.radius + getPlayerCollisionRadius(player)) continue;
          damagePlayer(room, player, hazard.damage, hazard.ownerId, player.x, player.y, {
            hazard: true,
            damageType: "boss_blast",
            knockbackOrigin: { x: hazard.x, y: hazard.y }
          });
        }
        addEffect(room, "explosion", hazard.x, hazard.y, {
          color: hazard.color || "#8d7cae",
          radius: hazard.radius,
          style: "boss_blast"
        });
        hazard.dead = true;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "mortar_blast") {
      hazard.armTime = Math.max(0, (hazard.armTime || 0) - dt);
      if (hazard.armTime <= 0) {
        for (const player of getActiveLivingPlayers(room)) {
          if (distance(hazard, player) > hazard.radius + getPlayerCollisionRadius(player)) continue;
          damagePlayer(room, player, hazard.damage, hazard.ownerId, player.x, player.y, {
            hazard: true,
            ranged: true,
            damageType: "mortar_blast",
            knockback: hazard.knockback,
            knockbackOrigin: { x: hazard.x, y: hazard.y }
          });
        }
        addEffect(room, "explosion", hazard.x, hazard.y, {
          color: "#f97316",
          radius: hazard.radius,
          style: "mortar_blast"
        });
        hazard.dead = true;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "meteor") {
      if (hazard.timer <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { knockback: 210, skillTag: hazard.growth ? "mage_meteor" : undefined });
          if (hazard.iceMeteor) {
            const freezeDuration = enemy.type === "boss" ? 0.7 : enemy.elite ? 1.05 : 1.5;
            enemy.freezeTimer = Math.max(enemy.freezeTimer || 0, freezeDuration);
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 2.4);
          } else {
            applyBurnToEnemy(room, enemy, hazard.ownerId, dealt, { duration: 3, totalDamageRatio: 0.24 });
          }
        }
        addEffect(room, "explosion", hazard.x, hazard.y, {
          color: hazard.iceMeteor ? "#93c5fd" : "#f97316",
          radius: hazard.radius * 1.05,
          style: "meteor_impact",
          iceMeteor: Boolean(hazard.iceMeteor)
        });
        if (hazard.apocalypse) {
          const source = nearestEnemy(room, hazard.x, hazard.y, hazard.radius + 260);
          if (source) {
            chainLightning(room, hazard.ownerId, source, hazard.damage * 0.38, 7, {
              range: 390,
              falloff: 0.08,
              minDamageMul: 0.46
            });
          }
        }
        if (hazard.iceMeteor) {
          const icePoolOwner = room.players.get(hazard.ownerId);
          room.hazards.push({
            id: nextHazardId++,
            type: "ice_pool",
            ownerId: hazard.ownerId,
            x: hazard.x,
            y: hazard.y,
            radius: hazard.radius * (hazard.apocalypse ? 1.02 : 0.92),
            timer: hazard.apocalypse ? 6.2 : 5.2,
            tick: 0.12,
            damage: Math.max(1, getPlayerAttackDamage(icePoolOwner, "mage") * 0.09),
            color: "#93c5fd",
            style: "ice_field",
            hostile: false,
            dead: false
          });
        } else if (hazard.wildfire || hazard.apocalypse) {
          const firePoolOwner = room.players.get(hazard.ownerId);
          room.hazards.push({
            id: nextHazardId++,
            type: "fire_pool",
            ownerId: hazard.ownerId,
            x: hazard.x,
            y: hazard.y,
            radius: hazard.radius * (hazard.apocalypse ? 1.02 : 0.92),
            timer: hazard.apocalypse ? 6.2 : 5.2,
            tick: 0.12,
            damage: Math.max(1, getPlayerAttackDamage(firePoolOwner, "mage") * 0.13),
            burnTime: hazard.apocalypse ? 4.1 : 3.4,
            burnAttackRatio: hazard.apocalypse ? 0.78 : 0.65,
            hostile: false,
            dead: false
          });
        }
        hazard.dead = true;
      }
      continue;
    }

    if (hazard.type === "fire_line") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        const halfLength = Math.max(1, hazard.length || 1) * 0.5;
        const halfWidth = Math.max(8, hazard.width || 16) * 0.5;
        const ux = Math.cos(hazard.angle || 0);
        const uy = Math.sin(hazard.angle || 0);
        const fromX = hazard.x - ux * halfLength;
        const fromY = hazard.y - uy * halfLength;
        const toX = hazard.x + ux * halfLength;
        const toY = hazard.y + uy * halfLength;
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distanceToSegment(enemy, fromX, fromY, toX, toY) > halfWidth + enemy.radius) continue;
          const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { silent: true, element: "burn", skillTag: "ranger_laser_fire_line" });
          if (dealt > 0) {
            addEffect(room, "damage", enemy.x, enemy.y - enemy.radius, {
              value: Math.max(1, Math.round(dealt)),
              color: "#fb923c",
              radius: enemy.radius + 8,
              style: "fire_line_tick",
              targetId: enemy.id
            });
          }
          applyBurnToEnemy(room, enemy, hazard.ownerId, dealt, {
            duration: hazard.burnTime || ENEMY_BURN_DURATION,
            totalDamageRatio: 0.25,
            attackDamageRatio: hazard.burnAttackRatio || 0
          });
        }
        hazard.tick = 0.5;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "fire_pool") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { silent: true, element: "burn" });
          if (dealt > 0) {
            addEffect(room, "damage", enemy.x, enemy.y - enemy.radius, {
              value: Math.max(1, Math.round(dealt)),
              color: "#fb923c",
              radius: enemy.radius + 8,
              style: "fire_pool_tick",
              targetId: enemy.id
            });
          }
          applyBurnToEnemy(room, enemy, hazard.ownerId, dealt, {
            duration: hazard.burnTime || ENEMY_BURN_DURATION,
            totalDamageRatio: 0.25,
            attackDamageRatio: hazard.burnAttackRatio || 0
          });
        }
        hazard.tick = 0.5;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "ice_pool") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.9);
          const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { silent: true, element: "cold", skillTag: "mage_ice_field" });
          if (dealt > 0) {
            addEffect(room, "damage", enemy.x, enemy.y - enemy.radius, {
              value: Math.max(1, Math.round(dealt)),
              color: "#93c5fd",
              radius: enemy.radius + 8,
              style: "ice_pool_tick",
              targetId: enemy.id
            });
          }
        }
        hazard.tick = 0.5;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "electric_pool") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.85);
          dealDamage(room, enemy, hazard.damage, hazard.ownerId, { silent: true, element: "shock" });
        }
        addEffect(room, "chain", hazard.x, hazard.y, {
          color: hazard.color || classes.engineer.color,
          radius: hazard.radius * 0.72,
          style: "electric_field_tick"
        });
        hazard.tick = 0.34;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }

    if (hazard.type === "frost_echo") {
      if (hazard.timer <= 0) {
        addEffect(room, "slow", hazard.x, hazard.y, {
          color: hazard.color || "#93c5fd",
          radius: hazard.radius,
          rangeRadius: hazard.radius,
          style: "frost_breath_aura",
          duration: 1.15,
          passive: true
        });
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.72);
        }
        hazard.dead = true;
      }
      continue;
    }
  }
}

function updateWarriorForwardWhirlwind(room, hazard, dt) {
  if (hazard.timer <= 0) {
    hazard.dead = true;
    return;
  }

  const prevX = hazard.x;
  const prevY = hazard.y;
  hazard.x = clamp(hazard.x + (hazard.vx || 0) * dt, 36, room.world.w - 36);
  hazard.y = clamp(hazard.y + (hazard.vy || 0) * dt, 36, room.world.h - 36);
  hazard.tick = Math.max(0, (hazard.tick || 0) - dt);
  hazard.angle = Math.atan2(hazard.vy || 0, hazard.vx || 1);

  if (hazard.pullEnemies) {
    const pullRadius = hazard.radius * 1.55;
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || enemy.type === "boss") continue;
      const dx = hazard.x - enemy.x;
      const dy = hazard.y - enemy.y;
      const centerDistance = Math.hypot(dx, dy);
      if (centerDistance > pullRadius + enemy.radius) continue;
      const stopDistance = Math.max(22, enemy.radius * 0.38);
      const pullStep = Math.min(
        Math.max(0, centerDistance - stopDistance),
        (enemy.elite ? 820 : 1180) * dt
      );
      if (pullStep <= 0 || centerDistance <= 0.001) continue;
      enemy.windup = null;
      enemy.chargeMove = null;
      enemy.knockbackMove = null;
      moveEnemyBy(room, enemy, (dx / centerDistance) * pullStep, (dy / centerDistance) * pullStep);
    }
  }

  const hitIds = hazard.hitIds || [];
  hazard.hitIds = hitIds;
  if (hazard.tick <= 0) {
    const owner = room.players.get(hazard.ownerId);
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || hitIds.includes(enemy.id)) continue;
      if (distanceToSegment(enemy, prevX, prevY, hazard.x, hazard.y) > hazard.radius + enemy.radius) continue;
      const dealt = dealDamage(room, enemy, hazard.damage || classes.warrior.damage, hazard.ownerId, {
        noVulnerable: true,
        knockback: hazard.pullEnemies ? 0 : 120
      });
      if (dealt > 0) {
        hitIds.push(enemy.id);
        if (!hazard.pullEnemies && enemy.type !== "boss") {
          startEnemyKnockback(room, enemy, hazard.vx || 1, hazard.vy || 0, enemy.elite ? 105 : 155, {
            duration: 0.16,
            maxDistance: enemy.elite ? 120 : 175,
            style: "spin_knockback",
            interruptCharge: true
          });
        }
        addMeleeImpact(room, enemy, "spin_impact", 1.16);
      }
    }
    if (owner && hitIds.length > 0) {
      owner.shield = Math.min(owner.maxHp * 0.28, owner.shield + Math.min(10, hitIds.length * 2));
      owner.shieldTimer = Math.max(owner.shieldTimer, 2.2);
    }
    hazard.tick = hazard.tickInterval || 0.04;
  }

  if (
    hazard.x <= 37 ||
    hazard.x >= room.world.w - 37 ||
    hazard.y <= 37 ||
    hazard.y >= room.world.h - 37
  ) {
    addEffect(room, "impact", hazard.x, hazard.y, {
      color: hazard.color || classes.warrior.color,
      radius: hazard.radius * 0.7,
      style: "warrior_forward_whirlwind_end"
    });
    hazard.dead = true;
  }
}

function updateRelicChests(room) {
  if (room.status !== "combat") return;
  for (const chest of room.relicChests) {
    if (chest.dead) continue;
    for (const player of getActiveLivingPlayers(room)) {
      if (distance(player, chest) > chest.radius + 24) continue;
      enterRelicChoice(room, chest);
      return;
    }
  }
}

function updateXpOrbs(room, dt) {
  if (room.status !== "combat") return;
  for (const orb of room.xpOrbs || []) {
    if (orb.dead) continue;
    const magnetTarget = orb.magnetTargetId ? room.players.get(orb.magnetTargetId) : null;
    const equipmentMagnetTarget = getActiveLivingPlayers(room)
      .filter((player) => player.xpMagnet)
      .reduce((best, player) => !best || distance(orb, player) < distance(orb, best) ? player : best, null);
    const target = isActiveLivingPlayer(magnetTarget) ? magnetTarget : equipmentMagnetTarget || nearestLivingPlayer(room, orb);
    if (!target) continue;

    const dx = target.x - orb.x;
    const dy = target.y - orb.y;
    const dist = Math.hypot(dx, dy) || 1;
    const forcedMagnet = Boolean((orb.magnetTargetId && target.id === orb.magnetTargetId) || target.xpMagnet);
    const magnetRange = forcedMagnet ? Infinity : 185 + Math.min(95, target.level * 6);

    if (dist <= 28) {
      collectXpOrb(room, orb, target);
      continue;
    }

    if (dist <= magnetRange) {
      const speed = forcedMagnet ? 720 + Math.min(480, dist * 0.22) : 210 + (1 - dist / magnetRange) * 520;
      orb.x = clamp(orb.x + (dx / dist) * speed * dt, 20, room.world.w - 20);
      orb.y = clamp(orb.y + (dy / dist) * speed * dt, 20, room.world.h - 20);
    } else {
      orb.x = clamp(orb.x + (orb.vx || 0) * dt, 20, room.world.w - 20);
      orb.y = clamp(orb.y + (orb.vy || 0) * dt, 20, room.world.h - 20);
      orb.vx *= 0.9;
      orb.vy *= 0.9;
    }
  }
}

function collectXpOrb(room, orb, player) {
  if (!orb || orb.dead || !isActiveLivingPlayer(player)) return;
  orb.dead = true;
  addEffect(room, "xp", orb.x, orb.y, { value: orb.value, color: "#7e9fb2", radius: 26 });
  grantXp(room, player.id, orb.value);
}

function updateEnemies(room, dt, now) {
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    tickEnemyTimers(enemy, dt);
    if (enemy.executionBoss) {
      enemy.freezeTimer = Math.min(enemy.freezeTimer || 0, 0.12);
      enemy.slowTimer = Math.min(enemy.slowTimer || 0, 0.2);
      enemy.knockbackMove = null;
    }
    if (enemy.poisonTimer > 0) {
      const tickWindow = Math.min(dt, enemy.poisonTimer);
      if ((enemy.poisonDps || 0) <= 0 && (enemy.poisonDotStacks || 0) > 0) refreshEnemyPoisonDps(enemy);
      enemy.poisonTimer = Math.max(0, enemy.poisonTimer - dt);
      const dealtPoison = dealDamage(room, enemy, (enemy.poisonDps || 0) * tickWindow, enemy.poisonOwnerId, {
        silent: true,
        fixedDamage: true,
        noLifeSteal: true,
        noOnHit: true,
        element: "poison"
      });
      if (dealtPoison > 0) {
        enemy.poisonDisplayDamage = (enemy.poisonDisplayDamage || 0) + dealtPoison;
        enemy.poisonTickTimer = Math.max(0, (enemy.poisonTickTimer || ENEMY_POISON_TICK_DISPLAY_INTERVAL) - dt);
        if (enemy.poisonTickTimer <= 0 || enemy.hp <= 0 || enemy.poisonTimer <= 0) {
          addEffect(room, "poison", enemy.x, enemy.y - enemy.radius, {
            value: Math.max(1, Math.round(enemy.poisonDisplayDamage || 0)),
            color: "#bef264",
            radius: enemy.radius + 8,
            style: "poison_tick",
            targetId: enemy.id
          });
          enemy.poisonDisplayDamage = 0;
          enemy.poisonTickTimer = ENEMY_POISON_TICK_DISPLAY_INTERVAL;
        }
      }
      if (enemy.poisonTimer <= 0) clearEnemyPoison(enemy);
      if (enemy.hp <= 0) continue;
    }
    if (enemy.venomTimer > 0) {
      const tickWindow = Math.min(dt, enemy.venomTimer);
      if ((enemy.venomDps || 0) <= 0) enemy.venomDps = getEnemyPoisonDpsForStacks(enemy, ENEMY_POISON_MAX_STACKS);
      enemy.venomTimer = Math.max(0, enemy.venomTimer - dt);
      const dealtVenom = dealDamage(room, enemy, (enemy.venomDps || 0) * tickWindow, enemy.venomOwnerId, {
        silent: true,
        fixedDamage: true,
        noLifeSteal: true,
        noOnHit: true,
        element: "venom"
      });
      if (dealtVenom > 0) {
        enemy.venomDisplayDamage = (enemy.venomDisplayDamage || 0) + dealtVenom;
        enemy.venomTickTimer = Math.max(0, (enemy.venomTickTimer || ENEMY_POISON_TICK_DISPLAY_INTERVAL) - dt);
        if (enemy.venomTickTimer <= 0 || enemy.hp <= 0 || enemy.venomTimer <= 0) {
          addEffect(room, "poison", enemy.x, enemy.y - enemy.radius - 8, {
            value: Math.max(1, Math.round(enemy.venomDisplayDamage || 0)),
            color: "#c084fc",
            radius: enemy.radius + 12,
            style: "venom_tick",
            targetId: enemy.id
          });
          enemy.venomDisplayDamage = 0;
          enemy.venomTickTimer = ENEMY_POISON_TICK_DISPLAY_INTERVAL;
        }
      }
      if (enemy.venomTimer <= 0) clearEnemyVenom(enemy);
      if (enemy.hp <= 0) continue;
    }
    if (enemy.burnTimer > 0) {
      const tickWindow = Math.min(dt, enemy.burnTimer);
      enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
      const dealtBurn = dealDamage(room, enemy, (enemy.burnDps || 0) * tickWindow, enemy.burnOwnerId, {
        silent: true,
        fixedDamage: true,
        noLifeSteal: true,
        noOnHit: true,
        element: "burn"
      });
      if (dealtBurn > 0) {
        enemy.burnDisplayDamage = (enemy.burnDisplayDamage || 0) + dealtBurn;
        enemy.burnTickTimer = Math.max(0, (enemy.burnTickTimer || ENEMY_BURN_TICK_DISPLAY_INTERVAL) - dt);
        if (enemy.burnTickTimer <= 0 || enemy.hp <= 0 || enemy.burnTimer <= 0) {
          addEffect(room, "damage", enemy.x, enemy.y - enemy.radius - 6, {
            value: Math.max(1, Math.round(enemy.burnDisplayDamage || 0)),
            color: "#fb923c",
            radius: enemy.radius + 8,
            style: "burn_tick",
            targetId: enemy.id
          });
          enemy.burnDisplayDamage = 0;
          enemy.burnTickTimer = ENEMY_BURN_TICK_DISPLAY_INTERVAL;
        }
      }
      if (enemy.burnTimer <= 0) clearEnemyBurn(enemy);
      if (enemy.hp <= 0) continue;
    }

    if ((enemy.bossArrivalStasisUntil || 0) > now) {
      enemy.windup = null;
      enemy.chargeMove = null;
      enemy.knockbackMove = null;
      continue;
    }

    enemy.bossArrivalStasisUntil = 0;

    // Phase gates must advance before crowd control can short-circuit boss AI.
    // Otherwise repeated knockback or freeze can leave the boss locked at a gate forever.
    if (startPendingBossPhaseTransition(room, enemy)) continue;

    if (updateEnemyKnockback(room, enemy, dt)) {
      continue;
    }

    if (enemy.trainingDummy) {
      enemy.windup = null;
      enemy.chargeMove = null;
      enemy.tauntTargetId = null;
      enemy.tauntTimer = 0;
      updateTrainingDummyReturn(room, enemy, dt);
      continue;
    }

    if (enemy.chargeMove && updateChargerDash(room, enemy, dt)) {
      continue;
    }

    if (enemy.blockadeRunner || BLOCKADE_RUNNER_TYPES.includes(enemy.type)) {
      updateBlockadeRunner(room, enemy, dt);
      continue;
    }

    if (enemy.freezeTimer > 0) continue;

    if (enemy.type === "shaman" && enemy.tauntTimer <= 0 && updateShaman(room, enemy, dt, now)) {
      continue;
    }

    const target = getEnemyTarget(room, enemy);
    if (!target) continue;

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const targetIsDefenseObjective = isDefenseObjectiveTarget(target);
    enemy.focusingDefenseObjective = targetIsDefenseObjective;

    if (targetIsDefenseObjective && updateObjectiveFocusedEnemy(room, enemy, target, dist, dt)) {
      continue;
    }

    if (enemy.type === "boss" && updateBossEnemy(room, enemy, target, dist, dt)) {
      continue;
    }

    const tauntedToTarget = enemy.tauntTimer > 0 && enemy.tauntTargetId === target.id;

    if (updateEliteSpecial(room, enemy, target, dist, dt, now)) {
      continue;
    }

    if (enemy.type === "stalker" && updateStalker(room, enemy, target, dist, dt)) {
      continue;
    }

    if (enemy.type === "guardian" && updateGuardian(room, enemy, target, dist, dt)) {
      continue;
    }

    if (enemy.type === "brute" && updateBrute(room, enemy, target, dist, dt)) {
      continue;
    }

    if (!tauntedToTarget && enemy.type === "mortar") {
      if (updateMortar(room, enemy, target, dist, dt)) continue;
      if (dist > 260 && dist < 720) continue;
    }

    if (!tauntedToTarget && enemy.type === "sniper" && updateSniper(room, enemy, target, dist, dt)) {
      continue;
    }

    if (!tauntedToTarget && enemy.type === "spitter" && updateSpitter(room, enemy, target, dist, dt)) {
      continue;
    }

    if (enemy.type === "bomber" && updateBomber(room, enemy, target, dist, dt)) {
      continue;
    }

    if (enemy.type === "charger") {
      if (advanceChargeWindup(room, enemy, dt)) continue;

      if (dist < 560 && !enemy.windup && enemy.chargeTimer <= 0) {
        startChargeWindup(room, enemy, target, {
          windupTime: enemy.elite ? 0.74 : 0.9,
          radius: enemy.elite ? 98 : 86,
          style: "charge_predict"
        });

        if (advanceChargeWindup(room, enemy, dt)) continue;
      }
    }

    const crowdPush = getEnemyCrowdPush(room, enemy);
    const speedMul = enemy.slowTimer > 0 ? 0.45 : 1;
    const move = getEnemyMovementVector(room, enemy, target, dx, dy, dist);

    moveEnemyBy(room, enemy, (move.x * enemy.speed * speedMul + crowdPush.x) * dt, (move.y * enemy.speed * speedMul + crowdPush.y) * dt);

    const currentDist = distance(enemy, target);

    if (currentDist <= enemy.radius + getPlayerCollisionRadius(target) && enemy.attackTimer <= 0 && enemy.type !== "bomber" && enemy.type !== "brute" && enemy.type !== "stalker") {
      damagePlayer(room, target, enemy.damage, enemy.id, target.x, target.y);
      enemy.attackTimer = (enemy.type === "boss" ? 0.48 : enemy.elite || enemy.affix === "frenzy" ? 0.54 : 0.78) * (enemy.cadenceMul || 1);
    }
  }
}

function updateEliteSpecial(room, enemy, target, dist, dt, now = Date.now()) {
  if (!enemy.elite || enemy.type === "boss" || enemy.trainingDummy || enemy.blockadeRunner) return false;

  if (enemy.windup && isEliteSpecialWindup(enemy.windup.kind)) {
    const eliteWindup = advanceEnemyWindup(enemy, enemy.windup.kind, dt);
    if (eliteWindup.ready) {
      const resolvedWindup = eliteWindup.windup;
      resolveEliteSpecial(room, enemy, resolvedWindup, target, now);
      if (enemy.windup === resolvedWindup) enemy.windup = null;
      enemy.eliteSpecialTimer = Math.max(
        enemy.eliteSpecialTimer || 0,
        getEliteSpecialCooldown(enemy) * getSpecialPatternCooldownMultiplier(enemy, "elite")
      );
    }
    return true;
  }

  if (enemy.eliteSpecialTimer > 0 || enemy.windup || enemy.chargeMove) return false;
  if (!allowSpecialPatternNow(enemy, "elite")) return false;
  const started = startEliteSpecial(room, enemy, target, dist);
  if (!started) deferSpecialPattern(enemy, "elite");
  return started;
}

function allowSpecialPatternNow(enemy, channel) {
  if (enemy?.type === "boss") return allowBossPatternByMix(enemy, channel);
  return enemySystem.allowSpecialPatternNow(enemy, channel);
}

function allowBossPatternByMix(enemy, channel) {
  if (enemy.executionBoss) return true;
  const mix = enemy.patternMix || {};
  const specialShare = clamp((mix.special || 0.24) + (mix.punish || 0.06), 0.12, 0.42);
  const phaseBonus = Math.max(0, Math.min(2, (enemy.bossPhase || 1) - 1));
  const allowedCount = clamp(Math.round(specialShare * SPECIAL_PATTERN_CYCLE) + phaseBonus, 2, 6);
  const key = "bossSharedPatternStep";
  enemy[key] = ((enemy[key] || 0) % SPECIAL_PATTERN_CYCLE) + 1;
  if (isPatternMixSpecialSlot(enemy[key], allowedCount)) return true;
  deferSpecialPattern(enemy, channel);
  return false;
}

function isPatternMixSpecialSlot(step, allowedCount) {
  if (allowedCount >= 6) return step === 1 || step === 3 || step === 5 || step === 7 || step === 9 || step === 10;
  if (allowedCount === 5) return step === 2 || step === 4 || step === 6 || step === 8 || step === 10;
  if (allowedCount >= 4) return step === 2 || step === 5 || step === 8 || step === 10;
  if (allowedCount === 3) return step === 3 || step === 7 || step === 10;
  if (allowedCount === 2) return step === 4 || step === 9;
  return step === 7;
}

function deferSpecialPattern(enemy, channel) {
  enemySystem.deferSpecialPattern(enemy, channel);
}

function setSpecialPatternTimer(enemy, channel, seconds) {
  enemySystem.setSpecialPatternTimer(enemy, channel, seconds);
}

function getBasicPatternWindow(enemy, channel) {
  return enemySystem.getBasicPatternWindow(enemy, channel);
}

function getSpecialPatternCooldownMultiplier(enemy, channel) {
  return enemySystem.getSpecialPatternCooldownMultiplier(enemy, channel);
}

function isEliteSpecialWindup(kind) {
  return enemySystem.isEliteSpecialWindupKind(kind);
}

function getEliteSpecialCooldown(enemy) {
  return enemySystem.getEliteSpecialCooldown(enemy);
}

function startEliteSpecial(room, enemy, target, dist) {
  if (!target || target.hp <= 0) return false;
  if (enemy.type === "slime" && dist < 430) return startEliteSlam(room, enemy, target);
  if (enemy.type === "bat" && dist < 240) return startEliteScreech(room, enemy);
  if (enemy.type === "brute" && dist < 240) return startEliteQuake(room, enemy, target);
  if (enemy.type === "guardian") return startEliteFortify(room, enemy);
  if (enemy.type === "shaman") return startEliteTotem(room, enemy);
  if (enemy.type === "spitter" && dist < 620) return startEliteVolley(room, enemy, target);
  if (enemy.type === "bomber" && dist < 520) return startEliteMine(room, enemy, target);
  if (enemy.type === "charger" && dist > 170 && dist < 680) return startEliteChainCharge(room, enemy, target);
  if (enemy.type === "splitter") return startEliteFracture(room, enemy);
  if (enemy.type === "stalker" && dist < 620) return startEliteShadow(room, enemy, target);
  if (enemy.type === "mortar" && dist < 820) return startEliteClusterMortar(room, enemy, target);
  if (enemy.type === "sniper" && dist > 180 && dist < 900) return startEliteCrossfire(room, enemy, target);
  return false;
}

function setEliteWindup(room, enemy, windup, effect = {}) {
  enemy.windup = {
    duration: windup.time,
    ...windup
  };
  addEffect(room, "warning", effect.x ?? enemy.x, effect.y ?? enemy.y, {
    color: effect.color || enemy.color || enemyDefs[enemy.type]?.color || "#f6f1e8",
    radius: effect.radius || windup.radius || enemy.radius + 48,
    style: effect.style || windup.kind,
    angle: effect.angle,
    arc: effect.arc,
    fromX: effect.fromX,
    fromY: effect.fromY,
    toX: effect.toX,
    toY: effect.toY,
    duration: windup.time
  });
  return true;
}

function startEliteSlam(room, enemy, target) {
  const time = 0.58 * Math.max(0.86, enemy.cadenceMul || 1);
  const predicted = predictPlayerPosition(room, enemy, target, Math.max(240, enemy.speed * 2.2), time, getEnemyAimAccuracy(room, enemy) * 0.74);
  const radius = 92 + enemy.radius * 0.6;
  return setEliteWindup(
    room,
    enemy,
    { kind: "elite_slam", time, x: round2(predicted.x), y: round2(predicted.y), radius },
    { x: predicted.x, y: predicted.y, radius, style: "elite_slam" }
  );
}

function startEliteScreech(room, enemy) {
  const time = 0.44 * Math.max(0.86, enemy.cadenceMul || 1);
  const radius = 150;
  return setEliteWindup(room, enemy, { kind: "elite_screech", time, x: round2(enemy.x), y: round2(enemy.y), radius }, { radius, style: "elite_screech" });
}

function startEliteQuake(room, enemy, target) {
  const time = 0.52 * Math.max(0.86, enemy.cadenceMul || 1);
  const dir = normalizeVector(target.x - enemy.x, target.y - enemy.y);
  const angle = Math.atan2(dir.y, dir.x);
  return setEliteWindup(
    room,
    enemy,
    { kind: "elite_quake", time, dirX: round2(dir.x), dirY: round2(dir.y), angle: round2(angle), radius: 250, width: 64 },
    {
      x: enemy.x + dir.x * 125,
      y: enemy.y + dir.y * 125,
      radius: 128,
      angle,
      fromX: round2(enemy.x),
      fromY: round2(enemy.y),
      toX: round2(enemy.x + dir.x * 250),
      toY: round2(enemy.y + dir.y * 250),
      style: "elite_quake"
    }
  );
}

function startEliteFortify(room, enemy) {
  const targets = getGuardianBarrierTargets(room, enemy, 310);
  if (!targets.length && (enemy.barrier || 0) > enemy.maxHp * 0.12) return false;
  const time = 0.66 * Math.max(0.88, enemy.cadenceMul || 1);
  return setEliteWindup(room, enemy, { kind: "elite_fortify", time, radius: 310 }, { radius: 310, style: "elite_fortify" });
}

function startEliteTotem(room, enemy) {
  const ally = lowestHealthEnemyNear(room, enemy, 430);
  if (!ally && enemy.hp > enemy.maxHp * 0.72) return false;
  const time = 0.72 * Math.max(0.88, enemy.cadenceMul || 1);
  return setEliteWindup(room, enemy, { kind: "elite_totem", time, radius: 230 }, { radius: 230, style: "elite_totem" });
}

function startEliteVolley(room, enemy, target) {
  const time = 0.62 * Math.max(0.92, enemy.cadenceMul || 1) * Math.min(1.18, enemy.rangedPressureMul || 1);
  const predicted = predictPlayerPosition(room, enemy, target, 440, time, getEnemyAimAccuracy(room, enemy) * 0.9);
  const angle = Math.atan2(predicted.y - enemy.y, predicted.x - enemy.x);
  return setEliteWindup(room, enemy, { kind: "elite_volley", time, angle: round2(angle), spread: 0.42 }, { angle, radius: 72, style: "elite_volley" });
}

function startEliteMine(room, enemy, target) {
  const time = 0.62 * Math.max(0.86, enemy.cadenceMul || 1);
  const predicted = predictPlayerPosition(room, enemy, target, 260, time, getEnemyAimAccuracy(room, enemy) * 0.72);
  const radius = 116;
  return setEliteWindup(room, enemy, { kind: "elite_mine", time, x: round2(predicted.x), y: round2(predicted.y), radius }, {
    x: predicted.x,
    y: predicted.y,
    radius,
    style: "elite_mine"
  });
}

function startEliteChainCharge(room, enemy, target) {
  startChargeWindup(room, enemy, target, {
    windupTime: 0.48,
    radius: 112,
    style: "elite_chain_charge",
    accuracyBonus: 0.22,
    chainCount: 1
  });
  enemy.eliteSpecialTimer = Math.max(
    enemy.eliteSpecialTimer || 0,
    getEliteSpecialCooldown(enemy) * getSpecialPatternCooldownMultiplier(enemy, "elite")
  );
  return true;
}

function startEliteFracture(room, enemy) {
  if (countEnemiesOfType(room, "splinter") >= 10 + getActivePlayers(room).length * 2) return false;
  const time = 0.58 * Math.max(0.88, enemy.cadenceMul || 1);
  return setEliteWindup(room, enemy, { kind: "elite_fracture", time, radius: 128 }, { radius: 128, style: "elite_fracture" });
}

function startEliteShadow(room, enemy, target) {
  const time = 0.46 * Math.max(0.86, enemy.cadenceMul || 1);
  const velocity = getPlayerVelocity(target);
  const back = normalizeVector(-(velocity.x || target.x - enemy.x), -(velocity.y || target.y - enemy.y));
  const x = clamp(target.x + back.x * 88, 42, room.world.w - 42);
  const y = clamp(target.y + back.y * 88, 42, room.world.h - 42);
  return setEliteWindup(room, enemy, { kind: "elite_shadow", time, targetId: target.id, x: round2(x), y: round2(y), radius: 108 }, {
    x,
    y,
    radius: 108,
    style: "elite_shadow"
  });
}

function startEliteClusterMortar(room, enemy, target) {
  const time = 1.12 * Math.max(0.94, enemy.cadenceMul || 1) * Math.min(1.2, enemy.rangedPressureMul || 1);
  const center = predictPlayerPosition(room, enemy, target, 460, time, getEnemyAimAccuracy(room, enemy) * 0.88);
  const points = [];
  for (let i = 0; i < 3; i += 1) {
    const angle = enemy.aiPhase + (Math.PI * 2 * i) / 3;
    const spread = i === 0 ? 0 : 86;
    points.push({
      x: round2(clamp(center.x + Math.cos(angle) * spread, 64, room.world.w - 64)),
      y: round2(clamp(center.y + Math.sin(angle) * spread, 64, room.world.h - 64))
    });
  }
  for (const point of points) {
    addEffect(room, "warning", point.x, point.y, { color: enemyDefs.mortar.color, radius: 82, style: "mortar_zone", duration: time });
  }
  enemy.windup = { kind: "elite_cluster_mortar", time, duration: time, points, radius: 82 };
  return true;
}

function startEliteCrossfire(room, enemy, target) {
  const time = 1.05 * Math.max(0.92, enemy.cadenceMul || 1) * Math.min(1.18, enemy.rangedPressureMul || 1);
  const predicted = predictPlayerPosition(room, enemy, target, 780, time, getEnemyAimAccuracy(room, enemy) * 0.94);
  const baseAngle = Math.atan2(predicted.y - enemy.y, predicted.x - enemy.x);
  const points = [];
  for (const offset of [-0.16, 0, 0.16]) {
    const angle = baseAngle + offset;
    points.push({
      x: round2(enemy.x + Math.cos(angle) * 780),
      y: round2(enemy.y + Math.sin(angle) * 780),
      angle: round2(angle)
    });
  }
  enemy.windup = { kind: "elite_crossfire", time, duration: time, points, angle: round2(baseAngle), x: round2(predicted.x), y: round2(predicted.y) };
  addEffect(room, "warning", predicted.x, predicted.y, { color: enemyDefs.sniper.color, radius: 58, style: "elite_crossfire", duration: time });
  return true;
}

function resolveEliteSpecial(room, enemy, cast, target, now = Date.now()) {
  if (!cast || enemy.hp <= 0) return;
  if (cast.kind === "elite_slam") return performEliteSlam(room, enemy, cast);
  if (cast.kind === "elite_screech") return performEliteScreech(room, enemy, cast);
  if (cast.kind === "elite_quake") return performEliteQuake(room, enemy, cast);
  if (cast.kind === "elite_fortify") return performEliteFortify(room, enemy, cast);
  if (cast.kind === "elite_totem") return performEliteTotem(room, enemy, cast, now);
  if (cast.kind === "elite_volley") return performEliteVolley(room, enemy, cast);
  if (cast.kind === "elite_mine") return performEliteMine(room, enemy, cast);
  if (cast.kind === "elite_fracture") return performEliteFracture(room, enemy, cast);
  if (cast.kind === "elite_shadow") return performEliteShadow(room, enemy, cast, target);
  if (cast.kind === "elite_cluster_mortar") return performEliteClusterMortar(room, enemy, cast);
  if (cast.kind === "elite_crossfire") return performEliteCrossfire(room, enemy, cast);
}

function performEliteSlam(room, enemy, cast) {
  const target = findFreeEnemySpawnPosition(room, cast.x || enemy.x, cast.y || enemy.y, enemy.radius);
  enemy.x = target.x;
  enemy.y = target.y;
  const radius = cast.radius || 112;
  addEffect(room, "impact", enemy.x, enemy.y, { color: enemy.color, radius, style: "elite_slam" });
  damagePlayersInRadius(room, enemy, enemy.x, enemy.y, radius, enemy.damage * 0.86, { ranged: true, damageType: "elite_slam" });
}

function performEliteScreech(room, enemy, cast) {
  const radius = cast.radius || 150;
  addEffect(room, "warning", enemy.x, enemy.y, { color: enemy.color, radius, style: "elite_screech_burst" });
  damagePlayersInRadius(room, enemy, enemy.x, enemy.y, radius, enemy.damage * 0.62, { ranged: true, damageType: "elite_screech" });
}

function performEliteQuake(room, enemy, cast) {
  const dir = normalizeVector(Number(cast.dirX) || 1, Number(cast.dirY) || 0);
  const length = cast.radius || 250;
  const width = cast.width || 64;
  const endX = enemy.x + dir.x * length;
  const endY = enemy.y + dir.y * length;
  addEffect(room, "slash", enemy.x + dir.x * length * 0.45, enemy.y + dir.y * length * 0.45, {
    color: enemy.color,
    angle: Math.atan2(dir.y, dir.x),
    radius: length * 0.55,
    style: "brute_swing"
  });
  damagePlayersOnSegment(room, enemy, enemy.x, enemy.y, endX, endY, width, enemy.damage * 0.94, { ranged: true, damageType: "elite_quake" });
}

function performEliteFortify(room, enemy, cast) {
  const radius = cast.radius || 310;
  enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * 0.16));
  enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 5.6);
  addEffect(room, "shield", enemy.x, enemy.y, { color: enemy.color, radius: enemy.radius + 42, style: "elite_fortify" });
  for (const target of getGuardianBarrierTargets(room, enemy, radius).slice(0, 5)) {
    const amount = Math.round(getGuardianBarrierAmount(room, enemy, target) * 1.28);
    target.barrier = Math.max(target.barrier || 0, amount);
    target.barrierTimer = Math.max(target.barrierTimer || 0, 5.4);
    addEffect(room, "shield", target.x, target.y, { value: amount, color: enemy.color, radius: target.radius + 30, style: "enemy_barrier" });
  }
}

function performEliteTotem(room, enemy, cast, now = Date.now()) {
  const radius = cast.radius || 230;
  const heal = 26 + room.wave * 3.5;
  addEffect(room, "holy", enemy.x, enemy.y, { color: enemy.color, radius, style: "shaman_heal_burst" });
  for (const ally of room.enemies) {
    if (ally.hp <= 0 || distance(enemy, ally) > radius + ally.radius) continue;
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    ally.shamanHealLockUntil = now + SHAMAN_TARGET_HEAL_LOCK_MS;
    ally.barrier = Math.max(ally.barrier || 0, Math.round(heal * 0.52));
    ally.barrierTimer = Math.max(ally.barrierTimer || 0, 3.8);
    addEffect(room, "heal", ally.x, ally.y, { value: Math.round(heal), color: enemy.color, style: "elite_totem" });
  }
}

function performEliteVolley(room, enemy, cast) {
  const angle = Number.isFinite(cast.angle) ? cast.angle : enemy.aiPhase || 0;
  const spread = cast.spread || 0.42;
  for (const offset of [-spread, -spread * 0.5, 0, spread * 0.5, spread]) {
    fireEnemyProjectileAtAngle(room, enemy, angle + offset, {
      speed: 430,
      damageMul: 0.64,
      radius: 10,
            poison: 1.65 + room.wave * 0.14,
      poisonDuration: 3,
      style: "venom_spit",
      damageType: "elite_volley"
    });
  }
  addEffect(room, "shot", enemy.x, enemy.y, { color: enemy.color, angle, radius: 64, style: "venom_spit" });
}

function performEliteMine(room, enemy, cast) {
  const radius = cast.radius || 116;
  room.hazards.push({
    id: nextHazardId++,
    type: "acid_pool",
    x: cast.x,
    y: cast.y,
    radius,
    timer: 3.2,
    armTime: 0.42,
    armTimeMax: 0.42,
    tick: 0.52,
    damage: enemy.damage * 0.16,
    poison: 1.25 + room.wave * 0.12,
    ownerId: enemy.id,
    damageType: "elite_mine",
    hostile: true,
    dead: false
  });
  addEffect(room, "explosion", cast.x, cast.y, { color: enemy.color, radius: radius * 0.62, style: "mortar_impact" });
}

function performEliteFracture(room, enemy) {
  const count = countEnemiesOfType(room, "splinter") > 8 ? 1 : 2;
  const activeCount = getActivePlayers(room).length;
  if (countEnemiesOfType(room, "splinter") >= 10 + activeCount * 2) return false;
  for (let i = 0; i < count; i += 1) {
    const angle = enemy.aiPhase + (Math.PI * 2 * i) / count;
    spawnEnemy(room, "splinter", {
      x: enemy.x + Math.cos(angle) * 34,
      y: enemy.y + Math.sin(angle) * 34,
      scale: 0.82,
      xpMul: 0.2
    });
  }
  addEffect(room, "explosion", enemy.x, enemy.y, { color: enemy.color, radius: enemy.radius + 46, style: "splitter_pop" });
}

function performEliteShadow(room, enemy, cast, fallbackTarget) {
  const target = room.players.get(cast.targetId) || fallbackTarget || nearestLivingPlayer(room, enemy);
  if (!target) return;
  const spot = findFreeEnemySpawnPosition(room, cast.x || target.x, cast.y || target.y, enemy.radius);
  enemy.x = spot.x;
  enemy.y = spot.y;
  addEffect(room, "dash", enemy.x, enemy.y, { color: enemy.color, radius: 92, style: "stalker_shadow" });
  startStalkerStab(room, enemy, target);
  if (enemy.windup) enemy.windup.time = Math.min(enemy.windup.time, 0.18);
}

function performEliteClusterMortar(room, enemy, cast) {
  const points = Array.isArray(cast.points) ? cast.points : [{ x: cast.x || enemy.x, y: cast.y || enemy.y }];
  for (const point of points) {
    launchMortarBlast(room, enemy, {
      x: point.x,
      y: point.y,
      radius: cast.radius || 82,
      flightTime: 0.54,
      damage: enemy.damage * 0.62,
      knockback: 64
    });
  }
}

function updateFieldPickups(room, dt) {
  if (room.status !== "combat") return;
  for (const pickup of room.fieldPickups || []) {
    if (pickup.dead) continue;
    pickup.timer = Math.max(0, (pickup.timer || FIELD_PICKUP_LIFETIME) - dt);
    if (pickup.timer <= 0) {
      pickup.dead = true;
      continue;
    }

    pickup.x = clamp(pickup.x + (pickup.vx || 0) * dt, 24, room.world.w - 24);
    pickup.y = clamp(pickup.y + (pickup.vy || 0) * dt, 24, room.world.h - 24);
    pickup.vx = (pickup.vx || 0) * Math.max(0, 1 - dt * 5);
    pickup.vy = (pickup.vy || 0) * Math.max(0, 1 - dt * 5);

    const target = pickup.type === "equipment"
      ? getHumanPlayers(room)
        .filter((player) => player.accountId && isActiveLivingPlayer(player))
        .reduce((nearest, player) => !nearest || distance(player, pickup) < distance(nearest, pickup) ? player : nearest, null)
      : nearestLivingPlayer(room, pickup);
    if (!target || distance(target, pickup) > (pickup.radius || 16) + 26) continue;
    if (pickup.type === "health_potion") {
      if (target.hp >= target.maxHp) continue;
      const previousHp = target.hp;
      const heal = target.maxHp * 0.1 * (target.healingMul || 1);
      target.hp = Math.min(target.maxHp, target.hp + heal);
      const recovered = target.hp - previousHp;
      addEffect(room, "heal", target.x, target.y, {
        value: Math.max(1, Math.round(recovered)),
        color: "#86efac",
        radius: 34,
        style: "field_health_potion"
      });
      pushEvent(room, `${target.name} 님이 체력약을 획득해 최대 체력의 10%를 회복했습니다.`);
    } else if (pickup.type === "xp_magnet") {
      let attracted = 0;
      for (const orb of room.xpOrbs || []) {
        if (orb.dead) continue;
        orb.magnetTargetId = target.id;
        attracted += 1;
      }
      addEffect(room, "impact", target.x, target.y, {
        color: "#67e8f9",
        radius: 78,
        style: "field_xp_magnet"
      });
      pushEvent(room, `${target.name} 님이 자석을 획득해 경험치 ${attracted}개를 끌어당깁니다.`);
    } else if (pickup.type === "equipment") {
      const account = accountStore.getTrusted(target.accountId);
      if (!account) continue;
      const granted = progressionService.grantEquipmentDrop(account.progress, {
        dropId: pickup.dropId,
        classId: target.classId,
        highestLevel: pickup.highestLevel,
        abyssDepth: pickup.abyssDepth,
        ascensionLevel: pickup.ascensionLevel,
        rarity: pickup.rarity,
        rarityCap: pickup.rarityCap,
      });
      if (!granted.item) {
        pickup.dead = true;
        continue;
      }
      const session = accountStore.updateProgress(account.id, granted.progress, "field-equipment-drop");
      target.accountRevision = Number(session?.account?.revision || target.accountRevision || 0);
      sendAccountProgress(target, session, "equipment-drop", `${granted.item.name} 획득`, {
        equipmentPickup: {
          id: granted.item.id,
          name: granted.item.name,
          slot: granted.item.slot,
          rarity: granted.item.rarity,
          level: Math.max(1, Math.floor(Number(granted.item.itemLevel || 1))),
        },
      });
      addEffect(room, "impact", target.x, target.y, {
        color: ({ common: "#cbd5e1", rare: "#60a5fa", epic: "#c084fc", legendary: "#fbbf24", mythic: "#fb7185", unique: "#5eead4" })[granted.item.rarity] || "#cbd5e1",
        radius: granted.item.rarity === "unique" ? 96 : granted.item.rarity === "mythic" ? 86 : granted.item.rarity === "legendary" ? 74 : 62,
        style: "field_equipment_pickup"
      });
      pushEvent(room, `${target.name} 님이 ${granted.item.name} 장비를 획득했습니다.`);
    } else {
      continue;
    }
    pickup.dead = true;
  }
}

function performEliteCrossfire(room, enemy, cast) {
  const points = Array.isArray(cast.points) && cast.points.length ? cast.points : [{ angle: cast.angle || 0 }];
  for (const point of points) {
    const angle = Number.isFinite(point.angle) ? point.angle : Math.atan2((point.y || enemy.y) - enemy.y, (point.x || enemy.x) - enemy.x);
    fireEnemyProjectileAtAngle(room, enemy, angle, {
      speed: 760,
      damageMul: 0.62,
      radius: 7,
      style: "sniper_bolt",
      damageType: "elite_crossfire",
      distanceLeft: 960
    });
  }
  addEffect(room, "shot", enemy.x, enemy.y, { color: enemy.color, angle: cast.angle || 0, radius: 58, style: "sniper_bolt" });
}

function fireEnemyProjectileAtAngle(room, enemy, angle, options = {}) {
  if (!canSpawnHostileProjectile(room)) return false;
  const speed = (options.speed || 420) * ((room.ascensionLevel || 0) >= 5 ? 1.25 : 1);
  room.projectiles.push({
    id: nextProjectileId++,
    ownerId: enemy.id,
    classId: "enemy",
    x: enemy.x + Math.cos(angle) * (enemy.radius + 8),
    y: enemy.y + Math.sin(angle) * (enemy.radius + 8),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    // Cast range decides whether a shot can start; this distance keeps an already-fired shot alive to its own limit.
    distanceLeft: options.distanceLeft || HOSTILE_PROJECTILE_TRAVEL_DISTANCE.default,
    damage: enemy.damage * (options.damageMul || 0.6),
    radius: options.radius || 9,
    pierce: 0,
    splash: 0,
    poison: options.poison || 0,
    poisonDuration: options.poisonDuration || 0,
    slow: 0,
    chain: 0,
    style: options.style || "spit",
    damageType: options.damageType || options.style || "elite_projectile",
    hostile: true,
    dead: false
  });
  return true;
}

function damagePlayersInRadius(room, enemy, x, y, radius, damage, options = {}) {
  for (const player of getActiveLivingPlayers(room)) {
    if (!collisionSystem.circlesOverlap(player, getPlayerCollisionRadius(player), { x, y }, radius)) continue;
    damagePlayer(room, player, damage, enemy.id, player.x, player.y, {
      ...options,
      knockbackOrigin: options.knockbackOrigin || { x, y }
    });
  }
}

function damagePlayersOnSegment(room, enemy, fromX, fromY, toX, toY, width, damage, options = {}) {
  const dir = normalizeVector(toX - fromX, toY - fromY);
  for (const player of getActiveLivingPlayers(room)) {
    if (!collisionSystem.segmentIntersectsCircle(player, getPlayerCollisionRadius(player), fromX, fromY, toX, toY, width)) continue;
    damagePlayer(room, player, damage, enemy.id, player.x, player.y, {
      ...options,
      knockbackDirX: Number.isFinite(options.knockbackDirX) ? options.knockbackDirX : dir.x,
      knockbackDirY: Number.isFinite(options.knockbackDirY) ? options.knockbackDirY : dir.y
    });
  }
}

function countEnemiesOfType(room, type) {
  return enemySystem.countEnemiesOfType(room.enemies, type);
}

function triggerBossPhaseTransition(room, enemy, profile, target) {
  if (enemy.executionBoss) {
    const phase = Math.max(2, enemy.bossPhase || 2);
    const targetAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    castBossCrossBeams(room, enemy, profile, phase >= 4 ? 10 : phase >= 3 ? 8 : 6, {
      rotation: targetAngle + Math.PI / (phase >= 4 ? 10 : 8),
      armTime: phase >= 4 ? 0.82 : phase >= 3 ? 0.92 : 1.02,
      width: phase >= 4 ? 48 : 42,
      damageMul: phase >= 4 ? 0.74 : 0.66,
      style: "execution_phase_cage"
    });
    castBossGapBloom(room, enemy, profile, target, {
      count: phase >= 4 ? 13 : phase >= 3 ? 11 : 9,
      ring: phase >= 4 ? 365 : phase >= 3 ? 335 : 305,
      radius: phase >= 4 ? 94 : 84,
      armTime: phase >= 4 ? 0.96 : 1.08,
      damageMul: phase >= 4 ? 0.72 : 0.62,
      style: "execution_phase_seal"
    });
    return;
  }

  bossShockwave(room, enemy, profile, enemy.radius + (enemy.bossPhase >= 3 ? 270 : 225), {
    armTime: enemy.bossPhase >= 3 ? 1.55 : 1.75,
    damageMul: enemy.bossPhase >= 3 ? 0.66 : 0.58,
    knockback: enemy.bossPhase >= 3 ? 82 : 70
  });
  if (enemy.bossPattern === "charge") {
    castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 8 : 6, {
      rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x),
      armTime: enemy.bossPhase >= 3 ? 1.2 : 1.34,
      width: enemy.bossPhase >= 3 ? 42 : 36,
      damageMul: 0.72,
      style: "iron_cross"
    });
    castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 4 : 3, {
      aroundBoss: true,
      armTimeMul: 1.08,
      radiusMul: 0.82
    });
    return;
  }

  if (enemy.bossPattern === "summon") {
    enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * (enemy.bossPhase >= 3 ? 0.14 : 0.11)));
    enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 6.2);
    spawnBossAdds(room, enemy, profile, enemy.bossPhase >= 3 ? 4 : 3, enemy.bossPhase >= 3 ? 0.78 : 0.68);
    castBossRitualBloom(room, enemy, profile);
    castBossProjectileRing(room, enemy, profile, enemy.bossPhase >= 3 ? 14 : 10, {
      speed: 350,
      damageMul: 0.42,
      radius: 8,
      poison: 1.25 + room.wave * 0.08,
      poisonDuration: 2.4,
      style: "venom_spit",
      damageType: "hive_venom_ring"
    });
    return;
  }

  if (enemy.bossPattern === "void") {
    repositionVoidBoss(room, enemy, target, profile);
    castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : 4, {
      rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 4,
      armTime: enemy.bossPhase >= 3 ? 1.1 : 1.26,
      width: enemy.bossPhase >= 3 ? 44 : 38,
      damageMul: 0.76,
      style: "void_cross"
    });
    castVoidSniperFan(room, enemy, target, profile, enemy.bossPhase >= 3 ? 5 : 3);
  }
}

function applyBossPhaseTransition(room, enemy, profile, target, transition) {
  enemy.windup = null;
  enemy.chargeMove = null;
  enemy.bossPhase = transition.phase;
  enemy.cadenceMul = Math.max(transition.minCadence, (enemy.cadenceMul || 1) * transition.cadenceMul);
  enemy.damage = Math.round(enemy.damage * transition.damageMul);
  enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * transition.barrierRatio));
  enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, transition.barrierTime);
  const phaseIndex = clamp(transition.phase - 1, 0, (profile.phaseTitles || []).length - 1);
  const phaseTelegraph = getEnemyTelegraphTime(room, enemy, "phase", transition.phase >= 3 ? 1.5 : 1.35);
  enemy.phaseTitle = profile.phaseTitles?.[phaseIndex] || `Phase ${transition.phase}`;
  enemy.phaseTransitionTimer = Math.max(enemy.phaseTransitionTimer || 0, phaseTelegraph);
  enemy.phaseTransitionTimerMax = phaseTelegraph;
  enemy.phaseAuraColor = profile.color;
  enemy.specialTimer = Math.max(enemy.specialTimer || 0, phaseTelegraph + 0.72);
  enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, phaseTelegraph + 0.9);
  enemy.shotTimer = Math.max(enemy.shotTimer || 0, phaseTelegraph + 0.82);
  enemy.bossPressureTimer = Math.min(enemy.bossPressureTimer ?? Infinity, transition.phase >= 3 ? 1.3 : 1.8);
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + transition.warningRadiusBonus,
    style: `boss_phase_${transition.phase}`,
    duration: phaseTelegraph,
    phase: transition.phase,
    label: enemy.phaseTitle
  });
  addEffect(room, "explosion", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + transition.warningRadiusBonus * 0.72,
    style: `boss_phase_flare_${transition.phase}`,
    duration: Math.min(0.75, phaseTelegraph * 0.45),
    phase: transition.phase
  });
  triggerBossPhaseTransition(room, enemy, profile, target);
}

function getMiniBossPhaseTransition(enemy) {
  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  if (hpRatio > 0.5 || enemy.bossPhase >= 2) return null;
  return {
    phase: 2,
    cadenceMul: 0.94,
    minCadence: 0.78,
    damageMul: 1.04,
    barrierRatio: 0.06,
    barrierTime: 3.8,
    warningRadiusBonus: 82
  };
}

function startPendingBossPhaseTransition(room, enemy, preferredTarget = null) {
  if (enemy.type !== "boss" || enemy.trainingDummy || (enemy.phaseTransitionTimer || 0) > 0) return false;
  const transition = enemy.miniBoss ? getMiniBossPhaseTransition(enemy) : getBossPhaseTransition(enemy);
  if (!transition) return false;
  const target = preferredTarget && preferredTarget.hp > 0 && !preferredTarget.spectator
    ? preferredTarget
    : getEnemyTarget(room, enemy);
  if (!target) return false;
  const profile = enemy.miniBoss ? getMiniBossProfile(room.floor) : getBossProfileById(enemy.bossId) || getChapterBossProfile(room.floor);
  applyBossPhaseTransition(room, enemy, profile, target, transition);
  return true;
}

function updateBossEnemy(room, enemy, target, dist, dt) {
  const profile = enemy.miniBoss ? getMiniBossProfile(room.floor) : getBossProfileById(enemy.bossId) || getChapterBossProfile(room.floor);
  if ((enemy.lethalCastTimer || 0) > 0) {
    enemy.windup = null;
    enemy.chargeMove = null;
    return true;
  }
  if ((enemy.phaseTransitionTimer || 0) > 0) return true;
  const phaseTransition = enemy.miniBoss ? getMiniBossPhaseTransition(enemy) : getBossPhaseTransition(enemy);
  if (phaseTransition) {
    applyBossPhaseTransition(room, enemy, profile, target, phaseTransition);
    return true;
  }
  if (advanceBossProjectileWindup(room, enemy, dt, profile)) return true;
  if (enemy.miniBoss) return updateMiniBossEnemy(room, enemy, target, dist, dt, profile);
  if (enemy.executionBoss) return updateExecutionBoss(room, enemy, target, dist, dt, profile);

  updateBossOverlapPressure(room, enemy, target, dt, profile);

  if ((room.ascensionLevel || 0) >= 4) {
    const ascensionPressure = Math.max(0, Number(room.ascensionLevel || 0) - 4);
    enemy.ascensionPatternTimer = Math.max(0, (enemy.ascensionPatternTimer ?? 5.8) - dt);
    if (enemy.ascensionPatternTimer <= 0 && !enemy.windup && !enemy.chargeMove) {
      castBossProjectileRing(room, enemy, profile, 6 + Math.max(1, enemy.bossPhase || 1) * 2 + Math.floor(ascensionPressure / 3) * 2, {
        speed: 410 + Math.max(1, enemy.bossPhase || 1) * 35 + ascensionPressure * 8,
        damageMul: 0.42,
        radius: 7,
        style: "ascension_ring",
        damageType: "boss_projectile_ring"
      });
      enemy.ascensionPatternTimer = Math.max(2.8, 7.4 - Math.max(1, enemy.bossPhase || 1) * 0.65 - ascensionPressure * 0.12);
      return true;
    }
  }

  if (enemy.bossPattern === "charge") return updateChargeBoss(room, enemy, target, dist, dt, profile);
  if (enemy.bossPattern === "summon") return updateRitualBoss(room, enemy, target, dist, dt, profile);
  if (enemy.bossPattern === "void") return updateVoidBoss(room, enemy, target, dist, dt, profile);
  return false;
}

function updateBossOverlapPressure(room, enemy, target, dt, profile) {
  if (enemy.bossPhase < 2) return;
  const initialDelay = enemy.bossPhase >= 3 ? 2.2 : 2.8;
  enemy.bossPressureTimer = Math.max(0, (enemy.bossPressureTimer ?? initialDelay) - dt);
  if (enemy.bossPressureTimer > 0) return;

  enemy.bossPressureCycle = (enemy.bossPressureCycle || 0) + 1;
  const phaseThree = enemy.bossPhase >= 3;
  if (enemy.bossPattern === "charge") {
    if (enemy.bossPressureCycle % 2 === 1) {
      castBossProjectileRing(room, enemy, profile, phaseThree ? 12 : 8, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / (phaseThree ? 12 : 8),
        speed: phaseThree ? 520 : 465,
        damageMul: phaseThree ? 0.38 : 0.32,
        radius: 7,
        style: "iron_pressure_shard",
        damageType: "iron_pressure_ring",
        distanceLeft: 920
      });
    } else {
      bossShockwave(room, enemy, profile, phaseThree ? 245 : 205, {
        armTime: phaseThree ? 0.92 : 1.05,
        damageMul: phaseThree ? 0.56 : 0.48,
        knockback: phaseThree ? 82 : 70
      });
    }
  } else if (enemy.bossPattern === "summon") {
    if (enemy.bossPressureCycle % 2 === 1) {
      castBossBlasts(room, enemy, profile, Math.max(2, getActiveLivingPlayers(room).length + (phaseThree ? 2 : 1)), {
        radiusMul: phaseThree ? 0.76 : 0.68,
        damageMul: phaseThree ? 0.48 : 0.4,
        style: "hive_pressure_blast"
      });
    } else {
      castBossProjectileRing(room, enemy, profile, phaseThree ? 14 : 10, {
        speed: phaseThree ? 430 : 380,
        damageMul: 0.3,
        radius: 7,
        poison: 1.1 + room.wave * 0.06,
        poisonDuration: 2.1,
        style: "venom_spit",
        damageType: "hive_pressure_ring",
        distanceLeft: 860
      });
    }
  } else if (enemy.bossPattern === "void") {
    if (enemy.bossPressureCycle % 2 === 1) {
      castBossCrossBeams(room, enemy, profile, phaseThree ? 6 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / (phaseThree ? 6 : 4),
        armTime: phaseThree ? 1.0 : 1.12,
        width: phaseThree ? 34 : 30,
        damageMul: phaseThree ? 0.5 : 0.42,
        style: "void_pressure_cross"
      });
    } else {
      castBossBlasts(room, enemy, profile, Math.max(2, getActiveLivingPlayers(room).length + 1), {
        radiusMul: phaseThree ? 0.82 : 0.72,
        damageMul: phaseThree ? 0.52 : 0.44,
        style: "void_pressure_blast"
      });
    }
  }

  enemy.bossPressureTimer = (phaseThree ? 3.95 : 4.9) * Math.max(0.62, enemy.cadenceMul || 1);
}

function updateExecutionBoss(room, enemy, target, dist, dt, profile) {
  if (advanceChargeWindup(room, enemy, dt)) return true;

  enemy.executionPatternTimer = Math.max(0, (enemy.executionPatternTimer ?? 1.2) - dt);
  if (enemy.executionPatternTimer > 0) return false;

  const phase = Math.max(1, enemy.bossPhase || 1);
  const pattern = nextBossPattern(enemy, profile, EXECUTION_BOSS_PROFILE.signaturePatterns);
  const targetAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);

  if (pattern === "execution_annihilation") {
    castBossFieldJudgment(room, enemy, profile, target, {
      armTime: phase >= 4 ? 2.55 : 2.85,
      safeRadius: phase >= 4 ? 112 : 126,
      safeCount: Math.min(2, Math.max(1, getActiveLivingPlayers(room).length)),
      style: "execution_annihilation"
    });
    startBossSpiralBarrage(room, enemy, profile, {
      delay: 0.55,
      waves: phase >= 4 ? 9 : 7,
      count: phase >= 4 ? 20 : 16,
      gapSize: phase >= 4 ? 3 : 2,
      waveInterval: phase >= 4 ? 0.28 : 0.34,
      speed: phase >= 4 ? 485 : 430,
      damageMul: 0.18,
      rotationStep: phase >= 4 ? 0.34 : 0.3,
      style: "execution_spiral_bolt",
      damageType: "execution_spiral_barrage"
    });
  } else if (pattern === "execution_crimson_cage") {
    const beamCount = phase >= 4 ? 10 : phase >= 3 ? 8 : phase >= 2 ? 6 : 4;
    castBossCrossBeams(room, enemy, profile, beamCount, {
      rotation: targetAngle + Math.PI / beamCount,
      armTime: phase >= 4 ? 0.76 : phase >= 3 ? 0.86 : 0.98,
      width: phase >= 4 ? 48 : phase >= 3 ? 42 : 36,
      damageMul: phase >= 4 ? 0.76 : phase >= 3 ? 0.68 : 0.58,
      style: "execution_crimson_cage"
    });
    castBossGapBloom(room, enemy, profile, target, {
      count: phase >= 4 ? 13 : phase >= 3 ? 11 : phase >= 2 ? 9 : 7,
      ring: phase >= 4 ? 380 : phase >= 3 ? 350 : phase >= 2 ? 320 : 285,
      radius: phase >= 4 ? 94 : phase >= 3 ? 86 : 76,
      armTime: phase >= 4 ? 0.9 : phase >= 3 ? 1.0 : 1.12,
      damageMul: phase >= 4 ? 0.72 : phase >= 3 ? 0.64 : 0.54,
      style: "execution_cage_seal"
    });
  } else if (pattern === "execution_relentless_hunt") {
    castBossBlasts(room, enemy, profile, Math.max(2, getActiveLivingPlayers(room).length + Math.min(3, phase)), {
      radiusMul: phase >= 4 ? 0.92 : 0.8,
      damageMul: phase >= 4 ? 0.68 : phase >= 3 ? 0.6 : 0.52,
      style: "execution_hunt_blast"
    });
    startChargeWindup(room, enemy, target, {
      windupTime: phase >= 4 ? 0.46 : phase >= 3 ? 0.54 : phase >= 2 ? 0.62 : 0.72,
      radius: phase >= 3 ? 150 : 136,
      style: "execution_relentless_hunt",
      color: profile.color,
      accuracyBonus: phase >= 4 ? 0.42 : phase >= 3 ? 0.36 : 0.3,
      chainCount: phase >= 4 ? 4 : phase >= 3 ? 3 : phase >= 2 ? 2 : 1
    });
  } else if (pattern === "execution_crossfire") {
    repositionVoidBoss(room, enemy, target, profile);
    const crossfireAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    castBossBeamFan(room, enemy, profile, phase >= 4 ? 7 : phase >= 3 ? 6 : 5, crossfireAngle, {
      spread: phase >= 4 ? 2.7 : phase >= 3 ? 2.35 : 1.95,
      armTime: phase >= 4 ? 0.78 : phase >= 3 ? 0.88 : 1.0,
      length: 1180,
      width: phase >= 4 ? 46 : 40,
      damageMul: phase >= 4 ? 0.72 : phase >= 3 ? 0.64 : 0.56,
      style: "execution_crossfire"
    });
    startBossProjectileVolley(room, enemy, null, profile, {
      shape: "ring",
      armTime: phase >= 4 ? 0.68 : phase >= 3 ? 0.78 : 0.9,
      angle: crossfireAngle + Math.PI / (phase >= 4 ? 18 : 14),
      count: phase >= 4 ? 18 : phase >= 3 ? 16 : phase >= 2 ? 14 : 10,
      range: 1080,
      speed: phase >= 4 ? 590 : phase >= 3 ? 540 : 490,
      damageMul: phase >= 4 ? 0.48 : 0.42,
      radius: 8,
      style: "execution_bolt",
      damageType: "execution_crossfire"
    });
  } else {
    bossShockwave(room, enemy, profile, phase >= 4 ? 390 : phase >= 3 ? 350 : 310, {
      armTime: phase >= 4 ? 0.78 : phase >= 3 ? 0.9 : 1.04,
      damageMul: phase >= 4 ? 0.78 : phase >= 3 ? 0.7 : 0.62,
      knockback: phase >= 4 ? 112 : 96
    });
    castBossBlasts(room, enemy, profile, Math.max(4, getActiveLivingPlayers(room).length * 2 + Math.min(3, phase)), {
      radiusMul: phase >= 4 ? 1 : 0.88,
      damageMul: phase >= 4 ? 0.74 : phase >= 3 ? 0.66 : 0.58,
      style: "execution_final_sentence"
    });
    startBossProjectileVolley(room, enemy, target, profile, {
      armTime: phase >= 4 ? 0.7 : 0.82,
      count: phase >= 4 ? 9 : 7,
      spread: phase >= 4 ? 1.42 : 1.12,
      range: 1120,
      speed: phase >= 4 ? 820 : 740,
      damageMul: phase >= 4 ? 0.64 : 0.56,
      radius: 8,
      style: "execution_bolt",
      damageType: "execution_final_sentence"
    });
  }

  enemy.executionPatternTimer = phase >= 4 ? 1.18 : phase >= 3 ? 1.5 : phase >= 2 ? 1.82 : 2.18;
  return true;
}

function updateMiniBossEnemy(room, enemy, target, dist, dt, profile) {
  if (enemy.miniPattern === "duelist") return updateDuelistMiniBoss(room, enemy, target, dist, dt, profile);
  if (enemy.miniPattern === "plague") return updatePlagueMiniBoss(room, enemy, target, dist, dt, profile);
  if (enemy.miniPattern === "hunter") return updateHunterMiniBoss(room, enemy, target, dist, dt, profile);
  return updateLegacyMiniBossEnemy(room, enemy, target, dist, dt, profile);
}

function updateLegacyMiniBossEnemy(room, enemy, target, dist, dt, profile) {
  if (advanceChargeWindup(room, enemy, dt)) return true;

  if (advanceBossSnipeWindup(room, enemy, dt, (cast) => {
      fireSniperProjectile(room, enemy, cast.x, cast.y);
      if (enemy.bossPhase >= 2) {
        const baseAngle = Math.atan2(cast.y - enemy.y, cast.x - enemy.x);
        const offsets = enemy.bossPhase >= 3 ? [-0.18, 0.18] : [0.14];
        for (const offset of offsets) {
          fireEnemyProjectileAtAngle(room, enemy, baseAngle + offset, {
            speed: enemy.bossPhase >= 3 ? 860 : 800,
            damageMul: enemy.bossPhase >= 3 ? 0.62 : 0.54,
            radius: 7,
            style: "sniper_bolt",
            damageType: "void_split_shot",
            distanceLeft: 980
          });
        }
      }
    })) return true;

  if (enemy.chargeTimer <= 0 && dist > 92 && dist < 720) {
    if (!allowSpecialPatternNow(enemy, "miniboss_charge")) return false;
    startChargeWindup(room, enemy, target, {
      windupTime: 0.72,
      radius: 104,
      style: "boss_charge",
      color: profile.color,
      accuracyBonus: 0.18
    });
    setSpecialPatternTimer(enemy, "miniboss_charge", 3.4 * getSpecialPatternCooldownMultiplier(enemy, "miniboss_charge"));
    return true;
  }

  if (enemy.shotTimer <= 0 && dist > 150 && dist < 860) {
    if (!allowSpecialPatternNow(enemy, "miniboss_shot")) return false;
    const windupTime = getEnemyTelegraphTime(room, enemy, "special", 0.78) * Math.max(0.9, enemy.cadenceMul || 1);
    const predicted = predictPlayerPosition(room, enemy, target, 760, windupTime, getEnemyAimAccuracy(room, enemy) * 0.95);
    enemy.windup = {
      kind: "snipe",
      time: windupTime,
      duration: windupTime,
      x: predicted.x,
      y: predicted.y
    };
    addEffect(room, "warning", predicted.x, predicted.y, {
      color: profile.color,
      radius: 44,
      style: "sniper_lock",
      duration: windupTime
    });
    setSpecialPatternTimer(enemy, "miniboss_shot", 2.95 * getSpecialPatternCooldownMultiplier(enemy, "miniboss_shot"));
    return true;
  }

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "miniboss")) return false;
    enemy.bossCycle = (enemy.bossCycle || 0) + 1;
    if (dist < 245 || enemy.bossCycle % 3 === 1) {
      bossShockwave(room, enemy, profile, 150, { armTime: 0.7 });
    } else if (enemy.bossCycle % 3 === 2) {
      castBossBlasts(room, enemy, profile, 1, {
        radiusMul: 0.72,
        armTimeMul: 1
      });
    } else {
      castBossBeamFan(room, enemy, profile, 2, Math.atan2(target.y - enemy.y, target.x - enemy.x));
    }
    setSpecialPatternTimer(enemy, "miniboss", 2.95 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
  }

  return false;
}

function updateDuelistMiniBoss(room, enemy, target, dist, dt, profile) {
  const cleaveWindup = advanceEnemyWindup(enemy, "mini_cleave", dt);
  if (cleaveWindup.active) {
    if (cleaveWindup.ready) {
      performMiniCleave(room, enemy, cleaveWindup.windup, profile);
      enemy.attackTimer = 1.05 * (enemy.cadenceMul || 1);
    }
    return true;
  }

  if (advanceChargeWindup(room, enemy, dt)) return true;

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "miniboss")) return false;
    const pattern = nextBossPattern(enemy, profile, ["duelist_cross", "duelist_charge", "duelist_cleave"]);
    if (pattern === "duelist_cross") {
      castBossCrossBeams(room, enemy, profile, 4, {
        armTime: 1.32,
        width: 30,
        damageMul: 0.52,
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 4,
        style: "mini_duelist_cross"
      });
    } else if (pattern === "duelist_charge" && dist > 130) {
      startChargeWindup(room, enemy, target, {
        windupTime: 0.7,
        radius: 88,
        style: "boss_charge",
        color: profile.color,
        accuracyBonus: 0.08
      });
    } else if (pattern === "duelist_blade_fan") {
      castBossBeamFan(room, enemy, profile, 3, Math.atan2(target.y - enemy.y, target.x - enemy.x), {
        spread: 0.92,
        armTime: 1.32,
        length: 720,
        width: 26,
        damageMul: 0.48,
        style: "mini_duelist_blade_fan"
      });
    } else if (pattern === "duelist_guard_break") {
      castBossGapBloom(room, enemy, profile, target, {
        count: 6,
        ring: 205,
        radius: 58,
        armTime: 1.42,
        damageMul: 0.48,
        style: "mini_duelist_guard_break"
      });
    } else if (pattern === "duelist_pinwheel") {
      startBossSpiralBarrage(room, enemy, profile, {
        delay: 0.46,
        waves: 5,
        count: 10,
        gapSize: 2,
        waveInterval: 0.3,
        speed: 430,
        damageMul: 0.18,
        rotationStep: 0.42,
        style: "mini_duelist_blade",
        damageType: "mini_duelist_pinwheel"
      });
    } else if (pattern === "duelist_pincer") {
      castBossBeamFan(room, enemy, profile, 4, Math.atan2(target.y - enemy.y, target.x - enemy.x), {
        spread: 2.45,
        armTime: 1.16,
        length: 780,
        width: 25,
        damageMul: 0.44,
        style: "mini_duelist_pincer"
      });
      bossShockwave(room, enemy, profile, 178, { armTime: 1.08, damageMul: 0.4, knockback: 52 });
    } else {
      startMiniCleave(room, enemy, target, profile, 142, 0.45);
    }
    setSpecialPatternTimer(enemy, "miniboss", 2.48 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    return true;
  }

  if (enemy.attackTimer <= 0 && dist <= enemy.radius + getPlayerCollisionRadius(target) + 94) {
    startMiniCleave(room, enemy, target, profile, 132, 0.38);
    return true;
  }
  return false;
}

function updatePlagueMiniBoss(room, enemy, target, dist, dt, profile) {
  if (enemy.specialTimer > 0) return false;
  if (!allowSpecialPatternNow(enemy, "miniboss")) return false;
  const pattern = nextBossPattern(enemy, profile, ["plague_pool", "plague_spit_ring", "plague_barrier_burst"]);

  if (pattern === "plague_pool") {
    castBossAcidPools(room, enemy, profile, target, 3, {
      radius: 86,
      armTime: 1.16,
      poolTime: 3.25,
      damageMul: 0.14,
      poison: 1.25 + room.wave * 0.08
    });
  } else if (pattern === "plague_spit_ring") {
    startBossProjectileVolley(room, enemy, null, profile, {
      shape: "ring",
      armTime: 1.05,
      count: 10,
      speed: 330,
      damageMul: 0.42,
      radius: 8,
      poison: 1.15 + room.wave * 0.07,
      poisonDuration: 2.2,
      style: "venom_spit",
      damageType: "mini_plague_spit"
    });
  } else if (pattern === "plague_safe_bloom") {
    castBossGapBloom(room, enemy, profile, target, {
      count: 7,
      ring: 245,
      radius: 68,
      armTime: 1.48,
      damageMul: 0.48,
      style: "mini_plague_safe_bloom"
    });
  } else if (pattern === "plague_venom_fan") {
    startBossProjectileVolley(room, enemy, target, profile, {
      armTime: 1.02,
      count: 5,
      spread: 0.78,
      range: 620,
      speed: 390,
      damageMul: 0.4,
      radius: 8,
      poison: 1.15 + room.wave * 0.07,
      poisonDuration: 2.2,
      style: "venom_spit",
      damageType: "mini_plague_spit"
    });
  } else if (pattern === "plague_spore_clock") {
    startBossSpiralBarrage(room, enemy, profile, {
      delay: 0.5,
      waves: 6,
      count: 12,
      gapSize: 2,
      waveInterval: 0.34,
      speed: 345,
      damageMul: 0.13,
      rotationStep: -0.36,
      poison: 0.8 + room.wave * 0.04,
      poisonDuration: 1.8,
      style: "hive_spore_bolt",
      damageType: "mini_plague_spore_clock"
    });
  } else if (pattern === "plague_quarantine") {
    castBossGapBloom(room, enemy, profile, target, {
      count: 8,
      ring: 265,
      radius: 62,
      armTime: 1.3,
      damageMul: 0.42,
      style: "mini_plague_quarantine"
    });
    castBossAcidPools(room, enemy, profile, target, 2, {
      radius: 74,
      armTime: 1.08,
      poolTime: 2.8,
      damageMul: 0.12,
      poison: 1.1 + room.wave * 0.06
    });
  } else {
    enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * 0.075));
    enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 3.8);
    castBossBlasts(room, enemy, profile, 2, { armTimeMul: 1.08, radiusMul: 0.72 });
    addEffect(room, "shield", enemy.x, enemy.y, { color: profile.color, radius: enemy.radius + 38, style: "enemy_barrier" });
  }

  setSpecialPatternTimer(enemy, "miniboss", 2.72 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
  return true;
}

function updateHunterMiniBoss(room, enemy, target, dist, dt, profile) {
  const shadowStabWindup = advanceEnemyWindup(enemy, "mini_shadow_stab", dt);
  if (shadowStabWindup.active) {
    if (shadowStabWindup.ready) {
      performMiniShadowStab(room, enemy, shadowStabWindup.windup, target, profile);
      enemy.specialTimer = 1.55 * (enemy.cadenceMul || 1);
    }
    return true;
  }

  if (advanceBossSnipeWindup(room, enemy, dt, (cast) => {
      fireSniperProjectile(room, enemy, cast.x, cast.y);
      enemy.shotTimer = 2.15 * (enemy.cadenceMul || 1);
    })) return true;

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "miniboss")) return false;
    const pattern = nextBossPattern(enemy, profile, ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe"]);
    if (pattern === "hunter_shadow_stab" && dist < 620) {
      startMiniShadowStab(room, enemy, target, profile);
    } else if (pattern === "hunter_shuriken_fan") {
      startBossProjectileVolley(room, enemy, target, profile, {
        armTime: 0.82,
        count: 5,
        spread: 0.96,
        range: 540,
        speed: 560,
        damageMul: 0.52,
        radius: 5,
        style: "stalker_shuriken",
        damageType: "mini_shuriken"
      });
      setSpecialPatternTimer(enemy, "miniboss", 2.4 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    } else if (pattern === "hunter_crossfire") {
      castBossBeamFan(room, enemy, profile, 3, Math.atan2(target.y - enemy.y, target.x - enemy.x), {
        spread: 0.72,
        armTime: 1.35,
        length: 860,
        width: 24,
        damageMul: 0.5,
        style: "mini_hunter_crossfire"
      });
      setSpecialPatternTimer(enemy, "miniboss", 2.62 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    } else if (pattern === "hunter_marked_blast") {
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 2 ? 2 : 1, { armTimeMul: 1.2, radiusMul: 0.7 });
      setSpecialPatternTimer(enemy, "miniboss", 2.56 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    } else if (pattern === "hunter_blink_ring") {
      repositionVoidBoss(room, enemy, target, profile);
      startBossProjectileVolley(room, enemy, null, profile, {
        shape: "ring",
        armTime: 0.82,
        count: 12,
        speed: 500,
        damageMul: 0.38,
        radius: 6,
        style: "stalker_shuriken",
        damageType: "mini_hunter_blink_ring"
      });
      setSpecialPatternTimer(enemy, "miniboss", 2.48 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    } else if (pattern === "hunter_ricochet") {
      castBossCrossBeams(room, enemy, profile, 5, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 5,
        armTime: 1.12,
        width: 22,
        damageMul: 0.42,
        style: "mini_hunter_ricochet"
      });
      startBossProjectileVolley(room, enemy, target, profile, {
        armTime: 0.74,
        count: 4,
        spread: 0.58,
        range: 760,
        speed: 640,
        damageMul: 0.42,
        radius: 5,
        style: "stalker_shuriken",
        damageType: "mini_hunter_ricochet"
      });
      setSpecialPatternTimer(enemy, "miniboss", 2.62 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
    } else {
      const windupTime = getEnemyTelegraphTime(room, enemy, "special", 0.92) * Math.max(0.95, enemy.cadenceMul || 1);
      const predicted = predictPlayerPosition(room, enemy, target, 760, windupTime, getEnemyAimAccuracy(room, enemy) * 0.92);
      enemy.windup = {
        kind: "snipe",
        time: windupTime,
        duration: windupTime,
        x: predicted.x,
        y: predicted.y
      };
      addEffect(room, "warning", predicted.x, predicted.y, {
        color: profile.color,
        radius: 40,
        style: "sniper_lock",
        duration: windupTime
      });
    }
    return true;
  }
  return false;
}

function startMiniCleave(room, enemy, target, profile, radius, windupTime) {
  const dir = normalizeVector(target.x - enemy.x, target.y - enemy.y);
  const angle = Math.atan2(dir.y, dir.x);
  const telegraphTime = getEnemyTelegraphTime(room, enemy, "primary", windupTime);
  enemy.windup = {
    kind: "mini_cleave",
    time: telegraphTime,
    duration: telegraphTime,
    dirX: round2(dir.x),
    dirY: round2(dir.y),
    angle: round2(angle),
    radius
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius,
    angle: round2(angle),
    style: "brute_swing",
    duration: telegraphTime
  });
}

function performMiniCleave(room, enemy, cast, profile) {
  const dir = normalizeVector(Number(cast.dirX) || 1, Number(cast.dirY) || 0);
  const angle = Number.isFinite(cast.angle) ? cast.angle : Math.atan2(dir.y, dir.x);
  const radius = cast.radius || 138;
  moveEnemyBy(room, enemy, dir.x * 18, dir.y * 18);
  addEffect(room, "slash", enemy.x + dir.x * radius * 0.42, enemy.y + dir.y * radius * 0.42, {
    color: profile.color,
    angle: round2(angle),
    radius: radius * 1.05,
    style: "brute_swing"
  });

  for (const player of getActiveLivingPlayers(room)) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const playerDistance = Math.hypot(dx, dy) || 1;
    const dot = (dx / playerDistance) * dir.x + (dy / playerDistance) * dir.y;
    if (playerDistance > radius + getPlayerCollisionRadius(player) || dot <= 0.04) continue;
    damagePlayer(room, player, enemy.damage * 1.05, enemy.id, player.x, player.y, {
      damageType: "mini_cleave",
      knockbackDirX: dir.x,
      knockbackDirY: dir.y
    });
  }
}

function startMiniShadowStab(room, enemy, target, profile) {
  const dir = normalizeVector(enemy.x - target.x, enemy.y - target.y);
  const x = clamp(target.x + dir.x * 58, 52, room.world.w - 52);
  const y = clamp(target.y + dir.y * 58, 52, room.world.h - 52);
  const windupTime = getEnemyTelegraphTime(room, enemy, "primary", 0.62) * Math.max(0.95, enemy.cadenceMul || 1);
  enemy.windup = {
    kind: "mini_shadow_stab",
    time: windupTime,
    duration: windupTime,
    x,
    y,
    targetId: target.id
  };
  addEffect(room, "warning", target.x, target.y, {
    color: profile.color,
    radius: 86,
    style: "stalker_stab",
    angle: Math.atan2(target.y - enemy.y, target.x - enemy.x),
    duration: windupTime
  });
}

function performMiniShadowStab(room, enemy, cast, fallbackTarget, profile) {
  const target = room.players.get(cast.targetId) || fallbackTarget;
  const spot = findFreeEnemySpawnPosition(room, cast.x || enemy.x, cast.y || enemy.y, enemy.radius);
  const fromX = enemy.x;
  const fromY = enemy.y;
  enemy.x = spot.x;
  enemy.y = spot.y;
  addEffect(room, "dash", (fromX + enemy.x) / 2, (fromY + enemy.y) / 2, {
    color: profile.color,
    fromX: round2(fromX),
    fromY: round2(fromY),
    toX: round2(enemy.x),
    toY: round2(enemy.y),
    radius: 120,
    style: "stalker_shadow"
  });
  if (!target) return;
  const dir = normalizeVector(target.x - enemy.x, target.y - enemy.y);
  const endX = enemy.x + dir.x * 150;
  const endY = enemy.y + dir.y * 150;
  addEffect(room, "slash", enemy.x + dir.x * 68, enemy.y + dir.y * 68, {
    color: profile.color,
    angle: Math.atan2(dir.y, dir.x),
    radius: 118,
    style: "stalker_stab"
  });
  damagePlayersOnSegment(room, enemy, enemy.x, enemy.y, endX, endY, 54, enemy.damage * 1.08, {
    damageType: "mini_shadow_stab"
  });
}

function castMiniShurikenFan(room, enemy, target, profile) {
  const baseAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  const spread = 0.48;
  for (const offset of [-spread, -spread * 0.5, 0, spread * 0.5, spread]) {
    fireEnemyProjectileAtAngle(room, enemy, baseAngle + offset, {
      speed: 560,
      damageMul: 0.52,
      radius: 5,
      style: "stalker_shuriken",
      damageType: "mini_shuriken",
      distanceLeft: 520
    });
  }
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: 430,
    angle: baseAngle,
    spread,
    style: "stalker_shuriken",
    duration: 0.34
  });
}

function updateChargeBoss(room, enemy, target, dist, dt, profile) {
  if (advanceChargeWindup(room, enemy, dt)) return true;

  if (enemy.chargeTimer <= 0 && dist < 860) {
    if (!allowSpecialPatternNow(enemy, "boss_charge")) return false;
    startChargeWindup(room, enemy, target, {
      windupTime: enemy.bossPhase >= 3 ? 0.84 : enemy.bossPhase >= 2 ? 0.96 : 1.1,
      radius: enemy.bossPhase >= 3 ? 138 : 124,
      style: "boss_charge",
      color: profile.color,
      accuracyBonus: enemy.bossPhase >= 3 ? 0.24 : 0.16,
      chainCount: enemy.bossPhase >= 3 ? 2 : enemy.bossPhase >= 2 ? 1 : 0
    });
    return true;
  }

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "boss")) return false;
    const pattern = nextBossPattern(enemy, profile, ["iron_cross_shock", "iron_beam_fan", "iron_ground_break"]);
    if (pattern === "iron_furnace_refuge") {
      castBossFieldJudgment(room, enemy, profile, target, {
        armTime: enemy.bossPhase >= 3 ? 2.75 : 3.05,
        safeRadius: enemy.bossPhase >= 3 ? 128 : 142,
        safeCount: Math.min(2, Math.max(1, getActiveLivingPlayers(room).length)),
        style: "iron_furnace_refuge"
      });
      startBossSpiralBarrage(room, enemy, profile, {
        delay: 0.7,
        waves: enemy.bossPhase >= 3 ? 8 : 6,
        count: enemy.bossPhase >= 3 ? 18 : 14,
        gapSize: 3,
        waveInterval: 0.38,
        speed: enemy.bossPhase >= 3 ? 430 : 380,
        damageMul: 0.18,
        rotationStep: 0.31,
        style: "iron_furnace_shard",
        damageType: "iron_furnace_barrage"
      });
    } else if (pattern === "iron_cross_shock") {
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 8 : enemy.bossPhase >= 2 ? 6 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x),
        armTime: enemy.bossPhase >= 3 ? 1.08 : 1.24,
        width: enemy.bossPhase >= 3 ? 44 : 38,
        damageMul: enemy.bossPhase >= 3 ? 0.82 : 0.7,
        style: "iron_cross"
      });
      bossShockwave(room, enemy, profile, enemy.bossPhase >= 3 ? 260 : 215, {
        armTime: enemy.bossPhase >= 3 ? 1.72 : 1.92
      });
    } else if (pattern === "iron_beam_fan") {
      castBossBeamFan(room, enemy, profile, enemy.bossPhase >= 3 ? 5 : 3, Math.atan2(target.y - enemy.y, target.x - enemy.x));
    } else if (pattern === "iron_ground_break") {
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : enemy.bossPhase >= 2 ? 5 : 4, {
        aroundBoss: true,
        radiusMul: enemy.bossPhase >= 3 ? 0.9 : 0.78,
        armTimeMul: 1.12
      });
      enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 1.75 * (enemy.cadenceMul || 1));
    } else if (pattern === "iron_sweeping_arc") {
      castBossBeamFan(room, enemy, profile, enemy.bossPhase >= 3 ? 5 : 4, Math.atan2(target.y - enemy.y, target.x - enemy.x), {
        spread: enemy.bossPhase >= 3 ? 2.35 : 1.85,
        armTime: enemy.bossPhase >= 3 ? 1.42 : 1.58,
        width: enemy.bossPhase >= 3 ? 40 : 34,
        damageMul: enemy.bossPhase >= 3 ? 0.78 : 0.68,
        style: "iron_sweeping_arc"
      });
    } else if (pattern === "iron_anvil_corridor") {
      castBossFieldJudgment(room, enemy, profile, target, {
        armTime: enemy.bossPhase >= 3 ? 2.18 : 2.42,
        safeRadius: enemy.bossPhase >= 3 ? 122 : 136,
        safeCount: 1,
        style: "iron_anvil_corridor"
      });
      startChargeWindup(room, enemy, target, {
        windupTime: enemy.bossPhase >= 3 ? 0.58 : 0.68,
        radius: enemy.bossPhase >= 3 ? 148 : 134,
        style: "iron_anvil_charge",
        color: profile.color,
        accuracyBonus: 0.24,
        chainCount: enemy.bossPhase >= 3 ? 2 : 1
      });
    } else if (pattern === "iron_rotor_barrage") {
      startBossSpiralBarrage(room, enemy, profile, {
        delay: 0.48,
        waves: enemy.bossPhase >= 3 ? 9 : 7,
        count: enemy.bossPhase >= 3 ? 18 : 14,
        gapSize: 3,
        waveInterval: enemy.bossPhase >= 3 ? 0.27 : 0.32,
        speed: enemy.bossPhase >= 3 ? 470 : 420,
        damageMul: 0.17,
        rotationStep: 0.38,
        style: "iron_rotor_shard",
        damageType: "iron_rotor_barrage"
      });
      bossShockwave(room, enemy, profile, enemy.bossPhase >= 3 ? 285 : 245, {
        armTime: enemy.bossPhase >= 3 ? 1.08 : 1.22,
        damageMul: 0.54,
        knockback: 72
      });
    } else {
      castBossGapBloom(room, enemy, profile, target, {
        count: enemy.bossPhase >= 3 ? 9 : 7,
        ring: enemy.bossPhase >= 3 ? 330 : 285,
        radius: enemy.bossPhase >= 3 ? 84 : 76,
        armTime: enemy.bossPhase >= 3 ? 1.55 : 1.7,
        damageMul: enemy.bossPhase >= 3 ? 0.68 : 0.58,
        style: "iron_fortress_gap"
      });
    }
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 1.4 * (enemy.cadenceMul || 1));
    setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 2.95 : enemy.bossPhase >= 2 ? 3.32 : 3.7) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
  }
  return false;
}

function updateRitualBoss(room, enemy, target, dist, dt, profile) {
  if (enemy.specialTimer > 0) return false;
  if (!allowSpecialPatternNow(enemy, "boss")) return false;
  const pattern = nextBossPattern(enemy, profile, ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"]);
  if (pattern === "hive_spore_maelstrom") {
    startBossSpiralBarrage(room, enemy, profile, {
      delay: 0.65,
      waves: enemy.bossPhase >= 3 ? 10 : 7,
      count: enemy.bossPhase >= 3 ? 20 : 16,
      gapSize: enemy.bossPhase >= 3 ? 3 : 2,
      waveInterval: enemy.bossPhase >= 3 ? 0.3 : 0.38,
      speed: enemy.bossPhase >= 3 ? 400 : 350,
      damageMul: 0.16,
      rotationStep: -0.29,
      poison: 0.75 + room.wave * 0.04,
      poisonDuration: 1.6,
      style: "hive_spore_bolt",
      damageType: "hive_spore_maelstrom"
    });
  } else if (pattern === "hive_bloom_adds") {
    enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * (enemy.bossPhase >= 3 ? 0.07 : 0.05)));
    enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 4.2);
    const heal = Math.min(enemy.maxHp - enemy.hp, enemy.maxHp * (enemy.bossPhase >= 3 ? 0.018 : 0.012));
    if (heal > 0) {
      enemy.hp += heal;
      addEffect(room, "heal", enemy.x, enemy.y, { value: Math.round(heal), color: profile.color, radius: enemy.radius + 36 });
    }
    spawnBossAdds(room, enemy, profile, enemy.bossPhase >= 3 ? 4 : enemy.bossPhase >= 2 ? 3 : 2, enemy.bossPhase >= 3 ? 0.78 : 0.68);
    castBossRitualBloom(room, enemy, profile);
  } else if (pattern === "hive_acid_ring") {
    castBossAcidPools(room, enemy, profile, target, enemy.bossPhase >= 3 ? 5 : enemy.bossPhase >= 2 ? 4 : 3, {
      radius: enemy.bossPhase >= 3 ? 102 : 92,
      armTime: enemy.bossPhase >= 3 ? 1.08 : 1.22,
      poolTime: enemy.bossPhase >= 3 ? 3.8 : 3.4,
      damageMul: enemy.bossPhase >= 3 ? 0.17 : 0.14,
      poison: 1.35 + room.wave * 0.09,
      damageType: "hive_acid_pool"
    });
  } else if (pattern === "hive_ritual_cross") {
    enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * 0.045));
    enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 3.8);
    castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 4 : enemy.bossPhase >= 2 ? 3 : 2, { armTimeMul: 1.08, radiusMul: 0.84 });
    if (enemy.bossPhase >= 2) {
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 5 : 4, {
        rotation: enemy.aiPhase + enemy.bossCycle * 0.41,
        armTime: 1.24,
        width: 34,
        damageMul: 0.58,
        style: "hive_ritual_cross"
      });
    }
  } else if (pattern === "hive_safe_bloom") {
    castBossGapBloom(room, enemy, profile, target, {
      count: enemy.bossPhase >= 3 ? 9 : 8,
      ring: enemy.bossPhase >= 3 ? 345 : 305,
      radius: enemy.bossPhase >= 3 ? 88 : 80,
      armTime: enemy.bossPhase >= 3 ? 1.52 : 1.68,
      damageMul: enemy.bossPhase >= 3 ? 0.64 : 0.54,
      style: "hive_safe_bloom"
    });
  } else if (pattern === "hive_quarantine") {
    castBossFieldJudgment(room, enemy, profile, target, {
      armTime: enemy.bossPhase >= 3 ? 2.35 : 2.62,
      safeRadius: enemy.bossPhase >= 3 ? 116 : 132,
      safeCount: Math.min(2, Math.max(1, getActiveLivingPlayers(room).length)),
      style: "hive_quarantine"
    });
    castBossProjectileRing(room, enemy, profile, enemy.bossPhase >= 3 ? 16 : 12, {
      speed: enemy.bossPhase >= 3 ? 430 : 380,
      damageMul: 0.3,
      radius: 7,
      poison: 1.05 + room.wave * 0.06,
      poisonDuration: 2,
      style: "hive_spore_bolt",
      damageType: "hive_quarantine_ring",
      distanceLeft: 920
    });
  } else if (pattern === "hive_creeping_orbit") {
    startBossSpiralBarrage(room, enemy, profile, {
      delay: 0.48,
      waves: enemy.bossPhase >= 3 ? 11 : 8,
      count: enemy.bossPhase >= 3 ? 22 : 18,
      gapSize: 3,
      waveInterval: enemy.bossPhase >= 3 ? 0.26 : 0.32,
      speed: enemy.bossPhase >= 3 ? 420 : 370,
      damageMul: 0.14,
      rotationStep: -0.34,
      poison: 0.72 + room.wave * 0.04,
      poisonDuration: 1.6,
      style: "hive_spore_bolt",
      damageType: "hive_creeping_orbit"
    });
    castBossAcidPools(room, enemy, profile, target, enemy.bossPhase >= 3 ? 4 : 3, {
      radius: enemy.bossPhase >= 3 ? 92 : 82,
      armTime: enemy.bossPhase >= 3 ? 0.98 : 1.1,
      poolTime: 3.1,
      damageMul: 0.12,
      poison: 1.2 + room.wave * 0.07
    });
  } else {
    startBossProjectileVolley(room, enemy, target, profile, {
      armTime: 1.08,
      count: enemy.bossPhase >= 3 ? 7 : 5,
      spread: enemy.bossPhase >= 3 ? 1.18 : 0.9,
      range: 720,
      speed: enemy.bossPhase >= 3 ? 430 : 390,
      damageMul: 0.42,
      radius: 8,
      poison: 1.15 + room.wave * 0.07,
      poisonDuration: 2.3,
      style: "venom_spit",
      damageType: "hive_venom_ring"
    });
  }
  setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 3.12 : enemy.bossPhase >= 2 ? 3.5 : 3.88) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
  return false;
}

function updateVoidBoss(room, enemy, target, dist, dt, profile) {
  if (advanceBossSnipeWindup(room, enemy, dt, (cast) => {
      fireSniperProjectile(room, enemy, cast.x, cast.y);
    })) return true;

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "boss")) return false;
    const pattern = nextBossPattern(enemy, profile, ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"]);
    if (pattern === "void_final_eclipse") {
      castBossFieldJudgment(room, enemy, profile, target, {
        armTime: enemy.bossPhase >= 3 ? 2.65 : 3,
        safeRadius: enemy.bossPhase >= 3 ? 116 : 132,
        safeCount: Math.min(2, Math.max(1, getActiveLivingPlayers(room).length)),
        style: "void_final_eclipse"
      });
    } else if (pattern === "void_reposition_snipe") {
      repositionVoidBoss(room, enemy, target, profile);
      startBossProjectileVolley(room, enemy, target, profile, {
        armTime: 1.05,
        count: enemy.bossPhase >= 3 ? 5 : 3,
        spread: enemy.bossPhase >= 3 ? 0.5 : 0.34,
        range: 980,
        speed: enemy.bossPhase >= 3 ? 860 : 790,
        damageMul: enemy.bossPhase >= 3 ? 0.68 : 0.58,
        radius: 7,
        style: "sniper_bolt",
        damageType: "void_split_shot"
      });
    } else if (pattern === "void_cross_laser") {
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : enemy.bossPhase >= 2 ? 5 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 4,
        armTime: enemy.bossPhase >= 3 ? 1.04 : 1.22,
        width: enemy.bossPhase >= 3 ? 46 : 38,
        damageMul: enemy.bossPhase >= 3 ? 0.78 : 0.66,
        style: "void_cross"
      });
    } else if (pattern === "void_orb_ring") {
      startBossProjectileVolley(room, enemy, null, profile, {
        shape: "ring",
        armTime: 1.08,
        count: enemy.bossPhase >= 3 ? 12 : 8,
        speed: enemy.bossPhase >= 3 ? 460 : 410,
        damageMul: 0.44,
        radius: 7,
        style: "sniper_bolt",
        damageType: "void_ring"
      });
    } else if (pattern === "void_mirror_volley") {
      repositionVoidBoss(room, enemy, target, profile);
      startBossProjectileVolley(room, enemy, target, profile, {
        armTime: 1.12,
        count: enemy.bossPhase >= 3 ? 7 : 5,
        spread: enemy.bossPhase >= 3 ? 1.22 : 0.92,
        range: 900,
        speed: enemy.bossPhase >= 3 ? 740 : 680,
        damageMul: enemy.bossPhase >= 3 ? 0.56 : 0.48,
        radius: 7,
        style: "sniper_bolt",
        damageType: "void_split_shot"
      });
    } else if (pattern === "void_gravity_clock") {
      repositionVoidBoss(room, enemy, target, profile);
      startBossSpiralBarrage(room, enemy, profile, {
        delay: 0.44,
        waves: enemy.bossPhase >= 3 ? 10 : 8,
        count: enemy.bossPhase >= 3 ? 20 : 16,
        gapSize: enemy.bossPhase >= 3 ? 3 : 2,
        waveInterval: enemy.bossPhase >= 3 ? 0.25 : 0.3,
        speed: enemy.bossPhase >= 3 ? 490 : 435,
        damageMul: 0.16,
        rotationStep: 0.4,
        style: "void_clock_bolt",
        damageType: "void_gravity_clock"
      });
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 6,
        armTime: enemy.bossPhase >= 3 ? 0.94 : 1.08,
        width: enemy.bossPhase >= 3 ? 38 : 32,
        damageMul: 0.54,
        style: "void_gravity_clock"
      });
    } else if (pattern === "void_starless_trial") {
      castBossFieldJudgment(room, enemy, profile, target, {
        armTime: enemy.bossPhase >= 3 ? 2.28 : 2.52,
        safeRadius: enemy.bossPhase >= 3 ? 108 : 124,
        safeCount: 1,
        style: "void_starless_trial"
      });
      castBossGapBloom(room, enemy, profile, target, {
        count: enemy.bossPhase >= 3 ? 11 : 9,
        ring: enemy.bossPhase >= 3 ? 410 : 365,
        radius: enemy.bossPhase >= 3 ? 88 : 80,
        armTime: enemy.bossPhase >= 3 ? 1.22 : 1.38,
        damageMul: enemy.bossPhase >= 3 ? 0.62 : 0.52,
        style: "void_starless_seal"
      });
    } else {
      castBossGapBloom(room, enemy, profile, target, {
        count: enemy.bossPhase >= 3 ? 10 : 8,
        ring: enemy.bossPhase >= 3 ? 390 : 340,
        radius: enemy.bossPhase >= 3 ? 92 : 82,
        armTime: enemy.bossPhase >= 3 ? 1.5 : 1.68,
        damageMul: enemy.bossPhase >= 3 ? 0.7 : 0.58,
        style: "void_collapse"
      });
    }
    enemy.shotTimer = Math.max(enemy.shotTimer || 0, 1.65 * (enemy.cadenceMul || 1));
    setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 3.02 : enemy.bossPhase >= 2 ? 3.36 : 3.74) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
  }

  if (enemy.shotTimer <= 0 && dist > 130 && dist < 920) {
    if (!allowSpecialPatternNow(enemy, "boss_shot")) return false;
    const snipeTime = getEnemyTelegraphTime(room, enemy, "special", enemy.bossPhase >= 3 ? 0.88 : enemy.bossPhase >= 2 ? 1.02 : 1.16);
    const predicted = predictPlayerPosition(room, enemy, target, enemy.bossPhase >= 2 ? 840 : 740, snipeTime, getEnemyAimAccuracy(room, enemy) * 0.96);
    enemy.windup = {
      kind: "snipe",
      time: snipeTime,
      duration: snipeTime,
      x: predicted.x,
      y: predicted.y
    };
    setSpecialPatternTimer(enemy, "boss_shot", (enemy.bossPhase >= 3 ? 2.68 : enemy.bossPhase >= 2 ? 2.96 : 3.24) * getSpecialPatternCooldownMultiplier(enemy, "boss_shot"));
    return true;
  }
  return false;
}

function bossShockwave(room, enemy, profile, radius, options = {}) {
  const damageMul = Number.isFinite(options.damageMul)
    ? options.damageMul
    : enemy.miniBoss
      ? 0.58
      : enemy.bossPhase >= 3
        ? 0.78
        : 0.68;
  const push = Number.isFinite(options.knockback)
    ? options.knockback
    : enemy.miniBoss
      ? 58
      : enemy.bossPhase >= 3
        ? 88
        : enemy.bossPhase >= 2
          ? 76
          : 66;
  const armTime = Math.max(0, Number(options.armTime) || 0);
  if (armTime > 0) {
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_shockwave",
      ownerId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      radius,
      timer: armTime + 0.12,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * damageMul,
      knockback: push,
      hostile: true,
      dead: false,
      color: profile.color
    });
    return;
  }

  addEffect(room, "explosion", enemy.x, enemy.y, { color: profile.color, radius, style: "boss_shockwave" });
  for (const player of getActiveLivingPlayers(room)) {
    if (distance(enemy, player) > radius + getPlayerCollisionRadius(player)) continue;
    damagePlayer(room, player, enemy.damage * damageMul, enemy.id, player.x, player.y, {
      damageType: "boss_shockwave",
      knockback: push,
      knockbackOrigin: { x: enemy.x, y: enemy.y }
    });
  }
}

function castBossCrossBeams(room, enemy, profile, count = 4, options = {}) {
  const beams = Math.max(2, count);
  const rotation = Number.isFinite(options.rotation) ? options.rotation : enemy.aiPhase || 0;
  const requestedArmTime = options.armTime || (enemy.bossPhase >= 3 ? 1.08 : 1.24);
  const minArmTime = enemy.executionBoss
    ? enemy.bossPhase >= 4
      ? 0.7
      : enemy.bossPhase >= 3
        ? 0.8
        : 0.9
    : enemy.miniBoss
      ? 1.08
      : enemy.bossPhase >= 3
        ? 0.9
        : enemy.bossPhase >= 2
          ? 1
          : 1.12;
  const armTime = Math.max(requestedArmTime, minArmTime);
  const length = options.length || Math.max(room.world.w, room.world.h) * 1.08;
  const width = options.width || (enemy.bossPhase >= 3 ? 46 : 38);
  const damageMul = options.damageMul || 0.7;
  for (let i = 0; i < beams; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / beams;
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_beam",
      ownerId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      angle,
      length,
      width,
      radius: length,
      timer: armTime,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * damageMul,
      hostile: true,
      dead: false,
      color: profile.color
    });
  }
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + 105,
    style: options.style || "boss_beam"
  });
}

function castBossProjectileRing(room, enemy, profile, count = 10, options = {}) {
  const shots = Math.max(4, count);
  const rotation = Number.isFinite(options.rotation) ? options.rotation : enemy.aiPhase + Date.now() * 0.0007;
  for (let i = 0; i < shots; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / shots;
    fireEnemyProjectileAtAngle(room, enemy, angle, {
      speed: options.speed || 390,
      damageMul: options.damageMul || 0.48,
      radius: options.radius || 8,
      poison: options.poison || 0,
      poisonDuration: options.poisonDuration || 0,
      style: options.style || "spit",
      damageType: options.damageType || "boss_projectile_ring",
      distanceLeft: options.distanceLeft || 680
    });
  }
  addEffect(room, "shot", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + 58,
    style: options.style || "boss_projectile_ring"
  });
}

function startBossSpiralBarrage(room, enemy, profile, options = {}) {
  const delay = Math.max(0.35, Number(options.delay) || 0.6);
  const waves = Math.max(3, Math.floor(options.waves || 7));
  const waveInterval = Math.max(0.2, Number(options.waveInterval) || 0.38);
  room.hazards.push({
    id: nextHazardId++,
    type: "boss_spiral_emitter",
    ownerId: enemy.id,
    x: enemy.x,
    y: enemy.y,
    radius: enemy.radius + 72,
    timer: delay + waves * waveInterval + 0.25,
    fireTimer: delay,
    wavesRemaining: waves,
    projectileCount: Math.max(8, Math.floor(options.count || 16)),
    gapSize: Math.max(1, Math.floor(options.gapSize || 2)),
    gapIndex: 0,
    rotation: Number.isFinite(options.rotation) ? options.rotation : enemy.aiPhase + Date.now() * 0.0007,
    rotationStep: Number(options.rotationStep) || 0.28,
    waveInterval,
    projectileSpeed: Number(options.speed) || 390,
    projectileRadius: Number(options.radius) || 6,
    damageMul: Number(options.damageMul) || 0.2,
    poison: Number(options.poison) || 0,
    poisonDuration: Number(options.poisonDuration) || 0,
    projectileStyle: options.style || "boss_spiral_bolt",
    damageType: options.damageType || "boss_spiral_barrage",
    distanceLeft: Number(options.distanceLeft) || Math.max(room.world.w, room.world.h),
    hostile: false,
    dead: false,
    color: profile.color
  });
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + 94,
    style: "boss_spiral_charge",
    duration: delay
  });
}

function castBossFieldJudgment(room, enemy, profile, target, options = {}) {
  const players = getActiveLivingPlayers(room);
  if (!players.length) return;
  const armTime = Math.max(2.4, Number(options.armTime) || 3);
  const safeRadius = Math.max(96, Number(options.safeRadius) || 132);
  const safeCount = clamp(Math.floor(options.safeCount || 1), 1, 2);
  const mechanicId = `boss-judgment-${nextHazardId}`;
  const centroid = players.reduce((point, player) => ({ x: point.x + player.x, y: point.y + player.y }), { x: 0, y: 0 });
  centroid.x /= players.length;
  centroid.y /= players.length;
  const baseAngle = Math.atan2(centroid.y - enemy.y, centroid.x - enemy.x) + Math.PI * 0.44;
  const fieldRadius = Math.hypot(room.world.w, room.world.h);

  room.hazards = room.hazards.filter((hazard) => hazard.ownerId !== enemy.id);
  room.projectiles = room.projectiles.filter((projectile) => projectile.ownerId !== enemy.id);
  enemy.windup = null;
  enemy.chargeMove = null;
  enemy.lethalCastTimer = armTime;
  enemy.lethalCastTimerMax = armTime;
  enemy.lethalCastLabel = "파란 원으로 도망치세요";

  room.hazards.push({
    id: nextHazardId++,
    type: "boss_field_judgment",
    ownerId: enemy.id,
    mechanicId,
    x: room.world.w / 2,
    y: room.world.h / 2,
    radius: fieldRadius,
    timer: armTime + 0.2,
    armTime,
    armTimeMax: armTime,
    hostile: true,
    dead: false,
    color: profile.color,
    style: options.style || "boss_field_judgment"
  });

  for (let i = 0; i < safeCount; i += 1) {
    const angle = baseAngle + (safeCount === 1 ? 0 : (i === 0 ? -0.72 : 0.72));
    const travel = safeCount === 1 ? 235 : 275;
    const desiredX = clamp(centroid.x + Math.cos(angle) * travel, safeRadius + 38, room.world.w - safeRadius - 38);
    const desiredY = clamp(centroid.y + Math.sin(angle) * travel, safeRadius + 38, room.world.h - safeRadius - 38);
    const safePosition = findFreeEnemySpawnPosition(room, desiredX, desiredY, safeRadius);
    const safeX = safePosition.x;
    const safeY = safePosition.y;
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_safe_zone",
      ownerId: enemy.id,
      mechanicId,
      x: safeX,
      y: safeY,
      radius: safeRadius,
      timer: armTime + 0.35,
      armTime,
      armTimeMax: armTime,
      hostile: false,
      dead: false,
      color: "#67e8f9",
      style: options.style || "boss_safe_zone"
    });
    addEffect(room, "warning", safeX, safeY, {
      color: "#67e8f9",
      radius: safeRadius,
      style: "boss_safe_zone",
      duration: armTime
    });
  }
}

function startBossProjectileVolley(room, enemy, target, profile, options = {}) {
  const shape = options.shape === "ring" ? "ring" : "fan";
  const requestedArmTime = Number(options.armTime) || 1.08;
  const minimumArmTime = enemy.executionBoss
    ? enemy.bossPhase >= 4
      ? 0.64
      : enemy.bossPhase >= 3
        ? 0.72
        : 0.82
    : enemy.miniBoss
      ? 0.94
      : enemy.bossPhase >= 3
        ? 0.86
        : enemy.bossPhase >= 2
          ? 0.96
          : 1.08;
  const windupTime = getEnemyTelegraphTime(room, enemy, "special", Math.max(requestedArmTime, minimumArmTime));
  const baseAngle = Number.isFinite(options.angle)
    ? options.angle
    : target
      ? Math.atan2(target.y - enemy.y, target.x - enemy.x)
      : enemy.aiPhase + Date.now() * 0.0007;
  enemy.windup = {
    kind: shape === "ring" ? "boss_ring" : "boss_volley",
    time: windupTime,
    duration: windupTime,
    angle: round2(baseAngle),
    spread: Number(options.spread) || 0,
    range: Number(options.range || options.distanceLeft) || 720,
    count: Math.max(1, Math.floor(options.count || 5)),
    projectileSpeed: Number(options.speed) || 420,
    damageMul: Number(options.damageMul) || 0.48,
    projectileRadius: Number(options.radius) || 8,
    poison: Number(options.poison) || 0,
    poisonDuration: Number(options.poisonDuration) || 0,
    projectileStyle: options.style || "spit",
    damageType: options.damageType || "boss_projectile_volley"
  };
  if (shape === "ring") {
    addEffect(room, "warning", enemy.x, enemy.y, {
      color: profile.color,
      radius: enemy.radius + 78,
      style: "boss_projectile_ring",
      duration: windupTime
    });
  }
  return true;
}

function advanceBossProjectileWindup(room, enemy, dt, profile) {
  const kind = enemy.windup?.kind;
  if (kind !== "boss_volley" && kind !== "boss_ring") return false;
  const volleyWindup = advanceEnemyWindup(enemy, kind, dt);
  if (!volleyWindup.ready) return volleyWindup.active;
  const cast = volleyWindup.windup;
  if (kind === "boss_ring") {
    castBossProjectileRing(room, enemy, profile, cast.count, {
      rotation: cast.angle,
      speed: cast.projectileSpeed,
      damageMul: cast.damageMul,
      radius: cast.projectileRadius,
      poison: cast.poison,
      poisonDuration: cast.poisonDuration,
      style: cast.projectileStyle,
      damageType: cast.damageType,
      distanceLeft: cast.range
    });
    return true;
  }

  const count = Math.max(1, Math.floor(cast.count || 1));
  const spread = Math.max(0, Number(cast.spread) || 0);
  const startAngle = Number(cast.angle || 0) - spread / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = startAngle + (count === 1 ? 0 : (spread * i) / (count - 1));
    fireEnemyProjectileAtAngle(room, enemy, angle, {
      speed: cast.projectileSpeed,
      damageMul: cast.damageMul,
      radius: cast.projectileRadius,
      poison: cast.poison,
      poisonDuration: cast.poisonDuration,
      style: cast.projectileStyle,
      damageType: cast.damageType,
      distanceLeft: cast.range
    });
  }
  addEffect(room, "shot", enemy.x, enemy.y, {
    color: profile.color,
    angle: cast.angle,
    radius: enemy.radius + 52,
    style: cast.projectileStyle
  });
  return true;
}

function castBossGapBloom(room, enemy, profile, target, options = {}) {
  const count = Math.max(5, Math.floor(options.count || 8));
  const ring = Number(options.ring) || 300;
  const radius = Number(options.radius) || 78;
  const requestedArmTime = Number(options.armTime) || 1.58;
  const minimumArmTime = enemy.executionBoss
    ? enemy.bossPhase >= 4
      ? 0.78
      : enemy.bossPhase >= 3
        ? 0.88
        : 0.98
    : enemy.miniBoss
      ? 1.2
      : enemy.bossPhase >= 3
        ? 0.98
        : enemy.bossPhase >= 2
          ? 1.1
          : 1.24;
  const armTime = Math.max(requestedArmTime, minimumArmTime);
  const margin = ring + radius + 18;
  const centerX = margin * 2 <= room.world.w ? clamp(enemy.x, margin, room.world.w - margin) : room.world.w * 0.5;
  const centerY = margin * 2 <= room.world.h ? clamp(enemy.y, margin, room.world.h - margin) : room.world.h * 0.5;
  const safeAngle = target ? Math.atan2(target.y - centerY, target.x - centerX) : enemy.aiPhase || 0;

  for (let i = 1; i < count; i += 1) {
    const angle = safeAngle + (Math.PI * 2 * i) / count;
    const x = clamp(centerX + Math.cos(angle) * ring, radius + 18, room.world.w - radius - 18);
    const y = clamp(centerY + Math.sin(angle) * ring, radius + 18, room.world.h - radius - 18);
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_blast",
      x,
      y,
      radius,
      timer: armTime,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * (Number(options.damageMul) || 0.58),
      ownerId: enemy.id,
      hostile: true,
      dead: false,
      color: profile.color
    });
    addEffect(room, "warning", x, y, {
      color: profile.color,
      radius,
      style: options.style || "boss_gap_bloom",
      duration: armTime
    });
  }
}

function castBossAcidPools(room, enemy, profile, target, count = 3, options = {}) {
  const players = getActiveLivingPlayers(room);
  const targets = players.length ? players : target ? [target] : [];
  if (!targets.length) return;
  for (let i = 0; i < count; i += 1) {
    const chosen = targets[i % targets.length];
    const armTime = options.armTime || 1.2;
    const predicted = predictPlayerPosition(room, enemy, chosen, 420, armTime, getEnemyAimAccuracy(room, enemy) * 0.72);
    const radius = options.radius || 92;
    const spread = 52 + i * 12;
    const angle = enemy.aiPhase + i * 2.1;
    const x = clamp(predicted.x + Math.cos(angle) * spread * 0.35, 64, room.world.w - 64);
    const y = clamp(predicted.y + Math.sin(angle) * spread * 0.35, 64, room.world.h - 64);
    room.hazards.push({
      id: nextHazardId++,
      type: "acid_pool",
      x,
      y,
      radius,
      timer: armTime + (options.poolTime || 3.4),
      armTime,
      armTimeMax: armTime,
      tick: armTime + 0.34,
      damage: enemy.damage * (options.damageMul || 0.16),
      poison: options.poison || 1.2,
      ownerId: enemy.id,
      damageType: options.damageType || "acid_pool",
      hostile: true,
      dead: false,
      color: profile.color
    });
    addEffect(room, "warning", x, y, {
      color: profile.color,
      radius,
      style: "mortar_zone",
      duration: armTime
    });
  }
}

function castVoidSniperFan(room, enemy, target, profile, count = 3) {
  const baseAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  const spread = count >= 5 ? 0.5 : 0.34;
  const start = baseAngle - spread / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = start + (count === 1 ? 0 : (spread * i) / (count - 1));
    fireEnemyProjectileAtAngle(room, enemy, angle, {
      speed: enemy.bossPhase >= 3 ? 860 : 790,
      damageMul: enemy.bossPhase >= 3 ? 0.68 : 0.58,
      radius: 7,
      style: "sniper_bolt",
      damageType: "void_split_shot",
      distanceLeft: 980
    });
  }
  addEffect(room, "shot", enemy.x, enemy.y, {
    color: profile.color,
    angle: baseAngle,
    radius: 64,
    style: "sniper_bolt"
  });
}

function repositionVoidBoss(room, enemy, target, profile) {
  const angle = Math.atan2(enemy.y - target.y, enemy.x - target.x) + (Math.random() < 0.5 ? 0.82 : -0.82);
  const distanceAway = enemy.bossPhase >= 3 ? 360 : 300;
  const x = clamp(target.x + Math.cos(angle) * distanceAway, 90, room.world.w - 90);
  const y = clamp(target.y + Math.sin(angle) * distanceAway, 90, room.world.h - 90);
  const spot = findFreeEnemySpawnPosition(room, x, y, enemy.radius);
  const fromX = enemy.x;
  const fromY = enemy.y;
  enemy.x = spot.x;
  enemy.y = spot.y;
  addEffect(room, "dash", (fromX + enemy.x) / 2, (fromY + enemy.y) / 2, {
    color: profile.color,
    fromX: round2(fromX),
    fromY: round2(fromY),
    toX: round2(enemy.x),
    toY: round2(enemy.y),
    radius: 180,
    style: "stalker_shadow"
  });
}

function castBossBeamFan(room, enemy, profile, count = 3, baseAngle = enemy.aiPhase || 0, options = {}) {
  const beams = Math.max(1, count);
  const defaultSpread = beams <= 1 ? 0 : Math.PI * (enemy.bossPhase >= 3 ? 1.42 : enemy.bossPhase >= 2 ? 1.18 : 1.08);
  const spread = Number.isFinite(options.spread) ? options.spread : defaultSpread;
  const startAngle = baseAngle - spread / 2;
  const defaultArmTime = enemy.bossPhase >= 3 ? 1.48 : enemy.bossPhase >= 2 ? 1.62 : 1.76;
  const minimumArmTime = enemy.executionBoss
    ? enemy.bossPhase >= 4
      ? 0.72
      : enemy.bossPhase >= 3
        ? 0.82
        : 0.92
    : enemy.miniBoss
      ? 1.08
      : enemy.bossPhase >= 3
        ? 0.92
        : enemy.bossPhase >= 2
          ? 1.02
          : 1.14;
  const armTime = Math.max(Number(options.armTime) || defaultArmTime, minimumArmTime);
  const length = Number(options.length) || (enemy.bossPhase >= 3 ? 1080 : enemy.bossPhase >= 2 ? 980 : 880);
  const width = Number(options.width) || (enemy.bossPhase >= 3 ? 50 : enemy.bossPhase >= 2 ? 44 : 38);
  const damageMul = Number(options.damageMul) || (enemy.bossPhase >= 3 ? 1.02 : enemy.bossPhase >= 2 ? 0.88 : 0.74);

  for (let i = 0; i < beams; i += 1) {
    const angle = startAngle + (beams === 1 ? 0 : (spread * i) / (beams - 1));
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_beam",
      ownerId: enemy.id,
      x: enemy.x,
      y: enemy.y,
      angle,
      length,
      width,
      radius: length,
      timer: armTime,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * damageMul,
      hostile: true,
      dead: false,
      color: profile.color
    });
  }

  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + 92,
    style: options.style || "boss_beam"
  });
}

function castBossRitualBloom(room, enemy, profile) {
  const count = enemy.bossPhase >= 3 ? 9 : enemy.bossPhase >= 2 ? 8 : 6;
  const ring = enemy.bossPhase >= 3 ? 370 : enemy.bossPhase >= 2 ? 315 : 255;
  const armTime = enemy.bossPhase >= 3 ? 1.14 : enemy.bossPhase >= 2 ? 1.28 : 1.42;
  const radius = enemy.bossPhase >= 3 ? 104 : enemy.bossPhase >= 2 ? 92 : 80;
  const rotation = enemy.aiPhase + Date.now() * 0.00025;

  for (let i = 0; i < count; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / count;
    const x = clamp(enemy.x + Math.cos(angle) * ring, 70, room.world.w - 70);
    const y = clamp(enemy.y + Math.sin(angle) * ring, 70, room.world.h - 70);
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_blast",
      x,
      y,
      radius,
      timer: armTime,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * (enemy.bossPhase >= 3 ? 0.72 : enemy.bossPhase >= 2 ? 0.62 : 0.54),
      ownerId: enemy.id,
      hostile: true,
      dead: false,
      color: profile.color
    });
    addEffect(room, "warning", x, y, { color: profile.color, radius, style: "boss_blast" });
  }

  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: ring + radius,
    style: "boss_ritual"
  });
}

function spawnBossAdds(room, enemy, profile, count, scale) {
  const livingAdds = room.enemies.filter((candidate) => candidate.hp > 0 && candidate.id !== enemy.id && distance(candidate, enemy) < 760).length;
  const spawnCount = Math.max(0, Math.min(count, 8 - livingAdds));
  if (spawnCount <= 0) return;
  const escorts = Array.isArray(profile?.escorts) ? profile.escorts.filter(Boolean) : [];

  for (let i = 0; i < spawnCount; i += 1) {
    const angle = enemy.aiPhase + (Math.PI * 2 * i) / spawnCount + Math.random() * 0.25;
    const type = escorts.length > 0 ? escorts[i % escorts.length] : pickEnemyType(room.wave);
    spawnEnemy(room, type, {
      x: enemy.x + Math.cos(angle) * (130 + Math.random() * 70),
      y: enemy.y + Math.sin(angle) * (110 + Math.random() * 70),
      scale,
      xpMul: 0.42,
      elite: enemy.bossPhase >= 2 && room.floor >= 3 && i === 0
    });
  }
  addEffect(room, "warning", enemy.x, enemy.y, { color: profile.color, radius: enemy.radius + 70, style: "boss_summon" });
}

function castBossBlasts(room, enemy, profile, count, options = {}) {
  const targets = getActiveLivingPlayers(room);
  if (targets.length === 0) return;

  for (let i = 0; i < count; i += 1) {
    const target = targets[i % targets.length];
    const armMul = Math.max(1, options.armTimeMul || 1);
    const armTime = (enemy.bossPhase >= 3 ? 1.16 : enemy.bossPhase >= 2 ? 1.32 : 1.48) * armMul;
    const radius = (enemy.bossPhase >= 3 ? 118 : enemy.bossPhase >= 2 ? 108 : 94) * (options.radiusMul || 1);
    const defaultDamageMul = enemy.bossPhase >= 3 ? 0.82 : enemy.bossPhase >= 2 ? 0.7 : 0.62;
    const damageMul = Number.isFinite(options.damageMul) ? options.damageMul : defaultDamageMul;
    let x;
    let y;
    if (options.aroundBoss) {
      const angle = enemy.aiPhase + (Math.PI * 2 * i) / Math.max(1, count);
      const ring = enemy.radius + radius + 76;
      x = clamp(enemy.x + Math.cos(angle) * ring, 60, room.world.w - 60);
      y = clamp(enemy.y + Math.sin(angle) * ring, 60, room.world.h - 60);
    } else {
      const predicted = predictPlayerPosition(room, enemy, target, 460, armTime, getEnemyAimAccuracy(room, enemy) * 0.88);
      x = clamp(predicted.x + (Math.random() - 0.5) * 54, 60, room.world.w - 60);
      y = clamp(predicted.y + (Math.random() - 0.5) * 54, 60, room.world.h - 60);
    }
    room.hazards.push({
      id: nextHazardId++,
      type: "boss_blast",
      x,
      y,
      radius,
      timer: armTime,
      armTime,
      armTimeMax: armTime,
      damage: enemy.damage * damageMul,
      ownerId: enemy.id,
      hostile: true,
      dead: false,
      color: profile.color
    });
    addEffect(room, "warning", x, y, {
      color: profile.color,
      radius,
      style: options.style || "boss_blast",
      duration: armTime
    });
  }
}

function updateShaman(room, shaman, dt, now = Date.now()) {
  if (shaman.windup && shaman.windup.kind === "heal") {
    shaman.windup.x = round2(shaman.x);
    shaman.windup.y = round2(shaman.y);
    const healWindup = advanceEnemyWindup(shaman, "heal", dt);
    if (healWindup.ready) {
      castShamanHeal(room, shaman, healWindup.windup, now);
      shaman.healTimer = getSupportCastProfile(shaman, "heal").recoveryTime;
    }
    return true;
  }

  if (shaman.healTimer > 0) return false;
  const supportCast = getSupportCastProfile(shaman, "heal");
  let target = null;
  let lowestRatio = 1;
  const radius = supportCast.radius;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.hp >= enemy.maxHp || distance(shaman, enemy) > radius + enemy.radius) continue;
    if ((enemy.shamanHealLockUntil || 0) > now) continue;
    const ratio = enemy.hp / enemy.maxHp;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      target = enemy;
    }
  }
  if (!target) return false;

  shaman.windup = {
    kind: "heal",
    time: supportCast.windupTime,
    x: round2(shaman.x),
    y: round2(shaman.y),
    radius: supportCast.radius
  };
  addEffect(room, "holy", shaman.x, shaman.y, {
    color: enemyDefs.shaman.color,
    radius: supportCast.radius,
    style: "shaman_channel",
    duration: supportCast.windupTime
  });
  addEffect(room, "warning", shaman.x, shaman.y, {
    color: enemyDefs.shaman.color,
    radius: supportCast.radius,
    style: "shaman_heal",
    duration: supportCast.windupTime
  });
  return true;
}

function castShamanHeal(room, shaman, cast, now = Date.now()) {
  if (!cast || shaman.hp <= 0) return;
  const center = { x: shaman.x, y: shaman.y };
  const radius = cast.radius || (shaman.elite ? 190 : 160);
  const healBase = 20 + room.wave * 3.2 + (shaman.elite ? 12 : 0);
  let healed = 0;

  addEffect(room, "holy", center.x, center.y, {
      color: enemyDefs.shaman.color,
      radius: radius * 1.08,
      style: "shaman_heal_burst"
    });

  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.hp >= enemy.maxHp) continue;
    if (distance(center, enemy) > radius + enemy.radius) continue;
    if ((enemy.shamanHealLockUntil || 0) > now) continue;
    const missingRatio = clamp(1 - enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
    const heal = Math.min(enemy.maxHp - enemy.hp, healBase * (0.82 + missingRatio * 0.46));
    if (heal <= 0) continue;
    enemy.hp += heal;
    enemy.shamanHealLockUntil = now + SHAMAN_TARGET_HEAL_LOCK_MS;
    healed += 1;
    addEffect(room, "heal", enemy.x, enemy.y, {
      value: Math.round(heal),
      color: enemyDefs.shaman.color,
      style: "shaman_heal"
    });
    if (healed >= (shaman.elite ? 5 : 4)) break;
  }

  if (healed === 0) {
    addEffect(room, "impact", center.x, center.y, {
      color: enemyDefs.shaman.color,
      radius: 44,
      style: "heal_fizzle"
    });
  }
}

function startChargeWindup(room, enemy, target, options = {}) {
  const tuning = getChargeDashTuning(enemy);
  const baseWindup = options.windupTime ?? (enemy.elite ? 0.62 : 0.76);
  const windupTime = getEnemyTelegraphTime(room, enemy, "primary", baseWindup) * Math.max(0.84, enemy.cadenceMul || 1);
  const accuracy = getEnemyAimAccuracy(room, enemy) + (options.accuracyBonus ?? (enemy.elite ? 0.1 : 0.06));
  const rawPredicted = predictChargeTarget(room, enemy, target, tuning.speed, windupTime, accuracy);
  const predicted = getBoundedChargeEndpoint(room, enemy, extendChargeEndpoint(room, enemy, rawPredicted, target));
  if (!isViableChargeEndpoint(room, enemy, predicted, options.minDashDistance)) {
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 0.55 * (enemy.cadenceMul || 1));
    return false;
  }
  const color = options.color || enemy.color || enemyDefs.charger.color;
  const chargeAngle = Math.atan2(predicted.y - enemy.y, predicted.x - enemy.x);

  enemy.windup = {
    kind: "charge",
    time: windupTime,
    duration: windupTime,
    x: predicted.x,
    y: predicted.y,
    angle: round2(chargeAngle),
    startX: round2(enemy.x),
    startY: round2(enemy.y),
    predicted: true,
    chainCount: options.chainCount || 0
  };
  addEffect(room, "warning", predicted.x, predicted.y, {
    color,
    radius: options.radius || (enemy.elite ? 98 : 86),
    style: options.style || "charge_predict",
    fromX: round2(enemy.x),
    fromY: round2(enemy.y),
    toX: round2(predicted.x),
    toY: round2(predicted.y)
  });
  return true;
}

function startChargeWindupAtPoint(room, enemy, x, y, options = {}) {
  const baseWindup = options.windupTime ?? (enemy.elite ? 0.62 : 0.76);
  const windupTime = getEnemyTelegraphTime(room, enemy, "primary", baseWindup) * Math.max(0.84, enemy.cadenceMul || 1);
  const rawTargetPoint = {
    x: clamp(x, 32, room.world.w - 32),
    y: clamp(y, 32, room.world.h - 32)
  };
  const targetPoint = getBoundedChargeEndpoint(room, enemy, extendChargeEndpoint(room, enemy, rawTargetPoint, { x, y }));
  if (!isViableChargeEndpoint(room, enemy, targetPoint, options.minDashDistance)) {
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 0.55 * (enemy.cadenceMul || 1));
    return false;
  }
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;
  const color = options.color || enemy.color || enemyDefs.charger.color;
  const chargeAngle = Math.atan2(targetY - enemy.y, targetX - enemy.x);

  enemy.windup = {
    kind: "charge",
    time: windupTime,
    duration: windupTime,
    x: targetX,
    y: targetY,
    angle: round2(chargeAngle),
    startX: round2(enemy.x),
    startY: round2(enemy.y),
    predicted: true,
    objectiveTarget: true,
    chainCount: options.chainCount || 0
  };
  addEffect(room, "warning", targetX, targetY, {
    color,
    radius: options.radius || (enemy.elite ? 98 : 86),
    style: options.style || "charge_predict",
    fromX: round2(enemy.x),
    fromY: round2(enemy.y),
    toX: round2(targetX),
    toY: round2(targetY)
  });
  return true;
}

function isChargeWindupLocked(enemy) {
  return Boolean(enemy?.windup && enemy.windup.kind === "charge" && isEnemyWindupPositionLocked(enemy));
}

function lockChargeWindupPosition(room, enemy) {
  if (!isChargeWindupLocked(enemy)) return;
  lockEnemyWindupPosition(room, enemy);
}

function isEnemyWindupPositionLocked(enemy) {
  const kind = enemy?.windup?.kind;
  return Boolean(
    (kind === "charge" || kind === "bomber_explode") &&
      Number.isFinite(enemy.windup.startX) &&
      Number.isFinite(enemy.windup.startY)
  );
}

function lockEnemyWindupPosition(room, enemy) {
  if (!isEnemyWindupPositionLocked(enemy)) return;
  enemy.x = clamp(enemy.windup.startX, 24, room.world.w - 24);
  enemy.y = clamp(enemy.windup.startY, 24, room.world.h - 24);
}

function predictChargeTarget(room, enemy, target, dashSpeed, windupTime, accuracy) {
  const velocity = getPlayerVelocity(target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  const travelTime = dist / Math.max(1, dashSpeed);
  const recentDashPenalty = Date.now() - (target.lastDashAt || 0) < 420 ? 0.58 : 1;
  const effectiveAccuracy = clamp(accuracy * recentDashPenalty, 0.28, enemy.elite || enemy.type === "boss" ? 0.9 : 0.82);
  const maxLead = enemy.elite || enemy.type === "boss" ? 1.08 : 0.9;
  const leadTime = clamp(windupTime + travelTime * 0.72, 0, maxLead);
  let x = target.x + velocity.x * leadTime * effectiveAccuracy;
  let y = target.y + velocity.y * leadTime * effectiveAccuracy;
  const missRadius = (1 - effectiveAccuracy) * (enemy.elite || enemy.type === "boss" ? 44 : 62);
  const angle = Math.random() * Math.PI * 2;
  const amount = Math.random() * missRadius;

  x += Math.cos(angle) * amount;
  y += Math.sin(angle) * amount;
  return {
    x: clamp(x, 32, room.world.w - 32),
    y: clamp(y, 32, room.world.h - 32)
  };
}

function extendChargeEndpoint(room, enemy, predicted, target) {
  const startX = enemy.x;
  const startY = enemy.y;
  const toward = normalizeVector((predicted?.x ?? target?.x ?? startX) - startX, (predicted?.y ?? target?.y ?? startY) - startY);
  const fallback = normalizeVector((target?.x ?? startX + 1) - startX, (target?.y ?? startY) - startY);
  const dir = Math.hypot(toward.x, toward.y) > 0.01 ? toward : fallback;
  const currentDistance = Math.hypot((predicted?.x ?? startX) - startX, (predicted?.y ?? startY) - startY);
  const minDistance =
    enemy.type === "boss"
      ? enemy.miniBoss
        ? 230
        : 310
      : enemy.elite
        ? 230
        : 190;
  const desiredDistance = Math.max(currentDistance, minDistance);
  return {
    x: clamp(startX + dir.x * desiredDistance, 32, room.world.w - 32),
    y: clamp(startY + dir.y * desiredDistance, 32, room.world.h - 32)
  };
}

function getBoundedChargeEndpoint(room, enemy, point) {
  const startX = Number.isFinite(enemy?.x) ? enemy.x : 0;
  const startY = Number.isFinite(enemy?.y) ? enemy.y : 0;
  const targetX = clamp(Number.isFinite(point?.x) ? point.x : startX, 24, room.world.w - 24);
  const targetY = clamp(Number.isFinite(point?.y) ? point.y : startY, 24, room.world.h - 24);
  const bounded = getMapBoundedMovementEndpoint(room, enemy, targetX - startX, targetY - startY, 24, enemy?.radius || 20);
  return {
    x: clamp(bounded.x, 24, room.world.w - 24),
    y: clamp(bounded.y, 24, room.world.h - 24)
  };
}

function isViableChargeEndpoint(room, enemy, point, minDashDistance = 48) {
  const endX = clamp(point?.x ?? enemy.x, 24, room.world.w - 24);
  const endY = clamp(point?.y ?? enemy.y, 24, room.world.h - 24);
  const dashDistance = Math.hypot(endX - enemy.x, endY - enemy.y);
  return Number.isFinite(dashDistance) && dashDistance >= minDashDistance;
}

function getChargeDashTuning(enemy) {
  if (enemy.type === "boss") {
    return { speed: enemy.bossPhase >= 2 ? 1240 : 1160, minDuration: 0.36, maxDuration: 0.58 };
  }
  if (enemy.elite) {
    return { speed: 1060, minDuration: 0.38, maxDuration: 0.62 };
  }
  return { speed: 960, minDuration: 0.42, maxDuration: 0.68 };
}

function chargeEase(progress) {
  return progress * progress * (3 - 2 * progress);
}

function beginChargerDash(room, enemy, windup = enemy.windup) {
  if (!windup) return;
  const startX = enemy.x;
  const startY = enemy.y;
  const endpoint = getBoundedChargeEndpoint(room, enemy, windup);
  const endX = endpoint.x;
  const endY = endpoint.y;
  const dashDistance = Math.hypot(endX - startX, endY - startY);
  if (!Number.isFinite(dashDistance) || dashDistance < 28) {
    enemy.chargeMove = null;
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 1.15 * (enemy.cadenceMul || 1));
    return;
  }
  const tuning = getChargeDashTuning(enemy);
  const duration = clamp(dashDistance / tuning.speed, tuning.minDuration, tuning.maxDuration);

  enemy.chargeMove = {
    startX,
    startY,
    x: endX,
    y: endY,
    angle: Math.atan2(endY - startY, endX - startX),
    elapsed: 0,
    duration,
    key: `${Math.round(startX)}:${Math.round(startY)}:${Math.round(endX)}:${Math.round(endY)}:${Date.now()}`,
    hitIds: [],
    chainCount: windup.chainCount || 0,
    objectiveTarget: Boolean(windup.objectiveTarget || enemy.focusingDefenseObjective),
    objectiveHit: false
  };
  addEffect(room, "dash", (startX + endX) / 2, (startY + endY) / 2, {
    color: enemy.color || enemyDefs.charger.color,
    angle: Math.atan2(endY - startY, endX - startX),
    radius: dashDistance * 0.52,
    style: "enemy_charge",
    fromX: round2(startX),
    fromY: round2(startY),
    toX: round2(endX),
    toY: round2(endY),
    moveDuration: round2(duration)
  });
}

function updateChargerDash(room, enemy, dt) {
  const dash = enemy.chargeMove;
  if (!dash) return false;
  if (
    !Number.isFinite(dash.duration) ||
    dash.duration <= 0 ||
    !Number.isFinite(dash.startX) ||
    !Number.isFinite(dash.startY) ||
    !Number.isFinite(dash.x) ||
    !Number.isFinite(dash.y)
  ) {
    enemy.chargeMove = null;
    enemy.chargeTimer = Math.max(enemy.chargeTimer || 0, 1.15 * (enemy.cadenceMul || 1));
    return false;
  }

  const prevX = enemy.x;
  const prevY = enemy.y;
  dash.elapsed = Math.min(dash.duration, dash.elapsed + dt);
  const progress = clamp(dash.elapsed / Math.max(0.01, dash.duration), 0, 1);
  const eased = chargeEase(progress);
  const targetX = clamp(dash.startX + (dash.x - dash.startX) * eased, 24, room.world.w - 24);
  const targetY = clamp(dash.startY + (dash.y - dash.startY) * eased, 24, room.world.h - 24);
  moveEnemyBy(room, enemy, targetX - enemy.x, targetY - enemy.y);

  for (const player of getActiveLivingPlayers(room)) {
    if (dash.hitIds.includes(player.id)) continue;
    const hitRadius = enemy.radius + getPlayerCollisionRadius(player) + 4;
    if (distanceToSegment(player, prevX, prevY, enemy.x, enemy.y) <= hitRadius) {
      dash.hitIds.push(player.id);
      damagePlayer(room, player, enemy.damage * (enemy.elite ? 1.16 : 0.98), enemy.id, player.x, player.y, {
        damageType: enemy.type === "boss" ? "boss_charge" : enemy.elite ? "elite_charge" : "charge_hit",
        knockbackDirX: enemy.x - prevX,
        knockbackDirY: enemy.y - prevY
      });
    }
  }

  const objective = room.stageObjective;
  if (
    dash.objectiveTarget &&
    !dash.objectiveHit &&
    objective?.type === "defense" &&
    objective.hp > 0 &&
    distanceToSegment(objective, prevX, prevY, enemy.x, enemy.y) <= enemy.radius + (objective.radius || 42) + 8
  ) {
    dash.objectiveHit = true;
    enemy.focusingDefenseObjective = true;
    damageDefenseObjective(room, objective, enemy, enemy.elite ? 0.68 : 0.54, {
      cooldown: enemy.elite ? 0.9 : 1.08,
      radius: (objective.radius || 42) + 28
    });
  }

  if (progress >= 1) {
    const chainCount = dash.chainCount || 0;
    enemy.chargeMove = null;
    enemy.chargeTimer = getChargeDashCooldown(enemy);
    if ((enemy.elite || enemy.type === "boss") && chainCount > 0) {
      const nextTarget = nearestLivingPlayer(room, enemy);
      if (nextTarget) {
        startChargeWindup(room, enemy, nextTarget, {
          windupTime: 0.4,
          radius: 104,
          style: "elite_chain_charge",
          accuracyBonus: 0.26,
          chainCount: chainCount - 1
        });
      }
    }
  }
  return true;
}

function updateStalker(room, enemy, target, dist, dt) {
  const stabWindup = advanceEnemyWindup(enemy, "stalker_stab", dt);
  if (stabWindup.active) {
    if (stabWindup.ready) {
      performStalkerStab(room, enemy, stabWindup.windup);
      enemy.specialTimer = (enemy.elite ? 1.12 : 1.45) * (enemy.cadenceMul || 1);
    }
    return true;
  }

  const shurikenWindup = advanceEnemyWindup(enemy, "stalker_shuriken", dt);
  if (shurikenWindup.active) {
    if (shurikenWindup.ready) {
      fireStalkerShurikenFan(room, enemy, shurikenWindup.windup);
      enemy.specialTimer = (enemy.elite ? 2.1 : 2.72) * (enemy.cadenceMul || 1);
    }
    return true;
  }

  if (enemy.specialTimer > 0) return false;

  const closeRange = getStalkerStabRange(enemy) + getPlayerCollisionRadius(target) + 22;
  if (dist <= closeRange) {
    startStalkerStab(room, enemy, target);
    return true;
  }

  if (dist >= 170 && dist <= (enemy.elite ? 560 : 500)) {
    startStalkerShuriken(room, enemy, target);
    return true;
  }

  return false;
}

function getStalkerStabRange(enemy) {
  return enemy.elite ? 126 : 108;
}

function startStalkerStab(room, enemy, target) {
  const dir = normalizeVector(target.x - enemy.x, target.y - enemy.y);
  const angle = Math.atan2(dir.y, dir.x);
  const windupTime = (enemy.elite ? 0.16 : 0.22) * Math.max(0.82, enemy.cadenceMul || 1);
  const range = getStalkerStabRange(enemy);
  const arc = enemy.elite ? 0.86 : 0.74;
  enemy.windup = {
    kind: "stalker_stab",
    time: windupTime,
    duration: windupTime,
    targetId: target.id,
    angle: round2(angle),
    dirX: round2(dir.x),
    dirY: round2(dir.y),
    range,
    arc
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemyDefs.stalker.color,
    radius: range,
    angle,
    arc,
    style: "stalker_stab",
    duration: windupTime
  });
}

function performStalkerStab(room, enemy, cast) {
  const angle = Number.isFinite(cast?.angle) ? cast.angle : enemy.aiPhase || 0;
  const range = Number.isFinite(cast?.range) ? cast.range : getStalkerStabRange(enemy);
  const halfArc = Math.max(0.24, (Number.isFinite(cast?.arc) ? cast.arc : 0.74) / 2);

  addEffect(room, "slash", enemy.x, enemy.y, {
    color: enemyDefs.stalker.color,
    angle,
    radius: range,
    style: "stalker_stab",
    duration: 0.28
  });

  for (const player of getActiveLivingPlayers(room)) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > range + getPlayerCollisionRadius(player)) continue;
    const targetAngle = Math.atan2(dy, dx);
    if (Math.abs(angleDifference(targetAngle, angle)) > halfArc) continue;
    damagePlayer(room, player, enemy.damage * (enemy.elite ? 1.18 : 1.04), enemy.id, player.x, player.y, {
      damageType: "stalker_stab",
      knockbackDirX: Math.cos(angle),
      knockbackDirY: Math.sin(angle)
    });
    addEffect(room, "impact", player.x, player.y, {
      color: enemyDefs.stalker.color,
      radius: getPlayerCollisionRadius(player) + 24,
      style: "stalker_stab_impact"
    });
  }
}

function startStalkerShuriken(room, enemy, target) {
  const castTime = (enemy.elite ? 0.38 : 0.5) * Math.max(0.88, enemy.cadenceMul || 1);
  const speed = enemy.elite ? 560 : 500;
  const predicted = predictPlayerPosition(room, enemy, target, speed, castTime, getEnemyAimAccuracy(room, enemy) * 0.82);
  const angle = Math.atan2(predicted.y - enemy.y, predicted.x - enemy.x);
  const spread = enemy.elite ? 0.28 : 0.34;
  enemy.windup = {
    kind: "stalker_shuriken",
    time: castTime,
    duration: castTime,
    targetId: target.id,
    x: round2(predicted.x),
    y: round2(predicted.y),
    angle: round2(angle),
    spread,
    range: enemy.elite ? 560 : 500
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemyDefs.stalker.color,
    radius: enemy.windup.range,
    angle,
    spread,
    style: "stalker_shuriken",
    duration: castTime
  });
}

function fireStalkerShurikenFan(room, enemy, cast) {
  const baseAngle = Number.isFinite(cast?.angle) ? cast.angle : enemy.aiPhase || 0;
  const spread = Number.isFinite(cast?.spread) ? cast.spread : 0.34;
  const speed = enemy.elite ? 560 : 500;
  const range = Number.isFinite(cast?.range) ? cast.range : enemy.elite ? 560 : 500;
  const damage = enemy.damage * (enemy.elite ? 0.46 : 0.4);

  for (const offset of [-spread, 0, spread]) {
    const angle = baseAngle + offset;
    room.projectiles.push({
      id: nextProjectileId++,
      ownerId: enemy.id,
      classId: "enemy",
      x: enemy.x + Math.cos(angle) * (enemy.radius + 8),
      y: enemy.y + Math.sin(angle) * (enemy.radius + 8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      distanceLeft: range,
      damage,
      radius: enemy.elite ? 6 : 5,
      pierce: 0,
      splash: 0,
      poison: 0,
      slow: 0,
      chain: 0,
      style: "stalker_shuriken",
      damageType: "stalker_shuriken",
      hostile: true,
      dead: false
    });
  }

  addEffect(room, "shot", enemy.x, enemy.y, {
    color: enemyDefs.stalker.color,
    angle: baseAngle,
    radius: 42,
    spread,
    style: "stalker_shuriken",
    duration: 0.32
  });
}

function updateBrute(room, enemy, target, dist, dt) {
  const swingWindup = advanceEnemyWindup(enemy, "brute_swing", dt);
  if (swingWindup.active) {
    if (swingWindup.ready) {
      performBruteSwing(room, enemy, swingWindup.windup);
      enemy.attackTimer = (enemy.elite ? 0.76 : 1.04) * (enemy.cadenceMul || 1);
    }
    return true;
  }

  if (enemy.attackTimer > 0) return false;

  const attackRange = enemy.radius + getPlayerCollisionRadius(target) + (enemy.elite ? 78 : 62);
  if (dist > attackRange) return false;

  const dir = normalizeVector(target.x - enemy.x, target.y - enemy.y);
  const windupTime = (enemy.elite ? 0.34 : 0.46) * Math.max(0.88, enemy.cadenceMul || 1);
  const radius = enemy.elite ? 122 : 104;
  const angle = Math.atan2(dir.y, dir.x);

  enemy.windup = {
    kind: "brute_swing",
    time: windupTime,
    duration: windupTime,
    dirX: round2(dir.x),
    dirY: round2(dir.y),
    angle: round2(angle),
    radius
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemy.color || enemyDefs.brute.color,
    radius,
    angle: round2(angle),
    style: "brute_swing",
    duration: windupTime
  });
  return true;
}

function performBruteSwing(room, enemy, cast) {
  if (!cast || enemy.hp <= 0) return;
  const dir = normalizeVector(Number(cast.dirX) || 1, Number(cast.dirY) || 0);
  const angle = Number.isFinite(cast.angle) ? cast.angle : Math.atan2(dir.y, dir.x);
  const radius = cast.radius || (enemy.elite ? 122 : 104);
  const lunge = enemy.elite ? 28 : 20;

  moveEnemyBy(room, enemy, dir.x * lunge, dir.y * lunge);
  addEffect(room, "slash", enemy.x + dir.x * radius * 0.42, enemy.y + dir.y * radius * 0.42, {
    color: enemy.color || enemyDefs.brute.color,
    angle: round2(angle),
    radius: radius * 1.08,
    style: "brute_swing",
    swingSide: enemy.orbitDir || 1
  });

  for (const player of getActiveLivingPlayers(room)) {
    const playerRadius = getPlayerCollisionRadius(player);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dot = (dx / dist) * dir.x + (dy / dist) * dir.y;
    const inReach = dist <= radius + playerRadius * 0.82;
    const inArc = dot > 0.08;
    if (!inReach || !inArc) continue;
    damagePlayer(room, player, enemy.damage * (enemy.elite ? 1.18 : 1), enemy.id, player.x, player.y, {
      damageType: "brute_swing",
      knockbackDirX: dir.x,
      knockbackDirY: dir.y
    });
  }
}

function updateGuardian(room, enemy, target, dist, dt) {
  const barrierWindup = advanceEnemyWindup(enemy, "guardian_barrier", dt);
  if (barrierWindup.active) {
    if (barrierWindup.ready) {
      castGuardianBarrier(room, enemy, barrierWindup.windup);
      enemy.specialTimer = getSupportCastProfile(enemy, "guardian_barrier").recoveryTime;
    }
    return true;
  }

  const supportCast = getSupportCastProfile(enemy, "guardian_barrier");
  const radius = supportCast.radius;
  const meleePressureRange = enemy.radius + getPlayerCollisionRadius(target) + (enemy.elite ? 74 : 58);
  if (dist <= meleePressureRange && enemy.attackTimer <= 0) return false;
  if (enemy.specialTimer > 0 || getGuardianBarrierTargets(room, enemy, radius).length === 0) return false;
  enemy.windup = {
    kind: "guardian_barrier",
    time: supportCast.windupTime,
    radius
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemy.color || enemyDefs.guardian.color,
    radius,
    style: "guardian_barrier",
    duration: supportCast.windupTime
  });
  return true;
}

function getGuardianBarrierTargets(room, guardian, radius) {
  return room.enemies
    .filter((enemy) => {
      if (enemy.hp <= 0 || enemy.dead || enemy.trainingDummy) return false;
      if (distance(guardian, enemy) > radius + enemy.radius) return false;
      const desired = getGuardianBarrierAmount(room, guardian, enemy);
      return (enemy.barrier || 0) < desired * 0.55;
    })
    .sort((a, b) => {
      const aRatio = a.hp / Math.max(1, a.maxHp);
      const bRatio = b.hp / Math.max(1, b.maxHp);
      if (Math.abs(aRatio - bRatio) > 0.08) return aRatio - bRatio;
      return distance(guardian, a) - distance(guardian, b);
    })
    .slice(0, guardian.elite ? 7 : 5);
}

function getGuardianBarrierAmount(room, guardian, target) {
  const waveBonus = Math.min(34, (room.wave || 1) * 1.45);
  const base = (guardian.elite ? 36 : 26) + waveBonus + (target.elite ? 12 : 0);
  const capRatio = target.type === "boss" ? 0.1 : target.elite ? 0.24 : 0.38;
  return Math.max(10, Math.round(Math.min(base, target.maxHp * capRatio)));
}

function castGuardianBarrier(room, enemy, cast) {
  const radius = cast?.radius || (enemy.elite ? 255 : 220);
  const targets = getGuardianBarrierTargets(room, enemy, radius);
  if (!targets.length) return;

  addEffect(room, "shield", enemy.x, enemy.y, {
    color: enemy.color || enemyDefs.guardian.color,
    radius: enemy.radius + 34,
    style: "guardian_barrier_cast"
  });

  for (const target of targets) {
    const amount = getGuardianBarrierAmount(room, enemy, target);
    target.barrier = Math.max(target.barrier || 0, amount);
    target.barrierTimer = Math.max(target.barrierTimer || 0, enemy.elite ? 5.2 : 4.35);
    addEffect(room, "shield", target.x, target.y, {
      value: Math.round(amount),
      color: enemy.color || enemyDefs.guardian.color,
      radius: target.radius + 26,
      style: "enemy_barrier"
    });
  }
}

function updateMortar(room, enemy, target, dist, dt) {
  const pressureMul = enemy.rangedPressureMul || 1;
  const rangedCast = getRangedCastProfile(enemy, "mortar", pressureMul);
  const mortarWindup = advanceEnemyWindup(enemy, "mortar", dt);
  if (mortarWindup.active) {
    if (mortarWindup.ready) {
      launchMortarBlast(room, enemy, mortarWindup.windup);
      enemy.specialTimer = rangedCast.recoveryTime;
    }
    return true;
  }

  if (enemy.specialTimer > 0 || dist > 760) return false;

  const radius = rangedCast.radius;
  const armTime = rangedCast.windupTime;
  const predicted = predictPlayerPosition(room, enemy, target, 430, armTime, getEnemyAimAccuracy(room, enemy) * 0.86);
  const jitter = enemy.elite ? 44 : 28;
  const x = clamp(predicted.x + (Math.random() - 0.5) * jitter, 64, room.world.w - 64);
  const y = clamp(predicted.y + (Math.random() - 0.5) * jitter, 64, room.world.h - 64);

  enemy.windup = {
    kind: "mortar",
    time: armTime,
    x,
    y,
    radius,
    flightTime: enemy.elite ? 0.56 : 0.68,
    damage: enemy.damage * (enemy.elite ? 1.08 : 0.9),
    knockback: enemy.elite ? 72 : 52
  };
  addEffect(room, "warning", x, y, {
    color: enemyDefs.mortar.color,
    radius,
    style: "mortar_aim",
    duration: armTime
  });
  return true;
}

function launchMortarBlast(room, enemy, cast) {
  if (!cast) return false;
  const flightTime = Math.max(0.38, Number(cast.flightTime) || 0.62);
  const fromX = Number.isFinite(enemy?.x) ? enemy.x : cast.x;
  const fromY = Number.isFinite(enemy?.y) ? enemy.y : cast.y;
  room.hazards.push({
    id: nextHazardId++,
    type: "mortar_blast",
    x: cast.x,
    y: cast.y,
    radius: cast.radius,
    timer: flightTime,
    armTime: flightTime,
    armTimeMax: flightTime,
    spawnFromX: fromX,
    spawnFromY: fromY,
    damage: cast.damage,
    knockback: cast.knockback || 52,
    ownerId: enemy.id,
    damageType: "mortar_blast",
    style: "mortar_blast",
    hostile: true,
    dead: false,
    color: "#f97316"
  });
  addEffect(room, "warning", cast.x, cast.y, {
    color: "#f97316",
    radius: cast.radius,
    style: "mortar_blast",
    duration: flightTime
  });
  return true;
}

function updateSniper(room, enemy, target, dist, dt) {
  const pressureMul = enemy.rangedPressureMul || 1;
  const rangedCast = getRangedCastProfile(enemy, "snipe", pressureMul);
  const snipeWindup = advanceEnemyWindup(enemy, "snipe", dt);
  if (snipeWindup.active) {
    if (snipeWindup.ready) {
      fireSniperProjectile(room, enemy, snipeWindup.windup.x, snipeWindup.windup.y);
      enemy.specialTimer = rangedCast.recoveryTime;
    }
    return true;
  }

  if (enemy.specialTimer > 0 || dist > rangedCast.maxRange || dist < rangedCast.minRange) return false;
  const windupTime = rangedCast.windupTime;
  const predicted = predictPlayerPosition(room, enemy, target, rangedCast.projectileSpeed, windupTime, getEnemyAimAccuracy(room, enemy));
  enemy.windup = {
    kind: "snipe",
    time: windupTime,
    x: predicted.x,
    y: predicted.y
  };
  addEffect(room, "warning", predicted.x, predicted.y, { color: enemyDefs.sniper.color, radius: rangedCast.radius, style: "sniper_lock" });
  return true;
}

function updateSpitter(room, enemy, target, dist, dt) {
  const pressureMul = enemy.rangedPressureMul || 1;
  const rangedCast = getRangedCastProfile(enemy, "spit", pressureMul);
  const spitWindup = advanceEnemyWindup(enemy, "spit", dt);
  if (spitWindup.active) {
    if (spitWindup.ready) {
      fireEnemyProjectile(room, enemy, target);
      enemy.shotTimer = rangedCast.recoveryTime;
    }
    return true;
  }

  if (dist >= rangedCast.maxRange || enemy.shotTimer > 0) return false;
  const castTime = rangedCast.windupTime;
  const spitAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  enemy.windup = {
    kind: "spit",
    time: castTime,
    duration: castTime,
    targetId: target.id,
    x: round2(target.x),
    y: round2(target.y),
    angle: round2(spitAngle)
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemyDefs.spitter.color,
    radius: rangedCast.radius,
    style: "spit_cast",
    duration: castTime
  });
  return true;
}

function getEnemyTarget(room, enemy) {
  if (enemy.tauntTargetId) {
    const tauntTarget = room.players.get(enemy.tauntTargetId);
    if (isActiveLivingPlayer(tauntTarget)) return tauntTarget;
  }
  const defenseTarget = getDefenseObjectiveTarget(room, enemy);
  if (defenseTarget) return defenseTarget;
  if (enemy.targetLockTimer > 0 && enemy.targetId) {
    const lockedTarget = room.players.get(enemy.targetId);
    if (isActiveLivingPlayer(lockedTarget)) return lockedTarget;
  }
  let target = null;
  if (enemy.type === "sniper" || (enemy.type === "stalker" && enemy.elite)) {
    target = lowestHealthLivingPlayer(room) || nearestLivingPlayer(room, enemy);
  } else {
    target = nearestLivingPlayer(room, enemy);
  }
  if (target) {
    enemy.targetId = target.id;
    enemy.targetLockTimer = enemy.type === "boss"
      ? 0.45
      : ["sniper", "mortar", "spitter", "shaman"].includes(enemy.type)
        ? 1.1
        : 0.72;
  }
  return target;
}

function getDefenseObjectiveTarget(room, enemy) {
  const objective = room.stageObjective;
  if (!objective || objective.type !== "defense" || objective.hp <= 0) return null;
  if (!enemy || enemy.type === "boss" || enemy.trainingDummy || enemy.blockadeRunner) return null;

  const nearbyPlayer = nearestLivingPlayerWithin(room, enemy, getDefensePlayerAggroRadius(enemy));
  if (nearbyPlayer) return nearbyPlayer;
  return objective;
}

function getDefensePlayerAggroRadius(enemy) {
  return enemySystem.getDefensePlayerAggroRadius(enemy);
}

function nearestLivingPlayerWithin(room, point, maxDistance) {
  return enemySystem.nearestLivingPlayerWithin(getActiveLivingPlayers(room), point, maxDistance, getPlayerCollisionRadius);
}

function isDefenseObjectiveTarget(target) {
  return target?.type === "defense";
}

function updateObjectiveFocusedEnemy(room, enemy, objective, dist, dt) {
  if (!isDefenseObjectiveTarget(objective) || objective.hp <= 0) return false;
  enemy.focusingDefenseObjective = true;

  if (advanceBomberExplosionWindup(room, enemy, dt)) return true;

  if (enemy.windup && enemy.windup.kind === "charge") {
    return advanceChargeWindup(room, enemy, dt);
  }

  if (enemy.windup) {
    enemy.windup = null;
  }

  const objectiveRadius = objective.radius || 42;
  const attackRange = enemy.radius + objectiveRadius + getDefenseObjectiveAttackReach(enemy);

  if (enemy.type === "bomber" && enemy.specialTimer <= 0 && dist <= enemy.radius + objectiveRadius + (enemy.elite ? 68 : 52)) {
    startBomberExplosionWindup(room, enemy);
    return true;
  }

  if (enemy.type === "charger" && enemy.chargeTimer <= 0 && dist > attackRange + 70 && dist < 570) {
    startChargeWindupAtPoint(room, enemy, objective.x, objective.y, {
      windupTime: enemy.elite ? 0.68 : 0.82,
      radius: enemy.elite ? 96 : 84,
      style: "charge_predict"
    });
    return true;
  }

  if (dist <= attackRange) {
    if ((enemy.objectiveAttackTimer || 0) <= 0) {
      damageDefenseObjective(room, objective, enemy);
    }
    return true;
  }

  const toward = normalizeVector(objective.x - enemy.x, objective.y - enemy.y);
  const crowdPush = getEnemyCrowdPush(room, enemy);
  const speedMul = enemy.slowTimer > 0 ? 0.45 : 1;
  const sidePulse = Math.sin(Date.now() / 520 + (enemy.aiPhase || 0)) * 0.08;
  const move = normalizeVector(toward.x - toward.y * sidePulse, toward.y + toward.x * sidePulse);
  moveEnemyBy(room, enemy, (move.x * enemy.speed * speedMul + crowdPush.x) * dt, (move.y * enemy.speed * speedMul + crowdPush.y) * dt);
  return true;
}

function fireEnemyProjectile(room, enemy, target) {
  if (!canSpawnHostileProjectile(room)) return false;
  const venom = enemy.elite || enemy.affix === "venom";
  const speed = venom ? 420 : 355;
  const predicted = predictPlayerPosition(room, enemy, target, speed, 0.08, getEnemyAimAccuracy(room, enemy));
  const dx = predicted.x - enemy.x;
  const dy = predicted.y - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  room.projectiles.push({
    id: nextProjectileId++,
    ownerId: enemy.id,
    classId: "enemy",
    x: enemy.x,
    y: enemy.y,
    vx: (dx / length) * speed,
    vy: (dy / length) * speed,
    distanceLeft: HOSTILE_PROJECTILE_TRAVEL_DISTANCE.spit,
    damage: enemy.damage * (venom ? 0.68 : 0.56),
    radius: venom ? 12 : 10,
    pierce: 0,
    splash: 0,
    poison: (venom ? 1.85 : 1.05) + room.wave * (venom ? 0.18 : 0.12),
    poisonDuration: venom ? 2.7 : 2.2,
    slow: 0,
    chain: 0,
    style: venom ? "venom_spit" : "spit",
    damageType: venom ? "venom_spit" : "spit",
    hostile: true,
    dead: false
  });
  addEffect(room, "shot", enemy.x, enemy.y, {
    angle: Math.atan2(dy, dx),
    color: enemyDefs.spitter.color,
    radius: 34,
    style: venom ? "venom_spit" : "enemy_spit"
  });
  return true;
}

function fireSniperProjectile(room, enemy, targetX, targetY) {
  if (!canSpawnHostileProjectile(room)) return false;
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const length = Math.hypot(dx, dy) || 1;
  room.projectiles.push({
    id: nextProjectileId++,
    ownerId: enemy.id,
    classId: "enemy",
    x: enemy.x,
    y: enemy.y,
    vx: (dx / length) * (enemy.elite ? 820 : 730),
    vy: (dy / length) * (enemy.elite ? 820 : 730),
    distanceLeft: HOSTILE_PROJECTILE_TRAVEL_DISTANCE.sniper,
    damage: enemy.damage * (enemy.elite ? 1.08 : 0.9),
    radius: enemy.elite ? 9 : 8,
    pierce: 0,
    splash: 0,
    poison: 0,
    slow: 0,
    chain: 0,
    style: "sniper_bolt",
    damageType: "sniper_bolt",
    hostile: true,
    dead: false
  });
  addEffect(room, "shot", enemy.x, enemy.y, {
    angle: Math.atan2(dy, dx),
    color: enemyDefs.sniper.color,
    radius: 48,
    style: "sniper_bolt"
  });
  return true;
}

function updateBomber(room, enemy, target, dist, dt) {
  if (advanceBomberExplosionWindup(room, enemy, dt)) return true;

  if (enemy.specialTimer > 0) return false;
  const triggerDistance = enemy.radius + getPlayerCollisionRadius(target) + (enemy.elite ? 62 : 48);
  if (dist > triggerDistance) return false;

  startBomberExplosionWindup(room, enemy);
  return true;
}

function startBomberExplosionWindup(room, enemy) {
  const radius = getBomberExplosionRadius(enemy);
  const windupTime = (enemy.elite || enemy.affix === "volatile" ? 0.68 : 0.9) * Math.max(0.9, enemy.cadenceMul || 1);
  enemy.windup = {
    kind: "bomber_explode",
    time: windupTime,
    duration: windupTime,
    radius,
    startX: round2(enemy.x),
    startY: round2(enemy.y)
  };
  addEffect(room, "warning", enemy.x, enemy.y, {
    color: enemy.color || enemyDefs.bomber.color,
    radius,
    style: "bomber_explode",
    duration: windupTime
  });
}

function getBomberExplosionRadius(enemy) {
  return enemy.elite || enemy.affix === "volatile" ? 136 : 96;
}

function explodeBomber(room, enemy, cast = enemy.windup) {
  const radius = cast?.radius || getBomberExplosionRadius(enemy);
  for (const player of getActiveLivingPlayers(room)) {
    if (distance(enemy, player) > radius + getPlayerCollisionRadius(player)) continue;
    damagePlayer(room, player, enemy.damage * (enemy.elite ? 2.05 : 1.7), enemy.id, player.x, player.y, {
      damageType: "bomber_explode",
      knockbackOrigin: { x: enemy.x, y: enemy.y }
    });
  }
  const objective = room.stageObjective;
  if (objective?.type === "defense" && objective.hp > 0 && distance(enemy, objective) <= radius + (objective.radius || 42)) {
    damageDefenseObjective(room, objective, enemy, enemy.elite ? 1.34 : 1.06, {
      cooldown: 1.2,
      minDamage: 12,
      radius: (objective.radius || 42) + 34
    });
  }
  addEffect(room, "explosion", enemy.x, enemy.y, { color: enemyDefs.bomber.color, radius, style: "bomber_explode" });
  enemy.hp = 0;
  enemy.dead = true;
}

function getEnemyCrowdPush(room, enemy) {
  return enemySystem.getEnemyCrowdPush(room.enemies, enemy);
}

function resolveCombatCollisions(room) {
  if (room.status !== "combat") return;
  const players = getActiveLivingPlayers(room);
  const enemies = room.enemies.filter((enemy) => enemy.hp > 0);
  if (players.length === 0 && enemies.length === 0) return;

  const passes = Math.min(14, 7 + Math.ceil(enemies.length / 16));
  for (let pass = 0; pass < passes; pass += 1) {
    let moved = false;
    if (players.length > 0 && enemies.length > 0) moved = resolvePlayerEnemyCollisions(room, players, enemies) || moved;
    if (enemies.length > 1) moved = resolveEnemyEnemyCollisions(room, enemies) || moved;
    if (players.length > 1) moved = resolvePlayerPlayerCollisions(room, players) || moved;
    if (!moved) break;
  }
}

function resolvePlayerEnemyCollisions(room, players, enemies) {
  let moved = false;
  for (const player of players) {
    const playerRadius = getPlayerCollisionRadius(player);
    const playerMass = getPlayerCollisionMass(player);

    for (const enemy of enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);
      const minDist = playerRadius + enemy.radius + 2;
      if (dist >= minDist) continue;

      const dir = dist > 0.001 ? { x: dx / dist, y: dy / dist } : fallbackSeparationVector(player.id, enemy.id);
      const overlap = minDist - dist + 0.35;
      const enemyMass = getEnemyCollisionMass(enemy);
      const totalMass = playerMass + enemyMass;
      const enemyLocked = isEnemyWindupPositionLocked(enemy);
      const playerPush = enemyLocked ? overlap : overlap * (enemyMass / totalMass);
      const enemyPush = enemyLocked ? 0 : overlap * (playerMass / totalMass);

      movePlayerBy(room, player, -dir.x * playerPush, -dir.y * playerPush);
      if (!enemyLocked) moveEnemyBy(room, enemy, dir.x * enemyPush, dir.y * enemyPush);
      moved = true;
    }
  }
  return moved;
}

function resolveEnemyEnemyCollisions(room, enemies) {
  let moved = false;
  for (let i = 0; i < enemies.length; i += 1) {
    const a = enemies[i];
    for (let j = i + 1; j < enemies.length; j += 1) {
      const b = enemies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.radius + b.radius + 1;
      if (dist >= minDist) continue;

      const dir = dist > 0.001 ? { x: dx / dist, y: dy / dist } : fallbackSeparationVector(a.id, b.id);
      const overlap = minDist - dist + 0.25;
      const massA = getEnemyCollisionMass(a);
      const massB = getEnemyCollisionMass(b);
      const totalMass = massA + massB;
      const aLocked = isEnemyWindupPositionLocked(a);
      const bLocked = isEnemyWindupPositionLocked(b);
      if (aLocked && bLocked) continue;
      const pushA = bLocked ? overlap : aLocked ? 0 : overlap * (massB / totalMass);
      const pushB = aLocked ? overlap : bLocked ? 0 : overlap * (massA / totalMass);

      if (!aLocked) moveEnemyBy(room, a, -dir.x * pushA, -dir.y * pushA);
      if (!bLocked) moveEnemyBy(room, b, dir.x * pushB, dir.y * pushB);
      moved = true;
    }
  }
  return moved;
}

function resolvePlayerPlayerCollisions(room, players) {
  let moved = false;
  for (let i = 0; i < players.length; i += 1) {
    const a = players[i];
    for (let j = i + 1; j < players.length; j += 1) {
      const b = players[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = getPlayerCollisionRadius(a) + getPlayerCollisionRadius(b) - 4;
      if (dist >= minDist) continue;

      const dir = dist > 0.001 ? { x: dx / dist, y: dy / dist } : fallbackSeparationVector(a.id, b.id);
      const overlap = (minDist - dist + 0.2) * 0.5;
      movePlayerBy(room, a, -dir.x * overlap, -dir.y * overlap);
      movePlayerBy(room, b, dir.x * overlap, dir.y * overlap);
      moved = true;
    }
  }
  return moved;
}

function getPlayerCollisionRadius(player) {
  const scale = getPlayerSizeScale(player);
  if (player.classId === "warrior") return 22 * scale;
  if (player.classId === "martialist") return 21 * scale;
  if (player.classId === "engineer") return 20 * scale;
  if (player.classId === "puppeteer") return 19 * scale;
  if (player.classId === "assassin") return 18 * scale;
  if (player.classId === "alchemist") return 19 * scale;
  if (player.classId === "ranger" || player.classId === "mage") return 19 * scale;
  return 20 * scale;
}

function getPlayerSizeScale(player) {
  if (player.tauntGuardTimer > 0) return WARRIOR_TAUNT_SIZE_SCALE;
  if (isEngineerMechaActive(player)) return 1.24;
  return 1;
}

function getPlayerCollisionMass(player) {
  if (player.classId === "warrior") return 2.1;
  if (player.classId === "martialist") return 1.62;
  if (player.classId === "engineer") return isEngineerMechaActive(player) ? 1.78 : 1.35;
  if (player.classId === "puppeteer") return 1.18;
  if (player.classId === "alchemist") return 1.16;
  if (player.classId === "assassin") return 1.04;
  return 1.25;
}

function getEnemyCollisionMass(enemy) {
  return enemySystem.getEnemyCollisionMass(enemy);
}

function moveEntityWithMapWalls(room, entity, dx, dy, margin, radius) {
  if (!entity || !room?.world) return;
  const stepDistance = Math.max(18, radius * 0.75);
  const steps = Math.max(1, Math.ceil(Math.hypot(dx || 0, dy || 0) / stepDistance));
  const stepX = (dx || 0) / steps;
  const stepY = (dy || 0) / steps;

  for (let i = 0; i < steps; i += 1) {
    collisionSystem.moveEntityWithinWorld(entity, stepX, 0, room.world, margin);
    resolveEntityMapWalls(room, entity, radius, margin);
    collisionSystem.moveEntityWithinWorld(entity, 0, stepY, room.world, margin);
    resolveEntityMapWalls(room, entity, radius, margin);
  }
}

function getMapBoundedMovementEndpoint(room, entity, dx, dy, margin, radius) {
  const probe = {
    x: Number.isFinite(entity?.x) ? entity.x : 0,
    y: Number.isFinite(entity?.y) ? entity.y : 0
  };
  moveEntityWithMapWalls(room, probe, dx, dy, margin, radius);
  return { x: probe.x, y: probe.y };
}

function resolveEntityMapWalls(room, entity, radius, margin = radius) {
  const walls = getRoomCollisionWalls(room);
  if (!walls.length) return false;

  let movedAny = false;
  for (let pass = 0; pass < 3; pass += 1) {
    let moved = false;
    for (const wall of walls) {
      const push = getCircleRectPush(entity.x, entity.y, radius + 1.5, wall);
      if (!push) continue;
      entity.x += push.x;
      entity.y += push.y;
      moved = true;
      movedAny = true;
    }
    collisionSystem.moveEntityWithinWorld(entity, 0, 0, room.world, margin);
    if (!moved) break;
  }
  return movedAny;
}

function getCircleRectPush(x, y, radius, wall) {
  const halfW = Math.max(1, Number(wall.w) || 1) / 2;
  const halfH = Math.max(1, Number(wall.h) || 1) / 2;
  const left = wall.x - halfW;
  const right = wall.x + halfW;
  const top = wall.y - halfH;
  const bottom = wall.y + halfH;
  const nearestX = clamp(x, left, right);
  const nearestY = clamp(y, top, bottom);
  const dx = x - nearestX;
  const dy = y - nearestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > radius * radius) return null;
  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist + 0.25;
    return { x: (dx / dist) * overlap, y: (dy / dist) * overlap };
  }

  const leftGap = Math.max(0, x - left);
  const rightGap = Math.max(0, right - x);
  const topGap = Math.max(0, y - top);
  const bottomGap = Math.max(0, bottom - y);
  const minGap = Math.min(leftGap, rightGap, topGap, bottomGap);
  if (minGap === leftGap) return { x: -(leftGap + radius + 0.25), y: 0 };
  if (minGap === rightGap) return { x: rightGap + radius + 0.25, y: 0 };
  if (minGap === topGap) return { x: 0, y: -(topGap + radius + 0.25) };
  return { x: 0, y: bottomGap + radius + 0.25 };
}

function circleRectClearance(x, y, radius, wall) {
  const halfW = Math.max(1, Number(wall.w) || 1) / 2;
  const halfH = Math.max(1, Number(wall.h) || 1) / 2;
  const absX = Math.abs(x - wall.x);
  const absY = Math.abs(y - wall.y);
  const outsideX = absX - halfW;
  const outsideY = absY - halfH;

  if (outsideX > 0 && outsideY > 0) return Math.hypot(outsideX, outsideY) - radius;
  if (outsideX > 0) return outsideX - radius;
  if (outsideY > 0) return outsideY - radius;
  return -radius - Math.min(halfW - absX, halfH - absY);
}

function stopProjectileOnMapWall(room, projectile, fromX, fromY) {
  const hit = getProjectileWallCollision(room, projectile, fromX, fromY);
  if (!hit) return false;

  projectile.x = hit.x;
  projectile.y = hit.y;
  const giantStarOrb = String(projectile.style || "").includes("giant_star_orb");
  if (!projectile.hostile && !giantStarOrb) {
    const owner = room.players.get(projectile.ownerId);
    if (!Number.isFinite(projectile.wallBouncesRemaining)) {
      projectile.wallBouncesRemaining = Math.max(0, Math.floor(owner?.wallBounceBonus || 0));
    }
    if (projectile.wallBouncesRemaining > 0) {
      reflectProjectileFromWall(projectile, hit.wall);
      projectile.wallBouncesRemaining -= 1;
      addEffect(room, "impact", hit.x, hit.y, {
        color: getProjectileWallImpactColor(projectile),
        radius: Math.max(22, (Number(projectile.radius) || 8) + 18),
        style: "projectile_wall_bounce",
        angle: Math.atan2(projectile.vy || 0, projectile.vx || 0),
        duration: 0.28
      });
      return true;
    }
  }
  projectile.dead = true;
  if (giantStarOrb) explodeGiantStarOrbOnWall(room, projectile, hit.x, hit.y);
  addEffect(room, "impact", hit.x, hit.y, {
    color: getProjectileWallImpactColor(projectile),
    radius: giantStarOrb ? Math.max(72, Number(projectile.splash) || (Number(projectile.radius) || 8) * 1.85) : Math.max(18, (Number(projectile.radius) || 8) + 14),
    rangeRadius: giantStarOrb ? Math.max(72, Number(projectile.splash) || 0) : undefined,
    style: giantStarOrb ? "giant_star_orb_wall_impact" : projectile.hostile ? "projectile_wall_hit_hostile" : "projectile_wall_hit",
    angle: Math.atan2(projectile.vy || 0, projectile.vx || 0),
    duration: giantStarOrb ? 0.46 : 0.22
  });
  return true;
}

function explodeGiantStarOrbOnWall(room, projectile, x, y) {
  const radius = Math.max(72, Number(projectile.splash) || 0);
  const damage = Math.max(1, Number(projectile.damage) || 0) * 0.52;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance({ x, y }, enemy) > radius + enemy.radius) continue;
    const dealt = dealDamage(room, enemy, damage, projectile.ownerId, {
      skillTag: projectile.skillTag,
      forceCrit: Boolean(projectile.forceCrit),
      noVulnerable: true
    });
    applyProjectileStatus(room, projectile, enemy, dealt);
  }
}

function reflectProjectileFromWall(projectile, wall) {
  const halfW = Math.max(1, Number(wall?.w) || 1) / 2 + Math.max(2, Number(projectile.radius) || 4);
  const halfH = Math.max(1, Number(wall?.h) || 1) / 2 + Math.max(2, Number(projectile.radius) || 4);
  const normalizedX = Math.abs((projectile.x - wall.x) / halfW);
  const normalizedY = Math.abs((projectile.y - wall.y) / halfH);
  if (normalizedX >= normalizedY) projectile.vx = -(projectile.vx || 0);
  else projectile.vy = -(projectile.vy || 0);
  const speed = Math.hypot(projectile.vx || 0, projectile.vy || 0) || 1;
  projectile.x += (projectile.vx / speed) * 4;
  projectile.y += (projectile.vy / speed) * 4;
  projectile.homingTargetId = undefined;
}

function getProjectileWallImpactColor(projectile) {
  if (projectile.hostile) return projectile.poison ? "#9aa15f" : "#c85d56";
  if (projectile.burn) return "#f97316";
  if (projectile.poison) return "#9aa15f";
  if (String(projectile.style || "").includes("mecha_laser_shot")) return "#67e8f9";
  return classes[projectile.classId]?.color || projectile.color || "#f8f3e9";
}

function getProjectileWallCollision(room, projectile, fromX, fromY) {
  if (!room?.world || !projectile) return null;
  const toX = Number.isFinite(projectile.x) ? projectile.x : fromX;
  const toY = Number.isFinite(projectile.y) ? projectile.y : fromY;
  const radius = Math.max(2, Number(projectile.radius) || 4);
  let best = null;

  for (const wall of getRoomCollisionWalls(room)) {
    const startClearance = circleRectClearance(fromX, fromY, radius, wall);
    const endClearance = circleRectClearance(toX, toY, radius, wall);
    if (startClearance <= 0 && endClearance < startClearance - 0.25) {
      return { t: 0, x: fromX, y: fromY, wall };
    }

    const hit = getSegmentExpandedRectHit(fromX, fromY, toX, toY, wall, radius);
    if (!hit) continue;
    if (!best || hit.t < best.t) best = { ...hit, wall };
  }

  return best;
}

function getSegmentExpandedRectHit(ax, ay, bx, by, wall, radius) {
  const halfW = Math.max(1, Number(wall.w) || 1) / 2 + radius;
  const halfH = Math.max(1, Number(wall.h) || 1) / 2 + radius;
  const left = wall.x - halfW;
  const right = wall.x + halfW;
  const top = wall.y - halfH;
  const bottom = wall.y + halfH;
  const dx = bx - ax;
  const dy = by - ay;
  let range = { tMin: 0, tMax: 1 };

  range = clipSegmentAxis(ax, dx, left, right, range);
  if (!range) return null;
  range = clipSegmentAxis(ay, dy, top, bottom, range);
  if (!range || range.tMin <= 0.0001) return null;

  const t = range.tMin;
  return {
    t,
    x: ax + dx * t,
    y: ay + dy * t
  };
}

function clipSegmentAxis(start, delta, min, max, range) {
  if (Math.abs(delta) < 0.0001) {
    return start >= min && start <= max ? range : null;
  }

  let t1 = (min - start) / delta;
  let t2 = (max - start) / delta;
  if (t1 > t2) {
    const swap = t1;
    t1 = t2;
    t2 = swap;
  }

  const tMin = Math.max(range.tMin, t1);
  const tMax = Math.min(range.tMax, t2);
  if (tMin > tMax) return null;
  return { tMin, tMax };
}

function movePlayerBy(room, player, dx, dy) {
  moveEntityWithMapWalls(room, player, dx, dy, 32, getPlayerCollisionRadius(player));
}

function moveEnemyBy(room, enemy, dx, dy) {
  moveEntityWithMapWalls(room, enemy, dx, dy, 24, enemy.radius || 20);
}

function fallbackSeparationVector(a, b) {
  return collisionSystem.fallbackSeparationVector(a, b);
}

function hashCollisionId(value) {
  return collisionSystem.hashCollisionId(value);
}

function findFreeEnemySpawnPosition(room, preferredX, preferredY, radius) {
  const margin = radius + 10;
  let best = {
    x: clamp(preferredX, margin, room.world.w - margin),
    y: clamp(preferredY, margin, room.world.h - margin)
  };
  if (isCircleFree(room, best.x, best.y, radius)) return best;

  let bestScore = scoreCircleClearance(room, best.x, best.y, radius);
  const rings = [42, 76, 116, 164, 220, 292, 380, 480, 620];
  for (const ring of rings) {
    const steps = Math.max(10, Math.ceil((ring * Math.PI * 2) / Math.max(28, radius)));
    for (let i = 0; i < steps; i += 1) {
      const angle = (Math.PI * 2 * i) / steps + ring * 0.017;
      const x = clamp(preferredX + Math.cos(angle) * ring, margin, room.world.w - margin);
      const y = clamp(preferredY + Math.sin(angle) * ring, margin, room.world.h - margin);
      if (isCircleFree(room, x, y, radius)) return { x, y };
      const score = scoreCircleClearance(room, x, y, radius);
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
  }

  for (let i = 0; i < 48; i += 1) {
    const x = margin + Math.random() * Math.max(1, room.world.w - margin * 2);
    const y = margin + Math.random() * Math.max(1, room.world.h - margin * 2);
    if (isCircleFree(room, x, y, radius)) return { x, y };
    const score = scoreCircleClearance(room, x, y, radius);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }

  return best;
}

function isCircleFree(room, x, y, radius) {
  return scoreCircleClearance(room, x, y, radius) >= 0;
}

function scoreCircleClearance(room, x, y, radius) {
  let clearance = Infinity;
  for (const player of getActiveLivingPlayers(room)) {
    const minDist = radius + getPlayerCollisionRadius(player) + 5;
    clearance = Math.min(clearance, Math.hypot(x - player.x, y - player.y) - minDist);
  }
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const minDist = radius + enemy.radius + 4;
    clearance = Math.min(clearance, Math.hypot(x - enemy.x, y - enemy.y) - minDist);
  }
  for (const wall of getRoomCollisionWalls(room)) {
    clearance = Math.min(clearance, circleRectClearance(x, y, radius + 6, wall));
  }
  return clearance === Infinity ? 9999 : clearance;
}

function getEnemyMovementVector(room, enemy, target, dx, dy, dist) {
  const toward = normalizeVector(dx, dy);
  const side = {
    x: -toward.y * (enemy.orbitDir || 1),
    y: toward.x * (enemy.orbitDir || 1)
  };
  const predicted = predictPlayerPosition(room, enemy, target, Math.max(80, enemy.speed), 0.12, getEnemyAimAccuracy(room, enemy) * 0.55, false);
  const intercept = normalizeVector(predicted.x - enemy.x, predicted.y - enemy.y);
  const pulse = Math.sin(Date.now() / 520 + (enemy.aiPhase || 0)) * 0.12;

  if (enemy.tauntTimer > 0 && enemy.tauntTargetId === target.id) {
    if (dist <= enemy.radius + getPlayerCollisionRadius(target) + 18) {
      return normalizeVector(toward.x * 0.82 + side.x * 0.12, toward.y * 0.82 + side.y * 0.12);
    }
    return normalizeVector(intercept.x * 1.18 + side.x * 0.04, intercept.y * 1.18 + side.y * 0.04);
  }

  if (enemy.type === "spitter") {
    return kiteMovement(toward, side, dist, 360, 245, 540, 0.58 + pulse);
  }
  if (enemy.type === "mortar") {
    return kiteMovement(toward, side, dist, 560, 390, 720, 0.42 + pulse);
  }
  if (enemy.type === "sniper") {
    return kiteMovement(toward, side, dist, 650, 430, 800, 0.32 + pulse);
  }
  if (enemy.type === "shaman") {
    const ally = lowestHealthEnemyNear(room, enemy, 360);
    if (ally && distance(enemy, ally) > 170) {
      const toAlly = normalizeVector(ally.x - enemy.x, ally.y - enemy.y);
      return normalizeVector(toAlly.x * 0.74 - toward.x * 0.22 + side.x * 0.22, toAlly.y * 0.74 - toward.y * 0.22 + side.y * 0.22);
    }
    return kiteMovement(toward, side, dist, 300, 210, 420, 0.38 + pulse);
  }
  if (enemy.type === "guardian") {
    if (dist < 92) return normalizeVector(-toward.x * 0.45 + side.x * 0.35, -toward.y * 0.45 + side.y * 0.35);
    return normalizeVector(intercept.x * 0.9 + side.x * 0.12, intercept.y * 0.9 + side.y * 0.12);
  }
  if (enemy.type === "stalker") {
    if (dist > 125) return normalizeVector(intercept.x * 0.55 + side.x * 0.72, intercept.y * 0.55 + side.y * 0.72);
    return normalizeVector(-toward.x * 0.25 + side.x * 0.85, -toward.y * 0.25 + side.y * 0.85);
  }
  if (enemy.type === "charger") {
    if (dist > 310) return normalizeVector(intercept.x * 0.75 + side.x * 0.32, intercept.y * 0.75 + side.y * 0.32);
    if (dist < 150) return normalizeVector(-toward.x * 0.24 + side.x * 0.55, -toward.y * 0.24 + side.y * 0.55);
    return normalizeVector(side.x * 0.7 + intercept.x * 0.18, side.y * 0.7 + intercept.y * 0.18);
  }
  if (enemy.type === "bomber") {
    return normalizeVector(intercept.x * 0.9 + side.x * 0.28, intercept.y * 0.9 + side.y * 0.28);
  }
  if (enemy.type === "bat") {
    if (dist <= enemy.radius + 32) return normalizeVector(toward.x * 0.42 + side.x * 0.18, toward.y * 0.42 + side.y * 0.18);
    if (dist < 130) return normalizeVector(toward.x * 0.82 + side.x * 0.24, toward.y * 0.82 + side.y * 0.24);
    return normalizeVector(intercept.x * 0.92 + side.x * 0.14, intercept.y * 0.92 + side.y * 0.14);
  }
  if (enemy.type === "slime" || enemy.type === "splinter" || enemy.type === "splitter") {
    if (dist <= enemy.radius + 34) return normalizeVector(toward.x * 0.5 + side.x * 0.12, toward.y * 0.5 + side.y * 0.12);
    if (dist < 120) return normalizeVector(toward.x * 0.86 + side.x * 0.16, toward.y * 0.86 + side.y * 0.16);
    return normalizeVector(intercept.x * 0.88 + side.x * 0.12, intercept.y * 0.88 + side.y * 0.12);
  }
  if (enemy.type === "brute") {
    if (dist <= enemy.radius + getPlayerCollisionRadius(target) + 58) {
      return normalizeVector(toward.x * 0.24 + side.x * 0.18, toward.y * 0.24 + side.y * 0.18);
    }
    return normalizeVector(intercept.x * 1.02 + side.x * 0.06, intercept.y * 1.02 + side.y * 0.06);
  }
  if (enemy.type === "boss") {
    if (dist <= enemy.radius + 42) return normalizeVector(toward.x * 0.48 + side.x * 0.08, toward.y * 0.48 + side.y * 0.08);
    return normalizeVector(intercept.x * 0.96 + side.x * 0.08, intercept.y * 0.96 + side.y * 0.08);
  }

  if (dist < 82) return normalizeVector(-toward.x * 0.18 + side.x * 0.42, -toward.y * 0.18 + side.y * 0.42);
  if (dist < 185) return normalizeVector(intercept.x * 0.72 + side.x * 0.28, intercept.y * 0.72 + side.y * 0.28);
  return normalizeVector(intercept.x, intercept.y);
}

function kiteMovement(toward, side, dist, ideal, min, max, strafeWeight) {
  if (dist < min) return normalizeVector(-toward.x * 0.9 + side.x * strafeWeight, -toward.y * 0.9 + side.y * strafeWeight);
  if (dist > max) return normalizeVector(toward.x * 0.86 + side.x * 0.18, toward.y * 0.86 + side.y * 0.18);
  const rangeCorrection = dist < ideal ? -0.2 : 0.12;
  return normalizeVector(toward.x * rangeCorrection + side.x * strafeWeight, toward.y * rangeCorrection + side.y * strafeWeight);
}

function predictPlayerPosition(room, enemy, target, projectileSpeed, windup = 0, accuracy = 0.6, jitter = true) {
  const velocity = getPlayerVelocity(target);
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const dist = Math.hypot(dx, dy);
  const travelTime = dist / Math.max(1, projectileSpeed);
  const maxLead = enemy.elite ? 1.05 : 0.82;
  const recentDashPenalty = Date.now() - (target.lastDashAt || 0) < 420 ? 0.58 : 1;
  const effectiveAccuracy = clamp(accuracy * recentDashPenalty, 0, 0.94);
  const leadTime = clamp(travelTime + windup, 0, maxLead);
  let x = target.x + velocity.x * leadTime * effectiveAccuracy;
  let y = target.y + velocity.y * leadTime * effectiveAccuracy;

  if (jitter) {
    const missRadius = (1 - effectiveAccuracy) * (enemy.type === "sniper" ? 48 : enemy.type === "charger" ? 68 : 84);
    const angle = Math.random() * Math.PI * 2;
    const amount = Math.random() * missRadius;
    x += Math.cos(angle) * amount;
    y += Math.sin(angle) * amount;
  }

  return {
    x: clamp(x, 32, room.world.w - 32),
    y: clamp(y, 32, room.world.h - 32)
  };
}

function getEnemyAimAccuracy(room, enemy) {
  const depth = room.activeMapNode?.depth || ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  let accuracy = 0.38 + Math.max(0, depth - 1) * 0.045 + Math.max(0, (room.floor || 1) - 1) * 0.055;
  if (enemy.type === "sniper") accuracy += 0.16;
  if (enemy.type === "mortar") accuracy += 0.08;
  if (enemy.type === "charger") accuracy -= 0.02;
  if (enemy.elite) accuracy += 0.12;
  if (enemy.affix === "frenzy") accuracy += 0.04;
  return clamp(accuracy, 0.32, 0.88);
}

function getPlayerVelocity(player) {
  const vx = Number.isFinite(player.vx) ? player.vx : 0;
  const vy = Number.isFinite(player.vy) ? player.vy : 0;
  const speed = Math.hypot(vx, vy);
  if (speed >= 12) return { x: vx, y: vy };

  const inputLength = Math.hypot(player.input?.mx || 0, player.input?.my || 0);
  if (inputLength <= 0.15) return { x: 0, y: 0 };

  const def = classes[player.classId] || classes.novice;
  const inputSpeed = def.speed * (player.speedMul || 1) * (player.dashSpeedMul || 1) * getEngineerMechaMoveMultiplier(player);
  return {
    x: ((player.input.mx || 0) / inputLength) * inputSpeed,
    y: ((player.input.my || 0) / inputLength) * inputSpeed
  };
}

function updatePlayerVelocity(player, prevX, prevY, dt) {
  if (!dt || dt <= 0) return;
  const rawVx = (player.x - prevX) / dt;
  const rawVy = (player.y - prevY) / dt;
  player.vx = (player.vx || 0) * 0.35 + rawVx * 0.65;
  player.vy = (player.vy || 0) * 0.35 + rawVy * 0.65;
}

function lowestHealthEnemyNear(room, point, maxDistance) {
  let best = null;
  let bestRatio = Infinity;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || enemy.id === point.id || distance(point, enemy) > maxDistance) continue;
    const ratio = enemy.hp / Math.max(1, enemy.maxHp);
    if (ratio < bestRatio) {
      bestRatio = ratio;
      best = enemy;
    }
  }
  return best;
}

function nearestLivingPlayer(room, point) {
  return enemySystem.nearestLivingPlayer(getActiveLivingPlayers(room), point);
}

function lowestHealthLivingPlayer(room) {
  return enemySystem.lowestHealthLivingPlayer(getActiveLivingPlayers(room));
}

function nearestEnemy(room, x, y, maxDistance) {
  return enemySystem.nearestEnemy(room.enemies, { x, y }, maxDistance);
}

function dealDamage(room, enemy, amount, ownerId, options = {}) {
  const owner = room.players.get(ownerId);
  const isBossTarget = enemy.type === "boss" || Boolean(enemy.bossId) || Boolean(enemy.miniBoss);
  let bossGateFailOpen = false;
  let finalDamage = amount;
  let critical = false;

  if (owner && (options.element === "poison" || options.element === "venom")) {
    finalDamage *= owner.poisonDamageMul || 1;
    finalDamage *= owner.statusDamageMul || 1;
  }
  if (owner && options.element === "burn") {
    finalDamage *= owner.burnDamageMul || 1;
    finalDamage *= owner.statusDamageMul || 1;
  }

  if (owner && !options.fixedDamage) {
    finalDamage *= getPlayerAttackPowerMultiplier(owner);
    finalDamage *= owner.damageMul;
    if (owner.classId === "mage" && options.skillTag) {
      finalDamage *= owner.skillDamageMul || 1;
    }
    if (
      owner.classId === "engineer" &&
      typeof options.skillTag === "string" &&
      (options.skillTag.startsWith("engineer_turret") || options.skillTag.startsWith("engineer_mine") || options.skillTag.startsWith("engineer_drone"))
    ) {
      finalDamage *= owner.constructDamageMul || 1;
    }
    finalDamage *= getClassDamageMultiplier(room, owner, enemy);
    if (owner.classId === "assassin" && !options.silent && !options.noAssassinMarkConsume && consumeAssassinMark(room, owner, enemy)) {
      finalDamage *= 1.5;
      options.assassinMarkConsumed = true;
    }
    if (owner.missingHpDamageBonus > 0) {
      const missingRatio = clamp(1 - owner.hp / Math.max(1, owner.maxHp), 0, 1);
      finalDamage *= 1 + missingRatio * owner.missingHpDamageBonus;
    }
    if ((enemy.elite || isBossTarget) && owner.eliteBossDamageMul) {
      finalDamage *= owner.eliteBossDamageMul;
    }
    if (
      isBossTarget &&
      (owner.bossFinisherThreshold || 0) > 0 &&
      enemy.hp / Math.max(1, enemy.maxHp) <= owner.bossFinisherThreshold
    ) {
      finalDamage *= owner.bossFinisherMul || 1;
    }
    const lowHpCrit = owner.hp <= owner.maxHp * 0.4 ? owner.lowHpCritBonus || 0 : 0;
    const critChance = options.forceCrit ? 1 : clamp((owner.crit || 0) + lowHpCrit, 0, 0.85);
    if (Math.random() < critChance) {
      const baseCritDamageMul = owner.classId === "ranger" || owner.classId === "assassin" ? 2 : 1.5;
      finalDamage *= baseCritDamageMul + Math.max(0, (owner.critDamageMul || 1) - 1);
      critical = true;
    }
  }

  if (!options.fixedDamage) {
    if (enemy.affix === "bulwark") finalDamage *= 0.84;
    if (enemy.vulnerableTimer > 0) finalDamage *= 1.22;
  }

  if (isBossTarget && bossSystem.isBossDamageLocked(enemy)) {
    startPendingBossPhaseTransition(room, enemy, owner);
    if (bossSystem.isBossDamageLocked(enemy)) {
      if ((Number(enemy.phaseTransitionTimer) || 0) > 0) return 0;
      bossGateFailOpen = true;
    }
  }

  let barrierBlocked = 0;
  if (!options.fixedDamage && enemy.barrier > 0 && finalDamage > 0) {
    barrierBlocked = Math.min(enemy.barrier, finalDamage);
    enemy.barrier = Math.max(0, enemy.barrier - barrierBlocked);
    finalDamage -= barrierBlocked;
    if (enemy.barrier <= 0) enemy.barrierTimer = 0;
    if (!options.silent) {
      addEffect(room, "shield", enemy.x, enemy.y, {
        value: Math.round(barrierBlocked),
        color: enemy.color || enemyDefs[enemy.type]?.color || "#93a4b8",
        radius: enemy.radius + 28,
        style: "enemy_barrier_block"
      });
    }
  }

  if (owner && enemy.hp > 0 && !options.silent && (finalDamage > 0 || barrierBlocked > 0)) {
    interruptEnemyCast(room, enemy, { allowBoss: Boolean(options.interruptBossCast) });
  }

  if (finalDamage <= 0) return 0;

  if (isBossTarget && !bossGateFailOpen) {
    finalDamage = bossSystem.getBossDamageAllowance(enemy, finalDamage);
    if (finalDamage <= 0) return 0;
  }

  const appliedDamage = Math.min(Math.max(0, enemy.hp), finalDamage);
  enemy.hp -= finalDamage;
  if (isBossTarget && enemy.hp > 0) startPendingBossPhaseTransition(room, enemy, owner);
  if (room.status === "lobby" && enemy.trainingDummy) {
    recordTrainingDummyDamage(enemy, finalDamage, Date.now());
  }
  if (owner && appliedDamage > 0) {
    const stats = owner.runStats || (owner.runStats = createEmptyRunStats());
    stats.damage += appliedDamage;
    if (options.element === "poison") stats.poisonDamage += appliedDamage;
    if (options.element === "burn") stats.burnDamage += appliedDamage;
  }
  if (owner && !options.noOnHit) applyClassOnHit(room, owner, enemy, finalDamage, options);
  if (!options.silent) {
    addEffect(room, "damage", enemy.x, enemy.y - enemy.radius, {
      value: Math.max(1, Math.round(finalDamage)),
      critical,
      color: critical ? "#facc15" : "#f6f1e8"
    });
    const damageRatio = finalDamage / Math.max(1, enemy.maxHp || finalDamage);
    const heavyHit = critical || damageRatio >= 0.08 || finalDamage >= 28;
    addEffect(room, "impact", enemy.x, enemy.y, {
      color: critical ? "#facc15" : owner ? classes[owner.classId]?.color || "#f6f1e8" : "#f6f1e8",
      radius: enemy.radius + Math.min(42, 14 + finalDamage * 0.32),
      style: critical ? "critical_hit" : heavyHit ? "heavy_hit" : "enemy_hit",
      targetId: enemy.id,
      heavy: heavyHit,
      critical,
      duration: critical ? 0.44 : heavyHit ? 0.36 : 0.28
    });
  }

  if (options.knockback && owner) {
    const dx = enemy.x - owner.x;
    const dy = enemy.y - owner.y;
    const dist = Math.hypot(dx, dy) || 1;
    const recoil = options.knockback * 0.08;
    startEnemyKnockback(room, enemy, dx / dist, dy / dist, recoil, {
      duration: clamp(recoil / 180, 0.08, 0.16),
      maxDistance: 58,
      style: "hit_recoil"
    });
  }

  if (owner && owner.lifeSteal > 0 && !options.noLifeSteal) {
    owner.hp = Math.min(owner.maxHp, owner.hp + finalDamage * owner.lifeSteal);
  }

  if (enemy.hp <= 0 && !enemy.dead) {
    if (room.status === "lobby" && enemy.trainingDummy) {
      enemy.hp = enemy.maxHp;
      addEffect(room, "shield", enemy.x, enemy.y, {
        color: enemy.color || enemyDefs.training_dummy.color,
        radius: enemy.radius + 24,
        style: "training_reset"
      });
      return finalDamage;
    }
    enemy.dead = true;
    addEffect(room, "death", enemy.x, enemy.y, {
      color: enemy.color || enemyDefs[enemy.type].color,
      radius: enemy.radius + 18
    });
    recordEnemyDefeatDiscovery(room, enemy);
    if (enemy.type === "boss" || enemy.bossId) {
      const bossId = String(enemy.bossId || "");
      if (bossId) {
        if (!Array.isArray(room.runBossDefeats)) room.runBossDefeats = [];
        if (!room.runBossDefeats.includes(bossId)) room.runBossDefeats.push(bossId);
      }
    }
    if (owner) {
      const stats = owner.runStats || (owner.runStats = createEmptyRunStats());
      stats.kills += 1;
      if (enemy.elite) stats.eliteKills += 1;
      if (enemy.type === "boss" || enemy.bossId) {
        stats.bossKills += 1;
        const bossId = String(enemy.bossId || "");
        if (bossId && !stats.bossDefeats.includes(bossId)) stats.bossDefeats.push(bossId);
      }
      if (typeof options.skillTag === "string" && options.skillTag.startsWith("engineer_turret")) {
        stats.turretKills += 1;
        const extension = Math.max(0, owner.turretKillDurationBonus || 0);
        if (extension > 0) {
          for (const hazard of room.hazards) {
            if (hazard.ownerId === owner.id && hazard.type === "engineer_turret" && !hazard.dead) {
              hazard.timer = Math.min(45, hazard.timer + extension);
            }
          }
        }
      }
      if (options.skillTag === "ranger_pierce" && hasUpgrade(owner, "ranger_pierce_momentum")) {
        const previousKills = Math.max(0, owner.rangerPierceKills || 0);
        const growth = previousKills < RANGER_PIERCE_GROWTH_FULL_KILLS
          ? 2
          : previousKills < RANGER_PIERCE_GROWTH_HALF_KILLS
            ? 1
            : 0.5;
        owner.rangerPierceKills = previousKills + 1;
        owner.rangerPierceDamageBonus = Math.min(
          RANGER_PIERCE_GROWTH_CAP + Math.max(0, owner.rangerPierceCapBonus || 0),
          Math.max(0, owner.rangerPierceDamageBonus || 0) + growth
        );
        addEffect(room, "impact", owner.x, owner.y, {
          color: classes.ranger.color,
          radius: 54 + Math.min(14, owner.rangerPierceKills) * 4,
          style: "ranger_pierce_growth"
        });
      }
      if (options.skillTag === "mage_meteor" && hasUpgrade(owner, "mage_meteor_growth")) {
        owner.mageMeteorGrowthStacks = Math.max(0, owner.mageMeteorGrowthStacks || 0) + 1;
        addEffect(room, "impact", owner.x, owner.y, {
          color: classes.mage.color,
          radius: 58 + Math.min(90, owner.mageMeteorGrowthStacks * 1.5),
          style: "mage_growth"
        });
      }
      applyRelicOnKill(room, owner, enemy);
      spreadEquipmentPoisonOnDeath(room, owner, enemy);
    }
    dropXpOrb(room, enemy, ownerId);
    maybeDropFieldPickup(room, enemy);
    if (enemy.elite && enemy.affix === "volatile") explodeEliteDeath(room, enemy);
    if (enemy.type === "splitter") splitEnemy(room, enemy);
    maybeDropRelicChest(room, enemy, ownerId);
  }
  return finalDamage;
}

function spreadEquipmentPoisonOnDeath(room, owner, enemy) {
  if (!owner?.poisonSpread) return;
  const poisoned = (enemy.poisonTimer || 0) > 0 && (enemy.poisonDotStacks || 0) > 0;
  const venomous = (enemy.venomTimer || 0) > 0;
  if (!poisoned && !venomous) return;
  const radius = 220 * (owner.areaMul || 1);
  let infected = 0;
  for (const nearby of room.enemies) {
    if (nearby.id === enemy.id || nearby.hp <= 0 || distance(enemy, nearby) > radius + nearby.radius) continue;
    const stackChange = applyPoisonToEnemy(nearby, owner.id, {
      duration: 3.2 * (owner.poisonDurationMul || 1),
      stacks: 1,
      maxStacks: ENEMY_POISON_MAX_STACKS + Math.max(0, owner.poisonStackCapBonus || 0)
    });
    showPoisonStackEffect(room, nearby, stackChange);
    if (venomous) applyVenomToEnemy(room, nearby, owner.id, { duration: 2.5 });
    infected += 1;
    if (infected >= 6) break;
  }
  if (infected > 0) {
    addEffect(room, "poison", enemy.x, enemy.y, {
      color: venomous ? "#c084fc" : "#9aa15f",
      radius,
      style: "equipment_poison_spread"
    });
  }
}

function recordTrainingDummyDamage(dummy, damage, now = Date.now()) {
  const dealt = Math.max(0, Number(damage) || 0);
  if (!dummy?.trainingDummy || dealt <= 0) return;
  const cutoff = now - 5000;
  const samples = Array.isArray(dummy.trainingDamageSamples)
    ? dummy.trainingDamageSamples.filter((sample) => Number(sample?.at) >= cutoff)
    : [];
  samples.push({ at: now, damage: dealt });
  dummy.trainingDamageSamples = samples;
  dummy.trainingDamageTotal = Math.max(0, Number(dummy.trainingDamageTotal) || 0) + dealt;
  dummy.trainingLastHitAt = now;
}

function interruptEnemyCast(room, enemy, options = {}) {
  const result = enemySystem.interruptEnemyWindup(enemy, {
    allowBoss: Boolean(options.allowBoss),
    isEliteSpecialWindup,
    getEliteSpecialCooldown
  });
  if (!result.interrupted) return false;

  addEffect(room, "impact", enemy.x, enemy.y, {
    color: enemy.color || enemyDefs[enemy.type]?.color || "#f6f1e8",
    radius: enemy.radius + 30,
    style: "cast_interrupt"
  });
  return true;
}

function applyRelicOnKill(room, owner, enemy) {
  if (!owner || owner.hp <= 0) return;

  if (owner.onKillHeal > 0 && owner.hp < owner.maxHp) {
    const heal = owner.maxHp * owner.onKillHeal * (owner.healingMul || 1);
    owner.hp = Math.min(owner.maxHp, owner.hp + heal);
    addEffect(room, "heal", owner.x, owner.y, { value: Math.round(heal), color: classes[owner.classId].color });
  }

  if (owner.onKillCooldownRefund > 0) {
    const refund = owner.onKillCooldownRefund;
    owner.attackTimer = Math.max(0, owner.attackTimer - refund * 0.55);
    owner.dashTimer = Math.max(0, owner.dashTimer - refund * 0.55);
    owner.dashRechargeTimer = Math.max(0, (owner.dashRechargeTimer || 0) - refund * 0.55);
    for (const slot of SKILL_SLOTS) {
      owner.skillTimers[slot] = Math.max(0, owner.skillTimers[slot] - refund);
    }
  }

  if (owner.onKillTeamHeal > 0) {
    for (const ally of getActiveLivingPlayers(room)) {
      if (ally.hp >= ally.maxHp) continue;
      const heal = ally.maxHp * owner.onKillTeamHeal * (owner.healingMul || 1);
      ally.hp = Math.min(ally.maxHp, ally.hp + heal);
      addEffect(room, "heal", ally.x, ally.y, { value: Math.round(heal), color: classes[owner.classId].color });
    }
  }
}

function splitEnemy(room, enemy) {
  const count = enemy.elite ? 3 : 2;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
    spawnEnemy(room, "splinter", {
      x: enemy.x + Math.cos(angle) * 28,
      y: enemy.y + Math.sin(angle) * 28,
      scale: enemy.elite ? 0.95 : 0.78,
      xpMul: 0.45
    });
  }
  addEffect(room, "explosion", enemy.x, enemy.y, { color: enemyDefs.splitter.color, radius: enemy.radius + 30, style: "splitter_pop" });
}

function dropXpOrb(room, enemy, ownerId) {
  if (!enemy || enemy.xp <= 0) return;
  if (!room.xpOrbs) room.xpOrbs = [];
  const pieces = enemy.elite || enemy.type === "boss" ? 3 : enemy.xp >= 35 ? 2 : 1;
  const base = Math.floor(enemy.xp / pieces);
  let remaining = enemy.xp;
  for (let i = 0; i < pieces; i += 1) {
    const value = i === pieces - 1 ? remaining : base;
    remaining -= value;
    const angle = Math.random() * Math.PI * 2;
    const spread = 12 + Math.random() * 24;
    const orb = {
      id: nextXpOrbId++,
      x: clamp(enemy.x + Math.cos(angle) * spread, 20, room.world.w - 20),
      y: clamp(enemy.y + Math.sin(angle) * spread, 20, room.world.h - 20),
      vx: Math.cos(angle) * (50 + Math.random() * 70),
      vy: Math.sin(angle) * (50 + Math.random() * 70),
      value,
      radius: enemy.elite || enemy.type === "boss" ? 13 : 10,
      ownerId,
      dead: false
    };
    const liveCount = room.xpOrbs.length;
    if (liveCount >= XP_ORB_SOFT_CAP) {
      let mergeTarget = null;
      let bestDistanceSq = liveCount >= XP_ORB_HARD_CAP ? Infinity : XP_ORB_MERGE_RADIUS * XP_ORB_MERGE_RADIUS;
      for (const existing of room.xpOrbs) {
        if (existing.dead) continue;
        const dx = existing.x - orb.x;
        const dy = existing.y - orb.y;
        const distanceSq = dx * dx + dy * dy;
        if (distanceSq >= bestDistanceSq) continue;
        bestDistanceSq = distanceSq;
        mergeTarget = existing;
      }
      if (mergeTarget) {
        mergeTarget.value += orb.value;
        mergeTarget.radius = Math.min(16, Math.max(mergeTarget.radius || 10, 10 + Math.log2(Math.max(1, mergeTarget.value)) * 0.45));
        continue;
      }
    }
    room.xpOrbs.push(orb);
  }
}

function getClassDamageMultiplier(room, owner, enemy) {
  return 1;
}

function applyClassOnHit(room, owner, enemy, finalDamage, options = {}) {
  return;
}

function explodeEliteDeath(room, enemy) {
  const radius = 116;
  addEffect(room, "explosion", enemy.x, enemy.y, { color: enemyDefs[enemy.type].color, radius });
  for (const player of getActiveLivingPlayers(room)) {
    if (distance(enemy, player) > radius + getPlayerCollisionRadius(player)) continue;
    damagePlayer(room, player, enemy.damage * 0.75, enemy.id, player.x, player.y, {
      damageType: "elite_death_explosion",
      knockbackOrigin: { x: enemy.x, y: enemy.y }
    });
  }
}

function applyPoisonToPlayer(player, dps, duration, ownerId, options = {}) {
  if (!isActivePlayer(player) || player.hp <= 0 || player.immunityTimer > 0) return;
  const nextDps = Math.max(0, dps || 0);
  const wasInactive = player.poisonTimer <= 0;
  const stackable = Boolean(options.stack);
  const maxStacks = Math.max(1, Math.floor(options.maxStacks || 3));
  const currentStacks = wasInactive ? 0 : Math.max(1, Math.floor(player.poisonStacks || 1));
  const nextStacks = stackable ? Math.min(maxStacks, currentStacks + 1) : Math.max(1, currentStacks);
  const currentBaseDps = wasInactive ? 0 : Math.max(0, player.poisonBaseDps || player.poisonDps || 0);
  const nextBaseDps = Math.max(currentBaseDps, nextDps);
  const nextTotalDps = stackable ? nextBaseDps * nextStacks : Math.max(player.poisonDps || 0, nextDps);
  const stronger = nextTotalDps > (player.poisonDps || 0);
  player.poisonTimer = Math.max(player.poisonTimer || 0, duration || 0);
  player.poisonBaseDps = nextBaseDps;
  player.poisonStacks = nextStacks;
  player.poisonDps = nextTotalDps;
  player.poisonOwnerId = ownerId;
  if (wasInactive || stronger || !player.poisonTickTimer) {
    player.poisonTickTimer = PLAYER_POISON_TICK_INTERVAL;
  }
}

function clearPlayerPoison(player) {
  player.poisonTimer = 0;
  player.poisonDps = 0;
  player.poisonBaseDps = 0;
  player.poisonStacks = 0;
  player.poisonTickTimer = 0;
  player.poisonOwnerId = null;
}

function getIncomingPlayerKnockbackAmount(player, sourceEnemy, finalDamage, options = {}) {
  if (options.noKnockback || options.poison || options.damageType === "poison_tick") return 0;
  const type = options.damageType || "";
  if (
    type === "acid_pool" ||
    type === "hive_acid_pool" ||
    type === "elite_mine" ||
    type === "venom_spit" ||
    type === "elite_volley" ||
    type === "hive_venom_ring" ||
    type === "mini_plague_spit" ||
    type === "mini_shuriken" ||
    type === "stalker_shuriken" ||
    type === "spit"
  ) {
    return 0;
  }
  if (Number.isFinite(options.knockback)) return options.knockback;

  const bossPhase = Math.max(1, sourceEnemy?.bossPhase || 1);
  const heavyDamage = finalDamage >= Math.max(1, player.maxHp || 1) * 0.16;
  const table = {
    boss_charge: 132,
    elite_charge: 108,
    charge_hit: 84,
    boss_shockwave: sourceEnemy?.miniBoss ? 62 : bossPhase >= 3 ? 98 : bossPhase >= 2 ? 84 : 72,
    boss_beam: bossPhase >= 3 ? 90 : 76,
    boss_blast: bossPhase >= 3 ? 102 : 82,
    boss_projectile_ring: 36,
    void_ring: 38,
    void_split_shot: 46,
    elite_slam: 86,
    elite_screech: 58,
    elite_quake: 76,
    elite_crossfire: 58,
    elite_death_explosion: 70,
    mini_cleave: 66,
    mini_shadow_stab: 76,
    brute_swing: sourceEnemy?.elite ? 62 : 46,
    stalker_stab: sourceEnemy?.elite ? 54 : 38,
    bomber_explode: sourceEnemy?.elite ? 116 : 92,
    mortar_blast: sourceEnemy?.elite ? 72 : 52,
    sniper_bolt: sourceEnemy?.elite ? 50 : 34
  };

  if (Number.isFinite(table[type])) return table[type];
  if (heavyDamage && (sourceEnemy?.elite || sourceEnemy?.type === "boss")) return 44;
  return 0;
}

function getIncomingPlayerKnockbackDirection(player, sourceEnemy, x, y, options = {}) {
  if (Number.isFinite(options.knockbackDirX) || Number.isFinite(options.knockbackDirY)) {
    return normalizeVector(Number(options.knockbackDirX) || 0, Number(options.knockbackDirY) || 0);
  }
  if (options.knockbackOrigin && Number.isFinite(options.knockbackOrigin.x) && Number.isFinite(options.knockbackOrigin.y)) {
    return normalizeVector(player.x - options.knockbackOrigin.x, player.y - options.knockbackOrigin.y);
  }
  if (sourceEnemy && Number.isFinite(sourceEnemy.x) && Number.isFinite(sourceEnemy.y)) {
    return normalizeVector(player.x - sourceEnemy.x, player.y - sourceEnemy.y);
  }
  return normalizeVector(player.x - x, player.y - y);
}

function getIncomingPlayerKnockbackStyle(options = {}) {
  const type = options.damageType || "";
  if (type === "boss_shockwave" || type === "elite_screech") return "shockwave_push";
  if (type === "boss_charge" || type === "elite_charge" || type === "charge_hit") return "charge_hit";
  return "player_knockback";
}

function damagePlayer(room, player, amount, sourceId, x, y, options = {}) {
  if (!isActivePlayer(player) || player.hp <= 0 || player.immunityTimer > 0) return 0;
  if (shouldUsePlayerHitIFrames(options) && (player.hitIFrameTimer || 0) > 0) return 0;
  const sourceEnemy = room.enemies.find((enemy) => enemy.id === sourceId);
  const effectiveArmor = player.armorLockZero ? 0 : (player.armor || 0) + getEngineerMechaArmorBonus(player);
  let finalDamage = Math.max(1, amount - effectiveArmor);
  if (sourceEnemy?.weakenTimer > 0) finalDamage *= 0.76;
  if (player.tauntGuardTimer > 0) {
    finalDamage *= hasUpgrade(player, "warrior_taunt_bastion") ? 0.48 : WARRIOR_TAUNT_DAMAGE_MUL;
  }
  finalDamage = capIncomingPlayerDamage(player, finalDamage, sourceEnemy, options);

  if (player.shield > 0) {
    const blocked = Math.min(player.shield, finalDamage);
    player.shield -= blocked;
    finalDamage -= blocked;
    addEffect(room, "shield", player.x, player.y, { value: Math.round(blocked), color: classes[player.classId]?.color || player.color, radius: 42 });
  }

  if (finalDamage <= 0) return 0;
  player.hp = Math.max(0, player.hp - finalDamage);
  if (
    player.hp > 0 &&
    !player.lowHpShieldUsed &&
    (player.lowHpShieldRatio || 0) > 0 &&
    player.hp <= player.maxHp * 0.35
  ) {
    player.lowHpShieldUsed = true;
    player.shield = Math.max(player.shield, Math.round(player.maxHp * player.lowHpShieldRatio));
    player.shieldTimer = Math.max(player.shieldTimer || 0, 6);
    addEffect(room, "shield", player.x, player.y, {
      value: Math.round(player.shield),
      color: classes[player.classId]?.color || "#93c5fd",
      radius: 54,
      style: "equipment_last_guard"
    });
  }
  if (shouldUsePlayerHitIFrames(options)) {
    player.hitIFrameTimer = Math.max(player.hitIFrameTimer || 0, getPlayerHitIFrameDuration(options));
  }
  const knockbackAmount = getIncomingPlayerKnockbackAmount(player, sourceEnemy, finalDamage, options);
  if (knockbackAmount > 0) {
    const dir = getIncomingPlayerKnockbackDirection(player, sourceEnemy, x, y, options);
    startPlayerKnockback(room, player, dir.x, dir.y, knockbackAmount, {
      style: getIncomingPlayerKnockbackStyle(options),
      duration: options.knockbackDuration,
      maxDistance: options.knockbackMaxDistance,
      interruptDash: options.interruptDash
    });
  }
  if (sourceEnemy?.affix === "venom" && player.immunityTimer <= 0) {
    applyPoisonToPlayer(player, 1.05 + room.wave * 0.12, 2.4, sourceId);
  }
  addEffect(room, options.poison ? "poison" : "damage", x, y, {
    value: Math.max(1, Math.round(finalDamage)),
    color: options.poison ? "#9aa15f" : "#c85d56"
  });
  addEffect(room, "impact", player.x, player.y, {
    color: options.poison ? "#9aa15f" : "#ef4444",
    radius: getPlayerCollisionRadius(player) + Math.min(30, 16 + finalDamage * 0.42),
    style: options.poison ? "player_poison_hit" : "player_hit",
    playerId: player.id,
    heavy: finalDamage >= player.maxHp * 0.16,
    duration: 0.32
  });

  if (sourceEnemy && sourceEnemy.hp > 0 && player.thornsMul > 0 && !options.reflected) {
    const reflected = finalDamage * player.thornsMul;
    dealDamage(room, sourceEnemy, reflected, player.id, {
      silent: true,
      fixedDamage: true,
      noLifeSteal: true,
      reflected: true
    });
    addEffect(room, "impact", sourceEnemy.x, sourceEnemy.y, {
      color: classes[player.classId].color,
      radius: sourceEnemy.radius + 22,
      style: "thorn_reflect"
    });
  }

  if (player.hp <= 0 && (player.deathSaveCharges || 0) > 0) {
    player.deathSaveCharges -= 1;
    player.hp = Math.max(1, Math.round(player.maxHp * Math.max(0.25, player.deathSaveHealRatio || 0.45)));
    player.shield = Math.max(player.shield, Math.round(player.maxHp * 0.42));
    player.shieldTimer = Math.max(player.shieldTimer, 5.5);
    player.immunityTimer = Math.max(player.immunityTimer, 1.35);
    clearPlayerPoison(player);
    addEffect(room, "revive", player.x, player.y, {
      color: classes[player.classId].color,
      radius: 92,
      style: "phoenix_heart"
    });
    pushEvent(room, `${player.name} 불사조 심장으로 생존.`);
    return finalDamage;
  }

  if (player.hp <= 0 && !player.downedAt) {
    const stats = player.runStats || (player.runStats = createEmptyRunStats());
    stats.downs += 1;
    player.downedAt = Date.now();
    player.dashMove = null;
    player.knockbackMove = null;
    clearPlayerPoison(player);
    addEffect(room, "death", player.x, player.y, { color: classes[player.classId].color, radius: 58 });
    pushEvent(room, `${player.name} 님이 쓰러졌습니다.`);
  }
  return finalDamage;
}

function shouldUsePlayerHitIFrames(options = {}) {
  if (options.ignoreIFrames || options.reflected || options.damageType === "poison_tick") return false;
  return true;
}

function getPlayerHitIFrameDuration(options = {}) {
  if (options.damageType === "boss_beam" || options.damageType === "boss_blast" || options.damageType === "boss_shockwave") return PLAYER_HAZARD_IFRAME_DURATION;
  if (options.hazard) return PLAYER_HAZARD_IFRAME_DURATION;
  return PLAYER_HIT_IFRAME_DURATION;
}

function capIncomingPlayerDamage(player, damage, sourceEnemy, options = {}) {
  if (!options.projectile && !options.hazard && !options.ranged) return damage;

  const maxHp = Math.max(1, player.maxHp || 1);
  if (sourceEnemy?.executionBoss) return Math.min(damage, Math.max(12, maxHp * 0.78));
  const type = options.damageType || "";
  let capRatio = sourceEnemy?.elite ? 0.25 : 0.2;

  if (type === "sniper_bolt") {
    capRatio = sourceEnemy?.elite ? 0.32 : 0.24;
  } else if (type === "boss_beam") {
    capRatio = sourceEnemy?.bossPhase >= 3 ? 0.34 : sourceEnemy?.bossPhase >= 2 ? 0.3 : 0.26;
  } else if (type === "boss_blast") {
    capRatio = sourceEnemy?.bossPhase >= 3 ? 0.3 : sourceEnemy?.bossPhase >= 2 ? 0.26 : 0.22;
  } else if (type === "boss_shockwave") {
    capRatio = sourceEnemy?.miniBoss ? 0.2 : sourceEnemy?.bossPhase >= 3 ? 0.28 : sourceEnemy?.bossPhase >= 2 ? 0.24 : 0.2;
  } else if (type === "acid_pool" || options.hazard) {
    capRatio = sourceEnemy?.elite ? 0.14 : 0.1;
  } else if (type === "void_split_shot") {
    capRatio = sourceEnemy?.bossPhase >= 3 ? 0.24 : 0.2;
  } else if (type === "venom_spit") {
    capRatio = sourceEnemy?.elite ? 0.22 : 0.17;
  }

  return Math.min(damage, Math.max(6, maxHp * capRatio));
}

function grantXp(room, ownerId, xp) {
  const xpMul = room.activeRisk ? room.activeRisk.xpMul : 1;
  let shouldPauseForAdvancement = false;
  for (const player of getActiveLivingPlayers(room)) {
    const baseAmount = player.id === ownerId ? xp : Math.ceil(xp * XP_ASSIST_SHARE);
    const amount = Math.ceil(baseAmount * xpMul);
    player.score += amount;

    if (player.level >= MAX_PLAYER_LEVEL) {
      player.xp = 0;
      continue;
    }

    player.xp += amount;
    while (player.level < MAX_PLAYER_LEVEL && player.xp >= xpToNext(player.level)) {
      player.xp -= xpToNext(player.level);
      player.level += 1;
      const hadChoices = player.pendingSkillChoices.length > 0;
      assignAdvancementChoices(player);
      if (!hadChoices && player.pendingSkillChoices.length > 0) {
        shouldPauseForAdvancement = true;
      }
      pushEvent(room, `${player.name} 님이 ${player.level}레벨이 되었습니다.`);
    }

    if (player.level >= MAX_PLAYER_LEVEL) {
      player.xp = 0;
    }
  }
  if (shouldPauseForAdvancement) {
    enterAdvancementChoice(room);
  }
}

function collectRemainingXpOrbs(room) {
  const orbs = (room.xpOrbs || []).filter((orb) => !orb.dead);
  if (orbs.length === 0) return { xpOrbs: 0, xpTotal: 0 };

  const xpTotal = orbs.reduce((sum, orb) => sum + (orb.value || 0), 0);
  for (const orb of orbs) {
    const target = nearestLivingPlayer(room, orb);
    if (!target) continue;
    collectXpOrb(room, orb, target);
  }
  room.xpOrbs = [];
  pushEvent(room, `남은 경험치 ${orbs.length}개를 자동 회수했습니다.`);
  return { xpOrbs: orbs.length, xpTotal };
}

function getStageRewardProfile(room, stageKind = getActiveStageKind(room)) {
  const depth = room.activeMapNode?.depth || ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  const chapter = Math.max(1, room.floor || 1);
  const base = STAGE_REWARD_RULES[stageKind] || STAGE_REWARD_RULES.combat;
  const preview = getStageRewardPreview(stageKind, chapter, depth);
  return {
    ...base,
    ...preview
  };
}

function getStageChestLimit(room, stageKind = getActiveStageKind(room)) {
  return dataRegistry.getStageChestLimit(stageKind);
}

function awardStageClearXp(room, profile) {
  const amount = Math.max(0, Math.round(profile.clearXp || 0));
  if (amount <= 0) return 0;

  const xpMul = room.activeRisk ? room.activeRisk.xpMul : 1;
  let shouldPauseForAdvancement = false;
  for (const player of getActiveLivingPlayers(room)) {
    const awarded = Math.ceil(amount * xpMul);
    player.score += awarded;

    if (player.level >= MAX_PLAYER_LEVEL) {
      player.xp = 0;
      continue;
    }

    player.xp += awarded;
    while (player.level < MAX_PLAYER_LEVEL && player.xp >= xpToNext(player.level)) {
      player.xp -= xpToNext(player.level);
      player.level += 1;
      const hadChoices = player.pendingSkillChoices.length > 0;
      assignAdvancementChoices(player);
      if (!hadChoices && player.pendingSkillChoices.length > 0) {
        shouldPauseForAdvancement = true;
      }
      pushEvent(room, `${player.name} leveled up to ${player.level}.`);
    }

    if (player.level >= MAX_PLAYER_LEVEL) {
      player.xp = 0;
    }
  }

  if (shouldPauseForAdvancement) {
    enterAdvancementChoice(room);
  }
  return Math.ceil(amount * xpMul);
}

function dropStageRewardChests(room, profile) {
  const stageKind = getActiveStageKind(room);
  if (stageKind === "reward") return 0;

  const limit = getStageChestLimit(room, stageKind);
  const liveCount = (room.relicChests || []).filter((chest) => !chest.dead).length;
  const count = Math.max(0, Math.min(profile.clearChest || 0, limit - liveCount));
  for (let i = 0; i < count; i += 1) {
    const angle = room.wave * 0.9 + i * Math.PI * 0.78;
    const radius = 46 + i * 18;
    const x = clamp(room.world.w / 2 + Math.cos(angle) * radius, 54, room.world.w - 54);
    const y = clamp(room.world.h / 2 + Math.sin(angle) * radius, 54, room.world.h - 54);
    room.relicChests.push({
      id: nextChestId++,
      x,
      y,
      radius: 24,
      stageReward: true,
      dead: false
    });
    addEffect(room, "chest", x, y, { color: "#facc15", radius: 62, style: "stage_reward" });
  }
  return count;
}

function beginStageClear(room) {
  const existing = room.clearSummary;
  if (existing && existing.stage === room.wave && existing.chapter === room.floor) return existing;

  const xp = collectRemainingXpOrbs(room);
  const rewardProfile = getStageRewardProfile(room);
  const stageXp = awardStageClearXp(room, rewardProfile);
  const rewardChests = dropStageRewardChests(room, rewardProfile);
  const chests = (room.relicChests || []).filter((chest) => !chest.dead).length;
  const summary = {
    chapter: room.floor,
    stage: room.wave,
    xpOrbs: xp.xpOrbs,
    xpTotal: xp.xpTotal,
    stageXp,
    rewardChests,
    chests,
    relicChoice: chests > 0,
    reward: {
      label: rewardProfile.label,
      chestBonus: round2(rewardProfile.chestBonus || 0)
    },
    createdAt: Date.now()
  };
  room.clearSummary = summary;
  return summary;
}

function clearSummaryView(summary) {
  if (!summary) return null;
  return {
    chapter: summary.chapter,
    stage: summary.stage,
    xpOrbs: summary.xpOrbs || 0,
    xpTotal: summary.xpTotal || 0,
    stageXp: summary.stageXp || 0,
    rewardChests: summary.rewardChests || 0,
    chests: summary.chests || 0,
    relicChoice: Boolean(summary.relicChoice),
    reward: summary.reward || null
  };
}

function enterAutoRelicChoice(room, summary = null) {
  const liveChests = (room.relicChests || []).filter((chest) => !chest.dead);
  if (liveChests.length === 0) return false;

  const livingPlayers = getActiveLivingPlayers(room);
  if (livingPlayers.length === 0) return false;

  for (const chest of liveChests) {
    chest.dead = true;
    addEffect(room, "chest", chest.x, chest.y, { color: "#facc15", radius: 88 });
  }

  if (summary) {
    summary.chests = liveChests.length;
    summary.relicChoice = true;
    room.clearSummary = summary;
  }

  room.status = "choice";
  room.choiceDeadline = Date.now() + RELIC_CHOICE_TIMEOUT_MS;
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.pendingReinforcements = [];

  rewardSystem.beginRelicChoiceForPlayers(livingPlayers, (player) => pickRelics(room, player));

  pushEvent(room, `스테이지 클리어 보상으로 유물 상자 ${liveChests.length}개를 자동 회수했습니다.`);
  return true;
}

function completeWave(room) {
  const clearSummary = beginStageClear(room);
  if (room.status === "advancement") return;
  if (enterAutoRelicChoice(room, clearSummary)) return;

  roomManager.clearStageCombatObjects(room);

  let bonusHeal = 0;
  for (const player of getActivePlayers(room)) {
    bonusHeal = Math.max(bonusHeal, player.clearHealBonus);
  }

  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) {
      player.hp = Math.max(1, Math.floor(player.maxHp * STAGE_CLEAR_REVIVE_RATIO));
      player.downedAt = 0;
    }
    if (!room.activeRisk || !room.activeRisk.noClearHeal) {
      player.hp = Math.min(
        player.maxHp,
        player.hp + player.maxHp * (STAGE_CLEAR_HEAL_RATIO + bonusHeal * 0.55) * (player.healingMul || 1)
      );
    }
    player.choicePending = false;
    player.choices = [];
  }

  if (isFinalStageCleared(room)) {
    if (room.floor >= MAX_CHAPTERS) {
      enterAbyssDecision(room);
      return;
    }
    startNextChapter(room);
    return;
  }

  pushEvent(room, `${room.wave} 스테이지 클리어. 지도에서 다음 방을 고르세요.`);
  enterMapChoice(room);
}

function isFinalStageCleared(room) {
  return stageSystem.isFinalStageCleared(room);
}

function startNextChapter(room) {
  const clearedChapter = room.floor;
  room.floor += 1;
  room.stageMap = generateStageMap(room.floor, () => nextRoomRandom(room));
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapPath = [];
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  room.killsSinceChest = 0;
  room.threatLevel = 1 + (room.floor - 1) * 0.12;
  room.stageObjective = null;
  pushEvent(room, `${clearedChapter}챕터 클리어. ${room.floor}챕터 지도가 열렸습니다.`);
  startSurvivalMode(room);
}

function getFieldEquipmentRewardState(room) {
  const elapsed = Math.max(0, Number(room.survival?.elapsed) || 0);
  const progress = clamp(elapsed / SURVIVAL_DURATION_SEC, 0, 1);
  const selectedAscension = Math.max(0, Math.floor(Number(room.ascensionLevel) || 0));
  const ascensionLevel = Math.floor(selectedAscension * progress);
  const timeRarityCap = elapsed < 180 ? "rare" : elapsed < 360 ? "epic" : elapsed < 450 ? "legendary" : elapsed < 510 ? "mythic" : "unique";
  const ascensionRarityCap = selectedAscension >= 4 ? "unique" : selectedAscension >= 3 ? "mythic" : "legendary";
  const rarityOrder = ["common", "rare", "epic", "legendary", "mythic", "unique"];
  const rarityCap = rarityOrder[Math.min(rarityOrder.indexOf(timeRarityCap), rarityOrder.indexOf(ascensionRarityCap))];
  return { elapsed, progress, ascensionLevel, selectedAscension, rarityCap };
}

function maybeDropFieldPickup(room, enemy) {
  if (!enemy || (room.status !== "combat" && room.status !== "advancement")) return;
  if (enemy.type === "splinter" || enemy.type === "boss" || enemy.bossId) return;
  if (enemy.trainingDummy || enemy.blockadeRunner || BLOCKADE_RUNNER_TYPES.includes(enemy.type)) return;
  if (enemy.survivalCheckpoint || enemy.survivalMiniBoss) return;
  if (!room.fieldPickups) room.fieldPickups = [];
  if (room.fieldPickups.filter((pickup) => !pickup.dead).length >= 12) return;

  const chanceMul = enemy.elite ? 2 : 1;
  const ascensionRewardMul = getAbyssDifficulty(room).rewardMul;
  const equipmentReward = getFieldEquipmentRewardState(room);
  const ascensionDropMul = 1 + (Math.sqrt(ascensionRewardMul) - 1) * equipmentReward.progress;
  const equipmentChance = EQUIPMENT_DROP_CHANCE * ascensionDropMul;
  const roll = Math.random();
  let type = "";
  if (roll < HEALTH_POTION_DROP_CHANCE * chanceMul) {
    type = "health_potion";
  } else if (roll < (HEALTH_POTION_DROP_CHANCE + XP_MAGNET_DROP_CHANCE) * chanceMul) {
    type = "xp_magnet";
  } else if (roll < (HEALTH_POTION_DROP_CHANCE + XP_MAGNET_DROP_CHANCE + equipmentChance) * chanceMul) {
    type = "equipment";
  }
  if (!type) return;

  const angle = Math.random() * Math.PI * 2;
  const pickupId = nextFieldPickupId++;
  const pickup = {
    id: pickupId,
    type,
    x: clamp(enemy.x, 28, room.world.w - 28),
    y: clamp(enemy.y, 28, room.world.h - 28),
    vx: Math.cos(angle) * 82,
    vy: Math.sin(angle) * 82,
    radius: 17,
    timer: type === "equipment" ? 45 : FIELD_PICKUP_LIFETIME,
    dead: false
  };
  if (type === "equipment") {
    pickup.dropId = `${room.runStartedAt || Date.now()}:${pickupId}`;
    pickup.highestLevel = getActivePlayers(room).reduce((highest, player) => Math.max(highest, player.level || 1), 1);
    pickup.abyssDepth = Math.max(0, room.abyssDepth || 0);
    pickup.ascensionLevel = equipmentReward.ascensionLevel;
    pickup.rarityCap = equipmentReward.rarityCap;
    pickup.rarity = progressionService.getEquipmentDropPreview({
      dropId: pickup.dropId,
      classId: getActivePlayers(room)[0]?.classId || "warrior",
      highestLevel: pickup.highestLevel,
      abyssDepth: pickup.abyssDepth,
      ascensionLevel: pickup.ascensionLevel,
      rarityCap: pickup.rarityCap,
    }).rarity;
  }
  room.fieldPickups.push(pickup);
  addEffect(room, "impact", pickup.x, pickup.y, {
    color: type === "health_potion" ? "#f59e0b" : type === "equipment" ? ({ common: "#cbd5e1", rare: "#60a5fa", epic: "#c084fc", legendary: "#fbbf24", mythic: "#fb7185", unique: "#5eead4" }[pickup.rarity] || "#cbd5e1") : "#67e8f9",
    radius: 28,
    style: type === "health_potion" ? "field_health_potion_drop" : type === "equipment" ? "field_equipment_drop" : "field_xp_magnet_drop"
  });
}

function enterAbyssDepth(room) {
  room.abyssDecision = false;
  room.abyssDepth = Math.max(0, Math.floor(Number(room.abyssDepth || 0))) + 1;
  room.floor = MAX_CHAPTERS;
  room.stageMap = generateStageMap(room.floor, () => nextRoomRandom(room), { bossId: room.weeklyBossId });
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapPath = [];
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  room.killsSinceChest = 0;
  room.threatLevel = 1 + room.abyssDepth * 0.16 + (room.ascensionLevel || 0) * 0.08;
  room.stageObjective = null;
  pushEvent(room, `심연 ${room.abyssDepth}층에 진입했습니다. 적이 더 강해지고 보상이 증가합니다.`);
  enterMapChoice(room);
}

function getTotalStages(room = null) {
  if (room?.survival?.completed) {
    const abyssRuns = Math.max(room.survival.completedAbyssDepths || 0, room.abyssDepth || 0);
    return SURVIVAL_BOSS_CHECKPOINTS.length + abyssRuns * MAP_DEPTH;
  }
  if (room?.survival?.active) return SURVIVAL_BOSS_CHECKPOINTS.length;
  if (room?.challengeMode === "weekly") return MAP_DEPTH;
  return stageSystem.getTotalStages({ mapDepth: MAP_DEPTH, maxChapters: MAX_CHAPTERS });
}

function getClearedStageCount(room, outcome) {
  if (room.survival?.completed) {
    const completedAbyssDepths = Math.max(0, room.survival.completedAbyssDepths || 0);
    const currentDepth = room.abyssDepth > completedAbyssDepths ? Math.max(0, (room.activeMapNode?.depth || 1) - 1) : 0;
    return SURVIVAL_BOSS_CHECKPOINTS.length + completedAbyssDepths * MAP_DEPTH + currentDepth;
  }
  if (room.survival?.active) {
    if (outcome === "victory") return SURVIVAL_BOSS_CHECKPOINTS.length;
    return clamp(Math.floor(room.survival.checkpointIndex || 0), 0, SURVIVAL_BOSS_CHECKPOINTS.length);
  }
  if (room.challengeMode === "weekly") {
    if (outcome === "victory") return MAP_DEPTH;
    return Math.max(0, Math.min(MAP_DEPTH, (room.activeMapNode?.depth || 1) - 1));
  }
  return stageSystem.getClearedStageCount(room, outcome, { mapDepth: MAP_DEPTH, maxChapters: MAX_CHAPTERS });
}

function finishRun(room, outcome, reason) {
  roomManager.prepareRoomForGameover(room);
  room.result = buildRunResult(room, outcome, reason);
  persistAccountRunResults(room, room.result);
  registerChallengeLeaderboardResult(room, room.result);
  pushEvent(room, outcome === "victory" ? "런 클리어. 결산을 확인하세요." : "런 실패. 결산을 확인하세요.");
}

function persistAccountRunResults(room, result) {
  if (!result) return;
  const enemies = [
    ...(room.runDefeatedMonsters || room.runDiscoveredMonsters || []).map((type) => ({ type })),
    ...(room.runDefeatedBosses || room.runDiscoveredBosses || []).map((bossId) => ({ type: "boss", bossId })),
  ];
  for (const player of getHumanPlayers(room)) {
    if (player.spectator || !player.accountId) continue;
    const account = accountStore.getTrusted(player.accountId);
    if (!account) continue;
    const discoveries = progressionService.recordWorldDiscoveries(account.progress, {
      selfId: player.id,
      enemies,
      players: [player],
    });
    const playerResult = (result.players || []).find((entry) => entry.id === player.id) || {};
    const progress = progressionService.recordRunResult(discoveries.progress, {
      ...result,
      resultKey: `${room.code}:${room.runStartedAt || Date.now()}:${player.accountId}`,
      chapter: result.chapter || room.chapter || room.floor || 0,
      wave: result.wave || room.wave || 0,
      classId: playerResult.classId || player.classId,
      combatStats: playerResult.combatStats || {},
      bossDefeats: playerResult.bossDefeats || room.runBossDefeats || [],
      noDown: Boolean(playerResult.noDown),
      weeklyBossId: result.weeklyBossId || room.weeklyBossId || "",
      challengeRuleId: result.challengeRuleId || room.challengeRuleId || "",
      unlockedAscensionLevel: result.unlockedAscensionLevel,
    });
    const session = accountStore.updateProgress(account.id, progress, "run-finished");
    player.accountRevision = Number(session?.account?.revision || player.accountRevision || 0);
    player.growthLoadout = getAuthoritativeGrowthLoadout(player, player.classId, {
      ...(player.growthLoadout || {}),
      ascensionLevel: player.growthLoadout?.ascensionLevel || 0,
    });
    sendAccountProgress(player, session, "run-finished", "런 보상이 서버 계정에 저장되었습니다.");
  }
}

function recordEnemyDefeatDiscovery(room, enemy) {
  if (!room || !enemy || enemy.trainingDummy) return;
  const isBoss = enemy.type === "boss" || Boolean(enemy.bossId);
  let added = false;

  if (!isBoss && enemy.type && enemyDefs[enemy.type]) {
    if (!Array.isArray(room.runDefeatedMonsters)) room.runDefeatedMonsters = [];
    if (!room.runDefeatedMonsters.includes(enemy.type)) {
      room.runDefeatedMonsters.push(enemy.type);
      added = true;
    }
  }

  const bossId = isBoss ? String(enemy.bossId || "") : "";
  if (bossId) {
    if (!Array.isArray(room.runDefeatedBosses)) room.runDefeatedBosses = [];
    if (!room.runDefeatedBosses.includes(bossId)) {
      room.runDefeatedBosses.push(bossId);
      added = true;
    }
  }

  if (!added) return;
  const enemies = [
    ...(!isBoss ? [{ type: enemy.type }] : []),
    ...(bossId ? [{ type: "boss", bossId }] : []),
  ];
  for (const player of getHumanPlayers(room)) {
    if (player.spectator || !player.accountId) continue;
    const account = accountStore.getTrusted(player.accountId);
    if (!account) continue;
    const discoveries = progressionService.recordWorldDiscoveries(account.progress, {
      selfId: player.id,
      enemies,
      players: [player],
    });
    if (!discoveries.changed) continue;
    const session = accountStore.updateProgress(account.id, discoveries.progress, "enemy-defeat-discovery");
    player.accountRevision = Number(session?.account?.revision || player.accountRevision || 0);
    sendAccountProgress(player, session, "world-discovery", "새 도감 항목이 등록되었습니다.");
  }
}

function getChallengeLeaderboardKey(mode, key) {
  return ["daily", "weekly"].includes(mode) && key ? `${mode}:${key}` : "";
}

function registerChallengeLeaderboardResult(room, result) {
  const key = getChallengeLeaderboardKey(room.challengeMode, room.challengeKey);
  if (!key || !result) return;
  const names = getHumanPlayers(room).filter((player) => !player.spectator).map((player) => player.name);
  const entry = {
    id: `${room.code}:${room.runStartedAt}`,
    names,
    outcome: result.outcome,
    score: result.totalScore || 0,
    stagesCleared: result.stagesCleared || 0,
    abyssDepth: result.abyssDepth || 0,
    durationSec: result.durationSec || 0,
    recordedAt: Date.now()
  };
  const rows = (challengeLeaderboards.get(key) || []).filter((row) => row.id !== entry.id);
  rows.push(entry);
  rows.sort((a, b) =>
    Number(b.outcome === "victory") - Number(a.outcome === "victory") ||
    b.abyssDepth - a.abyssDepth ||
    b.stagesCleared - a.stagesCleared ||
    b.score - a.score ||
    a.durationSec - b.durationSec
  );
  challengeLeaderboards.set(key, rows.slice(0, 20));
}

function getRoomChallengeLeaderboard(room) {
  const challenge = room.status === "lobby" ? getRoomChallenge(room) : { mode: room.challengeMode, key: room.challengeKey };
  const key = getChallengeLeaderboardKey(challenge.mode, challenge.key);
  return key ? (challengeLeaderboards.get(key) || []).slice(0, 10) : [];
}

function buildRunResult(room, outcome, reason) {
  const players = getActivePlayers(room);
  const durationSec = room.runStartedAt ? Math.max(0, Math.round((Date.now() - room.runStartedAt) / 1000)) : 0;
  const stagesCleared = getClearedStageCount(room, outcome);
  const totalScore = players.reduce((sum, player) => sum + player.score, 0);
  const totalRelics = players.reduce((sum, player) => sum + getRelicStackInfo(player).current, 0);
  const totalRelicMax = players.reduce((sum, player) => sum + getRelicStackInfo(player).max, 0);
  const highestLevel = players.reduce((max, player) => Math.max(max, player.level), 1);
  const rewards = calculateRunRewardSummary({
    outcome,
    stagesCleared,
    highestLevel,
    totalScore,
    totalRelics,
    abyssDepth: room.abyssDepth || 0,
    ascensionLevel: room.ascensionLevel || 0,
    challengeModifierId: room.challengeModifierId || ""
  });

  const summary = stateSerializer.runResultSummaryView(room, {
    outcome,
    message: reason,
    maxChapters: MAX_CHAPTERS,
    stagesCleared,
    totalStages: getTotalStages(room),
    durationSec,
    totalScore,
    totalRelics,
    totalRelicMax,
    highestLevel,
    ...rewards,
    players: players.map((player) => stateSerializer.runResultPlayerView(player, {
      classLabel: getPlayerClassLabel(player),
      relicStacks: getRelicStackInfo(player),
      bossDefeats: room.runBossDefeats || []
    }))
  });
  summary.highestAscensionCleared = outcome === "victory"
    ? Math.max(0, Number(room.ascensionLevel || 0))
    : 0;
  if (room.survival?.active) {
    summary.survivalCompleted = Boolean(room.survival.finalBossDefeated);
    summary.survivalTimeSec = Math.round(room.survival.elapsed || 0);
    summary.secretVictory = Boolean(room.survival.secretVictory);
    summary.title = room.survival.secretVictory ? "운명 극복" : outcome === "victory" ? "9분 생존 성공" : "생존 실패";
  }
  return summary;
}

function pickRelics(room, player) {
  const eligible = relics.filter((relic) => isRelicAvailableForPlayer(relic, player));
  const pool = eligible.filter((relic) => !isRelicMaxedForPlayer(relic, player));
  const choices = weightedSampleWithoutReplacement(pool, 3, (relic) => getRelicChoiceWeight(room, relic));
  if (choices.length < 3) {
    const supplies = [...supplyRewards].sort(() => Math.random() - 0.5);
    choices.push(...supplies.slice(0, 3 - choices.length));
  }
  return choices.map((relic) => {
    if (relic.consumable) return relicView(relic);
    const owned = getOwnedRelic(player, relic.id);
    const nextLevel = owned ? Math.min(getRelicMaxLevel(relic), (owned.level || 1) + 1) : 1;
    return relicView(relic, nextLevel, { upgrading: Boolean(owned) });
  });
}

function relicView(relic, level = 1, options = {}) {
  const maxLevel = getRelicMaxLevel(relic);
  const safeLevel = relic.consumable ? level : clamp(Math.round(Number(level) || 0), 0, maxLevel);
  return {
    id: relic.id,
    name: relic.name,
    text: relic.text,
    target: relic.target || "공용",
    icon: relic.icon || getRelicIcon(relic.id),
    consumable: Boolean(relic.consumable),
    level: safeLevel,
    maxLevel,
    upgrading: Boolean(options.upgrading)
  };
}

function getRelicIcon(id) {
  return relicIcons[id] || "유";
}

function getRelicMaxLevel(relic) {
  return dataRegistry.getRelicMaxLevel(relic);
}

function getRelicChoiceWeight(room, relic) {
  return dataRegistry.getRelicChoiceWeight(room, relic, 0, { mapDepth: MAP_DEPTH });
}

function weightedSampleWithoutReplacement(items, count, weightFn) {
  const pool = [...items];
  const result = [];
  while (pool.length > 0 && result.length < count) {
    let total = 0;
    const weights = pool.map((item) => {
      const weight = Math.max(0, Number(weightFn(item)) || 0);
      total += weight;
      return weight;
    });
    if (total <= 0) {
      result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      continue;
    }
    let roll = Math.random() * total;
    let index = 0;
    for (; index < pool.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) break;
    }
    result.push(pool.splice(Math.min(index, pool.length - 1), 1)[0]);
  }
  return result;
}

function getOwnedRelic(player, relicId) {
  return (player.relics || []).find((relic) => relic.id === relicId) || null;
}

function isRelicMaxedForPlayer(relic, player) {
  const owned = getOwnedRelic(player, relic.id);
  return Boolean(owned) && (owned.level || 1) >= getRelicMaxLevel(relic);
}

function getRelicStackInfo(player) {
  const current = (player.relics || []).reduce((sum, relic) => sum + (relic.level || 1), 0);
  const max = relics
    .filter((relic) => isRelicAvailableForPlayer(relic, player))
    .reduce((sum, relic) => sum + getRelicMaxLevel(relic), 0);
  return { current, max };
}

function formatAppliedRelicName(applied) {
  if (!applied || applied.consumable || !applied.maxLevel) return applied ? applied.name : "";
  return `${applied.name} 레벨 ${applied.level}/${applied.maxLevel}`;
}

function isRelicAvailableForPlayer(relic, player) {
  const classId = player.classId || "novice";
  if (!relic || DISABLED_RELIC_IDS.has(relic.id)) return false;
  if (relic.classes && !relic.classes.includes(classId)) return false;
  if (relic.excludeClasses && relic.excludeClasses.includes(classId)) return false;
  return true;
}

function getRewardById(id) {
  return relics.find((item) => item.id === id) || supplyRewards.find((item) => item.id === id);
}

function chooseRelic(room, player, relicId) {
  if (room.status !== "choice" || !player.choicePending) return;
  const chosen = player.choices.find((choice) => choice.id === relicId);
  if (!chosen) return;

  const applied = applyRelicChoice(player, chosen);
  if (!applied) return;
  rewardSystem.clearRelicChoice(player);
  pushEvent(room, `${player.name} 님이 ${formatAppliedRelicName(applied)}을(를) 선택했습니다.`);
}

function applyRelicReward(player, reward) {
  if (reward.consumable) {
    if (!dataRegistry.applyRewardEffect(player, reward, { skillSlots: SKILL_SLOTS })) reward.apply(player);
    return;
  }

  if (!dataRegistry.applyRewardEffect(player, reward, { skillSlots: SKILL_SLOTS })) reward.apply(player);

  player.maxHp = Math.max(1, player.maxHp);
  player.hp = clamp(player.hp, 1, player.maxHp);
  player.armor = clamp(player.armor, 0, 18);
  player.crit = clamp(player.crit, 0, 0.85);
  player.lifeSteal = clamp(player.lifeSteal, 0, 0.2);
}

function applyRelicChoice(player, chosen) {
  let reward = getRewardById(chosen.id);
  if (!reward) return null;

  if (!reward.consumable && isRelicMaxedForPlayer(reward, player)) {
    reward = supplyRewards[0];
  }

  applyRelicReward(player, reward);

  if (reward.consumable) {
    return relicView(reward);
  }

  const owned = getOwnedRelic(player, reward.id);
  const maxLevel = getRelicMaxLevel(reward);
  if (owned) {
    owned.level = Math.min(maxLevel, (owned.level || 1) + 1);
    owned.maxLevel = maxLevel;
    owned.name = reward.name;
    owned.text = reward.text;
    owned.target = reward.target || "공용";
    owned.icon = getRelicIcon(reward.id);
    owned.consumable = false;
    owned.upgrading = false;
    return relicView(reward, owned.level, { upgrading: true });
  }

  const applied = relicView(reward, 1);
  if (!reward.consumable) {
    player.relics.push(applied);
  }
  return applied;
}

function updateRelicChoice(room, now) {
  const activePlayers = getActivePlayers(room);
  if (room.choiceDeadline && now >= room.choiceDeadline) {
    for (const { player, applied } of rewardSystem.applyTimedOutRelicChoices(activePlayers, applyRelicChoice)) {
      pushEvent(room, `${player.name} 님이 시간 종료로 ${formatAppliedRelicName(applied)}을(를) 받았습니다.`);
    }
  }

  if (rewardSystem.getRelicChoiceSummary(activePlayers).hasPending) return;

  room.choiceDeadline = 0;
  room.relicChests = room.relicChests.filter((chest) => !chest.dead);
  if (resumeSurvivalAfterCheckpointReward(room)) return;
  if (room.stageObjective?.type === "reward" && room.relicChests.length > 0) {
    room.status = "combat";
    room.choiceDeadline = 0;
    pushEvent(room, `Reward room: ${room.relicChests.length} chest(s) left.`);
    return;
  }

  if (!room.survival?.active && isStageClearReady(room)) {
    completeWave(room);
    return;
  }
  room.status = "combat";
  pushEvent(room, "유물 선택이 끝났습니다. 전투를 재개합니다.");
}

function maybeDropRelicChest(room, enemy, ownerId = null) {
  if (room.status !== "combat" && room.status !== "advancement") return;
  if (enemy.type === "splinter") return;
  if (enemy.blockadeRunner || BLOCKADE_RUNNER_TYPES.includes(enemy.type)) return;
  if (enemy.survivalCheckpoint) return;
  if (enemy.survivalMiniBoss || enemy.guaranteedRelicDrop) {
    room.killsSinceChest = 0;
    spawnRelicChestForEnemy(room, enemy, { survivalMiniBoss: true });
    return;
  }
  const stageKind = getActiveStageKind(room);
  const rewardProfile = getStageRewardProfile(room, stageKind);
  const chestLimit = getStageChestLimit(room, stageKind);
  if (room.relicChests.length >= chestLimit) return;
  const owner = ownerId ? room.players.get(ownerId) : null;
  const partyDifficulty = getPartyDifficulty(room);
  const drop = dataRegistry.getRelicChestDropDecision({
    enemyType: enemy.type,
    enemyElite: Boolean(enemy.elite),
    ownerChestDropBonus: owner?.chestDropBonus || 0,
    partyChestMul: partyDifficulty.chestMul,
    killsSinceChest: room.killsSinceChest || 0,
    chestPityKills: CHEST_PITY_KILLS,
    relicDropChance: RELIC_DROP_CHANCE,
    stageChestBonus: rewardProfile.chestBonus || 0,
    wave: room.wave,
    roll: Math.random()
  });
  room.killsSinceChest = drop.killsSinceChest;
  if (!drop.shouldDrop) return;

  spawnRelicChestForEnemy(room, enemy);
}

function spawnRelicChestForEnemy(room, enemy, options = {}) {
  const chest = {
    id: nextChestId++,
    x: clamp(enemy.x, 44, room.world.w - 44),
    y: clamp(enemy.y, 44, room.world.h - 44),
    radius: 24,
    survivalMiniBoss: Boolean(options.survivalMiniBoss),
    dead: false
  };
  room.relicChests.push(chest);
  addEffect(room, "chest", chest.x, chest.y, {
    color: options.survivalMiniBoss ? "#fde047" : "#facc15",
    radius: options.survivalMiniBoss ? 68 : 54,
    style: options.survivalMiniBoss ? "miniboss_guaranteed_relic" : "relic_drop"
  });
  pushEvent(room, options.survivalMiniBoss ? "생존 미니보스가 확정 유물 상자를 떨어뜨렸습니다." : "유물 상자가 떨어졌습니다.");
  return chest;
}

function enterRelicChoice(room, chest) {
  chest.dead = true;
  room.status = "choice";
  room.choiceDeadline = Date.now() + RELIC_CHOICE_TIMEOUT_MS;
  room.projectiles = room.projectiles.filter((projectile) => projectile.hostile && !projectile.dead);

  rewardSystem.beginRelicChoiceForPlayers(getActiveLivingPlayers(room), (player) => pickRelics(room, player));

  addEffect(room, "chest", chest.x, chest.y, { color: "#facc15", radius: 88 });
  pushEvent(room, "유물 상자를 열었습니다. 10초 안에 모두 선택하세요.");
}

function enterRiskChoice(room) {
  room.status = "risk";
  room.riskChoices = [risks[0], ...risks.slice(1).sort(() => Math.random() - 0.5)].map(riskView);
  pushEvent(room, `다음 위험도를 선택하세요.`);
}

function chooseRisk(room, player, riskId) {
  if (room.status !== "risk" || room.hostId !== player.id) return;
  const chosen = risks.find((risk) => risk.id === riskId) || risks[0];
  room.activeRisk = chosen;
  room.riskChoices = [];
  room.wave += 1;
  pushEvent(room, `${player.name} 님이 ${chosen.name}을(를) 선택했습니다.`);
  spawnWave(room);
}

function enterAdvancementChoice(room) {
  if (!hasPendingAdvancement(room)) return;
  if (room.status !== "advancement") {
    room.pausedStatus = room.status === "combat" ? "combat" : room.pausedStatus || "combat";
    room.status = "advancement";
    room.advancementStartedAt = Date.now();
    pushEvent(room, "전직 선택 중입니다. 선택이 끝날 때까지 전투가 정지됩니다.");
  }
  room.advancementDeadline = Date.now() + ADVANCEMENT_CHOICE_TIMEOUT_MS;
  room.projectiles = room.projectiles.filter((projectile) => projectile.hostile && !projectile.dead);
}

function updateAdvancementChoice(room, now) {
  if (room.advancementDeadline && now >= room.advancementDeadline) {
    const pendingPlayers = getActivePlayers(room).filter((player) => player.pendingSkillChoices.length > 0);
    for (const player of pendingPlayers) {
      const fallback = player.pendingSkillChoices[0];
      if (!fallback) continue;
      chooseSkillUpgrade(room, player, fallback.id, { automatic: true });
    }
  }
  resumeAdvancementIfReady(room);
}

function resumeAdvancementIfReady(room) {
  if (room.status !== "advancement") return;
  if (hasPendingAdvancement(room)) return;

  room.status = room.pausedStatus || "combat";
  room.pausedStatus = null;
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  pushEvent(room, "전직 선택이 끝났습니다. 전투를 재개합니다.");

  if (room.status === "combat" && !room.survival?.active && isStageClearReady(room)) {
    completeWave(room);
  }
}

function hasPendingAdvancement(room) {
  return getActivePlayers(room).some((player) => player.pendingSkillChoices.length > 0);
}

function countPendingAdvancements(room) {
  return getActivePlayers(room).filter((player) => player.pendingSkillChoices.length > 0).length;
}

function countPendingRelicChoices(room) {
  return rewardSystem.getRelicChoiceSummary(getActivePlayers(room)).pendingCount;
}

function countReadyPlayers(room) {
  return playerSystem.countReadyPlayers(room);
}

function areAllPlayersReady(room) {
  return playerSystem.areAllPlayersReady(room);
}

function chooseSkillUpgrade(room, player, upgradeId, options = {}) {
  const chosen = player.pendingSkillChoices.find((choice) => choice.id === upgradeId);
  if (!chosen) return;
  if (chosen.levelRequirement) {
    if (!player.claimedAdvancementLevels.includes(chosen.levelRequirement)) {
      player.claimedAdvancementLevels.push(chosen.levelRequirement);
    }
  }

  if (chosen.classId) {
    const previousDef = classes[player.classId] || classes.novice;
    player.classId = chosen.classId;
    player.jobTier = 1;
    const def = classes[player.classId];
    const hpDelta = def.maxHp - previousDef.maxHp;
    player.maxHp = Math.max(1, player.maxHp + hpDelta);
    player.hp = Math.min(player.maxHp, Math.max(1, player.hp + hpDelta));
    player.armor = clamp(player.armor + ((def.armor || 0) - (previousDef.armor || 0)), 0, 18);
    player.crit = clamp(player.crit + ((def.crit ?? 0.03) - (previousDef.crit ?? 0.03)), 0, 0.75);
    player.regen = Math.max(0, player.regen + ((def.regen ?? 0.25) - (previousDef.regen ?? 0.25)));
    resetDashCharges(player);
  } else {
    player.skillUpgrades.push(chosen.id);
    if (chosen.tier) player.jobTier = Math.max(player.jobTier, chosen.tier);
    applySkillUpgrade(player, chosen.id);
  }

  player.pendingSkillChoices = [];
  addEffect(room, "level", player.x, player.y, { color: classes[player.classId].color, radius: 70 });
  const chosenView = getEquipmentAdjustedSkillView(player, chosen);
  pushEvent(
    room,
    options.automatic
      ? `${player.name} 님이 시간 종료로 ${chosenView.name}을(를) 받았습니다.`
      : `${player.name} 님이 ${chosenView.name}을(를) 선택했습니다.`
  );
  assignAdvancementChoices(player);
  if (player.pendingSkillChoices.length > 0) {
    enterAdvancementChoice(room);
    return;
  }
  resumeAdvancementIfReady(room);
}

function assignAdvancementChoices(player) {
  if (player.pendingSkillChoices.length > 0) return;
  const levelRequirement = ADVANCEMENT_LEVELS.find(
    (level) => player.level >= level && !player.claimedAdvancementLevels.includes(level)
  );
  if (!levelRequirement) return;

  const owned = new Set(player.skillUpgrades);
  const available = (skillUpgrades[player.classId] || []).filter((upgrade) =>
    isSkillUpgradeAvailable(player, upgrade, owned, levelRequirement)
  );
  const options = weightedSampleWithoutReplacement(available, 3, (upgrade) => getSkillChoiceWeight(upgrade, levelRequirement)).map((upgrade) => ({
    ...upgrade,
    kind: "skill",
    levelRequirement
  }));

  if (options.length === 0) {
    player.claimedAdvancementLevels.push(levelRequirement);
    assignAdvancementChoices(player);
    return;
  }

  player.pendingSkillChoices = options;
}

function isSkillUpgradeAvailable(player, upgrade, owned = new Set(player.skillUpgrades), levelRequirement = player.level) {
  if (!upgrade || DISABLED_SKILL_UPGRADES.has(upgrade.id)) return false;
  if (owned.has(upgrade.id)) return false;
  const minLevel = upgrade.slot ? ADVANCEMENT_LEVELS[0] : upgrade.minLevel;
  if (Number.isFinite(minLevel) && levelRequirement < minLevel) return false;
  if (!upgrade.requires) return true;
  return upgrade.requires.every((requiredId) => owned.has(requiredId) || requiredId === `${player.classId}_primary`);
}

function getSkillChoiceWeight(upgrade, levelRequirement) {
  return dataRegistry.getSkillChoiceWeight(upgrade, levelRequirement);
}

function applySkillUpgrade(player, upgradeId) {
  if (!player.skillMechanics) player.skillMechanics = {};
  player.skillMechanics[upgradeId] = true;
  if (upgradeId === "engineer_mine_field") {
    player.engineerMineChargesInitialized = false;
    player.engineerMineCharges = 0;
    player.skillTimers.r = 0;
  }
  if (upgradeId === "engineer_auto_mine") {
    player.engineerAutoMineInitialized = false;
    player.engineerAutoMineTimer = 0;
  }
}

function getPlayerAttackPowerMultiplier(player, fallbackClassId = "novice") {
  const classId = player?.classId || fallbackClassId;
  const def = classes[classId] || classes[fallbackClassId] || classes.novice;
  const baseAttackPower = Math.max(1, Number(def.damage) || 1);
  const equipmentAttackPower = Math.max(0, Number(player?.attackPowerBonus) || 0);
  return (baseAttackPower + equipmentAttackPower) / baseAttackPower;
}

function getPlayerAttackDamage(player, fallbackClassId = "novice") {
  const classId = player?.classId || fallbackClassId;
  const def = classes[classId] || classes[fallbackClassId] || classes.novice;
  const basicAttackDamageMul = classId === "engineer" && player ? getEngineerMechaAttackDamageMul(player) : 1;
  const attackPower = def.damage + Math.max(0, Number(player?.attackPowerBonus) || 0);
  return Math.max(0, attackPower * (player?.damageMul || 1) * basicAttackDamageMul);
}

function getPlayerStats(player) {
  const def = classes[player.classId];
  const warriorCleaveMul = player.classId === "warrior" && hasUpgrade(player, "warrior_cleave") ? 1.22 : 1;
  const meleeClass = player.classId === "martialist" || player.classId === "assassin";
  const attackRange =
    player.classId === "warrior"
      ? def.range * player.rangeMul * player.areaMul * warriorCleaveMul
      : meleeClass
        ? def.range * player.rangeMul * player.areaMul
        : def.range * player.rangeMul;
  const areaRadius =
    player.classId === "warrior"
      ? 180 * player.areaMul * warriorCleaveMul
      : player.classId === "martialist"
        ? 176 * player.areaMul
      : player.classId === "alchemist"
        ? 128 * player.areaMul + player.splashBonus
      : player.classId === "assassin"
        ? 168 * player.areaMul
      : player.classId === "mage"
        ? 70 * player.areaMul
        : player.classId === "engineer"
          ? (hasUpgrade(player, "engineer_mine_field") ? 124 : 112) * player.areaMul
          : player.classId === "puppeteer"
            ? (hasUpgrade(player, "puppeteer_finale") ? 178 : 132) * player.areaMul
          : hasUpgrade(player, "ranger_trap")
            ? (hasUpgrade(player, "ranger_trap_barbs") ? 220 : 180) * player.areaMul * (hasUpgrade(player, "ranger_plague_garden") ? 1.1 : 1)
            : 0;
  const blastRadius = player.classId === "mage" ? 62 * player.areaMul + player.splashBonus : player.splashBonus;
  return {
    damage: Math.round(getPlayerAttackDamage(player)),
    crit: round2(player.crit * 100),
    armor: round2(player.armor + getEngineerMechaArmorBonus(player)),
    moveSpeed: Math.round(def.speed * player.speedMul * (player.dashSpeedMul || 1) * getEngineerMechaMoveMultiplier(player)),
    attackRange: Math.round(attackRange),
    areaRadius: Math.round(areaRadius),
    blastRadius: Math.round(blastRadius),
    attackCooldown: round2(def.attackCd * player.cooldownMul * getAttackCooldownMultiplier(player)),
    attackSpeed: round2(clamp(player.attackSpeed || 0, 0, 500)),
    skillHaste: round2(skillSystem.getSkillHaste(player)),
    skillCooldownMax: round2(getSkillCooldown(player, "q")),
    dashCooldownMax: round2(getDashCooldown(player)),
    dashDistance: Math.round(getDashDistance(player)),
    regen: round2(player.regen),
    lifeSteal: round2(player.lifeSteal * 100)
  };
}

function getPlayerClassLabel(player) {
  return playerSystem.getPlayerClassLabel(player, classes);
}

function getNextAdvancementLevel(player) {
  return ADVANCEMENT_LEVELS.find((level) => !player.claimedAdvancementLevels.includes(level)) || null;
}

function getSkillSlots(player) {
  const slots = stateSerializer.skillSlotViews(player, SKILL_SLOTS, {
    getUnlockedSlotUpgrade,
    getSkillCooldown,
    getPrimarySkillName,
    getSkillIcon
  });
  for (const slot of slots) {
    const source = slot.key === "q"
      ? getPrimarySkillDefinition(player)
      : getUnlockedSlotUpgrade(player, slot.key);
    if (!source) continue;
    const adjusted = getEquipmentAdjustedSkillView(player, source);
    slot.name = adjusted.name;
    slot.text = adjusted.text;
    slot.equipmentModified = Boolean(adjusted.equipmentModified);
    slot.equipmentLabel = adjusted.equipmentLabel || "";
    if (player.deferredSkillCooldowns?.[slot.key]) {
      slot.active = true;
      slot.ready = false;
    }
  }
  if (player.classId === "engineer" && hasUpgrade(player, "engineer_mine_field")) {
    const mineSlot = slots.find((slot) => slot.key === "r");
    if (mineSlot) {
      mineSlot.charges = clamp(Math.floor(Number(player.engineerMineCharges) || 0), 0, 3);
      mineSlot.maxCharges = 3;
      mineSlot.ready = mineSlot.unlocked && mineSlot.charges > 0;
      mineSlot.recharging = mineSlot.charges < mineSlot.maxCharges;
    }
  }
  return slots;
}

function getPrimarySkillName(player) {
  if (player.classId === "warrior") return "강철 회오리";
  if (player.classId === "ranger") return "연발 사격";
  if (player.classId === "mage") return "별빛 폭발";
  if (player.classId === "engineer") return "자동 터렛";
  if (player.classId === "puppeteer") return "인형극";
  if (player.classId === "martialist") return "연환권";
  if (player.classId === "alchemist") return "촉매 폭탄";
  if (player.classId === "assassin") return "칼날 난무";
  return "응급 전투술";
}

function getPrimarySkillDefinition(player) {
  const descriptions = {
    warrior: "Q: 검을 한 바퀴 휘둘러 주변 적을 베는 강철 회오리를 일으킵니다.",
    ranger: "Q: 조준 방향으로 여러 발의 화살을 연속 발사합니다.",
    mage: "Q: 별빛 투사체를 발사하며 적중 시 범위 폭발을 일으킵니다.",
    engineer: "Q: 조준 위치에 자동 터렛을 던져 설치합니다. 마지막 터렛이 사라진 뒤 쿨타임이 시작됩니다.",
    puppeteer: "Q: 인형과 실을 조종해 적을 공격합니다.",
    martialist: "Q: 전방에 연속 권격을 가합니다.",
    alchemist: "Q: 조준 방향으로 촉매 폭탄을 던집니다.",
    assassin: "Q: 전방에 여러 칼날을 빠르게 던집니다.",
    novice: "Q: 조준 방향으로 기본 전투 기술을 사용합니다."
  };
  const classId = player?.classId || "novice";
  return getEquipmentAdjustedSkillView(player, {
    id: `${classId}_primary`,
    slot: "q",
    name: getPrimarySkillName(player),
    text: descriptions[classId] || descriptions.novice
  });
}

function getEquipmentAdjustedSkillView(player, skill) {
  const view = { ...skill };
  const id = String(view.id || "");
  const modify = (name, text, equipmentLabel) => ({
    ...view,
    name,
    text,
    equipmentModified: true,
    equipmentLabel
  });

  if (player?.warriorWhirlwindPull && id === "warrior_guardian") {
    return modify("끌어모으는 회오리", "Q 강철 회오리가 조준 방향으로 전진하며 원형 중심으로 일반·정예 적을 강하게 끌어모읍니다.", "회오리의 심장");
  }
  if ((player?.warriorShoutDamageMul || 0) > 0 && id === "warrior_taunt") {
    return modify("파괴의 함성", `E: 주변 적을 도발하고 공격력 계수 ${round2(player.warriorShoutDamageMul)}의 피해를 줍니다.`, "파괴의 함성석");
  }
  if (player?.warriorCollisionCharge && ["warrior_charge", "warrior_charge_gather"].includes(id)) {
    return modify("충돌 돌진", "R: 돌진 거리가 대폭 감소하는 대신 적을 훨씬 멀리 밀쳐냅니다. 밀려난 적이 벽이나 다른 적과 충돌하면 추가 피해를 받습니다.", "충돌 돌진 갑주");
  }
  if ((player?.warriorExecutionThreshold || 0.25) > 0.25 && id === "warrior_cleave_execution") {
    return modify("상급 처형의 호", `광역 베기 피해 후 체력이 ${Math.round(player.warriorExecutionThreshold * 100)}% 이하인 일반 적을 즉시 처형합니다. 보스 피해는 35% 증가합니다.`, "집행자의 대검");
  }
  if (player?.warriorCleaveRepeat && id === "warrior_cleave") {
    return modify("연격 광역 베기", "F: 전방을 크게 벤 뒤 가로 베기를 한 번 더 발동합니다. 연속 베기 강화까지 배우면 가로 → 세로 → 가로 순서로 공격합니다.", "연격의 대검");
  }
  if (player?.warriorCleaveRepeat && id === "warrior_cleave_wave") {
    return modify("삼연속 베기", "광역 베기가 가로 → 세로 → 가로 순서로 세 번 연속 발동합니다.", "연격의 대검");
  }

  if (player?.rangerRadialQ && id === "ranger_primary") {
    return modify("전방위 사격", "Q: 360도 전 방향으로 12발의 화살을 발사합니다. 각 화살은 기존 연발 사격 피해의 72%를 줍니다.", "전방위 화살통");
  }
  if (player?.rangerRadialQ && id === "ranger_multishot") {
    return modify("추적 탄막", "Q 전방위 사격의 화살이 주변 적을 추적하며 휘어 들어갑니다.", "전방위 화살통");
  }
  if (player?.rangerRadialQ && id === "ranger_storm_quiver") {
    return modify("폭발 탄막", "Q 전방위 사격의 각 화살이 적중 시 범위 폭발과 화상을 일으킵니다.", "전방위 화살통");
  }
  if (player?.rangerLaserFire && id === "ranger_pierce_blast") {
    return modify("작열 레이저 화살", "관통 사격이 맵 끝까지 꿰뚫는 레이저로 바뀌고, 지나간 직선 경로에 4.2초 동안 불바다를 남깁니다.", "작열 광선궁");
  }
  if (player?.rangerRainPull && id === "ranger_trap") {
    return modify("중력 레인 에로우", "R: 조준 지점에 화살비를 내리며 범위 안의 일반·정예 적을 중심으로 끌어모읍니다.", "폭우의 중력추");
  }
  if ((player?.rangerPierceCapBonus || 0) > 0 && id === "ranger_pierce_momentum") {
    return modify("한계 돌파 관통 성장", `관통 사격의 처치 성장 상한이 +${Math.round(player.rangerPierceCapBonus)}만큼 증가합니다.`, "한계 돌파 촉");
  }

  if (player?.mageGiantOrb && id === "mage_primary") {
    return modify("응축 별빛", "Q: 빠르고 거대한 별빛 한 발을 직선으로 발사합니다. 별빛은 적을 밀치며 벽에 충돌할 때까지 관통하고 넓은 충격파를 일으킵니다.", "혜성핵 지팡이");
  }
  if (player?.mageGiantOrb && id === "mage_star_surge") {
    return modify("확장 별빛", "응축 별빛의 투사체 크기와 폭발 범위가 50% 증가합니다.", "혜성핵 지팡이");
  }
  if (player?.mageGiantOrb && id === "mage_storm_core") {
    return modify("강화 핵", "응축 별빛이 분열하지 않는 대신 치명타 확률이 100%가 됩니다.", "혜성핵 지팡이");
  }
  if (player?.mageFlameWave && id === "mage_frost") {
    return modify("화염 파동", "E: 주변에 화염 파동을 퍼뜨려 피해를 주고 적에게 화상을 부여합니다.", "화염 파동의 법의");
  }
  if (player?.mageFlameWave && id === "mage_frost_shatter") {
    return modify("연소 반응", "화상 상태인 적이 화염 파동에 맞으면 범위 폭발을 일으킵니다.", "화염 파동의 법의");
  }
  if (player?.mageFlameWave && id === "mage_frost_echo") {
    return modify("화염의 숨결", "패시브: 마법사 주위에 잔잔한 화염 오라가 생겨 가까운 적에게 지속적으로 화상을 부여합니다.", "화염 파동의 법의");
  }
  if (player?.mageIceMeteor && id === "mage_meteor") {
    return modify("빙하 운석", "R: 하늘에서 빙하 운석을 떨어뜨려 적을 빙결시키고 냉기 폭발을 일으킵니다.", "빙하 운석핵");
  }
  if (player?.mageIceMeteor && id === "mage_wildfire") {
    return modify("빙결 지대", "빙하 운석이 떨어진 자리에 냉기 피해와 지속 감속을 주는 빙결 지대를 남깁니다.", "빙하 운석핵");
  }
  if ((player?.mageMeteorGrowthCapBonus || 0) > 0 && id === "mage_meteor_growth") {
    return modify("끝없는 포식", `운석 처치 성장 상한이 장비 효과로 ${500 + Math.round(player.mageMeteorGrowthCapBonus)}회까지 증가합니다.`, "포식 한계 지팡이");
  }
  if (!player?.mageChainBoost && id === "mage_chain") {
    return {
      ...view,
      text: "F: 첫 대상 이후 최대 5회, 적 사이 거리 260까지 연쇄되는 번개를 방출합니다."
    };
  }
  if (player?.mageChainBoost && id === "mage_chain") {
    return modify("초전도 연쇄 번개", "F: 첫 대상 이후 최대 9회 연쇄하며, 적 사이 탐색 거리가 380으로 증가합니다.", "무한 연쇄 프리즘");
  }
  if (player?.mageChainBoost && ["mage_chain_no_falloff", "mage_chain_paralyze"].includes(id)) {
    return modify(view.name, `${view.text} 장비 효과로 적 사이 탐색 거리가 380, 최대 연쇄 횟수가 9회로 증가합니다.`, "무한 연쇄 프리즘");
  }
  if (player?.engineerMechaModule && id === "engineer_mecha") {
    return modify("적응형 메카", "E: 7.8초 동안 메카에 탑승해 방어력·방어막·대시 +1을 얻고, 범위 크기의 영향을 받는 파란 지속 레이저를 발사합니다. 레이저에는 매우 약한 넉백이 있으며 탑승 종료 후 쿨타임이 시작됩니다.", "적응형 메카 코어");
  }
  if (player?.engineerMineFire && id === "engineer_mine") {
    return modify("소이 감전 지뢰", "R: 적이 밟으면 넓게 폭발하고, 폭발 지점에 화상을 주는 불바다를 남깁니다.", "소이 지뢰 제어기");
  }
  if ((player?.engineerDroneBonus || 0) > 0 && id === "engineer_drone") {
    return modify("군집 호위 드론", `F: 주력 호위 드론 1기와 피해량 40%의 보조 드론 ${Math.round(player.engineerDroneBonus)}기를 호출합니다. 마지막 드론이 사라진 뒤 쿨타임이 시작됩니다.`, "군집 드론 제어기");
  }
  if (player?.engineerPermanentDrone && id === "engineer_drone") {
    return modify("영구 호위 드론", "패시브: F 사용은 봉인되고 호위 드론 1기가 원정 동안 계속 따라다닙니다.", "영구 동력 드론핵");
  }
  if (player?.engineerPermanentDrone && ["engineer_drone_missile", "engineer_drone_kamikaze"].includes(id)) {
    return modify(view.name, view.text.replace("드론", "영구 드론"), "영구 동력 드론핵");
  }

  return view;
}

function skillUpgradeName(upgradeId, player = null) {
  for (const upgrades of Object.values(skillUpgrades)) {
    const found = upgrades.find((upgrade) => upgrade.id === upgradeId);
    if (found) return getEquipmentAdjustedSkillView(player, found).name;
  }
  return upgradeId;
}

function skillChoiceView(player, choice) {
  return {
    ...getEquipmentAdjustedSkillView(player, choice),
    icon: getSkillIcon(choice.id)
  };
}

function getSkillIcon(id) {
  return skillIcons[id] || "기";
}

function applyProjectileStatus(room, projectile, enemy, dealtDamage = 0) {
  if (projectile.poison && (dealtDamage > 0 || enemy.hp > 0)) {
    const poisonDurationBonus = Number.isFinite(projectile.poisonDurationBonus) ? projectile.poisonDurationBonus : 0;
    const owner = room.players.get(projectile.ownerId);
    const poisonDuration = (ENEMY_POISON_DURATION + Math.max(0, poisonDurationBonus)) * (owner?.poisonDurationMul || 1);
    const poisonStacks = Number.isFinite(projectile.poisonStacks) ? projectile.poisonStacks : 1;
    stackPoisonOnEnemy(room, enemy, projectile.ownerId, { duration: poisonDuration, stacks: poisonStacks });
    if (projectile.venom) applyVenomToEnemy(room, enemy, projectile.ownerId, { duration: ENEMY_VENOM_DURATION });
    addEffect(room, "poison", enemy.x, enemy.y, { color: "#9aa15f", radius: enemy.radius + 10 });
    if (projectile.poisonCloud) {
      createRangerPoisonPool(room, projectile.ownerId, enemy.x, enemy.y, {
        poisonDuration: poisonDuration * 0.82,
        skipFirstPoisonEnemyId: enemy.id
      });
    }
  }
  if (projectile.burn && dealtDamage > 0) {
    const burnOptions = typeof projectile.burn === "object" ? projectile.burn : { duration: ENEMY_BURN_DURATION };
    applyBurnToEnemy(room, enemy, projectile.ownerId, dealtDamage, burnOptions);
    addEffect(room, "explosion", enemy.x, enemy.y, {
      color: "#f97316",
      radius: enemy.radius + 20,
      style: "fire_tick"
    });
  }
  if (projectile.slow) {
    enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slow);
    addEffect(room, "slow", enemy.x, enemy.y, { color: "#93c5fd", radius: enemy.radius + 12 });
  }
}

function chainLightning(room, ownerId, source, damage, jumps, options = {}) {
  const owner = room.players.get(ownerId);
  const supercell = owner && hasUpgrade(owner, "mage_supercell");
  let current = source;
  const hit = new Set([source.id]);
  const range = options.range || 230;
  const falloff = options.falloff ?? 0.18;
  const minDamageMul = options.minDamageMul ?? 0.28;
  const chainColor = options.color || classes.mage.color;
  const chainStyle = options.style || "chain_lightning";
  for (let i = 0; i < jumps; i += 1) {
    let next = null;
    let best = Infinity;
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0 || hit.has(enemy.id)) continue;
      const dist = distance(current, enemy);
      if (dist < best && dist <= range) {
        best = dist;
        next = enemy;
      }
    }
    if (!next) return;
    hit.add(next.id);
    addEffect(room, "chain", (current.x + next.x) / 2, (current.y + next.y) / 2, {
      color: chainColor,
      radius: best,
      fromX: round2(current.x),
      fromY: round2(current.y),
      toX: round2(next.x),
      toY: round2(next.y),
      style: chainStyle
    });
    if (supercell) {
      next.slowTimer = Math.max(next.slowTimer, 1.25);
    }
    dealDamage(room, next, damage * Math.max(minDamageMul, 1 - i * falloff) * (supercell && next.freezeTimer > 0 ? 1.22 : 1), ownerId, {
      forceCrit: Boolean(options.forceCrit)
    });
    current = next;
  }
}

const SKILL_UPGRADE_ALIASES = {
  warrior_taunt_bastion: ["warrior_taunt_break"],
  warrior_charge_collision: ["warrior_charge_crash"],
  warrior_charge_crash: ["warrior_charge_collision"],
  warrior_worldsplitter: ["warrior_cleave_wave"],
  ranger_pierce_blast: ["ranger_bodkin"],
  ranger_bodkin: ["ranger_pierce_blast"],
  ranger_trap_barbs: ["ranger_rain_slow", "ranger_rain_shred"],
  mage_absolute_zero: ["mage_frost_echo"],
  mage_chain_no_falloff: ["mage_chain_overload"],
  mage_chain_paralyze: ["mage_chain_overload"],
  mage_chain_overload: ["mage_chain_no_falloff", "mage_chain_paralyze"],
  engineer_interceptor: ["engineer_drone_missile"],
  puppeteer_razor_puppet: ["puppeteer_puppet_trail", "puppeteer_puppet_threadcut"],
  puppeteer_thread_saw: ["puppeteer_bind_execute"],
  puppeteer_backstage: ["puppeteer_swap_cut"],
  martial_palm_breaker: ["martial_palm_echo", "martial_pressure_mark"],
  martial_rising_chain: ["martial_rising_shockwave", "martial_dragon_afterimage"],
  martial_focus_guard: ["martial_counter_wave"],
  alchemist_acid_storm: ["alchemist_acid_slow", "alchemist_acid_distill"],
  alchemist_fire_sea: ["alchemist_fire_burn", "alchemist_fire_vapor"],
  alchemist_elixir_cloud: ["alchemist_elixir_mist", "alchemist_elixir_catalyst"],
  alchemist_panacea: ["alchemist_elixir_mist"],
  assassin_mark_reaper: ["assassin_mark_spread", "assassin_mark_blades"],
  assassin_lunge_reset: ["assassin_lunge_afterimage", "assassin_lunge_shards"],
  assassin_smoke_bomb: ["assassin_smoke_clone", "assassin_smoke_confuse"],
  assassin_fan: ["assassin_mark_blades"]
};

function hasUpgrade(player, upgradeId) {
  if (!player?.skillUpgrades) return false;
  if (player.skillUpgrades.includes(upgradeId)) return true;
  const aliases = SKILL_UPGRADE_ALIASES[upgradeId];
  return Array.isArray(aliases) && aliases.some((aliasId) => player.skillUpgrades.includes(aliasId));
}

function distanceToSegment(point, ax, ay, bx, by) {
  return collisionSystem.distanceToSegment(point, ax, ay, bx, by);
}

const MAX_ROOM_EFFECTS_PER_BROADCAST = 120;
const PRIMARY_EFFECT_KINDS = new Set(["slash", "spin", "dash", "warning", "meteor", "trap", "shot", "chain", "arcane", "freeze", "slow"]);

function getEffectRetentionPriority(effect) {
  const kind = String(effect?.kind || "");
  const style = String(effect?.style || "");
  if (kind === "damage" || kind === "heal" || kind === "xp" || (kind === "poison" && effect?.value)) return 0;
  if (kind === "impact") {
    return style === "critical_hit" || style === "heavy_hit" || style === "cleave_execute" ? 2 : 1;
  }
  const radius = Math.max(0, Number(effect?.rangeRadius || effect?.radius || 0));
  return (PRIMARY_EFFECT_KINDS.has(kind) ? 3 : 2) + (radius >= 140 ? 1 : 0);
}

function trimRoomEffects(effects, maxEffects = MAX_ROOM_EFFECTS_PER_BROADCAST) {
  while (effects.length > maxEffects) {
    let dropIndex = 0;
    let dropPriority = getEffectRetentionPriority(effects[0]);
    for (let index = 1; index < effects.length; index += 1) {
      const priority = getEffectRetentionPriority(effects[index]);
      if (priority < dropPriority) {
        dropIndex = index;
        dropPriority = priority;
        if (priority === 0) break;
      }
    }
    effects.splice(dropIndex, 1);
  }
}

function addEffect(room, kind, x, y, data = {}) {
  room.effects.push({
    id: nextEffectId++,
    kind,
    x: round2(x),
    y: round2(y),
    ...data,
    ...(data.ownerId == null && room.activeEffectOwnerId != null ? { ownerId: room.activeEffectOwnerId } : {})
  });
  trimRoomEffects(room.effects);
}

function getAimVector(player) {
  const dx = player.input.aimX - player.x;
  const dy = player.input.aimY - player.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length };
}

function rotate(vector, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: vector.x * c - vector.y * s,
    y: vector.x * s + vector.y * c
  };
}

function xpToNext(level) {
  if (level >= MAX_PLAYER_LEVEL) return 0;
  const baseRequirement = 120 + level * 95;
  const lateRequirement = Math.max(0, level - 3) * 20;
  const required = baseRequirement + lateRequirement;
  return Math.round(required / 5) * 5;
}

function runWithEffectOwner(room, ownerId, action) {
  const previousOwnerId = room.activeEffectOwnerId;
  room.activeEffectOwnerId = ownerId;
  try {
    return action();
  } finally {
    room.activeEffectOwnerId = previousOwnerId;
  }
}

function broadcastState(room) {
  for (const client of clients.values()) {
    if (client.room !== room.code || !client.playerId) continue;
    send(client, buildState(room, client.playerId));
  }
  room.events = [];
  room.effects = [];
}

function buildState(room, selfId) {
  const mapWalls = ensureRoomMapWalls(room);
  const self = room.players.get(selfId);
  const host = room.hostId ? room.players.get(room.hostId) : null;
  const activePlayers = getActivePlayers(room);
  const botPlayers = getBotPlayers(room);
  const spectatorCount = countSpectators(room);
  const allReady = areAllPlayersReady(room);
  const roomTimers = stateSerializer.getRoomTimers(room);
  const roomCapabilities = stateSerializer.getRoomCapabilities(room, selfId, {
    activePlayers,
    botPlayers,
    maxPlayers: MAX_PLAYERS,
    allReady
  });
  const roomIdentity = stateSerializer.roomIdentityView(room, {
    maxChapters: MAX_CHAPTERS,
    hostName: host ? host.name : ""
  });
  const roomPopulation = stateSerializer.roomPopulationView({
    readyCount: countReadyPlayers(room),
    allReady,
    choicePending: countPendingRelicChoices(room),
    advancementPending: countPendingAdvancements(room),
    botCount: botPlayers.length,
    canManageBots: roomCapabilities.canManageBots,
    canAddBot: roomCapabilities.canAddBot,
    canRemoveBot: roomCapabilities.canRemoveBot,
    playerCount: activePlayers.length,
    activePlayerCount: activePlayers.length,
    spectatorCount,
    maxPlayers: MAX_PLAYERS
  });
  const activeRiskView = room.activeRisk ? riskView(room.activeRisk) : riskView(risks[0]);
  const stageKind = getActiveStageKind(room);
  const roomStageSummary = stateSerializer.roomStageSummaryView(room, {
    activeRisk: activeRiskView,
    stageModifier: activeRiskView,
    stageKind,
    stage: stageNodeMetaView(stageKind)
  });
  return {
    type: "state",
    selfId,
    room: {
      code: roomIdentity.code,
      wave: roomIdentity.wave,
      floor: roomIdentity.floor,
      chapter: roomIdentity.chapter,
      maxChapters: roomIdentity.maxChapters,
      abyssDepth: Math.max(0, Math.floor(Number(room.abyssDepth || 0))),
      ascensionLevel: Math.max(0, Math.floor(Number(room.ascensionLevel || 0))),
      ascensionProfile: {
        ...(ASCENSION_DIFFICULTY_PROFILES[Math.max(0, Math.floor(Number(room.ascensionLevel || 0)))] || ASCENSION_DIFFICULTY_PROFILES[0]),
      },
      abyssDecision: Boolean(room.abyssDecision),
      challengeMode: room.challengeMode || "standard",
      challengeKey: room.challengeKey || "",
      challengeModifierId: room.challengeModifierId || "",
      challengeRuleId: room.challengeRuleId || "",
      weeklyBossId: room.weeklyBossId || "",
      paused: Boolean(room.paused),
      challengeLeaderboard: getRoomChallengeLeaderboard(room),
      chapterProfile: chapterStageProfileView(roomIdentity.floor),
      survival: room.survival?.active
        ? {
            active: true,
            elapsed: round2(room.survival.elapsed || 0),
            duration: SURVIVAL_DURATION_SEC,
            timeLeft: round2(Math.max(0, SURVIVAL_DURATION_SEC - (room.survival.elapsed || 0))),
            checkpoint: Math.max(0, Math.floor(room.survival.checkpointIndex || 0)),
            nextBossAt: SURVIVAL_BOSS_CHECKPOINTS[room.survival.checkpointIndex] || SURVIVAL_DURATION_SEC,
            bossActive: Boolean(room.survival.bossActive || room.survival.bossIntro),
            bossIntroActive: Boolean(room.survival.bossIntro),
            finalBossDefeated: Boolean(room.survival.finalBossDefeated),
            executionPending: Boolean(room.survival.executionSpawnAt && !room.survival.executionBossActive),
            executionBossActive: Boolean(room.survival.executionBossActive)
          }
        : null,
      status: roomIdentity.status,
      hostId: roomIdentity.hostId,
      hostName: roomIdentity.hostName,
      canStart: roomCapabilities.canStart,
      canReturnLobby: roomCapabilities.canReturnLobby,
      canPause: roomCapabilities.canPause,
      readyCount: roomPopulation.readyCount,
      allReady: roomPopulation.allReady,
      canChooseRisk: roomStageSummary.canChooseRisk,
      riskChoices: roomStageSummary.riskChoices,
      activeRisk: roomStageSummary.activeRisk,
      stageModifier: roomStageSummary.stageModifier,
      threatLevel: roomStageSummary.threatLevel,
      stageKind: roomStageSummary.stageKind,
      stage: roomStageSummary.stage,
      objective: stateSerializer.stageObjectiveView(room.stageObjective, { stageNodeMeta: STAGE_NODE_META }),
      stageMap: stageMapView(room),
      mapChoices: room.status === "map" ? room.mapChoices : [],
      mapVotes: countMapVotes(room),
      selfMapVote: room.mapVotes ? room.mapVotes[selfId] || "" : "",
      mapTimeLeft: roomTimers.mapTimeLeft,
      choiceTimeLeft: roomTimers.choiceTimeLeft,
      choicePending: roomPopulation.choicePending,
      advancementPending: roomPopulation.advancementPending,
      advancementTimeLeft: roomTimers.advancementTimeLeft,
      botCount: roomPopulation.botCount,
      canManageBots: roomPopulation.canManageBots,
      canAddBot: roomPopulation.canAddBot,
      canRemoveBot: roomPopulation.canRemoveBot,
      playerCount: roomPopulation.playerCount,
      activePlayerCount: roomPopulation.activePlayerCount,
      spectatorCount: roomPopulation.spectatorCount,
      maxPlayers: roomPopulation.maxPlayers,
      world: room.world,
      mapWalls,
      restartIn: roomTimers.restartIn,
      result: room.status === "gameover" ? room.result : null,
      clearSummary: clearSummaryView(room.clearSummary)
    },
    players: [...room.players.values()].map((player) => {
      const relicStacks = getRelicStackInfo(player);
      const identityView = stateSerializer.playerIdentityView(player, {
        classDef: classes[player.classId],
        classLabel: getPlayerClassLabel(player)
      });
      const inputView = stateSerializer.playerInputView(player);
      const vitalsView = stateSerializer.playerVitalsView(player, {
        classSpeed: classes[player.classId].speed,
        sizeScale: getPlayerSizeScale(player),
        martialChiMax: player.classId === "martialist" ? getMartialChiMax(player) : 0
      });
      const progressionView = stateSerializer.playerProgressionView(player, {
        maxLevel: MAX_PLAYER_LEVEL,
        xpNext: xpToNext(player.level),
        relicStacks,
        nextAdvancementLevel: getNextAdvancementLevel(player)
      });
      const loadoutView = stateSerializer.playerLoadoutView(player, {
        isSelf: player.id === selfId,
        skillUpgradeName: (upgradeId) => skillUpgradeName(upgradeId, player),
        skillChoiceView: (choice) => skillChoiceView(player, choice)
      });
      const actionStateView = stateSerializer.playerActionStateView(player, {
        dashReady: canUseDash(player),
        dashCooldown: getDashCooldownRemaining(player),
        dashMaxCharges: getDashMaxCharges(player)
      });
      const positionView = stateSerializer.playerPositionView(player);
      return {
        id: identityView.id,
        name: identityView.name,
        bot: identityView.bot,
        spectator: identityView.spectator,
        classId: identityView.classId,
        classLabel: identityView.classLabel,
        icon: identityView.icon,
        color: identityView.color,
        title: identityView.title,
        skin: identityView.skin,
        gearAppearance: player.gearAppearance || [],
        x: positionView.x,
        y: positionView.y,
        aimX: inputView.aimX,
        aimY: inputView.aimY,
        facing: inputView.facing,
        moveX: inputView.moveX,
        moveY: inputView.moveY,
        attacking: inputView.attacking,
        speed: vitalsView.speed,
        hp: vitalsView.hp,
        maxHp: vitalsView.maxHp,
        shield: vitalsView.shield,
        projectileShieldCharges: vitalsView.projectileShieldCharges,
        projectileShieldMaxCharges: vitalsView.projectileShieldMaxCharges,
        projectileShieldRespawnTime: vitalsView.projectileShieldRespawnTime,
        hitIFrameTime: vitalsView.hitIFrameTime,
        sizeScale: vitalsView.sizeScale,
        tauntGuardTime: vitalsView.tauntGuardTime,
        statusEffects: getPlayerStatusEffects(player),
        engineerLaserCharge: player.classId === "engineer"
          ? Math.max(0, Math.floor(player.skillMechanics?.engineerMechaLaserCharge || 0))
          : 0,
        engineerLaserChargeMax: player.classId === "engineer" ? ENGINEER_MECHA_LASER_MODULE_SHOTS : 0,
        martialChi: vitalsView.martialChi,
        martialChiMax: vitalsView.martialChiMax,
        stats: getPlayerStats(player),
        level: progressionView.level,
        maxLevel: progressionView.maxLevel,
        xp: progressionView.xp,
        xpNext: progressionView.xpNext,
        score: progressionView.score,
        relicCount: progressionView.relicCount,
        relicMaxCount: progressionView.relicMaxCount,
        uniqueRelicCount: progressionView.uniqueRelicCount,
        relics: loadoutView.relics,
        skillUpgrades: loadoutView.skillUpgrades,
        skillUpgradeNames: loadoutView.skillUpgradeNames,
        pendingSkillChoices: loadoutView.pendingSkillChoices,
        jobTier: progressionView.jobTier,
        nextAdvancementLevel: progressionView.nextAdvancementLevel,
        skillSlots: getSkillSlots(player),
        downed: actionStateView.downed,
        skillReady: actionStateView.skillReady,
        skillCooldown: actionStateView.skillCooldown,
        dashReady: actionStateView.dashReady,
        dashCooldown: actionStateView.dashCooldown,
        dashCharges: actionStateView.dashCharges,
        dashMaxCharges: actionStateView.dashMaxCharges,
        dashRechargeCooldown: actionStateView.dashRechargeCooldown,
        choicePending: loadoutView.choicePending,
        ready: actionStateView.ready,
        lastAttackAt: actionStateView.lastAttackAt,
        lastSkillAt: actionStateView.lastSkillAt,
        lastDashAt: actionStateView.lastDashAt,
        dashMove: stateSerializer.movementView(player.dashMove),
        knockbackMove: stateSerializer.movementView(player.knockbackMove),
        growth: player.id === selfId ? getPlayerGrowthView(player) : null,
        lobbyTest: room.status === "lobby" && player.id === selfId && !player.spectator ? getLobbyTestView(player) : null
      };
    }),
    enemies: stateSerializer.enemyViews(room.enemies, {
      enemyDefs,
      getAiState: getEnemyAiState,
      getStatusEffects: getEnemyStatusEffects,
      getWindupChannel: getEnemyWindupChannel
    }),
    projectiles: stateSerializer.projectileViews(room.projectiles, {
      getOwnerSkin: (ownerId) => room.players.get(ownerId)?.cosmeticSkin || ""
    }),
    hazards: stateSerializer.hazardViews(room.hazards, {
      getOwnerSkin: (ownerId) => room.players.get(ownerId)?.cosmeticSkin || ""
    }),
    relicChests: stateSerializer.relicChestViews(room.relicChests),
    xpOrbs: stateSerializer.xpOrbViews(room.xpOrbs || []),
    fieldPickups: stateSerializer.fieldPickupViews(room.fieldPickups || []),
    choices: self && self.choicePending ? self.choices : [],
    skillChoices: self ? self.pendingSkillChoices.map((choice) => skillChoiceView(self, choice)) : [],
    effects: room.effects,
    events: room.events
  };
}

function getPlayerStatusEffects(player) {
  return playerSystem.getPlayerStatusEffects(player);
}

function getEnemyStatusEffects(enemy) {
  return enemySystem.getEnemyStatusEffects(enemy);
}

function getEnemyAiState(enemy) {
  return enemySystem.getEnemyAiState(enemy);
}

function getEnemyWindupChannel(kind) {
  return enemySystem.getEnemyWindupChannel(kind);
}

function tickEnemyTimers(enemy, dt) {
  enemySystem.tickEnemyTimers(enemy, dt);
}

function advanceEnemyWindup(enemy, kind, dt) {
  return enemySystem.advanceEnemyWindup(enemy, kind, dt);
}

function advanceChargeWindup(room, enemy, dt) {
  if (!enemy.windup || enemy.windup.kind !== "charge") return false;
  lockChargeWindupPosition(room, enemy);
  const chargeWindup = advanceEnemyWindup(enemy, "charge", dt);
  if (chargeWindup.ready) beginChargerDash(room, enemy, chargeWindup.windup);
  return chargeWindup.active;
}

function advanceBomberExplosionWindup(room, enemy, dt) {
  if (!enemy.windup || enemy.windup.kind !== "bomber_explode") return false;
  lockEnemyWindupPosition(room, enemy);
  const bomberWindup = advanceEnemyWindup(enemy, "bomber_explode", dt);
  if (bomberWindup.ready) explodeBomber(room, enemy, bomberWindup.windup);
  return bomberWindup.active;
}

function advanceBossSnipeWindup(room, enemy, dt, onReady) {
  const snipeWindup = advanceEnemyWindup(enemy, "snipe", dt);
  if (snipeWindup.ready && typeof onReady === "function") onReady(snipeWindup.windup);
  return snipeWindup.active;
}

function getChargeDashCooldown(enemy) {
  return enemySystem.getChargeDashCooldown(enemy);
}

function getSupportCastProfile(enemy, kind) {
  return enemySystem.getSupportCastProfile(enemy, kind);
}

function getRangedCastProfile(enemy, kind, pressureMul) {
  return enemySystem.getRangedCastProfile(enemy, kind, pressureMul);
}

function pushEvent(room, text) {
  room.events.push({ text, at: Date.now() });
  if (room.events.length > 8) room.events.shift();
}

function send(client, message) {
  networkServer.writeJson(client && client.socket, message);
}

function removeClient(client) {
  removeClientFromRoom(client, true);
  clients.delete(client.id);
}

function removeClientFromRoom(client, announce) {
  if (!client.room || !client.playerId) return;
  const room = rooms.get(client.room);
  const player = room && room.players.get(client.playerId);
  if (room && player) {
    room.players.delete(client.playerId);
    if (room.mapVotes) delete room.mapVotes[client.playerId];
    if (room.hostId === client.playerId) {
      const nextHostPlayer = getHumanPlayers(room)[0] || [...room.players.values()][0] || null;
      room.hostId = nextHostPlayer ? nextHostPlayer.id : null;
      if (room.hostId) {
        const host = room.players.get(room.hostId);
        host.growthLoadout = getAuthoritativeGrowthLoadout(host, host.classId, {
          ...(host.growthLoadout || {}),
          ascensionLevel: room.ascensionLevel || 0,
        });
        if (room.status === "lobby") room.ascensionLevel = host.growthLoadout.ascensionLevel;
        pushEvent(room, `${host.name} 님이 새 방장이 되었습니다.`);
      }
    }
    if (announce) pushEvent(room, `${player.name} 님이 나갔습니다.`);
    if (room.players.size === 0 || getHumanPlayers(room).length === 0) {
      rooms.delete(room.code);
    } else {
      if (room.status === "map") resolveMapChoiceIfReady(room, Date.now());
      if (room.status === "advancement") resumeAdvancementIfReady(room);
    }
  }
  client.room = null;
  client.playerId = null;
}

function distance(a, b) {
  return collisionSystem.distance(a, b);
}

function normalizeVector(x, y) {
  return collisionSystem.normalizeVector(x, y);
}

function angleDifference(a, b) {
  return collisionSystem.angleDifference(a, b);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return clamp(number, min, max);
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRoomRandom(room) {
  const current = Number(room?.randomState) >>> 0;
  const next = (Math.imul(current || 0x9e3779b9, 1664525) + 1013904223) >>> 0;
  if (room) room.randomState = next;
  return next / 4294967296;
}

function createEmptyRunStats() {
  return { damage: 0, poisonDamage: 0, burnDamage: 0, kills: 0, eliteKills: 0, turretKills: 0, bossKills: 0, downs: 0, bossDefeats: [] };
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

server.listen(PORT, () => {
  console.log(`로그라이크 RPG 실행 중: http://localhost:${PORT}`);
});
