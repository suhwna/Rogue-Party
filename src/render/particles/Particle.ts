export interface ParticleStats {
  used: number;
  retained: number;
  skipped: number;
  budget: number;
  pressure: number;
}

export interface ParticlePreset {
  count: number;
  radius: number;
  color: string;
}

export type ParticlePresetName =
  | "hitSpark"
  | "slashTrail"
  | "fireBurst"
  | "poisonBurst"
  | "frostBurst"
  | "healMist"
  | "smokePuff";

export interface ParticlePresetOptions {
  x: number;
  y: number;
  radius?: number;
  color?: string;
  alpha?: number;
  zIndex?: number;
  phase?: number;
  direction?: number;
  spread?: number;
  count?: number;
}
