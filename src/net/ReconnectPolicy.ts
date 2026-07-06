export const HEARTBEAT_MS = 5000;
export const RECONNECT_BASE_MS = 900;
export const RECONNECT_MAX_MS = 8000;
export const RECONNECT_MAX_ATTEMPTS = 6;

export function getReconnectDelay(attempt: number): number {
  const safeAttempt = Math.max(1, Number.isFinite(attempt) ? Math.floor(attempt) : 1);
  return Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (safeAttempt - 1));
}
