export interface PickupView {
  id?: string | number;
  x: number;
  y: number;
  radius?: number;
}

export interface PickupSceneState {
  xpOrbs?: PickupView[];
  relicChests?: PickupView[];
}

export interface PickupSpriteLike {
  zIndex: number;
}

export interface PickupRendererHost {
  layers: {
    pickup: unknown;
  };
  sprite(
    key: string,
    parent: unknown,
    x: number,
    y: number,
    scaleX: number,
    scaleY: number,
    tint: string,
    alpha: number,
  ): PickupSpriteLike;
  ring(x: number, y: number, radius: number, color: string, alpha: number, thickness: number): void;
}

export function xpOrbBob(orb: PickupView, now: number): number {
  return Math.sin(now / 180 + Number(orb.id || 0)) * 3;
}

export function xpOrbScale(orb: PickupView): number {
  return Math.max(0.45, (orb.radius || 10) / 16);
}

export function relicChestScale(chest: PickupView): number {
  return Math.max(0.8, (chest.radius || 18) / 20);
}

export function renderXpOrb(renderer: PickupRendererHost, orb: PickupView, now: number): void {
  const bob = xpOrbBob(orb, now);
  const scale = xpOrbScale(orb);
  renderer.sprite("xp", renderer.layers.pickup, orb.x, orb.y + bob, scale, scale, "#7e9fb2", 0.94).zIndex = orb.y;
}

export function renderRelicChest(renderer: PickupRendererHost, chest: PickupView, now: number): void {
  const scale = relicChestScale(chest);
  renderer.sprite("chest", renderer.layers.pickup, chest.x, chest.y + Math.sin(now / 220) * 2, scale, scale, "#facc15", 1).zIndex = chest.y;
  renderer.ring(chest.x, chest.y, (chest.radius || 22) * 1.7, "#facc15", 0.18 + Math.sin(now / 180) * 0.05, 2);
}

export function renderPickups(renderer: PickupRendererHost, state: PickupSceneState, now: number): void {
  for (const orb of state.xpOrbs || []) {
    renderXpOrb(renderer, orb, now);
  }
  for (const chest of state.relicChests || []) {
    renderRelicChest(renderer, chest, now);
  }
}
