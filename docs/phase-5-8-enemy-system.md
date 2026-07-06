# Phase 5-8: EnemySystem 1차 분리

## 목표

적 생성/AI 전체를 한 번에 이동하지 않고, 순수 계산 helper를 `EnemySystem` 경계로 분리한다.

스폰 위치, AI 상태 전이, 공격 실행, 피해 판정은 아직 `server.js`에 유지한다.

## 적용 내용

- `server-enemy-system.js`
  - `isEnemyTypeUnlocked(type, wave, blockadeRunnerTypes)`
  - `isRangedPressureEnemyType(type)`
  - `getHostileProjectileCap(options)`
  - `countHostileProjectiles(projectiles)`
  - `canSpawnHostileProjectile(projectiles, options)`
  - `countEnemiesOfType(enemies, type)`

- `src/server/systems/EnemySystem.ts`
  - `ProjectileLike`
  - `EnemyLike`
  - `HostileProjectileCapOptions`
  - 런타임 helper와 같은 typed boundary 추가

- `server.js`
  - 적 타입 해금 판정을 EnemySystem으로 위임
  - 원거리 압박 몹 판정을 EnemySystem으로 위임
  - hostile projectile cap/count 계산을 EnemySystem으로 위임
  - 특정 타입 생존 적 카운트를 EnemySystem으로 위임

- `package.json`
  - `npm run check`에 `server-enemy-system.js` 문법 검사 추가

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
  - HTTP 응답
  - WebSocket ping/pong
  - 지도 투표
  - 봇
  - 관전자

## 다음 대상

- `StateSerializer` 2차
  - room view/player view/enemy view 조립 helper 분리

- `EnemySystem` 2차
  - 적 상태 효과 감소/캐스팅 interrupt helper 분리

- `ProjectileSystem`
  - projectile cap, 생성 옵션, dead filtering helper 분리
