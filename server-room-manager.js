function createRoomState(code, defaults = {}) {
  return {
    code,
    world: { w: defaults.worldWidth || 1800, h: defaults.worldHeight || 1120 },
    players: new Map(),
    enemies: [],
    projectiles: [],
    hazards: [],
    relicChests: [],
    xpOrbs: [],
    pendingReinforcements: [],
    effects: [],
    wave: 1,
    stageIndex: 0,
    floor: 1,
    abyssDepth: 0,
    ascensionLevel: 0,
    abyssDecision: false,
    challengeMode: "standard",
    challengeKey: "",
    challengeSeed: 0,
    challengeModifierId: "",
    challengeRuleId: "",
    weeklyBossId: "",
    runSeed: 0,
    randomState: 0,
    status: "lobby",
    hostId: null,
    riskChoices: [],
    activeRisk: defaults.activeRisk,
    waveTrait: defaults.waveTrait,
    mapWalls: [],
    mapWallsKey: "",
    mapEdgeWalls: [],
    mapEdgeWallsKey: "",
    stageMap: null,
    currentMapNodeId: null,
    activeMapNode: null,
    mapChoices: [],
    mapVotes: {},
    mapPath: [],
    mapDeadline: 0,
    killsSinceChest: 0,
    threatLevel: 1,
    stageObjective: null,
    clearSummary: null,
    choiceDeadline: 0,
    pausedStatus: null,
    advancementStartedAt: 0,
    advancementDeadline: 0,
    lastBroadcast: 0,
    restartAt: 0,
    runStartedAt: 0,
    runBossDefeats: [],
    survival: null,
    result: null,
    events: []
  };
}

function getOrCreateRoom(rooms, code, defaults = {}) {
  if (!rooms.has(code)) rooms.set(code, createRoomState(code, defaults));
  return rooms.get(code);
}

function getPublicRooms(rooms, options = {}) {
  const getActivePlayers = options.getActivePlayers || ((room) => [...room.players.values()]);
  const countSpectators = options.countSpectators || (() => 0);
  const maxPlayers = options.maxPlayers || 4;
  return [...rooms.values()]
    .filter((room) => room.players.size > 0)
    .sort((a, b) => getActivePlayers(b).length - getActivePlayers(a).length || a.code.localeCompare(b.code))
    .map((room) => {
      const host = room.hostId ? room.players.get(room.hostId) : null;
      const activeCount = getActivePlayers(room).length;
      return {
        code: room.code,
        status: room.status,
        wave: room.wave,
        playerCount: activeCount,
        spectatorCount: countSpectators(room),
        maxPlayers,
        hostName: host ? host.name : ""
      };
    });
}

function prepareRoomForGameover(room) {
  room.status = "gameover";
  room.enemies = [];
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
  room.pendingReinforcements = [];
  room.riskChoices = [];
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  room.choiceDeadline = 0;
  room.pausedStatus = null;
  room.advancementStartedAt = 0;
  room.advancementDeadline = 0;
  room.restartAt = 0;

  for (const player of room.players.values()) {
    player.choicePending = false;
    player.choices = [];
    player.pendingSkillChoices = [];
  }
}

function clearStageCombatObjects(room) {
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
}

module.exports = {
  clearStageCombatObjects,
  createRoomState,
  getOrCreateRoom,
  getPublicRooms,
  prepareRoomForGameover
};
