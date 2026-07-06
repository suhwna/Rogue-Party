# Phase 7/8 고도화: 스킬 이펙트 스프라이트시트 전환

## 목적

- 스킬 이펙트를 코드 생성 캔버스 텍스처 중심에서 외부 이미지 스프라이트시트 중심으로 전환한다.
- PixiJS 렌더링은 유지하되, 스킬 이펙트의 1차 경로는 `public/assets/effects/*.svg` 자산을 사용한다.
- 서버 판정, 데미지, 쿨다운, 스킬 밸런스는 변경하지 않는다.

## 적용 내용

- `public/assets/effects/`에 픽셀풍 스프라이트시트 SVG 14종 추가
  - slash, shield, shout, arrow, arrow-rain, frost, meteor, lightning
  - engineer, puppet, martial, alchemy, shadow, impact

- `public/assets/asset-manifest.json`
  - 각 이펙트 시트에 `textureKey`, `aliases`, `frameWidth`, `frameHeight`, `frames`, `animation` 메타데이터 추가
  - 스킬 이펙트는 외부 spritesheet asset-first 정책으로 명시

- `public/pixi-renderer.js`
  - `assetEffectFrameTexture()` 추가
  - `assetEffectFx()` 추가
  - 외부 시트를 Pixi texture frame으로 잘라 sprite pool에서 재사용

- `public/pixi-skill-effects.js`
  - `assetSkillSheetKey()` 추가
  - `renderAssetStyledSkillEffect()` 추가
  - 스킬 style/kind에 따라 스프라이트시트를 고르고, 방향성/광역/충돌/운석 계열 위치와 scale을 조정

- `smoke-check.js`
  - manifest에 모든 effect spritesheet가 등록되어 있는지 확인
  - 실제 `/assets/effects/*.svg` 파일 fetch 확인
  - asset-first renderer marker 확인

## 정책

- 스킬 이펙트는 asset sheet가 있으면 그 경로에서 렌더링을 종료한다.
- 캔버스 생성 텍스처는 현재 레거시/비스킬 텍스처 fallback으로만 남긴다.
- 이후 고퀄리티 PNG/WebP 시트로 교체할 때도 manifest entry만 교체하면 된다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 smoke 기반 `npm test`
