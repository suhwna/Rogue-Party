import type { ParticlePreset, ParticlePresetName } from "./Particle";

export const PARTICLE_PRESETS: Record<ParticlePresetName, ParticlePreset> = {
  hitSpark: { count: 10, radius: 42, color: "#f8f3e9" },
  slashTrail: { count: 8, radius: 54, color: "#fde68a" },
  fireBurst: { count: 12, radius: 62, color: "#f97316" },
  poisonBurst: { count: 10, radius: 58, color: "#bef264" },
  frostBurst: { count: 10, radius: 58, color: "#dbeafe" },
  healMist: { count: 9, radius: 52, color: "#bbf7d0" },
  smokePuff: { count: 8, radius: 58, color: "#8a6f9e" },
};
