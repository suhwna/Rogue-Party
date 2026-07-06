# Phase 7/8 고도화: 스킬 이펙트 공통 품질 레이어

## 목적

- Phase 7의 직업별 스킬 이펙트와 Phase 8의 파티클 엔진 위에 공통 고도화 레이어를 추가한다.
- 스킬마다 품질 편차가 생기지 않도록 발동 방향, 타격 지점, 속성감을 공통 기준으로 보강한다.
- 서버 판정, 데미지, 쿨다운, 밸런스는 변경하지 않는다.

## 적용 내용

- `public/pixi-skill-effects.js`
  - `renderSkillEffectPolishLayer()` 추가
  - 스킬 style 기반 palette 분류 추가
  - 방향성 스킬에 lane highlight, side glint, 종점 spark 추가
  - impact/explosion/meteor/finisher 계열에 impact burst와 shock arc 추가
  - warning/shield/freeze/taunt/focus/cage 계열에 rune/arc/aura polish 추가

- `public/pixi-particles.js`
  - 신규 particle preset 추가
    - `bladeGlint`
    - `metalSpark`
    - `arcaneDust`
    - `lightningFork`
    - `shockRing`
  - 신규 preset은 기존 particle budget을 사용하므로 프레임 예산 밖으로 무한 증가하지 않는다.

- `public/pixi-renderer.js`
  - 모든 styled skill render 전에 `renderSkillEffectPolishLayer()`를 호출한다.
  - 기존 직업별 crisp renderer는 그대로 유지하고, 공통 레이어는 보강만 담당한다.

- `smoke-check.js`
  - 신규 skill polish bridge marker 확인 추가
  - 신규 particle preset marker 확인 추가

## 기대 효과

- 스킬별 식별성의 최소 품질선이 올라간다.
- 전사/궁수/마법사 외 직업도 기본 타격감과 속성감이 강화된다.
- 파티클 엔진 예산 안에서 화려함을 늘려 고밀도 전투에서도 폭주를 줄인다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 smoke 기반 `npm test`
