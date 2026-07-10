export interface Point2D {
  x: number;
  y: number;
}

export interface LineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ConeShape {
  points: Point2D[];
  left: LineSegment;
  right: LineSegment;
}

export interface CapsuleSegments {
  center: LineSegment;
  sideA: LineSegment;
  sideB: LineSegment;
  cap: { x: number; y: number; radius: number };
}

export interface LightningPath {
  points: Point2D[];
  ux: number;
  uy: number;
  px: number;
  py: number;
  jitter: number;
}

export function safeCount(value: unknown, min: number, max: number): number {
  const count = Math.floor(Number(value) || min);
  return Math.max(min, Math.min(max, count));
}

function validPoint(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y);
}

export function circlePoints(x: number, y: number, radius: number, segments = 40): Point2D[] {
  if (!validPoint(x, y) || radius <= 0) return [];
  const count = safeCount(segments, 12, 72);
  const points: Point2D[] = [];
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count;
    points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
  }
  return points;
}

export function arcPoints(x: number, y: number, radius: number, startAngle: number, endAngle: number, segments = 18): Point2D[] {
  if (!validPoint(x, y) || radius <= 0) return [];
  const count = safeCount(segments, 4, 96);
  const points: Point2D[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const angle = startAngle + (endAngle - startAngle) * t;
    points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
  }
  return points;
}

export function coneShape(originX: number, originY: number, angle: number, reach: number, halfAngle: number, heavy = false): ConeShape | null {
  if (!validPoint(originX, originY) || reach <= 0) return null;
  const steps = heavy ? 22 : 18;
  const points: Point2D[] = [{ x: originX, y: originY }];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const a = angle - halfAngle + halfAngle * 2 * t;
    const edgeEase = 0.94 + Math.sin(t * Math.PI) * 0.08;
    points.push({
      x: originX + Math.cos(a) * reach * edgeEase,
      y: originY + Math.sin(a) * reach * edgeEase,
    });
  }
  return {
    points,
    left: {
      x1: originX,
      y1: originY,
      x2: originX + Math.cos(angle - halfAngle) * reach,
      y2: originY + Math.sin(angle - halfAngle) * reach,
    },
    right: {
      x1: originX,
      y1: originY,
      x2: originX + Math.cos(angle + halfAngle) * reach,
      y2: originY + Math.sin(angle + halfAngle) * reach,
    },
  };
}

export function cleaveRibbonPoints(originX: number, originY: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number, segments = 20): Point2D[] {
  if (!validPoint(originX, originY) || outerRadius <= innerRadius) return [];
  const count = safeCount(segments, 6, 96);
  const points: Point2D[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const a = startAngle + (endAngle - startAngle) * t;
    const bite = 1 + Math.sin(t * Math.PI) * 0.035;
    points.push({
      x: originX + Math.cos(a) * outerRadius * bite,
      y: originY + Math.sin(a) * outerRadius * bite,
    });
  }
  for (let i = count; i >= 0; i -= 1) {
    const t = i / count;
    const a = startAngle + (endAngle - startAngle) * t;
    const bite = 1 - Math.sin(t * Math.PI) * 0.025;
    points.push({
      x: originX + Math.cos(a) * innerRadius * bite,
      y: originY + Math.sin(a) * innerRadius * bite,
    });
  }
  return points;
}

export function capsuleSegments(fromX: number, fromY: number, toX: number, toY: number, width: number): CapsuleSegments | null {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 2) return null;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  return {
    center: { x1: fromX, y1: fromY, x2: toX, y2: toY },
    sideA: {
      x1: fromX + px * width * 0.44,
      y1: fromY + py * width * 0.44,
      x2: toX + px * width * 0.44,
      y2: toY + py * width * 0.44,
    },
    sideB: {
      x1: fromX - px * width * 0.44,
      y1: fromY - py * width * 0.44,
      x2: toX - px * width * 0.44,
      y2: toY - py * width * 0.44,
    },
    cap: { x: toX, y: toY, radius: width * 0.48 },
  };
}

export function lightningPoints(fromX: number, fromY: number, toX: number, toY: number, segments = 7, jitter = 12, phase = 0): LightningPath | null {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 2) return null;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const count = safeCount(segments, 2, 64);
  const safeJitter = Math.max(0, Number(jitter) || 0);
  const snapPhase = Math.floor((Number(phase) || 0) * 18);
  const points: Point2D[] = [];
  for (let i = 0; i <= count; i += 1) {
    const t = i / count;
    const edge = i === 0 || i === count ? 0 : 1;
    const taper = Math.sin(t * Math.PI);
    const seed = snapPhase * 1.73 + i * 5.19 + len * 0.017;
    const zigzag = (i % 2 === 0 ? 1 : -1) * (0.56 + Math.abs(Math.sin(seed * 1.31)) * 0.72);
    const fracture = Math.sin(seed * 2.07) * 0.46 + Math.sin(seed * 3.41) * 0.18;
    const offset = (zigzag + fracture) * safeJitter * taper * edge;
    const slide = Math.sin(seed * 0.73 + snapPhase * 0.37) * safeJitter * 0.16 * taper * edge;
    points.push({
      x: fromX + dx * t + px * offset + ux * slide,
      y: fromY + dy * t + py * offset + uy * slide,
    });
  }
  return { points, ux, uy, px, py, jitter: safeJitter };
}

export function starPoints(x: number, y: number, radius: number, points = 8): Point2D[] {
  if (!validPoint(x, y) || radius <= 0) return [];
  const count = Math.max(6, Math.floor(points) * 2);
  const poly: Point2D[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = -Math.PI / 2 + (Math.PI * 2 * i) / count;
    const r = i % 2 === 0 ? radius : radius * 0.38;
    poly.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  return poly;
}

export function diamondPoints(x: number, y: number, size: number, rotation = 0): Point2D[] {
  if (!validPoint(x, y) || size <= 0) return [];
  const points: Point2D[] = [];
  for (let i = 0; i < 4; i += 1) {
    const a = rotation + Math.PI / 4 + (Math.PI * 2 * i) / 4;
    const stretch = i % 2 === 0 ? 1 : 0.58;
    points.push({ x: x + Math.cos(a) * size * stretch, y: y + Math.sin(a) * size * stretch });
  }
  return points;
}

export function gearPoints(x: number, y: number, radius: number, phase = 0, teeth = 10): Point2D[] {
  if (!validPoint(x, y) || radius <= 0) return [];
  const count = Math.max(8, Math.floor(teeth) * 2);
  const points: Point2D[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = phase + (Math.PI * 2 * i) / count;
    const r = radius * (i % 2 === 0 ? 1 : 0.76);
    points.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  return points;
}
