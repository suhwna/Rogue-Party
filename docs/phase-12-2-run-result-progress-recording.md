# Phase 12-2: Run Result Progress Recording

## Summary

Phase 12-1에서 추가한 progress save schema를 실제 게임 결과창 흐름에 연결했다.

이번 단계의 목표는 게임 실패 또는 클리어 결과가 표시될 때 localStorage 진행 기록에 런 통계가 누적되도록 만드는 것이다.

## Changes

- `public/client.js`
  - 결과창 렌더링 시 `recordDisplayedResult(result, nextState)`를 호출한다.
  - 같은 gameover state가 여러 번 렌더링되어도 `lastRecordedResultKey`로 한 번만 기록한다.
  - `getResultSaveKey(result, nextState)`를 추가해 방 코드, 결과, 챕터, 스테이지, 점수, 플레이어 요약 기반의 안정적인 중복 방지 키를 만든다.
  - `saveUserProgress()` 성공 시 `clientDiagnostics.progressSaveFailed`를 정상적으로 false로 되돌린다.
  - 기록 후 `clientDiagnostics.progressRuns`로 누적 런 수를 노출한다.

- `smoke-check.js`
  - 클라이언트 배포 파일에 결과 저장 연결 marker가 포함되는지 확인한다.

## Stored Data

기록 대상은 Phase 12-1 schema를 그대로 사용한다.

- `statistics.runs`
- `statistics.victories`
- `statistics.defeats`
- `statistics.highestChapter`
- `statistics.highestStage`
- `statistics.highestLevel`
- `statistics.totalScore`
- `statistics.totalRelics`
- `statistics.totalPlaySeconds`
- `bestClear`

## Notes

- 서버 권위 결과인 `room.result`가 있으면 우선 사용한다.
- `room.result`가 없으면 기존 `createFallbackResult(nextState)` 결과를 저장한다.
- 결과창을 닫지 않고 state frame이 반복 수신되어도 같은 결과는 중복 저장하지 않는다.
- 진행 기록 UI 노출은 이번 단계 범위에 포함하지 않는다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
