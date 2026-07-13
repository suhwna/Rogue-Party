const fs = require("fs");
const path = require("path");
const vm = require("vm");

const MAX_IMPORTED_CURRENCY = 1_000_000_000;
const MAX_IMPORTED_STAT = 1_000_000_000_000;
const MAX_MASTERY_NODE_LEVEL = 9999;

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function createProgressionManager(rootDir = __dirname) {
  const storage = new Map();
  const localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  const sandbox = {
    window: { localStorage },
    localStorage,
    structuredClone: globalThis.structuredClone,
    console,
    JSON,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Set,
    Map,
  };
  vm.createContext(sandbox);
  for (const file of ["client-save.js", "client-progression.js"]) {
    const source = fs.readFileSync(path.join(rootDir, "public", file), "utf8");
    vm.runInContext(source, sandbox, { filename: file });
  }
  if (!sandbox.window.RogueSaveManager) {
    throw new Error("progression manager failed to initialize");
  }
  return sandbox.window.RogueSaveManager;
}

const manager = createProgressionManager();

function normalizeProgress(progress) {
  return clone(manager.normalizeProgress(progress));
}

function sanitizeImportedProgress(progress) {
  const next = normalizeProgress(progress);
  for (const key of Object.keys(next.currencies || {})) {
    next.currencies[key] = clampInteger(next.currencies[key], 0, MAX_IMPORTED_CURRENCY);
  }
  for (const key of Object.keys(next.statistics || {})) {
    next.statistics[key] = clampInteger(next.statistics[key], 0, MAX_IMPORTED_STAT);
  }
  next.account.level = clampInteger(next.account?.level, 1, 1_000_000);
  next.account.xp = clampInteger(next.account?.xp, 0, MAX_IMPORTED_STAT);
  for (const entry of Object.values(next.mastery || {})) {
    let spent = 0;
    for (const nodeId of Object.keys(entry.nodes || {})) {
      entry.nodes[nodeId] = clampInteger(entry.nodes[nodeId], 0, MAX_MASTERY_NODE_LEVEL);
      spent += entry.nodes[nodeId];
    }
    entry.points = Math.max(spent, clampInteger(entry.points, spent, MAX_MASTERY_NODE_LEVEL * 4));
  }
  return normalizeProgress(next);
}

function performAction(progress, payload = {}) {
  const action = String(payload.action || "");
  if (action === "spend-mastery") {
    const result = manager.spendMasteryPoint(progress, payload.classId, payload.nodeId);
    return {
      progress: normalizeProgress(result.progress),
      changed: Boolean(result.spent),
      affectsLoadout: Boolean(result.spent),
      message: result.spent ? "숙련 투자가 저장되었습니다." : "숙련 투자 조건을 충족하지 못했습니다.",
    };
  }
  const result = manager.performProgressionAction(progress, payload);
  return {
    ...result,
    progress: normalizeProgress(result.progress),
    changed: Boolean(result.changed),
    affectsLoadout: Boolean(result.affectsLoadout),
  };
}

function recordRunResult(progress, result) {
  return normalizeProgress(manager.recordRunResult(progress, result));
}

function recordWorldDiscoveries(progress, state) {
  const result = manager.recordWorldDiscoveries(progress, state);
  return {
    progress: normalizeProgress(result.progress),
    changed: Boolean(result.changed),
  };
}

function getGrowthLoadout(progress, classId, ascensionLevel) {
  return clone(manager.getGrowthLoadout(progress, classId, ascensionLevel));
}

function getDefaultProgress() {
  return normalizeProgress(manager.defaultProgress);
}

function clampInteger(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

module.exports = {
  SAVE_VERSION: manager.SAVE_VERSION,
  getDefaultProgress,
  getGrowthLoadout,
  normalizeProgress,
  performAction,
  recordRunResult,
  recordWorldDiscoveries,
  sanitizeImportedProgress,
};
