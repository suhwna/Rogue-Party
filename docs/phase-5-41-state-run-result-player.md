# Phase 5-41: State Run Result Player View

## Summary

- Phase 5 서버 게임 시스템 분리의 41번째 작은 절단이다.
- 결산창 result payload의 플레이어별 row 생성을 `StateSerializer` helper로 분리했다.
- 기존 결과창 필드명과 값의 의미는 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `runResultPlayerView(player, options)` 추가
  - id, name, classLabel, level, score, relic count/max/unique count, downed view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `RunResultPlayerLike`, `RunResultPlayerViewOptions`, `RunResultPlayerView` 타입 추가
  - TypeScript 이전용 `runResultPlayerView()` 계약 추가

- `server.js`
  - `buildRunResult()`의 `players.map(...)` row 조립을 `stateSerializer.runResultPlayerView()` 경유로 전환
  - class label과 relic stack 계산은 기존 서버 helper를 유지

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

- Result summary view 분리
- RewardSystem relic choice timeout 처리 helper 분리
- room stage summary view 분리
