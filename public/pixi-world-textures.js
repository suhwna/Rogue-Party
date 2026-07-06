(function () {
  const chapterTileThemes = {
    1: {
      bases: ["#211817", "#241a19", "#1f1a1b", "#251b18", "#1e2020", "#221814"],
      brick: ["#33231f", "#2d211f"],
      seam: "rgba(248,243,233,0.16)",
      accentA: "rgba(214,183,109,0.24)",
      accentB: "rgba(126,159,178,0.18)"
    },
    2: {
      bases: ["#142019", "#18251a", "#111f18", "#1a2617", "#15211b", "#102018"],
      brick: ["#213c27", "#1d3224"],
      seam: "rgba(220,252,231,0.13)",
      accentA: "rgba(190,242,100,0.24)",
      accentB: "rgba(107,166,158,0.22)"
    },
    3: {
      bases: ["#151225", "#18132b", "#101522", "#1a1430", "#111827", "#1d1532"],
      brick: ["#2d2146", "#241a3a"],
      seam: "rgba(245,208,254,0.15)",
      accentA: "rgba(147,197,253,0.2)",
      accentB: "rgba(185,133,200,0.26)"
    }
  };

  function themeForChapter(chapter) {
    return chapterTileThemes[Math.max(1, Math.min(3, Math.floor(Number(chapter) || 1)))] || chapterTileThemes[1];
  }

  function variantIndex(variant) {
    return Math.max(0, Math.floor(Number(variant) || 0)) % 6;
  }

  function px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawTileSeams(ctx, variant, brickColor, seamColor) {
    for (let y = 0; y < 64; y += 16) {
      for (let x = (y / 16 + variant) % 2 === 0 ? 0 : 8; x < 64; x += 24) {
        ctx.fillStyle = brickColor;
        ctx.fillRect(x, y + 2, 18, 10);
        ctx.fillStyle = seamColor;
        ctx.fillRect(x, y + 2, 18, 1);
      }
    }
  }

  function drawTileBorder(ctx) {
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(64, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 64);
    ctx.stroke();
  }

  function drawFloorTile(ctx, chapter, variantValue) {
    const variant = variantIndex(variantValue);
    const theme = themeForChapter(chapter);
    ctx.fillStyle = theme.bases[variant] || theme.bases[0];
    ctx.fillRect(0, 0, 64, 64);
    drawTileSeams(ctx, variant, theme.brick[variant % theme.brick.length] || theme.brick[0], theme.seam);
    ctx.fillStyle = theme.accentA;
    ctx.fillRect(8 + variant * 3, 42, 18, 2);
    ctx.fillStyle = theme.accentB;
    ctx.fillRect(42 - variant * 2, 18, 10, 2);
    if (chapter === 2) {
      ctx.fillStyle = "rgba(132,204,22,0.18)";
      ctx.fillRect(variant * 5, 55 - variant, 18, 3);
      ctx.fillRect(46 - variant * 2, 8 + variant * 2, 4, 18);
    } else if (chapter === 3) {
      ctx.fillStyle = "rgba(147,197,253,0.18)";
      ctx.fillRect(18 + variant * 2, 12, 3, 34);
      ctx.fillStyle = "rgba(185,133,200,0.22)";
      ctx.fillRect(8, 26 + variant, 48, 2);
    }
    drawTileBorder(ctx);
  }

  function drawLegacyFloorTile(ctx, variantValue) {
    const variant = variantIndex(variantValue);
    const theme = chapterTileThemes[1];
    ctx.fillStyle = theme.bases[variant] || theme.bases[0];
    ctx.fillRect(0, 0, 64, 64);
    drawTileSeams(ctx, variant, variant % 3 === 0 ? "#33231f" : "#2d211f", "rgba(248,243,233,0.16)");
    ctx.fillStyle = "rgba(214,183,109,0.24)";
    ctx.fillRect(8 + variant * 3, 42, 18, 2);
    ctx.fillStyle = "rgba(126,159,178,0.18)";
    ctx.fillRect(42 - variant * 2, 18, 10, 2);
    drawTileBorder(ctx);
  }

  function drawDefaultWallBlock(ctx) {
    ctx.fillStyle = "#0b0c0d";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#27201b";
    ctx.fillRect(0, 10, 64, 42);
    ctx.fillStyle = "#3a2d23";
    for (let i = 0; i < 4; i += 1) ctx.fillRect((i * 18) % 64, 13 + (i % 2) * 18, 16, 12);
    ctx.fillStyle = "rgba(248,243,233,0.14)";
    ctx.fillRect(0, 10, 64, 3);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 50, 64, 8);
  }

  function drawWallBlock(ctx, chapter) {
    const safeChapter = Math.max(1, Math.min(3, Math.floor(Number(chapter) || 1)));
    const main = safeChapter === 1 ? "#27201b" : safeChapter === 2 ? "#17291c" : "#1b1730";
    const brick = safeChapter === 1 ? "#3a2d23" : safeChapter === 2 ? "#25452b" : "#302450";
    const shine = safeChapter === 1 ? "rgba(248,243,233,0.14)" : safeChapter === 2 ? "rgba(190,242,100,0.14)" : "rgba(245,208,254,0.15)";
    ctx.fillStyle = "#090b0c";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = main;
    ctx.fillRect(0, 10, 64, 42);
    ctx.fillStyle = brick;
    for (let i = 0; i < 4; i += 1) ctx.fillRect((i * 18) % 64, 13 + (i % 2) * 18, 16, 12);
    ctx.fillStyle = shine;
    ctx.fillRect(0, 10, 64, 3);
    if (safeChapter === 2) {
      ctx.fillStyle = "rgba(132,204,22,0.2)";
      ctx.fillRect(7, 42, 48, 3);
    } else if (safeChapter === 3) {
      ctx.fillStyle = "rgba(147,197,253,0.16)";
      ctx.fillRect(28, 10, 4, 42);
      ctx.fillStyle = "rgba(185,133,200,0.18)";
      ctx.fillRect(5, 29, 52, 2);
    }
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 50, 64, 8);
  }

  function drawDefaultTorch(ctx) {
    px(ctx, 14, 18, 4, 24, "#5b3a22");
    px(ctx, 11, 14, 10, 7, "#6b4a2b");
    px(ctx, 13, 6, 6, 11, "#f97316");
    px(ctx, 15, 2, 4, 9, "#facc15");
    px(ctx, 9, 9, 3, 7, "#ef4444");
  }

  function drawTorch(ctx, chapter) {
    const safeChapter = Math.max(1, Math.min(3, Math.floor(Number(chapter) || 1)));
    const flame = safeChapter === 1 ? "#f97316" : safeChapter === 2 ? "#84cc16" : "#8b5cf6";
    const core = safeChapter === 1 ? "#facc15" : safeChapter === 2 ? "#d9f99d" : "#dbeafe";
    const ember = safeChapter === 1 ? "#ef4444" : safeChapter === 2 ? "#22c55e" : "#60a5fa";
    const wood = safeChapter === 2 ? "#25452b" : safeChapter === 3 ? "#302450" : "#5b3a22";
    px(ctx, 14, 18, 4, 24, wood);
    px(ctx, 11, 14, 10, 7, safeChapter === 1 ? "#6b4a2b" : safeChapter === 2 ? "#1f3f2b" : "#21142f");
    px(ctx, 13, 6, 6, 11, flame);
    px(ctx, 15, 2, 4, 9, core);
    px(ctx, 9, 9, 3, 7, ember);
  }

  window.RoguePixiWorldTextures = Object.freeze({
    chapterTileThemes,
    drawFloorTile,
    drawLegacyFloorTile,
    drawDefaultWallBlock,
    drawWallBlock,
    drawDefaultTorch,
    drawTorch
  });
})();
