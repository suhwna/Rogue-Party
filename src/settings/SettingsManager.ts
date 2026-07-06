import { defaultActionMap, normalizeActionMap, type ActionMap } from "../input/ActionMap";
import { structuredCloneSafe } from "../core/clone";

export const SETTINGS_VERSION = 2;
export const SETTINGS_KEY = "rogue-party.settings.v2";
export const LEGACY_SETTINGS_KEYS = ["rogue-party.settings.v1"] as const;

export type GraphicsQuality = "low" | "medium" | "high";

export interface UserSettings {
  version: number;
  graphicsQuality: GraphicsQuality;
  language: string;
  keyMap: ActionMap;
}

export const defaultSettings: Readonly<UserSettings> = Object.freeze({
  version: SETTINGS_VERSION,
  graphicsQuality: "high",
  language: "ko",
  keyMap: structuredCloneSafe(defaultActionMap),
});

export class SettingsManager {
  private current: UserSettings;

  constructor(private readonly storage: Storage | undefined = globalThis.localStorage) {
    this.current = this.load();
  }

  get(): UserSettings {
    return structuredCloneSafe(this.current);
  }

  update(patch: Partial<UserSettings>): UserSettings {
    this.current = normalizeSettings({ ...this.current, ...patch });
    this.save();
    return this.get();
  }

  reset(): UserSettings {
    this.current = structuredCloneSafe(defaultSettings);
    this.save();
    return this.get();
  }

  private load(): UserSettings {
    try {
      const raw = this.storage?.getItem(SETTINGS_KEY) || LEGACY_SETTINGS_KEYS.map((key) => this.storage?.getItem(key)).find(Boolean);
      if (!raw) return structuredCloneSafe(defaultSettings);
      return migrateSettings(JSON.parse(raw) as Partial<UserSettings>);
    } catch {
      return structuredCloneSafe(defaultSettings);
    }
  }

  private save(): boolean {
    try {
      this.storage?.setItem(SETTINGS_KEY, JSON.stringify(this.current));
      return true;
    } catch {
      return false;
    }
  }
}

export function migrateSettings(settings: Partial<UserSettings> | unknown): UserSettings {
  return normalizeSettings(settings);
}

export function normalizeSettings(settings: Partial<UserSettings> | unknown): UserSettings {
  const input = settings && typeof settings === "object" ? (settings as Partial<UserSettings>) : {};
  return {
    version: SETTINGS_VERSION,
    graphicsQuality: normalizeGraphicsQuality(input.graphicsQuality),
    language: String(input.language || "ko").slice(0, 12),
    keyMap: normalizeActionMap(input.keyMap),
  };
}

function normalizeGraphicsQuality(value: unknown): GraphicsQuality {
  return value === "low" || value === "medium" || value === "high" ? value : "high";
}
