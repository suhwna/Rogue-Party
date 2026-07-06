# Phase 5-18: CollisionSystem fallback separation 분리

## 목적

충돌 해소 중 두 객체가 같은 위치에 가까워 방향 벡터를 만들 수 없을 때 사용하는 fallback separation 계산을 `CollisionSystem` 경계로 분리했다.

이번 단계는 충돌 resolver 전체를 옮기지 않고, 해시 기반 fallback 방향 계산만 먼저 분리해 충돌 시스템의 순수 함수 경계를 넓혔다.

## 변경 사항

- `server-collision-system.js` 확장
  - `hashCollisionId`
  - `fallbackSeparationVector`
- `src/server/systems/CollisionSystem.ts` 확장
  - fallback separation TypeScript 계약 작성
- `server.js` 변경
  - 기존 `fallbackSeparationVector`
  - 기존 `hashCollisionId`
  - 두 wrapper 모두 내부 구현만 CollisionSystem 경유로 전환

## 유지한 것

- 기존 해시 계산식 유지
- 기존 fallback 각도 계산식 유지
- 기존 플레이어-적, 적-적, 플레이어-플레이어 충돌 resolver 순서 유지
- 서버 권위 충돌 판정 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- SkillSystem 2차: 스킬 실행 전 공통 guard/쿨다운 적용 helper 분리
- 이후 CollisionSystem 4차: 충돌 move/clamp helper 또는 resolver 일부 분리 검토
