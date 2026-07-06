# Phase 3 8차: Pixi player renderer 본문 분리 기록

## 완료 범위

- `public/pixi-players.js` 추가
- `renderPlayers` 본문을 `RoguePixiPlayers.renderPlayers`로 이동
- player 렌더 helper 분리
  - `playerFace`
  - `playerMoving`
  - `playerFrame`
  - `playerScale`
  - `renderPlayerAttackEffect`
  - `renderPlayer`
- `public/pixi-renderer.js`의 기존 `renderPlayers`는 player bridge 우선 위임, fallback 유지
- TypeScript 기준 player renderer 계약 추가
  - `src/render/actors/PlayerRenderer.ts`
- Vite legacy asset 목록에 `pixi-players.js` 추가
- smoke-check에 `pixi-players.js` 배포/API 검증 추가

## 유지한 범위

- 기존 플레이어 그림자, 이동 잔상, self scale, bob, HP/shield bar 표현 유지
- 기존 직업별 평타 이펙트 유지
- 기존 `actorTextureKey`, `drawGfxSword`, `fx`, `ring`, `bar` 호출 방식 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지

## 다음 단계

- Phase 3 9차에서 `renderFloatingEffects`를 effect renderer로 분리한다.
- effect 본문은 크고 스킬별 분기가 많으므로 damage text/basic effect wrapper부터 분리하는 방식이 안전하다.

## 회귀 체크

- `/pixi-players.js`가 200으로 응답한다.
- `RoguePixiPlayers.renderPlayers`가 노출된다.
- 전사/궁수/마법사/기계공/인형사/무투가/연금술사/암살자 평타 이펙트가 기존처럼 렌더링된다.
