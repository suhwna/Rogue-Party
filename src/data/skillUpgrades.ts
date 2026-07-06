import { type ClassId, type SkillSlot } from "./classes";
import { type RarityId, normalizeRarity, RARITY_META } from "./rarity";

export interface SkillUpgradeDefinition {
  readonly id: string;
  readonly slot?: SkillSlot;
  readonly requires?: readonly string[];
  readonly rarity?: RarityId;
  readonly minLevel?: number;
  readonly name: string;
  readonly text: string;
}

export type SkillUpgradeTable = Record<ClassId, readonly SkillUpgradeDefinition[]>;

export const DISABLED_SKILL_UPGRADE_IDS = [
  "warrior_guardian",
  "warrior_charge_aftershock",
  "warrior_sword_reach",
  "warrior_vanguard_stride",
  "ranger_focus_fire",
  "ranger_double_step",
  "mage_chain_anchor",
  "mage_orbit_expansion",
  "mage_quick_cast",
] as const;

export const SKILL_UPGRADES = {
  novice: [],
  warrior: [
    { id: "warrior_taunt", slot: "e", name: "도발", text: "E: 주변 적을 끌어오고 4초간 거대화하며 받는 피해가 감소합니다." },
    { id: "warrior_charge", slot: "r", name: "방패 돌진", text: "R: 넓은 경로로 돌진하며 적을 멀리 밀쳐냅니다." },
    { id: "warrior_cleave", slot: "f", name: "광역 베기", text: "F: 넓은 전방 베기로 다수의 적을 정리합니다." },
    { id: "warrior_guardian", name: "철벽 훈련", text: "방어 +10%, 최대 체력 +30." },
    { id: "warrior_warlord", name: "전장의 지휘", text: "피해 +15%, Q 강철 회오리 범위 +10%." },
    { id: "warrior_taunt_bastion", requires: ["warrior_taunt"], name: "요새 도발", text: "도발의 보호막과 받는 피해 감소 시간이 크게 증가합니다." },
    { id: "warrior_taunt_pull", requires: ["warrior_taunt"], name: "끌어당기는 도전", text: "도발이 일반 적을 살짝 끌어당기고 돌진 예열을 끊습니다." },
    { id: "warrior_charge_crash", requires: ["warrior_charge"], name: "파쇄 돌진", text: "방패 돌진 폭, 피해, 밀어내기 거리가 증가합니다." },
    { id: "warrior_charge_aftershock", requires: ["warrior_charge"], name: "방패 충격파", text: "방패 돌진의 충격 범위와 충돌감이 강해집니다." },
    { id: "warrior_cleave_execution", requires: ["warrior_cleave"], name: "처형의 호", text: "광역 베기가 체력이 낮은 적에게 추가 피해를 줍니다." },
    { id: "warrior_cleave_guard", requires: ["warrior_cleave"], name: "수호의 베기", text: "광역 베기로 적을 맞힐 때마다 보호막을 얻습니다." },
    { id: "warrior_sword_reach", name: "장병 파지", text: "검 사거리와 스킬 범위가 증가합니다." },
    { id: "warrior_blood_heat", name: "전열 가열", text: "기본 공격 쿨다운 -12%, 치명타 +6%." },
    { id: "warrior_unbreakable", name: "불굴", text: "최대 체력과 방어가 증가하고 밀어내기 피해가 강해집니다." },
    { id: "warrior_vanguard_stride", name: "선봉 보법", text: "이동 속도와 돌진 거리가 소폭 증가합니다." },
    { id: "warrior_riposte", name: "반격 자세", text: "방어가 증가하고 받은 피해 일부를 적에게 되돌립니다." },
    {
      id: "warrior_legend_colossus",
      requires: ["warrior_taunt", "warrior_charge"],
      rarity: "legendary",
      minLevel: 8,
      name: "거신의 맹세",
      text: "도발과 방패 돌진이 거대화됩니다. 도발 지속/보호막/방패 밀어내기가 크게 증가합니다.",
    },
    {
      id: "warrior_mythic_worldsplitter",
      requires: ["warrior_cleave", "warrior_charge_crash"],
      rarity: "mythic",
      minLevel: 11,
      name: "세계 가르기",
      text: "광역 베기 끝 지점에 추가 충격파가 터져 먼 적까지 베어냅니다.",
    },
  ],
  ranger: [
    { id: "ranger_pierce", slot: "e", name: "관통 사격", text: "E: 넓은 관통 화살을 발사해 직선상의 적을 쓸어냅니다." },
    { id: "ranger_trap", slot: "r", name: "레인 에로우", text: "R: 조준 위치에 화살비를 내려 범위 지속 피해를 줍니다." },
    { id: "ranger_poison", slot: "f", name: "독화살", text: "F: 독 화살을 발사해 지속 피해를 남깁니다." },
    { id: "ranger_eagle_eye", name: "매의 눈", text: "기본 공격 사거리 +14%, 치명타 +6%." },
    { id: "ranger_quickdraw", name: "속사 훈련", text: "기본 공격 쿨다운 -10%, 이동 속도 +6%." },
    { id: "ranger_multishot", name: "분열 난사", text: "Q 연발 사격의 화살 수와 부채꼴 폭이 증가합니다." },
    { id: "ranger_bodkin", requires: ["ranger_pierce"], name: "거대 관통촉", text: "관통 사격의 폭, 사거리, 관통 수, 피해가 증가합니다." },
    { id: "ranger_trap_barbs", requires: ["ranger_trap"], name: "폭우", text: "레인 에로우의 범위, 지속시간, 타격 빈도가 증가합니다." },
    { id: "ranger_trap_chain", requires: ["ranger_trap"], name: "낙뢰 화살비", text: "레인 에로우가 적중 후 주변 적에게 번개처럼 튕깁니다." },
    { id: "ranger_poison_focus", requires: ["ranger_poison"], name: "맹독 촉", text: "독 지속 시간과 초당 피해가 증가합니다." },
    { id: "ranger_poison_cloud", requires: ["ranger_poison"], name: "독성 폭발", text: "독화살이 명중 지점 주변 적에게도 독을 퍼뜨립니다." },
    { id: "ranger_kiting", name: "카이팅 폼", text: "대시 재충전과 이동 속도가 개선됩니다." },
    { id: "ranger_execution", name: "사냥꾼의 표식", text: "치명타와 정예/보스 추가 피해가 증가합니다." },
    { id: "ranger_focus_fire", name: "집중 사격", text: "최종 피해와 기본 공격 사거리가 증가합니다." },
    { id: "ranger_soft_spot", name: "약점 해부", text: "취약/중독/감속 상태의 적에게 주는 피해가 증가합니다." },
    { id: "ranger_double_step", name: "더블 스텝", text: "대시 거리가 증가하고 재충전이 더 빨라집니다." },
    {
      id: "ranger_legend_storm_quiver",
      requires: ["ranger_pierce", "ranger_multishot"],
      rarity: "legendary",
      minLevel: 8,
      name: "폭풍 화살통",
      text: "연발 사격과 관통 사격이 적중 후 주변 적에게 번개처럼 튕깁니다.",
    },
    {
      id: "ranger_mythic_plague_garden",
      requires: ["ranger_trap_chain", "ranger_poison_cloud"],
      rarity: "mythic",
      minLevel: 11,
      name: "역병 정원",
      text: "레인 에로우가 독비 정원으로 변해 범위 안 적에게 지속 독 피해를 남깁니다.",
    },
  ],
  mage: [
    { id: "mage_frost", slot: "e", name: "빙결 파동", text: "E: 주변 적을 감속시키고 일부를 짧게 얼립니다." },
    { id: "mage_meteor", slot: "r", name: "운석", text: "R: 조준 위치에 큰 지연 폭발을 호출합니다." },
    { id: "mage_chain", slot: "f", name: "연쇄 번개", text: "F: 적 사이를 튕기는 번개를 방출합니다." },
    { id: "mage_arcane_focus", name: "비전 집중", text: "마법 폭발 반경 +22%, 스킬 쿨다운 -8%." },
    { id: "mage_storm_core", name: "폭풍 핵", text: "피해 +10%, 기본 공격이 더 넓게 폭발합니다." },
    { id: "mage_absolute_zero", requires: ["mage_frost"], name: "절대 영도", text: "빙결 파동 범위와 빙결 시간이 증가합니다." },
    { id: "mage_frost_shatter", requires: ["mage_frost"], name: "빙하 파쇄", text: "빙결 파동이 더 강한 냉기 피해를 줍니다." },
    { id: "mage_wildfire", requires: ["mage_meteor"], name: "불바다 확장", text: "운석 폭발과 불바다 범위, 지속 피해가 증가합니다." },
    { id: "mage_twin_meteor", requires: ["mage_meteor"], name: "쌍둥이 낙하", text: "운석이 떨어진 뒤 양옆에 작은 운석이 추가로 떨어집니다." },
    { id: "mage_chain_overload", requires: ["mage_chain"], name: "과부하 연쇄", text: "연쇄 번개의 튕김 수, 거리, 피해 유지율이 증가합니다." },
    { id: "mage_chain_anchor", requires: ["mage_chain"], name: "번개 닻", text: "연쇄 번개의 시작 사거리와 첫 타격 피해가 증가합니다." },
    { id: "mage_starlance", name: "별창 조율", text: "기본 마법 사거리와 최종 피해가 증가합니다." },
    { id: "mage_mana_surge", name: "마력 쇄도", text: "스킬 쿨다운이 더 빠르게 회복됩니다." },
    { id: "mage_orbit_expansion", name: "궤도 확장", text: "마법 폭발 반경과 기본 마법 사거리가 증가합니다." },
    { id: "mage_ember_skin", name: "잿불 각인", text: "화상과 상태이상 피해가 증가하고 생존력이 조금 오릅니다." },
    { id: "mage_quick_cast", name: "속성 영창", text: "기본 공격과 스킬 쿨다운이 함께 감소합니다." },
    {
      id: "mage_legend_supercell",
      requires: ["mage_chain_overload", "mage_frost"],
      rarity: "legendary",
      minLevel: 8,
      name: "초뇌운",
      text: "연쇄 번개가 튕길 때마다 감속을 남기고, 얼어붙은 적에게 더 강해집니다.",
    },
    {
      id: "mage_mythic_apocalypse",
      requires: ["mage_meteor", "mage_chain"],
      rarity: "mythic",
      minLevel: 11,
      name: "종말",
      text: "운석 충돌 후 낙뢰가 이어지고 불바다가 더 오래, 더 넓게 남습니다.",
    },
  ],
  engineer: [
    { id: "engineer_turret", slot: "e", name: "자동 터렛", text: "E: 조준 위치에 자동 사격 터렛을 설치합니다." },
    { id: "engineer_mine", slot: "r", name: "감전 지뢰", text: "R: 적이 밟으면 폭발하고 짧게 감전시키는 지뢰를 설치합니다." },
    { id: "engineer_drone", slot: "f", name: "호위 드론", text: "F: 주변을 돌며 적을 자동 공격하는 드론을 호출합니다." },
    { id: "engineer_calibration", name: "고속 보정", text: "설치물 공격 속도와 스킬 쿨다운이 개선됩니다." },
    { id: "engineer_reinforced_frame", name: "강화 프레임", text: "최대 체력과 방어가 증가하고 설치물 지속 시간이 증가합니다." },
    { id: "engineer_twin_turret", requires: ["engineer_turret"], name: "쌍열 터렛", text: "터렛 설치 시 보조 소형 터렛이 함께 배치됩니다." },
    { id: "engineer_rail_turret", requires: ["engineer_turret"], name: "레일 터렛", text: "터렛 탄환이 더 빠르고 더 멀리 관통합니다." },
    { id: "engineer_chain_mine", requires: ["engineer_mine"], name: "연쇄 지뢰", text: "지뢰 폭발이 주변 적에게 전기 피해를 추가로 튕깁니다." },
    { id: "engineer_sticky_mine", requires: ["engineer_mine"], name: "점착 폭약", text: "지뢰 폭발 범위와 피해가 증가하고 적을 더 강하게 밀칩니다." },
    { id: "engineer_drone_swarm", requires: ["engineer_drone"], name: "드론 편대", text: "드론이 2기로 증가하고 공격 주기가 빨라집니다." },
    { id: "engineer_interceptor", requires: ["engineer_drone"], name: "요격 드론", text: "드론 피해와 사거리가 증가하고 투사체를 요격하는 느낌의 보호막을 얻습니다." },
    { id: "engineer_overclock", name: "과부하", text: "Q 과부하 피해와 설치물 공격 속도가 증가합니다." },
    { id: "engineer_legend_factory", requires: ["engineer_turret", "engineer_drone"], rarity: "legendary", minLevel: 8, name: "휴대 공장", text: "터렛과 드론이 더 오래 유지되고 과부하가 작은 폭발을 추가 생성합니다." },
    { id: "engineer_mythic_singularity_core", requires: ["engineer_chain_mine", "engineer_overclock"], rarity: "mythic", minLevel: 11, name: "특이점 코어", text: "과부하가 주변 적을 끌어당긴 뒤 큰 전기 폭발을 일으킵니다." },
  ],
  puppeteer: [
    { id: "puppeteer_puppet", slot: "e", name: "살아있는 인형", text: "E: 인형을 소환합니다. 이미 있으면 돌진 경로에 실표식을 새기고 도착 지점에서 찢어냅니다." },
    { id: "puppeteer_bind", slot: "r", name: "실 결계", text: "R: 본체, 인형, 조준점을 잇는 결계를 펼쳐 실표식을 쌓고 표식이 쌓인 적을 절단합니다." },
    { id: "puppeteer_swap", slot: "f", name: "피날레 교대", text: "F: 인형과 위치를 교대하며 경로와 양끝의 실표식을 폭발시킵니다." },
    { id: "puppeteer_fine_thread", name: "정밀한 실", text: "실바늘 사거리와 치명타가 증가하고 실표식 지속 시간이 길어집니다." },
    { id: "puppeteer_soul_stitch", name: "영혼 봉합", text: "인형 지속 시간, 본체 생존력, 실표식 최대 중첩이 증가합니다." },
    { id: "puppeteer_razor_puppet", requires: ["puppeteer_puppet"], name: "칼날 인형", text: "인형 공격이 실표식을 더 많이 쌓고 표식 폭발 피해가 증가합니다." },
    { id: "puppeteer_guard_puppet", requires: ["puppeteer_puppet"], name: "수호 인형", text: "인형 근처 적이 느려지고, 본체가 위험할 때 인형이 추가 보호막을 제공합니다." },
    { id: "puppeteer_thread_saw", requires: ["puppeteer_bind"], name: "톱날 실", text: "실 결계 폭이 넓어지고 결계에 닿은 실표식 적을 더 강하게 절단합니다." },
    { id: "puppeteer_cross_bind", requires: ["puppeteer_bind"], name: "십자 결박", text: "실 결계 중심에 십자 실을 추가로 펼쳐 표식을 빠르게 쌓습니다." },
    { id: "puppeteer_backstage", requires: ["puppeteer_swap"], name: "무대 뒤 걸음", text: "피날레 교대 후 짧은 보호막과 이동 속도를 얻고 표식 폭발 반경이 증가합니다." },
    { id: "puppeteer_finale", requires: ["puppeteer_swap"], name: "피날레 절단", text: "실표식 폭발이 체력이 낮은 적에게 강해지고 양끝 베기가 커집니다." },
    { id: "puppeteer_dual_cast", name: "이중 조종", text: "인형이 있을 때 Q와 기본 공격이 실표식을 더 빠르게 쌓고 스킬 쿨다운이 줄어듭니다." },
    { id: "puppeteer_legend_twin_souls", requires: ["puppeteer_puppet", "puppeteer_bind"], rarity: "legendary", minLevel: 8, name: "쌍혼", text: "실 결계 후 인형이 중심으로 재돌진하며 표식 적에게 추가 절단을 일으킵니다." },
    { id: "puppeteer_mythic_grand_theater", requires: ["puppeteer_finale", "puppeteer_cross_bind"], rarity: "mythic", minLevel: 11, name: "대극장", text: "Q 인형극이 본체와 인형 양쪽에서 터지고 모든 실표식을 한 번 더 폭발시킵니다." },
  ],
  martialist: [
    { id: "martial_palm", slot: "e", name: "파쇄장", text: "E: 기력을 소모해 전방 장풍을 강화하고, 풀기력 시 두 번째 충격파가 터집니다." },
    { id: "martial_rising", slot: "r", name: "승룡각", text: "R: 돌진해 경로의 적을 띄우듯 밀어내며, 보유 기력에 따라 추가 타격이 붙습니다." },
    { id: "martial_focus", slot: "f", name: "기합 폭발", text: "F: 모든 기력을 폭발시켜 보호막, 이동 속도, 주변 밀쳐내기를 강화합니다." },
    { id: "martial_combo_flow", name: "연환 흐름", text: "기력 최대치와 획득량이 증가하고 3타 보호막이 강해집니다." },
    { id: "martial_iron_body", name: "금강신체", text: "최대 체력과 방어가 증가합니다." },
    { id: "martial_afterimage", name: "잔상 보법", text: "대시 재충전과 이동 속도가 개선되고 대시 후 첫 타격이 기력을 얻습니다." },
    { id: "martial_dragon_pulse", name: "용맥 타격", text: "기력 강화 스킬의 범위와 최종 피해가 증가합니다." },
    { id: "martial_counter", name: "반격 호흡", text: "피격 후 짧은 반격 호흡을 얻어 다음 기력 획득과 반사 피해가 증가합니다." },
    { id: "martial_palm_breaker", requires: ["martial_palm"], name: "분쇄 파동", text: "파쇄장의 폭, 피해, 밀어내기가 증가하고 풀기력 충격파가 더 커집니다." },
    { id: "martial_rising_chain", requires: ["martial_rising"], name: "연속 승룡", text: "승룡각이 명중 시 짧은 후속 발차기를 남기고 쿨다운 회복을 얻습니다." },
    { id: "martial_focus_guard", requires: ["martial_focus"], name: "기백 보호", text: "기합 폭발의 보호막과 지속 시간이 증가하며 기력 1칸을 남깁니다." },
    { id: "martial_legend_dragon_soul", requires: ["martial_palm", "martial_rising"], rarity: "legendary", minLevel: 8, name: "용혼", text: "기력 강화 파쇄장과 승룡각이 용의 잔상 충격파를 남깁니다." },
    { id: "martial_mythic_infinite_combo", requires: ["martial_combo_flow", "martial_dragon_pulse"], rarity: "mythic", minLevel: 11, name: "무한 연격", text: "풀기력 스킬 사용 후 짧게 무한 연격 상태가 되어 스킬 쿨다운이 빠르게 줄어듭니다." },
  ],
  alchemist: [
    { id: "alchemist_acid", slot: "e", name: "산성 플라스크", text: "E: 산성 장판을 만들어 중독/감속을 남깁니다. 화염과 만나면 증류 폭발이 발생합니다." },
    { id: "alchemist_fire", slot: "r", name: "화염 플라스크", text: "R: 화염 장판을 만들어 화상을 남깁니다. 산성과 만나면 증류 폭발이 발생합니다." },
    { id: "alchemist_elixir", slot: "f", name: "전투 영약", text: "F: 주변 아군을 회복하고 보호막/이동 속도를 부여하며 작은 치유 안개를 남깁니다." },
    { id: "alchemist_bigger_bottle", name: "대용량 병", text: "플라스크 폭발, 장판 범위, 증류 폭발 범위가 증가합니다." },
    { id: "alchemist_fast_mix", name: "고속 배합", text: "스킬 쿨다운과 기본 공격 쿨다운이 감소하고 촉매 폭탄 반응 속도가 빨라집니다." },
    { id: "alchemist_corrosive", name: "부식 촉매", text: "산성 장판이 방어를 녹이는 느낌으로 추가 피해를 주고 상태이상 피해가 증가합니다." },
    { id: "alchemist_chain_reaction", name: "연쇄 반응", text: "Q 촉매 폭탄이 주변 장판을 강제로 반응시키고 작은 보조 폭발을 일으킵니다." },
    { id: "alchemist_panacea", name: "만능 영약", text: "전투 영약의 회복량, 보호막, 치유 안개 지속 시간이 증가합니다." },
    { id: "alchemist_acid_storm", requires: ["alchemist_acid"], name: "산성 폭우", text: "산성 플라스크의 지속 시간과 피해 빈도가 증가하고 반응 후 산성 잔류물이 남습니다." },
    { id: "alchemist_fire_sea", requires: ["alchemist_fire"], name: "불바다 병", text: "화염 플라스크의 범위와 화상 피해가 증가하고 반응 후 화염 잔류물이 남습니다." },
    { id: "alchemist_elixir_cloud", requires: ["alchemist_elixir"], name: "영약 안개", text: "전투 영약이 더 넓은 범위에 적용되고 독을 정화하며 안개 안의 아군을 계속 회복합니다." },
    { id: "alchemist_legend_philosopher", requires: ["alchemist_acid", "alchemist_fire"], rarity: "legendary", minLevel: 8, name: "현자의 촉매", text: "증류 폭발이 더 강해지고 산성/화염 장판이 겹치면 자동으로 반응합니다." },
    { id: "alchemist_mythic_homunculus_mix", requires: ["alchemist_panacea", "alchemist_chain_reaction"], rarity: "mythic", minLevel: 11, name: "호문쿨루스 배합", text: "Q와 전투 영약이 작은 산성/화염 플라스크를 흩뿌려 연쇄 반응을 만듭니다." },
  ],
  assassin: [
    { id: "assassin_mark", slot: "e", name: "사신 표식", text: "E: 조준 근처 적과 주변 2명에게 표식을 새깁니다. 표식은 처형 추가타의 핵심입니다." },
    { id: "assassin_lunge", slot: "r", name: "그림자 찌르기", text: "R: 조준 방향으로 파고들며 표식 대상에게 그림자 추가타와 처형 피해를 줍니다." },
    { id: "assassin_smoke", slot: "f", name: "연막 분신", text: "F: 짧은 면역/속도를 얻고 분신이 주변 표식 대상에게 추가 베기를 날립니다." },
    { id: "assassin_quick_blade", name: "속검", text: "기본 공격과 Q 쿨다운이 감소하고 표식 적중 시 쿨다운 회복량이 증가합니다." },
    { id: "assassin_deep_cut", name: "깊은 상처", text: "치명타와 표식 대상 근접 피해가 증가합니다." },
    { id: "assassin_execution", name: "처형 본능", text: "체력이 낮은 적에게 그림자 추가타가 강해지고 정예/보스 피해가 증가합니다." },
    { id: "assassin_shadowstep", name: "그림자 걸음", text: "대시 재충전과 대시 거리가 개선되고 대시 직후 첫 표식 타격이 강해집니다." },
    { id: "assassin_fan", name: "칼날 부채", text: "Q 칼날 난무의 폭이 넓어지고 표식 대상 주변에 그림자 칼날이 추가로 떨어집니다." },
    { id: "assassin_mark_reaper", requires: ["assassin_mark"], name: "수확 표식", text: "사신 표식 대상 수, 지속 시간, 표식 처형 피해가 증가합니다." },
    { id: "assassin_lunge_reset", requires: ["assassin_lunge"], name: "그림자 회수", text: "그림자 찌르기가 표식 대상 명중 시 Q 쿨다운을 크게 되돌립니다." },
    { id: "assassin_smoke_bomb", requires: ["assassin_smoke"], name: "짙은 연막", text: "연막 범위와 면역 시간이 증가하고 분신 베기가 더 많은 적을 추적합니다." },
    { id: "assassin_legend_nightfall", requires: ["assassin_mark", "assassin_lunge"], rarity: "legendary", minLevel: 8, name: "밤의 처형식", text: "표식 대상을 찌르면 주변 표식이 함께 폭발하고 그림자 파편이 튑니다." },
    { id: "assassin_mythic_death_blossom", requires: ["assassin_fan", "assassin_execution"], rarity: "mythic", minLevel: 11, name: "죽음의 개화", text: "Q 칼날 난무가 두 번 펼쳐지고 표식 적을 처형하면 그림자 추가타가 연쇄됩니다." },
  ],
  cleric: [
    { id: "cleric_barrier", slot: "e", name: "보호막", text: "E: 주변 아군에게 보호막을 부여합니다." },
    { id: "cleric_revive", slot: "r", name: "부활", text: "R: 범위 안의 쓰러진 아군 한 명을 되살립니다." },
    { id: "cleric_cleanse", slot: "f", name: "정화", text: "F: 해로운 효과를 제거하고 짧은 면역을 부여합니다." },
    { id: "cleric_devotion", name: "헌신", text: "최대 체력 +24, 치유량과 보호막이 증가합니다." },
    { id: "cleric_grace", name: "은총", text: "스킬 쿨다운 -12%, 체력 재생 +0.7." },
  ],
} as const satisfies SkillUpgradeTable;

