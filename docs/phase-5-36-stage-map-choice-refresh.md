# Phase 5-36: Stage Map Choice Refresh

## Summary

- Phase 5 서버 게임 시스템 분리의 36번째 작은 절단이다.
- `server.js`에 반복되던 `room.mapChoices = available.map(...)` 갱신 로직을 `StageSystem` helper로 분리했다.
- 지도 투표와 다음 방 선택 흐름의 기존 동작은 유지했다.

## 변경 사항

- `server-stage-system.js`
  - `refreshMapChoices(room, options)` 추가
  - 현재 가용 노드 또는 주입된 available nodes를 map node view로 변환해 `room.mapChoices`에 반영
  - CommonJS export에 helper 추가

- `src/server/systems/StageSystem.ts`
  - `RoomWithMutableMapChoices`, `RefreshMapChoicesOptions` 타입 추가
  - TypeScript 이전용 `refreshMapChoices()` 계약 추가

- `server.js`
  - `enterMapChoice()`, `updateMapChoice()`, `resolveMapChoiceIfReady()`의 mapChoices 갱신 중복을 `refreshMapChoices(room, availableNodes?)` wrapper로 전환
  - map node view 생성은 Phase 5-33의 `stageSystem.getMapNodeView()` 경로 유지

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
- StageSystem map transition helper 분리
- RewardSystem 선택 상태 요약 분리
