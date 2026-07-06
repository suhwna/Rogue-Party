# Phase 4-4 스킬 슬롯 데이터 모듈 추가

## 목표

Phase 4의 네 번째 단위로 직업별 Q/E/R/F 스킬 슬롯 정의를 TypeScript 데이터로 분리했다.
이번 단계는 전체 스킬 강화 배열 이전의 안전한 선행 작업이다.

## 추가 파일

- `src/data/skills.ts`
  - 직업별 Q 기본 스킬 이름/설명
  - 직업별 E/R/F unlock 스킬 정의
  - `unlockUpgradeId`로 스킬 강화 데이터와 연결될 경계 마련
  - primary skill/name 조회 helper

## 적용 방식

- `src/data/index.ts`에 스킬 슬롯 데이터 모듈을 재수출했다.
- `src/main.ts` smoke payload가 전사 Q와 궁수 R 스킬 이름을 확인하도록 확장했다.
- 서버의 실제 스킬 실행/강화 로직은 아직 변경하지 않았다.

## 다음 단계

- `src/data/skillUpgrades.ts`에 강화 목록과 레어도 override를 분리한다.
- 이후 서버가 skill slot unlock과 강화 선택을 새 데이터에서 읽도록 점진 연결한다.

## 검증

- `npm run check`
- `npm run build`
