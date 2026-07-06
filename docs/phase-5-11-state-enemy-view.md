# Phase 5-11 StateSerializer Enemy View

## 목표

`buildState()` 안의 적 view 직렬화 코드를 `StateSerializer` 경계로 이동한다.

적 view는 렌더링, 체력바, 보스 페이즈, 돌진/넉백 보간에 직접 쓰이므로 payload 모양을 유지하는 것을 최우선으로 한다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `movementView(move, includeKey)`
  - `enemyView(enemy, options)`
  - `enemyViews(enemies, options)`
- `src/server/StateSerializer.ts` 확장
  - `MovementLike`
  - `MovementView`
  - `EnemyLike`
  - `EnemyView`
  - `EnemyViewOptions`
- `server.js` 변경
  - `buildState()`의 `enemies` payload 생성을 `stateSerializer.enemyViews(...)`로 위임
  - `enemyDefs`와 `getEnemyStatusEffects`는 options로 주입해 기존 의존성을 유지

## 유지한 것

- 클라이언트가 받는 enemy field
- 적 label/color fallback 방식
- `windup`
- `chargeMove`
- `knockbackMove`
- 상태이상 목록
- 보스 페이즈/패턴 표시
- 기존 `round2` 반올림 방식

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
  - HTTP 응답
  - WebSocket ping/pong
  - 지도 투표
  - 봇
  - 관전자

## 다음 후보

- `StateSerializer` hazard/pickup/objective view helper 분리
- `CollisionSystem` 1차: 거리/원형/세그먼트 충돌 helper 분리
- `EnemySystem` 2차: 군중 밀림/타겟 선택 같은 순수 helper 분리
