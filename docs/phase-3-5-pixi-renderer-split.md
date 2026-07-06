# Phase 3 5차: Pixi projectile renderer 본문 분리 기록

## 완료 범위

- `public/pixi-projectiles.js` 추가
- `renderProjectiles` 본문을 `RoguePixiProjectiles.renderProjectiles`로 이동
- 투사체 분류 helper 분리
  - `classifyProjectile`
  - `projectileSpriteKey`
  - `projectileScale`
  - `projectileTint`
- `public/pixi-renderer.js`의 기존 `renderProjectiles`는 projectile bridge 우선 위임, fallback 유지
- TypeScript 기준 projectile renderer 계약 추가
  - `src/render/world/ProjectileRenderer.ts`
- Vite legacy asset 목록에 `pixi-projectiles.js` 추가
- smoke-check에 `pixi-projectiles.js` 배포/API 검증 추가

## 유지한 범위

- 기존 투사체 색상, 크기, blend mode, trail/drop/splash 표현 유지
- 기존 `projectileTextureKey` fallback 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 3 6차에서 `renderHazards`를 분리한다.
- hazard는 조건 분기가 많으므로 turret/drone/mine/puppet/rain/flask/pool/heal/meteor/default helper로 먼저 나누는 방식이 안전하다.

## 회귀 체크

- `/pixi-projectiles.js`가 200으로 응답한다.
- `RoguePixiProjectiles.renderProjectiles`가 노출된다.
- 화살, 번개, 화염, 독, 실, 병, 그림자 투사체가 기존처럼 렌더링된다.
