export const TICK_RATE = 60;
export const STATE_RATE = 30;
export const MAX_PLAYERS = 4;

export const DEFAULT_DASH_COOLDOWN = 1.15;
export const DEFAULT_DASH_DISTANCE = 175;

export const WARRIOR_TAUNT_GUARD_DURATION = 4;
export const WARRIOR_TAUNT_DAMAGE_MUL = 0.72;
export const WARRIOR_TAUNT_SIZE_SCALE = 1.3;

export const RELIC_DROP_CHANCE = 0.008;
export const RELIC_CHOICE_TIMEOUT_MS = 10000;
export const ADVANCEMENT_CHOICE_TIMEOUT_MS = 15000;
export const MAP_VOTE_TIMEOUT_MS = 15000;

export const MAP_DEPTH = 8;
export const MAX_CHAPTERS = 3;
export const MAP_LANES = 3;
export const MAX_PLAYER_LEVEL = 15;
export const ADVANCEMENT_LEVELS = Array.from({ length: MAX_PLAYER_LEVEL - 1 }, (_, index) => index + 2);

export const MAX_WS_PAYLOAD_BYTES = 16 * 1024;
export const MAX_INPUT_SEQUENCE = 1_000_000;
export const SAFE_ID_PATTERN_SOURCE = "^[a-z0-9_-]{1,64}$";

export const MINIBOSS_MIN_DEPTH_BY_CHAPTER = {
  1: 6,
  2: 4,
  3: 3,
} as const;

export const XP_ASSIST_SHARE = 0.34;
export const PLAYER_POISON_TICK_INTERVAL = 1.15;
export const PLAYER_HIT_IFRAME_DURATION = 0.22;
export const PLAYER_HAZARD_IFRAME_DURATION = 0.15;
export const BASE_HEALTH_REGEN = 0.5;
export const STAGE_CLEAR_HEAL_RATIO = 0.15;
export const STAGE_CLEAR_REVIVE_RATIO = 0.35;
export const SHAMAN_TARGET_HEAL_LOCK_MS = 1400;
export const CHEST_PITY_KILLS = 105;

export const ELITE_BASE_CHANCE = 0.12;
export const ELITE_NODE_BONUS = 0.24;
export const ELITE_AFFIXES = ["frenzy", "bulwark", "venom", "volatile"] as const;

export const SPECIAL_PATTERN_CYCLE = 10;
export const SPECIAL_PATTERN_STEPS = [3, 7, 10] as const;
