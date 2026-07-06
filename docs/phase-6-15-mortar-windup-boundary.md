# Phase 6-15: Mortar Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열다섯 번째 작은 절단이다.
- 박격포몹의 `mortar` 준비동작 직접 tick을 공통 `advanceEnemyWindup()` 경유로 전환했다.
- 이 변경으로 `server.js`의 직접 `windup.time -= dt` 패턴을 제거했다.

## 변경 사항

- `server.js`
  - `updateMortar()`의 `mortar` windup 직접 감소/완료 처리를 `advanceEnemyWindup(enemy, "mortar", dt)` 경유로 변경
  - 준비 완료 payload를 `castMortarPool()`에 전달해 기존 위치/반경/피해 정보를 유지

## 의도적으로 유지한 것

- 박격포 시전 시간, 독 장판 지속시간, 피해량, 경고 이펙트는 변경하지 않았다.
- 원거리 캐스팅 profile 수치는 기존 Phase 6-9 값을 유지했다.
- `enemy.windup.time = Math.min(...)` 형태의 의도적 시간 단축 로직은 유지했다.

## 검증

- `rg -n windup\\.time server.js` 기준 직접 `windup.time -= dt` 없음
- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211` 기준 `npm test` 통과
  - HTTP ok
  - WebSocket ok
  - map vote ok
  - bot ok
  - spectator ok

## 다음 후보

- Phase 6 마감 문서 작성
- boss telegraph/execute/recover runner는 Phase 9 보스 최신화에서 더 크게 다룸
- Phase 7 스킬 및 이펙트 품질 재작업 진입
