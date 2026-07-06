# Phase 4-10 Reward Preview Registry

## 완료 내용

- `server-data-registry.js`에 `getStageRewardPreview`를 추가했다.
- `server-data-registry.js`에 `getAutoRelicChoiceBoost`, `getRelicChoiceBoost`를 추가했다.
- `server.js`의 스테이지 보상 preview 계산, 자동 유물 선택 boost 계산, 유물 선택 boost 계산을 registry 경유로 변경했다.

## 검증

- `npm run check`
- `npm run build`
- 임시 포트 `5211` 서버에서 `npm test` smoke 통과

## 다음 단계

- Phase 4 마감 문서를 작성한다.
- Phase 5 서버 시스템 분리를 시작한다.
