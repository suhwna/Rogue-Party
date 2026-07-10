export interface PositionSetter {
  set(x: number, y: number): void;
}

export interface PixiCamera {
  x: number;
  y: number;
}

export interface PixiScenePlayer {
  id?: string;
  hitIFrameTime?: number;
}

export interface PixiSceneRoom {
  world?: unknown;
  objective?: unknown;
}

export interface PixiSceneState {
  room: PixiSceneRoom;
  players?: PixiScenePlayer[];
  enemies?: unknown[];
  hazards?: unknown[];
  projectiles?: unknown[];
}

export interface PixiSceneRendererHost {
  world: { position: PositionSetter };
  clearLayers(): void;
  getCamera(): PixiCamera;
  getScreenShake(): number;
  getSelfId(): string | null;
  getFloatingEffects(): unknown[];
  renderDungeon(world: unknown, now: number, room: PixiSceneRoom): void;
  renderObjective(objective: unknown, now: number): void;
  renderHazards(hazards: unknown[], now: number): void;
  renderPickups(state: PixiSceneState, now: number): void;
  renderProjectiles(projectiles: unknown[], now: number): void;
  renderEnemies(enemies: unknown[], now: number, world?: unknown): void;
  renderPlayers(players: PixiScenePlayer[], now: number): void;
  renderFloatingEffects(effects: unknown[], now: number): void;
  renderAim(state: PixiSceneState, now: number): void;
  renderScreenOverlays(viewW: number, viewH: number, hitIFrameTime: number): void;
}

export interface PixiRenderContext {
  renderer: PixiSceneRendererHost;
  state: PixiSceneState;
  now: number;
  dt: number;
  viewW: number;
  viewH: number;
  camera: PixiCamera;
  shake: number;
  shakeX: number;
  shakeY: number;
  floatingEffects: unknown[];
  hitIFrameTime: number;
}

export function createGameSceneContext(
  renderer: PixiSceneRendererHost,
  state: PixiSceneState,
  now: number,
  dt: number,
  viewW: number,
  viewH: number,
): PixiRenderContext {
  const camera = renderer.getCamera();
  const shake = renderer.getScreenShake();
  const selfId = renderer.getSelfId();
  const self = state.players?.find((player) => player.id === selfId);
  return {
    renderer,
    state,
    now,
    dt,
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
