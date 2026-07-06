# Phase 5-1: RoomManager 분리

## 목표

`server.js`에 직접 들어 있던 방 생성과 공개 방 목록 생성을 별도 서버 경계로 분리한다.

## 적용 내용

- `server-room-manager.js`
  - `createRoomState(code, defaults)` 추가
  - `getOrCreateRoom(rooms, code, defaults)` 추가
  - `getPublicRooms(rooms, options)` 추가

- `src/server/RoomManager.ts`
  - `RoomDefaults`
  - `PublicRoomView`
  - `RoomLike`
  - `PublicRoomOptions`
  - 이후 TypeScript 서버 전환을 위한 typed boundary 작성

- `server.js`
  - `/rooms` 응답 생성 시 `roomManager.getPublicRooms(...)` 경유
  - 방 조회/생성 시 `roomManager.getOrCreateRoom(...)` 경유

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 스모크에서 `npm test` 통과
  - HTTP 응답
  - WebSocket ping/pong
  - 지도 투표
  - 봇
  - 관전자

## 다음 대상

- `PlayerSystem`
  - 플레이어 기본 상태 생성
  - 로비 테스트/런 시작 reset 경계
  - 파티/관전자 구분 helper

- `StateSerializer`
  - 클라이언트 송신 state shape 문서화
  - 공개 상태와 내부 상태 분리 준비

- `RewardSystem`
  - Phase 4의 `server-data-registry.js`와 연결되는 보상 적용 경계 정리
