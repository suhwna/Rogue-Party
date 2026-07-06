(function () {
  function drawSwordCut(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(30, 54, 48, -1.2, 0.2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.arc(33, 54, 35, -1.16, 0.14);
    ctx.stroke();
  }

  function drawCleave(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineCap = "round";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.arc(40, 68, 76, -1.14, 0.26);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.36)";
    ctx.beginPath();
    ctx.arc(40, 68, 55, -1.06, 0.2);
    ctx.stroke();
  }

  function drawWarriorCone(ctx) {
    const originX = 14;
    const originY = 59;
    ctx.fillStyle = "rgba(255,255,255,0.16)";
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(76, 14, 184, 18);
    ctx.lineTo(184, 100);
    ctx.quadraticCurveTo(76, 104, originX, originY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(originX + 8, originY - 4);
    ctx.quadraticCurveTo(78, 18, 178, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX + 8, originY + 4);
    ctx.quadraticCurveTo(78, 100, 178, 98);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(152, 54, 24, 10);
  }

  function drawWarriorCleaveCone(ctx) {
    const originX = 15;
    const originY = 79;
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.quadraticCurveTo(84, 10, 226, 16);
    ctx.lineTo(226, 142);
    ctx.quadraticCurveTo(84, 148, originX, originY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.52)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(originX + 10, originY - 6);
    ctx.quadraticCurveTo(90, 17, 220, 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originX + 10, originY + 6);
    ctx.quadraticCurveTo(90, 141, 220, 138);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.36)";
    ctx.fillRect(142, 70, 66, 16);
    ctx.fillRect(198, 62, 22, 32);
  }

  function drawWarriorBlade(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(130, 12);
    ctx.lineTo(168, 28);
    ctx.lineTo(130, 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(249,115,22,0.62)";
    ctx.fillRect(18, 30, 102, 5);
    ctx.fillStyle = "rgba(73,47,22,0.85)";
    ctx.fillRect(4, 24, 26, 12);
    ctx.fillRect(22, 18, 9, 25);
  }

  function drawWarriorSpinBlade(ctx) {
    ctx.save();
    ctx.translate(74, 74);
    for (let i = 0; i < 4; i += 1) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.beginPath();
      ctx.moveTo(7, -7);
      ctx.lineTo(64, -16);
      ctx.lineTo(70, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(7, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(249,115,22,0.36)";
      ctx.fillRect(18, -4, 38, 8);
    }
    ctx.restore();
  }

  function drawChargeLane(ctx) {
    ctx.fillStyle = "rgba(249,115,22,0.18)";
    ctx.fillRect(2, 18, 124, 28);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(0, 14, 126, 4);
    ctx.fillRect(0, 46, 126, 4);
    ctx.fillStyle = "rgba(250,204,21,0.26)";
    for (let x = 12; x < 118; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x + 14, 32);
      ctx.lineTo(x, 44);
      ctx.fill();
    }
  }

  function drawSpin(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(48, 48, 18 + i * 10, -1.6 + i * 0.4, 1.0 + i * 0.3);
      ctx.stroke();
    }
  }

  function drawImpactStar(ctx) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(36 + Math.cos(a) * 9, 36 + Math.sin(a) * 9);
      ctx.lineTo(36 + Math.cos(a) * 30, 36 + Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(30, 30, 12, 12);
  }

  function drawShieldWedge(ctx) {
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.beginPath();
    ctx.moveTo(12, 38);
    ctx.lineTo(70, 8);
    ctx.lineTo(120, 24);
    ctx.lineTo(120, 52);
    ctx.lineTo(70, 68);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 7;
    ctx.lineJoin = "miter";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(53, 18, 12, 40);
    ctx.fillRect(31, 32, 54, 10);
    ctx.fillRect(92, 20, 18, 7);
    ctx.fillRect(92, 49, 18, 7);
  }

  function drawTauntBurst(ctx) {
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 6;
    ctx.lineCap = "square";
    for (let i = 0; i < 8; i += 1) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(48 + Math.cos(a) * 19, 48 + Math.sin(a) * 19);
      ctx.lineTo(48 + Math.cos(a) * 43, 48 + Math.sin(a) * 43);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.fillRect(43, 20, 10, 37);
    ctx.fillRect(43, 63, 10, 10);
    ctx.strokeStyle = "rgba(255,255,255,0.42)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(48, 48, 31, 0, Math.PI * 2);
    ctx.stroke();
  }

  window.RoguePixiMeleeTextures = Object.freeze({
    drawSwordCut,
    drawCleave,
    drawWarriorCone,
    drawWarriorCleaveCone,
    drawWarriorBlade,
    drawWarriorSpinBlade,
    drawChargeLane,
    drawSpin,
    drawImpactStar,
    drawShieldWedge,
    drawTauntBurst
  });
})();
