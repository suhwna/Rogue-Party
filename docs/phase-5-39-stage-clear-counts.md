# Phase 5-39: Stage Clear Counts

## Summary

- Phase 5 서버 게임 시스템 분리의 39번째 작은 절단이다.
- 최종 스테이지 클리어 판정과 결과창용 스테이지 카운트 계산을 `StageSystem` helper로 분리했다.
- 기존 계산식과 결과 payload는 유지했다.

## 변경 사항

- `server-stage-system.js`
  - `isFinalStageCleared(room)` 추가
  - `getTotalStages(options)` 추가
  - `getClearedStageCount(room, outcome, options)` 추가
  - CommonJS export에 helper 추가

- `src/server/systems/StageSystem.ts`
  - `StageClearRoomLike`, `StageCountOptions` 타입 추가
  - TypeScript 이전용 `isFinalStageCleared()`, `getTotalStages()`, `getClearedStageCount()` 계약 추가

- `server.js`
  - 기존 함수명은 wrapper로 유지
  - 내부 구현만 `stageSystem` 경유로 전환

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

- RewardSystem 선택 상태 요약 분리
- Result serializer helper 분리
- room stage summary view 분리
