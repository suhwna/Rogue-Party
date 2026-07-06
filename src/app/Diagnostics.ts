import { SETTINGS_VERSION } from "../settings/SettingsManager";

export interface ClientDiagnostics {
  fps: number;
  frameMs: number;
  pixi: boolean;
  effects: number;
  socket: string;
  latencyMs: number;
  reconnectAttempts: number;
  settingsVersion: number;
  graphicsQuality?: string;
  muted?: boolean;
  settingsSaveFailed?: boolean;
}

export function createClientDiagnostics(overrides: Partial<ClientDiagnostics> = {}): ClientDiagnostics {
  return {
    fps: 0,
    frameMs: 0,
    pixi: false,
    effects: 0,
    socket: "idle",
    latencyMs: 0,
    reconnectAttempts: 0,
    settingsVersion: SETTINGS_VERSION,
    ...overrides,
  };
}
