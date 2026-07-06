# Phase 5-49: Network Server

## Summary

- Phase 5 서버 게임 시스템 분리의 49번째 작은 절단이다.
- WebSocket handshake, frame decode, JSON frame encode/write helper를 `NetworkServer` 경계로 분리했다.
- HTTP routing, room join, message dispatch, 서버 권위 판정 흐름은 그대로 유지했다.

## 변경 사항

- `server-network-server.js`
  - `createWebSocketAcceptKey(key)` 추가
  - `createWebSocketHandshakeResponse(key)` 추가
  - `readFrame(buffer)` 추가
  - `encodeTextPayload(payload)` 추가
  - `encodeJsonFrame(message)` 추가
  - `writeJson(socket, message)` 추가

- `src/server/NetworkServer.ts`
  - WebSocket frame view/limits 타입 추가
  - frame header length, text/close frame 판정, oversized frame 판정 helper 계약 추가
  - Node 타입 의존 없이 이후 TypeScript 서버 이전을 위한 최소 경계 작성

- `server.js`
  - 직접 `crypto` 사용 제거
  - WebSocket handshake response 생성을 `networkServer.createWebSocketHandshakeResponse()` 경유로 전환
  - `readFrame()` wrapper 내부 구현을 `networkServer.readFrame()` 경유로 전환
  - `send()` wrapper 내부 구현을 `networkServer.writeJson()` 경유로 전환

- `package.json`
  - `npm run check`에 `node --check server-network-server.js` 추가

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
- Phase 6 AI/FSM 작업으로 진입
