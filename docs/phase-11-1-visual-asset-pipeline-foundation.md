# Phase 11-1: Visual Asset Pipeline Foundation

## Scope

- Phase 11은 audio/SFX/BGM을 제외하고 visual asset pipeline만 다룬다.
- 이번 단위는 실제 이미지 생성 전, 배포 경로/규칙/manifest 기반을 만든다.

## Changes

- `public/assets/asset-manifest.json`
  - visual-only scope 명시.
  - audio `false` 명시.
  - sprites/icons/effects directory contract 추가.
  - Phase 11 특수효과 목록 추가.

- `public/assets/sprites/README.md`
  - character/enemy/boss/pickup sprite intake 규칙 추가.

- `public/assets/icons/README.md`
  - relic/skill/stage/status icon 규칙 추가.

- `public/assets/effects/README.md`
  - slash/spell/impact/boss-warning/elements effect 규칙 추가.

- `docs/assets-guide.md`
  - 공통 이미지 규칙.
  - character/enemy/boss/skill effect/icon prompt templates.
  - asset intake checklist.

- `smoke-check.js`
  - `/assets/asset-manifest.json` HTTP 배포와 visual-only contract 확인 추가.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 11-2: asset manifest loader/helper를 추가하고 Pixi texture registry가 외부 asset path를 받을 수 있는 계약을 만든다.
- Phase 11-3: 현재 코드 생성 texture와 외부 asset fallback의 우선순위를 정리한다.
