import { type ClassId, type SkillSlot } from "./classes";

export interface SkillUpgradeDefinition {
  readonly id: string;
  readonly slot?: SkillSlot;
  readonly requires?: readonly string[];
  readonly minLevel?: number;
  readonly name: string;
  readonly text: string;
}

export type SkillUpgradeTable = Record<ClassId, readonly SkillUpgradeDefinition[]>;

export const DISABLED_SKILL_UPGRADE_IDS = [] as const;

export const SKILL_UPGRADES = {
  novice: [],
  "warrior": [
    {
      "id": "warrior_guardian",
      "requires": [
        "warrior_primary"
      ],
      "minLevel": 2,
      "name": "전진하는 회오리",
      "text": "Q 강철 회오리 발동 후 조준 방향으로 전진하는 회오리를 발사합니다."
    },
    {
      "id": "warrior_sword_reach",
      "requires": [
        "warrior_primary"
      ],
      "minLevel": 3,
      "name": "긴 검날",
      "text": "Q 강철 회오리 범위가 50% 증가합니다. 범위 유물 증가분과 합산됩니다."
    },
    {
      "id": "warrior_taunt",
      "slot": "e",
      "minLevel": 2,
      "name": "도발",
      "text": "E: 주변 적을 도발하고 전사 쪽으로 주의를 끌어옵니다."
    },
    {
      "id": "warrior_taunt_pull",
      "requires": [
        "warrior_taunt"
      ],
      "minLevel": 3,
      "name": "끌어당기는 도전",
      "text": "도발한 적이 전사 쪽으로 강하게 끌려옵니다."
    },
    {
      "id": "warrior_taunt_break",
      "requires": [
        "warrior_taunt"
      ],
      "minLevel": 4,
      "name": "보호의 함성",
      "text": "도발을 외칠 때 최대 체력의 38%만큼 방어막을 부여합니다."
    },
    {
      "id": "warrior_charge",
      "slot": "r",
      "minLevel": 4,
      "name": "방패 돌진",
      "text": "R: 방패를 앞세워 돌진하며 경로의 적을 밀쳐냅니다."
    },
    {
      "id": "warrior_charge_gather",
      "requires": [
        "warrior_charge"
      ],
      "minLevel": 5,
      "name": "응집 돌진",
      "text": "방패 돌진이 적을 밀쳐내는 대신 끝 지점까지 끌고 가며, 끌어모으는 반경이 일반 돌진보다 60% 넓어집니다."
    },
    {
      "id": "warrior_charge_collision",
      "requires": [
        "warrior_charge"
      ],
      "minLevel": 6,
      "name": "연속 돌진",
      "text": "방패 돌진을 사용한 뒤 짧은 시간 안에 한 번 더 연속으로 사용할 수 있습니다."
    },
    {
      "id": "warrior_cleave",
      "slot": "f",
      "minLevel": 6,
      "name": "광역 베기",
      "text": "F: 전방을 크게 베어 다수의 적을 타격합니다."
    },
    {
      "id": "warrior_cleave_execution",
      "requires": [
        "warrior_cleave"
      ],
      "minLevel": 7,
      "name": "처형의 호",
      "text": "광역 베기 피해가 적용된 뒤 남은 체력이 최대 체력의 25% 이하인 일반 적을 즉시 처형합니다. 보스에게는 광역 베기 피해가 35% 증가합니다."
    },
    {
      "id": "warrior_cleave_wave",
      "requires": [
        "warrior_cleave"
      ],
      "minLevel": 8,
      "name": "연속 베기",
      "text": "광역 베기 후 전방으로 세로 베기를 한 번 더 발동합니다."
    }
  ],
  "ranger": [
    {
      "id": "ranger_multishot",
      "requires": [
        "ranger_primary"
      ],
      "minLevel": 2,
      "name": "유도 사격",
      "text": "Q 연발 사격의 화살이 적을 추적하며 휘어 들어갑니다."
    },
    {
      "id": "ranger_storm_quiver",
      "requires": [
        "ranger_primary"
      ],
      "minLevel": 3,
      "name": "폭발 화살",
      "text": "Q 연발 사격의 화살이 적중하면 범위 폭발을 일으키고, 직격 대상과 폭발에 맞은 적에게 화상을 부여합니다."
    },
    {
      "id": "ranger_pierce",
      "slot": "e",
      "minLevel": 2,
      "name": "관통 사격",
      "text": "E: 직선으로 관통하는 강한 화살을 발사합니다."
    },
    {
      "id": "ranger_pierce_momentum",
      "requires": [
        "ranger_pierce"
      ],
      "minLevel": 3,
      "name": "관통 성장",
      "text": "관통 사격으로 적을 처치하면 피해가 증가합니다. 20회까지 +2, 50회까지 +1, 이후 +0.5씩 증가하며 최대 +100입니다."
    },
    {
      "id": "ranger_pierce_blast",
      "requires": [
        "ranger_pierce"
      ],
      "minLevel": 4,
      "name": "레이저 화살",
      "text": "관통 사격이 화살 대신 맵 뒤쪽에서 끝까지 꿰뚫는 굵은 레이저를 발사하며, 거대 렌즈로 폭이 증가합니다."
    },
    {
      "id": "ranger_trap",
      "slot": "r",
      "minLevel": 4,
      "name": "레인 에로우",
      "text": "R: 넓은 조준 지점에 3.2초 동안 화살비를 내려 다수의 적을 지속 타격합니다. 화살비가 끝난 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "ranger_rain_slow",
      "requires": [
        "ranger_trap"
      ],
      "minLevel": 5,
      "name": "무거운 화살비",
      "text": "화살비에 맞은 적이 감속됩니다."
    },
    {
      "id": "ranger_rain_shred",
      "requires": [
        "ranger_trap"
      ],
      "minLevel": 6,
      "name": "장대비",
      "text": "화살비 유지 시간이 50% 증가합니다."
    },
    {
      "id": "ranger_poison",
      "slot": "f",
      "minLevel": 6,
      "name": "독화살",
      "text": "F: 독화살 한 발을 발사해 지속 피해를 남깁니다."
    },
    {
      "id": "ranger_poison_cloud",
      "requires": [
        "ranger_poison"
      ],
      "minLevel": 7,
      "name": "독구름",
      "text": "독화살이 명중한 지점에 넓고 오래 유지되는 독장판을 남깁니다."
    },
    {
      "id": "ranger_poison_burst",
      "requires": [
        "ranger_poison"
      ],
      "minLevel": 8,
      "name": "맹독",
      "text": "독화살 명중 시 독과 별개의 맹독을 부여합니다. 맹독은 독 3중첩과 같은 피해를 줍니다."
    }
  ],
  "mage": [
    {
      "id": "mage_star_surge",
      "requires": [
        "mage_primary"
      ],
      "minLevel": 2,
      "name": "유도 별빛",
      "text": "Q 별빛 폭발의 별탄이 궁수의 유도 사격처럼 적을 추적합니다."
    },
    {
      "id": "mage_storm_core",
      "requires": [
        "mage_primary"
      ],
      "minLevel": 3,
      "name": "분열 핵",
      "text": "Q 별빛 폭발이 처음 적중하면 작은 별빛 파편 3갈래로 흩어집니다. 파편 총 피해는 원본의 50%를 넘지 않으며, 분열 핵 유물의 투사체 증가 효과가 원본과 파편 모두에 적용됩니다."
    },
    {
      "id": "mage_frost",
      "slot": "e",
      "minLevel": 2,
      "name": "빙결 파동",
      "text": "E: 주변에 냉기 파동을 퍼뜨려 적에게 피해를 주고 느리게 합니다."
    },
    {
      "id": "mage_frost_shatter",
      "requires": [
        "mage_frost"
      ],
      "minLevel": 3,
      "name": "파쇄 반응",
      "text": "빙결 파동에 맞은 적을 기존 빙결보다 조금 더 길게 얼립니다."
    },
    {
      "id": "mage_frost_echo",
      "requires": [
        "mage_frost"
      ],
      "minLevel": 4,
      "name": "빙결의 숨결",
      "text": "패시브: 마법사 주위에 작은 냉기 오라가 생겨 가까운 적을 지속적으로 느리게 합니다."
    },
    {
      "id": "mage_meteor",
      "slot": "r",
      "minLevel": 4,
      "name": "운석",
      "text": "R: 하늘에서 운석을 떨어뜨려 폭발을 일으킵니다."
    },
    {
      "id": "mage_meteor_growth",
      "requires": [
        "mage_meteor"
      ],
      "minLevel": 5,
      "name": "포식하는 운석",
      "text": "운석으로 적을 처치할 때마다 이번 원정 동안 운석 크기가 0.1% 증가합니다. 최대 50%까지 증가합니다."
    },
    {
      "id": "mage_wildfire",
      "requires": [
        "mage_meteor"
      ],
      "minLevel": 6,
      "name": "불바다",
      "text": "운석이 떨어진 자리에 불바다가 남아 화상을 남깁니다."
    },
    {
      "id": "mage_chain",
      "slot": "f",
      "minLevel": 6,
      "name": "연쇄 번개",
      "text": "F: 첫 대상 이후 최대 5회, 적 사이 거리 260까지 연쇄되는 번개를 방출합니다."
    },
    {
      "id": "mage_chain_no_falloff",
      "requires": [
        "mage_chain"
      ],
      "minLevel": 7,
      "name": "순수 전류",
      "text": "연쇄 번개의 후속 타격이 약해지지 않습니다."
    },
    {
      "id": "mage_chain_paralyze",
      "requires": [
        "mage_chain"
      ],
      "minLevel": 8,
      "name": "강화 전류",
      "text": "연쇄 번개가 붉은 강화 전류로 변하고 치명타 확률이 100%가 됩니다."
    }
  ],
  "engineer": [
    {
      "id": "engineer_overclock",
      "requires": [
        "engineer_mecha"
      ],
      "minLevel": 2,
      "name": "레이저 모듈",
      "text": "메카 탑승 중 기본공격을 3회 사용하면 플레이어 중앙에서 강력한 거대 레이저를 발사합니다. 거대 렌즈로 폭이 증가합니다."
    },
    {
      "id": "engineer_singularity_core",
      "requires": [
        "engineer_mecha"
      ],
      "minLevel": 3,
      "name": "확장 동력",
      "text": "메카 탑승 중 이동속도 감소가 사라집니다."
    },
    {
      "id": "engineer_mecha",
      "slot": "e",
      "minLevel": 2,
      "name": "메카 탑승",
      "text": "E: 8.5초 동안 메카에 탑승해 방어력과 방어막을 얻고, 빠른 양손 레이저 기본공격을 사용합니다. 탑승이 끝난 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "engineer_rail_turret",
      "requires": [
        "engineer_primary"
      ],
      "minLevel": 3,
      "name": "레이저 터렛",
      "text": "터렛이 탄환 대신 적 하나를 계속 조준해 지속 피해를 주는 추적 레이저를 발사합니다."
    },
    {
      "id": "engineer_turret_missile",
      "requires": [
        "engineer_primary"
      ],
      "minLevel": 4,
      "name": "미사일 모듈",
      "text": "터렛이 일정 횟수 공격한 뒤 범위 미사일을 발사합니다."
    },
    {
      "id": "engineer_mine",
      "slot": "r",
      "minLevel": 4,
      "name": "감전 지뢰",
      "text": "R: 적이 밟으면 넓게 폭발해 큰 피해를 주고 둔화시키는 전기 지뢰를 설치합니다."
    },
    {
      "id": "engineer_mine_field",
      "requires": [
        "engineer_mine"
      ],
      "minLevel": 6,
      "name": "충전식 지뢰",
      "text": "감전 지뢰를 최대 3회까지 저장합니다. 지뢰 쿨타임이 끝날 때마다 충전이 1개씩 회복됩니다."
    },
    {
      "id": "engineer_auto_mine",
      "requires": [
        "engineer_mine"
      ],
      "minLevel": 7,
      "name": "자동 기뢰 살포",
      "text": "패시브: 일정 시간마다 캐릭터 주변 무작위 위치에 지뢰를 자동 설치합니다. 설치 주기는 스킬 가속의 영향을 받습니다."
    },
    {
      "id": "engineer_drone",
      "slot": "f",
      "minLevel": 6,
      "name": "호위 드론",
      "text": "F: 14초 동안 주변을 비행하며 적을 빠르게 지원 사격하는 드론을 호출합니다. 마지막 드론이 사라진 뒤 쿨타임이 시작됩니다."
    },
    {
      "id": "engineer_drone_missile",
      "requires": [
        "engineer_drone"
      ],
      "minLevel": 7,
      "name": "폭격 드론",
      "text": "드론이 일반 공격 대신 광역 폭발 미사일을 발사합니다."
    },
    {
      "id": "engineer_drone_kamikaze",
      "requires": [
        "engineer_drone"
      ],
      "minLevel": 8,
      "name": "자폭 귀환",
      "text": "드론 지속 시간이 끝나면 적에게 직접 날아가 충돌 폭발을 일으키고 화상을 남깁니다."
    }
  ],
  "puppeteer": [
    {
      "id": "puppeteer_dual_cast",
      "requires": [
        "puppeteer_primary"
      ],
      "minLevel": 2,
      "name": "쌍실 조종",
      "text": "Q 인형 조종이 더 많은 실표식을 남깁니다."
    },
    {
      "id": "puppeteer_grand_theater",
      "requires": [
        "puppeteer_primary"
      ],
      "minLevel": 3,
      "name": "대극장",
      "text": "Q 인형 조종 후 본체와 인형 사이에 큰 실 베기가 발생합니다."
    },
    {
      "id": "puppeteer_puppet",
      "slot": "e",
      "minLevel": 2,
      "name": "살아있는 인형",
      "text": "E: 인형을 소환하거나 인형을 이동시켜 실표식을 남깁니다."
    },
    {
      "id": "puppeteer_puppet_trail",
      "requires": [
        "puppeteer_puppet"
      ],
      "minLevel": 3,
      "name": "실 흔적",
      "text": "인형이 이동한 경로에 실 흔적을 남겨 닿은 적에게 실표식을 쌓습니다."
    },
    {
      "id": "puppeteer_puppet_threadcut",
      "requires": [
        "puppeteer_puppet"
      ],
      "minLevel": 4,
      "name": "절단 실",
      "text": "본체와 인형 사이의 실에 닿은 적을 절단합니다."
    },
    {
      "id": "puppeteer_bind",
      "slot": "r",
      "minLevel": 4,
      "name": "실 결계",
      "text": "R: 실 결계를 펼쳐 적에게 실표식을 쌓습니다."
    },
    {
      "id": "puppeteer_cross_bind",
      "requires": [
        "puppeteer_bind"
      ],
      "minLevel": 5,
      "name": "십자 결계",
      "text": "결계 중심에 십자 실이 펼쳐져 실표식을 빠르게 쌓습니다."
    },
    {
      "id": "puppeteer_bind_execute",
      "requires": [
        "puppeteer_bind"
      ],
      "minLevel": 6,
      "name": "결박 절단",
      "text": "실표식이 가득 찬 적은 잠깐 묶인 뒤 절단됩니다."
    },
    {
      "id": "puppeteer_swap",
      "slot": "f",
      "minLevel": 6,
      "name": "피날레 교대",
      "text": "F: 본체와 인형의 위치를 교대합니다."
    },
    {
      "id": "puppeteer_swap_cut",
      "requires": [
        "puppeteer_swap"
      ],
      "minLevel": 7,
      "name": "교대 베기",
      "text": "교대 경로에 실 베기가 발생합니다."
    },
    {
      "id": "puppeteer_finale",
      "requires": [
        "puppeteer_swap"
      ],
      "minLevel": 8,
      "name": "피날레 절단",
      "text": "교대 후 인형이 주변 실표식 적을 한 번 더 찢어냅니다."
    }
  ],
  "martialist": [
    {
      "id": "martial_combo_flow",
      "requires": [
        "martialist_primary"
      ],
      "minLevel": 2,
      "name": "연환 흐름",
      "text": "Q 연환권이 적중하면 기력이 더 빠르게 차오르고 다음 기술로 이어집니다."
    },
    {
      "id": "martial_infinite_combo",
      "requires": [
        "martialist_primary"
      ],
      "minLevel": 3,
      "name": "무한 연격",
      "text": "Q 연환권이 풀기력에서 더 강한 연속 타격으로 바뀝니다."
    },
    {
      "id": "martial_palm",
      "slot": "e",
      "minLevel": 2,
      "name": "파쇄장",
      "text": "E: 기를 담은 장풍으로 전방을 타격합니다."
    },
    {
      "id": "martial_palm_echo",
      "requires": [
        "martial_palm"
      ],
      "minLevel": 3,
      "name": "이중 충격",
      "text": "풀기력 파쇄장 사용 시 두 번째 충격파가 한 박자 늦게 터집니다."
    },
    {
      "id": "martial_pressure_mark",
      "requires": [
        "martial_palm"
      ],
      "minLevel": 4,
      "name": "기압 표식",
      "text": "파쇄장에 맞은 적에게 기압 표식이 남고 다음 근접 타격 시 터집니다."
    },
    {
      "id": "martial_rising",
      "slot": "r",
      "minLevel": 4,
      "name": "승룡각",
      "text": "R: 앞으로 파고들어 적을 띄우듯 밀어냅니다."
    },
    {
      "id": "martial_rising_shockwave",
      "requires": [
        "martial_rising"
      ],
      "minLevel": 5,
      "name": "착지 충격",
      "text": "밀려난 적의 착지 지점에 충격파가 남습니다."
    },
    {
      "id": "martial_dragon_afterimage",
      "requires": [
        "martial_rising"
      ],
      "minLevel": 6,
      "name": "용의 잔상",
      "text": "명중한 적 뒤로 용의 잔상이 지나가며 후속 타격을 남깁니다."
    },
    {
      "id": "martial_focus",
      "slot": "f",
      "minLevel": 6,
      "name": "기합 폭발",
      "text": "F: 기합을 터뜨려 주변을 밀쳐냅니다."
    },
    {
      "id": "martial_focus_push",
      "requires": [
        "martial_focus"
      ],
      "minLevel": 7,
      "name": "외공 파동",
      "text": "기합 폭발에 맞은 적을 바깥으로 강하게 밀쳐냅니다."
    },
    {
      "id": "martial_counter_wave",
      "requires": [
        "martial_focus"
      ],
      "minLevel": 8,
      "name": "반격 파동",
      "text": "기합 폭발 후 짧은 시간 동안 피격 시 반격 파동이 발생합니다."
    }
  ],
  "alchemist": [
    {
      "id": "alchemist_bigger_bottle",
      "requires": [
        "alchemist_primary"
      ],
      "minLevel": 2,
      "name": "대형 촉매병",
      "text": "Q 촉매 폭탄의 반응 반경이 커집니다."
    },
    {
      "id": "alchemist_chain_reaction",
      "requires": [
        "alchemist_primary"
      ],
      "minLevel": 3,
      "name": "연쇄 반응",
      "text": "Q 촉매 폭탄이 터진 뒤 추가 반응 폭발을 남깁니다."
    },
    {
      "id": "alchemist_acid",
      "slot": "e",
      "minLevel": 2,
      "name": "산성 플라스크",
      "text": "E: 산성 장판을 남기는 플라스크를 던집니다."
    },
    {
      "id": "alchemist_acid_slow",
      "requires": [
        "alchemist_acid"
      ],
      "minLevel": 3,
      "name": "끈적한 산성",
      "text": "산성 장판 위의 적에게 중독과 감속을 남깁니다."
    },
    {
      "id": "alchemist_acid_distill",
      "requires": [
        "alchemist_acid"
      ],
      "minLevel": 4,
      "name": "증류 반응",
      "text": "산성 장판이 화염 장판과 만나면 증류 폭발이 발생합니다."
    },
    {
      "id": "alchemist_fire",
      "slot": "r",
      "minLevel": 4,
      "name": "화염 플라스크",
      "text": "R: 화염 장판을 남기는 플라스크를 던집니다."
    },
    {
      "id": "alchemist_fire_burn",
      "requires": [
        "alchemist_fire"
      ],
      "minLevel": 5,
      "name": "맹렬한 화염",
      "text": "화염 장판이 적에게 화상을 남깁니다."
    },
    {
      "id": "alchemist_fire_vapor",
      "requires": [
        "alchemist_fire"
      ],
      "minLevel": 6,
      "name": "독성 증기",
      "text": "화염 플라스크를 산성 장판 위에 던지면 독성 증기가 퍼집니다."
    },
    {
      "id": "alchemist_elixir",
      "slot": "f",
      "minLevel": 6,
      "name": "전투 영약",
      "text": "F: 영약을 던져 아군을 돕는 반응 구역을 만듭니다."
    },
    {
      "id": "alchemist_elixir_mist",
      "requires": [
        "alchemist_elixir"
      ],
      "minLevel": 7,
      "name": "치유 안개",
      "text": "영약이 터진 자리에 치유 안개가 남습니다."
    },
    {
      "id": "alchemist_elixir_catalyst",
      "requires": [
        "alchemist_elixir"
      ],
      "minLevel": 8,
      "name": "촉매 영약",
      "text": "영약 안의 아군 첫 공격이 촉매 반응 폭발을 일으킵니다."
    }
  ],
  "assassin": [
    {
      "id": "assassin_fan",
      "requires": [
        "assassin_primary"
      ],
      "minLevel": 2,
      "name": "부채 칼날",
      "text": "Q 칼날 난무가 더 넓은 부채꼴 베기로 바뀝니다."
    },
    {
      "id": "assassin_death_blossom",
      "requires": [
        "assassin_primary"
      ],
      "minLevel": 3,
      "name": "죽음의 꽃",
      "text": "Q 칼날 난무 후 그림자 칼날이 한 번 더 피어납니다."
    },
    {
      "id": "assassin_mark",
      "slot": "e",
      "minLevel": 2,
      "name": "사신 표식",
      "text": "E: 적에게 사신 표식을 새깁니다. 표식은 다음 타격 피해를 1회 1.5배로 증폭한 뒤 사라집니다."
    },
    {
      "id": "assassin_mark_spread",
      "requires": [
        "assassin_mark"
      ],
      "minLevel": 3,
      "name": "번지는 표식",
      "text": "표식 대상이 사망하면 주변 적에게 표식이 전염됩니다."
    },
    {
      "id": "assassin_mark_blades",
      "requires": [
        "assassin_mark"
      ],
      "minLevel": 4,
      "name": "그림자 칼날",
      "text": "표식 대상 주변에 그림자 칼날이 잠시 맴돌다 베어냅니다."
    },
    {
      "id": "assassin_lunge",
      "slot": "r",
      "minLevel": 4,
      "name": "그림자 찌르기",
      "text": "R: 그림자처럼 파고들어 적을 찌릅니다."
    },
    {
      "id": "assassin_lunge_afterimage",
      "requires": [
        "assassin_lunge"
      ],
      "minLevel": 5,
      "name": "후방 관통",
      "text": "표식 대상에게 명중하면 적 뒤로 빠져나가며 그림자 잔상을 남깁니다."
    },
    {
      "id": "assassin_lunge_shards",
      "requires": [
        "assassin_lunge"
      ],
      "minLevel": 6,
      "name": "그림자 파편",
      "text": "처형에 성공하면 주변 표식 대상에게 그림자 파편이 튑니다."
    },
    {
      "id": "assassin_smoke",
      "slot": "f",
      "minLevel": 6,
      "name": "연막 분신",
      "text": "F: 연막을 펼치고 분신을 남깁니다."
    },
    {
      "id": "assassin_smoke_clone",
      "requires": [
        "assassin_smoke"
      ],
      "minLevel": 7,
      "name": "살의 분신",
      "text": "분신이 표식 대상에게 자동으로 추가 베기를 날립니다."
    },
    {
      "id": "assassin_smoke_confuse",
      "requires": [
        "assassin_smoke"
      ],
      "minLevel": 8,
      "name": "혼란 연막",
      "text": "연막 안의 적은 잠깐 방향을 잃고 멈칫합니다."
    }
  ]
} as const satisfies SkillUpgradeTable;

export function getSkillUpgradesForClass(classId: string): readonly SkillUpgradeDefinition[] {
  return SKILL_UPGRADES[isSkillUpgradeClassId(classId) ? classId : "novice"];
}

export function getSkillUpgradeById(upgradeId: string): SkillUpgradeDefinition | null {
  for (const upgrades of Object.values(SKILL_UPGRADES)) {
    const found = upgrades.find((upgrade) => upgrade.id === upgradeId);
    if (found) return found;
  }
  return null;
}

export function getSkillChoiceWeight(upgrade: SkillUpgradeDefinition, levelRequirement: number): number {
  const levelLift = 1 + Math.max(0, levelRequirement - 2) * 0.055;
  const slotLift = upgrade.slot ? 1.55 : 1;
  return Math.max(0.05, levelLift * slotLift);
}

export function isSkillUpgradeDisabled(upgradeId: string): boolean {
  return (DISABLED_SKILL_UPGRADE_IDS as readonly string[]).includes(upgradeId);
}

function isSkillUpgradeClassId(classId: string): classId is ClassId {
  return Object.prototype.hasOwnProperty.call(SKILL_UPGRADES, classId);
}
