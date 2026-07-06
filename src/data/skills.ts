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
      text: "칼을 회전시켜 근접 범위의 적을 베어냅니다.",
    },
    e: {
      id: "warrior_taunt",
      slot: "e",
      name: "도발",
      text: "주변 적을 끌어오고 4초간 거대화하며 받는 피해가 감소합니다.",
      unlockUpgradeId: "warrior_taunt",
    },
    r: {
      id: "warrior_charge",
      slot: "r",
      name: "방패 돌진",
      text: "넓은 경로로 돌진하며 적을 멀리 밀쳐냅니다.",
      unlockUpgradeId: "warrior_charge",
    },
    f: {
      id: "warrior_cleave",
      slot: "f",
      name: "광역 베기",
      text: "넓은 전방 베기로 다수의 적을 정리합니다.",
      unlockUpgradeId: "warrior_cleave",
    },
  },
  ranger: {
    q: {
      id: "ranger_primary",
      slot: "q",
      name: "연발 사격",
      text: "여러 발의 화살을 빠르게 발사합니다.",
    },
    e: {
      id: "ranger_pierce",
      slot: "e",
      name: "관통 사격",
      text: "넓은 관통 화살을 발사해 직선상의 적을 쓸어냅니다.",
      unlockUpgradeId: "ranger_pierce",
    },
    r: {
      id: "ranger_trap",
      slot: "r",
      name: "레인 에로우",
      text: "조준 위치에 화살비를 내려 범위 지속 피해를 줍니다.",
      unlockUpgradeId: "ranger_trap",
    },
    f: {
      id: "ranger_poison",
      slot: "f",
      name: "독화살",
      text: "독 화살을 발사해 지속 피해를 남깁니다.",
      unlockUpgradeId: "ranger_poison",
    },
  },
  mage: {
    q: {
      id: "mage_primary",
      slot: "q",
      name: "별빛 폭발",
      text: "별빛 마법탄을 퍼뜨려 광역 피해를 줍니다.",
    },
    e: {
      id: "mage_frost",
      slot: "e",
      name: "빙결 파동",
      text: "주변 적을 감속시키고 일부를 짧게 얼립니다.",
      unlockUpgradeId: "mage_frost",
    },
    r: {
      id: "mage_meteor",
      slot: "r",
      name: "운석",
      text: "조준 위치에 큰 지연 폭발을 호출합니다.",
      unlockUpgradeId: "mage_meteor",
    },
    f: {
      id: "mage_chain",
      slot: "f",
      name: "연쇄 번개",
      text: "적 사이를 튕기는 번개를 방출합니다.",
      unlockUpgradeId: "mage_chain",
    },
  },
  engineer: {
    q: {
      id: "engineer_primary",
      slot: "q",
      name: "과부하",
      text: "설치물을 과부하시켜 전기 폭발과 공격 속도 증가를 일으킵니다.",
    },
    e: {
      id: "engineer_turret",
      slot: "e",
      name: "자동 터렛",
      text: "조준 위치에 자동 사격 터렛을 설치합니다.",
      unlockUpgradeId: "engineer_turret",
    },
    r: {
      id: "engineer_mine",
      slot: "r",
      name: "감전 지뢰",
      text: "적이 밟으면 폭발하고 짧게 감전시키는 지뢰를 설치합니다.",
      unlockUpgradeId: "engineer_mine",
    },
    f: {
      id: "engineer_drone",
      slot: "f",
      name: "호위 드론",
      text: "주변을 돌며 적을 자동 공격하는 드론을 호출합니다.",
      unlockUpgradeId: "engineer_drone",
    },
  },
  puppeteer: {
    q: {
      id: "puppeteer_primary",
      slot: "q",
      name: "인형극",
      text: "본체와 인형의 실 공격으로 표식을 쌓고 절단합니다.",
    },
    e: {
      id: "puppeteer_puppet",
      slot: "e",
      name: "살아있는 인형",
      text: "인형을 소환합니다. 이미 있으면 돌진 경로에 실표식을 새깁니다.",
      unlockUpgradeId: "puppeteer_puppet",
    },
    r: {
      id: "puppeteer_bind",
      slot: "r",
      name: "실 결계",
      text: "본체, 인형, 조준점을 잇는 결계를 펼쳐 실표식을 쌓습니다.",
      unlockUpgradeId: "puppeteer_bind",
    },
    f: {
      id: "puppeteer_swap",
      slot: "f",
      name: "피날레 교대",
      text: "인형과 위치를 교대하며 경로와 양끝의 실표식을 폭발시킵니다.",
      unlockUpgradeId: "puppeteer_swap",
    },
  },
  martialist: {
    q: {
      id: "martialist_primary",
      slot: "q",
      name: "연환권",
      text: "빠른 연속 타격으로 기력을 쌓습니다.",
    },
    e: {
      id: "martial_palm",
      slot: "e",
      name: "파쇄장",
      text: "기력을 소모해 전방 장풍을 강화하고 풀기력 시 추가 충격파가 터집니다.",
      unlockUpgradeId: "martial_palm",
    },
    r: {
      id: "martial_rising",
      slot: "r",
      name: "승룡각",
      text: "돌진해 경로의 적을 띄우듯 밀어내며 추가 타격을 붙입니다.",
      unlockUpgradeId: "martial_rising",
    },
    f: {
      id: "martial_focus",
      slot: "f",
      name: "기합 폭발",
      text: "기력을 폭발시켜 보호막, 이동 속도, 주변 밀쳐내기를 강화합니다.",
      unlockUpgradeId: "martial_focus",
    },
  },
  alchemist: {
    q: {
      id: "alchemist_primary",
      slot: "q",
      name: "촉매 폭탄",
      text: "촉매 폭탄을 던져 장판 반응과 연쇄 폭발을 유도합니다.",
    },
    e: {
      id: "alchemist_acid",
      slot: "e",
      name: "산성 플라스크",
      text: "산성 장판을 만들어 중독/감속을 남깁니다.",
      unlockUpgradeId: "alchemist_acid",
    },
    r: {
      id: "alchemist_fire",
      slot: "r",
      name: "화염 플라스크",
      text: "화염 장판을 만들어 화상을 남깁니다.",
      unlockUpgradeId: "alchemist_fire",
    },
    f: {
      id: "alchemist_elixir",
      slot: "f",
      name: "전투 영약",
      text: "주변 아군을 회복하고 보호막/이동 속도를 부여합니다.",
      unlockUpgradeId: "alchemist_elixir",
    },
  },
  assassin: {
    q: {
      id: "assassin_primary",
      slot: "q",
      name: "칼날 난무",
      text: "전방에 빠른 칼날 연격을 펼칩니다.",
    },
    e: {
      id: "assassin_mark",
      slot: "e",
      name: "사신 표식",
      text: "조준 근처 적과 주변 2명에게 표식을 새깁니다.",
      unlockUpgradeId: "assassin_mark",
    },
    r: {
      id: "assassin_lunge",
      slot: "r",
      name: "그림자 찌르기",
      text: "조준 방향으로 파고들며 표식 대상에게 추가 피해를 줍니다.",
      unlockUpgradeId: "assassin_lunge",
    },
    f: {
      id: "assassin_smoke",
      slot: "f",
      name: "연막 분신",
      text: "짧은 면역/속도를 얻고 분신이 표식 대상에게 추가 베기를 날립니다.",
      unlockUpgradeId: "assassin_smoke",
    },
  },
  cleric: {
    q: {
      id: "cleric_primary",
      slot: "q",
      name: "새벽의 원",
      text: "신성한 원을 펼쳐 회복과 피해를 동시에 수행합니다.",
    },
    e: {
      id: "cleric_barrier",
      slot: "e",
      name: "보호막",
      text: "주변 아군에게 보호막을 부여합니다.",
      unlockUpgradeId: "cleric_barrier",
    },
    r: {
      id: "cleric_revive",
      slot: "r",
      name: "부활",
      text: "범위 안의 쓰러진 아군 한 명을 되살립니다.",
      unlockUpgradeId: "cleric_revive",
    },
    f: {
      id: "cleric_cleanse",
      slot: "f",
      name: "정화",
      text: "해로운 효과를 제거하고 짧은 면역을 부여합니다.",
      unlockUpgradeId: "cleric_cleanse",
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
