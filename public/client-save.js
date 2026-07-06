(function () {
  const SAVE_VERSION = 1;
  const PROGRESS_KEY = "rogue-party.progress.v1";
  const LEGACY_PROGRESS_KEYS = [];

  const defaultProgress = Object.freeze({
    version: SAVE_VERSION,
    unlockedClasses: [
      "warrior",
      "ranger",
      "mage",
      "engineer",
      "puppeteer",
      "martialist",
      "alchemist",
      "assassin"
    ],
    unlockedRelics: [],
    titles: [],
    skins: [],
    bestClear: {
      outcome: "none",
      chapter: 0,
      stage: 0,
      cleared: false,
      completedAt: null
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
      totalPlaySeconds: 0
    }
  });

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function uniqueStrings(values, fallback = []) {
    const source = Array.isArray(values) ? values : fallback;
    return [...new Set(source.map((value) => String(value || "").trim()).filter(Boolean))];
  }

  function normalizeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeProgress(progress) {
    const input = progress && typeof progress === "object" ? progress : {};
    const stats = input.statistics && typeof input.statistics === "object" ? input.statistics : {};
    const best = input.bestClear && typeof input.bestClear === "object" ? input.bestClear : {};
    return {
      version: SAVE_VERSION,
      unlockedClasses: uniqueStrings(input.unlockedClasses, defaultProgress.unlockedClasses),
      unlockedRelics: uniqueStrings(input.unlockedRelics),
      titles: uniqueStrings(input.titles),
      skins: uniqueStrings(input.skins),
      bestClear: {
        outcome: ["victory", "defeat", "none"].includes(best.outcome) ? best.outcome : "none",
        chapter: Math.max(0, Math.floor(normalizeNumber(best.chapter, 0))),
        stage: Math.max(0, Math.floor(normalizeNumber(best.stage, 0))),
        cleared: Boolean(best.cleared),
        completedAt: typeof best.completedAt === "string" ? best.completedAt.slice(0, 40) : null
      },
      statistics: {
        runs: Math.max(0, Math.floor(normalizeNumber(stats.runs, 0))),
        victories: Math.max(0, Math.floor(normalizeNumber(stats.victories, 0))),
        defeats: Math.max(0, Math.floor(normalizeNumber(stats.defeats, 0))),
        highestChapter: Math.max(0, Math.floor(normalizeNumber(stats.highestChapter, 0))),
        highestStage: Math.max(0, Math.floor(normalizeNumber(stats.highestStage, 0))),
        highestLevel: Math.max(1, Math.floor(normalizeNumber(stats.highestLevel, 1))),
        totalScore: Math.max(0, Math.floor(normalizeNumber(stats.totalScore, 0))),
        totalRelics: Math.max(0, Math.floor(normalizeNumber(stats.totalRelics, 0))),
        totalPlaySeconds: Math.max(0, Math.floor(normalizeNumber(stats.totalPlaySeconds, 0)))
      }
    };
  }

  function migrateProgress(progress) {
    return normalizeProgress(progress);
  }

  function loadUserProgress() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY) || LEGACY_PROGRESS_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!raw) return structuredCloneSafe(defaultProgress);
      return migrateProgress(JSON.parse(raw));
    } catch {
      return structuredCloneSafe(defaultProgress);
    }
  }

  function saveUserProgress(progress) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
      return true;
    } catch {
      return false;
    }
  }

  function resetUserProgress() {
    const next = structuredCloneSafe(defaultProgress);
    saveUserProgress(next);
    return next;
  }

  function exportUserProgress(progress) {
    return JSON.stringify(normalizeProgress(progress), null, 2);
  }

  function importUserProgress(snapshot) {
    try {
      const parsed = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
      return normalizeProgress(parsed);
    } catch {
      return structuredCloneSafe(defaultProgress);
    }
  }

  function recordRunResult(progress, result) {
    const next = normalizeProgress(progress);
    const outcome = result?.outcome === "victory" ? "victory" : "defeat";
    const chapter = Math.max(0, Math.floor(normalizeNumber(result?.chapter || result?.floor, 0)));
    const stage = Math.max(0, Math.floor(normalizeNumber(result?.wave || result?.stage, 0)));
    const highestLevel = Math.max(1, Math.floor(normalizeNumber(result?.highestLevel, 1)));
    const score = Math.max(0, Math.floor(normalizeNumber(result?.totalScore, 0)));
    const relics = Math.max(0, Math.floor(normalizeNumber(result?.totalRelics, 0)));
    const duration = Math.max(0, Math.floor(normalizeNumber(result?.durationSec, 0)));

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
        completedAt: new Date().toISOString()
      };
    }
    return next;
  }

  window.RogueSaveManager = Object.freeze({
    SAVE_VERSION,
    PROGRESS_KEY,
    LEGACY_PROGRESS_KEYS,
    defaultProgress,
    normalizeProgress,
    migrateProgress,
    loadUserProgress,
    saveUserProgress,
    resetUserProgress,
    exportUserProgress,
    importUserProgress,
    recordRunResult
  });
})();
