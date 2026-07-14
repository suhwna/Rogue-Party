(() => {
  const pixiRuntime = window.RoguePixiRuntime || {};
  const pixiPools = window.RoguePixiPools || {};
  const pixiScene = window.RoguePixiScene || {};
  const pixiWorld = window.RoguePixiWorld || {};
  const pixiPickups = window.RoguePixiPickups || {};
  const pixiProjectiles = window.RoguePixiProjectiles || {};
  const pixiHazards = window.RoguePixiHazards || {};
  const pixiEnemies = window.RoguePixiEnemies || {};
  const pixiPlayers = window.RoguePixiPlayers || {};
  const pixiEffects = window.RoguePixiEffects || {};
  const pixiSkinEffects = window.RoguePixiSkinEffects || {};
  const pixiSkillEffects = window.RoguePixiSkillEffects || {};
  const pixiParticles = window.RoguePixiParticles || {};
  const styleClassifier = window.RogueEffectStyle || {};

  const pixiActorTextures = window.RoguePixiActorTextures || {};
  const pixiEnemyTextures = window.RoguePixiEnemyTextures || {};
  const pixiBossTextures = window.RoguePixiBossTextures || {};
  const pixiPrimitives = window.RoguePixiPrimitives || {};
  const pixiPalettes = window.RoguePixiPalettes || {};
  const pixiTextureKeys = window.RoguePixiTextureKeys || {};
  const pixiWorldTextures = window.RoguePixiWorldTextures || {};
  const pixiCommonTextures = window.RoguePixiCommonTextures || {};
  const pixiMeleeTextures = window.RoguePixiMeleeTextures || {};
  const pixiRangedTextures = window.RoguePixiRangedTextures || {};
  const pixiElementalTextures = window.RoguePixiElementalTextures || {};
  const pixiClassTextures = window.RoguePixiClassTextures || {};
  const SPRITE_SIZE = 64;
  const BOSS_SIZE = 128;
  const WHITE_KEY = "__white";
  const EFFECT_DRAW_BUDGET = pixiRuntime.EFFECT_DRAW_BUDGET || 360;
  const PERF_SAMPLE_MS = 500;
  const POOL_TRIM_INTERVAL_MS = pixiRuntime.POOL_TRIM_INTERVAL_MS || 10000;
  const POOL_RETAIN = pixiRuntime.POOL_RETAIN || {
    sprite: 1800,
    text: 260,
    graphics: 1200
  };
  const QUALITY_PRESETS = pixiRuntime.QUALITY_PRESETS || {
    low: {
      effectBudget: 180,
      resolutionCap: 1.25,
      retain: { sprite: 1000, text: 140, graphics: 640 }
    },
    medium: {
      effectBudget: 260,
      resolutionCap: 1.75,
      retain: { sprite: 1400, text: 200, graphics: 900 }
    },
    high: {
      effectBudget: EFFECT_DRAW_BUDGET,
      resolutionCap: 2.5,
      retain: POOL_RETAIN
    }
  };

  function shouldPrioritizeMageSkillRenderer(style, effect) {
    const s = String(style || effect?.style || effect?.kind || "").toLowerCase();
    const kind = String(effect?.kind || "").toLowerCase();
    if (!s) return false;
    if (kind === "explosion" && s.includes("meteor_impact")) return false;
    const styleInfo = styleClassifier.classifyEffectStyle
      ? styleClassifier.classifyEffectStyle(s, kind)
      : null;
    const nonMageLightning =
      s.includes("engineer") ||
      s.includes("turret") ||
      s.includes("drone") ||
      s.includes("overclock") ||
      s.includes("coil") ||
      s.includes("rail_") ||
      s.includes("single_laser") ||
      s.includes("drone_laser") ||
      s.includes("turret_bolt") ||
      s.includes("assassin") ||
      s.includes("puppet") ||
      s.includes("elite") ||
      s.includes("mark_chain");
    const mageChain = (s.includes("chain_lightning") || kind === "chain") && !nonMageLightning;
    if (mageChain) return true;
    if (styleInfo?.chainLightning || s.includes("lightning") || s.includes("electric")) {
      return false;
    }
    return (
      s.includes("mage") ||
      s.includes("frost") ||
      s.includes("freeze") ||
      s.includes("ice") ||
      s.includes("meteor") ||
      s.includes("star_orb") ||
      s.includes("star_burst") ||
      s.includes("star_split") ||
      s.includes("arcane_splash") ||
      s.includes("blink")
    );
  }

  function chooseRendererPreference() {
    if (pixiRuntime.chooseRendererPreference) return pixiRuntime.chooseRendererPreference();
    return typeof navigator !== "undefined" && navigator.gpu ? "webgpu" : "webgl";
  }

  const classPalettes = pixiPalettes.classPalettes || {
    warrior: ["#c9824c", "#6b3425", "#f8f3e9"]
  };
  const enemyPalettes = pixiPalettes.enemyPalettes || {
    slime: ["#c85d56", "#5b1f24", "#fca5a5"]
  };
  const enemyStatusMarkers = Object.freeze([
    { id: "freeze", label: "F", color: "#bfdbfe" },
    { id: "slow", label: "S", color: "#8aa8bd" },
    { id: "poison", label: "P", color: "#bef264" },
    { id: "venom", label: "v", color: "#c084fc" },
    { id: "burn", label: "B", color: "#fb923c" },
    { id: "vulnerable", label: "V", color: "#facc15" },
    { id: "marked", label: "M", color: "#c4b5fd" },
    { id: "threaded", label: "L", color: "#d8b4fe" },
    { id: "taunt", label: "T", color: "#e8794f" },
    { id: "barrier", label: "G", color: "#93c5fd" }
  ]);

  function enemyStatusEffects(enemy) {
    return new Set(Array.isArray(enemy?.statusEffects) ? enemy.statusEffects : []);
  }

  function enemyStatusActive(enemy, effects, id) {
    if (id === "freeze") return effects.has("freeze") || effects.has("frozen");
    if (id === "barrier") return effects.has("barrier") || Number(enemy?.barrier || 0) > 0;
    return effects.has(id);
  }

  function poisonStackCount(enemy) {
    return Math.max(0, Math.min(3, Math.floor(Number(enemy?.poisonStacks || 0))));
  }

  function enemyStatusMarkerLabel(enemy, marker) {
    if (marker.id !== "poison") return marker.label;
    const stacks = poisonStackCount(enemy);
    return stacks > 0 ? `P${stacks}` : marker.label;
  }

  function activeEnemyStatusMarkers(enemy) {
    const effects = enemyStatusEffects(enemy);
    const markers = [];
    for (const marker of enemyStatusMarkers) {
      if (enemyStatusActive(enemy, effects, marker.id)) markers.push(marker);
    }
    return markers;
  }

  function drawEnemyStatusGraphics(renderer, enemy, pos, now, z) {
    if (!renderer.drawGfxCircle) return;
    const effects = enemyStatusEffects(enemy);
    if (!effects.size && !(Number(enemy?.barrier || 0) > 0)) return;

    const radius = Math.max(10, Number(enemy.radius || 18));
    const phase = now / 360 + (renderer.hash?.(enemy.id) || 0) * 0.2;
    const pulse = 0.5 + Math.sin(phase * 2.2) * 0.5;
    const baseZ = z + 38;

    if (enemyStatusActive(enemy, effects, "slow")) {
      renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.98 + pulse * 0.08), Math.PI * 0.1, Math.PI * 0.92, 4, "#8aa8bd", 0.34, baseZ, "add", 12);
      renderer.drawGfxArc?.(pos.x, pos.y + radius * 0.42, radius * (0.72 + pulse * 0.06), Math.PI * 1.08, Math.PI * 1.9, 3, "#dbeafe", 0.2, baseZ + 1, "add", 12);
    }

    if (enemyStatusActive(enemy, effects, "freeze")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 1.05, "#dbeafe", 0.06, "#93c5fd", 0.52, 3, baseZ + 5, "add", 24);
      for (let i = 0; i < 5; i += 1) {
        const a = phase + (Math.PI * 2 * i) / 5;
        const inner = radius * (0.16 + (i % 2) * 0.08);
        const outer = radius * (0.72 + (i % 3) * 0.1);
        renderer.drawGfxLine?.(pos.x + Math.cos(a) * inner, pos.y + Math.sin(a) * inner, pos.x + Math.cos(a) * outer, pos.y + Math.sin(a) * outer, 2.5, i % 2 ? "#bfdbfe" : "#f8fafc", 0.46, baseZ + 7 + i, "add");
      }
    }

    if (enemyStatusActive(enemy, effects, "poison")) {
      const stacks = Math.max(1, poisonStackCount(enemy));
      renderer.drawGfxCircle(pos.x, pos.y + radius * 0.18, radius * 1.08, "#365314", 0.08, "#bef264", 0.18, 2, baseZ + 3, "add", 18);
      for (let i = 0; i < 4; i += 1) {
        const a = phase * 1.3 + (Math.PI * 2 * i) / 4;
        const d = radius * (0.44 + (i % 2) * 0.28);
        const bubble = radius * (0.12 + (i % 3) * 0.035);
        renderer.drawGfxCircle(pos.x + Math.cos(a) * d, pos.y + Math.sin(a) * d * 0.7, bubble, "#bef264", 0.18, "#ecfccb", 0.24, 1, baseZ + 12 + i, "add", 10);
      }
      for (let i = 0; i < stacks; i += 1) {
        const offset = (i - (stacks - 1) / 2) * radius * 0.3;
        renderer.drawGfxCircle(pos.x + offset, pos.y - radius * 1.12, radius * 0.12, "#bef264", 0.72, "#ecfccb", 0.58, 1, baseZ + 18 + i, "add", 10);
      }
    }

    if (enemyStatusActive(enemy, effects, "burn")) {
      for (let i = 0; i < 4; i += 1) {
        const side = i % 2 ? 1 : -1;
        const x = pos.x + side * radius * (0.32 + i * 0.04);
        const y = pos.y - radius * (0.45 - i * 0.08);
        const height = radius * (0.44 + pulse * 0.12);
        renderer.drawGfxLine?.(x, y + height * 0.34, x + side * radius * 0.08, y - height * 0.54, 5 - i * 0.45, i % 2 ? "#fdba74" : "#f97316", 0.48, baseZ + 14 + i, "add");
        renderer.drawGfxCircle(x, y - height * 0.28, radius * 0.13, "#f97316", 0.22, "#fed7aa", 0.28, 1, baseZ + 18 + i, "add", 8);
      }
    }

    if (enemyStatusActive(enemy, effects, "vulnerable")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * 1.26, "#000000", 0, "#facc15", 0.38, 2, baseZ + 20, "add", 26);
      for (let i = 0; i < 4; i += 1) {
        const a = phase * 0.25 + (Math.PI * 2 * i) / 4;
        renderer.drawGfxLine?.(pos.x + Math.cos(a) * radius * 0.98, pos.y + Math.sin(a) * radius * 0.98, pos.x + Math.cos(a) * radius * 1.32, pos.y + Math.sin(a) * radius * 1.32, 3, "#fde68a", 0.5, baseZ + 22 + i, "add");
      }
    }

    if (enemyStatusActive(enemy, effects, "marked")) {
      renderer.drawGfxLine?.(pos.x - radius * 0.48, pos.y - radius * 0.48, pos.x + radius * 0.48, pos.y + radius * 0.48, 4, "#c4b5fd", 0.62, baseZ + 28, "add");
      renderer.drawGfxLine?.(pos.x + radius * 0.48, pos.y - radius * 0.48, pos.x - radius * 0.48, pos.y + radius * 0.48, 4, "#f5d0fe", 0.46, baseZ + 29, "add");
      renderer.drawGfxDiamond?.(pos.x, pos.y, radius * 0.2, "#c4b5fd", 0.34, baseZ + 30, phase, "#f5d0fe");
    }

    if (enemyStatusActive(enemy, effects, "threaded")) {
      for (let i = 0; i < 3; i += 1) {
        const offset = (i - 1) * radius * 0.42;
        renderer.drawGfxLine?.(pos.x + offset, pos.y - radius * 1.05, pos.x - offset * 0.36, pos.y + radius * 1.04, 2, "#d8b4fe", 0.44, baseZ + 31 + i, "add");
        renderer.drawGfxCircle(pos.x - offset * 0.36, pos.y + radius * (0.5 - i * 0.08), radius * 0.08, "#d8b4fe", 0.34, "#f5d0fe", 0.22, 1, baseZ + 35 + i, "add", 8);
      }
    }

    if (enemyStatusActive(enemy, effects, "taunt")) {
      renderer.drawGfxCircle(pos.x, pos.y, radius * (1.42 + pulse * 0.12), "#7f1d1d", 0.03, "#ef4444", 0.46, 3, baseZ + 40, "add", 26);
      renderer.drawGfxLine?.(pos.x, pos.y - radius * 0.95, pos.x, pos.y - radius * 0.28, 5, "#fecaca", 0.68, baseZ + 43, "add");
      renderer.drawGfxCircle(pos.x, pos.y - radius * 0.08, radius * 0.1, "#fecaca", 0.62, "#ef4444", 0.3, 1, baseZ + 44, "add", 8);
    }
  }

  function drawEnemyStatusPips(renderer, enemy, pos, z) {
    const markers = activeEnemyStatusMarkers(enemy);
    if (!markers.length || !renderer.drawGfxCircle) return;

    const size = 14;
    const gap = 3;
    const perRow = 6;
    const rowGap = 15;
    const pipY = pos.y + Math.max(14, Number(enemy.radius || 18) + 11);
    const textParent = renderer.layers?.effect || renderer.layers?.actor;
    const textStyleBase = {
      fontFamily: "Inter, sans-serif",
      fontWeight: "900",
      fontSize: 8,
      stroke: { color: "#020617", width: 2 }
    };

    for (let i = 0; i < markers.length; i += 1) {
      const marker = markers[i];
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const count = Math.min(perRow, markers.length - row * perRow);
      const startX = pos.x - ((count - 1) * (size + gap)) / 2;
      const x = startX + col * (size + gap);
      const y = pipY + row * rowGap;
      renderer.drawGfxCircle(x, y, size / 2, "#05070c", 0.86, marker.color, 0.88, 1.4, z + 58 + row, "normal", 12);
      if (!renderer.textPool?.next || !textParent) continue;
      const label = enemyStatusMarkerLabel(enemy, marker);
      const text = renderer.textPool.next(textParent, { ...textStyleBase, fontSize: label.length > 1 ? 7 : 8, fill: marker.color });
      text.text = label;
      text.position.set(x, y + 0.2);
      text.alpha = 0.98;
      text.scale.set(1);
      text.zIndex = z + 59 + row;
    }
  }

  class SpritePool {
    constructor(PIXI) {
      this.PIXI = PIXI;
      this.items = [];
      this.index = 0;
    }

    begin() {
      this.index = 0;
    }

    next(texture, parent) {
      const PIXI = this.PIXI;
      let sprite = this.items[this.index];
      if (!sprite) {
        sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.roundPixels = true;
        this.items.push(sprite);
      }
      this.index += 1;
      if (sprite.parent !== parent) parent.addChild(sprite);
      sprite.visible = true;
      sprite.texture = texture;
      sprite.alpha = 1;
      sprite.tint = 0xffffff;
      sprite.rotation = 0;
      sprite.blendMode = "normal";
      sprite.zIndex = 0;
      sprite.scale.set(1, 1);
      sprite.anchor.set(0.5);
      return sprite;
    }

    end() {
      for (let i = this.index; i < this.items.length; i += 1) {
        this.items[i].visible = false;
      }
    }

    stats() {
      return { used: this.index, retained: this.items.length };
    }

    trim(maxRetained) {
      const target = Math.max(this.index, maxRetained);
      if (this.items.length <= target) return;
      for (let i = target; i < this.items.length; i += 1) {
        this.items[i].parent?.removeChild(this.items[i]);
      }
      this.items.length = target;
    }
  }

  class TextPool {
    constructor(PIXI) {
      this.PIXI = PIXI;
      this.items = [];
      this.index = 0;
    }

    begin() {
      this.index = 0;
    }

    next(parent, style) {
      const PIXI = this.PIXI;
      let text = this.items[this.index];
      if (!text) {
        text = new PIXI.Text({ text: "", style });
        text.anchor.set(0.5);
        this.items.push(text);
      }
      this.index += 1;
      if (text.parent !== parent) parent.addChild(text);
      text.visible = true;
      text.alpha = 1;
      text.rotation = 0;
      text.scale.set(1, 1);
      text.zIndex = 0;
      text.style = style;
      return text;
    }

    end() {
      for (let i = this.index; i < this.items.length; i += 1) {
        this.items[i].visible = false;
      }
    }

    stats() {
      return { used: this.index, retained: this.items.length };
    }

    trim(maxRetained) {
      const target = Math.max(this.index, maxRetained);
      if (this.items.length <= target) return;
      for (let i = target; i < this.items.length; i += 1) {
        this.items[i].parent?.removeChild(this.items[i]);
      }
      this.items.length = target;
    }
  }

  class GraphicsPool {
    constructor(PIXI) {
      this.PIXI = PIXI;
      this.items = [];
      this.index = 0;
    }

    begin() {
      this.index = 0;
    }

    next(parent) {
      const PIXI = this.PIXI;
      let graphics = this.items[this.index];
      if (!graphics) {
        graphics = new PIXI.Graphics();
        this.items.push(graphics);
      }
      this.index += 1;
      if (graphics.parent !== parent) parent.addChild(graphics);
      graphics.visible = true;
      graphics.clear();
      graphics.alpha = 1;
      graphics.rotation = 0;
      graphics.blendMode = "normal";
      graphics.zIndex = 0;
      graphics.scale.set(1, 1);
      graphics.position.set(0, 0);
      return graphics;
    }

    end() {
      for (let i = this.index; i < this.items.length; i += 1) {
        this.items[i].clear();
        this.items[i].visible = false;
      }
    }

    stats() {
      return { used: this.index, retained: this.items.length };
    }

    trim(maxRetained) {
      const target = Math.max(this.index, maxRetained);
      if (this.items.length <= target) return;
      for (let i = target; i < this.items.length; i += 1) {
        this.items[i].clear();
        this.items[i].parent?.removeChild(this.items[i]);
      }
      this.items.length = target;
    }
  }

  class RoguePixiRenderer {
    constructor(options) {
      this.canvas = options.canvas;
      this.getState = options.getState;
      this.getSelfId = options.getSelfId;
      this.getVisuals = options.getVisuals;
      this.getFloatingEffects = options.getFloatingEffects;
      this.getScreenShake = options.getScreenShake;
      this.getMouse = options.getMouse;
      this.getCamera = options.getCamera;
      this.preview = Boolean(options.preview);
      this.ready = false;
      this.failed = false;
      this.textures = pixiRuntime.createTextureRegistry
        ? pixiRuntime.createTextureRegistry()
        : new Map();
      this.lastEnemyPositions = new Map();
      this.lastPlayerPositions = new Map();
      this.rendererPreference = chooseRendererPreference();
      this.quality = QUALITY_PRESETS[options.quality] ? options.quality : "high";
      this.qualityPreset = QUALITY_PRESETS[this.quality];
      this.webgpuFallbackTried = false;
      this.lastPerfSampleAt = performance.now();
      this.lastPoolTrimAt = performance.now();
      this.perfFrameCount = 0;
      this.effectRenderTrace = [];
      this.lastStyledSkillRenderer = "";
      this.diagnostics = pixiRuntime.createDiagnostics
        ? pixiRuntime.createDiagnostics({
            rendererPreference: this.rendererPreference,
            rendererType: "pending",
            quality: this.quality
          })
        : {
            rendererPreference: this.rendererPreference,
            rendererType: "pending",
            quality: this.quality,
            fps: 0,
            frameMs: 0,
            sprites: { used: 0, retained: 0 },
            texts: { used: 0, retained: 0 },
            graphics: { used: 0, retained: 0 },
            textures: 0,
            effects: 0,
            particles: { used: 0, retained: 0, skipped: 0, budget: this.qualityPreset.particleBudget || 0, pressure: 0 },
            effectBudget: this.qualityPreset.effectBudget,
            particleBudget: this.qualityPreset.particleBudget || 0,
            lastEffectRenderer: null,
            effectRenderTrace: []
          };
      this.diagnostics.lastEffectRenderer = null;
      this.diagnostics.effectRenderTrace = [];
      if (!this.preview) window.__rogueRendererStats = this.diagnostics;
      this.particleEngine = pixiParticles.createParticleEngine
        ? pixiParticles.createParticleEngine({
            quality: this.quality,
            budget: this.getParticleBudget()
          })
        : null;
      this.readyPromise = this.init();
    }

    async init() {
      const PIXI = window.PIXI;
      if (!PIXI) {
        this.failed = true;
        return;
      }
      this.PIXI = PIXI;
      try {
        this.app = new PIXI.Application();
        await this.app.init({
          ...(this.preview ? { canvas: this.canvas } : {}),
          width: Math.max(this.preview ? 1 : 320, this.canvas.clientWidth || this.canvas.width || 1280),
          height: Math.max(this.preview ? 1 : 320, this.canvas.clientHeight || this.canvas.height || 720),
          backgroundAlpha: 0,
          antialias: false,
          autoDensity: true,
          resolution: Math.min(this.qualityPreset.resolutionCap, Math.max(1, window.devicePixelRatio || 1)),
          preference: this.rendererPreference,
          powerPreference: "high-performance"
        });

        this.app.stage.sortableChildren = true;
        this.view = this.app.canvas;
        this.view.className = this.preview ? "meta-codex-actor-preview pixi-codex-actor-preview" : "pixi-game-canvas";
        this.view.dataset.rendererPreference = this.rendererPreference;
        if (!this.preview) {
          this.canvas.insertAdjacentElement("afterend", this.view);
          this.canvas.closest(".stage")?.classList.add("pixi-enabled");
        }
        this.diagnostics.rendererType =
          this.app.renderer?.type ||
          this.app.renderer?.name ||
          (this.rendererPreference === "webgpu" ? "webgpu" : "webgl");

        this.root = new PIXI.Container();
        this.root.sortableChildren = true;
        this.world = new PIXI.Container();
        this.world.sortableChildren = true;
        this.screen = new PIXI.Container();
        this.screen.sortableChildren = true;
        this.app.stage.addChild(this.root);
        this.root.addChild(this.world);
        this.root.addChild(this.screen);

        const layerEntries = [
          ["floor", 0],
          ["hazard", 10],
          ["pickup", 20],
          ["projectile", 30],
          ["actor", 40],
          ["effect", 80],
          ["ui", 100]
        ];
        this.layers = pixiRuntime.createLayerSet
          ? pixiRuntime.createLayerSet(PIXI, this.world, layerEntries)
          : {
              floor: this.makeLayer(0),
              hazard: this.makeLayer(10),
              pickup: this.makeLayer(20),
              projectile: this.makeLayer(30),
              actor: this.makeLayer(40),
              effect: this.makeLayer(80),
              ui: this.makeLayer(100)
            };
        if (!pixiRuntime.createLayerSet) Object.values(this.layers).forEach((layer) => this.world.addChild(layer));

        const screenLayerEntries = [
          ["vignette", 0],
          ["flash", 10],
          ["debug", 100]
        ];
        this.screenLayers = pixiRuntime.createLayerSet
          ? pixiRuntime.createLayerSet(PIXI, this.screen, screenLayerEntries)
          : {
              vignette: this.makeLayer(0),
              flash: this.makeLayer(10)
            };
        if (!pixiRuntime.createLayerSet) Object.values(this.screenLayers).forEach((layer) => this.screen.addChild(layer));

        this.spritePool = pixiPools.createSpritePool ? pixiPools.createSpritePool(PIXI) : pixiRuntime.createSpritePool ? pixiRuntime.createSpritePool(PIXI) : new SpritePool(PIXI);
        this.textPool = pixiPools.createTextPool ? pixiPools.createTextPool(PIXI) : pixiRuntime.createTextPool ? pixiRuntime.createTextPool(PIXI) : new TextPool(PIXI);
        this.graphicsPool = pixiPools.createGraphicsPool ? pixiPools.createGraphicsPool(PIXI) : pixiRuntime.createGraphicsPool ? pixiRuntime.createGraphicsPool(PIXI) : new GraphicsPool(PIXI);
        this.prepareTextures();
        this.ready = true;
      } catch (error) {
        if (this.rendererPreference === "webgpu" && !this.webgpuFallbackTried) {
          this.webgpuFallbackTried = true;
          this.rendererPreference = "webgl";
          this.diagnostics.rendererPreference = "webgl";
          this.app = null;
          await this.init();
          return;
        }
        console.error("Pixi renderer failed", error);
        this.failed = true;
      }
    }

    makeLayer(zIndex) {
      const layer = new this.PIXI.Container();
      layer.sortableChildren = true;
      layer.zIndex = zIndex;
      return layer;
    }

    resize(width, height) {
      if (!this.ready) return;
      const minimum = this.preview ? 1 : 320;
      const nextW = Math.max(minimum, Math.round(width));
      const nextH = Math.max(minimum, Math.round(height));
      if (this.app.renderer.width !== nextW || this.app.renderer.height !== nextH) {
        this.app.renderer.resize(nextW, nextH);
      }
    }

    setQuality(quality) {
      const nextQuality = QUALITY_PRESETS[quality] ? quality : "high";
      this.quality = nextQuality;
      this.qualityPreset = QUALITY_PRESETS[nextQuality];
      this.diagnostics.quality = nextQuality;
      this.diagnostics.effectBudget = this.qualityPreset.effectBudget;
      this.diagnostics.particleBudget = this.getParticleBudget();
      this.particleEngine?.setQuality?.(nextQuality, this.getParticleBudget());
      if (this.ready) this.trimPools(performance.now(), true);
    }

    getParticleBudget() {
      const explicit = Number(this.qualityPreset?.particleBudget);
      if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
      return Math.max(60, Math.round(Number(this.qualityPreset?.effectBudget || 0) * 0.62));
    }

    destroy() {
      this.ready = false;
      this.failed = true;
      if (window.__rogueRendererStats === this.diagnostics) {
        window.__rogueRendererStats = null;
      }
      try {
        this.spritePool?.trim(0);
        this.textPool?.trim(0);
        this.graphicsPool?.trim(0);
        this.app?.destroy?.(false);
      } catch (error) {
        console.warn("Pixi renderer cleanup failed", error);
      }
      if (!this.preview) {
        this.view?.remove();
        this.canvas.closest(".stage")?.classList.remove("pixi-enabled");
      }
    }

    prepareTextures() {
      this.texture(WHITE_KEY, 2, 2, (ctx) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 2, 2);
      });
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
      for (let chapter = 1; chapter <= 3; chapter += 1) {
        const theme = chapterTileThemes[chapter];
        for (let variant = 0; variant < 6; variant += 1) {
          const key = pixiTextureKeys.floorTileKey ? pixiTextureKeys.floorTileKey(chapter, variant) : `floor-tile-${chapter}-${variant}`;
          this.texture(key, 64, 64, (ctx) => {
            if (pixiWorldTextures.drawFloorTile) {
              pixiWorldTextures.drawFloorTile(ctx, chapter, variant);
              return;
            }
            const base = theme.bases[variant];
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, 64, 64);
            for (let y = 0; y < 64; y += 16) {
              for (let x = (y / 16 + variant) % 2 === 0 ? 0 : 8; x < 64; x += 24) {
                ctx.fillStyle = theme.brick[variant % theme.brick.length];
                ctx.fillRect(x, y + 2, 18, 10);
                ctx.fillStyle = theme.seam;
                ctx.fillRect(x, y + 2, 18, 1);
              }
            }
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
            ctx.strokeStyle = "rgba(0,0,0,0.32)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(64, 0);
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 64);
            ctx.stroke();
          });
        }
      }
      for (let variant = 0; variant < 6; variant += 1) {
        const key = pixiTextureKeys.legacyFloorTileKey ? pixiTextureKeys.legacyFloorTileKey(variant) : `floor-tile-${variant}`;
        this.texture(key, 64, 64, (ctx) => {
          if (pixiWorldTextures.drawLegacyFloorTile) {
            pixiWorldTextures.drawLegacyFloorTile(ctx, variant);
            return;
          }
          const base = chapterTileThemes[1].bases[variant];
          ctx.fillStyle = base;
          ctx.fillRect(0, 0, 64, 64);
          for (let y = 0; y < 64; y += 16) {
            for (let x = (y / 16 + variant) % 2 === 0 ? 0 : 8; x < 64; x += 24) {
              ctx.fillStyle = variant % 3 === 0 ? "#33231f" : "#2d211f";
              ctx.fillRect(x, y + 2, 18, 10);
              ctx.fillStyle = "rgba(248,243,233,0.16)";
              ctx.fillRect(x, y + 2, 18, 1);
            }
          }
          ctx.fillStyle = "rgba(214,183,109,0.24)";
          ctx.fillRect(8 + variant * 3, 42, 18, 2);
          ctx.fillStyle = "rgba(126,159,178,0.18)";
          ctx.fillRect(42 - variant * 2, 18, 10, 2);
          ctx.strokeStyle = "rgba(0,0,0,0.32)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(64, 0);
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 64);
          ctx.stroke();
        });
      }
      this.texture("wall-block", 64, 64, (ctx) => {
        if (pixiWorldTextures.drawDefaultWallBlock) {
          pixiWorldTextures.drawDefaultWallBlock(ctx);
          return;
        }
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
      });
      for (let chapter = 1; chapter <= 3; chapter += 1) {
        const key = pixiTextureKeys.wallBlockKey ? pixiTextureKeys.wallBlockKey(chapter) : `wall-block-${chapter}`;
        this.texture(key, 64, 64, (ctx) => {
          if (pixiWorldTextures.drawWallBlock) {
            pixiWorldTextures.drawWallBlock(ctx, chapter);
            return;
          }
          const main = chapter === 1 ? "#27201b" : chapter === 2 ? "#17291c" : "#1b1730";
          const brick = chapter === 1 ? "#3a2d23" : chapter === 2 ? "#25452b" : "#302450";
          const shine = chapter === 1 ? "rgba(248,243,233,0.14)" : chapter === 2 ? "rgba(190,242,100,0.14)" : "rgba(245,208,254,0.15)";
          ctx.fillStyle = "#090b0c";
          ctx.fillRect(0, 0, 64, 64);
          ctx.fillStyle = main;
          ctx.fillRect(0, 10, 64, 42);
          ctx.fillStyle = brick;
          for (let i = 0; i < 4; i += 1) ctx.fillRect((i * 18) % 64, 13 + (i % 2) * 18, 16, 12);
          ctx.fillStyle = shine;
          ctx.fillRect(0, 10, 64, 3);
          if (chapter === 2) {
            ctx.fillStyle = "rgba(132,204,22,0.2)";
            ctx.fillRect(7, 42, 48, 3);
          } else if (chapter === 3) {
            ctx.fillStyle = "rgba(147,197,253,0.16)";
            ctx.fillRect(28, 10, 4, 42);
            ctx.fillStyle = "rgba(185,133,200,0.18)";
            ctx.fillRect(5, 29, 52, 2);
          }
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(0, 50, 64, 8);
        });
      }
      this.texture("torch", 32, 48, (ctx) => {
        if (pixiWorldTextures.drawDefaultTorch) {
          pixiWorldTextures.drawDefaultTorch(ctx);
          return;
        }
        this.px(ctx, 14, 18, 4, 24, "#5b3a22");
        this.px(ctx, 11, 14, 10, 7, "#6b4a2b");
        this.px(ctx, 13, 6, 6, 11, "#f97316");
        this.px(ctx, 15, 2, 4, 9, "#facc15");
        this.px(ctx, 9, 9, 3, 7, "#ef4444");
      });
      for (let chapter = 1; chapter <= 3; chapter += 1) {
        this.texture(`torch-${chapter}`, 32, 48, (ctx) => {
          if (pixiWorldTextures.drawTorch) {
            pixiWorldTextures.drawTorch(ctx, chapter);
            return;
          }
          const flame = chapter === 1 ? "#f97316" : chapter === 2 ? "#84cc16" : "#8b5cf6";
          const core = chapter === 1 ? "#facc15" : chapter === 2 ? "#d9f99d" : "#dbeafe";
          const ember = chapter === 1 ? "#ef4444" : chapter === 2 ? "#22c55e" : "#60a5fa";
          const wood = chapter === 2 ? "#25452b" : chapter === 3 ? "#302450" : "#5b3a22";
          this.px(ctx, 14, 18, 4, 24, wood);
          this.px(ctx, 11, 14, 10, 7, chapter === 1 ? "#6b4a2b" : chapter === 2 ? "#1f3f2b" : "#21142f");
          this.px(ctx, 13, 6, 6, 11, flame);
          this.px(ctx, 15, 2, 4, 9, core);
          this.px(ctx, 9, 9, 3, 7, ember);
        });
      }
      this.texture("shadow", 48, 20, (ctx) => {
        if (pixiCommonTextures.drawShadow) {
          pixiCommonTextures.drawShadow(ctx);
          return;
        }
        const gradient = ctx.createRadialGradient(24, 10, 2, 24, 10, 24);
        gradient.addColorStop(0, "rgba(0,0,0,0.42)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 48, 20);
      });
      this.texture("reticle", 32, 32, (ctx) => {
        if (pixiCommonTextures.drawReticle) {
          pixiCommonTextures.drawReticle(ctx);
          return;
        }
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
      });
      this.texture("xp", 24, 24, (ctx) => {
        if (pixiCommonTextures.drawXpOrb) {
          pixiCommonTextures.drawXpOrb(ctx);
          return;
        }
        this.pixelDiamond(ctx, 12, 12, 8, "#7e9fb2", "#dbeafe");
      });
      this.texture("chest", 32, 32, (ctx) => {
        if (pixiCommonTextures.drawChest) {
          pixiCommonTextures.drawChest(ctx);
          return;
        }
        this.px(ctx, 7, 12, 18, 12, "#4b3421");
        this.px(ctx, 8, 9, 16, 6, "#caa35a");
        this.px(ctx, 10, 14, 12, 6, "#facc15");
        this.px(ctx, 15, 10, 3, 13, "#f8f3e9");
        this.outline(ctx, 7, 9, 18, 15);
      });
      this.texture("warning-ring", 64, 64, (ctx) => {
        if (pixiCommonTextures.drawWarningRing) {
          pixiCommonTextures.drawWarningRing(ctx);
          return;
        }
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
      });
      this.texture("slash-arc", 80, 52, (ctx) => {
        if (pixiCommonTextures.drawSlashArc) {
          pixiCommonTextures.drawSlashArc(ctx);
          return;
        }
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
      });
      this.texture("burst", 64, 64, (ctx) => {
        if (pixiCommonTextures.drawBurst) {
          pixiCommonTextures.drawBurst(ctx);
          return;
        }
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
      });
      this.texture("beam", 32, 8, (ctx) => {
        if (pixiCommonTextures.drawBeam) {
          pixiCommonTextures.drawBeam(ctx);
          return;
        }
        const gradient = ctx.createLinearGradient(0, 0, 32, 0);
        gradient.addColorStop(0, "rgba(255,255,255,0)");
        gradient.addColorStop(0.45, "rgba(255,255,255,0.9)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 8);
      });
      this.texture("fx-sword-cut", 96, 64, (ctx) => {
        if (pixiMeleeTextures.drawSwordCut) {
          pixiMeleeTextures.drawSwordCut(ctx);
          return;
        }
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
      });
      this.texture("fx-cleave", 128, 72, (ctx) => {
        if (pixiMeleeTextures.drawCleave) {
          pixiMeleeTextures.drawCleave(ctx);
          return;
        }
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
      });
      this.texture("fx-warrior-cone", 192, 118, (ctx) => {
        if (pixiMeleeTextures.drawWarriorCone) {
          pixiMeleeTextures.drawWarriorCone(ctx);
          return;
        }
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
        this.px(ctx, 152, 54, 24, 10, "#ffffff");
      });
      this.texture("fx-warrior-cleave-cone", 236, 158, (ctx) => {
        if (pixiMeleeTextures.drawWarriorCleaveCone) {
          pixiMeleeTextures.drawWarriorCleaveCone(ctx);
          return;
        }
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
      });
      this.texture("fx-warrior-spin-blade", 148, 148, (ctx) => {
        if (pixiMeleeTextures.drawWarriorSpinBlade) {
          pixiMeleeTextures.drawWarriorSpinBlade(ctx);
          return;
        }
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
      });
      this.texture("fx-charge-lane", 128, 64, (ctx) => {
        if (pixiMeleeTextures.drawChargeLane) {
          pixiMeleeTextures.drawChargeLane(ctx);
          return;
        }
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
      });
      this.texture("fx-spin", 96, 96, (ctx) => {
        if (pixiMeleeTextures.drawSpin) {
          pixiMeleeTextures.drawSpin(ctx);
          return;
        }
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.arc(48, 48, 18 + i * 10, -1.6 + i * 0.4, 1.0 + i * 0.3);
          ctx.stroke();
        }
      });
      this.texture("fx-impact-star", 72, 72, (ctx) => {
        if (pixiMeleeTextures.drawImpactStar) {
          pixiMeleeTextures.drawImpactStar(ctx);
          return;
        }
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
      });
      this.texture("fx-arrow-streak", 96, 24, (ctx) => {
        if (pixiRangedTextures.drawArrowStreak) {
          pixiRangedTextures.drawArrowStreak(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(38, 10, 46, 4);
        ctx.fillRect(78, 6, 12, 12);
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillRect(10, 11, 30, 2);
        ctx.fillRect(0, 6, 18, 2);
        ctx.fillRect(0, 16, 18, 2);
      });
      this.texture("fx-lightning", 112, 32, (ctx) => {
        if (pixiElementalTextures.drawLightning) {
          pixiElementalTextures.drawLightning(ctx);
          return;
        }
        const draw = (points, color) => {
          ctx.beginPath();
          ctx.moveTo(points[0][0], points[0][1]);
          for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        };
        draw([[2, 22], [21, 2], [40, 11], [55, 0], [69, 12], [83, 4], [110, 10], [109, 21], [84, 15], [64, 25], [51, 13], [38, 25], [23, 16], [5, 27]], "rgba(255,255,255,0.34)");
        draw([[4, 21], [22, 7], [39, 14], [52, 4], [65, 16], [82, 8], [108, 14], [107, 18], [83, 13], [64, 22], [52, 11], [39, 21], [23, 12], [6, 24]], "rgba(255,255,255,0.82)");
        draw([[5, 21], [22, 10], [38, 17], [52, 7], [64, 18], [82, 11], [107, 15], [82, 13], [64, 20], [52, 10], [38, 19], [22, 13]], "#ffffff");
        draw([[38, 16], [45, 1], [50, 4], [43, 14]], "rgba(255,255,255,0.72)");
        draw([[52, 5], [60, 27], [55, 28], [50, 9]], "rgba(255,255,255,0.72)");
      });
      this.texture("fx-frost-shards", 96, 96, (ctx) => {
        if (pixiElementalTextures.drawFrostShards) {
          pixiElementalTextures.drawFrostShards(ctx);
          return;
        }
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
      });
      this.texture("fx-fire-bloom", 96, 96, (ctx) => {
        if (pixiElementalTextures.drawFireBloom) {
          pixiElementalTextures.drawFireBloom(ctx);
          return;
        }
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
      });
      this.texture("fx-poison-cloud", 96, 72, (ctx) => {
        if (pixiElementalTextures.drawPoisonCloud) {
          pixiElementalTextures.drawPoisonCloud(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        [[22, 37, 20], [42, 30, 26], [62, 38, 22], [49, 48, 24], [30, 50, 16]].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(36, 22, 8, 8);
        ctx.fillRect(58, 35, 6, 6);
      });
      this.texture("fx-heal-cross", 80, 80, (ctx) => {
        if (pixiElementalTextures.drawHealCross) {
          pixiElementalTextures.drawHealCross(ctx);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(34, 14, 12, 52);
        ctx.fillRect(14, 34, 52, 12);
        ctx.strokeStyle = "rgba(255,255,255,0.52)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(40, 40, 31, 0, Math.PI * 2);
        ctx.stroke();
      });
      this.texture("fx-shield-hex", 96, 96, (ctx) => {
        if (pixiElementalTextures.drawShieldHex) {
          pixiElementalTextures.drawShieldHex(ctx);
          return;
        }
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
      });
      this.texture("fx-warning-target", 96, 96, (ctx) => {
        if (pixiElementalTextures.drawWarningTarget) {
          pixiElementalTextures.drawWarningTarget(ctx);
          return;
        }
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
      });
      this.texture("fx-shield-wedge", 128, 76, (ctx) => {
        if (pixiMeleeTextures.drawShieldWedge) {
          pixiMeleeTextures.drawShieldWedge(ctx);
          return;
        }
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
      });
      this.texture("fx-taunt-burst", 96, 96, (ctx) => {
        if (pixiMeleeTextures.drawTauntBurst) {
          pixiMeleeTextures.drawTauntBurst(ctx);
          return;
        }
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
      });
      this.texture("fx-arrow-fan", 128, 88, (ctx) => {
        if (pixiRangedTextures.drawArrowFan) {
          pixiRangedTextures.drawArrowFan(ctx);
          return;
        }
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
          ctx.fillStyle = "rgba(255,255,255,0.96)";
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - Math.cos(angle - 0.55) * 16, y2 - Math.sin(angle - 0.55) * 16);
          ctx.lineTo(x2 - Math.cos(angle + 0.55) * 16, y2 - Math.sin(angle + 0.55) * 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(0, 41, 42, 4);
      });
      this.texture("fx-arrow-rain", 96, 128, (ctx) => {
        if (pixiRangedTextures.drawArrowRain) {
          pixiRangedTextures.drawArrowRain(ctx);
          return;
        }
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
          ctx.fillStyle = "rgba(255,255,255,0.96)";
          ctx.beginPath();
          ctx.moveTo(x, y + 96);
          ctx.lineTo(x - 8, y + 78);
          ctx.lineTo(x + 8, y + 78);
          ctx.closePath();
          ctx.fill();
        }
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(8, 108, 80, 5);
      });
      this.texture("fx-pierce-lance", 144, 34, (ctx) => {
        if (pixiRangedTextures.drawPierceLance) {
          pixiRangedTextures.drawPierceLance(ctx);
          return;
        }
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
      });
      this.texture("fx-star-burst", 112, 112, (ctx) => {
        if (pixiElementalTextures.drawStarBurst) {
          pixiElementalTextures.drawStarBurst(ctx);
          return;
        }
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
      });
      this.texture("fx-meteor-fall", 128, 128, (ctx) => {
        if (pixiElementalTextures.drawMeteorFall) {
          pixiElementalTextures.drawMeteorFall(ctx);
          return;
        }
        ctx.save();
        ctx.translate(64, 64);
        ctx.rotate(-0.72);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(-66, -12, 82, 24);
        ctx.fillStyle = "rgba(255,255,255,0.52)";
        ctx.fillRect(-46, -7, 60, 14);
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.fillRect(9, -16, 30, 30);
        ctx.fillRect(4, -10, 42, 20);
        ctx.fillStyle = "rgba(255,255,255,0.36)";
        ctx.fillRect(-60, -23, 42, 7);
        ctx.fillRect(-70, 15, 56, 7);
        ctx.restore();
      });
      this.texture("fx-frost-snap", 112, 112, (ctx) => {
        if (pixiElementalTextures.drawFrostSnap) {
          pixiElementalTextures.drawFrostSnap(ctx);
          return;
        }
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
      });
      this.texture("fx-turret", 80, 80, (ctx) => {
        if (pixiClassTextures.drawTurret) {
          pixiClassTextures.drawTurret(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(28, 24, 26, 24);
        ctx.fillRect(50, 31, 22, 8);
        ctx.fillRect(35, 10, 12, 16);
        ctx.fillRect(22, 50, 36, 10);
        ctx.fillRect(18, 58, 10, 12);
        ctx.fillRect(52, 58, 10, 12);
        ctx.fillStyle = "rgba(255,255,255,0.32)";
        ctx.fillRect(31, 28, 20, 4);
        ctx.fillRect(56, 28, 12, 3);
      });
      this.texture("fx-mine", 72, 72, (ctx) => {
        if (pixiClassTextures.drawMine) {
          pixiClassTextures.drawMine(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.26)";
        ctx.beginPath();
        ctx.arc(36, 36, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 4;
        for (let i = 0; i < 6; i += 1) {
          const a = (Math.PI * 2 * i) / 6;
          ctx.beginPath();
          ctx.moveTo(36 + Math.cos(a) * 13, 36 + Math.sin(a) * 13);
          ctx.lineTo(36 + Math.cos(a) * 31, 36 + Math.sin(a) * 31);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillRect(27, 27, 18, 18);
      });
      this.texture("fx-drone", 84, 64, (ctx) => {
        if (pixiClassTextures.drawDrone) {
          pixiClassTextures.drawDrone(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.fillRect(32, 24, 20, 16);
        ctx.fillRect(15, 16, 16, 8);
        ctx.fillRect(53, 16, 16, 8);
        ctx.fillRect(15, 40, 16, 8);
        ctx.fillRect(53, 40, 16, 8);
        ctx.fillRect(27, 30, 30, 4);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(6, 18, 24, 3);
        ctx.fillRect(54, 18, 24, 3);
        ctx.fillRect(6, 43, 24, 3);
        ctx.fillRect(54, 43, 24, 3);
      });
      this.texture("fx-puppet", 72, 88, (ctx) => {
        if (pixiClassTextures.drawPuppet) {
          pixiClassTextures.drawPuppet(ctx);
          return;
        }
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(31, 23);
        ctx.moveTo(51, 0);
        ctx.lineTo(41, 23);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillRect(26, 16, 20, 18);
        ctx.fillRect(22, 35, 28, 28);
        ctx.fillRect(10, 39, 14, 8);
        ctx.fillRect(48, 39, 14, 8);
        ctx.fillRect(25, 63, 8, 18);
        ctx.fillRect(39, 63, 8, 18);
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(30, 21, 4, 4);
        ctx.fillRect(39, 21, 4, 4);
      });
      this.texture("fx-thread-knot", 64, 64, (ctx) => {
        if (pixiClassTextures.drawThreadKnot) {
          pixiClassTextures.drawThreadKnot(ctx);
          return;
        }
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(8, 32);
        ctx.bezierCurveTo(22, 6, 42, 58, 56, 32);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, 34);
        ctx.bezierCurveTo(22, 58, 42, 6, 56, 34);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(27, 27, 10, 10);
      });
      this.texture("fx-fist", 72, 72, (ctx) => {
        if (pixiClassTextures.drawFist) {
          pixiClassTextures.drawFist(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(22, 20, 10, 16);
        ctx.fillRect(34, 16, 10, 20);
        ctx.fillRect(46, 20, 10, 16);
        ctx.fillRect(17, 33, 43, 20);
        ctx.fillRect(30, 52, 18, 12);
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(8, 38, 12, 5);
        ctx.fillRect(54, 38, 12, 5);
      });
      this.texture("fx-palm-wave", 128, 62, (ctx) => {
        if (pixiClassTextures.drawPalmWave) {
          pixiClassTextures.drawPalmWave(ctx);
          return;
        }
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        for (let i = 0; i < 3; i += 1) {
          ctx.beginPath();
          ctx.arc(24, 31, 26 + i * 24, -0.55, 0.55);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.42)";
        ctx.fillRect(11, 24, 19, 14);
      });
      this.texture("fx-flask", 64, 64, (ctx) => {
        if (pixiClassTextures.drawFlask) {
          pixiClassTextures.drawFlask(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        ctx.fillRect(27, 7, 10, 18);
        ctx.fillRect(22, 24, 20, 8);
        ctx.fillRect(17, 31, 30, 20);
        ctx.fillStyle = "rgba(255,255,255,0.36)";
        ctx.fillRect(20, 38, 24, 10);
        ctx.fillRect(15, 51, 34, 5);
      });
      this.texture("fx-acid-splash", 96, 72, (ctx) => {
        if (pixiElementalTextures.drawAcidSplash) {
          pixiElementalTextures.drawAcidSplash(ctx);
          return;
        }
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
      });
      this.texture("fx-fire-pool", 104, 72, (ctx) => {
        if (pixiElementalTextures.drawFirePool) {
          pixiElementalTextures.drawFirePool(ctx);
          return;
        }
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
      });
      this.texture("fx-assassin-mark", 80, 80, (ctx) => {
        if (pixiClassTextures.drawAssassinMark) {
          pixiClassTextures.drawAssassinMark(ctx);
          return;
        }
        ctx.strokeStyle = "rgba(255,255,255,0.92)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(18, 18);
        ctx.lineTo(62, 62);
        ctx.moveTo(62, 18);
        ctx.lineTo(18, 62);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,0.82)";
        ctx.fillRect(36, 7, 8, 66);
        ctx.fillRect(29, 14, 22, 6);
      });
      this.texture("fx-shadow-cut", 112, 64, (ctx) => {
        if (pixiClassTextures.drawShadowCut) {
          pixiClassTextures.drawShadowCut(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.beginPath();
        ctx.moveTo(6, 44);
        ctx.lineTo(88, 10);
        ctx.lineTo(106, 18);
        ctx.lineTo(26, 55);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(0, 50, 44, 4);
        ctx.fillRect(11, 35, 28, 3);
      });
      this.texture("fx-smoke", 96, 64, (ctx) => {
        if (pixiElementalTextures.drawSmoke) {
          pixiElementalTextures.drawSmoke(ctx);
          return;
        }
        ctx.fillStyle = "rgba(255,255,255,0.36)";
        [[24, 38, 18], [42, 31, 22], [62, 37, 18], [50, 46, 24]].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }

    texture(key, width, height, draw) {
      const create = () =>
        pixiRuntime.createCanvasTexture
          ? pixiRuntime.createCanvasTexture(this.PIXI, width, height, draw)
          : (() => {
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.imageSmoothingEnabled = false;
              draw(ctx, width, height);
              return this.PIXI.Texture.from(canvas);
            })();
      if (this.textures.getOrCreate) return this.textures.getOrCreate(key, create);
      if (this.textures.has(key)) return this.textures.get(key);
      const texture = create();
      this.textures.set(key, texture);
      return texture;
    }

    render(now, dt, viewW, viewH) {
      if (!this.ready) return false;
      this.spritePool.begin();
      this.textPool.begin();
      this.graphicsPool.begin();
      this.particleEngine?.beginFrame?.(this.getParticleBudget());
      const state = this.getState();
      if (!state) {
        this.renderEmpty(now, viewW, viewH);
      } else {
        this.renderGame(state, now, dt, viewW, viewH);
      }
      this.spritePool.end();
      this.textPool.end();
      this.graphicsPool.end();
      this.updateDiagnostics(now, dt);
      this.trimPools(now);
      return true;
    }

    renderCodexActor(enemy, now, viewW, viewH) {
      if (!this.ready || !enemy || !pixiEnemies.renderEnemy) return false;
      this.spritePool.begin();
      this.textPool.begin();
      this.graphicsPool.begin();
      this.clearLayers();
      this.root.position.set(0, 0);
      this.world.position.set(0, 0);
      this.rect(this.layers.floor, viewW / 2, viewH / 2, viewW, viewH, "#080b0d", 1);
      this.drawGfxCircle(viewW / 2, viewH * 0.7, Math.max(30, enemy.radius * 1.55), "#020617", 0.42, enemy.color || "#7e9fb2", 0.12, 1, 1, "normal", 22);
      const actor = { ...enemy, x: viewW / 2, y: viewH * 0.62 };
      const visuals = { enemies: new Map([[String(actor.id), { x: actor.x, y: actor.y }]]) };
      pixiEnemies.renderEnemy(this, actor, now, visuals, { w: viewW, h: viewH });
      this.spritePool.end();
      this.textPool.end();
      this.graphicsPool.end();
      return true;
    }

    updateDiagnostics(now, dt) {
      this.perfFrameCount += 1;
      this.diagnostics.frameMs = Math.round(dt * 10000) / 10;
      this.diagnostics.sprites = this.spritePool.stats();
      this.diagnostics.texts = this.textPool.stats();
      this.diagnostics.graphics = this.graphicsPool.stats();
      this.diagnostics.particles = this.particleEngine?.stats?.() || { used: 0, retained: 0, skipped: 0, budget: this.getParticleBudget(), pressure: 0 };
      this.diagnostics.textures = this.textures.size;
      this.diagnostics.quality = this.quality;
      this.diagnostics.effectBudget = this.qualityPreset.effectBudget;
      this.diagnostics.particleBudget = this.getParticleBudget();
      if (now - this.lastPerfSampleAt >= PERF_SAMPLE_MS) {
        this.diagnostics.fps = Math.round((this.perfFrameCount * 1000) / Math.max(1, now - this.lastPerfSampleAt));
        this.perfFrameCount = 0;
        this.lastPerfSampleAt = now;
      }
    }

    trimPools(now, force = false) {
      if (!force && now - this.lastPoolTrimAt < POOL_TRIM_INTERVAL_MS) return;
      this.lastPoolTrimAt = now;
      const retain = this.qualityPreset.retain || POOL_RETAIN;
      this.spritePool.trim(retain.sprite);
      this.textPool.trim(retain.text);
      this.graphicsPool.trim(retain.graphics);
    }

    renderEmpty(now, viewW, viewH) {
      this.world.position.set(0, 0);
      this.clearLayers();
      this.rect(this.layers.floor, viewW / 2, viewH / 2, viewW, viewH, "#080b0d", 1);
      for (let i = 0; i < 90; i += 1) {
        const x = (this.noise(i * 11, 7) * viewW + now * 0.005) % viewW;
        const y = this.noise(i * 19, 13) * viewH;
        this.rect(this.layers.floor, x, y, i % 7 === 0 ? 3 : 2, i % 7 === 0 ? 3 : 2, "#f8f3e9", i % 7 === 0 ? 0.28 : 0.16);
      }
      this.renderScreenOverlays(viewW, viewH, 0);
    }

    renderGame(state, now, dt, viewW, viewH) {
      if (pixiScene.renderGameScene) {
        pixiScene.renderGameScene(this, state, now, dt, viewW, viewH);
        return;
      }
      this.clearLayers();
      const camera = this.getCamera();
      const shake = this.getScreenShake();
      const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      this.world.position.set(viewW / 2 - camera.x + shakeX, viewH / 2 - camera.y + shakeY);

      this.renderDungeon(state.room.world, now, state.room);
      this.renderObjective(state.room.objective, now);
      this.renderHazards(state.hazards || [], now);
      this.renderPickups(state, now);
      this.renderProjectiles(state.projectiles || [], now);
      this.renderEnemies(state.enemies || [], now, state.room.world);
      this.renderPlayers(state.players || [], now);
      this.renderFloatingEffects(this.getFloatingEffects() || [], now);
      this.renderAim(state, now);
      this.renderScreenOverlays(viewW, viewH, Number(state.players?.find((p) => p.id === this.getSelfId())?.hitIFrameTime || 0));
    }

    clearLayers() {
      if (pixiRuntime.clearLayerSet) {
        pixiRuntime.clearLayerSet(this.layers);
        pixiRuntime.clearLayerSet(this.screenLayers);
        return;
      }
      for (const layer of Object.values(this.layers)) layer.children.forEach((child) => (child.visible = false));
      for (const layer of Object.values(this.screenLayers)) layer.children.forEach((child) => (child.visible = false));
    }

    renderDungeon(world, now, room = {}) {
      if (pixiWorld.renderDungeon) {
        pixiWorld.renderDungeon(this, world, now, room);
        return;
      }
      if (!world) return;
      const chapter = Math.max(1, Math.min(3, Math.round(Number(room.chapter || room.floor || 1))));
      const theme =
        chapter === 2
          ? {
              base: "#09140f",
              side: "#0d1c13",
              torch: "#84cc16",
              torchSoft: "#bef264",
              scarA: "#84cc16",
              scarB: "#6ba79e"
            }
          : chapter === 3
            ? {
                base: "#080913",
                side: "#0d1020",
                torch: "#8b5cf6",
                torchSoft: "#93c5fd",
                scarA: "#b985c8",
                scarB: "#7e9fb2"
              }
            : {
                base: "#0f0c0c",
                side: "#11100f",
                torch: "#f97316",
                torchSoft: "#facc15",
                scarA: "#d6b76d",
                scarB: "#7e9fb2"
              };
      this.rect(this.layers.floor, world.w / 2, world.h / 2, world.w, world.h, theme.base, 1).zIndex = -2400;
      const tileSize = 96;
      for (let y = tileSize / 2; y < world.h; y += tileSize) {
        for (let x = tileSize / 2; x < world.w; x += tileSize) {
          const variant = Math.floor(this.noise(Math.floor(x / tileSize) * 23, Math.floor(y / tileSize) * 31) * 6) % 6;
          const tileKey = pixiTextureKeys.floorTileKey ? pixiTextureKeys.floorTileKey(chapter, variant) : `floor-tile-${chapter}-${variant}`;
          const tile = this.sprite(tileKey, this.layers.floor, x, y, tileSize / 64, tileSize / 64, "#ffffff", 0.96);
          tile.zIndex = -2200;
        }
      }
      for (let x = tileSize / 2; x < world.w; x += tileSize) {
        const wallKey = pixiTextureKeys.wallBlockKey ? pixiTextureKeys.wallBlockKey(chapter) : `wall-block-${chapter}`;
        const top = this.sprite(wallKey, this.layers.floor, x, 28, tileSize / 64, 0.9, "#ffffff", 1);
        const bottom = this.sprite(wallKey, this.layers.floor, x, world.h - 26, tileSize / 64, 0.9, "#ffffff", 1);
        top.zIndex = -900;
        bottom.zIndex = world.h + 900;
      }
      for (let y = tileSize / 2; y < world.h; y += tileSize) {
        this.rect(this.layers.floor, 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
        this.rect(this.layers.floor, world.w - 18, y, 34, tileSize, theme.side, 1).zIndex = -880;
      }
      for (let i = 0; i < 20; i += 1) {
        const side = i % 4;
        const t = this.noise(i * 19, 3);
        const x = side < 2 ? 150 + t * (world.w - 300) : side === 2 ? 58 : world.w - 58;
        const y = side >= 2 ? 150 + t * (world.h - 300) : side === 0 ? 70 : world.h - 70;
        const glow = 0.08 + Math.sin(now / 240 + i) * 0.025;
        this.sprite(`torch-${chapter}`, this.layers.floor, x, y, 1.25, 1.25, "#ffffff", 0.82).zIndex = y - 12;
        this.rect(this.layers.floor, x, y - 4, 96, 34, theme.torch, glow).zIndex = y - 20;
      }
      for (let i = 0; i < 44; i += 1) {
        const x = this.noise(i * 19, 3) * world.w;
        const y = this.noise(i * 31, 9) * world.h;
        const w = 36 + this.noise(i, 14) * 82;
        const h = 4 + this.noise(i, 18) * 7;
        this.rect(this.layers.floor, x, y, w, h, i % 3 === 0 ? theme.scarB : theme.scarA, 0.04 + Math.sin(now / 1700 + i) * 0.012);
      }
      if (chapter >= 2) {
        const count = chapter === 2 ? 28 : 36;
        for (let i = 0; i < count; i += 1) {
          const x = this.noise(i * 17, chapter * 41) * world.w;
          const y = this.noise(i * 29, chapter * 53) * world.h;
          const scale = chapter === 2 ? 0.5 + this.noise(i, 5) * 0.35 : 0.34 + this.noise(i, 7) * 0.28;
          const key = chapter === 2 ? "fx-poison-cloud" : "fx-frost-shards";
          const tint = chapter === 2 ? "#84cc16" : "#8b5cf6";
          const sprite = this.sprite(key, this.layers.floor, x, y, scale, scale * 0.62, tint, chapter === 2 ? 0.08 : 0.07);
          sprite.blendMode = "add";
          sprite.zIndex = -1800;
          sprite.rotation = this.noise(i, 11) * Math.PI;
        }
      }
    }

    renderObjective(objective, now) {
      if (pixiWorld.renderObjective) {
        pixiWorld.renderObjective(this, objective, now);
        return;
      }
      if (!objective) return;
      const color = objective.type === "defense" ? "#7e9fb2" : "#caa35a";
      this.sprite("chest", this.layers.pickup, objective.x, objective.y, 1.5, 1.5, color, 0.72).zIndex = objective.y;
      this.ring(objective.x, objective.y, objective.radius || 70, color, 0.22 + Math.sin(now / 250) * 0.06, 2);
      if (objective.maxHp > 0) {
        this.bar(objective.x, objective.y - (objective.radius || 60) - 24, 90, 8, objective.hp / objective.maxHp, "#86efac");
      }
    }

    renderHazards(hazards, now) {
      if (pixiHazards.renderHazards) {
        pixiHazards.renderHazards(this, hazards, now);
        return;
      }
      for (const hazard of hazards) {
        const color = hazard.color || (hazard.hostile ? "#f87171" : "#7e9fb2");
        const armed = hazard.armed || !hazard.armTime;
        const alpha = armed ? 0.32 : 0.16 + Math.sin(now / 90) * 0.08;
        const flavor = `${hazard.type || ""} ${hazard.style || ""} ${hazard.damageType || ""}`.toLowerCase();
        if (hazard.length && hazard.width) {
          const beamColor = flavor.includes("sniper") || flavor.includes("laser") || hazard.hostile ? "#ef4444" : color;
          const beam = this.sprite("beam", this.layers.hazard, hazard.x, hazard.y, hazard.length / 32, Math.max(0.55, hazard.width / 9), beamColor, armed ? 0.5 : 0.24);
          beam.rotation = hazard.angle || 0;
          beam.blendMode = "add";
          beam.zIndex = hazard.y - 8;
          continue;
        }
        const radius = hazard.radius || 40;
        if (hazard.type === "engineer_turret") {
          const size = hazard.small ? 0.72 : 0.92;
          const turret = this.sprite("fx-turret", this.layers.hazard, hazard.x, hazard.y + Math.sin(now / 170 + hazard.id) * 1.2, size, size, "#d6b76d", 0.96);
          turret.zIndex = hazard.y + 8;
          this.sprite("shadow", this.layers.hazard, hazard.x, hazard.y + 25, 0.72, 0.56, "#000000", 0.55).zIndex = hazard.y - 2;
          this.drawGfxLightning(hazard.x + 5, hazard.y - 10, hazard.x + 31, hazard.y - 15, "#67e8f9", armed ? 0.36 + Math.sin(now / 90) * 0.08 : 0.14, hazard.y + 9, 3.2, 4, 7, now / 140 + hazard.id);
          if (!armed) this.ring(hazard.x, hazard.y, radius * 0.72, "#9ee6ff", 0.16 + Math.sin(now / 80) * 0.05, 2);
          continue;
        }
        if (hazard.type === "engineer_drone") {
          const drone = this.sprite("fx-drone", this.layers.hazard, hazard.x, hazard.y - 8 + Math.sin(now / 120 + hazard.id) * 4, 0.76, 0.76, "#d6b76d", 0.96);
          drone.zIndex = hazard.y + 22;
          drone.blendMode = "normal";
          this.sprite("shadow", this.layers.hazard, hazard.x, hazard.y + 18, 0.54, 0.38, "#000000", 0.38).zIndex = hazard.y - 2;
          this.drawGfxLightning(hazard.x - 20, hazard.y - 9, hazard.x + 20, hazard.y - 7, "#67e8f9", 0.28 + Math.sin(now / 110) * 0.06, hazard.y + 23, 3.4, 5, 8, now / 120 + hazard.id);
          continue;
        }
        if (hazard.type === "engineer_mine") {
          const mine = this.sprite("fx-mine", this.layers.hazard, hazard.x, hazard.y, 0.72, 0.72, armed ? "#9ee6ff" : "#d6b76d", 0.92);
          mine.rotation = Math.sin(now / 160 + hazard.id) * 0.08;
          mine.blendMode = "add";
          mine.zIndex = hazard.y + 2;
          this.ring(hazard.x, hazard.y, Math.max(28, radius * (armed ? 0.78 : 0.56)), "#9ee6ff", armed ? 0.18 : 0.12 + Math.sin(now / 95) * 0.05, 2);
          continue;
        }
        if (hazard.type === "puppet") {
          if (Number.isFinite(hazard.moveFromX) && Number.isFinite(hazard.moveFromY) && (hazard.moveTime || 0) > 0) {
            this.lineFx("fx-lightning", hazard.moveFromX, hazard.moveFromY, hazard.x, hazard.y, 10, "#f5d0fe", 0.4, hazard.y + 50, "add");
          }
          const puppet = this.sprite("fx-puppet", this.layers.hazard, hazard.x, hazard.y + Math.sin(now / 190 + hazard.id) * 1.5, 0.84, 0.84, "#b985c8", 0.98);
          puppet.zIndex = hazard.y + 10;
          this.sprite("fx-thread-knot", this.layers.hazard, hazard.x, hazard.y - 28, 0.46, 0.46, "#f5d0fe", 0.42 + Math.sin(now / 140) * 0.1).zIndex = hazard.y + 12;
          continue;
        }
        if (hazard.type === "arrow_rain") {
          const pulse = 1 + Math.sin(now / 210 + hazard.id) * 0.012;
          this.drawGfxCircle(hazard.x, hazard.y, radius * pulse, "#4a3415", armed ? 0.035 : 0.025, "#f1d08b", armed ? 0.36 : 0.24, armed ? 2.4 : 1.8, hazard.y + 4, "add", 56);
          this.drawGfxCircle(hazard.x, hazard.y, radius * 0.72, "#000000", 0, "#fde68a", armed ? 0.12 : 0.08, 1.2, hazard.y + 5, "add", 42);
          if (!armed) continue;
          const dropCount = 9;
          const skyY = hazard.y - radius * 2.1;
          for (let i = 0; i < dropCount; i += 1) {
            const seed = this.noise(hazard.id + i * 17, 4);
            const t = (now / 360 + i * 0.19 + hazard.id * 0.07) % 1;
            const lane = (i - (dropCount - 1) / 2) * radius * 0.12 + (seed - 0.5) * radius * 0.12;
            const x = hazard.x + lane;
            const slant = (i % 2 ? -1 : 1) * 3;
            const topY = skyY + t * radius * 2.45;
            this.lineFx("beam", x - slant, topY - 42, x + slant, topY + 30, i % 3 === 0 ? 4 : 3, i % 3 === 0 ? "#fff7ed" : "#f1d08b", 0.58 + t * 0.18, hazard.y + 20 + i, "add");
            const arrow = this.sprite("fx-arrow-rain", this.layers.hazard, x, topY + 8, 0.2, 0.28, i % 3 === 0 ? "#fff7ed" : "#f1d08b", 0.18);
            arrow.zIndex = hazard.y + 28 + i;
            arrow.blendMode = "add";
          }
          continue;
        }
        if (hazard.type === "alchemy_bomb") {
          if (Number.isFinite(hazard.spawnFromX) && Number.isFinite(hazard.spawnFromY)) {
            this.lineFx("beam", hazard.spawnFromX, hazard.spawnFromY, hazard.x, hazard.y, 5, "#bef264", 0.18, hazard.y + 4, "add");
          }
          const bomb = this.sprite("fx-flask", this.layers.hazard, hazard.x, hazard.y - (armed ? 0 : Math.sin(now / 90) * 3), 0.74, 0.74, "#bef264", 0.94);
          bomb.rotation = Math.sin(now / 130 + hazard.id) * 0.25;
          bomb.zIndex = hazard.y + 6;
          this.ring(hazard.x, hazard.y, radius, "#bef264", armed ? 0.18 : 0.12 + Math.sin(now / 90) * 0.06, 2);
          continue;
        }
        if (hazard.type === "alchemy_pool" || hazard.type === "acid_pool" || hazard.type === "poison_pool") {
          const fireMode = hazard.mode === "fire" || flavor.includes("fire");
          const key = fireMode ? "fx-fire-pool" : "fx-acid-splash";
          const tint = fireMode ? "#f97316" : "#bef264";
          const pool = this.sprite(key, this.layers.hazard, hazard.x, hazard.y, radius / 70, radius / 86, tint, armed ? (fireMode ? 0.46 : 0.32) : 0.24);
          pool.blendMode = "add";
          pool.zIndex = hazard.y - 10;
          this.ring(hazard.x, hazard.y, radius, tint, 0.12 + Math.sin(now / 180 + hazard.id) * 0.03, 2);
          continue;
        }
        if (hazard.type === "alchemy_elixir_mist") {
          const mist = this.sprite("fx-heal-cross", this.layers.hazard, hazard.x, hazard.y, radius / 86, radius / 86, "#bbf7d0", 0.3 + Math.sin(now / 160) * 0.06);
          mist.blendMode = "add";
          mist.zIndex = hazard.y - 8;
          this.ring(hazard.x, hazard.y, radius, "#bbf7d0", 0.13, 2);
          continue;
        }
        if (hazard.type === "meteor") {
          const marker = this.sprite("fx-warning-target", this.layers.hazard, hazard.x, hazard.y, radius / 48, radius / 48, "#f97316", armed ? 0.24 : 0.42);
          marker.rotation = now / 720;
          marker.blendMode = "add";
          marker.zIndex = hazard.y - 14;
          const fallAlpha = Math.max(0.16, 0.42 - (hazard.armTime || 0) * 0.1);
          const angle = Math.atan2(118, 60);
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);
          const rockX = hazard.x - 92;
          const rockY = hazard.y - 190;
          this.drawGfxLine(rockX - ux * 116, rockY - uy * 116, rockX + ux * 8, rockY + uy * 8, 20, "#f97316", fallAlpha * 0.16, hazard.y + 24, "add");
          this.drawGfxLine(rockX - ux * 92, rockY - uy * 92, rockX + ux * 20, rockY + uy * 20, 8, "#fde68a", fallAlpha * 0.18, hazard.y + 25, "add");
          continue;
        }
        const poison = flavor.includes("poison") || flavor.includes("acid") || flavor.includes("venom");
        const fire = flavor.includes("fire") || flavor.includes("flame") || flavor.includes("burn") || flavor.includes("meteor") || flavor.includes("bomber") || flavor.includes("blast");
        const heal = flavor.includes("heal") || flavor.includes("elixir") || flavor.includes("holy");
        const shield = flavor.includes("shield") || flavor.includes("barrier");
        if (poison) {
          const cloud = this.sprite("fx-poison-cloud", this.layers.hazard, hazard.x, hazard.y, radius / 54, radius / 70, "#bef264", armed ? 0.34 : 0.2);
          cloud.blendMode = "add";
          cloud.zIndex = hazard.y - 12;
        } else if (fire) {
          const flame = this.sprite("fx-fire-bloom", this.layers.hazard, hazard.x, hazard.y, radius / 64, radius / 64, "#f97316", armed ? 0.28 : 0.17);
          flame.blendMode = "add";
          flame.zIndex = hazard.y - 12;
        } else if (heal) {
          const cross = this.sprite("fx-heal-cross", this.layers.hazard, hazard.x, hazard.y, radius / 76, radius / 76, "#86efac", armed ? 0.28 : 0.16);
          cross.blendMode = "add";
          cross.zIndex = hazard.y - 12;
        } else if (shield) {
          const hex = this.sprite("fx-shield-hex", this.layers.hazard, hazard.x, hazard.y, radius / 76, radius / 76, "#bfdbfe", armed ? 0.34 : 0.2);
          hex.blendMode = "add";
          hex.zIndex = hazard.y - 12;
        }
        this.ring(hazard.x, hazard.y, radius, poison ? "#bef264" : fire ? "#f97316" : heal ? "#86efac" : color, alpha, armed ? 3 : 2);
        if (armed) {
          const warningKey = hazard.hostile ? "fx-warning-target" : "warning-ring";
          const warning = this.sprite(warningKey, this.layers.hazard, hazard.x, hazard.y, radius / 45, radius / 45, poison ? "#bef264" : fire ? "#f97316" : color, hazard.hostile ? 0.16 : 0.14);
          warning.blendMode = "add";
          warning.zIndex = hazard.y - 10;
        }
      }
    }

    renderPickups(state, now) {
      if (pixiPickups.renderPickups) {
        pixiPickups.renderPickups(this, state, now);
        return;
      }
      for (const orb of state.xpOrbs || []) {
        const bob = Math.sin(now / 180 + Number(orb.id || 0)) * 3;
        const scale = Math.max(0.45, (orb.radius || 10) / 16);
        this.sprite("xp", this.layers.pickup, orb.x, orb.y + bob, scale, scale, "#7e9fb2", 0.94).zIndex = orb.y;
      }
      for (const chest of state.relicChests || []) {
        const scale = Math.max(0.8, (chest.radius || 18) / 20);
        this.sprite("chest", this.layers.pickup, chest.x, chest.y + Math.sin(now / 220) * 2, scale, scale, "#facc15", 1).zIndex = chest.y;
        this.ring(chest.x, chest.y, (chest.radius || 22) * 1.7, "#facc15", 0.18 + Math.sin(now / 180) * 0.05, 2);
      }
      for (const pickup of state.fieldPickups || []) {
        if (pickup.type === "equipment") {
          const bob = Math.sin(now / 170 + Number(pickup.id || 0)) * 2;
          this.sprite("chest", this.layers.pickup, pickup.x, pickup.y + bob, 0.66, 0.66, "#fbbf24", 1).zIndex = pickup.y;
          continue;
        }
        const health = pickup.type === "health_potion";
        const tint = health ? "#4ade80" : "#67e8f9";
        this.sprite(health ? "fx-flask" : "xp", this.layers.pickup, pickup.x, pickup.y + Math.sin(now / 170 + Number(pickup.id || 0)) * 2, 0.72, 0.72, tint, 0.96).zIndex = pickup.y;
      }
    }

    renderProjectiles(projectiles, now) {
      if (pixiProjectiles.renderProjectiles) {
        pixiProjectiles.renderProjectiles(this, projectiles, now);
        return;
      }
      for (const projectile of projectiles) {
        const style = projectile.style || projectile.classId || "";
        const styleInfo = styleClassifier.classifyProjectileStyle
          ? styleClassifier.classifyProjectileStyle(style, projectile.classId)
          : null;
        const poison = projectile.poison || (styleInfo ? styleInfo.poison : style.includes("poison") || style.includes("venom") || style.includes("acid"));
        const fire = styleInfo ? styleInfo.fire : style.includes("fire") || style.includes("meteor") || style.includes("mortar") || style.includes("bomb");
        const lightning = styleInfo ? styleInfo.lightning : style.includes("electric") || style.includes("chain") || style.includes("rail") || style.includes("shock");
        const laser = styleInfo ? styleInfo.laser : style.includes("mecha_laser_shot") || style.includes("laser_shot");
        const arrow = styleInfo ? styleInfo.arrow : style.includes("arrow") || style.includes("ranger") || style.includes("sniper") || style.includes("shuriken");
        const thread = styleInfo ? styleInfo.thread : style.includes("thread");
        const flask = styleInfo ? styleInfo.flask : style.includes("alchemy") || style.includes("bottle");
        const shadow = styleInfo ? styleInfo.shadow : style.includes("shuriken") || style.includes("shadow") || style.includes("assassin");
        const key =
          thread ? "fx-thread-knot" :
          flask ? "fx-flask" :
          shadow ? "fx-shadow-cut" :
          lightning ? "fx-lightning" :
          fire ? "fx-fire-bloom" :
          poison ? "fx-poison-cloud" :
          arrow ? (style.includes("piercing") || projectile.pierce > 0 ? "fx-pierce-lance" : "fx-arrow-streak") :
          this.projectileTextureKey(projectile);
        const base = Math.max(0.55, (projectile.radius || 6) / 7);
        const scaleX =
          thread ? Math.max(0.38, base * 0.52) :
          flask ? Math.max(0.45, base * 0.58) :
          shadow ? Math.max(0.35, base * 0.54) :
          lightning ? Math.max(0.62, base * 0.78) :
          arrow ? Math.max(0.62, base * (style.includes("piercing") ? 0.72 : 0.95)) :
          fire ? Math.max(0.34, base * 0.48) :
          poison ? Math.max(0.28, base * 0.44) :
          base;
        const scaleY =
          thread ? Math.max(0.28, base * 0.36) :
          flask ? Math.max(0.45, base * 0.58) :
          shadow ? Math.max(0.22, base * 0.34) :
          lightning ? Math.max(0.38, base * 0.52) :
          arrow ? Math.max(0.38, base * (style.includes("piercing") ? 0.42 : 0.62)) :
          fire ? Math.max(0.34, base * 0.48) :
          poison ? Math.max(0.26, base * 0.36) :
          base;
        const tint =
          thread ? "#f5d0fe" :
          flask ? (style.includes("fire") ? "#f97316" : "#bef264") :
          shadow ? "#c4b5fd" :
          poison ? "#bef264" :
          fire ? "#f97316" :
          laser ? "#67e8f9" :
          lightning ? "#9ee6ff" :
          projectile.hostile ? "#f87171" :
          projectile.color || "#f8f3e9";
        if (laser && this.drawGfxLine) {
          const angle = projectile.angle || 0;
          const radius = Math.max(3.5, projectile.radius || 4.5);
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);
          const fromX = projectile.x - ux * radius * 3.3;
          const fromY = projectile.y - uy * radius * 3.3;
          const toX = projectile.x + ux * radius * 3.15;
          const toY = projectile.y + uy * radius * 3.15;
          this.drawGfxLine(fromX, fromY, toX, toY, Math.max(6, radius * 1.18), "#06131f", 0.28, projectile.y + 2, "add");
          this.drawGfxLine(fromX, fromY, toX, toY, Math.max(3.6, radius * 0.72), "#67e8f9", 0.72, projectile.y + 4, "add");
          this.drawGfxLine(fromX + ux * radius * 0.6, fromY + uy * radius * 0.6, toX, toY, Math.max(1.8, radius * 0.26), "#f8fafc", 0.78, projectile.y + 7, "add");
          this.drawGfxCircle(toX, toY, Math.max(4, radius * 0.58), "#67e8f9", 0.18, "#f8fafc", 0.36, 1.6, projectile.y + 9, "add", 10);
          continue;
        }
        if (lightning && this.drawGfxLightning) {
          const angle = projectile.angle || 0;
          const mechaShot = style.includes("mecha_laser_shot");
          const radius = mechaShot ? Math.max(3.5, projectile.radius || 4.5) : Math.max(7, projectile.radius || 6);
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);
          const fromX = projectile.x - ux * radius * (mechaShot ? 3.1 : 2.35);
          const fromY = projectile.y - uy * radius * (mechaShot ? 3.1 : 2.35);
          const toX = projectile.x + ux * radius * (mechaShot ? 3.5 : 2.25);
          const toY = projectile.y + uy * radius * (mechaShot ? 3.5 : 2.25);
          const width = mechaShot ? Math.max(3.2, radius * 0.46) : Math.max(5, radius * 0.62);
          const phase = now / 96 + Number(projectile.id || 0) * 0.37;
          this.drawGfxLightning(fromX, fromY, toX, toY, "#67e8f9", 0.88, projectile.y + 4, width, 7, radius * 1.15, phase);
          this.drawGfxLightning(projectile.x - ux * radius * 0.85, projectile.y - uy * radius * 0.85, toX + ux * radius * 0.35, toY + uy * radius * 0.35, "#f8fafc", 0.46, projectile.y + 11, Math.max(2, width * 0.32), 4, radius * 0.54, phase + 0.41);
          this.drawGfxCircle(toX, toY, Math.max(5, radius * 0.62), "#67e8f9", 0.24, "#f8fafc", 0.36, 1.8, projectile.y + 14, "add", 10);
          if (projectile.splash) this.ring(projectile.x, projectile.y, projectile.splash, projectile.hostile ? "#f87171" : "#7e9fb2", 0.08, 2);
          continue;
        }
        const sprite = this.sprite(key, this.layers.projectile, projectile.x, projectile.y, scaleX, scaleY, tint, 1);
        sprite.rotation = projectile.angle || 0;
        sprite.blendMode = fire || lightning || poison || thread || shadow ? "add" : "normal";
        sprite.zIndex = projectile.y + 4;
        if (thread) {
          const angle = projectile.angle || 0;
          this.drawGfxLightning(projectile.x - Math.cos(angle) * 28, projectile.y - Math.sin(angle) * 16, projectile.x + Math.cos(angle) * 10, projectile.y + Math.sin(angle) * 6, "#b985c8", 0.32, projectile.y + 3, 2.6, 4, 7, now / 180 + Number(projectile.id || 0));
        }
        if (flask) {
          const drop = this.sprite(style.includes("fire") ? "fx-fire-pool" : "fx-acid-splash", this.layers.projectile, projectile.x - Math.cos(projectile.angle || 0) * 14, projectile.y - Math.sin(projectile.angle || 0) * 14, 0.22, 0.18, style.includes("fire") ? "#f97316" : "#bef264", 0.22);
          drop.rotation = projectile.angle || 0;
          drop.blendMode = "add";
          drop.zIndex = projectile.y + 2;
        }
        if (projectile.splash) this.ring(projectile.x, projectile.y, projectile.splash, projectile.hostile ? "#f87171" : "#7e9fb2", 0.08, 2);
      }
    }

    renderEnemies(enemies, now, world) {
      if (pixiEnemies.renderEnemies) {
        pixiEnemies.renderEnemies(this, enemies, now, world);
        return;
      }
      const visuals = this.getVisuals();
      for (const enemy of enemies) {
        const pos = this.visualPosition(visuals.enemies, enemy);
        const last = this.lastEnemyPositions.get(String(enemy.id)) || pos;
        const dx = pos.x - last.x;
        const targetX = Number.isFinite(enemy.windup?.x) ? enemy.windup.x : Number.isFinite(enemy.chargeMove?.toX) ? enemy.chargeMove.toX : pos.x + dx;
        const face = targetX >= pos.x ? 1 : -1;
        this.lastEnemyPositions.set(String(enemy.id), { x: pos.x, y: pos.y });

        const shadowScale = Math.max(0.55, enemy.radius / 28);
        this.sprite("shadow", this.layers.actor, pos.x, pos.y + enemy.radius * 0.66, shadowScale, shadowScale, "#000000", 0.74).zIndex = pos.y - 2;

        const frame = Math.floor(now / (enemy.type === "bat" ? 95 : 160)) % 4;
        const key = enemy.type === "boss" ? this.bossTextureKey(enemy, now) : this.enemyTextureKey(enemy.type || "slime", frame);
        const size = enemy.type === "boss" ? BOSS_SIZE : SPRITE_SIZE;
        const scale = Math.max(0.72, (enemy.radius * (enemy.type === "boss" ? 4.75 : 4.05)) / size);
        const sprite = this.sprite(key, this.layers.actor, pos.x, pos.y, scale * face, scale, "#ffffff", 1);
        sprite.zIndex = pos.y;
        if (enemy.windup) {
          sprite.rotation = Math.sin(now / 90) * 0.035;
          sprite.alpha = 0.86 + Math.sin(now / 80) * 0.12;
        }
        if (enemy.type === "boss" && enemy.phaseTransitionTime > 0) {
          const maxTime = Math.max(0.1, Number(enemy.phaseTransitionTimeMax || enemy.phaseTransitionTime || 1));
          const ratio = Math.max(0, Math.min(1, Number(enemy.phaseTransitionTime || 0) / maxTime));
          const pulse = 1 + Math.sin(now / 70) * 0.08;
          const color = enemy.phaseAuraColor || enemy.color || "#f97316";
          this.ring(pos.x, pos.y, enemy.radius * 1.92 * pulse, color, 0.46 * ratio, 5);
          this.ring(pos.x, pos.y, enemy.radius * (1.34 + (1 - ratio) * 0.42), "#fff7ed", 0.2 * ratio, 3);
          this.fx("fx-impact-star", pos.x, pos.y - enemy.radius * 0.18, enemy.radius / 42, enemy.radius / 42, color, 0.42 * ratio, pos.y + 160, now / 180, "add");
        }
        if (enemy.statusEffects?.includes("freeze")) this.ring(pos.x, pos.y, enemy.radius * 1.35, "#93c5fd", 0.52, 3);
        if (enemy.statusEffects?.includes("barrier") || enemy.barrier > 0) this.ring(pos.x, pos.y, enemy.radius * 1.58, "#bfdbfe", 0.42, 3);
        if (enemy.elite) this.drawEliteBodyMutation(pos.x, pos.y, enemy.radius, enemy.affix || "", pos.y + 1);
        drawEnemyStatusGraphics(this, enemy, pos, now, pos.y + (enemy.type === "boss" ? 80 : 20));
        drawEnemyStatusPips(this, enemy, pos, pos.y + (enemy.type === "boss" ? 80 : 20));
        this.healthShieldBar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, 5, enemy.hp, enemy.maxHp, enemy.barrier, "#ef4444");
      }
    }

    renderPlayers(players, now) {
      if (pixiPlayers.renderPlayers) {
        pixiPlayers.renderPlayers(this, players, now);
        return;
      }
      const visuals = this.getVisuals();
      const selfId = this.getSelfId();
      for (const player of players) {
        if (player.spectator) continue;
        const pos = this.visualPosition(visuals.players, player);
        const last = this.lastPlayerPositions.get(String(player.id)) || pos;
        const moving = Math.hypot(pos.x - last.x, pos.y - last.y) > 0.2 || player.dashMove?.active;
        this.lastPlayerPositions.set(String(player.id), { x: pos.x, y: pos.y });

        const face = Math.cos(Number(player.facing || 0)) >= 0 ? 1 : -1;
        const frame = Math.floor(now / (moving ? 100 : 220)) % 4;
        const key = this.actorTextureKey(player.classId || "warrior", frame, player.attacking ? "attack" : "idle");
        const scaleBase = (player.id === selfId ? 1.14 : 1.02) * (player.sizeScale || 1);
        const scale = Math.max(1.02, ((player.id === selfId ? 86 : 76) * scaleBase) / SPRITE_SIZE);
        const bob = Math.sin(now / (moving ? 105 : 240) + this.hash(player.id) * 4) * (moving ? 2 : 0.6);

        this.sprite("shadow", this.layers.actor, pos.x, pos.y + 27 * scaleBase, scale * 1.1, scale * 0.9, "#000000", 0.72).zIndex = pos.y - 2;
        const dashActive = Boolean(player.dashMove?.active);
        const warriorDash = (player.classId || "warrior") === "warrior";
        if (dashActive && warriorDash && this.drawGfxDashDust) {
          const dx = pos.x - last.x;
          const dy = pos.y - last.y;
          const travel = Math.hypot(dx, dy);
          const dashAngle = travel > 3 ? Math.atan2(dy, dx) : Number(player.facing || 0);
          const fromX = travel > 3 ? last.x : pos.x - Math.cos(dashAngle) * scaleBase * 52;
          const fromY = travel > 3 ? last.y : pos.y - Math.sin(dashAngle) * scaleBase * 52;
          this.drawGfxDashDust(fromX, fromY, pos.x, pos.y, scaleBase * 28, dashAngle, "#caa35a", 0.58, pos.y - 1, now / 180, {});
        } else if (moving && !dashActive) {
          const trail = this.sprite(key, this.layers.actor, pos.x - face * 18, pos.y + bob, scale * face, scale, "#ffffff", 0.16);
          trail.zIndex = pos.y - 1;
        }
        const sprite = this.sprite(key, this.layers.actor, pos.x, pos.y + bob, scale * face, scale, "#ffffff", player.downed ? 0.55 : 1);
        sprite.zIndex = pos.y + 2;
        if (Date.now() - Number(player.lastAttackAt || 0) < 160) {
          const angle = Number(player.facing || 0);
          const classId = player.classId || "warrior";
          const fxX = pos.x + Math.cos(angle) * 30;
          const fxY = pos.y + Math.sin(angle) * 18 - 2;
          if (classId === "ranger") {
            this.fx("fx-arrow-streak", fxX + Math.cos(angle) * 18, fxY, face * 0.78, 0.7, player.color || "#f1d08b", 0.78, pos.y + 24, angle, "add");
          } else if (classId === "mage") {
            this.fx("fx-star-burst", fxX, fxY, 0.36, 0.36, "#dbeafe", 0.72, pos.y + 24, angle + 0.2, "add");
          } else if (classId === "engineer") {
            this.drawGfxLightning(pos.x + Math.cos(angle) * 12, pos.y + Math.sin(angle) * 8, fxX + Math.cos(angle) * 24, fxY + Math.sin(angle) * 10, "#67e8f9", 0.72, pos.y + 24, 5, 5, 11, now / 95 + this.hash(player.id));
          } else if (classId === "puppeteer") {
            this.fx("fx-thread-knot", fxX, fxY, 0.44, 0.36, "#f5d0fe", 0.72, pos.y + 24, angle, "add");
            this.drawGfxLightning(pos.x + Math.cos(angle) * 8, pos.y + Math.sin(angle) * 5, fxX + Math.cos(angle) * 4, fxY + Math.sin(angle) * 4, "#b985c8", 0.32, pos.y + 23, 2.4, 4, 7, now / 140 + this.hash(player.id));
          } else if (classId === "martialist") {
            this.fx("fx-fist", fxX, fxY, 0.42, 0.42, "#fde68a", 0.76, pos.y + 24, angle, "add");
          } else if (classId === "alchemist") {
            this.fx("fx-flask", fxX, fxY, 0.4, 0.4, "#bef264", 0.68, pos.y + 24, angle, "add");
            this.fx("fx-acid-splash", fxX + Math.cos(angle) * 12, fxY + Math.sin(angle) * 7, 0.28, 0.22, "#bef264", 0.34, pos.y + 23, angle, "add");
          } else if (classId === "assassin") {
            this.fx("fx-shadow-cut", fxX, fxY, face * 0.58, 0.42, "#c4b5fd", 0.78, pos.y + 24, angle, "add");
            this.fx("fx-smoke", pos.x - face * 12, pos.y + 3, 0.42, 0.34, "#21142f", 0.28, pos.y + 18, 0, "add");
          } else if (classId === "warrior") {
            // Warrior attack visuals come from authoritative server effect events.
          } else {
            this.fx("fx-sword-cut", fxX, fxY, face * 0.72, 0.72, player.color || "#ffffff", 0.82, pos.y + 24, angle, "add");
          }
        }
        if (player.shield > 0) this.ring(pos.x, pos.y, 33 * scaleBase, "#bfdbfe", 0.5, 3);
        if (player.statusEffects?.includes("taunt_guard")) this.ring(pos.x, pos.y, 42 * scaleBase, "#f97316", 0.34, 4);
        if (player.statusEffects?.includes("mecha")) {
          const mechaRadius = (player.id === selfId ? 25 : 22) * scaleBase;
          const angle = Number(player.facing || 0);
          const ux = Math.cos(angle);
          const uy = Math.sin(angle);
          const px = -uy;
          const py = ux;
          const pulse = 0.5 + Math.sin(now / 118 + this.hash(player.id)) * 0.5;
          const cx = pos.x;
          const cy = pos.y + bob + 2;
          this.drawGfxCircle(cx, cy + mechaRadius * 0.22, mechaRadius * 1.46, "#0f172a", 0.15, "#d6b76d", 0.28, 2, pos.y + 40, "add", 28);
          this.drawGfxGear?.(cx, cy, mechaRadius * (0.98 + pulse * 0.06), "#d6b76d", 0.34, pos.y + 43, now / 520, 10);
          this.drawGfxRuneRing?.(cx, cy, mechaRadius * 1.18, "#67e8f9", 0.26, pos.y + 44, -now / 720, 6);
          for (const side of [-1, 1]) {
            const sx = cx + px * side * mechaRadius * 1.04 - ux * mechaRadius * 0.05;
            const sy = cy + py * side * mechaRadius * 1.04 - uy * mechaRadius * 0.05;
            this.drawGfxPath?.([
              { x: sx + ux * mechaRadius * 0.72, y: sy + uy * mechaRadius * 0.72 },
              { x: sx - ux * mechaRadius * 0.18 + px * side * mechaRadius * 0.48, y: sy - uy * mechaRadius * 0.18 + py * side * mechaRadius * 0.48 },
              { x: sx - ux * mechaRadius * 0.86 + px * side * mechaRadius * 0.2, y: sy - uy * mechaRadius * 0.86 + py * side * mechaRadius * 0.2 },
              { x: sx - ux * mechaRadius * 0.46 - px * side * mechaRadius * 0.34, y: sy - uy * mechaRadius * 0.46 - py * side * mechaRadius * 0.34 },
            ], "#241a07", 0.72, "#d6b76d", 0.82, 3, pos.y + 48 + side, "normal");
            this.drawGfxLine?.(sx - ux * mechaRadius * 0.42, sy - uy * mechaRadius * 0.42, sx + ux * mechaRadius * 0.5, sy + uy * mechaRadius * 0.5, 4, "#67e8f9", 0.42, pos.y + 51 + side, "add");
            const bx = cx - ux * mechaRadius * 1.02 + px * side * mechaRadius * 0.62;
            const by = cy - uy * mechaRadius * 1.02 + py * side * mechaRadius * 0.62;
            this.drawGfxLine?.(bx, by, bx - ux * mechaRadius * (0.82 + pulse * 0.22), by - uy * mechaRadius * (0.82 + pulse * 0.22), 7, "#f97316", 0.22 + pulse * 0.08, pos.y + 39 + side, "add");
            this.drawGfxCircle?.(bx, by, mechaRadius * 0.14, "#67e8f9", 0.42, "#f8f3e9", 0.36, 1.4, pos.y + 52 + side, "add", 10);
          }
          this.drawGfxCircle?.(cx + ux * mechaRadius * 0.64, cy + uy * mechaRadius * 0.64, mechaRadius * 0.19, "#67e8f9", 0.48, "#f8f3e9", 0.62, 2, pos.y + 54, "add", 12);
          this.renderEngineerLaserChargeHud(player, cx, cy, mechaRadius, now, pos.y + 64);
        }
        if (player.id === selfId) {
          this.healthShieldBar(pos.x, pos.y - 56 * scaleBase, 86, 8, player.hp, player.maxHp, player.shield, "#ef4444");
          const dashMax = Math.max(0.1, Number(player.stats?.dashCooldownMax || 1.35));
          const dashRatio = player.dashReady ? 1 : Math.max(0, Math.min(1, 1 - Number(player.dashCooldown || 0) / dashMax));
          this.bar(pos.x, pos.y - 45 * scaleBase, 86, 4, dashRatio, "#8aa8bd");
        }
      }
    }

    renderEngineerLaserChargeHud(player, x, y, mechaRadius, now, zIndex) {
      const max = Math.max(0, Math.floor(Number(player.engineerLaserChargeMax || 0)));
      const charge = Math.max(0, Math.min(max, Math.floor(Number(player.engineerLaserCharge || 0))));
      if (max <= 0 || charge <= 0) return;

      const ratio = charge / max;
      const pulse = 0.5 + Math.sin(now / 88 + this.hash(player.id) * 0.17) * 0.5;
      const coreRadius = mechaRadius * (0.22 + ratio * 0.24 + pulse * 0.04);
      const orbitRadius = mechaRadius * (1.05 + ratio * 0.36);
      const tint = "#c084fc";
      const hot = charge >= max - 1 ? "#f5d0fe" : "#67e8f9";
      const alpha = 0.32 + ratio * 0.36 + pulse * 0.12;
      const spin = now / (220 - ratio * 70);

      this.drawGfxCircle?.(x, y, orbitRadius, "#170728", 0.1 + ratio * 0.04, tint, 0.2 + ratio * 0.24, 2 + ratio * 2, zIndex, "add", 34);
      this.drawGfxRuneRing?.(x, y, orbitRadius * 0.82, tint, 0.22 + ratio * 0.18, zIndex + 1, -spin, max);
      this.drawGfxCircle?.(x, y, coreRadius * 1.42, tint, 0.18 + ratio * 0.18, hot, alpha, 2, zIndex + 5, "add", 18);
      this.drawGfxCircle?.(x, y, coreRadius * 0.58, hot, 0.34 + ratio * 0.28, "#ffffff", 0.24 + ratio * 0.36, 1.6, zIndex + 7, "add", 12);

      for (let i = 0; i < max; i += 1) {
        const lit = i < charge;
        const a = -Math.PI * 0.5 + (i - (max - 1) / 2) * 0.38;
        const px = x + Math.cos(a) * orbitRadius * 0.62;
        const py = y + Math.sin(a) * orbitRadius * 0.48 - mechaRadius * 0.08;
        this.drawGfxCircle?.(
          px,
          py,
          lit ? mechaRadius * (0.12 + pulse * 0.02) : mechaRadius * 0.08,
          lit ? hot : "#26132f",
          lit ? 0.52 : 0.12,
          lit ? "#ffffff" : tint,
          lit ? 0.56 : 0.16,
          1,
          zIndex + 12 + i,
          "add",
          8
        );
      }

      for (let i = 0; i < 4 + charge * 2; i += 1) {
        const a = spin * 0.55 + (Math.PI * 2 * i) / (4 + charge * 2);
        const outer = orbitRadius * (0.96 + (i % 2) * 0.18);
        const inner = coreRadius * (1.1 + (i % 3) * 0.18);
        const tx = x + Math.cos(a) * inner;
        const ty = y + Math.sin(a) * inner * 0.78;
        const sx = x + Math.cos(a) * outer;
        const sy = y + Math.sin(a) * outer * 0.78;
        this.drawGfxLine?.(sx, sy, tx, ty, 2.2 + ratio * 1.4, i % 2 ? hot : tint, 0.12 + ratio * 0.18, zIndex + 20 + i, "add");
      }
    }

    renderFloatingEffects(effects, now) {
      this.diagnostics.effects = effects.length;
      this.effectRenderTrace = [];
      const startIndex = pixiRuntime.effectStartIndex
        ? pixiRuntime.effectStartIndex(effects.length, this.qualityPreset.effectBudget)
        : Math.max(0, effects.length - this.qualityPreset.effectBudget);
      for (let effectIndex = startIndex; effectIndex < effects.length; effectIndex += 1) {
        const effect = effects[effectIndex];
        if (!effect || effect.age < 0) continue;
        const progress = pixiEffects.effectProgress
          ? pixiEffects.effectProgress(effect)
          : Math.max(0, Math.min(1, effect.age / Math.max(0.1, effect.ttl || 0.7)));
        const alpha = Math.max(0, 1 - progress);
        const color = effect.color || "#f8f3e9";
        const style = effect.style || "";
        const rawRadius = Math.max(18, Number(effect.radius || 42));
        const radius = pixiEffects.effectRadius
          ? pixiEffects.effectRadius(effect, rawRadius)
          : effect.kind === "warning" ? Math.min(rawRadius, 190) :
            effect.kind === "meteor" ? Math.min(rawRadius, 150) :
            effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy" ? Math.min(rawRadius, 92) :
            effect.kind === "freeze" || effect.kind === "slow" ? Math.min(rawRadius, 120) :
            Math.min(rawRadius, 110);
        if (pixiEffects.renderFloatingTextEffect && pixiEffects.renderFloatingTextEffect(this, effect, progress, alpha, color)) {
          this.noteEffectRenderer("pixi-effects:floating-text", effect, style);
          continue;
        }
        if (effect.kind === "damage" || effect.kind === "heal" || effect.kind === "xp" || (effect.kind === "poison" && effect.value)) {
          const style = {
            fontFamily: "Inter, sans-serif",
            fontWeight: "900",
            fontSize: effect.critical ? 26 : effect.kind === "xp" ? 15 : 18,
            fill: effect.kind === "heal" ? "#bbf7d0" : effect.kind === "xp" ? "#dbeafe" : color,
            stroke: { color: "#000000", width: effect.critical ? 5 : 3 }
          };
          const text = this.textPool.next(this.layers.effect, style);
          text.text = effect.kind === "xp" ? `+${effect.value || 0} XP` : effect.kind === "heal" ? `+${effect.value || 0}` : String(effect.value || "");
          text.position.set(effect.x, effect.y - progress * 28);
          text.alpha = alpha;
          text.scale.set(1 + (effect.critical ? 0.24 : 0.1) * Math.max(0, 1 - progress * 3));
          text.zIndex = effect.y + 100;
          this.noteEffectRenderer("pixi-renderer:floating-text-fallback", effect, style);
          continue;
        }
        if (pixiSkinEffects.renderSkillEffectOverride?.(this, effect, progress, alpha, radius, now)) {
          this.noteEffectRenderer("pixi-skin-effects:skill-override", effect, style);
          continue;
        }
        const styledEffectKey = style || effect.kind || "";
        if (this.renderEngineerLaserModuleEffect(effect, progress, alpha, radius, color, styledEffectKey)) {
          this.noteEffectRenderer("pixi-renderer:laser-module-fallback", effect, styledEffectKey);
          continue;
        }
        if (this.renderUnifiedWarriorSkillEffect(effect, progress, alpha, radius, color, styledEffectKey)) {
          this.noteEffectRenderer("pixi-renderer:warrior-unified-fallback", effect, styledEffectKey);
          continue;
        }
        if (styledEffectKey === "warrior_spin" && this.renderWarriorBladeWhirlwindOverride(effect, progress, alpha, radius, color)) {
          this.noteEffectRenderer("pixi-renderer:warrior-spin-fallback", effect, styledEffectKey);
          continue;
        }
        if (styledEffectKey === "taunt" && this.renderWarriorTauntPulseOverride(effect, progress, alpha, radius, color)) {
          this.noteEffectRenderer("pixi-renderer:taunt-fallback", effect, styledEffectKey);
          continue;
        }
        if (shouldPrioritizeMageSkillRenderer(styledEffectKey, effect) && this.renderStyledSkillEffect(effect, progress, alpha, radius, color, styledEffectKey)) {
          this.noteEffectRenderer(this.lastStyledSkillRenderer || "pixi-skill-effects:mage-priority", effect, styledEffectKey);
          continue;
        }
        if (pixiEffects.renderNeonEffect && pixiEffects.renderNeonEffect(this, effect, progress, alpha, radius, color, styledEffectKey)) {
          this.noteEffectRenderer("pixi-effects:neon-fallback", effect, styledEffectKey);
          continue;
        }
        if (this.renderStyledSkillEffect(effect, progress, alpha, radius, color, styledEffectKey)) {
          this.noteEffectRenderer(this.lastStyledSkillRenderer || "pixi-skill-effects", effect, styledEffectKey);
          continue;
        }
        if (pixiEffects.renderCoreSkillEffect && pixiEffects.renderCoreSkillEffect(this, effect, progress, alpha, radius, color, style)) {
          this.noteEffectRenderer("pixi-effects:core-fallback", effect, styledEffectKey);
          continue;
        }
        if (pixiEffects.renderSecondaryEffect && pixiEffects.renderSecondaryEffect(this, effect, progress, alpha, radius, color, style)) {
          this.noteEffectRenderer("pixi-effects:secondary-fallback", effect, styledEffectKey);
          continue;
        }
        if (pixiEffects.renderDefaultBurstEffect && pixiEffects.renderDefaultBurstEffect(this, effect, progress, alpha, radius, color)) {
          this.noteEffectRenderer("pixi-effects:default-fallback", effect, styledEffectKey);
          continue;
        }
        if (effect.kind === "slash") {
          const cleave = style.includes("cleave") || style.includes("brute") || style.includes("mini_cleave") || style.includes("warrior");
          const puppet = style.includes("puppet") || style.includes("thread");
          const assassin = style.includes("shadow") || style.includes("assassin") || style.includes("stalker");
          const key = cleave ? "fx-cleave" : "fx-sword-cut";
          const slashScale = (cleave ? 0.72 : 0.82) + progress * (cleave ? 0.32 : 0.24);
          const slash = this.fx(key, effect.x, effect.y, slashScale, slashScale, assassin ? "#8a6f9e" : puppet ? "#f5d0fe" : color, alpha * 0.92, effect.y + 96, Number(effect.angle || 0) + progress * 0.42, "add");
          if (assassin || puppet) {
            if (puppet && this.drawGfxLightning) {
              const a = Number(effect.angle || 0);
              this.drawGfxLightning(effect.x - Math.cos(a) * 28, effect.y - Math.sin(a) * 16, effect.x + Math.cos(a) * 12, effect.y + Math.sin(a) * 7, "#b985c8", alpha * 0.28, effect.y + 88, 2.6, 4, 8, progress + effect.x * 0.01);
            } else {
              const smoke = this.fx("fx-smoke", effect.x - Math.cos(effect.angle || 0) * 18, effect.y - Math.sin(effect.angle || 0) * 18, 0.55, 0.42, "#21142f", alpha * 0.32, effect.y + 88, Number(effect.angle || 0), "add");
              smoke.alpha *= 0.8;
            }
          }
          if (style.includes("shield") || style.includes("slam")) {
            this.fx("fx-impact-star", effect.x, effect.y, radius / 62, radius / 62, "#facc15", alpha * 0.58, effect.y + 100, progress * 0.8, "add");
          }
        } else if (effect.kind === "spin") {
          const spin = this.fx("fx-spin", effect.x, effect.y, radius / 50 + progress * 0.35, radius / 50 + progress * 0.35, color, alpha * 0.78, effect.y + 94, Number(effect.angle || 0) + progress * 2.6, "add");
          spin.alpha *= style.includes("warrior") ? 1 : 0.82;
        } else if (effect.kind === "dash" || effect.kind === "shot" || effect.kind === "chain") {
          const angle = Number(effect.angle || 0);
          if (effect.kind === "chain" || style.includes("chain") || style.includes("lightning") || style.includes("electric")) {
            const line = this.effectEndpoints?.(effect, radius, angle) || {
              fromX: effect.x - Math.cos(angle) * radius * 0.56,
              fromY: effect.y - Math.sin(angle) * radius * 0.56,
              toX: effect.x + Math.cos(angle) * radius * 0.56,
              toY: effect.y + Math.sin(angle) * radius * 0.56
            };
            if (this.drawGfxLightning) {
              this.drawGfxLightning(line.fromX, line.fromY, line.toX, line.toY, "#67e8f9", alpha * 0.88, effect.y + 92, 8, 8, 18, progress * 1.7);
            } else {
              const bolt = this.fx("fx-lightning", effect.x, effect.y, Math.max(0.75, radius / 68), 0.9, "#9ee6ff", alpha * 0.92, effect.y + 92, angle, "add");
              bolt.alpha *= 0.95;
            }
            this.fx("fx-impact-star", line.fromX, line.fromY, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, progress, "add");
            this.fx("fx-impact-star", line.toX, line.toY, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, -progress, "add");
          } else if (effect.kind === "shot") {
            const poison = style.includes("poison") || style.includes("venom") || style.includes("acid") || color === "#9aa15f";
            const sniper = style.includes("sniper") || style.includes("snipe");
            const fire = style.includes("fire") || style.includes("mortar") || style.includes("meteor");
            const key = fire ? "fx-fire-bloom" : poison ? "fx-poison-cloud" : "fx-arrow-streak";
            const sx = fire ? 0.42 + radius / 110 : poison ? 0.46 + radius / 150 : Math.max(0.85, radius / 74);
            const sy = fire ? 0.32 + radius / 160 : poison ? 0.34 + radius / 190 : sniper ? 0.72 : 0.82;
            this.fx(key, effect.x, effect.y, sx, sy, poison ? "#bef264" : fire ? "#f97316" : sniper ? "#fee2e2" : color, alpha * (sniper ? 0.92 : 0.76), effect.y + 90, angle, "add");
            if (sniper) this.fx("beam", effect.x, effect.y, Math.max(2.4, radius / 9), 0.34, "#ef4444", alpha * 0.3, effect.y + 86, angle, "add");
          } else {
            const charge = style.includes("shield_charge");
            const blink = style.includes("mage_blink");
            const shadow = style.includes("shadow");
            const martial = style.includes("martial");
            const line = this.effectEndpoints?.(effect, radius, angle) || {
              fromX: effect.x - Math.cos(angle) * radius,
              fromY: effect.y - Math.sin(angle) * radius,
              toX: effect.x + Math.cos(angle) * radius,
              toY: effect.y + Math.sin(angle) * radius
            };
            if (charge) {
              const ux = Math.cos(angle);
              const uy = Math.sin(angle);
              const shieldX = line.toX + ux * radius * 0.16;
              const shieldY = line.toY + uy * radius * 0.16;
              this.drawGfxShieldWake?.(line.fromX, line.fromY, line.toX, line.toY, Math.max(56, radius * 0.64), angle, "#f97316", alpha * 0.72, effect.y + 86, progress);
              if (this.drawGfxFrontShield) {
                this.drawGfxFrontShield(shieldX, shieldY, angle, Math.max(58, radius * 0.66), "#f97316", alpha * 0.88, effect.y + 106, progress);
              } else {
                this.drawGfxShieldWall?.(shieldX, shieldY, angle, Math.max(54, radius * 0.58), "#ffd166", alpha * 0.78, effect.y + 104, progress > 0.62);
              }
            } else if (blink) {
              this.fx("fx-frost-shards", effect.x, effect.y, 0.5, 0.5, "#93c5fd", alpha * 0.68, effect.y + 88, angle, "add");
            } else if (style.includes("warrior_dash") && this.drawGfxDashDust) {
              this.drawGfxDashDust(line.fromX, line.fromY, line.toX, line.toY, Math.max(30, Math.min(74, radius * 0.34)), angle, "#caa35a", alpha * 0.68, effect.y + 86, progress, {});
            } else if (shadow) {
              this.fx("fx-smoke", effect.x, effect.y, Math.max(0.54, radius / 95), 0.46, "#21142f", alpha * 0.46, effect.y + 82, angle, "add");
              this.fx("fx-shadow-cut", line.toX, line.toY, 0.82, 0.56, "#c4b5fd", alpha * 0.68, effect.y + 92, angle, "add");
            } else if (martial) {
              this.fx("fx-impact-star", line.toX, line.toY, 0.68, 0.68, "#fde68a", alpha * 0.52, effect.y + 92, progress, "add");
            } else {
              this.drawGfxSparkSpray?.(line.toX, line.toY, radius * 0.34, color, alpha * 0.22, effect.y + 92, 7, progress * 4, angle, Math.PI * 0.8);
            }
            if (charge) this.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.72, 0.72, "#facc15", alpha * 0.52, effect.y + 98, progress, "add");
          }
        } else if (effect.kind === "meteor") {
          const fallEnd = 0.72;
          const fallT = Math.max(0, Math.min(1, progress / fallEnd));
          const fall = fallT * fallT * (3 - fallT * 2);
          const impact = Math.max(0, Math.min(1, (progress - fallEnd) / (1 - fallEnd)));
          const startX = effect.x - radius * 0.84;
          const startY = effect.y - radius * 3.2;
          const x = startX + (effect.x - startX) * fall;
          const y = startY + (effect.y - startY) * fall;
          this.drawGfxLine(startX, startY, x, y, 18, "#f97316", alpha * 0.16, effect.y + 98, "add");
          this.drawGfxLine(startX + 16, startY - 8, x + 8, y - 4, 6, "#fde68a", alpha * 0.16, effect.y + 99, "add");
          if (impact > 0) {
            this.fx("fx-fire-bloom", effect.x, effect.y, radius / 82 + impact * 0.34, radius / 82 + impact * 0.34, "#f97316", alpha * 0.62, effect.y + 100, progress * 1.4, "add");
            this.ring(effect.x, effect.y, radius * (0.35 + impact * 0.7), "#f97316", alpha * 0.2, 5);
          }
        } else if (effect.kind === "freeze" || effect.kind === "slow") {
          const snap = progress < 0.32 ? 1 + progress * 0.4 : 1.12 - (progress - 0.32) * 0.3;
          this.fx("fx-frost-shards", effect.x, effect.y, radius / 88 * snap, radius / 88 * snap, "#dbeafe", alpha * 0.8, effect.y + 92, progress * 0.4, "add");
          this.ring(effect.x, effect.y, radius * (0.82 + progress * 0.12), "#93c5fd", alpha * 0.28, 3);
        } else if (effect.kind === "warning") {
          const danger = style.includes("sniper") || style.includes("lock") ? "#ef4444" : color || "#ef4444";
          if (style.includes("arrow_rain") || style.includes("sniper_lock") || style.includes("charge_predict") || style.includes("spit_cast")) {
            continue;
          }
          this.fx("fx-warning-target", effect.x, effect.y, radius / 48, radius / 48, danger, 0.2 + alpha * 0.34, effect.y + 50, progress * 0.18, "add");
          if (style.includes("boss") || style.includes("bomber") || radius > 90) {
            this.ring(effect.x, effect.y, radius * (0.98 - progress * 0.05), danger, 0.16 + alpha * 0.18, 4);
          }
        } else if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") {
          const heal = effect.kind === "holy" || effect.kind === "revive" || effect.kind === "cleanse" || style.includes("heal");
          this.fx(heal ? "fx-heal-cross" : "fx-shield-hex", effect.x, effect.y, radius / 76 + progress * 0.16, radius / 76 + progress * 0.16, heal ? "#bbf7d0" : color, alpha * (heal ? 0.5 : 0.56), effect.y + 82, heal ? progress * 0.65 : progress * 0.18, "add");
          this.ring(effect.x, effect.y, radius * (0.62 + progress * 0.28), heal ? "#86efac" : color, alpha * 0.22, heal ? 2 : 4);
        } else if (effect.kind === "poison") {
          this.fx("fx-poison-cloud", effect.x, effect.y, radius / 76, radius / 90, color, alpha * 0.46, effect.y + 80, progress * 0.22, "add");
        } else if (effect.kind === "trap") {
          this.fx("fx-warning-target", effect.x, effect.y, radius / 62, radius / 62, color, alpha * 0.42, effect.y + 76, progress * 0.8, "add");
        } else if (effect.kind === "arcane" || effect.kind === "star" || effect.kind === "level" || effect.kind === "chest") {
          const tint = effect.kind === "chest" ? "#facc15" : effect.kind === "level" ? "#dbeafe" : color;
          this.fx("fx-impact-star", effect.x, effect.y, radius / 72 + progress * 0.2, radius / 72 + progress * 0.2, tint, alpha * 0.62, effect.y + 86, progress * 1.8, "add");
          this.ring(effect.x, effect.y, radius * (0.45 + progress * 0.45), tint, alpha * 0.22, 3);
        } else if (effect.kind === "impact") {
          const heavy = style.includes("heavy") || style.includes("critical") || style.includes("slam") || effect.heavy;
          const playerHit = style.includes("player");
          const particleColor = playerHit ? "#ef4444" : color;
          this.renderParticlePreset("hitSpark", {
            x: effect.x,
            y: effect.y,
            radius: radius * (heavy ? 1.08 : 0.82),
            color: particleColor,
            alpha: alpha * (heavy ? 0.86 : 0.58),
            zIndex: effect.y + 94,
            phase: progress * 1.2,
            count: heavy ? 14 : 9,
            direction: Number.isFinite(effect.angle) ? Number(effect.angle) : undefined,
            spread: heavy ? Math.PI * 2 : Math.PI * 0.9
          }) || this.fx("fx-impact-star", effect.x, effect.y, radius / (heavy ? 58 : 78), radius / (heavy ? 58 : 78), particleColor, alpha * (heavy ? 0.82 : 0.52), effect.y + 94, progress * 1.2, "add");
          if (heavy) this.ring(effect.x, effect.y, radius * (0.4 + progress * 0.34), color, alpha * 0.2, 4);
        } else if (effect.kind === "explosion" || effect.kind === "death") {
          const poison = style.includes("poison") || style.includes("splitter");
          const fire = style.includes("fire") || style.includes("bomber") || style.includes("blast") || style.includes("meteor");
          const preset = poison ? "poisonBurst" : fire ? "fireBurst" : "hitSpark";
          const presetColor = poison ? "#bef264" : fire ? "#f97316" : color;
          this.renderParticlePreset(preset, {
            x: effect.x,
            y: effect.y,
            radius: radius * (0.9 + progress * 0.28),
            color: presetColor,
            alpha: alpha * 0.68,
            zIndex: effect.y + 90,
            phase: progress * 1.1,
            count: fire ? 14 : poison ? 11 : 10
          }) || this.fx(poison ? "fx-poison-cloud" : fire ? "fx-fire-bloom" : "fx-impact-star", effect.x, effect.y, radius / 78 + progress * 0.3, radius / 78 + progress * 0.3, presetColor, alpha * 0.62, effect.y + 90, progress * 1.1, "add");
          this.ring(effect.x, effect.y, radius * (0.5 + progress * 0.48), poison ? "#bef264" : fire ? "#f97316" : color, alpha * 0.2, 5);
        } else {
          this.sprite("burst", this.layers.effect, effect.x, effect.y, radius / 48, radius / 48, color, alpha * 0.42).zIndex = effect.y + 80;
        }
      }
    }

    renderEngineerLaserModuleEffect(effect, progress, alpha, radius, color, style) {
      const s = String(style || "").toLowerCase();
      const beam = s === "engineer_laser_module_beam" || s === "engineer_mecha_giant_laser";
      const core = s === "engineer_laser_module_core" || s === "engineer_mecha_laser_core";
      const charge = s === "engineer_laser_module_charge" || s === "engineer_mecha_laser_charge";
      if (!beam && !core && !charge) return false;

      const tint = effect.color || color || "#c084fc";
      const t = Math.max(0, Math.min(1, progress));
      const peak = Math.sin(t * Math.PI);

      if (charge) {
        const step = Math.max(1, Math.floor(Number(effect.chargeStep || 1)));
        const max = Math.max(1, Math.floor(Number(effect.chargeMax || 4)));
        const chargeRatio = Math.max(0.12, Math.min(1, step / max));
        const release = Boolean(effect.release);
        const gather = 1 - Math.pow(1 - t, 2.65);
        const baseRadius = Math.max(46, Number(effect.radius || radius || 64));
        const coreRadius = baseRadius * (0.22 + chargeRatio * 0.14 + peak * 0.04);
        const orbitRadius = baseRadius * (0.76 + chargeRatio * 0.42);
        const z = effect.y + 128;
        const hot = release ? "#f5d0fe" : "#67e8f9";
        const activeAlpha = alpha * (0.78 + chargeRatio * 0.24);
        const spin = t * Math.PI * (release ? 2.9 : 1.65) + step * 0.72;

        this.drawGfxCircle(effect.x, effect.y, orbitRadius * (0.56 + peak * 0.12), "#170728", activeAlpha * 0.1, tint, activeAlpha * (0.16 + chargeRatio * 0.18), 2.2 + chargeRatio * 2, z - 10, "add", 40);
        this.drawGfxRuneRing?.(effect.x, effect.y, orbitRadius * (0.52 + chargeRatio * 0.14), tint, activeAlpha * (0.18 + chargeRatio * 0.16), z - 4, -spin, max);
        this.drawGfxCircle(effect.x, effect.y, coreRadius * 1.6, tint, activeAlpha * (0.12 + chargeRatio * 0.1), hot, activeAlpha * (0.24 + chargeRatio * 0.3), 2.4, z + 5, "add", 22);
        this.drawGfxCircle(effect.x, effect.y, coreRadius * (0.72 + peak * 0.18), hot, activeAlpha * (0.28 + chargeRatio * 0.22), "#ffffff", activeAlpha * (0.3 + chargeRatio * 0.34), 1.8, z + 10, "add", 16);

        const moteCount = release ? 12 : 8;
        for (let i = 0; i < moteCount; i += 1) {
          const seed = this.noise?.(effect.id || 1, i * 31 + step * 7) || Math.sin(i * 12.989 + step);
          const a = spin + (Math.PI * 2 * i) / moteCount + seed * 0.34;
          const startR = orbitRadius * (0.92 + (i % 3) * 0.12);
          const endR = coreRadius * (0.45 + (i % 2) * 0.16);
          const r = startR + (endR - startR) * gather;
          const tailR = Math.min(startR, r + 22 * (1 - gather + chargeRatio * 0.22));
          const sx = effect.x + Math.cos(a) * tailR;
          const sy = effect.y + Math.sin(a) * tailR * 0.82;
          const tx = effect.x + Math.cos(a) * r;
          const ty = effect.y + Math.sin(a) * r * 0.82;
          const moteAlpha = activeAlpha * (0.2 + chargeRatio * 0.18) * (release ? 1.12 : 1);
          this.drawGfxLine(sx, sy, tx, ty, release ? 4.2 : 3.2, i % 2 ? hot : tint, moteAlpha, z + 14 + i, "add");
          this.drawGfxDiamond?.(tx, ty, 3.5 + chargeRatio * 2.2, i % 2 ? hot : tint, moteAlpha * 0.9, z + 26 + i, -a, "#ffffff");
        }

        for (let i = 0; i < max; i += 1) {
          const lit = i < step;
          const a = -Math.PI * 0.5 + (i - (max - 1) / 2) * 0.34;
          const px = effect.x + Math.cos(a) * orbitRadius * 0.38;
          const py = effect.y + Math.sin(a) * orbitRadius * 0.32 - 4;
          this.drawGfxCircle(px, py, lit ? 4.8 + peak * 1.2 : 3.4, lit ? hot : "#26132f", lit ? activeAlpha * 0.46 : activeAlpha * 0.08, lit ? "#ffffff" : tint, lit ? activeAlpha * 0.58 : activeAlpha * 0.18, 1.2, z + 38 + i, "add", 8);
        }

        if (release) {
          this.drawGfxImpactBurst?.(effect.x, effect.y, orbitRadius * (0.58 + peak * 0.2), tint, activeAlpha * 0.5, z + 45, progress * 3.2, 14);
          this.drawGfxCircle(effect.x, effect.y, orbitRadius * (0.84 + t * 0.28), "#ffffff", activeAlpha * 0.04, hot, activeAlpha * Math.max(0, 0.42 - t * 0.18), 5, z + 44, "add", 54);
        }
        return true;
      }

      if (core) {
        const coreRadius = Math.max(54, Number(effect.radius || radius || 88) * 0.58);
        const z = effect.y + 126;
        this.drawGfxCircle(effect.x, effect.y, coreRadius * (0.72 + peak * 0.18), "#170728", alpha * 0.22, tint, alpha * 0.58, 4, z - 6, "add", 32);
        this.drawGfxCircle(effect.x, effect.y, coreRadius * (0.28 + peak * 0.1), tint, alpha * 0.36, "#f5d0fe", alpha * 0.72, 3, z + 5, "add", 18);
        this.drawGfxImpactBurst?.(effect.x, effect.y, coreRadius * (0.84 + peak * 0.2), tint, alpha * 0.36, z + 12, progress * 2.8, 10);
        return true;
      }

      const angle = Number(effect.angle || 0);
      const end = this.effectEndpoints(effect, radius, angle);
      if (!end) return false;
      const dx = end.toX - end.fromX;
      const dy = end.toY - end.fromY;
      const length = Math.hypot(dx, dy);
      if (length < 8) return false;
      const ux = dx / length;
      const uy = dy / length;
      const px = -uy;
      const py = ux;
      const width = Math.max(78, Number(effect.width || radius * 0.18 || 88));
      const activeAlpha = alpha * (0.92 + peak * 0.08);
      const z = Math.max(end.fromY, end.toY) + 132;

      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width * 1.52, "#170728", activeAlpha * 0.3, z - 18, "add");
      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width * 1.08, tint, activeAlpha * 0.82, z - 10, "add");
      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(18, width * 0.32), "#f5d0fe", activeAlpha * 0.95, z, "add");
      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(5, width * 0.08), "#ffffff", activeAlpha * 0.88, z + 4, "add");

      for (let i = 1; i <= 5; i += 1) {
        const along = length * (i / 6);
        const cx = end.fromX + ux * along;
        const cy = end.fromY + uy * along;
        const nick = width * (0.2 + (i % 2) * 0.08 + peak * 0.03);
        this.drawGfxLine(cx - px * nick, cy - py * nick, cx + px * nick, cy + py * nick, i % 2 ? 5 : 7, i % 2 ? "#f5d0fe" : tint, activeAlpha * 0.34, z + 8 + i, "add");
      }

      this.drawGfxCircle?.(end.fromX, end.fromY, width * (0.34 + peak * 0.08), tint, activeAlpha * 0.3, "#f5d0fe", activeAlpha * 0.48, 2, z + 10, "add", 16);
      this.drawGfxImpactBurst?.(end.toX, end.toY, width * (0.82 + peak * 0.12), tint, activeAlpha * 0.3, z + 18, progress * 2.6, 9);
      return true;
    }

    renderStyledSkillEffect(effect, progress, alpha, radius, color, style, options = {}) {
      this.lastStyledSkillRenderer = "";
      const skillContext = pixiSkillEffects.createStyledSkillContext
        ? pixiSkillEffects.createStyledSkillContext(this, effect, progress, alpha, radius, color, style)
        : null;
      const s = skillContext ? skillContext.s : String(style || "").toLowerCase();
      if (!s) return false;
      const kind = skillContext ? skillContext.kind : effect.kind || "";
      const angle = skillContext ? skillContext.angle : Number(effect.angle || 0);
      const peak = skillContext ? skillContext.peak : Math.sin(progress * Math.PI);
      const pulse = skillContext ? skillContext.pulse : 1 + peak * 0.22;
      const effectRadius = skillContext ? skillContext.effectRadius : Math.max(radius, Number(effect.rangeRadius || effect.radius || radius));
      const end = skillContext ? skillContext.end : this.effectEndpoints(effect, radius, angle);
      const z = skillContext ? skillContext.z : effect.y + 108;

      const drewPolish = Boolean(pixiSkillEffects.renderSkillEffectPolishLayer && pixiSkillEffects.renderSkillEffectPolishLayer(this, skillContext));
      if (this.renderCrispStyledSkillEffect(effect, progress, alpha, radius, color, s, kind, angle, peak, pulse, effectRadius, end, z)) {
        this.lastStyledSkillRenderer = "pixi-renderer:crisp-skill-fallback";
        return true;
      }
      const skillRoutes = [
        ["pixi-skill-effects:warrior", pixiSkillEffects.renderWarriorStyledSkillEffect],
        ["pixi-skill-effects:ranger", pixiSkillEffects.renderRangerStyledSkillEffect],
        ["pixi-skill-effects:mage", pixiSkillEffects.renderMageStyledSkillEffect],
        ["pixi-skill-effects:engineer", pixiSkillEffects.renderEngineerStyledSkillEffect],
        ["pixi-skill-effects:puppet", pixiSkillEffects.renderPuppetStyledSkillEffect],
        ["pixi-skill-effects:martial", pixiSkillEffects.renderMartialStyledSkillEffect],
        ["pixi-skill-effects:alchemist", pixiSkillEffects.renderAlchemistStyledSkillEffect],
        ["pixi-skill-effects:assassin", pixiSkillEffects.renderAssassinStyledSkillEffect],
        ["pixi-skill-effects:common", pixiSkillEffects.renderCommonStyledEffect],
      ];
      for (const [label, route] of skillRoutes) {
        if (route && route(this, skillContext)) {
          this.lastStyledSkillRenderer = label;
          return true;
        }
      }
      if (drewPolish) {
        this.lastStyledSkillRenderer = "pixi-skill-effects:polish";
        return true;
      }

      return false;

    }

    renderAim(state, now) {
      const self = state.players?.find((player) => player.id === this.getSelfId());
      if (!self || self.spectator) return;
      const sprite = this.sprite("reticle", this.layers.ui, self.aimX || self.x, self.aimY || self.y, 0.82, 0.82, self.color || "#f8f3e9", 0.72 + Math.sin(now / 160) * 0.08);
      sprite.zIndex = (self.aimY || self.y) + 100;
    }

    renderScreenOverlays(viewW, viewH, hitTime) {
      this.rect(this.screenLayers.vignette, viewW / 2, viewH - 50, viewW, 160, "#000000", 0.24);
      this.rect(this.screenLayers.vignette, viewW / 2, 0, viewW, 120, "#000000", 0.18);
      if (hitTime > 0) {
        this.rect(this.screenLayers.flash, viewW / 2, viewH / 2, viewW, viewH, "#ef4444", Math.min(0.22, hitTime * 0.35));
      }
      this.renderEffectDebugOverlay(viewW);
    }

    renderDebugEnabled() {
      try {
        const params = new URLSearchParams(window.location.search || "");
        return params.get("debugRender") === "1" || window.localStorage?.getItem("debugRender") === "1" || window.__rogueRenderDebug === true;
      } catch {
        return window.__rogueRenderDebug === true;
      }
    }

    noteEffectRenderer(source, effect, style) {
      const label = String(source || "unknown");
      const entry = {
        source: label,
        style: String(style || effect?.style || effect?.kind || ""),
        kind: String(effect?.kind || ""),
        age: Number(effect?.age || 0),
      };
      this.diagnostics.lastEffectRenderer = entry;
      this.effectRenderTrace.push(entry);
      if (this.effectRenderTrace.length > 10) this.effectRenderTrace.shift();
      this.diagnostics.effectRenderTrace = this.effectRenderTrace.slice(-10);
    }

    renderEffectDebugOverlay(viewW) {
      if (!this.renderDebugEnabled() || !this.effectRenderTrace.length || !this.screenLayers.debug) return;
      const lines = this.effectRenderTrace.slice(-7).reverse();
      const width = 390;
      const rowHeight = 18;
      const x = viewW - width - 14;
      const y = 16;
      this.rect(this.screenLayers.debug, x + width / 2, y + 14 + (lines.length * rowHeight) / 2, width, 34 + lines.length * rowHeight, "#020617", 0.72).zIndex = 10000;
      const titleStyle = { fontFamily: "Consolas, monospace", fontSize: 12, fill: "#f8fafc" };
      const title = this.textPool.next(this.screenLayers.debug, titleStyle);
      title.text = "effect renderer trace";
      title.position.set(x + 10, y + 8);
      title.zIndex = 10001;
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const text = this.textPool.next(this.screenLayers.debug, { fontFamily: "Consolas, monospace", fontSize: 11, fill: i === 0 ? "#facc15" : "#bfdbfe" });
        text.text = `${line.source} | ${line.style || line.kind}`;
        text.position.set(x + 10, y + 26 + i * rowHeight);
        text.zIndex = 10002 + i;
      }
    }

    actorTextureKey(classId, frame, state) {
      const key = pixiTextureKeys.actorTextureKey ? pixiTextureKeys.actorTextureKey(classId, frame, state) : `actor:${classId}:${frame}:${state}`;
      return this.texture(key, SPRITE_SIZE, SPRITE_SIZE, (ctx) => this.drawActorSheetFrame(ctx, classId, frame, state));
    }

    enemyTextureKey(type, frame) {
      const key = pixiTextureKeys.enemyTextureKey ? pixiTextureKeys.enemyTextureKey(type, frame) : `enemy:${type}:${frame}`;
      return this.texture(key, SPRITE_SIZE, SPRITE_SIZE, (ctx) => this.drawEnemySheetFrame(ctx, type, frame));
    }

    bossTextureKey(enemy, now) {
      const info = pixiTextureKeys.bossTextureInfo
        ? pixiTextureKeys.bossTextureInfo(enemy, now)
        : {
            phase: Math.max(1, Number(enemy.bossPhase || 1)),
            id: enemy.bossId || enemy.bossPattern || "boss",
            frame: Math.floor(now / 220) % 3,
            key: `boss:${enemy.bossId || enemy.bossPattern || "boss"}:${Math.max(1, Number(enemy.bossPhase || 1))}:${Math.floor(now / 220) % 3}`
          };
      return this.texture(info.key, BOSS_SIZE, BOSS_SIZE, (ctx) => this.drawBossSheetFrame(ctx, info.id, info.phase, info.frame));
    }

    projectileTextureKey(projectile) {
      const style = pixiTextureKeys.projectileStyle ? pixiTextureKeys.projectileStyle(projectile) : projectile.style || projectile.classId || (projectile.hostile ? "hostile" : "bolt");
      const key = pixiTextureKeys.projectileTextureKey ? pixiTextureKeys.projectileTextureKey(projectile) : `projectile:${style}`;
      return this.texture(key, 32, 16, (ctx) => {
        const color = pixiTextureKeys.projectileColor ? pixiTextureKeys.projectileColor(style) : style.includes("fire") || style.includes("meteor") ? "#f97316" : style.includes("poison") || style.includes("venom") ? "#bef264" : style.includes("arrow") || style.includes("ranger") ? "#f1d08b" : "#dbeafe";
        this.px(ctx, 5, 6, 18, 4, color);
        this.px(ctx, 22, 4, 6, 8, "#f8f3e9");
        this.px(ctx, 2, 5, 5, 6, "#11110f");
      });
    }

    drawActorSheetFrame(ctx, classId, frame, state) {
      if (pixiActorTextures.drawActorSheetFrame) {
        pixiActorTextures.drawActorSheetFrame(ctx, classId, frame, state);
        return;
      }
      const [main, dark, light] = classPalettes[classId] || classPalettes.warrior;
      const leg = frame % 2 === 0 ? 1 : -1;
      const atk = state === "attack" ? 5 : 0;

      this.px(ctx, 20, 45 + leg, 7, 12, "#171512");
      this.px(ctx, 37, 45 - leg, 7, 12, "#171512");
      this.px(ctx, 17, 55 + leg, 12, 5, "#0b0d0e");
      this.px(ctx, 35, 55 - leg, 12, 5, "#0b0d0e");
      this.px(ctx, 18, 25, 28, 23, dark);
      this.px(ctx, 22, 21, 20, 28, main);
      this.px(ctx, 25, 13, 14, 13, light);
      this.px(ctx, 27, 16, 3, 3, "#11110f");
      this.px(ctx, 36, 16, 3, 3, "#11110f");
      this.px(ctx, 29, 22, 8, 2, "#11110f");
      this.px(ctx, 24, 47, 16, 4, light);
      this.px(ctx, 15, 29, 7, 15, main);
      this.px(ctx, 42 + atk, 28 - atk, 7, 15, main);

      if (classId === "warrior") {
        this.px(ctx, 11, 25, 12, 21, "#3f3426");
        this.px(ctx, 13, 28, 8, 15, "#6b4a2b");
        this.px(ctx, 20, 10, 24, 7, "#f8f3e9");
        this.px(ctx, 24, 7, 16, 6, dark);
        this.px(ctx, 46 + atk, 10 - atk, 5, 35, "#f8f3e9");
        this.px(ctx, 50 + atk, 7 - atk, 9, 9, "#f8f3e9");
        this.px(ctx, 43 + atk, 32 - atk, 14, 4, "#6b4a2b");
        this.px(ctx, 20, 30, 24, 4, "#f8f3e9");
      } else if (classId === "ranger") {
        this.px(ctx, 20, 10, 24, 12, dark);
        this.px(ctx, 24, 8, 16, 7, main);
        this.px(ctx, 49, 13, 4, 34, "#6f4a27");
        this.px(ctx, 50, 16, 2, 28, "#f8f3e9");
        this.px(ctx, 39 + atk, 29, 19, 3, light);
        this.px(ctx, 14, 17, 5, 28, "#4a341d");
        this.px(ctx, 13, 16, 3, 20, "#f1d08b");
      } else if (classId === "mage") {
        this.px(ctx, 17, 17, 30, 36, dark);
        this.px(ctx, 22, 20, 20, 31, main);
        this.px(ctx, 22, 5, 20, 9, dark);
        this.px(ctx, 26, 1, 12, 13, main);
        this.px(ctx, 10, 10, 6, 43, "#4f3f61");
        this.px(ctx, 7, 6, 12, 12, light);
        this.px(ctx, 15, 30, 34, 3, light);
        this.px(ctx, 27, 37, 10, 10, "#0e0d14");
      } else if (classId === "engineer") {
        this.px(ctx, 19, 9, 26, 8, "#2d2a22");
        this.px(ctx, 25, 14, 14, 5, light);
        this.px(ctx, 48, 26, 13, 9, "#2d2a22");
        this.px(ctx, 58, 28, 5, 5, light);
        this.px(ctx, 10, 24, 9, 24, "#2d2a22");
        this.px(ctx, 12, 26, 5, 18, "#6f5a34");
        this.px(ctx, 23, 39, 19, 5, light);
      } else if (classId === "puppeteer") {
        this.px(ctx, 23, 5, 18, 6, "#21191f");
        this.px(ctx, 26, 1, 12, 7, dark);
        this.linePx(ctx, 20, 3, 13, 38, light);
        this.linePx(ctx, 32, 3, 50, 42, light);
        this.px(ctx, 8, 38, 9, 11, "#21191f");
        this.px(ctx, 10, 40, 5, 5, light);
        this.px(ctx, 48, 41, 9, 11, "#21191f");
        this.px(ctx, 50, 43, 5, 5, light);
      } else if (classId === "martialist") {
        this.px(ctx, 18, 21, 28, 7, "#f8f3e9");
        this.px(ctx, 22, 31, 20, 4, "#11110f");
        this.px(ctx, 46 + atk, 27, 11, 9, light);
        this.px(ctx, 7, 27, 11, 9, light);
        this.px(ctx, 22, 12, 20, 4, "#fde68a");
        this.px(ctx, 50 + atk, 19, 4, 4, "#fde68a");
      } else if (classId === "alchemist") {
        this.px(ctx, 22, 12, 20, 7, "#2f3a20");
        this.px(ctx, 25, 15, 14, 5, "#d9f99d");
        this.px(ctx, 48, 22, 8, 13, "#bef264");
        this.px(ctx, 49, 18, 6, 5, "#f8f3e9");
        this.px(ctx, 9, 35, 8, 12, "#f97316");
        this.px(ctx, 11, 32, 4, 4, "#f8f3e9");
        this.px(ctx, 38, 43, 7, 9, "#bef264");
      } else if (classId === "assassin") {
        this.px(ctx, 17, 7, 30, 15, "#111113");
        this.px(ctx, 19, 20, 27, 33, "#111113");
        this.px(ctx, 26, 15, 12, 7, main);
        this.px(ctx, 47 + atk, 30 - atk, 15, 4, "#f8f3e9");
        this.px(ctx, 2, 31, 16, 4, "#f8f3e9");
        this.px(ctx, 20, 45, 26, 4, dark);
      }
      this.outline(ctx, 17, 10, 30, 43);
    }

    drawEnemySheetFrame(ctx, type, frame) {
      if (pixiEnemyTextures.drawEnemySheetFrame) {
        pixiEnemyTextures.drawEnemySheetFrame(ctx, type, frame);
        return;
      }
      const [main, dark, light] = enemyPalettes[type] || enemyPalettes.slime;
      const bob = frame % 2;
      if (type === "bat") {
        this.px(ctx, 4, 22 - bob * 2, 22, 11, dark);
        this.px(ctx, 38, 22 - bob * 2, 22, 11, dark);
        this.px(ctx, 24, 20, 16, 22, main);
        this.px(ctx, 25, 13, 5, 9, main);
        this.px(ctx, 36, 13, 5, 9, main);
        this.px(ctx, 29, 28, 3, 3, "#11110f");
        this.px(ctx, 36, 28, 3, 3, "#11110f");
      } else if (type === "charger") {
        this.px(ctx, 10, 22, 38, 25, main);
        this.px(ctx, 41, 27, 17, 7, light);
        this.px(ctx, 7, 26, 12, 17, dark);
        this.px(ctx, 45, 16, 10, 11, "#f8f3e9");
        this.px(ctx, 43, 38, 11, 5, dark);
      } else if (type === "guardian") {
        this.px(ctx, 13, 8, 38, 47, dark);
        this.px(ctx, 20, 13, 24, 37, main);
        this.px(ctx, 23, 27, 18, 4, light);
        this.px(ctx, 31, 17, 4, 30, light);
        this.px(ctx, 16, 17, 8, 30, "#1f252b");
      } else if (type === "shaman") {
        this.px(ctx, 18, 15, 28, 37, dark);
        this.px(ctx, 24, 10, 16, 14, main);
        this.px(ctx, 48, 8, 5, 43, light);
        this.px(ctx, 45, 5, 11, 9, light);
        this.px(ctx, 25, 30, 14, 4, "#dcfce7");
      } else if (type === "spitter") {
        this.px(ctx, 10, 22, 31, 23, main);
        this.px(ctx, 35, 25, 18, 11, dark);
        this.px(ctx, 49, 27, 7, 7, light);
        this.px(ctx, 17, 18, 8, 6, "#bef264");
        this.px(ctx, 24, 16, 6, 6, "#bef264");
      } else if (type === "bomber") {
        this.px(ctx, 14, 18, 36, 36, main);
        this.px(ctx, 23, 27, 18, 18, dark);
        this.px(ctx, 38, 7, 5, 14, "#f8f3e9");
        this.px(ctx, 42, 4, 8, 8, "#f97316");
        this.px(ctx, 19, 22, 5, 5, "#11110f");
      } else if (type === "stalker") {
        this.px(ctx, 16, 8, 32, 46, dark);
        this.px(ctx, 24, 18, 17, 13, main);
        this.px(ctx, 43, 35, 17, 4, light);
        this.px(ctx, 21, 12, 24, 7, "#111113");
      } else if (type === "mortar") {
        this.px(ctx, 11, 24, 36, 24, main);
        this.px(ctx, 38, 9, 12, 26, dark);
        this.px(ctx, 41, 9, 6, 8, light);
        this.px(ctx, 16, 31, 22, 4, "#2d2a26");
      } else if (type === "sniper") {
        this.px(ctx, 8, 23, 35, 19, main);
        this.px(ctx, 38, 26, 22, 5, dark);
        this.px(ctx, 55, 23, 7, 10, light);
        this.px(ctx, 20, 18, 12, 6, "#332116");
      } else if (type === "brute") {
        this.px(ctx, 9, 14, 46, 39, main);
        this.px(ctx, 17, 6, 30, 13, dark);
        this.px(ctx, 23, 34, 6, 10, light);
        this.px(ctx, 37, 34, 6, 10, light);
        this.px(ctx, 16, 25, 7, 5, "#11110f");
        this.px(ctx, 42, 25, 7, 5, "#11110f");
      } else if (type === "runner" || type === "runner_tank" || type === "runner_fast") {
        this.px(ctx, 16, 18, 29, 29, main);
        this.px(ctx, 41, 26, 12, 7, light);
        this.px(ctx, 17, 47, 9, 7, dark);
        this.px(ctx, 34, 47, 9, 7, dark);
      } else if (type === "training_dummy") {
        this.px(ctx, 26, 7, 13, 11, light);
        this.px(ctx, 20, 18, 24, 28, main);
        this.px(ctx, 15, 24, 34, 6, dark);
        this.px(ctx, 29, 46, 8, 12, dark);
        this.px(ctx, 18, 57, 29, 5, dark);
        this.px(ctx, 24, 23, 4, 4, "#11110f");
        this.px(ctx, 36, 23, 4, 4, "#11110f");
        this.px(ctx, 27, 36, 12, 2, "#11110f");
      } else if (type === "slime" || type === "splitter" || type === "splinter") {
        this.px(ctx, 16, 34, 34, 13, dark);
        this.px(ctx, 13, 29, 39, 15, main);
        this.px(ctx, 19, 21 - bob, 28, 17, main);
        this.px(ctx, 23, 17 - bob, 8, 8, light);
        this.px(ctx, 39, 24 - bob, 8, 7, light);
        this.px(ctx, 15, 39, 8, 6, dark);
        this.px(ctx, 45, 38, 8, 6, dark);
        this.px(ctx, 25, 30, 4, 5, "#11110f");
        this.px(ctx, 39, 30, 4, 5, "#11110f");
        this.px(ctx, 30, 39, 10, 3, dark);
      } else {
        this.px(ctx, 11, 25, 42, 25, main);
        this.px(ctx, 20, 16 - bob, 26, 15, main);
        this.px(ctx, 22, 26, 5, 5, "#11110f");
        this.px(ctx, 39, 26, 5, 5, "#11110f");
        this.px(ctx, 26, 39, 13, 3, dark);
      }
      if (type !== "bat" && type !== "slime" && type !== "splitter" && type !== "splinter") {
        this.px(ctx, 20, 51, 9, 6, dark);
        this.px(ctx, 38, 51, 9, 6, dark);
      }
      this.outline(ctx, 8, 7, 50, 52);
    }

    drawBossSheetFrame(ctx, id, phase, frame) {
      if (pixiBossTextures.drawBossSheetFrame) {
        pixiBossTextures.drawBossSheetFrame(ctx, id, phase, frame);
        return;
      }
      const charge = id.includes("iron") || id === "charge";
      const hive = id.includes("hive") || id === "summon";
      const main = charge ? "#c9824c" : hive ? "#7fa671" : "#8d7cae";
      const dark = charge ? "#201a15" : hive ? "#101b16" : "#0e0d14";
      const light = phase >= 3 ? "#fee2e2" : hive ? "#dcfce7" : "#f8f3e9";
      this.px(ctx, 28, 35, 72, 66, dark);
      this.px(ctx, 42, 25, 44, 72, main);
      this.px(ctx, 18, 52, 18, 40, dark);
      this.px(ctx, 93, 52, 18, 40, dark);
      if (charge) {
        this.px(ctx, 42, 17, 44, 17, "#15110e");
        this.px(ctx, 49, 28, 29, 5, light);
        this.px(ctx, 85, 18, 11, 70, "#f8f3e9");
        this.px(ctx, 91, 11, 14, 17, "#f8f3e9");
        this.px(ctx, 23, 15, 16, 21, "#f8f3e9");
        this.px(ctx, 88, 76, 24, 6, "#6b4a2b");
      } else if (hive) {
        for (let i = 0; i < 8 + phase; i += 1) {
          const a = (Math.PI * 2 * i) / (8 + phase) + frame * 0.2;
          this.linePx(ctx, 64, 60, 64 + Math.cos(a) * 52, 60 + Math.sin(a) * 48, light);
        }
        this.px(ctx, 53, 45, 22, 22, light);
        this.px(ctx, 39, 76, 50, 8, "#dcfce7");
      } else {
        for (let i = 0; i < 8 + phase; i += 1) {
          const a = (Math.PI * 2 * i) / (8 + phase) + frame * 0.3;
          this.px(ctx, 62 + Math.cos(a) * 48, 58 + Math.sin(a) * 42, 7, 7, light);
        }
        this.px(ctx, 48, 45, 33, 23, light);
        this.px(ctx, 60, 44, 9, 25, "#111113");
        this.px(ctx, 35, 22, 58, 8, "#0e0d14");
      }
      if (phase >= 2) {
        this.px(ctx, 39, 101, 50, 6, light);
        this.px(ctx, 61, 11, 6, 96, light);
      }
      this.outline(ctx, 18, 11, 94, 98);
    }

    sprite(key, parent, x, y, scaleX = 1, scaleY = 1, tint = "#ffffff", alpha = 1) {
      const texture = typeof key === "string" ? this.textures.get(key) || this.texture(key, 8, 8, (ctx) => this.px(ctx, 0, 0, 8, 8, "#ffffff")) : key;
      const sprite = this.spritePool.next(texture, parent);
      sprite.position.set(x, y);
      sprite.scale.set(scaleX, scaleY);
      sprite.tint = this.tint(tint);
      sprite.alpha = alpha;
      return sprite;
    }

    fx(key, x, y, scaleX = 1, scaleY = scaleX, tint = "#ffffff", alpha = 1, zIndex = y + 80, rotation = 0, blendMode = "normal") {
      if (key === "fx-lightning" && this.drawGfxLightning && Number.isFinite(x) && Number.isFinite(y) && alpha > 0) {
        const length = Math.max(20, Math.abs(scaleX) * 112);
        const width = Math.max(2.4, Math.abs(scaleY) * 18);
        const fromX = x - Math.cos(rotation) * length * 0.5;
        const fromY = y - Math.sin(rotation) * length * 0.5;
        const toX = x + Math.cos(rotation) * length * 0.5;
        const toY = y + Math.sin(rotation) * length * 0.5;
        const phase = Date.now() / 130 + x * 0.013 + y * 0.017;
        this.drawGfxLightning(fromX, fromY, toX, toY, tint, alpha, zIndex, width, Math.max(4, Math.min(9, Math.ceil(length / 32))), Math.max(7, width * 1.7), phase);
        return { alpha, rotation, zIndex, blendMode };
      }
      const sprite = this.sprite(key, this.layers.effect, x, y, scaleX, scaleY, tint, alpha);
      sprite.rotation = rotation;
      sprite.zIndex = zIndex;
      sprite.blendMode = blendMode;
      return sprite;
    }

    gfx(zIndex = 0, blendMode = "normal") {
      const graphics = this.graphicsPool.next(this.layers.effect);
      graphics.zIndex = zIndex;
      graphics.blendMode = blendMode;
      return graphics;
    }

    drawGfxPath(points, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth, zIndex, blendMode = "normal") {
      if (!points || points.length < 2) return null;
      const graphics = this.gfx(zIndex, blendMode);
      graphics.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i += 1) {
        graphics.lineTo(points[i].x, points[i].y);
      }
      if (typeof graphics.closePath === "function") graphics.closePath();
      else graphics.lineTo(points[0].x, points[0].y);
      if (fillAlpha > 0) graphics.fill({ color: this.tint(fillColor), alpha: fillAlpha });
      if (strokeAlpha > 0 && strokeWidth > 0) {
        graphics.stroke({
          color: this.tint(strokeColor || fillColor),
          alpha: strokeAlpha,
          width: strokeWidth,
          join: "round"
        });
      }
      return graphics;
    }

    drawGfxLine(fromX, fromY, toX, toY, width, color, alpha, zIndex, blendMode = "normal") {
      if (!Number.isFinite(fromX) || !Number.isFinite(fromY) || !Number.isFinite(toX) || !Number.isFinite(toY)) return null;
      if (Math.hypot(toX - fromX, toY - fromY) < 1) return null;
      const graphics = this.gfx(zIndex, blendMode);
      graphics.moveTo(fromX, fromY);
      graphics.lineTo(toX, toY);
      graphics.stroke({
        color: this.tint(color),
        alpha,
        width,
        cap: "round",
        join: "round"
      });
      return graphics;
    }

    drawGfxCircle(x, y, radius, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth, zIndex, blendMode = "normal", segments = 40) {
      const points = pixiPrimitives.circlePoints
        ? pixiPrimitives.circlePoints(x, y, radius, segments)
        : [];
      if (!points.length) return null;
      return this.drawGfxPath(points, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth, zIndex, blendMode);
    }

    drawGfxArc(x, y, radius, startAngle, endAngle, width, color, alpha, zIndex, blendMode = "normal", segments = 18) {
      const points = pixiPrimitives.arcPoints
        ? pixiPrimitives.arcPoints(x, y, radius, startAngle, endAngle, segments)
        : [];
      if (!points.length) return null;
      const graphics = this.gfx(zIndex, blendMode);
      for (let i = 0; i < points.length; i += 1) {
        if (i === 0) graphics.moveTo(points[i].x, points[i].y);
        else graphics.lineTo(points[i].x, points[i].y);
      }
      graphics.stroke({
        color: this.tint(color),
        alpha,
        width,
        cap: "round",
        join: "round"
      });
      return graphics;
    }

    drawGfxCone(originX, originY, angle, reach, halfAngle, color, fillAlpha, strokeAlpha, zIndex, heavy = false) {
      const shape = pixiPrimitives.coneShape
        ? pixiPrimitives.coneShape(originX, originY, angle, reach, halfAngle, heavy)
        : null;
      if (!shape) return;
      this.drawGfxPath(shape.points, color, fillAlpha, color, strokeAlpha, heavy ? 4 : 3, zIndex, "add");
      this.drawGfxLine(shape.left.x1, shape.left.y1, shape.left.x2, shape.left.y2, heavy ? 3 : 2, color, strokeAlpha * 0.58, zIndex + 1, "add");
      this.drawGfxLine(shape.right.x1, shape.right.y1, shape.right.x2, shape.right.y2, heavy ? 3 : 2, color, strokeAlpha * 0.58, zIndex + 1, "add");
    }

    drawGfxCleaveRibbon(originX, originY, innerRadius, outerRadius, startAngle, endAngle, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth, zIndex, blendMode = "add", segments = 20) {
      const points = pixiPrimitives.cleaveRibbonPoints
        ? pixiPrimitives.cleaveRibbonPoints(originX, originY, innerRadius, outerRadius, startAngle, endAngle, segments)
        : [];
      if (!points.length) return null;
      return this.drawGfxPath(points, fillColor, fillAlpha, strokeColor, strokeAlpha, strokeWidth, zIndex, blendMode);
    }

    drawGfxSword(originX, originY, angle, reach, sideOffset, color, alpha, zIndex, heavy = false) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const base = reach * (heavy ? 0.25 : 0.3);
      const tip = reach * (heavy ? 0.98 : 0.9);
      const baseWidth = heavy ? 13 : 9;
      const tipWidth = heavy ? 21 : 14;
      const startX = originX + ux * base + px * sideOffset;
      const startY = originY + uy * base + py * sideOffset;
      const tipX = originX + ux * tip + px * sideOffset;
      const tipY = originY + uy * tip + py * sideOffset;
      const blade = [
        { x: startX - px * baseWidth, y: startY - py * baseWidth },
        { x: tipX - px * tipWidth, y: tipY - py * tipWidth },
        { x: tipX + ux * (heavy ? 22 : 16), y: tipY + uy * (heavy ? 22 : 16) },
        { x: tipX + px * tipWidth, y: tipY + py * tipWidth },
        { x: startX + px * baseWidth, y: startY + py * baseWidth }
      ];
      this.drawGfxPath(blade, "#f8f3e9", alpha * 0.92, color, alpha * 0.55, heavy ? 3 : 2, zIndex + 5, "add");
      this.drawGfxLine(startX, startY, tipX, tipY, heavy ? 5 : 3, color, alpha * 0.5, zIndex + 6, "add");
      this.drawGfxLine(originX + ux * 8 - px * 13, originY + uy * 8 - py * 13, originX + ux * 8 + px * 13, originY + uy * 8 + py * 13, heavy ? 7 : 5, "#6b3425", alpha * 0.88, zIndex + 7, "normal");
    }

    drawGfxGreatsword(originX, originY, angle, reach, color, alpha, zIndex, heavy = false) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const hiltBack = heavy ? 24 : 18;
      const guard = heavy ? 25 : 18;
      const bladeStart = heavy ? 18 : 14;
      const bladeMid = reach * 0.64;
      const tip = reach;
      const baseWidth = heavy ? 12 : 9;
      const midWidth = heavy ? 16 : 12;
      const tipWidth = heavy ? 7 : 5;
      const tint = color || "#f97316";
      const baseX = originX + ux * bladeStart;
      const baseY = originY + uy * bladeStart;
      const midX = originX + ux * bladeMid;
      const midY = originY + uy * bladeMid;
      const tipX = originX + ux * tip;
      const tipY = originY + uy * tip;
      const outline = [
        { x: baseX - px * (baseWidth + 5), y: baseY - py * (baseWidth + 5) },
        { x: midX - px * (midWidth + 5), y: midY - py * (midWidth + 5) },
        { x: tipX - px * (tipWidth + 4), y: tipY - py * (tipWidth + 4) },
        { x: tipX + ux * (heavy ? 25 : 18), y: tipY + uy * (heavy ? 25 : 18) },
        { x: tipX + px * (tipWidth + 4), y: tipY + py * (tipWidth + 4) },
        { x: midX + px * (midWidth + 5), y: midY + py * (midWidth + 5) },
        { x: baseX + px * (baseWidth + 5), y: baseY + py * (baseWidth + 5) }
      ];
      const blade = [
        { x: baseX - px * baseWidth, y: baseY - py * baseWidth },
        { x: midX - px * midWidth, y: midY - py * midWidth },
        { x: tipX - px * tipWidth, y: tipY - py * tipWidth },
        { x: tipX + ux * (heavy ? 20 : 15), y: tipY + uy * (heavy ? 20 : 15) },
        { x: tipX + px * tipWidth, y: tipY + py * tipWidth },
        { x: midX + px * midWidth, y: midY + py * midWidth },
        { x: baseX + px * baseWidth, y: baseY + py * baseWidth }
      ];
      this.drawGfxPath(outline, "#2b170e", alpha * 0.66, "#2b170e", alpha * 0.82, 3, zIndex, "normal");
      this.drawGfxPath
      (blade, "#f8f3e9", alpha * 0.96, tint, alpha * 0.72, heavy ? 4 : 3, zIndex + 2, "add");
      this.drawGfxLine(baseX + px * 2, baseY + py * 2, tipX + ux * 3 + px * 2, tipY + uy * 3 + py * 2, heavy ? 5 : 4, "#fff7ed", alpha * 0.54, zIndex + 3, "add");
      this.drawGfxLine(baseX - px * 5, baseY - py * 5, midX - px * 7, midY - py * 7, heavy ? 4 : 3, tint, alpha * 0.42, zIndex + 4, "add");
      this.drawGfxLine(originX - px * guard, originY - py * guard, originX + px * guard, originY + py * guard, heavy ? 9 : 7, "#6b3425", alpha * 0.96, zIndex + 5, "normal");
      this.drawGfxLine(originX - ux * hiltBack, originY - uy * hiltBack, originX + ux * bladeStart * 0.55, originY + uy * bladeStart * 0.55, heavy ? 8 : 6, "#3f2416", alpha * 0.95, zIndex + 6, "normal");
    }

    drawGfxShieldProfile(x, y, angle, size, color, alpha, zIndex, heavy = false) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const half = size * (heavy ? 0.52 : 0.45);
      const front = size * 0.23;
      const back = size * 0.16;
      const metal = heavy ? "#f8f3e9" : "#dbeafe";
      const rim = color || "#f97316";
      const points = [
        { x: x - ux * back - px * half * 0.72, y: y - uy * back - py * half * 0.72 },
        { x: x + ux * front - px * half, y: y + uy * front - py * half },
        { x: x + ux * front * 1.42 - px * half * 0.42, y: y + uy * front * 1.42 - py * half * 0.42 },
        { x: x + ux * front * 1.55, y: y + uy * front * 1.55 },
        { x: x + ux * front * 1.42 + px * half * 0.42, y: y + uy * front * 1.42 + py * half * 0.42 },
        { x: x + ux * front + px * half, y: y + uy * front + py * half },
        { x: x - ux * back + px * half * 0.72, y: y - uy * back + py * half * 0.72 }
      ];
      this.drawGfxPath(points, "#3f3426", alpha * 0.6, rim, alpha * 0.82, heavy ? 4 : 3, zIndex, "normal");
      this.drawGfxLine(x + ux * front * 0.82 - px * half * 0.58, y + uy * front * 0.82 - py * half * 0.58, x + ux * front * 0.82 + px * half * 0.58, y + uy * front * 0.82 + py * half * 0.58, heavy ? 8 : 6, metal, alpha * 0.7, zIndex + 1, "add");
      this.drawGfxLine(x - ux * back - px * half * 0.5, y - uy * back - py * half * 0.5, x - ux * back + px * half * 0.5, y - uy * back + py * half * 0.5, heavy ? 5 : 4, rim, alpha * 0.5, zIndex + 2, "add");
      for (let i = 0; i < 3; i += 1) {
        const offset = (i - 1) * half * 0.48;
        const tailX = x - ux * (front * 1.4 + i * 18) + px * offset;
        const tailY = y - uy * (front * 1.4 + i * 18) + py * offset;
        this.drawGfxLine(tailX, tailY, tailX - ux * size * 0.28, tailY - uy * size * 0.28, heavy ? 5 - i : 4 - i * 0.5, "#fde68a", alpha * (0.28 - i * 0.045), zIndex - i, "add");
      }
    }

    drawGfxFrontShield(x, y, angle, size, color, alpha, zIndex, phase = 0) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const rim = color || "#facc15";
      const metal = "#fff7ed";
      const gold = "#fde047";
      const front = size * 0.34;
      const shoulder = size * 0.1;
      const rear = size * 0.24;
      const half = size * 0.54;
      const outer = [
        { x: x + ux * front, y: y + uy * front },
        { x: x + ux * shoulder + px * half * 0.56, y: y + uy * shoulder + py * half * 0.56 },
        { x: x - ux * rear * 0.42 + px * half, y: y - uy * rear * 0.42 + py * half },
        { x: x - ux * rear * 1.1 + px * half * 0.66, y: y - uy * rear * 1.1 + py * half * 0.66 },
        { x: x - ux * rear * 1.22, y: y - uy * rear * 1.22 },
        { x: x - ux * rear * 1.1 - px * half * 0.66, y: y - uy * rear * 1.1 - py * half * 0.66 },
        { x: x - ux * rear * 0.42 - px * half, y: y - uy * rear * 0.42 - py * half },
        { x: x + ux * shoulder - px * half * 0.56, y: y + uy * shoulder - py * half * 0.56 }
      ];
      const glow = outer.map((point) => ({
        x: x + (point.x - x) * 1.12,
        y: y + (point.y - y) * 1.12
      }));
      const plate = outer.map((point) => ({
        x: x + (point.x - x) * 0.76 + ux * size * 0.015,
        y: y + (point.y - y) * 0.76 + uy * size * 0.015
      }));
      const core = outer.map((point) => ({
        x: x + (point.x - x) * 0.44 + ux * size * 0.055,
        y: y + (point.y - y) * 0.44 + uy * size * 0.055
      }));
      this.drawGfxPath(glow, rim, alpha * 0.14, gold, alpha * 0.18, 7, zIndex - 3, "add");
      this.drawGfxPath(outer, "#1f140f", alpha * 0.95, "#4a280b", alpha * 0.9, 6, zIndex, "normal");
      this.drawGfxPath(plate, "#facc15", alpha * 0.64, rim, alpha * 0.84, 4, zIndex + 2, "add");
      this.drawGfxPath(core, metal, alpha * 0.28, metal, alpha * 0.36, 2, zIndex + 3, "add");
      this.drawGfxLine(x - ux * rear * 0.92, y - uy * rear * 0.92, x + ux * front * 0.78, y + uy * front * 0.78, 7, metal, alpha * 0.48, zIndex + 5, "add");
      this.drawGfxLine(x - ux * rear * 0.24 - px * half * 0.72, y - uy * rear * 0.24 - py * half * 0.72, x - ux * rear * 0.24 + px * half * 0.72, y - uy * rear * 0.24 + py * half * 0.72, 6, gold, alpha * 0.58, zIndex + 6, "add");
      this.drawGfxLine(x - ux * rear * 0.2 - px * half * 0.62, y - uy * rear * 0.2 - py * half * 0.62, x + ux * shoulder * 0.92 - px * half * 0.22, y + uy * shoulder * 0.92 - py * half * 0.22, 4, "#fff7ed", alpha * 0.3, zIndex + 7, "add");
      this.drawGfxLine(x - ux * rear * 0.2 + px * half * 0.62, y - uy * rear * 0.2 + py * half * 0.62, x + ux * shoulder * 0.92 + px * half * 0.22, y + uy * shoulder * 0.92 + py * half * 0.22, 4, "#fff7ed", alpha * 0.3, zIndex + 7, "add");
      this.drawGfxDiamond(x + ux * size * 0.02, y + uy * size * 0.02, size * 0.1, gold, alpha * 0.62, zIndex + 9, angle, "#fff7ed");
      this.drawGfxSparkSpray(
        x + ux * front * 1.02,
        y + uy * front * 1.02,
        size * 0.32,
        gold,
        alpha * 0.2,
        zIndex + 10,
        7,
        phase * 3,
        angle,
        Math.PI * 0.58
      );
    }

    drawGfxDashDust(fromX, fromY, toX, toY, width, angle, color, alpha, zIndex, phase = 0, options = {}) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const rawLength = Math.hypot(toX - fromX, toY - fromY);
      if (rawLength < 3) return;
      const length = Math.min(rawLength, width * (options.long ? 3.35 : 2.35));
      const shadow = !!options.shadow;
      const charge = !!options.charge;
      const hot = !!options.hot;
      const dust = shadow ? "#4f3f61" : hot ? "#7c2d12" : "#caa35a";
      const rim = color || (shadow ? "#8a6f9e" : hot ? "#f97316" : "#d97706");
      const light = shadow ? "#c4b5fd" : hot ? "#fed7aa" : "#fde68a";
      const dark = shadow ? "#21142f" : hot ? "#450a0a" : "#6b3425";
      const plumes = charge ? [-1, 1] : [-1, 0, 1];
      for (let p = 0; p < plumes.length; p += 1) {
        const sign = plumes[p];
        const centerLane = sign === 0;
        const outer = [];
        const inner = [];
        const steps = centerLane ? 4 : 6;
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const ripple = Math.sin(phase * 9 + i * 1.73 + sign * 2.1) * width * 0.08;
          const along = width * 0.16 + length * t;
          const flare = centerLane
            ? width * (0.12 + t * 0.12 + (i % 2) * 0.03)
            : width * (0.22 + t * 0.44 + (i % 2 ? 0.12 : -0.04));
          const cx = toX - ux * along;
          const cy = toY - uy * along;
          outer.push({
            x: cx + px * sign * (flare + ripple),
            y: cy + py * sign * (flare + ripple)
          });
        }
        for (let i = steps; i >= 0; i -= 1) {
          const t = i / steps;
          const along = width * 0.1 + length * t;
          const flare = centerLane ? width * (0.02 + t * 0.04) : width * (0.06 + t * 0.12);
          const cx = toX - ux * along;
          const cy = toY - uy * along;
          inner.push({
            x: cx + px * sign * flare,
            y: cy + py * sign * flare
          });
        }
        const fillAlpha = alpha * (centerLane ? 0.08 : charge ? 0.18 : 0.13);
        const strokeAlpha = alpha * (centerLane ? 0.09 : charge ? 0.22 : 0.16);
        this.drawGfxPath([...outer, ...inner], centerLane ? dark : dust, fillAlpha, centerLane ? rim : light, strokeAlpha, centerLane ? 1 : 2, zIndex + p, "add");
      }
      const particles = charge ? 18 : 12;
      for (let i = 0; i < particles; i += 1) {
        const seed = (i * 0.618 + phase * 0.21) % 1;
        const t = 0.1 + seed * 0.9;
        const sideWave = Math.sin(i * 2.37 + phase * 7) * width * (0.18 + t * 0.48);
        const x = toX - ux * length * t + px * sideWave;
        const y = toY - uy * length * t + py * sideWave;
        const size = Math.max(3, width * (0.035 + (i % 4) * 0.01) * (1 - t * 0.35));
        const a = alpha * (0.18 + (i % 3) * 0.035) * (1 - t * 0.36);
        if (i % 3 === 0) {
          this.drawGfxCircle(x, y, size * 1.4, dark, a * 0.52, light, a * 0.3, 1, zIndex + 14 + i, "add", 7);
        } else {
          this.drawGfxDiamond(x, y, size, i % 2 ? dust : light, a, zIndex + 14 + i, angle + phase + i * 0.3, dark);
        }
      }
      if (charge) {
        this.drawGfxSparkSpray(toX - ux * width * 0.3, toY - uy * width * 0.3, width * 0.48, light, alpha * 0.16, zIndex + 36, 9, phase * 3, angle + Math.PI, Math.PI * 0.72);
      }
    }

    drawGfxShieldWake(fromX, fromY, toX, toY, width, angle, color, alpha, zIndex, phase = 0) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const rawLength = Math.hypot(toX - fromX, toY - fromY);
      if (rawLength < 3) return;
      const length = Math.min(rawLength, width * 3.25);
      this.drawGfxDashDust(fromX, fromY, toX, toY, width * 1.04, angle, color || "#f97316", alpha * 1.15, zIndex, phase, { charge: true, long: true, hot: true });
      for (let side = -1; side <= 1; side += 2) {
        const shard = [];
        const steps = 5;
        for (let i = 0; i <= steps; i += 1) {
          const t = i / steps;
          const jag = Math.sin(phase * 10 + i * 1.9 + side) * width * 0.1;
          const sideWidth = width * (0.34 + t * 0.58 + (i % 2 ? 0.12 : -0.08));
          shard.push({
            x: toX - ux * (width * 0.28 + length * t) + px * side * (sideWidth + jag),
            y: toY - uy * (width * 0.28 + length * t) + py * side * (sideWidth + jag)
          });
        }
        shard.push({
          x: toX - ux * length * 0.46 + px * side * width * 0.16,
          y: toY - uy * length * 0.46 + py * side * width * 0.16
        });
        shard.push({
          x: toX - ux * width * 0.18 + px * side * width * 0.12,
          y: toY - uy * width * 0.18 + py * side * width * 0.12
        });
        this.drawGfxPath(shard, "#6b3425", alpha * 0.1, color || "#f97316", alpha * 0.2, 2, zIndex + 30 + side, "add");
      }
    }

    drawGfxShieldPlow(x, y, angle, size, color, alpha, zIndex, phase = 0) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const half = size * 0.46;
      const depth = size * 0.38;
      const rim = color || "#f97316";
      const front = x + ux * depth * 0.68;
      const frontY = y + uy * depth * 0.68;
      const points = [
        { x: x - ux * depth * 0.82 - px * half * 0.78, y: y - uy * depth * 0.82 - py * half * 0.78 },
        { x: front - px * half, y: frontY - py * half },
        { x: front + ux * depth * 0.52 - px * half * 0.42, y: frontY + uy * depth * 0.52 - py * half * 0.42 },
        { x: front + ux * depth * 0.78, y: frontY + uy * depth * 0.78 },
        { x: front + ux * depth * 0.52 + px * half * 0.42, y: frontY + uy * depth * 0.52 + py * half * 0.42 },
        { x: front + px * half, y: frontY + py * half },
        { x: x - ux * depth * 0.82 + px * half * 0.78, y: y - uy * depth * 0.82 + py * half * 0.78 }
      ];
      const inset = points.map((point) => ({
        x: x + (point.x - x) * 0.64 + ux * depth * 0.12,
        y: y + (point.y - y) * 0.64 + uy * depth * 0.12
      }));
      this.drawGfxPath(points, "#2b2118", alpha * 0.92, "#1f140f", alpha * 0.76, 5, zIndex, "normal");
      this.drawGfxPath(inset, "#f8f3e9", alpha * 0.34, rim, alpha * 0.58, 3, zIndex + 2, "add");
      this.drawGfxLine(front - px * half * 0.74, frontY - py * half * 0.74, front + px * half * 0.74, frontY + py * half * 0.74, 9, "#fff7ed", alpha * 0.68, zIndex + 4, "add");
      this.drawGfxLine(x - ux * depth * 0.3 - px * half * 0.52, y - uy * depth * 0.3 - py * half * 0.52, x + ux * depth * 0.48 - px * half * 0.24, y + uy * depth * 0.48 - py * half * 0.24, 5, "#fde68a", alpha * 0.38, zIndex + 5, "add");
      this.drawGfxLine(x - ux * depth * 0.3 + px * half * 0.52, y - uy * depth * 0.3 + py * half * 0.52, x + ux * depth * 0.48 + px * half * 0.24, y + uy * depth * 0.48 + py * half * 0.24, 5, "#fde68a", alpha * 0.38, zIndex + 5, "add");
      const boss = size * (0.13 + Math.sin(phase * Math.PI) * 0.018);
      this.drawGfxDiamond(x + ux * depth * 0.22, y + uy * depth * 0.22, boss, "#fde68a", alpha * 0.5, zIndex + 8, angle, "#fff7ed");
    }

    drawGfxShieldWall(x, y, angle, size, color, alpha, zIndex, crash = false) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const half = size * 0.5;
      const depth = size * 0.34;
      const rim = color || "#f97316";
      const body = [
        { x: x - ux * depth * 0.88 - px * half * 0.68, y: y - uy * depth * 0.88 - py * half * 0.68 },
        { x: x + ux * depth * 0.2 - px * half, y: y + uy * depth * 0.2 - py * half },
        { x: x + ux * depth * 1.18 - px * half * 0.76, y: y + uy * depth * 1.18 - py * half * 0.76 },
        { x: x + ux * depth * 1.48 - px * half * 0.28, y: y + uy * depth * 1.48 - py * half * 0.28 },
        { x: x + ux * depth * 1.64, y: y + uy * depth * 1.64 },
        { x: x + ux * depth * 1.48 + px * half * 0.28, y: y + uy * depth * 1.48 + py * half * 0.28 },
        { x: x + ux * depth * 1.18 + px * half * 0.76, y: y + uy * depth * 1.18 + py * half * 0.76 },
        { x: x + ux * depth * 0.2 + px * half, y: y + uy * depth * 0.2 + py * half },
        { x: x - ux * depth * 0.88 + px * half * 0.68, y: y - uy * depth * 0.88 + py * half * 0.68 }
      ];
      const inner = body.map((point) => ({
        x: x + (point.x - x) * 0.62 + ux * depth * 0.1,
        y: y + (point.y - y) * 0.62 + uy * depth * 0.1
      }));
      this.drawGfxPath(body, "#2b2118", alpha * 0.9, "#3f2416", alpha * 0.86, crash ? 5 : 4, zIndex, "normal");
      this.drawGfxPath(inner, "#f8f3e9", alpha * 0.32, rim, alpha * 0.5, 3, zIndex + 1, "add");
      const bossX = x + ux * depth * 0.36;
      const bossY = y + uy * depth * 0.36;
      const boss = [
        { x: bossX - px * half * 0.26, y: bossY - py * half * 0.26 },
        { x: bossX + ux * depth * 0.34, y: bossY + uy * depth * 0.34 },
        { x: bossX + px * half * 0.26, y: bossY + py * half * 0.26 },
        { x: bossX - ux * depth * 0.34, y: bossY - uy * depth * 0.34 }
      ];
      this.drawGfxPath(boss, "#fde68a", alpha * 0.36, "#fff7ed", alpha * 0.42, 2, zIndex + 3, "add");
      for (let i = -1; i <= 1; i += 1) {
        const side = i * half * 0.46;
        const sx = x - ux * depth * 0.34 + px * side;
        const sy = y - uy * depth * 0.34 + py * side;
        const ex = x + ux * depth * 1.05 + px * side * 0.68;
        const ey = y + uy * depth * 1.05 + py * side * 0.68;
        this.drawGfxLine(sx, sy, ex, ey, i === 0 ? 7 : 4, i === 0 ? "#fff7ed" : "#fde68a", alpha * (i === 0 ? 0.46 : 0.28), zIndex + 4 + i, "add");
      }
      this.drawGfxLine(x + ux * depth * 1.5 - px * half * 0.42, y + uy * depth * 1.5 - py * half * 0.42, x + ux * depth * 1.5 + px * half * 0.42, y + uy * depth * 1.5 + py * half * 0.42, crash ? 10 : 8, "#f8f3e9", alpha * 0.68, zIndex + 8, "add");
      if (crash) this.drawGfxSparkSpray(x + ux * depth * 1.72, y + uy * depth * 1.72, size * 0.46, "#fde68a", alpha * 0.34, zIndex + 12, 11, angle, angle, Math.PI * 0.72);
    }

    drawGfxShieldCrash(x, y, angle, width, color, alpha, zIndex, phase = 0) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const rim = color || "#f97316";
      for (let i = -3; i <= 3; i += 1) {
        const spread = i * 0.18;
        const a = angle + spread;
        const sx = x - ux * width * 0.12 + px * i * width * 0.12;
        const sy = y - uy * width * 0.12 + py * i * width * 0.12;
        const ex = x + Math.cos(a) * width * (0.52 + Math.abs(i) * 0.04);
        const ey = y + Math.sin(a) * width * (0.52 + Math.abs(i) * 0.04);
        this.drawGfxLine(sx, sy, ex, ey, i === 0 ? 9 : 4, i % 2 ? rim : "#fde68a", alpha * (i === 0 ? 0.58 : 0.34), zIndex + i + 4, "add");
      }
      this.drawGfxSparkSpray(x + ux * width * 0.28, y + uy * width * 0.28, width * 0.72, "#fde68a", alpha * 0.42, zIndex + 14, 14, phase * 4, angle, Math.PI * 0.9);
    }

    drawGfxShoutWave(x, y, radius, color, alpha, zIndex, progress = 0) {
      const base = Math.max(68, radius);
      const phase = progress * Math.PI * 2;
      for (let layer = 0; layer < 3; layer += 1) {
        const wave = base * (0.32 + layer * 0.2 + progress * 0.18);
        const segments = 9 + layer * 2;
        for (let i = 0; i < segments; i += 1) {
          if ((i + layer) % 3 === 1) continue;
          const a = (Math.PI * 2 * i) / segments + Math.sin(phase + i) * 0.04;
          const span = 0.12 + layer * 0.018;
          this.drawGfxArc(x, y, wave, a - span, a + span, layer === 0 ? 7 : 5, layer === 1 ? "#fde68a" : color, alpha * (0.48 - layer * 0.09), zIndex + layer * 4 + i, "add", 4);
        }
      }
      for (let i = 0; i < 10; i += 1) {
        const a = -Math.PI / 2 + (i - 4.5) * 0.15 + Math.sin(phase + i) * 0.05;
        const inner = 18 + (i % 2) * 8;
        const outer = base * (0.26 + (i % 3) * 0.045 + progress * 0.06);
        this.drawGfxLine(x + Math.cos(a) * inner, y + Math.sin(a) * inner, x + Math.cos(a) * outer, y + Math.sin(a) * outer, i % 2 ? 4 : 6, i % 2 ? "#fde68a" : color, alpha * 0.4, zIndex + 30 + i, "add");
      }
    }

    drawGfxCapsule(fromX, fromY, toX, toY, width, color, alpha, zIndex) {
      const segments = pixiPrimitives.capsuleSegments
        ? pixiPrimitives.capsuleSegments(fromX, fromY, toX, toY, width)
        : null;
      if (!segments) return;
      this.drawGfxLine(segments.center.x1, segments.center.y1, segments.center.x2, segments.center.y2, width, color, alpha * 0.22, zIndex, "add");
      this.drawGfxLine(segments.sideA.x1, segments.sideA.y1, segments.sideA.x2, segments.sideA.y2, 4, color, alpha * 0.42, zIndex + 1, "add");
      this.drawGfxLine(segments.sideB.x1, segments.sideB.y1, segments.sideB.x2, segments.sideB.y2, 4, color, alpha * 0.42, zIndex + 1, "add");
      this.drawGfxCircle(segments.cap.x, segments.cap.y, segments.cap.radius, color, alpha * 0.12, color, alpha * 0.32, 4, zIndex + 2, "add", 24);
    }

    drawGfxArrow(fromX, fromY, toX, toY, color, alpha, zIndex, width = 5) {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const len = Math.hypot(dx, dy);
      if (len < 2) return;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const head = Math.min(22, Math.max(12, len * 0.18));
      this.drawGfxLine(fromX, fromY, toX - ux * head * 0.55, toY - uy * head * 0.55, width, color, alpha, zIndex, "add");
      this.drawGfxPath(
        [
          { x: toX, y: toY },
          { x: toX - ux * head + px * head * 0.42, y: toY - uy * head + py * head * 0.42 },
          { x: toX - ux * head * 0.68, y: toY - uy * head * 0.68 },
          { x: toX - ux * head - px * head * 0.42, y: toY - uy * head - py * head * 0.42 }
        ],
        color,
        alpha * 0.78,
        "#f8f3e9",
        alpha * 0.22,
        2,
        zIndex + 1,
        "add"
      );
    }

    drawGfxLightning(fromX, fromY, toX, toY, color, alpha, zIndex, width = 7, segments = 7, jitter = 12, phase = 0) {
      const path = pixiPrimitives.lightningPoints
        ? pixiPrimitives.lightningPoints(fromX, fromY, toX, toY, segments, jitter, phase)
        : null;
      if (!path || !Number.isFinite(alpha) || alpha <= 0) return;
      const points = path.points;
      const mainWidth = Math.max(1.5, Number(width) || 1.5);
      const coreWidth = Math.max(1.4, mainWidth * 0.34);
      const coreColor = "#f8fafc";
      const ribbon = (source, spread, wobble = 0.34) => {
        const left = [];
        const right = [];
        for (let i = 0; i < source.length; i += 1) {
          const prev = source[Math.max(0, i - 1)];
          const next = source[Math.min(source.length - 1, i + 1)];
          const dx = next.x - prev.x;
          const dy = next.y - prev.y;
          const len = Math.hypot(dx, dy) || 1;
          const px = -dy / len;
          const py = dx / len;
          const taper = i === 0 || i === source.length - 1 ? 0.48 : 1;
          const jag = 1 + ((i % 2 ? 1 : -1) * wobble + Math.sin((Number(phase) || 0) * 3.1 + i * 2.17) * wobble * 0.28);
          const w = Math.max(0.9, spread * taper * jag);
          left.push({ x: source[i].x + px * w, y: source[i].y + py * w });
          right.unshift({ x: source[i].x - px * w * 0.82, y: source[i].y - py * w * 0.82 });
        }
        return [...left, ...right];
      };
      const branchRibbon = (start, end, spread, z, branchAlpha) => {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const px = -uy;
        const py = ux;
        const mid = {
          x: start.x + dx * 0.56 + px * Math.sin((Number(phase) || 0) * 5.7 + len) * spread * 0.8,
          y: start.y + dy * 0.56 + py * Math.sin((Number(phase) || 0) * 5.7 + len) * spread * 0.8
        };
        this.drawGfxPath(
          [
            { x: start.x + px * spread, y: start.y + py * spread },
            { x: mid.x + px * spread * 0.48, y: mid.y + py * spread * 0.48 },
            { x: end.x + ux * spread * 0.8, y: end.y + uy * spread * 0.8 },
            { x: mid.x - px * spread * 0.34, y: mid.y - py * spread * 0.34 },
            { x: start.x - px * spread * 0.72, y: start.y - py * spread * 0.72 }
          ],
          color,
          branchAlpha,
          coreColor,
          branchAlpha * 0.62,
          Math.max(0.8, spread * 0.16),
          z,
          "add"
        );
        this.drawGfxLine(start.x, start.y, end.x, end.y, Math.max(1.2, spread * 0.24), coreColor, branchAlpha * 0.7, z + 1, "add");
      };
      this.drawGfxPath(ribbon(points, mainWidth * 2.65, 0.2), "#061226", alpha * 0.16, color, alpha * 0.18, 1.6, zIndex - 5, "add");
      this.drawGfxPath(ribbon(points, mainWidth * 1.36, 0.4), color, alpha * 0.62, color, alpha * 0.34, 1.2, zIndex, "add");
      this.drawGfxPath(ribbon(points, Math.max(1.7, coreWidth * 1.45), 0.2), coreColor, alpha * 0.78, "#ffffff", alpha * 0.32, 0.8, zIndex + 3, "add");
      for (let i = 1; i < points.length - 1; i += 1) {
        if (i % 3 === 0) {
          const nick = Math.max(4, mainWidth * 0.7);
          const side = i % 2 ? 1 : -1;
          this.drawGfxPath(
            [
              { x: points[i].x + path.px * side * nick * 0.2, y: points[i].y + path.py * side * nick * 0.2 },
              { x: points[i].x + path.px * side * nick * 1.8 - path.ux * nick * 0.35, y: points[i].y + path.py * side * nick * 1.8 - path.uy * nick * 0.35 },
              { x: points[i].x + path.ux * nick * 0.85, y: points[i].y + path.uy * nick * 0.85 }
            ],
            coreColor,
            alpha * 0.34,
            color,
            alpha * 0.22,
            0.8,
            zIndex + 6 + i,
            "add"
          );
        }
        const forkSeed = Math.sin((Number(phase) || 0) * 13.7 + i * 4.31 + path.jitter * 0.21);
        const forkSide = (i % 4 === 1 ? 1 : -1) * (forkSeed >= 0 ? 1 : -1);
        const forkLength = path.jitter * (0.85 + Math.abs(forkSeed) * 0.78) + mainWidth * 2.1;
        const forkBack = path.jitter * (0.22 + Math.abs(Math.sin(i * 2.9)) * 0.22);
        const end = {
          x: points[i].x + path.px * forkSide * forkLength + path.ux * forkBack,
          y: points[i].y + path.py * forkSide * forkLength + path.uy * forkBack
        };
        const branchWidth = Math.max(1.4, mainWidth * 0.42);
        branchRibbon(points[i], end, branchWidth + 1.8, zIndex + 8 + i, alpha * 0.22);
      }
      this.drawGfxCircle(toX, toY, mainWidth * 1.45, color, alpha * 0.16, coreColor, alpha * 0.38, Math.max(1.5, coreWidth), zIndex + points.length + 1, "add", 12);
    }

    drawGfxStar(x, y, radius, color, alpha, zIndex, points = 8) {
      const poly = pixiPrimitives.starPoints
        ? pixiPrimitives.starPoints(x, y, radius, points)
        : [];
      this.drawGfxPath(poly, color, alpha * 0.55, "#f8f3e9", alpha * 0.32, 2, zIndex, "add");
    }

    drawGfxShardBurst(x, y, radius, color, alpha, zIndex, count = 10, phase = 0) {
      for (let i = 0; i < count; i += 1) {
        const a = phase + (Math.PI * 2 * i) / count;
        const inner = radius * (0.18 + (i % 2) * 0.08);
        const outer = radius * (0.72 + (i % 3) * 0.08);
        const side = 4 + (i % 2) * 3;
        const tipX = x + Math.cos(a) * outer;
        const tipY = y + Math.sin(a) * outer;
        const baseX = x + Math.cos(a) * inner;
        const baseY = y + Math.sin(a) * inner;
        const px = -Math.sin(a);
        const py = Math.cos(a);
        this.drawGfxPath(
          [
            { x: tipX, y: tipY },
            { x: baseX + px * side, y: baseY + py * side },
            { x: baseX - px * side, y: baseY - py * side }
          ],
          color,
          alpha * 0.44,
          "#f8f3e9",
          alpha * 0.24,
          1.5,
          zIndex + i,
          "add"
        );
      }
    }

    drawGfxFlask(x, y, angle, color, alpha, zIndex, scale = 1) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const neck = 8 * scale;
      const body = 16 * scale;
      const cx = x + ux * 4 * scale;
      const cy = y + uy * 4 * scale;
      this.drawGfxLine(cx - ux * body * 0.9, cy - uy * body * 0.9, cx - ux * neck * 0.2, cy - uy * neck * 0.2, 7 * scale, "#f8f3e9", alpha * 0.64, zIndex, "add");
      this.drawGfxPath(
        [
          { x: cx + px * body * 0.8, y: cy + py * body * 0.8 },
          { x: cx + ux * body * 0.72 + px * body * 0.48, y: cy + uy * body * 0.72 + py * body * 0.48 },
          { x: cx + ux * body * 0.88, y: cy + uy * body * 0.88 },
          { x: cx + ux * body * 0.72 - px * body * 0.48, y: cy + uy * body * 0.72 - py * body * 0.48 },
          { x: cx - px * body * 0.8, y: cy - py * body * 0.8 }
        ],
        color,
        alpha * 0.48,
        "#f8f3e9",
        alpha * 0.4,
        2,
        zIndex + 1,
        "add"
      );
    }

    drawGfxDiamond(x, y, size, color, alpha, zIndex, rotation = 0, strokeColor = "#f8f3e9") {
      const points = pixiPrimitives.diamondPoints
        ? pixiPrimitives.diamondPoints(x, y, size, rotation)
        : [];
      this.drawGfxPath(points, color, alpha * 0.72, strokeColor, alpha * 0.28, 1.5, zIndex, "add");
    }

    drawGfxRuneRing(x, y, radius, color, alpha, zIndex, phase = 0, count = 8) {
      const pieces = Math.max(6, count);
      for (let i = 0; i < pieces; i += 1) {
        const a = phase + (Math.PI * 2 * i) / pieces;
        const span = Math.PI * 0.1 + (i % 2) * Math.PI * 0.035;
        this.drawGfxArc(x, y, radius, a - span, a + span, i % 3 === 0 ? 4 : 2.5, color, alpha * (0.34 + (i % 2) * 0.12), zIndex + i, "add", 5);
        if (i % 2 === 0) {
          this.drawGfxDiamond(x + Math.cos(a) * radius, y + Math.sin(a) * radius, 5 + (i % 3), color, alpha * 0.42, zIndex + i + 1, a);
        }
      }
    }

    drawGfxSparkSpray(x, y, radius, color, alpha, zIndex, count = 10, phase = 0, direction = null, spread = Math.PI * 2) {
      const requested = Math.max(0, Math.round(Number(count) || 0));
      const drawCount = this.particleEngine?.reserve ? this.particleEngine.reserve(requested) : requested;
      if (drawCount <= 0) return;
      for (let i = 0; i < drawCount; i += 1) {
        const base = direction == null ? phase + (Math.PI * 2 * i) / drawCount : direction - spread / 2 + (spread * (i + 0.5)) / drawCount;
        const wobble = Math.sin(phase * 5 + i * 1.73) * 0.18;
        const a = base + wobble;
        const inner = radius * (0.18 + (i % 3) * 0.04);
        const outer = radius * (0.55 + (i % 4) * 0.08);
        const sx = x + Math.cos(a) * inner;
        const sy = y + Math.sin(a) * inner;
        const tx = x + Math.cos(a) * outer;
        const ty = y + Math.sin(a) * outer;
        this.drawGfxLine(sx, sy, tx, ty, i % 2 ? 2.5 : 4, color, alpha * (0.32 + (i % 3) * 0.08), zIndex + i, "add");
        if (i % 3 === 0) this.drawGfxDiamond(tx, ty, 4 + (i % 2) * 2, color, alpha * 0.34, zIndex + i + 1, a);
      }
    }

    drawGfxSwirl(x, y, radius, color, alpha, zIndex, phase = 0, arms = 3) {
      const count = Math.max(2, arms);
      for (let i = 0; i < count; i += 1) {
        const start = phase + (Math.PI * 2 * i) / count;
        for (let j = 0; j < 3; j += 1) {
          const r = radius * (0.35 + j * 0.2);
          this.drawGfxArc(x, y, r, start + j * 0.22, start + j * 0.22 + 0.92, 5 - j, color, alpha * (0.32 - j * 0.055), zIndex + i * 4 + j, "add", 9);
        }
      }
    }

    drawGfxGear(x, y, radius, color, alpha, zIndex, phase = 0, teeth = 10) {
      const points = pixiPrimitives.gearPoints
        ? pixiPrimitives.gearPoints(x, y, radius, phase, teeth)
        : [];
      this.drawGfxPath(points, color, alpha * 0.11, color, alpha * 0.38, 2.5, zIndex, "add");
      this.drawGfxCircle(x, y, radius * 0.42, color, alpha * 0.07, "#dbeafe", alpha * 0.2, 2, zIndex + 1, "add", 18);
    }

    drawGfxImpactBurst(x, y, radius, color, alpha, zIndex, phase = 0, count = 12) {
      this.drawGfxCircle(x, y, radius * 0.36, color, alpha * 0.16, "#f8f3e9", alpha * 0.26, 2, zIndex, "add", 18);
      this.drawGfxSparkSpray(x, y, radius, color, alpha, zIndex + 1, count, phase);
    }

    renderParticlePreset(preset, options) {
      if (!this.particleEngine?.renderPreset) return false;
      return this.particleEngine.renderPreset(this, preset, options);
    }

    warriorSkillPalette(color) {
      return {
        tint: color || "#f97316",
        edge: "#fde68a",
        blade: "#fff7ed",
        steel: "#f8f3e9",
        dark: "#3f2416",
        shadow: "#160b07",
        warn: "#ef4444"
      };
    }

    renderUnifiedWarriorSkillEffect(effect, progress, alpha, radius, color, style) {
      const s = String(style || effect.style || "").toLowerCase();
      const kind = String(effect.kind || "").toLowerCase();
      if (!s && kind !== "spin") return false;
      if (kind === "impact" && (
        s.includes("shield_slam") ||
        s.includes("cleave_impact") ||
        s.includes("cleave_followup") ||
        s.includes("cleave_execute") ||
        s.includes("blade_impact") ||
        s.includes("spin_impact")
      )) {
        return this.renderWarriorImpactCleanEffect(effect, progress, alpha, radius, color, s);
      }
      if (s.includes("shield_charge")) return this.renderWarriorChargeCleanEffect(effect, progress, alpha, radius, color);
      if (s === "taunt" || s.includes("taunt")) return this.renderWarriorTauntCleanEffect(effect, progress, alpha, radius, color);
      if (s.includes("warrior_forward_whirlwind_launch")) {
        return this.renderWarriorForwardWhirlwindLaunchEffect(effect, progress, alpha, radius, color);
      }
      if (s.includes("warrior_spin") || (kind === "spin" && s.includes("warrior"))) {
        return this.renderWarriorSpinCleanEffect(effect, progress, alpha, radius, color);
      }
      if (s.includes("warrior_cleave_vertical")) {
        this.renderWarriorVerticalCleaveEffect(effect, progress, alpha, color, radius);
        return true;
      }
      if (s.includes("warrior_cleave")) {
        this.renderWarriorConeEffect(effect, progress, alpha, color, true);
        return true;
      }
      if (s.includes("warrior_basic") || (kind === "slash" && s.includes("warrior"))) {
        return this.renderWarriorBasicSlashCleanEffect(effect, progress, alpha, radius, color);
      }
      return false;
    }

    renderWarriorBasicSlashCleanEffect(effect, progress, alpha, radius, color) {
      const angle = Number(effect.angle || 0);
      const side = Number(effect.swingSide || 1) >= 0 ? 1 : -1;
      const reachFromRadius = Math.max(64, Number(effect.radius || radius || 84) / 1.18);
      const reach = Math.max(74, Number(effect.reach || reachFromRadius));
      const originX = Number.isFinite(effect.originX) ? effect.originX : effect.x - Math.cos(angle) * reach * 0.48;
      const originY = Number.isFinite(effect.originY) ? effect.originY : effect.y - Math.sin(angle) * reach * 0.48;
      if (!Number.isFinite(originX) || !Number.isFinite(originY)) return false;
      const t = Math.max(0, Math.min(1, progress));
      const active = Math.min(1, t / 0.74);
      const ease = active * active * (3 - 2 * active);
      const fade = Math.max(0, 1 - Math.max(0, t - 0.76) / 0.24);
      const peak = Math.sin(t * Math.PI);
      const palette = this.warriorSkillPalette(color);
      const halfAngle = 0.76;
      const startAngle = angle - halfAngle * side;
      const endAngle = angle + halfAngle * side;
      const bladeAngle = startAngle + (endAngle - startAngle) * ease;
      const trailAngle = bladeAngle - halfAngle * 0.44 * side;
      const z = originY + Math.sin(angle) * reach * 0.64 + 108;
      const activeAlpha = alpha * fade;

      this.drawGfxCleaveRibbon(originX, originY, reach * 0.42, reach * 1.02, trailAngle, bladeAngle, palette.tint, activeAlpha * 0.055, palette.edge, activeAlpha * 0.16, 2, z - 2, "add", 10);
      this.drawGfxArc(originX, originY, reach, trailAngle + 0.03 * side, bladeAngle - 0.03 * side, 5, palette.blade, activeAlpha * 0.34, z + 1, "add", 9);
      this.drawGfxGreatsword(originX, originY, bladeAngle, reach * (0.9 + peak * 0.04), palette.tint, activeAlpha * 0.86, z + 8, false);
      const tipX = originX + Math.cos(bladeAngle) * reach * 0.98;
      const tipY = originY + Math.sin(bladeAngle) * reach * 0.98;
      this.drawGfxSparkSpray(tipX, tipY, reach * 0.18, palette.edge, activeAlpha * 0.22, z + 12, 5, progress * 2.8, bladeAngle, Math.PI * 0.48);
      return true;
    }

    renderWarriorSpinCleanEffect(effect, progress, alpha, radius, color) {
      const x = Number(effect.x);
      const y = Number(effect.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const t = Math.max(0, Math.min(1, progress));
      const sweep = Math.min(1, t / 0.78);
      const sweepEase = 1 - Math.pow(1 - sweep, 3);
      const peak = Math.sin(t * Math.PI);
      const fade = Math.max(0, 1 - Math.max(0, t - 0.82) / 0.18);
      const palette = this.warriorSkillPalette(color);
      const baseRadius = Math.max(118, Number(effect.rangeRadius || effect.radius || radius || 130));
      const slashRadius = Math.max(92, Math.min(250, baseRadius * 0.82));
      const startAngle = -Math.PI * 0.72 + Number(effect.angle || 0) * 0.22 + Number(effect.seed || 0) * 0.13;
      const bladeAngle = startAngle + Math.PI * 2.1 * sweepEase;
      const trailSpan = Math.PI * (0.72 + peak * 0.18);
      const trailStart = bladeAngle - trailSpan;
      const hiltBack = Math.max(10, slashRadius * 0.09);
      const hiltX = x - Math.cos(bladeAngle) * hiltBack;
      const hiltY = y - Math.sin(bladeAngle) * hiltBack;
      const swordReach = slashRadius * (0.88 + peak * 0.06);
      const z = y + 126;
      const activeAlpha = alpha * fade * (0.76 + peak * 0.18);

      this.drawGfxCircle(x, y, baseRadius, palette.shadow, activeAlpha * 0.014, palette.edge, activeAlpha * 0.13, 2.5, z - 30, "add", 96);
      this.drawGfxCircle(x, y, slashRadius * 0.36, palette.shadow, activeAlpha * 0.035, palette.tint, activeAlpha * 0.13, 2, z - 18, "add", 42);
      this.drawGfxCleaveRibbon(x, y, slashRadius * 0.38, slashRadius * 1.03, trailStart, bladeAngle, palette.tint, activeAlpha * 0.07, palette.edge, activeAlpha * 0.2, 3, z - 4, "add", 26);
      this.drawGfxArc(x, y, slashRadius * 1.04, trailStart + 0.04, bladeAngle, 7, palette.blade, activeAlpha * 0.36, z + 4, "add", 30);
      this.drawGfxArc(x, y, slashRadius * 0.69, bladeAngle - Math.PI * 0.44, bladeAngle - Math.PI * 0.08, 3, palette.tint, activeAlpha * 0.18, z + 5, "add", 14);
      this.drawGfxGreatsword(hiltX, hiltY, bladeAngle - 0.24, swordReach * 0.84, palette.edge, activeAlpha * 0.18, z + 7, false);
      this.drawGfxGreatsword(hiltX, hiltY, bladeAngle, swordReach, palette.tint, activeAlpha * (0.88 + peak * 0.08), z + 18, true);
      const tipX = hiltX + Math.cos(bladeAngle) * swordReach;
      const tipY = hiltY + Math.sin(bladeAngle) * swordReach;
      this.drawGfxLine(tipX - Math.cos(bladeAngle) * 18, tipY - Math.sin(bladeAngle) * 18, tipX + Math.cos(bladeAngle) * 10, tipY + Math.sin(bladeAngle) * 10, 5, palette.edge, activeAlpha * 0.32, z + 31, "add");
      this.drawGfxImpactBurst(tipX, tipY, slashRadius * 0.16, palette.tint, activeAlpha * 0.16, z + 34, t * 3.2, 6);
      this.drawGfxSparkSpray?.(tipX, tipY, slashRadius * 0.22, palette.edge, activeAlpha * 0.2, z + 38, 7, t * 4.2, bladeAngle, Math.PI * 0.5);
      return true;
    }

    renderWarriorForwardWhirlwindLaunchEffect(effect, progress, alpha, radius, color) {
      const x = Number(effect.x);
      const y = Number(effect.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const t = Math.max(0, Math.min(1, progress));
      const peak = Math.sin(t * Math.PI);
      const fade = Math.max(0, 1 - Math.max(0, t - 0.78) / 0.22);
      const launchRadius = Math.max(72, Math.min(180, Number(effect.radius || effect.rangeRadius || radius || 110)));
      const angle = Number(effect.angle || 0);
      const palette = this.warriorSkillPalette(color);
      const z = y + 104;
      const activeAlpha = alpha * fade * (0.72 + peak * 0.16);
      const phase = angle + t * Math.PI * 2.25 + Number(effect.seed || 0) * 0.13;

      this.drawGfxCircle(x, y, launchRadius * (0.45 + t * 0.32), palette.shadow, activeAlpha * 0.035, palette.tint, activeAlpha * 0.18, 2.5, z - 12, "add", 44);
      this.drawGfxCircle(x, y, launchRadius * (0.24 + peak * 0.08), palette.shadow, activeAlpha * 0.035, palette.edge, activeAlpha * 0.12, 2, z - 8, "add", 28);
      for (let i = 0; i < 3; i += 1) {
        const r = launchRadius * (0.42 + i * 0.16);
        const start = phase + i * 1.18;
        const end = start + 0.95 + peak * 0.22;
        this.drawGfxArc(x, y, r, start, end, 5 - i, i === 0 ? palette.blade : palette.tint, activeAlpha * (0.24 - i * 0.04), z + i, "add", 12);
      }
      this.drawGfxLine(x - Math.cos(angle) * launchRadius * 0.38, y - Math.sin(angle) * launchRadius * 0.38, x + Math.cos(angle) * launchRadius * 0.58, y + Math.sin(angle) * launchRadius * 0.58, 4, palette.tint, activeAlpha * 0.14, z + 8, "add");
      return true;
    }

    renderWarriorTauntCleanEffect(effect, progress, alpha, radius, color) {
      const x = Number(effect.x);
      const y = Number(effect.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const t = Math.max(0, Math.min(1, progress));
      const ease = 1 - Math.pow(1 - t, 2.8);
      const fade = Math.max(0, 1 - Math.max(0, t - 0.76) / 0.24);
      const palette = this.warriorSkillPalette(color);
      const tauntRadius = Math.max(92, Number(effect.rangeRadius || effect.radius || radius || 132));
      const ringRadius = tauntRadius * (0.16 + ease * 0.84);
      const z = y + 118;
      const activeAlpha = alpha * fade;

      this.drawGfxCircle(x, y, ringRadius, palette.warn, activeAlpha * 0.035, palette.warn, activeAlpha * 0.46, 5, z, "add", 72);
      this.drawGfxCircle(x, y, ringRadius * 0.62, palette.shadow, activeAlpha * 0.025, palette.edge, activeAlpha * 0.24, 2, z - 1, "add", 54);
      for (let i = 0; i < 12; i += 1) {
        const a = (Math.PI * 2 * i) / 12;
        const inner = ringRadius * 0.76;
        const outer = ringRadius * (0.96 + (i % 3) * 0.025);
        this.drawGfxLine(
          x + Math.cos(a) * inner,
          y + Math.sin(a) * inner,
          x + Math.cos(a) * outer,
          y + Math.sin(a) * outer,
          i % 3 === 0 ? 5 : 3,
          i % 2 ? palette.edge : palette.warn,
          activeAlpha * 0.32,
          z + 4 + i,
          "add"
        );
      }
      const iconAlpha = activeAlpha * Math.max(0.35, 1 - t * 0.35);
      this.drawGfxLine(x, y - 34, x, y - 9, 8, palette.blade, iconAlpha * 0.8, z + 24, "add");
      this.drawGfxCircle(x, y + 8, 5.5, palette.blade, iconAlpha * 0.72, palette.edge, iconAlpha * 0.32, 1, z + 25, "add", 10);
      return true;
    }

    renderWarriorChargeCleanEffect(effect, progress, alpha, radius, color) {
      const angle = Number(effect.angle || 0);
      const end = this.effectEndpoints(effect, radius, angle);
      if (!end) return false;
      const moveDuration = Math.max(0.12, Number(effect.moveDuration || 0.42));
      const fullDuration = Math.max(moveDuration, Number(effect.duration || effect.ttl || 0.62));
      const rawTravel = Math.min(1, progress / Math.max(0.12, moveDuration / fullDuration));
      const travel = rawTravel * rawTravel * (3 - 2 * rawTravel);
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const width = Math.max(66, Number(effect.contactRadius || 64) * 1.02);
      const headX = end.fromX + (end.toX - end.fromX) * travel;
      const headY = end.fromY + (end.toY - end.fromY) * travel;
      const shieldX = headX + ux * width * 0.34;
      const shieldY = headY + uy * width * 0.34;
      const palette = this.warriorSkillPalette(color);
      const peak = Math.sin(Math.max(0, Math.min(1, progress)) * Math.PI);
      const z = Math.max(effect.y + 92, shieldY + 112);
      const laneAlpha = alpha * (0.32 + peak * 0.08);

      this.drawGfxLine(end.fromX, end.fromY, headX, headY, width * 0.34, palette.shadow, alpha * 0.08, z - 18, "add");
      for (let side = -1; side <= 1; side += 2) {
        const offset = width * 0.34 * side;
        this.drawGfxLine(end.fromX + px * offset, end.fromY + py * offset, headX + px * offset * 0.52, headY + py * offset * 0.52, 4, palette.edge, laneAlpha * 0.44, z - 8 + side, "add");
      }
      this.drawGfxDashDust?.(end.fromX, end.fromY, headX, headY, width * 0.46, angle, "#caa35a", alpha * 0.34, z - 14, progress, { charge: true, long: true });
      if (this.drawGfxFrontShield) {
        this.drawGfxFrontShield(shieldX, shieldY, angle, width * 0.86, palette.tint, alpha * (0.84 + peak * 0.08), z + 6, progress);
      } else {
        this.drawGfxShieldWall(shieldX, shieldY, angle, width * 0.7, palette.tint, alpha * 0.76, z + 6, false);
      }
      this.drawGfxLine(shieldX - ux * width * 0.56, shieldY - uy * width * 0.56, shieldX + ux * width * 0.28, shieldY + uy * width * 0.28, 5, palette.blade, alpha * 0.32, z + 14, "add");
      if (travel >= 0.92) {
        this.drawGfxShieldCrash(end.toX, end.toY, angle, width * 0.78, palette.tint, alpha * Math.max(0.2, 1 - (progress - moveDuration / fullDuration) * 3), z + 22, progress);
      }
      return true;
    }

    renderWarriorImpactCleanEffect(effect, progress, alpha, radius, color, style) {
      const palette = this.warriorSkillPalette(color);
      const hitRadius = Math.max(34, Number(effect.radius || radius || 42));
      const angle = Number.isFinite(effect.angle) ? Number(effect.angle) : Number(effect.seed || 0);
      const z = effect.y + 96;
      if (style.includes("shield")) {
        this.drawGfxShieldCrash(effect.x, effect.y, angle, hitRadius * 0.92, palette.tint, alpha * 0.48, z, progress);
        return true;
      }
      if (style.includes("cleave_execute")) {
        const t = Math.max(0, Math.min(1, progress));
        const fade = Math.max(0, 1 - Math.max(0, t - 0.72) / 0.28);
        const draw = Math.min(1, t / 0.14);
        const pulse = Math.sin(t * Math.PI);
        const size = hitRadius * (0.98 + pulse * 0.12) * (0.18 + draw * 0.82);
        const baseAlpha = alpha * fade;
        const rot = angle + Math.PI * 0.18;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const toWorld = (x, y, scale = 1) => ({
          x: effect.x + (x * cos - y * sin) * size * scale,
          y: effect.y + (x * sin + y * cos) * size * scale
        });
        const armShape = (localAngle, len, width, hook = 0) => {
          const ux = Math.cos(localAngle);
          const uy = Math.sin(localAngle);
          const px = -uy;
          const py = ux;
          const point = (along, side, jut = 0) => [
            ux * along + px * side + ux * jut,
            uy * along + py * side + uy * jut
          ];
          return [
            point(len, 0, 0.06),
            point(len * 0.82, width * 0.05 + hook * 0.02),
            point(len * 0.53, width * 0.42),
            point(len * 0.24, width * 0.2),
            point(len * 0.03, width * 0.08),
            point(len * 0.16, -width * 0.34),
            point(len * 0.48, -width * 0.31 - hook * 0.02),
            point(len * 0.76, -width * 0.07)
          ];
        };
        const arms = [
          { angle: -2.28, len: 1.28, width: 0.19, hook: 0.07 },
          { angle: -0.56, len: 1.06, width: 0.18, hook: -0.05 },
          { angle: 0.64, len: 1.34, width: 0.2, hook: 0.04 },
          { angle: 2.12, len: 1.1, width: 0.21, hook: -0.06 }
        ];
        for (let i = 0; i < arms.length; i += 1) {
          const arm = arms[i];
          const redPath = armShape(arm.angle, arm.len, arm.width, arm.hook).map(([x, y]) => toWorld(x, y, 1));
          const glowPath = armShape(arm.angle, arm.len, arm.width * 1.16, arm.hook).map(([x, y]) => toWorld(x, y, 1.06 + pulse * 0.03));
          this.drawGfxPath(glowPath, "#ef1d22", baseAlpha * 0.07, "#ef4444", baseAlpha * 0.13, 1.4, z + 4 + i, "add");
          this.drawGfxPath(redPath, "#ef1d22", baseAlpha * 0.94, "#7f1d1d", baseAlpha * 0.44, 1.6, z + 8 + i, "add");
        }
        const centerShape = [
          [-0.06, -0.42],
          [0.1, -0.2],
          [0.42, -0.31],
          [0.2, -0.03],
          [0.45, 0.48],
          [0.06, 0.25],
          [-0.36, 0.38],
          [-0.18, 0.08],
          [-0.54, -0.09],
          [-0.18, -0.22]
        ].map(([x, y]) => toWorld(x, y, 1));
        this.drawGfxPath(centerShape, "#050000", baseAlpha * 0.98, "#120101", baseAlpha * 0.84, 1.8, z + 16, "normal");
        if (pulse > 0.2) {
          const shardAlpha = baseAlpha * 0.2 * pulse;
          for (let i = 0; i < arms.length; i += 1) {
            const arm = arms[i];
            const a = toWorld(Math.cos(arm.angle) * arm.len * 0.76, Math.sin(arm.angle) * arm.len * 0.76, 1);
            const b = toWorld(Math.cos(arm.angle) * arm.len * 1.1, Math.sin(arm.angle) * arm.len * 1.1, 1);
            this.drawGfxLine(a.x, a.y, b.x, b.y, 1.6, "#ef4444", shardAlpha, z + 24 + i, "add");
          }
        }
        return true;
      }
      if (style.includes("cleave")) {
        const originX = effect.x - Math.cos(angle) * hitRadius * 0.22;
        const originY = effect.y - Math.sin(angle) * hitRadius * 0.22;
        this.drawGfxCleaveRibbon(originX, originY, hitRadius * 0.22, hitRadius * 0.92, angle - 0.72, angle + 0.42, palette.tint, alpha * 0.08, palette.blade, alpha * 0.24, 3, z, "add", 10);
        this.drawGfxSparkSpray(effect.x, effect.y, hitRadius * 0.66, palette.edge, alpha * 0.2, z + 6, 6, progress * 3, angle, Math.PI * 0.68);
        return true;
      }
      this.drawGfxImpactBurst(effect.x, effect.y, hitRadius * 0.68, palette.tint, alpha * 0.22, z, progress, style.includes("spin") ? 8 : 6);
      return true;
    }

    drawGfxCrescentBlade(centerX, centerY, angle, length, width, color, alpha, zIndex, bend = 1) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const nx = -uy;
      const ny = ux;
      const steps = 9;
      const outer = [];
      const inner = [];
      const tint = color || "#f97316";
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const along = (t - 0.5) * length;
        const taper = Math.sin(t * Math.PI);
        const hooked = Math.sin((t - 0.12) * Math.PI) * width * 0.1;
        const outerCurl = bend * width * (0.04 + taper * 1.18 + hooked / Math.max(1, width));
        const innerCurl = bend * width * (-0.02 + taper * 0.24);
        const x = centerX + ux * along + nx * bend * width * (0.06 + taper * 0.12);
        const y = centerY + uy * along + ny * bend * width * (0.06 + taper * 0.12);
        outer.push({ x: x + nx * outerCurl, y: y + ny * outerCurl });
        inner.unshift({ x: x + nx * innerCurl, y: y + ny * innerCurl });
      }
      this.drawGfxPath([...outer, ...inner], "#f8fafc", alpha * 0.88, tint, alpha * 0.78, 2.5, zIndex, "add");
      this.drawGfxPath([...outer.slice(2, -1), ...inner.slice(1, -2)], "#fff7ed", alpha * 0.32, "#ffffff", alpha * 0.46, 1.5, zIndex + 1, "add");
      this.drawGfxLine(
        centerX - ux * length * 0.22 + nx * bend * width * 0.78,
        centerY - uy * length * 0.22 + ny * bend * width * 0.78,
        centerX + ux * length * 0.32 + nx * bend * width * 0.88,
        centerY + uy * length * 0.32 + ny * bend * width * 0.88,
        Math.max(2, width * 0.12),
        "#ffffff",
        alpha * 0.38,
        zIndex + 2,
        "add"
      );
    }

    renderWarriorBladeWhirlwindOverride(effect, progress, alpha, radius, color) {
      return this.renderWarriorSpinCleanEffect(effect, progress, alpha, radius, color);
    }

    renderWarriorTauntPulseOverride(effect, progress, alpha, radius, color) {
      const x = Number(effect.x);
      const y = Number(effect.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
      const tauntRadius = Math.max(92, Number(effect.rangeRadius || effect.radius || radius || 140));
      const t = Math.max(0, Math.min(1, progress));
      const ease = 1 - Math.pow(1 - t, 3);
      const fade = Math.max(0, 1 - Math.max(0, t - 0.76) / 0.24);
      const activeAlpha = Math.max(0, alpha * fade);
      const ringRadius = tauntRadius * (0.08 + ease * 0.92);
      const z = y + 118;
      const red = color || "#ef4444";
      const hot = "#ff2d55";
      const dark = "#450a0a";

      this.drawGfxCircle(x, y, ringRadius * 0.92, dark, activeAlpha * 0.04, red, activeAlpha * 0.5, 7, z + 4, "add", 72);
      this.drawGfxCircle(x, y, Math.max(18, ringRadius * 0.58), dark, activeAlpha * 0.025, hot, activeAlpha * 0.24, 3, z, "add", 54);
      this.drawGfxArc(x, y, ringRadius * 1.02, -Math.PI * 0.08 + t * 0.5, Math.PI * 1.2 + t * 0.5, 5, "#fca5a5", activeAlpha * 0.34, z + 9, "add", 24);
      this.drawGfxArc(x, y, ringRadius * 0.98, Math.PI * 0.92 - t * 0.7, Math.PI * 2.08 - t * 0.7, 4, hot, activeAlpha * 0.28, z + 10, "add", 24);

      const tickCount = 18;
      for (let i = 0; i < tickCount; i += 1) {
        const a = (Math.PI * 2 * i) / tickCount + t * 0.32;
        const len = 11 + (i % 3) * 5;
        const inner = Math.max(18, ringRadius - len * 1.55);
        const outer = ringRadius + len * 0.45;
        this.drawGfxLine(
          x + Math.cos(a) * inner,
          y + Math.sin(a) * inner,
          x + Math.cos(a) * outer,
          y + Math.sin(a) * outer,
          i % 3 === 0 ? 5 : 3,
          i % 2 ? hot : "#fecaca",
          activeAlpha * (0.3 + (i % 3) * 0.05),
          z + 18 + i,
          "add"
        );
      }
      if (t < 0.42) {
        const burst = 1 - t / 0.42;
        this.drawGfxCircle(x, y, tauntRadius * (0.14 + t * 0.34), red, burst * alpha * 0.08, hot, burst * alpha * 0.44, 4, z + 44, "add", 36);
        this.drawGfxSparkSpray(x, y, tauntRadius * 0.42, hot, burst * alpha * 0.22, z + 48, 10, t * 3.2);
      }
      return true;
    }

    renderCrispStyledSkillEffect(effect, progress, alpha, radius, color, s, kind, angle, peak, pulse, effectRadius, end, z) {
      if (s.includes("warrior") || s.includes("shield_charge") || s.includes("shield_slam") || s.includes("taunt")) return false;
      const context = {
        effect,
        progress,
        alpha,
        radius,
        color,
        s,
        kind,
        angle,
        peak,
        pulse,
        effectRadius,
        end,
        z,
      };

      if (pixiSkillEffects.renderCrispPrimaryClassStyledEffect && pixiSkillEffects.renderCrispPrimaryClassStyledEffect(this, context)) return true;
      if (pixiSkillEffects.renderCrispClassStyledEffect && pixiSkillEffects.renderCrispClassStyledEffect(this, context)) return true;
      if (pixiSkillEffects.renderCrispCommonStyledEffect && pixiSkillEffects.renderCrispCommonStyledEffect(this, context)) return true;

      return false;
    }

    renderWarriorConeEffect(effect, progress, alpha, color, heavy = false) {
      const angle = Number(effect.angle || 0);
      const swingSide = Number(effect.swingSide || 1) >= 0 ? 1 : -1;
      const reachFromRadius = Math.max(72, Number(effect.radius || 100) / (heavy ? 1.16 : 1.24));
      const reach = Math.max(72, Number(effect.reach || reachFromRadius));
      const originX = Number.isFinite(effect.originX) ? effect.originX : effect.x - Math.cos(angle) * reach * 0.56;
      const originY = Number.isFinite(effect.originY) ? effect.originY : effect.y - Math.sin(angle) * reach * 0.56;
      if (heavy) {
        this.renderWarriorWideCleaveEffect(effect, progress, alpha, color, originX, originY, angle, swingSide, reach);
        return;
      }
      const peak = Math.sin(progress * Math.PI);
      const halfAngle = Math.max(0.76, Math.min(1.36, Math.acos(Math.max(-0.42, Math.min(0.52, Number(effect.arcDot ?? -0.05))))));
      const z = originY + Math.sin(angle) * reach * 0.62 + 112;
      const tint = color || "#f97316";
      const activeAngle = angle - halfAngle * 0.78 * swingSide + halfAngle * 1.56 * swingSide * Math.min(1, progress * 1.18);
      const trailAngle = activeAngle - halfAngle * 0.32 * swingSide;
      const sideOffset = Math.sin((progress - 0.18) * Math.PI) * reach * 0.09 * swingSide;

      this.drawGfxCleaveRibbon(originX, originY, reach * 0.48, reach * 0.9, trailAngle, activeAngle, tint, alpha * 0.045, "#fde68a", alpha * 0.13, 2, z - 3, "add", 10);
      this.drawGfxArc(originX, originY, reach * 0.82, trailAngle + 0.06 * swingSide, activeAngle - 0.04 * swingSide, 5, "#fde68a", alpha * 0.2, z + 1, "add", 9);
      this.drawGfxSword(originX, originY, activeAngle - 0.04 * swingSide, reach * 0.8, sideOffset * 0.72, tint, alpha * 0.22, z + 6, false);
      this.drawGfxSword(originX, originY, activeAngle, reach * 0.9, sideOffset, tint, alpha * (0.82 + peak * 0.16), z + 10, true);
      const sparkX = originX + Math.cos(activeAngle) * reach * 0.82;
      const sparkY = originY + Math.sin(activeAngle) * reach * 0.82;
      this.renderParticlePreset("slashTrail", {
        x: sparkX,
        y: sparkY,
        radius: reach * 0.22,
        color: tint,
        alpha: alpha * 0.36,
        zIndex: z + 14,
        phase: progress * 3.7,
        count: 7,
        direction: activeAngle,
        spread: Math.PI * 0.66
      }) || this.drawGfxSparkSpray(sparkX, sparkY, reach * 0.22, tint, alpha * 0.28, z + 14, 7, progress * 3.7, activeAngle, Math.PI * 0.66);
    }

    renderWarriorWideCleaveEffect(effect, progress, alpha, color, originX, originY, angle, swingSide, reach) {
      const tint = color || "#f97316";
      const active = Math.min(1, progress / 0.74);
      const ease = 1 - Math.pow(1 - active, 3);
      const fade = Math.max(0, 1 - Math.max(0, progress - 0.78) / 0.22);
      const peak = Math.sin(Math.min(1, progress) * Math.PI);
      const sweep = 2.5;
      const startAngle = angle - sweep * 0.58 * swingSide;
      const bladeAngle = startAngle + sweep * ease * swingSide;
      const trailSpan = sweep * (0.5 + peak * 0.06);
      const trailStart = bladeAngle - trailSpan * swingSide;
      const z = originY + Math.sin(angle) * reach * 0.68 + 122;
      const bladeReach = reach * (1.06 + peak * 0.04);
      const outerRadius = reach * (1.13 + peak * 0.04);
      const midRadius = reach * 0.9;
      const innerRadius = reach * 0.54;

      this.drawGfxCleaveRibbon(originX, originY, innerRadius, outerRadius, trailStart, bladeAngle, "#f97316", alpha * fade * 0.09, "#fde68a", alpha * fade * 0.2, 3, z + 1, "add", 20);
      this.drawGfxArc(originX, originY, outerRadius * 0.98, trailStart + 0.04 * swingSide, bladeAngle - 0.03 * swingSide, 6, "#fff7ed", alpha * fade * 0.22, z + 8, "add", 18);
      for (let i = 3; i >= 1; i -= 1) {
        const ghost = bladeAngle - (0.12 + i * 0.1) * swingSide;
        this.drawGfxGreatsword(originX, originY, ghost, bladeReach * (0.9 - i * 0.04), i === 1 ? "#fde68a" : tint, alpha * fade * (0.08 + (3 - i) * 0.045), z + 7 - i, false);
      }
      this.drawGfxGreatsword(originX, originY, bladeAngle, bladeReach, tint, alpha * fade * (0.92 + peak * 0.08), z + 16, true);

      const tipX = originX + Math.cos(bladeAngle) * bladeReach * 1.03;
      const tipY = originY + Math.sin(bladeAngle) * bladeReach * 1.03;
      const cutX = originX + Math.cos(angle) * reach * 0.86;
      const cutY = originY + Math.sin(angle) * reach * 0.86;
      this.renderParticlePreset("slashTrail", {
        x: tipX,
        y: tipY,
        radius: reach * 0.34,
        color: "#fde68a",
        alpha: alpha * fade * 0.44,
        zIndex: z + 20,
        phase: progress * 4.4,
        count: 10,
        direction: bladeAngle,
        spread: Math.PI * 0.62
      }) || this.drawGfxSparkSpray(tipX, tipY, reach * 0.34, "#fde68a", alpha * fade * 0.34, z + 20, 10, progress * 4.4, bladeAngle, Math.PI * 0.62);
      if (progress > 0.46) {
        this.drawGfxImpactBurst(cutX, cutY, reach * 0.32, tint, alpha * fade * 0.22, z + 28, progress * 3.1, 8);
      }
    }

    renderWarriorVerticalCleaveEffect(effect, progress, alpha, color, radius) {
      const angle = Number(effect.angle || 0);
      const lineRadius = Math.max(180, Number(effect.radius || radius || 220));
      const end = this.effectEndpoints(effect, lineRadius, angle);
      if (!end) return;
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const length = Math.max(80, Math.hypot(end.toX - end.fromX, end.toY - end.fromY));
      const width = Math.max(58, Number(effect.lineWidth || 82));
      const t = Math.max(0, Math.min(1, progress));
      const windup = Math.min(1, t / 0.3);
      const active = Math.max(0, Math.min(1, (t - 0.3) / 0.25));
      const after = Math.max(0, Math.min(1, (t - 0.55) / 0.45));
      const impact = Math.sin(active * Math.PI);
      const cut = active > 0 ? 1 - Math.pow(1 - active, 3) : windup * 0.94;
      const fade = Math.max(0, 1 - after * 0.82);
      const palette = this.warriorSkillPalette(color);
      const z = Math.max(end.fromY, end.toY) + 134;
      const activeAlpha = alpha * fade;
      const headX = end.fromX + (end.toX - end.fromX) * cut;
      const headY = end.fromY + (end.toY - end.fromY) * cut;
      const guideAlpha = activeAlpha * (0.1 + windup * 0.24);

      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, width * 0.32, palette.shadow, alpha * 0.09 * windup * fade, z - 22, "add");
      this.drawGfxLine(end.fromX + px * width * 0.62, end.fromY + py * width * 0.62, end.toX + px * width * 0.62, end.toY + py * width * 0.62, 3.5, palette.edge, guideAlpha, z - 10, "add");
      this.drawGfxLine(end.fromX - px * width * 0.62, end.fromY - py * width * 0.62, end.toX - px * width * 0.62, end.toY - py * width * 0.62, 3.5, palette.edge, guideAlpha, z - 9, "add");
      this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, 2.5, "#fff7ed", activeAlpha * 0.12 * windup, z - 4, "add");

      if (active > 0) {
        const coreWidth = width * (0.58 + impact * 0.72);
        this.drawGfxLine(end.fromX, end.fromY, headX, headY, coreWidth, "#7c2d12", activeAlpha * (0.16 + impact * 0.2), z + 1, "add");
        this.drawGfxLine(end.fromX, end.fromY, headX, headY, Math.max(14, width * (0.2 + impact * 0.18)), "#fff7ed", activeAlpha * (0.72 + impact * 0.22), z + 10, "add");
        this.drawGfxLine(end.fromX, end.fromY, headX, headY, Math.max(5, width * 0.075), "#ffffff", activeAlpha * 0.78, z + 18, "add");
        this.drawGfxLine(end.fromX + px * width * 0.28, end.fromY + py * width * 0.28, headX + px * width * 0.12, headY + py * width * 0.12, 5, "#fde68a", activeAlpha * 0.42, z + 14, "add");
        this.drawGfxLine(end.fromX - px * width * 0.28, end.fromY - py * width * 0.28, headX - px * width * 0.12, headY - py * width * 0.12, 5, "#f97316", activeAlpha * 0.36, z + 15, "add");
        for (let i = 0; i < 7; i += 1) {
          const along = length * (0.1 + i * 0.14);
          if (along > length * cut) continue;
          const cx = end.fromX + ux * along;
          const cy = end.fromY + uy * along;
          const nick = width * (0.2 + (i % 3) * 0.05);
          this.drawGfxLine(cx - px * nick, cy - py * nick, cx + px * nick, cy + py * nick, i % 2 ? 4 : 5, i % 2 ? palette.edge : "#fff7ed", activeAlpha * (0.28 + impact * 0.2), z + 22 + i, "add");
        }
        this.drawGfxSparkSpray(headX, headY, width * 1.18, palette.edge, activeAlpha * 0.44, z + 32, 14, progress * 5.4, angle, Math.PI * 0.56);
        this.drawGfxImpactBurst(headX, headY, width * (0.7 + impact * 0.46), palette.tint, activeAlpha * 0.22, z + 38, progress * 4.1, 10);
      }

      if (after > 0) {
        this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(8, width * 0.16), "#fde68a", activeAlpha * (0.24 * (1 - after)), z + 4, "add");
        this.drawGfxLine(end.fromX, end.fromY, end.toX, end.toY, Math.max(3, width * 0.05), "#fff7ed", activeAlpha * (0.26 * (1 - after)), z + 12, "add");
      }
    }

    renderFastMeleeConeEffect(effect, progress, alpha, color, mode = "melee") {
      const angle = Number(effect.angle || 0);
      const swingSide = Number(effect.swingSide || 1) >= 0 ? 1 : -1;
      const reach = Math.max(54, Number(effect.reach || effect.radius || 86));
      const originX = Number.isFinite(effect.originX) ? effect.originX : effect.x - Math.cos(angle) * reach * 0.52;
      const originY = Number.isFinite(effect.originY) ? effect.originY : effect.y - Math.sin(angle) * reach * 0.52;
      const peak = Math.sin(progress * Math.PI);
      const tint = mode === "assassin" ? "#c4b5fd" : mode === "martial" ? "#fde68a" : color || "#ffffff";
      const z = originY + Math.sin(angle) * reach * 0.58 + 106;
      const halfAngle = mode === "assassin" ? 0.82 : 0.92;
      const activeAngle = angle - halfAngle * 0.58 * swingSide + halfAngle * 1.16 * swingSide * Math.min(1, progress * 1.24);
      this.drawGfxCone(originX, originY, angle, reach, halfAngle, tint, alpha * 0.06, alpha * 0.18, z - 16, false);
      if (mode === "assassin") {
        for (let i = 0; i < 2; i += 1) {
          const offset = (i ? 0.18 : -0.18) * swingSide;
          const start = activeAngle + offset - 0.28 * swingSide;
          const end = activeAngle + offset + 0.16 * swingSide;
          this.drawGfxArc(originX, originY, reach * (0.74 + i * 0.1), start, end, i ? 5 : 8, tint, alpha * (i ? 0.46 : 0.7), z + i, "add", 8);
          const tipX = originX + Math.cos(end) * reach * (0.78 + i * 0.08);
          const tipY = originY + Math.sin(end) * reach * (0.78 + i * 0.08);
          this.drawGfxLine(tipX - Math.cos(end) * 18, tipY - Math.sin(end) * 18, tipX, tipY, i ? 4 : 6, "#f5d0fe", alpha * (i ? 0.4 : 0.62), z + i + 2, "add");
        }
        return;
      }
      if (mode === "martial") {
        for (let i = 0; i < 3; i += 1) {
          const offset = (i - 1) * 0.26 * swingSide;
          const x = originX + Math.cos(angle + offset) * reach * (0.42 + i * 0.14);
          const y = originY + Math.sin(angle + offset) * reach * (0.42 + i * 0.14);
          this.drawGfxCircle(x, y, 9 + peak * 5, i === 1 ? tint : "#f8f3e9", alpha * 0.22, tint, alpha * 0.48, 3, z + i, "add", 12);
          this.drawGfxLine(originX + Math.cos(angle + offset) * 18, originY + Math.sin(angle + offset) * 18, x, y, i === 1 ? 7 : 4, tint, alpha * 0.4, z + i + 2, "add");
        }
      }
    }

    lineFx(key, fromX, fromY, toX, toY, width = 8, tint = "#ffffff", alpha = 1, zIndex = 0, blendMode = "add") {
      if (!Number.isFinite(fromX) || !Number.isFinite(fromY) || !Number.isFinite(toX) || !Number.isFinite(toY)) return null;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const length = Math.hypot(dx, dy);
      if (length < 2) return null;
      const x = (fromX + toX) / 2;
      const y = (fromY + toY) / 2;
      const angle = Math.atan2(dy, dx);
      if (key === "fx-lightning" && this.drawGfxLightning) {
        const phase = Date.now() / 130 + (fromX + fromY + toX + toY) * 0.007;
        this.drawGfxLightning(fromX, fromY, toX, toY, tint, alpha, zIndex || y + 80, Math.max(2.5, width * 0.58), Math.max(4, Math.min(9, Math.ceil(length / 32))), Math.max(7, width * 1.45), phase);
        return { alpha };
      }
      const textureWidth = key === "fx-lightning" ? 112 : key === "fx-pierce-lance" ? 144 : key === "fx-charge-lane" ? 128 : 32;
      const textureHeight = key === "fx-lightning" ? 32 : key === "fx-pierce-lance" ? 34 : key === "fx-charge-lane" ? 64 : 8;
      return this.fx(key, x, y, length / textureWidth, Math.max(0.12, width / textureHeight), tint, alpha, zIndex || y + 80, angle, blendMode);
    }

    effectEndpoints(effect, radius, angle) {
      const hasFrom = Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY);
      const hasTo = Number.isFinite(effect.toX) && Number.isFinite(effect.toY);
      if (hasFrom && hasTo) {
        return { fromX: effect.fromX, fromY: effect.fromY, toX: effect.toX, toY: effect.toY };
      }
      const half = Math.max(24, radius * 0.64);
      return {
        fromX: effect.x - Math.cos(angle) * half,
        fromY: effect.y - Math.sin(angle) * half,
        toX: effect.x + Math.cos(angle) * half,
        toY: effect.y + Math.sin(angle) * half
      };
    }

    rect(parent, x, y, width, height, color, alpha = 1) {
      const sprite = this.sprite(WHITE_KEY, parent, x, y, width / 2, height / 2, color, alpha);
      return sprite;
    }

    ring(x, y, radius, color, alpha = 0.5, thickness = 3) {
      const key = `ring:${Math.round(radius)}:${thickness}`;
      const tex = this.texture(key, 64, 64, (ctx) => {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.arc(32, 32, 29 - thickness, 0, Math.PI * 2);
        ctx.stroke();
      });
      const sprite = this.sprite(tex, this.layers.effect, x, y, radius / 28, radius / 28, color, alpha);
      sprite.zIndex = y + 70;
      return sprite;
    }

    bar(x, y, width, height, ratio, fill) {
      const safeRatio = Math.max(0, Math.min(1, Number(ratio) || 0));
      this.rect(this.layers.ui, x, y, width + 4, height + 4, "#050505", 0.72).zIndex = y + 999;
      this.rect(this.layers.ui, x - width / 2 + (width * safeRatio) / 2, y, width * safeRatio, height, fill, 0.96).zIndex = y + 1000;
    }

    healthShieldBar(x, y, width, height, hp, maxHp, shield = 0, hpFill = "#ff4d6d") {
      const safeMaxHp = Math.max(1, Number(maxHp) || 1);
      const hpRatio = Math.max(0, Math.min(1, Number(hp) / safeMaxHp || 0));
      const shieldRatio = Math.max(0, Math.min(1, Number(shield) / safeMaxHp || 0));
      const hpWidth = width * hpRatio;
      const shieldWidth = width * shieldRatio;
      this.rect(this.layers.ui, x, y, width + 4, height + 4, "#050505", 0.72).zIndex = y + 999;
      if (hpWidth > 0) this.rect(this.layers.ui, x - width / 2 + hpWidth / 2, y, hpWidth, height, hpFill, 0.96).zIndex = y + 1000;
      if (shieldWidth > 0) {
        const shieldHeight = Math.max(2, Math.round(height * 0.38));
        const shieldY = y - (height - shieldHeight) / 2;
        this.rect(this.layers.ui, x, shieldY, width, shieldHeight + 1, "#07151d", 0.8).zIndex = y + 1001;
        this.rect(this.layers.ui, x - width / 2 + shieldWidth / 2, shieldY, shieldWidth, shieldHeight, "#67e8f9", 0.98).zIndex = y + 1002;
      }
    }

    drawEliteBodyMutation(x, y, radius, affix, zIndex) {
      const color = this.eliteAffixColor(affix, "#facc15");
      const dark = "#111827";
      if (affix === "bulwark") {
        for (const side of [-1, 1]) {
          this.drawGfxPath([
            { x: x + side * radius * 0.18, y: y - radius * 0.52 },
            { x: x + side * radius * 0.72, y: y - radius * 0.46 },
            { x: x + side * radius * 0.94, y: y - radius * 0.08 },
            { x: x + side * radius * 0.58, y: y + radius * 0.2 },
            { x: x + side * radius * 0.24, y: y + radius * 0.04 }
          ], dark, 0.84, color, 0.72, 2.4, zIndex + side, "normal");
        }
        return;
      }
      if (affix === "venom") {
        for (const [ox, oy, size] of [[-0.4, 0.22, 0.26], [0.04, 0.34, 0.32], [0.46, 0.18, 0.22]]) {
          this.drawGfxCircle(x + ox * radius, y + oy * radius, size * radius, "#365314", 0.82, color, 0.62, 1.8, zIndex + 2, "normal", 12);
        }
        return;
      }
      if (affix === "volatile") {
        this.drawGfxCircle(x, y, radius * 0.34, "#7f1d1d", 0.92, color, 0.78, 2.2, zIndex, "normal", 6);
        this.drawGfxCircle(x, y, radius * 0.13, "#f8fafc", 0.72, color, 0.46, 1.2, zIndex + 1, "normal", 10);
        for (const [x1, y1, x2, y2] of [[-0.16, -0.18, -0.54, -0.54], [0.16, -0.14, 0.58, -0.42], [-0.14, 0.18, -0.48, 0.56], [0.14, 0.2, 0.52, 0.52]]) {
          this.drawGfxLine(x + x1 * radius, y + y1 * radius, x + x2 * radius, y + y2 * radius, 2.2, color, 0.62, zIndex + 2, "normal");
        }
        return;
      }
      for (const side of [-1, 1]) {
        this.drawGfxPath([
          { x: x + side * radius * 0.12, y: y - radius * 0.58 },
          { x: x + side * radius * 0.8, y: y - radius * 1.05 },
          { x: x + side * radius * 0.52, y: y - radius * 0.34 }
        ], dark, 0.9, color, 0.74, 2, zIndex + side, "normal");
      }
      this.drawGfxLine(x - radius * 0.46, y - radius * 0.06, x + radius * 0.18, y + radius * 0.28, 2.6, color, 0.68, zIndex + 3, "normal");
      this.drawGfxLine(x - radius * 0.24, y - radius * 0.3, x + radius * 0.42, y + radius * 0.04, 2.6, color, 0.68, zIndex + 4, "normal");
    }

    eliteAffixColor(affix, fallback = "#facc15") {
      if (affix === "venom") return "#bef264";
      if (affix === "volatile") return "#fb7185";
      if (affix === "frenzy") return "#fb923c";
      if (affix === "bulwark") return "#93c5fd";
      return fallback;
    }

    visualPosition(map, entity) {
      return map?.get(String(entity.id)) || entity;
    }

    isWorldVisible(entity, padding = 120) {
      if (!entity || !Number.isFinite(entity.x) || !Number.isFinite(entity.y)) return false;
      const camera = this.getCamera?.();
      if (!camera) return true;
      const screen = this.app?.renderer?.screen;
      const width = Number(screen?.width || this.app?.renderer?.width || this.canvas?.clientWidth || 1280);
      const height = Number(screen?.height || this.app?.renderer?.height || this.canvas?.clientHeight || 720);
      return (
        entity.x >= camera.x - width / 2 - padding &&
        entity.x <= camera.x + width / 2 + padding &&
        entity.y >= camera.y - height / 2 - padding &&
        entity.y <= camera.y + height / 2 + padding
      );
    }

    px(ctx, x, y, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    linePx(ctx, x1, y1, x2, y2, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(x1), Math.round(y1));
      ctx.lineTo(Math.round(x2), Math.round(y2));
      ctx.stroke();
    }

    outline(ctx, x, y, w, h) {
      ctx.fillStyle = "rgba(10,10,9,0.42)";
      ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
    }

    pixelDiamond(ctx, x, y, r, fill, light) {
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      ctx.fill();
      this.px(ctx, x - 2, y - r + 3, 4, r, light);
    }

    tint(color) {
      if (typeof color === "number") return color;
      const value = String(color || "#ffffff").replace("#", "").slice(0, 6);
      const parsed = Number.parseInt(value.length === 3 ? value.split("").map((c) => c + c).join("") : value, 16);
      return Number.isFinite(parsed) ? parsed : 0xffffff;
    }

    hash(value) {
      const text = String(value || "0");
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 9973;
      return hash / 9973;
    }

    noise(x, y) {
      const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return value - Math.floor(value);
    }
  }

  window.RoguePixiRenderer = {
    create(options) {
      return new RoguePixiRenderer(options);
    }
  };
})();
