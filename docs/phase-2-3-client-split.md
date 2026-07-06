# Phase 2 3차: 클라이언트 책임 분리 기록

## 완료 범위

- `public/client-hud.js` 추가
- 상단 HUD의 방 코드, 스테이지, 연결 상태 표시를 `RogueHudController`로 분리
- `RogueNetworkBridge.createSocket/closeSocket` 추가
- `public/client.js`의 WebSocket 생성/종료 호출부를 네트워크 브릿지 경유로 변경
- `src/ui/HudController.ts`에 `renderTop`, `setConnection`, `formatStageLabel` 계약 추가
- Vite legacy asset 목록에 `client-hud.js` 추가
- smoke-check에 `client-hud.js` 배포/API 검증 추가

## 유지한 범위

- 기존 `npm start` 실행 경로 유지
- 기존 `public/client.js`의 heartbeat/reconnect 루프 유지
- 기존 Lobby/Choice/Map/Result 렌더링 유지

## 다음 단계

- heartbeat/reconnect 상태머신을 `NetworkClient` 계약으로 더 이동
- Lobby/Choice/Map/Result 렌더링을 controller 단위로 점진 분리
- Phase 2가 끝난 뒤 Phase 3 Pixi 렌더러 책임 분리로 이동

## 회귀 체크

- `/client-hud.js`가 200으로 응답한다.
- `/client-hud.js`가 `RogueHudController`, `renderTop`, `setConnection`, `formatStageLabel`을 노출한다.
- 상단 HUD의 방 코드, 스테이지, 연결 상태가 기존과 동일하게 표시된다.
