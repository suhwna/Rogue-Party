export type ActionId = "attack" | "dash" | "skillQ" | "skillE" | "skillR" | "skillF";

export type ActionMap = Record<ActionId, string>;

export const defaultActionMap: Readonly<ActionMap> = Object.freeze({
  attack: "MouseLeft",
  dash: "Space",
  skillQ: "KeyQ",
  skillE: "KeyE",
  skillR: "KeyR",
  skillF: "KeyF",
});

export function normalizeActionMap(value: unknown): ActionMap {
  const input = value && typeof value === "object" ? (value as Partial<ActionMap>) : {};
  return {
    attack: normalizeCode(input.attack, defaultActionMap.attack),
    dash: normalizeCode(input.dash, defaultActionMap.dash),
    skillQ: normalizeCode(input.skillQ, defaultActionMap.skillQ),
    skillE: normalizeCode(input.skillE, defaultActionMap.skillE),
    skillR: normalizeCode(input.skillR, defaultActionMap.skillR),
    skillF: normalizeCode(input.skillF, defaultActionMap.skillF),
  };
}

export function matchesActionKey(
  code: string,
  keyMap: Partial<ActionMap> | undefined,
  action: ActionId,
  fallbacks: readonly string[] = [],
): boolean {
  const normalized = normalizeActionMap(keyMap);
  return [normalized[action], ...fallbacks].filter(Boolean).includes(code);
}

function normalizeCode(value: unknown, fallback: string): string {
  const code = String(value || fallback || "").slice(0, 24);
  return code || fallback;
}
