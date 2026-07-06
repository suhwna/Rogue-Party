# Phase 3 9차 Pixi effect renderer 기반 분리 기록

## 완료 범위

- `public/pixi-effects.js` 추가
- `renderFloatingEffects`의 공통 effect 계산을 `RoguePixiEffects`로 분리
  - `effectProgress`
  - `effectRadius`
  - `floatingTextStyle`
  - `floatingTextValue`
  - `isFloatingTextEffect`
  - `renderFloatingTextEffect`
- `public/pixi-renderer.js`는 새 effect bridge를 우선 사용하고 기존 본문은 fallback으로 유지
- TypeScript 기준 파일 추가
  - `src/render/effects/FloatingEffectRenderer.ts`
- Vite legacy asset 목록에 `pixi-effects.js` 추가
- smoke-check에 `/pixi-effects.js` 배포/API 검증 추가

## 유지한 범위

- 기존 스킬/폭발/경고/피격 이펙트 본문은 아직 `public/pixi-renderer.js`에 남김
- damage/heal/xp/poison value 텍스트 출력 결과는 기존과 동일하게 유지
- 기존 `renderStyledSkillEffect` 호출 순서 유지
- 기존 `RoguePixiRenderer.create(options)` 인터페이스 유지

## 다음 단계

- Phase 3 10차에서 slash/spin/dash/shot/chain 같은 기본 스킬 이펙트를 `pixi-effects.js`로 점진 이동한다.
- 이후 직업별 스킬 이펙트는 `SkillEffectRenderer` 구조로 분리한다.

## 확인 체크

- `/pixi-effects.js`가 200으로 응답한다.
- `RoguePixiEffects.renderFloatingTextEffect`가 노출된다.
- 기존 floating damage/heal/xp 텍스트가 동일하게 표시된다.
- 기존 스킬 이펙트 fallback이 유지된다.
