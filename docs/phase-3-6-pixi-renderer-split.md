# Phase 3 6차: Pixi hazard renderer 본문 분리 기록

## 완료 범위

- `public/pixi-hazards.js` 추가
- `renderHazards` 본문을 `RoguePixiHazards.renderHazards`로 이동
- hazard 분기 helper 분리
  - beam
  - engineer turret/drone/mine
  - puppet
  - arrow rain
  - alchemy bomb/pool/elixir mist
  - meteor
  - default poison/fire/heal/shield warning
- `public/pixi-renderer.js`의 기존 `renderHazards`는 hazard bridge 우선 위임, fallback 유지
- TypeScript 기준 hazard renderer 계약 추가
  - `src/render/world/HazardRenderer.ts`
- Vite legacy asset 목록에 `pixi-hazards.js` 추가
- smoke-check에 `pixi-hazards.js` 배포/API 검증 추가

## 유지한 범위

- 기존 hazard 색상, 크기, 회전, blend mode, zIndex 표현 유지
- 기존 hostile warning / non-hostile warning 표현 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 3 7차에서 `renderEnemies` 또는 `renderPlayers`를 actor renderer로 분리한다.
- actor 쪽은 위치 보간, facing, 체력바, 상태 링 의존성이 있으므로 enemy 먼저 분리하는 편이 안전하다.

## 회귀 체크

- `/pixi-hazards.js`가 200으로 응답한다.
- `RoguePixiHazards.renderHazards`가 노출된다.
- 터렛, 지뢰, 화살비, 운석, 독/화염/회복/보호 장판이 기존처럼 렌더링된다.
