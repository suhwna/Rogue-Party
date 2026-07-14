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
  readonly modifierId?: string;
  readonly pattern: string;
  readonly patternTags?: readonly string[];
  readonly signaturePatterns?: readonly string[];
  readonly phasePatterns?: Readonly<Record<number, readonly string[]>>;
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
    modifierId: "safe_path",
    pattern: "charge",
    patternTags: ["charge_lane", "shockwave", "blade_beam"],
    signaturePatterns: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break", "iron_sweeping_arc", "iron_fortress_gap", "iron_furnace_refuge", "iron_anvil_corridor", "iron_rotor_barrage"],
    phasePatterns: {
      1: ["iron_cross_shock", "iron_beam_fan", "iron_ground_break"],
      2: ["iron_ground_break", "iron_anvil_corridor", "iron_sweeping_arc", "iron_furnace_refuge", "iron_cross_shock", "iron_beam_fan"],
      3: ["iron_rotor_barrage", "iron_furnace_refuge", "iron_fortress_gap", "iron_anvil_corridor", "iron_sweeping_arc", "iron_ground_break", "iron_cross_shock", "iron_beam_fan"],
    },
    phaseTitles: ["Armored Guard", "Broken Plating", "Overheated Core"],
    telegraph: { primary: 0.92, special: 1.08, phase: 1.48 },
    patternMix: { basic: 0.55, special: 0.34, punish: 0.11 },
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
    modifierId: "safe_path",
    pattern: "summon",
    patternTags: ["summon", "acid_pool", "barrier_rite"],
    signaturePatterns: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross", "hive_safe_bloom", "hive_venom_fan", "hive_spore_maelstrom", "hive_quarantine", "hive_creeping_orbit"],
    phasePatterns: {
      1: ["hive_bloom_adds", "hive_acid_ring", "hive_ritual_cross"],
      2: ["hive_safe_bloom", "hive_quarantine", "hive_spore_maelstrom", "hive_acid_ring", "hive_venom_fan", "hive_bloom_adds"],
      3: ["hive_creeping_orbit", "hive_spore_maelstrom", "hive_quarantine", "hive_venom_fan", "hive_safe_bloom", "hive_ritual_cross", "hive_acid_ring", "hive_bloom_adds"],
    },
    phaseTitles: ["Quiet Chant", "Blooming Rite", "Hungering Hive"],
    telegraph: { primary: 0.95, special: 1.11, phase: 1.56 },
    patternMix: { basic: 0.52, special: 0.35, punish: 0.13 },
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
    modifierId: "safe_path",
    pattern: "void",
    patternTags: ["void_beam", "prediction_snipe", "blast_grid"],
    signaturePatterns: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring", "void_mirror_volley", "void_collapse", "void_final_eclipse", "void_gravity_clock", "void_starless_trial"],
    phasePatterns: {
      1: ["void_reposition_snipe", "void_cross_laser", "void_orb_ring"],
      2: ["void_mirror_volley", "void_gravity_clock", "void_cross_laser", "void_final_eclipse", "void_reposition_snipe", "void_collapse"],
      3: ["void_starless_trial", "void_final_eclipse", "void_gravity_clock", "void_collapse", "void_mirror_volley", "void_orb_ring", "void_cross_laser", "void_reposition_snipe"],
    },
    phaseTitles: ["Distant Crown", "Fractured Orbit", "Regent Unbound"],
    telegraph: { primary: 0.86, special: 1, phase: 1.6 },
    patternMix: { basic: 0.48, special: 0.38, punish: 0.14 },
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
    signaturePatterns: ["duelist_cross", "duelist_charge", "duelist_cleave", "duelist_blade_fan", "duelist_guard_break", "duelist_pinwheel", "duelist_pincer"],
    phasePatterns: {
      1: ["duelist_cleave", "duelist_charge", "duelist_cross"],
      2: ["duelist_pinwheel", "duelist_blade_fan", "duelist_pincer", "duelist_charge", "duelist_guard_break", "duelist_cleave", "duelist_cross"],
    },
    phaseTitles: ["검투 자세", "해방된 연격"],
    telegraph: { primary: 0.76, special: 1.05, phase: 1.14 },
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
    signaturePatterns: ["plague_pool", "plague_spit_ring", "plague_barrier_burst", "plague_safe_bloom", "plague_venom_fan", "plague_spore_clock", "plague_quarantine"],
    phasePatterns: {
      1: ["plague_pool", "plague_spit_ring", "plague_barrier_burst"],
      2: ["plague_spore_clock", "plague_safe_bloom", "plague_quarantine", "plague_venom_fan", "plague_pool", "plague_barrier_burst", "plague_spit_ring"],
    },
    phaseTitles: ["잠복 감염", "번지는 역병"],
    telegraph: { primary: 0.83, special: 1.1, phase: 1.18 },
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
    signaturePatterns: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe", "hunter_crossfire", "hunter_marked_blast", "hunter_blink_ring", "hunter_ricochet"],
    phasePatterns: {
      1: ["hunter_shadow_stab", "hunter_shuriken_fan", "hunter_snipe"],
      2: ["hunter_blink_ring", "hunter_crossfire", "hunter_ricochet", "hunter_shadow_stab", "hunter_marked_blast", "hunter_shuriken_fan", "hunter_snipe"],
    },
    phaseTitles: ["그림자 추적", "공허의 사냥"],
    telegraph: { primary: 0.79, special: 1.08, phase: 1.2 },
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
