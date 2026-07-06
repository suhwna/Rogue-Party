# Phase 6-13: Boss Phase Transition

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 열세 번째 작은 절단이다.
- 보스 페이즈 전환 조건과 적용 수치를 `BossSystem` helper로 분리했다.
- 서버는 전환 결과를 받아 실제 보스 상태 변경, 경고 이펙트, 페이즈 전환 패턴 실행만 담당하도록 정리했다.

## 변경 사항

- `server-boss-system.js`
  - `getBossPhaseTransition(enemy)` 추가
  - 2페이즈/3페이즈 전환 threshold와 cadence/damage/barrier/warning 보정값 분리

- `src/server/systems/BossSystem.ts`
  - `BossPhaseEnemyLike`, `BossPhaseTransition` 계약 추가
  - `getBossPhaseTransition(enemy)` TypeScript helper 추가

- `server.js`
  - `getBossPhaseTransition(enemy)` wrapper 추가
  - `applyBossPhaseTransition(room, enemy, profile, target, transition)` 추가
  - `updateBossEnemy()`의 페이즈 전환 직접 계산/적용 block을 helper 기반으로 전환

## 의도적으로 유지한 것

- 기존 전환 순서를 유지했다. 체력이 한 번에 38% 이하가 되어도 기존처럼 2페이즈 전환을 먼저 처리한다.
- 페이즈 전환 시 발동하는 패턴 구성은 변경하지 않았다.
- 보스별 실제 패턴 선택 로직은 변경하지 않았다.

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
- mini boss shadow stab windup helper 분리
