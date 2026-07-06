# Phase 3 19차 Pixi alchemist skill effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 연금술사 계열 styled skill effect helper 추가
  - `alchemistMode`
  - `renderAlchemistStyledSkillEffect`
  - `renderAlchemistThrowEffect`
  - `renderAlchemistElixirEffect`
  - `renderAlchemistReactionEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 무투가 이후 연금술사 bridge를 우선 호출
- 기존 연금술사 effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 alchemist skill effect bridge API 검증 추가

## 유지한 범위

- 기존 연금술사 시각 결과 유지
- `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터 변경 없음

## 다음 단계

- Phase 3 20차에서 암살자 계열 styled skill effect를 `public/pixi-skill-effects.js`로 이동한다.
- 대상은 `assassin`, `shadow`, `lunge`, `mark`, `smoke`, `shuriken` 계열이다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderAlchemistStyledSkillEffect`가 노출된다.
- 플라스크 투척, 영약, 산성/화염 반응 계열 bridge API가 배포 파일에 포함된다.
- 기존 smoke 흐름이 유지된다.
