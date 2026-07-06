import { type ClassId } from "./classes";
import { getRarityMaxLevel, normalizeRarity, RARITY_META, type RarityId } from "./rarity";

export interface RelicDefinition {
  readonly id: string;
  readonly name: string;
  readonly text: string;
  readonly rarity: RarityId;
  readonly target: string;
  readonly icon: string;
  readonly classes?: readonly ClassId[];
  readonly maxLevel?: number;
}

export interface SupplyRewardDefinition extends RelicDefinition {
  readonly consumable: true;
}

export const DISABLED_RELIC_IDS = [
  "swift_boots",
  "kinetic_spurs",
  "iron_oath",
  "heartstone",
  "living_moss",
  "glass_star",
  "execution_mark",
  "clockwork_core",
  "arcane_orbit",
  "longshot_lens",
  "pity_engine",
] as const;

export const RELIC_DEFINITIONS = [
  {
    id: "keen_blade",
    name: "예리한 칼날",
    text: "최종 피해 +18%. 기본 공격과 스킬 피해에 모두 적용됩니다.",
    rarity: "common",
    target: "공용",
    icon: "칼",
  },
  {
    id: "ember_core",
    name: "잿불 핵",
    text: "마법사 전용. 기본 공격과 운석의 폭발 반경이 크게 증가합니다.",
    rarity: "rare",
    target: "마법사 전용",
    classes: ["mage"],
    icon: "핵",
  },
  {
    id: "swift_boots",
    name: "신속의 장화",
    text: "이동 속도 +16%. 회피와 포지셔닝이 쉬워집니다.",
    rarity: "common",
    target: "공용",
    icon: "장",
  },
  {
    id: "wolf_clock",
    name: "늑대 시계",
    text: "기본 공격 재사용 대기시간 -14%. 평타 빌드에 좋습니다.",
    rarity: "common",
    target: "공용",
    icon: "시",
  },
  {
    id: "iron_oath",
    name: "강철 맹세",
    text: "최대 체력 +35, 방어 +8%. 생존력을 안정적으로 올립니다.",
    rarity: "common",
    target: "공용",
    icon: "맹",
  },
  {
    id: "glass_star",
    name: "유리별",
    text: "치명타 확률 +12%. 순간 화력을 노리는 선택입니다.",
    rarity: "rare",
    target: "공용",
    icon: "별",
  },
  {
    id: "vampire_charm",
    name: "흡혈 부적",
    text: "가한 피해의 6%만큼 체력을 회복합니다.",
    rarity: "rare",
    target: "공용",
    icon: "흡",
  },
  {
    id: "longshot_lens",
    name: "장거리 렌즈",
    text: "궁수 전용. 화살 사거리 +22%, 멀리서 우선순위를 처리하기 쉬워집니다.",
    rarity: "common",
    target: "궁수 전용",
    classes: ["ranger"],
    icon: "렌",
  },
  {
    id: "living_moss",
    name: "살아있는 이끼",
    text: "초당 체력 재생 +1.4. 긴 전투에서 유지력이 좋아집니다.",
    rarity: "rare",
    target: "공용",
    icon: "생",
  },
  {
    id: "comet_signet",
    name: "혜성 인장",
    text: "Q/E/R/F 스킬 재사용 대기시간 -20%. 직업 스킬 빌드에 좋습니다.",
    rarity: "unique",
    target: "공용",
    icon: "혜",
  },
  {
    id: "giants_pulse",
    name: "거인의 맥동",
    text: "전사 전용. 베기와 강철 회오리 범위 +24%. 전열 장악력이 커집니다.",
    rarity: "rare",
    target: "전사 전용",
    classes: ["warrior"],
    icon: "거",
  },
  {
    id: "party_banner",
    name: "파티 깃발",
    text: "스테이지 클리어 시 파티 회복량 +15%. 모두에게 체감되는 공용 지원 유물입니다.",
    rarity: "unique",
    target: "파티 공용",
    icon: "단",
  },
  {
    id: "vanguard_plate",
    name: "선봉 갑주",
    text: "전사 전용. 최대 체력 +45, 방어 +10%. 앞라인 유지력이 크게 증가합니다.",
    rarity: "common",
    target: "전사 전용",
    classes: ["warrior"],
    icon: "판",
  },
  {
    id: "hawk_fletching",
    name: "매 깃 화살",
    text: "궁수 전용. 기본 공격 피해 +12%, 치명타 확률 +8%. 원거리 처치력이 증가합니다.",
    rarity: "common",
    target: "궁수 전용",
    classes: ["ranger"],
    icon: "깃",
  },
  {
    id: "arcane_orbit",
    name: "비전 궤도",
    text: "마법사 전용. 마법 폭발 반경 +48px, 스킬 쿨다운 -8%. 광역 제압에 집중합니다.",
    rarity: "rare",
    target: "마법사 전용",
    classes: ["mage"],
    icon: "궤",
  },
  {
    id: "heartstone",
    name: "심장석",
    text: "최대 체력 +55, 초당 체력 재생 +0.8. 순수 생존형 공용 유물입니다.",
    rarity: "rare",
    target: "공용",
    icon: "석",
  },
  {
    id: "execution_mark",
    name: "처형 표식",
    text: "치명타 확률 +8%, 최종 피해 +8%. 공격형 공용 유물입니다.",
    rarity: "rare",
    target: "공용",
    icon: "표",
  },
  {
    id: "sanctuary_bell",
    name: "성역의 종",
    text: "성직자 전용. 최대 체력 +28, 스킬 쿨다운 -10%. 보호와 부활을 더 자주 돌립니다.",
    rarity: "common",
    target: "성직자 전용",
    classes: ["cleric"],
    icon: "종",
  },
  {
    id: "berserker_sigil",
    name: "광전사의 문장",
    text: "체력 40% 이하일 때 치명타 확률 +18%, 잃은 체력에 비례해 피해가 증가합니다.",
    rarity: "rare",
    target: "공용 · 저체력 빌드",
    icon: "광",
  },
  {
    id: "phase_boots",
    name: "위상 장화",
    text: "대시 쿨다운 -18%, 대시 거리 +10%. 위험 장판과 돌진병 대응이 쉬워집니다.",
    rarity: "common",
    target: "공용 · 기동",
    icon: "상",
  },
  {
    id: "reaper_coin",
    name: "사신의 동전",
    text: "적 처치 시 최대 체력의 3%를 회복합니다. 연속 처치 유지력이 좋아집니다.",
    rarity: "rare",
    target: "공용 · 처치",
    icon: "사",
  },
  {
    id: "clockwork_core",
    name: "시계태엽 핵",
    text: "적 처치 시 Q/E/R/F 쿨다운을 0.32초, 대시 쿨다운을 0.18초 줄입니다.",
    rarity: "rare",
    target: "공용 · 쿨다운",
    icon: "시",
  },
  {
    id: "hunter_contract",
    name: "사냥 계약",
    text: "엘리트/보스에게 피해 +22%, 유물 상자 드랍 확률이 소폭 증가합니다.",
    rarity: "rare",
    target: "공용 · 엘리트 사냥",
    icon: "계",
  },
  {
    id: "thornmail_fragment",
    name: "가시 갑편",
    text: "방어 +4%. 피해를 받으면 실제 받은 피해의 22%를 공격자에게 반사합니다.",
    rarity: "common",
    target: "공용 · 반격",
    icon: "가",
  },
  {
    id: "storm_capacitor",
    name: "폭풍 축전기",
    text: "감속/빙결/독/화상/취약/도발 상태의 적에게 최종 피해 +13%. 상태이상 빌드용입니다.",
    rarity: "rare",
    target: "공용 · 상태이상",
    icon: "폭",
  },
  {
    id: "glass_engine",
    name: "유리 엔진",
    text: "최종 피해 +28%, 치명타 +6%. 대신 최대 체력이 14% 감소합니다.",
    rarity: "unique",
    target: "공용 · 고위험 화력",
    icon: "유",
  },
  {
    id: "blood_pact",
    name: "피의 계약",
    text: "흡혈 +8%, 최종 피해 +8%. 대신 최대 체력 -12.",
    rarity: "rare",
    target: "공용 · 흡혈",
    icon: "혈",
  },
  {
    id: "pity_engine",
    name: "행운 장치",
    text: "유물 상자 드랍 확률이 증가합니다. 전투력 대신 보상 선택지를 넓힙니다.",
    rarity: "common",
    target: "공용 · 보상",
    icon: "복",
  },
  {
    id: "bulwark_seal",
    name: "방벽의 인장",
    text: "전사 전용. 대시 피해 +36%, 방어 +6%, 대시 쿨다운 -8%. 돌파형 전열 빌드입니다.",
    rarity: "rare",
    target: "전사 전용 · 대시",
    classes: ["warrior"],
    icon: "벽",
  },
  {
    id: "duelist_wrap",
    name: "결투가의 손목끈",
    text: "전사 전용. 기본 공격 쿨다운 -12%, 치명타 +6%. 베기 손맛을 강화합니다.",
    rarity: "common",
    target: "전사 전용 · 평타",
    classes: ["warrior"],
    icon: "결",
  },
  {
    id: "windrunner_quiver",
    name: "바람추적 화살통",
    text: "궁수 전용. 대시 쿨다운 -22%, 이동 속도 +6%, 기본 공격 사거리 +8%. 카이팅 특화입니다.",
    rarity: "rare",
    target: "궁수 전용 · 기동",
    classes: ["ranger"],
    icon: "풍",
  },
  {
    id: "eagle_crest",
    name: "매의 문장",
    text: "궁수 전용. 엘리트/보스 피해 +18%, 치명타 +7%. 우선 처치 역할을 강화합니다.",
    rarity: "rare",
    target: "궁수 전용 · 저격",
    classes: ["ranger"],
    icon: "응",
  },
  {
    id: "astral_prism",
    name: "별빛 프리즘",
    text: "마법사 전용. 상태이상 적 피해 +18%, 마법 폭발 반경 +34px.",
    rarity: "rare",
    target: "마법사 전용 · 광역",
    classes: ["mage"],
    icon: "프",
  },
  {
    id: "frozen_hourglass",
    name: "얼어붙은 모래시계",
    text: "마법사 전용. 스킬 쿨다운 -12%, 상태이상 적 피해 +10%. 빙결/화상 연계용입니다.",
    rarity: "common",
    target: "마법사 전용 · 상태이상",
    classes: ["mage"],
    icon: "빙",
  },
  {
    id: "mercy_censer",
    name: "자비의 향로",
    text: "성직자 전용. 적 처치 시 살아있는 파티원을 소량 회복하고 치유량 +12%.",
    rarity: "rare",
    target: "성직자 전용 · 파티 회복",
    classes: ["cleric"],
    icon: "향",
  },
  {
    id: "aegis_lantern",
    name: "수호 등불",
    text: "성직자 전용. 보호막 +18%, 치유량 +8%, 스킬 쿨다운 -5%.",
    rarity: "common",
    target: "성직자 전용 · 보호",
    classes: ["cleric"],
    icon: "등",
  },
  {
    id: "kinetic_spurs",
    name: "운동 박차",
    text: "대시 거리 +12%, 대시 쿨다운 -10%. 기동 빌드의 기본 유물입니다.",
    rarity: "uncommon",
    target: "공용 · 이동",
    icon: "SP",
  },
  {
    id: "tempered_core",
    name: "단련된 핵",
    text: "최대 체력 +42, 방어 +5%. 초반 안정성을 크게 올립니다.",
    rarity: "uncommon",
    target: "공용 · 생존",
    icon: "TC",
  },
  {
    id: "overclock_rune",
    name: "과부하 룬",
    text: "처치 시 모든 스킬 쿨다운을 0.55초 줄입니다. 연속 처치 빌드용.",
    rarity: "rare",
    target: "공용 · 쿨다운",
    icon: "OC",
  },
  {
    id: "predator_scope",
    name: "포식자 조준경",
    text: "치명타 +10%, 정예/보스 피해 +14%. 위험한 적을 먼저 지우는 유물입니다.",
    rarity: "rare",
    target: "공용 · 처치",
    icon: "PR",
  },
  {
    id: "titan_grip",
    name: "거신의 손아귀",
    text: "전사 전용. 스킬 범위 +18%, 방패 돌진 피해 +18%, 방어 +5%.",
    rarity: "unique",
    target: "전사 · 범위/돌진",
    classes: ["warrior"],
    icon: "TG",
  },
  {
    id: "thunder_fletching",
    name: "번개 깃촉",
    text: "궁수 전용. 투사체 연쇄 +1, 사거리 +10%, 치명타 +6%.",
    rarity: "unique",
    target: "궁수 · 연쇄",
    classes: ["ranger"],
    icon: "TF",
  },
  {
    id: "molten_orbit",
    name: "용융 궤도",
    text: "마법사 전용. 마법 폭발 반경 +56px, 상태이상 피해 +18%, 스킬 쿨다운 -8%.",
    rarity: "unique",
    target: "마법사 · 광역/상태",
    classes: ["mage"],
    icon: "MO",
  },
  {
    id: "aegis_protocol",
    name: "수호 규약",
    text: "전설. 피해를 받을 때 보호막이 있으면 받은 피해의 일부를 주변에 반사합니다.",
    rarity: "legendary",
    target: "공용 · 방어 반격",
    icon: "AP",
  },
  {
    id: "crown_of_ruin",
    name: "파멸의 왕관",
    text: "전설. 최종 피해 +38%, 스킬 쿨다운 -10%. 대신 최대 체력 -18%.",
    rarity: "legendary",
    target: "공용 · 고위험 화력",
    icon: "CR",
  },
  {
    id: "phoenix_heart",
    name: "불사조 심장",
    text: "전설. 치명상을 1회 막고 체력 45%와 큰 보호막을 얻습니다.",
    rarity: "legendary",
    target: "공용 · 1회 부활",
    maxLevel: 1,
    icon: "PH",
  },
  {
    id: "worldsplitter_relic",
    name: "세계 가르기 유물",
    text: "신화. 전사 전용. 베기/돌진 빌드가 거대화됩니다: 범위 +28%, 대시 밀어내기 +35%.",
    rarity: "mythic",
    target: "전사 · 신화",
    classes: ["warrior"],
    maxLevel: 1,
    icon: "WS",
  },
  {
    id: "plague_bloom",
    name: "역병 개화",
    text: "신화. 궁수 전용. 독/상태이상 피해 +34%, 투사체 연쇄 +1, 상자 드랍 보정 +2%.",
    rarity: "mythic",
    target: "궁수 · 신화",
    classes: ["ranger"],
    maxLevel: 1,
    icon: "PB",
  },
  {
    id: "singularity_crown",
    name: "특이점 왕관",
    text: "신화. 마법사 전용. 폭발 반경 +80px, 스킬 쿨다운 -18%, 연쇄/상태이상 빌드가 크게 강화됩니다.",
    rarity: "mythic",
    target: "마법사 · 신화",
    classes: ["mage"],
    maxLevel: 1,
    icon: "SC",
  },
  {
    id: "iron_knuckle",
    name: "철권 붕대",
    text: "무투가 전용. 기본 공격 쿨다운 -10%, 근접/스킬 범위 +8%. 연격 유지가 쉬워집니다.",
    rarity: "common",
    target: "무투가 전용 · 연격",
    classes: ["martialist"],
    icon: "권",
  },
  {
    id: "dragon_sash",
    name: "용문 허리띠",
    text: "무투가 전용. 최종 피해 +12%, 대시 피해 +14%, 보호막 효과 +10%. 돌입 콤보를 강화합니다.",
    rarity: "unique",
    target: "무투가 전용 · 돌입",
    classes: ["martialist"],
    icon: "용",
  },
  {
    id: "catalyst_belt",
    name: "촉매 허리띠",
    text: "연금술사 전용. 장판 범위 +10%, 상태이상 피해 +10%. 산성과 화염 빌드에 좋습니다.",
    rarity: "common",
    target: "연금술사 전용 · 장판",
    classes: ["alchemist"],
    icon: "촉",
  },
  {
    id: "volatile_codex",
    name: "휘발성 제조서",
    text: "연금술사 전용. 폭발 반경 +34px, 스킬 쿨다운 -10%, 최종 피해 +6%. 플라스크 운용을 강화합니다.",
    rarity: "unique",
    target: "연금술사 전용 · 플라스크",
    classes: ["alchemist"],
    icon: "휘",
  },
  {
    id: "shadow_signet",
    name: "그림자 인장",
    text: "암살자 전용. 치명타 +9%, 대시 쿨다운 -10%. 진입과 처형 안정성이 증가합니다.",
    rarity: "common",
    target: "암살자 전용 · 기동",
    classes: ["assassin"],
    icon: "그",
  },
  {
    id: "night_dagger",
    name: "밤의 단검",
    text: "암살자 전용. 정예/보스 피해 +20%, 최종 피해 +10%. 대신 최대 체력 -8%.",
    rarity: "unique",
    target: "암살자 전용 · 처형",
    classes: ["assassin"],
    icon: "밤",
  },
] as const satisfies readonly RelicDefinition[];

