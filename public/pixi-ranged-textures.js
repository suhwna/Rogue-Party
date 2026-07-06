(function () {
  function drawArrowHead(ctx, x, y, angle, size, alpha) {
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const px = -uy;
    const py = ux;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    ctx.moveTo(x + ux * size, y + uy * size);
    ctx.lineTo(x - ux * size * 0.72 + px * size * 0.48, y - uy * size * 0.72 + py * size * 0.48);
    ctx.lineTo(x - ux * size * 0.72 - px * size * 0.48, y - uy * size * 0.72 - py * size * 0.48);
    ctx.closePath();
    ctx.fill();
  }

  function drawArrowStreak(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(36, 10, 44, 4);
    ctx.fillRect(80, 8, 8, 8);
    drawArrowHead(ctx, 82, 12, 0, 12, 0.96);
    ctx.fillStyle = "rgba(255,255,255,0.34)";
    ctx.fillRect(11, 11, 30, 2);
    ctx.fillRect(0, 6, 19, 2);
    ctx.fillRect(0, 16, 19, 2);
    ctx.fillStyle = "rgba(241,208,139,0.34)";
    ctx.fillRect(44, 7, 29, 2);
    ctx.fillRect(44, 15, 29, 2);
  }

  function drawArrowFan(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 5;
    ctx.lineCap = "square";
    const arrows = [
      [14, 58, 108, 18],
      [10, 45, 116, 38],
      [14, 30, 108, 66]
    ];
    for (const [x1, y1, x2, y2] of arrows) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      drawArrowHead(ctx, x2, y2, angle, 16, 0.96);
    }
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(0, 41, 42, 4);
    ctx.fillStyle = "rgba(241,208,139,0.22)";
    ctx.fillRect(24, 49, 50, 3);
    ctx.fillRect(22, 35, 52, 3);
  }

  function drawArrowRain(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 4;
    ctx.lineCap = "square";
    for (let i = 0; i < 5; i += 1) {
      const x = 16 + i * 16 + (i % 2) * 3;
      const y = 6 + (i % 3) * 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 82);
      ctx.stroke();
      drawArrowHead(ctx, x, y + 91, Math.PI / 2, 10, 0.96);
      ctx.fillStyle = "rgba(241,208,139,0.22)";
      ctx.fillRect(x - 2, y + 28, 4, 34);
    }
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(8, 108, 80, 5);
    ctx.fillStyle = "rgba(241,208,139,0.16)";
    ctx.fillRect(18, 116, 60, 4);
  }

  function drawPierceLance(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    ctx.fillRect(18, 14, 96, 6);
    ctx.fillRect(32, 8, 62, 4);
    ctx.fillRect(32, 22, 62, 4);
    ctx.beginPath();
    ctx.moveTo(116, 4);
    ctx.lineTo(140, 17);
    ctx.lineTo(116, 30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.fillRect(0, 16, 44, 2);
    ctx.fillRect(4, 7, 30, 2);
    ctx.fillRect(4, 25, 30, 2);
    ctx.fillStyle = "rgba(241,208,139,0.3)";
    ctx.fillRect(42, 12, 58, 2);
    ctx.fillRect(42, 20, 58, 2);
  }

  window.RoguePixiRangedTextures = Object.freeze({
    drawArrowStreak,
    drawArrowFan,
    drawArrowRain,
    drawPierceLance
  });
})();
