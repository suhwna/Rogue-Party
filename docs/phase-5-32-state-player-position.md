# Phase 5-32: State Player Position View

## Summary

- Phase 5 서버 게임 시스템 분리의 32번째 작은 절단이다.
- `buildState()` 안에서 직접 반올림하던 플레이어 좌표 payload를 `StateSerializer` helper로 분리했다.
- 좌표 반올림 규칙은 기존과 동일하게 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `playerPositionView(player)` 추가
  - 플레이어 `x`, `y` 좌표를 클라이언트 payload용으로 반올림
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `PlayerPositionLike`, `PlayerPositionView` 타입 추가
  - TypeScript 이전용 `playerPositionView()` 계약 추가

- `server.js`
  - `buildState()`의 player payload에서 좌표 계산을 `stateSerializer.playerPositionView()` 경유로 전환

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

- StageSystem `mapNodeView(room, node)` 의존성 축소
- room summary/capability view 추가 분리
- RewardSystem 선택 상태 요약 분리
