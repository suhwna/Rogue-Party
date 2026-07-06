const RARITY_META = {
  common: { label: "COMMON", score: 1, relicWeight: 54, skillWeight: 42, maxLevel: 3 },
  uncommon: { label: "UNCOMMON", score: 2, relicWeight: 28, skillWeight: 28, maxLevel: 2 },
  rare: { label: "RARE", score: 3, relicWeight: 13, skillWeight: 17, maxLevel: 2 },
  unique: { label: "UNIQUE", score: 4, relicWeight: 4.8, skillWeight: 7.2, maxLevel: 1 },
  legendary: { label: "LEGENDARY", score: 5, relicWeight: 1.1, skillWeight: 2.2, maxLevel: 1 },
  mythic: { label: "MYTHIC", score: 6, relicWeight: 0.24, skillWeight: 0.62, maxLevel: 1 }
};

const LEGACY_RARITY_ALIASES = { epic: "unique" };

const REWARD_EFFECTS = {
  keen_blade: [{ op: "mul", key: "damageMul", value: 1.18 }],
  ember_core: [
    { op: "mul", key: "areaMul", value: 1.08 },
    { op: "add", key: "splashBonus", value: 36 }
  ],
  swift_boots: [{ op: "mul", key: "speedMul", value: 1.16 }],
  wolf_clock: [{ op: "mul", key: "cooldownMul", value: 0.86 }],
  iron_oath: [
    { op: "maxHpAdd", value: 35 },
    { op: "capAdd", key: "armor", value: 0.08, max: 0.55 }
  ],
  glass_star: [{ op: "capAdd", key: "crit", value: 0.12, max: 0.65 }],
  vampire_charm: [{ op: "capAdd", key: "lifeSteal", value: 0.06, max: 0.2 }],
  longshot_lens: [{ op: "mul", key: "rangeMul", value: 1.22 }],
  living_moss: [{ op: "add", key: "regen", value: 1.4 }],
  comet_signet: [{ op: "mul", key: "skillCooldownMul", value: 0.8 }],
  giants_pulse: [{ op: "mul", key: "areaMul", value: 1.24 }],
  party_banner: [{ op: "add", key: "clearHealBonus", value: 0.15 }],
  vanguard_plate: [
    { op: "maxHpAdd", value: 45 },
    { op: "capAdd", key: "armor", value: 0.1, max: 0.55 }
  ],
  hawk_fletching: [
    { op: "mul", key: "damageMul", value: 1.12 },
    { op: "capAdd", key: "crit", value: 0.08, max: 0.65 }
  ],
  arcane_orbit: [
    { op: "add", key: "splashBonus", value: 48 },
    { op: "mul", key: "skillCooldownMul", value: 0.92 }
  ],
  heartstone: [
    { op: "maxHpAdd", value: 55 },
    { op: "add", key: "regen", value: 0.8 }
  ],
  execution_mark: [
    { op: "capAdd", key: "crit", value: 0.08, max: 0.65 },
    { op: "mul", key: "damageMul", value: 1.08 }
  ],
  sanctuary_bell: [
    { op: "maxHpAdd", value: 28 },
    { op: "mul", key: "skillCooldownMul", value: 0.9 }
  ],
  berserker_sigil: [
    { op: "add", key: "lowHpCritBonus", value: 0.18 },
    { op: "add", key: "missingHpDamageBonus", value: 0.2 }
  ],
  phase_boots: [
    { op: "mul", key: "dashCooldownMul", value: 0.82 },
    { op: "mul", key: "dashDistanceMul", value: 1.1 }
  ],
  reaper_coin: [{ op: "add", key: "onKillHeal", value: 0.03 }],
  clockwork_core: [{ op: "add", key: "onKillCooldownRefund", value: 0.32 }],
  hunter_contract: [
    { op: "mul", key: "eliteDamageMul", value: 1.22 },
    { op: "add", key: "chestDropBonus", value: 0.02 }
  ],
  thornmail_fragment: [
    { op: "capAdd", key: "armor", value: 0.04, max: 0.55 },
    { op: "add", key: "thornsMul", value: 0.22 }
  ],
  storm_capacitor: [{ op: "mul", key: "statusDamageMul", value: 1.13 }],
  glass_engine: [
    { op: "maxHpLossRatio", value: 0.14 },
    { op: "mul", key: "damageMul", value: 1.28 },
    { op: "capAdd", key: "crit", value: 0.06, max: 0.65 }
  ],
  blood_pact: [
    { op: "maxHpLossFlat", value: 12 },
    { op: "capAdd", key: "lifeSteal", value: 0.08, max: 0.2 },
    { op: "mul", key: "damageMul", value: 1.08 }
  ],
  pity_engine: [{ op: "add", key: "chestDropBonus", value: 0.04 }],
  bulwark_seal: [
    { op: "mul", key: "dashDamageMul", value: 1.36 },
    { op: "mul", key: "dashCooldownMul", value: 0.92 },
    { op: "capAdd", key: "armor", value: 0.06, max: 0.55 }
  ],
  duelist_wrap: [
    { op: "mul", key: "cooldownMul", value: 0.88 },
    { op: "capAdd", key: "crit", value: 0.06, max: 0.65 }
  ],
  windrunner_quiver: [
    { op: "mul", key: "dashCooldownMul", value: 0.78 },
    { op: "mul", key: "speedMul", value: 1.06 },
    { op: "mul", key: "rangeMul", value: 1.08 }
  ],
  eagle_crest: [
    { op: "mul", key: "eliteDamageMul", value: 1.18 },
    { op: "capAdd", key: "crit", value: 0.07, max: 0.65 }
  ],
  astral_prism: [
    { op: "mul", key: "statusDamageMul", value: 1.18 },
    { op: "add", key: "splashBonus", value: 34 }
  ],
  frozen_hourglass: [
    { op: "mul", key: "skillCooldownMul", value: 0.88 },
    { op: "mul", key: "statusDamageMul", value: 1.1 }
  ],
  mercy_censer: [
    { op: "add", key: "onKillTeamHeal", value: 0.025 },
    { op: "mul", key: "healingMul", value: 1.12 }
  ],
  aegis_lantern: [
    { op: "mul", key: "shieldMul", value: 1.18 },
    { op: "mul", key: "healingMul", value: 1.08 },
    { op: "mul", key: "skillCooldownMul", value: 0.95 }
  ],
  kinetic_spurs: [
    { op: "mul", key: "dashDistanceMul", value: 1.12 },
    { op: "mul", key: "dashCooldownMul", value: 0.9 }
  ],
  tempered_core: [
    { op: "maxHpAdd", value: 42 },
    { op: "capAdd", key: "armor", value: 0.05, max: 0.6 }
  ],
  overclock_rune: [{ op: "add", key: "onKillCooldownRefund", value: 0.55 }],
  predator_scope: [
    { op: "capAdd", key: "crit", value: 0.1, max: 0.72 },
    { op: "mul", key: "eliteDamageMul", value: 1.14 }
  ],
  titan_grip: [
    { op: "mul", key: "areaMul", value: 1.18 },
    { op: "mul", key: "dashDamageMul", value: 1.18 },
    { op: "capAdd", key: "armor", value: 0.05, max: 0.6 }
  ],
  thunder_fletching: [
    { op: "add", key: "projectileChainBonus", value: 1 },
    { op: "mul", key: "rangeMul", value: 1.1 },
    { op: "capAdd", key: "crit", value: 0.06, max: 0.72 }
  ],
  molten_orbit: [
    { op: "add", key: "splashBonus", value: 56 },
    { op: "mul", key: "statusDamageMul", value: 1.18 },
    { op: "mul", key: "skillCooldownMul", value: 0.92 }
  ],
  aegis_protocol: [
    { op: "capAdd", key: "armor", value: 0.07, max: 0.6 },
    { op: "add", key: "thornsMul", value: 0.32 },
    { op: "mul", key: "shieldMul", value: 1.18 }
  ],
  crown_of_ruin: [
    { op: "maxHpLossRatio", value: 0.18 },
    { op: "mul", key: "damageMul", value: 1.38 },
    { op: "mul", key: "skillCooldownMul", value: 0.9 }
  ],
  phoenix_heart: [
    { op: "add", key: "deathSaveCharges", value: 1 },
    { op: "maxSet", key: "deathSaveHealRatio", value: 0.45 }
  ],
  worldsplitter_relic: [
    { op: "mul", key: "areaMul", value: 1.28 },
    { op: "mul", key: "dashDamageMul", value: 1.22 },
    { op: "mul", key: "dashDistanceMul", value: 1.12 },
    { op: "capAdd", key: "armor", value: 0.06, max: 0.62 }
  ],
  plague_bloom: [
    { op: "mul", key: "statusDamageMul", value: 1.34 },
    { op: "add", key: "projectileChainBonus", value: 1 },
    { op: "add", key: "chestDropBonus", value: 0.02 }
  ],
  singularity_crown: [
    { op: "add", key: "splashBonus", value: 80 },
    { op: "mul", key: "skillCooldownMul", value: 0.82 },
    { op: "mul", key: "statusDamageMul", value: 1.22 }
  ],
  iron_knuckle: [
    { op: "mul", key: "cooldownMul", value: 0.9 },
    { op: "mul", key: "areaMul", value: 1.08 }
  ],
  dragon_sash: [
    { op: "mul", key: "damageMul", value: 1.12 },
    { op: "mul", key: "dashDamageMul", value: 1.14 },
    { op: "mul", key: "shieldMul", value: 1.1 }
  ],
  catalyst_belt: [
    { op: "mul", key: "areaMul", value: 1.1 },
    { op: "mul", key: "statusDamageMul", value: 1.1 }
  ],
  volatile_codex: [
    { op: "add", key: "splashBonus", value: 34 },
    { op: "mul", key: "skillCooldownMul", value: 0.9 },
    { op: "mul", key: "damageMul", value: 1.06 }
  ],
  shadow_signet: [
    { op: "capAdd", key: "crit", value: 0.09, max: 0.72 },
    { op: "mul", key: "dashCooldownMul", value: 0.9 }
  ],
  night_dagger: [
    { op: "mul", key: "eliteDamageMul", value: 1.2 },
    { op: "mul", key: "damageMul", value: 1.1 },
    { op: "maxHpLossRatio", value: 0.08 }
  ],
  supply_heal: [{ op: "supplyHealRatio", value: 0.35 }],
  supply_shield: [
    { op: "supplyShieldRatio", value: 0.35, max: 90 },
    { op: "maxSet", key: "shieldTimer", value: 4 }
  ],
  supply_focus: [{ op: "skillTimerRefund", value: 4 }]
};

