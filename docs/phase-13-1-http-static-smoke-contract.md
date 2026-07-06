# Phase 13-1: HTTP Static Smoke Contract

## Summary

Phase 13 테스트 자동화 확장의 첫 단계로 HTTP/static 배포 계약을 강화했다.

목표는 브라우저에 진입하기 전에 HTML이 참조하는 JS/CSS 파일이 404 없이 실제 파일로 응답하는지 자동 확인하는 것이다.

## Changes

- `smoke-check.js`
  - `checkLinkedAssetResponses(html)` 추가
  - `index.html`의 `script src`와 `link href`를 파싱해 내부 정적 파일을 모두 fetch한다.
  - JS/CSS 요청이 HTML fallback으로 돌아오는 경우를 실패 처리한다.
  - linked asset coverage가 비정상적으로 낮으면 실패 처리한다.
  - `/rooms` 응답이 비어 있지 않을 경우 public room field shape를 확인한다.

## Why

기존 smoke는 주요 파일을 직접 몇 개씩 확인했지만, `index.html`에 새 스크립트를 추가하고 정적 서빙을 누락하는 회귀를 놓칠 수 있었다.

이번 변경으로 entry HTML에 연결된 정적 파일 전체를 자동 확인한다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
