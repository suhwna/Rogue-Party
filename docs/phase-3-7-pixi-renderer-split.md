# Phase 3 7차: Pixi enemy renderer 본문 분리 기록

## 완료 범위

- `public/pixi-enemies.js` 추가
- `renderEnemies` 본문을 `RoguePixiEnemies.renderEnemies`로 이동
- enemy 렌더 helper 분리
  - `enemyFrame`
  - `enemyFace`
  - `enemyTextureKey`
  - `enemyScale`
  - `renderEnemy`
- `public/pixi-renderer.js`의 기존 `renderEnemies`는 enemy bridge 우선 위임, fallback 유지
- TypeScript 기준 enemy renderer 계약 추가
  - `src/render/actors/EnemyRenderer.ts`
- Vite legacy asset 목록에 `pixi-enemies.js` 추가
- smoke-check에 `pixi-enemies.js` 배포/API 검증 추가

## 유지한 범위

- 기존 일반몹/보스 텍스처 키 계산 유지
- 기존 facing, windup 흔들림, freeze/barrier ring, elite crown, HP bar 표현 유지
- 기존 위치 보간 map과 `lastEnemyPositions` 사용 방식 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지

## 다음 단계

- Phase 3 8차에서 `renderPlayers`를 actor renderer로 분리한다.
- 플레이어는 직업별 평타 이펙트 분기가 많으므로 helper를 세분화하면서 이동한다.

## 회귀 체크

- `/pixi-enemies.js`가 200으로 응답한다.
- `RoguePixiEnemies.renderEnemies`가 노출된다.
- 일반몹, 보스, 엘리트, 빙결/배리어 표시와 체력바가 기존처럼 렌더링된다.
