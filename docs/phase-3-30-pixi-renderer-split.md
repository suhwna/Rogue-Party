# Phase 3-30: Pixi Common Texture Presets

## Goal

Move reusable non-class texture drawing presets out of `public/pixi-renderer.js`.

This phase only touches static/common texture drawing. It does not change combat logic, skill logic, server state, or texture keys.

## Changes

- Added `public/pixi-common-textures.js`
  - Exposes `window.RoguePixiCommonTextures`
  - Provides drawing presets for:
    - `drawShadow`
    - `drawReticle`
    - `drawXpOrb`
    - `drawChest`
    - `drawWarningRing`
    - `drawSlashArc`
    - `drawBurst`
    - `drawBeam`
- Added `src/render/CommonTexturePresets.ts`
  - TypeScript reference implementation for the same common presets
  - Intended for later `TextureFactory` migration
- Updated `public/pixi-renderer.js`
  - Uses the common texture bridge when available
  - Keeps the previous inline fallback drawing code
- Updated `public/index.html`
  - Loads `pixi-common-textures.js` before `pixi-skill-effects.js`
- Updated `vite.config.ts`
  - Includes the new legacy runtime asset in production builds
- Updated `smoke-check.js`
  - Verifies that `pixi-common-textures.js` is served and exposes the expected functions

## Completion Criteria

- `pixi-common-textures.js` is served by the existing Node server.
- Vite build emits `dist/pixi-common-textures.js`.
- Renderer uses the bridge while retaining fallback behavior.
- Smoke tests detect missing common texture bridge assets.

## Next Candidate

- Split effect texture presets by category:
  - warrior/melee effect textures
  - ranger projectile textures
  - mage elemental textures
  - generic warning/impact textures
