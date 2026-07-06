import { getReconnectDelay, HEARTBEAT_MS, RECONNECT_MAX_ATTEMPTS } from "./ReconnectPolicy";
import type { ClientMessage, ServerMessage } from "./MessageTypes";

export interface NetworkClientOptions {
  url: () => string;
  onMessage: (message: ServerMessage) => void;
  onStatus?: (status: NetworkStatus) => void;
  now?: () => number;
}

export type NetworkStatus = "idle" | "connecting" | "online" | "offline" | "error" | "stale";

export class NetworkClient {
  private socket: WebSocket | null = null;
  private heartbeatTimer = 0;
  private reconnectTimer = 0;
  private reconnectAttempts = 0;
  private lastPongAt = 0;
  private lastJoinPayload: ClientMessage | null = null;
  private shuttingDown = false;

  constructor(private readonly options: NetworkClientOptions) {}

  connect(joinPayload?: ClientMessage): void {
    this.clearReconnectTimer();
    this.closeSocket();
    this.shuttingDown = false;
    if (joinPayload) this.lastJoinPayload = joinPayload;
    this.status("connecting");

    this.socket = new WebSocket(this.options.url());
    this.socket.addEventListener("open", () => {
      this.status("online");
      this.reconnectAttempts = 0;
      this.lastPongAt = this.now();
      if (this.lastJoinPayload) this.send(this.lastJoinPayload);
      this.startHeartbeat();
    });
    this.socket.addEventListener("message", (event) => this.handleMessage(event));
    this.socket.addEventListener("close", () => {
      this.stopHeartbeat();
      if (this.shuttingDown) return;
      this.status("offline");
      this.scheduleReconnect();
    });
    this.socket.addEventListener("error", () => this.status("error"));
  }

  send(message: ClientMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  disconnect(): void {
    this.shuttingDown = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();
    this.closeSocket();
    this.status("idle");
  }

  private handleMessage(event: MessageEvent<string>): void {
    let message: ServerMessage;
    try {
      message = JSON.parse(event.data) as ServerMessage;
    } catch {
      this.status("error");
      return;
    }
    if (message.type === "pong") this.lastPongAt = this.now();
    this.options.onMessage(message);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.now() - this.lastPongAt > HEARTBEAT_MS * 3) this.status("stale");
      this.send({ type: "ping", t: Date.now() });
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    window.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = 0;
  }

  private scheduleReconnect(): void {
    if (!this.lastJoinPayload || this.reconnectTimer) return;
    if (this.reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) return;
    this.reconnectAttempts += 1;
    const delay = getReconnectDelay(this.reconnectAttempts);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = 0;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = 0;
  }

  private closeSocket(): void {
    if (!this.socket) return;
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) this.socket.close();
    this.socket = null;
  }

  private status(status: NetworkStatus): void {
    this.options.onStatus?.(status);
  }

  private now(): number {
    return this.options.now?.() ?? performance.now();
  }
}
