# Phase 5-20: CollisionSystem move/clamp helper 분리

## 목적

충돌 해소와 밀림 처리에서 공통으로 쓰는 객체 이동 후 월드 경계 clamp 처리를 `CollisionSystem` 경계로 분리했다.

이번 단계는 resolver 전체를 옮기지 않고, 플레이어/적 이동 wrapper 내부의 공통 좌표 갱신만 먼저 분리했다.

## 변경 사항

- `server-collision-system.js` 확장
  - `moveEntityWithinWorld`
- `src/server/systems/CollisionSystem.ts` 확장
  - `MutablePointLike`
  - `WorldBoundsLike`
  - `moveEntityWithinWorld`
- `server.js` 변경
  - 기존 `movePlayerBy(room, player, dx, dy)` wrapper 유지
  - 기존 `moveEnemyBy(room, enemy, dx, dy)` wrapper 유지
  - 내부 구현만 CollisionSystem 경유로 전환

## 유지한 것

- 플레이어 이동 margin `32` 유지
- 적 이동 margin `24` 유지
- 기존 충돌 resolver 호출부 유지
- 서버 권위 좌표 갱신 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 5차: player skill slot/stat view helper 분리
- 또는 CollisionSystem 5차: player/enemy collision resolver 일부 분리 검토
