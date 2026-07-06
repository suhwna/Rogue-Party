# Phase 3-38 Pixi Renderer Split

## Scope

This step extracts boss sprite-sheet drawing presets from the monolithic Pixi renderer while keeping the legacy renderer fallback intact.

## Added

- `public/pixi-boss-textures.js`
  - Browser bridge exposed as `window.RoguePixiBossTextures`
  - Owns `drawBossSheetFrame`
  - Uses `RoguePixiPixelDrawing` for pixel blocks, lines, and shadow outlines
  - Covers charge/iron, hive/summon, and default arcane boss silhouettes with phase-based accents

- `src/render/BossTexturePresets.ts`
  - TypeScript mirror for boss sprite drawing presets
  - Uses shared pixel drawing helpers

## Updated

- `public/pixi-renderer.js`
  - Delegates boss sheet drawing to `RoguePixiBossTextures.drawBossSheetFrame`
  - Keeps the old inline drawing code as fallback

- `public/index.html`
  - Loads `/pixi-boss-textures.js` before texture keys and renderer setup

- `vite.config.ts`
  - Copies `pixi-boss-textures.js` into production build output

- `smoke-check.js`
  - Verifies the new bridge is served and contains expected boss preset markers

## Why

Boss texture generation has different sizing and phase logic from normal enemy sheets. Splitting it out keeps boss visuals independently owned before the renderer is broken into actor/enemy/boss renderer modules.

## Validation

- `node --check public/pixi-boss-textures.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
