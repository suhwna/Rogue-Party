# Phase 3 22차 Pixi crisp common effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 crisp 공통 styled effect helper 추가
  - `renderCrispCommonStyledEffect`
- `public/pixi-renderer.js`의 `renderCrispStyledSkillEffect` 하단 warning/impact/explosion/death 본문을 helper 호출로 대체
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 crisp common styled effect bridge API 검증 추가

## 유지한 범위

- 기존 crisp warning/impact 시각 결과 유지
- 기존 직업별 crisp 분기 우선순위 유지
- `renderStyledSkillEffect`의 직업별 bridge 우선순위 유지
- 판정, 서버 로직, 스킬 데이터 변경 없음

## 다음 단계

- Phase 3 23차에서 `renderCrispStyledSkillEffect` 내부의 연금술사/인형사/무투가/암살자 crisp 분기를 직업별 bridge로 더 분리한다.
- 이후 fallback으로 남은 중복 직업별 본문 제거 가능성을 검토한다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderCrispCommonStyledEffect`가 노출된다.
- `renderCrispStyledSkillEffect`가 공통 warning/impact/death/explosion 렌더링을 bridge로 위임한다.
- 기존 smoke 흐름이 유지된다.
