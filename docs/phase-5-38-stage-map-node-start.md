# Phase 5-38: Stage Map Node Start

## Summary

- Phase 5 서버 게임 시스템 분리의 38번째 작은 절단이다.
- 지도 노드가 선택된 뒤 room에 적용되는 공통 mutation을 `StageSystem` helper로 분리했다.
- 이벤트 문구 생성과 `spawnWave()` 호출은 기존 `server.js`에 남겨 서버 흐름을 유지했다.

## 변경 사항

- `server-stage-system.js`
  - `applyMapNodeStart(room, node, options)` 추가
  - random node resolved kind 처리
  - active node, active risk, wave trait, stage index, wave, map choice/vote/deadline, map path 적용
  - trait/modifier/boss profile 결과 반환
  - CommonJS export에 helper 추가

- `src/server/systems/StageSystem.ts`
  - `RoomWithMutableMapNodeStart`, `ApplyMapNodeStartOptions`, `ApplyMapNodeStartResult` 타입 추가
  - TypeScript 이전용 `applyMapNodeStart()` 계약 추가

- `server.js`
  - `startMapNode(room, node)` 내부의 room mutation 본문을 `stageSystem.applyMapNodeStart()` 경유로 전환
  - pushEvent와 spawnWave는 기존 위치 유지

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
- StageSystem final clear/count helper 분리
