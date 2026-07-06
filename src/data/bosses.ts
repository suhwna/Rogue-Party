                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import { type ChapterIndex, normalizeChapterIndex } from "./difficulty";

export interface BossProfile {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly chapterTitle?: string;
  readonly role?: string;
  readonly color: string;
  readonly hpMul: number;
  readonly damageMul: number;
  readonly speedMul: number;
  readonly radiusMul?: number;
  readonly xpMul?: number;
  readonly traitId?: string;
  readonly modifierId?: string;
  readonly pattern: string;
  readonly patternTags?: readonly string[];
  readonly signaturePatterns?: readonly string[];
  readonly phaseTitles?: readonly string[];
  readonly telegraph?: {
    readonly primary: number;
    readonly special: number;
    readonly phase: number;
  };
  readonly patternMix?: {
    readonly basic: number;
    readonly special: number;
    readonly punish: number;
  };
  readonly escorts?: readonly string[];
}

export const CHAPTER_BOSSES = {
  1: {
    id: "iron_warden",
    name: "Iron Warden",
    text: "Armored charge boss. Dodge charge lanes, shockwaves, and blade beams.",
    chapterTitle: "Gate of Iron",
    role: "lane pressure bruiser",
    color: "#c9824c",
    hpMul: 2.35,
    damageMul: 1.14,
    speedMul: 1.08,
    radiusMul: 1.16,
    xpMul: 1.25,
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "charge",
    patternTags: ["charge_lane", "shockwave", "blade_beam"],
    signaturePatterns: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break"],
    phaseTitles: ["Armored Guard", "Broken Plating", "Overheated Core"],
    telegraph: { primary: 1.3, special: 1.65, phase: 1.8 },
    patternMix: { basic: 0.7, special: 0.24, punish: 0.06 },
    escorts: ["guardian", "charger"],
  },
  2: {
    id: "hive_prophet",
    name: "Hive Prophet",
    text: "Ritual boss. Break shields while dodging bloom blasts and poison rites.",
    chapterTitle: "Verdant Rite",
    role: "area denial summoner",
    color: "#6ba79e",
    hpMul: 3.55,
    damageMul: 1.22,
    speedMul: 0.98,
    radiusMul: 1.22,
    xpMul: 1.45,
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "summon",
    patternTags: ["summon", "acid_pool", "barrier_rite"],
    signaturePatterns: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"],
    phaseTitles: ["Quiet Chant", "Blooming Rite", "Hungering Hive"],
    telegraph: { primary: 1.35, special: 1.75, phase: 2.0 },
    patternMix: { basic: 0.68, special: 0.26, punish: 0.06 },
    escorts: ["shaman", "splitter", "spitter"],
  },
  3: {
    id: "void_regent",
    name: "Void Regent",
    text: "Final boss. Predictive blasts, void beams, and execution shots punish standing still.",
    chapterTitle: "Void Throne",
    role: "prediction and beam control",
    color: "#8d7cae",
    hpMul: 4.25,
    damageMul: 1.32,
    speedMul: 1.05,
    radiusMul: 1.32,
    xpMul: 1.7,
    traitId: "boss_gate",
    modifierId: "safe_path",
    pattern: "void",
    patternTags: ["void_beam", "prediction_snipe", "blast_grid"],
    signaturePatterns: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"],
    phaseTitles: ["Distant Crown", "Fractured Orbit", "Regent Unbound"],
    telegraph: { primary: 1.45, special: 1.85, phase: 2.15 },
    patternMix: { basic: 0.66, special: 0.27, punish: 0.07 },
    escorts: ["mortar", "sniper", "stalker"],
  },
} as const satisfies Record<ChapterIndex, BossProfile>;

export const MINI_BOSSES = {
  1: {
    id: "blade_duelist",
    name: "검투 문지기",
    text: "짧은 돌진과 전방 검격으로 압박하는 준보스입니다.",
    color: "#d6b76d",
    pattern: "duelist",
    role: "melee duel miniboss",
    patternTags: ["cleave", "short_charge"],
    signaturePatterns: ["duelist_cross", "duelist_charge", "duelist_cleave"],
    telegraph: { primary: 0.82, special: 1.14, phase: 1.2 },
    patternMix: { basic: 0.76, special: 0.2, punish: 0.04 },
    hpMul: 0.54,
    damageMul: 0.78,
    speedMul: 1.04,
  },
  2: {
    id: "plague_acolyte",
    name: "역병 의식술사",
    text: "독 장판과 느린 탄막으로 공간을 잠그는 준보스입니다.",
    color: "#9aa15f",
    pattern: "plague",
    role: "poison space control miniboss",
    patternTags: ["poison_pool", "spit", "ritual_burst"],
    signaturePatterns: ["plague_pool", "plague_spit_ring", "plague_barrier_burst"],
    telegraph: { primary: 0.9, special: 1.2, phase: 1.25 },
    patternMix: { basic: 0.74, special: 0.22, punish: 0.04 },
    hpMul: 0.82,
    damageMul: 0.86,
    speedMul: 0.98,
  },
  3: {
    id: "void_hunter",
    name: "공허 추적자",
    text: "순간 위치 전환과 표창, 짧은 저격으로 빈틈을 노리는 준보스입니다.",
    color: "#8d7cae",
    pattern: "hunter",
    role: "shadow pursuit miniboss",
    patternTags: ["shadow_stab", "shuriken", "blink"],
    signaturePatterns: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe"],
    telegraph: { primary: 0.86, special: 1.18, phase: 1.28 },
    patternMix: { basic: 0.72, special: 0.24, punish: 0.04 },
    hpMul: 0.86,
    damageMul: 0.92,
    speedMul: 1.12,
  },
} as const satisfies Record<ChapterIndex, BossProfile>;

export function getChapterBossProfile(chapter: number): BossProfile {
  return CHAPTER_BOSSES[normalizeChapterIndex(chapter)];
}

export function getMiniBossProfile(chapter: number): BossProfile {
  return MINI_BOSSES[normalizeChapterIndex(chapter)];
}

export function getBossProfileById(id: string): BossProfile | null {
  return Object.values(CHAPTER_BOSSES).find((boss) => boss.id === id) || null;
}
