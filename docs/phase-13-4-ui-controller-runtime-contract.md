# Phase 13-4: UI Controller Runtime Contract

## Summary

Phase 13 테스트 자동화 확장의 네 번째 단계로 주요 DOM UI controller bridge를 Node VM에서 실제 실행하는 runtime contract smoke를 추가했다.

## Changes

- `smoke-check.js`
  - `loadWindowBridge(path, globalName)` helper 추가
  - `client-choice.js` runtime 검증
    - relic choice 필수 data attribute
    - skill choice 필수 data attribute
    - HTML escape
  - `client-result.js` runtime 검증
    - result stat/player markup
    - downed player class
    - HTML escape
  - `client-map.js` runtime 검증
    - map choice button markup
    - route board markup
    - edge/node rendering

## Why

선택 UI, 결과창, 지도 투표는 전투와 별개로 게임 흐름을 크게 좌우한다.

이 파일들은 브라우저 DOM 없이도 문자열 렌더링 계약을 확인할 수 있으므로, smoke 단계에서 빠르게 회귀를 잡을 수 있다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
