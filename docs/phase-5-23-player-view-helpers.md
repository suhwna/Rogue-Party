# Phase 5-23: PlayerSystem class/passive/status helper 분리

## 목적

플레이어 state/result payload에서 쓰이는 class label, class passive, player status effect 계산을 `PlayerSystem` 경계로 분리했다.

이번 단계는 전투 판정이 아니라 표시용 보조 계산만 옮겨 `server.js`의 player view 책임을 조금 더 줄였다.

## 변경 사항

- `server-player-system.js` 확장
  - `getPlayerClassLabel`
  - `getClassPassiveView`
  - `getPlayerStatusEffects`
- `src/server/systems/PlayerSystem.ts` 확장
  - class label/passive/status TypeScript 계약 작성
- `server.js` 변경
  - 기존 wrapper 함수명 유지
  - 내부 구현만 PlayerSystem 경유로 전환

## 유지한 것

- 기존 class label 규칙 유지
- 기존 passive 문구 유지
- 기존 player status effect 목록/순서 유지
- 기존 result/state payload 계약 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 7차: 플레이어 요약 view 일부 분리
- 또는 EnemySystem 4차: enemy status effect helper 분리
