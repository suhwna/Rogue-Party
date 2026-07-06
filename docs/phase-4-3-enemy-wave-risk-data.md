# Phase 4-3 적/웨이브/위험방 데이터 모듈 추가

## 목표

Phase 4의 세 번째 단위로 적 기본 정의, 웨이브 특성, 위험방 modifier 데이터를 TypeScript 모듈로 복제했다.
아직 서버 로직은 기존 `server.js` 상수를 사용하므로 게임 플레이 동작은 유지된다.

## 추가 파일

- `src/data/enemies.ts`
  - 적 타입 목록
  - 적 기본 스탯/역할/색상
  - 기본몹/원거리 압박몹 그룹
  - 방어 스테이지 등장 가중치
  - 웨이브별 적 해금 helper

- `src/data/waveTraits.ts`
  - 군세/방벽/의식/폭주/보스 관문 특성
  - anchor type, spawn/hp/damage/speed modifier
  - 적 bias 가중치
  - 웨이브 번호 기반 trait 선택 helper

- `src/data/risks.ts`
  - 보통 방, 군세 방, 유리 방, 문지기 방 modifier 정의
  - id 기반 조회 helper

## 적용 방식

- 신규 데이터 모듈을 `src/data/index.ts`에 재수출했다.
- `src/main.ts` smoke payload가 적 해금, 적 역할, 웨이브 trait, 위험방 값을 확인하도록 확장했다.

## 검증

- `npm run check`
- `npm run build`
