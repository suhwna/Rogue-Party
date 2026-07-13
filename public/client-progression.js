(function () {
  const base = window.RogueSaveManager;
  if (!base) return;

  const SAVE_VERSION = 3;
  const PROGRESS_KEY = "rogue-party.progress.v3";
  const LEGACY_PROGRESS_KEYS = Array.from(new Set([base.PROGRESS_KEY, ...(base.LEGACY_PROGRESS_KEYS || [])].filter(Boolean)));
  const CLASS_IDS = base.CLASS_IDS || ["warrior", "ranger", "mage", "engineer"];
  const ITEM_SLOTS = ["weapon", "armor", "amulet", "core"];
  const SLOT_LABELS = { weapon: "무기", armor: "갑옷", amulet: "부적", core: "코어" };
  const SET_LABELS = { vanguard: "선봉대", hunter: "추적자", arcanist: "비전술사", mechanist: "기계공학", occult: "오컬트", abyss: "심연 군주" };
  const SET_BONUSES = {
    vanguard: { two: "최대 체력 +7%", four: "대시 후 다음 기본 공격 +35%", twoStats: { maxHpMul: 0.07 }, fourStats: { dashFollowupMul: 0.35 } },
    hunter: { two: "치명타 +4%", four: "투사체 벽 반사 +1", twoStats: { critChanceBonus: 0.04 }, fourStats: { wallBounceBonus: 1 } },
    arcanist: { two: "스킬 쿨감 +5%", four: "화상 피해 +30%", twoStats: { skillCooldownReduction: 0.05 }, fourStats: { burnDamageMul: 0.3 } },
    mechanist: { two: "설치물 피해 +12%", four: "터렛 처치 시 지속시간 +1초", twoStats: { constructDamageMul: 0.12 }, fourStats: { turretKillDurationBonus: 1 } },
    occult: { two: "상태이상 피해 +10%", four: "독 최대 중첩 +1", twoStats: { statusDamageMul: 0.1 }, fourStats: { poisonStackCapBonus: 1 } },
    abyss: { two: "보스 피해 +18%", four: "피해 +10%", twoStats: { bossDamageMul: 0.18 }, fourStats: { damageMul: 0.1 } },
  };
  const RARITIES = [
    { id: "common", label: "일반", color: "#cbd5e1", rank: 0 },
    { id: "rare", label: "희귀", color: "#60a5fa", rank: 1 },
    { id: "epic", label: "영웅", color: "#c084fc", rank: 2 },
    { id: "legendary", label: "전설", color: "#fbbf24", rank: 3 },
  ];
  const ITEM_BASES = [
    { id: "vanguard_blade", name: "선봉대 대검", slot: "weapon", classId: "warrior", setId: "vanguard", special: "boss_hunter" },
    { id: "echo_bow", name: "반향 장궁", slot: "weapon", classId: "ranger", setId: "hunter", special: "ricochet" },
    { id: "star_staff", name: "별무리 지팡이", slot: "weapon", classId: "mage", setId: "arcanist", special: "skill_amp" },
    { id: "clockwork_rifle", name: "태엽 핵총", slot: "weapon", classId: "engineer", setId: "mechanist", special: "construct_amp" },
    { id: "thread_needle", name: "운명의 바늘", slot: "weapon", classId: "puppeteer", setId: "occult", special: "status_amp" },
    { id: "dragon_gauntlet", name: "승룡 건틀릿", slot: "weapon", classId: "martialist", setId: "vanguard", special: "dash_amp" },
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
    { id: "afterimage_bow", name: "잔상 추적궁", slot: "weapon", classId: "ranger", setId: "hunter", special: "dash_followup" },
    { id: "kill_switch", name: "연장 회로", slot: "core", classId: "engineer", setId: "mechanist", special: "turret_sustain" },
    { id: "warden_bulwark", name: "철의 감시자 방벽", slot: "armor", classId: "all", setId: "vanguard", special: "dash_followup", bossCraft: true },
    { id: "prophet_censer", name: "군체 예언자의 향로", slot: "amulet", classId: "all", setId: "occult", special: "venom_cap", bossCraft: true },
    { id: "regent_engine", name: "공허 섭정의 동력핵", slot: "core", classId: "all", setId: "abyss", special: "burn_amp", bossCraft: true },
    { id: "abyss_crown", name: "심연 군주의 관", slot: "amulet", classId: "all", setId: "abyss", special: "abyss_crown", bossCraft: true },
  ];
  const AFFIXES = [
    { id: "power", label: "공격력", stat: "damageMul", min: 0.018, max: 0.052, percent: true },
    { id: "vitality", label: "최대 체력", stat: "maxHpMul", min: 0.02, max: 0.06, percent: true },
    { id: "haste", label: "스킬 쿨감", stat: "cooldownReduction", min: 0.012, max: 0.036, percent: true },
    { id: "swiftness", label: "이동 속도", stat: "speedMul", min: 0.01, max: 0.03, percent: true },
    { id: "critical", label: "치명타 확률", stat: "critChanceBonus", min: 0.008, max: 0.026, percent: true },
    { id: "armor", label: "방어", stat: "armorBonus", min: 0.3, max: 1.1 },
    { id: "elite", label: "정예/보스 피해", stat: "eliteDamage", min: 0.02, max: 0.065, percent: true },
    { id: "status", label: "상태이상 피해", stat: "statusDamage", min: 0.025, max: 0.075, percent: true },
    { id: "dash", label: "대시 공격 피해", stat: "dashDamage", min: 0.035, max: 0.1, percent: true },
  ];
  const SPECIALS = {
    boss_hunter: { label: "거인 사냥", text: "보스 피해 증가" },
    ricochet: { label: "벽 반사", text: "투사체가 벽에서 1회 튕김" },
    skill_amp: { label: "과충전", text: "스킬 피해와 범위 증가" },
    construct_amp: { label: "자동화", text: "설치물 피해와 지속시간 증가" },
    status_amp: { label: "연쇄 오염", text: "상태이상 피해 증가" },
    dash_amp: { label: "돌진 증폭", text: "대시 공격 피해 증가" },
    venom_cap: { label: "맹독 저장고", text: "독 최대 중첩 +1" },
    crit_amp: { label: "처형 각인", text: "치명타 확률과 피해 증가" },
    last_guard: { label: "최후의 방벽", text: "저체력 진입 시 보호막 획득" },
    swift_guard: { label: "바람막이", text: "이동 속도와 방어 증가" },
    abyss_crown: { label: "심연 지배", text: "심연과 보스에서 큰 피해 증가" },
    burn_amp: { label: "불씨 증폭", text: "화상 피해 +28%" },
    dash_followup: { label: "추격 일격", text: "대시 후 다음 기본 공격 강화" },
    turret_sustain: { label: "자가 연장", text: "터렛 처치 시 지속시간 +0.8초" },
  };
  const RUNES = [
    { id: "fury", name: "격노 룬", text: "피해 증가" },
    { id: "ward", name: "수호 룬", text: "체력과 방어 증가" },
    { id: "haste", name: "순환 룬", text: "이동 속도와 쿨감" },
    { id: "venom", name: "맹독 룬", text: "상태이상 피해와 독 중첩" },
    { id: "rebound", name: "반향 룬", text: "고단계에서 벽 반사" },
    { id: "eclipse", name: "시즌 일식 룬", text: "화상·독 피해와 보스 피해 증가" },
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
  ];
  const RELIC_CATALOG = [
    { id: "power_core", name: "힘의 핵", detail: "공격력 증가" },
    { id: "iron_plate", name: "강철 갑판", detail: "방어력 증가" },
    { id: "swift_boots", name: "신속의 장화", detail: "이동 속도 증가" },
    { id: "cooling_gear", name: "냉각 장치", detail: "쿨타임 감소" },
    { id: "splitter_core", name: "분열 핵", detail: "투사체 추가" },
    { id: "giant_lens", name: "거대 렌즈", detail: "범위 증가" },
    { id: "sharp_eye", name: "예리한 눈", detail: "치명타 확률 증가" },
    { id: "fatal_mark", name: "치명 표식", detail: "치명타 피해 증가" },
    { id: "living_moss", name: "살아있는 이끼", detail: "체력 재생 증가" },
    { id: "heartstone", name: "심장석", detail: "최대 체력 증가" },
  ];
  const ACHIEVEMENTS = [
    { id: "first_run", name: "첫 원정", text: "런 1회 완료", target: 1, current: (p) => p.statistics.runs, reward: { shards: 20, title: "초행자" } },
    { id: "first_victory", name: "첫 돌파", text: "런 1회 승리", target: 1, current: (p) => p.statistics.victories, reward: { shards: 45, skin: "victory_trim" } },
    { id: "abyss_3", name: "심연 탐사자", text: "심연 3층 도달", target: 3, current: (p) => p.records.highestAbyssDepth, reward: { shards: 80, title: "심연 탐사자" } },
    { id: "ascension_5", name: "승천자", text: "승천 5단계 해금", target: 5, current: (p) => p.records.highestAscension, reward: { shards: 100, title: "승천자" } },
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
  ];
  const BOSS_RECIPES = [
    { id: "warden_bulwark", bossId: "iron_warden", materialName: "철갑 파편", amount: 3, shards: 70, label: "철의 감시자 방벽" },
    { id: "prophet_censer", bossId: "hive_prophet", materialName: "군체 포자", amount: 3, shards: 70, label: "군체 예언자의 향로" },
    { id: "regent_engine", bossId: "void_regent", materialName: "공허 왕핵", amount: 3, shards: 90, label: "공허 섭정의 동력핵" },
    { id: "abyss_crown", bossId: "void_regent", materialName: "공허 왕핵", amount: 6, shards: 120, label: "심연 군주의 관" },
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

  function normalizeItem(item) {
    const baseDef = baseById(item?.baseId);
    const rarity = rarityById(item?.rarity).id;
    const affixes = (Array.isArray(item?.affixes) ? item.affixes : []).slice(0, 4).map((affix) => {
      const def = AFFIXES.find((entry) => entry.id === affix?.id) || AFFIXES[0];
      return { id: def.id, value: Math.max(0, Math.min(2, Number(affix?.value) || def.min)) };
    });
    return {
      id: String(item?.id || `item-${hashString(JSON.stringify(item))}`).slice(0, 96),
      baseId: baseDef.id,
      name: String(item?.name || baseDef.name).slice(0, 48),
      slot: baseDef.slot,
      classId: baseDef.classId,
      setId: baseDef.setId,
      special: baseDef.special,
      rarity,
      itemLevel: integer(item?.itemLevel, 1, 9999) || 1,
      enhance: integer(item?.enhance, 0, 20),
      rerolls: integer(item?.rerolls, 0, 9999),
      lockedAffixIndex: Number.isInteger(item?.lockedAffixIndex) ? Math.max(-1, Math.min(affixes.length - 1, item.lockedAffixIndex)) : -1,
      affixes,
    };
  }

  function normalizeRune(rune) {
    const def = runeDefById(rune?.runeId);
    return {
      id: String(rune?.id || `rune-${hashString(JSON.stringify(rune))}`).slice(0, 96),
      runeId: def.id,
      tier: Math.max(1, integer(rune?.tier, 1, 5)),
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
    const items = (Array.isArray(source.inventory?.items) ? source.inventory.items : []).slice(-120).map(normalizeItem);
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
    const legendary = Math.min(0.18, 0.012 + power * 0.006);
    const epic = Math.min(0.34, 0.08 + power * 0.012);
    const rare = Math.min(0.56, 0.26 + power * 0.014);
    const roll = random();
    if (roll < legendary) return "legendary";
    if (roll < legendary + epic) return "epic";
    if (roll < legendary + epic + rare) return "rare";
    return "common";
  }

  function rollAffix(random, itemLevel, rarityRank, excluded = []) {
    const pool = AFFIXES.filter((affix) => !excluded.includes(affix.id));
    const def = pool[Math.floor(random() * pool.length)] || AFFIXES[0];
    const levelScale = 1 + Math.log1p(itemLevel) * 0.12 + rarityRank * 0.16;
    return { id: def.id, value: Math.round((def.min + (def.max - def.min) * random()) * levelScale * 10000) / 10000 };
  }

  function generateItem(seed, result, index = 0, options = {}) {
    const random = createRandom(hashString(`${seed}:item:${index}:${options.craft || "drop"}`));
    const classId = CLASS_IDS.includes(result?.classId) ? result.classId : "warrior";
    const slot = options.slot || ITEM_SLOTS[Math.floor(random() * ITEM_SLOTS.length)];
    let pool = ITEM_BASES.filter((baseItem) => !baseItem.bossCraft && baseItem.slot === slot && (baseItem.classId === "all" || baseItem.classId === classId));
    if (options.baseId) pool = ITEM_BASES.filter((baseItem) => baseItem.id === options.baseId);
    const baseItem = pool[Math.floor(random() * pool.length)] || ITEM_BASES.find((entry) => entry.slot === slot && !entry.bossCraft) || ITEM_BASES[0];
    const power = integer(result?.highestLevel, 1) + integer(result?.abyssDepth) * 3 + integer(result?.ascensionLevel);
    const rarity = options.rarity || rollRarity(random, power);
    const rarityRank = rarityById(rarity).rank;
    const affixes = [];
    const affixCount = Math.min(4, 1 + rarityRank);
    for (let i = 0; i < affixCount; i += 1) affixes.push(rollAffix(random, Math.max(1, power), rarityRank, affixes.map((affix) => affix.id)));
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
    const depth = integer(result?.abyssDepth) + integer(result?.ascensionLevel);
    const tier = random() < Math.min(0.35, depth * 0.018) ? 2 : 1;
    const def = RUNES[Math.floor(random() * RUNES.length)];
    return normalizeRune({ id: `r-${hashString(`${seed}:${index}:${def.id}`).toString(36)}-${index}`, runeId: def.id, tier });
  }

  function generateRunLoot(result) {
    const resultKey = String(result?.resultKey || `${result?.outcome}:${result?.totalScore}:${result?.durationSec}`);
    const seed = hashString(resultKey);
    const victory = result?.outcome === "victory";
    const depth = integer(result?.abyssDepth);
    const itemCount = Math.min(4, 1 + (victory ? 1 : 0) + Math.floor(depth / 3));
    const runeCount = Math.min(3, (victory ? 1 : 0) + (depth > 0 ? 1 : 0));
    const items = Array.from({ length: itemCount }, (_, index) => generateItem(seed, result, index));
    const runes = Array.from({ length: runeCount }, (_, index) => generateRune(seed, result, index));
    const liveEvent = getLiveEvent();
    return {
      resultKey,
      items,
      runes,
      enhancementStones: (3 + integer(result?.stagesCleared) + (victory ? 5 : 0) + depth * 2) * liveEvent.rewardMultiplier,
      reforgingDust: (Math.floor(integer(result?.highestLevel, 1) / 2) + depth * 2) * liveEvent.rewardMultiplier,
      bossEssence: (victory ? 2 : 0) + Math.floor(depth / 2),
      eventMultiplier: liveEvent.rewardMultiplier,
    };
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
    const overflow = Math.max(0, next.inventory.items.length - 120);
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

  function calculateEquipmentBonuses(progress, classId) {
    const next = normalizeProgress(progress);
    const loadout = next.equipment[classId] || emptyLoadout();
    const itemMap = new Map(next.inventory.items.map((item) => [item.id, item]));
    const runeMap = new Map(next.inventory.runes.map((rune) => [rune.id, rune]));
    const bonuses = {
      damageMul: 1, maxHpMul: 1, speedMul: 1, skillCooldownMul: 1, armorBonus: 0,
      critChanceBonus: 0, critDamageMul: 1, eliteDamageMul: 1, bossDamageMul: 1,
      statusDamageMul: 1, dashDamageMul: 1, areaMul: 1, constructDamageMul: 1,
      constructDurationMul: 1, burnDamageMul: 1, dashFollowupMul: 1, turretKillDurationBonus: 0,
      wallBounceBonus: 0, poisonStackCapBonus: 0, lowHpShieldRatio: 0,
    };
    const equippedItems = ITEM_SLOTS.map((slot) => itemMap.get(loadout[slot])).filter(Boolean);
    const sets = {};
    for (const item of equippedItems) {
      const rarityRank = rarityById(item.rarity).rank;
      const scale = 1 + item.enhance * 0.055 + rarityRank * 0.06;
      for (const affix of item.affixes) {
        const def = AFFIXES.find((entry) => entry.id === affix.id);
        const value = affix.value * scale;
        if (!def) continue;
        if (def.stat === "damageMul") addBonus(bonuses, "damageMul", value);
        else if (def.stat === "maxHpMul") addBonus(bonuses, "maxHpMul", value);
        else if (def.stat === "speedMul") addBonus(bonuses, "speedMul", value);
        else if (def.stat === "cooldownReduction") bonuses.skillCooldownMul -= value;
        else if (def.stat === "armorBonus") addBonus(bonuses, "armorBonus", value);
        else if (def.stat === "critChanceBonus") addBonus(bonuses, "critChanceBonus", value);
        else if (def.stat === "eliteDamage") addBonus(bonuses, "eliteDamageMul", value);
        else if (def.stat === "statusDamage") addBonus(bonuses, "statusDamageMul", value);
        else if (def.stat === "dashDamage") addBonus(bonuses, "dashDamageMul", value);
      }
      sets[item.setId] = (sets[item.setId] || 0) + 1;
      if (item.special === "boss_hunter") bonuses.bossDamageMul += 0.08 + rarityRank * 0.015;
      if (item.special === "ricochet") bonuses.wallBounceBonus += 1;
      if (item.special === "skill_amp") { bonuses.damageMul += 0.035; bonuses.areaMul += 0.05; }
      if (item.special === "construct_amp") { bonuses.constructDamageMul += 0.11; bonuses.constructDurationMul += 0.09; }
      if (item.special === "status_amp") bonuses.statusDamageMul += 0.11;
      if (item.special === "dash_amp") bonuses.dashDamageMul += 0.14;
      if (item.special === "venom_cap") bonuses.poisonStackCapBonus += 1;
      if (item.special === "crit_amp") { bonuses.critChanceBonus += 0.035; bonuses.critDamageMul += 0.08; }
      if (item.special === "last_guard") bonuses.lowHpShieldRatio = Math.max(bonuses.lowHpShieldRatio, 0.18);
      if (item.special === "swift_guard") { bonuses.speedMul += 0.035; bonuses.armorBonus += 0.8; }
      if (item.special === "abyss_crown") { bonuses.bossDamageMul += 0.18; bonuses.damageMul += 0.08; }
      if (item.special === "burn_amp") bonuses.burnDamageMul += 0.28;
      if (item.special === "dash_followup") bonuses.dashFollowupMul += 0.32;
      if (item.special === "turret_sustain") bonuses.turretKillDurationBonus += 0.8;
    }
    for (const [setId, count] of Object.entries(sets)) {
      const setBonus = SET_BONUSES[setId];
      if (!setBonus) continue;
      const tiers = count >= 4 ? [setBonus.twoStats, setBonus.fourStats] : count >= 2 ? [setBonus.twoStats] : [];
      for (const stats of tiers) {
        for (const [key, value] of Object.entries(stats || {})) {
          if (key === "skillCooldownReduction") bonuses.skillCooldownMul -= value;
          else addBonus(bonuses, key, value);
        }
      }
    }
    for (const runeId of loadout.runes || []) {
      const rune = runeMap.get(runeId);
      if (!rune) continue;
      const tier = Math.max(1, rune.tier);
      if (rune.runeId === "fury") bonuses.damageMul += 0.018 * tier;
      if (rune.runeId === "ward") { bonuses.maxHpMul += 0.025 * tier; bonuses.armorBonus += 0.22 * tier; }
      if (rune.runeId === "haste") { bonuses.speedMul += 0.008 * tier; bonuses.skillCooldownMul -= 0.009 * tier; }
      if (rune.runeId === "venom") { bonuses.statusDamageMul += 0.025 * tier; if (tier >= 4) bonuses.poisonStackCapBonus += 1; }
      if (rune.runeId === "rebound" && tier >= 3) bonuses.wallBounceBonus += 1;
      if (rune.runeId === "eclipse") { bonuses.burnDamageMul += 0.04 * tier; bonuses.statusDamageMul += 0.035 * tier; bonuses.bossDamageMul += 0.02 * tier; }
    }
    bonuses.damageMul = Math.min(1.6, bonuses.damageMul);
    bonuses.maxHpMul = Math.min(1.5, bonuses.maxHpMul);
    bonuses.speedMul = Math.min(1.25, bonuses.speedMul);
    bonuses.skillCooldownMul = Math.max(0.74, bonuses.skillCooldownMul);
    bonuses.armorBonus = Math.min(6, bonuses.armorBonus);
    bonuses.critChanceBonus = Math.min(0.22, bonuses.critChanceBonus);
    bonuses.wallBounceBonus = Math.min(2, bonuses.wallBounceBonus);
    bonuses.poisonStackCapBonus = Math.min(2, bonuses.poisonStackCapBonus);
    bonuses.burnDamageMul = Math.min(1.75, bonuses.burnDamageMul);
    bonuses.dashFollowupMul = Math.min(1.8, bonuses.dashFollowupMul);
    bonuses.turretKillDurationBonus = Math.min(2, bonuses.turretKillDurationBonus);
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
    return {
      ...loadout,
      version: SAVE_VERSION,
      gearBonuses: calculateEquipmentBonuses(next, loadout.classId),
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
    } else if (action === "enhance-item" && item && item.enhance < 20) {
      const cost = 5 + item.enhance * 4;
      if (next.currencies.enhancementStones >= cost) {
        next.currencies.enhancementStones -= cost; item.enhance += 1; next.statistics.enhancements += 1;
        changed = true; affectsLoadout = isItemEquipped(next, item.id); message = `${item.name} +${item.enhance}`;
      }
    } else if (action === "reforge-item" && item && item.affixes.length) {
      const cost = 8 + rarityById(item.rarity).rank * 6 + item.rerolls * 3;
      const index = item.affixes.findIndex((_, affixIndex) => affixIndex !== item.lockedAffixIndex);
      if (index >= 0 && next.currencies.abyssShards >= cost) {
        next.currencies.abyssShards -= cost;
        const random = createRandom(hashString(`${item.id}:reroll:${item.rerolls}`));
        item.affixes[index] = rollAffix(random, item.itemLevel, rarityById(item.rarity).rank, item.affixes.filter((_, i) => i !== index).map((affix) => affix.id));
        item.rerolls += 1; next.statistics.reforges += 1; changed = true; affectsLoadout = isItemEquipped(next, item.id);
      }
    } else if (action === "lock-affix" && item && item.affixes.length) {
      const index = Math.max(0, Math.min(item.affixes.length - 1, integer(payload.affixIndex)));
      item.lockedAffixIndex = item.lockedAffixIndex === index ? -1 : index; changed = true;
    } else if (action === "equip-rune") {
      const rune = next.inventory.runes.find((entry) => entry.id === payload.runeId);
      const slot = integer(payload.runeSlot, 0, 2);
      if (rune) {
        for (const loadout of Object.values(next.equipment)) loadout.runes = loadout.runes.map((id) => id === rune.id ? "" : id);
        next.equipment[classId].runes[slot] = rune.id; changed = true; affectsLoadout = true;
      }
    } else if (action === "unequip-rune") {
      const slot = integer(payload.runeSlot, 0, 2);
      next.equipment[classId].runes[slot] = ""; changed = true; affectsLoadout = true;
    } else if (action === "merge-rune") {
      const runeId = String(payload.runeType || "");
      const tier = Math.max(1, integer(payload.tier, 1, 4));
      const candidates = next.inventory.runes.filter((rune) => rune.runeId === runeId && rune.tier === tier && !isRuneEquipped(next, rune.id)).slice(0, 3);
      if (candidates.length === 3) {
        const removed = new Set(candidates.map((rune) => rune.id));
        next.inventory.runes = next.inventory.runes.filter((rune) => !removed.has(rune.id));
        next.inventory.runes.push(normalizeRune({ id: `r-merge-${hashString(`${runeId}:${tier}:${Date.now()}`).toString(36)}`, runeId, tier: tier + 1 }));
        next.statistics.crafts += 1; changed = true; message = `${runeDefById(runeId).name} ${tier + 1}단계 합성`;
      }
    } else if (action === "craft-boss") {
      const recipe = BOSS_RECIPES.find((entry) => entry.id === payload.recipeId) || BOSS_RECIPES[BOSS_RECIPES.length - 1];
      const materials = integer(next.inventory.bossMaterials[recipe.bossId]);
      if (materials >= recipe.amount && next.currencies.abyssShards >= recipe.shards && next.inventory.items.length < 120) {
        next.inventory.bossMaterials[recipe.bossId] = materials - recipe.amount;
        next.currencies.abyssShards -= recipe.shards;
        const crafted = generateItem(Date.now(), { classId, highestLevel: next.account.level, abyssDepth: next.records.highestAbyssDepth }, next.statistics.crafts, { baseId: recipe.id, rarity: "legendary", enhance: 3, craft: recipe.id });
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

  function renderItem(item, options = {}) {
    const rarity = rarityById(item.rarity);
    const special = SPECIALS[item.special];
    const compatible = item.classId === "all" || item.classId === options.classId;
    return `<article class="meta-item" style="--item-color:${rarity.color}">
      <div class="meta-item-main"><span class="meta-rarity">${rarity.label}</span><strong>${escapeHtml(item.name)}${item.enhance ? ` +${item.enhance}` : ""}</strong><small>iLv.${item.itemLevel} · ${SLOT_LABELS[item.slot]} · ${escapeHtml(SET_LABELS[item.setId] || item.setId)} 세트</small></div>
      <div class="meta-affixes">${item.affixes.map((affix, index) => `<span class="${item.lockedAffixIndex === index ? "locked" : ""}">${escapeHtml(formatAffix(affix))}</span>`).join("")}${special ? `<span class="special">${escapeHtml(special.label)} · ${escapeHtml(special.text)}</span>` : ""}</div>
      <div class="meta-item-actions">${compatible && !options.equipped ? `<button type="button" data-progression-action="equip-item" data-item-id="${escapeHtml(item.id)}">장착</button>` : ""}${!options.equipped ? `<button type="button" data-progression-action="salvage-item" data-item-id="${escapeHtml(item.id)}">분해</button>` : ""}</div>
    </article>`;
  }

  function renderGearTab(progress, classId) {
    const loadout = progress.equipment[classId] || emptyLoadout();
    const itemMap = new Map(progress.inventory.items.map((item) => [item.id, item]));
    const runeMap = new Map(progress.inventory.runes.map((rune) => [rune.id, rune]));
    const bonuses = calculateEquipmentBonuses(progress, classId);
    const bonusRows = [
      ["피해", percent(bonuses.damageMul - 1)], ["체력", percent(bonuses.maxHpMul - 1)], ["쿨감", percent(1 - bonuses.skillCooldownMul)],
      ["정예", percent(bonuses.eliteDamageMul - 1)], ["화상", percent(bonuses.burnDamageMul - 1)], ["추격", percent(bonuses.dashFollowupMul - 1)],
      ["벽 반사", `${bonuses.wallBounceBonus}회`], ["독 한도", `+${bonuses.poisonStackCapBonus}`], ["터렛 연장", `${bonuses.turretKillDurationBonus}초`],
    ];
    const activeSets = {};
    for (const slot of ITEM_SLOTS) {
      const item = itemMap.get(loadout[slot]);
      if (item) activeSets[item.setId] = (activeSets[item.setId] || 0) + 1;
    }
    const equipped = ITEM_SLOTS.map((slot) => {
      const item = itemMap.get(loadout[slot]);
      return `<div class="meta-slot"><span>${SLOT_LABELS[slot]}</span>${item ? `<strong>${escapeHtml(item.name)}${item.enhance ? ` +${item.enhance}` : ""}</strong><button type="button" data-progression-action="unequip-slot" data-slot="${slot}" aria-label="해제">×</button>` : `<em>비어 있음</em>`}</div>`;
    }).join("");
    const runeSlots = [0, 1, 2].map((index) => {
      const rune = runeMap.get(loadout.runes[index]);
      return `<div class="meta-rune-slot"><span>룬 ${index + 1}</span>${rune ? `<strong>${escapeHtml(runeDefById(rune.runeId).name)} T${rune.tier}</strong><button type="button" data-progression-action="unequip-rune" data-rune-slot="${index}" aria-label="해제">×</button>` : `<em>비어 있음</em>`}</div>`;
    }).join("");
    const inventory = progress.inventory.items.filter((item) => !isItemEquipped(progress, item.id)).slice().sort((a, b) => rarityById(b.rarity).rank - rarityById(a.rarity).rank || b.itemLevel - a.itemLevel).slice(0, 10);
    const runes = progress.inventory.runes.slice().sort((a, b) => b.tier - a.tier).slice(0, 12);
    return `<div class="meta-bonus-strip">${bonusRows.map(([label, value]) => `<span><small>${label}</small><b>${value}</b></span>`).join("")}</div>
      <div class="meta-set-list">${Object.entries(activeSets).map(([setId, count]) => { const set = SET_BONUSES[setId]; return `<span class="${count >= 2 ? "active" : ""}"><b>${escapeHtml(SET_LABELS[setId] || setId)} ${count}/4</b><small>2세트 ${escapeHtml(set?.two || "-")} · 4세트 ${escapeHtml(set?.four || "-")}</small></span>`; }).join("") || `<span><small>같은 세트 장비를 2개 이상 장착하면 세트 효과가 활성화됩니다.</small></span>`}</div>
      <div class="meta-loadout-grid">${equipped}</div><div class="meta-rune-slots">${runeSlots}</div>
      <div class="meta-section-head"><strong>보유 장비 ${progress.inventory.items.length}/120</strong><span>현재 직업 장비 우선 표시</span></div>
      <div class="meta-item-list">${inventory.length ? inventory.map((item) => renderItem(item, { classId })).join("") : `<p class="meta-empty">런을 완료하면 장비가 드랍됩니다.</p>`}</div>
      <div class="meta-section-head"><strong>보유 룬 ${progress.inventory.runes.length}</strong><span>원하는 슬롯에 장착</span></div>
      <div class="meta-rune-list">${runes.length ? runes.map((rune) => `<article><span>${escapeHtml(runeDefById(rune.runeId).name)} <b>T${rune.tier}</b></span><small>${escapeHtml(runeDefById(rune.runeId).text)}</small><div>${[0,1,2].map((slot) => `<button type="button" data-progression-action="equip-rune" data-rune-id="${escapeHtml(rune.id)}" data-rune-slot="${slot}">${slot + 1}</button>`).join("")}</div></article>`).join("") : `<p class="meta-empty">승리하거나 심연에 진입하면 룬이 드랍됩니다.</p>`}</div>`;
  }

  function renderForgeTab(progress, classId) {
    const loadout = progress.equipment[classId] || emptyLoadout();
    const itemMap = new Map(progress.inventory.items.map((item) => [item.id, item]));
    const equipped = ITEM_SLOTS.map((slot) => itemMap.get(loadout[slot])).filter(Boolean);
    const groups = {};
    for (const rune of progress.inventory.runes.filter((entry) => !isRuneEquipped(progress, entry.id) && entry.tier < 5)) {
      const key = `${rune.runeId}:${rune.tier}`;
      groups[key] = (groups[key] || 0) + 1;
    }
    return `<div class="meta-currency-row"><span>심연 파편 <b>${progress.currencies.abyssShards}</b></span><span>강화석 <b>${progress.currencies.enhancementStones}</b></span><span>재련 가루 <b>${progress.currencies.reforgingDust}</b></span></div>
      <div class="meta-section-head"><strong>장착 장비 강화</strong><span>강화는 +20, 재련은 잠기지 않은 옵션 변경</span></div>
      <div class="meta-forge-list">${equipped.length ? equipped.map((item) => {
        const enhanceCost = 5 + item.enhance * 4;
        const rerollCost = 8 + rarityById(item.rarity).rank * 6 + item.rerolls * 3;
        return `<article><div><strong>${escapeHtml(item.name)} +${item.enhance}</strong><span>${item.affixes.map(formatAffix).map(escapeHtml).join(" · ")}</span></div><div><button type="button" data-progression-action="enhance-item" data-item-id="${escapeHtml(item.id)}" ${progress.currencies.enhancementStones < enhanceCost || item.enhance >= 20 ? "disabled" : ""}>강화 ${enhanceCost}</button><button type="button" data-progression-action="reforge-item" data-item-id="${escapeHtml(item.id)}" ${progress.currencies.abyssShards < rerollCost ? "disabled" : ""}>재련 파편 ${rerollCost}</button>${item.affixes.map((_, index) => `<button class="icon-only ${item.lockedAffixIndex === index ? "active" : ""}" type="button" data-progression-action="lock-affix" data-item-id="${escapeHtml(item.id)}" data-affix-index="${index}" title="옵션 ${index + 1} 잠금">${item.lockedAffixIndex === index ? "▣" : "□"}</button>`).join("")}</div></article>`;
      }).join("") : `<p class="meta-empty">장착한 장비가 없습니다.</p>`}</div>
      <div class="meta-section-head"><strong>룬 합성</strong><span>같은 룬 3개 → 상위 단계 1개</span></div>
      <div class="meta-merge-list">${Object.entries(groups).map(([key, count]) => { const [runeId, tier] = key.split(":"); return `<button type="button" data-progression-action="merge-rune" data-rune-type="${runeId}" data-tier="${tier}" ${count < 3 ? "disabled" : ""}>${escapeHtml(runeDefById(runeId).name)} T${tier} <b>${count}/3</b></button>`; }).join("") || `<p class="meta-empty">합성 가능한 룬이 없습니다.</p>`}</div>
      <div class="meta-section-head"><strong>보스 전용 제작</strong><span>보스 처치 재료로 전설 장비 제작</span></div>
      <div class="meta-boss-recipes">${BOSS_RECIPES.map((recipe) => { const held = integer(progress.inventory.bossMaterials[recipe.bossId]); return `<article><div><strong>${escapeHtml(recipe.label)}</strong><span>${escapeHtml(recipe.materialName)} ${held}/${recipe.amount} · 파편 ${recipe.shards}</span></div><button type="button" data-progression-action="craft-boss" data-recipe-id="${recipe.id}" ${held < recipe.amount || progress.currencies.abyssShards < recipe.shards ? "disabled" : ""}>제작</button></article>`; }).join("")}</div>`;
  }

  function renderCollectionCatalog(label, collectedIds, catalog, describe) {
    const collected = new Set(collectedIds);
    const found = catalog.filter((entry) => collected.has(entry.id)).length;
    return `<details class="meta-collection-detail" ${found > 0 ? "open" : ""}>
      <summary><span>${escapeHtml(label)}</span><strong>${found}/${catalog.length}</strong><i><b style="width:${catalog.length ? Math.min(100, found / catalog.length * 100) : 0}%"></b></i></summary>
      <div class="meta-codex-list">${catalog.map((entry) => {
        const discovered = collected.has(entry.id);
        return `<article class="${discovered ? "discovered" : "locked"}"><span>${discovered ? "발견" : "미발견"}</span><div><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(describe(entry))}</small></div></article>`;
      }).join("")}</div>
    </details>`;
  }

  function getCatalogDiscoveryCount(collectedIds, catalog) {
    const collected = new Set(collectedIds);
    return catalog.filter((entry) => collected.has(entry.id)).length;
  }

  function renderArchiveTab(progress) {
    const collectionRows = [
      ["장비", getCatalogDiscoveryCount(progress.collections.equipmentBases, ITEM_BASES), ITEM_BASES.length],
      ["룬", getCatalogDiscoveryCount(progress.collections.runeTypes, RUNES), RUNES.length],
      ["몬스터", getCatalogDiscoveryCount(progress.collections.monsters, MONSTER_CATALOG), MONSTER_CATALOG.length],
      ["보스", getCatalogDiscoveryCount(progress.collections.bosses, BOSS_CATALOG), BOSS_CATALOG.length],
      ["유물", getCatalogDiscoveryCount(progress.collections.relics, RELIC_CATALOG), RELIC_CATALOG.length],
    ];
    const combatTotals = Object.values(progress.combatByClass).reduce((total, stats) => {
      for (const key of Object.keys(total)) total[key] += integer(stats[key]);
      return total;
    }, emptyCombatStats());
    const collectionDetails = [
      renderCollectionCatalog("장비 도감", progress.collections.equipmentBases, ITEM_BASES, (entry) => `${SLOT_LABELS[entry.slot]} · ${SET_LABELS[entry.setId] || entry.setId}`),
      renderCollectionCatalog("룬 도감", progress.collections.runeTypes, RUNES, (entry) => entry.text),
      renderCollectionCatalog("몬스터 도감", progress.collections.monsters, MONSTER_CATALOG, (entry) => entry.detail),
      renderCollectionCatalog("보스 도감", progress.collections.bosses, BOSS_CATALOG, (entry) => entry.detail),
      renderCollectionCatalog("유물 도감", progress.collections.relics, RELIC_CATALOG, (entry) => entry.detail),
    ].join("");
    return `<div class="meta-collection-grid">${collectionRows.map(([label, current, total]) => `<article><span>${label}</span><strong>${current}/${total}</strong><i><b style="width:${Math.min(100, current / total * 100)}%"></b></i></article>`).join("")}</div>
      <div class="meta-section-head"><strong>수집 상세</strong><span>항목을 펼쳐 발견 목록 확인</span></div>
      <div class="meta-collection-details">${collectionDetails}</div>
      <div class="meta-combat-records"><span><small>누적 피해</small><b>${combatTotals.damage.toLocaleString()}</b></span><span><small>엘리트 처치</small><b>${combatTotals.eliteKills.toLocaleString()}</b></span><span><small>독 피해</small><b>${combatTotals.poisonDamage.toLocaleString()}</b></span><span><small>화상 피해</small><b>${combatTotals.burnDamage.toLocaleString()}</b></span><span><small>터렛 처치</small><b>${combatTotals.turretKills.toLocaleString()}</b></span></div>
      <div class="meta-section-head"><strong>업적 ${Object.keys(progress.achievements).length}/${ACHIEVEMENTS.length}</strong><span>보상은 달성 즉시 지급</span></div>
      <div class="meta-achievement-list">${ACHIEVEMENTS.map((achievement) => {
        const done = Boolean(progress.achievements[achievement.id]);
        const current = Math.min(achievement.target, integer(achievement.current(progress)));
        const ratio = done ? 1 : Math.min(1, current / Math.max(1, achievement.target));
        const stage = done ? "완료" : current <= 0 ? "미시작" : `${Math.min(4, Math.floor(ratio * 4) + 1)}단계`;
        return `<article class="${done ? "done" : ""}"><span>${stage}</span><div class="meta-achievement-main"><strong>${escapeHtml(achievement.name)}</strong><small>${escapeHtml(achievement.text)}</small><div class="meta-achievement-progress"><i><b style="width:${Math.round(ratio * 100)}%"></b><mark></mark><mark></mark><mark></mark></i><em>${current.toLocaleString()}/${achievement.target.toLocaleString()}</em></div></div><em>${escapeHtml(formatAchievementReward(achievement.reward))}</em></article>`;
      }).join("")}</div>
      <div class="meta-unlock-row"><span>칭호 <b>${progress.titles.length}</b></span><span>스킨 <b>${progress.skins.length}</b></span><span>발견 유물 <b>${progress.collections.relics.length}</b></span><span>직업 승천 <b>${Object.values(progress.records.classBestAscension).filter((value) => Number(value) > 0).length}</b></span></div>
      <div class="meta-section-head"><strong>칭호·스킨</strong><span>선택 즉시 로비와 전투에 적용</span></div>
      <div class="meta-cosmetic-pickers"><div><b>칭호</b>${["", ...progress.titles].map((title) => `<button type="button" class="${progress.cosmetics.selectedTitle === title ? "active" : ""}" data-progression-action="select-title" data-title="${escapeHtml(title)}">${escapeHtml(title || "없음")}</button>`).join("")}</div><div><b>스킨</b>${["", ...progress.skins].map((skin) => `<button type="button" class="${progress.cosmetics.selectedSkin === skin ? "active" : ""}" data-progression-action="select-skin" data-skin="${escapeHtml(skin)}">${escapeHtml(skin || "기본")}</button>`).join("")}</div></div>`;
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
    const tab = ["gear", "forge", "archive", "challenges"].includes(options.activeTab) ? options.activeTab : "gear";
    const labels = { gear: "장비·룬", forge: "제작·강화", archive: "도감·업적", challenges: "개인 임무" };
    const body = tab === "forge" ? renderForgeTab(next, classId) : tab === "archive" ? renderArchiveTab(next) : tab === "challenges" ? renderChallengesTab(next, options.leaderboards || []) : renderGearTab(next, classId);
    const chrome = options.embedded
      ? ""
      : `<div class="meta-panel-head"><div><strong>원정대 보관소</strong><span>파밍 · 제작 · 수집 · 반복 임무</span></div><div><small>강화석 ${next.currencies.enhancementStones}</small><small>가루 ${next.currencies.reforgingDust}</small><small>정수 ${next.currencies.bossEssence}</small></div></div><div class="meta-tabs">${Object.entries(labels).map(([id, label]) => `<button type="button" class="${tab === id ? "active" : ""}" data-progression-action="tab" data-tab="${id}">${label}</button>`).join("")}</div>`;
    return `<section class="meta-progression-panel${options.embedded ? " embedded" : ""}" aria-label="장기 성장 콘텐츠">${chrome}<div class="meta-tab-body">${body}</div></section>`;
  }

  function getProgressionRenderKey(progress, classId, tab) {
    const next = normalizeProgress(progress);
    const loadout = next.equipment[classId] || emptyLoadout();
    return [tab, classId, next.inventory.items.map((item) => `${item.id}:${item.enhance}:${item.rerolls}:${item.lockedAffixIndex}`).join(","), next.inventory.runes.map((rune) => `${rune.id}:${rune.tier}`).join(","), JSON.stringify(next.inventory.bossMaterials), JSON.stringify(loadout), JSON.stringify(next.currencies), JSON.stringify(next.cosmetics), JSON.stringify(next.collections), JSON.stringify(next.combatByClass), Object.keys(next.achievements).length, next.challenges.daily.progress, next.challenges.weekly.progress, next.challenges.season.level].join("|");
  }

  function renderRunLootSummary(progress, resultKey) {
    const rewards = normalizeProgress(progress).lastRunRewards;
    if (!rewards || (resultKey && rewards.resultKey !== resultKey)) return "";
    const itemRows = (rewards.items || []).map((item) => `<span class="${item.rarity}"><b>${escapeHtml(rarityById(item.rarity).label)}</b>${escapeHtml(item.name)}${item.enhance ? ` +${item.enhance}` : ""}</span>`).join("");
    const runeRows = (rewards.runes || []).map((rune) => `<span><b>룬 T${rune.tier}</b>${escapeHtml(rune.name)}</span>`).join("");
    const challengeRows = (rewards.challengeRewards || []).map((reward) => `<span><b>임무 완료</b>${escapeHtml(reward.label)}</span>`).join("");
    const materialRows = (rewards.bossMaterials || []).map((bossId) => `<span><b>보스 재료</b>${escapeHtml(BOSS_RECIPES.find((recipe) => recipe.bossId === bossId)?.materialName || bossId)} +1</span>`).join("");
    return `<section class="result-loot-panel"><div><strong>파밍 보상</strong><small>강화석 +${rewards.enhancementStones || 0} · 가루 +${rewards.reforgingDust || 0} · 정수 +${rewards.bossEssence || 0}${rewards.eventMultiplier > 1 ? " · 이벤트 x2" : ""}</small></div><div class="result-loot-list">${itemRows}${runeRows}${materialRows}${challengeRows}</div></section>`;
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
    performProgressionAction,
    recordWorldDiscoveries,
    renderProgressionPanel,
    getProgressionRenderKey,
    renderRunLootSummary,
  };
  window.RogueSaveManager = manager;
  window.RogueProgressSave = manager;
})();
