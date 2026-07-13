export const SAVE_VERSION = 3;
export const PROGRESS_KEY = "rogue-party.progress.v3";
export const LEGACY_PROGRESS_KEYS = ["rogue-party.progress.v2", "rogue-party.progress.v1"] as const;
export const CLASS_IDS = ["warrior", "ranger", "mage", "engineer", "puppeteer", "martialist", "alchemist", "assassin"] as const;
export const MASTERY_NODE_IDS = ["attack", "survival", "speed", "special"] as const;
export const MAX_ASCENSION_LEVEL = 25;

export type MasteryNodeId = (typeof MASTERY_NODE_IDS)[number];

export interface ProgressCurrencies {
  abyssShards: number;
  enhancementStones: number;
  reforgingDust: number;
  bossEssence: number;
}

export interface AccountProgress {
  level: number;
  xp: number;
}

export interface MasteryEntry {
  points: number;
  nodes: Record<MasteryNodeId, number>;
}

export type MasteryMap = Record<string, MasteryEntry>;

export interface ProgressRecords {
  highestAbyssDepth: number;
  highestAscension: number;
  lastRunKey: string | null;
  dailyBest: Record<string, number>;
  weeklyBest: Record<string, number>;
  classBestAscension: Record<string, number>;
}

export interface EquipmentAffix {
  id: string;
  value: number;
}

export interface EquipmentItem {
  id: string;
  baseId: string;
  name: string;
  slot: "weapon" | "armor" | "amulet" | "core";
  classId: string;
  setId: string;
  special: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  itemLevel: number;
  enhance: number;
  rerolls: number;
  lockedAffixIndex: number;
  affixes: EquipmentAffix[];
}

export interface RuneItem {
  id: string;
  runeId: string;
  tier: number;
}

export interface EquipmentLoadout {
  weapon: string;
  armor: string;
  amulet: string;
  core: string;
  runes: [string, string, string];
}

export interface ChallengeProgress {
  missionVersion: number;
  key: string;
  goalType: string;
  goalLabel: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface CombatProgress {
  damage: number;
  poisonDamage: number;
  burnDamage: number;
  kills: number;
  eliteKills: number;
  turretKills: number;
  bossKills: number;
  noDownWins: number;
}

export interface BestClearRecord {
  outcome: "victory" | "defeat" | "none";
  chapter: number;
  stage: number;
  cleared: boolean;
  completedAt: string | null;
}

export interface ProgressStatistics {
  runs: number;
  victories: number;
  defeats: number;
  highestChapter: number;
  highestStage: number;
  highestLevel: number;
  totalScore: number;
  totalRelics: number;
  totalPlaySeconds: number;
  totalAbyssShards: number;
  totalAccountXp: number;
  masteryPointsSpent: number;
  itemsFound: number;
  runesFound: number;
  itemsSalvaged: number;
  enhancements: number;
  reforges: number;
  crafts: number;
  challengeCompletions: number;
}

export interface UserProgress {
  version: number;
  currencies: ProgressCurrencies;
  account: AccountProgress;
  mastery: MasteryMap;
  records: ProgressRecords;
  inventory: { items: EquipmentItem[]; runes: RuneItem[]; bossMaterials: Record<string, number> };
  equipment: Record<string, EquipmentLoadout>;
  collections: { equipmentBases: string[]; runeTypes: string[]; monsters: string[]; bosses: string[]; relics: string[] };
  achievements: Record<string, string>;
  combatByClass: Record<string, CombatProgress>;
  cosmetics: { selectedTitle: string; selectedSkin: string };
  challenges: {
    daily: ChallengeProgress;
    weekly: ChallengeProgress;
    season: { id: string; xp: number; level: number; claimedLevels: string[] };
  };
  lastRunRewards: Record<string, unknown> | null;
  unlockedClasses: string[];
  unlockedRelics: string[];
  titles: string[];
  skins: string[];
  bestClear: BestClearRecord;
  statistics: ProgressStatistics;
}

export const defaultProgress: Readonly<UserProgress> = Object.freeze({
  version: SAVE_VERSION,
  currencies: {
    abyssShards: 0,
    enhancementStones: 0,
    reforgingDust: 0,
    bossEssence: 0,
  },
  account: {
    level: 1,
    xp: 0,
  },
  mastery: Object.fromEntries(
    CLASS_IDS.map((classId) => [
      classId,
      {
        points: 0,
        nodes: {
          attack: 0,
          survival: 0,
          speed: 0,
          special: 0,
        },
      },
    ]),
  ),
  records: {
    highestAbyssDepth: 0,
    highestAscension: 0,
    lastRunKey: null,
    dailyBest: {},
    weeklyBest: {},
    classBestAscension: {},
  },
  inventory: { items: [], runes: [], bossMaterials: {} },
  equipment: Object.fromEntries(
    CLASS_IDS.map((classId) => [classId, { weapon: "", armor: "", amulet: "", core: "", runes: ["", "", ""] }]),
  ),
  collections: { equipmentBases: [], runeTypes: [], monsters: [], bosses: [], relics: [] },
  achievements: {},
  combatByClass: Object.fromEntries(CLASS_IDS.map((classId) => [classId, { damage: 0, poisonDamage: 0, burnDamage: 0, kills: 0, eliteKills: 0, turretKills: 0, bossKills: 0, noDownWins: 0 }])),
  cosmetics: { selectedTitle: "", selectedSkin: "" },
  challenges: {
    daily: { missionVersion: 2, key: "", goalType: "eliteKills", goalLabel: "", target: 1, progress: 0, completed: false, rewardClaimed: false },
    weekly: { missionVersion: 2, key: "", goalType: "eliteKills", goalLabel: "", target: 1, progress: 0, completed: false, rewardClaimed: false },
    season: { id: "", xp: 0, level: 1, claimedLevels: [] },
  },
  lastRunRewards: null,
  unlockedClasses: ["warrior", "ranger", "mage", "engineer", "puppeteer", "martialist", "alchemist", "assassin"],
  unlockedRelics: [],
  titles: [],
  skins: [],
  bestClear: {
    outcome: "none",
    chapter: 0,
    stage: 0,
    cleared: false,
    completedAt: null,
  },
  statistics: {
    runs: 0,
    victories: 0,
    defeats: 0,
    highestChapter: 0,
    highestStage: 0,
    highestLevel: 1,
    totalScore: 0,
    totalRelics: 0,
    totalPlaySeconds: 0,
    totalAbyssShards: 0,
    totalAccountXp: 0,
    masteryPointsSpent: 0,
    itemsFound: 0,
    runesFound: 0,
    itemsSalvaged: 0,
    enhancements: 0,
    reforges: 0,
    crafts: 0,
    challengeCompletions: 0,
  },
} satisfies UserProgress);

export interface RunResultRecord {
  outcome?: string;
  resultKey?: string;
  chapter?: number;
  floor?: number;
  wave?: number;
  stagesCleared?: number;
  stage?: number;
  highestLevel?: number;
  totalScore?: number;
  totalRelics?: number;
  durationSec?: number;
  earnedShards?: number;
  earnedAccountXp?: number;
  abyssDepth?: number;
  ascensionLevel?: number;
  unlockedAscensionLevel?: number;
  classId?: string;
  challengeMode?: string;
  challengeModifierId?: string;
  challengeRuleId?: string;
  weeklyBossId?: string;
  combatStats?: Partial<CombatProgress>;
  bossDefeats?: string[];
  noDown?: boolean;
}
