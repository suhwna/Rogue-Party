(function () {
  function getRoom(state) {
    return (state && state.room) || {};
  }

  function getChapter(room) {
    return room.chapter || room.floor || 1;
  }

  function getStageName(room) {
    return (
      (room.objective && room.objective.label) ||
      (room.stage && room.stage.label) ||
      (room.waveTrait && room.waveTrait.name) ||
      ""
    );
  }

  function formatStageLabel(state) {
    const room = getRoom(state);
    const chapter = getChapter(room);
    const wave = room.wave || 1;
    const stageName = getStageName(room);

    if (room.status === "lobby") return "LOBBY";
    if (room.status === "map") return `CH ${chapter} · MAP`;
    if (room.status === "advancement") return `STAGE ${wave} · LEVEL UP`;
    if (room.status === "combat" || room.status === "choice") {
      return `CH ${chapter} · STAGE ${wave} · ${stageName || "NORMAL"}`;
    }
    return `CH ${chapter} · STAGE ${wave}${room.waveTrait ? ` · ${room.waveTrait.name}` : ""}`;
  }

  function create(options) {
    const roomCodeEl = options && options.roomCodeEl;
    const waveEl = options && (options.waveEl || options.stageEl);
    const connectionEl = options && options.connectionEl;

    return {
      setConnection(label) {
        if (connectionEl) connectionEl.textContent = label || "";
      },
      renderTop(state) {
        const room = getRoom(state);
        if (roomCodeEl) roomCodeEl.textContent = room.code || "----";
        if (waveEl) waveEl.textContent = formatStageLabel(state);
      },
      render(snapshot) {
        if (roomCodeEl) roomCodeEl.textContent = snapshot.roomCode || "----";
        if (waveEl) waveEl.textContent = snapshot.stageLabel || "-";
        if (connectionEl) connectionEl.textContent = snapshot.connectionLabel || "";
      }
    };
  }

  window.RogueHudController = Object.freeze({
    create,
    formatStageLabel
  });
})();
