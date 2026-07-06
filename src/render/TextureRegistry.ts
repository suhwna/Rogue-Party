export interface TextureRegistry<TTexture = unknown> {
  readonly size: number;
  has(key: string): boolean;
  get(key: string): TTexture | undefined;
  set(key: string, texture: TTexture): TTexture;
  getMeta?(key: string): unknown;
  setMeta?(key: string, value: unknown): unknown;
  getOrCreate(key: string, factory: () => TTexture): TTexture;
}

export function createTextureRegistry<TTexture = unknown>(): TextureRegistry<TTexture> {
  const items = new Map<string, TTexture>();
  const metadata = new Map<string, unknown>();
  return {
    has: (key) => items.has(key),
    get: (key) => items.get(key),
    set(key, texture) {
      items.set(key, texture);
      return texture;
    },
    getMeta: (key) => metadata.get(key),
    setMeta(key, value) {
      metadata.set(key, value);
      return value;
    },
    get size() {
      return items.size;
    },
    getOrCreate(key, factory) {
      const existing = items.get(key);
      if (existing) return existing;
      const texture = factory();
      items.set(key, texture);
      return texture;
    },
  };
}
