# Phase 8-1 Particle Engine Foundation

## Summary

- Started Phase 8 particle engine work with a small reusable Pixi particle preset boundary.
- Added a browser runtime particle bridge and matching TypeScript reference modules.
- Connected common impact/explosion/death fallback effects to the new preset engine.

## Changed Files

- `public/pixi-particles.js`
  - Added `ParticleEngine`.
  - Added `PARTICLE_PRESETS`.
  - Added quality-aware per-frame particle budget.
  - Added preset renderers for hit sparks, fire burst, poison burst, frost burst, heal mist, smoke puff, and slash-style spark trails.

- `public/pixi-renderer.js`
  - Loads `RoguePixiParticles`.
  - Creates a `particleEngine` per renderer instance.
  - Resets the particle budget every frame.
  - Exposes `diagnostics.particles`.
  - Routes `impact`, `explosion`, and `death` fallback effects through particle presets.

- `public/index.html`
  - Loads `/pixi-particles.js` before `/pixi-renderer.js`.

- `src/render/particles/*`
  - Added TypeScript reference modules for particle stats, presets, pool budget, and engine boundaries.

- `src/render/PixiGameRenderer.ts`
  - Added `particles` to renderer diagnostics.

- `package.json`
  - Added `public/pixi-particles.js` to `npm run check`.

- `smoke-check.js`
  - Added Pixi particle bridge deployment checks.

## Boundaries

- This is a foundation slice, not a full rewrite of every skill effect.
- Existing skill-specific Pixi drawing remains in place.
- Particle rendering uses the existing graphics primitives and frame budget instead of new dependencies.
- Sound/BGM is intentionally out of scope.

## Verification

- `npm run check` passed.

## Next Step

- Phase 8-2 should migrate repeated spark/fire/poison/heal calls from skill-specific renderers into particle presets.
- Priority targets: warrior hit sparks, alchemist fire/acid splashes, mage meteor/fire field, ranger arrow rain impacts.
