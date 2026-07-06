const vm = require("node:vm");

const ORIGIN = process.env.SMOKE_ORIGIN || "http://localhost:5173";
const WS_ORIGIN = ORIGIN.replace(/^http/, "ws");

async function checkLinkedAssetResponses(html) {
  const refs = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((ref) => ref && ref.startsWith("/") && !ref.startsWith("//"));
  const uniqueRefs = [...new Set(refs)];
  if (uniqueRefs.length < 40) {
    throw new Error(`linked asset coverage is too low: ${uniqueRefs.length}`);
  }

  for (const ref of uniqueRefs) {
    const assetResponse = await fetch(`${ORIGIN}${ref}`);
    const body = await assetResponse.text();
    if (!assetResponse.ok) {
      throw new Error(`linked asset failed ${ref}: ${assetResponse.status}`);
    }
    if ((ref.endsWith(".js") || ref.endsWith(".css")) && body.trimStart().startsWith("<!DOCTYPE")) {
      throw new Error(`linked asset returned html fallback: ${ref}`);
    }
  }
  return uniqueRefs.length;
}

async function loadWindowBridge(path, globalName) {
  const response = await fetch(`${ORIGIN}${path}`);
  const source = await response.text();
  if (!response.ok) {
    throw new Error(`window bridge fetch failed ${path}`);
  }
  const sandbox = { window: {}, JSON };
  vm.runInNewContext(source, sandbox, { filename: path.replace(/^\//, "") });
  const bridge = sandbox.window[globalName];
  if (!bridge) {
    throw new Error(`window bridge missing ${globalName}`);
  }
  return bridge;
}

async function checkHttp() {
  const response = await fetch(ORIGIN);
  const html = await response.text();
  const linkedAssetCount = await checkLinkedAssetResponses(html);
  if (linkedAssetCount < 40) {
    throw new Error("linked asset contract check failed");
  }
  if (!response.ok || !html.includes("Rogue Party")) {
    throw new Error("HTTP 확인 실패");
  }
  if (
    !html.includes("title-badges") ||
    !html.includes("Loadout Test") ||
    !html.includes("PIXEL ROGUELIKE RAID") ||
    !html.includes("settingsOverlay") ||
    !html.includes("Graphics Quality")
  ) {
    throw new Error("Phase 10 UI shell 확인 실패");
  }
  const styleResponse = await fetch(`${ORIGIN}/styles.css`);
  const styleSource = await styleResponse.text();
  if (
    !styleResponse.ok ||
    !styleSource.includes("--pixel-shadow") ||
    !styleSource.includes(".lobby-panel::before") ||
    !styleSource.includes(".title-badges") ||
    !styleSource.includes(".choice-action-row") ||
    !styleSource.includes(".map-choice-top") ||
    !styleSource.includes(".settings-modal") ||
    !styleSource.includes(".settings-key-button")
  ) {
    throw new Error("Phase 10 UI style 확인 실패");
  }
  const roomsResponse = await fetch(`${ORIGIN}/rooms`);
  const roomsPayload = await roomsResponse.json();
  if (!roomsResponse.ok || !Array.isArray(roomsPayload.rooms)) {
    throw new Error("방 목록 API 확인 실패");
  }
  for (const room of roomsPayload.rooms) {
    if (
      typeof room.code !== "string" ||
      typeof room.status !== "string" ||
      typeof room.wave !== "number" ||
      typeof room.playerCount !== "number" ||
      typeof room.maxPlayers !== "number" ||
      typeof room.hostName !== "string"
    ) {
      throw new Error("/rooms response shape check failed");
    }
  }
  const assetManifestResponse = await fetch(`${ORIGIN}/assets/asset-manifest.json`);
  const assetManifest = await assetManifestResponse.json();
  if (
    !assetManifestResponse.ok ||
    assetManifest.scope !== "visual-only" ||
    assetManifest.audio !== false ||
    !assetManifest.directories?.sprites ||
    !assetManifest.directories?.icons ||
    !assetManifest.directories?.effects ||
    !assetManifest.texturePolicy?.priority?.includes("skill effects use external spritesheet assets first") ||
    !assetManifest.texturePolicy?.priority?.includes("generatedAssets entry with matching textureKey or alias") ||
    !assetManifest.texturePolicy?.skillEffects?.includes("External spritesheet asset") ||
    !assetManifest.textureKeyGuide?.actor ||
    !assetManifest.textureKeyGuide?.effect
  ) {
    throw new Error("Phase 11 visual asset manifest 확인 실패");
  }
  const requiredEffectSheets = [
    "asset-fx-slash",
    "asset-fx-shield",
    "asset-fx-shout",
    "asset-fx-arrow",
    "asset-fx-arrow-rain",
    "asset-fx-frost",
    "asset-fx-meteor",
    "asset-fx-lightning",
    "asset-fx-engineer",
    "asset-fx-puppet",
    "asset-fx-martial",
    "asset-fx-alchemy",
    "asset-fx-shadow",
    "asset-fx-impact"
  ];
  for (const textureKey of requiredEffectSheets) {
    const asset = assetManifest.generatedAssets?.find((entry) => entry.textureKey === textureKey);
    if (!asset || asset.animation !== "spritesheet" || asset.frameWidth !== 64 || asset.frameHeight !== 64 || asset.frames !== 6) {
      throw new Error(`effect spritesheet manifest missing: ${textureKey}`);
    }
    const source = `${assetManifest.directories.effects}${asset.file}`;
    const response = await fetch(`${ORIGIN}${source}`);
    const body = await response.text();
    if (!response.ok || !body.includes("<svg") || !body.includes("shape-rendering=\"crispEdges\"")) {
      throw new Error(`effect spritesheet asset failed: ${source}`);
    }
  }
  const assetManifestSampleResponse = await fetch(`${ORIGIN}/assets/asset-manifest.sample.json`);
  const assetManifestSample = await assetManifestSampleResponse.json();
  if (
    !assetManifestSampleResponse.ok ||
    assetManifestSample.audio !== false ||
    !assetManifestSample.generatedAssets?.some((asset) => asset.textureKey === "fx-warrior-blade") ||
    !assetManifestSample.generatedAssets?.some((asset) => Array.isArray(asset.aliases) && asset.aliases.includes("enemy:slime:1"))
  ) {
    throw new Error("Phase 11 visual asset manifest sample check failed");
  }
  const pixiAssetsResponse = await fetch(`${ORIGIN}/pixi-assets.js`);
  const pixiAssetsSource = await pixiAssetsResponse.text();
  if (
    !pixiAssetsResponse.ok ||
    !pixiAssetsSource.includes("RogueVisualAssets") ||
    !pixiAssetsSource.includes("loadAssetManifest") ||
    !pixiAssetsSource.includes("assetPath") ||
    !pixiAssetsSource.includes("findTextureAsset") ||
    !pixiAssetsSource.includes("assetDescriptorForTexture") ||
    !pixiAssetsSource.includes("preloadAssetManifest")
  ) {
    throw new Error("Phase 11 visual asset helper 확인 실패");
  }
  const pixiRendererResponse = await fetch(`${ORIGIN}/pixi-renderer.js`);
  const pixiRendererSource = await pixiRendererResponse.text();
  if (
    !pixiRendererResponse.ok ||
    !pixiRendererSource.includes("RoguePixiRuntime") ||
    !pixiRendererSource.includes("RoguePixiTextureFactory") ||
    !pixiRendererSource.includes("RoguePixiPools") ||
    !pixiRendererSource.includes("RoguePixiScene") ||
    !pixiRendererSource.includes("RoguePixiWorld") ||
    !pixiRendererSource.includes("RoguePixiPickups") ||
    !pixiRendererSource.includes("RoguePixiProjectiles") ||
    !pixiRendererSource.includes("RoguePixiHazards") ||
    !pixiRendererSource.includes("RoguePixiEnemies") ||
    !pixiRendererSource.includes("RoguePixiPlayers") ||
    !pixiRendererSource.includes("RoguePixiEffects") ||
    !pixiRendererSource.includes("RoguePixiSkillEffects") ||
    !pixiRendererSource.includes("RoguePixiParticles") ||
    !pixiRendererSource.includes("RogueVisualAssets") ||
    !pixiRendererSource.includes("assetDescriptorForTexture") ||
    !pixiRendererSource.includes("assetEffectFrameTexture") ||
    !pixiRendererSource.includes("assetEffectFx") ||
    !pixiRendererSource.includes("assetTextures") ||
    !pixiRendererSource.includes("RoguePixiPrimitives") ||
    !pixiRendererSource.includes("RoguePixiPalettes") ||
    !pixiRendererSource.includes("EFFECT_DRAW_BUDGET") ||
    !pixiRendererSource.includes("chooseRendererPreference") ||
    !pixiRendererSource.includes("__rogueRendererStats") ||
    !pixiRendererSource.includes("webgpu") ||
    !pixiRendererSource.includes("QUALITY_PRESETS") ||
    !pixiRendererSource.includes("particleBudget") ||
    !pixiRendererSource.includes("getParticleBudget") ||
    !pixiRendererSource.includes("renderStyledSkillEffect") ||
    !pixiRendererSource.includes("renderCrispStyledSkillEffect") ||
    !pixiRendererSource.includes("renderCrispPrimaryClassStyledEffect") ||
    !pixiRendererSource.includes("renderCrispClassStyledEffect") ||
    !pixiRendererSource.includes("renderCrispCommonStyledEffect")
  ) {
    throw new Error("Pixi 렌더러 배포 확인 실패");
  }
  const pixiRuntimeResponse = await fetch(`${ORIGIN}/pixi-runtime.js`);
  const pixiRuntimeSource = await pixiRuntimeResponse.text();
  if (
    !pixiRuntimeResponse.ok ||
    !pixiRuntimeSource.includes("RoguePixiRuntime") ||
    !pixiRuntimeSource.includes("QUALITY_PRESETS") ||
    !pixiRuntimeSource.includes("createSpritePool") ||
    !pixiRuntimeSource.includes("createTextPool") ||
    !pixiRuntimeSource.includes("createGraphicsPool") ||
    !pixiRuntimeSource.includes("createCanvasTexture") ||
    !pixiRuntimeSource.includes("createTextureRegistry") ||
    !pixiRuntimeSource.includes("createLayerSet") ||
    !pixiRuntimeSource.includes("clearLayerSet") ||
    !pixiRuntimeSource.includes("effectStartIndex") ||
    !pixiRuntimeSource.includes("particleBudget")
  ) {
    throw new Error("pixi runtime bridge check failed");
  }
  const pixiTextureFactoryResponse = await fetch(`${ORIGIN}/pixi-texture-factory.js`);
  const pixiTextureFactorySource = await pixiTextureFactoryResponse.text();
  if (
    !pixiTextureFactoryResponse.ok ||
    !pixiTextureFactorySource.includes("RoguePixiTextureFactory") ||
    !pixiTextureFactorySource.includes("createCanvasTexture") ||
    !pixiTextureFactorySource.includes("createExternalAssetTexture") ||
    !pixiTextureFactorySource.includes("createTextureRegistry") ||
    !pixiTextureFactorySource.includes("getOrCreateCanvasTexture") ||
    !pixiTextureFactorySource.includes("getOrCreateTextureWithAsset")
  ) {
    throw new Error("pixi texture factory bridge check failed");
  }
  const pixiPoolsResponse = await fetch(`${ORIGIN}/pixi-pools.js`);
  const pixiPoolsSource = await pixiPoolsResponse.text();
  if (
    !pixiPoolsResponse.ok ||
    !pixiPoolsSource.includes("RoguePixiPools") ||
    !pixiPoolsSource.includes("SpritePool") ||
    !pixiPoolsSource.includes("TextPool") ||
    !pixiPoolsSource.includes("GraphicsPool") ||
    !pixiPoolsSource.includes("createSpritePool") ||
    !pixiPoolsSource.includes("createTextPool") ||
    !pixiPoolsSource.includes("createGraphicsPool")
  ) {
    throw new Error("pixi pool bridge check failed");
  }
  const pixiCameraResponse = await fetch(`${ORIGIN}/pixi-camera.js`);
  const pixiCameraSource = await pixiCameraResponse.text();
  if (
    !pixiCameraResponse.ok ||
    !pixiCameraSource.includes("RoguePixiCamera") ||
    !pixiCameraSource.includes("createCameraContext") ||
    !pixiCameraSource.includes("applyCamera") ||
    !pixiCameraSource.includes("resetCamera")
  ) {
    throw new Error("pixi camera bridge check failed");
  }
  const pixiSceneResponse = await fetch(`${ORIGIN}/pixi-scene.js`);
  const pixiSceneSource = await pixiSceneResponse.text();
  if (
    !pixiSceneResponse.ok ||
    !pixiSceneSource.includes("RoguePixiScene") ||
    !pixiSceneSource.includes("RoguePixiCamera") ||
    !pixiSceneSource.includes("SECTION_ORDER") ||
    !pixiSceneSource.includes("renderGameScene") ||
    !pixiSceneSource.includes("renderWorldSections") ||
    !pixiSceneSource.includes("renderActorSections") ||
    !pixiSceneSource.includes("renderEffectSections")
  ) {
    throw new Error("pixi scene bridge check failed");
  }
  const pixiWorldResponse = await fetch(`${ORIGIN}/pixi-world.js`);
  const pixiWorldSource = await pixiWorldResponse.text();
  if (
    !pixiWorldResponse.ok ||
    !pixiWorldSource.includes("RoguePixiWorld") ||
    !pixiWorldSource.includes("renderDungeon") ||
    !pixiWorldSource.includes("renderObjective") ||
    !pixiWorldSource.includes("chapterTheme") ||
    !pixiWorldSource.includes("renderStageAtmosphere") ||
    !pixiWorldSource.includes("renderBlockadeBackdrop") ||
    !pixiWorldSource.includes("renderDefenseBackdrop") ||
    !pixiWorldSource.includes("renderRewardBackdrop")
  ) {
    throw new Error("pixi world bridge check failed");
  }
  const pixiPickupsResponse = await fetch(`${ORIGIN}/pixi-pickups.js`);
  const pixiPickupsSource = await pixiPickupsResponse.text();
  if (
    !pixiPickupsResponse.ok ||
    !pixiPickupsSource.includes("RoguePixiPickups") ||
    !pixiPickupsSource.includes("xpOrbBob") ||
    !pixiPickupsSource.includes("xpOrbScale") ||
    !pixiPickupsSource.includes("relicChestScale") ||
    !pixiPickupsSource.includes("renderXpOrb") ||
    !pixiPickupsSource.includes("renderRelicChest") ||
    !pixiPickupsSource.includes("renderPickups")
  ) {
    throw new Error("pixi pickup bridge check failed");
  }
  const pixiProjectilesResponse = await fetch(`${ORIGIN}/pixi-projectiles.js`);
  const pixiProjectilesSource = await pixiProjectilesResponse.text();
  if (
    !pixiProjectilesResponse.ok ||
    !pixiProjectilesSource.includes("RoguePixiProjectiles") ||
    !pixiProjectilesSource.includes("classifyProjectile") ||
    !pixiProjectilesSource.includes("projectileSpriteKey") ||
    !pixiProjectilesSource.includes("renderProjectiles")
  ) {
    throw new Error("pixi projectile bridge check failed");
  }
  const pixiHazardsResponse = await fetch(`${ORIGIN}/pixi-hazards.js`);
  const pixiHazardsSource = await pixiHazardsResponse.text();
  if (
    !pixiHazardsResponse.ok ||
    !pixiHazardsSource.includes("RoguePixiHazards") ||
    !pixiHazardsSource.includes("hazardState") ||
    !pixiHazardsSource.includes("renderHazard") ||
    !pixiHazardsSource.includes("renderHazards")
  ) {
    throw new Error("pixi hazard bridge check failed");
  }
  const pixiEnemiesResponse = await fetch(`${ORIGIN}/pixi-enemies.js`);
  const pixiEnemiesSource = await pixiEnemiesResponse.text();
  if (
    !pixiEnemiesResponse.ok ||
    !pixiEnemiesSource.includes("RoguePixiEnemies") ||
    !pixiEnemiesSource.includes("enemyTextureKey") ||
    !pixiEnemiesSource.includes("enemyScale") ||
    !pixiEnemiesSource.includes("renderEnemies")
  ) {
    throw new Error("pixi enemy bridge check failed");
  }
  const pixiPlayersResponse = await fetch(`${ORIGIN}/pixi-players.js`);
  const pixiPlayersSource = await pixiPlayersResponse.text();
  if (
    !pixiPlayersResponse.ok ||
    !pixiPlayersSource.includes("RoguePixiPlayers") ||
    !pixiPlayersSource.includes("playerScale") ||
    !pixiPlayersSource.includes("renderPlayerAttackEffect") ||
    !pixiPlayersSource.includes("renderPlayers")
  ) {
    throw new Error("pixi player bridge check failed");
  }
  const pixiEffectsResponse = await fetch(`${ORIGIN}/pixi-effects.js`);
  const pixiEffectsSource = await pixiEffectsResponse.text();
  if (
    !pixiEffectsResponse.ok ||
    !pixiEffectsSource.includes("RoguePixiEffects") ||
    !pixiEffectsSource.includes("effectProgress") ||
    !pixiEffectsSource.includes("effectRadius") ||
    !pixiEffectsSource.includes("renderFloatingTextEffect") ||
    !pixiEffectsSource.includes("renderSlashEffect") ||
    !pixiEffectsSource.includes("renderSpinEffect") ||
    !pixiEffectsSource.includes("renderMobilityOrProjectileEffect") ||
    !pixiEffectsSource.includes("renderCoreSkillEffect") ||
    !pixiEffectsSource.includes("renderMeteorEffect") ||
    !pixiEffectsSource.includes("renderWarningEffect") ||
    !pixiEffectsSource.includes("renderExplosionEffect") ||
    !pixiEffectsSource.includes("renderSecondaryEffect") ||
    !pixiEffectsSource.includes("renderDefaultBurstEffect")
  ) {
    throw new Error("pixi effects bridge check failed");
  }
  const pixiPrimitivesResponse = await fetch(`${ORIGIN}/pixi-primitives.js`);
  const pixiPrimitivesSource = await pixiPrimitivesResponse.text();
  if (
    !pixiPrimitivesResponse.ok ||
    !pixiPrimitivesSource.includes("RoguePixiPrimitives") ||
    !pixiPrimitivesSource.includes("circlePoints") ||
    !pixiPrimitivesSource.includes("arcPoints") ||
    !pixiPrimitivesSource.includes("coneShape") ||
    !pixiPrimitivesSource.includes("cleaveRibbonPoints") ||
    !pixiPrimitivesSource.includes("capsuleSegments") ||
    !pixiPrimitivesSource.includes("lightningPoints") ||
    !pixiPrimitivesSource.includes("starPoints") ||
    !pixiPrimitivesSource.includes("diamondPoints") ||
    !pixiPrimitivesSource.includes("gearPoints")
  ) {
    throw new Error("pixi primitives bridge check failed");
  }
  const pixiPixelDrawingResponse = await fetch(`${ORIGIN}/pixi-pixel-drawing.js`);
  const pixiPixelDrawingSource = await pixiPixelDrawingResponse.text();
  if (
    !pixiPixelDrawingResponse.ok ||
    !pixiPixelDrawingSource.includes("RoguePixiPixelDrawing") ||
    !pixiPixelDrawingSource.includes("px") ||
    !pixiPixelDrawingSource.includes("linePx") ||
    !pixiPixelDrawingSource.includes("outline") ||
    !pixiPixelDrawingSource.includes("pixelDiamond")
  ) {
    throw new Error("pixi pixel drawing bridge check failed");
  }
  const pixiActorTexturesResponse = await fetch(`${ORIGIN}/pixi-actor-textures.js`);
  const pixiActorTexturesSource = await pixiActorTexturesResponse.text();
  if (
    !pixiActorTexturesResponse.ok ||
    !pixiActorTexturesSource.includes("RoguePixiActorTextures") ||
    !pixiActorTexturesSource.includes("drawActorSheetFrame") ||
    !pixiActorTexturesSource.includes("warrior") ||
    !pixiActorTexturesSource.includes("ranger") ||
    !pixiActorTexturesSource.includes("mage") ||
    !pixiActorTexturesSource.includes("engineer") ||
    !pixiActorTexturesSource.includes("puppeteer") ||
    !pixiActorTexturesSource.includes("martialist") ||
    !pixiActorTexturesSource.includes("alchemist") ||
    !pixiActorTexturesSource.includes("assassin")
  ) {
    throw new Error("pixi actor texture bridge check failed");
  }
  const pixiEnemyTexturesResponse = await fetch(`${ORIGIN}/pixi-enemy-textures.js`);
  const pixiEnemyTexturesSource = await pixiEnemyTexturesResponse.text();
  if (!pixiEnemyTexturesResponse.ok) {
    throw new Error(`pixi enemy texture bridge failed ${pixiEnemyTexturesResponse.status}`);
  }
  for (const expected of [
    "RoguePixiEnemyTextures",
    "drawEnemySheetFrame",
    "slime",
    "bat",
    "charger",
    "guardian",
    "shaman",
    "spitter",
    "bomber",
    "stalker",
    "mortar",
    "sniper",
    "brute",
    "runner",
    "training_dummy",
    "splitter",
    "splinter",
  ]) {
    if (!pixiEnemyTexturesSource.includes(expected)) {
      throw new Error(`pixi enemy texture bridge missing ${expected}`);
    }
  }
  const pixiBossTexturesResponse = await fetch(`${ORIGIN}/pixi-boss-textures.js`);
  const pixiBossTexturesSource = await pixiBossTexturesResponse.text();
  if (!pixiBossTexturesResponse.ok) {
    throw new Error(`pixi boss texture bridge failed ${pixiBossTexturesResponse.status}`);
  }
  for (const expected of [
    "RoguePixiBossTextures",
    "drawBossSheetFrame",
    "iron",
    "charge",
    "hive",
    "summon",
    "phase",
  ]) {
    if (!pixiBossTexturesSource.includes(expected)) {
      throw new Error(`pixi boss texture bridge missing ${expected}`);
    }
  }
  const pixiPalettesResponse = await fetch(`${ORIGIN}/pixi-palettes.js`);
  const pixiPalettesSource = await pixiPalettesResponse.text();
  if (
    !pixiPalettesResponse.ok ||
    !pixiPalettesSource.includes("RoguePixiPalettes") ||
    !pixiPalettesSource.includes("classPalettes") ||
    !pixiPalettesSource.includes("enemyPalettes") ||
    !pixiPalettesSource.includes("classPalette") ||
    !pixiPalettesSource.includes("enemyPalette")
  ) {
    throw new Error("pixi palettes bridge check failed");
  }
  const pixiTextureKeysResponse = await fetch(`${ORIGIN}/pixi-texture-keys.js`);
  const pixiTextureKeysSource = await pixiTextureKeysResponse.text();
  if (
    !pixiTextureKeysResponse.ok ||
    !pixiTextureKeysSource.includes("RoguePixiTextureKeys") ||
    !pixiTextureKeysSource.includes("actorTextureKey") ||
    !pixiTextureKeysSource.includes("enemyTextureKey") ||
    !pixiTextureKeysSource.includes("bossTextureInfo") ||
    !pixiTextureKeysSource.includes("projectileTextureKey") ||
    !pixiTextureKeysSource.includes("projectileColor") ||
    !pixiTextureKeysSource.includes("floorTileKey") ||
    !pixiTextureKeysSource.includes("wallBlockKey")
  ) {
    throw new Error("pixi texture key bridge check failed");
  }
  const pixiWorldTexturesResponse = await fetch(`${ORIGIN}/pixi-world-textures.js`);
  const pixiWorldTexturesSource = await pixiWorldTexturesResponse.text();
  if (
    !pixiWorldTexturesResponse.ok ||
    !pixiWorldTexturesSource.includes("RoguePixiWorldTextures") ||
    !pixiWorldTexturesSource.includes("chapterTileThemes") ||
    !pixiWorldTexturesSource.includes("drawFloorTile") ||
    !pixiWorldTexturesSource.includes("drawLegacyFloorTile") ||
    !pixiWorldTexturesSource.includes("drawDefaultWallBlock") ||
    !pixiWorldTexturesSource.includes("drawWallBlock") ||
    !pixiWorldTexturesSource.includes("drawDefaultTorch") ||
    !pixiWorldTexturesSource.includes("drawTorch")
  ) {
    throw new Error("pixi world texture bridge check failed");
  }
  const pixiCommonTexturesResponse = await fetch(`${ORIGIN}/pixi-common-textures.js`);
  const pixiCommonTexturesSource = await pixiCommonTexturesResponse.text();
  if (
    !pixiCommonTexturesResponse.ok ||
    !pixiCommonTexturesSource.includes("RoguePixiCommonTextures") ||
    !pixiCommonTexturesSource.includes("drawShadow") ||
    !pixiCommonTexturesSource.includes("drawReticle") ||
    !pixiCommonTexturesSource.includes("drawXpOrb") ||
    !pixiCommonTexturesSource.includes("drawChest") ||
    !pixiCommonTexturesSource.includes("drawWarningRing") ||
    !pixiCommonTexturesSource.includes("drawSlashArc") ||
    !pixiCommonTexturesSource.includes("drawBurst") ||
    !pixiCommonTexturesSource.includes("drawBeam")
  ) {
    throw new Error("pixi common texture bridge check failed");
  }
  const pixiMeleeTexturesResponse = await fetch(`${ORIGIN}/pixi-melee-textures.js`);
  const pixiMeleeTexturesSource = await pixiMeleeTexturesResponse.text();
  if (
    !pixiMeleeTexturesResponse.ok ||
    !pixiMeleeTexturesSource.includes("RoguePixiMeleeTextures") ||
    !pixiMeleeTexturesSource.includes("drawSwordCut") ||
    !pixiMeleeTexturesSource.includes("drawCleave") ||
    !pixiMeleeTexturesSource.includes("drawWarriorCone") ||
    !pixiMeleeTexturesSource.includes("drawWarriorCleaveCone") ||
    !pixiMeleeTexturesSource.includes("drawWarriorBlade") ||
    !pixiMeleeTexturesSource.includes("drawWarriorSpinBlade") ||
    !pixiMeleeTexturesSource.includes("drawChargeLane") ||
    !pixiMeleeTexturesSource.includes("drawSpin") ||
    !pixiMeleeTexturesSource.includes("drawImpactStar") ||
    !pixiMeleeTexturesSource.includes("drawShieldWedge") ||
    !pixiMeleeTexturesSource.includes("drawTauntBurst")
  ) {
    throw new Error("pixi melee texture bridge check failed");
  }
  const pixiRangedTexturesResponse = await fetch(`${ORIGIN}/pixi-ranged-textures.js`);
  const pixiRangedTexturesSource = await pixiRangedTexturesResponse.text();
  if (
    !pixiRangedTexturesResponse.ok ||
    !pixiRangedTexturesSource.includes("RoguePixiRangedTextures") ||
    !pixiRangedTexturesSource.includes("drawArrowStreak") ||
    !pixiRangedTexturesSource.includes("drawArrowFan") ||
    !pixiRangedTexturesSource.includes("drawArrowRain") ||
    !pixiRangedTexturesSource.includes("drawPierceLance")
  ) {
    throw new Error("pixi ranged texture bridge check failed");
  }
  const pixiElementalTexturesResponse = await fetch(`${ORIGIN}/pixi-elemental-textures.js`);
  const pixiElementalTexturesSource = await pixiElementalTexturesResponse.text();
  if (
    !pixiElementalTexturesResponse.ok ||
    !pixiElementalTexturesSource.includes("RoguePixiElementalTextures") ||
    !pixiElementalTexturesSource.includes("drawLightning") ||
    !pixiElementalTexturesSource.includes("drawFrostShards") ||
    !pixiElementalTexturesSource.includes("drawFireBloom") ||
    !pixiElementalTexturesSource.includes("drawPoisonCloud") ||
    !pixiElementalTexturesSource.includes("drawHealCross") ||
    !pixiElementalTexturesSource.includes("drawShieldHex") ||
    !pixiElementalTexturesSource.includes("drawWarningTarget") ||
    !pixiElementalTexturesSource.includes("drawStarBurst") ||
    !pixiElementalTexturesSource.includes("drawMeteorFall") ||
    !pixiElementalTexturesSource.includes("drawFrostSnap") ||
    !pixiElementalTexturesSource.includes("drawAcidSplash") ||
    !pixiElementalTexturesSource.includes("drawFirePool") ||
    !pixiElementalTexturesSource.includes("drawSmoke")
  ) {
    throw new Error("pixi elemental texture bridge check failed");
  }
  const pixiClassTexturesResponse = await fetch(`${ORIGIN}/pixi-class-textures.js`);
  const pixiClassTexturesSource = await pixiClassTexturesResponse.text();
  if (
    !pixiClassTexturesResponse.ok ||
    !pixiClassTexturesSource.includes("RoguePixiClassTextures") ||
    !pixiClassTexturesSource.includes("drawTurret") ||
    !pixiClassTexturesSource.includes("drawMine") ||
    !pixiClassTexturesSource.includes("drawDrone") ||
    !pixiClassTexturesSource.includes("drawPuppet") ||
    !pixiClassTexturesSource.includes("drawThreadKnot") ||
    !pixiClassTexturesSource.includes("drawFist") ||
    !pixiClassTexturesSource.includes("drawPalmWave") ||
    !pixiClassTexturesSource.includes("drawFlask") ||
    !pixiClassTexturesSource.includes("drawAssassinMark") ||
    !pixiClassTexturesSource.includes("drawShadowCut")
  ) {
    throw new Error("pixi class texture bridge check failed");
  }
  const pixiSkillEffectsResponse = await fetch(`${ORIGIN}/pixi-skill-effects.js`);
  const pixiSkillEffectsSource = await pixiSkillEffectsResponse.text();
  if (
    !pixiSkillEffectsResponse.ok ||
    !pixiSkillEffectsSource.includes("RoguePixiSkillEffects") ||
    !pixiSkillEffectsSource.includes("normalizeSkillStyle") ||
    !pixiSkillEffectsSource.includes("skillEffectPhase") ||
    !pixiSkillEffectsSource.includes("createStyledSkillContext") ||
    !pixiSkillEffectsSource.includes("shouldRenderStyledSkill") ||
    !pixiSkillEffectsSource.includes("renderWarriorStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderWarriorShieldChargeEffect") ||
    !pixiSkillEffectsSource.includes("renderWarriorSpinEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerArrowRainEffect") ||
    !pixiSkillEffectsSource.includes("renderRangerVolleyEffect") ||
    !pixiSkillEffectsSource.includes("renderMageStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderMageMeteorEffect") ||
    !pixiSkillEffectsSource.includes("renderMageChainEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerBeamEffect") ||
    !pixiSkillEffectsSource.includes("renderEngineerMineEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetThreadLinesEffect") ||
    !pixiSkillEffectsSource.includes("renderPuppetThreadKnotEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialPalmEffect") ||
    !pixiSkillEffectsSource.includes("renderMartialRisingEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistThrowEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistElixirEffect") ||
    !pixiSkillEffectsSource.includes("renderAlchemistReactionEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinStyledSkillEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinLungeEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinSmokeEffect") ||
    !pixiSkillEffectsSource.includes("renderAssassinMarkEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonWarningEffect") ||
    !pixiSkillEffectsSource.includes("renderCommonImpactEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispCommonStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispPrimaryClassStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispRangerEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispMageEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispEngineerEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispClassStyledEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispAlchemistEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispPuppetEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispMartialEffect") ||
    !pixiSkillEffectsSource.includes("renderCrispAssassinEffect") ||
    !pixiSkillEffectsSource.includes("renderSkillEffectPolishLayer") ||
    !pixiSkillEffectsSource.includes("assetSkillSheetKey") ||
    !pixiSkillEffectsSource.includes("renderAssetStyledSkillEffect")
  ) {
    throw new Error("pixi skill effects bridge check failed");
  }
  const pixiParticlesResponse = await fetch(`${ORIGIN}/pixi-particles.js`);
  const pixiParticlesSource = await pixiParticlesResponse.text();
  if (
    !pixiParticlesResponse.ok ||
    !pixiParticlesSource.includes("RoguePixiParticles") ||
    !pixiParticlesSource.includes("ParticleEngine") ||
    !pixiParticlesSource.includes("PARTICLE_PRESETS") ||
    !pixiParticlesSource.includes("DEFAULT_PARTICLE_BUDGETS") ||
    !pixiParticlesSource.includes("renderPreset") ||
    !pixiParticlesSource.includes("pressure") ||
    !pixiParticlesSource.includes("hitSpark") ||
    !pixiParticlesSource.includes("slashTrail") ||
    !pixiParticlesSource.includes("fireBurst") ||
    !pixiParticlesSource.includes("poisonBurst") ||
    !pixiParticlesSource.includes("frostBurst") ||
    !pixiParticlesSource.includes("healMist") ||
    !pixiParticlesSource.includes("smokePuff") ||
    !pixiParticlesSource.includes("bladeGlint") ||
    !pixiParticlesSource.includes("arcaneDust") ||
    !pixiParticlesSource.includes("lightningFork")
  ) {
    throw new Error("pixi particle bridge check failed");
  }
  const clientResponse = await fetch(`${ORIGIN}/client.js`);
  const clientSource = await clientResponse.text();
  if (
    !clientResponse.ok ||
    !clientSource.includes("SETTINGS_VERSION") ||
    !clientSource.includes("__rogueSettings") ||
    !clientSource.includes("__rogueProgress") ||
    !clientSource.includes("recordDisplayedResult") ||
    !clientSource.includes("getResultSaveKey") ||
    !clientSource.includes("progressRuns") ||
    !clientSource.includes("exportUserProgress") ||
    !clientSource.includes("importUserProgress") ||
    !clientSource.includes("RogueClientRuntime") ||
    !clientSource.includes("RogueInputManager") ||
    !clientSource.includes("sendClientMessage") ||
    !clientSource.includes("startHeartbeat") ||
    !clientSource.includes("scheduleReconnect")
  ) {
    throw new Error("클라이언트 런타임 배포 확인 실패");
  }
  const clientRuntimeResponse = await fetch(`${ORIGIN}/client-runtime.js`);
  const clientRuntimeSource = await clientRuntimeResponse.text();
  if (
    !clientRuntimeResponse.ok ||
    !clientRuntimeSource.includes("RogueClientRuntime") ||
    !clientRuntimeSource.includes("normalizeSettings") ||
    !clientRuntimeSource.includes("migrateSettings") ||
    !clientRuntimeSource.includes("LEGACY_SETTINGS_KEYS") ||
    !clientRuntimeSource.includes("matchesActionKey") ||
    !clientRuntimeSource.includes("getReconnectDelay") ||
    !clientRuntimeSource.includes("createDiagnostics")
  ) {
    throw new Error("client runtime bridge check failed");
  }
  const clientSaveResponse = await fetch(`${ORIGIN}/client-save.js`);
  const clientSaveSource = await clientSaveResponse.text();
  if (
    !clientSaveResponse.ok ||
    !clientSaveSource.includes("RogueSaveManager") ||
    !clientSaveSource.includes("SAVE_VERSION") ||
    !clientSaveSource.includes("PROGRESS_KEY") ||
    !clientSaveSource.includes("normalizeProgress") ||
    !clientSaveSource.includes("migrateProgress") ||
    !clientSaveSource.includes("exportUserProgress") ||
    !clientSaveSource.includes("importUserProgress") ||
    !clientSaveSource.includes("recordRunResult")
  ) {
    throw new Error("client save manager bridge check failed");
  }
  const clientInputResponse = await fetch(`${ORIGIN}/client-input.js`);
  const clientInputSource = await clientInputResponse.text();
  if (
    !clientInputResponse.ok ||
    !clientInputSource.includes("RogueInputManager") ||
    !clientInputSource.includes("readMove") ||
    !clientInputSource.includes("getSkillSeqs") ||
    !clientInputSource.includes("getDashSeq")
  ) {
    throw new Error("client input bridge check failed");
  }
  const clientNetworkResponse = await fetch(`${ORIGIN}/client-network.js`);
  const clientNetworkSource = await clientNetworkResponse.text();
  if (
    !clientNetworkResponse.ok ||
    !clientNetworkSource.includes("RogueNetworkBridge") ||
    !clientNetworkSource.includes("canSend") ||
    !clientNetworkSource.includes("createSocket") ||
    !clientNetworkSource.includes("closeSocket") ||
    !clientNetworkSource.includes("createConnectionSupervisor") ||
    !clientNetworkSource.includes("JSON.stringify")
  ) {
    throw new Error("client network bridge check failed");
  }
  const clientHudResponse = await fetch(`${ORIGIN}/client-hud.js`);
  const clientHudSource = await clientHudResponse.text();
  if (
    !clientHudResponse.ok ||
    !clientHudSource.includes("RogueHudController") ||
    !clientHudSource.includes("renderTop") ||
    !clientHudSource.includes("setConnection") ||
    !clientHudSource.includes("formatStageLabel")
  ) {
    throw new Error("client hud bridge check failed");
  }
  const clientChoiceResponse = await fetch(`${ORIGIN}/client-choice.js`);
  const clientChoiceSource = await clientChoiceResponse.text();
  if (
    !clientChoiceResponse.ok ||
    !clientChoiceSource.includes("RogueChoiceController") ||
    !clientChoiceSource.includes("renderRelicChoices") ||
    !clientChoiceSource.includes("renderSkillChoices")
  ) {
    throw new Error("client choice controller check failed");
  }
  const clientLobbyResponse = await fetch(`${ORIGIN}/client-lobby.js`);
  const clientLobbySource = await clientLobbyResponse.text();
  if (
    !clientLobbyResponse.ok ||
    !clientLobbySource.includes("RogueLobbyController") ||
    !clientLobbySource.includes("renderParty") ||
    !clientLobbySource.includes("renderClassDetail")
  ) {
    throw new Error("client lobby controller check failed");
  }
  const clientMapResponse = await fetch(`${ORIGIN}/client-map.js`);
  const clientMapSource = await clientMapResponse.text();
  if (
    !clientMapResponse.ok ||
    !clientMapSource.includes("RogueMapController") ||
    !clientMapSource.includes("renderChoices") ||
    !clientMapSource.includes("renderBoard")
  ) {
    throw new Error("client map controller check failed");
  }
  const clientResultResponse = await fetch(`${ORIGIN}/client-result.js`);
  const clientResultSource = await clientResultResponse.text();
  if (
    !clientResultResponse.ok ||
    !clientResultSource.includes("RogueResultController") ||
    !clientResultSource.includes("renderStats") ||
    !clientResultSource.includes("renderPlayers")
  ) {
    throw new Error("client result controller check failed");
  }
  console.log("http ok");
}

async function checkClientSaveRuntimeContract() {
  const clientSaveResponse = await fetch(`${ORIGIN}/client-save.js`);
  const clientSaveSource = await clientSaveResponse.text();
  if (!clientSaveResponse.ok) {
    throw new Error("client save runtime contract fetch failed");
  }

  const storage = new Map();
  const sandbox = {
    window: {},
    structuredClone: globalThis.structuredClone,
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => {
        storage.set(key, String(value));
      },
      removeItem: (key) => {
        storage.delete(key);
      }
    },
    JSON,
    Date
  };
  vm.runInNewContext(clientSaveSource, sandbox, { filename: "client-save.js" });
  const manager = sandbox.window.RogueSaveManager;
  if (!manager || manager.SAVE_VERSION !== 1 || !manager.PROGRESS_KEY) {
    throw new Error("client save runtime manager missing");
  }

  const result = manager.recordRunResult(manager.defaultProgress, {
    outcome: "victory",
    chapter: 2,
    wave: 5,
    highestLevel: 7,
    totalScore: 1234,
    totalRelics: 6,
    durationSec: 91
  });
  if (
    result.statistics.runs !== 1 ||
    result.statistics.victories !== 1 ||
    result.statistics.highestChapter !== 2 ||
    result.bestClear.outcome !== "victory"
  ) {
    throw new Error("client save runtime result recording failed");
  }

  const exported = manager.exportUserProgress(result);
  const imported = manager.importUserProgress(exported);
  if (imported.statistics.totalScore !== 1234 || imported.statistics.totalRelics !== 6) {
    throw new Error("client save runtime import/export failed");
  }

  if (!manager.saveUserProgress(imported)) {
    throw new Error("client save runtime save failed");
  }
  const loaded = manager.loadUserProgress();
  if (loaded.statistics.runs !== 1 || loaded.bestClear.chapter !== 2) {
    throw new Error("client save runtime load failed");
  }

  storage.set(manager.PROGRESS_KEY, "{broken-json");
  const recovered = manager.loadUserProgress();
  if (recovered.statistics.runs !== 0 || recovered.bestClear.outcome !== "none") {
    throw new Error("client save runtime broken json recovery failed");
  }

  console.log("save contract ok");
}

async function checkClientUiControllerRuntimeContract() {
  const choiceBridge = await loadWindowBridge("/client-choice.js", "RogueChoiceController");
  const choiceController = choiceBridge.create({
    getChoiceRarityLabel: (choice) => `RARITY:${choice.rarity || "common"}`,
    getRelicStackLabel: () => "1/3",
    getSkillTypeLabel: () => "Q"
  });
  const relicHtml = choiceController.renderRelicChoices([
    {
      id: "relic-test",
      name: "<Blade>",
      text: "Power & speed",
      icon: "B",
      rarity: "rare",
      target: "Warrior"
    }
  ]);
  if (
    !relicHtml.includes('data-relic="relic-test"') ||
    !relicHtml.includes('data-rarity="rare"') ||
    !relicHtml.includes("&lt;Blade&gt;") ||
    relicHtml.includes("<Blade>")
  ) {
    throw new Error("choice controller relic render contract failed");
  }

  const skillHtml = choiceController.renderSkillChoices([
    {
      id: "skill-test",
      name: "Wide Cut",
      text: "Bigger arc",
      icon: "Q",
      rarity: "epic"
    }
  ]);
  if (!skillHtml.includes('data-skill="skill-test"') || !skillHtml.includes("choice-action-row")) {
    throw new Error("choice controller skill render contract failed");
  }

  const resultBridge = await loadWindowBridge("/client-result.js", "RogueResultController");
  const resultController = resultBridge.create({ formatRelicCount: () => "2/5" });
  const statsHtml = resultController.renderStats([["Score", 1000]]);
  const playersHtml = resultController.renderPlayers([
    { name: "<Hero>", classLabel: "Warrior", level: 3, score: 120, downed: true, relicCount: 2 }
  ]);
  if (
    !statsHtml.includes("result-stat") ||
    !playersHtml.includes("result-player downed") ||
    !playersHtml.includes("&lt;Hero&gt;") ||
    playersHtml.includes("<Hero>")
  ) {
    throw new Error("result controller render contract failed");
  }

  const mapBridge = await loadWindowBridge("/client-map.js", "RogueMapController");
  const mapController = mapBridge.create();
  const mapContext = {
    visibleVote: "",
    serverVote: "",
    localVoteFresh: false,
    localMapVote: "",
    voteLocked: false,
    selfVote: "",
    getStageNodeMeta: (node) => ({ kind: node.kind || "combat", resolvedKind: node.resolvedKind || "" }),
    formatStageNodeLabel: (node) => node.label || node.kind || "NORMAL",
    getStageNodeDescription: (node) => node.text || "Stage description",
    getMapNodePosition: (node) => ({ x: node.depth * 24, y: 20 + node.lane * 24 }),
    mapEdgePath: (from, to) => `M ${from.x} ${from.y} L ${to.x} ${to.y}`,
    isMapPathEdge: () => false,
    mapNodeGlyph: (node) => (node.kind || "?").slice(0, 1).toUpperCase()
  };
  const mapChoiceHtml = mapController.renderChoices([{ id: "node-a", kind: "elite", label: "Elite", votes: 1 }], mapContext);
  const mapBoardHtml = mapController.renderBoard(
    {
      nodes: [
        { id: "node-a", depth: 1, lane: 0, kind: "elite" },
        { id: "node-b", depth: 2, lane: 1, kind: "boss", boss: { name: "Boss", text: "Boss fight" } }
      ],
      edges: [["node-a", "node-b"]],
      availableNodeIds: ["node-a"],
      pathNodeIds: [],
      lanes: 2,
      depth: 2
    },
    mapContext
  );
  if (
    !mapChoiceHtml.includes('data-node="node-a"') ||
    !mapChoiceHtml.includes("choice-action-row") ||
    !mapBoardHtml.includes("map-route") ||
    !mapBoardHtml.includes("map-edge") ||
    !mapBoardHtml.includes('data-node="node-a"') ||
    !mapBoardHtml.includes("Boss")
  ) {
    throw new Error("map controller render contract failed");
  }

  console.log("ui contract ok");
}

function checkWebSocket() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => reject(new Error("WebSocket 상태 대기 시간 초과")), 4000);
    let sawLobby = false;
    let requestedLobbyAction = false;
    let confirmedLobbyAction = false;
    let changedClass = false;
    const lobbyClassCheckOrder = ["martialist", "alchemist", "assassin", "mage"];
    let lobbyClassCheckIndex = 0;
    let startedRun = false;
    let votedMap = false;
    let sawPong = false;

    socket.addEventListener("open", () => {
      socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
      socket.send(
        JSON.stringify({
          type: "join",
          name: "스모크",
          room: "SMOKE",
          classId: "warrior"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "pong") {
        sawPong = true;
        return;
      }
      if (message.type !== "state") {
        return;
      }
      if (!message.players.some((player) => player.name === "스모크")) {
        reject(new Error("입장한 플레이어가 상태에 없습니다"));
        socket.close();
        return;
      }
      const self = message.players.find((player) => player.name === "스모크");

      if (!sawLobby) {
        if (message.room.status !== "lobby") {
          reject(new Error(`입장 직후 대기실이어야 합니다. 현재 상태: ${message.room.status}`));
          socket.close();
          return;
        }
        if (message.room.canStart) {
          reject(new Error("준비 전에는 방장이 시작할 수 없어야 합니다"));
          socket.close();
          return;
        }
        if (!Array.isArray(self.skillSlots) || self.skillSlots.some((slot) => !slot.unlocked)) {
          reject(new Error("대기방 테스트 상태에서는 모든 스킬 슬롯이 열려 있어야 합니다"));
          socket.close();
          return;
        }
        if (!Array.isArray(message.enemies) || !message.enemies.some((enemy) => enemy.type === "training_dummy")) {
          return;
        }
        sawLobby = true;
        requestedLobbyAction = true;
        socket.send(
          JSON.stringify({
            type: "input",
            mx: 1,
            my: 0,
            aimX: Math.min(1780, self.x + 240),
            aimY: self.y,
            attacking: true,
            skillSeqs: { q: 1, e: 1, r: 1, f: 1 },
            dashSeq: 1
          })
        );
        return;
      }

      if (message.room.status === "lobby") {
        if (requestedLobbyAction && !confirmedLobbyAction) {
          if (self.lastAttackAt > 0 && self.lastSkillAt > 0 && self.lastDashAt > 0) {
            confirmedLobbyAction = true;
            socket.send(JSON.stringify({ type: "changeClass", classId: lobbyClassCheckOrder[lobbyClassCheckIndex] }));
          }
          return;
        }

        if (!changedClass) {
          const expectedClass = lobbyClassCheckOrder[lobbyClassCheckIndex];
          if (self.classId !== expectedClass) return;
          if (!Array.isArray(self.skillSlots) || self.skillSlots.some((slot) => !slot.unlocked)) {
            reject(new Error("직업 변경 후에도 대기방 스킬 슬롯이 모두 열려 있어야 합니다"));
            socket.close();
            return;
          }
          if (["martialist", "alchemist", "assassin"].includes(expectedClass) && !self.passive?.name) {
            reject(new Error(`${expectedClass} 직업 패시브 정보가 없습니다`));
            socket.close();
            return;
          }
          lobbyClassCheckIndex += 1;
          if (lobbyClassCheckIndex < lobbyClassCheckOrder.length) {
            socket.send(JSON.stringify({ type: "changeClass", classId: lobbyClassCheckOrder[lobbyClassCheckIndex] }));
            return;
          }
          changedClass = true;
          socket.send(JSON.stringify({ type: "toggleReady" }));
          return;
        }

        if (!startedRun && self.ready && message.room.canStart) {
          startedRun = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (message.room.status === "map") {
        if (!Array.isArray(message.room.mapChoices) || message.room.mapChoices.length === 0 || !message.room.stageMap) {
          reject(new Error("지도 선택지가 없습니다"));
          socket.close();
          return;
        }
        const bossNode = (message.room.stageMap.nodes || []).find((node) => node.kind === "boss" || node.stage?.kind === "boss");
        if (!bossNode?.boss || !Array.isArray(bossNode.boss.signaturePatterns) || bossNode.boss.signaturePatterns.length === 0) {
          reject(new Error("boss signature pattern metadata is missing from stage map"));
          socket.close();
          return;
        }
        if (!votedMap) {
          votedMap = true;
          socket.send(JSON.stringify({ type: "chooseMap", nodeId: message.room.mapChoices[0].id }));
        }
        return;
      }

      if (message.room.status !== "combat") {
        reject(new Error(`지도 투표 후 전투 상태여야 합니다. 현재 상태: ${message.room.status}`));
        socket.close();
        return;
      }
      if (!message.room.waveTrait || !message.room.stageModifier) {
        reject(new Error("웨이브 특성 또는 방 변형 정보가 없습니다"));
        socket.close();
        return;
      }
      if (!sawPong) {
        socket.send(JSON.stringify({ type: "ping", t: Date.now() }));
        return;
      }
      if (message.room.maxChapters !== 3) {
        reject(new Error(`3챕터 구조여야 합니다. 현재: ${message.room.maxChapters}`));
        socket.close();
        return;
      }
      if (
        !message.room.chapterProfile ||
        message.room.chapterProfile.chapter !== message.room.floor ||
        typeof message.room.chapterProfile.combatFocus !== "string" ||
        typeof message.room.chapterProfile.bossTelegraphBias !== "number" ||
        !message.room.chapterProfile.visualTone ||
        typeof message.room.chapterProfile.visualTone.base !== "string" ||
        typeof message.room.chapterProfile.visualTone.rune !== "string"
      ) {
        reject(new Error("chapter profile state is missing"));
        socket.close();
        return;
      }
      if (typeof message.room.advancementPending !== "number") {
        reject(new Error("전직 선택 대기 상태 정보가 없습니다"));
        socket.close();
        return;
      }
      if (typeof message.room.advancementTimeLeft !== "number" || typeof message.room.choicePending !== "number") {
        reject(new Error("선택 제한시간 또는 유물 선택 대기 정보가 없습니다"));
        socket.close();
        return;
      }
      if (self.classId !== "mage" || self.level !== 1) {
        reject(new Error(`런 시작 후에는 선택 직업 Lv.1이어야 합니다. 현재: ${self.classId} Lv.${self.level}`));
        socket.close();
        return;
      }
      if (!self.stats || typeof self.stats.damage !== "number") {
        reject(new Error("상세 플레이어 스탯이 없습니다"));
        socket.close();
        return;
      }
      if (!Array.isArray(self.skillSlots) || self.skillSlots.length !== 4) {
        reject(new Error("스킬 슬롯 정보가 없습니다"));
        socket.close();
        return;
      }
      if (
        !Array.isArray(message.effects) ||
        !Array.isArray(message.hazards) ||
        !Array.isArray(message.relicChests) ||
        !Array.isArray(message.xpOrbs)
      ) {
        reject(new Error("이펙트, 위험 장판, 유물 상자, 경험치 오브 배열이 없습니다"));
        socket.close();
        return;
      }
      clearTimeout(timer);
      console.log("ws ok");
      socket.close();
      resolve();
    });

    socket.addEventListener("error", () => reject(new Error("WebSocket 실패")));
  });
}

function checkRoomListVisibility() {
  return new Promise((resolve, reject) => {
    const room = `LIST${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("room list visibility check timed out")), 5000);
    let finished = false;
    let checked = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("room list ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "ListHost",
          room,
          classId: "warrior"
        })
      );
    });

    socket.addEventListener("message", async (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished || checked) return;
      if (message.room.status !== "lobby" || message.room.code !== room) return;
      checked = true;

      try {
        const roomsResponse = await fetch(`${ORIGIN}/rooms`);
        const roomsPayload = await roomsResponse.json();
        const listed = roomsPayload.rooms.find((entry) => entry.code === room);
        if (!roomsResponse.ok || !listed) {
          finish(new Error("joined room was not visible in /rooms"));
          return;
        }
        if (
          listed.status !== "lobby" ||
          listed.playerCount !== 1 ||
          listed.maxPlayers !== 4 ||
          listed.hostName !== "ListHost"
        ) {
          finish(new Error("joined room has wrong /rooms public fields"));
          return;
        }
        finish();
      } catch (error) {
        finish(error);
      }
    });

    socket.addEventListener("error", () => finish(new Error("room list visibility WebSocket failed")));
  });
}

function checkAllPlayerMapVote() {
  return new Promise((resolve, reject) => {
    const room = `VOTE${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const sockets = [new WebSocket(`${WS_ORIGIN}/ws`), new WebSocket(`${WS_ORIGIN}/ws`)];
    const voted = new Set();
    const readySent = new Set();
    const timer = setTimeout(() => finish(new Error("전원 지도 투표 즉시 진행 확인 실패")), 5000);
    let started = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      sockets.forEach((socket) => socket.close());
      if (error) {
        reject(error);
        return;
      }
      console.log("map vote ok");
      resolve();
    }

    sockets.forEach((socket, index) => {
      socket.addEventListener("open", () => {
        socket.send(
          JSON.stringify({
            type: "join",
            name: `투표${index + 1}`,
            room,
            classId: index === 0 ? "warrior" : "ranger"
          })
        );
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        if (message.type !== "state" || finished) return;

        if (message.room.status === "lobby" && message.room.playerCount === 2) {
          if (!readySent.has(index)) {
            readySent.add(index);
            socket.send(JSON.stringify({ type: "toggleReady" }));
            return;
          }

          if (!started && message.room.canStart) {
            started = true;
            socket.send(JSON.stringify({ type: "start" }));
          }
          return;
        }

        if (started && message.room.status === "map" && message.room.mapChoices?.length && !voted.has(index)) {
          voted.add(index);
          socket.send(JSON.stringify({ type: "chooseMap", nodeId: message.room.mapChoices[0].id }));
          return;
        }

        if (voted.size === 2 && message.room.status === "combat") {
          finish();
        }
      });

      socket.addEventListener("error", () => finish(new Error("전원 지도 투표 WebSocket 실패")));
    });
  });
}

function checkBotPlayer() {
  return new Promise((resolve, reject) => {
    const room = `BOT${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("bot auto-play check timed out")), 7000);
    let addedBot = false;
    let readied = false;
    let started = false;
    let voted = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("bot ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "BotHost",
          room,
          classId: "warrior"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished) return;

      if (message.room.status === "lobby") {
        if (!addedBot) {
          addedBot = true;
          socket.send(JSON.stringify({ type: "addBot" }));
          return;
        }
        const bot = message.players.find((player) => player.bot);
        if (!bot) return;
        if (message.room.botCount !== 1 || !bot.ready) {
          finish(new Error("bot was not added as a ready lobby player"));
          return;
        }
        if (!readied) {
          readied = true;
          socket.send(JSON.stringify({ type: "toggleReady" }));
          return;
        }
        if (!started && message.room.canStart) {
          started = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (started && message.room.status === "map" && message.room.mapChoices?.length && !voted) {
        voted = true;
        socket.send(JSON.stringify({ type: "chooseMap", nodeId: message.room.mapChoices[0].id }));
        return;
      }

      if (started && voted && message.room.status === "combat") {
        if (message.room.botCount !== 1 || !message.players.some((player) => player.bot)) {
          finish(new Error("bot missing after run start"));
          return;
        }
        finish();
      }
    });

    socket.addEventListener("error", () => finish(new Error("bot WebSocket failed")));
  });
}

function checkSpectatorBots() {
  return new Promise((resolve, reject) => {
    const room = `SPEC${Date.now().toString(36).slice(-4)}`.toUpperCase();
    const socket = new WebSocket(`${WS_ORIGIN}/ws`);
    const timer = setTimeout(() => finish(new Error("spectator bot-only check timed out")), 9000);
    let toggledSpectator = false;
    let started = false;
    let finished = false;

    function finish(error) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      socket.close();
      if (error) {
        reject(error);
        return;
      }
      console.log("spectator ok");
      resolve();
    }

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "join",
          name: "SpectatorHost",
          room,
          classId: "mage"
        })
      );
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== "state" || finished) return;
      const self = message.players.find((player) => player.id === message.selfId);

      if (message.room.status === "lobby") {
        if (!toggledSpectator) {
          toggledSpectator = true;
          socket.send(JSON.stringify({ type: "toggleSpectator" }));
          return;
        }

        if (!self?.spectator) return;

        if ((message.room.botCount || 0) < 4) {
          socket.send(JSON.stringify({ type: "addBot" }));
          return;
        }

        const bots = message.players.filter((player) => player.bot);
        if (message.room.playerCount !== 4 || message.room.spectatorCount !== 1 || bots.length !== 4) {
          finish(new Error("spectator room counts are wrong"));
          return;
        }

        if (!started && message.room.canStart) {
          started = true;
          socket.send(JSON.stringify({ type: "start" }));
        }
        return;
      }

      if (started && message.room.status === "combat") {
        const bots = message.players.filter((player) => player.bot && !player.spectator);
        if (!self?.spectator || bots.length !== 4 || message.room.playerCount !== 4) {
          finish(new Error("bot-only spectator run state is wrong"));
          return;
        }
        finish();
      }
    });

    socket.addEventListener("error", () => finish(new Error("spectator WebSocket failed")));
  });
}

checkHttp()
  .then(checkClientSaveRuntimeContract)
  .then(checkClientUiControllerRuntimeContract)
  .then(checkWebSocket)
  .then(checkRoomListVisibility)
  .then(checkAllPlayerMapVote)
  .then(checkBotPlayer)
  .then(checkSpectatorBots)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