export const SUPPLY_REWARDS = [
  {
    id: "supply_heal",
    name: "응급 보급",
    text: "즉시 체력을 35% 회복합니다. 유물로 보관되지 않습니다.",
    rarity: "common",
    target: "소모성 보급",
    icon: "구",
    consumable: true,
  },
  {
    id: "supply_shield",
    name: "방어 보급",
    text: "짧은 보호막을 얻습니다. 유물로 보관되지 않습니다.",
    rarity: "common",
    target: "소모성 보급",
    icon: "방",
    consumable: true,
  },
  {
    id: "supply_focus",
    name: "전술 보급",
    text: "현재 스킬 쿨다운을 4초 줄입니다. 유물로 보관되지 않습니다.",
    rarity: "common",
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

export function getRelicMaxLevel(relic: Pick<RelicDefinition, "maxLevel" | "rarity">): number {
  if (typeof relic.maxLevel === "number" && Number.isFinite(relic.maxLevel)) {
    return Math.max(1, Math.floor(relic.maxLevel));
  }
  return getRarityMaxLevel(relic.rarity);
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

export function getRelicChoiceWeight(relic: Pick<RelicDefinition, "rarity">, rarityBoost = 0, progression = 1): number {
  const rarity = normalizeRarity(relic.rarity);
  const meta = RARITY_META[rarity];
  const rarityLift = 1 + Math.max(0, rarityBoost) * (0.75 + meta.score * 0.45);
  const progressionLift = meta.score >= 5 ? progression * 1.35 : meta.score >= 4 ? progression * 1.12 : 1;
  return Math.max(0.01, meta.relicWeight * rarityLift * progressionLift);
}
