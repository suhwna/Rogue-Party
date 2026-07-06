(function () {
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

  window.RoguePixiPixelDrawing = Object.freeze({
    px,
    linePx,
    outline,
    pixelDiamond
  });
})();
