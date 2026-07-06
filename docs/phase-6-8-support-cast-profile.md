# Phase 6-8: Support Cast Profile

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 여덟 번째 작은 절단이다.
- 힐러몹과 방벽몹의 지원형 캐스팅 반경, 시전 시간, 회복 시간을 `EnemySystem` 프로필 helper로 분리했다.
- 서버 실행 함수는 기존 행동을 유지하면서 프로필만 조회하도록 정리했다.

## 변경 사항

- `server-enemy-system.js`
  - `getSupportCastProfile(enemy, kind)` 추가
  - `heal`, `guardian_barrier`의 radius, windupTime, recoveryTime 계산 분리

- `src/server/systems/EnemySystem.ts`
  - `EnemySupportCastLike`, `EnemySupportCastProfile` 계약 추가
  - `getSupportCastProfile(enemy, kind)` TypeScript helper 추가

- `server.js`
  - 샤먼 힐 대상 탐색 반경과 힐 캐스팅 시간을 support cast profile 경유로 전환
  - 샤먼 힐 완료 후 회복 타이머를 support cast profile 경유로 전환
  - 방벽몹 barrier 반경, 캐스팅 시간, 회복 타이머를 support cast profile 경유로 전환

## 의도적으로 유지한 것

- 힐량, 보호막량, 대상 선택 우선순위는 변경하지 않았다.
- 캐스팅 중 피격 시 interrupt 정책은 기존 정책을 유지했다.
- 그래픽 이펙트 종류와 색상은 변경하지 않았다.

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

- sniper/spitter/mortar 원거리 캐스팅 profile 분리
- elite special pattern frequency helper 분리
- boss telegraph/execute/recover helper 분리
