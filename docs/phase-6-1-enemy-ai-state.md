# Phase 6-1: Enemy AI State Boundary

## Summary

- Phase 6 AI 및 몬스터 시스템 개선의 첫 번째 작은 절단이다.
- 기존 적 행동을 바꾸지 않고, 현재 적이 어떤 AI 상태인지 일관되게 계산하는 helper를 추가했다.
- 이 상태값은 이후 FSM 분리, 렌더링 가시성 개선, 디버깅 기준으로 사용한다.

## 변경 사항

- `server-enemy-system.js`
  - `getEnemyAiState(enemy)` 추가
    - `dead`
    - `idle`
    - `frozen`
    - `recover`
    - `special_attack`
    - `casting`
    - `advance`
    - `objective`
    - `taunted`
    - `chase`
  - `getEnemyWindupChannel(kind)` 추가
    - `support`
    - `ranged`
    - `charge`
    - `melee`
    - `special`

- `src/server/systems/EnemySystem.ts`
  - Enemy AI 상태 계산 계약 추가
  - windup channel 계산 계약 추가

- `server-state-serializer.js`
  - enemy view에 `aiState` 추가
  - enemy view에 `windupChannel` 추가

- `server.js`
  - enemy state serialization에서 EnemySystem의 AI 상태/windup channel helper를 사용하도록 연결

## 의도적으로 유지한 것

- 몬스터 행동, 이동, 공격 타이밍은 변경하지 않았다.
- 실제 FSM 전이는 다음 단계에서 몬스터 유형별로 작게 분리한다.
- 클라이언트 렌더러는 아직 이 값을 강제 사용하지 않는다.

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

- 공통 enemy timer tick helper 분리
- caster windup advance/resolve helper 분리
- charger FSM helper 분리
