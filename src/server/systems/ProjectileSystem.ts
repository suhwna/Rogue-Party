export interface WorldBounds {
  readonly w: number;
  readonly h: number;
}

export interface ProjectileLike {
  x: number;
  y: number;
  vx: number;
  vy: number;
  distanceLeft: number;
  dead?: boolean;
}

export function advanceProjectile(projectile: ProjectileLike, dt: number): number {
  const step = Math.hypot(projectile.vx, projectile.vy) * dt;
  projectile.x += projectile.vx * dt;
  projectile.y += projectile.vy * dt;
  projectile.distanceLeft -= step;
  return step;
}

export function isProjectileExpired(projectile: ProjectileLike, world: WorldBounds): boolean {
  return (
    projectile.distanceLeft <= 0 ||
    projectile.x < 0 ||
    projectile.y < 0 ||
    projectile.x > world.w ||
    projectile.y > world.h
  );
}

export function expireProjectileIfNeeded(projectile: ProjectileLike, world: WorldBounds): boolean {
  if (!isProjectileExpired(projectile, world)) return false;
  projectile.dead = true;
  return true;
}

export function filterLiveProjectiles<T extends ProjectileLike>(projectiles: Iterable<T>): T[] {
  return [...projectiles].filter((projectile) => !projectile.dead);
}
