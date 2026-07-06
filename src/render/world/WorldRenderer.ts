import type { PixiRenderContext } from "../PixiRenderContext";
import {
  renderDungeon,
  renderObjective,
  type DungeonObjective,
  type DungeonRendererHost,
  type DungeonRoom,
  type DungeonWorld,
} from "./DungeonRenderer";
import { renderHazards, type HazardRendererHost, type HazardView } from "./HazardRenderer";
import { renderPickups, type PickupRendererHost, type PickupSceneState } from "./PickupRenderer";
import { renderProjectiles, type ProjectileRendererHost, type ProjectileView } from "./ProjectileRenderer";

type WorldRendererHost = PixiRenderContext["renderer"] & DungeonRendererHost & HazardRendererHost & PickupRendererHost & ProjectileRendererHost;

export function renderWorldSections(context: PixiRenderContext): void {
  const { renderer, state, now } = context;
  const worldRenderer = renderer as WorldRendererHost;
  renderDungeon(worldRenderer, state.room.world as DungeonWorld | null | undefined, now, state.room as DungeonRoom);
  renderObjective(worldRenderer, state.room.objective as DungeonObjective | null | undefined, now);
  renderHazards(worldRenderer, (state.hazards || []) as HazardView[], now);
  renderPickups(worldRenderer, state as PickupSceneState, now);
  renderProjectiles(worldRenderer, (state.projectiles || []) as ProjectileView[]);
}
