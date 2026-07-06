# Phase 9 Summary: Stage, Chapter, and Boss Modernization

## Completed

- Chapter stage profiles
  - Added chapter metadata for combat focus, pressure, special enemy budget, boss telegraph bias, and visual tone.
  - State payload now exposes `room.chapterProfile`.

- Runtime chapter hooks
  - `stagePressureMul` affects stage spawn pressure.
  - `specialEnemyBudget` affects basic/special enemy ratio and elite chance.
  - `bossTelegraphBias` and boss profile telegraph values affect boss/miniboss tells.

- Boss and miniboss profile metadata
  - Chapter bosses and minibosses now carry role, pattern tags, phase titles, telegraph timings, pattern mix, and signature pattern keys.
  - Stage map boss nodes expose boss profile data, including `signaturePatterns`.

- Boss pattern cadence
  - Boss special pattern gating now uses a shared pattern mix gate instead of independent channel gates.
  - This reduces frequent strong-pattern stacking.

- Boss phase feedback
  - Boss phase transitions now expose phase title, transition timer, and aura color.
  - Pixi enemy rendering shows boss phase aura/flare during transitions.

- Stage ambience
  - Pixi world rendering uses chapter visual tone.
  - Blockade, defense, reward, elite, miniboss, and boss rooms now have distinct floor/objective ambience.
  - Non-positional objectives no longer render at invalid coordinates.

- Boss pattern hooks
  - Boss/miniboss special pattern choice now consumes `signaturePatterns` through `nextBossPattern(...)`.
  - Enemy state exposes `currentBossPattern`.

## Verification Coverage

- `npm run check`
  - JS syntax checks.
  - TypeScript `tsc --noEmit`.

- `npm run build`
  - Vite production build.
  - Existing legacy script warnings are expected until later ESM migration phases.

- `npm test`
  - HTTP delivery.
  - WebSocket join/lobby/start/map/combat smoke.
  - Map vote.
  - Bot flow.
  - Spectator/bot-only flow.
  - `room.chapterProfile.visualTone`.
  - Stage map boss `signaturePatterns`.

## Remaining Risk

- Current smoke does not simulate a full 3-chapter clear.
- Boss combat is smoke-checked structurally, not playtested for difficulty feel.
- Pattern hook exists, but larger bespoke pattern libraries are still future gameplay content.
- UI/HUD still belongs to Phase 10 and may need layout cleanup after the stage/boss changes.

## Next Phase

- Proceed to Phase 10: UI/UX modernization.
- First targets:
  - Title/main/lobby flow cleanup.
  - HUD hierarchy cleanup.
  - Map vote and reward/skill choice modal polish.
  - Result screen and settings surface review.
