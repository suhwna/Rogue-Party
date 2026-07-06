import { type EnemyType, type WeightedEnemyType } from "./enemies";

export const WAVE_TRAIT_KEYS = ["horde", "bulwark", "ritual", "volatile", "boss"] as const;

export type WaveTraitKey = (typeof WAVE_TRAIT_KEYS)[number];

export interface WaveTraitDefinition {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly spawnMul: number;
  readonly hpMul?: number;
  readonly damageMul?: number;
  readonly speedMul?: number;
  readonly anchorTypes: readonly EnemyType[];
  readonly bias: readonly WeightedEnemyType[];
}

export const WAVE_TRAITS = {
  horde: {
    id: "horde",
    name: "군세",
    text: "가벼운 적이 더 많이, 더 빠르게 몰려옵니다.",
    spawnMul: 1.28,
    speedMul: 1.1,
    anchorTypes: ["bat", "bomber", "splitter"],
    bias: [
      { type: "bat", weight: 0.26 },
      { type: "slime", weight: 0.28 },
      { type: "splitter", weight: 0.14 },
      { type: "bomber", weight: 0.12 },
      { type: "charger", weight: 0.04 },
      { type: "sniper", weight: 0.05 },
      { type: "stalker", weight: 0.04 },
      { type: "spitter", weight: 0.04 },
      { type: "brute", weight: 0.04 },
    ],
  },
  bulwark: {
    id: "bulwark",
    name: "방벽 진형",
    text: "수호자 오라와 투사, 포격수가 같이 압박합니다.",
    spawnMul: 0.96,
    hpMul: 1.22,
    damageMul: 1.02,
    anchorTypes: ["guardian", "brute", "mortar"],
    bias: [
      { type: "guardian", weight: 0.17 },
      { type: "brute", weight: 0.22 },
      { type: "slime", weight: 0.2 },
      { type: "bat", weight: 0.11 },
      { type: "mortar", weight: 0.08 },
      { type: "shaman", weight: 0.08 },
      { type: "splitter", weight: 0.08 },
      { type: "sniper", weight: 0.06 },
      { type: "spitter", weight: 0.05 },
    ],
  },
  ritual: {
    id: "ritual",
    name: "의식",
    text: "주술사와 저격수가 처치 우선순위를 흔듭니다.",
    spawnMul: 1,
    damageMul: 1,
    anchorTypes: ["shaman", "sniper", "spitter"],
    bias: [
      { type: "shaman", weight: 0.15 },
      { type: "sniper", weight: 0.16 },
      { type: "slime", weight: 0.22 },
      { type: "bat", weight: 0.14 },
      { type: "spitter", weight: 0.08 },
      { type: "mortar", weight: 0.07 },
      { type: "guardian", weight: 0.08 },
      { type: "charger", weight: 0.035 },
    ],
  },
  volatile: {
    id: "volatile",
    name: "폭주",
    text: "자폭병과 돌진병이 뭉친 파티를 강하게 압박합니다.",
    spawnMul: 1.06,
    damageMul: 1.08,
    speedMul: 1.06,
    anchorTypes: ["bomber", "charger", "splitter"],
    bias: [
      { type: "bomber", weight: 0.17 },
      { type: "charger", weight: 0.06 },
      { type: "bat", weight: 0.19 },
      { type: "slime", weight: 0.18 },
      { type: "splitter", weight: 0.1 },
      { type: "spitter", weight: 0.06 },
      { type: "sniper", weight: 0.06 },
      { type: "stalker", weight: 0.04 },
      { type: "brute", weight: 0.05 },
    ],
  },
  boss: {
    id: "boss_gate",
    name: "보스 관문",
    text: "문지기가 다양한 호위 몬스터와 함께 등장합니다.",
    spawnMul: 0.8,
    hpMul: 1.28,
    damageMul: 1.1,
    anchorTypes: ["brute", "guardian", "charger", "sniper"],
    bias: [
      { type: "guardian", weight: 0.12 },
      { type: "shaman", weight: 0.1 },
      { type: "spitter", weight: 0.1 },
      { type: "charger", weight: 0.05 },
      { type: "brute", weight: 0.18 },
      { type: "bomber", weight: 0.1 },
      { type: "mortar", weight: 0.08 },
      { type: "sniper", weight: 0.07 },
      { type: "stalker", weight: 0.025 },
      { type: "bat", weight: 0.08 },
      { type: "slime", weight: 0.08 },
    ],
  },
} as const satisfies Record<WaveTraitKey, WaveTraitDefinition>;

export function getWaveTraitByKey(key: string | null | undefined): WaveTraitDefinition {
  return WAVE_TRAITS[isWaveTraitKey(key) ? key : "horde"];
}

export function getWaveTraitById(id: string | null | undefined): WaveTraitDefinition {
  return Object.values(WAVE_TRAITS).find((trait) => trait.id === id) || WAVE_TRAITS.horde;
}

export function pickWaveTraitForWave(wave: number): WaveTraitDefinition {
  if (wave % 5 === 0) return WAVE_TRAITS.boss;
  const order = [WAVE_TRAITS.horde, WAVE_TRAITS.bulwark, WAVE_TRAITS.ritual, WAVE_TRAITS.volatile] as const;
  return order[(Math.max(1, Math.round(wave)) - 1) % order.length] || WAVE_TRAITS.horde;
}

export function isWaveTraitKey(key: string | null | undefined): key is WaveTraitKey {
  return Boolean(key && Object.prototype.hasOwnProperty.call(WAVE_TRAITS, key));
}
