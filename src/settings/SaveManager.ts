import { structuredCloneSafe } from "../core/clone";
import {
  defaultProgress,
  PROGRESS_KEY,
  SAVE_VERSION,
  type BestClearRecord,
  type ProgressStatistics,
  type RunResultRecord,
  type UserProgress,
} from "./SaveSchema";

export class SaveManager {
  private current: UserProgress;

  constructor(private readonly storage: Storage | undefined = globalThis.localStorage) {
    this.current = this.load();
  }

  get(): UserProgress {
    return structuredCloneSafe(this.current);
  }

  update(patch: Partial<UserProgress>): UserProgress {
    this.current = normalizeProgress({ ...this.current, ...patch });
    this.save();
    return this.get();
  }

  recordRunResult(result: RunResultRecord): UserProgress {
    this.current = recordRunResult(this.current, result);
    this.save();
    return this.get();
  }

  reset(): UserProgress {
    this.current = structuredCloneSafe(defaultProgress);
    this.save();
    return this.get();
  }

  exportProgress(): string {
    return exportProgress(this.current);
  }

  importProgress(snapshot: unknown): UserProgress {
    this.current = importProgress(snapshot);
    this.save();
    return this.get();
  }

  private load(): UserProgress {
    try {
      const raw = this.storage?.getItem(PROGRESS_KEY);
      if (!raw) return structuredCloneSafe(defaultProgress);
      return migrateProgress(JSON.parse(raw) as Partial<UserProgress>);
    } catch {
      return structuredCloneSafe(defaultProgress);
    }
  }

  private save(): boolean {
    try {
      this.storage?.setItem(PROGRESS_KEY, JSON.stringify(this.current));
      return true;
    } catch {
      return false;
    }
  }
}

export function migrateProgress(progress: unknown): UserProgress {
  return normalizeProgress(progress);
}

export function exportProgress(progress: unknown): string {
  return JSON.stringify(normalizeProgress(progress), null, 2);
}

export function importProgress(snapshot: unknown): UserProgress {
  try {
    const parsed = typeof snapshot === "string" ? (JSON.parse(snapshot) as unknown) : snapshot;
    return normalizeProgress(parsed);
  } catch {
    return structuredCloneSafe(defaultProgress);
  }
}

export function normalizeProgress(progress: unknown): UserProgress {
  const input = progress && typeof progress === "object" ? (progress as Partial<UserProgress>) : {};
  const best = (input.bestClear && typeof input.bestClear === "object" ? input.bestClear : {}) as Partial<BestClearRecord>;
  const stats = (input.statistics && typeof input.statistics === "object" ? input.statistics : {}) as Partial<ProgressStatistics>;
  return {
    version: SAVE_VERSION,
    unlockedClasses: uniqueStrings(input.unlockedClasses, defaultProgress.unlockedClasses),
    unlockedRelics: uniqueStrings(input.unlockedRelics),
    titles: uniqueStrings(input.titles),
    skins: uniqueStrings(input.skins),
    bestClear: {
      outcome: best.outcome === "victory" || best.outcome === "defeat" || best.outcome === "none" ? best.outcome : "none",
      chapter: wholeNumber(best.chapter, 0),
      stage: wholeNumber(best.stage, 0),
      cleared: Boolean(best.cleared),
      completedAt: typeof best.completedAt === "string" ? best.completedAt.slice(0, 40) : null,
    },
    statistics: {
      runs: wholeNumber(stats.runs, 0),
      victories: wholeNumber(stats.victories, 0),
      defeats: wholeNumber(stats.defeats, 0),
      highestChapter: wholeNumber(stats.highestChapter, 0),
      highestStage: wholeNumber(stats.highestStage, 0),
      highestLevel: Math.max(1, wholeNumber(stats.highestLevel, 1)),
      totalScore: wholeNumber(stats.totalScore, 0),
      totalRelics: wholeNumber(stats.totalRelics, 0),
      totalPlaySeconds: wholeNumber(stats.totalPlaySeconds, 0),
    },
  };
}

export function recordRunResult(progress: unknown, result: RunResultRecord): UserProgress {
  const next = normalizeProgress(progress);
  const outcome = result.outcome === "victory" ? "victory" : "defeat";
  const chapter = wholeNumber(result.chapter ?? result.floor, 0);
  const stage = wholeNumber(result.wave ?? result.stage, 0);
  const highestLevel = Math.max(1, wholeNumber(result.highestLevel, 1));
  const score = wholeNumber(result.totalScore, 0);
  const relics = wholeNumber(result.totalRelics, 0);
  const duration = wholeNumber(result.durationSec, 0);

  next.statistics.runs += 1;
  next.statistics.victories += outcome === "victory" ? 1 : 0;
  next.statistics.defeats += outcome === "victory" ? 0 : 1;
  next.statistics.highestChapter = Math.max(next.statistics.highestChapter, chapter);
  next.statistics.highestStage = Math.max(next.statistics.highestStage, stage);
  next.statistics.highestLevel = Math.max(next.statistics.highestLevel, highestLevel);
  next.statistics.totalScore += score;
  next.statistics.totalRelics += relics;
  next.statistics.totalPlaySeconds += duration;

  const bestScore = next.bestClear.chapter * 1000 + next.bestClear.stage;
  const nextScore = chapter * 1000 + stage;
  if (outcome === "victory" || nextScore >= bestScore) {
    next.bestClear = {
      outcome,
      chapter,
      stage,
      cleared: outcome === "victory",
      completedAt: new Date().toISOString(),
    };
  }
  return next;
}

function uniqueStrings(values: unknown, fallback: readonly string[] = []): string[] {
  const source = Array.isArray(values) ? values : fallback;
  return [...new Set(source.map((value) => String(value || "").trim()).filter(Boolean))];
}

function wholeNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Math.max(0, Math.floor(Number.isFinite(number) ? number : fallback));
}
