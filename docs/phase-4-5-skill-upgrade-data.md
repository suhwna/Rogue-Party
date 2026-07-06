# Phase 4-5 스킬 강화 데이터 모듈 추가

## 목표

Phase 4의 다섯 번째 단위로 스킬 강화 목록, 비활성 강화 ID, 레어도 override, 선택 가중치 계산을 TypeScript 데이터 모듈로 분리했다.
서버 런타임은 아직 기존 `server.js` 데이터를 사용하므로 실제 강화 선택 동작은 바꾸지 않는다.

## 추가 파일

- `src/data/skillUpgrades.ts`
  - 직업별 강화 목록
  - 슬롯 해금 강화
  - 요구 강화, 최소 레벨, 명시 레어도
  - 비활성 강화 ID
  - 레어도 override
  - 강화 조회/레어도/가중치 helper

## 적용 방식

- `src/data/index.ts`에 신규 모듈을 재수출했다.
- `src/main.ts` smoke payload가 전사 전설 강화와 궁수 관통 사격 가중치 계산을 확인하도록 확장했다.
- `server.js` 연결은 CommonJS/TS 경계 정리 후 별도 단계에서 진행한다.

## 검증

- `npm run check`
- `npm run build`
