# Phase 3-28: Pixi Texture Key Bridge

## 목표

`public/pixi-renderer.js`에 직접 박혀 있던 주요 텍스처 키 생성 규칙을 별도 브릿지로 분리했다.

이번 단계는 렌더링 동작을 바꾸는 작업이 아니라, 이후 `TextureFactory`/`TextureRegistry`로 안전하게 이동하기 위한 기준선을 만드는 작업이다.

## 변경 사항

- `public/pixi-texture-keys.js` 추가
  - `window.RoguePixiTextureKeys` 노출
  - actor/enemy/boss/projectile/world tile 키 생성 함수 제공
  - projectile fallback 색상 규칙 제공
- `src/render/TextureKeys.ts` 추가
  - 런타임 JS와 같은 규칙의 TypeScript 참조 구현
  - 향후 TS 렌더러 이전 시 가져다 쓸 수 있는 타입 포함
- `public/pixi-renderer.js` 연결
  - actor/enemy/boss/projectile 텍스처 키 생성 시 브릿지 사용
  - floor tile/wall block 생성 및 렌더링 키도 브릿지 사용
  - 브릿지 미로드 시 기존 문자열 fallback 유지
- `public/index.html` 로드 순서 갱신
  - `pixi-palettes.js` 다음, `pixi-skill-effects.js` 이전에 로드
- `vite.config.ts` legacy runtime asset 목록 갱신
- `smoke-check.js`에 브릿지 배포 확인 추가

## 완료 조건

- 기존 `npm start` 경로에서 `pixi-texture-keys.js`가 서빙된다.
- Vite build 결과물에 `pixi-texture-keys.js`가 포함된다.
- renderer가 브릿지를 사용하되 fallback을 유지한다.
- 스모크 테스트가 브릿지 누락을 감지한다.

## 다음 단계 후보

- 렌더러 내부 texture drawing preset을 `TextureFactory` 쪽으로 더 세분화한다.
- world/objective/pickup texture key와 drawing 함수도 같은 방식으로 분리한다.
- 이후 sprite sheet 생성 규칙을 데이터 기반으로 옮긴다.
