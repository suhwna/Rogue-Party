export const STAGE_KINDS = ["combat", "elite", "miniboss", "defense", "blockade", "random", "reward", "boss"] as const;

export type StageKind = (typeof STAGE_KINDS)[number];

export interface StageRewardRule {
  readonly xpMul: number;
  readonly clearXp: number;
  readonly chestBonus: number;
  readonly clearChest: number;
  readonly label: string;
}

export const STAGE_REWARD_RULES = {
  combat: { xpMul: 1, clearXp: 14, chestBonus: 0, clearChest: 0, label: "Normal reward" },
  elite: { xpMul: 1.08, clearXp: 26, chestBonus: 0.01, clearChest: 1, label: "Elite reward" },
  miniboss: { xpMul: 1.12, clearXp: 38, chestBonus: 0.014, clearChest: 1, label: "Mini-boss reward" },
  defense: { xpMul: 1.05, clearXp: 24, chestBonus: 0.008, clearChest: 0, label: "Defense reward" },
  blockade: { xpMul: 1.06, clearXp: 24, chestBonus: 0.009, clearChest: 0, label: "Blockade reward" },
  random: { xpMul: 1.09, clearXp: 28, chestBonus: 0.009, clearChest: 0, label: "Random reward" },
  reward: { xpMul: 0.62, clearXp: 6, chestBonus: 0, clearChest: 0, label: "Treasure reward" },
  boss: { xpMul: 1.18, clearXp: 54, chestBonus: 0.016, clearChest: 0, label: "Boss reward" },
} as const satisfies Record<StageKind, StageRewardRule>;

export function getStageRewardRule(kind: string | null | undefined): StageRewardRule {
  return STAGE_REWARD_RULES[isStageKind(kind) ? kind : "combat"];
}

export function isStageKind(kind: string | null | undefined): kind is StageKind {
  return Boolean(kind && Object.prototype.hasOwnProperty.call(STAGE_REWARD_RULES, kind));
}
