import type { PoolStats } from "./PoolTypes";

interface PixiSpriteLike {
  parent?: PixiContainerLike;
  visible: boolean;
  texture: unknown;
  alpha: number;
  tint: number;
  rotation: number;
  blendMode: string;
  zIndex: number;
  roundPixels: boolean;
  anchor: { set(x: number, y?: number): void };
  scale: { set(x: number, y?: number): void };
}

interface PixiContainerLike {
  addChild(child: PixiSpriteLike): void;
  removeChild(child: PixiSpriteLike): void;
}

interface PixiLike {
  Sprite: new (texture: unknown) => PixiSpriteLike;
}

export class SpritePool {
  private readonly items: PixiSpriteLike[] = [];
  private index = 0;

  constructor(private readonly pixi: PixiLike) {}

  begin(): void {
    this.index = 0;
  }

  next(texture: unknown, parent: PixiContainerLike): PixiSpriteLike {
    let sprite = this.items[this.index];
    if (!sprite) {
      sprite = new this.pixi.Sprite(texture);
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

  end(): void {
    for (let i = this.index; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item) item.visible = false;
    }
  }

  stats(): PoolStats {
    return { used: this.index, retained: this.items.length };
  }

  trim(maxRetained: number): void {
    const target = Math.max(this.index, maxRetained);
    if (this.items.length <= target) return;
    for (let i = target; i < this.items.length; i += 1) {
      const item = this.items[i];
      item?.parent?.removeChild(item);
    }
    this.items.length = target;
  }
}
