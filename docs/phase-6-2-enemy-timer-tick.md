# Phase 6-2: Enemy Timer Tick

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 두 번째 작은 절단이다.
- 적 공통 timer 감소와 mark/taunt/barrier cleanup을 `EnemySystem` helper로 분리했다.
- 기존 적 행동, 스킬 빈도, 피해 판정은 변경하지 않았다.

## 변경 사항

- `server-enemy-system.js`
  - `tickEnemyTimers(enemy, dt)` 추가
  - 공격/사격/회복/돌진/특수/엘리트 특수 timer 감소 처리
  - slow/freeze/taunt/vulnerable/assassin mark/thread mark timer 감소 처리
  - barrier 만료 cleanup 처리
  - taunt/assassin mark/thread mark owner cleanup 처리

- `src/server/systems/EnemySystem.ts`
  - `EnemyTimerLike` 타입 추가
  - `tickEnemyTimers(enemy, dt)` TypeScript 계약 추가

- `server.js`
  - `updateEnemies()`의 공통 timer/cleanup block을 `tickEnemyTimers(enemy, dt)` 경유로 전환

## 의도적으로 유지한 것

- poison/burn 지속 피해는 `dealDamage()` 콜백이 필요하므로 아직 `server.js`에 남겼다.
- casting/windup resolve는 다음 단계에서 별도 helper로 분리한다.

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

- caster windup advance/resolve helper 분리
- charger FSM helper 분리
- shaman/guardian casting helper 분리
