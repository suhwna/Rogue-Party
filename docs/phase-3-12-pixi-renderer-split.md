# Phase 3 12차 Pixi skill effect 브릿지 준비 기록

## 완료 범위

- `public/pixi-skill-effects.js` 추가
- styled skill effect 공통 컨텍스트 생성 helper 분리
  - `normalizeSkillStyle`
  - `skillEffectPhase`
  - `fallbackEffectEndpoints`
  - `createStyledSkillContext`
  - `shouldRenderStyledSkill`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 새 skill effect bridge에서 공통 컨텍스트를 우선 받아 사용
- `public/pixi-effects.js`에 default burst fallback helper 추가
  - `renderDefaultBurstEffect`
- TypeScript 기준 파일 추가/확장
  - `src/render/effects/SkillEffectRenderer.ts`
  - `src/render/effects/FloatingEffectRenderer.ts`
- Vite legacy asset 목록과 `public/index.html`에 `pixi-skill-effects.js` 추가
- smoke-check에 `/pixi-skill-effects.js` 배포/API 검증 추가

## 유지한 범위

- 직업별 styled skill effect 본문은 아직 `public/pixi-renderer.js`에 유지
- 기존 `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback effect branch는 브릿지 실패 대비로 남김
- 판정, 서버 로직, 스킬 데이터는 변경하지 않음

## 다음 단계

- Phase 3 13차에서 `renderStyledSkillEffect` 내부의 warrior 계열부터 `public/pixi-skill-effects.js`로 이동한다.
- 이후 궁수/마법사/기계공/인형사/무투가/연금술사/암살자 순서로 직업별 이펙트를 분리한다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.createStyledSkillContext`가 노출된다.
- styled skill context 값이 기존 계산과 동일하다.
- default burst fallback이 `RoguePixiEffects.renderDefaultBurstEffect`로 처리된다.
- 기존 smoke 흐름이 유지된다.
