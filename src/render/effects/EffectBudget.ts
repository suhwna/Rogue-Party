export function effectStartIndex(effectsLength: number, effectBudget: number): number {
  return Math.max(0, Math.max(0, effectsLength) - Math.max(0, effectBudget));
}

type EffectLike = {
  kind?: string;
  style?: string;
  value?: unknown;
  radius?: number;
  rangeRadius?: number;
};

const PRIMARY_EFFECT_KINDS = new Set(["slash", "spin", "dash", "warning", "meteor", "trap", "shot", "chain", "arcane", "freeze", "slow"]);

export function effectRetentionPriority(effect: EffectLike): number {
  const kind = String(effect?.kind || "");
  const style = String(effect?.style || "");
  if (kind === "damage" || kind === "heal" || kind === "xp" || (kind === "poison" && effect?.value)) return 0;
  if (kind === "impact") {
    return style === "critical_hit" || style === "heavy_hit" || style === "cleave_execute" ? 2 : 1;
  }
  const radius = Math.max(0, Number(effect?.rangeRadius || effect?.radius || 0));
  return (PRIMARY_EFFECT_KINDS.has(kind) ? 3 : 2) + (radius >= 140 ? 1 : 0);
}

export function selectEffectsForBudget<T extends EffectLike>(effects: T[], effectBudget: number): T[] {
  const budget = Math.max(0, Math.floor(Number(effectBudget || 0)));
  if (budget <= 0) return [];
  if (effects.length <= budget) return effects;
  return effects
    .map((effect, index) => ({ effect, index, priority: effectRetentionPriority(effect) }))
    .sort((a, b) => b.priority - a.priority || b.index - a.index)
    .slice(0, budget)
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.effect);
}
