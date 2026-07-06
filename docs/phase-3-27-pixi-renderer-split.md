# Phase 3-27: Pixi 렌더 팔레트 데이터 분리

## 완료 범위

- `public/pixi-palettes.js`를 추가해 직업/몬스터 색상 팔레트 데이터를 renderer 본체에서 분리했다.
- `src/render/TexturePalettes.ts`를 추가해 같은 팔레트 계약의 TypeScript 참조 구현을 마련했다.
- `public/pixi-renderer.js`는 `RoguePixiPalettes` 브릿지를 우선 사용하고, 브릿지 누락 시 최소 fallback만 사용하도록 정리했다.
- `public/index.html`, `vite.config.ts`, `smoke-check.js`에 새 브릿지 파일을 연결했다.

## 유지한 계약

- 액터/몬스터/보스 텍스처 생성 방식과 픽셀아트 결과는 변경하지 않았다.
- 서버 상태, 클래스 ID, 몬스터 타입, 스킬/전투 판정은 변경하지 않았다.
- 기존 legacy script 로딩 구조와 Vite build 병행 구조를 유지했다.

## 다음 단계 후보

- Phase 3-28에서 texture key 생성과 canvas texture 등록 책임을 `TextureFactory` 후보로 더 분리한다.
- Phase 4 전환 전 직업/몹/스테이지 밸런스 데이터와 순수 렌더 색상 데이터를 어떤 경계로 나눌지 확정한다.
