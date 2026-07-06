# Phase 9-6: Boss Signature Pattern Hooks

## Scope

- Boss and miniboss special pattern selection is now profile-driven.
- This does not add a large new boss pattern library yet.
- It creates the hook needed to keep future boss/miniboss patterns distinct without hardcoding modulo cycles everywhere.

## Runtime Changes

- `src/data/bosses.ts`
  - Added `BossProfile.signaturePatterns`.
  - Chapter bosses now declare named pattern keys:
    - `iron_warden`: `iron_cross_shock`, `iron_beam_fan`, `iron_ground_break`
    - `hive_prophet`: `hive_bloom_adds`, `hive_acid_ring`, `hive_ritual_cross`
    - `void_regent`: `void_reposition_snipe`, `void_cross_laser`, `void_orb_ring`
  - Minibosses now declare named pattern keys:
    - `blade_duelist`: `duelist_cross`, `duelist_charge`, `duelist_cleave`
    - `plague_acolyte`: `plague_pool`, `plague_spit_ring`, `plague_barrier_burst`
    - `void_hunter`: `hunter_shadow_stab`, `hunter_shuriken_fan`, `hunter_snipe`

- `server-boss-system.js`
  - Added `getSignaturePatterns(profile, fallbackPatterns)`.
  - Added `nextBossPattern(enemy, profile, fallbackPatterns)`.
  - `bossProfileView()` now serializes `signaturePatterns`.

- `server.js`
  - Added matching runtime `signaturePatterns` to boss/miniboss profiles.
  - Replaced direct `bossCycle % n` special pattern choice in chapter bosses and minibosses with `nextBossPattern(...)`.
  - Existing pattern effects are retained; pattern selection is now data-addressable.

- `server-state-serializer.js`
  - Enemy state now includes `currentBossPattern`.

- `src/server/systems/BossSystem.ts`
  - Added TypeScript contracts and helpers for signature pattern selection.

- `src/server/StateSerializer.ts`
  - Added `currentBossPattern` to enemy view contract.

## Notes

- The next Phase 9 step should be a closeout pass: check chapter progression, boss room exclusivity, miniboss identity, objective room feedback, and smoke coverage.
- After Phase 9 closeout, proceed to Phase 10 UI/UX modernization.

## Verification

- `npm run check`
- `npm run build`
- `npm test`
