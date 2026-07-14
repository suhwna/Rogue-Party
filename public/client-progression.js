(function () {
  const base = window.RogueSaveManager;
  if (!base) return;

  const SAVE_VERSION = 4;
  const PROGRESS_KEY = "rogue-party.progress.v3";
  const LEGACY_PROGRESS_KEYS = Array.from(new Set([base.PROGRESS_KEY, ...(base.LEGACY_PROGRESS_KEYS || [])].filter(Boolean)));
  const CLASS_IDS = base.CLASS_IDS || ["warrior", "ranger", "mage", "engineer"];
  const ITEM_SLOTS = ["weapon", "armor", "amulet", "core"];
  const SLOT_LABELS = { weapon: "무기", armor: "갑옷", amulet: "부적", core: "코어" };
  const SET_LABELS = { vanguard: "선봉대", hunter: "추적자", arcanist: "비전술사", mechanist: "기계공학", occult: "오컬트", abyss: "심연 군주" };
  const SET_BONUSES = {
    vanguard: { two: "최대 체력 +7%", four: "방어 +2 · 강철 회오리 사용 시 최대 체력 12% 보호막", twoStats: { maxHpMul: 0.07 }, fourStats: { armorBonus: 2, vanguardWhirlwindGuard: 1 } },
    hunter: { two: "치명타 +4%", four: "벽 반사 +1 · 레인 애로우 낙하 주기 25% 단축", twoStats: { critChanceBonus: 0.04 }, fourStats: { wallBounceBonus: 1, hunterRainBarrage: 1 } },
    arcanist: { two: "스킬 가속 +5", four: "화상 피해 +30% · 별빛 파편 +2개 및 1회 관통", twoStats: { skillHaste: 5 }, fourStats: { burnDamageMul: 0.3, arcanistPiercingFragments: 1 } },
    mechanist: { two: "설치물 피해 +12%", four: "터렛 처치 연장 +1초 · 터렛 위치에 감전 지뢰 자동 설치", twoStats: { constructDamageMul: 0.12 }, fourStats: { turretKillDurationBonus: 1, mechanistTurretMine: 1 } },
    occult: { two: "상태이상 피해 +10%", four: "독 최대 중첩 +1", twoStats: { statusDamageMul: 0.1 }, fourStats: { poisonStackCapBonus: 1 } },
    abyss: { two: "보스 피해 +18%", four: "피해 +10%", twoStats: { bossDamageMul: 0.18 }, fourStats: { damageMul: 0.1 } },
  };
  const RARITIES = [
    { id: "common", label: "일반", color: "#cbd5e1", rank: 0 },
    { id: "rare", label: "희귀", color: "#60a5fa", rank: 1 },
    { id: "epic", label: "영웅", color: "#c084fc", rank: 2 },
    { id: "legendary", label: "전설", color: "#fbbf24", rank: 3 },
    { id: "mythic", label: "신화", color: "#fb7185", rank: 4 },
  ];
  const CORE_ITEM_BASES = [
    { id: "vanguard_blade", name: "선봉대 대검", slot: "weapon", classId: "warrior", setId: "vanguard", special: "boss_hunter" },
    { id: "echo_bow", name: "반향 장궁", slot: "weapon", classId: "ranger", setId: "hunter", special: "ricochet" },
    { id: "star_staff", name: "별무리 지팡이", slot: "weapon", classId: "mage", setId: "arcanist", special: "skill_amp" },
    { id: "clockwork_rifle", name: "태엽 핵총", slot: "weapon", classId: "engineer", setId: "mechanist", special: "construct_amp" },
    { id: "thread_needle", name: "운명의 바늘", slot: "weapon", classId: "puppeteer", setId: "occult", special: "status_amp" },
    { id: "dragon_gauntlet", name: "승룡 건틀릿", slot: "weapon", classId: "martialist", setId: "vanguard", special: "crit_amp" },
    { id: "catalyst_flask", name: "촉매 플라스크", slot: "weapon", classId: "alchemist", setId: "occult", special: "venom_cap" },
    { id: "night_dagger", name: "밤그늘 단검", slot: "weapon", classId: "assassin", setId: "hunter", special: "crit_amp" },
    { id: "vanguard_plate", name: "선봉대 판금", slot: "armor", classId: "all", setId: "vanguard", special: "last_guard" },
    { id: "hunter_coat", name: "추적자의 외투", slot: "armor", classId: "all", setId: "hunter", special: "swift_guard" },
    { id: "arcanist_robe", name: "성운 법복", slot: "armor", classId: "all", setId: "arcanist", special: "skill_amp" },
    { id: "mechanist_shell", name: "기계공 장갑복", slot: "armor", classId: "all", setId: "mechanist", special: "construct_amp" },
    { id: "hunter_talisman", name: "추적자의 눈", slot: "amulet", classId: "all", setId: "hunter", special: "boss_hunter" },
    { id: "occult_charm", name: "심연의 부적", slot: "amulet", classId: "all", setId: "occult", special: "status_amp" },
    { id: "arcanist_prism", name: "비전 프리즘", slot: "core", classId: "all", setId: "arcanist", special: "skill_amp" },
    { id: "mechanist_core", name: "영구동력 코어", slot: "core", classId: "all", setId: "mechanist", special: "construct_amp" },
    { id: "ember_staff", name: "잿불 점화봉", slot: "weapon", classId: "mage", setId: "arcanist", special: "burn_amp" },
    { id: "afterimage_bow", name: "잔상 추적궁", slot: "weapon", classId: "ranger", setId: "hunter", special: "crit_amp" },
    { id: "kill_switch", name: "연장 회로", slot: "core", classId: "engineer", setId: "mechanist", special: "turret_sustain" },
    { id: "warden_bulwark", name: "철의 감시자 방벽", slot: "armor", classId: "all", setId: "vanguard", special: "warden_oath", bossCraft: true },
    { id: "prophet_censer", name: "군체 예언자의 향로", slot: "amulet", classId: "all", setId: "occult", special: "prophet_bloom", bossCraft: true },
    { id: "regent_engine", name: "공허 섭정의 동력핵", slot: "core", classId: "all", setId: "abyss", special: "regent_singularity", bossCraft: true },
    { id: "abyss_crown", name: "심연 군주의 관", slot: "amulet", classId: "all", setId: "abyss", special: "abyss_crown", bossCraft: true },
  ];
  const SLOT_ICONS = { weapon: "swords", armor: "shield", amulet: "diamond", core: "deployed_code" };
  const CLASS_GEAR_THEMES = {
    warrior: { label: "강철", setId: "vanguard", specials: ["warrior_signature", "last_guard", "boss_hunter"] },
    ranger: { label: "바람", setId: "hunter", specials: ["ranger_signature", "ricochet", "crit_amp"] },
    mage: { label: "성운", setId: "arcanist", specials: ["mage_signature", "skill_amp", "burn_amp"] },
    engineer: { label: "합금", setId: "mechanist", specials: ["engineer_signature", "construct_amp", "turret_sustain"] },
    puppeteer: { label: "인연", setId: "occult", specials: ["puppeteer_signature", "status_amp", "venom_cap"] },
    martialist: { label: "용맥", setId: "vanguard", specials: ["martialist_signature", "crit_amp", "swift_guard"] },
    alchemist: { label: "연성", setId: "occult", specials: ["alchemist_signature", "status_amp", "burn_amp"] },
    assassin: { label: "월영", setId: "hunter", specials: ["assassin_signature", "crit_amp", "boss_hunter"] },
  };
  const SLOT_VARIANT_NAMES = {
    weapon: ["병기", "절단기", "지배자"],
    armor: ["전투복", "수호갑", "외골격"],
    amulet: ["징표", "부적", "인장"],
    core: ["동력핵", "증폭기", "결정체"],
  };
  const GENERATED_ITEM_BASES = CLASS_IDS.flatMap((classId) => {
    const theme = CLASS_GEAR_THEMES[classId] || CLASS_GEAR_THEMES.warrior;
    return ITEM_SLOTS.flatMap((slot) => SLOT_VARIANT_NAMES[slot].map((suffix, variant) => ({
      id: `${classId}_${slot}_${variant + 1}`,
      name: `${theme.label} ${suffix}`,
      slot,
      classId,
      setId: theme.setId,
      special: theme.specials[variant],
      icon: SLOT_ICONS[slot],
    })));
  });
  const ITEM_BASES = [...CORE_ITEM_BASES, ...GENERATED_ITEM_BASES];
  const AFFIXES = [
    { id: "attack_flat", label: "공격력", stat: "attackBonus", min: 3, max: 3, enhanceStep: 0.75, primary: true },
    { id: "health_flat", label: "최대 체력", stat: "maxHpBonus", min: 28, max: 28, enhanceStep: 6, primary: true },
    { id: "armor_flat", label: "방어력", stat: "armorBonus", min: 0.8, max: 0.8, enhanceStep: 0.16, primary: true },
    { id: "power", label: "공격력", stat: "damageMul", min: 0.018, max: 0.052, percent: true },
    { id: "vitality", label: "최대 체력", stat: "maxHpMul", min: 0.02, max: 0.06, percent: true },
    { id: "haste", label: "스킬 가속", stat: "skillHaste", min: 1.2, max: 3.6, enhanceStep: 0.3 },
    { id: "attack_speed", label: "공격 속도", stat: "attackSpeed", min: 1.2, max: 3.6, enhanceStep: 0.3 },
    { id: "swiftness", label: "이동 속도", stat: "speedMul", min: 0.01, max: 0.03, percent: true },
    { id: "critical", label: "치명타 확률", stat: "critChanceBonus", min: 0.008, max: 0.026, percent: true },
    { id: "armor", label: "방어", stat: "armorBonus", min: 0.3, max: 1.1 },
    { id: "elite", label: "정예/보스 피해", stat: "eliteDamage", min: 0.02, max: 0.065, percent: true },
    { id: "status", label: "상태이상 피해", stat: "statusDamage", min: 0.025, max: 0.075, percent: true },
    { id: "regeneration", label: "체력 재생", stat: "regenBonus", min: 0.08, max: 0.3 },
    { id: "critical_damage", label: "치명타 피해", stat: "critDamageMul", min: 0.02, max: 0.07, percent: true },
    { id: "area", label: "범위 크기", stat: "areaMul", min: 0.018, max: 0.06, percent: true },
  ];
  const RANDOM_AFFIX_IDS = ["power", "vitality", "haste", "attack_speed", "swiftness", "critical", "armor", "elite", "status", "regeneration", "critical_damage", "area"];
  const ENHANCE_MILESTONES = [5, 10, 15, 20];
  const MILESTONE_AFFIX_POOLS = {
    5: [{ id: "vitality", value: 0.04 }, { id: "armor", value: 0.8 }, { id: "regeneration", value: 0.2 }],
    10: [{ id: "critical", value: 0.035 }, { id: "haste", value: 4 }, { id: "attack_speed", value: 4 }, { id: "swiftness", value: 0.045 }],
    15: [{ id: "elite", value: 0.07 }, { id: "status", value: 0.08 }, { id: "area", value: 0.07 }],
    20: [{ id: "power", value: 0.1 }, { id: "critical_damage", value: 0.14 }, { id: "vitality", value: 0.12 }],
  };
  const RARITY_PRIMARY_SCALE = [1, 1.2, 1.45, 1.75, 2.1];
  const RARITY_SPECIAL_SCALE = [0, 1, 1.4, 1.85, 2.4];
  const SPECIALS = {
    boss_hunter: { label: "거인 사냥", text: "보스 피해 증가" },
    ricochet: { label: "벽 반사", text: "투사체가 벽에서 1회 튕김" },
    skill_amp: { label: "과충전", text: "스킬 피해와 범위 증가" },
    construct_amp: { label: "자동화", text: "설치물 피해와 지속시간 증가" },
    status_amp: { label: "연쇄 오염", text: "상태이상 피해 증가" },
    venom_cap: { label: "맹독 저장고", text: "독 최대 중첩 +1" },
    crit_amp: { label: "처형 각인", text: "치명타 확률과 피해 증가" },
    last_guard: { label: "최후의 방벽", text: "저체력 진입 시 보호막 획득" },
    swift_guard: { label: "바람막이", text: "이동 속도와 방어 증가" },
    warden_oath: { label: "불굴의 맹세", text: "최대 체력 +12% · 방어 +1.5 · 체력 35% 이하에서 최대 체력 35% 보호막(전투당 1회)" },
    prophet_bloom: { label: "역병 개화", text: "상태이상 피해 +22% · 독 최대 중첩 +2 · 체력 재생 +0.35/s" },
    regent_singularity: { label: "특이점 기관", text: "공격력 +10% · 범위 +14% · 스킬 가속 +8" },
    abyss_crown: { label: "심연의 판결", text: "공격력 +12% · 보스 피해 +25% · 보스 체력 20% 이하에서 피해 45% 추가 증가" },
    burn_amp: { label: "불씨 증폭", text: "화상 피해 +28%" },
    turret_sustain: { label: "자가 연장", text: "터렛 처치 시 지속시간 +0.8초" },
    warrior_signature: { label: "회오리 증폭", text: "강철 회오리가 전방으로 이동하는 회오리 칼날을 추가 발사" },
    ranger_signature: { label: "화살 폭주", text: "연발 사격이 유도 화살 2개를 더 발사하고 1회 연쇄" },
    mage_signature: { label: "별빛 공명", text: "별빛 폭발이 적중 시 작은 별빛 파편으로 분열" },
    engineer_signature: { label: "전술 자동화", text: "자동 터렛 설치 시 보조 미니 터렛 1기 추가" },
    puppeteer_signature: { label: "실의 공명", text: "인형사 피해와 상태이상 강화" },
    martialist_signature: { label: "연환 기세", text: "무도가 피해와 치명타 확률 강화" },
    alchemist_signature: { label: "촉매 과포화", text: "연금술사 상태이상과 화상 피해 강화" },
    assassin_signature: { label: "그림자 처형", text: "암살자 치명타 확률과 피해 강화" },
  };
  const RUNE_GRADES = ["D", "C", "B", "A", "S", "SS", "SSS", "X"];
  const RUNE_GRADE_POWER = [1, 1.45, 2, 2.75, 3.7, 4.9, 6.4, 8.4];
  const RUNES = [
    { id: "fury", name: "격노 룬", text: "피해 증가", icon: "local_fire_department" },
    { id: "ward", name: "수호 룬", text: "체력과 방어 증가", icon: "shield" },
    { id: "haste", name: "순환 룬", text: "이동 속도와 쿨감", icon: "speed" },
    { id: "venom", name: "맹독 룬", text: "상태이상 피해와 독 중첩", icon: "science" },
    { id: "rebound", name: "반향 룬", text: "고등급에서 벽 반사", icon: "switch_access_shortcut" },
    { id: "eclipse", name: "일식 룬", text: "화상·상태이상·보스 피해", icon: "contrast" },
    { id: "precision", name: "정밀 룬", text: "치명타 확률 증가", icon: "my_location" },
    { id: "ruin", name: "파멸 룬", text: "치명타 피해 증가", icon: "crisis_alert" },
    { id: "colossus", name: "거신 룬", text: "최대 체력 크게 증가", icon: "fitness_center" },
    { id: "bastion", name: "성채 룬", text: "방어력 증가", icon: "castle" },
    { id: "hunter", name: "사냥 룬", text: "보스 피해 증가", icon: "swords" },
    { id: "slayer", name: "토벌 룬", text: "엘리트 피해 증가", icon: "skull" },
    { id: "wildfire", name: "산불 룬", text: "화상 피해 증가", icon: "whatshot" },
    { id: "expansion", name: "팽창 룬", text: "범위 증가", icon: "open_in_full" },
    { id: "automation", name: "자동화 룬", text: "설치물 피해 증가", icon: "precision_manufacturing" },
    { id: "longevity", name: "영속 룬", text: "설치물 지속시간 증가", icon: "all_inclusive" },
    { id: "focus", name: "집중 룬", text: "스킬 가속 증가", icon: "timer" },
    { id: "momentum", name: "질주 룬", text: "이동 속도 증가", icon: "double_arrow" },
    { id: "execution", name: "처형 룬", text: "피해와 치명타 확률 증가", icon: "gavel" },
    { id: "frost", name: "서리 룬", text: "상태이상 피해와 범위 증가", icon: "ac_unit" },
    { id: "storm", name: "폭풍 룬", text: "피해와 쿨타임 감소", icon: "thunderstorm" },
    { id: "alchemy", name: "연성 룬", text: "상태이상과 화상 피해 증가", icon: "experiment" },
    { id: "shadow", name: "그림자 룬", text: "치명타 피해와 이동 속도 증가", icon: "dark_mode" },
    { id: "vitality", name: "생명 룬", text: "체력과 피해 증가", icon: "favorite" },
  ];
  const MONSTER_CATALOG = [
    { id: "training_dummy", name: "훈련 표적", detail: "대기방 훈련용" },
    { id: "slime", name: "슬라임", detail: "근접" },
    { id: "bat", name: "박쥐", detail: "고속 근접" },
    { id: "brute", name: "투사", detail: "중장 근접" },
    { id: "guardian", name: "수호자", detail: "방어형" },
    { id: "shaman", name: "주술사", detail: "회복 지원" },
    { id: "spitter", name: "침 뱉는 괴물", detail: "원거리" },
    { id: "bomber", name: "자폭병", detail: "폭발" },
    { id: "charger", name: "돌진병", detail: "돌진" },
    { id: "splitter", name: "분열체", detail: "분열" },
    { id: "splinter", name: "파편체", detail: "군집" },
    { id: "runner", name: "운반자", detail: "봉쇄전" },
    { id: "runner_tank", name: "중장 운반자", detail: "봉쇄전" },
    { id: "runner_fast", name: "신속 운반자", detail: "봉쇄전" },
    { id: "stalker", name: "암살자", detail: "기습" },
    { id: "mortar", name: "포격수", detail: "장거리 포격" },
    { id: "sniper", name: "저격수", detail: "정밀 사격" },
    { id: "boss", name: "문지기", detail: "보스 개체" },
  ];
  const BOSS_CATALOG = [
    { id: "blade_duelist", name: "검투 문지기", detail: "1장 준보스" },
    { id: "plague_acolyte", name: "역병 의식술사", detail: "2장 준보스" },
    { id: "void_hunter", name: "공허 추적자", detail: "3장 준보스" },
    { id: "iron_warden", name: "철의 감시자", detail: "1장 보스" },
    { id: "hive_prophet", name: "군체 예언자", detail: "2장 보스" },
    { id: "void_regent", name: "공허 섭정", detail: "최종 보스" },
    { id: "fate_executioner", name: "운명의 집행자", detail: "9분 생존 이후 히든 보스" },
  ];
  const RELIC_CATALOG = [
    { id: "power_core", name: "힘의 핵", detail: "공격력 증가" },
    { id: "iron_plate", name: "강철 갑판", detail: "방어력 증가" },
    { id: "swift_boots", name: "신속의 장화", detail: "이동 속도 증가" },
    { id: "cooling_gear", name: "냉각 장치", detail: "스킬 가속 증가" },
    { id: "rapid_loader", name: "속사 장치", detail: "공격 속도 증가" },
    { id: "splitter_core", name: "분열 핵", detail: "투사체 추가" },
    { id: "giant_lens", name: "거대 렌즈", detail: "범위 증가" },
    { id: "sharp_eye", name: "예리한 눈", detail: "치명타 확률 증가" },
    { id: "fatal_mark", name: "치명 표식", detail: "치명타 피해 증가" },
    { id: "living_moss", name: "살아있는 이끼", detail: "체력 재생 증가" },
    { id: "heartstone", name: "심장석", detail: "최대 체력 증가" },
  ];
  const CODEX_CLASS_LABELS = {
    all: "모든 직업", warrior: "전사", ranger: "궁수", mage: "마법사", engineer: "기계공",
    puppeteer: "인형사", martialist: "무도가", alchemist: "연금술사", assassin: "암살자",
  };
  const CODEX_KIND_META = {
    equipment: { label: "장비", icon: "inventory_2" },
    rune: { label: "룬", icon: "deployed_code" },
    monster: { label: "몬스터", icon: "skull" },
    boss: { label: "보스", icon: "swords" },
    relic: { label: "유물", icon: "diamond" },
  };
  const ITEM_SPECIAL_DETAILS = {
    boss_hunter: ["보스 피해", "일반 +8% · 희귀 +9.5% · 영웅 +11% · 전설 +12.5%"],
    ricochet: ["벽 반사", "투사체가 벽에서 1회 추가 반사"],
    skill_amp: ["과충전", "모든 피해 +3.5% · 범위 +5%"],
    construct_amp: ["자동화", "설치물 피해 +11% · 설치물 지속시간 +9%"],
    status_amp: ["연쇄 오염", "상태이상 피해 +11%"],
    venom_cap: ["맹독 저장고", "독 최대 중첩 +1"],
    crit_amp: ["처형 각인", "치명타 확률 +3.5%p · 치명타 피해 +8%"],
    last_guard: ["최후의 방벽", "저체력 진입 시 최대 체력의 18% 보호막"],
    swift_guard: ["바람막이", "이동 속도 +3.5% · 방어 +0.8"],
    warden_oath: ["불굴의 맹세", "최대 체력 +12% · 방어 +1.5 · 체력 35% 이하에서 최대 체력 35% 보호막(전투당 1회)"],
    prophet_bloom: ["역병 개화", "상태이상 피해 +22% · 독 최대 중첩 +2 · 체력 재생 +0.35/s"],
    regent_singularity: ["특이점 기관", "공격력 +10% · 범위 +14% · 스킬 가속 +8"],
    abyss_crown: ["심연의 판결", "공격력 +12% · 보스 피해 +25% · 보스 체력 20% 이하에서 피해 45% 추가 증가"],
    burn_amp: ["불씨 증폭", "화상 피해 +28%"],
    turret_sustain: ["자가 연장", "터렛이 적을 처치할 때 지속시간 +0.8초"],
    warrior_signature: ["회오리 증폭", "피해 +6% · 범위 +8% · 강철 회오리가 전방 회오리 칼날 1개 추가 발사"],
    ranger_signature: ["화살 폭주", "피해 +5% · 치명타 확률 +4%p · 연발 사격 유도 화살 +2개, 연쇄 +1"],
    mage_signature: ["별빛 공명", "스킬 피해 +10% · 범위 +6% · 별빛 폭발 적중 시 파편 2개로 분열"],
    engineer_signature: ["전술 자동화", "설치물 피해 +14% · 지속시간 +10% · 자동 터렛 설치 시 미니 터렛 1기 추가"],
    puppeteer_signature: ["실의 공명", "피해 +5% · 상태이상 피해 +12%"],
    martialist_signature: ["연환 기세", "피해 +5% · 치명타 확률 +4%p"],
    alchemist_signature: ["촉매 과포화", "상태이상 피해 +12% · 화상 피해 +15%"],
    assassin_signature: ["그림자 처형", "치명타 확률 +4%p · 치명타 피해 +12%"],
  };
  const MONSTER_DETAILS = {
    training_dummy: { stats: [360, 0, 0, 0], role: "훈련용 표적", behavior: "공격하거나 이동하지 않습니다. 대기방에서 피해량과 상태이상을 시험할 때 사용합니다.", elite: "정예 변종 없음" },
    slime: { stats: [50, 94, 12, 14], role: "기본 근접", behavior: "플레이어에게 직선으로 접근해 접촉 공격을 합니다.", elite: "지면 강타: 반경 내 충격파와 넉백" },
    bat: { stats: [32, 166, 9, 12], role: "고속 근접", behavior: "낮은 체력을 빠른 이동으로 보완해 빈틈을 파고듭니다.", elite: "비명 충격파: 주변 광역 피해와 넉백" },
    brute: { stats: [138, 70, 23, 32], role: "중장 근접", behavior: "느리지만 피해가 높은 전방 휘두르기를 예고 후 사용합니다.", elite: "대지 진동: 넓은 지면 충격파" },
    guardian: { stats: [185, 64, 15, 40], role: "방어 지원", behavior: "가까운 적군 최대 5명에게 보호막을 부여합니다.", elite: "요새화: 더 넓은 범위에서 최대 7명 보호" },
    shaman: { stats: [92, 78, 12, 35], role: "회복 지원", behavior: "반경 내 부상당한 적을 최대 4명까지 회복합니다.", elite: "치유 토템: 강화된 범위 회복 지원" },
    spitter: { stats: [68, 90, 7, 27], role: "원거리", behavior: "거리를 유지하며 독성 투사체를 발사합니다.", elite: "독성 연사: 여러 발을 부채꼴로 발사" },
    bomber: { stats: [60, 138, 30, 30], role: "자폭", behavior: "플레이어에게 접근한 뒤 예고 범위 안에서 폭발합니다.", elite: "지뢰 살포: 접근 경로에 추가 폭발 지점 생성" },
    charger: { stats: [104, 96, 17, 34], role: "돌진", behavior: "중거리에서 경로를 예고하고 고속 돌진합니다.", elite: "연쇄 돌진: 방향을 다시 잡아 연속 돌진" },
    splitter: { stats: [88, 104, 14, 30], role: "분열", behavior: "사망 시 파편체를 생성해 전투 개체 수를 늘립니다.", elite: "대분열: 더 많은 파편체와 광역 파열" },
    splinter: { stats: [24, 156, 9, 4], role: "군집", behavior: "분열체에서 생성되는 소형 고속 근접 개체입니다.", elite: "정예 변종 없음" },
    runner: { stats: [46, 118, 0, 8], role: "봉쇄전 운반", behavior: "플레이어를 공격하지 않고 방어 목표 지점까지 이동합니다.", elite: "정예 변종 없음" },
    runner_tank: { stats: [128, 66, 0, 12], role: "봉쇄전 중장 운반", behavior: "느리지만 높은 체력으로 목표 지점을 향합니다.", elite: "정예 변종 없음" },
    runner_fast: { stats: [34, 176, 0, 9], role: "봉쇄전 신속 운반", behavior: "낮은 체력 대신 가장 빠른 속도로 목표 지점을 향합니다.", elite: "정예 변종 없음" },
    stalker: { stats: [62, 142, 16, 32], role: "암살", behavior: "그림자 이동 후 근접 찌르기와 표창을 번갈아 사용합니다.", elite: "그림자 습격: 순간 이동과 추가 표창 연계" },
    mortar: { stats: [106, 62, 10, 38], role: "장거리 포격", behavior: "지면에 원형 피격 범위를 예고한 뒤 광역 포탄을 떨어뜨립니다.", elite: "집속 포격: 여러 지점에 연속 포격" },
    sniper: { stats: [64, 88, 10, 34], role: "정밀 사격", behavior: "긴 조준선을 표시한 뒤 빠른 고피해 투사체를 발사합니다.", elite: "교차 사격: 여러 조준선으로 퇴로 봉쇄" },
    boss: { stats: [690, 84, 34, 120], role: "보스 기본체", behavior: "실제 보스는 이 기본 능력치에 보스 프로필과 스테이지 보정을 곱해 생성됩니다.", elite: "보스 프로필에 따라 별도 패턴 사용" },
  };
  const BOSS_DETAILS = {
    blade_duelist: { tier: "1장 준보스", multipliers: ["체력 ×0.54", "피해 ×0.78", "속도 ×1.04"], phases: "체력 50%에서 2페이즈 · 피해 ×1.04 · 최대 체력 6% 보호막", patterns: ["전방 베기", "짧은 돌진", "십자 참격", "칼날 부채", "가드 브레이크"] },
    plague_acolyte: { tier: "2장 준보스", multipliers: ["체력 ×0.82", "피해 ×0.86", "속도 ×0.98"], phases: "체력 50%에서 2페이즈 · 피해 ×1.04 · 최대 체력 6% 보호막", patterns: ["독 장판", "독 탄환 고리", "의식 폭발", "안전지대 개화", "맹독 부채"] },
    void_hunter: { tier: "3장 준보스", multipliers: ["체력 ×0.86", "피해 ×0.92", "속도 ×1.12"], phases: "체력 50%에서 2페이즈 · 피해 ×1.04 · 최대 체력 6% 보호막", patterns: ["그림자 찌르기", "표창 부채", "순간 저격", "교차 사격", "표식 폭발"] },
    iron_warden: { tier: "1장 보스", multipliers: ["체력 ×2.35", "피해 ×1.14", "속도 ×1.08", "크기 ×1.16", "경험치 ×1.25"], phases: "체력 72% / 40%에서 페이즈 전환 · 전환마다 피해 ×1.06 · 최대 체력 12% / 10% 보호막", patterns: ["십자 충격파", "칼날 광선 부채", "지면 파쇄", "회전 베기", "안전 틈새 요새"] },
    hive_prophet: { tier: "2장 보스", multipliers: ["체력 ×3.55", "피해 ×1.22", "속도 ×0.98", "크기 ×1.22", "경험치 ×1.45"], phases: "체력 72% / 40%에서 페이즈 전환 · 전환마다 피해 ×1.06 · 최대 체력 12% / 10% 보호막", patterns: ["군체 소환과 회복", "산성 장판 고리", "의식 십자", "안전지대 개화", "맹독 탄막"] },
    void_regent: { tier: "3장 최종 보스", multipliers: ["체력 ×4.25", "피해 ×1.32", "속도 ×1.05", "크기 ×1.32", "경험치 ×1.70"], phases: "체력 72% / 40%에서 페이즈 전환 · 전환마다 피해 ×1.06 · 최대 체력 12% / 10% 보호막", patterns: ["예측 위치 저격", "십자 공허 레이저", "공허 구체 고리", "거울 탄막", "공허 붕괴"] },
    fate_executioner: { tier: "9분 생존 히든 보스", multipliers: ["체력: 최종 보스 체력 ×설정 배율 또는 생성 체력 ×12 중 높은 값", "피해: 생성 피해 ×2.4 또는 파티 최대 체력 ×62% 중 높은 값", "속도 ×1.38", "크기 ×1.14", "초기 보호막: 최대 체력 8%"], phases: "체력 80% / 55% / 28%에서 총 4페이즈 · 공격 간격이 단계마다 크게 감소", patterns: ["붉은 감옥", "끈질긴 연쇄 추적", "레이저·탄환 교차 사격", "충격파와 광역 폭발의 최종 선고"] },
  };
  const RELIC_DETAILS = {
    power_core: { cap: 5, type: "곱연산", unit: "공격력 ×1.10", values: ["+10%", "+21%", "+33.1%", "+46.4%", "+61.1%"], note: "현재 공격 배율에 중첩마다 ×1.10을 적용합니다." },
    iron_plate: { cap: 5, type: "고정 수치", unit: "방어 +2", values: ["+2", "+4", "+6", "+8", "+10"], note: "플레이어 최종 방어 수치는 18을 넘지 않습니다." },
    swift_boots: { cap: 5, type: "곱연산", unit: "이동 속도 ×1.10", values: ["+10%", "+21%", "+33.1%", "+46.4%", "+61.1%"], note: "현재 이동 속도 배율에 중첩마다 ×1.10을 적용합니다." },
    cooling_gear: { cap: 5, type: "합연산", unit: "스킬 가속 +10", values: ["+10", "+20", "+30", "+40", "+50"], note: "Q/E/R/F 스킬에 적용되며 최대 스킬 가속은 500입니다." },
    rapid_loader: { cap: 5, type: "합연산", unit: "공격 속도 +10", values: ["+10", "+20", "+30", "+40", "+50"], note: "기본 공격과 기계공 터렛·드론의 공격 간격을 기본 간격 × 100 / (100 + 공격 속도)로 계산합니다." },
    splitter_core: { cap: 1, type: "고정 수치", unit: "투사체 수 +1", values: ["+1"], note: "투사체 계열에만 적용되며 실제 발사체가 1개 늘어납니다. 최대 1중첩입니다." },
    giant_lens: { cap: 5, type: "곱연산", unit: "범위 ×1.10", values: ["+10%", "+21%", "+33.1%", "+46.4%", "+61.1%"], note: "범위 공격과 폭발의 판정 반경 및 대응 그래픽 크기에 적용됩니다." },
    sharp_eye: { cap: 5, type: "합연산", unit: "치명타 확률 +10%p", values: ["+10%p", "+20%p", "+30%p", "+40%p", "+50%p"], note: "최종 치명타 확률은 85%를 넘지 않습니다." },
    fatal_mark: { cap: 5, type: "곱연산", unit: "치명타 피해 ×1.10", values: ["+10%", "+21%", "+33.1%", "+46.4%", "+61.1%"], note: "직업의 기본 치명타 피해 배율에 중첩마다 ×1.10을 적용합니다." },
    living_moss: { cap: 5, type: "고정 수치", unit: "초당 재생 +0.5", values: ["+0.5/s", "+1.0/s", "+1.5/s", "+2.0/s", "+2.5/s"], note: "기본 체력 재생에 합산됩니다." },
    heartstone: { cap: 5, type: "고정 수치", unit: "최대 체력 +25", values: ["+25", "+50", "+75", "+100", "+125"], note: "획득 즉시 최대 체력과 현재 체력이 각각 25 증가합니다." },
  };
  const ACHIEVEMENTS = [
    { id: "first_run", name: "첫 원정", text: "런 1회 완료", target: 1, current: (p) => p.statistics.runs, reward: { shards: 20, title: "초행자" } },
    { id: "first_victory", name: "첫 돌파", text: "런 1회 승리", target: 1, current: (p) => p.statistics.victories, reward: { shards: 45, skin: "victory_trim" } },
    { id: "abyss_3", name: "심연 탐사자", text: "심연 3층 도달", target: 3, current: (p) => p.records.highestAbyssDepth, reward: { shards: 80, title: "심연 탐사자" } },
    { id: "ascension_1", name: "승천 입문", text: "승천 1단계 클리어", target: 1, current: (p) => p.records.highestAscension, reward: { shards: 120, title: "승천자" } },
    { id: "collector_12", name: "수집가", text: "장비 도감 12종 발견", target: 12, current: (p) => p.collections.equipmentBases.length, reward: { shards: 70 } },
    { id: "legendary_item", name: "황금빛 전리품", text: "전설 장비 획득", target: 1, current: (p) => Number(p.inventory.items.some((item) => item.rarity === "legendary")), reward: { stones: 25 } },
    { id: "enhance_10", name: "담금질", text: "장비 +10 강화", target: 10, current: (p) => Math.max(0, ...p.inventory.items.map((item) => item.enhance)), reward: { dust: 30 } },
    { id: "rune_tier_4", name: "룬 연금술", text: "4단계 룬 제작", target: 4, current: (p) => Math.max(0, ...p.inventory.runes.map((rune) => rune.tier)), reward: { essence: 2 } },
    { id: "grinder_25", name: "노련한 원정대", text: "런 25회 완료", target: 25, current: (p) => p.statistics.runs, reward: { shards: 160, title: "백전노장" } },
    { id: "score_100k", name: "전장의 전설", text: "누적 점수 100,000", target: 100000, current: (p) => p.statistics.totalScore, reward: { shards: 220, skin: "abyss_glow" } },
    { id: "ranger_poison_million", name: "맹독의 비", text: "궁수로 독 피해 1,000,000 누적", target: 1000000, current: (p) => p.combatByClass.ranger.poisonDamage, reward: { shards: 250, title: "맹독 추적자" } },
    { id: "warrior_no_down", name: "쓰러지지 않는 방패", text: "전사로 무다운 클리어", target: 1, current: (p) => p.combatByClass.warrior.noDownWins, reward: { shards: 120, title: "불굴" } },
    { id: "mage_ascension_5", name: "승천한 대마도사", text: "마법사로 승천 5 클리어", target: 5, current: (p) => integer(p.records.classBestAscension.mage), reward: { shards: 180, skin: "season_ember" } },
    { id: "engineer_turret_5000", name: "무인 전선", text: "기계공 터렛으로 5,000킬", target: 5000, current: (p) => p.combatByClass.engineer.turretKills, reward: { shards: 280, title: "자동화 지휘관" } },
    { id: "runs_5", name: "준비된 생존자 I", text: "런 5회 완료", target: 5, current: (p) => p.statistics.runs, reward: { shards: 45 } },
    { id: "runs_10", name: "준비된 생존자 II", text: "런 10회 완료", target: 10, current: (p) => p.statistics.runs, reward: { shards: 80, stones: 10 } },
    { id: "runs_50", name: "준비된 생존자 III", text: "런 50회 완료", target: 50, current: (p) => p.statistics.runs, reward: { shards: 260, dust: 30 } },
    { id: "victories_5", name: "돌파자 I", text: "런 5회 승리", target: 5, current: (p) => p.statistics.victories, reward: { shards: 100 } },
    { id: "victories_15", name: "돌파자 II", text: "런 15회 승리", target: 15, current: (p) => p.statistics.victories, reward: { shards: 240, essence: 3 } },
    { id: "abyss_6", name: "심연 답사자 II", text: "심연 6층 도달", target: 6, current: (p) => p.records.highestAbyssDepth, reward: { shards: 170 } },
    { id: "abyss_10", name: "심연 답사자 III", text: "심연 10층 도달", target: 10, current: (p) => p.records.highestAbyssDepth, reward: { shards: 350, skin: "abyss_glow" } },
    { id: "ascension_3", name: "승천자 II", text: "승천 3단계 클리어", target: 3, current: (p) => p.records.highestAscension, reward: { shards: 320, stones: 30 } },
    { id: "ascension_5", name: "승천자 III", text: "승천 5단계 클리어", target: 5, current: (p) => p.records.highestAscension, reward: { shards: 700, stones: 60, essence: 8, title: "경계를 넘은 자" } },
    { id: "collector_40", name: "장비 수집가 II", text: "장비 도감 40종 발견", target: 40, current: (p) => p.collections.equipmentBases.length, reward: { shards: 160, stones: 20 } },
    { id: "collector_100", name: "장비 수집가 III", text: "장비 도감 100종 발견", target: 100, current: (p) => p.collections.equipmentBases.length, reward: { shards: 420, essence: 5 } },
    { id: "mythic_item", name: "신화의 주인", text: "신화 장비 획득", target: 1, current: (p) => Number(p.inventory.items.some((item) => item.rarity === "mythic")), reward: { stones: 40, dust: 40 } },
    { id: "enhance_15", name: "담금질 II", text: "장비 +15 강화", target: 15, current: (p) => Math.max(0, ...p.inventory.items.map((item) => item.enhance)), reward: { shards: 150, stones: 30 } },
    { id: "enhance_20", name: "담금질 III", text: "장비 +20 강화", target: 20, current: (p) => Math.max(0, ...p.inventory.items.map((item) => item.enhance)), reward: { shards: 320, essence: 4 } },
    { id: "rune_grade_s", name: "룬 연성 I", text: "S등급 룬 제작", target: 5, current: (p) => Math.max(0, ...p.inventory.runes.map((rune) => rune.tier)), reward: { essence: 2 } },
    { id: "rune_grade_sss", name: "룬 연성 II", text: "SSS등급 룬 제작", target: 7, current: (p) => Math.max(0, ...p.inventory.runes.map((rune) => rune.tier)), reward: { shards: 260, essence: 4 } },
    { id: "rune_grade_x", name: "룬 연성 III", text: "X등급 룬 제작", target: 8, current: (p) => Math.max(0, ...p.inventory.runes.map((rune) => rune.tier)), reward: { shards: 500, title: "룬 초월자" } },
    { id: "score_500k", name: "전장의 전설 II", text: "누적 점수 500,000", target: 500000, current: (p) => p.statistics.totalScore, reward: { shards: 420, stones: 40 } },
    { id: "items_found_100", name: "노획 전문가 I", text: "장비 100개 획득", target: 100, current: (p) => p.statistics.itemsFound, reward: { shards: 140 } },
    { id: "items_found_500", name: "노획 전문가 II", text: "장비 500개 획득", target: 500, current: (p) => p.statistics.itemsFound, reward: { shards: 420, dust: 60 } },
    { id: "runes_found_50", name: "룬 탐색자", text: "룬 50개 획득", target: 50, current: (p) => p.statistics.runesFound, reward: { shards: 180, essence: 3 } },
    { id: "crafts_30", name: "연성 장인", text: "제작 또는 합성 30회", target: 30, current: (p) => p.statistics.crafts, reward: { shards: 220, dust: 40 } },
  ];
  const COSMETIC_EFFECTS = {
    titles: {
      "초행자": { text: "최대 체력 +3%", maxHpMul: 0.03 },
      "심연 탐사자": { text: "보스 피해 +5%", bossDamageMul: 0.05 },
      "승천자": { text: "모든 피해 +4%", damageMul: 0.04 },
      "백전노장": { text: "방어 +1", armorBonus: 1 },
      "맹독 추적자": { text: "상태이상 피해 +8%", statusDamageMul: 0.08 },
      "불굴": { text: "최대 체력 +6%", maxHpMul: 0.06 },
      "자동화 지휘관": { text: "설치물 피해 +10%", constructDamageMul: 0.1 },
      "시즌 개척자": { text: "이동 속도 +3%", speedMul: 0.03 },
      "심연의 계절": { text: "보스 피해 +8%", bossDamageMul: 0.08 },
      "경계를 넘은 자": { text: "모든 피해 +5% · 최대 체력 +5%", damageMul: 0.05, maxHpMul: 0.05 },
      "룬 초월자": { text: "치명타 확률 +3% · 범위 +5%", critChanceBonus: 0.03, areaMul: 0.05 },
    },
    skins: {
      victory_trim: { label: "승전 장식", text: "치명타 +2.5% · 직업 장비에 왕실 금장과 태양 문장 추가", critChanceBonus: 0.025 },
      abyss_glow: { label: "심연 광휘", text: "피해 +3% · 보스 +5% · 직업 공격에 심연 균열 잔광 추가", damageMul: 0.03, bossDamageMul: 0.05 },
      season_ember: { label: "계절의 불씨", text: "화상 +12% · 직업 무기와 스킬에 잿불 궤적 추가", burnDamageMul: 0.12 },
      season_verdant: { label: "계절의 새싹", text: "체력 +4% · 이동 +2% · 직업 장비에 생명 문양과 잎 장식 추가", maxHpMul: 0.04, speedMul: 0.02 },
    },
  };
  const SKIN_PRESENTATION = {
    victory_trim: { main: "#facc15", hot: "#fff7cc", icon: "star" },
    abyss_glow: { main: "#c084fc", hot: "#67e8f9", icon: "brightness_2" },
    season_ember: { main: "#ff5a1f", hot: "#fff1a8", icon: "local_fire_department" },
    season_verdant: { main: "#34d399", hot: "#ecfccb", icon: "eco" },
  };
  const BOSS_RECIPES = [
    { id: "warden_bulwark", bossId: "iron_warden", materialName: "철갑 파편", amount: 8, shards: 220, essence: 12, label: "철의 감시자 방벽" },
    { id: "prophet_censer", bossId: "hive_prophet", materialName: "군체 포자", amount: 10, shards: 280, essence: 18, label: "군체 예언자의 향로" },
    { id: "regent_engine", bossId: "void_regent", materialName: "공허 왕핵", amount: 12, shards: 360, essence: 26, label: "공허 섭정의 동력핵" },
    { id: "abyss_crown", bossId: "void_regent", materialName: "공허 왕핵", amount: 20, shards: 600, essence: 45, label: "심연 군주의 관" },
  ];
  const SEASON_REWARDS = [
    { level: 3, title: "시즌 개척자", label: "칭호: 시즌 개척자" },
    { level: 5, skin: "season_verdant", label: "스킨: 계절의 빛" },
    { level: 7, rune: "eclipse", label: "시즌 일식 룬 T2" },
    { level: 10, title: "심연의 계절", skin: "season_ember", label: "칭호·잿불 스킨" },
  ];
  const CUSTOM_STAT_KEYS = ["itemsFound", "runesFound", "itemsSalvaged", "enhancements", "reforges", "crafts", "challengeCompletions"];
  const CUSTOM_CURRENCY_KEYS = ["enhancementStones", "reforgingDust", "bossEssence"];

  function clone(value) {
    return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function integer(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
    const number = Number(value);
    return Math.max(0, Math.min(max, Math.floor(Number.isFinite(number) ? number : fallback)));
  }

  function unique(values) {
    return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value || "").slice(0, 80)).filter(Boolean)));
  }

  function normalizeCountRecord(value) {
    const result = {};
    if (!value || typeof value !== "object") return result;
    for (const [key, count] of Object.entries(value)) result[String(key).slice(0, 64)] = integer(count);
    return result;
  }

  function matchesSearch(query, ...values) {
    const normalize = (value) => String(value || "")
      .normalize("NFKC")
      .toLocaleLowerCase("ko")
      .replace(/[·/,_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const terms = normalize(query).split(" ").filter(Boolean);
    if (!terms.length) return true;
    const haystack = normalize(values.join(" "));
    return terms.every((term) => haystack.includes(term));
  }

  function emptyCombatStats() {
    return { damage: 0, poisonDamage: 0, burnDamage: 0, kills: 0, eliteKills: 0, turretKills: 0, bossKills: 0, noDownWins: 0 };
  }

  function hashString(value) {
    let hash = 2166136261;
    for (const char of String(value || "")) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createRandom(seed) {
    let state = (seed >>> 0) || 0x9e3779b9;
    return () => {
      state += 0x6d2b79f5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rarityById(id) {
    return RARITIES.find((rarity) => rarity.id === id) || RARITIES[0];
  }

  function baseById(id) {
    return ITEM_BASES.find((item) => item.id === id) || ITEM_BASES[0];
  }

  function runeDefById(id) {
    return RUNES.find((rune) => rune.id === id) || RUNES[0];
  }

  function emptyLoadout() {
    return { weapon: "", armor: "", amulet: "", core: "", runes: ["", "", ""] };
  }

  function normalizeAffixes(value, limit = 5) {
    const usedAffixes = new Set();
    return (Array.isArray(value) ? value : []).slice(0, limit).map((affix) => {
      const requested = AFFIXES.find((entry) => entry.id === affix?.id && !usedAffixes.has(entry.id));
      const def = requested || AFFIXES.find((entry) => !usedAffixes.has(entry.id)) || AFFIXES[0];
      usedAffixes.add(def.id);
      const rawValue = Number(affix?.value) || def.min;
      const migratedValue = def.id === "haste" && rawValue > 0 && rawValue <= 0.5 ? rawValue * 100 : rawValue;
      const maxValue = def.id === "haste" || def.id === "attack_speed" ? 500 : 2;
      return { id: def.id, value: Math.max(0, Math.min(maxValue, migratedValue)) };
    });
  }

  function getPrimaryAffixValue(slot, itemLevel, rarityRank) {
    const level = Math.sqrt(Math.max(1, itemLevel));
    const rarityScale = RARITY_PRIMARY_SCALE[rarityRank] || 1;
    if (slot === "weapon") return Math.round((2.5 + level * 0.6) * rarityScale * 100) / 100;
    if (slot === "armor") return Math.round((0.6 + level * 0.075) * rarityScale * 100) / 100;
    return 0;
  }

  function normalizeItemAffixes(item, baseDef, rarity, itemLevel) {
    const rarityRank = rarityById(rarity).rank;
    if (baseDef.slot === "weapon") return [{ id: "attack_flat", value: getPrimaryAffixValue("weapon", itemLevel, rarityRank) }];
    if (baseDef.slot === "armor") {
      const healthArmor = hashString(`${item?.id || baseDef.id}:armor-primary`) % 2 === 0;
      if (healthArmor) {
        const value = Math.round((24 + Math.sqrt(itemLevel) * 2.8) * (RARITY_PRIMARY_SCALE[rarityRank] || 1) * 10) / 10;
        return [{ id: "health_flat", value }];
      }
      return [{ id: "armor_flat", value: getPrimaryAffixValue("armor", itemLevel, rarityRank) }];
    }
    const existing = normalizeAffixes(item?.affixes, 1).find((affix) => RANDOM_AFFIX_IDS.includes(affix.id));
    if (existing) return [existing];
    const random = createRandom(hashString(`${item?.id || baseDef.id}:${itemLevel}:${rarity}:accessory-primary`));
    return [rollAffix(random, itemLevel, rarityRank)];
  }

  function getEffectiveAffix(item, affix, enhance = item.enhance) {
    const def = AFFIXES.find((entry) => entry.id === affix.id) || AFFIXES[0];
    const rarityRank = rarityById(item.rarity).rank;
    const enhanceScale = RARITY_PRIMARY_SCALE[rarityRank] || 1;
    const step = def.enhanceStep != null
      ? def.enhanceStep
      : def.percent ? 0.003 : def.stat === "regenBonus" ? 0.035 : 0.1;
    const baseScale = item.slot === "amulet" || item.slot === "core" ? enhanceScale : 1;
    return { ...affix, value: Math.round((affix.value * baseScale + Math.max(0, enhance) * step * enhanceScale) * 10000) / 10000 };
  }

  function rollMilestoneAffix(itemId, milestone, random = null) {
    const pool = MILESTONE_AFFIX_POOLS[milestone] || [];
    const roll = random ? random() : createRandom(hashString(`${itemId}:legacy-milestone:${milestone}`))();
    const affix = pool[Math.floor(roll * pool.length)] || pool[0];
    return affix ? { ...affix, milestone } : null;
  }

  function normalizeMilestoneAffixes(value, itemId, enhance) {
    const source = Array.isArray(value) ? value : [];
    return ENHANCE_MILESTONES.filter((milestone) => enhance >= milestone).flatMap((milestone) => {
      const pool = MILESTONE_AFFIX_POOLS[milestone] || [];
      const saved = source.find((affix) => Number(affix?.milestone) === milestone && pool.some((entry) => entry.id === affix.id));
      if (saved) {
        const def = pool.find((entry) => entry.id === saved.id);
        return [{ id: def.id, value: def.value, milestone }];
      }
      const fallback = rollMilestoneAffix(itemId, milestone);
      return fallback ? [fallback] : [];
    });
  }

  function getMilestoneAffixes(item) {
    return Array.isArray(item.milestoneAffixes) ? item.milestoneAffixes.filter((affix) => item.enhance >= affix.milestone) : [];
  }

  function normalizeItem(item) {
    const baseDef = baseById(item?.baseId);
    const rarity = rarityById(item?.rarity).id;
    const itemLevel = integer(item?.itemLevel, 1, 9999) || 1;
    const affixes = normalizeItemAffixes(item, baseDef, rarity, itemLevel);
    const legacyLock = Number.isInteger(item?.lockedAffixIndex) && item.lockedAffixIndex >= 0 ? [item.lockedAffixIndex] : [];
    const lockedAffixIndices = [...new Set((Array.isArray(item?.lockedAffixIndices) ? item.lockedAffixIndices : legacyLock)
      .map((index) => Math.floor(Number(index)))
      .filter((index) => index >= 0 && index < affixes.length))]
      .slice(0, Math.max(0, affixes.length - 1))
      .sort((a, b) => a - b);
    const previewAffixes = normalizeAffixes(item?.reforgePreview?.affixes, affixes.length);
    const reforgePreview = previewAffixes.length === affixes.length && affixes.length
      ? { affixes: previewAffixes, cost: integer(item?.reforgePreview?.cost) }
      : null;
    const id = String(item?.id || `item-${hashString(JSON.stringify(item))}`).slice(0, 96);
    const enhance = integer(item?.enhance, 0, 20);
    return {
      id,
      baseId: baseDef.id,
      name: String(item?.name || baseDef.name).slice(0, 48),
      slot: baseDef.slot,
      classId: baseDef.classId,
      setId: baseDef.setId,
      special: baseDef.special,
      rarity,
      itemLevel,
      enhance,
      rerolls: integer(item?.rerolls, 0, 9999),
      lockedAffixIndices,
      reforgePreview,
      affixes,
      milestoneAffixes: normalizeMilestoneAffixes(item?.milestoneAffixes, id, enhance),
    };
  }

  function normalizeRune(rune) {
    const def = runeDefById(rune?.runeId);
    return {
      id: String(rune?.id || `rune-${hashString(JSON.stringify(rune))}`).slice(0, 96),
      runeId: def.id,
      tier: Math.max(1, integer(rune?.tier, 1, RUNE_GRADES.length)),
    };
  }

  function getPeriodInfo(now = new Date()) {
    const local = new Date(now);
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, "0");
    const day = String(local.getDate()).padStart(2, "0");
    const dailyKey = `${year}-${month}-${day}`;
    const monday = new Date(year, local.getMonth(), local.getDate());
    const weekday = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - weekday);
    const weeklyKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    const seasonId = `${year}-S${Math.floor(local.getMonth() / 3) + 1}`;
    return { dailyKey, weeklyKey, seasonId };
  }

  function makeDaily(key) {
    const seed = hashString(`daily:${key}`);
    const goals = [
      { type: "eliteKills", label: "엘리트 몬스터 10마리 처치", target: 10 },
      { type: "kills", label: "몬스터 100마리 처치", target: 100 },
      { type: "bossKills", label: "보스 1마리 처치", target: 1 },
      { type: "damage", label: "피해 30,000 누적", target: 30000 },
    ];
    const goal = goals[seed % goals.length];
    return { missionVersion: 2, key, goalType: goal.type, goalLabel: goal.label, target: goal.target, progress: 0, completed: false, rewardClaimed: false };
  }

  function makeWeekly(key) {
    const seed = hashString(`weekly:${key}`);
    const goals = [
      { type: "eliteKills", label: "엘리트 몬스터 60마리 처치", target: 60 },
      { type: "kills", label: "몬스터 600마리 처치", target: 600 },
      { type: "bossKills", label: "보스 6마리 처치", target: 6 },
      { type: "victories", label: "원정 3회 승리", target: 3 },
      { type: "stages", label: "스테이지 50개 클리어", target: 50 },
    ];
    const goal = goals[seed % goals.length];
    return { missionVersion: 2, key, goalType: goal.type, goalLabel: goal.label, target: goal.target, progress: 0, completed: false, rewardClaimed: false };
  }

  function normalizeChallenges(source) {
    const period = getPeriodInfo();
    const daily = source?.daily?.key === period.dailyKey && source.daily?.missionVersion === 2
      ? { ...makeDaily(period.dailyKey), ...source.daily }
      : makeDaily(period.dailyKey);
    const weekly = source?.weekly?.key === period.weeklyKey && source.weekly?.missionVersion === 2
      ? { ...makeWeekly(period.weeklyKey), ...source.weekly }
      : makeWeekly(period.weeklyKey);
    const season = source?.season?.id === period.seasonId
      ? { id: period.seasonId, xp: integer(source.season.xp), level: Math.max(1, integer(source.season.level, 1)), claimedLevels: unique(source.season.claimedLevels) }
      : { id: period.seasonId, xp: 0, level: 1, claimedLevels: [] };
    return { daily, weekly, season };
  }

  function normalizeProgress(progress) {
    const source = progress && typeof progress === "object" ? progress : {};
    const normalizedBase = base.normalizeProgress ? base.normalizeProgress(source) : clone(base.defaultProgress);
    const items = (Array.isArray(source.inventory?.items) ? source.inventory.items : []).slice(-240).map(normalizeItem);
    const runes = (Array.isArray(source.inventory?.runes) ? source.inventory.runes : []).slice(-180).map(normalizeRune);
    const itemIds = new Set(items.map((item) => item.id));
    const runeIds = new Set(runes.map((rune) => rune.id));
    const equipment = {};
    for (const classId of CLASS_IDS) {
      const raw = source.equipment?.[classId] || {};
      equipment[classId] = emptyLoadout();
      for (const slot of ITEM_SLOTS) {
        const id = String(raw[slot] || "");
        equipment[classId][slot] = itemIds.has(id) ? id : "";
      }
      equipment[classId].runes = [0, 1, 2].map((index) => {
        const id = String(raw.runes?.[index] || "");
        return runeIds.has(id) ? id : "";
      });
    }
    const customStatistics = {};
    for (const key of CUSTOM_STAT_KEYS) customStatistics[key] = integer(source.statistics?.[key]);
    const customCurrencies = {};
    for (const key of CUSTOM_CURRENCY_KEYS) customCurrencies[key] = integer(source.currencies?.[key]);
    const records = source.records || {};
    const combatByClass = {};
    for (const classId of CLASS_IDS) {
      const raw = source.combatByClass?.[classId] || {};
      combatByClass[classId] = Object.fromEntries(Object.keys(emptyCombatStats()).map((key) => [key, integer(raw[key])]));
    }
    const titles = unique(normalizedBase.titles);
    const skins = unique(normalizedBase.skins);
    return {
      ...normalizedBase,
      version: SAVE_VERSION,
      currencies: { ...normalizedBase.currencies, ...customCurrencies },
      statistics: { ...normalizedBase.statistics, ...customStatistics },
      records: {
        ...normalizedBase.records,
        dailyBest: records.dailyBest && typeof records.dailyBest === "object" ? { ...records.dailyBest } : {},
        weeklyBest: records.weeklyBest && typeof records.weeklyBest === "object" ? { ...records.weeklyBest } : {},
        classBestAscension: records.classBestAscension && typeof records.classBestAscension === "object" ? { ...records.classBestAscension } : {},
      },
      inventory: { items, runes, bossMaterials: normalizeCountRecord(source.inventory?.bossMaterials) },
      equipment,
      collections: {
        equipmentBases: unique(source.collections?.equipmentBases),
        runeTypes: unique(source.collections?.runeTypes),
        monsters: unique(source.collections?.monsters),
        bosses: unique(source.collections?.bosses),
        relics: unique(source.collections?.relics),
      },
      achievements: source.achievements && typeof source.achievements === "object" ? { ...source.achievements } : {},
      combatByClass,
      cosmetics: {
        selectedTitle: titles.includes(source.cosmetics?.selectedTitle) ? source.cosmetics.selectedTitle : "",
        selectedSkin: skins.includes(source.cosmetics?.selectedSkin) ? source.cosmetics.selectedSkin : "",
      },
      challenges: normalizeChallenges(source.challenges),
      lastRunRewards: source.lastRunRewards && typeof source.lastRunRewards === "object" ? clone(source.lastRunRewards) : null,
    };
  }

  function mergeMetaAfterBase(baseResult, previous) {
    return normalizeProgress({
      ...previous,
      ...baseResult,
      currencies: { ...previous.currencies, ...baseResult.currencies },
      statistics: { ...previous.statistics, ...baseResult.statistics },
      records: { ...previous.records, ...baseResult.records },
    });
  }

  function readProgress(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveUserProgress(progress) {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(normalizeProgress(progress)));
      return true;
    } catch {
      return false;
    }
  }

  function loadUserProgress() {
    const current = readProgress(PROGRESS_KEY);
    if (current) return normalizeProgress(current);
    let legacy = null;
    for (const key of LEGACY_PROGRESS_KEYS) {
      legacy = readProgress(key);
      if (legacy) break;
    }
    const migrated = normalizeProgress(legacy || (base.loadUserProgress ? base.loadUserProgress() : base.defaultProgress));
    saveUserProgress(migrated);
    return migrated;
  }

  function resetUserProgress() {
    const fresh = normalizeProgress(base.defaultProgress);
    saveUserProgress(fresh);
    return fresh;
  }

  function exportUserProgress(progress) {
    return JSON.stringify(normalizeProgress(progress), null, 2);
  }

  function importUserProgress(snapshot) {
    try {
      const parsed = typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
      const next = normalizeProgress(parsed);
      saveUserProgress(next);
      return next;
    } catch {
      throw new Error("진행도 데이터를 불러오지 못했습니다.");
    }
  }

  function rollRarity(random, power) {
    const mythic = Math.min(0.055, 0.002 + power * 0.0018);
    const legendary = Math.min(0.18, 0.012 + power * 0.006);
    const epic = Math.min(0.34, 0.08 + power * 0.012);
    const rare = Math.min(0.56, 0.26 + power * 0.014);
    const roll = random();
    if (roll < mythic) return "mythic";
    if (roll < mythic + legendary) return "legendary";
    if (roll < mythic + legendary + epic) return "epic";
    if (roll < mythic + legendary + epic + rare) return "rare";
    return "common";
  }

  function rollAffix(random, itemLevel, rarityRank, excluded = []) {
    const pool = AFFIXES.filter((affix) => RANDOM_AFFIX_IDS.includes(affix.id) && !excluded.includes(affix.id));
    const def = pool[Math.floor(random() * pool.length)] || AFFIXES[0];
    const levelScale = 1 + Math.log1p(itemLevel) * 0.12;
    return { id: def.id, value: Math.round((def.min + (def.max - def.min) * random()) * levelScale * 10000) / 10000 };
  }

  function generateItem(seed, result, index = 0, options = {}) {
    const random = createRandom(hashString(`${seed}:item:${index}:${options.craft || "drop"}`));
    const classId = CLASS_IDS.includes(result?.classId) ? result.classId : "warrior";
    const slot = options.slot || ITEM_SLOTS[Math.floor(random() * ITEM_SLOTS.length)];
    let pool = ITEM_BASES.filter((baseItem) => !baseItem.bossCraft && baseItem.slot === slot && (baseItem.classId === "all" || baseItem.classId === classId));
    if (options.baseId) pool = ITEM_BASES.filter((baseItem) => baseItem.id === options.baseId);
    const baseItem = pool[Math.floor(random() * pool.length)] || ITEM_BASES.find((entry) => entry.slot === slot && !entry.bossCraft) || ITEM_BASES[0];
    const power = integer(result?.highestLevel, 1) + integer(result?.abyssDepth) * 3 + integer(result?.ascensionLevel) * 3;
    const rarity = options.rarity || rollRarity(random, power);
    const rarityRank = rarityById(rarity).rank;
    const affixes = baseItem.slot === "amulet" || baseItem.slot === "core"
      ? [rollAffix(random, Math.max(1, power), rarityRank)]
      : [];
    return normalizeItem({
      id: `i-${hashString(`${seed}:${index}:${baseItem.id}:${rarity}`).toString(36)}-${index}`,
      baseId: baseItem.id,
      rarity,
      itemLevel: Math.max(1, power),
      enhance: options.enhance || 0,
      affixes,
    });
  }

  function generateRune(seed, result, index = 0) {
    const random = createRandom(hashString(`${seed}:rune:${index}`));
    const depth = integer(result?.abyssDepth) + integer(result?.ascensionLevel) * 3;
    const tier = random() < Math.min(0.35, depth * 0.018) ? 2 : 1;
    const def = RUNES[Math.floor(random() * RUNES.length)];
    return normalizeRune({ id: `r-${hashString(`${seed}:${index}:${def.id}`).toString(36)}-${index}`, runeId: def.id, tier });
  }

  function generateRunLoot(result) {
    const resultKey = String(result?.resultKey || `${result?.outcome}:${result?.totalScore}:${result?.durationSec}`);
    const seed = hashString(resultKey);
    const victory = result?.outcome === "victory";
    const depth = integer(result?.abyssDepth);
    const ascension = Math.min(5, integer(result?.ascensionLevel));
    const ascensionResourceMul = [1, 1.4, 1.9, 2.6, 3.5, 4.5][ascension] || 1;
    const runeCount = Math.min(3, (victory ? 1 : 0) + (depth > 0 ? 1 : 0));
    const runes = Array.from({ length: runeCount }, (_, index) => generateRune(seed, result, index));
    const liveEvent = getLiveEvent();
    return {
      resultKey,
      items: [],
      runes,
      enhancementStones: Math.floor((3 + integer(result?.stagesCleared) + (victory ? 5 : 0) + depth * 2) * ascensionResourceMul * liveEvent.rewardMultiplier),
      reforgingDust: Math.floor((Math.floor(integer(result?.highestLevel, 1) / 2) + depth * 2) * ascensionResourceMul * liveEvent.rewardMultiplier),
      bossEssence: (victory ? 2 + ascension * 2 : ascension) + Math.floor(depth / 2),
      eventMultiplier: liveEvent.rewardMultiplier,
    };
  }

  function grantEquipmentDrop(progress, drop = {}) {
    const next = normalizeProgress(progress);
    const dropId = String(drop.dropId || `field:${Date.now()}`);
    const item = generateItem(hashString(dropId), {
      classId: CLASS_IDS.includes(drop.classId) ? drop.classId : "warrior",
      highestLevel: Math.max(1, integer(drop.highestLevel, 1)),
      abyssDepth: Math.max(0, integer(drop.abyssDepth)),
      ascensionLevel: Math.max(0, integer(drop.ascensionLevel)),
    }, 0, drop.rarity ? { rarity: drop.rarity } : {});
    if (next.inventory.items.some((entry) => entry.id === item.id)) return { progress: next, item: null };
    next.inventory.items.push(item);
    next.statistics.itemsFound += 1;
    next.collections.equipmentBases = unique([...next.collections.equipmentBases, item.baseId]);
    const overflow = Math.max(0, next.inventory.items.length - 240);
    if (overflow > 0) {
      next.inventory.items.splice(0, overflow);
      next.currencies.enhancementStones += overflow * 3;
    }
    return { progress: normalizeProgress(next), item };
  }

  function getEquipmentDropPreview(drop = {}) {
    const dropId = String(drop.dropId || "field:preview");
    const item = generateItem(hashString(dropId), {
      classId: CLASS_IDS.includes(drop.classId) ? drop.classId : "warrior",
      highestLevel: Math.max(1, integer(drop.highestLevel, 1)),
      abyssDepth: Math.max(0, integer(drop.abyssDepth)),
      ascensionLevel: Math.max(0, integer(drop.ascensionLevel)),
    });
    return { rarity: item.rarity };
  }

  function getLiveEvent(now = new Date()) {
    const day = new Date(now).getDay();
    const active = day === 0 || day === 6;
    return {
      id: "weekend_forge",
      name: "주말 대장간 가동",
      text: active ? "강화석과 재련 가루 획득량 2배 적용 중" : "토요일과 일요일에 강화석·재련 가루 2배",
      active,
      rewardMultiplier: active ? 2 : 1,
    };
  }

  function applyAchievementReward(progress, reward = {}) {
    progress.currencies.abyssShards += integer(reward.shards);
    progress.currencies.enhancementStones += integer(reward.stones);
    progress.currencies.reforgingDust += integer(reward.dust);
    progress.currencies.bossEssence += integer(reward.essence);
    if (reward.title && !progress.titles.includes(reward.title)) progress.titles.push(reward.title);
    if (reward.skin && !progress.skins.includes(reward.skin)) progress.skins.push(reward.skin);
  }

  function grantSeasonRewards(progress, rewards) {
    for (const reward of SEASON_REWARDS) {
      const key = String(reward.level);
      if (progress.challenges.season.level < reward.level || progress.challenges.season.claimedLevels.includes(key)) continue;
      progress.challenges.season.claimedLevels.push(key);
      if (reward.title && !progress.titles.includes(reward.title)) progress.titles.push(reward.title);
      if (reward.skin && !progress.skins.includes(reward.skin)) progress.skins.push(reward.skin);
      if (reward.rune) {
        progress.inventory.runes.push(normalizeRune({
          id: `r-season-${progress.challenges.season.id}-${reward.level}`,
          runeId: reward.rune,
          tier: 2
        }));
        progress.collections.runeTypes = unique([...progress.collections.runeTypes, reward.rune]);
      }
      rewards.push({ label: reward.label, season: true });
    }
  }

  function evaluateAchievements(progress) {
    const unlocked = [];
    for (const achievement of ACHIEVEMENTS) {
      if (progress.achievements[achievement.id] || integer(achievement.current(progress)) < achievement.target) continue;
      progress.achievements[achievement.id] = new Date().toISOString();
      applyAchievementReward(progress, achievement.reward);
      unlocked.push(achievement.id);
    }
    return unlocked;
  }

  function updateChallengeProgress(progress, result) {
    const rewards = [];
    const daily = progress.challenges.daily;
    if (!daily.completed) {
      daily.progress = Math.min(daily.target, daily.progress + getMissionProgressGain(daily.goalType, result));
      daily.completed = daily.progress >= daily.target;
    }
    if (daily.completed && !daily.rewardClaimed) {
      daily.rewardClaimed = true;
      progress.currencies.abyssShards += 70;
      progress.currencies.enhancementStones += 12;
      progress.statistics.challengeCompletions += 1;
      rewards.push({ label: "일일 임무", shards: 70, stones: 12 });
    }
    const weekly = progress.challenges.weekly;
    if (!weekly.completed) {
      weekly.progress = Math.min(weekly.target, weekly.progress + getMissionProgressGain(weekly.goalType, result));
      weekly.completed = weekly.progress >= weekly.target;
    }
    if (weekly.completed && !weekly.rewardClaimed) {
      weekly.rewardClaimed = true;
      progress.currencies.abyssShards += 180;
      progress.currencies.bossEssence += 5;
      progress.statistics.challengeCompletions += 1;
      rewards.push({ label: "주간 임무", shards: 180, essence: 5 });
    }
    const seasonGain = 20 + integer(result?.stagesCleared) * 3 + (result?.outcome === "victory" ? 35 : 0) + integer(result?.abyssDepth) * 8;
    progress.challenges.season.xp += seasonGain;
    while (progress.challenges.season.xp >= progress.challenges.season.level * 100) {
      progress.challenges.season.xp -= progress.challenges.season.level * 100;
      progress.challenges.season.level += 1;
      progress.currencies.abyssShards += 25;
      progress.currencies.reforgingDust += 4;
      rewards.push({ label: `시즌 Lv.${progress.challenges.season.level}`, shards: 25, dust: 4 });
    }
    grantSeasonRewards(progress, rewards);
    return rewards;
  }

  function getMissionProgressGain(goalType, result) {
    const combat = result?.combatStats || {};
    const gains = {
      eliteKills: integer(combat.eliteKills),
      kills: integer(combat.kills),
      bossKills: integer(combat.bossKills),
      damage: integer(combat.damage),
      victories: result?.outcome === "victory" ? 1 : 0,
      stages: integer(result?.stagesCleared),
    };
    return gains[goalType] || 0;
  }

  function recordRunResult(progress, result = {}) {
    const previous = normalizeProgress(progress);
    const resultKey = String(result.resultKey || "");
    if (resultKey && previous.records.lastRunKey === resultKey) return previous;
    const baseResult = base.recordRunResult ? base.recordRunResult(previous, result) : previous;
    const next = mergeMetaAfterBase(baseResult, previous);
    const loot = generateRunLoot(result);
    next.inventory.items.push(...loot.items);
    next.inventory.runes.push(...loot.runes);
    next.currencies.enhancementStones += loot.enhancementStones;
    next.currencies.reforgingDust += loot.reforgingDust;
    next.currencies.bossEssence += loot.bossEssence;
    next.statistics.itemsFound += loot.items.length;
    next.statistics.runesFound += loot.runes.length;
    next.collections.equipmentBases = unique([...next.collections.equipmentBases, ...loot.items.map((item) => item.baseId)]);
    next.collections.runeTypes = unique([...next.collections.runeTypes, ...loot.runes.map((rune) => rune.runeId)]);
    const bossDefeats = unique(result?.bossDefeats || (result?.weeklyBossId ? [result.weeklyBossId] : []));
    for (const bossId of bossDefeats) {
      next.inventory.bossMaterials[bossId] = integer(next.inventory.bossMaterials[bossId]) + 1;
    }
    next.collections.bosses = unique([...next.collections.bosses, ...bossDefeats]);
    const resultClassId = CLASS_IDS.includes(result?.classId) ? result.classId : "warrior";
    const classCombat = next.combatByClass[resultClassId];
    const combat = result?.combatStats || {};
    for (const key of ["damage", "poisonDamage", "burnDamage", "kills", "eliteKills", "turretKills", "bossKills"]) {
      classCombat[key] += integer(combat[key]);
    }
    if (result?.outcome === "victory" && result?.noDown) classCombat.noDownWins += 1;
    const overflow = Math.max(0, next.inventory.items.length - 240);
    if (overflow > 0) {
      next.inventory.items.splice(0, overflow);
      next.currencies.enhancementStones += overflow * 3;
    }
    const challengeRewards = updateChallengeProgress(next, result);
    if (result?.outcome === "victory") {
      next.records.classBestAscension[resultClassId] = Math.max(
        integer(next.records.classBestAscension[resultClassId]),
        integer(result?.ascensionLevel),
      );
    }
    const achievements = evaluateAchievements(next);
    next.lastRunRewards = {
      resultKey: loot.resultKey,
      items: loot.items.map((item) => ({ id: item.id, name: item.name, rarity: item.rarity, enhance: item.enhance })),
      runes: loot.runes.map((rune) => ({ id: rune.id, runeId: rune.runeId, name: runeDefById(rune.runeId).name, tier: rune.tier })),
      enhancementStones: loot.enhancementStones,
      reforgingDust: loot.reforgingDust,
      bossEssence: loot.bossEssence,
      bossMaterials: bossDefeats,
      eventMultiplier: loot.eventMultiplier,
      challengeRewards,
      achievements,
    };
    return normalizeProgress(next);
  }

  function spendMasteryPoint(progress, classId, nodeId) {
    const previous = normalizeProgress(progress);
    const result = base.spendMasteryPoint(previous, classId, nodeId);
    return { ...result, progress: mergeMetaAfterBase(result.progress, previous) };
  }

  function addBonus(target, key, value) {
    target[key] = (target[key] || 0) + value;
  }

  function applyEquipmentAffix(bonuses, affix) {
    const def = AFFIXES.find((entry) => entry.id === affix.id);
    if (!def) return;
    const value = affix.value;
    if (def.stat === "attackBonus") addBonus(bonuses, "attackBonus", value);
    else if (def.stat === "maxHpBonus") addBonus(bonuses, "maxHpBonus", value);
    else if (def.stat === "damageMul") addBonus(bonuses, "damageMul", value);
    else if (def.stat === "maxHpMul") addBonus(bonuses, "maxHpMul", value);
    else if (def.stat === "speedMul") addBonus(bonuses, "speedMul", value);
    else if (def.stat === "attackSpeed") bonuses.attackSpeed += value;
    else if (def.stat === "skillHaste") bonuses.skillHaste += value;
    else if (def.stat === "armorBonus") addBonus(bonuses, "armorBonus", value);
    else if (def.stat === "critChanceBonus") addBonus(bonuses, "critChanceBonus", value);
    else if (def.stat === "eliteDamage") addBonus(bonuses, "eliteDamageMul", value);
    else if (def.stat === "statusDamage") addBonus(bonuses, "statusDamageMul", value);
    else if (def.stat === "regenBonus") addBonus(bonuses, "regenBonus", value);
    else if (def.stat === "critDamageMul") addBonus(bonuses, "critDamageMul", value);
    else if (def.stat === "areaMul") addBonus(bonuses, "areaMul", value);
  }

  function applyRaritySpecial(bonuses, special, scale) {
    if (special === "boss_hunter") bonuses.bossDamageMul += 0.1 * scale;
    if (special === "ricochet") bonuses.wallBounceBonus += 1;
    if (special === "skill_amp") { bonuses.damageMul += 0.035 * scale; bonuses.areaMul += 0.05 * scale; }
    if (special === "construct_amp") { bonuses.constructDamageMul += 0.11 * scale; bonuses.constructDurationMul += 0.09 * scale; }
    if (special === "status_amp") bonuses.statusDamageMul += 0.11 * scale;
    if (special === "venom_cap") bonuses.poisonStackCapBonus += 1;
    if (special === "crit_amp") { bonuses.critChanceBonus += 0.035 * scale; bonuses.critDamageMul += 0.08 * scale; }
    if (special === "last_guard") bonuses.lowHpShieldRatio = Math.max(bonuses.lowHpShieldRatio, 0.18 * scale);
    if (special === "swift_guard") { bonuses.speedMul += 0.035 * scale; bonuses.armorBonus += 0.8 * scale; }
    if (special === "warden_oath") { bonuses.maxHpMul += 0.12 * scale; bonuses.armorBonus += 1.5 * scale; bonuses.lowHpShieldRatio = Math.max(bonuses.lowHpShieldRatio, 0.35); }
    if (special === "prophet_bloom") { bonuses.statusDamageMul += 0.22 * scale; bonuses.poisonStackCapBonus += 2; bonuses.regenBonus += 0.35 * scale; }
    if (special === "regent_singularity") { bonuses.damageMul += 0.1 * scale; bonuses.areaMul += 0.14 * scale; bonuses.skillHaste += 8 * scale; }
    if (special === "abyss_crown") { bonuses.bossDamageMul += 0.25 * scale; bonuses.damageMul += 0.12 * scale; bonuses.bossFinisherMul = Math.max(bonuses.bossFinisherMul, 1.45); bonuses.bossFinisherThreshold = Math.max(bonuses.bossFinisherThreshold, 0.2); }
    if (special === "burn_amp") bonuses.burnDamageMul += 0.28 * scale;
    if (special === "turret_sustain") bonuses.turretKillDurationBonus += 0.8 * scale;
    if (special === "warrior_signature") { bonuses.damageMul += 0.06 * scale; bonuses.areaMul += 0.08 * scale; bonuses.warriorWhirlwindEcho = 1; }
    if (special === "ranger_signature") { bonuses.damageMul += 0.05 * scale; bonuses.critChanceBonus += 0.04 * scale; bonuses.rangerVolleyBonus = 2; }
    if (special === "mage_signature") { bonuses.damageMul += 0.1 * scale; bonuses.areaMul += 0.06 * scale; bonuses.mageStarSplit = 1; }
    if (special === "engineer_signature") { bonuses.constructDamageMul += 0.14 * scale; bonuses.constructDurationMul += 0.1 * scale; bonuses.engineerAuxTurret = 1; }
    if (special === "puppeteer_signature") { bonuses.damageMul += 0.05 * scale; bonuses.statusDamageMul += 0.12 * scale; }
    if (special === "martialist_signature") { bonuses.damageMul += 0.05 * scale; bonuses.critChanceBonus += 0.04 * scale; }
    if (special === "alchemist_signature") { bonuses.statusDamageMul += 0.12 * scale; bonuses.burnDamageMul += 0.15 * scale; }
    if (special === "assassin_signature") { bonuses.critChanceBonus += 0.04 * scale; bonuses.critDamageMul += 0.12 * scale; }
  }

  function calculateEquipmentBonuses(progress, classId) {
    const next = normalizeProgress(progress);
    const loadout = next.equipment[classId] || emptyLoadout();
    const itemMap = new Map(next.inventory.items.map((item) => [item.id, item]));
    const runeMap = new Map(next.inventory.runes.map((rune) => [rune.id, rune]));
    const bonuses = {
      attackBonus: 0, maxHpBonus: 0, damageMul: 1, maxHpMul: 1, regenBonus: 0, speedMul: 1, attackSpeed: 0, skillHaste: 0, armorBonus: 0,
      critChanceBonus: 0, critDamageMul: 1, eliteDamageMul: 1, bossDamageMul: 1,
      statusDamageMul: 1, areaMul: 1, constructDamageMul: 1,
      constructDurationMul: 1, burnDamageMul: 1, turretKillDurationBonus: 0,
      wallBounceBonus: 0, poisonStackCapBonus: 0, lowHpShieldRatio: 0,
      bossFinisherMul: 1, bossFinisherThreshold: 0,
      warriorWhirlwindEcho: 0, rangerVolleyBonus: 0, mageStarSplit: 0, engineerAuxTurret: 0,
      vanguardWhirlwindGuard: 0, hunterRainBarrage: 0, arcanistPiercingFragments: 0, mechanistTurretMine: 0,
    };
    const equippedItems = ITEM_SLOTS.map((slot) => itemMap.get(loadout[slot])).filter(Boolean);
    const sets = {};
    for (const item of equippedItems) {
      const rarityRank = rarityById(item.rarity).rank;
      for (const affix of item.affixes) applyEquipmentAffix(bonuses, getEffectiveAffix(item, affix));
      for (const affix of getMilestoneAffixes(item)) applyEquipmentAffix(bonuses, affix);
      sets[item.setId] = (sets[item.setId] || 0) + 1;
      const specialScale = RARITY_SPECIAL_SCALE[rarityRank] || 0;
      if (specialScale > 0) applyRaritySpecial(bonuses, item.special, specialScale);
    }
    for (const [setId, count] of Object.entries(sets)) {
      const setBonus = SET_BONUSES[setId];
      if (!setBonus) continue;
      const tiers = count >= 4 ? [setBonus.twoStats, setBonus.fourStats] : count >= 2 ? [setBonus.twoStats] : [];
      for (const stats of tiers) {
        for (const [key, value] of Object.entries(stats || {})) {
          if (key === "skillCooldownReduction") bonuses.skillHaste += value * 100;
          else addBonus(bonuses, key, value);
        }
      }
    }
    for (const runeId of loadout.runes || []) {
      const rune = runeMap.get(runeId);
      if (!rune) continue;
      const tier = Math.max(1, Math.min(RUNE_GRADES.length, rune.tier));
      const power = RUNE_GRADE_POWER[tier - 1];
      if (rune.runeId === "fury") bonuses.damageMul += 0.018 * power;
      if (rune.runeId === "ward") { bonuses.maxHpMul += 0.025 * power; bonuses.armorBonus += 0.22 * power; }
      if (rune.runeId === "haste") { bonuses.speedMul += 0.008 * power; bonuses.skillHaste += 0.9 * power; }
      if (rune.runeId === "venom") { bonuses.statusDamageMul += 0.025 * power; if (tier >= 5) bonuses.poisonStackCapBonus += 1; }
      if (rune.runeId === "rebound" && tier >= 4) bonuses.wallBounceBonus += 1;
      if (rune.runeId === "eclipse") { bonuses.burnDamageMul += 0.04 * power; bonuses.statusDamageMul += 0.035 * power; bonuses.bossDamageMul += 0.02 * power; }
      if (rune.runeId === "precision") bonuses.critChanceBonus += 0.012 * power;
      if (rune.runeId === "ruin") bonuses.critDamageMul += 0.025 * power;
      if (rune.runeId === "colossus") bonuses.maxHpMul += 0.04 * power;
      if (rune.runeId === "bastion") bonuses.armorBonus += 0.42 * power;
      if (rune.runeId === "hunter") bonuses.bossDamageMul += 0.025 * power;
      if (rune.runeId === "slayer") bonuses.eliteDamageMul += 0.028 * power;
      if (rune.runeId === "wildfire") bonuses.burnDamageMul += 0.05 * power;
      if (rune.runeId === "expansion") bonuses.areaMul += 0.018 * power;
      if (rune.runeId === "automation") bonuses.constructDamageMul += 0.03 * power;
      if (rune.runeId === "longevity") bonuses.constructDurationMul += 0.025 * power;
      if (rune.runeId === "focus") bonuses.skillHaste += 1.2 * power;
      if (rune.runeId === "momentum") bonuses.speedMul += 0.012 * power;
      if (rune.runeId === "execution") { bonuses.damageMul += 0.012 * power; bonuses.critChanceBonus += 0.008 * power; }
      if (rune.runeId === "frost") { bonuses.statusDamageMul += 0.022 * power; bonuses.areaMul += 0.01 * power; }
      if (rune.runeId === "storm") { bonuses.damageMul += 0.012 * power; bonuses.skillHaste += 0.8 * power; }
      if (rune.runeId === "alchemy") { bonuses.statusDamageMul += 0.022 * power; bonuses.burnDamageMul += 0.03 * power; }
      if (rune.runeId === "shadow") { bonuses.critDamageMul += 0.02 * power; bonuses.speedMul += 0.007 * power; }
      if (rune.runeId === "vitality") { bonuses.maxHpMul += 0.022 * power; bonuses.damageMul += 0.009 * power; }
    }
    const cosmeticEffects = [
      COSMETIC_EFFECTS.titles[next.cosmetics.selectedTitle],
      COSMETIC_EFFECTS.skins[next.cosmetics.selectedSkin],
    ].filter(Boolean);
    for (const effect of cosmeticEffects) {
      for (const [key, value] of Object.entries(effect)) {
        if (key === "text" || key === "label") continue;
        addBonus(bonuses, key, Number(value) || 0);
      }
    }
    bonuses.damageMul = Math.min(1.6, bonuses.damageMul);
    bonuses.maxHpMul = Math.min(1.5, bonuses.maxHpMul);
    bonuses.regenBonus = Math.min(2.5, bonuses.regenBonus);
    bonuses.speedMul = Math.min(1.25, bonuses.speedMul);
    bonuses.attackSpeed = Math.min(500, bonuses.attackSpeed);
    bonuses.skillHaste = Math.min(500, bonuses.skillHaste);
    bonuses.armorBonus = Math.min(6, bonuses.armorBonus);
    bonuses.critChanceBonus = Math.min(0.22, bonuses.critChanceBonus);
    bonuses.critDamageMul = Math.min(1.6, bonuses.critDamageMul);
    bonuses.areaMul = Math.min(1.5, bonuses.areaMul);
    bonuses.wallBounceBonus = Math.min(2, bonuses.wallBounceBonus);
    bonuses.poisonStackCapBonus = Math.min(2, bonuses.poisonStackCapBonus);
    bonuses.lowHpShieldRatio = Math.min(0.35, bonuses.lowHpShieldRatio);
    bonuses.bossFinisherMul = Math.min(1.45, bonuses.bossFinisherMul);
    bonuses.bossFinisherThreshold = Math.min(0.2, bonuses.bossFinisherThreshold);
    bonuses.burnDamageMul = Math.min(1.75, bonuses.burnDamageMul);
    bonuses.turretKillDurationBonus = Math.min(2, bonuses.turretKillDurationBonus);
    for (const key of ["warriorWhirlwindEcho", "mageStarSplit", "engineerAuxTurret", "vanguardWhirlwindGuard", "hunterRainBarrage", "arcanistPiercingFragments", "mechanistTurretMine"]) {
      bonuses[key] = bonuses[key] ? 1 : 0;
    }
    bonuses.rangerVolleyBonus = bonuses.rangerVolleyBonus ? 2 : 0;
    for (const key of Object.keys(bonuses)) bonuses[key] = Math.round(bonuses[key] * 10000) / 10000;
    return bonuses;
  }

  function getActiveChallenge(progress) {
    normalizeProgress(progress);
    return { mode: "standard", key: "", seed: 0, modifierId: "", ruleId: "" };
  }

  function getGrowthLoadout(progress, classId, ascensionLevel) {
    const next = normalizeProgress(progress);
    const loadout = base.getGrowthLoadout(next, classId, ascensionLevel);
    const equipment = next.equipment[loadout.classId] || emptyLoadout();
    const itemMap = new Map(next.inventory.items.map((item) => [item.id, item]));
    const gearAppearance = ITEM_SLOTS.map((slot) => itemMap.get(equipment[slot])).filter(Boolean).map((item) => ({
      slot: item.slot,
      rarity: item.rarity,
      setId: item.setId,
      special: item.special,
      icon: baseById(item.baseId).icon || SLOT_ICONS[item.slot],
    }));
    return {
      ...loadout,
      version: SAVE_VERSION,
      gearBonuses: calculateEquipmentBonuses(next, loadout.classId),
      gearAppearance,
      challenge: getActiveChallenge(next),
      cosmetic: { title: next.cosmetics.selectedTitle, skin: next.cosmetics.selectedSkin },
    };
  }

  function isItemEquipped(progress, itemId) {
    return Object.values(progress.equipment).some((loadout) => ITEM_SLOTS.some((slot) => loadout[slot] === itemId));
  }

  function isRuneEquipped(progress, runeId) {
    return Object.values(progress.equipment).some((loadout) => (loadout.runes || []).includes(runeId));
  }

  function performProgressionAction(progress, payload = {}) {
    const next = normalizeProgress(progress);
    const classId = CLASS_IDS.includes(payload.classId) ? payload.classId : "warrior";
    const action = String(payload.action || "");
    let changed = false;
    let affectsLoadout = false;
    let message = "";
    const item = next.inventory.items.find((entry) => entry.id === payload.itemId);
    if (action === "equip-item" && item && (item.classId === "all" || item.classId === classId)) {
      next.equipment[classId][item.slot] = item.id; changed = true; affectsLoadout = true; message = `${item.name} 장착`;
    } else if (action === "unequip-slot" && ITEM_SLOTS.includes(payload.slot)) {
      next.equipment[classId][payload.slot] = ""; changed = true; affectsLoadout = true;
    } else if (action === "salvage-item" && item && !isItemEquipped(next, item.id)) {
      const rank = rarityById(item.rarity).rank;
      next.currencies.enhancementStones += 3 + rank * 4 + item.enhance * 2;
      next.currencies.reforgingDust += rank * 2 + Math.floor(item.enhance / 3);
      next.inventory.items = next.inventory.items.filter((entry) => entry.id !== item.id);
      next.statistics.itemsSalvaged += 1; changed = true; message = `${item.name} 분해`;
    } else if (action === "salvage-items") {
      const requested = new Set((Array.isArray(payload.itemIds) ? payload.itemIds : []).map(String).slice(0, 240));
      const targets = next.inventory.items.filter((entry) => requested.has(entry.id) && !isItemEquipped(next, entry.id));
      if (targets.length) {
        const removed = new Set(targets.map((entry) => entry.id));
        for (const target of targets) {
          const rank = rarityById(target.rarity).rank;
          next.currencies.enhancementStones += 3 + rank * 4 + target.enhance * 2;
          next.currencies.reforgingDust += rank * 2 + Math.floor(target.enhance / 3);
        }
        next.inventory.items = next.inventory.items.filter((entry) => !removed.has(entry.id));
        next.statistics.itemsSalvaged += targets.length;
        changed = true;
        message = `장비 ${targets.length}개 일괄 분해`;
      }
    } else if (action === "enhance-item" && item && item.enhance < 20) {
      const cost = 5 + item.enhance * 4;
      if (next.currencies.enhancementStones >= cost) {
        const chance = getEnhanceSuccessChance(item.enhance);
        const random = createRandom(hashString(`${item.id}:enhance:${item.enhance}:${item.rerolls}:${Date.now()}`));
        next.currencies.enhancementStones -= cost;
        next.statistics.enhancements += 1;
        changed = true;
        if (random() <= chance) {
          item.enhance += 1;
          if (ENHANCE_MILESTONES.includes(item.enhance)) {
            const milestoneAffix = rollMilestoneAffix(item.id, item.enhance, random);
            if (milestoneAffix) item.milestoneAffixes.push(milestoneAffix);
          }
          affectsLoadout = isItemEquipped(next, item.id);
          message = `${item.name} 강화 성공 (+${item.enhance})`;
        } else {
          message = `${item.name} 강화 실패 (성공 확률 ${Math.round(chance * 100)}%)`;
        }
      }
    } else if (action === "reforge-item" && item && (item.slot === "amulet" || item.slot === "core") && item.affixes.length && !item.reforgePreview) {
      const cost = getReforgeCost(item);
      const locked = new Set(item.lockedAffixIndices);
      if (locked.size < item.affixes.length && next.currencies.reforgingDust >= cost) {
        next.currencies.reforgingDust -= cost;
        const random = createRandom(hashString(`${item.id}:reroll:${item.rerolls}:${Date.now()}`));
        const candidate = item.affixes.map((affix) => ({ ...affix }));
        const usedIds = item.affixes.filter((_, index) => locked.has(index)).map((affix) => affix.id);
        for (let index = 0; index < candidate.length; index += 1) {
          if (locked.has(index)) continue;
          candidate[index] = rollAffix(random, item.itemLevel, rarityById(item.rarity).rank, usedIds);
          usedIds.push(candidate[index].id);
        }
        item.reforgePreview = { affixes: candidate, cost };
        item.rerolls += 1;
        next.statistics.reforges += 1;
        changed = true;
        message = `${item.name} 재련 결과가 생성되었습니다.`;
      }
    } else if (action === "apply-reforge" && item?.reforgePreview) {
      item.affixes = item.reforgePreview.affixes.map((affix) => ({ ...affix }));
      item.reforgePreview = null;
      changed = true;
      affectsLoadout = isItemEquipped(next, item.id);
      message = `${item.name} 재련 옵션을 적용했습니다.`;
    } else if (action === "cancel-reforge" && item?.reforgePreview) {
      item.reforgePreview = null;
      changed = true;
      message = `${item.name} 기존 옵션을 유지했습니다.`;
    } else if (action === "lock-affix" && item && item.affixes.length && !item.reforgePreview) {
      const index = Math.max(0, Math.min(item.affixes.length - 1, integer(payload.affixIndex)));
      const locked = new Set(item.lockedAffixIndices);
      if (locked.has(index)) locked.delete(index);
      else if (locked.size < item.affixes.length - 1) locked.add(index);
      else message = "최소 1개 옵션은 재련 대상으로 남겨야 합니다.";
      const nextLocks = [...locked].sort((a, b) => a - b);
      if (nextLocks.join(",") !== item.lockedAffixIndices.join(",")) {
        item.lockedAffixIndices = nextLocks;
        changed = true;
        message = `${item.name} 옵션 잠금 ${nextLocks.length}개`;
      }
    } else if (action === "equip-rune") {
      const rune = next.inventory.runes.find((entry) => entry.id === payload.runeId);
      const slot = integer(payload.runeSlot, 0, 2);
      if (rune) {
        for (const loadout of Object.values(next.equipment)) loadout.runes = loadout.runes.map((id) => id === rune.id ? "" : id);
        next.equipment[classId].runes[slot] = rune.id; changed = true; affectsLoadout = true;
        message = `${runeDefById(rune.runeId).name} 룬을 슬롯 ${slot + 1}에 장착했습니다.`;
      }
    } else if (action === "unequip-rune") {
      const slot = integer(payload.runeSlot, 0, 2);
      const rune = next.inventory.runes.find((entry) => entry.id === next.equipment[classId].runes[slot]);
      if (rune) {
        next.equipment[classId].runes[slot] = ""; changed = true; affectsLoadout = true;
        message = `${runeDefById(rune.runeId).name} 룬을 해제했습니다.`;
      }
    } else if (action === "merge-rune") {
      const tier = Math.max(1, integer(payload.tier, 1, RUNE_GRADES.length));
      const candidates = next.inventory.runes.filter((rune) => rune.tier === tier && !isRuneEquipped(next, rune.id)).slice(0, 2);
      if (candidates.length === 2 && tier < RUNE_GRADES.length) {
        const removed = new Set(candidates.map((rune) => rune.id));
        next.inventory.runes = next.inventory.runes.filter((rune) => !removed.has(rune.id));
        const seed = `${tier}:${candidates.map((rune) => rune.id).sort().join(":")}:${Date.now()}`;
        const random = createRandom(hashString(seed));
        const resultDef = RUNES[Math.floor(random() * RUNES.length)] || RUNES[0];
        next.inventory.runes.push(normalizeRune({ id: `r-merge-${hashString(seed).toString(36)}`, runeId: resultDef.id, tier: tier + 1 }));
        next.statistics.crafts += 1;
        changed = true;
        message = `${RUNE_GRADES[tier]}등급 ${resultDef.name} 합성`;
      }
    } else if (action === "craft-boss") {
      const recipe = BOSS_RECIPES.find((entry) => entry.id === payload.recipeId) || BOSS_RECIPES[BOSS_RECIPES.length - 1];
      const materials = integer(next.inventory.bossMaterials[recipe.bossId]);
      if (materials >= recipe.amount && next.currencies.abyssShards >= recipe.shards && next.currencies.bossEssence >= recipe.essence && next.inventory.items.length < 240) {
        next.inventory.bossMaterials[recipe.bossId] = materials - recipe.amount;
        next.currencies.abyssShards -= recipe.shards;
        next.currencies.bossEssence -= recipe.essence;
        const crafted = generateItem(Date.now(), { classId, highestLevel: next.account.level, abyssDepth: next.records.highestAbyssDepth }, next.statistics.crafts, { baseId: recipe.id, rarity: "mythic", enhance: 5, craft: recipe.id });
        next.inventory.items.push(crafted); next.collections.equipmentBases = unique([...next.collections.equipmentBases, crafted.baseId]);
        next.statistics.crafts += 1; changed = true; message = `${recipe.label} 제작`;
      }
    } else if (action === "select-title") {
      const title = String(payload.title || "");
      if (!title || next.titles.includes(title)) { next.cosmetics.selectedTitle = title; changed = true; affectsLoadout = true; }
    } else if (action === "select-skin") {
      const skin = String(payload.skin || "");
      if (!skin || next.skins.includes(skin)) { next.cosmetics.selectedSkin = skin; changed = true; affectsLoadout = true; }
    }
    const achievements = changed ? evaluateAchievements(next) : [];
    return { progress: normalizeProgress(next), changed, affectsLoadout, message, achievements };
  }

  function recordWorldDiscoveries(progress, state) {
    const next = normalizeProgress(progress);
    const before = JSON.stringify(next.collections);
    next.collections.monsters = unique([...next.collections.monsters, ...(state?.enemies || []).map((enemy) => enemy.type)]);
    next.collections.bosses = unique([...next.collections.bosses, ...(state?.enemies || []).map((enemy) => enemy.bossId).filter(Boolean)]);
    const self = (state?.players || []).find((player) => player.id === state?.selfId) || (state?.players || []).find((player) => Array.isArray(player.relics) && player.relics.length);
    next.collections.relics = unique([...next.collections.relics, ...(self?.relics || []).map((relic) => relic.id)]);
    const changed = before !== JSON.stringify(next.collections);
    if (changed) evaluateAchievements(next);
    return { progress: normalizeProgress(next), changed };
  }

  function percent(value) {
    return `${Math.round(value * 1000) / 10}%`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function formatAffix(affix) {
    const def = AFFIXES.find((entry) => entry.id === affix.id) || AFFIXES[0];
    return `${def.label} +${def.percent ? percent(affix.value) : Math.round(affix.value * 10) / 10}`;
  }

  function getEnhanceSuccessChance(enhance) {
    if (enhance < 5) return 1;
    if (enhance < 10) return 0.85;
    if (enhance < 15) return 0.65;
    return 0.45;
  }

  function getReforgeCost(item) {
    const lockCount = item.lockedAffixIndices.length;
    return 8 + rarityById(item.rarity).rank * 6 + item.rerolls * 3 + lockCount * lockCount * 12;
  }

  function renderAffixStat(affix, className = "", item = null, enhance = null) {
    const def = AFFIXES.find((entry) => entry.id === affix.id) || AFFIXES[0];
    const shown = item ? getEffectiveAffix(item, affix, enhance == null ? item.enhance : enhance) : affix;
    const value = def.percent ? percent(shown.value) : Math.round(shown.value * 10) / 10;
    return `<span class="meta-affix-stat ${className}"><small>${escapeHtml(def.label)}</small><b>+${escapeHtml(value)}</b></span>`;
  }

  function renderMilestoneStats(item) {
    return getMilestoneAffixes(item).map((affix) => renderAffixStat(
      affix,
      "milestone-active"
    ).replace("<small>", `<small>+${affix.milestone} · `)).join("");
  }

  function getRaritySpecialText(item, special) {
    if (!special) return "";
    const scale = RARITY_SPECIAL_SCALE[rarityById(item.rarity).rank] || 0;
    if (!scale) return "";
    const pct = (value) => `+${percent(value * scale)}`;
    const number = (value, suffix = "") => `+${Math.round(value * scale * 100) / 100}${suffix}`;
    switch (item.special) {
      case "boss_hunter": return `보스 피해 ${pct(0.1)}`;
      case "ricochet": return "투사체가 벽에서 1회 튕김";
      case "skill_amp": return `스킬 피해 ${pct(0.035)} · 범위 ${pct(0.05)}`;
      case "construct_amp": return `설치물 피해 ${pct(0.11)} · 지속시간 ${pct(0.09)}`;
      case "status_amp": return `상태이상 피해 ${pct(0.11)}`;
      case "venom_cap": return "독 최대 중첩 +1";
      case "crit_amp": return `치명타 확률 ${pct(0.035)} · 치명타 피해 ${pct(0.08)}`;
      case "last_guard": return `저체력 진입 시 최대 체력의 ${percent(0.18 * scale)} 보호막`;
      case "swift_guard": return `이동 속도 ${pct(0.035)} · 방어 ${number(0.8)}`;
      case "warden_oath": return `최대 체력 ${pct(0.12)} · 방어 ${number(1.5)} · 체력 35% 이하에서 최대 체력 35% 보호막(전투당 1회)`;
      case "prophet_bloom": return `상태이상 피해 ${pct(0.22)} · 독 최대 중첩 +2 · 체력 재생 ${number(0.35, "/s")}`;
      case "regent_singularity": return `공격력 ${pct(0.1)} · 범위 ${pct(0.14)} · 스킬 가속 +${Math.round(8 * scale * 10) / 10}`;
      case "abyss_crown": return `공격력 ${pct(0.12)} · 보스 피해 ${pct(0.25)} · 보스 체력 20% 이하에서 피해 +45%`;
      case "burn_amp": return `화상 피해 ${pct(0.28)}`;
      case "turret_sustain": return `터렛 처치 시 지속시간 ${number(0.8, "초")}`;
      case "warrior_signature": return `피해 ${pct(0.06)} · 범위 ${pct(0.08)} · 강철 회오리 추가 칼날 발사`;
      case "ranger_signature": return `피해 ${pct(0.05)} · 치명타 확률 ${pct(0.04)} · 연발 사격 유도 화살 +2 및 1회 연쇄`;
      case "mage_signature": return `피해 ${pct(0.1)} · 범위 ${pct(0.06)} · 별빛 폭발 적중 시 작은 파편으로 분열`;
      case "engineer_signature": return `설치물 피해 ${pct(0.14)} · 지속시간 ${pct(0.1)} · 자동 터렛 설치 시 보조 미니 터렛 +1`;
      case "puppeteer_signature": return `피해 ${pct(0.05)} · 상태이상 피해 ${pct(0.12)}`;
      case "martialist_signature": return `피해 ${pct(0.05)} · 치명타 확률 ${pct(0.04)}`;
      case "alchemist_signature": return `상태이상 피해 ${pct(0.12)} · 화상 피해 ${pct(0.15)}`;
      case "assassin_signature": return `치명타 확률 ${pct(0.04)} · 치명타 피해 ${pct(0.12)}`;
      default: return special.text;
    }
  }

  function renderRaritySpecial(item, special) {
    if (!special) return "";
    const rank = rarityById(item.rarity).rank;
    const scale = RARITY_SPECIAL_SCALE[rank] || 0;
    if (!scale) return "";
    return `<span class="special"><small>희귀도 고유 · ${escapeHtml(special.label)}</small><b>${escapeHtml(getRaritySpecialText(item, special))}</b></span>`;
  }

  function getRarityPowerLabel(rarityId) {
    const rarity = rarityById(rarityId);
    const primary = Math.round((RARITY_PRIMARY_SCALE[rarity.rank] || 1) * 100);
    const special = Math.round((RARITY_SPECIAL_SCALE[rarity.rank] || 0) * 100);
    return `${rarity.label} · 주 능력 ${primary}%${special ? ` · 고유 ${special}%` : ""}`;
  }

  function codexKey(kind, id) {
    return `${String(kind || "")}:${String(id || "")}`;
  }

  function formatFlatRange(min, max) {
    return `${Math.round(min * 100) / 100}~${Math.round(max * 100) / 100}`;
  }

  function renderCodexStats(rows) {
    return `<div class="meta-codex-stats">${rows.map(([label, value]) => `<span><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></span>`).join("")}</div>`;
  }

  function renderCodexList(title, rows) {
    return `<section class="meta-codex-detail-section"><h5>${escapeHtml(title)}</h5><div class="meta-codex-detail-list">${rows.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div></section>`;
  }

  function getRuneTierEffects(runeId, tier) {
    const power = RUNE_GRADE_POWER[Math.max(0, Math.min(RUNE_GRADE_POWER.length - 1, tier - 1))];
    if (runeId === "fury") return `모든 피해 +${percent(0.018 * power)}`;
    if (runeId === "ward") return `최대 체력 +${percent(0.025 * power)} · 방어 +${Math.round(0.22 * power * 100) / 100}`;
    if (runeId === "haste") return `이동 속도 +${percent(0.008 * power)} · 스킬 가속 +${Math.round(0.9 * power * 10) / 10}`;
    if (runeId === "venom") return `상태이상 피해 +${percent(0.025 * power)}${tier >= 5 ? " · 독 최대 중첩 +1" : ""}`;
    if (runeId === "rebound") return tier >= 4 ? "투사체 벽 반사 +1회" : "A등급부터 벽 반사 효과 활성화";
    if (runeId === "eclipse") return `화상 +${percent(0.04 * power)} · 상태이상 +${percent(0.035 * power)} · 보스 +${percent(0.02 * power)}`;
    if (runeId === "precision") return `치명타 확률 +${percent(0.012 * power)}`;
    if (runeId === "ruin") return `치명타 피해 +${percent(0.025 * power)}`;
    if (runeId === "colossus") return `최대 체력 +${percent(0.04 * power)}`;
    if (runeId === "bastion") return `방어 +${Math.round(0.42 * power * 100) / 100}`;
    if (runeId === "hunter") return `보스 피해 +${percent(0.025 * power)}`;
    if (runeId === "slayer") return `엘리트 피해 +${percent(0.028 * power)}`;
    if (runeId === "wildfire") return `화상 피해 +${percent(0.05 * power)}`;
    if (runeId === "expansion") return `범위 +${percent(0.018 * power)}`;
    if (runeId === "automation") return `설치물 피해 +${percent(0.03 * power)}`;
    if (runeId === "longevity") return `설치물 지속시간 +${percent(0.025 * power)}`;
    if (runeId === "focus") return `스킬 가속 +${Math.round(1.2 * power * 10) / 10}`;
    if (runeId === "momentum") return `이동 속도 +${percent(0.012 * power)}`;
    if (runeId === "execution") return `피해 +${percent(0.012 * power)} · 치명타 확률 +${percent(0.008 * power)}`;
    if (runeId === "frost") return `상태이상 피해 +${percent(0.022 * power)} · 범위 +${percent(0.01 * power)}`;
    if (runeId === "storm") return `피해 +${percent(0.012 * power)} · 스킬 가속 +${Math.round(0.8 * power * 10) / 10}`;
    if (runeId === "alchemy") return `상태이상 +${percent(0.022 * power)} · 화상 +${percent(0.03 * power)}`;
    if (runeId === "shadow") return `치명타 피해 +${percent(0.02 * power)} · 이동 속도 +${percent(0.007 * power)}`;
    if (runeId === "vitality") return `최대 체력 +${percent(0.022 * power)} · 피해 +${percent(0.009 * power)}`;
    return "효과 정보 없음";
  }

  function renderEquipmentCodexDetail(entry) {
    const special = ITEM_SPECIAL_DETAILS[entry.special] || [SPECIALS[entry.special]?.label || "고유 효과", SPECIALS[entry.special]?.text || "고유 효과 정보 없음"];
    const setBonus = SET_BONUSES[entry.setId];
    const affixRows = AFFIXES.filter((affix) => RANDOM_AFFIX_IDS.includes(affix.id)).map((affix) => [
      affix.label,
      affix.percent ? `${percent(affix.min)}~${percent(affix.max)}` : formatFlatRange(affix.min, affix.max),
    ]);
    return `${renderCodexStats([
      ["슬롯", SLOT_LABELS[entry.slot] || entry.slot],
      ["사용 직업", CODEX_CLASS_LABELS[entry.classId] || entry.classId],
      ["세트", SET_LABELS[entry.setId] || entry.setId],
      ["획득", entry.bossCraft ? "보스 재료 제작" : "몬스터 필드 드랍"],
    ])}
      ${renderCodexList("희귀도 차이", [["주 능력·강화 성장", "일반 100% · 희귀 120% · 영웅 145% · 전설 175% · 신화 210%"], [special[0], `일반 비활성 · 희귀 100% · 영웅 140% · 전설 185% · 신화 240% / ${special[1]}`]])}
      ${renderCodexList("세트 효과", setBonus ? [["2세트", setBonus.two], ["4세트", setBonus.four]] : [["세트 없음", "추가 효과 없음"]])}
      ${renderCodexList("슬롯별 주 능력치", [["무기", "고정 공격력"], ["갑옷", "고정 방어력 또는 고정 최대 체력"], ["부적·코어", "무작위 옵션 1개"]])}
      ${renderCodexList("부적·코어 등장 옵션", affixRows)}
      <p class="meta-codex-formula">강화할 때마다 현재 주 능력치가 고정 수치로 직접 증가합니다. <b>+5 / +10 / +15 / +20</b> 도달 순간 무작위 보조 옵션을 1개 추첨하며, 도달 전에는 결과를 공개하지 않습니다. 세트 효과는 강화 및 희귀도와 별개로 계산됩니다.</p>`;
  }

  function renderRuneCodexDetail(entry) {
    const tiers = RUNE_GRADES.map((grade, index) => [grade, getRuneTierEffects(entry.id, index + 1)]);
    return `${renderCodexStats([["최대 등급", "X"], ["장착 슬롯", "직업별 3개"], ["합성", "같은 등급 2개 → 무작위 상위 룬"], ["초기 드랍", "D 또는 조건부 C"]])}
      ${renderCodexList("단계별 실제 효과", tiers)}
      <p class="meta-codex-formula">등급이 오를수록 배율이 비선형으로 증가합니다. X등급은 D등급의 약 8.4배 효과를 가지며, 같은 등급 룬 2개를 합치면 종류가 무작위로 바뀐 다음 등급 룬을 얻습니다.</p>`;
  }

  function renderMonsterCodexDetail(entry) {
    const detail = MONSTER_DETAILS[entry.id] || MONSTER_DETAILS.slime;
    const [hp, speed, damage, xp] = detail.stats;
    return `${renderCodexStats([["기본 체력", String(hp)], ["이동 속도", String(speed)], ["기본 공격력", String(damage)], ["경험치", String(xp)]])}
      ${renderCodexList("전투 정보", [["역할", detail.role], ["행동", detail.behavior], ["정예 특수 패턴", detail.elite]])}
      <p class="meta-codex-formula">표시는 보정 전 기본값입니다. 실제 체력·피해·속도는 웨이브, 챕터, 스테이지 깊이, 파티 인원, 승천/심연, 맵 특성에 따라 증가합니다. 일반 정예는 체력 ×1.72, 피해 ×1.18, 크기 ×1.12, 속도 ×1.05이며 광란 속성은 속도 ×1.14입니다.</p>`;
  }

  function renderBossCodexDetail(entry) {
    const detail = BOSS_DETAILS[entry.id] || BOSS_DETAILS.iron_warden;
    return `${renderCodexStats([["분류", detail.tier], ["기본체", "체력 690 · 피해 34"], ["기본 속도", "84"], ["기본 경험치", "120"]])}
      ${renderCodexList("생성 능력치", detail.multipliers.map((value, index) => [`보정 ${index + 1}`, value]))}
      ${renderCodexList("페이즈", [["전환 규칙", detail.phases]])}
      ${renderCodexList("주요 패턴", detail.patterns.map((value, index) => [`패턴 ${index + 1}`, value]))}
      <p class="meta-codex-formula">보스 배율은 보스 기본체에 적용되며, 이후 웨이브·파티·스테이지·승천/심연 보정이 추가됩니다. 패턴 피해는 최종 보스 공격력에 각 패턴 배율을 곱해 계산합니다.</p>`;
  }

  function renderRelicCodexDetail(entry) {
    const detail = RELIC_DETAILS[entry.id] || RELIC_DETAILS.power_core;
    return `${renderCodexStats([["연산 방식", detail.type], ["중첩당", detail.unit], ["최대 중첩", `${detail.cap}중첩`], ["적용 대상", entry.detail]])}
      ${renderCodexList("중첩별 실제 효과", detail.values.map((value, index) => [`${index + 1}중첩`, value]))}
      ${renderCodexList("적용 규칙", [["설명", detail.note]])}`;
  }

  function getCodexEntry(kind, id) {
    if (kind === "equipment") return ITEM_BASES.find((entry) => entry.id === id);
    if (kind === "rune") return RUNES.find((entry) => entry.id === id);
    if (kind === "monster") return MONSTER_CATALOG.find((entry) => entry.id === id);
    if (kind === "boss") return BOSS_CATALOG.find((entry) => entry.id === id);
    if (kind === "relic") return RELIC_CATALOG.find((entry) => entry.id === id);
    return null;
  }

  function renderCodexEntryDetail(kind, id, discovered = true) {
    const entry = getCodexEntry(kind, id);
    const meta = CODEX_KIND_META[kind] || CODEX_KIND_META.equipment;
    if (!entry) return `<div class="meta-codex-empty"><span class="material-symbols-rounded" aria-hidden="true">search</span><strong>상세 정보를 찾을 수 없습니다.</strong></div>`;
    const summary = kind === "equipment"
      ? `${SLOT_LABELS[entry.slot]} · ${SET_LABELS[entry.setId] || entry.setId} 세트 베이스 장비`
      : entry.detail || entry.text || "상세 정보";
    const body = kind === "equipment" ? renderEquipmentCodexDetail(entry)
      : kind === "rune" ? renderRuneCodexDetail(entry)
        : kind === "monster" ? renderMonsterCodexDetail(entry)
          : kind === "boss" ? renderBossCodexDetail(entry)
            : renderRelicCodexDetail(entry);
    const icon = kind === "equipment" ? (entry.icon || SLOT_ICONS[entry.slot] || meta.icon) : kind === "rune" ? entry.icon : meta.icon;
    const actorPreview = kind === "monster" || kind === "boss"
      ? `<canvas class="meta-codex-actor-preview" width="160" height="128" data-codex-actor-kind="${kind}" data-codex-actor-id="${escapeHtml(entry.id)}" aria-label="${escapeHtml(entry.name)} 실제 게임 렌더링"></canvas>`
      : "";
    if (typeof setTimeout === "function" && typeof document !== "undefined") setTimeout(renderCodexActorPreviews, 0);
    return `<div class="meta-codex-detail-content" data-codex-active-key="${escapeHtml(codexKey(kind, id))}">
      <header><span class="material-symbols-rounded" aria-hidden="true">${icon}</span><div><small>${escapeHtml(meta.label)} · ${discovered ? "발견 완료" : "미발견"}</small><h4>${escapeHtml(entry.name)}</h4><p>${escapeHtml(summary)}</p></div></header>
      ${actorPreview}
      ${body}
    </div>`;
  }

  const CODEX_MONSTER_RENDER = Object.freeze({
    training_dummy: { radius: 28, color: "#d6b76d" }, slime: { radius: 18, color: "#7fa671" },
    bat: { radius: 14, color: "#7e9fb2" }, brute: { radius: 25, color: "#c85d56" },
    guardian: { radius: 32, color: "#64748b" }, shaman: { radius: 20, color: "#6ba79e" },
    spitter: { radius: 17, color: "#9aa15f" }, bomber: { radius: 18, color: "#c85d56" },
    charger: { radius: 22, color: "#caa35a" }, splitter: { radius: 23, color: "#b98243" },
    splinter: { radius: 11, color: "#c9824c" }, runner: { radius: 16, color: "#b98243" },
    runner_tank: { radius: 25, color: "#64748b" }, runner_fast: { radius: 14, color: "#7fa671" },
    stalker: { radius: 18, color: "#8d7cae" }, mortar: { radius: 22, color: "#7e9fb2" },
    sniper: { radius: 17, color: "#d6d0c4" }, boss: { radius: 38, color: "#b98243" },
  });
  const CODEX_BOSS_RENDER = Object.freeze({
    blade_duelist: { radius: 34, color: "#d6b76d" }, plague_acolyte: { radius: 34, color: "#9aa15f" },
    void_hunter: { radius: 34, color: "#8d7cae" }, iron_warden: { radius: 38, color: "#c9824c" },
    hive_prophet: { radius: 39, color: "#6ba79e" }, void_regent: { radius: 40, color: "#8d7cae" },
    fate_executioner: { radius: 42, color: "#dc2626", executionBoss: true, phase: 4 },
  });
  let activeCodexActorRenderer = null;
  let codexActorRendererPromise = null;
  let activeCodexActorFrame = 0;
  let activeCodexActorToken = 0;

  function stopCodexActorPreview() {
    activeCodexActorToken += 1;
    if (activeCodexActorFrame) cancelAnimationFrame(activeCodexActorFrame);
    activeCodexActorFrame = 0;
  }

  function ensureCodexActorRenderer() {
    if (activeCodexActorRenderer) return Promise.resolve(activeCodexActorRenderer);
    if (codexActorRendererPromise) return codexActorRendererPromise;
    if (!window.RoguePixiRenderer || !window.PIXI || typeof document === "undefined") return Promise.resolve(null);

    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = 160;
    renderCanvas.height = 128;
    const renderer = window.RoguePixiRenderer.create({
      canvas: renderCanvas,
      preview: true,
      quality: "medium",
      getState: () => null,
      getSelfId: () => "",
      getVisuals: () => ({ enemies: new Map() }),
      getFloatingEffects: () => [],
      getScreenShake: () => 0,
      getMouse: () => ({ x: 0, y: 0 }),
      getCamera: () => ({ x: 0, y: 0 }),
    });
    codexActorRendererPromise = renderer.readyPromise.then(() => {
      if (renderer.failed) {
        renderer.destroy();
        return null;
      }
      activeCodexActorRenderer = renderer;
      return renderer;
    }).finally(() => {
      codexActorRendererPromise = null;
    });
    return codexActorRendererPromise;
  }

  function codexActorView(kind, id) {
    const profile = kind === "boss" ? CODEX_BOSS_RENDER[id] : CODEX_MONSTER_RENDER[id];
    if (!profile) return null;
    return {
      id: `codex-${kind}-${id}`,
      type: kind === "boss" ? "boss" : id,
      bossId: kind === "boss" ? id : "",
      radius: profile.radius,
      color: profile.color,
      hp: 100,
      maxHp: 100,
      barrier: 0,
      phase: profile.phase || (kind === "boss" ? 2 : 1),
      executionBoss: Boolean(profile.executionBoss),
      statusEffects: [],
      facing: 0,
    };
  }

  async function renderCodexActorPreviews() {
    let canvas = document.querySelector("canvas[data-codex-actor-id]");
    if (!canvas) {
      stopCodexActorPreview();
      return;
    }
    const kind = canvas.dataset.codexActorKind;
    const id = canvas.dataset.codexActorId;
    if (canvas.dataset.renderedActor === id || canvas.dataset.renderedActor === `pending:${id}`) return;
    const actor = codexActorView(kind, id);
    if (!actor || !window.RoguePixiRenderer || !window.PIXI) return;

    stopCodexActorPreview();
    const token = activeCodexActorToken;
    canvas.dataset.renderedActor = `pending:${id}`;
    const renderer = await ensureCodexActorRenderer();
    if (!renderer || token !== activeCodexActorToken || !canvas.isConnected) return;

    if (renderer.view !== canvas) {
      const rendererCanvas = renderer.view;
      rendererCanvas.className = "meta-codex-actor-preview pixi-codex-actor-preview";
      canvas.replaceWith(rendererCanvas);
      canvas = rendererCanvas;
    }
    canvas.dataset.codexActorKind = kind;
    canvas.dataset.codexActorId = id;
    canvas.setAttribute("aria-label", `${getCodexEntry(kind, id)?.name || id} 실제 게임 렌더링`);
    canvas.dataset.renderedActor = id;

    const animate = (now) => {
      if (token !== activeCodexActorToken || !canvas.isConnected) return;
      const width = Math.max(160, Math.round(canvas.clientWidth || 160));
      const height = Math.max(128, Math.round(canvas.clientHeight || 128));
      renderer.resize(width, height);
      renderer.renderCodexActor(actor, now, width, height);
      activeCodexActorFrame = requestAnimationFrame(animate);
    };
    activeCodexActorFrame = requestAnimationFrame(animate);
  }

  function renderItem(item, options = {}) {
    const rarity = rarityById(item.rarity);
    const special = SPECIALS[item.special];
    const compatible = item.classId === "all" || item.classId === options.classId;
    return `<article class="meta-item ${options.selected ? "selected" : ""}" style="--item-color:${rarity.color}" data-rarity="${rarity.id}" data-inventory-item-id="${escapeHtml(item.id)}">
      <div class="meta-item-summary"><label class="meta-item-select" title="일괄 분해 선택"><input type="checkbox" data-inventory-select data-item-id="${escapeHtml(item.id)}" ${options.selected ? "checked" : ""}><span class="material-symbols-rounded" aria-hidden="true">check</span></label><i class="material-symbols-rounded meta-item-icon meta-equipment-icon" aria-hidden="true">${baseById(item.baseId).icon || SLOT_ICONS[item.slot]}</i><div class="meta-item-main"><span class="meta-rarity">${escapeHtml(getRarityPowerLabel(item.rarity))}</span><strong>${escapeHtml(item.name)}${item.enhance ? ` +${item.enhance}` : ""}</strong><small>iLv.${item.itemLevel} · ${SLOT_LABELS[item.slot]} · ${escapeHtml(CODEX_CLASS_LABELS[item.classId] || "공용")}</small><em>${escapeHtml(SET_LABELS[item.setId] || item.setId)} 세트</em></div></div>
      <div class="meta-affixes">${item.affixes.map((affix, index) => renderAffixStat(affix, item.lockedAffixIndices.includes(index) ? "locked" : "", item)).join("")}${renderMilestoneStats(item)}${renderRaritySpecial(item, special)}</div>
      <div class="meta-item-actions">${compatible && !options.equipped ? `<button type="button" data-progression-action="equip-item" data-item-id="${escapeHtml(item.id)}">장착</button>` : ""}${!options.equipped ? `<button type="button" class="danger" data-progression-action="salvage-item" data-item-id="${escapeHtml(item.id)}">분해</button>` : ""}</div>
    </article>`;
  }

  function renderGearTab(progress, classId, ui = {}) {
    const loadout = progress.equipment[classId] || emptyLoadout();
    const itemMap = new Map(progress.inventory.items.map((item) => [item.id, item]));
    const runeMap = new Map(progress.inventory.runes.map((rune) => [rune.id, rune]));
    const bonuses = calculateEquipmentBonuses(progress, classId);
    const bonusRows = [
      ["공격력", `+${Math.round(bonuses.attackBonus * 10) / 10}`], ["고정 체력", `+${Math.round(bonuses.maxHpBonus)}`], ["방어력", `+${Math.round(bonuses.armorBonus * 10) / 10}`],
      ["피해", percent(bonuses.damageMul - 1)], ["체력", percent(bonuses.maxHpMul - 1)], ["체젠", `+${Math.round(bonuses.regenBonus * 100) / 100}/s`], ["공격 속도", `+${Math.round(bonuses.attackSpeed * 10) / 10}`], ["스킬 가속", `+${Math.round(bonuses.skillHaste * 10) / 10}`],
      ["이동 속도", percent(bonuses.speedMul - 1)], ["치명타 확률", percent(bonuses.critChanceBonus)], ["치명 피해", percent(bonuses.critDamageMul - 1)], ["범위", percent(bonuses.areaMul - 1)],
    ];
    const specialRows = [
      ["상태이상 피해", percent(bonuses.statusDamageMul - 1), bonuses.statusDamageMul > 1],
      ["정예 피해", percent(bonuses.eliteDamageMul - 1), bonuses.eliteDamageMul > 1],
      ["보스 피해", percent(bonuses.bossDamageMul - 1), bonuses.bossDamageMul > 1],
      ["화상 피해", percent(bonuses.burnDamageMul - 1), bonuses.burnDamageMul > 1],
      ["설치물 피해", percent(bonuses.constructDamageMul - 1), bonuses.constructDamageMul > 1],
      ["설치물 지속", percent(bonuses.constructDurationMul - 1), bonuses.constructDurationMul > 1],
      ["벽 반사", `${bonuses.wallBounceBonus}회`, bonuses.wallBounceBonus > 0],
      ["독 중첩 한도", `+${bonuses.poisonStackCapBonus}`, bonuses.poisonStackCapBonus > 0],
      ["터렛 지속 연장", `+${bonuses.turretKillDurationBonus}초`, bonuses.turretKillDurationBonus > 0],
      ["저체력 보호막", `최대 체력의 ${percent(bonuses.lowHpShieldRatio)}`, bonuses.lowHpShieldRatio > 0],
      ["보스 마무리", `체력 ${Math.round(bonuses.bossFinisherThreshold * 100)}% 이하 · 피해 +${percent(bonuses.bossFinisherMul - 1)}`, bonuses.bossFinisherMul > 1],
    ].filter((row) => row[2]);
    const activeSets = {};
    for (const slot of ITEM_SLOTS) {
      const item = itemMap.get(loadout[slot]);
      if (item) activeSets[item.setId] = (activeSets[item.setId] || 0) + 1;
    }
    const equippedSlots = ITEM_SLOTS.map((slot) => {
      const item = itemMap.get(loadout[slot]);
      if (!item) return `<div class="meta-slot empty"><span>${SLOT_LABELS[slot]}</span><em>비어 있음</em></div>`;
      const rarity = rarityById(item.rarity);
      const special = SPECIALS[item.special];
      const setBonus = SET_BONUSES[item.setId];
      const setCount = activeSets[item.setId] || 0;
      return `<details class="meta-equipped-card" style="--item-color:${rarity.color}" data-rarity="${rarity.id}" data-equipped-item-id="${escapeHtml(item.id)}">
        <summary><i class="material-symbols-rounded meta-item-icon meta-equipment-icon" aria-hidden="true">${baseById(item.baseId).icon || SLOT_ICONS[item.slot]}</i><span><small>${SLOT_LABELS[slot]} · ${escapeHtml(rarity.label)}</small><strong>${escapeHtml(item.name)}${item.enhance ? ` +${item.enhance}` : ""}</strong><em>iLv.${item.itemLevel} · ${escapeHtml(SET_LABELS[item.setId] || item.setId)} ${setCount}/4</em></span><i class="material-symbols-rounded meta-equipped-expand" aria-hidden="true">expand_more</i></summary>
        <div class="meta-equipped-detail"><div class="meta-affixes">${item.affixes.map((affix, index) => renderAffixStat(affix, item.lockedAffixIndices.includes(index) ? "locked" : "", item)).join("")}${renderMilestoneStats(item)}${renderRaritySpecial(item, special)}</div>${setBonus ? `<div class="meta-equipped-set"><strong>${escapeHtml(SET_LABELS[item.setId] || item.setId)} 세트</strong><span class="${setCount >= 2 ? "active" : ""}">2세트 · ${escapeHtml(setBonus.two)}</span><span class="${setCount >= 4 ? "active" : ""}">4세트 · ${escapeHtml(setBonus.four)}</span></div>` : ""}<button type="button" data-progression-action="unequip-slot" data-slot="${slot}">장비 해제</button></div>
      </details>`;
    });
    const equipped = `<div class="meta-loadout-column">${equippedSlots.join("")}</div>`;
    const runeSlots = [0, 1, 2].map((index) => {
      const rune = runeMap.get(loadout.runes[index]);
      const def = rune ? runeDefById(rune.runeId) : null;
      return `<div class="meta-rune-slot ${rune ? "equipped" : "empty"}" ${rune ? `data-equipped-rune-id="${escapeHtml(rune.id)}"` : ""}><span>룬 슬롯 ${index + 1}</span>${rune ? `<strong><span class="material-symbols-rounded meta-inline-icon">${def.icon}</span>${escapeHtml(def.name)} <b>${RUNE_GRADES[rune.tier - 1]}</b></strong><small>${escapeHtml(getRuneTierEffects(rune.runeId, rune.tier))}</small><button type="button" data-progression-action="unequip-rune" data-rune-slot="${index}" aria-label="${escapeHtml(def.name)} 룬 해제">해제</button>` : `<em>비어 있음</em>`}</div>`;
    }).join("");
    const itemQuery = String(ui.itemQuery || "");
    const itemSlot = ITEM_SLOTS.includes(ui.itemSlot) ? ui.itemSlot : "all";
    const itemRarity = RARITIES.some((entry) => entry.id === ui.itemRarity) ? ui.itemRarity : "all";
    const itemClass = ["all", "compatible", "shared", "class"].includes(ui.itemClass) ? ui.itemClass : "compatible";
    const itemSort = ["power", "rarity", "level", "name"].includes(ui.itemSort) ? ui.itemSort : "power";
    const selectedItems = new Set(Array.isArray(ui.selectedItemIds) ? ui.selectedItemIds : []);
    const inventory = progress.inventory.items
      .filter((item) => !isItemEquipped(progress, item.id))
      .filter((item) => itemSlot === "all" || item.slot === itemSlot)
      .filter((item) => itemRarity === "all" || item.rarity === itemRarity)
      .filter((item) => itemClass === "all" || (itemClass === "compatible" && (item.classId === "all" || item.classId === classId)) || (itemClass === "shared" && item.classId === "all") || (itemClass === "class" && item.classId === classId))
      .filter((item) => {
        const special = SPECIALS[item.special];
        return matchesSearch(itemQuery, item.name, SLOT_LABELS[item.slot], SET_LABELS[item.setId], item.setId, rarityById(item.rarity).label, special?.label, special?.text, CODEX_CLASS_LABELS[item.classId]);
      })
      .slice()
      .sort((a, b) => {
        const aCompatible = a.classId === "all" || a.classId === classId ? 1 : 0;
        const bCompatible = b.classId === "all" || b.classId === classId ? 1 : 0;
        if (itemSort === "name") return a.name.localeCompare(b.name, "ko");
        if (itemSort === "level") return b.itemLevel - a.itemLevel || rarityById(b.rarity).rank - rarityById(a.rarity).rank;
        if (itemSort === "rarity") return rarityById(b.rarity).rank - rarityById(a.rarity).rank || b.itemLevel - a.itemLevel;
        return bCompatible - aCompatible || rarityById(b.rarity).rank - rarityById(a.rarity).rank || b.itemLevel - a.itemLevel;
      });
    const runeQuery = String(ui.runeQuery || "");
    const runeTier = Number(ui.runeTier) >= 1 && Number(ui.runeTier) <= RUNE_GRADES.length ? Number(ui.runeTier) : 0;
    const runeSort = ["tier", "name", "type"].includes(ui.runeSort) ? ui.runeSort : "tier";
    const runes = progress.inventory.runes
      .filter((rune) => !runeTier || rune.tier === runeTier)
      .filter((rune) => { const def = runeDefById(rune.runeId); return matchesSearch(runeQuery, def.name, def.text, getRuneTierEffects(rune.runeId, rune.tier), RUNE_GRADES[rune.tier - 1], rune.runeId); })
      .slice()
      .sort((a, b) => runeSort === "name" ? runeDefById(a.runeId).name.localeCompare(runeDefById(b.runeId).name, "ko") : runeSort === "type" ? a.runeId.localeCompare(b.runeId) || b.tier - a.tier : b.tier - a.tier || runeDefById(a.runeId).name.localeCompare(runeDefById(b.runeId).name, "ko"));
    return `<div class="meta-gear-overview">
      <section class="meta-gear-loadout-pane"><header class="meta-pane-head"><div><small>LOADOUT</small><strong>현재 장착</strong></div><span>${equippedSlots.filter((slot) => !slot.includes("empty")).length}/4</span></header><div class="meta-loadout-grid">${equipped}</div><div class="meta-rune-slots">${runeSlots}</div></section>
      <aside class="meta-gear-summary-pane"><header class="meta-pane-head"><div><small>EQUIPMENT TOTAL</small><strong>장비 합산 효과</strong></div><span>${bonusRows.length}개 능력치</span></header><div class="meta-bonus-strip">${bonusRows.map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join("")}</div>
        <section class="meta-special-bonuses"><header><strong>특수 효과</strong><small>현재 활성화된 효과만 표시</small></header><div>${specialRows.length ? specialRows.map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join("") : `<em>활성화된 특수 효과 없음</em>`}</div></section>
        <div class="meta-set-list">${Object.entries(activeSets).map(([setId, count]) => { const set = SET_BONUSES[setId]; return `<span class="${count >= 2 ? "active" : ""}"><b>${escapeHtml(SET_LABELS[setId] || setId)} ${count}/4</b><small>2세트 ${escapeHtml(set?.two || "-")} · 4세트 ${escapeHtml(set?.four || "-")}</small></span>`; }).join("") || `<span><small>같은 세트 장비를 2개 이상 장착하면 세트 효과가 활성화됩니다.</small></span>`}</div>
      </aside></div>
      <section class="meta-inventory-section" data-inventory-section="items"><div class="meta-section-head meta-inventory-head"><div><strong>보유 장비</strong><small>장착 중인 장비를 제외한 보관 장비</small></div><span><b>${progress.inventory.items.length}</b>/240 · 표시 ${inventory.length}</span></div>
      <div class="meta-inventory-toolbar equipment-toolbar" aria-label="장비 분류">
        <div class="meta-inventory-filter-row">
          <label class="meta-filter-search"><span class="material-symbols-rounded" aria-hidden="true">search</span><input type="search" value="${escapeHtml(ui.itemQuery || "")}" placeholder="이름·세트·고유 효과 검색" aria-label="장비 이름 또는 세트명 검색" data-progression-filter="itemQuery"></label>
          <select data-progression-filter="itemSlot" aria-label="장비 부위"><option value="all">모든 부위</option>${ITEM_SLOTS.map((slot) => `<option value="${slot}" ${itemSlot === slot ? "selected" : ""}>${SLOT_LABELS[slot]}</option>`).join("")}</select>
          <select data-progression-filter="itemRarity" aria-label="장비 희귀도"><option value="all">모든 희귀도</option>${RARITIES.map((rarity) => `<option value="${rarity.id}" ${itemRarity === rarity.id ? "selected" : ""}>${rarity.label}</option>`).join("")}</select>
          <select data-progression-filter="itemClass" aria-label="장비 직업"><option value="compatible" ${itemClass === "compatible" ? "selected" : ""}>사용 가능</option><option value="class" ${itemClass === "class" ? "selected" : ""}>직업 전용</option><option value="shared" ${itemClass === "shared" ? "selected" : ""}>공용</option><option value="all" ${itemClass === "all" ? "selected" : ""}>모든 직업</option></select>
          <select data-progression-filter="itemSort" aria-label="장비 정렬"><option value="power" ${itemSort === "power" ? "selected" : ""}>추천순</option><option value="rarity" ${itemSort === "rarity" ? "selected" : ""}>희귀도순</option><option value="level" ${itemSort === "level" ? "selected" : ""}>레벨순</option><option value="name" ${itemSort === "name" ? "selected" : ""}>이름순</option></select>
        </div>
        <div class="meta-inventory-action-row"><span>선택 <b data-selected-item-count>${selectedItems.size}</b>개</span><button type="button" class="meta-select-visible" data-select-visible-items><span class="material-symbols-rounded" aria-hidden="true">select_all</span>현재 목록 선택</button><button type="button" class="danger" data-bulk-salvage ${selectedItems.size ? "" : "disabled"}><span class="material-symbols-rounded" aria-hidden="true">delete_sweep</span>선택 분해</button></div>
      </div><div class="meta-item-list">${inventory.length ? inventory.map((item) => renderItem(item, { classId, selected: selectedItems.has(item.id) })).join("") : `<p class="meta-empty">조건에 맞는 장비가 없습니다.</p>`}</div></section>
      <section class="meta-inventory-section" data-inventory-section="runes"><div class="meta-section-head meta-inventory-head"><div><strong>보유 룬</strong><small>장착 여부와 현재 등급 효과를 한눈에 확인</small></div><span><b>${progress.inventory.runes.length}</b>개 · 표시 ${runes.length}</span></div>
      <div class="meta-inventory-toolbar rune-toolbar" aria-label="룬 분류">
        <div class="meta-inventory-filter-row"><label class="meta-filter-search"><span class="material-symbols-rounded" aria-hidden="true">search</span><input type="search" value="${escapeHtml(ui.runeQuery || "")}" placeholder="이름·현재 효과 검색" aria-label="룬 이름 또는 효과 검색" data-progression-filter="runeQuery"></label>
          <select data-progression-filter="runeTier" aria-label="룬 등급"><option value="all">모든 등급</option>${RUNE_GRADES.map((grade, index) => `<option value="${index + 1}" ${runeTier === index + 1 ? "selected" : ""}>${grade}등급</option>`).join("")}</select>
          <select data-progression-filter="runeSort" aria-label="룬 정렬"><option value="tier" ${runeSort === "tier" ? "selected" : ""}>등급순</option><option value="name" ${runeSort === "name" ? "selected" : ""}>이름순</option><option value="type" ${runeSort === "type" ? "selected" : ""}>종류별</option></select></div>
      </div>
      <div class="meta-rune-list">${runes.length ? runes.map((rune) => {
        const def = runeDefById(rune.runeId);
        const equippedSlot = loadout.runes.indexOf(rune.id);
        const emptySlot = loadout.runes.findIndex((id) => !id);
        const action = equippedSlot >= 0
          ? `<button type="button" class="unequip" data-progression-action="unequip-rune" data-rune-slot="${equippedSlot}">해제</button>`
          : emptySlot >= 0
            ? `<button type="button" data-progression-action="equip-rune" data-rune-id="${escapeHtml(rune.id)}" data-rune-slot="${emptySlot}">장착</button>`
            : `<button type="button" disabled title="장착 중인 룬을 먼저 해제하세요">슬롯 없음</button>`;
        return `<article class="${equippedSlot >= 0 ? "equipped" : ""}" data-rune-tier="${rune.tier}" data-rune-item-id="${escapeHtml(rune.id)}"><div class="meta-rune-summary"><i class="material-symbols-rounded meta-item-icon meta-rune-icon" aria-hidden="true">${def.icon}</i><span class="meta-rune-title"><small>${RUNE_GRADES[rune.tier - 1]}등급 룬</small><strong>${escapeHtml(def.name)}</strong></span>${equippedSlot >= 0 ? `<span class="meta-rune-equipped"><span class="material-symbols-rounded" aria-hidden="true">check_circle</span>슬롯 ${equippedSlot + 1}</span>` : ""}</div><div class="meta-rune-effect"><small>현재 효과</small><strong>${escapeHtml(getRuneTierEffects(rune.runeId, rune.tier))}</strong><span>${escapeHtml(def.text)}</span></div><div class="meta-rune-actions">${action}</div></article>`;
      }).join("") : `<p class="meta-empty">조건에 맞는 룬이 없습니다.</p>`}</div></section>`;
  }

  function renderForgeTab(progress, classId) {
    const loadout = progress.equipment[classId] || emptyLoadout();
    const itemMap = new Map(progress.inventory.items.map((item) => [item.id, item]));
    const equipped = ITEM_SLOTS.map((slot) => itemMap.get(loadout[slot])).filter(Boolean);
    const groups = {};
    for (const rune of progress.inventory.runes.filter((entry) => !isRuneEquipped(progress, entry.id) && entry.tier < RUNE_GRADES.length)) {
      groups[rune.tier] = (groups[rune.tier] || 0) + 1;
    }
    return `<div class="meta-forge-resources"><span><small>심연 파편</small><b>${progress.currencies.abyssShards.toLocaleString()}</b></span><span><small>강화석</small><b>${progress.currencies.enhancementStones.toLocaleString()}</b></span><span><small>재련 가루</small><b>${progress.currencies.reforgingDust.toLocaleString()}</b></span><span><small>보스 정수</small><b>${progress.currencies.bossEssence.toLocaleString()}</b></span></div>
      <section class="meta-forge-section"><div class="meta-section-head"><strong>장착 장비 강화</strong><span>장비마다 강화 후 오르는 수치와 성공 확률을 바로 확인할 수 있습니다.</span></div>
      <div class="meta-forge-list">${equipped.length ? equipped.map((item) => {
        const enhanceCost = 5 + item.enhance * 4;
        const chance = getEnhanceSuccessChance(item.enhance);
        const rerollCost = getReforgeCost(item);
        const preview = item.reforgePreview;
        const canReforge = item.slot === "amulet" || item.slot === "core";
        const affixRows = item.affixes.map((affix) => `<div class="meta-forge-affix">${renderAffixStat(affix, "", item)}</div>`).join("") + renderMilestoneStats(item);
        const currentPrimary = getEffectiveAffix(item, item.affixes[0], item.enhance);
        const nextPrimary = getEffectiveAffix(item, item.affixes[0], Math.min(20, item.enhance + 1));
        const primaryDef = AFFIXES.find((entry) => entry.id === currentPrimary.id) || AFFIXES[0];
        const formatPrimary = (affix) => primaryDef.percent ? percent(affix.value) : Math.round(affix.value * 10) / 10;
        const comparison = preview ? `<section class="meta-reforge-compare"><header><strong>재련 결과 비교</strong><span>비교 후 원하는 쪽을 선택하세요.</span></header><div class="meta-reforge-columns"><div><b>현재 옵션</b>${item.affixes.map((affix) => renderAffixStat(affix, "", item)).join("")}</div><span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span><div><b>변경 후</b>${preview.affixes.map((affix) => renderAffixStat(affix, "changed", item)).join("")}</div></div><footer><button type="button" class="secondary" data-progression-action="cancel-reforge" data-item-id="${escapeHtml(item.id)}">기존 옵션 유지</button><button type="button" data-progression-action="apply-reforge" data-item-id="${escapeHtml(item.id)}">새 옵션 적용</button></footer></section>` : "";
        return `<article class="meta-forge-card" data-rarity="${item.rarity}" data-forge-item-id="${escapeHtml(item.id)}"><header><i class="material-symbols-rounded meta-item-icon" aria-hidden="true">${baseById(item.baseId).icon || SLOT_ICONS[item.slot]}</i><div><small>${SLOT_LABELS[item.slot]} · ${escapeHtml(rarityById(item.rarity).label)} · iLv.${item.itemLevel}</small><strong>${escapeHtml(item.name)}</strong></div><span>+${item.enhance}</span></header><div class="meta-forge-primary"><small>${primaryDef.label}</small><b>${formatPrimary(currentPrimary)}</b><i class="material-symbols-rounded" aria-hidden="true">arrow_forward</i><strong>${item.enhance >= 20 ? "MAX" : formatPrimary(nextPrimary)}</strong></div><div class="meta-forge-affixes">${affixRows}</div><div class="meta-forge-actions"><button type="button" data-progression-action="enhance-item" data-item-id="${escapeHtml(item.id)}" ${progress.currencies.enhancementStones < enhanceCost || item.enhance >= 20 || preview ? "disabled" : ""}><b>${item.enhance >= 20 ? "최대 강화" : "강화"}</b><small>${item.enhance >= 20 ? "강화 완료" : `성공 ${Math.round(chance * 100)}% · 강화석 ${enhanceCost}`}</small></button>${canReforge ? `<button type="button" data-progression-action="reforge-item" data-item-id="${escapeHtml(item.id)}" ${progress.currencies.reforgingDust < rerollCost || preview ? "disabled" : ""}><b>주 옵션 재련</b><small>가루 ${rerollCost} · 결과 확인 후 적용</small></button>` : `<span class="meta-forge-fixed"><b>고정 주 능력치</b><small>강화할 때마다 수치가 증가합니다.</small></span>`}</div>${comparison}</article>`;
      }).join("") : `<p class="meta-empty">장착한 장비가 없습니다.</p>`}</div></section>
      <div class="meta-forge-lower"><section><div class="meta-section-head"><strong>룬 합성</strong><span>같은 등급 2개를 다음 등급 무작위 룬으로 합성</span></div><div class="meta-merge-list">${Object.entries(groups).map(([tier, count]) => `<button type="button" data-progression-action="merge-rune" data-tier="${tier}" ${count < 2 ? "disabled" : ""}>${RUNE_GRADES[Math.max(0, Number(tier) - 1)]} → ${RUNE_GRADES[Number(tier)]} <b>${count}/2</b></button>`).join("") || `<p class="meta-empty">합성 가능한 룬이 없습니다.</p>`}</div></section>
      <section><div class="meta-section-head"><strong>보스 전용 제작</strong><span>보스 재료로 제작하는 신화 +5 장비</span></div><div class="meta-boss-recipes">${BOSS_RECIPES.map((recipe) => { const held = integer(progress.inventory.bossMaterials[recipe.bossId]); const special = SPECIALS[baseById(recipe.id).special]; return `<article><div><strong>${escapeHtml(recipe.label)} <em>신화 +5</em></strong><small>${escapeHtml(special?.label || "보스 고유 효과")} · ${escapeHtml(special?.text || "")}</small><span>${escapeHtml(recipe.materialName)} ${held}/${recipe.amount} · 파편 ${progress.currencies.abyssShards}/${recipe.shards} · 보스 정수 ${progress.currencies.bossEssence}/${recipe.essence}</span></div><button type="button" data-progression-action="craft-boss" data-recipe-id="${recipe.id}" ${held < recipe.amount || progress.currencies.abyssShards < recipe.shards || progress.currencies.bossEssence < recipe.essence ? "disabled" : ""}>제작</button></article>`; }).join("")}</div></section></div>`;
  }

  function renderCollectionCatalog(kind, label, collectedIds, catalog, describe, selectedKey) {
    const collected = new Set(collectedIds);
    const found = catalog.filter((entry) => collected.has(entry.id)).length;
    const containsSelection = catalog.some((entry) => codexKey(kind, entry.id) === selectedKey);
    return `<details class="meta-collection-detail" ${containsSelection ? "open" : ""}>
      <summary><span>${escapeHtml(label)}</span><strong>${found}/${catalog.length}</strong><i><b style="width:${catalog.length ? Math.min(100, found / catalog.length * 100) : 0}%"></b></i></summary>
      <div class="meta-codex-list">${catalog.map((entry) => {
        const discovered = collected.has(entry.id);
        const key = codexKey(kind, entry.id);
        const catalogIcon = discovered && kind === "equipment" ? (entry.icon || SLOT_ICONS[entry.slot]) : discovered && kind === "rune" ? entry.icon : discovered ? "check_circle" : "help";
        return `<button type="button" class="meta-codex-entry ${discovered ? "discovered" : "locked"} ${key === selectedKey ? "selected" : ""}" data-codex-entry data-codex-kind="${kind}" data-codex-id="${escapeHtml(entry.id)}" data-codex-discovered="${discovered}" aria-pressed="${key === selectedKey}"><span class="material-symbols-rounded" aria-hidden="true">${catalogIcon}</span><div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(describe(entry))}</small></div><i class="material-symbols-rounded" aria-hidden="true">chevron_right</i></button>`;
      }).join("")}</div>
    </details>`;
  }

  function getCatalogDiscoveryCount(collectedIds, catalog) {
    const collected = new Set(collectedIds);
    return catalog.filter((entry) => collected.has(entry.id)).length;
  }

  function renderArchiveTab(progress) {
    if (typeof setTimeout === "function" && typeof document !== "undefined") setTimeout(ensureCodexActorRenderer, 0);
    const catalogGroups = [
      { kind: "equipment", label: "장비 도감", collected: progress.collections.equipmentBases, catalog: ITEM_BASES, describe: (entry) => `${SLOT_LABELS[entry.slot]} · ${SET_LABELS[entry.setId] || entry.setId}` },
      { kind: "rune", label: "룬 도감", collected: progress.collections.runeTypes, catalog: RUNES, describe: (entry) => entry.text },
      { kind: "monster", label: "몬스터 도감", collected: progress.collections.monsters, catalog: MONSTER_CATALOG, describe: (entry) => entry.detail },
      { kind: "boss", label: "보스 도감", collected: progress.collections.bosses, catalog: BOSS_CATALOG, describe: (entry) => entry.detail },
      { kind: "relic", label: "유물 도감", collected: progress.collections.relics, catalog: RELIC_CATALOG, describe: (entry) => entry.detail },
    ];
    const collectionRows = catalogGroups.map((group) => [CODEX_KIND_META[group.kind].label, getCatalogDiscoveryCount(group.collected, group.catalog), group.catalog.length]);
    const selectedGroup = catalogGroups.find((group) => group.catalog.some((entry) => group.collected.includes(entry.id))) || catalogGroups[0];
    const selectedEntry = selectedGroup.catalog.find((entry) => selectedGroup.collected.includes(entry.id)) || selectedGroup.catalog[0];
    const selectedKey = codexKey(selectedGroup.kind, selectedEntry.id);
    const selectedDiscovered = selectedGroup.collected.includes(selectedEntry.id);
    const collectionDetails = catalogGroups.map((group) => renderCollectionCatalog(group.kind, group.label, group.collected, group.catalog, group.describe, selectedKey)).join("");
    return `<div class="meta-collection-grid">${collectionRows.map(([label, current, total]) => `<article><span>${label}</span><strong>${current}/${total}</strong><i><b style="width:${Math.min(100, current / total * 100)}%"></b></i></article>`).join("")}</div>
      <div class="meta-section-head"><strong>수집 상세</strong><span>항목을 클릭하면 실제 수치와 동작을 확인할 수 있습니다.</span></div>
      <div class="meta-codex-workspace"><div class="meta-collection-details">${collectionDetails}</div><aside class="meta-codex-inspector" aria-live="polite" aria-label="도감 항목 상세">${renderCodexEntryDetail(selectedGroup.kind, selectedEntry.id, selectedDiscovered)}</aside></div>
      <div class="meta-section-head"><strong>업적 ${Object.keys(progress.achievements).length}/${ACHIEVEMENTS.length}</strong><span>각 업적에서 보상 지급 상태 확인</span></div>
      <div class="meta-achievement-list">${ACHIEVEMENTS.map((achievement) => {
        const done = Boolean(progress.achievements[achievement.id]);
        const current = Math.min(achievement.target, integer(achievement.current(progress)));
        const ratio = done ? 1 : Math.min(1, current / Math.max(1, achievement.target));
        const stage = done ? "완료" : current <= 0 ? "미시작" : `${Math.min(4, Math.floor(ratio * 4) + 1)}단계`;
        return `<article class="${done ? "done" : ""}"><span>${stage}</span><div class="meta-achievement-main"><strong>${escapeHtml(achievement.name)}</strong><small>${escapeHtml(achievement.text)}</small><div class="meta-achievement-progress"><i><b style="width:${Math.round(ratio * 100)}%"></b><mark></mark><mark></mark><mark></mark></i><em>${current.toLocaleString()}/${achievement.target.toLocaleString()}</em></div></div><em>${escapeHtml(formatAchievementReward(achievement.reward))}<b class="meta-reward-status">${done ? "지급 완료" : "미달성"}</b></em></article>`;
      }).join("")}</div>
      <div class="meta-unlock-row"><span>발견 장비 <b>${progress.collections.equipmentBases.length}</b></span><span>발견 룬 <b>${progress.collections.runeTypes.length}</b></span><span>발견 유물 <b>${progress.collections.relics.length}</b></span><span>직업 승천 <b>${Object.values(progress.records.classBestAscension).filter((value) => Number(value) > 0).length}</b></span></div>`;
  }

  function renderCosmeticsTab(progress) {
    const selectedTitle = progress.cosmetics.selectedTitle || "";
    const selectedSkin = progress.cosmetics.selectedSkin || "";
    const titleEffect = COSMETIC_EFFECTS.titles[selectedTitle];
    const skinEffect = COSMETIC_EFFECTS.skins[selectedSkin];
    const skinVisual = SKIN_PRESENTATION[selectedSkin];
    const titleChoices = ["", ...progress.titles].map((title) => {
      const effect = COSMETIC_EFFECTS.titles[title];
      const active = selectedTitle === title;
      return `<button type="button" class="cosmetic-choice title-choice ${active ? "active" : ""}" data-progression-action="select-title" data-title="${escapeHtml(title)}"><i class="material-symbols-rounded" aria-hidden="true">${active ? "verified" : "military_tech"}</i><span><strong>${escapeHtml(title || "칭호 없음")}</strong><small>${escapeHtml(effect?.text || "칭호 효과를 적용하지 않습니다.")}</small></span><em>${active ? "사용 중" : "선택"}</em></button>`;
    }).join("");
    const skinChoices = ["", ...progress.skins].map((skin) => {
      const effect = COSMETIC_EFFECTS.skins[skin];
      const visual = SKIN_PRESENTATION[skin];
      const active = selectedSkin === skin;
      return `<button type="button" class="cosmetic-choice skin-choice ${active ? "active" : ""}" data-progression-action="select-skin" data-skin="${escapeHtml(skin)}" style="--skin-main:${visual?.main || "#94a3b8"};--skin-hot:${visual?.hot || "#e2e8f0"}"><i class="material-symbols-rounded" aria-hidden="true">${visual?.icon || "person"}</i><span><strong>${escapeHtml(effect?.label || (skin ? skin : "기본 외형"))}</strong><small>${escapeHtml(effect?.text || "기본 캐릭터와 스킬 이펙트를 사용합니다.")}</small></span><em>${active ? "사용 중" : "선택"}</em></button>`;
    }).join("");
    return `<section class="meta-cosmetic-current" style="--skin-main:${skinVisual?.main || "#94a3b8"};--skin-hot:${skinVisual?.hot || "#e2e8f0"}"><i class="material-symbols-rounded" aria-hidden="true">${skinVisual?.icon || "person"}</i><div><small>CURRENT APPEARANCE</small><strong>${escapeHtml(skinEffect?.label || "기본 외형")}</strong><span>${escapeHtml(selectedTitle || "칭호 없음")}</span></div><p>${escapeHtml(skinEffect?.text || "기본 캐릭터와 스킬 이펙트를 사용합니다.")}<br>${escapeHtml(titleEffect?.text || "칭호 효과를 적용하지 않습니다.")}</p></section>
      <div class="meta-cosmetic-layout"><section><div class="meta-section-head"><strong>칭호</strong><span>${progress.titles.length}개 보유 · 전투 기능 선택</span></div><div class="meta-cosmetic-list">${titleChoices}</div></section><section><div class="meta-section-head"><strong>스킨</strong><span>${progress.skins.length}개 보유 · 캐릭터와 스킬 외형 변경</span></div><div class="meta-cosmetic-list">${skinChoices}</div></section></div>`;
  }

  function formatAchievementReward(reward) {
    const parts = [];
    if (reward.shards) parts.push(`파편 ${reward.shards}`);
    if (reward.stones) parts.push(`강화석 ${reward.stones}`);
    if (reward.dust) parts.push(`가루 ${reward.dust}`);
    if (reward.essence) parts.push(`정수 ${reward.essence}`);
    if (reward.title) parts.push(`칭호: ${reward.title}`);
    if (reward.skin) parts.push("스킨");
    return parts.join(" · ");
  }

  function renderChallengesTab(progress) {
    const daily = progress.challenges.daily;
    const weekly = progress.challenges.weekly;
    const season = progress.challenges.season;
    const liveEvent = getLiveEvent();
    return `<div class="meta-mission-intro"><strong>개인 임무</strong><span>모드를 선택할 필요 없이 모든 일반·승천 원정에서 자동 누적됩니다.</span></div>
      <div class="meta-challenge-grid personal-missions">
        <article class="${daily.completed ? "done" : ""}"><span>DAILY MISSION · ${daily.key}</span><strong>${escapeHtml(daily.goalLabel)}</strong><p>${daily.completed ? "오늘의 개인 임무를 완료했습니다." : "내 전투 기록만 반영되며 파티원의 처치는 합산되지 않습니다."}</p><div><b>${daily.completed ? "완료" : "진행 중"}</b><em>${Math.min(daily.target, daily.progress).toLocaleString()}/${daily.target.toLocaleString()}</em></div><i><b style="width:${Math.min(100, daily.progress / daily.target * 100)}%"></b></i><small>보상: 파편 70 · 강화석 12</small></article>
        <article class="${weekly.completed ? "done" : ""}"><span>WEEKLY MISSION · ${weekly.key}</span><strong>${escapeHtml(weekly.goalLabel)}</strong><p>${weekly.completed ? "이번 주 개인 임무를 완료했습니다." : "일주일 동안 여러 원정에 걸쳐 진행도를 누적할 수 있습니다."}</p><div><b>${weekly.completed ? "완료" : "진행 중"}</b><em>${Math.min(weekly.target, weekly.progress).toLocaleString()}/${weekly.target.toLocaleString()}</em></div><i><b style="width:${Math.min(100, weekly.progress / weekly.target * 100)}%"></b></i><small>보상: 파편 180 · 보스 정수 5</small></article>
      </div>
      <div class="meta-season"><div><span>SEASON ${season.id}</span><strong>시즌 레벨 ${season.level}</strong></div><i><b style="width:${Math.min(100, season.xp / (season.level * 100) * 100)}%"></b></i><em>${season.xp}/${season.level * 100} XP · 레벨마다 파편/재련 가루 지급</em></div>
      <div class="meta-season-rewards">${SEASON_REWARDS.map((reward) => `<span class="${season.claimedLevels.includes(String(reward.level)) ? "claimed" : season.level >= reward.level ? "ready" : ""}"><b>Lv.${reward.level}</b>${escapeHtml(reward.label)}</span>`).join("")}</div>
      <div class="meta-live-event ${liveEvent.active ? "active" : ""}"><span>${liveEvent.active ? "LIVE EVENT" : "NEXT EVENT"}</span><div><strong>${escapeHtml(liveEvent.name)}</strong><small>${escapeHtml(liveEvent.text)}</small></div><b>${liveEvent.active ? "x2" : "WEEKEND"}</b></div>
      <p class="meta-challenge-note">일일 임무는 날짜가 바뀌면, 주간 임무는 매주 월요일에 개인별로 갱신됩니다.</p>`;
  }

  function renderProgressionPanel(progress, options = {}) {
    const next = normalizeProgress(progress);
    const classId = CLASS_IDS.includes(options.classId) ? options.classId : "warrior";
    const tab = ["gear", "forge", "archive", "cosmetics", "challenges"].includes(options.activeTab) ? options.activeTab : "gear";
    const labels = { gear: "장비·룬", forge: "제작·강화", archive: "도감·업적", cosmetics: "칭호·스킨", challenges: "개인 임무" };
    const body = tab === "forge" ? renderForgeTab(next, classId) : tab === "archive" ? renderArchiveTab(next) : tab === "cosmetics" ? renderCosmeticsTab(next) : tab === "challenges" ? renderChallengesTab(next, options.leaderboards || []) : renderGearTab(next, classId, options.inventoryUi || {});
    const chrome = options.embedded
      ? ""
      : `<div class="meta-panel-head"><div><strong>원정대 보관소</strong><span>파밍 · 제작 · 수집 · 반복 임무</span></div><div><small>강화석 ${next.currencies.enhancementStones}</small><small>가루 ${next.currencies.reforgingDust}</small><small>정수 ${next.currencies.bossEssence}</small></div></div><div class="meta-tabs">${Object.entries(labels).map(([id, label]) => `<button type="button" class="${tab === id ? "active" : ""}" data-progression-action="tab" data-tab="${id}">${label}</button>`).join("")}</div>`;
    return `<section class="meta-progression-panel${options.embedded ? " embedded" : ""}" aria-label="장기 성장 콘텐츠">${chrome}<div class="meta-tab-body">${body}</div></section>`;
  }

  function getProgressionRenderKey(progress, classId, tab) {
    const next = normalizeProgress(progress);
    const loadout = next.equipment[classId] || emptyLoadout();
    return [tab, classId, next.inventory.items.map((item) => `${item.id}:${item.enhance}:${item.rerolls}:${item.lockedAffixIndices.join(".")}:${JSON.stringify(item.reforgePreview)}`).join(","), next.inventory.runes.map((rune) => `${rune.id}:${rune.tier}`).join(","), JSON.stringify(next.inventory.bossMaterials), JSON.stringify(loadout), JSON.stringify(next.currencies), JSON.stringify(next.cosmetics), JSON.stringify(next.collections), JSON.stringify(next.combatByClass), Object.keys(next.achievements).length, next.challenges.daily.progress, next.challenges.weekly.progress, next.challenges.season.level].join("|");
  }

  function renderRunLootSummary(progress, resultKey) {
    const rewards = normalizeProgress(progress).lastRunRewards;
    if (!rewards || (resultKey && rewards.resultKey !== resultKey)) return "";
    const runeRows = (rewards.runes || []).map((rune) => `<span><b>룬 ${RUNE_GRADES[Math.max(0, rune.tier - 1)]}</b>${escapeHtml(rune.name)}</span>`).join("");
    const challengeRows = (rewards.challengeRewards || []).map((reward) => `<span><b>임무 완료</b>${escapeHtml(reward.label)}</span>`).join("");
    const materialRows = (rewards.bossMaterials || []).map((bossId) => `<span><b>보스 재료</b>${escapeHtml(BOSS_RECIPES.find((recipe) => recipe.bossId === bossId)?.materialName || bossId)} +1</span>`).join("");
    return `<section class="result-loot-panel"><div><strong>정산 보상</strong><small>강화석 +${rewards.enhancementStones || 0} · 가루 +${rewards.reforgingDust || 0} · 정수 +${rewards.bossEssence || 0}${rewards.eventMultiplier > 1 ? " · 이벤트 x2" : ""}</small></div><div class="result-loot-list">${runeRows}${materialRows}${challengeRows}</div></section>`;
  }

  const manager = {
    ...base,
    SAVE_VERSION,
    PROGRESS_KEY,
    LEGACY_PROGRESS_KEYS,
    ITEM_SLOTS,
    ITEM_BASES,
    RUNES,
    MONSTER_CATALOG,
    BOSS_CATALOG,
    RELIC_CATALOG,
    ACHIEVEMENTS,
    defaultProgress: normalizeProgress(base.defaultProgress),
    normalizeProgress,
    migrateProgress: normalizeProgress,
    loadUserProgress,
    saveUserProgress,
    resetUserProgress,
    exportUserProgress,
    importUserProgress,
    recordRunResult,
    spendMasteryPoint,
    calculateEquipmentBonuses,
    getGrowthLoadout,
    getActiveChallenge,
    getLiveEvent,
    generateRunLoot,
    getEquipmentDropPreview,
    grantEquipmentDrop,
    performProgressionAction,
    recordWorldDiscoveries,
    renderProgressionPanel,
    renderCodexEntryDetail,
    getProgressionRenderKey,
    renderRunLootSummary,
  };
  window.RogueSaveManager = manager;
  window.RogueProgressSave = manager;
})();
