# Phase 3-37 Pixi Renderer Split

## Scope

This step extracts enemy sprite-sheet drawing presets from the monolithic Pixi renderer while keeping the legacy renderer fallback intact.

## Added

- `public/pixi-enemy-textures.js`
  - Browser bridge exposed as `window.RoguePixiEnemyTextures`
  - Owns `drawEnemySheetFrame`
  - Uses `RoguePixiPalettes` and `RoguePixiPixelDrawing` when available
  - Covers slime, bat, charger, guardian, shaman, spitter, bomber, stalker, mortar, sniper, brute, runner variants, training dummy, splitter, and splinter

- `src/render/EnemyTexturePresets.ts`
  - TypeScript mirror for the same enemy sprite drawing presets
  - Uses shared palette and pixel drawing helpers

## Updated

- `public/pixi-renderer.js`
  - Delegates enemy sheet drawing to `RoguePixiEnemyTextures.drawEnemySheetFrame`
  - Keeps the old inline drawing code as fallback

- `public/index.html`
  - Loads `/pixi-enemy-textures.js` before texture keys and renderer setup

- `vite.config.ts`
  - Copies `pixi-enemy-textures.js` into production build output

- `smoke-check.js`
  - Verifies the new bridge is served and contains expected enemy presets

## Why

Enemy visual presets are a large, self-contained part of texture generation. Pulling them into a dedicated module lowers renderer coupling and prepares Phase 3 for actor/enemy/boss rendering ownership boundaries.

## Validation

- `node --check public/pixi-enemy-textures.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
