# Phase 6-4: Enemy Interrupt Policy

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 네 번째 작은 절단이다.
- 피격 시 적 casting/windup을 끊을 수 있는지와, 끊긴 뒤 어떤 timer를 지연할지 결정하는 정책을 `EnemySystem`으로 분리했다.
- 서버는 interrupt 성공 후 이펙트만 담당하도록 줄였다.

## 변경 사항

- `server-enemy-system.js`
  - `isInterruptibleWindupKind(kind, isEliteSpecialWindup?)` 추가
  - `interruptEnemyWindup(enemy, options)` 추가
  - windup kind별 cooldown timer 적용 정책 분리

- `src/server/systems/EnemySystem.ts`
  - `EnemyInterruptLike` 타입 추가
  - `EnemyInterruptOptions` 타입 추가
  - `EnemyInterruptResult` 타입 추가
  - interrupt policy TypeScript 계약 추가

- `server.js`
  - `interruptEnemyCast()`의 정책/타이머 분기 본문을 `enemySystem.interruptEnemyWindup()` 경유로 전환
  - interrupt 성공 이펙트는 기존 서버 로직에 유지

## 의도적으로 유지한 것

- 자폭몹 폭발 windup은 기존처럼 interrupt 대상이 아니다.
- 보스는 기존처럼 `interruptBossCast` 옵션 또는 빙결 등 별도 정책이 있어야 주요 casting이 끊긴다.
- 실제 피격 판정과 damage 계산은 변경하지 않았다.

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

- charger windup/dash FSM helper 분리
- boss telegraph/execute helper 분리
- elite special FSM helper 분리
