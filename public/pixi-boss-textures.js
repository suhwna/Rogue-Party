(function () {
  const pixels = window.RoguePixiPixelDrawing || {};

  function px(ctx, x, y, w, h, color) {
    if (pixels.px) {
      pixels.px(ctx, x, y, w, h, color);
      return;
    }
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function linePx(ctx, x1, y1, x2, y2, color) {
    if (pixels.linePx) {
      pixels.linePx(ctx, x1, y1, x2, y2, color);
      return;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  }

  function outline(ctx, x, y, w, h) {
    if (pixels.outline) {
      pixels.outline(ctx, x, y, w, h);
      return;
    }
    ctx.fillStyle = "rgba(10,10,9,0.42)";
    ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
  }

  function drawBossSheetFrame(ctx, id, phase, frame) {
    const bossId = String(id || "boss");
    const safePhase = Math.max(1, Number(phase) || 1);
    const safeFrame = Math.max(0, Number(frame) || 0);
    const charge = bossId.includes("iron") || bossId === "charge";
    const hive = bossId.includes("hive") || bossId === "summon";
    const main = charge ? "#c9824c" : hive ? "#7fa671" : "#8d7cae";
    const dark = charge ? "#201a15" : hive ? "#101b16" : "#0e0d14";
    const light = safePhase >= 3 ? "#fee2e2" : hive ? "#dcfce7" : "#f8f3e9";

    px(ctx, 28, 35, 72, 66, dark);
    px(ctx, 42, 25, 44, 72, main);
    px(ctx, 18, 52, 18, 40, dark);
    px(ctx, 93, 52, 18, 40, dark);

    if (charge) {
      px(ctx, 42, 17, 44, 17, "#15110e");
      px(ctx, 49, 28, 29, 5, light);
      px(ctx, 85, 18, 11, 70, "#f8f3e9");
      px(ctx, 91, 11, 14, 17, "#f8f3e9");
      px(ctx, 23, 15, 16, 21, "#f8f3e9");
      px(ctx, 88, 76, 24, 6, "#6b4a2b");
    } else if (hive) {
      for (let i = 0; i < 8 + safePhase; i += 1) {
        const a = (Math.PI * 2 * i) / (8 + safePhase) + safeFrame * 0.2;
        linePx(ctx, 64, 60, 64 + Math.cos(a) * 52, 60 + Math.sin(a) * 48, light);
      }
      px(ctx, 53, 45, 22, 22, light);
      px(ctx, 39, 76, 50, 8, "#dcfce7");
    } else {
      for (let i = 0; i < 8 + safePhase; i += 1) {
        const a = (Math.PI * 2 * i) / (8 + safePhase) + safeFrame * 0.3;
        px(ctx, 62 + Math.cos(a) * 48, 58 + Math.sin(a) * 42, 7, 7, light);
      }
      px(ctx, 48, 45, 33, 23, light);
      px(ctx, 60, 44, 9, 25, "#111113");
      px(ctx, 35, 22, 58, 8, "#0e0d14");
    }

    if (safePhase >= 2) {
      px(ctx, 39, 101, 50, 6, light);
      px(ctx, 61, 11, 6, 96, light);
    }

    outline(ctx, 18, 11, 94, 98);
  }

  window.RoguePixiBossTextures = Object.freeze({
    drawBossSheetFrame,
  });
})();
