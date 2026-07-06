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
const roomManager = require("./server-room-manager");
const playerSystem = require("./server-player-system");
const rewardSystem = require("./server-reward-system");
const skillSystem = require("./server-skill-system");
const stateSerializer = require("./server-state-serializer");
const stageSystem = require("./server-stage-system");

const PORT = Number(process.env.PORT || 5173);
const PUBLIC_DIR = path.join(__dirname, "public");
const TICK_RATE = 60;
const STATE_RATE = 30;
const MAX_PLAYERS = 4;
const DASH_COOLDOWN = 1.15;
const DASH_DISTANCE = 175;
const WARRIOR_TAUNT_GUARD_DURATION = 4;
const WARRIOR_TAUNT_DAMAGE_MUL = 0.72;
const WARRIOR_TAUNT_SIZE_SCALE = 1.3;
const RELIC_DROP_CHANCE = 0.008;
const RELIC_EFFECT_MUL = 0.5;
const RELIC_CHOICE_TIMEOUT_MS = 10000;
const ADVANCEMENT_CHOICE_TIMEOUT_MS = 15000;
const MAP_VOTE_TIMEOUT_MS = 15000;
const MAP_DEPTH = 8;
const MAX_CHAPTERS = 3;
const MAP_LANES = 3;
const MAX_PLAYER_LEVEL = 15;
const MAX_WS_PAYLOAD_BYTES = 16 * 1024;
const MAX_INPUT_SEQUENCE = 1_000_000;
const SAFE_ID_PATTERN = /^[a-z0-9_-]{1,64}$/i;
const MINIBOSS_MIN_DEPTH_BY_CHAPTER = { 1: 6, 2: 4, 3: 3 };
const XP_ASSIST_SHARE = 0.34;
const ADVANCEMENT_LEVELS = Array.from({ length: MAX_PLAYER_LEVEL - 1 }, (_, index) => index + 2);
const SKILL_SLOTS = ["q", "e", "r", "f"];
const STARTING_CLASSES = new Set(["warrior", "ranger", "mage", "engineer", "puppeteer", "martialist", "alchemist", "assassin"]);
const BOT_CLASS_ROTATION = ["warrior", "ranger", "mage", "engineer", "puppeteer", "martialist", "alchemist", "assassin"];
const BOT_NAMES = ["Aegis Bot", "Rain Bot", "Nova Bot", "Gear Bot", "Thread Bot", "Combo Bot", "Flask Bot", "Shade Bot"];
const PLAYER_POISON_TICK_INTERVAL = 1.15;
const PLAYER_HIT_IFRAME_DURATION = 0.22;
const PLAYER_HAZARD_IFRAME_DURATION = 0.15;
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
    spawnMul: 0.66,
    hpMul: 0.92,
    damageMul: 0.86,
    eliteMul: 0.34,
    eliteCap: 0.26,
    xpMul: 1.05,
    chestMul: 0.82,
    anchorBonus: -1,
    maxAnchors: 3
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
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "charge",
    patternTags: ["charge_lane", "shockwave", "blade_beam"],
    signaturePatterns: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break"],
    phaseTitles: ["Armored Guard", "Broken Plating", "Overheated Core"],
    telegraph: { primary: 1.3, special: 1.65, phase: 1.8 },
    patternMix: { basic: 0.7, special: 0.24, punish: 0.06 },
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
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "summon",
    patternTags: ["summon", "acid_pool", "barrier_rite"],
    signaturePatterns: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"],
    phaseTitles: ["Quiet Chant", "Blooming Rite", "Hungering Hive"],
    telegraph: { primary: 1.35, special: 1.75, phase: 2.0 },
    patternMix: { basic: 0.68, special: 0.26, punish: 0.06 },
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
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "void",
    patternTags: ["void_beam", "prediction_snipe", "blast_grid"],
    signaturePatterns: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"],
    phaseTitles: ["Distant Crown", "Fractured Orbit", "Regent Unbound"],
    telegraph: { primary: 1.45, special: 1.85, phase: 2.15 },
    patternMix: { basic: 0.66, special: 0.27, punish: 0.07 },
    escorts: ["mortar", "sniper", "stalker"]
  }
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
    signaturePatterns: ["duelist_cross", "duelist_charge", "duelist_cleave"],
    telegraph: { primary: 0.82, special: 1.14, phase: 1.2 },
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
    signaturePatterns: ["plague_pool", "plague_spit_ring", "plague_barrier_burst"],
    telegraph: { primary: 0.9, special: 1.2, phase: 1.25 },
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
    signaturePatterns: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe"],
    telegraph: { primary: 0.86, special: 1.18, phase: 1.28 },
    patternMix: { basic: 0.72, special: 0.24, punish: 0.04 },
    hpMul: 0.86,
    damageMul: 0.92,
    speedMul: 1.12
  }
};

const CHAPTER_STAGE_PROFILES = {
  1: {
    chapter: 1,
    name: "Old Gate",
    theme: "stone corridors and iron patrols",
    combatFocus: "learning enemy tells and basic routing",
    visualTone: {
      base: "#0f0c0c",
      side: "#11100f",
      torch: "#f97316",
      torchSoft: "#facc15",
      scarA: "#d6b76d",
      scarB: "#7e9fb2",
      fog: "#3f2f24",
      rune: "#d6b76d"
    },
    stagePressureMul: 1,
    specialEnemyBudget: 0.72,
    bossTelegraphBias: 1.12
  },
  2: {
    chapter: 2,
    name: "Green Warren",
    theme: "ritual gardens and poison lanes",
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
    theme: "fractured halls and predictive pressure",
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

let nextClientId = 1;
let nextEnemyId = 1;
let nextProjectileId = 1;
let nextHazardId = 1;
let nextEffectId = 1;
let nextChestId = 1;
let nextXpOrbId = 1;
let nextBotId = 1;

const clients = new Map();
const rooms = new Map();

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
    maxHp: 176,
    speed: 170,
    damage: 26,
    range: 96,
    attackCd: 0.52,
    skillCd: 7.8,
    projectileSpeed: 0,
    armor: 0.07,
    crit: 0.02,
    regen: 0.2
  },
  ranger: {
    label: "궁수",
    icon: "R",
    color: "#7fa671",
    maxHp: 114,
    speed: 238,
    damage: 18,
    range: 540,
    attackCd: 0.3,
    skillCd: 7.35,
    projectileSpeed: 650,
    armor: 0.02,
    crit: 0.08,
    regen: 0.2
  },
  mage: {
    label: "마법사",
    icon: "M",
    color: "#8d7cae",
    maxHp: 122,
    speed: 202,
    damage: 40,
    range: 500,
    attackCd: 0.52,
    skillCd: 7.9,
    projectileSpeed: 560,
    armor: 0,
    crit: 0.04,
    regen: 0.2
  },
  engineer: {
    label: "기계공",
    icon: "E",
    color: "#d6b76d",
    maxHp: 128,
    speed: 205,
    damage: 20,
    range: 450,
    attackCd: 0.38,
    skillCd: 8.1,
    projectileSpeed: 620,
    armor: 0.04,
    crit: 0.04,
    regen: 0.22
  },
  puppeteer: {
    label: "인형사",
    icon: "P",
    color: "#b985c8",
    maxHp: 118,
    speed: 214,
    damage: 22,
    range: 480,
    attackCd: 0.42,
    skillCd: 8.4,
    projectileSpeed: 590,
    armor: 0.02,
    crit: 0.05,
    regen: 0.2
  },
  martialist: {
    label: "무투가",
    icon: "F",
    color: "#d08b5f",
    maxHp: 138,
    speed: 232,
    damage: 18,
    range: 118,
    attackCd: 0.34,
    skillCd: 6.9,
    projectileSpeed: 0,
    armor: 0.035,
    crit: 0.07,
    regen: 0.24
  },
  alchemist: {
    label: "연금술사",
    icon: "A",
    color: "#9aa15f",
    maxHp: 124,
    speed: 202,
    damage: 19,
    range: 470,
    attackCd: 0.48,
    skillCd: 7.4,
    projectileSpeed: 610,
    armor: 0.02,
    crit: 0.04,
    regen: 0.2
  },
  assassin: {
    label: "암살자",
    icon: "S",
    color: "#8a6f9e",
    maxHp: 108,
    speed: 252,
    damage: 21,
    range: 132,
    attackCd: 0.31,
    skillCd: 7.1,
    projectileSpeed: 720,
    armor: 0.01,
    crit: 0.12,
    regen: 0.18
  },
  cleric: {
    label: "성직자",
    icon: "C",
    color: "#caa35a",
    maxHp: 145,
    speed: 186,
    damage: 15,
    range: 410,
    attackCd: 0.45,
    skillCd: 9.6,
    projectileSpeed: 480,
    armor: 0.05,
    crit: 0.03,
    regen: 0.65
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
  assassin: { cooldown: 0.95, distance: 190, style: "shadow_dash", charges: 2, chainCooldown: 0.14 },
  cleric: { cooldown: 1.75, distance: 164, style: "cleric_pulse" }
};

const RARITY_ORDER = ["common", "uncommon", "rare", "unique", "legendary", "mythic"];
const RARITY_META = {
  common: { label: "COMMON", score: 1, relicWeight: 54, skillWeight: 42, maxLevel: 3 },
  uncommon: { label: "UNCOMMON", score: 2, relicWeight: 28, skillWeight: 28, maxLevel: 2 },
  rare: { label: "RARE", score: 3, relicWeight: 13, skillWeight: 17, maxLevel: 2 },
  unique: { label: "UNIQUE", score: 4, relicWeight: 4.8, skillWeight: 7.2, maxLevel: 1 },
  legendary: { label: "LEGENDARY", score: 5, relicWeight: 1.1, skillWeight: 2.2, maxLevel: 1 },
  mythic: { label: "MYTHIC", score: 6, relicWeight: 0.24, skillWeight: 0.62, maxLevel: 1 }
};
const LEGACY_RARITY_ALIASES = { epic: "unique" };

const DISABLED_SKILL_UPGRADES = new Set([
  "warrior_guardian",
  "warrior_charge_aftershock",
  "warrior_sword_reach",
  "warrior_vanguard_stride",
  "ranger_focus_fire",
  "ranger_double_step",
  "mage_chain_anchor",
  "mage_orbit_expansion",
  "mage_quick_cast"
]);

const DISABLED_RELIC_IDS = new Set([
  "swift_boots",
  "kinetic_spurs",
  "iron_oath",
  "heartstone",
  "living_moss",
  "glass_star",
  "execution_mark",
  "clockwork_core",
  "arcane_orbit",
  "longshot_lens",
  "pity_engine"
]);

const skillUpgrades = {
  warrior: [
    { id: "warrior_taunt", slot: "e", name: "도발", text: "E: 주변 적을 끌어오고 4초간 거대화하며 받는 피해가 감소합니다." },
    { id: "warrior_charge", slot: "r", name: "방패 돌진", text: "R: 넓은 경로로 돌진하며 적을 멀리 밀쳐냅니다." },
    { id: "warrior_cleave", slot: "f", name: "광역 베기", text: "F: 넓은 전방 베기로 다수의 적을 정리합니다." },
    { id: "warrior_guardian", name: "철벽 훈련", text: "방어 +10%, 최대 체력 +30." },
    { id: "warrior_warlord", name: "전장의 지휘", text: "피해 +15%, Q 강철 회오리 범위 +10%." },
    { id: "warrior_taunt_bastion", requires: ["warrior_taunt"], name: "요새 도발", text: "도발의 보호막과 받는 피해 감소 시간이 크게 증가합니다." },
    { id: "warrior_taunt_pull", requires: ["warrior_taunt"], name: "끌어당기는 도전", text: "도발이 일반 적을 살짝 끌어당기고 돌진 예열을 끊습니다." },
    { id: "warrior_charge_crash", requires: ["warrior_charge"], name: "파쇄 돌진", text: "방패 돌진 폭, 피해, 밀어내기 거리가 증가합니다." },
    { id: "warrior_charge_aftershock", requires: ["warrior_charge"], name: "방패 충격파", text: "방패 돌진의 충격 범위와 충돌감이 강해집니다." },
    { id: "warrior_cleave_execution", requires: ["warrior_cleave"], name: "처형의 호", text: "광역 베기가 체력이 낮은 적에게 추가 피해를 줍니다." },
    { id: "warrior_cleave_guard", requires: ["warrior_cleave"], name: "수호의 베기", text: "광역 베기로 적을 맞힐 때마다 보호막을 얻습니다." },
    { id: "warrior_sword_reach", name: "장병 파지", text: "검 사거리와 스킬 범위가 증가합니다." },
    { id: "warrior_blood_heat", name: "전열 가열", text: "기본 공격 쿨다운 -12%, 치명타 +6%." },
    { id: "warrior_unbreakable", name: "불굴", text: "최대 체력과 방어가 증가하고 밀어내기 피해가 강해집니다." },
    { id: "warrior_vanguard_stride", name: "선봉 보법", text: "이동 속도와 돌진 거리가 소폭 증가합니다." },
    { id: "warrior_riposte", name: "반격 자세", text: "방어가 증가하고 받은 피해 일부를 적에게 되돌립니다." }
  ],
  ranger: [
    { id: "ranger_pierce", slot: "e", name: "관통 사격", text: "E: 넓은 관통 화살을 발사해 직선상의 적을 쓸어냅니다." },
    { id: "ranger_trap", slot: "r", name: "레인 에로우", text: "R: 조준 위치에 화살비를 내려 범위 지속 피해를 줍니다." },
    { id: "ranger_poison", slot: "f", name: "독화살", text: "F: 독 화살을 발사해 지속 피해를 남깁니다." },
    { id: "ranger_eagle_eye", name: "매의 눈", text: "기본 공격 사거리 +14%, 치명타 +6%." },
    { id: "ranger_quickdraw", name: "속사 훈련", text: "기본 공격 쿨다운 -10%, 이동 속도 +6%." },
    { id: "ranger_multishot", name: "분열 난사", text: "Q 연발 사격의 화살 수와 부채꼴 폭이 증가합니다." },
    { id: "ranger_bodkin", requires: ["ranger_pierce"], name: "거대 관통촉", text: "관통 사격의 폭, 사거리, 관통 수, 피해가 증가합니다." },
    { id: "ranger_trap_barbs", requires: ["ranger_trap"], name: "폭우", text: "레인 에로우의 범위, 지속시간, 타격 빈도가 증가합니다." },
    { id: "ranger_trap_chain", requires: ["ranger_trap"], name: "낙뢰 화살비", text: "레인 에로우가 적중 후 주변 적에게 번개처럼 튕깁니다." },
    { id: "ranger_poison_focus", requires: ["ranger_poison"], name: "맹독 촉", text: "독 지속 시간과 초당 피해가 증가합니다." },
    { id: "ranger_poison_cloud", requires: ["ranger_poison"], name: "독성 폭발", text: "독화살이 명중 지점 주변 적에게도 독을 퍼뜨립니다." },
    { id: "ranger_kiting", name: "카이팅 폼", text: "대시 재충전과 이동 속도가 개선됩니다." },
    { id: "ranger_execution", name: "사냥꾼의 표식", text: "치명타와 정예/보스 추가 피해가 증가합니다." },
    { id: "ranger_focus_fire", name: "집중 사격", text: "최종 피해와 기본 공격 사거리가 증가합니다." },
    { id: "ranger_soft_spot", name: "약점 해부", text: "취약/중독/감속 상태의 적에게 주는 피해가 증가합니다." },
    { id: "ranger_double_step", name: "더블 스텝", text: "대시 거리가 증가하고 재충전이 더 빨라집니다." }
  ],
  mage: [
    { id: "mage_frost", slot: "e", name: "빙결 파동", text: "E: 주변 적을 감속시키고 일부를 짧게 얼립니다." },
    { id: "mage_meteor", slot: "r", name: "운석", text: "R: 조준 위치에 큰 지연 폭발을 호출합니다." },
    { id: "mage_chain", slot: "f", name: "연쇄 번개", text: "F: 적 사이를 튕기는 번개를 방출합니다." },
    { id: "mage_arcane_focus", name: "비전 집중", text: "마법 폭발 반경 +22%, 스킬 쿨다운 -8%." },
    { id: "mage_storm_core", name: "폭풍 핵", text: "피해 +10%, 기본 공격이 더 넓게 폭발합니다." },
    { id: "mage_absolute_zero", requires: ["mage_frost"], name: "절대 영도", text: "빙결 파동 범위와 빙결 시간이 증가합니다." },
    { id: "mage_frost_shatter", requires: ["mage_frost"], name: "빙하 파쇄", text: "빙결 파동이 더 강한 냉기 피해를 줍니다." },
    { id: "mage_wildfire", requires: ["mage_meteor"], name: "불바다 확장", text: "운석 폭발과 불바다 범위, 지속 피해가 증가합니다." },
    { id: "mage_twin_meteor", requires: ["mage_meteor"], name: "쌍둥이 낙하", text: "운석이 떨어진 뒤 양옆에 작은 운석이 추가로 떨어집니다." },
    { id: "mage_chain_overload", requires: ["mage_chain"], name: "과부하 연쇄", text: "연쇄 번개의 튕김 수, 거리, 피해 유지율이 증가합니다." },
    { id: "mage_chain_anchor", requires: ["mage_chain"], name: "번개 닻", text: "연쇄 번개의 시작 사거리와 첫 타격 피해가 증가합니다." },
    { id: "mage_starlance", name: "별창 조율", text: "기본 마법 사거리와 최종 피해가 증가합니다." },
    { id: "mage_mana_surge", name: "마력 쇄도", text: "스킬 쿨다운이 더 빠르게 회복됩니다." },
    { id: "mage_orbit_expansion", name: "궤도 확장", text: "마법 폭발 반경과 기본 마법 사거리가 증가합니다." },
    { id: "mage_ember_skin", name: "잿불 각인", text: "화상과 상태이상 피해가 증가하고 생존력이 조금 오릅니다." },
    { id: "mage_quick_cast", name: "속성 영창", text: "기본 공격과 스킬 쿨다운이 함께 감소합니다." }
  ],
  engineer: [
    { id: "engineer_turret", slot: "e", name: "자동 터렛", text: "E: 조준 위치에 자동 사격 터렛을 설치합니다." },
    { id: "engineer_mine", slot: "r", name: "감전 지뢰", text: "R: 적이 밟으면 폭발하고 짧게 감전시키는 지뢰를 설치합니다." },
    { id: "engineer_drone", slot: "f", name: "호위 드론", text: "F: 주변을 돌며 적을 자동 공격하는 드론을 호출합니다." },
    { id: "engineer_calibration", name: "고속 보정", text: "설치물 공격 속도와 스킬 쿨다운이 개선됩니다." },
    { id: "engineer_reinforced_frame", name: "강화 프레임", text: "최대 체력과 방어가 증가하고 설치물 지속 시간이 증가합니다." },
    { id: "engineer_twin_turret", requires: ["engineer_turret"], name: "쌍열 터렛", text: "터렛 설치 시 보조 소형 터렛이 함께 배치됩니다." },
    { id: "engineer_rail_turret", requires: ["engineer_turret"], name: "레일 터렛", text: "터렛 탄환이 더 빠르고 더 멀리 관통합니다." },
    { id: "engineer_chain_mine", requires: ["engineer_mine"], name: "연쇄 지뢰", text: "지뢰 폭발이 주변 적에게 전기 피해를 추가로 튕깁니다." },
    { id: "engineer_sticky_mine", requires: ["engineer_mine"], name: "점착 폭약", text: "지뢰 폭발 범위와 피해가 증가하고 적을 더 강하게 밀칩니다." },
    { id: "engineer_drone_swarm", requires: ["engineer_drone"], name: "드론 편대", text: "드론이 2기로 증가하고 공격 주기가 빨라집니다." },
    { id: "engineer_interceptor", requires: ["engineer_drone"], name: "요격 드론", text: "드론 피해와 사거리가 증가하고 투사체를 요격하는 느낌의 보호막을 얻습니다." },
    { id: "engineer_overclock", name: "과부하", text: "Q 과부하 피해와 설치물 공격 속도가 증가합니다." },
    { id: "engineer_legend_factory", requires: ["engineer_turret", "engineer_drone"], rarity: "legendary", minLevel: 8, name: "휴대 공장", text: "터렛과 드론이 더 오래 유지되고 과부하가 작은 폭발을 추가 생성합니다." },
    { id: "engineer_mythic_singularity_core", requires: ["engineer_chain_mine", "engineer_overclock"], rarity: "mythic", minLevel: 11, name: "특이점 코어", text: "과부하가 주변 적을 끌어당긴 뒤 큰 전기 폭발을 일으킵니다." }
  ],
  puppeteer: [
    { id: "puppeteer_puppet", slot: "e", name: "살아있는 인형", text: "E: 인형을 소환합니다. 이미 있으면 돌진 경로에 실표식을 새기고 도착 지점에서 찢어냅니다." },
    { id: "puppeteer_bind", slot: "r", name: "실 결계", text: "R: 본체, 인형, 조준점을 잇는 결계를 펼쳐 실표식을 쌓고 표식이 쌓인 적을 절단합니다." },
    { id: "puppeteer_swap", slot: "f", name: "피날레 교대", text: "F: 인형과 위치를 교대하며 경로와 양끝의 실표식을 폭발시킵니다." },
    { id: "puppeteer_fine_thread", name: "정밀한 실", text: "실바늘 사거리와 치명타가 증가하고 실표식 지속 시간이 길어집니다." },
    { id: "puppeteer_soul_stitch", name: "영혼 봉합", text: "인형 지속 시간, 본체 생존력, 실표식 최대 중첩이 증가합니다." },
    { id: "puppeteer_razor_puppet", requires: ["puppeteer_puppet"], name: "칼날 인형", text: "인형 공격이 실표식을 더 많이 쌓고 표식 폭발 피해가 증가합니다." },
    { id: "puppeteer_guard_puppet", requires: ["puppeteer_puppet"], name: "수호 인형", text: "인형 근처 적이 느려지고, 본체가 위험할 때 인형이 추가 보호막을 제공합니다." },
    { id: "puppeteer_thread_saw", requires: ["puppeteer_bind"], name: "톱날 실", text: "실 결계 폭이 넓어지고 결계에 닿은 실표식 적을 더 강하게 절단합니다." },
    { id: "puppeteer_cross_bind", requires: ["puppeteer_bind"], name: "십자 결박", text: "실 결계 중심에 십자 실을 추가로 펼쳐 표식을 빠르게 쌓습니다." },
    { id: "puppeteer_backstage", requires: ["puppeteer_swap"], name: "무대 뒤 걸음", text: "피날레 교대 후 짧은 보호막과 이동 속도를 얻고 표식 폭발 반경이 증가합니다." },
    { id: "puppeteer_finale", requires: ["puppeteer_swap"], name: "피날레 절단", text: "실표식 폭발이 체력이 낮은 적에게 강해지고 양끝 베기가 커집니다." },
    { id: "puppeteer_dual_cast", name: "이중 조종", text: "인형이 있을 때 Q와 기본 공격이 실표식을 더 빠르게 쌓고 스킬 쿨다운이 줄어듭니다." },
    { id: "puppeteer_legend_twin_souls", requires: ["puppeteer_puppet", "puppeteer_bind"], rarity: "legendary", minLevel: 8, name: "쌍혼", text: "실 결계 후 인형이 중심으로 재돌진하며 표식 적에게 추가 절단을 일으킵니다." },
    { id: "puppeteer_mythic_grand_theater", requires: ["puppeteer_finale", "puppeteer_cross_bind"], rarity: "mythic", minLevel: 11, name: "대극장", text: "Q 인형극이 본체와 인형 양쪽에서 터지고 모든 실표식을 한 번 더 폭발시킵니다." }
  ],
  martialist: [
    { id: "martial_palm", slot: "e", name: "파쇄장", text: "E: 기력을 소모해 전방 장풍을 강화하고, 풀기력 시 두 번째 충격파가 터집니다." },
    { id: "martial_rising", slot: "r", name: "승룡각", text: "R: 돌진해 경로의 적을 띄우듯 밀어내며, 보유 기력에 따라 추가 타격이 붙습니다." },
    { id: "martial_focus", slot: "f", name: "기합 폭발", text: "F: 모든 기력을 폭발시켜 보호막, 이동 속도, 주변 밀쳐내기를 강화합니다." },
    { id: "martial_combo_flow", name: "연환 흐름", text: "기력 최대치와 획득량이 증가하고 3타 보호막이 강해집니다." },
    { id: "martial_iron_body", name: "금강신체", text: "최대 체력과 방어가 증가합니다." },
    { id: "martial_afterimage", name: "잔상 보법", text: "대시 재충전과 이동 속도가 개선되고 대시 후 첫 타격이 기력을 얻습니다." },
    { id: "martial_dragon_pulse", name: "용맥 타격", text: "기력 강화 스킬의 범위와 최종 피해가 증가합니다." },
    { id: "martial_counter", name: "반격 호흡", text: "피격 후 짧은 반격 호흡을 얻어 다음 기력 획득과 반사 피해가 증가합니다." },
    { id: "martial_palm_breaker", requires: ["martial_palm"], name: "분쇄 파동", text: "파쇄장의 폭, 피해, 밀어내기가 증가하고 풀기력 충격파가 더 커집니다." },
    { id: "martial_rising_chain", requires: ["martial_rising"], name: "연속 승룡", text: "승룡각이 명중 시 짧은 후속 발차기를 남기고 쿨다운 회복을 얻습니다." },
    { id: "martial_focus_guard", requires: ["martial_focus"], name: "기백 보호", text: "기합 폭발의 보호막과 지속 시간이 증가하며 기력 1칸을 남깁니다." },
    { id: "martial_legend_dragon_soul", requires: ["martial_palm", "martial_rising"], rarity: "legendary", minLevel: 8, name: "용혼", text: "기력 강화 파쇄장과 승룡각이 용의 잔상 충격파를 남깁니다." },
    { id: "martial_mythic_infinite_combo", requires: ["martial_combo_flow", "martial_dragon_pulse"], rarity: "mythic", minLevel: 11, name: "무한 연격", text: "풀기력 스킬 사용 후 짧게 무한 연격 상태가 되어 스킬 쿨다운이 빠르게 줄어듭니다." }
  ],
  alchemist: [
    { id: "alchemist_acid", slot: "e", name: "산성 플라스크", text: "E: 산성 장판을 만들어 중독/감속을 남깁니다. 화염과 만나면 증류 폭발이 발생합니다." },
    { id: "alchemist_fire", slot: "r", name: "화염 플라스크", text: "R: 화염 장판을 만들어 화상을 남깁니다. 산성과 만나면 증류 폭발이 발생합니다." },
    { id: "alchemist_elixir", slot: "f", name: "전투 영약", text: "F: 주변 아군을 회복하고 보호막/이동 속도를 부여하며 작은 치유 안개를 남깁니다." },
    { id: "alchemist_bigger_bottle", name: "대용량 병", text: "플라스크 폭발, 장판 범위, 증류 폭발 범위가 증가합니다." },
    { id: "alchemist_fast_mix", name: "고속 배합", text: "스킬 쿨다운과 기본 공격 쿨다운이 감소하고 촉매 폭탄 반응 속도가 빨라집니다." },
    { id: "alchemist_corrosive", name: "부식 촉매", text: "산성 장판이 방어를 녹이는 느낌으로 추가 피해를 주고 상태이상 피해가 증가합니다." },
    { id: "alchemist_chain_reaction", name: "연쇄 반응", text: "Q 촉매 폭탄이 주변 장판을 강제로 반응시키고 작은 보조 폭발을 일으킵니다." },
    { id: "alchemist_panacea", name: "만능 영약", text: "전투 영약의 회복량, 보호막, 치유 안개 지속 시간이 증가합니다." },
    { id: "alchemist_acid_storm", requires: ["alchemist_acid"], name: "산성 폭우", text: "산성 플라스크의 지속 시간과 피해 빈도가 증가하고 반응 후 산성 잔류물이 남습니다." },
    { id: "alchemist_fire_sea", requires: ["alchemist_fire"], name: "불바다 병", text: "화염 플라스크의 범위와 화상 피해가 증가하고 반응 후 화염 잔류물이 남습니다." },
    { id: "alchemist_elixir_cloud", requires: ["alchemist_elixir"], name: "영약 안개", text: "전투 영약이 더 넓은 범위에 적용되고 독을 정화하며 안개 안의 아군을 계속 회복합니다." },
    { id: "alchemist_legend_philosopher", requires: ["alchemist_acid", "alchemist_fire"], rarity: "legendary", minLevel: 8, name: "현자의 촉매", text: "증류 폭발이 더 강해지고 산성/화염 장판이 겹치면 자동으로 반응합니다." },
    { id: "alchemist_mythic_homunculus_mix", requires: ["alchemist_panacea", "alchemist_chain_reaction"], rarity: "mythic", minLevel: 11, name: "호문쿨루스 배합", text: "Q와 전투 영약이 작은 산성/화염 플라스크를 흩뿌려 연쇄 반응을 만듭니다." }
  ],
  assassin: [
    { id: "assassin_mark", slot: "e", name: "사신 표식", text: "E: 조준 근처 적과 주변 2명에게 표식을 새깁니다. 표식은 처형 추가타의 핵심입니다." },
    { id: "assassin_lunge", slot: "r", name: "그림자 찌르기", text: "R: 조준 방향으로 파고들며 표식 대상에게 그림자 추가타와 처형 피해를 줍니다." },
    { id: "assassin_smoke", slot: "f", name: "연막 분신", text: "F: 짧은 면역/속도를 얻고 분신이 주변 표식 대상에게 추가 베기를 날립니다." },
    { id: "assassin_quick_blade", name: "속검", text: "기본 공격과 Q 쿨다운이 감소하고 표식 적중 시 쿨다운 회복량이 증가합니다." },
    { id: "assassin_deep_cut", name: "깊은 상처", text: "치명타와 표식 대상 근접 피해가 증가합니다." },
    { id: "assassin_execution", name: "처형 본능", text: "체력이 낮은 적에게 그림자 추가타가 강해지고 정예/보스 피해가 증가합니다." },
    { id: "assassin_shadowstep", name: "그림자 걸음", text: "대시 재충전과 대시 거리가 개선되고 대시 직후 첫 표식 타격이 강해집니다." },
    { id: "assassin_fan", name: "칼날 부채", text: "Q 칼날 난무의 폭이 넓어지고 표식 대상 주변에 그림자 칼날이 추가로 떨어집니다." },
    { id: "assassin_mark_reaper", requires: ["assassin_mark"], name: "수확 표식", text: "사신 표식 대상 수, 지속 시간, 표식 처형 피해가 증가합니다." },
    { id: "assassin_lunge_reset", requires: ["assassin_lunge"], name: "그림자 회수", text: "그림자 찌르기가 표식 대상 명중 시 Q 쿨다운을 크게 되돌립니다." },
    { id: "assassin_smoke_bomb", requires: ["assassin_smoke"], name: "짙은 연막", text: "연막 범위와 면역 시간이 증가하고 분신 베기가 더 많은 적을 추적합니다." },
    { id: "assassin_legend_nightfall", requires: ["assassin_mark", "assassin_lunge"], rarity: "legendary", minLevel: 8, name: "밤의 처형식", text: "표식 대상을 찌르면 주변 표식이 함께 폭발하고 그림자 파편이 튑니다." },
    { id: "assassin_mythic_death_blossom", requires: ["assassin_fan", "assassin_execution"], rarity: "mythic", minLevel: 11, name: "죽음의 개화", text: "Q 칼날 난무가 두 번 펼쳐지고 표식 적을 처형하면 그림자 추가타가 연쇄됩니다." }
  ],
  cleric: [
    { id: "cleric_barrier", slot: "e", name: "보호막", text: "E: 주변 아군에게 보호막을 부여합니다." },
    { id: "cleric_revive", slot: "r", name: "부활", text: "R: 범위 안의 쓰러진 아군 한 명을 되살립니다." },
    { id: "cleric_cleanse", slot: "f", name: "정화", text: "F: 해로운 효과를 제거하고 짧은 면역을 부여합니다." },
    { id: "cleric_devotion", name: "헌신", text: "최대 체력 +24, 치유량과 보호막이 증가합니다." },
    { id: "cleric_grace", name: "은총", text: "스킬 쿨다운 -12%, 체력 재생 +0.7." }
  ]
};

skillUpgrades.warrior.push(
  {
    id: "warrior_legend_colossus",
    requires: ["warrior_taunt", "warrior_charge"],
    rarity: "legendary",
    minLevel: 8,
    name: "거신의 맹세",
    text: "도발과 방패 돌진이 거대화됩니다. 도발 지속/보호막/방패 밀어내기가 크게 증가합니다."
  },
  {
    id: "warrior_mythic_worldsplitter",
    requires: ["warrior_cleave", "warrior_charge_crash"],
    rarity: "mythic",
    minLevel: 11,
    name: "세계 가르기",
    text: "광역 베기 끝 지점에 추가 충격파가 터져 먼 적까지 베어냅니다."
  }
);

skillUpgrades.ranger.push(
  {
    id: "ranger_legend_storm_quiver",
    requires: ["ranger_pierce", "ranger_multishot"],
    rarity: "legendary",
    minLevel: 8,
    name: "폭풍 화살통",
    text: "연발 사격과 관통 사격이 적중 후 주변 적에게 번개처럼 튕깁니다."
  },
  {
    id: "ranger_mythic_plague_garden",
    requires: ["ranger_trap_chain", "ranger_poison_cloud"],
    rarity: "mythic",
    minLevel: 11,
    name: "역병 정원",
    text: "레인 에로우가 독비 정원으로 변해 범위 안 적에게 지속 독 피해를 남깁니다."
  }
);

skillUpgrades.mage.push(
  {
    id: "mage_legend_supercell",
    requires: ["mage_chain_overload", "mage_frost"],
    rarity: "legendary",
    minLevel: 8,
    name: "초뇌운",
    text: "연쇄 번개가 튕길 때마다 감속을 남기고, 얼어붙은 적에게 더 강해집니다."
  },
  {
    id: "mage_mythic_apocalypse",
    requires: ["mage_meteor", "mage_chain"],
    rarity: "mythic",
    minLevel: 11,
    name: "종말",
    text: "운석 충돌 후 낙뢰가 이어지고 불바다가 더 오래, 더 넓게 남습니다."
  }
);

const SKILL_RARITY_OVERRIDES = {
  warrior_taunt: "unique",
  warrior_charge: "unique",
  warrior_cleave: "unique",
  warrior_guardian: "uncommon",
  warrior_warlord: "rare",
  warrior_taunt_bastion: "rare",
  warrior_taunt_pull: "unique",
  warrior_charge_crash: "rare",
  warrior_charge_aftershock: "unique",
  warrior_cleave_execution: "rare",
  warrior_cleave_guard: "unique",
  ranger_pierce: "unique",
  ranger_trap: "unique",
  ranger_poison: "unique",
  ranger_eagle_eye: "uncommon",
  ranger_quickdraw: "uncommon",
  ranger_multishot: "rare",
  ranger_bodkin: "rare",
  ranger_trap_barbs: "rare",
  ranger_trap_chain: "unique",
  ranger_poison_focus: "rare",
  ranger_poison_cloud: "unique",
  mage_frost: "unique",
  mage_meteor: "unique",
  mage_chain: "unique",
  mage_arcane_focus: "uncommon",
  mage_storm_core: "rare",
  mage_absolute_zero: "rare",
  mage_frost_shatter: "unique",
  mage_wildfire: "rare",
  mage_twin_meteor: "legendary",
  mage_chain_overload: "unique",
  mage_chain_anchor: "rare",
  engineer_turret: "unique",
  engineer_mine: "unique",
  engineer_drone: "unique",
  engineer_calibration: "uncommon",
  engineer_reinforced_frame: "uncommon",
  engineer_twin_turret: "rare",
  engineer_rail_turret: "unique",
  engineer_chain_mine: "rare",
  engineer_sticky_mine: "rare",
  engineer_drone_swarm: "unique",
  engineer_interceptor: "rare",
  engineer_overclock: "rare",
  puppeteer_puppet: "unique",
  puppeteer_bind: "unique",
  puppeteer_swap: "unique",
  puppeteer_fine_thread: "uncommon",
  puppeteer_soul_stitch: "uncommon",
  puppeteer_razor_puppet: "rare",
  puppeteer_guard_puppet: "rare",
  puppeteer_thread_saw: "rare",
  puppeteer_cross_bind: "unique",
  puppeteer_backstage: "rare",
  puppeteer_finale: "unique",
  puppeteer_dual_cast: "rare",
  martial_palm: "unique",
  martial_rising: "unique",
  martial_focus: "unique",
  martial_combo_flow: "uncommon",
  martial_iron_body: "uncommon",
  martial_afterimage: "uncommon",
  martial_dragon_pulse: "rare",
  martial_counter: "rare",
  martial_palm_breaker: "rare",
  martial_rising_chain: "rare",
  martial_focus_guard: "rare",
  alchemist_acid: "unique",
  alchemist_fire: "unique",
  alchemist_elixir: "unique",
  alchemist_bigger_bottle: "uncommon",
  alchemist_fast_mix: "uncommon",
  alchemist_corrosive: "rare",
  alchemist_chain_reaction: "rare",
  alchemist_panacea: "rare",
  alchemist_acid_storm: "rare",
  alchemist_fire_sea: "rare",
  alchemist_elixir_cloud: "unique",
  assassin_mark: "unique",
  assassin_lunge: "unique",
  assassin_smoke: "unique",
  assassin_quick_blade: "uncommon",
  assassin_deep_cut: "uncommon",
  assassin_execution: "rare",
  assassin_shadowstep: "uncommon",
  assassin_fan: "rare",
  assassin_mark_reaper: "rare",
  assassin_lunge_reset: "rare",
  assassin_smoke_bomb: "rare"
};

const firstJobChoices = [
  {
    id: "job_warrior",
    name: "1차 전직: 전사",
    text: "근접 베기와 강철 회오리를 쓰는 전열 역할입니다.",
    classId: "warrior"
  },
  {
    id: "job_ranger",
    name: "1차 전직: 궁수",
    text: "긴 사거리와 빠른 투사체로 우선순위를 처리합니다.",
    classId: "ranger"
  },
  {
    id: "job_mage",
    name: "1차 전직: 마법사",
    text: "폭발과 상태이상으로 무리를 제어합니다.",
    classId: "mage"
  }
];

const risks = [
  {
    id: "safe_path",
    name: "보통 방",
    text: "추가 변형이 없는 표준 전투입니다.",
    rarityBoost: 0,
    xpMul: 1,
    spawnMul: 1,
    noClearHeal: false,
    earlyBoss: false
  },
  {
    id: "swarm_contract",
    name: "군세 방",
    text: "적 수 +30%. 유물 상자 희귀도 보정이 증가합니다.",
    rarityBoost: 0.16,
    xpMul: 1,
    spawnMul: 1.3,
    noClearHeal: false,
    earlyBoss: false
  },
  {
    id: "glass_run",
    name: "유리 방",
    text: "클리어 회복이 사라지는 대신 경험치가 1.2배입니다.",
    rarityBoost: 0.08,
    xpMul: 1.18,
    spawnMul: 1.08,
    noClearHeal: true,
    earlyBoss: false
  },
  {
    id: "early_boss",
    name: "문지기 방",
    text: "미니 문지기가 추가됩니다. 에픽 유물 확률이 증가합니다.",
    rarityBoost: 0.22,
    xpMul: 1.04,
    spawnMul: 1.08,
    noClearHeal: false,
    earlyBoss: true
  }
];

const waveTraits = {
  horde: {
    id: "horde",
    name: "군세",
    text: "가벼운 적이 더 많이, 더 빠르게 몰려옵니다.",
    spawnMul: 1.28,
    speedMul: 1.1,
    anchorTypes: ["bat", "bomber", "splitter"],
    bias: [
      ["bat", 0.26],
      ["slime", 0.28],
      ["splitter", 0.14],
      ["bomber", 0.12],
      ["charger", 0.04],
      ["sniper", 0.05],
      ["stalker", 0.04],
      ["spitter", 0.04],
      ["brute", 0.04]
    ]
  },
  bulwark: {
    id: "bulwark",
    name: "방벽 진형",
    text: "수호자 오라와 투사, 포격수가 같이 압박합니다.",
    spawnMul: 0.96,
    hpMul: 1.22,
    damageMul: 1.02,
    anchorTypes: ["guardian", "brute", "mortar"],
    bias: [
      ["guardian", 0.17],
      ["brute", 0.22],
      ["slime", 0.2],
      ["bat", 0.11],
      ["mortar", 0.08],
      ["shaman", 0.08],
      ["splitter", 0.08],
      ["sniper", 0.06],
      ["spitter", 0.05]
    ]
  },
  ritual: {
    id: "ritual",
    name: "의식",
    text: "주술사와 저격수가 처치 우선순위를 흔듭니다.",
    spawnMul: 1,
    damageMul: 1,
    anchorTypes: ["shaman", "sniper", "spitter"],
    bias: [
      ["shaman", 0.15],
      ["sniper", 0.16],
      ["slime", 0.22],
      ["bat", 0.14],
      ["spitter", 0.08],
      ["mortar", 0.07],
      ["guardian", 0.08],
      ["charger", 0.035]
    ]
  },
  volatile: {
    id: "volatile",
    name: "폭주",
    text: "자폭병과 돌진병이 뭉친 파티를 강하게 압박합니다.",
    spawnMul: 1.06,
    damageMul: 1.08,
    speedMul: 1.06,
    anchorTypes: ["bomber", "charger", "splitter"],
    bias: [
      ["bomber", 0.17],
      ["charger", 0.06],
      ["bat", 0.19],
      ["slime", 0.18],
      ["splitter", 0.1],
      ["spitter", 0.06],
      ["sniper", 0.06],
      ["stalker", 0.04],
      ["brute", 0.05]
    ]
  },
  boss: {
    id: "boss_gate",
    name: "보스 관문",
    text: "문지기가 다양한 호위 몬스터와 함께 등장합니다.",
    spawnMul: 0.8,
    hpMul: 1.28,
    damageMul: 1.1,
    anchorTypes: ["brute", "guardian", "charger", "sniper"],
    bias: [
      ["guardian", 0.12],
      ["shaman", 0.1],
      ["spitter", 0.1],
      ["charger", 0.05],
      ["brute", 0.18],
      ["bomber", 0.1],
      ["mortar", 0.08],
      ["sniper", 0.07],
      ["stalker", 0.025],
      ["bat", 0.08],
      ["slime", 0.08]
    ]
  }
};

const BASIC_ENEMY_TYPES = new Set(["slime", "bat", "brute"]);

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
  }
};

