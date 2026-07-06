# Phase 6-10: Special Pattern Policy

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열 번째 작은 절단이다.
- 엘리트, 미니보스, 보스 특수 패턴의 빈도 제어 정책을 `EnemySystem`으로 분리했다.
- 기존 호출부 이름은 유지하고 내부 구현만 helper 경유로 전환해 동작 회귀 위험을 낮췄다.

## 변경 사항

- `server-enemy-system.js`
  - `allowSpecialPatternNow(enemy, channel)` 추가
  - `deferSpecialPattern(enemy, channel)` 추가
  - `setSpecialPatternTimer(enemy, channel, seconds)` 추가
  - `getBasicPatternWindow(enemy, channel)` 추가
  - `getSpecialPatternCooldownMultiplier(enemy, channel)` 추가
  - `getEliteSpecialCooldown(enemy)` 추가

- `src/server/systems/EnemySystem.ts`
  - `SpecialPatternEnemyLike` 계약 추가
  - 특수 패턴 cycle, defer, timer, cooldown multiplier, elite cooldown helper 추가

- `server.js`
  - 기존 `allowSpecialPatternNow`, `deferSpecialPattern`, `setSpecialPatternTimer`, `getBasicPatternWindow`, `getSpecialPatternCooldownMultiplier`, `getEliteSpecialCooldown` 본문을 `EnemySystem` 경유 wrapper로 전환

## 의도적으로 유지한 것

- 특수 패턴 사용 비율은 기존 10-step cycle과 3/7/10 step 정책을 유지했다.
- 보스/미니보스/엘리트의 실제 패턴 선택, 피해량, 전조 시간은 변경하지 않았다.
- 패턴이 실패했을 때 defer되는 타이머 정책도 기존 값 그대로 유지했다.

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
- elite windup advance를 공통 windup helper 경유로 전환
- 일반 몬스터 FSM 상태 전이 helper 확장
