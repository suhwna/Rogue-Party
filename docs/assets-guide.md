# Visual Asset Guide

## Scope

This project uses a visual-only asset pipeline for Phase 11.

- SFX, BGM, and audio asset work are intentionally excluded.
- PixiJS remains the renderer.
- Generated assets should support pixel-art 2D roguelike readability.

## Directory Layout

```txt
public/assets/
  asset-manifest.json
  sprites/
  icons/
  effects/
```

## Common Rules

- 2D game asset
- animation-ready
- clean silhouette
- centered composition
- isolated object
- transparent background or pure black background
- no text
- no logo
- no watermark
- sprite sheet friendly
- high contrast

## Character Sprite Prompt

```txt
2D pixel-art fantasy roguelike character sprite sheet, full body, idle and attack-ready stance, clean readable silhouette, centered composition, sharp outline, high-detail but animation-ready, isolated on transparent background, no scenery, no text, no logo, no watermark, game asset, sprite sheet friendly
```

## Enemy Sprite Prompt

```txt
2D pixel-art fantasy roguelike enemy sprite sheet, readable monster silhouette, clear role identity, idle and attack frames, centered composition, sharp outline, high contrast, isolated on transparent background, no scenery, no text, no logo, no watermark, game asset, sprite sheet friendly
```

## Boss Sprite Prompt

```txt
2D pixel-art fantasy roguelike boss sprite sheet, large imposing silhouette, phase-ready visual variants, attack windup frames, centered composition, high contrast, dramatic readable shape, isolated on transparent background, no scenery, no text, no logo, no watermark, game asset, sprite sheet friendly
```

## Skill Effect Prompt

```txt
2D pixel-art game skill effect sprite sheet, readable attack shape, strong directional motion, impact frames, glowing particles, additive-blend friendly, isolated on pure black background, no character, no scenery, no text, no logo, no watermark, high contrast VFX asset
```

## Icon Prompt

```txt
2D pixel-art game UI icon, clear readable object shape, centered composition, high contrast, rarity-friendly glow, transparent background, no text, no logo, no watermark
```

## Asset Intake Checklist

- File name uses kebab-case.
- Asset type is listed in `public/assets/asset-manifest.json`.
- Sprite sheet frame size and anchor point are documented beside the asset.
- Transparent background is verified when required.
- No text/logo/watermark is present.
- Asset has a clear in-game owner: class, enemy, boss, relic, skill, stage, or effect.

## Texture Replacement Priority

Pixi texture replacement follows this order.

1. `generatedAssets[].textureKey` matches the renderer texture key.
2. `generatedAssets[].aliases` contains the renderer texture key.
3. No descriptor exists, so the renderer uses the code-generated canvas texture.

This lets the game replace assets gradually. A missing manifest entry must never block the generated fallback.

## Texture Key Naming

```txt
actor:{classId}:{frame}:{state}
enemy:{type}:{frame}
boss:{bossId}:{phase}:{frame}
projectile:{style}
floor-tile-{chapter}-{variant}
wall-block-{chapter}
fx-{effect-name}
icon:relic:{relicId}
icon:skill:{skillId}
```

## Manifest Entry Shape

```json
{
  "id": "warrior-blade-effect",
  "kind": "effects",
  "file": "skills/warrior-blade.png",
  "textureKey": "fx-warrior-blade",
  "aliases": ["fx-warrior-cleave-cone"],
  "owner": "warrior",
  "frameWidth": 176,
  "frameHeight": 58,
  "frames": 1,
  "anchorX": 0.5,
  "anchorY": 0.5
}
```

See `public/assets/asset-manifest.sample.json` for non-runtime examples.

## Visual Quality Rule

Graphics quality is the priority for this pipeline. Readability still matters, but the target is not minimal placeholder art. Prefer richer silhouettes, clearer motion frames, stronger material separation, and distinct skill identities.

## Regression Checklist

- `public/assets/asset-manifest.json` keeps `scope: "visual-only"` and `audio: false`.
- External asset entries include `textureKey` or an alias that maps to an existing renderer key.
- New assets do not introduce text, logos, or watermarks.
- Generated fallback textures still render when `generatedAssets` is empty.
- Renderer diagnostics expose `assetTextures.external` and `assetTextures.fallback`.
