# Phase 5-7: StageSystem 1차 분리

## 목표

지도/스테이지 진행 로직 중 순수 계산 helper를 `StageSystem` 경계로 분리한다.

스테이지 생성, 방 진입, 전투 시작 같은 상태 변경 로직은 아직 `server.js`에 유지한다.

## 적용 내용

- `server-stage-system.js`
  - `getNodeGameplayKind(node)`
  - `getMapNode(stageMap, nodeId)`
  - `getAvailableMapNodes(room)`
  - `countMapVotes(mapVotes)`
  - `pickVoteWinner(available, counts, random)`

- `src/server/systems/StageSystem.ts`
  - `StageNodeLike`
  - `StageMapLike`
  - `RoomWithStageMap`
  - 런타임 helper와 같은 typed boundary 추가

- `server.js`
  - active stage kind 계산을 StageSystem으로 위임
  - map node 조회를 StageSystem으로 위임
  - available map node 계산을 StageSystem으로 위임
  - map vote count 계산을 StageSystem으로 위임
  - vote winner 계산을 StageSystem으로 위임

- `package.json`
  - `npm run check`에 `server-stage-system.js` 문법 검사 추가

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

- `StateSerializer` 2차
  - player view와 room view 조립 helper 분리

- `StageSystem` 2차
  - map choice 진입/갱신 helper 분리

- `EnemySystem`
  - 적 생성 입력값 계산 helper부터 분리
