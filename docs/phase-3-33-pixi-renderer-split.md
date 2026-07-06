# Phase 3-33: Pixi Elemental Texture Preset Split

## Scope

Phase 3-33 continues the incremental Pixi renderer split from the full modernization plan.

This phase extracts elemental/status/combat utility texture drawing from `public/pixi-renderer.js` into a runtime bridge and a TypeScript mirror.

## Added

- `public/pixi-elemental-textures.js`
  - Exposes `window.RoguePixiElementalTextures`
  - Provides:
    - `drawLightning`
    - `drawFrostShards`
    - `drawFireBloom`
    - `drawPoisonCloud`
    - `drawHealCross`
    - `drawShieldHex`
    - `drawWarningTarget`
    - `drawStarBurst`
    - `drawMeteorFall`
    - `drawFrostSnap`
    - `drawAcidSplash`
    - `drawFirePool`
    - `drawSmoke`

- `src/render/ElementalTexturePresets.ts`
  - TypeScript mirror for the same texture presets

## Updated

- `public/pixi-renderer.js`
  - Uses `RoguePixiElementalTextures` when available
  - Keeps inline fallback drawing for legacy runtime safety

- `public/index.html`
  - Loads `/pixi-elemental-textures.js` before `/pixi-skill-effects.js`

- `vite.config.ts`
  - Copies `pixi-elemental-textures.js` into production build output

- `smoke-check.js`
  - Verifies the elemental texture bridge is served and exposes expected drawing functions

## Notes

- Gameplay behavior is unchanged.
- This phase reduces renderer ownership of raw canvas drawing recipes.
- These presets are used by mage, hazard, projectile, healing, shield, poison, fire, frost, lightning, and warning visuals.
