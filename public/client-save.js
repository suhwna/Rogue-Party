(function () {
  const SAVE_VERSION = 2;
  const PROGRESS_KEY = "rogue-party.progress.v2";
  const LEGACY_PROGRESS_KEYS = ["rogue-party.progress.v1"];
  const CLASS_IDS = [
    "warrior",
    "ranger",
    "mage",
    "engineer",
    "puppeteer",
    "martialist",
    "alchemist",
    "assassin",
  ];
  const MASTERY_NODE_DEFS = Object.freeze([
    { id: "attack", label: "공격", description: "피해량이 완만하게 증가합니다." },
    { id: "survival", label: "생존", description: "최대 체력과 일부 방어 능력이 증가합니다." },
    { id: "speed", label: "속도", description: "이동 속도와 스킬 회전율이 좋아집니다." },
    { id: "special", label: "직업 특화", description: "직업 고유 강점이 조금씩 강화됩니다." },
  ]);
  const NODE_IDS = MASTERY_NODE_DEFS.map((node) => node.id);
  const MAX_ASCENSION_LEVEL = 25;

  function createDefaultMasteryEntry() {
    return {
      points: 0,
      nodes: NODE_IDS.reduce((next, nodeId) => {
        next[nodeId] = 0;
        return next;
      }, {}),
    };
  }

  function createDefaultMasteryMap() {
    return CLASS_IDS.reduce((next, classId) => {
      next[classId] = createDefaultMasteryEntry();
      return next;
    }, {});
  }

  const defaultProgress = {
    version: SAVE_VERSION,
    unlockedClasses: CLASS_IDS.slice(),
    unlockedRelics: [],
    titles: [],
    skins: [],
    currencies: {
      abyssShards: 0,
    },
    account: {
      level: 1,
      xp: 0,
    },
    mastery: createDefaultMasteryMap(),
    records: {
      highestAbyssDepth: 0,
      highestAscension: 0,
      lastRunKey: "",
    },
    bestClear: {
      outcome: "none",
      chapter: 0,
      stage: 0,
      cleared: false,
      totalScore: 0,
      durationSec: 0,
      completedAt: null,
    },
    statistics: {
      runs: 0,
      victories: 0,
      defeats: 0,
      highestChapter: 1,
      highestStage: 0,
      highestLevel: 1,
      totalScore: 0,
      totalRelics: 0,
      totalPlaySeconds: 0,
      totalAbyssShards: 0,
      totalAccountXp: 0,
      masteryPointsSpent: 0,
    },
  };

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value));
  }

  function clampNumber(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return min;
    }
    return Math.max(min, Math.min(max, numeric));
  }

  function normalizeInteger(value, fallback, min, max) {
    const numeric = Number(value);
    const minimum = Number.isFinite(min) ? min : 0;
    const maximum = Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER;
    if (!Number.isFinite(numeric)) {
      return Math.floor(clampNumber(fallback, minimum, maximum));
    }
    return Math.floor(clampNumber(numeric, minimum, maximum));
  }

  function uniqueStrings(values, fallback = []) {
    const source = Array.isArray(values) ? values : fallback;
    return Array.from(
      new Set(
        source
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
  }

  function normalizeMasteryEntry(entry) {
    const sourceNodes = entry && typeof entry === "object" && entry.nodes && typeof entry.nodes === "object" ? entry.nodes : {};
    const nodes = NODE_IDS.reduce((next, nodeId) => {
      next[nodeId] = normalizeInteger(sourceNodes[nodeId], 0, 0, Number.MAX_SAFE_INTEGER);
      return next;
    }, {});
    const spent = NODE_IDS.reduce((sum, nodeId) => sum + nodes[nodeId], 0);
    return {
      points: normalizeInteger(entry?.points, spent, spent, Number.MAX_SAFE_INTEGER),
      nodes,
    };
  }

  function normalizeMasteryMap(mastery) {
    return CLASS_IDS.reduce((next, classId) => {
      next[classId] = normalizeMasteryEntry(mastery?.[classId]);
      return next;
    }, {});
  }

  function normalizeProgress(progress) {
    const source = progress && typeof progress === "object" ? progress : {};
    const base = structuredCloneSafe(defaultProgress);
    const statistics = {
      ...base.statistics,
      ...(source.statistics && typeof source.statistics === "object" ? source.statistics : {}),
    };
    const records = {
      ...base.records,
      ...(source.records && typeof source.records === "object" ? source.records : {}),
    };
    return {
      ...base,
      ...source,
      version: SAVE_VERSION,
      unlockedClasses: uniqueStrings(source.unlockedClasses, base.unlockedClasses),
      unlockedRelics: uniqueStrings(source.unlockedRelics, base.unlockedRelics),
      titles: uniqueStrings(source.titles, base.titles),
      skins: uniqueStrings(source.skins, base.skins),
      currencies: {
        abyssShards: normalizeInteger(source.currencies?.abyssShards, 0, 0, Number.MAX_SAFE_INTEGER),
      },
      account: normalizeAccount(source.account),
      mastery: normalizeMasteryMap(source.mastery),
      records: {
        highestAbyssDepth: normalizeInteger(records.highestAbyssDepth, 0, 0, Number.MAX_SAFE_INTEGER),
        highestAscension: normalizeInteger(records.highestAscension, 0, 0, MAX_ASCENSION_LEVEL),
        lastRunKey: typeof records.lastRunKey === "string" ? records.lastRunKey : "",
      },
      bestClear: normalizeBestClear(source.bestClear, base.bestClear),
      statistics: {
        runs: normalizeInteger(statistics.runs, 0, 0, Number.MAX_SAFE_INTEGER),
        victories: normalizeInteger(statistics.victories, 0, 0, Number.MAX_SAFE_INTEGER),
        defeats: normalizeInteger(statistics.defeats, 0, 0, Number.MAX_SAFE_INTEGER),
        highestChapter: normalizeInteger(statistics.highestChapter, 1, 1, Number.MAX_SAFE_INTEGER),
        highestStage: normalizeInteger(statistics.highestStage, 0, 0, Number.MAX_SAFE_INTEGER),
        highestLevel: normalizeInteger(statistics.highestLevel, 1, 1, Number.MAX_SAFE_INTEGER),
        totalScore: normalizeInteger(statistics.totalScore, 0, 0, Number.MAX_SAFE_INTEGER),
        totalRelics: normalizeInteger(statistics.totalRelics, 0, 0, Number.MAX_SAFE_INTEGER),
        totalPlaySeconds: normalizeInteger(statistics.totalPlaySeconds, 0, 0, Number.MAX_SAFE_INTEGER),
        totalAbyssShards: normalizeInteger(statistics.totalAbyssShards, 0, 0, Number.MAX_SAFE_INTEGER),
        totalAccountXp: normalizeInteger(statistics.totalAccountXp, 0, 0, Number.MAX_SAFE_INTEGER),
        masteryPointsSpent: normalizeInteger(statistics.masteryPointsSpent, 0, 0, Number.MAX_SAFE_INTEGER),
      },
    };
  }

  function normalizeAccount(account) {
    const level = normalizeInteger(account?.level, 1, 1, Number.MAX_SAFE_INTEGER);
    const xp = normalizeInteger(account?.xp, 0, 0, Number.MAX_SAFE_INTEGER);
    return levelAccount({ level, xp });
  }

  function normalizeBestClear(bestClear, fallback) {
    const source = bestClear && typeof bestClear === "object" ? bestClear : fallback || {};
    const outcome = source.outcome === "victory" || source.outcome === "defeat" || source.outcome === "none" ? source.outcome : "none";
    return {
      outcome,
      chapter: normalizeInteger(source.chapter, 0, 0, Number.MAX_SAFE_INTEGER),
      stage: normalizeInteger(source.stage, 0, 0, Number.MAX_SAFE_INTEGER),
      cleared: typeof source.cleared === "boolean" ? source.cleared : outcome === "victory",
      totalScore: normalizeInteger(source.totalScore, 0, 0, Number.MAX_SAFE_INTEGER),
      durationSec: normalizeInteger(source.durationSec, 0, 0, Number.MAX_SAFE_INTEGER),
      completedAt: typeof source.completedAt === "string" ? source.completedAt.slice(0, 64) : null,
    };
  }

  function getAccountXpToNext(level) {
    const safeLevel = normalizeInteger(level, 1, 1, Number.MAX_SAFE_INTEGER);
    return 90 + safeLevel * 35 + Math.floor(Math.pow(safeLevel, 1.35) * 12);
  }

  function levelAccount(account) {
    const next = {
      level: normalizeInteger(account?.level, 1, 1, Number.MAX_SAFE_INTEGER),
      xp: normalizeInteger(account?.xp, 0, 0, Number.MAX_SAFE_INTEGER),
    };
    let guard = 0;
    while (next.xp >= getAccountXpToNext(next.level) && guard < 10000) {
      next.xp -= getAccountXpToNext(next.level);
      next.level += 1;
      guard += 1;
    }
    return next;
  }

  function migrateProgress(raw) {
    if (!raw || typeof raw !== "object") {
      return normalizeProgress(defaultProgress);
    }
    if (raw.version === SAVE_VERSION) {
      return normalizeProgress(raw);
    }
    return normalizeProgress({
      ...raw,
      version: SAVE_VERSION,
      currencies: {
        abyssShards: raw.currencies?.abyssShards || 0,
      },
      account: {
        level: raw.account?.level || 1,
        xp: raw.account?.xp || 0,
      },
      mastery: raw.mastery || createDefaultMasteryMap(),
      records: {
        highestAbyssDepth: raw.records?.highestAbyssDepth || 0,
        highestAscension: raw.records?.highestAscension || 0,
        lastRunKey: raw.records?.lastRunKey || "",
      },
    });
  }

  function readStorage(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.warn("Failed to read progress save", error);
      return null;
    }
  }

  function writeStorage(progress) {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
    } catch (error) {
      console.warn("Failed to write progress save", error);
    }
  }

  function loadUserProgress() {
    const current = readStorage(PROGRESS_KEY);
    if (current) {
      return migrateProgress(current);
    }
    for (const key of LEGACY_PROGRESS_KEYS) {
      const legacy = readStorage(key);
      if (legacy) {
        const migrated = migrateProgress(legacy);
        writeStorage(migrated);
        return migrated;
      }
    }
    return normalizeProgress(defaultProgress);
  }

  function saveUserProgress(progress) {
    const next = normalizeProgress(progress);
    writeStorage(next);
    return next;
  }

  function resetUserProgress() {
    const fresh = normalizeProgress(defaultProgress);
    writeStorage(fresh);
    return fresh;
  }

  function exportUserProgress(progress) {
    return JSON.stringify(normalizeProgress(progress), null, 2);
  }

  function importUserProgress(json) {
    try {
      return saveUserProgress(migrateProgress(JSON.parse(json)));
    } catch (error) {
      throw new Error("진행도 데이터를 불러오지 못했습니다.");
    }
  }

  function getMasteryNodeCost(progress, classId, nodeId) {
    const safeClassId = CLASS_IDS.includes(classId) ? classId : "warrior";
    const safeNodeId = NODE_IDS.includes(nodeId) ? nodeId : "attack";
    const normalized = normalizeProgress(progress);
    const entry = normalized.mastery[safeClassId] || createDefaultMasteryEntry();
    const nodeLevel = entry.nodes[safeNodeId] || 0;
    const totalPoints = NODE_IDS.reduce((sum, id) => sum + (entry.nodes[id] || 0), 0);
    return 16 + nodeLevel * 8 + Math.floor(totalPoints * 2.2) + Math.floor(Math.pow(nodeLevel, 1.45) * 3);
  }

  function spendMasteryPoint(progress, classId, nodeId) {
    const safeClassId = CLASS_IDS.includes(classId) ? classId : "warrior";
    const safeNodeId = NODE_IDS.includes(nodeId) ? nodeId : "attack";
    const next = normalizeProgress(progress);
    const cost = getMasteryNodeCost(next, safeClassId, safeNodeId);
    if (next.currencies.abyssShards < cost) {
      return { progress: next, spent: false, cost };
    }
    next.currencies.abyssShards -= cost;
    next.mastery[safeClassId].nodes[safeNodeId] += 1;
    next.mastery[safeClassId].points += 1;
    next.statistics.masteryPointsSpent += 1;
    return { progress: normalizeProgress(next), spent: true, cost };
  }

  function setHighestAscension(progress, ascensionLevel) {
    const next = normalizeProgress(progress);
    next.records.highestAscension = Math.max(
      next.records.highestAscension,
      normalizeInteger(ascensionLevel, 0, 0, MAX_ASCENSION_LEVEL),
    );
    return normalizeProgress(next);
  }

  function growthCurve(level) {
    const safeLevel = normalizeInteger(level, 0, 0, Number.MAX_SAFE_INTEGER);
    return Math.log1p(safeLevel) * 1.65;
  }

  function roundBonus(value) {
    return Math.round(value * 10000) / 10000;
  }

  function calculateGrowthBonuses(classId, nodes) {
    const safeClassId = CLASS_IDS.includes(classId) ? classId : "warrior";
    const attack = growthCurve(nodes?.attack || 0);
    const survival = growthCurve(nodes?.survival || 0);
    const speed = growthCurve(nodes?.speed || 0);
    const special = growthCurve(nodes?.special || 0);
    const bonuses = {
      damageMul: 1 + Math.min(0.45, attack * 0.018),
      maxHpMul: 1 + Math.min(0.42, survival * 0.02),
      speedMul: 1 + Math.min(0.2, speed * 0.011),
      skillCooldownMul: 1 - Math.min(0.22, speed * 0.012),
      armorBonus: 0,
      critChanceBonus: 0,
      projectileSpeedMul: 1,
      poisonDurationMul: 1,
      skillDamageMul: 1,
      areaMul: 1,
      constructDamageMul: 1,
      constructDurationMul: 1,
      droneCooldownMul: 1,
      tauntRangeMul: 1,
      meleeRangeMul: 1,
    };
    if (safeClassId === "warrior") {
      bonuses.armorBonus = Math.min(4, survival * 0.12 + special * 0.18);
      bonuses.tauntRangeMul = 1 + Math.min(0.28, special * 0.018);
      bonuses.meleeRangeMul = 1 + Math.min(0.16, special * 0.011);
    } else if (safeClassId === "ranger") {
      bonuses.critChanceBonus = Math.min(0.16, special * 0.01);
      bonuses.projectileSpeedMul = 1 + Math.min(0.28, special * 0.02);
      bonuses.poisonDurationMul = 1 + Math.min(0.35, special * 0.025);
    } else if (safeClassId === "mage") {
      bonuses.skillDamageMul = 1 + Math.min(0.36, special * 0.022);
      bonuses.areaMul = 1 + Math.min(0.24, special * 0.017);
      bonuses.skillCooldownMul *= 1 - Math.min(0.12, special * 0.006);
    } else if (safeClassId === "engineer") {
      bonuses.constructDamageMul = 1 + Math.min(0.38, special * 0.023);
      bonuses.constructDurationMul = 1 + Math.min(0.34, special * 0.023);
      bonuses.droneCooldownMul = 1 - Math.min(0.16, special * 0.009);
    }
    bonuses.damageMul = roundBonus(bonuses.damageMul);
    bonuses.maxHpMul = roundBonus(bonuses.maxHpMul);
    bonuses.speedMul = roundBonus(bonuses.speedMul);
    bonuses.skillCooldownMul = roundBonus(Math.max(0.62, bonuses.skillCooldownMul));
    bonuses.armorBonus = roundBonus(bonuses.armorBonus);
    bonuses.critChanceBonus = roundBonus(bonuses.critChanceBonus);
    bonuses.projectileSpeedMul = roundBonus(bonuses.projectileSpeedMul);
    bonuses.poisonDurationMul = roundBonus(bonuses.poisonDurationMul);
    bonuses.skillDamageMul = roundBonus(bonuses.skillDamageMul);
    bonuses.areaMul = roundBonus(bonuses.areaMul);
    bonuses.constructDamageMul = roundBonus(bonuses.constructDamageMul);
    bonuses.constructDurationMul = roundBonus(bonuses.constructDurationMul);
    bonuses.droneCooldownMul = roundBonus(Math.max(0.6, bonuses.droneCooldownMul));
    bonuses.tauntRangeMul = roundBonus(bonuses.tauntRangeMul);
    bonuses.meleeRangeMul = roundBonus(bonuses.meleeRangeMul);
    return bonuses;
  }

  function getGrowthLoadout(progress, classId, ascensionLevel) {
    const normalized = normalizeProgress(progress);
    const safeClassId = CLASS_IDS.includes(classId) ? classId : "warrior";
    const entry = normalized.mastery[safeClassId] || createDefaultMasteryEntry();
    const safeAscension = normalizeInteger(
      ascensionLevel ?? normalized.records.highestAscension,
      0,
      0,
      MAX_ASCENSION_LEVEL,
    );
    return {
      version: SAVE_VERSION,
      classId: safeClassId,
      accountLevel: normalized.account.level,
      ascensionLevel: safeAscension,
      points: entry.points,
      nodes: { ...entry.nodes },
      bonuses: calculateGrowthBonuses(safeClassId, entry.nodes),
    };
  }

  function normalizeResultNumber(value, fallback = 0) {
    return normalizeInteger(value, fallback, 0, Number.MAX_SAFE_INTEGER);
  }

  function calculateRunRewards(result) {
    const outcome = result?.outcome === "victory" ? "victory" : "defeat";
    const stagesCleared = normalizeResultNumber(result?.stagesCleared ?? result?.wave, 0);
    const highestLevel = normalizeResultNumber(result?.highestLevel, 1);
    const totalScore = normalizeResultNumber(result?.totalScore, 0);
    const totalRelics = normalizeResultNumber(result?.totalRelics, 0);
    const abyssDepth = normalizeResultNumber(result?.abyssDepth, 0);
    const ascensionLevel = normalizeInteger(result?.ascensionLevel, 0, 0, MAX_ASCENSION_LEVEL);
    const progressReward = Math.floor(stagesCleared * 5 + highestLevel * 2 + totalRelics * 3 + Math.sqrt(totalScore) * 0.42);
    const victoryReward = outcome === "victory" ? 45 : 0;
    const abyssReward = abyssDepth > 0 ? abyssDepth * 18 + Math.floor(Math.pow(abyssDepth, 1.22) * 8) : 0;
    const ascensionMultiplier = 1 + ascensionLevel * 0.08;
    const rawShards = Math.max(2, Math.floor((progressReward + victoryReward + abyssReward) * ascensionMultiplier));
    const rawXp = Math.max(10, Math.floor(rawShards * 1.75 + stagesCleared * 3 + highestLevel * 6));
    const rewardBreakdown = [
      { id: "progress", label: "진행 보상", value: progressReward },
      { id: "victory", label: "승리 보너스", value: victoryReward },
      { id: "abyss", label: "심연 보너스", value: abyssReward },
      { id: "ascension", label: "승천 배율", value: ascensionLevel > 0 ? `${Math.round(ascensionMultiplier * 100)}%` : "100%" },
    ];
    return {
      earnedShards: rawShards,
      earnedAccountXp: rawXp,
      abyssDepth,
      ascensionLevel,
      rewardBreakdown,
    };
  }

  function recordRunResult(progress, result) {
    const next = normalizeProgress(progress);
    const resultKey = typeof result?.resultKey === "string" ? result.resultKey : "";
    if (resultKey && next.records.lastRunKey === resultKey) {
      return next;
    }
    const rewards = calculateRunRewards(result || {});
    const earnedShards = normalizeResultNumber(result?.earnedShards, rewards.earnedShards);
    const earnedAccountXp = normalizeResultNumber(result?.earnedAccountXp, rewards.earnedAccountXp);
    const chapter = normalizeResultNumber(result?.chapter ?? result?.floor, 1);
    const stage = normalizeResultNumber(result?.wave ?? result?.stagesCleared, 0);
    const highestLevel = normalizeResultNumber(result?.highestLevel, 1);
    const totalScore = normalizeResultNumber(result?.totalScore, 0);
    const totalRelics = normalizeResultNumber(result?.totalRelics, 0);
    const durationSec = normalizeResultNumber(result?.durationSec, 0);
    const outcome = result?.outcome === "victory" ? "victory" : "defeat";

    next.statistics.runs += 1;
    if (outcome === "victory") {
      next.statistics.victories += 1;
    } else {
      next.statistics.defeats += 1;
    }
    next.statistics.highestChapter = Math.max(next.statistics.highestChapter, chapter);
    next.statistics.highestStage = Math.max(next.statistics.highestStage, stage);
    next.statistics.highestLevel = Math.max(next.statistics.highestLevel, highestLevel);
    next.statistics.totalScore += totalScore;
    next.statistics.totalRelics += totalRelics;
    next.statistics.totalPlaySeconds += durationSec;
    next.statistics.totalAbyssShards += earnedShards;
    next.statistics.totalAccountXp += earnedAccountXp;
    next.currencies.abyssShards += earnedShards;
    next.account = levelAccount({
      level: next.account.level,
      xp: next.account.xp + earnedAccountXp,
    });
    next.records.highestAbyssDepth = Math.max(next.records.highestAbyssDepth, rewards.abyssDepth);
    if (outcome === "victory") {
      const unlockedAscensionLevel = normalizeInteger(
        result?.unlockedAscensionLevel,
        Math.min(MAX_ASCENSION_LEVEL, rewards.ascensionLevel + 1),
        0,
        MAX_ASCENSION_LEVEL,
      );
      next.records.highestAscension = Math.max(next.records.highestAscension, unlockedAscensionLevel);
    }
    next.records.lastRunKey = resultKey || `${Date.now()}:${outcome}:${chapter}:${stage}:${totalScore}`;

    if (
      outcome === "victory" &&
      (!next.bestClear ||
        chapter > (next.bestClear.chapter || 0) ||
        (chapter === (next.bestClear.chapter || 0) && stage >= (next.bestClear.stage || 0)))
    ) {
      next.bestClear = {
        outcome,
        chapter,
        stage,
        cleared: outcome === "victory",
        totalScore,
        durationSec,
        completedAt: new Date().toISOString(),
      };
    }
    return normalizeProgress(next);
  }

  const manager = {
    SAVE_VERSION,
    PROGRESS_KEY,
    LEGACY_PROGRESS_KEYS,
    CLASS_IDS,
    MASTERY_NODE_DEFS,
    MAX_ASCENSION_LEVEL,
    defaultProgress,
    normalizeProgress,
    migrateProgress,
    loadUserProgress,
    saveUserProgress,
    resetUserProgress,
    exportUserProgress,
    importUserProgress,
    recordRunResult,
    calculateRunRewards,
    getMasteryNodeCost,
    spendMasteryPoint,
    setHighestAscension,
    calculateGrowthBonuses,
    getGrowthLoadout,
    getAccountXpToNext,
  };
  window.RogueSaveManager = manager;
  window.RogueProgressSave = manager;
})();
