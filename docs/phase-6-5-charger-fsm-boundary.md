# Phase 6-5: Charger FSM Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 다섯 번째 작은 절단이다.
- 돌진 windup에서 실제 dash로 넘어가는 전이를 `advanceChargeWindup()` wrapper로 묶었다.
- 돌진 종료 후 쿨다운 계산을 `EnemySystem.getChargeDashCooldown()`으로 분리했다.

## 변경 사항

- `server-enemy-system.js`
  - `getChargeDashCooldown(enemy)` 추가
  - 일반 돌진몹/엘리트/준보스/보스의 기존 쿨다운 수식을 helper로 이동

- `src/server/systems/EnemySystem.ts`
  - `getChargeDashCooldown(enemy)` TypeScript 계약 추가
  - boss/miniboss/phase 기반 쿨다운 계산 계약 반영

- `server.js`
  - `beginChargerDash(room, enemy, windup?)`가 완료된 windup payload를 받을 수 있게 변경
  - 일반 charger windup 처리 경로를 `advanceChargeWindup()` 경유로 전환
  - legacy miniboss, duelist miniboss, charge boss, defense objective charge 경로를 `advanceChargeWindup()` 경유로 전환
  - dash 종료 후 `enemy.chargeTimer` 계산을 `getChargeDashCooldown(enemy)` 경유로 전환

## 의도적으로 유지한 것

- 돌진 속도, 거리, 예측 정확도, damage, hit 판정은 변경하지 않았다.
- 실제 dash collision과 플레이어 피해 판정은 아직 `server.js`에 남겼다.
- 돌진 시작 조건과 전조 이펙트는 기존 로직을 유지했다.

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

- stalker/brute windup advance helper 적용
- bomber explode windup helper 분리
- boss telegraph/execute helper 분리
