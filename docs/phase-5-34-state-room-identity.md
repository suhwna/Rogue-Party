# Phase 5-34: State Room Identity View

## Summary

- Phase 5 서버 게임 시스템 분리의 34번째 작은 절단이다.
- `buildState()`의 room payload 중 방/챕터/호스트 식별 정보를 `StateSerializer` helper로 분리했다.
- 기존 room 필드명과 의미는 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `roomIdentityView(room, options)` 추가
  - code, wave, floor, chapter, maxChapters, status, hostId, hostName view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `RoomIdentityLike`, `RoomIdentityViewOptions`, `RoomIdentityView` 타입 추가
  - TypeScript 이전용 `roomIdentityView()` 계약 추가

- `server.js`
  - `buildState()`의 room identity payload를 `stateSerializer.roomIdentityView()` 경유로 전환
  - host player 조회와 max chapter 값은 기존 서버 경로 유지

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

- room counts/capabilities summary view 분리
- room stage summary view 분리
- StageSystem map choice refresh helper 분리
