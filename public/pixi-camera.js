(() => {
  function createCameraContext(renderer, state, viewW, viewH) {
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
  }

  function applyCamera(context) {
    const renderer = context.renderer;
    renderer.clearLayers();
    const captureScale = document.body.classList.contains("skill-capture-active") ? 0.7 : 1;
    renderer.world.scale.set(captureScale);
    renderer.world.position.set(
      context.viewW / 2 - context.camera.x * captureScale + context.shakeX,
      context.viewH / 2 - context.camera.y * captureScale + context.shakeY
    );
  }

  function resetCamera(renderer) {
    renderer.world.scale.set(1);
    renderer.world.position.set(0, 0);
    renderer.clearLayers();
  }

  window.RoguePixiCamera = Object.freeze({
    createCameraContext,
    applyCamera,
    resetCamera
  });
})();
