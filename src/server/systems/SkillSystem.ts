export const SLOT_COOLDOWN_MUL: Readonly<Record<string, number>> = {
  q: 1,
  e: 0.78,
  r: 1.12,
  f: 1.24,
};
const ENGINEER_MECHA_COOLDOWN_MUL = 2;

export interface PlayerSkillLike {
  readonly classId: string;
  readonly skillCooldownMul: number;
  readonly skillUpgrades?: readonly string[];
  readonly skillTimers?: Record<string, number>;
}

export interface SkillUpgradeLike {
  readonly id: string;
  readonly slot: string;
}

export interface ClassCooldownLike {
  readonly skillCd: number;
}

export function hasSkillUpgrade(player: PlayerSkillLike, upgradeId: string): boolean {
  return (player.skillUpgrades || []).includes(upgradeId);
}

export function getUnlockedSlotUpgrade<T extends SkillUpgradeLike>(
  player: PlayerSkillLike,
  slot: string,
  skillUpgrades: Record<string, readonly T[]>,
): T | undefined {
  return (skillUpgrades[player.classId] || []).find(
    (upgrade) => upgrade.slot === slot && hasSkillUpgrade(player, upgrade.id),
  );
}

export function canUseSkillSlot(
  player: PlayerSkillLike,
  slot: string,
  skillUpgrades: Record<string, readonly SkillUpgradeLike[]>,
): boolean {
  if (slot === "q") return true;
  return Boolean(getUnlockedSlotUpgrade(player, slot, skillUpgrades));
}

export function canTriggerSkillSlot(
  player: PlayerSkillLike,
  slot: string,
  skillUpgrades: Record<string, readonly SkillUpgradeLike[]>,
): boolean {
  return (player.skillTimers?.[slot] ?? 0) <= 0 && canUseSkillSlot(player, slot, skillUpgrades);
}

export function getSkillCooldown(
  player: PlayerSkillLike,
  slot: string,
  classes: Record<string, ClassCooldownLike>,
): number {
  const def = classes[player.classId];
  if (!def) return 0;
  const slotMul = SLOT_COOLDOWN_MUL[slot] || 1;
  const classSlotMul = player.classId === "engineer" && slot === "e" ? ENGINEER_MECHA_COOLDOWN_MUL : 1;
  return def.skillCd * slotMul * classSlotMul * player.skillCooldownMul;
}

export interface PlayerSkillTimerLike extends PlayerSkillLike {
  readonly skillTimers: Record<string, number>;
}

export function applySkillCooldown(
  player: PlayerSkillTimerLike,
  slot: string,
  classes: Record<string, ClassCooldownLike>,
): number {
  const cooldown = getSkillCooldown(player, slot, classes);
  player.skillTimers[slot] = cooldown;
  return cooldown;
}
