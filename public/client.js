const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const joinOverlay = document.querySelector("#joinOverlay");
const titleScreen = document.querySelector("#titleScreen");
const loadingScreen = document.querySelector("#loadingScreen");
const mainMenuScreen = document.querySelector("#mainMenuScreen");
const titleStartButton = document.querySelector("#titleStartButton");
const menuCreateButton = document.querySelector("#menuCreateButton");
const menuJoinButton = document.querySelector("#menuJoinButton");
const menuBrowseButton = document.querySelector("#menuBrowseButton");
const backToMenuButton = document.querySelector("#backToMenuButton");
const roomModeLabel = document.querySelector("#roomModeLabel");
const roomScreenTitle = document.querySelector("#roomScreenTitle");
const roomSubmitButton = document.querySelector("#roomSubmitButton");
const joinForm = document.querySelector("#joinForm");
const nameInput = document.querySelector("#nameInput");
const roomInput = document.querySelector("#roomInput");
const roomList = document.querySelector("#roomList");
const refreshRoomsButton = document.querySelector("#refreshRooms");
const choiceOverlay = document.querySelector("#choiceOverlay");
const choicesEl = document.querySelector("#choices");
const skillOverlay = document.querySelector("#skillOverlay");
const skillChoicesEl = document.querySelector("#skillChoices");
const mapOverlay = document.querySelector("#mapOverlay");
const mapBoard = document.querySelector("#mapBoard");
const mapChoicesEl = document.querySelector("#mapChoices");
const centerBanner = document.querySelector("#centerBanner");
const resultOverlay = document.querySelector("#resultOverlay");
const resultModal = document.querySelector(".result-modal");
const resultMark = document.querySelector("#resultMark");
const resultKicker = document.querySelector("#resultKicker");
const resultTitle = document.querySelector("#resultTitle");
const resultSubtitle = document.querySelector("#resultSubtitle");
const resultStats = document.querySelector("#resultStats");
const resultPlayers = document.querySelector("#resultPlayers");
const resultStartButton = document.querySelector("#resultStartButton");
const resultActionNote = document.querySelector("#resultActionNote");
const choiceSubtitle = document.querySelector("#choiceSubtitle");
const skillChoiceTitle = document.querySelector("#skillChoiceTitle");
const skillChoiceSubtitle = document.querySelector("#skillChoiceSubtitle");
const mapSubtitle = document.querySelector("#mapSubtitle");
const choiceRewardSummary = document.querySelector("#choiceRewardSummary");
const mapRewardSummary = document.querySelector("#mapRewardSummary");

const connectionEl = document.querySelector("#connection");
const roomCodeEl = document.querySelector("#roomCode");
const waveEl = document.querySelector("#wave");
const startButton = document.querySelector("#startButton");
const lobbyPanel = document.querySelector("#lobbyPanel");
const lobbyClassGrid = document.querySelector("#lobbyClassGrid");
const lobbyClassCards = [...document.querySelectorAll(".lobby-class-card")];
const lobbyClassDetail = document.querySelector("#lobbyClassDetail");
const lobbyReadyCount = document.querySelector("#lobbyReadyCount");
const lobbyPartyList = document.querySelector("#lobbyPartyList");
const readyButton = document.querySelector("#readyButton");
const lobbyStartButton = document.querySelector("#lobbyStartButton");
const spectatorButton = document.querySelector("#spectatorButton");
const lobbyBotControl = document.querySelector("#lobbyBotControl");
const lobbyBotCount = document.querySelector("#lobbyBotCount");
const addBotButton = document.querySelector("#addBotButton");
const removeBotButton = document.querySelector("#removeBotButton");
const partyList = document.querySelector("#partyList");
const skillDock = document.querySelector("#skillDock");
const relicDock = document.querySelector("#relicDock");
const settingsButton = document.querySelector("#settingsButton");
const settingsOverlay = document.querySelector("#settingsOverlay");
const settingsCloseButton = document.querySelector("#settingsCloseButton");
const settingsResetButton = document.querySelector("#settingsResetButton");
const settingsQualityGroup = document.querySelector("#settingsQualityGroup");
const settingsLanguage = document.querySelector("#settingsLanguage");
const settingsKeyList = document.querySelector("#settingsKeyList");

let socket = null;
let selectedClass = "warrior";
let state = null;
let selfId = null;
let viewW = 1280;
let viewH = 720;
let renderScale = Math.max(1, window.devicePixelRatio || 1);
let lastResizeCheck = -Infinity;
const skillSeqs = { q: 0, e: 0, r: 0, f: 0 };
let dashSeq = 0;
let mouseDown = false;
let mouse = { x: 640, y: 360 };
let lastFrameTime = performance.now();
let lastUiUpdate = 0;
let lastRoomStatus = "";
let activeChoiceKey = "";
let pendingChoiceKey = "";
let activeSkillChoiceKey = "";
let pendingSkillChoiceKey = "";
let activeMapChoiceKey = "";
let pendingMapChoiceKey = "";
let renderedMapChoicesKey = "";
let renderedMapBoardKey = "";
let localMapVote = "";
let localMapVoteAt = 0;
let screenShake = 0;
let roomEntryMode = "join";
let loadingTimer = null;
let roomListRefreshTimer = 0;
let inputTimer = 0;
let animationFrameId = 0;
let clientShuttingDown = false;
let heartbeatTimer = 0;
let reconnectTimer = 0;
let reconnectAttempts = 0;
let lastJoinPayload = null;
let lastPongAt = 0;
let suppressNextReconnect = false;
let keyCaptureAction = "";

const clientRuntime = window.RogueClientRuntime || {};
const saveBridge = window.RogueSaveManager || {};
const networkBridge = window.RogueNetworkBridge || {};
const hudBridge = window.RogueHudController || {};
const choiceBridge = window.RogueChoiceController || {};
const lobbyBridge = window.RogueLobbyController || {};
const mapBridge = window.RogueMapController || {};
const resultBridge = window.RogueResultController || {};
const hudController = hudBridge.create
  ? hudBridge.create({ roomCodeEl, waveEl, connectionEl })
  : null;
const choiceController = choiceBridge.create
  ? choiceBridge.create({
      escapeHtml,
      getChoiceRarityLabel,
      getRelicStackLabel,
      getSkillTypeLabel
    })
  : null;
const lobbyController = lobbyBridge.create
  ? lobbyBridge.create({
      escapeHtml,
      getCompactClassSummary
    })
  : null;
const mapController = mapBridge.create ? mapBridge.create({ escapeHtml }) : null;
const resultController = resultBridge.create
  ? resultBridge.create({
      escapeHtml,
      formatRelicCount
    })
  : null;
const SETTINGS_VERSION = clientRuntime.SETTINGS_VERSION || 1;
const SETTINGS_KEY = clientRuntime.SETTINGS_KEY || "rogue-party.settings.v1";
const HEARTBEAT_MS = 5000;
const RECONNECT_BASE_MS = clientRuntime.RECONNECT_BASE_MS || 900;
const RECONNECT_MAX_MS = clientRuntime.RECONNECT_MAX_MS || 8000;
const RECONNECT_MAX_ATTEMPTS = clientRuntime.RECONNECT_MAX_ATTEMPTS || 6;
const settingsActionLabels = Object.freeze({
  attack: "기본 공격",
  dash: "대시",
  skillQ: "Q 스킬",
  skillE: "E 스킬",
  skillR: "R 스킬",
  skillF: "F 스킬"
});
const defaultSettings = Object.freeze(clientRuntime.defaultSettings || {
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
let userSettings = loadUserSettings();
let userProgress = loadUserProgress();
let lastRecordedResultKey = "";

const keys = new Set();
const INPUT_RATE = 60;
const UI_RATE = 10;
const inputManager =
  window.RogueInputManager?.create({
    keys,
    mouse,
    skillSeqs,
    initialDashSeq: dashSeq,
    getSettings: () => userSettings,
    isSpectator: () => Boolean(getSelf()?.spectator) || Boolean(settingsOverlay && !settingsOverlay.classList.contains("hidden")),
    unlockAudio: () => {},
    onDashSeq: (nextDashSeq) => {
      dashSeq = nextDashSeq;
    }
  }) || null;
const visuals = {
  players: new Map(),
  enemies: new Map(),
  projectiles: new Map(),
  hazards: new Map(),
  chests: new Map(),
  xpOrbs: new Map()
};
const floatingEffects = [];
const seenEffectIds = new Set();
const pixiRenderer =
  window.RoguePixiRenderer && window.PIXI
    ? window.RoguePixiRenderer.create({
        canvas,
        getState: () => state,
        getSelfId: () => selfId,
        getVisuals: () => visuals,
        getFloatingEffects: () => floatingEffects,
        getScreenShake: () => screenShake,
        getMouse: () => mouse,
        getCamera: () => getCamera(),
        quality: userSettings.graphicsQuality
      })
    : null;
const clientDiagnostics =
  clientRuntime.createDiagnostics?.({
    pixi: Boolean(pixiRenderer),
    settingsVersion: SETTINGS_VERSION,
    saveVersion: saveBridge.SAVE_VERSION || 1
  }) || {
    fps: 0,
    frameMs: 0,
    pixi: Boolean(pixiRenderer),
    effects: 0,
    socket: "idle",
    latencyMs: 0,
    reconnectAttempts: 0,
    settingsVersion: SETTINGS_VERSION,
    saveVersion: saveBridge.SAVE_VERSION || 1
  };
let clientPerfFrameCount = 0;
let clientPerfLastSampleAt = lastFrameTime;
window.__rogueClientStats = clientDiagnostics;
window.__rogueSettings = {
  get: () => structuredCloneSafe(userSettings),
  update: updateUserSettings,
  reset: resetUserSettings
};
window.__rogueProgress = {
  get: () => structuredCloneSafe(userProgress),
  update: updateUserProgress,
  reset: resetUserProgress,
  export: exportUserProgress,
  import: importUserProgress,
  recordRunResult: recordUserRunResult
};
const connectionSupervisor = networkBridge.createConnectionSupervisor
  ? networkBridge.createConnectionSupervisor({
      heartbeatMs: HEARTBEAT_MS,
      maxReconnectAttempts: RECONNECT_MAX_ATTEMPTS,
      getSocket: () => socket,
      getLastJoinPayload: () => lastJoinPayload,
      sendPing: () => sendClientMessage({ type: "ping", t: Date.now() }),
      connect: (payload) => connect({ reconnect: true, payload }),
      closeSocket: (targetSocket) => networkBridge.closeSocket?.(targetSocket) || false,
      getReconnectDelay: (attempt) =>
        clientRuntime.getReconnectDelay
          ? clientRuntime.getReconnectDelay(attempt)
          : Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (attempt - 1)),
      isShuttingDown: () => clientShuttingDown,
      now: () => performance.now(),
      onSocketState: (status) => {
        clientDiagnostics.socket = status;
      },
      onReconnectAttempts: (attempts) => {
        reconnectAttempts = attempts;
        clientDiagnostics.reconnectAttempts = attempts;
      }
    })
  : null;
applyRuntimeSettings();

const classColors = {
  novice: "#d6d0c4",
  warrior: "#c9824c",
  ranger: "#7fa671",
  mage: "#8d7cae",
  engineer: "#d6b76d",
  puppeteer: "#b985c8",
  martialist: "#d08b5f",
  alchemist: "#9aa15f",
  assassin: "#8a6f9e"
};

const classDescriptions = {
  warrior: {
    label: "전사",
    role: "전열 탱커 / 근접 광역",
    summary: "가장 튼튼한 전열입니다. 도발로 적 시선을 강제로 끌고, 방패 돌진과 광역 베기로 몰려오는 적을 밀어내며 파티가 숨 쉴 공간을 만듭니다.",
    passive: "받는 피해가 낮고, 도발 중에는 크기가 커지며 추가 피해 감소를 얻습니다.",
    skills: [
      ["Q", "강철 회오리"],
      ["E", "도발"],
      ["R", "방패 돌진"],
      ["F", "광역 베기"]
    ]
  },
  ranger: {
    label: "궁수",
    role: "원거리 지속딜 / 카이팅",
    summary: "멀리서 안전하게 누적 피해를 넣는 직업입니다. 2단 대시로 거리를 벌리고, 관통 사격과 레인 에로우로 좁은 길목이나 뭉친 적을 정리합니다.",
    passive: "거리가 멀수록 피해가 좋아지고, 명중한 적을 취약하게 만들어 파티 화력을 끌어올립니다.",
    skills: [
      ["Q", "연발 사격"],
      ["E", "관통 사격"],
      ["R", "레인 에로우"],
      ["F", "독화살"]
    ]
  },
  mage: {
    label: "마법사",
    role: "광역 폭딜 / 상태이상",
    summary: "초반은 조심스럽지만 성장 후 폭발력이 큽니다. 빙결 파동으로 적을 얼리고, 운석과 불바다, 연쇄 번개로 대규모 웨이브를 녹입니다.",
    passive: "빙결, 화상 등 상태이상에 걸린 적에게 더 강한 피해를 줍니다.",
    skills: [
      ["Q", "별빛 폭발"],
      ["E", "빙결 파동"],
      ["R", "운석"],
      ["F", "연쇄 번개"]
    ]
  },
  engineer: {
    label: "기계공",
    role: "설치형 딜러 / 구역 장악",
    summary: "직접 때리기보다 장비를 깔아 전장을 굳히는 직업입니다. 터렛, 감전 지뢰, 드론을 유지하고 과부하로 설치물을 폭발적으로 강화합니다.",
    passive: "장비가 적 근처에서 계속 압박하며, 설치물이 많을수록 안정적인 화력이 나옵니다.",
    skills: [
      ["Q", "과부하"],
      ["E", "자동 터렛"],
      ["R", "감전 지뢰"],
      ["F", "호위 드론"]
    ]
  },
  puppeteer: {
    label: "인형사",
    role: "실표식 / 인형 연계",
    summary: "본체와 인형이 동시에 실표식을 쌓고 터뜨리는 테크니컬 직업입니다. 인형 돌진으로 표식을 새기고, 실 결계와 피날레 교대로 표식을 한 번에 절단합니다.",
    passive: "기본 공격과 인형 공격이 실표식을 쌓습니다. 표식은 결계, 인형극, 교대 공격으로 폭발합니다.",
    skills: [
      ["Q", "인형극"],
      ["E", "살아있는 인형"],
      ["R", "실 결계"],
      ["F", "피날레 교대"]
    ]
  },
  martialist: {
    label: "무투가",
    role: "기력 콤보 / 근접 제압",
    summary: "빠른 연격으로 기력을 쌓고, 쌓은 기력으로 파쇄장/승룡각/기합 폭발을 강화하는 근접 직업입니다. 풀기력 스킬은 범위와 밀어내기가 확 커집니다.",
    passive: "공격을 이어가면 기력이 쌓입니다. 캐릭터 주변의 작은 점이 현재 기력입니다.",
    skills: [
      ["Q", "연환권"],
      ["E", "파쇄장"],
      ["R", "승룡각"],
      ["F", "기합 폭발"]
    ]
  },
  alchemist: {
    label: "연금술사",
    role: "산성+화염 반응 / 보조",
    summary: "산성 장판과 화염 장판을 겹쳐 증류 폭발을 만드는 제어형 직업입니다. 촉매 폭탄으로 깔아둔 장판을 터뜨리고, 전투 영약으로 파티를 살립니다.",
    passive: "산성 장판과 화염 장판이 만나면 폭발하고, 폭발 후 짧은 잔류 장판이 남습니다.",
    skills: [
      ["Q", "촉매 폭탄"],
      ["E", "산성 플라스크"],
      ["R", "화염 플라스크"],
      ["F", "전투 영약"]
    ]
  },
  assassin: {
    label: "암살자",
    role: "다중 표식 / 그림자 처형",
    summary: "여러 적에게 사신 표식을 새긴 뒤 그림자 찌르기, 칼날 난무, 연막 분신으로 표식을 터뜨리는 기동 폭딜 직업입니다.",
    passive: "표식 대상에게 그림자 추가타가 발생하고, 체력이 낮은 적에게 처형 피해가 강해집니다.",
    skills: [
      ["Q", "칼날 난무"],
      ["E", "사신 표식"],
      ["R", "그림자 찌르기"],
      ["F", "연막"]
    ]
  }
};

const affixLabels = {
  frenzy: "광폭",
  bulwark: "철벽",
  venom: "독성",
  volatile: "폭발"
};

const enemyRoleLabels = {
  runner: "RUNNER",
  runner_tank: "TANK",
  runner_fast: "FAST",
  training_dummy: "훈련 표적",
  brute: "투사",
  guardian: "수호자",
  shaman: "회복",
  spitter: "원거리",
  bomber: "폭발",
  charger: "돌진",
  splitter: "분열",
  splinter: "파편",
  stalker: "암살",
  mortar: "포격",
  sniper: "저격",
  boss: "BOSS"
};

const statusLabels = {
  lobby: "LOBBY",
  combat: "COMBAT",
  choice: "RELIC",
  advancement: "LEVEL UP",
  map: "MAP VOTE",
  gameover: "GAME OVER"
};

const rarityLabels = {
  common: "COMMON",
  uncommon: "UNCOMMON",
  rare: "RARE",
  epic: "UNIQUE",
  unique: "UNIQUE",
  legendary: "LEGENDARY",
  mythic: "MYTHIC"
};

const stageNodeFallbacks = {
  combat: { label: "NORMAL", glyph: "N", text: "Standard fight with mixed enemies." },
  elite: { label: "ELITE", glyph: "E", text: "Elite enemies appear more often." },
  miniboss: { label: "MINI BOSS", glyph: "M", text: "A smaller boss blocks this route." },
  defense: { label: "DEFENSE", glyph: "D", text: "Protect the target. No ranged enemy waves." },
  blockade: { label: "BLOCK", glyph: "K", text: "Stop runners before they reach the left gate." },
  random: { label: "RANDOM", glyph: "?", text: "Unknown room. Reveals when selected." },
  reward: { label: "REWARD", glyph: "R", text: "Collect three relic chests." },
  boss: { label: "BOSS", glyph: "B", text: "Chapter boss." }
};

titleStartButton?.addEventListener("click", () => {
  beginFrontLoading();
});

menuCreateButton?.addEventListener("click", () => {
  createRoomAndEnter();
});

menuJoinButton?.addEventListener("click", () => {
  openRoomScreen("join");
});

menuBrowseButton?.addEventListener("click", () => {
  openRoomScreen("browse");
});

backToMenuButton?.addEventListener("click", () => {
  showFrontScreen("main");
});

joinForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  connect();
});

roomSubmitButton?.addEventListener("click", () => {
  roomEntryMode = "join";
  updateRoomModeCopy();
  connect();
});

refreshRoomsButton?.addEventListener("click", () => {
  loadRooms();
});

roomInput?.addEventListener("input", () => {
  roomEntryMode = "join";
  updateRoomModeCopy();
});

roomList?.addEventListener("click", (event) => {
  const button = event.target.closest(".room-card");
  if (!button || button.disabled) return;
  roomEntryMode = "browse";
  roomInput.value = button.dataset.room || "TAVERN";
  updateRoomModeCopy();
  connect();
});

function canSendMessage() {
  if (networkBridge.canSend) return networkBridge.canSend(socket);
  return Boolean(socket && socket.readyState === WebSocket.OPEN);
}

function sendClientMessage(message) {
  if (networkBridge.send) return networkBridge.send(socket, message);
  if (!canSendMessage()) return false;
  socket.send(JSON.stringify(message));
  return true;
}

function setConnectionLabel(label) {
  if (hudController?.setConnection) {
    hudController.setConnection(label);
    return;
  }
  if (connectionEl) connectionEl.textContent = label;
}

function renderTopHud(nextState) {
  if (hudController?.renderTop) {
    hudController.renderTop(nextState);
    return;
  }
  const stageLabel = nextState.room.objective?.label || nextState.room.stage?.label || nextState.room.waveTrait?.name || "";
  roomCodeEl.textContent = nextState.room.code;
  waveEl.textContent =
    nextState.room.status === "lobby"
      ? "LOBBY"
      : nextState.room.status === "map"
        ? `CH ${nextState.room.chapter || nextState.room.floor} · MAP`
        : nextState.room.status === "advancement"
          ? `STAGE ${nextState.room.wave} · LEVEL UP`
          : `CH ${nextState.room.chapter || nextState.room.floor} · STAGE ${nextState.room.wave}${
              nextState.room.waveTrait ? ` · ${nextState.room.waveTrait.name}` : ""
            }`;
  if (nextState.room.status === "combat" || nextState.room.status === "choice") {
    waveEl.textContent = `CH ${nextState.room.chapter || nextState.room.floor} · STAGE ${nextState.room.wave} · ${stageLabel || "NORMAL"}`;
  }
}

startButton.addEventListener("click", () => {
  if (!canSendMessage()) return;
  sendClientMessage({ type: "start" });
});

lobbyClassGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".lobby-class-card");
  if (!button || !canSendMessage()) return;
  selectedClass = button.dataset.class || "warrior";
  if (lastJoinPayload) lastJoinPayload.classId = selectedClass;
  sendClientMessage({ type: "changeClass", classId: selectedClass });
});

readyButton.addEventListener("click", () => {
  if (!canSendMessage()) return;
  sendClientMessage({ type: "toggleReady" });
});

spectatorButton?.addEventListener("click", () => {
  if (!canSendMessage() || spectatorButton.disabled) return;
  sendClientMessage({ type: "toggleSpectator" });
});

lobbyStartButton.addEventListener("click", () => {
  if (!canSendMessage() || lobbyStartButton.disabled) return;
  sendClientMessage({ type: "start" });
});

addBotButton?.addEventListener("click", () => {
  if (!canSendMessage() || addBotButton.disabled) return;
  sendClientMessage({ type: "addBot" });
});

removeBotButton?.addEventListener("click", () => {
  if (!canSendMessage() || removeBotButton.disabled) return;
  sendClientMessage({ type: "removeBot" });
});

resultStartButton.addEventListener("click", () => {
  if (!canSendMessage() || resultStartButton.disabled) return;
  sendClientMessage({ type: "returnLobby" });
});

settingsButton?.addEventListener("click", () => {
  openSettings();
});

settingsCloseButton?.addEventListener("click", () => {
  closeSettings();
});

settingsOverlay?.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) closeSettings();
});

settingsQualityGroup?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-quality]");
  if (!button) return;
  updateUserSettings({ graphicsQuality: button.dataset.quality || "high" });
  renderSettingsPanel();
});

settingsLanguage?.addEventListener("change", () => {
  updateUserSettings({ language: settingsLanguage.value || "ko" });
  renderSettingsPanel();
});

settingsKeyList?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  keyCaptureAction = button.dataset.action || "";
  renderSettingsPanel();
});

settingsResetButton?.addEventListener("click", () => {
  keyCaptureAction = "";
  resetUserSettings();
  renderSettingsPanel();
});

window.addEventListener("keydown", (event) => {
  if (!keyCaptureAction || settingsOverlay?.classList.contains("hidden")) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  const keyMap = { ...userSettings.keyMap, [keyCaptureAction]: event.code };
  keyCaptureAction = "";
  updateUserSettings({ keyMap });
  renderSettingsPanel();
});

if (inputManager) {
  inputManager.bind(canvas, window);
} else {
  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  });

  canvas.addEventListener("mousedown", (event) => {
    unlockAudio();
    if (event.button === 0) mouseDown = true;
    if (getSelf()?.spectator) return;
    if (event.button === 2) skillSeqs.q += 1;
  });

  window.addEventListener("mouseup", () => {
    mouseDown = false;
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement) return;
    keys.add(event.code);
    unlockAudio();
    if (getSelf()?.spectator || (settingsOverlay && !settingsOverlay.classList.contains("hidden"))) return;
    if (matchesActionKey(event.code, "skillQ", ["KeyQ", "Digit1"]) && !event.repeat) skillSeqs.q += 1;
    if (matchesActionKey(event.code, "skillE", ["KeyE", "Digit2"]) && !event.repeat) skillSeqs.e += 1;
    if (matchesActionKey(event.code, "skillR", ["KeyR", "Digit3"]) && !event.repeat) skillSeqs.r += 1;
    if (matchesActionKey(event.code, "skillF", ["KeyF", "Digit4"]) && !event.repeat) skillSeqs.f += 1;
    if (matchesActionKey(event.code, "dash", ["Space"]) && !event.repeat) {
      event.preventDefault();
      dashSeq += 1;
    }
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });
}

loadRooms();
roomListRefreshTimer = window.setInterval(() => {
  if (!joinOverlay.classList.contains("hidden")) loadRooms();
}, 2000);

function beginFrontLoading() {
  showFrontScreen("loading");
  clearTimeout(loadingTimer);
  loadingTimer = setTimeout(() => {
    showFrontScreen("main");
    updateRoomModeCopy();
    loadRooms();
    roomInput?.focus();
  }, 560);
}

function showFrontScreen(screen) {
  titleScreen?.classList.toggle("hidden", screen !== "title");
  loadingScreen?.classList.toggle("hidden", screen !== "loading");
  mainMenuScreen?.classList.toggle("hidden", screen !== "main" && screen !== "room");
}

function openRoomScreen(mode) {
  roomEntryMode = mode;
  if (mode === "create") {
    roomInput.value = generateRoomCode();
  }
  updateRoomModeCopy();
  showFrontScreen("main");
  loadRooms();
  if (mode === "join") {
    roomInput?.focus();
    roomInput?.select();
  } else {
    nameInput?.focus();
    nameInput?.select();
  }
}

function updateRoomModeCopy() {
  const mode = roomEntryMode;
  if (!roomModeLabel || !roomScreenTitle) return;
  if (mode === "create") {
    roomModeLabel.textContent = "CREATE ROOM";
    roomScreenTitle.textContent = "New Party";
  } else if (mode === "browse") {
    roomModeLabel.textContent = "ROOM LIST";
    roomScreenTitle.textContent = "Open Rooms";
  } else {
    roomModeLabel.textContent = "ROOM ACCESS";
    roomScreenTitle.textContent = "Enter Gate";
  }
}

function createRoomAndEnter() {
  roomEntryMode = "create";
  roomInput.value = generateRoomCode();
  updateRoomModeCopy();
  connect();
}

function generateRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "R";
  for (let i = 0; i < 5; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function loadRooms() {
  if (!roomList) return;
  try {
    const response = await fetch("/rooms", { cache: "no-store" });
    if (!response.ok) throw new Error("rooms failed");
    const data = await response.json();
    renderRoomList(data.rooms || []);
  } catch {
    roomList.innerHTML = `<div class="empty-rooms">방 목록을 불러오지 못했습니다. Refresh를 눌러 다시 확인하세요.</div>`;
  }
}

function renderRoomList(rooms) {
  if (!roomList) return;
  if (!rooms.length) {
    roomList.innerHTML = `<div class="empty-rooms">열린 방이 없습니다. New Room으로 파티를 만들 수 있습니다.</div>`;
    return;
  }

  roomList.innerHTML = rooms
    .map((room) => {
      const full = room.playerCount >= room.maxPlayers;
      const status = room.status === "lobby" ? "LOBBY" : `STAGE ${room.wave} / ${statusLabels[room.status] || room.status}`;
      return `
        <button class="room-card ${full ? "full" : ""}" type="button" data-room="${escapeHtml(room.code)}" ${full ? "disabled" : ""}>
          <span>
            <strong>${escapeHtml(room.code)}</strong>
            <small>${escapeHtml(room.hostName || "NO HOST")} · ${escapeHtml(status)}</small>
          </span>
          <em>${full ? "FULL" : `${room.playerCount}/${room.maxPlayers}`}</em>
        </button>
      `;
    })
    .join("");
}

function connect(options = {}) {
  const payload = options.payload || null;
  const playerName = payload?.name || (nameInput?.value || "Player").trim().slice(0, 16) || "Player";
  const roomCode = normalizeRoomCode(payload?.room || roomInput?.value || "");
  if (!roomCode) {
    setConnectionLabel("ROOM CODE NEEDED");
    roomInput?.focus();
    return;
  }

  if (nameInput) nameInput.value = playerName;
  if (roomInput) roomInput.value = roomCode;
  clearReconnectTimer();
  stopHeartbeat();
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    suppressNextReconnect = true;
    if (!networkBridge.closeSocket || !networkBridge.closeSocket(socket)) socket.close();
  }
  lastJoinPayload = {
    name: playerName,
    room: roomCode,
    classId: payload?.classId || selectedClass
  };

  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socketUrl = `${protocol}://${location.host}/ws`;
  socket = networkBridge.createSocket ? networkBridge.createSocket(socketUrl) : new WebSocket(socketUrl);
  setConnectionLabel(options.reconnect ? "RECONNECTING" : "CONNECTING");
  clientDiagnostics.socket = "connecting";
  clientDiagnostics.reconnectAttempts = reconnectAttempts;

  socket.addEventListener("open", () => {
    const joinPayload = lastJoinPayload || { name: playerName, room: roomCode, classId: selectedClass };
    sendClientMessage({
      type: "join",
      name: joinPayload.name,
      room: joinPayload.room,
      classId: joinPayload.classId
    });
  });

  socket.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      clientDiagnostics.socket = "bad-packet";
      return;
    }
    if (message.type === "pong") {
      connectionSupervisor?.markPong?.();
      lastPongAt = performance.now();
      clientDiagnostics.latencyMs = Number.isFinite(message.t) ? Math.max(0, Math.round(Date.now() - message.t)) : 0;
      return;
    }
    if (message.type === "joined") {
      selfId = message.id;
      joinOverlay.classList.add("hidden");
      setConnectionLabel("ONLINE");
      clientDiagnostics.socket = "online";
      resetReconnectAttempts();
      startHeartbeat();
      return;
    }

    if (message.type === "error") {
      setConnectionLabel(message.message);
      joinOverlay.classList.remove("hidden");
      showFrontScreen("main");
      return;
    }

    if (message.type === "state") {
      state = message;
      selfId = message.selfId;
      syncVisuals(message);
      ingestEffects(message.effects || []);

      const now = performance.now();
      const choicesKey = getChoiceKey(message.choices);
      const skillChoiceKey = getChoiceKey(message.skillChoices);
      const mapChoiceKey = getMapChoiceKey(message.room);
      const shouldUpdateUi =
        now - lastUiUpdate > 1000 / UI_RATE ||
        choicesKey !== activeChoiceKey ||
        skillChoiceKey !== activeSkillChoiceKey ||
        mapChoiceKey !== activeMapChoiceKey ||
        message.events.length > 0 ||
        message.room.status !== lastRoomStatus;

      if (shouldUpdateUi) {
        updateUi(message);
        lastUiUpdate = now;
        lastRoomStatus = message.room.status;
      }
    }
  });

  socket.addEventListener("close", () => {
    stopHeartbeat();
    if (suppressNextReconnect) {
      suppressNextReconnect = false;
      return;
    }
    setConnectionLabel("OFFLINE");
    clientDiagnostics.socket = "offline";
    centerBanner.textContent = "CONNECTION LOST";
    centerBanner.classList.remove("hidden");
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    setConnectionLabel("CONNECT FAILED");
    clientDiagnostics.socket = "error";
  });
}

function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function loadUserSettings() {
  if (clientRuntime.loadUserSettings) return clientRuntime.loadUserSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return structuredCloneSafe(defaultSettings);
    const parsed = JSON.parse(raw);
    return normalizeSettings(parsed);
  } catch {
    return structuredCloneSafe(defaultSettings);
  }
}

function normalizeSettings(value) {
  if (clientRuntime.normalizeSettings) return clientRuntime.normalizeSettings(value);
  const next = {
    ...structuredCloneSafe(defaultSettings),
    ...(value && typeof value === "object" ? value : {})
  };
  next.version = SETTINGS_VERSION;
  next.graphicsQuality = ["low", "medium", "high"].includes(next.graphicsQuality) ? next.graphicsQuality : "high";
  next.language = String(next.language || "ko").slice(0, 8);
  next.keyMap = {
    ...defaultSettings.keyMap,
    ...(next.keyMap && typeof next.keyMap === "object" ? next.keyMap : {})
  };
  for (const key of Object.keys(next.keyMap)) {
    next.keyMap[key] = String(next.keyMap[key] || defaultSettings.keyMap[key] || "").slice(0, 24);
  }
  return next;
}

function saveUserSettings() {
  if (clientRuntime.saveUserSettings) {
    if (!clientRuntime.saveUserSettings(userSettings)) clientDiagnostics.settingsSaveFailed = true;
    return;
  }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
  } catch {
    clientDiagnostics.settingsSaveFailed = true;
  }
}

function updateUserSettings(patch = {}) {
  userSettings = normalizeSettings({ ...userSettings, ...(patch || {}) });
  saveUserSettings();
  applyRuntimeSettings();
  return structuredCloneSafe(userSettings);
}

function resetUserSettings() {
  userSettings = structuredCloneSafe(defaultSettings);
  saveUserSettings();
  applyRuntimeSettings();
  return structuredCloneSafe(userSettings);
}

function loadUserProgress() {
  if (saveBridge.loadUserProgress) return saveBridge.loadUserProgress();
  return saveBridge.defaultProgress ? structuredCloneSafe(saveBridge.defaultProgress) : {
    version: saveBridge.SAVE_VERSION || 1,
    unlockedClasses: ["warrior", "ranger", "mage"],
    unlockedRelics: [],
    titles: [],
    skins: [],
    bestClear: { outcome: "none", chapter: 0, stage: 0, cleared: false, completedAt: null },
    statistics: {
      runs: 0,
      victories: 0,
      defeats: 0,
      highestChapter: 0,
      highestStage: 0,
      highestLevel: 1,
      totalScore: 0,
      totalRelics: 0,
      totalPlaySeconds: 0
    }
  };
}

function normalizeProgress(value) {
  if (saveBridge.normalizeProgress) return saveBridge.normalizeProgress(value);
  return value && typeof value === "object" ? structuredCloneSafe(value) : loadUserProgress();
}

function saveUserProgress() {
  if (saveBridge.saveUserProgress) {
    clientDiagnostics.progressSaveFailed = !saveBridge.saveUserProgress(userProgress);
    return;
  }
  clientDiagnostics.progressSaveFailed = true;
}

function updateUserProgress(patch = {}) {
  userProgress = normalizeProgress({ ...userProgress, ...(patch || {}) });
  saveUserProgress();
  return structuredCloneSafe(userProgress);
}

function resetUserProgress() {
  userProgress = saveBridge.resetUserProgress ? saveBridge.resetUserProgress() : loadUserProgress();
  clientDiagnostics.progressSaveFailed = false;
  return structuredCloneSafe(userProgress);
}

function exportUserProgress() {
  if (saveBridge.exportUserProgress) return saveBridge.exportUserProgress(userProgress);
  return JSON.stringify(normalizeProgress(userProgress), null, 2);
}

function importUserProgress(snapshot = {}) {
  if (saveBridge.importUserProgress) {
    userProgress = saveBridge.importUserProgress(snapshot);
  } else {
    try {
      userProgress = normalizeProgress(typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot);
    } catch {
      userProgress = loadUserProgress();
    }
  }
  saveUserProgress();
  return structuredCloneSafe(userProgress);
}

function recordUserRunResult(result = {}) {
  userProgress = saveBridge.recordRunResult ? saveBridge.recordRunResult(userProgress, result) : normalizeProgress(userProgress);
  saveUserProgress();
  clientDiagnostics.progressRuns = userProgress.statistics?.runs || 0;
  return structuredCloneSafe(userProgress);
}

function applyRuntimeSettings() {
  document.documentElement.dataset.graphicsQuality = userSettings.graphicsQuality;
  document.documentElement.dataset.language = userSettings.language;
  pixiRenderer?.setQuality?.(userSettings.graphicsQuality);
  clientDiagnostics.graphicsQuality = userSettings.graphicsQuality;
  renderSettingsPanel();
}

function matchesActionKey(code, action, fallbacks = []) {
  if (clientRuntime.matchesActionKey) return clientRuntime.matchesActionKey(code, userSettings, action, fallbacks);
  const configured = userSettings.keyMap?.[action];
  return code === configured || fallbacks.includes(code);
}

function openSettings() {
  keyCaptureAction = "";
  renderSettingsPanel();
  settingsOverlay?.classList.remove("hidden");
}

function closeSettings() {
  keyCaptureAction = "";
  settingsOverlay?.classList.add("hidden");
  renderSettingsPanel();
}

function renderSettingsPanel() {
  if (!settingsOverlay) return;
  settingsQualityGroup?.querySelectorAll("button[data-quality]").forEach((button) => {
    button.classList.toggle("active", button.dataset.quality === userSettings.graphicsQuality);
  });

  if (settingsLanguage) {
    settingsLanguage.value = userSettings.language || "ko";
  }

  if (settingsKeyList) {
    settingsKeyList.innerHTML = Object.entries(settingsActionLabels)
      .map(([action, label]) => {
        const capturing = keyCaptureAction === action;
        const keyLabel = capturing ? "Press key..." : formatKeyCode(userSettings.keyMap?.[action] || defaultSettings.keyMap[action]);
        return `
          <div class="settings-key-row">
            <span>${escapeHtml(label)}</span>
            <button class="settings-key-button ${capturing ? "capturing" : ""}" type="button" data-action="${escapeHtml(action)}">${escapeHtml(keyLabel)}</button>
          </div>
        `;
      })
      .join("");
  }
}

function formatKeyCode(code) {
  const aliases = {
    MouseLeft: "Left Click",
    Space: "Space",
    KeyQ: "Q",
    KeyE: "E",
    KeyR: "R",
    KeyF: "F"
  };
  if (aliases[code]) return aliases[code];
  if (String(code || "").startsWith("Key")) return String(code).replace("Key", "");
  if (String(code || "").startsWith("Digit")) return String(code).replace("Digit", "");
  return String(code || "-");
}

function unlockAudio() {
  // Audio is intentionally not part of the current scope.
}

function structuredCloneSafe(value) {
  if (clientRuntime.structuredCloneSafe) return clientRuntime.structuredCloneSafe(value);
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function startHeartbeat() {
  if (connectionSupervisor) {
    connectionSupervisor.startHeartbeat();
    return;
  }
  stopHeartbeat();
  lastPongAt = performance.now();
  heartbeatTimer = window.setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    sendClientMessage({ type: "ping", t: Date.now() });
    if (performance.now() - lastPongAt > HEARTBEAT_MS * 3) {
      clientDiagnostics.socket = "stale";
      if (!networkBridge.closeSocket || !networkBridge.closeSocket(socket)) socket.close();
    }
  }, HEARTBEAT_MS);
}

function stopHeartbeat() {
  if (connectionSupervisor) {
    connectionSupervisor.stopHeartbeat();
    return;
  }
  window.clearInterval(heartbeatTimer);
  heartbeatTimer = 0;
}

function clearReconnectTimer() {
  if (connectionSupervisor) {
    connectionSupervisor.clearReconnectTimer();
    return;
  }
  window.clearTimeout(reconnectTimer);
  reconnectTimer = 0;
}

function resetReconnectAttempts() {
  if (connectionSupervisor) {
    connectionSupervisor.resetReconnectAttempts();
    return;
  }
  reconnectAttempts = 0;
  clientDiagnostics.reconnectAttempts = reconnectAttempts;
}

function scheduleReconnect() {
  if (connectionSupervisor) {
    connectionSupervisor.scheduleReconnect();
    return;
  }
  if (clientShuttingDown || !lastJoinPayload || reconnectTimer) return;
  if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) return;
  reconnectAttempts += 1;
  clientDiagnostics.reconnectAttempts = reconnectAttempts;
  const delay = clientRuntime.getReconnectDelay
    ? clientRuntime.getReconnectDelay(reconnectAttempts)
    : Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (reconnectAttempts - 1));
  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = 0;
    connect({ reconnect: true, payload: lastJoinPayload });
  }, delay);
}

inputTimer = window.setInterval(() => {
  if (!socket || socket.readyState !== WebSocket.OPEN || !state) return;
  const self = getSelf();
  const camera = getCamera();
  const pointer = inputManager ? inputManager.getPointer() : mouse;
  const aimX = camera.x - viewW / 2 + pointer.x;
  const aimY = camera.y - viewH / 2 + pointer.y;
  const inputBlocked = Boolean(settingsOverlay && !settingsOverlay.classList.contains("hidden"));
  const spectating = Boolean(self?.spectator) || inputBlocked;
  const move = spectating ? { mx: 0, my: 0 } : readMoveInput();

  sendClientMessage({
    type: "input",
    mx: move.mx,
    my: move.my,
    aimX: self && !spectating ? aimX : 900,
    aimY: self && !spectating ? aimY : 560,
    attacking: !spectating && (inputManager ? inputManager.isMouseDown() : mouseDown),
    skillSeqs: inputManager ? inputManager.getSkillSeqs() : skillSeqs,
    dashSeq: inputManager ? inputManager.getDashSeq() : dashSeq
  });
}, 1000 / INPUT_RATE);

window.addEventListener("beforeunload", cleanupClientRuntime);

function cleanupClientRuntime() {
  clientShuttingDown = true;
  connectionSupervisor?.shutdown?.();
  window.clearInterval(roomListRefreshTimer);
  window.clearInterval(inputTimer);
  stopHeartbeat();
  clearReconnectTimer();
  window.clearTimeout(loadingTimer);
  if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    if (!networkBridge.closeSocket || !networkBridge.closeSocket(socket)) socket.close();
  }
  inputManager?.destroy?.();
  pixiRenderer?.destroy?.();
  window.__rogueClientStats = null;
  window.__rogueProgress = null;
}

function updateUi(nextState) {
  const self = getSelf();
  renderTopHud(nextState);
  startButton.classList.add("hidden");
  startButton.textContent = "START RUN";
  partyList.classList.toggle("lobby-hidden", nextState.room.status === "lobby");

  const activeParty = nextState.players.filter((player) => !player.spectator);
  partyList.innerHTML = activeParty
    .map((player) => {
      const hpPct = Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100));
      const selfClass = player.id === selfId ? " self" : "";
      const levelLabel = player.xpNext > 0 ? `Lv.${player.level}` : `Lv.${player.level} MAX`;
      const botLabel = player.bot ? "BOT · " : "";
      const meta =
        nextState.room.status === "lobby"
          ? `${botLabel}${player.classLabel} · ${player.ready ? "READY" : "TEST"}`
          : `${player.hp}/${player.maxHp}`;
      return `
        <div class="party-member${selfClass}" style="--member-color:${escapeHtml(player.color)}">
          <div class="avatar" style="background:${escapeHtml(player.color)}">${player.icon}</div>
          <div>
            <div class="party-name">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(levelLabel)}</span>
            </div>
            <div class="party-hp" aria-label="체력">
              <i style="width:${hpPct}%"></i>
            </div>
            <div class="party-meta">${escapeHtml(meta)}</div>
          </div>
        </div>
      `;
    })
    .join("");

  renderLobbyPanel(nextState, self);
  renderSkillDock(self);
  renderRelicDock(self);
  renderChoices(nextState.choices);
  renderSkillChoices(nextState.skillChoices);
  renderMapChoicesV2(nextState.room);
  renderResult(nextState);
  renderBanner(nextState);
}

function renderLobbyPanel(nextState, self) {
  if (!lobbyPanel) return;
  const inLobby = nextState.room.status === "lobby";
  lobbyPanel.classList.toggle("hidden", !inLobby);
  if (!inLobby) return;

  const readyCount = Number(nextState.room.readyCount || 0);
  const playerCount = Number(nextState.room.playerCount || nextState.players.filter((player) => !player.spectator).length || 0);
  const spectatorCount = Number(nextState.room.spectatorCount || 0);
  const isHost = selfId === nextState.room.hostId;
  lobbyReadyCount.textContent = `${readyCount}/${playerCount} READY${spectatorCount ? ` · ${spectatorCount} WATCHING` : ""}`;

  if (lobbyController?.applyClassCards) {
    lobbyController.applyClassCards(lobbyClassCards, self, classDescriptions);
  } else {
    lobbyClassCards.forEach((card) => {
      const classId = card.dataset.class || "";
      const meta = classDescriptions[classId];
      card.classList.toggle("selected", Boolean(self && classId === self.classId));
      card.disabled = false;
      if (meta) {
        const strong = card.querySelector("strong");
        const role = card.querySelector("em");
        const summary = card.querySelector("span");
        if (strong) strong.textContent = meta.label;
        if (role) role.textContent = meta.role.split("/")[0].trim();
        if (summary) summary.textContent = getCompactClassSummary(classId);
        card.title = `${meta.label} - ${meta.role}\n${meta.summary}`;
      }
    });
  }

  renderLobbyClassDetail(self?.classId || selectedClass);

  if (spectatorButton) {
    spectatorButton.classList.toggle("spectating", Boolean(self?.spectator));
    spectatorButton.disabled = !self;
    spectatorButton.textContent = self?.spectator ? "PLAY" : "SPECTATE";
  }

  readyButton.disabled = !self || Boolean(self?.spectator);
  readyButton.classList.toggle("ready", Boolean(self?.ready));
  readyButton.textContent = self?.spectator ? "WATCHING" : self?.ready ? "CANCEL READY" : "READY";

  lobbyStartButton.classList.toggle("hidden", !isHost);
  lobbyStartButton.disabled = !nextState.room.canStart;
  lobbyStartButton.textContent = nextState.room.allReady ? "START RUN" : "WAITING READY";

  if (lobbyBotControl) {
    lobbyBotControl.classList.toggle("hidden", !isHost);
  }
  if (lobbyBotCount) {
    lobbyBotCount.textContent = `BOT ${nextState.room.botCount || 0}`;
  }

  if (addBotButton) {
    addBotButton.disabled = !nextState.room.canAddBot;
    addBotButton.textContent = "+";
  }

  if (removeBotButton) {
    removeBotButton.disabled = !nextState.room.canRemoveBot;
    removeBotButton.textContent = "-";
  }

  lobbyPartyList.innerHTML = lobbyController?.renderParty
    ? lobbyController.renderParty(nextState.players, nextState.room, classDescriptions)
    : nextState.players
    .map((player) => {
      const stateText = player.spectator ? "WATCHING" : player.ready ? "READY" : "TESTING";
      const nameSuffix = `${player.id === nextState.room.hostId ? " · HOST" : ""}${player.bot ? " · BOT" : ""}${player.spectator ? " · VIEWER" : ""}`;
      const classMeta = classDescriptions[player.classId];
      const detail = player.spectator
        ? "관전자 카메라"
        : player.bot
          ? `자동 전투 · ${classMeta?.role || "직업 테스트"}`
          : classMeta?.role || "모든 스킬 테스트 가능";
      return `
        <div class="lobby-row" style="--member-color:${escapeHtml(player.color)}">
          <div class="lobby-row-main">
            <div class="avatar" style="background:${escapeHtml(player.color)}">${escapeHtml(player.icon)}</div>
            <div>
              <strong>${escapeHtml(player.name)}${escapeHtml(nameSuffix)}</strong>
              <small>${escapeHtml(player.classLabel)} · ${escapeHtml(detail)}</small>
            </div>
          </div>
          <div class="lobby-state ${player.ready || player.spectator ? "" : "waiting"}">${stateText}</div>
        </div>
      `;
    })
    .join("");
}

function getCompactClassSummary(classId) {
  const summaries = {
    warrior: "도발, 방패 돌진, 광역 베기로 파티 앞줄을 담당.",
    ranger: "긴 사거리, 2단 대시, 화살비로 안전하게 누적딜.",
    mage: "빙결, 운석, 연쇄 번개로 큰 웨이브를 폭발 처리.",
    engineer: "터렛, 지뢰, 드론을 깔아 구역을 장악.",
    puppeteer: "실표식을 쌓고 인형/결계/교대로 폭발.",
    martialist: "연격으로 기력을 쌓아 강화 스킬 사용.",
    alchemist: "산성+화염 반응 폭발과 영약 보조.",
    assassin: "다중 표식 후 그림자 추가타로 처형."
  };
  return summaries[classId] || "대기방에서 모든 스킬을 테스트할 수 있습니다.";
}

function renderLobbyClassDetail(classId) {
  if (!lobbyClassDetail) return;
  const meta = classDescriptions[classId] || classDescriptions.warrior;
  if (lobbyController?.renderClassDetail) {
    lobbyClassDetail.innerHTML = lobbyController.renderClassDetail(meta);
    return;
  }
  lobbyClassDetail.innerHTML = `
    <div class="lobby-class-detail-head">
      <div>
        <h3>${escapeHtml(meta.label)}</h3>
        <span>${escapeHtml(meta.role)}</span>
      </div>
      <strong>스킬 전체 해금</strong>
    </div>
    <p>${escapeHtml(meta.summary)}</p>
    <p class="lobby-class-passive"><b>패시브</b> ${escapeHtml(meta.passive)}</p>
    <div class="lobby-skill-tags">
      ${meta.skills
        .map(([key, name]) => `<span class="lobby-skill-tag"><b>${escapeHtml(key)}</b>${escapeHtml(name)}</span>`)
        .join("")}
    </div>
  `;
}

function renderSkillDock(self) {
  if (!skillDock) return;
  if (!self || self.spectator || !self.skillSlots || self.skillSlots.length === 0) {
    skillDock.innerHTML = "";
    return;
  }

  skillDock.innerHTML = self.skillSlots
    .map((slot) => {
      const cooldown = Math.max(0, Number(slot.cooldown || 0));
      const cooldownMax = Math.max(0.1, Number(slot.cooldownMax || cooldown || 1));
      const cooldownRatio = slot.unlocked ? clamp01(cooldown / cooldownMax) : 1;
      const cooldownAngle = Math.round(cooldownRatio * 360);
      const cooldownText = slot.unlocked && cooldown > 0 ? cooldown.toFixed(1) : "";
      const icon = slot.unlocked ? slot.icon || slot.slot : "";
      const classes = ["skill-slot", slot.unlocked ? "" : "locked", slot.ready ? "ready" : "", cooldown > 0 ? "cooling" : ""]
        .filter(Boolean)
        .join(" ");

      return `
        <div class="${classes}" style="--cooldown-angle:${cooldownAngle}deg;--skill-color:${escapeHtml(self.color || "#facc15")}">
          <div class="skill-icon" aria-hidden="true">${escapeHtml(icon || "-")}</div>
          <div class="cooldown-cover"></div>
          <kbd>${escapeHtml(slot.slot)}</kbd>
          <strong>${escapeHtml(slot.unlocked ? slot.name : "LOCKED")}</strong>
          <em>${escapeHtml(cooldownText)}</em>
        </div>
      `;
    })
    .join("");
}

function renderRelicDock(self) {
  if (!relicDock) return;
  const relics = self && !self.spectator && Array.isArray(self.relics) ? self.relics : [];
  if (relics.length === 0) {
    relicDock.classList.add("hidden");
    relicDock.innerHTML = "";
    return;
  }

  relicDock.classList.remove("hidden");
  relicDock.innerHTML = relics
    .map((relic) => {
      const level = Math.max(1, Number(relic.level || 1));
      const maxLevel = Math.max(level, Number(relic.maxLevel || level));
      const maxed = maxLevel > 1 && level >= maxLevel;
      return `
        <div class="relic-chip ${maxed ? "maxed" : ""}" data-rarity="${escapeHtml(
          relic.rarity || "common"
        )}" title="${escapeHtml(formatRelicTooltip(relic, level, maxLevel))}">
          <span class="relic-icon" aria-hidden="true">${escapeHtml(relic.icon || "유")}</span>
          <span class="relic-level">${escapeHtml(formatRelicLevel(level, maxLevel))}</span>
        </div>
      `;
    })
    .join("");
}

function formatRelicLevel(level, maxLevel) {
  return maxLevel > 1 ? `${level}/${maxLevel}` : `${level}`;
}

function formatRelicTooltip(relic, level, maxLevel) {
  return `${relic.name || "유물"} 레벨 ${formatRelicLevel(level, maxLevel)}\n${relic.text || ""}`;
}

function renderChoices(choices) {
  if (!choices || choices.length === 0) {
    activeChoiceKey = "";
    pendingChoiceKey = "";
    choiceOverlay.classList.add("hidden");
    choicesEl.innerHTML = "";
    renderRewardSummary(choiceRewardSummary, null);
    return;
  }

  const choiceKey = getChoiceKey(choices);
  if (pendingChoiceKey === choiceKey) {
    choiceOverlay.classList.add("hidden");
    return;
  }

  if (activeChoiceKey === choiceKey && choicesEl.children.length > 0) {
    choiceSubtitle.textContent = formatRelicChoiceSubtitle();
    renderRewardSummary(choiceRewardSummary, state?.room?.clearSummary, "자동 획득");
    choiceOverlay.classList.remove("hidden");
    return;
  }

  activeChoiceKey = choiceKey;
  choiceOverlay.classList.remove("hidden");
  renderRewardSummary(choiceRewardSummary, state?.room?.clearSummary, "자동 획득");
  choiceSubtitle.textContent = formatRelicChoiceSubtitle();
  choicesEl.innerHTML = choiceController?.renderRelicChoices
    ? choiceController.renderRelicChoices(choices)
    : choices
    .map((choice) => {
      const rarity = choice.rarity || "common";
      const rarityLabel = getChoiceRarityLabel(choice);
      const target = choice.target || "공용";
      const stackLabel = getRelicStackLabel(choice);
      return `
        <button class="choice-button has-icon" type="button" data-relic="${choice.id}" data-rarity="${escapeHtml(rarity)}" data-rarity-label="${escapeHtml(rarityLabel)}">
          <span class="choice-rarity-strip" aria-hidden="true"></span>
          <span class="choice-icon" aria-hidden="true">${escapeHtml(choice.icon || "유")}</span>
          <span class="choice-copy">
            <span class="choice-meta-row">
              <span class="rarity-badge">${escapeHtml(rarityLabel)}</span>
              <span class="choice-type-pill">${escapeHtml(target)}</span>
              ${stackLabel ? `<span class="choice-type-pill">${escapeHtml(stackLabel)}</span>` : ""}
            </span>
            <strong>${escapeHtml(choice.name)}</strong>
            <span>${escapeHtml(choice.text)}</span>
            <span class="choice-action-row"><span>유물 선택</span><i>CLICK</i></span>
          </span>
        </button>
      `;
    })
    .join("");

  [...choicesEl.querySelectorAll(".choice-button")].forEach((button) => {
    button.addEventListener("click", () => {
      pendingChoiceKey = choiceKey;
      sendClientMessage({ type: "choose", relicId: button.dataset.relic });
      choiceOverlay.classList.add("hidden");
    });
  });
}

function formatRelicChoiceSubtitle() {
  const left = state?.room?.choiceTimeLeft || 0;
  const pending = state?.room?.choicePending || 0;
  const reward = formatClearSummary(state?.room?.clearSummary);
  const suffix = pending > 0 ? `${pending}명 대기 · ${left}초 후 자동 선택` : "선택 완료";
  return reward ? `${reward} · ${suffix}` : suffix;
}

function formatRelicMeta(choice) {
  const rarity = choice.rarityLabel || rarityLabels[choice.rarity] || "COMMON";
  const target = choice.target || "공용";
  if (choice.consumable || !choice.maxLevel) return `${rarity} · ${target}`;
  const level = Math.max(1, Number(choice.level || 1));
  const maxLevel = Math.max(level, Number(choice.maxLevel || level));
  const stateLabel = choice.upgrading ? "강화" : "신규";
  return `${rarity} · ${target} · ${stateLabel} 레벨 ${level}/${maxLevel}`;
}

function getChoiceRarityLabel(choice) {
  return choice.rarityLabel || rarityLabels[choice.rarity] || "COMMON";
}

function getRelicStackLabel(choice) {
  if (choice.consumable || !choice.maxLevel) return choice.consumable ? "즉시 사용" : "";
  const level = Math.max(1, Number(choice.level || 1));
  const maxLevel = Math.max(level, Number(choice.maxLevel || level));
  const stateLabel = choice.upgrading ? "강화" : "신규";
  return `${stateLabel} 레벨 ${level}/${maxLevel}`;
}

function formatSkillMeta(choice) {
  const rarity = choice.rarityLabel || rarityLabels[choice.rarity] || "COMMON";
  const type = choice.slot ? `${choice.slot.toUpperCase()} 슬롯` : "스킬 강화";
  return `${rarity} · ${type}`;
}

function getSkillTypeLabel(choice) {
  return choice.slot ? `${choice.slot.toUpperCase()} 슬롯` : "강화";
}

function renderRewardSummary(target, summary, kicker = "스테이지 클리어") {
  if (!target) return;
  if (!summary) {
    target.classList.add("hidden");
    target.innerHTML = "";
    return;
  }

  const xpTotal = Number(summary.xpTotal || 0);
  const stageXp = Number(summary.stageXp || 0);
  const xpOrbs = Number(summary.xpOrbs || 0);
  const chests = Number(summary.chests || 0);
  const rewardChests = Number(summary.rewardChests || 0);
  target.classList.remove("hidden");
  target.innerHTML = `
    <em>${escapeHtml(kicker)}</em>
    <strong>${escapeHtml(formatClearSummary(summary) || "남은 보상 없음")}</strong>
    <span>${escapeHtml(
      chests > 0
        ? "남은 유물 상자는 다음 이동 전에 자동으로 열렸습니다."
        : xpTotal > 0 || xpOrbs > 0 || stageXp > 0 || rewardChests > 0
          ? "남은 경험치 구슬을 자동으로 획득했습니다."
          : "필드에 남은 경험치나 유물 상자가 없습니다."
    )}</span>
  `;
}

function formatClearSummary(summary) {
  if (!summary) return "";
  const parts = [];
  if (Number(summary.stageXp || 0) > 0) {
    parts.push(`Clear XP +${Number(summary.stageXp || 0)}`);
  }
  if (Number(summary.xpTotal || 0) > 0) {
    parts.push(`경험치 +${Number(summary.xpTotal || 0)} (${Number(summary.xpOrbs || 0)}개)`);
  } else {
    parts.push("경험치 0");
  }
  if (Number(summary.chests || 0) > 0) {
    parts.push(`유물 상자 x${Number(summary.chests || 0)}`);
  } else {
    parts.push("상자 0");
  }
  if (Number(summary.rewardChests || 0) > 0) {
    parts.push(`Clear Chest +${Number(summary.rewardChests || 0)}`);
  }
  if (Number(summary.stageXp || 0) > 0) {
    const zeroXpIndex = parts.findIndex((part) => !part.includes("+") && part.includes("0") && (part.includes("XP") || part.includes("경험")));
    if (zeroXpIndex >= 0) parts.splice(zeroXpIndex, 1);
  }
  return parts.join(" · ");
}

function renderSkillChoices(choices) {
  if (!choices || choices.length === 0) {
    activeSkillChoiceKey = "";
    pendingSkillChoiceKey = "";
    skillOverlay.classList.add("hidden");
    skillChoicesEl.innerHTML = "";
    return;
  }

  const choiceKey = getChoiceKey(choices);
  if (pendingSkillChoiceKey === choiceKey) {
    skillOverlay.classList.add("hidden");
    return;
  }

  if (activeSkillChoiceKey === choiceKey && skillChoicesEl.children.length > 0) {
    skillChoiceSubtitle.textContent = formatSkillChoiceSubtitle(choices);
    skillOverlay.classList.remove("hidden");
    return;
  }

  activeSkillChoiceKey = choiceKey;
  skillOverlay.classList.remove("hidden");
  const levelRequirement = choices[0]?.levelRequirement;
  skillChoiceTitle.textContent = levelRequirement ? `레벨 ${levelRequirement} 스킬 강화` : "스킬 강화";
  skillChoiceSubtitle.textContent = formatSkillChoiceSubtitle(choices);
  skillChoicesEl.innerHTML = choiceController?.renderSkillChoices
    ? choiceController.renderSkillChoices(choices)
    : choices
    .map((choice) => {
      const rarity = choice.rarity || "common";
      const rarityLabel = getChoiceRarityLabel(choice);
      const typeLabel = getSkillTypeLabel(choice);
      return `
        <button class="choice-button has-icon" type="button" data-skill="${choice.id}" data-rarity="${escapeHtml(rarity)}" data-rarity-label="${escapeHtml(rarityLabel)}">
          <span class="choice-rarity-strip" aria-hidden="true"></span>
          <span class="choice-icon" aria-hidden="true">${escapeHtml(choice.icon || "기")}</span>
          <span class="choice-copy">
            <span class="choice-meta-row">
              <span class="rarity-badge">${escapeHtml(rarityLabel)}</span>
              <span class="choice-type-pill">${escapeHtml(typeLabel)}</span>
            </span>
            <strong>${escapeHtml(choice.name)}</strong>
            <span>${escapeHtml(choice.text)}</span>
            <span class="choice-action-row"><span>강화 선택</span><i>CLICK</i></span>
          </span>
        </button>
      `;
    })
    .join("");

  [...skillChoicesEl.querySelectorAll(".choice-button")].forEach((button) => {
    button.addEventListener("click", () => {
      pendingSkillChoiceKey = choiceKey;
      sendClientMessage({ type: "chooseSkill", upgradeId: button.dataset.skill });
      skillOverlay.classList.add("hidden");
    });
  });
}

function formatSkillChoiceSubtitle(choices) {
  const levelRequirement = choices[0]?.levelRequirement;
  const left = state?.room?.advancementTimeLeft || 0;
  const pending = state?.room?.advancementPending || 0;
  const prefix = levelRequirement ? `레벨 ${levelRequirement} 레벨업` : "스킬 강화";
  return `${prefix} · 일시 정지 · ${pending}명 대기 · ${left}초 후 자동 선택`;
}

function renderMapChoices(room) {
  const choices = room.mapChoices || [];
  if (room.status !== "map" || choices.length === 0) {
    activeMapChoiceKey = "";
    pendingMapChoiceKey = "";
    renderedMapChoicesKey = "";
    renderedMapBoardKey = "";
    localMapVote = "";
    localMapVoteAt = 0;
    mapOverlay.classList.add("hidden");
    mapBoard.innerHTML = "";
    mapChoicesEl.innerHTML = "";
    renderRewardSummary(mapRewardSummary, null);
    return;
  }

  const choiceKey = getMapChoiceKey(room);
  const serverVote = room.selfMapVote || "";
  const localVoteFresh = Boolean(localMapVote) && performance.now() - localMapVoteAt < 1200;
  if (serverVote || !localVoteFresh) {
    localMapVote = serverVote;
    localMapVoteAt = serverVote ? localMapVoteAt : 0;
  }
  const visibleVote = serverVote || (localVoteFresh ? localMapVote : "");
  const voteLocked = Boolean(serverVote);
  activeMapChoiceKey = choiceKey;
  pendingMapChoiceKey = serverVote;
  mapOverlay.classList.remove("hidden");
  renderRewardSummary(mapRewardSummary, room.clearSummary, "스테이지 클리어");
  mapSubtitle.textContent = voteLocked
    ? `${formatMapVoteProgress(room)} · 투표 완료 · 파티 대기 중`
    : `${formatMapVoteProgress(room)} · 한 번 클릭해서 투표 · ${room.mapTimeLeft || 0}초`;

  const boardKey = getMapBoardRenderKey(room.stageMap, visibleVote, voteLocked);
  if (boardKey !== renderedMapBoardKey) {
    renderedMapBoardKey = boardKey;
    renderMapBoard(room.stageMap, visibleVote, voteLocked);
  }

  const choicesRenderKey = getMapChoicesRenderKey(choices, visibleVote, serverVote, localVoteFresh, voteLocked);
  if (choicesRenderKey !== renderedMapChoicesKey) {
    renderedMapChoicesKey = choicesRenderKey;
    mapChoicesEl.innerHTML = choices
      .map((choice) => {
        const selected = visibleVote === choice.id;
        const pending = !serverVote && localVoteFresh && localMapVote === choice.id;
        const stage = getStageNodeMeta(choice);
        const stageLabel = formatStageNodeLabel(choice);
        const title = choice.boss ? choice.boss.name : stageLabel;
        const description = choice.boss ? choice.boss.text : getStageNodeDescription(choice);
        const actionLabel = selected ? "투표 완료" : pending ? "투표 전송 중" : "이 경로 투표";
        return `
          <button class="choice-button map-choice-button ${stage.kind} ${stage.resolvedKind || ""} ${selected ? "selected" : ""} ${pending ? "pending" : ""}" type="button" data-node="${choice.id}" ${
            voteLocked ? "disabled" : ""
          }>
            <span class="map-choice-top">
              <em>${escapeHtml(choice.kind === "boss" ? "BOSS" : choice.kind === "elite" ? "ELITE" : "COMBAT")}</em>
              <b>${choice.votes || 0}표</b>
            </span>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(description)}</span>
            <span class="choice-action-row"><span>${escapeHtml(actionLabel)}</span><i>${voteLocked ? "LOCKED" : "CLICK"}</i></span>
          </button>
        `;
      })
      .join("");

    [...mapChoicesEl.querySelectorAll(".choice-button")].forEach(bindMapVoteButton);
  }
}

function renderMapChoicesV2(room) {
  const choices = room.mapChoices || [];
  if (room.status !== "map" || choices.length === 0) {
    activeMapChoiceKey = "";
    pendingMapChoiceKey = "";
    renderedMapChoicesKey = "";
    renderedMapBoardKey = "";
    localMapVote = "";
    localMapVoteAt = 0;
    mapOverlay.classList.add("hidden");
    mapBoard.innerHTML = "";
    mapChoicesEl.innerHTML = "";
    renderRewardSummary(mapRewardSummary, null);
    return;
  }

  const choiceKey = getMapChoiceKey(room);
  const serverVote = room.selfMapVote || "";
  const localVoteFresh = Boolean(localMapVote) && performance.now() - localMapVoteAt < 1200;
  if (serverVote || !localVoteFresh) {
    localMapVote = serverVote;
    localMapVoteAt = serverVote ? localMapVoteAt : 0;
  }

  const visibleVote = serverVote || (localVoteFresh ? localMapVote : "");
  const voteLocked = Boolean(serverVote);
  activeMapChoiceKey = choiceKey;
  pendingMapChoiceKey = serverVote;
  mapOverlay.classList.remove("hidden");
  renderRewardSummary(mapRewardSummary, room.clearSummary, "Stage clear");
  mapSubtitle.textContent = voteLocked
    ? `${formatMapVoteProgress(room)} · voted · waiting for party`
    : `${formatMapVoteProgress(room)} · click once to vote · ${room.mapTimeLeft || 0}s`;

  const boardKey = getMapBoardRenderKey(room.stageMap, visibleVote, voteLocked);
  if (boardKey !== renderedMapBoardKey) {
    renderedMapBoardKey = boardKey;
    renderMapBoard(room.stageMap, visibleVote, voteLocked);
  }

  const choicesRenderKey = getMapChoicesRenderKey(choices, visibleVote, serverVote, localVoteFresh, voteLocked);
  if (choicesRenderKey === renderedMapChoicesKey) return;
  renderedMapChoicesKey = choicesRenderKey;
  mapChoicesEl.innerHTML = mapController?.renderChoices
    ? mapController.renderChoices(choices, {
        visibleVote,
        serverVote,
        localVoteFresh,
        localMapVote,
        voteLocked,
        getStageNodeMeta,
        formatStageNodeLabel,
        getStageNodeDescription
      })
    : choices
    .map((choice) => {
      const selected = visibleVote === choice.id;
      const pending = !serverVote && localVoteFresh && localMapVote === choice.id;
      const stage = getStageNodeMeta(choice);
      const stageLabel = formatStageNodeLabel(choice);
      const title = choice.boss ? choice.boss.name : stageLabel;
      const description = choice.boss ? choice.boss.text : getStageNodeDescription(choice);
      const actionLabel = selected ? "투표 완료" : pending ? "투표 전송 중" : "이 경로 투표";
      return `
        <button class="choice-button map-choice-button ${stage.kind} ${stage.resolvedKind || ""} ${selected ? "selected" : ""} ${pending ? "pending" : ""}" type="button" data-node="${choice.id}" ${
          voteLocked ? "disabled" : ""
        }>
          <span class="map-choice-top">
            <em>${escapeHtml(stageLabel)}</em>
            <b>${choice.votes || 0}V</b>
          </span>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(description)}</span>
          <span class="choice-action-row"><span>${escapeHtml(actionLabel)}</span><i>${voteLocked ? "LOCKED" : "CLICK"}</i></span>
        </button>
      `;
    })
    .join("");

  [...mapChoicesEl.querySelectorAll(".choice-button")].forEach(bindMapVoteButton);
}

function renderMapBoard(stageMap, selfVote, voteLocked = false) {
  if (!stageMap || !stageMap.nodes) {
    mapBoard.innerHTML = "";
    return;
  }

  if (mapController?.renderBoard) {
    mapBoard.innerHTML = mapController.renderBoard(stageMap, {
      selfVote,
      voteLocked,
      getMapNodePosition,
      mapEdgePath,
      isMapPathEdge,
      getStageNodeMeta,
      formatStageNodeLabel,
      mapNodeGlyph
    });
    [...mapBoard.querySelectorAll(".map-node.available")].forEach(bindMapVoteButton);
    return;
  }

  const available = new Set(stageMap.availableNodeIds || []);
  const pathNodes = stageMap.pathNodeIds || [];
  const positions = new Map(stageMap.nodes.map((node) => [node.id, getMapNodePosition(node, stageMap)]));
  const startPosition = { x: 4, y: 50 };
  const startEdges = stageMap.currentNodeId
    ? []
    : stageMap.nodes
        .filter((node) => node.depth === 1)
        .map((node) => {
          const to = positions.get(node.id);
          return `<path class="map-edge available" d="${mapEdgePath(startPosition, to)}"></path>`;
        });
  const edgePaths = (stageMap.edges || [])
    .map(([fromId, toId]) => {
      const from = positions.get(fromId);
      const to = positions.get(toId);
      if (!from || !to) return "";
      const cls = [
        "map-edge",
        isMapPathEdge(pathNodes, fromId, toId) ? "completed" : "",
        fromId === stageMap.currentNodeId && available.has(toId) ? "available" : "",
        selfVote === toId ? "selected" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `<path class="${cls}" d="${mapEdgePath(from, to)}"></path>`;
    })
    .join("");

  mapBoard.innerHTML = `
    <div class="map-route">
      <div class="map-terrain" aria-hidden="true"></div>
      <svg class="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${startEdges.join("")}
        ${edgePaths}
      </svg>
      <div class="map-start ${stageMap.currentNodeId ? "completed" : "available"}" style="left:${startPosition.x}%;top:${startPosition.y}%">
        <strong>S</strong>
        <span>START</span>
      </div>
      ${stageMap.nodes
        .map((node) => {
          const position = positions.get(node.id);
          const style = `left:${position.x}%;top:${position.y}%`;
          const votes = node.votes || 0;
          const traitName = node.trait?.name || "";
          const modifierName = node.modifier?.name || "";
          const nodeCaption = node.boss ? node.boss.name : `${traitName} · ${modifierName}`;
          const stage = getStageNodeMeta(node);
          const nodeCaptionV2 = node.boss ? node.boss.name : formatStageNodeLabel(node);
      const cls = [
        "map-node",
        stage.kind,
        stage.resolvedKind || "",
        node.current ? "current" : "",
        available.has(node.id) ? "available" : "",
        selfVote === node.id ? "selected" : "",
        node.completed ? "completed" : ""
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <button class="${cls}" type="button" data-node="${node.id}" style="${style}" ${
          available.has(node.id) && !voteLocked ? "" : "disabled"
        }>
          <strong>${escapeHtml(mapNodeGlyph(node))}</strong>
          <span>${votes > 0 ? `${votes}V` : node.depth}</span>
          <small>${escapeHtml(nodeCaptionV2)}</small>
        </button>
      `;
        })
        .join("")}
    </div>
  `;

  [...mapBoard.querySelectorAll(".map-node.available")].forEach(bindMapVoteButton);
}

function sendMapVote(nodeId) {
  if (!nodeId || !canSendMessage()) return;
  if (state?.room?.selfMapVote) return;
  const now = performance.now();
  if (localMapVote === nodeId && now - localMapVoteAt < 200) return;
  localMapVote = nodeId;
  localMapVoteAt = now;
  pendingMapChoiceKey = nodeId;
  markPendingMapVote(nodeId);
  sendClientMessage({ type: "chooseMap", nodeId });
}

function bindMapVoteButton(button) {
  const vote = (event) => {
    event.preventDefault();
    sendMapVote(button.dataset.node);
  };
  button.addEventListener("pointerdown", vote);
  button.addEventListener("click", vote);
}

function markPendingMapVote(nodeId) {
  [...mapOverlay.querySelectorAll("[data-node]")].forEach((button) => {
    const selected = button.dataset.node === nodeId;
    button.classList.toggle("selected", selected);
    button.classList.toggle("pending", selected);
  });
}

function formatMapVoteProgress(room) {
  const voted = Object.values(room.mapVotes || {}).reduce((sum, count) => sum + Number(count || 0), 0);
  return `${voted}/${room.playerCount || 1} 투표`;
}

function getStageNodeMeta(nodeOrKind) {
  const rawStage = typeof nodeOrKind === "string" ? null : nodeOrKind?.stage || null;
  const kind = rawStage?.kind || (typeof nodeOrKind === "string" ? nodeOrKind : nodeOrKind?.kind) || "combat";
  const fallback = stageNodeFallbacks[kind] || stageNodeFallbacks.combat;
  const resolvedKind = rawStage?.resolvedKind || (typeof nodeOrKind === "string" ? "" : nodeOrKind?.resolvedKind || "");
  const resolvedFallback = resolvedKind ? stageNodeFallbacks[resolvedKind] || null : null;
  return {
    kind,
    resolvedKind,
    label: rawStage?.label || fallback.label,
    glyph: rawStage?.glyph || fallback.glyph,
    text: rawStage?.text || fallback.text,
    resolvedLabel: rawStage?.resolvedLabel || (resolvedFallback ? resolvedFallback.label : ""),
    reward: rawStage?.reward || null
  };
}

function formatStageNodeLabel(nodeOrKind) {
  const stage = getStageNodeMeta(nodeOrKind);
  return stage.resolvedLabel ? `${stage.label} -> ${stage.resolvedLabel}` : stage.label;
}

function getStageNodeDescription(node) {
  const stage = getStageNodeMeta(node);
  const parts = [stage.text];
  if (node?.trait?.name && stage.kind !== "reward" && stage.kind !== "blockade") parts.push(node.trait.name);
  if (node?.modifier?.id && node.modifier.id !== "safe_path" && !["reward", "blockade", "defense", "miniboss"].includes(stage.kind)) {
    parts.push(node.modifier.name);
  }
  if (stage.reward) {
    const rewardParts = [`XP +${stage.reward.clearXp || 0}`];
    if (stage.reward.clearChest) rewardParts.push(`Chest +${stage.reward.clearChest}`);
    if (Number(stage.reward.rarityBoost || 0) > 0) rewardParts.push(`Rare +${Math.round(Number(stage.reward.rarityBoost || 0) * 100)}%`);
    parts.push(rewardParts.join(", "));
  }
  return parts.filter(Boolean).join(" / ");
}

function getMapChoicesRenderKey(choices, visibleVote, serverVote, localVoteFresh, voteLocked) {
  return [
    visibleVote || "",
    serverVote || "",
    localVoteFresh ? localMapVote : "",
    voteLocked ? "locked" : "open",
    choices
      .map(
        (choice) =>
          `${choice.id}:${choice.kind}:${choice.votes || 0}:${choice.trait?.name || ""}:${choice.modifier?.name || ""}:${
            choice.boss?.id || ""
          }:${choice.stage?.label || ""}:${choice.stage?.resolvedLabel || ""}`
      )
      .join("|")
  ].join("::");
}

function getMapBoardRenderKey(stageMap, visibleVote, voteLocked) {
  if (!stageMap || !stageMap.nodes) return "";
  return [
    stageMap.currentNodeId || "",
    visibleVote || "",
    voteLocked ? "locked" : "open",
    (stageMap.availableNodeIds || []).join("|"),
    (stageMap.pathNodeIds || []).join("|"),
    (stageMap.nodes || [])
      .map(
        (node) =>
          `${node.id}:${node.kind}:${node.resolvedKind || ""}:${node.votes || 0}:${node.current ? 1 : 0}:${node.completed ? 1 : 0}:${
            node.boss?.id || ""
          }:${node.stage?.label || ""}:${node.stage?.resolvedLabel || ""}`
      )
      .join("|")
  ].join("::");
}

function getMapNodePosition(node, stageMap) {
  const depthMax = Math.max(1, (stageMap.depth || 1) - 1);
  const laneMax = Math.max(1, (stageMap.lanes || 1) - 1);
  const jitter = mapNodeJitter(node.id);
  const x = 11 + ((node.depth - 1) / depthMax) * 84 + jitter.x;
  const baseY = 17 + (node.lane / laneMax) * 66;
  const y = node.kind === "boss" ? 50 : baseY + jitter.y;
  return {
    x: clamp(x, 9, 95),
    y: clamp(y, 12, 88)
  };
}

function mapNodeJitter(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 9973;
  return {
    x: ((hash % 7) - 3) * 0.8,
    y: (((Math.floor(hash / 7) % 7) - 3) * 1.2)
  };
}

function mapEdgePath(from, to) {
  const dx = Math.max(8, Math.abs(to.x - from.x));
  const c1x = from.x + dx * 0.46;
  const c2x = to.x - dx * 0.46;
  return `M ${round2(from.x)} ${round2(from.y)} C ${round2(c1x)} ${round2(from.y)}, ${round2(c2x)} ${round2(to.y)}, ${round2(to.x)} ${round2(to.y)}`;
}

function isMapPathEdge(pathNodes, fromId, toId) {
  const index = pathNodes.indexOf(fromId);
  return index >= 0 && pathNodes[index + 1] === toId;
}

function mapNodeGlyph(node) {
  return getStageNodeMeta(node).glyph || "?";
}

function renderResult(nextState) {
  if (nextState.room.status !== "gameover") {
    lastRecordedResultKey = "";
    resultOverlay.classList.add("hidden");
    return;
  }

  const result = nextState.room.result || createFallbackResult(nextState);
  recordDisplayedResult(result, nextState);
  const victory = result.outcome === "victory";
  resultOverlay.classList.remove("hidden");
  resultModal.classList.toggle("victory", victory);
  resultModal.classList.toggle("defeat", !victory);
  resultMark.textContent = victory ? "WIN" : "END";
  resultKicker.textContent = victory ? "런 클리어" : "런 실패";
  resultTitle.textContent = victory ? "모든 스테이지 클리어" : "런 실패";
  resultSubtitle.textContent = victory
    ? "파티가 모든 챕터를 돌파했습니다."
    : `파티가 CH ${result.chapter || nextState.room.chapter || 1} · STAGE ${result.wave || nextState.room.wave || 0}에서 쓰러졌습니다.`;

  const rows = [
    ["진행도", `${result.stagesCleared || 0}/${result.totalStages || 0}`],
    ["최고 레벨", `${result.highestLevel || 1}`],
    ["점수", `${result.totalScore || 0}`],
    ["유물", formatRelicCount({ relicCount: result.totalRelics, relicMaxCount: result.totalRelicMax })],
    ["시간", formatDuration(result.durationSec || 0)],
    [
      "챕터",
      `${result.chapter || result.floor || nextState.room.chapter || nextState.room.floor || 1}/${
        result.maxChapters || nextState.room.maxChapters || 3
      }`
    ],
    ["마지막 스테이지", `${result.wave || nextState.room.wave || 0}`],
    ["파티", `${nextState.room.playerCount || nextState.players.length}`]
  ];

  resultStats.innerHTML = resultController?.renderStats
    ? resultController.renderStats(rows)
    : rows
    .map(
      ([label, value]) => `
        <div class="result-stat">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");

  resultPlayers.innerHTML = resultController?.renderPlayers
    ? resultController.renderPlayers(result.players || [])
    : (result.players || [])
    .map(
      (player) => `
        <div class="result-player ${player.downed ? "downed" : ""}">
          <div>
            <strong>${escapeHtml(player.name)}</strong>
            <span>${escapeHtml(player.classLabel || "모험가")} · Lv.${player.level || 1} · 유물 ${escapeHtml(
              formatRelicCount(player)
            )}</span>
          </div>
          <em>${player.downed ? "전투불능" : `${player.score || 0}점`}</em>
        </div>
      `
    )
    .join("");

  resultStartButton.disabled = !nextState.room.canReturnLobby;
  resultStartButton.textContent = "로비로 돌아가기";
  resultActionNote.textContent = "로비에서 직업을 다시 고르고 전원 READY 후 방장이 시작합니다.";
}

function createFallbackResult(nextState) {
  const totalScore = nextState.players.reduce((sum, player) => sum + (player.score || 0), 0);
  const totalRelics = nextState.players.reduce((sum, player) => sum + (player.relicCount || 0), 0);
  const totalRelicMax = nextState.players.reduce((sum, player) => sum + (player.relicMaxCount || 0), 0);
  const highestLevel = nextState.players.reduce((max, player) => Math.max(max, player.level || 1), 1);
  return {
    outcome: "defeat",
    title: "Run Failed",
    message: "런이 종료되었습니다.",
    chapter: nextState.room.chapter || nextState.room.floor,
    maxChapters: nextState.room.maxChapters || 3,
    floor: nextState.room.floor,
    wave: nextState.room.wave,
    stagesCleared: Math.max(0, (nextState.room.wave || 1) - 1),
    totalStages: (nextState.room.maxChapters || 3) * 8,
    durationSec: 0,
    totalScore,
    totalRelics,
    totalRelicMax,
    highestLevel,
    players: nextState.players.map((player) => ({
      name: player.name,
      classLabel: player.classLabel,
      level: player.level,
      score: player.score || 0,
      relicCount: player.relicCount || 0,
      relicMaxCount: player.relicMaxCount || 0,
      downed: player.downed
    }))
  };
}

function recordDisplayedResult(result, nextState) {
  const resultKey = getResultSaveKey(result, nextState);
  if (!resultKey || resultKey === lastRecordedResultKey) return;
  lastRecordedResultKey = resultKey;
  try {
    recordUserRunResult({
      ...result,
      chapter: result.chapter || result.floor || nextState.room.chapter || nextState.room.floor || 0,
      wave: result.wave || result.stage || nextState.room.wave || 0,
      highestLevel:
        result.highestLevel ||
        nextState.players.reduce((max, player) => Math.max(max, Number(player.level || 1)), 1),
      totalScore:
        result.totalScore ||
        nextState.players.reduce((sum, player) => sum + Number(player.score || 0), 0),
      totalRelics:
        result.totalRelics ||
        nextState.players.reduce((sum, player) => sum + Number(player.relicCount || 0), 0)
    });
  } catch {
    clientDiagnostics.progressSaveFailed = true;
  }
}

function getResultSaveKey(result, nextState) {
  const room = nextState.room || {};
  const players = (result.players || nextState.players || [])
    .map((player) =>
      [
        player.id || player.name || "",
        player.level || 1,
        player.score || 0,
        player.relicCount || 0,
        player.downed ? 1 : 0
      ].join(":")
    )
    .join("|");
  return [
    room.code || "",
    result.outcome || "defeat",
    result.chapter || result.floor || room.chapter || room.floor || 0,
    result.wave || result.stage || room.wave || 0,
    result.stagesCleared || 0,
    result.totalScore || 0,
    result.durationSec || 0,
    players
  ].join("::");
}

function formatRelicCount(source) {
  const current = Number(source?.relicCount || 0);
  const max = Number(source?.relicMaxCount || 0);
  return max > 0 ? `${current}/${max}` : `${current}`;
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function renderBanner(nextState) {
  if (nextState.room.status === "lobby") {
    centerBanner.textContent = nextState.room.allReady
      ? "전원 준비 완료 · 방장 시작 가능"
      : `로비 테스트 · ${nextState.room.readyCount || 0}/${nextState.room.playerCount || 0} 준비`;
    centerBanner.classList.remove("hidden");
    return;
  }

  if (nextState.room.status === "choice") {
    const reward = formatClearSummary(nextState.room.clearSummary);
    centerBanner.textContent = `${reward ? `스테이지 클리어 · ${reward} · ` : ""}유물 선택 · ${nextState.room.choicePending || 0}명 대기 · ${
      nextState.room.choiceTimeLeft || 0
    }초`;
    centerBanner.classList.remove("hidden");
    return;
  }

  if (nextState.room.status === "map") {
    const reward = formatClearSummary(nextState.room.clearSummary);
    centerBanner.textContent = `${reward ? `스테이지 클리어 · ${reward} · ` : ""}경로 투표 · ${nextState.room.mapTimeLeft || 0}초`;
    centerBanner.classList.remove("hidden");
    return;
  }

  if (nextState.room.status === "advancement") {
    const pending = nextState.room.advancementPending || 0;
    centerBanner.textContent =
      pending > 0
        ? `레벨업 · ${pending}명 대기 · ${nextState.room.advancementTimeLeft || 0}초`
        : "레벨업 선택 완료";
    centerBanner.classList.remove("hidden");
    return;
  }

  if (nextState.room.status === "gameover") {
    centerBanner.classList.add("hidden");
    return;
  }

  if (nextState.room.waveTrait && nextState.room.status === "combat" && nextState.room.wave <= 1) {
    centerBanner.textContent = `${nextState.room.waveTrait.name}: ${nextState.room.waveTrait.text}`;
    centerBanner.classList.remove("hidden");
    return;
  }

  centerBanner.classList.add("hidden");
}

function syncVisuals(nextState) {
  syncVisualMap(visuals.players, nextState.players);
  syncVisualMap(visuals.enemies, nextState.enemies);
  syncVisualMap(visuals.projectiles, nextState.projectiles);
  syncVisualMap(visuals.hazards, nextState.hazards || []);
  syncVisualMap(visuals.chests, nextState.relicChests || []);
  syncVisualMap(visuals.xpOrbs, nextState.xpOrbs || []);
}

function syncVisualMap(map, entities) {
  const liveIds = new Set();

  for (const entity of entities) {
    const id = String(entity.id);
    liveIds.add(id);
    const visual = map.get(id);
    if (!visual) {
      map.set(id, {
        x: entity.x,
        y: entity.y,
        targetX: entity.x,
        targetY: entity.y
      });
      continue;
    }
    if (
      entity.windup &&
      (entity.windup.kind === "charge" || entity.windup.kind === "bomber_explode") &&
      Number.isFinite(entity.windup.startX) &&
      Number.isFinite(entity.windup.startY)
    ) {
      visual.targetX = entity.windup.startX;
      visual.targetY = entity.windup.startY;
    } else {
      visual.targetX = entity.x;
      visual.targetY = entity.y;
    }
  }

  for (const id of map.keys()) {
    if (!liveIds.has(id)) map.delete(id);
  }
}

function updateVisuals(dt) {
  if (!state) return;

  updatePlayerVisuals(dt);
  updateEntityVisuals(visuals.enemies, state.enemies, 34, dt, 58);
  updateEntityVisuals(visuals.projectiles, state.projectiles, 22, dt);
  updateEntityVisuals(visuals.hazards, state.hazards || [], 18, dt);
  updateEntityVisuals(visuals.chests, state.relicChests || [], 18, dt);
  updateEntityVisuals(visuals.xpOrbs, state.xpOrbs || [], 24, dt);
  updateFloatingEffects(dt);
}

function updatePlayerVisuals(dt) {
  const move = readMoveInput();
  const moveLength = Math.hypot(move.mx, move.my);
  const world = state.room.world;

  for (const player of state.players) {
    const visual = visuals.players.get(String(player.id));
    if (!visual) continue;

    if (player.knockbackMove && player.knockbackMove.active) {
      const chargeHit = player.knockbackMove.style === "charge_hit";
      settleVisual(visual, chargeHit ? 76 : 68, dt, chargeHit ? 600 : 520);
    } else if (player.dashMove && player.dashMove.active) {
      const shieldCharge = player.dashMove.style === "shield_charge";
      settleVisual(visual, shieldCharge ? 82 : 64, dt, shieldCharge ? 640 : 520);
    } else if (player.id === selfId && !player.downed && moveLength > 0) {
      visual.x = clamp(visual.x + (move.mx / moveLength) * player.speed * dt, 32, world.w - 32);
      visual.y = clamp(visual.y + (move.my / moveLength) * player.speed * dt, 32, world.h - 32);
      settleVisual(visual, 16, dt, 52);
    } else {
      settleVisual(visual, player.id === selfId ? 26 : 20, dt, 58);
    }
  }
}

function updateEntityVisuals(map, entities, stiffness, dt, snapDistance = 260) {
  for (const entity of entities) {
    const visual = map.get(String(entity.id));
    if (!visual) continue;
    const charging = Boolean(entity.chargeMove && entity.chargeMove.active);
    const lockedWindup = Boolean(entity.windup && (entity.windup.kind === "charge" || entity.windup.kind === "bomber_explode"));
    const knocked = Boolean(entity.knockbackMove && entity.knockbackMove.active);
    const shieldPushed = entity.knockbackMove?.style === "shield_charge_push";
    const activeStiffness = lockedWindup ? 120 : shieldPushed ? 54 : charging || knocked ? 72 : stiffness;
    const activeSnapDistance = lockedWindup ? 520 : shieldPushed ? 760 : charging || knocked ? 520 : snapDistance;
    settleVisual(visual, activeStiffness, dt, activeSnapDistance);
  }
}

function settleVisual(visual, stiffness, dt, snapDistance = 260) {
  const dx = visual.targetX - visual.x;
  const dy = visual.targetY - visual.y;
  if (Math.hypot(dx, dy) > snapDistance) {
    visual.x = visual.targetX;
    visual.y = visual.targetY;
    return;
  }

  const alpha = 1 - Math.exp(-stiffness * dt);
  visual.x += dx * alpha;
  visual.y += dy * alpha;
}

function readMoveInput() {
  if (inputManager) return inputManager.readMove();
  let mx = 0;
  let my = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
  return { mx, my };
}

function getChoiceKey(choices) {
  return choices && choices.length > 0 ? choices.map((choice) => choice.id).join("|") : "";
}

function getMapChoiceKey(room) {
  const choices = room.mapChoices || [];
  const votes = room.mapVotes || {};
  return [
    room.status,
    room.mapTimeLeft || 0,
    room.selfMapVote || "",
    formatClearSummary(room.clearSummary),
    choices.map((choice) => `${choice.id}:${choice.votes || 0}:${choice.boss?.id || ""}`).join("|"),
    Object.entries(votes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, count]) => `${id}:${count}`)
      .join("|")
  ].join("::");
}

function ingestEffects(effects) {
  for (const effect of effects) {
    if (seenEffectIds.has(effect.id)) continue;
    seenEffectIds.add(effect.id);
    const ttlByKind = {
      damage: 0.78,
      poison: effect.value ? 0.78 : 0.62,
      heal: 0.78,
      xp: 0.72,
      slash: effect.style === "warrior_cleave" ? 0.74 : 0.62,
      spin: 0.7,
      dash:
        effect.style === "shield_charge"
          ? 0.66
          : effect.style === "warrior_dash" || effect.style === "martial_rising" || effect.style === "shadow_lunge"
            ? 0.54
            : 0.42,
      explosion: 0.7,
      death: 0.74,
      level: 0.9,
      shield: 0.7,
      cleanse: 0.78,
      revive: 1.05,
      slow: 0.76,
      freeze: 0.92,
      warning: 0.62,
      meteor: 1.05,
      trap: 0.9,
      shot: 0.38,
      impact:
        effect.style === "critical_hit"
          ? 0.44
          : effect.style === "heavy_hit" || effect.style === "player_hit" || effect.style === "player_poison_hit"
            ? 0.38
            : 0.34,
      arcane: 0.48,
      chain: 0.48,
      holy: 0.82,
      star: 0.56,
      chest: 0.64
    };
    floatingEffects.push({
      ...effect,
      age: 0,
      seed: (Number(effect.id) || 0) * 0.731,
      ttl: Number.isFinite(effect.duration) ? Math.max(0.12, effect.duration) : ttlByKind[effect.kind] || 0.62
    });
    screenShake = Math.max(screenShake, getEffectShake(effect));
  }
  if (seenEffectIds.size > 500) {
    const keep = new Set(floatingEffects.map((effect) => effect.id));
    for (const id of seenEffectIds) {
      if (!keep.has(id)) seenEffectIds.delete(id);
    }
  }
}

function getEffectShake(effect) {
  if (effect.kind === "explosion" || effect.kind === "meteor") return 12;
  if (effect.kind === "spin") return 10;
  if (effect.kind === "slash") return effect.style === "warrior_cleave" ? 9 : 6;
  if (effect.kind === "dash" && effect.style === "shield_charge") return 13;
  if (effect.kind === "dash" && effect.style === "warrior_dash") return 9;
  if (effect.kind === "dash" && (effect.style === "martial_rising" || effect.style === "martial_dash")) return 7;
  if (effect.kind === "dash" && (effect.style === "shadow_lunge" || effect.style === "shadow_dash")) return 5;
  if (effect.kind === "dash" && effect.style === "mage_blink") return 5;
  if (effect.kind === "dash" && effect.style === "cleric_dash") return 4;
  if (effect.kind === "freeze") return 3;
  if (effect.kind === "death") return 5;
  if (effect.kind === "impact" && (effect.style === "player_hit" || effect.style === "player_poison_hit")) {
    return effect.playerId === selfId ? (effect.heavy ? 12 : 8) : 3;
  }
  if (effect.kind === "impact" && effect.style === "critical_hit") return 10;
  if (effect.kind === "impact" && effect.style === "heavy_hit") return 7;
  if (effect.kind === "impact" && effect.style === "enemy_hit") return 3;
  if (effect.kind === "impact" && effect.style === "shield_slam") return 8;
  if (effect.kind === "impact" && (effect.style || "").includes("impact")) return 4;
  return 0;
}

function updateFloatingEffects(dt) {
  screenShake = Math.max(0, screenShake - dt * 32);
  for (const effect of floatingEffects) {
    effect.age += dt;
    if (effect.kind === "damage" || effect.kind === "heal" || effect.kind === "xp" || (effect.kind === "poison" && effect.value)) {
      effect.y -= dt * 42;
    }
  }
  for (let i = floatingEffects.length - 1; i >= 0; i -= 1) {
    if (floatingEffects[i].age >= floatingEffects[i].ttl) floatingEffects.splice(i, 1);
  }
}

function resizeCanvas(now = performance.now()) {
  if (now - lastResizeCheck < 250) {
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    return;
  }
  lastResizeCheck = now;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  renderScale = dpr;
  viewW = Math.max(320, rect.width);
  viewH = Math.max(320, rect.height);

  const width = Math.round(viewW * dpr);
  const height = Math.round(viewH * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function frame() {
  if (clientShuttingDown) return;
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  clientPerfFrameCount += 1;
  clientDiagnostics.frameMs = Math.round(dt * 10000) / 10;
  clientDiagnostics.pixi = Boolean(pixiRenderer && pixiRenderer.ready);
  clientDiagnostics.effects = floatingEffects.length;
  if (now - clientPerfLastSampleAt >= 500) {
    clientDiagnostics.fps = Math.round((clientPerfFrameCount * 1000) / Math.max(1, now - clientPerfLastSampleAt));
    clientPerfFrameCount = 0;
    clientPerfLastSampleAt = now;
  }

  resizeCanvas(now);
  updateVisuals(dt);

  if (pixiRenderer && pixiRenderer.ready) {
    pixiRenderer.resize(viewW, viewH);
    pixiRenderer.render(now, dt, viewW, viewH);
  } else {
    ctx.clearRect(0, 0, viewW, viewH);
    if (!state) {
      drawEmpty();
    } else {
      drawGame();
    }
  }

  animationFrameId = requestAnimationFrame(frame);
}

function drawEmpty() {
  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, viewW, viewH);
  drawStars(0, 0);
}

function drawGame() {
  const camera = getCamera();
  const room = state.room;
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const offsetX = viewW / 2 - camera.x + shakeX;
  const offsetY = viewH / 2 - camera.y + shakeY;

  ctx.fillStyle = "#0b0d0e";
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  drawDungeon(room.world);
  drawStageObjective(room.objective, room.world);
  drawHazards();
  drawXpOrbs();
  drawChests();
  drawProjectiles();
  drawEnemies();
  drawPlayers();
  drawFloatingEffects();
  drawAim(camera);
  ctx.restore();

  drawVignette();
  drawDamageVignette();
}

function drawDungeon(world) {
  ctx.fillStyle = "#101313";
  ctx.fillRect(0, 0, world.w, world.h);

  const grid = 80;
  ctx.strokeStyle = "rgba(246, 241, 232, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= world.w; x += grid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, world.h);
  }
  for (let y = 0; y <= world.h; y += grid) {
    ctx.moveTo(0, y);
    ctx.lineTo(world.w, y);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(202, 163, 90, 0.07)";
  ctx.lineWidth = 2;
  for (let x = 180; x < world.w; x += 360) {
    for (let y = 140; y < world.h; y += 280) {
      roundRect(x - 70, y - 44, 140, 88, 8);
      ctx.stroke();
    }
  }

  for (let y = 40; y < world.h; y += 110) {
    for (let x = 40; x < world.w; x += 110) {
      const shade = pseudoRandom(x, y) > 0.5 ? "rgba(202, 163, 90, 0.04)" : "rgba(127, 166, 113, 0.026)";
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, 34, 4);
    }
  }

  const centerGradient = ctx.createRadialGradient(world.w / 2, world.h / 2, 80, world.w / 2, world.h / 2, 520);
  centerGradient.addColorStop(0, "rgba(202, 163, 90, 0.085)");
  centerGradient.addColorStop(1, "rgba(202, 163, 90, 0)");
  ctx.fillStyle = centerGradient;
  ctx.fillRect(0, 0, world.w, world.h);

  ctx.strokeStyle = "rgba(202, 163, 90, 0.5)";
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, world.w - 10, world.h - 10);
  ctx.strokeStyle = "rgba(11, 14, 15, 0.9)";
  ctx.lineWidth = 16;
  ctx.strokeRect(16, 16, world.w - 32, world.h - 32);
}

function drawStageObjective(objective, world) {
  if (!objective) return;

  if (objective.type === "defense") {
    const x = objective.x || world.w / 2;
    const y = objective.y || world.h / 2;
    const radius = objective.radius || 42;
    const pct = clamp01((objective.hp || 0) / Math.max(1, objective.maxHp || 1));
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.04;

    ctx.save();
    const glow = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 2.6);
    glow.addColorStop(0, "rgba(127,166,113,0.28)");
    glow.addColorStop(1, "rgba(127,166,113,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(220,252,231,0.62)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI / 4 + (Math.PI / 2) * i + performance.now() / 2200;
      const px = x + Math.cos(angle) * radius * 1.18;
      const py = y + Math.sin(angle) * radius * 1.18;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "#7fa671";
    drawPolygon(x, y, radius * 0.82, 6, Math.PI / 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(246,241,232,0.78)";
    ctx.lineWidth = 3;
    drawPolygon(x, y, radius * 0.5, 6, Math.PI / 6);
    ctx.stroke();

    const barW = 110;
    const barH = 10;
    ctx.fillStyle = "rgba(17,17,15,0.82)";
    roundRect(x - barW / 2, y - radius - 34, barW, barH, 4);
    ctx.fill();
    ctx.fillStyle = pct < 0.35 ? "#c85d56" : "#7fa671";
    roundRect(x - barW / 2, y - radius - 34, barW * pct, barH, 4);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (objective.type === "blockade") {
    const x = objective.goalX || 58;
    const leaked = objective.leaked || 0;
    const leakLimit = objective.leakLimit || 1;
    const spawned = objective.spawned || 0;
    const total = objective.total || 0;
    const laneTop = objective.laneTop || world.h * 0.23;
    const laneBottom = objective.laneBottom || world.h * 0.77;
    const laneHeight = Math.max(120, laneBottom - laneTop);
    const dangerWidth = Math.max(140, x + 96);
    const now = performance.now();

    ctx.save();
    ctx.fillStyle = "rgba(4,5,5,0.34)";
    ctx.fillRect(0, 0, world.w, Math.max(0, laneTop));
    ctx.fillRect(0, laneBottom, world.w, Math.max(0, world.h - laneBottom));

    const corridor = ctx.createLinearGradient(0, laneTop, 0, laneBottom);
    corridor.addColorStop(0, "rgba(202,163,90,0.02)");
    corridor.addColorStop(0.5, "rgba(246,241,232,0.045)");
    corridor.addColorStop(1, "rgba(202,163,90,0.02)");
    ctx.fillStyle = corridor;
    ctx.fillRect(0, laneTop, world.w, laneHeight);

    const danger = ctx.createLinearGradient(0, 0, dangerWidth, 0);
    danger.addColorStop(0, leaked >= leakLimit - 1 ? "rgba(200,93,86,0.48)" : "rgba(200,93,86,0.34)");
    danger.addColorStop(0.46, "rgba(200,93,86,0.16)");
    danger.addColorStop(1, "rgba(200,93,86,0)");
    ctx.fillStyle = danger;
    ctx.fillRect(0, laneTop, dangerWidth, laneHeight);

    ctx.strokeStyle = "rgba(246,241,232,0.18)";
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.moveTo(28, laneTop);
    ctx.lineTo(world.w - 28, laneTop);
    ctx.moveTo(28, laneBottom);
    ctx.lineTo(world.w - 28, laneBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(200,93,86,0.3)";
    ctx.lineWidth = 16 + Math.sin(now / 120) * 2;
    ctx.beginPath();
    ctx.moveTo(x, laneTop + 12);
    ctx.lineTo(x, laneBottom - 12);
    ctx.stroke();

    ctx.strokeStyle = leaked >= leakLimit - 1 ? "rgba(200,93,86,0.92)" : "rgba(202,163,90,0.78)";
    ctx.lineWidth = 8;
    ctx.setLineDash([18, 10]);
    ctx.beginPath();
    ctx.moveTo(x, laneTop + 4);
    ctx.lineTo(x, laneBottom - 4);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = leaked >= leakLimit - 1 ? "rgba(200,93,86,0.18)" : "rgba(202,163,90,0.1)";
    for (let y = laneTop + 32; y < laneBottom - 16; y += 48) {
      ctx.beginPath();
      ctx.moveTo(x - 22, y);
      ctx.lineTo(x - 44, y + 16);
      ctx.lineTo(x - 22, y + 32);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "rgba(17,17,15,0.78)";
    roundRect(x + 14, laneTop + 18, 138, 34, 7);
    ctx.fill();
    ctx.fillStyle = "#f8f3e9";
    ctx.font = "900 13px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`BLOCK ${spawned}/${total}`, x + 26, laneTop + 32);
    ctx.fillStyle = leaked > 0 ? "#fecaca" : "#caa35a";
    ctx.fillText(`LEAK ${leaked}/${leakLimit}`, x + 26, laneTop + 48);
    ctx.restore();
  }
}

function drawPlayers() {
  const now = Date.now();
  for (const player of state.players) {
    if (player.spectator) continue;
    const position = getVisualPosition(visuals.players, player);
    const x = position.x;
    const y = position.y;
    const color = player.downed ? "#6b6460" : player.color;
    const pulse = now - player.lastSkillAt < 240 ? 1 : 0;
    const dashPulse = now - player.lastDashAt < 180 ? 1 : 0;
    const sizeScale = Math.max(1, Number(player.sizeScale || 1));
    const tauntGuard = player.statusEffects && player.statusEffects.includes("taunt_guard");
    const hitIFrame = Number(player.hitIFrameTime || 0) > 0;
    const bodyRadius = (player.id === selfId ? 22 : 18) * sizeScale;

    if (pulse) {
      ctx.fillStyle = `${hexToRgba(player.color, 0.16)}`;
      ctx.beginPath();
      ctx.arc(x, y, 72 * sizeScale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (dashPulse) {
      ctx.strokeStyle = hexToRgba(player.color, 0.66);
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 43 * sizeScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (tauntGuard) {
      const guardPulse = 1 + Math.sin(now / 105) * 0.055;
      ctx.fillStyle = hexToRgba(player.color, 0.14);
      ctx.beginPath();
      ctx.arc(x, y, 44 * sizeScale * guardPulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = hexToRgba("#facc15", 0.86);
      ctx.lineWidth = 5;
      ctx.setLineDash([14, 7]);
      ctx.beginPath();
      ctx.arc(x, y, 38 * sizeScale * guardPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (player.shield > 0) {
      ctx.strokeStyle = hexToRgba("#facc15", 0.72);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, (player.id === selfId ? 31 : 27) * sizeScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (player.statusEffects && player.statusEffects.length) {
      ctx.strokeStyle = hexToRgba("#93c5fd", 0.55);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, (player.id === selfId ? 36 : 32) * sizeScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (player.statusEffects?.includes("combo")) {
      const comboPulse = 1 + Math.sin(now / 86) * 0.06;
      ctx.strokeStyle = hexToRgba(classColors.martialist, 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, (player.id === selfId ? 39 : 34) * sizeScale * comboPulse, -Math.PI * 0.72, Math.PI * 0.72);
      ctx.stroke();
      const chiMax = Math.max(3, Math.round(Number(player.martialChiMax || 3)));
      const chi = Math.floor(Number(player.martialChi || 0));
      const arcStart = -Math.PI * 0.78;
      const arcEnd = Math.PI * 0.78;
      for (let i = 0; i < chiMax; i += 1) {
        const angle = arcStart + ((arcEnd - arcStart) * (i + 0.5)) / chiMax;
        ctx.fillStyle = i < chi ? hexToRgba("#fff7ed", 0.92) : hexToRgba(classColors.martialist, 0.22);
        ctx.beginPath();
        ctx.arc(
          x + Math.cos(angle) * 31 * sizeScale,
          y + Math.sin(angle) * 31 * sizeScale,
          (i < chi ? 3.1 : 2.1) * sizeScale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    if (player.statusEffects?.includes("stealth")) {
      const fadePulse = 0.42 + Math.abs(Math.sin(now / 74)) * 0.22;
      ctx.strokeStyle = hexToRgba(classColors.assassin, fadePulse);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, (player.id === selfId ? 42 : 36) * sizeScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = hexToRgba(classColors.assassin, 0.1);
      ctx.beginPath();
      ctx.arc(x, y, 48 * sizeScale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (hitIFrame) {
      const guardPulse = 1 + Math.sin(now / 38) * 0.05;
      const selfHit = player.id === selfId;
      if (selfHit) {
        ctx.fillStyle = "rgba(239,68,68,0.18)";
        ctx.beginPath();
        ctx.arc(x, y, 48 * sizeScale * guardPulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = selfHit ? "rgba(248,113,113,0.88)" : hexToRgba("#f8fafc", 0.62);
      ctx.lineWidth = selfHit ? 5 : 3;
      ctx.beginPath();
      ctx.arc(x, y, (player.id === selfId ? 36 : 29) * sizeScale * guardPulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    const previousAlpha = ctx.globalAlpha;
    if (hitIFrame) ctx.globalAlpha = 0.58 + Math.abs(Math.sin(now / 34)) * 0.28;
    drawPlayerSprite(player, x, y, bodyRadius, color, sizeScale);
    ctx.globalAlpha = previousAlpha;

    if (player.id === selfId) {
      drawSelfGauges(x, y - bodyRadius - 30, player);
    } else {
      drawPlayerNameOnly(x, y - bodyRadius - 16, player.name);
    }

    if (now - player.lastAttackAt < 130) {
      ctx.strokeStyle = hexToRgba(player.color, 0.55);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 38 * sizeScale, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawPlayerSprite(player, x, y, bodyRadius, color, sizeScale = 1) {
  const classId = player.classId || "warrior";
  const r = bodyRadius;
  const now = performance.now();
  const seed = stableNumericSeed(player.id);
  const moving =
    Math.hypot(Number(player.moveX || 0), Number(player.moveY || 0)) > 0.08 ||
    Boolean(player.dashMove?.active) ||
    Boolean(player.knockbackMove?.active);
  const bob = Math.sin(now / (moving ? 112 : 240) + seed * Math.PI * 2) * (moving ? 1.7 : 0.75) * sizeScale;
  const facing = Number.isFinite(player.facing) ? player.facing : 0;
  const facingSide = Math.cos(facing) >= 0 ? 1 : -1;
  const attackWind = Date.now() - Number(player.lastAttackAt || 0) < 145 ? 1 : 0;
  const skillWind = Date.now() - Number(player.lastSkillAt || 0) < 210 ? 1 : 0;
  const bodyTilt = (moving ? Math.sin(now / 130 + seed * 7) * 0.045 : Math.sin(now / 420 + seed * 4) * 0.012) + attackWind * 0.035;
  const downed = player.downed || player.hp <= 0;

  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(facingSide, 1);
  ctx.rotate(bodyTilt);
  ctx.translate((attackWind + skillWind * 0.5) * r * 0.05, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.72, r * 0.88, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPlayerMotionAfterimage(classId, r, color, player, moving);
  drawPlayerLegs(classId, r, color, now, downed, moving);
  drawPlayerBackSilhouette(classId, r, color);
  drawPlayerWeaponSilhouette(classId, r, color, now, "back", attackWind, skillWind);
  drawPlayerArms(classId, r, color, now, "back", attackWind, moving);

  ctx.shadowColor = hexToRgba(color, 0.62);
  ctx.shadowBlur = player.id === selfId ? 18 : 9;

  const bodyGradient = ctx.createLinearGradient(0, -r * 0.72, 0, r * 0.78);
  bodyGradient.addColorStop(0, downed ? "#7a706a" : hexToRgba(color, 0.98));
  bodyGradient.addColorStop(0.62, downed ? "#554d49" : hexToRgba(color, 0.76));
  bodyGradient.addColorStop(1, "#171512");
  ctx.fillStyle = bodyGradient;
  ctx.strokeStyle = "rgba(246,241,232,0.28)";
  ctx.lineWidth = Math.max(2, r * 0.08);
  roundRect(-r * 0.54, -r * 0.34, r * 1.08, r * 1.18, r * 0.34);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  drawPlayerArmorDetails(classId, r, color, now);
  drawPlayerArms(classId, r, color, now, "front", attackWind, moving);
  drawPlayerHead(classId, r, color, now);
  drawPlayerWeaponSilhouette(classId, r, color, now, "front", attackWind, skillWind);

  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.translate(0, r * 0.31);
  ctx.scale(Math.max(0.56, sizeScale * 0.58), Math.max(0.56, sizeScale * 0.58));
  drawClassMark(player, 0, 0, 1);
  ctx.restore();

  drawPlayerFrontDetails(classId, r, color, now);
  ctx.restore();
}

function drawPlayerMotionAfterimage(classId, r, color, player, moving) {
  const dashActive = Boolean(player.dashMove?.active || player.knockbackMove?.active);
  if (!moving && !dashActive) return;
  const alpha = dashActive ? 0.32 : 0.14;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = hexToRgba(color, dashActive ? 0.28 : 0.16);
  for (let i = 0; i < 3; i += 1) {
    const offset = r * (0.58 + i * 0.32);
    const scale = 1 - i * 0.18;
    ctx.beginPath();
    ctx.ellipse(-offset, r * (0.04 + i * 0.02), r * 0.46 * scale, r * 0.72 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (classId === "assassin" || classId === "martialist") {
    ctx.strokeStyle = hexToRgba(color, dashActive ? 0.52 : 0.26);
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-r * 1.28, -r * 0.24);
    ctx.lineTo(-r * 0.42, -r * 0.02);
    ctx.moveTo(-r * 1.18, r * 0.34);
    ctx.lineTo(-r * 0.36, r * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerLegs(classId, r, color, now, downed, moving = false) {
  const stride = Math.sin(now / (moving ? 95 : 180)) * r * (moving ? 0.11 : 0.035);
  const boot = downed ? "#3a3330" : "#171512";
  ctx.save();
  ctx.fillStyle = boot;
  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.14);
  ctx.lineWidth = Math.max(1.5, r * 0.045);
  for (const side of [-1, 1]) {
    const x = side * r * 0.26;
    roundRect(x - r * 0.16, r * 0.34 + side * stride, r * 0.26, r * 0.58, r * 0.09);
    ctx.fill();
    ctx.stroke();
    roundRect(x - r * 0.24, r * 0.78 + side * stride, r * 0.42, r * 0.14, r * 0.07);
    ctx.fill();
  }
  if (classId === "martialist" || classId === "assassin") {
    ctx.strokeStyle = hexToRgba(color, 0.62);
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, r * 0.48);
    ctx.lineTo(-r * 0.72, r * 0.82);
    ctx.moveTo(r * 0.45, r * 0.48);
    ctx.lineTo(r * 0.72, r * 0.82);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerBackSilhouette(classId, r, color) {
  ctx.save();
  if (classId === "mage") {
    ctx.fillStyle = hexToRgba("#111113", 0.76);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.06);
    ctx.quadraticCurveTo(-r * 0.92, -r * 0.14, -r * 0.72, r * 0.98);
    ctx.quadraticCurveTo(0, r * 0.7, r * 0.72, r * 0.98);
    ctx.quadraticCurveTo(r * 0.92, -r * 0.14, 0, -r * 1.06);
    ctx.fill();
  } else if (classId === "assassin") {
    ctx.fillStyle = hexToRgba("#111113", 0.82);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15);
    ctx.lineTo(-r * 0.82, r * 0.75);
    ctx.quadraticCurveTo(0, r * 1.08, r * 0.82, r * 0.75);
    ctx.closePath();
    ctx.fill();
  } else if (classId === "ranger") {
    ctx.strokeStyle = hexToRgba("#3f2d1d", 0.8);
    ctx.lineWidth = Math.max(3, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.82);
    ctx.quadraticCurveTo(-r * 1.08, 0, -r * 0.6, r * 0.82);
    ctx.stroke();
  } else if (classId === "engineer") {
    ctx.fillStyle = hexToRgba("#252018", 0.88);
    roundRect(-r * 0.76, -r * 0.18, r * 0.38, r * 0.82, r * 0.11);
    ctx.fill();
    roundRect(r * 0.38, -r * 0.18, r * 0.38, r * 0.82, r * 0.11);
    ctx.fill();
  } else if (classId === "puppeteer") {
    ctx.strokeStyle = hexToRgba(color, 0.42);
    ctx.lineWidth = 1.6;
    for (const offset of [-0.38, 0, 0.38]) {
      ctx.beginPath();
      ctx.moveTo(offset * r, -r * 1.1);
      ctx.quadraticCurveTo(offset * r * 0.4, -r * 0.08, offset * r * 1.4, r * 0.78);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPlayerArms(classId, r, color, now, layer = "front", attackWind = 0, moving = false) {
  const back = layer === "back";
  const sleeve = hexToRgba(color, back ? 0.48 : 0.78);
  const glove = classId === "martialist" ? "#f8f3e9" : "#171512";
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = sleeve;
  ctx.lineWidth = Math.max(5, r * 0.18);
  if (back) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.08);
    ctx.quadraticCurveTo(-r * 0.72, r * 0.16, -r * 0.82, r * 0.48);
    ctx.stroke();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(-r * 0.84, r * 0.5, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const lift = classId === "ranger" || classId === "engineer" ? -r * 0.12 : classId === "warrior" ? r * 0.02 : 0;
    const reach = attackWind * r * (classId === "warrior" || classId === "martialist" || classId === "assassin" ? 0.28 : 0.12);
    const sway = moving ? Math.sin(now / 110) * r * 0.04 : 0;
    ctx.beginPath();
    ctx.moveTo(r * 0.42, -r * 0.04 + sway);
    ctx.quadraticCurveTo(
      r * (0.78 + attackWind * 0.16),
      r * (0.12 + Math.sin(now / 220) * 0.03),
      r * 0.92 + reach,
      r * 0.45 + lift - attackWind * r * 0.08
    );
    ctx.stroke();
    ctx.fillStyle = glove;
    ctx.beginPath();
    ctx.arc(r * 0.94 + reach, r * 0.46 + lift - attackWind * r * 0.08, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayerWeaponSilhouette(classId, r, color, now, layer = "front", attackWind = 0, skillWind = 0) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const back = layer === "back";
  if (classId === "warrior") {
    if (!back && attackWind <= 0 && skillWind <= 0) {
      ctx.restore();
      return;
    }
    if (!back) {
      const power = Math.max(attackWind, skillWind);
      ctx.rotate(-0.42 + power * 0.18);
      ctx.fillStyle = "rgba(248,243,233,0.18)";
      ctx.beginPath();
      ctx.ellipse(r * 0.96, -r * 0.12, r * 0.74, r * 0.18, -0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f8f3e9";
      ctx.strokeStyle = "rgba(17,17,15,0.62)";
      ctx.lineWidth = Math.max(1.5, r * 0.045);
      ctx.beginPath();
      ctx.moveTo(r * 0.28, r * 0.18);
      ctx.lineTo(r * 1.42, -r * 0.66);
      ctx.lineTo(r * 1.58, -r * 0.48);
      ctx.lineTo(r * 0.52, r * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#6b4a2b";
      ctx.lineWidth = Math.max(3, r * 0.12);
      ctx.beginPath();
      ctx.moveTo(r * 0.3, r * 0.3);
      ctx.lineTo(r * 0.64, r * 0.02);
      ctx.stroke();
      ctx.strokeStyle = "#2a2118";
      ctx.lineWidth = Math.max(2, r * 0.08);
      ctx.beginPath();
      ctx.moveTo(r * 0.36, r * 0.12);
      ctx.lineTo(r * 0.58, r * 0.42);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.fillStyle = hexToRgba("#3f3426", 0.94);
    roundRect(-r * 0.98, -r * 0.2, r * 0.44, r * 0.76, r * 0.12);
    ctx.fill();
    ctx.strokeStyle = "#f8f3e9";
    ctx.lineWidth = Math.max(3, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(r * 0.52, r * 0.62);
    ctx.lineTo(r * 1.08, -r * 0.82);
    ctx.stroke();
    ctx.fillStyle = "#f8f3e9";
    ctx.beginPath();
    ctx.moveTo(r * 1.16, -r * 1.02);
    ctx.lineTo(r * 0.98, -r * 0.64);
    ctx.lineTo(r * 1.32, -r * 0.78);
    ctx.closePath();
    ctx.fill();
  } else if (classId === "ranger") {
    if (back) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = "#6f4a27";
    ctx.lineWidth = Math.max(3, r * 0.11);
    ctx.beginPath();
    ctx.moveTo(r * 0.76, -r * 0.86);
    ctx.quadraticCurveTo(r * 1.24, 0, r * 0.76, r * 0.86);
    ctx.stroke();
    ctx.strokeStyle = "rgba(246,241,232,0.72)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r * 0.76, -r * 0.78);
    ctx.lineTo(r * 0.76, r * 0.78);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.58);
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(r * 0.16, -r * 0.02);
    ctx.lineTo(r * 1.28, -r * 0.02);
    ctx.stroke();
  } else if (classId === "mage") {
    if (!back) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = "#4f3f61";
    ctx.lineWidth = Math.max(3, r * 0.12);
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, r * 0.76);
    ctx.lineTo(-r * 0.5, -r * 1.05);
    ctx.stroke();
    const orbY = -r * (1.12 + Math.sin(now / 210) * 0.04);
    ctx.fillStyle = hexToRgba(color, 0.72);
    ctx.beginPath();
    ctx.arc(-r * 0.48, orbY, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === "engineer") {
    if (back) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#2d2a22";
    roundRect(r * 0.48, -r * 0.18, r * 0.72, r * 0.28, r * 0.08);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.84);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(r * 1.18, -r * 0.04);
    ctx.lineTo(r * 1.42, -r * 0.04);
    ctx.stroke();
    ctx.fillStyle = hexToRgba(color, 0.82);
    ctx.beginPath();
    ctx.arc(r * 1.18, -r * 0.04, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === "puppeteer") {
    if (!back) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#21191f";
    ctx.beginPath();
    ctx.arc(r * 0.94, r * 0.42, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.65);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(r * 0.28, -r * 0.78);
    ctx.lineTo(r * 0.94, r * 0.24);
    ctx.stroke();
  } else if (classId === "martialist") {
    if (!back) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = hexToRgba("#f8f3e9", 0.92);
    ctx.beginPath();
    ctx.arc(-r * 0.72, -r * 0.04, r * 0.2, 0, Math.PI * 2);
    ctx.arc(r * 0.72, -r * 0.04, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === "alchemist") {
    if (back) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = hexToRgba(color, 0.68);
    ctx.beginPath();
    ctx.moveTo(r * 0.78, -r * 0.34);
    ctx.lineTo(r * 1.08, r * 0.36);
    ctx.quadraticCurveTo(r * 0.86, r * 0.62, r * 0.54, r * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#f8f3e9";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = hexToRgba("#ecfccb", 0.78);
    ctx.beginPath();
    ctx.arc(r * 0.84, r * 0.18, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === "assassin") {
    if (!back) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#f8f3e9";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.46, r * 0.5);
      ctx.lineTo(side * r * 1.04, -r * 0.35);
      ctx.lineTo(side * r * 0.72, -r * 0.18);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    if (!back) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = "#f8f3e9";
    ctx.lineWidth = Math.max(2.5, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(r * 0.56, r * 0.54);
    ctx.lineTo(r * 0.92, -r * 0.56);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerArmorDetails(classId, r, color, now) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (classId === "warrior") {
    ctx.fillStyle = hexToRgba("#f8f3e9", 0.2);
    roundRect(-r * 0.42, -r * 0.22, r * 0.84, r * 0.34, r * 0.08);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.44);
    ctx.lineWidth = Math.max(2, r * 0.055);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.36 + i * r * 0.36, -r * 0.2);
      ctx.lineTo(-r * 0.36 + i * r * 0.36, r * 0.5);
      ctx.stroke();
    }
  } else if (classId === "ranger") {
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.38);
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.18);
    ctx.lineTo(r * 0.34, r * 0.46);
    ctx.moveTo(r * 0.34, -r * 0.18);
    ctx.lineTo(-r * 0.32, r * 0.46);
    ctx.stroke();
  } else if (classId === "mage") {
    const glow = 0.38 + Math.sin(now / 180) * 0.12;
    ctx.strokeStyle = hexToRgba(color, glow);
    ctx.lineWidth = Math.max(2, r * 0.055);
    ctx.beginPath();
    ctx.arc(0, r * 0.2, r * 0.28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, r * 0.2);
    ctx.lineTo(r * 0.28, r * 0.2);
    ctx.moveTo(0, -r * 0.08);
    ctx.lineTo(0, r * 0.48);
    ctx.stroke();
  } else if (classId === "engineer") {
    ctx.fillStyle = "#171512";
    for (const x of [-0.28, 0.28]) {
      roundRect(x * r - r * 0.12, -r * 0.08, r * 0.24, r * 0.32, r * 0.04);
      ctx.fill();
    }
    ctx.strokeStyle = hexToRgba(color, 0.62);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, r * 0.3);
    ctx.lineTo(r * 0.42, r * 0.3);
    ctx.stroke();
  } else if (classId === "puppeteer") {
    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.62);
    ctx.lineWidth = 1.5;
    for (const x of [-0.32, 0, 0.32]) {
      ctx.beginPath();
      ctx.moveTo(x * r, -r * 0.24);
      ctx.lineTo(x * r * 0.6, r * 0.58);
      ctx.stroke();
    }
  } else if (classId === "martialist") {
    ctx.strokeStyle = hexToRgba("#fed7aa", 0.72);
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    ctx.arc(0, r * 0.18, r * 0.42, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
  } else if (classId === "alchemist") {
    for (const [x, c] of [
      [-0.28, "#bef264"],
      [0, "#facc15"],
      [0.28, "#fb7185"]
    ]) {
      ctx.fillStyle = hexToRgba(c, 0.74);
      ctx.beginPath();
      ctx.arc(x * r, r * 0.28, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (classId === "assassin") {
    ctx.fillStyle = hexToRgba("#111113", 0.72);
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.22);
    ctx.lineTo(-r * 0.36, r * 0.5);
    ctx.lineTo(r * 0.36, r * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawPlayerHead(classId, r, color, now) {
  ctx.save();
  const hooded = classId === "assassin" || classId === "puppeteer" || classId === "mage";
  const helmet = classId === "warrior" || classId === "engineer";
  ctx.fillStyle = hooded ? "#181317" : helmet ? "#2f2b24" : "#2b2520";
  ctx.beginPath();
  if (hooded) {
    ctx.moveTo(0, -r * 1.12);
    ctx.quadraticCurveTo(-r * 0.56, -r * 0.74, -r * 0.44, -r * 0.36);
    ctx.quadraticCurveTo(0, -r * 0.18, r * 0.44, -r * 0.36);
    ctx.quadraticCurveTo(r * 0.56, -r * 0.74, 0, -r * 1.12);
    ctx.fill();
  } else {
    ctx.arc(0, -r * 0.62, r * 0.46, 0, Math.PI * 2);
    ctx.fill();
  }

  if (helmet) {
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.32);
    ctx.lineWidth = Math.max(2, r * 0.055);
    ctx.beginPath();
    ctx.arc(0, -r * 0.68, r * 0.36, Math.PI * 0.06, Math.PI * 0.94);
    ctx.stroke();
  } else {
    ctx.fillStyle = hexToRgba(color, 0.5);
    ctx.beginPath();
    ctx.arc(0, -r * 0.64, r * 0.34, Math.PI * 0.08, Math.PI * 0.92);
    ctx.fill();
  }

  const eyeColor = classId === "mage" ? "#dbeafe" : classId === "assassin" ? "#f5d0fe" : "#f8f3e9";
  ctx.fillStyle = eyeColor;
  ctx.beginPath();
  ctx.arc(-r * 0.14, -r * 0.64, Math.max(1.6, r * 0.055), 0, Math.PI * 2);
  ctx.arc(r * 0.14, -r * 0.64, Math.max(1.6, r * 0.055), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(17,17,15,0.78)";
  ctx.lineWidth = Math.max(1.4, r * 0.045);
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.5);
  ctx.quadraticCurveTo(0, -r * 0.42 + Math.sin(now / 210) * r * 0.01, r * 0.28, -r * 0.5);
  ctx.stroke();

  if (classId === "ranger") {
    ctx.strokeStyle = hexToRgba(color, 0.72);
    ctx.lineWidth = Math.max(2, r * 0.055);
    ctx.beginPath();
    ctx.moveTo(-r * 0.48, -r * 0.86);
    ctx.lineTo(r * 0.36, -r * 0.94);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerFrontDetails(classId, r, color, now) {
  ctx.save();
  if (classId === "mage") {
    ctx.strokeStyle = hexToRgba(color, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * (0.66 + Math.sin(now / 260) * 0.03), Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
  } else if (classId === "engineer") {
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.45);
    ctx.lineWidth = 1.8;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.18, -r * 0.18);
      ctx.lineTo(i * r * 0.18, r * 0.58);
      ctx.stroke();
    }
  } else if (classId === "alchemist") {
    ctx.fillStyle = hexToRgba("#ecfccb", 0.5 + Math.sin(now / 180) * 0.12);
    ctx.beginPath();
    ctx.arc(r * 0.18, r * 0.36, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (classId === "puppeteer") {
    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.52);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.1);
    ctx.quadraticCurveTo(0, r * 0.24, r * 0.38, -r * 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClassMark(player, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  x = 0;
  y = 0;
  ctx.strokeStyle = "rgba(17,17,15,0.9)";
  ctx.fillStyle = "rgba(17,17,15,0.9)";
  ctx.lineWidth = 3;
  if (player.classId === "novice") {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 9, y + 7);
    ctx.lineTo(x + 9, y - 7);
    ctx.stroke();
  } else if (player.classId === "warrior") {
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 9);
    ctx.lineTo(x + 13, y - 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 8, y - 7, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else if (player.classId === "ranger") {
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 10);
    ctx.quadraticCurveTo(x + 6, y, x - 13, y - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 14, y);
    ctx.stroke();
  } else if (player.classId === "mage") {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.classId === "engineer") {
    roundRect(x - 10, y - 8, 20, 16, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x - 7, y);
    ctx.moveTo(x + 7, y);
    ctx.lineTo(x + 14, y);
    ctx.stroke();
  } else if (player.classId === "puppeteer") {
    ctx.beginPath();
    ctx.arc(x, y - 3, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 11, y + 9);
    ctx.quadraticCurveTo(x, y + 1, x + 11, y + 9);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  } else if (player.classId === "martialist") {
    ctx.beginPath();
    ctx.arc(x - 5, y - 2, 5, 0, Math.PI * 2);
    ctx.arc(x + 5, y - 2, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 10, y + 7);
    ctx.quadraticCurveTo(x, y + 13, x + 10, y + 7);
    ctx.stroke();
  } else if (player.classId === "alchemist") {
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 11);
    ctx.lineTo(x + 5, y - 11);
    ctx.lineTo(x + 5, y - 4);
    ctx.quadraticCurveTo(x + 12, y + 4, x, y + 12);
    ctx.quadraticCurveTo(x - 12, y + 4, x - 4, y - 4);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + 2, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (player.classId === "assassin") {
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 12);
    ctx.lineTo(x - 2, y + 12);
    ctx.lineTo(x - 7, y + 2);
    ctx.lineTo(x + 2, y - 12);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 11, y - 5);
    ctx.lineTo(x - 4, y - 1);
    ctx.lineTo(x - 11, y + 3);
    ctx.stroke();
  } else if (player.classId === "cleric") {
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
  }
  ctx.restore();
}

function getEnemyHitReaction(enemy) {
  let best = null;
  for (const effect of floatingEffects) {
    if (effect.kind !== "impact") continue;
    const style = effect.style || "";
    const isHitStyle = style === "enemy_hit" || style === "heavy_hit" || style === "critical_hit";
    if (!isHitStyle) continue;
    const targetMatch = effect.targetId && String(effect.targetId) === String(enemy.id);
    const nearMatch =
      !targetMatch &&
      Math.hypot(effect.x - enemy.x, effect.y - enemy.y) < enemy.radius + Math.max(28, Number(effect.radius || 0));
    if (!targetMatch && !nearMatch) continue;
    if (effect.age > Math.min(effect.ttl || 0.32, 0.26)) continue;
    if (!best || style === "critical_hit" || (effect.heavy && !best.heavy) || effect.age < best.age) {
      best = effect;
    }
  }
  if (!best) return { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, intensity: 0 };

  const style = best.style || "";
  const progress = clamp01(best.age / Math.max(0.12, Math.min(best.ttl || 0.32, 0.26)));
  const falloff = Math.pow(1 - progress, 1.45);
  const power = style === "critical_hit" ? 1.35 : best.heavy ? 1.05 : 0.72;
  const intensity = power * falloff;
  const angle = (Number(best.seed) || 0) + (style === "critical_hit" ? 0.8 : 0);

  return {
    offsetX: Math.cos(angle) * intensity * 2.8,
    offsetY: Math.sin(angle) * intensity * 2.2,
    scaleX: 1 + intensity * 0.08,
    scaleY: Math.max(0.88, 1 - intensity * 0.075),
    intensity
  };
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    const position = getVisualPosition(visuals.enemies, enemy);
    const x = position.x;
    const y = position.y;
    const bomberArming = enemy.windup && enemy.windup.kind === "bomber_explode";
    const armingProgress = bomberArming
      ? 1 - clamp01(Number(enemy.windup.time || 0) / Math.max(0.1, Number(enemy.windup.duration || enemy.windup.time || 1)))
      : 0;
    const hitReaction = getEnemyHitReaction(enemy);
    const damageFlash = floatingEffects.some(
      (effect) =>
        (effect.kind === "damage" || (effect.kind === "poison" && effect.value)) &&
        Math.abs(effect.x - enemy.x) < enemy.radius + 12 &&
        Math.abs(effect.y - (enemy.y - enemy.radius)) < enemy.radius + 28 &&
        effect.age < 0.12
    );
    const flash =
      damageFlash ||
      hitReaction.intensity > 0.16 ||
      (bomberArming && Math.sin(performance.now() / Math.max(45, 120 - armingProgress * 70)) > -0.25);

    if (enemy.windup && (enemy.windup.kind === "charge" || enemy.windup.kind === "snipe")) {
      const isSnipe = enemy.windup.kind === "snipe";
      if (isSnipe) {
        const dx = enemy.windup.x - x;
        const dy = enemy.windup.y - y;
        const length = Math.hypot(dx, dy) || 1;
        const rayLength = Math.max(state.room.world.w, state.room.world.h) * 1.25;
        const endX = x + (dx / length) * rayLength;
        const endY = y + (dy / length) * rayLength;
        const pulse = 0.3 + Math.sin(performance.now() / 110) * 0.08;
        ctx.lineCap = "round";
        ctx.strokeStyle = `rgba(248,113,113,${pulse})`;
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else {
        const lineStartX = Number.isFinite(enemy.windup.startX) ? enemy.windup.startX : x;
        const lineStartY = Number.isFinite(enemy.windup.startY) ? enemy.windup.startY : y;
        ctx.strokeStyle = hexToRgba(enemy.color, 0.78);
        ctx.lineWidth = 5;
        ctx.setLineDash([14, 8]);
        ctx.beginPath();
        ctx.moveTo(lineStartX, lineStartY);
        ctx.lineTo(enemy.windup.x, enemy.windup.y);
        ctx.stroke();
        ctx.setLineDash([]);
        const targetRadius = enemy.elite || enemy.type === "boss" ? 50 : 42;
        ctx.fillStyle = hexToRgba(enemy.color, 0.12);
        ctx.beginPath();
        ctx.arc(enemy.windup.x, enemy.windup.y, targetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(enemy.color, 0.82);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.windup.x, enemy.windup.y, targetRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (enemy.windup && enemy.windup.kind === "stalker_stab") {
      drawStalkerStabWindup(enemy, x, y);
    }

    if (enemy.windup && enemy.windup.kind === "stalker_shuriken") {
      drawStalkerShurikenWindup(enemy, x, y);
    }

    if (enemy.windup && isEliteWindupKind(enemy.windup.kind)) {
      drawEliteWindup(enemy, x, y);
    }

    if (bomberArming) {
      const originX = Number.isFinite(enemy.windup.startX) ? enemy.windup.startX : x;
      const originY = Number.isFinite(enemy.windup.startY) ? enemy.windup.startY : y;
      drawDangerTelegraph(originX, originY, enemy.windup.radius || 96, enemy.color || "#c85d56", armingProgress, {
        spokes: 10,
        stripeAlpha: 0.42,
        coreColor: "#fef2f2"
      });
      ctx.strokeStyle = `rgba(254,202,202,${0.45 + armingProgress * 0.34})`;
      ctx.lineWidth = 4 + armingProgress * 3;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(originX, originY, enemy.radius + 18 + Math.sin(performance.now() / 70) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (enemy.windup && enemy.windup.kind === "heal") {
      const pulse = 0.72 + Math.sin(performance.now() / 120) * 0.12;
      const radius = enemy.windup.radius || (enemy.elite ? 190 : 160);
      drawShamanHealAura(x, y, radius, enemy.color || "#86efac", 1 - clamp01(Number(enemy.windup.time || 0) / Math.max(0.1, Number(enemy.windup.duration || enemy.windup.time || 1))), {
        channel: true,
        alpha: 0.72
      });
      ctx.strokeStyle = hexToRgba("#dcfce7", 0.74);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, (enemy.radius + 18) * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (enemy.type === "boss") {
      drawBossAura(enemy, x, y);
    }

    if (enemy.elite) {
      drawEliteBadge(enemy, x, y);
    }

    ctx.fillStyle = hexToRgba(enemy.color, 0.17);
    ctx.beginPath();
    ctx.arc(x, y, enemy.radius + 8, 0, Math.PI * 2);
    ctx.fill();

    const hasBarrier = enemy.statusEffects && enemy.statusEffects.includes("barrier");
    if (hasBarrier) {
      const pulse = 1 + Math.sin(performance.now() / 150) * 0.045;
      drawBarrierPlates(enemy, x, y, pulse);
    }

    drawEnemyBody(enemy, x + hitReaction.offsetX, y + hitReaction.offsetY, flash, hitReaction);

    if (enemy.windup && enemy.windup.kind === "brute_swing") {
      drawBruteWindup(enemy, x, y);
    }

    const frozen = enemy.statusEffects && (enemy.statusEffects.includes("freeze") || enemy.statusEffects.includes("frozen"));
    if (frozen) {
      drawFrozenEnemyOverlay(enemy, x, y);
    }

    drawEnemyStatusPips(enemy, x, y);

    drawEnemyBar(enemy, x, y);
  }
}

function drawBruteWindup(enemy, x, y) {
  const windup = enemy.windup || {};
  const duration = Math.max(0.1, Number(windup.duration || windup.time || 1));
  const progress = 1 - clamp01(Number(windup.time || 0) / duration);
  const dirX = Number.isFinite(windup.dirX) ? windup.dirX : Math.cos(windup.angle || 0);
  const dirY = Number.isFinite(windup.dirY) ? windup.dirY : Math.sin(windup.angle || 0);
  const angle = Math.atan2(dirY, dirX);
  const r = enemy.radius;
  const pull = 1 - Math.pow(1 - progress, 2);
  const color = enemy.color || "#c85d56";

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = hexToRgba("#f6f1e8", 0.5 + progress * 0.26);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-r * 0.16, -r * 0.72);
  ctx.quadraticCurveTo(r * (0.12 + pull * 0.18), -r * (1.12 - pull * 0.28), r * (0.88 + pull * 0.45), -r * (0.8 - pull * 0.34));
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.82);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-r * 0.22, r * 0.64);
  ctx.quadraticCurveTo(r * (0.16 + pull * 0.24), r * (1.06 - pull * 0.22), r * (0.78 + pull * 0.54), r * (0.58 - pull * 0.28));
  ctx.stroke();

  ctx.fillStyle = hexToRgba("#fee2e2", 0.45 + progress * 0.22);
  ctx.beginPath();
  ctx.arc(r * (0.92 + pull * 0.48), -r * (0.78 - pull * 0.32), Math.max(4, r * 0.16), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#fecaca", 0.28 + progress * 0.32);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(r * 0.62, -r * 0.92);
  ctx.lineTo(r * (1.36 + pull * 0.42), -r * (0.56 - pull * 0.22));
  ctx.stroke();

  ctx.restore();
}

function drawStalkerStabWindup(enemy, x, y) {
  const windup = enemy.windup || {};
  const duration = Math.max(0.1, Number(windup.duration || windup.time || 1));
  const progress = 1 - clamp01(Number(windup.time || 0) / duration);
  const angle = Number.isFinite(windup.angle) ? windup.angle : 0;
  const range = Math.max(70, Number(windup.range || 108));
  const arc = Math.max(0.42, Number(windup.arc || 0.74));
  const color = enemy.color || "#8d7cae";
  drawStalkerStabTelegraph(x, y, range, angle, arc, color, progress);
}

function drawStalkerShurikenWindup(enemy, x, y) {
  const windup = enemy.windup || {};
  const duration = Math.max(0.1, Number(windup.duration || windup.time || 1));
  const progress = 1 - clamp01(Number(windup.time || 0) / duration);
  const angle = Number.isFinite(windup.angle)
    ? windup.angle
    : Math.atan2(Number(windup.y || y) - y, Number(windup.x || x) - x);
  const spread = Math.max(0.16, Number(windup.spread || 0.34));
  const range = Math.max(260, Number(windup.range || 620));
  const color = enemy.color || "#8d7cae";
  drawStalkerShurikenTelegraph(x, y, range, angle, spread, color, progress);
}

function drawStalkerStabTelegraph(x, y, range, angle, arc, color, progress) {
  const charge = 0.45 + progress * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = hexToRgba(color, 0.08 + progress * 0.16);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, range, -arc / 2, arc / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#f5d0fe", 0.42 + progress * 0.34);
  ctx.lineWidth = 3 + progress * 2;
  ctx.beginPath();
  ctx.arc(0, 0, range * (0.88 + progress * 0.08), -arc / 2, arc / 2);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#f6f1e8", 0.62 + progress * 0.28);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(range * 0.12, 0);
  ctx.lineTo(range * charge, 0);
  ctx.stroke();

  ctx.fillStyle = hexToRgba("#f6f1e8", 0.72 + progress * 0.24);
  ctx.beginPath();
  ctx.moveTo(range * charge + 10, 0);
  ctx.lineTo(range * charge - 8, -7);
  ctx.lineTo(range * charge - 5, 0);
  ctx.lineTo(range * charge - 8, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStalkerShurikenTelegraph(x, y, range, angle, spread, color, progress) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.lineCap = "round";

  for (const offset of [-spread, 0, spread]) {
    ctx.save();
    ctx.rotate(offset);
    ctx.strokeStyle = hexToRgba(color, 0.12 + progress * 0.24);
    ctx.lineWidth = 18 - Math.abs(offset) * 18;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(range * (0.7 + progress * 0.18), 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.32 + progress * 0.42);
    ctx.lineWidth = offset === 0 ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(24, 0);
    ctx.lineTo(range * (0.58 + progress * 0.28), 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = hexToRgba(color, 0.72);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 20 + progress * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function isEliteWindupKind(kind) {
  return typeof kind === "string" && kind.startsWith("elite_");
}

function drawEliteWindup(enemy, x, y) {
  const windup = enemy.windup || {};
  const duration = Math.max(0.1, Number(windup.duration || windup.time || 1));
  const progress = 1 - clamp01(Number(windup.time || 0) / duration);
  const color = enemy.color || "#caa35a";
  const radius = Number(windup.radius || 110);
  const tx = Number.isFinite(windup.x) ? windup.x : x;
  const ty = Number.isFinite(windup.y) ? windup.y : y;

  if (windup.kind === "elite_quake") {
    const dirX = Number.isFinite(windup.dirX) ? windup.dirX : Math.cos(windup.angle || 0);
    const dirY = Number.isFinite(windup.dirY) ? windup.dirY : Math.sin(windup.angle || 0);
    const length = Number(windup.radius || 250);
    const width = Number(windup.width || 64);
    drawEliteLineTelegraph(x, y, x + dirX * length, y + dirY * length, width, color, progress);
    return;
  }

  if (windup.kind === "elite_crossfire" && Array.isArray(windup.points)) {
    for (const point of windup.points) {
      const angle = Number.isFinite(point.angle) ? point.angle : Math.atan2((point.y || y) - y, (point.x || x) - x);
      const endX = x + Math.cos(angle) * Math.max(state.room.world.w, state.room.world.h);
      const endY = y + Math.sin(angle) * Math.max(state.room.world.w, state.room.world.h);
      drawEliteLineTelegraph(x, y, endX, endY, 20, color, progress);
    }
    return;
  }

  if (windup.kind === "elite_cluster_mortar" && Array.isArray(windup.points)) {
    for (const point of windup.points) {
      drawDangerTelegraph(point.x, point.y, radius, color, progress, {
        spokes: 8,
        stripeAlpha: 0.34,
        coreColor: "#fee2e2"
      });
    }
    return;
  }

  if (windup.kind === "elite_volley") {
    drawStalkerShurikenTelegraph(x, y, 520, windup.angle || 0, windup.spread || 0.42, color, progress);
    return;
  }

  if (windup.kind === "elite_fortify") {
    ctx.fillStyle = hexToRgba(color, 0.08);
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.84 + progress * 0.1), 0, Math.PI * 2);
    ctx.fill();
    drawHexRing(x, y, radius * (0.5 + progress * 0.22), color, 4);
    drawHexRing(x, y, radius * (0.28 + progress * 0.15), "#f8fafc", 2);
    return;
  }

  if (windup.kind === "elite_totem") {
    drawShamanHealAura(x, y, radius, color, progress, { channel: true, alpha: 0.86 });
    return;
  }

  if (windup.kind === "elite_screech") {
    ctx.save();
    ctx.strokeStyle = hexToRgba(color, 0.78);
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x, y, radius * (0.28 + i * 0.24 + progress * 0.18), 0, Math.PI * 2);
      ctx.stroke();
    }
    drawRadialSparks(x, y, radius * 0.75, "#dbeafe", 14, progress);
    ctx.restore();
    return;
  }

  drawDangerTelegraph(tx, ty, radius, color, progress, {
    spokes: windup.kind === "elite_shadow" ? 6 : 10,
    stripeAlpha: windup.kind === "elite_mine" ? 0.42 : 0.28,
    coreColor: windup.kind === "elite_slam" ? "#fef3c7" : "#fee2e2"
  });
}

function drawEliteLineTelegraph(fromX, fromY, toX, toY, width, color, progress) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.16 + progress * 0.24);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba("#fef2f2", 0.4 + progress * 0.36);
  ctx.lineWidth = Math.max(3, width * 0.16);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.restore();
}

function drawEliteBadge(enemy, x, y) {
  const color = enemy.affix === "venom" ? "#9aa15f" : enemy.affix === "volatile" ? "#c85d56" : enemy.affix === "frenzy" ? "#e8794f" : "#caa35a";
  const label = enemy.affix === "venom" ? "V" : enemy.affix === "volatile" ? "X" : enemy.affix === "frenzy" ? "F" : "B";
  const badgeY = y - enemy.radius - 18;

  ctx.save();
  ctx.translate(x, badgeY);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = "rgba(17,17,15,0.86)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  roundRect(-8, -8, 16, 16, 3);
  ctx.fill();
  ctx.stroke();
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "#f8f3e9";
  ctx.font = "900 9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 0.5);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexToRgba(color, 0.72);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - enemy.radius * 0.58, y - enemy.radius * 0.5);
  ctx.lineTo(x - enemy.radius * 0.24, y - enemy.radius * 0.78);
  ctx.moveTo(x + enemy.radius * 0.58, y - enemy.radius * 0.5);
  ctx.lineTo(x + enemy.radius * 0.24, y - enemy.radius * 0.78);
  ctx.stroke();
  ctx.restore();
}

function drawBarrierPlates(enemy, x, y, pulse = 1) {
  const r = enemy.radius + 12 + pulse * 2;
  ctx.save();
  ctx.strokeStyle = "rgba(147,164,184,0.78)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ]) {
    ctx.beginPath();
    ctx.moveTo(x + sx * r * 0.52, y + sy * r * 0.8);
    ctx.lineTo(x + sx * r * 0.82, y + sy * r * 0.52);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBossAura(enemy, x, y) {
  const r = enemy.radius;
  const color = enemy.color || "#c85d56";
  const phase = Math.max(1, Number(enemy.bossPhase || 1));
  const now = performance.now();
  const pulse = 1 + Math.sin(now / 180) * 0.035;

  ctx.save();
  const gradient = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * (2.15 + phase * 0.08));
  gradient.addColorStop(0, hexToRgba(color, 0.16));
  gradient.addColorStop(0.52, hexToRgba(color, 0.06));
  gradient.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r * (2.2 + phase * 0.12) * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(color, 0.56);
  ctx.lineWidth = 3 + phase;
  ctx.beginPath();
  for (let i = 0; i <= 24; i += 1) {
    const angle = (Math.PI * 2 * i) / 24 + now / 2400;
    const radius = r * (1.46 + (i % 2 ? 0.1 : 0.24) + phase * 0.04) * pulse;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawEnemyStatusPips(enemy, x, y) {
  if (!enemy.statusEffects || enemy.statusEffects.length === 0) return;
  const markers = [];
  if (enemy.statusEffects.includes("freeze") || enemy.statusEffects.includes("frozen")) markers.push({ label: "F", color: "#bfdbfe" });
  if (enemy.statusEffects.includes("slow")) markers.push({ label: "S", color: "#8aa8bd" });
  if (enemy.statusEffects.includes("poison")) markers.push({ label: "P", color: "#9aa15f" });
  if (enemy.statusEffects.includes("burn")) markers.push({ label: "B", color: "#c9824c" });
  if (enemy.statusEffects.includes("vulnerable")) markers.push({ label: "V", color: "#caa35a" });
  if (enemy.statusEffects.includes("marked")) markers.push({ label: "M", color: classColors.assassin });
  if (enemy.statusEffects.includes("threaded")) markers.push({ label: "L", color: classColors.puppeteer });
  if (enemy.statusEffects.includes("taunt")) markers.push({ label: "T", color: "#e8794f" });
  if (enemy.statusEffects.includes("barrier")) markers.push({ label: "G", color: "#93a4b8" });
  if (markers.length === 0) return;

  const size = 10;
  const gap = 3;
  const totalWidth = markers.length * size + (markers.length - 1) * gap;
  const startX = x - totalWidth / 2 + size / 2;
  const pipY = y + enemy.radius + 8;

  ctx.save();
  ctx.font = "800 7px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let i = 0; i < markers.length; i += 1) {
    const marker = markers[i];
    const px = startX + i * (size + gap);
    ctx.fillStyle = "rgba(17,17,15,0.82)";
    ctx.strokeStyle = marker.color;
    ctx.lineWidth = 1.4;
    roundRect(px - size / 2, pipY - size / 2, size, size, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = marker.color;
    ctx.fillText(marker.label, px, pipY + 0.4);
  }
  ctx.restore();
}

function drawBossBody(enemy, x, y, flash) {
  const r = enemy.radius;
  const color = flash ? "#f6f1e8" : enemy.color || "#c85d56";
  const phase = Math.max(1, Number(enemy.bossPhase || 1));
  const pattern = enemy.bossPattern || "";
  const now = performance.now();

  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = flash ? "#f6f1e8" : hexToRgba(color, 0.78);
  ctx.lineWidth = 4;

  if (enemy.bossId === "iron_warden" || pattern === "charge") {
    drawPolygon(x, y, r * 1.22, 8, Math.PI / 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(17,17,15,0.42)";
    roundRect(x - r * 0.58, y - r * 0.54, r * 1.16, r * 1.08, 7);
    ctx.fill();

    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.58);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.08, y - r * 0.85);
    ctx.lineTo(x - r * 0.52, y - r * 1.34);
    ctx.moveTo(x + r * 1.08, y - r * 0.85);
    ctx.lineTo(x + r * 0.52, y - r * 1.34);
    ctx.stroke();

    ctx.fillStyle = hexToRgba("#f4c76b", 0.85);
    drawPolygon(x, y - r * 0.1, r * 0.38, 3, -Math.PI / 2);
    ctx.fill();
  } else if (enemy.bossId === "hive_prophet" || pattern === "summon") {
    drawPolygon(x, y, r * 1.18, 6, -Math.PI / 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#ecfccb", 0.48 + phase * 0.08);
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + now / 1800;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * r * 0.46, y + Math.sin(angle) * r * 0.46);
      ctx.quadraticCurveTo(
        x + Math.cos(angle + 0.18) * r * 1.18,
        y + Math.sin(angle + 0.18) * r * 1.18,
        x + Math.cos(angle) * r * 1.56,
        y + Math.sin(angle) * r * 1.56
      );
      ctx.stroke();
    }

    ctx.fillStyle = hexToRgba("#ecfccb", 0.86);
    ctx.beginPath();
    ctx.arc(x, y, r * (0.34 + phase * 0.025), 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawPolygon(x, y, r * 1.18, 9, Math.PI / 9 + now / 2600);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.5);
    ctx.lineWidth = 4;
    for (let i = 0; i < 5; i += 1) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * r * 0.36, y + Math.sin(angle) * r * 0.36);
      ctx.lineTo(x + Math.cos(angle) * r * 1.32, y + Math.sin(angle) * r * 1.32);
      ctx.stroke();
    }

    ctx.fillStyle = hexToRgba("#111113", 0.62);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(color, 0.92);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r * (0.42 + Math.sin(now / 140) * 0.03), 0, Math.PI * 2);
    ctx.stroke();
  }

  if (phase >= 2) {
    ctx.strokeStyle = hexToRgba("#fee2e2", phase >= 3 ? 0.78 : 0.56);
    ctx.lineWidth = phase >= 3 ? 5 : 3;
    ctx.beginPath();
    ctx.arc(x, y, r * (0.84 + Math.sin(now / 110) * 0.035), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemyBody(enemy, x, y, flash, reaction = null) {
  const r = enemy.radius;
  ctx.save();
  if (reaction && reaction.intensity > 0.01) {
    ctx.translate(x, y);
    ctx.scale(reaction.scaleX, reaction.scaleY);
    x = 0;
    y = 0;
  }
  if (enemy.type === "boss") {
    drawBossSprite(enemy, x, y, flash);
    ctx.restore();
    return;
  }
  drawEnemySprite(enemy, x, y, flash);
  ctx.restore();
  return;

  ctx.fillStyle = flash ? "#f6f1e8" : enemy.color;
  ctx.strokeStyle = flash ? "#f6f1e8" : hexToRgba(enemy.color, 0.72);
  ctx.lineWidth = 3;
  ctx.beginPath();

  if (enemy.type === "runner" || enemy.type === "runner_tank" || enemy.type === "runner_fast") {
    if (enemy.type === "runner_tank") {
      roundRect(x - r * 0.92, y - r * 0.72, r * 1.84, r * 1.44, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(246,241,232,0.42)";
      ctx.stroke();
    } else if (enemy.type === "runner_fast") {
      ctx.moveTo(x - r * 1.2, y);
      ctx.lineTo(x + r * 0.82, y - r * 0.78);
      ctx.lineTo(x + r * 0.45, y);
      ctx.lineTo(x + r * 0.82, y + r * 0.78);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(246,241,232,0.38)";
      ctx.beginPath();
      ctx.moveTo(x - r * 1.2, y - r * 0.46);
      ctx.lineTo(x - r * 1.75, y - r * 0.46);
      ctx.moveTo(x - r * 1.2, y + r * 0.46);
      ctx.lineTo(x - r * 1.75, y + r * 0.46);
      ctx.stroke();
    } else {
      ctx.moveTo(x - r, y - r * 0.72);
      ctx.lineTo(x + r * 0.9, y);
      ctx.lineTo(x - r, y + r * 0.72);
      ctx.lineTo(x - r * 0.58, y);
      ctx.closePath();
      ctx.fill();
    }
  } else if (enemy.type === "bat") {
    ctx.ellipse(x, y, r + 8, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.2, y);
    ctx.lineTo(x - r * 1.45, y - r * 0.7);
    ctx.lineTo(x - r * 0.95, y + r * 0.2);
    ctx.moveTo(x + r * 0.2, y);
    ctx.lineTo(x + r * 1.45, y - r * 0.7);
    ctx.lineTo(x + r * 0.95, y + r * 0.2);
    ctx.stroke();
  } else if (enemy.type === "charger") {
    ctx.moveTo(x + r + 7, y);
    ctx.lineTo(x - r * 0.84, y - r);
    ctx.lineTo(x - r * 0.48, y);
    ctx.lineTo(x - r * 0.84, y + r);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === "spitter") {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x + r + 8, y);
    ctx.arc(x + r * 0.56, y, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.type === "runner" || enemy.type === "runner_tank" || enemy.type === "runner_fast") {
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x + 2, y - 6);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x + 2, y + 6);
    ctx.stroke();
  } else if (enemy.type === "guardian") {
    roundRect(x - r * 0.85, y - r, r * 1.7, r * 2, 8);
    ctx.fill();
  } else if (enemy.type === "shaman") {
    drawPolygon(x, y, r * 1.08, 6, -Math.PI / 2);
    ctx.fill();
  } else if (enemy.type === "bomber") {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#f6f1e8", 0.42);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  } else if (enemy.type === "splitter") {
    drawPolygon(x, y, r * 1.08, 7, Math.PI / 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(17,17,15,0.45)";
    ctx.beginPath();
    ctx.moveTo(x - r * 0.45, y - r * 0.58);
    ctx.lineTo(x + r * 0.08, y - r * 0.08);
    ctx.lineTo(x - r * 0.18, y + r * 0.5);
    ctx.moveTo(x + r * 0.32, y - r * 0.44);
    ctx.lineTo(x + r * 0.1, y + r * 0.2);
    ctx.lineTo(x + r * 0.55, y + r * 0.58);
    ctx.stroke();
  } else if (enemy.type === "splinter") {
    drawPolygon(x, y, r * 1.15, 5, -Math.PI / 2);
    ctx.fill();
  } else if (enemy.type === "stalker") {
    ctx.arc(x, y, r * 1.08, Math.PI * 0.22, Math.PI * 1.78);
    ctx.quadraticCurveTo(x - r * 0.2, y, x + r * 0.82, y - r * 0.72);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === "mortar") {
    drawPolygon(x, y, r * 1.16, 4, Math.PI / 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(17,17,15,0.58)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.18, y - r * 0.62);
    ctx.lineTo(x + r * 0.72, y - r * 1.15);
    ctx.stroke();
  } else if (enemy.type === "sniper") {
    ctx.moveTo(x + r * 1.35, y);
    ctx.lineTo(x - r * 0.75, y - r * 0.68);
    ctx.lineTo(x - r * 0.32, y);
    ctx.lineTo(x - r * 0.75, y + r * 0.68);
    ctx.closePath();
    ctx.fill();
  } else if (enemy.type === "boss") {
    drawBossBody(enemy, x, y, flash);
  } else if (enemy.type === "brute") {
    if (enemy.windup && enemy.windup.kind === "brute_swing") {
      const dirX = Number.isFinite(enemy.windup.dirX) ? enemy.windup.dirX : Math.cos(enemy.windup.angle || 0);
      const dirY = Number.isFinite(enemy.windup.dirY) ? enemy.windup.dirY : Math.sin(enemy.windup.angle || 0);
      const angle = Math.atan2(dirY, dirX);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(1.14, 0.94);
      drawPolygon(0, 0, r * 1.08, 6, Math.PI / 6);
      ctx.fill();
      ctx.restore();
    } else {
      drawPolygon(x, y, r * 1.08, 6, Math.PI / 6);
      ctx.fill();
    }
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemySprite(enemy, x, y, flash) {
  const r = enemy.radius;
  const color = flash ? "#f6f1e8" : enemy.color || "#c85d56";
  const type = enemy.type || "slime";
  const now = performance.now();
  const windup = enemy.windup || null;
  const windupDuration = windup ? Math.max(0.1, Number(windup.duration || windup.time || 1)) : 1;
  const windupProgress = windup ? 1 - clamp01(Number(windup.time || 0) / windupDuration) : 0;
  const chargeActive = Boolean(enemy.chargeMove?.active);
  const targetX = Number.isFinite(windup?.x)
    ? windup.x
    : Number.isFinite(enemy.chargeMove?.toX)
      ? enemy.chargeMove.toX
      : x + 1;
  const facingSide = targetX >= x ? 1 : -1;
  const castSquash =
    windup && windup.kind !== "bomber_explode" ? Math.sin(windupProgress * Math.PI) * 0.07 : 0;
  const chargeStretch = chargeActive ? 0.16 : 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facingSide * (1 + chargeStretch + castSquash), Math.max(0.82, 1 - chargeStretch * 0.42 + castSquash * 0.28));
  if (windup?.kind === "heal") ctx.rotate(Math.sin(now / 120) * 0.035);
  if (windup?.kind === "snipe" || windup?.kind === "charge") ctx.translate(r * windupProgress * 0.08, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.72, r * 0.96, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  drawEnemyFeet(type, r, color, now, windupProgress);

  ctx.fillStyle = color;
  ctx.strokeStyle = flash ? "#f6f1e8" : hexToRgba(color, 0.72);
  ctx.lineWidth = Math.max(2, r * 0.09);

  if (type === "training_dummy") {
    drawTrainingDummySprite(r, color);
  } else if (type === "runner" || type === "runner_tank" || type === "runner_fast") {
    drawRunnerSprite(type, r, color);
  } else if (type === "bat") {
    drawBatSprite(r, color, now);
  } else if (type === "charger") {
    drawChargerSprite(r, color);
  } else if (type === "spitter") {
    drawSpitterSprite(r, color);
  } else if (type === "guardian") {
    drawGuardianSprite(r, color, enemy.statusEffects?.includes("barrier"));
  } else if (type === "shaman") {
    drawShamanSprite(r, color, now);
  } else if (type === "bomber") {
    drawBomberSprite(r, color, now);
  } else if (type === "splitter" || type === "splinter") {
    drawSplitterSprite(type, r, color);
  } else if (type === "stalker") {
    drawStalkerSprite(r, color);
  } else if (type === "mortar") {
    drawMortarSprite(r, color);
  } else if (type === "sniper") {
    drawSniperSprite(r, color);
  } else if (type === "brute") {
    drawBruteSprite(r, color);
  } else {
    drawSlimeSprite(r, color, now);
  }

  drawEnemySurfaceShading(type, r, color, now);
  drawEnemyDetailOverlay(type, r, color, enemy, now);
  if (enemy.elite) drawEliteTrim(r, enemy.affix || "", enemy.color || color);
  ctx.restore();
}

function drawEnemyFeet(type, r, color, now, windupProgress = 0) {
  if (type === "bat" || type === "sniper" || type === "mortar") return;
  const heavy = type === "guardian" || type === "brute" || type === "charger";
  const jitter = Math.sin(now / (heavy ? 190 : 115)) * r * (heavy ? 0.025 : 0.05);
  const reach = windupProgress * r * 0.08;
  ctx.save();
  ctx.fillStyle = heavy ? "#171512" : hexToRgba("#151512", 0.92);
  ctx.strokeStyle = hexToRgba(color, heavy ? 0.28 : 0.36);
  ctx.lineWidth = Math.max(1, r * 0.035);
  for (const side of [-1, 1]) {
    const footX = side * r * (heavy ? 0.42 : 0.34);
    const footY = r * (0.7 + side * jitter * 0.03);
    ctx.beginPath();
    ctx.ellipse(footX + reach, footY + side * jitter, r * (heavy ? 0.26 : 0.2), r * 0.12, side * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (type === "stalker" || type === "runner_fast" || type === "bomber") {
      ctx.fillStyle = hexToRgba("#f8f3e9", 0.72);
      ctx.beginPath();
      ctx.moveTo(footX + side * r * 0.14, footY + r * 0.02);
      ctx.lineTo(footX + side * r * 0.34, footY + r * 0.08);
      ctx.lineTo(footX + side * r * 0.1, footY + r * 0.12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = heavy ? "#171512" : hexToRgba("#151512", 0.92);
    }
  }
  ctx.restore();
}

function drawSlimeSprite(r, color, now) {
  const wobble = Math.sin(now / 180) * r * 0.05;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.34);
  ctx.quadraticCurveTo(-r * 0.98, -r * 0.48, -r * 0.36, -r * 0.68 + wobble);
  ctx.quadraticCurveTo(0, -r * 1.08 - wobble, r * 0.42, -r * 0.66);
  ctx.quadraticCurveTo(r * 1.02, -r * 0.28, r * 0.84, r * 0.38);
  ctx.quadraticCurveTo(0, r * 0.86, -r * 0.9, r * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.18, r * 0.26);
  ctx.fillStyle = hexToRgba("#f8f3e9", 0.18);
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.42, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawBatSprite(r, color, now) {
  const flap = Math.sin(now / 95) * r * 0.18;
  ctx.fillStyle = hexToRgba(color, 0.72);
  ctx.beginPath();
  ctx.moveTo(-r * 0.18, -r * 0.08);
  ctx.quadraticCurveTo(-r * 1.3, -r * 0.94 - flap, -r * 1.78, r * 0.18);
  ctx.quadraticCurveTo(-r * 0.92, r * 0.02, -r * 0.52, r * 0.52);
  ctx.quadraticCurveTo(-r * 0.34, r * 0.06, -r * 0.18, -r * 0.08);
  ctx.moveTo(r * 0.18, -r * 0.08);
  ctx.quadraticCurveTo(r * 1.3, -r * 0.94 - flap, r * 1.78, r * 0.18);
  ctx.quadraticCurveTo(r * 0.92, r * 0.02, r * 0.52, r * 0.52);
  ctx.quadraticCurveTo(r * 0.34, r * 0.06, r * 0.18, -r * 0.08);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, -r * 0.52);
  ctx.lineTo(-r * 0.62, -r * 1.04);
  ctx.lineTo(-r * 0.08, -r * 0.72);
  ctx.moveTo(r * 0.32, -r * 0.52);
  ctx.lineTo(r * 0.62, -r * 1.04);
  ctx.lineTo(r * 0.08, -r * 0.72);
  ctx.fill();
  drawEnemyEyesLocal(r, -r * 0.1, r * 0.2);
}

function drawChargerSprite(r, color) {
  ctx.fillStyle = hexToRgba("#2a2118", 0.8);
  roundRect(-r * 0.82, -r * 0.62, r * 1.34, r * 1.24, r * 0.32);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r * 1.26, 0);
  ctx.lineTo(r * 0.38, -r * 0.82);
  ctx.quadraticCurveTo(-r * 0.86, -r * 0.94, -r * 1.04, 0);
  ctx.quadraticCurveTo(-r * 0.86, r * 0.94, r * 0.38, r * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f8f3e9";
  ctx.beginPath();
  ctx.moveTo(r * 1.42, 0);
  ctx.lineTo(r * 0.78, -r * 0.22);
  ctx.lineTo(r * 0.78, r * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.16, r * 0.26);
}

function drawSpitterSprite(r, color) {
  ctx.beginPath();
  ctx.ellipse(-r * 0.14, 0, r * 0.86, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.86);
  ctx.beginPath();
  ctx.ellipse(r * 0.64, -r * 0.02, r * 0.52, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hexToRgba("#ecfccb", 0.46);
  ctx.beginPath();
  ctx.arc(r * 0.78, -r * 0.04, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  drawEnemyEyesLocal(r, -r * 0.2, r * 0.23);
}

function drawGuardianSprite(r, color, barrier) {
  ctx.fillStyle = hexToRgba("#1f252b", 0.88);
  roundRect(-r * 0.82, -r * 0.96, r * 1.64, r * 1.92, r * 0.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  roundRect(-r * 0.56, -r * 0.78, r * 1.12, r * 1.56, r * 0.16);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = hexToRgba("#f8fafc", barrier ? 0.72 : 0.38);
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.32);
  ctx.lineTo(r * 0.42, -r * 0.32);
  ctx.moveTo(0, -r * 0.62);
  ctx.lineTo(0, r * 0.58);
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.55, r * 0.21);
}

function drawShamanSprite(r, color, now) {
  ctx.fillStyle = hexToRgba("#171b14", 0.88);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.1);
  ctx.quadraticCurveTo(-r * 0.86, -r * 0.24, -r * 0.64, r * 0.86);
  ctx.lineTo(r * 0.64, r * 0.86);
  ctx.quadraticCurveTo(r * 0.86, -r * 0.24, 0, -r * 1.1);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(color, 0.76);
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(r * 0.74, r * 0.62);
  ctx.lineTo(r * 1.06, -r * 1.02);
  ctx.stroke();
  ctx.fillStyle = hexToRgba("#ecfccb", 0.52 + Math.sin(now / 170) * 0.16);
  ctx.beginPath();
  ctx.arc(r * 1.08, -r * 1.08, r * 0.19, 0, Math.PI * 2);
  ctx.fill();
  drawEnemyEyesLocal(r, -r * 0.34, r * 0.2, "#ecfccb");
}

function drawBomberSprite(r, color, now) {
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1a1512";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba("#f97316", 0.72 + Math.sin(now / 85) * 0.18);
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#f8f3e9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.18, -r * 0.78);
  ctx.quadraticCurveTo(r * 0.6, -r * 1.16, r * 0.42, -r * 1.46);
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.18, r * 0.2);
}

function drawSplitterSprite(type, r, color) {
  const small = type === "splinter";
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.04);
  ctx.lineTo(r * 0.86, -r * 0.32);
  ctx.lineTo(r * 0.58, r * 0.78);
  ctx.lineTo(-r * 0.38, r * 0.92);
  ctx.lineTo(-r * 0.96, r * 0.08);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(17,17,15,0.52)";
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-r * 0.3, -r * 0.54);
  ctx.lineTo(r * 0.14, -r * 0.08);
  ctx.lineTo(-r * 0.1, r * 0.54);
  ctx.moveTo(r * 0.32, -r * 0.42);
  ctx.lineTo(r * 0.06, r * 0.18);
  ctx.lineTo(r * 0.5, r * 0.5);
  ctx.stroke();
  if (!small) drawEnemyEyesLocal(r, -r * 0.12, r * 0.2);
}

function drawStalkerSprite(r, color) {
  ctx.fillStyle = hexToRgba("#111113", 0.9);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.12);
  ctx.quadraticCurveTo(-r * 0.92, -r * 0.2, -r * 0.58, r * 0.92);
  ctx.quadraticCurveTo(0, r * 0.64, r * 0.74, r * 0.78);
  ctx.quadraticCurveTo(r * 0.58, -r * 0.28, 0, -r * 1.12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.34, r * 0.48, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f8f3e9";
  ctx.beginPath();
  ctx.moveTo(r * 0.38, r * 0.34);
  ctx.lineTo(r * 1.08, -r * 0.44);
  ctx.lineTo(r * 0.78, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  drawEnemyEyesLocal(r, -r * 0.34, r * 0.18, "#f5d0fe");
}

function drawMortarSprite(r, color) {
  ctx.fillStyle = color;
  roundRect(-r * 0.82, -r * 0.64, r * 1.34, r * 1.28, r * 0.16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1d1a16";
  roundRect(r * 0.2, -r * 0.94, r * 0.34, r * 0.96, r * 0.12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.38);
  ctx.lineWidth = Math.max(2, r * 0.08);
  for (const sy of [-0.5, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.54, sy * r);
    ctx.lineTo(-r * 1.02, sy * r * 1.18);
    ctx.stroke();
  }
  drawEnemyEyesLocal(r, -r * 0.08, r * 0.2);
}

function drawSniperSprite(r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r * 0.9, 0);
  ctx.lineTo(-r * 0.62, -r * 0.7);
  ctx.quadraticCurveTo(-r * 0.94, 0, -r * 0.62, r * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#1a1714";
  ctx.lineWidth = Math.max(4, r * 0.14);
  ctx.beginPath();
  ctx.moveTo(r * 0.24, -r * 0.05);
  ctx.lineTo(r * 1.64, -r * 0.05);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.44);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r * 0.7, -r * 0.18);
  ctx.lineTo(r * 1.0, -r * 0.18);
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.18, r * 0.22);
}

function drawBruteSprite(r, color) {
  ctx.fillStyle = hexToRgba("#211a15", 0.78);
  ctx.beginPath();
  ctx.ellipse(0, r * 0.04, r * 1.02, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.12, r * 0.82, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#3a2a1d";
  ctx.lineWidth = Math.max(5, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(r * 0.64, r * 0.62);
  ctx.lineTo(r * 1.24, -r * 0.58);
  ctx.stroke();
  drawEnemyEyesLocal(r, -r * 0.3, r * 0.28);
}

function drawRunnerSprite(type, r, color) {
  if (type === "runner_tank") {
    ctx.fillStyle = color;
    roundRect(-r * 0.94, -r * 0.68, r * 1.88, r * 1.36, r * 0.18);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(246,241,232,0.42)";
    ctx.lineWidth = Math.max(2, r * 0.08);
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.5);
    ctx.lineTo(r * 0.5, -r * 0.5);
    ctx.moveTo(-r * 0.5, r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.5);
    ctx.stroke();
  } else {
    const fast = type === "runner_fast";
    ctx.beginPath();
    ctx.moveTo(r * (fast ? 1.12 : 0.96), 0);
    ctx.lineTo(-r * 0.88, -r * (fast ? 0.84 : 0.66));
    ctx.lineTo(-r * 0.52, 0);
    ctx.lineTo(-r * 0.88, r * (fast ? 0.84 : 0.66));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (fast) {
      ctx.strokeStyle = hexToRgba("#f8f3e9", 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-r * 1.0, -r * 0.42);
      ctx.lineTo(-r * 1.58, -r * 0.42);
      ctx.moveTo(-r * 1.0, r * 0.42);
      ctx.lineTo(-r * 1.58, r * 0.42);
      ctx.stroke();
    }
  }
  drawEnemyEyesLocal(r, -r * 0.05, r * 0.18);
}

function drawTrainingDummySprite(r, color) {
  ctx.fillStyle = "#7a4f2a";
  roundRect(-r * 0.22, -r * 0.86, r * 0.44, r * 1.74, r * 0.08);
  ctx.fill();
  ctx.strokeStyle = "#3a2416";
  ctx.lineWidth = Math.max(2, r * 0.09);
  ctx.stroke();
  ctx.strokeStyle = "#9a6a3c";
  ctx.lineWidth = Math.max(5, r * 0.18);
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, -r * 0.2);
  ctx.lineTo(r * 0.9, -r * 0.2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -r * 1.04, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemyDetailOverlay(type, r, color, enemy, now) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (type === "bat") {
    ctx.fillStyle = "#11110f";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.42, r * 0.42);
      ctx.lineTo(side * r * 0.62, r * 0.82);
      ctx.lineTo(side * r * 0.28, r * 0.58);
      ctx.closePath();
      ctx.fill();
    }
    drawEnemyMouthLocal(r, r * 0.14, 0.42, "#11110f");
  } else if (type === "charger") {
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.42);
    ctx.lineWidth = Math.max(2, r * 0.055);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.38 + i * r * 0.26, -r * 0.52);
      ctx.lineTo(-r * 0.18 + i * r * 0.26, r * 0.54);
      ctx.stroke();
    }
    drawEnemyBrowLocal(r, -r * 0.3, "#11110f");
  } else if (type === "spitter") {
    ctx.fillStyle = hexToRgba("#bef264", 0.72);
    for (const [x, y, s] of [
      [-0.36, 0.42, 0.12],
      [-0.08, 0.54, 0.09],
      [0.48, 0.26, 0.11]
    ]) {
      ctx.beginPath();
      ctx.arc(x * r, y * r, r * s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = hexToRgba("#ecfccb", 0.58);
    ctx.lineWidth = Math.max(1.4, r * 0.04);
    ctx.beginPath();
    ctx.moveTo(r * 0.86, r * 0.16);
    ctx.quadraticCurveTo(r * 1.02, r * 0.36, r * 0.88, r * 0.54);
    ctx.stroke();
  } else if (type === "guardian") {
    ctx.strokeStyle = hexToRgba("#e5e7eb", 0.56);
    ctx.lineWidth = Math.max(2, r * 0.06);
    for (const y of [-0.48, 0.02, 0.52]) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, r * y);
      ctx.lineTo(r * 0.48, r * y);
      ctx.stroke();
    }
    if (enemy.statusEffects?.includes("barrier")) {
      ctx.strokeStyle = hexToRgba("#bfdbfe", 0.82);
      ctx.lineWidth = Math.max(3, r * 0.09);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, -Math.PI * 0.82, Math.PI * 0.82);
      ctx.stroke();
    }
  } else if (type === "shaman") {
    ctx.fillStyle = hexToRgba("#ecfccb", 0.42 + Math.sin(now / 120) * 0.12);
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + now / 700;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.58, Math.sin(angle) * r * 0.42, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = hexToRgba("#ecfccb", 0.54);
    ctx.lineWidth = Math.max(1.6, r * 0.045);
    ctx.beginPath();
    ctx.moveTo(-r * 0.28, -r * 0.04);
    ctx.lineTo(r * 0.28, -r * 0.04);
    ctx.moveTo(0, -r * 0.32);
    ctx.lineTo(0, r * 0.28);
    ctx.stroke();
  } else if (type === "bomber") {
    const spark = 0.5 + Math.sin(now / 55) * 0.28;
    ctx.fillStyle = `rgba(254,202,202,${spark})`;
    ctx.beginPath();
    ctx.arc(r * 0.48, -r * 1.48, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#f97316", 0.68);
    ctx.lineWidth = Math.max(2, r * 0.05);
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + now / 150;
      ctx.beginPath();
      ctx.moveTo(r * 0.48, -r * 1.48);
      ctx.lineTo(r * 0.48 + Math.cos(angle) * r * 0.32, -r * 1.48 + Math.sin(angle) * r * 0.32);
      ctx.stroke();
    }
  } else if (type === "splitter" || type === "splinter") {
    ctx.fillStyle = hexToRgba("#f8f3e9", 0.2);
    for (const [x, y] of [
      [-0.28, -0.18],
      [0.22, 0.06],
      [-0.06, 0.38]
    ]) {
      ctx.beginPath();
      ctx.arc(x * r, y * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
    drawEnemyMouthLocal(r, r * 0.34, 0.55, "#11110f");
  } else if (type === "stalker") {
    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.7);
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.beginPath();
    ctx.moveTo(-r * 0.46, -r * 0.18);
    ctx.quadraticCurveTo(0, r * 0.16, r * 0.46, -r * 0.18);
    ctx.stroke();
    ctx.fillStyle = "#f8f3e9";
    ctx.beginPath();
    ctx.moveTo(r * 0.52, r * 0.56);
    ctx.lineTo(r * 1.06, r * 0.06);
    ctx.lineTo(r * 0.74, r * 0.18);
    ctx.closePath();
    ctx.fill();
  } else if (type === "mortar") {
    ctx.fillStyle = hexToRgba("#11110f", 0.7);
    ctx.beginPath();
    ctx.ellipse(r * 0.38, -r * 1.04, r * 0.22, r * 0.12, -0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#f8f3e9", 0.34);
    ctx.lineWidth = Math.max(1.6, r * 0.045);
    ctx.beginPath();
    ctx.moveTo(-r * 0.52, -r * 0.24);
    ctx.lineTo(r * 0.24, r * 0.54);
    ctx.moveTo(r * 0.18, -r * 0.4);
    ctx.lineTo(-r * 0.42, r * 0.52);
    ctx.stroke();
  } else if (type === "sniper") {
    ctx.fillStyle = hexToRgba("#fee2e2", 0.72);
    ctx.beginPath();
    ctx.arc(r * 1.14, -r * 0.05, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba("#11110f", 0.8);
    ctx.lineWidth = Math.max(1.6, r * 0.045);
    ctx.beginPath();
    ctx.arc(r * 1.14, -r * 0.05, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === "brute") {
    ctx.fillStyle = "#f8f3e9";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.22, r * 0.12);
      ctx.lineTo(side * r * 0.34, r * 0.48);
      ctx.lineTo(side * r * 0.08, r * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    drawEnemyBrowLocal(r, -r * 0.48, "#11110f");
  } else if (type === "runner" || type === "runner_tank" || type === "runner_fast") {
    ctx.strokeStyle = hexToRgba("#f8f3e9", type === "runner_fast" ? 0.38 : 0.24);
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.beginPath();
    ctx.moveTo(-r * 0.34, -r * 0.34);
    ctx.lineTo(r * 0.22, 0);
    ctx.lineTo(-r * 0.34, r * 0.34);
    ctx.stroke();
  } else if (type !== "training_dummy") {
    drawEnemyMouthLocal(r, r * 0.22, 0.48, "#11110f");
  }

  ctx.restore();
}

function drawEnemySurfaceShading(type, r, color, now) {
  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  const topGlow = ctx.createRadialGradient(-r * 0.28, -r * 0.48, r * 0.08, -r * 0.22, -r * 0.42, r * 1.1);
  topGlow.addColorStop(0, "rgba(248,243,232,0.32)");
  topGlow.addColorStop(0.36, "rgba(248,243,232,0.12)");
  topGlow.addColorStop(1, "rgba(248,243,232,0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);

  const lowerShade = ctx.createLinearGradient(0, -r, 0, r * 1.1);
  lowerShade.addColorStop(0, "rgba(0,0,0,0)");
  lowerShade.addColorStop(0.66, "rgba(0,0,0,0.1)");
  lowerShade.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = lowerShade;
  ctx.fillRect(-r * 2, -r * 1.4, r * 4, r * 2.8);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = hexToRgba("#f8f3e9", type === "boss" ? 0.22 : 0.16);
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.arc(-r * 0.24, -r * 0.3, r * 0.38, Math.PI * 0.08, Math.PI * 0.82);
  ctx.stroke();

  if (type !== "bat" && type !== "sniper" && type !== "runner_fast") {
    ctx.strokeStyle = "rgba(17,17,15,0.24)";
    ctx.lineWidth = Math.max(1, r * 0.03);
    for (let i = 0; i < 2; i += 1) {
      const y = r * (0.15 + i * 0.24);
      ctx.beginPath();
      ctx.moveTo(-r * 0.36, y);
      ctx.quadraticCurveTo(0, y + r * 0.05, r * 0.36, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawEnemyMouthLocal(r, y, widthMul = 0.5, color = "#11110f") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.6, r * 0.055);
  ctx.beginPath();
  ctx.moveTo(-r * widthMul * 0.42, y);
  ctx.quadraticCurveTo(0, y + r * 0.12, r * widthMul * 0.42, y);
  ctx.stroke();
  ctx.fillStyle = "#f8f3e9";
  for (const x of [-0.16, 0.16]) {
    ctx.beginPath();
    ctx.moveTo(x * r, y + r * 0.02);
    ctx.lineTo((x + 0.08) * r, y + r * 0.2);
    ctx.lineTo((x - 0.02) * r, y + r * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemyBrowLocal(r, y, color = "#11110f") {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.beginPath();
  ctx.moveTo(-r * 0.44, y);
  ctx.lineTo(-r * 0.12, y + r * 0.12);
  ctx.moveTo(r * 0.44, y);
  ctx.lineTo(r * 0.12, y + r * 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyEyesLocal(r, y = -4, spread = 8, eyeColor = "#11110f") {
  const bright = eyeColor === "#11110f" ? "#fee2e2" : eyeColor;
  ctx.fillStyle = "#11110f";
  ctx.beginPath();
  ctx.ellipse(-spread, y, Math.max(3, r * 0.13), Math.max(2, r * 0.085), 0, 0, Math.PI * 2);
  ctx.ellipse(spread, y, Math.max(3, r * 0.13), Math.max(2, r * 0.085), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bright;
  ctx.beginPath();
  ctx.arc(-spread, y, Math.max(1.7, r * 0.055), 0, Math.PI * 2);
  ctx.arc(spread, y, Math.max(1.7, r * 0.055), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(248,243,232,0.72)";
  ctx.beginPath();
  ctx.arc(-spread + r * 0.025, y - r * 0.025, Math.max(0.8, r * 0.024), 0, Math.PI * 2);
  ctx.arc(spread + r * 0.025, y - r * 0.025, Math.max(0.8, r * 0.024), 0, Math.PI * 2);
  ctx.fill();
}

function drawEliteTrim(r, affix, color) {
  const trimColor =
    affix === "venom"
      ? "#9aa15f"
      : affix === "volatile"
        ? "#c85d56"
        : affix === "frenzy"
          ? "#e8794f"
          : "#caa35a";
  ctx.save();
  ctx.strokeStyle = hexToRgba(trimColor || color, 0.74);
  ctx.lineWidth = Math.max(2.5, r * 0.08);
  ctx.beginPath();
  ctx.moveTo(-r * 0.78, -r * 0.78);
  ctx.lineTo(-r * 0.32, -r * 1.04);
  ctx.moveTo(r * 0.78, -r * 0.78);
  ctx.lineTo(r * 0.32, -r * 1.04);
  ctx.stroke();
  ctx.restore();
}

function drawBossSprite(enemy, x, y, flash) {
  const r = enemy.radius;
  const color = flash ? "#f6f1e8" : enemy.color || "#c85d56";
  const phase = Math.max(1, Number(enemy.bossPhase || 1));
  const pattern = enemy.bossPattern || "";
  const now = performance.now();

  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(0, r * 0.82, r * (1.1 + phase * 0.08), r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBossGroundSigil(pattern, r, color, phase, now);

  if (enemy.bossId === "iron_warden" || pattern === "charge") {
    drawIronWardenSprite(r, color, phase);
  } else if (enemy.bossId === "hive_prophet" || pattern === "summon") {
    drawHiveProphetSprite(r, color, phase, now);
  } else {
    drawVoidRegentSprite(r, color, phase, now);
  }

  drawBossPhaseMutations(r, color, phase, now);
  ctx.restore();
}

function drawBossGroundSigil(pattern, r, color, phase, now) {
  ctx.save();
  ctx.globalAlpha = 0.34 + phase * 0.04;
  ctx.strokeStyle = hexToRgba(color, 0.52);
  ctx.lineWidth = Math.max(2, r * 0.034);
  ctx.beginPath();
  ctx.ellipse(0, r * 0.82, r * (1.18 + phase * 0.08), r * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (pattern === "charge") {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.32, r * 0.82);
      ctx.lineTo(side * r * (1.12 + phase * 0.06), r * 0.62);
      ctx.stroke();
    }
  } else if (pattern === "summon") {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + now / 2400;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * r * 0.82, r * 0.82 + Math.sin(angle) * r * 0.24, r * 0.08, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else {
    ctx.setLineDash([r * 0.1, r * 0.08]);
    ctx.beginPath();
    ctx.ellipse(0, r * 0.82, r * (1.42 + phase * 0.09), r * 0.52, now / 1300, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawIronWardenSprite(r, color, phase) {
  ctx.fillStyle = "#201a15";
  roundRect(-r * 0.96, -r * 0.7, r * 1.92, r * 1.54, r * 0.22);
  ctx.fill();
  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.28);
  ctx.lineWidth = Math.max(3, r * 0.06);
  ctx.stroke();

  ctx.fillStyle = color;
  roundRect(-r * 0.66, -r * 0.58, r * 1.32, r * 1.22, r * 0.16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = hexToRgba("#15110e", 0.86);
  roundRect(-r * 0.45, -r * 0.98, r * 0.9, r * 0.42, r * 0.12);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#fee2e2", phase >= 3 ? 0.92 : 0.52);
  ctx.lineWidth = Math.max(3, r * 0.06);
  ctx.beginPath();
  ctx.moveTo(-r * 0.28, -r * 0.76);
  ctx.lineTo(r * 0.28, -r * 0.76);
  ctx.stroke();

  ctx.fillStyle = hexToRgba("#2f241a", 0.92);
  roundRect(-r * 1.08, -r * 0.48, r * 0.34, r * 0.72, r * 0.12);
  ctx.fill();
  roundRect(r * 0.74, -r * 0.48, r * 0.34, r * 0.72, r * 0.12);
  ctx.fill();

  ctx.fillStyle = "#31241a";
  roundRect(-r * 1.2, -r * 0.36, r * 0.52, r * 1.06, r * 0.14);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#f8f3e9";
  ctx.lineWidth = Math.max(5, r * 0.11);
  ctx.beginPath();
  ctx.moveTo(r * 0.68, r * 0.74);
  ctx.lineTo(r * 1.22, -r * 0.98);
  ctx.stroke();

  ctx.fillStyle = "#f8f3e9";
  ctx.beginPath();
  ctx.moveTo(-r * 0.52, -r * 0.84);
  ctx.lineTo(-r * 0.92, -r * 1.42);
  ctx.lineTo(-r * 0.26, -r * 1.08);
  ctx.moveTo(r * 0.52, -r * 0.84);
  ctx.lineTo(r * 0.92, -r * 1.42);
  ctx.lineTo(r * 0.26, -r * 1.08);
  ctx.fill();

  ctx.fillStyle = phase >= 3 ? "#fee2e2" : "#f4c76b";
  ctx.beginPath();
  ctx.arc(0, -r * 0.14, r * (0.22 + phase * 0.04), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.34);
  ctx.lineWidth = Math.max(1.8, r * 0.036);
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.5 + i * r * 0.25, r * 0.08);
    ctx.lineTo(-r * 0.5 + i * r * 0.25, r * 0.48);
    ctx.stroke();
  }
}

function drawHiveProphetSprite(r, color, phase, now) {
  ctx.fillStyle = hexToRgba("#101b16", 0.92);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.18);
  ctx.quadraticCurveTo(-r * 1.08, -r * 0.16, -r * 0.82, r * 0.92);
  ctx.quadraticCurveTo(0, r * 1.2, r * 0.82, r * 0.92);
  ctx.quadraticCurveTo(r * 1.08, -r * 0.16, 0, -r * 1.18);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.68);
  ctx.lineWidth = Math.max(3, r * 0.07);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#ecfccb", 0.44 + phase * 0.08);
  ctx.lineWidth = Math.max(3, r * 0.07);
  for (let i = 0; i < 6 + phase; i += 1) {
    const angle = (Math.PI * 2 * i) / (6 + phase) + now / 1900;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.32, Math.sin(angle) * r * 0.32);
    ctx.quadraticCurveTo(
      Math.cos(angle + 0.22) * r * 1.1,
      Math.sin(angle + 0.22) * r * 1.1,
      Math.cos(angle) * r * (1.42 + phase * 0.12),
      Math.sin(angle) * r * (1.42 + phase * 0.12)
    );
    ctx.stroke();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, -r * 0.16, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba("#ecfccb", 0.44);
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath();
  ctx.arc(0, -r * 0.16, r * 0.62, Math.PI * 0.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.fillStyle = "#ecfccb";
  ctx.beginPath();
  ctx.arc(0, -r * 0.18, r * (0.18 + phase * 0.035), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#ecfccb", 0.64);
  ctx.lineWidth = Math.max(2, r * 0.045);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.32, r * 0.22);
    ctx.quadraticCurveTo(side * r * 0.82, r * 0.48, side * r * 1.08, r * 0.08);
    ctx.stroke();
  }
}

function drawVoidRegentSprite(r, color, phase, now) {
  ctx.fillStyle = hexToRgba("#0e0d14", 0.94);
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.22);
  for (let i = 1; i <= 9; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 9 + now / 3600;
    const radius = r * (i % 2 ? 1.16 : 0.82);
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = hexToRgba(color, 0.76);
  ctx.lineWidth = Math.max(3, r * 0.07);
  ctx.stroke();

  const eye = ctx.createRadialGradient(0, 0, r * 0.08, 0, 0, r * 0.58);
  eye.addColorStop(0, "#f8f3e9");
  eye.addColorStop(0.35, hexToRgba(color, 0.9));
  eye.addColorStop(1, "rgba(17,17,19,0.82)");
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.02, r * 0.56, r * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111113";
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.02, r * 0.16, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#f8f3e9", 0.38 + phase * 0.08);
  ctx.lineWidth = Math.max(2, r * 0.045);
  for (let i = 0; i < 5 + phase; i += 1) {
    const angle = (Math.PI * 2 * i) / (5 + phase) + now / 1400;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r * 0.42, Math.sin(angle) * r * 0.42);
    ctx.lineTo(Math.cos(angle) * r * (1.24 + phase * 0.12), Math.sin(angle) * r * (1.24 + phase * 0.12));
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba(color, 0.44);
  for (let i = 0; i < 4 + phase; i += 1) {
    const angle = (Math.PI * 2 * i) / (4 + phase) - now / 1800;
    const dist = r * (1.04 + (i % 2) * 0.18);
    drawPolygon(Math.cos(angle) * dist, Math.sin(angle) * dist, r * 0.11, 4, angle);
    ctx.fill();
  }
}

function drawBossPhaseMutations(r, color, phase, now) {
  if (phase < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = phase >= 3 ? "rgba(254,226,226,0.82)" : hexToRgba(color, 0.72);
  ctx.lineWidth = Math.max(3, r * 0.055);
  const shards = phase >= 3 ? 10 : 6;
  for (let i = 0; i < shards; i += 1) {
    const angle = (Math.PI * 2 * i) / shards + now / (phase >= 3 ? 1100 : 1700);
    const inner = r * (1.02 + phase * 0.04);
    const outer = r * (1.32 + phase * 0.12 + Math.sin(now / 170 + i) * 0.04);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.strokeStyle = phase >= 3 ? "rgba(248,113,113,0.68)" : "rgba(254,242,242,0.5)";
  ctx.lineWidth = Math.max(2, r * 0.035);
  ctx.beginPath();
  ctx.arc(0, 0, r * (0.74 + Math.sin(now / 120) * 0.03), 0, Math.PI * 2);
  ctx.stroke();

  if (phase >= 3) {
    ctx.strokeStyle = hexToRgba("#fee2e2", 0.46);
    ctx.lineWidth = Math.max(2, r * 0.032);
    ctx.setLineDash([r * 0.12, r * 0.1]);
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.62 + Math.sin(now / 150) * 0.03), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = phase >= 3 ? "rgba(254,226,226,0.54)" : hexToRgba(color, 0.42);
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.beginPath();
  ctx.moveTo(-r * 0.34, -r * 0.52);
  ctx.lineTo(-r * 0.08, -r * 0.22);
  ctx.lineTo(-r * 0.24, r * 0.08);
  ctx.moveTo(r * 0.42, -r * 0.46);
  ctx.lineTo(r * 0.08, -r * 0.1);
  ctx.lineTo(r * 0.28, r * 0.34);
  if (phase >= 3) {
    ctx.moveTo(-r * 0.08, r * 0.46);
    ctx.lineTo(r * 0.18, r * 0.74);
  }
  ctx.stroke();
  ctx.restore();
}

function drawFrozenEnemyOverlay(enemy, x, y) {
  const r = enemy.radius;
  const pulse = 1 + Math.sin(performance.now() / 90 + Number(enemy.id || 0)) * 0.035;
  ctx.save();
  ctx.fillStyle = "rgba(147,197,253,0.24)";
  ctx.strokeStyle = "rgba(219,234,254,0.9)";
  ctx.lineWidth = 3;
  drawPolygon(x, y, r * 1.24 * pulse, 6, Math.PI / 6);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(248,250,252,0.78)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + Math.PI / 6;
    const inner = r * 0.3;
    const outer = r * 1.18 * pulse;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  const label = "FROZEN";
  const width = 54;
  ctx.fillStyle = "rgba(15,23,42,0.72)";
  ctx.strokeStyle = "rgba(191,219,254,0.74)";
  ctx.lineWidth = 1;
  roundRect(x - width / 2, y - r - 32, width, 18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#dbeafe";
  ctx.font = "900 9px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y - r - 23);
  ctx.restore();
}

function drawEnemyRoleMark(enemy, x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(17,17,15,0.82)";
  ctx.fillStyle = "rgba(17,17,15,0.82)";
  ctx.lineWidth = 3;
  if (enemy.type === "training_dummy") {
    ctx.strokeStyle = "rgba(246,241,232,0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(x, y, enemy.radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
  } else if (enemy.type === "guardian") {
    roundRect(x - 10, y - 12, 20, 24, 5);
    ctx.stroke();
  } else if (enemy.type === "shaman") {
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();
  } else if (enemy.type === "spitter") {
    ctx.beginPath();
    ctx.arc(x + enemy.radius * 0.2, y, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (enemy.type === "bomber") {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 5, y - 7);
    ctx.lineTo(x + 11, y - 14);
    ctx.stroke();
  } else if (enemy.type === "charger") {
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x - 5, y - 8);
    ctx.lineTo(x - 2, y);
    ctx.lineTo(x - 5, y + 8);
    ctx.closePath();
    ctx.stroke();
  } else if (enemy.type === "splitter") {
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 8);
    ctx.lineTo(x + 2, y - 1);
    ctx.lineTo(x - 5, y + 10);
    ctx.moveTo(x + 7, y - 7);
    ctx.lineTo(x + 1, y + 8);
    ctx.stroke();
  } else if (enemy.type === "stalker") {
    ctx.beginPath();
    ctx.arc(x + 2, y, 9, Math.PI * 0.25, Math.PI * 1.75);
    ctx.stroke();
  } else if (enemy.type === "mortar") {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 7);
    ctx.lineTo(x + 10, y - 15);
    ctx.stroke();
  } else if (enemy.type === "sniper") {
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x + 11, y);
    ctx.moveTo(x + 5, y - 6);
    ctx.lineTo(x + 11, y);
    ctx.lineTo(x + 5, y + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectiles() {
  for (const projectile of state.projectiles) {
    const position = getVisualPosition(visuals.projectiles, projectile);
    const x = position.x;
    const y = position.y;
    const style = projectile.style || "";
    const color =
      projectile.style === "stalker_shuriken"
        ? "#8d7cae"
        : projectile.poison
          ? "#9aa15f"
          : projectile.hostile
            ? "#c85d56"
            : classColors[projectile.classId] || "#f8f3e9";

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Number(projectile.angle) || 0);

    if (projectile.style === "stalker_shuriken") {
      drawShurikenProjectile(projectile, color);
    } else if (projectile.style === "sniper_bolt") {
      drawSniperProjectile(projectile, color);
    } else if (projectile.hostile) {
      drawSpitProjectile(projectile, color);
    } else if (style.includes("arrow") || projectile.classId === "ranger") {
      drawArrowProjectile(projectile, color, style);
    } else if (projectile.classId === "mage") {
      drawArcaneProjectile(projectile, color, style);
    } else if (projectile.classId === "alchemist") {
      drawAlchemyProjectile(projectile, color, style);
    } else if (projectile.classId === "engineer") {
      drawTechProjectile(projectile, color, style);
    } else if (projectile.classId === "puppeteer") {
      drawThreadProjectile(projectile, color, style);
    } else if (projectile.classId === "cleric") {
      drawHolyProjectile(projectile, color);
    } else {
      drawSimpleProjectile(projectile, color);
    }

    ctx.restore();
  }
}

function drawHazards() {
  for (const hazard of state.hazards || []) {
    const position = getVisualPosition(visuals.hazards, hazard);
    const x = position.x;
    const y = position.y;
    if (hazard.type === "boss_beam") {
      drawBossBeamHazard(x, y, hazard);
    } else if (hazard.type === "boss_shockwave") {
      drawBossShockwaveHazard(x, y, hazard);
    } else if (hazard.type === "boss_blast") {
      const color = hazard.color || "#8d7cae";
      const armTime = Number(hazard.armTime || 0);
      const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 1));
      const warningRatio = clamp01(armTime / armTimeMax);
      drawDangerTelegraph(x, y, hazard.radius, color, 1 - warningRatio, {
        spokes: 10,
        stripeAlpha: 0.38,
        coreColor: "#fbbf24"
      });
    } else if (hazard.type === "acid_pool") {
      const armed = hazard.armed || Number(hazard.armTime || 0) <= 0;
      const armTime = Number(hazard.armTime || 0);
      const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 1));
      const warningRatio = armed ? 0 : clamp01(armTime / armTimeMax);
      if (armed) drawPoisonPoolHazard(x, y, hazard.radius);
      else drawDangerTelegraph(x, y, hazard.radius, "#c85d56", 1 - warningRatio, { spokes: 8 });
    } else if (hazard.type === "alchemy_bomb") {
      drawAlchemyBombHazard(x, y, hazard);
    } else if (hazard.type === "alchemy_pool") {
      drawAlchemyPoolHazard(x, y, hazard);
    } else if (hazard.type === "alchemy_elixir_mist") {
      drawAlchemyElixirMistHazard(x, y, hazard);
    } else if (hazard.type === "meteor") {
      drawMeteorHazard(x, y, hazard);
    } else if (hazard.type === "fire_pool") {
      drawFirePoolHazard(x, y, hazard.radius, hazard);
    } else if (hazard.type === "engineer_turret") {
      drawEngineerTurretHazard(x, y, hazard);
    } else if (hazard.type === "engineer_mine") {
      drawEngineerMineHazard(x, y, hazard);
    } else if (hazard.type === "engineer_drone") {
      drawEngineerDroneHazard(x, y, hazard);
    } else if (hazard.type === "puppet") {
      drawPuppetHazard(x, y, hazard);
    } else if (hazard.type === "arrow_rain") {
      drawArrowRainHazard(x, y, hazard);
    } else {
      const pulse = 1 + Math.sin(performance.now() / 130) * 0.05;
      ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
      ctx.strokeStyle = "rgba(34, 197, 94, 0.78)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, hazard.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(187, 247, 208, 0.76)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8 + performance.now() / 1400;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * hazard.radius * 0.2, y + Math.sin(angle) * hazard.radius * 0.2);
        ctx.lineTo(x + Math.cos(angle) * hazard.radius * 0.82, y + Math.sin(angle) * hazard.radius * 0.82);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(22, 163, 74, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 18; i += 1) {
        const angle = (Math.PI * 2 * i) / 18;
        const r = hazard.radius * (i % 2 ? 0.72 : 0.9) * pulse;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }
}

function drawEngineerTurretHazard(x, y, hazard) {
  const color = hazard.color || classColors.engineer;
  const r = Math.max(16, hazard.radius || 22);
  const pulse = 1 + Math.sin(performance.now() / 180 + Number(hazard.id || 0)) * 0.04;
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || 0));
  const build = hazard.armed ? 1 : clamp01(1 - Number(hazard.armTime || 0) / armTimeMax);
  ctx.save();
  ctx.translate(x, y);
  if (!hazard.armed) {
    ctx.globalAlpha = 0.42 + build * 0.48;
    ctx.scale(0.52 + build * 0.48, 0.52 + build * 0.48);
    ctx.strokeStyle = hexToRgba(color, 0.52);
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.22 - build * 0.22), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = hexToRgba("#bfdbfe", 0.5 + build * 0.32);
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const angle = Math.PI * 0.5 * i + build * 0.3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.22, Math.sin(angle) * r * 0.22);
      ctx.lineTo(Math.cos(angle) * r * (0.78 + build * 0.18), Math.sin(angle) * r * (0.78 + build * 0.18));
      ctx.stroke();
    }
  }
  ctx.fillStyle = hexToRgba(color, 0.18);
  ctx.strokeStyle = hexToRgba(color, 0.78);
  ctx.lineWidth = 3;
  roundRect(-r * 0.78, -r * 0.58, r * 1.56, r * 1.16, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28 * pulse, 0, Math.PI * 2);
  ctx.fill();
  if (hazard.armed || build > 0.72) {
    ctx.strokeStyle = "#fef3c7";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r * 0.2, 0);
    ctx.lineTo(r * (0.68 + build * 0.47), 0);
    ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba("#111827", 0.55);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, r * 0.58);
  ctx.lineTo(-r * 0.75, r * 1.02);
  ctx.moveTo(r * 0.45, r * 0.58);
  ctx.lineTo(r * 0.75, r * 1.02);
  ctx.stroke();
  ctx.restore();
}

function drawEngineerMineHazard(x, y, hazard) {
  const color = hazard.color || classColors.engineer;
  const armed = hazard.armed || Number(hazard.armTime || 0) <= 0;
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || 0));
  const build = armed ? 1 : clamp01(1 - Number(hazard.armTime || 0) / armTimeMax);
  const r = Math.max(18, Math.min(34, (hazard.radius || 96) * 0.25));
  const pulse = 1 + Math.sin(performance.now() / (armed ? 95 : 180)) * (armed ? 0.08 : 0.035);
  ctx.save();
  ctx.translate(x, y);
  if (!armed) {
    ctx.globalAlpha = 0.48 + build * 0.42;
    ctx.scale(0.58 + build * 0.42, 0.58 + build * 0.42);
    ctx.strokeStyle = hexToRgba(color, 0.45 + build * 0.32);
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.6 - build * 0.25), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = hexToRgba(armed ? color : "#94a3b8", 0.16);
  ctx.strokeStyle = hexToRgba(armed ? color : "#94a3b8", 0.8);
  ctx.lineWidth = 3;
  drawPolygon(0, 0, r * pulse, 6, Math.PI / 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = armed ? "#fef3c7" : "rgba(226,232,240,0.7)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, 0);
  ctx.lineTo(r * 0.55, 0);
  ctx.moveTo(0, -r * 0.55);
  ctx.lineTo(0, r * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawEngineerDroneHazard(x, y, hazard) {
  const color = hazard.color || classColors.engineer;
  const r = Math.max(13, hazard.radius || 16);
  const spin = performance.now() / 260;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = hexToRgba(color, 0.16);
  ctx.strokeStyle = hexToRgba(color, 0.78);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(r * 0.45, 0);
    ctx.lineTo(r * 1.35, 0);
    ctx.stroke();
  }
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPuppetHazard(x, y, hazard) {
  const color = hazard.color || classColors.puppeteer;
  const r = Math.max(20, hazard.radius || 24);
  const armTime = Number(hazard.armTime || 0);
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || 0));
  const moveTime = Number(hazard.moveTime || 0);
  const moveTimeMax = Math.max(0.1, Number(hazard.moveTimeMax || 0));
  const finalX = Number.isFinite(hazard.x) ? hazard.x : x;
  const finalY = Number.isFinite(hazard.y) ? hazard.y : y;
  let drawX = x;
  let drawY = y;
  let travel = 1;
  let sourceX = null;
  let sourceY = null;

  if (moveTime > 0 && Number.isFinite(hazard.moveFromX) && Number.isFinite(hazard.moveFromY)) {
    sourceX = hazard.moveFromX;
    sourceY = hazard.moveFromY;
    travel = clamp01(1 - moveTime / moveTimeMax);
  } else if (!hazard.armed && armTime > 0 && Number.isFinite(hazard.spawnFromX) && Number.isFinite(hazard.spawnFromY)) {
    sourceX = hazard.spawnFromX;
    sourceY = hazard.spawnFromY;
    travel = clamp01(1 - armTime / armTimeMax);
  }

  if (sourceX !== null && sourceY !== null) {
    const eased = 1 - Math.pow(1 - travel, 2.1);
    const dist = Math.hypot(finalX - sourceX, finalY - sourceY);
    drawX = sourceX + (finalX - sourceX) * eased;
    drawY = sourceY + (finalY - sourceY) * eased - Math.sin(Math.PI * eased) * Math.min(58, Math.max(22, dist * 0.12));

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.22 + travel * 0.3);
    ctx.lineWidth = 2.2;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.quadraticCurveTo((sourceX + finalX) * 0.5, (sourceY + finalY) * 0.5 - Math.min(80, dist * 0.18), finalX, finalY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = hexToRgba(color, 0.36 + travel * 0.32);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(drawX, drawY - r * 1.5);
    ctx.lineTo(finalX, finalY - r * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  const sway = Math.sin(performance.now() / 180 + Number(hazard.id || 0)) * 0.08;
  ctx.save();
  ctx.translate(drawX, drawY);
  if (sourceX !== null) {
    ctx.globalAlpha = 0.42 + travel * 0.58;
    ctx.scale(0.62 + travel * 0.38, 0.62 + travel * 0.38);
  }
  ctx.rotate(sway);
  ctx.strokeStyle = hexToRgba("#f5d0fe", 0.5);
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(-r * 0.35, -r * 0.4);
  ctx.moveTo(0, -r * 1.55);
  ctx.lineTo(r * 0.35, -r * 0.4);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.2);
  ctx.strokeStyle = hexToRgba(color, 0.84);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -r * 0.42, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  roundRect(-r * 0.48, -r * 0.06, r * 0.96, r * 1.08, 6);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#f5d0fe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.14);
  ctx.lineTo(r * 0.9, r * 0.14);
  ctx.moveTo(-r * 0.28, r * 1.02);
  ctx.lineTo(-r * 0.48, r * 1.42);
  ctx.moveTo(r * 0.28, r * 1.02);
  ctx.lineTo(r * 0.48, r * 1.42);
  ctx.stroke();
  ctx.restore();
}

function drawBossBeamHazard(x, y, hazard) {
  const color = hazard.color || "#c85d56";
  const angle = Number(hazard.angle || 0);
  const length = Math.max(120, Number(hazard.length || hazard.radius || 820));
  const width = Math.max(18, Number(hazard.width || 34));
  const armTime = Number(hazard.armTime || 0);
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 1));
  const charge = 1 - clamp01(armTime / armTimeMax);
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;
  const pulse = 0.85 + charge * 0.35 + Math.sin(performance.now() / 72) * 0.04;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.12 + charge * 0.18);
  ctx.lineWidth = width * 2.4 * pulse;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#fee2e2", 0.32 + charge * 0.34);
  ctx.lineWidth = width * 0.72;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = hexToRgba(color, 0.76 + charge * 0.18);
  ctx.lineWidth = Math.max(3, width * 0.18);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = hexToRgba(color, 0.18 + charge * 0.18);
  ctx.beginPath();
  ctx.arc(x, y, width * (1.2 + charge * 0.55), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBossShockwaveHazard(x, y, hazard) {
  const radius = Math.max(80, Number(hazard.radius || 180));
  const color = hazard.color || "#c85d56";
  const armTime = Number(hazard.armTime || 0);
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 1));
  const charge = hazard.armed ? 1 : 1 - clamp01(armTime / armTimeMax);
  const now = performance.now();

  drawDangerTelegraph(x, y, radius, color, charge, {
    spokes: 16,
    stripeAlpha: 0.24,
    coreColor: "#fee2e2"
  });

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba("#fee2e2", 0.28 + charge * 0.42);
  ctx.lineWidth = Math.max(3, radius * 0.018);
  for (let i = 0; i < 3; i += 1) {
    const wave = (charge + i * 0.22 + Math.sin(now / 260 + i) * 0.015) % 1;
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.22 + wave * 0.7), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(color, 0.82);
  ctx.lineWidth = Math.max(5, radius * 0.026);
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.98 + Math.sin(now / 90) * 0.01), 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = hexToRgba("#fee2e2", 0.18 + charge * 0.16);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(16, radius * (0.09 + charge * 0.04)), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawArrowRainHazard(x, y, hazard) {
  const radius = hazard.radius || 150;
  const color = hazard.color || "#7fa671";
  const armed = hazard.armed || Number(hazard.armTime || 0) <= 0;
  const armTime = Number(hazard.armTime || 0);
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 0.2));
  const now = performance.now();

  if (!armed) {
    const charge = 1 - clamp01(armTime / armTimeMax);
    drawDangerTelegraph(x, y, radius, color, charge, {
      spokes: 12,
      stripeAlpha: 0.18,
      coreColor: "#ecfccb"
    });
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.94, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 14; i += 1) {
      const seed = pseudoRandom(Number(hazard.id || 1) + i * 7.13, i * 2.91);
      const angle = seed * Math.PI * 2;
      const dist = Math.sqrt(pseudoRandom(i * 3.19, Number(hazard.id || 1) + 8.4)) * radius * 0.86;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist - radius * (0.52 + charge * 0.28);
      const fall = clamp01(charge * 1.15 - (i % 5) * 0.08);
      ctx.strokeStyle = hexToRgba("#ecfccb", 0.18 + fall * 0.48);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(px - 14, py - 28 + fall * radius * 0.28);
      ctx.lineTo(px + 4, py + 16 + fall * radius * 0.28);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const fill = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  fill.addColorStop(0, "rgba(236, 252, 203, 0.18)");
  fill.addColorStop(0.62, hexToRgba(color, 0.13));
  fill.addColorStop(1, "rgba(15, 23, 42, 0.02)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.98, 0, Math.PI * 2);
  ctx.clip();

  const count = Math.max(18, Math.floor(radius / 5.4));
  for (let i = 0; i < count; i += 1) {
    const seed = pseudoRandom(Number(hazard.id || 1) + i * 11.17, i * 5.31);
    const seed2 = pseudoRandom(i * 3.77, Number(hazard.id || 1) + 19.9);
    const angle = seed * Math.PI * 2;
    const spread = Math.sqrt(seed2) * radius * 0.92;
    const baseX = x + Math.cos(angle) * spread;
    const baseY = y + Math.sin(angle) * spread;
    const fall = (now / 420 + seed * 1.7 + i * 0.071) % 1;
    const dropX = baseX - 34 + fall * 28;
    const dropY = baseY - radius * 0.52 + fall * radius * 1.04;
    const length = 34 + seed2 * 18;
    const alpha = 0.35 + fall * 0.45;

    ctx.strokeStyle = `rgba(236, 252, 203, ${alpha})`;
    ctx.lineWidth = 2.1;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(dropX - length * 0.24, dropY - length * 0.7);
    ctx.lineTo(dropX + length * 0.18, dropY + length * 0.18);
    ctx.stroke();

    ctx.strokeStyle = `rgba(127, 166, 113, ${Math.min(0.82, alpha + 0.18)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dropX + length * 0.18, dropY + length * 0.18);
    ctx.lineTo(dropX + length * 0.02, dropY - length * 0.08);
    ctx.moveTo(dropX + length * 0.18, dropY + length * 0.18);
    ctx.lineTo(dropX - length * 0.08, dropY + length * 0.08);
    ctx.stroke();
  }

  ctx.restore();

  ctx.strokeStyle = hexToRgba(color, 0.78);
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.98 + Math.sin(now / 180) * 0.012), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(236, 252, 203, 0.5)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDangerTelegraph(x, y, radius, color, charge, options = {}) {
  const now = performance.now();
  const active = clamp01(charge);
  const pulse = 1 + Math.sin(now / 86) * 0.035;
  const outerRadius = radius * (0.98 + active * 0.025) * pulse;
  const stripeAlpha = options.stripeAlpha ?? 0.32;
  const coreColor = options.coreColor || "#fee2e2";

  const fill = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  fill.addColorStop(0, hexToRgba(color, 0.2));
  fill.addColorStop(0.58, hexToRgba(color, 0.12));
  fill.addColorStop(1, hexToRgba(color, 0.025));
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.98, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = `rgba(25, 14, 14, ${stripeAlpha})`;
  ctx.lineWidth = Math.max(5, radius * 0.052);
  const spacing = Math.max(32, radius * 0.36);
  for (let offset = -radius * 2.4; offset <= radius * 2.4; offset += spacing) {
    ctx.beginPath();
    ctx.moveTo(x - radius * 1.2 + offset, y - radius * 1.15);
    ctx.lineTo(x + radius * 1.2 + offset, y + radius * 1.15);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = hexToRgba(color, 0.92);
  ctx.lineWidth = Math.max(4, radius * 0.048);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.98, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(254, 242, 242, 0.72)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 7]);
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.82 - active * 0.22), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = hexToRgba(coreColor, 0.82);
  ctx.lineWidth = Math.max(3, radius * 0.04);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * active);
  ctx.stroke();
  ctx.lineCap = "butt";

  const spokes = Math.min(options.spokes || 8, options.maxSpokes || 8);
  for (let i = 0; i < spokes; i += 1) {
    const angle = (Math.PI * 2 * i) / spokes + now / 780;
    const markerRadius = radius * (0.5 + active * 0.14);
    drawDangerChevron(
      x + Math.cos(angle) * markerRadius,
      y + Math.sin(angle) * markerRadius,
      angle + Math.PI,
      Math.max(7, radius * 0.095),
      color
    );
  }
}

function drawDangerChevron(x, y, angle, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = hexToRgba(color, 0.88);
  ctx.strokeStyle = "rgba(254, 242, 242, 0.72)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.9, 0);
  ctx.lineTo(-size * 0.58, -size * 0.46);
  ctx.lineTo(-size * 0.3, 0);
  ctx.lineTo(-size * 0.58, size * 0.46);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawAlchemyBombHazard(x, y, hazard) {
  const color = hazard.color || classColors.alchemist;
  const radius = hazard.radius || 90;
  const armTime = Number(hazard.armTime || 0);
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 0.5));
  const charge = hazard.armed ? 1 : clamp01(1 - armTime / armTimeMax);
  const now = performance.now();

  drawDangerTelegraph(x, y, radius, color, charge, {
    spokes: hazard.small ? 6 : 9,
    stripeAlpha: 0.22,
    coreColor: "#fef3c7"
  });

  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate((hazard.id || 0) + now / 360);
  ctx.strokeStyle = hexToRgba("#fef3c7", 0.62 + charge * 0.22);
  ctx.lineWidth = 2.5;
  const bottleR = Math.max(10, Math.min(18, radius * 0.13));
  roundRect(-bottleR * 0.5, -bottleR * 1.2, bottleR, bottleR * 2.1, 4);
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.22 + charge * 0.34);
  ctx.fillRect(-bottleR * 0.36, -bottleR * 0.1, bottleR * 0.72, bottleR * 0.82);

  ctx.strokeStyle = hexToRgba(color, 0.5 + charge * 0.34);
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + charge * 0.9;
    const inner = radius * (0.16 + charge * 0.05);
    const outer = radius * (0.34 + charge * 0.1);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlchemyPoolHazard(x, y, hazard) {
  const fire = hazard.mode === "fire";
  const reaction = hazard.mode === "reaction";
  const armed = hazard.armed || Number(hazard.armTime || 0) <= 0;
  if (!armed && !reaction) {
    const color = hazard.color || (fire ? "#c9824c" : classColors.alchemist);
    const armTime = Number(hazard.armTime || 0);
    const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || armTime || 0.5));
    const build = clamp01(1 - armTime / armTimeMax);
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = hexToRgba(color, 0.08 + build * 0.08);
    ctx.beginPath();
    ctx.arc(0, 0, hazard.radius * (0.22 + build * 0.22), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(fire ? "#fed7aa" : "#d9f99d", 0.42 + build * 0.36);
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, hazard.radius * (0.48 + build * 0.16), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hexToRgba(fire ? "#fb923c" : "#bef264", 0.58);
    for (let i = 0; i < 5; i += 1) {
      const angle = (Math.PI * 2 * i) / 5 + (hazard.id || 0);
      const dist = hazard.radius * (0.12 + build * 0.28) * (0.62 + (i % 2) * 0.32);
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 3.5 + build * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  if (reaction) {
    ctx.save();
    const now = performance.now();
    const pulse = 1 + Math.sin(now / 150) * 0.05;
    ctx.fillStyle = "rgba(232,177,94,0.16)";
    ctx.strokeStyle = "rgba(255,237,213,0.72)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, hazard.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(154,161,95,0.62)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6 + now / 520;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * hazard.radius * 0.36, y + Math.sin(angle) * hazard.radius * 0.28, hazard.radius * 0.09, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (fire) {
    drawFirePoolHazard(x, y, hazard.radius, hazard);
    ctx.save();
    ctx.strokeStyle = "rgba(254, 215, 170, 0.62)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4 + performance.now() / 820;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * hazard.radius * 0.34, y + Math.sin(angle) * hazard.radius * 0.25, hazard.radius * 0.12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  drawPoisonPoolHazard(x, y, hazard.radius);
  ctx.save();
  ctx.strokeStyle = hexToRgba(classColors.alchemist, 0.78);
  ctx.fillStyle = "rgba(236,252,203,0.18)";
  ctx.lineWidth = 2.4;
  const now = performance.now();
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 + now / 1100;
    const px = x + Math.cos(angle) * hazard.radius * (0.28 + (i % 2) * 0.18);
    const py = y + Math.sin(angle) * hazard.radius * (0.22 + (i % 2) * 0.16);
    ctx.beginPath();
    ctx.moveTo(px - 6, py - 5);
    ctx.lineTo(px + 8, py - 2);
    ctx.lineTo(px + 2, py + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlchemyElixirMistHazard(x, y, hazard) {
  ctx.save();
  const now = performance.now();
  const pulse = 1 + Math.sin(now / 180) * 0.04;
  ctx.fillStyle = "rgba(190,242,100,0.12)";
  ctx.strokeStyle = "rgba(217,249,157,0.58)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, hazard.radius * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(236,252,203,0.62)";
  for (let i = 0; i < 7; i += 1) {
    const angle = (Math.PI * 2 * i) / 7 + now / 900;
    const px = x + Math.cos(angle) * hazard.radius * 0.42;
    const py = y + Math.sin(angle) * hazard.radius * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, 3 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPoisonPoolHazard(x, y, radius) {
  const now = performance.now();
  const pulse = 1 + Math.sin(now / 220) * 0.035;
  const fill = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius);
  fill.addColorStop(0, "rgba(190, 242, 100, 0.3)");
  fill.addColorStop(0.42, "rgba(101, 163, 13, 0.24)");
  fill.addColorStop(1, "rgba(54, 83, 20, 0.04)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.92, 0, Math.PI * 2);
  ctx.clip();
  for (let i = 0; i < 9; i += 1) {
    const seed = i * 2.17;
    const angle = (Math.PI * 2 * i) / 9 + Math.sin(now / 760 + seed) * 0.22;
    const dist = radius * (0.18 + (i % 4) * 0.16);
    const bx = x + Math.cos(angle) * dist;
    const by = y + Math.sin(angle) * dist;
    const bubbleRadius = Math.max(3, radius * (0.045 + (i % 3) * 0.018));
    ctx.fillStyle = i % 2 ? "rgba(217, 249, 157, 0.34)" : "rgba(132, 204, 22, 0.42)";
    ctx.beginPath();
    ctx.ellipse(bx, by, bubbleRadius * 1.18, bubbleRadius * 0.82, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(63, 98, 18, 0.56)";
  ctx.lineWidth = Math.max(4, radius * 0.052);
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 + now / 1150;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.18, y + Math.sin(angle) * radius * 0.18);
    ctx.quadraticCurveTo(
      x + Math.cos(angle + 0.36) * radius * 0.48,
      y + Math.sin(angle + 0.36) * radius * 0.48,
      x + Math.cos(angle + 0.12) * radius * 0.82,
      y + Math.sin(angle + 0.12) * radius * 0.82
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(217, 249, 157, 0.82)";
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(132, 204, 22, 0.72)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i <= 30; i += 1) {
    const angle = (Math.PI * 2 * i) / 30;
    const edge = radius * (0.76 + Math.sin(now / 360 + i * 1.7) * 0.04);
    const px = x + Math.cos(angle) * edge;
    const py = y + Math.sin(angle) * edge;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  drawToxicMark(x, y, Math.min(32, radius * 0.34));
}

function drawFirePoolHazard(x, y, radius, hazard = {}) {
  const now = performance.now();
  const ttl = Math.max(0.1, Number(hazard.timer || 1));
  const lifePulse = 0.96 + Math.sin(now / 130) * 0.04;
  const edgeRadius = radius * lifePulse;
  const fill = ctx.createRadialGradient(x, y, radius * 0.08, x, y, edgeRadius);
  fill.addColorStop(0, "rgba(254,215,170,0.22)");
  fill.addColorStop(0.34, "rgba(251,146,60,0.22)");
  fill.addColorStop(0.68, "rgba(194,65,12,0.16)");
  fill.addColorStop(1, "rgba(127,29,29,0)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, edgeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(251,146,60,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 22; i += 1) {
    const angle = (Math.PI * 2 * i) / 22;
    const wobble = 0.88 + Math.sin(angle * 5 + now / 170) * 0.08 + Math.sin(angle * 9 - now / 230) * 0.04;
    const px = x + Math.cos(angle) * radius * wobble;
    const py = y + Math.sin(angle) * radius * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  for (let i = 0; i < 6; i += 1) {
    const seed = i * 19.7;
    const angle = seed + now / (520 + i * 31);
    const dist = radius * (0.18 + ((i * 37) % 54) / 100);
    const fx = x + Math.cos(angle) * dist;
    const fy = y + Math.sin(angle * 1.13) * dist * 0.72;
    const flameHeight = radius * (0.16 + ((i * 11) % 7) * 0.018) * (0.78 + Math.sin(now / 120 + i) * 0.18);
    const flameWidth = flameHeight * 0.42;
    const flame = ctx.createLinearGradient(fx, fy + flameHeight * 0.4, fx, fy - flameHeight);
    flame.addColorStop(0, "rgba(194,65,12,0.18)");
    flame.addColorStop(0.45, "rgba(251,146,60,0.52)");
    flame.addColorStop(1, "rgba(254,240,138,0.66)");
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(fx, fy - flameHeight);
    ctx.quadraticCurveTo(fx + flameWidth, fy - flameHeight * 0.34, fx + flameWidth * 0.32, fy + flameHeight * 0.24);
    ctx.quadraticCurveTo(fx, fy + flameHeight * 0.44, fx - flameWidth * 0.38, fy + flameHeight * 0.24);
    ctx.quadraticCurveTo(fx - flameWidth, fy - flameHeight * 0.32, fx, fy - flameHeight);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(254,240,138,0.5)";
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + now / 780;
    const sparkRadius = radius * (0.2 + ((i * 23) % 68) / 100);
    const sx = x + Math.cos(angle) * sparkRadius;
    const sy = y + Math.sin(angle) * sparkRadius * 0.82 - Math.sin(now / 170 + i) * 6;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2 + (i % 2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = `rgba(127,29,29,${Math.min(0.22, 0.06 + ttl * 0.02)})`;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.74, 0, Math.PI * 2);
  ctx.fill();
}

function drawToxicMark(x, y, size) {
  ctx.save();
  ctx.strokeStyle = "rgba(236, 252, 203, 0.72)";
  ctx.fillStyle = "rgba(22, 101, 52, 0.42)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 3; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 3;
    const cx = x + Math.cos(angle) * size * 0.42;
    const cy = y + Math.sin(angle) * size * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.22, angle + Math.PI * 0.18, angle + Math.PI * 1.52);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArrowProjectile(projectile, color, style) {
  const piercing = style === "piercing_arrow";
  const poison = projectile.poison || style === "poison_arrow";
  const length = piercing ? Math.max(58, (projectile.radius || 18) * 3.2) : style === "arrow_fan" ? 30 : 34;
  const width = piercing ? Math.max(12, (projectile.radius || 18) * 0.72) : 6;

  ctx.strokeStyle = hexToRgba(poison ? "#9aa15f" : color, 0.32);
  ctx.lineWidth = piercing ? Math.max(18, (projectile.radius || 18) * 1.15) : 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-length * (piercing ? 0.96 : 0.78), 0);
  ctx.lineTo(length * 0.42, 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, piercing ? 0.92 : 0.78);
  ctx.lineWidth = piercing ? Math.max(5, (projectile.radius || 18) * 0.28) : 3;
  ctx.beginPath();
  ctx.moveTo(-length * (piercing ? 0.68 : 0.45), 0);
  ctx.lineTo(length * 0.34, 0);
  ctx.stroke();

  ctx.fillStyle = poison ? "#bef264" : "#f8fafc";
  ctx.beginPath();
  ctx.moveTo(length * (piercing ? 0.68 : 0.56), 0);
  ctx.lineTo(length * 0.16, -width);
  ctx.lineTo(length * 0.22, 0);
  ctx.lineTo(length * 0.16, width);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = poison ? "#65a30d" : color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-length * 0.48, -width * 0.9);
  ctx.lineTo(-length * 0.18, 0);
  ctx.lineTo(-length * 0.48, width * 0.9);
  ctx.stroke();

  if (poison) {
    ctx.fillStyle = "rgba(132, 204, 22, 0.72)";
    ctx.beginPath();
    ctx.arc(-length * 0.12, -10, 3, 0, Math.PI * 2);
    ctx.arc(-length * 0.34, 9, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArcaneProjectile(projectile, color, style) {
  const radius = Math.max(7, projectile.radius || 11);
  const pulse = 1 + Math.sin(performance.now() / 110 + Number(projectile.id || 0)) * 0.08;

  ctx.fillStyle = hexToRgba(color, 0.18);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.1 * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(color, 0.72);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#f5d0fe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + performance.now() / 420;
    const r = i % 2 ? radius * 0.55 : radius * 1.05;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = style === "star_orb" ? "#f0abfc" : color;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
  ctx.fill();
}

function drawAlchemyProjectile(projectile, color, style) {
  const radius = Math.max(7, projectile.radius || 10);
  const poison = projectile.poison || style.includes("acid");
  const liquid = poison ? "#bef264" : color;
  ctx.save();
  ctx.rotate(Math.sin(performance.now() / 120 + Number(projectile.id || 0)) * 0.18);
  ctx.strokeStyle = hexToRgba(color, 0.3);
  ctx.lineWidth = radius * 1.25;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-radius * 2.9, 0);
  ctx.lineTo(-radius * 0.6, 0);
  ctx.stroke();

  ctx.fillStyle = hexToRgba(liquid, 0.22);
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.55, radius * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f8f3e9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.42, -radius * 1.05);
  ctx.lineTo(radius * 0.42, -radius * 1.05);
  ctx.lineTo(radius * 0.6, radius * 0.2);
  ctx.quadraticCurveTo(0, radius * 1.25, -radius * 0.6, radius * 0.2);
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = liquid;
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.22, radius * 0.66, radius * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHolyProjectile(projectile, color) {
  const radius = Math.max(6, projectile.radius || 9);
  ctx.fillStyle = hexToRgba(color, 0.2);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fef3c7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.5, 0);
  ctx.lineTo(radius * 1.5, 0);
  ctx.moveTo(0, -radius * 1.5);
  ctx.lineTo(0, radius * 1.5);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.fill();
}

function drawTechProjectile(projectile, color, style) {
  const radius = Math.max(6, projectile.radius || 8);
  const rail = style === "rail_bolt" || style === "drone_laser";
  ctx.strokeStyle = hexToRgba(color, rail ? 0.42 : 0.28);
  ctx.lineWidth = rail ? radius * 1.8 : radius * 1.25;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-radius * (rail ? 4.8 : 2.8), 0);
  ctx.lineTo(radius * 1.4, 0);
  ctx.stroke();

  ctx.strokeStyle = rail ? "#fef3c7" : "#f8fafc";
  ctx.lineWidth = rail ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(-radius * (rail ? 3.4 : 1.7), 0);
  ctx.lineTo(radius * 1.8, 0);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(radius * 2.2, 0);
  ctx.lineTo(radius * 0.2, -radius * 0.8);
  ctx.lineTo(radius * 0.2, radius * 0.8);
  ctx.closePath();
  ctx.fill();
}

function drawThreadProjectile(projectile, color) {
  const radius = Math.max(5, projectile.radius || 7);
  ctx.strokeStyle = hexToRgba(color, 0.34);
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-radius * 4.2, 0);
  ctx.quadraticCurveTo(-radius * 1.6, -radius * 0.8, radius * 0.8, 0);
  ctx.stroke();

  ctx.strokeStyle = "#f5d0fe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 4.8, 0);
  ctx.quadraticCurveTo(-radius * 1.6, radius * 0.72, radius * 1.6, 0);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(radius * 2.2, 0);
  ctx.lineTo(radius * 0.35, -radius * 0.68);
  ctx.lineTo(radius * 0.5, radius * 0.68);
  ctx.closePath();
  ctx.fill();
}

function drawSpitProjectile(projectile, color) {
  const radius = Math.max(7, projectile.radius || 10);
  const venom = projectile.poison || projectile.style === "venom_spit";
  const body = venom ? "#9aa15f" : color;

  ctx.fillStyle = hexToRgba(body, 0.18);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 1.25, radius * 0.82, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = venom ? "#d9f99d" : "#fecdd3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-radius * 1.6, -radius * 0.55);
  ctx.lineTo(-radius * 0.38, 0);
  ctx.lineTo(-radius * 1.6, radius * 0.55);
  ctx.stroke();
}

function drawSniperProjectile(projectile, color) {
  const radius = Math.max(7, projectile.radius || 8);
  ctx.strokeStyle = hexToRgba("#f6f1e8", 0.28);
  ctx.lineWidth = radius * 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-radius * 4.2, 0);
  ctx.lineTo(radius * 1.4, 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.88);
  ctx.lineWidth = Math.max(3, radius * 0.8);
  ctx.beginPath();
  ctx.moveTo(-radius * 4.8, 0);
  ctx.lineTo(radius * 2.2, 0);
  ctx.stroke();

  ctx.fillStyle = "#f6f1e8";
  ctx.beginPath();
  ctx.moveTo(radius * 2.8, 0);
  ctx.lineTo(radius * 0.6, -radius * 0.9);
  ctx.lineTo(radius * 0.6, radius * 0.9);
  ctx.closePath();
  ctx.fill();
}

function drawShurikenProjectile(projectile, color) {
  const radius = Math.max(4.5, projectile.radius || 5);
  const spin = performance.now() / 75;
  ctx.save();
  ctx.rotate(spin);

  ctx.fillStyle = hexToRgba(color, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f5d0fe";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const r = i % 2 === 0 ? radius * 1.45 : radius * 0.48;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = hexToRgba(color, 0.5);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-radius * 3.2, 0);
  ctx.lineTo(-radius * 1.2, 0);
  ctx.stroke();
}

function drawSimpleProjectile(projectile, color) {
  const radius = Math.max(5, projectile.radius || 8);
  ctx.fillStyle = hexToRgba(color, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawXpOrbs() {
  for (const orb of state.xpOrbs || []) {
    const position = getVisualPosition(visuals.xpOrbs, orb);
    const x = position.x;
    const y = position.y;
    const pulse = 1 + Math.sin(performance.now() / 180 + Number(orb.id || 0)) * 0.05;
    const radius = Math.max(4, (orb.radius || 9) * 0.58) * pulse;

    ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(125, 211, 252, 0.58)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius + 1.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#7e9fb2";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e0f2fe";
    ctx.beginPath();
    ctx.arc(x - radius * 0.25, y - radius * 0.3, Math.max(1.2, radius * 0.2), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChests() {
  for (const chest of state.relicChests || []) {
    const position = getVisualPosition(visuals.chests, chest);
    const x = position.x;
    const y = position.y;
    const pulse = 1 + Math.sin(performance.now() / 180) * 0.08;

    ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
    ctx.beginPath();
    ctx.arc(x, y, chest.radius * 1.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#facc15";
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 4;
    roundRect(x - 22, y - 14, 44, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#92400e";
    ctx.fillRect(x - 3, y - 14, 6, 30);
    ctx.fillRect(x - 22, y - 1, 44, 6);

    ctx.strokeStyle = "rgba(250, 204, 21, 0.82)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, chest.radius * 2.05 * pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloatingEffects() {
  for (const effect of floatingEffects) {
    const alpha = Math.max(0, 1 - effect.age / effect.ttl);
    const color = effect.color || "#f6f1e8";
    const progress = clamp01(effect.age / effect.ttl);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (effect.kind === "damage" || (effect.kind === "poison" && effect.value) || effect.kind === "heal" || effect.kind === "xp") {
      drawFloatingNumber(effect, color);
    } else if (effect.kind === "slash") {
      drawSlashEffect(effect, color, progress);
    } else if (effect.kind === "spin") {
      drawSpinEffect(effect, color, progress);
    } else if (effect.kind === "dash") {
      drawDashEffect(effect, color, progress);
    } else if (effect.kind === "explosion" && effect.style === "boss_beam_fire") {
      drawBossBeamFireEffect(effect, color, progress);
    } else if (effect.kind === "explosion" || effect.kind === "death" || effect.kind === "level") {
      drawBurstRingEffect(effect, color, progress);
    } else if (effect.kind === "shield") {
      drawShieldEffect(effect, color, progress);
    } else if (effect.kind === "cleanse") {
      drawCleanseEffect(effect, color, progress);
    } else if (effect.kind === "revive") {
      drawReviveEffect(effect, color, progress);
    } else if (effect.kind === "slow" || effect.kind === "freeze") {
      drawFrostEffect(effect, color, progress);
    } else if (effect.kind === "poison") {
      drawPoisonEffect(effect, color, progress);
    } else if (effect.kind === "warning") {
      drawWarningEffect(effect, color, progress);
    } else if (effect.kind === "meteor") {
      drawMeteorEffect(effect, color, progress);
    } else if (effect.kind === "trap") {
      drawTrapEffect(effect, color, progress);
    } else if (effect.kind === "shot") {
      drawShotEffect(effect, color, progress);
    } else if (effect.kind === "impact") {
      drawImpactEffect(effect, color, progress);
    } else if (effect.kind === "arcane") {
      drawArcaneSplashEffect(effect, color, progress);
    } else if (effect.kind === "chest") {
      drawChestEffect(effect, color, progress);
    } else if (effect.kind === "chain") {
      drawChainEffect(effect, color, progress);
    } else if (effect.kind === "holy") {
      drawHolyEffect(effect, color, progress);
    } else if (effect.kind === "star") {
      drawStarEffect(effect, color, progress);
    }

    ctx.restore();
  }
}

function drawFloatingNumber(effect, color) {
  if (effect.kind === "heal") {
    const value = Math.max(1, Number(effect.value || 0));
    const lift = Math.min(18, effect.age * 22);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = hexToRgba("#bbf7d0", 0.18);
    ctx.beginPath();
    ctx.arc(effect.x, effect.y + 4 - lift, 18, 0, Math.PI * 2);
    ctx.fill();
    drawHealingPlus(effect.x - 20, effect.y - 4 - lift, 9, "#dcfce7", 0.72);
    drawHealingPlus(effect.x + 20, effect.y + 2 - lift, 7, "#fef3c7", 0.56);
    ctx.restore();
    ctx.fillStyle = "#dcfce7";
    ctx.font = "900 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(20,83,45,0.62)";
    ctx.lineWidth = 4;
    ctx.strokeText(`+${value}`, effect.x, effect.y - lift);
    ctx.fillText(`+${value}`, effect.x, effect.y - lift);
    return;
  }

  const progress = clamp01(effect.age / Math.max(0.1, effect.ttl || 0.7));
  const isDamage = effect.kind === "damage" || (effect.kind === "poison" && effect.value);
  const pop = isDamage ? 1 + (effect.critical ? 0.36 : 0.18) * Math.max(0, 1 - progress * 2.9) : 1;
  const wobble = isDamage ? Math.sin((effect.seed || 0) + effect.age * 18) * (1 - progress) * 2.4 : 0;
  const label = effect.kind === "xp" ? `+${effect.value || 0} XP` : String(effect.value || "");

  ctx.save();
  ctx.translate(effect.x + wobble, effect.y);
  ctx.scale(pop, pop);
  ctx.fillStyle = color;
  ctx.font = `${effect.critical ? "900 26px" : effect.kind === "xp" ? "900 15px" : "900 18px"} Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (isDamage) {
    ctx.shadowColor = effect.critical ? "rgba(250,204,21,0.74)" : "rgba(255,255,255,0.22)";
    ctx.shadowBlur = effect.critical ? 12 : 5;
  }
  if (effect.critical) {
    ctx.strokeStyle = "rgba(0,0,0,0.62)";
    ctx.lineWidth = 5;
    ctx.strokeText(label, 0, 0);
  } else if (isDamage) {
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 3;
    ctx.strokeText(label, 0, 0);
  }
  ctx.fillText(label, 0, 0);
  ctx.restore();
}

function drawBossBeamFireEffect(effect, color, progress) {
  const angle = Number(effect.angle || 0);
  const length = Math.max(120, Number(effect.length || 780));
  const width = Math.max(20, Number(effect.radius || 34));
  const alpha = 1 - progress;
  const startX = effect.x - Math.cos(angle) * length * 0.5;
  const startY = effect.y - Math.sin(angle) * length * 0.5;
  const endX = effect.x + Math.cos(angle) * length * 0.5;
  const endY = effect.y + Math.sin(angle) * length * 0.5;

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.24 * alpha);
  ctx.lineWidth = width * (2.8 - progress * 1.2);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = `rgba(254,242,242,${0.76 * alpha})`;
  ctx.lineWidth = Math.max(4, width * (0.42 - progress * 0.08));
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  ctx.restore();
}

function drawSlashEffect(effect, color, progress) {
  if (pixiRenderer && (effect.style === "warrior_basic" || effect.style === "warrior_cleave")) return;
  if (effect.style === "stalker_stab") {
    drawStalkerStabSlashEffect(effect, color, progress);
    return;
  }
  if ((effect.style || "").startsWith("martial_")) {
    drawMartialSlashEffect(effect, color, progress);
    return;
  }
  if ((effect.style || "").startsWith("assassin_")) {
    drawAssassinSlashEffect(effect, color, progress);
    return;
  }
  if (effect.style === "puppet_slash" || effect.style === "thread_theater") {
    drawThreadSlashEffect(effect, color, progress);
    return;
  }

  const radius = effect.radius || 120;
  const brute = effect.style === "brute_swing";
  const cleave = effect.style === "warrior_cleave";
  const side = effect.swingSide === -1 ? -1 : 1;
  const activeProgress = clamp01(progress / (cleave ? 0.82 : 0.76));
  const ease = 1 - Math.pow(1 - activeProgress, 3);
  const after = clamp01((progress - 0.58) / 0.42);
  const sweep = brute ? 1.48 : cleave ? 2.34 : 1.74;
  const startAngle = -sweep * 0.58;
  const endAngle = startAngle + sweep * ease;
  const trailSpan = sweep * (brute ? 0.5 : cleave ? 0.5 : 0.42) * (0.72 + after * 0.18);
  const trailStart = Math.max(startAngle, endAngle - trailSpan);
  const bladeRadius = radius * (brute ? 0.72 : cleave ? 0.7 : 0.6);
  const originX = -radius * (brute ? 0.2 : cleave ? 0.38 : 0.33);
  const glowAlpha = brute ? 0.2 : cleave ? 0.18 : 0.13;
  const bladeTipX = originX + Math.cos(endAngle) * bladeRadius;
  const bladeTipY = Math.sin(endAngle) * bladeRadius;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.angle || 0);
  ctx.scale(1, side);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = hexToRgba(color, glowAlpha);
  ctx.beginPath();
  ctx.moveTo(originX + Math.cos(trailStart) * bladeRadius * 0.34, Math.sin(trailStart) * bladeRadius * 0.34);
  ctx.arc(originX, 0, bladeRadius * (1.08 + progress * 0.08), trailStart, endAngle);
  ctx.quadraticCurveTo(originX + radius * 0.42, 0, originX + Math.cos(trailStart) * bladeRadius * 0.34, Math.sin(trailStart) * bladeRadius * 0.34);
  ctx.fill();

  for (let i = 0; i < 3; i += 1) {
    const lag = i * (cleave ? 0.065 : 0.052);
    const localEnd = Math.max(startAngle, endAngle - lag);
    const localStart = Math.max(startAngle, localEnd - trailSpan * (0.62 + i * 0.08));
    const trailRadius = bladeRadius * (0.88 + i * 0.055 + progress * 0.08);
    const alpha = (brute ? 0.26 : cleave ? 0.24 : 0.18) * (1 - i * 0.18) * (1 - after * 0.35);
    ctx.strokeStyle = hexToRgba(color, alpha);
    ctx.lineWidth = Math.max(5, (brute ? 32 : cleave ? 36 : 24) - i * 7);
    ctx.beginPath();
    ctx.arc(originX, 0, trailRadius, localStart, localEnd);
    ctx.stroke();
  }

  const edgeStart = Math.max(startAngle, endAngle - sweep * (cleave ? 0.34 : 0.28));
  ctx.strokeStyle = hexToRgba(brute ? "#fecaca" : "#fff7ed", cleave ? 0.92 : 0.86);
  ctx.lineWidth = brute ? 12 : cleave ? 11 : 8;
  ctx.beginPath();
  ctx.arc(originX, 0, bladeRadius * 0.98, edgeStart, endAngle);
  ctx.stroke();

  ctx.strokeStyle = brute ? "#f87171" : cleave ? "#facc15" : "#fed7aa";
  ctx.lineWidth = brute ? 5 : cleave ? 5 : 4;
  ctx.beginPath();
  ctx.arc(originX, 0, bladeRadius * 0.78, Math.max(startAngle, edgeStart + sweep * 0.08), endAngle);
  ctx.stroke();

  const hiltX = originX + Math.cos(endAngle) * bladeRadius * 0.34;
  const hiltY = Math.sin(endAngle) * bladeRadius * 0.34;
  if (brute) {
    ctx.strokeStyle = "#fee2e2";
    ctx.lineWidth = 4;
    for (let i = -1; i <= 1; i += 1) {
      const clawAngle = endAngle + i * 0.11;
      ctx.beginPath();
      ctx.moveTo(originX + Math.cos(clawAngle) * bladeRadius * 0.58, Math.sin(clawAngle) * bladeRadius * 0.58);
      ctx.lineTo(originX + Math.cos(clawAngle) * bladeRadius * 0.95, Math.sin(clawAngle) * bladeRadius * 0.95);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  drawSwordBladeSnapshot(hiltX, hiltY, bladeTipX, bladeTipY, cleave ? 26 : 18, color, cleave);

  ctx.restore();
}

function drawThreadSlashEffect(effect, color, progress) {
  const radius = effect.radius || 132;
  const alpha = 1 - progress;
  const spin = (effect.angle || 0) + progress * Math.PI * 0.72;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(spin);
  ctx.lineCap = "round";
  ctx.strokeStyle = hexToRgba(color, 0.16 * alpha);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.34 + progress * 0.18), -1.4, 1.4);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    const offset = (i - 2) * radius * 0.13;
    const length = radius * (0.72 + i * 0.035);
    const bend = Math.sin(progress * Math.PI + i) * radius * 0.06;
    ctx.strokeStyle = hexToRgba(i % 2 ? "#f5d0fe" : color, (0.78 - i * 0.08) * alpha);
    ctx.lineWidth = i === 2 ? 3.5 : 2;
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, offset);
    ctx.quadraticCurveTo(0, offset * 0.24 + bend, length * 0.58, -offset * 0.45);
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba("#fdf4ff", 0.52 * alpha);
  for (let i = 0; i < 7; i += 1) {
    const angle = -0.9 + i * 0.3 + progress * 0.5;
    const r = radius * (0.22 + i * 0.075);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMartialSlashEffect(effect, color, progress) {
  const radius = effect.radius || 120;
  const alpha = 1 - progress;
  const style = effect.style || "";
  const palm = style === "martial_palm" || style === "martial_palm_finisher";
  const finisher = style === "martial_combo_finisher" || style === "martial_palm_finisher";
  const side = effect.swingSide === -1 ? -1 : 1;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.angle || 0);
  ctx.scale(1, side);
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";

  if (palm) {
    const thrust = 1 - Math.pow(1 - clamp01(progress / 0.76), 2.8);
    ctx.fillStyle = hexToRgba(color, 0.13 * alpha);
    ctx.beginPath();
    ctx.ellipse(radius * 0.24, 0, radius * (0.34 + thrust * 0.26), radius * (finisher ? 0.34 : 0.24), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hexToRgba(color, 0.38 * alpha);
    ctx.lineWidth = finisher ? 38 : 28;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.38, 0);
    ctx.lineTo(radius * (0.32 + thrust * 0.28), 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#fff7ed", 0.84 * alpha);
    ctx.lineWidth = finisher ? 13 : 9;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.48, 0);
    ctx.lineTo(radius * (0.48 + thrust * 0.24), 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#fed7aa", 0.72 * alpha);
    ctx.lineWidth = finisher ? 5 : 3;
    for (const y of [-28, -10, 10, 28]) {
      ctx.beginPath();
      ctx.moveTo(radius * 0.06, y);
      ctx.lineTo(radius * (0.56 + thrust * 0.18), y * 0.28);
      ctx.stroke();
    }

    ctx.strokeStyle = hexToRgba("#fef3c7", 0.92 * alpha);
    ctx.lineWidth = finisher ? 5 : 3;
    ctx.beginPath();
    ctx.ellipse(radius * (0.58 + thrust * 0.1), 0, radius * 0.16, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();

    if (finisher) {
      drawRadialSparks(radius * 0.56, 0, radius * 0.4, "#fed7aa", 10, progress);
    }
    ctx.restore();
    return;
  }

  const combo = style === "martial_combo_finisher";
  const swing = 1 - Math.pow(1 - clamp01(progress / 0.72), 3);
  const sweep = combo ? 1.95 : 1.34;
  const start = -sweep * 0.52;
  const end = start + sweep * swing;
  const fistCount = combo ? 4 : 3;

  ctx.fillStyle = hexToRgba(color, (combo ? 0.16 : 0.1) * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.34 + progress * 0.18), 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < fistCount; i += 1) {
    const lag = i * 0.09;
    const localEnd = Math.max(start, end - lag);
    const localStart = Math.max(start, localEnd - sweep * (combo ? 0.36 : 0.28));
    const localRadius = radius * (0.45 + i * 0.055);
    ctx.strokeStyle = hexToRgba(i % 2 ? "#fff7ed" : color, (combo ? 0.46 : 0.34) * alpha * (1 - i * 0.1));
    ctx.lineWidth = (combo ? 24 : 18) - i * 3;
    ctx.beginPath();
    ctx.arc(-radius * 0.08, 0, localRadius, localStart, localEnd);
    ctx.stroke();

    const fistAngle = localEnd;
    const fx = -radius * 0.08 + Math.cos(fistAngle) * localRadius;
    const fy = Math.sin(fistAngle) * localRadius;
    ctx.fillStyle = hexToRgba("#fff7ed", (0.72 - i * 0.08) * alpha);
    ctx.beginPath();
    ctx.ellipse(fx, fy, combo ? 10 : 8, combo ? 7 : 5.5, fistAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(color, (0.7 - i * 0.08) * alpha);
    for (let k = -1; k <= 1; k += 1) {
      ctx.beginPath();
      ctx.arc(fx - Math.cos(fistAngle) * 4 + Math.sin(fistAngle) * k * 4, fy - Math.sin(fistAngle) * 4 - Math.cos(fistAngle) * k * 4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = hexToRgba("#fff7ed", 0.82 * alpha);
  ctx.lineWidth = combo ? 7 : 4.5;
  ctx.beginPath();
  ctx.arc(-radius * 0.08, 0, radius * 0.52, Math.max(start, end - sweep * 0.22), end);
  ctx.stroke();
  drawRadialSparks(radius * 0.28, 0, radius * (combo ? 0.48 : 0.34), "#fed7aa", combo ? 8 : 4, progress);
  ctx.restore();
}

function drawAssassinSlashEffect(effect, color, progress) {
  const radius = effect.radius || 130;
  const alpha = 1 - progress;
  const fan = effect.style === "assassin_fan";
  const lunge = effect.style === "shadow_lunge" || effect.style === "assassin_slash";
  const cutEase = 1 - Math.pow(1 - clamp01(progress / 0.68), 3);
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.angle || 0);
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";

  const cuts = fan ? [-0.48, -0.18, 0.18, 0.48] : [-0.2, 0.2];
  ctx.fillStyle = hexToRgba("#11110f", 0.32 * alpha);
  ctx.beginPath();
  ctx.ellipse(-radius * 0.2, 0, radius * 0.26, radius * (fan ? 0.34 : 0.22), 0, 0, Math.PI * 2);
  ctx.fill();

  for (const offset of cuts) {
    ctx.save();
    ctx.rotate(offset);
    const length = radius * (0.7 + cutEase * (fan ? 0.18 : 0.24));
    ctx.strokeStyle = hexToRgba("#11110f", 0.44 * alpha);
    ctx.lineWidth = fan ? 18 : 14;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.58, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba(color, 0.54 * alpha);
    ctx.lineWidth = fan ? 9 : 7;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.42, 0);
    ctx.lineTo(length * 0.86, 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.92 * alpha);
    ctx.lineWidth = fan ? 2.6 : 2.2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.18, -1);
    ctx.lineTo(length * 0.98, 1);
    ctx.stroke();
    ctx.restore();
  }

  if (fan) {
    ctx.strokeStyle = hexToRgba("#ddd6fe", 0.72 * alpha);
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(-radius * 0.08, 0, radius * (0.2 + i * 0.09 + progress * 0.08), -0.58, 0.58);
      ctx.stroke();
    }
  } else if (lunge) {
    ctx.fillStyle = hexToRgba(color, 0.24 * alpha);
    ctx.beginPath();
    ctx.moveTo(radius * (0.76 + progress * 0.1), 0);
    ctx.lineTo(radius * 0.32, -radius * 0.12);
    ctx.lineTo(radius * 0.44, 0);
    ctx.lineTo(radius * 0.32, radius * 0.12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStalkerStabSlashEffect(effect, color, progress) {
  const radius = effect.radius || 108;
  const angle = effect.angle || 0;
  const thrust = 1 - Math.pow(1 - clamp01(progress / 0.72), 3);
  const fade = 1 - clamp01((progress - 0.62) / 0.38);

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = hexToRgba(color, 0.2 * fade);
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.moveTo(radius * 0.08, 0);
  ctx.lineTo(radius * (0.58 + thrust * 0.34), 0);
  ctx.stroke();

  ctx.strokeStyle = `rgba(246,241,232,${0.82 * fade})`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(radius * 0.18, 0);
  ctx.lineTo(radius * (0.72 + thrust * 0.28), 0);
  ctx.stroke();

  ctx.fillStyle = `rgba(245,208,254,${0.78 * fade})`;
  const tipX = radius * (0.82 + thrust * 0.22);
  ctx.beginPath();
  ctx.moveTo(tipX + 16, 0);
  ctx.lineTo(tipX - 14, -9);
  ctx.lineTo(tipX - 6, 0);
  ctx.lineTo(tipX - 14, 9);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = hexToRgba(color, 0.52 * fade);
  ctx.lineWidth = 3;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(radius * 0.48, side * 5);
    ctx.lineTo(radius * (0.86 + thrust * 0.12), side * 16);
    ctx.stroke();
  }

  ctx.restore();
}

function drawSwordBladeSnapshot(hiltX, hiltY, tipX, tipY, width, color, cleave) {
  const dx = tipX - hiltX;
  const dy = tipY - hiltY;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const baseWidth = width * 0.72;
  const shoulderWidth = width * 0.42;
  const tipInset = width * 0.34;
  const shoulderX = hiltX + ux * length * 0.58;
  const shoulderY = hiltY + uy * length * 0.58;
  const edgeX = tipX - ux * tipInset;
  const edgeY = tipY - uy * tipInset;

  const bladeFill = ctx.createLinearGradient(hiltX, hiltY, tipX, tipY);
  bladeFill.addColorStop(0, hexToRgba(color, cleave ? 0.42 : 0.32));
  bladeFill.addColorStop(0.5, "rgba(255, 247, 237, 0.92)");
  bladeFill.addColorStop(1, "rgba(254, 243, 199, 0.98)");
  ctx.fillStyle = bladeFill;
  ctx.strokeStyle = cleave ? "#fde68a" : "#fed7aa";
  ctx.lineWidth = cleave ? 3 : 2.5;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(edgeX + nx * shoulderWidth, edgeY + ny * shoulderWidth);
  ctx.lineTo(hiltX + nx * baseWidth, hiltY + ny * baseWidth);
  ctx.lineTo(hiltX - nx * baseWidth, hiltY - ny * baseWidth);
  ctx.lineTo(edgeX - nx * shoulderWidth, edgeY - ny * shoulderWidth);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "rgba(120, 53, 15, 0.3)";
  ctx.lineWidth = cleave ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(hiltX + ux * width * 0.42, hiltY + uy * width * 0.42);
  ctx.lineTo(shoulderX, shoulderY);
  ctx.stroke();

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = cleave ? 5 : 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(hiltX + nx * width * 1.05, hiltY + ny * width * 1.05);
  ctx.lineTo(hiltX - nx * width * 1.05, hiltY - ny * width * 1.05);
  ctx.stroke();

  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = cleave ? 6 : 5;
  ctx.beginPath();
  ctx.moveTo(hiltX - ux * width * 1.18, hiltY - uy * width * 1.18);
  ctx.lineTo(hiltX - ux * width * 0.16, hiltY - uy * width * 0.16);
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawMartialFlurryEffect(effect, color, progress) {
  const baseRadius = effect.radius || 150;
  const alpha = 1 - progress;
  const finisher = effect.style === "martial_flurry_finisher";
  const spin = progress * Math.PI * (finisher ? 3.6 : 2.8) + (effect.seed || 0);

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.fillStyle = hexToRgba(color, (finisher ? 0.12 : 0.08) * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * (0.42 + progress * 0.24), 0, Math.PI * 2);
  ctx.fill();

  const strikes = finisher ? 10 : 7;
  for (let i = 0; i < strikes; i += 1) {
    const angle = spin + (Math.PI * 2 * i) / strikes;
    const inner = baseRadius * (0.18 + (i % 3) * 0.035);
    const outer = baseRadius * (0.5 + progress * 0.18 + (i % 2) * 0.06);
    const x1 = Math.cos(angle) * inner;
    const y1 = Math.sin(angle) * inner;
    const x2 = Math.cos(angle) * outer;
    const y2 = Math.sin(angle) * outer;

    ctx.strokeStyle = hexToRgba(i % 2 ? "#fff7ed" : color, (0.7 - i * 0.035) * alpha);
    ctx.lineWidth = finisher ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = hexToRgba("#fed7aa", (0.62 - i * 0.028) * alpha);
    ctx.beginPath();
    ctx.ellipse(x2, y2, finisher ? 8 : 6, finisher ? 5 : 4, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = hexToRgba("#fff7ed", 0.68 * alpha);
  ctx.lineWidth = finisher ? 6 : 4;
  for (let i = 0; i < (finisher ? 3 : 2); i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * (0.24 + progress * 0.48 + i * 0.12), spin * (i % 2 ? -0.35 : 0.35), spin * (i % 2 ? -0.35 : 0.35) + Math.PI * 1.2);
    ctx.stroke();
  }

  if (finisher) {
    drawRadialSparks(0, 0, baseRadius * 0.7, "#fed7aa", 12, progress);
  }
  ctx.restore();
}

function drawSpinEffect(effect, color, progress) {
  if (pixiRenderer && effect.style === "warrior_spin") return;

  if ((effect.style || "").startsWith("martial_flurry")) {
    drawMartialFlurryEffect(effect, color, progress);
    return;
  }

  const baseRadius = effect.radius || 170;
  const ease = 1 - Math.pow(1 - progress, 3);
  const offset = progress * Math.PI * 4.2;
  const ringRadius = baseRadius * (0.48 + progress * 0.46);

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  ctx.fillStyle = hexToRgba(color, 0.08);
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * (0.52 + progress * 0.18), 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 4; i += 1) {
    const start = offset + i * ((Math.PI * 2) / 5);
    const localRadius = baseRadius * (0.34 + i * 0.07 + progress * 0.16);
    ctx.strokeStyle = i % 2 ? "#fff7ed" : color;
    ctx.lineWidth = i % 2 ? 5 : 11;
    ctx.beginPath();
    ctx.arc(0, 0, localRadius, start, start + (i % 2 ? 1.32 : 1.55));
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(color, 0.24 * (1 - progress * 0.28));
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius * 0.86, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#facc15", 0.72 * (1 - progress));
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, baseRadius * (0.24 + ease * 0.72), 0, Math.PI * 2);
  ctx.stroke();

  drawRadialSparks(0, 0, baseRadius * (0.42 + progress * 0.36), "#fed7aa", 10, progress);
  ctx.restore();
}

function hasDashPath(effect) {
  return (
    Number.isFinite(effect.fromX) &&
    Number.isFinite(effect.fromY) &&
    Number.isFinite(effect.toX) &&
    Number.isFinite(effect.toY)
  );
}

function drawProgressiveDashEffect(effect, color, progress, flags) {
  const fromX = Number(effect.fromX);
  const fromY = Number(effect.fromY);
  const toX = Number(effect.toX);
  const toY = Number(effect.toY);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy);
  if (length < 2) return;

  const ux = dx / length;
  const uy = dy / length;
  const angle = Math.atan2(dy, dx);
  const moveDuration = Math.max(0.05, Number(effect.moveDuration) || (flags.charge ? 0.38 : flags.enemy ? 0.34 : 0.2));
  const moveRatio = clamp01((Number(effect.age) || 0) / moveDuration);
  const eased = flags.charge || flags.enemy ? moveRatio * moveRatio * (3 - 2 * moveRatio) : 1 - Math.pow(1 - moveRatio, 2.15);
  const head = clamp01(eased);
  const trailSpan = flags.charge ? 0.5 : flags.warrior ? 0.4 : flags.enemy ? 0.34 : flags.ranger ? 0.26 : 0.3;
  const tail = Math.max(0, head - trailSpan * (0.9 + progress * 0.14));
  const headX = fromX + ux * length * head;
  const headY = fromY + uy * length * head;
  const tailX = fromX + ux * length * tail;
  const tailY = fromY + uy * length * tail;
  const segmentLength = Math.max(12, Math.hypot(headX - tailX, headY - tailY));
  const centerX = (headX + tailX) / 2;
  const centerY = (headY + tailY) / 2;
  const radius = segmentLength / 2;
  const width = flags.enemy ? 18 : flags.charge ? 42 : flags.warrior ? 32 : flags.martial ? 18 : flags.assassin ? 14 : flags.ranger ? 10 : 12;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  const trail = ctx.createLinearGradient(-radius, 0, radius, 0);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(0.3, hexToRgba(color, flags.enemy ? 0.2 : flags.charge || flags.warrior ? 0.36 : 0.3));
  trail.addColorStop(
    0.78,
    flags.charge || flags.warrior
      ? hexToRgba("#fed7aa", 0.82)
      : flags.martial
        ? hexToRgba("#fff7ed", 0.72)
        : flags.assassin
          ? hexToRgba("#ddd6fe", 0.78)
          : flags.enemy
            ? hexToRgba("#fecaca", 0.78)
            : hexToRgba(color, 0.58)
  );
  trail.addColorStop(1, flags.enemy ? hexToRgba("#fff1f2", 0.78) : hexToRgba("#ffffff", 0.78));
  ctx.strokeStyle = trail;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, flags.charge || flags.warrior ? 0.72 : flags.martial || flags.assassin ? 0.62 : 0.52);
  ctx.lineWidth = flags.charge ? 8 : flags.warrior ? 6 : flags.martial ? 4 : 3;
  const lanes = flags.ranger || flags.assassin ? 1 : 2;
  for (let i = -lanes; i <= lanes; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.9, i * (flags.charge ? 20 : flags.warrior ? 15 : 10));
    ctx.lineTo(radius * 0.38, i * (flags.charge ? 30 : flags.warrior ? 22 : 6));
    ctx.stroke();
  }

  if (flags.charge || flags.warrior || flags.enemy) {
    ctx.strokeStyle = flags.enemy ? "rgba(254,202,202,0.64)" : hexToRgba("#fff7ed", flags.charge ? 0.7 : 0.56);
    ctx.lineWidth = flags.charge ? 8 : flags.warrior ? 6 : 4;
    const arcCount = flags.charge ? 2 : 1;
    for (let i = 0; i < arcCount; i += 1) {
      const arcRadius = (flags.charge ? 42 : flags.warrior ? 32 : 24) + i * (flags.charge ? 16 : 11) + progress * 12;
      ctx.beginPath();
      ctx.arc(radius, 0, arcRadius, -0.82, 0.82);
      ctx.stroke();
    }
  }

  if (flags.charge || flags.warrior) {
    ctx.fillStyle = "#fff7ed";
    ctx.strokeStyle = color;
    ctx.lineWidth = flags.charge ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(radius + (flags.charge ? 26 : 18), 0);
    ctx.lineTo(radius - (flags.charge ? 24 : 18), flags.charge ? -34 : -23);
    ctx.lineTo(radius - (flags.charge ? 70 : 48), flags.charge ? -12 : -8);
    ctx.lineTo(radius - (flags.charge ? 70 : 48), flags.charge ? 12 : 8);
    ctx.lineTo(radius - (flags.charge ? 24 : 18), flags.charge ? 34 : 23);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (flags.enemy) {
    ctx.fillStyle = "#fecaca";
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(radius + 20, 0);
    ctx.lineTo(radius - 18, -18);
    ctx.lineTo(radius - 8, 0);
    ctx.lineTo(radius - 18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawPuppetSwapDashEffect(effect, color, progress) {
  if (!hasDashPath(effect)) return;
  const fromX = Number(effect.fromX);
  const fromY = Number(effect.fromY);
  const toX = Number(effect.toX);
  const toY = Number(effect.toY);
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const alpha = 1 - progress;

  ctx.save();
  ctx.lineCap = "round";
  ctx.globalCompositeOperation = "lighter";

  for (let i = -2; i <= 2; i += 1) {
    const offset = i * 7;
    const bend = Math.sin(progress * Math.PI + i) * 22;
    ctx.strokeStyle = hexToRgba(i === 0 ? "#fdf4ff" : color, (i === 0 ? 0.78 : 0.42) * alpha);
    ctx.lineWidth = i === 0 ? 2.8 : 1.8;
    ctx.beginPath();
    ctx.moveTo(fromX + nx * offset, fromY + ny * offset);
    ctx.quadraticCurveTo(
      (fromX + toX) * 0.5 + nx * bend,
      (fromY + toY) * 0.5 + ny * bend,
      toX - nx * offset,
      toY - ny * offset
    );
    ctx.stroke();
  }

  for (const point of [
    { x: fromX, y: fromY, spin: -1 },
    { x: toX, y: toY, spin: 1 }
  ]) {
    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate((effect.seed || 0) + point.spin * progress * Math.PI * 1.4);
    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.66 * alpha);
    ctx.lineWidth = 2.5;
    drawPolygon(0, 0, 16 + progress * 12, 4, Math.PI / 4);
    ctx.stroke();
    ctx.restore();
  }

  drawRadialSparks(toX, toY, 36, "#f5d0fe", 6, progress);
  ctx.restore();
}

function drawDashEffect(effect, color, progress) {
  const radius = effect.radius || 90;
  const style = effect.style || "";
  if (pixiRenderer && (style === "shield_charge" || style === "warrior_dash")) return;
  const enemy = style === "enemy_charge";
  const charge = style === "shield_charge";
  const warrior = style === "warrior_dash";
  const ranger = style === "ranger_dash";
  const blink = style === "mage_blink";
  const cleric = style === "cleric_dash";
  const martial = style === "martial_dash" || style === "martial_rising";
  const assassin = style === "shadow_dash" || style === "shadow_lunge";
  const alchemist = style === "alchemist_dash";
  const puppet = style === "puppet_swap";
  const puppetSummon = style === "puppet_summon_thread";
  if ((puppet || puppetSummon) && hasDashPath(effect)) {
    drawPuppetSwapDashEffect(effect, color, progress);
    return;
  }
  if ((enemy || charge || warrior || ranger || martial || assassin || alchemist) && hasDashPath(effect)) {
    drawProgressiveDashEffect(effect, color, progress, { enemy, charge, warrior, ranger, martial, assassin, alchemist });
    return;
  }
  const width = enemy ? 18 : charge ? 42 : warrior ? 32 : martial ? 18 : assassin ? 14 : cleric ? 18 : blink ? 16 : ranger ? 10 : puppet ? 12 : 12;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.angle || 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "source-over";

  const trail = ctx.createLinearGradient(-radius, 0, radius, 0);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(0.35, hexToRgba(color, enemy ? 0.24 : charge || warrior ? 0.42 : blink ? 0.28 : cleric ? 0.34 : 0.38));
  trail.addColorStop(
    0.78,
    charge || warrior
      ? hexToRgba("#fed7aa", 0.82)
      : martial
        ? hexToRgba("#fff7ed", 0.72)
        : assassin
          ? hexToRgba("#ddd6fe", 0.78)
          : cleric
            ? hexToRgba("#fef3c7", 0.74)
            : blink
              ? hexToRgba("#e9d5ff", 0.78)
              : hexToRgba(color, 0.6)
  );
  trail.addColorStop(1, enemy ? hexToRgba("#fecaca", 0.78) : blink ? hexToRgba("#ffffff", 0.78) : hexToRgba("#ffffff", 0.72));
  ctx.strokeStyle = trail;
  ctx.lineWidth = width;
  ctx.beginPath();
  if (blink) {
    ctx.setLineDash([16, 12]);
  }
  ctx.moveTo(-radius * (blink ? 0.82 : 1), 0);
  ctx.lineTo(radius * (blink ? 0.82 : 1), 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = hexToRgba(color, charge || warrior ? 0.74 : cleric ? 0.5 : 0.58);
  ctx.lineWidth = charge || warrior ? 5 : 3;
  const trailLines = ranger ? 1 : 2;
  for (let i = -trailLines; i <= trailLines; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * (0.94 - progress * 0.2), i * (charge || warrior ? 14 : ranger ? 10 : 13));
    ctx.lineTo(radius * 0.66, i * (charge || warrior ? 9 : ranger ? 5 : 8));
    ctx.stroke();
  }

  if (ranger) {
    ctx.strokeStyle = "#f0fdf4";
    ctx.lineWidth = 2;
    for (const y of [-18, 18]) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.52, y);
      ctx.lineTo(radius * (0.22 + progress * 0.42), y * 0.35);
      ctx.stroke();
    }
  }

  if (blink) {
    ctx.strokeStyle = hexToRgba("#e9d5ff", 0.78);
    ctx.lineWidth = 4;
    for (const x of [-radius * 0.72, radius * 0.72]) {
      ctx.beginPath();
      ctx.arc(x, 0, 24 + progress * 20, 0, Math.PI * 2);
      ctx.stroke();
      drawLightningLine(x - 24, -18, x + 24, 18, "#e9d5ff", 3, effect.seed + progress * 4);
    }
  }

  if (cleric) {
    ctx.strokeStyle = hexToRgba("#fef3c7", 0.84);
    ctx.lineWidth = 3;
    for (const x of [-radius * 0.42, radius * 0.42]) {
      drawHexRing(x, 0, 18 + progress * 18, "#fef3c7", 3);
    }
  }

  if (charge || warrior) {
    ctx.strokeStyle = "rgba(8,8,8,0.34)";
    ctx.lineWidth = charge ? 8 : 6;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-radius * 0.46, i * (charge ? 24 : 18));
      ctx.lineTo(radius * (0.22 + progress * 0.22), i * (charge ? 38 : 28));
      ctx.stroke();
    }

    ctx.strokeStyle = hexToRgba(color, charge ? 0.3 : 0.24);
    ctx.lineWidth = charge ? 30 : 22;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.78, 0);
    ctx.lineTo(radius * (0.44 + progress * 0.18), 0);
    ctx.stroke();

    ctx.fillStyle = hexToRgba(color, 0.18);
    ctx.beginPath();
    ctx.ellipse(radius * 0.72, 0, charge ? 56 : 42, charge ? 42 : 30, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hexToRgba("#fff7ed", charge ? 0.86 : 0.7);
    ctx.lineWidth = charge ? 9 : 6;
    for (let i = 0; i < 3; i += 1) {
      const arcRadius = (charge ? 46 : 34) + i * (charge ? 18 : 13) + progress * 18;
      ctx.beginPath();
      ctx.arc(radius * (0.72 + i * 0.08), 0, arcRadius, -0.86, 0.86);
      ctx.stroke();
    }

    ctx.strokeStyle = hexToRgba("#facc15", charge ? 0.74 : 0.52);
    ctx.lineWidth = charge ? 5 : 3;
    for (const y of [charge ? -54 : -38, charge ? 54 : 38]) {
      ctx.beginPath();
      ctx.moveTo(radius * 0.28, y);
      ctx.lineTo(radius * (0.86 + progress * 0.08), y * 0.54);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff7ed";
    ctx.strokeStyle = color;
    ctx.lineWidth = charge ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(radius * (charge ? 0.96 : 0.8), 0);
    ctx.lineTo(radius * 0.62, charge ? -38 : -26);
    ctx.lineTo(radius * 0.18, charge ? -14 : -9);
    ctx.lineTo(radius * 0.18, charge ? 14 : 9);
    ctx.lineTo(radius * 0.62, charge ? 38 : 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawMeteorHazard(x, y, hazard) {
  const now = performance.now();
  const radius = hazard.radius || 150;
  const armTimeMax = Math.max(0.1, Number(hazard.armTimeMax || 1));
  const impact = clamp01(1 - Number(hazard.timer || 0) / armTimeMax);
  const eased = 1 - Math.pow(1 - impact, 2.4);
  const pulse = 1 + Math.sin(now / 92) * 0.035;
  const targetRadius = radius * (0.92 - impact * 0.24);

  const warning = ctx.createRadialGradient(x, y, radius * 0.08, x, y, radius);
  warning.addColorStop(0, `rgba(251,191,36,${0.16 + impact * 0.14})`);
  warning.addColorStop(0.56, `rgba(248,113,113,${0.11 + impact * 0.08})`);
  warning.addColorStop(1, "rgba(248,113,113,0)");
  ctx.fillStyle = warning;
  ctx.beginPath();
  ctx.arc(x, y, radius * pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(248,113,113,0.95)";
  ctx.lineWidth = 5;
  ctx.setLineDash([18, 8]);
  ctx.beginPath();
  ctx.arc(x, y, targetRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(254,226,226,0.84)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - targetRadius, y);
  ctx.lineTo(x - radius * 0.18, y);
  ctx.moveTo(x + radius * 0.18, y);
  ctx.lineTo(x + targetRadius, y);
  ctx.moveTo(x, y - targetRadius);
  ctx.lineTo(x, y - radius * 0.18);
  ctx.moveTo(x, y + radius * 0.18);
  ctx.lineTo(x, y + targetRadius);
  ctx.stroke();

  const startX = x - radius * 1.62;
  const startY = y - radius * 4.1;
  const meteorX = startX + radius * 1.42 * eased;
  const meteorY = startY + radius * 3.82 * eased;
  const shadowRadius = radius * (0.12 + impact * 0.18);
  ctx.fillStyle = `rgba(0,0,0,${0.2 + impact * 0.24})`;
  ctx.beginPath();
  ctx.ellipse(x, y, shadowRadius * 1.55, shadowRadius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  const trail = ctx.createLinearGradient(startX, startY, meteorX, meteorY);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(0.3, "rgba(248,113,113,0.36)");
  trail.addColorStop(0.68, "rgba(251,146,60,0.9)");
  trail.addColorStop(1, "#fff7ed");
  ctx.strokeStyle = trail;
  ctx.lineCap = "round";
  ctx.lineWidth = 20 + impact * 10;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(meteorX, meteorY);
  ctx.stroke();

  ctx.fillStyle = "#7c2d12";
  ctx.strokeStyle = "#fed7aa";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(meteorX, meteorY, 13 + impact * 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = `rgba(251,191,36,${0.22 + impact * 0.34})`;
  ctx.beginPath();
  ctx.arc(meteorX - radius * 0.03, meteorY - radius * 0.03, 5 + impact * 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawBurstRingEffect(effect, color, progress) {
  if (effect.style === "meteor_impact") {
    drawMeteorImpactEffect(effect, color, progress);
    return;
  }
  if (effect.style === "thread_snap") {
    drawThreadSnapEffect(effect, color, progress);
    return;
  }
  if (
    effect.style === "alchemy_reaction" ||
    effect.style === "alchemy_bomb" ||
    effect.style === "alchemy_bomb_small" ||
    effect.style === "alchemy_splash"
  ) {
    drawAlchemyBurstEffect(effect, color, progress);
    return;
  }
  if (effect.style === "shock_mine") {
    drawShockMineBurstEffect(effect, color, progress);
    return;
  }

  const radius = (effect.radius || 70) * (0.22 + progress * 0.86);
  ctx.strokeStyle = effect.kind === "death" ? hexToRgba(color, 0.92) : color;
  ctx.lineWidth = effect.kind === "death" ? 5 : 7;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (effect.kind === "explosion") {
    ctx.fillStyle = hexToRgba(color, 0.16);
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius * 0.82, 0, Math.PI * 2);
    ctx.fill();
    drawRadialSparks(effect.x, effect.y, radius, color, 10, progress);
  }
}

function drawThreadSnapEffect(effect, color, progress) {
  const radius = effect.radius || 96;
  const alpha = 1 - progress;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate((effect.seed || 0) + progress * 0.5);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.fillStyle = hexToRgba("#11110f", 0.22 * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.18 + progress * 0.24), 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 7; i += 1) {
    const angle = (Math.PI * 2 * i) / 7;
    const inner = radius * (0.12 + progress * 0.12);
    const outer = radius * (0.48 + progress * 0.48 + (i % 2) * 0.08);
    ctx.strokeStyle = hexToRgba(i % 2 ? "#fdf4ff" : color, (0.78 - i * 0.045) * alpha);
    ctx.lineWidth = i % 2 ? 2.2 : 3.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba("#f5d0fe", 0.7 * alpha);
  ctx.lineWidth = 2.2;
  for (const angle of [-0.7, 0, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.56, Math.sin(angle) * radius * 0.16);
    ctx.quadraticCurveTo(0, Math.sin(angle + progress) * radius * 0.18, radius * 0.56, -Math.sin(angle) * radius * 0.16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlchemyBurstEffect(effect, color, progress) {
  const radius = effect.radius || 84;
  const alpha = 1 - progress;
  const small = effect.style === "alchemy_bomb_small";
  const fire = color === "#f97316" || effect.style === "alchemy_bomb";
  const core = fire ? "#fed7aa" : "#d9f99d";
  const outer = fire ? "#f97316" : color;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius * (0.9 + progress * 0.28));
  gradient.addColorStop(0, hexToRgba("#fff7ed", 0.42 * alpha));
  gradient.addColorStop(0.34, hexToRgba(core, 0.28 * alpha));
  gradient.addColorStop(1, hexToRgba(outer, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.5 + progress * 0.55), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(outer, (small ? 0.58 : 0.72) * alpha);
  ctx.lineWidth = small ? 4 : 7;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.28 + progress * 0.7), 0, Math.PI * 2);
  ctx.stroke();

  const bubbles = small ? 7 : 12;
  for (let i = 0; i < bubbles; i += 1) {
    const angle = (Math.PI * 2 * i) / bubbles + (effect.seed || 0);
    const dist = radius * (0.18 + progress * (0.62 + (i % 3) * 0.08));
    const bubbleRadius = (small ? 3 : 4.5) + (i % 3);
    ctx.fillStyle = hexToRgba(i % 2 ? core : outer, (0.68 - progress * 0.28) * alpha);
    ctx.beginPath();
    ctx.arc(effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, bubbleRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShockMineBurstEffect(effect, color, progress) {
  const radius = effect.radius || 118;
  const alpha = 1 - progress;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba("#bfdbfe", 0.76 * alpha);
  ctx.lineWidth = 5;
  drawHexRing(effect.x, effect.y, radius * (0.22 + progress * 0.72), "#bfdbfe", 5);
  drawHexRing(effect.x, effect.y, radius * (0.34 + progress * 0.52), color, 3);
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + progress * 0.6;
    const inner = radius * 0.16;
    const outer = radius * (0.46 + progress * 0.5);
    drawLightningLine(
      effect.x + Math.cos(angle) * inner,
      effect.y + Math.sin(angle) * inner,
      effect.x + Math.cos(angle) * outer,
      effect.y + Math.sin(angle) * outer,
      i % 2 ? "#e0f2fe" : color,
      3,
      (effect.seed || 0) + i + progress * 3
    );
  }
  ctx.restore();
}

function drawMeteorImpactEffect(effect, color, progress) {
  const baseRadius = effect.radius || 150;
  const shockRadius = baseRadius * (0.28 + progress * 0.92);
  const flash = 1 - progress;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const core = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, baseRadius * 0.5);
  core.addColorStop(0, `rgba(255,247,237,${0.8 * flash})`);
  core.addColorStop(0.34, `rgba(251,191,36,${0.58 * flash + 0.12})`);
  core.addColorStop(1, "rgba(194,65,12,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, baseRadius * (0.34 + progress * 0.16), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(254,215,170,${0.92 * flash + 0.12})`;
  ctx.lineWidth = 12 - progress * 7;
  ctx.beginPath();
  ctx.ellipse(effect.x, effect.y, shockRadius * 1.18, shockRadius * 0.56, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(251,146,60,0.82)";
  ctx.lineWidth = 4;
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + (effect.seed || 0);
    const inner = baseRadius * (0.16 + progress * 0.12);
    const outer = baseRadius * (0.42 + progress * (0.38 + (i % 3) * 0.08));
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner * 0.72);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer * 0.72);
    ctx.stroke();
  }

  ctx.fillStyle = `rgba(254,215,170,${0.8 * flash})`;
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12 + progress * 0.7;
    const dist = baseRadius * (0.24 + progress * (0.58 + (i % 4) * 0.04));
    const rockX = effect.x + Math.cos(angle) * dist;
    const rockY = effect.y + Math.sin(angle) * dist * 0.7 - progress * baseRadius * 0.12;
    ctx.save();
    ctx.translate(rockX, rockY);
    ctx.rotate(angle + progress);
    drawPolygon(0, 0, 4 + (i % 3), 5, angle);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function drawShieldEffect(effect, color, progress) {
  if (effect.style === "martial_focus") {
    drawMartialFocusShieldEffect(effect, color, progress);
    return;
  }
  if (effect.style === "alchemist_elixir") {
    drawAlchemistElixirEffect(effect, color, progress);
    return;
  }
  if (effect.style === "turret_deploy" || effect.style === "mini_turret") {
    drawTurretDeployEffect(effect, color, progress);
    return;
  }

  const radius = (effect.radius || 48) * (1 + progress * 0.18);
  drawHexRing(effect.x, effect.y, radius, color, 4);
  ctx.strokeStyle = "rgba(255,255,255,0.46)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * 0.66, -Math.PI * 0.18, Math.PI * 1.18);
  ctx.stroke();
}

function drawMartialFocusShieldEffect(effect, color, progress) {
  const radius = effect.radius || 82;
  const alpha = 1 - progress * 0.45;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.64 * alpha);
  ctx.lineWidth = 5;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, radius * (0.28 + i * 0.18 + progress * 0.12), progress * Math.PI + i, progress * Math.PI + i + Math.PI * 1.35);
    ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba("#fff7ed", 0.78 * alpha);
  ctx.lineWidth = 3;
  for (const angle of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.1, Math.sin(angle) * radius * 0.1);
    ctx.lineTo(Math.cos(angle) * radius * (0.56 + progress * 0.1), Math.sin(angle) * radius * (0.56 + progress * 0.1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlchemistElixirEffect(effect, color, progress) {
  const radius = effect.radius || 74;
  const alpha = 1 - progress * 0.35;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const mist = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius);
  mist.addColorStop(0, "rgba(240,253,244,0.26)");
  mist.addColorStop(0.48, hexToRgba(color, 0.14 * alpha));
  mist.addColorStop(1, "rgba(132,204,22,0)");
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.52 + progress * 0.28), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#bbf7d0", 0.72 * alpha);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.42 + progress * 0.36), 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 + progress * 0.9;
    const x = effect.x + Math.cos(angle) * radius * (0.24 + progress * 0.24);
    const y = effect.y + Math.sin(angle) * radius * (0.24 + progress * 0.24);
    drawHealingPlus(x, y, 6, "#dcfce7", 0.68 * alpha);
  }
  ctx.restore();
}

function drawTurretDeployEffect(effect, color, progress) {
  const radius = effect.radius || 68;
  const alpha = 1 - progress * 0.4;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.72 * alpha);
  ctx.lineWidth = 3;
  drawHexRing(0, 0, radius * (0.54 + progress * 0.24), color, 3);
  drawHexRing(0, 0, radius * (0.3 + progress * 0.16), "#bfdbfe", 2);

  ctx.strokeStyle = hexToRgba("#e0f2fe", 0.78 * alpha);
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18);
    ctx.lineTo(Math.cos(angle) * radius * (0.6 + progress * 0.18), Math.sin(angle) * radius * (0.6 + progress * 0.18));
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba("#0f172a", 0.54 * alpha);
  roundRect(-14, -10, 28, 20, 4);
  ctx.fill();
  ctx.strokeStyle = "#bfdbfe";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -24 - progress * 8);
  ctx.moveTo(-12, 8);
  ctx.lineTo(-20, 18);
  ctx.moveTo(12, 8);
  ctx.lineTo(20, 18);
  ctx.stroke();
  ctx.restore();
}

function drawCleanseEffect(effect, color, progress) {
  const radius = effect.radius || 54;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.62 + progress * 0.35), 0, Math.PI * 2);
  ctx.stroke();
  drawRadialSparks(effect.x, effect.y, radius * 0.78, "#fef9c3", 8, progress);
}

function drawReviveEffect(effect, color, progress) {
  const radius = effect.radius || 70;
  const beamHeight = 120 * (1 - progress * 0.25);
  ctx.fillStyle = hexToRgba(color, 0.14);
  ctx.fillRect(effect.x - 18, effect.y - beamHeight, 36, beamHeight + 28);
  ctx.strokeStyle = "#fef3c7";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(effect.x - 20, effect.y - 42);
  ctx.lineTo(effect.x + 20, effect.y - 42);
  ctx.moveTo(effect.x, effect.y - 64);
  ctx.lineTo(effect.x, effect.y - 18);
  ctx.stroke();
  drawHexRing(effect.x, effect.y, radius * (0.76 + progress * 0.22), color, 3);
}

function drawFrostEffect(effect, color, progress) {
  if (effect.style === "frost_lock") {
    drawFreezeLockEffect(effect, color, progress);
    return;
  }
  if (effect.style === "frost_wave") {
    drawSnapFreezeWave(effect, color, progress);
    return;
  }

  const baseRadius = effect.radius || 120;
  const radius = baseRadius * (0.28 + progress * 0.72);
  const crack = 1 - progress;
  const wave = effect.style === "frost_wave";
  const fill = ctx.createRadialGradient(effect.x, effect.y, radius * 0.08, effect.x, effect.y, radius);
  fill.addColorStop(0, wave ? "rgba(240,249,255,0.28)" : "rgba(219,234,254,0.18)");
  fill.addColorStop(0.48, "rgba(147,197,253,0.14)");
  fill.addColorStop(1, "rgba(147,197,253,0)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = wave ? "rgba(219,234,254,0.96)" : hexToRgba(color, 0.86);
  ctx.lineWidth = wave ? 6 : 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.9 + crack * 0.08), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(240,249,255,0.92)";
  ctx.lineWidth = wave ? 3 : 2;
  ctx.lineCap = "round";
  for (let i = 0; i < 14; i += 1) {
    const angle = (Math.PI * 2 * i) / 14 + progress * 0.22 + (effect.seed || 0);
    const inner = radius * (wave ? 0.16 : 0.26);
    const outer = radius * (0.86 + Math.sin(i * 1.7 + progress * 4) * 0.06);
    const mid = radius * 0.58;
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
    ctx.stroke();

    if (wave && i % 2 === 0) {
      const branch = angle + 0.48;
      const bx = effect.x + Math.cos(angle) * mid;
      const by = effect.y + Math.sin(angle) * mid;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(branch) * radius * 0.16, by + Math.sin(branch) * radius * 0.16);
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle - 0.48) * radius * 0.16, by + Math.sin(angle - 0.48) * radius * 0.16);
      ctx.stroke();
    }
  }

  if (wave) {
    ctx.strokeStyle = "rgba(191,219,254,0.72)";
    ctx.lineWidth = 2;
    drawHexRing(effect.x, effect.y, radius * 0.42, "#bfdbfe", 2);
    drawHexRing(effect.x, effect.y, radius * 0.66, "#93c5fd", 2);

    ctx.fillStyle = `rgba(219,234,254,${0.62 * crack})`;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10 - progress * 0.7;
      const shardDistance = radius * (0.24 + progress * 0.7);
      const shardX = effect.x + Math.cos(angle) * shardDistance;
      const shardY = effect.y + Math.sin(angle) * shardDistance;
      ctx.save();
      ctx.translate(shardX, shardY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(radius * 0.035, 0);
      ctx.lineTo(-radius * 0.022, -radius * 0.075);
      ctx.lineTo(-radius * 0.05, 0);
      ctx.lineTo(-radius * 0.022, radius * 0.075);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawSnapFreezeWave(effect, color, progress) {
  const radius = effect.radius || 160;
  const flash = 1 - progress;
  const snap = progress < 0.18 ? progress / 0.18 : 1;
  const plateRadius = radius * (0.94 + Math.sin(progress * Math.PI) * 0.04);
  const flashAlpha = Math.max(0, 1 - progress * 3.8);

  const fill = ctx.createRadialGradient(effect.x, effect.y, radius * 0.08, effect.x, effect.y, plateRadius);
  fill.addColorStop(0, `rgba(240,249,255,${0.34 * flash + 0.08})`);
  fill.addColorStop(0.5, `rgba(147,197,253,${0.22 * flash + 0.06})`);
  fill.addColorStop(1, "rgba(147,197,253,0)");
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, plateRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(240,249,255,${0.96 * flash + 0.18})`;
  ctx.lineWidth = 9 - progress * 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, plateRadius * (0.96 - progress * 0.06), 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha *= 0.78 * flash + 0.16;
  ctx.strokeStyle = "#dbeafe";
  ctx.lineWidth = 3;
  for (let i = 0; i < 18; i += 1) {
    const angle = (Math.PI * 2 * i) / 18 + (effect.seed || 0) * 0.18;
    const inner = plateRadius * (0.1 + (i % 3) * 0.035);
    const outer = plateRadius * (0.72 + ((i * 17) % 9) * 0.025);
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
    ctx.stroke();

    const forkBase = outer * 0.56;
    const bx = effect.x + Math.cos(angle) * forkBase;
    const by = effect.y + Math.sin(angle) * forkBase;
    for (const side of [-1, 1]) {
      const branch = angle + side * 0.42;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(branch) * plateRadius * 0.13, by + Math.sin(branch) * plateRadius * 0.13);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "#bfdbfe";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    drawPolygon(effect.x, effect.y, plateRadius * (0.34 + i * 0.18), 6, Math.PI / 6 + i * 0.18);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = `rgba(240,249,255,${0.72 * flash})`;
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + progress * 0.65;
    const burst = plateRadius * (0.36 + snap * 0.5 + ((i * 13) % 5) * 0.028);
    const shardX = effect.x + Math.cos(angle) * burst;
    const shardY = effect.y + Math.sin(angle) * burst;
    ctx.save();
    ctx.translate(shardX, shardY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(11 + flash * 8, 0);
    ctx.lineTo(-5, -5 - flash * 5);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-5, 5 + flash * 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (flashAlpha > 0) {
    ctx.strokeStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius * (0.9 + snap * 0.08), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFreezeLockEffect(effect, color, progress) {
  const radius = (effect.radius || 52) * (0.92 + progress * 0.12);
  const crack = 1 - progress;
  ctx.fillStyle = "rgba(147,197,253,0.24)";
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.82 + progress * 0.08), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(219,234,254,0.92)";
  ctx.lineWidth = 4;
  drawPolygon(effect.x, effect.y, radius, 6, Math.PI / 6 + progress * 0.2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(248,250,252,0.86)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 + (effect.seed || 0);
    const inner = radius * 0.22;
    const outer = radius * (0.72 + crack * 0.24);
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
    ctx.stroke();
  }

  ctx.fillStyle = `rgba(219,234,254,${0.44 * crack})`;
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 + progress * 1.2;
    const shardX = effect.x + Math.cos(angle) * radius * (0.54 + progress * 0.3);
    const shardY = effect.y + Math.sin(angle) * radius * (0.54 + progress * 0.3);
    drawPolygon(shardX, shardY, 4 + i % 2, 4, angle);
    ctx.fill();
  }
}

function drawPoisonEffect(effect, color, progress) {
  const radius = (effect.radius || 34) * (0.78 + progress * 0.22);
  ctx.fillStyle = "rgba(132, 204, 22, 0.12)";
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#bef264";
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4 + progress * 1.4;
    ctx.beginPath();
    ctx.arc(effect.x + Math.cos(angle) * radius * 0.48, effect.y + Math.sin(angle) * radius * 0.48, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBossPhaseSurgeEffect(x, y, radius, color, progress) {
  const now = performance.now();
  const active = clamp01(progress);
  const burst = 1 - active;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const glow = ctx.createRadialGradient(x, y, radius * 0.12, x, y, radius * (1.8 - active * 0.35));
  glow.addColorStop(0, hexToRgba("#fee2e2", 0.32 * burst));
  glow.addColorStop(0.42, hexToRgba(color, 0.22 * burst));
  glow.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * (1.65 - active * 0.28), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#fee2e2", 0.74 * burst);
  ctx.lineWidth = Math.max(4, radius * 0.045);
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x, y, radius * (0.34 + i * 0.26 + burst * 0.3), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(color, 0.68 * burst);
  ctx.lineWidth = Math.max(3, radius * 0.034);
  const shards = 14;
  for (let i = 0; i < shards; i += 1) {
    const angle = (Math.PI * 2 * i) / shards + now / 950;
    const inner = radius * (0.22 + burst * 0.12);
    const outer = radius * (0.9 + burst * 0.42);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWarningEffect(effect, color, progress) {
  const radius = effect.radius || 64;
  if (effect.style === "sniper_lock") {
    return;
  }

  if (effect.style === "thread_mark") {
    drawThreadMarkWarning(effect, color, progress);
    return;
  }

  if (effect.style === "smoke_bomb") {
    drawSmokeBombWarning(effect, color, progress);
    return;
  }

  if (effect.style === "brute_swing") {
    drawBruteSwingTelegraph(effect.x, effect.y, radius, effect.angle || 0, color, progress);
    return;
  }

  if (effect.style === "stalker_stab") {
    drawStalkerStabTelegraph(effect.x, effect.y, radius, effect.angle || 0, effect.arc || 0.74, color, progress);
    return;
  }

  if (effect.style === "stalker_shuriken") {
    drawStalkerShurikenTelegraph(effect.x, effect.y, radius, effect.angle || 0, effect.spread || 0.34, color, progress);
    return;
  }

  if (effect.style === "arrow_rain") {
    drawDangerTelegraph(effect.x, effect.y, radius, color, progress, {
      spokes: 12,
      stripeAlpha: 0.2,
      coreColor: "#ecfccb"
    });
    return;
  }

  if (effect.style === "thread_cage") {
    const alpha = 1 - progress * 0.35;
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(progress * 0.45);
    ctx.strokeStyle = hexToRgba(color, 0.62 * alpha);
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 3; i += 1) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / 3;
      const b = -Math.PI / 2 + (Math.PI * 2 * ((i + 1) % 3)) / 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
      ctx.lineTo(Math.cos(b) * radius, Math.sin(b) * radius);
      ctx.stroke();
    }
    ctx.strokeStyle = hexToRgba("#fdf4ff", 0.72 * alpha);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 6; i += 1) {
      const a = (Math.PI * 2 * i) / 6 + progress * 0.6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.18, Math.sin(a) * radius * 0.18);
      ctx.lineTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (effect.style === "boss_beam") {
    drawDangerTelegraph(effect.x, effect.y, radius, color, progress, {
      spokes: 14,
      stripeAlpha: 0.2,
      coreColor: "#fee2e2"
    });
    return;
  }

  if (effect.style === "boss_ritual") {
    drawDangerTelegraph(effect.x, effect.y, radius, color, progress, {
      spokes: 16,
      stripeAlpha: 0.18,
      coreColor: "#ecfccb"
    });
    return;
  }

  if (effect.style === "boss_phase") {
    drawBossPhaseSurgeEffect(effect.x, effect.y, radius, color, progress);
    return;
  }

  if (effect.style === "mortar_zone" || effect.style === "boss_blast") {
    drawDangerTelegraph(effect.x, effect.y, radius, color, progress, {
      spokes: effect.style === "boss_blast" ? 10 : 8,
      stripeAlpha: 0.34,
      coreColor: effect.style === "boss_blast" ? "#fbbf24" : "#fee2e2"
    });
    return;
  }

  if (effect.style === "bomber_explode") {
    drawDangerTelegraph(effect.x, effect.y, radius, color, progress, {
      spokes: 10,
      stripeAlpha: 0.42,
      coreColor: "#fef2f2"
    });
    return;
  }

  if (effect.style === "guardian_barrier") {
    ctx.fillStyle = hexToRgba(color, 0.07);
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius * (0.92 + progress * 0.03), 0, Math.PI * 2);
    ctx.fill();
    drawHexRing(effect.x, effect.y, radius * (0.72 + progress * 0.16), color, 4);
    drawHexRing(effect.x, effect.y, radius * (0.46 + progress * 0.1), "#e5e7eb", 2);
    drawRadialSparks(effect.x, effect.y, radius * 0.64, "#cbd5e1", 8, progress);
    return;
  }

  if (effect.style === "shaman_heal") {
    drawShamanHealAura(effect.x, effect.y, radius, color, progress, { channel: true, alpha: 0.82 });
    return;
  }

  if (effect.style === "taunt") {
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, radius * (0.34 + i * 0.22 + progress * 0.08), 0, Math.PI * 2);
      ctx.stroke();
    }
    drawRadialSparks(effect.x, effect.y, radius * 0.72, color, 12, progress);
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.88 + progress * 0.08), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawThreadMarkWarning(effect, color, progress) {
  const radius = effect.radius || 54;
  const alpha = 1 - progress * 0.28;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate((effect.seed || 0) + progress * 0.7);
  ctx.globalCompositeOperation = "lighter";

  ctx.strokeStyle = hexToRgba(color, 0.68 * alpha);
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 3; i += 1) {
    drawPolygon(0, 0, radius * (0.28 + i * 0.13 + progress * 0.08), 3, -Math.PI / 2 + i * 0.18);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba("#fdf4ff", 0.72 * alpha);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.16, Math.sin(angle) * radius * 0.16);
    ctx.lineTo(Math.cos(angle) * radius * 0.78, Math.sin(angle) * radius * 0.78);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSmokeBombWarning(effect, color, progress) {
  const radius = effect.radius || 120;
  const alpha = 1 - progress * 0.24;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const smoke = ctx.createRadialGradient(effect.x, effect.y, radius * 0.05, effect.x, effect.y, radius);
  smoke.addColorStop(0, `rgba(17,17,15,${0.26 * alpha})`);
  smoke.addColorStop(0.48, hexToRgba(color, 0.13 * alpha));
  smoke.addColorStop(1, "rgba(17,17,15,0)");
  ctx.fillStyle = smoke;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.56 + progress * 0.18), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#ddd6fe", 0.52 * alpha);
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 + progress * 0.7;
    ctx.beginPath();
    ctx.arc(
      effect.x + Math.cos(angle) * radius * 0.18,
      effect.y + Math.sin(angle) * radius * 0.18,
      radius * (0.18 + (i % 2) * 0.05 + progress * 0.12),
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawHealingPlus(x, y, size, color, alpha = 0.85) {
  ctx.save();
  ctx.strokeStyle = hexToRgba(color, alpha);
  ctx.lineWidth = Math.max(2, size * 0.24);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}

function drawShamanHealAura(x, y, radius, color, progress, options = {}) {
  const alpha = options.alpha ?? 1;
  const channel = Boolean(options.channel);
  const wave = channel ? 0.86 + Math.sin(performance.now() / 160) * 0.04 : 0.66 + progress * 0.36;
  const inner = radius * (channel ? 0.18 : 0.08);
  const outer = radius * (channel ? 0.98 : 1.08);
  const gradient = ctx.createRadialGradient(x, y, inner, x, y, outer);
  gradient.addColorStop(0, `rgba(240,253,244,${0.16 * alpha})`);
  gradient.addColorStop(0.42, `rgba(134,239,172,${0.09 * alpha})`);
  gradient.addColorStop(0.78, `rgba(250,204,21,${0.035 * alpha})`);
  gradient.addColorStop(1, "rgba(134,239,172,0)");

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, outer, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#dcfce7", (channel ? 0.42 : 0.66) * alpha);
  ctx.lineWidth = channel ? 3 : 5;
  ctx.beginPath();
  ctx.arc(x, y, radius * (0.44 + progress * 0.1), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, (channel ? 0.5 : 0.78) * alpha);
  ctx.lineWidth = channel ? 4 : 6;
  ctx.beginPath();
  ctx.arc(x, y, radius * wave, 0, Math.PI * 2);
  ctx.stroke();

  const plusCount = channel ? 5 : 8;
  for (let i = 0; i < plusCount; i += 1) {
    const seed = pseudoRandom((i + 1) * 8.41, (radius || 1) * 0.07);
    const angle = (Math.PI * 2 * i) / plusCount + progress * (channel ? 0.9 : 1.8);
    const ring = radius * (0.26 + (i % 3) * 0.17 + seed * 0.08);
    const bob = Math.sin(performance.now() / 180 + i) * 5;
    const size = (channel ? 4 : 6) + seed * 4;
    drawHealingPlus(x + Math.cos(angle) * ring, y + Math.sin(angle) * ring + bob, size, i % 2 ? "#bbf7d0" : "#fef3c7", (0.34 + progress * 0.22) * alpha);
  }

  drawRadialSparks(x, y, radius * 0.58, "#dcfce7", channel ? 5 : 9, progress);
  ctx.restore();
}

function drawBruteSwingTelegraph(x, y, radius, angle, color, progress) {
  const reach = Math.max(70, radius);
  const sweep = Math.PI * 0.82;
  const pulse = 0.65 + progress * 0.35;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const warning = ctx.createRadialGradient(16, 0, reach * 0.08, 16, 0, reach);
  warning.addColorStop(0, hexToRgba(color, 0.04));
  warning.addColorStop(0.58, hexToRgba(color, 0.16 + progress * 0.1));
  warning.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = warning;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, reach * pulse, -sweep * 0.5, sweep * 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = hexToRgba("#fee2e2", 0.44 + progress * 0.28);
  ctx.lineWidth = 3 + progress * 2;
  ctx.beginPath();
  ctx.arc(0, 0, reach * (0.72 + progress * 0.22), -sweep * 0.48, sweep * 0.48);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.3 + progress * 0.38);
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    const laneAngle = i * sweep * 0.24;
    ctx.beginPath();
    ctx.moveTo(Math.cos(laneAngle) * reach * 0.24, Math.sin(laneAngle) * reach * 0.24);
    ctx.lineTo(Math.cos(laneAngle) * reach * (0.82 + progress * 0.1), Math.sin(laneAngle) * reach * (0.82 + progress * 0.1));
    ctx.stroke();
  }

  ctx.restore();
}

function drawMeteorEffect(effect, color, progress) {
  const radius = effect.radius || 150;
  const impact = clamp01(progress);
  const fall = 1 - Math.pow(1 - impact, 2.2);
  const startX = effect.x - radius * 1.45;
  const startY = effect.y - radius * 3.75;
  const rockX = startX + radius * 1.22 * fall;
  const rockY = startY + radius * 3.38 * fall;

  const warning = ctx.createRadialGradient(effect.x, effect.y, radius * 0.06, effect.x, effect.y, radius);
  warning.addColorStop(0, "rgba(251,191,36,0.18)");
  warning.addColorStop(0.62, "rgba(248,113,113,0.12)");
  warning.addColorStop(1, "rgba(248,113,113,0)");
  ctx.fillStyle = warning;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.72 + progress * 0.18), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(248,113,113,0.92)";
  ctx.lineWidth = 5;
  ctx.setLineDash([14, 8]);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.78 - progress * 0.18), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const trail = ctx.createLinearGradient(startX, startY, rockX, rockY);
  trail.addColorStop(0, "rgba(255,255,255,0)");
  trail.addColorStop(0.36, "rgba(251,146,60,0.42)");
  trail.addColorStop(0.72, "rgba(251,191,36,0.9)");
  trail.addColorStop(1, "#fff7ed");
  ctx.strokeStyle = trail;
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(rockX, rockY);
  ctx.stroke();

  ctx.strokeStyle = "rgba(248,113,113,0.66)";
  ctx.lineWidth = 4;
  for (const offset of [-0.13, 0.13]) {
    ctx.beginPath();
    ctx.moveTo(startX + radius * offset, startY - radius * 0.04);
    ctx.lineTo(rockX + radius * offset * 0.42, rockY + radius * 0.04);
    ctx.stroke();
  }

  ctx.fillStyle = "#7c2d12";
  ctx.strokeStyle = "#fed7aa";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(rockX, rockY, 14 + progress * 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = `rgba(251,191,36,${0.24 + progress * 0.28})`;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.12 + progress * 0.08), 0, Math.PI * 2);
  ctx.fill();
}

function drawTrapEffect(effect, color, progress) {
  if (effect.style === "shock_mine") {
    drawShockMineTrapEffect(effect, color, progress);
    return;
  }
  if (effect.style === "alchemy_acid" || effect.style === "alchemy_fire") {
    drawAlchemyPoolCastEffect(effect, color, progress);
    return;
  }

  const radius = effect.radius || 100;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.72 + progress * 0.12), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#bbf7d0";
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * radius * 0.18, effect.y + Math.sin(angle) * radius * 0.18);
    ctx.lineTo(effect.x + Math.cos(angle) * radius * 0.82, effect.y + Math.sin(angle) * radius * 0.82);
    ctx.stroke();
  }
}

function drawShockMineTrapEffect(effect, color, progress) {
  const radius = effect.radius || 92;
  const alpha = 1 - progress * 0.3;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate((effect.seed || 0) + progress * 0.2);

  ctx.fillStyle = hexToRgba(color, 0.08 * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.52 + progress * 0.16), 0, Math.PI * 2);
  ctx.fill();

  drawHexRing(0, 0, radius * (0.44 + progress * 0.12), color, 3);
  drawHexRing(0, 0, radius * (0.24 + progress * 0.08), "#bfdbfe", 2);

  ctx.strokeStyle = hexToRgba("#e0f2fe", 0.74 * alpha);
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.18, Math.sin(angle) * radius * 0.18);
    ctx.lineTo(Math.cos(angle) * radius * (0.64 + progress * 0.1), Math.sin(angle) * radius * (0.64 + progress * 0.1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawAlchemyPoolCastEffect(effect, color, progress) {
  const radius = effect.radius || 110;
  const fire = effect.style === "alchemy_fire";
  const alpha = 1 - progress * 0.28;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const fill = ctx.createRadialGradient(effect.x, effect.y, radius * 0.06, effect.x, effect.y, radius);
  fill.addColorStop(0, fire ? "rgba(254,215,170,0.22)" : "rgba(217,249,157,0.22)");
  fill.addColorStop(0.62, hexToRgba(color, 0.12 * alpha));
  fill.addColorStop(1, hexToRgba(color, 0));
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.54 + progress * 0.18), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(fire ? "#fed7aa" : "#d9f99d", 0.72 * alpha);
  ctx.lineWidth = fire ? 5 : 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.42 + progress * 0.28), 0, Math.PI * 2);
  ctx.stroke();

  const blobs = fire ? 9 : 12;
  for (let i = 0; i < blobs; i += 1) {
    const angle = (Math.PI * 2 * i) / blobs + (effect.seed || 0);
    const dist = radius * (0.16 + progress * 0.34 + (i % 3) * 0.045);
    ctx.fillStyle = hexToRgba(i % 2 ? color : fire ? "#fef3c7" : "#bbf7d0", 0.54 * alpha);
    ctx.beginPath();
    ctx.arc(effect.x + Math.cos(angle) * dist, effect.y + Math.sin(angle) * dist, fire ? 4.4 : 3.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawArrowRainLaunchEffect(effect, color, progress) {
  const fromX = Number.isFinite(effect.fromX) ? effect.fromX : effect.x;
  const fromY = Number.isFinite(effect.fromY) ? effect.fromY : effect.y;
  const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
  const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const launch = clamp01(progress / 0.62);
  const rain = clamp01((progress - 0.46) / 0.54);
  const arcHeight = Math.min(240, Math.max(110, dist * 0.24));
  const controlX = (fromX + toX) * 0.5;
  const controlY = Math.min(fromY, toY) - arcHeight;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let i = -3; i <= 3; i += 1) {
    const offset = i * 9;
    const t = clamp01(launch - Math.abs(i) * 0.045);
    const one = 1 - t;
    const x = one * one * (fromX + nx * offset) + 2 * one * t * (controlX + nx * offset * 0.35) + t * t * (toX + nx * offset * 0.22);
    const y = one * one * (fromY + ny * offset) + 2 * one * t * (controlY + ny * offset * 0.35) + t * t * (toY + ny * offset * 0.22);
    const tx = 2 * one * (controlX - fromX) + 2 * t * (toX - controlX);
    const ty = 2 * one * (controlY - fromY) + 2 * t * (toY - controlY);
    const angle = Math.atan2(ty, tx);
    const alpha = 0.28 + t * 0.58;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = hexToRgba(i === 0 ? "#ecfccb" : color, alpha);
    ctx.lineWidth = i === 0 ? 3.2 : 2.1;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(18, 0);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba("#f8fafc", alpha * 0.82);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(6, -5);
    ctx.moveTo(18, 0);
    ctx.lineTo(6, 5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = hexToRgba(color, 0.24 * (1 - rain));
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo(controlX, controlY, toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (rain > 0) {
    const radius = effect.radius || 150;
    ctx.beginPath();
    ctx.arc(toX, toY, radius * 0.92, 0, Math.PI * 2);
    ctx.clip();
    for (let i = 0; i < 16; i += 1) {
      const seed = pseudoRandom((effect.seed || 0) + i * 13.1, i * 4.7);
      const seed2 = pseudoRandom(i * 2.3, (effect.seed || 0) + 4.9);
      const angle = seed * Math.PI * 2;
      const spread = Math.sqrt(seed2) * radius * 0.82;
      const x = toX + Math.cos(angle) * spread;
      const y = toY + Math.sin(angle) * spread - radius * (0.58 - rain * 0.52);
      ctx.strokeStyle = hexToRgba("#ecfccb", 0.18 + rain * 0.48);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 26);
      ctx.lineTo(x + 5, y + 18);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawArrowRainBurst(effect, color, progress) {
  const radius = effect.radius || 72;
  const count = effect.style === "arrow_rain_tick" ? 7 : 18;
  ctx.save();
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();

  for (let i = 0; i < count; i += 1) {
    const seed = pseudoRandom((effect.seed || 0.2) + i * 9.7, i * 4.19);
    const seed2 = pseudoRandom(i * 2.31, (effect.seed || 0.4) + i * 0.61);
    const angle = seed * Math.PI * 2;
    const spread = Math.sqrt(seed2) * radius * 0.82;
    const x = effect.x + Math.cos(angle) * spread;
    const y = effect.y + Math.sin(angle) * spread;
    const drop = 1 - progress;
    const length = radius * (0.18 + seed * 0.08);

    ctx.strokeStyle = `rgba(236,252,203,${0.82 - progress * 0.42})`;
    ctx.lineWidth = effect.style === "arrow_rain_tick" ? 2.2 : 2.8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - length * 0.52, y - length * (1.35 + drop));
    ctx.lineTo(x + length * 0.22, y + length * (0.32 - progress * 0.18));
    ctx.stroke();

    ctx.strokeStyle = hexToRgba(color, 0.72 - progress * 0.3);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + length * 0.22, y + length * 0.32);
    ctx.lineTo(x - length * 0.02, y + length * 0.06);
    ctx.moveTo(x + length * 0.22, y + length * 0.32);
    ctx.lineTo(x - length * 0.12, y + length * 0.24);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = hexToRgba(color, 0.52 - progress * 0.28);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.55 + progress * 0.28), 0, Math.PI * 2);
  ctx.stroke();
}

function drawShotEffect(effect, color, progress) {
  if (effect.style === "arrow_rain_launch") {
    drawArrowRainLaunchEffect(effect, color, progress);
    return;
  }

  if (effect.style === "arrow_rain" || effect.style === "arrow_rain_tick") {
    drawArrowRainBurst(effect, color, progress);
    return;
  }

  if (effect.style === "stalker_shuriken") {
    drawStalkerShurikenShotEffect(effect, color, progress);
    return;
  }

  if (effect.style === "engineer_device_throw") {
    drawEngineerDeviceThrowEffect(effect, color, progress);
    return;
  }

  if (
    effect.style === "engineer_bolt" ||
    effect.style === "turret_fire" ||
    effect.style === "rail_turret" ||
    effect.style === "drone_launch"
  ) {
    drawTechShotEffect(effect, color, progress);
    return;
  }

  if (effect.style === "thread_needle") {
    drawThreadShotEffect(effect, color, progress);
    return;
  }

  if (effect.style === "alchemy_throw") {
    drawAlchemyThrowShotEffect(effect, color, progress);
    return;
  }

  if (effect.style === "alchemist_elixir_spray") {
    drawAlchemistElixirSprayEffect(effect, color, progress);
    return;
  }

  const radius = effect.radius || 44;
  const angle = effect.angle || 0;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);

  if (effect.style === "piercing_shot") {
    const width = Math.max(18, Number(effect.width || 24));
    const length = radius * (1.0 + progress * 0.16);
    ctx.lineCap = "round";
    ctx.strokeStyle = hexToRgba(color, 0.26);
    ctx.lineWidth = width * 2.2;
    ctx.beginPath();
    ctx.moveTo(-length * 0.72, 0);
    ctx.lineTo(length * 0.92, 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#f0fdf4", 0.72);
    ctx.lineWidth = Math.max(5, width * 0.34);
    ctx.beginPath();
    ctx.moveTo(-length * 0.5, 0);
    ctx.lineTo(length * 0.82, 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba(color, 0.48);
    ctx.lineWidth = 3;
    for (const y of [-width * 0.78, width * 0.78]) {
      ctx.beginPath();
      ctx.moveTo(-length * 0.42, y);
      ctx.lineTo(length * 0.48, y * 0.28);
      ctx.stroke();
    }

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(length * 0.98, 0);
    ctx.lineTo(length * 0.58, -width * 0.82);
    ctx.lineTo(length * 0.68, 0);
    ctx.lineTo(length * 0.58, width * 0.82);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = effect.style === "piercing_shot" ? 7 : 5;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.45, 0);
  ctx.lineTo(radius * (0.84 + progress * 0.18), 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.42);
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.2, 0);
    ctx.lineTo(radius * 0.45, i * radius * 0.22);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEngineerDeviceThrowEffect(effect, color, progress) {
  const fromX = Number.isFinite(effect.fromX) ? effect.fromX : effect.x;
  const fromY = Number.isFinite(effect.fromY) ? effect.fromY : effect.y;
  const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
  const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);
  const travel = clamp01(progress / 0.82);
  const eased = 1 - Math.pow(1 - travel, 2.1);
  const arcHeight = Math.min(132, Math.max(42, dist * 0.18));
  const x = fromX + dx * eased;
  const y = fromY + dy * eased - Math.sin(Math.PI * eased) * arcHeight;
  const landing = clamp01((progress - 0.72) / 0.28);
  const device = effect.device || "";
  const turret = device.includes("turret");
  const sticky = device === "sticky_mine";
  const radius = turret ? (device === "mini_turret" ? 12 : 15) : sticky ? 12 : 10;
  const alpha = 1 - progress * 0.08;

  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  ctx.strokeStyle = hexToRgba(color, 0.26 * (1 - landing));
  ctx.lineWidth = 2.4;
  ctx.setLineDash([7, 7]);
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) * 0.5, (fromY + toY) * 0.5 - arcHeight, toX, toY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = `rgba(0,0,0,${0.18 + landing * 0.14})`;
  ctx.beginPath();
  ctx.ellipse(toX, toY + 5, radius * (1.25 + landing * 0.42), radius * (0.42 + landing * 0.1), 0, 0, Math.PI * 2);
  ctx.fill();

  if (landing < 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + progress * Math.PI * (turret ? 3.2 : 4.6));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = hexToRgba(color, 0.24 * alpha);
    ctx.strokeStyle = hexToRgba("#bfdbfe", 0.84 * alpha);
    ctx.lineWidth = 2.4;
    if (turret) {
      roundRect(-radius, -radius * 0.7, radius * 2, radius * 1.4, 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(radius * 0.2, 0);
      ctx.lineTo(radius * 1.35, 0);
      ctx.stroke();
    } else {
      drawPolygon(0, 0, radius, 6, Math.PI / 6);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#fef3c7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-radius * 0.52, 0);
      ctx.lineTo(radius * 0.52, 0);
      ctx.moveTo(0, -radius * 0.52);
      ctx.lineTo(0, radius * 0.52);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (landing > 0) {
    ctx.save();
    ctx.translate(toX, toY);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hexToRgba("#e0f2fe", 0.76 * (1 - landing));
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius * (1.1 + landing * 2.2), 0, Math.PI * 2);
    ctx.stroke();
    drawRadialSparks(0, 0, radius * (1.4 + landing * 1.9), color, turret ? 7 : 6, landing);
    ctx.restore();
  }

  ctx.restore();
}

function drawTechShotEffect(effect, color, progress) {
  const radius = effect.radius || 48;
  const angle = effect.angle || 0;
  const rail = effect.style === "rail_turret";
  const drone = effect.style === "drone_launch";
  const length = radius * (rail ? 1.8 : drone ? 1.25 : 1.05);
  const alpha = 1 - progress * 0.35;

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.strokeStyle = hexToRgba(color, rail ? 0.22 : 0.18);
  ctx.lineWidth = rail ? 24 : 16;
  ctx.beginPath();
  ctx.moveTo(-length * 0.62, 0);
  ctx.lineTo(length * (0.7 + progress * 0.18), 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#e0f2fe", rail ? 0.92 : 0.78);
  ctx.lineWidth = rail ? 6 : 4;
  ctx.beginPath();
  ctx.moveTo(-length * 0.48, 0);
  ctx.lineTo(length * (0.72 + progress * 0.12), 0);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.72 * alpha);
  ctx.lineWidth = 2.5;
  for (const y of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(-length * 0.26, y);
    ctx.lineTo(length * 0.42, y * 0.4);
    ctx.stroke();
  }

  if (rail) {
    ctx.strokeStyle = hexToRgba("#bfdbfe", 0.82 * alpha);
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-length * 0.18, i * 8);
      ctx.lineTo(length * 0.66, i * 3);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = hexToRgba(color, 0.84 * alpha);
    drawPolygon(length * 0.72, 0, drone ? 9 : 7, drone ? 5 : 6, progress * Math.PI);
    ctx.fill();
  }

  ctx.restore();
}

function drawThreadShotEffect(effect, color, progress) {
  const radius = effect.radius || 46;
  const angle = effect.angle || 0;
  const alpha = 1 - progress * 0.32;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let i = -1; i <= 1; i += 1) {
    const offset = i * 5;
    ctx.strokeStyle = hexToRgba(i === 0 ? "#fdf4ff" : color, (i === 0 ? 0.84 : 0.48) * alpha);
    ctx.lineWidth = i === 0 ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, offset);
    ctx.quadraticCurveTo(0, offset * 0.2 + Math.sin(progress * Math.PI + i) * 5, radius * (0.82 + progress * 0.18), -offset * 0.34);
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba("#f5d0fe", 0.72 * alpha);
  ctx.beginPath();
  ctx.moveTo(radius * 0.96, 0);
  ctx.lineTo(radius * 0.54, -6);
  ctx.lineTo(radius * 0.64, 0);
  ctx.lineTo(radius * 0.54, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAlchemyThrowShotEffect(effect, color, progress) {
  const radius = effect.radius || 48;
  const alpha = 1 - progress * 0.3;
  if (Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY) && Number.isFinite(effect.toX) && Number.isFinite(effect.toY)) {
    const fromX = effect.fromX;
    const fromY = effect.fromY;
    const toX = effect.toX;
    const toY = effect.toY;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.hypot(dx, dy) || 1;
    const travel = clamp01(progress / 0.86);
    const eased = 1 - Math.pow(1 - travel, 2.05);
    const arcHeight = Math.min(150, Math.max(46, dist * 0.18));
    const x = fromX + dx * eased;
    const y = fromY + dy * eased - Math.sin(Math.PI * eased) * arcHeight;
    const angle = Math.atan2(dy, dx) + progress * Math.PI * 2.2;
    const landing = clamp01((progress - 0.72) / 0.28);
    const fire = effect.flask === "fire";
    const bomb = effect.flask === "bomb";

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = hexToRgba(color, 0.22 * (1 - landing));
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo((fromX + toX) * 0.5, (fromY + toY) * 0.5 - arcHeight, toX, toY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.shadowColor = hexToRgba(color, 0.42);
    ctx.shadowBlur = bomb ? 18 : 10;
    ctx.fillStyle = hexToRgba("#f8fafc", 0.92 * alpha);
    ctx.strokeStyle = bomb ? "#fef3c7" : fire ? "#fed7aa" : "#d9f99d";
    ctx.lineWidth = bomb ? 2.8 : 2.2;
    roundRect(-7, -13, 14, 26, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = hexToRgba(bomb ? "#e8b15e" : fire ? "#fb923c" : color, 0.82 * alpha);
    ctx.fillRect(-5, 0, 10, 8);
    ctx.restore();

    ctx.translate(toX, toY);
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = hexToRgba(bomb ? "#fef3c7" : color, 0.62 * landing);
    ctx.lineWidth = bomb ? 4 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(16, radius * 0.22) + landing * Math.max(40, radius * 0.42), 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 7; i += 1) {
      const a = (Math.PI * 2 * i) / 7 + (effect.seed || 0);
      ctx.fillStyle = hexToRgba(bomb ? "#fef3c7" : color, (0.42 + i * 0.02) * landing);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * radius * 0.2 * landing, Math.sin(a) * radius * 0.15 * landing, 2.5 + landing * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  const angle = effect.angle || 0;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";

  ctx.strokeStyle = hexToRgba(color, 0.26 * alpha);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.64, radius * 0.16);
  ctx.quadraticCurveTo(0, -radius * (0.28 + progress * 0.08), radius * 0.66, 0);
  ctx.stroke();

  ctx.save();
  ctx.translate(radius * (0.46 + progress * 0.16), -radius * (0.12 + Math.sin(progress * Math.PI) * 0.08));
  ctx.rotate(progress * Math.PI * 1.8);
  ctx.fillStyle = hexToRgba("#f8fafc", 0.88 * alpha);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  roundRect(-6, -11, 12, 22, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = hexToRgba(color, 0.78 * alpha);
  ctx.fillRect(-4, 1, 8, 7);
  ctx.restore();

  for (let i = 0; i < 5; i += 1) {
    const dropX = -radius * 0.2 + i * radius * 0.16;
    const dropY = radius * (0.2 + Math.sin(i + progress * 5) * 0.08);
    ctx.fillStyle = hexToRgba(color, (0.5 - i * 0.045) * alpha);
    ctx.beginPath();
    ctx.arc(dropX, dropY, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawAlchemistElixirSprayEffect(effect, color, progress) {
  const radius = effect.radius || 220;
  const alpha = 1 - progress * 0.25;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = hexToRgba(color, 0.08 * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.18 + progress * 0.55), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexToRgba("#d9f99d", 0.58 * alpha);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.22 + progress * 0.5), 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 16; i += 1) {
    const angle = (Math.PI * 2 * i) / 16 + (effect.seed || 0) * 0.2;
    const dist = radius * (0.12 + progress * (0.32 + (i % 4) * 0.045));
    const size = 3 + (i % 3);
    ctx.fillStyle = hexToRgba(i % 2 ? "#bef264" : "#fef3c7", 0.32 + alpha * 0.3);
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist * 0.82, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStalkerShurikenShotEffect(effect, color, progress) {
  const radius = effect.radius || 54;
  const spread = Number(effect.spread || 0.34);
  const angle = effect.angle || 0;
  const length = radius * (1.6 + progress * 0.8);

  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.lineCap = "round";

  for (const offset of [-spread, 0, spread]) {
    ctx.save();
    ctx.rotate(offset);
    ctx.strokeStyle = hexToRgba(color, 0.28 * (1 - progress));
    ctx.lineWidth = offset === 0 ? 14 : 10;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();

    ctx.strokeStyle = hexToRgba("#f5d0fe", 0.84 * (1 - progress * 0.35));
    ctx.lineWidth = offset === 0 ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(length * 0.86, 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawImpactEffect(effect, color, progress) {
  const radius = (effect.radius || 24) * (0.5 + progress * 0.55);
  const style = effect.style || "";
  if (
    pixiRenderer &&
    (style === "shield_slam" || style === "cleave_impact" || style === "blade_impact" || style === "spin_impact")
  ) {
    return;
  }
  if (style === "player_hit" || style === "player_poison_hit") {
    drawPlayerHitEffect(effect, color, progress, radius, style);
    return;
  }
  if (style === "enemy_hit" || style === "heavy_hit" || style === "critical_hit") {
    drawEnemyHitEffect(effect, color, progress, radius, style);
    return;
  }
  if (style === "blade_impact" || style === "cleave_impact" || style === "spin_impact" || style === "shield_slam") {
    drawMeleeImpactEffect(effect, color, progress, radius, style);
    return;
  }
  if (style === "martial_impact") {
    drawMartialImpactEffect(effect, color, progress, radius);
    return;
  }
  if (style === "assassin_mark_hit") {
    drawAssassinMarkImpactEffect(effect, color, progress, radius);
    return;
  }
  const sparkColor = "#f6f1e8";
  const ringColor = "rgba(254,215,170,0.72)";
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  drawRadialSparks(effect.x, effect.y, radius * 1.05, sparkColor, style === "cast_interrupt" ? 5 : 3, progress);
}

function drawMartialImpactEffect(effect, color, progress, radius) {
  const alpha = 1 - progress;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.seed || 0);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = hexToRgba(color, 0.68 * alpha);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * (0.72 + progress * 0.48), radius * (0.34 + progress * 0.22), 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#fff7ed", 0.84 * alpha);
  ctx.lineWidth = 3.4;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-radius * 0.22, i * radius * 0.12);
    ctx.lineTo(radius * (0.6 + progress * 0.22), i * radius * 0.04);
    ctx.stroke();
  }
  drawRadialSparks(0, 0, radius * 1.15, "#fed7aa", 6, progress);
  ctx.restore();
}

function drawAssassinMarkImpactEffect(effect, color, progress, radius) {
  const alpha = 1 - progress;
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(effect.seed || 0);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = hexToRgba("#11110f", 0.24 * alpha);
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.58 + progress * 0.2), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(color, 0.82 * alpha);
  ctx.lineWidth = 3.2;
  for (const angle of [-0.72, 0, 0.72]) {
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-radius * 0.72, 0);
    ctx.lineTo(radius * (0.72 + progress * 0.3), 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = hexToRgba("#f5d0fe", 0.72 * alpha);
  ctx.lineWidth = 2;
  drawPolygon(0, 0, radius * (0.34 + progress * 0.22), 4, Math.PI / 4);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyHitEffect(effect, color, progress, radius, style) {
  const alpha = 1 - progress;
  const heavy = style === "heavy_hit" || style === "critical_hit" || effect.heavy;
  const crit = style === "critical_hit";
  const coreColor = crit ? "#fde68a" : "#f8f3e9";
  const burstColor = crit ? "#facc15" : color;
  const sparkCount = crit ? 10 : heavy ? 8 : 5;
  const angleOffset = Number(effect.seed || 0);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = hexToRgba(burstColor, (crit ? 0.22 : heavy ? 0.15 : 0.1) * alpha);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.68 + progress * 0.38), 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(coreColor, (crit ? 0.95 : 0.78) * alpha);
  ctx.lineWidth = crit ? 5 : heavy ? 4 : 3;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.32 + progress * 0.58), 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineCap = "round";
  for (let i = 0; i < sparkCount; i += 1) {
    const angle = angleOffset + (Math.PI * 2 * i) / sparkCount;
    const spread = 0.72 + pseudoRandom(i + Math.floor(angleOffset * 10), 19) * 0.44;
    const inner = radius * (0.2 + progress * 0.16);
    const outer = radius * (heavy ? 0.92 : 0.68) * spread * (0.82 + progress * 0.35);
    ctx.strokeStyle = i % 2 === 0 ? hexToRgba(coreColor, 0.9 * alpha) : hexToRgba(burstColor, 0.72 * alpha);
    ctx.lineWidth = crit ? 3.6 : heavy ? 3 : 2.2;
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlayerHitEffect(effect, color, progress, radius, style) {
  const poison = style === "player_poison_hit";
  const alpha = 1 - progress;
  const core = poison ? "#bef264" : "#fecaca";
  const outer = poison ? "#84cc16" : "#ef4444";
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = hexToRgba(outer, 0.16 * alpha);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * 1.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = hexToRgba(core, 0.86 * alpha);
  ctx.lineWidth = effect.heavy ? 6 : 4;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.72 + progress * 0.58), 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(core, (effect.heavy ? 0.86 : 0.68) * alpha);
  ctx.lineWidth = effect.heavy ? 5 : 3.5;
  ctx.lineCap = "round";
  for (const angle of [effect.seed || 0, (effect.seed || 0) + Math.PI * 0.58]) {
    const inner = radius * 0.18;
    const outerRadius = radius * (effect.heavy ? 1.02 : 0.82);
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outerRadius, effect.y + Math.sin(angle) * outerRadius);
    ctx.stroke();
  }

  ctx.strokeStyle = hexToRgba(outer, 0.74 * alpha);
  ctx.lineWidth = effect.heavy ? 4 : 3;
  const sparks = effect.heavy ? 8 : 5;
  for (let i = 0; i < sparks; i += 1) {
    const angle = (Math.PI * 2 * i) / sparks + (effect.seed || 0);
    const inner = radius * (0.22 + progress * 0.3);
    const outerRadius = radius * (0.82 + progress * 0.45);
    ctx.beginPath();
    ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner);
    ctx.lineTo(effect.x + Math.cos(angle) * outerRadius, effect.y + Math.sin(angle) * outerRadius);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMeleeImpactEffect(effect, color, progress, radius, style) {
  const heavy = style === "cleave_impact" || style === "shield_slam";
  const angle = (effect.seed || 0) % (Math.PI * 2);
  const hitColor = "#f6f1e8";
  const warmColor = "#fed7aa";
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";

  if (style === "shield_slam") {
    ctx.fillStyle = "rgba(254,215,170,0.11)";
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hitColor;
    ctx.lineWidth = 6;
    drawHexRing(0, 0, radius * (0.62 + progress * 0.46), hitColor, 6);
    ctx.strokeStyle = "rgba(254,215,170,0.62)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, radius * (0.36 + i * 0.27 + progress * 0.22), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = hexToRgba(hitColor, heavy ? 0.9 : 0.74);
  ctx.lineWidth = style === "shield_slam" ? 10 : heavy ? 7 : 5;
  for (let i = 0; i < (style === "shield_slam" ? 3 : 2); i += 1) {
    ctx.save();
    ctx.rotate(i * Math.PI * (style === "shield_slam" ? 0.33 : 0.5));
    ctx.beginPath();
    ctx.moveTo(-radius * (style === "shield_slam" ? 0.92 : 0.72 - progress * 0.12), 0);
    ctx.lineTo(radius * (style === "shield_slam" ? 1.02 + progress * 0.26 : 0.72 + progress * 0.18), 0);
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = hitColor;
  ctx.lineWidth = style === "shield_slam" ? 5 : heavy ? 3 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius * (0.28 + progress * 0.62), 0, Math.PI * 2);
  ctx.stroke();
  drawRadialSparks(0, 0, radius * (0.8 + progress * 0.24), warmColor, style === "shield_slam" ? 10 : heavy ? 7 : 5, progress);
  ctx.restore();
}

function drawArcaneSplashEffect(effect, color, progress) {
  const radius = (effect.radius || 84) * (0.3 + progress * 0.58);
  ctx.fillStyle = hexToRgba(color, 0.1);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI * 2 * i) / 10 + progress * 0.8;
    const r = i % 2 ? radius * 0.56 : radius;
    const x = effect.x + Math.cos(angle) * r;
    const y = effect.y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawChestEffect(effect, color, progress) {
  const radius = effect.radius || 54;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius * (0.65 + progress * 0.25), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  drawRadialSparks(effect.x, effect.y, radius * 0.66, color, 5, progress);
}

function drawChainEffect(effect, color, progress) {
  const fromX = Number.isFinite(effect.fromX) ? effect.fromX : effect.x - (effect.radius || 80) * 0.5;
  const fromY = Number.isFinite(effect.fromY) ? effect.fromY : effect.y;
  const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x + (effect.radius || 80) * 0.5;
  const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
  if (effect.style === "thread_bind") {
    drawThreadLine(fromX, fromY, toX, toY, color, progress);
    return;
  }
  if (effect.style === "engineer_overclock") {
    drawEngineerOverclockChain(fromX, fromY, toX, toY, color, progress, effect.seed || 0);
    return;
  }
  if (effect.style === "assassin_mark_chain") {
    drawAssassinMarkChain(fromX, fromY, toX, toY, color, progress, effect.seed || 0);
    return;
  }
  drawLightningLine(fromX, fromY, toX, toY, color, 5, effect.seed + progress * 3);
}

function drawEngineerOverclockChain(fromX, fromY, toX, toY, color, progress, seed) {
  const alpha = 1 - progress;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  drawLightningLine(fromX, fromY, toX, toY, "#bfdbfe", 4, seed + progress * 4);
  ctx.strokeStyle = hexToRgba(color, 0.42 * alpha);
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i += 1) {
    const t = i / 4;
    const cx = fromX + dx * t;
    const cy = fromY + dy * t;
    ctx.beginPath();
    ctx.moveTo(cx - nx * 8, cy - ny * 8);
    ctx.lineTo(cx + nx * 8, cy + ny * 8);
    ctx.moveTo(cx + ux * 7, cy + uy * 7);
    ctx.lineTo(cx + ux * 7 + nx * 8 * (i % 2 ? -1 : 1), cy + uy * 7 + ny * 8 * (i % 2 ? -1 : 1));
    ctx.stroke();
  }
  ctx.restore();
}

function drawAssassinMarkChain(fromX, fromY, toX, toY, color, progress, seed) {
  const alpha = 1 - progress;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  ctx.strokeStyle = hexToRgba("#11110f", 0.42 * alpha);
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) * 0.5 + nx * 18, (fromY + toY) * 0.5 + ny * 18, toX, toY);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba(color, 0.74 * alpha);
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.quadraticCurveTo((fromX + toX) * 0.5 - nx * 12, (fromY + toY) * 0.5 - ny * 12, toX, toY);
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    const t = (i + 1) / 4;
    const x = fromX + dx * t + nx * Math.sin(seed + i + progress * Math.PI) * 8;
    const y = fromY + dy * t + ny * Math.sin(seed + i + progress * Math.PI) * 8;
    ctx.fillStyle = hexToRgba("#f5d0fe", 0.74 * alpha);
    drawPolygon(x, y, 7, 4, seed + i);
    ctx.fill();
  }
  ctx.restore();
}

function drawThreadLine(fromX, fromY, toX, toY, color, progress) {
  const alpha = 1 - progress;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  ctx.save();
  ctx.lineCap = "round";
  for (let i = -1; i <= 1; i += 1) {
    const offset = i * 5 * (1 - progress * 0.4);
    ctx.strokeStyle = hexToRgba(i === 0 ? "#fdf4ff" : color, (i === 0 ? 0.72 : 0.44) * alpha);
    ctx.lineWidth = i === 0 ? 2.4 : 1.6;
    ctx.beginPath();
    ctx.moveTo(fromX + nx * offset, fromY + ny * offset);
    ctx.quadraticCurveTo(
      (fromX + toX) / 2 + nx * offset * 2.4,
      (fromY + toY) / 2 + ny * offset * 2.4,
      toX - nx * offset,
      toY - ny * offset
    );
    ctx.stroke();
  }
  ctx.restore();
}

function drawHolyEffect(effect, color, progress) {
  if (effect.style === "shaman_channel") {
    drawShamanHealAura(effect.x, effect.y, effect.radius || 160, color, progress, { channel: true, alpha: 0.62 });
    return;
  }
  if (effect.style === "shaman_heal_burst") {
    drawShamanHealAura(effect.x, effect.y, effect.radius || 180, color, progress, { channel: false, alpha: 0.95 });
    return;
  }

  const radius = (effect.radius || 180) * (0.55 + progress * 0.34);
  ctx.fillStyle = hexToRgba(color, 0.08);
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  drawRadialSparks(effect.x, effect.y, radius * 0.72, "#fef3c7", 8, progress);
}

function drawStarEffect(effect, color, progress) {
  const radius = (effect.radius || 120) * (0.35 + progress * 0.32);
  ctx.save();
  ctx.translate(effect.x, effect.y);
  ctx.rotate(progress * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i < 12; i += 1) {
    const angle = (Math.PI * 2 * i) / 12;
    const r = i % 2 ? radius * 0.45 : radius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHexRing(x, y, radius, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i <= 6; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 6;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

function drawRadialSparks(x, y, radius, color, count, progress) {
  const safeCount = Math.max(3, Math.ceil(count * 0.65));
  ctx.strokeStyle = withAlpha(color, 0.72);
  ctx.lineWidth = 1.6;
  ctx.lineCap = "round";
  for (let i = 0; i < safeCount; i += 1) {
    const angle = (Math.PI * 2 * i) / safeCount + progress * 0.58;
    const inner = radius * (0.28 + progress * 0.15);
    const outer = radius * (0.46 + progress * 0.22);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
    ctx.stroke();
  }
}

function drawLightningLine(fromX, fromY, toX, toY, color, width, seed) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const steps = 5;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = hexToRgba(color, 0.24);
  ctx.lineWidth = width + 5;
  drawJaggedPath(fromX, fromY, dx, dy, nx, ny, steps, seed, length * 0.052);
  ctx.stroke();

  ctx.strokeStyle = hexToRgba("#e9d5ff", 0.82);
  ctx.lineWidth = Math.max(2, width * 0.38);
  drawJaggedPath(fromX, fromY, dx, dy, nx, ny, steps, seed + 1.7, length * 0.032);
  ctx.stroke();
}

function drawJaggedPath(fromX, fromY, dx, dy, nx, ny, steps, seed, jitter) {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const offset = Math.sin(seed + i * 2.31) * jitter;
    ctx.lineTo(fromX + dx * t + nx * offset, fromY + dy * t + ny * offset);
  }
  ctx.lineTo(fromX + dx, fromY + dy);
}

function drawAim(camera) {
  const self = getSelf();
  if (!self || self.spectator) return;
  const selfPosition = getVisualPosition(visuals.players, self);
  const worldMouse = {
    x: camera.x - viewW / 2 + mouse.x,
    y: camera.y - viewH / 2 + mouse.y
  };

  ctx.strokeStyle = "rgba(246,241,232,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(selfPosition.x, selfPosition.y);
  ctx.lineTo(worldMouse.x, worldMouse.y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(246,241,232,0.55)";
  ctx.beginPath();
  ctx.arc(worldMouse.x, worldMouse.y, 10, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSelfGauges(x, y, player) {
  const width = 88;
  const hpRatio = clamp01(player.hp / Math.max(1, player.maxHp));
  const dashMax = Math.max(0.1, Number(player.stats?.dashCooldownMax || 1.15));
  const dashRatio = player.dashReady ? 1 : clamp01(1 - Number(player.dashCooldown || 0) / dashMax);
  const dashMaxCharges = Math.max(1, Math.round(Number(player.dashMaxCharges || 1)));

  ctx.save();
  ctx.fillStyle = "rgba(10,10,12,0.78)";
  roundRect(x - width / 2, y - 16, width, 34, 7);
  ctx.fill();

  ctx.fillStyle = "#f6f1e8";
  ctx.font = "800 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(player.name.slice(0, 10), x, y - 8);

  drawWorldGauge(x - width / 2 + 7, y + 1, width - 14, 6, hpRatio, "#c85d56", "#c9824c");
  if (dashMaxCharges > 1) {
    drawDashChargeGauge(x - width / 2 + 7, y + 10, width - 14, 4, player);
  } else {
    drawWorldGauge(x - width / 2 + 7, y + 10, width - 14, 4, dashRatio, "#7e9fb2", "#8aa8bd");
  }
  ctx.restore();
}

function drawPlayerNameOnly(x, y, name) {
  const width = 72;
  ctx.save();
  ctx.fillStyle = "rgba(10,10,12,0.62)";
  roundRect(x - width / 2, y - 10, width, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#f6f1e8";
  ctx.font = "700 11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.slice(0, 10), x, y - 1);
  ctx.restore();
}

function drawWorldGauge(x, y, width, height, ratio, startColor, endColor) {
  const safeRatio = clamp01(ratio);
  ctx.fillStyle = "rgba(255,255,255,0.14)";
  roundRect(x, y, width, height, height / 2);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  ctx.fillStyle = gradient;
  roundRect(x, y, width * safeRatio, height, height / 2);
  ctx.fill();
}

function drawDashChargeGauge(x, y, width, height, player) {
  const maxCharges = Math.max(1, Math.round(Number(player.dashMaxCharges || 1)));
  const charges = clamp(Math.floor(Number(player.dashCharges || 0)), 0, maxCharges);
  const rechargeMax = Math.max(0.1, Number(player.stats?.dashCooldownMax || 1.15));
  const rechargeLeft = Number(player.dashRechargeCooldown || 0);
  const gap = 3;
  const segmentWidth = (width - gap * (maxCharges - 1)) / maxCharges;

  for (let i = 0; i < maxCharges; i += 1) {
    const sx = x + i * (segmentWidth + gap);
    let ratio = i < charges ? 1 : 0;
    if (i === charges && charges < maxCharges && rechargeLeft > 0) {
      ratio = clamp01(1 - rechargeLeft / rechargeMax);
    }

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(sx, y, segmentWidth, height, height / 2);
    ctx.fill();

    if (ratio > 0) {
      const gradient = ctx.createLinearGradient(sx, y, sx + segmentWidth, y);
      gradient.addColorStop(0, "#86b6a0");
      gradient.addColorStop(1, "#a4cf74");
      ctx.fillStyle = gradient;
      roundRect(sx, y, segmentWidth * ratio, height, height / 2);
      ctx.fill();
    }
  }
}

function drawEnemyBar(enemy, x, y) {
  const width = enemy.radius * 2.1;
  const barY = y - enemy.radius - 13;
  ctx.fillStyle = "rgba(17,17,15,0.72)";
  roundRect(x - width / 2, barY, width, 5, 3);
  ctx.fill();
  ctx.fillStyle = "#c85d56";
  roundRect(x - width / 2, barY, width * (enemy.hp / enemy.maxHp), 5, 3);
  ctx.fill();
}

function drawVignette() {
  const gradient = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.25, viewW / 2, viewH / 2, viewH * 0.76);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.46)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawDamageVignette() {
  const self = getSelf();
  if (!self || Number(self.hitIFrameTime || 0) <= 0) return;
  const strength = clamp01(Number(self.hitIFrameTime || 0) / 0.42);
  const gradient = ctx.createRadialGradient(viewW / 2, viewH / 2, viewH * 0.18, viewW / 2, viewH / 2, viewH * 0.78);
  gradient.addColorStop(0, "rgba(127,29,29,0)");
  gradient.addColorStop(0.58, `rgba(127,29,29,${0.1 * strength})`);
  gradient.addColorStop(1, `rgba(239,68,68,${0.28 * strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawStars(dx, dy) {
  ctx.fillStyle = "rgba(246,241,232,0.22)";
  for (let i = 0; i < 90; i += 1) {
    const x = (pseudoRandom(i * 43, 11) * viewW + dx) % viewW;
    const y = (pseudoRandom(i * 11, 47) * viewH + dy) % viewH;
    ctx.fillRect(x, y, 2, 2);
  }
}

function getSelf() {
  return state && state.players.find((player) => player.id === selfId);
}

function getVisualPosition(map, entity) {
  return map.get(String(entity.id)) || entity;
}

function getCamera() {
  const self = getSelf();
  const world = state ? state.room.world : { w: viewW, h: viewH };
  let follow = self && !self.spectator ? self : null;
  if (!follow && state) {
    follow =
      state.players.find((player) => !player.spectator && player.hp > 0) ||
      state.players.find((player) => !player.spectator) ||
      null;
  }
  const position = follow ? getVisualPosition(visuals.players, follow) : null;
  const x = position ? position.x : world.w / 2;
  const y = position ? position.y : world.h / 2;
  return {
    x: clamp(x, viewW / 2, Math.max(viewW / 2, world.w - viewW / 2)),
    y: clamp(y, viewH / 2, Math.max(viewH / 2, world.h - viewH / 2))
  };
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawPolygon(x, y, radius, sides, rotation = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (Math.PI * 2 * i) / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function pseudoRandom(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function stableNumericSeed(value) {
  const text = String(value || "0");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  }
  return hash / 9973;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const number = parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function withAlpha(color, alpha) {
  if (typeof color !== "string") return `rgba(246,241,232,${alpha})`;
  if (color.startsWith("#")) return hexToRgba(color, alpha);
  const rgba = color.match(/rgba?\(([^)]+)\)/);
  if (!rgba) return color;
  const parts = rgba[1].split(",").map((part) => part.trim());
  return `rgba(${parts[0] || 246},${parts[1] || 241},${parts[2] || 232},${alpha})`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(Number.isFinite(value) ? value : 0, 0, 1);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

frame();
