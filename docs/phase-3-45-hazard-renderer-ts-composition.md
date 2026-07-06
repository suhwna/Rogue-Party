# Phase 3 Hazard Renderer TypeScript Composition

## Scope

This step completes the TypeScript hazard renderer mirror and routes the TypeScript world renderer through it.

## Updated

- `src/render/world/HazardRenderer.ts`
  - Adds `hazardSeed`
  - Adds beam, engineer, puppet, arrow rain, alchemy, meteor, and default hazard render helpers
  - Adds `renderHazard`
  - Adds `renderHazards`

- `src/render/world/WorldRenderer.ts`
  - Imports and calls `renderHazards`
  - Keeps runtime JS bridge behavior unchanged

## Why

Hazards are one of the busiest world-render sections. Giving the TypeScript mirror the same functional seams as `public/pixi-hazards.js` makes later ESM migration less risky and easier to test.

## Validation

- `npm run check`
- `npm run build`
