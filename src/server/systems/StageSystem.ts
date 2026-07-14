export interface StageNodeLike {
  readonly id: string;
  readonly floor?: number;
  readonly lane?: number;
  readonly kind?: string;
  readonly resolvedKind?: string;
  readonly depth?: number;
  readonly modifierId?: string;
  readonly bossId?: string;
  readonly nextIds?: readonly string[];
}

export interface StageMapLike<TNode extends StageNodeLike = StageNodeLike> {
  readonly floor?: number;
  readonly depth?: number;
  readonly lanes?: number;
  readonly edges?: readonly unknown[];
  readonly nodes: readonly TNode[];
}

export interface RoomWithStageMap<TNode extends StageNodeLike = StageNodeLike> {
  readonly stageMap: StageMapLike<TNode> | null;
  readonly currentMapNodeId: string | null;
  readonly mapPath?: readonly string[];
}

export interface RoomWithMutableMapChoices<TNode extends StageNodeLike = StageNodeLike> extends RoomWithStageMap<TNode> {
  mapChoices: unknown[];
}

export interface RoomWithMutableStageMap<TNode extends StageNodeLike = StageNodeLike> extends RoomWithStageMap<TNode> {
  floor: number;
  stageMap: StageMapLike<TNode> | null;
  currentMapNodeId: string | null;
  activeMapNode: TNode | null;
  mapPath: string[];
}

export interface RoomWithMutableMapNodeStart<TNode extends StageNodeLike = StageNodeLike> {
  currentMapNodeId: string | null;
  activeMapNode: TNode | null;
  activeRisk: unknown;
  stageIndex: number;
  wave: number;
  mapChoices: unknown[];
  mapVotes: Record<string, string>;
  mapDeadline: number;
  mapPath: string[];
}

export function getNodeGameplayKind(node: StageNodeLike | null | undefined): string {
  if (!node) return "combat";
  return node.resolvedKind || node.kind || "combat";
}

export function getMapNode<TNode extends StageNodeLike>(stageMap: StageMapLike<TNode> | null, nodeId: string): TNode | null {
  return stageMap?.nodes.find((node) => node.id === nodeId) ?? null;
}

export function getAvailableMapNodes<TNode extends StageNodeLike>(room: RoomWithStageMap<TNode>): TNode[] {
  if (!room.stageMap) return [];
  if (!room.currentMapNodeId) {
    return room.stageMap.nodes.filter((node) => node.depth === 1);
  }
  const current = getMapNode(room.stageMap, room.currentMapNodeId);
  if (!current) return [];
  return (current.nextIds ?? []).map((id) => getMapNode(room.stageMap, id)).filter((node): node is TNode => Boolean(node));
}

export function countMapVotes(mapVotes: Record<string, string> | null | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const nodeId of Object.values(mapVotes ?? {})) {
    counts[nodeId] = (counts[nodeId] ?? 0) + 1;
  }
  return counts;
}

export function pickVoteWinner<TNode extends StageNodeLike>(
  available: readonly TNode[],
  counts: Record<string, number>,
  random = Math.random,
): string | null {
  let bestCount = -1;
  let best: string[] = [];
  for (const node of available) {
    const count = counts[node.id] ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = [node.id];
    } else if (count === bestCount) {
      best.push(node.id);
    }
  }
  return best.length ? best[Math.floor(random() * best.length)] ?? null : null;
}

export interface StageMapNodeViewOptions<TNode extends StageNodeLike> {
  readonly getModifier: (node: TNode) => unknown;
  readonly getBossProfile: (node: TNode) => unknown;
  readonly stageNodeMetaView: (node: TNode) => unknown;
  readonly riskView: (modifier: unknown) => unknown;
  readonly bossProfileView: (bossProfile: unknown) => unknown;
  readonly voteCounts?: Record<string, number>;
}

export interface StageMapNodeView {
  readonly id: string;
  readonly floor: number | undefined;
  readonly depth: number | undefined;
  readonly lane: number | undefined;
  readonly kind: string | undefined;
  readonly resolvedKind: string;
  readonly stage: unknown;
  readonly modifier: unknown;
  readonly boss: unknown;
  readonly votes: number;
}

export function getMapNodeView<TNode extends StageNodeLike>(
  room: { readonly mapVotes?: Record<string, string> | null },
  node: TNode,
  options: StageMapNodeViewOptions<TNode>,
): StageMapNodeView {
  const voteCounts = options.voteCounts ?? countMapVotes(room.mapVotes);
  const bossProfile = getNodeGameplayKind(node) === "boss" ? options.getBossProfile(node) : null;
  return {
    id: node.id,
    floor: node.floor,
    depth: node.depth,
    lane: node.lane,
    kind: node.kind,
    resolvedKind: node.resolvedKind || "",
    stage: options.stageNodeMetaView(node),
    modifier: options.riskView(options.getModifier(node)),
    boss: options.bossProfileView(bossProfile),
    votes: voteCounts[node.id] ?? 0,
  };
}

export interface RefreshMapChoicesOptions<TNode extends StageNodeLike> {
  readonly availableNodes?: readonly TNode[];
  readonly mapNodeView?: (node: TNode) => unknown;
}

export function refreshMapChoices<TNode extends StageNodeLike>(
  room: RoomWithMutableMapChoices<TNode>,
  options: RefreshMapChoicesOptions<TNode> = {},
): unknown[] {
  const mapNodeView = options.mapNodeView ?? ((node: TNode): unknown => node);
  const availableNodes = options.availableNodes ?? getAvailableMapNodes(room);
  room.mapChoices = availableNodes.map((node) => mapNodeView(node));
  return room.mapChoices;
}

