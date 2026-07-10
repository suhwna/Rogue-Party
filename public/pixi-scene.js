(() => {
  const pixiCamera = window.RoguePixiCamera || {};

  const SECTION_ORDER = Object.freeze([
    "dungeon",
    "objective",
    "hazards",
    "pickups",
    "projectiles",
    "enemies",
    "players",
    "floatingEffects",
    "aim",
    "screenOverlays"
  ]);

  function createGameSceneContext(renderer, state, now, dt, viewW, viewH) {
    const cameraContext = pixiCamera.createCameraContext
      ? pixiCamera.createCameraContext(renderer, state, viewW, viewH)
      : (() => {
          const camera = renderer.getCamera();
          const shake = renderer.getScreenShake();
          const players = state.players || [];
          const selfId = renderer.getSelfId();
          const self = players.find((player) => player.id === selfId);
          return {
            viewW,
            viewH,
            camera,
            shake,
            shakeX: shake > 0 ? (Math.random() - 0.5) * shake : 0,
            shakeY: shake > 0 ? (Math.random() - 0.5) * shake : 0,
            floatingEffects: renderer.getFloatingEffects() || [],
            hitIFrameTime: Number(self?.hitIFrameTime || 0)
          };
        })();
    return {
      renderer,
      state,
      now,
      dt,
      viewW,
      viewH,
      camera: cameraContext.camera,
      shake: cameraContext.shake,
      shakeX: cameraContext.shakeX,
      shakeY: cameraContext.shakeY,
      floatingEffects: cameraContext.floatingEffects || [],
      hitIFrameTime: cameraContext.hitIFrameTime
    };
  }

  function applyCamera(context) {
    if (pixiCamera.applyCamera) {
      pixiCamera.applyCamera(context);
      return;
    }
    const renderer = context.renderer;
    renderer.clearLayers();
    renderer.world.position.set(
      context.viewW / 2 - context.camera.x + context.shakeX,
      context.viewH / 2 - context.camera.y + context.shakeY
    );
  }

  function renderWorldSections(context) {
    const renderer = context.renderer;
    const state = context.state;
    renderer.renderDungeon(state.room.world, context.now, state.room);
    renderer.renderObjective(state.room.objective, context.now);
    renderer.renderHazards(state.hazards || [], context.now);
    renderer.renderPickups(state, context.now);
    renderer.renderProjectiles(state.projectiles || [], context.now);
  }

  function renderActorSections(context) {
    const renderer = context.renderer;
    const state = context.state;
    renderer.renderEnemies(state.enemies || [], context.now, state.room.world);
    renderer.renderPlayers(state.players || [], context.now);
  }

  function renderEffectSections(context) {
    context.renderer.renderFloatingEffects(context.floatingEffects, context.now);
  }

  function renderUiSections(context) {
    const renderer = context.renderer;
    renderer.renderAim(context.state, context.now);
    renderer.renderScreenOverlays(context.viewW, context.viewH, context.hitIFrameTime);
  }

  function renderGameScene(renderer, state, now, dt, viewW, viewH) {
    const context = createGameSceneContext(renderer, state, now, dt, viewW, viewH);
    applyCamera(context);
    renderWorldSections(context);
    renderActorSections(context);
    renderEffectSections(context);
    renderUiSections(context);
    return context;
  }

  window.RoguePixiScene = Object.freeze({
    SECTION_ORDER,
    createGameSceneContext,
    applyCamera,
    renderWorldSections,
    renderActorSections,
    renderEffectSections,
    renderUiSections,
    renderGameScene
  });
})();
