import type { PixiRenderContext, PixiSceneRendererHost, PixiSceneState } from "./PixiRenderContext";

export interface PixiCameraContext {
  viewW: number;
  viewH: number;
  camera: ReturnType<PixiSceneRendererHost["getCamera"]>;
  shake: number;
  shakeX: number;
  shakeY: number;
  floatingEffects: unknown[];
  hitIFrameTime: number;
}

export function createCameraContext(
  renderer: PixiSceneRendererHost,
  state: PixiSceneState,
  viewW: number,
  viewH: number,
): PixiCameraContext {
  const camera = renderer.getCamera();
  const shake = renderer.getScreenShake();
  const selfId = renderer.getSelfId();
  const self = state.players?.find((player) => player.id === selfId);
  return {
    viewW,
    viewH,
    camera,
    shake,
    shakeX: shake > 0 ? (Math.random() - 0.5) * shake : 0,
    shakeY: shake > 0 ? (Math.random() - 0.5) * shake : 0,
    floatingEffects: renderer.getFloatingEffects(),
    hitIFrameTime: Number(self?.hitIFrameTime || 0),
  };
}

export function applyCamera(context: PixiRenderContext): void {
  const { renderer } = context;
  renderer.clearLayers();
  renderer.world.position.set(
    context.viewW / 2 - context.camera.x + context.shakeX,
    context.viewH / 2 - context.camera.y + context.shakeY,
  );
}

export function resetCamera(renderer: PixiSceneRendererHost): void {
  renderer.clearLayers();
  renderer.world.position.set(0, 0);
}
