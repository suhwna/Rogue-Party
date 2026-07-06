import type { ClientMessage } from "./MessageTypes";

export function canSend(socket: WebSocket | null | undefined): socket is WebSocket {
  return Boolean(socket && socket.readyState === WebSocket.OPEN);
}

export function sendClientMessage(socket: WebSocket | null | undefined, message: ClientMessage): boolean {
  if (!canSend(socket)) return false;
  socket.send(JSON.stringify(message));
  return true;
}
