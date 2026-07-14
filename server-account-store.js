const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const STORE_VERSION = 1;

function createAccountStore(options = {}) {
  const progression = options.progression;
  if (!progression) throw new Error("account store requires a progression service");
  const dataDir = options.dataDir || process.env.ROGUE_DATA_DIR || path.join(__dirname, ".data");
  const filePath = options.filePath || path.join(dataDir, "accounts.json");
  const backupPath = options.backupPath || `${filePath}.backup`;
  let data = loadStore(filePath, backupPath);

  function createAccount({ displayName = "Player", progress = null, role = "user" } = {}) {
    let id;
    do id = `RP-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
    while (data.accounts[id]);
    const sessionToken = randomSecret();
    const recoveryCode = formatRecoveryCode(crypto.randomBytes(12).toString("hex").toUpperCase());
    const now = Date.now();
    const account = {
      id,
      tokenHash: hashSecret(sessionToken),
      recoveryHash: hashSecret(recoveryCode),
      displayName: sanitizeDisplayName(displayName),
      role: role === "admin" ? "admin" : "user",
      progress: progress ? progression.sanitizeImportedProgress(progress) : progression.getDefaultProgress(),
      revision: 1,
      createdAt: now,
      updatedAt: now,
      lastReason: role === "admin" ? "admin-created" : progress ? "local-migration" : "guest-created",
    };
    data.accounts[id] = account;
    persist();
    return sessionView(account, { sessionToken, recoveryCode, created: true });
  }

  function createGuest({ displayName = "Player", progress = null } = {}) {
    return createAccount({ displayName, progress, role: "user" });
  }

  function createAdmin({ displayName = "관리자", progress = null } = {}) {
    return createAccount({ displayName, progress, role: "admin" });
  }

  function authenticate(accountId, sessionToken) {
    const account = data.accounts[String(accountId || "")];
    if (!account || !matchesSecret(sessionToken, account.tokenHash)) return null;
    return account;
  }

  function getSession(accountId, sessionToken) {
    const account = authenticate(accountId, sessionToken);
    return account ? sessionView(account, { created: false }) : null;
  }

  function recover(recoveryKey) {
    const parsed = parseRecoveryKey(recoveryKey);
    if (!parsed) return null;
    const account = data.accounts[parsed.accountId];
    if (!account || !matchesSecret(parsed.recoveryCode, account.recoveryHash)) return null;
    const sessionToken = randomSecret();
    account.tokenHash = hashSecret(sessionToken);
    account.updatedAt = Date.now();
    account.lastReason = "account-recovered";
    persist();
    return sessionView(account, {
      sessionToken,
      recoveryCode: parsed.recoveryCode,
      created: false,
      recovered: true,
    });
  }

  function updateProgress(accountId, progress, reason = "progress-update") {
    const account = data.accounts[String(accountId || "")];
    if (!account) return null;
    account.progress = progression.normalizeProgress(progress);
    account.revision = Math.max(1, Number(account.revision || 0) + 1);
    account.updatedAt = Date.now();
    account.lastReason = String(reason || "progress-update").slice(0, 64);
    persist();
    return sessionView(account, { created: false });
  }

  function updateDisplayName(accountId, displayName) {
    const account = data.accounts[String(accountId || "")];
    if (!account) return null;
    const nextName = sanitizeDisplayName(displayName);
    if (account.displayName === nextName) return sessionView(account, { created: false });
    account.displayName = nextName;
    account.updatedAt = Date.now();
    account.lastReason = "display-name";
    persist();
    return sessionView(account, { created: false });
  }

  function resetProgress(accountId, sessionToken) {
    const account = authenticate(accountId, sessionToken);
    if (!account) return null;
    account.progress = progression.getDefaultProgress();
    account.revision = Math.max(1, Number(account.revision || 0) + 1);
    account.updatedAt = Date.now();
    account.lastReason = "account-reset";
    persist();
    return sessionView(account, { sessionToken, reset: true });
  }

  function getTrusted(accountId) {
    return data.accounts[String(accountId || "")] || null;
  }

  function persist() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data), { encoding: "utf8", mode: 0o600 });
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch {
        // The primary atomic write still proceeds if a rolling backup cannot be refreshed.
      }
    }
    try {
      fs.renameSync(tempPath, filePath);
    } catch {
      fs.copyFileSync(tempPath, filePath);
      fs.unlinkSync(tempPath);
    }
  }

  return {
    authenticate,
    backupPath,
    createAdmin,
    createGuest,
    filePath,
    getSession,
    getTrusted,
    recover,
    resetProgress,
    updateDisplayName,
    updateProgress,
  };
}

function loadStore(filePath, backupPath) {
  const primary = readStoreFile(filePath);
  if (primary) return primary;
  const backup = readStoreFile(backupPath);
  if (backup) return backup;
  return { version: STORE_VERSION, accounts: {} };
}

function readStoreFile(filePath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (parsed && parsed.version === STORE_VERSION && parsed.accounts && typeof parsed.accounts === "object") {
      return parsed;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      try {
        fs.renameSync(filePath, `${filePath}.corrupt-${Date.now()}`);
      } catch {
        // The caller can still try the rolling backup.
      }
    }
  }
  return null;
}

function sessionView(account, extras = {}) {
  return {
    account: {
      id: account.id,
      displayName: account.displayName,
      role: account.role === "admin" ? "admin" : "user",
      revision: account.revision,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    },
    progress: JSON.parse(JSON.stringify(account.progress)),
    ...extras,
  };
}

function parseRecoveryKey(value) {
  const text = String(value || "").trim().toUpperCase();
  const separator = text.indexOf(".");
  if (separator <= 0) return null;
  const accountId = text.slice(0, separator);
  const recoveryCode = text.slice(separator + 1);
  if (!/^RP-[A-F0-9]{12}$/.test(accountId) || !/^[A-F0-9]{6}(?:-[A-F0-9]{6}){3}$/.test(recoveryCode)) return null;
  return { accountId, recoveryCode };
}

function formatRecoveryCode(value) {
  return String(value || "").match(/.{1,6}/g).join("-");
}

function randomSecret() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashSecret(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function matchesSecret(value, expectedHash) {
  if (!value || !expectedHash) return false;
  const actual = Buffer.from(hashSecret(value), "hex");
  const expected = Buffer.from(String(expectedHash), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function sanitizeDisplayName(value) {
  const name = String(value || "Player").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 16);
  return name || "Player";
}

module.exports = {
  STORE_VERSION,
  createAccountStore,
  parseRecoveryKey,
};
