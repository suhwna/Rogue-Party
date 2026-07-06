# Phase 5-10 StateSerializer Projectile View

## 목표

`buildState()` 안에 직접 작성되어 있던 투사체 직렬화 코드를 `StateSerializer` 경계로 옮긴다.

이번 단계는 state 전체를 한 번에 분리하지 않는다. 클라이언트 payload 모양을 유지한 채, 투사체 view만 먼저 분리한다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `projectileView(projectile)`
  - `projectileViews(projectiles)`
- `src/server/StateSerializer.ts` 확장
  - `ProjectileLike`
  - `ProjectileView`
  - `projectileView`
  - `projectileViews`
- `server.js` 변경
  - `buildState()`의 `projectiles` payload 생성을 `stateSerializer.projectileViews(room.projectiles)`로 위임

## 유지한 것

- 클라이언트가 받는 projectile field
  - `id`
  - `classId`
  - `x`
  - `y`
  - `radius`
  - `hostile`
  - `angle`
  - `style`
  - `poison`
  - `splash`
  - `pierce`
- 기존 `round2` 반올림 방식
- 서버 권위 판정
- Pixi projectile renderer 계약

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

- `StateSerializer` enemy/hazard/pickup view helper 분리
- `CollisionSystem` 1차: 거리/원형 충돌 helper 분리
- `ProjectileSystem` 2차: 투사체 생성 factory 또는 collision 처리 경계 분리
