# Phase 3 Texture Factory Closeout

## Scope

This step promotes texture creation and caching into a dedicated browser bridge while keeping the old runtime functions as compatibility fallback.

## Added

- `public/pixi-texture-factory.js`
  - Exposes `window.RoguePixiTextureFactory`
  - Owns `createCanvasTexture`
  - Owns `createTextureRegistry`
  - Owns `getOrCreateCanvasTexture`

## Updated

- `src/render/TextureFactory.ts`
  - Adds `getOrCreateCanvasTexture`
  - Adds `createTextureFactory`
  - Uses the existing `TextureRegistry` contract

- `public/pixi-renderer.js`
  - Uses `RoguePixiTextureFactory` before falling back to `RoguePixiRuntime`
  - Keeps legacy code paths intact

- `public/index.html`
  - Loads `/pixi-texture-factory.js` after `/pixi-runtime.js`

- `vite.config.ts`
  - Copies `pixi-texture-factory.js` into production build output

- `smoke-check.js`
  - Verifies the texture factory bridge is served and exports expected helpers

## Why

Texture generation is one of the final core responsibilities still owned directly by `pixi-renderer.js`. This bridge makes texture creation/caching independently testable and prepares the renderer to become a thinner orchestrator.

## Validation

- `node --check public/pixi-texture-factory.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
