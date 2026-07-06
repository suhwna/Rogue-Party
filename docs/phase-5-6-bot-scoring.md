# Phase 5-6: BotSystem 선택 점수 분리

## 목표

봇 자동 진행 로직 중 선택 점수 계산을 `BotSystem` 경계로 분리한다.

실제 서버 행동 실행(`chooseMapNode`, `chooseRelic`, `chooseSkillUpgrade`)은 서버 권위 흐름을 유지하기 위해 `server.js`에 남긴다.

## 적용 내용

- `server-bot-system.js`
  - `pickBotMapNode(availableNodes, getNodeGameplayKind, random)`
  - `pickBestBotRelicChoice(bot, helpers, random)`
  - `scoreBotRelicChoice(bot, choice, helpers, random)`
  - `pickBestBotSkillChoice(bot, helpers, random)`
  - `scoreBotSkillChoice(bot, choice, helpers, random)`

- `src/server/systems/BotSystem.ts`
  - `BotMapNodeLike`
  - `BotRelicChoiceLike`
  - `BotSkillChoiceLike`
  - `BotChoicePlayerLike`
  - `BotRelicChoiceHelpers`
  - `BotSkillChoiceHelpers`
  - 런타임 점수 helper와 같은 typed boundary 추가

- `server.js`
  - 지도 선택 가중치 계산을 BotSystem으로 위임
  - 유물 선택 점수 계산을 BotSystem으로 위임
  - 스킬 강화 선택 점수 계산을 BotSystem으로 위임
  - rarity/skill helper는 서버에서 주입

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
  - player view, room view, enemy view를 helper 단위로 분리

- `StageSystem`
  - 지도 후보/투표/진행 helper 분리

- `EnemySystem`
  - 적 생성/상태 갱신 전 pure helper부터 분리
