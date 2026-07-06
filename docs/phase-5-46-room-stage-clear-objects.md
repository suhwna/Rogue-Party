# Phase 5-46: Room Stage Clear Objects

## Summary

- Phase 5 서버 게임 시스템 분리의 46번째 작은 절단이다.
- 스테이지 클리어 직후 전장 오브젝트 정리 로직을 `RoomManager` helper로 분리했다.
- 플레이어 회복/다운 복구/선택 상태 조정 로직은 기존 서버 흐름에 남겨 밸런스 로직 변경을 피했다.

## 변경 사항

- `server-room-manager.js`
  - `clearStageCombatObjects(room)` 추가
  - projectiles, hazards, relicChests, xpOrbs 배열 정리
  - CommonJS export에 helper 추가

- `src/server/RoomManager.ts`
  - `StageCombatObjectsRoomLike` 타입 추가
  - TypeScript 이전용 `clearStageCombatObjects()` 계약 추가

- `server.js`
  - `completeWave()`의 스테이지 클리어 오브젝트 정리 본문을 `roomManager.clearStageCombatObjects(room)` 경유로 전환

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

- Phase 5 마감 문서 작성
- room lobby reset helper 분리
- player stage clear recovery helper 분리
