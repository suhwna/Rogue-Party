# Phase 3-31: Pixi Melee Texture Presets

## Goal

Move warrior/melee `fx-*` texture drawing presets out of `public/pixi-renderer.js`.

This phase only splits texture drawing callbacks. It does not change skill rendering behavior, combat logic, hit detection, cooldowns, or server state.

## Changes

- Added `public/pixi-melee-textures.js`
  - Exposes `window.RoguePixiMeleeTextures`
  - Provides drawing presets for:
    - `drawSwordCut`
    - `drawCleave`
    - `drawWarriorCone`
    - `drawWarriorCleaveCone`
    - `drawWarriorBlade`
    - `drawWarriorSpinBlade`
    - `drawChargeLane`
    - `drawSpin`
    - `drawImpactStar`
    - `drawShieldWedge`
    - `drawTauntBurst`
- Added `src/render/MeleeTexturePresets.ts`
  - TypeScript reference implementation for later `TextureFactory` migration
- Updated `public/pixi-renderer.js`
  - Uses `RoguePixiMeleeTextures` when available
  - Keeps all previous inline drawing code as fallback
- Updated `public/index.html`
  - Loads `pixi-melee-textures.js` before `pixi-skill-effects.js`
- Updated `vite.config.ts`
  - Includes the new legacy runtime asset in production builds
- Updated `smoke-check.js`
  - Verifies that the melee texture bridge is served and exposes expected functions

## Completion Criteria

- `pixi-melee-textures.js` is served by the existing Node server.
- Vite build emits `dist/pixi-melee-textures.js`.
- Renderer uses the bridge while retaining fallback behavior.
- Smoke tests detect missing melee texture bridge assets.

## Next Candidate

- Split ranger/projectile effect texture presets:
  - `fx-arrow-streak`
  - `fx-arrow-fan`
  - `fx-arrow-rain`
  - `fx-pierce-lance`
- Then split elemental/magic texture presets.
