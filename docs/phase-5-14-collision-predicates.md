# Phase 5-14 CollisionSystem Predicate 1차

## 목표

반복되는 충돌 판정식을 `CollisionSystem` predicate helper로 이동한다.

이번 단계는 충돌 공식 변경이 아니라, 기존 `distance <= radius 합`과 `distanceToSegment <= radius + width` 판정을 이름 있는 helper로 감싼다.

## 변경 사항

- `server-collision-system.js` 확장
  - `circlesOverlap(a, radiusA, b, radiusB)`
  - `segmentIntersectsCircle(point, radius, ax, ay, bx, by, width)`
- `src/server/systems/CollisionSystem.ts` 확장
  - 동일 predicate helper의 TypeScript 계약 작성
- `server.js` 변경
  - 투사체가 플레이어/적에게 맞는 원형 충돌 판정 일부를 `circlesOverlap`으로 전환
  - 적 범위 공격 원형 판정 일부를 `circlesOverlap`으로 전환
  - 적 선분 공격 판정 일부를 `segmentIntersectsCircle`로 전환

## 유지한 것

- 충돌 수식
- 피격 결과
- 넉백 방향 계산
- 서버 권위 판정
- 전투 루프 순서

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

- `StateSerializer` player view 분리
- `CollisionSystem` 3차: 충돌 layer/mask 또는 broad phase 후보 조사
- `EnemySystem` 2차: 타겟 선택/군중 밀림 helper 분리
