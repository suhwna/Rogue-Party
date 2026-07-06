# Phase 3 3차: Pixi 씬 렌더 경계 분리 기록

## 완료 범위

- `public/pixi-scene.js` 추가
- `RoguePixiScene.renderGameScene`으로 게임 씬 렌더 순서 분리
- `public/pixi-renderer.js`가 `RoguePixiScene`을 우선 사용하도록 변경
- 씬 렌더 섹션 분리
  - camera 적용
  - world sections
  - actor sections
  - effect sections
  - UI overlay sections
- TypeScript 기준 계약 추가
  - `src/render/PixiRenderContext.ts`
  - `src/render/PixiGameSceneRenderer.ts`
  - `src/render/world/WorldRenderer.ts`
  - `src/render/actors/ActorRenderer.ts`
  - `src/render/effects/EffectRenderer.ts`
- Vite legacy asset 목록에 `pixi-scene.js` 추가
- smoke-check에 `pixi-scene.js` 배포/API 검증 추가

## 유지한 범위

- 기존 `renderDungeon`, `renderHazards`, `renderProjectiles`, `renderEnemies`, `renderPlayers`, `renderFloatingEffects` 본문 유지
- 기존 fallback `renderGame` 본문 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 3 4차에서 `renderDungeon`과 stage/world drawing 책임을 별도 world renderer로 이동한다.
- 이후 `renderHazards`, `renderProjectiles`, `renderEnemies`, `renderPlayers`, `renderFloatingEffects`를 순서대로 파일 단위로 분리한다.

## 회귀 체크

- `/pixi-scene.js`가 200으로 응답한다.
- `RoguePixiScene.renderGameScene`이 씬 렌더 순서를 담당한다.
- Pixi canvas가 기존처럼 생성되고 전투/지도/이펙트가 기존처럼 렌더링된다.
