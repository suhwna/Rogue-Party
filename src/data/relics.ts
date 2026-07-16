import { type ClassId } from "./classes";

export interface RelicDefinition {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly target: string;
  readonly icon: string;
  readonly classes?: readonly ClassId[];
  readonly maxLevel?: number;
}

export interface SupplyRewardDefinition extends RelicDefinition {
  readonly consumable: true;
}

export const DISABLED_RELIC_IDS = [] as const;

export const RELIC_DEFINITIONS = [
  {
    id: "power_core",
    name: "힘의 핵",
    text: "모든 피해 증폭이 10% 증가합니다.",
    target: "공용 · 공격",
    maxLevel: 5,
    icon: "힘",
  },
  {
    id: "iron_plate",
    name: "강철 갑판",
    text: "방어력이 1 증가합니다.",
    target: "공용 · 방어",
    maxLevel: 5,
    icon: "방",
  },
  {
    id: "swift_boots",
    name: "신속의 장화",
    text: "이동 속도가 10% 증가합니다.",
    target: "공용 · 이동",
    maxLevel: 5,
    icon: "속",
  },
  {
    id: "cooling_gear",
    name: "냉각 장치",
    text: "기본 공격과 스킬의 쿨타임이 10% 감소합니다.",
    target: "공용 · 쿨타임",
    maxLevel: 5,
    icon: "쿨",
  },
  {
    id: "splitter_core",
    name: "분열 핵",
    text: "투사체 계열 발사 수가 1 증가합니다. 최대 1중첩.",
    target: "공용 · 투사체",
    maxLevel: 1,
    icon: "분",
    classes: ["ranger", "mage", "engineer", "puppeteer", "alchemist"],
  },
  {
    id: "giant_lens",
    name: "거대 렌즈",
    text: "범위와 폭발 반경이 10% 증가합니다.",
    target: "공용 · 크기",
    maxLevel: 5,
    icon: "대",
  },
  {
    id: "sharp_eye",
    name: "예리한 눈",
    text: "치명타 확률이 5% 증가합니다.",
    target: "공용 · 치명타",
    maxLevel: 5,
    icon: "확",
  },
  {
    id: "fatal_mark",
    name: "치명 표식",
    text: "치명타 피해 배율에 10%p를 더합니다.",
    target: "공용 · 치명 피해",
    maxLevel: 5,
    icon: "치",
  },
  {
    id: "living_moss",
    name: "살아있는 이끼",
    text: "체력 재생량이 초당 0.5 증가합니다.",
    target: "공용 · 재생",
    maxLevel: 5,
    icon: "재",
  },
  {
    id: "heartstone",
    name: "심장석",
    text: "최대 체력이 25 증가합니다.",
    target: "공용 · 체력",
    maxLevel: 5,
    icon: "체",
  },
] as const satisfies readonly RelicDefinition[];

const RELIC_MAX_LEVEL_OVERRIDES: Record<string, number> = {
  splitter_core: 1,
};

export const SUPPLY_REWARDS = [
  {
    id: "supply_heal",
    name: "응급 보급",
    text: "즉시 체력을 35% 회복합니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    icon: "구",
    consumable: true,
  },
  {
    id: "supply_shield",
    name: "방어 보급",
    text: "짧은 보호막을 얻습니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    icon: "방",
    consumable: true,
  },
  {
    id: "supply_focus",
    name: "전술 보급",
    text: "현재 스킬 쿨다운을 4초 줄입니다. 유물로 보관되지 않습니다.",
    target: "소모성 보급",
    icon: "집",
    consumable: true,
  },
] as const satisfies readonly SupplyRewardDefinition[];

export const RELIC_BY_ID = Object.fromEntries(RELIC_DEFINITIONS.map((relic) => [relic.id, relic])) as Record<
  string,
  RelicDefinition
>;

export const SUPPLY_REWARD_BY_ID = Object.fromEntries(SUPPLY_REWARDS.map((reward) => [reward.id, reward])) as Record<
  string,
  SupplyRewardDefinition
>;

export function getRelicById(relicId: string): RelicDefinition | null {
  return RELIC_BY_ID[relicId] || null;
}

export function getSupplyRewardById(rewardId: string): SupplyRewardDefinition | null {
  return SUPPLY_REWARD_BY_ID[rewardId] || null;
}

export function getRelicOrSupplyById(itemId: string): RelicDefinition | SupplyRewardDefinition | null {
  return getRelicById(itemId) || getSupplyRewardById(itemId);
}

export function getRelicMaxLevel(relic: Pick<RelicDefinition, "id" | "maxLevel"> & { readonly consumable?: boolean }): number {
  const override = RELIC_MAX_LEVEL_OVERRIDES[relic.id];
  if (typeof override === "number" && Number.isFinite(override)) return override;
  if (typeof relic.maxLevel === "number" && Number.isFinite(relic.maxLevel)) {
    return Math.max(1, Math.floor(relic.maxLevel));
  }
  return relic.consumable ? 1 : 5;
}

export function isRelicDisabled(relicId: string): boolean {
  return (DISABLED_RELIC_IDS as readonly string[]).includes(relicId);
}

export function isRelicAvailableForClass(relic: RelicDefinition, classId: string): boolean {
  if (isRelicDisabled(relic.id)) return false;
  if (!relic.classes || relic.classes.length === 0) return true;
  return (relic.classes as readonly string[]).includes(classId);
}

export function getRelicsForClass(classId: string): readonly RelicDefinition[] {
  return RELIC_DEFINITIONS.filter((relic) => isRelicAvailableForClass(relic, classId));
}

export function getRelicChoiceWeight(_relic: Pick<RelicDefinition, "id">, _choiceBoost = 0, _progression = 1): number {
  return 1;
}
