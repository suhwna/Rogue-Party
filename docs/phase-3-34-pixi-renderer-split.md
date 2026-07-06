# Phase 3-34: Pixi Class Texture Preset Split

## Scope

Phase 3-34 continues the incremental Pixi renderer split from the full modernization plan.

This phase extracts class-specific utility texture drawing from `public/pixi-renderer.js` into a runtime bridge and a TypeScript mirror.

## Added

- `public/pixi-class-textures.js`
  - Exposes `window.RoguePixiClassTextures`
  - Provides:
    - `drawTurret`
    - `drawMine`
    - `drawDrone`
    - `drawPuppet`
    - `drawThreadKnot`
    - `drawFist`
    - `drawPalmWave`
    - `drawFlask`
    - `drawAssassinMark`
    - `drawShadowCut`

- `src/render/ClassTexturePresets.ts`
  - TypeScript mirror for the same texture presets

## Updated

- `public/pixi-renderer.js`
  - Uses `RoguePixiClassTextures` when available
  - Keeps inline fallback drawing for legacy runtime safety

- `public/index.html`
  - Loads `/pixi-class-textures.js` before `/pixi-skill-effects.js`

- `vite.config.ts`
  - Copies `pixi-class-textures.js` into production build output

- `smoke-check.js`
  - Verifies the class texture bridge is served and exposes expected drawing functions

## Notes

- Gameplay behavior is unchanged.
- These presets support engineer, puppeteer, martialist, alchemist, and assassin visuals.
- This reduces raw canvas drawing ownership inside the main Pixi renderer.
