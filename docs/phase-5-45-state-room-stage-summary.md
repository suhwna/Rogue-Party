# Phase 5-45: State Room Stage Summary

## Summary

- Phase 5 서버 게임 시스템 분리의 45번째 작은 절단이다.
- `buildState()`의 room payload 중 stage/risk/wave trait summary를 `StateSerializer` helper로 분리했다.
- HUD와 지도/전투 UI가 참조하는 기존 필드명은 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `roomStageSummaryView(room, options)` 추가
  - canChooseRisk, riskChoices, activeRisk, stageModifier, waveTrait, threatLevel, stageKind, stage view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `RoomStageSummaryLike`, `RoomStageSummaryViewOptions`, `RoomStageSummaryView` 타입 추가
  - TypeScript 이전용 `roomStageSummaryView()` 계약 추가

- `server.js`
  - `buildState()`의 risk/stage/waveTrait/threatLevel payload를 `stateSerializer.roomStageSummaryView()` 경유로 전환
  - 실제 active risk, wave trait, stage kind view 생성은 기존 서버 helper를 유지

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

- stage clear cleanup helper 분리
- room lobby reset helper 분리
- Phase 5 마감 문서 작성
