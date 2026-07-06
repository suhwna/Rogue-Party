export const RARITY_IDS = ["common", "uncommon", "rare", "unique", "legendary", "mythic"] as const;

export type RarityId = (typeof RARITY_IDS)[number];

export interface RarityMeta {
  readonly label: string;
  readonly score: number;
  readonly relicWeight: number;
  readonly skillWeight: number;
  readonly maxLevel: number;
}

export const RARITY_META = {
  common: { label: "COMMON", score: 1, relicWeight: 54, skillWeight: 42, maxLevel: 3 },
  uncommon: { label: "UNCOMMON", score: 2, relicWeight: 28, skillWeight: 28, maxLevel: 2 },
  rare: { label: "RARE", score: 3, relicWeight: 13, skillWeight: 17, maxLevel: 2 },
  unique: { label: "UNIQUE", score: 4, relicWeight: 4.8, skillWeight: 7.2, maxLevel: 1 },
  legendary: { label: "LEGENDARY", score: 5, relicWeight: 1.1, skillWeight: 2.2, maxLevel: 1 },
  mythic: { label: "MYTHIC", score: 6, relicWeight: 0.24, skillWeight: 0.62, maxLevel: 1 },
} as const satisfies Record<RarityId, RarityMeta>;

export const LEGACY_RARITY_ALIASES: Record<string, RarityId> = {
  epic: "unique",
};

export function normalizeRarity(rarity: string | null | undefined): RarityId {
  if (!rarity) return "common";
  const alias = LEGACY_RARITY_ALIASES[rarity];
  if (alias) return alias;
  return isRarityId(rarity) ? rarity : "common";
}

export function isRarityId(rarity: string): rarity is RarityId {
  return Object.prototype.hasOwnProperty.call(RARITY_META, rarity);
}

export function getRarityLabel(rarity: string | null | undefined): string {
  return RARITY_META[normalizeRarity(rarity)].label;
}

export function rarityScore(rarity: string | null | undefined): number {
  return RARITY_META[normalizeRarity(rarity)].score;
}

export function getRarityMaxLevel(rarity: string | null | undefined): number {
  return RARITY_META[normalizeRarity(rarity)].maxLevel;
}
