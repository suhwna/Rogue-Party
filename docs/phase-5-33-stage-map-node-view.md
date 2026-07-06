# Phase 5-33: Stage Map Node View

## Summary

- Phase 5 서버 게임 시스템 분리의 33번째 작은 절단이다.
- `server.js`에 남아 있던 `mapNodeView(room, node)` payload 조립 본문을 `StageSystem` helper로 이동했다.
- 서버의 trait/modifier/boss 조회 규칙은 callback으로 유지해 기존 동작을 보존했다.

## 변경 사항

- `server-stage-system.js`
  - `getMapNodeView(room, node, options)` 추가
  - 지도 노드 id, 위치, 종류, stage meta, wave trait, modifier, boss, vote count view 생성
  - CommonJS export에 helper 추가

- `src/server/systems/StageSystem.ts`
  - `StageNodeLike`에 floor/lane/trait/modifier/boss 관련 optional 필드 추가
  - `StageMapNodeViewOptions`, `StageMapNodeView` 타입 추가
  - TypeScript 이전용 `getMapNodeView()` 계약 추가

- `server.js`
  - 기존 `mapNodeView(room, node)` wrapper는 유지
  - 내부 구현을 `stageSystem.getMapNodeView()` 경유로 전환
  - trait/modifier/boss/profile view 함수는 callback으로 주입

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211` 기준 `npm test` 통과
  - HTTP ok
  - WebSocket ok
  - map vote ok
  - bot ok
  - spectator ok

## 다음 후보

- room summary view 분리
- RewardSystem 선택 상태 요약 분리
- StageSystem map choice refresh helper 분리
