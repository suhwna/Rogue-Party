# Phase 2 4차: 클라이언트 책임 분리 기록

## 완료 범위

- `RogueNetworkBridge.createConnectionSupervisor` 추가
- heartbeat 타이머, pong 갱신, stale socket close, reconnect backoff 예약을 supervisor 경유로 분리
- `src/net/ConnectionSupervisor.ts`에 TypeScript 기준 계약 추가
- `public/client-choice.js` 추가
- 렐릭 선택 카드와 스킬 강화 선택 카드의 HTML 생성 책임을 `RogueChoiceController`로 분리
- `src/ui/ChoiceController.ts`에 TypeScript 기준 선택 UI 계약 추가
- Vite legacy asset 목록에 `client-choice.js` 추가
- smoke-check에 `client-choice.js`와 network supervisor 검증 추가

## 유지한 범위

- 기존 `public/client.js`의 WebSocket 이벤트 등록 흐름 유지
- 기존 렐릭/스킬 선택 클릭 처리 흐름 유지
- 기존 Lobby/Map/Result 렌더링 유지
- 기존 `npm start` 실행 경로 유지

## 다음 단계

- Phase 2 5차에서 Lobby/Map/Result controller 분리를 계속 진행한다.
- 선택 UI의 상태키, pending 처리까지 controller로 이동할 수 있는지 검토한다.
- Phase 2 종료 후 Phase 3 Pixi 렌더러 책임 분리로 이동한다.

## 회귀 체크

- `/client-choice.js`가 200으로 응답한다.
- `/client-choice.js`가 `RogueChoiceController`, `renderRelicChoices`, `renderSkillChoices`를 노출한다.
- WebSocket ping/pong과 reconnect 예약이 기존처럼 동작한다.
- 렐릭 선택과 스킬 강화 선택이 기존처럼 클릭 가능하다.
