# Phase 5-24: EnemySystem status effect helper 분리

## 목적

적 state payload에서 쓰이는 status effect 목록 계산을 `EnemySystem` 경계로 분리했다.

이번 단계는 전투 판정이 아니라 표시용 상태 목록 계산만 옮겨 `server.js`의 enemy view 보조 책임을 줄였다.

## 변경 사항

- `server-enemy-system.js` 확장
  - `getEnemyStatusEffects`
- `src/server/systems/EnemySystem.ts` 확장
  - `EnemyStatusLike`
  - `getEnemyStatusEffects`
- `server.js` 변경
  - 기존 `getEnemyStatusEffects(enemy)` wrapper 유지
  - 내부 구현만 EnemySystem 경유로 전환

## 유지한 것

- 기존 적 status effect 목록 유지
- 기존 status effect 순서 유지
- 기존 enemy state payload 계약 유지
- 기존 클라이언트 렌더링 계약 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 7차: player summary/view 일부 분리
- 또는 StageSystem 2차: stage map/path view helper 분리
