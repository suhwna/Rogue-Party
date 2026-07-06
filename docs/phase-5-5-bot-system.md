# Phase 5-5: BotSystem 1차 분리

## 목표

봇 자동 플레이 전체 AI를 한 번에 이동하지 않고, 봇 기본 상태와 입력 reset helper부터 서버 시스템 경계로 분리한다.

## 적용 내용

- `server-bot-system.js`
  - `createBotBrain(random)`
  - `ensureBotBrain(player)`
  - `resetBotInput(bot)`
  - `createBotIdentity(roomCode, activeCount, botNumber, classRotation, botNames)`

- `src/server/systems/BotSystem.ts`
  - `BotBrain`
  - `BotInputLike`
  - `BotPlayerLike`
  - `BotIdentity`
  - 런타임 helper와 같은 typed boundary 추가

- `server.js`
  - 봇 ID/이름/직업 산출을 BotSystem으로 위임
  - bot brain 생성/보장 로직을 BotSystem으로 위임
  - bot input reset 로직을 BotSystem으로 위임
  - 기존 봇 전투 판단/지도 선택/보상 선택 스코어링은 아직 유지

- `package.json`
  - `npm run check`에 `server-bot-system.js` 문법 검사 추가

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

- `BotSystem` 2차
  - 봇 지도 선택 가중치/보상 선택 점수/스킬 선택 점수 분리

- `StateSerializer` 2차
  - player view, room view를 helper로 추가 분리

- `StageSystem`
  - 지도 선택과 스테이지 진행의 순수 helper 분리
