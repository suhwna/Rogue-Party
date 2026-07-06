# Phase 5-25: StageSystem stage map view frame 분리

## 목적

지도 payload의 frame, path, available/completed node 표시 계산을 `StageSystem` 경계로 분리했다.

node별 상세 표시에는 trait/relic/boss 등의 서버 로컬 view helper가 많이 연결되어 있으므로, 이번 단계에서는 node view 콜백을 주입받는 방식으로 안전하게 분리했다.

## 변경 사항

- `server-stage-system.js` 확장
  - `getStageMapView`
- `src/server/systems/StageSystem.ts` 확장
  - stage map frame/view TypeScript 계약 작성
- `server.js` 변경
  - 기존 `stageMapView(room)` wrapper 유지
  - 내부 구현만 `stageSystem.getStageMapView` 경유로 전환
  - node 상세 view는 기존 `mapNodeView(room, node)` 콜백 유지

## 유지한 것

- 기존 `stageMap` payload 필드 유지
- 기존 node 상세 payload 유지
- 기존 current/available/completed 계산 유지
- 기존 지도 투표/진행 로직 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 7차: player summary/view 일부 분리
- 또는 StageSystem 3차: map node view 의존성 일부 분리 검토
