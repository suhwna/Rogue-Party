# Phase 8-3 Primary Class Particle Hooks

## Scope

Phase 8-3 applies the new particle preset path to the most visible primary-class combat moments.

## Runtime Changes

- Warrior cleave impact now routes through `slashTrail` before the legacy spark fallback.
- Warrior shield charge collision now routes through `hitSpark`.
- Warrior spin blade tip now routes through `slashTrail`.
- Warrior basic slash and wide cleave in `public/pixi-renderer.js` now use `slashTrail`.
- Ranger arrow rain landing sparks now route through `hitSpark`.
- Mage frost snap now adds a `frostBurst` preset layer.
- Mage meteor travel and ground impact now add `fireBurst` preset layers.
- Mage chain lightning and star burst impact sparks now route through `hitSpark`.

## Notes

- Server-authoritative hit logic is unchanged.
- Existing `drawGfxSparkSpray` calls remain as fallback paths where appropriate.
- Particle budget accounting remains centralized in `ParticleEngine.reserve`.

## Verification

- `npm run check`

