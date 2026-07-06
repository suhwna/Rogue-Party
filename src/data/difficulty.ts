export type PartySize = 1 | 2 | 3 | 4;
export type StageDepth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ChapterIndex = 1 | 2 | 3;

export interface PartyDifficultyRule {
  readonly label: string;
  readonly spawnMul: number;
  readonly hpMul: number;
  readonly damageMul: number;
  readonly eliteMul: number;
  readonly eliteCap: number;
  readonly xpMul: number;
  readonly chestMul: number;
  readonly anchorBonus: number;
  readonly maxAnchors: number;
}

export interface StageDifficultyRule {
  readonly countMul: number;
  readonly hpMul: number;
  readonly damageMul: number;
  readonly speedMul: number;
  readonly cadenceMul: number;
  readonly eliteMul: number;
  readonly anchorBonus: number;
  readonly threatMul: number;
  readonly pressureMin: number;
  readonly riskMul: number;
}

export interface ChapterDifficultyRule {
  readonly spawnMul: number;
  readonly hpMul: number;
  readonly damageMul: number;
  readonly speedMul: number;
  readonly cadenceMul: number;
  readonly eliteMul: number;
  readonly initialSpawnRatio: number;
  readonly reinforcementBatches: number;
  readonly reinforcementDelay: number;
  readonly reinforcementGap: number;
}

export const PARTY_DIFFICULTY = {
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
    maxAnchors: 3,
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
    maxAnchors: 5,
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
    maxAnchors: 5,
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
    maxAnchors: 6,
  },
} as const satisfies Record<PartySize, PartyDifficultyRule>;

export const STAGE_DIFFICULTY = {
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
    riskMul: 0.62,
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
    riskMul: 0.68,
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
    riskMul: 0.76,
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
    riskMul: 0.84,
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
    riskMul: 0.92,
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
    riskMul: 1,
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
    riskMul: 1,
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
    riskMul: 1,
  },
} as const satisfies Record<StageDepth, StageDifficultyRule>;

export const CHAPTER_DIFFICULTY = {
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
    reinforcementGap: 7.2,
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
    reinforcementGap: 7.4,
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
    reinforcementGap: 7,
  },
} as const satisfies Record<ChapterIndex, ChapterDifficultyRule>;

export function normalizePartySize(players: number): PartySize {
  if (players >= 4) return 4;
  if (players >= 3) return 3;
  if (players >= 2) return 2;
  return 1;
}

export function normalizeStageDepth(depth: number): StageDepth {
  if (depth >= 8) return 8;
  if (depth >= 7) return 7;
  if (depth >= 6) return 6;
  if (depth >= 5) return 5;
  if (depth >= 4) return 4;
  if (depth >= 3) return 3;
  if (depth >= 2) return 2;
  return 1;
}

export function normalizeChapterIndex(chapter: number): ChapterIndex {
  if (chapter >= 3) return 3;
  if (chapter >= 2) return 2;
  return 1;
}

export function getPartyDifficulty(players: number): PartyDifficultyRule {
  return PARTY_DIFFICULTY[normalizePartySize(players)];
}

export function getStageDifficulty(depth: number): StageDifficultyRule {
  return STAGE_DIFFICULTY[normalizeStageDepth(depth)];
}

export function getChapterDifficulty(chapter: number): ChapterDifficultyRule {
  return CHAPTER_DIFFICULTY[normalizeChapterIndex(chapter)];
}
