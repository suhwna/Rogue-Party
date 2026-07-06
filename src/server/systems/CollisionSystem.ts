export interface PointLike {
  readonly x: number;
  readonly y: number;
}

export interface MutablePointLike {
  x: number;
  y: number;
}

export interface WorldBoundsLike {
  readonly w: number;
  readonly h: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: PointLike, b: PointLike): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function distanceToSegment(point: PointLike, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy || 1;
  const t = clamp(((point.x - ax) * dx + (point.y - ay) * dy) / lengthSq, 0, 1);
  const x = ax + dx * t;
  const y = ay + dy * t;
  return Math.hypot(point.x - x, point.y - y);
}

export function circlesOverlap(a: PointLike, radiusA: number, b: PointLike, radiusB: number): boolean {
  return distance(a, b) <= radiusA + radiusB;
}

export function segmentIntersectsCircle(
  point: PointLike,
  radius: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  width = 0,
): boolean {
  return distanceToSegment(point, ax, ay, bx, by) <= radius + width;
}

export function normalizeVector(x: number, y: number): PointLike {
  const length = Math.hypot(x, y);
  if (!length) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

export function angleDifference(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

export function hashCollisionId(value: unknown): number {
  const text = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33 + text.charCodeAt(i)) % 9973;
  }
  return hash || 1;
}

export function fallbackSeparationVector(a: unknown, b: unknown): PointLike {
  const seed = (hashCollisionId(a) * 31 + hashCollisionId(b) * 17) % 628;
  const angle = seed / 100;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function moveEntityWithinWorld<T extends MutablePointLike>(
  entity: T,
  dx: number,
  dy: number,
  world: WorldBoundsLike,
  margin: number,
): T {
  entity.x = clamp(entity.x + dx, margin, world.w - margin);
  entity.y = clamp(entity.y + dy, margin, world.h - margin);
  return entity;
}
