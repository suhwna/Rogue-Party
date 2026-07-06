import {
  chooseRendererPreference,
  getQualityPreset,
  type QualityPreset,
  type RendererPreference,
  type RendererQuality,
} from "./RendererConfig";

export interface PixiGameRendererOptions {
  canvas: HTMLCanvasElement;
  quality?: RendererQuality;
  getState(): unknown;
  getSelfId(): string | null;
  getVisuals(): unknown;
  getFloatingEffects(): unknown[];
  getScreenShake(): number;
  getMouse(): { x: number; y: number };
  getCamera(): { x: number; y: number };
}

export interface PixiGameRendererDiagnostics {
  rendererPreference: RendererPreference;
  rendererType: "pending" | "webgpu" | "webgl" | string;
  quality: RendererQuality;
  fps: number;
  frameMs: number;
  sprites: { used: number; retained: number };
  texts: { used: number; retained: number };
  graphics: { used: number; retained: number };
  particles: { used: number; retained: number; skipped: number; budget: number; pressure?: number };
  textures: number;
  assetTextures: { external: number; fallback: number };
  effects: number;
  effectBudget: number;
  particleBudget: number;
}

export interface PixiGameRendererRuntimeState {
  rendererPreference: RendererPreference;
  quality: RendererQuality;
  qualityPreset: QualityPreset;
  diagnostics: PixiGameRendererDiagnostics;
}

export function normalizeRendererQuality(quality: unknown): RendererQuality {
  return quality === "low" || quality === "medium" || quality === "high" ? quality : "high";
}

export function createRendererDiagnostics(
  rendererPreference: RendererPreference,
  quality: RendererQuality,
  qualityPreset: QualityPreset,
): PixiGameRendererDiagnostics {
  return {
    rendererPreference,
    rendererType: "pending",
    quality,
    fps: 0,
    frameMs: 0,
    sprites: { used: 0, retained: 0 },
    texts: { used: 0, retained: 0 },
    graphics: { used: 0, retained: 0 },
    particles: { used: 0, retained: 0, skipped: 0, budget: qualityPreset.particleBudget, pressure: 0 },
    textures: 0,
    assetTextures: { external: 0, fallback: 0 },
    effects: 0,
    effectBudget: qualityPreset.effectBudget,
    particleBudget: qualityPreset.particleBudget,
  };
}

export function createRendererRuntimeState(qualityInput: unknown): PixiGameRendererRuntimeState {
  const quality = normalizeRendererQuality(qualityInput);
  const qualityPreset = getQualityPreset(quality);
  const rendererPreference = chooseRendererPreference();
  return {
    rendererPreference,
    quality,
    qualityPreset,
    diagnostics: createRendererDiagnostics(rendererPreference, quality, qualityPreset),
  };
}

export function setRendererQuality(state: PixiGameRendererRuntimeState, qualityInput: unknown): void {
  const quality = normalizeRendererQuality(qualityInput);
  const qualityPreset = getQualityPreset(quality);
  state.quality = quality;
  state.qualityPreset = qualityPreset;
  state.diagnostics.quality = quality;
  state.diagnostics.effectBudget = qualityPreset.effectBudget;
  state.diagnostics.particleBudget = qualityPreset.particleBudget;
}
