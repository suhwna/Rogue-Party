# Phase 5-29: State Player Identity View

## Summary

- Phase 5 서버 게임 시스템 분리의 29번째 작은 절단이다.
- `buildState()` 안에서 직접 조립하던 플레이어 정체성/직업 표시 payload를 `StateSerializer` helper로 분리했다.
- 기존 클라이언트 필드명과 값의 의미는 유지했다.

## 변경 사항

- `server-state-serializer.js`
  - `playerIdentityView(player, options)` 추가
  - id, 이름, 봇 여부, 관전자 여부, 직업 id, 직업 표시명, 패시브, 아이콘, 색상 view를 생성
  - CommonJS export에 helper 추가

- `src/server/StateSerializer.ts`
  - `ClassVisualLike`, `PlayerIdentityLike`, `PlayerIdentityViewOptions`, `PlayerIdentityView` 타입 추가
  - TypeScript 이전용 `playerIdentityView()` 계약 추가

- `server.js`
  - `buildState()`의 player payload에서 정체성/직업 표시 필드를 `stateSerializer.playerIdentityView()` 경유로 전환
  - 서버 권위 판정, 직업 계산, 패시브 계산은 기존 경로를 유지

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

- 플레이어 position/view 좌표 payload 분리
- 플레이어 relic/skill upgrade 공개 범위 payload 분리
- StageSystem `mapNodeView(room, node)` 의존성 축소
