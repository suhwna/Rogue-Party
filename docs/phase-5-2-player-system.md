# Phase 5-2: PlayerSystem 1차 분리

## 목표

`server.js`에 흩어진 플레이어 분류와 집계 helper를 `PlayerSystem` 경계로 분리한다.

플레이어 생성, 런 시작 reset, 로비 테스트 세팅은 스킬/대시/훈련장 로직과 강하게 얽혀 있으므로 이번 단계에서는 이동하지 않는다.

## 적용 내용

- `server-player-system.js`
  - `getBotPlayers(room)`
  - `getHumanPlayers(room)`
  - `isActivePlayer(player)`
  - `getActivePlayers(room)`
  - `isActiveLivingPlayer(player)`
  - `getActiveLivingPlayers(room)`
  - `countSpectators(room)`
  - `countReadyPlayers(room)`
  - `areAllPlayersReady(room)`

- `src/server/systems/PlayerSystem.ts`
  - 런타임 helper와 같은 역할의 typed boundary 추가
  - 이후 서버 TypeScript 전환 시 `RoomWithPlayers`, `PlayerLike` 기준으로 확장 가능

- `server.js`
  - 기존 함수명은 유지
  - 내부 구현만 `playerSystem` 위임으로 변경
  - 호출부와 게임 흐름은 변경하지 않음

- `package.json`
  - `npm run check`에 `server-player-system.js` 문법 검사 추가

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

- `StateSerializer`
  - `buildState` 내부의 room/player view 조립 책임을 작은 helper부터 분리
  - 공개 상태와 내부 상태를 구분하는 경계 작성

- `RewardSystem`
  - 유물 선택/상자/보상 preview를 Phase 4 registry와 이어서 정리

- `BotSystem`
  - bot brain 생성/선택/입력 업데이트 경계 분리
