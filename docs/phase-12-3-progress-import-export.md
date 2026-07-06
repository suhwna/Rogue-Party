# Phase 12-3: Progress Import/Export

## Summary

Phase 12 저장/설정 시스템 확장의 마지막 관리 경계로 progress export/import API를 추가했다.

목표는 localStorage에 저장되는 진행 기록을 디버그, 백업, 복구 가능한 형태로 다룰 수 있게 하는 것이다.

## Changes

- `public/client-save.js`
  - `exportUserProgress(progress)` 추가
  - `importUserProgress(snapshot)` 추가
  - 깨진 JSON 또는 잘못된 snapshot은 `defaultProgress`로 복구한다.

- `src/settings/SaveManager.ts`
  - `SaveManager.exportProgress()` 추가
  - `SaveManager.importProgress(snapshot)` 추가
  - 독립 함수 `exportProgress(progress)`, `importProgress(snapshot)` 추가

- `public/client.js`
  - `window.__rogueProgress.export()` 추가
  - `window.__rogueProgress.import(snapshot)` 추가
  - import 후 즉시 `saveUserProgress()`를 호출해 normalized progress를 저장한다.

- `smoke-check.js`
  - client/save bridge에 export/import marker가 배포되는지 확인한다.

## Contract

```js
window.__rogueProgress.export();
window.__rogueProgress.import(snapshot);
```

- `export()`는 normalized progress JSON string을 반환한다.
- `import(snapshot)`은 JSON string 또는 object를 받아 normalized progress로 저장한다.
- import 값이 깨져 있으면 기본 progress로 복구한다.

## Phase 12 Closeout

Phase 12의 핵심 조건은 충족했다.

- 설정 저장/로드
- 설정 version migration
- progress schema
- progress broken JSON recovery
- progress reset
- run result statistics recording
- progress import/export
- debug bridge

## Verification

- `npm run check`
- `npm run build`
- temp server smoke with `SMOKE_ORIGIN=http://localhost:5211`
