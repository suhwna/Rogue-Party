export function effectStartIndex(effectsLength: number, effectBudget: number): number {
  return Math.max(0, Math.max(0, effectsLength) - Math.max(0, effectBudget));
}
