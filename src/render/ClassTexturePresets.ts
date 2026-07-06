export function drawTurret(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(28, 24, 26, 24);
  ctx.fillRect(50, 31, 22, 8);
  ctx.fillRect(35, 10, 12, 16);
  ctx.fillRect(22, 50, 36, 10);
  ctx.fillRect(18, 58, 10, 12);
  ctx.fillRect(52, 58, 10, 12);
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.fillRect(31, 28, 20, 4);
  ctx.fillRect(56, 28, 12, 3);
}

export function drawMine(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.beginPath();
  ctx.arc(36, 36, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(36 + Math.cos(angle) * 13, 36 + Math.sin(angle) * 13);
    ctx.lineTo(36 + Math.cos(angle) * 31, 36 + Math.sin(angle) * 31);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(27, 27, 18, 18);
}

export function drawDrone(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.fillRect(32, 24, 20, 16);
  ctx.fillRect(15, 16, 16, 8);
  ctx.fillRect(53, 16, 16, 8);
  ctx.fillRect(15, 40, 16, 8);
  ctx.fillRect(53, 40, 16, 8);
  ctx.fillRect(27, 30, 30, 4);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(6, 18, 24, 3);
  ctx.fillRect(54, 18, 24, 3);
  ctx.fillRect(6, 43, 24, 3);
  ctx.fillRect(54, 43, 24, 3);
}

export function drawPuppet(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(31, 23);
  ctx.moveTo(51, 0);
  ctx.lineTo(41, 23);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fillRect(26, 16, 20, 18);
  ctx.fillRect(22, 35, 28, 28);
  ctx.fillRect(10, 39, 14, 8);
  ctx.fillRect(48, 39, 14, 8);
  ctx.fillRect(25, 63, 8, 18);
  ctx.fillRect(39, 63, 8, 18);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(30, 21, 4, 4);
  ctx.fillRect(39, 21, 4, 4);
}

export function drawThreadKnot(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(8, 32);
  ctx.bezierCurveTo(22, 6, 42, 58, 56, 32);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(8, 34);
  ctx.bezierCurveTo(22, 58, 42, 6, 56, 34);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillRect(27, 27, 10, 10);
}

export function drawFist(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(22, 20, 10, 16);
  ctx.fillRect(34, 16, 10, 20);
  ctx.fillRect(46, 20, 10, 16);
  ctx.fillRect(17, 33, 43, 20);
  ctx.fillRect(30, 52, 18, 12);
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(8, 38, 12, 5);
  ctx.fillRect(54, 38, 12, 5);
}

export function drawPalmWave(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(24, 31, 26 + i * 24, -0.55, 0.55);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.fillRect(11, 24, 19, 14);
}

export function drawFlask(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(27, 7, 10, 18);
  ctx.fillRect(22, 24, 20, 8);
  ctx.fillRect(17, 31, 30, 20);
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  ctx.fillRect(20, 38, 24, 10);
  ctx.fillRect(15, 51, 34, 5);
}

export function drawAssassinMark(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(255,255,255,0.92)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(18, 18);
  ctx.lineTo(62, 62);
  ctx.moveTo(62, 18);
  ctx.lineTo(18, 62);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(36, 7, 8, 66);
  ctx.fillRect(29, 14, 22, 6);
}

export function drawShadowCut(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.beginPath();
  ctx.moveTo(6, 44);
  ctx.lineTo(88, 10);
  ctx.lineTo(106, 18);
  ctx.lineTo(26, 55);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(0, 50, 44, 4);
  ctx.fillRect(11, 35, 28, 3);
}