const STAGE_REWARD_RULES = {
  combat: { xpMul: 1, clearXp: 14, chestBonus: 0, rarityBoost: 0, clearChest: 0, label: "Normal reward" },
  elite: { xpMul: 1.08, clearXp: 26, chestBonus: 0.01, rarityBoost: 0.13, clearChest: 1, label: "Elite reward" },
  miniboss: { xpMul: 1.12, clearXp: 38, chestBonus: 0.014, rarityBoost: 0.2, clearChest: 1, label: "Mini-boss reward" },
  defense: { xpMul: 1.05, clearXp: 24, chestBonus: 0.008, rarityBoost: 0.1, clearChest: 0, label: "Defense reward" },
  blockade: { xpMul: 1.06, clearXp: 24, chestBonus: 0.009, rarityBoost: 0.09, clearChest: 0, label: "Blockade reward" },
  random: { xpMul: 1.09, clearXp: 28, chestBonus: 0.009, rarityBoost: 0.12, clearChest: 0, label: "Random reward" },
  reward: { xpMul: 0.62, clearXp: 6, chestBonus: 0, rarityBoost: 0.22, clearChest: 0, label: "Treasure reward" },
  boss: { xpMul: 1.18, clearXp: 54, chestBonus: 0.016, rarityBoost: 0.3, clearChest: 0, label: "Boss reward" }
};

const BLOCKADE_RUNNER_TYPES = ["runner", "runner_tank", "runner_fast"];
const DEFENSE_ALLOWED_TYPES = ["slime", "bat", "brute", "bomber", "charger", "splitter", "guardian"];

const relics = [
  {
    id: "keen_blade",
    name: "예리한 칼날",
    text: "최종 피해 +18%. 기본 공격과 스킬 피해에 모두 적용됩니다.",
    rarity: "common",
    target: "공용",
    apply(player) {
      player.damageMul *= 1.18;
    }
  },
  {
    id: "ember_core",
    name: "잿불 핵",
    text: "마법사 전용. 기본 공격과 운석의 폭발 반경이 크게 증가합니다.",
    rarity: "rare",
    target: "마법사 전용",
    classes: ["mage"],
    apply(player) {
      player.areaMul *= 1.08;
      player.splashBonus += 36;
    }
  },
  {
    id: "swift_boots",
    name: "신속의 장화",
    text: "이동 속도 +16%. 회피와 포지셔닝이 쉬워집니다.",
    rarity: "common",
    target: "공용",
    apply(player) {
      player.speedMul *= 1.16;
    }
  },
  {
    id: "wolf_clock",
    name: "늑대 시계",
    text: "기본 공격 재사용 대기시간 -14%. 평타 빌드에 좋습니다.",
    rarity: "common",
    target: "공용",
    apply(player) {
      player.cooldownMul *= 0.86;
    }
  },
  {
    id: "iron_oath",
    name: "강철 맹세",
    text: "최대 체력 +35, 방어 +8%. 생존력을 안정적으로 올립니다.",
    rarity: "common",
    target: "공용",
    apply(player) {
      player.maxHp += 35;
      player.hp += 35;
      player.armor = Math.min(0.55, player.armor + 0.08);
    }
  },
  {
    id: "glass_star",
    name: "유리별",
    text: "치명타 확률 +12%. 순간 화력을 노리는 선택입니다.",
    rarity: "rare",
    target: "공용",
    apply(player) {
      player.crit = Math.min(0.65, player.crit + 0.12);
    }
  },
  {
    id: "vampire_charm",
    name: "흡혈 부적",
    text: "가한 피해의 6%만큼 체력을 회복합니다.",
    rarity: "rare",
    target: "공용",
    apply(player) {
      player.lifeSteal = Math.min(0.2, player.lifeSteal + 0.06);
    }
  },
  {
    id: "longshot_lens",
    name: "장거리 렌즈",
    text: "궁수 전용. 화살 사거리 +22%, 멀리서 우선순위를 처리하기 쉬워집니다.",
    rarity: "common",
    target: "궁수 전용",
    classes: ["ranger"],
    apply(player) {
      player.rangeMul *= 1.22;
    }
  },
  {
    id: "living_moss",
    name: "살아있는 이끼",
    text: "초당 체력 재생 +1.4. 긴 전투에서 유지력이 좋아집니다.",
    rarity: "rare",
    target: "공용",
    apply(player) {
      player.regen += 1.4;
    }
  },
  {
    id: "comet_signet",
    name: "혜성 인장",
    text: "Q/E/R/F 스킬 재사용 대기시간 -20%. 직업 스킬 빌드에 좋습니다.",
    rarity: "epic",
    target: "공용",
    apply(player) {
      player.skillCooldownMul *= 0.8;
    }
  },
  {
    id: "giants_pulse",
    name: "거인의 맥동",
    text: "전사 전용. 베기와 강철 회오리 범위 +24%. 전열 장악력이 커집니다.",
    rarity: "rare",
    target: "전사 전용",
    classes: ["warrior"],
    apply(player) {
      player.areaMul *= 1.24;
    }
  },
  {
    id: "party_banner",
    name: "파티 깃발",
    text: "스테이지 클리어 시 파티 회복량 +15%. 모두에게 체감되는 공용 지원 유물입니다.",
    rarity: "epic",
    target: "파티 공용",
    apply(player) {
      player.clearHealBonus += 0.15;
    }
  },
  {
    id: "vanguard_plate",
    name: "선봉 갑주",
    text: "전사 전용. 최대 체력 +45, 방어 +10%. 앞라인 유지력이 크게 증가합니다.",
    rarity: "common",
    target: "전사 전용",
    classes: ["warrior"],
    apply(player) {
      player.maxHp += 45;
      player.hp += 45;
      player.armor = Math.min(0.55, player.armor + 0.1);
    }
  },
  {
    id: "hawk_fletching",
    name: "매 깃 화살",
    text: "궁수 전용. 기본 공격 피해 +12%, 치명타 확률 +8%. 원거리 처치력이 증가합니다.",
    rarity: "common",
    target: "궁수 전용",
    classes: ["ranger"],
    apply(player) {
      player.damageMul *= 1.12;
      player.crit = Math.min(0.65, player.crit + 0.08);
    }
  },
  {
    id: "arcane_orbit",
    name: "비전 궤도",
    text: "마법사 전용. 마법 폭발 반경 +48px, 스킬 쿨다운 -8%. 광역 제압에 집중합니다.",
    rarity: "rare",
    target: "마법사 전용",
    classes: ["mage"],
    apply(player) {
      player.splashBonus += 48;
      player.skillCooldownMul *= 0.92;
    }
  },
  {
    id: "heartstone",
    name: "심장석",
    text: "최대 체력 +55, 초당 체력 재생 +0.8. 순수 생존형 공용 유물입니다.",
    rarity: "rare",
    target: "공용",
    apply(player) {
      player.maxHp += 55;
      player.hp += 55;
      player.regen += 0.8;
    }
  },
  {
    id: "execution_mark",
    name: "처형 표식",
    text: "치명타 확률 +8%, 최종 피해 +8%. 공격형 공용 유물입니다.",
    rarity: "rare",
    target: "공용",
    apply(player) {
      player.crit = Math.min(0.65, player.crit + 0.08);
      player.damageMul *= 1.08;
    }
  },
  {
    id: "sanctuary_bell",
    name: "성역의 종",
    text: "성직자 전용. 최대 체력 +28, 스킬 쿨다운 -10%. 보호와 부활을 더 자주 돌립니다.",
    rarity: "common",
    target: "성직자 전용",
    classes: ["cleric"],
    apply(player) {
      player.maxHp += 28;
      player.hp += 28;
      player.skillCooldownMul *= 0.9;
    }
  },
  {
    id: "berserker_sigil",
    name: "광전사의 문장",
    text: "체력 40% 이하일 때 치명타 확률 +18%, 잃은 체력에 비례해 피해가 증가합니다.",
    rarity: "rare",
    target: "공용 · 저체력 빌드",
    apply(player) {
      player.lowHpCritBonus += 0.18;
      player.missingHpDamageBonus += 0.2;
    }
  },
  {
    id: "phase_boots",
    name: "위상 장화",
    text: "대시 쿨다운 -18%, 대시 거리 +10%. 위험 장판과 돌진병 대응이 쉬워집니다.",
    rarity: "common",
    target: "공용 · 기동",
    apply(player) {
      player.dashCooldownMul *= 0.82;
      player.dashDistanceMul *= 1.1;
    }
  },
  {
    id: "reaper_coin",
    name: "사신의 동전",
    text: "적 처치 시 최대 체력의 3%를 회복합니다. 연속 처치 유지력이 좋아집니다.",
    rarity: "rare",
    target: "공용 · 처치",
    apply(player) {
      player.onKillHeal += 0.03;
    }
  },
  {
    id: "clockwork_core",
    name: "시계태엽 핵",
    text: "적 처치 시 Q/E/R/F 쿨다운을 0.32초, 대시 쿨다운을 0.18초 줄입니다.",
    rarity: "rare",
    target: "공용 · 쿨다운",
    apply(player) {
      player.onKillCooldownRefund += 0.32;
    }
  },
  {
    id: "hunter_contract",
    name: "사냥 계약",
    text: "엘리트/보스에게 피해 +22%, 유물 상자 드랍 확률이 소폭 증가합니다.",
    rarity: "rare",
    target: "공용 · 엘리트 사냥",
    apply(player) {
      player.eliteDamageMul *= 1.22;
      player.chestDropBonus += 0.02;
    }
  },
  {
    id: "thornmail_fragment",
    name: "가시 갑편",
    text: "방어 +4%. 피해를 받으면 실제 받은 피해의 22%를 공격자에게 반사합니다.",
    rarity: "common",
    target: "공용 · 반격",
    apply(player) {
      player.armor = Math.min(0.55, player.armor + 0.04);
      player.thornsMul += 0.22;
    }
  },
  {
    id: "storm_capacitor",
    name: "폭풍 축전기",
    text: "감속/빙결/독/화상/취약/도발 상태의 적에게 최종 피해 +13%. 상태이상 빌드용입니다.",
    rarity: "rare",
    target: "공용 · 상태이상",
    apply(player) {
      player.statusDamageMul *= 1.13;
    }
  },
  {
    id: "glass_engine",
    name: "유리 엔진",
    text: "최종 피해 +28%, 치명타 +6%. 대신 최대 체력이 14% 감소합니다.",
    rarity: "epic",
    target: "공용 · 고위험 화력",
    apply(player) {
      const loss = Math.max(1, Math.floor(player.maxHp * 0.14));
      player.maxHp = Math.max(1, player.maxHp - loss);
      player.hp = Math.min(player.hp, player.maxHp);
      player.damageMul *= 1.28;
      player.crit = Math.min(0.65, player.crit + 0.06);
    }
  },
  {
    id: "blood_pact",
    name: "피의 계약",
    text: "흡혈 +8%, 최종 피해 +8%. 대신 최대 체력 -12.",
    rarity: "rare",
    target: "공용 · 흡혈",
    apply(player) {
      player.maxHp = Math.max(1, player.maxHp - 12);
      player.hp = Math.min(player.hp, player.maxHp);
      player.lifeSteal = Math.min(0.2, player.lifeSteal + 0.08);
      player.damageMul *= 1.08;
    }
  },
  {
    id: "pity_engine",
    name: "행운 장치",
    text: "유물 상자 드랍 확률이 증가합니다. 전투력 대신 보상 선택지를 넓힙니다.",
    rarity: "common",
    target: "공용 · 보상",
    apply(player) {
      player.chestDropBonus += 0.04;
    }
  },
  {
    id: "bulwark_seal",
    name: "방벽의 인장",
    text: "전사 전용. 대시 피해 +36%, 방어 +6%, 대시 쿨다운 -8%. 돌파형 전열 빌드입니다.",
    rarity: "rare",
    target: "전사 전용 · 대시",
    classes: ["warrior"],
    apply(player) {
      player.dashDamageMul *= 1.36;
      player.dashCooldownMul *= 0.92;
      player.armor = Math.min(0.55, player.armor + 0.06);
    }
  },
  {
    id: "duelist_wrap",
    name: "결투가의 손목끈",
    text: "전사 전용. 기본 공격 쿨다운 -12%, 치명타 +6%. 베기 손맛을 강화합니다.",
    rarity: "common",
    target: "전사 전용 · 평타",
    classes: ["warrior"],
    apply(player) {
      player.cooldownMul *= 0.88;
      player.crit = Math.min(0.65, player.crit + 0.06);
    }
  },
  {
    id: "windrunner_quiver",
    name: "바람추적 화살통",
    text: "궁수 전용. 대시 쿨다운 -22%, 이동 속도 +6%, 기본 공격 사거리 +8%. 카이팅 특화입니다.",
    rarity: "rare",
    target: "궁수 전용 · 기동",
    classes: ["ranger"],
    apply(player) {
      player.dashCooldownMul *= 0.78;
      player.speedMul *= 1.06;
      player.rangeMul *= 1.08;
    }
  },
  {
    id: "eagle_crest",
    name: "매의 문장",
    text: "궁수 전용. 엘리트/보스 피해 +18%, 치명타 +7%. 우선 처치 역할을 강화합니다.",
    rarity: "rare",
    target: "궁수 전용 · 저격",
    classes: ["ranger"],
    apply(player) {
      player.eliteDamageMul *= 1.18;
      player.crit = Math.min(0.65, player.crit + 0.07);
    }
  },
  {
    id: "astral_prism",
    name: "별빛 프리즘",
    text: "마법사 전용. 상태이상 적 피해 +18%, 마법 폭발 반경 +34px.",
    rarity: "rare",
    target: "마법사 전용 · 광역",
    classes: ["mage"],
    apply(player) {
      player.statusDamageMul *= 1.18;
      player.splashBonus += 34;
    }
  },
  {
    id: "frozen_hourglass",
    name: "얼어붙은 모래시계",
    text: "마법사 전용. 스킬 쿨다운 -12%, 상태이상 적 피해 +10%. 빙결/화상 연계용입니다.",
    rarity: "common",
    target: "마법사 전용 · 상태이상",
    classes: ["mage"],
    apply(player) {
      player.skillCooldownMul *= 0.88;
      player.statusDamageMul *= 1.1;
    }
  },
  {
    id: "mercy_censer",
    name: "자비의 향로",
    text: "성직자 전용. 적 처치 시 살아있는 파티원을 소량 회복하고 치유량 +12%.",
    rarity: "rare",
    target: "성직자 전용 · 파티 회복",
    classes: ["cleric"],
    apply(player) {
      player.onKillTeamHeal += 0.025;
      player.healingMul *= 1.12;
    }
  },
  {
    id: "aegis_lantern",
    name: "수호 등불",
    text: "성직자 전용. 보호막 +18%, 치유량 +8%, 스킬 쿨다운 -5%.",
    rarity: "common",
    target: "성직자 전용 · 보호",
    classes: ["cleric"],
    apply(player) {
      player.shieldMul *= 1.18;
      player.healingMul *= 1.08;
      player.skillCooldownMul *= 0.95;
    }
  }
];

