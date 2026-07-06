# Phase 6-11: Elite Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열한 번째 작은 절단이다.
- 엘리트 특수 패턴 windup 진행을 공통 `advanceEnemyWindup()` helper 경유로 전환했다.
- 엘리트 특수 windup 판정 목록을 `EnemySystem`으로 분리해 interrupt policy와 같은 기준을 보게 했다.

## 변경 사항

- `server-enemy-system.js`
  - `isEliteSpecialWindupKind(kind)` 추가
  - elite special windup kind 목록을 EnemySystem 경계로 이동

- `src/server/systems/EnemySystem.ts`
  - `isEliteSpecialWindupKind(kind)` TypeScript helper 추가

- `server.js`
  - `updateEliteSpecial()`의 windup time 직접 감소를 `advanceEnemyWindup(enemy, kind, dt)` 경유로 전환
  - `isEliteSpecialWindup(kind)` wrapper가 EnemySystem helper를 사용하도록 변경

## 의도적으로 유지한 것

- 엘리트 특수 패턴 목록은 기존과 동일하게 유지했다.
- 패턴 완료 후 cooldown 계산과 특수 패턴 빈도 정책은 변경하지 않았다.
- 엘리트 패턴 실행 함수와 피해 판정은 변경하지 않았다.

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

- boss telegraph/execute/recover helper 분리
- boss windup kind 판정 helper 분리
- 일반 몬스터 FSM 상태 전이 helper 확장
