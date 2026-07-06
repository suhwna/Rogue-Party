# Phase 3 Actor Renderer TypeScript Composition

## Scope

This step routes the TypeScript actor renderer through dedicated enemy and player renderer mirrors.

## Updated

- `src/render/actors/PlayerRenderer.ts`
  - Adds `renderPlayerAttackEffect`
  - Adds `renderPlayer`
  - Adds `renderPlayers`
  - Mirrors the current runtime `public/pixi-players.js` player drawing behavior

- `src/render/actors/ActorRenderer.ts`
  - Imports and calls `renderEnemies`
  - Imports and calls `renderPlayers`

## Why

Actor rendering should be composed from enemy and player sections instead of depending on the monolithic renderer surface. This keeps Phase 3 moving toward a typed Pixi renderer split while preserving existing runtime behavior.

## Validation

- `npm run check`
- `npm run build`
