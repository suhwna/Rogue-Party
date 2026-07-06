# Phase 3 11차 Pixi secondary effect 분리 기록

## 완료 범위

- `public/pixi-effects.js`에 secondary effect helper 추가
  - `renderMeteorEffect`
  - `renderFreezeEffect`
  - `renderWarningEffect`
  - `renderSupportEffect`
  - `renderPoisonEffect`
  - `renderTrapEffect`
  - `renderRewardBurstEffect`
  - `renderImpactEffect`
  - `renderExplosionEffect`
  - `renderSecondaryEffect`
- `public/pixi-renderer.js`의 `renderFloatingEffects`가 기본 스킬 이펙트 이후 secondary effect를 `RoguePixiEffects.renderSecondaryEffect`로 우선 위임
- 기존 secondary effect 본문은 fallback으로 유지
- TypeScript 기준 파일 확장
  - `src/render/effects/FloatingEffectRenderer.ts`
- smoke-check에 secondary effect bridge API 검증 추가

## 유지한 범위

- `renderStyledSkillEffect`의 직업별 고급 연출 우선순위 유지
- 기존 fallback branch 유지
- 기존 판정/서버/스킬 데이터는 변경하지 않음
- default burst fallback은 아직 `public/pixi-renderer.js`에 남김

## 다음 단계

- Phase 3 12차에서 default burst fallback과 `renderStyledSkillEffect` 분리 준비용 `SkillEffectRenderer` 브릿지를 만든다.
- 그 다음 직업별 스킬 이펙트를 작은 단위로 `public/pixi-skill-effects.js`에 옮긴다.

## 확인 체크

- `/pixi-effects.js`가 200으로 응답한다.
- `RoguePixiEffects.renderSecondaryEffect`가 노출된다.
- meteor/freeze/warning/shield/poison/trap/impact/explosion 계열이 bridge 우선으로 렌더링된다.
- 기존 smoke 흐름이 유지된다.
