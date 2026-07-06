# Phase 3-25: Pixi 스킬 이펙트 브릿지 계약 고정

## 완료 범위

- `public/pixi-renderer.js`의 `renderCrispStyledSkillEffect`가 crisp 스킬 컨텍스트 객체를 한 번만 만들고 재사용하도록 정리했다.
- crisp 계열 스킬 이펙트의 실제 직업별 렌더링 책임은 계속 `public/pixi-skill-effects.js`에 둔다.
- `smoke-check.js`가 렌더러의 styled skill entrypoint와 crisp bridge 호출 문자열을 확인하도록 확장했다.

## 유지한 계약

- 서버 상태, 스킬 이벤트 포맷, WebSocket 메시지 포맷은 변경하지 않았다.
- `RoguePixiSkillEffects` 전역 브릿지 계약은 유지했다.
- 전사 계열의 고급 근접 이펙트는 아직 렌더러 본체의 helper를 사용한다.
- 기존 `npm start` 기반 실행과 Vite build 흐름은 변경하지 않았다.

## 다음 단계 후보

- Phase 3-26에서 전사 근접 helper 또는 공통 `drawGfx*` primitive를 별도 module boundary로 더 분리한다.
- 이후 Phase 4로 넘어가기 전, renderer 본체에 남은 데이터성 정의와 texture factory 후보를 한 번 더 추린다.
