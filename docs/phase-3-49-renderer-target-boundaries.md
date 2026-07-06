# Phase 3 Renderer Target Boundaries

## Scope

This step adds the missing TypeScript boundary files from the Phase 3 target structure without changing the legacy runtime path.

## Added

- `src/render/PixiGameRenderer.ts`
  - Defines renderer options
  - Defines renderer diagnostics
  - Defines runtime renderer state
  - Provides quality normalization and quality switching helpers

- `src/render/world/StageRenderer.ts`
  - Exposes dungeon rendering through a stage-oriented boundary
  - Re-exports stage world/objective types

- `src/render/actors/BossRenderer.ts`
  - Adds `BossView`
  - Adds boss type guard
  - Adds boss texture info helper
  - Adds `renderBoss` and `renderBosses`

## Updated

- `src/main.ts`
  - Marks Phase 3 as an active modernization phase in Vite runtime metadata

## Why

The renderer split needs stable TypeScript boundaries before the legacy Pixi renderer can be safely moved into ESM modules. These files are thin by design: they establish ownership without creating a second runtime implementation.

## Validation

- `npm run check`
- `npm run build`
