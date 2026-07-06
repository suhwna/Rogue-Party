# Phase 3 World Renderer TypeScript Composition

## Scope

This step moves the TypeScript world renderer mirror away from monolithic renderer method calls for dungeon and objective rendering.

## Updated

- `src/render/world/DungeonRenderer.ts`
  - Adds `renderDungeon`
  - Keeps `resolveChapter`, `chapterTheme`, and `renderObjective`
  - Mirrors the current runtime `public/pixi-world.js` dungeon drawing behavior

- `src/render/world/WorldRenderer.ts`
  - Imports `renderDungeon` and `renderObjective`
  - Calls the typed dungeon renderer functions directly
  - Leaves hazard, pickup, and projectile calls on existing renderer host boundaries for later typed composition

## Why

Phase 3 is not only about moving runtime bridge files. The TypeScript mirror also needs to express renderer ownership by section so later migration to ESM/TS does not depend on the monolithic `pixi-renderer.js` surface.

## Validation

- `npm run check`
- `npm run build`
