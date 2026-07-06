# Phase 3 Pool Closeout

## Scope

This step promotes Pixi object pools into a dedicated browser bridge while preserving the legacy runtime pool factories as fallback.

## Added

- `public/pixi-pools.js`
  - Exposes `window.RoguePixiPools`
  - Owns `SpritePool`
  - Owns `TextPool`
  - Owns `GraphicsPool`
  - Exposes `createSpritePool`, `createTextPool`, and `createGraphicsPool`

## Updated

- `public/pixi-renderer.js`
  - Uses `RoguePixiPools` before falling back to `RoguePixiRuntime`

- `public/index.html`
  - Loads `/pixi-pools.js` after `/pixi-texture-factory.js`

- `vite.config.ts`
  - Copies `pixi-pools.js` into production build output

- `smoke-check.js`
  - Verifies the pool bridge is served and contains expected pool factories

## Why

Object pooling is a core Phase 3 requirement because it protects frame time and memory during long combat sessions. Moving it behind a dedicated bridge makes the renderer thinner and aligns the browser runtime with the existing TypeScript pool classes.

## Validation

- `node --check public/pixi-pools.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
