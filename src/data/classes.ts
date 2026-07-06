export const SKILL_SLOTS = ["q", "e", "r", "f"] as const;

export type SkillSlot = (typeof SKILL_SLOTS)[number];

export const CLASS_IDS = [
  "novice",
  "warrior",
  "ranger",
  "mage",
  "engineer",
  "puppeteer",
  "martialist",
  "alchemist",
  "assassin",
  "cleric",
] as const;

export type ClassId = (typeof CLASS_IDS)[number];

export const STARTING_CLASS_IDS = [
  "warrior",
  "ranger",
  "mage",
  "engineer",
  "puppeteer",
  "martialist",
  "alchemist",
  "assassin",
] as const satisfies readonly ClassId[];

export const BOT_CLASS_ROTATION = STARTING_CLASS_IDS;

export interface ClassDefinition {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly maxHp: number;
  readonly speed: number;
  readonly damage: number;
  readonly range: number;
  readonly attackCd: number;
  readonly skillCd: number;
  readonly projectileSpeed: number;
  readonly armor: number;
  readonly crit: number;
  readonly regen: number;
}

export interface DashProfile {
  readonly cooldown: number;
  readonly distance: number;
  readonly style: string;
  readonly charges?: number;
  readonly chainCooldown?: number;
}

export const CLASS_DEFINITIONS = {
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
    regen: 0.25,
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
    regen: 0.2,
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
    regen: 0.2,
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
    regen: 0.2,
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
    regen: 0.22,
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
    regen: 0.2,
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
    regen: 0.24,
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
    regen: 0.2,
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
    regen: 0.18,
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
    regen: 0.65,
  },
} as const satisfies Record<ClassId, ClassDefinition>;

export const DASH_PROFILES = {
  novice: { cooldown: 1.05, distance: 178, style: "player_dash" },
  warrior: { cooldown: 1.35, distance: 146, style: "warrior_dash" },
  ranger: { cooldown: 1.15, distance: 154, style: "ranger_dash", charges: 2, chainCooldown: 0.16 },
  mage: { cooldown: 1.55, distance: 206, style: "mage_blink" },
  engineer: { cooldown: 1.28, distance: 166, style: "engineer_dash" },
  puppeteer: { cooldown: 1.22, distance: 168, style: "puppet_step" },
  martialist: { cooldown: 1.05, distance: 168, style: "martial_dash", charges: 2, chainCooldown: 0.18 },
  alchemist: { cooldown: 1.28, distance: 164, style: "alchemist_dash" },
  assassin: { cooldown: 0.95, distance: 190, style: "shadow_dash", charges: 2, chainCooldown: 0.14 },
  cleric: { cooldown: 1.75, distance: 164, style: "cleric_pulse" },
} as const satisfies Record<ClassId, DashProfile>;

export function getClassDefinition(classId: string): ClassDefinition {
  return CLASS_DEFINITIONS[isClassId(classId) ? classId : "novice"];
}

export function getDashProfile(classId: string): DashProfile {
  return DASH_PROFILES[isClassId(classId) ? classId : "novice"];
}

export function isClassId(classId: string): classId is ClassId {
  return Object.prototype.hasOwnProperty.call(CLASS_DEFINITIONS, classId);
}

export function isStartingClassId(classId: string): classId is (typeof STARTING_CLASS_IDS)[number] {
  return (STARTING_CLASS_IDS as readonly string[]).includes(classId);
}
