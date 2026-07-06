(function () {
  function createInputManager(options) {
    const runtime = window.RogueClientRuntime || {};
    const state = {
      keys: options.keys || new Set(),
      mouse: options.mouse || { x: 0, y: 0 },
      skillSeqs: options.skillSeqs || { q: 0, e: 0, r: 0, f: 0 },
      mouseDown: false,
      dashSeq: Number(options.initialDashSeq || 0)
    };
    const listeners = [];

    function getSettings() {
      return options.getSettings?.() || {};
    }

    function isSpectator() {
      return Boolean(options.isSpectator?.());
    }

    function matches(code, action, fallbacks) {
      if (runtime.matchesActionKey) return runtime.matchesActionKey(code, getSettings(), action, fallbacks);
      const keyMap = getSettings().keyMap || {};
      return [keyMap[action], ...(fallbacks || [])].filter(Boolean).includes(code);
    }

    function add(target, type, handler, opts) {
      target.addEventListener(type, handler, opts);
      listeners.push(() => target.removeEventListener(type, handler, opts));
    }

    function bind(canvas, rootWindow) {
      add(canvas, "mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        state.mouse.x = event.clientX - rect.left;
        state.mouse.y = event.clientY - rect.top;
      });

      add(canvas, "mousedown", (event) => {
        options.unlockAudio?.();
        if (event.button === 0) state.mouseDown = true;
        if (isSpectator()) return;
        if (event.button === 2) state.skillSeqs.q += 1;
      });

      add(rootWindow, "mouseup", () => {
        state.mouseDown = false;
      });

      add(canvas, "contextmenu", (event) => event.preventDefault());

      add(rootWindow, "keydown", (event) => {
        if (event.target instanceof HTMLInputElement) return;
        state.keys.add(event.code);
        options.unlockAudio?.();
        if (isSpectator()) return;
        if (matches(event.code, "skillQ", ["KeyQ", "Digit1"]) && !event.repeat) state.skillSeqs.q += 1;
        if (matches(event.code, "skillE", ["KeyE", "Digit2"]) && !event.repeat) state.skillSeqs.e += 1;
        if (matches(event.code, "skillR", ["KeyR", "Digit3"]) && !event.repeat) state.skillSeqs.r += 1;
        if (matches(event.code, "skillF", ["KeyF", "Digit4"]) && !event.repeat) state.skillSeqs.f += 1;
        if (matches(event.code, "dash", ["Space"]) && !event.repeat) {
          event.preventDefault();
          state.dashSeq += 1;
          options.onDashSeq?.(state.dashSeq);
        }
      });

      add(rootWindow, "keyup", (event) => {
        state.keys.delete(event.code);
      });
    }

    function readMove() {
      let mx = 0;
      let my = 0;
      if (state.keys.has("KeyA") || state.keys.has("ArrowLeft")) mx -= 1;
      if (state.keys.has("KeyD") || state.keys.has("ArrowRight")) mx += 1;
      if (state.keys.has("KeyW") || state.keys.has("ArrowUp")) my -= 1;
      if (state.keys.has("KeyS") || state.keys.has("ArrowDown")) my += 1;
      return { mx, my };
    }

    function destroy() {
      while (listeners.length) {
        listeners.pop()?.();
      }
      state.keys.clear();
      state.mouseDown = false;
    }

    return {
      bind,
      destroy,
      readMove,
      getPointer: () => state.mouse,
      isMouseDown: () => state.mouseDown,
      getSkillSeqs: () => state.skillSeqs,
      getDashSeq: () => state.dashSeq
    };
  }

  window.RogueInputManager = Object.freeze({ create: createInputManager });
})();
