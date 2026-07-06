(function () {
  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function outline(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(10,10,9,0.42)";
    ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
  }

  function pixelDiamond(ctx, x, y, r, fill, light) {
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

  function drawShadow(ctx) {
    const gradient = ctx.createRadialGradient(24, 10, 2, 24, 10, 24);
    gradient.addColorStop(0, "rgba(0,0,0,0.42)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 48, 20);
  }

  function drawReticle(ctx) {
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

  function drawXpOrb(ctx) {
    pixelDiamond(ctx, 12, 12, 8, "#7e9fb2", "#dbeafe");
  }

  function drawChest(ctx) {
    px(ctx, 7, 12, 18, 12, "#4b3421");
    px(ctx, 8, 9, 16, 6, "#caa35a");
    px(ctx, 10, 14, 12, 6, "#facc15");
    px(ctx, 15, 10, 3, 13, "#f8f3e9");
    outline(ctx, 7, 9, 18, 15);
  }

  function drawWarningRing(ctx) {
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

  function drawSlashArc(ctx) {
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

  function drawBurst(ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(32, 32, 24, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI * 2 * i) / 10;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16);
      ctx.lineTo(32 + Math.cos(a) * 30, 32 + Math.sin(a) * 30);
      ctx.stroke();
    }
  }

  function drawBeam(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 32, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 8);
  }

  window.RoguePixiCommonTextures = Object.freeze({
    drawShadow,
    drawReticle,
    drawXpOrb,
    drawChest,
    drawWarningRing,
    drawSlashArc,
    drawBurst,
    drawBeam
  });
})();
