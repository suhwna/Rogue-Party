# Phase 3 20차 Pixi assassin skill effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 암살자 계열 styled skill effect helper 추가
  - `shouldRenderAssassinEffect`
  - `renderAssassinStyledSkillEffect`
  - `renderAssassinLungeEffect`
  - `renderAssassinSmokeEffect`
  - `renderAssassinMarkEffect`
  - `renderAssassinMeleeEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 연금술사 이후 암살자 bridge를 우선 호출
- 기존 암살자 effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 assassin skill effect bridge API 검증 추가

## 유지한 범위

- 기존 암살자 시각 결과 유지
- `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터 변경 없음

## 다음 단계

- Phase 3 21차에서 styled skill effect의 남은 공통 fallback 또는 warning 계열을 분리한다.
- 우선 후보는 `warning`, `boss`, `hazard telegraph`, `generic explosion/impact` 계열이다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderAssassinStyledSkillEffect`가 노출된다.
- 그림자 찌르기, 연막, 사신 표식, 암살자 기본 베기 계열 bridge API가 배포 파일에 포함된다.
- 기존 smoke 흐름이 유지된다.
