# Phase 3-24: Pixi 스킬 이펙트 Primary Class Crisp 분리

## 완료 범위

- `public/pixi-renderer.js`의 궁수, 마법사, 기계공 crisp 스킬 이펙트 본문을 렌더러 본체에서 제거했다.
- `public/pixi-skill-effects.js`에 다음 전용 브릿지를 추가했다.
  - `renderCrispPrimaryClassStyledEffect`
  - `renderCrispRangerEffect`
  - `renderCrispMageEffect`
  - `renderCrispEngineerEffect`
- `src/render/effects/SkillEffectRenderer.ts`의 TS 참조 구현도 같은 API 기준으로 확장했다.
- `smoke-check.js`가 새 Pixi skill effects 브릿지 노출 여부를 확인하도록 갱신했다.

## 유지한 것

- 서버 판정, 스킬 데이터, 이펙트 이벤트 포맷은 변경하지 않았다.
- 기존 Pixi 렌더링 흐름과 `renderCrispStyledSkillEffect` 호출 계약은 유지했다.
- 기존 sprite 기반 `renderRangerStyledSkillEffect`, `renderMageStyledSkillEffect`, `renderEngineerStyledSkillEffect`는 fallback/이관 기준으로 남겼다.

## 다음 단계 후보

- Phase 3-25에서 남은 fallback 직업별 이펙트와 crisp 이펙트의 중복 기준을 더 정리한다.
- 이후 파티클 엔진 Phase에서 직업별 이펙트 내부의 반복 파티클 생성 규칙을 preset 기반으로 옮긴다.
