# Phase 6-3: Enemy Windup Advance

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 세 번째 작은 절단이다.
- 적 casting/windup 진행과 완료 판정을 `EnemySystem.advanceEnemyWindup()`으로 분리했다.
- 샤먼, 방벽몹, 스나이퍼, 투사의 반복 casting tick 코드를 공통 helper 경유로 전환했다.

## 변경 사항

- `server-enemy-system.js`
  - `advanceEnemyWindup(enemy, kind, dt)` 추가
  - windup이 활성인지, 완료되었는지, 완료 payload가 무엇인지 표준 result로 반환

- `src/server/systems/EnemySystem.ts`
  - `EnemyWindupLike` 타입 추가
  - `EnemyWindupOwnerLike` 타입 추가
  - `EnemyWindupTickResult` 타입 추가
  - `advanceEnemyWindup(enemy, kind, dt)` TypeScript 계약 추가

- `server.js`
  - `updateShaman()` heal casting 진행을 helper 경유로 전환
  - `updateGuardian()` barrier casting 진행을 helper 경유로 전환
  - `updateSniper()` snipe casting 진행을 helper 경유로 전환
  - `updateSpitter()` spit casting 진행을 helper 경유로 전환

## 의도적으로 유지한 것

- casting 시작 조건은 변경하지 않았다.
- casting 완료 후 실제 효과 실행 함수는 기존 서버 로직에 남겼다.
- 피격 interrupt 정책은 다음 단계에서 별도 helper로 분리한다.

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

- enemy casting interrupt policy helper 분리
- charger FSM helper 분리
- boss telegraph/execute helper 분리
