import type { PixiRenderContext } from "../PixiRenderContext";
import { renderEnemies, type EnemyRendererHost, type EnemyView, type EnemyWorldBounds } from "./EnemyRenderer";
import { renderPlayers, type PlayerRendererHost, type PlayerView } from "./PlayerRenderer";

type ActorRendererHost = PixiRenderContext["renderer"] & EnemyRendererHost & PlayerRendererHost;

export function renderActorSections(context: PixiRenderContext): void {
  const { renderer, state, now } = context;
  const actorRenderer = renderer as ActorRendererHost;
  renderEnemies(actorRenderer, (state.enemies || []) as EnemyView[], now, state.room.world as EnemyWorldBounds | undefined);
  renderPlayers(actorRenderer, (state.players || []) as PlayerView[], now);
}
