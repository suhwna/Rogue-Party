export function drawLightning(ctx: CanvasRenderingContext2D): void {
  type Point = { x: number; y: number };
  const main: Point[] = [
    { x: 4, y: 21 },
    { x: 22, y: 8 },
    { x: 38, y: 16 },
    { x: 52, y: 5 },
    { x: 65, y: 17 },
    { x: 82, y: 9 },
    { x: 108, y: 15 },
  ];
  const ribbon = (points: Point[], spread: number): Point[] => {
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i < points.length; i += 1) {
      const point = points[i];
      const prev = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      if (!point || !prev || !next) continue;
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      const taper = i === 0 || i === points.length - 1 ? 0.5 : 1;
      const jag = 1 + (i % 2 ? 0.22 : -0.14);
      const width = spread * taper * jag;
      left.push({ x: point.x + px * width, y: point.y + py * width });
      right.unshift({ x: point.x - px * width * 0.82, y: point.y - py * width * 0.82 });
    }
    return [...left, ...right];
  };
  const fillPath = (points: Point[], fill: string, stroke: string, strokeWidth: number): void => {
    const first = points[0];
    if (!first) return;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const point = points[i];
      if (point) ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (strokeWidth > 0) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  };
  const branch = (start: Point, end: Point, spread: number, alpha: number): void => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;
    const mid = { x: start.x + dx * 0.58 + px * spread * 0.7, y: start.y + dy * 0.58 + py * spread * 0.7 };
    fillPath(
      [
        { x: start.x + px * spread, y: start.y + py * spread },
        { x: mid.x + px * spread * 0.42, y: mid.y + py * spread * 0.42 },
        { x: end.x + ux * spread * 0.7, y: end.y + uy * spread * 0.7 },
        { x: mid.x - px * spread * 0.32, y: mid.y - py * spread * 0.32 },
        { x: start.x - px * spread * 0.62, y: start.y - py * spread * 0.62 },
      ],
      `rgba(103,232,249,${alpha})`,
      `rgba(255,255,255,${alpha * 0.45})`,
      1,
    );
  };

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineJoin = "miter";
  ctx.lineCap = "butt";
  fillPath(ribbon(main, 9.4), "rgba(5,12,28,0.3)", "rgba(103,232,249,0.16)", 2);
  fillPath(ribbon(main, 5.2), "rgba(103,232,249,0.74)", "rgba(255,255,255,0.32)", 1.4);
  fillPath(ribbon(main, 1.65), "rgba(255,255,255,0.92)", "rgba(255,255,255,0.5)", 0.8);
  if (main[2]) branch(main[2], { x: 45, y: 1 }, 2.6, 0.44);
  if (main[3]) branch(main[3], { x: 59, y: 27 }, 2.8, 0.48);
  if (main[5]) branch(main[5], { x: 96, y: 4 }, 2.4, 0.4);
  ctx.fillStyle = "rgba(255,255,255,0.74)";
  ctx.beginPath();
  ctx.arc(108, 15, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawFrostShards(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    ctx.beginPath();
    ctx.moveTo(48 + Math.cos(angle) * 12, 48 + Math.sin(angle) * 12);
    ctx.lineTo(48 + Math.cos(angle) * 42, 48 + Math.sin(angle) * 42);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.fillRect(43, 23, 10, 50);
  ctx.fillRect(23, 43, 50, 10);
}

export function drawFireBloom(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 11; i += 1) {
    const angle = (Math.PI * 2 * i) / 11;
    const x = 48 + Math.cos(angle) * 24;
    const y = 48 + Math.sin(angle) * 22;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.42)";
    ctx.fillRect(x - 5, y - 5, 10, 10);
  }
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(32, 32, 32, 32);
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillRect(22, 42, 52, 12);
}

export function drawPoisonCloud(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  const clouds: Array<[number, number, number]> = [[22, 37, 20], [42, 30, 26], [62, 38, 22], [49, 48, 24], [30, 50, 16]];
  for (const [x, y, radius] of clouds) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(36, 22, 8, 8);
  ctx.fillRect(58, 35, 6, 6);
}

