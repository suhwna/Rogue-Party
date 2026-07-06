(function () {
  const SETTINGS_VERSION = 2;
  const SETTINGS_KEY = "rogue-party.settings.v2";
  const LEGACY_SETTINGS_KEYS = ["rogue-party.settings.v1"];
  const RECONNECT_BASE_MS = 900;
  const RECONNECT_MAX_MS = 8000;
  const RECONNECT_MAX_ATTEMPTS = 6;

  const defaultSettings = Object.freeze({
    version: SETTINGS_VERSION,
    graphicsQuality: "high",
    language: "ko",
    keyMap: {
      attack: "MouseLeft",
      dash: "Space",
      skillQ: "KeyQ",
      skillE: "KeyE",
      skillR: "KeyR",
      skillF: "KeyF"
    }
  });

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSettings(settings) {
    const next = {
      ...structuredCloneSafe(defaultSettings),
      ...(settings && typeof settings === "object" ? settings : {})
    };
    next.version = SETTINGS_VERSION;
    next.graphicsQuality = ["low", "medium", "high"].includes(next.graphicsQuality) ? next.graphicsQuality : "high";
    next.language = String(next.language || "ko").slice(0, 12);
    next.keyMap = {
      ...defaultSettings.keyMap,
      ...(next.keyMap && typeof next.keyMap === "object" ? next.keyMap : {})
    };
    for (const key of Object.keys(defaultSettings.keyMap)) {
      next.keyMap[key] = String(next.keyMap[key] || defaultSettings.keyMap[key] || "").slice(0, 24);
    }
    return next;
  }

  function migrateSettings(settings) {
    return normalizeSettings(settings);
  }

  function loadUserSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY) || LEGACY_SETTINGS_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      if (!raw) return structuredCloneSafe(defaultSettings);
      return migrateSettings(JSON.parse(raw));
    } catch {
      return structuredCloneSafe(defaultSettings);
    }
  }

  function saveUserSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
      return true;
    } catch {
      return false;
    }
  }

  function matchesActionKey(code, settings, action, fallbacks) {
    const keyMap = settings?.keyMap || defaultSettings.keyMap;
    const candidates = [keyMap[action], ...(fallbacks || [])].filter(Boolean);
    return candidates.includes(code);
  }

  function getReconnectDelay(attempt) {
    const safeAttempt = Math.max(1, Number.isFinite(attempt) ? Math.floor(attempt) : 1);
    return Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (safeAttempt - 1));
  }

  function createDiagnostics(overrides) {
    return {
      fps: 0,
      frameMs: 0,
      pixi: false,
      effects: 0,
      socket: "idle",
      latencyMs: 0,
      reconnectAttempts: 0,
      settingsVersion: SETTINGS_VERSION,
      ...(overrides || {})
    };
  }

  window.RogueClientRuntime = Object.freeze({
    SETTINGS_VERSION,
    SETTINGS_KEY,
    LEGACY_SETTINGS_KEYS,
    RECONNECT_BASE_MS,
    RECONNECT_MAX_MS,
    RECONNECT_MAX_ATTEMPTS,
    defaultSettings,
    structuredCloneSafe,
    normalizeSettings,
    migrateSettings,
    loadUserSettings,
    saveUserSettings,
    matchesActionKey,
    getReconnectDelay,
    createDiagnostics
  });
})();
