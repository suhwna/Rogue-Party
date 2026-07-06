# Phase 5-12 StateSerializer World View

## 목표

`buildState()`에 남아 있던 장판, 유물 상자, 경험치 구슬, 스테이지 목표 view 직렬화 코드를 `StateSerializer`로 이동한다.

이번 단계는 전투 판정이나 오브젝트 생명주기를 변경하지 않고, 클라이언트로 보내는 view payload 조립만 분리한다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `hazardView`
  - `hazardViews`
  - `relicChestView`
  - `relicChestViews`
  - `xpOrbView`
  - `xpOrbViews`
  - `stageObjectiveView`
- `src/server/StateSerializer.ts` 확장
  - `HazardLike`, `HazardView`
  - `RelicChestLike`, `RelicChestView`
  - `XpOrbLike`, `XpOrbView`
  - `StageObjectiveLike`, `StageObjectiveView`
- `server.js` 변경
  - `buildState()`의 `objective`, `hazards`, `relicChests`, `xpOrbs` payload 생성을 StateSerializer 경유로 전환
  - 기존 `stageObjectiveView()` 로컬 함수 제거

## 유지한 것

- 기존 payload field 이름과 기본값
- 기존 `round2` 반올림 방식
- hazard arm/move timing field
- 스테이지 목표 label fallback
- Pixi renderer가 받는 world object view 계약

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

- `CollisionSystem` 1차: 거리/원형/세그먼트 충돌 helper 분리
- `StateSerializer` player view 분리
- `EnemySystem` 2차: 타겟 선택/군중 밀림 helper 분리
