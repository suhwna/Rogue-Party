# Phase 10-4: Viewport Overlap Pass

## Scope

- Phase 10 UI를 실제 브라우저 viewport에서 확인했다.
- desktop `1280x720`, mobile `390x844` 기준으로 main, lobby, settings 화면의 주요 겹침을 점검했다.

## Browser Checks

- Desktop `1280x720`
  - Main menu: heading과 join form 겹침 없음.
  - Lobby: `#lobbyPanel`이 top HUD, bottom HUD와 겹치지 않음.
  - Settings: modal이 viewport 안에 들어옴.

- Mobile `390x844`
  - Main menu: 내부 스크롤 가능 확인.
  - Lobby: bottom skill dock과 lobby drawer 겹침 없음.
  - Settings: modal이 viewport보다 길어지는 문제 발견.

## Fixes

- `public/styles.css`
  - `.settings-overlay`를 `place-items: start center`와 `overflow: auto`로 조정.
  - 모바일 설정창은 overlay 내부 스크롤로 접근 가능하게 변경.

## Verification

- Browser console error: `0`
- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Notes

- Vite build의 legacy script warning은 기존 단계적 ESM 이전 구조 때문에 발생하는 예상 경고다.
- Phase 11에서는 음향이 아니라 시각 에셋/특수효과 파이프라인으로 진행한다.
