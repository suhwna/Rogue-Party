# Phase 11-4: Texture Fallback Policy

## Scope

- 외부 visual asset을 실제로 붙이기 전, texture key naming과 fallback 우선순위를 공식화했다.
- SFX/BGM/audio는 계속 제외하고, visual special effects와 sprite/icon/effect asset만 대상으로 유지한다.

## Changes

- `public/assets/asset-manifest.json`
  - `texturePolicy` 추가.
  - `textureKeyGuide` 추가.
  - `scope: "visual-only"`, `audio: false` 유지.

- `public/assets/asset-manifest.sample.json`
  - runtime에 적용되지 않는 예시 manifest 추가.
  - actor/enemy/boss/effect/icon texture replacement entry 예시 작성.

- `docs/assets-guide.md`
  - texture replacement priority 추가.
  - texture key naming guide 추가.
  - manifest entry shape 추가.
  - graphics quality priority 규칙 추가.
  - regression checklist 추가.

- `smoke-check.js`
  - manifest texture policy 확인 추가.
  - sample manifest의 texture key/alias 예시 확인 추가.

## Texture Priority

1. Manifest entry의 `textureKey`가 renderer texture key와 일치하면 외부 asset texture를 사용한다.
2. `aliases`에 renderer texture key가 있으면 같은 외부 asset texture를 사용한다.
3. descriptor가 없으면 기존 code-generated canvas texture를 사용한다.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 11 closeout: visual-only asset pipeline 범위를 마감하고 Phase 12 저장/설정 시스템 확장으로 이동한다.
