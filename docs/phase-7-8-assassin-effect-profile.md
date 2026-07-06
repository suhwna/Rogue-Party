# Phase 7-8 Assassin Effect Profile

## Summary

- Phase 7 skill/effect quality work eighth slice.
- Assassin effects now separate blade fan, shadow lunge, mark chain, shuriken echo, and smoke clone visuals.
- Server hit logic and balance were not changed; this is a Pixi rendering quality pass.

## Changed Files

- `public/pixi-skill-effects.js`
  - `renderCrispAssassinEffect`
    - Blade fan and slash effects now render multiple directional blade strokes instead of falling through to an empty branch.
    - Shadow lunge uses a readable dash lane, afterimage slashes, endpoint arc, and impact burst.
    - Smoke bomb uses darker smoke pockets plus clone silhouettes and small blade arcs.
    - Mark chain renders a jagged shadow link with mark stars at both ends.
    - Mark, shuriken, and echo impacts now have separate star/rune/projection language.

## Quality Standard

- Assassin attacks must feel like fast blades, not generic purple circles.
- Mark, lunge, smoke, and shuriken effects must be distinguishable at combat speed.
- Effect location stays attached to server-authoritative effect coordinates and endpoints.
- Enemy stalker/shadow styles continue to receive readable fallback visuals through the same renderer.

## Verification

- `npm run check` passed.

## Next Step

- Close Phase 7 with a summary document.
- Then proceed to Phase 8 particle engine work according to `docs/full-modernization-plan.md`.
