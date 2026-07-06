import type { PoolStats } from "./PoolTypes";

interface PixiTextLike {
  parent?: PixiContainerLike;
  visible: boolean;
  alpha: number;
  rotation: number;
  zIndex: number;
  style: unknown;
  anchor: { set(x: number, y?: number): void };
  scale: { set(x: number, y?: number): void };
}

interface PixiContainerLike {
  addChild(child: PixiTextLike): void;
  removeChild(child: PixiTextLike): void;
}

interface PixiLike {
  Text: new (options: { text: string; style: unknown }) => PixiTextLike;
}

export class TextPool {
  private readonly items: PixiTextLike[] = [];
  private index = 0;

  constructor(private readonly pixi: PixiLike) {}

  begin(): void {
    this.index = 0;
  }

  next(parent: PixiContainerLike, style: unknown): PixiTextLike {
    let text = this.items[this.index];
    if (!text) {
      text = new this.pixi.Text({ text: "", style });
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
