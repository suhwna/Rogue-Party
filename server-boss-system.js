function clampChapter(chapter, maxChapters) {
  return Math.max(1, Math.min(maxChapters || 1, Math.round(chapter || 1)));
}

function getChapterBossProfile(chapter, bosses, maxChapters) {
  const index = clampChapter(chapter, maxChapters);
  return bosses[index] || bosses[1];
}

function getMiniBossProfile(chapter, miniBosses, maxChapters) {
  const index = clampChapter(chapter, maxChapters);
  return miniBosses[index] || miniBosses[1];
}

function getBossProfileById(id, bosses) {
  return Object.values(bosses || {}).find((boss) => boss.id === id) || null;
}

function bossProfileView(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    text: profile.text,
    chapterTitle: profile.chapterTitle || "",
    role: profile.role || "",
    color: profile.color,
    pattern: profile.pattern,
    patternTags: Array.isArray(profile.patternTags) ? profile.patternTags : [],
    signaturePatterns: Array.isArray(profile.signaturePatterns) ? profile.signaturePatterns : [],
    phasePatterns: profile.phasePatterns || null,
    phaseTitles: Array.isArray(profile.phaseTitles) ? profile.phaseTitles : [],
    telegraph: profile.telegraph || null,
    patternMix: profile.patternMix || null
  };
}

function getPhasePatterns(profile, phase, fallbackPatterns) {
  const phaseKey = String(Math.max(1, Math.floor(phase || 1)));
  const phasePatterns = profile?.phasePatterns?.[phaseKey] || profile?.phasePatterns?.[Number(phaseKey)];
  if (Array.isArray(phasePatterns) && phasePatterns.length) {
    return phasePatterns.filter((pattern) => typeof pattern === "string" && pattern.trim());
  }
  return getSignaturePatterns(profile, fallbackPatterns);
}

function getSignaturePatterns(profile, fallbackPatterns) {
  const fallback = Array.isArray(fallbackPatterns) ? fallbackPatterns : [];
  const source = Array.isArray(profile?.signaturePatterns) && profile.signaturePatterns.length
    ? profile.signaturePatterns
    : fallback;
  return source.filter((pattern) => typeof pattern === "string" && pattern.trim());
}

function nextBossPattern(enemy, profile, fallbackPatterns) {
  const patterns = getPhasePatterns(profile, enemy.bossPhase, fallbackPatterns);
  if (!patterns.length) return "";
  const cursor = Math.max(0, Math.floor(enemy.bossPatternCursor || 0));
  let patternIndex = cursor % patterns.length;
  if (patterns.length > 1 && patterns[patternIndex] === enemy.currentBossPattern) {
    patternIndex = (patternIndex + 1) % patterns.length;
  }
  const pattern = patterns[patternIndex];
  enemy.bossPatternCursor = patternIndex + 1;
  enemy.bossCycle = (enemy.bossCycle || 0) + 1;
  enemy.currentBossPattern = pattern;
  return pattern;
}

function getBossPhaseTransition(enemy) {
  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  if (enemy.executionBoss) {
    if (hpRatio <= 0.8 && enemy.bossPhase < 2) {
      return {
        phase: 2,
        cadenceMul: 0.82,
        minCadence: 0.5,
        damageMul: 1.05,
        barrierRatio: 0.08,
        barrierTime: 5.0,
        warningRadiusBonus: 140
      };
    }
    if (hpRatio <= 0.55 && enemy.bossPhase < 3) {
      return {
        phase: 3,
        cadenceMul: 0.8,
        minCadence: 0.42,
        damageMul: 1.05,
        barrierRatio: 0.07,
        barrierTime: 4.4,
        warningRadiusBonus: 175
      };
    }
    if (hpRatio <= 0.28 && enemy.bossPhase < 4) {
      return {
        phase: 4,
        cadenceMul: 0.78,
        minCadence: 0.34,
        damageMul: 1.06,
        barrierRatio: 0.06,
        barrierTime: 4.0,
        warningRadiusBonus: 210
      };
    }
    return null;
  }

  if (hpRatio <= 0.72 && enemy.bossPhase < 2) {
    return {
      phase: 2,
      cadenceMul: 0.86,
      minCadence: 0.66,
      damageMul: 1.06,
      barrierRatio: 0.12,
      barrierTime: 5.5,
      warningRadiusBonus: 120
    };
  }
  if (hpRatio <= 0.4 && enemy.bossPhase < 3) {
    return {
      phase: 3,
      cadenceMul: 0.84,
      minCadence: 0.56,
      damageMul: 1.06,
      barrierRatio: 0.1,
      barrierTime: 4.6,
      warningRadiusBonus: 150
    };
  }
  return null;
}

module.exports = {
  bossProfileView,
  getSignaturePatterns,
  getBossPhaseTransition,
  getBossProfileById,
  getChapterBossProfile,
  getMiniBossProfile,
  getPhasePatterns,
  nextBossPattern
};
