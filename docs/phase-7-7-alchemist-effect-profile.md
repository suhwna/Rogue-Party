# Phase 7-7 Alchemist Effect Profile

## Summary

- Phase 7 skill/effect quality work seventh slice.
- Alchemist effects now read as thrown flasks and chemical reactions instead of instant circles.
- Server hit logic and skill balance were not changed; this is a Pixi rendering quality pass.

## Changed Files

- `public/pixi-skill-effects.js`
  - `renderCrispAlchemistEffect`
    - Flask throws now interpolate from caster to target with a visible arc, afterimages, and landing burst.
    - Catalyst bombs use a separate golden detonation profile instead of sharing acid/fire visuals.
    - Acid pools now use bubbling splats, corrosive droplets, and short drip strokes.
    - Fire pools now use flame tongues, ember spray, and a hotter orange/yellow silhouette.
    - Combat elixir now uses healing mist droplets, plus-shaped medical flash, and a softer rune ring.

## Quality Standard

- Flask skills must feel thrown before they become ground effects.
- Acid, fire, bomb, and elixir visuals must be identifiable without reading UI text.
- The effect remains attached to the server-authoritative target/radius.
- Generic opaque circles are reduced in favor of readable chemical silhouettes.

## Verification

- `npm run check` passed.

## Next Step

- Phase 7-8 will improve Assassin effects.
- Focus: blade fan rhythm, mark readability, shadow lunge impact, and smoke clone identity.