export function drawHealCross(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(34, 14, 12, 52);
  ctx.fillRect(14, 34, 52, 12);
  ctx.strokeStyle = "rgba(255,255,255,0.52)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(40, 40, 31, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawShieldHex(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
    const x = 48 + Math.cos(angle) * 34;
    const y = 48 + Math.sin(angle) * 38;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
}

export function drawWarningTarget(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(48, 48, 33, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4;
    ctx.beginPath();
    ctx.moveTo(48 + Math.cos(angle) * 15, 48 + Math.sin(angle) * 15);
    ctx.lineTo(48 + Math.cos(angle) * 44, 48 + Math.sin(angle) * 44);
    ctx.stroke();
  }
}

export function drawStarBurst(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    const x = 56 + Math.cos(angle) * 36;
    const y = 56 + Math.sin(angle) * 36;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillRect(-3, -13, 6, 26);
    ctx.restore();
  }
  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.beginPath();
  ctx.moveTo(56, 20);
  ctx.lineTo(68, 46);
  ctx.lineTo(96, 56);
  ctx.lineTo(68, 66);
  ctx.lineTo(56, 94);
  ctx.lineTo(44, 66);
  ctx.lineTo(16, 56);
  ctx.lineTo(44, 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(37, 52, 38, 8);
  ctx.fillRect(52, 37, 8, 38);
}

export function drawMeteorFall(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(64, 64);
  ctx.rotate(-0.72);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.beginPath();
  ctx.moveTo(22, -20);
  ctx.lineTo(-62, -12);
  ctx.lineTo(-78, 0);
  ctx.lineTo(-56, 14);
  ctx.lineTo(20, 20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.beginPath();
  ctx.moveTo(18, -10);
  ctx.lineTo(-44, -5);
  ctx.lineTo(-56, 3);
  ctx.lineTo(-38, 9);
  ctx.lineTo(18, 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.moveTo(44, -2);
  ctx.lineTo(24, -20);
  ctx.lineTo(4, -14);
  ctx.lineTo(-10, -22);
  ctx.lineTo(-28, -5);
  ctx.lineTo(-19, 13);
  ctx.lineTo(5, 22);
  ctx.lineTo(31, 14);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.36)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(16, 5);
  ctx.moveTo(2, 13);
  ctx.lineTo(24, 4);
  ctx.stroke();
  ctx.restore();
}

export function drawFrostSnap(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255,255,255,0.94)";
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(56, 56);
    ctx.lineTo(56 + Math.cos(angle) * 46, 56 + Math.sin(angle) * 46);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(56 + Math.cos(angle) * 26, 56 + Math.sin(angle) * 26);
    ctx.lineTo(56 + Math.cos(angle + 0.35) * 38, 56 + Math.sin(angle + 0.35) * 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(56 + Math.cos(angle) * 26, 56 + Math.sin(angle) * 26);
    ctx.lineTo(56 + Math.cos(angle - 0.35) * 38, 56 + Math.sin(angle - 0.35) * 38);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(36, 36, 40, 40);
}

export function drawAcidSplash(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  const splashes: Array<[number, number, number]> = [[22, 43, 12], [41, 30, 17], [62, 42, 14], [52, 53, 16], [74, 26, 8]];
  for (const [x, y, radius] of splashes) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.48)";
  ctx.fillRect(28, 16, 8, 8);
  ctx.fillRect(59, 13, 6, 6);
  ctx.fillRect(70, 46, 5, 5);
}

export function drawFirePool(ctx: CanvasRenderingContext2D): void {
  for (let i = 0; i < 8; i += 1) {
    const x = 14 + i * 10;
    const height = 20 + (i % 3) * 9;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.52)";
    ctx.beginPath();
    ctx.moveTo(x, 56);
    ctx.lineTo(x + 7, 56 - height);
    ctx.lineTo(x + 15, 56);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(12, 54, 80, 8);
}

export function drawSmoke(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  const puffs: Array<[number, number, number]> = [[24, 38, 18], [42, 31, 22], [62, 37, 18], [50, 46, 24]];
  for (const [x, y, radius] of puffs) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
