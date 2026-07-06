export const ASSET_MANIFEST_URL = "/assets/asset-manifest.json";

export type VisualAssetKind = "sprites" | "icons" | "effects";

export interface VisualAssetEntry {
  id: string;
  kind: VisualAssetKind;
  file: string;
  textureKey?: string;
  aliases?: string[];
  path?: string;
  owner?: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  anchorX?: number;
  anchorY?: number;
}

export interface VisualAssetManifest {
  version: number;
  scope: "visual-only";
  audio: false;
  directories: Record<VisualAssetKind, string>;
  generatedAssets: VisualAssetEntry[];
}

export const defaultVisualAssetManifest: Readonly<VisualAssetManifest> = Object.freeze({
  version: 1,
  scope: "visual-only",
  audio: false,
  directories: {
    sprites: "/assets/sprites/",
    icons: "/assets/icons/",
    effects: "/assets/effects/",
  },
  generatedAssets: [],
});

export function normalizeVisualAssetManifest(value: unknown): VisualAssetManifest {
  const input = value && typeof value === "object" ? (value as Partial<VisualAssetManifest>) : {};
  return {
    ...defaultVisualAssetManifest,
    ...input,
    scope: "visual-only",
    audio: false,
    directories: {
      ...defaultVisualAssetManifest.directories,
      ...(input.directories || {}),
    },
    generatedAssets: Array.isArray(input.generatedAssets)
      ? input.generatedAssets.filter(isVisualAssetEntry).map(normalizeVisualAssetEntry)
      : [],
  };
}

export function assetDirectory(manifest: VisualAssetManifest, kind: VisualAssetKind): string {
  return manifest.directories[kind] || defaultVisualAssetManifest.directories[kind];
}

export function assetPath(manifest: VisualAssetManifest, kind: VisualAssetKind, fileName: string): string {
  const safeName = String(fileName || "").replace(/\\/g, "/").replace(/^\/+/, "");
  return safeName ? `${assetDirectory(manifest, kind)}${safeName}` : "";
}

export function findTextureAsset(manifest: VisualAssetManifest, textureKey: string): VisualAssetEntry | null {
  const key = String(textureKey || "").trim();
  if (!key) return null;
  return (
    manifest.generatedAssets.find((asset) => {
      if (asset.textureKey === key || asset.id === key) return true;
      return Array.isArray(asset.aliases) && asset.aliases.includes(key);
    }) || null
  );
}

export function assetDescriptorForTexture(
  manifest: VisualAssetManifest,
  textureKey: string,
): (VisualAssetEntry & { key: string; source: string }) | null {
  const asset = findTextureAsset(manifest, textureKey);
  if (!asset) return null;
  const source = asset.path || assetPath(manifest, asset.kind, asset.file);
  if (!source) return null;
  return {
    ...asset,
    key: textureKey,
    source,
  };
}

function isVisualAssetEntry(value: unknown): value is VisualAssetEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<VisualAssetEntry>;
  return (
    typeof entry.id === "string" &&
    (entry.kind === "sprites" || entry.kind === "icons" || entry.kind === "effects") &&
    typeof entry.file === "string"
  );
}

function normalizeVisualAssetEntry(entry: VisualAssetEntry): VisualAssetEntry {
  const normalized: VisualAssetEntry = {
    ...entry,
    id: entry.id.trim(),
    kind: entry.kind,
    file: entry.file.trim(),
    textureKey: String(entry.textureKey || entry.id).trim(),
    aliases: Array.isArray(entry.aliases) ? entry.aliases.map((alias) => String(alias || "").trim()).filter(Boolean) : [],
  };
  const path = typeof entry.path === "string" ? entry.path.trim() : "";
  if (path) normalized.path = path;
  return normalized;
}
