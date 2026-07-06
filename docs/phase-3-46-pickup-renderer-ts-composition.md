# Phase 3 Pickup Renderer TypeScript Composition

## Scope

This step routes the TypeScript world renderer through the dedicated pickup renderer mirror.

## Updated

- `src/render/world/WorldRenderer.ts`
  - Imports and calls `renderPickups`
  - Uses `PickupRendererHost` and `PickupSceneState`

## Current World Composition

`WorldRenderer.ts` now directly composes these typed renderer sections:

- `renderDungeon`
- `renderObjective`
- `renderHazards`
- `renderPickups`
- `renderProjectiles`

## Why

This removes another monolithic renderer dependency from the TypeScript mirror and brings the world render section closer to the target Phase 3 structure.

## Validation

- `npm run check`
- `npm run build`
