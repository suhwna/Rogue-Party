function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceToSegment(point, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - ax) * dx + (point.y - ay) * dy) / lengthSq, 0, 1);
  const x = ax + dx * t;
  const y = ay + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

function circlesOverlap(a, radiusA, b, radiusB) {
  return distance(a, b) <= radiusA + radiusB;
}

function segmentIntersectsCircle(point, radius, ax, ay, bx, by, width = 0) {
  return distanceToSegment(point, ax, ay, bx, by) <= radius + width;
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y);
  if (!length) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

function angleDifference(a, b) {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

function hashCollisionId(value) {
  const text = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33 + text.charCodeAt(i)) % 9973;
  }
  return hash || 1;
}

function fallbackSeparationVector(a, b) {
  const seed = (hashCollisionId(a) * 31 + hashCollisionId(b) * 17) % 628;
  const angle = seed / 100;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function moveEntityWithinWorld(entity, dx, dy, world, margin) {
  entity.x = clamp(entity.x + dx, margin, world.w - margin);
  entity.y = clamp(entity.y + dy, margin, world.h - margin);
  return entity;
}

module.exports = {
  angleDifference,
  circlesOverlap,
  distance,
  distanceToSegment,
  fallbackSeparationVector,
  hashCollisionId,
  moveEntityWithinWorld,
  normalizeVector,
  segmentIntersectsCircle
};
