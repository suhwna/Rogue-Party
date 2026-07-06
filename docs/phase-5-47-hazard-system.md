# Phase 5-47: Hazard System

## Summary

- Phase 5 서버 게임 시스템 분리의 47번째 작은 절단이다.
- hazard 생명주기 필터와 소유 hazard 조회 helper를 별도 `HazardSystem` 경계로 분리했다.
- 전투 루프의 기존 hazard 제거 동작과 engineer/puppeteer/alchemist 계열 소유 hazard trimming 동작은 유지했다.

## 변경 사항

- `server-hazard-system.js`
  - `filterLiveHazards(hazards)` 추가
  - `getOwnedHazards(hazards, ownerId, type?)` 추가
  - `countOwnedHazards(hazards, ownerId, type?)` 추가

- `src/server/systems/HazardSystem.ts`
  - `HazardLike` 타입 추가
  - TypeScript 이전용 live filter / owned hazards 계약 추가

- `server.js`
  - `server-hazard-system` require 추가
  - 전투 루프의 hazard live filter를 `hazardSystem.filterLiveHazards()` 경유로 전환
  - `trimOwnedHazards()`의 owned hazard 조회를 `hazardSystem.getOwnedHazards()` 경유로 전환

- `package.json`
  - `npm run check`에 `node --check server-hazard-system.js` 추가

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

- BossSystem 경계 추가
- Phase 5 마감 문서 작성
- room lobby reset helper 분리
