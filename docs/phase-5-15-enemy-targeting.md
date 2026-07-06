# Phase 5-15 EnemySystem Targeting 1차

## 목표

`server.js`에 남아 있던 적 AI의 기본 타겟 검색 helper를 `EnemySystem` 경계로 이동한다.

이번 단계는 AI 의사결정 자체를 바꾸지 않고, 가장 가까운 플레이어/가장 약한 플레이어/가까운 적 검색 같은 순수 검색 helper만 분리한다.

## 변경 사항

- `server-enemy-system.js` 확장
  - `nearestLivingPlayer(players, point)`
  - `nearestLivingPlayerWithin(players, point, maxDistance, getCollisionRadius)`
  - `lowestHealthLivingPlayer(players)`
  - `nearestEnemy(enemies, point, maxDistance)`
  - `getDefensePlayerAggroRadius(enemy)`
- `src/server/systems/EnemySystem.ts` 확장
  - `PointLike`
  - `PlayerLike`
  - 타겟 검색 helper TypeScript 계약 작성
- `server.js` 변경
  - 기존 wrapper 함수명은 유지
  - 내부 구현만 `EnemySystem` 경유로 전환

## 유지한 것

- 적 타겟 우선순위
- 방어 목표 스테이지에서 플레이어 aggro 반경
- 가장 약한 플레이어 선택 기준
- 가장 가까운 플레이어/적 선택 기준
- 서버 권위 AI 판정

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
  - HTTP 응답
  - WebSocket ping/pong
  - 지도 투표
  - 봇
  - 관전자

## 다음 후보

- `EnemySystem` 3차: 군중 밀림/충돌 질량 helper 분리
- `StateSerializer` player view 분리
- `SkillSystem` 1차: 스킬 쿨다운/슬롯 해금 helper 분리
