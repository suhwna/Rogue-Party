# Phase 14: Release Prep Summary

## Summary

Phase 14 릴리즈 준비를 마감한다.

실행법, 내부 IP 접속, 포트 충돌 해결, 정적 파일 검증, smoke marker, 릴리즈 체크리스트를 문서화했다.

## Changes

- `README.md`
  - 설치
  - 실행
  - 포트 변경
  - 내부 IP 접속
  - 검증 명령
  - 포트 충돌 해결
  - 프로젝트 범위 노트

- `docs/release-runbook.md`
  - fresh setup
  - local run
  - temp port smoke
  - internal IP access
  - port conflict
  - static asset checks
  - runtime checks
  - Vite legacy script warning note
  - release checklist
  - deferred checks

- `package.json`
  - `release:check`: `npm run build && npm test`

## Release Commands

```bat
npm install
npm run check
npm run build
npm test
npm run release:check
npm start
```

## Notes

- SFX/BGM은 현재 범위에서 제외한다.
- visual special effects와 particle/effect pipeline은 유지한다.
- Vite build의 legacy script warning은 현재 점진 ESM 이전 단계에서 허용된다.
- browser pixel/memory/long-run E2E는 별도 harness 도입 시 확장한다.

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
- `npm run release:check`
