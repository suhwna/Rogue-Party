# Phase 3 Effect Renderer TypeScript Composition

## Scope

This step adds a TypeScript-level floating effect renderer composition and routes `EffectRenderer.ts` through it.

## Updated

- `src/render/effects/FloatingEffectRenderer.ts`
  - Adds `color` and `style` fields to `FloatingEffectView`
  - Adds optional diagnostics, quality preset, and styled skill hook to `FloatingEffectRendererHost`
  - Adds `renderFloatingEffect`
  - Adds `renderFloatingEffects`
  - Applies effect budget through `effectStartIndex`

- `src/render/effects/EffectRenderer.ts`
  - Imports and calls `renderFloatingEffects`

## Render Priority

The TypeScript mirror uses the same high-level priority as the monolithic runtime renderer:

1. Floating text
2. Styled skill effect hook
3. Core skill effects
4. Secondary effects
5. Default burst fallback

## Validation

- `npm run check`
- `npm run build`
