import { structuredCloneSafe } from "../core/clone";
import {
  CLASS_IDS,
  defaultProgress,
  LEGACY_PROGRESS_KEYS,
  MASTERY_NODE_IDS,
  MAX_ASCENSION_LEVEL,
  PROGRESS_KEY,
  SAVE_VERSION,
  SHARED_MASTERY_KEY,
  type BestClearRecord,
  type ChallengeProgress,
  type CombatProgress,
  type EquipmentItem,
  type EquipmentLoadout,
  type MasteryEntry,
  type MasteryMap,
  type MasteryNodeId,
  type ProgressStatistics,
  type RuneItem,
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
    const current = readStoredProgress(this.storage, PROGRESS_KEY);
    if (current) return migrateProgress(current);
    for (const key of LEGACY_PROGRESS_KEYS) {
      const legacy = readStoredProgress(this.storage, key);
      if (legacy) {
        const migrated = migrateProgress(legacy);
        this.storage?.setItem(PROGRESS_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
    return structuredCloneSafe(defaultProgress);
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
  const currencies =
    input.currencies && typeof input.currencies === "object" ? (input.currencies as Partial<UserProgress["currencies"]>) : {};
  const account = input.account && typeof input.account === "object" ? (input.account as Partial<UserProgress["account"]>) : {};
  const records = input.records && typeof input.records === "object" ? (input.records as Partial<UserProgress["records"]>) : {};
  return {
    version: SAVE_VERSION,
    currencies: {
      abyssShards: wholeNumber(currencies.abyssShards, 0),
      enhancementStones: wholeNumber(currencies.enhancementStones, 0),
      reforgingDust: wholeNumber(currencies.reforgingDust, 0),
      bossEssence: wholeNumber(currencies.bossEssence, 0),
    },
    account: {
      level: Math.max(1, wholeNumber(account.level, 1)),
      xp: wholeNumber(account.xp, 0),
    },
    mastery: normalizeMasteryMap(input.mastery),
    records: {
      highestAbyssDepth: wholeNumber(records.highestAbyssDepth, 0),
      highestAscension: clampedWholeNumber(records.highestAscension, 0, 0, MAX_ASCENSION_LEVEL),
      lastRunKey: typeof records.lastRunKey === "string" ? records.lastRunKey.slice(0, 120) : null,
      dailyBest: normalizeNumberRecord(records.dailyBest),
      weeklyBest: normalizeNumberRecord(records.weeklyBest),
      classBestAscension: normalizeNumberRecord(records.classBestAscension),
    },
    inventory: normalizeInventory(input.inventory),
    equipment: normalizeEquipmentMap(input.equipment),
    collections: normalizeCollections(input.collections),
    achievements: normalizeStringRecord(input.achievements),
    combatByClass: normalizeCombatByClass(input.combatByClass),
    cosmetics: {
      selectedTitle: String(input.cosmetics?.selectedTitle || "").slice(0, 24),
      selectedSkin: String(input.cosmetics?.selectedSkin || "").slice(0, 32),
    },
    challenges: normalizeChallenges(input.challenges),
    lastRunRewards:
      input.lastRunRewards && typeof input.lastRunRewards === "object"
        ? structuredCloneSafe(input.lastRunRewards)
        : null,
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
      totalAbyssShards: wholeNumber(stats.totalAbyssShards, 0),
      totalAccountXp: wholeNumber(stats.totalAccountXp, 0),
      masteryPointsSpent: wholeNumber(stats.masteryPointsSpent, 0),
      itemsFound: wholeNumber(stats.itemsFound, 0),
      runesFound: wholeNumber(stats.runesFound, 0),
      itemsSalvaged: wholeNumber(stats.itemsSalvaged, 0),
      enhancements: wholeNumber(stats.enhancements, 0),
      reforges: wholeNumber(stats.reforges, 0),
      crafts: wholeNumber(stats.crafts, 0),
      challengeCompletions: wholeNumber(stats.challengeCompletions, 0),
    },
  };
}

export function recordRunResult(progress: unknown, result: RunResultRecord): UserProgress {
  const next = normalizeProgress(progress);
  const resultKey = typeof result.resultKey === "string" ? result.resultKey.slice(0, 120) : "";
  if (resultKey && next.records.lastRunKey === resultKey) return next;

  const rewards = calculateRunRewards(result);
  const outcome = result.outcome === "victory" ? "victory" : "defeat";
  const chapter = wholeNumber(result.chapter ?? result.floor, 0);
  const stage = wholeNumber(result.wave ?? result.stagesCleared ?? result.stage, 0);
  const highestLevel = Math.max(1, wholeNumber(result.highestLevel, 1));
  const score = wholeNumber(result.totalScore, 0);
  const relics = wholeNumber(result.totalRelics, 0);
  const duration = wholeNumber(result.durationSec, 0);
  const earnedShards = wholeNumber(result.earnedShards, rewards.earnedShards);
  const earnedAccountXp = wholeNumber(result.earnedAccountXp, rewards.earnedAccountXp);
  const abyssDepth = wholeNumber(result.abyssDepth, rewards.abyssDepth);
  const ascensionLevel = clampedWholeNumber(result.ascensionLevel, rewards.ascensionLevel, 0, MAX_ASCENSION_LEVEL);

  next.statistics.runs += 1;
  next.statistics.victories += outcome === "victory" ? 1 : 0;
  next.statistics.defeats += outcome === "victory" ? 0 : 1;
  next.statistics.highestChapter = Math.max(next.statistics.highestChapter, chapter);
  next.statistics.highestStage = Math.max(next.statistics.highestStage, stage);
  next.statistics.highestLevel = Math.max(next.statistics.highestLevel, highestLevel);
  next.statistics.totalScore += score;
  next.statistics.totalRelics += relics;
  next.statistics.totalPlaySeconds += duration;
  next.statistics.totalAbyssShards += earnedShards;
  next.statistics.totalAccountXp += earnedAccountXp;
  next.currencies.abyssShards += earnedShards;
  next.records.highestAbyssDepth = Math.max(next.records.highestAbyssDepth, abyssDepth);
  if (outcome === "victory") {
    next.records.highestAscension = Math.max(next.records.highestAscension, ascensionLevel);
  }
  if (resultKey) next.records.lastRunKey = resultKey;
  applyAccountXp(next, earnedAccountXp);

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
  return normalizeProgress(next);
}

export function calculateRunRewards(result: RunResultRecord): {
  earnedShards: number;
  earnedAccountXp: number;
  abyssDepth: number;
  ascensionLevel: number;
} {
  const outcome = result.outcome === "victory" ? "victory" : "defeat";
  const stagesCleared = wholeNumber(result.stagesCleared ?? result.wave ?? result.stage, 0);
  const highestLevel = Math.max(1, wholeNumber(result.highestLevel, 1));
  const totalScore = wholeNumber(result.totalScore, 0);
  const totalRelics = wholeNumber(result.totalRelics, 0);
  const abyssDepth = wholeNumber(result.abyssDepth, 0);
  const ascensionLevel = clampedWholeNumber(result.ascensionLevel, 0, 0, MAX_ASCENSION_LEVEL);
  const progressReward = Math.floor(stagesCleared * 5 + highestLevel * 2 + totalRelics * 3 + Math.sqrt(totalScore) * 0.42);
  const victoryReward = outcome === "victory" ? 45 : 0;
  const abyssReward = abyssDepth > 0 ? abyssDepth * 18 + Math.floor(Math.pow(abyssDepth, 1.22) * 8) : 0;
  const ascensionMultiplier = [1, 1.5, 2, 2.75, 3.75, 5][ascensionLevel] || 1;
  const earnedShards = Math.max(2, Math.floor((progressReward + victoryReward + abyssReward) * ascensionMultiplier));
  return {
    earnedShards,
    earnedAccountXp: Math.max(10, Math.floor(earnedShards * 1.75 + stagesCleared * 3 + highestLevel * 6)),
    abyssDepth,
    ascensionLevel,
  };
}

export function getMasteryNodeCost(level: number): number {
  const safeLevel = wholeNumber(level, 0);
  return 12 + Math.floor(Math.pow(safeLevel + 1, 1.28) * 9 + safeLevel * 2);
}

export function spendMasteryPoint(progress: unknown, classId: string, nodeId: MasteryNodeId): UserProgress {
  const next = normalizeProgress(progress);
  const entry = next.mastery[SHARED_MASTERY_KEY] ?? createDefaultMasteryEntry();
  const level = entry.nodes[nodeId] ?? 0;
  const cost = getMasteryNodeCost(level);
  if (next.currencies.abyssShards < cost) return next;
  next.currencies.abyssShards -= cost;
  entry.nodes[nodeId] = level + 1;
  entry.points += 1;
  next.mastery[SHARED_MASTERY_KEY] = entry;
  next.statistics.masteryPointsSpent += 1;
  return normalizeProgress(next);
}

function uniqueStrings(values: unknown, fallback: readonly string[] = []): string[] {
  const source = Array.isArray(values) ? values : fallback;
  return [...new Set(source.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeInventory(value: unknown): UserProgress["inventory"] {
  const source = value && typeof value === "object" ? (value as Partial<UserProgress["inventory"]>) : {};
  const items = (Array.isArray(source.items) ? source.items : []).slice(-120).map((item) => {
    const entry = item && typeof item === "object"
      ? (item as Partial<EquipmentItem> & { lockedAffixIndex?: number })
      : {};
    const slots = ["weapon", "armor", "amulet", "core"] as const;
    const rarities = ["common", "rare", "epic", "legendary", "mythic"] as const;
    const affixes = (Array.isArray(entry.affixes) ? entry.affixes : []).slice(0, 5).map((affix) => ({
      id: String(affix?.id || "power").slice(0, 32),
      value: Math.max(0, Math.min(2, Number(affix?.value) || 0)),
    }));
    const legacyLocks = Number.isInteger(entry.lockedAffixIndex) && Number(entry.lockedAffixIndex) >= 0
      ? [Number(entry.lockedAffixIndex)]
      : [];
    const lockedAffixIndices = [...new Set((Array.isArray(entry.lockedAffixIndices) ? entry.lockedAffixIndices : legacyLocks)
      .map((index) => Math.floor(Number(index)))
      .filter((index) => index >= 0 && index < affixes.length))]
      .slice(0, Math.max(0, affixes.length - 1))
      .sort((a, b) => a - b);
    const previewAffixes = (Array.isArray(entry.reforgePreview?.affixes) ? entry.reforgePreview.affixes : []).slice(0, affixes.length).map((affix) => ({
      id: String(affix?.id || "power").slice(0, 32),
      value: Math.max(0, Math.min(2, Number(affix?.value) || 0)),
    }));
    return {
      id: String(entry.id || "").slice(0, 96),
      baseId: String(entry.baseId || "").slice(0, 64),
      name: String(entry.name || "Equipment").slice(0, 48),
      slot: slots.includes(entry.slot as (typeof slots)[number]) ? (entry.slot as EquipmentItem["slot"]) : "weapon",
      classId: String(entry.classId || "all").slice(0, 24),
      setId: String(entry.setId || "").slice(0, 32),
      special: String(entry.special || "").slice(0, 32),
      rarity: rarities.includes(entry.rarity as (typeof rarities)[number]) ? (entry.rarity as EquipmentItem["rarity"]) : "common",
      itemLevel: Math.max(1, wholeNumber(entry.itemLevel, 1)),
      enhance: clampedWholeNumber(entry.enhance, 0, 0, 20),
      rerolls: wholeNumber(entry.rerolls, 0),
      lockedAffixIndices,
      reforgePreview: previewAffixes.length === affixes.length && affixes.length > 0
        ? { affixes: previewAffixes, cost: wholeNumber(entry.reforgePreview?.cost, 0) }
        : null,
      affixes,
    } satisfies EquipmentItem;
  });
  const runes = (Array.isArray(source.runes) ? source.runes : []).slice(-180).map((rune) => {
    const entry = rune && typeof rune === "object" ? (rune as Partial<RuneItem>) : {};
    return {
      id: String(entry.id || "").slice(0, 96),
      runeId: String(entry.runeId || "fury").slice(0, 32),
      tier: clampedWholeNumber(entry.tier, 1, 1, 5),
    } satisfies RuneItem;
  });
  return { items, runes, bossMaterials: normalizeNumberRecord(source.bossMaterials) };
}

function normalizeCombatByClass(value: unknown): Record<string, CombatProgress> {
  const source = value && typeof value === "object" ? (value as Record<string, Partial<CombatProgress>>) : {};
  return Object.fromEntries(CLASS_IDS.map((classId) => {
    const stats = source[classId] || {};
    return [classId, {
      damage: wholeNumber(stats.damage, 0),
      poisonDamage: wholeNumber(stats.poisonDamage, 0),
      burnDamage: wholeNumber(stats.burnDamage, 0),
      kills: wholeNumber(stats.kills, 0),
      eliteKills: wholeNumber(stats.eliteKills, 0),
      turretKills: wholeNumber(stats.turretKills, 0),
      bossKills: wholeNumber(stats.bossKills, 0),
      noDownWins: wholeNumber(stats.noDownWins, 0),
    } satisfies CombatProgress];
  }));
}

function normalizeEquipmentMap(value: unknown): Record<string, EquipmentLoadout> {
  const source = value && typeof value === "object" ? (value as Record<string, Partial<EquipmentLoadout>>) : {};
  return Object.fromEntries(
    CLASS_IDS.map((classId) => {
      const loadout = source[classId] || {};
      const runes = Array.from({ length: 3 }, (_, index) => String(loadout.runes?.[index] || "")) as [string, string, string];
      return [classId, {
        weapon: String(loadout.weapon || ""),
        armor: String(loadout.armor || ""),
        amulet: String(loadout.amulet || ""),
        core: String(loadout.core || ""),
        runes,
      } satisfies EquipmentLoadout];
    }),
  );
}

function normalizeCollections(value: unknown): UserProgress["collections"] {
  const source = value && typeof value === "object" ? (value as Partial<UserProgress["collections"]>) : {};
  return {
    equipmentBases: uniqueStrings(source.equipmentBases),
    runeTypes: uniqueStrings(source.runeTypes),
    monsters: uniqueStrings(source.monsters),
    bosses: uniqueStrings(source.bosses),
    relics: uniqueStrings(source.relics),
  };
}

function normalizeChallenges(value: unknown): UserProgress["challenges"] {
  const source = value && typeof value === "object" ? (value as Partial<UserProgress["challenges"]>) : {};
  const normalizeChallenge = (entry: Partial<ChallengeProgress> | undefined, goalType: string): ChallengeProgress => ({
    missionVersion: 2,
    key: String(entry?.key || "").slice(0, 24),
    goalType: String(entry?.goalType || goalType).slice(0, 24),
    goalLabel: String(entry?.goalLabel || "").slice(0, 80),
    target: Math.max(1, wholeNumber(entry?.target, 1)),
    progress: wholeNumber(entry?.progress, 0),
    completed: Boolean(entry?.completed),
    rewardClaimed: Boolean(entry?.rewardClaimed),
  });
  return {
    daily: normalizeChallenge(source.daily, "eliteKills"),
    weekly: normalizeChallenge(source.weekly, "eliteKills"),
    season: {
      id: String(source.season?.id || "").slice(0, 24),
      xp: wholeNumber(source.season?.xp, 0),
      level: Math.max(1, wholeNumber(source.season?.level, 1)),
      claimedLevels: uniqueStrings(source.season?.claimedLevels),
    },
  };
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).slice(0, 120).map(([key, entry]) => [key.slice(0, 32), wholeNumber(entry, 0)]));
}

function normalizeStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).slice(0, 200).map(([key, entry]) => [key.slice(0, 64), String(entry || "").slice(0, 64)]));
}

function wholeNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Math.max(0, Math.floor(Number.isFinite(number) ? number : fallback));
}

function clampedWholeNumber(value: unknown, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, wholeNumber(value, fallback)));
}

function readStoredProgress(storage: Storage | undefined, key: string): unknown | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createDefaultMasteryEntry(): MasteryEntry {
  return {
    points: 0,
    nodes: {
      attack: 0,
      survival: 0,
      speed: 0,
      special: 0,
    },
  };
}

function normalizeMasteryEntry(entry: unknown): MasteryEntry {
  const source = entry && typeof entry === "object" ? (entry as Partial<MasteryEntry>) : {};
  const rawNodes =
    source.nodes && typeof source.nodes === "object" ? (source.nodes as Partial<Record<MasteryNodeId, unknown>>) : {};
  const nodes = createDefaultMasteryEntry().nodes;
  for (const nodeId of MASTERY_NODE_IDS) {
    nodes[nodeId] = clampedWholeNumber(rawNodes[nodeId], 0, 0, 9999);
  }
  const spent = MASTERY_NODE_IDS.reduce((sum, nodeId) => sum + nodes[nodeId], 0);
  return {
    points: Math.max(spent, wholeNumber(source.points, spent)),
    nodes,
  };
}

function normalizeMasteryMap(mastery: unknown): MasteryMap {
  const source = mastery && typeof mastery === "object" ? (mastery as Record<string, unknown>) : {};
  if (source[SHARED_MASTERY_KEY]) return { [SHARED_MASTERY_KEY]: normalizeMasteryEntry(source[SHARED_MASTERY_KEY]) };
  const shared = createDefaultMasteryEntry();
  for (const classId of CLASS_IDS) {
    const legacy = normalizeMasteryEntry(source[classId]);
    for (const nodeId of MASTERY_NODE_IDS) shared.nodes[nodeId] += legacy.nodes[nodeId] || 0;
  }
  shared.points = MASTERY_NODE_IDS.reduce((sum, nodeId) => sum + shared.nodes[nodeId], 0);
  return { [SHARED_MASTERY_KEY]: shared };
}

function sanitizeClassId(classId: string): string {
  return CLASS_IDS.includes(classId as (typeof CLASS_IDS)[number]) ? classId : "warrior";
}

function getAccountXpToNext(level: number): number {
  const safeLevel = Math.max(1, wholeNumber(level, 1));
  return 90 + safeLevel * 38 + Math.floor(Math.pow(safeLevel, 1.35) * 18);
}

function applyAccountXp(progress: UserProgress, gainedXp: number): void {
  let xp = wholeNumber(progress.account.xp + gainedXp, 0);
  let level = Math.max(1, wholeNumber(progress.account.level, 1));
  for (let guard = 0; guard < 1000; guard += 1) {
    const required = getAccountXpToNext(level);
    if (xp < required) break;
    xp -= required;
    level += 1;
  }
  progress.account.level = level;
  progress.account.xp = xp;
}
