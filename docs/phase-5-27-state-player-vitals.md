# Phase 5-27: StateSerializer player vitals view 분리

## 목적

플레이어 state payload에서 쓰이는 생존/이동/기력 계열 숫자 view를 `StateSerializer` 경계로 분리했다.

이번 단계는 HP, 보호막, 속도, 피격 무적 시간, 크기 배율, 도발 방어 시간, 무투가 기력 표시처럼 렌더링용 scalar 값만 대상으로 했다.

## 변경 사항

- `server-state-serializer.js` 확장
  - `playerVitalsView`
- `src/server/StateSerializer.ts` 확장
  - `PlayerVitalsLike`
  - `PlayerVitalsViewOptions`
  - `PlayerVitalsView`
  - `playerVitalsView`
- `server.js` 변경
  - player state map 안의 vitals/scalar 계산 일부를 StateSerializer 경유로 전환

## 유지한 것

- 기존 HP/보호막 반올림 규칙 유지
- 기존 speed/size/taunt/chi 반올림 규칙 유지
- 기존 player state payload 필드 유지
- 기존 클라이언트 렌더링 계약 유지

## 검증

- `npm run check` 통과
- `npm run build` 통과
- 임시 포트 `5211`에서 `npm test` 통과
- 임시 테스트 서버 종료 확인

## 다음 단계

- StateSerializer 9차: player progression/reward summary view 일부 분리
- 또는 StageSystem 3차: map node view 의존성 일부 분리 검토
