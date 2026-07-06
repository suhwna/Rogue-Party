# Phase 5-26: StateSerializer player input view 분리

## 목적

플레이어 state payload에서 쓰이는 입력/조준 view 계산을 `StateSerializer` 경계로 분리했다.

`aimX`, `aimY`, `facing`, `moveX`, `moveY`, `attacking`은 모두 렌더링용 payload 계산이므로 `server.js`의 view 조립 책임에서 분리했다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `playerInputView`
- `src/server/StateSerializer.ts` 확장
  - `PlayerInputLike`
  - `PlayerInputView`
  - `playerInputView`
- `server.js` 변경
  - 플레이어 state map 안의 aim/move/facing/attacking 계산을 StateSerializer 경유로 전환

## 유지한 것

- 기존 fallback aim 규칙 유지
- 기존 move fallback 규칙 유지
- 기존 2자리 반올림 유지
- 기존 player state payload 필드 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 8차: player scalar summary view 일부 분리
- 또는 StageSystem 3차: map node view 의존성 일부 분리 검토