function normalizeRarity(rarity) {
  return LEGACY_RARITY_ALIASES[rarity] || (RARITY_META[rarity] ? rarity : "common");
}

function getRarityMeta(rarity) {
  return RARITY_META[normalizeRarity(rarity)] || RARITY_META.common;
}

function getRarityLabel(rarity) {
  return getRarityMeta(rarity).label;
}

function getRelicMaxLevel(relic) {
  if (!relic) return RARITY_META.common.maxLevel;
  if (Number.isFinite(relic.maxLevel)) return Math.max(1, Math.floor(relic.maxLevel));
  if (relic.consumable) return 1;
  return getRarityMeta(relic.rarity).maxLevel;
}

function getRoomProgressionBonus(room, mapDepth) {
  const depth = room?.activeMapNode?.depth || ((Math.max(1, room?.wave || 1) - 1) % mapDepth) + 1;
  const chapter = Math.max(1, room?.floor || 1);
  return 1 + Math.max(0, depth - 1) * 0.055 + Math.max(0, chapter - 1) * 0.12;
}

function getRelicChoiceWeight(room, relic, boost = 0, options = {}) {
  const meta = getRarityMeta(relic?.rarity);
  const progressionBonus = getRoomProgressionBonus(room, options.mapDepth || 8);
  const rarityLift = 1 + boost * (0.75 + meta.score * 0.45);
  const lateLift = meta.score >= 5 ? progressionBonus * 1.35 : meta.score >= 4 ? progressionBonus * 1.12 : 1;
  return Math.max(0.05, meta.relicWeight * rarityLift * lateLift);
}

