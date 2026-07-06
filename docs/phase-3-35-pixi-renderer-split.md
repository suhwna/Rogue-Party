# Phase 3-35: Pixi Pixel Drawing Utility Split

## Scope

Phase 3-35 continues the incremental Pixi renderer split from the full modernization plan.

This phase extracts low-level pixel drawing helpers from `public/pixi-renderer.js` into a runtime bridge and a TypeScript mirror.

## Added

- `public/pixi-pixel-drawing.js`
  - Exposes `window.RoguePixiPixelDrawing`
  - Provides:
    - `px`
    - `linePx`
    - `outline`
    - `pixelDiamond`

- `src/render/PixelDrawing.ts`
  - TypeScript mirror for the same helpers

## Updated

- `public/pixi-renderer.js`
  - Delegates `px`, `linePx`, `outline`, and `pixelDiamond` to `RoguePixiPixelDrawing` when available
  - Keeps inline fallbacks for legacy runtime safety

- `public/index.html`
  - Loads `/pixi-pixel-drawing.js` before palette, texture, and renderer scripts

- `vite.config.ts`
  - Copies `pixi-pixel-drawing.js` into production build output

- `smoke-check.js`
  - Verifies the pixel drawing bridge is served and exposes expected helper functions

## Notes

- Gameplay behavior is unchanged.
- This phase prepares actor, enemy, boss, and objective texture factories for later extraction.
- The main renderer still owns the actor texture recipes; only shared pixel utilities moved.
