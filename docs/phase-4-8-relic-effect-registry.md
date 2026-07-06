# Phase 4-8 Relic Effect Registry

## 완료 내용

- `server-data-registry.js`에 `REWARD_EFFECTS`를 추가했다.
- 현재 유물과 소모성 보급품 효과를 ID별 operation 배열로 표현했다.
- `server.js`의 `applyRelicReward`가 registry 효과를 우선 적용하도록 변경했다.
- 누락된 효과가 있으면 기존 `reward.apply(player)`로 fallback한다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 `5211` 서버에서 `npm test` smoke 통과

## 다음 단계

- 서버에 남은 대형 상수 테이블을 Phase 5 시스템 분리 전에 더 작은 registry 경계로 줄인다.
- 보상 선택/상자 드랍 계산과 데이터 카탈로그의 중복을 더 줄인다.
