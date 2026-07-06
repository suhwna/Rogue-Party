# Phase 10-3: Settings UI

## Scope

- Phase 10 설정 UI를 실제 화면에 추가했다.
- 음향 설정은 제외하고, 그래픽 품질/언어 저장값/키 설정만 유지한다.

## Changes

- `public/index.html`
  - 상단 HUD에 `OPT` 버튼 추가.
  - `#settingsOverlay` 추가.
  - Graphics Quality, Language, Key Bindings, Reset/Done UI 추가.

- `public/styles.css`
  - `settings-modal`, `settings-section`, `settings-segment`, `settings-key-list` 스타일 추가.
  - 모바일에서는 설정 section과 key list가 1열로 접히도록 보정.

- `public/client.js`
  - 설정 패널 열기/닫기, graphics quality 즉시 반영, language 저장, key capture/remap 추가.
  - 설정창이 열린 동안 전투 입력을 서버로 보내지 않도록 차단.
  - audio context 생성 로직을 no-op으로 전환.

- `public/client-runtime.js`, `src/settings/SettingsManager.ts`
  - `bgmVolume`, `sfxVolume`, `muted` 설정 필드 제거.
  - 기존 저장 데이터에 남아 있는 음향 필드는 normalize 과정에서 무시된다.

- `smoke-check.js`
  - settings overlay와 settings CSS marker 확인 추가.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 10-4: viewport/resize/manual UI overlap pass.
- Phase 10 closeout: UI/UX 최신화 마감 기록.
