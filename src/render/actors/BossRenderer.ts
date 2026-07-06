import { bossTextureInfo, type BossTextureInfo } from "../TextureKeys";
import { renderEnemy, renderEnemies, type EnemyRendererHost, type EnemyView, type EnemyVisualMaps } from "./EnemyRenderer";

export interface BossView extends EnemyView {
  type: "boss";
  bossPhase?: number;
  bossId?: string;
  bossPattern?: string;
}

export function isBossView(enemy: EnemyView): enemy is BossView {
  return enemy.type === "boss";
}

export function bossTextureFor(enemy: BossView, now: number): BossTextureInfo {
  return bossTextureInfo(enemy, now);
}

export function renderBoss(renderer: EnemyRendererHost, boss: BossView, now: number, visuals: EnemyVisualMaps = renderer.getVisuals()): void {
  renderEnemy(renderer, boss, now, visuals);
}

export function renderBosses(renderer: EnemyRendererHost, enemies: EnemyView[], now: number): void {
  renderEnemies(renderer, enemies.filter(isBossView), now);
}
