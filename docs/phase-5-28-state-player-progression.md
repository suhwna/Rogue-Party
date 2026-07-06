# Phase 5-28: State Player Progression View

## Summary

- Phase 5 서버 게임 시스템 분리의 28번째 작은 절단이다.
- `buildState()` 안에서 직접 조립하던 플레이어 성장/보상 요약 payload를 `StateSerializer` helper로 분리했다.
- 기존 서버 권위 판정과 클라이언트 payload shape는 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `playerProgressionView(player, options)` 추가
  - 레벨, 최대 레벨, XP, 다음 XP, 점수, 유물 수, 유물 최대치, 고유 유물 수, 전직 단계, 다음 전직 레벨 view를 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `PlayerProgressionLike`, `RelicStackLike`, `PlayerProgressionViewOptions`, `PlayerProgressionView` 타입 추가
  - TypeScript 이전용 `playerProgressionView()` 계약 추가

- `server.js`
  - `buildState()`의 player payload에서 성장/보상 요약 계산을 `stateSerializer.playerProgressionView()` 경유로 전환
  - 기존 필드명은 유지해 클라이언트 회귀를 피함

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

- 플레이어 identity/relic/skill upgrade view의 남은 inline payload 정리
- `mapNodeView(room, node)` 의존성을 StageSystem 쪽으로 더 이동
- RewardSystem의 선택/상자 요약 view 분리