export const SKILL_RARITY_OVERRIDES: Record<string, RarityId> = {
  warrior_taunt: "unique",
  warrior_charge: "unique",
  warrior_cleave: "unique",
  warrior_guardian: "uncommon",
  warrior_warlord: "rare",
  warrior_taunt_bastion: "rare",
  warrior_taunt_pull: "unique",
  warrior_charge_crash: "rare",
  warrior_charge_aftershock: "unique",
  warrior_cleave_execution: "rare",
  warrior_cleave_guard: "unique",
  ranger_pierce: "unique",
  ranger_trap: "unique",
  ranger_poison: "unique",
  ranger_eagle_eye: "uncommon",
  ranger_quickdraw: "uncommon",
  ranger_multishot: "rare",
  ranger_bodkin: "rare",
  ranger_trap_barbs: "rare",
  ranger_trap_chain: "unique",
  ranger_poison_focus: "rare",
  ranger_poison_cloud: "unique",
  mage_frost: "unique",
  mage_meteor: "unique",
  mage_chain: "unique",
  mage_arcane_focus: "uncommon",
  mage_storm_core: "rare",
  mage_absolute_zero: "rare",
  mage_frost_shatter: "unique",
  mage_wildfire: "rare",
  mage_twin_meteor: "legendary",
  mage_chain_overload: "unique",
  mage_chain_anchor: "rare",
  engineer_turret: "unique",
  engineer_mine: "unique",
  engineer_drone: "unique",
  engineer_calibration: "uncommon",
  engineer_reinforced_frame: "uncommon",
  engineer_twin_turret: "rare",
  engineer_rail_turret: "unique",
  engineer_chain_mine: "rare",
  engineer_sticky_mine: "rare",
  engineer_drone_swarm: "unique",
  engineer_interceptor: "rare",
  engineer_overclock: "rare",
  puppeteer_puppet: "unique",
  puppeteer_bind: "unique",
  puppeteer_swap: "unique",
  puppeteer_fine_thread: "uncommon",
  puppeteer_soul_stitch: "uncommon",
  puppeteer_razor_puppet: "rare",
  puppeteer_guard_puppet: "rare",
  puppeteer_thread_saw: "rare",
  puppeteer_cross_bind: "unique",
  puppeteer_backstage: "rare",
  puppeteer_finale: "unique",
  puppeteer_dual_cast: "rare",
  martial_palm: "unique",
  martial_rising: "unique",
  martial_focus: "unique",
  martial_combo_flow: "uncommon",
  martial_iron_body: "uncommon",
  martial_afterimage: "uncommon",
  martial_dragon_pulse: "rare",
  martial_counter: "rare",
  martial_palm_breaker: "rare",
  martial_rising_chain: "rare",
  martial_focus_guard: "rare",
  alchemist_acid: "unique",
  alchemist_fire: "unique",
  alchemist_elixir: "unique",
  alchemist_bigger_bottle: "uncommon",
  alchemist_fast_mix: "uncommon",
  alchemist_corrosive: "rare",
  alchemist_chain_reaction: "rare",
  alchemist_panacea: "rare",
  alchemist_acid_storm: "rare",
  alchemist_fire_sea: "rare",
  alchemist_elixir_cloud: "unique",
  assassin_mark: "unique",
  assassin_lunge: "unique",
  assassin_smoke: "unique",
  assassin_quick_blade: "uncommon",
  assassin_deep_cut: "uncommon",
  assassin_execution: "rare",
  assassin_shadowstep: "uncommon",
  assassin_fan: "rare",
  assassin_mark_reaper: "rare",
  assassin_lunge_reset: "rare",
  assassin_smoke_bomb: "rare",
};

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

export function getSkillUpgradeRarity(upgrade: SkillUpgradeDefinition): RarityId {
  return normalizeRarity(upgrade.rarity || SKILL_RARITY_OVERRIDES[upgrade.id] || (upgrade.requires ? "rare" : "common"));
}

export function getSkillChoiceWeight(upgrade: SkillUpgradeDefinition, levelRequirement: number): number {
  const rarity = getSkillUpgradeRarity(upgrade);
  const meta = RARITY_META[rarity] || RARITY_META.common;
  const levelLift = 1 + Math.max(0, levelRequirement - 2) * 0.055;
  const highTierLift = meta.score >= 5 ? levelLift * 1.35 : meta.score >= 4 ? levelLift * 1.12 : 1;
  const slotLift = upgrade.slot ? 1.55 : 1;
  return Math.max(0.05, meta.skillWeight * highTierLift * slotLift);
}

export function isSkillUpgradeDisabled(upgradeId: string): boolean {
  return (DISABLED_SKILL_UPGRADE_IDS as readonly string[]).includes(upgradeId);
}

function isSkillUpgradeClassId(classId: string): classId is ClassId {
  return Object.prototype.hasOwnProperty.call(SKILL_UPGRADES, classId);
}
