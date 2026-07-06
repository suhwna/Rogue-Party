# Phase 6-6: Melee Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 여섯 번째 작은 절단이다.
- 암살자, 브루트, 듀얼리스트 준보스의 근접/투척 준비동작 진행을 공통 `advanceEnemyWindup()` 경유로 정리했다.
- 완료된 windup payload를 실행 함수에 넘겨, helper가 `enemy.windup`을 정리해도 기존 판정 좌표와 타이밍이 유지되게 했다.

## 변경 사항

- `server.js`
  - 듀얼리스트 준보스 `mini_cleave` 준비동작을 `advanceEnemyWindup(enemy, "mini_cleave", dt)` 경유로 전환
  - 암살자 `stalker_stab`, `stalker_shuriken` 준비동작을 공통 windup helper 경유로 전환
  - 브루트 `brute_swing` 준비동작을 공통 windup helper 경유로 전환
  - 준비 완료 시 `performMiniCleave`, `performStalkerStab`, `fireStalkerShurikenFan`, `performBruteSwing`에 완료 payload를 직접 전달

## 의도적으로 유지한 것

- 근접 피해량, 사거리, 공격 타이밍, cooldown 수치는 변경하지 않았다.
- 실제 타격 판정과 이펙트 생성은 아직 `server.js` 실행 함수에 유지했다.
- 특수 패턴 선택 확률과 추적 AI는 이번 절단에서 변경하지 않았다.

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

- bomber explode windup helper 분리
- guardian/shaman 역할 행동을 casting/recover FSM으로 세분화
- boss telegraph/execute/recover helper 분리
