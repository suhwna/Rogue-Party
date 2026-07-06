# Phase 13-3: Client Save Runtime Contract

## Summary

Phase 13 테스트 자동화 확장의 세 번째 단계로 `public/client-save.js`를 Node VM 안에서 실제 실행하는 runtime contract smoke를 추가했다.

## Changes

- `smoke-check.js`
  - Node `vm` 사용
  - `client-save.js`를 fetch한 뒤 VM sandbox에서 실행
  - fake `localStorage`로 저장/로드 흐름 검증
  - `recordRunResult` 누적 통계 검증
  - `exportUserProgress` / `importUserProgress` round-trip 검증
  - 깨진 JSON load 시 `defaultProgress` 복구 검증

## Why

Phase 12에서 저장 시스템을 추가했지만, 단순 source marker 검증만으로는 실제 저장/복구 동작을 확인하기 어렵다.

이번 테스트는 브라우저 없이도 client save bridge가 런타임에서 정상 작동하는지 확인한다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
