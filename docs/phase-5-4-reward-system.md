# Phase 5-4: RewardSystem 1차 분리

## 목표

유물 선택 흐름의 상태 관리 helper를 서버 시스템 경계로 분리한다.

유물 효과 적용, 희귀도/가중치 계산, 상자 드랍률 계산은 이미 `server-data-registry.js`가 담당하므로 이번 단계에서는 선택 상태만 다룬다.

## 적용 내용

- `server-reward-system.js`
  - `beginRelicChoiceForPlayers(players, choiceFactory)`
  - `clearRelicChoice(player)`
  - `getPendingRelicChoicePlayers(players)`
  - `hasPendingRelicChoice(players)`
  - `countPendingRelicChoices(players)`

- `src/server/systems/RewardSystem.ts`
  - `RelicChoicePlayerLike`
  - 유물 선택 상태 helper typed boundary 추가

- `server.js`
  - 스테이지 클리어 자동 상자 회수 시 선택 시작 로직을 RewardSystem으로 위임
  - 유물 상자 직접 오픈 시 선택 시작 로직을 RewardSystem으로 위임
  - 유물 선택 완료/시간초과 선택 완료 시 선택 상태 clear를 RewardSystem으로 위임
  - state의 `choicePending` 카운트 계산을 RewardSystem으로 위임

- `package.json`
  - `npm run check`에 `server-reward-system.js` 문법 검사 추가

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

- `BotSystem`
  - bot brain 생성/보장/입력 reset helper 분리
  - bot map/relic/skill 선택 점수화 경계 준비

- `StateSerializer` 2차
  - player view/room view를 helper로 작게 분리
