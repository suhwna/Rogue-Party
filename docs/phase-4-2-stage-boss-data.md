# Phase 4-2 스테이지/보스/난이도 데이터 모듈 추가

## 목표

Phase 4 데이터 분리의 두 번째 단위로 지도, 스테이지, 챕터 난이도, 보스/준보스 데이터를 TypeScript 모듈로 복제했다.
서버 런타임은 아직 기존 `server.js` 상수를 사용하므로 게임 동작은 바꾸지 않는다.

## 추가 파일

- `src/data/difficulty.ts`
  - 파티원 수별 난이도
  - 스테이지 깊이별 난이도
  - 챕터별 난이도
  - 숫자 입력을 안전한 index로 정규화하는 helper

- `src/data/bosses.ts`
  - 챕터 보스 정의
  - 챕터 준보스 정의
  - 보스 조회 helper

- `src/data/stages.ts`
  - 스테이지 노드 메타
  - 막기/지키기 특수 타입 목록
  - 지도 route weight 기준값

## 적용 방식

- `src/data/index.ts`에 신규 모듈을 재수출했다.
- `src/main.ts` smoke payload에 신규 데이터 값을 추가해 타입 검사와 Vite 번들 검증 대상에 포함했다.
- CommonJS 서버 연결은 다음 단계에서 진행한다.

## 검증

- `npm run check`
- `npm run build`
