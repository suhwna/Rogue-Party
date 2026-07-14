const progression = require("../server-progression-service");
const { createAccountStore } = require("../server-account-store");

const displayName = String(process.argv[2] || "관리자").trim().slice(0, 16) || "관리자";
const store = createAccountStore({ progression });
const session = store.createAdmin({ displayName });

process.stdout.write(`${JSON.stringify({
  accountId: session.account.id,
  displayName: session.account.displayName,
  role: session.account.role,
  sessionToken: session.sessionToken,
  recoveryKey: `${session.account.id}.${session.recoveryCode}`,
}, null, 2)}\n`);
