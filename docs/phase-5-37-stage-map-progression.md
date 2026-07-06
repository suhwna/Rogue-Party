# Phase 5-37: Stage Map Progression

## Summary

- Phase 5 서버 게임 시스템 분리의 37번째 작은 절단이다.
- 지도에서 더 이상 선택 가능한 노드가 없을 때의 진행 판정 로직을 `StageSystem` helper로 분리했다.
- 기존 “다음 챕터 지도 생성 또는 전체 클리어” 흐름은 유지했다.

## 변경 사항

- `server-stage-system.js`
  - `ensureMapProgression(room, options)` 추가
  - 현재 선택 가능 노드가 있으면 그대로 반환
  - 노드가 없고 마지막 챕터면 complete 상태 반환
  - 노드가 없고 다음 챕터가 있으면 floor 증가, 새 stageMap 생성, map path/reset 후 available nodes 반환
  - CommonJS export에 helper 추가

- `src/server/systems/StageSystem.ts`
  - `RoomWithMutableStageMap`, `EnsureMapProgressionOptions`, `EnsureMapProgressionResult` 타입 추가
  - TypeScript 이전용 `ensureMapProgression()` 계약 추가

- `server.js`
  - `enterMapChoice()`와 `resolveMapChoiceIfReady()`의 다음 챕터 전환 중복을 `ensureMapProgression(room)` wrapper로 전환
  - 클리어 처리와 map deadline/reset 흐름은 기존 서버 경로 유지

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
- RewardSystem 선택 상태 요약 분리
- StageSystem start node helper 분리