function getSkillUpgradeRarity(upgrade, overrides = {}) {
  if (!upgrade) return "common";
  return normalizeRarity(upgrade.rarity || overrides[upgrade.id] || (upgrade.requires ? "rare" : "common"));
}

function getSkillChoiceWeight(upgrade, levelRequirement, overrides = {}) {
  const meta = getRarityMeta(getSkillUpgradeRarity(upgrade, overrides));
  const levelLift = 1 + Math.max(0, levelRequirement - 2) * 0.055;
  const highTierLift = meta.score >= 5 ? levelLift * 1.35 : meta.score >= 4 ? levelLift * 1.12 : 1;
  const slotLift = upgrade?.slot ? 1.55 : 1;
  return Math.max(0.05, meta.skillWeight * highTierLift * slotLift);
}

function getStageChestLimit(stageKind) {
  if (stageKind === "reward") return 3;
  if (stageKind === "boss") return 3;
  if (stageKind === "miniboss" || stageKind === "elite") return 2;
  return 1;
}

function getRelicChestDropDecision(input) {
  const partyChestMul = getNumber(input.partyChestMul, 1);
  const relicBonus = Math.min(0.018, Math.max(0, getNumber(input.ownerChestDropBonus, 0)));
  const killsSinceChest = getNumber(input.killsSinceChest, 0) + 1;
  const pityLimit = Math.max(30, Math.round(getNumber(input.chestPityKills, 105) / partyChestMul));
  const pity = killsSinceChest >= pityLimit;
  const waveBonus = Math.min(0.009, getNumber(input.wave, 1) * 0.00055);
  const eliteBonus = input.enemyElite ? 0.024 : 0;
  const bossBonus = input.enemyType === "boss" ? 1 : 0;
  const dropChance =
    (getNumber(input.relicDropChance, 0) + waveBonus + eliteBonus + relicBonus + getNumber(input.stageChestBonus, 0)) *
    partyChestMul;
  const shouldDrop = Boolean(bossBonus || pity || getNumber(input.roll, 1) <= dropChance);
  const rarityBoost =
    (input.enemyType === "boss" ? 0.42 : input.enemyElite ? 0.23 : input.enemyType === "brute" || input.enemyType === "guardian" ? 0.12 : 0) +
    getNumber(input.stageRarityBoost, 0) +
    Math.min(0.12, relicBonus * 1.5);
  return {
    shouldDrop,
    killsSinceChest: shouldDrop ? 0 : killsSinceChest,
    pity,
    pityLimit,
    dropChance,
    rarityBoost,
    relicBonus
  };
}

