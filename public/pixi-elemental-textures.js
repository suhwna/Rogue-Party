(function () {
  function drawLightning(ctx) {
    const main = [
      { x: 4, y: 21 },
      { x: 22, y: 8 },
      { x: 38, y: 16 },
      { x: 52, y: 5 },
      { x: 65, y: 17 },
      { x: 82, y: 9 },
      { x: 108, y: 15 }
    ];
    const ribbon = (points, spread) => {
      const left = [];
      const right = [];
      for (let i = 0; i < points.length; i += 1) {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(points.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len;
        const py = dx / len;
        const taper = i === 0 || i === points.length - 1 ? 0.5 : 1;
        const jag = 1 + (i % 2 ? 0.22 : -0.14);
        const width = spread * taper * jag;
        left.push({ x: points[i].x + px * width, y: points[i].y + py * width });
        right.unshift({ x: points[i].x - px * width * 0.82, y: points[i].y - py * width * 0.82 });
      }
      return [...left, ...right];
    };
    const fillPath = (points, fill, stroke, strokeWidth) => {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke && strokeWidth > 0) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
      }
    };
    const branch = (start, end, spread, alpha) => {
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
          { x: start.x - px * spread * 0.62, y: start.y - py * spread * 0.62 }
        ],
        `rgba(103,232,249,${alpha})`,
        `rgba(255,255,255,${alpha * 0.45})`,
        1
      );
    };
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "miter";
    ctx.lineCap = "butt";
    fillPath(ribbon(main, 9.4), "rgba(5,12,28,0.3)", "rgba(103,232,249,0.16)", 2);
    fillPath(ribbon(main, 5.2), "rgba(103,232,249,0.74)", "rgba(255,255,255,0.32)", 1.4);
    fillPath(ribbon(main, 1.65), "rgba(255,255,255,0.92)", "rgba(255,255,255,0.5)", 0.8);
    branch(main[2], { x: 45, y: 1 }, 2.6, 0.44);
    branch(main[3], { x: 59, y: 27 }, 2.8, 0.48);
    branch(main[5], { x: 96, y: 4 }, 2.4, 0.4);
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.beginPath();
    ctx.arc(108, 15, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFrostShards(ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI * 2 * i) / 10;
      ctx.beginPath();
      ctx.moveTo(48 + Math.cos(a) * 12, 48 + Math.sin(a) * 12);
      ctx.lineTo(48 + Math.cos(a) * 42, 48 + Math.sin(a) * 42);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.84)";
    ctx.fillRect(43, 23, 10, 50);
    ctx.fillRect(23, 43, 50, 10);
  }

  function drawFireBloom(ctx) {
    for (let i = 0; i < 11; i += 1) {
      const a = (Math.PI * 2 * i) / 11;
      const x = 48 + Math.cos(a) * 24;
      const y = 48 + Math.sin(a) * 22;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.42)";
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(32, 32, 32, 32);
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.fillRect(22, 42, 52, 12);
  }

  function drawPoisonCloud(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    [[22, 37, 20], [42, 30, 26], [62, 38, 22], [49, 48, 24], [30, 50, 16]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(36, 22, 8, 8);
    ctx.fillRect(58, 35, 6, 6);
  }

  function drawHealCross(ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(34, 14, 12, 52);
    ctx.fillRect(14, 34, 52, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.52)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(40, 40, 31, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawShieldHex(ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
      const x = 48 + Math.cos(a) * 34;
      const y = 48 + Math.sin(a) * 38;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fill();
  }

  function drawWarningTarget(ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(48, 48, 33, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i += 1) {
      const a = (Math.PI * 2 * i) / 4;
      ctx.beginPath();
      ctx.moveTo(48 + Math.cos(a) * 15, 48 + Math.sin(a) * 15);
      ctx.lineTo(48 + Math.cos(a) * 44, 48 + Math.sin(a) * 44);
      ctx.stroke();
    }
  }

  function drawStarBurst(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 12; i += 1) {
      const a = (Math.PI * 2 * i) / 12;
      const x = 56 + Math.cos(a) * 36;
      const y = 56 + Math.sin(a) * 36;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
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

  function drawMeteorFall(ctx) {
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

  function drawFrostSnap(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.94)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6;
      ctx.beginPath();
      ctx.moveTo(56, 56);
      ctx.lineTo(56 + Math.cos(a) * 46, 56 + Math.sin(a) * 46);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(56 + Math.cos(a) * 26, 56 + Math.sin(a) * 26);
      ctx.lineTo(56 + Math.cos(a + 0.35) * 38, 56 + Math.sin(a + 0.35) * 38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(56 + Math.cos(a) * 26, 56 + Math.sin(a) * 26);
      ctx.lineTo(56 + Math.cos(a - 0.35) * 38, 56 + Math.sin(a - 0.35) * 38);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(36, 36, 40, 40);
  }

  function drawAcidSplash(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    [[22, 43, 12], [41, 30, 17], [62, 42, 14], [52, 53, 16], [74, 26, 8]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillRect(28, 16, 8, 8);
    ctx.fillRect(59, 13, 6, 6);
    ctx.fillRect(70, 46, 5, 5);
  }

  function drawFirePool(ctx) {
    for (let i = 0; i < 8; i += 1) {
      const x = 14 + i * 10;
      const h = 20 + (i % 3) * 9;
      ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.52)";
      ctx.beginPath();
      ctx.moveTo(x, 56);
      ctx.lineTo(x + 7, 56 - h);
      ctx.lineTo(x + 15, 56);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(12, 54, 80, 8);
  }

  function drawSmoke(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.36)";
    [[24, 38, 18], [42, 31, 22], [62, 37, 18], [50, 46, 24]].forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  window.RoguePixiElementalTextures = Object.freeze({
    drawLightning,
    drawFrostShards,
    drawFireBloom,
    drawPoisonCloud,
    drawHealCross,
    drawShieldHex,
    drawWarningTarget,
    drawStarBurst,
    drawMeteorFall,
    drawFrostSnap,
    drawAcidSplash,
    drawFirePool,
    drawSmoke
  });
})();
