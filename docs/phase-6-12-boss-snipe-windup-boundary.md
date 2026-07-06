# Phase 6-12: Boss Snipe Windup Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열두 번째 작은 절단이다.
- 보스/준보스 계열의 `snipe` windup 직접 tick을 공통 wrapper로 묶었다.
- 레거시 준보스, 헌터 준보스, void 보스의 사격 준비 완료 처리를 같은 경계에서 수행하도록 정리했다.

## 변경 사항

- `server.js`
  - `advanceBossSnipeWindup(room, enemy, dt, onReady)` 추가
  - 레거시 준보스 `snipe` 준비동작을 wrapper 경유로 전환
  - 헌터 준보스 `snipe` 준비동작을 wrapper 경유로 전환
  - void 보스 `snipe` 준비동작을 wrapper 경유로 전환
  - 준비 완료 payload를 callback으로 넘겨 기존 split shot, cooldown, projectile 로직을 유지

## 의도적으로 유지한 것

- 보스/준보스 사격 전조 시간, 투사체 속도, 피해량, 추가 분열탄 로직은 변경하지 않았다.
- 실제 보스 패턴 선택 로직은 변경하지 않았다.
- `advanceBossSnipeWindup`은 서버 실행 callback을 받는 얇은 경계로만 두었다.

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

- boss phase transition profile/helper 분리
- boss telegraph/execute/recover runner 분리
- mini boss shadow stab windup helper 분리
