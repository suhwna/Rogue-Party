import type { TextureRegistry } from "./TextureRegistry";

export type CanvasDrawCallback = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

export interface PixiLikeTextureFactory {
  Texture: {
    from(source: HTMLCanvasElement | string): unknown;
  };
}

export interface TextureAssetDescriptor {
  key?: string;
  id?: string;
  textureKey?: string;
  kind?: string;
  file?: string;
  path?: string;
  source?: string;
}

export function createCanvasTexture(
  pixi: PixiLikeTextureFactory,
  width: number,
  height: number,
  draw: CanvasDrawCallback,
): unknown {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context is unavailable");
  ctx.imageSmoothingEnabled = false;
  draw(ctx, width, height);
  return pixi.Texture.from(canvas);
}

export function normalizeTextureAssetDescriptor(
  descriptor: TextureAssetDescriptor | null | undefined,
  resolvePath?: (kind: string, file: string) => string,
): (TextureAssetDescriptor & { key: string; source: string }) | null {
  if (!descriptor) return null;
  const key = String(descriptor.key || descriptor.textureKey || descriptor.id || "").trim();
  const kind = String(descriptor.kind || "").trim();
  const file = String(descriptor.file || "").trim();
  const source = String(descriptor.source || descriptor.path || "").trim() || (kind && file && resolvePath ? resolvePath(kind, file) : "");
  if (!key || !source) return null;
  return {
    ...descriptor,
    key,
    kind,
    file,
    source,
  };
}

export function createExternalAssetTexture(
  pixi: PixiLikeTextureFactory,
  descriptor: TextureAssetDescriptor,
  resolvePath?: (kind: string, file: string) => string,
): unknown | null {
  const normalized = normalizeTextureAssetDescriptor(descriptor, resolvePath);
  return normalized ? pixi.Texture.from(normalized.source) : null;
}

export function getOrCreateExternalTexture<TTexture>(
  registry: TextureRegistry<TTexture>,
  pixi: PixiLikeTextureFactory,
  key: string,
  descriptor: TextureAssetDescriptor,
  resolvePath?: (kind: string, file: string) => string,
): TTexture | null {
  const normalized = normalizeTextureAssetDescriptor({ ...descriptor, key }, resolvePath);
  if (!normalized) return null;
  return registry.getOrCreate(key, () => {
    const texture = createExternalAssetTexture(pixi, normalized, resolvePath) as TTexture;
    registry.setMeta?.(key, { source: "asset", descriptor: normalized });
    return texture;
  });
}

export function getOrCreateCanvasTexture<TTexture>(
  registry: TextureRegistry<TTexture>,
  pixi: PixiLikeTextureFactory,
  key: string,
  width: number,
  height: number,
  draw: CanvasDrawCallback,
): TTexture {
  return registry.getOrCreate(key, () => {
    const texture = createCanvasTexture(pixi, width, height, draw) as TTexture;
    registry.setMeta?.(key, { source: "generated" });
    return texture;
  });
}

export function getOrCreateTextureWithAsset<TTexture>(
  registry: TextureRegistry<TTexture>,
  pixi: PixiLikeTextureFactory,
  key: string,
  width: number,
  height: number,
  draw: CanvasDrawCallback,
  descriptor?: TextureAssetDescriptor | null,
  resolvePath?: (kind: string, file: string) => string,
): TTexture {
  const externalTexture = descriptor ? getOrCreateExternalTexture(registry, pixi, key, descriptor, resolvePath) : null;
  return externalTexture || getOrCreateCanvasTexture(registry, pixi, key, width, height, draw);
}

export function createTextureFactory<TTexture>(
  pixi: PixiLikeTextureFactory,
  registry: TextureRegistry<TTexture>,
): {
  getOrCreateCanvasTexture(key: string, width: number, height: number, draw: CanvasDrawCallback): TTexture;
  getOrCreateTextureWithAsset(
    key: string,
    width: number,
    height: number,
    draw: CanvasDrawCallback,
    descriptor?: TextureAssetDescriptor | null,
    resolvePath?: (kind: string, file: string) => string,
  ): TTexture;
} {
  return {
    getOrCreateCanvasTexture(key, width, height, draw) {
      return getOrCreateCanvasTexture(registry, pixi, key, width, height, draw);
    },
    getOrCreateTextureWithAsset(key, width, height, draw, descriptor, resolvePath) {
      return getOrCreateTextureWithAsset(registry, pixi, key, width, height, draw, descriptor, resolvePath);
    },
  };
}
