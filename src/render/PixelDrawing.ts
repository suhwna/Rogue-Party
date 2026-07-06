export function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function linePx(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(x1), Math.round(y1));
  ctx.lineTo(Math.round(x2), Math.round(y2));
  ctx.stroke();
}

export function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "rgba(10,10,9,0.42)";
  ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
}

export function pixelDiamond(
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
