export interface BossProfileLike {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly color: string;
  readonly pattern: string;
  readonly signaturePatterns?: readonly string[];
  readonly phasePatterns?: Readonly<Record<string | number, readonly string[]>>;
}

export interface BossProfileView {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly color: string;
  readonly pattern: string;
  readonly signaturePatterns: readonly string[];
  readonly phasePatterns?: Readonly<Record<string | number, readonly string[]>> | null;
}

export interface BossPhaseEnemyLike {
  readonly hp: number;
  readonly maxHp: number;
  readonly bossPhase: number;
}

export interface BossPhaseTransition {
  readonly phase: number;
  readonly cadenceMul: number;
  readonly minCadence: number;
  readonly damageMul: number;
  readonly barrierRatio: number;
  readonly barrierTime: number;
  readonly warningRadiusBonus: number;
}

export interface BossPatternEnemyLike {
  bossPatternCursor?: number;
  bossCycle?: number;
  currentBossPattern?: string;
  bossPhase?: number;
}

function clampChapter(chapter: number | undefined, maxChapters: number): number {
  return Math.max(1, Math.min(maxChapters || 1, Math.round(chapter || 1)));
}

export function getChapterBossProfile<TProfile>(
  chapter: number | undefined,
  bosses: Record<number, TProfile>,
  maxChapters: number,
): TProfile {
  const index = clampChapter(chapter, maxChapters);
  return bosses[index] ?? bosses[1]!;
}

export function getMiniBossProfile<TProfile>(
  chapter: number | undefined,
  miniBosses: Record<number, TProfile>,
  maxChapters: number,
): TProfile {
  const index = clampChapter(chapter, maxChapters);
  return miniBosses[index] ?? miniBosses[1]!;
}

export function getBossProfileById<TProfile extends { readonly id: string }>(
  id: string | undefined,
  bosses: Record<number, TProfile>,
): TProfile | null {
  return Object.values(bosses).find((boss) => boss.id === id) ?? null;
}

export function bossProfileView(profile: BossProfileLike | null | undefined): BossProfileView | null {
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name,
    text: profile.text,
    color: profile.color,
    pattern: profile.pattern,
    signaturePatterns: profile.signaturePatterns ?? [],
    phasePatterns: profile.phasePatterns ?? null,
  };
}

export function getPhasePatterns(
  profile: Pick<BossProfileLike, "signaturePatterns" | "phasePatterns"> | null | undefined,
  phase: number | undefined,
  fallbackPatterns: readonly string[] = [],
): string[] {
  const phaseKey = Math.max(1, Math.floor(phase ?? 1));
  const phasePatterns = profile?.phasePatterns?.[phaseKey];
  if (phasePatterns?.length) {
    return phasePatterns.filter((pattern) => typeof pattern === "string" && pattern.trim().length > 0);
  }
  return getSignaturePatterns(profile, fallbackPatterns);
}

export function getSignaturePatterns(
  profile: Pick<BossProfileLike, "signaturePatterns"> | null | undefined,
  fallbackPatterns: readonly string[] = [],
): string[] {
  const source = profile?.signaturePatterns?.length ? profile.signaturePatterns : fallbackPatterns;
  return source.filter((pattern) => typeof pattern === "string" && pattern.trim().length > 0);
}

export function nextBossPattern(
  enemy: BossPatternEnemyLike,
  profile: Pick<BossProfileLike, "signaturePatterns" | "phasePatterns"> | null | undefined,
  fallbackPatterns: readonly string[] = [],
): string {
  const patterns = getPhasePatterns(profile, enemy.bossPhase, fallbackPatterns);
  if (!patterns.length) return "";
  const cursor = Math.max(0, Math.floor(enemy.bossPatternCursor ?? 0));
  let patternIndex = cursor % patterns.length;
  if (patterns.length > 1 && patterns[patternIndex] === enemy.currentBossPattern) {
    patternIndex = (patternIndex + 1) % patterns.length;
  }
  const pattern = patterns[patternIndex]!;
  enemy.bossPatternCursor = patternIndex + 1;
  enemy.bossCycle = (enemy.bossCycle ?? 0) + 1;
  enemy.currentBossPattern = pattern;
  return pattern;
}

export function getBossPhaseTransition(enemy: BossPhaseEnemyLike): BossPhaseTransition | null {
  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  if (hpRatio <= 0.7 && enemy.bossPhase < 2) {
    return {
      phase: 2,
      cadenceMul: 0.9,
      minCadence: 0.72,
      damageMul: 1.08,
      barrierRatio: 0.14,
      barrierTime: 6.0,
      warningRadiusBonus: 120,
    };
  }
  if (hpRatio <= 0.38 && enemy.bossPhase < 3) {
    return {
      phase: 3,
      cadenceMul: 0.9,
      minCadence: 0.7,
      damageMul: 1.07,
      barrierRatio: 0.11,
      barrierTime: 5.0,
      warningRadiusBonus: 150,
    };
  }
  return null;
}
