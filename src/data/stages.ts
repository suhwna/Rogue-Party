import { MAP_DEPTH } from "./balance";
import { type StageKind } from "./rewards";

export interface StageNodeMeta {
  readonly label: string;
  readonly glyph: string;
  readonly text: string;
}

export interface ChapterStageProfile {
  readonly chapter: number;
  readonly name: string;
  readonly theme: string;
  readonly combatFocus: string;
  readonly visualTone: {
    readonly base: string;
    readonly side: string;
    readonly torch: string;
    readonly torchSoft: string;
    readonly scarA: string;
    readonly scarB: string;
    readonly fog: string;
    readonly rune: string;
  };
  readonly stagePressureMul: number;
  readonly specialEnemyBudget: number;
  readonly bossTelegraphBias: number;
}

export const CHAPTER_STAGE_PROFILES = {
  1: {
    chapter: 1,
    name: "Old Gate",
    theme: "stone corridors and iron patrols",
    combatFocus: "learning enemy tells and basic routing",
    visualTone: {
      base: "#0f0c0c",
      side: "#11100f",
      torch: "#f97316",
      torchSoft: "#facc15",
      scarA: "#d6b76d",
      scarB: "#7e9fb2",
      fog: "#3f2f24",
      rune: "#d6b76d",
    },
    stagePressureMul: 1,
    specialEnemyBudget: 0.72,
    bossTelegraphBias: 1.12,
  },
  2: {
    chapter: 2,
    name: "Green Warren",
    theme: "ritual gardens and poison lanes",
    combatFocus: "mixed roles, area denial, and rescue pressure",
    visualTone: {
      base: "#09140f",
      side: "#0d1c13",
      torch: "#84cc16",
      torchSoft: "#bef264",
      scarA: "#84cc16",
      scarB: "#6ba79e",
      fog: "#16351f",
      rune: "#bef264",
    },
    stagePressureMul: 1.18,
    specialEnemyBudget: 0.94,
    bossTelegraphBias: 1.04,
  },
  3: {
    chapter: 3,
    name: "Void Crown",
    theme: "fractured halls and predictive pressure",
    combatFocus: "boss pressure, movement checks, and coordinated burst windows",
    visualTone: {
      base: "#080913",
      side: "#0d1020",
      torch: "#8b5cf6",
      torchSoft: "#93c5fd",
      scarA: "#b985c8",
      scarB: "#7e9fb2",
      fog: "#171b3d",
      rune: "#93c5fd",
    },
    stagePressureMul: 1.38,
    specialEnemyBudget: 1.12,
    bossTelegraphBias: 1,
  },
} as const satisfies Record<number, ChapterStageProfile>;

export const STAGE_NODE_META = {
  combat: {
    label: "NORMAL",
    glyph: "N",
    text: "Standard fight with mixed enemies.",
  },
  elite: {
    label: "ELITE",
    glyph: "E",
    text: "Elite enemies appear. Higher risk, better reward chance.",
  },
  miniboss: {
    label: "MINI BOSS",
    glyph: "M",
    text: "A smaller boss blocks this route.",
  },
  defense: {
    label: "DEFENSE",
    glyph: "D",
    text: "Protect the target. Ranged enemies do not appear.",
  },
  blockade: {
    label: "BLOCK",
    glyph: "K",
    text: "Stop runners from reaching the left gate.",
  },
  random: {
    label: "RANDOM",
    glyph: "?",
    text: "Unknown room. Reveals when the stage starts.",
  },
  reward: {
    label: "REWARD",
    glyph: "R",
    text: "Collect three relic chests. Rare route.",
  },
  boss: {
    label: "BOSS",
    glyph: "B",
    text: "Chapter boss.",
  },
} as const satisfies Record<StageKind, StageNodeMeta>;

export const BLOCKADE_RUNNER_TYPES = ["runner", "runner_tank", "runner_fast"] as const;
export const DEFENSE_ALLOWED_TYPES = ["slime", "bat", "brute", "bomber", "charger", "splitter", "guardian"] as const;

export const STAGE_ROUTE_WEIGHTS = {
  earlyCombat: 0.38,
  combat: 0.31,
  defense: 0.16,
  blockade: 0.15,
  minibossEarly: 0.08,
  minibossLate: 0.12,
  random: 0.11,
  reward: 0.06,
  eliteEarly: 0.04,
  elite: 0.09,
} as const;

export function getStageNodeMeta(kind: string | null | undefined): StageNodeMeta {
  return STAGE_NODE_META[isStageNodeKind(kind) ? kind : "combat"];
}

export function getChapterStageProfile(chapter: number): ChapterStageProfile {
  const index = Math.max(1, Math.min(3, Math.round(chapter || 1))) as keyof typeof CHAPTER_STAGE_PROFILES;
  return CHAPTER_STAGE_PROFILES[index] || CHAPTER_STAGE_PROFILES[1];
}

export function isStageNodeKind(kind: string | null | undefined): kind is StageKind {
  return Boolean(kind && Object.prototype.hasOwnProperty.call(STAGE_NODE_META, kind));
}

export function isBossDepth(depth: number): boolean {
  return Math.round(depth) >= MAP_DEPTH;
}
