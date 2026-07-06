# Phase 5-42: State Run Result Summary

## Summary

- Phase 5 서버 게임 시스템 분리의 42번째 작은 절단이다.
- 결산창 result summary object 조립을 `StateSerializer` helper로 분리했다.
- 합계 계산은 기존 `server.js`에 유지하고, payload 형태만 serializer 경계로 옮겼다.

## 변경 사항

- `server-state-serializer.js`
  - `runResultSummaryView(room, options)` 추가
  - outcome, title, message, chapter/floor/wave, stage counts, duration, score/relic totals, highest level, players view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `RunResultRoomLike`, `RunResultSummaryViewOptions`, `RunResultSummaryView` 타입 추가
  - TypeScript 이전용 `runResultSummaryView()` 계약 추가

- `server.js`
  - `buildRunResult()`의 최종 object literal을 `stateSerializer.runResultSummaryView()` 경유로 전환
  - 총합 계산과 player row 생성은 기존 위치에서 유지

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

- RewardSystem relic choice timeout 처리 helper 분리
- room stage summary view 분리
- Result finish cleanup helper 분리
