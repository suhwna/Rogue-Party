function advanceProjectile(projectile, dt) {
  const step = Math.hypot(projectile.vx, projectile.vy) * dt;
  projectile.x += projectile.vx * dt;
  projectile.y += projectile.vy * dt;
  projectile.distanceLeft -= step;
  return step;
}

function isProjectileExpired(projectile, world) {
  return (
    projectile.distanceLeft <= 0 ||
    projectile.x < 0 ||
    projectile.y < 0 ||
    projectile.x > world.w ||
    projectile.y > world.h
  );
}

function expireProjectileIfNeeded(projectile, world) {
  if (!isProjectileExpired(projectile, world)) return false;
  projectile.dead = true;
  return true;
}

function filterLiveProjectiles(projectiles) {
  return (projectiles || []).filter((projectile) => !projectile.dead);
}

module.exports = {
  advanceProjectile,
  expireProjectileIfNeeded,
  filterLiveProjectiles,
  isProjectileExpired
};
