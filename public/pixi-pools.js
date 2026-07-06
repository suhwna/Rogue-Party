(() => {
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

  window.RoguePixiPools = Object.freeze({
    SpritePool,
    TextPool,
    GraphicsPool,
    createSpritePool: (PIXI) => new SpritePool(PIXI),
    createTextPool: (PIXI) => new TextPool(PIXI),
    createGraphicsPool: (PIXI) => new GraphicsPool(PIXI)
  });
})();
