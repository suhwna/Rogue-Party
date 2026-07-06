# Phase 11-2: Visual Asset Manifest Helper

## Scope

- Visual asset manifest를 클라이언트에서 읽고 경로를 해석할 수 있는 helper 계약을 추가했다.
- 실제 외부 texture 적용은 다음 단계로 남긴다.

## Changes

- `public/pixi-assets.js`
  - `window.RogueVisualAssets` bridge 추가.
  - `loadAssetManifest`, `getAssetManifest`, `assetDirectory`, `assetPath`, `findGeneratedAsset` 제공.
  - `/assets/asset-manifest.json` preload 실행.
  - fetch 실패 시 visual-only default manifest fallback 사용.

- `src/render/VisualAssetManifest.ts`
  - `VisualAssetManifest`, `VisualAssetEntry`, `VisualAssetKind` 타입 추가.
  - `normalizeVisualAssetManifest`, `assetDirectory`, `assetPath` helper 추가.

- `public/index.html`
  - `pixi-assets.js`를 Pixi runtime보다 먼저 로드.

- `smoke-check.js`
  - `pixi-assets.js` 배포와 helper marker 확인 추가.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 11-3: TextureFactory/TextureRegistry에서 외부 visual asset descriptor를 받을 수 있는 계약 추가.
- Phase 11-4: 코드 생성 texture와 외부 asset fallback 우선순위 정리.
