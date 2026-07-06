# Phase 8-4 Particle Budget Diagnostics

## Scope

Phase 8-4 turns particle budget handling into an explicit renderer quality setting and improves diagnostics.

## Runtime Changes

- Added `particleBudget` to renderer quality presets.
- Runtime budgets are now:
  - `low`: 110
  - `medium`: 180
  - `high`: 280
- `public/pixi-renderer.js` now uses `qualityPreset.particleBudget` instead of deriving particle budget from `effectBudget * 0.62`.
- Renderer diagnostics now expose:
  - `particleBudget`
  - `particles.used`
  - `particles.skipped`
  - `particles.budget`
  - `particles.pressure`
- `public/pixi-particles.js` and TS particle modules now use matching default budgets.
- `smoke-check.js` validates that particle budget and pressure diagnostics are shipped.

## Notes

- Gameplay logic and server-authoritative combat are unchanged.
- This phase prepares later effect-heavy passes by making particle saturation visible.
- High quality now has a larger explicit particle budget because the current project direction prioritizes graphics quality.

## Verification

- `npm run check`

