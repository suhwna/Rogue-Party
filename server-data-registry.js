const REWARD_EFFECTS = {
  power_core: [{ op: "mul", key: "damageMul", value: 1.1 }],
  iron_plate: [{ op: "capAdd", key: "armor", value: 2, max: 18 }],
  swift_boots: [{ op: "mul", key: "speedMul", value: 1.1 }],
  cooling_gear: [
    { op: "mul", key: "cooldownMul", value: 0.9 },
    { op: "mul", key: "skillCooldownMul", value: 0.9 }
  ],
  splitter_core: [{ op: "capAdd", key: "projectileCountBonus", value: 1, max: 1 }],
  giant_lens: [{ op: "mul", key: "areaMul", value: 1.1 }],
  sharp_eye: [{ op: "capAdd", key: "crit", value: 0.1, max: 0.85 }],
  fatal_mark: [{ op: "mul", key: "critDamageMul", value: 1.1 }],
  living_moss: [{ op: "add", key: "regen", value: 0.5 }],
  heartstone: [{ op: "maxHpAdd", value: 25 }],
  supply_heal: [{ op: "supplyHealRatio", value: 0.35 }],
  supply_shield: [
    { op: "supplyShieldRatio", value: 0.35, max: 90 },
    { op: "maxSet", key: "shieldTimer", value: 4 }
  ],
  supply_focus: [{ op: "skillTimerRefund", value: 4 }]
};

const RELIC_MAX_LEVEL_OVERRIDES = {
  splitter_core: 1
};

function getRelicMaxLevel(relic) {
  if (!relic) return 1;
  if (Number.isFinite(RELIC_MAX_LEVEL_OVERRIDES[relic.id])) return RELIC_MAX_LEVEL_OVERRIDES[relic.id];
  if (Number.isFinite(relic.maxLevel)) return Math.max(1, Math.floor(relic.maxLevel));
  if (relic.consumable) return 1;
  return 5;
}

function getRelicChoiceWeight() {
  return 1;
}

function getSkillChoiceWeight(upgrade, levelRequirement) {
  const levelLift = 1 + Math.max(0, levelRequirement - 2) * 0.055;
  const slotLift = upgrade?.slot ? 1.55 : 1;
  return Math.max(0.05, levelLift * slotLift);
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
  return {
    shouldDrop,
    killsSinceChest: shouldDrop ? 0 : killsSinceChest,
    pity,
    pityLimit,
    dropChance,
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
    chestBonus: round2(Math.min(0.04, getNumber(base.chestBonus, 0) + Math.max(0, chapter - 1) * 0.003))
  };
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
  REWARD_EFFECTS,
  getRelicMaxLevel,
  getRelicChoiceWeight,
  getSkillChoiceWeight,
  getStageChestLimit,
  getRelicChestDropDecision,
  getStageRewardPreview,
  applyRewardEffect
};
