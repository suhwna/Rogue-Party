# Phase 3 Pickup Renderer Split

## Scope

This step extracts XP orb and relic chest rendering from the monolithic Pixi renderer into a dedicated pickup renderer bridge.

## Added

- `public/pixi-pickups.js`
  - Exposes `window.RoguePixiPickups`
  - Owns `xpOrbBob`
  - Owns `xpOrbScale`
  - Owns `relicChestScale`
  - Owns `renderXpOrb`
  - Owns `renderRelicChest`
  - Owns `renderPickups`

- `src/render/world/PickupRenderer.ts`
  - TypeScript mirror for pickup render calculations and draw orchestration

## Updated

- `public/pixi-renderer.js`
  - Delegates `renderPickups` to `RoguePixiPickups.renderPickups`
  - Keeps legacy inline fallback

- `public/index.html`
  - Loads `/pixi-pickups.js` before projectile rendering scripts

- `vite.config.ts`
  - Copies `pixi-pickups.js` into production build output

- `smoke-check.js`
  - Verifies pickup renderer bridge delivery and expected helpers

## Why

Pickups are an independent world render section. Splitting them from `pixi-renderer.js` reduces renderer surface area and completes another Phase 3 world renderer boundary.

## Validation

- `node --check public/pixi-pickups.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
