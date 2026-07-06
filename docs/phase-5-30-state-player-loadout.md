# Phase 5-30: State Player Loadout View

## Summary

- Phase 5 서버 게임 시스템 분리의 30번째 작은 절단이다.
- `buildState()` 안에서 직접 조립하던 플레이어 유물/스킬 강화/선택지 공개 범위 payload를 `StateSerializer` helper로 분리했다.
- 본인에게만 노출되는 유물 목록과 pending skill choices 규칙은 기존 그대로 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `playerLoadoutView(player, options)` 추가
  - self-only relics, skill upgrades, skill upgrade names, self-only pending skill choices, choice pending view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `PlayerLoadoutLike`, `PlayerLoadoutViewOptions`, `PlayerLoadoutView` 타입 추가
  - TypeScript 이전용 `playerLoadoutView()` 계약 추가

- `server.js`
  - `buildState()`의 player payload에서 유물/스킬 강화/선택지 노출 계산을 `stateSerializer.playerLoadoutView()` 경유로 전환
  - 기존 공개 범위와 필드명 유지

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

- 플레이어 position view 분리
- 플레이어 cooldown/action state view 분리
- StageSystem `mapNodeView(room, node)` 의존성 축소
