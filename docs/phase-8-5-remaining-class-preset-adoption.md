# Phase 8-5 Remaining Class Preset Adoption

## Scope

Phase 8-5 routes remaining high-level class/common spark effects through particle presets.

## Runtime Changes

- Warrior taunt shout sparks now use `hitSpark`.
- Legacy alchemist throw trails now use `fireBurst`, `healMist`, or `poisonBurst` by mode.
- Common warning spark points now use `hitSpark`.
- Common impact/death/explosion sparks now use `fireBurst`, `poisonBurst`, or `hitSpark` by damage style.
- Engineer turret/device muzzle sparks now use `hitSpark`.
- Crisp alchemist thrown flask trails now use `fireBurst`, `poisonBurst`, or `hitSpark`.
- Puppeteer swap/materialize sparks now use `smokePuff`.
- Assassin slash/fan endpoint sparks now use `slashTrail`.
- `smoke-check.js` now validates all particle preset names are shipped.

## Notes

- Existing `drawGfxSparkSpray` calls remain as fallback expressions.
- Low-level primitive helpers still keep direct spark drawing internally because they are fallback draw primitives.
- Combat logic and server state serialization are unchanged.

## Verification

- `npm run check`

