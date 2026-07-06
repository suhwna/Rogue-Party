# Phase 2 5차: 클라이언트 UI controller 분리 기록

## 완료 범위

- `public/client-lobby.js` 추가
- `public/client-map.js` 추가
- `public/client-result.js` 추가
- Lobby class card 갱신, class detail, party row HTML 생성을 `RogueLobbyController`로 분리
- Map vote choice card와 route board HTML 생성을 `RogueMapController`로 분리
- Result stat/player HTML 생성을 `RogueResultController`로 분리
- TypeScript 기준 계약 추가
  - `src/ui/LobbyController.ts`
  - `src/ui/MapVoteController.ts`
  - `src/ui/ResultController.ts`
- Vite legacy asset 목록에 lobby/map/result controller 추가
- smoke-check에 lobby/map/result controller 배포/API 검증 추가

## 유지한 범위

- 기존 `public/client.js`의 버튼 클릭 이벤트 흐름 유지
- 지도 투표 pending 처리 유지
- 로비 ready/start/bot/spectator 상태 제어 유지
- 결과창 로비 복귀 버튼 흐름 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 2 6차에서 남은 UI controller 정리 여부를 확인한다.
- 남은 책임 분리가 충분하면 Phase 3 Pixi 렌더러 책임 분리로 이동한다.
- Phase 3에서는 `public/pixi-renderer.js`를 TextureFactory, pools, actor/world/effect renderer로 나누기 시작한다.

## 회귀 체크

- `/client-lobby.js`, `/client-map.js`, `/client-result.js`가 200으로 응답한다.
- 대기방 직업 카드 선택 상태와 파티 목록이 기존처럼 갱신된다.
- 지도 노드/경로 선택이 기존처럼 1회 클릭으로 투표된다.
- 게임오버/클리어 결과창이 기존처럼 표시되고 로비 복귀가 가능하다.
