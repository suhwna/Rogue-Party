import type { ParticlePresetName, ParticlePresetOptions, ParticleStats } from "./Particle";
import { ParticlePool } from "./ParticlePool";
import { PARTICLE_PRESETS } from "./ParticlePresets";

export type ParticleQuality = "low" | "medium" | "high";

export const DEFAULT_PARTICLE_BUDGETS: Record<ParticleQuality, number> = {
  low: 110,
  medium: 180,
  high: 280,
};

export class ParticleEngine {
  private pool: ParticlePool;
  private quality: ParticleQuality;

  constructor(quality: ParticleQuality = "high", budget = DEFAULT_PARTICLE_BUDGETS[quality]) {
    this.quality = quality;
    this.pool = new ParticlePool(budget);
  }

  setQuality(quality: ParticleQuality, budget = DEFAULT_PARTICLE_BUDGETS[quality]): void {
    this.quality = quality;
    this.pool.beginFrame(budget);
  }

  beginFrame(budget = DEFAULT_PARTICLE_BUDGETS[this.quality]): void {
    this.pool.beginFrame(budget);
  }

  reservePreset(name: ParticlePresetName, options: ParticlePresetOptions): number {
    const preset = PARTICLE_PRESETS[name];
    return this.pool.reserve(options.count ?? preset.count);
  }

  stats(): ParticleStats {
    return this.pool.stats();
  }
}
