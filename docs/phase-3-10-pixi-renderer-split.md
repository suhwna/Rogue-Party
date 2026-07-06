# Phase 3 10차 Pixi 기본 스킬 이펙트 분리 기록

## 완료 범위

- `public/pixi-effects.js`에 기본 스킬 이펙트 helper 추가
  - `renderSlashEffect`
  - `renderSpinEffect`
  - `renderChainEffect`
  - `renderShotEffect`
  - `renderDashEffect`
  - `renderMobilityOrProjectileEffect`
  - `renderCoreSkillEffect`
- `public/pixi-renderer.js`의 `renderFloatingEffects`가 `renderStyledSkillEffect` 이후 기본 스킬 이펙트를 `RoguePixiEffects.renderCoreSkillEffect`로 우선 위임
- 기존 `slash/spin/dash/shot/chain` 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/FloatingEffectRenderer.ts`
- smoke-check에 effect bridge 기본 스킬 API 검증 추가

## 유지한 범위

- 직업별 고급 스킬 연출은 기존 `renderStyledSkillEffect` 우선순위를 유지
- 기존 generic branch는 브릿지 로드 실패 시 fallback으로 유지
- Pixi renderer public interface는 변경하지 않음
- 스킬 판정/서버 로직은 건드리지 않음

## 다음 단계

- Phase 3 11차에서 `meteor/freeze/warning/shield/poison/trap/impact/explosion` 계열을 effect bridge로 이동한다.
- 이후 `renderStyledSkillEffect` 내부의 직업별 연출을 `SkillEffectRenderer`로 분리한다.

## 확인 체크

- `/pixi-effects.js`가 200으로 응답한다.
- `RoguePixiEffects.renderCoreSkillEffect`가 노출된다.
- slash/spin/dash/shot/chain 이펙트가 기존 fallback 없이도 렌더링될 수 있다.
- 기존 smoke 흐름이 유지된다.
