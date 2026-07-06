# Phase 3-29: Pixi World Texture Presets

## 목표

`public/pixi-renderer.js`의 `prepareTextures()` 안에 있던 월드용 텍스처 drawing preset 일부를 별도 브릿지로 분리했다.

이번 단계는 전투 렌더링이나 판정에는 손대지 않고, 바닥/벽/횃불처럼 순수 배경 텍스처만 대상으로 삼았다.

## 변경 사항

- `public/pixi-world-textures.js` 추가
  - `window.RoguePixiWorldTextures` 노출
  - 챕터별 바닥 타일 theme 보관
  - `drawFloorTile`
  - `drawLegacyFloorTile`
  - `drawDefaultWallBlock`
  - `drawWallBlock`
  - `drawDefaultTorch`
  - `drawTorch`
- `src/render/WorldTexturePresets.ts` 추가
  - 런타임 JS와 같은 drawing preset의 TypeScript 참조 구현
  - 이후 `TextureFactory` 이전 시 사용할 수 있는 타입과 함수 제공
- `public/pixi-renderer.js` 연결
  - 월드 preset 브릿지가 있으면 해당 함수로 texture를 그림
  - 브릿지가 없으면 기존 inline drawing fallback 유지
- `public/index.html` 로드 순서 갱신
  - `pixi-texture-keys.js` 다음, `pixi-skill-effects.js` 이전에 로드
- `vite.config.ts` legacy runtime asset 목록 갱신
- `smoke-check.js`에 브릿지 배포 확인 추가

## 완료 조건

- 기존 `npm start` 경로에서 `pixi-world-textures.js`가 서빙된다.
- Vite build 결과물에 `pixi-world-textures.js`가 포함된다.
- renderer가 world texture preset 브릿지를 사용하되 fallback을 유지한다.
- 스모크 테스트가 브릿지 누락을 감지한다.

## 다음 단계 후보

- `shadow`, `reticle`, `xp`, `chest`, `warning-ring` 같은 공용 texture preset 분리
- effect texture preset을 큰 묶음이 아니라 카테고리별로 점진 분리
- `prepareTextures()`를 texture registry 등록 함수들의 목록 실행 구조로 바꾸기
