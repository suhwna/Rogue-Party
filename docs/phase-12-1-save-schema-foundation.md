# Phase 12-1: Save Schema Foundation

## Scope

- 설정 저장은 v2 migration 경계를 만들고, 진행도 저장은 별도 progress save로 분리했다.
- Audio/SFX/BGM 설정은 계속 제외했다.
- 런 결과 자동 기록 UI/흐름 연결은 다음 단계로 남겼다.

## Changes

- `public/client-save.js`
  - `RogueSaveManager` bridge 추가.
  - `SAVE_VERSION`, `PROGRESS_KEY`, `defaultProgress` 추가.
  - `normalizeProgress`, `migrateProgress`, `loadUserProgress`, `saveUserProgress`, `resetUserProgress`, `recordRunResult` 추가.

- `src/settings/SaveSchema.ts`
  - `UserProgress`, `BestClearRecord`, `ProgressStatistics`, `RunResultRecord` 타입 추가.

- `src/settings/SaveManager.ts`
  - versioned progress load/save/reset/update/record API 추가.

- `public/client-runtime.js`
  - settings version을 v2로 올리고 legacy v1 key migration 경계 추가.

- `src/settings/SettingsManager.ts`
  - TS SettingsManager도 v2/legacy v1 migration 경계로 정렬.

- `public/client.js`
  - `window.__rogueProgress` debug/control bridge 추가.
  - diagnostics에 `saveVersion` 추가.

- `public/index.html`
  - `client-save.js` 로드 추가.

- `smoke-check.js`
  - client save manager bridge marker 확인 추가.

## Verification

- `npm run check`

## Next

- Phase 12-2: 결과창/gameover state에서 `recordRunResult`를 한 번만 호출해 progress statistics를 실제 run result와 연결한다.
