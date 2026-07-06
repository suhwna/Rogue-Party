# Phase 5-22: StateSerializer 플레이어 movement view 재사용

## 목적

플레이어 state payload 안의 `dashMove`, `knockbackMove` view 조립을 `StateSerializer.movementView`로 통합했다.

적 movement view에서 이미 쓰던 helper를 플레이어 payload에도 재사용해, 움직임 상태 직렬화 책임을 더 명확히 했다.

## 변경 사항

- `server-state-serializer.js` 변경
  - 기존 `movementView`를 module exports에 추가
- `server.js` 변경
  - 플레이어 `dashMove` inline payload 조립 제거
  - 플레이어 `knockbackMove` inline payload 조립 제거
  - 둘 다 `stateSerializer.movementView` 경유로 전환

## 유지한 것

- 기존 dash payload 필드 유지
  - `active`
  - `style`
  - `progress`
  - `fromX`
  - `fromY`
  - `toX`
  - `toY`
- 기존 knockback payload 필드 유지
  - `active`
  - `style`
  - `progress`
- 기존 클라이언트 렌더링 계약 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- PlayerSystem 2차: 플레이어 class/passive/status helper 분리
- 또는 StateSerializer 7차: player summary/view 조립 일부 분리 검토
