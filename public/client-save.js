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
    { id: "damage", label: "피해 증폭", description: "모든 피해 증가량에 합산됩니다." },
    { id: "maxHp", label: "최대 체력", description: "캐릭터의 최대 체력이 증가합니다." },
    { id: "regen", label: "체력 재생", description: "초당 체력 회복량이 증가합니다." },
    { id: "moveSpeed", label: "이동 속도", description: "캐릭터의 이동 속도가 증가합니다." },
    { id: "attackSpeed", label: "공격 속도", description: "기본 공격과 기계공 터렛·드론의 공격 속도가 증가합니다. 공격 간격은 기본 간격 × 100 / (100 + 공격 속도)입니다." },
    { id: "cooldown", label: "스킬 가속", description: "스킬 가속이 증가합니다. 실제 쿨타임은 기본 쿨타임 × 100 / (100 + 스킬 가속)입니다." },
    { id: "critDamage", label: "치명타 피해", description: "치명타로 주는 피해가 증가합니다." },
    { id: "area", label: "범위", description: "범위 공격과 폭발의 크기가 증가합니다." },
  ]);
  const NODE_IDS = MASTERY_NODE_DEFS.map((node) => node.id);
  const LEGACY_NODE_FALLBACKS = Object.freeze({
    damage: "attack",
    maxHp: "survival",
    regen: "survival",
    moveSpeed: "speed",
    attackSpeed: "",
    cooldown: "speed",
    critDamage: "attack",
    area: "special",
  });
  const MAX_ASCENSION_LEVEL = 5;
  const ASCENSION_REWARD_MULTIPLIERS = Object.freeze([1, 2, 4, 8, 12, 16]);
  const SHARED_MASTERY_KEY = "shared";

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
    return { [SHARED_MASTERY_KEY]: createDefaultMasteryEntry() };
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
      const legacyNodeId = LEGACY_NODE_FALLBACKS[nodeId];
      next[nodeId] = normalizeInteger(sourceNodes[nodeId] ?? sourceNodes[legacyNodeId], 0, 0, Number.MAX_SAFE_INTEGER);
      return next;
    }, {});
    const spent = NODE_IDS.reduce((sum, nodeId) => sum + nodes[nodeId], 0);
    return {
      points: normalizeInteger(entry?.points, spent, spent, Number.MAX_SAFE_INTEGER),
      nodes,
    };
  }

  function normalizeMasteryMap(mastery) {
    const source = mastery && typeof mastery === "object" ? mastery : {};
    if (source[SHARED_MASTERY_KEY]) {
      return { [SHARED_MASTERY_KEY]: normalizeMasteryEntry(source[SHARED_MASTERY_KEY]) };
    }
    const shared = createDefaultMasteryEntry();
    for (const classId of CLASS_IDS) {
      const legacy = normalizeMasteryEntry(source[classId]);
      for (const nodeId of NODE_IDS) shared.nodes[nodeId] += legacy.nodes[nodeId] || 0;
    }
    shared.points = NODE_IDS.reduce((sum, nodeId) => sum + shared.nodes[nodeId], 0);
    return { [SHARED_MASTERY_KEY]: shared };
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
    const safeNodeId = NODE_IDS.includes(nodeId) ? nodeId : "damage";
    const normalized = normalizeProgress(progress);
    const entry = normalized.mastery[SHARED_MASTERY_KEY] || createDefaultMasteryEntry();
    const nodeLevel = entry.nodes[safeNodeId] || 0;
    const totalPoints = NODE_IDS.reduce((sum, id) => sum + (entry.nodes[id] || 0), 0);
    return 8 + nodeLevel * 4 + Math.floor(totalPoints * 0.8) + Math.floor(Math.pow(nodeLevel, 1.25) * 1.2);
  }

  function spendMasteryPoint(progress, classId, nodeId) {
    const safeNodeId = NODE_IDS.includes(nodeId) ? nodeId : "damage";
    const next = normalizeProgress(progress);
    const cost = getMasteryNodeCost(next, SHARED_MASTERY_KEY, safeNodeId);
    if (next.currencies.abyssShards < cost) {
      return { progress: next, spent: false, cost };
    }
    next.currencies.abyssShards -= cost;
    next.mastery[SHARED_MASTERY_KEY].nodes[safeNodeId] += 1;
    next.mastery[SHARED_MASTERY_KEY].points += 1;
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
    return Math.log1p(safeLevel) * 2.4;
  }

  function roundBonus(value) {
    return Math.round(value * 10000) / 10000;
  }

  function calculateGrowthBonuses(classId, nodes) {
    const damage = growthCurve(nodes?.damage || 0);
    const maxHp = growthCurve(nodes?.maxHp || 0);
    const regen = growthCurve(nodes?.regen || 0);
    const moveSpeed = growthCurve(nodes?.moveSpeed || 0);
    const attackSpeed = growthCurve(nodes?.attackSpeed || 0);
    const cooldown = growthCurve(nodes?.cooldown || 0);
    const critDamage = growthCurve(nodes?.critDamage || 0);
    const area = growthCurve(nodes?.area || 0);
    const bonuses = {
      damageMul: 1 + Math.min(0.6, damage * 0.025),
      maxHpMul: 1 + Math.min(0.58, maxHp * 0.027),
      regenBonus: Math.min(2.5, regen * 0.08),
      speedMul: 1 + Math.min(0.26, moveSpeed * 0.014),
      attackSpeed: Math.min(40, attackSpeed * 2),
      skillHaste: Math.min(28, cooldown * 1.6),
      armorBonus: 0,
      critChanceBonus: 0,
      critDamageMul: 1 + Math.min(0.45, critDamage * 0.018),
      projectileSpeedMul: 1,
      poisonDurationMul: 1,
      skillDamageMul: 1,
      areaMul: 1 + Math.min(0.24, area * 0.012),
      constructDamageMul: 1,
      constructDurationMul: 1,
      droneCooldownMul: 1,
      tauntRangeMul: 1,
      meleeRangeMul: 1,
    };
    bonuses.damageMul = roundBonus(bonuses.damageMul);
    bonuses.maxHpMul = roundBonus(bonuses.maxHpMul);
    bonuses.regenBonus = roundBonus(bonuses.regenBonus);
    bonuses.speedMul = roundBonus(bonuses.speedMul);
    bonuses.attackSpeed = roundBonus(Math.min(500, bonuses.attackSpeed));
    bonuses.skillHaste = roundBonus(Math.min(500, bonuses.skillHaste));
    bonuses.armorBonus = roundBonus(bonuses.armorBonus);
    bonuses.critChanceBonus = roundBonus(bonuses.critChanceBonus);
    bonuses.critDamageMul = roundBonus(bonuses.critDamageMul);
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

  function calculateAccountLevelBonuses(accountLevel) {
    const gainedLevels = Math.max(0, normalizeInteger(accountLevel, 1, 1, Number.MAX_SAFE_INTEGER) - 1);
    return {
      damageMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
      maxHpMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
      regenBonus: roundBonus(Math.min(2, gainedLevels * 0.04)),
      speedMul: roundBonus(1 + Math.min(0.15, gainedLevels * 0.003)),
      skillHaste: roundBonus(Math.min(20, gainedLevels * 0.3)),
      armorBonus: roundBonus(Math.min(6, gainedLevels * 0.12)),
      critChanceBonus: roundBonus(Math.min(0.1, gainedLevels * 0.003)),
      critDamageMul: roundBonus(1 + Math.min(0.5, gainedLevels * 0.01)),
      areaMul: roundBonus(1 + Math.min(0.25, gainedLevels * 0.005)),
    };
  }

  function getGrowthLoadout(progress, classId, ascensionLevel) {
    const normalized = normalizeProgress(progress);
    const safeClassId = CLASS_IDS.includes(classId) ? classId : "warrior";
    const entry = normalized.mastery[SHARED_MASTERY_KEY] || createDefaultMasteryEntry();
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
      accountBonuses: calculateAccountLevelBonuses(normalized.account.level),
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
    const ascensionMultiplier = ASCENSION_REWARD_MULTIPLIERS[ascensionLevel] || 1;
    const challengeMultiplier = result?.challengeModifierId ? 1.15 : 1;
    const outcomeMultiplier = outcome === "victory" ? 2 : 0.5;
    const rewardBase = progressReward + victoryReward + abyssReward;
    const rawShards = Math.max(outcome === "victory" ? 6 : 1, Math.floor(rewardBase * ascensionMultiplier * challengeMultiplier * 1.45 * outcomeMultiplier));
    const rawXp = Math.max(outcome === "victory" ? 20 : 5, Math.floor((rewardBase * ascensionMultiplier * challengeMultiplier * 1.75 + stagesCleared * 3 + highestLevel * 6) * outcomeMultiplier));
    const rewardBreakdown = [
      { id: "progress", label: "진행 보상", value: progressReward },
      { id: "victory", label: "승리 보너스", value: victoryReward },
      { id: "abyss", label: "심연 보너스", value: abyssReward },
      { id: "ascension", label: "승천 배율", value: ascensionLevel > 0 ? `${Math.round(ascensionMultiplier * 100)}%` : "100%" },
      { id: "outcome", label: outcome === "victory" ? "런 성공 보너스" : "생존 실패 감산", value: `${Math.round(outcomeMultiplier * 100)}%` },
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
      next.records.highestAscension = Math.max(next.records.highestAscension, rewards.ascensionLevel);
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
    calculateAccountLevelBonuses,
    getGrowthLoadout,
    getAccountXpToNext,
  };
  window.RogueSaveManager = manager;
  window.RogueProgressSave = manager;
})();
