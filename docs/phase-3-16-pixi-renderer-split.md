# Phase 3 16차 Pixi engineer skill effect 분리 기록

## 완료 범위

- `public/pixi-skill-effects.js`에 기계공 계열 styled skill effect helper 추가
  - `renderEngineerStyledSkillEffect`
  - `renderEngineerBeamEffect`
  - `renderEngineerDroneEffect`
  - `renderEngineerMineEffect`
  - `renderEngineerDeviceEffect`
- `public/pixi-renderer.js`의 `renderStyledSkillEffect`가 전사/궁수/마법사 이후 기계공 계열 effect bridge를 우선 호출
- 기존 기계공 effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/SkillEffectRenderer.ts`
- smoke-check에 engineer skill effect bridge API 검증 추가

## 유지한 범위

- 기존 기계공 스킬 그래픽 결과 유지
- `engineer_overclock`는 기존처럼 chain/lightning 계열 분기에서 먼저 처리
- `renderCrispStyledSkillEffect` 우선순위 유지
- 기존 fallback branch 유지
- 판정, 서버 로직, 스킬 데이터는 변경하지 않음

## 다음 단계

- Phase 3 17차에서 인형사 계열 styled skill effect를 `public/pixi-skill-effects.js`로 이동한다.
- 대상은 `puppet`, `thread` 계열이다.

## 확인 체크

- `/pixi-skill-effects.js`가 200으로 응답한다.
- `RoguePixiSkillEffects.renderEngineerStyledSkillEffect`가 노출된다.
- 터렛 발사, 드론, 감전지뢰, 터렛 설치 계열이 bridge 우선으로 렌더링된다.
- 기존 smoke 흐름이 유지된다.
