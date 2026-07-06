# Phase 5-40: Reward Choice Summary

## Summary

- Phase 5 서버 게임 시스템 분리의 40번째 작은 절단이다.
- 유물 선택 대기 상태를 count/has/pending ids로 묶는 `RewardSystem` summary helper를 추가했다.
- 기존 유물 선택 대기 흐름과 클라이언트 payload 값은 유지했다.

## 변경 사항

- `server-reward-system.js`
  - `getRelicChoiceSummary(players)` 추가
  - pendingCount, hasPending, pendingPlayerIds 반환
  - 기존 `hasPendingRelicChoice()`와 `countPendingRelicChoices()`가 summary helper를 경유하도록 정리

- `src/server/systems/RewardSystem.ts`
  - `RelicChoiceSummary` 타입 추가
  - `RelicChoicePlayerLike`에 optional `id` 추가
  - TypeScript 이전용 `getRelicChoiceSummary()` 계약 추가

- `server.js`
  - 유물 선택 자동 종료 후 pending 확인과 state pending count wrapper가 `rewardSystem.getRelicChoiceSummary()`를 사용하도록 전환

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

- Result serializer helper 분리
- RewardSystem relic choice timeout 처리 helper 분리
- room stage summary view 분리
