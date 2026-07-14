const SLOT_COOLDOWN_MUL = {
  q: 1,
  e: 0.78,
  r: 1.12,
  f: 1.24
};
const ENGINEER_MECHA_COOLDOWN_MUL = 2;
const MAX_SKILL_HASTE = 500;

function getSkillHaste(player) {
  return Math.max(0, Math.min(MAX_SKILL_HASTE, Number(player?.skillHaste) || 0));
}

function getSkillCooldownMultiplier(player) {
  return 100 / (100 + getSkillHaste(player));
}

function hasSkillUpgrade(player, upgradeId) {
  return (player.skillUpgrades || []).includes(upgradeId);
}

function getUnlockedSlotUpgrade(player, slot, skillUpgrades) {
  return (skillUpgrades[player.classId] || []).find(
    (upgrade) => upgrade.slot === slot && hasSkillUpgrade(player, upgrade.id)
  );
}

function canUseSkillSlot(player, slot, skillUpgrades) {
  if (slot === "q") return true;
  return Boolean(getUnlockedSlotUpgrade(player, slot, skillUpgrades));
}

function canTriggerSkillSlot(player, slot, skillUpgrades) {
  return (player.skillTimers?.[slot] || 0) <= 0 && canUseSkillSlot(player, slot, skillUpgrades);
}

function getSkillCooldown(player, slot, classes) {
  const def = classes[player.classId];
  const slotMul = SLOT_COOLDOWN_MUL[slot] || 1;
  const classSlotMul = player.classId === "engineer" && slot === "e" ? ENGINEER_MECHA_COOLDOWN_MUL : 1;
  return def.skillCd * slotMul * classSlotMul * getSkillCooldownMultiplier(player);
}

function applySkillCooldown(player, slot, classes) {
  const cooldown = getSkillCooldown(player, slot, classes);
  player.skillTimers[slot] = cooldown;
  return cooldown;
}

module.exports = {
  applySkillCooldown,
  canTriggerSkillSlot,
  canUseSkillSlot,
  getSkillCooldown,
  getSkillCooldownMultiplier,
  getSkillHaste,
  getUnlockedSlotUpgrade,
  hasSkillUpgrade,
  MAX_SKILL_HASTE
};
