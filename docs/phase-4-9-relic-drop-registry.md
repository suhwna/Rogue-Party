# Phase 4-9 Relic Drop Registry

## 완료 내용

- `server-data-registry.js`에 `getStageChestLimit`를 추가했다.
- `server-data-registry.js`에 `getRelicChestDropDecision`를 추가했다.
- `server.js`의 상자 제한 계산과 처치 시 유물 상자 드랍 확률 계산을 registry 경유로 변경했다.
- 상자 스폰 위치, 이펙트, 이벤트는 아직 `server.js`에 남겨 서버 시스템 분리 전 동작 변경 폭을 낮췄다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 `5211` 서버에서 `npm test` smoke 통과

## 다음 단계

- 스테이지 보상 preview와 보상 선택 boost 계산을 registry로 더 좁힌다.
- Phase 5에서 RewardSystem으로 옮기기 전까지 서버 inline 계산식을 계속 줄인다.
