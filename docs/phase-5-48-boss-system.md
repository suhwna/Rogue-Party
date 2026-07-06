# Phase 5-48: Boss System

## Summary

- Phase 5 서버 게임 시스템 분리의 48번째 작은 절단이다.
- 챕터 보스/준보스 프로필 선택과 보스 표시 view helper를 별도 `BossSystem` 경계로 분리했다.
- 보스 AI와 패턴 실행 본체는 Phase 6에서 FSM/패턴 구조로 다룰 예정이며, 이번 단계는 데이터 조회와 직렬화용 순수 helper만 분리했다.

## 변경 사항

- `server-boss-system.js`
  - `getChapterBossProfile(chapter, bosses, maxChapters)` 추가
  - `getMiniBossProfile(chapter, miniBosses, maxChapters)` 추가
  - `getBossProfileById(id, bosses)` 추가
  - `bossProfileView(profile)` 추가

- `src/server/systems/BossSystem.ts`
  - `BossProfileLike` 타입 추가
  - 보스/준보스 프로필 조회 helper 계약 추가
  - 지도/상태 payload에 쓰이는 보스 프로필 view 계약 추가

- `server.js`
  - `server-boss-system` require 추가
  - 기존 `getChapterBossProfile`, `getMiniBossProfile`, `getBossProfileById`, `bossProfileView` wrapper 내부 구현을 BossSystem 경유로 전환
  - 기존 호출부와 런타임 동작은 유지

- `package.json`
  - `npm run check`에 `node --check server-boss-system.js` 추가

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

- Phase 5 마감 문서 작성
- room lobby reset helper 분리
- Phase 6 AI/FSM 작업으로 진입
