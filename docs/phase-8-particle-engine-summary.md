# Phase 8 Particle Engine Summary

## Completed Scope

Phase 8 introduced a shared particle preset layer for Pixi-based combat effects.

Completed work:

- Added `public/pixi-particles.js`.
- Added TypeScript reference modules under `src/render/particles/`.
- Connected `RoguePixiParticles` to `public/pixi-renderer.js`.
- Added centralized particle budget accounting through `ParticleEngine.reserve`.
- Added renderer diagnostics for particle usage, skipped particles, budget, and pressure.
- Added explicit `particleBudget` values to renderer quality presets.
- Adopted particle presets for:
  - generic impact/explosion/death fallback effects
  - warrior slash/cleave/spin/shield/taunt highlights
  - ranger arrow rain impacts
  - mage frost, meteor, lightning, star effects
  - alchemist fire/acid/heal/bomb effects
  - engineer device sparks
  - puppeteer smoke/materialization effects
  - assassin slash trails
  - common warning and impact effects
- Expanded smoke checks so the particle bridge and preset names are verified.

## Runtime Contract

`window.RoguePixiParticles` exposes:

- `PARTICLE_PRESETS`
- `ParticleEngine`
- `createParticleEngine(options)`

`RoguePixiRenderer` exposes:

- `renderParticlePreset(preset, options)`
- `diagnostics.particleBudget`
- `diagnostics.particles.used`
- `diagnostics.particles.skipped`
- `diagnostics.particles.budget`
- `diagnostics.particles.pressure`

## Quality Budgets

Current particle budgets:

```txt
low: 110
medium: 180
high: 280
```

The current direction prioritizes graphics quality, so high quality allows a larger visual budget while still preventing unbounded particle growth.

## Presets

Current presets:

- `hitSpark`
- `slashTrail`
- `fireBurst`
- `poisonBurst`
- `frostBurst`
- `healMist`
- `smokePuff`

## Deferred Work

Phase 9 can reuse this system for:

- boss pattern telegraphs
- boss phase transitions
- chapter-specific stage ambience
- reward room effects
- defense/blocking stage objective feedback

## Verification

Latest Phase 8 verification:

- `npm run check`
- `npm run build`
- `SMOKE_ORIGIN=http://localhost:5211 npm test`

