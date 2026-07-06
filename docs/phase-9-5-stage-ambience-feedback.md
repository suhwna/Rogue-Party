# Phase 9-5: Stage Ambience and Objective Feedback

## Scope

- Chapter profiles now carry a reusable `visualTone`.
- The server sends `room.chapterProfile.visualTone` in state payloads.
- Pixi world rendering uses the profile tone and stage kind to make rooms feel different before combat starts.

## Runtime Changes

- `src/data/stages.ts`
  - Added `ChapterStageProfile.visualTone`.
  - Chapter 1/2/3 now define base, side, torch, fog, scar, and rune colors.

- `server.js`
  - Runtime `CHAPTER_STAGE_PROFILES` now includes the same `visualTone`.
  - `chapterStageProfileView()` serializes `visualTone` to clients.

- `public/pixi-world.js`
  - `chapterTheme()` now prefers `room.chapterProfile.visualTone`.
  - Added stage ambience rendering for:
    - `blockade`: left danger gate, runner lanes, directional runner arrows.
    - `defense`: protected ward platform, shield hex, rotating heal markers.
    - `reward`: three gold pedestals and treasure room glow.
    - `boss` / `miniboss`: large danger sigil and chapter-colored arena aura.
    - `elite`: stronger route mark and elite floor glyphs.
    - wave traits: ritual/heal, volatile/fire, bulwark/shield floor accents.
  - `renderObjective()` now skips non-positional objectives instead of drawing at invalid coordinates.
  - Defense and blockade objectives have specialized visuals instead of generic chest rendering.

- `smoke-check.js`
  - Verifies the new Pixi world ambience functions are delivered.
  - Verifies combat state includes `room.chapterProfile.visualTone`.

## Notes

- This is still a runtime-compatible patch, not a full StageRenderer rewrite.
- Audio/SFX/BGM work remains excluded; only visual special effects are included.
- The next Phase 9 pass should focus on boss/miniboss pattern uniqueness and final Phase 9 closeout checks.

## Verification

- `npm run check`
- `npm run build`
- `npm test`
