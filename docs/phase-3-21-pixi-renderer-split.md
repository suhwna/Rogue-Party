# Phase 3 21차 Pixi common styled effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 공통 styled effect helper 추가
  - `commonDangerColor`
  - `renderCommonStyledEffect`
  - `renderCommonWarningEffect`
  - `renderCommonImpactEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 직업별 bridge 이후 공통 bridge를 호출
- 기존 warning, impact, explosion, death fallback 본문은 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 common styled effect bridge API 검증 추가

## 유지한 범위

- `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 warning/impact 시각 결과 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터 변경 없음

## 다음 단계

- Phase 3 22차에서 `renderCrispStyledSkillEffect` 내부의 공통 warning/impact 렌더링을 별도 브릿지로 더 얇게 분리한다.
- 이후 `renderStyledSkillEffect` fallback 중 중복된 직업별 본문을 제거할 수 있는지 검토한다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderCommonStyledEffect`가 노출된다.
- warning, impact, explosion, death 계열 bridge API가 배포 파일에 포함된다.
- 기존 smoke 흐름이 유지된다.
