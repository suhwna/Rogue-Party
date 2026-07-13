(function () {
  const ACCOUNT_STORAGE_KEY = "rogue-party.account.v1";

  function loadCredentials() {
    try {
      const value = JSON.parse(window.localStorage.getItem(ACCOUNT_STORAGE_KEY) || "null");
      if (!value || typeof value !== "object") return null;
      const accountId = String(value.accountId || "");
      const sessionToken = String(value.sessionToken || "");
      if (!accountId || !sessionToken) return null;
      return {
        accountId,
        sessionToken,
        recoveryCode: String(value.recoveryCode || ""),
      };
    } catch {
      return null;
    }
  }

  function saveCredentials(session) {
    const credentials = {
      accountId: String(session?.account?.id || session?.accountId || ""),
      sessionToken: String(session?.sessionToken || ""),
      recoveryCode: String(session?.recoveryCode || ""),
    };
    if (!credentials.accountId || !credentials.sessionToken) return false;
    try {
      window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(credentials));
      return true;
    } catch {
      return false;
    }
  }

  async function bootstrap(localProgress, displayName) {
    const credentials = loadCredentials();
    if (!credentials) return createGuest(localProgress, displayName);
    try {
      const response = await request("/api/account/session", {
        accountId: credentials.accountId,
        sessionToken: credentials.sessionToken,
      });
      return hydrateSession(response, credentials);
    } catch (error) {
      if (error.status === 401) {
        return {
          ok: false,
          needsRecovery: true,
          error: error.message,
          credentials,
        };
      }
      throw error;
    }
  }

  async function createGuest(localProgress, displayName) {
    const response = await request("/api/account/guest", {
      displayName: String(displayName || "Player").slice(0, 16),
      localProgress,
    });
    const session = hydrateSession(response);
    saveCredentials(session);
    return session;
  }

  async function recover(recoveryKey) {
    const response = await request("/api/account/recover", { recoveryKey });
    const session = hydrateSession(response);
    saveCredentials(session);
    return session;
  }

  function hydrateSession(response, previous = null) {
    const session = {
      ok: true,
      account: response.account || null,
      progress: response.progress || null,
      sessionToken: String(response.sessionToken || previous?.sessionToken || ""),
      recoveryCode: String(response.recoveryCode || previous?.recoveryCode || ""),
      created: Boolean(response.created),
      recovered: Boolean(response.recovered),
    };
    if (session.account?.id && session.sessionToken) saveCredentials(session);
    return session;
  }

  function getJoinCredentials(session) {
    if (!session?.ok || !session.account?.id || !session.sessionToken) return null;
    return {
      accountId: session.account.id,
      accountToken: session.sessionToken,
    };
  }

  function getRecoveryKey(session) {
    if (!session?.account?.id || !session?.recoveryCode) return "";
    return `${session.account.id}.${session.recoveryCode}`;
  }

  function clearCredentials() {
    try {
      window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
    } catch {
      // The caller will still replace the in-memory session.
    }
  }

  async function request(path, body) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body || {}),
    });
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      const error = new Error(payload.error || "계정 서버 요청에 실패했습니다.");
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  window.RogueAccountManager = Object.freeze({
    ACCOUNT_STORAGE_KEY,
    bootstrap,
    clearCredentials,
    createGuest,
    getJoinCredentials,
    getRecoveryKey,
    loadCredentials,
    recover,
  });
})();
