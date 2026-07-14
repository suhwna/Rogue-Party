(() => {
  const EFFECT_DRAW_BUDGET = 360;
  const POOL_TRIM_INTERVAL_MS = 10000;
  const POOL_RETAIN = Object.freeze({
    sprite: 1800,
    text: 260,
    graphics: 1200
  });
  const QUALITY_PRESETS = Object.freeze({
    low: Object.freeze({
      effectBudget: 180,
      particleBudget: 110,
      resolutionCap: 1.25,
      retain: Object.freeze({ sprite: 1000, text: 140, graphics: 640 })
    }),
    medium: Object.freeze({
      effectBudget: 260,
      particleBudget: 180,
      resolutionCap: 1.75,
      retain: Object.freeze({ sprite: 1400, text: 200, graphics: 900 })
    }),
    high: Object.freeze({
      effectBudget: EFFECT_DRAW_BUDGET,
      particleBudget: 280,
      resolutionCap: 2.5,
      retain: POOL_RETAIN
    })
  });

  function chooseRendererPreference() {
    return typeof navigator !== "undefined" && navigator.gpu ? "webgpu" : "webgl";
  }

  function getQualityPreset(quality) {
    return QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;
  }

  function createDiagnostics(seed) {
    return {
      rendererPreference: seed.rendererPreference,
      rendererType: seed.rendererType || "pending",
      quality: seed.quality || "high",
      fps: 0,
      frameMs: 0,
      sprites: { used: 0, retained: 0 },
      texts: { used: 0, retained: 0 },
      graphics: { used: 0, retained: 0 },
      textures: 0,
      assetTextures: { external: 0, fallback: 0 },
      effects: 0,
      particles: { used: 0, retained: 0, skipped: 0, budget: getQualityPreset(seed.quality).particleBudget, pressure: 0 },
      effectBudget: getQualityPreset(seed.quality).effectBudget,
      particleBudget: getQualityPreset(seed.quality).particleBudget
    };
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
      let sprite = this.items[this.index];
      if (!sprite) {
        sprite = new this.PIXI.Sprite(texture);
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
      let text = this.items[this.index];
      if (!text) {
        text = new this.PIXI.Text({ text: "", style });
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
      let graphics = this.items[this.index];
      if (!graphics) {
        graphics = new this.PIXI.Graphics();
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

  function createCanvasTexture(PIXI, width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    draw(ctx, width, height);
    return PIXI.Texture.from(canvas);
  }

  function createTextureRegistry() {
    const items = new Map();
    return {
      has(key) {
        return items.has(key);
      },
      get(key) {
        return items.get(key);
      },
      set(key, texture) {
        items.set(key, texture);
        return texture;
      },
      get size() {
        return items.size;
      },
      getOrCreate(key, factory) {
        if (items.has(key)) return items.get(key);
        const texture = factory();
        items.set(key, texture);
        return texture;
      }
    };
  }

  function createLayer(PIXI, zIndex) {
    const layer = new PIXI.Container();
    layer.sortableChildren = true;
    layer.zIndex = zIndex;
    return layer;
  }

  function createLayerSet(PIXI, parent, entries) {
    const layers = {};
    for (const [name, zIndex] of entries) {
      const layer = createLayer(PIXI, zIndex);
      layers[name] = layer;
      parent.addChild(layer);
    }
    return layers;
  }

  function clearLayerSet(layerSet) {
    for (const layer of Object.values(layerSet || {})) {
      layer.children.forEach((child) => {
        child.visible = false;
      });
    }
  }

  function effectStartIndex(effectsLength, effectBudget) {
    return Math.max(0, Number(effectsLength || 0) - Math.max(0, Number(effectBudget || 0)));
  }

  const PRIMARY_EFFECT_KINDS = new Set(["slash", "spin", "dash", "warning", "meteor", "trap", "shot", "chain", "arcane", "freeze", "slow"]);

  function effectRetentionPriority(effect) {
    const kind = String(effect?.kind || "");
    const style = String(effect?.style || "");
    if (kind === "damage" || kind === "heal" || kind === "xp" || (kind === "poison" && effect?.value)) return 0;
    if (kind === "impact") {
      return style === "critical_hit" || style === "heavy_hit" || style === "cleave_execute" ? 2 : 1;
    }
    const radius = Math.max(0, Number(effect?.rangeRadius || effect?.radius || 0));
    return (PRIMARY_EFFECT_KINDS.has(kind) ? 3 : 2) + (radius >= 140 ? 1 : 0);
  }

  function selectEffectsForBudget(effects, effectBudget) {
    if (!Array.isArray(effects) || effects.length === 0) return [];
    const budget = Math.max(0, Math.floor(Number(effectBudget || 0)));
    if (budget <= 0) return [];
    if (effects.length <= budget) return effects;
    return effects
      .map((effect, index) => ({ effect, index, priority: effectRetentionPriority(effect) }))
      .sort((a, b) => b.priority - a.priority || b.index - a.index)
      .slice(0, budget)
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.effect);
  }

  window.RoguePixiRuntime = Object.freeze({
    EFFECT_DRAW_BUDGET,
    POOL_TRIM_INTERVAL_MS,
    POOL_RETAIN,
    QUALITY_PRESETS,
    chooseRendererPreference,
    getQualityPreset,
    createDiagnostics,
    createSpritePool: (PIXI) => new SpritePool(PIXI),
    createTextPool: (PIXI) => new TextPool(PIXI),
    createGraphicsPool: (PIXI) => new GraphicsPool(PIXI),
    createCanvasTexture,
    createTextureRegistry,
    createLayer,
    createLayerSet,
    clearLayerSet,
    effectStartIndex,
    effectRetentionPriority,
    selectEffectsForBudget
  });
})();
