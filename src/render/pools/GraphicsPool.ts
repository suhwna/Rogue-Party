import type { PoolStats } from "./PoolTypes";

interface PixiGraphicsLike {
  parent?: PixiContainerLike;
  visible: boolean;
  alpha: number;
  rotation: number;
  blendMode: string;
  zIndex: number;
  clear(): void;
  scale: { set(x: number, y?: number): void };
  position: { set(x: number, y?: number): void };
}

interface PixiContainerLike {
  addChild(child: PixiGraphicsLike): void;
  removeChild(child: PixiGraphicsLike): void;
}

interface PixiLike {
  Graphics: new () => PixiGraphicsLike;
}

export class GraphicsPool {
  private readonly items: PixiGraphicsLike[] = [];
  private index = 0;

  constructor(private readonly pixi: PixiLike) {}

  begin(): void {
    this.index = 0;
  }

  next(parent: PixiContainerLike): PixiGraphicsLike {
    let graphics = this.items[this.index];
    if (!graphics) {
      graphics = new this.pixi.Graphics();
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

  end(): void {
    for (let i = this.index; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (!item) continue;
      item.clear();
      item.visible = false;
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
      item?.clear();
      item?.parent?.removeChild(item);
    }
    this.items.length = target;
  }
}
