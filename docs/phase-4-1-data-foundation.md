# Phase 4-1 데이터 기반 모듈 추가

## 목표

Phase 4의 첫 작업으로 서버 상단에 흩어져 있던 순수 데이터 상수를 TypeScript 모듈로 복제했다.
이번 단계에서는 런타임 동작을 바꾸지 않고, 이후 `server.js`, `client.js`, 렌더러가 같은 데이터 기준을 바라보도록 하는 발판만 만든다.

## 추가 파일

- `src/data/classes.ts`
  - 직업 ID, 시작 직업 목록, 봇 직업 순서
  - 직업 기본 스탯
  - 직업별 대시 프로필

- `src/data/rarity.ts`
  - 희귀도 순서
  - 희귀도별 가중치, 점수, 최대 중첩
  - 레거시 `epic -> unique` alias

- `src/data/balance.ts`
  - 기본 서버/전투/보상 타이밍 상수
  - 레벨/챕터/지도 깊이 상수
  - 엘리트/특수 패턴 관련 상수

- `src/data/rewards.ts`
  - 스테이지 타입
  - 스테이지별 보상 규칙

- `src/data/index.ts`
  - 데이터 모듈 재수출

## 적용 방식

- 기존 `server.js`는 아직 변경하지 않았다.
- `src/main.ts`에서 Phase 4 활성 상태와 데이터 smoke 값을 노출해 TypeScript/Vite 빌드가 데이터 모듈을 실제로 검사하게 했다.
- CommonJS 서버와 TypeScript 데이터 모듈 연결은 다음 Phase 4 세부 단계에서 진행한다.

## 검증

- `npm run check`
- `npm run build`
