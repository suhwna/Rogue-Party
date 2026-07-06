(() => {
  function createCanvasTexture(PIXI, width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(Number(width) || 1));
    canvas.height = Math.max(1, Math.round(Number(height) || 1));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context is unavailable");
    ctx.imageSmoothingEnabled = false;
    draw(ctx, canvas.width, canvas.height);
    return PIXI.Texture.from(canvas);
  }

  function normalizeTextureAssetDescriptor(descriptor, visualAssets = window.RogueVisualAssets || {}) {
    if (!descriptor || typeof descriptor !== "object") return null;
    const key = String(descriptor.key || descriptor.textureKey || descriptor.id || "").trim();
    const kind = String(descriptor.kind || "").trim();
    const file = String(descriptor.file || "").trim();
    const source = String(descriptor.source || descriptor.path || "").trim();
    const resolvedSource = source || (kind && file && visualAssets.assetPath ? visualAssets.assetPath(kind, file) : "");
    if (!key || !resolvedSource) return null;
    return {
      ...descriptor,
      key,
      kind,
      file,
      source: resolvedSource
    };
  }

  function createExternalAssetTexture(PIXI, descriptor, visualAssets = window.RogueVisualAssets || {}) {
    const normalized = normalizeTextureAssetDescriptor(descriptor, visualAssets);
    if (!normalized) return null;
    return PIXI.Texture.from(normalized.source);
  }

  function createTextureRegistry() {
    const items = new Map();
    const metadata = new Map();
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
      getMeta(key) {
        return metadata.get(key);
      },
      setMeta(key, value) {
        metadata.set(key, value);
        return value;
      },
      delete(key) {
        metadata.delete(key);
        return items.delete(key);
      },
      clear() {
        items.clear();
        metadata.clear();
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

  function getOrCreateExternalTexture(registry, PIXI, key, descriptor, visualAssets = window.RogueVisualAssets || {}) {
    const normalized = normalizeTextureAssetDescriptor({ ...descriptor, key }, visualAssets);
    if (!normalized) return null;
    const create = () => {
      const texture = createExternalAssetTexture(PIXI, normalized, visualAssets);
      registry?.setMeta?.(key, { source: "asset", descriptor: normalized });
      return texture;
    };
    if (registry?.getOrCreate) return registry.getOrCreate(key, create);
    if (registry?.has?.(key)) return registry.get(key);
    const texture = create();
    registry?.set?.(key, texture);
    return texture;
  }

  function getOrCreateCanvasTexture(registry, PIXI, key, width, height, draw) {
    const create = () => createCanvasTexture(PIXI, width, height, draw);
    if (registry?.getOrCreate) return registry.getOrCreate(key, create);
    if (registry?.has?.(key)) return registry.get(key);
    const texture = create();
    registry?.set?.(key, texture);
    return texture;
  }

  function getOrCreateTextureWithAsset(registry, PIXI, key, width, height, draw, descriptor, visualAssets = window.RogueVisualAssets || {}) {
    const normalized = normalizeTextureAssetDescriptor({ ...descriptor, key }, visualAssets);
    if (normalized) {
      try {
        return getOrCreateExternalTexture(registry, PIXI, key, normalized, visualAssets);
      } catch (error) {
        console.warn("External texture failed, falling back to generated texture", key, error);
      }
    }
    const texture = getOrCreateCanvasTexture(registry, PIXI, key, width, height, draw);
    registry?.setMeta?.(key, { source: "generated" });
    return texture;
  }

  window.RoguePixiTextureFactory = Object.freeze({
    createCanvasTexture,
    normalizeTextureAssetDescriptor,
    createExternalAssetTexture,
    createTextureRegistry,
    getOrCreateExternalTexture,
    getOrCreateCanvasTexture,
    getOrCreateTextureWithAsset
  });
})();
