# Phase 5-9 ProjectileSystem 1차

## 목표

`server.js` 안에 남아 있던 투사체 이동/만료/정리 생명주기 계산을 작은 서버 시스템 경계로 분리한다.

이번 단계는 투사체 생성, 피격 판정, 상태이상 적용까지 옮기지 않는다. 판정 흐름을 유지한 채, 회귀 위험이 낮은 순수 생명주기 helper만 먼저 분리한다.

## 변경 사항

- `server-projectile-system.js` 추가
  - `advanceProjectile(projectile, dt)`
  - `isProjectileExpired(projectile, world)`
  - `expireProjectileIfNeeded(projectile, world)`
  - `filterLiveProjectiles(projectiles)`
- `src/server/systems/ProjectileSystem.ts` 추가
  - TypeScript 이전을 위한 `ProjectileLike`, `WorldBounds` 계약 작성
  - CommonJS helper와 같은 계산 경계 유지
- `server.js` 변경
  - `updateProjectiles()`의 이동/만료 처리를 ProjectileSystem으로 위임
  - 프레임 종료 시 죽은 투사체 정리를 ProjectileSystem으로 위임
- `package.json` 변경
  - `npm run check`에 `server-projectile-system.js` 문법 검사 추가

## 유지한 것

- 투사체 생성 위치
- 플레이어 투사체 피격 판정
- 적 투사체 피격 판정
- 독/스플래시/연쇄 번개 처리
- 서버 권위 판정
- 기존 `updateProjectiles(room, dt)` 호출 흐름

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

- `StateSerializer`의 projectile/player/enemy view helper 분리
- `ProjectileSystem` 2차: 투사체 view serialization 또는 생성 factory 경계 분리
- `CollisionSystem` 1차: 거리/원형 충돌 순수 helper 분리
