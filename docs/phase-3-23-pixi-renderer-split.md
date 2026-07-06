# Phase 3 23차 Pixi crisp class effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 crisp 직업별 styled effect helper 추가
  - `renderCrispClassStyledEffect`
  - `renderCrispAlchemistEffect`
  - `renderCrispPuppetEffect`
  - `renderCrispMartialEffect`
  - `renderCrispAssassinEffect`
- `public/pixi-renderer.js`의 `renderCrispStyledSkillEffect` 내부 연금술사/인형사/무투가/암살자 고급 분기를 helper 호출로 대체
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 crisp class styled effect bridge API 검증 추가

## 유지한 범위

- 기존 crisp 직업별 시각 결과 유지
- 기존 warrior/ranger/mage/engineer crisp 분기 우선순위 유지
- `renderCrispCommonStyledEffect` 공통 분기 우선순위 유지
- 판정, 서버 로직, 스킬 데이터 변경 없음

## 다음 단계

- Phase 3 24차에서 `renderCrispStyledSkillEffect` 내부의 ranger/mage/engineer 고급 분기 분리를 진행한다.
- 이후 `renderStyledSkillEffect` fallback 중 중복된 직업별 본문 제거 가능성을 검토한다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderCrispClassStyledEffect`가 노출된다.
- 연금술사/인형사/무투가/암살자 crisp 고급 이펙트가 bridge로 위임된다.
- 기존 smoke 흐름이 유지된다.
