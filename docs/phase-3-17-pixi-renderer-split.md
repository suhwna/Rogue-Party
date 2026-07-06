# Phase 3 17차 Pixi puppeteer skill effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 인형사 계열 styled skill effect helper 추가
  - `renderPuppetStyledSkillEffect`
  - `renderPuppetThreadLinesEffect`
  - `renderPuppetSummonEffect`
  - `renderPuppetSlashEffect`
  - `renderPuppetThreadKnotEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 전사/궁수/마법사/기계공 이후 인형사 계열 effect bridge를 우선 호출
- 기존 인형사 effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 puppeteer skill effect bridge API 검증 추가

## 유지한 범위

- 기존 인형사 스킬 그래픽 결과 유지
- `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터는 변경하지 않음

## 다음 단계

- Phase 3 18차에서 무투가 계열 styled skill effect를 `public/pixi-skill-effects.js`로 이동한다.
- 대상은 `martial`, `palm`, `rising` 계열이다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderPuppetStyledSkillEffect`가 노출된다.
- 실 연결, 인형 소환/돌진, 그림자 베기, 실 매듭 계열이 bridge 우선으로 렌더링된다.
- 기존 smoke 흐름이 유지된다.
