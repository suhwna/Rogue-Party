import { renderActorSections } from "./actors/ActorRenderer";
import { applyCamera } from "./CameraRenderer";
import { renderEffectSections } from "./effects/EffectRenderer";
import { createGameSceneContext, type PixiSceneRendererHost, type PixiSceneState } from "./PixiRenderContext";
import { renderWorldSections } from "./world/WorldRenderer";

export const SCENE_SECTION_ORDER = [
  "dungeon",
  "objective",
  "hazards",
  "pickups",
  "projectiles",
  "enemies",
  "players",
  "floatingEffects",
  "aim",
  "screenOverlays",
] as const;

export function renderUiSections(context: ReturnType<typeof createGameSceneContext>): void {
  context.renderer.renderAim(context.state, context.now);
  context.renderer.renderScreenOverlays(context.viewW, context.viewH, context.hitIFrameTime);
}

export function renderGameScene(
  renderer: PixiSceneRendererHost,
  state: PixiSceneState,
  now: number,
  dt: number,
  viewW: number,
  viewH: number,
): ReturnType<typeof createGameSceneContext> {
  const context = createGameSceneContext(renderer, state, now, dt, viewW, viewH);
  applyCamera(context);
  renderWorldSections(context);
  renderActorSections(context);
  renderEffectSections(context);
  renderUiSections(context);
  return context;
}
