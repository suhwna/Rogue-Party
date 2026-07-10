(function () {
  const palettes = window.RoguePixiPalettes || {};
  const classPalettes = palettes.classPalettes || {
    warrior: ["#c9824c", "#6b3425", "#f8f3e9"]
  };

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function linePx(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(x1), Math.round(y1));
    ctx.lineTo(Math.round(x2), Math.round(y2));
    ctx.stroke();
  }

  function outline(ctx, x, y, w, h) {
    ctx.fillStyle = "rgba(10,10,9,0.42)";
    ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
  }

  function drawEye(ctx, x, y, color = "#1d4ed8") {
    px(ctx, x, y, 3, 4, "#11110f");
    px(ctx, x + 1, y + 1, 2, 2, color);
    px(ctx, x + 2, y, 1, 1, "#f8f3e9");
  }

  function drawFace(ctx, x, y, eyeColor = "#2563eb") {
    px(ctx, x, y, 20, 16, "#f0c28e");
    px(ctx, x + 2, y + 2, 16, 11, "#ffd7a8");
    drawEye(ctx, x + 4, y + 5, eyeColor);
    drawEye(ctx, x + 13, y + 5, eyeColor);
    px(ctx, x + 8, y + 12, 5, 2, "#5a2615");
  }

  function drawBoots(ctx, leg, left = "#171512", right = "#171512") {
    px(ctx, 21, 45 + leg, 7, 12, left);
    px(ctx, 36, 45 - leg, 7, 12, right);
    px(ctx, 17, 56 + leg, 13, 5, "#0b0d0e");
    px(ctx, 34, 56 - leg, 13, 5, "#0b0d0e");
  }

  function drawHands(ctx, atk, color = "#ffd7a8") {
    px(ctx, 13, 31, 6, 7, color);
    px(ctx, 45 + atk, 30 - atk, 6, 7, color);
  }

  function dot(ctx, x, y, color) {
    px(ctx, x, y, 2, 2, color);
  }

  function gem(ctx, x, y, color = "#38bdf8", light = "#e0f2fe") {
    px(ctx, x + 1, y, 3, 1, light);
    px(ctx, x, y + 1, 5, 3, color);
    px(ctx, x + 1, y + 4, 3, 1, "#1d4ed8");
    px(ctx, x + 2, y + 1, 1, 1, light);
  }

  function buckle(ctx, x, y) {
    px(ctx, x, y, 5, 5, "#3f3426");
    px(ctx, x + 1, y + 1, 3, 3, "#d6b76d");
    px(ctx, x + 2, y + 2, 1, 1, "#11110f");
  }

  function trim(ctx, x, y, w, horizontal = true, color = "#d6b76d") {
    if (horizontal) {
      for (let i = 0; i < w; i += 4) px(ctx, x + i, y, 2, 2, color);
    } else {
      for (let i = 0; i < w; i += 4) px(ctx, x, y + i, 2, 2, color);
    }
  }

  function hairSpike(ctx, x, y, color, shade) {
    px(ctx, x + 2, y, 5, 3, color);
    px(ctx, x, y + 2, 8, 4, shade);
    px(ctx, x + 3, y + 3, 6, 3, color);
  }

  function bootStraps(ctx, x, y) {
    px(ctx, x, y, 8, 2, "#d6b76d");
    px(ctx, x + 2, y + 3, 5, 2, "#8a5a2b");
  }

  function drawWarrior(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const attacking = state === "attack";
    const lean = attacking ? 2 : 0;
    const swordLift = attacking ? -5 : 0;
    const shieldPush = attacking ? 3 : 0;

    px(ctx, 13, 57, 38, 4, "rgba(5,5,4,0.34)");

    linePx(ctx, 14 + lean, 31 + swordLift, 6 + lean, 12 + swordLift, "#101317");
    linePx(ctx, 16 + lean, 31 + swordLift, 7 + lean, 12 + swordLift, "#f8fafc");
    linePx(ctx, 18 + lean, 31 + swordLift, 9 + lean, 14 + swordLift, "#94a3b8");
    px(ctx, 3 + lean, 11 + swordLift, 9, 4, "#f8fafc");
    px(ctx, 6 + lean, 15 + swordLift, 8, 4, "#cbd5e1");
    px(ctx, 13 + lean, 31 + swordLift, 5, 11, "#7c4a22");
    px(ctx, 10 + lean, 39 + swordLift, 12, 4, "#caa35a");
    px(ctx, 12 + lean, 43 + swordLift, 7, 4, "#181411");

    drawBoots(ctx, leg, "#595f66", "#595f66");
    px(ctx, 19, 46 + leg, 10, 9, "#9ca3af");
    px(ctx, 35, 45 - leg, 10, 10, "#9ca3af");
    px(ctx, 20, 48 + leg, 7, 4, "#d1d5db");
    px(ctx, 36, 47 - leg, 7, 4, "#d1d5db");
    px(ctx, 18, 55 + leg, 12, 4, "#171512");
    px(ctx, 34, 55 - leg, 13, 4, "#171512");
    bootStraps(ctx, 20, 51 + leg);
    bootStraps(ctx, 36, 50 - leg);

    px(ctx, 20 + lean, 34, 24, 14, "#332116");
    px(ctx, 22 + lean, 29, 20, 18, "#20242a");
    px(ctx, 24 + lean, 29, 16, 17, "#bfc5cc");
    px(ctx, 26 + lean, 31, 12, 13, "#e5e7eb");
    px(ctx, 27 + lean, 34, 10, 4, "#64748b");
    px(ctx, 27 + lean, 40, 10, 3, "#f8fafc");
    px(ctx, 21 + lean, 25, 8, 8, "#9ca3af");
    px(ctx, 38 + lean, 25, 8, 8, "#9ca3af");
    px(ctx, 22 + lean, 26, 5, 4, "#f8fafc");
    px(ctx, 39 + lean, 26, 5, 4, "#f8fafc");
    px(ctx, 18 + lean, 30, 6, 12, "#e5e7eb");
    px(ctx, 42 + lean, 30, 6, 12, "#e5e7eb");
    px(ctx, 17 + lean, 38, 7, 5, "#ffd7a8");
    px(ctx, 43 + lean, 38, 7, 5, "#ffd7a8");
    px(ctx, 22 + lean, 43, 20, 5, "#7c3f18");
    px(ctx, 27 + lean, 44, 10, 6, "#5b3018");
    buckle(ctx, 30 + lean, 43);
    dot(ctx, 24 + lean, 39, "#facc15");
    dot(ctx, 39 + lean, 39, "#facc15");

    px(ctx, 19 + lean, 21, 28, 7, "#7f1d1d");
    px(ctx, 22 + lean, 24, 25, 5, "#dc2626");
    px(ctx, 18 + lean, 26, 9, 4, "#b91c1c");
    px(ctx, 42 + lean, 26, 10, 5, "#ef4444");

    drawFace(ctx, 23 + lean, 16, "#2563eb");
    px(ctx, 24 + lean, 13, 22, 8, "#7c3f18");
    px(ctx, 20 + lean, 12, 14, 8, "#9a5a25");
    px(ctx, 28 + lean, 8, 13, 8, "#a16222");
    px(ctx, 39 + lean, 10, 8, 7, "#6b3425");
    px(ctx, 18 + lean, 16, 7, 6, "#5b3018");
    hairSpike(ctx, 17 + lean, 8, "#a16222", "#6b3425");
    hairSpike(ctx, 29 + lean, 4, "#b86a2d", "#7c3f18");
    hairSpike(ctx, 40 + lean, 8, "#8a4c28", "#5b3018");
    px(ctx, 25 + lean, 21, 17, 4, "#ffd7a8");
    px(ctx, 28 + lean, 28, 8, 2, "#9ca3af");

    px(ctx, 46 + shieldPush, 22, 13, 3, "#14120e");
    px(ctx, 44 + shieldPush, 25, 17, 20, "#14120e");
    px(ctx, 46 + shieldPush, 22, 13, 4, "#d6b76d");
    px(ctx, 43 + shieldPush, 26, 20, 4, "#d6b76d");
    px(ctx, 43 + shieldPush, 30, 21, 13, "#1e3a5f");
    px(ctx, 45 + shieldPush, 43, 17, 4, "#0f2742");
    px(ctx, 47 + shieldPush, 26, 14, 18, "#274b75");
    px(ctx, 48 + shieldPush, 28, 10, 3, "#3b5c86");
    px(ctx, 45 + shieldPush, 47, 15, 4, "#d6b76d");
    px(ctx, 51 + shieldPush, 30, 4, 14, "#facc15");
    px(ctx, 48 + shieldPush, 35, 10, 4, "#facc15");
    px(ctx, 52 + shieldPush, 32, 2, 11, "#fff7ed");
    gem(ctx, 50 + shieldPush, 28, "#2563eb", "#dbeafe");

    outline(ctx, 13, 6, 48, 56);
  }

  function drawRanger(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 4 : 0;
    drawBoots(ctx, leg, "#5b371b", "#5b371b");
    px(ctx, 18, 27, 30, 25, "#233c25");
    px(ctx, 15, 29, 12, 22, "#376236");
    px(ctx, 23, 28, 20, 18, "#8a5a2b");
    px(ctx, 27, 42, 13, 4, "#d6b76d");
    px(ctx, 28, 14, 25, 10, "#b9471d");
    px(ctx, 45, 8, 9, 11, "#d35424");
    px(ctx, 51, 6, 6, 7, "#ef6a2e");
    px(ctx, 23, 12, 17, 8, "#7c2d12");
    drawFace(ctx, 24, 18, "#15803d");
    px(ctx, 18, 24, 28, 7, "#2f5e2f");
    px(ctx, 14, 20, 7, 27, "#2f5e2f");
    px(ctx, 43, 23, 10, 25, "#233c25");
    for (let i = 0; i < 4; i += 1) {
      linePx(ctx, 47 + i, 16, 39 + i, 31, "#f8f3e9");
    }
    px(ctx, 45, 15, 8, 12, "#5b371b");
    px(ctx, 45, 12, 8, 4, "#d6b76d");
    px(ctx, 47, 14, 3, 2, "#ef4444");
    px(ctx, 18, 35, 4, 15, "#244923");
    px(ctx, 15, 46, 7, 5, "#1f3b21");
    trim(ctx, 18, 25, 25, true, "#86a85f");
    trim(ctx, 16, 31, 17, false, "#86a85f");
    buckle(ctx, 30, 42);
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    px(ctx, 31, 11, 8, 2, "#ef6a2e");
    px(ctx, 46, 8, 4, 10, "#9f1d1d");
    px(ctx, 53, 8, 3, 4, "#f97316");
    linePx(ctx, 50 + atk, 14, 55 + atk, 47, "#8a5a2b");
    linePx(ctx, 55 + atk, 16, 48 + atk, 32, "#f8f3e9");
    linePx(ctx, 55 + atk, 45, 48 + atk, 32, "#f8f3e9");
    linePx(ctx, 41 + atk, 31, 56 + atk, 31, "#f1d08b");
    px(ctx, 39 + atk, 29, 8, 3, "#d6b76d");
    px(ctx, 54 + atk, 26, 3, 3, "#f8f3e9");
    drawHands(ctx, atk);
    outline(ctx, 13, 8, 45, 54);
  }

  function drawMage(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 4 : 0;
    drawBoots(ctx, leg, "#171512", "#171512");
    px(ctx, 19, 25, 28, 30, "#1e3a8a");
    px(ctx, 23, 28, 20, 26, "#264fb1");
    px(ctx, 27, 30, 12, 22, "#7e3fb2");
    px(ctx, 20, 24, 26, 5, "#d6b76d");
    px(ctx, 26, 41, 14, 4, "#d6b76d");
    px(ctx, 24, 10, 22, 10, "#f1c453");
    px(ctx, 21, 14, 27, 13, "#eabf55");
    drawFace(ctx, 24, 18, "#2563eb");
    px(ctx, 17, 9, 34, 8, "#1e3a8a");
    px(ctx, 21, 5, 25, 7, "#1e40af");
    px(ctx, 45, 12, 11, 4, "#d6b76d");
    px(ctx, 26, 3, 12, 5, "#2847a6");
    px(ctx, 27, 2, 10, 3, "#3b82f6");
    linePx(ctx, 11, 11, 13, 52, "#8a5a2b");
    px(ctx, 6, 6, 13, 13, "#d6b76d");
    px(ctx, 9, 9, 7, 7, "#38bdf8");
    px(ctx, 11, 11, 3, 3, "#e0f2fe");
    px(ctx, 50 + atk, 19 - atk, 4, 4, "#38bdf8");
    px(ctx, 55 + atk, 14 - atk, 3, 3, "#60a5fa");
    px(ctx, 56 + atk, 24 - atk, 2, 2, "#e0f2fe");
    trim(ctx, 23, 26, 22, true, "#facc15");
    trim(ctx, 21, 31, 20, false, "#d6b76d");
    trim(ctx, 43, 30, 20, false, "#d6b76d");
    px(ctx, 30, 34, 6, 12, "#5b21b6");
    px(ctx, 30, 46, 7, 2, "#facc15");
    px(ctx, 31, 11, 13, 2, "#60a5fa");
    px(ctx, 18, 15, 9, 3, "#d6b76d");
    gem(ctx, 9, 9, "#38bdf8", "#e0f2fe");
    dot(ctx, 49 + atk, 16 - atk, "#38bdf8");
    dot(ctx, 53 + atk, 12 - atk, "#60a5fa");
    dot(ctx, 58 + atk, 18 - atk, "#93c5fd");
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    drawHands(ctx, atk);
    outline(ctx, 10, 3, 48, 58);
  }

  function drawEngineer(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 4 : 0;
    drawBoots(ctx, leg, "#5b371b", "#5b371b");
    px(ctx, 20, 26, 26, 27, "#d7c3a0");
    px(ctx, 23, 28, 20, 24, "#1f4a5d");
    px(ctx, 26, 29, 14, 20, "#2f6f86");
    px(ctx, 25, 43, 15, 4, "#d6b76d");
    px(ctx, 19, 13, 24, 9, "#8a4c28");
    px(ctx, 17, 10, 28, 7, "#6b3425");
    drawFace(ctx, 23, 18, "#15803d");
    px(ctx, 20, 10, 11, 7, "#d6b76d");
    px(ctx, 34, 10, 11, 7, "#d6b76d");
    px(ctx, 22, 11, 7, 5, "#38bdf8");
    px(ctx, 36, 11, 7, 5, "#38bdf8");
    px(ctx, 30, 13, 6, 2, "#3f3426");
    linePx(ctx, 12, 24, 5, 31, "#9ca3af");
    linePx(ctx, 5, 31, 12, 39, "#9ca3af");
    px(ctx, 3, 29, 7, 5, "#d1d5db");
    px(ctx, 9, 36, 7, 5, "#d1d5db");
    px(ctx, 47, 24, 13, 24, "#8a5a2b");
    px(ctx, 50, 27, 9, 16, "#b98232");
    px(ctx, 53, 31, 5, 5, "#38bdf8");
    px(ctx, 55, 19, 4, 10, "#9ca3af");
    px(ctx, 46 + atk, 33 - atk, 8, 6, "#d6b76d");
    px(ctx, 50, 52, 9, 7, "#8a5a2b");
    px(ctx, 52, 48, 5, 5, "#38bdf8");
    px(ctx, 23, 31, 18, 3, "#8bb6c6");
    px(ctx, 24, 36, 16, 2, "#0f2d3a");
    px(ctx, 26, 41, 4, 6, "#d6b76d");
    px(ctx, 34, 41, 4, 6, "#d6b76d");
    buckle(ctx, 30, 42);
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    dot(ctx, 55, 32, "#e0f2fe");
    dot(ctx, 57, 34, "#38bdf8");
    px(ctx, 46, 22, 7, 5, "#5b371b");
    px(ctx, 54, 22, 4, 4, "#d6b76d");
    linePx(ctx, 52, 23, 59, 19, "#9ca3af");
    linePx(ctx, 52, 24, 60, 26, "#9ca3af");
    px(ctx, 49, 53, 11, 3, "#3f3426");
    px(ctx, 52, 56, 3, 4, "#6b4a2b");
    px(ctx, 58, 56, 3, 4, "#6b4a2b");
    gem(ctx, 52, 48, "#38bdf8", "#e0f2fe");
    drawHands(ctx, atk);
    outline(ctx, 3, 9, 58, 52);
  }

  function drawPuppeteer(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 4 : 0;
    drawBoots(ctx, leg, "#171512", "#171512");
    px(ctx, 19, 24, 27, 31, "#1d1824");
    px(ctx, 23, 27, 20, 24, "#2e2638");
    px(ctx, 27, 27, 10, 20, "#8f1d2f");
    px(ctx, 21, 25, 24, 4, "#d6b76d");
    px(ctx, 29, 12, 18, 11, "#e5e7eb");
    px(ctx, 21, 15, 12, 10, "#f8fafc");
    drawFace(ctx, 24, 19, "#2563eb");
    px(ctx, 20, 8, 27, 9, "#16121d");
    px(ctx, 25, 2, 17, 10, "#21191f");
    px(ctx, 24, 9, 20, 3, "#8f1d2f");
    px(ctx, 40, 8, 4, 4, "#d6b76d");
    linePx(ctx, 15, 8, 10, 43, "#f8f3e9");
    linePx(ctx, 33, 7, 49, 43, "#f8f3e9");
    px(ctx, 8, 42, 11, 13, "#d6b76d");
    px(ctx, 10, 41, 7, 8, "#f0c28e");
    px(ctx, 9, 49, 9, 6, "#9f1d1d");
    px(ctx, 47, 42, 11, 13, "#d6b76d");
    px(ctx, 49, 41, 7, 8, "#f0c28e");
    px(ctx, 48, 49, 9, 6, "#9f1d1d");
    px(ctx, 45 + atk, 28 - atk, 8, 6, "#ffd7a8");
    px(ctx, 13, 31, 7, 6, "#ffd7a8");
    trim(ctx, 22, 29, 21, false, "#d6b76d");
    trim(ctx, 42, 29, 19, false, "#d6b76d");
    px(ctx, 23, 51, 22, 3, "#16121d");
    px(ctx, 25, 12, 20, 2, "#3f3426");
    px(ctx, 26, 10, 16, 2, "#d6b76d");
    dot(ctx, 41, 8, "#facc15");
    linePx(ctx, 19, 7, 10, 43, "#f8f3e9");
    linePx(ctx, 22, 7, 14, 41, "#b985c8");
    linePx(ctx, 36, 7, 51, 43, "#f8f3e9");
    linePx(ctx, 39, 7, 54, 41, "#b985c8");
    drawEye(ctx, 12, 43, "#2563eb");
    drawEye(ctx, 51, 43, "#2563eb");
    px(ctx, 11, 52, 5, 2, "#d6b76d");
    px(ctx, 50, 52, 5, 2, "#d6b76d");
    outline(ctx, 8, 2, 50, 58);
  }

  function drawMartialist(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 5 : 0;
    drawBoots(ctx, leg, "#2a1c16", "#2a1c16");
    px(ctx, 19, 25, 28, 25, "#f2ead9");
    px(ctx, 23, 27, 20, 20, "#e7d9c0");
    px(ctx, 20, 40, 25, 7, "#2d2521");
    px(ctx, 23, 43, 18, 5, "#3b302a");
    px(ctx, 27, 38, 13, 5, "#9f1d1d");
    px(ctx, 28, 14, 18, 10, "#3f2a20");
    px(ctx, 38, 7, 8, 8, "#2f211b");
    px(ctx, 40, 5, 6, 4, "#1c1512");
    drawFace(ctx, 23, 18, "#111827");
    px(ctx, 20, 24, 27, 5, "#f8f3e9");
    px(ctx, 47 + atk, 27 - atk, 11, 9, "#f8d2a8");
    px(ctx, 49 + atk, 29 - atk, 8, 7, "#e5e7eb");
    px(ctx, 7, 29, 12, 9, "#f8d2a8");
    px(ctx, 7, 31, 9, 7, "#e5e7eb");
    px(ctx, 18, 50, 10, 7, "#e7d9c0");
    px(ctx, 36, 50, 10, 7, "#e7d9c0");
    px(ctx, 22, 29, 21, 2, "#f8f3e9");
    px(ctx, 23, 34, 19, 2, "#d8c6a6");
    trim(ctx, 26, 38, 14, true, "#ef4444");
    px(ctx, 30, 43, 5, 5, "#dc2626");
    px(ctx, 36, 43, 5, 4, "#9f1d1d");
    px(ctx, 47 + atk, 36 - atk, 9, 3, "#f8f3e9");
    px(ctx, 8, 38, 9, 3, "#f8f3e9");
    px(ctx, 51 + atk, 24 - atk, 4, 3, "#facc15");
    px(ctx, 11, 25, 4, 3, "#facc15");
    px(ctx, 39, 8, 5, 3, "#8a5a2b");
    dot(ctx, 43, 6, "#e7d9c0");
    bootStraps(ctx, 18, 53);
    bootStraps(ctx, 36, 52);
    outline(ctx, 7, 5, 51, 55);
  }

  function drawAlchemist(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 4 : 0;
    drawBoots(ctx, leg, "#47311a", "#47311a");
    px(ctx, 20, 25, 26, 29, "#354822");
    px(ctx, 23, 28, 20, 23, "#5e6f30");
    px(ctx, 25, 41, 16, 4, "#d6b76d");
    px(ctx, 20, 12, 25, 10, "#443019");
    px(ctx, 16, 15, 32, 7, "#5b371b");
    drawFace(ctx, 23, 18, "#65a30d");
    px(ctx, 10, 30, 8, 18, "#7c2d12");
    px(ctx, 12, 27, 5, 5, "#f8f3e9");
    px(ctx, 48 + atk, 24 - atk, 9, 14, "#bef264");
    px(ctx, 50 + atk, 21 - atk, 5, 5, "#f8f3e9");
    px(ctx, 38, 44, 8, 9, "#bef264");
    px(ctx, 40, 40, 4, 5, "#f8f3e9");
    trim(ctx, 23, 30, 20, true, "#d6b76d");
    px(ctx, 21, 34, 23, 3, "#2f3a20");
    buckle(ctx, 30, 41);
    gem(ctx, 50 + atk, 26 - atk, "#bef264", "#ecfccb");
    px(ctx, 8, 42, 12, 4, "#f97316");
    px(ctx, 9, 47, 8, 3, "#bef264");
    dot(ctx, 41, 45, "#ecfccb");
    dot(ctx, 43, 49, "#84cc16");
    px(ctx, 22, 15, 21, 2, "#d6b76d");
    px(ctx, 18, 16, 6, 3, "#84cc16");
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    drawHands(ctx, atk);
    outline(ctx, 9, 12, 48, 48);
  }

  function drawAssassin(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 5 : 0;
    drawBoots(ctx, leg, "#111113", "#111113");
    px(ctx, 18, 20, 29, 34, "#111113");
    px(ctx, 22, 24, 22, 27, "#21142f");
    px(ctx, 23, 41, 20, 4, "#8a6f9e");
    px(ctx, 19, 8, 28, 16, "#211611");
    px(ctx, 35, 3, 10, 11, "#2f211b");
    drawFace(ctx, 24, 16, "#111827");
    px(ctx, 21, 22, 26, 5, "#111113");
    linePx(ctx, 46 + atk, 31 - atk, 61 + atk, 25 - atk, "#f8f3e9");
    linePx(ctx, 4, 32, 18, 37, "#f8f3e9");
    drawHands(ctx, atk);
    px(ctx, 21, 25, 24, 3, "#2d1b3f");
    px(ctx, 23, 31, 20, 2, "#8a6f9e");
    px(ctx, 26, 43, 14, 2, "#c4b5fd");
    px(ctx, 20, 13, 25, 3, "#111113");
    px(ctx, 39, 5, 6, 5, "#111113");
    dot(ctx, 29, 19, "#f5d0fe");
    dot(ctx, 37, 19, "#f5d0fe");
    px(ctx, 52 + atk, 26 - atk, 7, 2, "#c4b5fd");
    px(ctx, 8, 35, 7, 2, "#c4b5fd");
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    outline(ctx, 4, 3, 57, 57);
  }

  function drawNovice(ctx, frame, state) {
    const leg = frame % 2 === 0 ? 1 : -1;
    const atk = state === "attack" ? 3 : 0;
    const [main, dark, light] = classPalettes.novice || ["#d6d0c4", "#7b7469", "#f8f3e9"];
    drawBoots(ctx, leg, "#4b4138", "#4b4138");
    px(ctx, 19, 25, 28, 27, dark);
    px(ctx, 23, 28, 20, 22, main);
    px(ctx, 25, 42, 15, 4, light);
    px(ctx, 22, 12, 22, 10, "#6b4a2b");
    drawFace(ctx, 23, 18, "#334155");
    linePx(ctx, 48 + atk, 24 - atk, 56 + atk, 43 - atk, light);
    px(ctx, 23, 31, 20, 3, light);
    buckle(ctx, 30, 41);
    px(ctx, 51 + atk, 25 - atk, 5, 4, "#d6b76d");
    px(ctx, 25, 13, 17, 3, "#8a5a2b");
    bootStraps(ctx, 20, 51);
    bootStraps(ctx, 36, 50);
    drawHands(ctx, atk);
    outline(ctx, 16, 11, 42, 49);
  }

  function drawActorSheetFrame(ctx, classId, frame, state) {
    if (classId === "warrior") drawWarrior(ctx, frame, state);
    else if (classId === "ranger") drawRanger(ctx, frame, state);
    else if (classId === "mage") drawMage(ctx, frame, state);
    else if (classId === "engineer") drawEngineer(ctx, frame, state);
    else if (classId === "puppeteer") drawPuppeteer(ctx, frame, state);
    else if (classId === "martialist") drawMartialist(ctx, frame, state);
    else if (classId === "alchemist") drawAlchemist(ctx, frame, state);
    else if (classId === "assassin") drawAssassin(ctx, frame, state);
    else drawNovice(ctx, frame, state);
  }

  window.RoguePixiActorTextures = Object.freeze({
    drawActorSheetFrame
  });
})();
