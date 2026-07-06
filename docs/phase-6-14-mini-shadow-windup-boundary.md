# Phase 6-14: Mini Shadow Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열네 번째 작은 절단이다.
- 헌터 준보스의 `mini_shadow_stab` 준비동작 직접 tick을 공통 `advanceEnemyWindup()` 경유로 전환했다.
- 보스/준보스 계열에서 남아 있던 수동 windup 감소 코드를 하나 더 줄였다.

## 변경 사항

- `server.js`
  - `updateHunterMiniBoss()`의 `mini_shadow_stab` windup 직접 감소/완료 처리를 `advanceEnemyWindup(enemy, "mini_shadow_stab", dt)` 경유로 변경
  - 준비 완료 payload를 `performMiniShadowStab()`에 전달해 기존 판정 좌표와 타이밍 유지

## 의도적으로 유지한 것

- 그림자 찌르기 시전 시간, 순간이동 위치, 피해 판정, cooldown은 변경하지 않았다.
- 헌터 준보스의 패턴 선택 주기는 변경하지 않았다.
- 이펙트와 투사체 로직은 변경하지 않았다.

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

- boss telegraph/execute/recover runner 분리
- boss pattern profile helper 분리
- 남은 직접 windup tick 검색 및 정리
