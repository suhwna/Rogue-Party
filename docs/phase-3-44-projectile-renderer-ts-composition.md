# Phase 3 Projectile Renderer TypeScript Composition

## Scope

This step completes the TypeScript projectile renderer mirror and routes the TypeScript world renderer through it.

## Updated

- `src/render/world/ProjectileRenderer.ts`
  - Adds `renderProjectile`
  - Adds `renderProjectiles`
  - Mirrors thread trails, flask drops, splash rings, tint, blend mode, rotation, and z-index behavior from `public/pixi-projectiles.js`

- `src/render/world/WorldRenderer.ts`
  - Imports and calls `renderProjectiles`
  - Keeps runtime JS bridge behavior unchanged

## Why

Projectile rendering is a distinct world renderer section. Giving the TypeScript mirror a complete renderer function reduces future migration risk when the legacy Pixi renderer is replaced by ESM modules.

## Validation

- `npm run check`
- `npm run build`
