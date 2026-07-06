# Phase 3 Camera Closeout

## Scope

This step extracts scene camera positioning, screen shake, floating-effect lookup, and self hit iframe lookup into a dedicated renderer bridge.

## Added

- `public/pixi-camera.js`
  - Exposes `window.RoguePixiCamera`
  - Owns `createCameraContext`
  - Owns `applyCamera`
  - Owns `resetCamera`

- `src/render/CameraRenderer.ts`
  - TypeScript mirror for camera context and camera application helpers

## Updated

- `public/pixi-scene.js`
  - Uses `RoguePixiCamera` when available
  - Keeps previous inline camera fallback

- `src/render/PixiGameSceneRenderer.ts`
  - Imports `applyCamera` from `CameraRenderer`

- `src/render/world/WorldRenderer.ts`
  - Keeps only world-section rendering

- `public/index.html`
  - Loads `/pixi-camera.js` before `/pixi-scene.js`

- `vite.config.ts`
  - Copies `pixi-camera.js` into production build output

- `smoke-check.js`
  - Verifies camera bridge delivery and scene integration

## Why

Camera application is part of the renderer orchestration layer, not world rendering. Splitting it out makes scene composition cleaner and moves Phase 3 closer to a thin `PixiGameRenderer` shell.

## Validation

- `node --check public/pixi-camera.js`
- `npm run check`
- `npm run build`
- `npm test` with `SMOKE_ORIGIN=http://localhost:5211`
