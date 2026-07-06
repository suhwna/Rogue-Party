# Phase 8-2 Particle Preset Adoption

## Summary

- Continued Phase 8 by routing repeated spark-style drawing through the particle budget.
- The goal was to improve effect density control without rewriting every skill-specific renderer at once.

## Changed Files

- `public/pixi-renderer.js`
  - `drawGfxSparkSpray` now reserves particle budget before drawing sparks.
  - This brings many existing warrior, ranger, mage, engineer, puppeteer, martialist, alchemist, and assassin spark calls under the same budget.

- `public/pixi-skill-effects.js`
  - Alchemist bomb spark uses `hitSpark` preset when available.
  - Alchemist fire reaction uses `fireBurst` preset when available.
  - Alchemist acid reaction uses `poisonBurst` preset when available.
  - Alchemist elixir mist uses `healMist` preset when available.

## Boundaries

- No gameplay balance changed.
- No server state changed.
- No dependency added.
- Existing hand-authored skill silhouettes remain in place.
- This step focuses on particle density and preset reuse, not full effect redesign.

## Verification

- `npm run check` passed.

## Next Step

- Phase 8-3 should add more preset hooks for mage meteor/fire field, warrior cleave impacts, ranger arrow rain impacts, and generic frost/lightning bursts.
