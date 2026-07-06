# Phase 3 4차: Pixi world renderer 본문 분리 기록

## 완료 범위

- `public/pixi-world.js` 추가
- `renderDungeon` 본문을 `RoguePixiWorld.renderDungeon`으로 이동
- `renderObjective` 본문을 `RoguePixiWorld.renderObjective`로 이동
- `public/pixi-renderer.js`의 기존 메서드는 world bridge 우선 위임, fallback 유지
- TypeScript 기준 world renderer 계약 추가
  - `src/render/world/DungeonRenderer.ts`
- Vite legacy asset 목록에 `pixi-world.js` 추가
- smoke-check에 `pixi-world.js` 배포/API 검증 추가

## 유지한 범위

- 기존 `renderDungeon`/`renderObjective` fallback 본문 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 tile, wall, torch, chapter theme, objective HP bar 표현 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 3 5차에서 `renderHazards` 또는 `renderProjectiles` 중 하나를 별도 renderer로 이동한다.
- hazard는 본문이 크므로 먼저 helper 단위로 나누고, projectile은 비교적 작아 실제 이동 난도가 낮다.

## 회귀 체크

- `/pixi-world.js`가 200으로 응답한다.
- `RoguePixiWorld.renderDungeon`과 `RoguePixiWorld.renderObjective`가 노출된다.
- 챕터별 바닥/벽/횃불/장식과 지키기 objective 체력바가 기존처럼 표시된다.
