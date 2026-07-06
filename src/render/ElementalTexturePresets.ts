export function drawLightning(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 7;
  ctx.lineJoin = "miter";
  ctx.beginPath();
  ctx.moveTo(4, 17);
  ctx.lineTo(27, 9);
  ctx.lineTo(45, 22);
  ctx.lineTo(66, 7);
  ctx.lineTo(83, 19);
  ctx.lineTo(108, 12);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(5, 24);
  ctx.lineTo(33, 18);
  ctx.lineTo(53, 27);
  ctx.lineTo(73, 15);
  ctx.lineTo(101, 22);
  ctx.stroke();
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
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(-66, -12, 82, 24);
  ctx.fillStyle = "rgba(255,255,255,0.52)";
  ctx.fillRect(-46, -7, 60, 14);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillRect(9, -16, 30, 30);
  ctx.fillRect(4, -10, 42, 20);
  ctx.fillStyle = "rgba(255,255,255,0.36)";
  ctx.fillRect(-60, -23, 42, 7);
  ctx.fillRect(-70, 15, 56, 7);
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
