# Phase 3-36: Pixi Actor Texture Preset Split

## Scope

Phase 3-36 continues the incremental Pixi renderer split from the full modernization plan.

This phase extracts player/class actor sprite-sheet drawing from `public/pixi-renderer.js` into a runtime bridge and a TypeScript mirror.

## Added

- `public/pixi-actor-textures.js`
  - Exposes `window.RoguePixiActorTextures`
  - Provides:
    - `drawActorSheetFrame`
  - Uses existing runtime bridges:
    - `RoguePixiPalettes`
    - `RoguePixiPixelDrawing`

- `src/render/ActorTexturePresets.ts`
  - TypeScript mirror for actor sprite-sheet frame drawing
  - Reuses:
    - `TexturePalettes`
    - `PixelDrawing`

## Updated

- `public/pixi-renderer.js`
  - Delegates `drawActorSheetFrame` to `RoguePixiActorTextures` when available
  - Keeps the inline fallback body for legacy runtime safety

- `public/index.html`
  - Loads `/pixi-actor-textures.js` before texture key and renderer scripts

- `vite.config.ts`
  - Copies `pixi-actor-textures.js` into production build output

- `smoke-check.js`
  - Verifies the actor texture bridge is served and contains expected class branches

## Notes

- Gameplay behavior is unchanged.
- Visual behavior should remain unchanged because the actor recipe was copied from the renderer fallback.
- Enemy and boss sprite-sheet drawing still live in `public/pixi-renderer.js`; those are candidates for the next phases.
