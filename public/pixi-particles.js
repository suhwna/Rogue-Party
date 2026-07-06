(function () {
  const DEFAULT_PARTICLE_BUDGETS = Object.freeze({
    low: 110,
    medium: 180,
    high: 280
  });

  const PARTICLE_PRESETS = Object.freeze({
    hitSpark: { count: 10, radius: 42, color: "#f8f3e9" },
    slashTrail: { count: 8, radius: 54, color: "#fde68a" },
    fireBurst: { count: 12, radius: 62, color: "#f97316" },
    poisonBurst: { count: 10, radius: 58, color: "#bef264" },
    frostBurst: { count: 10, radius: 58, color: "#dbeafe" },
    healMist: { count: 9, radius: 52, color: "#bbf7d0" },
    smokePuff: { count: 8, radius: 58, color: "#8a6f9e" },
    bladeGlint: { count: 9, radius: 48, color: "#fde68a" },
    metalSpark: { count: 8, radius: 46, color: "#f8f3e9" },
    arcaneDust: { count: 10, radius: 52, color: "#dbeafe" },
    lightningFork: { count: 7, radius: 62, color: "#9ee6ff" },
    shockRing: { count: 8, radius: 58, color: "#f8f3e9" }
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  class ParticleEngine {
    constructor(options = {}) {
      this.quality = options.quality || "high";
      this.budget = number(options.budget, DEFAULT_PARTICLE_BUDGETS[this.quality] || DEFAULT_PARTICLE_BUDGETS.high);
      this.used = 0;
      this.skipped = 0;
    }

    setQuality(quality, budget) {
      this.quality = quality || "high";
      this.budget = number(budget, DEFAULT_PARTICLE_BUDGETS[this.quality] || DEFAULT_PARTICLE_BUDGETS.high);
    }

    beginFrame(budget) {
      this.budget = number(budget, this.budget);
      this.used = 0;
      this.skipped = 0;
    }

    stats() {
      const requested = this.used + this.skipped;
      return {
        used: this.used,
        retained: this.budget,
        skipped: this.skipped,
        budget: this.budget,
        pressure: this.budget > 0 ? Math.round((requested / this.budget) * 1000) / 1000 : 0
      };
    }

    reserve(count) {
      const requested = Math.max(0, Math.round(number(count, 0)));
      const available = Math.max(0, this.budget - this.used);
      const allowed = Math.min(requested, available);
      this.used += allowed;
      this.skipped += requested - allowed;
      return allowed;
    }

    renderPreset(host, name, options = {}) {
      if (!host || !name) return false;
      const preset = PARTICLE_PRESETS[name] || PARTICLE_PRESETS.hitSpark;
      const x = number(options.x, 0);
      const y = number(options.y, 0);
      const radius = Math.max(4, number(options.radius, preset.radius));
      const color = options.color || preset.color;
      const alpha = clamp(number(options.alpha, 1), 0, 1);
      const z = number(options.zIndex, y + 90);
      const phase = number(options.phase, 0);
      const direction = Number.isFinite(options.direction) ? Number(options.direction) : null;
      const spread = number(options.spread, Math.PI * 2);
      const count = this.reserve(number(options.count, preset.count));
      if (count <= 0 || alpha <= 0) return true;

      if (name === "fireBurst") return this.renderFire(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "poisonBurst") return this.renderPoison(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "frostBurst") return this.renderFrost(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "healMist") return this.renderHeal(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "smokePuff") return this.renderSmoke(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "bladeGlint") return this.renderBladeGlint(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      if (name === "metalSpark") return this.renderMetalSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      if (name === "arcaneDust") return this.renderArcaneDust(host, x, y, radius, color, alpha, z, phase, count);
      if (name === "lightningFork") return this.renderLightningFork(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      if (name === "shockRing") return this.renderShockRing(host, x, y, radius, color, alpha, z, phase, count);
      return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
    }

    renderSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread) {
      if (!host.drawGfxLine) return false;
      for (let i = 0; i < count; i += 1) {
        const base = direction == null ? phase + (Math.PI * 2 * i) / count : direction - spread / 2 + (spread * (i + 0.5)) / count;
        const wobble = Math.sin(phase * 4.7 + i * 1.61) * 0.15;
        const a = base + wobble;
        const inner = radius * (0.12 + (i % 3) * 0.04);
        const outer = radius * (0.46 + (i % 4) * 0.08);
        const sx = x + Math.cos(a) * inner;
        const sy = y + Math.sin(a) * inner;
        const tx = x + Math.cos(a) * outer;
        const ty = y + Math.sin(a) * outer;
        host.drawGfxLine(sx, sy, tx, ty, i % 2 ? 2.5 : 4.5, color, alpha * (0.35 + (i % 3) * 0.08), z + i, "add");
        if (host.drawGfxDiamond && i % 3 === 0) host.drawGfxDiamond(tx, ty, 4 + (i % 2) * 2, color, alpha * 0.34, z + i + 1, a);
      }
      return true;
    }

    renderBladeGlint(host, x, y, radius, color, alpha, z, phase, count, direction, spread) {
      if (!host.drawGfxLine || !host.drawGfxDiamond) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      const baseDirection = direction == null ? phase : direction;
      const fan = spread || Math.PI * 0.7;
      for (let i = 0; i < count; i += 1) {
        const t = count <= 1 ? 0.5 : i / (count - 1);
        const a = baseDirection - fan * 0.5 + fan * t + Math.sin(phase * 4 + i) * 0.06;
        const inner = radius * (0.08 + (i % 2) * 0.04);
        const outer = radius * (0.4 + (i % 3) * 0.08);
        const sx = x + Math.cos(a) * inner;
        const sy = y + Math.sin(a) * inner;
        const tx = x + Math.cos(a) * outer;
        const ty = y + Math.sin(a) * outer;
        host.drawGfxLine(sx, sy, tx, ty, i % 3 === 1 ? 3 : 5, i % 2 ? color : "#fff7ed", alpha * (0.32 + (i % 3) * 0.08), z + i, "add");
        if (i % 2 === 0) host.drawGfxDiamond(tx, ty, 4 + (i % 3), color, alpha * 0.32, z + count + i, a);
      }
      return true;
    }

    renderMetalSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread) {
      if (!host.drawGfxLine) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      const baseDirection = direction == null ? phase : direction;
      const fan = spread || Math.PI * 0.85;
      for (let i = 0; i < count; i += 1) {
        const a = baseDirection - fan * 0.5 + (fan * (i + 0.5)) / count;
        const offset = radius * (0.05 + (i % 3) * 0.035);
        const len = radius * (0.28 + (i % 4) * 0.055);
        const sx = x + Math.cos(a) * offset;
        const sy = y + Math.sin(a) * offset;
        const tx = sx + Math.cos(a) * len;
        const ty = sy + Math.sin(a) * len;
        host.drawGfxLine(sx, sy, tx, ty, i % 2 ? 2.5 : 4, i % 3 === 0 ? "#fde68a" : color, alpha * (0.3 + (i % 2) * 0.12), z + i, "add");
      }
      return true;
    }

    renderArcaneDust(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxDiamond || !host.drawGfxCircle) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.45 + (Math.PI * 2 * i) / count;
        const r = radius * (0.14 + (i % 5) * 0.055);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.78;
        if (i % 2 === 0) {
          host.drawGfxDiamond(px, py, 5 + (i % 3), color, alpha * 0.36, z + i, a, "#f8f3e9");
        } else {
          host.drawGfxCircle(px, py, 4 + (i % 3), color, alpha * 0.2, "#f8f3e9", alpha * 0.14, 1, z + i, "add", 8);
        }
      }
      return true;
    }

    renderLightningFork(host, x, y, radius, color, alpha, z, phase, count, direction, spread) {
      if (!host.drawGfxLightning && !host.drawGfxLine) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, direction, spread);
      const baseDirection = direction == null ? phase : direction;
      const fan = spread || Math.PI * 0.9;
      for (let i = 0; i < count; i += 1) {
        const a = baseDirection - fan * 0.5 + (fan * (i + 0.5)) / count;
        const len = radius * (0.28 + (i % 3) * 0.12);
        const sx = x + Math.cos(a) * radius * 0.08;
        const sy = y + Math.sin(a) * radius * 0.08;
        const tx = x + Math.cos(a) * len;
        const ty = y + Math.sin(a) * len;
        if (host.drawGfxLightning) {
          host.drawGfxLightning(sx, sy, tx, ty, i % 2 ? color : "#dbeafe", alpha * (0.26 + (i % 3) * 0.06), z + i, i % 2 ? 3 : 4, 3, 8, phase + i * 0.23);
        } else {
          host.drawGfxLine(sx, sy, tx, ty, i % 2 ? 3 : 4, color, alpha * 0.34, z + i, "add");
        }
      }
      return true;
    }

    renderShockRing(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxArc) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.35 + (Math.PI * 2 * i) / count;
        const span = Math.PI * (0.08 + (i % 3) * 0.03);
        const ringRadius = radius * (0.32 + (i % 4) * 0.08);
        host.drawGfxArc(x, y, ringRadius, a - span, a + span, i % 2 ? 3 : 5, i % 2 ? color : "#f8f3e9", alpha * (0.24 + (i % 3) * 0.055), z + i, "add", 5);
      }
      return true;
    }

    renderFire(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxPath) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.35 + (Math.PI * 2 * i) / count;
        const r = radius * (0.16 + (i % 4) * 0.08);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.58;
        const flame = radius * (0.16 + (i % 3) * 0.04);
        host.drawGfxPath(
          [
            { x: px, y: py - flame },
            { x: px + flame * 0.52, y: py + flame * 0.62 },
            { x: px - flame * 0.52, y: py + flame * 0.62 }
          ],
          i % 2 ? color : "#fde68a",
          alpha * 0.42,
          color,
          alpha * 0.14,
          1,
          z + i,
          "add"
        );
      }
      return true;
    }

    renderPoison(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxCircle) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.2 + (Math.PI * 2 * i) / count;
        const r = radius * (0.12 + (i % 4) * 0.08);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.68;
        host.drawGfxCircle(px, py, 5 + (i % 3) * 3, color, alpha * 0.2, "#ecfccb", alpha * 0.14, 1, z + i, "add", 8);
      }
      return true;
    }

    renderFrost(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxDiamond || !host.drawGfxLine) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.25 + (Math.PI * 2 * i) / count;
        const inner = radius * 0.16;
        const outer = radius * (0.38 + (i % 3) * 0.08);
        const sx = x + Math.cos(a) * inner;
        const sy = y + Math.sin(a) * inner;
        const tx = x + Math.cos(a) * outer;
        const ty = y + Math.sin(a) * outer;
        host.drawGfxLine(sx, sy, tx, ty, 3, color, alpha * 0.38, z + i, "add");
        host.drawGfxDiamond(tx, ty, 5 + (i % 2) * 2, color, alpha * 0.36, z + count + i, a);
      }
      return true;
    }

    renderHeal(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxCircle || !host.drawGfxLine) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.4 + (Math.PI * 2 * i) / count;
        const r = radius * (0.15 + (i % 3) * 0.07);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.5 - Math.sin(phase + i) * 8;
        host.drawGfxCircle(px, py, 5 + (i % 2) * 2, color, alpha * 0.18, "#f0fdf4", alpha * 0.14, 1, z + i, "add", 8);
        if (i % 3 === 0) host.drawGfxLine(px - 5, py, px + 5, py, 2, "#f0fdf4", alpha * 0.22, z + count + i, "add");
      }
      return true;
    }

    renderSmoke(host, x, y, radius, color, alpha, z, phase, count) {
      if (!host.drawGfxCircle) return this.renderSpark(host, x, y, radius, color, alpha, z, phase, count, null, Math.PI * 2);
      for (let i = 0; i < count; i += 1) {
        const a = phase * 0.35 + (Math.PI * 2 * i) / count;
        const r = radius * (0.12 + (i % 4) * 0.08);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r * 0.45;
        host.drawGfxCircle(px, py, 12 + (i % 3) * 4, "#21142f", alpha * 0.12, color, alpha * 0.08, 1, z + i, "add", 10);
      }
      return true;
    }
  }

  window.RoguePixiParticles = Object.freeze({
    PARTICLE_PRESETS,
    ParticleEngine,
    createParticleEngine: (options) => new ParticleEngine(options)
  });
})();
