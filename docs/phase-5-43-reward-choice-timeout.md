# Phase 5-43: Reward Choice Timeout

## Summary

- Phase 5 서버 게임 시스템 분리의 43번째 작은 절단이다.
- 유물 선택 제한시간 종료 시 pending player에게 첫 선택지를 적용하고 choice 상태를 닫는 반복 로직을 `RewardSystem` helper로 분리했다.
- 실제 유물 적용 함수와 이벤트 출력은 기존 서버 흐름에 남겼다.

## 변경 사항

- `server-reward-system.js`
  - `applyTimedOutRelicChoices(players, applyChoice)` 추가
  - pending player의 첫 choice를 적용
  - 적용 성공 시 `clearRelicChoice()` 호출
  - `{ player, chosen, applied }` 결과 목록 반환

- `src/server/systems/RewardSystem.ts`
  - `TimedOutRelicChoiceResult` 타입 추가
  - TypeScript 이전용 `applyTimedOutRelicChoices()` 계약 추가

- `server.js`
  - `updateRelicChoice()`의 timeout loop를 `rewardSystem.applyTimedOutRelicChoices()` 경유로 전환
  - 이벤트 문구와 `formatAppliedRelicName()` 호출은 기존 위치 유지

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
- finishRun cleanup helper 분리
- RewardSystem choice begin summary 반환 확장
