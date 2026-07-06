# Phase 4-6 Relic Data

## 완료 내용

- `src/data/relics.ts`를 추가해 유물과 소모성 보급품의 메타데이터를 서버 로직 밖으로 분리했다.
- 유물 ID, 이름, 설명, 희귀도, 대상, 직업 제한, 아이콘, 최대 중첩을 TypeScript에서 검증한다.
- 비활성 유물 목록을 `DISABLED_RELIC_IDS`로 분리했다.
- 직업별 유물 필터, 최대 중첩 계산, 선택 가중치 계산 helper를 추가했다.
- `src/main.ts` smoke payload에 유물 데이터 확인값을 연결했다.

## 아직 서버에 남긴 것

- 실제 `apply(player)` 함수는 아직 `server.js`에 남아 있다.
- 보상 선택/상자 드랍/유물 적용 런타임은 다음 단계에서 데이터 모듈을 읽도록 점진 이관한다.

## 검증

- `npm run check`
- `npm run build`
