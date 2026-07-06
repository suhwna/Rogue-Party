# Phase 13: Test Automation Summary

## Summary

Phase 13 테스트 자동화 확장을 마감한다.

이번 Phase는 대형 브라우저 E2E 도입 대신, 현재 프로젝트 구조에 맞춰 빠르게 반복 가능한 smoke coverage를 확장하는 데 집중했다.

## Completed Scope

- HTTP/static 배포 계약 강화
  - `index.html` linked asset fetch
  - JS/CSS HTML fallback 방지
  - linked asset coverage 최소값 검사

- `/rooms` 회귀 방지
  - 빈 목록 JSON shape 확인
  - joined room이 `/rooms`에 노출되는지 확인
  - public room field 검증

- client save runtime contract
  - `client-save.js` VM 실행
  - fake `localStorage`
  - save/load
  - broken JSON recovery
  - run result recording
  - progress import/export

- UI controller runtime contract
  - `client-choice.js` VM 실행
  - `client-result.js` VM 실행
  - `client-map.js` VM 실행
  - 주요 markup, data attribute, HTML escape 검증

- 기존 WebSocket smoke 유지
  - join/lobby
  - lobby action test
  - class change
  - ready/start
  - map vote
  - combat state
  - bot
  - spectator

## Smoke Output

정상 smoke 출력은 다음 marker를 포함한다.

```txt
http ok
save contract ok
ui contract ok
ws ok
room list ok
map vote ok
bot ok
spectator ok
```

## Deferred

- 실제 브라우저 픽셀 non-blank 검증
- 장시간 메모리 증가 자동 측정
- 게임오버까지 도달하는 장거리 E2E
- 다중 실제 브라우저 2인/4인 입력 시나리오

위 항목은 Playwright 또는 별도 browser harness 도입 시 확장한다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
