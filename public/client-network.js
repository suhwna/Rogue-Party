(function () {
  function canSend(socket) {
    return Boolean(socket && socket.readyState === WebSocket.OPEN);
  }

  function send(socket, message) {
    if (!canSend(socket)) return false;
    socket.send(JSON.stringify(message));
    return true;
  }

  function createSocket(url) {
    return new WebSocket(url);
  }

  function closeSocket(socket) {
    if (!socket || (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING)) return false;
    socket.close();
    return true;
  }

  function createConnectionSupervisor(options) {
    const heartbeatMs = Math.max(1000, Number(options && options.heartbeatMs) || 5000);
    const maxReconnectAttempts = Math.max(0, Number(options && options.maxReconnectAttempts) || 0);
    let heartbeatTimer = 0;
    let reconnectTimer = 0;
    let reconnectAttempts = 0;
    let lastPongAt = 0;

    function now() {
      return options && options.now ? options.now() : performance.now();
    }

    function setReconnectAttempts(value) {
      reconnectAttempts = Math.max(0, Number(value) || 0);
      if (options && options.onReconnectAttempts) options.onReconnectAttempts(reconnectAttempts);
    }

    function markPong() {
      lastPongAt = now();
    }

    function startHeartbeat() {
      stopHeartbeat();
      markPong();
      heartbeatTimer = window.setInterval(() => {
        const socket = options && options.getSocket ? options.getSocket() : null;
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        if (options && options.sendPing) options.sendPing();
        if (now() - lastPongAt > heartbeatMs * 3) {
          if (options && options.onSocketState) options.onSocketState("stale");
          if (!(options && options.closeSocket && options.closeSocket(socket))) closeSocket(socket);
        }
      }, heartbeatMs);
    }

    function stopHeartbeat() {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = 0;
    }

    function clearReconnectTimer() {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = 0;
    }

    function scheduleReconnect() {
      if (options && options.isShuttingDown && options.isShuttingDown()) return false;
      if (!(options && options.getLastJoinPayload && options.getLastJoinPayload())) return false;
      if (reconnectTimer || reconnectAttempts >= maxReconnectAttempts) return false;
      setReconnectAttempts(reconnectAttempts + 1);
      const delay =
        options && options.getReconnectDelay
          ? options.getReconnectDelay(reconnectAttempts)
          : Math.min(8000, 900 * 2 ** (reconnectAttempts - 1));
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = 0;
        if (options && options.connect) options.connect(options.getLastJoinPayload());
      }, delay);
      return true;
    }

    function resetReconnectAttempts() {
      setReconnectAttempts(0);
    }

    function shutdown() {
      stopHeartbeat();
      clearReconnectTimer();
    }

    return {
      startHeartbeat,
      stopHeartbeat,
      clearReconnectTimer,
      scheduleReconnect,
      resetReconnectAttempts,
      markPong,
      shutdown
    };
  }

  window.RogueNetworkBridge = Object.freeze({
    canSend,
    send,
    createSocket,
    closeSocket,
    createConnectionSupervisor
  });
})();
