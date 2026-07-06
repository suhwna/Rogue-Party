# Phase 5-17: EnemySystem 군중 밀림/질량 분리

## 목적

적 이동과 충돌 해소에서 쓰이는 군중 밀림 벡터와 적 충돌 질량 계산을 `EnemySystem` 경계로 분리했다.

이번 단계는 실제 충돌 resolver 전체를 옮기지 않고, 이동감과 겹침 방지에 직접 영향을 주는 순수 계산식만 먼저 분리했다.

## 변경 사항

- `server-enemy-system.js` 확장
  - `getEnemyCrowdPush`
  - `getEnemyCollisionMass`
- `src/server/systems/EnemySystem.ts` 확장
  - `EnemyCrowdLike` 계약 추가
  - 군중 밀림/질량 계산 typed boundary 작성
- `server.js` 변경
  - 기존 `getEnemyCrowdPush(room, enemy)` wrapper 유지
  - 기존 `getEnemyCollisionMass(enemy)` wrapper 유지
  - 내부 구현만 `enemySystem` helper 경유로 전환

## 유지한 것

- 기존 적-적 군중 밀림 force 계산 유지
- 기존 보스/방벽/브루트/돌진/엘리트 질량 배율 유지
- 기존 충돌 resolver 실행 순서 유지
- 서버 권위 물리 판정 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- CollisionSystem 3차: 충돌 해소에서 쓰는 fallback separation/hash helper 분리
- 또는 SkillSystem 2차: 스킬 실행 전 공통 guard/쿨다운 적용 helper 분리
