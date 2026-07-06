# Phase 5-13 CollisionSystem 1차

## 목표

`server.js`에 흩어진 순수 충돌/벡터 수학 helper를 `CollisionSystem` 경계로 이동한다.

이번 단계는 호출부를 대량 수정하지 않고, 기존 함수 이름을 유지한 채 내부 구현만 위임한다.

## 변경 사항

- `server-collision-system.js` 추가
  - `distance(a, b)`
  - `distanceToSegment(point, ax, ay, bx, by)`
  - `normalizeVector(x, y)`
  - `angleDifference(a, b)`
- `src/server/systems/CollisionSystem.ts` 추가
  - `PointLike` 계약
  - 동일 helper의 TypeScript 경계 작성
- `server.js` 변경
  - 기존 `distance`, `distanceToSegment`, `normalizeVector`, `angleDifference` 함수명을 유지
  - 내부 구현만 `collisionSystem` 경유로 전환
- `package.json` 변경
  - `npm run check`에 `server-collision-system.js` 문법 검사 추가

## 유지한 것

- 기존 충돌 판정 수식
- 기존 거리/각도 계산 결과
- 기존 호출부
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

- `CollisionSystem` 2차: 원형 충돌, 세그먼트 충돌 predicate helper 추가
- `StateSerializer` player view 분리
- `EnemySystem` 2차: 타겟 선택/군중 밀림 helper 분리
