import type { ParticleStats } from "./Particle";

export class ParticlePool {
  private used = 0;
  private skipped = 0;

  constructor(private budget: number) {}

  beginFrame(budget = this.budget): void {
    this.budget = Math.max(0, Math.round(budget));
    this.used = 0;
    this.skipped = 0;
  }

  reserve(count: number): number {
    const requested = Math.max(0, Math.round(count));
    const available = Math.max(0, this.budget - this.used);
    const allowed = Math.min(requested, available);
    this.used += allowed;
    this.skipped += requested - allowed;
    return allowed;
  }

  stats(): ParticleStats {
    const requested = this.used + this.skipped;
    return {
      used: this.used,
      retained: this.budget,
      skipped: this.skipped,
      budget: this.budget,
      pressure: this.budget > 0 ? Math.round((requested / this.budget) * 1000) / 1000 : 0,
    };
  }
}
