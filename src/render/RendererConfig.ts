export type RendererQuality = "low" | "medium" | "high";
export type RendererPreference = "webgpu" | "webgl";

export interface PoolRetainConfig {
  sprite: number;
  text: number;
  graphics: number;
}

export interface QualityPreset {
  effectBudget: number;
  particleBudget: number;
  resolutionCap: number;
  retain: PoolRetainConfig;
}

export const EFFECT_DRAW_BUDGET = 360;
export const POOL_TRIM_INTERVAL_MS = 10_000;
export const POOL_RETAIN: PoolRetainConfig = {
  sprite: 1800,
  text: 260,
  graphics: 1200,
};

export const QUALITY_PRESETS: Record<RendererQuality, QualityPreset> = {
  low: {
    effectBudget: 180,
    particleBudget: 110,
    resolutionCap: 1.25,
    retain: { sprite: 1000, text: 140, graphics: 640 },
  },
  medium: {
    effectBudget: 260,
    particleBudget: 180,
    resolutionCap: 1.75,
    retain: { sprite: 1400, text: 200, graphics: 900 },
  },
  high: {
    effectBudget: EFFECT_DRAW_BUDGET,
    particleBudget: 280,
    resolutionCap: 2.5,
    retain: POOL_RETAIN,
  },
};

export function chooseRendererPreference(): RendererPreference {
  return typeof navigator !== "undefined" && "gpu" in navigator ? "webgpu" : "webgl";
}

export function getQualityPreset(quality: unknown): QualityPreset {
  return QUALITY_PRESETS[quality as RendererQuality] ?? QUALITY_PRESETS.high;
}