relics.push(
  {
    id: "kinetic_spurs",
    name: "운동 박차",
    text: "대시 거리 +12%, 대시 쿨다운 -10%. 기동 빌드의 기본 유물입니다.",
    rarity: "uncommon",
    target: "공용 · 이동",
    apply(player) {
      player.dashDistanceMul *= 1.12;
      player.dashCooldownMul *= 0.9;
    }
  },
  {
    id: "tempered_core",
    name: "단련된 핵",
    text: "최대 체력 +42, 방어 +5%. 초반 안정성을 크게 올립니다.",
    rarity: "uncommon",
    target: "공용 · 생존",
    apply(player) {
      player.maxHp += 42;
      player.hp += 42;
      player.armor = Math.min(0.6, player.armor + 0.05);
    }
  },
  {
    id: "overclock_rune",
    name: "과부하 룬",
    text: "처치 시 모든 스킬 쿨다운을 0.55초 줄입니다. 연속 처치 빌드용.",
    rarity: "rare",
    target: "공용 · 쿨다운",
    apply(player) {
      player.onKillCooldownRefund += 0.55;
    }
  },
  {
    id: "predator_scope",
    name: "포식자 조준경",
    text: "치명타 +10%, 정예/보스 피해 +14%. 위험한 적을 먼저 지우는 유물입니다.",
    rarity: "rare",
    target: "공용 · 처치",
    apply(player) {
      player.crit = Math.min(0.72, player.crit + 0.1);
      player.eliteDamageMul *= 1.14;
    }
  },
  {
    id: "titan_grip",
    name: "거신의 손아귀",
    text: "전사 전용. 스킬 범위 +18%, 방패 돌진 피해 +18%, 방어 +5%.",
    rarity: "unique",
    target: "전사 · 범위/돌진",
    classes: ["warrior"],
    apply(player) {
      player.areaMul *= 1.18;
      player.dashDamageMul *= 1.18;
      player.armor = Math.min(0.6, player.armor + 0.05);
    }
  },
  {
    id: "thunder_fletching",
    name: "번개 깃촉",
    text: "궁수 전용. 투사체 연쇄 +1, 사거리 +10%, 치명타 +6%.",
    rarity: "unique",
    target: "궁수 · 연쇄",
    classes: ["ranger"],
    apply(player) {
      player.projectileChainBonus += 1;
      player.rangeMul *= 1.1;
      player.crit = Math.min(0.72, player.crit + 0.06);
    }
  },
  {
    id: "molten_orbit",
    name: "용융 궤도",
    text: "마법사 전용. 마법 폭발 반경 +56px, 상태이상 피해 +18%, 스킬 쿨다운 -8%.",
    rarity: "unique",
    target: "마법사 · 광역/상태",
    classes: ["mage"],
    apply(player) {
      player.splashBonus += 56;
      player.statusDamageMul *= 1.18;
      player.skillCooldownMul *= 0.92;
    }
  },
  {
    id: "aegis_protocol",
    name: "수호 규약",
    text: "전설. 피해를 받을 때 보호막이 있으면 받은 피해의 일부를 주변에 반사합니다.",
    rarity: "legendary",
    target: "공용 · 방어 반격",
    apply(player) {
      player.armor = Math.min(0.6, player.armor + 0.07);
      player.thornsMul += 0.32;
      player.shieldMul *= 1.18;
    }
  },
  {
    id: "crown_of_ruin",
    name: "파멸의 왕관",
    text: "전설. 최종 피해 +38%, 스킬 쿨다운 -10%. 대신 최대 체력 -18%.",
    rarity: "legendary",
    target: "공용 · 고위험 화력",
    apply(player) {
      const loss = Math.max(1, Math.floor(player.maxHp * 0.18));
      player.maxHp = Math.max(1, player.maxHp - loss);
      player.hp = Math.min(player.hp, player.maxHp);
      player.damageMul *= 1.38;
      player.skillCooldownMul *= 0.9;
    }
  },
  {
    id: "phoenix_heart",
    name: "불사조 심장",
    text: "전설. 치명상을 1회 막고 체력 45%와 큰 보호막을 얻습니다.",
    rarity: "legendary",
    target: "공용 · 1회 부활",
    maxLevel: 1,
    apply(player) {
      player.deathSaveCharges += 1;
      player.deathSaveHealRatio = Math.max(player.deathSaveHealRatio || 0, 0.45);
    }
  },
  {
    id: "worldsplitter_relic",
    name: "세계 가르기 유물",
    text: "신화. 전사 전용. 베기/돌진 빌드가 거대화됩니다: 범위 +28%, 대시 밀어내기 +35%.",
    rarity: "mythic",
    target: "전사 · 신화",
    classes: ["warrior"],
    maxLevel: 1,
    apply(player) {
      player.areaMul *= 1.28;
      player.dashDamageMul *= 1.22;
      player.dashDistanceMul *= 1.12;
      player.armor = Math.min(0.62, player.armor + 0.06);
    }
  },
  {
    id: "plague_bloom",
    name: "역병 개화",
    text: "신화. 궁수 전용. 독/상태이상 피해 +34%, 투사체 연쇄 +1, 상자 드랍 보정 +2%.",
    rarity: "mythic",
    target: "궁수 · 신화",
    classes: ["ranger"],
    maxLevel: 1,
    apply(player) {
      player.statusDamageMul *= 1.34;
      player.projectileChainBonus += 1;
      player.chestDropBonus += 0.02;
    }
  },
  {
    id: "singularity_crown",
    name: "특이점 왕관",
    text: "신화. 마법사 전용. 폭발 반경 +80px, 스킬 쿨다운 -18%, 연쇄/상태이상 빌드가 크게 강화됩니다.",
    rarity: "mythic",
    target: "마법사 · 신화",
    classes: ["mage"],
    maxLevel: 1,
    apply(player) {
      player.splashBonus += 80;
      player.skillCooldownMul *= 0.82;
      player.statusDamageMul *= 1.22;
    }
  },
  {
    id: "iron_knuckle",
    name: "철권 붕대",
    text: "무투가 전용. 기본 공격 쿨다운 -10%, 근접/스킬 범위 +8%. 연격 유지가 쉬워집니다.",
    rarity: "common",
    target: "무투가 전용 · 연격",
    classes: ["martialist"],
    apply(player) {
      player.cooldownMul *= 0.9;
      player.areaMul *= 1.08;
    }
  },
  {
    id: "dragon_sash",
    name: "용문 허리띠",
    text: "무투가 전용. 최종 피해 +12%, 대시 피해 +14%, 보호막 효과 +10%. 돌입 콤보를 강화합니다.",
    rarity: "unique",
    target: "무투가 전용 · 돌입",
    classes: ["martialist"],
    apply(player) {
      player.damageMul *= 1.12;
      player.dashDamageMul *= 1.14;
      player.shieldMul *= 1.1;
    }
  },
  {
    id: "catalyst_belt",
    name: "촉매 허리띠",
    text: "연금술사 전용. 장판 범위 +10%, 상태이상 피해 +10%. 산성과 화염 빌드에 좋습니다.",
    rarity: "common",
    target: "연금술사 전용 · 장판",
    classes: ["alchemist"],
    apply(player) {
      player.areaMul *= 1.1;
      player.statusDamageMul *= 1.1;
    }
  },
  {
    id: "volatile_codex",
    name: "휘발성 제조서",
    text: "연금술사 전용. 폭발 반경 +34px, 스킬 쿨다운 -10%, 최종 피해 +6%. 플라스크 운용을 강화합니다.",
    rarity: "unique",
    target: "연금술사 전용 · 플라스크",
    classes: ["alchemist"],
    apply(player) {
      player.splashBonus += 34;
      player.skillCooldownMul *= 0.9;
      player.damageMul *= 1.06;
    }
  },
  {
    id: "shadow_signet",
    name: "그림자 인장",
    text: "암살자 전용. 치명타 +9%, 대시 쿨다운 -10%. 진입과 처형 안정성이 증가합니다.",
    rarity: "common",
    target: "암살자 전용 · 기동",
    classes: ["assassin"],
    apply(player) {
      player.crit = Math.min(0.72, player.crit + 0.09);
      player.dashCooldownMul *= 0.9;
    }
  },
  {
    id: "night_dagger",
    name: "밤의 단검",
    text: "암살자 전용. 정예/보스 피해 +20%, 최종 피해 +10%. 대신 최대 체력 -8%.",
    rarity: "unique",
    target: "암살자 전용 · 처형",
    classes: ["assassin"],
    apply(player) {
      player.eliteDamageMul *= 1.2;
      player.damageMul *= 1.1;
      const loss = Math.max(1, Math.floor(player.maxHp * 0.08));
      player.maxHp = Math.max(1, player.maxHp - loss);
      player.hp = Math.min(player.hp, player.maxHp);
    }
  }
);

