(() => {
  const pixiRuntime = window.RoguePixiRuntime || {};
  const pixiTextureFactory = window.RoguePixiTextureFactory || {};
  const pixiVisualAssets = window.RogueVisualAssets || {};
  const pixiPools = window.RoguePixiPools || {};
  const pixiScene = window.RoguePixiScene || {};
  const pixiWorld = window.RoguePixiWorld || {};
  const pixiPickups = window.RoguePixiPickups || {};
  const pixiProjectiles = window.RoguePixiProjectiles || {};
  const pixiHazards = window.RoguePixiHazards || {};
  const pixiEnemies = window.RoguePixiEnemies || {};
  const pixiPlayers = window.RoguePixiPlayers || {};
  const pixiEffects = window.RoguePixiEffects || {};
  const pixiSkillEffects = window.RoguePixiSkillEffects || {};
  const pixiParticles = window.RoguePixiParticles || {};
  const pixiActorTextures = window.RoguePixiActorTextures || {};
  const pixiEnemyTextures = window.RoguePixiEnemyTextures || {};
  const pixiBossTextures = window.RoguePixiBossTextures || {};
  const pixiPrimitives = window.RoguePixiPrimitives || {};
  const pixiPixelDrawing = window.RoguePixiPixelDrawing || {};
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
      this.ready = false;
      this.failed = false;
      this.textures = pixiTextureFactory.createTextureRegistry
        ? pixiTextureFactory.createTextureRegistry()
        : pixiRuntime.createTextureRegistry
          ? pixiRuntime.createTextureRegistry()
          : new Map();
      this.visualAssets = pixiVisualAssets;
      this.assetManifest = pixiVisualAssets.getAssetManifest ? pixiVisualAssets.getAssetManifest() : null;
      this.assetTextureStats = { external: 0, fallback: 0 };
      this.assetEffectFrameCache = new Map();
      this.lastEnemyPositions = new Map();
      this.lastPlayerPositions = new Map();
      this.rendererPreference = chooseRendererPreference();
      this.quality = QUALITY_PRESETS[options.quality] ? options.quality : "high";
      this.qualityPreset = QUALITY_PRESETS[this.quality];
      this.webgpuFallbackTried = false;
      this.lastPerfSampleAt = performance.now();
      this.lastPoolTrimAt = performance.now();
      this.perfFrameCount = 0;
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
            assetTextures: { external: 0, fallback: 0 },
            effects: 0,
            particles: { used: 0, retained: 0, skipped: 0, budget: this.qualityPreset.particleBudget || 0, pressure: 0 },
            effectBudget: this.qualityPreset.effectBudget,
            particleBudget: this.qualityPreset.particleBudget || 0
          };
      this.diagnostics.assetTextures = this.assetTextureStats;
      window.__rogueRendererStats = this.diagnostics;
      this.particleEngine = pixiParticles.createParticleEngine
        ? pixiParticles.createParticleEngine({
            quality: this.quality,
            budget: this.getParticleBudget()
          })
        : null;
      this.init();
    }

    async init() {
      const PIXI = window.PIXI;
      if (!PIXI) {
        this.failed = true;
        return;
      }
      this.PIXI = PIXI;
      try {
        try {
          this.assetManifest = pixiVisualAssets.loadAssetManifest
            ? await pixiVisualAssets.loadAssetManifest()
            : pixiVisualAssets.getAssetManifest
              ? pixiVisualAssets.getAssetManifest()
              : null;
        } catch (error) {
          this.assetManifest = pixiVisualAssets.getAssetManifest ? pixiVisualAssets.getAssetManifest() : null;
        }
        this.app = new PIXI.Application();
        await this.app.init({
          width: Math.max(320, this.canvas.clientWidth || 1280),
          height: Math.max(320, this.canvas.clientHeight || 720),
          backgroundAlpha: 0,
          antialias: false,
          autoDensity: true,
          resolution: Math.min(this.qualityPreset.resolutionCap, Math.max(1, window.devicePixelRatio || 1)),
          preference: this.rendererPreference,
          powerPreference: "high-performance"
        });

        this.app.stage.sortableChildren = true;
        this.view = this.app.canvas;
        this.view.className = "pixi-game-canvas";
        this.view.dataset.rendererPreference = this.rendererPreference;
        this.canvas.insertAdjacentElement("afterend", this.view);
        this.canvas.closest(".stage")?.classList.add("pixi-enabled");
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
          ["flash", 10]
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
      const nextW = Math.max(320, Math.round(width));
      const nextH = Math.max(320, Math.round(height));
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
      this.view?.remove();
      this.canvas.closest(".stage")?.classList.remove("pixi-enabled");
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
      this.texture("fx-warrior-blade", 176, 58, (ctx) => {
        if (pixiMeleeTextures.drawWarriorBlade) {
          pixiMeleeTextures.drawWarriorBlade(ctx);
          return;
        }
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
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 7;
        ctx.lineJoin = "miter";
        ctx.beginPath();
        ctx.moveTo(4, 17);
        ctx.lineTo(27, 9);
        ctx.lineTo(45, 22);
        ctx.lineTo(66, 7);
        ctx.lineTo(83, 19);
        ctx.lineTo(108, 12);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,0.42)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 24);
        ctx.lineTo(33, 18);
        ctx.lineTo(53, 27);
        ctx.lineTo(73, 15);
        ctx.lineTo(101, 22);
        ctx.stroke();
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
      const assetDescriptor = this.assetDescriptorForTexture(key);
      if (pixiTextureFactory.getOrCreateTextureWithAsset) {
        const texture = pixiTextureFactory.getOrCreateTextureWithAsset(
          this.textures,
          this.PIXI,
          key,
          width,
          height,
          draw,
          assetDescriptor,
          this.visualAssets
        );
        const meta = this.textures.getMeta ? this.textures.getMeta(key) : null;
        if (meta?.source === "asset") {
          this.assetTextureStats.external += 1;
        } else {
          this.assetTextureStats.fallback += 1;
        }
        return texture;
      }
      if (pixiTextureFactory.getOrCreateCanvasTexture) {
        return pixiTextureFactory.getOrCreateCanvasTexture(this.textures, this.PIXI, key, width, height, draw);
      }
      const create = () =>
        pixiTextureFactory.createCanvasTexture
          ? pixiTextureFactory.createCanvasTexture(this.PIXI, width, height, draw)
          : pixiRuntime.createCanvasTexture
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

    assetDescriptorForTexture(key) {
      if (!key || !this.visualAssets) return null;
      if (this.visualAssets.assetDescriptorForTexture) {
        return this.visualAssets.assetDescriptorForTexture(key);
      }
      const asset = this.visualAssets.findTextureAsset ? this.visualAssets.findTextureAsset(key) : null;
      if (!asset) return null;
      const source = asset.path || (this.visualAssets.assetPath ? this.visualAssets.assetPath(asset.kind, asset.file) : "");
      return source ? { ...asset, key, source } : null;
    }

    assetEffectDescriptor(key) {
      const descriptor = this.assetDescriptorForTexture(key);
      if (!descriptor) return null;
      return {
        ...descriptor,
        frameWidth: Math.max(1, Math.round(Number(descriptor.frameWidth || 64))),
        frameHeight: Math.max(1, Math.round(Number(descriptor.frameHeight || 64))),
        frames: Math.max(1, Math.round(Number(descriptor.frames || 1)))
      };
    }

    assetEffectFrameTexture(key, frameIndex = 0) {
      const descriptor = this.assetEffectDescriptor(key);
      if (!descriptor) return null;
      const frame = Math.max(0, Math.min(descriptor.frames - 1, Math.round(Number(frameIndex) || 0)));
      const cacheKey = `${descriptor.key || key}:frame:${frame}`;
      if (this.assetEffectFrameCache.has(cacheKey)) return this.assetEffectFrameCache.get(cacheKey);
      if (!this.PIXI?.Texture || !this.PIXI?.Rectangle) return null;

      const sheetTexture = pixiTextureFactory.getOrCreateExternalTexture
        ? pixiTextureFactory.getOrCreateExternalTexture(this.textures, this.PIXI, descriptor.key || key, descriptor, this.visualAssets)
        : this.PIXI.Texture.from(descriptor.source);
      if (!sheetTexture) return null;

      const frameRect = new this.PIXI.Rectangle(frame * descriptor.frameWidth, 0, descriptor.frameWidth, descriptor.frameHeight);
      let texture = null;
      try {
        if (sheetTexture.source) {
          texture = new this.PIXI.Texture({
            source: sheetTexture.source,
            frame: frameRect
          });
        }
      } catch (error) {
        texture = null;
      }
      if (!texture) {
        try {
          texture = new this.PIXI.Texture(sheetTexture.baseTexture, frameRect);
        } catch (error) {
          texture = sheetTexture;
        }
      }
      this.assetEffectFrameCache.set(cacheKey, texture);
      return texture;
    }

    assetEffectFx(key, x, y, options = {}) {
      const descriptor = this.assetEffectDescriptor(key);
      if (!descriptor) return null;
      const progress = Math.max(0, Math.min(1, Number(options.progress) || 0));
      const frame = Number.isFinite(options.frame)
        ? Math.round(Number(options.frame))
        : Math.min(descriptor.frames - 1, Math.floor(progress * descriptor.frames));
      const texture = this.assetEffectFrameTexture(descriptor.key || key, frame);
      if (!texture) return null;
      const sprite = this.sprite(
        texture,
        options.parent || this.layers.effect,
        x,
        y,
        Number.isFinite(options.scaleX) ? Number(options.scaleX) : Number(options.scale || 1),
        Number.isFinite(options.scaleY) ? Number(options.scaleY) : Number(options.scale || 1),
        options.tint || "#ffffff",
        Number.isFinite(options.alpha) ? Number(options.alpha) : 1
      );
      sprite.rotation = Number(options.rotation || 0);
      sprite.zIndex = Number.isFinite(options.zIndex) ? Number(options.zIndex) : y + 100;
      sprite.blendMode = options.blendMode || "add";
      return sprite;
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

    updateDiagnostics(now, dt) {
      this.perfFrameCount += 1;
      this.diagnostics.frameMs = Math.round(dt * 10000) / 10;
      this.diagnostics.sprites = this.spritePool.stats();
      this.diagnostics.texts = this.textPool.stats();
      this.diagnostics.graphics = this.graphicsPool.stats();
      this.diagnostics.particles = this.particleEngine?.stats?.() || { used: 0, retained: 0, skipped: 0, budget: this.getParticleBudget(), pressure: 0 };
      this.diagnostics.textures = this.textures.size;
      this.diagnostics.assetTextures = this.assetTextureStats;
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
      this.renderEnemies(state.enemies || [], now);
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
          this.sprite("fx-lightning", this.layers.hazard, hazard.x + 18, hazard.y - 10, 0.35, 0.24, "#9ee6ff", armed ? 0.38 + Math.sin(now / 90) * 0.1 : 0.16).zIndex = hazard.y + 9;
          if (!armed) this.ring(hazard.x, hazard.y, radius * 0.72, "#9ee6ff", 0.16 + Math.sin(now / 80) * 0.05, 2);
          continue;
        }
        if (hazard.type === "engineer_drone") {
          const drone = this.sprite("fx-drone", this.layers.hazard, hazard.x, hazard.y - 8 + Math.sin(now / 120 + hazard.id) * 4, 0.76, 0.76, "#d6b76d", 0.96);
          drone.zIndex = hazard.y + 22;
          drone.blendMode = "normal";
          this.sprite("shadow", this.layers.hazard, hazard.x, hazard.y + 18, 0.54, 0.38, "#000000", 0.38).zIndex = hazard.y - 2;
          this.sprite("fx-lightning", this.layers.hazard, hazard.x, hazard.y - 4, 0.48, 0.2, "#9ee6ff", 0.28 + Math.sin(now / 110) * 0.08).zIndex = hazard.y + 23;
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
          const warning = this.sprite("fx-warning-target", this.layers.hazard, hazard.x, hazard.y, radius / 49, radius / 49, "#f1d08b", armed ? 0.18 : 0.34);
          warning.rotation = now / 900;
          warning.blendMode = "add";
          warning.zIndex = hazard.y - 12;
          const dropCount = armed ? 8 : 4;
          for (let i = 0; i < dropCount; i += 1) {
            const t = (now / 240 + i * 0.37 + hazard.id * 0.11) % 1;
            const a = this.noise(hazard.id + i * 17, 4) * Math.PI * 2;
            const r = Math.sqrt(this.noise(hazard.id + i * 31, 9)) * radius * 0.78;
            const x = hazard.x + Math.cos(a) * r;
            const y = hazard.y + Math.sin(a) * r - 80 + t * 112;
            const arrow = this.sprite("fx-arrow-rain", this.layers.hazard, x, y, 0.38, 0.48, "#f1d08b", armed ? 0.76 : 0.44);
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
        if (hazard.type === "alchemy_pool" || hazard.type === "acid_pool") {
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
          this.sprite("fx-meteor-fall", this.layers.hazard, hazard.x - 48, hazard.y - 112, 0.72, 0.72, "#f97316", Math.max(0.16, 0.42 - (hazard.armTime || 0) * 0.1)).zIndex = hazard.y + 26;
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
    }

    renderProjectiles(projectiles, now) {
      if (pixiProjectiles.renderProjectiles) {
        pixiProjectiles.renderProjectiles(this, projectiles, now);
        return;
      }
      for (const projectile of projectiles) {
        const style = projectile.style || projectile.classId || "";
        const poison = projectile.poison || style.includes("poison") || style.includes("venom") || style.includes("acid");
        const fire = style.includes("fire") || style.includes("meteor") || style.includes("mortar") || style.includes("bomb");
        const lightning = style.includes("electric") || style.includes("chain") || style.includes("rail") || style.includes("shock");
        const arrow = style.includes("arrow") || style.includes("ranger") || style.includes("sniper") || style.includes("shuriken");
        const thread = style.includes("thread");
        const flask = style.includes("alchemy") || style.includes("bottle");
        const shadow = style.includes("shuriken") || style.includes("shadow") || style.includes("assassin");
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
          lightning ? "#9ee6ff" :
          projectile.hostile ? "#f87171" :
          projectile.color || "#f8f3e9";
        const sprite = this.sprite(key, this.layers.projectile, projectile.x, projectile.y, scaleX, scaleY, tint, 1);
        sprite.rotation = projectile.angle || 0;
        sprite.blendMode = fire || lightning || poison || thread || shadow ? "add" : "normal";
        sprite.zIndex = projectile.y + 4;
        if (thread) {
          const trail = this.sprite("fx-lightning", this.layers.projectile, projectile.x - Math.cos(projectile.angle || 0) * 18, projectile.y - Math.sin(projectile.angle || 0) * 18, 0.32, 0.18, "#b985c8", 0.36);
          trail.rotation = projectile.angle || 0;
          trail.blendMode = "add";
          trail.zIndex = projectile.y + 3;
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

    renderEnemies(enemies, now) {
      if (pixiEnemies.renderEnemies) {
        pixiEnemies.renderEnemies(this, enemies, now);
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
        if (enemy.elite) this.drawEliteCrown(pos.x, pos.y - enemy.radius * 1.1, enemy.affix || "", enemy.color || "#facc15", pos.y + 1);
        this.bar(pos.x, pos.y - enemy.radius * 1.45 - 20, enemy.radius * 2.05, 5, enemy.hp / enemy.maxHp, "#ef4444");
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
        if (moving || player.dashMove?.active) {
          const trail = this.sprite(key, this.layers.actor, pos.x - face * 18, pos.y + bob, scale * face, scale, "#ffffff", player.dashMove?.active ? 0.34 : 0.16);
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
            this.fx("fx-lightning", fxX, fxY, 0.54, 0.54, "#9ee6ff", 0.72, pos.y + 24, angle, "add");
          } else if (classId === "puppeteer") {
            this.fx("fx-thread-knot", fxX, fxY, 0.44, 0.36, "#f5d0fe", 0.72, pos.y + 24, angle, "add");
            this.fx("fx-lightning", fxX - Math.cos(angle) * 16, fxY - Math.sin(angle) * 8, 0.36, 0.18, "#b985c8", 0.38, pos.y + 23, angle, "add");
          } else if (classId === "martialist") {
            this.fx("fx-fist", fxX, fxY, 0.42, 0.42, "#fde68a", 0.76, pos.y + 24, angle, "add");
          } else if (classId === "alchemist") {
            this.fx("fx-flask", fxX, fxY, 0.4, 0.4, "#bef264", 0.68, pos.y + 24, angle, "add");
            this.fx("fx-acid-splash", fxX + Math.cos(angle) * 12, fxY + Math.sin(angle) * 7, 0.28, 0.22, "#bef264", 0.34, pos.y + 23, angle, "add");
          } else if (classId === "assassin") {
            this.fx("fx-shadow-cut", fxX, fxY, face * 0.58, 0.42, "#c4b5fd", 0.78, pos.y + 24, angle, "add");
            this.fx("fx-smoke", pos.x - face * 12, pos.y + 3, 0.42, 0.34, "#21142f", 0.28, pos.y + 18, 0, "add");
          } else if (classId === "warrior") {
            this.drawGfxSword(pos.x - Math.cos(angle) * 10, pos.y + bob + Math.sin(angle) * 4, angle + 0.08 * face, 72, 0, player.color || "#f97316", 0.7, pos.y + 30, false);
          } else {
            this.fx("fx-sword-cut", fxX, fxY, face * 0.72, 0.72, player.color || "#ffffff", 0.82, pos.y + 24, angle, "add");
          }
        }
        if (player.shield > 0) this.ring(pos.x, pos.y, 33 * scaleBase, "#bfdbfe", 0.5, 3);
        if (player.statusEffects?.includes("taunt_guard")) this.ring(pos.x, pos.y, 42 * scaleBase, "#f97316", 0.34, 4);
        if (player.id === selfId) {
          this.bar(pos.x, pos.y - 56 * scaleBase, 86, 8, player.hp / player.maxHp, "#ef4444");
          if (player.shield > 0) this.bar(pos.x, pos.y - 46 * scaleBase, 86, 4, player.shield / Math.max(1, player.maxHp * 0.45), "#93c5fd");
        }
      }
    }

    renderFloatingEffects(effects, now) {
      this.diagnostics.effects = effects.length;
      const startIndex = pixiRuntime.effectStartIndex
        ? pixiRuntime.effectStartIndex(effects.length, this.qualityPreset.effectBudget)
        : Math.max(0, effects.length - this.qualityPreset.effectBudget);
      for (let effectIndex = startIndex; effectIndex < effects.length; effectIndex += 1) {
        const effect = effects[effectIndex];
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
          continue;
        }
        if (this.renderStyledSkillEffect(effect, progress, alpha, radius, color, style)) continue;
        if (pixiEffects.renderCoreSkillEffect && pixiEffects.renderCoreSkillEffect(this, effect, progress, alpha, radius, color, style)) continue;
        if (pixiEffects.renderSecondaryEffect && pixiEffects.renderSecondaryEffect(this, effect, progress, alpha, radius, color, style)) continue;
        if (pixiEffects.renderDefaultBurstEffect && pixiEffects.renderDefaultBurstEffect(this, effect, progress, alpha, radius, color)) continue;
        if (effect.kind === "slash") {
          const cleave = style.includes("cleave") || style.includes("brute") || style.includes("mini_cleave") || style.includes("warrior");
          const puppet = style.includes("puppet") || style.includes("thread");
          const assassin = style.includes("shadow") || style.includes("assassin") || style.includes("stalker");
          const key = cleave ? "fx-cleave" : "fx-sword-cut";
          const slashScale = (cleave ? 0.72 : 0.82) + progress * (cleave ? 0.32 : 0.24);
          const slash = this.fx(key, effect.x, effect.y, slashScale, slashScale, assassin ? "#8a6f9e" : puppet ? "#f5d0fe" : color, alpha * 0.92, effect.y + 96, Number(effect.angle || 0) + progress * 0.42, "add");
          if (assassin || puppet) {
            const smoke = this.fx(assassin ? "fx-smoke" : "fx-lightning", effect.x - Math.cos(effect.angle || 0) * 18, effect.y - Math.sin(effect.angle || 0) * 18, 0.55, 0.42, assassin ? "#21142f" : "#b985c8", alpha * 0.32, effect.y + 88, Number(effect.angle || 0), "add");
            smoke.alpha *= 0.8;
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
            const bolt = this.fx("fx-lightning", effect.x, effect.y, Math.max(0.75, radius / 68), 0.9, "#9ee6ff", alpha * 0.92, effect.y + 92, angle, "add");
            this.fx("fx-impact-star", effect.x - Math.cos(angle) * radius * 0.45, effect.y - Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, progress, "add");
            this.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.34, 0.34, "#dbeafe", alpha * 0.62, effect.y + 93, -progress, "add");
            bolt.alpha *= 0.95;
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
            const key = blink ? "fx-frost-shards" : shadow ? "fx-smoke" : charge ? "fx-shield-hex" : martial ? "fx-impact-star" : "beam";
            const sx = charge ? Math.max(0.7, radius / 80) : blink ? 0.5 : shadow ? Math.max(0.55, radius / 95) : Math.max(1.7, radius / 14);
            const sy = charge ? 0.56 : blink ? 0.5 : shadow ? 0.46 : Math.max(0.52, radius / 76);
            this.fx(key, effect.x, effect.y, sx, sy, blink ? "#93c5fd" : shadow ? "#8a6f9e" : martial ? "#fde68a" : color, alpha * 0.68, effect.y + 88, angle, "add");
            if (charge) this.fx("fx-impact-star", effect.x + Math.cos(angle) * radius * 0.45, effect.y + Math.sin(angle) * radius * 0.45, 0.72, 0.72, "#facc15", alpha * 0.52, effect.y + 98, progress, "add");
          }
        } else if (effect.kind === "meteor") {
          const fall = Math.min(1, progress * 1.35);
          const meteor = this.fx("fx-fire-bloom", effect.x - radius * 0.75 * (1 - fall), effect.y - radius * 1.85 * (1 - fall), 0.48 + fall * 0.42, 0.48 + fall * 0.42, "#f97316", alpha * 0.9, effect.y + 104, 0.78, "add");
          this.fx("beam", effect.x - radius * 0.38 * (1 - fall), effect.y - radius * 0.94 * (1 - fall), radius / 18, 1.2, "#f97316", alpha * 0.22, effect.y + 98, 0.78, "add");
          if (progress > 0.42) {
            this.fx("fx-fire-bloom", effect.x, effect.y, radius / 82 + progress * 0.34, radius / 82 + progress * 0.34, "#f97316", alpha * 0.62, effect.y + 100, progress * 1.4, "add");
            this.ring(effect.x, effect.y, radius * (0.35 + progress * 0.7), "#f97316", alpha * 0.2, 5);
          }
          meteor.alpha *= 0.94;
        } else if (effect.kind === "freeze" || effect.kind === "slow") {
          const snap = progress < 0.32 ? 1 + progress * 0.4 : 1.12 - (progress - 0.32) * 0.3;
          this.fx("fx-frost-shards", effect.x, effect.y, radius / 88 * snap, radius / 88 * snap, "#dbeafe", alpha * 0.8, effect.y + 92, progress * 0.4, "add");
          this.ring(effect.x, effect.y, radius * (0.82 + progress * 0.12), "#93c5fd", alpha * 0.28, 3);
        } else if (effect.kind === "warning") {
          const danger = style.includes("sniper") || style.includes("lock") ? "#ef4444" : color || "#ef4444";
          this.fx("fx-warning-target", effect.x, effect.y, radius / 48, radius / 48, danger, 0.2 + alpha * 0.34, effect.y + 50, progress * 0.18, "add");
          if (style.includes("boss") || style.includes("bomber") || radius > 90) {
            this.ring(effect.x, effect.y, radius * (0.98 - progress * 0.05), danger, 0.16 + alpha * 0.18, 4);
          }
        } else if (effect.kind === "shield" || effect.kind === "cleanse" || effect.kind === "revive" || effect.kind === "holy") {
          const heal = effect.kind === "holy" || effect.kind === "revive" || effect.kind === "cleanse" || style.includes("heal");
          this.fx(heal ? "fx-heal-cross" : "fx-shield-hex", effect.x, effect.y, radius / 76 + progress * 0.16, radius / 76 + progress * 0.16, heal ? "#bbf7d0" : color, alpha * (heal ? 0.5 : 0.56), effect.y + 82, heal ? progress * 0.65 : progress * 0.18, "add");
          this.ring(effect.x, effect.y, radius * (0.62 + progress * 0.28), heal ? "#86efac" : color, alpha * 0.22, heal ? 2 : 4);
        } else if (effect.kind === "poison") {
          this.fx("fx-poison-cloud", effect.x, effect.y, radius / 76, radius / 90, "#bef264", alpha * 0.46, effect.y + 80, progress * 0.22, "add");
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

    renderStyledSkillEffect(effect, progress, alpha, radius, color, style) {
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

      if (pixiSkillEffects.renderAssetStyledSkillEffect && pixiSkillEffects.renderAssetStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderSkillEffectPolishLayer) {
        pixiSkillEffects.renderSkillEffectPolishLayer(this, skillContext);
      }
      if (this.renderCrispStyledSkillEffect(effect, progress, alpha, radius, color, s, kind, angle, peak, pulse, effectRadius, end, z)) return true;
      if (pixiSkillEffects.renderWarriorStyledSkillEffect && pixiSkillEffects.renderWarriorStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderRangerStyledSkillEffect && pixiSkillEffects.renderRangerStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderMageStyledSkillEffect && pixiSkillEffects.renderMageStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderEngineerStyledSkillEffect && pixiSkillEffects.renderEngineerStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderPuppetStyledSkillEffect && pixiSkillEffects.renderPuppetStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderMartialStyledSkillEffect && pixiSkillEffects.renderMartialStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderAlchemistStyledSkillEffect && pixiSkillEffects.renderAlchemistStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderAssassinStyledSkillEffect && pixiSkillEffects.renderAssassinStyledSkillEffect(this, skillContext)) return true;
      if (pixiSkillEffects.renderCommonStyledEffect && pixiSkillEffects.renderCommonStyledEffect(this, skillContext)) return true;

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
      this.drawGfxPath(blade, "#f8f3e9", alpha * 0.96, tint, alpha * 0.72, heavy ? 4 : 3, zIndex + 2, "add");
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

    drawGfxShieldWake(fromX, fromY, toX, toY, width, angle, color, alpha, zIndex, phase = 0) {
      const ux = Math.cos(angle);
      const uy = Math.sin(angle);
      const px = -uy;
      const py = ux;
      const rawLength = Math.hypot(toX - fromX, toY - fromY);
      if (rawLength < 3) return;
      const length = Math.min(rawLength, width * 2.25);
      const baseX = toX - ux * length;
      const baseY = toY - uy * length;
      const lane = [
        { x: baseX - px * width * 0.44, y: baseY - py * width * 0.44 },
        { x: toX - ux * width * 0.2 - px * width * 0.28, y: toY - uy * width * 0.2 - py * width * 0.28 },
        { x: toX - ux * width * 0.34 + px * width * 0.28, y: toY - uy * width * 0.34 + py * width * 0.28 },
        { x: baseX + px * width * 0.44, y: baseY + py * width * 0.44 }
      ];
      this.drawGfxPath(lane, "#6b3425", alpha * 0.12, color, alpha * 0.12, 2, zIndex - 2, "add");
      const stripes = 7;
      for (let i = 0; i < stripes; i += 1) {
        const side = (i - (stripes - 1) / 2) * width * 0.18;
        const laneAlpha = alpha * (0.22 - Math.abs(i - (stripes - 1) / 2) * 0.018);
        const start = Math.max(0, 0.34 + i * 0.018);
        const end = 0.9 - (i % 2) * 0.05;
        const sx = baseX + ux * length * start + px * side;
        const sy = baseY + uy * length * start + py * side;
        const ex = baseX + ux * length * end + px * side;
        const ey = baseY + uy * length * end + py * side;
        this.drawGfxLine(sx, sy, ex, ey, i === 3 ? 7 : 3.5, i % 2 ? "#fde68a" : color, laneAlpha, zIndex + i, "add");
      }
      for (let i = 0; i < 5; i += 1) {
        const t = 0.42 + i * 0.1;
        const side = Math.sin(phase * 8 + i) * width * 0.22;
        const x = baseX + ux * length * t + px * side;
        const y = baseY + uy * length * t + py * side;
        this.drawGfxDiamond(x, y, 3 + (i % 2), i % 2 ? "#6b3425" : "#fde68a", alpha * 0.14, zIndex + 10 + i, angle + phase);
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
      if (!path) return;
      const points = path.points;
      for (let i = 0; i < points.length - 1; i += 1) {
        this.drawGfxLine(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, width, color, alpha, zIndex + i, "add");
      }
      for (let i = 1; i < points.length - 1; i += 2) {
        this.drawGfxLine(
          points[i].x,
          points[i].y,
          points[i].x + path.px * path.jitter * 0.7 + path.ux * path.jitter * 0.9,
          points[i].y + path.py * path.jitter * 0.7 + path.uy * path.jitter * 0.9,
          Math.max(2, width * 0.42),
          "#dbeafe",
          alpha * 0.48,
          zIndex + i + 1,
          "add"
        );
      }
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

    drawEliteCrown(x, y, affix, color, zIndex) {
      const crown = this.texture(`elite:${affix || "base"}`, 24, 18, (ctx) => {
        this.px(ctx, 3, 11, 18, 4, "#ffffff");
        this.px(ctx, 5, 5, 4, 8, "#ffffff");
        this.px(ctx, 11, 2, 4, 11, "#ffffff");
        this.px(ctx, 17, 5, 4, 8, "#ffffff");
      });
      const sprite = this.sprite(crown, this.layers.effect, x, y, 0.9, 0.9, color, 0.76);
      sprite.zIndex = zIndex + 120;
    }

    visualPosition(map, entity) {
      return map?.get(String(entity.id)) || entity;
    }

    px(ctx, x, y, w, h, color) {
      if (pixiPixelDrawing.px) {
        pixiPixelDrawing.px(ctx, x, y, w, h, color);
        return;
      }
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    linePx(ctx, x1, y1, x2, y2, color) {
      if (pixiPixelDrawing.linePx) {
        pixiPixelDrawing.linePx(ctx, x1, y1, x2, y2, color);
        return;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(x1), Math.round(y1));
      ctx.lineTo(Math.round(x2), Math.round(y2));
      ctx.stroke();
    }

    outline(ctx, x, y, w, h) {
      if (pixiPixelDrawing.outline) {
        pixiPixelDrawing.outline(ctx, x, y, w, h);
        return;
      }
      ctx.fillStyle = "rgba(10,10,9,0.42)";
      ctx.fillRect(Math.round(x + 5), Math.round(y + h - 2), Math.round(w - 10), 2);
    }

    pixelDiamond(ctx, x, y, r, fill, light) {
      if (pixiPixelDrawing.pixelDiamond) {
        pixiPixelDrawing.pixelDiamond(ctx, x, y, r, fill, light);
        return;
      }
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
