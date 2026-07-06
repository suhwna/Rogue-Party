(function () {
  const palettes = window.RoguePixiPalettes || {};
  const pixels = window.RoguePixiPixelDrawing || {};
  const classPalettes = palettes.classPalettes || {
    warrior: ["#c9824c", "#6b3425", "#f8f3e9"]
  };

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

  function drawActorSheetFrame(ctx, classId, frame, state) {
    const [main, dark, light] = classPalettes[classId] || classPalettes.warrior;
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 5 : 0;

    px(ctx, 20, 45 + leg, 7, 12, "#171512");
    px(ctx, 37, 45 - leg, 7, 12, "#171512");
    px(ctx, 17, 55 + leg, 12, 5, "#0b0d0e");
    px(ctx, 35, 55 - leg, 12, 5, "#0b0d0e");
    px(ctx, 18, 25, 28, 23, dark);
    px(ctx, 22, 21, 20, 28, main);
    px(ctx, 25, 13, 14, 13, light);
    px(ctx, 27, 16, 3, 3, "#11110f");
    px(ctx, 36, 16, 3, 3, "#11110f");
    px(ctx, 29, 22, 8, 2, "#11110f");
    px(ctx, 24, 47, 16, 4, light);
    px(ctx, 15, 29, 7, 15, main);
    px(ctx, 42 + atk, 28 - atk, 7, 15, main);

    if (classId === "warrior") {
      px(ctx, 11, 25, 12, 21, "#3f3426");
      px(ctx, 13, 28, 8, 15, "#6b4a2b");
      px(ctx, 20, 10, 24, 7, "#f8f3e9");
      px(ctx, 24, 7, 16, 6, dark);
      px(ctx, 46 + atk, 10 - atk, 5, 35, "#f8f3e9");
      px(ctx, 50 + atk, 7 - atk, 9, 9, "#f8f3e9");
      px(ctx, 43 + atk, 32 - atk, 14, 4, "#6b4a2b");
      px(ctx, 20, 30, 24, 4, "#f8f3e9");
    } else if (classId === "ranger") {
      px(ctx, 20, 10, 24, 12, dark);
      px(ctx, 24, 8, 16, 7, main);
      px(ctx, 49, 13, 4, 34, "#6f4a27");
      px(ctx, 50, 16, 2, 28, "#f8f3e9");
      px(ctx, 39 + atk, 29, 19, 3, light);
      px(ctx, 14, 17, 5, 28, "#4a341d");
      px(ctx, 13, 16, 3, 20, "#f1d08b");
    } else if (classId === "mage") {
      px(ctx, 17, 17, 30, 36, dark);
      px(ctx, 22, 20, 20, 31, main);
      px(ctx, 22, 5, 20, 9, dark);
      px(ctx, 26, 1, 12, 13, main);
      px(ctx, 10, 10, 6, 43, "#4f3f61");
      px(ctx, 7, 6, 12, 12, light);
      px(ctx, 15, 30, 34, 3, light);
      px(ctx, 27, 37, 10, 10, "#0e0d14");
    } else if (classId === "engineer") {
      px(ctx, 19, 9, 26, 8, "#2d2a22");
      px(ctx, 25, 14, 14, 5, light);
      px(ctx, 48, 26, 13, 9, "#2d2a22");
      px(ctx, 58, 28, 5, 5, light);
      px(ctx, 10, 24, 9, 24, "#2d2a22");
      px(ctx, 12, 26, 5, 18, "#6f5a34");
      px(ctx, 23, 39, 19, 5, light);
    } else if (classId === "puppeteer") {
      px(ctx, 23, 5, 18, 6, "#21191f");
      px(ctx, 26, 1, 12, 7, dark);
      linePx(ctx, 20, 3, 13, 38, light);
      linePx(ctx, 32, 3, 50, 42, light);
      px(ctx, 8, 38, 9, 11, "#21191f");
      px(ctx, 10, 40, 5, 5, light);
      px(ctx, 48, 41, 9, 11, "#21191f");
      px(ctx, 50, 43, 5, 5, light);
    } else if (classId === "martialist") {
      px(ctx, 18, 21, 28, 7, "#f8f3e9");
      px(ctx, 22, 31, 20, 4, "#11110f");
      px(ctx, 46 + atk, 27, 11, 9, light);
      px(ctx, 7, 27, 11, 9, light);
      px(ctx, 22, 12, 20, 4, "#fde68a");
      px(ctx, 50 + atk, 19, 4, 4, "#fde68a");
    } else if (classId === "alchemist") {
      px(ctx, 22, 12, 20, 7, "#2f3a20");
      px(ctx, 25, 15, 14, 5, "#d9f99d");
      px(ctx, 48, 22, 8, 13, "#bef264");
      px(ctx, 49, 18, 6, 5, "#f8f3e9");
      px(ctx, 9, 35, 8, 12, "#f97316");
      px(ctx, 11, 32, 4, 4, "#f8f3e9");
      px(ctx, 38, 43, 7, 9, "#bef264");
    } else if (classId === "assassin") {
      px(ctx, 17, 7, 30, 15, "#111113");
      px(ctx, 19, 20, 27, 33, "#111113");
      px(ctx, 26, 15, 12, 7, main);
      px(ctx, 47 + atk, 30 - atk, 15, 4, "#f8f3e9");
      px(ctx, 2, 31, 16, 4, "#f8f3e9");
      px(ctx, 20, 45, 26, 4, dark);
    }

    outline(ctx, 17, 10, 30, 43);
  }

  window.RoguePixiActorTextures = Object.freeze({
    drawActorSheetFrame
  });
})();
