# Phase 5 Server System Split Summary

## 완료 범위

- `server.js`를 한 번에 갈아엎지 않고, 서버 권위 판정을 유지한 상태에서 시스템별 경계를 만들었다.
- 기존 런타임은 CommonJS helper를 먼저 사용하고, 이후 TypeScript 이전을 위한 `src/server` 계약을 병행 추가했다.
- 각 절단은 `npm run check`, `npm run build`, 임시 포트 `5211` 기준 `npm test`로 검증했다.

## 추가된 서버 경계

- `server-network-server.js`
  - WebSocket handshake
  - frame decode
  - JSON frame encode/write

- `server-room-manager.js`
  - room 생성/조회/list
  - gameover cleanup
  - stage clear combat object cleanup

- `server-state-serializer.js`
  - room timer/capability
  - room identity/population/stage summary
  - player identity/input/vitals/progression/loadout/action/position
  - projectile/enemy/hazard/relic chest/xp orb/stage objective view
  - run result summary/player row

- `server-player-system.js`
  - active/human/bot/spectator player 분류
  - ready/host/상태이상/player 표시 helper

- `server-enemy-system.js`
  - enemy unlock/type/count/projectile cap helper
  - targeting helper
  - status effect helper
  - crowd push/mass helper

- `server-skill-system.js`
  - skill slot unlock/use guard
  - cooldown 계산/적용
  - trigger guard

- `server-projectile-system.js`
  - projectile movement
  - projectile expiration/live filter

- `server-hazard-system.js`
  - hazard live filter
  - owner/type별 hazard 조회

- `server-collision-system.js`
  - distance/vector/angle helper
  - circle/segment collision predicate
  - fallback separation
  - world bounds movement clamp

- `server-stage-system.js`
  - map node 조회
  - available node 계산
  - map vote 집계/승자
  - map node view
  - map choice refresh
  - chapter progression
  - selected node start
  - stage clear count

- `server-reward-system.js`
  - relic choice start/clear/pending summary
  - relic choice timeout 처리

- `server-boss-system.js`
  - chapter boss profile 조회
  - mini boss profile 조회
  - boss profile view

- `server-bot-system.js`
  - bot identity/brain/input reset
  - bot map/relic/skill 선택 점수 helper

## 추가된 TypeScript 계약

- `src/server/NetworkServer.ts`
- `src/server/RoomManager.ts`
- `src/server/StateSerializer.ts`
- `src/server/systems/PlayerSystem.ts`
- `src/server/systems/EnemySystem.ts`
- `src/server/systems/SkillSystem.ts`
- `src/server/systems/ProjectileSystem.ts`
- `src/server/systems/HazardSystem.ts`
- `src/server/systems/CollisionSystem.ts`
- `src/server/systems/StageSystem.ts`
- `src/server/systems/RewardSystem.ts`
- `src/server/systems/BossSystem.ts`
- `src/server/systems/BotSystem.ts`

## 의도적으로 남긴 것

- `server.js`는 아직 메인 orchestrator로 남긴다.
- 대형 전투 루프, AI 패턴 실행, 스킬 실제 발동 로직은 Phase 6/7에서 별도로 다룬다.
- CommonJS helper와 TypeScript 계약의 중복은 Vite/ESM 서버 전환이 안정화된 뒤 줄인다.
- 네트워크 protocol, 방 상태, 클라이언트 메시지 형식은 이번 Phase에서 변경하지 않았다.

## Phase 5 완료 조건 확인

- 서버 권위 판정 유지
- 기존 멀티플레이 동작 유지
- HTTP `/rooms` 유지
- WebSocket ping/pong 유지
- 방 입장/지도 투표/봇/관전자 smoke 유지
- 시스템별 TypeScript 계약 작성
- `server.js`의 일부 책임이 helper 경유로 이동
- 매 단계마다 실행 가능한 상태 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211` 기준 `npm test` 통과
  - HTTP ok
  - WebSocket ok
  - map vote ok
  - bot ok
  - spectator ok

## 다음 Phase

- Phase 6: AI 및 몬스터 시스템 개선
  - 일반 몬스터 FSM 정리
  - 특수 몬스터 casting/interrupted/recover 상태 정리
  - 보스 phase/patternSelect/telegraph/execute/recover 구조 정리
  - 돌진몹 고장, 암살자 패턴, 힐러/방벽몹 역할, 보스 전조를 데이터 기반으로 개선
