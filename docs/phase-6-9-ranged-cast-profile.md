# Phase 6-9: Ranged Cast Profile

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 아홉 번째 작은 절단이다.
- 스나이퍼, 투사, 박격포의 원거리 캐스팅 프로필을 `EnemySystem` helper로 분리했다.
- 서버 함수는 기존 공격 동작을 유지하면서 시전 시간, 회복 시간, 사거리/경고 반경을 profile에서 조회하도록 정리했다.

## 변경 사항

- `server-enemy-system.js`
  - `getRangedCastProfile(enemy, kind, pressureMul)` 추가
  - `mortar`, `snipe`, `spit`의 windupTime, recoveryTime, radius, range 값을 profile로 분리

- `src/server/systems/EnemySystem.ts`
  - `EnemyRangedCastLike`, `EnemyRangedCastProfile` 계약 추가
  - `getRangedCastProfile(enemy, kind, pressureMul)` TypeScript helper 추가

- `server.js`
  - `updateMortar()`의 arm time, radius, recovery timer를 ranged profile 경유로 전환
  - `updateSniper()`의 windup time, range guard, projectile lead speed, recovery timer를 ranged profile 경유로 전환
  - `updateSpitter()`의 cast time, warning radius, recovery timer를 ranged profile 경유로 전환

## 의도적으로 유지한 것

- 투사체 피해량, 독 수치, 박격포 pool damage, projectile 생성 로직은 변경하지 않았다.
- 캐스팅 중 피격 interrupt 정책은 기존 정책을 유지했다.
- 경고 이펙트 style과 실제 판정은 변경하지 않았다.

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

- elite special pattern frequency helper 분리
- boss telegraph/execute/recover helper 분리
- 일반 몬스터 FSM 상태 전이 helper 확장
