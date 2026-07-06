# Phase 11-3: Texture Asset Descriptor Contract

## Scope

- Visual asset manifest entry를 Pixi texture 생성 경로에서 사용할 수 있는 계약으로 연결했다.
- 실제 외부 sprite/effect 파일 적용은 다음 단계로 남기고, 현재 코드 생성 texture fallback은 유지했다.

## Changes

- `public/pixi-assets.js`
  - `textureKey`, `aliases`, `path`를 포함한 asset entry normalization 추가.
  - `findTextureAsset(textureKey)`와 `assetDescriptorForTexture(textureKey)` 추가.

- `public/pixi-texture-factory.js`
  - `normalizeTextureAssetDescriptor`, `createExternalAssetTexture`, `getOrCreateExternalTexture` 추가.
  - `getOrCreateTextureWithAsset`로 외부 asset texture를 먼저 시도하고, 없으면 canvas texture로 fallback.
  - texture registry metadata에 `source: "asset" | "generated"` 기록 가능.

- `public/pixi-renderer.js`
  - `RogueVisualAssets` manifest preload 연결.
  - 단일 `texture()` 진입점에서 texture descriptor를 조회하도록 연결.
  - diagnostics에 `assetTextures.external`, `assetTextures.fallback` 추가.

- TypeScript boundary
  - `src/render/VisualAssetManifest.ts`에 texture descriptor helper 추가.
  - `src/render/TextureFactory.ts`에 external asset texture 계약 추가.
  - `src/render/TextureRegistry.ts`에 optional metadata API 추가.
  - `src/render/PixiGameRenderer.ts` diagnostics 타입에 `assetTextures` 추가.

- `smoke-check.js`
  - visual asset descriptor helper와 texture factory external path marker 확인 추가.

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Next

- Phase 11-4: 코드 생성 texture와 외부 asset fallback 우선순위/사용 규칙을 문서화하고 manifest sample을 보강한다.
