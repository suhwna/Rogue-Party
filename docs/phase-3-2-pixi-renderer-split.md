# Phase 3 2차: Pixi 렌더러 경계 분리 기록

## 완료 범위

- `public/pixi-runtime.js` 확장
  - `createTextureRegistry`
  - `createLayer`
  - `createLayerSet`
  - `clearLayerSet`
  - `effectStartIndex`
- `public/pixi-renderer.js`가 texture registry를 우선 사용하도록 변경
- `public/pixi-renderer.js`가 world/screen layer set 생성을 runtime factory 경유로 처리하도록 변경
- `public/pixi-renderer.js`의 layer clear와 effect budget window 계산을 runtime helper 경유로 변경
- TypeScript 기준 렌더 모듈 추가
  - `src/render/TextureRegistry.ts`
  - `src/render/LayerFactory.ts`
  - `src/render/effects/EffectBudget.ts`
- smoke-check에 Pixi runtime 확장 API 검증 추가

## 유지한 범위

- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 texture draw callback과 픽셀아트 드로잉 로직 유지
- 기존 actor/enemy/player/projectile/hazard/effect 렌더링 본문 유지
- 기존 fallback `Map`, `makeLayer`, local clear 로직 유지

## 다음 단계

- Phase 3 3차에서 actor/world/effect renderer wrapper를 더 분리한다.
- `renderDungeon`, `renderHazards`, `renderProjectiles`, `renderEnemies`, `renderPlayers`, `renderFloatingEffects`를 독립 renderer 단위로 이동할 수 있게 context 계약을 만든다.

## 회귀 체크

- `/pixi-runtime.js`가 texture registry, layer factory, effect budget helper를 노출한다.
- Pixi canvas가 기존처럼 생성된다.
- 지도/전투/이펙트가 기존처럼 렌더링된다.
- effect budget으로 오래된 effect가 잘려도 프레임이 유지된다.
