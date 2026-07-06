# Phase 6-7: Bomber Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 일곱 번째 작은 절단이다.
- 자폭몹의 `bomber_explode` 준비동작 진행을 공통 `advanceEnemyWindup()` 경유로 정리했다.
- 자폭은 피격으로 끊기지 않는 의도된 행동이므로 interrupt policy에는 추가하지 않았다.

## 변경 사항

- `server.js`
  - 일반 전투의 `updateBomber()` 자폭 준비 진행을 `advanceBomberExplosionWindup()`으로 전환
  - 지키기 스테이지 목표물 공격 중 자폭 준비 진행도 같은 helper로 전환
  - `explodeBomber(room, enemy, cast?)`가 완료된 windup payload를 받을 수 있게 변경
  - `advanceBomberExplosionWindup(room, enemy, dt)` wrapper 추가

## 의도적으로 유지한 것

- 자폭 시작 후 피격으로 캐스팅이 끊기지 않는 기존 의도는 유지했다.
- 자폭 반경, 피해량, 준비 시간, 경고 이펙트는 변경하지 않았다.
- 자폭 완료 시 enemy 사망 처리 방식도 유지했다.

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

- guardian/shaman 역할 행동을 casting/recover FSM으로 세분화
- ranged caster windup 공통화 확대
- boss telegraph/execute/recover helper 분리