function getStageRewardPreview(baseReward, floor = 1, depth = 1) {
  const base = baseReward || {};
  const chapter = Math.max(1, floor || 1);
  const stageDepth = Math.max(1, depth || 1);
  return {
    label: base.label,
    clearXp: Math.round((getNumber(base.clearXp, 0) + stageDepth * 4 + Math.max(0, chapter - 1) * 12) * getNumber(base.xpMul, 1)),
    clearChest: base.clearChest || 0,
    chestBonus: round2(Math.min(0.04, getNumber(base.chestBonus, 0) + Math.max(0, chapter - 1) * 0.003)),
    rarityBoost: round2(
      Math.min(0.62, getNumber(base.rarityBoost, 0) + Math.max(0, stageDepth - 1) * 0.012 + Math.max(0, chapter - 1) * 0.045)
    )
  };
}

function getAutoRelicChoiceBoost(chests) {
  const liveChests = Array.isArray(chests) ? chests : [];
  if (liveChests.length === 0) return 0;
  const bestBoost = Math.max(...liveChests.map((chest) => getNumber(chest?.rarityBoost, 0)));
  return Math.min(0.65, bestBoost + Math.max(0, liveChests.length - 1) * 0.08);
}

function getRelicChoiceBoost(activeRisk, bonusBoost = 0) {
  return getNumber(activeRisk?.rarityBoost, 0) + getNumber(bonusBoost, 0);
}

function applyRewardEffect(player, reward, options = {}) {
  const effects = REWARD_EFFECTS[reward?.id];
  if (!effects) return false;
  for (const effect of effects) {
    applyEffectOperation(player, effect, options);
  }
  return true;
}

function applyEffectOperation(player, effect, options) {
  if (!player || !effect) return;
  const key = effect.key;
  if (effect.op === "add") {
    player[key] = getNumber(player[key], 0) + effect.value;
  } else if (effect.op === "mul") {
    player[key] = getNumber(player[key], 1) * effect.value;
  } else if (effect.op === "capAdd") {
    player[key] = Math.min(effect.max, getNumber(player[key], 0) + effect.value);
  } else if (effect.op === "maxSet") {
    player[key] = Math.max(getNumber(player[key], 0), effect.value);
  } else if (effect.op === "maxHpAdd") {
    player.maxHp = getNumber(player.maxHp, 1) + effect.value;
    player.hp = getNumber(player.hp, player.maxHp) + effect.value;
  } else if (effect.op === "maxHpLossFlat") {
    player.maxHp = Math.max(1, getNumber(player.maxHp, 1) - effect.value);
    player.hp = Math.min(getNumber(player.hp, player.maxHp), player.maxHp);
  } else if (effect.op === "maxHpLossRatio") {
    const loss = Math.max(1, Math.floor(getNumber(player.maxHp, 1) * effect.value));
    player.maxHp = Math.max(1, getNumber(player.maxHp, 1) - loss);
    player.hp = Math.min(getNumber(player.hp, player.maxHp), player.maxHp);
  } else if (effect.op === "supplyHealRatio") {
    const maxHp = getNumber(player.maxHp, 1);
    player.hp = Math.min(maxHp, getNumber(player.hp, maxHp) + maxHp * effect.value);
  } else if (effect.op === "supplyShieldRatio") {
    const maxHp = getNumber(player.maxHp, 1);
    player.shield = Math.max(getNumber(player.shield, 0), Math.min(effect.max, maxHp * effect.value));
  } else if (effect.op === "skillTimerRefund") {
    const slots = options.skillSlots || ["q", "e", "r", "f"];
    for (const slot of slots) {
      player.skillTimers[slot] = Math.max(0, getNumber(player.skillTimers[slot], 0) - effect.value);
    }
  }
}

function getNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = {
  RARITY_META,
  LEGACY_RARITY_ALIASES,
  REWARD_EFFECTS,
  normalizeRarity,
  getRarityMeta,
  getRarityLabel,
  getRelicMaxLevel,
  getRelicChoiceWeight,
  getSkillUpgradeRarity,
  getSkillChoiceWeight,
  getStageChestLimit,
  getRelicChestDropDecision,
  getStageRewardPreview,
  getAutoRelicChoiceBoost,
  getRelicChoiceBoost,
  applyRewardEffect
};