const supplyRewards = [
  {
    id: "supply_heal",
    name: "응급 보급",
    text: "즉시 체력을 35% 회복합니다. 유물로 보관되지 않습니다.",
    rarity: "common",
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
    rarity: "common",
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
    rarity: "common",
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
  keen_blade: "칼",
  ember_core: "핵",
  swift_boots: "장",
  wolf_clock: "시",
  iron_oath: "맹",
  glass_star: "별",
  vampire_charm: "흡",
  longshot_lens: "렌",
  living_moss: "생",
  comet_signet: "혜",
  giants_pulse: "거",
  party_banner: "단",
  vanguard_plate: "판",
  hawk_fletching: "깃",
  arcane_orbit: "궤",
  heartstone: "석",
  execution_mark: "표",
  sanctuary_bell: "종",
  berserker_sigil: "광",
  phase_boots: "상",
  reaper_coin: "사",
  clockwork_core: "시",
  hunter_contract: "계",
  thornmail_fragment: "가",
  storm_capacitor: "폭",
  glass_engine: "유",
  blood_pact: "혈",
  pity_engine: "복",
  bulwark_seal: "벽",
  duelist_wrap: "결",
  windrunner_quiver: "풍",
  eagle_crest: "응",
  astral_prism: "프",
  frozen_hourglass: "빙",
  mercy_censer: "향",
  aegis_lantern: "등"
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
  warrior_guardian: "철",
  warrior_warlord: "지",
  warrior_taunt_bastion: "요",
  warrior_taunt_pull: "끌",
  warrior_charge_crash: "파",
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
  ranger_multishot: "분",
  ranger_bodkin: "촉",
  ranger_trap_barbs: "폭",
  ranger_trap_chain: "뢰",
  ranger_poison_focus: "맹",
  ranger_poison_cloud: "폭",
  ranger_kiting: "카",
  ranger_execution: "표",
  ranger_focus_fire: "집",
  ranger_soft_spot: "약",
  ranger_double_step: "스",
  mage_frost: "빙",
  mage_meteor: "운",
  mage_chain: "번",
  mage_arcane_focus: "비",
  mage_storm_core: "폭",
  mage_absolute_zero: "영",
  mage_frost_shatter: "쇄",
  mage_wildfire: "화",
  mage_twin_meteor: "쌍",
  mage_chain_overload: "과",
  mage_chain_anchor: "닻",
  mage_starlance: "별",
  mage_mana_surge: "마",
  mage_orbit_expansion: "궤",
  mage_ember_skin: "잿",
  mage_quick_cast: "속"
};

Object.assign(relicIcons, {
  kinetic_spurs: "SP",
  tempered_core: "TC",
  overclock_rune: "OC",
  predator_scope: "PR",
  titan_grip: "TG",
  thunder_fletching: "TF",
  molten_orbit: "MO",
  aegis_protocol: "AP",
  crown_of_ruin: "CR",
  phoenix_heart: "PH",
  worldsplitter_relic: "WS",
  plague_bloom: "PB",
  singularity_crown: "SC",
  iron_knuckle: "권",
  dragon_sash: "용",
  catalyst_belt: "촉",
  volatile_codex: "휘",
  shadow_signet: "그",
  night_dagger: "밤"
});

Object.assign(skillIcons, {
  warrior_legend_colossus: "CO",
  warrior_mythic_worldsplitter: "WS",
  ranger_legend_storm_quiver: "SQ",
  ranger_mythic_plague_garden: "PG",
  mage_legend_supercell: "SC",
  mage_mythic_apocalypse: "AP",
  job_engineer: "EN",
  job_puppeteer: "PP",
  engineer_primary: "BT",
  engineer_turret: "TU",
  engineer_mine: "MI",
  engineer_drone: "DR",
  engineer_calibration: "FC",
  engineer_reinforced_frame: "RF",
  engineer_twin_turret: "TT",
  engineer_rail_turret: "RL",
  engineer_chain_mine: "CM",
  engineer_sticky_mine: "SC",
  engineer_drone_swarm: "DS",
  engineer_interceptor: "IC",
  engineer_overclock: "OC",
  engineer_legend_factory: "PF",
  engineer_mythic_singularity_core: "SG",
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
  puppeteer_legend_twin_souls: "TS",
  puppeteer_mythic_grand_theater: "GT",
  job_martialist: "MF",
  job_alchemist: "AL",
  job_assassin: "AS",
  martialist_primary: "권",
  martial_palm: "장",
  martial_rising: "각",
  martial_focus: "기",
  martial_combo_flow: "연",
  martial_iron_body: "금",
  martial_afterimage: "잔",
  martial_dragon_pulse: "용",
  martial_counter: "반",
  martial_palm_breaker: "쇄",
  martial_rising_chain: "승",
  martial_focus_guard: "호",
  martial_legend_dragon_soul: "혼",
  martial_mythic_infinite_combo: "무",
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
  alchemist_legend_philosopher: "현",
  alchemist_mythic_homunculus_mix: "호",
  assassin_primary: "난",
  assassin_mark: "표",
  assassin_lunge: "찌",
  assassin_smoke: "연",
  assassin_quick_blade: "속",
  assassin_deep_cut: "상",
  assassin_execution: "처",
  assassin_shadowstep: "그",
  assassin_fan: "부",
  assassin_mark_reaper: "수",
  assassin_lunge_reset: "회",
  assassin_smoke_bomb: "짙",
  assassin_legend_nightfall: "밤",
  assassin_mythic_death_blossom: "사"
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
  if (url.pathname === "/rooms") {
    const body = JSON.stringify({ rooms: getPublicRooms() });
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
    } catch {
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
    changePlayerClass(room, player, sanitizeMessageId(message.classId));
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

  if (message.type === "start") {
    startRunFromLobby(room, player);
  }
}

function joinRoom(client, message) {
  const roomCode = sanitizeRoom(message.room);
  const room = getRoom(roomCode);
  const alreadyInTarget = client.room === room.code && room.players.has(client.playerId);

  if (getActivePlayers(room).length >= MAX_PLAYERS && !alreadyInTarget) {
    send(client, { type: "error", message: "방이 가득 찼습니다." });
    return;
  }

  if (client.room) removeClientFromRoom(client, false);

  const player = createPlayer(client.id, sanitizeName(message.name), sanitizeStartingClass(message.classId), room);
  if (room.status === "lobby") {
    configurePlayerForLobbyTest(player, room, player.classId);
  }

  room.players.set(player.id, player);
  if (!room.hostId) room.hostId = player.id;
  client.room = room.code;
  client.playerId = player.id;
  client.joined = true;

  pushEvent(room, `${player.name} 님이 ${room.code} 방에 입장했습니다.`);

  if (room.status === "choice") {
    player.choicePending = true;
    player.choices = pickRelics(room, player);
  }

  send(client, { type: "joined", id: player.id, room: room.code });
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
  if (room.status !== "gameover") return;
  if (!room.players.has(player.id)) return;

  room.wave = 0;
  room.stageIndex = 0;
  room.floor = 1;
  room.status = "lobby";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.pendingReinforcements = [];
  room.effects = [];
  room.riskChoices = [];
  room.activeRisk = risks[0];
  room.waveTrait = waveTraits.horde;
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
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  room.restartAt = 0;
  room.runStartedAt = 0;
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
  pushEvent(room, `${player.name} 님이 방 로비로 돌아왔습니다.`);
}

function changePlayerClass(room, player, classId) {
  if (room.status !== "lobby") return;
  const nextClassId = sanitizeStartingClass(classId);
  configurePlayerForLobbyTest(player, room, nextClassId);
  player.ready = false;
  pushEvent(room, `${player.name} 님이 ${classes[player.classId].label} 테스트로 변경했습니다.`);
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
  return roomManager.getOrCreateRoom(rooms, code, {
    activeRisk: risks[0],
    waveTrait: waveTraits.horde
  });
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
    dashTimer: 0,
    dashCharges: getDashMaxChargesForClass(classId),
    dashRechargeTimer: 0,
    dashMove: null,
    knockbackMove: null,
    lastSkillSeqs: { q: 0, e: 0, r: 0, f: 0 },
    lastDashSeq: 0,
    damageMul: 1,
    speedMul: 1,
    cooldownMul: 1,
    skillCooldownMul: 1,
    rangeMul: 1,
    areaMul: 1,
    splashBonus: 0,
    armor: def.armor || 0,
    crit: def.crit ?? 0.03,
    lifeSteal: 0,
    regen: def.regen ?? 0.25,
    lowHpCritBonus: 0,
    missingHpDamageBonus: 0,
    eliteDamageMul: 1,
    statusDamageMul: 1,
    dashCooldownMul: 1,
    dashDistanceMul: 1,
    dashDamageMul: 1,
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
    projectileChainBonus: 0,
    deathSaveCharges: 0,
    deathSaveHealRatio: 0,
    shield: 0,
    shieldTimer: 0,
    tauntGuardTimer: 0,
    immunityTimer: 0,
    hitIFrameTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
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
  room.wave = 0;
  room.stageIndex = 0;
  room.floor = 1;
  room.status = "map";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.pendingReinforcements = [];
  room.effects = [];
  room.riskChoices = [];
  room.activeRisk = risks[0];
  room.waveTrait = null;
  room.stageMap = generateStageMap(room.floor);
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
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  room.restartAt = 0;
  room.runStartedAt = Date.now();
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

  enterMapChoice(room);
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
  player.pendingSkillChoices = [];
  player.claimedAdvancementLevels = [];
  player.damageMul = 1;
  player.speedMul = 1;
  player.cooldownMul = 1;
  player.skillCooldownMul = 1;
  player.rangeMul = 1;
  player.areaMul = 1;
  player.splashBonus = 0;
  player.armor = def.armor || 0;
  player.crit = def.crit ?? 0.03;
  player.lifeSteal = 0;
  player.regen = def.regen ?? 0.25;
  player.lowHpCritBonus = 0;
  player.missingHpDamageBonus = 0;
  player.eliteDamageMul = 1;
  player.statusDamageMul = 1;
  player.dashCooldownMul = 1;
  player.dashDistanceMul = 1;
  player.dashDamageMul = 1;
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
  player.projectileChainBonus = 0;
  player.deathSaveCharges = 0;
  player.deathSaveHealRatio = 0;
  player.shield = 0;
  player.shieldTimer = 0;
  player.tauntGuardTimer = 0;
  player.immunityTimer = 0;
  player.hitIFrameTimer = 0;
  player.poisonTimer = 0;
  player.poisonDps = 0;
  player.poisonTickTimer = 0;
  player.poisonOwnerId = null;
  player.choicePending = false;
  player.choices = [];
  player.ready = false;
  if (player.bot) player.botBrain = createBotBrain();
  player.attackTimer = 0;
  player.skillTimers = { q: 0, e: 0, r: 0, f: 0 };
  player.dashTimer = 0;
  resetDashCharges(player);
  player.dashMove = null;
  player.knockbackMove = null;
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

  const angle = Math.random() * Math.PI * 2;
  player.x = room.world.w / 2 + Math.cos(angle) * 80;
  player.y = room.world.h / 2 + Math.sin(angle) * 80;
}

function configurePlayerForLobbyTest(player, room, classId) {
  const keepX = Number.isFinite(player.x) ? player.x : null;
  const keepY = Number.isFinite(player.y) ? player.y : null;
  player.classId = sanitizeStartingClass(classId);
  resetPlayerForRun(player, room);

  if (keepX !== null && keepY !== null) {
    player.x = clamp(keepX, 42, room.world.w - 42);
    player.y = clamp(keepY, 42, room.world.h - 42);
  }

  player.level = MAX_PLAYER_LEVEL;
  player.xp = 0;
  player.score = 0;
  player.claimedAdvancementLevels = [...ADVANCEMENT_LEVELS];
  player.jobTier = 4;
  player.skillUpgrades = [];
  for (const upgrade of skillUpgrades[player.classId] || []) {
    player.skillUpgrades.push(upgrade.id);
    applySkillUpgrade(player, upgrade.id);
  }
  player.hp = player.maxHp;
  player.shield = 0;
  player.skillTimers = { q: 0, e: 0, r: 0, f: 0 };
  player.dashTimer = 0;
  resetDashCharges(player);
  player.ready = false;
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
    poisonOwnerId: null,
    shamanHealLockUntil: 0,
    burnTimer: 0,
    burnDps: 0,
    burnOwnerId: null,
    vulnerableTimer: 0,
    tauntTimer: 0,
    tauntTargetId: null,
    dummyReturnCooldown: 0,
    xp: 0
  };
}

function spawnWave(room) {
  room.status = "combat";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
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

  const partyDifficulty = getPartyDifficulty(room);
  const stageDifficulty = getStageDifficulty(room);
  const risk = room.activeRisk || risks[0];
  room.waveTrait = room.waveTrait || pickWaveTrait(room.wave);
  const trait = room.waveTrait;
  const threat = getWaveThreatLevel(room, risk, trait);
  room.threatLevel = threat;
  const nodeKind = getActiveStageKind(room);
  const chapter = Math.max(1, room.floor || 1);
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const chapterDifficulty = getChapterDifficulty(room);
  const stagePressureMul = getChapterStagePressureMul(room);
  const countPressure = clamp(threat * 0.6 * stagePressureMul, stageDifficulty.pressureMin, 1.58);
  const riskSpawnMul = 1 + ((risk.spawnMul || 1) - 1) * stageDifficulty.riskMul;
  const traitSpawnMul = 1 + ((trait.spawnMul || 1) - 1) * stageDifficulty.riskMul;
  const baseCount = Math.ceil(
    (6.5 + room.wave * 0.78 + depth * 1.55 + chapter) *
      partyDifficulty.spawnMul *
      riskSpawnMul *
      traitSpawnMul *
      chapterDifficulty.spawnMul *
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
    pushEvent(room, `${room.wave} 보스전 시작: ${trait.name}`);
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
    spawnEnemy(room, pickEliteAnchorType(trait, room), { elite: true });
    if (room.wave >= 3) spawnEnemy(room, pickEnemyType(room.wave, trait), { elite: true });
  }

  if (nodeKind === "defense") {
    startDefenseObjective(room);
  }

  spawnTraitAnchors(room, trait, nodeKind);

  const spawnPlan = createEnemySpawnPlan(room, baseCount, trait, nodeKind, risk);
  const initialCount = getInitialSpawnCount(room, spawnPlan.length, trait, risk, nodeKind);
  spawnPlannedEnemies(room, spawnPlan.slice(0, initialCount));
  scheduleReinforcements(room, spawnPlan.slice(initialCount), trait, risk, nodeKind);

  for (const player of getActivePlayers(room)) {
    if (player.hp <= 0) player.hp = Math.max(1, Math.floor(player.maxHp * 0.45));
    player.choicePending = false;
    player.choices = [];
  }
  regroupPartyForStage(room);

  pushEvent(room, `${room.wave} 스테이지 시작: ${trait.name}${risk.id !== "safe_path" ? `, ${risk.name}` : ""}`);
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
  boss.maxHp = Math.max(tuning.minHp, Math.round(boss.maxHp * tuning.hpMul));
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

function spawnMiniBoss(room) {
  const profile = getChapterBossProfile(room.floor);
  const miniProfile = getMiniBossProfile(room.floor);
  const tuning = getMiniBossIntroTuning(room);
  const boss = spawnEnemy(room, "boss", {
    bossId: profile.id,
    x: room.world.w / 2,
    y: Math.max(180, room.world.h / 2 - 250),
    scale: 0.62
  });
  if (!boss) return;

  boss.label = miniProfile.name;
  boss.color = miniProfile.color;
  boss.miniPattern = miniProfile.pattern;
  boss.patternMix = miniProfile.patternMix || boss.patternMix || null;
  boss.maxHp = Math.max(tuning.minHp, Math.round(boss.maxHp * miniProfile.hpMul * tuning.hpMul));
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

  room.stageObjective = {
    type: "miniboss",
    label: "MINI BOSS",
    text: miniProfile.text,
    targetId: boss.id
  };

  addEffect(room, "warning", boss.x, boss.y, {
    color: miniProfile.color,
    radius: boss.radius + 74,
    style: "chapter_boss_spawn"
  });
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
    rarityBoost: 0.16 + index * 0.04 + Math.max(0, room.floor - 1) * 0.05,
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
    radius: 42
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
    player.input.mx = 0;
    player.input.my = 0;
    player.input.attacking = false;
    player.dashMove = null;
    player.knockbackMove = null;
    syncPlayerInputSequences(player);
    player.inputGraceUntil = Date.now() + 450;
    player.poisonTimer = 0;
    player.poisonDps = 0;
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

function pickWaveTrait(wave) {
  if (wave % 5 === 0) return waveTraits.boss;
  const order = [waveTraits.horde, waveTraits.bulwark, waveTraits.ritual, waveTraits.volatile];
  return order[(wave - 1) % order.length];
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

function getWaveThreatLevel(room, risk, trait) {
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const stageDifficulty = getStageDifficulty(room);
  const nodeKind = getActiveStageKind(room);
  const nodeMul = getStageNodeThreatMultiplier(room, nodeKind);
  const riskMul = risk.id === "safe_path" ? 1 : risk.id === "glass_run" ? 1.12 : risk.id === "early_boss" ? 1.18 : 1.22;
  const traitMul =
    trait.id === "boss_gate" ? 1.26 : trait.id === "volatile" ? 1.16 : trait.id === "ritual" ? 1.04 : trait.id === "bulwark" ? 1.08 : 1.04;
  return Math.min(
    2.45,
    (1 + Math.max(0, depth - 1) * 0.065) * getChapterPressure(room) * nodeMul * riskMul * traitMul * stageDifficulty.threatMul
  );
}

function getEliteChance(room, trait, risk) {
  const depth = room.activeMapNode?.depth || room.wave || 1;
  const partyDifficulty = getPartyDifficulty(room);
  const stageDifficulty = getStageDifficulty(room);
  const nodeKind = getActiveStageKind(room);
  const nodeBonus = nodeKind === "elite" ? ELITE_NODE_BONUS : nodeKind === "miniboss" ? 0.06 : nodeKind === "boss" ? 0.14 : 0;
  const riskBonus = risk.id === "early_boss" ? 0.09 : risk.id === "swarm_contract" ? 0.06 : risk.id === "glass_run" ? 0.025 : 0;
  const traitBonus = trait.id === "bulwark" || trait.id === "boss_gate" ? 0.075 : trait.id === "volatile" ? 0.045 : 0;
  const chapterBonus = Math.max(0, (room.floor || 1) - 1) * 0.045;
  const lateBonus = Math.max(0, (room.wave || 1) - MAP_DEPTH) * 0.004;
  const chapterDifficulty = getChapterDifficulty(room);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  const cap = partyDifficulty.eliteCap;
  const chance = ELITE_BASE_CHANCE + depth * 0.018 + nodeBonus + riskBonus + traitBonus + chapterBonus + lateBonus;
  return Math.min(cap, chance * partyDifficulty.eliteMul * stageDifficulty.eliteMul * chapterDifficulty.eliteMul * clamp(specialBudget, 0.76, 1.12));
}

function spawnTraitAnchors(room, trait, nodeKind) {
  let anchors = (trait.anchorTypes || []).filter((type) => isEnemyTypeUnlocked(type, Math.max(1, room.wave || 1)));
  if (nodeKind === "defense") {
    anchors = anchors.filter((type) => DEFENSE_ALLOWED_TYPES.includes(type));
    if (!anchors.length) anchors = ["brute", "guardian"].filter((type) => isEnemyTypeUnlocked(type, Math.max(1, room.wave || 1)));
  }
  if (anchors.length === 0) return;

  const depth = room.activeMapNode?.depth || room.wave || 1;
  const chapter = Math.max(1, room.floor || 1);
  const partyDifficulty = getPartyDifficulty(room);
  const stageDifficulty = getStageDifficulty(room);
  const count = clamp(
    1 +
      (depth >= 3 ? 1 : 0) +
      (depth >= 6 ? 1 : 0) +
      (chapter >= 3 ? 1 : 0) +
      (partyDifficulty.players >= 4 ? 1 : 0) +
      (nodeKind === "boss" ? 1 : 0) +
      partyDifficulty.anchorBonus +
      stageDifficulty.anchorBonus,
    1,
    partyDifficulty.maxAnchors
  );

  for (let i = 0; i < count; i += 1) {
    const type = anchors[i % anchors.length];
    const elite = nodeKind === "boss" ? i === 0 : nodeKind === "elite" && i < 2;
    spawnEnemy(room, type, { elite });
  }
}

function createEnemySpawnPlan(room, baseCount, trait, nodeKind, risk) {
  const plan = [];
  const minimumBasicCount = getMinimumBasicSpawnCount(room, baseCount, trait, nodeKind);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  let basicSpawned = 0;
  for (let i = 0; i < baseCount; i += 1) {
    const basicDeficit = minimumBasicCount - basicSpawned;
    const remainingSlots = baseCount - i;
    const expectedBasicByNow = Math.floor(((i + 1) / Math.max(1, baseCount)) * minimumBasicCount);
    const forceBasic = basicDeficit > 0 && (basicSpawned < expectedBasicByNow || remainingSlots <= basicDeficit);
    const budgetPrefersBasic = !forceBasic && specialBudget < 1 && Math.random() > specialBudget;
    const type =
      nodeKind === "defense"
        ? pickDefenseEnemyType(room.wave, trait, forceBasic || budgetPrefersBasic)
        : forceBasic || budgetPrefersBasic
          ? pickBasicEnemyType(room.wave, trait)
          : pickEnemyType(room.wave, trait);
    const elite = Math.random() < getEliteChance(room, trait, risk);
    plan.push({ type, elite });
    if (isBasicEnemyType(type)) basicSpawned += 1;
  }
  return plan;
}

function pickDefenseEnemyType(wave, trait, forceBasic = false) {
  if (forceBasic) return pickBasicEnemyType(wave, trait);
  const weights = [
    ["slime", 0.24],
    ["bat", 0.2],
    ["brute", 0.18],
    ["bomber", wave >= 2 ? 0.12 : 0],
    ["splitter", wave >= 2 ? 0.1 : 0],
    ["guardian", wave >= 3 ? 0.08 : 0],
    ["charger", wave >= 5 ? 0.05 : 0]
  ].filter(([type, weight]) => weight > 0 && DEFENSE_ALLOWED_TYPES.includes(type) && isEnemyTypeUnlocked(type, wave));
  return pickWeightedEnemyType(weights) || pickBasicEnemyType(wave, trait);
}

function getInitialSpawnCount(room, total, trait, risk, nodeKind) {
  if (total <= 0) return 0;
  const chapterDifficulty = getChapterDifficulty(room);
  let ratio = chapterDifficulty.initialSpawnRatio;
  if (trait?.id === "horde") ratio += 0.08;
  if (trait?.id === "ritual") ratio -= 0.04;
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

function scheduleReinforcements(room, plan, trait, risk, nodeKind) {
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
      (trait?.id === "horde" ? 0.94 : trait?.id === "bulwark" ? 1.08 : 1) *
      (risk?.id === "swarm_contract" ? 0.92 : 1);
    room.pendingReinforcements.push({
      at: now + Math.round(delay * 1000),
      spawns,
      threshold: Math.max(2, Math.ceil(spawns.length * (room.floor >= 3 ? 0.46 : 0.38))),
      traitId: trait?.id || "horde"
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

function pickEliteAnchorType(trait, room) {
  const wave = Math.max(1, room?.wave || 1);
  if (trait.id === "bulwark") return "guardian";
    if (trait.id === "ritual") return "shaman";
    if (trait.id === "volatile") return isEnemyTypeUnlocked("charger", wave) && Math.random() < 0.28 ? "charger" : "bomber";
    if (trait.id === "boss_gate") return "brute";
  return isEnemyTypeUnlocked("sniper", wave) && Math.random() < 0.55 ? "sniper" : "brute";
}

function getMinimumBasicSpawnCount(room, baseCount, trait, nodeKind) {
  if (baseCount <= 0) return 0;

  const depth = room.activeMapNode?.depth || room.wave || 1;
  const chapter = Math.max(1, room.floor || 1);
  const specialBudget = getChapterSpecialEnemyBudget(room);
  const traitId = trait?.id || "horde";
  let ratio =
    traitId === "horde"
      ? 0.52
      : traitId === "bulwark"
        ? 0.48
        : traitId === "ritual"
          ? 0.46
          : traitId === "volatile"
            ? 0.44
            : 0.42;

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

function pickBasicEnemyType(wave, trait = waveTraits.horde) {
  const traitId = trait?.id || "horde";
  const weights =
    traitId === "horde"
      ? [
          ["bat", 0.42],
          ["slime", 0.38],
          ["brute", 0.2]
        ]
      : traitId === "bulwark"
        ? [
            ["brute", 0.38],
            ["slime", 0.34],
            ["bat", 0.28]
          ]
        : traitId === "boss_gate"
          ? [
              ["brute", 0.34],
              ["slime", 0.36],
              ["bat", 0.3]
            ]
          : [
              ["slime", 0.42],
              ["bat", 0.34],
              ["brute", 0.24]
            ];
  return pickWeightedEnemyType(weights.filter(([type]) => isEnemyTypeUnlocked(type, wave))) || "slime";
}

function pickWeightedEnemyType(weightedTypes) {
  if (!weightedTypes.length) return null;
  const total = weightedTypes.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [type, weight] of weightedTypes) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return weightedTypes[weightedTypes.length - 1][0];
}

function pickEnemyType(wave, trait = waveTraits.horde) {
  const available = (trait.bias || waveTraits.horde.bias).filter(([type]) => {
    return isEnemyTypeUnlocked(type, wave);
  });
  const weightedType = pickWeightedEnemyType(available);
  if (weightedType) return weightedType;

  const roll = Math.random();
  if (wave >= 2 && roll > 0.88) return "sniper";
  if (wave >= 3 && roll > 0.86) return "mortar";
  if (wave >= 5 && roll > 0.82) return "charger";
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

function getMinibossMinDepth(floor) {
  const chapter = clamp(Math.round(floor || 1), 1, MAX_CHAPTERS);
  return MINIBOSS_MIN_DEPTH_BY_CHAPTER[chapter] || 4;
}

function canRollMinibossAt(floor, depth) {
  const stageDepth = Math.max(1, Math.round(depth || 1));
  return stageDepth >= getMinibossMinDepth(floor) && stageDepth < MAP_DEPTH;
}

function getBossProfileById(id) {
  return bossSystem.getBossProfileById(id, CHAPTER_BOSSES);
}

function bossProfileView(profile) {
  return bossSystem.bossProfileView(profile);
}

function nextBossPattern(enemy, profile, fallbackPatterns) {
  return bossSystem.nextBossPattern(enemy, profile, fallbackPatterns);
}

function getBossPhaseTransition(enemy) {
  return bossSystem.getBossPhaseTransition(enemy);
}

function pickStageNodeKind(floor, depth, lane) {
  if (depth === MAP_DEPTH) return "boss";
  if (depth === 1) return Math.random() < 0.18 ? "defense" : "combat";
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
  return pickWeightedEnemyType(weights) || "combat";
}

function resolveRandomStageKind(node) {
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
  return pickWeightedEnemyType(weights) || "combat";
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

function generateStageMap(floor) {
  const nodes = [];
  const edges = [];
  const normalModifiers = risks;
  const bossProfile = getChapterBossProfile(floor);

  for (let depth = 1; depth <= MAP_DEPTH; depth += 1) {
    const bossDepth = depth === MAP_DEPTH;
    const lanes = bossDepth ? [1] : [0, 1, 2];
    for (const lane of lanes) {
      const normalTraits =
        depth <= 2
          ? [waveTraits.horde, waveTraits.bulwark]
          : depth === 3
            ? [waveTraits.horde, waveTraits.bulwark, waveTraits.ritual]
            : [waveTraits.horde, waveTraits.bulwark, waveTraits.ritual, waveTraits.volatile];
      const trait = bossDepth ? waveTraitById(bossProfile.traitId) : normalTraits[Math.floor(Math.random() * normalTraits.length)];
      const kind = pickStageNodeKind(floor, depth, lane);
      const fixedObjectiveKind = ["reward", "blockade", "defense", "miniboss"].includes(kind);
      const modifier =
        bossDepth
          ? risks.find((item) => item.id === bossProfile.modifierId) || risks[0]
          : fixedObjectiveKind
            ? risks[0]
          : weightedModifier(normalModifiers, depth, floor);
      nodes.push({
        id: `f${floor}-d${depth}-l${lane}`,
        floor,
        depth,
        lane,
        kind,
        traitId: trait.id,
        modifierId: modifier.id,
        bossId: bossDepth ? bossProfile.id : ""
      });
    }
  }

  for (const node of nodes) {
    const nextNodes = nodes.filter(
      (candidate) => candidate.depth === node.depth + 1 && Math.abs(candidate.lane - node.lane) <= 1
    );
    const shuffled = nextNodes.sort(() => Math.random() - 0.5);
    const take = node.depth === MAP_DEPTH - 1 ? shuffled : shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
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

function weightedModifier(modifiers, depth, floor = 1) {
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
  let roll = Math.random() * total;
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

function enterMapChoice(room) {
  room.status = "map";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapVotes = {};
  room.mapDeadline = Date.now() + MAP_VOTE_TIMEOUT_MS;
  const progression = ensureMapProgression(room);
  if (progression.status === "complete") {
    finishRun(room, "victory", "3챕터의 모든 스테이지를 클리어했습니다.");
    return;
  }
  refreshMapChoices(room, progression.availableNodes);
  pushEvent(room, "지도에서 다음 방을 투표하세요.");
}

function chooseMapNode(room, player, nodeId) {
  if (room.status !== "map") return;
  if (!isActivePlayer(player)) return;
  if (room.mapVotes[player.id]) return;
  const available = new Set(getAvailableMapNodes(room).map((node) => node.id));
  if (!available.has(nodeId)) return;
  room.mapVotes[player.id] = nodeId;
  pushEvent(room, `${player.name} 님이 다음 방에 투표했습니다.`);
  resolveMapChoiceIfReady(room, Date.now());
}

function updateMapChoice(room, now) {
  if (!room.stageMap) {
    room.stageMap = generateStageMap(room.floor);
    room.currentMapNodeId = null;
    refreshMapChoices(room);
  }
  resolveMapChoiceIfReady(room, now);
}

function resolveMapChoiceIfReady(room, now) {
  if (room.status !== "map") return false;
  const voters = getActivePlayers(room).map((player) => player.id);
  let available = getAvailableMapNodes(room);
  if (available.length === 0) {
    const progression = ensureMapProgression(room);
    if (progression.status === "complete") {
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

function pickVoteWinner(room, available) {
  return stageSystem.pickVoteWinner(available, countMapVotes(room));
}

function countMapVotes(room) {
  return stageSystem.countMapVotes(room.mapVotes);
}

function startMapNode(room, node) {
  const started = stageSystem.applyMapNodeStart(room, node, {
    resolveRandomStageKind,
    getTrait: (item) => waveTraitById(item.traitId),
    getModifier: (item) => risks.find((risk) => risk.id === item.modifierId) || risks[0],
    getBossProfile: (item) => getBossProfileById(item.bossId) || getChapterBossProfile(item.floor)
  });
  pushEvent(
    room,
    started.bossProfile
      ? `${node.floor}챕터 보스전: ${started.bossProfile.name}`
      : `${node.depth}번째 방으로 이동합니다: ${started.trait.name}, ${started.modifier.name}`
  );
  spawnWave(room);
}

function mapNodeView(room, node) {
  return stageSystem.getMapNodeView(room, node, {
    getTrait: (item) => waveTraitById(item.traitId),
    getModifier: (item) => risks.find((risk) => risk.id === item.modifierId) || risks[0],
    getBossProfile: (item) => getBossProfileById(item.bossId) || getChapterBossProfile(item.floor),
    stageNodeMetaView,
    waveTraitView,
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

function waveTraitById(id) {
  return Object.values(waveTraits).find((trait) => trait.id === id) || waveTraits.horde;
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
  const def = enemyDefs[type];
  if (!def) return;
  const side = Math.floor(Math.random() * 4);
  const margin = 50;
  let x = margin;
  let y = margin;

  if (side === 0) {
    x = Math.random() * room.world.w;
    y = margin;
  } else if (side === 1) {
    x = room.world.w - margin;
    y = Math.random() * room.world.h;
  } else if (side === 2) {
    x = Math.random() * room.world.w;
    y = room.world.h - margin;
  } else {
    x = margin;
    y = Math.random() * room.world.h;
  }

  if (Number.isFinite(options.x)) x = clamp(options.x, 24, room.world.w - 24);
  if (Number.isFinite(options.y)) y = clamp(options.y, 24, room.world.h - 24);

  const chapter = Math.max(1, room.floor || 1);
  const depth = room.activeMapNode?.depth || ((Math.max(1, room.wave || 1) - 1) % MAP_DEPTH) + 1;
  const nodeKind = getActiveStageKind(room);
  const nodePower = nodeKind === "boss" ? 0.16 : nodeKind === "miniboss" ? 0.11 : nodeKind === "elite" ? 0.1 : 0;
  const chapterDifficulty = getChapterDifficulty(room);
  const waveScale = 1 + (room.wave - 1) * 0.095 + (chapter - 1) * 0.12 + (depth - 1) * 0.038 + nodePower;
  const xpScale = 1 + (room.wave - 1) * 0.028 + (chapter - 1) * 0.05;
  const damageScale =
    1 + Math.max(0, room.wave - 1) * 0.05 + (chapter - 1) * 0.09 + (depth - 1) * 0.026 + (nodeKind === "boss" ? 0.1 : nodeKind === "elite" ? 0.055 : 0);
  const speedScale = 1 + Math.min(0.36, Math.max(0, room.wave - 1) * 0.009 + (chapter - 1) * 0.018 + (depth - 1) * 0.007);
  const stageDifficulty = getStageDifficulty(room);
  const cadenceMul =
    Math.max(0.72, 1 - Math.max(0, room.wave - 1) * 0.003 - (chapter - 1) * 0.009 - (depth - 1) * 0.0015 - (nodeKind === "boss" ? 0.02 : 0)) *
    stageDifficulty.cadenceMul *
    chapterDifficulty.cadenceMul;
  const partyDifficulty = getPartyDifficulty(room);
  const trait = room.waveTrait || waveTraits.horde;
  const traitHpMul = trait.hpMul || 1;
  const traitSpeedMul = trait.speedMul || 1;
  const traitDamageMul = trait.damageMul || 1;
  const elite = Boolean(options.elite);
  const affix = options.affix || (elite ? pickEliteAffix(type) : "");
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
  const maxHp = Math.round(def.hp * waveScale * partyDifficulty.hpMul * stageDifficulty.hpMul * chapterDifficulty.hpMul * traitHpMul * eliteHpMul * scale * bossHpMul);
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
    x,
    y,
    hp: maxHp,
    maxHp,
    speed: def.speed * speedScale * stageDifficulty.speedMul * chapterDifficulty.speedMul * traitSpeedMul * eliteSpeedMul * bossSpeedMul,
    damage: Math.round(def.damage * damageScale * partyDifficulty.damageMul * stageDifficulty.damageMul * chapterDifficulty.damageMul * traitDamageMul * eliteDamageMul * bossDamageMul),
    radius,
    role: def.role || type,
    elite,
    affix,
    orbitDir: Math.random() < 0.5 ? -1 : 1,
    aiPhase: Math.random() * Math.PI * 2,
    attackTimer: 0,
    shotTimer: (0.75 + Math.random() * 0.75) * cadenceMul,
    healTimer: (1.55 + Math.random() * 1.05) * cadenceMul,
    chargeTimer: (1.05 + Math.random() * 1.05) * cadenceMul,
    specialTimer: (1.65 + Math.random() * 1.35) * cadenceMul,
    eliteSpecialTimer: elite && type !== "boss" ? (4.2 + Math.random() * 2.8) * cadenceMul : 999,
    cadenceMul: elite ? Math.max(0.66, cadenceMul - 0.04) : cadenceMul,
    rangedPressureMul: getRangedPressureMul(room, type, elite),
    windup: null,
    chargeMove: null,
    knockbackMove: null,
    slowTimer: 0,
    freezeTimer: 0,
    poisonTimer: 0,
    poisonDps: 0,
    poisonOwnerId: null,
    shamanHealLockUntil: 0,
    burnTimer: 0,
    burnDps: 0,
    burnOwnerId: null,
    vulnerableTimer: 0,
    barrier: 0,
    barrierTimer: 0,
    tauntTimer: 0,
    tauntTargetId: null,
    xp: Math.round(def.xp * xpScale * partyDifficulty.xpMul * (elite ? 2.05 : 1) * xpMul * bossXpMul)
  };
  room.enemies.push(enemy);
  return enemy;
}

function pickEliteAffix(type) {
  if (type === "boss") return "bulwark";
  return ELITE_AFFIXES[Math.floor(Math.random() * ELITE_AFFIXES.length)];
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
  return botSystem.pickBestBotRelicChoice(bot, { normalizeRarity, rarityScore });
}

function scoreBotRelicChoice(bot, choice) {
  return botSystem.scoreBotRelicChoice(bot, choice, { normalizeRarity, rarityScore });
}

function pickBestBotSkillChoice(bot) {
  return botSystem.pickBestBotSkillChoice(bot, { getSkillUpgradeRarity, rarityScore });
}

function scoreBotSkillChoice(bot, choice) {
  return botSystem.scoreBotSkillChoice(bot, choice, { getSkillUpgradeRarity, rarityScore });
}

function updateBotCombatInput(room, bot, dt, now, lobbyMode) {
  const brain = ensureBotBrain(bot);
  if (bot.hp <= 0) {
    resetBotInput(bot);
    return;
  }

  const target = findBotPriorityTarget(room, bot, lobbyMode);
  const avoidance = getBotAvoidanceVector(room, bot);
  let moveX = avoidance.x * 1.35;
  let moveY = avoidance.y * 1.35;
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

function findBotPriorityTarget(room, bot, lobbyMode = false) {
  const chest = findNearestBotChest(room, bot);
  const enemy = findNearestBotEnemy(room, bot, lobbyMode);
  const xp = findNearestBotXp(room, bot);
  const stageKind = getActiveStageKind(room);

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

  return { x, y, forceDash };
}

function getDistanceToHazard(point, hazard) {
  if (hazard.length && hazard.width) {
    const angle = hazard.angle || 0;
    const dx = Math.cos(angle) * hazard.length * 0.5;
    const dy = Math.sin(angle) * hazard.length * 0.5;
    return distanceToSegment(point, hazard.x - dx, hazard.y - dy, hazard.x + dx, hazard.y + dy) - hazard.width * 0.5;
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
  updateRelicChests(room);
  updateEnemies(room, dt, now);
  updateXpOrbs(room, dt);
  resolveCombatCollisions(room);

  room.enemies = room.enemies.filter((enemy) => enemy.hp > 0);
  room.projectiles = projectileSystem.filterLiveProjectiles(room.projectiles);
  room.hazards = hazardSystem.filterLiveHazards(room.hazards);
  room.relicChests = room.relicChests.filter((chest) => !chest.dead);
  room.xpOrbs = room.xpOrbs.filter((orb) => !orb.dead);
  updateReinforcements(room, now);
  updateStageObjective(room, dt, now);

  if (isStageObjectiveFailed(room)) {
    finishRun(room, "defeat", getStageObjectiveFailureReason(room));
    return;
  }

  if (room.status === "combat" && isStageClearReady(room)) {
    completeWave(room);
  }

  const livingPlayers = getActiveLivingPlayers(room);
  if (room.status === "combat" && livingPlayers.length === 0) {
    finishRun(room, "defeat", `${room.wave} 스테이지에서 파티가 전멸했습니다.`);
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
  objective.hp = Math.max(0, objective.hp - damage);
  enemy.objectiveAttackTimer = (options.cooldown ?? (enemy.elite ? 0.72 : 0.95)) * Math.max(0.72, enemy.cadenceMul || 1);
  addEffect(room, "impact", objective.x, objective.y, {
    color: options.color || "#7fa671",
    radius: options.radius || (objective.radius || 42) + 18,
    style: options.style || "defense_hit"
  });
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
  const noEnemies = room.enemies.length === 0 && (!room.pendingReinforcements || room.pendingReinforcements.length === 0);
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
  const speed = def.speed * player.speedMul * (player.dashSpeedMul || 1);
  const prevX = player.x;
  const prevY = player.y;

  player.x = clamp(player.x + mx * speed * dt, 32, room.world.w - 32);
  player.y = clamp(player.y + my * speed * dt, 32, room.world.h - 32);
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
      performDash(room, player, now);
      consumeDashCharge(player);
    }
  }

  if (player.input.attacking && player.attackTimer <= 0) {
    performAttack(room, player, now);
    player.attackTimer = def.attackCd * player.cooldownMul;
  }

  for (const slot of SKILL_SLOTS) {
    if (player.input.skillSeqs[slot] !== player.lastSkillSeqs[slot]) {
      player.lastSkillSeqs[slot] = player.input.skillSeqs[slot];
      if (canTriggerSkillSlot(player, slot)) {
        performSkill(room, player, slot, now);
        applySkillCooldown(player, slot);
      }
    }
  }
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
  const endX = endpoint.x;
  const endY = endpoint.y;
  const actualDistance = Math.hypot(endX - startX, endY - startY);
  const dashDuration = getPlayerDashDuration(player, actualDistance);
  player.lastDashAt = now;

  if (player.classId === "cleric") {
    performClericPulse(room, player);
    return;
  }

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
    player.x = endX;
    player.y = endY;
    updatePlayerVelocity(player, startX, startY, 0.16);
    player.immunityTimer = Math.max(player.immunityTimer, 0.58);
    addEffect(room, "arcane", startX, startY, { color: classes.mage.color, radius: 74, style: "blink_depart" });
    addEffect(room, "arcane", player.x, player.y, { color: classes.mage.color, radius: 96, style: "blink_arrive" });
    for (const enemy of room.enemies) {
      if (enemy.hp <= 0) continue;
      if (Math.min(distance(enemy, { x: startX, y: startY }), distance(enemy, player)) > enemy.radius + 118) continue;
      enemy.slowTimer = Math.max(enemy.slowTimer, 1.45);
      dealDamage(room, enemy, def.damage * 0.54 * (player.dashDamageMul || 1), player.id);
    }
    return;
  }

  const dashOptions =
    player.classId === "warrior"
      ? {
          contactRadius: 58 * player.areaMul,
          damageMul: 1.15,
          hitTauntTime: 1.65,
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
    damageMul: options.damageMul || 0.86,
    hitTauntTime: options.hitTauntTime || 1.25,
    knockback: options.knockback || 180,
    pushScale: options.pushScale || 1,
    impactScale: options.impactScale || 1.04,
    hitIds: []
  };

  if (player.classId === "warrior") {
    player.shield = Math.max(player.shield, 38 + (hasUpgrade(player, "warrior_guardian") ? 8 : 0));
    player.shieldTimer = Math.max(player.shieldTimer, 2.8);
    player.immunityTimer = Math.max(player.immunityTimer, duration + 0.08);
  }

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

  if (player.classId === "cleric") {
    player.immunityTimer = Math.max(player.immunityTimer, duration + 0.08);
  }
}

function getPlayerDashDuration(player, dashDistance) {
  if (player.classId === "warrior") return clamp(dashDistance / 820, 0.16, 0.22);
  if (player.classId === "ranger") return clamp(dashDistance / 1350, 0.13, 0.18);
  if (player.classId === "martialist") return clamp(dashDistance / 1220, 0.13, 0.18);
  if (player.classId === "assassin") return clamp(dashDistance / 1420, 0.11, 0.16);
  if (player.classId === "cleric") return clamp(dashDistance / 920, 0.15, 0.21);
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

  player.x = clamp(dash.startX + (dash.x - dash.startX) * eased, 32, room.world.w - 32);
  player.y = clamp(dash.startY + (dash.y - dash.startY) * eased, 32, room.world.h - 32);
  updatePlayerVelocity(player, prevX, prevY, dt);

  if (dash.classId === "warrior") {
    applyWarriorDashContacts(room, player, dash, prevX, prevY);
  }
  if (dash.classId === "martialist") {
    applyMartialDashContacts(room, player, dash, prevX, prevY);
  }
  if (dash.classId === "assassin") {
    applyAssassinDashContacts(room, player, dash, prevX, prevY);
  }

  if (progress >= 1) {
    player.dashMove = null;
    finishPlayerDashMove(room, player, dash);
  }
}

function applyWarriorDashContacts(room, player, dash, prevX, prevY) {
  const def = classes.warrior;
  const dir = { x: dash.dirX, y: dash.dirY };
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || dash.hitIds.includes(enemy.id)) continue;
    if (distanceToSegment(enemy, prevX, prevY, player.x, player.y) > enemy.radius + (dash.contactRadius || 38)) continue;
    dash.hitIds.push(enemy.id);
    enemy.tauntTargetId = player.id;
    enemy.tauntTimer = Math.max(enemy.tauntTimer, dash.hitTauntTime || 1.25);
    const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.86) * (player.dashDamageMul || 1), player.id);
    if (dealt > 0) {
      const pushDir = getWarriorDashPushDirection(enemy, prevX, prevY, player.x, player.y, dir, dash.style === "shield_charge");
      applyWarriorDashPush(room, player, enemy, pushDir, dash.pushScale || 1);
      addMeleeImpact(room, enemy, "shield_slam", dash.impactScale || 1.04);
    }
  }
}

function applyMartialDashContacts(room, player, dash, prevX, prevY) {
  const def = classes.martialist;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || dash.hitIds.includes(enemy.id)) continue;
    if (distanceToSegment(enemy, prevX, prevY, player.x, player.y) > enemy.radius + (dash.contactRadius || 42)) continue;
    dash.hitIds.push(enemy.id);
    const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.82) * (player.dashDamageMul || 1), player.id, {
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
    const dealt = dealDamage(room, enemy, def.damage * (dash.damageMul || 0.7) * (marked ? 1.35 : 1), player.id, {
      noVulnerable: true
    });
    if (dealt > 0) addMeleeImpact(room, enemy, marked ? "assassin_mark_hit" : "blade_impact", dash.impactScale || 0.76);
  }
}

function finishPlayerDashMove(room, player, dash) {
  if (dash.classId !== "cleric") return;
  applyClericPulseBlessing(room, player, 190);
}

function performClericPulse(room, player) {
  const radius = 235;
  const projectileRadius = 275;
  let cleansedProjectiles = 0;

  player.immunityTimer = Math.max(player.immunityTimer, 0.28);
  addEffect(room, "holy", player.x, player.y, { color: classes.cleric.color, radius, style: "cleric_pulse" });

  for (const projectile of room.projectiles) {
    if (projectile.dead || !projectile.hostile) continue;
    if (distance(projectile, player) > projectileRadius + projectile.radius) continue;
    projectile.dead = true;
    cleansedProjectiles += 1;
    addEffect(room, "cleanse", projectile.x, projectile.y, {
      color: classes.cleric.color,
      radius: 24,
      style: "projectile_cleanse"
    });
  }

  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance(enemy, player) > radius + enemy.radius) continue;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const length = Math.hypot(dx, dy) || 1;
    const resist = enemy.type === "boss" ? 0.35 : enemy.elite ? 0.62 : enemy.type === "guardian" || enemy.type === "brute" ? 0.78 : 1;
    const push = 78 * resist;
    startEnemyKnockback(room, enemy, dx / length, dy / length, push, {
      duration: clamp(push / 380, 0.16, 0.28),
      maxDistance: 118,
      style: "cleric_pulse_push",
      interruptCharge: true
    });
    enemy.slowTimer = Math.max(enemy.slowTimer, 0.65);
    addEffect(room, "impact", enemy.x, enemy.y, {
      color: classes.cleric.color,
      radius: enemy.radius + 18,
      style: "holy_push"
    });
  }

  applyClericPulseBlessing(room, player, 190);
  if (cleansedProjectiles > 0) {
    addEffect(room, "cleanse", player.x, player.y, {
      color: classes.cleric.color,
      radius: 64,
      style: "projectile_cleanse_burst"
    });
  }
}

function applyClericPulseBlessing(room, player, radius) {
  for (const ally of getActiveLivingPlayers(room)) {
    if (distance(player, ally) > radius) continue;
    ally.shield = Math.max(ally.shield, (22 + player.level * 3) * (player.shieldMul || 1));
    ally.shieldTimer = Math.max(ally.shieldTimer, 3.2);
    ally.hp = Math.min(ally.maxHp, ally.hp + (10 + player.level * 1.4) * (player.healingMul || 1));
    if (ally.poisonTimer > 0) {
      ally.poisonTimer = Math.max(0, ally.poisonTimer - 1.2);
      if (ally.poisonTimer <= 0) clearPlayerPoison(ally);
    }
    addEffect(room, "shield", ally.x, ally.y, { color: classes.cleric.color, radius: 42, style: "dash_blessing" });
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
  return getDashMaxChargesForClass(player.classId);
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

function applyWarriorDashPush(room, player, enemy, dir, scale = 1) {
  const shieldCharge = scale > 2;
  const dashPower = Math.min(1.35, player.dashDamageMul || 1);
  const typeResist = enemy.type === "boss" ? 0.36 : enemy.elite ? 0.68 : enemy.type === "guardian" || enemy.type === "brute" ? 0.82 : 1;
  const push = 116 * dashPower * typeResist * scale;
  startEnemyKnockback(room, enemy, dir.x, dir.y, push, {
    duration: clamp(push / (shieldCharge ? 760 : 920), shieldCharge ? 0.4 : 0.18, shieldCharge ? 0.62 : 0.3),
    maxDistance: shieldCharge ? 520 : 260,
    style: shieldCharge ? "shield_charge_push" : "warrior_dash_push",
    interruptCharge: true
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
  const existing = enemy.knockbackMove;
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
    moveEnemyBy(room, enemy, move.dirX * step, move.dirY * step);
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
  if (style === "shield_charge_push") return Math.sin(t * Math.PI * 0.5);
  if (style === "cleric_pulse_push") return t * t * (3 - 2 * t);
  return 1 - Math.pow(1 - t, 2.35);
}

function performAttack(room, player, now) {
  const def = classes[player.classId];
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
        const dealt = dealDamage(room, enemy, def.damage * 1.12, player.id, { knockback: 90 });
        if (dealt > 0) addMeleeImpact(room, enemy, "blade_impact", 0.9);
      }
    }
    return;
  }

  if (player.classId === "martialist") {
    player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
    player.comboCounter = ((player.comboCounter || 0) % 3) + 1;
    player.comboTimer = Math.max(player.comboTimer || 0, hasUpgrade(player, "martial_combo_flow") ? 3.2 : 2.45);
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
    room.projectiles.push({
      id: nextProjectileId++,
      ownerId: player.id,
      classId: "alchemist",
      x: player.x + aim.x * 30,
      y: player.y + aim.y * 30,
      vx: aim.x * def.projectileSpeed,
      vy: aim.y * def.projectileSpeed,
      distanceLeft: def.range * player.rangeMul,
      damage: def.damage * 0.92,
      radius: hasUpgrade(player, "alchemist_bigger_bottle") ? 12 : 10,
      pierce: 0,
      splash: (hasUpgrade(player, "alchemist_bigger_bottle") ? 98 : 74) * player.areaMul + player.splashBonus,
      poison: hasUpgrade(player, "alchemist_corrosive"),
      poisonDurationBonus: hasUpgrade(player, "alchemist_acid_storm") ? 1.1 : 0,
      poisonDpsBonus: hasUpgrade(player, "alchemist_corrosive") ? 4 : 0,
      slow: hasUpgrade(player, "alchemist_acid") ? 0.48 : 0,
      chain: 0,
      style: "alchemy_bottle",
      hostile: false,
      dead: false
    });
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
      const lowHp = enemy.hp <= enemy.maxHp * 0.36;
      const damage =
        def.damage *
        (marked ? 1.55 : 1.08) *
        (lowHp && hasUpgrade(player, "assassin_execution") ? 1.24 : 1) *
        (hasUpgrade(player, "assassin_deep_cut") ? 1.08 : 1);
      const dealt = dealDamage(room, enemy, damage, player.id, { noVulnerable: true });
      if (dealt > 0) {
        addMeleeImpact(room, enemy, marked ? "assassin_mark_hit" : "blade_impact", marked ? 1.04 : 0.76);
        if (marked) triggerAssassinEcho(room, player, enemy, def.damage * 0.28, { big: false });
      }
    }
    return;
  }

  if (player.classId === "engineer") {
    room.projectiles.push({
      id: nextProjectileId++,
      ownerId: player.id,
      classId: "engineer",
      x: player.x + aim.x * 30,
      y: player.y + aim.y * 30,
      vx: aim.x * def.projectileSpeed,
      vy: aim.y * def.projectileSpeed,
      distanceLeft: def.range * player.rangeMul,
      damage: def.damage * 1.05,
      radius: 10,
      pierce: hasUpgrade(player, "engineer_rail_turret") ? 2 : 1,
      splash: 0,
      poison: false,
      slow: 0,
      chain: 0,
      style: "engineer_bolt",
      hostile: false,
      dead: false
    });
    addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
      angle: Math.atan2(aim.y, aim.x),
      color: classes.engineer.color,
      radius: 42,
      style: "engineer_bolt"
    });
    return;
  }

  if (player.classId === "puppeteer") {
    room.projectiles.push({
      id: nextProjectileId++,
      ownerId: player.id,
      classId: "puppeteer",
      x: player.x + aim.x * 28,
      y: player.y + aim.y * 28,
      vx: aim.x * def.projectileSpeed,
      vy: aim.y * def.projectileSpeed,
      distanceLeft: def.range * player.rangeMul,
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
    });
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
    id: nextProjectileId++,
    ownerId: player.id,
    classId: player.classId,
    x: player.x + aim.x * 30,
    y: player.y + aim.y * 30,
    vx: aim.x * def.projectileSpeed,
    vy: aim.y * def.projectileSpeed,
    distanceLeft: def.range * player.rangeMul,
    damage: def.damage * (player.classId === "ranger" ? 1.08 : player.classId === "mage" ? 1.12 : 1),
    radius,
    pierce: player.classId === "ranger" ? 2 : 0,
    splash: player.classId === "mage" ? 98 * player.areaMul + player.splashBonus : 0,
    poison: false,
    slow: 0,
    chain: 0,
    style:
      player.classId === "mage"
        ? "arcane_orb"
        : player.classId === "cleric"
          ? "holy_bolt"
          : player.classId === "ranger"
            ? "arrow"
            : "novice_bolt",
    hostile: false,
    dead: false
  };
  room.projectiles.push(projectile);
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
  return skillSystem.canTriggerSkillSlot(player, slot, skillUpgrades);
}

function getUnlockedSlotUpgrade(player, slot) {
  return skillSystem.getUnlockedSlotUpgrade(player, slot, skillUpgrades);
}

function getSkillCooldown(player, slot) {
  return skillSystem.getSkillCooldown(player, slot, classes);
}

function applySkillCooldown(player, slot) {
  return skillSystem.applySkillCooldown(player, slot, classes);
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
        player.areaMul *
        (hasUpgrade(player, "warrior_warlord") ? 1.15 : 1) *
        (hasUpgrade(player, "warrior_sword_reach") ? 1.06 : 1);
      player.hp = Math.min(player.maxHp, player.hp + 14);
      player.shield = Math.min(player.maxHp * 0.28, player.shield + 24 + (hasUpgrade(player, "warrior_guardian") ? 6 : 0));
      player.shieldTimer = 4.4;
      addEffect(room, "spin", player.x, player.y, {
        color: classes.warrior.color,
        radius,
        style: "warrior_spin",
        originX: round2(player.x),
        originY: round2(player.y),
        rangeRadius: round2(radius),
        rangeType: "circle",
        duration: 0.6
      });
      for (const enemy of room.enemies) {
        if (distance(player, enemy) <= radius + enemy.radius) {
          enemy.tauntTargetId = player.id;
          enemy.tauntTimer = Math.max(enemy.tauntTimer, 2.8);
          const dealt = dealDamage(room, enemy, def.damage * 2.25, player.id, { knockback: 175 });
          if (dealt > 0) addMeleeImpact(room, enemy, "spin_impact", 1.08);
        }
      }
      pushEvent(room, `${player.name} 님이 강철 회오리를 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "warrior_taunt")) {
      const radius =
        320 *
        player.areaMul *
        (hasUpgrade(player, "warrior_taunt_pull") ? 1.1 : 1) *
        (hasUpgrade(player, "warrior_legend_colossus") ? 1.22 : 1);
      const tauntTime =
        (hasUpgrade(player, "warrior_taunt_bastion") ? 5.4 : 4.2) +
        (hasUpgrade(player, "warrior_legend_colossus") ? 1.15 : 0);
      addEffect(room, "warning", player.x, player.y, {
        color: classes.warrior.color,
        radius,
        style: "taunt",
        rangeRadius: round2(radius),
        rangeType: "circle",
        duration: 0.72
      });
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        enemy.tauntTargetId = player.id;
        enemy.tauntTimer = Math.max(enemy.tauntTimer, tauntTime);
        if (enemy.type !== "boss") {
          if (enemy.windup?.kind !== "bomber_explode") enemy.windup = null;
          enemy.shotTimer = Math.max(enemy.shotTimer || 0, 0.35);
          enemy.healTimer = Math.max(enemy.healTimer || 0, 0.55);
          enemy.specialTimer = Math.max(enemy.specialTimer || 0, 0.45);
        }
        if (distance(player, enemy) <= radius + enemy.radius && hasUpgrade(player, "warrior_taunt_pull") && enemy.type !== "boss") {
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
      }
      player.shield = Math.max(
        player.shield,
        (hasUpgrade(player, "warrior_taunt_bastion") ? 86 : 54) + (hasUpgrade(player, "warrior_legend_colossus") ? 52 : 0)
      );
      player.shieldTimer =
        (hasUpgrade(player, "warrior_taunt_bastion") ? 6.2 : 5.2) +
        (hasUpgrade(player, "warrior_legend_colossus") ? 1.2 : 0);
      player.tauntGuardTimer = Math.max(
        player.tauntGuardTimer || 0,
        hasUpgrade(player, "warrior_taunt_bastion") ? 5.4 : WARRIOR_TAUNT_GUARD_DURATION
      );
      addEffect(room, "shield", player.x, player.y, {
        color: classes.warrior.color,
        radius: 72,
        style: "taunt_guard"
      });
      pushEvent(room, `${player.name} 님이 적을 도발했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "warrior_charge")) {
      const startX = player.x;
      const startY = player.y;
      const chargeDistance =
        365 *
        Math.min(1.12, player.speedMul) *
        (player.dashDistanceMul || 1) *
        (hasUpgrade(player, "warrior_charge_crash") ? 1.12 : 1) *
        (hasUpgrade(player, "warrior_legend_colossus") ? 1.12 : 1);
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
      const contactRadius =
        88 *
        player.areaMul *
        (hasUpgrade(player, "warrior_charge_crash") ? 1.28 : 1) *
        (hasUpgrade(player, "warrior_legend_colossus") ? 1.22 : 1);
      addEffect(room, "dash", (startX + endX) / 2, (startY + endY) / 2, {
        color: classes.warrior.color,
        angle: Math.atan2(aim.y, aim.x),
        radius: Math.max(34, actualDistance * 0.62),
        style: "shield_charge",
        fromX: round2(startX),
        fromY: round2(startY),
        toX: round2(endX),
        toY: round2(endY),
        contactRadius: round2(contactRadius),
        rangeType: "capsule",
        moveDuration: round2(chargeDuration),
        duration: round2(chargeDuration + 0.18)
      });
      beginPlayerDashMove(room, player, aim, startX, startY, endX, endY, actualDistance, "shield_charge", {
        duration: chargeDuration,
        contactRadius,
        damageMul:
          2.32 *
          (hasUpgrade(player, "warrior_charge_crash") ? 1.12 : 1) *
          (hasUpgrade(player, "warrior_legend_colossus") ? 1.1 : 1),
        hitTauntTime: 2.5,
        knockback: (hasUpgrade(player, "warrior_charge_crash") ? 690 : 520) * (hasUpgrade(player, "warrior_legend_colossus") ? 1.22 : 1),
        pushScale: (hasUpgrade(player, "warrior_charge_crash") ? 4.8 : 3.65) * (hasUpgrade(player, "warrior_legend_colossus") ? 1.22 : 1),
        impactScale: hasUpgrade(player, "warrior_charge_crash") ? 2.05 : 1.78
      });
      player.shield = Math.min(player.maxHp * 0.34, player.shield + 34);
      player.shieldTimer = Math.max(player.shieldTimer, 3.4);
      player.immunityTimer = Math.max(player.immunityTimer, 0.24);
      pushEvent(room, `${player.name} 님이 방패 돌진을 사용했습니다.`);
      return;
    }

    if (slot === "f" && hasUpgrade(player, "warrior_cleave")) {
      player.attackSwingSide = player.attackSwingSide === -1 ? 1 : -1;
      const swingSide = player.attackSwingSide;
      const reach = def.range * player.rangeMul * player.areaMul * 2.45;
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
      for (const enemy of room.enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dot = (dx / dist) * aim.x + (dy / dist) * aim.y;
        if (dist <= reach + enemy.radius && dot > -0.25) {
          const executeMul = hasUpgrade(player, "warrior_cleave_execution") && enemy.hp <= enemy.maxHp * 0.42 ? 1.45 : 1;
          const dealt = dealDamage(room, enemy, def.damage * 3.35 * executeMul, player.id, { knockback: 220 });
          if (dealt > 0 && hasUpgrade(player, "warrior_cleave_guard")) {
            player.shield = Math.min(player.maxHp * 0.3, player.shield + 7);
            player.shieldTimer = Math.max(player.shieldTimer, 3.2);
          }
          if (dealt > 0) addMeleeImpact(room, enemy, "cleave_impact", 1.32);
        }
      }
      pushEvent(room, `${player.name} 님이 광역 베기를 사용했습니다.`);
      if (hasUpgrade(player, "warrior_mythic_worldsplitter")) {
        const impactX = clamp(player.x + aim.x * reach * 0.98, 48, room.world.w - 48);
        const impactY = clamp(player.y + aim.y * reach * 0.98, 48, room.world.h - 48);
        const shockRadius = reach * 0.48;
        addEffect(room, "impact", impactX, impactY, {
          color: classes.warrior.color,
          radius: shockRadius,
          style: "shield_slam",
          rangeRadius: round2(shockRadius),
          rangeType: "circle",
          duration: 0.5
        });
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(enemy, { x: impactX, y: impactY }) > shockRadius + enemy.radius) continue;
          const dealt = dealDamage(room, enemy, def.damage * 1.9, player.id, { knockback: 300 });
          if (dealt > 0) addMeleeImpact(room, enemy, "cleave_impact", 1.15);
        }
      }
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
      const spread = hasUpgrade(player, "ranger_multishot")
        ? [-0.44, -0.33, -0.22, -0.11, 0, 0.11, 0.22, 0.33, 0.44]
        : [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3];
      for (const angle of spread) {
        const dir = rotate(aim, angle);
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "ranger",
          x: player.x + dir.x * 30,
          y: player.y + dir.y * 30,
          vx: dir.x * 700,
          vy: dir.y * 700,
          distanceLeft: def.range * player.rangeMul * 1.08,
          damage: def.damage * (hasUpgrade(player, "ranger_multishot") ? 1.08 : 1.18),
          radius: 9,
          pierce: 2,
          splash: 0,
          poison: false,
          slow: 0,
          chain: hasUpgrade(player, "ranger_legend_storm_quiver") ? 1 : 0,
          style: "arrow_fan",
          hostile: false,
          dead: false
        });
      }
      addEffect(room, "shot", player.x + aim.x * 34, player.y + aim.y * 34, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.ranger.color,
        radius: 58,
        style: "ranger_barrage"
      });
      pushEvent(room, `${player.name} 님이 연발 사격을 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "ranger_pierce")) {
      const broadhead = hasUpgrade(player, "ranger_bodkin");
      const stormQuiver = hasUpgrade(player, "ranger_legend_storm_quiver");
      const radius = (broadhead ? 31 : 24) * Math.sqrt(player.areaMul || 1);
      const distanceLeft = def.range * player.rangeMul * (broadhead ? 1.62 : 1.38);
      const speed = broadhead ? 980 : 900;
      room.projectiles.push({
        id: nextProjectileId++,
        ownerId: player.id,
        classId: "ranger",
        x: player.x + aim.x * 42,
        y: player.y + aim.y * 42,
        vx: aim.x * speed,
        vy: aim.y * speed,
        distanceLeft,
        damage: def.damage * (broadhead ? 3.05 : 2.35),
        radius,
        pierce: broadhead ? 14 : 8,
        splash: 0,
        poison: false,
        slow: 0,
        chain: stormQuiver ? 1 : 0,
        style: "piercing_arrow",
        hostile: false,
        dead: false
      });
      addEffect(room, "shot", player.x + aim.x * 84, player.y + aim.y * 84, {
        angle: Math.atan2(aim.y, aim.x),
        color: classes.ranger.color,
        radius: broadhead ? 150 : 118,
        style: "piercing_shot",
        width: radius,
        duration: 0.32
      });
      pushEvent(room, `${player.name} 님이 관통 사격을 사용했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "ranger_trap")) {
      const storm = hasUpgrade(player, "ranger_trap_barbs");
      const lightning = hasUpgrade(player, "ranger_trap_chain") || hasUpgrade(player, "ranger_legend_storm_quiver");
      const plague = hasUpgrade(player, "ranger_mythic_plague_garden");
      const targetX = clamp(player.input.aimX, 56, room.world.w - 56);
      const targetY = clamp(player.input.aimY, 56, room.world.h - 56);
      const radius = (storm ? 186 : 150) * player.areaMul * (plague ? 1.1 : 1);
      const armTime = storm ? 0.82 : 0.72;
      room.hazards.push({
        id: nextHazardId++,
        type: "arrow_rain",
        ownerId: player.id,
        x: targetX,
        y: targetY,
        radius,
        timer: (storm ? 3.35 : 2.55) + armTime,
        armTime,
        armTimeMax: armTime,
        tick: 0.08,
        tickRate: storm ? 0.23 : 0.31,
        damage: def.damage * (storm ? 0.88 : 0.72) * (plague ? 0.92 : 1),
        chain: lightning ? 1 : 0,
        poisonGarden: plague,
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
      for (const angle of [-0.24, -0.12, 0, 0.12, 0.24]) {
        const dir = rotate(aim, angle);
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "ranger",
          x: player.x + dir.x * 30,
          y: player.y + dir.y * 30,
          vx: dir.x * 690,
          vy: dir.y * 690,
          distanceLeft: def.range * player.rangeMul,
          damage: def.damage * 1.28,
          radius: 10,
          pierce: 3,
          splash: 0,
          poison: true,
          poisonDpsBonus: hasUpgrade(player, "ranger_poison_focus") ? 5 : 0,
          poisonDurationBonus: hasUpgrade(player, "ranger_poison_focus") ? 1.4 : 0,
          poisonCloud: hasUpgrade(player, "ranger_poison_cloud"),
          slow: 0,
          chain: hasUpgrade(player, "ranger_mythic_plague_garden") ? 1 : 0,
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
      const bolts = 12;
      for (let i = 0; i < bolts; i += 1) {
        const angle = (Math.PI * 2 * i) / bolts;
        room.projectiles.push({
          id: nextProjectileId++,
          ownerId: player.id,
          classId: "mage",
          x: player.x + Math.cos(angle) * 22,
          y: player.y + Math.sin(angle) * 22,
          vx: Math.cos(angle) * 470,
          vy: Math.sin(angle) * 470,
          distanceLeft: 430 * player.rangeMul,
          damage: def.damage * 1.18,
          radius: 14 * player.areaMul,
          pierce: 1,
          splash: 108 * player.areaMul + player.splashBonus,
          poison: false,
          slow: 0,
          chain: hasUpgrade(player, "mage_storm_core") ? 1 : 0,
          style: "star_orb",
          hostile: false,
          dead: false
        });
      }
      addEffect(room, "star", player.x, player.y, {
        color: classes.mage.color,
        radius: 150,
        style: "star_burst"
      });
      pushEvent(room, `${player.name} 님이 별빛 폭발을 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "mage_frost")) {
      const radius = 285 * player.areaMul * (hasUpgrade(player, "mage_absolute_zero") ? 1.18 : 1);
      addEffect(room, "slow", player.x, player.y, { color: "#93c5fd", radius, style: "frost_wave" });
      for (const enemy of room.enemies) {
        if (distance(player, enemy) <= radius + enemy.radius) {
          const freezeDuration =
            (enemy.type === "boss" ? 0.42 : enemy.elite ? 0.72 : 1.05) *
            (hasUpgrade(player, "mage_absolute_zero") ? 1.35 : 1);
          enemy.slowTimer = Math.max(enemy.slowTimer, hasUpgrade(player, "mage_absolute_zero") ? 4.1 : 3.2);
          enemy.freezeTimer = Math.max(enemy.freezeTimer, freezeDuration);
          addEffect(room, "freeze", enemy.x, enemy.y, {
            color: "#93c5fd",
            radius: enemy.radius + 30,
            style: "frost_lock"
          });
          dealDamage(room, enemy, def.damage * (hasUpgrade(player, "mage_frost_shatter") ? 1.58 : 1.15), player.id, {
            interruptBossCast: true
          });
        }
      }
      pushEvent(room, `${player.name} 님이 빙결 파동을 사용했습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "mage_meteor")) {
      const meteorRadius =
        158 *
        player.areaMul *
        (hasUpgrade(player, "mage_wildfire") ? 1.18 : 1) *
        (hasUpgrade(player, "mage_mythic_apocalypse") ? 1.14 : 1);
      room.hazards.push({
        id: nextHazardId++,
        type: "meteor",
        ownerId: player.id,
        x: player.input.aimX,
        y: player.input.aimY,
        radius: meteorRadius,
        timer: 1,
        damage:
          def.damage *
          5.15 *
          (hasUpgrade(player, "mage_wildfire") ? 1.15 : 1) *
          (hasUpgrade(player, "mage_mythic_apocalypse") ? 1.18 : 1),
        wildfire: hasUpgrade(player, "mage_wildfire") || hasUpgrade(player, "mage_mythic_apocalypse"),
        apocalypse: hasUpgrade(player, "mage_mythic_apocalypse"),
        dead: false
      });
      addEffect(room, "meteor", player.input.aimX, player.input.aimY, {
        color: classes.mage.color,
        radius: meteorRadius,
        style: "meteor_call",
        delay: 1
      });
      if (hasUpgrade(player, "mage_twin_meteor")) {
        for (const angle of [-0.7, 0.7]) {
          const side = rotate(aim, angle + Math.PI / 2);
          const x = clamp(player.input.aimX + side.x * 138, 64, room.world.w - 64);
          const y = clamp(player.input.aimY + side.y * 138, 64, room.world.h - 64);
          room.hazards.push({
            id: nextHazardId++,
            type: "meteor",
            ownerId: player.id,
            x,
            y,
            radius: meteorRadius * 0.62,
            timer: 1.22,
            damage: def.damage * 3.05 * (hasUpgrade(player, "mage_mythic_apocalypse") ? 1.12 : 1),
            wildfire: hasUpgrade(player, "mage_wildfire") || hasUpgrade(player, "mage_mythic_apocalypse"),
            apocalypse: hasUpgrade(player, "mage_mythic_apocalypse"),
            dead: false
          });
          addEffect(room, "meteor", x, y, {
            color: classes.mage.color,
            radius: meteorRadius * 0.62,
            style: "meteor_call",
            delay: 1.22
          });
        }
      }
      pushEvent(room, `${player.name} 님이 운석을 호출했습니다.`);
      return;
    }

    if (slot === "f" && hasUpgrade(player, "mage_chain")) {
      const source =
        nearestEnemy(room, player.input.aimX, player.input.aimY, hasUpgrade(player, "mage_chain_overload") ? 640 : 480) ||
        nearestEnemy(room, player.x, player.y, hasUpgrade(player, "mage_chain_overload") ? 760 : 620);
      if (source) {
        addEffect(room, "chain", (player.x + source.x) / 2, (player.y + source.y) / 2, {
          color: classes.mage.color,
          radius: distance(player, source),
          fromX: round2(player.x),
          fromY: round2(player.y),
          toX: round2(source.x),
          toY: round2(source.y),
          style: "chain_lightning"
        });
        dealDamage(room, source, def.damage * (hasUpgrade(player, "mage_chain_overload") ? 2.55 : 2.1), player.id);
        chainLightning(room, player.id, source, def.damage * (hasUpgrade(player, "mage_chain_overload") ? 1.62 : 1.36), hasUpgrade(player, "mage_chain_overload") ? 13 : 9, {
          range: hasUpgrade(player, "mage_chain_overload") ? 455 : 390,
          falloff: hasUpgrade(player, "mage_chain_overload") ? 0.08 : 0.11,
          minDamageMul: hasUpgrade(player, "mage_chain_overload") ? 0.55 : 0.42
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

  if (player.classId === "cleric") {
    if (slot === "q") {
      const healRadius = 500;
      addEffect(room, "holy", player.x, player.y, {
        color: classes.cleric.color,
        radius: 260 * player.areaMul,
        style: "dawn_circle"
      });
      for (const ally of getActiveLivingPlayers(room)) {
        if (distance(player, ally) > healRadius) continue;
        const heal = (42 + ally.maxHp * 0.12) * (player.healingMul || 1);
        ally.hp = Math.min(ally.maxHp, ally.hp + heal);
        ally.shield = Math.max(ally.shield, (12 + player.level * 2) * (player.shieldMul || 1));
        ally.shieldTimer = Math.max(ally.shieldTimer, 3.2);
        addEffect(room, "heal", ally.x, ally.y, { value: Math.round(heal), color: classes.cleric.color });
      }
      for (const enemy of room.enemies) {
        if (distance(player, enemy) <= 260 * player.areaMul + enemy.radius) {
          dealDamage(room, enemy, def.damage * 2.45, player.id, { knockback: 115 });
        }
      }
      pushEvent(room, `${player.name} 님이 새벽의 원을 사용했습니다.`);
      return;
    }

    if (slot === "e" && hasUpgrade(player, "cleric_barrier")) {
      for (const ally of getActiveLivingPlayers(room)) {
        if (distance(player, ally) > 460) continue;
        ally.shield = Math.max(
          ally.shield,
          (72 + player.level * 8 + (hasUpgrade(player, "cleric_devotion") ? 24 : 0)) * (player.shieldMul || 1)
        );
        ally.shieldTimer = 7.2;
        addEffect(room, "shield", ally.x, ally.y, { color: classes.cleric.color, radius: 48, style: "barrier" });
      }
      pushEvent(room, `${player.name} 님이 보호막을 펼쳤습니다.`);
      return;
    }

    if (slot === "r" && hasUpgrade(player, "cleric_revive")) {
      const target = nearestDownedPlayer(room, player, 420);
      if (target) {
        target.hp = Math.max(1, Math.floor(target.maxHp * 0.55));
        target.downedAt = 0;
        target.shield = 54;
        target.shieldTimer = 6.5;
        addEffect(room, "revive", target.x, target.y, { color: classes.cleric.color, radius: 70, style: "revive" });
        pushEvent(room, `${player.name} 님이 ${target.name} 님을 부활시켰습니다.`);
      }
      return;
    }

    if (slot === "f" && hasUpgrade(player, "cleric_cleanse")) {
      for (const ally of getActiveLivingPlayers(room)) {
        if (distance(player, ally) > 520) continue;
        clearPlayerPoison(ally);
        ally.immunityTimer = 4.6;
        ally.hp = Math.min(ally.maxHp, ally.hp + (24 + player.level * 2) * (player.healingMul || 1));
        addEffect(room, "cleanse", ally.x, ally.y, { color: classes.cleric.color, radius: 54, style: "cleanse" });
      }
      pushEvent(room, `${player.name} 님이 정화를 사용했습니다.`);
      return;
    }
  }
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

function getMartialChiMax(player) {
  return hasUpgrade(player, "martial_combo_flow") ? 4 : 3;
}

function gainMartialChi(player, amount = 1) {
  if (player.classId !== "martialist") return 0;
  const maxChi = getMartialChiMax(player);
  const afterimageBonus = hasUpgrade(player, "martial_afterimage") && (player.dashSpeedTimer || 0) > 0 ? 0.5 : 0;
  player.martialChi = clamp((player.martialChi || 0) + amount + afterimageBonus, 0, maxChi);
  player.martialChiTimer = Math.max(player.martialChiTimer || 0, hasUpgrade(player, "martial_combo_flow") ? 8.2 : 6.4);
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
    (hasUpgrade(player, "puppeteer_mythic_grand_theater") ? 1 : 0);
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
    (hasUpgrade(player, "alchemist_legend_philosopher") ? 1.12 : 1);
  const damage =
    def.damage *
    (options.small ? 1.05 : 1.8) *
    (hasUpgrade(player, "alchemist_chain_reaction") ? 1.18 : 1) *
    (hasUpgrade(player, "alchemist_legend_philosopher") ? 1.18 : 1);
  addEffect(room, "explosion", x, y, {
    color: "#e8b15e",
    radius: reactionRadius,
    style: "alchemy_reaction"
  });
  damageEnemiesInRadius(room, player, x, y, reactionRadius, damage, {
    slow: 0.72,
    knockback: options.knockback || 82,
    poison: { duration: hasUpgrade(player, "alchemist_acid_storm") ? 3.8 : 2.8, dps: 5.8 + room.wave * 0.72 },
    burn: { duration: hasUpgrade(player, "alchemist_fire_sea") ? 3.5 : 2.6, dps: 6.2 + room.wave * 0.82 }
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
    poisonDps: 4.8 + room.wave * 0.55,
    burnDps: 5.4 + room.wave * 0.6,
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
    if (!hasUpgrade(player, "alchemist_legend_philosopher")) {
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
    hazard.timer *= hasUpgrade(player, "alchemist_legend_philosopher") ? 0.72 : 0.42;
    reacted = true;
  }
  return reacted;
}

function triggerAssassinEcho(room, player, enemy, damage, options = {}) {
  if (!enemy || enemy.hp <= 0) return 0;
  const marked = isAssassinMarked(enemy, player);
  const lowHp = enemy.hp <= enemy.maxHp * 0.36;
  const echoMul =
    (marked ? 1.1 : 0.72) *
    (lowHp && hasUpgrade(player, "assassin_execution") ? 1.28 : 1) *
    (hasUpgrade(player, "assassin_legend_nightfall") ? 1.12 : 1);
  addEffect(room, "slash", enemy.x, enemy.y, {
    angle: Math.atan2(enemy.y - player.y, enemy.x - player.x) + Math.PI * 0.7,
    color: classes.assassin.color,
    radius: enemy.radius + (options.big ? 74 : 52),
    style: "assassin_echo"
  });
  const dealt = dealDamage(room, enemy, damage * echoMul, player.id, { noVulnerable: true });
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

function performMartialistSkill(room, player, slot, aim, def) {
  if (slot === "q") {
    const chi = gainMartialChi(player, 1);
    const fullChi = chi >= getMartialChiMax(player);
    player.comboTimer = Math.max(player.comboTimer || 0, hasUpgrade(player, "martial_combo_flow") ? 3.4 : 2.6);
    player.comboCounter = Math.max(1, player.comboCounter || 1);
    const radius = 160 * player.areaMul * (hasUpgrade(player, "martial_dragon_pulse") ? 1.1 : 1) * (fullChi ? 1.12 : 1);
    addEffect(room, "spin", player.x, player.y, {
      color: classes.martialist.color,
      radius,
      style: fullChi ? "martial_flurry_finisher" : "martial_flurry"
    });
    const hits = damageEnemiesInCone(room, player, player.x, player.y, aim, radius, -0.32, def.damage * (hasUpgrade(player, "martial_mythic_infinite_combo") ? 2.22 : 1.76) * martialChiScale(player, fullChi ? chi : chi * 0.65), {
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
      damageEnemiesOnLine(room, player, player.x, player.y, endX, endY, 78 * player.areaMul, def.damage * 0.92 * martialChiScale(player, chi), {
        impactStyle: "martial_impact",
        knockback: 96,
        slow: 0.42
      });
      if (hasUpgrade(player, "martial_mythic_infinite_combo")) {
        player.martialFlowTimer = Math.max(player.martialFlowTimer || 0, 2.6);
      }
      consumeMartialChi(player, false);
    }
    if ((hits > 0 || fullChi) && hasUpgrade(player, "martial_mythic_infinite_combo")) {
      for (const slotKey of SKILL_SLOTS) player.skillTimers[slotKey] = Math.max(0, player.skillTimers[slotKey] - 0.22);
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
    damageEnemiesOnLine(room, player, player.x, player.y, endX, endY, width, def.damage * (hasUpgrade(player, "martial_palm_breaker") ? 2.28 : 1.92) * chiScale, {
      impactStyle: "martial_impact",
      impactScale: 1.08,
      knockback: (hasUpgrade(player, "martial_palm_breaker") ? 168 : 126) + chi * 22,
      maxPush: fullChi ? 260 : 210,
      slow: fullChi ? 1.15 : 0.9
    });
    if (fullChi || hasUpgrade(player, "martial_legend_dragon_soul")) {
      const burstRadius = (fullChi ? 132 : 92) * player.areaMul;
      damageEnemiesInRadius(room, player, endX, endY, burstRadius, def.damage * (fullChi ? 1.24 : 1.08) * chiScale, { slow: 0.45, knockback: fullChi ? 112 : 64 });
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
      damageMul: (hasUpgrade(player, "martial_rising_chain") ? 1.95 : 1.58) * (player.dashDamageMul || 1) * chiScale,
      knockback: (hasUpgrade(player, "martial_rising_chain") ? 188 : 144) + chi * 28,
      impactScale: 1.1
    });
    if (fullChi || hasUpgrade(player, "martial_legend_dragon_soul")) {
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
    const radius = (hasUpgrade(player, "martial_focus_guard") ? 218 : 176) * player.areaMul * (1 + chi * 0.08);
    player.shield = Math.max(player.shield, ((hasUpgrade(player, "martial_focus_guard") ? 52 : 34) + chi * 12) * (player.shieldMul || 1));
    player.shieldTimer = Math.max(player.shieldTimer, (hasUpgrade(player, "martial_focus_guard") ? 4.6 : 3.4) + chi * 0.35);
    player.dashSpeedMul = Math.max(player.dashSpeedMul || 1, 1.16 + chi * 0.035);
    player.dashSpeedTimer = Math.max(player.dashSpeedTimer || 0, (hasUpgrade(player, "martial_focus_guard") ? 2.5 : 1.7) + chi * 0.25);
    addEffect(room, "shield", player.x, player.y, {
      color: classes.martialist.color,
      radius,
      style: "martial_focus"
    });
    damageEnemiesInRadius(room, player, player.x, player.y, radius, def.damage * 1.45 * chiScale, { slow: 0.5 + chi * 0.08, knockback: 132 + chi * 34 });
    pushEvent(room, `${player.name} 님이 기합 폭발을 사용했습니다.`);
  }
}

function performAlchemistSkill(room, player, slot, aim, def) {
  const targetX = clamp(player.input.aimX, 48, room.world.w - 48);
  const targetY = clamp(player.input.aimY, 48, room.world.h - 48);

  if (slot === "q") {
    const radius = (hasUpgrade(player, "alchemist_bigger_bottle") ? 128 : 106) * player.areaMul;
    deployAlchemyBomb(room, player, targetX, targetY, radius, def.damage * (hasUpgrade(player, "alchemist_chain_reaction") ? 2.15 : 1.76), {
      armTime: 0.48,
      reactionRadius: radius + 92,
      slow: 0.52,
      reactedSlow: 0.78,
      knockback: 58,
      reactedKnockback: 86,
      style: "alchemy_bomb"
    });
    if (hasUpgrade(player, "alchemist_chain_reaction") || hasUpgrade(player, "alchemist_mythic_homunculus_mix")) {
      const count = hasUpgrade(player, "alchemist_mythic_homunculus_mix") ? 5 : 3;
      for (let i = 0; i < count; i += 1) {
        const angle = Math.atan2(aim.y, aim.x) + (i - (count - 1) / 2) * 0.72;
        const x = clamp(targetX + Math.cos(angle) * 94, 48, room.world.w - 48);
        const y = clamp(targetY + Math.sin(angle) * 94, 48, room.world.h - 48);
        if (hasUpgrade(player, "alchemist_mythic_homunculus_mix")) {
          createAlchemyPool(room, player, x, y, i % 2 === 0 ? "acid" : "fire", def, { small: true, armTime: 0.42 });
        } else {
          deployAlchemyBomb(room, player, x, y, 58 * player.areaMul, def.damage * 0.62, {
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
    if (hasUpgrade(player, "alchemist_mythic_homunculus_mix")) {
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
    damage: def.damage * (fire ? 0.62 : 0.54) * (options.small ? 0.58 : 1),
    poisonDps: (5.8 + room.wave * 0.75) * (hasUpgrade(player, "alchemist_corrosive") ? 1.28 : 1),
    burnDps: (6.6 + room.wave * 0.82) * (hasUpgrade(player, "alchemist_fire_sea") ? 1.24 : 1),
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
    const hits = damageEnemiesInCone(room, player, player.x, player.y, aim, radius, -0.18, def.damage * (hasUpgrade(player, "assassin_fan") ? 2.06 : 1.72), {
      impactStyle: "assassin_mark_hit",
      impactScale: 0.92,
      damageMul: (enemy) => (isAssassinMarked(enemy, player) ? 1.42 : 1),
      push: 34
    });
    if (hits > 0) {
      triggerAssassinEchoAroundMarked(room, player, player.x, player.y, radius + 88, def.damage * 0.68, hasUpgrade(player, "assassin_fan") ? 4 : 2);
    }
    if (hasUpgrade(player, "assassin_mythic_death_blossom")) {
      const sideAim = rotate(aim, 0.45);
      damageEnemiesInCone(room, player, player.x, player.y, sideAim, radius * 0.94, -0.08, def.damage * 1.12, {
        impactStyle: "assassin_mark_hit",
        damageMul: (enemy) => (isAssassinMarked(enemy, player) ? 1.28 : 1)
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
      triggerAssassinEcho(room, player, target, def.damage * 0.42, { big: false });
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
      damageMul: (hasUpgrade(player, "assassin_lunge_reset") ? 2.45 : 2.05) * (player.dashDamageMul || 1),
      knockback: 82,
      impactScale: 1.04
    });
    const lineHits = damageEnemiesOnLine(room, player, startX, startY, endpoint.x, endpoint.y, 54 * player.areaMul, def.damage * 0.78, {
      impactStyle: "assassin_mark_hit",
      damageMul: (enemy) => (isAssassinMarked(enemy, player) ? 1.45 : 0.72),
      slow: 0.28
    });
    if (lineHits > 0) {
      triggerAssassinEchoAroundMarked(room, player, endpoint.x, endpoint.y, 240 * player.areaMul, def.damage * (hasUpgrade(player, "assassin_lunge_reset") ? 0.9 : 0.68), hasUpgrade(player, "assassin_legend_nightfall") ? 4 : 2);
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
      if (hasUpgrade(player, "assassin_legend_nightfall")) applyAssassinMark(room, player, enemy, 3.2);
    }
    const echoLimit = hasUpgrade(player, "assassin_smoke_bomb") ? 5 : 3;
    triggerAssassinEchoAroundMarked(room, player, player.x, player.y, radius + 86, def.damage * 0.86, echoLimit);
    const nearest = nearestEnemy(room, player.x, player.y, radius + 80);
    if (nearest && !isAssassinMarked(nearest, player)) {
      triggerAssassinEcho(room, player, nearest, def.damage * 0.55, { big: false });
    }
    pushEvent(room, `${player.name} 님이 연막을 펼쳤습니다.`);
  }
}

function performEngineerSkill(room, player, slot, aim, def) {
  if (slot === "q") {
    const boosted = overclockEngineerDeployables(room, player, def);
    const radius = 190 * player.areaMul * (hasUpgrade(player, "engineer_mythic_singularity_core") ? 1.28 : 1);
    addEffect(room, "chain", player.x, player.y, {
      color: classes.engineer.color,
      radius,
      style: "engineer_overclock"
    });
    if (hasUpgrade(player, "engineer_mythic_singularity_core")) {
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0 || distance(player, enemy) > radius + enemy.radius) continue;
        startEnemyKnockback(room, enemy, player.x - enemy.x, player.y - enemy.y, enemy.type === "boss" ? 18 : 92, {
          duration: 0.24,
          maxDistance: 120,
          style: "hit_knockback"
        });
        dealDamage(room, enemy, def.damage * 1.35, player.id, { noVulnerable: true });
      }
    }
    player.shield = Math.max(player.shield, 18 + boosted * 8);
    player.shieldTimer = Math.max(player.shieldTimer, 2.8);
    pushEvent(room, `${player.name} overclocked ${boosted} device(s).`);
    return;
  }

  if (slot === "e" && hasUpgrade(player, "engineer_turret")) {
    const x = clamp(player.input.aimX, 44, room.world.w - 44);
    const y = clamp(player.input.aimY, 44, room.world.h - 44);
    deployEngineerTurret(room, player, x, y, def, false);
    if (hasUpgrade(player, "engineer_twin_turret")) {
      const side = rotate(aim, Math.PI / 2);
      deployEngineerTurret(room, player, clamp(x + side.x * 62, 44, room.world.w - 44), clamp(y + side.y * 62, 44, room.world.h - 44), def, true);
    }
    trimOwnedHazards(room, player.id, "engineer_turret", hasUpgrade(player, "engineer_twin_turret") ? 4 : 2);
    pushEvent(room, `${player.name} deployed turret.`);
    return;
  }

  if (slot === "r" && hasUpgrade(player, "engineer_mine")) {
    const x = clamp(player.input.aimX, 44, room.world.w - 44);
    const y = clamp(player.input.aimY, 44, room.world.h - 44);
    const sticky = hasUpgrade(player, "engineer_sticky_mine");
    const armTime = sticky ? 0.72 : 0.62;
    room.hazards.push({
      id: nextHazardId++,
      type: "engineer_mine",
      ownerId: player.id,
      x,
      y,
      radius: (sticky ? 122 : 98) * player.areaMul,
      triggerRadius: (sticky ? 82 : 66) * player.areaMul,
      timer: 13.5 * getEngineerDurationMul(player),
      armTime,
      armTimeMax: armTime,
      damage: def.damage * (sticky ? 3.25 : 2.55),
      chain: hasUpgrade(player, "engineer_chain_mine"),
      color: classes.engineer.color,
      dead: false
    });
    trimOwnedHazards(room, player.id, "engineer_mine", hasUpgrade(player, "engineer_chain_mine") ? 7 : 5);
    addEngineerDeviceThrowEffect(room, player, x, y, sticky ? "sticky_mine" : "mine", sticky ? 0.54 : 0.48);
    addEffect(room, "trap", x, y, { color: classes.engineer.color, radius: sticky ? 86 : 68, style: "shock_mine" });
    pushEvent(room, `${player.name} planted shock mine.`);
    return;
  }

  if (slot === "f" && hasUpgrade(player, "engineer_drone")) {
    deployEngineerDrone(room, player, def, 0);
    if (hasUpgrade(player, "engineer_drone_swarm")) deployEngineerDrone(room, player, def, Math.PI);
    trimOwnedHazards(room, player.id, "engineer_drone", hasUpgrade(player, "engineer_drone_swarm") ? 2 : 1);
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
    commandPuppetDash(room, player, puppet, targetX, targetY, def.damage * 1.48, {
      width: 62 * player.areaMul,
      impactRadius: 128 * player.areaMul,
      impactDamage: def.damage * 1.1,
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
    if (hasUpgrade(player, "puppeteer_mythic_grand_theater")) {
      damageEnemiesInRadius(room, player, player.x, player.y, 148 * player.areaMul, def.damage * 1.35, { slow: 1.2, knockback: 70, threadMark: 2 });
      detonateThreadMarksInRadius(room, player, player.x, player.y, 240 * player.areaMul, def.damage * 1.1, { slow: 1.2 });
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
    commandPuppetDash(room, player, puppet, targetX, targetY, def.damage * (hasUpgrade(player, "puppeteer_razor_puppet") ? 2.15 : 1.72), {
      width: (hasUpgrade(player, "puppeteer_razor_puppet") ? 78 : 62) * player.areaMul,
      impactRadius: (hasUpgrade(player, "puppeteer_guard_puppet") ? 166 : 134) * player.areaMul,
      impactDamage: def.damage * (hasUpgrade(player, "puppeteer_razor_puppet") ? 1.45 : 1.05),
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
    player.x = clamp(puppet.x, 32, room.world.w - 32);
    player.y = clamp(puppet.y, 32, room.world.h - 32);
    puppet.x = clamp(oldX, 32, room.world.w - 32);
    puppet.y = clamp(oldY, 32, room.world.h - 32);
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
  return (hasUpgrade(player, "puppeteer_soul_stitch") ? 18 : 13.5) * (hasUpgrade(player, "puppeteer_legend_twin_souls") ? 1.24 : 1);
}

function deployPuppet(room, player, x, y, def, options = {}) {
  removeOwnedHazards(room, player.id, "puppet");
  const summonTime = options.opening ? 0.56 : 0.44;
  const puppet = {
    id: nextHazardId++,
    type: "puppet",
    ownerId: player.id,
    x: clamp(x, 48, room.world.w - 48),
    y: clamp(y, 48, room.world.h - 48),
    radius: hasUpgrade(player, "puppeteer_guard_puppet") ? 31 : 25,
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
  const endX = clamp(x, 40, room.world.w - 40);
  const endY = clamp(y, 40, room.world.h - 40);
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
    slow: hasUpgrade(player, "puppeteer_legend_twin_souls") ? 1.8 : 1.2,
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
  const bindTime = hasUpgrade(player, "puppeteer_legend_twin_souls") ? 3.1 : 2.2;

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

  if (hasUpgrade(player, "puppeteer_legend_twin_souls")) {
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
  room.hazards.push({
    id: nextHazardId++,
    type: "engineer_turret",
    ownerId: player.id,
    x,
    y,
    radius: mini ? 17 : 23,
    timer: (mini ? 10.5 : 15.5) * getEngineerDurationMul(player),
    fireTimer: 0,
    fireRate: (mini ? 0.72 : 0.56) * getEngineerFireRateMul(player),
    armTime,
    armTimeMax: armTime,
    damage: def.damage * (mini ? 0.56 : 0.84),
    range: (hasUpgrade(player, "engineer_rail_turret") ? 560 : 440) * player.rangeMul,
    rail: hasUpgrade(player, "engineer_rail_turret"),
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

function deployEngineerDrone(room, player, def, phase = 0) {
  room.hazards.push({
    id: nextHazardId++,
    type: "engineer_drone",
    ownerId: player.id,
    x: player.x + Math.cos(phase) * 68,
    y: player.y + Math.sin(phase) * 68,
    radius: 17,
    timer: (hasUpgrade(player, "engineer_legend_factory") ? 16 : 11.5) * getEngineerDurationMul(player),
    fireTimer: 0,
    fireRate: 0.46 * getEngineerFireRateMul(player),
    damage: def.damage * (hasUpgrade(player, "engineer_interceptor") ? 0.72 : 0.58),
    range: (hasUpgrade(player, "engineer_interceptor") ? 470 : 380) * player.rangeMul,
    orbitPhase: phase,
    overclockTimer: 0,
    color: classes.engineer.color,
    dead: false
  });
  addEffect(room, "shot", player.x, player.y, { color: classes.engineer.color, radius: 64, style: "drone_launch" });
}

function getEngineerDurationMul(player) {
  return (hasUpgrade(player, "engineer_reinforced_frame") ? 1.22 : 1) * (hasUpgrade(player, "engineer_legend_factory") ? 1.16 : 1);
}

function getEngineerFireRateMul(player) {
  return (hasUpgrade(player, "engineer_calibration") ? 0.86 : 1) * (hasUpgrade(player, "engineer_overclock") ? 0.92 : 1);
}

function overclockEngineerDeployables(room, player, def) {
  let boosted = 0;
  for (const hazard of room.hazards) {
    if (hazard.ownerId !== player.id || !["engineer_turret", "engineer_drone"].includes(hazard.type)) continue;
    boosted += 1;
    hazard.overclockTimer = Math.max(hazard.overclockTimer || 0, hasUpgrade(player, "engineer_overclock") ? 5.2 : 3.8);
    hazard.fireTimer = 0;
    hazard.timer += hasUpgrade(player, "engineer_legend_factory") ? 2.4 : 1.2;
    addEffect(room, "chain", hazard.x, hazard.y, { color: classes.engineer.color, radius: hazard.radius + 46, style: "engineer_overclock" });
    if (hasUpgrade(player, "engineer_legend_factory")) {
      damageEnemiesInRadius(room, player, hazard.x, hazard.y, 92 * player.areaMul, def.damage * 0.9, { slow: 0.8 });
    }
  }
  if (boosted === 0) {
    const aim = getAimVector(player);
    deployEngineerTurret(room, player, clamp(player.x + aim.x * 90, 44, room.world.w - 44), clamp(player.y + aim.y * 90, 44, room.world.h - 44), def, false);
    boosted = 1;
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
  if (hazard.fireTimer > 0) return true;
  const target = nearestEnemy(room, hazard.x, hazard.y, hazard.range || 420);
  if (!target) return true;
  const dx = target.x - hazard.x;
  const dy = target.y - hazard.y;
  const dist = Math.hypot(dx, dy) || 1;
  const speed = hazard.rail ? 840 : 700;
  room.projectiles.push({
    id: nextProjectileId++,
    ownerId: hazard.ownerId,
    classId: "engineer",
    x: hazard.x + (dx / dist) * (hazard.radius + 8),
    y: hazard.y + (dy / dist) * (hazard.radius + 8),
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    distanceLeft: hazard.range || 420,
    damage: hazard.damage * (hazard.overclockTimer > 0 ? 1.28 : 1),
    radius: hazard.rail ? 9 : 8,
    pierce: hazard.rail ? 3 : 1,
    splash: 0,
    poison: false,
    slow: 0,
    chain: 0,
    style: hazard.rail ? "rail_bolt" : "turret_bolt",
    hostile: false,
    dead: false
  });
  addEffect(room, "shot", hazard.x, hazard.y, {
    angle: Math.atan2(dy, dx),
    color: classes.engineer.color,
    radius: hazard.radius + 24,
    style: hazard.rail ? "rail_turret" : "turret_fire"
  });
  hazard.fireTimer = Math.max(0.12, (hazard.fireRate || 0.56) * (hazard.overclockTimer > 0 ? 0.52 : 1));
  return true;
}

function updateEngineerMine(room, hazard) {
  if ((hazard.armTime || 0) > 0) return true;
  const target = nearestEnemy(room, hazard.x, hazard.y, hazard.triggerRadius || hazard.radius || 80);
  if (!target) return true;
  const owner = room.players.get(hazard.ownerId);
  if (!owner) {
    hazard.dead = true;
    return true;
  }
  addEffect(room, "explosion", hazard.x, hazard.y, { color: classes.engineer.color, radius: hazard.radius, style: "shock_mine" });
  let firstHit = null;
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
    if (!firstHit) firstHit = enemy;
    enemy.slowTimer = Math.max(enemy.slowTimer, 1.7);
    const dealt = dealDamage(room, enemy, hazard.damage, hazard.ownerId, { knockback: hasUpgrade(owner, "engineer_sticky_mine") ? 120 : 80 });
    if (dealt > 0) addMeleeImpact(room, enemy, "shield_slam", 0.82);
  }
  if (hazard.chain && firstHit) {
    chainLightning(room, hazard.ownerId, firstHit, hazard.damage * 0.48, 4, {
      range: 290,
      falloff: 0.16,
      minDamageMul: 0.42
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
      room.projectiles.push({
        id: nextProjectileId++,
        ownerId: hazard.ownerId,
        classId: "engineer",
        x: hazard.x,
        y: hazard.y,
        vx: (dx / dist) * 760,
        vy: (dy / dist) * 760,
        distanceLeft: hazard.range || 360,
        damage: hazard.damage * (hazard.overclockTimer > 0 ? 1.22 : 1),
        radius: 7,
        pierce: hasUpgrade(owner, "engineer_interceptor") ? 1 : 0,
        splash: 0,
        poison: false,
        slow: 0,
        chain: 0,
        style: "drone_laser",
        hostile: false,
        dead: false
      });
      addEffect(room, "shot", hazard.x, hazard.y, {
        angle: Math.atan2(dy, dx),
        color: classes.engineer.color,
        radius: 34,
        style: "drone_laser"
      });
    }
    hazard.fireTimer = Math.max(0.1, (hazard.fireRate || 0.46) * (hazard.overclockTimer > 0 ? 0.55 : 1));
  }
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

function damageEnemiesInRadius(room, owner, x, y, radius, damage, options = {}) {
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0 || distance({ x, y }, enemy) > radius + enemy.radius) continue;
    if (options.slow) enemy.slowTimer = Math.max(enemy.slowTimer, options.slow);
    if (options.poison) {
      enemy.poisonTimer = Math.max(enemy.poisonTimer || 0, options.poison.duration || 2.6);
      enemy.poisonDps = Math.max(enemy.poisonDps || 0, options.poison.dps || 5);
      enemy.poisonOwnerId = owner.id;
    }
    if (options.burn) {
      enemy.burnTimer = Math.max(enemy.burnTimer || 0, options.burn.duration || 2.4);
      enemy.burnDps = Math.max(enemy.burnDps || 0, options.burn.dps || 6);
      enemy.burnOwnerId = owner.id;
    }
    if (options.threadMark) applyThreadMark(room, owner, enemy, options.threadMark, options.threadDuration || 6.2);
    if (options.pullTo && enemy.type !== "boss") {
      startEnemyKnockback(room, enemy, options.pullTo.x - enemy.x, options.pullTo.y - enemy.y, 72, {
        duration: 0.2,
        maxDistance: 96,
        style: "hit_knockback"
      });
    }
    const dealt = dealDamage(room, enemy, damage * (options.damageMul ? options.damageMul(enemy) : 1), owner.id, { noVulnerable: true });
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

function updateProjectiles(room, dt) {
  for (const projectile of room.projectiles) {
    if (projectile.dead) continue;
    projectileSystem.advanceProjectile(projectile, dt);

    if (projectileSystem.expireProjectileIfNeeded(projectile, room.world)) {
      continue;
    }

    if (projectile.hostile) {
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
          applyPoisonToPlayer(player, projectile.poison, projectile.poisonDuration || 3, projectile.ownerId);
        }
        projectile.dead = true;
        break;
      }
      continue;
    }

    for (const enemy of room.enemies) {
      if (enemy.hp <= 0) continue;
      if (!collisionSystem.circlesOverlap(projectile, projectile.radius, enemy, enemy.radius)) continue;

      dealDamage(room, enemy, projectile.damage, projectile.ownerId);
      applyProjectileStatus(room, projectile, enemy);
      addEffect(room, "impact", projectile.x, projectile.y, {
        color:
          projectile.poison
            ? "#9aa15f"
            : classes[projectile.classId]
              ? classes[projectile.classId].color
              : "#f8f3e9",
        radius: projectile.radius + 18,
        style: projectile.style || ""
      });

      if (projectile.splash > 0) {
        const splashColor = classes[projectile.classId]?.color || classes.mage.color;
        addEffect(room, "arcane", enemy.x, enemy.y, {
          color: splashColor,
          radius: Math.min(150, projectile.splash),
          style: projectile.classId === "alchemist" ? "alchemy_splash" : "arcane_splash"
        });
        for (const nearby of room.enemies) {
          if (nearby.id === enemy.id || nearby.hp <= 0) continue;
          if (distance(enemy, nearby) <= projectile.splash + nearby.radius) {
            dealDamage(room, nearby, projectile.damage * 0.52, projectile.ownerId);
            applyProjectileStatus(room, projectile, nearby);
          }
        }
      }

      const projectileOwner = room.players.get(projectile.ownerId);
      if (projectile.classId === "alchemist" && projectileOwner && projectile.splash > 0) {
        triggerAlchemyReactionsNear(room, projectileOwner, enemy.x, enemy.y, projectile.splash + 38, classes.alchemist);
      }
      const chainCount = (projectile.chain || 0) + (projectileOwner?.projectileChainBonus || 0);
      if (chainCount > 0) {
        chainLightning(room, projectile.ownerId, enemy, projectile.damage * 0.55, chainCount);
      }

      projectile.pierce -= 1;
      if (projectile.pierce < 0) projectile.dead = true;
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
      if (hazard.timer <= 0) hazard.dead = true;
      if (!hazard.dead) updateEngineerDrone(room, hazard, dt);
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
            enemy.burnTimer = Math.max(enemy.burnTimer || 0, 2.2);
            enemy.burnDps = Math.max(enemy.burnDps || 0, hazard.burnDps || 5);
            enemy.burnOwnerId = hazard.ownerId;
            enemy.poisonTimer = Math.max(enemy.poisonTimer || 0, 2.2);
            enemy.poisonDps = Math.max(enemy.poisonDps || 0, hazard.poisonDps || 5);
            enemy.poisonOwnerId = hazard.ownerId;
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.35);
          } else if (hazard.mode === "fire") {
            enemy.burnTimer = Math.max(enemy.burnTimer || 0, 2.4);
            enemy.burnDps = Math.max(enemy.burnDps || 0, hazard.burnDps || 6);
            enemy.burnOwnerId = hazard.ownerId;
          } else {
            enemy.poisonTimer = Math.max(enemy.poisonTimer || 0, 2.8);
            enemy.poisonDps = Math.max(enemy.poisonDps || 0, hazard.poisonDps || 5);
            enemy.poisonOwnerId = hazard.ownerId;
            enemy.slowTimer = Math.max(enemy.slowTimer || 0, 0.42);
          }
          if (
            owner &&
            hasUpgrade(owner, "alchemist_legend_philosopher") &&
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
          enemy.slowTimer = Math.max(enemy.slowTimer, hazard.poisonGarden ? 0.72 : 0.42);
          if (hazard.poisonGarden) {
            enemy.poisonTimer = Math.max(enemy.poisonTimer, 3.2);
            enemy.poisonDps = Math.max(enemy.poisonDps, 8 + room.wave * 1.05);
            enemy.poisonOwnerId = hazard.ownerId;
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

    if (hazard.type === "meteor") {
      if (hazard.timer <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          dealDamage(room, enemy, hazard.damage, hazard.ownerId, { knockback: 210 });
          enemy.burnTimer = Math.max(enemy.burnTimer, 3.2);
          enemy.burnDps = Math.max(enemy.burnDps, 12 + room.wave * 1.4);
          enemy.burnOwnerId = hazard.ownerId;
        }
        addEffect(room, "explosion", hazard.x, hazard.y, {
          color: "#f97316",
          radius: hazard.radius * 1.05,
          style: "meteor_impact"
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
        room.hazards.push({
          id: nextHazardId++,
          type: "fire_pool",
          ownerId: hazard.ownerId,
          x: hazard.x,
          y: hazard.y,
          radius: hazard.radius * (hazard.apocalypse ? 1.02 : hazard.wildfire ? 0.92 : 0.78),
          timer: hazard.apocalypse ? 6.2 : hazard.wildfire ? 5.2 : 4.2,
          tick: 0.12,
          damage: (7 + room.wave * 1.1) * (hazard.apocalypse ? 1.48 : hazard.wildfire ? 1.28 : 1),
          burnDps: (9 + room.wave * 1.45) * (hazard.apocalypse ? 1.55 : hazard.wildfire ? 1.32 : 1),
          burnTime: hazard.apocalypse ? 4.1 : hazard.wildfire ? 3.4 : 2.7,
          hostile: false,
          dead: false
        });
        hazard.dead = true;
      }
      continue;
    }

    if (hazard.type === "fire_pool") {
      hazard.tick -= dt;
      if (hazard.tick <= 0) {
        for (const enemy of room.enemies) {
          if (enemy.hp <= 0 || distance(hazard, enemy) > hazard.radius + enemy.radius) continue;
          dealDamage(room, enemy, hazard.damage, hazard.ownerId, { silent: true, element: "burn" });
          enemy.burnTimer = Math.max(enemy.burnTimer, hazard.burnTime || 2.4);
          enemy.burnDps = Math.max(enemy.burnDps, hazard.burnDps || 8);
          enemy.burnOwnerId = hazard.ownerId;
        }
        hazard.tick = 0.42;
      }
      if (hazard.timer <= 0) hazard.dead = true;
      continue;
    }
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
    const target = nearestLivingPlayer(room, orb);
    if (!target) continue;

    const dx = target.x - orb.x;
    const dy = target.y - orb.y;
    const dist = Math.hypot(dx, dy) || 1;
    const magnetRange = 185 + Math.min(95, target.level * 6);

    if (dist <= 28) {
      collectXpOrb(room, orb, target);
      continue;
    }

    if (dist <= magnetRange) {
      const speed = 210 + (1 - dist / magnetRange) * 520;
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
    if (enemy.poisonTimer > 0) {
      enemy.poisonTimer = Math.max(0, enemy.poisonTimer - dt);
      dealDamage(room, enemy, enemy.poisonDps * dt, enemy.poisonOwnerId, { silent: true });
      if (enemy.hp <= 0) continue;
    }
    if (enemy.burnTimer > 0) {
      enemy.burnTimer = Math.max(0, enemy.burnTimer - dt);
      dealDamage(room, enemy, enemy.burnDps * dt, enemy.burnOwnerId, { silent: true, element: "burn" });
      if (enemy.hp <= 0) continue;
    }

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

    if (enemy.type === "charger" && dist < 560) {
      if (!enemy.windup && enemy.chargeTimer <= 0) {
        startChargeWindup(room, enemy, target, {
          windupTime: enemy.elite ? 0.74 : 0.9,
          radius: enemy.elite ? 98 : 86,
          style: "charge_predict"
        });
      }

      if (advanceChargeWindup(room, enemy, dt)) continue;
    }

    const crowdPush = getEnemyCrowdPush(room, enemy);
    const speedMul = enemy.slowTimer > 0 ? 0.45 : 1;
    const move = getEnemyMovementVector(room, enemy, target, dx, dy, dist);

    enemy.x += (move.x * enemy.speed * speedMul + crowdPush.x) * dt;
    enemy.y += (move.y * enemy.speed * speedMul + crowdPush.y) * dt;
    enemy.x = clamp(enemy.x, 24, room.world.w - 24);
    enemy.y = clamp(enemy.y, 24, room.world.h - 24);

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
  const mix = enemy.patternMix || {};
  const specialShare = clamp((mix.special || 0.24) + (mix.punish || 0.06), 0.12, 0.42);
  const allowedCount = clamp(Math.round(specialShare * SPECIAL_PATTERN_CYCLE), 1, 4);
  const key = "bossSharedPatternStep";
  enemy[key] = ((enemy[key] || 0) % SPECIAL_PATTERN_CYCLE) + 1;
  if (isPatternMixSpecialSlot(enemy[key], allowedCount)) return true;
  deferSpecialPattern(enemy, channel);
  return false;
}

function isPatternMixSpecialSlot(step, allowedCount) {
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
    castMortarPool(room, enemy, {
      x: point.x,
      y: point.y,
      radius: cast.radius || 82,
      poolTime: 3.2,
      damage: enemy.damage * 0.18,
      poison: 1.5 + room.wave * 0.16
    });
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
  const speed = options.speed || 420;
  room.projectiles.push({
    id: nextProjectileId++,
    ownerId: enemy.id,
    classId: "enemy",
    x: enemy.x + Math.cos(angle) * (enemy.radius + 8),
    y: enemy.y + Math.sin(angle) * (enemy.radius + 8),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    distanceLeft: options.distanceLeft || 650,
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

function updateBossEnemy(room, enemy, target, dist, dt) {
  const profile = enemy.miniBoss ? getMiniBossProfile(room.floor) : getBossProfileById(enemy.bossId) || getChapterBossProfile(room.floor);

  if (enemy.miniBoss) {
    return updateMiniBossEnemy(room, enemy, target, dist, dt, profile);
  }

  const phaseTransition = getBossPhaseTransition(enemy);
  if (phaseTransition) applyBossPhaseTransition(room, enemy, profile, target, phaseTransition);

  if (enemy.bossPattern === "charge") return updateChargeBoss(room, enemy, target, dist, dt, profile);
  if (enemy.bossPattern === "summon") return updateRitualBoss(room, enemy, target, dist, dt, profile);
  if (enemy.bossPattern === "void") return updateVoidBoss(room, enemy, target, dist, dt, profile);
  return false;
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
        armTime: 1.18,
        width: 34,
        damageMul: 0.58,
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 4,
        style: "mini_duelist_cross"
      });
      bossShockwave(room, enemy, profile, 138, { armTime: 0.62 });
    } else if (pattern === "duelist_charge" && dist > 130) {
      startChargeWindup(room, enemy, target, {
        windupTime: 0.7,
        radius: 88,
        style: "boss_charge",
        color: profile.color,
        accuracyBonus: 0.08
      });
    } else {
      startMiniCleave(room, enemy, target, profile, 142, 0.45);
    }
    setSpecialPatternTimer(enemy, "miniboss", 2.75 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
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
    castBossProjectileRing(room, enemy, profile, 10, {
      speed: 330,
      damageMul: 0.42,
      radius: 8,
      poison: 1.15 + room.wave * 0.07,
      poisonDuration: 2.2,
      style: "venom_spit",
      damageType: "mini_plague_spit"
    });
  } else {
    enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * 0.075));
    enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 3.8);
    castBossBlasts(room, enemy, profile, 2, { armTimeMul: 1.08, radiusMul: 0.72 });
    addEffect(room, "shield", enemy.x, enemy.y, { color: profile.color, radius: enemy.radius + 38, style: "enemy_barrier" });
  }

  setSpecialPatternTimer(enemy, "miniboss", 3.05 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
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
      castMiniShurikenFan(room, enemy, target, profile);
      setSpecialPatternTimer(enemy, "miniboss", 2.65 * getSpecialPatternCooldownMultiplier(enemy, "miniboss"));
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
    if (pattern === "iron_cross_shock") {
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 8 : enemy.bossPhase >= 2 ? 6 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x),
        armTime: enemy.bossPhase >= 3 ? 1.08 : 1.24,
        width: enemy.bossPhase >= 3 ? 44 : 38,
        damageMul: enemy.bossPhase >= 3 ? 0.82 : 0.7,
        style: "iron_cross"
      });
      bossShockwave(room, enemy, profile, enemy.bossPhase >= 3 ? 260 : 215, {
        armTime: enemy.bossPhase >= 3 ? 1.05 : 1.18
      });
    } else if (pattern === "iron_beam_fan") {
      castBossBeamFan(room, enemy, profile, enemy.bossPhase >= 3 ? 5 : 3, Math.atan2(target.y - enemy.y, target.x - enemy.x));
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 3 : 2, { armTimeMul: 1.1, radiusMul: 0.72 });
    } else {
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : enemy.bossPhase >= 2 ? 5 : 4, {
        aroundBoss: true,
        radiusMul: enemy.bossPhase >= 3 ? 0.9 : 0.78,
        armTimeMul: 1.12
      });
      enemy.chargeTimer = Math.min(enemy.chargeTimer || 0, 0.18);
    }
    setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 3.25 : enemy.bossPhase >= 2 ? 3.65 : 4.05) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
  }
  return false;
}

function updateRitualBoss(room, enemy, target, dist, dt, profile) {
  if (enemy.specialTimer > 0) return false;
  if (!allowSpecialPatternNow(enemy, "boss")) return false;
  const pattern = nextBossPattern(enemy, profile, ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"]);
  enemy.barrier = Math.max(enemy.barrier || 0, Math.round(enemy.maxHp * (enemy.bossPhase >= 3 ? 0.1 : enemy.bossPhase >= 2 ? 0.08 : 0.058)));
  enemy.barrierTimer = Math.max(enemy.barrierTimer || 0, 5.2);
  const heal = Math.min(enemy.maxHp - enemy.hp, enemy.maxHp * (enemy.bossPhase >= 3 ? 0.032 : enemy.bossPhase >= 2 ? 0.024 : 0.016));
  if (heal > 0) {
    enemy.hp += heal;
    addEffect(room, "heal", enemy.x, enemy.y, { value: Math.round(heal), color: profile.color, radius: enemy.radius + 36 });
  }
  if (pattern === "hive_bloom_adds") {
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
    castBossProjectileRing(room, enemy, profile, enemy.bossPhase >= 3 ? 12 : 9, {
      speed: 345,
      damageMul: 0.42,
      radius: 8,
      poison: 1.15 + room.wave * 0.07,
      poisonDuration: 2.3,
      style: "venom_spit",
      damageType: "hive_venom_ring"
    });
  } else {
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
  }
  setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 3.45 : enemy.bossPhase >= 2 ? 3.85 : 4.25) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
  return false;
}

function updateVoidBoss(room, enemy, target, dist, dt, profile) {
  if (advanceBossSnipeWindup(room, enemy, dt, (cast) => {
      fireSniperProjectile(room, enemy, cast.x, cast.y);
    })) return true;

  if (enemy.specialTimer <= 0) {
    if (!allowSpecialPatternNow(enemy, "boss")) return false;
    const pattern = nextBossPattern(enemy, profile, ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"]);
    if (pattern === "void_reposition_snipe") {
      repositionVoidBoss(room, enemy, target, profile);
      castVoidSniperFan(room, enemy, target, profile, enemy.bossPhase >= 3 ? 5 : 3);
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 3 : 2, { armTimeMul: 1.12, radiusMul: 0.76 });
    } else if (pattern === "void_cross_laser") {
      castBossCrossBeams(room, enemy, profile, enemy.bossPhase >= 3 ? 6 : enemy.bossPhase >= 2 ? 5 : 4, {
        rotation: Math.atan2(target.y - enemy.y, target.x - enemy.x) + Math.PI / 4,
        armTime: enemy.bossPhase >= 3 ? 1.04 : 1.22,
        width: enemy.bossPhase >= 3 ? 46 : 38,
        damageMul: enemy.bossPhase >= 3 ? 0.78 : 0.66,
        style: "void_cross"
      });
    } else {
      castBossBlasts(room, enemy, profile, enemy.bossPhase >= 3 ? 5 : enemy.bossPhase >= 2 ? 4 : 3, { armTimeMul: 1.1, radiusMul: 0.86 });
      castBossProjectileRing(room, enemy, profile, enemy.bossPhase >= 3 ? 12 : 8, {
        speed: enemy.bossPhase >= 3 ? 460 : 410,
        damageMul: 0.44,
        radius: 7,
        style: "sniper_bolt",
        damageType: "void_ring"
      });
    }
    setSpecialPatternTimer(enemy, "boss", (enemy.bossPhase >= 3 ? 3.35 : enemy.bossPhase >= 2 ? 3.7 : 4.1) * getSpecialPatternCooldownMultiplier(enemy, "boss"));
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
    setSpecialPatternTimer(enemy, "boss_shot", (enemy.bossPhase >= 3 ? 2.95 : enemy.bossPhase >= 2 ? 3.25 : 3.55) * getSpecialPatternCooldownMultiplier(enemy, "boss_shot"));
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
  const minArmTime = enemy.miniBoss ? 1.18 : enemy.bossPhase >= 3 ? 1.42 : enemy.bossPhase >= 2 ? 1.55 : 1.68;
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

function castBossBeamFan(room, enemy, profile, count = 3, baseAngle = enemy.aiPhase || 0) {
  const beams = Math.max(1, count);
  const spread = beams <= 1 ? 0 : Math.PI * (enemy.bossPhase >= 3 ? 1.42 : enemy.bossPhase >= 2 ? 1.18 : 1.08);
  const startAngle = baseAngle - spread / 2;
  const armTime = enemy.bossPhase >= 3 ? 1.48 : enemy.bossPhase >= 2 ? 1.62 : 1.76;
  const length = enemy.bossPhase >= 3 ? 1080 : enemy.bossPhase >= 2 ? 980 : 880;
  const width = enemy.bossPhase >= 3 ? 50 : enemy.bossPhase >= 2 ? 44 : 38;

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
      damage: enemy.damage * (enemy.bossPhase >= 3 ? 1.02 : enemy.bossPhase >= 2 ? 0.88 : 0.74),
      hostile: true,
      dead: false,
      color: profile.color
    });
  }

  addEffect(room, "warning", enemy.x, enemy.y, {
    color: profile.color,
    radius: enemy.radius + 92,
    style: "boss_beam"
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

  for (let i = 0; i < spawnCount; i += 1) {
    const angle = enemy.aiPhase + (Math.PI * 2 * i) / spawnCount + Math.random() * 0.25;
    const type = profile.escorts[i % profile.escorts.length] || pickEnemyType(room.wave, room.waveTrait);
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
      damage: enemy.damage * (enemy.bossPhase >= 3 ? 0.82 : enemy.bossPhase >= 2 ? 0.7 : 0.62),
      ownerId: enemy.id,
      hostile: true,
      dead: false,
      color: profile.color
    });
    addEffect(room, "warning", x, y, { color: profile.color, radius, style: "boss_blast" });
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
  const predicted = extendChargeEndpoint(room, enemy, predictChargeTarget(room, enemy, target, tuning.speed, windupTime, accuracy), target);
  const color = options.color || enemy.color || enemyDefs.charger.color;

  enemy.windup = {
    kind: "charge",
    time: windupTime,
    duration: windupTime,
    x: predicted.x,
    y: predicted.y,
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
}

function startChargeWindupAtPoint(room, enemy, x, y, options = {}) {
  const baseWindup = options.windupTime ?? (enemy.elite ? 0.62 : 0.76);
  const windupTime = getEnemyTelegraphTime(room, enemy, "primary", baseWindup) * Math.max(0.84, enemy.cadenceMul || 1);
  const targetPoint = extendChargeEndpoint(room, enemy, { x: clamp(x, 32, room.world.w - 32), y: clamp(y, 32, room.world.h - 32) }, { x, y });
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;
  const color = options.color || enemy.color || enemyDefs.charger.color;

  enemy.windup = {
    kind: "charge",
    time: windupTime,
    duration: windupTime,
    x: targetX,
    y: targetY,
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
  const endX = clamp(windup.x, 24, room.world.w - 24);
  const endY = clamp(windup.y, 24, room.world.h - 24);
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
  enemy.x = clamp(dash.startX + (dash.x - dash.startX) * eased, 24, room.world.w - 24);
  enemy.y = clamp(dash.startY + (dash.y - dash.startY) * eased, 24, room.world.h - 24);

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
      castMortarPool(room, enemy, mortarWindup.windup);
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
    poolTime: enemy.elite ? 3.8 : 3.6,
    damage: enemy.damage * (enemy.elite ? 0.21 : 0.16),
    poison: 0.95 + room.wave * 0.12
  };
  addEffect(room, "warning", x, y, {
    color: enemyDefs.mortar.color,
    radius,
    style: "mortar_zone",
    duration: armTime
  });
  addEffect(room, "shot", enemy.x, enemy.y, {
    angle: Math.atan2(y - enemy.y, x - enemy.x),
    color: enemyDefs.mortar.color,
    radius: 42,
    style: "mortar_lob"
  });
  return true;
}

function castMortarPool(room, enemy, cast) {
  if (!cast || enemy.hp <= 0) return;
  const armTime = 0.16;
  room.hazards.push({
    id: nextHazardId++,
    type: "acid_pool",
    x: cast.x,
    y: cast.y,
    radius: cast.radius,
    timer: armTime + (cast.poolTime || 3.6),
    armTime,
    armTimeMax: armTime,
    tick: armTime + 0.32,
    damage: cast.damage,
    poison: cast.poison,
    ownerId: enemy.id,
    damageType: "acid_pool",
    hostile: true,
    dead: false
  });
  addEffect(room, "explosion", cast.x, cast.y, {
    color: enemyDefs.mortar.color,
    radius: cast.radius * 0.72,
    style: "mortar_impact"
  });
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
  enemy.windup = {
    kind: "spit",
    time: castTime,
    targetId: target.id
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
  if (enemy.type === "sniper" || (enemy.type === "stalker" && enemy.elite)) {
    return lowestHealthLivingPlayer(room) || nearestLivingPlayer(room, enemy);
  }
  return nearestLivingPlayer(room, enemy);
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
  enemy.x += (move.x * enemy.speed * speedMul + crowdPush.x) * dt;
  enemy.y += (move.y * enemy.speed * speedMul + crowdPush.y) * dt;
  enemy.x = clamp(enemy.x, 24, room.world.w - 24);
  enemy.y = clamp(enemy.y, 24, room.world.h - 24);
  return true;
}

function fireEnemyProjectile(room, enemy, target) {
  if (!canSpawnHostileProjectile(room)) return false;
  const venom = enemy.elite || enemy.affix === "venom";
  const speed = venom ? 390 : 330;
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
    distanceLeft: 620,
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
    vx: (dx / length) * (enemy.elite ? 760 : 680),
    vy: (dy / length) * (enemy.elite ? 760 : 680),
    distanceLeft: 900,
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
  return player.tauntGuardTimer > 0 ? WARRIOR_TAUNT_SIZE_SCALE : 1;
}

function getPlayerCollisionMass(player) {
  if (player.classId === "warrior") return 2.1;
  if (player.classId === "martialist") return 1.62;
  if (player.classId === "engineer") return 1.35;
  if (player.classId === "puppeteer") return 1.18;
  if (player.classId === "alchemist") return 1.16;
  if (player.classId === "assassin") return 1.04;
  if (player.classId === "cleric") return 1.45;
  return 1.25;
}

function getEnemyCollisionMass(enemy) {
  return enemySystem.getEnemyCollisionMass(enemy);
}

function movePlayerBy(room, player, dx, dy) {
  collisionSystem.moveEntityWithinWorld(player, dx, dy, room.world, 32);
}

function moveEnemyBy(room, enemy, dx, dy) {
  collisionSystem.moveEntityWithinWorld(enemy, dx, dy, room.world, 24);
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
  const inputSpeed = def.speed * (player.speedMul || 1) * (player.dashSpeedMul || 1);
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
  let finalDamage = amount;
  let critical = false;

  if (owner && !options.fixedDamage) {
    finalDamage *= owner.damageMul;
    finalDamage *= getClassDamageMultiplier(room, owner, enemy);
    if (owner.missingHpDamageBonus > 0) {
      const missingRatio = clamp(1 - owner.hp / Math.max(1, owner.maxHp), 0, 1);
      finalDamage *= 1 + missingRatio * owner.missingHpDamageBonus;
    }
    if ((enemy.elite || enemy.type === "boss") && owner.eliteDamageMul) {
      finalDamage *= owner.eliteDamageMul;
    }
    if ((owner.statusDamageMul || 1) > 1 && hasCombatStatus(enemy)) {
      finalDamage *= owner.statusDamageMul;
    }

    const lowHpCrit = owner.hp <= owner.maxHp * 0.4 ? owner.lowHpCritBonus || 0 : 0;
    const critChance = clamp((owner.crit || 0) + lowHpCrit, 0, 0.85);
    if (Math.random() < critChance) {
      finalDamage *= 1.75;
      critical = true;
    }
  }

  if (!options.fixedDamage) {
    if (enemy.affix === "bulwark") finalDamage *= 0.84;
    if (enemy.vulnerableTimer > 0) finalDamage *= 1.22;
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

  enemy.hp -= finalDamage;
  if (owner) applyClassOnHit(room, owner, enemy, finalDamage, options);
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
    if (owner) applyRelicOnKill(room, owner, enemy);
    dropXpOrb(room, enemy, ownerId);
    if (enemy.elite && enemy.affix === "volatile") explodeEliteDeath(room, enemy);
    if (enemy.type === "splitter") splitEnemy(room, enemy);
    maybeDropRelicChest(room, enemy, ownerId);
  }
  return finalDamage;
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

function hasCombatStatus(enemy) {
  return (
    enemy.slowTimer > 0 ||
    enemy.freezeTimer > 0 ||
    enemy.poisonTimer > 0 ||
    enemy.burnTimer > 0 ||
    enemy.vulnerableTimer > 0 ||
    enemy.tauntTimer > 0
  );
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
    room.xpOrbs.push({
      id: nextXpOrbId++,
      x: clamp(enemy.x + Math.cos(angle) * spread, 20, room.world.w - 20),
      y: clamp(enemy.y + Math.sin(angle) * spread, 20, room.world.h - 20),
      vx: Math.cos(angle) * (50 + Math.random() * 70),
      vy: Math.sin(angle) * (50 + Math.random() * 70),
      value,
      radius: enemy.elite || enemy.type === "boss" ? 13 : 10,
      ownerId,
      dead: false
    });
  }
}

function getClassDamageMultiplier(room, owner, enemy) {
  if (owner.classId === "warrior") {
    const closeBonus = distance(owner, enemy) <= 145 ? 1.18 : 1;
    return closeBonus * (owner.shield > 0 ? 1.07 : 1);
  }
  if (owner.classId === "ranger") {
    const dist = distance(owner, enemy);
    return dist >= 330 ? 1.28 : dist >= 220 ? 1.14 : 0.92;
  }
  if (owner.classId === "mage") {
    return enemy.slowTimer > 0 || enemy.freezeTimer > 0 || enemy.poisonTimer > 0 || enemy.burnTimer > 0 ? 1.16 : 1.04;
  }
  if (owner.classId === "engineer") {
    const nearDevice = room.hazards.some(
      (hazard) =>
        hazard.ownerId === owner.id &&
        (hazard.type === "engineer_turret" || hazard.type === "engineer_drone" || hazard.type === "engineer_mine") &&
        !hazard.dead &&
        distance(hazard, enemy) <= 260 + enemy.radius
    );
    return nearDevice ? 1.14 : 1;
  }
  if (owner.classId === "puppeteer") {
    const puppet = getActivePuppet(room, owner.id);
    return puppet && distance(puppet, enemy) <= 360 + enemy.radius ? 1.16 : 1;
  }
  if (owner.classId === "martialist") {
    const closeBonus = distance(owner, enemy) <= 155 ? 1.12 : 1;
    const comboBonus = (owner.comboCounter || 0) >= 3 ? 1.08 : 1;
    return closeBonus * comboBonus;
  }
  if (owner.classId === "alchemist") {
    return enemy.poisonTimer > 0 || enemy.burnTimer > 0 ? 1.16 : 1;
  }
  if (owner.classId === "assassin") {
    const markedBonus = isAssassinMarked(enemy, owner) ? (hasUpgrade(owner, "assassin_mark_reaper") ? 1.48 : 1.32) : 1;
    const executeBonus = enemy.hp <= enemy.maxHp * 0.34 && hasUpgrade(owner, "assassin_execution") ? 1.14 : 1;
    const stealthBonus = (owner.stealthTimer || 0) > 0 ? 1.12 : 1;
    return markedBonus * executeBonus * stealthBonus;
  }
  if (owner.classId === "cleric") {
    return owner.hp <= owner.maxHp * 0.45 ? 1.12 : 1;
  }
  return 1;
}

function applyClassOnHit(room, owner, enemy, finalDamage, options = {}) {
  if (owner.classId === "warrior" && !options.silent) {
    owner.shield = Math.min(owner.maxHp * 0.28, owner.shield + Math.max(2, finalDamage * 0.035));
    owner.shieldTimer = Math.max(owner.shieldTimer, 2.2);
  }

  if (owner.classId === "ranger" && !options.silent && !options.noVulnerable) {
    enemy.vulnerableTimer = Math.max(enemy.vulnerableTimer, distance(owner, enemy) >= 280 ? 2.2 : 1.1);
  }

  if (owner.classId === "engineer" && !options.silent) {
    if (Math.random() < 0.18) {
      owner.shield = Math.min(owner.maxHp * 0.22, owner.shield + Math.max(2, finalDamage * 0.025));
      owner.shieldTimer = Math.max(owner.shieldTimer, 1.8);
    }
  }

  if (owner.classId === "puppeteer" && !options.silent) {
    const puppet = getActivePuppet(room, owner.id);
    applyThreadMark(room, owner, enemy, puppet ? 1.35 : 1, 6.2);
    if (puppet) enemy.slowTimer = Math.max(enemy.slowTimer, 0.5);
  }

  if (owner.classId === "martialist" && !options.silent) {
    owner.comboTimer = Math.max(owner.comboTimer || 0, hasUpgrade(owner, "martial_combo_flow") ? 3.2 : 2.4);
    gainMartialChi(owner, options.chiGain || 0.65);
    if ((owner.comboCounter || 0) >= 3) {
      owner.shield = Math.min(owner.maxHp * 0.2, owner.shield + Math.max(2, finalDamage * (hasUpgrade(owner, "martial_combo_flow") ? 0.08 : 0.05)));
      owner.shieldTimer = Math.max(owner.shieldTimer, 1.8);
    }
  }

  if (owner.classId === "assassin" && !options.silent && isAssassinMarked(enemy, owner)) {
    owner.skillTimers.q = Math.max(0, owner.skillTimers.q - (hasUpgrade(owner, "assassin_quick_blade") ? 0.2 : 0.12));
  }

  if (owner.classId === "cleric" && !options.silent) {
    healLowestAllyNear(room, owner, finalDamage * 0.16, 520);
  }
}

function healLowestAllyNear(room, owner, amount, radius) {
  let target = null;
  let lowestRatio = 1;
  for (const ally of getActiveLivingPlayers(room)) {
    if (distance(owner, ally) > radius || ally.hp >= ally.maxHp) continue;
    const ratio = ally.hp / ally.maxHp;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      target = ally;
    }
  }
  if (!target) return;
  const heal = Math.max(1, amount * (owner.healingMul || 1));
  target.hp = Math.min(target.maxHp, target.hp + heal);
  addEffect(room, "heal", target.x, target.y, { value: Math.round(heal), color: classes.cleric.color });
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

function applyPoisonToPlayer(player, dps, duration, ownerId) {
  if (!isActivePlayer(player) || player.hp <= 0 || player.immunityTimer > 0) return;
  const nextDps = Math.max(0, dps || 0);
  const wasInactive = player.poisonTimer <= 0;
  const stronger = nextDps > (player.poisonDps || 0);
  player.poisonTimer = Math.max(player.poisonTimer || 0, duration || 0);
  player.poisonDps = Math.max(player.poisonDps || 0, nextDps);
  player.poisonOwnerId = ownerId;
  if (wasInactive || stronger || !player.poisonTickTimer) {
    player.poisonTickTimer = PLAYER_POISON_TICK_INTERVAL;
  }
}

function clearPlayerPoison(player) {
  player.poisonTimer = 0;
  player.poisonDps = 0;
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
  let finalDamage = Math.max(1, amount * (1 - player.armor));
  if (player.classId === "warrior") finalDamage *= 0.9;
  if (player.tauntGuardTimer > 0) {
    finalDamage *= hasUpgrade(player, "warrior_taunt_bastion") ? 0.48 : WARRIOR_TAUNT_DAMAGE_MUL;
  }
  finalDamage = capIncomingPlayerDamage(player, finalDamage, sourceEnemy, options);
  if (player.classId === "cleric" && player.hp <= player.maxHp * 0.42 && player.shield <= 0) {
    player.shield = Math.max(player.shield, (18 + player.level * 4) * (player.shieldMul || 1));
    player.shieldTimer = 3.2;
    addEffect(room, "shield", player.x, player.y, { color: classes.cleric.color, radius: 44 });
  }

  if (player.shield > 0) {
    const blocked = Math.min(player.shield, finalDamage);
    player.shield -= blocked;
    finalDamage -= blocked;
    addEffect(room, "shield", player.x, player.y, { value: Math.round(blocked), color: classes.cleric.color, radius: 42 });
  }

  if (finalDamage <= 0) return 0;
  player.hp = Math.max(0, player.hp - finalDamage);
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
      rarityBoost: profile.rarityBoost || 0,
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
      rarityBoost: round2(rewardProfile.rarityBoost || 0),
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

  const boost = dataRegistry.getAutoRelicChoiceBoost(liveChests);

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

  rewardSystem.beginRelicChoiceForPlayers(livingPlayers, (player) => pickRelics(room, player, boost));

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
      player.hp = Math.max(1, Math.floor(player.maxHp * 0.28));
      player.downedAt = 0;
    }
    if (!room.activeRisk || !room.activeRisk.noClearHeal) {
      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * (0.05 + bonusHeal * 0.55));
    }
    player.choicePending = false;
    player.choices = [];
  }

  if (isFinalStageCleared(room)) {
    if (room.floor >= MAX_CHAPTERS) {
      finishRun(room, "victory", "3챕터의 모든 스테이지를 클리어했습니다.");
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
  room.stageMap = generateStageMap(room.floor);
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
  enterMapChoice(room);
}

function getTotalStages() {
  return stageSystem.getTotalStages({ mapDepth: MAP_DEPTH, maxChapters: MAX_CHAPTERS });
}

function getClearedStageCount(room, outcome) {
  return stageSystem.getClearedStageCount(room, outcome, { mapDepth: MAP_DEPTH, maxChapters: MAX_CHAPTERS });
}

function finishRun(room, outcome, reason) {
  roomManager.prepareRoomForGameover(room);
  room.result = buildRunResult(room, outcome, reason);
  pushEvent(room, outcome === "victory" ? "런 클리어. 결산을 확인하세요." : "런 실패. 결산을 확인하세요.");
}

function buildRunResult(room, outcome, reason) {
  const players = getActivePlayers(room);
  const durationSec = room.runStartedAt ? Math.max(0, Math.round((Date.now() - room.runStartedAt) / 1000)) : 0;
  const stagesCleared = getClearedStageCount(room, outcome);
  const totalScore = players.reduce((sum, player) => sum + player.score, 0);
  const totalRelics = players.reduce((sum, player) => sum + getRelicStackInfo(player).current, 0);
  const totalRelicMax = players.reduce((sum, player) => sum + getRelicStackInfo(player).max, 0);
  const highestLevel = players.reduce((max, player) => Math.max(max, player.level), 1);

  return stateSerializer.runResultSummaryView(room, {
    outcome,
    message: reason,
    maxChapters: MAX_CHAPTERS,
    stagesCleared,
    totalStages: getTotalStages(),
    durationSec,
    totalScore,
    totalRelics,
    totalRelicMax,
    highestLevel,
    players: players.map((player) => stateSerializer.runResultPlayerView(player, {
      classLabel: getPlayerClassLabel(player),
      relicStacks: getRelicStackInfo(player)
    }))
  });
}

function pickRelics(room, player, bonusBoost = 0) {
  const boost = dataRegistry.getRelicChoiceBoost(room.activeRisk, bonusBoost);
  const eligible = relics.filter((relic) => isRelicAvailableForPlayer(relic, player));
  const pool = eligible.filter((relic) => !isRelicMaxedForPlayer(relic, player));
  const choices = weightedSampleWithoutReplacement(pool, 3, (relic) => getRelicChoiceWeight(room, relic, boost));
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
  return {
    id: relic.id,
    name: relic.name,
    text: relic.text,
    rarity: normalizeRarity(relic.rarity),
    rarityLabel: getRarityLabel(relic.rarity),
    target: relic.target || "공용",
    icon: getRelicIcon(relic.id),
    consumable: Boolean(relic.consumable),
    level,
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

function normalizeRarity(rarity) {
  return dataRegistry.normalizeRarity(rarity);
}

function getRarityLabel(rarity) {
  return dataRegistry.getRarityLabel(rarity);
}

function getRelicChoiceWeight(room, relic, boost = 0) {
  return dataRegistry.getRelicChoiceWeight(room, relic, boost, { mapDepth: MAP_DEPTH });
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

const RELIC_SCALABLE_STATS = [
  "maxHp",
  "hp",
  "damageMul",
  "rangeMul",
  "cooldownMul",
  "areaMul",
  "speedMul",
  "regen",
  "armor",
  "crit",
  "lifeSteal",
  "clearHealBonus",
  "healingMul",
  "shieldMul",
  "statusDamageMul",
  "dashCooldownMul",
  "dashDistanceMul",
  "dashDamageMul",
  "lowHpCritBonus",
  "missingHpDamageBonus",
  "onKillHeal",
  "onKillTeamHeal",
  "onKillCooldownRefund",
  "eliteDamageMul",
  "chestDropBonus",
  "thornsMul",
  "splashBonus",
  "poisonDpsBonus",
  "poisonDurationBonus"
];

function applyRelicReward(player, reward) {
  if (reward.consumable) {
    if (!dataRegistry.applyRewardEffect(player, reward, { skillSlots: SKILL_SLOTS })) reward.apply(player);
    return;
  }

  const before = {};
  for (const key of RELIC_SCALABLE_STATS) {
    before[key] = Number.isFinite(player[key]) ? player[key] : 0;
  }

  if (!dataRegistry.applyRewardEffect(player, reward, { skillSlots: SKILL_SLOTS })) reward.apply(player);

  for (const key of RELIC_SCALABLE_STATS) {
    if (!Number.isFinite(player[key])) continue;
    const previous = before[key] || 0;
    player[key] = previous + (player[key] - previous) * RELIC_EFFECT_MUL;
  }
  player.maxHp = Math.max(1, player.maxHp);
  player.hp = clamp(player.hp, 1, player.maxHp);
  player.armor = clamp(player.armor, 0, 0.65);
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
    owned.rarity = normalizeRarity(reward.rarity);
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
  if (room.stageObjective?.type === "reward" && room.relicChests.length > 0) {
    room.status = "combat";
    room.choiceDeadline = 0;
    pushEvent(room, `Reward room: ${room.relicChests.length} chest(s) left.`);
    return;
  }

  if (isStageClearReady(room)) {
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
    stageRarityBoost: rewardProfile.rarityBoost || 0,
    wave: room.wave,
    roll: Math.random()
  });
  room.killsSinceChest = drop.killsSinceChest;
  if (!drop.shouldDrop) return;

  const chest = {
    id: nextChestId++,
    x: clamp(enemy.x, 44, room.world.w - 44),
    y: clamp(enemy.y, 44, room.world.h - 44),
    radius: 24,
    rarityBoost: drop.rarityBoost,
    dead: false
  };
  room.relicChests.push(chest);
  addEffect(room, "chest", chest.x, chest.y, { color: "#facc15", radius: 54 });
  pushEvent(room, "유물 상자가 떨어졌습니다.");
}

function enterRelicChoice(room, chest) {
  chest.dead = true;
  room.status = "choice";
  room.choiceDeadline = Date.now() + RELIC_CHOICE_TIMEOUT_MS;
  room.projectiles = [];

  rewardSystem.beginRelicChoiceForPlayers(getActiveLivingPlayers(room), (player) => pickRelics(room, player, chest.rarityBoost || 0));

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
  room.projectiles = [];
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

  if (room.status === "combat" && isStageClearReady(room)) {
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
    player.armor = clamp(player.armor + ((def.armor || 0) - (previousDef.armor || 0)), 0, 0.65);
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
  pushEvent(
    room,
    options.automatic
      ? `${player.name} 님이 시간 종료로 ${chosen.name}을(를) 받았습니다.`
      : `${player.name} 님이 ${chosen.name}을(를) 선택했습니다.`
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
  const slotUnlocks = available.filter((upgrade) => upgrade.slot);
  const guaranteedSlot =
    levelRequirement <= 4 && slotUnlocks.length > 0
      ? weightedSampleWithoutReplacement(slotUnlocks, 1, (upgrade) => getSkillChoiceWeight(upgrade, levelRequirement))
      : [];
  const remainingPool = available.filter((upgrade) => !guaranteedSlot.some((choice) => choice.id === upgrade.id));
  const options = [
    ...guaranteedSlot,
    ...weightedSampleWithoutReplacement(remainingPool, 3 - guaranteedSlot.length, (upgrade) => getSkillChoiceWeight(upgrade, levelRequirement))
  ].map((upgrade) => ({
    ...upgrade,
    rarity: getSkillUpgradeRarity(upgrade),
    rarityLabel: getRarityLabel(getSkillUpgradeRarity(upgrade)),
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
  if (Number.isFinite(upgrade.minLevel) && levelRequirement < upgrade.minLevel) return false;
  if (!upgrade.requires) return true;
  return upgrade.requires.every((requiredId) => owned.has(requiredId));
}

function getSkillUpgradeRarity(upgrade) {
  return dataRegistry.getSkillUpgradeRarity(upgrade, SKILL_RARITY_OVERRIDES);
}

function getSkillChoiceWeight(upgrade, levelRequirement) {
  return dataRegistry.getSkillChoiceWeight(upgrade, levelRequirement, SKILL_RARITY_OVERRIDES);
}

function applySkillUpgrade(player, upgradeId) {
  if (upgradeId === "warrior_cleave") {
    player.areaMul *= 1.12;
    player.rangeMul *= 1.1;
  }
  if (upgradeId === "ranger_pierce") {
    player.areaMul *= 1.06;
    player.skillCooldownMul *= 0.97;
  }
  if (upgradeId === "mage_frost") player.cooldownMul *= 0.96;
  if (upgradeId === "cleric_barrier") player.maxHp += 18;
  if (upgradeId === "warrior_guardian") {
    player.maxHp += 30;
    player.hp += 30;
    player.armor = Math.min(0.55, player.armor + 0.1);
  }
  if (upgradeId === "warrior_warlord") {
    player.damageMul *= 1.15;
    player.areaMul *= 1.08;
  }
  if (upgradeId === "ranger_eagle_eye") {
    player.rangeMul *= 1.14;
    player.crit = Math.min(0.65, player.crit + 0.06);
  }
  if (upgradeId === "ranger_quickdraw") {
    player.cooldownMul *= 0.9;
    player.speedMul *= 1.06;
  }
  if (upgradeId === "mage_arcane_focus") {
    player.splashBonus += 36;
    player.rangeMul *= 1.04;
    player.skillCooldownMul *= 0.92;
  }
  if (upgradeId === "mage_storm_core") {
    player.damageMul *= 1.1;
    player.splashBonus += 18;
  }
  if (upgradeId === "warrior_taunt_bastion") {
    player.maxHp += 22;
    player.hp += 22;
    player.armor = Math.min(0.55, player.armor + 0.05);
  }
  if (upgradeId === "warrior_charge_crash") {
    player.dashDamageMul *= 1.28;
    player.dashDistanceMul *= 1.08;
    player.areaMul *= 1.04;
  }
  if (upgradeId === "warrior_charge_aftershock") {
    player.damageMul *= 1.06;
    player.areaMul *= 1.05;
  }
  if (upgradeId === "warrior_cleave_execution") {
    player.crit = Math.min(0.65, player.crit + 0.08);
  }
  if (upgradeId === "warrior_cleave_guard") {
    player.maxHp += 16;
    player.hp += 16;
  }
  if (upgradeId === "warrior_sword_reach") {
    player.rangeMul *= 1.12;
    player.areaMul *= 1.1;
  }
  if (upgradeId === "warrior_blood_heat") {
    player.cooldownMul *= 0.88;
    player.crit = Math.min(0.65, player.crit + 0.06);
  }
  if (upgradeId === "warrior_unbreakable") {
    player.maxHp += 28;
    player.hp += 28;
    player.armor = Math.min(0.55, player.armor + 0.06);
    player.dashDamageMul *= 1.08;
  }
  if (upgradeId === "warrior_vanguard_stride") {
    player.speedMul *= 1.06;
    player.dashDistanceMul *= 1.08;
  }
  if (upgradeId === "warrior_riposte") {
    player.armor = Math.min(0.55, player.armor + 0.04);
    player.thornsMul += 0.18;
  }
  if (upgradeId === "warrior_legend_colossus") {
    player.maxHp += 52;
    player.hp += 52;
    player.armor = Math.min(0.6, player.armor + 0.06);
    player.dashDamageMul *= 1.12;
  }
  if (upgradeId === "warrior_mythic_worldsplitter") {
    player.areaMul *= 1.16;
    player.damageMul *= 1.12;
    player.dashDamageMul *= 1.14;
  }
  if (upgradeId === "ranger_multishot") {
    player.damageMul *= 1.05;
  }
  if (upgradeId === "ranger_bodkin") {
    player.areaMul *= 1.08;
    player.skillCooldownMul *= 0.96;
    player.damageMul *= 1.04;
  }
  if (upgradeId === "ranger_trap_barbs") {
    player.areaMul *= 1.1;
    player.skillCooldownMul *= 0.97;
  }
  if (upgradeId === "ranger_poison_focus") {
    player.statusDamageMul *= 1.12;
  }
  if (upgradeId === "ranger_kiting") {
    player.speedMul *= 1.08;
    player.dashCooldownMul *= 0.88;
    player.dashDistanceMul *= 1.08;
  }
  if (upgradeId === "ranger_execution") {
    player.crit = Math.min(0.65, player.crit + 0.07);
    player.eliteDamageMul *= 1.16;
  }
  if (upgradeId === "ranger_focus_fire") {
    player.damageMul *= 1.08;
    player.rangeMul *= 1.08;
  }
  if (upgradeId === "ranger_soft_spot") {
    player.statusDamageMul *= 1.14;
  }
  if (upgradeId === "ranger_double_step") {
    player.dashDistanceMul *= 1.12;
    player.dashCooldownMul *= 0.9;
  }
  if (upgradeId === "ranger_legend_storm_quiver") {
    player.rangeMul *= 1.12;
    player.crit = Math.min(0.7, player.crit + 0.06);
  }
  if (upgradeId === "ranger_mythic_plague_garden") {
    player.statusDamageMul *= 1.24;
    player.areaMul *= 1.12;
  }
  if (upgradeId === "mage_absolute_zero") {
    player.areaMul *= 1.08;
  }
  if (upgradeId === "mage_frost_shatter") {
    player.statusDamageMul *= 1.12;
  }
  if (upgradeId === "mage_wildfire") {
    player.areaMul *= 1.08;
    player.statusDamageMul *= 1.08;
  }
  if (upgradeId === "mage_twin_meteor") {
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "mage_chain_overload") {
    player.damageMul *= 1.06;
    player.skillCooldownMul *= 0.96;
    player.rangeMul *= 1.06;
  }
  if (upgradeId === "mage_chain_anchor") {
    player.rangeMul *= 1.08;
  }
  if (upgradeId === "mage_starlance") {
    player.rangeMul *= 1.12;
    player.damageMul *= 1.08;
  }
  if (upgradeId === "mage_mana_surge") {
    player.skillCooldownMul *= 0.88;
  }
  if (upgradeId === "mage_orbit_expansion") {
    player.splashBonus += 34;
    player.rangeMul *= 1.08;
  }
  if (upgradeId === "mage_ember_skin") {
    player.statusDamageMul *= 1.12;
    player.maxHp += 14;
    player.hp += 14;
  }
  if (upgradeId === "mage_quick_cast") {
    player.cooldownMul *= 0.92;
    player.skillCooldownMul *= 0.94;
  }
  if (upgradeId === "mage_legend_supercell") {
    player.statusDamageMul *= 1.16;
    player.skillCooldownMul *= 0.94;
  }
  if (upgradeId === "mage_mythic_apocalypse") {
    player.areaMul *= 1.14;
    player.skillCooldownMul *= 0.9;
    player.statusDamageMul *= 1.12;
  }
  if (upgradeId === "engineer_turret") {
    player.rangeMul *= 1.04;
  }
  if (upgradeId === "engineer_mine") {
    player.areaMul *= 1.04;
  }
  if (upgradeId === "engineer_drone") {
    player.skillCooldownMul *= 0.98;
  }
  if (upgradeId === "engineer_calibration") {
    player.skillCooldownMul *= 0.9;
    player.cooldownMul *= 0.94;
  }
  if (upgradeId === "engineer_reinforced_frame") {
    player.maxHp += 22;
    player.hp += 22;
    player.armor = Math.min(0.55, player.armor + 0.05);
  }
  if (upgradeId === "engineer_twin_turret") {
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "engineer_rail_turret") {
    player.rangeMul *= 1.08;
    player.damageMul *= 1.04;
  }
  if (upgradeId === "engineer_chain_mine") {
    player.statusDamageMul *= 1.08;
  }
  if (upgradeId === "engineer_sticky_mine") {
    player.areaMul *= 1.1;
  }
  if (upgradeId === "engineer_drone_swarm") {
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "engineer_interceptor") {
    player.maxHp += 14;
    player.hp += 14;
    player.shieldMul *= 1.08;
  }
  if (upgradeId === "engineer_overclock") {
    player.damageMul *= 1.06;
    player.skillCooldownMul *= 0.94;
  }
  if (upgradeId === "engineer_legend_factory") {
    player.skillCooldownMul *= 0.92;
    player.rangeMul *= 1.08;
  }
  if (upgradeId === "engineer_mythic_singularity_core") {
    player.areaMul *= 1.14;
    player.damageMul *= 1.1;
  }
  if (upgradeId === "puppeteer_puppet") {
    player.areaMul *= 1.03;
  }
  if (upgradeId === "puppeteer_bind") {
    player.rangeMul *= 1.05;
  }
  if (upgradeId === "puppeteer_swap") {
    player.skillCooldownMul *= 0.98;
  }
  if (upgradeId === "puppeteer_fine_thread") {
    player.rangeMul *= 1.12;
    player.crit = Math.min(0.65, player.crit + 0.05);
  }
  if (upgradeId === "puppeteer_soul_stitch") {
    player.maxHp += 18;
    player.hp += 18;
    player.regen += 0.16;
  }
  if (upgradeId === "puppeteer_razor_puppet") {
    player.damageMul *= 1.05;
  }
  if (upgradeId === "puppeteer_guard_puppet") {
    player.armor = Math.min(0.55, player.armor + 0.04);
    player.shieldMul *= 1.08;
  }
  if (upgradeId === "puppeteer_thread_saw") {
    player.areaMul *= 1.08;
  }
  if (upgradeId === "puppeteer_cross_bind") {
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "puppeteer_backstage") {
    player.dashCooldownMul *= 0.92;
    player.speedMul *= 1.04;
  }
  if (upgradeId === "puppeteer_finale") {
    player.eliteDamageMul *= 1.12;
  }
  if (upgradeId === "puppeteer_dual_cast") {
    player.skillCooldownMul *= 0.9;
    player.damageMul *= 1.05;
  }
  if (upgradeId === "puppeteer_legend_twin_souls") {
    player.statusDamageMul *= 1.12;
    player.areaMul *= 1.06;
  }
  if (upgradeId === "puppeteer_mythic_grand_theater") {
    player.damageMul *= 1.12;
    player.areaMul *= 1.12;
  }
  if (upgradeId === "martial_palm") {
    player.areaMul *= 1.04;
  }
  if (upgradeId === "martial_rising") {
    player.dashDamageMul *= 1.08;
    player.dashDistanceMul *= 1.04;
  }
  if (upgradeId === "martial_focus") {
    player.maxHp += 12;
    player.hp += 12;
    player.shieldMul *= 1.06;
  }
  if (upgradeId === "martial_combo_flow") {
    player.cooldownMul *= 0.9;
    player.crit = Math.min(0.65, player.crit + 0.04);
  }
  if (upgradeId === "martial_iron_body") {
    player.maxHp += 22;
    player.hp += 22;
    player.armor = Math.min(0.55, player.armor + 0.045);
  }
  if (upgradeId === "martial_afterimage") {
    player.dashCooldownMul *= 0.88;
    player.speedMul *= 1.05;
  }
  if (upgradeId === "martial_dragon_pulse") {
    player.areaMul *= 1.12;
    player.damageMul *= 1.06;
  }
  if (upgradeId === "martial_counter") {
    player.armor = Math.min(0.55, player.armor + 0.03);
    player.thornsMul += 0.14;
  }
  if (upgradeId === "martial_palm_breaker") {
    player.areaMul *= 1.06;
    player.damageMul *= 1.04;
  }
  if (upgradeId === "martial_rising_chain") {
    player.dashDamageMul *= 1.14;
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "martial_focus_guard") {
    player.maxHp += 16;
    player.hp += 16;
    player.shieldMul *= 1.12;
  }
  if (upgradeId === "martial_legend_dragon_soul") {
    player.damageMul *= 1.1;
    player.areaMul *= 1.08;
  }
  if (upgradeId === "martial_mythic_infinite_combo") {
    player.cooldownMul *= 0.86;
    player.skillCooldownMul *= 0.92;
    player.crit = Math.min(0.65, player.crit + 0.06);
  }
  if (upgradeId === "alchemist_acid") {
    player.statusDamageMul *= 1.08;
    player.areaMul *= 1.04;
  }
  if (upgradeId === "alchemist_fire") {
    player.damageMul *= 1.05;
  }
  if (upgradeId === "alchemist_elixir") {
    player.regen += 0.18;
    player.shieldMul *= 1.06;
  }
  if (upgradeId === "alchemist_bigger_bottle") {
    player.areaMul *= 1.1;
    player.splashBonus += 18;
  }
  if (upgradeId === "alchemist_fast_mix") {
    player.skillCooldownMul *= 0.9;
    player.cooldownMul *= 0.95;
  }
  if (upgradeId === "alchemist_corrosive") {
    player.statusDamageMul *= 1.14;
  }
  if (upgradeId === "alchemist_chain_reaction") {
    player.damageMul *= 1.05;
  }
  if (upgradeId === "alchemist_panacea") {
    player.healingMul *= 1.12;
    player.shieldMul *= 1.12;
  }
  if (upgradeId === "alchemist_acid_storm") {
    player.areaMul *= 1.06;
    player.statusDamageMul *= 1.08;
  }
  if (upgradeId === "alchemist_fire_sea") {
    player.areaMul *= 1.06;
    player.damageMul *= 1.06;
  }
  if (upgradeId === "alchemist_elixir_cloud") {
    player.healingMul *= 1.08;
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "alchemist_legend_philosopher") {
    player.statusDamageMul *= 1.16;
    player.splashBonus += 24;
  }
  if (upgradeId === "alchemist_mythic_homunculus_mix") {
    player.skillCooldownMul *= 0.88;
    player.areaMul *= 1.1;
  }
  if (upgradeId === "assassin_mark") {
    player.crit = Math.min(0.65, player.crit + 0.03);
  }
  if (upgradeId === "assassin_lunge") {
    player.dashDamageMul *= 1.12;
  }
  if (upgradeId === "assassin_smoke") {
    player.dashCooldownMul *= 0.94;
  }
  if (upgradeId === "assassin_quick_blade") {
    player.cooldownMul *= 0.88;
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "assassin_deep_cut") {
    player.crit = Math.min(0.65, player.crit + 0.06);
    player.damageMul *= 1.04;
  }
  if (upgradeId === "assassin_execution") {
    player.eliteDamageMul *= 1.14;
    player.lowHpCritBonus += 0.07;
  }
  if (upgradeId === "assassin_shadowstep") {
    player.dashCooldownMul *= 0.86;
    player.dashDistanceMul *= 1.08;
  }
  if (upgradeId === "assassin_fan") {
    player.areaMul *= 1.08;
    player.damageMul *= 1.04;
  }
  if (upgradeId === "assassin_mark_reaper") {
    player.crit = Math.min(0.65, player.crit + 0.04);
    player.eliteDamageMul *= 1.06;
  }
  if (upgradeId === "assassin_lunge_reset") {
    player.dashDamageMul *= 1.12;
    player.skillCooldownMul *= 0.96;
  }
  if (upgradeId === "assassin_smoke_bomb") {
    player.dashCooldownMul *= 0.92;
    player.speedMul *= 1.04;
  }
  if (upgradeId === "assassin_legend_nightfall") {
    player.damageMul *= 1.12;
    player.crit = Math.min(0.65, player.crit + 0.04);
  }
  if (upgradeId === "assassin_mythic_death_blossom") {
    player.damageMul *= 1.12;
    player.areaMul *= 1.08;
    player.lowHpCritBonus += 0.06;
  }
  if (upgradeId === "cleric_devotion") {
    player.maxHp += 24;
    player.hp += 24;
    player.healingMul *= 1.08;
    player.shieldMul *= 1.1;
  }
  if (upgradeId === "cleric_grace") {
    player.skillCooldownMul *= 0.88;
    player.regen += 0.7;
  }
}

function riskView(risk) {
  const { id, name, text } = risk;
  return { id, name, text };
}

function waveTraitView(trait) {
  const { id, name, text } = trait || waveTraits.horde;
  return { id, name, text };
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
      : player.classId === "cleric"
        ? 240 * player.areaMul
      : player.classId === "martialist"
        ? 176 * player.areaMul
      : player.classId === "alchemist"
        ? 128 * player.areaMul + player.splashBonus
      : player.classId === "assassin"
        ? 168 * player.areaMul
      : player.classId === "mage"
        ? 70 * player.areaMul
        : player.classId === "engineer"
          ? (hasUpgrade(player, "engineer_sticky_mine") ? 122 : 98) * player.areaMul
          : player.classId === "puppeteer"
            ? (hasUpgrade(player, "puppeteer_finale") ? 178 : 132) * player.areaMul
          : hasUpgrade(player, "ranger_trap")
            ? (hasUpgrade(player, "ranger_trap_barbs") ? 186 : 150) * player.areaMul * (hasUpgrade(player, "ranger_mythic_plague_garden") ? 1.1 : 1)
            : 0;
  const blastRadius = player.classId === "mage" ? 62 * player.areaMul + player.splashBonus : player.splashBonus;
  return {
    damage: Math.round(def.damage * player.damageMul),
    crit: round2(player.crit * 100),
    armor: round2(player.armor * 100),
    moveSpeed: Math.round(def.speed * player.speedMul),
    attackRange: Math.round(attackRange),
    areaRadius: Math.round(areaRadius),
    blastRadius: Math.round(blastRadius),
    attackCooldown: round2(def.attackCd * player.cooldownMul),
    skillCooldownMax: round2(def.skillCd * player.skillCooldownMul),
    dashCooldownMax: round2(getDashCooldown(player)),
    dashDistance: Math.round(getDashDistance(player)),
    regen: round2(player.regen),
    lifeSteal: round2(player.lifeSteal * 100)
  };
}

function getPlayerClassLabel(player) {
  return playerSystem.getPlayerClassLabel(player, classes);
}

function getClassPassiveView(player) {
  return playerSystem.getClassPassiveView(player);
}

function getNextAdvancementLevel(player) {
  return ADVANCEMENT_LEVELS.find((level) => !player.claimedAdvancementLevels.includes(level)) || null;
}

function getSkillSlots(player) {
  return stateSerializer.skillSlotViews(player, SKILL_SLOTS, {
    getUnlockedSlotUpgrade,
    getSkillCooldown,
    getPrimarySkillName,
    getSkillIcon
  });
}

function getPrimarySkillName(player) {
  if (player.classId === "warrior") return "강철 회오리";
  if (player.classId === "ranger") return "연발 사격";
  if (player.classId === "mage") return "별빛 폭발";
  if (player.classId === "engineer") return "과부하";
  if (player.classId === "puppeteer") return "인형극";
  if (player.classId === "martialist") return "연환권";
  if (player.classId === "alchemist") return "촉매 폭탄";
  if (player.classId === "assassin") return "칼날 난무";
  if (player.classId === "cleric") return "새벽의 원";
  return "응급 전투술";
}

function skillUpgradeName(upgradeId) {
  for (const upgrades of Object.values(skillUpgrades)) {
    const found = upgrades.find((upgrade) => upgrade.id === upgradeId);
    if (found) return found.name;
  }
  return upgradeId;
}

function skillChoiceView(choice) {
  const rarity = getSkillUpgradeRarity(choice);
  return {
    ...choice,
    rarity,
    rarityLabel: getRarityLabel(rarity),
    icon: getSkillIcon(choice.id)
  };
}

function getSkillIcon(id) {
  return skillIcons[id] || "기";
}

function rarityScore(rarity) {
  return RARITY_META[normalizeRarity(rarity)]?.score || 1;
}

function applyProjectileStatus(room, projectile, enemy) {
  if (projectile.poison) {
    const poisonDuration = 3.5 + (projectile.poisonDurationBonus || 0);
    const poisonDps = 9 + room.wave * 1.55 + (projectile.poisonDpsBonus || 0);
    enemy.poisonTimer = Math.max(enemy.poisonTimer, poisonDuration);
    enemy.poisonDps = Math.max(enemy.poisonDps, poisonDps);
    enemy.poisonOwnerId = projectile.ownerId;
    addEffect(room, "poison", enemy.x, enemy.y, { color: "#9aa15f", radius: enemy.radius + 10 });
    if (projectile.poisonCloud) {
      addEffect(room, "poison", enemy.x, enemy.y, {
        color: "#9aa15f",
        radius: enemy.radius + 74,
        style: "poison_cloud"
      });
      for (const nearby of room.enemies) {
        if (nearby.id === enemy.id || nearby.hp <= 0) continue;
        if (distance(enemy, nearby) > 92 + nearby.radius) continue;
        nearby.poisonTimer = Math.max(nearby.poisonTimer, poisonDuration * 0.72);
        nearby.poisonDps = Math.max(nearby.poisonDps, poisonDps * 0.62);
        nearby.poisonOwnerId = projectile.ownerId;
      }
    }
  }
  if (projectile.slow) {
    enemy.slowTimer = Math.max(enemy.slowTimer, projectile.slow);
    addEffect(room, "slow", enemy.x, enemy.y, { color: "#93c5fd", radius: enemy.radius + 12 });
  }
}

function chainLightning(room, ownerId, source, damage, jumps, options = {}) {
  const owner = room.players.get(ownerId);
  const supercell = owner && hasUpgrade(owner, "mage_legend_supercell");
  let current = source;
  const hit = new Set([source.id]);
  const range = options.range || 230;
  const falloff = options.falloff ?? 0.18;
  const minDamageMul = options.minDamageMul ?? 0.28;
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
      color: classes.mage.color,
      radius: best,
      fromX: round2(current.x),
      fromY: round2(current.y),
      toX: round2(next.x),
      toY: round2(next.y),
      style: "chain_lightning"
    });
    if (supercell) {
      next.slowTimer = Math.max(next.slowTimer, 1.25);
    }
    dealDamage(room, next, damage * Math.max(minDamageMul, 1 - i * falloff) * (supercell && next.freezeTimer > 0 ? 1.22 : 1), ownerId);
    current = next;
  }
}

function hasUpgrade(player, upgradeId) {
  return player.skillUpgrades.includes(upgradeId);
}

function nearestDownedPlayer(room, point, maxDistance) {
  let best = null;
  let bestDistance = maxDistance;
  for (const player of room.players.values()) {
    if (!isActivePlayer(player) || player.hp > 0) continue;
    const current = distance(point, player);
    if (current < bestDistance) {
      best = player;
      bestDistance = current;
    }
  }
  return best;
}

function distanceToSegment(point, ax, ay, bx, by) {
  return collisionSystem.distanceToSegment(point, ax, ay, bx, by);
}

function addEffect(room, kind, x, y, data = {}) {
  room.effects.push({
    id: nextEffectId++,
    kind,
    x: round2(x),
    y: round2(y),
    ...data
  });
  if (room.effects.length > 80) room.effects.splice(0, room.effects.length - 80);
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
  const lateLevel = Math.max(0, level - 8);
  const required = 170 + level * 86 + level * level * 15 + lateLevel * lateLevel * 40;
  return Math.round(required / 5) * 5;
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
    waveTrait: waveTraitView(room.waveTrait || waveTraits.horde),
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
      chapterProfile: chapterStageProfileView(roomIdentity.floor),
      status: roomIdentity.status,
      hostId: roomIdentity.hostId,
      hostName: roomIdentity.hostName,
      canStart: roomCapabilities.canStart,
      canReturnLobby: roomCapabilities.canReturnLobby,
      readyCount: roomPopulation.readyCount,
      allReady: roomPopulation.allReady,
      canChooseRisk: roomStageSummary.canChooseRisk,
      riskChoices: roomStageSummary.riskChoices,
      activeRisk: roomStageSummary.activeRisk,
      stageModifier: roomStageSummary.stageModifier,
      waveTrait: roomStageSummary.waveTrait,
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
      restartIn: roomTimers.restartIn,
      result: room.status === "gameover" ? room.result : null,
      clearSummary: clearSummaryView(room.clearSummary)
    },
    players: [...room.players.values()].map((player) => {
      const relicStacks = getRelicStackInfo(player);
      const identityView = stateSerializer.playerIdentityView(player, {
        classDef: classes[player.classId],
        classLabel: getPlayerClassLabel(player),
        passive: getClassPassiveView(player)
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
        skillUpgradeName,
        skillChoiceView
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
        passive: identityView.passive,
        icon: identityView.icon,
        color: identityView.color,
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
        hitIFrameTime: vitalsView.hitIFrameTime,
        sizeScale: vitalsView.sizeScale,
        tauntGuardTime: vitalsView.tauntGuardTime,
        statusEffects: getPlayerStatusEffects(player),
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
        knockbackMove: stateSerializer.movementView(player.knockbackMove)
      };
    }),
    enemies: stateSerializer.enemyViews(room.enemies, {
      enemyDefs,
      getAiState: getEnemyAiState,
      getStatusEffects: getEnemyStatusEffects,
      getWindupChannel: getEnemyWindupChannel
    }),
    projectiles: stateSerializer.projectileViews(room.projectiles),
    hazards: stateSerializer.hazardViews(room.hazards),
    relicChests: stateSerializer.relicChestViews(room.relicChests),
    xpOrbs: stateSerializer.xpOrbViews(room.xpOrbs || []),
    choices: self && self.choicePending ? self.choices : [],
    skillChoices: self ? self.pendingSkillChoices.map(skillChoiceView) : [],
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

function round2(value) {
  return Math.round(value * 100) / 100;
}

server.listen(PORT, () => {
  console.log(`로그라이크 RPG 실행 중: http://localhost:${PORT}`);
});
