# Phase 5-31: State Player Action View

## Summary

- Phase 5 서버 게임 시스템 분리의 31번째 작은 절단이다.
- `buildState()` 안에서 직접 조립하던 플레이어 스킬/대시 쿨다운과 준비 상태 payload를 `StateSerializer` helper로 분리했다.
- 기존 HUD와 클라이언트가 사용하는 필드명은 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `playerActionStateView(player, options)` 추가
  - downed, skillReady, skillCooldown, dashReady, dashCooldown, dash charges, ready, last action timestamps view 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `PlayerActionStateLike`, `PlayerActionStateViewOptions`, `PlayerActionStateView` 타입 추가
  - TypeScript 이전용 `playerActionStateView()` 계약 추가

- `server.js`
  - `buildState()`의 player payload에서 스킬/대시/준비 상태 계산을 `stateSerializer.playerActionStateView()` 경유로 전환
  - `canUseDash`, `getDashCooldownRemaining`, `getDashMaxCharges` 판정은 서버 기존 helper를 그대로 유지

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
- room summary view 분리
- StageSystem `mapNodeView(room, node)` 의존성 축소
