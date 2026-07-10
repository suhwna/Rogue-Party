import { type ClassId, type SkillSlot } from "./classes";

export interface SkillDefinition {
  readonly id: string;
  readonly slot: SkillSlot;
  readonly name: string;
  readonly text: string;
  readonly unlockUpgradeId?: string;
}

export type ClassSkillSlots = Record<SkillSlot, SkillDefinition | null>;

export const CLASS_SKILLS = {
  novice: {
    q: {
      id: "novice_primary",
      slot: "q",
      name: "응급 전투술",
      text: "기본 생존용 전투 기술입니다.",
    },
    e: null,
    r: null,
    f: null,
  },
  warrior: {
    q: {
      id: "warrior_primary",
      slot: "q",
      name: "강철 회오리",
      text: "몸 주변을 회전 베기로 긁어 근접한 적을 정리합니다.",
    },
    e: {
      id: "warrior_taunt",
      slot: "e",
      name: "도발",
      text: "주변 적을 전사에게 고정하고 보호막, 거대화, 일시 받는 피해 감소를 얻습니다.",
      unlockUpgradeId: "warrior_taunt",
    },
    r: {
      id: "warrior_charge",
      slot: "r",
      name: "방패 돌진",
      text: "전방으로 돌진해 넓은 경로의 적에게 피해를 주고 밀쳐냅니다.",
      unlockUpgradeId: "warrior_charge",
    },
    f: {
      id: "warrior_cleave",
      slot: "f",
      name: "광역 베기",
      text: "전방 넓은 부채꼴을 크게 베어 다수의 적을 한 번에 정리합니다.",
      unlockUpgradeId: "warrior_cleave",
    },
  },
  ranger: {
    q: {
      id: "ranger_primary",
      slot: "q",
      name: "연발 사격",
      text: "조준 방향으로 빠른 화살을 연속 발사해 단일 대상과 작은 무리를 압박합니다.",
    },
    e: {
      id: "ranger_pierce",
      slot: "e",
      name: "관통 사격",
      text: "긴 직선 관통 화살로 일렬의 적을 꿰뚫습니다.",
      unlockUpgradeId: "ranger_pierce",
    },
    r: {
      id: "ranger_trap",
      slot: "r",
      name: "레인 에로우",
      text: "지정 지점에 화살비를 내려 뭉친 적을 지속 타격합니다.",
      unlockUpgradeId: "ranger_trap",
    },
    f: {
      id: "ranger_poison",
      slot: "f",
      name: "독화살",
      text: "독화살 한 발로 적을 중독시키고 지역 피해를 남깁니다.",
      unlockUpgradeId: "ranger_poison",
    },
  },
  mage: {
    q: {
      id: "mage_primary",
      slot: "q",
      name: "별빛 폭발",
      text: "조준 방향으로 폭발 마법을 쏴 작은 범위를 터뜨립니다.",
    },
    e: {
      id: "mage_frost",
      slot: "e",
      name: "빙결 파동",
      text: "주변으로 냉기 파동을 퍼뜨려 적에게 피해를 주고 느리게 합니다.",
      unlockUpgradeId: "mage_frost",
    },
    r: {
      id: "mage_meteor",
      slot: "r",
      name: "운석",
      text: "목표 지점에 큰 운석을 떨어뜨려 폭발 피해를 줍니다.",
      unlockUpgradeId: "mage_meteor",
    },
    f: {
      id: "mage_chain",
      slot: "f",
      name: "연쇄 번개",
      text: "가까운 적 사이를 튀는 번개로 여러 대상을 연속 타격합니다.",
      unlockUpgradeId: "mage_chain",
    },
  },
  engineer: {
    q: {
      id: "engineer_primary",
      slot: "q",
      name: "자동 터렛",
      text: "조준 위치에 자동 터렛을 던져 설치합니다.",
    },
    e: {
      id: "engineer_mecha",
      slot: "e",
      name: "메카 탑승",
      text: "일정 시간 메카에 탑승해 방어력을 높이고 양손 레이저 기본공격을 사용합니다.",
      unlockUpgradeId: "engineer_mecha",
    },
    r: {
      id: "engineer_mine",
      slot: "r",
      name: "감전 지뢰",
      text: "밟으면 폭발하는 전기 지뢰를 설치해 피해와 제어를 줍니다.",
      unlockUpgradeId: "engineer_mine",
    },
    f: {
      id: "engineer_drone",
      slot: "f",
      name: "호위 드론",
      text: "플레이어를 따라다니는 드론을 호출해 주변 적을 지원 사격합니다.",
      unlockUpgradeId: "engineer_drone",
    },
  },
  puppeteer: {
    q: {
      id: "puppeteer_primary",
      slot: "q",
      name: "인형극",
      text: "인형을 돌진시키거나 실을 당겨 경로상의 적에게 표식 피해를 줍니다.",
    },
    e: {
      id: "puppeteer_puppet",
      slot: "e",
      name: "살아있는 인형",
      text: "전투 인형을 소환합니다. 이미 있으면 인형이 돌진하며 경로에 실표식을 새깁니다.",
      unlockUpgradeId: "puppeteer_puppet",
    },
    r: {
      id: "puppeteer_bind",
      slot: "r",
      name: "실 결계",
      text: "실 결계를 펼쳐 범위 안 적을 묶고 실표식을 절단합니다.",
      unlockUpgradeId: "puppeteer_bind",
    },
    f: {
      id: "puppeteer_swap",
      slot: "f",
      name: "피날레 교대",
      text: "본체와 인형의 위치를 바꾸며 경로와 주변 표식을 폭발시킵니다.",
      unlockUpgradeId: "puppeteer_swap",
    },
  },
  martialist: {
    q: {
      id: "martialist_primary",
      slot: "q",
      name: "연환권",
      text: "짧은 전방 연타로 근접 적을 빠르게 두드리고 기력을 얻습니다.",
    },
    e: {
      id: "martial_palm",
      slot: "e",
      name: "파쇄장",
      text: "전방 지면을 내려쳐 충격파로 피해와 밀어내기를 줍니다.",
      unlockUpgradeId: "martial_palm",
    },
    r: {
      id: "martial_rising",
      slot: "r",
      name: "승룡각",
      text: "돌진하며 올려차고 착지 충격으로 주변을 정리합니다.",
      unlockUpgradeId: "martial_rising",
    },
    f: {
      id: "martial_focus",
      slot: "f",
      name: "기합 폭발",
      text: "주변으로 기합 파동을 터뜨려 접근한 적을 밀어냅니다.",
      unlockUpgradeId: "martial_focus",
    },
  },
  alchemist: {
    q: {
      id: "alchemist_primary",
      slot: "q",
      name: "촉매 폭탄",
      text: "폭탄을 던져 피해를 주고 깔린 산성/화염 장판 반응을 유도합니다.",
    },
    e: {
      id: "alchemist_acid",
      slot: "e",
      name: "산성 플라스크",
      text: "산성 장판을 만들어 적을 중독시키고 방어를 깎습니다.",
      unlockUpgradeId: "alchemist_acid",
    },
    r: {
      id: "alchemist_fire",
      slot: "r",
      name: "화염 플라스크",
      text: "화염 장판을 만들어 적을 태우고 산성과 만나면 폭발합니다.",
      unlockUpgradeId: "alchemist_fire",
    },
    f: {
      id: "alchemist_elixir",
      slot: "f",
      name: "전투 영약",
      text: "영약을 뿌려 아군을 회복하거나 전투 보조 효과를 제공합니다.",
      unlockUpgradeId: "alchemist_elixir",
    },
  },
  assassin: {
    q: {
      id: "assassin_primary",
      slot: "q",
      name: "칼날 난무",
      text: "짧은 범위에서 여러 번 베어 근접한 적과 표식 대상을 빠르게 마무리합니다.",
    },
    e: {
      id: "assassin_mark",
      slot: "e",
      name: "사신 표식",
      text: "대상과 주변 적에게 표식을 남깁니다. 표식 후 첫 타격은 1.5배 피해로 소모됩니다.",
      unlockUpgradeId: "assassin_mark",
    },
    r: {
      id: "assassin_lunge",
      slot: "r",
      name: "그림자 찌르기",
      text: "그림자로 파고들어 직선상의 적을 관통 찌르기합니다.",
      unlockUpgradeId: "assassin_lunge",
    },
    f: {
      id: "assassin_smoke",
      slot: "f",
      name: "연막 분신",
      text: "연막과 분신을 남겨 적을 교란하고 주변을 베어냅니다.",
      unlockUpgradeId: "assassin_smoke",
    },
  },
} as const satisfies Record<ClassId, ClassSkillSlots>;

export function getPrimarySkillName(classId: string): string {
  return getClassSkillSlots(classId).q?.name || "응급 전투술";
}

export function getClassSkillSlots(classId: string): ClassSkillSlots {
  return CLASS_SKILLS[isSkillClassId(classId) ? classId : "novice"];
}

export function getSkillDefinition(classId: string, slot: SkillSlot): SkillDefinition | null {
  return getClassSkillSlots(classId)[slot];
}

export function isSkillClassId(classId: string): classId is ClassId {
  return Object.prototype.hasOwnProperty.call(CLASS_SKILLS, classId);
}