export interface EnsureMapProgressionOptions<TNode extends StageNodeLike> {
  readonly maxChapters: number;
  readonly generateStageMap: (floor: number) => StageMapLike<TNode>;
}

export interface EnsureMapProgressionResult<TNode extends StageNodeLike> {
  readonly status: "available" | "complete" | "advanced" | "blocked";
  readonly availableNodes: readonly TNode[];
}

export function ensureMapProgression<TNode extends StageNodeLike>(
  room: RoomWithMutableStageMap<TNode>,
  options: EnsureMapProgressionOptions<TNode>,
): EnsureMapProgressionResult<TNode> {
  const availableNodes = getAvailableMapNodes(room);
  if (availableNodes.length > 0) return { status: "available", availableNodes };
  if (room.floor >= options.maxChapters) return { status: "complete", availableNodes: [] };
  room.floor += 1;
  room.stageMap = options.generateStageMap(room.floor);
  room.currentMapNodeId = null;
  room.activeMapNode = null;
  room.mapPath = [];
  return { status: "advanced", availableNodes: getAvailableMapNodes(room) };
}

export interface ApplyMapNodeStartOptions<TNode extends StageNodeLike> {
  readonly resolveRandomStageKind: (node: TNode) => string;
  readonly getModifier: (node: TNode) => unknown;
  readonly getBossProfile: (node: TNode) => unknown;
}

export interface ApplyMapNodeStartResult {
  readonly modifier: unknown;
  readonly gameplayKind: string;
  readonly bossProfile: unknown;
}

export function applyMapNodeStart<TNode extends StageNodeLike>(
  room: RoomWithMutableMapNodeStart<TNode>,
  node: TNode,
  options: ApplyMapNodeStartOptions<TNode>,
): ApplyMapNodeStartResult {
  if (node.kind === "random") {
    (node as { resolvedKind?: string }).resolvedKind = options.resolveRandomStageKind(node);
  } else {
    (node as { resolvedKind?: string }).resolvedKind = "";
  }
  const modifier = options.getModifier(node);
  const gameplayKind = getNodeGameplayKind(node);
  const bossProfile = gameplayKind === "boss" ? options.getBossProfile(node) : null;
  room.currentMapNodeId = node.id;
  room.activeMapNode = node;
  room.activeRisk = modifier;
  room.stageIndex += 1;
  room.wave = room.stageIndex;
  room.mapChoices = [];
  room.mapVotes = {};
  room.mapDeadline = 0;
  if (!room.mapPath.includes(node.id)) room.mapPath.push(node.id);
  return { modifier, gameplayKind, bossProfile };
}

export interface StageClearRoomLike<TNode extends StageNodeLike = StageNodeLike> {
  readonly floor: number;
  readonly stageMap: StageMapLike<TNode> | null;
  readonly activeMapNode: TNode | null;
}

export interface StageCountOptions {
  readonly mapDepth: number;
  readonly maxChapters: number;
}

export function isFinalStageCleared<TNode extends StageNodeLike>(room: StageClearRoomLike<TNode>): boolean {
  if (!room.stageMap || !room.activeMapNode) return false;
  return (room.activeMapNode.depth ?? 0) >= (room.stageMap.depth ?? 0);
}

export function getTotalStages(options: StageCountOptions): number {
  return options.mapDepth * options.maxChapters;
}

export function getClearedStageCount<TNode extends StageNodeLike>(
  room: StageClearRoomLike<TNode>,
  outcome: string,
  options: StageCountOptions,
): number {
  const totalStages = getTotalStages(options);
  if (outcome === "victory") return totalStages;
  const completedChapters = Math.max(0, Math.min(options.maxChapters, room.floor - 1)) * options.mapDepth;
  const currentDepth = Math.max(0, (room.activeMapNode?.depth || 1) - 1);
  return Math.min(totalStages, completedChapters + currentDepth);
}

export interface StageMapViewOptions<TNode extends StageNodeLike> {
  readonly mapNodeView?: (node: TNode) => Record<string, unknown>;
}

export interface StageMapView {
  readonly floor: number | undefined;
  readonly depth: number | undefined;
  readonly lanes: number | undefined;
  readonly edges: readonly unknown[] | undefined;
  readonly currentNodeId: string | null;
  readonly pathNodeIds: readonly string[];
  readonly availableNodeIds: readonly string[];
  readonly nodes: readonly unknown[];
}

export function getStageMapView<TNode extends StageNodeLike>(
  room: RoomWithStageMap<TNode>,
  options: StageMapViewOptions<TNode> = {},
): StageMapView | null {
  if (!room.stageMap) return null;
  const mapNodeView = options.mapNodeView ?? ((node: TNode): Record<string, unknown> => ({ ...node }) as Record<string, unknown>);
  const available = new Set(getAvailableMapNodes(room).map((node) => node.id));
  const mapPath = room.mapPath ?? [];
  return {
    floor: room.stageMap.floor,
    depth: room.stageMap.depth,
    lanes: room.stageMap.lanes,
    edges: room.stageMap.edges,
    currentNodeId: room.currentMapNodeId,
    pathNodeIds: [...mapPath],
    availableNodeIds: [...available],
    nodes: room.stageMap.nodes.map((node) => ({
      ...mapNodeView(node),
      current: node.id === room.currentMapNodeId,
      available: available.has(node.id),
      completed: mapPath.includes(node.id),
    })),
  };
}
