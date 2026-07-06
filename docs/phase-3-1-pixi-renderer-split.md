# Phase 3 1차: Pixi 렌더러 책임 분리 기록

## 완료 범위

- `public/pixi-runtime.js` 추가
- Pixi 품질 프리셋, renderer preference, diagnostics seed, sprite/text/graphics pool, canvas texture 생성 책임을 런타임 브릿지로 분리
- `public/pixi-renderer.js`가 가능한 경우 `RoguePixiRuntime`을 우선 사용하도록 변경
- TypeScript 기준 렌더 모듈 추가
  - `src/render/RendererConfig.ts`
  - `src/render/TextureFactory.ts`
  - `src/render/pools/PoolTypes.ts`
  - `src/render/pools/SpritePool.ts`
  - `src/render/pools/TextPool.ts`
  - `src/render/pools/GraphicsPool.ts`
- Vite legacy asset 목록에 `pixi-runtime.js` 추가
- smoke-check에 `pixi-runtime.js` 배포/API 검증 추가

## 유지한 범위

- 기존 `public/pixi-renderer.js`의 렌더링 함수와 픽셀아트 드로잉 로직 유지
- 기존 pool 클래스는 fallback으로 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 3 2차에서 texture preparation과 actor/world/effect renderer 경계를 더 잘라낸다.
- 먼저 texture factory 사용 범위를 넓히고, 이후 actor/enemy/boss/projectile/effect 렌더링을 파일 단위로 이동한다.

## 회귀 체크

- `/pixi-runtime.js`가 200으로 응답한다.
- `/pixi-runtime.js`가 `RoguePixiRuntime`, `QUALITY_PRESETS`, pool factory, `createCanvasTexture`를 노출한다.
- Pixi canvas가 기존처럼 생성된다.
- quality 변경 시 effect budget과 pool retain 값이 기존처럼 유지된다.
