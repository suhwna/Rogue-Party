export interface WebSocketFrameView {
  readonly opcode: number;
  readonly payloadLength: number;
  readonly offset: number;
}

export interface WebSocketFrameLimits {
  readonly maxPayloadBytes: number;
}

export function getWebSocketFrameHeaderLength(payloadLength: number): number {
  if (payloadLength <= 125) return 2;
  if (payloadLength <= 65535) return 4;
  return 10;
}

export function isTextFrame(opcode: number): boolean {
  return opcode === 1;
}

export function isCloseFrame(opcode: number): boolean {
  return opcode === 8;
}

export function isOversizedFrame(frame: WebSocketFrameView, limits: WebSocketFrameLimits): boolean {
  return frame.payloadLength > limits.maxPayloadBytes;
}
