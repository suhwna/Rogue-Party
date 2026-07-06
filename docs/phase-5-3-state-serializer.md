# Phase 5-3: StateSerializer 1차 분리

## 목표

`buildState` 전체를 한 번에 이동하지 않고, 클라이언트 state payload의 시간/권한 계산을 먼저 `StateSerializer` 경계로 분리한다.

## 적용 내용

- `server-state-serializer.js`
  - `secondsUntil(deadline, now)`
  - `getRoomTimers(room, now)`
  - `getRoomCapabilities(room, selfId, options)`

- `src/server/StateSerializer.ts`
  - `SerializableRoomLike`
  - `RoomTimerView`
  - `RoomCapabilityOptions`
  - `RoomCapabilityView`
  - 런타임 helper와 같은 typed boundary 추가

- `server.js`
  - `buildState` 초입에서 `activePlayers`, `botPlayers`, `allReady`, `roomTimers`, `roomCapabilities`를 한 번만 계산
  - `mapTimeLeft`, `choiceTimeLeft`, `advancementTimeLeft`, `restartIn` 계산을 serializer helper로 위임
  - `canStart`, `canReturnLobby`, `canManageBots`, `canAddBot`, `canRemoveBot` 계산을 serializer helper로 위임
  - 클라이언트 state shape은 유지

- `package.json`
  - `npm run check`에 `server-state-serializer.js` 문법 검사 추가

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
  - HTTP 응답
  - WebSocket ping/pong
  - 지도 투표
  - 봇
  - 관전자

## 다음 대상

- `RewardSystem`
  - 유물 선택/상자/보상 preview를 `server-data-registry.js`와 함께 정리

- `BotSystem`
  - bot brain과 자동 진행 입력 경계를 분리

- `StateSerializer` 2차
  - player view, room view, enemy view를 작은 helper로 추가 분리
