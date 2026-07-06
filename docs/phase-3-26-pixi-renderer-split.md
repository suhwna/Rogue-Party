# Phase 3-26: Pixi 공통 Primitive 좌표 계산 분리

## 완료 범위

- `public/pixi-primitives.js`를 추가해 공통 그래픽 좌표 계산을 분리했다.
- `public/pixi-renderer.js`의 다음 helper가 `RoguePixiPrimitives`를 사용하도록 연결했다.
  - `drawGfxCircle`
  - `drawGfxArc`
  - `drawGfxCone`
  - `drawGfxCleaveRibbon`
  - `drawGfxCapsule`
  - `drawGfxLightning`
  - `drawGfxStar`
  - `drawGfxDiamond`
  - `drawGfxGear`
- `src/render/effects/PixiPrimitives.ts`를 추가해 같은 계약의 TypeScript 참조 구현을 마련했다.
- `public/index.html`, `vite.config.ts`, `smoke-check.js`에 새 브릿지 파일을 연결했다.

## 유지한 계약

- Pixi `Graphics`, pool, zIndex, blendMode 적용은 기존 renderer 메서드가 계속 담당한다.
- 서버 상태, 전투 판정, 스킬 이벤트 포맷은 변경하지 않았다.
- 기존 legacy script 로딩 구조와 Vite build 병행 구조를 유지했다.

## 다음 단계 후보

- Phase 3-27에서 texture factory 후보를 더 분리하거나, 전사 전용 근접 helper를 별도 effect renderer boundary로 이동한다.
- Phase 4 전환 전 `public/pixi-renderer.js`에 남은 데이터성 팔레트/texture 생성 책임을 추려낸다.
