import { BLOCKADE_RUNNER_TYPES } from "./stages";

export const ENEMY_TYPES = [
  "training_dummy",
  "slime",
  "bat",
  "brute",
  "guardian",
  "shaman",
  "spitter",
  "bomber",
  "charger",
  "splitter",
  "splinter",
  "runner",
  "runner_tank",
  "runner_fast",
  "stalker",
  "mortar",
  "sniper",
  "boss",
] as const;

export type EnemyType = (typeof ENEMY_TYPES)[number];

export interface EnemyDefinition {
  readonly label: string;
  readonly color: string;
  readonly hp: number;
  readonly speed: number;
  readonly damage: number;
  readonly radius: number;
  readonly xp: number;
  readonly role?: string;
}

export const ENEMY_DEFINITIONS = {
  training_dummy: {
    label: "훈련 표적",
    color: "#d6b76d",
    hp: 360,
    speed: 0,
    damage: 0,
    radius: 28,
    xp: 0,
    role: "dummy",
  },
  slime: {
    label: "슬라임",
    color: "#7fa671",
    hp: 50,
    speed: 94,
    damage: 12,
    radius: 18,
    xp: 14,
  },
  bat: {
    label: "박쥐",
    color: "#7e9fb2",
    hp: 32,
    speed: 166,
    damage: 9,
    radius: 14,
    xp: 12,
  },
  brute: {
    label: "투사",
    color: "#c85d56",
    hp: 138,
    speed: 70,
    damage: 23,
    radius: 25,
    xp: 32,
  },
  guardian: {
    label: "수호자",
    color: "#64748b",
    hp: 185,
    speed: 64,
    damage: 15,
    radius: 32,
    xp: 40,
    role: "tank",
  },
  shaman: {
    label: "주술사",
    color: "#6ba79e",
    hp: 92,
    speed: 78,
    damage: 12,
    radius: 20,
    xp: 35,
    role: "healer",
  },
  spitter: {
    label: "침 뱉는 괴물",
    color: "#9aa15f",
    hp: 68,
    speed: 90,
    damage: 7,
    radius: 17,
    xp: 27,
    role: "ranged",
  },
  bomber: {
    label: "자폭병",
    color: "#c85d56",
    hp: 60,
    speed: 138,
    damage: 30,
    radius: 18,
    xp: 30,
    role: "bomber",
  },
  charger: {
    label: "돌진병",
    color: "#caa35a",
    hp: 104,
    speed: 96,
    damage: 17,
    radius: 22,
    xp: 34,
    role: "charger",
  },
  splitter: {
    label: "분열체",
    color: "#b98243",
    hp: 88,
    speed: 104,
    damage: 14,
    radius: 23,
    xp: 30,
    role: "splitter",
  },
  splinter: {
    label: "파편체",
    color: "#c9824c",
    hp: 24,
    speed: 156,
    damage: 9,
    radius: 11,
    xp: 4,
    role: "swarm",
  },
  runner: {
    label: "Runner",
    color: "#b98243",
    hp: 46,
    speed: 118,
    damage: 0,
    radius: 16,
    xp: 8,
    role: "runner",
  },
  runner_tank: {
    label: "Bulky Runner",
    color: "#64748b",
    hp: 128,
    speed: 66,
    damage: 0,
    radius: 25,
    xp: 12,
    role: "runner",
  },
  runner_fast: {
    label: "Swift Runner",
    color: "#7fa671",
    hp: 34,
    speed: 176,
    damage: 0,
    radius: 14,
    xp: 9,
    role: "runner",
  },
  stalker: {
    label: "암살자",
    color: "#8d7cae",
    hp: 62,
    speed: 142,
    damage: 16,
    radius: 18,
    xp: 32,
    role: "assassin",
  },
  mortar: {
    label: "포격수",
    color: "#7e9fb2",
    hp: 106,
    speed: 62,
    damage: 10,
    radius: 22,
    xp: 38,
    role: "artillery",
  },
  sniper: {
    label: "저격수",
    color: "#d6d0c4",
    hp: 64,
    speed: 88,
    damage: 10,
    radius: 17,
    xp: 34,
    role: "sniper",
  },
  boss: {
    label: "문지기",
    color: "#b98243",
    hp: 690,
    speed: 84,
    damage: 34,
    radius: 42,
    xp: 120,
  },
} as const satisfies Record<EnemyType, EnemyDefinition>;

export const BASIC_ENEMY_TYPES = ["slime", "bat", "brute"] as const satisfies readonly EnemyType[];

export const RANGED_PRESSURE_ENEMY_TYPES = ["spitter", "sniper", "mortar", "boss"] as const satisfies readonly EnemyType[];

export interface WeightedEnemyType {
  readonly type: EnemyType;
  readonly weight: number;
  readonly minWave?: number;
}

export const BASIC_ENEMY_WEIGHTS_BY_TRAIT = {
  horde: [
    { type: "bat", weight: 0.42 },
    { type: "slime", weight: 0.38 },
    { type: "brute", weight: 0.2 },
  ],
  bulwark: [
    { type: "brute", weight: 0.38 },
    { type: "slime", weight: 0.34 },
    { type: "bat", weight: 0.28 },
  ],
  boss_gate: [
    { type: "brute", weight: 0.34 },
    { type: "slime", weight: 0.36 },
    { type: "bat", weight: 0.3 },
  ],
  default: [
    { type: "slime", weight: 0.42 },
    { type: "bat", weight: 0.34 },
    { type: "brute", weight: 0.24 },
  ],
} as const satisfies Record<string, readonly WeightedEnemyType[]>;

export const DEFENSE_ENEMY_WEIGHTS = [
  { type: "slime", weight: 0.24 },
  { type: "bat", weight: 0.2 },
  { type: "brute", weight: 0.18 },
  { type: "bomber", weight: 0.12, minWave: 2 },
  { type: "splitter", weight: 0.1, minWave: 2 },
  { type: "guardian", weight: 0.08, minWave: 3 },
  { type: "charger", weight: 0.05, minWave: 7 },
] as const satisfies readonly WeightedEnemyType[];

export function isEnemyType(type: string): type is EnemyType {
  return Object.prototype.hasOwnProperty.call(ENEMY_DEFINITIONS, type);
}

export function getEnemyDefinition(type: string): EnemyDefinition {
  return ENEMY_DEFINITIONS[isEnemyType(type) ? type : "slime"];
}

export function isBasicEnemyType(type: string): type is (typeof BASIC_ENEMY_TYPES)[number] {
  return (BASIC_ENEMY_TYPES as readonly string[]).includes(type);
}

export function isRangedPressureEnemyType(type: string): type is (typeof RANGED_PRESSURE_ENEMY_TYPES)[number] {
  return (RANGED_PRESSURE_ENEMY_TYPES as readonly string[]).includes(type);
}

export function isEnemyTypeUnlocked(type: string, wave: number): boolean {
  if ((BLOCKADE_RUNNER_TYPES as readonly string[]).includes(type)) return true;
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
