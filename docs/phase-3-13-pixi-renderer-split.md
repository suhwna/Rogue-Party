# Phase 3 13차 Pixi warrior skill effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 전사 계열 styled skill effect helper 추가
  - `renderWarriorStyledSkillEffect`
  - `renderWarriorImpactEffect`
  - `renderWarriorShieldChargeEffect`
  - `renderWarriorSpinEffect`
  - `renderWarriorSlamEffect`
  - `renderWarriorBodyEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 `renderCrispStyledSkillEffect` 이후 전사 계열 effect bridge를 우선 호출
- 기존 전사 effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 warrior skill effect bridge API 검증 추가

## 유지한 범위

- 기존 전사 스킬 그래픽 결과 유지
- 기존 `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터는 변경하지 않음

## 다음 단계

- Phase 3 14차에서 궁수 계열 styled skill effect를 `public/pixi-skill-effects.js`로 이동한다.
- 이후 마법사, 기계공, 인형사, 무투가, 연금술사, 암살자 순서로 분리한다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderWarriorStyledSkillEffect`가 노출된다.
- 도발, 방패 돌진, 강철 회오리, 방패 타격, 광역 베기 계열이 bridge 우선으로 렌더링된다.
- 기존 smoke 흐름이 유지된다.
