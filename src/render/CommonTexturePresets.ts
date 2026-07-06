function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "rgba(10,10,9,0.42)";
  ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
}

function pixelDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  light: string,
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
  px(ctx, x - 2, y - r + 3, 4, r, light);
}

export function drawShadow(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createRadialGradient(24, 10, 2, 24, 10, 24);
  gradient.addColorStop(0, "rgba(0,0,0,0.42)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 48, 20);
}

export function drawReticle(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(248,243,233,0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(16, 16, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(16, 2);
  ctx.lineTo(16, 9);
  ctx.moveTo(16, 23);
  ctx.lineTo(16, 30);
  ctx.moveTo(2, 16);
  ctx.lineTo(9, 16);
  ctx.moveTo(23, 16);
  ctx.lineTo(30, 16);
  ctx.stroke();
}

export function drawXpOrb(ctx: CanvasRenderingContext2D): void {
  pixelDiamond(ctx, 12, 12, 8, "#7e9fb2", "#dbeafe");
}

export function drawChest(ctx: CanvasRenderingContext2D): void {
  px(ctx, 7, 12, 18, 12, "#4b3421");
  px(ctx, 8, 9, 16, 6, "#caa35a");
  px(ctx, 10, 14, 12, 6, "#facc15");
  px(ctx, 15, 10, 3, 13, "#f8f3e9");
  outline(ctx, 7, 9, 18, 15);
}

export function drawWarningRing(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(32, 32, 25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([5, 5]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(32, 32, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawSlashArc(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(24, 40, 38, -0.95, 0.38);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.arc(24, 40, 27, -0.9, 0.28);
  ctx.stroke();
}

export function drawBurst(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(32, 32, 24, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10;
    ctx.beginPath();
    ctx.moveTo(32 + Math.cos(angle) * 16, 32 + Math.sin(angle) * 16);
    ctx.lineTo(32 + Math.cos(angle) * 30, 32 + Math.sin(angle) * 30);
    ctx.stroke();
  }
}

export function drawBeam(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 32, 0);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.9)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 8);
}
