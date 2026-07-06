# Phase 5-44: Room Gameover Cleanup

## Summary

- Phase 5 서버 게임 시스템 분리의 44번째 작은 절단이다.
- `finishRun()`에서 직접 수행하던 gameover cleanup을 `RoomManager` helper로 분리했다.
- 결과 생성과 이벤트 출력은 기존 `server.js`에 유지했다.

## 변경 사항

- `server-room-manager.js`
  - `prepareRoomForGameover(room)` 추가
  - combat/map/reward 관련 배열과 timer/status 값을 gameover 상태에 맞게 정리
  - 각 플레이어의 choice/pending skill choice 상태 정리
  - CommonJS export에 helper 추가

- `src/server/RoomManager.ts`
  - `GameoverPlayerLike`, `GameoverRoomLike` 타입 추가
  - TypeScript 이전용 `prepareRoomForGameover()` 계약 추가

- `server.js`
  - `finishRun()` cleanup 본문을 `roomManager.prepareRoomForGameover(room)`으로 전환
  - `buildRunResult()`와 완료/실패 이벤트는 기존 위치 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211` 기준 `npm test` 통과
  - HTTP ok
  - WebSocket ok
  - map vote ok
  - bot ok
  - spectator ok

## 다음 후보

- room stage summary view 분리
- stage clear cleanup helper 분리
- room lobby reset helper 분리
