export const SAVE_VERSION = 1;
export const PROGRESS_KEY = "rogue-party.progress.v1";

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
}

export interface UserProgress {
  version: number;
  unlockedClasses: string[];
  unlockedRelics: string[];
  titles: string[];
  skins: string[];
  bestClear: BestClearRecord;
  statistics: ProgressStatistics;
}

export const defaultProgress: Readonly<UserProgress> = Object.freeze({
  version: SAVE_VERSION,
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
  },
} satisfies UserProgress);

export interface RunResultRecord {
  outcome?: string;
  chapter?: number;
  floor?: number;
  wave?: number;
  stage?: number;
  highestLevel?: number;
  totalScore?: number;
  totalRelics?: number;
  durationSec?: number;
}
