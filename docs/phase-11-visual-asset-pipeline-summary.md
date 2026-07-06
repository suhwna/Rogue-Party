# Phase 11 Summary: Visual Asset Pipeline

## Completed Scope

- Visual-only asset pipeline foundation.
- Audio/SFX/BGM asset work excluded.
- Sprite/icon/effect directory contracts.
- Asset manifest and sample manifest.
- Asset manifest browser helper.
- Texture descriptor lookup by `textureKey` and `aliases`.
- Pixi TextureFactory external texture contract.
- Generated canvas texture fallback preservation.
- Renderer diagnostics for external/generated texture usage.
- Texture key naming and regression guide.

## Key Files

- `public/assets/asset-manifest.json`
- `public/assets/asset-manifest.sample.json`
- `public/pixi-assets.js`
- `public/pixi-texture-factory.js`
- `public/pixi-renderer.js`
- `src/render/VisualAssetManifest.ts`
- `src/render/TextureFactory.ts`
- `src/render/TextureRegistry.ts`
- `docs/assets-guide.md`

## Verification

- `npm run check`
- `npm run build`
- `set SMOKE_ORIGIN=http://localhost:5211&&npm test`

## Notes

- Actual external bitmap asset replacement is now data-driven through the manifest.
- Empty `generatedAssets` remains valid and uses existing generated pixel textures.
- Graphics quality is the visual pipeline priority; readability remains a regression check, not the limiting ceiling.

## Next

- Phase 12: 저장/설정 시스템 확장.
