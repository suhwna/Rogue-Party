# Phase 4-7 Server Data Registry

## 완료 내용

- `server-data-registry.js`를 추가했다.
- 서버 런타임이 CommonJS 상태에서도 희귀도/가중치 계산을 독립 모듈로 호출할 수 있게 했다.
- `server.js`의 다음 계산을 registry로 위임했다.
  - 유물 최대 중첩 계산
  - 유물 선택 가중치 계산
  - 스킬 강화 희귀도 계산
  - 스킬 강화 선택 가중치 계산
- `package.json`의 `check` 스크립트에 `server-data-registry.js` 문법 검사를 추가했다.

## 검증

- `npm run check`
- `npm run build`
- `PORT=5211 npm start` 상당의 임시 서버 실행
- `SMOKE_ORIGIN=http://localhost:5211 npm test` 상당의 smoke 실행

## 다음 단계

- 유물 `apply(player)` 로직을 안전하게 effect key 기반으로 나눌 수 있는 중간 구조를 만든다.
- 보상 선택과 상자 드랍 계산을 registry 경유로 더 좁힌다.
