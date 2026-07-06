(function () {
  const ASSET_MANIFEST_URL = "/assets/asset-manifest.json";

  const defaultManifest = Object.freeze({
    version: 1,
    scope: "visual-only",
    audio: false,
    directories: {
      sprites: "/assets/sprites/",
      icons: "/assets/icons/",
      effects: "/assets/effects/"
    },
    generatedAssets: []
  });

  let manifestPromise = null;
  let cachedManifest = defaultManifest;

  function normalizeAssetEntry(value) {
    if (!value || typeof value !== "object") return null;
    const id = String(value.id || "").trim();
    const kind = String(value.kind || "").trim();
    const file = String(value.file || "").trim();
    if (!id || !file || !["sprites", "icons", "effects"].includes(kind)) return null;
    return {
      ...value,
      id,
      kind,
      file,
      textureKey: String(value.textureKey || id).trim(),
      aliases: Array.isArray(value.aliases)
        ? value.aliases.map((alias) => String(alias || "").trim()).filter(Boolean)
        : [],
      path: String(value.path || "").trim()
    };
  }

  function normalizeAssetManifest(value) {
    const input = value && typeof value === "object" ? value : {};
    const directories = input.directories && typeof input.directories === "object" ? input.directories : {};
    const next = {
      ...defaultManifest,
      ...input,
      audio: false,
      directories: {
        ...defaultManifest.directories,
        ...directories
      },
      generatedAssets: Array.isArray(input.generatedAssets)
        ? input.generatedAssets.map(normalizeAssetEntry).filter(Boolean)
        : []
    };
    next.scope = next.scope === "visual-only" ? "visual-only" : defaultManifest.scope;
    return next;
  }

  async function loadAssetManifest(options = {}) {
    if (manifestPromise && !options.force) return manifestPromise;
    manifestPromise = fetch(ASSET_MANIFEST_URL, { cache: options.force ? "reload" : "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("asset manifest unavailable");
        return response.json();
      })
      .then((payload) => {
        cachedManifest = normalizeAssetManifest(payload);
        return cachedManifest;
      })
      .catch(() => {
        cachedManifest = defaultManifest;
        return cachedManifest;
      });
    return manifestPromise;
  }

  function getAssetManifest() {
    return cachedManifest;
  }

  function assetDirectory(kind) {
    const manifest = getAssetManifest();
    return manifest.directories?.[kind] || defaultManifest.directories[kind] || "/assets/";
  }

  function assetPath(kind, fileName) {
    const safeName = String(fileName || "")
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");
    if (!safeName) return "";
    return `${assetDirectory(kind)}${safeName}`;
  }

  function findGeneratedAsset(id) {
    const manifest = getAssetManifest();
    return (manifest.generatedAssets || []).find((asset) => asset && asset.id === id) || null;
  }

  function findTextureAsset(textureKey) {
    const key = String(textureKey || "").trim();
    if (!key) return null;
    const manifest = getAssetManifest();
    return (
      (manifest.generatedAssets || []).find((asset) => {
        if (!asset) return false;
        if (asset.textureKey === key || asset.id === key) return true;
        return Array.isArray(asset.aliases) && asset.aliases.includes(key);
      }) || null
    );
  }

  function assetDescriptorForTexture(textureKey) {
    const asset = findTextureAsset(textureKey);
    if (!asset) return null;
    const path = asset.path || assetPath(asset.kind, asset.file);
    if (!path) return null;
    return {
      ...asset,
      key: textureKey,
      source: path
    };
  }

  function preloadAssetManifest() {
    return loadAssetManifest();
  }

  window.RogueVisualAssets = Object.freeze({
    ASSET_MANIFEST_URL,
    defaultManifest,
    normalizeAssetManifest,
    loadAssetManifest,
    getAssetManifest,
    assetDirectory,
    assetPath,
    findGeneratedAsset,
    findTextureAsset,
    assetDescriptorForTexture,
    preloadAssetManifest
  });

  preloadAssetManifest();
})();
