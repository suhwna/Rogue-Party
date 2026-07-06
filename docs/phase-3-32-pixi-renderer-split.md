# Phase 3-32: Pixi Ranged Texture Preset Split

## Scope

Phase 3-32 continues the incremental Pixi renderer split from the full modernization plan.

This phase extracts ranger/projectile texture preset drawing from `public/pixi-renderer.js` into a small runtime bridge and a TypeScript mirror.

## Added

- `public/pixi-ranged-textures.js`
  - Exposes `window.RoguePixiRangedTextures`
  - Provides:
    - `drawArrowStreak`
    - `drawArrowFan`
    - `drawArrowRain`
    - `drawPierceLance`

- `src/render/RangedTexturePresets.ts`
  - TypeScript mirror for future renderer migration

## Updated

- `public/pixi-renderer.js`
  - Uses `RoguePixiRangedTextures` when available
  - Keeps inline fallback drawing for legacy safety

- `public/index.html`
  - Loads `/pixi-ranged-textures.js` before `/pixi-skill-effects.js`

- `vite.config.ts`
  - Copies `pixi-ranged-textures.js` into production build output

- `smoke-check.js`
  - Verifies the ranged texture bridge is served and exposes expected drawing functions

## Notes

- This phase does not change gameplay behavior.
- The goal is renderer responsibility separation and a safer path toward TypeScript modules.
- Visual output remains compatible with the current Pixi texture creation path.
