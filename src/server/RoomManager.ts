export interface RoomDefaults<TModifier = unknown, TWaveTrait = unknown> {
  readonly worldWidth?: number;
  readonly worldHeight?: number;
  readonly activeRisk?: TModifier;
  readonly waveTrait?: TWaveTrait;
}

export interface PublicRoomView {
  readonly code: string;
  readonly status: string;
  readonly wave: number;
  readonly playerCount: number;
  readonly spectatorCount: number;
  readonly maxPlayers: number;
  readonly hostName: string;
}

export interface RoomLike<TPlayer = unknown> {
  readonly code: string;
  readonly players: Map<string, TPlayer>;
  readonly hostId: string | null;
  readonly status: string;
  readonly wave: number;
}

export interface PublicRoomOptions<TRoom extends RoomLike> {
  readonly getActivePlayers: (room: TRoom) => readonly unknown[];
  readonly countSpectators: (room: TRoom) => number;
  readonly maxPlayers: number;
}

export interface GameoverPlayerLike {
  choicePending: boolean;
  choices: unknown[];
  pendingSkillChoices: unknown[];
}

export interface GameoverRoomLike<TPlayer extends GameoverPlayerLike = GameoverPlayerLike> {
  status: string;
  enemies: unknown[];
  projectiles: unknown[];
  hazards: unknown[];
  relicChests: unknown[];
  xpOrbs: unknown[];
  pendingReinforcements: unknown[];
  riskChoices: unknown[];
  mapChoices: unknown[];
  mapVotes: Record<string, string>;
  mapDeadline: number;
  choiceDeadline: number;
  pausedStatus: string | null;
  advancementStartedAt: number;
  advancementDeadline: number;
  restartAt: number;
  players: Map<string, TPlayer>;
}

export interface StageCombatObjectsRoomLike {
  projectiles: unknown[];
  hazards: unknown[];
  relicChests: unknown[];
  xpOrbs: unknown[];
}

export function createRoomState<TModifier = unknown, TWaveTrait = unknown>(
  code: string,
  defaults: RoomDefaults<TModifier, TWaveTrait> = {},
) {
  return {
    code,
    world: { w: defaults.worldWidth ?? 1800, h: defaults.worldHeight ?? 1120 },
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
    status: "lobby",
    hostId: null,
    riskChoices: [],
    activeRisk: defaults.activeRisk,
    waveTrait: defaults.waveTrait,
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
    result: null,
    events: [],
  };
}

export function getPublicRooms<TRoom extends RoomLike>(
  rooms: Iterable<TRoom>,
  options: PublicRoomOptions<TRoom>,
): PublicRoomView[] {
  return [...rooms]
    .filter((room) => room.players.size > 0)
    .sort((a, b) => options.getActivePlayers(b).length - options.getActivePlayers(a).length || a.code.localeCompare(b.code))
    .map((room) => {
      const host = room.hostId ? (room.players.get(room.hostId) as { name?: string } | undefined) : null;
      const activeCount = options.getActivePlayers(room).length;
      return {
        code: room.code,
        status: room.status,
        wave: room.wave,
        playerCount: activeCount,
        spectatorCount: options.countSpectators(room),
        maxPlayers: options.maxPlayers,
        hostName: host?.name || "",
      };
    });
}

export function prepareRoomForGameover<TRoom extends GameoverRoomLike>(room: TRoom): void {
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

export function clearStageCombatObjects<TRoom extends StageCombatObjectsRoomLike>(room: TRoom): void {
  room.projectiles = [];
  room.hazards = [];
  room.relicChests = [];
  room.xpOrbs = [];
}
