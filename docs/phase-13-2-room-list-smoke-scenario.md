# Phase 13-2: Room List Smoke Scenario

## Summary

Phase 13 테스트 자동화 확장의 두 번째 단계로 WebSocket join과 HTTP `/rooms` 공개 목록을 함께 검증하는 시나리오를 추가했다.

## Changes

- `smoke-check.js`
  - `checkRoomListVisibility()` 추가
  - 고유 방 코드로 WebSocket join
  - lobby state 수신 후 HTTP `/rooms`를 조회
  - 생성된 방이 목록에 노출되는지 확인
  - `code`, `status`, `playerCount`, `maxPlayers`, `hostName` 공개 필드가 올바른지 확인
  - smoke chain에 `checkRoomListVisibility` 연결

## Why

방 리스트 접속은 사용자가 방 코드를 직접 치지 않고 입장하는 주요 UX다.

기존 smoke는 `/rooms`가 배열을 반환하는지만 확인했지만, 실제 WebSocket join 이후 방 목록에 반영되는지는 검증하지 않았다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
