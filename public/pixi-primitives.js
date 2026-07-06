(function () {
  function safeCount(value, min, max) {
    const count = Math.floor(Number(value) || min);
    return Math.max(min, Math.min(max, count));
  }

  function validPoint(x, y) {
    return Number.isFinite(x) && Number.isFinite(y);
  }

  function circlePoints(x, y, radius, segments = 40) {
    if (!validPoint(x, y) || radius <= 0) return [];
    const count = safeCount(segments, 12, 72);
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
    }
    return points;
  }

  function arcPoints(x, y, radius, startAngle, endAngle, segments = 18) {
    if (!validPoint(x, y) || radius <= 0) return [];
    const count = safeCount(segments, 4, 96);
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const angle = startAngle + (endAngle - startAngle) * t;
      points.push({ x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius });
    }
    return points;
  }

  function coneShape(originX, originY, angle, reach, halfAngle, heavy = false) {
    if (!validPoint(originX, originY) || reach <= 0) return null;
    const steps = heavy ? 22 : 18;
    const points = [{ x: originX, y: originY }];
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

  function cleaveRibbonPoints(originX, originY, innerRadius, outerRadius, startAngle, endAngle, segments = 20) {
    if (!validPoint(originX, originY) || outerRadius <= innerRadius) return [];
    const count = safeCount(segments, 6, 96);
    const points = [];
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

  function capsuleSegments(fromX, fromY, toX, toY, width) {
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

  function lightningPoints(fromX, fromY, toX, toY, segments = 7, jitter = 12, phase = 0) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 2) return null;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const count = safeCount(segments, 2, 48);
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const edge = i === 0 || i === count ? 0 : 1;
      const offset = Math.sin(phase * 6.1 + i * 2.47 + len * 0.013) * jitter * edge;
      points.push({
        x: fromX + dx * t + px * offset,
        y: fromY + dy * t + py * offset,
      });
    }
    return { points, ux, uy, px, py, jitter };
  }

  function starPoints(x, y, radius, points = 8) {
    if (!validPoint(x, y) || radius <= 0) return [];
    const count = Math.max(6, Math.floor(points) * 2);
    const poly = [];
    for (let i = 0; i < count; i += 1) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / count;
      const r = i % 2 === 0 ? radius : radius * 0.38;
      poly.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
    }
    return poly;
  }

  function diamondPoints(x, y, size, rotation = 0) {
    if (!validPoint(x, y) || size <= 0) return [];
    const points = [];
    for (let i = 0; i < 4; i += 1) {
      const a = rotation + Math.PI / 4 + (Math.PI * 2 * i) / 4;
      const stretch = i % 2 === 0 ? 1 : 0.58;
      points.push({ x: x + Math.cos(a) * size * stretch, y: y + Math.sin(a) * size * stretch });
    }
    return points;
  }

  function gearPoints(x, y, radius, phase = 0, teeth = 10) {
    if (!validPoint(x, y) || radius <= 0) return [];
    const count = Math.max(8, Math.floor(teeth) * 2);
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const a = phase + (Math.PI * 2 * i) / count;
      const r = radius * (i % 2 === 0 ? 1 : 0.76);
      points.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
    }
    return points;
  }

  window.RoguePixiPrimitives = Object.freeze({
    safeCount,
    circlePoints,
    arcPoints,
    coneShape,
    cleaveRibbonPoints,
    capsuleSegments,
    lightningPoints,
    starPoints,
    diamondPoints,
    gearPoints,
  });
})();
