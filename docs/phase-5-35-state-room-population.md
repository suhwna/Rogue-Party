# Phase 5-35: State Room Population View

## Summary

- Phase 5 서버 게임 시스템 분리의 35번째 작은 절단이다.
- `buildState()`의 room payload 중 인원/준비/선택 대기/봇 관리 가능 여부 묶음을 `StateSerializer` helper로 분리했다.
- 로비, 봇 관리, 관전자, 선택 UI가 사용하는 기존 필드명은 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `roomPopulationView(options)` 추가
  - readyCount, allReady, choicePending, advancementPending, botCount, bot 관리 권한, active/spectator/max player count view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `RoomPopulationViewOptions`, `RoomPopulationView` 타입 추가
  - TypeScript 이전용 `roomPopulationView()` 계약 추가

- `server.js`
  - `buildState()`의 room 인원/준비/봇/선택 대기 payload를 `stateSerializer.roomPopulationView()` 경유로 전환
  - 실제 count 계산과 권한 판정은 기존 서버 helper와 `getRoomCapabilities()` 결과를 유지

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
- StageSystem map choice refresh helper 분리
- RewardSystem 선택 상태 요약 분리
