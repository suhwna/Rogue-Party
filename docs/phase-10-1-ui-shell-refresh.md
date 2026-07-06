# Phase 10-1: UI Shell Refresh

## Scope

- 타이틀, 메인 메뉴, 방 입장, 대기방, 기본 HUD shell의 1차 UI/UX 정리.
- 게임 로직 변경 없이 DOM/CSS/문구와 smoke coverage만 갱신했다.
- Phase 10 전체 중 선택창, 결과창, 설정 UI, 리사이즈 세부 검수는 다음 단위로 남긴다.

## Changes

- `public/index.html`
  - 타이틀 화면에 `PIXEL ROGUELIKE RAID` kicker, feature badge, 게이트 심볼 추가.
  - 메인 화면에 방 생성/입장 전 설명을 추가하고 room entry copy를 정리.
  - 대기방 헤더를 `Loadout Test` 콘셉트로 바꾸고 직업/파티 섹션 라벨을 정리.

- `public/styles.css`
  - 전면 화면에 pixel grid, scanline, badge, gate, panel treatment 추가.
  - 대기방 패널을 화면 전체 팝업 대신 왼쪽 loadout console 형태로 축소.
  - room card, menu action, top HUD, lobby card에 pixel-style border/shadow를 적용.
  - 모바일에서는 대기방을 하단 drawer 형태로 유지한다.

- `public/client.js`
  - 방 생성/입장 화면 copy를 `New Party`, `Open Rooms`, `Enter Gate`로 정리.
  - 방 목록 empty/error copy를 더 명확하게 수정.

- `smoke-check.js`
  - Phase 10 UI shell marker와 CSS marker 확인을 추가.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 10-2: reward/skill/map/result modal hierarchy와 선택창 가독성 정리.
- Phase 10-3: settings UI와 graphics-quality control 정식화.
