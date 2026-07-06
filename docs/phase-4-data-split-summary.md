# Phase 4 Data Split Summary

## 완료 범위

- TypeScript 데이터 모듈을 추가했다.
  - `classes`
  - `rarity`
  - `balance`
  - `rewards`
  - `difficulty`
  - `bosses`
  - `stages`
  - `enemies`
  - `waveTraits`
  - `risks`
  - `skills`
  - `skillUpgrades`
  - `relics`
- `src/data/index.ts`로 데이터 모듈 재수출 경계를 만들었다.
- `src/main.ts` smoke payload가 Phase 4 데이터 값을 확인한다.
- `server-data-registry.js`로 CommonJS 서버 런타임용 데이터/계산 경계를 만들었다.
- `server.js`의 일부 계산을 registry로 위임했다.
  - 희귀도 정규화/라벨
  - 스킬 강화 희귀도/선택 가중치
  - 유물 최대 중첩/선택 가중치
  - 유물/보급 효과 적용
  - 상자 제한/드랍 판정
  - 스테이지 보상 preview
  - 자동 유물 선택 boost

## 남은 작업

- `server.js`에는 여전히 방, 플레이어, 적, 스킬, 투사체, 충돌, 스테이지, 보상, 보스, 봇 로직이 같이 있다.
- Phase 5에서 시스템 단위로 분리한다.
- TypeScript 데이터 모듈과 CommonJS registry의 중복은 Phase 5/빌드 전환 과정에서 줄인다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 `5211` 서버에서 `npm test` smoke 통과
