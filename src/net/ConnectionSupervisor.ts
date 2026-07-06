export interface ConnectionSupervisorOptions {
  heartbeatMs: number;
  maxReconnectAttempts: number;
  getSocket: () => WebSocket | null;
  getLastJoinPayload: () => unknown;
  sendPing: () => void;
  connect: (payload: unknown) => void;
  closeSocket?: (socket: WebSocket) => boolean;
  getReconnectDelay?: (attempt: number) => number;
  isShuttingDown?: () => boolean;
  now?: () => number;
  onSocketState?: (status: "stale") => void;
  onReconnectAttempts?: (attempts: number) => void;
}

export interface ConnectionSupervisor {
  startHeartbeat(): void;
  stopHeartbeat(): void;
  clearReconnectTimer(): void;
  scheduleReconnect(): boolean;
  resetReconnectAttempts(): void;
  markPong(): void;
  shutdown(): void;
}

export function createConnectionSupervisor(options: ConnectionSupervisorOptions): ConnectionSupervisor {
  const heartbeatMs = Math.max(1000, options.heartbeatMs);
  const maxReconnectAttempts = Math.max(0, options.maxReconnectAttempts);
  let heartbeatTimer = 0;
  let reconnectTimer = 0;
  let reconnectAttempts = 0;
  let lastPongAt = 0;

  const now = () => options.now?.() ?? performance.now();
  const setReconnectAttempts = (value: number) => {
    reconnectAttempts = Math.max(0, value);
    options.onReconnectAttempts?.(reconnectAttempts);
  };

  const supervisor: ConnectionSupervisor = {
    startHeartbeat() {
      supervisor.stopHeartbeat();
      supervisor.markPong();
      heartbeatTimer = window.setInterval(() => {
        const socket = options.getSocket();
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        options.sendPing();
        if (now() - lastPongAt > heartbeatMs * 3) {
          options.onSocketState?.("stale");
          if (!options.closeSocket?.(socket)) socket.close();
        }
      }, heartbeatMs);
    },
    stopHeartbeat() {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = 0;
    },
    clearReconnectTimer() {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = 0;
    },
    scheduleReconnect() {
      if (options.isShuttingDown?.()) return false;
      if (!options.getLastJoinPayload()) return false;
      if (reconnectTimer || reconnectAttempts >= maxReconnectAttempts) return false;
      setReconnectAttempts(reconnectAttempts + 1);
      const delay = options.getReconnectDelay?.(reconnectAttempts) ?? Math.min(8000, 900 * 2 ** (reconnectAttempts - 1));
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = 0;
        options.connect(options.getLastJoinPayload());
      }, delay);
      return true;
    },
    resetReconnectAttempts() {
      setReconnectAttempts(0);
    },
    markPong() {
      lastPongAt = now();
    },
    shutdown() {
      supervisor.stopHeartbeat();
      supervisor.clearReconnectTimer();
    },
  };

  return supervisor;
}
